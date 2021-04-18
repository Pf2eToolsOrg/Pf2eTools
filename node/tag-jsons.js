const fs = require("fs");
require("../js/utils.js");
require("../js/render.js");
require("../js/render-dice.js");
const ut = require("./util.js");
const {Tagger, TaggerUtils, ActionSymbolTag, DiceTag, SkillTag, ConditionTag} = require("../js/converterutils.js");

/**
 * Args:
 * file="./data/my-file.json"
 * filePrefix="./data/dir/"
 * inplace
 */
class ArgParser {
	static parse () {
		const ARGS = {};
		process.argv
			.slice(2)
			.forEach(arg => {
				let [k, v] = arg.split("=").map(it => it.trim()).filter(Boolean);
				if (v == null) ARGS[k] = true;
				else {
					v = v
						.replace(/^"(.*)"$/, "$1")
						.replace(/^'(.*)'$/, "$1")
					;

					if (!isNaN(v)) ARGS[k] = Number(v);
					else ARGS[k] = v;
				}
			});
		return ARGS;
	}
}

const BLACKLIST_FILE_PREFIXES = [
	...ut.FILE_PREFIX_BLACKLIST,

	// specific files
	"demo.json",
];

const LAST_KEY_WHITELIST = new Set([
	"entries",
	"entry",
	"items",
	"entriesHigherLevel",
	"rows",
	"row",
	"fluff",
]);

class TagJsons {
	static async pInit () {
		ut.patchLoadJson();
		SpellTag.init();
		await ItemTag.pInit();
		ActionTag.init();
		TraitTag.init();
	}

	static teardown () {
		ut.unpatchLoadJson();
	}

	static run (args) {
		let files;
		if (args.file) {
			files = [args.file];
		} else {
			files = ut.listFiles({dir: `./data`, blacklistFilePrefixes: BLACKLIST_FILE_PREFIXES});
			if (args.filePrefix) {
				files = files.filter(f => f.startsWith(args.filePrefix));
				if (!files.length) throw new Error(`No file with prefix "${args.filePrefix}" found!`);
			}
		}

		files.forEach(file => {
			console.log(`Tagging file "${file}"`)
			let json = ut.readJson(file);

			json = TagJsons.doTag(json);

			const outPath = args.inplace ? file : file.replace("./data/", "./trash/");
			if (!args.inplace) {
				const dirPart = outPath.split("/").slice(0, -1).join("/");
				fs.mkdirSync(dirPart, {recursive: true});
			}
			fs.writeFileSync(outPath, CleanUtil.getCleanJson(json));
		});
	}

	static doTag (json) {
		if (json instanceof Array) return json;

		Object.keys(json)
			.forEach(k => {
				json[k] = TaggerUtils.WALKER.walk(
					json[k],
					{
						object: (obj, lastKey) => {
							if (lastKey != null && !LAST_KEY_WHITELIST.has(lastKey)) return obj

							obj = ActionSymbolTag.tryRun(obj);
							obj = DiceTag.tryRun(obj);
							obj = TraitTag.tryRun(obj);
							obj = ConditionTag.tryRun(obj);
							obj = ActionTag.tryRun(obj);
							obj = SkillTag.tryRun(obj);
							obj = SpellTag.tryRun(obj);
							// obj = ItemTag.tryRun(obj);

							return obj;
						},
					},
				);
			});
		return json;
	}
}

class SpellTag {
	static init () {
		const spellIndex = ut.readJson(`./data/spells/index.json`);
		Object.entries(spellIndex).forEach(([source, filename]) => {
			if (SourceUtil.isNonstandardSource(source)) return;

			const spellData = ut.readJson(`./data/spells/${filename}`);
			spellData.spell.forEach(sp => {
				SpellTag._SPELL_NAMES[sp.name.toLowerCase()] = {name: sp.name, source: sp.source};
			});
		});

		SpellTag._SPELL_NAME_REGEX = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")})`, "gi");
		SpellTag._SPELL_NAME_REGEX_LEVEL_CAST = new RegExp(`(level|cast) (${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")})`, "gi");
		SpellTag._SPELL_NAME_REGEX_AS_LEVEL = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")}) (as a [0-9]+[a-z]{2}.level)`, "gi");
		SpellTag._SPELL_NAME_REGEX_SPELL = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")}) ((?:metamagic )?(?:focus |composition |devotion )?(?:spell|cantrip))`, "gi");
		SpellTag._SPELL_NAME_REGEX_AND = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")}),? ((?:and|or) {@spell)`, "gi");
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@spell"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag,
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(SpellTag._SPELL_NAME_REGEX_SPELL, (...m) => {
				const spellMeta = SpellTag._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== SRC_CRB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
			.replace(SpellTag._SPELL_NAME_REGEX_AND, (...m) => {
				const spellMeta = SpellTag._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== SRC_CRB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
			.replace(SpellTag._SPELL_NAME_REGEX_AS_LEVEL, (...m) => {
				const spellMeta = SpellTag._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== SRC_CRB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
			.replace(/(spells(?:|[^.!?:{]*): )([^.!?]+)/gi, (...m) => {
				const spellPart = m[2].replace(SpellTag._SPELL_NAME_REGEX, (...n) => {
					const spellMeta = SpellTag._SPELL_NAMES[n[1].toLowerCase()];
					return `{@spell ${n[1]}${spellMeta.source !== SRC_CRB ? `|${spellMeta.source}` : ""}}`;
				});
				return `${m[1]}${spellPart}`;
			})
			.replace(SpellTag._SPELL_NAME_REGEX_LEVEL_CAST, (...m) => {
				const spellMeta = SpellTag._SPELL_NAMES[m[2].toLowerCase()];
				return `${m[1]} {@spell ${m[2]}${spellMeta.source !== SRC_CRB ? `|${spellMeta.source}` : ""}}`
			});
	}
}
SpellTag._SPELL_NAMES = {};
SpellTag._SPELL_NAME_REGEX = null;
SpellTag._SPELL_NAME_REGEX_SPELL = null;
SpellTag._SPELL_NAME_REGEX_AND = null;
SpellTag._SPELL_NAME_REGEX_AS_LEVEL = null;
SpellTag._SPELL_NAME_REGEX_LEVEL_CAST = null;

class ItemTag {
	static async pInit () {
		const itemArr = await Renderer.item.pBuildList({isAddGroups: true});
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@item"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag,
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod;
	}
}

class TraitTag {
	static init () {
		const traits = ut.readJson(`./data/traits.json`).trait.map(it => it.name);
		TraitTag._TRAITS_REGEX_EFFECT = new RegExp(` (${traits.join("|")}) (effect|trait)`, "gi");
		TraitTag._TRAITS_REGEX_AND = new RegExp(` (${traits.join("|")})(,? and|,? or) {@trait`, "gi");
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@trait"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag,
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (str) {
		return str.replace(TraitTag._TRAITS_REGEX_EFFECT, (...m) => {
			return ` {@trait ${m[1]}} ${m[2]}`;
		}).replace(TraitTag._TRAITS_REGEX_AND, (...m) => {
			return ` {@trait ${m[1]}}${m[2]} {@trait`;
		});
	}
}
TraitTag._TRAITS_REGEX_EFFECT = null;
TraitTag._TRAITS_REGEX_AND = null;

class ActionTag {
	static init () {
		const actionData = ut.readJson(`./data/actions.json`);
		actionData.action.forEach(a => {
			ActionTag._ACTIONS[a.name] = {name: a.name, source: a.source};
			// try and catch some conjugates
			ActionTag._ACTIONS[a.name.replace(/([\w]+)\s(.+)/, "$1ing $2")] = {name: a.name, source: a.source};
			ActionTag._ACTIONS[a.name.replace(/([\w]+)\w\s(.+)/, "$1ing $2")] = {name: a.name, source: a.source};
			ActionTag._ACTIONS[a.name.replace(/([\w]+)(\w)\s(.+)/, "$1$2$2ing $3")] = {name: a.name, source: a.source};
		});

		ActionTag._ACTIONS_REGEX = new RegExp(`(${Object.keys(ActionTag._ACTIONS).map(it => it.escapeRegexp()).join("|")})(?![a-z])`, "g");
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@trait"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag,
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (str) {
		return str.replace(ActionTag._ACTIONS_REGEX, (...m) => {
			const meta = ActionTag._ACTIONS[m[1]];
			const pipes = [];
			if (meta.source !== SRC_CRB) pipes.push(meta.source);
			if (meta.source === SRC_CRB && meta.name !== m[1]) pipes.push("|");
			if (meta.name !== m[1]) pipes.push(m[1]);
			return `{@action ${meta.name}${pipes.join("|")}}`
		})
	}
}
ActionTag._ACTIONS = {};
ActionTag._ACTIONS_REGEX = null;

async function main () {
	const args = ArgParser.parse();
	await TagJsons.pInit();
	TagJsons.run(args);
	TagJsons.teardown();
}

if (require.main === module) {
	main().then(() => console.log("Run complete.")).catch(e => { throw e; });
} else {
	module.exports = {
		TagJsons,
		ArgParser,
	};
}
