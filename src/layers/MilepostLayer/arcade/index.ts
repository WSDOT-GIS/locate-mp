import AccessControlArcade from "./Access Control.arcade?raw";
import CityArcade from "./City.arcade?raw";
import CountyArcade from "./County.arcade?raw";
import lastCoordinateArcade from "./Last Coordinate.arcade?raw";
import LocateMPUrlArcade from "./LocateMP URL.arcade?raw";
import LocationLinksArcade from "./Location Links.arcade?raw";
import MilepostLabelArcade from "./Milepost Label.arcade?raw";
import PopupTitle from "./Popup Title.arcade?raw";
import splitRouteIdFunction from "./parts/splitRouteId.function.arcade?raw";
import RegionArcade from "./Region.arcade?raw";
import routeSegmentLabelArcade from "./Route Segment Label.arcade?raw";
import SRViewURLArcade from "./SRView URL.arcade?raw";
import TownshipSectionArcade from "./Township Section.arcade?raw";

const [ExpressionInfo, ExpressionContent] = await $arcgis.import([
	"@arcgis/core/popup/ExpressionInfo",
	"@arcgis/core/popup/content/ExpressionContent",
] as const);

export const locationLinksContent = new ExpressionContent({
	expressionInfo: {
		expression: [splitRouteIdFunction, LocationLinksArcade].join("\n"),
		title: "Location Links",
	},
});

export const routeSegmentLabelExpressionInfo =
	{
		title: "Route Segment Label",
		expression: routeSegmentLabelArcade,
	} as const;

function replaceVariableValueInArcadeExpression(
	arcade: string,
	variable: string,
	value: string,
) {
	const pattern = String.raw`(?<=var\s+${variable}\s*=\s*).+(?=;)`;
	const regExp = new RegExp(pattern, "g");
	return arcade.replace(regExp, value);
}

const urlBase = window.location.href.split("?")[0];

const expressionInfoProperties = [
	{
		name: "accessControl",
		title: "Access Control",
		expression: AccessControlArcade,
		returnType: "string",
	},
	{
		name: "townshipSection",
		title: "Township Section",
		expression: TownshipSectionArcade,
		returnType: "string",
	},
	{
		name: "city",
		title: "City",
		expression: CityArcade,
		returnType: "string",
	},
	{
		name: "county",
		title: "County",
		expression: CountyArcade,
		returnType: "string",
	},

	{
		name: "milepostLabel",
		title: "Milepost Label",
		expression: [splitRouteIdFunction, MilepostLabelArcade].join("\n"),
		returnType: "string",
	},
	{
		name: "region",
		title: "WSDOT Region",
		expression: [splitRouteIdFunction, RegionArcade].join("\n"),
		returnType: "string",
	},
	{
		name: "srViewURL",
		title: "SRView URL",
		expression: [splitRouteIdFunction, SRViewURLArcade].join("\n"),
		returnType: "string",
	},
	{
		name: "webMercatorToWgs1984",
		title: "GPS Coordinates",
		expression: lastCoordinateArcade,
		returnType: "string",
	},
	{
		name: "locateMPUrl",
		title: "LocateMP URL",
		expression: [
			splitRouteIdFunction,
			replaceVariableValueInArcadeExpression(
				LocateMPUrlArcade,
				"urlBase",
				`"${urlBase}"`,
			),
		].join("\n"),
		returnType: "string",
	},
	{
		name: "popupTitle",
		title: "Popup Title",
		expression: PopupTitle,
		returnType: "string",
	},
] as const; // When editing, temporarily set type to __esri.ExpressionInfoProperties[]

export type expressionNames = (typeof expressionInfoProperties)[number]["name"];

/**
 * Makes all properties in T writable.
 */
type Writable<T> = {
	-readonly [K in keyof T]: T[K];
};

/**
 * This type definition is a subset of {@link ExpressionInfo}.
 */
export type MilepostExpressionInfo = InstanceType<typeof ExpressionInfo> &
	Writable<(typeof expressionInfoProperties)[number]>;

/**
 * Expression infos for the milepost layer.
 */
export const expressions = expressionInfoProperties.map(
	(info) => new ExpressionInfo(info) as MilepostExpressionInfo,
);

/**
 * An array of label expressions.
 */
export const routeSegmentExpressions = [
	{ name: "routeSegmentLabel", ...routeSegmentLabelExpressionInfo },
	...expressions,
];

if (!import.meta.env.DEV) {
	/**
	 * Removes the SR View URL expression.
	 */
	const removeSrView = () => {
		const x = expressions.find((expression) => expression.name === "srViewURL");
		if (x) {
			expressions.splice(expressions.indexOf(x), 1);
		}
	};
	const { canAccessIntranet } = await import("../../../urls/isIntranet");
	// Remove the SR View URL expression if we are not on the intranet.
	if (!canAccessIntranet()) {
		removeSrView();
	}
}

export default expressions;
