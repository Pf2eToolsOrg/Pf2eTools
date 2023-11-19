const fs = require("fs");
const ut = require("./util.js");
require("../js/utils.js");

FEAT_LEADS_TO = {};

function getHash (feat) {
	return `${feat.name}${feat.add_hash ? ` (${feat.add_hash})` : ""}${feat.source !== SRC_CRB ? `|${feat.source}` : ""}`;
}

function getChildren (hash) {
	hash = hash.toLowerCase();
	const out = new Set();
	if (FEAT_LEADS_TO[hash]) {
		FEAT_LEADS_TO[hash].forEach(h => {
			out.add(h);
			getChildren(h).forEach(c => out.add(c));
		});
	}
	return out;
}

/**
 * Args:
 * file="./data/my-file.json"
 * filePrefix="./data/dir/"
 * inplace
 */
function generateFeatTrees (args) {
	let files;
	if (args.file) {
		files = [args.file];
	} else {
		files = ut.listFiles({dir: `./data`, blacklistFilePrefixes: ["index"]});
		if (args.filePrefix) {
			files = files.filter(f => f.startsWith(args.filePrefix));
			if (!files.length) throw new Error(`No file with prefix "${args.filePrefix}" found!`);
		}
	}

	const featIndex = ut.readJson(`./data/feats/index.json`);
	Object.entries(featIndex).forEach(([source, filename]) => {
		const featData = ut.readJson(`./data/feats/${filename}`);
		featData.feat.forEach(f => {
			const hash = getHash(f);
			const prerequisites = Array.from((f.prerequisites || "").matchAll(/{@feat ([^}]*?)}/gi)).map(it => {
				const {name, source} = DataUtil.generic.unpackUid(it[1], "@feat");
				return `${name}${source !== SRC_CRB ? `|${source}` : ""}`.toLowerCase();
			});
			prerequisites.forEach(p => {
				const leadsTo = (FEAT_LEADS_TO[p] = FEAT_LEADS_TO[p] || new Set());
				leadsTo.add(hash);
			});
		});
	});

	files.forEach(file => {
		console.log(`Building feat tree for file "${file}"`);
		let json = ut.readJson(file);
		json.feat.forEach(f => {
			const hash = getHash(f);
			f.leadsTo = Array.from(getChildren(hash));
			if (f.leadsTo.length === 0) delete f.leadsTo
		});

		const outPath = args.inplace ? file : file.replace("./data/", "./trash/");
		if (!args.inplace) {
			const dirPart = outPath.split("/").slice(0, -1).join("/");
			fs.mkdirSync(dirPart, {recursive: true});
		}
		fs.writeFileSync(file, CleanUtil.getCleanJson(json));
	});
}

async function main () {
	const args = ut.ArgParser.parse();
	generateFeatTrees(args);
}

if (require.main === module) {
	main().then(() => console.log("Done.")).catch(e => { throw e; });
} else {
	generateFeatTrees({filePrefix: "./data/feats", inplace: true});
}
