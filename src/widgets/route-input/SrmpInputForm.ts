import { RouteDescription } from "wsdot-route-utils";
import replaceTitleWithTooltip from "../../replace-title-with-tooltip";
import {
	getComboboxItems,
	getRoutes,
	getRoutesFromService,
} from "./createComboBoxItems";

/**
 * The object that is passed to the `srmp-input` event.
 */
export interface RouteEventObject {
	route: InstanceType<typeof RouteDescription>;
	mp: number;
	back: boolean;
	decrease: boolean;
}

export type RouteInputEvent = CustomEvent<RouteEventObject>;

/**
 * Checks if the provided event is a RouteInputEvent.
 * @param event - the event to be checked
 * @returns true if the event is a RouteInputEvent, false otherwise
 */
export function isRouteInputEvent(event: Event): event is RouteInputEvent {
	return (
		event instanceof CustomEvent &&
		event.detail != null &&
		typeof event.detail === "object" &&
		["route", "back", "mp"].every((name) => name in event.detail)
	);
}

/**
 * The supported Related Route Type (RRT) values for this application.
 */
export type RouteType = "SP" | "CO" | "AR";

interface SrmpInputFormEventMap extends HTMLElementEventMap {
	"srmp-input": RouteInputEvent;
}

/**
 * Checks if the given HTML form element implements the SrmpInputForm interface.
 * @param element - the HTML form element to be checked
 * @returns true if the element implements SrmpInputForm, false otherwise
 */
function isSrmpInputFormElement(
	element: HTMLFormElement,
): element is SrmpInputForm {
	return ["route", "mp", "back", "decrease"].every((name) => {
		const namedElement = element.querySelector(`[name='${name}']`);
		return !!namedElement;
	});
}

/**
 * The form that is used to input a route and milepost.
 */
export interface SrmpInputForm extends HTMLFormElement {
	/**
	 * The route input field.
	 */
	route: HTMLCalciteComboboxElement;
	/**
	 * The milepost input field.
	 */
	mp: HTMLCalciteInputNumberElement;
	/**
	 * The back checkbox.
	 */
	back: HTMLCalciteCheckboxElement;
	/**
	 * The decrease checkbox.
	 */
	decrease: HTMLCalciteCheckboxElement;

	/*
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLOutputElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLOutputElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
  */

	addEventListener<K extends keyof SrmpInputFormEventMap>(
		this: SrmpInputForm,
		type: K,
		listener: (this: SrmpInputForm, ev: SrmpInputFormEventMap[K]) => unknown,
		options?: boolean | AddEventListenerOptions,
	): void;

	removeEventListener<K extends keyof SrmpInputFormEventMap>(
		this: SrmpInputForm,
		type: K,
		listener: (this: SrmpInputForm, ev: SrmpInputFormEventMap[K]) => unknown,
		options?: boolean | EventListenerOptions,
	): void;
}

/**
 * Creates an SRMP input form and adds it to the specified UI at the given position.
 * @returns - The created SRMP input form
 */
export async function createSrmpInputForm() {
	const formSelector = "form#route-input-form";
	const form = document.querySelector<SrmpInputForm>(formSelector);

	if (!(form instanceof HTMLFormElement)) {
		console.error("form is not an HTMLFormElement", form);
		throw new Error("form is not an HTMLFormElement");
	}

	if (!isSrmpInputFormElement(form)) {
		throw new TypeError("Form does not implement SrmpInputForm interface");
	}

	const routeElement = form.querySelector<HTMLCalciteComboboxElement>("#routeInput");
	if (!routeElement) {
		throw new Error("route element not found");
	}
	const routeFeatures = await getRoutesFromService();
	const routes = getRoutes(routeFeatures);
	routeElement.append(...getComboboxItems(routes));

	routeElement.addEventListener("change", () => {
		form.dispatchEvent(new CustomEvent("srmp-input"));
	});

	routeElement.addEventListener("calciteComboboxChange", (event) => {
		const selectedItems = (
			event.target
		)?.selectedItems;

		if (selectedItems && selectedItems.length > 0) {
			const selectedItem = selectedItems[0];
			const lrsTypes = [...(selectedItem.dataset.directions ?? "")] as (
				| "d"
				| "i"
			)[];
			const decreaseCheckbox = form.decrease;
			if (lrsTypes.length > 1) {
				decreaseCheckbox.disabled = true;
			} else {
				decreaseCheckbox.disabled = false;
				const direction = lrsTypes[0];
				decreaseCheckbox.checked = direction === "d";
			}
		}
	});

	form.addEventListener("submit", (event) => {
		try {
			const routeId =
				typeof form.route.value === "string"
					? form.route.value
					: form.route.value[0];
			const route = new RouteDescription(routeId);
			const mp = Number.parseFloat(form.mp.value);
			const back = form.back.checked;
			const decrease = form.decrease.checked;
			const customEvent = new CustomEvent("srmp-input", {
				detail: {
					route,
					mp,
					back,
					decrease,
				},
			});
			form.dispatchEvent(customEvent);
		} finally {
			event.preventDefault();
		}
	});

	// Setup reset action so that it clears the form when clicked.
	const resetButton =
		document.body.querySelector<HTMLCalciteActionElement>("#resetFormAction");
	resetButton?.addEventListener("click", () => {
		form.reset();
	});

	// Turn off loading indicator.
	const parentBlock = form.parentElement as HTMLCalciteBlockElement | null;
	if (parentBlock && parentBlock.tagName === "CALCITE-BLOCK") {
		parentBlock.loading = false;
	}

	replaceTitleWithTooltip(form);

	return form;
}

export default createSrmpInputForm;
