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
			isLabelled: true,
			labelSortFn: SortUtil.ascSort,
			labels: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
		});

		this._typeFilter = new Filter({
			header: "Creature Type",
		});
		this._alignmentFilter = new Filter({
			header: "Alignment",
			displayFn: Parser.creatureAlignToFull,
			itemSortFn: SortUtil.ascSort,
		});
		this._rarityFilter = new Filter({
			header: "Rarity",
			items: [...Parser.TRAITS_RARITY],
			itemSortFn: null,
		});
		this._sizeFilter = new Filter({
			header: "Size",
			items: [...Parser.TRAITS_SIZE],
			itemSortFn: null,
		});
		this._otherTraitsFilter = new Filter({
			header: "Other Traits",
		});
		this._traitFilter = new MultiFilter({
			header: "Traits",
			filters: [this._typeFilter, this._alignmentFilter, this._rarityFilter, this._sizeFilter, this._otherTraitsFilter],
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

	mutateForFilters (mon) {
		mon._fsenses = {precise: [], imprecise: [], vague: [], other: []}
		if (mon.senses) {
			mon.senses.precise.forEach((s) => {
				mon._fsenses.precise.push(s.replace(/\s(?:\d|\().+/, ""))
			});
			mon.senses.imprecise.forEach((s) => {
				mon._fsenses.imprecise.push(s.replace(/\s(?:\d|\().+/, ""))
			});
			mon.senses.vague.forEach((s) => {
				mon._fsenses.vague.push(s.replace(/\s(?:\d|\().+/, ""))
			});
			mon.senses.other.forEach((s) => {
				mon._fsenses.other.push(s.replace(/\s(?:\d|\().+/, ""))
			});
		}
		mon._flanguages = mon.languages == null ? [] : mon.languages.languages || [];
		mon._flanguages.forEach((l, i) => {
			mon._flanguages[i] = l.replace(/\s(?:\().+/, "")
		})
		mon._fskills = [];
		Object.keys(mon.skills).forEach((k) => {
			mon._fskills.push(k)
		})

		mon._fHP = 0
		mon.hit_points.forEach((d) => {
			mon._fHP += d.HP
		})

		mon._fimmunities = []
		if (mon.immunities) {
			mon.immunities.damage.forEach((i) => {
				mon._fimmunities.push(i.replace(/\s(?:\().+/, ""))
			})
			mon.immunities.condition.forEach((i) => {
				mon._fimmunities.push(i.replace(/\s(?:\().+/, ""))
			})
		}
		mon._fweaknesses = []
		if (mon.weaknesses) {
			mon.weaknesses.forEach((w) => {
				let ws = w.name.replace(/\s(?:\().+/, "");
				mon._fweaknesses.push(ws === "all" ? "all damage" : ws)
			});
		}
		mon._fresistances = []
		if (mon.resistances) {
			mon.resistances.forEach((r) => {
				let rs = r.name.replace(/\s(?:\().+/, "")
				mon._fresistances.push(rs === "all" ? "all damage" : rs)
			});
		}
		mon._fspeedtypes = []
		mon._fspeed = 0
		Object.keys(mon.speed).forEach((k) => {
			if (k !== "abilities") {
				mon._fspeed = Math.max(mon.speed[k], mon._fspeed);
				mon._fspeedtypes.push(k)
			}
		});

		mon._fspellTypes = []
		mon._fhighestSpell = 0
		mon._fspellDC = 0
		if (mon.spellcasting) {
			mon.spellcasting.forEach((f) => {
				if (f.type !== "Focus") {
					mon._fspellTypes.push(`${f.type} ${f.tradition}`)
				} else mon._fspellTypes.push(f.type)
				Object.keys(f.entry).forEach((k) => {
					if (k.isNumeric() && Number(k) > mon._fhighestSpell) mon._fhighestSpell = Number(k)
				});
				if (Number(f.DC) > mon._fspellDC) mon._fspellDC = Number(f.DC)
			});
		}
		mon._fritualTraditions = []
		if (mon.rituals != null) {
			mon.rituals.forEach((r) => {
				mon._fritualTraditions.push(r.tradition)
			});
		}
	}

	addToFilters (mon, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(mon.source);

		this._typeFilter.addItem(mon.creature_type);
		this._otherTraitsFilter.addItem(mon.traits);
		this._alignmentFilter.addItem(mon.alignment);

		this._perceptionFilter.addItem(mon.perception.default)
		this._preciseSenseFilter.addItem(mon._fsenses.precise);
		this._impreciseSenseFilter.addItem(mon._fsenses.imprecise);
		this._vagueSenseFilter.addItem(mon._fsenses.vague);
		this._otherSenseFilter.addItem(mon._fsenses.other);

		this._languageFilter.addItem(mon._flanguages);
		this._skillsFilter.addItem(mon._fskills)

		this._ACFilter.addItem(mon.armor_class.default)
		this._HPFilter.addItem(mon._fHP)
		this._fortitudeFilter.addItem(mon.saving_throws.Fort.default)
		this._reflexFilter.addItem(mon.saving_throws.Ref.default)
		this._willFilter.addItem(mon.saving_throws.Will.default)
		this._immunityFilter.addItem(mon._fimmunities)
		this._weaknessFilter.addItem(mon._fweaknesses)
		this._resistanceFilter.addItem(mon._fresistances)

		this._speedFilter.addItem(mon._fspeed)
		this._speedTypeFilter.addItem(mon._fspeedtypes)

		this._spelltpyeFilter.addItem(mon._fspellTypes)
		if (mon._fspellDC > 0) this._spellDCFilter.addItem(mon._fspellDC)
		if (mon._fhighestSpell > 0) this._highestSpellFilter.addItem(mon._fhighestSpell)
		this._ritualTraditionFilter.addItem(mon._fritualTraditions)
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

	toDisplay (values, m) {
		return this._filterBox.toDisplay(
			values,
			m.source,
			m.level,
			[
				m.creature_type,
				m.alignment,
				m.rarity,
				m.size,
				m.traits,
			],
			[
				m.perception.default,
				m._fsenses.precise,
				m._fsenses.imprecise,
				m._fsenses.vague,
				m._fsenses.other,
			],
			m._flanguages,
			m._fskills,
			[
				m.ability_modifiers.Str,
				m.ability_modifiers.Dex,
				m.ability_modifiers.Con,
				m.ability_modifiers.Int,
				m.ability_modifiers.Wis,
				m.ability_modifiers.Cha,
			],
			[
				m.armor_class.default,
				m._fHP,
				m.saving_throws.Fort.default,
				m.saving_throws.Ref.default,
				m.saving_throws.Will.default,
				m._fimmunities,
				m._fweaknesses,
				m._fresistances,
			],
			[
				m._fspeed,
				m._fspeedtypes,
			],
			[
				m._fspellTypes,
				m._fspellDC,
				m._fhighestSpell,
				m._fritualTraditions,
			],
		);
	}
}

class ModalFilterBestiary extends ModalFilter {
	constructor (namespace) {
		super({
			modalTitle: "Creatures",
			pageFilter: new PageFilterBestiary(),
			fnSort: PageFilterBestiary.sortCreatures,
			namespace: namespace,
		})
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "type", text: "Type", width: "4"},
			{sort: "level", text: "Level", width: "2"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await DataUtil.creature.pLoadAll();
		const fromBrew = brew.monster || [];
		return [...fromData, ...fromBrew];
	}

	_getListItem (pageFilter, mon, itI) {
		Renderer.creature.initParsed(mon);
		pageFilter.mutateAndAddToFilters(mon);

		const eleLi = document.createElement("li");
		eleLi.className = "row px-0";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
		const source = Parser.sourceJsonToAbv(mon.source);
		const type = mon._pTypes.asText.uppercaseFirst();
		const level = mon.level || "\u2014";

		eleLi.innerHTML = `<label class="lst--border no-select">
			<div class="lst__wrp-cells">
				<div class="col-1 pl-0 flex-vh-center"><input type="checkbox" class="no-events"></div>
				<div class="col-4 bold">${mon.name}</div>
				<div class="col-1 text-center ${Parser.sourceJsonToColor(mon.source)} pr-0" title="${Parser.sourceJsonToFull(mon.source)}" ${BrewUtil.sourceJsonToStyle(mon.source)}>${source}</div>
			</div>
		</label>`;

		return new ListItem(
			itI,
			eleLi,
			mon.name,
			{
				hash,
				source,
				sourceJson: mon.source,
				type,
				level,
			},
			{
				cbSel: eleLi.firstElementChild.firstElementChild.firstElementChild.firstElementChild,
			},
		);
	}
}
