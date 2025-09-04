import { highwaySignTextColor } from "../../../colors";
import { routeSegmentLabelExpressionInfo } from "../arcade";

const [ LabelClass, TextSymbol, Font ] = await $arcgis.import([
	"@arcgis/core/layers/support/LabelClass",
	"@arcgis/core/symbols/TextSymbol",
	"@arcgis/core/symbols/Font",
] as const)
/**
 * The default font for line segment labels.
 */
const font = new Font({
	family: "Arial",
	size: 12,
	style: "oblique",
	weight: "bold",
});

/**
 * The default text symbol for line segment labels.
 */
const textSymbol = new TextSymbol({
	color: highwaySignTextColor,
	verticalAlignment: "baseline",
	haloColor: "black",
	haloSize: 10,
	// // The background only shows up when zoomed out enough that the label overruns its polyline feature.
	// backgroundColor: highwaySignBackgroundColor,
	// borderLineColor: highwaySignTextColor,
	// borderLineSize: 1,
	font,
});

/**
 * Defines a LabelClass for line segments with specific labeling rules.
 *
 * - Filters features where 'EndSrmp' is not null.
 * - Uses a predefined label expression for route segments.
 * - Places labels above and along the line, with a curved position.
 * - Sets a minimum scale for label visibility.
 * - Allows labels to overrun their polyline feature.
 * - Disables label repetition along the line.
 * - Applies a custom text symbol for label styling.
 */
export const lineSegmentLabelClass = new LabelClass({
	where: "EndSrmp IS NOT NULL",
	labelExpressionInfo: routeSegmentLabelExpressionInfo,
	labelPlacement: "above-along",
	labelPosition: "curved",
	minScale: 144447.638572,
	allowOverrun: true,
	repeatLabel: false,
	symbol: textSymbol,
});
