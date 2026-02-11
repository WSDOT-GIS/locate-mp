import type ArcgisConfig from "@arcgis/core/config";
import type { Alert } from "@esri/calcite-components/components/calcite-alert";

type LogConfig = (typeof ArcgisConfig)["log"];

export type LogLevel = NonNullable<LogConfig["level"]>;

export const levelKindMap: Map<LogLevel, Alert["kind"]> = new Map([
	["error", "danger"],
	["warn", "warning"],
	["info", "info"],
] as const);


export default levelKindMap;
