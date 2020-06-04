const fs = require("fs");
require("../js/utils.js");
require("../js/render.js");
const ut = require("./util.js");
const {TaggerUtils, SkillTag, ActionTag, SenseTag, TagCondition, DiceConvert} = require("../js/converterutils");

const BLACKLIST_FILE_PREFIXES = [
	...ut.FILE_PREFIX_BLACKLIST,

	// specific files
	"demo.json"
];

const LAST_KEY_WHITELIST = new Set([
	"entries",
	"entry",
	"items",
	"entriesHigherLevel",
	"rows",
	"row"
]);

class TagJsons {
	static init () {
		// region Spells
		const spellIndex = ut.readJson(`./data/spells/index.json`);
		Object.entries(spellIndex).forEach(([source, filename]) => {
			if (SourceUtil.isNonstandardSource(source)) return;

			const spellData = ut.readJson(`./data/spells/${filename}`);
			spellData.spell.forEach(sp => {
				TagJsons._SPELL_NAMES[sp.name.toLowerCase()] = {name: sp.name, source: sp.source};
			});
		});

		TagJsons._SPELL_NAME_REGEX = new RegExp(`(${Object.keys(TagJsons._SPELL_NAMES).join("|")}) (spell)`, "gi");
		TagJsons._SPELL_NAME_REGEX_AND = new RegExp(`(${Object.keys(TagJsons._SPELL_NAMES).join("|")}) (and {@spell)`, "gi");
		// endregion
	}

	static run () {
		const files = ut.listFiles({dir: `./data`, blacklistFilePrefixes: BLACKLIST_FILE_PREFIXES});

		files.forEach(file => {
			console.log(`Tagging file "${file}"`)
			const json = ut.readJson(file);

			if (json instanceof Array) return;

			Object.keys(json)
				.forEach(k => {
					json[k] = TagJsons._WALKER.walk(
						"tagger",
						json[k],
						{
							object: (ident, obj, lastKey) => {
								if (!LAST_KEY_WHITELIST.has(lastKey)) return obj

								obj = TagCondition.tryRunBasic(obj);
								obj = SkillTag.tryRun(obj);
								obj = ActionTag.tryRun(obj);
								obj = SenseTag.tryRun(obj);
								obj = SpellTag.tryRun(obj);
								obj = DiceConvert.getTaggedEntry(obj);

								return obj;
							}
						}
					);
				});

			const outPath = file.replace("./data/", "./trash/");
			const dirPart = outPath.split("/").slice(0, -1).join("/");
			fs.mkdirSync(dirPart, {recursive: true});
			fs.writeFileSync(outPath, CleanUtil.getCleanJson(json));
		});
	}
}
TagJsons._WALKER = MiscUtil.getWalker({keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST});
TagJsons._SPELL_NAMES = {};
TagJsons._SPELL_NAME_REGEX = null;

class SpellTag {
	static tryRun (it) {
		const walker = MiscUtil.getWalker({keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST});
		return walker.walk(
			"spellTagger",
			it,
			{
				string: (ident, str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@spell"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag
						}
					);
					return ptrStack._;
				}
			}
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(TagJsons._SPELL_NAME_REGEX, (...m) => {
				const spellMeta = TagJsons._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
			.replace(TagJsons._SPELL_NAME_REGEX_AND, (...m) => {
				const spellMeta = TagJsons._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
		;
	}
}

TagJsons.init();
TagJsons.run();
