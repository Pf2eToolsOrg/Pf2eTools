"use strict";

class PageFilterLanguages extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._typeFilter = new Filter({
			header: "Type",
			items: ["Common", "Uncommon", "Rare", "Regional", "Secret"],
			itemSortFn: null,
			displayFn: StrUtil.uppercaseFirst,
		});
		this._miscFilter = new Filter({ header: "Miscellaneous", items: ["Has Fonts"] });
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fMisc = it.fonts ? ["Has Fonts"] : [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [this._sourceFilter, this._typeFilter, this._miscFilter];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(values, it._fSources, it.type, it._fMisc);
	}
}
