import { rangeDomainProperties } from "@wsdot/land-use-codes";
import { landUseCategoryToColorMapping } from "./colors";

const [Color, ClassBreaksRenderer, ClassBreakInfo, SimpleFillSymbol] =
	await $arcgis.import([
		"@arcgis/core/Color",
		"@arcgis/core/renderers/ClassBreaksRenderer",
		"@arcgis/core/renderers/support/ClassBreakInfo",
		"@arcgis/core/symbols/SimpleFillSymbol",
	] as const);

const defaultSymbol = new SimpleFillSymbol({
	outline: {
		color: "black",
		width: 2,
	},
});

type RangeDomainPropertiesItem = (typeof rangeDomainProperties)[number];

const createClassBreak = ({
	name: label,
	minValue,
	maxValue,
}: RangeDomainPropertiesItem): __esri.ClassBreakInfo => {
	const symbol = defaultSymbol.clone();
	const colorHex = landUseCategoryToColorMapping.get(label);
	if (colorHex && symbol.outline) {
		symbol.outline.color = new Color(colorHex);
	}
	return new ClassBreakInfo({ label, minValue, maxValue, symbol });
};
const classBreaks = rangeDomainProperties.map(createClassBreak);

export const renderer = new ClassBreaksRenderer({
	defaultSymbol,
	defaultLabel: "Unknown",
	field: "LANDUSE_CD",
	classBreakInfos: classBreaks,
});

if (import.meta.hot) {
	// Update the colors in the class breaks when "./colors" is modified.
	import.meta.hot.accept("./colors", (mod) => {
		if (mod) {
			console.log("hot module replacement", mod);
		}

		renderer.classBreakInfos = rangeDomainProperties.map(createClassBreak);
	});
}
