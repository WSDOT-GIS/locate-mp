/**
 * Determines the host environment based on the location hostname.
 * @returns The environment type, such as QA, GitHub Pages, or Local, or null if unknown.
 */
export function getHostEnvironment() {
	if (/^[^.]+qa\b/i.test(location.hostname)) {
		return "QA";
	}
	if (/\bgithub\.io\b/i.test(location.hostname)) {
		return "GitHub Pages";
	}
	if (/^localhost\b/i.test(location.hostname)) {
		return "Local";
	}
	return null;
}

export type HostEnvironment = NonNullable<
	ReturnType<typeof getHostEnvironment>
>;

export default getHostEnvironment;
