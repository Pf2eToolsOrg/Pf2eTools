"use strict";

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

class AcConvert {
	static tryPostProcessAc (m, cbMan, cbErr) {
		let nuAc = [];
		const basic = /^(\d+)( \((.*?)\))?$/.exec(m.ac.trim());
		if (basic) {
			if (basic[3]) {
				const brak = basic[3];
				let cur = {
					ac: Number(basic[1])
				};

				let nextPart = null;

				const from = [];

				const splitter = new RegExp(/,\s?(?![^(]*\))/, "g"); // split on commas not within parentheses

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
							from.push("{@item plate armor +3|dmg|+3 plate armor}");
							break;
						case "half plate armor +1":
							from.push("{@item half plate armor +1|dmg|+1 half-plate armor}");
							break;
						case "scale mail +1":
							from.push("{@item scale mail +1|dmg|+1 scale mail}");
							break;
						case "scale mail +2":
							from.push("{@item scale mail +2|dmg|+2 scale mail}");
							break;
						case "splint mail +2":
							from.push("{@item splint armor +2|dmg|+2 splint armor}");
							break;
						case "studded leather armor +1":
							from.push("{@item studded leather armor +1|dmg|+1 studded leather armor}");
							break;
						case "+2 leather armor":
							from.push("{@item leather armor +2|dmg|+2 leather armor}");
							break;
						case "+3 leather armor":
							from.push("{@item leather armor +3|dmg|+3 leather armor}");
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
			} else {
				nuAc.push(Number(basic[1]));
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
							if (TagAttack.MAP[m[2]]) {
								return `${m[1]}${TagAttack.MAP[m[2]]} `;
							} else {
								cbMan(m[2]);
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
	"Melee Weapon Attack:": "{@atk mw}",
	"Ranged Weapon Attack:": "{@atk rw}",
	"Melee Attack:": "{@atk m}",
	"Ranged Attack:": "{@atk r}",
	"Area Attack:": "{@atk a}",
	"Area Weapon Attack:": "{@atk aw}",
	"Melee Spell Attack:": "{@atk ms}",
	"Melee or Ranged Weapon Attack:": "{@atk mw,rw}",
	"Ranged Spell Attack:": "{@atk rs}",
	"Melee or Ranged Spell Attack:": "{@atk ms,rs}",
	"Melee or Ranged Attack:": "{@atk m,r}"
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

if (typeof module !== "undefined") {
	module.exports = {
		AcConvert,
		TagAttack,
		TagHit
	};
}
