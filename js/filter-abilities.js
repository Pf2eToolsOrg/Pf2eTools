"use strict";

class PageFilterAbilities extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._timeFilter = new Filter({
			header: "Activity",
			itemSortFn: SortUtil.sortActivities,
		});
		this._traitFilter = new Filter({header: "Traits"})
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action"]});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fTime = Parser.timeToActivityType(it.activity);
		it._fMisc = [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		if (it._fTime != null) this._timeFilter.addItem(it._fTime);
		this._traitFilter.addItem(it.traits);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._timeFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fTime,
			it.traits,
			it._fMisc,
		)
	}
}
