"use strict";

class ClassesPage extends BaseComponent {
	static _ascSortSubclasses (hA, hB) {
		return SortUtil.ascSortLower(hA.type + hA.name, hB.type + hB.name)
	}

	static _fnSortSubclassFilterItems (a, b) {
		const compType = SortUtil._listSort_compareBy(a, b, "type");
		if (a.values.isAlwaysVisible && a.values.type === null) return 1;
		else if (b.values.isAlwaysVisible && b.values.type === null) return -1;
		else if (compType === 0) {
			if (a.values.isAlwaysVisible) return -1;
			else if (b.values.isAlwaysVisible) return 1;
			else return SortUtil.ascSort(a.name, b.name);
		} else return compType;
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

		this._listsSubclasses = {};
		this._ixDataSubclass = 0;

		this._$divNoContent = null;
		this._rng = RollerUtil.roll(1234) + 5678;

		this._activeClassDataFiltered = null;

		this._loadFirstFeat = false;
		this._listFeat = null;
		this._ixFeatData = 0;
		this._featDataList = [];
		this._featFilter = new PageFilterFeats({
			typeDeselFn: it => it === "Class",
			sourceFilterOpts: {
				selFn: it => !SourceUtil.isNonstandardSource(it),
			},
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
		const feats = await DataUtil.feat.loadJSON();

		this._list = ListUtil.initList({listClass: "classes", isUseJquery: true, syntax: this._listSyntax});
		this._listFeat = ListUtil.initList({listClass: "feats", isUseJquery: true, syntax: this._listSyntax}, {
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
			namespace: "classes.classes",
		});
		await this._featFilter.pInitFilterBox({
			$iptSearch: $(`#feat-lst__search`),
			$wrpFormTop: $(`#feat-filter-search-group`),
			$btnReset: $(`#feat-reset`),
			namespace: "classes.feats",
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

		const $btnLink = ListUtil.getOrTabRightButton(`btn-feat-link`, `list`, "a");
		$btnLink.title("View this feat on the Feats page");
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
		Renderer.hover.bindPopoutButton($btnPop, this._featDataList, null, null, UrlUtil.PG_FEATS);
		UrlUtil.bindLinkExportButtonMulti(this.filterBox, $(`#btn-link-export-cls`));

		await this._pInitAndRunRender();

		ExcludeUtil.checkShowAllExcluded(this._dataList, $(`#classstats`));
		ExcludeUtil.checkShowAllExcluded(this._featDataList, $(`#featstats`));
		this._initLinkGrabbers();

		Hist.initialLoad = false;

		// Finally, ensure the hash correctly matches the state
		this._setHashFromState(true);

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pHandleBrew (homebrew) {
		const {class: rawClassData, subclass: rawSubclassData, feat: rawFeatData} = homebrew;
		const cpy = MiscUtil.copy({class: rawClassData, subclass: rawSubclassData, feat: rawFeatData});
		if (cpy.class) {
			for (let i = 0; i < cpy.class.length; ++i) {
				cpy.class[i] = await DataUtil.class.pGetDereferencedClassData(cpy.class[i])
			}
		}
		if (cpy.subclass) {
			for (let i = 0; i < cpy.subclass.length; ++i) {
				cpy.subclass[i] = await DataUtil.class.pGetDereferencedSubclassData(cpy.subclass[i])
			}
		}

		const {isAddedAnyClass, isAddedAnySubclass} = this._addData(cpy);
		const isAddedFeats = this._addFeatsData(cpy);

		if ((isAddedAnySubclass || isAddedFeats) && !Hist.initialLoad) await this._pDoRender(true);
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
			const cls = this._dataList.find(c => c.name.toLowerCase() === sc.className.toLowerCase() && c.source.toLowerCase() === (sc.classSource || SRC_CRB).toLowerCase());
			if (!cls) {
				JqueryUtil.doToast({
					content: `Could not add subclass; could not find class with name: ${cls.name} and source ${sc.source || SRC_CRB}`,
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
			if (!key.startsWith("_")) this._featFilter._classFilter.setValue(key, 0)
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
				document.title = `${cls ? cls.name : "Classes"} - Pf2eTools`;
				target._ = ixToLoad;
				this._loadFirstFeat = true;
				this._rng = RollerUtil.roll(1234) + 5678;
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
			JqueryUtil.doToast({content: "Could not find the feat to load!", type: "danger"})
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
		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat);
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
		const cpyCls = MiscUtil.copy(this.activeClassRaw);
		const walker = MiscUtil.getWalker({
			keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST,
			isAllowDeleteObjects: true,
			isDepthFirst: true,
		});

		cpyCls.classFeatures = cpyCls.classFeatures.map(lvlFeatures => {
			return walker.walk(
				lvlFeatures,
				{
					object: (obj) => {
						if (!obj.source) return obj;
						return this.filterBox.toDisplayByFilters(
							f,
							{
								filter: this._pageFilter.sourceFilter,
								value: obj.gainSubclassFeature && this._pageFilter.isAnySubclassDisplayed(f, cpyCls) ? this._pageFilter.getActiveSource(f) : obj.source,
							},
						) ? obj : null;
					},
					array: (arr) => {
						return arr.filter(it => it != null);
					},
				},
			);
		});

		(cpyCls.subclasses || []).forEach(sc => {
			sc.subclassFeatures = sc.subclassFeatures.map(lvlFeatures => {
				return walker.walk(
					lvlFeatures,
					{
						object: (obj) => {
							if (!obj.source) return obj;
							const fText = obj.isClassFeatureVariant ? {isClassFeatureVariant: true} : null;
							return this.filterBox.toDisplayByFilters(
								f,
								{
									filter: this._pageFilter.sourceFilter,
									value: obj.source,
								},
								{
									filter: this._pageFilter.optionsFilter,
									value: fText,
								},
							) ? obj : null;
						},
						array: (arr) => {
							return arr.filter(it => it != null);
						},
					},
				);
			});
		});

		cpyCls.fluff = cpyCls.fluff.map(fluffEntry => {
			return walker.walk(
				fluffEntry,
				{
					object: (obj) => {
						const src = obj.source || cpyCls.source;
						return this.filterBox.toDisplayByFilters(
							f,
							{
								filter: this._pageFilter.sourceFilter,
								value: src,
							},
						) ? obj : null;
					},
				},
			);
		});

		this._activeClassDataFiltered = cpyCls
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
		this._addHookAll("classId", async () => {
			this._doGenerateFilteredActiveClassData();
			await this._pDoSynchronizedRender();
		});

		this._addHookAll("featId", async () => {
			await this._pDoSynchronizedRender(true);
		});

		this._doGenerateFilteredActiveClassData();
		await this._pDoRender();
	}

	async _pDoSynchronizedRender (skipClsRender) {
		await this._pLock("render");
		try {
			await this._pDoRender(skipClsRender);
		} finally {
			this._unlock("render");
		}
	}

	async _pDoRender (skipClsRender) {
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
						state.feature = null;
						const href = `#${this._getHashState({class: it.data.entity, blankFeatHash: true, state})}`;
						it.data.$lnk.attr("href", href)
					});
				if (this._state.isShowFeats) {
					this._listFeat.items
						.filter(it => it.data.$lnk)
						.forEach(it => {
							state.feature = null;
							const href = `#${this._getHashState({feat: it.data.entity, state})}`;
							it.data.$lnk.attr("href", href)
						});
				}
			}, 5);
		};
		this._addHook("classId", "_", hkSetHref);
		this._addHook("featId", "_", hkSetHref);
		this._addHookAll("state", hkSetHref);
		hkSetHref();
		// endregion

		// region rendering
		if (!skipClsRender) {
			this._render_renderClass();
			this._render_renderClassAdvancementTable()
		}
		this._render_renderSubclassTabs();
		this._render_renderFeat();
		// endregion

		// region state handling
		const keepYScroll = (hook) => {
			const topEle = $(`#classesstats`).children().get().filter(it => it.getBoundingClientRect().bottom > 0)[0];
			if (!topEle) {
				hook();
				return;
			}
			const offset = topEle.id === "class-name" ? -topEle.getBoundingClientRect().y : 1 - topEle.getBoundingClientRect().y;
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
		this._addHookBase("isShowFluff", () => keepYScroll(hkDisplayFluff));
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
					$dispClassTitle.toggleClass("hidden", false);
				} else {
					$dispClassTitle.toggleClass("hidden", !this._state.isShowFluff)
					this._$wrpOutline.toggleClass("hidden", true);
					this._$divNoContent.toggleClass("hidden", this._state.isShowFluff);
					$dispClassFeatures.toggleClass("hidden", true);
					$dispFeaturesSubclassHeader.toggleClass("hidden", true);
				}
			} else {
				$dispClassTitle.toggleClass("hidden", false);
				this._$wrpOutline.toggleClass("hidden", false);
				this._$divNoContent.toggleClass("hidden", true);
				$dispClassFeatures.toggleClass("hidden", false);
				$dispFeaturesSubclassHeader.toggleClass("hidden", false);
			}
		};
		this._addHookBase("isHideFeatures", () => keepYScroll(hkDisplayFeatures));
		MiscUtil.pDefer(hkDisplayFeatures);

		const hkShowFeats = () => {
			const $clsWrp = $(`#classesstats-wrp`);
			const $featView = $(`.feat-view`);

			if (this._state.isShowFeats) {
				$clsWrp.toggleClass("hidden", true);
				$featView.toggleClass("hidden", false);
			} else {
				$clsWrp.toggleClass("hidden", false);
				$featView.toggleClass("hidden", true);
			}
		};
		this._addHookBase("isShowFeats", hkShowFeats);
		MiscUtil.pDefer(hkShowFeats);

		const cls = this.activeClass;
		cls.subclasses.forEach(sc => {
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			const hkDisplaySubclass = () => {
				const isVisible = this._state[stateKey];
				$(`[data-subclass-id="${stateKey}"]`).toggleClass("hidden", !isVisible);
			};
			this._addHookBase(stateKey, () => keepYScroll(hkDisplaySubclass));
			// Check/update main feature display here, as if there are no subclasses active we can hide more
			this._addHookBase(stateKey, () => keepYScroll(hkDisplayFeatures));
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

		const statSidebarEntries = Parser.getClassSideBarEntries(cls);
		const statSidebar = Parser.getClassSideBar(statSidebarEntries);
		const className = {
			type: "pf2-h1",
			name: cls.name,
			source: cls.source,
			page: cls.page,
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
				`${cls.hp} plus your Constitution Modifier`,
				"You increase your maximum number of HP by this number at 1st level and every level thereafter.",
			],
		};
		const fluffStack = [""];
		renderer.recursiveRender(cls.fluff, fluffStack, {prefix: "<p class=\"pf2-p\">", suffix: "</p>"})

		$$`<div id="class-name">${renderer.render(className)}</div>
		<div class="pf2-fluff">${renderer.render(flavor)}</div>
		<div data-feature-type="class"><div class="pf2-sidebar--class mobile__hidden">${renderer.render(statSidebar)}</div></div>
		<div data-feature-type="class">${renderer.render(keyAbility)}</div>
		<div data-feature-type="class"><div class="pf2-sidebar--class pf2-sidebar--compact mobile__visible">${statSidebarEntries.map(e => `<div>${renderer.render({type: "pf2-title", name: e.name})}${e.entries.map(r => `<p class="pf2-sidebar__text">${renderer.render(r)}</p>`).join("")}</div>`)}</div></div>
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
						source: feature.source,
						page: feature.page,
					}))
					.appendTo($classStats)

				if (feature.gainSubclassFeature) {
					$divClassFeature.attr("data-feature-type", "gain-subclass");
					cls.subclasses.forEach(sc => {
						const scLvlFeatures = sc.subclassFeatures[ixScLvl];
						if (!scLvlFeatures) return;

						scLvlFeatures.filter(it => it.name === feature.name).forEach((scFeature) => {
							const ptSources = ixScLvl === 0 && sc.otherSources ? `{@note ${Renderer.utils.getPageP(sc, {prefix: "{@b Subclass source:} "})}}` : "";
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
		const renderer = Renderer.get()
		const metasTblRows = cls.classFeatures.map((lvlFeatures, ixLvl) => {
			const lvlFeaturesFilt = lvlFeatures
				.filter(it => it.name && it.type !== "inset"); // don't add inset entry names to class table
			if (this._pageFilter.isClassNaturallyDisplayed(this.filterBox.getValues(), cls)) {
				// for each cls.advancement, check
				Object.keys(cls.advancement).forEach(key => {
					// is it an array, in which case go through the default cases
					// or is it an object, in which case push it's entry
					if (Array.isArray(cls.advancement[key]) && cls.advancement[key].slice(1).includes(ixLvl + 1)) {
						switch (key) {
							case "classFeats": {
								lvlFeaturesFilt.push({
									name: "class feat",
									source: cls.source,
									$lnk: $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:class=1,flstclasses:${this.activeClass.name.toLowerCase()}=1">class feat</a>`),
									preCalc: true,
								});
								break;
							}
							case "generalFeats": {
								lvlFeaturesFilt.push({
									name: "general feat",
									source: cls.source,
									$lnk: $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:general=1">general feat</a>`),
									preCalc: true,
								});
								break;
							}
							case "skillFeats": {
								lvlFeaturesFilt.push({
									name: "skill feat",
									source: cls.source,
									$lnk: $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:skill=1~archetype=2">skill feat</a>`),
									preCalc: true,
								});
								break;
							}
							case "ancestryFeats": {
								lvlFeaturesFilt.push({
									name: "ancestry feat",
									source: cls.source,
									$lnk: $(`<a href="feats.html#blankhash,flstlevel:max=${ixLvl + 1},flsttype:ancestry=1">ancestry feat</a>`),
									preCalc: true,
								});
								break;
							}
							case "skillIncrease": {
								lvlFeaturesFilt.push({
									name: "skill increase",
									source: cls.source,
									$lnk: $(`<span>skill increase</span>`),
									preCalc: true,
								});
								break;
							}
							case "abilityBoosts": {
								lvlFeaturesFilt.push({
									name: "ability boosts",
									source: cls.source,
									$lnk: $(`<span>ability boosts</span>`),
									preCalc: true,
								});
								break;
							}
						}
					} else if (MiscUtil.isObject(cls.advancement[key]) && cls.advancement[key].levels.slice(1).includes(ixLvl + 1)) {
						lvlFeaturesFilt.push({
							name: cls.advancement[key].name,
							source: cls.source,
							$lnk: $(`${renderer.render(cls.advancement[key].entry.replace(`\${level}`, `${ixLvl + 1}`))}`),
							preCalc: true,
						});
					}
				});
			}
			// FIXME: this works for now
			const skipSort = lvlFeaturesFilt.filter(f => !f.preCalc).length;
			const metasFeatureLinks = lvlFeaturesFilt.sort(skipSort ? () => {} : SortUtil.compareListNames)
				.map((it, ixFeature) => {
					const featureId = `${ixLvl}-${lvlFeaturesFilt.filter(ft => !ft.preCalc).indexOf(it)}`;

					let $lnk;
					let name;
					let source;

					if (it.preCalc) {
						$lnk = it.$lnk;
						name = it.name;
						source = it.source;
					} else {
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
					}

					// Make a dummy for the last item
					const $dispComma = ixFeature === lvlFeaturesFilt.length - 1 ? $(`<span/>`) : $(`<span>,&nbsp;</span>`);
					return {
						name,
						$wrpLink: $$`<span>${$lnk}${$dispComma}</span>`,
						$lnk,
						$dispComma,
						source,
						isHidden: false,
					};
				});
			return {
				$row: $$`<div class="pf2-table__entry pf2-table--minimize ${ixLvl % 2 ? "odd" : ""}">${ixLvl + 1}</div>
					<div class="pf2-table__entry pf2-table--minimize ${ixLvl % 2 ? "odd" : ""}">${metasFeatureLinks.length ? metasFeatureLinks.map(it => it.$wrpLink) : `\u2014`}</div>`,
				metasFeatureLinks,
			}
		});

		this._fnTableHandleFilterChange = (filterValues) => {
			metasTblRows.forEach(metaTblRow => {
				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => {
					if (metaFeatureLink.source) {
						// FIXME: length of _filters hardcoded...
						const isHidden = !this.filterBox.toDisplay(filterValues, metaFeatureLink.source, Array(5), null);
						metaFeatureLink.isHidden = isHidden;
						metaFeatureLink.$wrpLink.toggleClass("hidden", isHidden);
					}
				});

				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => metaFeatureLink.$dispComma.toggleClass("hidden", false));
				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => metaFeatureLink.$lnk.html(metaFeatureLink.$lnk.html().toLowerCase()));
				const firstVisible = metaTblRow.metasFeatureLinks.filter(metaFeatureLink => !metaFeatureLink.isHidden)[0];
				const lastVisible = metaTblRow.metasFeatureLinks.filter(metaFeatureLink => !metaFeatureLink.isHidden).last();
				if (firstVisible) firstVisible.$lnk.html(firstVisible.$lnk.html().uppercaseFirst());
				if (lastVisible) lastVisible.$dispComma.addClass("hidden");
			});
		};

		$$`<div class="pf2-table pf2-table--advancements">
			<div class="pf2-table__label">Your</div>
			<div class="pf2-table__label"></div>
			<div class="pf2-table__label">Level</div>
			<div class="pf2-table__label"><span>Class Features${Renderer.get()._renderTable_getMinimizeButton()}</span></div>
			${metasTblRows.map(it => it.$row)}
		</div>`.appendTo($wrpTblClass);
		$wrpTblClass.show();
	}

	_render_renderSubclassTabs () {
		const $wrp = $(`#subclasstabs`).empty();

		this._render_renderSubclassPrimaryControls($wrp);
		this._render_initSubclassControls($wrp);
		this._render_renderSubclassButtons($wrp);
	}

	_render_renderSubclassPrimaryControls ($wrp) {
		const $btnToggleFeatures = ComponentUiUtil.$getBtnBool(this, "isHideFeatures", {
			text: "Class Features",
			isInverted: true,
		}).title("Toggle Class Features");

		const $btnToggleFluff = ComponentUiUtil.$getBtnBool(this, "isShowFluff", {text: "Info"}).title("Toggle Class Info");

		const $btnToggleFeats = ComponentUiUtil.$getBtnBool(this, "isShowFeats", {
			text: "Show Feats",
			activeClass: "btn-danger",
			activeText: "Hide Feats",
			inactiveText: "Show Feats",
		}).title("Toggle Feat View").addClass("mb-1");

		const imageLinks = ((this.activeClass.summary || {}).images || []).map(l => `<li><a href="${l}" target="_blank" rel="noopener noreferrer">${l}</a></li>`);
		const $dropDownImages = $(`<li class="dropdown" style="list-style: none"></li>`);
		const $dropDownImagesButton = $(`<button class="btn btn-default btn-xs mr-2 mb-1 flex-3">Images</button>`).on("click", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			$dropDownImagesButton.toggleClass("ui-tab__btn-tab-head");
			$dropDownImages.toggleClass("open");
		}).appendTo($dropDownImages);
		const $dropDownImagesContent = $(`<li class="dropdown-menu dropdown-menu--top" style="margin-top: -0.25rem !important; border-radius: 0"></li>`).appendTo($dropDownImages);
		imageLinks.forEach(l => $dropDownImagesContent.append(l));
		document.addEventListener("click", () => {
			$dropDownImages.toggleClass("open", false)
			$dropDownImagesButton.toggleClass("ui-tab__btn-tab-head", false);
		});

		$$`<div class="flex-v-center m-1 flex-wrap">
			<div class="mr-2 no-shrink">${$btnToggleFeats}</div>
			${imageLinks.length ? $$`<div class="mr-2 no-shrink">${$dropDownImages}</div>` : ""}
			<div class="btn-group no-shrink mb-1 ml-auto">${$btnToggleFeatures}${$btnToggleFluff}</div>
		</divc>`.appendTo($wrp);
	}

	_render_renderSubclassButtons ($wrp) {
		const cls = this.activeClass;
		const subclasses = this.activeClass.subclasses;

		this._ixDataSubclass = 0;
		this._listsSubclasses = {};
		for (; this._ixDataSubclass < subclasses.length; ++this._ixDataSubclass) {
			const sc = subclasses[this._ixDataSubclass];
			if (!this._listsSubclasses[sc.type]) {
				const $wrpList = $(`<div class="flex-v-center flex-wrap mr-2 w-100 cls-sc-tabs__wrp" data-sc-type="${sc.type}"></div>`).appendTo($wrp);
				this._listsSubclasses[sc.type] = new List({
					$wrpList: $wrpList,
					isUseJquery: true,
					fnSort: ClassesPage._fnSortSubclassFilterItems,
				});
			}
			const listItem = this._render_getSubclassTab(cls, sc, this._ixDataSubclass);
			if (!listItem) continue;
			this._listsSubclasses[sc.type].addItem(listItem);
		}

		Object.values(this._listsSubclasses).forEach(list => {
			const $dispCount = $(`<div class="text-muted m-1 cls-tabs__sc-not-shown flex-vh-center"/>`);
			list.addItem(new ListItem(
				-1,
				$dispCount,
				null,
				{isAlwaysVisible: true},
			));
			list.on("updated", () => {
				$dispCount.off("click");
				if (list.visibleItems.length) {
					const cntNotShown = list.items.length - list.visibleItems.length;
					$dispCount.html(cntNotShown ? `<i class="clickable" title="Adjust your filters to see more.">(${cntNotShown} more not shown)</i>` : "").click(() => this._doSelectAllSubclasses());
				} else if (list.items.length > 1) {
					$dispCount.html(`<i class="clickable" title="Adjust your filters to see more.">(${list.items.length - 1} subclasses not shown)</i>`).click(() => this._doSelectAllSubclasses());
				} else $dispCount.html("");
			});

			list.init();
		});

		this.filterBox.on(FilterBox.EVNT_VALCHANGE, this._handleSubclassFilterChange.bind(this));
		this._handleSubclassFilterChange();
		// Remove the temporary "hidden" class used to prevent popping
		Object.values(this._listsSubclasses).forEach(list => list.items.forEach(it => it.ele.removeClass("hidden")));
	}

	_doSelectAllSubclasses () {
		const allStateKeys = this.activeClass.subclasses.map(sc => UrlUtil.getStateKeySubclass(sc));

		this._pageFilter.sourceFilter.doSetPillsClear();
		this.filterBox.fireChangeEvent();
		this._proxyAssign("state", "_state", "__state", allStateKeys.mergeMap(stateKey => ({[stateKey]: true})));
	}

	_render_initSubclassControls ($wrp) {
		const cls = this.activeClass;

		const $btnSelAll = $(`<button class="btn btn-xs btn-default flex-1" title="Select All"><span class="glyphicon glyphicon-check"/></button>`)
			.click(evt => {
				const allStateKeys = this._getActiveSubclasses().map(sc => UrlUtil.getStateKeySubclass(sc));
				if (evt.shiftKey) {
					this._doSelectAllSubclasses();
				} else if (evt.ctrlKey || evt.metaKey) {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					Object.values(this._listsSubclasses).map(l => l.visibleItems)
						.flat()
						.filter(it => it.values.mod === "brew" || it.values.mod === "fresh")
						.map(it => it.values.stateKey)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				} else {
					const nxtState = {};
					allStateKeys.forEach(k => nxtState[k] = false);
					Object.values(this._listsSubclasses).map(l => l.visibleItems.map(it => it.values.stateKey))
						.flat()
						.filter(Boolean)
						.forEach(stateKey => nxtState[stateKey] = true);
					this._proxyAssign("state", "_state", "__state", nxtState);
				}
			});

		// TODO: Option for Homebrew/Official filter?
		const filterSets = [
			{name: "Select Official", subHashes: [], isClearSources: false},
			{name: "Select All", subHashes: [], isClearSources: true},
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
				cpySubHashes.push(`flst.classes.classessource:${sourcePart}`)
			}

			this.filterBox.setFromSubHashes([
				...boxSubhashes,
				...cpySubHashes,
				`flop.classes.classessource:extend`,
			].filter(Boolean), true);
			Object.values(this._listsSubclasses).forEach(list => list.visibleItems.filter(it => it.values.stateKey).forEach(it => this._state[it.values.stateKey] = true));
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
				this._proxyAssign("state", "_state", "__state", cls.subclasses.mergeMap(sc => ({[UrlUtil.getStateKeySubclass(sc)]: false})));
			});

		const $btnToggleSources = ComponentUiUtil.$getBtnBool(this, "isShowScSources", {$ele: $(`<button class="btn btn-xs btn-default flex-1" title="Show Subclass Sources"><span class="glyphicon glyphicon-book"/></button>`)});

		const $btnShuffle = $(`<button title="Feeling Lucky?" class="btn btn-xs btn-default flex-1"><span class="glyphicon glyphicon-random"/></button>`)
			.click(() => {
				if (Object.values(this._listsSubclasses).map(l => l.visibleItems.length).reduce((a, b) => a + b, 0) === 0) {
					return JqueryUtil.doToast({
						content: "No subclasses to choose from!",
						type: "warning",
					});
				}

				const doDeselAll = (list) => list.items.filter(it => it.values.stateKey).forEach(it => this._state[it.values.stateKey] = false);

				Object.values(this._listsSubclasses).forEach(list => {
					const visibleSubclasses = list.visibleItems.filter(it => it.values.stateKey)
					const activeKeys = Object.keys(this._state).filter(it => this._state[it] && it.startsWith("sub"));
					const visibleActiveKeys = visibleSubclasses.map(it => it.values.stateKey).filter(it => activeKeys.includes(it));

					// Avoid re-selecting the same option if there's only one selected, unless there is only one subclass total
					if (visibleActiveKeys.length === 1 && visibleSubclasses.length !== 1) {
						doDeselAll(list);
						const options = list.visibleItems.filter(it => it.values.stateKey).map(it => it.values.stateKey).filter(it => it !== visibleActiveKeys[0]);
						this._state[RollerUtil.rollOnArray(options)] = true;
					} else {
						doDeselAll(list);
						const it = RollerUtil.rollOnArray(list.visibleItems.filter(it => it.values.stateKey));
						this._state[it.values.stateKey] = true;
					}
				});
			});

		$$`<div class="flex-v-center m-1 flex-wrap">${$selFilterPreset}
			<div class="btn-group flex-1 flex-h-center mb-1">${$btnSelAll}${$btnShuffle}${$btnReset}${$btnToggleSources}</div>
		</div>`.appendTo($wrp);
	}

	_handleSubclassFilterChange () {
		const f = this.filterBox.getValues();
		const cls = this.activeClass;
		Object.keys(this._listsSubclasses).forEach(k => this._listsSubclasses[k].filter(li => {
			if (li.values.isAlwaysVisible) return true;
			return this.filterBox.toDisplay(
				f,
				li.data.entity.source,
				Array(5),
				cls._fMisc,
			);
		}));
	}

	_render_getSubclassTab (cls, sc, ix) {
		const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](sc), "subclass", sc.source);

		const stateKey = UrlUtil.getStateKeySubclass(sc);
		const mod = ClassesPage.getSubclassCssMod(cls, sc);
		const clsActive = `cls__btn-sc--active-${mod}`;

		if (this._state[stateKey] == null) this._state[stateKey] = false;

		const $dispName = $(`<div title="${sc.name.toTitleCase()}; Source: ${Parser.sourceJsonToAbv(sc.source)}">${sc.shortName || sc.name}</div>`);
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
				type: sc.type,
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
		this._updateFeatHref();
	}

	_updateFeatHref () {
		const feat = this.activeFeat;
		if (!feat) return;
		$(`#btn-feat-link`).attr("href", `feats.html#${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](feat)}${HASH_PART_SEP}${this.featFilterBox.getSubHashes().map(sh => sh.replace(/\.classes\.feats/, "")).join(HASH_PART_SEP)}`);
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

let classesPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	classesPage = new ClassesPage();
	classesPage.pOnLoad()
});
