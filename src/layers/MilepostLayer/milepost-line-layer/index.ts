import { objectIdFieldName } from "../../../elc/types";
import waExtent from "../../../WAExtent";
import { createPopupTemplate } from "..";
import { routeSegmentLabelExpressionInfo } from "../arcade";
import { segmentFields as fields } from "../fields";
import { lineSegmentLabelClass } from "./label";
import MilepostOffsetLineRenderer from "./MilepostOffsetLineRenderer";

const [FeatureLayer, ExpressionInfo] = await $arcgis.import([
	"@arcgis/core/layers/FeatureLayer",
	"@arcgis/core/popup/ExpressionInfo",
] as const);

/**
 * Creates a new feature layer that displays mileposts as lines.
 * @param spatialReference - The spatial reference of the layer.
 * @returns A new feature layer that displays mileposts as lines.
 */
export function createMilepostLineLayer(
	spatialReference = waExtent.spatialReference,
) {
	// Make a clone of the milepost point layer, as most of the properties
	// will be the same aside from the geometry type and renderer.
	const lineLayerProperties: __esri.FeatureLayerProperties = {
		geometryType: "polyline",
		title: "Near Mileposts",
		fields,
		objectIdField: objectIdFieldName,
		id: "nearMileposts",
		listMode: "hide",
		fullExtent: waExtent,
		spatialReference,
		// Since there are no features at the beginning,
		// need to add an empty array as the source.
		renderer: MilepostOffsetLineRenderer,
		source: [],
		popupEnabled: true,
		hasM: true,
		labelingInfo: [lineSegmentLabelClass],
	};

	const lineLayer = new FeatureLayer(lineLayerProperties);
	const popupTemplate = createPopupTemplate(lineLayer);

	popupTemplate.expressionInfos?.push(
		new ExpressionInfo({
			name: "routeSegmentLabel",
			...routeSegmentLabelExpressionInfo,
		}),
	);
	popupTemplate.title = "{expression/popupTitle}";
	lineLayer.popupTemplate = popupTemplate;

	return lineLayer;
}
