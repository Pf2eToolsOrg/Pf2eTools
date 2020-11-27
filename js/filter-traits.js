"use strict";

class PageFilterTraits extends PageFilter {
	constructor () {
		super();
		this._sourceFilter = new SourceFilter();
	}

	mutateForFilters (it) {}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
		)
	}
}
