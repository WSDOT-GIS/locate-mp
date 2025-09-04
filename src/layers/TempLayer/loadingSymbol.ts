const [ SimpleMarkerSymbol, SimpleLineSymbol ] = await $arcgis.import([
	"@arcgis/core/symbols/SimpleMarkerSymbol",
	"@arcgis/core/symbols/SimpleLineSymbol",
] as const);

export const loadingSymbol = new SimpleMarkerSymbol({
	color: "red",
	outline: new SimpleLineSymbol({
		color: "red",
		width: 5,
	}),
	style: "x",
	size: 10,
});
