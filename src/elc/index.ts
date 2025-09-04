import { RouteDescription, type RrtValue } from "wsdot-route-utils";
import {
	ArcGisError,
	type ArcGisErrorResponse,
	ElcError,
	isArcGisErrorResponse,
} from "./errors";
import { elcReviver } from "./json";
import type {
	DateString,
	DateType,
	FindNearestRouteLocationParameters,
	FindRouteLocationParameters,
	RouteGeometry,
	RouteGeometryPoint,
	RouteIdString,
	RouteLocation,
	RoutesResponse,
	RoutesSet,
	RouteTypes,
	ValidRouteLocationForMPInput,
} from "./types";
import { populateUrlParameters } from "./url";

/*
TODO: Test the responses from the ELC requests for the presence of an "error" property
and if there is one, throw an error. Will also need to create a new class that extends
Error to handle this.
*/

export type ElcMapServiceUrlString =
	`http${"s" | ""}://${string}/arcgis/rest/services/${string}/MapServer/`;

export type ElcSoeUrlString = `${ElcMapServiceUrlString}exts/ElcRestSoe/`;

type Space = " " | "%20";

export type ElcFindNearestUrlString =
	`${ElcSoeUrlString}Find${Space}Nearest${Space}Route${Space}Locations/`;

export type ElcFindUrlString =
	`${ElcSoeUrlString}Find${Space}Route${Space}Locations/`;

export type ElcRoutesUrlString = `${ElcSoeUrlString}routes/`;

const defaultExtensionRoot =
	"https://data.wsdot.wa.gov/arcgis/rest/services/Shared/ElcRestSOE/MapServer/exts/ElcRestSoe/";

export const defaultFindNearestUrl: ElcFindNearestUrlString = `${defaultExtensionRoot}Find Nearest Route Locations/`;

export const defaultFindUrl: ElcFindUrlString = `${defaultExtensionRoot}Find Route Locations/`;

export const defaultRoutesUrl: ElcRoutesUrlString = `${defaultExtensionRoot}routes/`;

type SuccessType = RouteLocation<DateString, RouteGeometryPoint>;

/**
 * Splits an array of ELC results, some of the objects potentially
 * {@link Error Errors}, into two {@link Map mappings}:
 * one of errors and one of non-errors. The maps are keyed
 * by the index of the input array.
 * @param elcResults - An array of results from the input array.
 * @returns An object with two maps: errors and successes.
 */
function splitErrorResults<T>(elcResults: T[]) {
	type NonError = Exclude<T, Error>;
	const successes = new Map<number, NonError>();
	const errors = new Map<number, Error>();

	for (const [i, item] of elcResults.entries()) {
		if (item instanceof Error) {
			errors.set(i, item);
		} else {
			successes.set(i, item as NonError);
		}
	}

	return {
		successes,
		errors,
	};
}

/**
 * Corrects the route information in an error by adding it to a new {@link ElcError} object.
 * The original error will be the {@link ElcError.cause|cause} of the new error.
 * @param resultItem - The original {@link ElcError} object.
 * @param location - The route location to add to the new error.
 * @returns The new {@link ElcError} object with the corrected route information.
 */
function correctRouteInfoInError(
	resultItem: ElcError,
	location: ValidRouteLocationForMPInput<DateType, RouteGeometry>,
) {
	const newError = new ElcError(resultItem, {
		cause: resultItem,
	});
	Object.assign(newError, location);
	return newError;
}

/**
 * Updates the errors in the result array with additional information from the routeLocations.
 * @param result - The array of errors and route locations.
 * @param routeLocations - The parameters used to find the route locations.
 */
function addInfoToErrors(
	result: (
		| ElcError
		| RouteLocation<`${number}/${number}/${number}`, RouteGeometry>
	)[],
	routeLocations: FindRouteLocationParameters,
) {
	for (const [i, resultItem] of result.entries()) {
		if (resultItem instanceof ElcError) {
			const location = routeLocations.locations[i];
			const newError = correctRouteInfoInError(resultItem, location);
			result[i] = newError;
		}
	}
}

/**
 * Find nearest route locations
 * @param options - the input parameters
 * @param url - ELC SOE "Find Nearest Route Locations" endpoint URL.
 * @returns - An array of route locations.
 */
export async function findNearestRouteLocations(
	options: FindNearestRouteLocationParameters,
	url: ElcFindNearestUrlString = defaultFindNearestUrl,
) {
	const queryUrl = new URL(url);
	populateUrlParameters(options, queryUrl);
	const response = await fetch(queryUrl);

	const responseJson = await response.text();
	const result = JSON.parse(responseJson, elcReviver) as (
		| SuccessType
		| ArcGisError
		| ElcError
	)[];

	if (!result.length) {
		return result;
	}
	if (result.length > 1) {
		console.warn(`Expected 1 result, got ${result.length.toString()}.`);
	}

	const { successes } = splitErrorResults(result);

	const successValues = [...successes.values()];

	const secondPassInput = {
		// Filter out all of the error responses.
		locations: successValues.map(
			({ Arm, Route, Decrease, ReferenceDate, Id }) => ({
				Arm,
				Route,
				Decrease,
				ReferenceDate,
				Id,
			}),
		),
		outSR: options.outSR ?? options.inSR,
		lrsYear: options.lrsYear ?? "Current",
		referenceDate: options.referenceDate,
	};
	const result2 = await findRouteLocations(secondPassInput);

	// Restore old distance values.
	const successesAndErrors = splitErrorResults(result2);

	for (const [i, routeLocation] of [
		...successesAndErrors.successes.values(),
	].entries()) {
		const oldLoc = successValues[i];
		routeLocation.EventPoint = oldLoc.EventPoint;
		routeLocation.Distance = oldLoc.Distance;
		routeLocation.Angle = oldLoc.Angle;
	}

	return result2;
}

/**
 * Find route locations based on the given parameters and URL.
 * @param routeLocations - the parameters for finding route locations
 * @param url - the URL for finding route locations
 * @returns - an array of route locations
 * @throws {ArcGisError} if the ArcGIS server responds with an error.
 */
export async function findRouteLocations(
	routeLocations: FindRouteLocationParameters,
	url: ElcFindUrlString = defaultFindUrl,
) {
	const requestUrl = new URL(url);
	populateUrlParameters(routeLocations, requestUrl);
	const response = await fetch(requestUrl);
	const resultJson = await response.text();
	const result = JSON.parse(resultJson, elcReviver) as (
		| RouteLocation<DateString, RouteGeometry>
		| ElcError
	)[];

	if (isArcGisErrorResponse(result)) {
		throw new ArcGisError(result, { routeLocations, requestUrl, response });
	}

	addInfoToErrors(result, routeLocations);

	return result;
}

let routes: RoutesResponse | null = null;

export interface RouteFilterOptions {
	/**
	 * Determines if mainlines are included.
	 * Any non-false value will be interpreted as true.
	 */
	includeMainlines?: boolean;
	/**
	 * Determines if ramps should be included.
	 * Any non-false value will be interpreted as true.
	 */
	includeRamps?: boolean;
	/**
	 * A list of RRTs that will be returned.
	 * Any RRTs not in the list will be skipped.
	 * If undefined, all RRTs will be returned.
	 */
	allowedRrts?: RrtValue[];
}

export const defaultRrts = ["SP", "CO", "AR"] as const;

const defaultFilterOptions: RouteFilterOptions = {
	includeMainlines: true,
	includeRamps: false,
	allowedRrts: [...defaultRrts],
};

export type RouteAndTypeTuple = [
	route: RouteDescription,
	routeType: RouteTypes,
];

/**
 * Enumerates through a set of routes, converting the route
 * ID strings to {@link RouteDescription} objects.
 * @param routes - The set of routes for one specific year
 * as returned by the ELC "routes" endpoint.
 * @param options - Options for filtering yielded results.
 * @yields - tuples consisting of a {@link RouteDescription} and a {@link RouteTypes}
 */
export function* enumerateRouteDescriptions(
	routes: RoutesSet,
	options: RouteFilterOptions = defaultFilterOptions,
): Generator<Readonly<RouteAndTypeTuple>, void> {
	for (const [routeId, routeType] of Object.entries(routes) as [
		RouteIdString,
		RouteTypes,
	][]) {
		const route = new RouteDescription(routeId);
		if (
			(route.isRamp && options.includeRamps === false) ||
			(route.isMainline && options.includeMainlines === false) ||
			(options.allowedRrts !== undefined &&
				route.rrt !== null &&
				!options.allowedRrts.includes(route.rrt))
		) {
			continue;
		}
		yield [route, routeType] as const;
	}
}

/**
 * Retrieves a list of routes from the ELC service.
 * @param url - ELC SOE "routes" endpoint URL.
 * @returns - An array of routes.
 */
export async function getRoutes(url: ElcRoutesUrlString = defaultRoutesUrl) {
	// If the routes list has already been retrieved, return it and exit.
	if (routes !== null) {
		return routes;
	}
	const requestUrl = new URL(url);
	requestUrl.searchParams.set("f", "json");
	const response = await fetch(requestUrl);
	const result = (await response.json()) as
		| RoutesResponse
		| ArcGisErrorResponse;

	if (isArcGisErrorResponse(result)) {
		throw new ArcGisError(result);
	}
	routes = result;
	return result;
}
