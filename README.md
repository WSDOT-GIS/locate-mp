# <abbr title='Washington State Department of Transportation'>WSDOT</abbr> Milepost Map repository

<!-- #region badges -->

[![Node.js CI](https://github.com/WSDOT-GIS/locate-mp/actions/workflows/node.js.yml/badge.svg)](https://github.com/WSDOT-GIS/locate-mp/actions/workflows/node.js.yml) [![pages-build-deployment](https://github.com/WSDOT-GIS/locate-mp/actions/workflows/pages/pages-build-deployment/badge.svg?branch=gh-pages)](https://github.com/WSDOT-GIS/locate-mp/actions/workflows/pages/pages-build-deployment) [![CodeQL](https://github.com/WSDOT-GIS/locate-mp/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/WSDOT-GIS/locate-mp/actions/workflows/github-code-scanning/codeql)

<!-- #endregion badges -->

This is the repository for the WSDOT Milepost map, an interactive map application for locating Mileposts along Washington's State Routes. See this [story map] for an introduction to the WSDOT <abbr title='Linear Referencing System'>LRS</abbr>.

## Modern browser required

This application makes use of the [Calcite Design System][Calcite], which is incompatible with older versions of Safari.

For the Safari web browser, version 16.4 or later is required. Any earlier versions are not supported. Since the version of Safari is tied to the version of the operating system (iOS or MacOS), users will need to upgrade their operating system to the latest version.

You would think the users could just use a different, non-Webkit browser like Firefox or Chrome. But, no. On iOS, all other browsers are forced by Apple to use the Webkit rendering engine instead of their own, so any Safari issues will also be present in the other browsers.

### Testing Safari in BrowserStack

Since Safari only is available on Apple devices, and we can't buy every possible combination of Apple device and OS version, a service like BrowserStack, or that of one of their competitors, is required to test Safari on Windows.

It is important to note that they only list the major versions of their OS/browsers omitting the minor or patch portions of the version number. So if you select Safari 16, it could be 16.3 or 16.4, but there's no way to tell which one you're getting until after the device has loaded and you can check the version number via the devices settings menu.

## Developers

### Prerequisites

- Recommended development environment is [Visual Studio Code] or [VSCodium].
- Uses [ArcGIS Maps SDK for JavaScript] for map components.
- Node 22 or higher. (Node includes NPM, which is also required.)

### Theming

This application will display either in a light or dark mode, depending on your operating system's dark mode setting.

You can use the [Color Scheme Simulator Buttons] in [Firefox Web Developer Tools] or [Chrome's Emulate CSS media feature prefers-color-scheme] to test the light and dark modes in this app.

## URL Search Parameters

## Creating Map Links

- Creating a hyperlink to a State Route location is simple. Mimic the url structure for the following link and modify the SR and MP values to your desired location. Example:
  `https://example.com/LocateMP/?SR=542&MP=57.17`
- To create a hyperlink to a route with unique directional milepost data, such as an interstate, use the following url structure. DIR represents direction. The options are I for increasing milepost or D for decreasing milepost.
  `https://example.com/LocateMP/?SR=5&MP=257.70&DIR=I`
- To create a hyperlink to a route with a specific route type, such as a "SPUR", use the following url structure. RT represents Route Type. The options are SP for Spur, CO for Couplet and AR for Alternate.
  `https://example.com/LocateMP/?SR=503&MP=35.23&RT=SP`

[ArcGIS Maps SDK for JavaScript]: https://developers.arcgis.com/javascript
[Calcite]: https://developers.arcgis.com/calcite-design-system/
[Chrome's Emulate CSS media feature prefers-color-scheme]: https://developer.chrome.com/docs/devtools/rendering/emulate-css#emulate_css_media_feature_prefers-color-scheme
[Color Scheme Simulator Buttons]: https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/examine_and_edit_css/index.html#view-media-rules-for-prefers-color-scheme
[Firefox Web Developer Tools]: https://firefox-dev.tools/
[story map]: https://storymaps.arcgis.com/stories/3563e01d91b8444f875af320564fef7b
[Visual Studio Code]: https://code.visualstudio.com/
[VSCodium]: https://vscodium.com/
