import type Geometry from "@arcgis/core/geometry/Geometry";
import type { AttributeValue } from "./common/arcgis/typesAndInterfaces";

/**
 * An object like one used by {@link Graphic.attributes},
 * with {@link AttributeValue|AttributeValues} keyed
 * by strings.
 */
export type AttributesObject = Record<string, AttributeValue>;

/**
 * An object that has an "attributes" property
 */
export interface HasAttributes<T extends AttributesObject> {
	/**
	 * @inheritdoc
	 */
	attributes: T;
}

/**
 * Tests to see if the {@link input} is an {@link Object} with
 * an attributes property that
 * is also an {@link Object}.
 * @param input - An input object.
 * @returns - Returns true if the input is an {@link Object} with an
 * "attributes" property that is also an {@link Object},
 * otherwise returns false.
 */
export function hasAttributes<T extends AttributesObject>(
	input: unknown,
): input is HasAttributes<T> {
	return (
		!!input &&
		typeof input === "object" &&
		Object.hasOwn(input, "attributes") &&
		typeof (input as HasAttributes<T>).attributes === "object"
	);
}

/**
 * Extends {@link Graphic} to provide more strict type information for
 * {@link Graphic["attributes"]|attributes} and {@link Graphic["geometry"]|geometry}.
 */
export interface TypedGraphic<
	G extends Geometry,
	T extends Record<string, AttributeValue>,
> extends HasAttributes<T> {
	/**
	 * @inheritdoc
	 */
	geometry: G;
}

/**
 * Tests to see if a {@link __esri.ViewHit|ViewHit} is a
 * {@link __esri.GraphicHit|GraphicHit}.
 * @param viewHit - The view hit to be tested.
 * @returns - Returns true if {@link __esri.ViewHit.type} = "graphic",
 * false otherwise.
 */
export function isGraphicHit(
	viewHit: __esri.MapViewViewHit,
): viewHit is __esri.GraphicHit {
	return viewHit.type === "graphic";
}

/**
 * Checks if the given item is an instance of {@link __esri.FeatureEditResult}.
 * @param item - The item to check.
 * @returns - Returns true if the item is an instance of {@link __esri.FeatureEditResult}, otherwise false.
 */
export function isFeatureEditResult(
	item: unknown,
): item is __esri.FeatureEditResult {
	return (
		item != null &&
		typeof item === "object" &&
		["objectId", "globalId", "error"].every((key) => Object.hasOwn(item, key))
	);
}

export type UIAddPositionPosition = NonNullable<
	__esri.UIAddPosition["position"]
>;

/**
 * An enumeration of {@link UIAddPositionPosition} values.
 */
export enum UIAddPositions {
	bottomLeading = "bottom-leading",
	bottomLeft = "bottom-left",
	bottomRight = "bottom-right",
	bottomTrailing = "bottom-trailing",
	topLeading = "top-leading",
	topLeft = "top-left",
	topRight = "top-right",
	topTrailing = "top-trailing",
	manual = "manual",
}
/**
 * The bare minimum properties for defining a point.
 */
export interface XAndY {
	x: number;
	y: number;
}

/**
 * Determines if an input geometry object has both "x" and "y"
 * properties which are both numbers.
 * @param value - Value from {@link RouteLocation.RouteGeometry}
 * @returns - `true` if {@link geometry} has "x" and "y" properties
 * with numeric values, `false` otherwise.
 */
export const hasXAndY = <T extends object>(
	value: T | nullish,
): value is T & XAndY =>
	!!value &&
	(["x", "y"] as (keyof T)[]).every(
		(key) => key in value && typeof value[key] === "number",
	);

/**
 * Checks if the input geometry has the "paths" property and is
 * an array, and returns a boolean value.
 * @param geometry - The input geometry object to be checked
 * @returns Returns true if the input geometry has the "paths" property and is an array, otherwise returns false
 */
export const hasPaths = <T extends object>(
	geometry: T,
): geometry is T & Pick<__esri.Polyline, "paths"> =>
	typeof geometry === "object" &&
	"paths" in geometry &&
	Array.isArray(geometry.paths);

/**
 * Checks if the input geometry has a "rings" property and is an array, and returns a boolean value.
 * @param geometry - The input geometry object to be checked
 * @returns - Returns true if the input geometry has a "rings" property and is an array, otherwise returns false.
 */
export function hasRings<T extends object>(
	geometry: T,
): geometry is T & Pick<__esri.Polygon, "rings"> {
	return "rings" in geometry && Array.isArray(geometry.rings);
}

/**
 * Checks if the input geometry has the "points" property and is an array, and returns a boolean value.
 * @param geometry - The input geometry object to be checked
 * @returns - Returns true if the input geometry has the "points" property and is an array, otherwise returns false
 */
export function hasPoints<T extends object>(
	geometry: T,
): geometry is T & Pick<__esri.Multipoint, "points"> {
	return (
		typeof geometry === "object" &&
		"points" in geometry &&
		Array.isArray(geometry.points)
	);
}
