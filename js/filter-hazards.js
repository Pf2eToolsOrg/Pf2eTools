"use strict";

class PageFilterHazards extends PageFilter {
	constructor () {
		super();
		this._sourceFilter = new SourceFilter();
		this._levelFilter = new RangeFilter({header: "Level"});
		this._stealthDcFilter = new RangeFilter({header: "Stealth DC"});
		this._stealthMinProfFilter = new Filter({
			header: "Minimum Proficiency",
			itemSortFn: SortUtil.ascSortProfRanks,
			displayFn: it => it.uppercaseFirst(),
		});
		this._stealthFilter = new MultiFilter({
			header: "Stealth",
			filters: [this._stealthDcFilter, this._stealthMinProfFilter],
		});
		this._acFilter = new RangeFilter({header: "Armor Class"});
		this._hardnessFilter = new RangeFilter({header: "Hardness"});
		this._hpFilter = new RangeFilter({header: "Hit Points"});
		this._fortFilter = new RangeFilter({header: "Fortitude"});
		this._refFilter = new RangeFilter({header: "Reflex"});
		this._willFilter = new RangeFilter({header: "Will"});
		this._immunitiesFilter = new Filter({
			header: "Immunities",
			displayFn: StrUtil.toTitleCase,
		});
		this._defenseFilter = new MultiFilter({
			header: "Defenses",
			filters: [this._acFilter, this._hardnessFilter, this._hpFilter],
		});
		this._savingThrowFilter = new MultiFilter({
			header: "Saving Throws",
			filters: [this._fortFilter, this._refFilter],
		});
		this._traitsFilter = new Filter({header: "Traits"});
		this._miscFilter = new Filter({header: "Miscellaneous"});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fStealth = it.stealth ? (it.stealth.dc ? it.stealth.dc : (it.stealth.bonus || 0) + 10) : 0;
		if (it.defenses != null) {
			if (it.defenses.ac) it._fAC = Math.max(...Object.values(it.defenses.ac).filter(v => typeof v === "number"));
			if (it.defenses.hardness) it._fHardness = Math.max(...Object.values(it.defenses.hardness).filter(v => typeof v === "number"));
			if (it.defenses.hp) it._fHP = Math.max(...Object.values(it.defenses.hp).filter(v => typeof v === "number"));
			if (it.defenses.savingThrows) it._fFort = it.defenses.savingThrows.fort ? it.defenses.savingThrows.fort.std : null;
			if (it.defenses.savingThrows) it._fRef = it.defenses.savingThrows.ref ? it.defenses.savingThrows.ref.std : null;
			if (it.defenses.savingThrows) it._fWill = it.defenses.savingThrows.will ? it.defenses.savingThrows.will.std : null;
			if (it.defenses.immunities) it._fImmunities = it.defenses.immunities;
		}
		it._fTraits = it.traits.map(t => Parser.getTraitName(t));
		it._fMisc = [];
		if (it.reset) it._fMisc.push("Is Resettable");
		if (it.routine) it._fMisc.push("Has Routine");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._levelFilter.addItem(it.level);
		if (it.stealth) {
			this._stealthDcFilter.addItem(it._fStealth);
			if (it.stealth.minProf) this._stealthMinProfFilter.addItem(it.stealth.minProf);
		}
		if (it._fAC != null) this._acFilter.addItem(it._fAC);
		if (it._fHardness != null) this._hardnessFilter.addItem(it._fHardness);
		if (it._fHP != null) this._hpFilter.addItem(it._fHP);
		if (it._fFort != null) this._fortFilter.addItem(it._fFort);
		if (it._fRef != null) this._refFilter.addItem(it._fRef);
		if (it._fWill != null) this._willFilter.addItem(it._fWill);
		if (it._fImmunities != null) this._immunitiesFilter.addItem(it._fImmunities);
		this._traitsFilter.addItem(it._fTraits);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._traitsFilter,
			this._stealthFilter,
			this._defenseFilter,
			this._immunitiesFilter,
			this._savingThrowFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.level,
			it._fTraits,
			[
				it._fStealth,
				it.stealth?.minProf,
			],
			[
				it._fAC,
				it._fHardness,
				it._fHP,
			],
			it._fImmunities,
			[
				it._fFort,
				it._fRef,
			],
			it._fMisc,
		)
	}
}
