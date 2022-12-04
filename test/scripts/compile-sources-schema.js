"use strict";

const fs = require("fs");
const ut = require("../../node/util");
require("../../js/utils");

const schemaTemplate = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$id: "sources.json",
	title: "Sources Schema",
	description: "A generated file containing a list of all sources in Pf2eTools.",
	type: "object",
	version: "0.0.1",
	definitions: {
		sourceList: {
			enum: [],
		},
	},
};

function generatesourceschema (file) {
	const sourcesFile = ut.readJson("./data/sources.json");
	let schema = schemaTemplate;
	const sources = sourcesFile.source;

	const sourceList = sources.filter(s => !s.unreleased).map(s => s.source);
	if (sourceList.findDuplicates()) throw new Error(`Duplicate source: ${sourceList.findDuplicates()}!`);
	schema.definitions.sourceList.enum = sourceList.sort();

	// Write it all.
	fs.writeFileSync(file, CleanUtil.getCleanJson(schema), "utf-8");
}

generatesourceschema(`./test/schema-template/_generated/sources.json`);
console.log("Sources schema created.");
