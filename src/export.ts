import type Graphic from "@arcgis/core/Graphic";
import type FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import type * as GJ from "geojson";
import NotImplementedError from "./common/NotImplementedError";
import { hasPaths, hasPoints, hasRings, hasXAndY } from "./types";

/**
 * Convert ArcGIS geometry to GeoJSON format.
 * @param geometry - the input ArcGis geometry to be converted
 * @returns the converted GeoJSON geometry
 */
export function convertArcGisGeometryToGeoJson(geometry: __esri.Geometry) {
	if (hasXAndY(geometry)) {
		return {
			coordinates: [geometry.x, geometry.y],
			type: "Point",
		} as GJ.Point;
	}
	if (hasPoints(geometry)) {
		return {
			coordinates: geometry.points,
			type: "MultiPoint",
		} as GJ.MultiPoint;
	}
	if (hasPaths(geometry)) {
		if (geometry.paths.length === 1) {
			return {
				coordinates: geometry.paths[0],
				type: "LineString",
			} as GJ.LineString;
		}
		return {
			coordinates: geometry.paths,
			type: "MultiLineString",
		} as GJ.MultiLineString;
	}
	if (hasRings(geometry)) {
		return {
			coordinates: (geometry as __esri.Polygon).rings,
			type: "Polygon",
		} as GJ.Polygon;
	}
	throw new NotImplementedError(
		`This type of geometry is not yet supported: ${geometry.type}`,
	);
}

/**
 * Converts an ArcGIS Feature into a GeoJSON Feature.
 * @param feature - the feature to be converted
 * @returns - the GeoJSON representation of the feature
 */
export function convertArcGisGraphicToGeoJson<
	P extends GJ.GeoJsonProperties = GJ.GeoJsonProperties,
>(feature: Graphic) {
	const properties = feature.attributes as P;
	const geometry = feature.geometry;
	const oid = feature.getObjectId();

	const gjGeometry = geometry ? convertArcGisGeometryToGeoJson(geometry) : null;
	return {
		// Omit OID if it is NaN or is null.
		// Not sure if typing is correct, so checking for
		// null & undefined even though eslint says it is
		// unnecessary.
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		id: Number.isNaN(oid) || oid == null ? undefined : oid,
		geometry: gjGeometry,
		properties: properties,
		type: "Feature",
	} as GJ.Feature<typeof gjGeometry, typeof properties>;
}

/**
 * Converts an ArcGis feature set to GeoJson format.
 * @param featureSet - the ArcGis feature set to be converted
 * @returns the GeoJson feature collection
 */
export function convertArcGisFeatureSetToGeoJson(featureSet: FeatureSet) {
	const geoJsonFeatures = featureSet.features.map((f) =>
		convertArcGisGraphicToGeoJson(f),
	);
	type F = (typeof geoJsonFeatures)[number];
	type G = F["geometry"];
	type P = F["properties"];

	return {
		features: geoJsonFeatures,
		type: "FeatureCollection",
	} as GJ.FeatureCollection<
		G,
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
		P
	>;
}
