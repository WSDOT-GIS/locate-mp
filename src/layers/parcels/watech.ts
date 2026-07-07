const arcGisOnlineId = "2b603a599a0842a3b2284c04c8927f35";
const parcelIdField = "PARCEL_ID_NR";

const [FeatureLayer, PortalItem, LabelClass] = await $arcgis.import([
	"@arcgis/core/layers/FeatureLayer",
	"@arcgis/core/portal/PortalItem",
	"@arcgis/core/layers/support/LabelClass",
] as const);

const [
	{ labelSymbol },
	{ renderer },
] = await Promise.all([
	import("./label"),
	import("./renderer"),
]);

/**
 * Parcels layer
 * @see {@link https://geo.wa.gov/maps/2b603a599a0842a3b2284c04c8927f35}
 */
export const parcelsLayer = new FeatureLayer({
	id: "parcels",
	title: "Parcels From geo.wa.gov",
	minScale: 9027.977411,
	labelsVisible: true,
	labelingInfo: [
		new LabelClass({
			labelExpressionInfo: {
				expression: `$feature.${parcelIdField}`,
				title: "Parcel ID",
			},
			minScale: 1128.497176,
			symbol: labelSymbol,
			useCodedValues: true,
		}),
	],
	displayField: parcelIdField,
	// TODO: Specify fields to include instead of returning all of them. Probably only need PARCEL_ID_NR.
	outFields: ["*"],
	// visible: false,
	portalItem: new PortalItem({
		id: arcGisOnlineId,
	}),
	popupEnabled: false,
	renderer,
});
