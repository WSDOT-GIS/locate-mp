import type MapView from "@arcgis/core/views/MapView";
import "@fontsource/inconsolata";
import "@fontsource/lato";
import "@wsdot/web-styles/css/wsdot-colors.css";
import type { AnalyticsInstance } from "analytics";
import { addGraphicsToLayer } from "./addGraphicsToLayer";
import { createErrorAlert } from "./createElcErrorAlert";
import { findNearestRouteLocations } from "./elc";
import { routeLocationToGraphic } from "./elc/arcgis";
import { callElcFromUrl } from "./elc/url";
import { emitErrorEvent } from "./errorEvent";
import type { HostEnvironment } from "./getHostEnvironment";
import {
	setupMPUrlParamsUpdate,
	updateUrlSearchParams,
} from "./history-api/url-search";
import { setupInterceptors } from "./interceptors";
import { createMilepostLineLayer } from "./layers/MilepostLayer/milepost-line-layer";
import { createMilepostPointLayer } from "./layers/MilepostLayer/milepost-point-layer";
import { createParcelsGroupLayer } from "./layers/parcels";
import { tempLayer } from "./layers/TempLayer";
import { hasXAndY, isGraphicHit, UIAddPositions } from "./types";
import waExtent from "./WAExtent";
import { setupSidebarCollapseButton } from "./widgets/CollapseButton";

import("./urls/isIntranet.ts");

const [{ whenOnce }, Graphic, Polyline, Viewpoint, config] =
	await $arcgis.import([
		"@arcgis/core/core/reactiveUtils",
		"@arcgis/core/Graphic",
		"@arcgis/core/geometry/Polyline",
		"@arcgis/core/Viewpoint",
		"@arcgis/core/config",
	] as const);

let analytics: AnalyticsInstance | null = null;
import("./setupAnalytics")
	.then(({ default: a }) => {
		analytics = a;
		analytics?.page();
	})
	.catch((reason) => {
		console.error("Failed to load Tag Manager", reason);
	});

document
	.querySelector("arcgis-map")
	?.addEventListener("arcgisViewReadyChange", (event) => {
		/**
		 * Get a reference to the `WebMap`
		 * from the `event.detail` object.
		 */
		const { map, view } = event.target;
		// Add more functionality here.

		/* __PURE__ */ console.log("Map loaded", map);

		function convertToClassName(environment: HostEnvironment) {
			return environment.replaceAll(/\s/g, "_").toLowerCase();
		}

		/**
		 * Updates the document title and page title to indicate the current non-production environment.
		 * @returns In a non-production environment, the environment name. Otherwise, null.
		 */
		const updateNonProductionTitle = async () => {
			const { getHostEnvironment } = await import("./getHostEnvironment.ts");
			const environment = getHostEnvironment();
			// Exit if non-production environment was not detected.
			if (!environment) {
				return environment;
			}

			const suffix = ` - ${environment}`;
			document.title += suffix;

			const className = convertToClassName(environment);

			document.body.classList.add(className);

			// Update the title displayed on the page.
			const titleSelector = "wsdot-header > [slot='title']";
			const titleElement = document.body.querySelector(titleSelector);
			if (!titleElement) {
				console.debug("Could not find title element in wsdot-header", {
					selector: titleSelector,
				});
			} else {
				titleElement.append(suffix);
			}

			return environment;
		};

		// Update title to show user is using a non-production environment.
		updateNonProductionTitle();

		$arcgis
			.import("@arcgis/core/kernel")
			.then(({ fullVersion }) => {
				console.debug(`ArcGIS Maps SDK for JavaScript version ${fullVersion}`);
			})
			.catch((reason: unknown) => {
				console.warn("Failed to get ArcGIS JS API version", reason);
			});

		setupInterceptors();

		// Show a warning to users who are using an outdated browser.
		import("browser-update")
			.then(({ default: browserUpdate }) => {
				browserUpdate();
			})
			.catch((reason: unknown) => {
				console.error("Failed to setup browser update", reason);
			});

		window.addEventListener("elc-error", (event) => {
			const reason = event.detail;
			createErrorAlert(reason);
		});

		window.addEventListener("format-error", (event) => {
			const reason = event.detail;
			createErrorAlert(reason);
		});

		const defaultSearchRadius = 3000;

		const elcMainlinesOnlyFilter =
			"LIKE '___' OR RelRouteType IN ('SP', 'CO', 'AR')";

		/**
		 * Opens a popup with the features that were hit by the hit test.
		 * @param hits - An array of graphic hits.
		 * @param view - The map view.
		 */
		function openPopup(hits: __esri.GraphicHit[], view: MapView) {
			/* __PURE__ */ console.debug("openPopup", {
				hits: hits.map((h) => h.graphic.toJSON() as unknown),
			});
			function extractGraphic(graphicHit: __esri.GraphicHit): __esri.Graphic {
				const { graphic } = graphicHit;
				return graphic;
			}
			// Get the features that were hit by the hit test.
			const features = hits.map(extractGraphic);
			function updateUrlSearch() {
				/* __PURE__ */ console.group(
					"updateUrlSearch",
					features.map((f) => f.toJSON()),
				);
				try {
					const routeLocation = features
						.map(
							(f) =>
								f.attributes as Record<
									string,
									string | number | undefined | null
								> & {
									Back: string;
									Route: string;
									Srmp: number;
									Direction: string;
									EndSrmp: number;
									EndBack: string;
								},
						)
						.at(0);

					if (!routeLocation) {
						console.error("Could not find route location");
						return;
					}

					updateUrlSearchParams(routeLocation);
				} finally {
					/* __PURE__ */ console.groupEnd();
				}
			}
			/* __PURE__ */ console.debug("about to open popup", {
				features: features.map((f) => f.toJSON() as unknown),
			});
			view
				.openPopup({
					features,
					updateLocationEnabled: true,
					shouldFocus: true,
				})
				.then(updateUrlSearch)
				.catch((reason: unknown) => {
					console.error("openPopup failed", reason);
				});
		}

		function testWebGL2Support() {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (window.WebGL2RenderingContext) {
				return true;
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			}
			if (window.WebGLRenderingContext && !window.WebGL2RenderingContext) {
				console.error(
					"your browser has WebGL support, but no WebGL2 support at all",
				);
			} else {
				console.error("your browser has no WebGL support at all");
			}
			return false;
		}

		if (!testWebGL2Support()) {
			// Get the contents of the no-webgl template and replace the document body with them.
			const template = document.getElementById(
				"no-webgl",
			) as HTMLTemplateElement;
			document.body.innerHTML = template.innerHTML;
		} else {
			import("./components/disclaimer")
				.then(({ setupDisclaimerLink }) => {
					// Setup disclaimer modal
					const link =
						document.querySelector<HTMLAnchorElement>("wsdot-footer");
					if (!link) {
						console.error("Failed to find disclaimer link");
					} else {
						setupDisclaimerLink(link);
					}
				})
				.catch((error: unknown) => {
					console.error("Failed to load disclaimer", error);
				});

			/**
			 * A function that handles the event of finding the nearest route location
			 * when the user clicks on the map.
			 * @param event - the event object containing map click details
			 * @returns - a promise that resolves to an array of {@link RouteLocation|RouteLocations}
			 */
			async function callFindNearestRouteLocation(
				event: __esri.ViewClickEvent,
			) {
				/* __PURE__ */ console.group(callFindNearestRouteLocation.name);
				const { x, y, spatialReference } = event.mapPoint;
				const locations = await findNearestRouteLocations({
					coordinates: [x, y],
					inSR: spatialReference.wkid ?? view.spatialReference.wkid ?? 3857,
					referenceDate: new Date(),
					routeFilter: elcMainlinesOnlyFilter,
					searchRadius: defaultSearchRadius,
				});
				const location = locations[0];

				if (location instanceof Error) {
					throw location;
				}

				const locationGraphic = routeLocationToGraphic(location);

				if (locationGraphic.geometry == null) {
					throw new TypeError(
						"locationGraphic.geometry should not be null or undefined",
					);
				}
				/*
					A point geometry will be converted to a polyline geometry,
					with the start point being the click location and the end point
					being the milepost location.
					*/
				if (hasXAndY(locationGraphic.geometry)) {
					const { x: routeX, y: routeY } = locationGraphic.geometry;
					locationGraphic.geometry = new Polyline({
						paths: [
							[
								[x, y],
								[routeX, routeY],
							],
						],
						spatialReference,
					});
				} else if (!locationGraphic.geometry) {
					throw new TypeError("locationGraphic.geometry should not be null");
				}

				const layer = milepostLineLayer;

				/* __PURE__ */ console.debug(
					"location graphic",
					locationGraphic.toJSON(),
				);
				addGraphicsToLayer(layer, [locationGraphic])
					.then((addResults) => {
						/* __PURE__ */ console.debug(
							"addResults returned by addGraphicsToLayer",
							addResults,
						);
					})
					.catch((error: unknown) => {
						console.error("addGraphicsToLayer failed", error);
					});
				return locations;
			}

			config.applicationName = "WSDOT Mileposts";
			config.log.level = import.meta.env.DEV ? "info" : "error";

			const { request } = config;
			// This app only uses publicly available map services,
			// so we don't need to use identity.
			request.useIdentity = false;
			// Initialize httpDomains array if it does not already have a value.
			if (!request.httpsDomains) {
				request.httpsDomains = [];
			}
			request.httpsDomains.push("wsdot.wa.gov", "data.wsdot.wa.gov");

			const milepostPointLayer = createMilepostPointLayer(
				waExtent.spatialReference,
			);
			const milepostLineLayer = createMilepostLineLayer(
				waExtent.spatialReference,
			);

			// Show the instructions alert once the mileposts layer has been loaded.
			milepostPointLayer.on("layerview-create", () => {
				const alert =
					document.body.querySelector<HTMLCalciteAlertElement>(
						"#instructionsAlert",
					);
				if (alert) {
					alert.open = true;
				}
				setupMPUrlParamsUpdate(view);
			});

			map?.add(createParcelsGroupLayer());

			import("./widgets/ScreenshotButton").then(({ setupScreenshotButton }) => {
				setupScreenshotButton(view);
			});

			import("./setupPopupActions")
				.then(({ setupPopupActions }) => {
					setupPopupActions(view);
				})
				.catch((error: unknown) => {
					console.error("Failed to setupPopupActions.", error);
				});

			try {
				setupSidebarCollapseButton(view);
			} catch (error) {
				console.error("Failed to setup sidebar collapse button.", error);
			}

			whenOnce(() => map?.initialized)
				.then(() => {
					const shell = document.querySelector<HTMLElement>("calcite-shell");
					const loader = document.querySelector<HTMLElement>("calcite-loader");
					if (!!shell && !!loader) {
						shell.hidden = false;
						loader.hidden = true;
					}
				})
				.catch((error: unknown) => {
					console.error("Failed to initialize map.", error);
				});

			// Add the loading indicator widget to the map.
			import("./widgets/LoadingIndicator").then(
				({ setupViewLoadingIndicator }) => setupViewLoadingIndicator(view),
				(reason: unknown) => {
					console.error("Failed to add loading indicator", reason);
				},
			);

			// When the view's popup has been created, enable the default popup template.
			whenOnce(() => view.popup).then((popup) => {
				popup.defaultPopupTemplateEnabled = true;
			});

			// const searchGroup = new Expand({
			// 	icon: "search",
			// 	content: setupSearch(view),
			// });
			// view.ui.add(searchGroup, {
			// 	index: 0,
			// 	position: UIAddPositions.topTrailing,
			// });

			// setupLayerList({ view, container: "layerlist" }).catch(
			// 	(reason: unknown) => {
			// 		console.error("Failed to setup layer list", reason);
			// 	},
			// );

			// const home = new Home({
			// 	view,
			// });
			import("./widgets/ClearButton").then(
				({ createClearButton }) => {
					const clearButton = createClearButton({
						layers: [milepostPointLayer, milepostLineLayer, tempLayer],
					});
					view.ui.add([clearButton], UIAddPositions.topLeading);
				},
				(reason: unknown) => {
					console.error("Failed to setup clear button", reason);
				},
			);

			/**
			 * Handle the click event on the view.
			 * @param event - The click event on the view.
			 */
			const handleViewOnClick: __esri.ViewClickEventHandler = (event) => {
				/**
				 * If the hit test results are not graphic hits, call
				 * {@link findNearestRouteLocations}. Otherwise, open the popup.
				 * @param hitTestResult - The hit test results
				 */
				const handleHitTestResult = async (
					hitTestResult: __esri.HitTestResult,
				) => {
					// Filter out hit test results that are not graphic hits.
					const graphicHits = hitTestResult.results.filter(isGraphicHit);

					// If the user clicked on a graphic, open its popup.
					if (graphicHits.length > 0) {
						openPopup(graphicHits, view);
						return;
					}

					// Add graphic to temp layer

					const tempGraphic = new Graphic({
						geometry: event.mapPoint,
					});

					const tempAddResults = await tempLayer.applyEdits({
						addFeatures: [tempGraphic],
					});
					for (const addResult of tempAddResults.addFeatureResults) {
						// addResult.error CAN be null. Esri's type def. is wrong.
						if (addResult.error != null) {
							console.error(
								"There was an error adding the temporary graphic where the user clicked.",
								addResult.error,
							);
						}
					}

					// Call findNearestRouteLocations
					try {
						await callFindNearestRouteLocation(event);
						removeTempGraphic().catch((reason: unknown) => {
							console.error("Failed to remove temporary graphic", reason);
						});
					} catch (error) {
						const message =
							"Could not find a route location near this location.";

						console.error(message, error);

						const handleError = (reason: unknown) => {
							console.error("Failed to remove temporary graphic", reason);
						};

						view
							.openPopup({
								title: "Route Location Not Found",
								content: message,
								location: event.mapPoint,
							})
							.catch((reason: unknown) => {
								console.error(`Popup with message "${message}" failed.`, {
									reason,
									event,
								});
							})
							.finally(() => {
								removeTempGraphic().catch(handleError);
							});
					}

					/**
					 * Removes the temporary graphic.
					 * @returns - a promise that resolves when the graphic is removed.
					 */
					function removeTempGraphic() {
						// Remove the temporary graphic
						return tempLayer.applyEdits({
							deleteFeatures: [tempGraphic],
						});
					}
				};
				view
					.hitTest(event, {
						include: [milepostPointLayer, milepostLineLayer],
					})
					.then(handleHitTestResult)
					.catch((reason: unknown) => {
						console.error("hitTest failed", reason);
					});
			};
			view.on("click", handleViewOnClick);

			// Set up the form for inputting SRMPdata.
			import("./setupForm")
				.then(({ setupForm }) => setupForm(view, milepostPointLayer))
				.catch((reason: unknown) => {
					console.error("failed to setup form", reason);
				});

			if (import.meta.env.DEV) {
				(async (...layers: __esri.FeatureLayer[]) => {
					await Promise.all(layers.map((l) => l.when()));
					const { createExportButton } = await import("./widgets/ExportButton");
					const button = await createExportButton(layers);
					view.ui.add(button, {
						index: 6,
						position: "top-leading",
					});
				})(milepostLineLayer, milepostPointLayer);
			}

			Promise.all([milepostPointLayer.when(), milepostLineLayer.when()]).then(
				() => {
					/**
					 * Calls the ELC API to retrieve graphics from the URL and adds them to the milepost layer.
					 * @returns A promise that resolves when the graphics have been added to the layer and the view has been updated.
					 */
					const callElc = async () => {
						// Call the features from the URL and add them to the layer.
						const addedFeatures = await callElcFromUrl(
							milepostPointLayer,
							milepostLineLayer,
						);
						if (addedFeatures) {
							// Zoom to the first feature (if any are in the array).
							// Only expecting to ever be a single feature present.
							const feature = addedFeatures.at(0);
							if (feature) {
								const targetGeometry = feature?.geometry;

								/**
								 * The zoom target.
								 *
								 * Geometry Type           | Zoom Target
								 * ------------------------|-----------------------------------
								 * point                   | A viewpoint with a specified scale
								 * polyline (or non-point) | The feature itself.
								 */
								let goToTarget2D: __esri.Graphic | __esri.Viewpoint = feature;

								if (targetGeometry?.type === "point") {
									const scale = Number.parseFloat(
										import.meta.env.VITE_ZOOM_SCALE,
									);
									goToTarget2D = new Viewpoint({
										scale,
										targetGeometry: targetGeometry,
									});
								}

								await view.goTo(goToTarget2D, {
									animate: false,
								});
							}

							view
								.openPopup({
									features: addedFeatures,
								})
								.catch((reason: unknown) => {
									console.error("Failed to open popup", reason);
								});
						}
					};
					callElc().catch((reason: unknown) => {
						emitErrorEvent(reason);
					});
				},
			);
		}
	});
