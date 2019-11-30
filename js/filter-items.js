"use strict";

class PageFilterItems {
	constructor () {
		const sourceFilter = getSourceFilter();
		const typeFilter = new Filter({header: "Type", deselFn: (it) => PageFilterItems._DEFAULT_HIDDEN_TYPES.has(it)});
		const tierFilter = new Filter({header: "Tier", items: ["None", "Minor", "Major"], itemSortFn: null});
		const propertyFilter = new Filter({header: "Property", displayFn: StrUtil.uppercaseFirst});
		const costFilter = new RangeFilter({header: "Cost", min: 0, max: 100, isAllowGreater: true, suffix: "gp"});
		const focusFilter = new Filter({header: "Spellcasting Focus", items: ["Bard", "Cleric", "Druid", "Paladin", "Sorcerer", "Warlock", "Wizard"]});
		const attachedSpellsFilter = new Filter({header: "Attached Spells", displayFn: (it) => it.split("|")[0].toTitleCase(), itemSortFn: SortUtil.ascSortLower});
		const lootTableFilter = new Filter({header: "Found On", items: ["Magic Item Table A", "Magic Item Table B", "Magic Item Table C", "Magic Item Table D", "Magic Item Table E", "Magic Item Table F", "Magic Item Table G", "Magic Item Table H", "Magic Item Table I"]});
		const rarityFilter = new Filter({
			header: "Rarity",
			items: [...Parser.ITEM_RARITIES],
			itemSortFn: null
		});
		const attunementFilter = new Filter({header: "Attunement", items: ["Yes", "By...", "Optional", "No"], itemSortFn: null});
		const categoryFilter = new Filter({
			header: "Category",
			items: ["Basic", "Generic Variant", "Specific Variant", "Other"],
			deselFn: (it) => it === "Specific Variant",
			itemSortFn: null
		});
		const damageTypeFilter = new Filter({header: "Damage Type", displayFn: it => Parser.dmgTypeToFull(it).uppercaseFirst(), itemSortFn: (a, b) => SortUtil.ascSortLower(Parser.dmgTypeToFull(a), Parser.dmgTypeToFull(b))});
		const miscFilter = new Filter({header: "Miscellaneous", items: ["Ability Score Adjustment", "Charges", "Cursed", "Magic", "Mundane", "Sentient", "SRD"]});

		this._filterBox = null;

		this._sourceFilter = sourceFilter;
		this._typeFilter = typeFilter;
		this._tierFilter = tierFilter;
		this._propertyFilter = propertyFilter;
		this._costFilter = costFilter;
		this._focusFilter = focusFilter;
		this._attachedSpellsFilter = attachedSpellsFilter;
		this._lootTableFilter = lootTableFilter;
		this._rarityFilter = rarityFilter;
		this._attunementFilter = attunementFilter;
		this._categoryFilter = categoryFilter;
		this._damageTypeFilter = damageTypeFilter;
		this._miscFilter = miscFilter;
	}

	get filterBox () { return this._filterBox; }

	addToFilters (item) {
		const tierTags = [];
		tierTags.push(item.tier ? item.tier : "None");

		// for filter to use
		item._fTier = tierTags;
		item._fProperties = item.property ? item.property.map(p => Renderer.item.propertyMap[p].name).filter(n => n) : [];
		item._fMisc = item.sentient ? ["Sentient"] : [];
		if (item.curse) item._fMisc.push("Cursed");
		const isMundane = item.rarity === "None" || item.rarity === "Unknown" || item._category === "Basic";
		item._fMisc.push(isMundane ? "Mundane" : "Magic");
		item._fIsMundane = isMundane;
		if (item.ability) item._fMisc.push("Ability Score Adjustment");
		if (item.charges) item._fMisc.push("Charges");
		if (item.srd) item._fMisc.push("SRD");
		if (item.focus || item.type === "INS" || item.type === "SCF") {
			item._fFocus = item.focus ? item.focus === true ? ["Bard", "Cleric", "Druid", "Paladin", "Sorcerer", "Warlock", "Wizard"] : [...item.focus] : [];
			if (item.type === "INS" && !item._fFocus.includes("Bard")) item._fFocus.push("Bard");
			if (item.type === "SCF") {
				switch (item.scfType) {
					case "arcane": {
						if (!item._fFocus.includes("Sorcerer")) item._fFocus.push("Sorcerer");
						if (!item._fFocus.includes("Warlock")) item._fFocus.push("Warlock");
						if (!item._fFocus.includes("Wizard")) item._fFocus.push("Wizard");
						break;
					}
					case "druid": {
						if (!item._fFocus.includes("Druid")) item._fFocus.push("Druid");
						break;
					}
					case "holy":
						if (!item._fFocus.includes("Cleric")) item._fFocus.push("Cleric");
						if (!item._fFocus.includes("Paladin")) item._fFocus.push("Paladin");
						break;
				}
			}
		}

		// region populate filters
		this._sourceFilter.addItem(item.source);
		this._typeFilter.addItem(item._typeListText);
		item._fTier.forEach(tt => this._tierFilter.addItem(tt));
		this._propertyFilter.addItem(item._fProperties);
		this._attachedSpellsFilter.addItem(item.attachedSpells);
		this._lootTableFilter.addItem(item.lootTables);
		this._damageTypeFilter.addItem(item.dmgType);
		// endregion
	}

	async pInitFilterBox (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._tierFilter,
			this._rarityFilter,
			this._propertyFilter,
			this._attunementFilter,
			this._categoryFilter,
			this._costFilter,
			this._focusFilter,
			this._damageTypeFilter,
			this._miscFilter,
			this._lootTableFilter,
			this._attachedSpellsFilter
		];

		this._filterBox = new FilterBox(opts);
		await this._filterBox.pDoLoadState();
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it._typeListText,
			it._fTier,
			it.rarity,
			it._fProperties,
			it._attunementCategory,
			it._category,
			it.value || 0,
			it._fFocus,
			it.dmgType,
			it._fMisc,
			it.lootTables,
			it.attachedSpells
		);
	}
}
PageFilterItems._DEFAULT_HIDDEN_TYPES = new Set(["Treasure", "Futuristic", "Modern", "Renaissance"]);
