"use strict";

class PageFilterConditionsDiseases extends PageFilter {
	// region static
	static getDisplayProp (prop) {
		return prop === "status" ? "Other" : prop.uppercaseFirst();
	}
	// endregion

	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"], isSrdFilter: true});
	}

	mutateForFilters (it) {
		it._fMisc = it.srd ? ["SRD"] : [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it._fMisc,
		)
	}
}
