import type FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import type { CalciteDialogCustomEvent } from "@esri/calcite-components";

/**
 * Generator function that yields a list of {@link HTMLLIElement} elements for each
 * provided layer. Each element contains a link element with a download attribute set
 * to a filename that includes the layer's title and the current date and time.
 * The link element also has its `href` attribute set to a blob URL of the GeoJSON
 * representation of the FeatureSet.
 *
 * @param layers - An iterable of FeatureLayers to query for features.
 * @yields A promise that resolves to an {@link HTMLLIElement} element for each layer.
 */
function* queryLayers(layers: Iterable<FeatureLayer>) {
	/**
	 * Execute a query on the provided layer and generate a list of links that
	 * download the results in GeoJSON and JSON formats.
	 *
	 * @param layer - The layer to query.
	 * @param listItem - An {@link HTMLLIElement} element that will be populated with the links.
	 */
	async function executeQuery(layer: FeatureLayer, listItem: HTMLLIElement) {
		const SpatialReference = await $arcgis.import(
			"@arcgis/core/geometry/SpatialReference"
		);
		const { arcgisToGeoJSON } = await import("@terraformer/arcgis");

		const query = layer.createQuery();
		// GeoJSON spec requires WGS84.
		query.outSpatialReference = SpatialReference.WGS84;
		const featureSet = await layer.queryFeatures(query);

		if (featureSet.features.length === 0) {
			listItem.remove();
			return;
		}

		const progress = listItem.querySelector("progress");
		progress?.remove();

		const linkList = document.createElement("ul");
		for (const linkType of ["GeoJSON", "JSON"] as const) {
			const link = createLink(linkType);
			const linkListItem = document.createElement("li");
			linkListItem.append(link);
			linkList.append(linkListItem);
		}
		listItem.append(linkList);

		function createLink(fileType: "GeoJSON" | "JSON") {
			const link = document.createElement("a");
			const now = new Date().toISOString().replace(/[/:]/g, "-");
			const filename = `${layer.title}_${now}.${fileType.toLocaleLowerCase()}`;
			link.append(fileType);
			link.download = filename;
			let blob: Blob;
			const json = featureSet.toJSON();
			if (fileType === "GeoJSON") {
				const geojson = arcgisToGeoJSON(json);
				blob = new Blob([JSON.stringify(geojson)], {
					type: "application/geo+json",
				});
			} else {
				blob = new Blob([JSON.stringify(json)], {
					type: "application/json",
				});
			}
			link.href = URL.createObjectURL(blob);
			return link;
		}
	}
	/**
	 * Creates a single list item element containing a link element with a download
	 * attribute set to a filename that includes the layer's title and the current
	 * date and time. The link element also has its `href` attribute set to a blob URL
	 * of the GeoJSON representation of the FeatureSet.
	 *
	 * @param featureSet The FeatureSet of features returned by the query.
	 * @param layer The FeatureLayer that the query results are for.
	 * @returns A promise that resolves to the created list item element.
	 */
	function createLinkListItem(layer: FeatureLayer) {
		// Create the list item.
		const listItem = document.createElement("li");

		// Add its text: the layer title.
		// "title" could possibly be nullish; in that case, use the layer id.
		const title = layer.title ?? layer.id;
		listItem.append(title);

		// Create a progress meter and append it.
		const progress = document.createElement("progress");
		progress.textContent = `Generating GeoJSON for ${title}...`;
		listItem.append(progress);

		// The list item will show a progress meter until the promise is resolved.
		// after which the progress meter will be replaced with the link.

		// Execute the query to get all features from the layer.
		executeQuery(layer, listItem).catch((reason: unknown) => {
			console.error(`Failed to generate GeoJSON for ${layer.title}`, reason);
		});

		return listItem;
	}
	for (const layer of layers) {
		yield createLinkListItem(layer);
	}
}

/**
 * Creates a dialog element for exporting features from the provided layers.
 * The dialog contains a list of links for downloading GeoJSON representations
 * of the features from each layer that has query results.
 *
 * @param layers - An iterable of FeatureLayers to query for features.
 * @returns The created calcite-dialog element.
 */
export function createExportDialog(layers: Iterable<FeatureLayer>) {
	const dialog = document.createElement("calcite-dialog");
	dialog.heading = "Export features";
	dialog.id = "exportDialog";
	dialog.modal = true;

	const dialogOpenHandler = (ev: CalciteDialogCustomEvent<void>) => {
		const ul = document.createElement("ul");
		ev.target.append(ul);
		ul.append(...queryLayers(layers));
	};
	dialog.addEventListener("calciteDialogOpen", dialogOpenHandler);

	dialog.addEventListener(
		"calciteDialogClose",
		(ev) => {
			ev.target.remove();
		},
		{
			once: true,
		},
	);

	return dialog;
}
