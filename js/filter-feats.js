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
		this._typeFilter = new Filter({header: "Type", isHiddenFilter: !!opts.typeFilterHidden, selFn: opts.typeDeselFn})
		this._traitsFilter = new TraitsFilter({
			header: "Traits",
			discardCategories: {
				Class: true,
				Ancestry: true,
				Creature: true,
				"Creature Type": true,
			},
		});
		this._ancestryFilter = new Filter({header: "Ancestries", isHiddenFilter: !!opts.ancFilterHidden})
		this._archetypeFilter = new Filter({header: "Archetypes", isHiddenFilter: !!opts.archFilterHidden})
		this._classFilter = new Filter({header: "Classes", isHiddenFilter: !!opts.classFilterHidden})
		this._skillFilter = new Filter({header: "Skills", isHiddenFilter: !!opts.skillFilterHidden})
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Trigger", "Has Frequency", "Has Prerequisites", "Has Requirements", "Has Cost", "Has Special"],
		});
		this._timeFilter = new Filter({
			header: "Activity",
			items: [
				Parser.TM_A,
				Parser.TM_AA,
				Parser.TM_AAA,
				Parser.TM_F,
				Parser.TM_R,
			],
			displayFn: Parser.timeUnitToFull,
			itemSortFn: null,
		});
	}

	mutateForFilters (feat) {
		feat._slPrereq = (feat.prerequisites || `\u2014`).uppercaseFirst();
		feat._fType = [];
		if (feat.featType.class !== false) {
			feat._slType = "Class";
			feat._fType.push("Class");
		}
		if (feat.featType.ancestry !== false) {
			feat._slType = "Ancestry";
			feat._fType.push("Ancestry");
		}
		if (feat.featType.general !== false) {
			feat._slType = "General";
			feat._fType.push("General");
		}
		if (feat.featType.skill !== false) {
			feat._slType = "Skill";
			feat._fType.push("Skill");
		}
		if (feat.featType.archetype !== false) {
			feat._slType = "Archetype";
			feat._fType.push("Archetype");
		}
		feat._fTime = feat.activity != null ? feat.activity.unit : "";
		feat._fMisc = [];
		if (feat.prerequisites != null) feat._fMisc.push("Has Prerequisites");
		if (feat.trigger != null) feat._fMisc.push("Has Trigger");
		if (feat.frequency != null) feat._fMisc.push("Has Frequency");
		if (feat.requirements != null) feat._fMisc.push("Has Requirements");
		if (feat.cost != null) feat._fMisc.push("Has Cost");
		if (feat.special != null) feat._fMisc.push("Has Special");
	}

	addToFilters (feat, isExcluded) {
		if (isExcluded) return;

		this._typeFilter.addItem(feat._fType);
		this._traitsFilter.addItem(feat.traits);
		if (typeof (feat.featType.ancestry) !== "boolean") this._ancestryFilter.addItem(feat.featType.ancestry);
		if (typeof (feat.featType.archetype) !== "boolean") this._archetypeFilter.addItem(feat.featType.archetype);
		// FIXME: remove next line, and fix below once archetype data is correct
		if (feat.farchetype) this._archetypeFilter.addItem("Archetype");
		if (typeof (feat.featType.class) !== "boolean") this._classFilter.addItem(feat.featType.class);
		if (typeof (feat.featType.skill) !== "boolean") this._skillFilter.addItem(feat.featType.skill);
		this._sourceFilter.addItem(feat.source);
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
			ft.source,
			ft._fType,
			ft.level,
			ft.featType.ancestry,
			// FIXME Change line below
			ft.featType.archetype === true ? "Archetype" : ft.featType.archetype,
			ft.featType.class,
			ft.featType.skill,
			ft._fTime,
			ft.traits,
			ft._fMisc,
		)
	}
}
