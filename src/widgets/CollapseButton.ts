import type MapView from "@arcgis/core/views/MapView";

/**
 * Sets up the sidebar collapse button in the given MapView.
 * @param view - The MapView to add the collapse button to.
 * @throws {Error} If the sidebar element cannot be found.
 */
export function setupSidebarCollapseButton(view: MapView) {
	const sideBar = document.querySelector<HTMLCalciteShellPanelElement>(
		"calcite-shell-panel#sidebar",
	);

	if (!sideBar) {
		throw new Error("Failed to find sidebar element");
	}

	const collapseButton = document.querySelector<HTMLCalciteButtonElement>(
		"calcite-button#toggleSidebarButton",
	);
	if (!collapseButton) {
		throw new TypeError("Failed to find collapse button element");
	}

	collapseButton.addEventListener("click", () => {
		sideBar.collapsed = !sideBar.collapsed;
		setSidebarToggleIcon();
	});

	// Set sidebar collapsed to false if document width is greater than or equal to 768px.
	const threshold = Number.parseInt(
		import.meta.env.VITE_WIDTH_THRESHOLD_IN_PIXELS,
		10,
	);
	if (window.outerWidth >= threshold) {
		sideBar.collapsed = false;
	}
	const setSidebarToggleIcon = () => {
		collapseButton.iconStart = sideBar.collapsed
			? "chevrons-right"
			: "chevrons-left";
	};

	// import { watch } from "@arcgis/core/core/reactiveUtils";

	// When the popup is opened, collapse the sidebar if the screen is small.
	$arcgis.import("@arcgis/core/core/reactiveUtils").then(({ watch }) => {
		watch(
			() => view.popup?.visible,
			(visible) => {
				if (visible && window.outerWidth < threshold) {
					sideBar.collapsed = true;
					setSidebarToggleIcon();
				}
			},
		);
	});

	setSidebarToggleIcon();
}
