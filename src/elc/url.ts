/*
From SnagMP docs
https://snagmp.com/gist.html

## Creating Map Links
Creating a hyperlink to a State Route location is simple. Mimic the url
structure for the following link and modify the SR and MP values to your
desired location. Example:
www.snagmp.com/link.php?SR=542&MP=57.17

To create a hyperlink to a route with unique directional milepost data,
such as an interstate, use the following url structure.
DIR represents direction.
The options are I for increasing milepost or D for decreasing milepost.
www.snagmp.com/link2.php?SR=5&MP=257.70&DIR=I

To create a hyperlink to a route with a specific route type, such as a "SPUR", 
use the following url structure. RT represents Route Type. 
The options are SP for Spur, CO for Couplet and AR for Alternate.
www.snagmp.com/link3.php?SR=503&MP=35.23&RT=SP
*/
import { findRouteLocations } from ".";
import { addGraphicsToLayer } from "../addGraphicsToLayer";
import FormatError from "../common/FormatError";
import { padRoute } from "../utils";
import { routeLocationToGraphic } from "./arcgis";
import { ElcError } from "./errors";
import type {
	FindNearestRouteLocationParameters,
	FindRouteLocationParameters,
	RouteGeometry,
	ValidRouteLocationForMPInput,
} from "./types";

type UrlParamMapKey = "sr" | "rrt" | "rrq" | "dir" | "mp" | "endMP";

/**
 * Regular expression patterns to validate URL parameters.
 */
const keyRegExps = new Map([
	["sr", /^(?:(?:SR)|(?:route))/i],
	["rrt", /^R{1,2}T/i],
	["rrq", /^R{1,2}Q/i],
	["dir", /^D(?:IR)?/i],
	["mp", /^(?:SR)?MP/i],
	["endMP", /^E(ND)?(SR)?MP/i],
] as const);

const milepostAndBackIndicatorRegex = /^(?<mp>\d+(?:\.\d+)?)(?<back>B)?$/i;
/**
 * Regular expression patterns to validate URL parameter values.
 */
const valueRegExps = new Map([
	["sr", /^\d{1,3}$/],
	["rrt", /^[A-Z0-9]{0,2}$/i],
	["rrq", /^[A-Z0-9]{0,6}$/i],
	["dir", /^[ID]/i],
	/**
	 * Regular expression pattern to validate and extract milepost information from a string.
	 * It expects a numeric value that can be an integer or a decimal, and an optional 'B' character
	 * indicating back mileage if present.
	 *
	 * The match will have the following groups:
	 * - `mp` - The numeric value of the milepost
	 * - `back` - The 'B' character if present
	 * @example
	 * // matches "123", "123.45", "123B", "123.45B"
	 */
	["mp", milepostAndBackIndicatorRegex],
	["endMP", milepostAndBackIndicatorRegex],
] as const);

type KeyValueRegExpTuple = [keyRegexp: RegExp, valueRegexp: RegExp];

const regExpMap = new Map<UrlParamMapKey, KeyValueRegExpTuple>(
	[...keyRegExps.entries()].map(([key, value]) => [
		key,
		[
			value,
			// biome-ignore lint/style/noNonNullAssertion: We know it's not null.
			valueRegExps.get(key)!,
		],
	]),
);

/**
 * Retrieves a value from the URL search parameters based on the provided key.
 * @param urlParams - The URL search parameters.
 * @param key - The key to search for.
 * @returns The value associated with the key.
 * @throws {ReferenceError} If the key is not found.
 */
export function getUrlSearchParameter(
	urlParams: URLSearchParams,
	key: UrlParamMapKey,
) {
	let output: string | null = null;

	// Retrieve the regular expression tuple from the regExpMap based on the key.
	const reTuple = regExpMap.get(key);
	if (!reTuple) {
		const keyList = [...regExpMap.keys()].map((k) => `"${k}"`).join(", ");
		const valueReList = [...regExpMap.values()]
			.map(([k]) => k.source)
			.join(", ");
		// If the key is not found, throw a ReferenceError with the key.
		throw new ReferenceError(
			`Invalid URL parameter key: ${key}. Valid values are ${keyList}. Alternative values are ${valueReList}.`,
		);
	}

	const [keyRe, valueRe] = reTuple;

	// Iterate over each key-value pair in the URL search parameters.
	for (const [k, v] of urlParams.entries()) {
		// If the key does not match the regular expression, continue to the next iteration.
		if (!keyRe.test(k)) {
			continue;
		}

		// Execute the value regular expression on the value.
		const valueMatch = valueRe.exec(v);

		// If there is a match, assign the value to the output variable and break the loop.
		if (valueMatch) {
			output = valueMatch[0];
			break;
		}
		// Throw error if there is no match.
		throw new FormatError(
			v,
			valueRe,
			`Invalid URL parameter value for key: ${k}: ${v}.\nValue needs to match ${valueRe}.`,
		);
	}

	// Return the output value.
	return output;
}

/**
 * Generates an enumerated list of URL parameters based on the input parameters object.
 * @param parameters - the input parameters object
 * @yields - Tuples of property name and value names that can be used to set URL parameters.
 * @see {@link populateUrlParameters} for example usage.
 */
export function* enumerateUrlParameters(
	parameters: FindNearestRouteLocationParameters | FindRouteLocationParameters,
): Generator<[key: string, value: string], void> {
	yield ["f", "json"];
	for (const [key, value] of Object.entries(parameters)) {
		if (typeof value === "string") {
			yield [key, value];
			continue;
		}
		if (value == null) {
			continue;
		}
		let outValue: string;
		if (value instanceof Date) {
			// Convert date to string format described here:
			// https://tools.ietf.org/html/rfc3339#section-5.6
			outValue = value.toISOString().replace(/T.+$/, "");
		} else if (Array.isArray(value)) {
			outValue = JSON.stringify(value);
		} else {
			outValue = `${value}`;
		}
		yield [key, outValue];
	}
}

/**
 * Populates the URL parameters with the given parameters using the request URL.
 * @param parameters - The parameters to populate the URL with.
 * @param requestUrl - The URL to populate with the parameters.
 * @returns - {@link requestUrl}, now with the URL parameters populated.
 */
export function populateUrlParameters(
	parameters: FindNearestRouteLocationParameters | FindRouteLocationParameters,
	requestUrl: URL,
) {
	for (const [key, value] of enumerateUrlParameters(parameters)) {
		requestUrl.searchParams.set(key, value);
	}
	return requestUrl;
}

/**
 * Parses a string representing a milepost and an optional
 * back indicator from a string.
 *
 * The string is expected to be in the form "XXX.YYY[B]", where "XXX.YYY" is
 * the milepost, and "[B]" is an optional indicator that the milepost is on
 * the back side of the route. "XXX.YYY" is parsed using a regular expression
 * that is specified in the valueRegExps mapping under the key "mp".
 *
 * The regular expression is expected to have a named capture group
 * "mp" that captures the milepost value as a string. If there is
 * an optional named capture group "back" that is present and has
 * a value of "B", then the back indicator is set to true.
 *
 * If the input string does not match the regular expression, or
 * if the named capture groups are not present or are not in the
 * expected format, a {@link FormatError} is thrown.
 * @param mp - The string to parse
 * @returns - The parsed milepost and back indicator
 */
function parseSrmp(mp: string): { srmp: number; back: boolean } {
	// Retrieve the regular expression from the valueRegExps mapping
	const mpValueRegexp = valueRegExps.get("mp");

	// Throw an error if the regular expression is not present in the mapping
	if (!mpValueRegexp) {
		throw new TypeError(
			`No regular expression found for key 'mp' in valueRegExps`,
		);
	}

	// Attempt to match the input string against the regular expression
	const match = mpValueRegexp.exec(mp);

	// Throw a FormatError if the string does not match the regular expression
	if (!(match && match.length >= 2 && match.groups)) {
		throw new FormatError(
			mp,
			mpValueRegexp,
			"The URL does not have valid milepost information.",
		);
	}

	// Parse the milepost value from the named capture group "mp"
	const srmp = Number.parseFloat(match.groups.mp);

	// If there is a named capture group "back" with a value of "B", set the
	// back indicator to true. Otherwise, set it to false.
	const back = /B/i.test(match.groups.back);

	// Return the milepost and back indicator
	return { srmp, back };
}

/**
 * Retrieves and processes route and milepost information from the URL.
 * @param url - The {@link URL} or {@link URLSearchParams} to process.
 * If omitted, the browsers {@link window.location.href} is used.
 * @returns Location object with route, milepost, direction, and date information
 */
export function getElcParamsFromUrl(
	url: string | URL | URLSearchParams = window.location.href,
) {
	// If the URL is a URL object, use its search params.
	let searchParams: URLSearchParams;
	if (url instanceof URL) {
		searchParams = url.searchParams;
	} else if (url instanceof URLSearchParams) {
		searchParams = url;
	} else {
		// If string is empty or otherwise falsy, return null.
		if (!url) {
			return null;
		}
		searchParams = /^https?:\/\//.test(url)
			? new URL(url).searchParams
			: new URLSearchParams(url);
	}

	let sr = getUrlSearchParameter(searchParams, "sr");
	const mp = getUrlSearchParameter(searchParams, "mp");

	if (!sr || !mp) {
		return null;
	}
	sr = padRoute(sr);

	const rrt = getUrlSearchParameter(searchParams, "rrt") ?? "";
	const rrq = getUrlSearchParameter(searchParams, "rrq") ?? "";
	const { srmp, back } = parseSrmp(mp);

	const direction = getUrlSearchParameter(searchParams, "dir") ?? "i";

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const route = `${sr}${rrt}${rrq}`;

	const emp = getUrlSearchParameter(searchParams, "endMP");

	const { srmp: endSrmp, back: endBack } = emp
		? parseSrmp(emp)
		: { srmp: undefined, back: undefined };
	const output = {
		Route: route,
		Srmp: srmp,
		Back: back,
		Decrease: /dD/i.test(direction),
		ReferenceDate: today,
		ResponseDate: today,
		EndSrmp: endSrmp,
		EndBack: endBack,
	} as ValidRouteLocationForMPInput<Date, RouteGeometry>;
	return output;
}

/**
 * Adds graphics to the layer based on the route and milepost information from the URL.
 * @param milepostLayer - The feature layer for mileposts
 * @param options - Options for {@link findRouteLocations}.
 * @returns - The graphics added to the layer
 * @throws - {@link FormatError} if the URL does not contain valid route and milepost information
 * @throws - {@link ElcError} if the URL contains invalid route and milepost information
 */
export async function callElcFromUrl(
	milepostLayer: __esri.FeatureLayer,
	lineMilepostLayer: __esri.FeatureLayer,
	options: Pick<FindRouteLocationParameters, "outSR"> = { outSR: 3857 },
) {
	const routeLocation = getElcParamsFromUrl();

	if (!routeLocation) {
		return null;
	}

	const elcResults = await findRouteLocations({
		locations: [routeLocation],
		outSR: options.outSR,
	});

	if (elcResults.length < 1) {
		return null;
	}

	const location = elcResults[0];
	if (location instanceof ElcError) {
		throw location;
	}

	const graphic = routeLocationToGraphic(location);

	const layer =
		graphic.geometry?.type === "polyline" ? lineMilepostLayer : milepostLayer;

	const addedGraphics = await addGraphicsToLayer(layer, [graphic]);

	return addedGraphics;
}
