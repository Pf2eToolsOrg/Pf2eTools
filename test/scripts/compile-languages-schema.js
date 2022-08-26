"use strict";

const fs = require("fs");
const ut = require("../../node/util");
require("../../js/utils");

const schemaTemplate = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$id: "languages.json",
	title: "Languages Schema",
	description: "A generated file containing a list of all languages in Pf2eTools.",
	type: "object",
	version: "0.0.1",
	definitions: {
		language: {
			type: "string",
			description: "All Languages in the game.",
			enum: [],
			uniqueItems: true,
		},
	},
};

function generateLanguageSchema (file) {
	const languagesFile = ut.readJson("./data/languages.json");
	const languages = languagesFile.language;
	let schema = schemaTemplate;

	// For each language, add it to the schema.
	languages.forEach(language => {
		schema.definitions.language.enum.push(language.name.toLowerCase());
		schema.definitions.language.enum.sort(SortUtil.ascSort);
	});

	// Write it all.
	fs.writeFileSync(file, CleanUtil.getCleanJson(schema), "utf-8");
}

generateLanguageSchema(`./test/schema-template/_generated/languages.json`);
console.log("Languages schema created.");
