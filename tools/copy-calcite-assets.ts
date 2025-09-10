/**
 * Copies Calcite assets from node_modules into public/calcite/assets.
 * See: https://developers.arcgis.com/calcite-design-system/get-started/#load-the-assets
 */
import type { Dirent } from "node:fs";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseSvg } from "svgson";

/** The root path of this project */
const rootDirPath = dirname(dirname(fileURLToPath(import.meta.url)));
/** The directory to which the assets will be copied */
const destinationFolder = join(rootDirPath, "public", "calcite", "assets");
/** The folder from which the assets will be copied */
const sourceAssetsFolder = join(
	rootDirPath,
	"node_modules",
	"@esri",
	"calcite-components",
	"dist",
	"calcite",
	"assets",
);

/**
 * Converts all SVG files in `iconSourceFolder` to JSON files in
 * `iconDestinationFolder` by extracting the d attribute from the
 * single path element in each SVG file and writing it to a JSON file
 * with the same name as the SVG file but with a .json extension.
 * If the SVG file does not contain a single path element, it is
 * skipped.
 */
async function createRouteShieldIconDefinitionJsonFiles() {
	/**
	 * Converts a single SVG file to a JSON file by extracting the d
	 * attribute from the single path element in the SVG file and writing
	 * it to a JSON file with the same name as the SVG file but with a
	 * .json extension.
	 * @param svgPath - A `Dirent` object representing the SVG file to
	 *   convert.
	 */
	async function convertSvgToJson(svgPath: Dirent) {
		const svg = await readFile(join(iconSourceFolder, svgPath.name), {
			encoding: "utf-8",
		});
		const svgAsObject = await parseSvg(svg);

		// SVG is assumed to have only a single path element.
		// All paths assumed to be at root level.
		const paths = svgAsObject.children.filter((node) => node.name === "path");

		let jsonText: string;
		if (paths.length === 1) {
			jsonText = JSON.stringify(paths[0].attributes.d);
		} else {
			jsonText = JSON.stringify(paths);
		}

		const outFilePath = join(
			iconDestinationFolder,
			svgPath.name.replace(".svg", ".json"),
		);
		await writeFile(outFilePath, jsonText);
	}

	console.log("Creating route shield icon definition json files...");

	const iconSourceFolder = join(rootDirPath, "public", "highway-shields");

	const iconDestinationFolder = join(
		rootDirPath,
		"public",
		"calcite",
		"assets",
		"icon",
	);

	// Read the contents of the source directory.
	const dirContents = await readdir(iconSourceFolder, {
		withFileTypes: true,
		recursive: false,
		encoding: "utf-8",
	});

	// Filter to only SVG files.
	const svgFilePaths = dirContents.filter(
		(dirent) => dirent.isFile() && /^\w+\d+\.svg$/gi.test(dirent.name),
	);

	// Create the destination folder if it doesn't exist.
	await mkdir(iconDestinationFolder, { recursive: true });

	const svgPromises = svgFilePaths.map((svgFilePath) =>
		convertSvgToJson(svgFilePath),
	);

	await Promise.all(svgPromises);
}

await createRouteShieldIconDefinitionJsonFiles();

console.log(
	`Copying Calcite assets from ${sourceAssetsFolder} to ${destinationFolder}...`,
);

console.log("Creating destination folder if it does not already exist...");
// Create the destination folder if it doesn't exist.
await mkdir(destinationFolder, { recursive: true });

console.log("Copying asset files...");
// Copy the files from the @wsdot/web-styles package into the destination folder.
await cp(sourceAssetsFolder, destinationFolder, {
	preserveTimestamps: true,
	recursive: true,
	filter: (src) => {
		// Exclude package.json and README.md.
		return !src.endsWith("package.json") && !src.endsWith("README.md");
	},
});
