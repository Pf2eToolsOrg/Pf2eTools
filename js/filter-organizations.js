"use strict";

class PageFilterOrganizations extends PageFilter {
	constructor () {
		super();
		this._AlignmentFilter = new Filter({
			header: "Accepted Alignment",
			itemSortFn: SortUtil.alignmentSort,
			displayFn: Parser.alignToFull,
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: [],
			displayFn: StrUtil.uppercaseFirst,
		});
	}
	mutateForFilters (it) {
		it._fMisc = [];
		it._fFollowerAlignment = [];
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		if (it.hasLore === true) it._fMisc.push("Has Lore")
		if (it.images) it._fMisc.push("Has Images")
		if (it.followerAlignment) it.followerAlignment.map(i => it._fFollowerAlignment.push(i.main))
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._AlignmentFilter.addItem(it._fFollowerAlignment);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._AlignmentFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fFollowerAlignment,
			it._fMisc,
		)
	}
}
