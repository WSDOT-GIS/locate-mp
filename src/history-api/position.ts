/**
 * Mimic the hash functionality of MapLibre Map.
 * @see {@link https://maplibre.org/maplibre-gl-js-docs/api/map/#map}
 *
 * > ...the map's position (zoom, center latitude, center longitude, bearing,
 * > and pitch) will be synced with the hash fragment of the page's URL.
 * > For example, http://path/to/my/page.html#2.59/39.26/53.07/-24.1/60.
 * > An additional string may optionally be provided to indicate a
 * > parameter-styled hash, e.g.
 * > http://path/to/my/page.html#map=2.59/39.26/53.07/-24.1/60&foo=bar,
 * > where foo is a custom parameter and bar is an arbitrary hash
 * > distinct from the map hash. ...
 */

import FormatError from "../common/FormatError";

const { webMercatorToGeographic } = await import(
	"@arcgis/core/geometry/support/webMercatorUtils"
);

// TODO: Make sure the hash is using WGS84 coordinates instead of Web Mercator.

/**
 * A {@link https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#hash|MapLibre Map style position hash string}.
 */
export type MapPositionHashString =
	`${number}/${number}/${number}/${number}/${number}`;

/**
 * RegExp pattern matching a positive or negative number, integer or decimal.
 */
const numRePattern = String.raw`-?\d+(?:\.\d+)?`;

const groupNames = ["zoom", "centerY", "centerX", "bearing", "pitch"] as const;

export type HashGroupName = (typeof groupNames)[number];

/**
 * RegExp pattern matching a MapLibre Map position hash.
 *
 * ## Groups
 *
 * - `zoom` - The zoom level
 * - `centerY` - The center latitude
 * - `centerX` - The center longitude
 * - `bearing` - The bearing
 * - `pitch` - The pitch
 */
const mapPositionHashRe = new RegExp(
	String.raw`${
		// Create groups for zoom, center latitude, center longitude, bearing, and pitch.
		groupNames
			// Create a RegExp group for each group name.
			.map((groupName) => String.raw`(?<${groupName}>${numRePattern})`)
			// Join the RegExp groups with a "/".
			.join("/")
		// Append the optional query string group.
	}`,
);

export interface MapPosition {
	zoom: number;
	center: [number, number];
	bearing: number;
	pitch: number;
}

interface MPMatch extends RegExpExecArray {
	length: 6;
	groups: {
		zoom: `${number}`;
		centerX: `${number}`;
		centerY: `${number}`;
		bearing: `${number}`;
		pitch: `${number}`;
	};
}

/**
 * Parses the map position hash to extract the zoom level, center coordinates, bearing, pitch, and query string parameters.
 * @param mapPositionHash - The hash representing the map position
 * @returns The parsed map position object
 */
export function parseMapPositionHash(
	mapPositionHash: URL["hash"],
): MapPosition {
	const match = mapPositionHashRe.exec(mapPositionHash);
	const matchIsValid = (match: ReturnType<RegExp["exec"]>): match is MPMatch =>
		!!match?.groups && match.length - 1 === groupNames.length;
	if (!matchIsValid(match)) {
		throw new FormatError(mapPositionHash, mapPositionHashRe);
	}

	const { groups } = match;

	return {
		zoom: Number.parseFloat(groups.zoom),
		center: [
			Number.parseFloat(groups.centerX),
			Number.parseFloat(groups.centerY),
		] as [x: number, y: number],
		bearing: Number.parseFloat(groups.bearing),
		pitch: Number.parseFloat(groups.pitch),
	};
}

/**
 * Mimic the hash functionality of MapLibre Map.
 * @param view - The map view
 * @see {@link https://maplibre.org/maplibre-gl-js-docs/api/map/#map}
 *
 * > ...the map's position (zoom, center latitude, center longitude, bearing,
 * > and pitch) will be synced with the hash fragment of the page's URL.
 * > For example, http://path/to/my/page.html#2.59/39.26/53.07/-24.1/60.
 * > An additional string may optionally be provided to indicate a
 * > parameter-styled hash, e.g.
 * > http://path/to/my/page.html#map=2.59/39.26/53.07/-24.1/60&foo=bar,
 * > where foo is a custom parameter and bar is an arbitrary hash
 * > distinct from the map hash. ...
 * @returns The map position hash
 */
export function createMapPositionHash(
	view: __esri.MapView | __esri.SceneView,
): MapPositionHashString {
	let hash: MapPositionHashString;
	let center = view.center.clone();
	center = webMercatorToGeographic(center) as __esri.Point;
	if (view.type === "2d") {
		const bearing = view.rotation;
		hash = `${view.zoom}/${center.y}/${center.x}/${bearing}/0`;
	} else {
		const bearing = view.camera.heading;
		const pitch = view.camera.tilt;
		hash = `${view.zoom}/${center.y}/${center.x}/${bearing}/${pitch}`;
	}

	return hash;
}

/**
 * Updates the map position portion of a URL's hash.
 * @param url - The URL to update
 * @param view - The map view
 * @returns The updated URL hash section
 */
export function updateHash(url: URL, view: __esri.MapView | __esri.SceneView) {
	const oldHash = url.hash;
	const match = mapPositionHashRe.exec(oldHash);
	const mapPositionHash = createMapPositionHash(view);
	if (match) {
		return url.hash.replace(mapPositionHashRe, mapPositionHash);
	}
	return mapPositionHash + url.hash;
}

export class MapPositionHash implements MapPosition {
	zoom: number;
	center: [y: number, x: number];
	bearing: number;
	pitch: number;

	constructor(mapPosition: string | MapPosition) {
		let parsedMapPosition: MapPosition;

		if (typeof mapPosition === "string") {
			parsedMapPosition = parseMapPositionHash(mapPosition);
		} else {
			parsedMapPosition = mapPosition;
		}

		this.zoom = parsedMapPosition.zoom;
		this.center = parsedMapPosition.center;
		this.bearing = parsedMapPosition.bearing;
		this.pitch = parsedMapPosition.pitch;
	}

	/**
	 * Returns the x-coordinate of the center point.
	 * @returns The x-coordinate of the center point.
	 */
	public get x(): number {
		return this.center[1];
	}

	/**
	 * Returns the y-coordinate of the center point.
	 * @returns The y-coordinate of the center point.
	 */
	public get y(): number {
		return this.center[0];
	}

	toString() {
		return `${this.zoom}/${this.y}/${this.x}/${this.bearing}/${this.pitch}`;
	}
}
