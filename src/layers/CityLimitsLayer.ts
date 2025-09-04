const [ MapImageLayer, SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol ] = await $arcgis.import([
	"@arcgis/core/layers/MapImageLayer",
	"@arcgis/core/renderers/SimpleRenderer",
	"@arcgis/core/symbols/SimpleFillSymbol",
	"@arcgis/core/symbols/SimpleLineSymbol",
] as const);

const renderer = new SimpleRenderer({
	symbol: new SimpleFillSymbol({
		style: "none",
		outline: new SimpleLineSymbol({
			color: "blue",
			style: "solid",
			width: 1,
		}),
	}),
});

const sublayers = (
	[
		{ minScale: 1500000, maxScale: 750001 },
		{ minScale: 0, maxScale: 1500001, renderer },
		{ minScale: 750000.0, maxScale: 0, renderer },
	] as const
).map((currentItem, i) => ({ id: i, popupEnabled: false, ...currentItem }));

/**
 * The city limits layer.
 */
export const cityLimitsLayer = new MapImageLayer({
	title: "City Limits",
	url: "https://data.wsdot.wa.gov/arcgis/rest/services/Shared/CityLimits/MapServer",
	visible: false,
	listMode: "hide-children",
	sublayers,
});
