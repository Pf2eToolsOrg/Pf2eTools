"use strict";

class PageFilterActions extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._timeFilter = new Filter({
			header: "Activity",
			items: [
				Parser.SP_TM_PF_A,
				Parser.SP_TM_PF_AA,
				Parser.SP_TM_PF_AAA,
				Parser.SP_TM_PF_F,
				Parser.SP_TM_PF_R,
				Parser.SP_TM_MINS,
				Parser.SP_TM_HRS,
				"Varies"
			],
			displayFn: Parser.spTimeUnitToFull,
			itemSortFn: null
		});
		this._traitFilter = new Filter({header: "Traits"})
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action", "SRD"]});
	}

	mutateForFilters (it) {
		it._fTime = it.activity ? it.activity.unit : null;
		it._fMisc = it.srd ? ["SRD"] : [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		if (!isExcluded) {
			this._sourceFilter.addItem(it.source);
			this._traitFilter.addItem(it.traits)
			this._timeFilter.addItem(it._fTime);
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
			it.source,
			it._fTime,
			it.traits,
			it._fMisc
		)
	}
}
