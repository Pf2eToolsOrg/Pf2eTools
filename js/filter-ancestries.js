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
		this._languageFilter = new Filter({header: "Languages", displayFn: (it) => Renderer.stripTags(it).toTitleCase()});
		this._traitsFilter = new Filter({header: "Traits"});
		this._fAbilities = new Filter({header: "Abilities", itemSortFn: null});
		this._miscFilter = new Filter({header: "Miscellaneous", itemSortFn: null});
		this._rarityFilter = new Filter({header: "Rarity", displayFn: (it) => Renderer.stripTags(it).toTitleCase()});
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
		ancestry._fAbilities = []
		const unarmedAttacks = new RegExp("Bite|Beak|Fangs|Claws", "g")
		if (ancestry.features) {
			ancestry.features.forEach(function (obj) {
				if (unarmedAttacks.test(obj.name)) { ancestry._fAbilities.push("Unarmed Attack") }
				ancestry._fAbilities.push(obj.name)
			});
		}
		ancestry._fSpeedtypes = []
		ancestry._fSpeed = 0
		Object.keys(ancestry.speed).forEach((k) => {
			ancestry._fSpeed = Math.max(ancestry.speed[k], ancestry._fSpeed);
			ancestry._fSpeedtypes.push(k);
		});
	}

	addToFilters (ancestry, isExcluded, opts) {
		if (isExcluded) return;
		this._sourceFilter.addItem(ancestry._fSources);
		this._hpFilter.addItem(ancestry.hp);
		this._sizeFilter.addItem(ancestry.size);
		this._languageFilter.addItem(ancestry._flanguages);
		this._traitsFilter.addItem(ancestry.traits);
		this._rarityFilter.addItem(ancestry.rarity);
		this._miscFilter.addItem(ancestry._fMisc);
		this._fAbilities.addItem(ancestry._fAbilities);
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
			this._rarityFilter,
			this._miscFilter,
			this._fAbilities,
			this._optionsFilter,
		];
	}

	toDisplay (values, a) {
		return this._filterBox.toDisplay(
			values,
			a._fSources,
			a.boosts || [],
			a.flaw || [],
			a.hp,
			a.size,
			a._fSpeed,
			a._fSpeedtypes,
			a._flanguages,
			a.traits,
			a.rarity,
			a._fMisc,
			a._fAbilities,
		)
	}
}
