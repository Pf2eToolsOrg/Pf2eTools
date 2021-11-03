const fs = require("fs");
const ut = require("./util.js");
require("../js/utils.js");

function main () {
	const meta = ut.readJson("./trash/meta.json")
	const hashMap = {};
	const build = (key) => {
		Object.entries(meta[key]).forEach(([name, m]) => {
			hashMap[key] = hashMap[key] || {};
			hashMap[key][name.toLowerCase()] = m.url;
			hashMap[key][name.replace(/ \(.+/, "").toLowerCase()] = m.url;
			hashMap[key][name.replace(/.*?\((.*?)\)/, "$1").toLowerCase()] = m.url;
		})
	}
	Object.keys(meta).forEach(k => build(k));
	Object.keys(hashMap).forEach(src => {
		const fluffUrl = `./data/bestiary/fluff-creatures-${src.toLowerCase()}.json`;
		const creaturesUrl = `./data/bestiary/creatures-${src.toLowerCase()}.json`;
		const fluffJson = ut.readJson(fluffUrl);
		const creaturesJson = ut.readJson(creaturesUrl);
		fluffJson.creatureFluff.forEach(fluff => {
			const imageUrl = hashMap[src][fluff.name.toLowerCase()];
			if (imageUrl) {
				const allImages = new Set([...(fluff.images || []), imageUrl]);
				fluff.images = Array.from(allImages);
			}
			if (fluff.images) {
				creaturesJson.creature.filter(c => c.source === fluff.source && c.name === fluff.name).forEach(c => {
					c.hasImages = true;
				});
			}
		});
		const outJsonFluff = `${JSON.stringify(fluffJson, null, "\t")}\n`;
		console.log(`Writing to "${fluffUrl}"...`);
		fs.writeFileSync(fluffUrl, outJsonFluff);

		const outJsonCreatures = CleanUtil.getCleanJson(creaturesJson);
		console.log(`Writing to "${creaturesUrl}"...`);
		fs.writeFileSync(creaturesUrl, outJsonCreatures);
	});
}

main();
