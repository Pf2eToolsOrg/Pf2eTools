"use strict";

class SpellsPage extends ListPage {
	constructor () {
		super({
			pageFilter: new PageFilterSpells(),
			sublistClass: "subspells",
			dataProp: ["spell"],
		});

		this._multiSource = new MultiSource({
			fnHandleData: this._addSpells.bind(this),
			prop: "spell",
		});

		this._addedHashes = new Set();

		this._spellBookView = null;
	}

	getListItem (spell, spI) {
		const hash = UrlUtil.autoEncodeHash(spell);
		if (!spell.uniqueId && this._addedHashes.has(hash)) return null;
		this._addedHashes.add(hash);
		const isExcluded = ExcludeUtil.isExcluded(spell.name, "spell", spell.source);

		this._pageFilter.mutateAndAddToFilters(spell, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(spell.source);
		const time = PageFilterSpells.getTblTimeStr(spell.cast);
		const school = Parser.spSchoolAbvToFull(spell.school);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-3-9 pl-0">${spell.name}</span>
			<span class="col-1-5 text-center">${Parser.spLevelToFull(spell.level)}</span>
			<span class="col-2-4 text-center">${time}</span>
			<span class="col-2-7 sp__school-${spell.school} text-center" title="${Parser.spSchoolAbvToFull(spell.school)}" ${Parser.spSchoolAbvToStyle(spell.school)}>${school}</span>
			<span class="col-1-5 text-center ${Parser.sourceJsonToColor(spell.source)} pr-0" title="${Parser.sourceJsonToFull(spell.source)}" ${BrewUtil.sourceJsonToStyle(spell.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			spI,
			eleLi,
			spell.name,
			{
				hash,
				source,
				level: spell.level,
				time,
				school: Parser.spSchoolAbvToFull(spell.school),
				normalisedTime: spell._normalisedTime,
			},
			{
				uniqueId: spell.uniqueId ? spell.uniqueId : spI,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._pageFilter.filterBox.getValues();
		this._list.filter(li => {
			const s = this._dataList[li.ix];
			return this._pageFilter.toDisplay(f, s);
		});
		MultiSource.onFilterChangeMulti(this._dataList);
	}

	getSublistItem (spell, pinId) {
		const hash = UrlUtil.autoEncodeHash(spell);
		const school = Parser.spSchoolAbvToShort(spell.school);
		const time = PageFilterSpells.getTblTimeStr(spell.cast);

		const $ele = $(`<li class="row">
			<a href="#${UrlUtil.autoEncodeHash(spell)}" title="${spell.name}" class="lst--border">
				<span class="bold col-6 pl-0">${spell.name}</span>
				<span class="capitalise col-1-5 text-center">${Parser.spLevelToFull(spell.level)}</span>
				<span class="col-2-9 text-center">${time}</span>
				<span class="capitalise col-1-6 sp__school_${spell.school} text-center" title="${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools)}" ${Parser.spSchoolAbvToStyle(spell.school)}>${school}</span>
			</a>
		</li>`).contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			spell.name,
			{
				hash,
				school,
				level: spell.level,
				time,
				normalisedTime: spell._normalisedTime,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const $content = $("#pagecontent").empty();
		const spell = this._dataList[id];

		function buildStatsTab () {
			$content.append(RenderSpells.$getRenderedSpell(spell));
		}

		const statTab = Renderer.utils.tabButton(
			"Spell",
			() => {},
			buildStatsTab,
		);

		Renderer.utils.bindTabButtons(statTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._pageFilter.filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub, pPreloadSublistSources);

		await this._spellBookView.pHandleSub(sub);
	}

	async pOnLoad () {
		window.loadHash = this.doLoadHash.bind(this);
		window.loadSubHash = this.pDoLoadSubHash.bind(this);

		await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $(`#filter-search-group`).title("Hotkey: f"),
			$btnReset: $(`#reset`),
		});

		await ExcludeUtil.pInitialise();
		await this._multiSource.pMultisourceLoad(
			"data/spells/",
			this._pageFilter.filterBox,
			this._pPageInit.bind(this),
			this._addSpells.bind(this),
			this._pPostLoad.bind(this),
		);
		if (Hist.lastLoadedId == null) Hist._freshLoad();
		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#pagecontent`));

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	static popoutHandlerGenerator (toList) {
		return (evt) => {
			if (Hist.lastLoadedId !== null) {
				const toRender = toList[Hist.lastLoadedId];

				if (evt.shiftKey) {
					const $content = Renderer.hover.$getHoverContent_statsCode(toRender);
					Renderer.hover.getShowWindow(
						$content,
						Renderer.hover.getWindowPositionFromEvent(evt),
						{
							title: `${toRender.name} \u2014 Source Data`,
							isPermanent: true,
							isBookContent: true,
						},
					);
				} else {
					Renderer.hover.doPopout(evt, toList, Hist.lastLoadedId);
				}
			}
		}
	}

	async _pPostLoad () {
		const homebrew = await BrewUtil.pAddBrewData();
		this._addSpells(homebrew.spell);
		BrewUtil.bind({
			list: this._list,
		});
		BrewUtil.makeBrewButton("manage-brew");
		BrewUtil.bind({
			filterBox: this._pageFilter.filterBox,
			sourceFilter: this._pageFilter.sourceFilter,
		});
		await ListUtil.pLoadState();
	}

	async _pPageInit (loadedSources) {
		Object.keys(loadedSources)
			.map(src => new FilterItem({item: src, pFnChange: this._multiSource.pLoadSource.bind(this._multiSource)}))
			.forEach(fi => this._pageFilter.sourceFilter.addItem(fi));

		this._list = ListUtil.initList({
			listClass: "spells",
			fnSort: PageFilterSpells.sortSpells,
			syntax: this._listSyntax,
		});
		ListUtil.setOptions({primaryLists: [this._list]});
		SortUtil.initBtnSortHandlers($(`#filtertools`), this._list);

		const $outVisibleResults = $(`.lst__wrp-search-visible`);
		this._list.on("updated", () => {
			$outVisibleResults.html(`${this._list.visibleItems.length}/${this._list.items.length}`);
		});

		// filtering function
		this._pageFilter.filterBox.on(
			FilterBox.EVNT_VALCHANGE,
			this.handleFilterChange.bind(this),
		);

		this._subList = ListUtil.initSublist({
			listClass: "subspells",
			fnSort: PageFilterSpells.sortSpells,
		});
		SortUtil.initBtnSortHandlers($("#sublistsort"), this._subList);
		ListUtil.initGenericPinnable();

		this._spellBookView = new BookModeView({
			hashKey: "bookview",
			$openBtn: $(`#btn-spellbook`),
			noneVisibleMsg: "If you wish to view multiple spells, please first make a list",
			pageTitle: "Spells Book View",
			popTblGetNumShown: ($wrpContent, $dispName, $wrpControls) => {
				const toShow = ListUtil.getSublistedIds().map(id => this._dataList[id])
					.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));

				const renderSpell = (stack, sp) => {
					stack.push(`<div class="bkmv__wrp-item"><div class="pf2-stat stats stats--book stats--bkmv">`);
					stack.push(Renderer.spell.getCompactRenderedString(sp));
					stack.push(`</div></div>`);
				};

				let lastOrder = StorageUtil.syncGetForPage(SpellsPage._BOOK_VIEW_MODE_K);
				if (lastOrder != null) lastOrder = `${lastOrder}`;

				const $selSortMode = $(`<select class="form-control input-sm">
				<option value="0">Spell Level</option>
				<option value="1">Alphabetical</option>
			</select>`)
					.change(() => {
						if (!toShow.length && Hist.lastLoadedId != null) return;

						const val = Number($selSortMode.val());
						if (val === 0) renderByLevel();
						else renderByAlpha();

						StorageUtil.syncSetForPage(SpellsPage._BOOK_VIEW_MODE_K, val);
					});
				if (lastOrder != null) $selSortMode.val(lastOrder);

				$$`<div class="flex-vh-center ml-3"><div class="mr-2 no-wrap">Sort order:</div>${$selSortMode}</div>`.appendTo($wrpControls);

				const renderByLevel = () => {
					const stack = [];
					for (let i = 0; i < 11; ++i) {
						const atLvl = toShow.filter(sp => sp.level === i);
						if (atLvl.length) {
							stack.push(`<div class="w-100 h-100 bkmv__no-breaks">`);
							stack.push(`<div class="pf2-h5 flex-v-center no-shrink">${Parser.spLevelToFullLevelText(i)}</div>`);
							atLvl.forEach(sp => renderSpell(stack, sp));
							stack.push(`</div>`);
						}
					}
					$wrpContent.empty().append(stack.join(""));
				};

				const renderByAlpha = () => {
					const stack = [];
					toShow.forEach(sp => renderSpell(stack, sp));
					$wrpContent.empty().append(stack.join(""));
				};

				const renderNoneSelected = () => {
					const stack = [];
					stack.push(`<div class="w-100 h-100 no-breaks">`);
					const sp = this._dataList[Hist.lastLoadedId];
					renderSpell(stack, sp);
					$dispName.text(Parser.spLevelToFullLevelText(sp.level));
					stack.push(`</div>`);
					$wrpContent.empty().append(stack.join(""));
				};

				if (!toShow.length && Hist.lastLoadedId != null) renderNoneSelected();
				else if (lastOrder === 1) renderByAlpha();
				else renderByLevel();

				return toShow.length;
			},
			hasPrintColumns: true,
		});

		return {list: this._list, subList: this._subList};
	}

	_addSpells (data) {
		if (!data || !data.length) return;

		this._dataList.push(...data);

		for (; this._ixData < this._dataList.length; this._ixData++) {
			const spell = this._dataList[this._ixData];
			const listItem = this.getListItem(spell, this._ixData);
			if (!listItem) continue;
			this._list.addItem(listItem);
		}
		this._list.update();

		this._pageFilter.filterBox.render();
		this.handleFilterChange();

		ListUtil.setOptions({
			itemList: this._dataList,
			getSublistRow: this.getSublistItem.bind(this),
			primaryLists: [this._list],
		});
		ListUtil.bindPinButton();
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
		Renderer.hover.bindPopoutButton($btnPop, this._dataList, SpellsPage.popoutHandlerGenerator.bind(SpellsPage), "Popout Window (SHIFT for Source Data)");
		UrlUtil.bindLinkExportButton(this._pageFilter.filterBox);
		ListUtil.bindOtherButtons({
			download: true,
			upload: {
				pFnPreLoad: pPreloadSublistSources,
			},
			sendToBrew: {
				mode: "spellBuilder",
				fnGetMeta: () => ({
					page: UrlUtil.getCurrentPage(),
					source: Hist.getHashSource(),
					hash: Hist.getHashParts()[0],
				}),
			},
		});
	}

	_getSearchCache (entity) {
		if (this.constructor._INDEXABLE_PROPS.every(it => !entity[it])) return "";
		const ptrOut = {_: ""};
		this.constructor._INDEXABLE_PROPS.forEach(it => this._getSearchCache_handleEntryProp(entity, it, ptrOut));
		return ptrOut._;
	}
}
SpellsPage._BOOK_VIEW_MODE_K = "bookViewMode";
SpellsPage._INDEXABLE_PROPS = [
	"entries",
	"heightened",
	"requirements",
	"trigger",
	"range",
	"area",
	"targets",
	"duration",
	"savingThrow",
];

async function pPreloadSublistSources (json) {
	const loaded = Object.keys(this._multiSource.loadedSources)
		.filter(it => this._multiSource.loadedSources[it].loaded);
	const lowerSources = json.sources.map(it => it.toLowerCase());
	const toLoad = Object.keys(this._multiSource.loadedSources)
		.filter(it => !loaded.includes(it))
		.filter(it => lowerSources.includes(it.toLowerCase()));
	const loadTotal = toLoad.length;
	if (loadTotal) {
		await Promise.all(toLoad.map(src => this._multiSource.pLoadSource(src, "yes")));
	}
}

async function pHandleUnknownHash (link, sub) {
	const src = Object.keys(spellsPage._multiSource.loadedSources)
		.find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		await spellsPage._multiSource.pLoadSource(src, "yes");
		Hist.hashChange();
	}
}

let spellsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	spellsPage = new SpellsPage();
	spellsPage.pOnLoad();
});
