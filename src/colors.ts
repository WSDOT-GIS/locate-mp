const Color = await $arcgis.import("@arcgis/core/Color");

/**
 * The shade of green for the background of highway signs.
 */
export const highwaySignBackgroundColor = new Color([1, 115, 92, 255]);
/**
 * The white outline around a sign, which is equivalent to "#ffffff" or "white".
 */
export const highwaySignTextColor = new Color("#ffffff");
