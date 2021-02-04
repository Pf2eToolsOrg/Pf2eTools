"use strict";

class ClassesPage extends BaseComponent {
	static _ascSortSubclasses (hA, hB) {
		return SortUtil.ascSortLower(hA.type + hA.name, hB.type + hB.name)
	}

	static _fnSortSubclassFilterItems (a, b) {
		if (a.values.isAlwaysVisible) return 1;
		else if (b.values.isAlwaysVisible) return -1;
		else return SortUtil._listSort_compareBy(a, b, "type");
	}

	constructor () {
		super();
		this.__classId = {_: 0};
		this._classId = this._getProxy("classId", this.__classId);

		this._list = null;
		this._ixData = 0;
		this._dataList = [];
		this._lastScrollFeature = null;
		this._outlineData = {};
		this._pageFilter = new PageFilterClasses();

		this._listSubclass = null;
		this._ixDataSubclass = 0;

		this._$divNoContent = null;

		this._activeClassDataFiltered = null;
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
			typeDeselFn: it => it === "Class",
		});
		this.__featId = {_: 0};
		this._featId = this._getProxy("featId", this.__featId);
	}

	get activeClass () {
		if (this._activeClassDataFiltered) return this._activeClassDataFiltered;
		return this.activeClassRaw;
	}

	get activeClassRaw () {
		return this._dataList[this._classId._];
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
		const data = await DataUtil.class.loadJSON();
		const feats = await DataUtil.loadJSON("data/feats/feats-crb.json")

		this._list = ListUtil.initList({listClass: "classes", isUseJquery: true});
		this._listFeat = ListUtil.initList({listClass: "feats", isUseJquery: true}, {
			input: "#feat-lst__search",
			glass: "#feat-lst__search-glass",
			reset: "#feat-reset",
		});
		ListUtil.setOptions({primaryLists: [this._list, this._listFeat]});
		SortUtil.initBtnSortHandlers($("#filtertools"), this._list);
		SortUtil.initBtnSortHandlers($("#feat-filtertools"), this._listFeat);

		await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $(`#filter-search-group`).title("Hotkey: f"),
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
		RollerUtil.addListRollButton(true, {
			roll: "feat-feelinglucky",
			reset: "feat-reset",
			search: "feat-filter-search-group",
		}, 1);

		window.onhashchange = this._handleHashChange.bind(this);

		this._list.init();
		this._listFeat.init();

		$(`.initial-message`).text(`Select a class from the list to view it here`);

		this._setClassFromHash(Hist.initialLoad);
		this._setFeatClassFilters()
		this._setFeatFromHash(Hist.initialLoad);
		this._setStateFromHash(Hist.initialLoad);

		await this._pInitAndRunRender();

		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#classstats`));
		ExcludeUtil.checkShowAllExcluded(this._featDataList, $(`#featstats`));
		this._initLinkGrabbers();
		UrlUtil.bindLinkExportButton(this.filterBox, $(`#btn-link-export`));

		Hist.initialLoad = false;

		// Finally, ensure the hash correctly matches the state
		this._setHashFromState(true);

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pHandleBrew (homebrew) {
		const {class: rawClassData} = homebrew;
		const cpy = MiscUtil.copy({class: rawClassData});

		const {isAddedAnyClass, isAddedAnySubclass} = this._addData(cpy);

		if (isAddedAnySubclass && !Hist.initialLoad) await this._pDoRender();
	}

	_addData (data) {
		let isAddedAnyClass = false;
		let isAddedAnySubclass = false;

		if (data.class && data.class.length) (isAddedAnyClass = true) && this._addData_addClassData(data.class)
		if (data.subclass && data.subclass.length) (isAddedAnySubclass = true) && this._addData_addSubclassData(data.subclass)

		if (isAddedAnyClass || isAddedAnySubclass) {
			this._list.update();
			this.filterBox.render();
			this._handleFilterChange(false);
		}

		return {isAddedAnyClass, isAddedAnySubclass}
	}

	_addFeatsData (feats) {
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
	}

	_addData_addClassData (classes) {
		classes.forEach(cls => {
			this._pageFilter.mutateForFilters(cls)

			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls), "class", cls.source);

			const subclassExclusions = {};
			(cls.subclasses || []).forEach(sc => {
				if (isExcluded) return;
				(subclassExclusions[sc.source] = subclassExclusions[sc.source] || {})[sc.name] = subclassExclusions[sc.source][sc.name] || ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source);
			});

			this._pageFilter.addToFilters(cls, isExcluded, {subclassExclusions});
		});

		classes.filter(cls => SourceUtil.isNonstandardSource(cls.source) || BrewUtil.hasSourceJson(cls.source))
			.forEach(cls => {
				if (cls.fluff) cls.fluff.filter(f => f.source === cls.source).forEach(f => f._isStandardSource = true);
				cls.subclasses.filter(sc => sc.source === cls.source).forEach(sc => sc._isStandardSource = true);
			});

		classes.filter(cls => cls.subclasses).forEach(cls => cls.subclasses.sort(ClassesPage._ascSortSubclasses));

		this._dataList.push(...classes);

		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](it), "class", it.source);
			this._list.addItem(this.getListItem(it, this._ixData, isExcluded));
		}
	}

	_addData_addSubclassData (subclasses) {
		let isBlankSourceFilter;
		if (!Hist.initialLoad) {
			isBlankSourceFilter = !this._pageFilter.sourceFilter.getValues()._isActive;
		}

		subclasses.forEach(sc => {
			const cls = this._dataList.find(c => c.name.toLowerCase() === sc.className.toLowerCase() && c.source.toLowerCase() === (sc.classSource || SRC_PHB).toLowerCase());
			if (!cls) {
				JqueryUtil.doToast({
					content: `Could not add subclass; could not find class with name: ${cls.class} and source ${sc.source || SRC_CRB}`,
					type: "danger",
				});
				return;
			}

			// Avoid re-adding existing brew subclasses
			const existingBrewSc = sc.uniqueId ? cls.subclasses.find(it => it.uniqueId === sc.uniqueId) : null;
			if (existingBrewSc) return;

			const isExcludedClass = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls), "class", cls.source);

			cls.subclasses.push(sc);
			// Don't bother checking subclass exclusion for individually-added subclasses, as they should be from homebrew
			this._pageFilter.mutateAndAddToFilters(cls, isExcludedClass);
			cls.subclasses.sort(ClassesPage._ascSortSubclasses);
		});

		// If we load a homebrew source when we have no source filters active, the homebrew source will set itself high
		//   and force itself as the only visible source. Fix it in post.
		if (isBlankSourceFilter) this._pageFilter.sourceFilter.doSetPillsClear();
	}

	_initHashAndStateSync () {
		// Wipe all hooks, as we redo them for each class render
		this._resetHooks("state");
		this._resetHooksAll("state");
		this._resetHooks("classId");
		// Don't reset hooksAll for classId

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

	_setFeatClassFilters () {
		let names = this._getActiveSubclasses().map(it => it.name);
		names.push(...this._getActiveSubclasses().map(it => it.traits).filter(Boolean).flat())
		names.push(this.activeClass.name);
		Object.keys(this._featFilter._classFilter.getValues().Classes).forEach(key => {
			if (!key.startsWith("_")) this._featFilter._classFilter.setValue(key, 2)
		});
		names.forEach(name => {
			this._featFilter._classFilter.setValue(name, 1)
		});
		this._handleFeatFilterChange();
	}

	_handleHashChange () {
		// Parity with the implementation in hist.js
		if (Hist.isHistorySuppressed) return Hist.setSuppressHistory(false);

		this._setClassFromHash();
		this._setFeatClassFilters();
		this._setFeatFromHash();
		this._setStateFromHash();
	}

	_setClassFromHash (isInitialLoad) {
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
			const target = isInitialLoad ? this.__classId : this._classId;
			if (target._ !== ixToLoad) {
				Hist.lastLoadedId = ixToLoad;
				const cls = this._dataList[ixToLoad];
				document.title = `${cls ? cls.name : "Classes"} - PF2eTools`;
				target._ = ixToLoad;
				this._loadFirstFeat = true;
			}
		} else {
			// This should never occur (failed loads should pick the first list item), but attempt to handle it semi-gracefully
			$(`#classstats`).empty().append(ClassesPage._render_$getNoContent());
			JqueryUtil.doToast({content: "Could not find the class to load!", type: "error"})
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
			$(`#featstats`).empty().append(ClassesPage._render_$getNoContent());
			JqueryUtil.doToast({content: "Could not find the feat to load!", type: "error"})
		}
	}

	_setStateFromHash (isInitialLoad) {
		let [[clsH, ...subs], [ftH, ...ftSubs]] = Hist.getDoubleHashParts();
		if (clsH === "" && !subs.length) return;
		subs = this.filterBox.setFromSubHashes(subs);
		ftSubs = this.featFilterBox.setFromSubHashes(ftSubs);

		const target = isInitialLoad ? this.__state : this._state;

		if (!subs.length) this.__state.feature = null;

		if (this._getHashState() === subs.join(HASH_PART_SEP)) return;

		const cls = this.activeClass;
		const validScLookup = {};
		cls.subclasses.forEach(sc => validScLookup[UrlUtil.getStateKeySubclass(sc)] = sc);

		// Track any incoming sources we need to filter to enable in order to display the desired subclasses
		const requiredSources = new Set();

		const seenKeys = new Set();
		subs.forEach(sub => {
			const unpacked = UrlUtil.unpackSubHash(sub);
			if (!unpacked.state) return;
			unpacked.state.map(it => {
				let [k, v] = it.split("=");
				k = k.toLowerCase();
				v = UrlUtil.mini.decompress(v);
				if (k.startsWith("sub")) { // subclass selection state keys
					if (validScLookup[k]) {
						if (target[k] !== v) target[k] = v;
						requiredSources.add(validScLookup[k].source);
						seenKeys.add(k);
					}
				} else { // known classes page state keys
					const knownKey = Object.keys(ClassesPage._DEFAULT_STATE).find(it => it.toLowerCase() === k);
					if (knownKey) {
						if (target[knownKey] !== v) target[knownKey] = v;
						seenKeys.add(knownKey);
					}
				} // else discard it
			});
		});

		Object.entries(ClassesPage._DEFAULT_STATE).forEach(([k, v]) => {
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

		Object.keys(validScLookup).forEach(k => {
			if (!seenKeys.has(k) && target[k]) target[k] = false;
		});

		// Run the sync in the other direction, a loop that *should* break once the hash/state match perfectly
		if (!isInitialLoad) this._setHashFromState();
	}

	/**
	 * @param [opts] Options object.
	 * @param [opts.class] Class to convert to hash.
	 * @param [opts.feat] Feat to convert to hash.
	 * @param [opts.state] State to convert to hash.
	 */
	_getHashState (opts) {
		opts = opts || {};

		let fromState = opts.state || MiscUtil.copy(this.__state);
		let cls = opts.class || this.activeClass;
		let feat = opts.feat || this.activeFeat;

		// region class
		let primaryHash = cls ? UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls) : null;
		if (!primaryHash) {
			const firstItem = this._list.items[0];
			primaryHash = firstItem ? firstItem.values.hash : HASH_BLANK;
		}
		// endregion

		// region feats
		let featHash = cls ? UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat) : null;
		if (!featHash) {
			const firstItem = this._listFeat.items[0];
			primaryHash = firstItem ? firstItem.values.hash : HASH_BLANK;
		}
		// endregion

		// region state
		const validScKeys = cls.subclasses.map(sc => UrlUtil.getStateKeySubclass(sc));
		const stateParts = Object.entries(fromState)
			.filter(([k, v]) => ClassesPage._DEFAULT_STATE[k] !== v) // ignore any default values
			.filter(([k, v]) => !(ClassesPage._DEFAULT_STATE[k] === undefined && !v)) // ignore any falsey values which don't have defaults
			.filter(([k]) => {
				// Filter out any junky subclasses/those from other classes
				if (!k.startsWith("sub")) return true;
				return validScKeys.includes(k);
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
		$body.on(`mousedown`, `.cls-main__linked-titles > div > .rd__h .entry-title-inner`, (evt) => evt.preventDefault());
		$body.on(`click`, `.cls-main__linked-titles > div > .rd__h .entry-title-inner`, async (evt) => {
			const $target = $(evt.target);

			if (evt.shiftKey) {
				await MiscUtil.pCopyTextToClipboard($target.text().replace(/\.$/, ""));
				JqueryUtil.showCopiedEffect($target);
			} else {
				const featureId = $target.closest(`.cls-main__linked-titles`).attr("data-scroll-id");

				const curState = MiscUtil.copy(this.__state);
				curState.feature = featureId;
				const href = `${window.location.href.split("#")[0]}#${this._getHashState({state: curState})}`;

				await MiscUtil.pCopyTextToClipboard(href);
				JqueryUtil.showCopiedEffect($target, "Copied link!");
			}
		});
	}

	getListItem (cls, clsI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(cls);
		const source = Parser.sourceJsonToAbv(cls.source);

		const $lnk = $(`<a href="#${hash}" class="lst--border">
			<span class="bold col-8 pl-0">${cls.name}</span>
			<span class="col-4 text-center ${Parser.sourceJsonToColor(cls.source)} pr-0" title="${Parser.sourceJsonToFull(cls.source)}" ${BrewUtil.sourceJsonToStyle(cls.source)}>${source}</span>
		</a>`);

		const $ele = $$`<li class="row ${isExcluded ? "row--blacklisted" : ""}">${$lnk}</li>`;

		return new ListItem(
			clsI,
			$ele,
			cls.name,
			{
				hash,
				source,
			},
			{
				$lnk,
				entity: cls,
				uniqueId: cls.uniqueId ? cls.uniqueId : clsI,
				isExcluded,
			},
		);
	}

	getFeatListItem (feat, featI, isExcluded) {
		const hash = UrlUtil.autoEncodeHash(feat);
		const source = Parser.sourceJsonToAbv(feat.source);

		const $lnk = $(`<a href="##${hash}" class="lst--border">
			<span class="bold col-4-3 pl-0">${feat.name}</span>
			<span class="col-1-7 text-center">${Parser.getOrdinalForm(feat.level)}</span>
			<span class="col-4 text-center">${feat._slPrereq}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(feat.source)} pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${BrewUtil.sourceJsonToStyle(feat.source)}>${source}</span>
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

	_doGenerateFilteredActiveClassData () {
		const f = this.filterBox.getValues();
		const cpyAnc = MiscUtil.copy(this.activeClassRaw);
		const walker = MiscUtil.getWalker({
			keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST,
			isAllowDeleteObjects: true,
			isDepthFirst: true,
		});

		this._activeClassDataFiltered = cpyAnc
	}

	_handleFilterChange (isFilterValueChange) {
		// If the filter values changes (i.e. we're not handling an initial load), mutate the state, and trigger a
		//   re-render.
		if (isFilterValueChange) {
			this._doGenerateFilteredActiveClassData();
			this._pDoSynchronizedRender();
			return;
		}

		const f = this.filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, item.data.entity));

		if (this._fnOutlineHandleFilterChange) this._fnOutlineHandleFilterChange();
		if (this._fnTableHandleFilterChange) this._fnTableHandleFilterChange(f);

		// Force-hide any subclasses which are filtered out
		this._proxyAssign(
			"state",
			"_state",
			"__state",
			this.activeClass.subclasses
				.filter(sc => !this.filterBox.toDisplay(f, sc.source, Array(5), sc._fMisc, null))
				.map(sc => UrlUtil.getStateKeySubclass(sc))
				.filter(stateKey => this._state[stateKey])
				.mergeMap(stateKey => ({[stateKey]: false})),
		);
	}

	_handleFeatFilterChange () {
		const f = this.featFilterBox.getValues();
		this._listFeat.filter(item => this._featFilter.toDisplay(f, item.data.entity));
		FilterBox.selectFirstVisible(this._featDataList);
	}

	async _pInitAndRunRender () {
		this._$wrpOutline = $(`#sticky-nav`);

		// Use hookAll to allow us to reset temp hooks on the property itself
		this._addHookAll("classId", async () => {
			this._doGenerateFilteredActiveClassData();
			await this._pDoSynchronizedRender();
		});

		this._addHookAll("featId", async () => {
			await this._pDoSynchronizedRender();
		});

		this._doGenerateFilteredActiveClassData();
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
						let state = MiscUtil.copy(this.__state);
						state.feature = null;
						const href = `#${this._getHashState({class: it.data.entity, feat: "", state})}`;
						it.data.$lnk.attr("href", href)
					});
				this._listFeat.items
					.filter(it => it.data.$lnk)
					.forEach(it => {
						let state = MiscUtil.copy(this.__state);
						state.feature = null;
						const href = `#${this._getHashState({feat: it.data.entity, state})}`;
						it.data.$lnk.attr("href", href)
					});
			}, 5);
		};
		this._addHook("classId", "_", hkSetHref);
		this._addHook("featId", "_", hkSetHref);
		this._addHookAll("state", hkSetHref);
		hkSetHref();
		// endregion

		// region rendering
		this._render_renderClass();
		this._render_renderClassAdvancementTable()
		await this._render_pRenderSubclassTabs();
		this._render_renderFeat();
		// endregion

		// region state handling
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
					setTimeout(() => {
						$scrollTo[0].scrollIntoView()
						$scrollTo.toggleClass("scroll-to-highlight", true)
						setTimeout(() => { $scrollTo.toggleClass("scroll-to-highlight", false) }, 2000)
					}, 100);
				}
			}
		};
		this._addHookBase("feature", hkScrollToFeature);
		hkScrollToFeature();

		const hkDisplayFluff = () => {
			const $dispClassTitle = $(`#class-name`);
			if (this._state.isHideFeatures) $dispClassTitle.toggleClass("hidden", !this._state.isShowFluff)
			if (this._state.isHideFeatures && !this._isAnySubclassActive()) this._$divNoContent.toggleClass("hidden", this._state.isShowFluff);
			$(`.pf2-fluff`).toggleClass("hidden-fluff", !this._state.isShowFluff);
		}
		this._addHookBase("isShowFluff", hkDisplayFluff);
		MiscUtil.pDefer(hkDisplayFluff);

		const hkDisplayFeatures = () => {
			const $dispClassFeatures = $(`[data-feature-type="class"]`);
			const $dispFeaturesSubclassHeader = $(`[data-feature-type="gain-subclass"]`);
			const $dispClassTitle = $(`#class-name`);

			if (this._state.isHideFeatures) {
				if (this._isAnySubclassActive()) {
					this._$wrpOutline.toggleClass("hidden", false);
					this._$divNoContent.toggleClass("hidden", true);
					$dispClassFeatures.toggleClass("hidden", true);
					$dispFeaturesSubclassHeader.toggleClass("hidden", false);
				} else {
					$dispClassTitle.toggleClass("hidden", !this._state.isShowFluff)
					this._$wrpOutline.toggleClass("hidden", true);
					this._$divNoContent.toggleClass("hidden", false);
					$dispClassFeatures.toggleClass("hidden", true);
					$dispFeaturesSubclassHeader.toggleClass("hidden", true);
				}
			} else {
				$dispClassTitle.toggleClass("hidden", false)
				this._$wrpOutline.toggleClass("hidden", false);
				this._$divNoContent.toggleClass("hidden", true);
				$dispClassFeatures.toggleClass("hidden", false);
				$dispFeaturesSubclassHeader.toggleClass("hidden", false);
			}
		};
		this._addHookBase("isHideFeatures", hkDisplayFeatures);
		MiscUtil.pDefer(hkDisplayFeatures);

		const cls = this.activeClass;
		cls.subclasses.forEach(sc => {
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			const hkDisplaySubclass = () => {
				const isVisible = this._state[stateKey];
				$(`[data-subclass-id="${stateKey}"]`).toggleClass("hidden", !isVisible);
			};
			this._addHookBase(stateKey, hkDisplaySubclass);
			// Check/update main feature display here, as if there are no subclasses active we can hide more
			this._addHookBase(stateKey, hkDisplayFeatures);
			MiscUtil.pDefer(hkDisplaySubclass);
		});
		// endregion

		this._handleFilterChange(false);
		this._handleFeatFilterChange();
	}

	_isAnySubclassActive () {
		return !!this._getActiveSubclasses().length;
	}

	_getActiveSubclasses (asStateKeys) {
		return this.activeClass.subclasses
			.filter(sc => this._state[UrlUtil.getStateKeySubclass(sc)])
			.map(sc => asStateKeys ? UrlUtil.getStateKeySubclass(sc) : sc);
	}

	_render_renderClass () {
		const $classStats = $(`#classesstats`).empty();
		const cls = this.activeClass;

		const renderer = Renderer.get().resetHeaderIndex();

		const statSidebar = Parser.initialProficienciesToFull(cls.initialProficiencies)
		const className = {
			type: "pf2-h1",
			name: cls.name,
		};
		const flavor = {
			type: "pf2-h1-flavor",
			entries: cls.flavor,
		};
		const keyAbility = {
			type: "pf2-key-ability",
			ability: [
				cls.keyAbility,
				`At 1st level, your class gives you an ability boost to ${cls.keyAbility}.`,
			],
			hp: [
				`${cls.HP} plus your Constitution Modifier`,
				"You increase your maximum number of HP by this number at 1st level and every level thereafter.",
			],
		};
		const fluffStack = [""];
		renderer.recursiveRender(cls.fluff, fluffStack, {depth: 1}, {prefix: "<p class=\"pf2-p\">", suffix: "</p>"})

		$$`<div id="class-name">${renderer.render(className)}</div>
		<div class="pf2-fluff">${renderer.render(flavor)}</div>
		<div data-feature-type="class"><div class="pf2-sidebar--class">${renderer.render(statSidebar)}</div></div>
		<div data-feature-type="class">${renderer.render(keyAbility)}</div>
		<div class="pf2-fluff">${fluffStack.join("")}</div>
		<div data-feature-type="class" id="advancements"></div>
		`.appendTo($classStats);

		let ixScLvl = 0;
		let incrementScLvl = false;
		cls.classFeatures.forEach((lvlFeatures, ixLvl) => {
			if (incrementScLvl) ixScLvl++;
			incrementScLvl = false;
			lvlFeatures.forEach((feature, ixFeature) => {
				const $divClassFeature = $(`<div data-scroll-id="${ixLvl}-${ixFeature}" data-feature-type="class" class="${feature.gainSubclassFeature ? "cls-main__gain-sc-feature" : ""} cls-main__linked-titles"></div>`)
					.fastSetHtml(Renderer.get().render({
						type: "pf2-h3",
						name: feature.name,
						entries: feature.entries,
						level: ixLvl + 1,
					}))
					.appendTo($classStats)

				if (feature.gainSubclassFeature) {
					$divClassFeature.attr("data-feature-type", "gain-subclass");
					cls.subclasses.forEach(sc => {
						const scLvlFeatures = sc.subclassFeatures[ixScLvl];
						if (!scLvlFeatures) return;

						scLvlFeatures.filter(it => it.name === feature.name).forEach((scFeature) => {
							const ptSources = ixScLvl === 0 && sc.otherSources ? `{@note {@b Subclass source:} ${Renderer.utils.getSourceAndPageHtml(sc)}}` : "";
							const toRender = ptSources && scFeature.entries ? MiscUtil.copy(scFeature) : scFeature;
							if (ptSources && toRender.entries) toRender.entries.push(ptSources);

							const $divSubclassFeature = $(`<div class="cls-main__sc-feature" data-subclass-id="${UrlUtil.getStateKeySubclass(sc)}"></div>`)
								.fastSetHtml(Renderer.get().render(toRender.entries))
								.appendTo($classStats);
						});
					});
					incrementScLvl = true;
				}
			});
		});

		this._$divNoContent = ClassesPage._render_$getNoContent().appendTo($classStats);

		$classStats.show()
	}

	_render_renderClassAdvancementTable () {
		const $wrpTblClass = $(`#advancements`).empty();
		const cls = this.activeClass;

		Renderer.get().resetHeaderIndex();
		for (let i = 0; i < 20; i++) {
			if (!cls.classFeatures[i]) cls.classFeatures[i] = []
		}
		const metasTblRows = cls.classFeatures.map((lvlFeatures, ixLvl) => {
			const lvlFeaturesFilt = lvlFeatures
				.filter(it => it.name && it.type !== "inset"); // don't add inset entry names to class table
			Object.keys(cls.advancement).forEach(key => {
				if (cls.advancement[key].slice(1).includes(ixLvl + 1)) lvlFeaturesFilt.push(key)
			});
			const metasFeatureLinks = lvlFeaturesFilt
				.map((it, ixFeature) => {
					const featureId = `${ixLvl}-${ixFeature}`;

					let $lnk = null;
					let name = null;
					let source = null;

					if (it instanceof Object) {
						$lnk = $(`<a>${it.name.toLowerCase()}</a>`)
							.click(() => {
								this._lastScrollFeature = null;
								this._state.feature = null;
								this._state.feature = featureId;
							});
						name = it.name;
						source = it.source;

						const hkSetHref = () => {
							// defer this for performance
							setTimeout(() => {
								// these will modify this._state.feature when clicked
								const curState = MiscUtil.copy(this.__state);
								curState.feature = featureId;
								const href = `#${this._getHashState({state: curState})}`;
								$lnk.attr("href", href);
							}, 5);
						};
						this._addHookAll("state", hkSetHref);
						hkSetHref();
					} else {
						switch (it) {
							case "classFeats": {
								$lnk = $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:class=1,flstclasses:${this.activeClass.name.toLowerCase()}=1">class feat</a>`);
								name = "class feat";
								source = this.activeClass.source;
								break;
							}
							case "skillFeats": {
								$lnk = $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:skill=1">skill feat</a>`)
								name = "skill feat";
								source = this.activeClass.source;
								break;
							}
							case "generalFeats": {
								$lnk = $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:general=1">general feat</a>`)
								name = "general feat";
								source = this.activeClass.source;
								break;
							}
							case "ancestryFeats": {
								$lnk = $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:ancestry=1">ancestry feat</a>`)
								name = "ancestry feat";
								source = this.activeClass.source;
								break;
							}
							case "skillIncrease": {
								$lnk = $(`<span>skill increase</span>`)
								name = "skill increase";
								source = this.activeClass.source;
								break;
							}
							case "abilityBoosts": {
								$lnk = $(`<span>ability boosts</span>`)
								name = "ability boosts";
								source = this.activeClass.source;
								break;
							}
							default:
								throw new Error(`Key ${it} not implemented.`)
						}
					}

					// Make a dummy for the last item
					const $dispComma = $(`<span class="mr-1">,</span>`);
					return {
						name,
						$wrpLink: $$`<span class="inline-block">${$lnk}${$dispComma}</span>`,
						$dispComma,
						source,
						isHidden: false,
					};
				});
			return {
				$row: $$`<div class="pf2-table__entry ${ixLvl % 2 ? "odd" : ""}">${ixLvl + 1}</div>
					<div class="pf2-table__entry ${ixLvl % 2 ? "odd" : ""}">${metasFeatureLinks.length ? metasFeatureLinks.sort(SortUtil.compareListNames).map(it => it.$wrpLink) : `\u2014`}</div>`,
				metasFeatureLinks,
			}
		});

		this._fnTableHandleFilterChange = (filterValues) => {
			metasTblRows.forEach(metaTblRow => {
				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => {
					if (metaFeatureLink.source) {
						const isHidden = !this.filterBox.toDisplay(filterValues, metaFeatureLink.source, Array(5), null);
						metaFeatureLink.isHidden = isHidden;
						metaFeatureLink.$wrpLink.toggleClass("hidden", isHidden);
					}
				});

				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => metaFeatureLink.$dispComma.toggleClass("hidden", false));
				const lastVisible = metaTblRow.metasFeatureLinks.filter(metaFeatureLink => !metaFeatureLink.isHidden).last();
				if (lastVisible) lastVisible.$dispComma.addClass("hidden");
			});
		};

		$$`<div class="pf2-table pf2-table--advancements">
			<div class="pf2-table__label">Your</div>
			<div class="pf2-table__label"></div>
			<div class="pf2-table__label">Level</div>
			<div class="pf2-table__label">Class Features</div>
			${metasTblRows.map(it => it.$row)}
		</div>`.appendTo($wrpTblClass);
		$wrpTblClass.show();
	}

	async _render_pRenderSubclassTabs () {
		const $wrp = $(`#subclasstabs`).empty();

		this._render_renderSubclassPrimaryControls($wrp);
		await this._render_pInitSubclassControls($wrp);
	}

	_render_renderSubclassPrimaryControls ($wrp) {
		const cls = this.activeClass;

		// region features/fluff
		const $btnToggleFeatures = ComponentUiUtil.$getBtnBool(this, "isHideFeatures", {
			text: "Features",
			isInverted: true,
		}).title("Toggle Class Features");

		const $btnToggleFluff = ComponentUiUtil.$getBtnBool(this, "isShowFluff", {text: "Info"}).title("Toggle Class Info");

		$$`<div class="flex-v-center m-1 btn-group mr-3 no-shrink">${$btnToggleFeatures}${$btnToggleFluff}</div>`.appendTo($wrp);
		// endregion

		// region subclasses
		const $wrpHTabs = $(`<div class="flex-v-center flex-wrap mr-2 w-100"/>`).appendTo($wrp);
		this._listSubclass = new List({
			$wrpList: $wrpHTabs,
			isUseJquery: true,
			fnSort: ClassesPage._fnSortSubclassFilterItems,
		});
		const subclasses = this.activeClass.subclasses;

		this._ixDataSubclass = 0;
		for (; this._ixDataSubclass < subclasses.length; ++this._ixDataSubclass) {
			const sc = subclasses[this._ixDataSubclass];
			const listItem = this._render_getSubclassTab(cls, sc, this._ixDataSubclass);
			if (!listItem) continue;
			this._listSubclass.addItem(listItem);
		}

		const $dispCount = $(`<div class="text-muted m-1 cls-tabs__sc-not-shown flex-vh-center"/>`);
		this._listSubclass.addItem(new ListItem(
			-1,
			$dispCount,
			null,
			{isAlwaysVisible: true},
		));

		this._listSubclass.on("updated", () => {
			$dispCount.off("click");
			if (this._listSubclass.visibleItems.length) {
				const cntNotShown = this._listSubclass.items.length - this._listSubclass.visibleItems.length;
				$dispCount.html(cntNotShown ? `<i class="clickable" title="Adjust your filters to see more.">(${cntNotShown} more not shown)</i>` : "").click(() => this._doSelectAllSubclasses());
			} else if (this._listSubclass.items.length > 1) {
				$dispCount.html(`<i class="clickable" title="Adjust your filters to see more.">(${this._listSubclass.items.length - 1} subclasses not shown)</i>`).click(() => this._doSelectAllSubclasses());
			} else $dispCount.html("");
		});

		this._listSubclass.init();
		// endregion
	}

	_doSelectAllSubclasses () {
		const allStateKeys = this.activeClass.subclasses.map(sc => UrlUtil.getStateKeySubclass(sc));

		this._pageFilter.sourceFilter.doSetPillsClear();
		this.filterBox.fireChangeEvent();
		this._proxyAssign("state", "_state", "__state", allStateKeys.mergeMap(stateKey => ({[stateKey]: true})));
	}

	async _render_pInitSubclassControls ($wrp) {
		const cls = this.activeClass;

		const $btnSelAll = $(`<button class="btn btn-xs btn-default" title="Select All (SHIFT to include most recent UA/etc.; CTRL to select official only)"><span class="glyphicon glyphicon-check"/></button>`)
			.click(evt => {
				const allStateKeys = this._getActiveSubclasses().map(sc => UrlUtil.getStateKeySubclass(sc));
				if (evt.shiftKey) {
					this._doSelectAllSubclasses();
				} else if (evt.ctrlKey || evt.metaKey) {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					this._listSubclass.visibleItems
						.filter(it => it.values.mod === "brew" || it.values.mod === "fresh")
						.map(it => it.values.stateKey)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				} else {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					this._listSubclass.visibleItems
						.map(it => it.values.stateKey)
						.filter(Boolean)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				}
			});

		// TODO: Option for Homebrew/Official filter?
		const filterSets = [
			{name: "View Official", subHashes: [], isClearSources: false},
			{name: "View All", subHashes: [], isClearSources: true},
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
				cpySubHashes.push(`flstsource:${sourcePart}`)
			}

			this.filterBox.setFromSubHashes([
				...boxSubhashes,
				...cpySubHashes,
				`flopsource:extend`,
			].filter(Boolean), true);
			$selFilterPreset.val("-1");
		};
		const $selFilterPreset = $(`<select class="input-xs form-control cls-tabs__sel-preset"><option value="-1" disabled>Filter...</option></select>`)
			.change(() => {
				const val = Number($selFilterPreset.val());
				if (val == null) return;
				setFilterSet(val)
			});
		filterSets.forEach((it, i) => $selFilterPreset.append(`<option value="${i}">${it.name}</option>`));
		$selFilterPreset.val("-1");

		const $btnReset = $(`<button class="btn btn-xs btn-default" title="Reset Selection"><span class="glyphicon glyphicon-refresh"/></button>`)
			.click(() => {
				this._proxyAssign("state", "_state", "__state", cls.subclasses.mergeMap(sc => ({[UrlUtil.getStateKeySubclass(sc)]: false})));
			});

		this.filterBox.on(FilterBox.EVNT_VALCHANGE, this._handleSubclassFilterChange.bind(this));
		this._handleSubclassFilterChange();
		// Remove the temporary "hidden" class used to prevent popping
		this._listSubclass.items.forEach(it => it.ele.removeClass("hidden"));

		const $btnToggleSources = ComponentUiUtil.$getBtnBool(this, "isShowScSources", {$ele: $(`<button class="btn btn-xs btn-default flex-1" title="Show Subclass Sources"><span class="glyphicon glyphicon-book"/></button>`)});

		const $btnShuffle = $(`<button title="Feeling Lucky?" class="btn btn-xs btn-default flex-1"><span class="glyphicon glyphicon-random"/></button>`)
			.click(() => {
				if (!this._listSubclass.visibleItems.length) {
					return JqueryUtil.doToast({
						content: "No subclasses to choose from!",
						type: "warning",
					});
				}

				const doDeselAll = () => this._listSubclass.items.filter(it => it.values.stateKey).forEach(it => this._state[it.values.stateKey] = false);

				const visibleSubclasses = this._listSubclass.visibleItems.filter(it => it.values.stateKey)
				const activeKeys = Object.keys(this._state).filter(it => this._state[it] && it.startsWith("sub"));
				const visibleActiveKeys = visibleSubclasses.map(it => it.values.stateKey).filter(it => activeKeys.includes(it));

				// Avoid re-selecting the same option if there's only one selected, unless there is only one subclass total
				if (visibleActiveKeys.length === 1 && visibleSubclasses.length !== 1) {
					doDeselAll();
					const options = this._listSubclass.visibleItems.filter(it => it.values.stateKey).map(it => it.values.stateKey).filter(it => it !== visibleActiveKeys[0]);
					this._state[RollerUtil.rollOnArray(options)] = true;
				} else {
					doDeselAll();
					const it = RollerUtil.rollOnArray(this._listSubclass.visibleItems.filter(it => it.values.stateKey));
					this._state[it.values.stateKey] = true;
				}
			});

		$$`<div class="flex-v-center m-1 no-shrink">${$selFilterPreset}</div>`.appendTo($wrp);
		$$`<div class="flex-v-center m-1 btn-group no-shrink">
			${$btnSelAll}${$btnShuffle}${$btnReset}${$btnToggleSources}
		</div>`.appendTo($wrp);
	}

	_handleSubclassFilterChange () {
		const f = this.filterBox.getValues();
		const cls = this.activeClass;
		this._listSubclass.filter(li => {
			if (li.values.isAlwaysVisible) return true;
			return this.filterBox.toDisplay(
				f,
				li.data.entity.source,
				Array(5),
				cls._fMisc,
			);
		});
	}

	_render_getSubclassTab (cls, sc, ix) {
		const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source);

		const stateKey = UrlUtil.getStateKeySubclass(sc);
		const mod = ClassesPage.getSubclassCssMod(cls, sc);
		const clsActive = `cls__btn-sc--active-${mod}`;

		if (this._state[stateKey] == null) this._state[stateKey] = false;

		const $dispName = $(`<div title="${sc.name.toTitleCase()}; Source: ${sc.source}"/>`);
		const $dispSource = $(`<div class="ml-1" title="${Parser.sourceJsonToFull(sc.source)}">(${Parser.sourceJsonToAbv(sc.source)})</div>`);
		const hkSourcesVisible = () => {
			$dispName.text(sc.name);
			$dispSource.toggleClass("hidden", !this._state.isShowScSources);
		};
		this._addHookBase("isShowScSources", hkSourcesVisible);
		MiscUtil.pDefer(hkSourcesVisible);

		// Initially have these "hidden," to prevent them popping out when we filter them
		const $btn = $$`<button class="btn btn-default btn-xs flex-v-center m-1 hidden ${sc.isReprinted ? "cls__btn-sc--reprinted" : ""}">
				${$dispName}
				${$dispSource}
			</button>`
			.click(() => this._state[stateKey] = !this._state[stateKey])
			.contextmenu(evt => {
				evt.preventDefault();
				this._state[stateKey] = !this._state[stateKey];
			});
		const hkVisible = () => $btn.toggleClass(clsActive, !!this._state[stateKey]);
		this._addHookBase(stateKey, hkVisible);
		MiscUtil.pDefer(hkVisible);

		return new ListItem(
			ix,
			$btn,
			sc.name,
			{
				source: sc.source,
				stateKey,
				mod,
			},
			{
				isExcluded,
				entity: sc,
				uniqueId: sc.uniqueId ? sc.uniqueId : ix,
			},
		);
	}

	static getSubclassCssMod (cls, sc) {
		if (sc.source !== cls.source) {
			return BrewUtil.hasSourceJson(sc.source)
				? "brew"
				: SourceUtil.isNonstandardSource(sc.source)
					? sc.isReprinted ? "stale" : "spicy"
					: sc.isReprinted ? "reprinted" : "fresh";
		}
		return "fresh";
	}

	_render_renderFeat () {
		const $featStats = $(`#featstats`).empty();
		const feat = this.activeFeat;
		RenderFeats.$getRenderedFeat(feat).appendTo($featStats);
		$featStats.show();
	}

	static _render_$getNoContent () {
		return $(`<div class="pf2-h1-flavor text-center">Toggle a button to view class information</div>`)
	}

	_getDefaultState () {
		return MiscUtil.copy(ClassesPage._DEFAULT_STATE);
	}
}

ClassesPage._DEFAULT_STATE = {
	feature: null,
	isHideFeatures: false,
	isShowFluff: false,
	isShowScSources: false,
};

const classesPage = new ClassesPage()
window.addEventListener("load", () => classesPage.pOnLoad());
