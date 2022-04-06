"use strict";

class TokenizerUtils {
	// region config
	static get pageNumbers () {
		return [
			{regex: /^\d+\n/, type: "PAGE"},
		]
	}

	static get endData () {
		return [
			{regex: /^\n{2,}/, type: "END_DATA", mode: "default"},
			{regex: /^\s+$/, type: "END_DATA", mode: "default"},
		]
	}

	static get dataHeaders () {
		return [
			{regex: /^(.+) (SPELL|CANTRIP|FOCUS) (\d{1,2})\n/, type: "SPELL", mode: "spell"},
			{regex: /^([^\n[]*?) (\[.+] )?FEAT (\d{1,2})\n/, type: "FEAT", mode: "feat"},
		]
	}

	static get traits () {
		return [
			{regex: /^MODULAR B, P, OR S\s/, type: "TRAIT"},
			{regex: /^N\s/, type: "TRAIT"},
			{regex: /^[A-Z-]{2,}( [\dBPS])?\s/, type: "TRAIT"},
		]
	}

	static get traditions () {
		return [
			{regex: /^Domain\s/, type: "DOMAIN", class: "Cleric"},
			{regex: /^Mystery\s/, type: "MYSTERY", class: "Oracle"},
			{regex: /^Patron\s/, type: "PATRON", class: "Witch"},
		]
	}

	static get subHeaders () {
		return [
			{regex: /^Access\s/, type: "ACCESS"},
			{regex: /^Area\s/, type: "AREA"},
			{regex: /^Cast(ing)?\s/, type: "CAST"},
			{regex: /^Cost\s/, type: "COST"},
			{regex: /^Duration\s/, type: "DURATION"},
			{regex: /^Effects?\s/, type: "EFFECT"},
			{regex: /^Frequency\s/, type: "FREQUENCY"},
			{regex: /^Prerequisites?\s/, type: "PREREQUISITES"},
			{regex: /^Range\s/, type: "RANGE"},
			{regex: /^Requirements?\s/, type: "REQUIREMENTS"},
			{regex: /^Saving Throw\s/, type: "SAVING_THROW"},
			{regex: /^Targets?\s/, type: "TARGETS"},
			{regex: /^Traditions?\s/, type: "TRADITIONS"},
			{regex: /^Trigger\s/, type: "TRIGGER"},
			...this.traditions,
		]
	}

	static get successDegrees () {
		return [
			{regex: /^Critical\sSuccess\s/, type: "CRIT_SUCCESS"},
			{regex: /^Success\s/, type: "SUCCESS"},
			{regex: /^Failure\s/, type: "FAILURE"},
			{regex: /^Critical\sFailure\s/, type: "CRIT_FAILURE"},
		]
	}

	static get heightened () {
		return [
			{regex: /^Heightened\s\(\+\d+\)\s/, type: "HEIGHTENED_PLUS_X"},
			{regex: /^Heightened\s\(\d+(st|nd|rd|th)\)\s/, type: "HEIGHTENED_X"},
			{regex: /^Heightened\s/, type: "HEIGHTENED"},
		]
	}

	static get lvlEffect () {
		return [
			{regex: /^\n\d+(st|nd|rd|th).\d+(st|nd|rd|th)\s/, type: "LVL_EFFECT_RANGE"},
			{regex: /^\n\d+(st|nd|rd|th)\sor\sHigher\s/, type: "LVL_EFFECT_RANGE"},
			{regex: /^\n\d+(st|nd|rd|th)\sor\sLower\s/, type: "LVL_EFFECT_RANGE"},
			{regex: /^\n\d+(st|nd|rd|th)\s/, type: "LVL_EFFECT_RANGE"},
		]
	}

	static get afflictions () {
		return [
			{regex: /^Maximum\sDuration\s/, type: "MAX_DURATION"},
			{regex: /^Level\s\d+[\s.;]/, type: "AFFLICTION_LEVEL"},
			{regex: /^Stage\s\d+\s/, type: "STAGE"},
		]
	}

	static get special () {
		return [
			{regex: /^Special/, type: "SPECIAL"},
		]
	}

	static get actions () {
		return [
			{regex: /^\[one.action]\s/, type: "ACTION"},
			{regex: /^\[two.actions?]\s/, type: "TWO_ACTIONS"},
			{regex: /^\[three.actions?]\s/, type: "THREE_ACTIONS"},
			{regex: /^\[reaction]\s/, type: "REACTION"},
			{regex: /^\[free.action]\s/, type: "FREE_ACTION"},
		]
	}

	static get genericEntries () {
		return [
			{regex: /^•/, type: "LIST_MARKER"},
			{regex: /^\(.*?\)/, type: "PARENTHESIS"},
		]
	}

	static get words () {
		return [
			{regex: /^[\S]*;(?=\n)/, type: "WORD_SEMICOLON_NEWLINE"},
			{regex: /^[\S]*;/, type: "WORD_SEMICOLON"},
			{regex: /^[\S]*[.!?:](?=\n)/, type: "WORD_TERM_NEWLINE"},
			{regex: /^[\S]*[.!?:]/, type: "WORD_TERM"},
			{regex: /^[\S]+(?=\n)/, type: "WORD_NEWLINE"},
			{regex: /^[\S]+/, type: "WORD"},
		]
	}

	static get defaultConfig () {
		return {
			default: [
				...this.pageNumbers,

				// DATA HEADERS
				...this.dataHeaders,

				{regex: /^\s+/, type: null},
			],
			spell: [
				...this.endData,

				// SUBHEADERS
				...this.subHeaders,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
				...this.heightened,
				...this.afflictions,
				...this.lvlEffect,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
			feat: [
				...this.endData,

				// SUBHEADERS
				...this.subHeaders,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
				...this.afflictions,
				...this.special,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
		}
	}
	// endregion

	// region utilities
	static get breakEntries () {
		return [
			...this.afflictions,
		]
	}

	static get spellComponents () {
		return {
			F: /focus/,
			S: /somatic/,
			M: /material/,
			V: /verbal/,
		}
	}

	static get rangeUnits () {
		return [
			{regex: /touch/, unit: "touch"},
			{regex: /feet/, unit: "feet"},
			{regex: /ft\./, unit: "feet"},
			{regex: /mile/, unit: "mile"},
			{regex: /planetary/, unit: "planetary"},
			{regex: /interplanar/, unit: "interplanar"},
		]
	}

	static get timeUnits () {
		return [
			{regex: /turns?/, unit: "turn"},
			{regex: /rounds?/, unit: "round"},
			{regex: /minutes?/, unit: "minute"},
			{regex: /hours?/, unit: "hour"},
			{regex: /days?/, unit: "day"},
			{regex: /weeks?/, unit: "week"},
			{regex: /months?/, unit: "month"},
			{regex: /years?/, unit: "year"},
			{regex: /unlimited/, unit: "unlimited"},
		];
	}

	static get areaTypes () {
		return [
			{regex: /emanation/i, type: "Emanation"},
			{regex: /cone/i, type: "Cone"},
			{regex: /burst/i, type: "Burst"},
			{regex: /cylinder/i, type: "Cylinder"},
		];
	}

	static get savingThrows () {
		return [
			{regex: /Fortitude/, unit: "Fort"},
			{regex: /Fort/, unit: "Fort"},
			{regex: /Reflex/, unit: "Reflex"},
			{regex: /Will/, unit: "Will"},
		]
	}

	static get sentences () {
		return this.words.map(w => w.type.replace(/WORD/, "SENTENCE"));
	}

	static get sentencesNewLine () {
		return this.sentences.filter(w => w.type.endsWith("NEWLINE"));
	}

	static get subHeadingEntries () {
		return [
			...this.sentences,
			...this.actions.map(a => a.type),
			"PARENTHESIS",
		];
	}
	// endregion
}

class Tokenizer {
	constructor (config) {
		this._config = config;
		this._string = "";
		this._cursor = 0;
		this._mode = null;
	}

	init (string) {
		this._string = string;
		this._cursor = 0;
		this._mode = "default"
	}

	hasMoreTokens () {
		return this._cursor < this._string.length;
	}

	getNextToken () {
		if (!this.hasMoreTokens()) return null;

		const string = this._string.slice(this._cursor);

		for (const {regex, type, mode} of this._config[this._mode]) {
			const value = this._match(regex, string);

			if (value == null) continue;
			if (type == null) return this.getNextToken();
			if (mode) this._mode = mode;

			return {type, value};
		}

		throw new Error(`Unexpected token! "${string.slice(0, 50)}..."`);
	}

	_match (regexp, string) {
		const match = regexp.exec(string);
		if (match == null) return null;

		this._cursor += match[0].length;
		return match[0];
	}
}

if (typeof module !== "undefined") {
	module.exports = {
		Tokenizer,
		TokenizerUtils,
	}
}
