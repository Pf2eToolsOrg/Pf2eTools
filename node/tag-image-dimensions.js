const fs = require("fs");
const ut = require("./util.js");
require("../js/utils");
const probe = require("probe-image-size");

const allFiles = [];

function addDir (dir) {
	fs.readdirSync(dir).forEach(filename => {
		const path = `${dir}/${filename}`;
		const json = JSON.parse(fs.readFileSync(path, "utf-8"));
		allFiles.push({json, path});
	});
}

async function pMutImageDimensions (imgEntry) {
	const path = `img/${imgEntry.href.path}`;
	try {
		const input = fs.createReadStream(path);
		const dimensions = await probe(input);
		input.destroy(); // stream cleanup

		imgEntry.width = dimensions.width;
		imgEntry.height = dimensions.height;
	} catch (e) {
		console.error(`Failed to set dimensions for ${path} -- ${e.message}`);
	}
}

const _PROMISES = [];
function addMutImageDimensions (file, imgEntry) {
	if (imgEntry.type === "image" && imgEntry.href && imgEntry.href.type === "internal") {
		_PROMISES.push(pMutImageDimensions(imgEntry));
	}
	return imgEntry;
}

async function main () {
	addDir("./data/adventure");
	addDir("./data/book");
	allFiles.forEach(meta => ut.dataRecurse(meta.path, meta.json, {object: addMutImageDimensions}));
	await Promise.all(_PROMISES);
	allFiles.forEach(meta => fs.writeFileSync(meta.path, CleanUtil.getCleanJson(meta.json), "utf-8"));
}

main().catch(e => console.error(e));
