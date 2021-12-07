const fs = require("fs");
const ut = require("./util.js");

let swFiles = [];
const _addSwFilenames = (list) => swFiles = swFiles.concat(list.map(it => `/${it}`));

const cssFiles = ut.listFiles({dir: "css", whitelistFileExts: [".css"]});
_addSwFilenames(cssFiles);

const fontFiles = ut.listFiles({dir: "fonts", whitelistFileExts: [".ttf", ".eot", ".woff", ".woff2", ".svg"]});
_addSwFilenames(fontFiles);

const homebrewFiles = ut.listFiles({dir: "homebrew", whitelistFileExts: ["index.json"]});
_addSwFilenames(homebrewFiles);

// const iconFiles = ut.listFiles({dir: "icon", whitelistFileExts: [".png", ".jpg", ".jpeg", ".svg", ".gif"]});
// _addSwFilenames(iconFiles);

if (fs.existsSync("img")) {
	const imgFiles = ut.listFiles({dir: "img", whitelistFileExts: [".png", ".jpg", ".jpeg", ".svg", ".gif"]});
	_addSwFilenames(imgFiles);
}

const jsFiles = ut.listFiles({dir: "js", whitelistFileExts: [".js"]});
_addSwFilenames(jsFiles);

const libFiles = ut.listFiles({dir: "lib", whitelistFileExts: [".js"]});
_addSwFilenames(libFiles);

const searchFiles = ut.listFiles({dir: "search", whitelistFileExts: [".json"]});
_addSwFilenames(searchFiles);

const rootFiles = ut.listFiles({dir: ".", whitelistFileExts: [".html", ".webmanifest", ".png"], whitelistDirs: []})
	.map(it => it.substring(2));
_addSwFilenames(rootFiles);

// Add prod/CDN files
swFiles = swFiles.concat([
	"/js/header.js",
	"/js/shared.js",
	"https://cdn.jsdelivr.net/combine/npm/jquery@3.4.1/dist/jquery.min.js,gh/weixsong/elasticlunr.js@0.9/elasticlunr.min.js",
]);

fs.writeFileSync("./js/sw-files.js", `this.filesToCache = ${JSON.stringify(swFiles)};`, "utf-8");
