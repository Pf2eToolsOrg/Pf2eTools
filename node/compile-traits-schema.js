"use strict";

const fs = require("fs");
const ut = require("./util");
require("../js/utils");

const schemaTemplate = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$id: "traits.json",
	title: "Traits Schema",
	description: "A generated file containing a list of all traits in Pf2eTools.",
	type: "object",
	version: "0.0.1",
	definitions: {
		anyTrait: {
			type: "string",
			description: "Any Trait in the game.",
			anyOf: [],
		},
	},
}

function generateTraitSchema (file) {
	const traitsFile = ut.readJson("./data/traits.json");
	const traits = traitsFile.trait;
	let schema = schemaTemplate;

	// For each trait, add it to the schema.
	traits.forEach(trait => {
		// If trait doesn't have ANY category, give it an "Unknown" category.
		if (!trait.categories || trait.categories.length === 0) {
			trait.categories = ["Unknown"];
		}

		// For each category, add it to the schema.
		trait.categories.forEach(category => {
			let categoryName = `${category.replace(/[^a-zA-Z ]/g, "").toCamelCase()}Trait`

			// If category doesn't exist, create it.
			if (!schema.definitions[categoryName]) {
				schema.definitions[categoryName] = {
					type: "string",
					description: `A list of all ${category} traits.`,
					enum: [],
				};
			}
			schema.definitions[categoryName].enum.push(trait.name.toLowerCase())
			schema.definitions[categoryName].enum.sort(SortUtil.ascSort)
		})
	})
	let allCategories = Object.keys(schema.definitions).filter(e => e !== "anyTrait");
	console.log("Created the following categories:", allCategories);

	// Put every category in the "anyTrait" category.
	schema.definitions.anyTrait.anyOf = allCategories.map(category => {
		return {
			$ref: `#/definitions/${category}`,
		};
	}).sort(SortUtil.ascSort);

	// Write it all.
	fs.writeFileSync(file, CleanUtil.getCleanJson(schema), "utf-8");
}

generateTraitSchema(`./test/schema-template/_generated/traits.json`);
console.log("Traits schema created.");
