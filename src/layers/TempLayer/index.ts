import { objectIdFieldName } from "../../elc/types";

const [Collection, SpatialReference, FeatureLayer, Field, SimpleRenderer] =
	await $arcgis.import([
		"@arcgis/core/core/Collection",
		"@arcgis/core/geometry/SpatialReference",
		"@arcgis/core/layers/FeatureLayer",
		"@arcgis/core/layers/support/Field",
		"@arcgis/core/renderers/SimpleRenderer",
	] as const);
const { loadingSymbol } = await import("./loadingSymbol");

/**
 * This layer is used for showing the user where the clicked
 * before the ELC call has completed. Once the ELC call has
 * completed, a graphic will be added to the milepost layer
 * and the corresponding graphic should be removed from
 * this layer.
 */
export const tempLayer = new FeatureLayer({
	renderer: new SimpleRenderer({
		symbol: loadingSymbol,
	}),
	title: "Temporary Layer",
	geometryType: "point",
	legendEnabled: false,
	listMode: "hide",
	spatialReference: SpatialReference.WebMercator,
	id: "tempLayer",
	fields: [
		new Field({
			name: objectIdFieldName,
			alias: "Object ID",
			type: "oid",
		}),
		new Field({
			name: "MilepostId",
			alias: "Milepost ID",
			type: "string",
			valueType: "unique-identifier",
		}),
	],
	source: new Collection([]),
});
