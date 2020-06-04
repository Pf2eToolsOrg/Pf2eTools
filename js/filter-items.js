"use strict";

class PageFilterItems extends PageFilter {
	// region static
	static _rarityValue (rarity) {
		switch (rarity) {
			case "none": return 0;
			case "common": return 1;
			case "uncommon": return 2;
			case "rare": return 3;
			case "very rare": return 4;
			case "legendary": return 5;
			case "artifact": return 6;
			case "varies": return 7;
			case "unknown (magic)": return 8;
			case "unknown": return 9;
			default: return 10;
		}
	}

	static sortItems (a, b, o) {
		if (o.sortBy === "name") return SortUtil.compareListNames(a, b);
		else if (o.sortBy === "type") return SortUtil.ascSortLower(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "source") return SortUtil.ascSortLower(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "rarity") return SortUtil.ascSort(PageFilterItems._rarityValue(a.values.rarity), PageFilterItems._rarityValue(b.values.rarity)) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "attunement") return SortUtil.ascSort(a.values.attunement, b.values.attunement) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "weight") return SortUtil.ascSort(a.values.weight, b.values.weight) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "cost") return SortUtil.ascSort(a.values.cost, b.values.cost) || SortUtil.compareListNames(a, b);
		else return 0;
	}
	// endregion

	constructor () {
		super();

		const typeFilter = new Filter({header: "Type", deselFn: (it) => PageFilterItems._DEFAULT_HIDDEN_TYPES.has(it), displayFn: StrUtil.toTitleCase});
		const tierFilter = new Filter({header: "Tier", items: ["none", "minor", "major"], itemSortFn: null, displayFn: StrUtil.toTitleCase});
		const propertyFilter = new Filter({header: "Property", displayFn: StrUtil.uppercaseFirst});
		const costFilter = new RangeFilter({header: "Cost", min: 0, max: 100, isAllowGreater: true, suffix: "gp"});
		const focusFilter = new Filter({header: "Spellcasting Focus", items: ["Bard", "Cleric", "Druid", "Paladin", "Sorcerer", "Warlock", "Wizard"]});
		const attachedSpellsFilter = new Filter({header: "Attached Spells", displayFn: (it) => it.split("|")[0].toTitleCase(), itemSortFn: SortUtil.ascSortLower});
		const lootTableFilter = new Filter({header: "Found On", items: ["Magic Item Table A", "Magic Item Table B", "Magic Item Table C", "Magic Item Table D", "Magic Item Table E", "Magic Item Table F", "Magic Item Table G", "Magic Item Table H", "Magic Item Table I"]});
		const rarityFilter = new Filter({
			header: "Rarity",
			items: [...Parser.ITEM_RARITIES],
			itemSortFn: null,
			displayFn: StrUtil.toTitleCase
		});
		const attunementFilter = new Filter({header: "Attunement", items: ["Yes", "By...", "Optional", "No"], itemSortFn: null});
		const categoryFilter = new Filter({
			header: "Category",
			items: ["Basic", "Generic Variant", "Specific Variant", "Other"],
			deselFn: (it) => it === "Specific Variant",
			itemSortFn: null
		});
		const bonusFilter = new Filter({header: "Bonus", items: ["Armor Class", "Spell Attacks", "Saving Throws", "Weapon Attack and Damage Rolls", "Weapon Attack Rolls", "Weapon Damage Rolls"]})
		const damageTypeFilter = new Filter({header: "Damage Type", displayFn: it => Parser.dmgTypeToFull(it).uppercaseFirst(), itemSortFn: (a, b) => SortUtil.ascSortLower(Parser.dmgTypeToFull(a), Parser.dmgTypeToFull(b))});
		const miscFilter = new Filter({header: "Miscellaneous", items: ["Ability Score Adjustment", "Charges", "Cursed", "Item Group", "Magic", "Mundane", "Sentient", "SRD"]});
		const baseSourceFilter = new SourceFilter({
			header: "Base Source",
			displayFn: (item) => Parser.sourceJsonToFullCompactPrefix(item.item || item),
			groupFn: SourceUtil.getFilterGroup
		});

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
		this._bonusFilter = bonusFilter;
		this._miscFilter = miscFilter;
		this._baseSourceFilter = baseSourceFilter;
	}

	mutateForFilters (item) {
		const tierTags = [];
		tierTags.push(item.tier ? item.tier : "none");

		// for filter to use
		item._fTier = tierTags;
		item._fProperties = item.property ? item.property.map(p => Renderer.item.propertyMap[p].name).filter(n => n) : [];
		item._fMisc = item.sentient ? ["Sentient"] : [];
		if (item.curse) item._fMisc.push("Cursed");
		const isMundane = item.rarity === "none" || item.rarity === "unknown" || item._category === "basic";
		item._fMisc.push(isMundane ? "Mundane" : "Magic");
		item._fIsMundane = isMundane;
		if (item.ability) item._fMisc.push("Ability Score Adjustment");
		if (item.charges) item._fMisc.push("Charges");
		if (item.srd) item._fMisc.push("SRD");
		if (item._isItemGroup) item._fMisc.push("Item Group");
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

		item._fBonus = [];
		if (item.bonusAc) item._fBonus.push("Armor Class");
		if (item.bonusWeapon) item._fBonus.push("Weapon Attack and Damage Rolls");
		if (item.bonusWeaponAttack) item._fBonus.push("Weapon Attack Rolls");
		if (item.bonusWeaponDamage) item._fBonus.push("Weapon Damage Rolls");
		if (item.bonusSpellAttack) item._fBonus.push("Spell Attacks");
		if (item.bonusSavingThrow) item._fBonus.push("Saving Throws");
	}

	addToFilters (item, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(item.source);
		this._typeFilter.addItem(item._typeListText);
		this._tierFilter.addItem(item._fTier)
		this._propertyFilter.addItem(item._fProperties);
		this._attachedSpellsFilter.addItem(item.attachedSpells);
		this._lootTableFilter.addItem(item.lootTables);
		this._damageTypeFilter.addItem(item.dmgType);
		this._baseSourceFilter.addItem(item._baseSource);
	}

	async _pPopulateBoxOptions (opts) {
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
			this._bonusFilter,
			this._miscFilter,
			this._lootTableFilter,
			this._baseSourceFilter,
			this._attachedSpellsFilter
		];
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
			(it.value || 0) / 100,
			it._fFocus,
			it.dmgType,
			it._fBonus,
			it._fMisc,
			it.lootTables,
			it._baseSource,
			it.attachedSpells
		);
	}
}
PageFilterItems._DEFAULT_HIDDEN_TYPES = new Set(["Treasure", "Futuristic", "Modern", "Renaissance"]);

class ModalFilterItems extends ModalFilter {
	constructor (namespace) {
		super({
			modalTitle: "Items",
			pageFilter: new PageFilterItems(),
			namespace: namespace
		})
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "5"},
			{sort: "type", text: "Type", width: "5"},
			{sort: "source", text: "Source", width: "1"}
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await Renderer.item.pBuildList({isAddGroups: true, isBlacklistVariants: true});
		const fromBrew = await Renderer.item.getItemsFromHomebrew(brew);
		return [...fromData, ...fromBrew];
	}

	_getListItem (pageFilter, item, itI) {
		if (item.noDisplay) return null;
		Renderer.item.enhanceItem(item);
		pageFilter.mutateAndAddToFilters(item);

		const eleLi = document.createElement("li");
		eleLi.className = "row px-0";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
		const source = Parser.sourceJsonToAbv(item.source);
		const type = item._typeListText.join(", ");

		eleLi.innerHTML = `<label class="lst--border unselectable">
			<div class="lst__wrp-cells">
				<div class="col-1 pl-0 flex-vh-center"><input type="checkbox" class="no-events"></div>
				<span class="col-5 bold">${item.name}</span>
				<span class="col-5">${type}</span>
				<span class="col-1 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</span>
			</div>
		</label>`;

		return new ListItem(
			itI,
			eleLi,
			item.name,
			{
				hash,
				source,
				sourceJson: item.source,
				type
			},
			{
				cbSel: eleLi.firstElementChild.firstElementChild.firstElementChild.firstElementChild
			}
		);
	}
}
