"use strict";

const fs = require("fs");
const ut = require("./util");
require("../js/utils");

function updateFolder(folder) {
	console.log(`Updating directory ${folder}...`);
	const files = ut.listFiles({ dir: folder });
	files
		.filter(file => file.endsWith(".json"))
		.forEach(file => {
			let json = ut.readJson(file)
			// For targeted schema changes, like changing a name of an object key
			if (json.item) {
				json.item = json.item.map(x => {
					if (x.variants) {
						x.variants.map(v => {
							if (v.variantType) return v
							console.log(`\tUpdating ${x.name} item variants in ${file}...`)
							if (!v.type && v.name) {
								console.log(`\tCannot find type! Assuming name is type.\nPlease check the file.`)
								v.variantType = v.name
								return v
							} else {
								v.variantType = v.type
								delete v.type
								return v
							}
						})
					}
					if (x.destruction || x.special || x.craftReq) {
						console.log(`\tUpdating ${x.name} destruction/special/craftReq to arrays in ${file}...`)
						if (typeof x.special === "string") {
							x.special = [x.special]
						}
						if (typeof x.destruction === "string") {
							x.destruction = [x.destruction]
						}
						if (typeof x.craftReq === "string") {
							x.craftReq = [x.craftReq]
						}
						return x
					}
					return x
				})
			}
			if (json.spell) {
				json.spell = json.spell.map(x => {
					if (x.heightened && x.heightened.X && Array.isArray(x.heightened.X)) {
						console.log(`\tUpdating ${x.name} spell heightening in ${file}...`)
						let heightenedOld = x.heightened.X
						x.heightened.X = {}
						heightenedOld.forEach(v => {
							x.heightened.X = { ...x.heightened.X, [v.level]: v.entries }
						})
					}
					if (x?.range?.type) {
						console.log(`\tUpdating ${x.name} spell range in ${file}...`)
						x.range.unit = x.range.type
						delete x.range.type
					}
					return x
				})
			}
			if (json.ancestry) {
				json.ancestry = json.ancestry.map(x => {
					if (typeof x.size === "string" || x.size instanceof String) {
						console.log(`\tUpdating ${x.name} ancestry size in ${file}...`)
						x.size = x.size.split(/, or |, | or /g)
					}
					return x
				})
			}
			if (json.feat) {
				json.feat = json.feat.map(x => {
					if (typeof x.special === "string") {
						console.log(`\tUpdating ${x.name} special to arrays in ${file}...`)
						x.special = [x.special]
					}
					return x
				})
			}
			if (json.vehicle) {
				json.vehicle = json.vehicle.map(x => {
					if (x.destruction || x.special || x.craftReq) {
						console.log(`\tUpdating ${x.name} destruction/special/craftReq to arrays in ${file}...`)
						if (typeof x.special === "string") {
							x.special = [x.special]
						}
						if (typeof x.destruction === "string") {
							x.destruction = [x.destruction]
						}
						if (typeof x.craftReq === "string") {
							x.craftReq = [x.craftReq]
						}
						return x
					}
					return x
				})
			}
			fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		})
}

updateFolder(`./data`);
console.log("Updating complete.");
