"use strict";

class PageFilterTables extends PageFilter {
	// region static
	// endregion

	constructor () {
		super();

		this._sourceFilter = SourceFilter.getInstance();
	}

	mutateForFilters (it) { /* no-op */ }

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
			it.source
		)
	}
}
