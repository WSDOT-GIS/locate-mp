import type { FormatError } from "./common/FormatError";
import type { ArcGisError, ElcError } from "./elc/errors";

// Add the elc-error custom event to the window
declare global {
	interface WindowEventMap {
		"elc-error": CustomEvent<ElcError>;
		"arcgis-error": CustomEvent<ArcGisError>;
		"format-error": CustomEvent<FormatError>;
	}
}
