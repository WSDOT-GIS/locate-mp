// https://wadnr.maps.arcgis.com/home/item.html?id=ae861d2304da4d099e0f7841fcbfa860

const [FeatureLayer, PortalItem] = await $arcgis.import([
	"@arcgis/core/layers/FeatureLayer",
	"@arcgis/core/portal/PortalItem",
] as const);

const displayField = "LEGAL_DESC_NM";

// T19-0N R2-0E S11
export type Label = `T${number}-${number}N R${number}-${number}E S${number}`;

/**
 * Creates a land survey layer using the specified portal item.
 * Source {@link https://wadnr.maps.arcgis.com/home/item.html?id=ae861d2304da4d099e0f7841fcbfa860|ArcGIS Online Item}
 * @returns The created land survey layer.
 */
export function createLandSurveyLayer() {
	const portalItem = new PortalItem({
		id: "ae861d2304da4d099e0f7841fcbfa860",
		portal: {
			url: "https://wadnr.maps.arcgis.com",
			authMode: "anonymous",
		},
	});

	return new FeatureLayer({
		portalItem,
		outFields: [displayField],
	});
}
