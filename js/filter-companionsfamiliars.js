"use strict";

class PageFilterCompanionsFamiliars extends PageFilter {
	constructor () {
		super();
		this._typeFilter = new Filter({ header: "Type" });
		this._traitsFilter = new TraitsFilter({
			header: "Traits",
			filterOpts: {
				"Alignment": {
					displayFn: Parser.alignAbvToFull,
					itemSortFn: SortUtil.ascSort,
				},
			},
		});
		this._skillFilter = new Filter({ header: "Skills" });
		this._strengthFilter = new RangeFilter({ header: "Strength", min: -5, max: 5 });
		this._dexterityFilter = new RangeFilter({ header: "Dexterity", min: -5, max: 5 });
		this._constitutionFilter = new RangeFilter({ header: "Constitution", min: -5, max: 5 });
		this._intelligenceFilter = new RangeFilter({ header: "Intelligence", min: -5, max: 5 });
		this._wisdomFilter = new RangeFilter({ header: "Wisdom", min: -5, max: 5 });
		this._charismaFilter = new RangeFilter({ header: "Charisma", min: -5, max: 5 });
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
		this._requiredFilter = new RangeFilter({ header: "Required Number of Abilities" });
		this._grantedFilter = new Filter({ header: "Granted Abilities", displayFn: StrUtil.toTitleCase });
		this._traditionFilter = new Filter({ header: "Tradition", displayFn: StrUtil.toTitleCase });
		this._languageFilter = new Filter({ header: "Languages", displayFn: StrUtil.toTitleCase });
		this._preciseSenseFilter = new Filter({
			header: "Precise Senses",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._impreciseSenseFilter = new Filter({
			header: "Imprecise Senses",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._vagueSenseFilter = new Filter({
			header: "Vague Senses",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._otherSenseFilter = new Filter({
			header: "Other Senses",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._sensesFilter = new MultiFilter({
			header: "Senses",
			filters: [this._preciseSenseFilter, this._impreciseSenseFilter, this._vagueSenseFilter, this._otherSenseFilter],
		});
		this._miscFilter = new Filter({ header: "Miscellaneous" });
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fHP = it.hp != null ? it.hp : 0;
		it._fSpeedtypes = [];
		it._fSpeed = 0;
		if (it.speed) {
			Object.keys(it.speed).forEach((k) => {
				if (k !== "abilities") {
					it._fSpeed = Math.max(it.speed[k], it._fSpeed);
					it._fSpeedtypes.push(k)
				}
			});
		}
		it._fGranted = (it.granted || []).map(a => Renderer.stripTags(a));
		if (it.abilityMods) {
			it._fStr = it.abilityMods.Str;
			it._fDex = it.abilityMods.Dex;
			it._fCon = it.abilityMods.Con;
			it._fInt = it.abilityMods.Int;
			it._fWis = it.abilityMods.Wis;
			it._fCha = it.abilityMods.Cha;
		}
		if (it.stats) {
			it._fStr = Math.floor((Math.max(...it.stats.map(s => s.abilityMods.Str)) - 10) / 2);
			it._fDex = Math.floor((Math.max(...it.stats.map(s => s.abilityMods.Dex)) - 10) / 2);
			it._fCon = Math.floor((Math.max(...it.stats.map(s => s.abilityMods.Con)) - 10) / 2);
			it._fInt = Math.floor((Math.max(...it.stats.map(s => s.abilityMods.Int)) - 10) / 2);
			it._fWis = Math.floor((Math.max(...it.stats.map(s => s.abilityMods.Wis)) - 10) / 2);
			it._fCha = Math.floor((Math.max(...it.stats.map(s => s.abilityMods.Cha)) - 10) / 2);
		}
		it._fSenses = { precise: [], imprecise: [], vague: [], other: [] }
		if (it.senses) {
			it._fSenses.precise.push(...(it.senses.precise || []).map(s => Renderer.stripTags(s).replace(/\s(?:\d|\().+/, "")));
			it._fSenses.imprecise.push(...(it.senses.imprecise || []).map(s => Renderer.stripTags(s).replace(/\s(?:\d|\().+/, "").replace(/within.+/, "")));
			it._fSenses.vague.push(...(it.senses.vague || []).map(s => Renderer.stripTags(s).replace(/\s(?:\d|\().+/, "")));
			it._fSenses.other.push(...(it.senses.other || []).map(s => Renderer.stripTags(s).replace(/\s(?:\d|\().+/, "")));
		}
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it.type);
		if (it.traits) this._traitsFilter.addItem(it.traits);
		if (it.skill) this._skillFilter.addItem(it.skill);
		if (it.skills) this._skillFilter.addItem(it.skills);
		this._HPFilter.addItem(it._fHP);
		this._speedFilter.addItem(it._fSpeed);
		this._speedTypeFilter.addItem(it._fSpeedtypes);
		if (it.requires) this._requiredFilter.addItem(it.requires);
		this._grantedFilter.addItem(it._fGranted);
		if (it.tradition) this._traditionFilter.addItem(it.tradition);
		if (it.languages) this._languageFilter.addItem(it.languages);
		this._preciseSenseFilter.addItem(it._fSenses.precise);
		this._impreciseSenseFilter.addItem(it._fSenses.imprecise);
		this._vagueSenseFilter.addItem(it._fSenses.vague);
		this._otherSenseFilter.addItem(it._fSenses.other);
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
			this._traditionFilter,
			this._skillFilter,
			this._languageFilter,
			this._sensesFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.type,
			it.traits,
			[
				it._fStr,
				it._fDex,
				it._fCon,
				it._fInt,
				it._fWis,
				it._fCha,
			],
			it._fHP,
			[
				it._fSpeed,
				it._fSpeedtypes,
			],
			it.requires,
			it._fGranted,
			it.tradition,
			it.skills || [it.skill],
			it.languages,
			[
				it._fSenses.precise,
				it._fSenses.imprecise,
				it._fSenses.vague,
				it._fSenses.other,
			],
			it._fMisc,
		)
	}
}
