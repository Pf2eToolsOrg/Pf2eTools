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
			console.log(`\tUpdating ${file}...`);
			let json = ut.readJson(file)
			// For targeted schema changes, like changing a name of an object key
			if (json.item) {
				console.log(`\tUpdating item variants in ${file}`)
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
			fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		})
}

cleanFolder(`./updateFolder`);
console.log("Updating complete.");
