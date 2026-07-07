/**
 * This script was used to create the milepost marker symbol,
 * after which it was further modified.
 */

import type CIMSymbol from "@arcgis/core/symbols/CIMSymbol";
import type {
	CIMMarkerGraphic,
	CIMSymbolLayerUnion,
	CIMTextSymbol,
	CIMVectorMarker,
} from "@arcgis/core/symbols/cim/types";
import type SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import type { TextSymbolProperties } from "@arcgis/core/symbols/TextSymbol";
import { highwaySignBackgroundColor, highwaySignTextColor } from "../../colors";

const [{ convertToCIMSymbol }, TextSymbol] = await $arcgis.import([
	"@arcgis/core/symbols/support/cimConversionUtils",
	"@arcgis/core/symbols/TextSymbol",
] as const);

/**
 * The name of the text symbol that will have its
 * text replaced by feature attributes.
 */
const defaultPrimitiveName = "milepostLabel";

/**
 * Type guard function to check if a CIMSymbolLayer is a CIMVectorMarker.
 * @param l - The CIMSymbolLayer to check.
 * @returns A boolean indicating whether the provided layer is a CIMVectorMarker.
 */
export function isCimVectorMarker(
	l: CIMSymbolLayerUnion,
): l is CIMVectorMarker {
	return l.type === "CIMVectorMarker";
}

/**
 * Type for a CIMMarkerGraphic that has a CIMTextSymbol.
 */
type CIMMarkerGraphicWithTextSymbol = CIMMarkerGraphic & {
	symbol: CIMTextSymbol;
};

/**
 * Type guard function to check if a {@link CIMMarkerGraphic|CIMMarkerGraphic} is a {@link CIMTextSymbol|CIMTextSymbol}.
 * @param g - The {@link CIMMarkerGraphic|CIMMarkerGraphic} to check.
 * @returns A boolean indicating whether the provided graphic is a {@link CIMTextSymbol|CIMTextSymbol}.
 */
function isCimMarkerGraphicWithTextSymbol(
	g: CIMMarkerGraphic,
): g is CIMMarkerGraphicWithTextSymbol {
	return g.symbol?.type === "CIMTextSymbol";
}

/**
 * Sets the primitive name of the first {@link CIMTextSymbol|CIMTextSymbol} found within the
 * {@link CIMSymbol|CIMSymbol}'s vector marker layers to the specified primitive name.
 *
 * @param cimSymbol - The {@link CIMSymbol|CIMSymbol} object containing symbol layers to search.
 * @param primitiveName - The new primitive name to assign to the first
 *                        {@link CIMTextSymbol|CIMTextSymbol} found.
 * @throws {TypeError} Will throw an error if the symbol has no symbol layers.
 * @returns The modified {@link CIMMarkerGraphic|CIMMarkerGraphic} if a {@link CIMTextSymbol|CIMTextSymbol} is found,
 *          otherwise null.
 */
function setPrimitiveNameOfFirstTextSymbol(
	cimSymbol: CIMSymbol,
	primitiveName: string,
) {
	const symbolLayers =
		cimSymbol.data.symbol?.type !== "CIMTextSymbol" &&
		cimSymbol.data.symbol?.symbolLayers;
	if (!symbolLayers) {
		throw new TypeError("Symbol has no symbol layers");
	}

	let textSymbol: CIMMarkerGraphicWithTextSymbol | null = null;

	// Find the text symbol and set its primitive name.
	for (const layer of symbolLayers.filter(isCimVectorMarker)) {
		const markerGraphics = layer.markerGraphics;
		for (const markerGraphic of markerGraphics.filter(
			isCimMarkerGraphicWithTextSymbol,
		)) {
			markerGraphic.primitiveName = primitiveName;
			textSymbol = markerGraphic;
			break;
		}
		if (textSymbol) {
			break;
		}
	}

	return textSymbol;
}

/**
 * Creates a CIM symbol for a milepost marker.
 * The symbol is a text symbol with white text on a green background.
 * The text of the symbol is a placeholder that can be replaced
 * with feature attributes by overriding "milepostLabel" primitive name.
 *
 * @returns A CIM symbol for a milepost marker.
 */
export function createMilepostCimSymbol(
	textSymbolProperties: TextSymbolProperties = {
		color: highwaySignTextColor,
		borderLineColor: highwaySignTextColor,
		borderLineSize: 1,
		backgroundColor: highwaySignBackgroundColor,
		// cspell:disable-next-line
		text: "ROUTE\nMILE.POSTB",
	},
	primitiveName: string = defaultPrimitiveName,
) {
	const simpleSymbol = new TextSymbol(textSymbolProperties);

	// Convert the text symbol into a CIM symbol.
	const cimSymbol = convertToCIMSymbol(
		// Since this function doesn't officially support TextSymbols,
		// you have to pretend its one of the supported types.
		simpleSymbol as unknown as SimpleMarkerSymbol,
	);

	// Set the primitive name of the first text symbol to "milepostLabel".
	setPrimitiveNameOfFirstTextSymbol(cimSymbol, primitiveName);

	// Add primitive overrides to the symbol.
	cimSymbol.data.primitiveOverrides = [
		{
			primitiveName: primitiveName,
			propertyName: "textString",
			valueExpressionInfo: {
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is an Arcade expression
				expression: "`${$feature.Route}\\n${$feature.SRMP}${$feature.Back}`",
				type: "CIMExpressionInfo",
				returnType: "String",
			},
			type: "CIMPrimitiveOverride",
		},
	];

	return cimSymbol;
}
