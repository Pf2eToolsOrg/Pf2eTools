"use strict";

class PageFilterBackgrounds extends PageFilter {
	constructor () {
		super();

		this._skillFilter = new Filter({header: "Skill Proficiencies", displayFn: (it) => Renderer._stripTagLayer(it).toTitleCase()});
		this._loreFilter = new Filter({header: "Lore Proficiencies", displayFn: (it) => Renderer._stripTagLayer(it).toTitleCase()});
		this._boostFilter = new Filter({
			header: "Ability Boosts",
			items: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma", "Free"],
			itemSortFn: null,
		});
	}

	mutateForFilters (bg) {
		bg._fSources = SourceFilter.getCompleteFilterSources(bg);
	}

	addToFilters (bg, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(bg._fSources);
		this._skillFilter.addItem(bg.skills);
		this._loreFilter.addItem(bg.lore);
		this._boostFilter.addItem(bg.boosts);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._boostFilter,
			this._skillFilter,
			this._loreFilter,
		];
	}

	toDisplay (values, bg) {
		return this._filterBox.toDisplay(
			values,
			bg._fSources,
			bg.boosts,
			bg.skills,
			bg.lore,
		)
	}
}
