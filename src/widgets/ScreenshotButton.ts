import type MapView from "@arcgis/core/views/MapView";

/**
 * Creates the controls for the screenshot button.
 * @param view - The current map view.
 * @returns - An object with the following properties:
 *  - fragment: The document fragment containing the controls.
 *  - widthBox: The calcite-input-number element for the width.
 *  - heightBox: The calcite-input-number element for the height.
 */
function createControls(view: MapView) {
	const [widthBox, heightBox] = (["width", "height"] as const).map((name) => {
		const box = document.createElement("calcite-input-number");

		box.name = name;
		box.value = view[name].toString();
		box.placeholder = name;

		box.step = 1;
		box.min = 1;

		return box;
	});

	const widthLabel = document.createElement("calcite-label");
	const heightLabel = document.createElement("calcite-label");
	widthLabel.append("Width", widthBox);
	heightLabel.append("Height", heightBox);

	widthLabel.layout = "inline";
	heightLabel.layout = "inline";

	const fragment = document.createDocumentFragment();
	fragment.append(widthLabel, heightLabel);
	return {
		fragment,
		widthBox,
		heightBox,
	};
}

type TakeScreenshotOptions = NonNullable<
	Parameters<InstanceType<typeof MapView>["takeScreenshot"]>[0]
>;

/**
 * Creates and displays a dialog containing a screenshot of the current map view.
 * The dialog is removed from the DOM when closed.
 * @param view - The MapView instance from which the screenshot is captured.
 * @returns The created calcite-dialog element.
 */
const createDialog = (view: MapView) => {
	const dialog = document.createElement("calcite-dialog");
	dialog.heading = "Screenshot";
	dialog.description = "Right click on the map image copy or save";
	dialog.id = "screenshotDialog";
	dialog.modal = true;
	document.body.append(dialog);
	const img = document.createElement("img");
	dialog.append(img);

	const { fragment, widthBox, heightBox } = createControls(view);
	dialog.append(fragment);

	/**
	 * Captures a screenshot of the current map view and updates the dialog with it.
	 * The screenshot is taken at the dimensions specified in the options object.
	 * If options.width or options.height is not specified, the screenshot is taken at the current size of the MapView.
	 * @param options - Options for taking the screenshot, see {@link https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html#takeScreenshot | MapView.takeScreenshot}
	 */
	async function updateScreenshot(
		options: Pick<TakeScreenshotOptions, "width" | "height">,
	) {
		const screenshotOptions: TakeScreenshotOptions = {
			format: "png",
			ignoreBackground: true,
			width: options.width ?? view.width,
			height: options.height ?? view.height,
		};
		const screenshot = await view.takeScreenshot(screenshotOptions);
		img.src = screenshot.dataUrl;
		img.alt = "Screenshot";
		img.style.maxWidth = `${view.width * 0.5}px`;
		img.style.maxHeight = `${view.height * 0.5}px`;
	}

	/**
	 * Listens to changes in the width and height inputs and updates the
	 * screenshot image accordingly.
	 * @param this - The input element that triggered the event.
	 * @param _ev - The input event. Not used.
	 */
	function updateScreenshotListener(this: HTMLInputElement, _ev: Event) {
		updateScreenshot({
			width: Number.parseInt(widthBox.value, 10),
			height: Number.parseInt(heightBox.value, 10),
		});
	}

	for (const box of [widthBox, heightBox]) {
		box.addEventListener("input", updateScreenshotListener);
	}

	updateScreenshot(view);

	dialog.addEventListener("close", () => {
		dialog.remove();
	});

	dialog.open = true;
	return dialog;
};

/**
 * Sets up a screenshot button in the provided MapView.
 * When clicked, the button captures a screenshot of the map view and
 * downloads it as a PNG file.
 *
 * @param mapView - The MapView to which the screenshot button will be added.
 * @returns The created calcite-button element.
 */
export async function setupScreenshotButton(mapView: MapView) {
	await mapView.when();

	const screenshotButton = document.querySelector<HTMLCalciteButtonElement>(
		"calcite-button#screenshot-button",
	);
	if (!screenshotButton) {
		throw new TypeError("Screenshot button not found")
	}


	const buttonEventListener: NonNullable<
		typeof screenshotButton.onclick
	> = () => {
		createDialog(mapView);
		// mapView
		// 	.takeScreenshot({
		// 		format: "png",
		// 		ignoreBackground: true,
		// 	})
		// 	.then((screenshot) => {
		// 		const link = document.createElement("a");
		// 		link.download = "screenshot.png";
		// 		link.href = screenshot.dataUrl;
		// 		link.click();
		// 	});
	};

	screenshotButton.addEventListener("click", buttonEventListener);

	return screenshotButton;
}
