"use strict";

class PageFilterAncestries extends PageFilter {
	constructor () {
		super();
		this._boostFilter = new Filter({
			header: "Ability Boosts",
			items: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma", "Free"],
			itemSortFn: null,
		});
		this._flawFilter = new Filter({
			header: "Ability Flaw",
			items: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"],
			itemSortFn: null,
		});
		this._hpFilter = new RangeFilter({
			header: "Hit Points",
			isLabelled: true,
			labels: [6, 8, 10, 12],
		});
		this._sizeFilter = new Filter({header: "Size"});
		this._speedFilter = new RangeFilter({
			header: "Speed",
			isLabelled: true,
			labels: [20, 25, 30],
			labelDisplayFn: (it) => `${it} feet`,
		});
		this._speedTypeFilter = new Filter({
			header: "Speed Types",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._languageFilter = new Filter({header: "Languages", displayFn: (it) => Renderer._stripTagLayer(it).toTitleCase()});
		this._traitsFilter = new Filter({header: "Traits", displayFn: (it) => Renderer._stripTagLayer(it).toTitleCase()});
		this._miscFilter = new Filter({header: "Miscellaneous", itemSortFn: null});
		this._optionsFilter = new OptionsFilter({
			header: "Other Options",
			defaultState: {
				isShowVeHeritages: true,
				isShowStdHeritages: true,
			},
			displayFn: k => {
				switch (k) {
					case "isShowVeHeritages": return "Display Versatile Heritages";
					case "isShowStdHeritages": return "Display Standard Heritages";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
			displayFnMini: k => {
				switch (k) {
					case "isShowVeHeritages": return "V.Her.";
					case "isShowStdHeritages": return "Std.Her.";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
		})
	}

	get optionsFilter () { return this._optionsFilter; }

	mutateForFilters (ancestry, opts) {
		ancestry._fSources = SourceFilter.getCompleteFilterSources(ancestry);
		ancestry._flanguages = ancestry.languages.filter(it => it.length < 20);
		ancestry._fMisc = [];
		if (ancestry.feature) {
			if (ancestry.feature.name === "Low-Light Vision") ancestry._fMisc.push("Has Low-Light Vision")
			if (ancestry.feature.name === "Darkvision") ancestry._fMisc.push("Has Darkvision")
		}
		ancestry._fspeedtypes = []
		ancestry._fspeed = 0
		Object.keys(ancestry.speed).forEach((k) => {
			ancestry._fspeed = Math.max(ancestry.speed[k], ancestry._fspeed);
			ancestry._fspeedtypes.push(k);
		});
	}

	addToFilters (ancestry, isExcluded, opts) {
		if (isExcluded) return;
		this._sourceFilter.addItem(ancestry._fSources);
		this._hpFilter.addItem(ancestry.hp);
		this._sizeFilter.addItem(ancestry.size);
		this._languageFilter.addItem(ancestry._flanguages);
		this._traitsFilter.addItem(ancestry.traits);
		this._miscFilter.addItem(ancestry._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._boostFilter,
			this._flawFilter,
			this._hpFilter,
			this._sizeFilter,
			this._speedFilter,
			this._speedTypeFilter,
			this._languageFilter,
			this._traitsFilter,
			this._miscFilter,
			this._optionsFilter,
		];
		opts.isCompact = true;
	}

	toDisplay (values, a) {
		return this._filterBox.toDisplay(
			values,
			a._fSources,
			a.boosts || [],
			a.flaw || [],
			a.hp,
			a.size,
			a._fspeed,
			a._fspeedtypes,
			a._flanguages,
			a.traits,
			a._fMisc,
		)
	}
}
