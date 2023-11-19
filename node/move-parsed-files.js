"use strict"

const fs = require("fs")
const ut = require("./util.js")
require("../js/parser.js");
require("../js/utils.js");

function main () {
	const files = ut.listFiles({dir: "./trash/parsed"});
	files.forEach(filePath => {
		const [match, prop, src] = /.*\/([a-z]+)-([a-z0-9]+)\.json/.exec(filePath);
		const filename = `${prop}-${src}.json`;
		const source = Parser.sourceJsonToAbv(src);
		switch (prop) {
			case "backgrounds":
			case "creatures":
			case "feats":
			case "items":
			case "spells": {
				const dir = prop === "creatures" ? "bestiary" : prop;
				const indexPath = `./data/${dir}/index.json`
				const index = ut.readJson(indexPath);
				index[source] = filename;
				fs.writeFileSync(indexPath, CleanUtil.getCleanJson(index));
				fs.renameSync(filePath, `./data/${dir}/${filename}`);
				break;
			}
			case "hazards":
			case "rituals": {
				const dataPath = `./data/${prop}.json`;
				const data = ut.readJson(dataPath);
				const newData = ut.readJson(filePath);
				const mergeData = MiscUtil.merge(data, newData);
				fs.writeFileSync(dataPath, CleanUtil.getCleanJson(mergeData));
				fs.unlinkSync(filePath);
				break;
			}
		}
	});
}

main();
