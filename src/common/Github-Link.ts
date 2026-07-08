// import { siGithub } from "simple-icons";
// import { convertSimpleIconToSvgElement } from "./SimpleIconUtils";

/** Regexp matching a GitHub repo URL */
export const githubRepoUrlRe =
	/^https:\/\/github.com\/(?<org>[^/]+)\/(?<repo>[^/]+)/i;
/** Regexp matching a Github Pages URL */
export const githubPagesUrlRe =
	/^https:\/\/(?<org>[^/]+)\.github\.io\/(?<repo>[^/]+)/i;

export type GithubRepoUrl = `https://github.com/${string}/${string}`;
export type GithubPagesUrl = `https://${string}.github.io/${string}`;

/**
 * Tests to see if a URL is a validly-formatted GitHub URL.
 * Note: This does not check to see if the URL actually exists
 * and/or returns a success response. Only the format of the URL
 * is tested.
 * @param url - A URL to be tested
 * @returns - Returns true if the input URL is a validly-formatted
 * GitHub repository URL, false otherwise.
 */
export function isGithubRepoUrl(url: string | URL): url is GithubRepoUrl {
	return githubRepoUrlRe.test(url instanceof URL ? url.toString() : url);
}

/**
 * Tests to see if a URL is a validly-formatted GitHub Pages URL.
 * Note: This does not check to see if the URL actually exists
 * and/or returns a success response. Only the format of the URL
 * is tested.
 * @param url - A URL to be tested
 * @returns - Returns true if the input URL is a validly-formatted
 * GitHub Pages URL, false otherwise.
 */
export function isGithubPagesUrl(url: string | URL): url is GithubPagesUrl {
	return githubPagesUrlRe.test(url instanceof URL ? url.toString() : url);
}

export function getGithubUrlFromGithubPages(
	throwErrorOnMismatch: true,
	githubPagesUrl?: GithubPagesUrl,
): GithubRepoUrl;
export function getGithubUrlFromGithubPages(
	throwErrorOnMismatch?: false,
	githubPagesUrl?: GithubPagesUrl,
): GithubRepoUrl | null;
/**
 * Get the source URL of a Github Pages page.
 * @param throwErrorOnMismatch - If true, throw an error if URL can't
 * be parsed. Otherwise, null will be returned.
 * @param githubPagesUrl - The URL to convert. Optional in browsers,
 * where it will default to {@link location.href}
 * @returns A URL
 */
export function getGithubUrlFromGithubPages(
	throwErrorOnMismatch?: boolean,
	githubPagesUrl?: GithubPagesUrl,
): GithubRepoUrl | null {
	const currentUrl = githubPagesUrl ?? location.href;
	const match = githubPagesUrlRe.exec(currentUrl);
	if (!match) {
		if (throwErrorOnMismatch) {
			throw new Error("Could not parse source URL from this page");
		}
		return null;
	}
	const [org, repo] = [...match].slice(1).map((s) => s.toLowerCase());
	return `https://github.com/${org}/${repo}`;
}

export function getGithubPagesUrlFromGithubRepoUrl(
	throwErrorOnMismatch: true,
	githubRepoUrl?: GithubRepoUrl,
): GithubPagesUrl;
export function getGithubPagesUrlFromGithubRepoUrl(
	throwErrorOnMismatch?: false,
	githubRepoUrl?: GithubRepoUrl,
): GithubPagesUrl | null;
/**
 * Get the Github Pages URL for the given repo
 * @param throwErrorOnMismatch - If true, throw an error if URL can't
 * @param githubRepoUrl - The URL to convert. Optional in browsers,
 * where it will default to {@link location.href}.
 * be parsed. Otherwise, null will be returned.
 * @returns A URL
 */
export function getGithubPagesUrlFromGithubRepoUrl(
	throwErrorOnMismatch?: boolean,
	githubRepoUrl?: GithubRepoUrl,
): GithubPagesUrl | null {
	const currentUrl = githubRepoUrl ?? location.href;
	const match = githubRepoUrlRe.exec(currentUrl);
	if (!match) {
		if (throwErrorOnMismatch) {
			throw new Error("Could not parse repo URL");
		}
		return null;
	}
	const [org, repo] = [...match].slice(1).map((s) => s.toLowerCase());
	return `https://${org}.github.io/${repo}`;
}

/**
 * Create a link to GitHub source code.
 * @param fallbackUrl - If page isn't hosted on GitHub pages, this URL
 * will be used.
 * @returns An HTML anchor linking to app source code.
 */
export function createGithubLink(
	fallbackUrl = "https://github.com/wsdot-gis/locate-mp",
) {
	// const githubSvg = convertSimpleIconToSvgElement(siGithub);
	const a = document.createElement("a");
	// a.append(githubSvg);
	a.textContent = "Source code";
	a.href = getGithubUrlFromGithubPages() ?? fallbackUrl;
	a.target = "_blank";
	return a;
}
