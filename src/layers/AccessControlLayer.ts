const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer");

type AheadBackIndicator = "A" | "B";

export type NonLimited = `Non Limited Access ${
	| `${"More Than " | ""}Average Restriction`
	| `${"Most" | "Less" | "Least"} Restrictive`}`;

export type Limited =
	`Limited Access ${"Fully" | "Modified" | "Partially"} Controlled`;
export type AccessControlTypeCode =
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "F"
	| "M"
	| "P";

export type AccessControlTypeDescription = Limited | NonLimited;

export const accessControlTypesMap = new Map<
	AccessControlTypeCode,
	AccessControlTypeDescription
>([
	["1", "Non Limited Access Most Restrictive"],
	["2", "Non Limited Access More Than Average Restriction"],
	["3", "Non Limited Access Average Restriction"],
	["4", "Non Limited Access Less Restrictive"],
	["5", "Non Limited Access Least Restrictive"],
	["F", "Limited Access Fully Controlled"],
	["M", "Limited Access Modified Controlled"],
	["P", "Limited Access Partially Controlled"],
]);

export interface AccessControlAttributes {
	OBJECTID?: number;
	RouteIdentifier?: string;
	BeginAccumulatedRouteMile?: number;
	EndAccumulatedRouteMile?: number;
	AccessControlTypeDescription: AccessControlTypeDescription;
	SnapshotDate?: ReturnType<Date["valueOf"]>;
	BeginStateRouteMilepost?: number;
	BeginAheadBackIndicator?: AheadBackIndicator;
	EndStateRouteMilepost?: number;
	EndAheadBackIndicator?: AheadBackIndicator;
	LRSDate?: number;
	"SHAPE.STLength()"?: number;
	AccessControlTypeCode?: AccessControlTypeCode;
}

const accessControlTitle = "Access Control";
const acDescriptionFieldName = "AccessControlTypeDescription";
const acCodeFieldName = "AccessControlTypeCode";

function createAccessControlLayer() {
	const accessControlLayerUrl =
		"https://data.wsdot.wa.gov/arcgis/rest/services/Shared/RoadwayCharacteristicData/MapServer/1";
	/**
	 * Roadway characteristics layer.
	 */
	return new FeatureLayer({
		url: accessControlLayerUrl,
		title: accessControlTitle,
		visible: false,
		outFields: [acDescriptionFieldName],
		fields: [
			{
				name: acDescriptionFieldName,
				alias: "Access Control Type",
			},
			{
				name: acCodeFieldName,
				alias: "Access Control Code",
			},
		],
	});
}

export const accessControlLayer = createAccessControlLayer();
