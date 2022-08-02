"use strict";

const fs = require("fs");
const ut = require("./util");
require("../js/utils");
require("../js/render");
require("../js/parser");

// TODO: Incoming data structure change...
async function replaceReferences (folder) {
	ut.patchLoadJson();
	console.log(`Replacing statblock references in directory ${folder}...`);
	const walker = MiscUtil.getWalker();
	const fileBlacklist = ["renderdemo.json", "index", "bookref"];
	const files = ut.listFiles({dir: folder, blacklistFilePrefixes: fileBlacklist}).filter(file => file.endsWith(".json"));
	for (let file of files) {
		console.log(`\tReplacing in ${file}...`);
		const json = ut.readJson(file);
		const references = [];
		walker.walk(json, {
			object: (obj) => {
				if (obj.type === "data" && !obj.data) {
					const cat_id = Parser._parse_bToA(Parser.CAT_ID_TO_PROP, obj.tag);
					const page = UrlUtil.CAT_TO_PAGE[cat_id];
					const hash = obj.hash || UrlUtil.URL_TO_HASH_BUILDER[page](obj);
					references.push({page, src: obj.source, hash});
				}
				return obj
			},
		});
		const referencedData = await Promise.all(references.map(r => Renderer.hover.pCacheAndGet(r.page, r.src, r.hash)));
		walker.walk(json, {
			object: (obj) => {
				if (obj.type === "data" && !obj.data) {
					const cat_id = Parser._parse_bToA(Parser.CAT_ID_TO_PROP, obj.tag);
					const page = UrlUtil.CAT_TO_PAGE[cat_id];
					const hash = obj.hash || UrlUtil.URL_TO_HASH_BUILDER[page](obj);
					const out = {type: "data", tag: obj.tag, data: Renderer.hover._getFromCache(page, obj.source, hash)};
					if (!out) throw new Error(`Could not find ${page}:${obj.source}:${hash}`);
					return out;
				}
				return obj
			},
		});
		fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
	}
	ut.unpatchLoadJson();
}

replaceReferences(`./data`).then(() => console.log("Done."));
