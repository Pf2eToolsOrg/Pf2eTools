const fs = require('fs');
const ut = require('../js/utils.js');
const utS = require("../node/util-search-index");

const re = /{@(spell|item|class|creature|condition|background) (.*?)(\|(.*?))?(\|.*?)?}/g;

const TAG_TO_PAGE = {
	"spell": UrlUtil.PG_SPELLS,
	"item": UrlUtil.PG_ITEMS,
	"class": UrlUtil.PG_CLASSES,
	"creature": UrlUtil.PG_BESTIARY,
	"condition": UrlUtil.PG_CONDITIONS,
	"background": UrlUtil.PG_BACKGROUNDS
};

const TAG_TO_DEFAULT_SOURCE = {
	"spell": "phb",
	"item": "dmg",
	"class": "phb",
	"creature": "mm",
	"condition": "phb",
	"background": "phb"
};

function recursiveCheck (file) {
	if (file.endsWith(".json")) checkFile(file);
	else if (fs.lstatSync(file).isDirectory()) {
		fs.readdirSync(file).forEach(nxt => {
			recursiveCheck(`${file}/${nxt}`)
		})
	}
}

function checkFile (file) {
	const contents = fs.readFileSync(file, 'utf8');
	let match;
	while (match = re.exec(contents)) {
		const tag = match[1];
		const name = match[2];
		const src = match[4] || TAG_TO_DEFAULT_SOURCE[tag];
		const url = `${TAG_TO_PAGE[tag]}#${UrlUtil.encodeForHash([name, src])}`.toLowerCase().trim();
		if (!ALL_URLS.has(url)) {
			// scan for a list of similar entries, to aid debugging
			const similarUrls = [];
			const similar = /^\w+\.html#\w+/.exec(url);
			Array.from(ALL_URLS).forEach(it => {
				if (similar && it.startsWith(similar[0])) similarUrls.push(it)
			});
			console.log(`Similar URLs were:\n${JSON.stringify(similarUrls, null, 2)}`);
			const msg = `Missing link: ${match[0]} in file ${file} (evaluates to "${url}")`;
			throw new Error(msg);
		}
	}
}

const ALL_URLS = new Set();
utS.UtilSearchIndex.getIndex(false, true).forEach(it => {
	ALL_URLS.add(it.url.toLowerCase().trim());
});

console.log("##### Checking links in JSON #####");
recursiveCheck("./data");
console.log("##### Link check complete #####");