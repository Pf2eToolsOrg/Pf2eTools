"use strict";

if (typeof module !== "undefined") {
	const cv = require("./converterutils.js");
	Object.assign(global, cv);
}

class TraitConverter extends ConverterBase {
	constructor (source, textToConvert) {
		super(source, textToConvert);
		this.matches = [...this.source.txt.matchAll(/^([^\n]*?) \([a-z ]*?trait\)(.*?)(?:\.|\s\d+|–\d+)\n/gsm)];
	}

	convert (match) {
		this.trait = {};
		this.trait.name = match[1].toTitleCase();
		this.trait.source = this.source.name;
		this.trait.page = this.getPageNumber();
		this.trait.entries = this._getCleanEntry(match);
		return this.trait;
	}

	_getCleanEntry (match) {
		if (!match || !match[2]) return [];
		if (/[A-Z]{2,} \d+$/.test(match[2])) return [];
		return ConverterUtils.cleanEntry(match[2]);
	}
}

if (typeof module !== "undefined") {
	module.exports = {
		TraitConverter,
	};
}
