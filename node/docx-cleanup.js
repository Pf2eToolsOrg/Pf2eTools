const fs = require("fs");
const ut = require("./util.js");
const {TagJsons} = require("./tag-jsons.js");
const {ConverterUtils} = require("../js/converterutils.js");

function doClean (args) {
	const walker = MiscUtil.getWalker({keyBlacklist: new Set(["source", "page", "type", "name"])});
	let json = ut.readJson(args.if);
	json.data = walker.walk(json.data, {
		object: (obj) => {
			if (obj.type.startsWith("pf2-h") && obj.name) obj.name = obj.name.toTitleCase();
			if (obj.name) obj.name = obj.name.replace(/\s/g, " ");
			return obj
		},
		string: ConverterUtils.cleanEntry,
	});
	json.data = walker.walk(json.data, {
		array: arr => arr.flat(),
	});
	json = TagJsons.doTag(json);
	fs.writeFileSync(args.of, CleanUtil.getCleanJson(json));
}

/**
 * Args:
 * if="./in/src.json"
 * of="./out/src.json"
 */
async function main () {
	await TagJsons.pInit();
	const args = ut.ArgParser.parse();
	doClean(args)
}

if (require.main === module) {
	main().then(() => console.log("Cleanup complete.")).catch(e => {
		throw e;
	});
}
