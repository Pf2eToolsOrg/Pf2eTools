const fs = require("fs");
const ut = require("./util.js");
require("../js/utils.js");
require("../js/render.js");
require("../js/bookutils.js");

class AreaTagger {
	constructor (filePath) {
		this._filePath = filePath;
		this._data = ut.readJson(filePath);

		this._maxTag = 0;
		this._existingTags = null;
	}

	_getNewTag () {
		let hexTag;
		do {
			if (this._maxTag >= 4095) throw new Error("Exhausted tags!");
			hexTag = this._maxTag.toString(16).padStart(3, "0");
			this._maxTag++;
		} while (hexTag in this._existingTags);
		this._existingTags.add(hexTag);
		return hexTag;
	}

	_doPopulateExistingTags () {
		const map = BookUtil.getEntryIdLookup(this._data.data, "populateExistingIds");
		this._existingTags = new Set(Object.keys(map));
	}

	_addNewTags () {
		const handlers = {
			object: (ident, obj) => {
				Renderer.ENTRIES_WITH_CHILDREN
					.filter(meta => meta.key === "entries")
					.forEach(meta => {
						if (obj.type !== meta.type) return;
						if (!obj.id) obj.id = this._getNewTag();
					});

				return obj;
			}
		};

		this._data.data.forEach(chap => MiscUtil.getWalker().walk("addNewTags", chap, handlers));
	}

	_doWrite () {
		const outStr = ut.getCleanStringJson(this._data);
		fs.writeFileSync(this._filePath, outStr, "utf-8");
	}

	run () {
		this._doPopulateExistingTags();
		this._addNewTags();
		this._doWrite();
	}
}

console.log(`Running area tagging pass...`);
const adventureIndex = ut.readJson("./data/adventures.json");
adventureIndex.adventure.forEach(advMeta => {
	const areaTagger = new AreaTagger(`./data/adventure/adventure-${advMeta.id.toLowerCase()}.json`);
	areaTagger.run();
	console.log(`\tTagged ${advMeta.id}...`);
});
console.log(`Area tagging complete.`);
