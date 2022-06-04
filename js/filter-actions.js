"use strict";

class PageFilterActions extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._timeFilter = new Filter({
			header: "Activity",
			itemSortFn: SortUtil.sortActivities,
		});
		this._untrainedFilter = new Filter({header: "Untrained"});
		this._trainedFilter = new Filter({header: "Trained"});
		this._expertFilter = new Filter({header: "Expert"});
		this._masterFilter = new Filter({header: "Master"});
		this._legendaryFilter = new Filter({header: "Legendary"});
		this._skillFilter = new MultiFilter({
			header: "Skills",
			filters: [this._untrainedFilter, this._trainedFilter, this._expertFilter, this._masterFilter, this._legendaryFilter],
		});
		this._typeFilter = new Filter({
			header: "Type",
			items: ["Ancestry", "Heritage", "Class", "Archetype", "Basic", "Skill", "Optional/Variant Action"],
			selFn: (it) => it === "Basic",
		});
		this._traitFilter = new TraitsFilter({header: "Traits"});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action"]});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fTime = Parser.timeToActivityType(it.activity);
		it.actionType = it.actionType || {};
		it._fType = Object.keys(it.actionType).filter(k => it.actionType[k]).map(k => Parser.actionTypeKeyToFull(k));
		if (it.actionType.skill) {
			it._fType.concat(Object.keys(it.actionType.skill).map(k => Parser.actionTypeKeyToFull(k)));
			it._fUntrained = it.actionType.skill.untrained || null;
			it._fTrained = it.actionType.skill.trained || null;
			it._fExpert = it.actionType.skill.expert || null;
			it._fMaster = it.actionType.skill.master || null;
			it._fLegendary = it.actionType.skill.legendary || null;
		}
		it._fTraits = (it.traits || []).map(t => Parser.getTraitName(t));
		if (!it._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) it._fTraits.push("Common");
		it._fMisc = [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		if (it._fTime != null) this._timeFilter.addItem(it._fTime);
		this._traitFilter.addItem(it._fTraits);
		if (it._fUntrained) this._untrainedFilter.addItem(it._fUntrained.map(s => s.toTitleCase()));
		if (it._fTrained) this._trainedFilter.addItem(it._fTrained.map(s => s.toTitleCase()));
		if (it._fExpert) this._expertFilter.addItem(it._fExpert.map(s => s.toTitleCase()));
		if (it._fMaster) this._masterFilter.addItem(it._fMaster.map(s => s.toTitleCase()));
		if (it._fLegendary) this._legendaryFilter.addItem(it._fLegendary.map(s => s.toTitleCase()));
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._timeFilter,
			this._typeFilter,
			this._skillFilter,
			this._traitFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fTime,
			it._fType,
			[
				it._fUntrained,
				it._fTrained,
				it._fExpert,
				it._fMaster,
				it._fLegendary,
			],
			it._fTraits,
			it._fMisc,
		)
	}
}
