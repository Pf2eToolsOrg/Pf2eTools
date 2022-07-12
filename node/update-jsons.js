"use strict";

const fs = require("fs");
const ut = require("./util");
require("../js/utils");

function updateFolder (folder) {
	console.log(`Updating directory ${folder}...`);
	const files = ut.listFiles({dir: folder});
	files
		.filter(file => file.endsWith(".json"))
		.forEach(file => {
			let json = ut.readJson(file)
			// For targeted schema changes, like changing a name of an object key
			if (json.item) {
				console.log(`\tUpdating item variants in ${file}...`)
				json.item = json.item.map(x => {
					if (x.variants) {
						x.variants.map(v => {
							if (v.variantType) return
							v.variantType = v.type
							delete v.type
							return v
						})
					}
					return x
				})
			}
			if (json.spell) {
				console.log(`\tUpdating spell heightening in ${file}...`)
				json.spell = json.spell.map(x => {
					if (x.heightened && x.heightened.X && Array.isArray(x.heightened.X)) {
						let heightenedOld = x.heightened.X
						x.heightened.X = {}
						heightenedOld.forEach(v => {
							x.heightened.X = {...x.heightened.X, [v.level]: v.entries}
						})
					}
					return x
				})
			}
			if (json.ancestry) {
				console.log(`\tUpdating ancestry size in ${file}...`)
				json.ancestry = json.ancestry.map(x => {
					if (typeof x.size === 'string' || x.size instanceof String) {
						x.size = x.size.split(/, or |, | or /g)
					}
				})
			}
			console.log(`\tCleaning ${file}...`);
			fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		})
}

updateFolder(`./data`);
console.log("Updating complete.");
