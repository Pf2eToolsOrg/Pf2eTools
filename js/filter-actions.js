"use strict";

class PageFilterActions extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._timeFilter = new Filter({
			header: "Activity",
			items: [
				Parser.TM_A,
				Parser.TM_AA,
				Parser.TM_AAA,
				Parser.TM_F,
				Parser.TM_R,
				Parser.TM_MINS,
				Parser.TM_HRS,
				"Varies",
			],
			displayFn: Parser.timeUnitToFull,
			itemSortFn: null,
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
			items: ["Ancestry", "Heritage", "Class", "Archetype", "Basic"],
			selFn: (it) => it === "Basic",
		});
		this._traitFilter = new TraitsFilter({header: "Traits"});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action"]});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fTime = it.activity ? it.activity.unit : null;
		it.actionType = it.actionType || {};
		it._fType = Object.keys(it.actionType).filter(it => it !== "skill").filter(k => it.actionType[k]).map(k => Parser.actionTypeKeyToFull(k));
		if (it.actionType.skill) it._fType.concat(Object.keys(it.actionType.skill).map(k => Parser.actionTypeKeyToFull(k)));
		it._fUntrained = it.actionType.skill ? it.actionType.skill.untrained || null : null;
		it._fTrained = it.actionType.skill ? it.actionType.skill.trained || null : null;
		it._fExpert = it.actionType.skill ? it.actionType.skill.expert || null : null;
		it._fMaster = it.actionType.skill ? it.actionType.skill.master || null : null;
		it._fLegendary = it.actionType.skill ? it.actionType.skill.legendary || null : null;
		it._fTraits = (it.traits || []).map(t => Parser.getTraitName(t));
		if (!it._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) it._fTraits.push("Common");
		it._fMisc = [];
		if (it.actionType.variant === true) it._fMisc.push("Optional/Variant Action")
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._traitFilter.addItem(it._fTraits);
		if (it._fUntrained) this._untrainedFilter.addItem(it._fUntrained);
		if (it._fTrained) this._trainedFilter.addItem(it._fTrained);
		if (it._fExpert) this._expertFilter.addItem(it._fExpert);
		if (it._fMaster) this._masterFilter.addItem(it._fMaster);
		if (it._fLegendary) this._legendaryFilter.addItem(it._fLegendary);
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
