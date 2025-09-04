const TextSymbol = await $arcgis.import("@arcgis/core/symbols/TextSymbol");

const outlineColor = "white";

export const labelSymbol = new TextSymbol({
	color: outlineColor,
	haloColor: "black",
	haloSize: 1,
	font: {
		size: 10,
		weight: "normal",
	},
});
