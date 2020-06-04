"use strict";

class PageFilterVehicles extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = SourceFilter.getInstance();
	}

	mutateForFilters (it) {
		// No-op
	}

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
			it._fTime,
			it._fMisc
		)
	}
}
