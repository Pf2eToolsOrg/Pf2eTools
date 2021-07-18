const fs = require("fs");
require("../js/utils.js");
require("../js/render.js");
require("../js/render-dice.js");
const utS = require("../node/util-search-index");
const od = require("../js/omnidexer.js");
const ut = require("../node/util.js");

const TIME_TAG = "\tRun duration";
console.time(TIME_TAG);

const MSG = {
	LinkCheck: "",
	ItemDataCheck: "",
	ActionDataCheck: "",
	DeityDataCheck: "",
	BraceCheck: "",
	FilterCheck: "",
	ScaleDiceCheck: "",
	StripTagTest: "",
	AreaCheck: "",
	LootCheck: "",
	TableDiceTest: "",
	SpellDataCheck: "",
	EscapeCharacterCheck: "",
	DuplicateEntityCheck: "",
	ClassDataCheck: "",
	RaceDataCheck: "",
};

const TAG_TO_PAGE = {
	"spell": UrlUtil.PG_SPELLS,
	"item": UrlUtil.PG_ITEMS,
	"class": UrlUtil.PG_CLASSES,
	"creature": UrlUtil.PG_BESTIARY,
	"condition": UrlUtil.PG_CONDITIONS,
	"disease": UrlUtil.PG_CONDITIONS,
	"background": UrlUtil.PG_BACKGROUNDS,
	"race": UrlUtil.PG_ANCESTRIES,
	"optfeature": UrlUtil.PG_COMPANIONS_FAMILIARS,
	"reward": UrlUtil.PG_REWARDS,
	"feat": UrlUtil.PG_FEATS,
	"psionic": UrlUtil.PG_PSIONICS,
	"object": UrlUtil.PG_OBJECTS,
	"cult": UrlUtil.PG_CULTS_BOONS,
	"boon": UrlUtil.PG_CULTS_BOONS,
	"trap": UrlUtil.PG_HAZARDS,
	"hazard": UrlUtil.PG_HAZARDS,
	"deity": UrlUtil.PG_DEITIES,
	"variantrule": UrlUtil.PG_VARIANTRULES,
	"action": UrlUtil.PG_ACTIONS,
	"language": UrlUtil.PG_LANGUAGES,
	"classFeature": UrlUtil.PG_CLASSES,
	"subclassFeature": UrlUtil.PG_CLASSES,
	"charoption": UrlUtil.PG_CHAR_CREATION_OPTIONS,
	"vehicle": UrlUtil.PG_VEHICLES,
	"vehupgrade": UrlUtil.PG_VEHICLES,
};

const VALID_SKILLS = new Set([
	"Acrobatics",
	"Animal Handling",
	"Arcana",
	"Athletics",
	"Deception",
	"History",
	"Insight",
	"Intimidation",
	"Investigation",
	"Medicine",
	"Nature",
	"Perception",
	"Performance",
	"Persuasion",
	"Religion",
	"Sleight of Hand",
	"Stealth",
	"Survival",
]);

const ALL_URLS = new Set();
const CLASS_SUBCLASS_LOOKUP = {};

function isIgnoredFile (file) {
	return file === "./data/changelog.json";
}

function isIgnoredDir (directory) {
	return directory === "./data/roll20-module";
}

function fileRecurse (file, fileHandler, doParse, filenameMatcher) {
	if (file.endsWith(".json") && !isIgnoredFile(file) && (filenameMatcher == null || filenameMatcher.test(file.split("/").last()))) {
		doParse ? fileHandler(file, JSON.parse(fs.readFileSync(file, "utf-8"))) : fileHandler(file);
		Object.keys(MSG).forEach(k => {
			if (MSG[k] && MSG[k].trim() && MSG[k].slice(-5) !== "\n---\n") MSG[k] = `${MSG[k].trimRight()}\n---\n`;
		});
	} else if (fs.lstatSync(file).isDirectory() && !isIgnoredDir(file)) fs.readdirSync(file).forEach(nxt => fileRecurse(`${file}/${nxt}`, fileHandler, doParse, filenameMatcher))
}

class TestTagsUtil {
	static _testAdditionalSpells_testSpellExists (file, msgProp, spell) {
		const url = getEncoded(spell, "spell");

		if (!ALL_URLS.has(url)) {
			MSG[msgProp] += `Missing link: ${url} in file ${file} (evaluates to "${url}") in "additionalSpells"\nSimilar URLs were:\n${getSimilar(url)}\n`;
		}
	}

	static testAdditionalSpells (file, msgProp, obj) {
		if (!obj.additionalSpells) return;
		obj.additionalSpells
			.forEach(additionalSpellOption => {
				Object.values(additionalSpellOption)
					.forEach(levelToSpells => {
						Object.values(levelToSpells).forEach(spellListOrMeta => {
							if (spellListOrMeta instanceof Array) {
								return spellListOrMeta.forEach(sp => this._testAdditionalSpells_testSpellExists(file, msgProp, sp));
							} else if (typeof spellListOrMeta === "string") return; // Skip any single strings, e.g. ability

							Object.entries(spellListOrMeta)
								.forEach(([prop, val]) => {
									switch (prop) {
										case "rest": Object.values(val).forEach(spellList => spellList.forEach(sp => this._testAdditionalSpells_testSpellExists(file, msgProp, sp))); break;
										default: throw new Error(`Unhandled additionalSpells prop "${prop}"`);
									}
								});
						});
					});
			})
	}
}

const PRIMITIVE_HANDLERS = {
	undefined: [],
	boolean: [],
	number: [],
	string: [],
	object: [],
};

// Runs multiple handlers on each file, to avoid re-reading each file for each handler
class ParsedJsonChecker {
	static runAll () {
		fileRecurse("./data", (file, contents) => {
			ParsedJsonChecker._FILE_HANDLERS.forEach(handler => handler(file, contents));
		}, true);
	}

	static register (clazz) {
		ParsedJsonChecker._FILE_HANDLERS.push(clazz);
	}
}
ParsedJsonChecker._FILE_HANDLERS = [];

function getSimilar (url) {
	// scan for a list of similar entries, to aid debugging
	const similarUrls = [];
	const similar = /^\w+\.html#\w+/.exec(url);
	Array.from(ALL_URLS).forEach(it => {
		if (similar && it.startsWith(similar[0])) similarUrls.push(it)
	});
	return JSON.stringify(similarUrls, null, 2);
}

function getSubclassFeatureIndex (className, classSource, subclassName, subclassSource) {
	classSource = classSource || Parser.getTagSource("class");
	subclassSource = subclassSource || SRC_PHB;

	className = className.toLowerCase();
	classSource = classSource.toLowerCase();
	subclassName = subclassName.toLowerCase();
	subclassSource = subclassSource.toLowerCase();

	return MiscUtil.get(CLASS_SUBCLASS_LOOKUP, classSource, className, subclassSource, subclassName);
}

function getEncoded (str, tag) {
	const [name, source] = str.split("|");
	return `${TAG_TO_PAGE[tag]}#${UrlUtil.encodeForHash([name, Parser.getTagSource(tag, source)])}`.toLowerCase().trim();
}

function getEncodedDeity (str, tag) {
	const [name, pantheon, source] = str.split("|");
	return `${TAG_TO_PAGE[tag]}#${UrlUtil.encodeForHash([name, pantheon, Parser.getTagSource(tag, source)])}`.toLowerCase().trim();
}

class LinkCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(LinkCheck.checkString);
	}

	static checkString (file, str) {
		let match;
		while ((match = LinkCheck.RE.exec(str))) {
			const tag = match[1];
			const parts = match[2].split("|");

			const toEncode = [];

			switch (tag) {
				case "deity": {
					toEncode.push(parts[0], parts[1] || "forgotten realms", Parser.getTagSource(tag, parts[2]));
					break;
				}
				case "classFeature": {
					const {name, source, className, classSource, level} = DataUtil.class.unpackUidClassFeature(match[2]);
					toEncode.push(name, className, classSource, level, source);
					break;
				}
				case "subclassFeature": {
					const {name, source, className, classSource, subclassShortName, subclassSource, level} = DataUtil.class.unpackUidSubclassFeature(match[2]);
					toEncode.push(name, className, classSource, subclassShortName, subclassSource, level, source);
					break;
				}
				default: {
					toEncode.push(parts[0], Parser.getTagSource(tag, parts[1]));
					break;
				}
			}

			const url = `${TAG_TO_PAGE[tag]}#${UrlUtil.encodeForHash(toEncode)}`.toLowerCase().trim()
				.replace(/%5c/gi, ""); // replace slashes
			if (!ALL_URLS.has(url)) {
				MSG.LinkCheck += `Missing link: ${match[0]} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
			}
		}

		while ((match = LinkCheck.SKILL_RE.exec(str))) {
			const skill = match[1];
			if (!VALID_SKILLS.has(skill)) {
				MSG.LinkCheck += `Unknown skill: ${match[0]} in file ${file} (evaluates to "${skill}")\n`
			}
		}
	}
}
LinkCheck.RE = /{@(spell|item|class|creature|condition|disease|background|ancestry|optfeature|feat|reward|psionic|object|cult|boon|trap|hazard|deity|variantrule|action|classFeature|subclassFeature) ([^}]*?)}/g;
LinkCheck.SKILL_RE = /{@skill (.*?)(\|.*?)?}/g;

class ClassLinkCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(ClassLinkCheck.checkString);
	}

	static checkString (file, str) {
		// e.g. "{@class fighter|phb|and class feature added|Eldritch Knight|phb|2-0}"

		let match;
		while ((match = ClassLinkCheck.RE.exec(str))) {
			const className = match[1];
			const classSource = match[3];
			const subclassShortName = match[7];
			const subclassSource = match[9];
			const ixFeature = match[11];

			if (!subclassShortName) return; // Regular tags will be handled by the general tag checker

			const featureIndex = getSubclassFeatureIndex(className, classSource, subclassShortName, subclassSource);
			if (!featureIndex) {
				MSG.LinkCheck += `Missing subclass link: ${match[0]} in file ${file} -- could not find subclass with matching shortname/source\n`;
			}

			if (featureIndex && ixFeature && !featureIndex.includes(ixFeature)) {
				MSG.LinkCheck += `Malformed subclass link: ${match[0]} in file ${file} -- feature index "${ixFeature}" was outside expected range\n`;
			}
		}
	}
}
ClassLinkCheck.RE = /{@class (.*?)(\|(.*?))?(\|(.*?))?(\|(.*?))?(\|(.*?))?(\|(.*?))?(\|(.*?))?}/g;

class ItemDataCheck {
	static _checkArrayDuplicates (file, name, source, arr, prop, tag) {
		const asUrls = arr
			.map(it => {
				if (it.item) it = it.item;
				if (it.special) return null;

				return getEncoded(it, tag);
			})
			.filter(Boolean);

		if (asUrls.length !== new Set(asUrls).size) {
			MSG.ItemDataCheck += `Duplicate ${prop} in ${file} for ${source}, ${name}: ${asUrls.filter(s => asUrls.filter(it => it === s).length > 1).join(", ")}\n`;
		}
	}

	static _checkArrayItemsExist (file, name, source, arr, prop, tag) {
		arr.forEach(s => {
			if (s.item) s = s.item;
			if (s.special) return;

			const url = getEncoded(s, tag);
			if (!ALL_URLS.has(url)) MSG.ItemDataCheck += `Missing link: ${s} in file ${file} (evaluates to "${url}") in "${prop}"\nSimilar URLs were:\n${getSimilar(url)}\n`;
		})
	}

	static _checkRoot (file, root, name, source) {
		if (!root) return;

		if (root.attachedSpells) {
			ItemDataCheck._checkArrayDuplicates(file, name, source, root.attachedSpells, "attachedSpells", "spell");
			ItemDataCheck._checkArrayItemsExist(file, name, source, root.attachedSpells, "attachedSpells", "spell");
		}

		if (root.items) {
			ItemDataCheck._checkArrayDuplicates(file, name, source, root.items, "items", "item");
			ItemDataCheck._checkArrayItemsExist(file, name, source, root.items, "items", "item");
		}

		if (root.packContents) {
			ItemDataCheck._checkArrayDuplicates(file, name, source, root.packContents, "packContents", "item");
			ItemDataCheck._checkArrayItemsExist(file, name, source, root.packContents, "packContents", "item");
		}

		if (root.containerCapacity && root.containerCapacity.item) {
			root.containerCapacity.item.forEach(itemToCount => {
				ItemDataCheck._checkArrayItemsExist(file, name, source, Object.keys(itemToCount), "containerCapacity", "item");
			});
		}

		if (root.ammoType) {
			ItemDataCheck._checkArrayItemsExist(file, name, source, [root.ammoType], "ammoType", "item");
		}

		if (root.baseItem) {
			const url = `${TAG_TO_PAGE.item}#${UrlUtil.encodeForHash(root.baseItem.split("|"))}`
				.toLowerCase()
				.trim()
				.replace(/%5c/gi, "");

			if (!ALL_URLS.has(url)) {
				MSG.ItemDataCheck += `Missing link: ${root.baseItem} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
			}
		}
	}

	static run () {
		const basicItems = require(`../data/items-base.json`);
		basicItems.baseitem.forEach(it => this._checkRoot("data/items-base.json", it, it.name, it.source));

		const items = require(`../data/items.json`);
		items.item.forEach(it => this._checkRoot("data/items.json", it, it.name, it.source));
		items.itemGroup.forEach(it => this._checkRoot("data/items.json", it, it.name, it.source));
	}
}

class ActionData {
	static run () {
		const file = `data/actions.json`;
		const actions = require(`../${file}`);
		actions.action.forEach(it => {
			if (it.fromVariant) {
				const url = getEncoded(it.fromVariant, "variantrule");
				if (!ALL_URLS.has(url)) MSG.ActionDataCheck += `Missing link: ${it.fromVariant} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
			}

			if (it.seeAlsoAction) {
				const deduped = it.seeAlsoAction.map(it => {
					it = it.toLowerCase();
					if (!it.includes("|")) it += `|phb`;
					return it;
				}).unique();
				if (deduped.length !== it.seeAlsoAction.length) {
					MSG.ActionDataCheck += `Duplicate "seeAlsoAction" in ${file} for ${it.source}, ${it.name}\n`;
				}

				it.seeAlsoAction.forEach(s => {
					const url = getEncoded(s, "action");
					if (!ALL_URLS.has(url)) MSG.ActionDataCheck += `Missing link: ${s} in file ${file} (evaluates to "${url}") in "seeAlsoAction"\nSimilar URLs were:\n${getSimilar(url)}\n`;
				})
			}
		});
	}
}

class DeityDataCheck {
	static run () {
		const file = `data/deities.json`;
		const deities = require(`../${file}`);
		deities.deity.forEach(it => {
			if (!it.customExtensionOf) return;

			const url = getEncodedDeity(it.customExtensionOf, "deity");
			if (!ALL_URLS.has(url)) MSG.DeityDataCheck += `Missing link: ${it.customExtensionOf} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
		});
	}
}

class BraceCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(BraceCheck.checkString);
	}

	static checkString (file, str) {
		let total = 0;
		for (let i = 0; i < str.length; ++i) {
			const c = str[i];
			switch (c) {
				case "{":
					++total;
					break;
				case "}":
					--total;
					break;
			}
		}
		if (total !== 0) {
			MSG.BraceCheck += `Mismatched braces in ${file}: "${str}"\n`
		}
	}
}

class FilterCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(FilterCheck.checkString);
	}

	static checkString (file, str) {
		str.replace(/{@filter ([^}]*)}/g, (m0, m1) => {
			const spl = m1.split("|");
			if (spl.length < 3) {
				MSG.FilterCheck += `Filter tag "${str}" was too short!\n`;
			} else {
				const missingEq = [];
				for (let i = 2; i < spl.length; ++i) {
					const part = spl[i];
					if (!part.includes("=")) {
						missingEq.push(part);
					}

					const hasOpenRange = part.startsWith("[");
					const hasCloseRange = part.startsWith("]");
					if (hasOpenRange || hasCloseRange) {
						if (!(hasOpenRange && hasCloseRange)) {
							MSG.FilterCheck += `Malformed range expression in filter tag "${str}"`;
						}

						const [header, values] = part.split("=");
						const valuesSpl = values.replace(/^\[/, "").replace(/]$/, "").split(";");
						if (valuesSpl.length > 2) {
							MSG.FilterCheck += `Too many values in range expression in filter tag "${str}" (expected 1-2)`;
						}
					}
				}
				if (missingEq.length) {
					MSG.FilterCheck += `Missing equals in filter tag "${str}" in part${missingEq.length > 1 ? "s" : ""} ${missingEq.join(", ")}\n`
				}
			}
			return m0;
		});
	}
}

class ScaleDiceCheck {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(ScaleDiceCheck.checkString);
	}

	static checkString (file, str) {
		str.replace(/{@(scaledice|scaledamage) ([^}]*)}/g, (m0, m1, m2) => {
			const spl = m2.split("|");
			if (spl.length < 3) {
				MSG.ScaleDiceCheck += `${m1} tag "${str}" was too short!\n`;
			} else if (spl.length > 4) {
				MSG.ScaleDiceCheck += `${m1} tag "${str}" was too long!\n`;
			} else {
				let range;
				try {
					range = MiscUtil.parseNumberRange(spl[1], 1, 9);
				} catch (e) {
					MSG.ScaleDiceCheck += `Range "${spl[1]}" is invalid!\n`;
					return;
				}
				if (range.size < 2) MSG.ScaleDiceCheck += `Range "${spl[1]}" has too few entries! Should be 2 or more.\n`;
				if (spl[4] && spl[4] !== "psi") MSG.ScaleDiceCheck += `Unknown mode "${spl[4]}".\n`;
			}
			return m0;
		});
	}
}

class StripTagTest {
	static addHandlers () {
		PRIMITIVE_HANDLERS.string.push(StripTagTest.checkString);
	}

	static checkString (file, str) {
		if (file === "./data/bestiary/traits.json") return;

		try {
			Renderer.stripTags(str)
		} catch (e) {
			if (!StripTagTest._seenErrors.has(e.message)) {
				StripTagTest._seenErrors.add(e.message);
				if (MSG.StripTagTest) MSG.StripTagTest = `${MSG.StripTagTest.trim()}\n`;
				MSG.StripTagTest += `Tag stripper error: ${e.message} (${file})\n`;
			}
		}
	}
}
StripTagTest._seenErrors = new Set();

class TableDiceTest {
	static addHandlers () {
		PRIMITIVE_HANDLERS.object.push(TableDiceTest.checkTable);
	}

	static checkTable (file, obj) {
		if (obj.type !== "table") return;
		const autoRollMode = Renderer.getTableRollMode(obj);
		if (!autoRollMode) return;

		const toRenderLabel = autoRollMode ? RollerUtil.getFullRollCol(obj.colLabels[0]) : null;
		const isInfiniteResults = autoRollMode === RollerUtil.ROLL_COL_VARIABLE;

		const possibleResults = new Set();
		const errors = [];
		const cbErr = (cell, e) => MSG.TableDiceTest += `Row parse failed! Cell was: "${cell}"; error was: "${e.message}"\n`;

		const len = obj.rows.length;
		obj.rows.forEach((r, i) => {
			const row = Renderer.getRollableRow(r, {cbErr, isForceInfiniteResults: isInfiniteResults, isFirstRow: i === 0, isLastRow: i === len - 1});
			const cell = row[0].roll;
			if (!cell) return;
			if (cell.exact != null) {
				if (cell.exact === 0 && cell.pad) cell.exact = 100;
				if (possibleResults.has(cell.exact)) errors.push(`"exact" value "${cell.exact}" was repeated!`);
				possibleResults.add(cell.exact);
			} else {
				if (cell.max === 0) cell.max = 100;
				// convert inf to a reasonable range (no official table goes to 999+ or into negatives as of 2020-09-19)
				if (cell.min === -Renderer.dice.POS_INFINITE) cell.min = cell.displayMin; // Restore the original minimum
				if (cell.max === Renderer.dice.POS_INFINITE) cell.max = TableDiceTest._INF_CAP;
				for (let i = cell.min; i <= cell.max; ++i) {
					if (possibleResults.has(i)) {
						// if the table is e.g. 0-110, avoid double-counting the 0
						if (!(i === 100 && cell.max > 100)) errors.push(`"min-max" value "${i}" was repeated!`);
					}
					possibleResults.add(i);
				}
			}
		});

		const tmpParts = [];
		let cleanHeader = toRenderLabel
			.trim()
			.replace(/^{@dice ([^}]+)}/g, (...m) => {
				tmpParts.push(m[1]);
				return `__TMP_DICE__${tmpParts.length - 1}__`;
			});
		cleanHeader = Renderer.stripTags(cleanHeader).replace(/__TMP_DICE__(\d+)__/g, (...m) => tmpParts[Number(m[1])]);
		const possibleRolls = new Set();
		let hasPrompt = false;

		cleanHeader.split(";").forEach(rollable => {
			if (rollable.includes("#$prompt_")) hasPrompt = true;

			const wrpRollTree = Renderer.dice.lang.getTree3(rollable);
			if (wrpRollTree) {
				const min = wrpRollTree.tree.min();
				const max = wrpRollTree.tree.max();
				for (let i = min; i < max + 1; ++i) possibleRolls.add(i);
			} else {
				if (!hasPrompt) errors.push(`"${obj.colLabels[0]}" was not a valid rollable header?!`);
			}
		});

		if (!CollectionUtil.setEq(possibleResults, possibleRolls) && !hasPrompt) {
			errors.push(`Possible results did not match possible rolls!\nPossible results: (${TableDiceTest._flattenSequence([...possibleResults])})\nPossible rolls: (${TableDiceTest._flattenSequence([...possibleRolls])})`);
		}

		if (errors.length) MSG.TableDiceTest += `Errors in ${obj.caption ? `table "${obj.caption}"` : `${JSON.stringify(obj.rows[0]).substring(0, 30)}...`} in ${file}:\n${errors.map(it => `\t${it}`).join("\n")}\n`;
	}

	static _flattenSequence (nums) {
		const out = [];
		let l = null; let r = null;
		nums.sort(SortUtil.ascSort).forEach(n => {
			if (l == null) {
				l = n;
				r = n;
			} else if (n === (r + 1)) {
				r = n;
			} else {
				if (l === r) out.push(`${l}`);
				else out.push(`${l}-${r}`);
				l = n;
				r = n;
			}
		});
		if (l === r) out.push(`${l}`);
		else out.push(`${l}-${r}`);
		return out.join(", ");
	}
}
TableDiceTest._INF_CAP = 999;

class AreaCheck {
	static _buildMap (file, data) {
		AreaCheck.headerMap = Renderer.adventureBook.getEntryIdLookup(data, false);
	}

	static checkString (file, str) {
		str.replace(/{@area ([^}]*)}/g, (m0, m1) => {
			const [text, areaId, ...otherData] = m1.split("|");
			if (!AreaCheck.headerMap[areaId]) {
				AreaCheck.errorSet.add(m0);
			}
			return m0;
		});
	}

	static checkFile (file, contents) {
		if (!AreaCheck.fileMatcher.test(file)) return;

		AreaCheck.errorSet = new Set();
		AreaCheck._buildMap(file, contents.data);
		ut.dataRecurse(file, contents, {string: AreaCheck.checkString});
		if (AreaCheck.errorSet.size) {
			MSG.AreaCheck += `Errors in ${file}! See below:\n`;

			const toPrint = [...AreaCheck.errorSet].sort(SortUtil.ascSortLower);
			toPrint.forEach(tp => MSG.AreaCheck += `${tp}\n`);
		}

		if (AreaCheck.headerMap.__BAD) {
			AreaCheck.headerMap.__BAD.forEach(dupId => MSG.AreaCheck += `Duplicate ID: "${dupId}"\n`)
		}
	}
}
AreaCheck.errorSet = new Set();
AreaCheck.fileMatcher = /\/(adventure-).*\.json/;

class LootDataCheck {
	static run () {
		function handleItem (it) {
			const toCheck = typeof it === "string" ? {name: it, source: SRC_DMG} : it;
			const url = `${TAG_TO_PAGE["item"]}#${UrlUtil.encodeForHash([toCheck.name, toCheck.source])}`.toLowerCase().trim();
			if (!ALL_URLS.has(url)) MSG.LootCheck += `Missing link: ${JSON.stringify(it)} in file "${LootDataCheck.file}" (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
		}

		const loot = require(`../${LootDataCheck.file}`);
		loot.magicitems.forEach(it => {
			if (it.table) {
				it.table.forEach(row => {
					if (row.choose) {
						if (row.choose.fromGeneric) {
							row.choose.fromGeneric.forEach(handleItem);
						}

						if (row.choose.fromGroup) {
							row.choose.fromGroup.forEach(handleItem);
						}

						if (row.choose.fromItems) {
							row.choose.fromItems.forEach(handleItem);
						}
					}
				});
			}
		})
	}
}
LootDataCheck.file = `data/loot.json`;

class SpellDataCheck {
	static run () {
		const classIndex = JSON.parse(fs.readFileSync(SpellDataCheck._FILE_CLASS_INDEX, "utf8"));
		Object.values(classIndex).forEach(f => {
			const data = JSON.parse(fs.readFileSync(`data/class/${f}`, "utf8"));
			data.class.forEach(c => {
				const classMeta = {name: c.name, source: c.source};
				if (c.subclasses) {
					classMeta.subclasses = c.subclasses.map(sc => ({name: sc.shortName, source: sc.source}));
				}
				SpellDataCheck._CLASS_LIST.push(classMeta);
			});
		});

		const spellIndex = JSON.parse(fs.readFileSync(SpellDataCheck._FILE_SPELL_INDEX, "utf8"));
		Object.values(spellIndex).forEach(f => {
			const data = JSON.parse(fs.readFileSync(`data/spells/${f}`, "utf8"));
			data.spell.filter(sp => sp.classes).forEach(sp => {
				if (sp.classes.fromClassList) {
					const invalidClasses = sp.classes.fromClassList
						.filter(c => !SpellDataCheck._IGNORED_CLASSES.some(it => it.name === c.name && it.source === c.source))
						.filter(c => !SpellDataCheck._CLASS_LIST.some(it => it.name === c.name && it.source === c.source));
					invalidClasses.forEach(ic => MSG.SpellDataCheck += `Invalid class: ${JSON.stringify(ic)} in spell "${sp.name}" in file "${f}"\n`);
				}

				if (sp.classes.fromSubclass) {
					sp.classes.fromSubclass.forEach(sc => {
						const clazz = SpellDataCheck._CLASS_LIST.find(it => it.name === sc.class.name && it.source === sc.class.source);
						if (!clazz) return MSG.SpellDataCheck += `Invalid subclass class: $s{JSON.stringify(sc)} in spell "${sp.name}" in file "${f}"\n`;
						if (!clazz.subclasses) return MSG.SpellDataCheck += `Subclass class has no known subclasses: ${JSON.stringify(sc)} in spell "${sp.name}" in file "${f}"\n`;

						const isValidSubclass = clazz.subclasses.some(it => it.name === sc.subclass.name && it.source === sc.subclass.source);
						if (!isValidSubclass) return MSG.SpellDataCheck += `Subclass (shortName) does not exist: ${JSON.stringify(sc)} in spell "${sp.name}" in file "${f}"\n`;
					});
				}
			});
		});
	}
}
SpellDataCheck._IGNORED_CLASSES = []; // This can be pre-loaded with any exotic UA (see history)
SpellDataCheck._FILE_CLASS_INDEX = `data/class/index.json`;
SpellDataCheck._FILE_SPELL_INDEX = `data/spells/index.json`;
SpellDataCheck._CLASS_LIST = [];

class ClassDataCheck {
	static _doCheckClass (file, data, cls) {
		const walker = MiscUtil.getWalker({
			keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST,
			isNoModification: true,
		});

		// region Check `classFeatures` -> `classFeature` links
		const featureLookup = {};
		(data.classFeature || []).forEach(cf => {
			const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](cf);
			featureLookup[hash] = true;
		});

		cls.classFeatures.forEach(ref => {
			const uid = ref.classFeature || ref;
			const unpacked = DataUtil.class.unpackUidClassFeature(uid, {isLower: true});
			const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);
			if (!featureLookup[hash]) MSG.ClassDataCheck += `Missing class feature: ${uid} in file ${file} not found in the files "classFeature" array\n`;
		});

		const handlersNestedRefsClass = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refClassFeature") return;

					const uid = it.classFeature || it;
					const unpacked = DataUtil.class.unpackUidClassFeature(uid, {isLower: true});
					const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);

					if (!featureLookup[hash]) MSG.ClassDataCheck += `Missing class feature: ${uid} in file ${file} not found in the files "classFeature" array\n`;
				});
				return arr;
			},
		};
		(data.classFeature || []).forEach(cf => {
			walker.walk(cf.entries, handlersNestedRefsClass);
		});
		// endregion

		// region check `subclassFeatures` -> `subclassFeature` links
		if (cls.subclasses) {
			const subclassFeatureLookup = {};
			(data.subclassFeature || []).forEach(scf => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](scf);
				subclassFeatureLookup[hash] = true;
			});

			cls.subclasses.forEach(sc => this._doCheckSubclass(file, data, subclassFeatureLookup, cls, sc));

			const handlersNestedRefsSubclass = {
				array: (arr) => {
					arr.forEach(it => {
						if (it.type !== "refSubclassFeature") return;

						const uid = it.subclassFeature || it;
						const unpacked = DataUtil.class.unpackUidSubclassFeature(uid, {isLower: true});
						const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

						if (!subclassFeatureLookup[hash]) MSG.ClassDataCheck += `Missing subclass feature in "refSubclassFeature": ${it.subclassFeature} in file ${file} not found in the files "subclassFeature" array\n`;
					});
					return arr;
				},
			};
			(data.subclassFeature || []).forEach(scf => {
				walker.walk(scf.entries, handlersNestedRefsSubclass);
			});
		}
		// endregion

		// region Referenced optional features
		const handlersNestedRefsOptionalFeatures = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refOptionalfeature") return;

					const url = getEncoded(it.optionalfeature, "optfeature");
					if (!ALL_URLS.has(url)) MSG.ClassDataCheck += `Missing optional feature: ${it.optionalfeature} in file ${file} (evaluates to "${url}")\nSimilar URLs were:\n${getSimilar(url)}\n`;
				});
				return arr;
			},
		};
		(data.classFeature || []).forEach(cf => {
			walker.walk(cf.entries, handlersNestedRefsOptionalFeatures);
		});
		(data.subclassFeature || []).forEach(scf => {
			walker.walk(scf.entries, handlersNestedRefsOptionalFeatures);
		});
		// endregion
	}

	static _doCheckSubclass (file, data, subclassFeatureLookup, cls, sc) {
		sc.subclassFeatures.forEach(ref => {
			const uid = ref.subclassFeature || ref;
			const unpacked = DataUtil.class.unpackUidSubclassFeature(uid, {isLower: true});
			const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

			if (!subclassFeatureLookup[hash]) MSG.ClassDataCheck += `Missing subclass feature: ${uid} in file ${file} not found in the files "subclassFeature" array\n`;
		});

		TestTagsUtil.testAdditionalSpells(file, "ClassDataCheck", sc);
	}

	static run () {
		const index = ut.readJson("./data/class/index.json");
		Object.values(index)
			.map(filename => ({filename: filename, data: ut.readJson(`./data/class/${filename}`)}))
			.forEach(({filename, data}) => {
				data.class.forEach(cls => ClassDataCheck._doCheckClass(filename, data, cls));
			});
	}
}

class RaceDataCheck {
	static _handleRaceOrSubraceRaw (file, rsr, r) {
		TestTagsUtil.testAdditionalSpells(file, "RaceDataCheck", rsr);
	}

	static run () {
		const file = `data/races.json`;
		const races = require(`../${file}`);
		races.race.forEach(r => {
			this._handleRaceOrSubraceRaw(file, r);
			(r.subraces || []).forEach(sr => this._handleRaceOrSubraceRaw(file, sr, r))
		});
	}
}

class EscapeCharacterCheck {
	static checkString (file, str) {
		let re = /([\n\t\r])/g;
		let m;
		while ((m = re.exec(str))) {
			const startIx = Math.max(m.index - EscapeCharacterCheck._CHARS, 0);
			const endIx = Math.min(m.index + EscapeCharacterCheck._CHARS, str.length);
			EscapeCharacterCheck.errors.push(`...${str.substring(startIx, endIx)}...`.replace(/[\n\t\r]/g, (...m) => m[0] === "\n" ? "***\\n***" : m[0] === "\t" ? "***\\t***" : "***\\r***"));
		}
	}

	static checkFile (file, contents) {
		EscapeCharacterCheck.errors = [];
		ut.dataRecurse(file, contents, {string: EscapeCharacterCheck.checkString});
		if (EscapeCharacterCheck.errors.length) {
			MSG.EscapeCharacterCheck += `Unwanted escape characters in ${file}! See below:\n`;
			MSG.EscapeCharacterCheck += `\t${EscapeCharacterCheck.errors.join("\n\t")}`;
		}
	}
}
EscapeCharacterCheck._CHARS = 16;

class DuplicateEntityCheck {
	static checkFile (file, contents) {
		DuplicateEntityCheck.errors = [];

		Object.entries(contents)
			.filter(([_, arr]) => arr instanceof Array)
			.forEach(([prop, arr]) => {
				const positions = {};
				arr.forEach((ent, i) => {
					const name = ent.name;
					const source = ent.source ? ent.source : (ent.inherits && ent.inherits.source) ? ent.inherits.source : null;

					switch (prop) {
						case "deity": {
							if (name && source) {
								const key = `${source} :: ${ent.pantheon} :: ${name}`;
								(positions[key] = positions[key] || []).push(i);
							}
							break;
						}
						case "classFeature": {
							if (name && source) {
								const key = `${source} :: ${ent.level} :: ${ent.classSource} :: ${ent.className} :: ${name}`;
								(positions[key] = positions[key] || []).push(i);
							}
							break;
						}
						case "subclassFeature": {
							if (name && source) {
								const key = `${source} :: ${ent.level} :: ${ent.classSource} :: ${ent.className} :: ${ent.subclassSource} :: ${ent.subclassShortName} :: ${name}`;
								(positions[key] = positions[key] || []).push(i);
							}
							break;
						}
						default: {
							if (name && source) {
								const key = `${source} :: ${name}`;
								(positions[key] = positions[key] || []).push(i);
							}
							break;
						}
					}
				});

				if (Object.keys(positions).length) {
					const withDuplicates = Object.entries(positions)
						.filter(([k, v]) => v.length > 1);
					if (withDuplicates.length) {
						MSG.DuplicateEntityCheck += `Duplicate entity keys in ${file} array .${prop}! See below:\n`;
						withDuplicates.forEach(([k, v]) => {
							MSG.DuplicateEntityCheck += `\t${k} (at indexes ${v.join(", ")})\n`;
						});
					}
				}
			});
	}
}

async function main () {
	const primaryIndex = od.Omnidexer.decompressIndex(await utS.UtilSearchIndex.pGetIndex(false, true));
	primaryIndex.forEach(it => ALL_URLS.add(`${UrlUtil.categoryToPage(it.c)}#${(it.u).toLowerCase().trim()}`));
	const highestId = primaryIndex.last().id;
	const secondaryIndexItem = od.Omnidexer.decompressIndex(await utS.UtilSearchIndex.pGetIndexAdditionalItem(highestId + 1, false));
	secondaryIndexItem.forEach(it => ALL_URLS.add(`${UrlUtil.categoryToPage(it.c)}#${(it.u).toLowerCase().trim()}`));

	// populate class/subclass index
	ut.patchLoadJson();
	const classData = await DataUtil.class.loadJSON();
	ut.unpatchLoadJson();
	classData.class.forEach(cls => {
		cls.name = cls.name.toLowerCase();
		cls.source = (cls.source || SRC_PHB).toLowerCase();

		CLASS_SUBCLASS_LOOKUP[cls.source] = CLASS_SUBCLASS_LOOKUP[cls.source] || {};
		CLASS_SUBCLASS_LOOKUP[cls.source][cls.name] = {};

		(cls.subclasses || []).forEach(sc => {
			sc.shortName = (sc.shortName || sc.name).toLowerCase();
			sc.source = (sc.source || cls.source).toLowerCase();

			CLASS_SUBCLASS_LOOKUP[cls.source][cls.name][sc.source] = CLASS_SUBCLASS_LOOKUP[cls.source][cls.name][sc.source] || {};

			const ixFeatures = [];
			cls.classFeatures.forEach((levelFeatures, ixLevel) => {
				levelFeatures.forEach((_, ixFeature) => {
					ixFeatures.push(`${ixLevel}-${ixFeature}`)
				});
			});

			CLASS_SUBCLASS_LOOKUP[cls.source][cls.name][sc.source][sc.shortName] = ixFeatures;
		});
	});

	LinkCheck.addHandlers();
	ClassLinkCheck.addHandlers();
	BraceCheck.addHandlers();
	FilterCheck.addHandlers();
	ScaleDiceCheck.addHandlers();
	StripTagTest.addHandlers();
	TableDiceTest.addHandlers();

	ParsedJsonChecker.register((file, contents) => ut.dataRecurse(file, contents, PRIMITIVE_HANDLERS));
	ParsedJsonChecker.register(AreaCheck.checkFile.bind(AreaCheck));
	ParsedJsonChecker.register(EscapeCharacterCheck.checkFile.bind(EscapeCharacterCheck));
	ParsedJsonChecker.register(DuplicateEntityCheck.checkFile.bind(DuplicateEntityCheck));
	ParsedJsonChecker.runAll();

	ItemDataCheck.run();
	ActionData.run();
	DeityDataCheck.run();
	LootDataCheck.run();
	SpellDataCheck.run();
	ClassDataCheck.run();
	RaceDataCheck.run();

	let outMessage = "";
	Object.entries(MSG).forEach(([k, v]) => {
		if (v) outMessage += `Error messages for ${k}:\n\n${v}`;
		else console.log(`##### ${k} passed! #####`)
	});
	if (outMessage) console.error(outMessage);

	console.timeEnd(TIME_TAG);

	return !outMessage;
}

module.exports = main();
