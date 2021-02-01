"use strict";
class PageFilterArchetypes extends PageFilter {
	constructor () {
		super();
		this._miscFilter = new Filter({header: "Miscellaneous"})
	}

	mutateForFilters (archetype, opts) {
	}

	addToFilters (archetype, isExcluded, opts) {
		if (isExcluded) return;
		this._sourceFilter.addItem(archetype.source);
		this._miscFilter.addItem(archetype.miscTags)
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, a) {
		return this._filterBox.toDisplay(
			values,
			a.source,
			a.miscTags,
		)
	}
}
