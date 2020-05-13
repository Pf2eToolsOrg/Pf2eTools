"use strict";

class PageFilterConditionsDiseases extends PageFilter {
	// region static
	// endregion

	constructor () {
		super();

		this._sourceFilter = SourceFilter.getInstance();
		this._typeFilter = new Filter({
			header: "Type",
			items: ["condition", "disease"],
			displayFn: StrUtil.uppercaseFirst,
			deselFn: (it) => it === "disease"
		});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"]});
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
			this._typeFilter,
			this._miscFilter
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.__prop,
			it._fMisc
		)
	}
}
