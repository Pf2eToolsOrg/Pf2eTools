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

Parser.attrChooseToFull = function (attList) {
	if (attList.length === 1) return `${Parser.attAbvToFull(attList[0])} modifier`;
	else {
		const attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(Parser.attAbvToFull(attList[i]));
		}
		return `${attsTemp.join(" or ")} modifier (your choice)`;
	}
};

Parser.numberToText = function (number) {
	if (number == null) throw new TypeError(`undefined or null object passed to parser`);
	if (Math.abs(number) >= 100) return `${number}`;

	function getAsText (num) {
		const abs = Math.abs(num);
		switch (abs) {
			case 0:
				return "zero";
			case 1:
				return "one";
			case 2:
				return "two";
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
				return "fiddy"; // :^)
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

	return `${number < 0 ? "negative " : ""}${getAsText(number)}`;
};

Parser.textToNumber = function (str) {
	str = str.trim().toLowerCase();
	if (!isNaN(str)) return Number(str);
	switch (str) {
		case "zero":
			return 0;
		case "one":
		case "a":
		case "an":
			return 1;
		case "two":
			return 2;
		case "three":
			return 3;
		case "four":
			return 4;
		case "five":
			return 5;
		case "six":
			return 6;
		case "seven":
			return 7;
		case "eight":
			return 8;
		case "nine":
			return 9;
		case "ten":
			return 10;
		case "eleven":
			return 11;
		case "twelve":
			return 12;
		case "thirteen":
			return 13;
		case "fourteen":
			return 14;
		case "fifteen":
			return 15;
		case "sixteen":
			return 16;
		case "seventeen":
			return 17;
		case "eighteen":
			return 18;
		case "nineteen":
			return 19;
		case "twenty":
			return 20;
		case "thirty":
			return 30;
		case "forty":
			return 40;
		case "fifty":
		case "fiddy":
			return 50;
		case "sixty":
			return 60;
		case "seventy":
			return 70;
		case "eighty":
			return 80;
		case "ninety":
			return 90;
	}
	return NaN;
};

Parser.numberToVulgar = function (number) {
	const spl = `${number}`.split(".");
	if (spl.length === 1) return number;
	if (spl[1] === "5") return `${spl[0]}½`;
	if (spl[1] === "25") return `${spl[0]}¼`;
	if (spl[1] === "75") return `${spl[0]}¾`;
	return Parser.numberToFractional(number);
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

Parser.attAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.ATB_ABV_TO_FULL, abv);
};

Parser.attFullToAbv = function (full) {
	return Parser._parse_bToA(Parser.ATB_ABV_TO_FULL, full);
};

Parser.sizeAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.SIZE_ABV_TO_FULL, abv);
};

Parser.getAbilityModNumber = function (abilityScore) {
	return Math.floor((abilityScore - 10) / 2);
};

Parser.getAbilityModifier = function (abilityScore) {
	let modifier = Parser.getAbilityModNumber(abilityScore);
	if (modifier >= 0) modifier = `+${modifier}`;
	return `${modifier}`;
};

Parser.getSpeedString = (it) => {
	if (it.speed == null) return "\u2014";

	function procSpeed (propName) {
		function addSpeed (s) {
			stack.push(`${propName === "walk" ? "" : `${propName} `}${getVal(s)} ft.${getCond(s)}`);
		}

		if (it.speed[propName] || propName === "walk") addSpeed(it.speed[propName] || 0);
		if (it.speed.alternate && it.speed.alternate[propName]) it.speed.alternate[propName].forEach(addSpeed);
	}

	function getVal (speedProp) {
		return speedProp.number != null ? speedProp.number : speedProp;
	}

	function getCond (speedProp) {
		return speedProp.condition ? ` ${Renderer.get().render(speedProp.condition)}` : "";
	}

	const stack = [];
	if (typeof it.speed === "object") {
		let joiner = ", ";
		procSpeed("walk");
		procSpeed("burrow");
		procSpeed("climb");
		procSpeed("fly");
		procSpeed("swim");
		if (it.speed.choose) {
			joiner = "; ";
			stack.push(`${it.speed.choose.from.sort().joinConjunct(", ", " or ")} ${it.speed.choose.amount} ft.${it.speed.choose.note ? ` ${it.speed.choose.note}` : ""}`);
		}
		return stack.join(joiner);
	} else {
		return it.speed + (it.speed === "Varies" ? "" : " ft. ");
	}
};

Parser.SPEED_TO_PROGRESSIVE = {
	"walk": "walking",
	"burrow": "burrowing",
	"climb": "climbing",
	"fly": "flying",
	"swim": "swimming",
};

Parser.speedToProgressive = function (prop) {
	return Parser._parse_aToB(Parser.SPEED_TO_PROGRESSIVE, prop);
};

Parser._addCommas = function (intNum) {
	return `${intNum}`.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
};

Parser.numToBonus = function (intNum) {
	return `${intNum >= 0 ? "+" : ""}${intNum}`
};

Parser.crToXp = function (cr, {isDouble = false} = {}) {
	if (cr != null && cr.xp) return Parser._addCommas(`${isDouble ? cr.xp * 2 : cr.xp}`);

	const toConvert = cr ? (cr.cr || cr) : null;
	if (toConvert === "Unknown" || toConvert == null || !Parser.XP_CHART_ALT) return "Unknown";
	if (toConvert === "0") return "0 or 10";
	const xp = Parser.XP_CHART_ALT[toConvert];
	return Parser._addCommas(`${isDouble ? 2 * xp : xp}`);
};

Parser.crToXpNumber = function (cr) {
	if (cr != null && cr.xp) return cr.xp;
	const toConvert = cr ? (cr.cr || cr) : cr;
	if (toConvert === "Unknown" || toConvert == null) return null;
	return Parser.XP_CHART_ALT[toConvert];
};

LEVEL_TO_XP_EASY = [0, 25, 50, 75, 125, 250, 300, 350, 450, 550, 600, 800, 1000, 1100, 1250, 1400, 1600, 2000, 2100, 2400, 2800];
LEVEL_TO_XP_MEDIUM = [0, 50, 100, 150, 250, 500, 600, 750, 900, 1100, 1200, 1600, 2000, 2200, 2500, 2800, 3200, 3900, 4100, 4900, 5700];
LEVEL_TO_XP_HARD = [0, 75, 150, 225, 375, 750, 900, 1100, 1400, 1600, 1900, 2400, 3000, 3400, 3800, 4300, 4800, 5900, 6300, 7300, 8500];
LEVEL_TO_XP_DEADLY = [0, 100, 200, 400, 500, 1100, 1400, 1700, 2100, 2400, 2800, 3600, 4500, 5100, 5700, 6400, 7200, 8800, 9500, 10900, 12700];
LEVEL_TO_XP_DAILY = [0, 300, 600, 1200, 1700, 3500, 4000, 5000, 6000, 7500, 9000, 10500, 11500, 13500, 15000, 18000, 20000, 25000, 27000, 30000, 40000];

Parser.LEVEL_XP_REQUIRED = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

Parser.CRS = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];

Parser.levelToXpThreshold = function (level) {
	return [LEVEL_TO_XP_EASY[level], LEVEL_TO_XP_MEDIUM[level], LEVEL_TO_XP_HARD[level], LEVEL_TO_XP_DEADLY[level]];
};

Parser.isValidCr = function (cr) {
	return Parser.CRS.includes(cr);
};

Parser.crToNumber = function (cr) {
	if (cr === "Unknown" || cr === "\u2014" || cr == null) return 100;
	if (cr.cr) return Parser.crToNumber(cr.cr);
	const parts = cr.trim().split("/");
	if (parts.length === 1) return Number(parts[0]);
	else if (parts.length === 2) return Number(parts[0]) / Number(parts[1]);
	else return 0;
};

Parser.numberToCr = function (number, safe) {
	// avoid dying if already-converted number is passed in
	if (safe && typeof number === "string" && Parser.CRS.includes(number)) return number;

	if (number == null) return "Unknown";

	return Parser.numberToFractional(number);
};

Parser.crToPb = function (cr) {
	if (cr === "Unknown" || cr == null) return 0;
	cr = cr.cr || cr;
	if (Parser.crToNumber(cr) < 5) return 2;
	return Math.ceil(cr / 4) + 1;
};

Parser.levelToPb = function (level) {
	if (!level) return 2;
	return Math.ceil(level / 4) + 1;
};

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

Parser.LANGUAGES_COMMON = [
	"Common",
	"Draconic",
	"Dwarven",
	"Elven",
	"Gnomish",
	"Goblin",
	"Halfling",
	"Jotun",
	"Orcish",
	"Sylvan",
	"Undercommon",
];

Parser.LANGUAGES_UNCOMMON = [
	"Abyssal",
	"Aklo",
	"Aquan",
	"Auran",
	"Celestial",
	"Gnoll",
	"Ignan",
	"Necril",
	"Shadowtongue",
	"Terran",
];

Parser.LANGUAGES_SECRET = [
	"Druidic",
];

Parser.LANGUAGES_ALL = [
	...Parser.LANGUAGES_COMMON,
	...Parser.LANGUAGES_UNCOMMON,
	...Parser.LANGUAGES_SECRET,
].sort();

Parser.dragonColorToFull = function (c) {
	return Parser._parse_aToB(Parser.DRAGON_COLOR_TO_FULL, c);
};

Parser.DRAGON_COLOR_TO_FULL = {
	B: "black",
	U: "blue",
	G: "green",
	R: "red",
	W: "white",
	A: "brass",
	Z: "bronze",
	C: "copper",
	O: "gold",
	S: "silver",
};

Parser.acToFull = function (ac, renderer) {
	if (typeof ac === "string") return ac; // handle classic format

	renderer = renderer || Renderer.get();

	let stack = "";
	let inBraces = false;
	for (let i = 0; i < ac.length; ++i) {
		const cur = ac[i];
		const nxt = ac[i + 1];

		if (cur.special != null) {
			if (inBraces) inBraces = false;

			stack += cur.special;
		} else if (cur.ac) {
			const isNxtBraces = nxt && nxt.braces;

			if (!inBraces && cur.braces) {
				stack += "(";
				inBraces = true;
			}

			stack += cur.ac;

			if (cur.from) {
				// always brace nested braces
				if (cur.braces) {
					stack += " (";
				} else {
					stack += inBraces ? "; " : " (";
				}

				inBraces = true;

				stack += cur.from.map(it => renderer.render(it)).join(", ");

				if (cur.braces) {
					stack += ")";
				} else if (!isNxtBraces) {
					stack += ")";
					inBraces = false;
				}
			}

			if (cur.condition) stack += ` ${renderer.render(cur.condition)}`;

			if (inBraces && !isNxtBraces) {
				stack += ")";
				inBraces = false;
			}
		} else {
			stack += cur;
		}

		if (nxt) {
			if (nxt.braces) {
				stack += inBraces ? "; " : " (";
				inBraces = true;
			} else stack += ", ";
		}
	}
	if (inBraces) stack += ")";

	return stack.trim();
};

MONSTER_COUNT_TO_XP_MULTIPLIER = [1, 1.5, 2, 2, 2, 2, 2.5, 2.5, 2.5, 2.5, 3, 3, 3, 3, 4];
Parser.numMonstersToXpMult = function (num, playerCount = 3) {
	const baseVal = (() => {
		if (num >= MONSTER_COUNT_TO_XP_MULTIPLIER.length) return 4;
		return MONSTER_COUNT_TO_XP_MULTIPLIER[num - 1];
	})();

	if (playerCount < 3) return baseVal >= 3 ? baseVal + 1 : baseVal + 0.5;
	else if (playerCount > 5) {
		return baseVal === 4 ? 3 : baseVal - 0.5;
	} else return baseVal;
};

Parser.armorFullToAbv = function (armor) {
	return Parser._parse_bToA(Parser.ARMOR_ABV_TO_FULL, armor);
};

Parser.weaponFullToAbv = function (weapon) {
	return Parser._parse_bToA(Parser.WEAPON_ABV_TO_FULL, weapon);
};

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
Parser.sourceJsonToFull = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceFull(source)) return Parser._sourceFullCache[source.toLowerCase()].replace(/'/g, "\u2019");
	if (BrewUtil.hasSourceJson(source)) return BrewUtil.sourceJsonToFull(source).replace(/'/g, "\u2019");
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, "\u2019");
};
Parser.sourceJsonToFullCompactPrefix = function (source) {
	return Parser.sourceJsonToFull(source)
		.replace(LO_PREFIX, LO_PREFIX_SHORT);
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

Parser.sourceJsonToColor = function (source) {
	return `source${Parser.sourceJsonToAbv(source)}`;
};

Parser.stringToSlug = function (str) {
	return str.trim().toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

Parser.stringToCasedSlug = function (str) {
	return str.replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

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

Parser.itemVehicleCostsToFull = function (item, isShortForm) {
	return {
		travelCostFull: Parser._moneyToFull(item, "travelCost", "travelCostMult", isShortForm),
		shippingCostFull: Parser._moneyToFull(item, "shippingCost", "shippingCostMult", isShortForm),
	};
};

Parser.spellComponentCostToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "cost", "costMult", isShortForm);
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
	"ep": "electrum pieces",
	"gp": "gold pieces",
	"pp": "platinum pieces",
};
Parser.COIN_CONVERSIONS = [1, 10, 100, 1000];

Parser.coinAbvToFull = function (coin) {
	return Parser._parse_aToB(Parser.COIN_ABV_TO_FULL, coin);
};

Parser.itemWeightToFull = function (item, isShortForm) {
	return item.weight
		? `${item.weight < 1 ? item.weight * 16 : item.weight} ${item.weight < 1 ? "oz" : "lb"}.${(item.weightNote ? ` ${item.weightNote}` : "")}`
		: item.weightMult ? isShortForm ? `×${item.weightMult}` : `base weight ×${item.weightMult}` : "";
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

Parser.weightValueToNumber = function (value) {
	if (!value) return 0;

	if (Number(value)) return Number(value);
	else throw new Error(`Badly formatted value ${value}`);
};

Parser.dmgTypeToFull = function (dmgType) {
	return Parser._parse_aToB(Parser.DMGTYPE_JSON_TO_FULL, dmgType);
};

Parser.skillToExplanation = function (skillType) {
	const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "skills", skillType);
	if (fromBrew) return fromBrew;
	return Parser._parse_aToB(Parser.SKILL_JSON_TO_FULL, skillType);
};

Parser.senseToExplanation = function (senseType) {
	senseType = senseType.toLowerCase();
	const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "senses", senseType);
	if (fromBrew) return fromBrew;
	return Parser._parse_aToB(Parser.SENSE_JSON_TO_FULL, senseType, ["No explanation available."]);
};

Parser.skillProficienciesToFull = function (skillProficiencies) {
	function renderSingle (skProf) {
		const keys = Object.keys(skProf).sort(SortUtil.ascSortLower);

		const ixChoose = keys.indexOf("choose");
		if (~ixChoose) keys.splice(ixChoose, 1);

		const baseStack = [];
		keys.filter(k => skProf[k]).forEach(k => baseStack.push(Renderer.get().render(`{@skill ${k.toTitleCase()}}`)));

		const chooseStack = [];
		if (~ixChoose) {
			const chObj = skProf.choose;
			if (chObj.from.length === 18) {
				chooseStack.push(`choose any ${!chObj.count || chObj.count === 1 ? "skill" : chObj.count}`);
			} else {
				chooseStack.push(`choose ${chObj.count || 1} from ${chObj.from.map(it => Renderer.get().render(`{@skill ${it.toTitleCase()}}`)).joinConjunct(", ", " and ")}`);
			}
		}

		const base = baseStack.joinConjunct(", ", " and ");
		const choose = chooseStack.join(""); // this should currently only ever be 1-length

		if (baseStack.length && chooseStack.length) return `${base}; and ${choose}`;
		else if (baseStack.length) return base;
		else if (chooseStack.length) return choose;
	}

	return skillProficiencies.map(renderSingle).join(" <i>or</i> ");
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

Parser.initialProficienciesToFull = function (initProf) {
	let out = {
		type: "pf2-sidebar",
		name: "INITIAL PROFICIENCIES",
		entries: [
			"At 1st level, you gain the listed proficiency ranks in  the following statistics. You are untrained in anything not listed unless you gain a better proficiency rank in some other way.",
		],
	};
	out.entries.push({type: "pf2-title", name: "PERCEPTION"});
	out.entries.push(`${Parser.proficiencyAbvToFull(initProf.perception)} in Perception`);
	out.entries.push({type: "pf2-title", name: "SAVING THROWS"});
	out.entries.push(`${Parser.proficiencyAbvToFull(initProf.fort)} in Fortitude`);
	out.entries.push(`${Parser.proficiencyAbvToFull(initProf.ref)} in Reflex`);
	out.entries.push(`${Parser.proficiencyAbvToFull(initProf.will)} in Will`);
	out.entries.push({type: "pf2-title", name: "SKILLS"});
	if (initProf.skills.t) initProf.skills.t.forEach(it => out.entries.push(`{@indentSubsequent Trained in ${it}}`));
	if (initProf.skills.e) initProf.skills.e.forEach(it => out.entries.push(`{@indentSubsequent Expert in ${it}}`));
	if (initProf.skills.m) initProf.skills.m.forEach(it => out.entries.push(`{@indentSubsequent Master in ${it}}`));
	if (initProf.skills.l) initProf.skills.l.forEach(it => out.entries.push(`{@indentSubsequent Legendary in ${it}}`));
	if (initProf.skills.add) out.entries.push(`{@indentSubsequent Trained in a number of additional skills equal to ${initProf.skills.add} plus your Intelligence modifier}`)
	out.entries.push({type: "pf2-title", name: "ATTACKS"});
	if (initProf.attacks.t) initProf.attacks.t.forEach(it => out.entries.push(`Trained in ${it}`));
	if (initProf.attacks.e) initProf.attacks.e.forEach(it => out.entries.push(`Expert in ${it}`));
	if (initProf.attacks.m) initProf.attacks.m.forEach(it => out.entries.push(`Master in ${it}`));
	if (initProf.attacks.l) initProf.attacks.l.forEach(it => out.entries.push(`Legendary in ${it}`));
	out.entries.push({type: "pf2-title", name: "DEFENSES"});
	if (initProf.defenses.t) initProf.defenses.t.forEach(it => out.entries.push(`Trained in ${it}`));
	if (initProf.defenses.e) initProf.defenses.e.forEach(it => out.entries.push(`Expert in ${it}`));
	if (initProf.defenses.m) initProf.defenses.m.forEach(it => out.entries.push(`Master in ${it}`));
	if (initProf.defenses.l) initProf.defenses.l.forEach(it => out.entries.push(`Legendary in ${it}`));
	if (initProf.classDc) {
		out.entries.push({type: "pf2-title", name: "CLASS DC"});
		out.entries.push(initProf.classDc.entry);
	}

	return out
}

// sp-prefix functions are for parsing spell data, and shared with the roll20 script
Parser.spSchoolAndSubschoolsAbvsToFull = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToFull(school);
	else return `${Parser.spSchoolAbvToFull(school)} (${subschools.map(sub => Parser.spSchoolAbvToFull(sub)).join(", ")})`;
};

Parser.spSchoolAbvToFull = function (schoolOrSubschool) {
	if (schoolOrSubschool == null) return `N/A`
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_FULL, schoolOrSubschool);
	if (Parser.SP_SCHOOL_ABV_TO_FULL[schoolOrSubschool]) return out;
	if (BrewUtil.homebrewMeta && BrewUtil.homebrewMeta.spellSchools && BrewUtil.homebrewMeta.spellSchools[schoolOrSubschool]) return BrewUtil.homebrewMeta.spellSchools[schoolOrSubschool].full;
	return out;
};

Parser.spSchoolAndSubschoolsAbvsShort = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToShort(school);
	else return `${Parser.spSchoolAbvToShort(school)} (${subschools.map(sub => Parser.spSchoolAbvToShort(sub)).join(", ")})`;
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
	if (level === 0) return "Cantrip";
	else return Parser.getOrdinalForm(level);
};

Parser.getArticle = function (str) {
	str = `${str}`;
	str = str.replace(/\d+/g, (...m) => Parser.numberToText(m[0]));
	return /^[aeiou]/.test(str) ? "an" : "a";
};

Parser.spLevelToFullLevelText = function (level, dash) {
	return `${Parser.spLevelToFull(level)}${(level === 0 ? "s" : `${dash ? "-" : " "}level`)}`;
};

Parser.spMetaToArr = function (meta) {
	if (!meta) return [];
	return Object.entries(meta)
		.filter(([_, v]) => v)
		.sort(SortUtil.ascSort)
		.map(([k]) => k);
};

Parser.spMetaToFull = function (meta) {
	if (!meta) return "";
	const metaTags = Parser.spMetaToArr(meta);
	if (metaTags.length) return ` (${metaTags.join(", ")})`;
	return "";
};

Parser.spLevelSchoolMetaToFull = function (level, school, meta, subschools) {
	const levelPart = level === 0 ? Parser.spLevelToFull(level).toLowerCase() : `${Parser.spLevelToFull(level)}-level`;
	const levelSchoolStr = level === 0 ? `${Parser.spSchoolAbvToFull(school)} ${levelPart}` : `${levelPart} ${Parser.spSchoolAbvToFull(school).toLowerCase()}`;

	const metaArr = Parser.spMetaToArr(meta);
	if (metaArr.length || (subschools && subschools.length)) {
		const metaAndSubschoolPart = [
			(subschools || []).map(sub => Parser.spSchoolAbvToFull(sub)).join(", "),
			metaArr.join(", "),
		].filter(Boolean).join("; ").toLowerCase();
		return `${levelSchoolStr} (${metaAndSubschoolPart})`;
	}
	return levelSchoolStr;
};

Parser.spTimeListToFull = function (times, isStripTags) {
	return times.map(t => `${Parser.getTimeToFull(t)}${t.condition ? `, ${isStripTags ? Renderer.stripTags(t.condition) : Renderer.get().render(t.condition)}` : ""}`).join(" or ");
};

Parser.getTimeToFull = function (time) {
	return `${time.number} ${time.unit === "free" ? "free action" : time.unit}${time.number > 1 ? "s" : ""}`;
};

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
Parser.SP_RANGE_TYPE_TO_FULL = {
	[RNG_SPECIAL]: "Special",
	[RNG_POINT]: "Point",
	[RNG_LINE]: "Line",
	[RNG_CUBE]: "Cube",
	[RNG_CONE]: "Cone",
	[RNG_RADIUS]: "Radius",
	[RNG_SPHERE]: "Sphere",
	[RNG_HEMISPHERE]: "Hemisphere",
	[RNG_CYLINDER]: "Cylinder",
	[RNG_SELF]: "Self",
	[RNG_SIGHT]: "Sight",
	[RNG_UNLIMITED]: "Unlimited",
	[RNG_UNLIMITED_SAME_PLANE]: "Planetary",
	[RNG_TOUCH]: "Touch",
};

Parser.spRangeTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TYPE_TO_FULL, range);
};

UNT_FEET = "feet";
UNT_MILES = "miles";
Parser.SP_DIST_TYPE_TO_FULL = {
	[UNT_FEET]: "Feet",
	[UNT_MILES]: "Miles",
	[RNG_SELF]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_SELF],
	[RNG_TOUCH]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_TOUCH],
	[RNG_SIGHT]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_SIGHT],
	[RNG_UNLIMITED]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_UNLIMITED],
	[RNG_UNLIMITED_SAME_PLANE]: Parser.SP_RANGE_TYPE_TO_FULL[RNG_UNLIMITED_SAME_PLANE],
};

Parser.spDistanceTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_DIST_TYPE_TO_FULL, range);
};

Parser.SP_RANGE_TO_ICON = {
	[RNG_SPECIAL]: "fa-star",
	[RNG_POINT]: "",
	[RNG_LINE]: "fa-grip-lines-vertical",
	[RNG_CUBE]: "fa-cube",
	[RNG_CONE]: "fa-traffic-cone",
	[RNG_RADIUS]: "fa-hockey-puck",
	[RNG_SPHERE]: "fa-globe",
	[RNG_HEMISPHERE]: "fa-globe",
	[RNG_CYLINDER]: "fa-database",
	[RNG_SELF]: "fa-street-view",
	[RNG_SIGHT]: "fa-eye",
	[RNG_UNLIMITED_SAME_PLANE]: "fa-globe-americas",
	[RNG_UNLIMITED]: "fa-infinity",
	[RNG_TOUCH]: "fa-hand-paper",
};

Parser.spRangeTypeToIcon = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TO_ICON, range);
};

Parser.spRangeToShortHtml = function (range) {
	switch (range.type) {
		case RNG_SPECIAL:
			return `<span class="fas ${Parser.spRangeTypeToIcon(range.type)} help--subtle" title="Special"/>`;
		case RNG_POINT:
			return Parser.spRangeToShortHtml._renderPoint(range);
		case RNG_LINE:
		case RNG_CUBE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_SPHERE:
		case RNG_HEMISPHERE:
		case RNG_CYLINDER:
			return Parser.spRangeToShortHtml._renderArea(range);
	}
};
Parser.spRangeToShortHtml._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case RNG_SELF:
		case RNG_SIGHT:
		case RNG_UNLIMITED:
		case RNG_UNLIMITED_SAME_PLANE:
		case RNG_SPECIAL:
		case RNG_TOUCH:
			return `<span class="fas ${Parser.spRangeTypeToIcon(dist.type)} help--subtle" title="${Parser.spRangeTypeToFull(dist.type)}"/>`;
		case UNT_FEET:
		case UNT_MILES:
		default:
			return `${dist.amount} <span class="ve-small">${Parser.getSingletonUnit(dist.type, true)}</span>`;
	}
};
Parser.spRangeToShortHtml._renderArea = function (range) {
	const size = range.distance;
	return `<span class="fas ${Parser.spRangeTypeToIcon(RNG_SELF)} help--subtle" title="Self"/> ${size.amount}<span class="ve-small">-${Parser.getSingletonUnit(size.type, true)}</span> ${Parser.spRangeToShortHtml._getAreaStyleString(range)}`;
};
Parser.spRangeToShortHtml._getAreaStyleString = function (range) {
	return `<span class="fas ${Parser.spRangeTypeToIcon(range.type)} help--subtle" title="${Parser.spRangeTypeToFull(range.type)}"/>`
};

Parser.spRangeToFull = function (range) {
	switch (range.type) {
		case RNG_SPECIAL:
			return Parser.spRangeTypeToFull(range.type);
		case RNG_POINT:
			return Parser.spRangeToFull._renderPoint(range);
		case RNG_LINE:
		case RNG_CUBE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_SPHERE:
		case RNG_HEMISPHERE:
		case RNG_CYLINDER:
			return Parser.spRangeToFull._renderArea(range);
	}
};
Parser.spRangeToFull._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case RNG_SELF:
		case RNG_SIGHT:
		case RNG_UNLIMITED:
		case RNG_UNLIMITED_SAME_PLANE:
		case RNG_SPECIAL:
		case RNG_TOUCH:
			return Parser.spRangeTypeToFull(dist.type);
		case UNT_FEET:
		case UNT_MILES:
		default:
			return `${dist.amount} ${dist.amount === 1 ? Parser.getSingletonUnit(dist.type) : dist.type}`;
	}
};
Parser.spRangeToFull._renderArea = function (range) {
	const size = range.distance;
	return `Self (${size.amount}-${Parser.getSingletonUnit(size.type)}${Parser.spRangeToFull._getAreaStyleString(range)}${range.type === RNG_CYLINDER ? `${size.amountSecondary != null && size.typeSecondary != null ? `, ${size.amountSecondary}-${Parser.getSingletonUnit(size.typeSecondary)}-high` : ""} cylinder` : ""})`;
};
Parser.spRangeToFull._getAreaStyleString = function (range) {
	switch (range.type) {
		case RNG_SPHERE:
			return " radius";
		case RNG_HEMISPHERE:
			return `-radius ${range.type}`;
		case RNG_CYLINDER:
			return "-radius";
		default:
			return ` ${range.type}`;
	}
};

Parser.getSingletonUnit = function (unit, isShort) {
	switch (unit) {
		case UNT_FEET:
			return isShort ? "ft." : "foot";
		case UNT_MILES:
			return isShort ? "mi." : "mile";
		default: {
			const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "spellDistanceUnits", unit, "singular");
			if (fromBrew) return fromBrew;
			if (unit.charAt(unit.length - 1) === "s") return unit.slice(0, -1);
			return unit;
		}
	}
};

Parser.RANGE_TYPES = [
	{type: RNG_POINT, hasDistance: true, isRequireAmount: false},

	{type: RNG_LINE, hasDistance: true, isRequireAmount: true},
	{type: RNG_CUBE, hasDistance: true, isRequireAmount: true},
	{type: RNG_CONE, hasDistance: true, isRequireAmount: true},
	{type: RNG_RADIUS, hasDistance: true, isRequireAmount: true},
	{type: RNG_SPHERE, hasDistance: true, isRequireAmount: true},
	{type: RNG_HEMISPHERE, hasDistance: true, isRequireAmount: true},
	{type: RNG_CYLINDER, hasDistance: true, isRequireAmount: true},

	{type: RNG_SPECIAL, hasDistance: false, isRequireAmount: false},
];

Parser.DIST_TYPES = [
	{type: RNG_SELF, hasAmount: false},
	{type: RNG_TOUCH, hasAmount: false},

	{type: UNT_FEET, hasAmount: true},
	{type: UNT_MILES, hasAmount: true},

	{type: RNG_SIGHT, hasAmount: false},
	{type: RNG_UNLIMITED_SAME_PLANE, hasAmount: false},
	{type: RNG_UNLIMITED, hasAmount: false},
];

Parser.spComponentsToFull = function (comp, level) {
	if (!comp) return "None";
	const out = [];
	if (comp.v) out.push("V");
	if (comp.s) out.push("S");
	if (comp.m != null) out.push(`M${comp.m !== true ? ` (${comp.m.text != null ? comp.m.text : comp.m})` : ""}`);
	if (comp.r) out.push(`R (${level} gp)`);
	return out.join(", ") || "None";
};

Parser.SP_END_TYPE_TO_FULL = {
	"dispel": "dispelled",
	"trigger": "triggered",
	"discharge": "discharged",
};
Parser.spEndTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_END_TYPE_TO_FULL, type);
};

Parser.spDurationToFull = function (dur) {
	let hasSubOr = false;
	const outParts = dur.map(d => {
		switch (d.type) {
			case "special":
				return "Special";
			case "instant":
				return `Instantaneous${d.condition ? ` (${d.condition})` : ""}`;
			case "timed":
				return `${d.concentration ? "Concentration, " : ""}${d.concentration ? "u" : d.duration.upTo ? "U" : ""}${d.concentration || d.duration.upTo ? "p to " : ""}${d.duration.amount} ${d.duration.amount === 1 ? d.duration.type : `${d.duration.type}s`}`;
			case "permanent": {
				if (d.ends) {
					const endsToJoin = d.ends.map(m => Parser.spEndTypeToFull(m));
					hasSubOr = hasSubOr || endsToJoin.length > 1;
					return `Until ${endsToJoin.joinConjunct(", ", " or ")}`;
				} else {
					return "Permanent";
				}
			}
		}
	});
	return `${outParts.joinConjunct(hasSubOr ? "; " : ", ", " or ")}${dur.length > 1 ? " (see below)" : ""}`;
};

Parser.DURATION_TYPES = [
	{type: "instant", full: "Instantaneous"},
	{type: "timed", hasAmount: true},
	{type: "permanent", hasEnds: true},
	{type: "special"},
];

Parser.DURATION_AMOUNT_TYPES = [
	"turn",
	"round",
	"minute",
	"hour",
	"day",
	"week",
	"year",
];

Parser.spClassesToFull = function (classes, textOnly, subclassLookup = {}) {
	const fromSubclasses = Parser.spSubclassesToFull(classes, textOnly, subclassLookup);
	return `${Parser.spMainClassesToFull(classes, textOnly)}${fromSubclasses ? `, ${fromSubclasses}` : ""}`
};

Parser.spMainClassesToFull = function (classes, textOnly = false, prop = "fromClassList") {
	if (!classes) return "";
	return (classes[prop] || [])
		.filter(c => !ExcludeUtil.isInitialised || !ExcludeUtil.isExcluded(c.name, "class", c.source))
		.sort((a, b) => SortUtil.ascSort(a.name, b.name))
		.map(c => textOnly ? c.name : `<a title="Source: ${Parser.sourceJsonToFull(c.source)}" href="${UrlUtil.PG_CLASSES}#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c)}">${c.name}</a>`)
		.join(", ");
};

Parser.spSubclassesToFull = function (classes, textOnly, subclassLookup = {}) {
	if (!classes || !classes.fromSubclass) return "";
	return classes.fromSubclass
		.filter(c => {
			if (!ExcludeUtil.isInitialised) return true;
			const excludeClass = ExcludeUtil.isExcluded(c.class.name, "class", c.class.source);
			if (excludeClass) return false;
			const fromLookup = MiscUtil.get(subclassLookup, c.class.source, c.class.name, c.subclass.source, c.subclass.name);
			if (!fromLookup) return true;
			const excludeSubclass = ExcludeUtil.isExcluded(fromLookup.name || c.subclass.name, "subclass", c.subclass.source);
			return !excludeSubclass;
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.class.name, b.class.name);
			return byName || SortUtil.ascSort(a.subclass.name, b.subclass.name);
		})
		.map(c => Parser._spSubclassItem(c, textOnly, subclassLookup))
		.join(", ");
};

Parser._spSubclassItem = function (fromSubclass, textOnly, subclassLookup) {
	const c = fromSubclass.class;
	const sc = fromSubclass.subclass;
	const text = `${sc.name}${sc.subSubclass ? ` (${sc.subSubclass})` : ""}`;
	if (textOnly) return text;
	const classPart = `<a href="${UrlUtil.PG_CLASSES}#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c)}" title="Source: ${Parser.sourceJsonToFull(c.source)}">${c.name}</a>`;
	const fromLookup = subclassLookup ? MiscUtil.get(subclassLookup, c.source, c.name, sc.source, sc.name) : null;
	if (fromLookup) {
		return `<a class="italic" href="${UrlUtil.PG_CLASSES}#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](c)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({
			subclass: {
				shortName: sc.name,
				source: sc.source,
			},
		})}" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${text}</a> ${classPart}`;
	} else return `<span class="italic" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${text}</span> ${classPart}`;
};

Parser.SPELL_ATTACK_TYPE_TO_FULL = {};
Parser.SPELL_ATTACK_TYPE_TO_FULL["M"] = "Melee";
Parser.SPELL_ATTACK_TYPE_TO_FULL["R"] = "Ranged";
Parser.SPELL_ATTACK_TYPE_TO_FULL["O"] = "Other/Unknown";

Parser.spAttackTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_ATTACK_TYPE_TO_FULL, type);
};

Parser.SPELL_AREA_TYPE_TO_FULL = {
	ST: "Single Target",
	MT: "Multiple Targets",
	C: "Cube",
	N: "Cone",
	Y: "Cylinder",
	S: "Sphere",
	R: "Circle",
	Q: "Square",
	L: "Line",
	H: "Hemisphere",
	W: "Wall",
};
Parser.spAreaTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_AREA_TYPE_TO_FULL, type);
};

Parser.SP_MISC_TAG_TO_FULL = {
	HL: "Healing",
	SGT: "Requires Sight",
	PRM: "Permanent Effects",
	SCL: "Scaling Effects",
	SMN: "Summons Creature",
};
Parser.spMiscTagToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_MISC_TAG_TO_FULL, type);
};

Parser.SP_CASTER_PROGRESSION_TO_FULL = {
	full: "Full",
	"1/2": "Half",
	"1/3": "One-Third",
	"pact": "Pact Magic",
};
Parser.spCasterProgressionToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_CASTER_PROGRESSION_TO_FULL, type);
};

Parser.creatureAlignToFull = function (align) {
	switch (align) {
		case null:
			return "";
		case "ANY":
			return "Any";
		case "LG":
			return "Lawful Good";
		case "NG":
			return "Neutral Good";
		case "CG":
			return "Chaotic Good";
		case "LN":
			return "Lawful Neutral";
		case "N":
			return "Neutral";
		case "CN":
			return "Chaotic Neutral";
		case "LE":
			return "Lawful Evil";
		case "NE":
			return "Neutral Evil";
		case "CE":
			return "Chaotic Evil";
		default:
			return "Unknown";
	}
};

Parser.ENVIRONMENTS = ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"];

Parser.alignmentAbvToFull = function (alignment) {
	if (!alignment) return null; // used in sidekicks
	if (typeof alignment === "object") {
		if (alignment.special != null) {
			// use in MTF Sacred Statue
			return alignment.special;
		} else {
			// e.g. `{alignment: ["N", "G"], chance: 50}` or `{alignment: ["N", "G"]}`
			return `${alignment.alignment.map(a => Parser.alignmentAbvToFull(a)).join(" ")}${alignment.chance ? ` (${alignment.chance}%)` : ""}${alignment.note ? ` (${alignment.note})` : ""}`;
		}
	} else {
		alignment = alignment.toUpperCase();
		switch (alignment) {
			case "L":
				return "lawful";
			case "N":
				return "neutral";
			case "NX":
				return "neutral (law/chaos axis)";
			case "NY":
				return "neutral (good/evil axis)";
			case "C":
				return "chaotic";
			case "G":
				return "good";
			case "E":
				return "evil";
			// "special" values
			case "U":
				return "unaligned";
			case "A":
				return "any alignment";
		}
		return alignment;
	}
};

Parser.alignmentListToFull = function (alignList) {
	if (alignList.some(it => typeof it !== "string")) {
		if (alignList.some(it => typeof it === "string")) throw new Error(`Mixed alignment types: ${JSON.stringify(alignList)}`);
		// filter out any nonexistent alignments, as we don't care about "alignment does not exist" if there are other alignments
		alignList = alignList.filter(it => it.alignment === undefined || it.alignment != null);
		return alignList.map(it => it.special != null || it.chance != null || it.note != null ? Parser.alignmentAbvToFull(it) : Parser.alignmentListToFull(it.alignment)).join(" or ");
	} else {
		// assume all single-length arrays can be simply parsed
		if (alignList.length === 1) return Parser.alignmentAbvToFull(alignList[0]);
		// a pair of abv's, e.g. "L" "G"
		if (alignList.length === 2) {
			return alignList.map(a => Parser.alignmentAbvToFull(a)).join(" ");
		}
		if (alignList.length === 3) {
			if (alignList.includes("NX") && alignList.includes("NY") && alignList.includes("N")) return "any neutral alignment";
		}
		// longer arrays should have a custom mapping
		if (alignList.length === 5) {
			if (!alignList.includes("G")) return "any non-good alignment";
			if (!alignList.includes("E")) return "any non-evil alignment";
			if (!alignList.includes("L")) return "any non-lawful alignment";
			if (!alignList.includes("C")) return "any non-chaotic alignment";
		}
		if (alignList.length === 4) {
			if (!alignList.includes("L") && !alignList.includes("NX")) return "any chaotic alignment";
			if (!alignList.includes("G") && !alignList.includes("NY")) return "any evil alignment";
			if (!alignList.includes("C") && !alignList.includes("NX")) return "any lawful alignment";
			if (!alignList.includes("E") && !alignList.includes("NY")) return "any good alignment";
		}
		throw new Error(`Unmapped alignment: ${JSON.stringify(alignList)}`);
	}
};

Parser.weightToFull = function (lbs, isSmallUnit) {
	const tons = Math.floor(lbs / 2000);
	lbs = lbs - (2000 * tons);
	return [
		tons ? `${tons}${isSmallUnit ? `<span class="ve-small ml-1">` : " "}ton${tons === 1 ? "" : "s"}${isSmallUnit ? `</span>` : ""}` : null,
		lbs ? `${lbs}${isSmallUnit ? `<span class="ve-small ml-1">` : " "}lb.${isSmallUnit ? `</span>` : ""}` : null,
	].filter(Boolean).join(", ");
};

Parser.ITEM_RARITIES = ["none", "common", "uncommon", "rare", "very rare", "legendary", "artifact", "unknown", "unknown (magic)", "other"];

Parser.CAT_ID_CREATURE = 1;
Parser.CAT_ID_SPELL = 2;
Parser.CAT_ID_BACKGROUND = 3;
Parser.CAT_ID_ITEM = 4;
Parser.CAT_ID_CLASS = 5;
Parser.CAT_ID_CONDITION = 6;
Parser.CAT_ID_FEAT = 7;
Parser.CAT_ID_RITUAL = 8;
Parser.CAT_ID_VEHICLE = 9;
Parser.CAT_ID_ANCESTRY = 10;
Parser.CAT_ID_VARIANT_RULE = 12;
Parser.CAT_ID_ADVENTURE = 13;
Parser.CAT_ID_DEITY = 14;
Parser.CAT_ID_HAZARD = 17;
Parser.CAT_ID_QUICKREF = 18;
Parser.CAT_ID_AFFLICTION = 21;
Parser.CAT_ID_TABLE = 24;
Parser.CAT_ID_TABLE_GROUP = 25;
Parser.CAT_ID_CLASS_FEATURE = 30;
Parser.CAT_ID_SUBCLASS = 40;
Parser.CAT_ID_SUBCLASS_FEATURE = 41;
Parser.CAT_ID_ACTION = 42;
Parser.CAT_ID_ABILITY = 48;
Parser.CAT_ID_LANGUAGE = 43;
Parser.CAT_ID_BOOK = 44;
Parser.CAT_ID_PAGE = 45;
Parser.CAT_ID_TRAIT = 46;
Parser.CAT_ID_ARCHETYPE = 47;

Parser.CAT_ID_TO_FULL = {};
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CREATURE] = "Bestiary";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SPELL] = "Spell";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RITUAL] = "Ritual";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE] = "Vehicle";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BACKGROUND] = "Background";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ITEM] = "Item";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS] = "Class";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CONDITION] = "Condition";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FEAT] = "Feat";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ANCESTRY] = "Ancestry";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARCHETYPE] = "Archetype";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VARIANT_RULE] = "Variant Rule";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ADVENTURE] = "Adventure";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DEITY] = "Deity";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_HAZARD] = "Hazard";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_QUICKREF] = "Quick Reference";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_AFFLICTION] = "Affliction";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE_GROUP] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS_FEATURE] = "Class Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS] = "Subclass";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS_FEATURE] = "Subclass Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ACTION] = "Action";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ABILITY] = "Creature Ability";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_LANGUAGE] = "Language";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BOOK] = "Book";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PAGE] = "Page";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TRAIT] = "Trait";

Parser.pageCategoryToFull = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_FULL, catId);
};

Parser.CAT_ID_TO_PROP = {};
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CREATURE] = "creature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SPELL] = "spell";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RITUAL] = "ritual";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE] = "vehicle";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BACKGROUND] = "background";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ITEM] = "item";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS] = "class";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CONDITION] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FEAT] = "feat";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ANCESTRY] = "ancestry";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARCHETYPE] = "archetype";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VARIANT_RULE] = "variantrule";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ADVENTURE] = "adventure";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DEITY] = "deity";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_HAZARD] = "hazard";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_AFFLICTION] = "affliction";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE] = "table";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_QUICKREF] = null;
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS_FEATURE] = "classFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS] = "subclass";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS_FEATURE] = "subclassFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ACTION] = "action";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ABILITY] = "ability";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_LANGUAGE] = "language";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BOOK] = "book";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TRAIT] = "trait";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PAGE] = null;

Parser.pageCategoryToProp = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_PROP, catId);
};

Parser.ABIL_ABVS = ["str", "dex", "con", "int", "wis", "cha"];

Parser.spClassesToCurrentAndLegacy = function (classes) {
	const current = [];
	const legacy = [];
	classes.fromClassList.forEach(cls => {
		if ((cls.name === "Artificer" && cls.source === "UAArtificer") || (cls.name === "Artificer (Revisited)" && cls.source === "UAArtificerRevisited")) legacy.push(cls);
		else current.push(cls);
	});
	return [current, legacy];
};

/**
 * Build a pair of strings; one with all current subclasses, one with all legacy subclasses
 *
 * @param classes a spell.classes JSON item
 * @param subclassLookup Data loaded from `generated/gendata-subclass-lookup.json`. Of the form: `{PHB: {Barbarian: {PHB: {Berserker: "Path of the Berserker"}}}}`
 * @returns {*[]} A two-element array. First item is a string of all the current subclasses, second item a string of
 * all the legacy/superceded subclasses
 */
Parser.spSubclassesToCurrentAndLegacyFull = function (classes, subclassLookup) {
	const out = [[], []];
	if (!classes.fromSubclass) return out;
	const curNames = new Set();
	const toCheck = [];
	classes.fromSubclass
		.filter(c => {
			const excludeClass = ExcludeUtil.isExcluded(c.class.name, "class", c.class.source);
			if (excludeClass) {
				return false;
			}
			const fromLookup = MiscUtil.get(subclassLookup, c.class.source, c.class.name, c.subclass.source, c.subclass.name);
			const excludeSubclass = ExcludeUtil.isExcluded((fromLookup || {}).name || c.subclass.name, "subclass", c.subclass.source);
			if (excludeSubclass) {
				return false;
			}
			return true;
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.subclass.name, b.subclass.name);
			return byName || SortUtil.ascSort(a.class.name, b.class.name);
		})
		.forEach(c => {
			const nm = c.subclass.name;
			const src = c.subclass.source;
			const toAdd = Parser._spSubclassItem(c, false, subclassLookup);

			const fromLookup = MiscUtil.get(
				subclassLookup,
				c.class.source,
				c.class.name,
				c.subclass.source,
				c.subclass.name,
			);

			if (fromLookup && fromLookup.isReprinted) {
				out[1].push(toAdd);
			} else if (Parser.sourceJsonToFull(src).startsWith(UA_PREFIX) || Parser.sourceJsonToFull(src).startsWith(PS_PREFIX)) {
				const cleanName = mapClassShortNameToMostRecent(nm.split("(")[0].trim().split(/v\d+/)[0].trim());
				toCheck.push({"name": cleanName, "ele": toAdd});
			} else {
				out[0].push(toAdd);
				curNames.add(nm);
			}
		});
	toCheck.forEach(n => {
		if (curNames.has(n.name)) {
			out[1].push(n.ele);
		} else {
			out[0].push(n.ele);
		}
	});
	return [out[0].join(", "), out[1].join(", ")];

	/**
	 * Get the most recent iteration of a subclass name
	 */
	function mapClassShortNameToMostRecent (shortName) {
		switch (shortName) {
			case "Favored Soul":
				return "Divine Soul";
			case "Undying Light":
				return "Celestial";
			case "Deep Stalker":
				return "Gloom Stalker";
		}
		return shortName;
	}
};

Parser.attackTypeToFull = function (attackType) {
	return Parser._parse_aToB(Parser.ATK_TYPE_TO_FULL, attackType);
};

Parser.trapHazTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.TRAP_HAZARD_TYPE_TO_FULL, type);
};

Parser.TRAP_HAZARD_TYPE_TO_FULL = {
	MECH: "Mechanical trap",
	MAG: "Magical trap",
	SMPL: "Simple trap",
	CMPX: "Complex trap",
	HAZ: "Hazard",
	WTH: "Weather",
	ENV: "Environmental Hazard",
	WLD: "Wilderness Hazard",
	GEN: "Generic",
};

Parser.tierToFullLevel = function (tier) {
	return Parser._parse_aToB(Parser.TIER_TO_FULL_LEVEL, tier);
};

Parser.TIER_TO_FULL_LEVEL = {};
Parser.TIER_TO_FULL_LEVEL[1] = "level 1\u20144";
Parser.TIER_TO_FULL_LEVEL[2] = "level 5\u201410";
Parser.TIER_TO_FULL_LEVEL[3] = "level 11\u201416";
Parser.TIER_TO_FULL_LEVEL[4] = "level 17\u201420";

Parser.threatToFull = function (threat) {
	return Parser._parse_aToB(Parser.THREAT_TO_FULL, threat);
};

Parser.THREAT_TO_FULL = {};
Parser.THREAT_TO_FULL[1] = "moderate";
Parser.THREAT_TO_FULL[2] = "dangerous";
Parser.THREAT_TO_FULL[3] = "deadly";

Parser.trapInitToFull = function (init) {
	return Parser._parse_aToB(Parser.TRAP_INIT_TO_FULL, init);
};

Parser.TRAP_INIT_TO_FULL = {};
Parser.TRAP_INIT_TO_FULL[1] = "initiative count 10";
Parser.TRAP_INIT_TO_FULL[2] = "initiative count 20";
Parser.TRAP_INIT_TO_FULL[3] = "initiative count 20 and initiative count 10";

Parser.ATK_TYPE_TO_FULL = {};
Parser.ATK_TYPE_TO_FULL["MW"] = "Melee Weapon Attack";
Parser.ATK_TYPE_TO_FULL["RW"] = "Ranged Weapon Attack";

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

Parser.TM_A = "single";
Parser.TM_AA = "double";
Parser.TM_AAA = "triple";
Parser.TM_R = "reaction";
Parser.TM_F = "free";
Parser.TM_ROUND = "round";
Parser.TM_MINS = "minute";
Parser.TM_HRS = "hour";
Parser.TM_DAYS = "day";
Parser.TIME_ACTIONS = [Parser.TM_A, Parser.TM_AA, Parser.TM_AAA, Parser.TM_R, Parser.TM_F]
Parser.TIME_SINGLETONS = [Parser.TM_A, Parser.TM_AA, Parser.TM_AAA, Parser.TM_R, Parser.TM_F, Parser.TM_ROUND];
Parser.TIME_TO_FULL = {
	[Parser.TM_A]: "Single Action",
	[Parser.TM_AA]: "Double Action",
	[Parser.TM_AAA]: "Triple Action",
	[Parser.TM_R]: "Reaction",
	[Parser.TM_F]: "Free Action",
	[Parser.TM_ROUND]: "Rounds",
	[Parser.TM_MINS]: "Minutes",
	[Parser.TM_HRS]: "Hours",
	[Parser.TM_DAYS]: "Days",
};
Parser.timeUnitToFull = function (timeUnit) {
	return Parser._parse_aToB(Parser.TIME_TO_FULL, timeUnit);
};

Parser.TIME_TO_ABV = {
	[Parser.TM_A]: "A",
	[Parser.TM_AA]: "AA",
	[Parser.TM_AAA]: "AAA",
	[Parser.TM_R]: "R",
	[Parser.TM_F]: "F",
	[Parser.TM_ROUND]: "rnd",
	[Parser.TM_MINS]: "min",
	[Parser.TM_HRS]: "hr",
};
Parser.timeUnitToAbv = function (timeUnit) {
	return Parser._parse_aToB(Parser.TIME_TO_ABV, timeUnit);
};

Parser.timeToShort = function (time, isHtml) {
	if (!time) return "";
	return (time.number === 1 && Parser.TIME_SINGLETONS.includes(time.unit))
		? `${Parser.timeUnitToAbv(time.unit).uppercaseFirst()}${time.condition ? "*" : ""}`
		: `${time.number} ${isHtml ? `<span class="ve-small">` : ""}${Parser.timeUnitToAbv(time.unit)}${isHtml ? `</span>` : ""}${time.condition ? "*" : ""}`;
};

Parser.getNormalisedTime = function (time) {
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
	}
	return (multiplier * time.number) + offset;
};

Parser.INCHES_PER_FOOT = 12;
Parser.FEET_PER_MILE = 5280;

Parser.getNormalisedRange = function (range) {
	let multiplier = 1;
	let distance = 0;
	let offset = 0;

	switch (range.type) {
		case RNG_SPECIAL: return 1000000000;
		case RNG_POINT: adjustForDistance(); break;
		case RNG_LINE: offset = 1; adjustForDistance(); break;
		case RNG_CONE: offset = 2; adjustForDistance(); break;
		case RNG_RADIUS: offset = 3; adjustForDistance(); break;
		case RNG_HEMISPHERE: offset = 4; adjustForDistance(); break;
		case RNG_SPHERE: offset = 5; adjustForDistance(); break;
		case RNG_CYLINDER: offset = 6; adjustForDistance(); break;
		case RNG_CUBE: offset = 7; adjustForDistance(); break;
	}

	// value in inches, to allow greater granularity
	return (multiplier * distance) + offset;

	function adjustForDistance () {
		const dist = range.distance;
		switch (dist.type) {
			case null: distance = 0; break;
			case UNT_FEET: multiplier = Parser.INCHES_PER_FOOT; distance = dist.amount; break;
			case UNT_MILES: multiplier = Parser.INCHES_PER_FOOT * Parser.FEET_PER_MILE; distance = dist.amount; break;
			case RNG_TOUCH: distance = 1; break;
			case RNG_UNLIMITED_SAME_PLANE: distance = 900000000; break; // from BolS (homebrew)
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
	}
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

SZ_FINE = "F";
SZ_DIMINUTIVE = "D";
SZ_TINY = "T";
SZ_SMALL = "S";
SZ_MEDIUM = "M";
SZ_LARGE = "L";
SZ_HUGE = "H";
SZ_GARGANTUAN = "G";
SZ_COLOSSAL = "C";
SZ_VARIES = "V";
Parser.SIZE_ABVS = [SZ_TINY, SZ_SMALL, SZ_MEDIUM, SZ_LARGE, SZ_HUGE, SZ_GARGANTUAN, SZ_VARIES];
Parser.SIZE_ABV_TO_FULL = {};
Parser.SIZE_ABV_TO_FULL[SZ_FINE] = "Fine";
Parser.SIZE_ABV_TO_FULL[SZ_DIMINUTIVE] = "Diminutive";
Parser.SIZE_ABV_TO_FULL[SZ_TINY] = "Tiny";
Parser.SIZE_ABV_TO_FULL[SZ_SMALL] = "Small";
Parser.SIZE_ABV_TO_FULL[SZ_MEDIUM] = "Medium";
Parser.SIZE_ABV_TO_FULL[SZ_LARGE] = "Large";
Parser.SIZE_ABV_TO_FULL[SZ_HUGE] = "Huge";
Parser.SIZE_ABV_TO_FULL[SZ_GARGANTUAN] = "Gargantuan";
Parser.SIZE_ABV_TO_FULL[SZ_COLOSSAL] = "Colossal";
Parser.SIZE_ABV_TO_FULL[SZ_VARIES] = "Varies";

Parser.ARMOR_ABV_TO_FULL = {
	"l.": "light",
	"m.": "medium",
	"h.": "heavy",
};

Parser.CONDITION_TO_COLOR = {
	"Blinded": "#525252",
	"Charmed": "#f01789",
	"Deafened": "#ababab",
	"Exhausted": "#947a47",
	"Frightened": "#c9ca18",
	"Grappled": "#8784a0",
	"Incapacitated": "#3165a0",
	"Invisible": "#7ad2d6",
	"Paralyzed": "#c00900",
	"Petrified": "#a0a0a0",
	"Poisoned": "#4dc200",
	"Prone": "#5e60a0",
	"Restrained": "#d98000",
	"Stunned": "#a23bcb",
	"Unconscious": "#3a40ad",

	"Concentration": "#009f7a",
};

SRC_CRB = "CRB";
SRC_APG = "APG";
SRC_BST = "BST";
SRC_GMG = "GMG";
SRC_LOCG = "LOCG"
SRC_LOGM = "LOGM"

SRC_3PP_SUFFIX = " 3pp";

LO_PREFIX = "Lost Omens: ";
LO_PREFIX_SHORT = "LO: ";

Parser.SOURCE_JSON_TO_FULL = {};
Parser.SOURCE_JSON_TO_FULL[SRC_CRB] = "Core Rulebook";
Parser.SOURCE_JSON_TO_FULL[SRC_APG] = "Advanced Player's Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_BST] = "Bestiary";
Parser.SOURCE_JSON_TO_FULL[SRC_GMG] = "Gamemastery Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_LOCG] = "Lost Omens: Character Guide";
Parser.SOURCE_JSON_TO_FULL[SRC_LOGM] = "Lost Omens: Gods & Magic";

Parser.SOURCE_JSON_TO_ABV = {};
Parser.SOURCE_JSON_TO_ABV[SRC_CRB] = "CRB";
Parser.SOURCE_JSON_TO_ABV[SRC_APG] = "APG";
Parser.SOURCE_JSON_TO_ABV[SRC_BST] = "BST";
Parser.SOURCE_JSON_TO_ABV[SRC_GMG] = "GMG";
Parser.SOURCE_JSON_TO_ABV[SRC_LOCG] = "LOCG";
Parser.SOURCE_JSON_TO_ABV[SRC_LOGM] = "LOGM";

Parser.SOURCE_JSON_TO_DATE = {};
Parser.SOURCE_JSON_TO_DATE[SRC_CRB] = "2019-08-01";
Parser.SOURCE_JSON_TO_DATE[SRC_APG] = "2020-08-30";
Parser.SOURCE_JSON_TO_DATE[SRC_BST] = "2019-08-01";
Parser.SOURCE_JSON_TO_DATE[SRC_GMG] = "2020-02-26";
Parser.SOURCE_JSON_TO_DATE[SRC_LOCG] = "2019-10-16";
Parser.SOURCE_JSON_TO_DATE[SRC_LOGM] = "2019-01-29";

Parser.SOURCES_ADVENTURES = new Set([]);
Parser.SOURCES_CORE_SUPPLEMENTS = new Set(Object.keys(Parser.SOURCE_JSON_TO_FULL).filter(it => !Parser.SOURCES_ADVENTURES.has(it)));

Parser.SOURCES_AVAILABLE_DOCS_BOOK = {};
[
	SRC_CRB,
	SRC_APG,
	SRC_BST,
	SRC_GMG,
	SRC_LOCG,
	SRC_LOGM,
].forEach(src => {
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src] = src;
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src.toLowerCase()] = src;
});
Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE = {};
[].forEach(src => {
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
	"itemcurse": SRC_GMG,
	"background": SRC_CRB,
	"ancestry": SRC_CRB,
	"archetype": SRC_CRB,
	"feat": SRC_CRB,
	"trap": SRC_CRB,
	"hazard": SRC_CRB,
	"deity": SRC_CRB,
	"variantrule": SRC_CRB,
	"action": SRC_CRB,
	"ability": SRC_BST,
	"classFeature": SRC_CRB,
	"subclassFeature": SRC_CRB,
	"table": SRC_CRB,
	"language": SRC_CRB,
	"ritual": SRC_CRB,
	"trait": SRC_CRB,
	"vehicle": SRC_GMG,
};
Parser.getTagSource = function (tag, source) {
	if (source && source.trim()) return source;
	tag = tag.trim();
	if (tag.startsWith("@")) tag = tag.slice(1);

	if (!Parser.TAG_TO_DEFAULT_SOURCE[tag]) throw new Error(`Unhandled tag "${tag}"`);
	return Parser.TAG_TO_DEFAULT_SOURCE[tag];
};

TR_AC = "Arcane";
TR_DV = "Divine";
TR_OC = "Occult";
TR_PR = "Primal";
Parser.TRADITIONS = [TR_AC, TR_DV, TR_OC, TR_PR];

T_CHAOTIC = "Chaotic";
T_EVIL = "Evil";
T_GOOD = "Good";
T_LAWFUL = "Lawful";
T_AASIMAR = "Aasimar";
T_CATFOLK = "Catfolk";
T_CHANGELING = "Changeling";
T_DHAMPIR = "Dhampir";
T_DUSKWALKER = "Duskwalker";
T_DWARF = "Dwarf";
T_ELF = "Elf";
T_GNOME = "Gnome";
T_GOBLIN = "Goblin";
T_HALFELF = "Half-Elf";
T_HALFLING = "Halfling";
T_HALFORC = "Half-Orc";
T_HOBGOBLIN = "Hobgoblin";
T_HUMAN = "Human";
T_KOBOLD = "Kobold";
T_LESHY = "Leshy";
T_LIZARDFOLK = "Lizardfolk";
T_ORC = "Orc";
T_RATFOLK = "Ratfolk";
T_SHOONY = "Shoony";
T_TENGU = "Tengu";
T_TIEFLING = "Tiefling";
T_BULWARK = "Bulwark";
T_COMFORT = "Comfort";
T_FLEXIBLE = "Flexible";
T_NOISY = "Noisy";
T_ALCHEMIST = "Alchemist";
T_BARBARIAN = "Barbarian";
T_BARD = "Bard";
T_CHAMPION = "Champion";
T_CLERIC = "Cleric";
T_DRUID = "Druid";
T_FIGHTER = "Fighter";
T_INVESTIGATOR = "Investigator";
T_MONK = "Monk";
T_ORACLE = "Oracle";
T_RANGER = "Ranger";
T_ROGUE = "Rogue";
T_SORCERER = "Sorcerer";
T_SWASHBUCKLER = "Swashbuckler";
T_WITCH = "Witch";
T_WIZARD = "Wizard";
T_ABERRATION = "Aberration";
T_ANIMAL = "Animal";
T_ASTRAL = "Astral";
T_BEAST = "Beast";
T_CELESTIAL = "Celestial";
T_CONSTRUCT = "Construct";
T_DRAGON = "Dragon";
T_DREAM = "Dream";
T_ELEMENTAL = "Elemental";
T_ETHEREAL = "Ethereal";
T_FEY = "Fey";
T_FIEND = "Fiend";
T_FUNGUS = "Fungus";
T_GIANT = "Giant";
T_HUMANOID = "Humanoid";
T_MONITOR = "Monitor";
T_NEGATIVE = "Negative";
T_OOZE = "Ooze";
T_PETITIONER = "Petitioner";
T_PLANT = "Plant";
T_POSITIVE = "Positive";
T_SPIRIT = "Spirit";
T_TIME = "Time";
T_UNDEAD = "Undead";
T_AIR = "Air";
T_EARTH = "Earth";
T_FIRE = "Fire";
T_WATER = "Water";
T_ACID = "Acid";
T_COLD = "Cold";
T_ELECTRICITY = "Electricity";
T_FIRE = "Fire";
T_FORCE = "Force";
T_NEGATIVE = "Negative";
T_POSITIVE = "Positive";
T_SONIC = "Sonic";
T_ALCHEMICAL = "Alchemical";
T_APEX = "Apex";
T_ARTIFACT = "Artifact";
T_BOMB = "Bomb";
T_CONSUMABLE = "Consumable";
T_CONTRACT = "Contract";
T_CURSED = "Cursed";
T_DRUG = "Drug";
T_ELIXIR = "Elixir";
T_INTELLIGENT = "Intelligent";
T_INVESTED = "Invested";
T_MUTAGEN = "Mutagen";
T_OIL = "Oil";
T_POTION = "Potion";
T_SAGGORAK = "Saggorak";
T_SCROLL = "Scroll";
T_SNARE = "Snare";
T_STAFF = "Staff";
T_STRUCTURE = "Structure";
T_TALISMAN = "Talisman";
T_TATTOO = "Tattoo";
T_WAND = "Wand";
T_AASIMAR = "Aasimar";
T_ACID = "Acid";
T_AEON = "Aeon";
T_AIR = "Air";
T_ALCHEMICAL = "Alchemical";
T_AMPHIBIOUS = "Amphibious";
T_ANADI = "Anadi";
T_ANGEL = "Angel";
T_AQUATIC = "Aquatic";
T_ARCHON = "Archon";
T_AZATA = "Azata";
T_BOGGARD = "Boggard";
T_CALIGNI = "Caligni";
T_CATFOLK = "Catfolk";
T_CHANGELING = "Changeling";
T_CHARAUKA = "Charau-ka";
T_COLD = "Cold";
T_COUATL = "Couatl";
T_DAEMON = "Daemon";
T_DEMON = "Demon";
T_DERO = "Dero";
T_DEVIL = "Devil";
T_DHAMPIR = "Dhampir";
T_DINOSAUR = "Dinosaur";
T_DROW = "Drow";
T_DUERGAR = "Duergar";
T_DUSKWALKER = "Duskwalker";
T_EARTH = "Earth";
T_ELECTRICITY = "Electricity";
T_FETCHLING = "Fetchling";
T_FIRE = "Fire";
T_GENIE = "Genie";
T_GHOST = "Ghost";
T_GHOUL = "Ghoul";
T_GNOLL = "Gnoll";
T_GOLEM = "Golem";
T_GREMLIN = "Gremlin";
T_GRIPPLI = "Grippli";
T_HAG = "Hag";
T_IFRIT = "Ifrit";
T_INCORPOREAL = "Incorporeal";
T_INEVITABLE = "Inevitable";
T_KOBOLD = "Kobold";
T_LESHY = "Leshy";
T_LIZARDFOLK = "Lizardfolk";
T_MERFOLK = "Merfolk";
T_MINDLESS = "Mindless";
T_MORLOCK = "Morlock";
T_MUMMY = "Mummy";
T_MUTANT = "Mutant";
T_NYMPH = "Nymph";
T_ONI = "Oni";
T_ORC = "Orc";
T_OREAD = "Oread";
T_PROTEAN = "Protean";
T_PSYCHOPOMP = "Psychopomp";
T_QLIPPOTH = "Qlippoth";
T_RAKSHASA = "Rakshasa";
T_RATFOLK = "Ratfolk";
T_SEA = "Sea";
T_DEVIL = "Devil";
T_SERPENTFOLK = "Serpentfolk";
T_SKELETON = "Skeleton";
T_SKULK = "Skulk";
T_SONIC = "Sonic";
T_SOULBOUND = "Soulbound";
T_SPRIGGAN = "Spriggan";
T_SPRITE = "Sprite";
T_SULI = "Suli";
T_SWARM = "Swarm";
T_SYLPH = "Sylph";
T_TANE = "Tane";
T_TENGU = "Tengu";
T_TIEFLING = "Tiefling";
T_TITAN = "Titan";
T_TROLL = "Troll";
T_UNDINE = "Undine";
T_URDEFHAN = "Urdefhan";
T_VAMPIRE = "Vampire";
T_VELSTRAC = "Velstrac";
T_WATER = "Water";
T_WERECREATURE = "Werecreature";
T_WIGHT = "Wight";
T_WRAITH = "Wraith";
T_XULGATH = "Xulgath";
T_ZOMBIE = "Zombie";
T_AIR = "Air";
T_EARTH = "Earth";
T_ERRATIC = "Erratic";
T_FINITE = "Finite";
T_FIRE = "Fire";
T_FLOWING = "Flowing";
T_HIGH = "High";
T_GRAVITY = "Gravity";
T_IMMEASURABLE = "Immeasurable";
T_LOW = "Low";
T_GRAVITY = "Gravity";
T_METAMORPHIC = "Metamorphic";
T_MICROGRAVITY = "Microgravity";
T_NEGATIVE = "Negative";
T_POSITIVE = "Positive";
T_SENTIENT = "Sentient";
T_SHADOW = "Shadow";
T_STATIC = "Static";
T_STRANGE = "Strange";
T_GRAVITY = "Gravity";
T_SUBJECTIVE = "Subjective";
T_GRAVITY = "Gravity";
T_TIMELESS = "Timeless";
T_UNBOUNDED = "Unbounded";
T_WATER = "Water";
T_CONTACT = "Contact";
T_INGESTED = "Ingested";
T_INHALED = "Inhaled";
T_INJURY = "Injury";
T_POISON = "Poison";
T_COMMON = "Common";
T_RARE = "Rare";
T_UNCOMMON = "Uncommon";
T_UNIQUE = "Unique";
T_ABJURATION = "Abjuration";
T_CONJURATION = "Conjuration";
T_DIVINATION = "Divination";
T_ENCHANTMENT = "Enchantment";
T_EVOCATION = "Evocation";
T_ILLUSION = "Illusion";
T_NECROMANCY = "Necromancy";
T_TRANSMUTATION = "Transmutation";
T_AUDITORY = "Auditory";
T_OLFACTORY = "Olfactory";
T_VISUAL = "Visual";
T_CITY = "City";
T_METROPOLIS = "Metropolis";
T_TOWN = "Town";
T_VILLAGE = "Village";
T_ARCANE = "Arcane";
T_DIVINE = "Divine";
T_OCCULT = "Occult";
T_PRIMAL = "Primal";
T_AGILE = "Agile";
T_ATTACHED = "Attached";
T_BACKSTABBER = "Backstabber";
T_BACKSWING = "Backswing";
T_BRUTAL = "Brutal";
T_CONCEALABLE = "Concealable";
T_DEADLY = "Deadly";
T_DISARM = "Disarm";
T_DWARF = "Dwarf";
T_ELF = "Elf";
T_FATAL = "Fatal";
T_FINESSE = "Finesse";
T_FORCEFUL = "Forceful";
T_FREEHAND = "Free-Hand";
T_GNOME = "Gnome";
T_GOBLIN = "Goblin";
T_GRAPPLE = "Grapple";
T_HALFLING = "Halfling";
T_JOUSTING = "Jousting";
T_MODULAR = "Modular";
T_MONK = "Monk";
T_NONLETHAL = "Nonlethal";
T_PARRY = "Parry";
T_PROPULSIVE = "Propulsive";
T_RANGE = "Range";
T_RANGE_INCREMENT = "Range increment";
T_RANGED = "Ranged";
T_TRIP = "Trip";
T_REACH = "Reach";
T_SHOVE = "Shove";
T_SWEEP = "Sweep";
T_TETHERED = "Tethered";
T_THROWN = "Thrown";
T_TRIP = "Trip";
T_TWIN = "Twin";
T_TWOHAND = "Two-Hand";
T_UNARMED = "Unarmed";
T_VERSATILE = "Versatile";
T_VOLLE = "Volle";
T_ADDITIVE = "Additive";
T_ARCHETYPE = "Archetype";
T_ATTACK = "Attack";
T_AURA = "Aura";
T_CANTRIP = "Cantrip";
T_CHARM = "Charm";
T_COMPANION = "Companion";
T_COMPLEX = "Complex";
T_COMPOSITION = "Composition";
T_CONCENTRATE = "Concentrate";
T_CONSECRATION = "Consecration";
T_CURSE = "Curse";
T_CURSEBOUND = "Cursebound";
T_DARKNESS = "Darkness";
T_DEATH = "Death";
T_DEDICATION = "Dedication";
T_DETECTION = "Detection";
T_DISEASE = "Disease";
T_DOWNTIME = "Downtime";
T_EMOTION = "Emotion";
T_ENVIRONMENTAL = "Environmental";
T_EXPLORATION = "Exploration";
T_EXTRADIMENSIONAL = "Extradimensional";
T_FEAR = "Fear";
T_FINISHER = "Finisher";
T_FLOURISH = "Flourish";
T_FOCUSED = "Focused";
T_FORTUNE = "Fortune";
T_GENERAL = "General";
T_HAUNT = "Haunt";
T_HEALING = "Healing";
T_HEX = "Hex";
T_INCAPACITATION = "Incapacitation";
T_INFUSED = "Infused";
T_INSTINCT = "Instinct";
T_LEGACY = "Legacy";
T_LIGHT = "Light";
T_LINEAGE = "Lineage";
T_LINGUISTIC = "Linguistic";
T_LITANY = "Litany";
T_MAGICAL = "Magical";
T_MANIPULATE = "Manipulate";
T_MECHANICAL = "Mechanical";
T_MENTAL = "Mental";
T_METAMAGIC = "Metamagic";
T_MINION = "Minion";
T_MISFORTUNE = "Misfortune";
T_MORPH = "Morph";
T_MOVE = "Move";
T_MULTICLASS = "Multiclass";
T_OATH = "Oath";
T_OPEN = "Open";
T_POLYMORPH = "Polymorph";
T_POSSESSION = "Possession";
T_PRECIOUS = "Precious";
T_PREDICTION = "Prediction";
T_PRESS = "Press";
T_RAGE = "Rage";
T_RECKLESS = "Reckless";
T_RELOAD = "Reload";
T_REVELATION = "Revelation";
T_SCRYING = "Scrying";
T_SECRET = "Secret";
T_SKILL = "Skill";
T_SLEEP = "Sleep";
T_SOCIAL = "Social";
T_SPLASH = "Splash";
T_STAMINA = "Stamina";
T_STANCE = "Stance";
T_SUMMONED = "Summoned";
T_TELEPATHY = "Telepathy";
T_TELEPORTATION = "Teleportation";
T_TRAP = "Trap";
T_VIGILANTE = "Vigilante";
T_VIRULENT = "Virulent";
T_VOCA = "Voca";
T_LG = "LG";
T_NG = "NG";
T_CG = "CG";
T_LN = "LN";
T_N = "N";
T_CN = "CN";
T_LE = "LE";
T_NE = "NE";
T_CE = "CE";
T_ANY = "ANY";
T_TINY = "Tiny";
T_SMALL = "Small";
T_MEDIUM = "Medium";
T_LARGE = "Large";
T_HUGE = "Huge";
T_GARGANTUAN = "Gargantuan";

Parser.TRAITS_GENERAL = [T_ADDITIVE, T_ARCHETYPE, T_ATTACK, T_AURA, T_CANTRIP, T_CHARM, T_COMPANION, T_COMPLEX, T_COMPOSITION, T_CONCENTRATE, T_CONSECRATION, T_CURSE, T_CURSEBOUND, T_DARKNESS, T_DEATH, T_DEDICATION, T_DETECTION, T_DISEASE, T_DOWNTIME, T_EMOTION, T_ENVIRONMENTAL, T_EXPLORATION, T_EXTRADIMENSIONAL, T_FEAR, T_FINISHER, T_FLOURISH, T_FOCUSED, T_FORTUNE, T_GENERAL, T_HAUNT, T_HEALING, T_HEX, T_INCAPACITATION, T_INFUSED, T_INSTINCT, T_LEGACY, T_LIGHT, T_LINEAGE, T_LINGUISTIC, T_LITANY, T_MAGICAL, T_MANIPULATE, T_MECHANICAL, T_MENTAL, T_METAMAGIC, T_MINION, T_MISFORTUNE, T_MORPH, T_MOVE, T_MULTICLASS, T_OATH, T_OPEN, T_POLYMORPH, T_POSSESSION, T_PRECIOUS, T_PREDICTION, T_PRESS, T_RAGE, T_RECKLESS, T_RELOAD, T_REVELATION, T_SCRYING, T_SECRET, T_SKILL, T_SLEEP, T_SOCIAL, T_SPLASH, T_STAMINA, T_STANCE, T_SUMMONED, T_TELEPATHY, T_TELEPORTATION, T_TRAP, T_VIGILANTE, T_VIRULENT, T_VOCA]
Parser.TRAITS_WEAPON = [T_AGILE, T_ATTACHED, T_BACKSTABBER, T_BACKSWING, T_BRUTAL, T_CONCEALABLE, T_DEADLY, T_DISARM, T_FATAL, T_FINESSE, T_FORCEFUL, T_FREEHAND, T_GRAPPLE, T_JOUSTING, T_MODULAR, T_NONLETHAL, T_PARRY, T_PROPULSIVE, T_RANGE, T_RANGE_INCREMENT, T_RANGED, T_TRIP, T_REACH, T_SHOVE, T_SWEEP, T_TETHERED, T_THROWN, T_TRIP, T_TWIN, T_TWOHAND, T_UNARMED, T_VERSATILE, T_VOLLE]
Parser.TRAITS_TRADITION = [T_ARCANE, T_DIVINE, T_OCCULT, T_PRIMAL]
Parser.TRAITS_SETTLEMENT = [T_CITY, T_METROPOLIS, T_TOWN, T_VILLAGE]
Parser.TRAITS_SENSE = [T_AUDITORY, T_OLFACTORY, T_VISUAL]
Parser.TRAITS_SCHOOL = [T_ABJURATION, T_CONJURATION, T_DIVINATION, T_ENCHANTMENT, T_EVOCATION, T_ILLUSION, T_NECROMANCY, T_TRANSMUTATION]
Parser.TRAITS_RARITY = [T_COMMON, T_UNCOMMON, T_RARE, T_UNIQUE]
Parser.TRAITS_POISON = [T_CONTACT, T_INGESTED, T_INHALED, T_INJURY, T_POISON]
Parser.TRAITS_PLANAR = [T_AIR, T_EARTH, T_ERRATIC, T_FINITE, T_FIRE, T_FLOWING, T_HIGH, T_GRAVITY, T_IMMEASURABLE, T_LOW, T_GRAVITY, T_METAMORPHIC, T_MICROGRAVITY, T_NEGATIVE, T_POSITIVE, T_SENTIENT, T_SHADOW, T_STATIC, T_STRANGE, T_GRAVITY, T_SUBJECTIVE, T_GRAVITY, T_TIMELESS, T_UNBOUNDED, T_WATER]
Parser.TRAITS_ELEMENTAL = [T_AIR, T_EARTH, T_FIRE, T_WATER]
Parser.TRAITS_CREATURE = [T_AASIMAR, T_ACID, T_AEON, T_AIR, T_ALCHEMICAL, T_AMPHIBIOUS, T_ANADI, T_ANGEL, T_AQUATIC, T_ARCHON, T_AZATA, T_BOGGARD, T_CALIGNI, T_CATFOLK, T_CHANGELING, T_CHARAUKA, T_COLD, T_COUATL, T_DAEMON, T_DEMON, T_DERO, T_DEVIL, T_DHAMPIR, T_DINOSAUR, T_DROW, T_DUERGAR, T_DUSKWALKER, T_EARTH, T_ELECTRICITY, T_FETCHLING, T_FIRE, T_GENIE, T_GHOST, T_GHOUL, T_GNOLL, T_GOLEM, T_GREMLIN, T_GRIPPLI, T_HAG, T_IFRIT, T_INCORPOREAL, T_INEVITABLE, T_KOBOLD, T_LESHY, T_LIZARDFOLK, T_MERFOLK, T_MINDLESS, T_MORLOCK, T_MUMMY, T_MUTANT, T_NYMPH, T_ONI, T_ORC, T_OREAD, T_PROTEAN, T_PSYCHOPOMP, T_QLIPPOTH, T_RAKSHASA, T_RATFOLK, T_SEA, T_DEVIL, T_SERPENTFOLK, T_SKELETON, T_SKULK, T_SONIC, T_SOULBOUND, T_SPRIGGAN, T_SPRITE, T_SULI, T_SWARM, T_SYLPH, T_TANE, T_TENGU, T_TIEFLING, T_TITAN, T_TROLL, T_UNDINE, T_URDEFHAN, T_VAMPIRE, T_VELSTRAC, T_WATER, T_WERECREATURE, T_WIGHT, T_WRAITH, T_XULGATH, T_ZOMBIE]
Parser.TRAITS_EQUIPMENT = [T_ALCHEMICAL, T_APEX, T_ARTIFACT, T_BOMB, T_CONSUMABLE, T_CONTRACT, T_CURSED, T_DRUG, T_ELIXIR, T_INTELLIGENT, T_INVESTED, T_MUTAGEN, T_OIL, T_POTION, T_SAGGORAK, T_SCROLL, T_SNARE, T_STAFF, T_STRUCTURE, T_TALISMAN, T_TATTOO, T_WAND]
Parser.TRAITS_ENERGY = [T_ACID, T_COLD, T_ELECTRICITY, T_FIRE, T_FORCE, T_NEGATIVE, T_POSITIVE, T_SONIC]
Parser.TRAITS_CREATURE_TYPE = [T_ABERRATION, T_ANIMAL, T_ASTRAL, T_BEAST, T_CELESTIAL, T_CONSTRUCT, T_DRAGON, T_DREAM, T_ELEMENTAL, T_ETHEREAL, T_FEY, T_FIEND, T_FUNGUS, T_GIANT, T_HUMANOID, T_MONITOR, T_NEGATIVE, T_OOZE, T_PETITIONER, T_PLANT, T_POSITIVE, T_SPIRIT, T_TIME, T_UNDEAD]
Parser.TRAITS_CLASS = [T_ALCHEMIST, T_BARBARIAN, T_BARD, T_CHAMPION, T_CLERIC, T_DRUID, T_FIGHTER, T_INVESTIGATOR, T_MONK, T_ORACLE, T_RANGER, T_ROGUE, T_SORCERER, T_SWASHBUCKLER, T_WITCH, T_WIZARD]
Parser.TRAITS_ARMOR = [T_BULWARK, T_COMFORT, T_FLEXIBLE, T_NOISY]
Parser.TRAITS_ANCESTRY = [T_AASIMAR, T_CATFOLK, T_CHANGELING, T_DHAMPIR, T_DUSKWALKER, T_DWARF, T_ELF, T_GNOME, T_GOBLIN, T_HALFELF, T_HALFLING, T_HALFORC, T_HOBGOBLIN, T_HUMAN, T_KOBOLD, T_LESHY, T_LIZARDFOLK, T_ORC, T_RATFOLK, T_SHOONY, T_TENGU, T_TIEFLING]
Parser.TRAITS_HERITAGE = [T_TIEFLING]
Parser.TRAITS_ALIGN = [T_CHAOTIC, T_EVIL, T_GOOD, T_LAWFUL];
Parser.TRAITS_ALIGN_ABV = [T_LG, T_NG, T_CG, T_LN, T_N, T_CN, T_LE, T_NE, T_CE, T_ANY];
Parser.TRAITS_SIZE = [T_TINY, T_SMALL, T_MEDIUM, T_LARGE, T_HUGE, T_GARGANTUAN];

Parser.TRAITS_TO_TRAITS_SRC = {};
Parser.TRAITS_TO_TRAITS_SRC[T_CHAOTIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EVIL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GOOD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LAWFUL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AASIMAR] = SRC_APG;
Parser.TRAITS_TO_TRAITS_SRC[T_CATFOLK] = SRC_APG;
Parser.TRAITS_TO_TRAITS_SRC[T_CHANGELING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DHAMPIR] = SRC_APG;
Parser.TRAITS_TO_TRAITS_SRC[T_DUSKWALKER] = SRC_APG;
Parser.TRAITS_TO_TRAITS_SRC[T_DWARF] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ELF] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GNOME] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GOBLIN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HALFELF] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HALFLING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HALFORC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HOBGOBLIN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HUMAN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_KOBOLD] = SRC_APG;
Parser.TRAITS_TO_TRAITS_SRC[T_LESHY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LIZARDFOLK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ORC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RATFOLK] = SRC_APG;
Parser.TRAITS_TO_TRAITS_SRC[T_SHOONY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TENGU] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TIEFLING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BULWARK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COMFORT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FLEXIBLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_NOISY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ALCHEMIST] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BARBARIAN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BARD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CHAMPION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CLERIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DRUID] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FIGHTER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INVESTIGATOR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MONK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ORACLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RANGER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ROGUE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SORCERER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SWASHBUCKLER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WITCH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WIZARD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ABERRATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ANIMAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ASTRAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BEAST] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CELESTIAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONSTRUCT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DRAGON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DREAM] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ELEMENTAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ETHEREAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FEY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FIEND] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FUNGUS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GIANT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HUMANOID] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MONITOR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_NEGATIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_OOZE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PETITIONER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PLANT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_POSITIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SPIRIT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TIME] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_UNDEAD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AIR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EARTH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FIRE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WATER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ACID] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COLD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ELECTRICITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FIRE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FORCE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_NEGATIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_POSITIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SONIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ALCHEMICAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_APEX] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ARTIFACT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BOMB] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONSUMABLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONTRACT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CURSED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DRUG] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ELIXIR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INTELLIGENT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INVESTED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MUTAGEN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_OIL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_POTION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SAGGORAK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SCROLL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SNARE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_STAFF] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_STRUCTURE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TALISMAN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TATTOO] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WAND] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AASIMAR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ACID] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AEON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AIR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ALCHEMICAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AMPHIBIOUS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ANADI] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ANGEL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AQUATIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ARCHON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AZATA] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BOGGARD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CALIGNI] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CATFOLK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CHANGELING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CHARAUKA] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COLD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COUATL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DAEMON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DEMON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DERO] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DEVIL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DHAMPIR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DINOSAUR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DROW] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DUERGAR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DUSKWALKER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EARTH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ELECTRICITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FETCHLING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FIRE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GENIE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GHOST] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GHOUL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GNOLL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GOLEM] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GREMLIN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GRIPPLI] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HAG] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_IFRIT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INCORPOREAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INEVITABLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_KOBOLD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LESHY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LIZARDFOLK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MERFOLK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MINDLESS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MORLOCK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MUMMY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MUTANT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_NYMPH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ONI] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ORC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_OREAD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PROTEAN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PSYCHOPOMP] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_QLIPPOTH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RAKSHASA] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RATFOLK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SEA] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DEVIL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SERPENTFOLK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SKELETON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SKULK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SONIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SOULBOUND] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SPRIGGAN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SPRITE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SULI] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SWARM] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SYLPH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TANE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TENGU] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TIEFLING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TITAN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TROLL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_UNDINE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_URDEFHAN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VAMPIRE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VELSTRAC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WATER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WERECREATURE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WIGHT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WRAITH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_XULGATH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ZOMBIE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AIR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EARTH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ERRATIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FINITE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FIRE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FLOWING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HIGH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GRAVITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_IMMEASURABLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LOW] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GRAVITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_METAMORPHIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MICROGRAVITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_NEGATIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_POSITIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SENTIENT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SHADOW] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_STATIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_STRANGE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GRAVITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SUBJECTIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GRAVITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TIMELESS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_UNBOUNDED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_WATER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONTACT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INGESTED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INHALED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INJURY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_POISON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COMMON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RARE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_UNCOMMON] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_UNIQUE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ABJURATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONJURATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DIVINATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ENCHANTMENT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EVOCATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ILLUSION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_NECROMANCY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TRANSMUTATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AUDITORY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_OLFACTORY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VISUAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CITY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_METROPOLIS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TOWN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VILLAGE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ARCANE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DIVINE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_OCCULT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PRIMAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AGILE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ATTACHED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BACKSTABBER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BACKSWING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_BRUTAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONCEALABLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DEADLY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DISARM] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DWARF] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ELF] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FATAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FINESSE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FORCEFUL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FREEHAND] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GNOME] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GOBLIN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GRAPPLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HALFLING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_JOUSTING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MODULAR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MONK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_NONLETHAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PARRY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PROPULSIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RANGE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RANGE_INCREMENT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RANGED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TRIP] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_REACH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SHOVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SWEEP] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TETHERED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_THROWN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TRIP] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TWIN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TWOHAND] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_UNARMED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VERSATILE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VOLLE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ADDITIVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ARCHETYPE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ATTACK] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_AURA] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CANTRIP] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CHARM] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COMPANION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COMPLEX] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_COMPOSITION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONCENTRATE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CONSECRATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CURSE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_CURSEBOUND] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DARKNESS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DEATH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DEDICATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DETECTION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DISEASE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_DOWNTIME] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EMOTION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_ENVIRONMENTAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EXPLORATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_EXTRADIMENSIONAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FEAR] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FINISHER] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FLOURISH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FOCUSED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_FORTUNE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_GENERAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HAUNT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HEALING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_HEX] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INCAPACITATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INFUSED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_INSTINCT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LEGACY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LIGHT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LINEAGE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LINGUISTIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_LITANY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MAGICAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MANIPULATE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MECHANICAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MENTAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_METAMAGIC] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MINION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MISFORTUNE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MORPH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MOVE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_MULTICLASS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_OATH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_OPEN] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_POLYMORPH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_POSSESSION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PRECIOUS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PREDICTION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_PRESS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RAGE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RECKLESS] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_RELOAD] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_REVELATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SCRYING] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SECRET] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SKILL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SLEEP] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SOCIAL] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SPLASH] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_STAMINA] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_STANCE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_SUMMONED] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TELEPATHY] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TELEPORTATION] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_TRAP] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VIGILANTE] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VIRULENT] = SRC_CRB;
Parser.TRAITS_TO_TRAITS_SRC[T_VOCA] = SRC_CRB;

Parser.getTraitName = function (trait) {
	return trait.replace(/\s(?:\d|[A-Z]|\()(.+|$)/, "").uppercaseFirst()
}

Parser.rarityToNumber = function (r) {
	switch (r) {
		case T_COMMON: return 0;
		case T_UNCOMMON: return 1;
		case T_RARE: return 2;
		case T_UNIQUE: return 3;
		default: return 69;
	}
}

Parser.ITEM_TYPE_JSON_TO_ABV = {
	"A": "ammunition",
	"AF": "ammunition",
	"AT": "artisan's tools",
	"EM": "eldritch machine",
	"EXP": "explosive",
	"G": "adventuring gear",
	"GS": "gaming set",
	"HA": "heavy armor",
	"INS": "instrument",
	"LA": "light armor",
	"M": "melee weapon",
	"MA": "medium armor",
	"MNT": "mount",
	"GV": "generic variant",
	"P": "potion",
	"R": "ranged weapon",
	"RD": "rod",
	"RG": "ring",
	"S": "shield",
	"SC": "scroll",
	"SCF": "spellcasting focus",
	"OTH": "other",
	"T": "tools",
	"TAH": "tack and harness",
	"TG": "trade good",
	"$": "treasure",
	"VEH": "vehicle (land)",
	"SHP": "vehicle (water)",
	"AIR": "vehicle (air)",
	"WD": "wand",
};

Parser.DMGTYPE_JSON_TO_FULL = {
	"A": "acid",
	"B": "bludgeoning",
	"C": "cold",
	"F": "fire",
	"O": "force",
	"L": "lightning",
	"N": "necrotic",
	"P": "piercing",
	"I": "poison",
	"Y": "psychic",
	"R": "radiant",
	"S": "slashing",
	"T": "thunder",
};

Parser.DMG_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
Parser.CONDITIONS = ["blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled", "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", "prone", "restrained", "stunned", "unconscious"];

Parser.SKILL_JSON_TO_FULL = {
	"Acrobatics": [
		"Acrobatics measures your ability to perform tasks requiring coordination and grace. When you use the {@action Escape} basic action, you can use your Acrobatics modifier instead of your unarmed attack modifier.",
	],
	"Arcana": [
		"Arcana measures how much you know about arcane magic and creatures. Even if you’re untrained, you can {@action Recall Knowledge}.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about arcane theories; magic traditions; creatures of arcane significance (like dragons and beasts); and the Elemental, Astral,  and Shadow Planes.",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Arcana Trained Actions",
			"entries": [
				"You must be trained in Arcana to use it for the following general skill actions.",
				{
					"type": "list",
					"items": [
						"{@b {@action Decipher Writing}} about arcane theory.",
						"{@b {@action Identify Magic}}, particularly arcane magic.",
						"{@b {@action Learn a Spell}} from the arcane tradition.",
					],
				},
			],
		},
	],
	"Athletics": [
		"Athletics allows you to perform deeds of physical prowess. When you use the {@action Escape} basic action, you can use your Athletics modifier instead of your unarmed attack modifier.",
	],
	"Crafting": [
		"You can use this skill to create, understand, and repair items. Even if you’re untrained, you can {@action Recall Knowledge}.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about alchemical reactions, the value of items, engineering, unusual materials,\n and alchemical or mechanical creatures. The GM determines which creatures this applies to, but it usually includes constructs.",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Crafting Trained Actions",
			"entries": [
				"You must be trained in Crafting to use it to {@action Earn Income}.",
				{
					"type": "list",
					"items": [
						"{@b {@action Earn Income}} by crafting goods for the market.",
					],
				},
			],
		},
	],
	"Deception": [
		"You can trick and mislead others using disguises, lies, and other forms of subterfuge.",
	],
	"Diplomacy": [
		"You influence others through negotiation and flattery.",
	],
	"Intimidation": [
		"You bend others to your will using threats.",
	],
	"Lore": [
		"You have specialized information on a narrow topic. Lore features many subcategories. You might have Military Lore, Sailing Lore, Vampire Lore, or any similar subcategory of the skill. Each subcategory counts as its own skill, so applying a skill increase to Planar Lore wouldn't increase your proficiency with Sailing Lore, for example.",
		"You gain a specific subcategory of the Lore skill from your background. The GM determines what other subcategories they'll allow as Lore skills, though these categories are always less broad than any of the other skills that allow you to Recall Knowledge, and they should never be able to fully or mainly take the place of another skill's Recall Knowledge action. For instance, Magic Lore wouldn't enable you to recall the same breadth of knowledge covered by Arcana, Adventuring Lore wouldn't simply give you all the information an adventurer needs, and Planar Lore would not be sufficient to gain all the information spread across various skills and subcategories such as Heaven Lore.",
		"If you have multiple subcategories of Lore that could apply to a check or that would overlap with another skill in the circumstances, you can use the skill with the better skill modifier or the one you would prefer to use. If there’s any doubt whether a Lore skill applies to a specific topic or action, the GM decides whether it can be used or not.",
		"Even if you’re untrained in Lore, you can use it to {@action Recall Knowledge}.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about the subject of your Lore skill’s subcategory.",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Lore Trained Actions",
			"entries": [
				"You must be trained in Lore to use it to {@action Earn Income}.",
				{
					"type": "list",
					"items": [
						"{@b {@action Earn Income}} by using your knowledge to practice a trade.",
					],
				},
			],
		},
	],
	"Medicine": [
		"You can patch up wounds and help people recover from diseases and poisons. Even if you’re untrained in Medicine,  you can use it to {@action Recall Knowledge}.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about diseases, injuries, poisons,  and other ailments. You can use this to perform forensic examinations if you spend 10 minutes (or more, as determined by the GM) checking for evidence such as wound patterns. This is most useful when determining how a body was injured or killed.",
			],
		},
	],
	"Nature": [
		"You know a great deal about the natural world, and you command and train animals and magical beasts. Even if you’re untrained in Nature, you can use it to {@action Recall Knowledge}.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about fauna, flora, geography, weather, the environment, creatures of natural origin (like animals, beasts, fey, and plants), the First World, the Material Plane, and the Elemental Planes.",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Nature Trained Actions",
			"entries": [
				"You must be trained in Nature to use the following general skill actions.",
				{
					"type": "list",
					"items": [
						"{@b {@action Identify Magic}}, particularly primal magic.",
						"{@b {@action Learn a Spell}} from the primal tradition.",
					],
				},
			],
		},
	],
	"Occultism": [
		"You know a great deal about the natural world, and you command and train animals and magical beasts. Even if you’re untrained in Nature, you can use it to {@action Recall Knowledge}.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about ancient mysteries; obscure philosophies; creatures of occult significance (like aberrations, spirits, and oozes); and the Positive Energy, Negative Energy, Shadow, Astral, and Ethereal Planes.",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Occultism Trained Actions",
			"entries": [
				"You must be trained in Occultism to use it for the following general skill actions.",
				{
					"type": "list",
					"items": [
						"{@b {@action Decipher Writing}} on occult topics, including complex metaphysical systems, syncretic principles, weird philosophies, and incoherent ramblings.",
						"{@b {@action Identify Magic}}, particularly occult magic.",
						"{@b {@action Learn a Spell}} from the occult tradition.",
					],
				},
			],
		},
	],
	"Perception": [
		"Perception measures your ability to be aware of your environment. Every creature has Perception, which works with and is limited by a creature’s senses (described on page 464). Whenever you need to attempt a check based on your awareness, you’ll attempt a Perception check. Your Perception uses your Wisdom modifier, so you’ll use the following formula when attempting a Perception check.",
		{
			"type": "pf2-inset",
			"entries": [
				"Perception check result = d20 roll + Wisdom modifier + proficiency bonus + other bonuses + penalties",
			],
		},
		"Nearly all creatures are at least trained in Perception, so you will almost always add a proficiency bonus to your Perception modifier. You might add a circumstance bonus for advantageous situations or environments, and typically get status bonuses from spells or other magical effects. Items can also grant you a bonus to Perception, typically in a certain situation. For instance, a fine spyglass grants a +1 item bonus to Perception when attempting to see something a long distance away. Circumstance penalties to Perception occur when an environment or situation (such as fog) hampers your senses, while status penalties typically come from conditions, spells, and magic effects that foil the senses. You’ll rarely encounter item penalties or untyped penalties for Perception.",
		"Many abilities are compared to your Perception DC to determine whether they succeed. Your Perception DC is 10 + your total Perception modifier.",
		{
			"type": "pf2-h4",
			"name": "Perception for Initiative",
			"entries": [
				"Often, you’ll roll a Perception check to determine your order in initiative. When you do this, instead of comparing the result against a DC, everyone in the encounter will compare their results. The creature with the highest result acts first, the creature with the second-highest result goes second, and so on. Sometimes you may be called on to roll a skill check for initiative instead, but you’ll compare results just as if you had rolled Perception. The full rules for initiative are found in the rules for encounter mode on page 468.",
			],
		},
	],
	"Performance": [
		"You are skilled at a form of performance, using your talents to impress a crowd or make a living.",
		{
			"type": "pf2-h3",
			"name": "Basic Competence",
			"entries": [
				"Some performances require you to be more than just charismatic, and if you don’t meet the demands of the art form or the audience, the GM might apply a penalty based on the relevant ability score. For example, if	you’re dancing and have a negative Dexterity modifier, you might take a penalty to your attempt at dancing. Likewise, if you are orating and have a negative Intelligence modifier, you might have to hope your raw Charisma can overcome the penalties from your intellectual shortcomings—or ask someone to help write your speeches!",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Performance Traits",
			"entries": [
				"When you use an action that utilizes the Performanceskill, it gains one or more traits relevant to the type of performance. The GM might change these depending on the circumstances, but the most common performancebased traits are listed below.",
				{
					"type": "table",
					"rows": [
						["Performance", "Additional Traits"],
						["Act or perform comedy", "Auditory, linguistic, and visual"],
						["Dance", "Move and visual"],
						["Play an instrument", "Auditory and manipulate"],
						["Orate or sing", "Auditory and linguistic"],
					],
				},
			],
		},
		{
			"type": "pf2-h3",
			"name": "Performance Trained Action",
			"entries": [
				"You must be trained in Performance to use it to {@action Earn Income}.",
				{
					"type": "list",
					"items": [
						"{@b {@action Earn Income}} by staging a performance.",
					],
				},
			],
		},
	],
	"Religion": [
		"The secrets of deities, dogma, faith, and the realms of divine creatures both sublime and sinister are open to you. You also understand how magic works, though your training imparts a religious slant to that knowledge. Even if you’re untrained in Religion, you can use it to {@action Recall Knowledge}.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about divine agents, the finer points of theology, obscure myths regarding a faith, and creatures of religious significance (like celestials, fiends, and undead), the Outer Sphere, and the Positive and Negative Energy Planes.",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Religion Trained Actions",
			"entries": [
				"You must be trained in Religion to use it for the following general skill actions.",
				{
					"type": "list",
					"items": [
						"{@b {@action Decipher Writing}} of a religious nature, including allegories, homilies, and proverbs.",
						"{@b {@action Identify Magic}}, particularly divine magic.",
						"{@b {@action Learn a Spell}} from the divine tradition.",
					],
				},
			],
		},
	],
	"Society": [
		"You understand the people and systems that make civilization run, and you know the historical events that make societies what they are today. Further, you can use that knowledge to navigate the complex physical, societal,  and economic workings of settlements. Even if you’re untrained in Society, you can use it for the following general skill actions.",
		{
			"type": "list",
			"items": [
				"{@b {@action Recall Knowledge}} about local history, important personalities, legal institutions, societal structure,  and humanoid cultures. The GM might allow Society to apply to other creatures that are major elements of society in your region, such as the draconic nobility in a kingdom of humans ruled by dragons.",
				"{@b {@action Subsist}} in a settlement by finding shelter, scrounging, or begging for food.",
			],
		},
		{
			"type": "pf2-h3",
			"name": "Society Trained Actions",
			"entries": [
				"You must be trained in Society to use it to {@action Decipher Writing}.",
				{
					"type": "list",
					"items": [
						"{@b {@action Decipher Writing}} that’s a coded message, text written in an incomplete or archaic form, or in some cases, text in a language you don’t know.",
					],
				},
			],
		},
	],
	"Stealth": [
		"You are skilled at avoiding detection, allowing you to slip past foes, hide, or conceal an item.",
	],
	"Survival": [
		"You are adept at living in the wilderness, foraging for food and building shelter, and with training you discover the secrets of tracking and hiding your trail. Even if you’re untrained, you can still use Survival to {@action Subsist}",
		{
			"type": "list",
			"items": [
				"{@action Subsist} in the wild by foraging for food and building shelter.",
			],
		},
	],
	"Thievery": [
		"You are trained in a particular set of skills favored by thieves and miscreants.",
	],
};

Parser.SENSE_JSON_TO_FULL = {
	"blindsight": [
		"A creature with blindsight can perceive its surroundings without relying on sight, within a specific radius. Creatures without eyes, such as oozes, and creatures with echolocation or heightened senses, such as bats and true dragons, have this sense.",
	],
	"darkvision": [
		"Many creatures in fantasy gaming worlds, especially those that dwell underground, have darkvision. Within a specified range, a creature with darkvision can see in dim light as if it were bright light and in darkness as if it were dim light, so areas of darkness are only lightly obscured as far as that creature is concerned. However, the creature can't discern color in that darkness, only shades of gray.",
	],
	"tremorsense": [
		"A creature with tremorsense can detect and pinpoint the origin of vibrations within a specific radius, provided that the creature and the source of the vibrations are in contact with the same ground or substance. Tremorsense can't be used to detect flying or incorporeal creatures. Many burrowing creatures, such as ankhegs and umber hulks, have this special sense.",
	],
	"truesight": [
		"A creature with truesight can, out to a specific range, see in normal and magical darkness, see invisible creatures and objects, automatically detect visual illusions and succeed on saving throws against them, and perceives the original form of a shapechanger or a creature that is transformed by magic. Furthermore, the creature can see into the Ethereal Plane.",
	],
};

Parser.NUMBERS_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
Parser.NUMBERS_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
Parser.NUMBERS_TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
