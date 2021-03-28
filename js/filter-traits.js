"use strict";

class PageFilterTraits extends PageFilter {
	constructor () {
		super();
		this._categoryFilter = new Filter({header: "Categories"});
	}

	mutateForFilters (it) {
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		if (it.categories) this._categoryFilter.addItem(it.categories.filter(c => !c.startsWith("_")));
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
			it.categories || [],
		)
	}
}
