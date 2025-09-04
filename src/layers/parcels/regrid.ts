const [TileLayer, PortalItem] = await $arcgis.import([
	"@arcgis/core/layers/TileLayer",
	"@arcgis/core/portal/PortalItem",
] as const);

const arcGisOnlineId = "a2050b09baff493aa4ad7848ba2fac00";

/**
 * Parcels layer
 * @see {@link https://wsdot.maps.arcgis.com/home/item.html?id=9c7f4cd9a1354d8db79c471be957a0d2}
 */
export const parcelsLayer = new TileLayer({
	id: "parcels",
	// visible: false,
	portalItem: new PortalItem({
		id: arcGisOnlineId,
	}),
	listMode: "hide-children",
	legendEnabled: false,
});
