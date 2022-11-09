"use strict";

class PageFilterTables extends PageFilter {
	// region static
	static _sourceSelFn (val) {
		return !SourceUtil.isNonstandardSource(val) && !SourceUtil.isAdventure(val);
	}
	// endregion

	constructor () {
		super();

		this._sourceFilter = new SourceFilter({
			selFn: PageFilterTables._sourceSelFn,
		});

		this._miscFilter = new Filter({header: "Miscellaneous"});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fMisc = [];
		if (it.rollable) it._fMisc.push("Is Rollable");
		if (it.id) it._fMisc.push("Has Table Number");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;
		this._sourceFilter.addItem(it._fSources);
		this._miscFilter.addItem(it._fMisc);
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
			it._fSources,
			it._fMisc,
		)
	}
}
