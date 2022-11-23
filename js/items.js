"use strict";

class ItemsPage extends ListPage {
	constructor () {
		super({
			dataSource: Renderer.item.pBuildList({ isAddGroups: true, isBlacklistVariants: true }),
			pageFilter: new PageFilterItems(),
			listClass: "items",
			sublistClass: "subitems",
			dataProps: ["item"],
		});

		this._sublistCurrencyConversion = null;
		this._sublistCurrencyDisplayMode = null;

		this._$totalBulk = null;
		this._$totalPrice = null;
		this._$totalItems = null;

		this._itemId = 0;
		this._runeItems = [];
	}

	getListItem (item, itI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(item);
		let listItem;

		if (ExcludeUtil.isExcluded(hash, "item", item.source)) return null;
		if (item.noDisplay) return null;

		this._pageFilter.mutateAndAddToFilters(item, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;
		eleLi.addEventListener("click", (evt) => this._handleItemsLiClick(evt, listItem));
		eleLi.addEventListener("contextmenu", (evt) => this._handleItemsLiContext(evt, listItem));

		const source = Parser.sourceJsonToAbv(item.source);
		const level = item.level != null ? `${typeof item.level === "string" && item.level.endsWith("+") ? `\u00A0\u00A0${item.level}` : item.level}` : "\u2014"

		const cats = typeof item.category === "string" ? [item.category] : Array.isArray(item.category) ? item.category : [];
		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-4 pl-0">${cats.includes("Rune") ? RuneBuilder.getButtons(itI) : ""}<span class="bold w-100">${item.name}${item.add_hash ? `<span class="ve-muted"> (${item.add_hash})</span>` : ""}</span></span>
			<span class="col-2-2 text-center">${cats.join(", ")}</span>
			<span class="col-1-5 text-center">${level}</span>
			<span class="col-1-8 text-center">${Parser.priceToFull(item.price)}</span>
			<span class="col-1-2 text-center">${item.bulk ? item.bulk : "\u2014"}</span>
			<span class="source col-1-3 text-center ${Parser.sourceJsonToColor(item.source)}" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</span>
		</a>`;

		eleLi.firstElementChild.addEventListener("click", evt => this._handleItemsLinkClick(evt));

		listItem = new ListItem(
			itI,
			eleLi,
			item.name,
			{
				hash,
				source,
				level: item._fLvl,
				price: item._sPrice,
				bulk: item._fBulk,
				category: cats.join(", "),
				_searchStr: item.generic === "G" && item.variants ? item.variants.map(v => `${v.variantType} ${item.name}`).join(" - ") : "",
			},
			{
				uniqueId: item.uniqueId ? item.uniqueId : itI,
				isExcluded,
			},
		);
		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));
		return listItem;
	}

	handleFilterChange () {
		const f = this._pageFilter.filterBox.getValues();
		function listFilter (li) {
			const it = this._dataList[li.ix];
			return this._pageFilter.toDisplay(f, it);
		}
		this._list.filter(listFilter.bind(this));
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (item, pinId, { count = 1 } = {}) {
		const hash = UrlUtil.autoEncodeHash(item);

		const $dispCount = $(`<span class="text-center col-2-3 pr-0">${count}</span>`);
		const $ele = $$`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-5-4 pl-0">${item.name}${item.add_hash ? `<span class="ve-muted"> (${item.add_hash})</span>` : ""}</span>
				<span class="text-center col-2-3">${Parser.priceToFull(item.price)}</span>
				<span class="text-center col-2">${item.bulk ? item.bulk : "\u2014"}</span>
				${$dispCount}
			</a>
		</li>`.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			item.name,
			{
				hash,
				source: Parser.sourceJsonToAbv(item.source),
				level: item._fLvl,
				price: item._sPrice,
				bulk: item._fBulk,
				category: item.category,
			},
			{
				count,
				$elesCount: [$dispCount],
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const $content = $(`#pagecontent`).empty();
		const item = this._dataList[id];
		this._itemId = id;

		function buildStatsTab () {
			$content.append(Renderer.item.getRenderedString(item));
		}
		async function buildFluffTab () {
			const pGetFluff = async () => {
				const fluff = await Renderer.item.pGetFluff(item);
				return fluff ? fluff.entries || [] : [];
			}
			$content.append(Renderer.getRenderedLore({lore: await pGetFluff()}))
		}

		const buildImageTab = async () => {
			const pGetImages = async () => {
				const item = this._dataList[Hist.lastLoadedId];
				const fluff = await Renderer.item.pGetFluff(item);
				return fluff ? fluff.images || [] : [];
			}
			const fluffImages = await pGetImages();
			const renderStack = [];
			Renderer.get().recursiveRender(fluffImages.map(l => `<a href="${l}" target="_blank" rel="noopener noreferrer">${l}</a>`), renderStack);
			$content.append(renderStack.join(""));
		}

		const statTab = Renderer.utils.tabButton(
			"Item",
			() => { },
			buildStatsTab,
		);
		const fluffTab = Renderer.utils.tabButton(
			"Info",
			() => { },
			buildFluffTab,
		);
		const imageTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			buildImageTab,
		);
		const tabs = [statTab];
		if (item.hasFluff) tabs.push(fluffTab);
		if (item.hasImages) tabs.push(imageTab);

		Renderer.utils.bindTabButtons(...tabs);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._pageFilter.filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
		await this._printView.pHandleSub(sub);

		await runeBuilder.pHandleSubhash();
	}

	onSublistChange () {
		this._$totalBulk = this._$totalBulk || $(`#totalbulk`);
		this._$totalPrice = this._$totalPrice || $(`#totalprice`);
		this._$totalItems = this._$totalItems || $(`#totalitems`);

		let bulk = 0;
		let value = 0;
		let cntItems = 0;

		const availConversions = new Set();
		ListUtil.sublist.items.forEach(it => {
			const item = this._dataList[it.ix];
			if (item.currencyConversion) availConversions.add(item.currencyConversion);
			const count = it.data.count;
			cntItems += it.data.count;
			if (item._fBulk) bulk += item._fBulk * count;
			if (item._sPrice) value += item._sPrice * count;
		});

		this._$totalBulk.text(`${Math.floor(bulk)}`);
		this._$totalItems.text(cntItems);

		if (availConversions.size) {
			this._$totalPrice
				.text(Parser.itemValueToFullMultiCurrency({ value, currencyConversion: this._sublistCurrencyConversion }))
				.off("click")
				.click(async () => {
					const values = ["(Default)", ...[...availConversions].sort(SortUtil.ascSortLower)];
					const defaultSel = values.indexOf(this._sublistCurrencyConversion);
					const userSel = await InputUiUtil.pGetUserEnum({
						values,
						isResolveItem: true,
						default: ~defaultSel ? defaultSel : 0,
						title: "Select Currency Conversion Table",
						fnDisplay: it => it === null ? values[0] : it,
					});
					if (userSel == null) return;
					this._sublistCurrencyConversion = userSel === values[0] ? null : userSel;
					await StorageUtil.pSetForPage("sublistCurrencyConversion", this._sublistCurrencyConversion);
					this.onSublistChange();
				});
		} else {
			const modes = ["Exact Coinage", "Lowest Common Currency", "Gold"];
			const text = (() => {
				switch (this._sublistCurrencyDisplayMode) {
					case modes[1]: return Parser.itemValueToFull({ value });
					case modes[2]: {
						return value ? `${(Parser.DEFAULT_CURRENCY_CONVERSION_TABLE.find(it => it.coin === "gp").mult * value).toFixed(2).replace(/\.?0+$/, "")} gp` : "";
					}
					default:
					case modes[0]: {
						const CURRENCIES = ["gp", "sp", "cp"];
						const coins = { cp: value };
						CurrencyUtil.doSimplifyCoins(coins);
						return CURRENCIES.filter(it => coins[it]).map(it => `${coins[it].toLocaleString(undefined, { maximumFractionDigits: 5 })} ${it}`).join(", ");
					}
				}
			})();

			this._$totalPrice
				.text(text || "\u2014")
				.off("click")
				.click(async () => {
					const defaultSel = modes.indexOf(this._sublistCurrencyDisplayMode);
					const userSel = await InputUiUtil.pGetUserEnum({
						values: modes,
						isResolveItem: true,
						default: ~defaultSel ? defaultSel : 0,
						title: "Select Display Mode",
						fnDisplay: it => it === null ? modes[0] : it,
					});
					if (userSel == null) return;
					this._sublistCurrencyDisplayMode = userSel === modes[0] ? null : userSel;
					await StorageUtil.pSetForPage("sublistCurrencyDisplayMode", this._sublistCurrencyDisplayMode);
					this.onSublistChange();
				});
		}
	}

	async pOnLoad () {
		window.loadHash = this.doLoadHash.bind(this);
		window.loadSubHash = this.pDoLoadSubHash.bind(this);

		[this._sublistCurrencyConversion, this._sublistCurrencyDisplayMode] = await Promise.all([StorageUtil.pGetForPage("sublistCurrencyConversion"), StorageUtil.pGetForPage("sublistCurrencyDisplayMode")]);
		await ExcludeUtil.pInitialise();
		await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $(`#filter-search-group`).title("Hotkey: f"),
			$btnReset: $(`#reset`),
		});
		$(`#btn-equip-buy`).on("click", () => {
			// TODO: keep the source filters?
			this._pageFilter.filterBox.reset();
			this._pageFilter.filterBox.setFromValues({ Type: { Equipment: 1, "Generic Variant": 2 } });
			this.handleFilterChange();
		});

		this._printView = new PrintModeView({
			hashKey: "printview",
			$openBtn: $(`#btn-printbook`),
			noneVisibleMsg: "If you wish to view multiple items, please first make a list",
			pageTitle: "Items Printer View",
			popTblGetNumShown: async ($wrpContent) => {
				const toShow = await Promise.all(ListUtil.genericPinKeyMapper());

				toShow.sort((a, b) => SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name));

				let numShown = 0;

				const stack = [];

				const renderItem = (it) => {
					stack.push(`<div class="prntv__wrp-item"><div class="pf2-stat stats stats--book stats--prntv">`);
					stack.push(Renderer.item.getRenderedString(it));
					stack.push(`</div></div>`);
				};

				stack.push(`<div class="w-100 h-100">`);
				toShow.forEach(it => renderItem(it));
				if (!toShow.length && Hist.lastLoadedId != null) {
					renderItem(this._dataList[Hist.lastLoadedId]);
				}
				stack.push(`</div>`);

				numShown += toShow.length;
				$wrpContent.append(stack.join(""));

				return numShown;
			},
			hasPrintColumns: true,
		});

		runeBuilder = new RuneBuilder();
		runeBuilder.initUi();
		await runeBuilder.initState();

		return this._pPopulateTablesAndFilters({ item: await Renderer.item.pBuildList({ isAddGroups: true, isBlacklistVariants: true }) });
	}

	async _pPopulateTablesAndFilters (data) {
		this._list = ListUtil.initList({
			listClass: "items",
			fnSort: PageFilterItems.sortItems,
			syntax: this._listSyntax,
		});

		const $outVisibleResults = $(`.lst__wrp-search-visible`);
		this._list.on("updated", () => {
			$outVisibleResults.html(`${this._list.visibleItems.length}/${this._list.items.length}`);
		});

		ListUtil.setOptions({ primaryLists: [this._list] });

		// filtering function
		this._pageFilter.filterBox.on(
			FilterBox.EVNT_VALCHANGE,
			this.handleFilterChange.bind(this),
		);

		SortUtil.initBtnSortHandlers($("#filtertools"), this._list);

		this._subList = ListUtil.initSublist({
			listClass: "subitems",
			fnSort: PageFilterItems.sortItems,
			pGetSublistRow: this.getSublistItem.bind(this),
			onUpdate: this.onSublistChange.bind(this),
		});
		SortUtil.initBtnSortHandlers($("#sublistsort"), this._subList);
		ListUtil.initGenericAddable();

		this._addItems(data);
		BrewUtil.pAddBrewData()
			.then(this._pHandleBrew.bind(this))
			.then(() => BrewUtil.bind({ lists: [this._list], pHandleBrew: this._pHandleBrew.bind(this) }))
			.then(() => BrewUtil.pAddLocalBrewData())
			.then(async () => {
				BrewUtil.makeBrewButton("manage-brew");
				BrewUtil.bind({ lists: [this._list], filterBox: this._pageFilter.filterBox, sourceFilter: this._pageFilter.sourceFilter });
				await ListUtil.pLoadState();
				RollerUtil.addListRollButton();
				ListUtil.addListShowHide();

				ListUtil.bindShowTableButton(
					"btn-show-table",
					"Items",
					this._dataList,
					{
						name: { name: "Name", transform: true },
						source: { name: "Source", transform: (it) => `<span class="${Parser.sourceJsonToColor(it)}" title="${Parser.sourceJsonToFull(it)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it)}</span>` },
						_traits: { name: "Traits", transform: (it) => `<span>${(it._fTraits).sort(SortUtil.sortTraits).join(", ")}</span>` },
						_category: { name: "Category", transform: (it) => `${it.subCategory ? `${it.subCategory} ` : ""}${it.category === "Weapon" ? `${it.range ? "Ranged" : "Melee"} ${it.category}` : it.category}` },
						group: { name: "Group", transform: (it) => it || "" },
						_price: { name: "Price", transform: (it) => Parser.priceToFull(it.price) },
						_bulk: { name: "Bulk", transform: (it) => it.bulk != null ? it.bulk : "\u2014" },
						_damage: { name: "Damage", transform: (it) => `${it.damage || ""} ${it.damageType || ""}` },
						_description: { name: "Description", unchecked: true, transform: (it) => Renderer.get().render(it.entries.join(" ").split(". ")[0]) },
					},
					{ generator: ListUtil.basicFilterGenerator },
					(a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source),
				);

				this._list.init();
				this._subList.init();

				Hist.init(true);
				ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#pagecontent`));

				window.dispatchEvent(new Event("toolsLoaded"));
			});

		await runeBuilder.addFromSaveToItemsPage();
		await runeBuilder.pHandleSubhash(true);
	}

	async _pHandleBrew (homebrew) {
		const itemList = await Renderer.item.getItemsFromHomebrew(homebrew);
		this._addItems({ item: itemList });
	}

	_addItems (data) {
		if (!data.item || !data.item.length) return;

		this._dataList.push(...data.item);

		for (; this._ixData < this._dataList.length; this._ixData++) {
			const item = this._dataList[this._ixData];
			const listItem = this.getListItem(item, this._ixData);
			if (!listItem) continue;
			this._list.addItem(listItem);
		}

		this._list.update();

		this._pageFilter.filterBox.render();
		this.handleFilterChange();

		ListUtil.setOptions({
			itemList: this._dataList,
			pGetSublistRow: this.getSublistItem.bind(this),
			primaryLists: [this._list],
		});
		ListUtil.bindAddButton();
		ListUtil.bindSubtractButton();

		// region popout button
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
		$btnPop.off("click").title("Popout Window (SHIFT for Source Data)");
		$btnPop.on(
			"click",
			(evt) => {
				if (Hist.lastLoadedId !== null || runeBuilder.isActive()) {
					let toRender;
					if (runeBuilder.isActive()) {
						toRender = runeBuilder.runeItem;
					} else {
						toRender = this._dataList[Hist.lastLoadedId];
					}

					if (evt.shiftKey) {
						let $content = ""
						if (evt.ctrlKey) {
							$content = Renderer.hover.$getHoverContent_statsCode(toRender, true)
						} else {
							$content = Renderer.hover.$getHoverContent_statsCode(toRender)
						}
						Renderer.hover.getShowWindow(
							$content,
							Renderer.hover.getWindowPositionFromEvent(evt),
							{
								title: `${toRender.name} \u2014 Source Data${evt.ctrlKey ? " (<span style='color:#FFFF00'>Dev</span>)" : ""}`,
								isPermanent: true,
								isBookContent: true,
							},
						);
					} else if (runeBuilder.isActive()) {
						Renderer.hover.doPopout(evt, [toRender], 0);
					} else {
						Renderer.hover.doPopout(evt, this._dataList, Hist.lastLoadedId);
					}
				}
			},
		);
		// endregion

		UrlUtil.bindLinkExportButton(this._pageFilter.filterBox);
		ListUtil.bindOtherButtons({
			download: true,
			upload: true,
		});
	}

	_handleItemsLiClick (evt, listItem) {
		if (runeBuilder.isActive()) Renderer.hover.doPopout(evt, this._dataList, listItem.ix);
	}

	_handleItemsLiContext (evt, listItem) {
		if (!runeBuilder.isActive()) ListUtil.openContextMenu(evt, this._dataList, listItem);
		else RuneListUtil.openContextMenu(evt, listItem);
	}

	_handleItemsLinkClick (evt) {
		if (runeBuilder.isActive()) evt.preventDefault();
	}

	_getSearchCache (entity) {
		if (this.constructor._INDEXABLE_PROPS.every(it => !entity[it])) return "";
		const ptrOut = { _: "" };
		this.constructor._INDEXABLE_PROPS.forEach(it => this._getSearchCache_handleEntryProp(entity, it, ptrOut));
		return ptrOut._;
	}
}
ItemsPage._INDEXABLE_PROPS = [
	"entries",
	"ammunition",
	"usage",
	"activate",
	"onset",
	"variants",
];

let runeBuilder;
let itemsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	itemsPage = new ItemsPage();
	itemsPage.pOnLoad()
});
window.addEventListener("beforeunload", () => {
	if (runeBuilder.isActive() && runeBuilder._cachedFilterState) {
		StorageUtil.pSetForPage(itemsPage._pageFilter._filterBox._getNamespacedStorageKey(), runeBuilder._cachedFilterState);
	}
});
