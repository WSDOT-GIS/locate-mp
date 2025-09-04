const arcGisOnlineId = "569bb6050d634ff7a7f2462378ca974c";
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
 * @see {@link https://wsdot.maps.arcgis.com/home/item.html?id=569bb6050d634ff7a7f2462378ca974c}
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
