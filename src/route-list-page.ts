import { getRouteList } from "./milepost-info";
import "./route-list.css";
// import "@fontsource/lato";
import "@wsdot/web-styles/css/wsdot-colors.css";
import { RouteDescription } from "wsdot-route-utils";

const routes = await getRouteList();

const routeDescriptions = routes.map((r) => {
	const { RouteID, MinSrmp, MaxSrmp, Direction } = r;
	const route = new RouteDescription(RouteID);

	const { sr, rrt, rrq, shield, rrtDescription, rrqDescription } = route;
	return {
		routeObject: route,
		route: route.toString(),
		sr,
		rrt,
		rrq,
		direction: Direction,
		shield,
		rrtDescription,
		rrqDescription,
		minSrmp: MinSrmp,
		maxSrmp: MaxSrmp,
	} as const;
});

const sortFunction = (
	a: (typeof routeDescriptions)[number],
	b: (typeof routeDescriptions)[number],
) => {
	if (a.route !== b.route) {
		return a.route.localeCompare(b.route);
	}
	if (a.rrq !== null && b.rrq !== null && a.rrq !== b.rrq) {
		return a.rrq.localeCompare(b.rrq);
	}
	if (a.rrt !== null && b.rrt !== null && a.rrt !== b.rrt) {
		return a.rrt.localeCompare(b.rrt);
	}
	if (a.direction !== b.direction) {
		return b.direction.localeCompare(a.direction);
	}
	return 0;
};
// Sort the routeDescriptions alphabetically by the "route" property, then by rrq, then by rrt.
routeDescriptions.sort(sortFunction);

const routeList =
	document.querySelector<HTMLTableSectionElement>("tbody#route-list");

if (!routeList) {
	throw new Error("Could not find element with id 'route-list'");
}

for (const routeDataRow of routeDescriptions) {
	// Create a table row using the "route-template" template and populate its slots.

	const rowElement = routeList.insertRow();

	for (const [key, value] of Object.entries(routeDataRow) as [
		keyof typeof routeDataRow,
		(typeof routeDataRow)[keyof typeof routeDataRow],
	][]) {
		if (value instanceof RouteDescription) {
			if (value.isRamp) {
				rowElement.classList.add("ramp");
			} else if (value.isMainline) {
				rowElement.classList.add("mainline");
			}
			if (value.rrt != null) {
				rowElement.classList.add(`rrt-${value.rrt}`.toLocaleLowerCase());
			}
			continue;
		}
		const cell = rowElement.insertCell();
		cell.classList.add(key);
		if (value != null) {
			if (typeof value === "number") {
				cell.append(value.toString());
			} else {
				cell.append(value);
			}
		}
	}

	routeList.append(rowElement);

	if (routeDataRow.rrt) {
		rowElement.dataset.rrt = routeDataRow.rrt;
	}
}

// Hide the progress bar and show the table.
const progress = document.querySelector("progress");
if (progress) {
	progress.remove();
}

const table = document.querySelector("table");
if (table) {
	table.removeAttribute("hidden");
}
