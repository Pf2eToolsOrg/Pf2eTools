const fs = require("fs");
const ut = require("./util.js");
const {TraitConverter} = require("../js/converterutils-trait");
const {Source} = require("../js/converterutils.js");
const {TagJsons} = require("./tag-jsons.js");

class PdfConverter {
	static doConvert (args) {
		const sourceText = fs.readFileSync(args.if, "utf-8");
		const source = Source.fromString(args.source);
		this.converter = PdfConverter.converterFromProp(args.prop, source, sourceText);
		this.converter.convertAll();
		let json = {};
		json[args.prop] = this.converter.converted;
		json = TagJsons.doTag(json);
		TagJsons.teardown();
		if (args.merge) json = PdfConverter.doMerge(json, args.merge);
		const outPath = args.of || `./trash/pdf-parsed/${args.prop}-${args.source}.json`;
		const dirPart = outPath.split("/").slice(0, -1).join("/");
		fs.mkdirSync(dirPart, {recursive: true});
		fs.writeFileSync(outPath, CleanUtil.getCleanJson(json));
	}

	static converterFromProp (prop, source, text) {
		switch (prop) {
			case "trait": return new TraitConverter(source, text);
		}
	}

	static doMerge (json, mergePath) {
		const mergeWith = ut.readJson(mergePath);
		Object.keys(json).forEach(key => {
			mergeWith[key] = mergeWith[key] || [];
			json[key].forEach(obj => {
				if (mergeWith[key].filter(it => it.name === obj.name).length) {
					let oldIdx = mergeWith[key].map(it => it.name === obj.name).indexOf(true);
					mergeWith[key][oldIdx] = PdfConverter._doMerge(obj, mergeWith[key][oldIdx]);
				} else {
					mergeWith[key].push(obj);
				}
			});
		});
		return mergeWith;
	}

	static _doMerge (newObj, oldObj) {
		if (!oldObj) return newObj;
		const newEntry = newObj.entries.filter(it => typeof it === "string").join(" ");
		const oldEntry = oldObj.entries.filter(it => typeof it === "string").join(" ");
		const oldEntryOther = (oldObj.entries.filter(it => typeof it === "object") || []).map(it => it.entries).flat().filter(it => typeof it === "string").join(" ");
		const oldEntryCombined = oldObj.entries.map(it => {
			if (typeof it === "object") return it.entries;
			else if (typeof it === "string") return it;
		}).flat().filter(it => typeof it === "string").join(" ");

		if (newEntry === "") {
			return oldObj
		} else if (newEntry.distance(oldEntry) < newEntry.length / 5) {
			oldObj.otherSources = oldObj.otherSources || {};
			oldObj.otherSources.Reprinted = oldObj.otherSources.Reprinted || [];
			oldObj.otherSources.Reprinted.push(`${newObj.source}|${newObj.page}`);
		} else if (newEntry.distance(oldEntryOther) < newEntry.length / 5) {
			oldObj.otherSources = oldObj.otherSources || {};
			oldObj.otherSources.Expanded = oldObj.otherSources.Expanded || [];
			oldObj.otherSources.Expanded.push(`${newObj.source}|${newObj.page}`);
		} else if (newEntry.distance(oldEntryCombined) < newEntry.length / 5) {
			oldObj.otherSources = oldObj.otherSources || {};
			oldObj.otherSources.Reprinted = oldObj.otherSources.Reprinted || [];
			oldObj.otherSources.Reprinted.push(`${newObj.source}|${newObj.page}`);
		} else {
			oldObj.entries.push({type: "entriesOtherSource", entries: newObj.entries, source: newObj.source, page: newObj.page});
			oldObj.otherSources = oldObj.otherSources || {};
			oldObj.otherSources.Expanded = oldObj.otherSources.Expanded || [];
			oldObj.otherSources.Expanded.push(`${newObj.source}|${newObj.page}`);
		}
		return oldObj;
	}
}

/**
 * Args:
 * if="./dir/src.txt"
 * of="./data/spells/spells-src.json"
 * prop="spell"
 * source="SRC"
 * merge="./data/spells-src2.json"
 */
async function main () {
	await TagJsons.pInit();
	const ARGS = ut.parseArgs();
	PdfConverter.doConvert(ARGS);
}

if (require.main === module) {
	main().then(() => console.log("Parsing complete.")).catch(e => { throw e; });
}
