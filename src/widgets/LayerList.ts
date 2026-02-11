import type { LayerListProperties } from "@arcgis/core/widgets/LayerList";
import type ListItem from "@arcgis/core/widgets/LayerList/ListItem";
import type ListItemPanel from "@arcgis/core/widgets/LayerList/ListItemPanel";
import type { ListItemModifier } from "@arcgis/core/widgets/LayerList/types";
import type { ArcgisLayerList } from "@arcgis/map-components/components/arcgis-layer-list";

interface LayerListItemCreateEvent {
	item: ListItem;
}

/**
 * Checks if the provided event is a {@link LayerListItemCreateEvent}.
 * @param event - an event object
 * @returns - true if the event is a {@link LayerListItemCreateEvent}, false otherwise
 */
function hasListItem(event: unknown): event is LayerListItemCreateEvent {
	return !!event && Object.hasOwn(event, "item");
}

/**
 * Performs further setup tasks on a layer list item, such as adding a legend.
 * @param event - Layer list item creation event object,
 * which contains an "item" {@link ListItem} property.
 */
const setupLayerListItems: ListItemModifier = (event) => {
	if (!hasListItem(event)) {
		throw new TypeError(
			"Expected event object to have an item property with a ListItem value",
		);
	}
	// Add a legend to the list item panel
	event.item.panel = {
		content: "legend",
	} as ListItemPanel;
};

/**
 * Set up widgets for the given view using the provided options.
 * @param layerListProperties - The properties for the layer list widget.
 * @returns - The layer list widget.
 */
export async function setupLayerList(
	layerListProperties: LayerListProperties &
		Required<Pick<LayerListProperties, "view">>,
) {

	const layerList = document.querySelector<ArcgisLayerList>("#arcgis-layer-list")
	layerList?.addEventListener("arcgisReady", function(this, event) {
		event.target.listItemCreatedFunction = setupLayerListItems;
	})
	// const LayerList = await $arcgis.import("@arcgis/core/widgets/LayerList");
	// const defaultLLProperties: LayerListProperties = {
	// 	listItemCreatedFunction: setupLayerListItems,
	// 	visibilityAppearance: "checkbox",
	// 	visibleElements: {
	// 		errors: true,
	// 		statusIndicators: true,
	// 	},
	// };

	// const layerList = new LayerList({
	// 	...defaultLLProperties,
	// 	...layerListProperties,
	// });

	return layerList;
}
