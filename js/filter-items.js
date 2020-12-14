"use strict";

class PageFilterItems extends PageFilter {
	// region static
	static _levelValue(level) {
		if (typeof level === "number") {
			return level;
		} else if (typeof level === 'string') {
			return Number(level.replace('+', '')) + 0.1
		} else return 0;
	}

	static _bulkValue(bulk) {
		if (typeof bulk === "number") {
			return bulk;
		} else if (typeof bulk === 'string') {
			if (bulk === 'L') return 0.1;
			else if (!isNaN(Number(bulk))) return Number(bulk);
		}
		return 0;
	}

	static _priceCategory(value) {
		if (typeof value !== 'number') return '0 gp';
		if (value < 5 *100) return '0 gp';
		else if (value < 10 *100) return '5 gp';
		else if (value < 50 * 100) return '10 gp';
		else if (value < 100 * 100) return '50 gp';
		else if (value < 500 * 100) return '100 gp';
		else if (value < 750 * 100) return '500 gp';
		else if (value < 1000 * 100) return '750 gp';
		else if (value < 2500 * 100) return '1,000 gp';
		else if (value < 5000 * 100) return '2,500 gp';
		else if (value < 10000 * 100) return '5,000 gp';
		else if (value < 25000 * 100) return '10,000 gp';
		else if (value < 50000 * 100) return '25,000 gp';
		else if (value < 100000 * 100) return '50,000 gp';
		else return '100,000+ gp';
	}

	static sortItems(a, b, o) {
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
	constructor() {
		super();

		this._sourceFilter = new SourceFilter()
		this._levelFilter = new RangeFilter({
			header: 'Level',
			isLabelled: true
		});
		this._typeFilter = new Filter({
			header: 'Type',
			items: ['Equipment', 'Treasure', 'Generic Variant', 'Specific Variant'],
			itemSortFn: null
		})
		this._categoryFilter = new Filter({
			header: 'Category',
		});
		this._generalTrtFilter = new Filter({header: "General"});
		this._weaponTrtFilter = new Filter({header: "Weapon"});
		this._schoolTrtFilter = new Filter({header: "Magic Schools"});
		this._rarityTrtFilter = new Filter({
			header: "Rarity",
			items: [...Parser.TRAITS_RARITY],
			itemSortFn: null
		});
		this._traitFilter = new MultiFilter({
			header: "Traits",
			filters: [this._rarityTrtFilter, this._weaponTrtFilter, this._schoolTrtFilter, this._generalTrtFilter]
		});
		this._priceFilter = new RangeFilter({
			header: "Price",
			isLabelled: true,
			labels: ['0 gp', '5 gp', '10 gp', '50 gp', '100 gp', '250 gp', '500 gp', '750 gp', '1,000 gp', '2,500 gp', '5,000 gp', '10,000 gp', '25,000 gp', '50,000 gp', '100,000+ gp'],
			labelSortFn: null
		});
		this._bulkFilter = new RangeFilter({header: "Bulk"});
		this._hpFilter = new RangeFilter({
			header: "HP",
			isLabelled: true
		});
		this._btFilter = new RangeFilter({
			header: "BT",
			isLabelled: true
		});
		this._hardnessFilter = new RangeFilter({
			header: "Hardness",
			isLabelled: true
		});
		this._shieldStatsFilter = new MultiFilter({
			header: "Shield Stats",
			filters: [this._hpFilter, this._btFilter, this._hardnessFilter]
		});
		this._ammoFilter = new Filter({header: "Ammunition"});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ['Consumable']
		});
	}

	mutateForFilters(item) {
		//Sorting
		item._fLvl = PageFilterItems._levelValue(item.level)
		item._fBulk = PageFilterItems._bulkValue(item.bulk)
		item._sPrice = Parser.priceToValue(item.price)

		//Filters
		item._fPrice = PageFilterItems._priceCategory(item._sPrice)
		item._fType = []
		item._fMisc = item.consumable ? ["Consumable"] : [];
		item._fIsEquipment = item.type === "Equipment" || item.type === "Material" || item.type === "Snare";
		item._fWeaponTraits = [];
		item._fSchoolTraits = [];
		item._fRarity = 'Common';
		item._fGeneralTraits = [];
		for (let trait of item.traits) {
			if (Parser.TRAITS_WEAPON.concat(Parser.TRAITS_ARMOR).includes(trait)) item._fWeaponTraits.push(trait);
			else if (Parser.TRAITS_SCHOOL.includes(trait)) item._fSchoolTraits.push(trait);
			else if (Parser.TRAITS_RARITY.includes(trait)) item._fRarity = trait;
			else item._fGeneralTraits.push(trait);
		}
		for (let entry of item.entries) {
			if (typeof entry === 'object') {
				if (entry.type === 'activation') item._fMisc.push('Activatable');
				if (entry.type === 'affliction') {
					// TODO: More Filters?
				}
			}
		}
		item._fIsEquipment ? item._fType.push('Equipment') : item._fType.push('Treasure');
		if (item.generic === 'G') item._fType.push('Generic Variant');
		if (item.generic === 'V') item._fType.push('Specific Variant');
	}

	addToFilters(item, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(item.source);
		this._levelFilter.addItem(Math.floor(item._fLvl));
		this._categoryFilter.addItem(item.category);
		this._weaponTrtFilter.addItem(item._fWeaponTraits);
		this._schoolTrtFilter.addItem(item._fSchoolTraits);
		this._generalTrtFilter.addItem(item._fGeneralTraits);
		this._priceFilter.addItem(item._fPrice);
		this._bulkFilter.addItem(item._fBulk);
		if (item.shield_stats != null) this._hpFilter.addItem(item.shield_stats.HP);
		if (item.shield_stats != null) this._btFilter.addItem(item.shield_stats.BT);
		if (item.shield_stats != null) this._hardnessFilter.addItem(item.shield_stats.hardness);
		if (item.ammunition != null) this._ammoFilter.addItem(item.ammunition);
		if (item.craft_requirements != null) this._miscFilter.addItem('Has Craft Requirements');
		this._miscFilter.addItem(item._fMisc);
	}

	async _pPopulateBoxOptions(opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._categoryFilter,
			this._traitFilter,
			this._priceFilter,
			this._typeFilter,
			this._miscFilter,
			this._bulkFilter,
			this._shieldStatsFilter,
		];
	}

	toDisplay(values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it._fLvl,
			it.category,
			[
				it._fRarity,
				it._fWeaponTraits,
				it._fSchoolTraits,
				it._fGeneralTraits
			],
			it._fPrice,
			it._fType,
			it._fMisc,
			it._fBulk,
			[
				it.shield_stats ? it.shield_stats.HP : 0,
				it.shield_stats ? it.shield_stats.BT : 0,
				it.shield_stats ? it.shield_stats.hardness : 0,
			]
		);
	}
}

PageFilterItems._DEFAULT_HIDDEN_TYPES = new Set([]);

class ModalFilterItems extends ModalFilter {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor(opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: "Items",
			pageFilter: new PageFilterItems(),
		})
	}

	_$getColumnHeaders() {
		const btnMeta = [
			{sort: "name", text: "Name", width: "5"},
			{sort: "type", text: "Type", width: "5"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pInit() {
		await Renderer.item.populatePropertyAndTypeReference();
	}

	async _pLoadAllData() {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await Renderer.item.pBuildList({isAddGroups: true, isBlacklistVariants: true});
		const fromBrew = await Renderer.item.getItemsFromHomebrew(brew);
		return [...fromData, ...fromBrew];
	}

	_getListItem(pageFilter, item, itI) {
		if (item.noDisplay) return null;

		Renderer.item.enhanceItem(item);
		pageFilter.mutateAndAddToFilters(item);

		const eleLabel = document.createElement("label");
		eleLabel.className = "row lst--border no-select lst__wrp-cells";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
		const source = Parser.sourceJsonToAbv(item.source);
		const type = item._typeListText.join(", ");

		eleLabel.innerHTML = `<div class="col-1 pl-0 flex-vh-center"><input type="checkbox" class="no-events"></div>
		<div class="col-5 bold">${item.name}</div>
		<div class="col-5">${type.uppercaseFirst()}</div>
		<div class="col-1 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</div>`;

		return new ListItem(
			itI,
			eleLabel,
			item.name,
			{
				hash,
				source,
				sourceJson: item.source,
				type,
			},
			{
				cbSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}
}
