import type MapView from "@arcgis/core/views/MapView";

/**
 * Sets up the loading indicator for a map view.
 * @param view - map view
 * @returns - The handle for watching the view's updating property.
 */
export async function setupViewLoadingIndicator(view: MapView) {
	const viewProgress = document.querySelector<HTMLCalciteProgressElement>(
		"#map-update-progress",
	);

	if (viewProgress == null) {
		throw new Error("Could not find the map progress element.")
	}

	const { watch } = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");

	// Make the view loading indicator only show up when the map is updating.
	return watch(
		() => view.updating,
		(updating) => {
			viewProgress.hidden = !updating;
		},
	);
}
