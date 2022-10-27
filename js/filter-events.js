"use strict";

class PageFilterEvents extends PageFilter {
	constructor () {
		super()

		this._sourceFilter = new SourceFilter()
		this._levelFilter = new RangeFilter({
			header: "Level",
			isLabelled: true,
		});
		this._skillsFilter = new Filter({
			header: "Applicable Skills",
		});
	}
	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fSkills = Parser.parseSkills(it.applicableSkills, {toNone: true, toTitleCase: true});
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;
		this._sourceFilter.addItem(it._fSources);
		this._levelFilter.addItem(Math.floor(it.level));
		this._skillsFilter.addItem(it._fSkills);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._skillsFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.level,
			it._fSkills,
		)
	}
}
