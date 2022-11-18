const fs = require("fs");
require("../js/utils");

const FILES_TO_REPLACE_VERSION_IN = ["js/parser.js"];
const VERSION_MARKER_START = "/* PF2ETOOLS_SOURCE__OPEN */";
const VERSION_MARKER_END = "/* PF2ETOOLS_SOURCE__CLOSE */";
const VERSION_REPLACE_REGEXP = new RegExp(`${VERSION_MARKER_START.escapeRegexp()}((.|\n|\r)*)${VERSION_MARKER_END.escapeRegexp()}`, "g");

async function main () {
	const sources = JSON.parse(fs.readFileSync("data/sources.json", "utf-8")).source;
	const SRC = sources.map(it => `SRC_${it.source} = "${it.source}"`);
	const SOURCE_JSON_TO_FULL = sources.map(it => `Parser.SOURCE_JSON_TO_FULL[SRC_${it.source}] = "${it.name}"`);
	const SOURCE_JSON_TO_ABV = sources.map(it => `Parser.SOURCE_JSON_TO_ABV[SRC_${it.source}] = "${it.source}"`);
	const SOURCE_JSON_TO_DATE = sources.map(it => `Parser.SOURCE_JSON_TO_DATE[SRC_${it.source}] = "${it.date}"`);
	const SOURCE_JSON_TO_STORE = sources.map(it => `Parser.SOURCE_JSON_TO_STORE[SRC_${it.source}] = "${it.store}"`);
	const SOURCES_ADVENTURES = [
		`Parser.SOURCES_ADVENTURES = new Set(${JSON.stringify(sources.filter(it => it.adventure).map(it => `SRC_${it.source}`))})`.replace(/"(SRC.+?)"(,|)/g, "$1$2 "),
	]
	const SOURCES_VANILLA = [
		`Parser.SOURCES_VANILLA = new Set(${JSON.stringify(sources.filter(it => it.vanilla).map(it => `SRC_${it.source}`))})`.replace(/"(SRC.+?)"(,|)/g, "$1$2 "),
	]
	let TAG_TO_DEFAULT_SOURCE = {};
	sources.forEach(it => {
		if (it.defaultSource) {
			it.defaultSource.forEach(tag => {
				TAG_TO_DEFAULT_SOURCE[tag] = `SRC_${it.source}`;
			});
		}
	});
	TAG_TO_DEFAULT_SOURCE = [`Parser.TAG_TO_DEFAULT_SOURCE = ${JSON.stringify(TAG_TO_DEFAULT_SOURCE)};`.replace(/"(SRC.+?)"(,|)/g, " $1$2 ")];

	const SOURCES_AVAILABLE_DOCS_BOOK = [
		`${JSON.stringify(sources.filter(it => !it.adventure).map(it => `SRC_${it.source}`))}.forEach(src => { Parser.SOURCES_AVAILABLE_DOCS_BOOK[src] = src; Parser.SOURCES_AVAILABLE_DOCS_BOOK[src.toLowerCase()] = src; });`.replace(/"(SRC.+?)"(,|)/g, "$1$2 "),
	]

	const SOURCES_AVAILABLE_DOCS_ADVENTURE = [
		`${JSON.stringify(sources.filter(it => it.adventure).map(it => `SRC_${it.source}`))}.forEach(src => { Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src] = src; Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src.toLowerCase()] = src; });`.replace(/"(SRC.+?)"(,|)/g, "$1$2 "),
	]

	const SOURCES_ACCESSORIES = [`Parser.SOURCES_ACCESSORIES = new Set(${sources.filter(it => it.accessory).map(it => `SRC_${it.source}`).join(", ")})`]

	const combined = [...SRC, ...SOURCE_JSON_TO_FULL, ...SOURCE_JSON_TO_ABV, ...SOURCE_JSON_TO_DATE, ...SOURCE_JSON_TO_STORE, ...SOURCES_ADVENTURES, ...SOURCES_VANILLA, ...TAG_TO_DEFAULT_SOURCE, ...SOURCES_AVAILABLE_DOCS_BOOK, ...SOURCES_AVAILABLE_DOCS_ADVENTURE, ...SOURCES_ACCESSORIES].map(x => x.replace("G&G", "GnG").replace("\"undefined\"", "undefined")).join("\n")

	const combinedWithMarkers = `${VERSION_MARKER_START}\n${combined}\n${VERSION_MARKER_END}`

	for (const fileName of FILES_TO_REPLACE_VERSION_IN) {
		let fileContents = fs.readFileSync(fileName, "utf8");
		const contentsWithReplacedVersion = fileContents.replace(VERSION_REPLACE_REGEXP, combinedWithMarkers);
		fs.writeFileSync(fileName, contentsWithReplacedVersion, "utf8");
	}
}

main()
	.then(() => console.log(`Building sources in ${FILES_TO_REPLACE_VERSION_IN} files.`))
	.catch(e => { throw e; });