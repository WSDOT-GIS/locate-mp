import type MapView from "@arcgis/core/views/MapView";

/**
 * Sets up the loading indicator for a map view.
 * @param view - map view
 * @returns - The handle for watching the view's updating property.
 */
export async function setupViewLoadingIndicator(view: MapView) {
	const viewProgress = document.createElement("progress");
	viewProgress.textContent = "Updating map...";
	// Add the map loading indicator.
	view.ui.add(viewProgress, "bottom-trailing");

	const { watch } = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");

	// Make the view loading indicator only show up when the map is updating.
	return watch(
		() => view.updating,
		(updating) => {
			viewProgress.hidden = !updating;
		},
	);
}
