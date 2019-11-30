"use strict";

if (typeof module !== "undefined") {
	global.PropOrder = require("./utils-proporder.js");
}

/*
 * Various utilities to assist in statblock parse/conversion. Formatted as a Node module, to allow external use.
 *
 * In all cases, the first argument, `m`, is a monster statblock.
 * Additionally, `cbMan` is a callback which should accept up to two arguments representing part of the statblock which
 * require manual consideration/tagging, and an error message, respectively.
 * Where available, `cbErr` accepts the same arguments, and may be called when an error occurs (the parser encounters
 * something too far from acceptable to be solved with manual conversion; for instance, in the case of completely junk
 * data, or common errors which should be corrected prior to running the parser).
 */

String.prototype.split_handleColon = String.prototype.split_handleColon || function (str, maxSplits = Number.MAX_SAFE_INTEGER) {
	if (str === "") return this.split("");

	const colonStr = `${str.trim()}:`;
	const isColon = this.toLowerCase().startsWith(colonStr.toLowerCase());

	const re = isColon ? new RegExp(colonStr, "ig") : new RegExp(str, "ig");
	const targetString = isColon ? colonStr : str;

	let m = re.exec(this);
	let splits = 0;
	const out = [];
	const indexes = [];

	while (m && splits < maxSplits) {
		indexes.push(m.index);

		splits++;
		m = re.exec(this);
	}

	if (indexes.length === 1) {
		out.push(this.substring(0, indexes[0]));
		out.push(this.substring(indexes[0] + targetString.length, this.length));
	} else {
		for (let i = 0; i < indexes.length - 1; ++i) {
			const start = indexes[i];

			if (i === 0) {
				out.push(this.substring(0, start));
			}

			const end = indexes[i + 1];
			out.push(this.substring(start + targetString.length, end));

			if (i === indexes.length - 2) {
				out.push(this.substring(end + targetString.length, this.length));
			}
		}
	}

	return out.map(it => it.trim());
};

String.prototype.indexOf_handleColon = String.prototype.indexOf_handleColon || function (str) {
	const colonStr = `${str.trim()}:`;
	const idxColon = this.toLowerCase().indexOf(colonStr.toLowerCase());
	if (~idxColon) return idxColon;
	return this.toLowerCase().indexOf(str.toLowerCase());
};

const CREATURE_SUB_ENTRY_PROPS = [
	"entries",
	"headerEntries",
	"footerEntries"
];

class AcConvert {
	static tryPostProcessAc (m, cbMan, cbErr) {
		let nuAc = [];
		const basic = /^(\d+)( \((.*?)\))?$/.exec(m.ac.trim());
		const basicAlt = /^(\d+)( (.*?))?$/.exec(m.ac.trim());
		if (basic || basicAlt) {
			if ((basic && basic[3]) || (basicAlt && basicAlt[3])) {
				const toUse = basic || basicAlt;
				const brak = toUse[3];
				let cur = {
					ac: Number(toUse[1])
				};

				let nextPart = null;

				const from = [];

				const splitter = StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX;

				const parts = brak.split(splitter).map(it => it.trim());

				parts.forEach(p => {
					const pLow = p.toLowerCase();
					switch (pLow) {
						// unhandled/other
						case "unarmored defense":
						case "suave defense":
						case "armor scraps":
						case "barding scraps":
						case "patchwork armor":
						case "see natural armor feature":
						case "barkskin trait":
						case "sylvan warrior":
						case "cage":
						case "chains":
						case "coin mail":
						case "crude armored coat":
						case "improvised armor":
						case "magic robes":
						case "makeshift armor":
						case "natural and mystic armor":
						case "padded armor":
						case "padded leather":
						case "parrying dagger":
						case "plant fiber armor":
						case "plus armor worn":
						case "rag armor":
						case "ring of protection +2":
						case "see below":
						case "wicker armor":
						case "bone armor":
							from.push(p);
							break;

						// au naturel
						case "natural armor":
						case "natural":
							from.push("natural armor");
							break;

						// spells
						case "foresight bonus":
							from.push(`{@spell foresight} bonus`);
							break;

						case "natural barkskin":
							from.push(`natural {@spell barkskin}`);
							break;

						case "mage armor":
							from.push("{@spell mage armor}");
							break;

						// armour
						case "studded leather armor":
						case "studded leather":
							from.push("{@item studded leather armor|phb}");
							break;

						case "leather armor":
						case "leather":
							from.push("{@item leather armor|phb}");
							break;

						case "half plate":
							from.push("{@item half plate armor|phb}");
							break;

						case "splint":
						case "splint armor":
							from.push("{@item splint armor|phb}");
							break;

						case "chain mail":
						case "chainmail":
						case "chain armor":
							from.push("{@item chain mail|phb}");
							break;

						case "scale mail":
						case "scale armor":
						case "scale":
							from.push("{@item scale mail|phb}");
							break;

						case "hide armor":
						case "hide":
							from.push("{@item hide armor|phb}");
							break;

						case "chain shirt":
							from.push("{@item chain shirt|phb}");
							break;

						case "breastplate":
							from.push("{@item breastplate|phb}");
							break;

						case "ring mail":
							from.push("{@item ring mail|phb}");
							break;

						case "plate mail":
						case "platemail":
						case "plate":
						case "plate armor":
						case "full plate":
							from.push("{@item plate armor|phb}");
							break;

						case "shield":
							from.push("{@item shield|phb}");
							break;

						case "shields":
							from.push("{@item shield|phb|shields}");
							break;

						// magic items
						case "dwarven plate":
							from.push("{@item dwarven plate}");
							break;
						case "elven chain":
							from.push("{@item elven chain}");
							break;
						case "glamoured studded leather":
							from.push("{@item glamoured studded leather}");
							break;
						case "bracers of defense":
							from.push("{@item bracers of defense}");
							break;
						case "badge of the watch":
							from.push("{@item Badge of the Watch|wdh}");
							break;
						case "ring of protection":
							from.push("{@item ring of protection}");
							break;
						case "robe of the archmagi":
							from.push("{@item robe of the archmagi}");
							break;
						case "staff of power":
							from.push("{@item staff of power}");
							break;

						// TODO general auto-detect for enchanted versions of items
						case "+3 plate armor":
							from.push("{@item plate armor +3||+3 plate armor}");
							break;
						case "half plate armor +1":
							from.push("{@item half plate armor +1||+1 half-plate armor}");
							break;
						case "scale mail +1":
							from.push("{@item scale mail +1||+1 scale mail}");
							break;
						case "scale mail +2":
							from.push("{@item scale mail +2||+2 scale mail}");
							break;
						case "splint mail +2":
							from.push("{@item splint armor +2||+2 splint armor}");
							break;
						case "studded leather armor +1":
							from.push("{@item studded leather armor +1||+1 studded leather armor}");
							break;
						case "+2 leather armor":
							from.push("{@item leather armor +2||+2 leather armor}");
							break;
						case "+3 leather armor":
							from.push("{@item leather armor +3||+3 leather armor}");
							break;

						default: {
							if (pLow.endsWith("with mage armor") || pLow.endsWith("with barkskin")) {
								const numMatch = /(\d+) with (.*)/.exec(pLow);
								if (!numMatch) throw new Error("Spell AC but no leading number?");
								let spell = null;
								if (numMatch[2] === "mage armor") {
									spell = `{@spell mage armor}`
								} else if (numMatch[2] === "barkskin") {
									spell = `{@spell barkskin}`
								} else {
									throw new Error(`Unhandled spell! ${numMatch[2]}`)
								}

								nextPart = {
									ac: Number(numMatch[1]),
									condition: `with ${spell}`,
									braces: true
								}
							} else {
								if (cbMan) cbMan(p, `AC requires manual checking: ${m.name} ${m.source} p${m.page}`);
								nuAc.push(p)
							}
						}
					}
				});

				if (from.length) {
					cur.from = from;
					nuAc.push(cur);
				} else {
					nuAc.push(cur.ac);
				}
				if (nextPart) nuAc.push(nextPart)
			} else if (basic) {
				nuAc.push(Number(basic[1]));
			} else {
				if (cbErr) cbErr(m.ac, `${`${m.name} ${m.source} p${m.page}`.padEnd(48)} => ${m.ac}`);
				nuAc.push(m.ac);
			}
		} else {
			if (cbErr) cbErr(m.ac, `${`${m.name} ${m.source} p${m.page}`.padEnd(48)} => ${m.ac}`);
			nuAc.push(m.ac);
		}
		m.ac = nuAc;
	}
}

class TagAttack {
	static tryTagAttacks (m, cbMan) {
		const handleProp = (prop) => {
			if (m[prop]) {
				m[prop].forEach(it => {
					if (it.entries) {
						const str = JSON.stringify(it.entries, null, "\t");
						const out = str.replace(/([\t ]")((?:(?:[A-Z][a-z]*|or) )*Attack:) /g, (...m) => {
							const lower = m[2].toLowerCase();
							if (TagAttack.MAP[lower]) {
								return `${m[1]}${TagAttack.MAP[lower]} `;
							} else {
								if (cbMan) cbMan(m[2]);
								return m[0];
							}
						});
						it.entries = JSON.parse(out);
					}
				})
			}
		};

		handleProp("action");
		handleProp("reaction");
		handleProp("trait");
		handleProp("legendary");
		handleProp("variant");
	}
}
TagAttack.MAP = {
	"melee weapon attack:": "{@atk mw}",
	"ranged weapon attack:": "{@atk rw}",
	"melee attack:": "{@atk m}",
	"ranged attack:": "{@atk r}",
	"area attack:": "{@atk a}",
	"area weapon attack:": "{@atk aw}",
	"melee spell attack:": "{@atk ms}",
	"melee or ranged weapon attack:": "{@atk mw,rw}",
	"ranged spell attack:": "{@atk rs}",
	"melee or ranged spell attack:": "{@atk ms,rs}",
	"melee or ranged attack:": "{@atk m,r}"
};

class TagHit {
	static tryTagHits (m) {
		const handleProp = (prop) => {
			if (m[prop]) {
				m[prop].forEach(it => {
					if (it.entries) {
						const str = JSON.stringify(it.entries, null, "\t");
						const out = str.replace(/Hit: /g, "{@h}");
						it.entries = JSON.parse(out);
					}
				})
			}
		};

		handleProp("action");
		handleProp("reaction");
		handleProp("trait");
		handleProp("legendary");
		handleProp("variant");
	}
}

class TagDc {
	static tryTagDcs (m) {
		const handleProp = (prop) => {
			if (m[prop]) {
				m[prop] = m[prop].map(it => {
					const str = JSON.stringify(it, null, "\t");
					const out = str.replace(/DC (\d+)/g, "{@dc $1}");
					return JSON.parse(out);
				})
			}
		};

		handleProp("action");
		handleProp("reaction");
		handleProp("trait");
		handleProp("legendary");
		handleProp("variant");
		handleProp("spellcasting");
	}
}

class TagCondition {
	static tryTagConditions (m) {
		const handleProp = (prop) => {
			if (m[prop]) {
				m[prop].forEach(it => {
					CREATURE_SUB_ENTRY_PROPS.forEach(subProp => {
						if (it[subProp]) {
							let str = JSON.stringify(it[subProp], null, "\t");

							TagCondition._CONDITION_MATCHERS.forEach(r => str = str.replace(r, (...mt) => `${mt[1]}{@condition ${mt[2]}}${mt[3]}`));

							it[subProp] = JSON.parse(str);
						}
					});
				})
			}
		};

		handleProp("action");
		handleProp("reaction");
		handleProp("trait");
		handleProp("legendary");
		handleProp("variant");
	}
}
TagCondition._CONDITIONS = [
	"blinded",
	"charmed",
	"deafened",
	"exhaustion",
	"frightened",
	"grappled",
	"incapacitated",
	"invisible",
	"paralyzed",
	"petrified",
	"poisoned",
	"prone",
	"restrained",
	"stunned",
	"unconscious"
];
TagCondition._CONDITION_MATCHERS = TagCondition._CONDITIONS.map(it => new RegExp(`([^\\w])(${it})([^\\w}|])`, "gi"));

class AlignmentConvert {
	static tryConvertAlignment (m, cbMan) {
		const match = Object.values(AlignmentConvert.ALIGNMENTS).find(it => {
			const out = it.regex.test(m.alignment);
			it.regex.lastIndex = 0;
			return out;
		});

		if (match) m.alignment = match.output;
		else if (cbMan) cbMan(m.alignment);
	}
}
AlignmentConvert.ALIGNMENTS = {
	"lawful good": ["L", "G"],
	"neutral good": ["N", "G"],
	"chaotic good": ["C", "G"],
	"chaotic neutral": ["C", "N"],
	"lawful evil": ["L", "E"],
	"lawful neutral": ["L", "N"],
	"neutral evil": ["N", "E"],
	"chaotic evil": ["C", "E"],

	"good": ["G"],
	"lawful": ["L"],
	"neutral": ["N"],
	"chaotic": ["C"],
	"evil": ["E"],

	"unaligned": ["U"],

	"any alignment": ["A"],

	"any non-good( alignment)?": ["L", "NX", "C", "NY", "E"],
	"any non-lawful( alignment)?": ["NX", "C", "G", "NY", "E"],
	"any non-evil( alignment)?": ["L", "NX", "C", "NY", "G"],
	"any non-chaotic( alignment)?": ["NX", "L", "G", "NY", "E"],

	"any chaotic( alignment)?": ["C", "G", "NY", "E"],
	"any evil( alignment)?": ["L", "NX", "C", "E"],
	"any lawful( alignment)?": ["L", "G", "NY", "E"],
	"any good( alignment)?": ["L", "NX", "C", "G"],

	"any neutral( alignment)?": ["NX", "NY", "N"],

	// TODO general auto-detect for percentage-weighted alignments
	"neutral good \\(50%\\) or neutral evil \\(50%\\)": [{alignment: ["N", "G"], chance: 50}, {alignment: ["N", "E"], chance: 50}],
	"chaotic good \\(75%\\) or neutral evil \\(25%\\)": [{alignment: ["C", "G"], chance: 75}, {alignment: ["N", "E"], chance: 25}],
	"chaotic good \\(75%\\) or chaotic evil \\(25%\\)": [{alignment: ["C", "G"], chance: 75}, {alignment: ["C", "E"], chance: 25}],
	"chaotic good or chaotic neutral": [{alignment: ["C", "G"]}, {alignment: ["C", "N"]}],
	"lawful neutral or lawful evil": [{alignment: ["L", "N"]}, {alignment: ["L", "E"]}],
	"neutral evil \\(50%\\) or lawful evil \\(50%\\)": [{alignment: ["N", "E"], chance: 50}, {alignment: ["L", "E"], chance: 50}]
};
Object.entries(AlignmentConvert.ALIGNMENTS).forEach(([k, v]) => {
	AlignmentConvert.ALIGNMENTS[k] = {
		output: v,
		regex: RegExp(`^${k}$`)
	}
});

class TagUtil {
	static isNoneOrEmpty (str) {
		if (!str || !str.trim()) return false;
		return !!TagUtil.NONE_EMPTY_REGEX.exec(str);
	}
}
TagUtil.NONE_EMPTY_REGEX = /^(([-\u2014\u2013\u2221])+|none)$/gi;

class TraitActionTag {
	static tryRun (m, cbMan) {
		function doTag (prop, outProp) {
			function isTraits () {
				return prop === "trait";
			}

			if (m[prop]) {
				m[prop].forEach(t => {
					if (!t.name) return;
					t.name = t.name.trim();

					const cleanName = t.name.toLowerCase();
					const mapped = TraitActionTag.tags[prop][cleanName];
					if (mapped) {
						m[outProp] = m[outProp] || [];
						if (mapped === true) m[outProp].push(t.name);
						else m[outProp].push(mapped)
					} else if (isTraits() && cleanName.startsWith("keen ")) {
						m[outProp] = m[outProp] || [];
						m[outProp].push("Keen Senses");
					} else if (isTraits() && cleanName.startsWith("legendary resistance")) {
						m[outProp] = m[outProp] || [];
						m[outProp].push("Legendary Resistances");
					} else if (isTraits() && cleanName.endsWith(" absorption")) {
						m[outProp] = m[outProp] || [];
						m[outProp].push("Damage Absorption");
					} else {
						if (cbMan) cbMan(prop, outProp, cleanName);
					}
				})
			}
		}
		if (m.traitTags) m.traitTags = [];
		if (m.actionTags) m.actionTags = [];

		doTag("trait", "traitTags");
		doTag("action", "actionTags");
		doTag("reaction", "actionTags");

		if (m.traitTags && !m.traitTags.length) delete m.traitTags;
		if (m.actionTags && !m.actionTags.length) delete m.actionTags;
	}
}
TraitActionTag.tags = { // true = map directly; string = map to this string
	trait: {
		"turn immunity": true,
		"brute": true,
		"antimagic susceptibility": true,
		"sneak attack": true,
		"sneak attack (1/turn)": "Sneak Attack",
		"reckless": true,
		"web sense": true,
		"flyby": true,
		"pounce": true,
		"water breathing": true,

		"turn resistance": true,
		"turn defiance": "Turn Resistance",
		"turning defiance": "Turn Resistance",
		"turn resistance aura": "Turn Resistance",
		"undead fortitude": true,

		"aggressive": true,
		"illumination": true,
		"rampage": true,
		"rejuvenation": true,
		"web walker": true,
		"incorporeal movement": true,

		"keen hearing and smell": "Keen Senses",
		"keen sight and smell": "Keen Senses",
		"keen hearing and sight": "Keen Senses",
		"keen hearing": "Keen Senses",
		"keen smell": "Keen Senses",
		"keen senses": true,

		"hold breath": true,

		"charge": true,

		"fey ancestry": true,

		"siege monster": true,

		"pack tactics": true,

		"regeneration": true,

		"shapechanger": true,

		"false appearance": true,

		"spider climb": true,

		"sunlight sensitivity": true,
		"sunlight hypersensitivity": "Sunlight Sensitivity",
		"light sensitivity": true,

		"amphibious": true,

		"legendary resistance (1/day)": "Legendary Resistances",
		"legendary resistance (2/day)": "Legendary Resistances",
		"legendary resistance (3/day)": "Legendary Resistances",
		"legendary resistance (5/day)": "Legendary Resistances",

		"magic weapon": "Magic Weapons",
		"magic weapons": true,

		"magic resistance": true,
		"spell immunity": "Magic Resistance",

		"ambush": "Ambusher",
		"ambusher": true,

		"amorphous": true,
		"amorphous form": "Amorphous",

		"death burst": true,
		"death throes": "Death Burst",

		"devil's sight": true,
		"devil sight": "Devil's Sight",

		"immutable form": true
	},
	action: {
		"multiattack": true,
		"frightful presence": true,
		"teleport": true,
		"swallow": true,
		"tentacle": "Tentacles",
		"tentacles": true
	},
	reaction: {
		"parry": true
	},
	legendary: {
		// unused
	}
};

class LanguageTag {
	/**
	 * @param m A creature statblock.
	 * @param opt Options object.
	 * @param opt.cbAll Callback to run on every parsed language.
	 * @param opt.cbTracked Callback to run on every tracked language.
	 * @param opt.isAppendOnly If tags should only be added, not removed.
	 */
	static tryRun (m, opt) {
		opt = opt || {};

		const tags = new Set();

		if (m.languages) {
			m.languages = m.languages.map(it => it.trim()).filter(it => !TagUtil.isNoneOrEmpty(it));
			if (!m.languages.length) {
				delete m.languages;
				return;
			} else {
				m.languages = m.languages.map(it => it.replace(/but can(not|'t) speak/ig, "but can't speak"));
			}

			m.languages.forEach(l => {
				if (opt.cbAll) opt.cbAll(l);

				Object.keys(LanguageTag.LANGUAGE_MAP).forEach(k => {
					const v = LanguageTag.LANGUAGE_MAP[k];

					const re = new RegExp(`(^|[^-a-zA-Z])${k}([^-a-zA-Z]|$)`, "g");

					if (re.exec(l)) {
						if ((v === "XX" || v === "X") && (l.includes("knew in life") || l.includes("spoke in life"))) return;
						if (/(one|the) languages? of its creator/i.exec(l)) return;

						if (opt.cbTracked) opt.cbTracked(v);
						tags.add(v);
					}
				})
			});
		}

		if (tags.size) {
			if (!opt.isAppendOnly) m.languageTags = [...tags];
			else {
				(m.languageTags || []).forEach(t => tags.add(t));
				m.languageTags = [...tags];
			}
		} else if (!opt.isAppendOnly) delete m.languageTags;
	}
}
LanguageTag.LANGUAGE_MAP = {
	"Abyssal": "AB",
	"Aquan": "AQ",
	"Auran": "AU",
	"Celestial": "CE",
	"Common": "C",
	"can't speak": "CS",
	"Draconic": "DR",
	"Dwarvish": "D",
	"Elvish": "E",
	"Giant": "GI",
	"Gnomish": "G",
	"Goblin": "GO",
	"Halfling": "H",
	"Infernal": "I",
	"Orc": "O",
	"Primordial": "P",
	"Sylvan": "S",
	"Terran": "T",
	"Undercommon": "U",
	"Aarakocra": "OTH",
	"one additional": "X",
	"Blink Dog": "OTH",
	"Bothii": "OTH",
	"Bullywug": "OTH",
	"one other language": "X",
	"plus six more": "X",
	"plus two more languages": "X",
	"up to five other languages": "X",
	"Druidic": "DU",
	"Giant Eagle": "OTH",
	"Giant Elk": "OTH",
	"Giant Owl": "OTH",
	"Gith": "GTH",
	"Grell": "OTH",
	"Grung": "OTH",
	"Homarid": "OTH",
	"Hook Horror": "OTH",
	"Ice Toad": "OTH",
	"Ixitxachitl": "OTH",
	"Kruthik": "OTH",
	"Netherese": "OTH",
	"Olman": "OTH",
	"Otyugh": "OTH",
	"Primal": "OTH",
	"Sahuagin": "OTH",
	"Sphinx": "OTH",
	"Thayan": "OTH",
	"Thri-kreen": "OTH",
	"Tlincalli": "OTH",
	"Troglodyte": "OTH",
	"Umber Hulk": "OTH",
	"Vegepygmy": "OTH",
	"Winter Wolf": "OTH",
	"Worg": "OTH",
	"Yeti": "OTH",
	"Yikaria": "OTH",
	"all": "XX",
	"all but rarely speaks": "XX",
	"any one language": "X",
	"any two languages": "X",
	"any three languages": "X",
	"any four languages": "X",
	"any five languages": "X",
	"any six languages": "X",
	"one language of its creator's choice": "X",
	"two other languages": "X",
	"telepathy": "TP",
	"thieves' cant": "TC",
	"Thieves' cant": "TC",
	"Deep Speech": "DS",
	"Gnoll": "OTH",
	"Ignan": "IG",
	"Modron": "OTH",
	"Slaad": "OTH",
	"all languages": "XX",
	"any language": "X"
};

class SenseTag {
	static tryRun (m, cbAll) {
		if (m.senses) {
			m.senses = m.senses.filter(it => !TagUtil.isNoneOrEmpty(it));
			if (!m.senses.length) delete m.senses;
			else {
				const senseTags = new Set();
				m.senses.map(it => it.trim().toLowerCase())
					.forEach(s => {
						Object.entries(SenseTag.TAGS).forEach(([k, v]) => {
							if (s.includes(k)) {
								if (v === "D" && /\d\d\d ft/.exec(s)) senseTags.add("SD");
								else senseTags.add(v);
							}
						});

						if (cbAll) cbAll(s);
					});

				if (senseTags.size === 0) delete m.senseTags;
				else m.senseTags = [...senseTags];
			}
		} else delete m.senseTags;
	}
}
SenseTag.TAGS = {
	"blindsight": "B",
	"darkvision": "D",
	"tremorsense": "T",
	"truesight": "U"
};

class SpellcastingTypeTag {
	static tryRun (m, cbAll) {
		if (!m.spellcasting) {
			delete m.spellcastingTags;
		} else {
			const tags = new Set();
			m.spellcasting.forEach(sc => {
				if (!sc.name) return;
				if (/(^|[^a-zA-Z])psionics([^a-zA-Z]|$)/gi.exec(sc.name)) tags.add("P");
				if (/(^|[^a-zA-Z])innate([^a-zA-Z]|$)/gi.exec(sc.name)) tags.add("I");
				if (/(^|[^a-zA-Z])form([^a-zA-Z]|$)/gi.exec(sc.name)) tags.add("F");
				if (/(^|[^a-zA-Z])shared([^a-zA-Z]|$)/gi.exec(sc.name)) tags.add("S");

				if (sc.headerEntries) {
					const strHeader = JSON.stringify(sc.headerEntries);
					Object.entries(SpellcastingTypeTag.CLASSES).forEach(([tag, regex]) => {
						regex.lastIndex = 0;
						const match = regex.exec(strHeader);
						if (match) {
							tags.add(tag);
							if (cbAll) cbAll(match[0]);
						}
					});
				}

				if (cbAll) cbAll(sc.name);
			});
			if (tags.size) m.spellcastingTags = [...tags];
			else delete m.spellcastingTags;
		}
	}
}
SpellcastingTypeTag.CLASSES = {
	"CB": /(^|[^a-zA-Z])bard([^a-zA-Z]|$)/gi,
	"CC": /(^|[^a-zA-Z])cleric([^a-zA-Z]|$)/gi,
	"CD": /(^|[^a-zA-Z])druid([^a-zA-Z]|$)/gi,
	"CP": /(^|[^a-zA-Z])paladin([^a-zA-Z]|$)/gi,
	"CR": /(^|[^a-zA-Z])ranger([^a-zA-Z]|$)/gi,
	"CS": /(^|[^a-zA-Z])sorcerer([^a-zA-Z]|$)/gi,
	"CL": /(^|[^a-zA-Z])warlock([^a-zA-Z]|$)/gi,
	"CW": /(^|[^a-zA-Z])wizard([^a-zA-Z]|$)/gi
};

class DamageTypeTag {
	static _handleProp (m, prop, typeSet) {
		if (m[prop]) {
			m[prop].forEach(it => {
				if (it.entries) {
					const str = JSON.stringify(it.entries, null, "\t");
					str.replace(RollerUtil.REGEX_DAMAGE_DICE, (m0, average, prefix, diceExp, suffix) => {
						suffix.replace(DamageTypeTag._TYPE_REGEX, (m0, type) => typeSet.add(DamageTypeTag._TYPE_LOOKUP[type]));
					});
				}
			})
		}
	}

	static tryRun (m) {
		if (!DamageTypeTag._isInit) {
			DamageTypeTag._isInit = true;
			Object.entries(Parser.DMGTYPE_JSON_TO_FULL).forEach(([k, v]) => DamageTypeTag._TYPE_LOOKUP[v] = k);
		}
		const typeSet = new Set();
		DamageTypeTag._handleProp(m, "action", typeSet);
		DamageTypeTag._handleProp(m, "reaction", typeSet);
		DamageTypeTag._handleProp(m, "trait", typeSet);
		DamageTypeTag._handleProp(m, "legendary", typeSet);
		DamageTypeTag._handleProp(m, "variant", typeSet);
		if (typeSet.size) m.damageTags = [...typeSet];
	}
}
DamageTypeTag._isInit = false;
DamageTypeTag._TYPE_REGEX = /(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)/gi;
DamageTypeTag._TYPE_LOOKUP = {};

class MiscTag {
	static _handleProp (m, prop, tagSet) {
		if (m[prop]) {
			m[prop].forEach(it => {
				let hasRangedAttack = false;
				if (it.entries) {
					const str = JSON.stringify(it.entries, null, "\t");

					// Weapon attacks
					// - any melee/ranged attack
					str.replace(/{@atk ([^}]+)}/g, (...mx) => {
						const spl = mx[1].split(",");
						if (spl.includes("rw")) {
							tagSet.add("RW");
							hasRangedAttack = true;
						}
						if (spl.includes("mw")) tagSet.add("MW");
					});

					// - reach
					str.replace(/reach (\d+) ft\./g, (...m) => {
						if (Number(m[1]) > 5) tagSet.add("RCH");
					});

					// AoE effects
					str.replace(/\d+-foot[- ](line|cube|cone|radius|sphere|hemisphere|cylinder)/g, () => tagSet.add("AOE"));
				}

				if (it.name) {
					// thrown weapon (PHB only)
					if (hasRangedAttack) MiscTag._THROWN_WEAPON_MATCHERS.forEach(r => it.name.replace(r, () => tagSet.add("THW")));
					// other ranged weapon (PHB only)
					MiscTag._RANGED_WEAPON_MATCHERS.forEach(r => it.name.replace(r, () => tagSet.add("RNG")));
				}
			})
		}
	}

	static tryRun (m) {
		const typeSet = new Set();
		MiscTag._handleProp(m, "action", typeSet);
		MiscTag._handleProp(m, "trait", typeSet);
		MiscTag._handleProp(m, "reaction", typeSet);
		MiscTag._handleProp(m, "legendary", typeSet);
		if (typeSet.size) m.miscTags = [...typeSet];
		else delete m.miscTags;
	}
}
MiscTag._THROWN_WEAPONS = [
	"dagger",
	"handaxe",
	"javelin",
	"light hammer",
	"spear",
	"trident",
	"dart",
	"net"
];
MiscTag._THROWN_WEAPON_MATCHERS = MiscTag._THROWN_WEAPONS.map(it => new RegExp(`(^|[^\\w])(${it})([^\\w]|$)`, "gi"));
MiscTag._RANGED_WEAPONS = [
	"light crossbow",
	"shortbow",
	"sling",
	"blowgun",
	"hand crossbow",
	"heavy crossbow",
	"longbow"
];
MiscTag._RANGED_WEAPON_MATCHERS = MiscTag._RANGED_WEAPONS.map(it => new RegExp(`(^|[^\\w])(${it})([^\\w]|$)`, "gi"));

class SpellcastingTraitConvert {
	static async pGetSpellData () {
		return {spell: await DataUtil.spell.pLoadAll()};
	}

	static init (spellData) {
		// reversed so official sources take precedence over 3pp
		spellData.spell.forEach(s => SpellcastingTraitConvert.SPELL_SRC_MAP[s.name.toLowerCase()] = s.source)
	}

	static tryParseSpellcasting (trait, isMarkdown, cbErr) {
		let spellcasting = [];

		function parseSpellcasting (trait) {
			const splitter = StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX;

			function getParsedSpells (thisLine) {
				let spellPart = thisLine.substring(thisLine.indexOf(": ") + 2).trim();
				if (isMarkdown) {
					const cleanPart = (part) => {
						part = part.trim();
						while (part.startsWith("*") && part.endsWith("*")) {
							part = part.replace(/^\*(.*)\*$/, "$1");
						}
						return part;
					};

					const cleanedInner = spellPart.split(splitter).map(it => cleanPart(it)).filter(it => it);
					spellPart = cleanedInner.join(", ");

					while (spellPart.startsWith("*") && spellPart.endsWith("*")) {
						spellPart = spellPart.replace(/^\*(.*)\*$/, "$1");
					}
				}
				return spellPart.split(splitter).map(i => parseSpell(i));
			}

			let name = trait.name;
			let spellcastingEntry = {"name": name, "headerEntries": [parseToHit(trait.entries[0])]};
			let doneHeader = false;
			trait.entries.forEach((thisLine, i) => {
				thisLine = thisLine.replace(/,\s*\*/g, ",*"); // put asterisks on the correct side of commas
				if (i === 0) return;
				if (thisLine.includes("/rest")) {
					doneHeader = true;
					let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
					const value = getParsedSpells(thisLine);
					if (!spellcastingEntry.rest) spellcastingEntry.rest = {};
					spellcastingEntry.rest[property] = value;
				} else if (thisLine.includes("/day")) {
					doneHeader = true;
					let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
					const value = getParsedSpells(thisLine);
					if (!spellcastingEntry.daily) spellcastingEntry.daily = {};
					spellcastingEntry.daily[property] = value;
				} else if (thisLine.includes("/week")) {
					doneHeader = true;
					let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
					const value = getParsedSpells(thisLine);
					if (!spellcastingEntry.weekly) spellcastingEntry.weekly = {};
					spellcastingEntry.weekly[property] = value;
				} else if (thisLine.startsWith("Constant: ")) {
					doneHeader = true;
					spellcastingEntry.constant = getParsedSpells(thisLine);
				} else if (thisLine.startsWith("At will: ")) {
					doneHeader = true;
					spellcastingEntry.will = getParsedSpells(thisLine);
				} else if (thisLine.includes("Cantrip")) {
					doneHeader = true;
					const value = getParsedSpells(thisLine);
					if (!spellcastingEntry.spells) spellcastingEntry.spells = {"0": {"spells": []}};
					spellcastingEntry.spells["0"].spells = value;
				} else if (thisLine.includes(" level") && thisLine.includes(": ")) {
					doneHeader = true;
					let property = thisLine.substr(0, 1);
					const allSpells = getParsedSpells(thisLine);
					spellcastingEntry.spells = spellcastingEntry.spells || {};

					const out = {};
					if (thisLine.includes(" slot")) {
						const mWarlock = /^(\d)..-(\d).. level \((\d) (\d)..-level slots?\)/.exec(thisLine);
						if (mWarlock) {
							out.lower = parseInt(mWarlock[1]);
							out.slots = parseInt(mWarlock[3]);
							property = mWarlock[4];
						} else {
							const mSlots = /\((\d) slots?\)/.exec(thisLine);
							if (!mSlots) throw new Error(`Could not find slot count!`);
							out.slots = parseInt(mSlots[1]);
						}
					}
					// add these last, to have nicer ordering
					out.spells = allSpells;

					spellcastingEntry.spells[property] = out;
				} else {
					if (doneHeader) {
						if (!spellcastingEntry.footerEntries) spellcastingEntry.footerEntries = [];
						spellcastingEntry.footerEntries.push(parseToHit(thisLine));
					} else {
						spellcastingEntry.headerEntries.push(parseToHit(thisLine));
					}
				}
			});

			SpellcastingTraitConvert.mutSpellcastingAbility(spellcastingEntry);

			spellcasting.push(spellcastingEntry);
		}

		function parseSpell (name) {
			function getSourcePart (spellName) {
				const source = SpellcastingTraitConvert._getSpellSource(spellName);
				return `${source && source !== SRC_PHB ? `|${source}` : ""}`;
			}

			name = name.trim();
			let asterix = name.indexOf("*");
			let brackets = name.indexOf(" (");
			if (asterix !== -1) {
				const trueName = name.substr(0, asterix);
				return `{@spell ${trueName}${getSourcePart(trueName)}}*`;
			} else if (brackets !== -1) {
				const trueName = name.substr(0, brackets);
				return `{@spell ${trueName}${getSourcePart(trueName)}}${name.substring(brackets)}`;
			}
			return `{@spell ${name}${getSourcePart(name)}}`;
		}

		function parseToHit (line) {
			return line.replace(/( \+)(\d+)( to hit with spell)/g, (m0, m1, m2, m3) => ` {@hit ${m2}}${m3}`);
		}

		try {
			parseSpellcasting(trait);
			return {out: spellcasting, success: true};
		} catch (e) {
			cbErr && cbErr(`Failed to parse spellcasting: ${e.message}`);
			return {out: trait, success: false};
		}
	}

	static mutSpellcastingAbility (spellcastingEntry) {
		if (spellcastingEntry.headerEntries) {
			const m = /strength|dexterity|constitution|charisma|intelligence|wisdom/gi.exec(JSON.stringify(spellcastingEntry.headerEntries));
			if (m) spellcastingEntry.ability = m[0].substring(0, 3).toLowerCase();
		}
	}

	static _getSpellSource (spellName) {
		if (spellName && SpellcastingTraitConvert.SPELL_SRC_MAP[spellName.toLowerCase()]) return SpellcastingTraitConvert.SPELL_SRC_MAP[spellName.toLowerCase()];
		return null;
	}
}
SpellcastingTraitConvert.SPELL_SRC_MAP = {};

class DiceConvert {
	static convertTraitActionDice (traitOrAction) {
		if (traitOrAction.entries) {
			traitOrAction.entries = traitOrAction.entries.filter(it => it.trim ? it.trim() : true).map(e => {
				e = JSON.stringify(e);

				// replace e.g. "+X to hit"
				e = e.replace(/([-+])?\d+(?= to hit)/g, function (match) {
					const cleanMatch = match.startsWith("+") ? match.replace("+", "") : match;
					return `{@hit ${cleanMatch}}`
				});

				return JSON.parse(DiceConvert._getTaggedString(e));
			});
		}
	}

	static _getTaggedString (str) {
		// un-tag dice
		str = str.replace(/{@(?:dice|damage) ([^}]*)}/gi, "$1");

		// re-tag + format dice
		str = str.replace(/((\s*[-+]\s*)?(([1-9]\d*)?d([1-9]\d*)(\s*?[-+×x*÷/]\s*?(\d,\d|\d)+(\.\d+)?)?))+/gi, (...m) => {
			const expanded = m[0].replace(/([^0-9d.,])/gi, " $1 ").replace(/\s+/g, " ");
			return `{@dice ${expanded}}`;
		});

		// tag damage
		str = str.replace(/(\d+)( \({@dice )([-+0-9d ]*)(}\) [a-z]+( or [a-z]+)? damage)/ig, (...m) => {
			return m[0].replace(/{@dice /gi, "{@damage ");
		});

		return str;
	}

	static cleanHpDice (m) {
		if (m.hp && m.hp.formula) {
			m.hp.formula = m.hp.formula
				.replace(/\s+/g, "") // crush spaces
				.replace(/([^0-9d])/gi, " $1 "); // add spaces
		}
	}
}

class RechargeConvert {
	static tryConvertRecharge (traitOrAction, cbAll, cbMan) {
		if (traitOrAction.name) {
			traitOrAction.name = traitOrAction.name.replace(/\((Recharge )(\d.*?)\)$/gi, (...m) => {
				if (cbAll) cbAll(m[2]);
				const num = m[2][0];
				if (num === "6") return `{@recharge}`;
				if (isNaN(Number(num))) {
					if (cbMan) cbMan(traitOrAction.name);
					return m[0];
				}
				return `{@recharge ${num}}`;
			});
		}
	}
}

class SpeedConvert {
	static _splitSpeed (str) {
		let c;
		let ret = [];
		let stack = "";
		let para = 0;
		for (let i = 0; i < str.length; ++i) {
			c = str.charAt(i);
			switch (c) {
				case ",":
					if (para === 0) {
						ret.push(stack);
						stack = "";
					}
					break;
				case "(": para++; stack += c; break;
				case ")": para--; stack += c; break;
				default: stack += c;
			}
		}
		if (stack) ret.push(stack);
		return ret.map(it => it.trim()).filter(it => it);
	}

	static _tagHover (m) {
		if (m.speed && m.speed.fly && m.speed.fly.condition) {
			m.speed.fly.condition = m.speed.fly.condition.trim();

			if (m.speed.fly.condition.toLowerCase().includes("hover")) m.speed.canHover = true;
		}
	}

	static tryConvertSpeed (m, cbMan) {
		if (typeof m.speed === "string") {
			let line = m.speed.toLowerCase().trim().replace(/^speed:?\s*/, "");

			const out = {};
			let byHand = false;

			SpeedConvert._splitSpeed(line.toLowerCase()).map(it => it.trim()).forEach(s => {
				const m = /^(\w+?\s+)?(\d+)\s*ft\.?( .*)?$/.exec(s);
				if (!m) {
					byHand = true;
					return;
				}

				if (m[1]) m[1] = m[1].trim();
				else m[1] = "walk";

				if (SpeedConvert._SPEED_TYPES.has(m[1])) {
					if (m[3]) {
						out[m[1]] = {
							number: Number(m[2]),
							condition: m[3].trim()
						};
					} else out[m[1]] = Number(m[2]);
				} else byHand = true;
			});

			// flag speed as invalid
			if (Object.values(out).filter(s => (s.number != null ? s.number : s) % 5 !== 0).length) out.INVALID_SPEED = true;

			// flag speed as needing hand-parsing
			if (byHand) {
				out.UNPARSED_SPEED = line;
				if (cbMan) cbMan(`Speed requires manual conversion: "${line}"`);
			}

			m.speed = out;
			SpeedConvert._tagHover(m);
		}
	}
}
SpeedConvert._SPEED_TYPES = new Set(["walk", "fly", "swim", "climb", "burrow"]);

class TextClean {
	static getCleanedJson (str) {
		str = str.replace(TextClean.REPLACEMENT_REGEX, (match) => TextClean.REPLACEMENTS[match]);
		return str
			.replace(/\u00AD/g, "") // soft hyphens
			.replace(/\s*(\\u2014|\\u2013)\s*/g, "$1");
	}

	static getReplacedQuotesText (str) {
		return str
			.replace(/’/g, "'")
			.replace(/[“”]/g, `"`)
			.replace(/…/g, `...`)
	}
}
TextClean.REPLACEMENTS = {
	"—": "\\u2014",
	"–": "\\u2013",
	"−": "\\u2212",
	"’": "'",
	"“": '\\"',
	"”": '\\"',
	"…": "...",
	"ﬁ": "fi"
};
TextClean.REPLACEMENT_REGEX = new RegExp(Object.keys(TextClean.REPLACEMENTS).join("|"), 'g');

class ConvertUtil {
	/**
	 * Checks if a line of text starts with a name, e.g.
	 * "Big Attack. Lorem ipsum..." vs "Lorem ipsum..."
	 */
	static isNameLine (line) {
		const spl = line.split(/[.!?]/);
		if (spl.length === 1) return false;

		// ignore everything inside parentheses
		const namePart = ConvertUtil.getWithoutParens(spl[0]);

		const reStopwords = new RegExp(`^(${StrUtil.TITLE_LOWER_WORDS.join("|")})$`, "i");
		const tokens = namePart.split(/([ ,;:]+)/g);
		const cleanTokens = tokens.filter(it => {
			const isStopword = reStopwords.test(it.trim());
			reStopwords.lastIndex = 0;
			return !isStopword;
		});

		// if it's in title case after removing all stopwords, it's a name
		const namePartNoStopwords = cleanTokens.join("");
		return namePartNoStopwords.toTitleCase() === namePartNoStopwords;
	}

	/**
	 * Takes a string containing parenthesized parts, and removes them.
	 */
	static getWithoutParens (string) {
		let skipSpace = false;
		let char;
		let cleanString = "";

		const len = string.length;
		for (let i = 0; i < len; ++i) {
			char = string[i];

			switch (char) {
				case ")": {
					// scan back through the stack, remove last parens
					let foundOpen = -1;
					for (let j = cleanString.length - 1; j >= 0; --j) {
						if (cleanString[j] === "(") {
							foundOpen = j;
							break;
						}
					}

					if (~foundOpen) {
						cleanString = cleanString.substring(0, foundOpen);
						skipSpace = true;
					} else {
						cleanString += ")"
					}
					break;
				}
				case " ":
					if (skipSpace) skipSpace = false;
					else cleanString += " ";
					break;
				default:
					skipSpace = false;
					cleanString += char;
					break;
			}
		}

		return cleanString;
	}
}

class StatblockConverter {
	static _getValidOptions (options) {
		options = options || {};
		options.isAppend = options.isAppend || false;
		if (!options.cbWarning || !options.cbOutput) throw new Error(`Missing required callback options!`);
		return options;
	}

	/**
	 * Parses statblocks from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseText (inText, options) {
		options = StatblockConverter._getValidOptions(options);

		function startNextPhase (cur) {
			return (!cur.toUpperCase().indexOf("ACTION") || !cur.toUpperCase().indexOf("LEGENDARY ACTION") || !cur.toUpperCase().indexOf("REACTION"))
		}

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = (() => {
			const clean = StatblockConverter._getCleanInput(inText);
			const spl = clean.split(/(Challenge)/i);
			spl[0] = spl[0]
				.replace(/(\d\d?\s+\([-—+]\d\)\s*)+/gi, (...m) => `${m[0].replace(/\n/g, " ").replace(/\s+/g, " ")}\n`); // collapse multi-line ability scores
			return spl.join("").split("\n").filter(it => it && it.trim());
		})();
		const stats = {};
		stats.source = options.source || "";
		// for the user to fill out
		stats.page = options.pageNumber;

		let prevLine = null;
		let curLine = null;
		for (let i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of monster
			if (i === 0) {
				stats.name = this._getCleanName(curLine, options);
				continue;
			}

			// size type alignment
			if (i === 1) {
				StatblockConverter._setCleanSizeTypeAlignment(stats, curLine, options);
				continue;
			}

			// armor class
			if (i === 2) {
				stats.ac = curLine.split_handleColon("Armor Class ", 1)[1];
				continue;
			}

			// hit points
			if (i === 3) {
				StatblockConverter._setCleanHp(stats, curLine);
				continue;
			}

			// speed
			if (i === 4) {
				this._setCleanSpeed(stats, curLine, options);
				continue;
			}

			// ability scores
			if (/STR\s*DEX\s*CON\s*INT\s*WIS\s*CHA/i.test(curLine)) {
				// skip forward a line and grab the ability scores
				++i;
				const abilities = toConvert[i].trim().split(/ ?\(([+\-—])?[0-9]*\) ?/g);
				stats.str = StatblockConverter._tryConvertNumber(abilities[0]);
				stats.dex = StatblockConverter._tryConvertNumber(abilities[2]);
				stats.con = StatblockConverter._tryConvertNumber(abilities[4]);
				stats.int = StatblockConverter._tryConvertNumber(abilities[6]);
				stats.wis = StatblockConverter._tryConvertNumber(abilities[8]);
				stats.cha = StatblockConverter._tryConvertNumber(abilities[10]);
				continue;
			}

			// alternate ability scores (alternating lines of abbreviation and score)
			if (Parser.ABIL_ABVS.includes(curLine.toLowerCase())) {
				// skip forward a line and grab the ability score
				++i;
				switch (curLine.toLowerCase()) {
					case "str": stats.str = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "dex": stats.dex = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "con": stats.con = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "int": stats.int = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "wis": stats.wis = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "cha": stats.cha = StatblockConverter._tryGetStat(toConvert[i]); continue;
				}
			}

			// saves (optional)
			if (!curLine.indexOf_handleColon("Saving Throws ")) {
				StatblockConverter._setCleanSaves(stats, curLine, options);
				continue;
			}

			// skills (optional)
			if (!curLine.indexOf_handleColon("Skills ")) {
				StatblockConverter._setCleanSkills(stats, curLine);
				continue;
			}

			// damage vulnerabilities (optional)
			if (!curLine.indexOf_handleColon("Damage Vulnerabilities ")) {
				StatblockConverter._setCleanDamageVuln(stats, curLine);
				continue;
			}

			// damage resistances (optional)
			if (!curLine.indexOf_handleColon("Damage Resistance")) {
				StatblockConverter._setCleanDamageRes(stats, curLine);
				continue;
			}

			// damage immunities (optional)
			if (!curLine.indexOf_handleColon("Damage Immunities ")) {
				StatblockConverter._setCleanDamageImm(stats, curLine);
				continue;
			}

			// condition immunities (optional)
			if (!curLine.indexOf_handleColon("Condition Immunities ")) {
				StatblockConverter._setCleanConditionImm(stats, curLine);
				continue;
			}

			// senses
			if (!curLine.indexOf_handleColon("Senses ")) {
				StatblockConverter._setCleanSenses(stats, curLine);
				continue;
			}

			// languages
			if (!curLine.indexOf_handleColon("Languages ")) {
				StatblockConverter._setCleanLanguages(stats, curLine);
				continue;
			}

			// challenges and traits
			// goes into actions
			if (!curLine.indexOf_handleColon("Challenge ")) {
				StatblockConverter._setCleanCr(stats, curLine);
				continue;
			}

			// traits
			stats.trait = [];
			stats.action = [];
			stats.reaction = [];
			stats.legendary = [];

			let curTrait = {};

			let isTraits = true;
			let isActions = false;
			let isReactions = false;
			let isLegendaryActions = false;
			let isLegendaryDescription = false;

			// keep going through traits til we hit actions
			while (i < toConvert.length) {
				if (startNextPhase(curLine)) {
					isTraits = false;
					isActions = !curLine.toUpperCase().indexOf_handleColon("ACTION");
					if (isActions) {
						const mActionNote = /actions:?\s*\((.*?)\)/gi.exec(curLine);
						if (mActionNote) stats.actionNote = mActionNote[1];
					}
					isReactions = !curLine.toUpperCase().indexOf_handleColon("REACTION");
					isLegendaryActions = !curLine.toUpperCase().indexOf_handleColon("LEGENDARY ACTION");
					isLegendaryDescription = isLegendaryActions;
					i++;
					curLine = toConvert[i];
				}

				curTrait.name = "";
				curTrait.entries = [];

				const parseFirstLine = line => {
					curTrait.name = line.split(/([.!?])/g)[0];
					curTrait.entries.push(line.substring(curTrait.name.length + 1, line.length).trim());
				};

				if (isLegendaryDescription) {
					// usually the first paragraph is a description of how many legendary actions the creature can make
					// but in the case that it's missing the substring "legendary" and "action" it's probably an action
					const compressed = curLine.replace(/\s*/g, "").toLowerCase();
					if (!compressed.includes("legendary") && !compressed.includes("action")) isLegendaryDescription = false;
				}

				if (isLegendaryDescription) {
					curTrait.entries.push(curLine.trim());
					isLegendaryDescription = false;
				} else {
					parseFirstLine(curLine);
				}

				i++;
				curLine = toConvert[i];

				// collect subsequent paragraphs
				while (curLine && !ConvertUtil.isNameLine(curLine) && !startNextPhase(curLine)) {
					curTrait.entries.push(curLine.trim());
					i++;
					curLine = toConvert[i];
				}

				if (curTrait.name || curTrait.entries) {
					// convert dice tags
					DiceConvert.convertTraitActionDice(curTrait);

					// convert spellcasting
					if (isTraits) {
						if (curTrait.name.toLowerCase().includes("spellcasting")) {
							curTrait = this._tryParseSpellcasting(curTrait, false, options);
							if (curTrait.success) {
								// merge in e.g. innate spellcasting
								if (stats.spellcasting) stats.spellcasting = stats.spellcasting.concat(curTrait.out);
								else stats.spellcasting = curTrait.out;
							} else stats.trait.push(curTrait.out);
						} else {
							if (StatblockConverter._hasEntryContent(curTrait)) stats.trait.push(curTrait);
						}
					}
					if (isActions && StatblockConverter._hasEntryContent(curTrait)) stats.action.push(curTrait);
					if (isReactions && StatblockConverter._hasEntryContent(curTrait)) stats.reaction.push(curTrait);
					if (isLegendaryActions && StatblockConverter._hasEntryContent(curTrait)) stats.legendary.push(curTrait);
				}
				curTrait = {};
			}

			// Remove keys if they are empty
			if (stats.trait.length === 0) delete stats.trait;
			if (stats.reaction.length === 0) delete stats.reaction;
			if (stats.legendary.length === 0) delete stats.legendary;
		}

		(function doCleanLegendaryActionHeader () {
			if (stats.legendary) {
				stats.legendary = stats.legendary.map(it => {
					if (!it.name.trim() && !it.entries.length) return null;
					const m = /can take (\d) legendary actions/gi.exec(it.entries[0]);
					if (!it.name.trim() && m) {
						if (m[1] !== "3") stats.legendaryActions = Number(m[1]);
						return null;
					} else return it;
				}).filter(Boolean);
			}
		})();

		this._doStatblockPostProcess(stats, options);
		const statsOut = PropOrder.getOrdered(stats, "monster");
		options.cbOutput(statsOut, options.isAppend);
	}

	/**
	 * Parses statblocks from Homebrewery/GM Binder Markdown
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseMarkdown (inText, options) {
		options = StatblockConverter._getValidOptions(options);

		const self = this;

		function stripQuote (line) {
			return line.replace(/^\s*>\s*/, "").trim();
		}

		function stripDashStarStar (line) {
			return line.replace(/\**/g, "").replace(/^-/, "").trim();
		}

		function stripTripleHash (line) {
			return line.replace(/^###/, "").trim();
		}

		function stripLeadingSymbols (line) {
			const removeFirstInnerStar = line.trim().startsWith("*");
			const clean = line.replace(/^[^A-Za-z0-9]*/, "").trim();
			return removeFirstInnerStar ? clean.replace(/\*/, "") : clean;
		}

		function isInlineHeader (line) {
			// it should really start with "***" but, homebrew
			return line.trim().startsWith("**");
		}

		function isInlineLegendaryActionItem (line) {
			return /^-\s*\*\*\*?[^*]+/gi.test(line.trim());
		}

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = StatblockConverter._getCleanInput(inText).split("\n");
		let stats = null;

		const getNewStatblock = () => {
			return {
				source: options.source,
				page: options.pageNumber
			}
		};

		let parsed = 0;
		let hasMultipleBlocks = false;
		const doOutputStatblock = () => {
			if (trait != null) doAddFromParsed();
			if (stats) {
				this._doStatblockPostProcess(stats, options);
				const statsOut = PropOrder.getOrdered(stats, "monster");
				options.cbOutput(statsOut, options.isAppend);
			}
			stats = getNewStatblock();
			if (hasMultipleBlocks) options.isAppend = true; // append any further blocks we find in this parse
			parsed = 0;
		};

		let prevLine = null;
		let curLineRaw = null;
		let curLine = null;
		let prevBlank = true;
		let nextPrevBlank = true;
		let trait = null;

		function getCleanTraitText (line) {
			const [name, text] = line.replace(/^\*\*\*?/, "").split(/.\s*\*\*\*?/).map(it => it.trim());
			return [
				name,
				text.replace(/\*Hit(\*:|:\*) /g, "Hit: ") // clean hit tags for later replacement
			]
		}

		function getCleanLegendaryActionText (line) {
			return getCleanTraitText(line.trim().replace(/^-\s*/, ""));
		}

		function doAddFromParsed () {
			if (parsed === 9) { // traits
				doAddTrait();
			} else if (parsed === 10) { // actions
				doAddAction();
			} else if (parsed === 11) { // reactions
				doAddReaction();
			} else if (parsed === 12) { // legendary actions
				doAddLegendary();
			}
		}

		function doAddTrait () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.trait = stats.trait || [];

				DiceConvert.convertTraitActionDice(trait);

				// convert spellcasting
				if (trait.name.toLowerCase().includes("spellcasting")) {
					trait = self._tryParseSpellcasting(trait, true, options);
					if (trait.success) {
						// merge in e.g. innate spellcasting
						if (stats.spellcasting) stats.spellcasting = stats.spellcasting.concat(trait.out);
						else stats.spellcasting = trait.out;
					} else stats.trait.push(trait.out);
				} else {
					stats.trait.push(trait)
				}
			}
			trait = null;
		}

		function doAddAction () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.action = stats.action || [];

				DiceConvert.convertTraitActionDice(trait);
				stats.action.push(trait);
			}
			trait = null;
		}

		function doAddReaction () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.reaction = stats.reaction || [];

				DiceConvert.convertTraitActionDice(trait);
				stats.reaction.push(trait);
			}
			trait = null;
		}

		function doAddLegendary () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.legendary = stats.legendary || [];

				DiceConvert.convertTraitActionDice(trait);
				stats.legendary.push(trait);
			}
			trait = null;
		}

		function getCleanedRaw (str) {
			return str.trim()
				.replace(/<br\s*(\/)?>/gi, ""); // remove <br>
		}

		let i = 0;
		for (; i < toConvert.length; i++) {
			prevLine = curLine;
			curLineRaw = getCleanedRaw(toConvert[i]);
			curLine = curLineRaw;

			if (curLine === "" || curLine.toLowerCase() === "\\pagebreak" || curLine.toLowerCase() === "\\columnbreak") {
				prevBlank = true;
				continue;
			} else nextPrevBlank = false;
			curLine = stripQuote(curLine).trim();
			if (curLine === "") continue;
			else if (
				(curLine === "___" && prevBlank) // handle nicely separated blocks
				|| curLineRaw === "___" // handle multiple stacked blocks
			) {
				if (stats !== null) hasMultipleBlocks = true;
				doOutputStatblock();
				prevBlank = nextPrevBlank;
				continue;
			} else if (curLine === "___") {
				prevBlank = nextPrevBlank;
				continue;
			}

			// name of monster
			if (parsed === 0) {
				curLine = curLine.replace(/^\s*##/, "").trim();
				stats.name = this._getCleanName(curLine, options);
				parsed++;
				continue;
			}

			// size type alignment
			if (parsed === 1) {
				curLine = curLine.replace(/^\**(.*?)\**$/, "$1");
				StatblockConverter._setCleanSizeTypeAlignment(stats, curLine, options);
				parsed++;
				continue;
			}

			// armor class
			if (parsed === 2) {
				stats.ac = stripDashStarStar(curLine).replace(/Armor Class/g, "").trim();
				parsed++;
				continue;
			}

			// hit points
			if (parsed === 3) {
				StatblockConverter._setCleanHp(stats, stripDashStarStar(curLine));
				parsed++;
				continue;
			}

			// speed
			if (parsed === 4) {
				this._setCleanSpeed(stats, stripDashStarStar(curLine), options);
				parsed++;
				continue;
			}

			// ability scores
			if (parsed === 5 || parsed === 6 || parsed === 7) {
				// skip the two header rows
				if (curLine.replace(/\s*/g, "").startsWith("|STR") || curLine.replace(/\s*/g, "").startsWith("|:-")) {
					parsed++;
					continue;
				}
				const abilities = curLine.split("|").map(it => it.trim()).filter(Boolean);
				Parser.ABIL_ABVS.map((abi, j) => stats[abi] = StatblockConverter._tryGetStat(abilities[j]));
				parsed++;
				continue;
			}

			if (parsed === 8) {
				// saves (optional)
				if (~curLine.indexOf("Saving Throws")) {
					StatblockConverter._setCleanSaves(stats, stripDashStarStar(curLine), options);
					continue;
				}

				// skills (optional)
				if (~curLine.indexOf("Skills")) {
					StatblockConverter._setCleanSkills(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage vulnerabilities (optional)
				if (~curLine.indexOf("Damage Vulnerabilities")) {
					StatblockConverter._setCleanDamageVuln(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage resistances (optional)
				if (~curLine.indexOf("Damage Resistance")) {
					StatblockConverter._setCleanDamageRes(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage immunities (optional)
				if (~curLine.indexOf("Damage Immunities")) {
					StatblockConverter._setCleanDamageImm(stats, stripDashStarStar(curLine));
					continue;
				}

				// condition immunities (optional)
				if (~curLine.indexOf("Condition Immunities")) {
					StatblockConverter._setCleanConditionImm(stats, stripDashStarStar(curLine));
					continue;
				}

				// senses
				if (~curLine.indexOf("Senses")) {
					StatblockConverter._setCleanSenses(stats, stripDashStarStar(curLine));
					continue;
				}

				// languages
				if (~curLine.indexOf("Languages")) {
					StatblockConverter._setCleanLanguages(stats, stripDashStarStar(curLine));
					continue;
				}

				if (~curLine.indexOf("Challenge")) {
					StatblockConverter._setCleanCr(stats, stripDashStarStar(curLine));
					parsed++;
					continue;
				}
			}

			const cleanedLine = stripTripleHash(curLine);
			if (cleanedLine.toLowerCase() === "actions") {
				doAddFromParsed();
				parsed = 10;
				continue;
			} else if (cleanedLine.toLowerCase() === "reactions") {
				doAddFromParsed();
				parsed = 11;
				continue;
			} else if (cleanedLine.toLowerCase() === "legendary actions") {
				doAddFromParsed();
				parsed = 12;
				continue;
			}

			// traits
			if (parsed === 9) {
				if (isInlineHeader(curLine)) {
					doAddTrait();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// actions
			if (parsed === 10) {
				if (isInlineHeader(curLine)) {
					doAddAction();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// reactions
			if (parsed === 11) {
				if (isInlineHeader(curLine)) {
					doAddReaction();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// legendary actions
			if (parsed === 12) {
				if (isInlineLegendaryActionItem(curLine)) {
					doAddLegendary();
					trait = {name: "", entries: []};
					const [name, text] = getCleanLegendaryActionText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else if (isInlineHeader(curLine)) {
					doAddLegendary();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					if (!trait) { // legendary action intro text
						// ignore generic LA intro; the renderer will insert it
						if (!curLine.toLowerCase().includes("can take 3 legendary actions")) {
							trait = {name: "", entries: [stripLeadingSymbols(curLine)]};
						}
					} else trait.entries.push(stripLeadingSymbols(curLine));
				}
			}
		}

		doOutputStatblock();
	}

	getSample (format) {
		switch (format) {
			case "txt": return StatblockConverter.SAMPLE_TEXT;
			case "md": return StatblockConverter.SAMPLE_MARKDOWN;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	_doStatblockPostProcess (stats, options) {
		const doCleanup = () => {
			// remove any empty arrays
			Object.keys(stats).forEach(k => {
				if (stats[k] instanceof Array && stats[k].length === 0) {
					delete stats[k];
				}
			});
		};

		if (stats.trait) stats.trait.forEach(trait => RechargeConvert.tryConvertRecharge(trait, () => {}, () => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Manual recharge tagging required for trait "${trait.name}"`)));
		if (stats.action) stats.action.forEach(action => RechargeConvert.tryConvertRecharge(action, () => {}, () => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Manual recharge tagging required for action "${action.name}"`)));
		AcConvert.tryPostProcessAc(
			stats,
			(ac) => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}AC "${ac}" requires manual conversion`),
			(ac) => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Failed to parse AC "${ac}"`)
		);
		TagAttack.tryTagAttacks(stats, (atk) => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Manual attack tagging required for "${atk}"`));
		TagHit.tryTagHits(stats);
		TagDc.tryTagDcs(stats);
		TagCondition.tryTagConditions(stats);
		TraitActionTag.tryRun(stats);
		LanguageTag.tryRun(stats);
		SenseTag.tryRun(stats);
		SpellcastingTypeTag.tryRun(stats);
		DamageTypeTag.tryRun(stats);
		MiscTag.tryRun(stats);
		doCleanup();
	}

	static _tryConvertNumber (strNumber) {
		try {
			return Number(strNumber.replace(/—/g, "-"))
		} catch (e) {
			return strNumber;
		}
	}

	static _tryParseType (strType) {
		try {
			const m = /^(.*?) (\(.*?\))\s*$/.exec(strType);
			if (m) {
				return {type: m[1].toLowerCase(), tags: m[2].split(",").map(s => s.replace(/\(/g, "").replace(/\)/g, "").trim().toLowerCase())}
			}
			return strType.toLowerCase();
		} catch (e) {
			return strType;
		}
	}

	static _tryGetStat (strLine) {
		try {
			return StatblockConverter._tryConvertNumber(/(\d+) \(.*?\)/.exec(strLine)[1]);
		} catch (e) {
			return 0;
		}
	}

	/**
	 * Tries to parse immunities, resistances, and vulnerabilities
	 * @param strDamage The string to parse.
	 * @param modProp the output property (e.g. "vulnerable").
	 */
	static _tryParseDamageResVulnImmune (strDamage, modProp) {
		// handle the case where a comma is mistakenly used instead of a semicolon
		if (strDamage.toLowerCase().includes(", bludgeoning, piercing, and slashing from")) {
			strDamage = strDamage.replace(/, (bludgeoning, piercing, and slashing from)/gi, "; $1")
		}

		const splSemi = strDamage.toLowerCase().split(";");
		const newDamage = [];
		try {
			splSemi.forEach(section => {
				const tempDamage = {};
				let pushArray = newDamage;
				if (section.includes("from")) {
					tempDamage[modProp] = [];
					pushArray = tempDamage[modProp];
					tempDamage["note"] = /from .*/.exec(section)[0];
					section = /(.*) from /.exec(section)[1];
				}
				section = section.replace(/and/g, '');
				section.split(",").forEach(s => pushArray.push(s.trim()));
				if ("note" in tempDamage) newDamage.push(tempDamage)
			});
			return newDamage;
		} catch (ignored) {
			return strDamage;
		}
	}

	_tryParseSpellcasting (trait, isMarkdown, options) {
		return SpellcastingTraitConvert.tryParseSpellcasting(trait, isMarkdown, (err) => options.cbWarning(err));
	}

	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _getCleanInput (ipt) {
		return ipt
			.replace(/[−–‒]/g, "-") // convert minus signs to hyphens
		;
	}

	_getCleanName (line, options) {
		return options.isTitleCaseName ? line.toLowerCase().toTitleCase() : line;
	}

	static _setCleanSizeTypeAlignment (stats, line, options) {
		const mSidekick = /^(\d+)(?:st|nd|rd|th)\s*\W+\s*level\s+(.*)$/i.exec(line.trim());
		if (mSidekick) {
			// sidekicks
			stats.level = Number(mSidekick[1]);
			stats.size = mSidekick[2].trim()[0].toUpperCase();
			stats.type = mSidekick[2].split(" ").splice(1).join(" ");
		} else {
			// regular creatures
			stats.size = line[0].toUpperCase();
			stats.type = line.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX)[0].split(" ").splice(1).join(" ");

			stats.alignment = line.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX)[1].toLowerCase();
			AlignmentConvert.tryConvertAlignment(stats, (ali) => options.cbWarning(`Alignment "${ali}" requires manual conversion`));
		}
		stats.type = StatblockConverter._tryParseType(stats.type);
	}

	static _setCleanHp (stats, line) {
		const rawHp = line.split_handleColon("Hit Points ", 1)[1];
		// split HP into average and formula
		const m = /^(\d+) \((.*?)\)$/.exec(rawHp);
		if (!m) stats.hp = {special: rawHp}; // for e.g. Avatar of Death
		else {
			stats.hp = {
				average: Number(m[1]),
				formula: m[2]
			};
			DiceConvert.cleanHpDice(stats);
		}
	}

	_setCleanSpeed (stats, line, options) {
		stats.speed = line;
		SpeedConvert.tryConvertSpeed(stats, options.cbWarning);
	}

	static _setCleanSaves (stats, line, options) {
		stats.save = line.split_handleColon("Saving Throws", 1)[1].trim();
		// convert to object format
		if (stats.save && stats.save.trim()) {
			const spl = stats.save.split(",").map(it => it.trim().toLowerCase()).filter(it => it);
			const nu = {};
			spl.forEach(it => {
				const m = /(\w+)\s*([-+])\s*(\d+)/.exec(it);
				if (m) {
					nu[m[1]] = `${m[2]}${m[3]}`;
				} else {
					options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Save "${it}" requires manual conversion`);
				}
			});
			stats.save = nu;
		}
	}

	static _setCleanSkills (stats, line) {
		stats.skill = line.split_handleColon("Skills", 1)[1].trim().toLowerCase();
		const split = stats.skill.split(",");
		const newSkills = {};
		try {
			split.forEach(s => {
				const splSpace = s.split(" ");
				const val = splSpace.pop().trim();
				let name = splSpace.join(" ").toLowerCase().trim().replace(/ /g, "");
				name = StatblockConverter.SKILL_SPACE_MAP[name] || name;
				newSkills[name] = val;
			});
			stats.skill = newSkills;
			if (stats.skill[""]) delete stats.skill[""]; // remove empty properties
		} catch (ignored) {
			return 0;
		}
	}

	static _setCleanDamageVuln (stats, line) {
		stats.vulnerable = line.split_handleColon("Vulnerabilities", 1)[1].trim();
		stats.vulnerable = StatblockConverter._tryParseDamageResVulnImmune(stats.vulnerable, "vulnerable");
	}

	static _setCleanDamageRes (stats, line) {
		stats.resist = (line.toLowerCase().includes("resistances") ? line.split_handleColon("Resistances", 1) : line.split_handleColon("Resistance", 1))[1].trim();
		stats.resist = StatblockConverter._tryParseDamageResVulnImmune(stats.resist, "resist");
	}

	static _setCleanDamageImm (stats, line) {
		stats.immune = line.split_handleColon("Immunities", 1)[1].trim();
		stats.immune = StatblockConverter._tryParseDamageResVulnImmune(stats.immune, "immune");
	}

	static _setCleanConditionImm (stats, line) {
		stats.conditionImmune = line.split_handleColon("Immunities", 1)[1];
		stats.conditionImmune = StatblockConverter._tryParseDamageResVulnImmune(stats.conditionImmune, "conditionImmune");
	}

	static _setCleanSenses (stats, line) {
		const senses = line.toLowerCase().split_handleColon("senses", 1)[1].trim();
		const tempSenses = [];
		senses.split(StrUtil.COMMA_SPACE_NOT_IN_PARENTHESES_REGEX).forEach(s => {
			s = s.trim();
			if (s) {
				if (s.includes("passive perception")) stats.passive = StatblockConverter._tryConvertNumber(s.split("passive perception")[1].trim());
				else tempSenses.push(s.trim());
			}
		});
		if (tempSenses.length) stats.senses = tempSenses;
		else delete stats.senses;
	}

	static _setCleanLanguages (stats, line) {
		stats.languages = line.split_handleColon("Languages", 1)[1].trim();
		if (stats.languages && /^([-–‒—]|\\u201\d)$/.exec(stats.languages.trim())) delete stats.languages;
		else {
			stats.languages = stats.languages
			// Clean caps words
				.split(/(\W)/g)
				.map(s => {
					return s
						.replace(/Telepathy/g, "telepathy")
						.replace(/All/g, "all")
						.replace(/Understands/g, "understands")
						.replace(/Cant/g, "cant")
						.replace(/Can/g, "can")
				})
				.join("")
				.split(StrUtil.COMMA_SPACE_NOT_IN_PARENTHESES_REGEX);
		}
	}

	static _setCleanCr (stats, line) {
		stats.cr = line.split_handleColon("Challenge", 1)[1].trim().split("(")[0].trim();
	}

	static _hasEntryContent (trait) {
		return trait && (trait.name || (trait.entries.length === 1 && trait.entries[0]) || trait.entries.length > 1);
	}
}
StatblockConverter.SKILL_SPACE_MAP = {
	"sleightofhand": "sleight of hand",
	"animalhandling": "animal handling"
};
StatblockConverter.SAMPLE_TEXT =
	`Mammon
Huge fiend (devil), lawful evil
Armor Class 20 (natural armor)
Hit Points 378 (28d12 + 196)
Speed 50 ft.
STR DEX CON INT WIS CHA
22 (+6) 13 (+1) 24 (+7) 23 (+6) 21 (+5) 26 (+8)
Saving Throws Dex +9, Int +14, Wis +13, Cha +16
Skills Deception +16, Insight +13, Perception +13, Persuasion +16
Damage Resistances cold
Damage Immunities fire, poison; bludgeoning, piercing, and slashing from weapons that aren't silvered
Condition Immunities charmed, exhaustion, frightened, poisoned
Senses truesight 120 ft., passive Perception 23
Languages all, telepathy 120 ft.
Challenge 25 (75,000 XP)
Innate Spellcasting. Mammon's innate spellcasting ability is Charisma (spell save DC 24, +16 to hit with spell attacks). He can innately cast the following spells, requiring no material components:
At will: charm person, detect magic, dispel magic, fabricate (Mammon can create valuable objects), heat metal, magic aura
3/day each: animate objects, counterspell, creation, instant summons, legend lore, teleport
1/day: imprisonment (minimus containment only, inside gems), sunburst
Spellcasting. Mammon is a 6th level spellcaster. His spellcasting ability is Intelligence (spell save DC 13; +5 to hit with spell attacks). He has the following wizard spells prepared:
Cantrips (at will): fire bolt, light, mage hand, prestidigitation
1st level (4 slots): mage armor, magic missile, shield
2nd level (3 slots): misty step, suggestion
3rd level (3 slots): fly, lightning bolt
Legendary Resistance (3/day). If Mammon fails a saving throw, he can choose to succeed instead.
Magic Resistance. Mammon has advantage on saving throws against spells and other magical effects.
Magic Weapons. Mammon's weapon attacks are magical.
ACTIONS
Multiattack. Mammon makes three attacks.
Purse. Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 19 (3d8 + 6) bludgeoning damage plus 18 (4d8) radiant damage.
Molten Coins. Ranged Weapon Attack: +14 to hit, range 40/120 ft., one target. Hit: 16 (3d6 + 6) bludgeoning damage plus 18 (4d8) fire damage.
Your Weight In Gold (Recharge 5-6). Mammon can use this ability as a bonus action immediately after hitting a creature with his purse attack. The creature must make a DC 24 Constitution saving throw. If the saving throw fails by 5 or more, the creature is instantly petrified by being turned to solid gold. Otherwise, a creature that fails the saving throw is restrained. A restrained creature repeats the saving throw at the end of its next turn, becoming petrified on a failure or ending the effect on a success. The petrification lasts until the creature receives a greater restoration spell or comparable magic.
LEGENDARY ACTIONS
Mammon can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. Mammon regains spent legendary actions at the start of his turn.
Attack. Mammon makes one purse or molten coins attack.
Make It Rain! Mammon casts gold and jewels into a 5-foot radius within 60 feet. One creature within 60 feet of the treasure that can see it must make a DC 24 Wisdom saving throw. On a failure, the creature must use its reaction to move its speed toward the trinkets, which vanish at the end of the turn.
Deep Pockets (3 actions). Mammon recharges his Your Weight In Gold ability.`;
StatblockConverter.SAMPLE_MARKDOWN =
	`___
>## Lich
>*Medium undead, any evil alignment*
>___
>- **Armor Class** 17
>- **Hit Points** 135 (18d8 + 54)
>- **Speed** 30 ft.
>___
>|STR|DEX|CON|INT|WIS|CHA|
>|:---:|:---:|:---:|:---:|:---:|:---:|
>|11 (+0)|16 (+3)|16 (+3)|20 (+5)|14 (+2)|16 (+3)|
>___
>- **Saving Throws** Con +10, Int +12, Wis +9
>- **Skills** Arcana +19, History +12, Insight +9, Perception +9
>- **Damage Resistances** cold, lightning, necrotic
>- **Damage Immunities** poison; bludgeoning, piercing, and slashing from nonmagical attacks
>- **Condition Immunities** charmed, exhaustion, frightened, paralyzed, poisoned
>- **Senses** truesight 120 ft., passive Perception 19
>- **Languages** Common plus up to five other languages
>- **Challenge** 21 (33000 XP)
>___
>***Legendary Resistance (3/Day).*** If the lich fails a saving throw, it can choose to succeed instead.
>
>***Rejuvenation.*** If it has a phylactery, a destroyed lich gains a new body in 1d10 days, regaining all its hit points and becoming active again. The new body appears within 5 feet of the phylactery.
>
>***Spellcasting.*** The lich is an 18th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 20, +12 to hit with spell attacks). The lich has the following wizard spells prepared:
>
>• Cantrips (at will): mage hand, prestidigitation, ray of frost
>• 1st level (4 slots): detect magic, magic missile, shield, thunderwave
>• 2nd level (3 slots): detect thoughts, invisibility, Melf's acid arrow, mirror image
>• 3rd level (3 slots): animate dead, counterspell, dispel magic, fireball
>• 4th level (3 slots): blight, dimension door
>• 5th level (3 slots): cloudkill, scrying
>• 6th level (1 slot): disintegrate, globe of invulnerability
>• 7th level (1 slot): finger of death, plane shift
>• 8th level (1 slot): dominate monster, power word stun
>• 9th level (1 slot): power word kill
>
>***Turn Resistance.*** The lich has advantage on saving throws against any effect that turns undead.
>
>### Actions
>***Paralyzing Touch.*** Melee Spell Attack: +12 to hit, reach 5 ft., one creature. *Hit*: 10 (3d6) cold damage. The target must succeed on a DC 18 Constitution saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.
>
>### Legendary Actions
>The lich can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The lich regains spent legendary actions at the start of its turn.
>
>- **Cantrip.** The lich casts a cantrip.
>- **Paralyzing Touch (Costs 2 Actions).** The lich uses its Paralyzing Touch.
>- **Frightening Gaze (Costs 2 Actions).** The lich fixes its gaze on one creature it can see within 10 feet of it. The target must succeed on a DC 18 Wisdom saving throw against this magic or become frightened for 1 minute. The frightened target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a target's saving throw is successful or the effect ends for it, the target is immune to the lich's gaze for the next 24 hours.
>- **Disrupt Life (Costs 3 Actions).** Each non-undead creature within 20 feet of the lich must make a DC 18 Constitution saving throw against this magic, taking 21 (6d6) necrotic damage on a failed save, or half as much damage on a successful one.
>
>`;

if (typeof module !== "undefined") {
	module.exports = {
		AcConvert,
		TagAttack,
		TagHit,
		TagDc,
		TagCondition,
		AlignmentConvert,
		TraitActionTag,
		LanguageTag,
		SenseTag,
		SpellcastingTypeTag,
		DamageTypeTag,
		MiscTag,
		TextClean,
		SpellcastingTraitConvert,
		DiceConvert,
		RechargeConvert,
		SpeedConvert,
		StatblockConverter
	};
}
