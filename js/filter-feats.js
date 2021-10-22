"use strict";

class PageFilterFeats extends PageFilter {
	// region static
	// endregion

	constructor (opts) {
		super();
		opts = opts || {};
		this._levelFilter = new RangeFilter({
			header: "Level",
			min: 1,
			max: 20,
			isLabelled: true,
		});
		this._typeFilter = new Filter({header: "Type", selFn: opts.typeDeselFn})
		this._traitsFilter = new TraitsFilter({
			header: "Traits",
			discardCategories: {
				Class: true,
				"Ancestry & Heritage": true,
				"Archetype": true,
				Creature: true,
				"Creature Type": true,
			},
		});
		this._ancestryFilter = new Filter({header: "Ancestries"})
		this._archetypeFilter = new Filter({header: "Archetypes", items: ["Archetype"]})
		this._classFilter = new Filter({header: "Classes"})
		this._skillFilter = new Filter({header: "Skills"})
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Trigger", "Has Frequency", "Has Prerequisites", "Has Requirements", "Has Cost", "Has Special", "Leads to...", "Variant"],
			deselFn: (it) => it === "Variant",
		});
		this._timeFilter = new Filter({
			header: "Activity",
			itemSortFn: SortUtil.sortActivities,
		});
	}

	mutateForFilters (feat) {
		feat._fSources = SourceFilter.getCompleteFilterSources(feat);
		feat._slPrereq = Renderer.stripTags(feat.prerequisites || `\u2014`).uppercaseFirst();
		feat._fTraits = feat.traits.map(t => Parser.getTraitName(t));
		if (!feat._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) feat._fTraits.push("Common");
		feat._fType = [];
		if (feat.featType == null) feat.featType = {};
		if (feat.featType.class !== false && feat.featType.class != null) {
			feat._fType.push("Class");
		}
		if (feat.featType.ancestry !== false && feat.featType.ancestry != null) {
			feat._fType.push("Ancestry");
		}
		if (feat.featType.general !== false && feat.featType.general != null) {
			feat._fType.push("General");
		}
		if (feat.featType.skill !== false && feat.featType.skill != null) {
			feat._fType.push("Skill");
		}
		if (feat.featType.archetype !== false && feat.featType.archetype != null) {
			feat._fType.push("Archetype");
		}
		feat._slType = MiscUtil.copy(feat._fType);
		if (feat._slType.includes("Skill") && feat._slType.includes("General")) feat._slType.splice(feat._slType.indexOf("General"), 1);
		feat._slType = feat._slType.sort(SortUtil.ascSort).join(", ")
		feat._fTime = Parser.timeToActivityType(feat.activity);
		feat._fMisc = [];
		if (feat.prerequisites != null) feat._fMisc.push("Has Prerequisites");
		if (feat.trigger != null) feat._fMisc.push("Has Trigger");
		if (feat.frequency != null) feat._fMisc.push("Has Frequency");
		if (feat.requirements != null) feat._fMisc.push("Has Requirements");
		if (feat.cost != null) feat._fMisc.push("Has Cost");
		if (feat.special != null) feat._fMisc.push("Has Special");
		if (feat.leadsTo && feat.leadsTo.length) feat._fMisc.push("Leads to...")
		if (feat.featType.variant === true) feat._fMisc.push("Variant")
	}

	addToFilters (feat, isExcluded) {
		if (isExcluded) return;

		this._typeFilter.addItem(feat._fType);
		this._traitsFilter.addItem(feat._fTraits);
		if (typeof (feat.featType.ancestry) !== "boolean") this._ancestryFilter.addItem(feat.featType.ancestry);
		if (typeof (feat.featType.archetype) !== "boolean") this._archetypeFilter.addItem(feat.featType.archetype);
		if (typeof (feat.featType.class) !== "boolean") this._classFilter.addItem(feat.featType.class);
		if (typeof (feat.featType.skill) !== "boolean") this._skillFilter.addItem(feat.featType.skill);
		if (feat._fTime != null) this._timeFilter.addItem(feat._fTime);
		this._sourceFilter.addItem(feat._fSources);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._levelFilter,
			this._ancestryFilter,
			this._archetypeFilter,
			this._classFilter,
			this._skillFilter,
			this._timeFilter,
			this._traitsFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, ft) {
		return this._filterBox.toDisplay(
			values,
			ft._fSources,
			ft._fType,
			ft.level,
			ft.featType.ancestry,
			// FIXME Change line below
			ft.featType.archetype === true ? "Archetype" : ft.featType.archetype,
			ft.featType.class,
			ft.featType.skill,
			ft._fTime,
			ft._fTraits,
			ft._fMisc,
		)
	}
}
