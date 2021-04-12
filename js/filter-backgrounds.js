"use strict";

class PageFilterBackgrounds extends PageFilter {
	constructor () {
		super();

		this._skillFilter = new Filter({header: "Skill Proficiencies", displayFn: StrUtil.toTitleCase});
		this._loreFilter = new Filter({header: "Lore Proficiencies", displayFn: StrUtil.toTitleCase});
		this._boostFilter = new Filter({
			header: "Ability Boosts",
			items: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma", "Free"],
			itemSortFn: null,
		});
	}

	mutateForFilters (bg) {
	}

	addToFilters (bg, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(bg.source);
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
			bg.source,
			bg.boosts,
			bg.skills,
			bg.lore,
		)
	}
}
