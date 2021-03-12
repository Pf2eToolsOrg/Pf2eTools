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
			itemSortFn: SortUtil.monSkillSort,
		});

		this._strengthFilter = new RangeFilter({header: "Strength", min: -5, max: 12});
		this._dexterityFilter = new RangeFilter({header: "Dexterity", min: -5, max: 12});
		this._constitutionFilter = new RangeFilter({header: "Constitution", min: -5, max: 12});
		this._intelligenceFilter = new RangeFilter({header: "Intelligence", min: -5, max: 12});
		this._wisdomFilter = new RangeFilter({header: "Wisdom", min: -5, max: 12});
		this._charismaFilter = new RangeFilter({header: "Charisma", min: -5, max: 12});
		this._abilityFilter = new MultiFilter({
			header: "Ability Modifiers",
			filters: [this._strengthFilter, this._dexterityFilter, this._constitutionFilter, this._intelligenceFilter, this._wisdomFilter, this._charismaFilter],
		});

		this._ACFilter = new RangeFilter({
			header: "Armor Class",
		});
		this._HPFilter = new RangeFilter({
			header: "Hit Points",
		});
		this._fortitudeFilter = new RangeFilter({
			header: "Fortitude",
		});
		this._reflexFilter = new RangeFilter({
			header: "Reflex",
		});
		this._willFilter = new RangeFilter({
			header: "Will",
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
		cr._fTraits = cr.traits.concat([cr.size]).concat([cr.alignment]).concat(cr.creature_type).concat([cr.rarity]).map(t => Parser.getTraitName(t));
		cr._fsenses = {precise: [], imprecise: [], vague: [], other: []}
		if (cr.senses) {
			cr.senses.precise.forEach((s) => {
				cr._fsenses.precise.push(s.replace(/\s(?:\d|\().+/, ""))
			});
			cr.senses.imprecise.forEach((s) => {
				cr._fsenses.imprecise.push(s.replace(/\s(?:\d|\().+/, ""))
			});
			cr.senses.vague.forEach((s) => {
				cr._fsenses.vague.push(s.replace(/\s(?:\d|\().+/, ""))
			});
			cr.senses.other.forEach((s) => {
				cr._fsenses.other.push(s.replace(/\s(?:\d|\().+/, ""))
			});
		}
		cr._flanguages = cr.languages == null ? [] : cr.languages.languages || [];
		cr._flanguages.forEach((l, i) => {
			cr._flanguages[i] = l.replace(/\s(?:\().+/, "")
		})
		cr._fskills = [];
		Object.keys(cr.skills).forEach((k) => {
			cr._fskills.push(k)
		})

		cr._fHP = 0
		cr.hit_points.forEach((d) => {
			cr._fHP += d.HP
		})

		cr._fimmunities = []
		if (cr.immunities) {
			cr.immunities.damage.forEach((i) => {
				cr._fimmunities.push(i.replace(/\s(?:\().+/, ""))
			})
			cr.immunities.condition.forEach((i) => {
				cr._fimmunities.push(i.replace(/\s(?:\().+/, ""))
			})
		}
		cr._fweaknesses = []
		if (cr.weaknesses) {
			cr.weaknesses.forEach((w) => {
				let ws = w.name.replace(/\s(?:\().+/, "");
				cr._fweaknesses.push(ws === "all" ? "all damage" : ws)
			});
		}
		cr._fresistances = []
		if (cr.resistances) {
			cr.resistances.forEach((r) => {
				let rs = r.name.replace(/\s(?:\().+/, "")
				cr._fresistances.push(rs === "all" ? "all damage" : rs)
			});
		}
		cr._fspeedtypes = []
		cr._fspeed = 0
		Object.keys(cr.speed).forEach((k) => {
			if (k !== "abilities") {
				cr._fspeed = Math.max(cr.speed[k], cr._fspeed);
				cr._fspeedtypes.push(k)
			}
		});

		cr._fspellTypes = []
		cr._fhighestSpell = 0
		cr._fspellDC = 0
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
	}

	addToFilters (cr, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(cr.source);

		this._traitFilter.addItem(cr._fTraits)

		this._perceptionFilter.addItem(cr.perception.default)
		this._preciseSenseFilter.addItem(cr._fsenses.precise);
		this._impreciseSenseFilter.addItem(cr._fsenses.imprecise);
		this._vagueSenseFilter.addItem(cr._fsenses.vague);
		this._otherSenseFilter.addItem(cr._fsenses.other);

		this._languageFilter.addItem(cr._flanguages);
		this._skillsFilter.addItem(cr._fskills)

		this._ACFilter.addItem(cr.armor_class.default)
		this._HPFilter.addItem(cr._fHP)
		this._fortitudeFilter.addItem(cr.saving_throws.Fort.default)
		this._reflexFilter.addItem(cr.saving_throws.Ref.default)
		this._willFilter.addItem(cr.saving_throws.Will.default)
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
			c.source,
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
				c.ability_modifiers.Str,
				c.ability_modifiers.Dex,
				c.ability_modifiers.Con,
				c.ability_modifiers.Int,
				c.ability_modifiers.Wis,
				c.ability_modifiers.Cha,
			],
			[
				c.armor_class.default,
				c._fHP,
				c.saving_throws.Fort.default,
				c.saving_throws.Ref.default,
				c.saving_throws.Will.default,
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
