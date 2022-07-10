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
			case "type": return SortUtil.ascSort(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
			case "school": return SortUtil.ascSort(a.values.school, b.values.school) || SortUtil.compareListNames(a, b);
			case "time": return SortUtil.ascSort(a.values.normalisedTime, b.values.normalisedTime) || SortUtil.compareListNames(a, b);
		}
	}

	static getFltrSpellLevelStr (level) {
		return `${Parser.spLevelToFull(level)} level`;
	}
	// endregion

	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._levelFilter = new Filter({
			header: "Level",
			items: [
				1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			],
			displayFn: PageFilterSpells.getFltrSpellLevelStr,
		});
		this._traditionFilter = new Filter({
			header: "Tradition & Spell List",
			items: [...Parser.TRADITIONS],
			itemSortFn: null,
		});
		this._spellTypeFilter = new Filter({
			header: "Spell Type",
			items: ["Focus", "Spell", "Cantrip"],
			itemSortFn: null,
		});
		this._classFilter = new Filter({header: "Class"});
		this._subClassFilter = new Filter({
			header: "Subclass",
			displayFn: (it) => it.toTitleCase(),
			nests: {},
		});
		this._domainFilter = new Filter({
			header: "Domains",
			displayFn: (it) => it.toTitleCase(),
			items: [],
		});
		this._multiFocusFilter = new MultiFilter({
			header: "Focus Spells",
			filters: [this._domainFilter, this._classFilter, this._subClassFilter],
		});
		this._componentsFilter = new Filter({
			header: "Components",
			items: ["Material", "Somatic", "Verbal", "Focus", "Cost"],
			itemSortFn: null,
		});
		this._areaFilter = new Filter({
			header: "Area Type",
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
			displayFn: it => it.toTitleCase(),
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Battle Form", "Has Requirements", "Has Targets", "Has Trigger", "Can be Heightened", "Can be Dismissed", "Sustained", "Summoning", "Grants Temporary Hit Points"],
		});
	}

	mutateForFilters (spell) {
		// used for sorting
		spell._normalisedTime = Parser.getNormalisedTime(spell.cast);
		spell._normalisedRange = Parser.getNormalisedRange(spell.range);
		spell._normalisedType = spell.traits.includes("cantrip") && spell.focus ? "FC" : spell.traits.includes("cantrip") ? "C" : spell.focus ? "F" : "S";

		// used for filtering
		spell._fSources = SourceFilter.getCompleteFilterSources(spell);
		spell._fTraditions = (spell.traditions || [])
			.concat(spell.spellLists || [])
			.concat(spell.traditions ? spell.traditions.includes("Primal" || "Arcane") ? "Halcyon" : [] : []).map(t => t.toTitleCase());
		spell._fSpellType = spell.traits.includes("cantrip") && spell.focus ? ["Focus", "Cantrip"] : spell.traits.includes("cantrip") ? ["Cantrip"] : spell.focus ? ["Focus"] : ["Spell"];
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
		this.handleTraitImplies(spell, { traitProp: "_fTraits", entityTypes: ["spell"] });
		spell._fSchool = (spell._fSchool || [])[0];
		spell._fTime = Parser.timeToActivityType(spell.cast);
		spell._fDurationType = Parser.getFilterDuration(spell);
		spell._areaTypes = spell.area ? spell.area.types : [];
		spell._fRange = Parser.getFilterRange(spell);
		if (spell.savingThrow) {
			if (spell.savingThrow.type) spell._fSavingThrow = spell.savingThrow.type.map(t => Parser.savingThrowAbvToFull(t))
			if (spell.savingThrow.basic) spell._fSavingThrow.push("Basic");
		}
		// TODO: Figure out how to make various configurations of components work in filters
		// Example: [V], [V and S], [V and S and M]
		// Right now we'll just live with this.
		spell._fComponents = [...new Set((spell.components || []).flat())];
		if (spell.cost != null) spell._fComponents.push("Cost");
		spell._fMisc = [];
		if (spell.requirements !== null) spell._fMisc.push("Has Requirements");
		if (spell.trigger !== null) spell._fMisc.push("Has Trigger");
		if (spell.targets !== null) spell._fMisc.push("Has Targets");
		if (spell.heightened) spell._fMisc.push("Can be Heightened");
		if (spell.duration && spell.duration.sustain) spell._fMisc.push("Sustained");
		if (spell.duration && spell.duration.dismiss) spell._fMisc.push("Can be Dismissed");
		if (spell.summoning) spell._fMisc.push("Summoning");
		if (spell.miscTags) {
			spell.miscTags.forEach(element => {
				switch (element) {
					case "THP": spell._fMisc.push("Grants Temporary Hit Points"); break;
					case "SM": spell._fMisc.push("Summoning"); break;
					case "BF": spell._fMisc.push("Has Battle Form"); break;
				}
			});
		}
		// "Possible Elementalist Spell" shenanigans, could be optimised?
		if (!spell._fTraditions.includes("Elemental")
		&& (spell.traits.some((trait) => trait.includes("Fire" || "Water" || "Earth" || "Air"))
		|| (spell._fTraditions.includes("Arcane") && spell._fTraditions.includes("Occult") && spell._fTraditions.includes("Primal") && spell._fTraditions.includes("Divine"))
		)) spell._fMisc.push("Possible Elementalist Spells");
	}

	addToFilters (spell, isExcluded) {
		if (isExcluded) return;

		if (spell.level > 10) this._levelFilter.addItem(spell.level);
		this._sourceFilter.addItem(spell._fSources);
		this._traditionFilter.addItem(spell._fTraditions);
		if (spell.spellLists) this._traditionFilter.addItem(spell.spellLists);
		if (spell._fSchool) this._schoolFilter.addItem(spell._fSchool);
		this._spellTypeFilter.addItem(spell._fSpellType);
		this._classFilter.addItem(spell._fClasses);
		this._domainFilter.addItem(spell.domains);
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
			this._spellTypeFilter,
			this._levelFilter,
			this._traditionFilter,
			this._schoolFilter,
			this._componentsFilter,
			this._timeFilter,
			this._durationFilter,
			this._areaFilter,
			this._rangeFilter,
			this._savingThrowFilter,
			this._multiFocusFilter,
			this._traitFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, s) {
		return this._filterBox.toDisplay(
			values,
			s._fSources,
			s._fSpellType,
			s.level,
			s._fTraditions,
			s._fSchool,
			s._fComponents,
			s._fTime,
			s._fDurationType,
			s._areaTypes,
			s._fRange,
			s._fSavingThrow,
			[
				s.domains,
				s._fClasses,
				s._fSubClasses,
			],
			s._fTraits,
			s._fMisc,
		)
	}
}
