"use strict";

class RuneBuilder extends ProxyBase {
	constructor () {
		super();

		this.stateInit = false;

		this._cachedTitle = null;
		this._cachedFilterState = null;

		this._active = null;
		this.__state = {
			savedRuneItems: {},
			activeKey: null,
		};
		this._state = this._getProxy("state", this.__state);
		this._$btnSave = null;
		this._$btnLoad = null;
		this.pSetSavedRuneItemsThrottled = MiscUtil.throttle(this._pSetSavedRuneItems.bind(this), 50);

		this.baseItem = null;
		this._runeList = null;
	}

	get runeItem () {
		if (!this._runeList.items.length) return this.baseItem;
		return Renderer.runeItem.getRuneItem(this.baseItem, this.runes);
	}

	get runes () {
		return this._runeList.items.map(li => li.ix).map(ix => itemsPage._itemList[ix]);
	}

	initUi () {
		$(`#btn-runebuild`).click(() => Hist.setSubhash(RuneBuilder.HASH_KEY, true));
		$(`#btn-runebuild--save`).click(() => {
			this.pSaveRuneItemAndState();
			Hist.setSubhash(RuneBuilder.HASH_KEY, null);
			Hist.setMainHash(UrlUtil.autoEncodeHash(this.runeItem));
		});
		$(`#btn-runebuild--cancel`).click(() => Hist.setSubhash(RuneBuilder.HASH_KEY, null));
	}

	updateUi (itemId) {
		itemId = itemId == null ? itemsPage._itemId : itemId;
		const item = itemsPage._itemList[itemId];
		if (!this.isActive() && ((item.type === "Equipment" && ["Rune Item"].concat(itemsPage._pageFilter._categoriesRuneItems).includes(item.category)) || item.runeItem)) {
			$(`#btn-runebuild`).toggleClass("hidden", false);
		} else $(`#btn-runebuild`).toggleClass("hidden", true);

		$(`#btn-runebuild--save`).toggleClass("hidden", !this.isActive());
		$(`#btn-runebuild--cancel`).toggleClass("hidden", !this.isActive());
	}

	async initState () {
		this._runeList = RuneListUtil.initList();
		this._runeList.init();
		this._runeList.on("updated", () => this.onRuneListUpdate());
		this.stateInit = true;
		await this._initSavedRuneItems();
	}

	reset () {
		RuneListUtil.removeAll();
		this._state.activeKey = null;
		this.pSetSavedRuneItemsThrottled();
	}

	async pDoLoadState (savedState) {
		if (!savedState || !savedState.data) return;
		const hashes = Renderer.runeItem.getHashesFromTag(savedState.data.t);
		this.baseItem = itemsPage._itemList[itemsPage._itemList.findIndex(it => UrlUtil.autoEncodeHash(it) === hashes[0])];
		this.reset();
		for (const hash of hashes.splice(1)) {
			await RuneListUtil.pAddByHash(hash);
		}
		RuneListUtil.list.items.forEach(it => RuneListUtil._updateAddSubtractButton(it.ix));
		this.renderItem(this.runeItem);
		this.setSubhashFromState();
	}

	async pSaveRuneItemAndState () {
		const hash = UrlUtil.autoEncodeHash(this.runeItem);
		const isDuplicate = itemsPage._runeItems.map(idx => UrlUtil.autoEncodeHash(itemsPage._itemList[idx]) === hash).some(Boolean);

		if (!this.runes.length) {
			JqueryUtil.doToast({type: "warning", content: "Add runes to this item before saving."});
		} else if (isDuplicate) {
			JqueryUtil.doToast({type: "warning", content: "There are no changes to save."});
		} else {
			const data = {item: [this.runeItem]};
			itemsPage._addItems(data);
			const id = itemsPage._itI - 1;
			itemsPage._runeItems.push(id);
			await ListUtil.pDoSublistAdd(id, true);

			const name = this.runeItem.name;
			const key = UrlUtil.autoEncodeHash(this.runeItem);
			this._state.savedRuneItems = {
				...this._state.savedRuneItems,
				[key]: {
					name,
					data: this.getSaveableState(),
				},
			};
			this._state.activeKey = key;
			this.pSetSavedRuneItemsThrottled();

			JqueryUtil.doToast({type: "success", content: "Saved!"});
		}
	}

	getSaveableState () {
		return {
			h: UrlUtil.autoEncodeHash(this.runeItem),
			t: Renderer.runeItem.getTag(this.baseItem, this.runes),
			f: itemsPage._pageFilter._filterBox._getSaveableState(),
		};
	}

	isActive () {
		return this._active;
	}

	_getInitialFilterState (baseItem) {
		baseItem = baseItem || this.baseItem;
		let state = MiscUtil.copy(RuneBuilder.RUNEBUILDER_DEFAULT_FILTER_STATE);
		state.filters["Rune applies to..."] = {
			"meta": {
				"combineBlue": "or",
				"combineRed": "or",
				"isHidden": false,
				"isMobileHeaderHidden": true,
			},
			"state": {
			},
		}
		state.filters["Rune applies to..."]["state"][`${baseItem.category} Rune`] = 1;
		return state
	}

	show () {
		this._cachedTitle = this._cachedTitle || document.title;
		document.title = "Rune Builder - Pf2eTools";
		$(`#sublistcontainer`).toggleClass("sublist--visible", true);
		RuneListUtil._updateNoRunesVisible();
		$(`body`).addClass("rigen_active");
		$(`#sublistsort`).toggleClass("hidden", true);
		$(`#sublistlist`).toggleClass("hidden", true);
		$(`#sublistsummary`).toggleClass("hidden", true);
		$(`#btn-sublist-add`).toggleClass("hidden", true);
		$(`#btn-sublist-subtract`).toggleClass("hidden", true);
		$(`#btn-sublist-other`).toggleClass("hidden", true);
		$(`.col-name`).toggleClass("col-4", false).toggleClass("col-3", true);
		this.renderItem(this.runeItem);
	}

	hide () {
		if (this._cachedTitle) {
			document.title = this._cachedTitle;
			this._cachedTitle = null;
		}
		$(`body`).removeClass("rigen_active");
		ListUtil._updateSublistVisibility();
		$(`#sublistsort`).toggleClass("hidden", false);
		$(`#sublistlist`).toggleClass("hidden", false);
		$(`#sublistsummary`).toggleClass("hidden", false);
		$(`#btn-sublist-add`).toggleClass("hidden", false);
		$(`#btn-sublist-subtract`).toggleClass("hidden", false);
		$(`#btn-sublist-other`).toggleClass("hidden", false);
		$(`.col-name`).toggleClass("col-3", false).toggleClass("col-4", true);
	}

	async activate () {
		this._active = true;

		this.baseItem = MiscUtil.copy(itemsPage._itemList[itemsPage._itemId]);

		this._cachedFilterState = this._cachedFilterState || itemsPage._pageFilter._filterBox._getSaveableState();
		itemsPage._pageFilter._filterBox.reset();
		itemsPage._pageFilter._filterBox._setStateFromLoaded(this._getInitialFilterState());
		itemsPage.handleFilterChange();

		this.reset();
		RuneListUtil.list.update();
		this.show();
	}

	deactivate () {
		if (this._cachedFilterState) {
			itemsPage._pageFilter._filterBox._setStateFromLoaded(this._cachedFilterState);
			StorageUtil.pSetForPage(itemsPage._pageFilter._filterBox._getNamespacedStorageKey(), this._cachedFilterState);
			itemsPage.handleFilterChange();
			this._cachedFilterState = null;
		}
		this.hide();
		this._active = false;
	}

	handleClick (evt, ix, add, customHashId) {
		const data = customHashId ? {customHashId} : undefined;
		if (add) RuneListUtil.pDoAdd(ix, data);
		else RuneListUtil.pDoSubtract(ix, data);
	}

	getRuneListItem (item, idx, data) {
		const hash = UrlUtil.autoEncodeHash(item);
		const source = Parser.sourceJsonToAbv(item.source);

		const $ele = $$`<li class="row"><a class="lst--border">
			<span class="col-0-6 no-wrap pl-0 text-center" onclick="event.preventDefault(); event.stopPropagation()">
				<button title="Subtract" class="btn btn-danger btn-xs rigen__btn_list" onclick="runeBuilder.handleClick(event, ${idx}, 0)"><span class="glyphicon glyphicon-minus"></span></button>
			</span>
			<span class="col-1-4 no-wrap text-center" onclick="event.preventDefault(); event.stopPropagation()">
				<button title="Shift Up" class="btn btn-default btn-xs rigen__btn_list" onclick="RuneListUtil.shiftUp(${idx})"><span class="glyphicon glyphicon-chevron-up"></span></button>
				<button title="Shift Down" class="btn btn-default btn-xs rigen__btn_list " onclick="RuneListUtil.shiftDown(${idx})"><span class="glyphicon glyphicon-chevron-down"></span></button>
			</span>
			<span class="bold col-4">${item.name}</span>
			<span class="col-3 text-center">${item.level}</span>
			<span class="col-3 text-center ${Parser.sourceJsonToColor(item.source)}" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</span>
			</a></li>`.contextmenu(evt => RuneListUtil.openContextMenu(evt, listItem));

		const listItem = new ListItem(
			idx,
			$ele,
			item.name,
			{
				hash,
				source,
			},
			{
			},
		);
		return listItem;
	}

	onRuneListUpdate () {
		this.renderItem(this.runeItem);
		this.setSubhashFromState();
		this._setActiveKey();
	}

	renderItem (item) {
		$(`#pagecontent`).empty().append(RenderItems.$getRenderedItem(item));
	}

	async pHandleSubhash (isInitialLoad) {
		const subhash = Hist.getSubHash(RuneBuilder.HASH_KEY);
		let subhashParts = subhash ? subhash.split(HASH_SUB_LIST_SEP) : [""];
		subhashParts.shift();
		let itemId;
		if (!subhash) {
			this.deactivate();
			if (isInitialLoad) itemId = itemsPage._itemList.findIndex(it => UrlUtil.autoEncodeHash(it) === Hist.getHashParts()[0]);
		} else {
			if (!this.isActive()) await this.activate();

			if (subhash === this.getSubhash()) {
				// if we just added or removed a rune, do nothing
			} else if (isInitialLoad) {
				// load from url
				const ixItem = itemsPage._itemList.findIndex(it => UrlUtil.autoEncodeHash(it) === Hist.getHashParts()[0]);
				itemsPage.doLoadHash(ixItem);
				await this.activate();
				if (subhashParts && subhashParts.length) {
					for (const h of subhashParts) {
						await RuneListUtil.pAddByHash(h);
					}
				}
			} else {
				// if the base item is a runeItem, find its saved state and load it
				const savedState = await RuneItemUtil.pGetSavedState();
				const hash = UrlUtil.autoEncodeHash(this.baseItem);
				if (savedState && savedState.savedRuneItems) {
					for (const key of Object.keys(savedState.savedRuneItems)) {
						if (savedState.savedRuneItems[key].data.h === hash) {
							await this.pDoLoadState(savedState.savedRuneItems[key]);
							break;
						}
					}
				}
			}
		}

		if (this.isActive()) this.show();
		this.updateUi(itemId);
	}

	getSubhash () {
		return `${RuneBuilder.HASH_KEY}${HASH_SUB_KV_SEP}${this.isActive() ? `true${["", ...this.runes.map(r => UrlUtil.autoEncodeHash(r))].join(HASH_SUB_LIST_SEP)}` : "false"}`;
	}

	setSubhashFromState () {
		Hist.setSubhash(RuneBuilder.HASH_KEY, this.isActive() ? `true${["", ...this.runes.map(r => UrlUtil.autoEncodeHash(r))].join(HASH_SUB_LIST_SEP)}` : null);
	}

	_setActiveKey () {
		this._state.activeKey = UrlUtil.autoEncodeHash(this.runeItem);
	}

	static getButtons (itemId) {
		return `<span class="rigen__visible col-1 no-wrap pl-0 text-center" onclick="event.preventDefault(); event.stopPropagation()">
			<button id="rigen__add-btn-${itemId}" title="Add" class="btn btn-success btn-xs rigen__btn_list" onclick="runeBuilder.handleClick(event, ${itemId}, 1)"><span class="glyphicon glyphicon-plus"></span></button>
			<button id="rigen__subtract-btn-${itemId}" title="Subtract" class="btn btn-danger btn-xs rigen__btn_list hidden" onclick="runeBuilder.handleClick(event, ${itemId}, 0)"><span class="glyphicon glyphicon-minus"></span></button>
		</span>`;
	}

	async _initSavedRuneItems () {
		const $wrpControls = $(`#rigen__wrp-save-controls`).empty()

		const savedState = await RuneItemUtil.pGetSavedState();
		Object.assign(this._state, savedState);

		const pLoadActiveRuneItem = async () => {
			// save/restore the active key, to prevent it from being killed by the reset
			const cached = this._state.activeKey;
			const runeItem = this._state.savedRuneItems[this._state.activeKey];
			await this.pDoLoadState(runeItem);
			this._state.activeKey = cached;
			this.pSetSavedRuneItemsThrottled();
		};

		this._$btnSave = $(`<button class="btn btn-default btn-xs mr-2" title="Save Item"><span class="glyphicon glyphicon-floppy-disk"/></button>`)
			.click(() => this.pSaveRuneItemAndState());

		const pDoReload = async () => {
			const inStorage = await RuneItemUtil.pGetSavedState();
			const prev = inStorage.savedRuneItems[this._state.activeKey];
			if (!prev) {
				return JqueryUtil.doToast({
					content: `Could not find item in storage! Has it been deleted?`,
					type: "danger",
				});
			} else {
				this._state.savedRuneItems = {
					...this._state.savedRuneItems,
					[this._state.activeKey]: prev,
				};
				await pLoadActiveRuneItem();
			}
		};
		this._$btnReload = $(`<button class="btn btn-default btn-xs mr-2" title="Reload Current Item"><span class="glyphicon glyphicon-refresh"/></button>`)
			.click(() => pDoReload());

		this._$btnLoad = $(`<button class="btn btn-default btn-xs">Saved Items</button>`)
			.click(async () => {
				const inStorage = await RuneItemUtil.pGetSavedState();
				const {$modalInner} = UiUtil.getShowModal({title: "Saved Items"});
				const $wrpRows = $(`<div class="flex-col w-100 h-100"/>`).appendTo($modalInner);

				const runeItems = inStorage.savedRuneItems;
				if (Object.keys(runeItems).length) {
					let rendered = Object.keys(runeItems).length;
					Object.entries(runeItems)
						.sort((a, b) => SortUtil.ascSortLower(a[1].name || "", b[1].name || ""))
						.forEach(([k, v]) => {
							const $divName = $(`<div class="row w-100 mr-2 lst--border"><span class="bold text-left">${v.name}</span></div>`);

							const $btnLoad = $(`<button class="btn btn-primary btn-xs mr-2">Load</button>`)
								.click(async () => {
									// if we've already got the correct item loaded, reload it
									if (this._state.activeKey === k) await pDoReload();
									else this._state.activeKey = k;

									await pLoadActiveRuneItem();
								});

							const $btnDelete = $(`<button class="btn btn-danger btn-xs"><span class="glyphicon glyphicon-trash"/></button>`)
								.click(() => {
									if (this._state.activeKey === k) this._state.activeKey = null;
									this._state.savedRuneItems = Object.keys(this._state.savedRuneItems)
										.filter(it => it !== k)
										.mergeMap(it => ({[it]: this._state.savedRuneItems[it]}));
									$row.remove();
									if (!--rendered) $$`<div class="w-100 flex-vh-center italic">No saved items</div>`.appendTo($wrpRows);
									this.pSetSavedRuneItemsThrottled();
								});

							const $row = $$`<div class="flex-v-center w-100 mb-2">
								${$divName}
								${$btnLoad}
								${$btnDelete}
							</div>`.appendTo($wrpRows);
						});
					$$`<div class="w-100 mt-3 flex-vh-center italic ve-muted">Rune Items are deleted from the item list when the items page is reloaded.</div>`.appendTo($wrpRows);
				} else $$`<div class="w-100 flex-vh-center italic">No saved items</div>`.appendTo($wrpRows)
			});

		const hookActiveKey = () => {
			// show/hide controls
			this._$btnReload.toggle(!!this._state.activeKey);
		};
		this._addHook("state", "activeKey", hookActiveKey);
		hookActiveKey();

		$$`<div class="flex-col" style="align-items: flex-end;">
			<div class="flex-h-right">${this._$btnSave}${this._$btnLoad}</div>
		</div>`.appendTo($wrpControls);
	}

	_pSetSavedRuneItems () {
		if (!this.stateInit) return;
		return StorageUtil.pSet(RuneItemUtil.SAVED_RUNEITEM_SAVE_LOCATION, this.__state);
	}

	async addFromSaveToItemsPage () {
		const savedState = await RuneItemUtil.pGetSavedState();
		if (savedState && savedState.savedRuneItems) {
			Object.keys(savedState.savedRuneItems).forEach(k => {
				const tag = savedState.savedRuneItems[k].data.t;
				const hashes = Renderer.runeItem.getHashesFromTag(tag);
				const items = hashes.map(hash => itemsPage._itemList.findIndex(it => UrlUtil.autoEncodeHash(it) === hash))
					.map(idx => itemsPage._itemList[idx]);
				const data = {item: [Renderer.runeItem.getRuneItem(items[0], items.splice(1))]};
				itemsPage._addItems(data);
				itemsPage._runeItems.push(itemsPage._itI - 1);
			});
		}
	}
}
RuneBuilder.HASH_KEY = "runebuilder";
RuneBuilder.RUNEBUILDER_DEFAULT_FILTER_STATE = {
	"box": {
		"meta": {
			"modeCombineFilters": "and",
			"isSummaryHidden": false,
			"isBrewDefaultHidden": false,
		},
		"minisHidden": {},
		"combineAs": {},
	},
	"filters": {
		"Category": {
			"meta": {
				"combineBlue": "or",
				"combineRed": "or",
				"isHidden": false,
				"isMobileHeaderHidden": true,
			},
			"state": {
				"Rune": 1,
			},
		},
		"Type": {
			"meta": {
				"combineBlue": "or",
				"combineRed": "or",
				"isHidden": false,
				"isMobileHeaderHidden": true,
			},
			"state": {
				"Generic Variant": 2,
			},
		},
	},
};

const RuneListUtil = {
	initList () {
		this._getListRow = runeBuilder.getRuneListItem.bind(runeBuilder);
		this._listChangeFn = runeBuilder.onRuneListUpdate.bind(runeBuilder);
		this.list = new List({$wrpList: $(`#rigen__runelist`), isUseJquery: true, fnSort: null});
		return this.list;
	},

	async pAddByHash (hash) {
		const ixItem = itemsPage._itemList.findIndex(it => UrlUtil.autoEncodeHash(it) === hash);
		await this.pDoAdd(ixItem);
	},

	async pDoAdd (index, data) {
		const listItem = await RuneListUtil._getListRow(itemsPage._itemList[index], index, data);
		this.list.addItem(listItem);
		this.list.update();
		this._updateNoRunesVisible();
		this._updateAddSubtractButton(index);
		this._listChangeFn();
	},

	async pDoSubtract (index, data) {
		this.list.removeItem(index);
		this.list.update();
		this._updateNoRunesVisible();
		this._updateAddSubtractButton(index);
		this._listChangeFn();
	},

	removeAll () {
		const itemIndexes = this.list.items.map(it => it.ix);
		this.list.removeAllItems();
		itemIndexes.forEach(ix => this._updateAddSubtractButton(ix));
	},

	async pSaveList () {
		await StorageUtil.pSetForPage("runelist")
	},

	async pDoLoadState () {},

	shiftUp (idx) {
		const listIdx = this.list.items.map(it => it.ix).indexOf(idx);
		if (listIdx > 0) {
			let temp = this.list.items[listIdx - 1];
			this.list._items[listIdx - 1] = this.list.items[listIdx];
			this.list._items[listIdx] = temp;
			this.list._isDirty = true;
			this.list.update();
			this._listChangeFn();
		}
	},

	shiftDown (idx) {
		const listIdx = this.list.items.map(it => it.ix).indexOf(idx);
		if (listIdx < this.list.items.length - 1) {
			let temp = this.list.items[listIdx + 1];
			this.list._items[listIdx + 1] = this.list.items[listIdx];
			this.list._items[listIdx] = temp;
			this.list._isDirty = true;
			this.list.update();
			this._listChangeFn();
		}
	},

	openContextMenu (evt, listItem) {
	},

	_updateNoRunesVisible () {
		$(`#rigen__no-runes`).remove()
		if (!this.list.items.length) this.list._$wrpList.append(`<li id="rigen__no-runes" class="row"><a class="lst--border"><span><i class="ve-muted">Add runes to this item by clicking the button on the left.</i></span></a></li>`);
	},

	_updateAddSubtractButton (itemId) {
		const listHasNotId = this.list.items.findIndex(it => it.ix === itemId) === -1;
		// TODO: This is a hack. Fix it some time?
		$(`#rigen__add-subtract-btn-${itemId}`).remove();
		$(`<style id="rigen__add-subtract-btn-${itemId}" type='text/css'>
				#rigen__add-btn-${itemId} {
					display: ${listHasNotId ? "inline-block !important" : "none !important"}
				}
				#rigen__subtract-btn-${itemId} {
					display: ${listHasNotId ? "none !important" : "inline-block !important"}
				}
			</style>`).appendTo("head");
	},
};
