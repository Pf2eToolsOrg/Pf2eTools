const ut = require("../node/util.js");
require("../js/utils.js");
require("../js/render.js");
require("../js/render-dice.js");

async function main () {
	const classIndex = ut.readJson("./data/class/index.json");
	const classFiles = Object.values(classIndex)
		.map(file => ut.readJson(`./data/class/${file}`));

	const uidsClassFeature = new Set();
	const uidsSubclassFeature = new Set();

	classFiles.forEach(data => {
		(data.classFeature || []).forEach(cf => {
			const uid = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](cf);
			uidsClassFeature.add(uid);
		});

		(data.subclassFeature || []).forEach(scf => {
			const uid = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](scf);
			uidsSubclassFeature.add(uid);
		});
	});

	const errors = [];
	const foundryData = ut.readJson("./data/class/foundry.json");
	(foundryData.classFeature || []).forEach(fcf => {
		const uid = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](fcf);
		if (!uidsClassFeature.has(uid)) errors.push(`\tClass feature "${uid}" not found!`);
	});
	(foundryData.subclassFeature || []).forEach(fscf => {
		const uid = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](fscf);
		if (!uidsSubclassFeature.has(uid)) errors.push(`\tSubclass feature "${uid}" not found!`);
	});

	if (!errors.length) console.log("##### Foundry Tests Passed #####");
	else {
		console.error("Foundry data errors:");
		errors.forEach(err => console.error(err));
	}
	return !errors.length;
}

module.exports = main();
