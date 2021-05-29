"use strict";

class ArchetypesPage extends BaseComponent {
	constructor () {
		super();
		this.__archetypeId = {_: 0};
		this._archetypeId = this._getProxy("archetypeId", this.__archetypeId);

		this._list = null;
		this._ixData = 0;
		this._dataList = [];
		this._pageFilter = new PageFilterArchetypes();

		this._$divNoContent = null;

		this._activeArchetypeDataFiltered = null;
		this._activeFeatDataFiltered = null;

		this._loadFirstFeat = false;
		this._listFeat = null;
		this._ixFeatData = 0;
		this._featDataList = [];
		this._featFilter = new PageFilterFeats({
			typeFilterHidden: true,
			ancFilterHidden: true,
			archFilterHidden: true,
			classFilterHidden: true,
			skillFilterHidden: true,
			typeDeselFn: it => it === "Archetype",
		});
		this.__featId = {_: 0};
		this._featId = this._getProxy("featId", this.__featId);
	}

	get activeArchetype () {
		if (this._activeArchetypeDataFiltered) return this._activeArchetypeDataFiltered;
		return this.activeArchetypeRaw;
	}

	get activeArchetypeRaw () {
		return this._dataList[this._archetypeId._];
	}

	get activeFeat () {
		if (this._activeFeatDataFiltered) return this._activeFeatDataFiltered;
		return this.activeFeatRaw;
	}

	get activeFeatRaw () {
		return this._featDataList[this._featId._];
	}

	get filterBox () {
		return this._pageFilter.filterBox;
	}

	get featFilterBox () {
		return this._featFilter.filterBox;
	}

	async pOnLoad () {
		await ExcludeUtil.pInitialise();
		Omnisearch.addScrollTopFloat();
		const data = await DataUtil.archetype.loadJSON();
		const feats = await DataUtil.feat.loadJSON();
		this._featLookUp = {};
		feats.feat.forEach(feat => {
			const hash = UrlUtil.autoEncodeHash(feat);
			this._featLookUp[hash] = feat;
		});

		this._list = ListUtil.initList({listClass: "archetypes", isUseJquery: true, syntax: this._listSyntax});
		this._listFeat = ListUtil.initList({listClass: "feats", isUseJquery: true, syntax: this._listSyntax}, {input: "#feat-lst__search", glass: "#feat-lst__search-glass", reset: "#feat-reset"});
		ListUtil.setOptions({primaryLists: [this._list, this._listFeat]});
		SortUtil.initBtnSortHandlers($("#filtertools"), this._list);
		SortUtil.initBtnSortHandlers($("#feat-filtertools"), this._listFeat);
		this._list.on("updated", () => {
			$(`.lst__wrp-search-visible.archetypes`).html(`${this._list.visibleItems.length}/${this._list.items.length}`);
		});
		this._listFeat.on("updated", () => {
			$(`.lst__wrp-search-visible.feats`).html(`${this._listFeat.visibleItems.length}/${this._listFeat.items.length}`);
		});
		ListUtil._pBindSublistResizeHandlers($(`.feat-view--resizable`));
		const $filterSearch = $(`#filter-search-group`).title("Hotkey: f");

		await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $filterSearch,
			$btnReset: $(`#reset`),
		});
		await this._featFilter.pInitFilterBox({
			$iptSearch: $(`#feat-lst__search`),
			$wrpFormTop: $(`#feat-filter-search-group`),
			$btnReset: $(`#feat-reset`),
		});

		this._addData(data);
		this._addFeatsData(feats);

		BrewUtil.bind({
			filterBox: this.filterBox,
			sourceFilter: this._pageFilter.sourceFilter,
			list: this._list,
			pHandleBrew: this._pHandleBrew.bind(this),
		});

		const homebrew = await BrewUtil.pAddBrewData();
		await this._pHandleBrew(homebrew);
		await BrewUtil.pAddLocalBrewData();

		BrewUtil.makeBrewButton("manage-brew");
		await ListUtil.pLoadState();
		RollerUtil.addListRollButton(true, null, 0);
		RollerUtil.addListRollButton(true, {roll: "feat-feelinglucky", reset: "feat-reset", search: "feat-filter-search-group"}, 1);
		$filterSearch.find(`#reset`).after(`<button class="btn btn-default btn-xs" id="hidesearch">Hide</button>`);
		const $listcontainer = $(`#listcontainer`);
		$listcontainer.prepend(`<div class="col-12" id="showsearch"><button class="btn btn-block btn-default btn-xs" type="button">Show Filter</button><br></div>`);
		const $btnShowSearch = $(`div#showsearch`);
		const $btnHideSearch = $(`button#hidesearch`).title("Hide Archetypes Search Bar and Entry List");
		const $toHide = $listcontainer.children().not(`.feat-view`).not(`#showsearch`);
		$btnHideSearch.click(() => {
			$toHide.toggleClass("hidden", true);
			$btnShowSearch.toggleClass("block", true);
			$btnHideSearch.toggleClass("hidden", true);
		});
		$btnShowSearch.find("button").click(() => {
			$toHide.toggleClass("hidden", false);
			$btnShowSearch.toggleClass("block", false);
			$btnHideSearch.toggleClass("hidden", false);
		});

		window.onhashchange = this._handleHashChange.bind(this);

		this._list.init();
		this._listFeat.init();

		$(`.initial-message`).text(`Select an archetype from the list to view it here`);

		this._setArchetypeFromHash(Hist.initialLoad);
		this._setFeatArchetypeFilters()
		this._setFeatFromHash(Hist.initialLoad);
		this._setStateFromHash(Hist.initialLoad);

		const $tabsFeats = $(`#tabs-right-feats`);
		const $btnLink = $(`<a class="ui-tab__btn-tab-head btn btn-default" id="btn-feat-link"><span class="glyphicon glyphicon-list"></span></a>`).appendTo($tabsFeats);
		$btnLink.title("View this feat on the Feats page");
		const $btnPopFeats = $(`<a class="ui-tab__btn-tab-head btn btn-default" id="btn-popout-feat"><span class="glyphicon glyphicon-new-window"></span></a>`).appendTo($tabsFeats);
		const featPopoutHandlerGenerator = function (toList) {
			return (evt) => {
				const toRender = toList[archetypesPage._featId._];
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
				} else Renderer.hover.doPopout(evt, toList, archetypesPage._featId._, UrlUtil.PG_FEATS);
			}
		};
		const popoutHandlerGenerator = function (toList) {
			return (evt) => {
				const toRender = toList[archetypesPage._archetypeId._];
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
				} else Renderer.hover.doPopout(evt, toList, archetypesPage._archetypeId._);
			}
		};
		Renderer.hover.bindPopoutButton($btnPopFeats, this._featDataList, featPopoutHandlerGenerator, null, UrlUtil.PG_FEATS);
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
		Renderer.hover.bindPopoutButton($btnPop, this._dataList, popoutHandlerGenerator);
		UrlUtil.bindLinkExportButton(this.filterBox);

		await this._pInitAndRunRender();

		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#pagecontent`));
		ExcludeUtil.checkShowAllExcluded(this._featDataList, $(`#featstats`));
		// UrlUtil.bindLinkExportButton(this.filterBox, $(`#btn-link-export`));

		Hist.initialLoad = false;

		// Finally, ensure the hash correctly matches the state
		this._setHashFromState(true);

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pHandleBrew (homebrew) {
		const {archetype: rawArchetypeData} = homebrew;
		const cpy = MiscUtil.copy({archetype: rawArchetypeData});

		const isAddedAnyArchetype = this._addData(cpy);

		if (isAddedAnyArchetype && !Hist.initialLoad) await this._pDoRender();
	}

	_addData (data) {
		let isAddedAnyArchetype = false;

		if (data.archetype && data.archetype.length) (isAddedAnyArchetype = true) && this._addData_addArchetypeData(data.archetype)

		if (isAddedAnyArchetype) {
			this._list.update();
			this.filterBox.render();
			this._handleFilterChange(false);
		}

		return isAddedAnyArchetype
	}

	_addFeatsData (feats) {
		const arcFeats = feats.feat.filter(f => !!f.featType.archetype)
		arcFeats.forEach(f => {
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](f), "feat", f.source);
			this._featFilter.mutateAndAddToFilters(f, isExcluded)
		});
		this._featDataList.push(...arcFeats)

		const len = this._featDataList.length;
		for (; this._ixFeatData < len; this._ixFeatData++) {
			const it = this._featDataList[this._ixFeatData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](it), "feat", it.source);
			this._listFeat.addItem(this.getFeatListItem(it, this._ixFeatData, isExcluded));
		}

		this._listFeat.update();
		this.featFilterBox.render();
		this._handleFeatFilterChange();
	}

	_addData_addArchetypeData (archetypes) {
		const extraFeats = [];
		for (const arc of archetypes) {
			this._pageFilter.mutateForFilters(arc)
			this._featFilter._archetypeFilter.addItem(arc.name);
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ARCHETYPES](arc), "archetype", arc.source);
			this._pageFilter.addToFilters(arc, isExcluded);
			if (arc.extraFeats) {
				for (const ft of arc.extraFeats) {
					const [lvl, name, source] = ft.split("|");
					const hash = UrlUtil.encodeForHash([name, source]);
					const mutateExtraFeat = (feat) => {
						feat.level = Number(lvl);
						feat.featType.archetype = typeof feat.featType.archetype === "object" ? feat.featType.archetype : [];
						feat.featType.archetype.push(arc.name)
						feat._fType = ["Archetype"];
						feat.entries.push(`<br>{@note This version of {@feat ${feat.name}|${source}} is intended for use with the ${arc.name} Archetype. Its level has been changed accordingly.}`);
						this._featFilter.mutateForFilters(feat);
						return feat
					}
					const lookUp = MiscUtil.get(this._featLookUp, hash);
					if (lookUp) {
						extraFeats.push(mutateExtraFeat(MiscUtil.copy(lookUp)))
					} else {
						JqueryUtil.doToast({content: `Failed to load feat ${ft} in archetype ${arc.name}.`, type: "danger"})
					}
				}
			}
		}
		this._featDataList.push(...extraFeats);

		this._dataList.push(...archetypes);

		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ARCHETYPES](it), "archetype", it.source);
			this._list.addItem(this.getListItem(it, this._ixData, isExcluded));
		}
	}

	_initHashAndStateSync () {
		// Wipe all hooks, as we redo them for each class render
		this._resetHooks("state");
		this._resetHooksAll("state");
		this._resetHooks("archetypeId");
		// Don't reset hooksAll for archetypeId

		this._addHookAll("state", () => this._setHashFromState());
	}

	_setHashFromState (isSuppressHistory) {
		// During the initial load, force-suppress all changes
		if (isSuppressHistory === undefined) isSuppressHistory = Hist.initialLoad;

		const nxtHash = this._getHashState();
		const rawLocation = window.location.hash;
		const location = rawLocation[0] === "#" ? rawLocation.slice(1) : rawLocation;
		if (nxtHash !== location) {
			if (isSuppressHistory) Hist.replaceHistoryHash(nxtHash);
			else window.location.hash = nxtHash;
		}
	}

	_setFeatArchetypeFilters () {
		let names = [];
		names.push(this.activeArchetype.name);
		Object.keys(this._featFilter._archetypeFilter.getValues().Archetypes).forEach(key => {
			if (!key.startsWith("_")) this._featFilter._archetypeFilter.setValue(key, 2);
		});
		names.forEach(name => { this._featFilter._archetypeFilter.setValue(name, 1) });
		this._handleFeatFilterChange();
	}

	_handleHashChange () {
		// Parity with the implementation in hist.js
		if (Hist.isHistorySuppressed) return Hist.setSuppressHistory(false);

		this._setArchetypeFromHash();
		this._setFeatArchetypeFilters();
		this._setFeatFromHash();
		this._setStateFromHash();
	}

	_setArchetypeFromHash (isInitialLoad) {
		const [[link], _] = Hist.getDoubleHashParts();

		let ixToLoad;

		if (link === HASH_BLANK) ixToLoad = -1;
		else {
			const listItem = Hist.getActiveListItem(link);

			if (listItem == null) ixToLoad = -1;
			else {
				const toLoad = listItem.ix;
				if (toLoad == null) ixToLoad = -1;
				else ixToLoad = listItem.ix;
			}
		}

		if (!~ixToLoad && this._list.visibleItems.length) ixToLoad = this._list.visibleItems[0].ix;

		if (~ixToLoad) {
			const target = isInitialLoad ? this.__archetypeId : this._archetypeId;
			if (target._ !== ixToLoad) {
				Hist.lastLoadedId = ixToLoad;
				const arc = this._dataList[ixToLoad];
				document.title = `${arc ? arc.name : "Archetypes"} - Pf2eTools`;
				target._ = ixToLoad;
				this._loadFirstFeat = true;
			}
		} else {
			// This should never occur (failed loads should pick the first list item), but attempt to handle it semi-gracefully
			$(`#pagecontent`).empty().append(ArchetypesPage._render_$getNoContent());
			JqueryUtil.doToast({content: "Could not find the archetype to load!", type: "error"})
		}
	}

	_setFeatFromHash (isInitialLoad) {
		const [_, [link]] = Hist.getDoubleHashParts();

		let ixToLoad;

		if (link === HASH_BLANK) ixToLoad = -1;
		else if (this._loadFirstFeat && this._listFeat.visibleItems.length) {
			ixToLoad = this._listFeat.visibleItems[0].ix;
			this._loadFirstFeat = false;
		} else {
			const listItem = Hist.getActiveListItem(link);

			if (listItem == null) ixToLoad = -1;
			else {
				const toLoad = listItem.ix;
				if (toLoad == null) ixToLoad = -1;
				else ixToLoad = listItem.ix;
			}
		}

		if (!~ixToLoad && this._listFeat.visibleItems.length) ixToLoad = this._listFeat.visibleItems[0].ix;

		if (~ixToLoad) {
			const target = isInitialLoad ? this.__featId : this._featId;
			if (target._ !== ixToLoad) {
				Hist.lastLoadedId = ixToLoad;
				target._ = ixToLoad;
			}
		} else {
			// This should never occur (failed loads should pick the first list item), but attempt to handle it semi-gracefully
			$(`#featstats`).empty().append($(`<div class="pf2-h1-flavor text-center">Select a feat from the list to view it here</div>`));
			JqueryUtil.doToast({content: "Could not find the feat to load!", type: "error"})
		}
	}

	_setStateFromHash (isInitialLoad) {
		let [[arcH, ...subs], [ftH, ...ftSubs]] = Hist.getDoubleHashParts();
		if (arcH === "" && !subs.length) return;
		subs = this.filterBox.setFromSubHashes(subs);
		ftSubs = this.featFilterBox.setFromSubHashes(ftSubs);

		const target = isInitialLoad ? this.__state : this._state;

		if (!subs.length) this.__state.feature = null;

		if (this._getHashState() === subs.join(HASH_PART_SEP)) return;

		const requiredSources = new Set();

		const seenKeys = new Set();
		subs.forEach(sub => {
			const unpacked = UrlUtil.unpackSubHash(sub);
			if (!unpacked.state) return;
			unpacked.state.map(it => {
				let [k, v] = it.split("=");
				k = k.toLowerCase();
				v = UrlUtil.mini.decompress(v);
				if (k.startsWith("h")) { // heritage selection state keys
					if (validHLookup[k]) {
						if (target[k] !== v) target[k] = v;
						requiredSources.add(validHLookup[k].source);
						seenKeys.add(k);
					}
				} else { // known classes page state keys
					const knownKey = Object.keys(ArchetypesPage._DEFAULT_STATE).find(it => it.toLowerCase() === k);
					if (knownKey) {
						if (target[knownKey] !== v) target[knownKey] = v;
						seenKeys.add(knownKey);
					}
				} // else discard it
			});
		});

		Object.entries(ArchetypesPage._DEFAULT_STATE).forEach(([k, v]) => {
			// If we did not have a value for it, and the current state doesn't match the default, reset it
			if (!seenKeys.has(k) && v !== target[k]) target[k] = v;
		});

		if (requiredSources.size) {
			const sourceFilterValues = this._pageFilter.sourceFilter.getValues().Source;
			if (sourceFilterValues._isActive) {
				// If the filter includes "blue" values, set our sources to be included
				if (sourceFilterValues._totals.yes > 0) {
					requiredSources.forEach(source => this._pageFilter.sourceFilter.setValue(source, 1));
				} else { // if there are only "red"s active, disable them for our sources
					requiredSources.forEach(source => {
						if (sourceFilterValues[source] !== 0) this._pageFilter.sourceFilter.setValue(source, 0);
					});
				}
			}
		}

		if (!isInitialLoad) this._setHashFromState();
	}

	/**
	 * @param [opts] Options object.
	 * @param [opts.archetype] Archetype to convert to hash.
	 * @param [opts.feat] Feat to convert to hash.
	 * @param [opts.state] State to convert to hash.
	 */
	_getHashState (opts) {
		opts = opts || {};

		let fromState = opts.state || MiscUtil.copy(this.__state);
		let arc = opts.archetype || this.activeArchetype;
		let feat = opts.feat || this.activeFeat;

		// region archetype
		let primaryHash = arc ? UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ARCHETYPES](arc) : null;
		if (!primaryHash) {
			const firstItem = this._list.items[0];
			primaryHash = firstItem ? firstItem.values.hash : HASH_BLANK;
		}
		// endregion

		// region feats
		let featHash = arc ? UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat) : null;
		if (!featHash) {
			const firstItem = this._listFeat.items[0];
			primaryHash = firstItem ? firstItem.values.hash : HASH_BLANK;
		}
		// endregion

		// region state
		const stateParts = Object.entries(fromState)
			.filter(([k, v]) => ArchetypesPage._DEFAULT_STATE[k] !== v) // ignore any default values
			.filter(([k, v]) => !(ArchetypesPage._DEFAULT_STATE[k] === undefined && !v)) // ignore any falsey values which don't have defaults
			.map(([k, v]) => `${k}=${UrlUtil.mini.compress(v)}`);
		const stateHash = stateParts.length ? UrlUtil.packSubHash("state", stateParts) : "";
		// endregion

		const hashPartsArc = [
			primaryHash,
			stateHash,
		].filter(Boolean);
		const hashPartsFeat = [
			featHash,
		].filter(Boolean);
		const hashParts = [
			Hist.util.getCleanHash(hashPartsArc.join(HASH_PART_SEP)),
			Hist.util.getCleanHash(hashPartsFeat.join(HASH_PART_SEP)),
		].filter(Boolean)
		return hashParts.join("#")
	}

	getListItem (arc, ancI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(arc);
		const source = Parser.sourceJsonToAbv(arc.source);

		const $lnk = $(`<a href="#${hash}" class="lst--border">
			<span class="bold col-8 pl-0">${arc.name}</span>
			<span class="col-4 text-center ${Parser.sourceJsonToColor(arc.source)} pr-0" title="${Parser.sourceJsonToFull(arc.source)}" ${BrewUtil.sourceJsonToStyle(arc.source)}>${source}</span>
		</a>`);

		const $ele = $$`<li class="row ${isExcluded ? "row--blacklisted" : ""}">${$lnk}</li>`;

		return new ListItem(
			ancI,
			$ele,
			arc.name,
			{
				hash,
				source,
			},
			{
				$lnk,
				entity: arc,
				uniqueId: arc.uniqueId ? arc.uniqueId : ancI,
				isExcluded,
			},
		);
	}

	getFeatListItem (feat, featI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(feat);
		const source = Parser.sourceJsonToAbv(feat.source);

		const $lnk = $(`<a href="##${hash}" class="lst--border">
			<span class="bold col-5 pl-0">${feat.name}</span>
			<span class="col-1-5 text-center">${Parser.getOrdinalForm(feat.level)}</span>
			<span class="col-4 text-center">${feat._slPrereq}</span>
			<span class="col-1-5 text-center ${Parser.sourceJsonToColor(feat.source)} pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${BrewUtil.sourceJsonToStyle(feat.source)}>${source}</span>
		</a>`);

		const $ele = $$`<li class="row ${isExcluded ? "row--blacklisted" : ""}">${$lnk}</li>`;

		return new ListItem(
			featI,
			$ele,
			feat.name,
			{
				hash,
				source,
				level: feat.level,
				prerequisites: feat._slPrereq,
			},
			{
				$lnk,
				entity: feat,
				uniqueId: feat.uniqueId ? feat.uniqueId : featI,
				isExcluded,
			},
		);
	}

	_doGenerateFilteredActiveArchetypeData () {
		const f = this.filterBox.getValues();
		const cpyAnc = MiscUtil.copy(this.activeArchetypeRaw);
		const walker = MiscUtil.getWalker({
			keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST,
			isAllowDeleteObjects: true,
			isDepthFirst: true,
		});

		this._activeArchetypeDataFiltered = cpyAnc
	}

	_handleFilterChange (isFilterValueChange) {
		// If the filter values changes (i.e. we're not handling an initial load), mutate the state, and trigger a
		//   re-render.
		if (isFilterValueChange) {
			this._doGenerateFilteredActiveArchetypeData();
			this._pDoSynchronizedRender();
			return;
		}

		const f = this.filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, item.data.entity, [], null));

		if (this._fnOutlineHandleFilterChange) this._fnOutlineHandleFilterChange();
		if (this._fnTableHandleFilterChange) this._fnTableHandleFilterChange(f);
		this._updateFeatHref();
	}

	_handleFeatFilterChange () {
		const f = this.featFilterBox.getValues();
		this._listFeat.filter(item => {
			return this._featFilter.toDisplay(f, item.data.entity)
		});
		FilterBox.selectFirstVisible(this._featDataList);
		this._updateFeatHref();
	}

	async _pInitAndRunRender () {
		this._$wrpOutline = $(`#sticky-nav`);

		// Use hookAll to allow us to reset temp hooks on the property itself
		this._addHookAll("archetypeId", async () => {
			this._doGenerateFilteredActiveArchetypeData();
			await this._pDoSynchronizedRender();
		});

		this._addHookAll("featId", async () => {
			await this._pDoSynchronizedRender();
		});

		this._doGenerateFilteredActiveArchetypeData();
		await this._pDoRender();
	}

	async _pDoSynchronizedRender () {
		await this._pLock("render");
		try {
			await this._pDoRender();
		} finally {
			this._unlock("render");
		}
	}

	async _pDoRender () {
		// reset all hooks in preparation for rendering
		this._initHashAndStateSync();
		this.filterBox
			.off(FilterBox.EVNT_VALCHANGE)
			.on(FilterBox.EVNT_VALCHANGE, () => this._handleFilterChange(true));

		this.featFilterBox
			.off(FilterBox.EVNT_VALCHANGE)
			.on(FilterBox.EVNT_VALCHANGE, () => this._handleFeatFilterChange());

		// region bind list updates
		const hkSetHref = () => {
			// defer this for performance
			setTimeout(() => {
				this._list.items
					.filter(it => it.data.$lnk)
					.forEach(it => {
						const href = `#${this._getHashState({archetype: it.data.entity, feat: ""})}`;
						it.data.$lnk.attr("href", href)
					});
				this._listFeat.items
					.filter(it => it.data.$lnk)
					.forEach(it => {
						const href = `#${this._getHashState({feat: it.data.entity})}`;
						it.data.$lnk.attr("href", href)
					});
			}, 5);
		};
		this._addHook("archetypeId", "_", hkSetHref);
		this._addHook("featId", "_", hkSetHref);
		this._addHookAll("state", hkSetHref);
		hkSetHref();
		// endregion

		// region rendering
		this._render_renderArchetype();
		this._render_renderFeat();
		// endregion

		const hkShowFeats = () => {
			if (this._state.isShowFeats) {
				$(`.feat-view--inactive`).toggleClass("feat-view--active", true).toggleClass("feat-view--inactive", false);
				const $featView = $(`.feat-view--resizable`)
				if (!$featView.attr("style")) $featView.height(Math.min($featView.height() + 25, $(window).height() * 0.5));
			} else {
				$(`.feat-view--active`).toggleClass("feat-view--active", false).toggleClass("feat-view--inactive", true);
			}
		};
		this._addHookBase("isShowFeats", hkShowFeats);
		MiscUtil.pDefer(hkShowFeats);
		const $wrpButtons = $(`#toggle-feats`).empty();
		const $btnToggleFeats = ComponentUiUtil.$getBtnBool(this, "isShowFeats", {
			text: "Show Feats",
			activeClass: "btn-danger",
			activeText: "Hide Feats",
			inactiveText: "Show Feats",
		}).title("Toggle Feat View");
		$btnToggleFeats.prependTo($wrpButtons);

		this._handleFilterChange(false);
		this._handleFeatFilterChange();
	}

	_render_renderArchetype () {
		const $archetypeStats = $(`#pagecontent`).empty();
		const arc = this.activeArchetype;

		const buildStatsTab = () => {
			const renderer = Renderer.get().resetHeaderIndex().setFirstSection(true);
			const archetypeEntry = {
				type: "pf2-h2",
				name: arc.name,
				entries: arc.entries,
			}

			$$`${renderer.render(archetypeEntry)}
		${Renderer.utils.getPageP(arc)}`.appendTo($archetypeStats);
		}
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules("archetype");
			$archetypeStats.append(quickRules);
		}

		const statsTab = Renderer.utils.tabButton(
			"Archetype",
			() => {},
			buildStatsTab,
		);

		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		Renderer.utils.bindTabButtons(statsTab, infoTab);

		$archetypeStats.show()
	}

	_render_renderFeat () {
		const $featStats = $(`#featstats`).empty();
		const feat = this.activeFeat;
		RenderFeats.$getRenderedFeat(feat).appendTo($featStats);
		$featStats.show();
		this._updateFeatHref();
	}

	_updateFeatHref () {
		const feat = this.activeFeat;
		if (!feat) return;
		$(`#btn-feat-link`).attr("href", `feats.html#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat)}${HASH_PART_SEP}${this.featFilterBox.getSubHashes().join(HASH_PART_SEP)}`);
	}

	static _render_$getNoContent () {
		return $(`<div class="pf2-h1-flavor text-center">Select an archetype from the list to view it here</div>`)
	}

	_getDefaultState () {
		return MiscUtil.copy(ArchetypesPage._DEFAULT_STATE);
	}
}

ArchetypesPage._DEFAULT_STATE = {
	isShowFeats: false,
};

let archetypesPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	archetypesPage = new ArchetypesPage();
	archetypesPage.pOnLoad()
});
