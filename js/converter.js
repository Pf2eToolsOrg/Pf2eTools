"use strict"

/* eslint no-console: 0 */

if (typeof module !== "undefined") {
	require("../js/utils.js");
	require("../js/parser.js");
	Object.assign(global, require("./Tokenizer"));
	Object.assign(global, require("../node/tag-jsons.js"));
	global.PropOrder = require("../js/utils-proporder.js");
}

class Converter {
	/**
	 * @param opts.config
	 * @param opts.tokenizerUtilsClass
	 * **/
	constructor (opts) {
		opts = opts || {};
		const config = opts.config || TokenizerUtils.defaultConfig

		this._string = "";
		this._page = 0;
		this._tokenizer = new Tokenizer(config);
		this._tokenizerUtils = opts.tokenizerUtilsClass || TokenizerUtils;
		this._parsedData = null;
		this._tokenStack = [];
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
		const headerToken = this._consumeToken("SPELL");
		const [match, name, type, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "SPELL").regex.exec(headerToken.value);
		const spell = {};
		spell.name = name.toTitleCase();
		spell.type = type.toTitleCase();
		spell.level = Number(level);
		spell.source = this._source;
		spell.page = this._page;
		spell.entries = [""];
		spell.traits = this._parseTraits();
		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.subHeaders)) this._parseSubHeaders(spell);
			if (breakOnLength === this._tokenStack.length) break;
		}
		this._parseEntries(spell);
		if (this._tokenStack.length > 0) {
			console.warn(`WARNING: Token stack was not empty after parsing spell "${spell.name}"!`);
			console.warn(this._tokenStack);
			this._tokenStack = [];
		}
		return PropOrder.getOrdered(spell, "spell");
	}
	_parseFeat () {
		this._tokenStack.reverse();
		const headerToken = this._consumeToken("FEAT");
		const [match, name, activity, level] = this._tokenizerUtils.dataHeaders.find(it => it.type === "FEAT").regex.exec(headerToken.value);
		const feat = {};
		feat.name = name.toTitleCase();
		const activityToken = this._tokenizerUtils.actions.find(it => it.regex.test(activity));
		feat.activity = this._renderToken(activityToken, {asObject: true});
		feat.level = Number(level);
		feat.source = this._source;
		feat.page = this._page;
		feat.entries = [""];
		feat.traits = this._parseTraits();
		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.subHeaders)) this._parseSubHeaders(feat);
			if (breakOnLength === this._tokenStack.length) break;
		}
		this._parseEntries(feat);
		if (this._tokenStack.length > 0) {
			console.warn(`WARNING: Token stack was not empty after parsing feat "${feat.name}"!`);
			console.warn(this._tokenStack);
			this._tokenStack = [];
		}
		return PropOrder.getOrdered(feat, "feat");
	}

	_parseTraits () {
		const out = [];
		while (this._tokenIsType("TRAIT")) {
			const traitToken = this._consumeToken("TRAIT");
			out.push(traitToken.value.trim().toTitleCase());
		}
		return out;
	}

	_parseSubHeaders (obj) {
		if (this._tokenIsType("ACCESS")) this._parseAccess(obj);
		else if (this._tokenIsType("AREA")) this._parseArea(obj);
		else if (this._tokenIsType("CAST")) this._parseCast(obj);
		else if (this._tokenIsType("COST")) this._parseCost(obj);
		else if (this._tokenIsType("DURATION")) this._parseDuration(obj);
		else if (this._tokenIsType("EFFECT")) this._parseEffect(obj);
		else if (this._tokenIsType("FREQUENCY")) this._parseFrequency(obj);
		else if (this._tokenIsType("PREREQUISITES")) this._parsePrerequisites(obj);
		else if (this._tokenIsType("RANGE")) this._parseRange(obj);
		else if (this._tokenIsType("REQUIREMENTS")) this._parseRequirements(obj);
		else if (this._tokenIsType("SAVING_THROW")) this._parseSavingThrow(obj);
		else if (this._tokenIsType("TARGETS")) this._parseTargets(obj);
		else if (this._tokenIsType("TRADITIONS")) this._parseTraditions(obj);
		else if (this._tokenIsType("TRIGGER")) this._parseTrigger(obj);
		else if (this._tokenIsType(this._tokenizerUtils.traditions)) this._parseAltTraditions(obj);
		else {
			console.log(this._tokenIsType(this._tokenizerUtils.traditions))
			throw new Error(`Unimplemented subheader creation of type "${this._peek().type}"`);
		}
	}

	_parseAccess (obj) {
		this._parseGenericSubHeader(obj, "ACCESS", "access");
	}
	_parseArea (obj) {
		this._consumeToken("AREA");
		const entries = this._getGenericSubheadersEntries();
		obj.area = {entry: this._renderEntries(entries, {asString: true}), types: []};
		this._tokenizerUtils.areaTypes.forEach(({regex, type}) => {
			if (regex.test(obj.area.entry)) obj.area.types.push(type);
		});
		if (obj.area.types.length === 0) obj.area.types.push("Misc.")
	}
	_parseCast (obj) {
		this._consumeToken("CAST");
		const entries = this._getGenericSubheadersEntries();
		const components = {};

		const checkCase = (arr) => {
			if (entries.length !== arr.length) return false;
			return entries.every((e, i) => this._tokenIsType(arr[i], e));
		};

		if (checkCase([this._tokenizerUtils.actions, this._tokenizerUtils.sentences])) {
			obj.cast = this._renderToken(entries[0], {asObject: true});
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[1].value)) components[key] = true;
			});
		} else if (checkCase([this._tokenizerUtils.sentences, "PARENTHESIS"])) {
			const regExpTime = new RegExp(`(\\d+) (${this._tokenizerUtils.timeUnits.map(u => u.regex.source).join("|")})`);
			const matchedTime = this._renderToken(entries[0]).match(regExpTime);
			if (matchedTime) obj.cast = {number: Number(matchedTime[1]), unit: this._tokenizerUtils.timeUnits.find(u => u.regex.test(matchedTime[2])).unit};
			else obj.cast = {number: 1, unit: "varies", entry: this._renderToken(entries[0])};
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[1].value)) components[key] = true;
			});
		} else if (checkCase([this._tokenizerUtils.actions, this._tokenizerUtils.sentences, this._tokenizerUtils.actions, "PARENTHESIS"])) {
			obj.cast = {number: 1, unit: "varies", entry: entries.slice(0, 3).map(e => this._renderToken(e)).join(" ")};
			Object.entries(this._tokenizerUtils.spellComponents).forEach(([key, regexp]) => {
				if (regexp.test(entries[3].value)) components[key] = true;
			});
		} else {
			console.warn(`Encountered unknown data structure while parsing CAST in "${obj.name}".`);
		}

		if (Object.keys(components).length) obj.components = components;
	}
	_parseCost (obj) {
		this._parseGenericSubHeader(obj, "COST", "cost");
	}
	_parseDuration (obj) {
		this._consumeToken("DURATION");
		const entries = this._getGenericSubheadersEntries();
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
	_parseEffect (obj) {}
	_parseFrequency (obj) {
		this._consumeToken("FREQUENCY");
		const entries = this._getGenericSubheadersEntries();
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
	_parsePrerequisites (obj) {
		this._parseGenericSubHeader(obj, "PREREQUISITES", "prerequisites");
	}
	_parseRange (obj) {
		// TODO: fix faulty entries that should be area instead?
		this._consumeToken("RANGE");
		const entries = this._getGenericSubheadersEntries();
		const rendered = this._renderEntries(entries, {asString: true});
		const regExpRange = new RegExp(`(\\d+)? ?(${this._tokenizerUtils.rangeUnits.map(u => u.regex.source).join("|")})`);
		const matched = regExpRange.exec(rendered);
		if (matched && matched[0]) {
			obj.range = {unit: this._tokenizerUtils.rangeUnits.find(u => u.regex.test(matched[2])).unit};
			if (matched[1]) obj.range.number = Number(matched[1]);
		} else {
			obj.range = {unit: "unknown", entry: rendered};
		}
	}
	_parseRequirements (obj) {
		this._parseGenericSubHeader(obj, "REQUIREMENTS", "requirements");
	}
	_parseSavingThrow (obj) {
		this._consumeToken("SAVING_THROW");
		const entries = this._getGenericSubheadersEntries();
		const rendered = this._renderEntries(entries, {asString: true});
		const regExpSavingThrow = new RegExp(`(basic)? ?(${this._tokenizerUtils.savingThrows.map(u => u.regex.source).join("|")})`);
		const matched = regExpSavingThrow.exec(rendered);
		if (matched) {
			obj.savingThrow = {type: this._tokenizerUtils.savingThrows.find(u => u.regex.test(matched[2])).unit};
			if (matched[1]) obj.basic = true;
		} else {
			obj.savingThrow = {type: rendered};
		}
	}
	_parseTargets (obj) {
		this._parseGenericSubHeader(obj, "TARGETS", "targets");
	}
	_parseTraditions (obj) {
		this._consumeToken("TRADITIONS");
		const entries = this._getGenericSubheadersEntries();
		obj.traditions = entries.map(e => this._renderToken(e)).join(" ").split(", ").map(tr => tr.trim().toTitleCase());
	}
	_parseTrigger (obj) {
		this._parseGenericSubHeader(obj, "TRIGGER", "trigger");
	}
	_parseAltTraditions (obj) {
		const token = this._consumeToken(this._tokenizerUtils.traditions);
		const entries = this._getGenericSubheadersEntries();
		const altTraditions = entries.map(e => this._renderToken(e)).join(" ").split(", ").map(tr => tr.trim().toTitleCase());
		obj.subclass = obj.subclass || {};
		const key = `${this._tokenizerUtils.traditions.find(it => it.type === token.type).class}|${token.value.trim()}`
		obj.subclass[key] = altTraditions;
	}
	_parseGenericSubHeader (obj, tokenType, prop) {
		this._consumeToken(tokenType);
		const entries = this._getGenericSubheadersEntries();
		obj[prop] = this._renderEntries(entries, {asString: true});
	}

	// FIXME: We might tokenize some normal word occurrences of subHeaders as subHeaders. Need to check for that!
	_parseEntries (obj) {
		const entriesOut = [];
		let strEntries = [];
		const parseEntryTypes = (token) => {
			if (this._tokenIsType(this._tokenizerUtils.successDegrees, token)) entriesOut.push(this._parseSuccessDegrees());
			else if (this._tokenIsType(this._tokenizerUtils.heightened, token)) this._parseHeightened(obj);
			else if (this._tokenIsType("LIST_MARKER", token)) entriesOut.push(this._parseList());
			else if (this._tokenIsType(this._tokenizerUtils.subHeaders, token)) entriesOut.push(this._parseActivate());
			else if (this._tokenIsType(this._tokenizerUtils.afflictions, token)) entriesOut.push(this._parseAffliction());
			else if (this._tokenIsType(this._tokenizerUtils.lvlEffect, token)) entriesOut.push(this._parseLvlEffect(obj));
			else if (this._tokenIsType(this._tokenizerUtils.special, token)) this._parseSpecial(obj);
		}

		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.subHeadingEntries)) {
				const lookAhead = this._getEntries_getLookahead();
				if (lookAhead) parseEntryTypes(lookAhead);
				else strEntries.push(this._consumeToken(this._tokenizerUtils.subHeadingEntries));
			} else {
				if (strEntries.length) {
					entriesOut.push(...this._renderEntries(strEntries));
					strEntries = [];
				}
				parseEntryTypes();
			}
			if (breakOnLength === this._tokenStack.length) break;
		}
		if (strEntries.length) entriesOut.push(...this._renderEntries(strEntries));
		obj.entries = entriesOut;
	}
	// FIXME: This already feels like a bodge. Also Check if _peek(0/1) ends in newline!
	// This is needed because we can only detect afflictions after we would consume its name & traits
	_getEntries_getLookahead () {
		let peeked = [this._peek(1), this._peek(2), this._peek(3)];
		if (peeked[0] != null && this._tokenIsType(this._tokenizerUtils.breakEntries, peeked[0])) return peeked[0];
		else if (peeked[1] != null && this._tokenIsType(this._tokenizerUtils.breakEntries, peeked[1])) return peeked[1];
		else if (peeked[2] != null && this._tokenIsType(this._tokenizerUtils.breakEntries, peeked[2])) return peeked[2];
		else return null;
	}
	_getEntriesWithLookahead () {
		const tempStack = [];
		while (this._tokenStack.length && this._tokenIsType(this._tokenizerUtils.subHeadingEntries)) {
			if (this._getEntries_getLookahead()) break;
			else tempStack.push(this._consumeToken(this._tokenizerUtils.subHeadingEntries));
		}
		return tempStack;
	}
	_getEntries () {
		const tempStack = [];
		while (this._tokenStack.length && this._tokenIsType(this._tokenizerUtils.subHeadingEntries)) {
			tempStack.push(this._consumeToken(this._tokenizerUtils.subHeadingEntries));
		}
		return tempStack;
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
			entries[prop] = this._renderEntries(this._getEntriesWithLookahead());
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
				entries.plusX[level] = this._renderEntries(this._getEntriesWithLookahead());
			} else if (token.type === "HEIGHTENED_X") {
				entries.X = entries.X || {};
				const level = /\d+/.exec(token.value)[0];
				entries.X[level] = this._renderEntries(this._getEntriesWithLookahead());
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
	// What am I seeing on my screen?
	_parseListItem () {
		this._consumeToken("LIST_MARKER");
		const entries = [];
		let temp = [];

		const returnItem = () => {
			entries.forEach(it => this._consumeToken(this._tokenizerUtils.subHeadingEntries));
			return this._renderEntries(entries, {asString: true});
		}

		for (let i = 0; i < this._tokenStack.length; i++) {
			const token = this._peek(i);
			if (this._tokenIsType(this._tokenizerUtils.subHeadingEntries, token)) temp.push(token);
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
	_parseActivate () {
		//
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
				// FIXME:
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
			affliction.traits = this._renderToken(this._consumeToken("PARENTHESIS")).replace(/[()]/g, "").split(", ");
		}
		if (this._tokenIsType(this._tokenizerUtils.sentences) && this._peek().value.length === 1) {
			this._consumeToken(this._tokenizerUtils.sentences);
		}

		while (this._tokenStack.length) {
			const breakOnLength = this._tokenStack.length;
			if (this._tokenIsType(this._tokenizerUtils.afflictions)) {
				if (this._tokenIsType("STAGE")) {
					parseStage();
				} else if (this._tokenIsType("AFFLICTION_LEVEL")) {
					const lvlToken = this._consumeToken("AFFLICTION_LEVEL");
					affliction.level = Number(/\d+/.exec(lvlToken.value)[0]);
				} else if (this._tokenIsType("MAX_DURATION")) {
					//
				} else {
					throw new Error(``);
				}
			} else if (this._tokenIsType(this._tokenizerUtils.sentences)) {
				if (this._peek().value.trim().length <= 1) this._consumeToken(this._tokenizerUtils.sentences);
				else {
					// FIXME: what if notes already exist?
					affliction.notes = this._renderEntries(this._getEntries());
				}
			}
			if (breakOnLength === this._tokenStack.length) break;
		}
		affliction.stages = stages;
		return affliction;
	}
	_parseSpecial (obj) {
		this._consumeToken(this._tokenizerUtils.special);
		const entries = this._getEntriesWithLookahead();
		obj.special = this._renderEntries(entries);
	}

	_getGenericSubheadersEntries () {
		const entries = [this._consumeToken(this._tokenizerUtils.subHeadingEntries)];
		while (this._isContinuationLine(entries.last(), this._peek())) {
			entries.push(this._consumeToken(this._tokenizerUtils.subHeadingEntries));
		}
		return entries;
	}

	_isContinuationLine (token1, token2, opts) {
		opts = opts || {};

		if (!this._tokenIsType(this._tokenizerUtils.subHeadingEntries, token2)) return false;
		if (this._tokenIsType(this._tokenizerUtils.actions, token2)) return true;
		if (this._tokenIsType("PARENTHESIS", token2)) return true;
		const line1 = this._renderToken(token1);
		const line2 = this._renderToken(token2);
		if (/^[^A-Z]/.test(line2)) return true;
		if (opts.mode === "simple") {
			// TODO: check without TagJsons?
		} else {
			const tagged1 = TagJsons.doTagStr(line1);
			const tagged2 = TagJsons.doTagStr(line2);
			const taggedCombined = TagJsons.doTagStr(`${line1} ${line2}`);
			if (taggedCombined !== `${tagged1} ${tagged2}`) return true;
		}
		// TODO: is something better required?
		return false;
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

		throw new Error(`Unimplemented rendering of token with type "${token.type}"`)
	}

	// FIXME: Clean entries as well...
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
		if (opts.asString) return TagJsons.doTagStr(entries.join(" ")).replace(/;$/, "");
		return entries.map(e => TagJsons.doTagStr(e));
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
}

if (typeof module !== "undefined") {
	module.exports = {
		Converter,
	}
}
