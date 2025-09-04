import type Graphic from "@arcgis/core/Graphic";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

/**
 * Adds graphics to a given layer and returns the result of the edits along with the added features.
 * @param milepostLayer - The layer to which the graphics will be added
 * @param locationGraphics - The graphics to be added to the layer
 * @returns An array of the graphics that were added.
 */
export async function addGraphicsToLayer(
	milepostLayer: FeatureLayer,
	locationGraphics: Graphic[],
) {
	// Add graphics to the layer and await for the edit to complete.
	const editsResult = await milepostLayer.applyEdits(
		{
			addFeatures: locationGraphics,
		},
		{},
	);

	// Get the added features from the edits result by querying the milepost layer
	// for the features with matching object IDs.
	const query = milepostLayer.createQuery();
	query.objectIds = editsResult.addFeatureResults.map((r) => r.objectId).filter(oid => oid != null);
	const results = await milepostLayer.queryFeatures(query);

	return results.features;
}
