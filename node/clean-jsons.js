"use strict";

const fs = require("fs");
const ut = require("./util");

function isDirectory (path) {
	return fs.lstatSync(path).isDirectory();
}

function readJSON (path) {
	try {
		return JSON.parse(fs.readFileSync(path, "utf8"));
	} catch (e) {
		e.message += ` (Path: ${path})`;
		throw e;
	}
}

function listFiles (dir) {
	const dirContent = fs.readdirSync(dir, "utf8")
		.filter(file => !file.startsWith("bookref-") && !file.startsWith("roll20-module-") && !file.startsWith("gendata-"))
		.map(file => `${dir}/${file}`);
	return dirContent.reduce((acc, file) => {
		if (isDirectory(file)) {
			acc.push(...listFiles(file));
		} else {
			acc.push(file);
		}
		return acc;
	}, [])
}

function cleanFolder (folder) {
	console.log(`Cleaning directory ${folder}...`);
	const files = listFiles(folder);
	files
		.filter(file => file.endsWith(".json"))
		.forEach(file => {
			console.log(`\tCleaning ${file}...`);
			fs.writeFileSync(file, ut.getCleanStringJson(readJSON(file)));
		})
}

const data = `./data`;
cleanFolder(data);
console.log("Cleaning complete.");
