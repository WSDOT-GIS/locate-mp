const [Point, {webMercatorToGeographic}, {on}] = await $arcgis.import([
	"@arcgis/core/geometry/Point",
	"@arcgis/core/geometry/support/webMercatorUtils",
	"@arcgis/core/core/reactiveUtils",
] as const);

/**
 * Creates a calcite-alert element.
 * @returns The created calcite-alert element.
 */
function createCalciteAlert() {
	const message = "Coordinates copied to clipboard.";
	const alert = document.createElement("calcite-alert");
	alert.kind = "success";
	alert.label = message;
	alert.scale = "s";
	alert.autoClose = true;
	alert.autoCloseDuration = "fast";
	alert.placement = "top";

	const messageElement = document.createElement("p");
	messageElement.append(message);
	messageElement.slot = "message";
	alert.append(messageElement);
	return { alert, messageElement };
}

const copyPointToClipboard = (
	point: __esri.Point,
	{ messageElement, alert }: ReturnType<typeof createCalciteAlert>,
) => {
	let projectedPoint = point;
	const { spatialReference } = point;
	if (spatialReference.isWebMercator) {
		projectedPoint = webMercatorToGeographic(point) as __esri.Point;
	} else if (!spatialReference.isWGS84) {
		throw new Error(`Unsupported spatial reference: ${spatialReference.wkid}`);
	}

	const { x, y } = projectedPoint;
	messageElement.textContent = `Copied ${[y, x].map((x) => x.toFixed(3)).join(",")} to clipboard.`;

	navigator.clipboard
		.writeText([y, x].join(","))
		.then(() => {
			alert.open = true;
		})
		.catch((error: unknown) => {
			console.error("Failed to copy coordinates.", error);
		});
};

const isPoint = (g: __esri.Geometry): g is __esri.Point => {
	return g.type === "point";
};
const isPolyline = (g: __esri.Geometry): g is __esri.Polyline => {
	return g.type === "polyline";
};

const isPolygon = (g: __esri.Geometry): g is __esri.Polygon => {
	return g.type === "polygon";
};

const isMultipoint = (g: __esri.Geometry): g is __esri.Multipoint => {
	return g.type === "multipoint";
};

/**
 * Returns the last point in the input geometry.
 * @param g A geometry from the ArcGIS API for JavaScript.
 * @returns The last point in the input geometry.
 * @throws {TypeError} If the input geometry is not a point, polyline, or polygon.
 */
const getLastPoint = (g: __esri.GeometryUnion | nullish) => {
	if (g == null) {
		return g;
	}
	if (isPoint(g)) {
		return g;
	}
	if (isMultipoint(g)) {
		const [x, y] = g.points[g.points.length - 1];
		return new Point({ x, y, spatialReference: g.spatialReference });
	}
	const pathOrRing = isPolyline(g) ? g.paths : isPolygon(g) ? g.rings : null;
	if (!pathOrRing) {
		throw new TypeError(
			"Expected geometry to be a point, polyline, or polygon.",
			{
				cause: g,
			},
		);
	}
	const [x, y] =
		pathOrRing[pathOrRing.length - 1][
			pathOrRing[pathOrRing.length - 1].length - 1
		];
	return new Point({ x, y, spatialReference: g.spatialReference });
};

/**
 * Sets up popup actions for the given map view.
 * @param view - The map view to set up popup actions for.
 */
export function setupPopupActions(view: __esri.MapView) {
	const { alert, messageElement } = createCalciteAlert();
	document.body.append(alert);

	const popupTriggerActionEventHandler: __esri.PopupTriggerActionEventHandler =
		(event) => {
			if (event.action.id === "copy") {
				try {
					const feature = view.popup?.selectedFeature;
					const lastPoint = getLastPoint(feature?.geometry);
					if (lastPoint) {
						copyPointToClipboard(lastPoint, { alert, messageElement });
					}
				} catch (error) {
					if (error instanceof Error) {
						console.error(error.message, error);
					}
					if (error instanceof TypeError) {
						messageElement.textContent = "Failed to copy coordinates.";
					} else {
						throw error;
					}
				}
			}
		};
	on(() => view.popup, "trigger-action", popupTriggerActionEventHandler);
}

export default setupPopupActions;
