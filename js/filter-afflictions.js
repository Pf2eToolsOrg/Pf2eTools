"use strict";

class PageFilterAfflictions extends PageFilter {
	static getFilterLevel (level) {
		return isNaN(Number(level)) ? "Varies" : Number(level);
	}

	constructor () {
		super();
		this._typeFilter = new Filter({header: "Type"});
		this._levelFilter = new RangeFilter({header: "Level", isLabelled: true, labels: [...[...Array(21).keys()].slice(1), "Varies"]});
		this._traitFilter = new TraitsFilter({header: "Traits"});
		this._miscFilter = new Filter({header: "Miscellaneous"});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fType = it.type;
		it._fTraits = it.traits.map(t => Parser.getTraitName(t));
		if (!it._fTraits.some(t => Renderer.trait.isTraitInCategory(t, "Rarity"))) it._fTraits.push("Common");
		it._fLvl = PageFilterAfflictions.getFilterLevel(it.level);

		it._fMiscFilter = [];
		if (it.temptedCurse) it._fMiscFilter.push("Tempted Curse");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it._fType);
		this._levelFilter.addItem(it._fLvl);
		this._traitFilter.addItem(it._fTraits);
		this._miscFilter.addItem(it._fMiscFilter);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._levelFilter,
			this._traitFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fType,
			it._fLvl,
			it._fTraits,
			it._fMiscFilter,
		)
	}
}
