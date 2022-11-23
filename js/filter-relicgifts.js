"use strict";

class PageFilterRelicGifts extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._aspectFilter = new Filter({header: "Aspects", displayFn: StrUtil.toTitleCase});
		this._tierFilter = new Filter({header: "Tier", displayFn: StrUtil.toTitleCase});
		this._itemTypeFilter = new Filter({header: "Item Type"});
		this._traitFilter = new Filter({header: "Traits"});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: [
				"Soul Seed Gift",
				"Alters Relic",
				"Grants Ability",
				"Grants Passive Attribute",
				"Has Prerequisites",
				"Is Rune",
			]
		});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fTraits = (it.traits || []).map(trait => Parser.getTraitName(trait));
		it._fAspects = it.aspects.map(aspect => typeof aspect === "string" ? aspect : aspect.name);
		it._fItemTypes = (it.itemTypes || "Any");
		it._fMisc = (it.miscTags || []).map(tag => {
			switch (tag) {
				case "altersRelic": return "Alters Relic";
				case "grantsAbility": return "Grants Ability";
				case "grantsPassive": return "Grants Passive Attribute";
				case "isRune": return "Is Rune";
				case "soulSeed": return "Soul Seed Gift";
			}
		});
		if (it.prerequisites) it._fMisc.push("Has Prerequisites");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._aspectFilter.addItem(it._fAspects);
		this._tierFilter.addItem(it.tier);
		this._itemTypeFilter.addItem(it._fItemTypes);
		this._traitFilter.addItem(it._fTraits);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._aspectFilter,
			this._tierFilter,
			this._itemTypeFilter,
			this._traitFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fAspects,
			it.tier,
			it._fItemTypes,
			it._fTraits,
			it._fMisc,
		)
	}
}
