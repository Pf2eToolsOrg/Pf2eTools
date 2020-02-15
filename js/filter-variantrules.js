"use strict";

class PageFilterVariantRules extends PageFilter {
	// region static
	// endregion

	constructor () {
		super();

		this._sourceFilter = SourceFilter.getInstance();
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"]});
	}

	mutateForFilters (rule) {
		rule._fMisc = rule.srd ? ["SRD"] : [];
	}

	addToFilters (rule, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(rule.source);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter
		];
	}

	toDisplay (values, r) {
		return this._filterBox.toDisplay(
			values,
			r.source,
			r._fMisc
		)
	}
}
