"use strict";

class PageFilterBackgrounds extends PageFilter {
	constructor () {
		super();

		this._traitsFilter = new TraitsFilter({ header: "Traits" });
		this._skillFilter = new Filter({
			header: "Skill Proficiencies",
			displayFn: (it) => it.toTitleCase(),
		});
		this._loreFilter = new Filter({
			header: "Lore Proficiencies",
			displayFn: (it) => it.toTitleCase(),
		});
		this._boostFilter = new Filter({
			header: "Ability Boosts",
			items: [
				"Strength",
				"Dexterity",
				"Constitution",
				"Intelligence",
				"Wisdom",
				"Charisma",
				"Free",
			],
			itemSortFn: null,
		});
		this._featFilter = new Filter({
			header: "Feats",
			displayFn: (it) => it.toTitleCase(),
		});
		this._spellFilter = new Filter({
			header: "Spells",
			displayFn: (it) => it.toTitleCase(),
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: [
				"Grants Ability",
				"Grants Equipment",
				"Grants Sense",
				"Grants Situational Benefit",
				"Has Drawback",
			],
		});
	}

	mutateForFilters (bg) {
		bg._fSources = SourceFilter.getCompleteFilterSources(bg);
		bg._fTraits = (bg.traits || []).map((t) => Parser.getTraitName(t));
		bg._fSpells = (bg.spells || []).map((s) => s.split("|")[0]);
		bg._fBoosts = (bg.boosts || []).map((s) => s.toTitleCase());
		bg._fMisc = (bg.miscTags || []).map((tag) => {
			switch (tag) {
				case "ability":
					return "Grants Ability";
				case "equipment":
					return "Grants Equipment";
				case "sense":
					return "Grants Sense";
				case "situationalBenefit":
					return "Grants Situational Benefit";
				case "drawback":
					return "Has Drawback";
			}
		});
	}

	addToFilters (bg, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(bg._fSources);
		this._traitsFilter.addItem(bg._fTraits);
		this._skillFilter.addItem(bg.skills);
		this._loreFilter.addItem(bg.lore);
		this._boostFilter.addItem(bg._fBoosts);
		this._featFilter.addItem(bg.feats);
		this._spellFilter.addItem(bg._fSpells);
		this._miscFilter.addItem(bg._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._traitsFilter,
			this._boostFilter,
			this._skillFilter,
			this._loreFilter,
			this._featFilter,
			this._spellFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, bg) {
		return this._filterBox.toDisplay(
			values,
			bg._fSources,
			bg._fTraits,
			bg._fBoosts,
			bg.skills,
			bg.lore,
			bg.feats,
			bg._fSpells,
			bg._fMisc,
		);
	}
}
