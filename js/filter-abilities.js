"use strict";

class PageFilterAbilities extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._timeFilter = new Filter({
			header: "Activity",
			items: [
				Parser.TM_A,
				Parser.TM_AA,
				Parser.TM_AAA,
				Parser.TM_F,
				Parser.TM_R,
				Parser.TM_MINS,
				Parser.TM_HRS,
				"Varies",
			],
			displayFn: Parser.timeUnitToFull,
			itemSortFn: null,
		});
		this._traitFilter = new Filter({header: "Traits"})
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action"]});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fTime = it.activity ? it.activity.unit : null;
		it._fMisc = [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		if (!isExcluded) {
			this._sourceFilter.addItem(it._fSources);
			this._traitFilter.addItem(it.traits)
		}
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
