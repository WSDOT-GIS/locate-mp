import type Layer from "@arcgis/core/layers/Layer";

type FeatureLayerWarningArgs = [message: string];
type FeatureLayerErrorArgs = [
	method: string,
	message: string,
	error: Record<string, unknown>,
];
interface LayerViewManagerErrorInfoArg extends Record<string, unknown> {
	error: Record<string, unknown>;
	layer: Layer;
}
type LayerViewManagerErrorArgs = [
	message: string,
	info: LayerViewManagerErrorInfoArg,
];
export const isFeatureLayerErrorArgs = (
	args: unknown[],
): args is FeatureLayerErrorArgs =>
	args.length === 3 &&
	typeof args[0] === "string" &&
	typeof args[1] === "string" &&
	typeof args[2] === "object" &&
	args[2] != null;
export const isFeatrureLayerWarningsArgs = (
	args: unknown[],
): args is FeatureLayerWarningArgs =>
	args.length === 1 && typeof args[0] === "string";
export const isLayerViewManagerErrorArgs = (
	args: unknown[],
): args is LayerViewManagerErrorArgs =>
	args.length === 2 &&
	typeof args[0] === "string" &&
	args[1] != null &&
	typeof args[1] === "object";
