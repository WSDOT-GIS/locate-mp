/**
 * Detects if a URL is an internal one.
 * @param url - The {@link URL} to test. Defaults to {@link location}.
 * @returns - True if the URL is determined to be internal, false otherwise.
 */
function isInternalUrl(url: Location | URL = location): boolean {
	const hostname = url.hostname;
	const urlIsInternal =
		/^localhost\b/i.test(hostname) || /\.((loc)|(internal))$/i.test(hostname);
	/* __PURE__ */ console.debug(
		`${isInternalUrl.name}: ${url} ${urlIsInternal ? "is" : "is not"} internal`,
	);
	return urlIsInternal;
}

/**
 * Test to see if the user of the browser can currently access an intranet URL.
 * @param testUrl - The URL to test
 * @returns `true` if the user can access the URL, `false` otherwise.
 */
export async function canAccessIntranet(
	testUrl = new URL("https://wwwi.wsdot.wa.gov/"),
) {
	const response = await fetch(testUrl, { method: "HEAD" });
	return response.ok;
}

if (!import.meta.env.DEV) {
	const addInternalAndOrIntranetCssClasses = async () => {
		if (isInternalUrl()) {
			document.body.classList.add("app-url-is-internal");
		}
		canAccessIntranet()
			.then((canAccess) => {
				if (canAccess) {
					document.body.classList.add("can-access-intranet");
				} else {
					/* __PURE__ */ console.debug("User cannot access intranet");
				}
			})
			.catch((error) => {
				console.error("Failed to determine if user can access intranet", error);
			});
	};

	addInternalAndOrIntranetCssClasses();
}
