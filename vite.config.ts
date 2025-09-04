/// <reference types="vite/client" />
/// <reference types="vitest" />
import browserslistToEsbuild from "browserslist-to-esbuild";
import { defineConfig } from "vite";

export default defineConfig((env) => ({
	appType: "spa",
	base: "/data/tools/LocateMP",
	resolve: {
		extensions: [".ts", ".js", ".css", ".json"],
	},
	build: {
		// This sets the target based on the `browserslist` file.
		target: browserslistToEsbuild(),
		rollupOptions: {
			input: {
				main: "./index.html",
				"route-list": "./route-list.html",
			},
			external: [
				"@arcgis/core",
				"@arcgis/map-components",
				"@esri/calcite-components",
			],
		},
		sourcemap: true,
	},
	test: {
		name: "LocateMP",
		environment: "jsdom",
		setupFiles: "./tests/mocks-setup.ts",
		reporters: ["default", "junit"],
		outputFile: {
			junit: "./test-results/test-results.xml",
		},
		coverage: {
			enabled: false,
			extension: [
				// '.js',
				// '.cjs',
				// '.mjs',
				// ".jsx",
				".ts",
				".tsx",
				// ".vue",
				// ".svelte",
			],
			reporter: [
				// Defaults
				"text",
				"html",
				"clover",
				"json",
				// Added
				"lcov",
				"cobertura",
			],
		},
	},
}));
