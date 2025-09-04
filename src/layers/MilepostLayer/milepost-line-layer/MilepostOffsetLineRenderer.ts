import { highwaySignBackgroundColor } from "../../../colors";
import { isCimVectorMarker } from "../create-cim";
import { cimVectorMarker } from "../symbol";
import { milepostLabelPrimitiveOverride } from "../symbol/primitiveOverrides";

const [
	UniqueValueRenderer,
	SimpleLineSymbol,
	CIMSymbol,
	SimpleMarkerSymbol,
	{ convertToCIMSymbol },
] = await $arcgis.import([
	"@arcgis/core/renderers/UniqueValueRenderer",
	"@arcgis/core/symbols/SimpleLineSymbol",
	"@arcgis/core/symbols/CIMSymbol",
	"@arcgis/core/symbols/SimpleMarkerSymbol",
	"@arcgis/core/symbols/support/cimConversionUtils",
] as const);

function createClickPointSymbolLayer() {
	const clickPointSymbol = new SimpleMarkerSymbol({
		style: "circle",
		color: [255, 100, 100, 255],
		outline: {
			color: "white",
			width: 1,
		},
	});

	const clickPointCimSymbol = convertToCIMSymbol(clickPointSymbol);

	const clickPointSymbolLayer =
		clickPointCimSymbol.data.symbol?.symbolLayers?.filter(isCimVectorMarker)[0];

	if (!clickPointSymbolLayer) {
		throw new Error("clickPointSymbolLayer not found");
	}
	return clickPointSymbolLayer;
}

const clickPointSymbolLayer = createClickPointSymbolLayer();

const strokeSymbolLayer: __esri.CIMSolidStroke = {
	type: "CIMSolidStroke",
	effects: [
		{
			type: "CIMGeometricEffectDashes",
			dashTemplate: [5, 3],
			lineDashEnding: "NoConstraint",
			offsetAlongLine: 0,
		},
	],
	enable: true,
	colorLocked: true,
	capStyle: "Butt",
	joinStyle: "Round",
	miterLimit: 4,
	width: 2,
	color: [255, 100, 100, 255],
};
const cimOffsetAndMilepostLineSymbol: __esri.CIMLineSymbol = {
	type: "CIMLineSymbol",
	symbolLayers: [
		{
			...cimVectorMarker,
			markerPlacement: {
				type: "CIMMarkerPlacementAtExtremities",
				extremityPlacement: "JustEnd",
				angleToLine: false,
			},
		},
		clickPointSymbolLayer,
		strokeSymbolLayer,
	],
};

const offsetAndMilepostCimSymbol = new CIMSymbol({
	data: {
		primitiveOverrides: [milepostLabelPrimitiveOverride],
		type: "CIMSymbolReference",
		symbol: cimOffsetAndMilepostLineSymbol,
	},
});

const lineSegmentSymbol = new SimpleLineSymbol({
	color: highwaySignBackgroundColor,
	width: 3,
	marker: {
		placement: "begin-end",
		style: "circle",
		color: highwaySignBackgroundColor,
	},
});

const arcadeHasEndSrmp = "IIf($feature.EndSrmp != null, '1', '0')";
/**
 * Simple Renderer using a CIM symbol.
 */
export default new UniqueValueRenderer({
	defaultSymbol: offsetAndMilepostCimSymbol,
	defaultLabel: "Clicked Milepost",
	valueExpression: arcadeHasEndSrmp,
	valueExpressionTitle: "Has an End Milepost",
	uniqueValueInfos: [
		{
			label: "Route Segment",
			symbol: lineSegmentSymbol,
			value: "1",
		},
	],
});
