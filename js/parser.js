// PARSING =============================================================================================================
Parser = {};
Parser._parse_aToB = function (abMap, a, fallback) {
	if (a === undefined || a === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof a === "string") a = a.trim();
	if (abMap[a] !== undefined) return abMap[a];
	return fallback !== undefined ? fallback : a;
};

Parser._parse_bToA = function (abMap, b) {
	if (b === undefined || b === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof b === "string") b = b.trim();
	for (const v in abMap) {
		if (!abMap.hasOwnProperty(v)) continue;
		if (abMap[v] === b) return v;
	}
	return b;
};
Parser.numberToText = function (number, freq) {
	if (number == null) throw new TypeError(`undefined or null object passed to parser`);
	// TODO: Hacky fix for frequencies
	if (typeof number === "string") return number;
	if (Math.abs(number) >= 100) return `${number}`;

	function getAsText (num) {
		const abs = Math.abs(num);
		switch (abs) {
			case 0:
				return "zero";
			case 1:
				if (freq) {
					return "once"
				} else return "one"
			case 2:
				if (freq) {
					return "twice"
				} else return "two"
			case 3:
				return "three";
			case 4:
				return "four";
			case 5:
				return "five";
			case 6:
				return "six";
			case 7:
				return "seven";
			case 8:
				return "eight";
			case 9:
				return "nine";
			case 10:
				return "ten";
			case 11:
				return "eleven";
			case 12:
				return "twelve";
			case 13:
				return "thirteen";
			case 14:
				return "fourteen";
			case 15:
				return "fifteen";
			case 16:
				return "sixteen";
			case 17:
				return "seventeen";
			case 18:
				return "eighteen";
			case 19:
				return "nineteen";
			case 20:
				return "twenty";
			case 30:
				return "thirty";
			case 40:
				return "forty";
			case 50:
				return "<span title=\"fiddy\">fifty</span>"; // :^)
			case 60:
				return "sixty";
			case 70:
				return "seventy";
			case 80:
				return "eighty";
			case 90:
				return "ninety";
			default: {
				const str = String(abs);
				return `${getAsText(Number(`${str[0]}0`))}-${getAsText(Number(str[1]))}`;
			}
		}
	}

	if (freq) {
		return `${getAsText(number)} ${number > 2 ? "times" : ""}`
	} else {
		return `${number < 0 ? "negative " : ""}${getAsText(number)}`
	}
};

Parser._greatestCommonDivisor = function (a, b) {
	if (b < Number.EPSILON) return a;
	return Parser._greatestCommonDivisor(b, Math.floor(a % b));
};
Parser.numberToFractional = function (number) {
	const len = number.toString().length - 2;
	let denominator = 10 ** len;
	let numerator = number * denominator;
	const divisor = Parser._greatestCommonDivisor(numerator, denominator);
	numerator = Math.floor(numerator / divisor);
	denominator = Math.floor(denominator / divisor);

	return denominator === 1 ? String(numerator) : `${Math.floor(numerator)}/${Math.floor(denominator)}`;
};

Parser.ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

Parser._addCommas = function (intNum) {
	return `${intNum}`.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
};

Parser.numToBonus = function (intNum) {
	return `${intNum >= 0 ? "+" : ""}${intNum}`
};

Parser.isValidCreatureLvl = function (lvl) {
	lvl = Number(lvl);
	return lvl > -2 && lvl < 26
}

Parser.actionTypeKeyToFull = function (key) {
	key = key.toLowerCase();
	switch (key) {
		case "untrained": return "Skill (Untrained)"
		case "trained": return "Skill (Trained)"
		case "expert": return "Skill (Expert)"
		case "master": return "Skill (Master)"
		case "legendary": return "Skill (Legendary)"
		case "variantrule": return "Optional/Variant Action"
		default: return key.toTitleCase();
	}
}

Parser.SKILL_TO_ATB_ABV = {
	"acrobatics": "dex",
	"arcana": "int",
	"athletics": "str",
	"crafting": "int",
	"deception": "cha",
	"diplomacy": "cha",
	"intimidation": "cha",
	"lore": "int",
	"medicine": "wis",
	"nature": "wis",
	"occultism": "int",
	"performance": "cha",
	"religion": "wis",
	"society": "int",
	"stealth": "dex",
	"survival": "wis",
	"thievery": "dex",
};

Parser.skillToAbilityAbv = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_ATB_ABV, skill);
};

Parser.SKILL_TO_SHORT = {
	"acrobatics": "acro",
	"arcana": "arc",
	"athletics": "ath",
	"crafting": "cra",
	"deception": "dec",
	"diplomacy": "dip",
	"intimidation": "int",
	"lore": "lore",
	"medicine": "med",
	"nature": "nat",
	"occultism": "occ",
	"performance": "per",
	"religion": "rel",
	"society": "soc",
	"stealth": "ste",
	"survival": "sur",
	"thievery": "thi",
};

Parser.skillToShort = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_SHORT, skill);
};

Parser.XP_CHART = {
	"-4": 10,
	"-3": 15,
	"-2": 20,
	"-1": 30,
	"0": 40,
	"1": 60,
	"2": 80,
	"3": 120,
	"4": 160,
}

Parser._getSourceStringFromSource = function (source) {
	if (source && source.source) return source.source;
	return source;
};
Parser._buildSourceCache = function (dict) {
	const out = {};
	Object.entries(dict).forEach(([k, v]) => out[k.toLowerCase()] = v);
	return out;
};
Parser._sourceFullCache = null;
Parser.hasSourceFull = function (source) {
	Parser._sourceFullCache = Parser._sourceFullCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_FULL);
	return !!Parser._sourceFullCache[source.toLowerCase()];
};
Parser._sourceAbvCache = null;
Parser.hasSourceAbv = function (source) {
	Parser._sourceAbvCache = Parser._sourceAbvCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_ABV);
	return !!Parser._sourceAbvCache[source.toLowerCase()];
};
Parser._sourceDateCache = null;
Parser.hasSourceDate = function (source) {
	Parser._sourceDateCache = Parser._sourceDateCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_DATE);
	return !!Parser._sourceDateCache[source.toLowerCase()];
};
Parser.hasSourceStore = function (source) {
	Parser._sourceStoreCache = Parser._sourceStoreCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_STORE);
	return !!Parser._sourceStoreCache[source.toLowerCase()];
};
Parser.sourceJsonToFull = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceFull(source)) return Parser._sourceFullCache[source.toLowerCase()].replace(/'/g, "\u2019");
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToFull(source).replace(/'/g, "\u2019");
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, "\u2019");
};
Parser.sourceJsonToFullCompactPrefix = function (source) {
	let compact = Parser.sourceJsonToFull(source);
	Object.keys(Parser.SOURCE_PREFIX_TO_SHORT).forEach(prefix => {
		compact = compact.replace(prefix, Parser.SOURCE_PREFIX_TO_SHORT[prefix] || prefix);
	});
	Parser.COMPACT_PREFIX_MAP.forEach(it => compact = compact.replace(it.re, it.replaceWith));
	return compact;
};
Parser.sourceJsonToAbv = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceAbv(source)) return Parser._sourceAbvCache[source.toLowerCase()];
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToAbv(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_ABV, source);
};
Parser.sourceJsonToDate = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceDate(source)) return Parser._sourceDateCache[source.toLowerCase()];
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToDate(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_DATE, source, null);
};
Parser.sourceJsonToStore = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceStore(source)) return Parser._sourceStoreCache[source.toLowerCase()];
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToUrl(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_STORE, source, null);
};
Parser.sourceJsonToColor = function (source) {
	return `source${Parser._getSourceStringFromSource(source).replace(/[&\\/\\#,+()$~%.'":*?<>{}]/g, "_")}`;
};

Parser.stringToSlug = function (str) {
	return str.trim().toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};
Parser.stringToCasedSlug = function (str) {
	return str.replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

// TODO: Using conversion tables
Parser.priceToValue = function (price) {
	if (price == null) return 0;
	let mult = 0;
	let offset = 0;
	let amount = price.amount || 0;
	switch (price.coin) {
		case "cp":
			mult = 1;
			break;
		case "sp":
			mult = 10;
			break;
		case "gp":
			mult = 100;
			break;
		case "pp":
			mult = 1000;
			break;
	}
	// FIXME: This is rather stupid in retrospect, to modify the price if there is a note.
	// if (price.note != null) offset = 0.1;
	return mult * amount + offset
};
Parser.priceToFull = function (price, noPlatinum) {
	if (price == null) return "\u2014";
	if (typeof price === "object") {
		if (price.amount == null || price.coin == null) return "\u2014";
		return `${Parser._addCommas(price.amount)} ${price.coin}${price.note ? ` ${price.note}` : ""}`
	} else if (typeof price === "number" && !isNaN(price)) {
		// assume it's all copper (1/100 gp)
		let coin = "";
		let divide = 1;
		if (noPlatinum) {
			switch (Math.floor(Math.log10(price))) {
				case 3: case 4: case 5: case 6: case 7: case 8: case 9: case 10:
				case 2: coin = "gp"; divide = 100; break;
				case 1: coin = "sp"; divide = 10; break;
				case 0: coin = "cp"; divide = 1; break;
			}
		} else {
			switch (Math.floor(Math.log10(price))) {
				case 4: case 5: case 6: case 7: case 8: case 9: case 10:
				case 3: coin = "pp"; divide = 1000; break;
				case 2: coin = "gp"; divide = 100; break;
				case 1: coin = "sp"; divide = 10; break;
				case 0: coin = "cp"; divide = 1; break;
			}
		}
		return `${Parser._addCommas(price / divide)} ${coin}`
	}
	return "\u2014"
};
Parser.itemValueToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "value", "valueMult", isShortForm);
};
Parser.itemValueToFullMultiCurrency = function (item, isShortForm) {
	return Parser._moneyToFullMultiCurrency(item, "value", "valueMult", isShortForm);
};
Parser._moneyToFull = function (it, prop, propMult, isShortForm) {
	if (it[prop]) {
		const {coin, mult} = Parser.getCurrencyAndMultiplier(it[prop], it.currencyConversion);
		return `${(it[prop] * mult).toLocaleString(undefined, {maximumFractionDigits: 5})} ${coin}`;
	} else if (it[propMult]) return isShortForm ? `×${it[propMult]}` : `base value ×${it[propMult]}`;
	return "";
};
Parser._moneyToFullMultiCurrency = function (it, prop, propMult, isShortForm) {
	if (it[prop]) {
		const simplified = CurrencyUtil.doSimplifyCoins(
			{
				cp: it[prop],
			},
			{
				currencyConversionId: it.currencyConversion,
			},
		);

		const conversionTable = Parser.getCurrencyConversionTable(it.currencyConversion);

		return [...conversionTable]
			.reverse()
			.filter(meta => simplified[meta.coin])
			.map(meta => `${simplified[meta.coin].toLocaleString(undefined, {maximumFractionDigits: 5})} ${meta.coin}`)
			.join(", ");
	} else if (it[propMult]) return isShortForm ? `×${it[propMult]}` : `base value ×${it[propMult]}`;
	return "";
};
Parser.DEFAULT_CURRENCY_CONVERSION_TABLE = [
	{
		coin: "cp",
		mult: 1,
	},
	{
		coin: "sp",
		mult: 0.1,
	},
	{
		coin: "gp",
		mult: 0.01,
		isFallback: true,
	},
];
Parser.FULL_CURRENCY_CONVERSION_TABLE = [
	{
		coin: "cp",
		mult: 1,
	},
	{
		coin: "sp",
		mult: 0.1,
	},
	{
		coin: "gp",
		mult: 0.01,
		isFallback: true,
	},
	{
		coin: "pp",
		mult: 0.001,
	},
];
Parser.getCurrencyConversionTable = function (currencyConversionId) {
	const fromBrew = currencyConversionId ? MiscUtil.get(BrewUtil.homebrewMeta, "currencyConversions", currencyConversionId) : null;
	const conversionTable = fromBrew && fromBrew.length ? fromBrew : Parser.DEFAULT_CURRENCY_CONVERSION_TABLE;
	if (conversionTable !== Parser.DEFAULT_CURRENCY_CONVERSION_TABLE) conversionTable.sort((a, b) => SortUtil.ascSort(b.mult, a.mult));
	return conversionTable;
};
Parser.getCurrencyAndMultiplier = function (value, currencyConversionId) {
	const conversionTable = Parser.getCurrencyConversionTable(currencyConversionId);

	if (!value) return conversionTable.find(it => it.isFallback) || conversionTable[0];
	if (conversionTable.length === 1) return conversionTable[0];
	if (!Number.isInteger(value) && value < conversionTable[0].mult) return conversionTable[0];

	for (let i = conversionTable.length - 1; i >= 0; --i) {
		if (Number.isInteger(value * conversionTable[i].mult)) return conversionTable[i];
	}

	return conversionTable.last();
};
Parser.COIN_ABVS = ["cp", "sp", "gp", "pp"];
Parser.COIN_ABV_TO_FULL = {
	"cp": "copper pieces",
	"sp": "silver pieces",
	"gp": "gold pieces",
	"pp": "platinum pieces",
};
Parser.COIN_CONVERSIONS = [1, 10, 100, 1000];
Parser.coinAbvToFull = function (coin) {
	return Parser._parse_aToB(Parser.COIN_ABV_TO_FULL, coin);
};

Parser._decimalSeparator = (0.1).toLocaleString().substring(1, 2);
Parser._numberCleanRegexp = Parser._decimalSeparator === "." ? new RegExp(/[\s,]*/g, "g") : new RegExp(/[\s.]*/g, "g");
Parser._costSplitRegexp = Parser._decimalSeparator === "." ? new RegExp(/(\d+(\.\d+)?)([csegp]p)/) : new RegExp(/(\d+(,\d+)?)([csegp]p)/);
/** input e.g. "25 gp", "1,000pp" */
Parser.coinValueToNumber = function (value) {
	if (!value) return 0;
	// handle oddities
	if (value === "Varies") return 0;

	value = value
		.replace(/\s*/, "")
		.replace(Parser._numberCleanRegexp, "")
		.toLowerCase();
	const m = Parser._costSplitRegexp.exec(value);
	if (!m) throw new Error(`Badly formatted value "${value}"`);
	const ixCoin = Parser.COIN_ABVS.indexOf(m[3]);
	if (!~ixCoin) throw new Error(`Unknown coin type "${m[3]}"`);
	return Number(m[1]) * Parser.COIN_CONVERSIONS[ixCoin];
};

Parser.PROFICIENCIES = ["Untrained", "Trained", "Expert", "Master", "Legendary"]
Parser.proficiencyAbvToFull = function (abv) {
	switch (abv) {
		case "t": return "trained";
		case "T": return "Trained";
		case "e": return "expert";
		case "E": return "Expert";
		case "m": return "master";
		case "M": return "Master";
		case "l": return "legendary";
		case "L": return "Legendary";
		case "u": return "untrained";
		case "U": return "Untrained";
		default: throw new Error(`Unknown proficiency rank ${abv}.`)
	}
}
Parser.proficiencyToNumber = function (prof) {
	switch (prof[0].toLowerCase()) {
		case "u": return 0;
		case "t": return 1;
		case "e": return 2;
		case "m": return 3;
		case "l": return 4;
		default: return 69;
	}
}
Parser.genderToFull = function (g) {
	switch (g.toLowerCase()) {
		case "m": return "male";
		case "f": return "female";
		case "a": return "agender";
		case "gf": return "genderfluid";
		case "nb": return "nonbinary";
		default: return "";
	}
}
Parser.savingThrowAbvToFull = function (abv) {
	switch (abv) {
		case "f":
		case "F":
		case "Fort":
		case "fort": return "Fortitude";
		case "r":
		case "R":
		case "Ref":
		case "ref": return "Reflex";
		case "w":
		case "W":
		case "Will":
		case "will": return "Will";
		default: throw new Error(`Unknown saving throw abv ${abv}.`)
	}
}

Parser.speedToFullMap = function (speed) {
	return Object.keys(speed).map(k => {
		if (k === "walk") return `${speed.walk} feet`
		else return `${k.uppercaseFirst()} ${speed[k]} feet`
	})
}

Parser.getClassSideBar = function (sidebarEntries) {
	sidebarEntries = MiscUtil.copy(sidebarEntries)
	const first = sidebarEntries.splice(0, 1)[0];
	return {
		type: "pf2-sidebar",
		name: first.name,
		entries: first.entries.concat(sidebarEntries.map(it => [{type: "pf2-title", name: it.name}, ...it.entries]).flat()),
	}
}
Parser.getClassSideBarEntries = function (cls) {
	let initProf = cls.initialProficiencies
	const out = [];
	let sideBar = {
		type: "pf2-sidebar",
		name: `${(cls.rarity ? "RARITY" : "INITIAL PROFICIENCIES")}`,
		entries: [
		],
	}
	if (cls.rarity) out.push({name: "RARITY", entries: [`{@trait ${cls.rarity}}`]});
	const initProfText = "At 1st level, you gain the listed proficiency ranks in the following statistics. You are untrained in anything not listed unless you gain a better proficiency rank in some other way."
	out.push({name: "INITIAL PROFICIENCIES", entries: [initProfText]});
	out.push({name: "PERCEPTION", entries: [`${Parser.proficiencyAbvToFull(initProf.perception)} in Perception`]});
	out.push({
		name: "SAVING THROWS",
		entries: [
			`${Parser.proficiencyAbvToFull(initProf.fort)} in Fortitude`,
			`${Parser.proficiencyAbvToFull(initProf.ref)} in Reflex`,
			`${Parser.proficiencyAbvToFull(initProf.will)} in Will`,
		]});

	function initProfParser (thing, entry) {
		Object.keys(thing).forEach(k => {
			let thingArray = [];
			let prof = "";
			switch (k) {
				case "u": {
					thingArray = thing.u
					prof = "Untrained"
					break;
				}
				case "t": {
					thingArray = thing.t
					prof = "Trained"
					break;
				}
				case "e": {
					thingArray = thing.e
					prof = "Expert"
					break;
				}
				case "m": {
					thingArray = thing.m
					prof = "Master"
					break;
				}
				case "l": {
					thingArray = thing.l
					prof = "Legendary"
					break;
				}
				case "add": return entry.push(`{@indentSubsequent Trained in a number of additional skills equal to ${thing.add} plus your Intelligence modifier}`);
				default:
			}
			thingArray.forEach(element => {
				if (typeof element === "object") {
					if (element.entry) {
						return entry.push(`{@indentSubsequent ${prof} in ${element.entry}}`);
					} else {
						return entry.push(`{@indentSubsequent ${prof} in ${element.skill.length === 1 ? "" : `your choice of`} ${element.skill.map(s => `{@skill ${s}}`).joinConjunct(", ", " or ")}}`);
					}
				} else return entry.push(`{@indentSubsequent ${prof} in ${element}}`);
			});
		});
	}

	const skillsEntries = [];
	const attacksEntries = [];
	const defensesEntries = [];
	initProfParser(initProf.skills, skillsEntries)
	out.push({name: "SKILLS", entries: skillsEntries});
	initProfParser(initProf.attacks, attacksEntries)
	out.push({name: "ATTACKS", entries: attacksEntries});
	initProfParser(initProf.defenses, defensesEntries)
	out.push({name: "DEFENSES", entries: defensesEntries});

	if (initProf.classDc) out.push({name: "CLASS DC", entries: [initProf.classDc.entry]});
	if (initProf.spells) {
		const spellsEntries = [];
		initProfParser(initProf.spells, spellsEntries)
		out.push({name: "SPELLS", entries: spellsEntries});
	}
	return out
}

Parser.spSchoolToStyle = function (school) {
	const rawColor = MiscUtil.get(Renderer.trait.TRAITS, school.toLowerCase(), "_data", "school", "color");
	if (!rawColor || !rawColor.trim()) return "";
	const validColor = BrewUtil.getValidColor(rawColor);
	if (validColor.length) return `style="color: #${validColor}"`;
	return "";
};
Parser.spSchoolToAbv = function (school) {
	const schoolAbv = MiscUtil.get(Renderer.trait.TRAITS, school.toLowerCase(), "_data", "school", "short");
	if (!schoolAbv || !schoolAbv.trim()) return school;
	return schoolAbv;
};

TR_AC = "Arcane";
TR_DV = "Divine";
TR_OC = "Occult";
TR_PR = "Primal";
Parser.TRADITIONS = [TR_AC, TR_DV, TR_OC, TR_PR];

Parser.getOrdinalForm = function (i) {
	i = Number(i);
	if (isNaN(i)) return "";
	const j = i % 10;
	const k = i % 100;
	if (j === 1 && k !== 11) return `${i}st`;
	if (j === 2 && k !== 12) return `${i}nd`;
	if (j === 3 && k !== 13) return `${i}rd`;
	return `${i}th`;
};

Parser.spLevelToFull = function (level) {
	return Parser.getOrdinalForm(level);
};

Parser.getArticle = function (str) {
	str = `${str}`;
	str = str.replace(/\d+/g, (...m) => Parser.numberToText(m[0]));
	return /^[aeiou]/.test(str) ? "an" : "a";
};

Parser.spLevelToFullLevelText = function (level, dash) {
	return `${Parser.spLevelToFull(level)}${(level === 0 ? "s" : `${dash ? "-" : " "}level`)}`;
};

Parser.COMPONENTS_TO_FULL = {};
Parser.COMPONENTS_TO_FULL["V"] = "verbal";
Parser.COMPONENTS_TO_FULL["M"] = "material";
Parser.COMPONENTS_TO_FULL["S"] = "somatic";
Parser.COMPONENTS_TO_FULL["F"] = "focus";

Parser.alignToFull = function (align) {
	switch (String(align).toLowerCase()) {
		case null:
			return "";
		case "any":
			return "Any";
		case "lg":
		case "lawful good":
			return "Lawful Good";
		case "ng":
		case "neutral good":
			return "Neutral Good";
		case "cg":
		case "chaotic good":
			return "Chaotic Good";
		case "ln":
		case "lawful neutral":
			return "Lawful Neutral";
		case "n":
		case "neutral":
			return "Neutral";
		case "cn":
		case "chaotic neutral":
			return "Chaotic Neutral";
		case "le":
		case "lawful evil":
			return "Lawful Evil";
		case "ne":
		case "neutral evil":
			return "Neutral Evil";
		case "ce":
		case "chaotic evil":
			return "Chaotic Evil";
		case "all":
			return "All";
		case "l":
		case "lawful":
			return "Lawful";
		case "c":
		case "chaotic":
			return "Chaotic";
		case "g":
		case "good":
			return "Good";
		case "e":
		case "evil":
			return "Evil";
		default:
			return "\u2014";
	}
};

Parser.CAT_ID_QUICKREF = 10;
Parser.CAT_ID_VARIANT_RULE = 11;
Parser.CAT_ID_SUBSYSTEM = 12;
Parser.CAT_ID_TABLE = 13;
Parser.CAT_ID_TABLE_GROUP = 14;
Parser.CAT_ID_BOOK = 15;

Parser.CAT_ID_ANCESTRY = 20;
Parser.CAT_ID_HERITAGE = 21;
Parser.CAT_ID_VE_HERITAGE = 22;
Parser.CAT_ID_BACKGROUND = 7;
Parser.CAT_ID_CLASS = 23;
Parser.CAT_ID_CLASS_FEATURE = 5;
Parser.CAT_ID_SUBCLASS = 24;
Parser.CAT_ID_SUBCLASS_FEATURE = 6;
Parser.CAT_ID_ARCHETYPE = 25;
Parser.CAT_ID_FEAT = 0;
Parser.CAT_ID_COMPANION = 26;
Parser.CAT_ID_FAMILIAR = 27;
Parser.CAT_ID_EIDOLON = 28;
Parser.CAT_ID_OPTIONAL_FEATURE = 30;
Parser.CAT_ID_OPTIONAL_FEATURE_LESSON = 31;

Parser.CAT_ID_ADVENTURE = 50;
Parser.CAT_ID_HAZARD = 51;

Parser.CAT_ID_ACTION = 8;
Parser.CAT_ID_CREATURE = 1;
Parser.CAT_ID_CONDITION = 60;
Parser.CAT_ID_ITEM = 2;
Parser.CAT_ID_SPELL = 3;
Parser.CAT_ID_AFFLICTION = 61;
Parser.CAT_ID_CURSE = 62;
Parser.CAT_ID_DISEASE = 63;
Parser.CAT_ID_ABILITY = 64;
Parser.CAT_ID_DEITY = 9;
Parser.CAT_ID_LANGUAGE = 65;
Parser.CAT_ID_PLACE = 66;
Parser.CAT_ID_PLANE = 67;
Parser.CAT_ID_NATION = 68;
Parser.CAT_ID_SETTLEMENT = 69;
Parser.CAT_ID_RITUAL = 70;
Parser.CAT_ID_VEHICLE = 71;
Parser.CAT_ID_TRAIT = 4;
Parser.CAT_ID_ORGANIZATION = 72;

Parser.CAT_ID_PAGE = 99;

// FIXME:
Parser.CAT_ID_TO_FULL = {};
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_QUICKREF] = "Quick Reference";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VARIANT_RULE] = "Variant Rule";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBSYSTEM] = "Subsystem";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE_GROUP] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BOOK] = "Book";

Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ANCESTRY] = "Ancestry";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_HERITAGE] = "Heritage";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VE_HERITAGE] = "Versatile Heritage";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BACKGROUND] = "Background";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS] = "Class";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS_FEATURE] = "Class Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS] = "Subclass";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS_FEATURE] = "Subclass Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARCHETYPE] = "Archetype";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FEAT] = "Feat";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_COMPANION] = "Companion";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FAMILIAR] = "Familiar";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_EIDOLON] = "Eidolon";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OPTIONAL_FEATURE] = "Optional Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OPTIONAL_FEATURE_LESSON] = "Lesson";

Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ADVENTURE] = "Adventure";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_HAZARD] = "Hazard";

Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ACTION] = "Action";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CREATURE] = "Bestiary";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CONDITION] = "Condition";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ITEM] = "Item";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SPELL] = "Spell";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_AFFLICTION] = "Affliction";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CURSE] = "Curse";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DISEASE] = "Disease";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ABILITY] = "Creature Ability";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DEITY] = "Deity";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_LANGUAGE] = "Language";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PLACE] = "Place";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PLANE] = "Plane";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ORGANIZATION] = "Organization";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_NATION] = "Nation";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SETTLEMENT] = "Settlement";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RITUAL] = "Ritual";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE] = "Vehicle";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TRAIT] = "Trait";

Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PAGE] = "Page";

Parser.pageCategoryToFull = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_FULL, catId);
};

Parser.CAT_ID_TO_PROP = {};
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_QUICKREF] = null;
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VARIANT_RULE] = "variantrule";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBSYSTEM] = "variantrule";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE] = "table";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE_GROUP] = "tableGroup";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BOOK] = "book";

Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ANCESTRY] = "ancestry";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_HERITAGE] = "heritage";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VE_HERITAGE] = "versatileHeritage";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BACKGROUND] = "background";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS] = "class";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS_FEATURE] = "classFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS] = "subclass";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS_FEATURE] = "subclassFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARCHETYPE] = "archetype";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FEAT] = "feat";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_COMPANION] = "companion";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FAMILIAR] = "familiar";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_EIDOLON] = "eidolon";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OPTIONAL_FEATURE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OPTIONAL_FEATURE_LESSON] = "optionalfeature";

Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ADVENTURE] = "adventure";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_HAZARD] = "hazard";

Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ACTION] = "action";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CREATURE] = "creature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CONDITION] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ITEM] = "item";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SPELL] = "spell";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_AFFLICTION] = "affliction";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CURSE] = "curse";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DISEASE] = "disease";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ABILITY] = "ability";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DEITY] = "deity";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_LANGUAGE] = "language";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PLACE] = "place";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PLANE] = "place";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ORGANIZATION] = "organization";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_NATION] = "place";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SETTLEMENT] = "place";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RITUAL] = "ritual";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VEHICLE] = "vehicle";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TRAIT] = "trait";

Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PAGE] = null;

Parser.CAT_ID_TO_PROP[Parser.CAT_ID_GENERIC_DATA] = "generic";

Parser.pageCategoryToProp = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_PROP, catId);
};

Parser.ABIL_ABVS = ["str", "dex", "con", "int", "wis", "cha"];

Parser.bookOrdinalToAbv = (ordinal, preNoSuff) => {
	if (ordinal === undefined) return "";
	switch (ordinal.type) {
		case "part":
			return `${preNoSuff ? " " : ""}Part ${ordinal.identifier}${preNoSuff ? "" : " \u2014 "}`;
		case "chapter":
			return `${preNoSuff ? " " : ""}Ch. ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		case "episode":
			return `${preNoSuff ? " " : ""}Ep. ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		case "appendix":
			return `${preNoSuff ? " " : ""}App. ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		case "level":
			return `${preNoSuff ? " " : ""}Level ${ordinal.identifier}${preNoSuff ? "" : ": "}`;
		default:
			throw new Error(`Unhandled ordinal type "${ordinal.type}"`);
	}
};

Parser.nameToTokenName = function (name) {
	return name
		.normalize("NFD") // replace diactrics with their individual graphemes
		.replace(/[\u0300-\u036f]/g, "") // remove accent graphemes
		.replace(/Æ/g, "AE").replace(/æ/g, "ae")
		.replace(/"/g, "");
};

Parser.TM_A = "action";
Parser.TM_AA = "two";
Parser.TM_AAA = "three";
Parser.TM_R = "reaction";
Parser.TM_F = "free";
Parser.TM_ROUND = "round";
Parser.TM_MINS = "minute";
Parser.TM_HRS = "hour";
Parser.TM_DAYS = "day";
Parser.TM_VARIES = "varies";
Parser.TIME_ACTIONS = [Parser.TM_A, Parser.TM_R, Parser.TM_F];

Parser.TM_TO_ACTIVITY = {};
Parser.TM_TO_ACTIVITY[Parser.TM_F] = "Free Action";
Parser.TM_TO_ACTIVITY[Parser.TM_R] = "Reaction";
Parser.TM_TO_ACTIVITY[Parser.TM_A] = "Action";
Parser.TM_TO_ACTIVITY[Parser.TM_AA] = "Two-Action";
Parser.TM_TO_ACTIVITY[Parser.TM_AAA] = "Three-Action";
Parser.TM_TO_ACTIVITY[Parser.TM_ROUND] = "Rounds";
Parser.TM_TO_ACTIVITY[Parser.TM_VARIES] = "Varies";
Parser.TM_TO_ACTIVITY[Parser.TM_MINS] = "Minutes";
Parser.TM_TO_ACTIVITY[Parser.TM_HRS] = "Hours";
Parser.TM_TO_ACTIVITY[Parser.TM_DAYS] = "Days";

Parser.ACTIVITY_TYPE_TO_IDX = Object.keys(Parser.TM_TO_ACTIVITY).map((a, ix) => ({[a]: ix})).reduce((a, b) => Object.assign(a, b), {});
Parser.activityTypeToNumber = function (activity) {
	return Parser._parse_aToB(Parser.ACTIVITY_TYPE_TO_IDX, activity, 900000000);
}

Parser.timeToActivityType = function (time) {
	if (time == null) return null;
	if (time.unit == null) return null;
	switch (time.unit) {
		case Parser.TM_VARIES:
		case Parser.TM_DAYS:
		case Parser.TM_HRS:
		case Parser.TM_MINS:
		case Parser.TM_ROUND:
		case Parser.TM_R:
		case Parser.TM_F:
			return Parser.TM_TO_ACTIVITY[time.unit];
		case Parser.TM_A: {
			if (time.number === 1) return Parser.TM_TO_ACTIVITY[Parser.TM_A];
			if (time.number === 2) return Parser.TM_TO_ACTIVITY[Parser.TM_AA];
			if (time.number === 3) return Parser.TM_TO_ACTIVITY[Parser.TM_AAA];
		}
	}
};

Parser.getNormalisedTime = function (time) {
	if (time == null) return 0;
	if (time === "Exploration") return 900000000;
	if (time === "Downtime") return 900000001;
	let multiplier = 1;
	let offset = 0;
	switch (time.unit) {
		case Parser.TM_F: offset = 1; break;
		case Parser.TM_R: offset = 2; break;
		case Parser.TM_A: multiplier = 10; break;
		case Parser.TM_AA: multiplier = 20; break;
		case Parser.TM_AAA: multiplier = 30; break;
		case Parser.TM_ROUND: multiplier = 60; break;
		case Parser.TM_MINS: multiplier = 600; break;
		case Parser.TM_HRS: multiplier = 36000; break;
		case Parser.TM_DAYS: multiplier = 864000; break;
		case Parser.TM_VARIES: multiplier = 100; break;
	}
	return (multiplier * time.number) + offset;
};

Parser.timeToFullEntry = function (time) {
	if (time.entry != null) return time.entry;
	if (Parser.TIME_ACTIONS.includes(time.unit)) {
		if (time.number === 1 && time.unit === Parser.TM_F) return "{@as f}";
		if (time.number === 1 && time.unit === Parser.TM_R) return "{@as r}";
		if (time.number === 2 && time.unit === Parser.TM_A) return "{@as 2}";
		if (time.number === 3 && time.unit === Parser.TM_A) return "{@as 3}";
		return "{@as 1}";
	}
	return `${time.number} ${time.unit}${time.number >= 2 ? "s" : ""}`;
}

Parser.freqToFullEntry = function (freq) {
	if (freq.special != null) return freq.special;
	freq.number = Parser.numberToText(freq.freq, true)
	return `${freq.number} ${freq.recurs ? "every" : "per"} ${freq.interval || ""} ${freq.interval >= 2 ? `${freq.unit}s` : freq.customUnit ? freq.customUnit : freq.unit}${freq.overcharge ? ", plus overcharge" : ""}`;
}

Parser.timeToTableStr = function (time) {
	if (time.unit === "varies") return "Varies";
	if (Parser.TIME_ACTIONS.includes(time.unit)) {
		if (time.number === 1 && time.unit === Parser.TM_F) return "Free Action";
		if (time.number === 1 && time.unit === Parser.TM_R) return "Reaction";
		if (time.number === 2 && time.unit === Parser.TM_A) return "Two-Action";
		if (time.number === 3 && time.unit === Parser.TM_A) return "Three-Action";
		return "Action";
	}
	return `${time.number} ${time.unit.uppercaseFirst()}${time.number >= 2 ? "s" : ""}`;
}

UNT_FEET = "feet";
UNT_MILES = "mile";
Parser.INCHES_PER_FOOT = 12;
Parser.FEET_PER_MILE = 5280;

RNG_SELF = "self";
RNG_UNLIMITED = "unlimited";
RNG_UNLIMITED_SAME_PLANE = "planetary";
RNG_UNLIMITED_OTHER_PLANE = "interplanar";
RNG_TOUCH = "touch";

Parser.rangeToFull = function (range) {
	if (range == null) return "";
	if (range.entry) return range.entry;
	if (range.unit === UNT_FEET) return `${range.number} ${range.number === 1 ? "foot" : "feet"}`;
	if (range.unit === UNT_MILES) return `${range.number} ${range.number === 1 ? "mile" : "miles"}`;
	return range.unit;
}

// TODO: Handle range/area types: emanation, cone etc?
Parser.getNormalisedRange = function (range) {
	if (!MiscUtil.isObject(range)) return 0;
	let multiplier = 1;
	let distance = 0;
	let offset = 0;

	switch (range.unit) {
		case null: distance = 0; break;
		case UNT_FEET: multiplier = Parser.INCHES_PER_FOOT; distance = range.number; break;
		case UNT_MILES: multiplier = Parser.INCHES_PER_FOOT * Parser.FEET_PER_MILE; distance = range.number; break;
		case RNG_TOUCH: distance = 1; break;
		case RNG_UNLIMITED_SAME_PLANE: distance = 900000000; break;
		case RNG_UNLIMITED_OTHER_PLANE: distance = 900000001; break;
		case RNG_UNLIMITED: distance = 900000002; break;
		case "unknown": distance = 900000003; break;
		default: {
			// it's homebrew?
			const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "spellDistanceUnits", range.unit);
			if (fromBrew) {
				const ftPerUnit = fromBrew.feetPerUnit;
				if (ftPerUnit != null) {
					multiplier = Parser.INCHES_PER_FOOT * ftPerUnit;
					distance = range.number;
				} else {
					distance = 910000000; // default to max distance, to have them displayed at the bottom
				}
			}
			break;
		}
	}
	// value in inches, to allow greater granularity
	return (multiplier * distance) + offset;
}

Parser.getFilterRange = function (object) {
	const fRan = object.range || {type: null};
	if (fRan.unit !== null) {
		let norm_range = Parser.getNormalisedRange(fRan);
		if (norm_range === 1) {
			return "Touch"
		} else if (norm_range < Parser.INCHES_PER_FOOT * 10) {
			return "5 feet"
		} else if (norm_range < Parser.INCHES_PER_FOOT * 25) {
			return "10 feet"
		} else if (norm_range < Parser.INCHES_PER_FOOT * 50) {
			return "25 feet"
		} else if (norm_range < Parser.INCHES_PER_FOOT * 100) {
			return "50 feet"
		} else if (norm_range < Parser.INCHES_PER_FOOT * 500) {
			return "100 feet"
		} else if (norm_range < Parser.INCHES_PER_FOOT * Parser.FEET_PER_MILE) {
			return "500 feet"
		} else if (norm_range < 900000000) {
			return "1 mile"
		} else if (norm_range < 900000001) {
			return "Planetary"
		} else if (norm_range < 900000002) {
			return "Unlimited"
		} else {
			return "Varies"
		}
	} else {
		return null
	}
}

Parser.getFilterDuration = function (object) {
	const duration = object.duration || {type: "special"}
	switch (duration.type) {
		case null: return "Instant";
		case "timed": {
			if (!duration.duration) return "Special";
			switch (duration.duration.unit) {
				case "turn":
				case "round": return "1 Round";

				case "minute": {
					const amt = duration.duration.number || 0;
					if (amt <= 1) return "1 Minute";
					if (amt <= 10) return "10 Minutes";
					if (amt <= 60) return "1 Hour";
					if (amt <= 8 * 60) return "8 Hours";
					return "24+ Hours";
				}

				case "hour": {
					const amt = duration.duration.number || 0;
					if (amt <= 1) return "1 Hour";
					if (amt <= 8) return "8 Hours";
					return "24+ Hours";
				}

				case "week":
				case "day":
				case "year": return "24+ Hours";
				default: return "Special";
			}
		}
		case "unlimited": return "Unlimited";
		case "special":
		default: return "Special";
	}
}

Parser.ATB_ABV_TO_FULL = {
	"str": "Strength",
	"dex": "Dexterity",
	"con": "Constitution",
	"int": "Intelligence",
	"wis": "Wisdom",
	"cha": "Charisma",
};

Parser.ATB_TO_NUM = {
	"Strength": 1,
	"Dexterity": 2,
	"Constitution": 3,
	"Intelligence": 4,
	"Wisdom": 5,
	"Charisma": 6,
	"Free": 7,
}

Parser.attAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.ATB_ABV_TO_FULL, abv);
};

// TODO: Rework for better clarity?
Parser.CONDITION_TO_COLOR = {
	"Blinded": "#525252",
	"Clumsy": "#5c57af",
	"Concealed": "#525252",
	"Confused": "#c9c91e",
	"Controlled": "#ed07bb",
	"Dazzled": "#db8f48",
	"Deafened": "#666464",
	"Doomed": "#9e1414",
	"Drained": "#72aa01",
	"Dying": "#ff0000",
	"Enfeebled": "#42a346",
	"Fascinated": "#fc7b02",
	"Fatigued": "#7913c6",
	"Flat-Footed": "#7f7f7f",
	"Fleeing": "#c9ca18",
	"Frightened": "#c9ca18",
	"Grabbed": "#00e0ac",
	"Immobilized": "#009f7a",
	"Invisible": "#71738c",
	"Paralyzed": "#015642",
	"Persistent Damage": "#ed6904",
	"Petrified": "#2fd62f",
	"Prone": "#00e070",
	"Quickened": "#00d5e0",
	"Restrained": "#007c5f",
	"Sickened": "#008202",
	"Slowed": "#2922a5",
	"Stunned": "#4b43db",
	"Stupefied": "#c94873",
	"Unconscious": "#a0111b",
	"Wounded": "#e81919",

};
// Listing of all the sources

// Prefixes / Suffixes / Templates

SRC_3PP_SUFFIX = " 3pp";

AP_PREFIX = "Adventure Path: ";
AP_PREFIX_SHORT = "AP: ";

FotRP_PREFIX = "Fists of the Ruby Phoenix: "
FotRP_PREFIX_SHORT = "FotRP: "

AV_PREFIX = "Abomination Vaults: "
AV_PREFIX_SHORT = "AV: "

AoE_PREFIX = "Agents of Edgewatch: "
AoE_PREFIX_SHORT = "AoE: "

EC_PREFIX = "Extinction Curse: "
EC_PREFIX_SHORT = "EC: "

AoA_PREFIX = "Age of Ashes: "
AoA_PREFIX_SHORT = "AoA: "

SoT_PREFIX = "Strength of Thousands: "
SoT_PREFIX_SHORT = "SoT: "

OoA_PREFIX = "Outlaws of Alkenstar: "
OoA_PREFIX_SHORT = "OoA: "

BL_PREFIX = "Blood Lords: "
BL_PREFIX_SHORT = "BL: "

GW_PREFIX = "Gatewalkers: "
GW_PREFIX_SHORT = "GW: "

LO_PREFIX = "Lost Omens: ";
LO_PREFIX_SHORT = "LO: ";

Parser.COMPACT_PREFIX_MAP = [
	{re: /Fists of the Ruby Phoenix #(\d): /, replaceWith: "FotRP$1: "},
	{re: /Abomination Vaults #(\d): /, replaceWith: "AV$1: "},
	{re: /Agents of Edgewatch #(\d): /, replaceWith: "AoE$1: "},
	{re: /Extinction Curse #(\d): /, replaceWith: "EC$1: "},
	{re: /Age of Ashes #(\d): /, replaceWith: "AoA$1: "},
	{re: /Strength of Thousands #(\d): /, replaceWith: "SoT$1: "},
	{re: /Outlaws of Alkenstar #(\d): /, replaceWith: "OoA$1: "},
	{re: /Quest for the Frozen Flame #(\d): /, replaceWith: "QFF$1: "},
	{re: /Blood Lords #(\d): /, replaceWith: "BL$1: "},
	{re: /Gatewalkers #(\d): /, replaceWith: "GW$1: "},
];

Parser.SOURCE_PREFIX_TO_SHORT = {};
Parser.SOURCE_PREFIX_TO_SHORT[LO_PREFIX] = LO_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AP_PREFIX] = AP_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[FotRP_PREFIX] = FotRP_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AV_PREFIX] = AV_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AoE_PREFIX] = AoE_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[EC_PREFIX] = EC_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AoA_PREFIX] = AoA_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[SoT_PREFIX] = SoT_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[OoA_PREFIX] = OoA_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[BL_PREFIX] = BL_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[GW_PREFIX] = GW_PREFIX_SHORT;

// TODO: This should probably be done differently.
const sourceJSON = DataUtil.loadJSON(`${Renderer.get().baseUrl}data/source.json`);

// Turn JSON to Full Title
Parser.SOURCE_JSON_TO_FULL = {};

// Turn JSON to Abbreviations
Parser.SOURCE_JSON_TO_ABV = {};

// Turn JSON to Date of Release
Parser.SOURCE_JSON_TO_DATE = {};

// Turn JSON to Paizo Store
Parser.SOURCE_JSON_TO_STORE = {};

// Turn Page to Source
Parser.TAG_TO_DEFAULT_SOURCE = {};

// Add sources to above legacy (?) objects
sourceJSON.source.forEach((source) => {
	Parser[`SRC_${source.source}`] = source.source;
	Parser.SOURCE_JSON_TO_FULL[`SRC_${source.source}`] = source.name;
	Parser.SOURCE_JSON_TO_ABV[`SRC_${source.source}`] = source.source;
	Parser.SOURCE_JSON_TO_DATE[`SRC_${source.source}`] = source.date;
	Parser.SOURCE_JSON_TO_STORE[`SRC_${source.source}`] = source.store;
	source?.defaultSource.forEach((defaultSource) => {
		Parser.TAG_TO_DEFAULT_SOURCE[defaultSource] = `SRC_${source.source}`;
	});
});

Parser.SOURCES_ADVENTURES = new Set([
	SRC_AOA0,
	SRC_AOA1,
	SRC_AOA2,
	SRC_AOA3,
	SRC_AOA4,
	SRC_AOA5,
	SRC_AOA6,
	SRC_EC0,
	SRC_EC1,
	SRC_EC2,
	SRC_EC3,
	SRC_EC4,
	SRC_EC5,
	SRC_EC6,
	SRC_AOE0,
	SRC_AOE1,
	SRC_AOE2,
	SRC_AOE3,
	SRC_AOE4,
	SRC_AOE5,
	SRC_AOE6,
	SRC_AV0,
	SRC_AV1,
	SRC_AV2,
	SRC_AV3,
	SRC_FRP0,
	SRC_FRP1,
	SRC_FRP2,
	SRC_FRP3,
	SRC_SOT0,
	SRC_SOT1,
	SRC_SOT2,
	SRC_SOT3,
	SRC_SOT4,
	SRC_SOT5,
	SRC_SOT6,
	SRC_SLI,
	SRC_NGD,
	SRC_LTIBA,
	SRC_FOP,
	SRC_TIO,
	SRC_OoA0,
	SRC_OoA1,
	SRC_OoA2,
	SRC_OoA3,
	SRC_QFF0,
	SRC_QFF1,
	SRC_QFF2,
	SRC_QFF3,
	SRC_BL0,
	SRC_BL1,
	SRC_BL2,
	SRC_BL3,
	SRC_BL4,
	SRC_BL5,
	SRC_BL6,
	SRC_GW0,
	SRC_GW1,
	SRC_GW2,
	SRC_GW3,
]);
Parser.SOURCES_CORE_SUPPLEMENTS = new Set(Object.keys(Parser.SOURCE_JSON_TO_FULL).filter(it => !Parser.SOURCES_ADVENTURES.has(it)));
Parser.SOURCES_VANILLA = new Set([SRC_CRB, SRC_B1, SRC_GMG, SRC_APG, SRC_SOM, SRC_GNG]);

Parser.SOURCES_AVAILABLE_DOCS_BOOK = {};
[
	SRC_CRB,
	SRC_APG,
	SRC_B1,
	SRC_B2,
	SRC_B3,
	SRC_GMG,
	SRC_SOM,
	SRC_LOCG,
	SRC_LOGM,
	SRC_LOAG,
	SRC_LOACLO,
	SRC_AAWS,
	SRC_GNG,
	SRC_LOTGB,
	SRC_LOMM,
	SRC_BotD,
	SRC_LOTG,
	SRC_LOKL,
	SRC_PFUM,
	SRC_DA,
	SRC_LOIL,
].forEach(src => {
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src] = src;
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src.toLowerCase()] = src;
});
Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE = {};
[
	SRC_AOA0,
	SRC_AOA1,
	SRC_AOA2,
	SRC_AOA3,
	SRC_AOA4,
	SRC_AOA5,
	SRC_AOA6,
	SRC_EC0,
	SRC_EC1,
	SRC_EC2,
	SRC_EC3,
	SRC_EC4,
	SRC_EC5,
	SRC_EC6,
	SRC_AOE0,
	SRC_AOE1,
	SRC_AOE2,
	SRC_AOE3,
	SRC_AOE4,
	SRC_AOE5,
	SRC_AOE6,
	SRC_AV0,
	SRC_AV1,
	SRC_AV2,
	SRC_AV3,
	SRC_FRP0,
	SRC_FRP1,
	SRC_FRP2,
	SRC_FRP3,
	SRC_SOT0,
	SRC_SOT1,
	SRC_SOT2,
	SRC_SOT3,
	SRC_SOT4,
	SRC_SOT5,
	SRC_SOT6,
	SRC_SLI,
	SRC_NGD,
	SRC_FOP,
	SRC_TIO,
	SRC_LTIBA,
	SRC_BL0,
	SRC_BL1,
	SRC_BL2,
	SRC_BL3,
	SRC_BL4,
	SRC_BL5,
	SRC_BL6,
	SRC_GW0,
	SRC_GW1,
	SRC_GW2,
	SRC_GW3,
].forEach(src => {
	Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src] = src;
	Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src.toLowerCase()] = src;
});

Parser.getTagSource = function (tag, source) {
	if (source && source.trim()) return source;
	tag = tag.trim();
	if (tag.startsWith("@")) tag = tag.slice(1);

	if (!Parser.TAG_TO_DEFAULT_SOURCE[tag]) throw new Error(`Unhandled tag source "${tag}"`);
	return Parser.TAG_TO_DEFAULT_SOURCE[tag];
};

Parser.getTraitName = function (trait) {
	// TODO: This implementation is not perfect, but for now it will do
	const regex = new RegExp(`\\s(?:\\d|[A-Za-z]$|\\(|d\\d|[A-Z],|[a-z], [a-z], or [a-z]|${Object.values(Parser.DMGTYPE_JSON_TO_FULL).join("|")}|to \\w+)(.+|$)`);
	const name = trait ? trait.replace(/\|.+/, "").replace(regex, "") : "";
	if (name === name.toUpperCase()) return name;
	else if (name.length <= 2) return name.toUpperCase(); // Alignment traits: CG, LE, ...
	else return name.toTitleCase();
}

Parser.rarityToNumber = function (r) {
	if (isNaN(r)) {
		switch (r.toLowerCase()) {
			case "common": return 0;
			case "uncommon": return 1;
			case "rare": return 2;
			case "unique": return 3;
			default: return 69;
		}
	} else return r
}

Parser.dmgTypeToFull = function (dmg) {
	return Parser._parse_aToB(Parser.DMGTYPE_JSON_TO_FULL, dmg)
}
Parser.DMGTYPE_JSON_TO_FULL = {
	"A": "acid",
	"B": "bludgeoning",
	"C": "cold",
	"D": "bleed",
	"E": "electricity",
	"F": "fire",
	"H": "chaotic",
	"I": "poison",
	"L": "lawful",
	"M": "mental",
	"Mod": "modular",
	"N": "sonic",
	"O": "force",
	"P": "piercing",
	"R": "precision",
	"S": "slashing",
	"+": "positive",
	"-": "negative",
};

Parser.levelToDC = function (level, isSpell, traits) {
	if (isNaN(level)) return "?";
	let DC = 0;
	if (isSpell.toLowerCase() === "focus" || isSpell.toLowerCase() === "spell" || isSpell === true) level = (level * 2) - 1;
	if (level < 21) DC = 14 + Number(level) + Math.floor(level / 3);
	else DC = 40 + Number((level - 20) * 2);

	// The Difficulty is negative for easier adjustments and positive for harder adjustments. 0 is default.
	if (traits && traits.length) {
		const difficulties = typeof traits === "string" ? traits.split(" ") : traits.filter(it => typeof it === "string");
		difficulties.forEach(difficulty => {
			switch (Parser.rarityToNumber(difficulty)) {
				// Incredibly Easy
				case -3:
					DC = DC - 10;
					break;
				// Very Easy
				case -2:
					DC = DC - 5
					break;
				// Easy
				case -1:
					DC = DC - 2
					break;
				// Hard (Uncommon)
				case 1:
					DC = DC + 2
					break;
				// Very Hard (Rare)
				case 2:
					DC = DC + 5
					break;
				// Incredibly Hard (Unique)
				case 3:
					DC = DC + 10
					break;
				default: break;
			}
		});
	}

	return `${DC}${level < 0 || level > 25 ? `*` : ""}`
};

Parser.typeToSkill = function (type) {
	if (typeof type === "string" || type instanceof String) { type = type.split() }

	let skill = new Set();

	for (let i = 0; i < type.length; i++) {
		let typeNum = type[i];
		switch (typeNum.toLowerCase()) {
			// Creature Types
			case "aberration": skill.add("{@skill Occultism}"); break;
			case "animal": skill.add("{@skill Nature}"); break;
			case "astral": skill.add("{@skill Occultism}"); break;
			case "beast": skill.add("{@skill Arcana}"); skill.add("{@skill Nature}"); break;
			case "celestial": skill.add("{@skill Religion}"); break;
			case "construct": skill.add("{@skill Arcana}"); skill.add("{@skill Crafting}"); break;
			case "dragon": skill.add("{@skill Arcana}"); break;
			case "elemental": skill.add("{@skill Arcana}"); skill.add("{@skill Nature}"); break;
			case "ethereal": skill.add("{@skill Occultism}"); break;
			case "fey": skill.add("{@skill Nature}"); break;
			case "fiend": skill.add("{@skill Religion}"); break;
			case "fungus": skill.add("{@skill Nature}"); break;
			case "humanoid": skill.add("{@skill Society}"); break;
			case "monitor": skill.add("{@skill Religion}"); break;
			case "ooze": skill.add("{@skill Occultism}"); break;
			case "spirit": skill.add("{@skill Occultism}"); break;
			case "plant": skill.add("{@skill Nature}"); break;
			case "undead": skill.add("{@skill Religion}"); break;
			// Spellcasting Traditions
			case "arcane": skill.add("{@skill Arcana}"); break;
			case "divine": skill.add("{@skill Religion}"); break;
			case "occult": skill.add("{@skill Occultism}"); break;
			case "primal": skill.add("{@skill Nature}"); break;
			case "magical": skill.add("{@skill Arcana}"); skill.add("{@skill Religion}"); skill.add("{@skill Occultism}"); skill.add("{@skill Nature}"); break;
			// Items
			case "alchemical":
			case "item": skill.add("{@skill Crafting}"); break;
			default: break;
		}
	}
	return [...skill].join(" or ")
};

Parser.getKeyByValue = function (object, value) {
	return Object.keys(object).filter(function (key) {
		return object[key] === value;
	});
}
