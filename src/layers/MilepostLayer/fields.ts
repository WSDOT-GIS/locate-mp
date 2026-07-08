import { objectIdFieldName } from "../../elc/types";
import type { FieldProperties } from ".";

/**
 * Field names for the milepost layer
 */
export enum fieldNames {
	Route = "Route",
	Srmp = "Srmp",
	Back = "Back",
	Direction = "Direction",
	EndSrmp = "EndSrmp",
	EndBack = "EndBack",
}

/**
 * Field definitions for the milepost layer
 */
export const fields: FieldProperties[] = [
	{
		name: objectIdFieldName,
		type: "oid",
		valueType: "unique-identifier",
	},
	{
		name: fieldNames.Route,
		type: "string",
		valueType: "name-or-title",
	},
	{
		name: fieldNames.Direction,
		type: "string",
		domain: {
			type: "coded-value",
			codedValues: [
				{
					code: "I",
					name: "Increase",
				},
				{
					code: "D",
					name: "Decrease",
				},
			],
			name: "Direction",
		},
		defaultValue: "I",
		valueType: "type-or-category",
	},
	{
		name: fieldNames.Srmp,
		type: "double",
		valueType: "measurement",
	},
	{
		name: fieldNames.Back,
		type: "string",
		valueType: "binary",
	},
];

/**
 * Field definitions for the route segments layer
 */
export const segmentFields: typeof fields = [
	...fields,
	{
		name: fieldNames.EndSrmp,
		type: "double",
		valueType: "measurement",
	},
	{
		name: fieldNames.EndBack,
		type: "string",
		valueType: "binary",
	},
];
