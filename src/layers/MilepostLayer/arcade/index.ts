import type { PopupTemplateContentCreatorFunction } from "@arcgis/core/popup/types";
import AccessControlArcade from "./Access Control.arcade?raw";
import CityArcade from "./City.arcade?raw";
import CountyArcade from "./County.arcade?raw";
import lastCoordinateArcade from "./Last Coordinate.arcade?raw";
import LocateMPUrlArcade from "./LocateMP URL.arcade?raw";
import MilepostLabelArcade from "./Milepost Label.arcade?raw";
import PopupTitle from "./Popup Title.arcade?raw";
import splitRouteIdFunction from "./parts/splitRouteId.function.arcade?raw";
import RegionArcade from "./Region.arcade?raw";
import routeSegmentLabelArcade from "./Route Segment Label.arcade?raw";
import SRViewURLArcade from "./SRView URL.arcade?raw";
import TownshipSectionArcade from "./Township Section.arcade?raw";

const [CustomContent, ExpressionInfo] = await $arcgis.import([
	"@arcgis/core/popup/content/CustomContent.js",
	"@arcgis/core/popup/ExpressionInfo.js",
] as const);

const SpatialReference = await $arcgis.import(
	"@arcgis/core/geometry/SpatialReference.js",
);
const { webMercatorToGeographic } = await $arcgis.import(
	"@arcgis/core/geometry/support/webMercatorUtils.js",
);

/**
 * Creates a list of links to external map web apps (e.g., Google Maps)
 * for the current location.
 * @param event - The graphic associated with the popup's current feature.
 * @returns - A calcite chip group with links to map web apps.
 */
const linkListCreator: PopupTemplateContentCreatorFunction = (event) => {
	const {graphic} = event;
	let { geometry } = graphic;
	if (!geometry) {
		throw new TypeError("Expected non-nullish geometry");
	}

	let lat: number;
	let lon: number;

	// Project geometry to WGS 1984 if necessary
	if (!geometry.spatialReference.equals(SpatialReference.WGS84)) {
		if (!geometry.spatialReference.equals(SpatialReference.WebMercator)) {
			throw new Error("Only WGS84 and Web Mercator are supported");
		}

		geometry = webMercatorToGeographic(geometry);
	}

	// Get the latitude (Y) and longitude (X) values.
	if (geometry.type === "point") {
		lon = geometry.x;
		lat = geometry.y;
	} else if (geometry.type === "polyline") {
		[lon, lat] = geometry.paths.slice(-1)[0].slice(-1)[0].slice(0, 1);
	} else {
		throw new TypeError("Only points and polylines are supported.");
	}

	// Construct label + URLs pairs.
	const urls = [
		[
			"Google Panoramic",
			`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`,
		],
		["Google Pin", `https://maps.google.com/maps?t=k&q=loc:${lat},${lon}`],
		["Bing Maps", `https://bing.com/maps/default.aspx?where=${lat},${lon}`],
		[
			"GeoHack",
			`https://geohack.toolforge.org/geohack.php?params=${lat};${lon}`,
		],
	] as const;

	const chipGroup = document.createElement("calcite-chip-group");
	chipGroup.scale = "s";
	chipGroup.label = "external mapping app links";

	for (const [linkText, linkUrl] of urls) {
		const chip = document.createElement("calcite-chip");
		chip.label = linkText;
		chip.value = linkUrl;
		const link = document.createElement("calcite-link");
		link.append(linkText);
		link.href = linkUrl;
		link.target = "blank";
		chip.append(link);
		chipGroup.append(chip);
	}

	return chipGroup;
};

export const locationLinksContent = new CustomContent({
	creator: linkListCreator,
});

export const routeSegmentLabelExpressionInfo = {
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
