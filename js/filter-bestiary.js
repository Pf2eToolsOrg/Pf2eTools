"use strict";

class PageFilterBestiary extends PageFilter {
	// region static
	static sortCreatures (a, b, o) {
		if (o.sortBy === "count") return SortUtil.ascSort(a.data.count, b.data.count) || SortUtil.compareListNames(a, b);
		switch (o.sortBy) {
			case "name":
				return SortUtil.compareListNames(a, b);
			case "source":
				return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "type":
				return SortUtil.ascSort(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
			case "level":
				return SortUtil.ascSortLvl(a.values.level, b.values.level) || SortUtil.compareListNames(a, b);
		}
	}

	// endregion

	constructor () {
		super();

		this._levelFilter = new RangeFilter({
			header: "Level",
			min: -1,
			max: 25,
		});
		this._traitFilter = new TraitsFilter({
			header: "Traits",
			discardCategories: {
				"Ancestry & Heritage": true,
			},
		});
		this._perceptionFilter = new RangeFilter({
			header: "Perception",
		});
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
			header: "Perception and Senses",
			filters: [this._perceptionFilter, this._preciseSenseFilter, this._impreciseSenseFilter, this._vagueSenseFilter, this._otherSenseFilter],
		});

		this._languageFilter = new Filter({
			header: "Languages",
		});

		this._skillsFilter = new Filter({
			header: "Skills",
			itemSortFn: SortUtil.ascSort,
		});

		this._strengthFilter = new RangeFilter({ header: "Strength" });
		this._dexterityFilter = new RangeFilter({ header: "Dexterity" });
		this._constitutionFilter = new RangeFilter({ header: "Constitution" });
		this._intelligenceFilter = new RangeFilter({ header: "Intelligence" });
		this._wisdomFilter = new RangeFilter({ header: "Wisdom" });
		this._charismaFilter = new RangeFilter({ header: "Charisma" });
		this._abilityFilter = new MultiFilter({
			header: "Ability Modifiers",
			filters: [this._strengthFilter, this._dexterityFilter, this._constitutionFilter, this._intelligenceFilter, this._wisdomFilter, this._charismaFilter],
		});

		this._ACFilter = new RangeFilter({
			header: "Armor Class",
			min: 10,
		});
		this._HPFilter = new RangeFilter({
			header: "Hit Points",
			min: 5,
		});
		this._fortitudeFilter = new RangeFilter({
			header: "Fortitude",
			min: 2,
		});
		this._reflexFilter = new RangeFilter({
			header: "Reflex",
			min: 2,
		});
		this._willFilter = new RangeFilter({
			header: "Will",
			min: 2,
		});
		this._immunityFilter = new Filter({
			header: "Immunities",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._weaknessFilter = new Filter({
			header: "Weaknesses",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._resistanceFilter = new Filter({
			header: "Resistances",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._defenseFilter = new MultiFilter({
			header: "Defenses",
			filters: [this._ACFilter, this._HPFilter, this._fortitudeFilter, this._reflexFilter, this._willFilter, this._immunityFilter, this._weaknessFilter, this._resistanceFilter],
		});

		this._speedFilter = new RangeFilter({
			header: "Speed",
			min: 5,
		});
		this._speedTypeFilter = new Filter({
			header: "Speed Types",
			displayFn: (x) => x.uppercaseFirst(),
		});
		this._speedMultiFilter = new MultiFilter({
			header: "Speeds",
			filters: [this._speedFilter, this._speedTypeFilter],
		});

		this._spelltypeFilter = new Filter({
			header: "Spellcasting Type",
			itemSortFn: SortUtil.ascSort,
		});
		this._spellDCFilter = new RangeFilter({
			header: "Spell DC",
		});
		this._highestSpellFilter = new RangeFilter({
			header: "Highest Spell Level",
			min: 0,
			max: 10,
			isLabelled: true,
		});
		this._ritualTraditionFilter = new Filter({
			header: "Ritual Traditions",
			itemSortFn: SortUtil.ascSort,
		});
		this._spellcastingFilter = new MultiFilter({
			header: "Spellcasting",
			filters: [this._spelltypeFilter, this._spellDCFilter, this._highestSpellFilter, this._ritualTraditionFilter],
		});

		this._foundInFilter = new Filter({
			header: "Found In",
			itemSortFn: SortUtil.ascSort,
		});

		this._miscellaneousFilter = new Filter({
			header: "Miscellaneous",
			itemSortFn: SortUtil.ascSort,
		});
	}

	mutateForFilters (cr) {
		cr._fMisc = [];
		if (cr.hasImages) cr._fMisc.push("Has Images");
		if (cr.isNpc) cr._fMisc.push("NPC");
		cr._fSources = SourceFilter.getCompleteFilterSources(cr);
		cr._fTraits = [...(cr.traits || [])];
		cr._fSenses = { precise: [], imprecise: [], vague: [], other: [] };
		if (cr.senses && cr.senses.length) {
			cr.senses.forEach(s => {
				// .replace(/within.+/, "")
				cr._fSenses[s.type || "other"].push(Renderer.stripTags(s.name))
			})
		}
		cr._flanguages = cr.languages == null ? [] : cr.languages.languages || [];
		cr._flanguages = cr._flanguages.map(l => l.replace(/\s\(.+/, "")).filter(l => !l.includes(" ")).map(l => l.toTitleCase());
		cr._fskills = new Set();
		if (cr.skills) {
			Object.keys(cr.skills).forEach((k) => {
				if (k.match(/lore/i)) cr._fskills.add("Lore");
				else cr._fskills.add(k);
			})
		}
		cr._fskills = Array.from(cr._fskills);

		cr._fHP = 0;
		cr.defenses.hp.forEach((d) => {
			cr._fHP += d.hp;
		})

		cr._fResistances = cr.defenses.resistances ? cr.defenses.resistances.map(r => r.name === "all" ? "all damage" : r.name) : [];
		cr._fWeaknesses = cr.defenses.weaknesses ? cr.defenses.weaknesses.map(w => w.name === "all" ? "all damage" : w.name) : [];
		cr._fSpeedtypes = [];
		cr._fSpeed = 0;
		Object.keys(cr.speed).forEach((k) => {
			if (k !== "abilities" && k !== "speedNote") {
				cr._fSpeed = Math.max(cr.speed[k], cr._fSpeed);
				cr._fSpeedtypes.push(k);
			}
		});

		cr._fSpellTypes = [];
		cr._fHighestSpell = 0;
		cr._fSpellDC = 0;
		if (cr.spellcasting) {
			cr.spellcasting.forEach((f) => {
				if (f.type !== "Focus") {
					cr._fSpellTypes.push(`${f.type} ${f.tradition}`)
				} else cr._fSpellTypes.push(f.type)
				Object.keys(f.entry).forEach((k) => {
					if (k.isNumeric() && Number(k) > cr._fHighestSpell) cr._fHighestSpell = Number(k)
				});
				if (Number(f.DC) > cr._fSpellDC) cr._fSpellDC = Number(f.DC)
			});
		}
		cr._fRitualTraditions = []
		if (cr.rituals != null) {
			cr.rituals.forEach((r) => {
				cr._fRitualTraditions.push(r.tradition)
			});
		}
		cr._fCreatureType = []

		this.handleTraitImplies(cr, { traitProp: "_fTraits", entityTypes: ["creature"] });
		cr._fTraits = cr._fTraits.map(t => Parser.getTraitName(t));
		if (!cr._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) cr._fTraits.push("Common");
		cr._fCreatureType = cr._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Creature Type") ? t : null).filter(Boolean);

		cr._fFoundIn = cr.foundIn || [];
	}

	addToFilters (cr, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(cr._fSources);

		this._traitFilter.addItem(cr._fTraits);
		this._strengthFilter.addItem(cr.abilityMods.str);
		this._constitutionFilter.addItem(cr.abilityMods.con);
		this._dexterityFilter.addItem(cr.abilityMods.dex);
		this._intelligenceFilter.addItem(cr.abilityMods.int);
		this._wisdomFilter.addItem(cr.abilityMods.wis);
		this._charismaFilter.addItem(cr.abilityMods.cha);

		this._perceptionFilter.addItem(cr.perception.std);
		this._preciseSenseFilter.addItem(cr._fSenses.precise);
		this._impreciseSenseFilter.addItem(cr._fSenses.imprecise);
		this._vagueSenseFilter.addItem(cr._fSenses.vague);
		this._otherSenseFilter.addItem(cr._fSenses.other);

		this._languageFilter.addItem(cr._flanguages);
		this._skillsFilter.addItem(cr._fskills);

		this._ACFilter.addItem(cr.defenses.ac.std);
		this._HPFilter.addItem(cr._fHP);
		this._fortitudeFilter.addItem(cr.defenses.savingThrows.fort.std);
		this._reflexFilter.addItem(cr.defenses.savingThrows.ref.std);
		this._willFilter.addItem(cr.defenses.savingThrows.will.std);
		this._immunityFilter.addItem(cr.defenses.immunities);
		this._weaknessFilter.addItem(cr._fWeaknesses);
		this._resistanceFilter.addItem(cr._fResistances);

		this._speedFilter.addItem(cr._fSpeed);
		this._speedTypeFilter.addItem(cr._fSpeedtypes);

		this._spelltypeFilter.addItem(cr._fSpellTypes);
		if (cr._fSpellDC > 0) this._spellDCFilter.addItem(cr._fSpellDC);
		if (cr._fHighestSpell > 0) this._highestSpellFilter.addItem(cr._fHighestSpell);
		this._ritualTraditionFilter.addItem(cr._fRitualTraditions);

		this._foundInFilter.addItem(cr._fFoundIn);
		this._miscellaneousFilter.addItem(cr._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._traitFilter,
			this._sensesFilter,
			this._languageFilter,
			this._skillsFilter,
			this._abilityFilter,
			this._defenseFilter,
			this._speedMultiFilter,
			this._spellcastingFilter,
			this._foundInFilter,
			this._miscellaneousFilter,
		];
	}

	toDisplay (values, c) {
		return this._filterBox.toDisplay(
			values,
			c._fSources,
			c.level,
			c._fTraits,
			[
				c.perception.std,
				c._fSenses.precise,
				c._fSenses.imprecise,
				c._fSenses.vague,
				c._fSenses.other,
			],
			c._flanguages,
			c._fskills,
			[
				c.abilityMods.str,
				c.abilityMods.dex,
				c.abilityMods.con,
				c.abilityMods.int,
				c.abilityMods.wis,
				c.abilityMods.cha,
			],
			[
				c.defenses.ac.std,
				c._fHP,
				c.defenses.savingThrows.fort.std,
				c.defenses.savingThrows.ref.std,
				c.defenses.savingThrows.will.std,
				c.defenses.immunities,
				c._fWeaknesses,
				c._fResistances,
			],
			[
				c._fSpeed,
				c._fSpeedtypes,
			],
			[
				c._fSpellTypes,
				c._fSpellDC,
				c._fHighestSpell,
				c._fRitualTraditions,
			],
			c._fFoundIn,
			c._fMisc,
		);
	}
}
