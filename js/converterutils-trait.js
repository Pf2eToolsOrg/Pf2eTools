"use strict";

if (typeof module !== "undefined") {
	const cv = require("./converterutils.js");
	Object.assign(global, cv);
}

class TraitConverter extends ConverterBase {
	constructor (source, textToConvert) {
		super(source, textToConvert);
		this.matches = [...this.source.txt.matchAll(/^([^\n]*?) \(trait\)(.*?)(?:\.|\s\d+)\n/gm)];
	}

	convert (match) {
		this.trait = {};
		this.trait.name = match[1].toTitleCase();
		this.trait.source = this.source.name;
		this.trait.page = this.getPageNumber();
		this.trait.entries = this.cleanEntry(match[2]);
		return this.trait;
	}
}

if (typeof module !== "undefined") {
	module.exports = {
		TraitConverter,
	};
}
