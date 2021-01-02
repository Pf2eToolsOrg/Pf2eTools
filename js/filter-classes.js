"use strict";

class PageFilterClasses extends PageFilter {
	constructor () {
		super();
		this._miscFilter = new Filter({header: "Miscellaneous", itemSortFn: null});
		this._optionsFilter = new OptionsFilter({
			header: "Other Options",
			defaultState: {
				isDisplayClassIfSubclassActive: false,
			},
			displayFn: k => {
				switch (k) {
					case "isDisplayClassIfSubclassActive": return "Display Class if Any Subclass is Visible";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
			displayFnMini: k => {
				switch (k) {
					case "isDisplayClassIfSubclassActive": return "Sc>C";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
		})
	}

	get optionsFilter () { return this._optionsFilter; }

	mutateForFilters (cls, opts) {
		cls._fMisc = []
	}

	addToFilters (cls, isExcluded, opts) {
		if (isExcluded) return;
		this._sourceFilter.addItem(cls.source);
		this._miscFilter.addItem(cls._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
			this._optionsFilter,
		];
		opts.isCompact = true;
	}

	toDisplay (values, c) {
		return this._filterBox.toDisplay(
			values,
			c.source,
			c._fMisc,
		)
	}
}
