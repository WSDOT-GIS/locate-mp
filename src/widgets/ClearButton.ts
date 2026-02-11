import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

/**
 * clear button creation options
 */
export interface ClearButtonOptions {
	/**
	 * The layer that will be controlled by the button
	 */
	layers: FeatureLayer[];
}

/**
 * Creates a button that will clear all graphics on the layer associated with it.
 * @param options - button creation options
 * @returns A button that will clear the specified graphics when cleared.
 */
export function createClearButton(options: ClearButtonOptions) {
	const button = document.querySelector<HTMLCalciteButtonElement>("clear-button");

	const { layers } = options;

	/**
	 * Clears all of the features from the layer.
	 * @param this - the clear button
	 */
	function clearFeatures(this: HTMLButtonElement): void {
		for (const layer of layers) {
			layer
				.queryFeatures()
				.then((features) =>
					layer.applyEdits({
						deleteFeatures: features.features,
					}),
				)
				.catch((reason: unknown) => {
					console.error(reason);
				});
		}
	}

	button?.addEventListener("click", clearFeatures);
	return button;
}
