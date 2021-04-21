"use strict";
if (typeof module !== "undefined") {
	require("./utils");
}

class Source {
	constructor (name, patEvenPage, patOddPage) {
		this.name = name;
		this.pageOffset = 0;
		this.patEvenPage = patEvenPage;
		this.patOddPage = patOddPage;
	}

	static fromString (str) {
		switch (str) {
			case "CRB": {
				const patEvenPage = new RegExp(/\n\d? ?Core Rulebook\n(\d{1,3})/);
				const patOddPage = new RegExp(/(?:\n.*?\d)?\n(\d{1,3})\n?.*?\nIntroduction\nAncestries &\nBackgrounds\nClasses\nSkills\nFeats\nEquipment\nSpells\nThe Age of\nLost OMENS\nPlaying the\nGame\nGame\nmastering\nCrafting\n& Treasure\nAppendix/);
				const crb = new Source("CRB", patEvenPage, patOddPage);
				crb.patTraits = new RegExp(/\n([A-Z 0-9-]+)\n([A-Z ]+\n)?/);
				return crb;
			}
			default: throw new Error(`Unknown source string ${str}.`);
		}
	}
}

class ConverterBase {
	constructor (source, textToConvert) {
		this.source = source;
		this.source.txt = textToConvert;
		this.converting = null;
		this.matches = [];
		this.converted = [];
	}

	get last () { return this.converted.last() }

	postConversion () { /* Implement as needed */ }

	convert (match) { throw new Error("Unimplemented") }

	convertAll () {
		this.matches.forEach((match, idx) => {
			this.converting = match;
			this.convertingIdx = idx;
			const converted = this.convert(this.converting);
			this.converted.push(converted)
		});
		this.postConversion();
	}

	cleanString (string, opts) {
		opts = opts || {};
		if (!opts.ignoreMultiLinebreak) {
			string = string.replace(/\n\n\n.+/s, "");
		}
		if (opts.removePageNumbers) {
			string = string.replace(this.source.patEvenPage, "\n");
			string = string.replace(this.source.patOddPage, "\n");
		}
		if (opts.cleanWhitespace) {
			string = string.replace(/\s+/g, " ").trim();
		}
		return string
	}

	cleanEntry (rawEntry) {
		let entries;
		if (rawEntry.includes("•")) {
			// handle lists
		} else {
			// split by .\n
			entries = rawEntry.split(".\n").filter(it => it.replace(/\s/g, "").length)
				.map(s => this.cleanString(s, {cleanWhitespace: true}));
		}
		return entries;
	}

	getPageNumber () {
		const sliced = this.source.txt.slice(this.converting.index + this.converting[0].length);
		const nextEven = sliced.match(this.source.patEvenPage);
		const nextOdd = sliced.match(this.source.patOddPage);
		if (nextEven.index < nextOdd.index) return Number(nextEven[1]) + this.source.pageOffset;
		else return Number(nextOdd[1]) + this.source.pageOffset;
	}
}

class ConverterUtils {
	// TODO:
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
		str = str.replace(/{@dice ([-+0-9d ]*)}( (?:persistent )?(?:bludgeoning|piercing|slashing|acid|cold|electricity|fire|sonic|positive|negative|force|chaotic|evil|good|lawful|mental|poison|bleed|precision))/gi, (...m) => {
			return `{@damage ${m[1]}}${m[2]}`;
		});
		str = str.replace(/{@dice ([-+0-9d ]*)}( {@condition persistent)/gi, (...m) => {
			return `{@damage ${m[1]}}${m[2]}`;
		});
		if (lastKey === "damage") {
			str = str.replace(/{@dice ([-+0-9d ]*)} (bludgeoning|piercing|slashing|acid|cold|electricity|fire|sonic|positive|negative|force|chaotic|evil|good|lawful|mental|poison|bleed|precision)/gi, (...m) => {
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
			return `{@skill Lore${m[1] ? `|${m[0]}` : ""}}`;
		}).replace(SkillTag._SKILLS_REGEX, `{@skill $&}`)
	}
}
SkillTag._LORE_REGEX = new RegExp(/((?:[A-Z][\S]+ )+)?Lore/g);
SkillTag._SKILLS_REGEX = new RegExp(/(Acrobatics|Arcana|Athletics|Crafting|Deception|Diplomacy|Intimidation|Medicine|Nature|Occultism|Performance|Religion|Society|Stealth|Survival|Thievery)/g);

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
		return str.replace(ConditionTag._CONDITIONS_REGEX, (...m) => {
			if (m[2]) return `{@condition ${m[1]}|CRB|${m[1]}${m[2]}}`;
			else return `{@condition ${m[1]}}`;
		}).replace(/persistent ((damage)|(?:bludgeoning|piercing|slashing|acid|cold|electricity|fire|sonic|positive|negative|force|chaotic|evil|good|lawful|mental|poison|bleed|precision)(?: damage)?)/gi, (...m) => {
			return `{@condition persistent damage${m[2] ? "" : ` ||persistent ${m[1]}`}}`
		});
	}
}
ConditionTag._CONDITIONS = ["Blinded", "Broken", "Clumsy", "Concealed", "Confused", "Controlled", "Dazzled", "Deafened",
	"Doomed", "Drained", "Dying", "Encumbered", "Enfeebled", "Fascinated", "Fatigued", "Flat.Footed",
	"Fleeing", "Friendly", "Frightened", "Grabbed", "Helpful", "Hidden", "Hostile", "Immobilized",
	"Indifferent", "Invisible", "Observed", "Paralyzed", "Petrified", "Prone", "Quickened", "Restrained",
	"Sickened", "Slowed", "Stunned", "Stupefied", "Unconscious", "Undetected", "Unfriendly",
	"Unnoticed", "Wounded"]
ConditionTag._CONDITIONS_REGEX = new RegExp(`(?<![a-z])(${ConditionTag._CONDITIONS.join("|")})( [0-9]+)?(?![a-z])`, "gi")

if (typeof module !== "undefined") {
	module.exports = {
		Source,
		ConverterBase,
		TaggerUtils,
		ActionSymbolTag,
		DiceTag,
		SkillTag,
		ConditionTag,
	}
}
