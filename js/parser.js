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
	if (price.note != null) offset = 0.1;
	return mult * amount + offset
};
Parser.priceToFull = function (price) {
	if (price == null) return "\u2014";
	if (typeof price === "object") {
		if (price.amount == null || price.coin == null) return "\u2014";
		return `${Parser._addCommas(price.amount)} ${price.coin}${price.note ? ` ${price.note}` : ""}`
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
Parser.savingThrowAbvToFull = function (abv) {
	switch (abv) {
		case "Fort":
		case "fort": return "Fortitude";
		case "Ref":
		case "ref": return "Reflex";
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

	const skillsEntries = [];
	if (initProf.skills.u) initProf.skills.u.forEach(it => skillsEntries.push(`{@indentSubsequent Untrained in ${it}}`));
	if (initProf.skills.t) initProf.skills.t.forEach(it => skillsEntries.push(`{@indentSubsequent Trained in ${it}}`));
	if (initProf.skills.e) initProf.skills.e.forEach(it => skillsEntries.push(`{@indentSubsequent Expert in ${it}}`));
	if (initProf.skills.m) initProf.skills.m.forEach(it => skillsEntries.push(`{@indentSubsequent Master in ${it}}`));
	if (initProf.skills.l) initProf.skills.l.forEach(it => skillsEntries.push(`{@indentSubsequent Legendary in ${it}}`));
	if (initProf.skills.add) skillsEntries.push(`{@indentSubsequent Trained in a number of additional skills equal to ${initProf.skills.add} plus your Intelligence modifier}`);
	out.push({name: "SKILLS", entries: skillsEntries});

	const attacksEntries = [];
	if (initProf.attacks.u) initProf.attacks.u.forEach(it => attacksEntries.push(`Untrained in ${it}`));
	if (initProf.attacks.t) initProf.attacks.t.forEach(it => attacksEntries.push(`Trained in ${it}`));
	if (initProf.attacks.e) initProf.attacks.e.forEach(it => attacksEntries.push(`Expert in ${it}`));
	if (initProf.attacks.m) initProf.attacks.m.forEach(it => attacksEntries.push(`Master in ${it}`));
	if (initProf.attacks.l) initProf.attacks.l.forEach(it => attacksEntries.push(`Legendary in ${it}`));
	out.push({name: "ATTACKS", entries: attacksEntries});

	const defensesEntries = [];
	if (initProf.defenses.u) initProf.defenses.u.forEach(it => defensesEntries.push(`Untrained in ${it}`));
	if (initProf.defenses.t) initProf.defenses.t.forEach(it => defensesEntries.push(`Trained in ${it}`));
	if (initProf.defenses.e) initProf.defenses.e.forEach(it => defensesEntries.push(`Expert in ${it}`));
	if (initProf.defenses.m) initProf.defenses.m.forEach(it => defensesEntries.push(`Master in ${it}`));
	if (initProf.defenses.l) initProf.defenses.l.forEach(it => defensesEntries.push(`Legendary in ${it}`));
	out.push({name: "DEFENSES", entries: defensesEntries});

	if (initProf.classDc) out.push({name: "CLASS DC", entries: [initProf.classDc.entry]});
	if (initProf.spells) {
		const spellsEntries = [];
		if (initProf.spells.u) initProf.spells.u.forEach(it => spellsEntries.push(`Untrained in ${it}`));
		if (initProf.spells.t) initProf.spells.t.forEach(it => spellsEntries.push(`Trained in ${it}`));
		if (initProf.spells.e) initProf.spells.e.forEach(it => spellsEntries.push(`Expert in ${it}`));
		if (initProf.spells.m) initProf.spells.m.forEach(it => spellsEntries.push(`Master in ${it}`));
		if (initProf.spells.l) initProf.spells.l.forEach(it => spellsEntries.push(`Legendary in ${it}`));
		out.push({name: "SPELLS", entries: spellsEntries});
	}
	return out
}

SKL_ABV_ABJ = "A";
SKL_ABV_EVO = "V";
SKL_ABV_ENC = "E";
SKL_ABV_ILL = "I";
SKL_ABV_DIV = "D";
SKL_ABV_NEC = "N";
SKL_ABV_TRA = "T";
SKL_ABV_CON = "C";
Parser.SKL_ABVS = [
	SKL_ABV_ABJ,
	SKL_ABV_EVO,
	SKL_ABV_ENC,
	SKL_ABV_ILL,
	SKL_ABV_DIV,
	SKL_ABV_NEC,
	SKL_ABV_TRA,
	SKL_ABV_CON,
];
SKL_ABJ = "Abjuration";
SKL_EVO = "Evocation";
SKL_ENC = "Enchantment";
SKL_ILL = "Illusion";
SKL_DIV = "Divination";
SKL_NEC = "Necromancy";
SKL_TRA = "Transmutation";
SKL_CON = "Conjuration";
Parser.SP_SCHOOLS = [SKL_ABJ, SKL_EVO, SKL_ENC, SKL_ILL, SKL_DIV, SKL_NEC, SKL_TRA, SKL_CON];
Parser.SP_SCHOOL_FULL_TO_ABV = {};
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_ABJ] = SKL_ABV_ABJ;
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_EVO] = SKL_ABV_EVO;
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_ENC] = SKL_ABV_ENC;
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_ILL] = SKL_ABV_ILL;
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_DIV] = SKL_ABV_DIV;
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_NEC] = SKL_ABV_NEC;
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_TRA] = SKL_ABV_TRA;
Parser.SP_SCHOOL_FULL_TO_ABV[SKL_CON] = SKL_ABV_CON;
Parser.SP_SCHOOL_ABV_TO_FULL = {};
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ABJ] = SKL_ABJ;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_EVO] = SKL_EVO;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ENC] = SKL_ENC;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_ILL] = SKL_ILL;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_DIV] = SKL_DIV;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_NEC] = SKL_NEC;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_TRA] = SKL_TRA;
Parser.SP_SCHOOL_ABV_TO_FULL[SKL_ABV_CON] = SKL_CON;
Parser.SP_SCHOOL_ABV_TO_SHORT = {};
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ABJ] = "Abj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_EVO] = "Evoc.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ENC] = "Ench.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_ILL] = "Illu.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_DIV] = "Divin.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_NEC] = "Necro.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_TRA] = "Trans.";
Parser.SP_SCHOOL_ABV_TO_SHORT[SKL_ABV_CON] = "Conj.";
Parser.spSchoolAbvToFull = function (school) {
	if (school == null) return `N/A`
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_FULL, school);
	if (Parser.SP_SCHOOL_ABV_TO_FULL[school]) return out;
	if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.spellSchools && BrewUtil.homebrewMeta.spellSchools[school]) return BrewUtil.homebrewMeta.spellSchools[school].full;
	return out;
};
Parser.spSchoolAbvToShort = function (school) {
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_SHORT, school);
	if (Parser.SP_SCHOOL_ABV_TO_SHORT[school]) return out;
	if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.spellSchools && BrewUtil.homebrewMeta.spellSchools[school]) return BrewUtil.homebrewMeta.spellSchools[school].short;
	return out;
};
Parser.spSchoolAbvToStyle = function (school) { // For homebrew
	const rawColor = MiscUtil.get(BrewUtil, "homebrewMeta", "spellSchools", school, "color");
	if (!rawColor || !rawColor.trim()) return "";
	const validColor = BrewUtil.getValidColor(rawColor);
	if (validColor.length) return `style="color: #${validColor}"`;
	return "";
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

Parser.alignAbvToFull = function (align) {
	switch (String(align).toLowerCase()) {
		case null:
			return "";
		case "any":
			return "Any";
		case "lg":
			return "Lawful Good";
		case "ng":
			return "Neutral Good";
		case "cg":
			return "Chaotic Good";
		case "ln":
			return "Lawful Neutral";
		case "n":
			return "Neutral";
		case "cn":
			return "Chaotic Neutral";
		case "le":
			return "Lawful Evil";
		case "ne":
			return "Neutral Evil";
		case "ce":
			return "Chaotic Evil";
		case "all":
			return "All";
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
UNT_MILES = "miles";
Parser.INCHES_PER_FOOT = 12;
Parser.FEET_PER_MILE = 5280;

RNG_SPECIAL = "special";
RNG_POINT = "point";
RNG_LINE = "line";
RNG_CUBE = "cube";
RNG_CONE = "cone";
RNG_RADIUS = "radius";
RNG_SPHERE = "sphere";
RNG_HEMISPHERE = "hemisphere";
RNG_CYLINDER = "cylinder"; // homebrew only
RNG_SELF = "self";
RNG_SIGHT = "sight";
RNG_UNLIMITED = "unlimited";
RNG_UNLIMITED_SAME_PLANE = "planetary";
RNG_TOUCH = "touch";

// TODO: Handle range/area types: emanation, cone etc?
Parser.getNormalisedRange = function (range) {
	if (!MiscUtil.isObject(range)) return 0;
	let multiplier = 1;
	let distance = 0;
	let offset = 0;

	const dist = MiscUtil.merge({type: null, amount: 0}, range.distance)
	switch (dist.type) {
		case null: distance = 0; break;
		case UNT_FEET: multiplier = Parser.INCHES_PER_FOOT; distance = dist.amount; break;
		case UNT_MILES: multiplier = Parser.INCHES_PER_FOOT * Parser.FEET_PER_MILE; distance = dist.amount; break;
		case RNG_TOUCH: distance = 1; break;
		case RNG_UNLIMITED_SAME_PLANE: distance = 900000000; break;
		case RNG_UNLIMITED: distance = 900000001; break;
		case "unknown": distance = 900000002; break;
		default: {
			// it's homebrew?
			const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "spellDistanceUnits", dist.type);
			if (fromBrew) {
				const ftPerUnit = fromBrew.feetPerUnit;
				if (ftPerUnit != null) {
					multiplier = Parser.INCHES_PER_FOOT * ftPerUnit;
					distance = dist.amount;
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
	if (fRan.type !== null) {
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
SRC_CRB = "CRB";
SRC_APG = "APG";
SRC_BST = "Bst";
SRC_BST2 = "Bst2";
SRC_BST3 = "Bst3";
SRC_GMG = "GMG";
SRC_SOM = "SoM";
SRC_LOWG = "LOWG";
SRC_LOCG = "LOCG";
SRC_LOGM = "LOGM";
SRC_LOGMWS = "LOGMWS";
SRC_LOL = "LOL";
SRC_LOPSG = "LOPSG";
SRC_LOAG = "LOAG";
SRC_LOME = "LOME";
SRC_LOACLO = "LOACLO";
SRC_AAWS = "AAWS";
SRC_GNG = "G&G";
SRC_LOTGB = "LOTGB"
SRC_AOA0 = "AoA0";
SRC_AOA1 = "AoA1";
SRC_AOA2 = "AoA2";
SRC_AOA3 = "AoA3";
SRC_AOA4 = "AoA4";
SRC_AOA5 = "AoA5";
SRC_AOA6 = "AoA6";
SRC_EC0 = "EC0";
SRC_EC1 = "EC1";
SRC_EC2 = "EC2";
SRC_EC3 = "EC3";
SRC_EC4 = "EC4";
SRC_EC5 = "EC5";
SRC_EC6 = "EC6";
SRC_AOE0 = "AoE0";
SRC_AOE1 = "AoE1";
SRC_AOE2 = "AoE2";
SRC_AOE3 = "AoE3";
SRC_AOE4 = "AoE4";
SRC_AOE5 = "AoE5";
SRC_AOE6 = "AoE6";
SRC_AV0 = "AV0";
SRC_AV1 = "AV1";
SRC_AV2 = "AV2";
SRC_AV3 = "AV3";
SRC_FRP0 = "FRP0";
SRC_FRP1 = "FRP1";
SRC_FRP2 = "FRP2";
SRC_FRP3 = "FRP3";
SRC_SOT0 = "SoT0";
SRC_SOT1 = "SoT1";
SRC_SOT2 = "SoT2";
SRC_SOT3 = "SoT3";
SRC_SOT4 = "SoT4";
SRC_SOT5 = "SoT5";
SRC_SOT6 = "SoT6";
SRC_SLI = "Sli";
SRC_NGD = "NGD";
SRC_FOP = "FoP";
SRC_LTIBA = "LTiBA";
SRC_TIO = "TiO";

SRC_3PP_SUFFIX = " 3pp";

// region Adventure Paths

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

// endregion

LO_PREFIX = "Lost Omens: ";
LO_PREFIX_SHORT = "LO: ";

Parser.SOURCE_PREFIX_TO_SHORT = {};
Parser.SOURCE_PREFIX_TO_SHORT[LO_PREFIX] = LO_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AP_PREFIX] = AP_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[FotRP_PREFIX] = FotRP_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AV_PREFIX] = AV_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AoE_PREFIX] = AoE_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[EC_PREFIX] = EC_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[AoA_PREFIX] = AoA_PREFIX_SHORT;
Parser.SOURCE_PREFIX_TO_SHORT[SoT_PREFIX] = SoT_PREFIX_SHORT;
// Turn JSON to Full Title
Parser.SOURCE_JSON_TO_FULL = {};
Parser.SOURCE_JSON_TO_FULL[SRC_CRB] = "Core Rulebook";
Parser.SOURCE_JSON_TO_FULL[SRC_BST] = "Bestiary";
Parser.SOURCE_JSON_TO_FULL[SRC_GMG] = "Gamemastery Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_BST2] = "Bestiary 2";
Parser.SOURCE_JSON_TO_FULL[SRC_APG] = "Advanced Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_BST3] = "Bestiary 3";
Parser.SOURCE_JSON_TO_FULL[SRC_SOM] = "Secrets of Magic";
Parser.SOURCE_JSON_TO_FULL[SRC_LOWG] = "Lost Omens: World Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_LOCG] = "Lost Omens: Character Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_LOGM] = "Lost Omens: Gods & Magic";
Parser.SOURCE_JSON_TO_FULL[SRC_LOGMWS] = "Lost Omens: Gods & Magic Web Supplement";
Parser.SOURCE_JSON_TO_FULL[SRC_LOL] = "Lost Omens: Legends";
Parser.SOURCE_JSON_TO_FULL[SRC_LOPSG] = "Lost Omens: Pathfinder Society Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_LOAG] = "Lost Omens: Ancestry Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_LOME] = "Lost Omens: The Mwangi Expanse";
Parser.SOURCE_JSON_TO_FULL[SRC_LOACLO] = "Lost Omens: Absalom, City of Lost Omens";
Parser.SOURCE_JSON_TO_FULL[SRC_AAWS] = "Azarketi Ancestry Web Supplement";
Parser.SOURCE_JSON_TO_FULL[SRC_GNG] = "Guns & Gears";
Parser.SOURCE_JSON_TO_FULL[SRC_LOTGB] = "Lost Omens: The Grand Bazaar";

// Adventure Paths
Parser.SOURCE_JSON_TO_FULL[SRC_AOA0] = "Age of Ashes Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_AOA1] = "Age of Ashes: Hellknight Hill";
Parser.SOURCE_JSON_TO_FULL[SRC_AOA2] = "Age of Ashes: Cult of Cinders";
Parser.SOURCE_JSON_TO_FULL[SRC_AOA3] = "Age of Ashes: Tomorrow Must Burn";
Parser.SOURCE_JSON_TO_FULL[SRC_AOA4] = "Age of Ashes: Fires of the Haunted City";
Parser.SOURCE_JSON_TO_FULL[SRC_AOA5] = "Age of Ashes: Against the Scarlet Triad";
Parser.SOURCE_JSON_TO_FULL[SRC_AOA6] = "Age of Ashes: Broken Promises";

Parser.SOURCE_JSON_TO_FULL[SRC_EC0] = "Extinction Curse Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_EC1] = "Extinction Curse: The Show Must Go On";
Parser.SOURCE_JSON_TO_FULL[SRC_EC2] = "Extinction Curse: Legacy of the Lost God";
Parser.SOURCE_JSON_TO_FULL[SRC_EC3] = "Extinction Curse: Life's Long Shadows";
Parser.SOURCE_JSON_TO_FULL[SRC_EC4] = "Extinction Curse: Siege of the Dinosaurs";
Parser.SOURCE_JSON_TO_FULL[SRC_EC5] = "Extinction Curse: Lord of the Black Sands";
Parser.SOURCE_JSON_TO_FULL[SRC_EC6] = "Extinction Curse: The Apocalypse Prophet";

Parser.SOURCE_JSON_TO_FULL[SRC_AOE0] = "Agents of Edgewatch Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_AOE1] = "Agents of Edgewatch: Devil at the Dreaming Palace";
Parser.SOURCE_JSON_TO_FULL[SRC_AOE2] = "Agents of Edgewatch: Sixty Feet Under";
Parser.SOURCE_JSON_TO_FULL[SRC_AOE3] = "Agents of Edgewatch: All or Nothing";
Parser.SOURCE_JSON_TO_FULL[SRC_AOE4] = "Agents of Edgewatch: Assault on Hunting Lodge Seven";
Parser.SOURCE_JSON_TO_FULL[SRC_AOE5] = "Agents of Edgewatch: Belly of the Black Whale";
Parser.SOURCE_JSON_TO_FULL[SRC_AOE6] = "Agents of Edgewatch: Ruins of the Radiant Siege";

Parser.SOURCE_JSON_TO_FULL[SRC_AV0] = "Abomination Vaults Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_AV1] = "Abomination Vaults: Ruins of Gauntlight";
Parser.SOURCE_JSON_TO_FULL[SRC_AV2] = "Abomination Vaults: Hands of the Devil";
Parser.SOURCE_JSON_TO_FULL[SRC_AV3] = "Abomination Vaults: Eyes of Empty Death";

Parser.SOURCE_JSON_TO_FULL[SRC_FRP0] = "Fists of the Ruby Phoenix Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_FRP1] = "Fists of the Ruby Phoenix: Despair on Danger Island";
Parser.SOURCE_JSON_TO_FULL[SRC_FRP2] = "Fists of the Ruby Phoenix: Ready? Fight!";
Parser.SOURCE_JSON_TO_FULL[SRC_FRP3] = "Fists of the Ruby Phoenix: King of the Mountain";

Parser.SOURCE_JSON_TO_FULL[SRC_SOT0] = "Strength of Thousands Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_SOT1] = "Strength of Thousands: Kindled Magic";
Parser.SOURCE_JSON_TO_FULL[SRC_SOT2] = "Strength of Thousands: Spoken on the Song Wind";
Parser.SOURCE_JSON_TO_FULL[SRC_SOT3] = "Strength of Thousands: Hurricane's Howl";
Parser.SOURCE_JSON_TO_FULL[SRC_SOT4] = "Strength of Thousands: Secrets of the Temple-City";
Parser.SOURCE_JSON_TO_FULL[SRC_SOT5] = "Strength of Thousands: Doorway to the Red Star";
Parser.SOURCE_JSON_TO_FULL[SRC_SOT6] = "Strength of Thousands: Shadows of the Ancients";

Parser.SOURCE_JSON_TO_FULL[SRC_SLI] = "The Slithering";
Parser.SOURCE_JSON_TO_FULL[SRC_NGD] = "Night of the Gray Death";
Parser.SOURCE_JSON_TO_FULL[SRC_FOP] = "The Fall of Plaguestone";
Parser.SOURCE_JSON_TO_FULL[SRC_TIO] = "Troubles in Otari";
Parser.SOURCE_JSON_TO_FULL[SRC_LTIBA] = "Little Trouble in Big Absalom";
// Turn JSON to Abbreviations
Parser.SOURCE_JSON_TO_ABV = {};
Parser.SOURCE_JSON_TO_ABV[SRC_CRB] = "CRB";
Parser.SOURCE_JSON_TO_ABV[SRC_BST] = "Bst";
Parser.SOURCE_JSON_TO_ABV[SRC_GMG] = "GMG";
Parser.SOURCE_JSON_TO_ABV[SRC_BST2] = "Bst2";
Parser.SOURCE_JSON_TO_ABV[SRC_APG] = "APG";
Parser.SOURCE_JSON_TO_ABV[SRC_BST3] = "Bst3";
Parser.SOURCE_JSON_TO_ABV[SRC_SOM] = "SoM";
Parser.SOURCE_JSON_TO_ABV[SRC_LOWG] = "LOWG";
Parser.SOURCE_JSON_TO_ABV[SRC_LOCG] = "LOCG";
Parser.SOURCE_JSON_TO_ABV[SRC_LOGM] = "LOGM";
Parser.SOURCE_JSON_TO_ABV[SRC_LOGMWS] = "LOGMWS";
Parser.SOURCE_JSON_TO_ABV[SRC_LOL] = "LOL";
Parser.SOURCE_JSON_TO_ABV[SRC_LOPSG] = "LOPSG";
Parser.SOURCE_JSON_TO_ABV[SRC_LOAG] = "LOAG";
Parser.SOURCE_JSON_TO_ABV[SRC_LOME] = "LOME";
Parser.SOURCE_JSON_TO_ABV[SRC_LOACLO] = "LOACLO";
Parser.SOURCE_JSON_TO_ABV[SRC_AAWS] = "AAWS";
Parser.SOURCE_JSON_TO_ABV[SRC_GNG] = "G&G";
Parser.SOURCE_JSON_TO_ABV[SRC_LOTGB] = "LOTGB";

// Adventure Paths
Parser.SOURCE_JSON_TO_ABV[SRC_AOA0] = "AoA0";
Parser.SOURCE_JSON_TO_ABV[SRC_AOA1] = "AoA1";
Parser.SOURCE_JSON_TO_ABV[SRC_AOA2] = "AoA2";
Parser.SOURCE_JSON_TO_ABV[SRC_AOA3] = "AoA3";
Parser.SOURCE_JSON_TO_ABV[SRC_AOA4] = "AoA4";
Parser.SOURCE_JSON_TO_ABV[SRC_AOA5] = "AoA5";
Parser.SOURCE_JSON_TO_ABV[SRC_AOA6] = "AoA6";

Parser.SOURCE_JSON_TO_ABV[SRC_EC0] = "EC0";
Parser.SOURCE_JSON_TO_ABV[SRC_EC1] = "EC1";
Parser.SOURCE_JSON_TO_ABV[SRC_EC2] = "EC2";
Parser.SOURCE_JSON_TO_ABV[SRC_EC3] = "EC3";
Parser.SOURCE_JSON_TO_ABV[SRC_EC4] = "EC4";
Parser.SOURCE_JSON_TO_ABV[SRC_EC5] = "EC5";
Parser.SOURCE_JSON_TO_ABV[SRC_EC6] = "EC6";

Parser.SOURCE_JSON_TO_ABV[SRC_AOE0] = "AoE0";
Parser.SOURCE_JSON_TO_ABV[SRC_AOE1] = "AoE1";
Parser.SOURCE_JSON_TO_ABV[SRC_AOE2] = "AoE2";
Parser.SOURCE_JSON_TO_ABV[SRC_AOE3] = "AoE3";
Parser.SOURCE_JSON_TO_ABV[SRC_AOE4] = "AoE4";
Parser.SOURCE_JSON_TO_ABV[SRC_AOE5] = "AoE5";
Parser.SOURCE_JSON_TO_ABV[SRC_AOE6] = "AoE6";

Parser.SOURCE_JSON_TO_ABV[SRC_AV0] = "AV0";
Parser.SOURCE_JSON_TO_ABV[SRC_AV1] = "AV1";
Parser.SOURCE_JSON_TO_ABV[SRC_AV2] = "AV2";
Parser.SOURCE_JSON_TO_ABV[SRC_AV3] = "AV3";

Parser.SOURCE_JSON_TO_ABV[SRC_FRP0] = "FRP0";
Parser.SOURCE_JSON_TO_ABV[SRC_FRP1] = "FRP1";
Parser.SOURCE_JSON_TO_ABV[SRC_FRP2] = "FRP2";
Parser.SOURCE_JSON_TO_ABV[SRC_FRP3] = "FRP3";

Parser.SOURCE_JSON_TO_ABV[SRC_SOT0] = "SoT0";
Parser.SOURCE_JSON_TO_ABV[SRC_SOT1] = "SoT1";
Parser.SOURCE_JSON_TO_ABV[SRC_SOT2] = "SoT2";
Parser.SOURCE_JSON_TO_ABV[SRC_SOT3] = "SoT3";
Parser.SOURCE_JSON_TO_ABV[SRC_SOT4] = "SoT4";
Parser.SOURCE_JSON_TO_ABV[SRC_SOT5] = "SoT5";
Parser.SOURCE_JSON_TO_ABV[SRC_SOT6] = "SoT6";

Parser.SOURCE_JSON_TO_ABV[SRC_SLI] = "Sli";
Parser.SOURCE_JSON_TO_ABV[SRC_NGD] = "NGD";
Parser.SOURCE_JSON_TO_ABV[SRC_FOP] = "FoP";
Parser.SOURCE_JSON_TO_ABV[SRC_LTIBA] = "LTiBA";
Parser.SOURCE_JSON_TO_ABV[SRC_TIO] = "TiO";
// Turn JSON to Date of Release
Parser.SOURCE_JSON_TO_DATE = {};
Parser.SOURCE_JSON_TO_DATE[SRC_CRB] = "2019-08-01";
Parser.SOURCE_JSON_TO_DATE[SRC_BST] = "2019-08-01";
Parser.SOURCE_JSON_TO_DATE[SRC_LOWG] = "2019-08-28";
Parser.SOURCE_JSON_TO_DATE[SRC_LOCG] = "2019-10-16";
Parser.SOURCE_JSON_TO_DATE[SRC_LOGM] = "2020-01-29";
Parser.SOURCE_JSON_TO_DATE[SRC_LOGMWS] = "2020-01-29";
Parser.SOURCE_JSON_TO_DATE[SRC_GMG] = "2020-02-26";
Parser.SOURCE_JSON_TO_DATE[SRC_EC3] = "2020-03-25";
Parser.SOURCE_JSON_TO_DATE[SRC_BST2] = "2020-05-27";
Parser.SOURCE_JSON_TO_DATE[SRC_LOL] = "2020-07-30";
Parser.SOURCE_JSON_TO_DATE[SRC_APG] = "2020-08-30";
Parser.SOURCE_JSON_TO_DATE[SRC_LOPSG] = "2020-10-14";
Parser.SOURCE_JSON_TO_DATE[SRC_LOAG] = "2021-02-24";
Parser.SOURCE_JSON_TO_DATE[SRC_AAWS] = "2021-02-24";
Parser.SOURCE_JSON_TO_DATE[SRC_BST3] = "2021-03-31";
Parser.SOURCE_JSON_TO_DATE[SRC_BST3] = "2021-07-07";
Parser.SOURCE_JSON_TO_DATE[SRC_SOM] = "2021-08-25";
Parser.SOURCE_JSON_TO_DATE[SRC_GNG] = "2021-10-13";
Parser.SOURCE_JSON_TO_DATE[SRC_LOTGB] = "2021-10-13";
// Turn JSON to Paizo Store
Parser.SOURCE_JSON_TO_STORE = {};
Parser.SOURCE_JSON_TO_STORE[SRC_CRB] = "https://paizo.com/products/btq01zp3";
Parser.SOURCE_JSON_TO_STORE[SRC_BST] = "https://paizo.com/products/btq01zp4";
Parser.SOURCE_JSON_TO_STORE[SRC_LOWG] = "https://paizo.com/products/btq01zoj";
Parser.SOURCE_JSON_TO_STORE[SRC_LOCG] = "https://paizo.com/products/btq01zt4";
Parser.SOURCE_JSON_TO_STORE[SRC_LOGM] = "https://paizo.com/products/btq021wf";
Parser.SOURCE_JSON_TO_STORE[SRC_LOGMWS] = "https://paizo.com/products/btq021wf";
Parser.SOURCE_JSON_TO_STORE[SRC_GMG] = "https://paizo.com/products/btq022c1";
Parser.SOURCE_JSON_TO_STORE[SRC_EC3] = "https://paizo.com/products/btq01zuh";
Parser.SOURCE_JSON_TO_STORE[SRC_BST2] = "https://paizo.com/products/btq022yq";
Parser.SOURCE_JSON_TO_STORE[SRC_LOL] = "https://paizo.com/products/btq023gd";
Parser.SOURCE_JSON_TO_STORE[SRC_APG] = "https://paizo.com/products/btq023ih";
Parser.SOURCE_JSON_TO_STORE[SRC_LOPSG] = "https://paizo.com/products/btq0250x";
Parser.SOURCE_JSON_TO_STORE[SRC_LOAG] = "https://paizo.com/products/btq026k5";
Parser.SOURCE_JSON_TO_STORE[SRC_LOME] = "https://paizo.com/products/btq026i4";
Parser.SOURCE_JSON_TO_STORE[SRC_AAWS] = "https://paizo-images.s3-us-west-2.amazonaws.com/image/download/Azarketi+Ancestry.pdf";
Parser.SOURCE_JSON_TO_STORE[SRC_BST3] = "https://paizo.com/products/btq027mn";
Parser.SOURCE_JSON_TO_STORE[SRC_SOM] = "https://paizo.com/products/btq027uy";
Parser.SOURCE_JSON_TO_STORE[SRC_GNG] = "https://paizo.com/products/btq026mw";
Parser.SOURCE_JSON_TO_STORE[SRC_LOTGB] = "https://paizo.com/products/btq027kc";
// Adventure Paths
Parser.SOURCE_JSON_TO_STORE[SRC_AOA0] = "https://paizo.com/products/btq024wj";
Parser.SOURCE_JSON_TO_STORE[SRC_AOA1] = "https://paizo.com/products/btq024tw";
Parser.SOURCE_JSON_TO_STORE[SRC_AOA2] = "https://paizo.com/products/btq022ci";
Parser.SOURCE_JSON_TO_STORE[SRC_AOA3] = "https://paizo.com/products/btq022lx";
Parser.SOURCE_JSON_TO_STORE[SRC_AOA4] = "https://paizo.com/products/btq0233p";
Parser.SOURCE_JSON_TO_STORE[SRC_AOA5] = "https://paizo.com/products/btq023dz";
Parser.SOURCE_JSON_TO_STORE[SRC_AOA6] = "https://paizo.com/products/btq023g1";

Parser.SOURCE_JSON_TO_STORE[SRC_EC0] = "https://paizo.com/products/btq022ks";
Parser.SOURCE_JSON_TO_STORE[SRC_EC1] = "https://paizo.com/products/btq01zqb"
Parser.SOURCE_JSON_TO_STORE[SRC_EC2] = "https://paizo.com/products/btq01zrd";
Parser.SOURCE_JSON_TO_STORE[SRC_EC3] = "https://paizo.com/products/btq01zuh";
Parser.SOURCE_JSON_TO_STORE[SRC_EC4] = "https://paizo.com/products/btq0216l";
Parser.SOURCE_JSON_TO_STORE[SRC_EC5] = "https://paizo.com/products/btq021by";
Parser.SOURCE_JSON_TO_STORE[SRC_EC6] = "https://paizo.com/products/btq021f4";

Parser.SOURCE_JSON_TO_STORE[SRC_AOE0] = "https://paizo.com/products/btq01zth";
Parser.SOURCE_JSON_TO_STORE[SRC_AOE1] = "https://paizo.com/products/btq01znq";
Parser.SOURCE_JSON_TO_STORE[SRC_AOE2] = "https://paizo.com/products/btq01znt";
Parser.SOURCE_JSON_TO_STORE[SRC_AOE3] = "https://paizo.com/products/btq01zrs";
Parser.SOURCE_JSON_TO_STORE[SRC_AOE4] = "https://paizo.com/products/btq0204d";
Parser.SOURCE_JSON_TO_STORE[SRC_AOE5] = "https://paizo.com/products/btq02065";
Parser.SOURCE_JSON_TO_STORE[SRC_AOE6] = "https://paizo.com/products/btq021cb";

Parser.SOURCE_JSON_TO_STORE[SRC_AV0] = "https://paizo.com/community/blog/v5748dyo6shjm";
Parser.SOURCE_JSON_TO_STORE[SRC_AV1] = "https://paizo.com/products/btq026kj";
Parser.SOURCE_JSON_TO_STORE[SRC_AV2] = "https://paizo.com/products/btq027jm";
Parser.SOURCE_JSON_TO_STORE[SRC_AV3] = "https://paizo.com/products/btq024xm";

Parser.SOURCE_JSON_TO_STORE[SRC_FRP0] = "https://paizo.com/community/blog/v5748dyo6shmo";
Parser.SOURCE_JSON_TO_STORE[SRC_FRP1] = "https://paizo.com/products/btq027qd";
Parser.SOURCE_JSON_TO_STORE[SRC_FRP2] = "https://paizo.com/products/btq027sp";
Parser.SOURCE_JSON_TO_STORE[SRC_FRP3] = "https://paizo.com/products/btq027sq";

Parser.SOURCE_JSON_TO_STORE[SRC_SOT0] = "https://paizo.com/community/blog/v5748dyo6shr4";
Parser.SOURCE_JSON_TO_STORE[SRC_SOT1] = "https://paizo.com/products/btq026li";
Parser.SOURCE_JSON_TO_STORE[SRC_SOT2] = "https://paizo.com/products/btq026mv";
Parser.SOURCE_JSON_TO_STORE[SRC_SOT3] = "https://paizo.com/products/btq027kb";
Parser.SOURCE_JSON_TO_STORE[SRC_SOT4] = "https://paizo.com/products/btq027nz";
Parser.SOURCE_JSON_TO_STORE[SRC_SOT5] = "https://paizo.com/products/btq027s2";
Parser.SOURCE_JSON_TO_STORE[SRC_SOT6] = "https://paizo.com/products/btq027u1";

Parser.SOURCE_JSON_TO_STORE[SRC_SLI] = "https://paizo.com/products/btq023hg";
Parser.SOURCE_JSON_TO_STORE[SRC_NGD] = "https://paizo.com/products/btq027o0";
Parser.SOURCE_JSON_TO_STORE[SRC_FOP] = "https://paizo.com/products/btq01zoh";
Parser.SOURCE_JSON_TO_STORE[SRC_TIO] = "https://paizo.com/products/btq026k1";
Parser.SOURCE_JSON_TO_STORE[SRC_LTIBA] = "https://paizo.com/products/btq024ys";

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
]);
Parser.SOURCES_CORE_SUPPLEMENTS = new Set(Object.keys(Parser.SOURCE_JSON_TO_FULL).filter(it => !Parser.SOURCES_ADVENTURES.has(it)));
Parser.SOURCES_VANILLA = new Set([SRC_CRB, SRC_BST, SRC_GMG, SRC_APG, SRC_SOM, SRC_GNG]);

Parser.SOURCES_AVAILABLE_DOCS_BOOK = {};
[
	SRC_CRB,
	SRC_APG,
	SRC_BST,
	SRC_BST2,
	SRC_BST3,
	SRC_GMG,
	SRC_SOM,
	SRC_LOCG,
	SRC_LOGM,
	SRC_LOAG,
	SRC_LOACLO,
	SRC_AAWS,
	SRC_GNG,
	SRC_LOTGB,
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
].forEach(src => {
	Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src] = src;
	Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE[src.toLowerCase()] = src;
});

Parser.TAG_TO_DEFAULT_SOURCE = {
	"spell": SRC_CRB,
	"item": SRC_CRB,
	"class": SRC_CRB,
	"creature": SRC_BST,
	"condition": SRC_CRB,
	"disease": SRC_GMG,
	"curse": SRC_GMG,
	"background": SRC_CRB,
	"ancestry": SRC_CRB,
	"versatileHeritage": SRC_APG,
	"archetype": SRC_CRB,
	"feat": SRC_CRB,
	"trap": SRC_CRB,
	"hazard": SRC_CRB,
	"deity": SRC_CRB,
	"variantrule": SRC_GMG,
	"action": SRC_CRB,
	"ability": SRC_BST,
	"classFeature": SRC_CRB,
	"subclassFeature": SRC_CRB,
	"table": SRC_CRB,
	"language": SRC_CRB,
	"ritual": SRC_CRB,
	"trait": SRC_CRB,
	"vehicle": SRC_GMG,
	"place": SRC_GMG,
	"plane": SRC_GMG,
	"settlement": SRC_GMG,
	"nation": SRC_GMG,
	"group": SRC_CRB,
	"domain": SRC_CRB,
	"skill": SRC_CRB,
	"familiar": SRC_APG,
	"familiarAbility": SRC_CRB,
	"companion": SRC_CRB,
	"companionAbility": SRC_CRB,
	"eidolon": SRC_SOM,
	"optfeature": SRC_APG,
	"organization": SRC_LOCG,
};
Parser.getTagSource = function (tag, source) {
	if (source && source.trim()) return source;
	tag = tag.trim();
	if (tag.startsWith("@")) tag = tag.slice(1);

	if (!Parser.TAG_TO_DEFAULT_SOURCE[tag]) throw new Error(`Unhandled tag "${tag}"`);
	return Parser.TAG_TO_DEFAULT_SOURCE[tag];
};

Parser.getTraitName = function (trait) {
	// TODO: This implementation is not perfect, but for now it will do
	const regex = new RegExp(`\\s(?:\\d|[A-Z]$|\\(|d\\d|[A-Z],|${Object.values(Parser.DMGTYPE_JSON_TO_FULL).join("|")}|to \\w+)(.+|$)`);
	const name = trait.replace(/\|.+/, "").replace(regex, "");
	if (name === name.toUpperCase()) return name;
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

Parser.levelToDC = function (level, spell, difficulty) {
	if (isNaN(level)) return "?"
	let DC = 0
	if (spell.toLowerCase() === "focus" || spell.toLowerCase() === "spell" || spell === true) level = (level * 2) - 1
	if (level < 21) {
		DC = 14 + Number(level) + Math.floor(level / 3)
	} else {
		DC = 40 + Number((level - 20) * 2)
	}
	// The Difficulty is negative for easier adjustments and positive for harder adjustments. 0 is default.
	if (difficulty) {
		if (typeof difficulty === "string" || difficulty instanceof String) { difficulty = difficulty.split() }
		for (let i = 0; i < difficulty.length; i++) {
			let typeNum = difficulty[i];
			switch (Parser.rarityToNumber(typeNum)) {
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
		}
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
