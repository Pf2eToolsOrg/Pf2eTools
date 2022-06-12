"use strict"

if (typeof module !== "undefined") {
	require("../js/utils.js");
	require("../js/parser.js");
	Object.assign(global, require("./Tokenizer"));
	Object.assign(global, require("../node/tag-jsons.js"));
	global.PropOrder = require("../js/utils-proporder.js");
}

// TODO: Catch more Errors
class Converter {
	/**
	 * @param opts.config
	 * @param opts.tokenizerUtilsClass
	 * @param opts.cbWarn
	 * **/
	constructor (opts) {
		opts = opts || {};
		const config = opts.config || TokenizerUtils.defaultConfig

		this._string = "";
		this._page = 0;
		this._tokenizer = new Tokenizer(config);
		this._tokenizerUtils = opts.tokenizerUtilsClass || TokenizerUtils;
		this._parsedData = null;
		this._parsedProperties = null;
		this._tokenStack = [];

		// eslint-disable-next-line no-console
		this._cbWarn = opts.cbWarn || console.warn;
	}

	async init () {
		await TagJsons.pInit();
	}

	_preprocessString (string) {
		string = string.replaceAll(/\r/g, "");
		string += "\n\n\n";
		return string;
	}

	parse (string, opts) {
		opts = opts || {};

		this._parsedData = {};
		this._string = this._preprocessString(string);
		this._page = opts.initialPage || 0;
		this._source = opts.source || "SOURCE";
		this._avgLineLength = opts.avgLineLength || 58;
		this._tokenizer.init(this._string);

		this._tokenStack = [];

		this._parseAllData();
		return this._parsedData;
	}

	_parseAllData () {
		while (this._tokenizer.hasMoreTokens()) {
			this._push(this._getNextToken());
			if (this._tokenIsType(this._tokenizerUtils.dataHeaders)) this._parseData();
			else if (this._tokenIsType("PAGE")) this._setPageNumber();
			else if (this._tokenIsType("END_DATA")) this._consumeToken("END_DATA");
			else throw new Error(`Unexpected token! Expected data header or page, but got "${this._peek().value}".`);
		}
	}

	_setPageNumber () {
		const token = this._consumeToken("PAGE");
		this._page = Number(token.value.trim());
	}

	_parseData () {
		const dataType = this._peek().type;
		let sentence = [];
		const pushSentence = () => {
			this._push({
				type: sentence.last().type.replace(/WORD/, "SENTENCE"),
				value: sentence.map(w => w.value).join(" "),
				// TODO: Other optional keys?
				isStartNewLine: sentence[0].isStartNewLine,
			});
			sentence = [];
		}
		while (true) {
			const nextToken = this._getNextToken();
			if (nextToken == null) throw new Error("Unexpected end of input!");
			if (this._tokenIsType(this._tokenizerUtils.dataHeaders, nextToken)) throw new Error(`Unexpected ${nextToken.type} creation!`);
			else if (this._tokenIsType("END_DATA", nextToken)) {
				switch (dataType) {
					case "SPELL": (this._parsedData.spell = this._parsedData.spell || []).push(this._parseSpell()); return;
					case "FEAT": (this._parsedData.feat = this._parsedData.feat || []).push(this._parseFeat()); return;
					case "ITEM": (this._parsedData.item = this._parsedData.item || []).push(this._parseItem()); return;
					case "BACKGROUND": (this._parsedData.background = this._parsedData.background || []).push(this._parseBackground()); return;
					case "CREATURE": (this._parsedData.creature = this._parsedData.creature || []).push(this._parseCreature()); return;
					default: throw new Error(`Unexpected data creation! Attempted to create ${dataType}.`);
				}
			} else if (this._tokenIsType(this._tokenizerUtils.words, nextToken)) {
				sentence.push(nextToken);
				if (nextToken.type !== "WORD") pushSentence();
			} else {
				if (sentence.length) pushSentence();
				this._push(nextToken);
			}
		}
	}

	_parseSpell () {
		this._tokenStack.reverse();
		this._parsedProperties = [];
		const headerToken = this._consumeToken("SPELL");
		const [match, name, type, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "SPELL").regex.exec(headerToken.value);
		const spell = {};
		spell.name = name.toTitleCase();
		spell.type = type.toTitleCase();
		spell.level = Number(level);
		spell.source = this._source;
		spell.page = this._page;
		spell.entries = [""];
		this._parseTraits(spell, {noEmptyArr: true});
		this._parseProperties(spell);
		this._parseEntries(spell);
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing spell "${spell.name}"!`);
			this._tokenStack = [];
		}
		return PropOrder.getOrdered(spell, "spell");
	}
	_parseFeat () {
		this._tokenStack.reverse();
		this._parsedProperties = [];
		const headerToken = this._consumeToken("FEAT");
		const [match, name, activity, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "FEAT").regex.exec(headerToken.value);
		const feat = {};
		feat.name = name.toTitleCase();
		const activityToken = this._tokenizerUtils.actions.find(it => it.regex.test(activity));
		if (activityToken) feat.activity = this._renderToken(activityToken, {asObject: true});
		feat.level = Number(level);
		feat.source = this._source;
		feat.page = this._page;
		feat.entries = [""];
		this._parseTraits(feat, {noEmptyArr: true});
		this._parseProperties(feat);
		this._parseEntries(feat);
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing feat "${feat.name}"!`);
			this._tokenStack = [];
		}
		return PropOrder.getOrdered(feat, "feat");
	}
	// TODO: Intelligent Items (n=8)
	_parseItem () {
		this._tokenStack.reverse();
		this._parsedProperties = [];
		const headerToken = this._consumeToken("ITEM");
		const [match, name, itemType, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "ITEM").regex.exec(headerToken.value);
		const item = {};
		item.name = name.toTitleCase();
		item.type = itemType.toTitleCase();
		item.level = Number.isNaN(Number(level)) ? level : Number(level);
		item.source = this._source;
		item.page = this._page;
		item.entries = [""];
		this._parseTraits(item, {noEmptyArr: true});
		this._parseProperties(item);
		this._parseItemCategory(item);
		this._parseItemRuneAppliesTo(item);
		this._parseEntries(item);
		// Staffs and Wands usually dont have craft requirements for each variant item.
		if (this._tokenIsType(this._tokenizerUtils.craftRequirements)) {
			this._parseCraftRequirements(item);
		}
		if (item.variants) item.generic = "G";
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing item "${item.name}"!`);
			this._tokenStack = [];
		}
		return PropOrder.getOrdered(item, "item");
	}
	_parseBackground () {
		this._tokenStack.reverse();
		this._parsedProperties = [];
		const headerToken = this._consumeToken("BACKGROUND");
		const [match, name] = this._tokenizerUtils.dataHeaders.find(it => it.type === "BACKGROUND").regex.exec(headerToken.value);
		const background = {};
		background.name = name.toTitleCase();
		background.source = this._source;
		background.page = this._page;
		background.entries = [""];
		this._parseTraits(background, {noEmptyArr: true});
		this._parseProperties(background);
		this._parseEntries(background);
		this._parseBackgroundAbilityBoosts(background);
		this._parseBackgroundSkills(background);
		this._parseBackgroundFeats(background);
		this._parseBackgroundMisc(background);
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing background "${background.name}"!`);
			this._tokenStack = [];
		}
		return PropOrder.getOrdered(background, "background");
	}
	_parseCreature () {
		this._tokenStack.reverse();
		this._parsedProperties = [];
		this._parsedAbilities = [];
		this._isParsingCreature = true;
		const headerToken = this._consumeToken("CREATURE");
		const [match, name, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "CREATURE").regex.exec(headerToken.value);
		const creature = {};
		creature.name = name.toTitleCase();
		creature.level = Number(level);
		creature.source = this._source;
		creature.page = this._page;
		this._parseTraits(creature, {noEmptyArr: true});
		if (this._tokenIsType(this._tokenizerUtils.stringEntries)) {
			const entries = this._getEntries();
			creature.description = this._renderEntries(entries, {asString: true});
		}
		this._parseCreatureProperties(creature);
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing creature "${creature.name}"!`);
			this._tokenStack = [];
		}
		this._isParsingCreature = null;
		return PropOrder.getOrdered(creature, "creature");
	}

	_parseTraits (obj, opts) {
		opts = opts || {};
		const traits = [];
		while (this._tokenIsType(this._tokenizerUtils.traits)) {
			const traitToken = this._consumeToken(this._tokenizerUtils.traits);
			traits.push(traitToken.value.trim().toLowerCase());
		}
		if (opts.noEmptyArr && traits.length === 0) return;
		obj.traits = traits;
	}
	_parseProperties (obj) {
		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.properties)) this._parseProperty(obj);
			if (breakOnLength === this._tokenStack.length) break;
		}
	}
	_parseProperty (obj) {
		if (this._tokenIsType(this._tokenizerUtils.access)) this._parseAccess(obj);
		else if (this._tokenIsType(this._tokenizerUtils.area)) this._parseArea(obj);
		else if (this._tokenIsType(this._tokenizerUtils.activate)) this._parseActivateProperty(obj);
		else if (this._tokenIsType(this._tokenizerUtils.ammunition)) this._parseAmmunition(obj);
		else if (this._tokenIsType(this._tokenizerUtils.bulk)) this._parseBulk(obj);
		else if (this._tokenIsType(this._tokenizerUtils.cast)) this._parseCast(obj);
		else if (this._tokenIsType(this._tokenizerUtils.cost)) this._parseCost(obj);
		else if (this._tokenIsType(this._tokenizerUtils.craftRequirements)) this._parseCraftRequirements(obj);
		else if (this._tokenIsType(this._tokenizerUtils.duration)) this._parseDuration(obj);
		else if (this._tokenIsType(this._tokenizerUtils.effect)) this._parseEffect(obj);
		else if (this._tokenIsType(this._tokenizerUtils.frequency)) this._parseFrequency(obj);
		else if (this._tokenIsType(this._tokenizerUtils.level)) this._parseLevel(obj);
		else if (this._tokenIsType(this._tokenizerUtils.prerequisites)) this._parsePrerequisites(obj);
		else if (this._tokenIsType(this._tokenizerUtils.price)) this._parsePrice(obj);
		else if (this._tokenIsType(this._tokenizerUtils.range)) this._parseRange(obj);
		else if (this._tokenIsType(this._tokenizerUtils.requirements)) this._parseRequirements(obj);
		else if (this._tokenIsType(this._tokenizerUtils.savingThrow)) this._parseSavingThrow(obj);
		else if (this._tokenIsType(this._tokenizerUtils.shieldData)) this._parseShieldData(obj);
		else if (this._tokenIsType(this._tokenizerUtils.targets)) this._parseTargets(obj);
		else if (this._tokenIsType(this._tokenizerUtils.traditions)) this._parseTraditions(obj);
		else if (this._tokenIsType(this._tokenizerUtils.traditionsSubclasses)) this._parseTraditionsSubclasses(obj);
		else if (this._tokenIsType(this._tokenizerUtils.trigger)) this._parseTrigger(obj);
		else if (this._tokenIsType(this._tokenizerUtils.usage)) this._parseUsage(obj);
		else throw new Error(`Unimplemented property creation of type "${this._peek().type}"`);
	}

	_parseAccess (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.access, "access");
	}
	_parseActivateProperty (obj) {
		this._consumeToken(this._tokenizerUtils.activate);
		const activate = {};
		this._parseActivate_parseActivityComponentsTraits(activate, {breakAfterNewline: true});
		obj.activate = activate;
	}
	_parseAmmunition (obj) {
		this._parsedProperties.push(...this._tokenizerUtils.ammunition);
		this._consumeToken(this._tokenizerUtils.ammunition);
		const entries = this._getEntries({checkContinuedLines: true});
		obj.ammunition = this._renderEntries(entries, {asString: true}).split(", ");
	}
	_parseArea (obj) {
		this._consumeToken(this._tokenizerUtils.area);
		this._parsedProperties.push(...this._tokenizerUtils.area);
		const entries = this._getEntries({checkContinuedLines: true});
		obj.area = {entry: this._renderEntries(entries, {asString: true}), types: []};
		this._tokenizerUtils.areaTypes.forEach(({regex, type}) => {
			if (regex.test(obj.area.entry)) obj.area.types.push(type);
		});
		if (obj.area.types.length === 0) obj.area.types.push("Misc.")
	}
	_parseBulk (obj) {
		this._consumeToken(this._tokenizerUtils.bulk);
		this._parsedProperties.push(...this._tokenizerUtils.bulk);
		const entries = this._getEntries({checkContinuedLines: true});
		const rendered = this._renderEntries(entries, {asString: true});
		if (Number.isNaN(Number(rendered))) obj.bulk = rendered;
		else obj.bulk = Number(rendered);
	}
	_parseCast (obj) {
		this._consumeToken(this._tokenizerUtils.cast);
		this._parsedProperties.push(...this._tokenizerUtils.cast);
		const entries = this._getEntries({checkContinuedLines: true});
		const components = {};

		if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences])) {
			obj.cast = this._renderToken(entries[0], {asObject: true});
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[1].value)) components[key] = true;
			});
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentences, "PARENTHESIS"])) {
			const regExpTime = new RegExp(`(\\d+) (${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")})`);
			const matchedTime = this._renderToken(entries[0]).match(regExpTime);
			if (matchedTime) obj.cast = {number: Number(matchedTime[1]), unit: this._tokenizerUtils.timeUnits.find(u => u.regex.test(matchedTime[2])).unit};
			else obj.cast = {number: 1, unit: "varies", entry: this._renderToken(entries[0])};
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[1].value)) components[key] = true;
			});
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences, this._tokenizerUtils.actions, "PARENTHESIS"])) {
			obj.cast = {number: 1, unit: "varies", entry: entries.slice(0, 3).map(e => this._renderToken(e)).join(" ")};
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[3].value)) components[key] = true;
			});
		} else {
			this._cbWarn(`Encountered unknown data structure while parsing CAST in "${obj.name}". Skipping...`);
		}

		if (Object.keys(components).length) obj.components = components;
	}
	_parseCost (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.cost, "cost");
	}
	_parseCraftRequirements (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.craftRequirements, "craftReq");
	}
	_parseDuration (obj) {
		this._consumeToken(this._tokenizerUtils.duration);
		this._parsedProperties.push(...this._tokenizerUtils.duration);
		const entries = this._getEntries({checkContinuedLines: true});
		const rendered = this._renderEntries(entries, {asString: true});
		const regExpDuration = new RegExp(`(sustained)?(?: up to )?(\\d+)? ?(${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")})?`);
		const matched = regExpDuration.exec(rendered);
		if (matched && matched[0]) {
			obj.duration = {};
			if (matched[1]) obj.duration.sustained = true;
			if (matched[2]) obj.duration.number = Number(matched[2]);
			if (matched[3]) obj.duration.unit = this._tokenizerUtils.timeUnits.find(u => u.regex.test(matched[3])).unit;
			if (obj.duration.sustained && obj.duration.unit == null) obj.duration.unit = "unlimited";
		} else {
			obj.duration = {unit: "unknown", entry: rendered};
		}
	}
	_parseEffect (obj) {
		this._consumeToken(this._tokenizerUtils.effect);
		this._parsedProperties.push(...this._tokenizerUtils.effect);
		const entries = this._getEntries({checkContinuedLines: true});
		obj.entries = this._renderEntries(entries);
	}
	_parseFrequency (obj) {
		this._consumeToken(this._tokenizerUtils.frequency);
		this._parsedProperties.push(...this._tokenizerUtils.frequency);
		const entries = this._getEntries({checkContinuedLines: true});
		const rendered = this._renderEntries(entries, {asString: true});
		// TODO: Verify that this regexp is ok...
		const regExpFreq = new RegExp(`(Once|Twice|\\w+ Times) (every|per) (\\d+)? ?(${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")}|[a-z]+)(, plus overcharge)?`, "i");
		const matched = regExpFreq.exec(rendered);
		if (matched) {
			obj.frequency = {};
			const freq = matched[1].toLowerCase();
			if (freq === "once") obj.frequency.freq = 1;
			else if (freq === "twice") obj.frequency.freq = 2;
			else if (!Number.isNaN(Number(freq.split(" ")[0]))) obj.frequency.freq = Number(freq.split(" ")[0]);
			else obj.frequency.freq = freq.split(" ")[0];

			if (matched[2] === "every") obj.frequency.recurs = true;
			if (matched[3]) obj.frequency.interval = Number(matched[3]);

			if (this._tokenizerUtils.timeUnits.find(u => u.regex.test(matched[4]))) obj.frequency.unit = this._tokenizerUtils.timeUnits.find(u => u.regex.test(matched[4])).unit;
			else obj.frequency.customUnit = matched[4];

			if (matched[5]) obj.frequency.overcharge = true;
		} else {
			obj.frequency = {special: rendered};
		}
	}
	_parseLevel (obj) {
		const lvlToken = this._consumeToken(this._tokenizerUtils.level);
		this._parsedProperties.push(...this._tokenizerUtils.level);
		obj.level = Number(/\d+/.exec(lvlToken.value)[0]);
	}
	_parsePrerequisites (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.prerequisites, "prerequisites");
	}
	_parsePrice (obj) {
		this._consumeToken(this._tokenizerUtils.price);
		this._parsedProperties.push(...this._tokenizerUtils.price);
		const entries = this._getEntries({checkContinuedLines: true});
		const rendered = this._renderEntries(entries, {asString: true});
		// TODO: Other coins
		const regexPrice = /([\d,]+) (cp|sp|gp)(.+)?$/;
		const price = {};
		const matchedPrice = regexPrice.exec(rendered);
		if (matchedPrice) {
			price.amount = Number(matchedPrice[1].replaceAll(/,/g, ""));
			price.coin = matchedPrice[2];
			if (matchedPrice[3]) price.note = matchedPrice[3].trim();
		} else {
			price.note = rendered;
			this._cbWarn(`Encountered unknown data structure while parsing PRICE of "${obj.name}".`);
		}
		obj.price = price;
	}
	_parseRange (obj) {
		// TODO: fix faulty entries that should be area instead?
		this._consumeToken(this._tokenizerUtils.range);
		this._parsedProperties.push(...this._tokenizerUtils.range);
		const entries = this._getEntries({checkContinuedLines: true});
		const rendered = this._renderEntries(entries, {asString: true});
		obj.range = this._parseRange_parseRangeStr(rendered);
	}
	_parseRange_parseRangeStr (string) {
		const range = {};
		const regExpRange = new RegExp(`(\\d+)? ?(${this._tokenizerUtils.rangeUnits.map(u => u.regex.source).join("|")})`);
		const matched = regExpRange.exec(string);
		if (matched && matched[0]) {
			range.unit = this._tokenizerUtils.rangeUnits.find(u => u.regex.test(matched[2])).unit;
			if (matched[1]) range.number = Number(matched[1]);
		} else {
			range.unit = "unknown";
			range.entry = string;
		}
		return range;
	}
	_parseRequirements (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.requirements, "requirements");
	}
	_parseSavingThrow (obj) {
		this._consumeToken(this._tokenizerUtils.savingThrow);
		this._parsedProperties.push(...this._tokenizerUtils.savingThrow);
		const entries = this._getEntries({checkContinuedLines: true});
		const rendered = this._renderEntries(entries, {asString: true});
		const regExpSavingThrow = new RegExp(`(basic)? ?(${this._tokenizerUtils.savingThrows.map(u => u.regex.source).join("|")})`);
		const matched = regExpSavingThrow.exec(rendered);
		if (matched) {
			obj.savingThrow = {type: this._tokenizerUtils.savingThrows.find(u => u.regex.test(matched[2])).unit};
			if (matched[1]) obj.savingThrow.basic = true;
		} else {
			obj.savingThrow = {type: rendered};
		}
	}
	_parseShieldData (obj) {
		const token = this._consumeToken(this._tokenizerUtils.shieldData);
		const reHardness = /Hardness\s(\d+)/i;
		const reHP = /HP\s(\d+)/;
		const reBT = /BT\s(\d+)/;
		const hardness = Number(reHardness.exec(token.value)[1]);
		const hp = Number(reHP.exec(token.value)[1]);
		const bt = Number(reBT.exec(token.value)[1]);
		obj.shieldData = {hardness, hp, bt};
	}
	_parseTargets (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.targets, "targets");
	}
	_parseTraditions (obj) {
		this._consumeToken(this._tokenizerUtils.traditions);
		this._parsedProperties.push(...this._tokenizerUtils.traditions);
		const entries = this._getEntries({checkContinuedLines: true});
		obj.traditions = entries.map(e => this._renderToken(e)).join(" ").split(", ").map(tr => tr.trim().toTitleCase());
	}
	_parseTraditionsSubclasses (obj) {
		const token = this._consumeToken(this._tokenizerUtils.traditionsSubclasses);
		this._parsedProperties.push(token);
		const entries = this._getEntries({checkContinuedLines: true});
		const altTraditions = entries.map(e => this._renderToken(e)).join(" ").split(", ").map(tr => tr.trim().toTitleCase());
		obj.subclass = obj.subclass || {};
		const key = `${this._tokenizerUtils.traditionsSubclasses.find(it => it.type === token.type).class}|${token.value.trim()}`
		obj.subclass[key] = altTraditions;
	}
	_parseTrigger (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.trigger, "trigger");
	}
	_parseUsage (obj) {
		this._parseGenericProperty(obj, this._tokenizerUtils.usage, "usage");
	}
	_parseGenericProperty (obj, tokenType, prop) {
		this._parsedProperties.push(...tokenType);
		this._consumeToken(tokenType);
		const entries = this._getEntries({checkContinuedLines: true});
		obj[prop] = this._renderEntries(entries, {asString: true});
	}

	_parseItemCategory (item) {
		const cats = this._tokenizerUtils.itemCategories;
		if (cats.map(c => c.cat.toLowerCase()).includes(item.type.toLowerCase())) {
			item.category = item.type;
			return;
		}
		for (let cat of cats.map(c => c.cat)) {
			if (item.traits.map(t => t.toLowerCase()).includes(cat.toLowerCase())) {
				item.category = cat;
				return;
			}
		}
		if (item.usage) {
			for (let catUsage of this._tokenizerUtils.itemCategories.filter(c => c.reUsage)) {
				if (catUsage.reUsage.test(item.usage)) {
					item.category = catUsage.cat;
					return;
				}
			}
		}
		item.category = "Unknown";
		this._cbWarn(`Couldn't determine item category of "${item.name}".`);
	}
	_parseItemRuneAppliesTo (item) {
		if (item.category !== "Rune") return;
		if (item.usage) {
			const regExp = /etched\sonto\s.*?(weapon|armor)/i;
			const match = regExp.exec(item.usage);
			if (match) item.appliesTo = [match[1].toTitleCase()];
			else item.appliesTo = ["Other"];
		} else item.appliesTo = ["Other"];
	}

	_parseBackgroundAbilityBoosts (background) {
		const reFree = /free\sability\sboost/i;
		const scores = [];
		const entriesString = background.entries.filter(e => typeof e === "string").join(" ");
		this._tokenizerUtils.abilityScores.forEach(it => {
			if (it.regex.test(entriesString)) scores.push(it.full);
		});
		if (reFree.test(entriesString)) scores.push("Free");
		if (scores.length) background.boosts = scores;
	}
	_parseBackgroundSkills (background) {
		const reLore = /@skill Lore\|\|([^}]*?)}/ig;
		const reSkill = /@skill ([^}|]*?)}/ig;
		const entriesString = background.entries.filter(e => typeof e === "string").join(" ");
		const lore = Array.from(new Set(Array.from(entriesString.matchAll(reLore)).filter(Boolean).map(m => m[1])));
		const skills = Array.from(new Set(Array.from(entriesString.matchAll(reSkill)).filter(Boolean).map(m => m[1])));
		if (lore.length) background.lore = lore.map(l => l.replace(/ Lore/i, ""));
		if (skills.length) background.skills = skills;
	}
	_parseBackgroundFeats (background) {
		const reFeat = /@feat ([^}]*?)}/ig;
		const entriesString = background.entries.filter(e => typeof e === "string").join(" ");
		const feats = Array.from(new Set(Array.from(entriesString.matchAll(reFeat)).filter(Boolean).map(m => m[1])));
		if (feats.length) background.feats = feats;
	}
	_parseBackgroundMisc (background) {
		if (background.entries.some(it => it.type === "ability")) background.ability = true;
	}

	_parseCreatureProperties (obj) {
		while (this._tokenStack.length) {
			let breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.propertiesCreatures)) this._parseCreatureProperty(obj);
			else if (this._tokenIsType(this._tokenizerUtils.actions && this._tokenIsType(this._tokenizerUtils.attacks, this._peek(1)))) {
				const actionToken = this._consumeToken(this._tokenizerUtils.actions);
				const atkToken = this._consumeToken(this._tokenizerUtils.attacks);
				this._push(actionToken);
				this._push(atkToken);
				breakOnLength += 1;
			} else if (this._tokenIsType(this._tokenizerUtils.stringEntries)) this._parseCreatureAbilities(obj);
			if (breakOnLength === this._tokenStack.length) break;
		}
	}
	_parseCreatureProperty (obj) {
		if (this._tokenIsType(this._tokenizerUtils.perception)) this._parsePerception(obj);
		else if (this._tokenIsType(this._tokenizerUtils.languages)) this._parseLanguages(obj);
		else if (this._tokenIsType(this._tokenizerUtils.skillsProp)) this._parseSkills(obj);
		else if (this._tokenIsType(this._tokenizerUtils.creatureAbilityScores)) this._parseAbilityScores(obj);
		else if (this._tokenIsType(this._tokenizerUtils.items)) this._parseItems(obj);
		else if (this._tokenIsType(this._tokenizerUtils.ac)) this._parseAC(obj);
		else if (this._tokenIsType(this._tokenizerUtils.fort)) this._parseCreatureSavingThrows(obj);
		else if (this._tokenIsType(this._tokenizerUtils.hp)) this._parseHP(obj);
		else if (this._tokenIsType(this._tokenizerUtils.hardness)) this._parseHardness(obj);
		else if (this._tokenIsType(this._tokenizerUtils.immunities)) this._parseImmunities(obj);
		else if (this._tokenIsType(this._tokenizerUtils.weaknesses)) this._parseWeaknesses(obj);
		else if (this._tokenIsType(this._tokenizerUtils.resistances)) this._parseResistances(obj);
		else if (this._tokenIsType(this._tokenizerUtils.speed)) this._parseSpeed(obj);
		else if (this._tokenIsType(this._tokenizerUtils.attacks)) this._parseAttacks(obj);
		else if (this._tokenIsType(this._tokenizerUtils.spellCasting)) this._parseSpellCasting(obj);
		else if (this._tokenIsType(this._tokenizerUtils.ritualCasting)) this._parseRitualCasting(obj);
		else throw new Error(`Unimplemented property creation of type "${this._peek().type}"`);
	}
	_parsePerception (creature) {
		const perception = {};
		const perceptionToken = this._consumeToken(this._tokenizerUtils.perception);
		const match = this._tokenizerUtils.perception.find(it => it.type === perceptionToken.type).regex.exec(perceptionToken.value);
		perception.std = Number(match[1]);
		if (this._tokenIsType("PARENTHESIS")) {
			const parenthesisText = this._renderToken(this._consumeToken("PARENTHESIS"));
			const regexOtherBonus = /\+(\d+)\sto\s([\w\s]+)/g;
			Array.from(parenthesisText.matchAll(regexOtherBonus)).forEach(m => perception[m[2]] = Number(m[1]));
		}
		const entries = this._getEntries();
		if (entries.length) {
			const senses = [];
			entries.forEach(e => {
				const rendered = this._renderEntries([e], {asString: true});
				const range = this._parseRange_parseRangeStr(rendered);
				// TODO: Check for malformed entries?
				if (e.type === "PARENTHESIS") senses.last().type = this._tokenizerUtils.sensesTypes.find(it => it.regex.test(rendered)).type;
				else if (range.unit !== "unknown") senses.last().range = range;
				else rendered.split(", ").forEach(s => senses.push(({name: s})));
			});
			creature.senses = senses;
		}
		creature.perception = perception;
	}
	_parseLanguages (creature) {
		this._consumeToken(this._tokenizerUtils.languages);
		const entries = this._getEntries();
		const languages = {};
		// FIXME: Newlines will ruin this. Also very ill conditioned
		if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentences])) {
			languages.languages = this._renderEntries(entries, {asString: true}).split(", ");
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentencesSemiColon, this._tokenizerUtils.sentences])) {
			languages.languages = this._renderEntries([entries[0]], {asString: true}).split(", ");
			languages.abilities = this._renderEntries([entries[1]], {asString: true}).split(", ");
		}
		creature.languages = languages;
	}
	_parseSkills (creature) {
		this._consumeToken(this._tokenizerUtils.skillsProp);
		const skills = {};
		const regexBonus = /\+(\d+)/;
		const regexOtherBonus = /\+(\d+)\sto\s([\w\s]+)/g;
		while (this._tokenIsType(this._tokenizerUtils.skills)) {
			const skill = this._consumeToken(this._tokenizerUtils.skills).type.toLowerCase();
			const bonusToken = this._consumeToken(this._tokenizerUtils.sentences);
			skills[skill] = {std: Number(regexBonus.exec(bonusToken.value)[1])};
			if (this._tokenIsType("PARENTHESIS")) {
				const parenthesisText = this._renderToken(this._consumeToken("PARENTHESIS"));
				Array.from(parenthesisText.matchAll(regexOtherBonus)).forEach(m => skills[skill][m[2]] = Number(m[1]));
			}
		}
		creature.skills = skills;
	}
	_parseAbilityScores (creature) {
		const token = this._consumeToken(this._tokenizerUtils.creatureAbilityScores);
		const match = this._tokenizerUtils.creatureAbilityScores.find(it => it.type === token.type).regex.exec(token.value);
		const abilityMods = {};
		const convertScore = (string) => {
			string = string.trim();
			string = string.replace(/[,;]/g, "");
			string = string.replace(/[\u2013]/, "-");
			if (Number.isNaN(Number(string))) return 0;
			return Number(string);
		}
		abilityMods.str = convertScore(match[1]);
		abilityMods.dex = convertScore(match[2]);
		abilityMods.con = convertScore(match[3]);
		abilityMods.int = convertScore(match[4]);
		abilityMods.wis = convertScore(match[5]);
		abilityMods.cha = convertScore(match[6]);
		creature.abilityMods = abilityMods;
	}
	_parseItems (creature) {
		this._consumeToken(this._tokenizerUtils.items);
		const entries = this._getEntries();
		const rendered = this._renderEntries(entries, {asString: true});
		creature.items = rendered.split(", ");
	}
	_parseAC (creature) {
		this._consumeToken(this._tokenizerUtils.ac);
		const ac = {};
		const stdACToken = this._consumeToken(this._tokenizerUtils.sentences);
		ac.std = Number(stdACToken.value.trim().replace(/[,;]/g, ""));
		if (this._tokenIsType("PARENTHESIS")) {
			const parenthesisText = this._renderToken(this._consumeToken("PARENTHESIS")).replace(/^\(|\)$/g, "");
			const regexOtherAC = /.*(\d+)\s(.+)/g;
			Array.from(parenthesisText.matchAll(regexOtherAC)).forEach(m => {
				const num = Number(m[1]);
				// small ACs are likely abilities like "+2 vs. magic"
				if (num > 4) ac[m[2]] = Number(m[1]);
				else (ac.abilities = ac.abilities || []).push(m[0]);
			});
		}
		this._getStatAbilities(ac);
		creature.ac = ac;
	}
	_parseCreatureSavingThrows (creature) {
		const savingThrows = {};
		const convertSavingThrow = (prop) => {
			const bonus = this._getBonusPushAbilities();
			savingThrows[prop] = {std: bonus};
			if (this._tokenIsType("PARENTHESIS")) {
				const parenthesisText = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
				const regexOtherST = /\+(\d+)\s(.+)/g;
				Array.from(parenthesisText.matchAll(regexOtherST)).forEach(m => savingThrows[prop][m[2]] = Number(m[1]));
			}
		}
		this._consumeToken(this._tokenizerUtils.fort);
		convertSavingThrow("fort");
		this._consumeToken(this._tokenizerUtils.ref);
		convertSavingThrow("ref");
		this._consumeToken(this._tokenizerUtils.will);
		convertSavingThrow("will");
		this._getStatAbilities(savingThrows);
		creature.savingThrows = savingThrows;
	}
	_parseHP (creature) {
		creature.hp = [];
		while (this._tokenIsType(this._tokenizerUtils.hp)) {
			this._consumeToken(this._tokenizerUtils.hp);
			const hp = {};
			if (this._tokenIsType("PARENTHESIS")) hp.name = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
			hp.hp = this._getBonusPushAbilities();
			creature.hp.push(hp);
			this._getStatAbilities(hp);
		}
	}
	_parseHardness (creature) {
		this._consumeToken(this._tokenizerUtils.hardness);
		const token = this._consumeToken(this._tokenizerUtils.sentences);
		const rendered = this._renderToken(token).replace(/[,.;]/, "");
		// TODO: Surely this data structure should change
		creature.hardness = Number(rendered);
	}
	_parseImmunities (creature) {
		// FIXME: data structure?
		this._consumeToken(this._tokenizerUtils.immunities);
		const entries = this._getEntries();
		creature.immunities = this._splitSemiOrComma(entries);
		// const immunities = this._splitSemiOrComma(entries);
		// const filterFunc = i => Object.values(Parser.DMGTYPE_JSON_TO_FULL).includes(i.toLowerCase()) || /damage/.test(i);
		// creature.immunities = {
		// 	damage: immunities.filter(filterFunc).length ? immunities.filter(filterFunc) : undefined,
		// 	condition: immunities.filter(i => !filterFunc(i)).length ? immunities.filter(i => !filterFunc(i)) : undefined,
		// }
	}
	_parseWeaknesses (creature) {
		this._consumeToken(this._tokenizerUtils.weaknesses);
		const entries = this._getEntries();
		const weaknesses = this._splitSemiOrComma(entries);
		creature.weaknesses = weaknesses.map(this._parseWeakResistAmount);
	}
	_parseResistances (creature) {
		this._consumeToken(this._tokenizerUtils.resistances);
		const entries = this._getEntries();
		const resistances = this._splitSemiOrComma(entries);
		creature.resistances = resistances.map(this._parseWeakResistAmount);
	}
	_parseWeakResistAmount (str) {
		const amountRegExp = /(.*?)\s(\d+)(.+)?/;
		const match = amountRegExp.exec(str);
		if (match) return {name: match[1], amount: Number(match[2]), note: match[3] ? match[3].trimAnyChar(" ();,.") : undefined};
		return {name: str}
	}
	_parseSpeed (creature) {
		this._consumeToken(this._tokenizerUtils.speed);
		const speed = {};
		const entries = this._getEntries();
		const ixSemiColon = entries.findIndex(e => this._tokenIsType(this._tokenizerUtils.sentencesSemiColon, e));
		// this is trash
		const entriesSpeeds = ixSemiColon === -1 ? entries : entries.slice(0, ixSemiColon + 1);
		const entriesAbilities = ixSemiColon === -1 ? [] : entries.slice(ixSemiColon + 1);
		const reSpeed = /(.*? )?(\d+) feet/;
		this._renderEntries(entriesSpeeds, {asString: true}).split(", ").forEach(se => {
			const match = reSpeed.exec(se);
			const name = (match[1] || "walk").trim();
			speed[name] = Number(match[2]);
		});
		if (entriesAbilities.length) speed.abilities = this._splitSemiOrComma(entriesAbilities);
		creature.speed = speed;
	}
	_parseAttacks (creature) {
		creature.attacks = creature.attacks || [];
		const token = this._consumeToken(this._tokenizerUtils.attacks);
		const attack = {};
		attack.range = token.value.trim();
		const entries = this._getEntries();
		const reNameBonus = /(.*?) \+(\d+)/
		entries.forEach(entryToken => {
			if (this._tokenIsType(this._tokenizerUtils.actions, entryToken)) attack.activity = this._renderToken(entryToken, {asObject: true});
			if (this._tokenIsType(this._tokenizerUtils.sentences, entryToken)) {
				const rendered = this._renderToken(entryToken);
				const match = reNameBonus.exec(rendered);
				attack.name = match[1];
				attack.bonus = Number(match[2]);
			}
			if (this._tokenIsType("PARENTHESIS", entryToken)) attack.traits = this._splitSemiOrComma(this._getParenthesisInnerText(entryToken), {isText: true});
		});
		this._consumeToken(this._tokenizerUtils.damage);
		const damageEntries = this._getEntries({checkContinuedLines: true});
		attack.damage = this._renderEntries(damageEntries, {asString: true});
		creature.attacks.push(attack);
	}
	_parseSpellCasting (creature) {
		creature.spellcasting = creature.spellcasting || [];
		const casting = {};
		const castingToken = this._consumeToken(this._tokenizerUtils.spellCasting);
		const reSpellCast = this._tokenizerUtils.spellCasting.find(it => it.regex.test(castingToken.value)).regex;
		const spellMatch = reSpellCast.exec(castingToken.value);
		const name = spellMatch[1].trim();
		casting.name = name;
		const tradition = this._tokenizerUtils.spellTraditions.find(it => it.regex.test(name));
		const type = this._tokenizerUtils.spellTypes.find(it => it.regex.test(name));
		if (tradition) casting.tradition = tradition.unit;
		if (type) casting.type = type.unit;
		else casting.type = "Focus";
		this._parseSpells_parseProperties(casting);
		casting.entry = this._parseSpellEntry();
		if (this._tokenIsType(this._tokenizerUtils.cantrips)) casting.entry["0"] = this._parseCantrips();
		if (this._tokenIsType(this._tokenizerUtils.constant)) casting.entry.constant = this._parseConstantSpells();
		creature.spellcasting.push(casting);
	}
	_parseSpells_parseProperties (casting) {
		while (this._tokenStack.length) {
			let breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.spellDC)) {
				const dcToken = this._consumeToken(this._tokenizerUtils.spellDC);
				casting.DC = Number(/\d+/.exec(dcToken.value));
			}
			if (this._tokenIsType(this._tokenizerUtils.spellAttack)) {
				const atkToken = this._consumeToken(this._tokenizerUtils.spellAttack);
				casting.attack = Number(/\d+/.exec(atkToken.value));
			}
			if (this._tokenIsType(this._tokenizerUtils.focusPoints)) {
				const fpToken = this._consumeToken(this._tokenizerUtils.focusPoints);
				casting.fp = Number(/\d+/.exec(fpToken.value));
			}
			if (this._tokenIsType(this._tokenizerUtils.sentences) && this._tokenIsType(this._tokenizerUtils.focusPoints, this._peek(1))) {
				const sentenceToken = this._consumeToken(this._tokenizerUtils.sentences);
				const fpToken = this._consumeToken(this._tokenizerUtils.focusPoints);
				this._push(sentenceToken);
				this._push(fpToken);
				breakOnLength += 1;
			}
			if (breakOnLength === this._tokenStack.length) break;
		}
	}
	_parseSpells_genSpellObj (str) {
		const obj = {name: str};
		const reSourcePart = /(\B[A-Z0-9]+|\s[A-Z0-9]{2,})/
		if (reSourcePart.test(str)) {
			obj.source = reSourcePart.exec(str)[0].trim();
			obj.name = obj.name.replace(reSourcePart, "");
		}
		return obj;
	}
	_parseSpells_parseParenthesisText (str, spells) {
		const reSources = new RegExp(`(${Object.values(Parser.SOURCE_JSON_TO_FULL).join("|")})`);
		const reLevel = /(\d+)(st|nd|rd|th)/;
		const reAmount = /([x×](\d+)|at will)/;
		const rePage = /^(page|p\.) \d+$/i;
		this._splitSemiOrComma(str, {isText: true}).forEach(e => {
			if (reAmount.test(e)) {
				const matchAmount = reAmount.exec(e);
				spells[spells.length - 1].amount = Number(matchAmount[2]) || matchAmount[0];
			} else if (reLevel.test(e)) {
				const matchLevel = reLevel.exec(e);
				spells[spells.length - 1].level = Number(matchLevel[1]);
			} else if (rePage.test(e)) {
				if (this._source !== SRC_CRB) spells[spells.length - 1].source = this._source;
			} else if (reSources.test(e)) {
				const matchSource = reSources.exec(e);
				const src = Parser._parse_bToA(Parser.SOURCE_JSON_TO_FULL, matchSource[0]);
				if (src && src !== SRC_CRB) spells[spells.length - 1].source = src;
			} else spells[spells.length - 1].note = str;
		});
	}
	_parseSpells_parseSpells () {
		const spells = [];
		const reLevel = /(\d+)(st|nd|rd|th)/;
		let tokens = [];
		const renderSpellTokens = () => {
			const rendered = this._renderEntries(tokens, {asString: true, noTags: true}).replace(/[;,.]$/, "").replace(/; /, ", ");
			spells.push(...rendered.split(", ").map(s => this._parseSpells_genSpellObj(s)));
			tokens = [];
		}
		while (this._tokenIsType(this._tokenizerUtils.sentences)) {
			if (this._isAbilityName()) break;
			const breakOnLength = this._tokenStack.length;
			const matchLevel = reLevel.exec(this._peek().value);
			if (matchLevel) {
				if (matchLevel.index === 0) break;
				const splitToken = this._consumeToken(this._tokenizerUtils.sentences);
				this._push({...splitToken, value: splitToken.value.slice(matchLevel.index).trim()});
				this._push({...splitToken, value: splitToken.value.slice(0, matchLevel.index).trim()});
			}
			const token = this._consumeToken(this._tokenizerUtils.sentences);
			tokens.push(token);

			if (this._tokenIsType("PARENTHESIS")) {
				// Constant spell levels are in parentheses
				if (reLevel.test(this._peek().value)) break;
				const innerText = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
				renderSpellTokens();
				this._parseSpells_parseParenthesisText(innerText, spells);
			}
			if (breakOnLength === this._tokenStack.length) break;
		}
		renderSpellTokens();
		return spells;
	}
	// FIXME/TODO: Abstract this
	_parseSpellEntry () {
		const reLevel = /(\d+)(st|nd|rd|th)/;
		const reSlots = /(\d+) slots?/;
		const entry = {};

		while (this._tokenIsType(this._tokenizerUtils.sentences) && reLevel.test(this._peek().value)) {
			const spellLevelObj = {};
			const spells = [];
			const lvlToken = this._consumeToken(this._tokenizerUtils.sentences);
			const level = reLevel.exec(lvlToken.value)[1];
			lvlToken.value = lvlToken.value.replace(reLevel, "").trim();
			if (lvlToken.value.length) this._push(lvlToken);
			if (this._tokenIsType("PARENTHESIS")) {
				const innerText = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
				if (reSlots.test(innerText)) spellLevelObj.slots = Number(reSlots.exec(innerText)[1]);
				else this._parseSpells_parseParenthesisText(innerText, spells);
			}
			spells.push(...this._parseSpells_parseSpells());
			spellLevelObj.spells = spells;
			entry[level] = spellLevelObj;
		}
		return entry;
	}
	_parseConstantSpells () {
		this._consumeToken(this._tokenizerUtils.constant);
		const reLevel = /(\d+)(st|nd|rd|th)/;
		const constantEntry = {};
		while (this._tokenIsType("PARENTHESIS") && reLevel.test(this._peek().value)) {
			const spellLevelObj = {};
			const spells = [];
			const lvlToken = this._consumeToken("PARENTHESIS");
			const level = reLevel.exec(lvlToken.value)[1];
			spells.push(...this._parseSpells_parseSpells());
			spellLevelObj.spells = spells;
			constantEntry[level] = spellLevelObj;
		}
		return constantEntry;
	}
	_parseCantrips () {
		this._consumeToken(this._tokenizerUtils.cantrips);
		const cantripsEntry = {};
		const reLevel = /(\d+)(st|nd|rd|th)/;
		const lvlToken = this._consumeToken("PARENTHESIS");
		cantripsEntry.level = Number(reLevel.exec(this._getParenthesisInnerText(lvlToken))[1]);
		const spells = [];
		spells.push(...this._parseSpells_parseSpells());
		cantripsEntry.spells = spells;
		return cantripsEntry;
	}
	_parseRitualCasting (creature) {
		creature.rituals = creature.rituals || [];
		const ritualCasting = {};
		const castingToken = this._consumeToken(this._tokenizerUtils.ritualCasting);
		const reRitualCast = this._tokenizerUtils.ritualCasting.find(it => it.regex.test(castingToken.value)).regex;
		const name = reRitualCast.exec(castingToken.value)[1].trim();
		const tradition = this._tokenizerUtils.spellTraditions.find(it => it.regex.test(name));
		if (tradition) ritualCasting.tradition = tradition.unit;
		this._parseSpells_parseProperties(ritualCasting);
		const rituals = [];
		const entries = this._getEntries();
		entries.forEach(entryToken => {
			if (this._tokenIsType(this._tokenizerUtils.sentences, entryToken)) {
				const rendered = this._renderToken(entryToken).replace(/[;,.]$/, "");
				rituals.push(...rendered.split(", ").map(s => this._parseSpells_genSpellObj(s)));
			} else if (this._tokenIsType("PARENTHESIS", entryToken)) {
				const innerText = this._getParenthesisInnerText(entryToken);
				this._parseSpells_parseParenthesisText(innerText, rituals);
			}
		});
		reRitualCast.rituals = rituals;
		creature.rituals.push(ritualCasting);
	}
	_parseCreatureAbilities (creature) {
		const cachedParsedProps = this._parsedProperties;
		this._parsedProperties = [];

		creature.abilities = creature.abilities || {};
		const sectIx = this._tokenStack.some(t => this._tokenIsType(this._tokenizerUtils.ac, t)) + this._tokenStack.some(t => this._tokenIsType(this._tokenizerUtils.speed, t));
		const section = ["bot", "mid", "top"][sectIx];
		creature.abilities[section] = creature.abilities[section] || [];
		const ability = {};
		const lookAhead = this._getLookahead();
		if (lookAhead && this._tokenIsType(this._tokenizerUtils.afflictions, lookAhead)) {
			const affliction = this._parseAffliction();
			// affliction.isAffliction = true;
			creature.abilities[section].push(affliction);
		} else {
			const nameToken = this._consumeToken(this._tokenizerUtils.sentences);
			const rendered = this._renderToken(nameToken);
			const {name, entry} = this._getAbilityName(rendered);
			ability.name = name;
			if (entry.length) this._push({type: nameToken.type, value: entry});

			// TODO (?): Currently there seem to be no creature abilities with time unit minute, hour,...
			if (!this._tokenIsType(this._tokenizerUtils.sentences)) this._parseActivate_parseActivityComponentsTraits(ability, {noCap: true});
			this._parseProperties(ability);
			if (ability.entries == null) {
				const entries = this._getEntries({checkContinuedLines: true, checkLookahead: true});
				ability.entries = entries.length ? this._renderEntries(entries) : [];
			}
			this._parsedProperties = cachedParsedProps;

			creature.abilities[section].push(ability);
		}
	}

	_getBonusPushAbilities () {
		const token = this._consumeToken(this._tokenizerUtils.sentences);
		let rendered = this._renderToken(token);
		rendered = rendered.replace(/[,;.]/, "");
		rendered = rendered.replace(/[\u2013]/, "-");
		let abilities, bonus;
		[bonus, ...abilities] = rendered.split(" ");
		if (abilities.length) this._push({value: abilities.join(" "), type: "SENTENCE"});
		return Number(bonus);
	}
	_getStatAbilities (obj) {
		const entries = this._getEntries();
		if (entries.length) {
			(obj.abilities = obj.abilities || []).push(...this._splitSemiOrComma(entries));
		}
	}
	_splitSemiOrComma (entries, opts) {
		// TODO:
		opts = opts || {};
		const rendered = opts.isText ? entries : this._renderEntries(entries, {asString: true, noTags: true});
		return rendered.split(", ")
	}

	// FIXME: We might have tokenized some normal word occurrences of properties as property token. Do we need to check for that?
	_parseEntries (obj, opts) {
		opts = opts || {};
		const entriesOut = [];
		let strEntries = [];
		const parseEntryTypes = (token) => {
			if (this._tokenIsType(this._tokenizerUtils.successDegrees, token)) entriesOut.push(this._parseSuccessDegrees());
			else if (this._tokenIsType(this._tokenizerUtils.heightened, token)) this._parseHeightened(obj);
			else if (this._tokenIsType("LIST_MARKER", token)) entriesOut.push(this._parseList());
			else if (this._tokenIsType(this._tokenizerUtils.activate, token)) entriesOut.push(this._parseActivate());
			else if (this._tokenIsType(this._tokenizerUtils.itemVariants, token)) this._parseItemVariants(obj);
			else if (this._tokenIsType(this._tokenizerUtils.afflictions, token)) entriesOut.push(this._parseAffliction());
			else if (this._tokenIsType(this._tokenizerUtils.lvlEffect, token)) entriesOut.push(this._parseLvlEffect(obj));
			else if (this._tokenIsType(this._tokenizerUtils.special, token)) this._parseSpecial(obj);
			else if (this._tokenIsType(this._tokenizerUtils.effect, token)) entriesOut.push(this._parseAbility());
		}

		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.stringEntries)) {
				const lookAhead = this._getLookahead();
				if (lookAhead && this._tokenIsType(this._tokenizerUtils.effect, lookAhead)) {
					if (strEntries.length) {
						entriesOut.push(...this._renderEntries(strEntries));
						strEntries = [];
					}
					parseEntryTypes(lookAhead);
				} else if (lookAhead) parseEntryTypes(lookAhead);
				else strEntries.push(this._consumeToken(this._tokenizerUtils.stringEntries));
			} else {
				if (strEntries.length) {
					entriesOut.push(...this._renderEntries(strEntries));
					strEntries = [];
				}
				if (opts.isVariantItemEntries && this._tokenIsType(this._tokenizerUtils.itemVariants)) break;
				parseEntryTypes();
			}
			if (breakOnLength === this._tokenStack.length) break;
		}
		if (strEntries.length) entriesOut.push(...this._renderEntries(strEntries));
		obj.entries = entriesOut;
	}

	_parseSuccessDegrees () {
		const entries = {};
		const propFromToken = (token) => {
			switch (token.type) {
				case "CRIT_SUCCESS": return "Critical Success";
				case "SUCCESS": return "Success";
				case "FAILURE": return "Failure";
				case "CRIT_FAILURE": return "Critical Failure";
				default: throw new Error(`Unimplemented success degree "${token.type}".`)
			}
		};
		const getDegreeEntries = () => {
			const prop = propFromToken(this._consumeToken(this._tokenizerUtils.successDegrees));
			entries[prop] = this._renderEntries(this._getEntries({checkLookahead: true}));
		};
		while (this._tokenStack.length && this._tokenIsType(this._tokenizerUtils.successDegrees)) {
			getDegreeEntries();
		}

		return {type: "successDegree", entries};
	}
	_parseHeightened (obj) {
		const entries = {};
		// FIXME: Change this to conform to the sites data
		const getHeightenedEntries = () => {
			const token = this._consumeToken(this._tokenizerUtils.heightened);
			if (token.type === "HEIGHTENED_PLUS_X") {
				entries.plusX = entries.plusX || {};
				const level = /\d+/.exec(token.value)[0];
				entries.plusX[level] = this._renderEntries(this._getEntries({checkLookahead: true}));
			} else if (token.type === "HEIGHTENED_X") {
				entries.X = entries.X || {};
				const level = /\d+/.exec(token.value)[0];
				entries.X[level] = this._renderEntries(this._getEntries({checkLookahead: true}));
			} else if (token.type === "HEIGHTENED") {
				// TODO?
				throw new Error(`Heightened without level is not supported.`);
			} else {
				throw new Error(`Unimplemented heightened type "${token.type}".`);
			}
		};
		while (this._tokenStack.length && this._tokenIsType(this._tokenizerUtils.heightened)) {
			getHeightenedEntries();
		}

		return obj.heightened = entries;
	}
	_parseListItem () {
		this._consumeToken("LIST_MARKER");
		const entries = [];
		let temp = [];

		const returnItem = () => {
			entries.forEach(_ => this._consumeToken(this._tokenizerUtils.stringEntries));
			return this._renderEntries(entries, {asString: true});
		}

		for (let i = 0; i < this._tokenStack.length; i++) {
			const token = this._peek(i);
			if (this._tokenIsType(this._tokenizerUtils.stringEntries, token)) temp.push(token);
			else break;
			if (token.type.endsWith("NEWLINE")) {
				const text = temp.map(it => it.value.trim()).join(" ");
				const len = text.length;
				// TODO: fiddle with number to improve this
				// If the line is more than 10% shorter than the average length, its probably still a list entry,
				// otherwise don't add the line to the list item. (It's a line after the list?).
				if (/^[^A-Z]/.test(text) || Math.abs(this._avgLineLength - len) / this._avgLineLength > 0.10) {
					entries.push(...temp);
					temp = [];
				} else {
					return returnItem();
				}
			}
		}
		entries.push(...temp);
		return returnItem();
	}
	_parseList () {
		const list = {type: "list", items: []};

		while (this._tokenStack.length && this._tokenIsType("LIST_MARKER")) {
			list.items.push(this._parseListItem());
		}
		return list;
	}
	_parseActivate_parseActivityComponentsTraits (obj, getEntriesOpts) {
		const entries = this._getEntries(getEntriesOpts);

		if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions])) {
			// action [creature stat-blocks]
			obj.activity = this._renderToken(entries[0], {asObject: true});
		} else if (this._tokensAreTypes(entries, ["PARENTHESIS"])) {
			// (traits) [creature stat-blocks]
			obj.traits = this._getParenthesisInnerText(entries[0]).split(", ");
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences])) {
			// action, components
			obj.activity = this._renderToken(entries[0], {asObject: true});
			obj.components = this._renderEntries([entries[1]], {asString: true}).split(", ");
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, "PARENTHESIS"])) {
			// TODO: maybe sometimes components?
			// action, (traits)
			obj.activity = this._renderToken(entries[0], {asObject: true});
			obj.traits = this._getParenthesisInnerText(entries[1]).split(", ");
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences, "PARENTHESIS"])) {
			// action, components, (traits)
			obj.activity = this._renderToken(entries[0], {asObject: true});
			obj.components = this._renderEntries([entries[1]], {asString: true}).split(", ");
			obj.traits = this._getParenthesisInnerText(entries[2]).split(", ");
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentences, "PARENTHESIS"])) {
			// time, (components & traits)
			const regExpTime = new RegExp(`(\\d+) (${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")})`);
			const matchedTime = this._renderToken(entries[0]).match(regExpTime);
			if (matchedTime) obj.activity = {number: Number(matchedTime[1]), unit: this._tokenizerUtils.timeUnits.find(u => u.regex.test(matchedTime[2])).unit};
			else obj.activity = {unit: "varies", entry: this._renderToken(entries[0])};
			const componentsTraits = this._getParenthesisInnerText(entries[1], {doTag: true});
			const parts = componentsTraits.split("; ").map(p => p.split(", "));
			if (parts.length === 2) {
				if (parts[1].some(c => this._tokenizerUtils.activateComponents.some(it => it.regex.test(c)))) {
					obj.components = parts[1];
					obj.traits = parts[0];
				} else {
					obj.components = parts[0];
					obj.traits = parts[1];
				}
			} else if (parts.length === 1) {
				if (parts[0].some(c => this._tokenizerUtils.activateComponents.some(it => it.regex.test(c)))) obj.components = parts[0];
				else obj.traits = parts[0];
			} else this._cbWarn(`Encountered unknown data structure while parsing ACTIVATE traits and activation components.`);
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentences])) {
			// components: eg. Cast a Spell/Recall Knowledge
			obj.components = this._renderEntries([entries[0]], {asString: true}).split(", ");
		} else {
			this._cbWarn(`Encountered unknown data structure while parsing ACTIVATE. Skipping...`);
		}
	}
	_parseActivate () {
		this._consumeToken(this._tokenizerUtils.activate);
		const ability = {type: "ability"}
		const cachedParsedProps = this._parsedProperties;
		this._parsedProperties = [];

		this._parseActivate_parseActivityComponentsTraits(ability);
		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			// FIXME: This is probably too aggressive
			if (this._tokenIsType(this._tokenizerUtils.activate)) break;
			if (this._tokenIsType(this._tokenizerUtils.properties)) this._parseProperty(ability);
			if (breakOnLength === this._tokenStack.length) break;
		}
		this._parsedProperties = cachedParsedProps;
		return ability;
	}
	_parseAbility () {
		const nameToken = this._consumeToken(this._tokenizerUtils.sentences);
		// push fake token which we consume in this._parseActivate();
		this._push({type: "ACTIVATE"});
		const ability = this._parseActivate();
		ability.name = this._renderToken(nameToken);
		return PropOrder.getOrdered(ability, "action");
	}
	_parseLvlEffect () {
		const lvlEffect = {type: "lvlEffect", entries: []};

		const getLvlEffectEntry = () => {
			const token = this._consumeToken(this._tokenizerUtils.lvlEffect);
			const entry = {range: token.value.trim()}
			entry.entry = this._renderEntries(this._getEntries());
			lvlEffect.entries.push(entry);
		};
		while (this._tokenStack.length && this._tokenIsType(this._tokenizerUtils.lvlEffect)) {
			getLvlEffectEntry();
		}

		return lvlEffect;
	}
	_parseAffliction () {
		const affliction = {type: "affliction"};
		const stages = [];
		const parseStage = () => {
			const stage = {};
			const stageToken = this._consumeToken("STAGE");
			stage.stage = Number(/\d+/.exec(stageToken.value)[0]);
			const entries = [];
			while (this._tokenIsType(this._tokenizerUtils.sentences) || this._tokenIsType(this._tokenizerUtils.actions)) {
				entries.push(this._consumeToken([...this._tokenizerUtils.sentences, ...this._tokenizerUtils.actions]));
			}
			stage.entry = this._renderEntries(entries, {asString: true});
			if (this._tokenIsType("PARENTHESIS")) {
				stage.duration = this._renderToken(this._consumeToken("PARENTHESIS")).replace(/[()]/g, "");
			}
			stages.push(stage);
		}

		if (this._tokenIsType(this._tokenizerUtils.sentences)) {
			affliction.name = this._renderToken(this._consumeToken(this._tokenizerUtils.sentences));
		}
		if (this._tokenIsType("PARENTHESIS")) {
			affliction.traits = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS")).split(", ");
		}

		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.afflictions)) {
				if (this._tokenIsType("STAGE")) {
					parseStage();
				} else if (this._tokenIsType(this._tokenizerUtils.level)) {
					this._parseLevel(affliction);
				} else if (this._tokenIsType("MAX_DURATION")) {
					this._consumeToken("MAX_DURATION");
					affliction.maxDuration = this._renderEntries(this._getEntries(), {asString: true});
				} else if (this._tokenIsType(this._tokenizerUtils.onset)) {
					this._consumeToken(this._tokenizerUtils.onset);
					affliction.onset = this._renderEntries(this._getEntries(), {asString: true});
				} else if (this._tokenIsType(this._tokenizerUtils.savingThrow)) {
					this._consumeToken(this._tokenizerUtils.savingThrow);
					const renderedSavingThrowEntries = this._renderEntries(this._getEntries(), {asString: true});
					const regexDC = /DC (\d+)/;
					const matchedDC = regexDC.exec(renderedSavingThrowEntries);
					if (matchedDC) affliction.DC = Number(matchedDC[1]);
					affliction.savingThrow = this._tokenizerUtils.savingThrows.find(it => it.regex.test(renderedSavingThrowEntries)).full;
				} else {
					throw new Error(`Unimplemented!`);
				}
			} else if (this._tokenIsType(this._tokenizerUtils.sentences)) {
				if (this._peek().value.trim().length <= 1) this._consumeToken(this._tokenizerUtils.sentences);
				else {
					// FIXME: what if notes already exist?
					const entries = this._getEntries();
					if (entries.length) affliction.notes = this._renderEntries(entries);
				}
			}
			if (breakOnLength === this._tokenStack.length) break;
		}
		affliction.stages = stages;
		return affliction;
	}
	_parseSpecial (obj) {
		this._consumeToken(this._tokenizerUtils.special);
		const entries = this._getEntries({checkLookahead: true});
		obj.special = this._renderEntries(entries);
	}
	_parseItemVariants (obj) {
		obj.variants = obj.variants || [];
		while (this._tokenIsType(this._tokenizerUtils.itemVariants)) {
			obj.variants.push(this._parseItemVariant());
		}
	}
	_parseItemVariant () {
		this._consumeToken(this._tokenizerUtils.itemVariants);
		const variant = {};
		const cachedParsedProps = this._parsedProperties;
		if (this._tokenIsType(this._tokenizerUtils.sentences)) {
			variant.name = this._renderEntries([this._consumeToken(this._tokenizerUtils.sentences)], {asString: true});
		}
		while (this._tokenIsType(this._tokenizerUtils.propertiesItemVariants)) {
			this._parseProperty(variant);
		}
		if (!this._tokenIsType(this._tokenizerUtils.properties)) this._parseEntries(variant, {isVariantItemEntries: true});
		this._parsedProperties = cachedParsedProps;
		return variant;
	}

	_renderToken (token, opts) {
		opts = opts || {};
		if (this._tokenIsType(this._tokenizerUtils.actions, token)) {
			if (opts.asObject) {
				switch (token.type) {
					case "ACTION": return {number: 1, unit: "action"};
					case "TWO_ACTIONS": return {number: 2, unit: "action"};
					case "THREE_ACTIONS": return {number: 3, unit: "action"};
					case "REACTION": return {number: 1, unit: "reaction"};
					case "FREE_ACTION": return {number: 1, unit: "free"};
				}
			} else {
				switch (token.type) {
					case "ACTION": return "{@as 1}";
					case "TWO_ACTIONS": return "{@as 2}";
					case "THREE_ACTIONS": return "{@as 3}";
					case "REACTION": return "{@as r}";
					case "FREE_ACTION": return "{@as f}";
				}
			}
		} else if (this._tokenIsType(this._tokenizerUtils.sentences, token)) {
			return token.value.trim();
		} else if (token.type === "PARENTHESIS") {
			return token.value.trim();
		}
		throw new Error(`Unimplemented rendering of token with type "${token.type ? token.type : "???"}"`)
	}
	_renderEntries (tokens, opts) {
		opts = opts || {};
		const entries = [""];
		for (let i = 0; i < tokens.length; i++) {
			// FIXME: This is very ugly...
			entries[entries.length - 1] += `${entries.last() === "" ? "" : " "}${this._renderToken(tokens[i])}`;
			if (i < tokens.length - 1 && this._tokenIsType("SENTENCE_TERM_NEWLINE", tokens[i])) {
				// TODO: Fiddle with these numbers to see what works best
				// If the line ends in a terminator, but the lines length is sufficiently close to the average, we don't
				// actually want to create a new entry. (The line probably ended in a terminator by chance.)
				const len = entries.last().length;
				if (Math.abs(Math.round(len / this._avgLineLength) * this._avgLineLength - len) / this._avgLineLength > 0.08) entries.push("");
			}
		}
		if (opts.asString && opts.noTags) return entries.join(" ").replace(/;$/, "");
		if (opts.asString) return TagJsons.doTagStr(entries.join(" ")).replace(/;$/, "");
		if (opts.noTags) return entries;
		return entries.map(e => TagJsons.doTagStr(e));
	}
	_getParenthesisInnerText (token, opts) {
		opts = opts || {};
		let rendered = this._renderToken(token);
		rendered = rendered.replace(/[;.,]$/, "");
		rendered = rendered.replace(/^[(]/, "");
		rendered = rendered.replace(/[)]$/, "");
		if (opts.doTag) return TagJsons.doTagStr(rendered);
		return rendered;
	}

	_getAbilityName (str) {
		const words = str.split(" ");
		const ixFirstLower = words.findIndex(w => !/^[A-Z]/.test(w) && !StrUtil.TITLE_LOWER_WORDS.includes(w));
		if (ixFirstLower === -1) return {name: words.join(" "), entry: ""};
		const ixNameEnd = ixFirstLower - words.slice(0, ixFirstLower).reverse().findIndex(w => /^[A-Z]/.test(w));
		if (ixNameEnd > 1) return {name: words.slice(0, ixNameEnd - 1).join(" "), entry: words.slice(ixNameEnd - 1).join(" ")};
		return null;
	}
	_isAbilityName () {
		const peeked = this._peek();
		if (!this._tokenIsType(this._tokenizerUtils.sentences)) return false;
		if (!peeked.isStartNewLine) return false;
		const rendered = this._renderToken(peeked);
		if (/^[^A-Z]/.test(rendered)) return false;
		if (this._parsedAbilities && this._parsedAbilities.length && this._parsedAbilities.some(a => rendered.startsWith(a))) return false;
		if (this._getAbilityName(rendered)) return true;
		return null;
	}
	// This is needed because we can only detect afflictions after we would consume its name & traits
	// Also abilities with names
	_getLookahead (maxDepth = 3) {
		if (!this._isAbilityName()) return null;
		if (!this._peek().isStartNewLine) return null;
		for (let depth = 1; depth <= maxDepth; depth++) {
			const peeked = this._peek(depth);
			if (maxDepth >= 20) break;
			if (peeked == null) break;
			if (peeked.lookahead) return peeked;
			if (peeked.lookaheadIncDepth) maxDepth += peeked.lookaheadIncDepth;
		}
		return null;
	}
	_isContinuedLine (token1) {
		const token2 = this._peek();
		// attempt to save mis-tokenized words
		if (!this._tokenIsType(this._tokenizerUtils.stringEntries, token2)) {
			const isAlreadyParsedProperty = this._isAlreadyParsedProperty(token2);
			if (!isAlreadyParsedProperty) return false;
			this._consumeToken(token2.type);
			token2.type = "SENTENCE";
			this._push(token2);
			return true;
		}
		if (this._tokenIsType(this._tokenizerUtils.actions, token2)) return true;
		if (this._tokenIsType("PARENTHESIS", token2)) return true;
		if (!this._tokenIsType(this._tokenizerUtils.sentencesNewLine, token1)) return true;
		const line1 = this._renderToken(token1);
		const line2 = this._renderToken(token2);
		// lines not starting in uppercase continue the entry
		if (/^[^A-Z]/.test(line2)) return true;
		// for creature abilities: references to previous abilities are capitalized
		if (this._parsedAbilities && this._parsedAbilities.length && this._parsedAbilities.some(a => line2.startsWith(a))) return true;
		// catching Administer \n First Aid
		// TODO: something similar for parsed abilities
		const tagged1 = TagJsons.doTagStr(line1);
		const tagged2 = TagJsons.doTagStr(line2);
		const taggedCombined = TagJsons.doTagStr(`${line1} ${line2}`);
		if (taggedCombined !== `${tagged1} ${tagged2}`) return true;

		// TODO: is something better required?
		return false;
	}
	_isAlreadyParsedProperty (token) {
		if (!this._tokenIsType(this._tokenizerUtils.properties, token)) return false;
		return this._tokenIsType(this._parsedProperties, token);
	}
	// TODO: Clean this up. When to use each option?
	/**
	 * @param [opts]
	 * @param [opts.checkContinuedLines]
	 * @param [opts.checkLookahead]
	 * @param [opts.breakAfterNewline]
	 * @param [opts.noCap] On a stack bro, imma keep it a buck 50, break on capitalized words at start of entries
	 **/
	_getEntries (opts) {
		opts = opts || {};
		const entries = [];
		while (this._tokenIsType(this._tokenizerUtils.stringEntries)) {
			if (this._isParsingCreature && this._isAbilityName()) break;
			if (opts.checkLookahead && this._getLookahead()) break;
			if (opts.noCap && /^[A-Z0-9]/.test(this._renderToken(this._peek()))) break;
			entries.push(this._consumeToken(this._tokenizerUtils.stringEntries));
			if (opts.checkContinuedLines && !this._isContinuedLine(entries.last())) break;
			if (opts.breakAfterNewline && this._tokenIsType(this._tokenizerUtils.sentencesNewLine, entries.last())) break;
		}
		return entries;
	}

	_consumeToken (tokenType) {
		const token = this._tokenStack.pop();

		// FIXME: if tokenType is static getter fix the strings
		if (token == null) throw new Error(`Unexpected null token! Expected "${tokenType}".`);
		if (!this._tokenIsType(tokenType, token)) throw new Error(`Unexpected token of type "${token.type}"! Expected "${tokenType}".`);

		return token;
	}
	_getNextToken () {
		return this._tokenizer.getNextToken();
	}
	_push (token) {
		this._tokenStack.push(token);
	}
	_peek (num = 0) {
		const idx = this._tokenStack.length - 1 - num;
		if (idx < 0) return undefined;
		return this._tokenStack[idx];
	}
	_tokenIsType (keyOrKeys, token) {
		if (keyOrKeys == null) return false;
		const keys = (Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]).map(k => typeof k === "string" ? k : k.type);
		token = token || this._peek();
		if (token == null) return false;
		return keys.includes(token.type);
	}
	_tokensAreTypes (tokens, types) {
		if (tokens.length !== types.length) return false;
		return tokens.every((e, i) => this._tokenIsType(types[i], e));
	}
}

if (typeof module !== "undefined") {
	module.exports = {
		Converter,
	}
}
