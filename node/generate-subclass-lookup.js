const fs = require("fs");
const ut = require("./util.js");

const out = {};
const classIndex = JSON.parse(fs.readFileSync("./data/class/index.json", "utf-8"));
Object.values(classIndex).forEach(f => {
	JSON.parse(fs.readFileSync(`./data/class/${f}`, "utf-8")).class.forEach(c => {
		if (!c.subclasses) return;
		const target = {};
		(out[c.source] = out[c.source] || {})[c.name] = target;
		c.subclasses.forEach(sc => (target[sc.source] = target[sc.source] || {})[sc.shortName] = sc.name);
	});
});
fs.writeFileSync(`./data/generated/gendata-subclass-lookup.json`, ut.getCleanStringJson(out, true));
console.log("Regenerated subclass lookup.");
