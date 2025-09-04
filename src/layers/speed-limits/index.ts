import data from "./data.json";

const [LabelClass, ClassBreaksRenderer] = await $arcgis.import([
	"@arcgis/core/layers/support/LabelClass",
	"@arcgis/core/renderers/ClassBreaksRenderer",
] as const);

const layerData = data.layers[0];

const renderer = ClassBreaksRenderer.fromJSON(
	layerData.layerDefinition.drawingInfo.renderer,
);

const { default: FeatureLayer } = await import(
	"@arcgis/core/layers/FeatureLayer"
);

const itemId = "7bd8c700fa8b47d08a57c49b77b34ad5";

export const speedLimitsLayer = new FeatureLayer({
	portalItem: {
		id: itemId,
	},
	renderer,
	labelingInfo: layerData.layerDefinition.drawingInfo.labelingInfo.map((i) =>
		LabelClass.fromJSON(i),
	),
	visible: false,
});

speedLimitsLayer.on("layerview-create-error", (event) => {
	console.error(event.error);
});

export default speedLimitsLayer;
