const LocatorSearchSource = await $arcgis.import(
	"@arcgis/core/widgets/Search/LocatorSearchSource",
);

/**
 * Retrieves the search sources for the application.
 * @returns An array containing the {@link LocatorSearchSource} for WA location search.
 */
function getSearchSources() {
	const waLocationSearchSource = new LocatorSearchSource({
		// Use the WSDOT Customized view of the Geocoder
		url: "https://utility.arcgis.com/usrsvcs/servers/a86fa8aeabdd470792022a8ef959afb6/rest/services/World/GeocodeServer",
		name: "ArcGIS World Geocode Service",
		locationType: "street",
		// Probably don't need to specify US since an extent is already specified in the view
		// that the URL points to, but shouldn't harm anything.
		countryCode: "US",
		suggestionsEnabled: true,
		// Show a graphic for the location, zoom to it, and open its popup.
		popupEnabled: true,
		autoNavigate: true,
		resultGraphicEnabled: true,
		placeholder: "Find address or place",
		singleLineFieldName: "SingleLine",
	});

	return [waLocationSearchSource];
}

/**
 * Dynamically imports the "Search" widget module and creates a Search widget.
 * @param view - The map or scene view.
 * @returns A Search widget.
 */
export function setupSearch() {
	const searchElement = document.querySelector("arcgis-search");
	if (!searchElement) {
		throw TypeError("Could not find arcgis-search element");
	}
	searchElement.addEventListener("arcgisReady", ({ target: search }) => {
		const searchSources = getSearchSources();
		search.sources.push(...searchSources);
	});
}

export default setupSearch;
