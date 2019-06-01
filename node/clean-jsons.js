"use strict";

const fs = require("fs");
const ut = require("./util");

function cleanFolder (folder) {
	console.log(`Cleaning directory ${folder}...`);
	const files = ut.listFiles({dir: folder});
	files
		.filter(file => file.endsWith(".json"))
		.forEach(file => {
			console.log(`\tCleaning ${file}...`);
			fs.writeFileSync(file, ut.getCleanStringJson(ut.readJson(file)));
		})
}

cleanFolder(`./data`);
console.log("Cleaning complete.");
