"use strict";

const fs = require("fs");
const ut = require("../../node/util");
require("../../js/utils");

function generatesourceschema (file) {
	const sourcesFile = ut.readJson("./data/sources.json");
	let schemaFile = ut.readJson("./test/schema-template/utils.json");
	const sources = sourcesFile.source;

	// For each language, add it to the schema.
	const sourceList = sources.map(s => s.source);
	schemaFile.definitions.sourceList.enum = sourceList.sort();

	// Write it all.
	fs.writeFileSync(file, CleanUtil.getCleanJson(schemaFile), "utf-8");
}

generatesourceschema(`./test/schema-template/utils.json`);
console.log("Sources schema created.");
