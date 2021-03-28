"use strict";

class PageFilterPlaces extends PageFilter {
	constructor () {
		super();
		this._categoryFilter = new Filter({header: "Category"});
	}
	mutateForFilters (it) {
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._categoryFilter.addItem(it.category);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._categoryFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.category,
		)
	}
}
