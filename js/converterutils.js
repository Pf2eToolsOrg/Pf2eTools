"use strict";
if (typeof module !== "undefined") {
	require("./utils");
}

class TaggerUtils {
	/**
	 *
	 * @param targetTags e.g. `["@condition"]`
	 * @param ptrStack
	 * @param depth
	 * @param str
	 * @param tagCount
	 * @param meta
	 * @param meta.fnTag
	 * @param [meta.isAllowTagsWithinTags]
	 */
	static walkerStringHandler (targetTags, ptrStack, depth, tagCount, str, meta) {
		const tagSplit = Renderer.splitByTags(str);
		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;
			if (s.startsWith("{@")) {
				const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));

				ptrStack._ += `{${tag}${text.length ? " " : ""}`;
				if (!meta.isAllowTagsWithinTags) {
					// Never tag anything within an existing tag
					this.walkerStringHandler(targetTags, ptrStack, depth + 1, tagCount + 1, text, meta);
				} else {
					// Tag something within an existing tag only if it doesn't match our tag(s)
					if (targetTags.includes(tag)) {
						this.walkerStringHandler(targetTags, ptrStack, depth + 1, tagCount + 1, text, meta);
					} else {
						this.walkerStringHandler(targetTags, ptrStack, depth + 1, tagCount, text, meta);
					}
				}
				ptrStack._ += `}`;
			} else {
				// avoid tagging things wrapped in existing tags
				if (tagCount) {
					ptrStack._ += s;
				} else {
					let sMod = s;
					sMod = meta.fnTag(sMod);
					ptrStack._ += sMod;
				}
			}
		}
	}
}
TaggerUtils.WALKER = MiscUtil.getWalker({keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST});

class ActionSymbolTag {
	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@as"],
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
		return str.replace(ActionSymbolTag._SYMBOLS_REGEX, (...m) => {
			let activity = 0;
			if (m[2]) activity = "R";
			else if (m[3]) activity = "1";
			else if (m[4]) activity = "2";
			else if (m[5]) activity = "3";
			else if (m[6]) activity = "F";
			return `{@as ${activity}}`;
		});
	}
}
ActionSymbolTag._SYMBOLS_REGEX = new RegExp(/\[((re)|(one).|(two).|(three).|(free).)actions?]/gi)

class DiceTag {
	static cleanDiceStr (str) {
		return str.replace(/\s/g, "").replace(/\u2014/g, "-");
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(it, {
			string: this._walkerStringHandler,
		});
	}

	static _walkerStringHandler (str, lastKey) {
		// generic @dice
		str = str.replace(DiceTag._DICE_REGEX, (...m) => {
			return `{@dice ${DiceTag.cleanDiceStr(m[0])}}`;
		});

		// unwrap double-tagged
		let last;
		do {
			last = str;
			str = str.replace(/{@(dice|damage|scaledice|scaledamage|d20) ([^}]*){@(dice|damage|scaledice|scaledamage|d20) ([^}]*)}([^}]*)}/gi, (...m) => {
				// Choose the strongest dice type we have
				const nxtType = [
					m[1] === "scaledamage" || m[3] === "scaledamage" ? "scaledamage" : null,
					m[1] === "damage" || m[3] === "damage" ? "damage" : null,
					m[1] === "d20" || m[3] === "d20" ? "d20" : null,
					m[1] === "scaledice" || m[3] === "scaledice" ? "scaledice" : null,
					m[1] === "dice" || m[3] === "dice" ? "dice" : null,
				].filter(Boolean)[0];
				return `{@${nxtType} ${m[2]}${m[4]}${m[5]}}`;
			});
		} while (last !== str);

		// @damage
		str = str.replace(/{@dice ([-+0-9d ]*)}( (?:persistent )?[a-z]+ damage)/gi, (...m) => {
			return `{@damage ${m[1]}}${m[2]}`;
		});
		str = str.replace(/{@dice ([-+0-9d ]*)}( (?:persistent )?(?:bludgeoning|piercing|slashing|acid|cold|electricity|fire|sonic|positive|negative|force|chaotic|evil|good|lawful|mental|poison|bleed|precision|vitality|void))/gi, (...m) => {
			return `{@damage ${m[1]}}${m[2]}`;
		});
		str = str.replace(/{@dice ([-+0-9d ]*)}( {@condition persistent)/gi, (...m) => {
			return `{@damage ${m[1]}}${m[2]}`;
		});
		// TODO: @scaledamage?
		str = str.replace(/damage increases by {@dice ([-+0-9d ]*)}/gi, (...m) => {
			return `damage increases by {@damage ${m[1]}}`;
		});
		str = str.replace(/deal {@dice ([-+0-9d ]*)} damage/gi, (...m) => {
			return `deal {@damage ${m[1]}} damage`;
		});
		if (lastKey === "damage") {
			str = str.replace(/{@dice ([-+0-9d ]*)} (bludgeoning|piercing|slashing|acid|cold|electricity|fire|sonic|positive|negative|force|chaotic|evil|good|lawful|mental|poison|bleed|precision|vitality|void)/gi, (...m) => {
				return `{@damage ${m[1]}} ${m[2]}`;
			});
		}

		// TODO: @scaleDice cant be done using string handler
		// str = str.replace(/(increases by ){@dice/g, (...m) => {
		// 	return `${m[1]}{@scaledice`
		// });

		// @hit (form spells)
		str = str.replace(/attack modifier is +(\d+)/g, (...m) => {
			return `attack modifier is {@hit ${m[1]}}`
		});

		// flat check DCs
		str = str.replace(/DC (\d+) flat/g, (...m) => {
			return `DC {@flatDC ${m[1]}} flat`;
		})
		return str;
	}
}
DiceTag._DICE_REGEX = new RegExp(/(?:(?:\s?[+-]\s?)?\d+d\d+)+(?:(?:\s?[+-]\s?)\s?\d+)?/g);

class SkillTag {
	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@skill"],
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
		return str.replace(SkillTag._LORE_REGEX, (...m) => {
			return `{@skill Lore${m[1] ? `||${m[0]}` : ""}}`;
		}).replace(SkillTag._SKILLS_REGEX, `{@skill $&}`)
	}
}
SkillTag._LORE_REGEX = new RegExp(/((?:[A-Z][^\s,;]+ )+)?Lore/g);
SkillTag._SKILLS_REGEX = new RegExp(/(Acrobatics|Arcana|Athletics|Crafting|Deception|Diplomacy|Intimidation|Medicine|Nature|Occultism|Performance|Religion|Society|Stealth|Survival|Thievery|Perception)/g);

class ConditionTag {
	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@condition"],
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
		if (str.match(/off.?guard/i)) return str === "off-guard" ? "{@condition off-guard|PC1}" : `{@condition off-guard|PC1|${str}}`;
		return str.replace(ConditionTag._CONDITIONS_REGEX, (...m) => {
			if (m[2]) return `{@condition ${m[1]}||${m[1]}${m[2]}}`;
			else return `{@condition ${m[1]}}`;
		}).replace(/persistent ((damage)|(?:bludgeoning|piercing|slashing|acid|cold|electricity|fire|sonic|positive|negative|force|chaotic|evil|good|lawful|mental|poison|bleed|precision|void|vitality)(?: damage)?)/gi, (...m) => {
			return `{@condition persistent damage${m[2] ? "" : `||persistent ${m[1]}`}}`
		});
	}
}
ConditionTag._CONDITIONS = ["Blinded", "Broken", "Clumsy", "Concealed", "Confused", "Controlled", "Dazzled", "Deafened",
	"Doomed", "Drained", "Dying", "Encumbered", "Enfeebled", "Fascinated", "Fatigued", "Flat.?Footed",
	"Fleeing", "Friendly", "Frightened", "Grabbed", "Helpful", "Hidden", "Hostile", "Immobilized",
	"Indifferent", "Invisible", "Observed", "Paralyzed", "Petrified", "Prone", "Quickened", "Restrained",
	"Sickened", "Slowed", "Stunned", "Stupefied", "Unconscious", "Undetected", "Unfriendly",
	"Unnoticed", "Wounded", "Off.?Guard"]
ConditionTag._CONDITIONS_REGEX = new RegExp(`(?<![a-z])(${ConditionTag._CONDITIONS.join("|")})( [0-9]+)?(?![a-z])`, "gi")

// region with entries

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
	static async pInit (opts) {
		opts = opts || {};
		SpellTag.init(opts.spells);
		FeatTag.init(opts.feats);
		await ItemTag.pInit(opts.items);
		ActionTag.init(opts.actions);
		TraitTag.init(opts.traits);
		DeityTag.init(opts.deities);
		GroupTag.init();
	}

	static doTag (json) {
		if (json instanceof Array) return json;

		Object.keys(json).forEach(k => {
			json[k] = TaggerUtils.WALKER.walk(json[k],
				{
					object: (obj, lastKey) => {
						if (lastKey != null && !LAST_KEY_WHITELIST.has(lastKey)) return obj

						this.runTags(obj);

						return obj;
					},
				},
			);
		});
		return json;
	}

	static runTags (obj) {
		obj = ActionSymbolTag.tryRun(obj);
		obj = DiceTag.tryRun(obj);
		obj = TraitTag.tryRun(obj);
		if (SpellTag._INIT) obj = SpellTag.tryRun(obj);
		if (FeatTag._INIT) obj = FeatTag.tryRun(obj);
		obj = ConditionTag.tryRun(obj);
		if (DeityTag._INIT) obj = DeityTag.tryRun(obj);
		if (GroupTag._INIT) obj = GroupTag.tryRun(obj);
		if (ActionTag._INIT) obj = ActionTag.tryRun(obj);
		obj = SkillTag.tryRun(obj); // eslint-disable-line
		// obj = ItemTag.tryRun(obj);
	}

	static doTagStr (string) {
		let obj = {string};
		this.runTags(obj);
		return obj.string;
	}
}

class SpellTag {
	static init (spells) {
		spells = spells || [];
		spells.forEach(sp => {
			SpellTag._SPELL_NAMES[sp.name.toLowerCase()] = {name: sp.name, source: sp.source};
		});

		SpellTag._SPELL_NAME_REGEX = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")})`, "gi");
		SpellTag._SPELL_NAME_REGEX_LEVEL_CAST = new RegExp(`(level|cast) (${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")})`, "gi");
		SpellTag._SPELL_NAME_REGEX_AS_LEVEL = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")}) (as a [0-9]+[a-z]{2}.level)`, "gi");
		SpellTag._SPELL_NAME_REGEX_SPELL = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")}) ((?:metamagic )?(?:focus |composition |devotion )?(?:spell|cantrip))`, "gi");
		SpellTag._SPELL_NAME_REGEX_AND = new RegExp(`(${Object.keys(SpellTag._SPELL_NAMES).map(it => it.escapeRegexp()).join("|")}),? ((?:and|or) {@spell)`, "gi");
		if (spells.length) SpellTag._INIT = true;
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
SpellTag._INIT = false;
SpellTag._SPELL_NAMES = {};
SpellTag._SPELL_NAME_REGEX = null;
SpellTag._SPELL_NAME_REGEX_SPELL = null;
SpellTag._SPELL_NAME_REGEX_AND = null;
SpellTag._SPELL_NAME_REGEX_AS_LEVEL = null;
SpellTag._SPELL_NAME_REGEX_LEVEL_CAST = null;

// FIXME/TODO:
class ItemTag {
	static pInit (items) {
		items = items || []; // eslint-disable-line
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

class FeatTag {
	static init (feats) {
		feats = feats || [];
		feats.forEach(f => {
			FeatTag._FEAT_NAMES[f.name.toLowerCase()] = {name: f.name, source: f.source};
		});
		FeatTag._FEATS_REGEX_NAMES = new RegExp(`(${Object.keys(FeatTag._FEAT_NAMES).map(it => it.toTitleCase().escapeRegexp()).join("|")})(?: .page [0-9]+.)?`, "g")
		FeatTag._FEATS_REGEX_FEAT = new RegExp(`(${Object.keys(FeatTag._FEAT_NAMES).map(it => it.escapeRegexp()).join("|")}) ([a-z]+ feat)`, "gi")
		if (feats.length) FeatTag._INIT = true;
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: FeatTag._walkerStringHandler,
			},
		);
	}

	static _walkerStringHandler (str, lastKey) {
		str = str.replace(FeatTag._FEATS_REGEX_FEAT, (...m) => {
			const featMeta = FeatTag._FEAT_NAMES[m[1].toLowerCase()];
			return `{@feat ${m[1]}${featMeta.source !== SRC_CRB ? `|${featMeta.source}` : ""}} ${m[2]}`
		});
		if (lastKey === "prerequisites") {
			str = str.replace(FeatTag._FEATS_REGEX_NAMES, (...m) => {
				const featMeta = FeatTag._FEAT_NAMES[m[1].toLowerCase()];
				return `{@feat ${m[1]}${featMeta.source !== SRC_CRB ? `|${featMeta.source}` : ""}}`
			});
		}
		return str
	}
}
FeatTag._INIT = false;
FeatTag._FEAT_NAMES = {};
FeatTag._FEATS_REGEX_FEAT = null;
FeatTag._FEATS_REGEX_NAMES = null;

class TraitTag {
	static init (traits) {
		traits = (traits || []).map(t => t.name);
		TraitTag._TRAITS_REGEX_EFFECT = new RegExp(` (${traits.join("|")}) (effect|trait|creature|object)`, "gi");
		TraitTag._TRAITS_REGEX_AND = new RegExp(` (${traits.join("|")})(,? and|,? or) {@trait`, "gi");
		if (traits.length) TraitTag._INIT = true;
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
TraitTag._INIT = false;
TraitTag._TRAITS_REGEX_EFFECT = null;
TraitTag._TRAITS_REGEX_AND = null;

// To tag Cast a Spell-isms it's ` (?<!"|\{|\||@action )(Cast .+? Spell)(?<!"|\}|\|) `
class ActionTag {
	static init (actions) {
		actions = actions || [];
		actions.forEach(a => {
			ActionTag._ACTIONS[a.name] = {name: a.name, source: a.source};
			// try and catch some conjugates
			ActionTag._ACTIONS[a.name.replace(/([\w]+)\s(.+)/, "$1ing $2")] = {name: a.name, source: a.source};
			ActionTag._ACTIONS[a.name.replace(/([\w]+)\w\s(.+)/, "$1ing $2")] = {name: a.name, source: a.source};
			ActionTag._ACTIONS[a.name.replace(/([\w]+)(\w)\s(.+)/, "$1$2$2ing $3")] = {name: a.name, source: a.source};
		});

		ActionTag._ACTIONS_REGEX = new RegExp(`(${Object.keys(ActionTag._ACTIONS).map(it => it.escapeRegexp()).join("|")})(?![a-z])`, "g");
		if (actions.length) ActionTag._INIT = true;
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
			const pipes = [meta.name];
			if (meta.source !== SRC_CRB) pipes.push(meta.source);
			if (meta.source === SRC_CRB && meta.name !== m[1]) pipes.push("");
			if (meta.name !== m[1]) pipes.push(m[1]);
			return `{@action ${pipes.join("|")}}`
		})
	}
}
ActionTag._INIT = false;
ActionTag._ACTIONS = {};
ActionTag._ACTIONS_REGEX = null;

class DeityTag {
	static init (deities) {
		deities = deities || [];
		deities.forEach(a => {
			DeityTag._DEITIES[a.name] = {name: a.name, source: a.source};
			// FIXME: Leaving parts of the deities name untagged (such as {@deity Abadar}'s) is ugly. MrVauxs unfortunately cannot figure out how to add such cases to be tagged as well.
		});
		DeityTag._DEITIES_REGEX = new RegExp(`(${Object.keys(DeityTag._DEITIES).map(it => it.escapeRegexp()).join("|")})(?![a-z])`, "g");
		if (deities.length) DeityTag._INIT = true;
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@deity"],
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
		return str.replace(DeityTag._DEITIES_REGEX, (...m) => {
			const meta = DeityTag._DEITIES[m[1]];
			const pipes = [meta.name];
			if (meta.source !== SRC_CRB) pipes.push(meta.source);
			if (meta.source === SRC_CRB && meta.name !== m[1]) pipes.push("");
			if (meta.name !== m[1]) pipes.push(m[1]);
			return `{@deity ${pipes.join("|")}}`
		})
	}
}
DeityTag._INIT = false;
DeityTag._DEITIES = {};
DeityTag._DEITIES_REGEX = null;

class GroupTag {
	static init (groups) {
		groups = groups || [];
		groups.forEach(a => {
			GroupTag._GROUPS[a.name] = {name: a.name, source: a.source};
		});
		GroupTag._GROUPS_REGEX = new RegExp(`(${Object.keys(GroupTag._GROUPS).map(it => it.escapeRegexp()).join("|")})(?![a-z])(weapon|armor|) group`, "gi");
		if (groups.length) GroupTag._INIT = true;
	}

	static tryRun (it) {
		return TaggerUtils.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@group"],
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
		return str.replace(GroupTag._GROUPS_REGEX, (...m) => {
			const groupMeta = GroupTag._GROUPS[m[1].toLowerCase()];
			return `{@group ${m[1]}}`
		})
	}
}
GroupTag._INIT = false;
GroupTag._GROUPS = {};
GroupTag._GROUPS_REGEX = null;

// endregion

if (typeof module !== "undefined") {
	module.exports = {
		TagJsons,
		TaggerUtils,
		ActionSymbolTag,
		DiceTag,
		SkillTag,
		ConditionTag,
		SpellTag,
		ItemTag,
		FeatTag,
		TraitTag,
		ActionTag,
		DeityTag,
		GroupTag,
	}
}
