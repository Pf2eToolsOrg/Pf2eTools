const fs = require("fs");
require("../js/utils");

const expected = [];
const expectedDirs = {};
const existing = [];

// Loop through each bestiary-related img directory and push the list of files in each.
if (fs.existsSync("./img")) {
	console.log(`##### Reconciling the PNG tokens against the bestiary JSON #####`);

	// Loop through each bestiary JSON file push the list of expected PNG files.
	fs.readdirSync("./data/bestiary")
		.filter(file => file.startsWith("bestiary") && file.endsWith(".json"))
		.forEach(file => {
			const result = JSON.parse(fs.readFileSync(`./data/bestiary/${file}`));
			result.monster.forEach(m => {
				const source = Parser.sourceJsonToAbv(m.source);
				if (fs.existsSync(`./img/${source}`)) {
					expected.push(`${source}/${Parser.nameToTokenName(m.name)}.png`);

					// add tokens specified as part of variants
					if (m.variant) {
						m.variant.filter(it => it.token).forEach(entry => expected.push(`${Parser.sourceJsonToAbv(entry.token.source)}/${Parser.nameToTokenName(entry.token.name)}.png`));
					}

					// add tokens specified as alt art
					if (m.altArt) {
						m.altArt.forEach(alt => expected.push(`${Parser.sourceJsonToAbv(alt.source)}/${Parser.nameToTokenName(alt.name)}.png`))
					}
				} else expectedDirs[source] = true;
			});
		});

	const IGNORED_PREFIXES = [
		".",
		"_"
	];

	const IGNORED_EXTENSIONS = [
		".git",
		".gitignore",
		".png",
		".txt"
	];

	const IGNORED_DIRS = new Set([
		"adventure",
		"deities",
		"variantrules",
		"rules",
		"objects",
		"bestiary",
		"roll20",
		"book",
		"items",
		"races",
		"ships"
	]);

	fs.readdirSync("./img")
		.filter(file => !(IGNORED_PREFIXES.some(it => file.startsWith(it) || IGNORED_EXTENSIONS.some(it => file.endsWith(it)))))
		.forEach(dir => {
			if (!IGNORED_DIRS.has(dir)) {
				fs.readdirSync(`./img/${dir}`).forEach(file => {
					existing.push(`${dir.replace("(", "").replace(")", "")}/${file}`);
				})
			}
		});

	results = [];
	expected.forEach(function (i) {
		if (existing.indexOf(i) === -1) results.push(`[MISSING] ${i}`);
	});
	existing.forEach(function (i) {
		if (expected.indexOf(i) === -1) results.push(`[  EXTRA] ${i}`);
	});
	Object.keys(expectedDirs).forEach(k => results.push(`Directory ${k} doesn't exist!`));
	results.sort(function (a, b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	}).forEach(function (i) {
		console.warn(i);
	});
	if (!expected.length) console.log("Tokens are as expected.");
}
