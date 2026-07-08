/// <reference types="@wsdot/arcgis-core-helper" />
/// <reference types="vitest" />

// Define $arcgis.import if it does not already exist.

if (!globalThis.$arcgis?.import) {
  /**
   * Helper function to import a single ES module and return its default export.
   * If the module does not have a default export, the entire module is returned instead.
   * @param moduleName The name of the ES module to import
   * @returns The default export of the module or the entire module if there is no default export
   */
  async function singleImportHelper(moduleName: string): Promise<unknown> {
    const result = await import(moduleName);
    return result.default ?? result;
  }

  /**
   * Helper function to import a single ES module or an array of ES modules. If only a single module name is passed, the
   * default export of that module is returned. If an array of module names is passed, an array of their default exports is
   * returned. If a module does not have a default export, the entire module is returned instead.
   * @param moduleNames The name of the ES module to import or an array of names
   * @returns The default export of the module or the entire module if there is no default export
   */
  async function importHelper(moduleNames: string | string[]) {
    if (typeof moduleNames === "string") {
      return await singleImportHelper(moduleNames);
    }
    return await Promise.all(moduleNames.map((s) => singleImportHelper(s)));
  }

  globalThis.$arcgis = { import: importHelper };
}
