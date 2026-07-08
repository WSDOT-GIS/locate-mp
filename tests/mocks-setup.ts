import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import * as elc from "../src/elc";
import { milepostsUrl } from "../src/milepost-info";
import minMaxSrmpFeatureSet from "./milepost-info-sample.json";
import routes from "./routes.json";

type ResponseResolverInfo = Parameters<Parameters<typeof http.get>[1]>[0];

function allPropertiesAreEqual(a: object, b: object) {
	return Object.keys(a).every(
		(key) =>
			(a as Record<string, unknown>)[key] ===
			(b as Record<string, unknown>)[key],
	);
}

function getResults(info: ResponseResolverInfo) {
	const options = {
		coordinates: [1083893.182, 111526.885],
		inSR: 2927,
		searchRadius: 1,
		outSR: 2927,
		lrsYear: "Current",
		routeFilter: "LIKE '005%'",
		referenceDate: "11/31/2022",
	};

	if (allPropertiesAreEqual(options, info.params)) {
		const findNearestResults = [
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

		return HttpResponse.json(findNearestResults);
	}
}

export const restHandlers = [
	http.get(elc.defaultFindNearestUrl, (info) => {
		const output = getResults(info);
		if (output) {
			return output;
		}
	}),
	http.get(elc.defaultRoutesUrl, () => {
		return HttpResponse.json(routes);
	}),
	http.get(milepostsUrl, () => {
		return HttpResponse.json(minMaxSrmpFeatureSet);
	}),
];

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => {
	server.listen({ onUnhandledRequest: "bypass" });
});

//  Close server after all tests
afterAll(() => {
	server.close();
});

// Reset handlers after each test `important for test isolation`
afterEach(() => {
	server.resetHandlers();
});
