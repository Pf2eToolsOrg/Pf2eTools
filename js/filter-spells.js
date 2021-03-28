"use strict";

if (typeof module !== "undefined") {
	const imports = require("./filter");
	Object.assign(global, imports);
}

class PageFilterSpells extends PageFilter {
	// region static
	static sortSpells (a, b, o) {
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "level": return SortUtil.ascSort(a.values.level, b.values.level) || SortUtil.compareListNames(a, b);
			case "school": return SortUtil.ascSort(a.values.school, b.values.school) || SortUtil.compareListNames(a, b);
			case "time": return SortUtil.ascSort(a.values.normalisedTime, b.values.normalisedTime) || SortUtil.compareListNames(a, b);
		}
	}

	static getFltrSpellLevelStr (level) {
		return level === 0 ? Parser.spLevelToFull(level) : `${Parser.spLevelToFull(level)} level`;
	}

	static getTblTimeStr (time) {
		return time.unit === `Varies` ? `Varies` : Parser.TIME_ACTIONS.includes(time.unit) ? `${Parser.TIME_TO_FULL[time.unit].uppercaseFirst()}`
			: `${time.number} ${time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
	}
	// endregion

	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._levelFilter = new Filter({
			header: "Level",
			items: [
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			],
			displayFn: PageFilterSpells.getFltrSpellLevelStr,
		});
		this._traditionFilter = new Filter({
			header: "Tradition",
			items: [...Parser.TRADITIONS],
			itemSortFn: null,
		});
		this._focusFilter = new Filter({
			header: "Spell Type",
			items: ["Focus Spell", "Spell"],
			itemSortFn: null,
		});
		this._classFilter = new Filter({header: "Classes"});
		this._domainFilter = new Filter({header: "Domains"})
		this._multiFocusFilter = new MultiFilter({
			header: "Focus Spells",
			filters: [this._focusFilter, this._classFilter, this._domainFilter],
		});
		this._componentsFilter = new Filter({
			header: "Components",
			items: ["Focus", "Material", "Somatic", "Verbal", "Cost"],
			itemSortFn: null,
		});
		this._savingThrowFilter = new Filter({
			header: "Saving Throw",
			items: ["Basic", "Fortitude", "Reflex", "Will"],
		});
		this._traitFilter = new TraitsFilter({header: "Traits",
			discardCategories: {
				Class: true,
				"Schools & Traditions": true,
			},
		});
		this._schoolFilter = new Filter({
			header: "School",
			items: [...Parser.SKL_ABVS],
			displayFn: Parser.spSchoolAbvToFull,
			itemSortFn: (a, b) => SortUtil.ascSortLower(Parser.spSchoolAbvToFull(a.item), Parser.spSchoolAbvToFull(b.item)),
		});
		this._areaFilter = new Filter({
			header: "Area Types",
		});
		this._timeFilter = new Filter({
			header: "Cast Time",
			items: [
				Parser.TM_A,
				Parser.TM_AA,
				Parser.TM_AAA,
				Parser.TM_F,
				Parser.TM_R,
				Parser.TM_ROUND,
				Parser.TM_MINS,
				Parser.TM_HRS,
				"Varies",
			],
			displayFn: Parser.timeUnitToFull,
			itemSortFn: null,
		});
		this._durationFilter = new RangeFilter({
			header: "Duration",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Instant", "1 Round", "1 Minute", "10 Minutes", "1 Hour", "8 Hours", "24+ Hours", "Unlimited", "Special"],
		});

		this._rangeFilter = new RangeFilter({
			header: "Range",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Touch", "5 feet", "10 feet", "25 feet", "50 feet", "100 feet", "500 feet", "1 mile", "Planetary", "Unlimited", "Varies"],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Requirements", "Has Trigger", "Can be Heightened", "Can be Dismissed", "Sustained"],
		});
	}

	mutateForFilters (spell) {
		// used for sorting
		spell._normalisedTime = Parser.getNormalisedTime(spell.cast);
		spell._normalisedRange = Parser.getNormalisedRange(spell.range);

		// used for filtering
		spell._fTraditions = spell.traditions ? spell.traditions : [];
		spell._fFocus = spell.focus ? ["Focus Spell"] : ["Spell"];
		spell._fClasses = spell.traits.filter(t => Renderer.trait._categoryLookup["Class"].includes(t)) || [];
		spell._fTraits = spell.traits.map(t => Parser.getTraitName(t));
		spell._fTimeType = [spell.cast["unit"]];
		spell._fDurationType = Parser.getFilterDuration(spell);
		spell._areaTypes = spell.area ? spell.area.types : [];
		spell._fRange = Parser.getFilterRange(spell);
		spell._fSavingThrow = spell.saving_throw == null ? [] : spell.saving_throw_basic ? [spell.saving_throw, "Basic"] : [spell.saving_throw];
		spell._fComponents = spell.cost == null ? [] : ["Cost"];
		if (spell.components.F) spell._fComponents.push("Focus");
		if (spell.components.M) spell._fComponents.push("Material");
		if (spell.components.S) spell._fComponents.push("Somatic");
		if (spell.components.V) spell._fComponents.push("Verbal");
		spell._fMisc = [];
		if (spell.requirements !== null) spell._fMisc.push("Has Requirements");
		if (spell.trigger !== null) spell._fMisc.push("Has Trigger");
		if (spell.heightened.heightened) spell._fMisc.push("Can be Heightened");
		if (spell.sustain) spell._fMisc.push("Sustained");
		if (spell.dismiss) spell._fMisc.push("Can be Dismissed");
	}

	addToFilters (spell, isExcluded) {
		if (isExcluded) return;

		if (spell.level > 10) this._levelFilter.addItem(spell.level);
		this._schoolFilter.addItem(spell.school);
		this._sourceFilter.addItem(spell.source);
		this._traditionFilter.addItem(spell._fTraditions);
		this._focusFilter.addItem(spell._fFocus);
		this._classFilter.addItem(spell._fClasses)
		if (typeof (spell.domain) === "string") this._domainFilter.addItem(spell.domain);
		this._traitFilter.addItem(spell._fTraits)
		this._areaFilter.addItem(spell._areaTypes)
		this._miscFilter.addItem(spell._fMisc)
	}

	async _pPopulateBoxOptions (opts) {
		await SourceUtil.pInitSubclassReprintLookup();

		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._traditionFilter,
			this._schoolFilter,
			this._componentsFilter,
			this._savingThrowFilter,
			this._multiFocusFilter,
			this._traitFilter,
			this._timeFilter,
			this._durationFilter,
			this._areaFilter,
			this._rangeFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, s) {
		return this._filterBox.toDisplay(
			values,
			s.source,
			s.level,
			s._fTraditions,
			s.school,
			s._fComponents,
			s._fSavingThrow,
			[
				s._fFocus,
				s._fClasses,
				s.domain,
			],
			s._fTraits,
			s._fTimeType,
			s._fDurationType,
			s._areaTypes,
			s._fRange,
			s._fMisc,
		)
	}
}

PageFilterSpells.INCHES_PER_FOOT = 12;
PageFilterSpells.FEET_PER_MILE = 5280;
