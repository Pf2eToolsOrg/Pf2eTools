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
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fType = it.__prop.uppercaseFirst();
		it._fTraits = []
		it._fTraits = it.traits.map(t => Parser.getTraitName(t));
		if (!it._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) it._fTraits.push("Common");
		it._fLvl = PageFilterAfflictions.getFilterLevel(it.level);
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it._fType);
		this._levelFilter.addItem(it._fLvl);
		this._traitFilter.addItem(it._fTraits);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._levelFilter,
			this._traitFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fType,
			it._fLvl,
			it._fTraits,
		)
	}
}
