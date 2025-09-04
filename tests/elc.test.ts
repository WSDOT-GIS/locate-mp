import { describe, test } from "vitest";
import { findNearestRouteLocations, getRoutes } from "../src/elc";
import { routeLocationToGraphic } from "../src/elc/arcgis";
import {
	type DateString,
	type FindNearestRouteLocationParameters,
	isDateString,
	type RouteGeometryPoint,
	type RouteLocation,
} from "../src/elc/types";
import { hasXAndY } from "../src/types";

const [Graphic, Point] = await $arcgis.import([
	"@arcgis/core/Graphic",
	"@arcgis/core/geometry/Point",
] as const);

describe.concurrent(
	"elc",
	{
		timeout: 2 * 60 * 1_000,
		retry: 3,
	},
	() => {
		test("findNearestRouteLocations", async ({ expect }) => {
			const options: FindNearestRouteLocationParameters = {
				coordinates: [1083893.182, 111526.885],
				inSR: 2927,
				searchRadius: 1,
				outSR: 2927,
				lrsYear: "Current",
				routeFilter: "LIKE '005%'",
				referenceDate: new Date(2022, 11, 31),
			};

			const result = await findNearestRouteLocations(options);

			const expectedResult = [
				{
					Angle: 155.47073472103284,
					Arm: 0,
					ArmCalcReturnCode: 0,
					ArmCalcReturnMessage: null,
					Back: false,
					Decrease: false,
					Distance: 0,
					EventPoint: {
						x: 1083893.182,
						y: 111526.885,
					},
					Id: 0,
					RealignmentDate: "1/1/2019",
					ReferenceDate: "12/31/2022",
					ResponseDate: "12/31/2022",
					Route: "005",
					RouteGeometry: {
						__type: "Point:#Wsdot.Geometry.Contracts",
						spatialReference: {
							wkid: 2927,
						},
						x: 1083893.18192406,
						y: 111526.88500547409,
					},
					Srmp: 0,
				},
			];

			expect(result).toBeInstanceOf(Array);
			expect(result).toHaveLength(1);

			const actual = result[0];
			const expected = expectedResult[0];

			expect(actual).not.instanceOf(Error);

			if (actual instanceof Error) {
				throw actual;
			}

			if (!(actual instanceof Error)) {
				expect(actual.Distance).toEqual(expected.Distance);
				expect(actual.EventPoint);
				expect(actual.EventPoint?.x).toEqual(expected.EventPoint.x);
				expect(actual.EventPoint?.y).toEqual(expected.EventPoint.y);
				expect(actual.Id).toEqual(expected.Id);

				expect(isDateString(actual.RealignmentDate)).toBe(true);
				expect(isDateString(actual.ReferenceDate)).toBe(true);
				expect(isDateString(actual.ResponseDate)).toBe(true);

				expect(actual.Route).toEqual(expected.Route);
				expect(actual.RouteGeometry?.__type).toEqual(
					expected.RouteGeometry.__type,
				);
				expect(actual.RouteGeometry?.spatialReference.wkid).toEqual(
					expected.RouteGeometry.spatialReference.wkid,
				);
				expect(hasXAndY(actual.RouteGeometry)).toBe(true);
				// TypeScript doesn't detect the hasXAndY
				if (!hasXAndY(actual.RouteGeometry)) {
					throw new Error("RouteGeometry should have x and y properties");
				}
				expect(actual.RouteGeometry.x).toBeCloseTo(expected.RouteGeometry.x);
				expect(actual.RouteGeometry.y).toBeCloseTo(expected.RouteGeometry.y);
				expect(actual.Srmp).toEqual(expected.Srmp);
				expect(actual.Angle).toEqual(expected.Angle);
				expect(actual.Arm).toEqual(expected.Arm);
				expect(actual.ArmCalcReturnCode).toEqual(expected.ArmCalcReturnCode);
				expect(actual.ArmCalcReturnMessage).toEqual(
					expected.ArmCalcReturnMessage,
				);
			}
		});

		test("getRoutes", async ({ expect }) => {
			const result = await getRoutes();
			expect(result).not.toBeNull();
			expect(result).toHaveProperty("Current");
			const currentYear = result.Current;
			expect(currentYear).toBeTypeOf("object");
		});
	},
);

describe.concurrent("arcgis", () => {
	test("creates a Graphic with correct geometry from a valid RouteLocation", ({
		expect,
	}) => {
		const routeLocation: RouteLocation<DateString, RouteGeometryPoint> = {
			RouteGeometry: {
				x: -122.431297,
				y: 37.773972,
				spatialReference: { wkid: 4326 },
			},
			//... other necessary RouteLocation properties with valid data
		};

		const graphic = routeLocationToGraphic(routeLocation);
		expect(graphic).toBeInstanceOf(Graphic);
		expect(graphic.geometry).toBeInstanceOf(Point);
		if (graphic.geometry instanceof Point) {
			expect(graphic.geometry.x).toBe(routeLocation.RouteGeometry?.x);
			expect(graphic.geometry.y).toBe(routeLocation.RouteGeometry?.y);
			expect(graphic.geometry.spatialReference.wkid).toEqual(
				routeLocation.RouteGeometry?.spatialReference.wkid,
			);
		}
	});
});
