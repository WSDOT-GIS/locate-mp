const Color = await $arcgis.import("@arcgis/core/Color.js");

import { describe, test } from "vitest";
import {
	highwaySignBackgroundColor,
	highwaySignTextColor,
} from "../src/colors.js";

describe.concurrent("colors", () => {
	test("highwaySignBackgroundColor", ({ expect }) => {
		expect(highwaySignBackgroundColor).toBeInstanceOf(Color);
	});
	test("highwaySignTextColor", ({ expect }) => {
		expect(highwaySignTextColor).toBeInstanceOf(Color);
	});
});
