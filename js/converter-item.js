"use strict";

if (typeof module !== "undefined") {
	const cv = require("./converterutils.js");
	Object.assign(global, cv);
	const cvItem = require("./converterutils-item.js");
	Object.assign(global, cvItem);
	global.PropOrder = require("./utils-proporder.js");
}

class ItemParser extends BaseParser {
	static init (itemData) { ItemParser._ALL_ITEMS = itemData; }
	static getItem (itemName) {
		itemName = itemName.trim().toLowerCase();
		itemName = ItemParser._MAPPED_ITEM_NAMES[itemName] || itemName;
		const matches = ItemParser._ALL_ITEMS.filter(it => it.name.toLowerCase() === itemName);
		if (matches.length > 1) throw new Error(`Multiple items found with name "${itemName}"`);
		if (matches.length) return matches[0];
		return null;
	}

	/**
	 * Parses items from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 * @param options.source Entity source.
	 * @param options.page Entity page.
	 * @param options.titleCaseFields Array of fields to be title-cased in this entity (if enabled).
	 * @param options.isTitleCase Whether title-case fields should be title-cased in this entity.
	 */
	static doParseText (inText, options) {
		options = this._getValidOptions(options);

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = this._getCleanInput(inText)
			.split("\n")
			.filter(it => it && it.trim());
		const item = {};
		item.source = options.source;
		// for the user to fill out
		item.page = options.page;

		// FIXME this duplicates functionality in converterutils
		let prevLine = null;
		let curLine = null;
		let i;
		for (i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of item
			if (i === 0) {
				item.name = this._getAsTitle("name", curLine, options.titleCaseFields, options.isTitleCase);
				continue;
			}

			// tagline
			if (i === 1) {
				this._setCleanTaglineInfo(item, curLine, options);
				continue;
			}

			// TODO convert entries; lists; etc
			item.entries = [];
			const stack = [
				item.entries
			];
			const popList = () => { while (stack.last().type === "list") stack.pop(); }
			const popNestedEntries = () => { while (stack.length > 1) stack.pop(); }

			const addEntry = (entry, canCombine) => {
				canCombine = canCombine && typeof entry === "string";

				const target = stack.last();
				if (target instanceof Array) {
					if (canCombine && typeof target.last() === "string") {
						target.last(`${target.last().trimRight()} ${entry.trimLeft()}`)
					} else {
						target.push(entry);
					}
				} else if (target.type === "list") {
					if (canCombine && typeof target.items.last() === "string") {
						target.items.last(`${target.items.last().trimRight()} ${entry.trimLeft()}`)
					} else {
						target.items.push(entry);
					}
				} else if (target.type === "entries") {
					if (canCombine && typeof target.entries.last() === "string") {
						target.entries.last(`${target.entries.last().trimRight()} ${entry.trimLeft()}`)
					} else {
						target.entries.push(entry);
					}
				}

				if (typeof entry !== "string") stack.push(entry);
			};

			const getCurrentEntryArray = () => {
				if (stack.last().type === "list") return stack.last().items;
				if (stack.last().type === "entries") return stack.last().entries;
				return stack.last();
			};

			while (i < toConvert.length) {
				if (BaseParser._isJsonLine(curLine)) {
					popNestedEntries(); // this implicitly pops nested lists

					addEntry(BaseParser._getJsonFromLine(curLine));
				} else if (ConvertUtil.isListItemLine(curLine)) {
					if (stack.last().type !== "list") {
						const list = {
							type: "list",
							items: []
						};
						addEntry(list);
					}

					curLine = curLine.replace(/^\s*•\s*/, "");
					addEntry(curLine.trim());
				} else if (ConvertUtil.isNameLine(curLine)) {
					popNestedEntries(); // this implicitly pops nested lists

					const {name, entry} = ConvertUtil.splitNameLine(curLine);

					const parentEntry = {
						type: "entries",
						name,
						entries: [entry]
					};

					addEntry(parentEntry);
				} else if (ConvertUtil.isTitleLine(curLine)) {
					popNestedEntries(); // this implicitly pops nested lists

					const entry = {
						type: "entries",
						name: curLine.trim(),
						entries: []
					};

					addEntry(entry);
				} else if (BaseParser._isContinuationLine(getCurrentEntryArray(), curLine)) {
					addEntry(curLine.trim(), true);
				} else {
					popList();

					addEntry(curLine.trim());
				}

				i++;
				curLine = toConvert[i];
			}
		}

		if (!item.entries.length) delete item.entries;
		else this._setWeight(item, options);

		if (item.staff) this._setQuarterstaffStats(item, options);

		this._doItemPostProcess(item, options);
		this._setCleanTaglineInfo_handleGenericType(item, options);
		this._doVariantPostProcess(item, options);
		const statsOut = PropOrder.getOrdered(item, item.__prop || "item");
		options.cbOutput(statsOut, options.isAppend);
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _doItemPostProcess (stats, options) {
		TagCondition.tryTagConditions(stats);
		ArtifactPropertiesTag.tryRun(stats);
		if (stats.entries) {
			stats.entries = stats.entries.map(it => DiceConvert.getTaggedEntry(it))
			EntryConvert.tryRun(stats, "entries");
			stats.entries = SkillTag.tryRun(stats.entries);
			stats.entries = ActionTag.tryRun(stats.entries);
			stats.entries = SenseTag.tryRun(stats.entries);
		}
		this._doItemPostProcess_addTags(stats, options);
		BasicTextClean.tryRun(stats);
	}

	static _doItemPostProcess_addTags (stats, options) {
		const manName = stats.name ? `(${stats.name}) ` : "";
		SpellTag.tryRun(stats);
		ChargeTag.tryRun(stats);
		RechargeTypeTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Recharge type requires manual conversion`)});
		QuantityTag.tryRun(stats);
		BonusTag.tryRun(stats);
		ItemMiscTag.tryRun(stats);

		// TODO
		//  - tag spellcasting focus type
		//  - tag damage type?
		//  - tag ability score adjustments
	}

	static _doVariantPostProcess (stats, options) {
		if (!stats.inherits) return;
		BonusTag.tryRun(stats, {isVariant: true});
	}

	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _setCleanTaglineInfo (stats, curLine, options) {
		const parts = curLine.split(",").map(it => it.trim()).filter(Boolean);

		const handlePartRarity = (rarity) => {
			rarity = rarity.trim().toLowerCase();
			switch (rarity) {
				case "common": stats.rarity = rarity; return true;
				case "uncommon": stats.rarity = rarity; return true;
				case "rare": stats.rarity = rarity; return true;
				case "very rare": stats.rarity = rarity; return true;
				case "legendary": stats.rarity = rarity; return true;
				case "artifact": stats.rarity = rarity; return true;
				case "rarity varies": {
					stats.rarity = "varies";
					stats.__prop = "itemGroup";
					return true;
				}
			}
			return false;
		};

		let baseItem = null;
		let genericType = null;

		parts.forEach(part => {
			const partLower = part.toLowerCase();

			// region wondrous/item type/staff
			switch (partLower) {
				case "wondrous item": stats.wondrous = true; return;
				case "wondrous item (tattoo)": {
					stats.wondrous = true;
					stats.tattoo = true;
					return;
				}
				case "potion": stats.type = "P"; return;
				case "ring": stats.type = "RG"; return;
				case "rod": stats.type = "RD"; return;
				case "wand": stats.type = "WD"; return;
				case "ammunition": stats.type = "A"; return;
				case "staff": stats.staff = true; return;
			}
			// endregion

			// region rarity/attunement
			// Check if the part is an exact match for a rarity string
			const isHandledRarity = handlePartRarity(partLower);
			if (isHandledRarity) return true;

			if (partLower.includes("(requires attunement")) {
				const [rarityRaw, ...rest] = part.split("(");
				const rarity = rarityRaw.trim().toLowerCase();

				const isHandledRarity = handlePartRarity(rarity);
				if (!isHandledRarity) options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Rarity "${rarityRaw}" requires manual conversion`);

				let attunement = rest.join("(");
				attunement = attunement.replace(/^requires attunement/i, "").replace(/\)/, "").trim();
				if (!attunement) {
					stats.reqAttune = true;
				} else {
					stats.reqAttune = attunement.toLowerCase();
				}

				return;
			}
			// endregion

			// region weapon
			if (partLower === "weapon" || partLower === "weapon (any)") {
				genericType = "weapon";
				return;
			} else if (partLower === "weapon (any sword)") {
				genericType = "sword";
				return;
			} else if (partLower === "armor" || partLower === "armor (any)") {
				genericType = "armor";
				return;
			}

			const mBaseWeapon = /^weapon \(([^)]+)\)$/i.exec(part);
			const mBaseArmor = /^armor \(([^)]+)\)$/i.exec(part);
			if (mBaseWeapon) {
				baseItem = ItemParser.getItem(mBaseWeapon[1]);
				if (!baseItem) throw new Error(`Could not find base item "${mBaseWeapon[1]}"`);
				return;
			} else if (mBaseArmor) {
				baseItem = ItemParser.getItem(mBaseArmor[1]);
				if (!baseItem) throw new Error(`Could not find base item "${mBaseArmor[1]}"`);
				return
			}
			// endregion

			// Warn about any unprocessed input
			options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Tagline part "${part}" requires manual conversion`);
		});

		this._setCleanTaglineInfo_handleBaseItem(stats, baseItem, options);
		// Stash the genericType for later processing/removal
		if (genericType) stats.__genericType = genericType;
	}

	static _setCleanTaglineInfo_handleBaseItem (stats, baseItem, options) {
		if (!baseItem) return;

		// Apply base item stats only if there's no existing data
		Object.entries(baseItem)
			.filter(([k]) => stats[k] === undefined && !k.startsWith("_"))
			.forEach(([k, v]) => stats[k] = v);

		// Clean unwanted base properties
		delete stats.armor;

		stats.baseItem = `${baseItem.name.toLowerCase()}${baseItem.source === SRC_DMG ? "" : `|${baseItem.source}`}`;
	}

	static _setCleanTaglineInfo_handleGenericType (stats, options) {
		if (!stats.__genericType) return;
		const genericType = stats.__genericType;
		delete stats.__genericType;

		let prefixSuffixName = stats.name;
		prefixSuffixName = prefixSuffixName.replace(/^weapon /i, "");
		const isSuffix = /^\s*of /i.test(prefixSuffixName);

		stats.inherits = MiscUtil.copy(stats);
		// Clean/move inherit props into inherits object
		delete stats.inherits.name; // maintain name on base object
		Object.keys(stats.inherits).forEach(k => delete stats[k]);

		if (isSuffix) stats.inherits.nameSuffix = ` ${prefixSuffixName.trim()}`;
		else stats.inherits.namePrefix = `${prefixSuffixName.trim()} `;

		stats.__prop = "variant";
		stats.type = "GV";
		switch (genericType) {
			case "weapon": stats.requires = [{"weapon": true}]; break;
			case "sword": stats.requires = [{"sword": true}]; break;
			case "armor": stats.requires = [{"armor": true}]; break;
			default: throw new Error(`Unhandled generic type "${genericType}"`);
		}
	}

	static _setWeight (stats, options) {
		const strEntries = JSON.stringify(stats.entries);

		strEntries.replace(/weighs ([a-zA-Z0-9,]+) (pounds?|lbs?\.|tons?)/, (...m) => {
			if (m[2].toLowerCase().trim().startsWith("ton")) throw new Error(`Handling for tonnage is unimplemented!`);

			const noCommas = m[1].replace(/,/g, "");
			if (!isNaN(noCommas)) stats.weight = Number(noCommas);

			const fromText = Parser.textToNumber(m[1]);
			if (!isNaN(fromText)) stats.weight = fromText;

			if (!stats.weight) options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Weight "${m[1]}" requires manual conversion`)
		});
	}

	static _setQuarterstaffStats (stats) {
		const cpyStatsQuarterstaff = MiscUtil.copy(ItemParser._ALL_ITEMS.find(it => it.name === "Quarterstaff" && it.source === SRC_PHB));

		// remove unwanted properties
		delete cpyStatsQuarterstaff.name;
		delete cpyStatsQuarterstaff.source;
		delete cpyStatsQuarterstaff.page;
		delete cpyStatsQuarterstaff.rarity;
		delete cpyStatsQuarterstaff.value;
		delete cpyStatsQuarterstaff.weapon; // tag found only on basic items

		Object.entries(cpyStatsQuarterstaff)
			.filter(([k]) => !k.startsWith("_"))
			.forEach(([k, v]) => {
				if (stats[k] == null) stats[k] = v;
			});
	}
}
ItemParser._ALL_ITEMS = null;
ItemParser._MAPPED_ITEM_NAMES = {
	"studded leather": "studded leather armor",
	"leather": "leather armor"
};

if (typeof module !== "undefined") {
	module.exports = {
		ItemParser
	};
}
