const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer");

const layerUrl =
	"https://data.wsdot.wa.gov/arcgis/rest/services/Shared/CountyBoundaries/MapServer/0/";

export const countyBoundariesLayer = new FeatureLayer({
	url: layerUrl,
});
