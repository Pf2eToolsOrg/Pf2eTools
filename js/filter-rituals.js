"use strict";

class PageFilterRituals extends PageFilter {
	// region static
	static getFltrRitualLevelStr (level) {
		return `${Parser.spLevelToFull(level)} level`;
	}
	// endregion

	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._levelFilter = new Filter({
			header: "Level",
			items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			displayFn: PageFilterRituals.getFltrRitualLevelStr,
		});
		this._traitFilter = new Filter({header: "Traits"});
		this._timeFilter = new Filter({
			header: "Cast Time",
			items: [
				Parser.TM_HRS,
				Parser.TM_DAYS,
				"Varies",
			],
			displayFn: Parser.timeUnitToFull,
			itemSortFn: null,
		});
		this._secondaryCastersFilter = new RangeFilter({header: "Secondary Casters"});
		this._primaryCheckFilter = new Filter({header: "Primary Checks"});
		this._profFilter = new Filter({
			header: "Minimum Proficiency",
			items: [...Parser.PROFICIENCIES],
			itemSortFn: null,
		});
		this._secondaryCheckFilter = new Filter({header: "Secondary Checks"});
		this._checksFilter = new MultiFilter({
			header: "Checks",
			filters: [this._primaryCheckFilter, this._profFilter, this._secondaryCheckFilter],
		});
		this._rangeFilter = new RangeFilter({
			header: "Range",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Touch", "5 feet", "10 feet", "25 feet", "50 feet", "100 feet", "500 feet", "1 mile", "Planetary", "Unlimited", "Varies"],
		});
		this._durationFilter = new RangeFilter({
			header: "Duration",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Instant", "1 Round", "1 Minute", "10 Minutes", "1 Hour", "8 Hours", "24+ Hours", "Unlimited", "Special"],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Can be Heightened", "Has a Cost"],
		});
	}

	mutateForFilters (it) {
		it._normalisedTime = Parser.getNormalisedTime(it.cast);

		it._fTraits = it.traits.map(t => Parser.getTraitName(t));
		it._fTimeType = [it.cast["unit"]];
		it._fSndCasters = it.secondaryCasters ? it.secondaryCasters.number : 0;
		it._fPmCheck = it.primaryCheck.skills || [];
		it._fProf = (it.primaryCheck.prof || "Untrained").uppercaseFirst();
		it._fSndCheck = it.secondaryCheck ? it.secondaryCheck.skills : [];
		it._fDurationType = Parser.getFilterDuration(it);
		it._fRange = Parser.getFilterRange(it);
		it._fMisc = [];
		if (it.heightened.heightened) it._fMisc.push("Can be Heightened");
		if (it.cost) it._fMisc.push("Has a Cost");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._traitFilter.addItem(it._fTraits);
		this._timeFilter.addItem(it._fTimeType);
		this._secondaryCastersFilter.addItem(it._fSndCasters);
		this._primaryCheckFilter.addItem(it._fPmCheck);
		this._profFilter.addItem(it._fProf);
		this._secondaryCheckFilter.addItem(it._fSndCheck);
		this._durationFilter.addItem(it._fDurationType);
		this._rangeFilter.addItem(it._fRange);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._traitFilter,
			this._timeFilter,
			this._secondaryCastersFilter,
			this._checksFilter,
			this._durationFilter,
			this._rangeFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.level,
			it._ftraits,
			it._fTimeType,
			it._fSndCasters,
			[
				it._fPmCheck,
				it._fProf,
				it._fSndCheck,
			],
			it._fDurationType,
			it._fRange,
			it._fMisc,
		)
	}
}
