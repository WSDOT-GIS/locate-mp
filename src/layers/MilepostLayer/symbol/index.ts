import { milepostLabelPrimitiveOverride } from "./primitiveOverrides";

const CIMSymbol = await $arcgis.import("@arcgis/core/symbols/CIMSymbol");

const cimCallout: __esri.CIMBackgroundCallout = {
	type: "CIMBackgroundCallout",
	backgroundSymbol: {
		type: "CIMPolygonSymbol",
		symbolLayers: [
			{
				type: "CIMSolidFill",
				color: [1, 115, 92, 255],
				enable: true,
			},
			{
				type: "CIMSolidStroke",
				color: [255, 255, 255, 255],
				width: 1,
				enable: true,
			},
		],
	},
};
const cimTextSymbol: __esri.CIMTextSymbol = {
	type: "CIMTextSymbol",
	angle: 0,
	fontFamilyName: "Noto Sans",
	height: 9,
	horizontalAlignment: "Center",
	offsetX: 0,
	offsetY: 0,
	strikethrough: false,
	underline: false,
	symbol: {
		type: "CIMPolygonSymbol",
		symbolLayers: [
			{
				type: "CIMSolidFill",
				enable: true,
				color: [255, 255, 255, 255],
			},
		],
	},
	haloSymbol: {
		type: "CIMPolygonSymbol",
		symbolLayers: [{ type: "CIMSolidFill", enable: true, color: [0, 0, 0, 0] }],
	},
	verticalAlignment: "Baseline",
	callout: cimCallout,
};
const cimMarkerGraphic: __esri.CIMMarkerGraphic = {
	type: "CIMMarkerGraphic",
	geometry: { x: 0, y: 0 },
	primitiveName: "milepostLabel",
	symbol: cimTextSymbol,
	textString: " ",
};

const segmentEndpointCimMarkerGraphic: __esri.CIMMarkerGraphic = {
	...cimMarkerGraphic,
	primitiveName: "endMilepostLabel",
	textString: " ",
};

export const cimVectorMarker: __esri.CIMVectorMarker = {
	type: "CIMVectorMarker",
	enable: true,
	anchorPointUnits: "Relative",
	size: 10,
	frame: { xmin: -5, ymin: -5, xmax: 5, ymax: 5 },
	markerGraphics: [cimMarkerGraphic],
	scaleSymbolsProportionally: true,
	respectFrame: true,
};

export const segmentStartpointCimVectorMarker: __esri.CIMVectorMarker = {
	...cimVectorMarker,
	markerGraphics: [cimMarkerGraphic],
	markerPlacement: {
		type: "CIMMarkerPlacementAtExtremities",
		extremityPlacement: "JustBegin",
	},
};

export const segmentEndpointCimVectorMarker: __esri.CIMVectorMarker = {
	...cimVectorMarker,
	markerGraphics: [segmentEndpointCimMarkerGraphic],
	markerPlacement: {
		type: "CIMMarkerPlacementAtExtremities",
		extremityPlacement: "JustEnd",
	},
};

const cimPointSymbol: __esri.CIMPointSymbol = {
	type: "CIMPointSymbol",
	symbolLayers: [cimVectorMarker],
	scaleX: 1,
	angleAlignment: "Display",
};

export const milepostSymbol = new CIMSymbol({
	data: {
		primitiveOverrides: [milepostLabelPrimitiveOverride],
		type: "CIMSymbolReference",
		symbol: cimPointSymbol,
	},
});
