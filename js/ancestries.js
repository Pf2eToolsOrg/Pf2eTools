"use strict";

class AncestriesPage extends BaseComponent {
	static _ascSortHeritages (hA, hB) {
		return SortUtil.ascSortLower(hA.name, hB.name)
	}

	static _fnSortHeritageFilterItems (a, b) {
		if (a.values.isAlwaysVisible) return 1;
		else if (b.values.isAlwaysVisible) return -1;
		else if (a.values.versatile) return 1;
		else if (b.values.versatile) return -1;
		else return SortUtil.listSort(a, b);
	}

	constructor () {
		super();
		this.__ancestryId = {_: 0};
		this._ancestryId = this._getProxy("ancestryId", this.__ancestryId);

		this._list = null;
		this._ixData = 0;
		this._dataList = [];
		this._lastScrollFeature = null;
		this._pageFilter = new PageFilterAncestries();

		this._listHeritage = null;
		this._listVeHeritage = null;
		this._veHeritagesDataList = [];

		this._$divNoContent = null;
		this._$divNoHeritage = null;
		this._rng = RollerUtil.roll(1234) + 5678;

		this._activeAncestryDataFiltered = null;
		this._activeFeatDataFiltered = null;

		this._didLoadNewAnc = false;
		this._listFeat = null;
		this._ixFeatData = 0;
		this._featDataList = [];
		this._featFilter = new PageFilterFeats({
			typeDeselFn: it => it === "Ancestry",
			sourceFilterOpts: {
				selFn: it => !SourceUtil.isNonstandardSource(it),
			},
		});
		this.__featId = {_: 0};
		this._featId = this._getProxy("featId", this.__featId);
	}

	get activeAncestry () {
		if (this._activeAncestryDataFiltered) return this._activeAncestryDataFiltered;
		return this.activeAncestryRaw;
	}

	get activeAncestryRaw () {
		return this._dataList[this._ancestryId._];
	}

	get activeAncestryAllHeritages () {
		return this.activeAncestry.heritage.concat(this._veHeritagesDataList)
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
		const data = await DataUtil.ancestry.loadJSON();
		const feats = await DataUtil.feat.loadJSON();

		this._list = ListUtil.initList({listClass: "ancestries", isUseJquery: true, syntax: this._listSyntax});
		this._listFeat = ListUtil.initList({listClass: "feats", isUseJquery: true, syntax: this._listSyntax}, {input: "#feat-lst__search", glass: "#feat-lst__search-glass", reset: "#feat-reset"});
		ListUtil.setOptions({primaryLists: [this._list, this._listFeat]});
		SortUtil.initBtnSortHandlers($("#filtertools"), this._list);
		SortUtil.initBtnSortHandlers($("#feat-filtertools"), this._listFeat);

		await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $(`#filter-search-group`).title("Hotkey: f"),
			$btnReset: $(`#reset`),
			namespace: "ancestries.ancestries",
		});
		await this._featFilter.pInitFilterBox({
			$iptSearch: $(`#feat-lst__search`),
			$wrpFormTop: $(`#feat-filter-search-group`),
			$btnReset: $(`#feat-reset`),
			namespace: "ancestries.feats",
		});

		this._addData(data);
		this._addFeatsData(feats);

		BrewUtil.bind({
			filterBoxes: [this.filterBox, this.featFilterBox],
			sourceFilters: [this._pageFilter.sourceFilter, this._featFilter.sourceFilter],
			lists: [this._list, this._listFeat],
			pHandleBrew: this._pHandleBrew.bind(this),
		});

		const homebrew = await BrewUtil.pAddBrewData();
		await this._pHandleBrew(homebrew);
		await BrewUtil.pAddLocalBrewData();

		BrewUtil.makeBrewButton("manage-brew");
		await ListUtil.pLoadState();
		RollerUtil.addListRollButton(true, null, 0);
		RollerUtil.addListRollButton(true, {roll: "feat-feelinglucky", reset: "feat-reset", search: "feat-filter-search-group"}, 1);

		window.onhashchange = this._handleHashChange.bind(this);

		this._list.init();
		this._listFeat.init();

		$(`.initial-message`).text(`Select an ancestry from the list to view it here`);

		this._setAncestryFromHash(Hist.initialLoad);
		this._setFeatAncestryFilters()
		this._setFeatFromHash(Hist.initialLoad);
		this._setStateFromHash(Hist.initialLoad);

		const $btnLink = ListUtil.getOrTabRightButton(`btn-feat-link`, `list`, "a");
		$btnLink.title("View this feat on the Feats page");
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
		Renderer.hover.bindPopoutButton($btnPop, this._featDataList, null, null, UrlUtil.PG_FEATS);

		await this._pInitAndRunRender();

		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#ancestrystats`));
		ExcludeUtil.checkShowAllExcluded(this._featDataList, $(`#featstats`));
		this._initLinkGrabbers();
		UrlUtil.bindLinkExportButtonMulti(this.filterBox, $(`#btn-link-export-anc`));

		Hist.initialLoad = false;

		// Finally, ensure the hash correctly matches the state
		this._setHashFromState(true);

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pHandleBrew (homebrew) {
		const {ancestry: rawAncestryData, heritage: rawHeritageData, versatileHeritage: rawVeHeritageData, feat: rawFeatData} = homebrew;
		const cpy = MiscUtil.copy({ancestry: rawAncestryData, heritage: rawHeritageData, versatileHeritage: rawVeHeritageData, feat: rawFeatData});

		const {isAddedAnyAncestry, isAddedAnyHeritage} = this._addData(cpy);
		const isAddedAnyFeats = this._addFeatsData(cpy);

		if ((isAddedAnyFeats || isAddedAnyHeritage) && !Hist.initialLoad) await this._pDoRender();
	}

	_addData (data) {
		let isAddedAnyAncestry = false;
		let isAddedAnyHeritage = false;

		if (data.ancestry && data.ancestry.length) (isAddedAnyAncestry = true) && this._addData_addAncestryData(data.ancestry)
		if (data.heritage && data.heritage.length) (isAddedAnyHeritage = true) && this._addData_addHeritageData(data.heritage)
		if (data.versatileHeritage && data.versatileHeritage.length) (isAddedAnyHeritage = true) && this._addData_addVeHeritageData(data.versatileHeritage)

		if (isAddedAnyAncestry || isAddedAnyHeritage) {
			this._list.update();
			this.filterBox.render();
			this._handleFilterChange(false);
		}

		return {isAddedAnyAncestry, isAddedAnyHeritage}
	}

	_addFeatsData (feats) {
		if (!(feats.feat && feats.feat.length)) return false;
		feats.feat.forEach(f => {
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](f), "feat", f.source);
			this._featFilter.mutateAndAddToFilters(f, isExcluded)
		});
		this._featDataList.push(...feats.feat)

		const len = this._featDataList.length;
		for (; this._ixFeatData < len; this._ixFeatData++) {
			const it = this._featDataList[this._ixFeatData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](it), "feat", it.source);
			this._listFeat.addItem(this.getFeatListItem(it, this._ixFeatData, isExcluded));
		}

		this._listFeat.update();
		this.featFilterBox.render();
		this._handleFeatFilterChange();

		return true;
	}

	_addData_addAncestryData (ancestries) {
		ancestries.forEach(anc => {
			this._pageFilter.mutateForFilters(anc)

			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ANCESTRIES](anc), "ancestry", anc.source);

			const heritageExclusions = {};
			(anc.heritage || []).forEach(h => {
				if (isExcluded) return;

				(heritageExclusions[h.source] = heritageExclusions[h.source] || {})[h.name] = heritageExclusions[h.source][h.name] || ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ANCESTRIES](h), "heritage", h.source);
			});

			this._pageFilter.addToFilters(anc, isExcluded, {heritageExclusions});
		});

		ancestries.filter(anc => SourceUtil.isNonstandardSource(anc.source) || BrewUtil.hasSourceJson(anc.source))
			.forEach(anc => {
				if (anc.fluff) anc.fluff.filter(f => f.source === anc.source).forEach(f => f._isStandardSource = true);
				if (anc.heritage) anc.heritage.filter(h => h.source === anc.source).forEach(h => h._isStandardSource = true);
			});

		ancestries.filter(anc => anc.heritage).forEach(anc => anc.heritage.sort(AncestriesPage._ascSortHeritages));

		this._dataList.push(...ancestries);

		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ANCESTRIES](it), "ancestry", it.source);
			this._list.addItem(this.getListItem(it, this._ixData, isExcluded));
		}
	}

	_addData_addHeritageData (heritages) {
		let isBlankSourceFilter;
		if (!Hist.initialLoad) {
			isBlankSourceFilter = !this._pageFilter.sourceFilter.getValues()._isActive;
		}

		heritages.forEach(h => {
			const anc = this._dataList.find(c => c.name.toLowerCase() === h.ancestryName.toLowerCase() && c.source.toLowerCase() === (h.ancestrySource || SRC_CRB).toLowerCase());
			if (!anc) {
				JqueryUtil.doToast({
					content: `Could not add heritage; could not find ancestry with name: ${anc.name} and source ${h.source || SRC_CRB}`,
					type: "danger",
				});
				return;
			}

			// Avoid re-adding existing brew subclasses
			const existingBrewH = h.uniqueId ? anc.heritage.find(it => it.uniqueId === h.uniqueId) : null;
			if (existingBrewH) return;

			const isExcludedAncestry = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ANCESTRIES](anc), "ancestry", anc.source);

			anc.heritage.push(h);
			// Don't bother checking subclass exclusion for individually-added subclasses, as they should be from homebrew
			this._pageFilter.mutateAndAddToFilters(anc, isExcludedAncestry);
			anc.heritage.sort(AncestriesPage._ascSortHeritages);
		});

		// If we load a homebrew source when we have no source filters active, the homebrew source will set itself high
		//   and force itself as the only visible source. Fix it in post.
		if (isBlankSourceFilter) this._pageFilter.sourceFilter.doSetPillsClear();
	}

	_addData_addVeHeritageData (heritages) {
		this._veHeritagesDataList.push(...heritages)
		heritages.forEach(h => this._pageFilter._sourceFilter.addItem(h.source))
	}

	_initHashAndStateSync () {
		// Wipe all hooks, as we redo them for each class render
		this._resetHooks("state");
		this._resetHooksAll("state");
		this._resetHooks("ancestryId");
		// Don't reset hooksAll for ancestryId

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

	_setFeatAncestryFilters () {
		let names = this._getActiveHeritages().map(it => it.name);
		names.push(...this._getActiveHeritages().map(it => it.traits).filter(Boolean).flat())
		names.push(this.activeAncestry.name);
		Object.keys(this._featFilter._ancestryFilter.getValues().Ancestries).forEach(key => {
			if (!key.startsWith("_")) this._featFilter._ancestryFilter.setValue(key, 0)
		});
		names.forEach(name => { this._featFilter._ancestryFilter.setValue(name, 1) });
		this._handleFeatFilterChange();
	}

	_handleHashChange () {
		// Parity with the implementation in hist.js
		if (Hist.isHistorySuppressed) return Hist.setSuppressHistory(false);

		const doSetFeatFilters = Hist.getDoubleHashParts()[0][0].toLowerCase() !== UrlUtil.autoEncodeHash(this.activeAncestry).toLowerCase();
		this._setAncestryFromHash();
		if (doSetFeatFilters) this._setFeatAncestryFilters();
		this._setFeatFromHash();
		this._setStateFromHash();
	}

	_setAncestryFromHash (isInitialLoad) {
		const [[link], _] = Hist.getDoubleHashParts();

		let ixToLoad;

		this._didLoadNewAnc = false;

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
			const target = isInitialLoad ? this.__ancestryId : this._ancestryId;
			if (target._ !== ixToLoad) {
				Hist.lastLoadedId = ixToLoad;
				const anc = this._dataList[ixToLoad];
				document.title = `${anc ? anc.name : "Ancestries"} - Pf2eTools`;
				target._ = ixToLoad;
				this._didLoadNewAnc = true;
				this._rng = RollerUtil.roll(1234) + 5678;
			}
		} else {
			// This should never occur (failed loads should pick the first list item), but attempt to handle it semi-gracefully
			$(`#ancestrystats`).empty().append(AncestriesPage._render_$getNoContent());
			JqueryUtil.doToast({content: "Could not find the ancestry to load!", type: "error"})
		}
	}

	_setFeatFromHash (isInitialLoad) {
		const [_, [link]] = Hist.getDoubleHashParts();

		let ixToLoad;

		if (link === HASH_BLANK) ixToLoad = -1;
		else if (!isInitialLoad && this._didLoadNewAnc && this._listFeat.visibleItems.length) {
			ixToLoad = this._listFeat.visibleItems[0].ix;
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
			// FIXME: Happens with homebrew as their source is not auto-loaded
			$(`#featstats`).empty().append(AncestriesPage._render_$getNoContent());
			JqueryUtil.doToast({content: "Could not find the feat to load!", type: "danger"})
		}
	}

	_setStateFromHash (isInitialLoad) {
		let [[ancH, ...subs], [ftH, ...ftSubs]] = Hist.getDoubleHashParts();
		if (ancH === "" && !subs.length) return;
		subs = this.filterBox.setFromSubHashes(subs);
		ftSubs = this.featFilterBox.setFromSubHashes(ftSubs);

		const target = isInitialLoad ? this.__state : this._state;

		// On changing ancestry (ancestry links have no state parts), clean "feature" state
		if (!subs.length) this.__state.feature = null;

		if (this._getHashState() === subs.join(HASH_PART_SEP)) return;

		const validHLookup = {};
		this.activeAncestryAllHeritages.forEach(h => validHLookup[UrlUtil.getStateKeyHeritage(h)] = h);

		// Track any incoming sources we need to filter to enable in order to display the desired heritages
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
					const knownKey = Object.keys(AncestriesPage._DEFAULT_STATE).find(it => it.toLowerCase() === k);
					if (knownKey) {
						if (target[knownKey] !== v) target[knownKey] = v;
						seenKeys.add(knownKey);
					}
				} // else discard it
			});
		});

		Object.entries(AncestriesPage._DEFAULT_STATE).forEach(([k, v]) => {
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

		Object.keys(validHLookup).forEach(k => {
			if (!seenKeys.has(k) && target[k]) target[k] = false;
		});

		// Run the sync in the other direction, a loop that *should* break once the hash/state match perfectly
		if (!isInitialLoad) this._setHashFromState();
	}

	/**
	 * @param [opts] Options object.
	 * @param [opts.ancestry] Ancestry to convert to hash.
	 * @param [opts.feat] Feat to convert to hash.
	 * @param [opts.state] State to convert to hash.
	 */
	_getHashState (opts) {
		opts = opts || {};

		let fromState = opts.state || MiscUtil.copy(this.__state);
		let anc = opts.ancestry || this.activeAncestry;
		let feat = opts.feat || this.activeFeat;

		// region ancestry
		let primaryHash = anc ? UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ANCESTRIES](anc) : null;
		if (!primaryHash) {
			const firstItem = this._list.items[0];
			primaryHash = firstItem ? firstItem.values.hash : HASH_BLANK;
		}
		// endregion

		// region feats
		let featHash;
		if (!opts.blankFeatHash) {
			featHash = feat ? UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat) : null;
			if (!featHash) {
				const firstItem = this._listFeat.items[0];
				primaryHash = firstItem ? firstItem.values.hash : HASH_BLANK;
			}
		} else featHash = HASH_BLANK;
		// endregion

		// region state
		const validHKeys = this.activeAncestryAllHeritages.map(sc => UrlUtil.getStateKeyHeritage(sc));
		const stateParts = Object.entries(fromState)
			.filter(([k, v]) => AncestriesPage._DEFAULT_STATE[k] !== v) // ignore any default values
			.filter(([k, v]) => !(AncestriesPage._DEFAULT_STATE[k] === undefined && !v)) // ignore any falsey values which don't have defaults
			.filter(([k]) => {
				// Filter out any junky heritages/those from other classes
				if (!k.startsWith("h")) return true;
				return validHKeys.includes(k);
			})
			.map(([k, v]) => `${k}=${UrlUtil.mini.compress(v)}`);
		const stateHash = stateParts.length ? UrlUtil.packSubHash("state", stateParts) : "";
		// endregion

		const hashPartsAnc = [
			primaryHash,
			stateHash,
		].filter(Boolean);
		const hashPartsFeat = [
			featHash,
		].filter(Boolean);
		const hashParts = [
			Hist.util.getCleanHash(hashPartsAnc.join(HASH_PART_SEP)),
			Hist.util.getCleanHash(hashPartsFeat.join(HASH_PART_SEP)),
		].filter(Boolean)
		return hashParts.join("#")
	}

	_initLinkGrabbers () {
		const $body = $(document.body);
		$body.on(`mousedown`, `.cls-main__linked-titles > td > * > .rd__h .entry-title-inner`, (evt) => evt.preventDefault());
		$body.on(`click`, `.cls-main__linked-titles > td > * > .rd__h .entry-title-inner`, async (evt) => {
			const $target = $(evt.target);

			if (evt.shiftKey) {
				await MiscUtil.pCopyTextToClipboard($target.text().replace(/\.$/, ""));
				JqueryUtil.showCopiedEffect($target);
			} else {
				const featureId = $target.closest(`tr`).attr("data-scroll-id");

				const curState = MiscUtil.copy(this.__state);
				curState.feature = featureId;
				const href = `${window.location.href.split("#")[0]}#${this._getHashState({state: curState})}`;

				await MiscUtil.pCopyTextToClipboard(href);
				JqueryUtil.showCopiedEffect($target, "Copied link!");
			}
		});
	}

	getListItem (anc, ancI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(anc);
		const source = Parser.sourceJsonToAbv(anc.source);

		const $lnk = $(`<a href="#${hash}" class="lst--border">
			<span class="bold col-8 pl-0">${anc.name}</span>
			<span class="col-4 text-center ${Parser.sourceJsonToColor(anc.source)} pr-0" title="${Parser.sourceJsonToFull(anc.source)}" ${BrewUtil.sourceJsonToStyle(anc.source)}>${source}</span>
		</a>`);

		const $ele = $$`<li class="row ${isExcluded ? "row--blacklisted" : ""}">${$lnk}</li>`;

		return new ListItem(
			ancI,
			$ele,
			anc.name,
			{
				hash,
				source,
			},
			{
				$lnk,
				entity: anc,
				uniqueId: anc.uniqueId ? anc.uniqueId : ancI,
				isExcluded,
			},
		);
	}

	getFeatListItem (feat, featI, isExcluded) {
		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat);
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

	_doGenerateFilteredActiveAncestryData () {
		const f = this.filterBox.getValues();
		const cpyAnc = MiscUtil.copy(this.activeAncestryRaw);
		const walker = MiscUtil.getWalker({
			keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST,
			isAllowDeleteObjects: true,
			isDepthFirst: true,
		});

		this._activeAncestryDataFiltered = cpyAnc;
	}

	_handleFilterChange (isFilterValueChange) {
		// If the filter values changes (i.e. we're not handling an initial load), mutate the state, and trigger a
		//   re-render.
		if (isFilterValueChange) {
			this._doGenerateFilteredActiveAncestryData();
			this._pDoSynchronizedRender();
			return;
		}

		const f = this.filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, item.data.entity, [], null));

		if (this._fnTableHandleFilterChange) this._fnTableHandleFilterChange(f);

		// Force-hide any heritages which are filtered out
		this._proxyAssign(
			"state",
			"_state",
			"__state",
			this.activeAncestry.heritage
				.filter(h => !this.filterBox.toDisplay(f, h.source, h._fMisc, null))
				.map(h => UrlUtil.getStateKeyHeritage(h))
				.filter(stateKey => this._state[stateKey])
				.mergeMap(stateKey => ({[stateKey]: false})),
		);
		this._updateFeatHref();
	}

	_handleFeatFilterChange () {
		const f = this.featFilterBox.getValues();
		this._listFeat.filter(item => this._featFilter.toDisplay(f, item.data.entity));
		FilterBox.selectFirstVisible(this._featDataList);
		this._updateFeatHref();
	}

	async _pInitAndRunRender () {
		this._$wrpOutline = $(`#sticky-nav`);

		// Use hookAll to allow us to reset temp hooks on the property itself
		this._addHookAll("ancestryId", async () => {
			this._doGenerateFilteredActiveAncestryData();
			await this._pDoSynchronizedRender();
		});

		this._addHookAll("featId", async () => {
			await this._pDoSynchronizedRender(true);
		});

		this._doGenerateFilteredActiveAncestryData();
		await this._pDoRender();
	}

	async _pDoSynchronizedRender (skipAncRender) {
		await this._pLock("render");
		try {
			await this._pDoRender(skipAncRender);
		} finally {
			this._unlock("render");
		}
	}

	async _pDoRender (skipAncRender) {
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
				const state = MiscUtil.copy(this.__state);
				this._list.items
					.filter(it => it.data.$lnk)
					.forEach(it => {
						const href = `#${this._getHashState({state, ancestry: it.data.entity, blankFeatHash: true})}`;
						it.data.$lnk.attr("href", href)
					});
				if (this._state.isShowFeats) {
					this._listFeat.items
						.filter(it => it.data.$lnk)
						.forEach(it => {
							const href = `#${this._getHashState({state, feat: it.data.entity})}`;
							it.data.$lnk.attr("href", href)
						});
				}
			}, 5);
		};
		this._addHook("ancestryId", "_", hkSetHref);
		this._addHook("featId", "_", hkSetHref);
		this._addHookAll("state", hkSetHref);
		hkSetHref();
		// endregion

		// region rendering
		if (!skipAncRender) {
			this._render_renderAncestry();
		}
		this._render_renderHeritageTabs();
		this._render_renderFeat();
		// endregion

		// region state handling
		const keepYScroll = (hook) => {
			const topEle = $(`#ancestrystats`).children().get().filter(it => it.getBoundingClientRect().bottom > 0)[0];
			if (!topEle) {
				hook();
				return;
			}
			const offset = 1 - topEle.getBoundingClientRect().y;
			hook();
			if (topEle.className.split(" ").includes("hidden")) {
				// try to scroll to next element
				const next = $(topEle).nextAll().not(".hidden")[0];
				if (next) next.scrollIntoView();
			} else {
				topEle.scrollIntoView();
				window.scrollBy(0, offset);
			}
		};

		const hkScrollToFeature = () => {
			// `state.feature` is set by clicking links in the class feature table
			if (this._state.feature) {
				// track last scrolled, otherwise *any* further hash/state change will cause us to scroll
				if (this._lastScrollFeature === this._state.feature) return;
				this._lastScrollFeature = this._state.feature;

				const $scrollTo = $(`[data-scroll-id="${this._state.feature}"]`);
				if (!$scrollTo[0]) {
					// This should never occur, but just in case, clean up
					this._state.feature = null;
					this._lastScrollFeature = null;
				} else {
					setTimeout(() => $scrollTo[0].scrollIntoView(), 100);
				}
			}
		};
		this._addHookBase("feature", hkScrollToFeature);
		hkScrollToFeature();

		const hkDisplayFluff = () => {
			const $dispAncestryTitle = $(`#ancestry-name`);
			if (this._state.isHideFeatures) $dispAncestryTitle.toggleClass("hidden", !this._state.isShowFluff)

			$(`.pf2-fluff`).toggleClass("hidden-fluff", !this._state.isShowFluff);

			if (!this._isAnyHeritageActive() && !this._state.isHideFeatures && !this._state.isShowFluff) this._$divNoHeritage.toggleClass("hidden", false);
			else this._$divNoHeritage.toggleClass("hidden", true);

			this._$divNoContent.toggleClass("hidden", this._isAnyContentActive());
		}
		this._addHookBase("isShowFluff", () => keepYScroll(hkDisplayFluff));
		MiscUtil.pDefer(hkDisplayFluff);

		const hkDisplayFeatures = () => {
			const $dispAncestryFeatures = $(`[data-feature-type="ancestry"]`);
			const $dispAncestryTitle = $(`#ancestry-name`);

			if (this._state.isHideFeatures) {
				$dispAncestryTitle.toggleClass("hidden", !this._state.isShowFluff)
				$dispAncestryFeatures.toggleClass("hidden", true);
				this._$wrpOutline.toggleClass("hidden", !this._isAnyHeritageActive());
			} else {
				$dispAncestryTitle.toggleClass("hidden", false);
				this._$wrpOutline.toggleClass("hidden", false);
				$dispAncestryFeatures.toggleClass("hidden", false);
			}

			if (!this._isAnyHeritageActive() && !this._state.isHideFeatures && !this._state.isShowFluff) this._$divNoHeritage.toggleClass("hidden", false);
			else this._$divNoHeritage.toggleClass("hidden", true);
			this._$divNoContent.toggleClass("hidden", this._isAnyContentActive());
		};
		this._addHookBase("isHideFeatures", () => keepYScroll(hkDisplayFeatures));
		MiscUtil.pDefer(hkDisplayFeatures);

		const hkShowFeats = () => {
			const $acnWrp = $(`#ancestrystats-wrp`);
			const $featView = $(`.feat-view`);

			if (this._state.isShowFeats) {
				$acnWrp.toggleClass("hidden", true);
				$featView.toggleClass("hidden", false);
			} else {
				$acnWrp.toggleClass("hidden", false);
				$featView.toggleClass("hidden", true);
			}
		};
		this._addHookBase("isShowFeats", hkShowFeats);
		MiscUtil.pDefer(hkShowFeats);

		const hkDisplayImages = () => {
			const {veHerUrls, ancUrls} = this._getImageUrls();
			const $btnShowImages = $(`#btn-show-images`);
			$btnShowImages.toggleClass("hidden", veHerUrls.length === 0 && ancUrls.length === 0);
		}
		this._addHook("ancestryId", "_", hkDisplayImages);

		this.activeAncestryAllHeritages.forEach(h => {
			const stateKey = UrlUtil.getStateKeyHeritage(h);
			const hkDisplayHeritage = () => {
				const isVisible = this._state[stateKey];
				$(`[data-heritage-id="${stateKey}"]`).toggleClass("hidden", !isVisible);
			};
			this._addHookBase(stateKey, () => keepYScroll(hkDisplayHeritage));
			this._addHookBase(stateKey, hkDisplayImages);
			// Check/update main feature display here, as if there are no heritages active we can hide more
			this._addHookBase(stateKey, () => keepYScroll(hkDisplayFeatures));
			MiscUtil.pDefer(hkDisplayHeritage);
		});
		MiscUtil.pDefer(hkDisplayImages);
		// endregion

		this._handleFilterChange(false);
		this._handleFeatFilterChange();
	}

	_isAnyHeritageActive () {
		return !!this._getActiveHeritages().length;
	}

	_isAnyNonVeHeritageActive () {
		return !!this._getActiveHeritages().filter(h => !h.versatile).length
	}

	_isAnyVeHeritageActive () {
		return !!this._getActiveHeritages().filter(h => h.versatile).length
	}

	_isAnyContentActive () {
		return this._isAnyHeritageActive() || !this._state.isHideFeatures || this._state.isShowFluff;
	}

	_getActiveHeritages (asStateKeys) {
		return this.activeAncestryAllHeritages
			.filter(h => this._state[UrlUtil.getStateKeyHeritage(h)])
			.map(h => asStateKeys ? UrlUtil.getStateKeyHeritage(h) : h);
	}

	_render_renderAncestry () {
		const $ancestryStats = $(`#ancestrystats`).empty();
		const anc = this.activeAncestry;

		const renderer = Renderer.get().resetHeaderIndex().setFirstSection(false);

		const statSidebar = {
			type: "pf2-sidebar",
			entries: [
				{
					type: "pf2-title",
					name: "Hit Points",
				},
				`${anc.hp}`,
				{
					type: "pf2-title",
					name: "Size",
				},
				`${anc.size}`,
				{
					type: "pf2-title",
					name: "Speed",
				},
				...Parser.speedToFullMap(anc.speed),
			],
		};
		if (anc.rarity) statSidebar.entries.unshift({type: "pf2-title", name: "Rarity"}, `{@trait ${anc.rarity}}`);
		if (anc.boosts) statSidebar.entries.push({type: "pf2-title", name: "Ability Boosts"}, ...anc.boosts);
		if (anc.flaw) statSidebar.entries.push({type: "pf2-title", name: "Ability Flaw"}, ...anc.flaw);
		if (anc.languages) statSidebar.entries.push({type: "pf2-title", name: "Languages"}, ...anc.languages);
		if (anc.traits) statSidebar.entries.push({type: "pf2-title", name: "Traits"}, ...anc.traits.map(t => `{@trait ${t}}`));
		if (anc.feature) statSidebar.entries.push({type: "pf2-title", name: anc.feature.name}, ...anc.feature.entries);
		if (anc.features) anc.features.forEach(f => statSidebar.entries.push({type: "pf2-title", name: f.name}, ...f.entries));
		const ancestryName = {
			type: "pf2-h1",
			name: anc.name,
		};
		const flavor = {
			type: "pf2-h1-flavor",
			entries: anc.flavor,
		};
		const heritageTitle = {type: "pf2-h2", name: `${anc.name} Heritages`};
		const veHeritageTitle = {type: "pf2-h2", name: `Versatile Heritages`};
		const fluffStack = [""];
		const titleStack = [""];
		renderer.recursiveRender(anc.info, fluffStack, {prefix: "<p class=\"pf2-p\">", suffix: "</p>"});
		renderer.recursiveRender(anc.heritageInfo, titleStack, {prefix: "<p class=\"pf2-p\">", suffix: "</p>"})

		$$`<div id="ancestry-name">${renderer.render(ancestryName)}</div>
		<div class="pf2-fluff">${renderer.render(flavor)}</div>
		<div data-feature-type="ancestry">${renderer.render(statSidebar)}</div>
		<div class="pf2-fluff">${fluffStack.join("")}</div>
		<div class="heritage-title">${renderer.render(heritageTitle)}${titleStack.join("")}</div>
		${anc.heritage.map(h => this._render_renderHeritageStats(h)).join("")}
		<div class="veheritage-title">${renderer.render(veHeritageTitle)}</div>
		${this._veHeritagesDataList.map(h => this._render_renderHeritageStats(h)).join("")}
		${this.activeAncestryAllHeritages.map(h => this._render_renderHeritageFluff(h)).join("")}
		`.appendTo($ancestryStats);

		this._$divNoContent = AncestriesPage._render_$getNoContent().appendTo($ancestryStats);
		this._$divNoHeritage = AncestriesPage._render_$getNoHeritage().appendTo($ancestryStats);

		$ancestryStats.show()
	}

	_render_renderHeritageStats (heritage) {
		const renderer = Renderer.get().setFirstSection(false);
		const renderStack = [""]
		renderStack.push(`<div data-heritage-id="${UrlUtil.getStateKeyHeritage(heritage)}">`)
		renderer.recursiveRender({type: "pf2-h3", name: heritage.name, entries: heritage.entries}, renderStack)
		renderStack.push(`</div>`)
		return renderStack.join("")
	}

	_render_renderHeritageFluff (heritage) {
		const renderer = Renderer.get().setFirstSection(false);
		const renderStack = [""]
		renderStack.push(`<div class="pf2-fluff" data-heritage-id="${UrlUtil.getStateKeyHeritage(heritage)}">`)
		renderer.recursiveRender(heritage.info, renderStack)
		renderStack.push(`</div>`)
		return renderStack.join("")
	}

	_render_renderHeritageTabs () {
		const $wrp = $(`#heritagetabs`).empty();

		this._render_renderHeritagePrimaryControls($wrp);
		this._render_initHeritageControls($wrp);
		this._render_renderHeritageButtons($wrp);
	}

	_getImageUrls () {
		const veHerUrls = this._veHeritagesDataList.filter(h => this._state[UrlUtil.getStateKeyHeritage(h)]).map(h => (h.summary || {}).images || []).flat();
		const ancUrls = (this.activeAncestry.summary || {}).images || [];
		return {veHerUrls, ancUrls};
	}

	_render_renderHeritagePrimaryControls ($wrp) {
		const $btnToggleFeatures = ComponentUiUtil.$getBtnBool(this, "isHideFeatures", {
			text: "Features",
			isInverted: true,
		}).title("Toggle Ancestry Features");

		const $btnToggleFluff = ComponentUiUtil.$getBtnBool(this, "isShowFluff", {text: "Info"}).title("Toggle Ancestry Info");

		const $btnToggleFeats = ComponentUiUtil.$getBtnBool(this, "isShowFeats", {
			text: "Show Feats",
			activeClass: "btn-danger",
			activeText: "Hide Feats",
			inactiveText: "Show Feats",
		}).title("Toggle Feat View").addClass("mb-1");

		const $dropDownImages = $(`<li class="dropdown" style="list-style: none"></li>`);
		const $dropDownImagesContent = $(`<li class="dropdown-menu dropdown-menu--top" style="margin-top: -0.25rem !important; border-radius: 0"></li>`).appendTo($dropDownImages);
		const $dropDownImagesButton = $(`<button class="btn btn-default btn-xs mr-2 mb-1 flex-3">Images</button>`).on("click", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			$dropDownImagesContent.empty();
			const {veHerUrls, ancUrls} = this._getImageUrls();
			const ancLinks = ancUrls.map(l => `<li><a href="${l}" target="_blank" rel="noopener noreferrer">${l}</a></li>`);
			const veHerLinks = veHerUrls.map(l => `<li><a href="${l}" target="_blank" rel="noopener noreferrer">${l}</a></li>`);
			ancLinks.forEach(l => $dropDownImagesContent.append(l));
			if (ancLinks.length && veHerLinks.length) $dropDownImagesContent.append($(`<li class="divider"></li>`))
			veHerLinks.forEach(l => $dropDownImagesContent.append(l));
			if (ancLinks.length === 0 && veHerLinks.length === 0) $dropDownImagesContent.append($(`<li class="p-1">No Images available.</li>`))

			$dropDownImagesButton.toggleClass("ui-tab__btn-tab-head");
			$dropDownImages.toggleClass("open");
		}).appendTo($dropDownImages);
		document.addEventListener("click", () => {
			$dropDownImages.toggleClass("open", false)
			$dropDownImagesButton.toggleClass("ui-tab__btn-tab-head", false);
		});

		$$`<div class="flex-v-center m-1 flex-wrap">
			<div class="mr-2 no-shrink">${$btnToggleFeats}</div>
			<div class="mr-2 no-shrink">${$dropDownImages}</div>
			<div class="btn-group no-shrink mb-1 ml-auto">${$btnToggleFeatures}${$btnToggleFluff}</div>
		</divc>`.appendTo($wrp);
	}

	_doSelectAllHeritages () {
		const allStateKeys = this.activeAncestryAllHeritages.map(h => UrlUtil.getStateKeyHeritage(h));

		this._pageFilter.sourceFilter.doSetPillsClear();
		this.filterBox.fireChangeEvent();
		this._proxyAssign("state", "_state", "__state", allStateKeys.mergeMap(stateKey => ({[stateKey]: true})));
	}

	_doSelectAllHeritages_fromList (list) {
		const stateKeys = list.items.map(it => it.values.stateKey);

		this._pageFilter.sourceFilter.doSetPillsClear();
		this.filterBox.fireChangeEvent();
		this._proxyAssign("state", "_state", "__state", stateKeys.mergeMap(stateKey => ({[stateKey]: true})));
	}

	_render_initHeritageControls ($wrp) {
		const $btnSelAll = $(`<button class="btn btn-xs btn-default flex-1" title="Select All"><span class="glyphicon glyphicon-check"/></button>`)
			.click(evt => {
				const allStateKeys = this.activeAncestryAllHeritages.map(h => UrlUtil.getStateKeyHeritage(h));
				// TODO:
				if (evt.shiftKey) {
					this._doSelectAllHeritages();
				} else if (evt.ctrlKey || evt.metaKey) {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					this._listHeritage.visibleItems.concat(this._listVeHeritage.visibleItems)
						.filter(it => it.values.mod === "brew" || it.values.mod === "fresh")
						.map(it => it.values.stateKey)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				} else {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					this._listHeritage.visibleItems.concat(this._listVeHeritage.visibleItems)
						.map(it => it.values.stateKey)
						.filter(Boolean)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				}
			});

		// TODO: Option for Homebrew/Official filter?
		const filterSets = [
			{name: "Select All", subHashes: ["flst.ancestries.ancestriesother%20options:isshowveheritages=b1~isshowstdheritages=b1"], isClearSources: false},
			{name: "Standard Heritages Only", subHashes: ["flst.ancestries.ancestriesother%20options:isshowveheritages=b0~isshowstdheritages=b1"], isClearSources: false},
			{name: "Versatile Heritages Only", subHashes: ["flst.ancestries.ancestriesother%20options:isshowveheritages=b1~isshowstdheritages=b0"], isClearSources: false},
		];
		const setFilterSet = ix => {
			const filterSet = filterSets[ix];
			const boxSubhashes = this.filterBox.getBoxSubHashes() || [];

			const cpySubHashes = MiscUtil.copy(filterSet.subHashes);
			if (filterSet.isClearSources) {
				const classifiedSources = this._pageFilter.sourceFilter.getSources();
				const sourcePart = [...classifiedSources.official, ...classifiedSources.homebrew]
					.map(src => `${src.toUrlified()}=0`)
					.join(HASH_SUB_LIST_SEP);
				cpySubHashes.push(`flst.ancestries.ancestriessource:${sourcePart}`)
			}

			this.filterBox.setFromSubHashes([
				...boxSubhashes,
				...cpySubHashes,
				`flop.ancestries.ancestriessource:extend`,
			].filter(Boolean), true);
			this._listHeritage.visibleItems.filter(it => it.values.stateKey).forEach(it => this._state[it.values.stateKey] = true);
			this._listVeHeritage.visibleItems.filter(it => it.values.stateKey).forEach(it => this._state[it.values.stateKey] = true);
			$selFilterPreset.val("-1");
		};
		const $selFilterPreset = $(`<select class="input-xs form-control cls-tabs__sel-preset mr-2 mb-1 flex-3"><option value="-1" disabled>Filter...</option></select>`)
			.change(() => {
				const val = Number($selFilterPreset.val());
				if (val == null) return;
				setFilterSet(val)
			});
		filterSets.forEach((it, i) => $selFilterPreset.append(`<option value="${i}">${it.name}</option>`));
		$selFilterPreset.val("-1");

		const $btnReset = $(`<button class="btn btn-xs btn-default flex-1" title="Reset Selection"><span class="glyphicon glyphicon-refresh"></span></button>`)
			.click(() => {
				this._proxyAssign("state", "_state", "__state", this.activeAncestryAllHeritages.mergeMap(h => ({[UrlUtil.getStateKeyHeritage(h)]: false})));
			});

		const $btnToggleSources = ComponentUiUtil.$getBtnBool(this, "isShowHSources", {$ele: $(`<button class="btn btn-xs btn-default flex-1" title="Show Heritage Sources"><span class="glyphicon glyphicon-book"/></button>`)});

		const $btnShuffle = $(`<button title="Feeling Lucky?" class="btn btn-xs btn-default flex-1"><span class="glyphicon glyphicon-random"/></button>`)
			.click(() => {
				if (!this._listHeritage.visibleItems.length && !this._listVeHeritage.visibleItems.length) {
					return JqueryUtil.doToast({
						content: "No heritages to choose from!",
						type: "warning",
					});
				}

				const doDeselAll = () => this._listHeritage.items.concat(this._listVeHeritage.items).filter(it => it.values.stateKey).forEach(it => this._state[it.values.stateKey] = false);

				const activeKeys = Object.keys(this._state).filter(it => it.startsWith("sub"));
				const visibleActiveKeys = this._listHeritage.visibleItems.concat(this._listVeHeritage.visibleItems).filter(it => it.values.stateKey).map(it => it.values.stateKey).filter(it => activeKeys.includes(it));

				// Avoid re-selecting the same option if there's only one selected
				if (visibleActiveKeys.length === 1) {
					doDeselAll();
					const options = this._listHeritage.visibleItems.concat(this._listVeHeritage.visibleItems).filter(it => it.values.stateKey).map(it => it.values.stateKey).filter(it => it.values.stateKey !== visibleActiveKeys[0]);
					this._state[RollerUtil.rollOnArray(options)] = true;
				} else {
					doDeselAll();
					const it = RollerUtil.rollOnArray(this._listHeritage.visibleItems.concat(this._listVeHeritage.visibleItems).filter(it => it.values.stateKey));
					this._state[it.values.stateKey] = true;
				}
			});

		$$`<div class="flex-v-center m-1 no-shrink">${$selFilterPreset}
			<div class="btn-group flex-1 flex-h-center mb-1">${$btnSelAll}${$btnShuffle}${$btnReset}${$btnToggleSources}</div>
		</div>`.appendTo($wrp);
	}

	_render_renderHeritageButtons ($wrp) {
		const anc = this.activeAncestry;

		const $wrpHTabs = $(`<div class="flex-v-center flex-wrap mr-2 w-100 anc-h-tabs__wrp" data-h-type="${anc.name} Heritages"/>`).appendTo($wrp);
		const $wrpVeHTabs = $(`<div class="flex-v-center flex-wrap mr-2 w-100 anc-h-tabs__wrp" data-h-type="Versatile Heritages"/>`).appendTo($wrp);
		this._listHeritage = new List({
			$wrpList: $wrpHTabs,
			isUseJquery: true,
			fnSort: AncestriesPage._fnSortHeritageFilterItems,
		});
		this._listVeHeritage = new List({
			$wrpList: $wrpVeHTabs,
			isUseJquery: true,
			fnSort: AncestriesPage._fnSortHeritageFilterItems,
		});
		const heritages = anc.heritage;

		for (let idx = 0; idx < heritages.length; ++idx) {
			const h = heritages[idx];
			const listItem = this._render_getHeritageTab(anc, h, idx);
			if (!listItem) continue;
			this._listHeritage.addItem(listItem);
		}
		for (let idx = 0; idx < this._veHeritagesDataList.length; ++idx) {
			const h = this._veHeritagesDataList[idx];
			const listItem = this._render_getHeritageTab(anc, h, idx);
			if (!listItem) continue;
			this._listVeHeritage.addItem(listItem);
		}

		const $dispCount = $(`<div class="text-muted m-1 cls-tabs__sc-not-shown flex-vh-center"/>`);
		const $dispVeCount = $(`<div class="text-muted m-1 cls-tabs__sc-not-shown flex-vh-center"/>`);
		this._listHeritage.addItem(new ListItem(
			-1,
			$dispCount,
			null,
			{isAlwaysVisible: true},
		));
		this._listVeHeritage.addItem(new ListItem(
			-1,
			$dispVeCount,
			null,
			{isAlwaysVisible: true},
		));

		this._listHeritage.on("updated", () => {
			$dispCount.off("click");
			if (this._listHeritage.visibleItems.length) {
				const cntNotShown = this._listHeritage.items.length - this._listHeritage.visibleItems.length;
				$dispCount.html(cntNotShown ? `<i class="clickable" title="Adjust your filters to see more.">(${cntNotShown} more not shown)</i>` : "").click(() => this._doSelectAllHeritages_fromList(this._listHeritage));
			} else if (this._listHeritage.items.length > 1) {
				$dispCount.html(`<i class="clickable" title="Adjust your filters to see more.">(${this._listHeritage.items.length - 1} heritages not shown)</i>`).click(() => this._doSelectAllHeritages_fromList(this._listHeritage));
			} else $dispCount.html("");
		});
		this._listVeHeritage.on("updated", () => {
			$dispVeCount.off("click");
			if (this._listVeHeritage.visibleItems.length) {
				const cntNotShown = this._listVeHeritage.items.length - this._listVeHeritage.visibleItems.length;
				$dispVeCount.html(cntNotShown ? `<i class="clickable" title="Adjust your filters to see more.">(${cntNotShown} more not shown)</i>` : "").click(() => this._doSelectAllHeritages_fromList(this._listVeHeritage));
			} else if (this._listVeHeritage.items.length > 1) {
				$dispVeCount.html(`<i class="clickable" title="Adjust your filters to see more.">(${this._listVeHeritage.items.length - 1} heritages not shown)</i>`).click(() => this._doSelectAllHeritages_fromList(this._listVeHeritage));
			} else $dispVeCount.html("");
		});

		this._listHeritage.init();
		this._listVeHeritage.init();

		this.filterBox.on(FilterBox.EVNT_VALCHANGE, this._handleHeritageFilterChange.bind(this));
		this._handleHeritageFilterChange();
		// Remove the temporary "hidden" class used to prevent popping
		this._listHeritage.items.forEach(it => it.ele.removeClass("hidden"));
		this._listVeHeritage.items.forEach(it => it.ele.removeClass("hidden"));
	}

	_handleHeritageFilterChange () {
		const f = this.filterBox.getValues();
		const anc = this.activeAncestry;
		this._listHeritage.filter(li => {
			if (li.values.isAlwaysVisible) return true;
			if (li.values.versatile && !this.filterBox.getValues()[this._pageFilter.optionsFilter.header].isShowVeHeritages) return false;
			if (!li.values.versatile && !this.filterBox.getValues()[this._pageFilter.optionsFilter.header].isShowStdHeritages) return false;
			return this.filterBox.toDisplay(
				f,
				li.data.entity.source,
				anc.boosts || [],
				anc.flaw || [],
				anc.hp,
				anc.size,
				anc._fspeed,
				anc._fspeedtypes,
				anc._flanguages,
				anc.traits,
				anc._fMisc,
			);
		});
		this._listVeHeritage.filter(li => {
			if (li.values.isAlwaysVisible) return true;
			if (li.values.versatile && !this.filterBox.getValues()[this._pageFilter.optionsFilter.header].isShowVeHeritages) return false;
			if (!li.values.versatile && !this.filterBox.getValues()[this._pageFilter.optionsFilter.header].isShowStdHeritages) return false;
			return this.filterBox.toDisplay(
				f,
				li.data.entity.source,
				anc.boosts || [],
				anc.flaw || [],
				anc.hp,
				anc.size,
				anc._fspeed,
				anc._fspeedtypes,
				anc._flanguages,
				anc.traits,
				anc._fMisc,
			);
		});
	}

	_render_getHeritageTab (anc, h, ix) {
		const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ANCESTRIES](h), "heritage", h.source);

		const stateKey = UrlUtil.getStateKeyHeritage(h);
		const mod = AncestriesPage.getHeritageCssMod(anc, h);
		const clsActive = `cls__btn-sc--active-${mod}`;

		if (this._state[stateKey] == null) this._state[stateKey] = false;

		const $dispName = $(`<div title="${h.name.toTitleCase()}; Source: ${Parser.sourceJsonToAbv(h.source)}">${h.shortName || h.name}</div>`);
		const $dispSource = $(`<div class="ml-1" title="${Parser.sourceJsonToFull(h.source)}">(${Parser.sourceJsonToAbv(h.source)})</div>`);
		const hkSourcesVisible = () => $dispSource.toggleClass("hidden", !this._state.isShowHSources);
		this._addHookBase("isShowHSources", hkSourcesVisible);
		MiscUtil.pDefer(hkSourcesVisible);

		// Initially have these "hidden," to prevent them popping out when we filter them
		const $btn = $$`<button class="btn btn-default btn-xs flex-v-center m-1 hidden ${h.isReprinted ? "cls__btn-sc--reprinted" : ""}">
				${$dispName}
				${$dispSource}
			</button>`
			.click(() => this._state[stateKey] = !this._state[stateKey])
			.contextmenu(evt => {
				evt.preventDefault();
				this._state[stateKey] = !this._state[stateKey];
			});
		const hkVisible = () => {
			$(".heritage-title").toggleClass("hidden", !this._isAnyNonVeHeritageActive())
			$(".veheritage-title").toggleClass("hidden", !this._isAnyVeHeritageActive())
			$btn.toggleClass(clsActive, !!this._state[stateKey]);
		};
		this._addHookBase(stateKey, hkVisible);
		MiscUtil.pDefer(hkVisible);

		return new ListItem(
			ix,
			$btn,
			h.name,
			{
				source: h.source,
				versatile: !!h.versatile,
				shortName: h.shortName,
				stateKey,
				mod,
			},
			{
				isExcluded,
				entity: h,
				uniqueId: h.uniqueId ? h.uniqueId : ix,
			},
		);
	}

	static getHeritageCssMod (anc, h) {
		if (h.versatile) return BrewUtil.hasSourceJson(h.source) ? "brew" : "spicy"
		if (h.source !== anc.source) {
			return BrewUtil.hasSourceJson(h.source)
				? "brew"
				: SourceUtil.isNonstandardSource(h.source)
					? h.isReprinted ? "stale" : "spicy"
					: h.isReprinted ? "reprinted" : "fresh";
		}
		return "fresh";
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
		$(`#btn-feat-link`).attr("href", `feats.html#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat)}${HASH_PART_SEP}${this.featFilterBox.getSubHashes().map(sh => sh.replace(/\.ancestries\.feats/, "")).join(HASH_PART_SEP)}`);
	}

	static _render_$getNoContent () {
		return $(`<div class="pf2-h1-flavor text-center">Toggle a button to view ancestry and heritage information.</div>`)
	}

	static _render_$getNoHeritage () {
		return $(`<div class="pf2-h1-flavor text-center" style="clear: none; width: 100%">Select Heritages to display them here.</div>`)
	}

	_getDefaultState () {
		return MiscUtil.copy(AncestriesPage._DEFAULT_STATE);
	}
}

AncestriesPage._DEFAULT_STATE = {
	isHideFeatures: false,
	isShowFluff: true,
	isShowVeHeritages: false,
	isShowHSources: false,
	isShowFeats: false,
};

let ancestriesPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	ancestriesPage = new AncestriesPage();
	ancestriesPage.pOnLoad()
});
