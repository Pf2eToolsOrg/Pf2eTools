const fs = require("fs");
const ut = require("./util.js");

let swFiles = [];
const _addSwFilenames = (list) => swFiles = swFiles.concat(list.map(it => `/${it}`));

const audioFiles = ut.listFiles({dir: "audio", whitelistFileExts: [".mp3"]});
_addSwFilenames(audioFiles);

const cssFiles = ut.listFiles({dir: "css", whitelistFileExts: [".css"]});
_addSwFilenames(cssFiles);

const dataFiles = ut.listFiles({
	dir: `data`,
	blacklistFilePrefixes: ["roll20-module-", "srd-spells.json", "roll20.json"],
	whitelistFileExts: [".json"]
});
_addSwFilenames(dataFiles);

const fontFiles = ut.listFiles({dir: "fonts", whitelistFileExts: [".ttf", ".eot", ".woff", ".woff2", ".svg"]});
_addSwFilenames(fontFiles);

const homebrewFiles = ut.listFiles({dir: "homebrew", whitelistFileExts: ["index.json"]});
_addSwFilenames(homebrewFiles);

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

fs.writeFileSync("./js/sw-files.js", `this.filesToCache = ${JSON.stringify(swFiles)};`, "utf-8");
