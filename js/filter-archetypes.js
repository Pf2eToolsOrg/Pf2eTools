"use strict";
class PageFilterArchetypes extends PageFilter {
	constructor () {
		super();
		this._traitFilter = new TraitsFilter({
			header: "Traits"
		});
		this._benefitsFilter = new Filter({header: "Benefits"});
		this._levelFilter = new Filter({
			header: "Dedication Level",
			displayFn: l => `Level ${l}`,
		});
		this._miscFilter = new Filter({header: "Miscellaneous"});
	}

	mutateForFilters (archetype, opts) {
		archetype._fTraits = (archetype.traits || []).map(t => Parser.getTraitName(t));
		archetype._fSources = SourceFilter.getCompleteFilterSources(archetype);
		if (archetype.rarity) archetype._fRarity = archetype.rarity.toTitleCase();
	}

	addToFilters (archetype, isExcluded, opts) {
		if (isExcluded) return;
		this._traitFilter.addItem(archetype._fTraits);
		this._sourceFilter.addItem(archetype._fSources);
		this._levelFilter.addItem(archetype.dedicationLevel);
		this._benefitsFilter.addItem(archetype.benefits);
		this._miscFilter.addItem(archetype.miscTags);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._traitFilter,
			this._levelFilter,
			this._benefitsFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, a) {
		return this._filterBox.toDisplay(
			values,
			a._fSources,
			a._fTraits,
			a.dedicationLevel,
			a.benefits,
			a.miscTags,
		)
	}
}
