import { RouteDescription } from "wsdot-route-utils";

const {watch} = await $arcgis.import("@arcgis/core/core/reactiveUtils");

type RouteLocationAttributes = Record<
	string,
	string | number | null | undefined
> & {
	Back: string;
	Route: string;
	Srmp: number;
	Direction: string;
	EndSrmp?: number;
	EndBack?: string;
};

/**
 * Updates the URL search parameters with the given route location.
 * @param routeLocation - The route location to update the URL with.
 * @returns - The updated URL.
 */
export function updateUrlSearchParams(routeLocation: RouteLocationAttributes) {
	/* __PURE__ */ console.group(updateUrlSearchParams.name, { routeLocation });
	try {
		const srmp = `${routeLocation.Srmp}${routeLocation.Back}`;
		const { sr, rrt, rrq } = new RouteDescription(routeLocation.Route);
		const direction = routeLocation.Direction;
		const endMp =
			routeLocation.EndSrmp != null
				? `${routeLocation.EndSrmp}${routeLocation.EndBack}`
				: undefined;

		/* __PURE__ */ console.debug({ sr, rrt, rrq, srmp, direction, endMp });

		const currentUrl = new URL(window.location.href);

		/**
		 * Map of the search params and their values.
		 */
		const argsMap = new Map([
			["SR", sr],
			["RRT", rrt],
			["RRQ", rrq],
			["MP", srmp],
			["DIR", direction],
			["EMP", endMp],
		] as const);

		/* __PURE__ */ console.debug("Argument map", argsMap);

		// Update the URL search parameters.
		for (const [key, value] of argsMap) {
			if (value) {
				currentUrl.searchParams.set(key, value);
			} else {
				currentUrl.searchParams.delete(key);
			}
		}

		/* __PURE__ */ console.debug("Updated URL", currentUrl);

		// Update the browser's URL.
		window.history.replaceState(null, "", currentUrl.toString());

		return currentUrl;
	} finally {
	}
}

const urlSearchRe = /(?<key>[^?=&]+)(?:=(?<value>[^&]*))?/g;

/**
 * Extracts the search parameters from the given string.
 * @param hash - The URL hash to extract the search parameters from.
 * @returns - The extracted search parameters.
 */
export function extractUrlSearchParams(hash: string): URLSearchParams {
	const params = new URLSearchParams();
	urlSearchRe.lastIndex = 0;
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: Use of "=" rather than "==" or "===" is intentional.
	while ((match = urlSearchRe.exec(hash))) {
		const { groups } = match;
		const key = groups?.key;
		const value = groups?.value;
		if (key && value) {
			params.set(key, value);
		}
	}
	return params;
}

/**
 * Moves the URL search parameters to the URL hash.
 * @param url - The URL to move the search parameters to.
 * @returns - The updated URL.
 */
export function moveUrlSearchToHash(url: URL | string) {
	const urlObject = new URL(url);

	if (urlObject.searchParams.size) {
		urlObject.hash += urlObject.search;
		urlObject.search = "";
	}
	return urlObject;
}

/**
 * Updates the URL search params when the popup opens to match
 * the selected feature.
 * @param view - The map view.
 */
export function setupMPUrlParamsUpdate(
	view: __esri.MapView,
) {
	function updateUrl(visible: boolean): void {
		// If the popup is not visible, remove the search params from the URL.
		if (!visible || !view.popup?.selectedFeature) {
			const noSearchUrl = window.location.search
				? window.location.href.replace(window.location.search, "")
				: window.location.href;
			history.replaceState(null, "", noSearchUrl);
			return;
		}

		// If the popup is visible, update the search params in the URL.
		const feature = view.popup.selectedFeature;
		try {
			const url = updateUrlSearchParams(
				feature.attributes as RouteLocationAttributes,
			);
			history.replaceState(null, "", url.toString());
		} catch (error) {
			console.error("Failed to update URL search params.", {
				error,
				feature,
			});
		}
	}
	watch(() => !!view.popup?.visible, updateUrl);
}
