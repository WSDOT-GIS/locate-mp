const { default: whiteLogoUrl } = await import(
	"@wsdot/web-styles/images/wsdot-logo/wsdot-logo-white.svg"
);
const logo = document.body.querySelector("calcite-navigation-logo");
if (logo) {
	logo.thumbnail = whiteLogoUrl;
}

export {};
