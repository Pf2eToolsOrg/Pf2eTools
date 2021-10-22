"use strict";

class PageFilterConditions extends PageFilter {
	// region static
	static getDisplayProp (prop) {
		return prop === "status" ? "Other" : prop.uppercaseFirst();
	}
	// endregion

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
		)
	}
}
