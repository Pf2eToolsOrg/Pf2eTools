"use strict";

class PageFilterItems extends PageFilter {
	// region static
	static _levelValue (level) {
		if (typeof level === "number") {
			return level;
		} else if (typeof level === "string") {
			return Number(level.replace("+", "")) + 0.1
		} else return 0;
	}

	static _bulkValue (bulk) {
		if (typeof bulk === "number") {
			return bulk;
		} else if (typeof bulk === "string") {
			if (bulk === "L") return 0.1;
			else if (!isNaN(Number(bulk))) return Number(bulk);
		}
		return 0;
	}

	static _priceCategory (value) {
		if (typeof value !== "number") return "0 gp";
		if (value === 0) return "0 gp";
		else if (value <= 5 * 100) return "5 gp";
		else if (value <= 10 * 100) return "10 gp";
		else if (value <= 50 * 100) return "50 gp";
		else if (value <= 100 * 100) return "100 gp";
		else if (value <= 500 * 100) return "500 gp";
		else if (value <= 750 * 100) return "750 gp";
		else if (value <= 1000 * 100) return "1,000 gp";
		else if (value <= 2500 * 100) return "2,500 gp";
		else if (value <= 5000 * 100) return "5,000 gp";
		else if (value <= 10000 * 100) return "10,000 gp";
		else if (value <= 25000 * 100) return "25,000 gp";
		else if (value <= 50000 * 100) return "50,000 gp";
		else if (value <= 100000 * 100) return "100,000 gp";
		else return "100,000+ gp";
	}

	static sortItems (a, b, o) {
		if (o.sortBy === "name") return SortUtil.compareListNames(a, b);
		else if (o.sortBy === "category") return SortUtil.ascSortLower(a.values.category, b.values.category) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "source") return SortUtil.ascSortLower(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "level") return SortUtil.ascSort(a.values.level, b.values.level) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "bulk") return SortUtil.ascSort(a.values.bulk, b.values.bulk) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "price") return SortUtil.ascSort(a.values.price, b.values.price) || SortUtil.compareListNames(a, b);
		else return 0;
	}

	// endregion
	constructor () {
		super();

		this._sourceFilter = new SourceFilter()
		this._levelFilter = new RangeFilter({
			header: "Level",
			isLabelled: true,
		});
		this._typeFilter = new Filter({
			header: "Type",
			items: ["Equipment", "Generic Variant", "Specific Variant"],
			itemSortFn: null,
			deselFn: (it) => it === "Specific Variant",
		})
		this._categoryFilter = new Filter({
			header: "Category",
		});
		this._subCategoryFilter = new Filter({
			header: "Subcategory",
			nests: {},
		});
		this._damageDiceFilter = new Filter({header: "Damage", itemSortFn: SortUtil.sortDice})
		this._damageTypeFilter = new Filter({header: "Damage Type", displayFn: (it) => Parser.dmgTypeToFull(it).toTitleCase()})
		this._handsFilter = new Filter({
			header: "Hands",
			displayFnMini: (it) => `${it} hand${Number(it) === 1 ? "" : "s"}`,
		});
		this._damageFilter = new MultiFilter({header: "Weapon Damage", filters: [this._damageDiceFilter, this._damageTypeFilter, this._handsFilter]})
		this._groupFilter = new Filter({
			header: "Group",
			displayFn: (it) => it.split("|")[0],
		});
		this._traitFilter = new TraitsFilter({
			header: "Traits",
			discardCategories: {
				"Equipment": true,
			},
		});
		this._priceFilter = new RangeFilter({
			header: "Price",
			isLabelled: true,
			labels: ["0 gp", "5 gp", "10 gp", "50 gp", "100 gp", "250 gp", "500 gp", "750 gp", "1,000 gp", "2,500 gp", "5,000 gp", "10,000 gp", "25,000 gp", "50,000 gp", "100,000 gp", "100,000+ gp"],
			labelSortFn: null,
		});
		this._bulkFilter = new RangeFilter({header: "Bulk"});
		this._rangeFilter = new Filter({header: "Weapon Range", items: ["Melee", "Ranged"]});
		this._shieldACFilter = new Filter({header: "AC Bonus", displayFn: it => `${Parser.numToBonus(it)} AC`});
		this._hpFilter = new RangeFilter({header: "HP"});
		this._btFilter = new RangeFilter({header: "BT"});
		this._hardnessFilter = new RangeFilter({header: "Hardness"});
		this._shieldDataFilter = new MultiFilter({
			header: "Shield Stats",
			filters: [this._shieldACFilter, this._hpFilter, this._btFilter, this._hardnessFilter],
		});
		this._ammoFilter = new Filter({header: "Ammunition"});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
		});
		this._appliesToFilter = new Filter({header: "Applies to..."});

		this._categoriesRuneItems = new Set();
	}

	mutateForFilters (it) {
		it._fweaponData = it.weaponData || {};
		it._fcomboWeaponData = it.comboWeaponData || {};
		it._farmorData = it.armorData || {};
		it._fshieldData = it.shieldData || {};

		// Sorting
		it._fLvl = PageFilterItems._levelValue(it.level);
		it._fBulk = PageFilterItems._bulkValue(it.bulk);
		it._sPrice = Parser.priceToValue(it.price);

		// Filters
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._fType = [];
		if (it.equipment) it._fType.push("Equipment");
		if (it.generic === "G") it._fType.push("Generic Variant");
		if (it.generic === "V") it._fType.push("Specific Variant");
		it._fSubCategory = it.subCategory ? new FilterItem({
			item: it.subCategory,
			nest: it.category,
		}) : null;

		it._fGroup = [it.group, it._fweaponData.group, it._fcomboWeaponData.group, it._farmorData.group, it._fshieldData.group].filter(Boolean);
		it._fWeaponRange = it.category === "Weapon" ? [it._fweaponData.range ? "Ranged" : "Melee", it._fcomboWeaponData ? it._fcomboWeaponData.range ? "Ranged" : "Melee" : null] : null;
		it._fHands = [it.hands, it._fweaponData.hands, it._fcomboWeaponData.hands].filter(Boolean).map(it => String(it));
		it._fPrice = PageFilterItems._priceCategory(it._sPrice);
		it._fMisc = [];
		for (let entry of it.entries) {
			if (typeof entry === "object") {
				if (entry.type === "ability") it._fMisc.push("Activatable");
				if (entry.type === "affliction") {
					// TODO: More Filters?
				}
			}
		}

		it._fDamage = undefined; // FIXME: set by trait implies
		this.handleTraitImplies(it, {traitProp: "traits", entityTypes: ["item"]});
		it._fTraits = (it.traits || []).map(t => Parser.getTraitName(t));
		if (!it._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) it._fTraits.push("Common");

		// RuneItem Builder
		if (it.appliesTo) this._categoriesRuneItems.add(...it.appliesTo);
	}

	addToFilters (item, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(item._fSources);
		this._levelFilter.addItem(Math.floor(item._fLvl));
		this._categoryFilter.addItem(item.category);
		this._traitFilter.addItem(item._fTraits)
		this._priceFilter.addItem(item._fPrice);
		this._bulkFilter.addItem(item._fBulk);
		if (item._fSubCategory) {
			this._subCategoryFilter.addNest(item.category, {isHidden: true})
			this._subCategoryFilter.addItem(item._fSubCategory);
		}
		if (item._fGroup) this._groupFilter.addItem(item._fGroup);
		this._damageTypeFilter.addItem([item._fweaponData.damageType, item._fcomboWeaponData.damageType].filter(Boolean));
		this._damageDiceFilter.addItem([item._fweaponData.damage, item._fcomboWeaponData.damage].filter(Boolean));
		this._handsFilter.addItem(item._fHands);
		if (item._fshieldData.ac) this._shieldACFilter.addItem(item._fshieldData.ac);
		if (item._fshieldData.hp) this._hpFilter.addItem(item._fshieldData.hp);
		if (item._fshieldData.bt) this._btFilter.addItem(item._fshieldData.bt);
		if (item._fshieldData.hardness) this._hardnessFilter.addItem(item._fshieldData.hardness);
		if (item.ammunition != null) this._ammoFilter.addItem(item.ammunition);
		this._miscFilter.addItem(item._fMisc);
		if (item.appliesTo) this._appliesToFilter.addItem(item.appliesTo);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._typeFilter,
			this._categoryFilter,
			this._subCategoryFilter,
			this._damageFilter,
			this._groupFilter,
			this._rangeFilter,
			this._traitFilter,
			this._priceFilter,
			this._miscFilter,
			this._bulkFilter,
			this._shieldDataFilter,
			this._appliesToFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it._fLvl,
			it._fType,
			it.category,
			it._fSubCategory,
			[
				[it._fweaponData.damage, it._fcomboWeaponData.damage],
				[it._fweaponData.damageType, it._fcomboWeaponData.damageType],
				it._fHands,
			],
			it._fGroup,
			it._fWeaponRange,
			it._fTraits,
			it._fPrice,
			it._fMisc,
			it._fBulk,
			[
				it._fshieldData.ac,
				it._fshieldData.hp,
				it._fshieldData.bt,
				it._fshieldData.hardness,
			],
			it.appliesTo,
		);
	}
}

class ModalFilterBaseItems extends ModalFilter {
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: "an Item to add Runes to",
			pageFilter: new PageFilterItems(),
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4-2"},
			{sort: "category", text: "Category", width: "2-2"},
			{sort: "price", text: "Price", width: "2"},
			{sort: "bulk", text: "Bulk", width: "1-3"},
			{sort: "source", text: "Source", width: "1-3"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		const [brew, data] = await Promise.all([
			BrewUtil.pAddBrewData(),
			DataUtil.item.loadJSON(),
		]);
		const fromBrew = brew.baseitem || [];
		const fromData = data.baseitem || [];
		// TODO: Implement with homebrew categories
		return [...fromBrew, ...fromData].filter(it => ["Armor", "Weapon"].includes(it.category));
	}

	_getListItem (pagefilter, item, itI) {
		const eleLabel = document.createElement("label");
		eleLabel.className = `w-100 flex-vh-center lst--border no-select lst__wrp-cells`;

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
		const source = Parser.sourceJsonToAbv(item.source);

		eleLabel.innerHTML = `<div class="col-1 pl-0 flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>
			<div class="col-4-2 bold">${item.name}</div>
			<div class="col-2-2 text-center">${Array.isArray(item.category) ? item.category.join(", ") : item.category}</div>
			<div class="col-2 text-center">${Parser.priceToFull(item.price)}</div>
			<div class="col-1-3 text-center">${item.bulk ? item.bulk : "\u2014"}</div>
			<div class="col-1-3 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</div>`;

		return new ListItem(
			itI,
			eleLabel,
			item.name,
			{
				hash,
				source,
				bulk: item._fBulk,
				price: item._sPrice,
				category: item.category,
			},
			{
				uniqueId: item.uniqueId ? item.uniqueId : itI,
				cbSel: eleLabel.firstElementChild.firstElementChild,
			},
		)
	}
}
