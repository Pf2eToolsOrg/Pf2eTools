const fs = require("fs");
require("../js/utils.js");
require("../js/render.js");
require("../js/render-dice.js");
const ut = require("./util.js");
Object.assign(global, require("../js/converterutils.js"));

const BLACKLIST_FILE_PREFIXES = [
	...ut.FILE_PREFIX_BLACKLIST,

	// specific files
	"demo.json",
];

function init () {
	ut.patchLoadJson();
}

function loadSpells () {
	const spellIndex = ut.readJson(`./data/spells/index.json`);
	const spells = [];
	Object.entries(spellIndex).forEach(([source, filename]) => {
		if (SourceUtil.isNonstandardSource(source)) return;

		const spellData = ut.readJson(`./data/spells/${filename}`);
		spells.push(...spellData.spell);
	});
	return spells;
}

function loadFeats () {
	const featIndex = ut.readJson(`./data/feats/index.json`);
	const feats = [];
	Object.entries(featIndex).forEach(([source, filename]) => {
		if (SourceUtil.isNonstandardSource(source)) return;

		const featData = ut.readJson(`./data/feats/${filename}`);
		feats.push(...featData.feat);
	});
	return feats;
}

function loadTraits () {
	return ut.readJson(`./data/traits.json`).trait;
}

function loadActions () {
	return ut.readJson(`./data/actions.json`).action;
}

function loadDeities () {
	return ut.readJson(`./data/deities.json`).deity;
}

function loadGroups () {
	return ut.readJson(`./data/groups.json`).group;
}

function tearDown () {
	ut.unpatchLoadJson();
}

function run (args) {
	let files;
	if (args.file) {
		files = [args.file];
	} else {
		files = ut.listFiles({dir: `./data`, blacklistFilePrefixes: BLACKLIST_FILE_PREFIXES});
		if (args.filePrefix) {
			files = files.filter(f => f.startsWith(args.filePrefix));
			if (!files.length) throw new Error(`No file with prefix "${args.filePrefix}" found!`);
		}
	}

	files.forEach(file => {
		console.log(`Tagging file "${file}"`)
		let json = ut.readJson(file);

		json = TagJsons.doTag(json);

		const outPath = args.inplace ? file : file.replace("./data/", "./trash/");
		if (!args.inplace) {
			const dirPart = outPath.split("/").slice(0, -1).join("/");
			fs.mkdirSync(dirPart, {recursive: true});
		}
		fs.writeFileSync(outPath, CleanUtil.getCleanJson(json));
	});
}

/**
 * Args:
 * file="./data/my-file.json"
 * filePrefix="./data/dir/"
 * inplace
 */
async function main () {
	init();
	const args = ut.ArgParser.parse();
	await TagJsons.pInit({
		spells: loadSpells(),
		feats: loadFeats(),
		actions: loadActions(),
		traits: loadTraits(),
		deities: loadDeities(),
		groups: loadGroups(),
	});
	run(args);
	tearDown();
}

if (require.main === module) {
	main().then(() => console.log("Run complete.")).catch(e => {
		throw e;
	});
} else {
	module.exports = {
		TagJsons,
	};
}
