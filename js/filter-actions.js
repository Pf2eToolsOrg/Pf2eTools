"use strict";

class PageFilterActions extends PageFilter {
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
		this._untrainedFilter = new Filter({header: "Skill (Untrained)"});
		this._trainedFilter = new Filter({header: "Skill (Trained)"});
		this._typeFilter = new Filter({
			header: "Type",
			items: ["Ancestry", "Heritage", "Class", "Archetype", "Basic", "Skill (Trained)", "Skill (Untrained)"],
			selFn: (it) => it === "Basic",
		});
		this._traitFilter = new TraitsFilter({header: "Traits"});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action", "SRD"]});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fTime = it.activity ? it.activity.unit : null;
		it.actionType = it.actionType || {};
		it._fType = Object.keys(it.actionType).filter(k => it.actionType[k]).map(k => Parser.actionTypeKeyToFull(k));
		it._fMisc = it.srd ? ["SRD"] : [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._traitFilter.addItem(it.traits);
		this._trainedFilter.addItem(it.actionType.trained);
		this._untrainedFilter.addItem(it.actionType.untrained);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._timeFilter,
			this._typeFilter,
			this._untrainedFilter,
			this._trainedFilter,
			this._traitFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fTime,
			it._fType,
			it.actionType.untrained,
			it.actionType.trained,
			it.traits,
			it._fMisc,
		)
	}
}
