import type { LogInterceptor } from "@arcgis/core/core/types";
import type ExpressionInfo from "@arcgis/core/form/ExpressionInfo";
import type Graphic from "@arcgis/core/Graphic";
import type { Alert } from "@esri/calcite-components/components/calcite-alert";

const isParcelsMesage = (arg: unknown): arg is string =>
	typeof arg === "string" && /geo\.wa\.gov/i.test(arg) && /parcels/i.test(arg);

let waTechAlert: Alert | undefined;

const updateWaTechAlert = (
	...[_level, _module, ...args]: Parameters<LogInterceptor>
) => {
	let message: HTMLElement | null = null;
	if (!waTechAlert) {
		waTechAlert = document.createElement("calcite-alert");
		waTechAlert.scale = "s";
		waTechAlert.icon = true;
		waTechAlert.autoClose = true;

		waTechAlert.kind = "warning";

		const title = document.createElement("p");
		title.slot = "title";
		title.append("WA Tech Parcels layer");

		message = document.createElement("div");
		message.slot = "message";

		waTechAlert.append(title, message);

		const host = document.querySelector("arcgis-map") ?? document.body;

		host.append(waTechAlert);
	} else {
		message = waTechAlert.querySelector("[slot='message']");
		if (!message) {
			/* __PURE__ */ console.error("failed to locate alert's 'message' slot.");
			return false;
		}
	}

	message.append(
		...args.filter(isParcelsMesage).map((s) => {
			const p = document.createElement("p");
			p.append(s);
			return p;
		}),
	);

	waTechAlert.open = true;

	return waTechAlert;
};

const parcelsInterceptor: LogInterceptor = (
	level,
	module,
	...args: unknown[]
) => {
	for (const arg of args) {
		if (isParcelsMesage(arg)) {
			updateWaTechAlert(level, module, ...args);
			return true;
		}
	}

	return false;
};

export async function setupInterceptors() {
	const config = await $arcgis.import("@arcgis/core/config");

	config.applicationName = import.meta.env.VITE_TITLE;
	config.log.level = import.meta.env.DEV
		? "info"
		: import.meta.env.PROD
			? "none"
			: "warn";

	const arcadeLogInterceptor: LogInterceptor = (
		level,
		module,
		...args: unknown[]
	): boolean => {
		if (module === "esri.widgets.Feature.support.arcadeFeatureUtils") {
			const [errorType, errorInfo] = args as [
				string,
				Record<string, unknown> & {
					error: Error;
					expressionInfo: ExpressionInfo;
					graphic: Graphic;
				},
			];

			const { error, expressionInfo, graphic } = errorInfo;

			const { name: expressionName, expression } = expressionInfo;

			console.warn(errorType, {
				level,
				module,
				...errorInfo,
				error: error.message,
				errorName: error.name,
				expressionName,
				expression,
				graphic: graphic.toJSON(),
			});
			return true;
		}

		/* __PURE__ */ console.debug("intercepted log", {
			level,
			module,
			args,
		});

		return false;
	};
	config.log.interceptors.push(parcelsInterceptor, arcadeLogInterceptor);
}
