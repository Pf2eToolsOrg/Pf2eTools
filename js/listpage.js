"use strict";

class ListPage {
	/**
	 * @param opts Options object.
	 * @param opts.dataSource Main JSON data url or function to fetch main data.
	 * @param [opts.dataSourceFluff] Fluff JSON data url or function to fetch fluff data.
	 * @param opts.filters Array of filters to use in the filter box.
	 * @param opts.filterSource Source filter.
	 * @param opts.listClass List class.
	 * @param opts.listOptions Other list options.
	 * @param opts.sublistClass Sublist class.
	 * @param opts.sublistOptions Other sublist options.
	 * @param opts.dataProps JSON data propert(y/ies).
	 * @param [opts.bookViewOptions] Book view options.
	 * @param [opts.tableViewOptions] Table view options.
	 * @param [opts.hasAudio] True if the entities have pronunciation audio.
	 */
	constructor (opts) {
		this._dataSource = opts.dataSource;
		this._dataSourcefluff = opts.dataSourceFluff;
		this._filters = opts.filters;
		this._filterSource = opts.filterSource;
		this._listClass = opts.listClass;
		this._listOptions = opts.listOptions || {};
		this._sublistClass = opts.sublistClass;
		this._sublistOptions = opts.sublistOptions || {};
		this._dataProps = opts.dataProps;
		this._bookViewOptions = opts.bookViewOptions;
		this._tableViewOptions = opts.tableViewOptions;
		this._hasAudio = opts.hasAudio;

		this._renderer = Renderer.get();
		this._list = null;
		this._listSub = null;
		this._filterBox = null;
		this._dataList = [];
		this._ixData = 0;
		this._bookView = null;
	}

	async pOnLoad () {
		await ExcludeUtil.pInitialise();
		const data = typeof this._dataSource === "string" ? await DataUtil.loadJSON(this._dataSource) : await this._dataSource();

		this._list = ListUtil.initList({
			$wrpList: $(`ul.list.${this._listClass}`),
			...this._listOptions
		});
		ListUtil.setOptions({primaryLists: [this._list]});
		SortUtil.initBtnSortHandlers($("#filtertools"), this._list);

		this._filterBox = await pInitFilterBox({
			filters: this._filters
		});

		const $outVisibleResults = $(`.lst__wrp-search-visible`);
		this._list.on("updated", () => $outVisibleResults.html(`${this._list.visibleItems.length}/${this._list.items.length}`));

		$(this._filterBox).on(FilterBox.EVNT_VALCHANGE, this.handleFilterChange.bind(this));

		this._listSub = ListUtil.initSublist({
			listClass: this._sublistClass,
			getSublistRow: this.getSublistItem.bind(this),
			...this._sublistOptions
		});
		ListUtil.initGenericPinnable();
		SortUtil.initBtnSortHandlers($("#sublistsort"), this._listSub);

		this._addData(data);

		BrewUtil.bind({
			filterBox: this._filterBox,
			sourceFilter: this._filterSource,
			list: this._list,
			pHandleBrew: async homebrew => this._addData(homebrew)
		});

		try {
			const homebrew = await BrewUtil.pAddBrewData();
			await this._pHandleBrew(homebrew);
			await BrewUtil.pAddLocalBrewData();
		} catch (e) {
			BrewUtil.pPurgeBrew(e);
		}

		BrewUtil.makeBrewButton("manage-brew");
		await ListUtil.pLoadState();
		RollerUtil.addListRollButton();
		ListUtil.addListShowHide();
		if (this._hasAudio) Renderer.utils.bindPronounceButtons();

		if (this._bookViewOptions) {
			this._bookView = new BookModeView(
				"bookview",
				this._bookViewOptions.$btnOpen,
				this._bookViewOptions.noneVisibleMsg,
				this._bookViewOptions.pageTitle || "Book View",
				this._bookViewOptions.popTblGetNumShown,
				true
			);
		}

		// bind hash-change functions for hist.js to use
		window.loadHash = this.doLoadHash.bind(this);
		window.loadSubHash = this.doLoadSubHash.bind(this);

		this._list.init();
		this._listSub.init();

		Hist.init(true);
		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#pagecontent`));
	}

	async _pHandleBrew (homebrew) {
		this._addData(homebrew);
	}

	_addData (data) {
		if (!this._dataProps.some(prop => data[prop] && data[prop].length)) return;

		this._dataProps.forEach(prop => {
			data[prop].forEach(it => it.__prop = prop);
			this._dataList = this._dataList.concat(data[prop]);
		});

		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			if (ExcludeUtil.isExcluded(it.name, it.__prop, it.source)) continue;
			this._list.addItem(this.getListItem(it, this._ixData));
		}

		this._list.update();
		this._filterBox.render();
		this.handleFilterChange();

		ListUtil.setOptions({
			itemList: this._dataList,
			primaryLists: [this._list]
		});
		ListUtil.bindPinButton();
		Renderer.hover.bindPopoutButton(this._dataList);
		UrlUtil.bindLinkExportButton(this._filterBox);
		ListUtil.bindDownloadButton();
		ListUtil.bindUploadButton();

		if (this._tableViewOptions) {
			ListUtil.bindShowTableButton(
				"btn-show-table",
				this._tableViewOptions.title,
				this._dataList,
				this._tableViewOptions.colTransforms,
				this._tableViewOptions.filter,
				this._tableViewOptions.sorter
			);
		}
	}

	getListItem () { throw new Error(`Unimplemented!`); }
	handleFilterChange () { throw new Error(`Unimplemented!`); }
	getSublistItem () { throw new Error(`Unimplemented!`); }
	doLoadHash () { throw new Error(`Unimplemented!`); }
	doLoadSubHash () { throw new Error(`Unimplemented!`); }
}
