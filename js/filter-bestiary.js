"use strict";

class PageFilterBestiary extends PageFilter {
	// region static
	static sortCreatures (a, b, o) {
		if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
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
			filterOpts: {
				"Alignment": {
					displayFn: Parser.creatureAlignToFull,
					itemSortFn: SortUtil.ascSort,
				},
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

		this._strengthFilter = new RangeFilter({header: "Strength"});
		this._dexterityFilter = new RangeFilter({header: "Dexterity"});
		this._constitutionFilter = new RangeFilter({header: "Constitution"});
		this._intelligenceFilter = new RangeFilter({header: "Intelligence"});
		this._wisdomFilter = new RangeFilter({header: "Wisdom"});
		this._charismaFilter = new RangeFilter({header: "Charisma"});
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

		this._spelltpyeFilter = new Filter({
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
			filters: [this._spelltpyeFilter, this._spellDCFilter, this._highestSpellFilter, this._ritualTraditionFilter],
		});
	}

	mutateForFilters (cr) {
		cr._fSources = SourceFilter.getCompleteFilterSources(cr);
		cr._fTraits = [];
		if (cr.rarity != null && cr.rarity !== "Common") cr._fTraits.push(cr.rarity);
		if (cr.alignment != null) cr._fTraits.push(cr.alignment);
		if (cr.size != null) cr._fTraits.push(cr.size);
		if (cr.traits != null && cr.traits.length) cr._fTraits.push(...cr.traits);
		if (cr.creatureType != null) cr._fTraits.push(...cr.creatureType);
		cr._fsenses = {precise: [], imprecise: [], vague: [], other: []}
		if (cr.senses) {
			cr.senses.precise.forEach((s) => {
				cr._fsenses.precise.push(s.replace(/\s(?:\d|\().+/, ""));
			});
			cr.senses.imprecise.forEach((s) => {
				cr._fsenses.imprecise.push(s.replace(/\s(?:\d|\().+/, "").replace(/within.+/, ""));
			});
			cr.senses.vague.forEach((s) => {
				cr._fsenses.vague.push(s.replace(/\s(?:\d|\().+/, ""));
			});
			cr.senses.other.forEach((s) => {
				cr._fsenses.other.push(s.replace(/\s(?:\d|\().+/, ""));
			});
		}
		cr._flanguages = cr.languages == null ? [] : cr.languages.languages || [];
		cr._flanguages = cr._flanguages.map(l => l.replace(/\s(?:\().+/, "")).filter(l => !l.includes(" "));
		cr._fskills = new Set();
		Object.keys(cr.skills).forEach((k) => {
			if (k.match(/lore/i)) cr._fskills.add("Lore");
			else cr._fskills.add(k);
		});
		cr._fskills = Array.from(cr._fskills);

		cr._fHP = 0;
		cr.hp.forEach((d) => {
			cr._fHP += d.hp;
		})

		cr._fimmunities = [];
		if (cr.immunities) {
			cr.immunities.damage.forEach((i) => {
				cr._fimmunities.push(i.replace(/\s(?:\().+/, ""));
			})
			cr.immunities.condition.forEach((i) => {
				cr._fimmunities.push(i.replace(/\s(?:\().+/, ""));
			})
		}
		cr._fweaknesses = [];
		if (cr.weaknesses) {
			cr.weaknesses.forEach((w) => {
				let ws = w.name.replace(/\s(?:\().+/, "");
				cr._fweaknesses.push(ws === "all" ? "all damage" : ws);
			});
		}
		cr._fresistances = [];
		if (cr.resistances) {
			cr.resistances.forEach((r) => {
				let rs = r.name.replace(/\s(?:\().+/, "");
				cr._fresistances.push(rs === "all" ? "all damage" : rs);
			});
		}
		cr._fspeedtypes = [];
		cr._fspeed = 0;
		Object.keys(cr.speed).forEach((k) => {
			if (k !== "abilities") {
				cr._fspeed = Math.max(cr.speed[k], cr._fspeed);
				cr._fspeedtypes.push(k);
			}
		});

		cr._fspellTypes = [];
		cr._fhighestSpell = 0;
		cr._fspellDC = 0;
		if (cr.spellcasting) {
			cr.spellcasting.forEach((f) => {
				if (f.type !== "Focus") {
					cr._fspellTypes.push(`${f.type} ${f.tradition}`)
				} else cr._fspellTypes.push(f.type)
				Object.keys(f.entry).forEach((k) => {
					if (k.isNumeric() && Number(k) > cr._fhighestSpell) cr._fhighestSpell = Number(k)
				});
				if (Number(f.DC) > cr._fspellDC) cr._fspellDC = Number(f.DC)
			});
		}
		cr._fritualTraditions = []
		if (cr.rituals != null) {
			cr.rituals.forEach((r) => {
				cr._fritualTraditions.push(r.tradition)
			});
		}

		this.handleTraitImplies(cr, {traitProp: "_fTraits", entityTypes: ["creature"]});
		cr._fTraits = cr._fTraits.map(t => Parser.getTraitName(t));
		if (!cr._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) cr._fTraits.push("Common");
	}

	addToFilters (cr, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(cr._fSources);

		this._traitFilter.addItem(cr._fTraits);
		this._strengthFilter.addItem(cr.abilityMods.Str);
		this._constitutionFilter.addItem(cr.abilityMods.Con);
		this._dexterityFilter.addItem(cr.abilityMods.Dex);
		this._intelligenceFilter.addItem(cr.abilityMods.Int);
		this._wisdomFilter.addItem(cr.abilityMods.Wis);
		this._charismaFilter.addItem(cr.abilityMods.Cha);

		this._perceptionFilter.addItem(cr.perception.default)
		this._preciseSenseFilter.addItem(cr._fsenses.precise);
		this._impreciseSenseFilter.addItem(cr._fsenses.imprecise);
		this._vagueSenseFilter.addItem(cr._fsenses.vague);
		this._otherSenseFilter.addItem(cr._fsenses.other);

		this._languageFilter.addItem(cr._flanguages);
		this._skillsFilter.addItem(cr._fskills)

		this._ACFilter.addItem(cr.ac.default)
		this._HPFilter.addItem(cr._fHP)
		this._fortitudeFilter.addItem(cr.savingThrows.Fort.default)
		this._reflexFilter.addItem(cr.savingThrows.Ref.default)
		this._willFilter.addItem(cr.savingThrows.Will.default)
		this._immunityFilter.addItem(cr._fimmunities)
		this._weaknessFilter.addItem(cr._fweaknesses)
		this._resistanceFilter.addItem(cr._fresistances)

		this._speedFilter.addItem(cr._fspeed)
		this._speedTypeFilter.addItem(cr._fspeedtypes)

		this._spelltpyeFilter.addItem(cr._fspellTypes)
		if (cr._fspellDC > 0) this._spellDCFilter.addItem(cr._fspellDC)
		if (cr._fhighestSpell > 0) this._highestSpellFilter.addItem(cr._fhighestSpell)
		this._ritualTraditionFilter.addItem(cr._fritualTraditions)
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
		];
	}

	toDisplay (values, c) {
		return this._filterBox.toDisplay(
			values,
			c._fSources,
			c.level,
			c._fTraits,
			[
				c.perception.default,
				c._fsenses.precise,
				c._fsenses.imprecise,
				c._fsenses.vague,
				c._fsenses.other,
			],
			c._flanguages,
			c._fskills,
			[
				c.abilityMods.Str,
				c.abilityMods.Dex,
				c.abilityMods.Con,
				c.abilityMods.Int,
				c.abilityMods.Wis,
				c.abilityMods.Cha,
			],
			[
				c.ac.default,
				c._fHP,
				c.savingThrows.Fort.default,
				c.savingThrows.Ref.default,
				c.savingThrows.Will.default,
				c._fimmunities,
				c._fweaknesses,
				c._fresistances,
			],
			[
				c._fspeed,
				c._fspeedtypes,
			],
			[
				c._fspellTypes,
				c._fspellDC,
				c._fhighestSpell,
				c._fritualTraditions,
			],
		);
	}
}
