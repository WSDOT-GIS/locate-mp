import { parcelsLayer as regridLayer } from "./regrid";
import { parcelsLayer as waTechParcelsLayer } from "./watech";

const GroupLayer = await $arcgis.import("@arcgis/core/layers/GroupLayer");

/**
 * Creates a group layer for parcels.
 * The group layer lets the user to choose between the WA Tech Parcels layer
 * and its fallback, the Regrid Parcels layer.
 * @returns A group layer containing the WA Tech and Regrid Parcels layers
 */
export function createParcelsGroupLayer(): InstanceType<typeof GroupLayer> {
	const groupLayer = new GroupLayer({
		title: "Parcels",
		visibilityMode: "exclusive",
		visible: false,
	});
	waTechParcelsLayer.visible = true;

	// Setup up an error handler for the frequently-failing WA Tech Parcels layer.
	// Once the error has been logged to the console, remove the error handler.
	const waTechErrorHandler = waTechParcelsLayer.on(
		"layerview-create-error",
		(event) => {
			const { error } = event;
			console.error(
				`Error creating WA Tech Parcels layer: ${error.message}`,
				event,
			);
			waTechErrorHandler.remove();
		},
	);

	groupLayer.addMany([waTechParcelsLayer, regridLayer]);
	return groupLayer;
}
