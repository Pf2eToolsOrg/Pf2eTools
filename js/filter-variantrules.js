"use strict";

class PageFilterVariantRules extends PageFilter {
	// region static
	// endregion

	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._ruleTypeFilter = new Filter({header: "Rule Type"});
	}

	mutateForFilters (rule) {
		rule._fSources = SourceFilter.getCompleteFilterSources(rule);
	}

	addToFilters (rule, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(rule._fSources);
		if (rule.type) this._ruleTypeFilter.addItem(rule.type);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._ruleTypeFilter,
		];
	}

	toDisplay (values, r) {
		return this._filterBox.toDisplay(
			values,
			r._fSources,
			r.type,
		)
	}
}
