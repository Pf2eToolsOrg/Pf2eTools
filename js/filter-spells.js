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
		this._subClassFilter = new Filter({
			header: "Subclass",
			displayFn: (it) => it.toTitleCase(),
			nests: {},
		});
		this._multiFocusFilter = new MultiFilter({
			header: "Focus Spells",
			filters: [this._focusFilter, this._classFilter, this._subClassFilter],
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
			itemSortFn: SortUtil.sortActivities,
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
			items: ["Has Battle Form", "Has Requirements", "Has Trigger", "Can be Heightened", "Can be Dismissed", "Sustained"],
		});
	}

	mutateForFilters (spell) {
		// used for sorting
		spell._normalisedTime = Parser.getNormalisedTime(spell.cast);
		spell._normalisedRange = Parser.getNormalisedRange(spell.range);

		// used for filtering
		spell._fSources = SourceFilter.getCompleteFilterSources(spell);
		spell._fTraditions = spell.traditions ? spell.traditions : [];
		spell._fFocus = spell.focus ? ["Focus Spell"] : ["Spell"];
		spell._fTraits = spell.traits.map(t => Parser.getTraitName(t));
		if (!spell._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) spell._fTraits.push("Common");
		spell._fClasses = spell._fTraits.filter(t => Renderer.trait.isTraitInCategory(t, "Class")) || [];
		spell._fSubClasses = Object.entries(spell.subclass || {}).map(([k, v]) => {
			return v.map(sc => {
				const [cls, subCls] = k.split("|")
				return new FilterItem({
					item: sc,
					nest: `${subCls} (${cls})`,
				});
			});
		}).flat();
		spell._fTime = Parser.timeToActivityType(spell.activity);
		spell._fDurationType = Parser.getFilterDuration(spell);
		spell._areaTypes = spell.area ? spell.area.types : [];
		spell._fRange = Parser.getFilterRange(spell);
		spell._fSavingThrow = spell.savingThrow == null ? [] : spell.savingThrowBasic ? [spell.savingThrow, "Basic"] : [spell.savingThrow];
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
		if (spell.hasBattleForm) spell._fMisc.push("Has Battle Form");
	}

	addToFilters (spell, isExcluded) {
		if (isExcluded) return;

		if (spell.level > 10) this._levelFilter.addItem(spell.level);
		this._schoolFilter.addItem(spell.school);
		this._sourceFilter.addItem(spell._fSources);
		this._traditionFilter.addItem(spell._fTraditions);
		this._focusFilter.addItem(spell._fFocus);
		this._classFilter.addItem(spell._fClasses);
		spell._fSubClasses.forEach(sc => {
			this._subClassFilter.addNest(sc.nest, {isHidden: true});
			this._subClassFilter.addItem(sc);
		});
		this._traitFilter.addItem(spell._fTraits);
		if (spell._fTime != null) this._timeFilter.addItem(spell._fTime);
		this._areaFilter.addItem(spell._areaTypes);
		this._miscFilter.addItem(spell._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
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
			s._fSources,
			s.level,
			s._fTraditions,
			s.school,
			s._fComponents,
			s._fSavingThrow,
			[
				s._fFocus,
				s._fClasses,
				s._fSubClasses,
			],
			s._fTraits,
			s._fTime,
			s._fDurationType,
			s._areaTypes,
			s._fRange,
			s._fMisc,
		)
	}
}

PageFilterSpells.INCHES_PER_FOOT = 12;
PageFilterSpells.FEET_PER_MILE = 5280;
