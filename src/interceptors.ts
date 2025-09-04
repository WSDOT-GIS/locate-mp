export async function setupInterceptors() {
	try {
		const config = await $arcgis.import("@arcgis/core/config");

		config.applicationName = import.meta.env.VITE_TITLE;
		config.log.level = import.meta.env.DEV
			? "info"
			: import.meta.env.PROD
				? "none"
				: "warn";

		if (!config.log.interceptors) {
			config.log.interceptors = [];
		}

		config.log.interceptors.push((level, module, ...args): boolean => {
			const logFunction =
				level === "error"
					? console.error
					: level === "warn"
						? console.warn
						: console.log;

			/* __PURE__ */ logFunction("intercepted log", {
				level,
				module,
				args,
			});

			if (
				level === "error" &&
				module === "esri.widgets.Feature.support.arcadeFeatureUtils"
			) {
				console.group(module);
				const [errorType, errorInfo] = args as [
					string,
					Record<string, unknown> & {
						error: Error;
						expressionInfo: __esri.ExpressionInfo;
						graphic: __esri.Graphic;
					},
				];

				const { error, expressionInfo, graphic } = errorInfo;

				const { name: expressionName, expression } = expressionInfo;

				console.error(errorType, {
					...errorInfo,
					error: error.message,
					errorName: error.name,
					expressionName,
					expression,
					graphic: graphic.toJSON(),
				});
				console.log(expression);
				console.groupEnd();
				return true;
			}

			return false;
		});
	} catch (reason: unknown) {
		console.error("Failed to setup app config", reason);
	}
}
