"use strict"

if (typeof module !== "undefined") {
	require("../js/utils.js");
	require("../js/parser.js");
	Object.assign(global, require("./tokenizer.js"));
	Object.assign(global, require("../js/converterutils.js"));
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
		this._genericAbilityLookup = {};

		// eslint-disable-next-line no-console
		this._cbWarn = opts.cbWarn || (typeof module !== "undefined" ? it => { throw new Error(it) } : console.warn);
	}

	async init () {
		// FIXME: Enable items tagging once we actually implement that
		const [spells, /* items, */ feats, traits, deities, actions, abilities] = await Promise.all([
			DataUtil.spell.pLoadAll(),
			// Renderer.item.pBuildList(),
			DataUtil.feat.loadJSON(),
			DataUtil.trait.loadJSON(),
			DataUtil.deity.loadJSON(),
			DataUtil.loadJSON(`${Renderer.get().baseUrl}data/actions.json`),
			DataUtil.loadJSON(`${Renderer.get().baseUrl}data/abilities.json`),
			BrewUtil.pAddBrewData(),
		]);
		await TagJsons.pInit({
			spells,
			// items,
			feats: feats.feat,
			traits: traits.trait,
			deities: deities.deity,
			actions: actions.action,
		});
		const genLookUp = (data, prop) => {
			this._genericAbilityLookup[prop] = {};
			data[prop].forEach(obj => {
				const name = (obj.name || "").trim().toLowerCase();
				const lookup = {};
				lookup.source = obj.source;
				lookup.add_hash = obj.add_hash;
				(this._genericAbilityLookup[prop][name] = this._genericAbilityLookup[prop][name] || []).push(lookup);
			});
		}
		genLookUp(abilities, "ability");
		genLookUp(actions, "action");
		genLookUp(feats, "feat");
	}
	reset () {
		this._parsedData = {};
		this._string = "";
		this._page = 0;
		this._tokenStack = [];
		this._isParsingCreature = null;
		this._parsing = null;
	}

	_preprocessString (string) {
		string = string.replaceAll(/\r/g, "");
		string = string.replaceAll(/]+/g, "]");
		string = string.replaceAll(/\[+/g, "[");
		string += "\n\n\n";
		return string;
	}

	parse (string, opts) {
		opts = opts || {};

		this.reset();

		this._string = this._preprocessString(string);
		this._page = opts.initialPage || 0;
		this._source = opts.source || "SOURCE";
		this._avgLineLength = opts.avgLineLength || 58;
		this._tokenizer.init(this._string);

		this._parseAllData();
		return this._parsedData;
	}

	_parseAllData () {
		while (this._tokenizer.hasMoreTokens()) {
			this._push(this._getNextToken());
			if (this._tokenIsType(this._tokenizerUtils.dataHeaders)) this._parseData();
			else if (this._tokenIsType("PAGE")) this._setPageNumber();
			else if (this._tokenIsType("END_DATA")) this._consumeToken("END_DATA");
			else if (this._tokenIsType("UNIMPLEMENTED")) {
				this._consumeToken("UNIMPLEMENTED");
				// this._cbWarn("The parsing of this statblock is not implemented!");
			} else throw new Error(`Unexpected token! Expected data header or page, but got "${this._peek().value}".`);
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
					case "HAZARD": (this._parsedData.hazard = this._parsedData.hazard || []).push(this._parseHazard()); return;
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
		if (type.toTitleCase() !== "Spell") {
			spell.type = type.toTitleCase();
		}
		spell.level = Number(level);
		spell.source = this._source;
		spell.page = this._page;
		spell.entries = [""];
		this._parsing = spell.name;
		this._parseTraits(spell);
		this._parseProperties(spell);
		this._parseEntries(spell, {getEntriesOpts: {doFinalize: true}});
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing spell "${spell.name}"!`);
			this._tokenStack = [];
		}
		this._parsing = null;

		if (spell.traditions) {
			spell.traditions = spell.traditions.map(t => t.toLowerCase());
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
		this._parsing = feat.name;
		this._parseTraits(feat);
		this._parseProperties(feat);
		this._parseEntries(feat, {getEntriesOpts: {doFinalize: true}});
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing feat "${feat.name}"!`);
			this._tokenStack = [];
		}
		this._parsing = null;
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
		this._parsing = item.name;
		this._parseTraits(item);
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
		this._parsing = null;
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
		this._parsing = background.name;
		this._parseTraits(background);
		this._parseProperties(background);
		this._parseEntries(background, {getEntriesOpts: {doFinalize: true}});
		this._parseBackgroundAbilityBoosts(background);
		this._parseBackgroundSkills(background);
		this._parseBackgroundFeats(background);
		this._parseBackgroundSpells(background);
		this._parseBackgroundMisc(background);
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing background "${background.name}"!`);
			this._tokenStack = [];
		}
		this._parsing = null;
		return PropOrder.getOrdered(background, "background");
	}
	_parseCreature () {
		this._tokenStack.reverse();
		this._parsedProperties = [];
		this._parsedAbilities = [];
		const headerToken = this._consumeToken("CREATURE");
		const [match, name, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "CREATURE").regex.exec(headerToken.value);
		const creature = {};
		creature.name = name.toTitleCase();
		creature.level = Number(level);
		creature.source = this._source;
		creature.page = this._page;
		this._parsing = creature.name;
		this._parseTraits(creature);
		if (this._tokenIsType(this._tokenizerUtils.stringEntries)) {
			const entries = this._getEntries();
			creature.description = this._renderEntries(entries, {asString: true});
		}
		this._isParsingCreature = true;
		this._parseCreatureProperties(creature);
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing creature "${creature.name}"!`);
			this._tokenStack = [];
		}
		this._isParsingCreature = null;
		this._parsing = null;
		return PropOrder.getOrdered(creature, "creature");
	}
	_parseHazard () {
		this._tokenStack.reverse();
		// Hazards are creatures for the purpose of parsing abilities
		this._isParsingCreature = true;
		this._parsedProperties = [];
		this._parsedAbilities = [];
		const headerToken = this._consumeToken("HAZARD");
		const [match, name, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "HAZARD").regex.exec(headerToken.value);
		const hazard = {};
		hazard.name = name.toTitleCase();
		hazard.level = Number(level);
		hazard.source = this._source;
		hazard.page = this._page;
		this._parsing = hazard.name;
		this._parseTraits(hazard);
		this._parseHazardProperties(hazard);
		if (this._tokenStack.length > 0) {
			this._cbWarn(`Token stack was not empty after parsing hazard "${hazard.name}"!`);
			this._tokenStack = [];
		}
		this._isParsingCreature = null;
		this._parsing = null;
		return PropOrder.getOrdered(hazard, "hazard");
	}

	_parseTraits (obj, opts) {
		opts = opts || {};
		const traits = [];
		while (this._tokenIsType(this._tokenizerUtils.traits)) {
			const traitToken = this._consumeToken(this._tokenizerUtils.traits);
			traits.push(traitToken.value.trim().toLowerCase());
		}
		if (traits.length === 0) return;
		obj.traits = traits;
	}
	_parseProperties (obj, opts) {
		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.properties)) this._parseProperty(obj, opts);
			if (breakOnLength === this._tokenStack.length) break;
		}
	}
	_parseProperty (obj, opts) {
		if (this._tokenIsType(this._tokenizerUtils.access)) this._parseAccess(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.area)) this._parseArea(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.activate)) this._parseActivateProperty(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.ammunition)) this._parseAmmunition(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.bulk)) this._parseBulk(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.cast)) this._parseCast(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.cost)) this._parseCost(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.craftRequirements)) this._parseCraftRequirements(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.duration)) this._parseDuration(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.effect)) this._parseEffect(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.frequency)) this._parseFrequency(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.level)) this._parseLevel(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.prerequisites)) this._parsePrerequisites(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.price)) this._parsePrice(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.range)) this._parseRange(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.requirements)) this._parseRequirements(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.savingThrow)) this._parseSavingThrow(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.shieldData)) this._parseShieldData(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.targets)) this._parseTargets(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.traditions)) this._parseTraditions(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.traditionsSubclasses)) this._parseTraditionsSubclasses(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.trigger)) this._parseTrigger(obj, opts);
		else if (this._tokenIsType(this._tokenizerUtils.usage)) this._parseUsage(obj, opts);
		else throw new Error(`Unimplemented property creation of type "${this._peek().type}"`);
	}

	_parseAccess (obj, opts) {
		this._parseGenericProperty(obj, this._tokenizerUtils.access, "access", opts);
	}
	_parseActivateProperty (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.activate);
		const activate = {};
		this._parseActivate_parseActivityComponentsTraits(activate, {breakAfterNewline: true, ...opts.getEntriesOpts});
		obj.activate = activate;
	}
	_parseAmmunition (obj, opts) {
		opts = opts || {};
		this._parsedProperties.push(...this._tokenizerUtils.ammunition);
		this._consumeToken(this._tokenizerUtils.ammunition);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		obj.ammunition = this._renderEntries(entries, {asString: true}).split(", ");
	}
	_parseArea (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.area);
		this._parsedProperties.push(...this._tokenizerUtils.area);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		obj.area = {entry: this._renderEntries(entries, {asString: true}), types: []};
		this._tokenizerUtils.areaTypes.forEach(({regex, type}) => {
			if (regex.test(obj.area.entry)) obj.area.types.push(type);
		});
		if (obj.area.types.length === 0) obj.area.types.push("Misc.")
	}
	_parseBulk (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.bulk);
		this._parsedProperties.push(...this._tokenizerUtils.bulk);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		const rendered = this._renderEntries(entries, {asString: true});
		if (Number.isNaN(Number(rendered))) obj.bulk = rendered;
		else obj.bulk = Number(rendered);
	}
	_parseCast (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.cast);
		this._parsedProperties.push(...this._tokenizerUtils.cast);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		const components = [];

		if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences])) {
			obj.cast = this._renderToken(entries[0], {asObject: true});
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[1].value)) components.push(key);
			});
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentences, "PARENTHESIS"])) {
			const regExpTime = new RegExp(`(\\d+) (${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")})`);
			const matchedTime = this._renderToken(entries[0]).match(regExpTime);
			if (matchedTime) obj.cast = {number: Number(matchedTime[1]), unit: this._tokenizerUtils.timeUnits.find(u => u.regex.test(matchedTime[2])).unit};
			else obj.cast = {number: 1, unit: "varies", entry: this._renderToken(entries[0])};
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[1].value)) components.push(key);
			});
		} else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences, this._tokenizerUtils.actions, "PARENTHESIS"])) {
			obj.cast = {number: 1, unit: "varies", entry: entries.slice(0, 3).map(e => this._renderToken(e)).join(" ")};
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[3].value)) components.push(key);
			});
		} else {
			this._cbWarn(`Encountered unknown data structure while parsing CAST in "${obj.name}". Skipping...`);
		}

		if (components.length) obj.components = [components];
	}
	_parseCost (obj, opts) {
		this._parseGenericProperty(obj, this._tokenizerUtils.cost, "cost", opts);
	}
	_parseCraftRequirements (obj, opts) {
		opts = opts || {};
		opts = MiscUtil.merge(opts, {getEntriesOpts: {doFinalize: true}});
		this._parseGenericProperty(obj, this._tokenizerUtils.craftRequirements, "craftReq", opts);
	}
	_parseDuration (obj, opts) {
		// TODO: Dismissible spells
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.duration);
		this._parsedProperties.push(...this._tokenizerUtils.duration);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		const rendered = this._renderEntries(entries, {asString: true});
		const regExpDuration = new RegExp(`(sustained)?(?: up to )?(\\d+)? ?(${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")})?$`);
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
	_parseEffect (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.effect);
		this._parsedProperties.push(...this._tokenizerUtils.effect);
		this._parseEntries(obj, {noAbilities: true});
	}
	_parseFrequency (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.frequency);
		this._parsedProperties.push(...this._tokenizerUtils.frequency);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
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
	_parseLevel (obj, opts) {
		opts = opts || {};
		const lvlToken = this._consumeToken(this._tokenizerUtils.level);
		this._parsedProperties.push(...this._tokenizerUtils.level);
		obj.level = Number(/\d+/.exec(lvlToken.value)[0]);
	}
	_parsePrerequisites (obj, opts) {
		this._parseGenericProperty(obj, this._tokenizerUtils.prerequisites, "prerequisites", opts);
	}
	_parsePrice (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.price);
		this._parsedProperties.push(...this._tokenizerUtils.price);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
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
	_parseRange (obj, opts) {
		// TODO: fix faulty entries that should be area instead?
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.range);
		this._parsedProperties.push(...this._tokenizerUtils.range);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		const rendered = this._renderEntries(entries, {asString: true});
		const {range, rest} = this._parseRange_parseRangeStr(rendered);
		obj.range = range;
	}
	_parseRange_parseRangeStr (string) {
		const range = {};
		const regExpRange = new RegExp(`(\\d+)? ?(${this._tokenizerUtils.rangeUnits.map(u => u.regex.source).join("|")})`);
		const matched = regExpRange.exec(string);
		let rest = "";
		if (matched && matched[0]) {
			range.unit = this._tokenizerUtils.rangeUnits.find(u => u.regex.test(matched[2])).unit;
			if (matched[1]) range.number = Number(matched[1]);
			rest = string.replace(regExpRange, "");
			rest.trimAnyChar(" ,;.");
		} else {
			range.unit = "unknown";
			range.entry = string;
		}
		return {range, rest};
	}
	_parseRequirements (obj, opts) {
		this._parseGenericProperty(obj, this._tokenizerUtils.requirements, "requirements", opts);
	}
	_parseSavingThrow (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.savingThrow);
		this._parsedProperties.push(...this._tokenizerUtils.savingThrow);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		const rendered = this._renderEntries(entries, {asString: true});
		obj.savingThrow = {type: this._tokenizerUtils.savingThrows.filter(u => u.regex.test(rendered)).map(st => st.short)};
		if (/basic/.test(rendered)) obj.savingThrow.basic = true;
	}
	_parseShieldData (obj, opts) {
		opts = opts || {};
		const token = this._consumeToken(this._tokenizerUtils.shieldData);
		const reHardness = /Hardness\s(\d+)/i;
		const reHP = /HP\s(\d+)/;
		const reBT = /BT\s(\d+)/;
		const hardness = Number(reHardness.exec(token.value)[1]);
		const hp = Number(reHP.exec(token.value)[1]);
		const bt = Number(reBT.exec(token.value)[1]);
		obj.shieldData = {hardness, hp, bt};
	}
	_parseTargets (obj, opts) {
		this._parseGenericProperty(obj, this._tokenizerUtils.targets, "targets", opts);
	}
	_parseTraditions (obj, opts) {
		opts = opts || {};
		this._consumeToken(this._tokenizerUtils.traditions);
		this._parsedProperties.push(...this._tokenizerUtils.traditions);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		obj.traditions = entries.map(e => this._renderToken(e)).join(" ").split(", ").map(tr => tr.trim().toTitleCase());
	}
	_parseTraditionsSubclasses (obj, opts) {
		opts = opts || {};
		const token = this._consumeToken(this._tokenizerUtils.traditionsSubclasses);
		this._parsedProperties.push(token);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		const altTraditions = entries.map(e => this._renderToken(e)).join(" ").split(", ").map(tr => tr.trim().toTitleCase());
		obj.subclass = obj.subclass || {};
		const key = `${this._tokenizerUtils.traditionsSubclasses.find(it => it.type === token.type).class}|${token.value.trim()}`;
		if (token.type === "DOMAIN") {
			obj.domains = altTraditions;
		} else {
			obj.subclass[key] = altTraditions;
		}
	}
	_parseTrigger (obj, opts) {
		this._parseGenericProperty(obj, this._tokenizerUtils.trigger, "trigger", opts);
	}
	_parseUsage (obj, opts) {
		this._parseGenericProperty(obj, this._tokenizerUtils.usage, "usage", opts);
	}
	_parseGenericProperty (obj, tokenType, prop, opts) {
		opts = opts || {};
		this._parsedProperties.push(...tokenType);
		this._consumeToken(tokenType);
		const entries = this._getEntries({checkContinuedLines: true, ...opts.getEntriesOpts});
		obj[prop] = this._renderEntries(entries, {asString: true});
	}

	_parseItemCategory (item) {
		const cats = this._tokenizerUtils.itemCategories;
		if (cats.map(c => c.cat.toLowerCase()).includes(item.type.toLowerCase())) {
			item.category = item.type;
			return;
		}
		for (let cat of cats.map(c => c.cat)) {
			if ((item.traits || []).map(t => t.toLowerCase()).includes(cat.toLowerCase())) {
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
	_parseBackgroundSpells (background) {
		// Look for "cast {@spell ...}" as a tell that there's a granted spell
		const spells = background.entries.filter(e => typeof e === "string").join(" ").match(/(?<=\bcast (the )?\{@spell )[^{}]+(?=\})/gi);
		if (spells) background.spells = spells;
	}
	_parseBackgroundMisc (background) {
		let miscTags = [];
		if (background.entries.some(it => it.type === "ability")) miscTags.push("ability");
		if (background.entries.some(it => typeof it === "string" ? !!it.match(/\+\d \w+ bonus/) : false)) miscTags.push("situationalBenefit"); // will catch most
		if (background.entries.some(it => typeof it === "string" ? !!it.match(/low-light vision|darkvision|scent|thoughtsense|tremorsense|wavesense/) : false)) miscTags.push("sense"); // best attempt
		// equipment and drawbacks deemed infeasible to automatically recognise
		if (miscTags.length) background.miscTags = miscTags;
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
			} else if (this._tokenIsType(this._tokenizerUtils.stringEntries) && this._peek().isStartNewLine) this._parseCreatureAbilities(obj);
			else this._cbWarn(`Unexpected token "${this._peek().value}"`);
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
			const regexOtherBonus = /\+(\d+)\s([\w\s]+)/g;
			Array.from(parenthesisText.matchAll(regexOtherBonus)).forEach(m => perception[m[2]] = Number(m[1]));
		}
		const entries = this._getEntries();
		if (entries.length) {
			const senses = [];
			entries.forEach(e => {
				const rendered = this._renderEntries([e], {asString: true});
				// TODO: Check for malformed entries?
				if (e.type === "PARENTHESIS") {
					const senseType = this._tokenizerUtils.sensesTypes.find(it => it.regex.test(rendered));
					if (senseType) senses.last().type = senseType.type;
					else senses.last().note = this._getParenthesisInnerText(e);
				} else {
					rendered.split(", ").forEach(senseStr => {
						const {range, rest} = this._parseRange_parseRangeStr(senseStr);
						if (rest === "" && range.unit !== "unknown") senses.last().range = range;
						else {
							const name = range.unit === "unknown" ? senseStr : rest || senseStr;
							const sense = {name, range: range.unit === "unknown" ? undefined : range};
							senses.push(sense);
						}
					});
				}
			});
			creature.senses = senses;
		}
		creature.perception = perception;
	}
	_parseLanguages (creature) {
		this._consumeToken(this._tokenizerUtils.languages);
		const entries = this._getEntries();
		let languages = [];
		let abilities = [];

		const numSemis = entries.filter(e => this._tokenIsType(this._tokenizerUtils.sentencesSemiColon, e)).length;
		if (numSemis === 0) {
			// assume no abilities
			entries.forEach(entry => {
				if (this._tokenIsType(this._tokenizerUtils.sentences, entry)) {
					const rendered = this._renderEntries([entry], {asString: true});
					languages.push(...rendered.split(", "));
				} else if (this._tokenIsType(this._tokenizerUtils.parenthesis, entry)) {
					languages[languages.length - 1] += ` ${this._renderToken(entry)}`;
				} else {
					throw new Error(`Unexpected token while paring languages: "${entry.type}"`);
				}
			});
		} else if (numSemis === 1) {
			const ixSemi = entries.findIndex(e => this._tokenIsType(this._tokenizerUtils.sentencesSemiColon, e));
			languages = this._renderEntries(entries.slice(0, ixSemi + 1), {asString: true}).split(", ");
			abilities = this._renderEntries(entries.slice(ixSemi + 1), {asString: true}).split(", ");
		} else {
			// assume no abilities, languages seperated by semicolon
			entries.forEach(entry => {
				if (this._tokenIsType(this._tokenizerUtils.sentences, entry)) {
					const rendered = this._renderEntries([entry], {asString: true});
					languages.push(...rendered);
				} else if (this._tokenIsType(this._tokenizerUtils.parenthesis, entry)) {
					languages[languages.length - 1] += ` ${this._renderToken(entry)}`;
				} else {
					throw new Error(`Unexpected token while paring languages: "${entry.type}"`);
				}
			});
		}

		const regexRemove = /['’-]/g;
		const regexSplitWords = /\W+/;
		const regexStartsUppercase = /^\p{Lu}/u;
		const [filteredLanguages, notes] = languages.partition(lang => {
			// heuristically detect language notes by looking for non-capitalized words
			// remove some punctuation to avoid treating e.g. D'ziriak as multiple words
			return lang.replace(regexRemove, "")
				.split(regexSplitWords)
				.every(w => regexStartsUppercase.test(w));
		});

		creature.languages = {};
		if (filteredLanguages.length) {
			// store languages as lowercased
			creature.languages.languages = filteredLanguages.map(l => l.toLowerCase());
		}
		if (notes.length) {
			creature.languages.notes = notes;
		}
		if (abilities.length) {
			creature.languages.abilities = abilities;
		}
	}
	_parseSkills (creature) {
		this._consumeToken(this._tokenizerUtils.skillsProp);
		const skills = {};
		const regexBonus = /\+(\d+)/;
		const regexOtherBonus = /\+(\d+)\s([\w\s]+)/g;
		// skill entries should be followed by the skill bonus
		while (this._tokenIsType(this._tokenizerUtils.skills) && this._tokenIsType("SKILL_BONUS", this._peek(1))) {
			const token = this._consumeToken(this._tokenizerUtils.skills);
			const skill = token.value.trim().toLowerCase().replace(/\s/g, " ");
			skills[skill] = {};

			const bonusToken = this._consumeToken("SKILL_BONUS");
			skills[skill].std = Number(regexBonus.exec(bonusToken.value.replace(/\s/g, ""))[1]);

			// optionally followed by other bonuses for the same skill
			if (this._tokenIsType("PARENTHESIS")) {
				const parenthesisText = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
				const matches = Array.from(parenthesisText.matchAll(regexOtherBonus));
				if (matches.length) matches.forEach(m => skills[skill][m[2]] = Number(m[1]));
				else skills[skill].note = parenthesisText;
			}
		}

		// if we found a skill entry without a bonus, assume it's part of a skill note
		// e.g. "one or more Lore skills related to a specific plane" is incorrectly detected as a lore skill at first
		let extraEntries = [];
		if (this._tokenIsType(this._tokenizerUtils.skills)) {
			const noteStart = this._consumeToken(this._tokenizerUtils.skills);
			noteStart.type = "SENTENCE";
			extraEntries.push(noteStart)
		}

		// assume that any text entries following the skills are skill notes
		const entries = [...extraEntries, ...this._getEntries()];
		if (entries.length) {
			const rendered = this._renderEntries(entries, {asString: true});
			skills.notes = rendered.split(", ");
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
			string = string.replace(/\s/g, "");
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
		creature.defenses = creature.defenses || {};
		this._consumeToken(this._tokenizerUtils.ac);
		const ac = {};
		const stdACToken = this._consumeToken(this._tokenizerUtils.sentences);
		ac.std = Number(stdACToken.value.trim().replace(/[,;]/g, ""));
		if (this._tokenIsType("PARENTHESIS")) {
			const parenthesisText = this._renderToken(this._consumeToken("PARENTHESIS")).replace(/^\(|\);?$/g, "");
			const regexOtherAC = /^(\d+)\s+(.+)$/;
			parenthesisText.split(",").map(t => t.trim()).forEach(t => {
				const match = regexOtherAC.exec(t);
				if (match) {
					ac[match[2]] = Number(match[1]);
				} else {
					ac.abilities = ac.abilities || [];
					ac.abilities.push(t)
				}
			});
		}
		this._getStatAbilities(ac);
		creature.defenses.ac = ac;
	}
	_parseCreatureSavingThrows (creature) {
		creature.defenses = creature.defenses || {};
		const savingThrows = {};
		const convertSavingThrow = (prop) => {
			const bonus = this._getBonusPushAbilities();
			savingThrows[prop] = {std: bonus};
			if (this._tokenIsType("PARENTHESIS")) {
				const parenthesisText = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
				const regexOtherST = /^\+(\d+)\s+(.+)$/;
				parenthesisText.split(",").map(t => t.trim()).forEach(t => {
					const match = regexOtherST.exec(t);
					if (match) {
						savingThrows[prop][match[2]] = Number(match[1]);
					} else {
						savingThrows[prop].abilities = savingThrows[prop].abilities || [];
						savingThrows[prop].abilities.push(t)
					}
				});
			}
		}
		if (this._tokenIsType(this._tokenizerUtils.fort)) {
			this._consumeToken(this._tokenizerUtils.fort);
			convertSavingThrow("fort");
		}
		if (this._tokenIsType(this._tokenizerUtils.ref)) {
			this._consumeToken(this._tokenizerUtils.ref);
			convertSavingThrow("ref");
		}
		if (this._tokenIsType(this._tokenizerUtils.will)) {
			this._consumeToken(this._tokenizerUtils.will);
			convertSavingThrow("will");
		}
		this._getStatAbilities(savingThrows);
		creature.defenses.savingThrows = savingThrows;
	}
	_parseHP (creature) {
		creature.defenses = creature.defenses || {};
		creature.defenses.hp = [];
		while (this._tokenIsType(this._tokenizerUtils.hp)) {
			this._consumeToken(this._tokenizerUtils.hp);
			const hp = {};
			if (this._tokenIsType("PARENTHESIS")) hp.name = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
			hp.hp = this._getBonusPushAbilities();
			creature.defenses.hp.push(hp);
			this._getStatAbilities(hp);
		}
	}
	_parseHardness (creature) {
		creature.defenses = creature.defenses || {};
		this._consumeToken(this._tokenizerUtils.hardness);
		const token = this._consumeToken(this._tokenizerUtils.sentences);
		const rendered = this._renderToken(token).replace(/[,.;]/, "");
		// TODO: Surely this data structure should change
		creature.defenses.hardness = Number(rendered);
	}
	_parseImmunities (creature) {
		// FIXME: data structure?
		creature.defenses = creature.defenses || {};
		this._consumeToken(this._tokenizerUtils.immunities);
		const entries = this._getEntries();
		creature.defenses.immunities = this._splitSemiOrComma(entries);
		// const immunities = this._splitSemiOrComma(entries);
		// const filterFunc = i => Object.values(Parser.DMGTYPE_JSON_TO_FULL).includes(i.toLowerCase()) || /damage/.test(i);
		// creature.immunities = {
		// 	damage: immunities.filter(filterFunc).length ? immunities.filter(filterFunc) : undefined,
		// 	condition: immunities.filter(i => !filterFunc(i)).length ? immunities.filter(i => !filterFunc(i)) : undefined,
		// }
	}
	_parseWeaknesses (creature) {
		creature.defenses = creature.defenses || {};
		this._consumeToken(this._tokenizerUtils.weaknesses);
		const entries = this._getEntries();
		const weaknesses = this._splitSemiOrComma(entries);
		creature.defenses.weaknesses = weaknesses.map(this._parseWeakResistAmount);
	}
	_parseResistances (creature) {
		creature.defenses = creature.defenses || {};
		this._consumeToken(this._tokenizerUtils.resistances);
		const entries = this._getEntries();
		const resistances = this._splitSemiOrComma(entries);
		creature.defenses.resistances = resistances.map(this._parseWeakResistAmount);
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
		const reSpeed = /(.*? )?(\d+) feet/;
		const rendered = this._renderEntries(entries, {asString: true});
		rendered.split(/[,;] /).forEach(se => {
			const match = reSpeed.exec(se);
			if (match) {
				const name = (match[1] || "walk").trim();
				speed[name] = Number(match[2]);
			} else {
				speed.abilities = speed.abilities || [];
				speed.abilities.push(se)
			}
		});
		creature.speed = speed;
	}
	_parseAttacks (creature) {
		creature.attacks = creature.attacks || [];
		const token = this._consumeToken(this._tokenizerUtils.attacks);
		const attack = {};
		attack.range = token.value.trim();
		const entries = this._getEntries();
		const reNameBonus = /(.*?) \+\s?(\d+)/;
		const textEntries = [];
		entries.forEach(entryToken => {
			if (this._tokenIsType(this._tokenizerUtils.actions, entryToken)) {
				const activity = this._renderToken(entryToken, {asObject: true});
				if (!(activity.unit === "action" && activity.number === 1)) {
					attack.activity = activity;
				}
			}
			if (this._tokenIsType(this._tokenizerUtils.sentences, entryToken)) textEntries.push(entryToken);
			if (this._tokenIsType("PARENTHESIS", entryToken)) attack.traits = this._splitSemiOrComma(this._getParenthesisInnerText(entryToken), {isText: true});
		});
		const renderedText = this._renderEntries(textEntries, {asString: true, noTags: true});
		const match = reNameBonus.exec(renderedText);
		if (!match) {
			throw new Error(`Failed parsing ${attack.range} attack! Missing attack name or bonus: "${renderedText}"`);
		}
		attack.name = match[1];
		attack.attack = Number(match[2]);
		this._consumeToken(this._tokenizerUtils.damage);
		const damageEntries = this._getEntries({checkContinuedLines: true});
		attack.damage = this._renderEntries(damageEntries, {asString: true});
		if (this._tokenIsType(this._tokenizerUtils.atkNoMAP)) {
			this._consumeToken(this._tokenizerUtils.atkNoMAP);
			attack.noMAP = true;
		}
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
		if (tradition) casting.tradition = tradition.unit.toLowerCase();
		if (type) casting.type = type.unit.toTitleCase();
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
			if (this._tokenIsType("PARENTHESIS")) {
				const pToken = this._consumeToken("PARENTHESIS");
				casting.note = this._getParenthesisInnerText(pToken);
			}
			if (this._tokenIsType(this._tokenizerUtils.spellAttack)) {
				const atkToken = this._consumeToken(this._tokenizerUtils.spellAttack);
				casting.attack = Number(/\d+/.exec(atkToken.value));
			}
			if (this._tokenIsType(this._tokenizerUtils.focusPoints)) {
				const fpToken = this._consumeToken(this._tokenizerUtils.focusPoints);
				casting.fp = Number(/\d+/.exec(fpToken.value));
			}
			if (this._tokenIsType([...this._tokenizerUtils.sentences, "CR_SPELL_LEVEL"]) && this._tokenIsType(this._tokenizerUtils.focusPoints, this._peek(1))) {
				const sentenceToken = this._consumeToken([...this._tokenizerUtils.sentences, "CR_SPELL_LEVEL"]);
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
	// TODO: Expand tokenizer ?
	_parseSpells_parseParenthesisText (str, spells) {
		const reSources = new RegExp(`(${Object.entries(Parser.SOURCE_JSON_TO_FULL).flat().map(s => s.replace(/[^\w\s]/g, "")).join("|")})`);
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
				if (this._source.toLowerCase() !== SRC_CRB.toLowerCase()) spells[spells.length - 1].source = this._source;
			} else if (reSources.test(e.replace(/[^\w\s]/g, ""))) {
				const matchSource = reSources.exec(e.replace(/[^\w\s]/g, ""));
				const src = Parser._parse_bToA(Parser.SOURCE_JSON_TO_FULL, matchSource[0]).toLowerCase();
				if (src && src !== SRC_CRB.toLowerCase()) spells[spells.length - 1].source = src;
			} else {
				spells[spells.length - 1].note = [...(spells[spells.length - 1].note || "").split("; ").filter(Boolean), e].join("; ");
			}
		});
	}
	_parseSpells_parseSpells () {
		const spells = [];
		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType("CR_SPELL")) {
				const spToken = this._consumeToken("CR_SPELL");
				const rendered = this._renderToken(spToken);
				spells.push(this._parseSpells_genSpellObj(rendered));
			} else if (this._tokenIsType("CR_SPELL_AMOUNT")) {
				const amountToken = this._consumeToken("CR_SPELL_AMOUNT");
				const numAmount = /\d+/.exec(amountToken.value);
				spells[spells.length - 1].amount = numAmount ? Number(numAmount[0]) : "at will";
			} else if (this._tokenIsType("PARENTHESIS")) {
				const paToken = this._consumeToken("PARENTHESIS");
				const innerText = this._getParenthesisInnerText(paToken);
				this._parseSpells_parseParenthesisText(innerText, spells);
			}
			if (breakOnLength === this._tokenStack.length) break;
		}
		return spells;
	}
	_parseSpellEntry () {
		const entry = {};

		while (this._tokenIsType("CR_SPELL_LEVEL")) {
			const spellLevelObj = {};
			const spells = [];
			const lvlToken = this._consumeToken("CR_SPELL_LEVEL");
			const level = /\d+/.exec(lvlToken.value)[0];
			if (this._tokenIsType("CR_SPELL_SLOTS")) {
				const slotsToken = this._consumeToken("CR_SPELL_SLOTS");
				spellLevelObj.slots = Number(/\d+/.exec(slotsToken.value)[0]);
			}
			if (this._tokenIsType("PARENTHESIS")) {
				const innerText = this._getParenthesisInnerText(this._consumeToken("PARENTHESIS"));
				this._parseSpells_parseParenthesisText(innerText, spells);
			}
			spells.push(...this._parseSpells_parseSpells());
			spellLevelObj.spells = spells;
			entry[level] = spellLevelObj;
		}
		return entry;
	}
	_parseConstantSpells () {
		this._consumeToken(this._tokenizerUtils.constant);
		const constantEntry = {};
		while (this._tokenIsType("CR_SPELL_LEVEL")) {
			const spellLevelObj = {};
			const spells = [];
			const lvlToken = this._consumeToken("CR_SPELL_LEVEL");
			const level = /\d+/.exec(lvlToken.value)[0];
			spells.push(...this._parseSpells_parseSpells());
			spellLevelObj.spells = spells;
			constantEntry[level] = spellLevelObj;
		}
		return constantEntry;
	}
	_parseCantrips () {
		this._consumeToken(this._tokenizerUtils.cantrips);
		const cantripsEntry = {};
		if (this._tokenIsType("CR_SPELL_LEVEL")) {
			const lvlToken = this._consumeToken("CR_SPELL_LEVEL");
			cantripsEntry.level = Number(/\d+/.exec(lvlToken.value)[0]);
		} else {
			this._cbWarn("Missing cantrips level!");
			cantripsEntry.level = 0;
		}
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
		ritualCasting.rituals = [...this._parseSpells_parseSpells()];
		creature.rituals.push(ritualCasting);
	}
	_parseCreatureAbilities (creature, opts) {
		opts = opts || {};
		const cachedParsedProps = this._parsedProperties;
		this._parsedProperties = [];

		let ability = {};
		const lookAhead = this._getLookahead();
		if (lookAhead && this._tokenIsType(this._tokenizerUtils.afflictions, lookAhead)) {
			ability = this._parseAffliction();
		} else {
			ability.name = this._getAbilityName({doConsumeTokens: true})
			this._parsedAbilities.push(ability.name);

			// TODO (?): Currently there seem to be no creature abilities with time unit minute, hour,...
			if (!this._tokenIsType(this._tokenizerUtils.sentences)) this._parseActivate_parseActivityComponentsTraits(ability, {noCap: true});
			// TODO: Aura range interferes with this
			this._parseProperties(ability, {getEntriesOpts: {noBreaks: true}});
			if (ability.entries == null) this._parseEntries(ability, {noAbilities: true});

			this._parsedProperties = cachedParsedProps;
			this._setIsGenericAbility(creature, ability);
		}

		if (opts.hazardMode) {
			const isAbility = this._tokenStack.some(t => this._tokenIsType(this._tokenizerUtils.description));
			if (isAbility) (creature.abilities = creature.abilities || []).push(ability);
			else (creature.actions = creature.actions || []).push(ability)
		} else {
			creature.abilities = creature.abilities || {};
			const sectIx = this._tokenStack.some(t => this._tokenIsType(this._tokenizerUtils.ac, t)) + this._tokenStack.some(t => this._tokenIsType(this._tokenizerUtils.speed, t));
			const section = ["bot", "mid", "top"][sectIx];
			creature.abilities[section] = creature.abilities[section] || [];
			creature.abilities[section].push(ability);
		}
	}
	_setIsGenericAbility (creature, ability) {
		// TODO (?): Wrong/Different spellings
		if (ability.trigger || ability.frequency || ability.requirements) return;
		const name = (ability.name || "").trim().toLowerCase();
		if (this._genericAbilityLookup.ability[name]) {
			const lookups = this._genericAbilityLookup.ability[name];
			const lookup = lookups.find(it => it.source === this._source) || lookups.find(it => it.source === Parser.TAG_TO_DEFAULT_SOURCE.ability || lookups[0]);
			ability.generic = {tag: "ability", source: lookup.source === Parser.TAG_TO_DEFAULT_SOURCE.ability ? undefined : lookup.source, add_hash: lookup.add_hash};
		} else if (this._genericAbilityLookup.action[name]) {
			const lookups = this._genericAbilityLookup.action[name];
			const lookup = lookups.find(it => it.source === this._source) || lookups.find(it => it.source === Parser.TAG_TO_DEFAULT_SOURCE.action || lookups[0]);
			ability.generic = {tag: "action", source: lookup.source === Parser.TAG_TO_DEFAULT_SOURCE.action ? undefined : lookup.source, add_hash: lookup.add_hash};
		} else if (this._genericAbilityLookup.feat[name]) {
			if (ability.entries.length > 1) return;
			if (ability.entries.length === 1 && typeof ability.entries[0] !== "string") return;
			if (ability.entries.length === 1 && ability.entries[0].length > 100) return;
			const lookups = this._genericAbilityLookup.feat[name];
			const lookupsFiltered = lookups.filter(lu => lu.add_hash).filter(lu => {
				const re = new RegExp(`${lu.add_hash}`, "i");
				if (creature.spellcasting && creature.spellcasting.some(sc => re.test(sc.name))) return true;
				if (re.test(creature.name)) return true;
				if (creature.abilities && Object.values(creature.abilities).flat().some(ab => ab.entries && ab.entries.some(e => typeof e === "string" && re.test(e)))) return true;
			});
			const lookup = lookupsFiltered.length === 1 ? lookupsFiltered[0] : lookups.find(it => it.source === SRC_CRB) || lookups.find(it => it.source === SRC_APG) || lookups[0];
			ability.generic = {tag: "feat", source: lookup.source === Parser.TAG_TO_DEFAULT_SOURCE.feat ? undefined : lookup.source, add_hash: lookup.add_hash};
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

	_parseHazardProperties (obj) {
		while (this._tokenStack.length) {
			let breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.propertiesHazards)) this._parseHazardProperty(obj);
			else if (this._tokenIsType(this._tokenizerUtils.actions && this._tokenIsType(this._tokenizerUtils.attacks, this._peek(1)))) {
				const actionToken = this._consumeToken(this._tokenizerUtils.actions);
				const atkToken = this._consumeToken(this._tokenizerUtils.attacks);
				this._push(actionToken);
				this._push(atkToken);
				breakOnLength += 1;
			} else if (this._tokenIsType(this._tokenizerUtils.stringEntries) && this._peek().isStartNewLine) this._parseCreatureAbilities(obj, {hazardMode: true});
			else this._cbWarn(`Unexpected token "${this._peek().value}"`);
			if (breakOnLength === this._tokenStack.length) break;
		}
	}
	_parseHazardProperty (obj) {
		if (this._tokenIsType(this._tokenizerUtils.stealth)) this._parseStealth(obj);
		else if (this._tokenIsType(this._tokenizerUtils.description)) this._parseDescription(obj);
		else if (this._tokenIsType(this._tokenizerUtils.disable)) this._parseDisable(obj);
		else if (this._tokenIsType(this._tokenizerUtils.ac)) this._parseAC(obj);
		else if (this._tokenIsType(this._tokenizerUtils.hazardHardness)) this._parseHazardHardness(obj);
		else if (this._tokenIsType(this._tokenizerUtils.hazardHP)) this._parseHazardHP(obj);
		else if (this._tokenIsType(this._tokenizerUtils.creatureSavingThrows)) this._parseCreatureSavingThrows(obj);
		else if (this._tokenIsType(this._tokenizerUtils.immunities)) this._parseImmunities(obj);
		else if (this._tokenIsType(this._tokenizerUtils.resistances)) this._parseResistances(obj);
		else if (this._tokenIsType(this._tokenizerUtils.weaknesses)) this._parseWeaknesses(obj);
		else if (this._tokenIsType(this._tokenizerUtils.attacks)) this._parseAttacks(obj);
		else if (this._tokenIsType(this._tokenizerUtils.reset)) this._parseReset(obj);
		else if (this._tokenIsType(this._tokenizerUtils.routine)) this._parseRoutine(obj);
		else throw new Error(`Unimplemented property creation of type "${this._peek().type}"`);
	}

	_parseStealth (obj) {
		this._consumeToken(this._tokenizerUtils.stealth);
		const stealth = {};
		if (this._tokenIsType("H_STEALTH_BONUS")) {
			const bonus = this._consumeToken("H_STEALTH_BONUS");
			stealth.bonus = Number(/\d+/.exec(bonus.value));
		}
		if (this._tokenIsType("H_STEALTH_DC")) {
			const dc = this._consumeToken("H_STEALTH_DC");
			stealth.dc = Number(/\d+/.exec(dc.value));
		}
		if (this._tokenIsType("H_STEALTH_MINPROF")) {
			const minProf = this._consumeToken("H_STEALTH_MINPROF");
			stealth.minProf = minProf.value.trim().replace(/^\(/, "").replace(/\)$/, "").toLowerCase();
		}
		const entries = this._getEntries();
		if (entries.length) stealth.notes = this._renderEntries(entries, {asString: true});
		obj.stealth = stealth;
	}
	_parseDescription (obj) {
		this._consumeToken(this._tokenizerUtils.description);
		const entries = this._getEntries();
		obj.description = this._renderEntries(entries);
	}
	_parseDisable (obj) {
		this._consumeToken(this._tokenizerUtils.disable);
		const entries = this._getEntries();
		// TODO: Perhaps parse a bit more?
		obj.disable = {entries: this._renderEntries(entries)};
	}
	_parseHazardHardness (obj) {
		obj.defenses = obj.defenses || {};
		obj.defenses.hardness = obj.defenses.hardness || {};
		const token = this._consumeToken(this._tokenizerUtils.hazardHardness);
		const regex = this._tokenizerUtils.hazardHardness.find(it => it.regex.test(token.value)).regex;
		let [match, name, value] = regex.exec(token.value);
		if (this._tokenIsType(this._tokenizerUtils.parenthesis)) {
			const innerText = this._getParenthesisInnerText(this._peek());
			if (innerText.split(" ").length <= 2) {
				this._consumeToken(this._tokenizerUtils.parenthesis);
				if (name == null) name = innerText.uppercaseFirst();
			}
		}
		if (this._tokenIsType(this._tokenizerUtils.stringEntries)) {
			obj.defenses.hardness.notes = obj.defenses.hardness.notes || {};
			obj.defenses.hardness.notes[name || "std"] = this._renderEntries(this._getEntries(), {asString: true}).trimAnyChar(".");
		}
		obj.defenses.hardness[name || "std"] = Number(value);
	}
	_parseHazardHP (obj) {
		obj.defenses = obj.defenses || {};
		obj.defenses.hp = obj.defenses.hp || {};
		const token = this._consumeToken(this._tokenizerUtils.hazardHP);
		const regex = this._tokenizerUtils.hazardHP.find(it => it.regex.test(token.value)).regex;
		const [match, name, value] = regex.exec(token.value);
		let key = name || "std";
		if (key === "std" && obj.defenses.hardness) {
			const lastKey = Object.keys(obj.defenses.hardness).filter(k => obj.defenses.hp[k] === undefined).last();
			key = lastKey || key;
		}
		if (this._tokenIsType(this._tokenizerUtils.parenthesis)) {
			if (name == null) key = this._getParenthesisInnerText(this._consumeToken(this._tokenizerUtils.parenthesis)).uppercaseFirst();
		}
		obj.defenses.hp[key] = Number(value);
		if (this._tokenIsType(this._tokenizerUtils.hazardBT)) {
			const btToken = this._consumeToken(this._tokenizerUtils.hazardBT);
			obj.defenses.bt = obj.defenses.bt || {};
			const btVal = /\d+/.exec(btToken.value)
			obj.defenses.bt[key] = Number(btVal);
		}
		if (this._tokenIsType(this._tokenizerUtils.stringEntries)) {
			obj.defenses.hp.notes = obj.defenses.hp.notes || {};
			obj.defenses.hp.notes[key] = this._renderEntries(this._getEntries(), {asString: true}).trimAnyChar(".");
		}
	}
	_parseReset (obj) {
		this._consumeToken(this._tokenizerUtils.reset);
		obj.reset = this._parseEntries(null, {entriesOnly: true, getEntriesOpts: {doFinalize: true}});
	}
	_parseRoutine (obj) {
		this._consumeToken(this._tokenizerUtils.routine);
		obj.routine = this._parseEntries(null, {entriesOnly: true, getEntriesOpts: {doFinalize: true}});
	}

	// FIXME: We might have tokenized some normal word occurrences of properties as property token. Do we need to check for that?
	_parseEntries (obj, opts) {
		opts = opts || {};
		const entriesOut = [];
		const parseEntryTypes = (token) => {
			if (this._tokenIsType(this._tokenizerUtils.successDegrees, token)) entriesOut.push(this._parseSuccessDegrees());
			else if (this._tokenIsType(this._tokenizerUtils.listMarker, token)) entriesOut.push(this._parseList());
			else if (!opts.entriesOnly && this._tokenIsType(this._tokenizerUtils.shieldData)) this._parseShieldData(obj, opts);
			else if (!opts.entriesOnly && this._tokenIsType(this._tokenizerUtils.amp, token)) this._parseAmp(obj);
			else if (!opts.entriesOnly && this._tokenIsType(this._tokenizerUtils.heightened, token)) this._parseHeightened(obj);
			else if (!opts.noAbilities && this._tokenIsType(this._tokenizerUtils.activate, token)) entriesOut.push(this._parseActivate());
			else if (!opts.entriesOnly && this._tokenIsType(this._tokenizerUtils.itemVariants, token)) this._parseItemVariants(obj);
			else if (!opts.entriesOnly && this._tokenIsType(this._tokenizerUtils.afflictions, token)) entriesOut.push(this._parseAffliction());
			else if (!opts.entriesOnly && this._tokenIsType(this._tokenizerUtils.lvlEffect, token)) entriesOut.push(this._parseLvlEffect(obj));
			else if (!opts.entriesOnly && !opts.noAbilities && this._tokenIsType(this._tokenizerUtils.special, token)) this._parseSpecial(obj);
			else if (!opts.entriesOnly && !opts.noAbilities && this._tokenIsType(this._tokenizerUtils.effect, token)) entriesOut.push(this._parseAbility());
		}

		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			const entries = this._getEntries({checkLookahead: true, ...opts.getEntriesOpts});
			if (entries.length) entriesOut.push(...this._renderEntries(entries));
			const lookAhead = this._getLookahead();
			if (opts.isVariantItemEntries && this._tokenIsType(this._tokenizerUtils.itemVariants)) break;
			if (lookAhead || !this._tokenIsType(this._tokenizerUtils.stringEntries)) parseEntryTypes(lookAhead);
			if (breakOnLength === this._tokenStack.length) break;
		}
		if (opts.entriesOnly) return entriesOut;
		else obj.entries = entriesOut;
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
	_parseAmp (obj) {
		const amp = {};
		while (this._tokenIsType(this._tokenizerUtils.amp)) {
			const token = this._consumeToken(this._tokenizerUtils.amp);
			switch (token.type) {
				case "AMP": {
					amp.entries = this._parseEntries(null, {entriesOnly: true});
					break;
				} case "AMP_HEIGHTENED_PLUS_X": {
					amp.heightened = amp.heightened || {};
					amp.heightened.plusX = amp.heightened.plusX || {};
					const level = /\d+/.exec(token.value)[0];
					amp.heightened.plusX[level] = this._parseEntries(null, {entriesOnly: true});
					break;
				} case "AMP_HEIGHTENED_X": {
					amp.heightened = amp.heightened || {};
					amp.heightened.X = amp.heightened.X || {};
					const level = /\d+/.exec(token.value)[0];
					amp.heightened.X[level] = this._parseEntries(null, {entriesOnly: true});
					break;
				} default: throw new Error(`Unimplemented! ${token.type}`)
			}
		}

		obj.amp = amp;
	}
	_parseHeightened (obj) {
		const entries = {};
		const getHeightenedEntries = () => {
			const token = this._consumeToken(this._tokenizerUtils.heightened);
			if (token.type === "HEIGHTENED_PLUS_X") {
				entries.plusX = entries.plusX || {};
				const level = /\d+/.exec(token.value)[0];
				entries.plusX[level] = this._parseEntries(null, {entriesOnly: true});
			} else if (token.type === "HEIGHTENED_X") {
				entries.X = entries.X || {};
				const level = /\d+/.exec(token.value)[0];
				entries.X[level] = this._parseEntries(null, {entriesOnly: true});
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
		const entries = this._getEntries({isListMode: true});
		return this._renderEntries(entries, {asString: true});
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
		// TODO: This could give some insight on generic ability source
		const reSources = new RegExp(`(${Object.entries(Parser.SOURCE_JSON_TO_FULL).flat().join("|")})`);
		const filterSources = trt => !reSources.test(trt);

		// TODO: Merge cases act-txt-act into act/ or even a different system entirely
		const _parseTime = (timeText) => {
			const regExpTime = new RegExp(`(\\d+) (${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")})`);
			const matchedTime = timeText.match(regExpTime);
			if (matchedTime) obj.activity = {number: Number(matchedTime[1]), unit: this._tokenizerUtils.timeUnits.find(u => u.regex.test(matchedTime[2])).unit};
			else obj.activity = {unit: "varies", entry: timeText};
		}
		const parseCaseAct = (entries) => {
			// action [creature stat-blocks]
			obj.activity = this._renderToken(entries[0], {asObject: true});
		}
		const parseCaseTxt = (entries) => {
			// components: eg. Cast a Spell/Recall Knowledge
			obj.components = this._renderEntries([entries[0]], {asString: true}).split(", ");
		}
		const parseCasePar = (entries) => {
			// (traits) [creature stat-blocks]
			const traits = this._getParenthesisInnerText(entries[0]).split(", ").filter(filterSources);
			if (traits.length) obj.traits = traits;
		}
		const parseCaseActTxt = (entries) => {
			// action, components
			obj.activity = this._renderToken(entries[0], {asObject: true});
			obj.components = this._renderEntries([entries[1]], {asString: true}).split(", ");
		}
		const parseCaseActPar = (entries) => {
			// TODO: maybe sometimes components?
			// action, (traits)
			obj.activity = this._renderToken(entries[0], {asObject: true});
			const traits = this._getParenthesisInnerText(entries[1]).split(", ").filter(filterSources);
			if (traits.length) obj.traits = traits;
		}
		const parseCaseParAct = (entries) => {
			// (traits), action
			const traits = this._getParenthesisInnerText(entries[0]).split(", ").filter(filterSources);
			if (traits.length) obj.traits = traits;
			obj.activity = this._renderToken(entries[1], {asObject: true});
		}
		const parseCaseParTxt = (entries) => {
			// (time), components
			const innerText = this._getParenthesisInnerText(entries[0])
			_parseTime(innerText);
			obj.components = this._renderEntries([entries[1]], {asString: true}).split(", ");
		}
		const parseCaseActTxtPar = (entries) => {
			// action, components, (traits)
			obj.activity = this._renderToken(entries[0], {asObject: true});
			obj.components = this._renderEntries([entries[1]], {asString: true}).split(", ");
			const traits = this._getParenthesisInnerText(entries[2]).split(", ").filter(filterSources);
			if (traits.length) obj.traits = traits;
		}
		const parseCaseActTxtAct = (entries) => {
			// [one-action] to [three-actions]
			obj.activity = {number: 1, unit: "varies", entry: entries.slice(0, 3).map(e => this._renderToken(e)).join(" ")};
		}
		const parseCaseTxtPar = (entries) => {
			// time, (components & traits)
			// TODO: Unlikely, but sources?
			const timeText = this._renderToken(entries[0]);
			_parseTime(timeText);
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
		}
		const parseCaseActTxtActPar = (entries) => {
			// TODO: maybe sometimes components?
			// [one-action] to [three-actions], (traits)
			obj.activity = {number: 1, unit: "varies", entry: entries.slice(0, 3).map(e => this._renderToken(e)).join(" ")};
			const traits = this._getParenthesisInnerText(entries[3]).split(", ").filter(filterSources);
			if (traits.length) obj.traits = traits;
		}

		const parseCases = (entries) => {
			if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions])) parseCaseAct(entries);
			else if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentences])) parseCaseTxt(entries);
			else if (this._tokensAreTypes(entries, ["PARENTHESIS"])) parseCasePar(entries);
			else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences])) parseCaseActTxt(entries);
			else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, "PARENTHESIS"])) parseCaseActPar(entries);
			else if (this._tokensAreTypes(entries, ["PARENTHESIS", this._tokenizerUtils.actions])) parseCaseParAct(entries);
			else if (this._tokensAreTypes(entries, ["PARENTHESIS", this._tokenizerUtils.sentences])) parseCaseParTxt(entries);
			else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences, "PARENTHESIS"])) parseCaseActTxtPar(entries);
			else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences, this._tokenizerUtils.actions])) parseCaseActTxtAct(entries);
			else if (this._tokensAreTypes(entries, [this._tokenizerUtils.sentences, "PARENTHESIS"])) parseCaseTxtPar(entries);
			else if (this._tokensAreTypes(entries, [this._tokenizerUtils.actions, this._tokenizerUtils.sentences, this._tokenizerUtils.actions, "PARENTHESIS"])) parseCaseActTxtActPar(entries);
			else return true;
		}

		const doTryRescue = parseCases(entries);
		if (doTryRescue && entries.length) {
			let ix = 0;
			let ixLast = 0;
			let numSentence = 0;
			while (ix < entries.length && numSentence < 3) {
				if (this._tokenIsType(this._tokenizerUtils.sentences, entries[ix])) numSentence += 1;
				else ixLast = ix;
				ix += 1;
			}
			const entriesTryRescue = entries.splice(0, ixLast + 1);
			this._push(...entries.reverse());
			const didFail = parseCases(entriesTryRescue);
			if (didFail) {
				// this._cbWarn(`Encountered unknown data structure while parsing activation: [${entries.map(e => `"${e.type}"`).join(", ")}]. Skipping...`);
				throw new Error(`Unable to parse activation: "${entriesTryRescue.map(e => e.type)}", "${this._renderEntries(entriesTryRescue, {asString: true})}"`);
			}
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
			if (this._tokenIsType(this._tokenizerUtils.properties)) this._parseProperty(ability, {getEntriesOpts: {noBreaks: true}});
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
				const token = this._consumeToken("PARENTHESIS");
				stage.duration = this._getParenthesisInnerText(token);
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
					affliction.maxDuration = this._renderEntries(this._getEntries({noBreaks: true}), {asString: true});
				} else if (this._tokenIsType(this._tokenizerUtils.onset)) {
					this._consumeToken(this._tokenizerUtils.onset);
					affliction.onset = this._renderEntries(this._getEntries(), {asString: true});
				} else if (this._tokenIsType(this._tokenizerUtils.savingThrow)) {
					this._consumeToken(this._tokenizerUtils.savingThrow);
					const renderedSavingThrowEntries = this._renderEntries(this._getEntries({noBreaks: true}), {asString: true});
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
			return token.value.trim().replaceAll(/\n/g, " ");
		} else if (token.type === "PARENTHESIS") {
			return token.value.trim().replaceAll(/\n/g, " ");
		} else if (token.type === "CR_SPELL") {
			return token.value.trim().toLowerCase().replaceAll(/\n/g, " ");
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

	// Cases:
	// [Ability Name] (Activation/Parenthesis)					| The entire text is the name.
	// [Ability Name] The entry of the ability.					| Generally, the last consecutive uppercase word is the first word of the entry.
	// [Ability Name] The [Name of Creature] does something.	| Named NPCs are an exception.
	// [Ability Name] Something the [Name of Creature] does.	| Names need not be at the start of the entry!
	// [Name of Ability!] The entry of the ability.				| Punctuation and TitleCase is another exception.
	// Just some text.											| If only one uppercase word is at the start, it's not an ability name.
	_getAbilityName (opts) {
		opts = opts || {doConsumeTokens: false};
		const tokens = [this._peek()];
		let i = 1;
		while (this._peek(i) && this._tokenIsType(this._tokenizerUtils.sentences, this._peek(i)) && !this._peek(i).isStartNewLine) {
			tokens.push(this._peek(i++));
		}
		const renderedLine = this._renderEntries(tokens, {noTags: true, asString: true});
		const nameWords = this._parsing != null ? this._parsing.split(" ").map(w => w.escapeRegexp()) : [];
		let name;

		const getName = (str) => {
			// Find the longest run of word such that:
			// - All Words are title-cased
			// - The last word is uppercase
			// - The next word is uppercase
			const parts = [];
			const split = str.split(" ").reverse();
			// push all title-case words onto the name, then remove fewest to match conditions
			// Numbers count as uppercase: Aura ranges and others
			while (split.length && (/^\W?[A-Z\d]/.test(split.last()) || StrUtil.TITLE_LOWER_WORDS.includes(split.last()))) {
				parts.push(split.pop());
			}
			while (parts.length && (!/^\W?[A-Z\d]/.test(parts.last()) || !/^\W?[A-Z\d]/.test(split.last()))) {
				split.push(parts.pop());
			}
			return parts.join(" ");
		}

		if (/^([^\w\s]?[A-Z]\S+ )+$/.test(renderedLine)) {
			// All words capitalized
			name = renderedLine;
		} else if (renderedLine === renderedLine.toTitleCase()) {
			// All words TitleCase
			name = renderedLine;
		} else if (nameWords.length) {
			const reGroup = nameWords.map((x, i) => `${nameWords.slice(0, i + 1).join(" ")}${i === nameWords.length - 1 ? ".+" : "$"}`).join("|");
			const regex = new RegExp(`^(.*?) (${reGroup})`);
			const match = regex.exec(renderedLine);
			name = match ? getName(match[1]) : getName(renderedLine);
		} else {
			name = getName(renderedLine);
		}
		name = name.replace(/ The$/, "");
		name = name.replace(/ ?As( .+$|$)/, "");

		if (opts.doConsumeTokens) {
			// Find first token such that name is entirely contained in tokens up to it
			let idx = 0;
			let startOfLine = "";

			if (!name) throw new Error(`Error while parsing ability name of "${this._parsing}": expected name at "${renderedLine}" but found none.`);

			while (!startOfLine.startsWith(name)) {
				if (idx > tokens.length) throw new Error(`Error while parsing ability name: "${name}"`);
				startOfLine = this._renderEntries(tokens.slice(0, idx + 1), {noTags: true, asString: true});
				idx += 1;
			}
			let lastConsumedToken = null;
			for (let i = 0; i < idx; i++) lastConsumedToken = this._consumeToken(tokens[i].type);
			if (startOfLine !== name) {
				lastConsumedToken.value = startOfLine.replace(new RegExp(name), "").trim();
				this._push(lastConsumedToken);
			}
		}

		return name;
	}
	_isAbilityName () {
		const peeked = this._peek();
		if (!this._tokenIsType(this._tokenizerUtils.sentences)) return false;
		if (!peeked.isStartNewLine) return false;
		const rendered = this._renderToken(peeked);
		if (/^[^A-Z]/.test(rendered)) return false;
		if (/^[A-Z]\w+\.$/.test(rendered)) return false;
		if (this._parsedAbilities && this._parsedAbilities.length && this._parsedAbilities.some(a => rendered.startsWith(a))) return false;
		if (this._getAbilityName()) return true;
		return null;
	}
	_getLookahead (maxDepth = 3, lookAheadTypes = null) {
		if (lookAheadTypes !== "LIST_MARKER" && !this._isAbilityName()) return null;
		if (!this._peek().isStartNewLine) return null;
		for (let depth = 1; depth <= maxDepth; depth++) {
			const peeked = this._peek(depth);
			if (maxDepth >= 20) break;
			if (peeked == null) break;
			if (lookAheadTypes != null && this._tokenIsType(lookAheadTypes, peeked)) return peeked;
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
		if (this._tokenIsType(this._tokenizerUtils.genericEntries, token2)) return true;
		// FIXME: This is definitely NOT correct in all cases
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
		// FIXME: This is just confusing now...
		if (this._isParsingCreature && !this._isAbilityName()) return true;
		// TODO: is something better required?
		return false;
	}
	_isAlreadyParsedProperty (token) {
		if (!this._tokenIsType(this._tokenizerUtils.properties, token)) return false;
		return this._tokenIsType(this._parsedProperties, token);
	}
	_isShortLine (entries) {
		const lastIx = entries.map(e => e.isStartNewLine).lastIndexOf(true);
		const text = entries.slice(~lastIx ? lastIx : 0, entries.length).map(it => it.value.trim()).join(" ");
		const len = text.length;
		// TODO: fiddle with number to improve this
		// If the line is more than 10% shorter than the average length, its probably still a list entry,
		// otherwise don't add the line to the list item. (It's a line after the list?).
		if (Math.abs(this._avgLineLength - len) / this._avgLineLength > 0.10) return true;
		return null;
	}
	_isLastListToken (entries) {
		if (entries.length === 0) return false;
		if (!this._peek().isStartNewLine) return false;
		if (/^[^A-Z]/.test(this._renderToken(this._peek()))) return false;
		if (this._isShortLine(entries)) return false;
		return !this._getLookahead(5, "LIST_MARKER");
	}
	// FIXME: Clean this up. This is creating almost all errors.
	/**
	 * @param [opts]
	 * @param [opts.checkContinuedLines] When parsing properties: Try to detect when properties end and entries begin.
	 * @param [opts.checkLookahead] Entries: To detect afflictions and abilities with names.
	 * @param [opts.breakAfterNewline] Activate property of items: don't want other item properties to get parsed as activate properties.
	 * @param [opts.isListMode] Lists: Try to detect when list entries end.
	 * @param [opts.noBreaks] Afflictions and Actions: We want any stringEntries until next property/stage.
	 * @param [opts.noCap] Bodge. On a stack bro, imma keep it a buck 50, break on capitalized words at start of entries.
	 * @param [opts.doFinalize] At the very end: If the tokenstack only contains stringEntry tokens, return all tokens
	 **/
	_getEntries (opts) {
		opts = opts || {};
		const entries = [];
		if (opts.doFinalize && this._tokenStack.every(t => this._tokenIsType(this._tokenizerUtils.stringEntries, t))) {
			const len = this._tokenStack.length;
			for (let i = 0; i < len; i++) entries.push(this._consumeToken(this._tokenizerUtils.stringEntries));
			return entries;
		}
		while (this._tokenIsType(this._tokenizerUtils.stringEntries)) {
			const doCheckBreak = !opts.noBreaks;
			if (doCheckBreak && this._isParsingCreature && this._isAbilityName()) break;
			if (doCheckBreak && opts.checkLookahead && this._getLookahead()) break;
			if (doCheckBreak && opts.noCap && /^[A-Z\d]/.test(this._renderToken(this._peek()))) break;
			if (doCheckBreak && opts.isListMode && this._isLastListToken(entries)) break;
			entries.push(this._consumeToken(this._tokenizerUtils.stringEntries));
			if (doCheckBreak && opts.checkContinuedLines && !this._isContinuedLine(entries.last())) break;
			if (doCheckBreak && opts.breakAfterNewline && this._tokenIsType(this._tokenizerUtils.sentencesNewLine, entries.last())) break;
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
	_push (...tokens) {
		this._tokenStack.push(...tokens);
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
