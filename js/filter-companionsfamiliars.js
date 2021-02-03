"use strict";

class PageFilterCompanionsFamiliars extends PageFilter {
	constructor () {
		super();
		this._typeFilter = new Filter({header: "Type"});
		this._traitsFilter = new Filter({header: "Traits"});
		this._skillFilter = new Filter({header: "Skills"});
		this._strengthFilter = new RangeFilter({header: "Strength", min: -5, max: 5});
		this._dexterityFilter = new RangeFilter({header: "Dexterity", min: -5, max: 5});
		this._constitutionFilter = new RangeFilter({header: "Constitution", min: -5, max: 5});
		this._intelligenceFilter = new RangeFilter({header: "Intelligence", min: -5, max: 5});
		this._wisdomFilter = new RangeFilter({header: "Wisdom", min: -5, max: 5});
		this._charismaFilter = new RangeFilter({header: "Charisma", min: -5, max: 5});
		this._abilityFilter = new MultiFilter({
			header: "Ability Modifiers",
			filters: [this._strengthFilter, this._dexterityFilter, this._constitutionFilter, this._intelligenceFilter, this._wisdomFilter, this._charismaFilter],
		});
		this._HPFilter = new RangeFilter({
			header: "Hit Points",
		});
		this._speedFilter = new RangeFilter({
			header: "Speed",
			isLabelled: true,
		});
		this._speedTypeFilter = new Filter({
			header: "Speed Types",
			displayFn: (x) => x.uppercaseFirst(),
		})
		this._speedMultiFilter = new MultiFilter({
			header: "Speeds",
			filters: [this._speedFilter, this._speedTypeFilter],
		});
		this._requiredFilter = new RangeFilter({header: "Required Number of Abilities"});
		this._grantedFilter = new Filter({header: "Granted Abilities", displayFn: StrUtil.toTitleCase});
		this._miscFilter = new Filter({header: "Miscellaneous"});
	}

	mutateForFilters (it) {
		it._fHP = it.HP != null ? it.HP : 0;
		it._fspeedtypes = [];
		it._fspeed = 0;
		if (it.speed) {
			Object.keys(it.speed).forEach((k) => {
				if (k !== "abilities") {
					it._fspeed = Math.max(it.speed[k], it._fspeed);
					it._fspeedtypes.push(k)
				}
			});
		}
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._typeFilter.addItem(it.type);
		if (it.traits) this._traitsFilter.addItem(it.traits);
		if (it.skill) this._skillFilter.addItem(it.skill);
		this._HPFilter.addItem(it._fHP);
		this._speedFilter.addItem(it._fspeed);
		this._speedTypeFilter.addItem(it._fspeedtypes);
		if (it.requires) this._requiredFilter.addItem(it.requires);
		if (it.granted) this._grantedFilter.addItem(it.granted);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._traitsFilter,
			this._abilityFilter,
			this._HPFilter,
			this._speedMultiFilter,
			this._requiredFilter,
			this._grantedFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.type,
			it.traits,
			[
				it.abilityMod ? it.abilityMod.Str : null,
				it.abilityMod ? it.abilityMod.Dex : null,
				it.abilityMod ? it.abilityMod.Con : null,
				it.abilityMod ? it.abilityMod.Int : null,
				it.abilityMod ? it.abilityMod.Wis : null,
				it.abilityMod ? it.abilityMod.Cha : null,
			],
			it._fHP,
			[
				it._fspeed,
				it._fspeedtypes,
			],
			it.requires,
			it.granted,
			it._fMisc,
		)
	}
}
