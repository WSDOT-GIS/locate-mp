/// <reference types="vite/client" />
/// <reference types="vitest" />

import { fileURLToPath } from "node:url";
import browserslistToEsbuild from "browserslist-to-esbuild";
import { defineConfig } from "vite";

export default defineConfig((env) => ({
	appType: "spa",
	base: "/data/tools/LocateMP",
	resolve: {
		extensions: [".ts", ".js", ".css", ".json"],
	},
	build: {
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
		exclude: ["e2e/**", "node_modules/**", "dist/**"],
		root: fileURLToPath(new URL("./", import.meta.url)),
		setupFiles: ["globalSetup.ts", "./tests/mocks-setup.ts"],
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
		// isolate: false,
		// fileParallelism: false
		pool: "threads",
	},
}));
