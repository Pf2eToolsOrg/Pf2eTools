"use strict";

class FilterUtil {
	static compress (primitive) {
		return UrlUtil.pack(FilterUtil._compress_getBase(primitive));
	}

	static _compress_getBase (primitive) {
		const type = typeof primitive;
		switch (type) {
			case "boolean": return `b${Number(primitive)}`;
			case "number": return `n${primitive}`;
			case "string": return `s${UrlUtil.pack(primitive)}`;
			default: throw new Error(`Unhandled type "${type}"`);
		}
	}

	static decompress (raw) {
		const [type, data] = [raw.slice(0, 1), raw.slice(1)];
		switch (type) {
			case "b": return !!Number(data);
			case "n": return Number(data);
			case "s": return String(data);
			default: throw new Error(`Unhandled type "${type}"`);
		}
	}
}
FilterUtil.SUB_HASH_PREFIX_LENGTH = 4;

class FilterBox {
	static async pGetStoredActiveSources () {
		const stored = await StorageUtil.pGetForPage(FilterBox._STORAGE_KEY);
		if (stored) {
			const sourceFilterData = stored.filters[FilterBox.SOURCE_HEADER];
			if (sourceFilterData) {
				const state = sourceFilterData.state;
				const blue = [];
				const white = [];
				Object.entries(state).forEach(([src, mode]) => {
					if (mode === 1) blue.push(src);
					else if (mode !== -1) white.push(src);
				});
				if (blue.length) return blue; // if some are selected, we load those
				else return white; // otherwise, we load non-red
			}
		}
		return null;
	}

	static selectFirstVisible (entryList) {
		if (History.lastLoadedId && !History.initialLoad) {
			const last = entryList[History.lastLoadedId];
			const lastHash = UrlUtil.autoEncodeHash(last);
			const link = $("#listcontainer").find(`.list a[href="#${lastHash.toLowerCase()}"]`);
			if (!link.length) History._freshLoad();
		} else if (History.lastLoadedId == null && !History.initialLoad) {
			History._freshLoad();
		}
	}

	/**
	 * @param opts Options object.
	 * @param opts.$wrpFormTop Form input group.
	 * @param opts.$btnReset Form reset button.
	 * @param opts.filters Array of filters to be included in this box.
	 * @param [opts.isCompact] True if this box should have a compact/reduced UI.
	 */
	constructor (opts) {
		this._$wrpFormTop = opts.$wrpFormTop;
		this._$btnReset = opts.$btnReset;
		this._filters = opts.filters;
		this._isCompact = opts.isCompact;

		this._doSaveStateDebounced = MiscUtil.debounce(() => this._pDoSaveState(), 50);
		ProxyUtil.decorate(this);
		this.__meta = {...FilterBox._DEFAULT_META};
		this._meta = this._getProxy(this.__meta, "meta");
		this.__minisHidden = {};
		this._minisHidden = this._getProxy(this.__minisHidden, "minisHidden");
		this.__combineAs = {};
		this._combineAs = this._getProxy(this.__combineAs, "combineAs");
		this._$body = $(`body`);
		this._$overlay = null;
	}

	registerMinisHiddenHook (prop, hook) {
		this._addHook("minisHidden", prop, hook);
	}

	isMinisHidden (header) {
		return !!this._minisHidden[header];
	}

	async pDoLoadState () {
		const toLoad = await StorageUtil.pGetForPage(FilterBox._STORAGE_KEY);
		if (toLoad != null) {
			this._setStateFromLoaded(toLoad.box);
			this._filters.forEach(it => it.setStateFromLoaded(toLoad.filters));
		}
	}

	_setStateFromLoaded (state) {
		Object.assign(this._meta, state.meta);
		Object.assign(this._minisHidden, state.minisHidden);
		Object.assign(this._combineAs, state.combineAs);
	}

	async _pDoSaveState () {
		const filterOut = {};
		this._filters.forEach(it => Object.assign(filterOut, it.getSaveableState()));
		const toSave = {
			box: {
				meta: {...this.__meta},
				minisHidden: {...this.__minisHidden},
				combineAs: {...this.__combineAs}
			},
			filters: filterOut
		};
		await StorageUtil.pSetForPage(FilterBox._STORAGE_KEY, toSave);
	}

	render () {
		if (this._$overlay) {
			// already rendered previously; simply update the filters
			this._filters.map(f => f.update());
		} else {
			this._$overlay = this._render_$getOverlay();
			const $wrpMini = $(`<div class="fltr__mini-view btn-group"/>`)
				.insertAfter(this._$wrpFormTop);

			const $children = this._filters.map((f, i) => f.$render({filterBox: this, isFirst: i === 0, $wrpMini}));

			const $btnShowAllFilters = $(`<button class="btn btn-xs btn-default">Show All</button>`)
				.click(() => this.showAllFilters());
			const $btnHideAllFilters = $(`<button class="btn btn-xs btn-default">Hide All</button>`)
				.click(() => this.hideAllFilters());

			const $btnReset = $(`<button class="btn btn-xs btn-default mr-3" title="Reset filters. SHIFT to reset everything.">Reset</button>`)
				.click(evt => this.reset(evt.shiftKey));

			const $btnSettings = $(`<button class="btn btn-xs btn-default"><span class="glyphicon glyphicon-cog"/></button>`)
				.click(() => this._openSettingsModal());

			const $wrpBtnCombineFilters = $(`<div class="btn-group mr-3"></div>`);
			const $btnCombineFilterSettings = $(`<button class="btn btn-xs btn-default"><span class="glyphicon glyphicon-cog"/></button>`)
				.click(() => this._openCombineAsModal());

			const $btnCombineFiltersAs = $(`<button class="btn btn-xs btn-default"/>`)
				.appendTo($wrpBtnCombineFilters)
				.click(() => this._meta.modeCombineFilters = FilterBox._COMBINE_MODES.getNext(this._meta.modeCombineFilters));
			const hook = () => {
				$btnCombineFiltersAs.text(this._meta.modeCombineFilters === "custom" ? this._meta.modeCombineFilters.uppercaseFirst() : this._meta.modeCombineFilters.toUpperCase());
				if (this._meta.modeCombineFilters === "custom") $wrpBtnCombineFilters.append($btnCombineFilterSettings);
				else $btnCombineFilterSettings.detach();
				this._doSaveStateDebounced();
			};
			this._addHook("meta", "modeCombineFilters", hook);
			hook();

			$$`<div class="ui-modal__inner ui-modal__inner--large dropdown-menu">
			<div class="split mb-2 mt-2 flex-v-center">
				<h4 class="m-0">Filters</h4>
				<div class="flex-v-center">
					<div class="mr-2">Combine filters as...</div>
					${$wrpBtnCombineFilters}
					<div class="btn-group mr-2">
						${$btnShowAllFilters}
						${$btnHideAllFilters}
					</div>
					${$btnReset}
					${$btnSettings}
				</div>
			</div>
			<hr class="full-width m-0 mb-2">
			
			<hr class="mt-1 mb-1">
			<div class="ui-modal__scroller smooth-scroll px-1">
				${$children}
			</div>
			</div>`
				.click((evt) => evt.stopPropagation())
				.appendTo(this._$overlay);

			this._$btnReset
				.attr("title", "Reset filters. SHIFT to reset everything.")
				.click((evt) => this.reset(evt.shiftKey));

			if (!this._isCompact) {
				const $btnToggleSummaryHidden = $(`<button class="btn btn-default" title="Toggle Filter Summary Display"><span class="glyphicon glyphicon-resize-small"/></button>`)
					.click(() => {
						this._meta.isSummaryHidden = !this._meta.isSummaryHidden;
						this._doSaveStateDebounced();
					})
					.prependTo(this._$wrpFormTop);
				const summaryHiddenHook = () => {
					$btnToggleSummaryHidden.toggleClass("active", !!this._meta.isSummaryHidden);
					$wrpMini.toggleClass("hidden", !!this._meta.isSummaryHidden);
				};
				this._addHook("meta", "isSummaryHidden", summaryHiddenHook);
				summaryHiddenHook();
			}

			$(`<button class="btn btn-default ${this._isCompact ? "px-2" : ""}">Filter</button>`)
				.click(() => this.show())
				.prependTo(this._$wrpFormTop);
		}
	}

	_render_$getOverlay () {
		const $overlay = $(`<div class="modal__wrp modal__wrp--no-centre"/>`).hide().appendTo(this._$body);

		$overlay.click(() => this.hide());

		return $overlay;
	}

	_openSettingsModal () {
		const $modalInner = UiUtil.getShow$Modal({title: "Settings"});
		UiUtil.$getAddModalRowHeader($modalInner, "Hide summary for filter...", {helpText: "The summary is the small red and blue button panel which appear below the search bar."});
		this._filters.forEach(f => UiUtil.$getAddModalRowCb($modalInner, f.header, this._minisHidden, f.header));
	}

	_openCombineAsModal () {
		const $modalInner = UiUtil.getShow$Modal({title: "Filter Combination Logic"});
		const $btnReset = $(`<button class="btn btn-xs btn-default">Reset</button>`)
			.click(() => {
				Object.keys(this._combineAs).forEach(k => {
					this._combineAs[k] = "and";
					$sels.forEach($sel => $sel.val("0"));
				});
			});
		UiUtil.$getAddModalRowHeader($modalInner, "Combine filters as...", {$eleRhs: $btnReset});
		const $sels = this._filters.map(f => UiUtil.$getAddModalRowSel($modalInner, f.header, this._combineAs, f.header, ["and", "or"], {fnDisplay: (it) => it.toUpperCase()}));
	}

	getValues () {
		const outObj = {};
		this._filters.forEach(f => Object.assign(outObj, f.getValues()));
		return outObj;
	}

	addEventListener (type, listener) {
		this._$wrpFormTop[0].addEventListener(type, listener);
	}

	_reset_meta () {
		Object.assign(this._meta, FilterBox._DEFAULT_META);
	}

	_reset_minisHidden () {
		Object.keys(this._minisHidden).forEach(k => this._minisHidden[k] = false);
	}

	_reset_combineAs () {
		Object.keys(this._combineAs).forEach(k => this._combineAs[k] = "and");
	}

	reset (isResetAll) {
		this._filters.forEach(f => f.reset(isResetAll));
		if (isResetAll) {
			this._reset_meta();
			this._reset_minisHidden();
			this._reset_combineAs();
		}
		this.render();
		this.fireChangeEvent();
	}

	show () {
		this._$body.css("overflow", "hidden");
		this._$overlay.show();
	}

	hide () {
		this._$body.css("overflow", "");
		this._$overlay.hide();
		this.fireChangeEvent();
	}

	showAllFilters () {
		this._filters.forEach(f => f.show());
	}

	hideAllFilters () {
		this._filters.forEach(f => f.hide());
	}

	setFromSubHashes (subHashes) {
		const unpacked = {};
		subHashes.forEach(s => {
			const unpackedPart = UrlUtil.unpackSubHash(s, true);
			if (Object.keys(unpackedPart).length > 1) throw new Error(`Multiple keys in subhash!`);
			const k = Object.keys(unpackedPart)[0];
			unpackedPart[k] = {clean: unpackedPart[k], raw: s};
			Object.assign(unpacked, unpackedPart);
		});
		const urlHeaderToFilter = {};
		this._filters.forEach(f => {
			const childFilters = f.getChildFilters();
			// avoid adding parent filters, as resetting them (if no modification occurs) resets all their children
			//  alternately, we could track when a child is modified, and add the parent to the list of filter to be left as-is
			if (childFilters.length) childFilters.forEach(f => urlHeaderToFilter[f.header.toLowerCase()] = f);
			else urlHeaderToFilter[f.header.toLowerCase()] = f;
		});
		const updatedUrlHeaders = new Set();
		const consumed = new Set();

		const filterBoxState = {};
		const statePerFilter = {};
		Object.entries(unpacked)
			.forEach(([hashKey, data]) => {
				const prefix = hashKey.substring(0, FilterUtil.SUB_HASH_PREFIX_LENGTH);
				const urlHeader = hashKey.substring(FilterUtil.SUB_HASH_PREFIX_LENGTH);

				if (FilterUtil.SUB_HASH_PREFIXES.has(prefix) && urlHeaderToFilter[urlHeader]) {
					(statePerFilter[urlHeader] = statePerFilter[urlHeader] || {})[prefix] = data.clean;
					updatedUrlHeaders.add(urlHeader);
					consumed.add(data.raw);
				} else if (Object.values(FilterBox._SUB_HASH_PREFIXES).includes(prefix)) {
					filterBoxState[prefix] = data.clean;
					consumed.add(data.raw);
				} else if (FilterUtil.SUB_HASH_PREFIXES.has(prefix)) throw new Error(`Could not find filter with header ${urlHeader} for subhash ${data.raw}`)
			});

		if (consumed.size) {
			this._setFromSubHashState(urlHeaderToFilter, filterBoxState);

			Object.entries(statePerFilter).forEach(([urlHeader, state]) => {
				const filter = urlHeaderToFilter[urlHeader];
				filter.setFromSubHashState(state);
			});

			// reset any other state/meta state/etc
			Object.keys(urlHeaderToFilter)
				.filter(k => !updatedUrlHeaders.has(k))
				.forEach(k => {
					const filter = urlHeaderToFilter[k];
					filter.reset(true);
				});

			const [link] = History._getHashParts();

			const outSub = [];
			Object.values(unpacked)
				.filter(v => !consumed.has(v.raw))
				.forEach(v => outSub.push(v.raw));

			History.setSuppressHistory(true);
			window.history.replaceState(
				{},
				document.title,
				`${location.origin}${location.pathname}${`#${link}${outSub.length ? `${HASH_PART_SEP}${outSub.join(HASH_PART_SEP)}` : ""}`}`
			);

			this.fireChangeEvent();
			History.hashChange();
			return outSub;
		} else return subHashes;
	}

	_setFromSubHashState (urlHeaderToFilter, filterBoxState) {
		let hasMeta = false;
		let hasMinisHidden = false;
		let hasCombineAs = false;

		Object.entries(filterBoxState).forEach(([k, vals]) => {
			const mappedK = Parser._parse_bToA(FilterBox._SUB_HASH_PREFIXES, k);
			switch (mappedK) {
				case "meta": {
					hasMeta = true;
					const data = vals.map(v => FilterUtil.decompress(v));
					Object.keys(FilterBox._DEFAULT_META).forEach((k, i) => this._meta[k] = data[i]);
					break;
				}
				case "minisHidden": {
					hasMinisHidden = true;
					Object.keys(this._minisHidden).forEach(k => this._minisHidden[k] = false);
					vals.forEach(v => {
						const [urlHeader, isHidden] = v.split("=");
						const filter = urlHeaderToFilter[urlHeader];
						if (!filter) throw new Error(`Could not find filter with name "${urlHeader}"`);
						this._minisHidden[filter.header] = !!Number(isHidden);
					});
					break;
				}
				case "combineAs": {
					hasCombineAs = true;
					Object.keys(this._combineAs).forEach(k => this._combineAs[k] = "and");
					vals.forEach(v => {
						const [urlHeader, ixCombineMode] = v.split("=");
						const filter = urlHeaderToFilter[urlHeader];
						if (!filter) throw new Error(`Could not find filter with name "${urlHeader}"`);
						this._combineAs[filter.header] = FilterBox._COMBINE_MODES[ixCombineMode] || FilterBox._COMBINE_MODES[0];
					});
					break;
				}
			}
		});

		if (!hasMeta) this._reset_meta();
		if (!hasMinisHidden) this._reset_minisHidden();
		if (!hasCombineAs) this._reset_combineAs();
	}

	getSubHashes () {
		const out = [];
		const boxSubHashes = this._getSubHashes();
		if (boxSubHashes) out.push(boxSubHashes);
		out.push(...this._filters.map(f => f.getSubHashes()).filter(Boolean));
		return out.flat();
	}

	_getSubHashes () {
		const out = [];

		// serialize base meta in a set order
		const anyNotDefault = Object.keys(FilterBox._DEFAULT_META).find(k => this._meta[k] !== FilterBox._DEFAULT_META[k]);
		if (anyNotDefault) {
			const serMeta = Object.keys(FilterBox._DEFAULT_META).map(k => FilterUtil.compress(this._meta[k]));
			return [UrlUtil.packSubHash(FilterBox._getSubhashPrefix("meta"), serMeta)]
		}

		// serialize minisHidden as `key=value` pairs
		const setMinisHidden = Object.entries(this._minisHidden).filter(([k, v]) => !!v).map(([k]) => `${UrlUtil.pack(k)}=1`);
		if (setMinisHidden.length) {
			out.push(UrlUtil.packSubHash(FilterBox._getSubhashPrefix("minisHidden"), setMinisHidden));
		}

		// serialize combineAs as `key=value` pairs
		const setCombineAs = Object.entries(this._combineAs).filter(([k, v]) => v !== FilterBox._COMBINE_MODES[0]).map(([k]) => `${UrlUtil.pack(k)}=${FilterBox._COMBINE_MODES.indexOf(v)}`);
		if (setCombineAs.length) {
			out.push(UrlUtil.packSubHash(FilterBox._getSubhashPrefix("combineAs"), setCombineAs));
		}

		return out.length ? out : null;
	}

	setFromValues (values) {
		this._filters.forEach(it => it.setFromValues(values));
	}

	toDisplay (boxState, ...entryVals) {
		const isAndDisplay = (filters, vals = entryVals) => {
			return filters
				.map((f, i) => f.toDisplay(boxState, vals[i]))
				.every(it => it);
		};

		const isOrDisplay = (filters, vals = entryVals) => {
			const res = filters.map((f, i) => {
				// filter out "ignored" filter (i.e. all white)
				if (!boxState[f.header] || !boxState[f.header]._isActive) return null;
				return f.toDisplay(boxState, vals[i]);
			}).filter(it => it != null);
			return res.length === 0 || res.find(it => it);
		};

		switch (this._meta.modeCombineFilters) {
			case "and": return isAndDisplay(this._filters);
			case "or": return isOrDisplay(this._filters);
			case "custom": {
				const andFilters = [];
				const andValues = [];
				const orFilters = [];
				const orValues = [];

				if (entryVals.length !== this._filters.length) throw new Error(`Number of filters and number of values did not match!`);
				for (let i = 0; i < this._filters.length; ++i) {
					const f = this._filters[i];
					if (!this._combineAs[f.header] || this._combineAs[f.header] === "and") { // default to "and" if undefined
						andFilters.push(f);
						andValues.push(entryVals[i])
					} else {
						orFilters.push(f);
						orValues.push(entryVals[i])
					}
				}

				return isAndDisplay(andFilters, andValues) && isOrDisplay(orFilters, orValues);
			}
			default: throw new Error(`Unhandled combining mode "${this._meta.modeCombineFilters}"`);
		}
	}

	fireChangeEvent () {
		this._doSaveStateDebounced();
		const eventOut = new Event(FilterBox.EVNT_VALCHANGE);
		this._$wrpFormTop[0].dispatchEvent(eventOut);
	}

	static _getSubhashPrefix (prop) {
		if (FilterBox._SUB_HASH_PREFIXES[prop]) return FilterBox._SUB_HASH_PREFIXES[prop];
		throw new Error(`Unknown property "${prop}"`);
	}
}
FilterBox.EVNT_VALCHANGE = "valchange";
FilterBox.SOURCE_HEADER = "Source";
FilterBox._PILL_STATES = ["ignore", "yes", "no"];
FilterBox._COMBINE_MODES = ["and", "or", "custom"];
FilterBox._STORAGE_KEY = "filterBoxState";
FilterBox._DEFAULT_META = {
	modeCombineFilters: "and",
	isSummaryHidden: false
};

// These are assumed to be the same length (4 characters)
FilterBox._SUB_HASH_BOX_META_PREFIX = "fbmt";
FilterBox._SUB_HASH_BOX_MINIS_HIDDEN_PREFIX = "fbmh";
FilterBox._SUB_HASH_BOX_COMBINE_AS_PREFIX = "fbca";
FilterBox._SUB_HASH_PREFIXES = {
	meta: FilterBox._SUB_HASH_BOX_META_PREFIX,
	minisHidden: FilterBox._SUB_HASH_BOX_MINIS_HIDDEN_PREFIX,
	combineAs: FilterBox._SUB_HASH_BOX_COMBINE_AS_PREFIX
};

class FilterItem {
	/**
	 * An alternative to string `Filter.items` with a change-handling function
	 * @param options containing:
	 * @param [options.item] the item string
	 * @param [options.changeFn] (optional) function to call when filter is changed
	 * @param [options.group] (optional) group this item belongs to.
	 * @param [options.nest] (optional) nest this item belongs to
	 * @param [options.nestHidden] (optional) if nested, default visibility state
	 * @param [options.isIgnoreRed] (optional) if this item should be ignored when negative filtering
	 * @param [options.userData] (optional) extra data to be stored as part of the item
	 */
	constructor (options) {
		this.item = options.item;
		this.changeFn = options.changeFn;
		this.group = options.group;
		this.nest = options.nest;
		this.nestHidden = options.nestHidden;
		this.isIgnoreRed = options.isIgnoreRed;
		this.userData = options.userData;

		this.$rendered = null;
	}
}

class FilterBase {
	constructor (opts) {
		this.header = opts.header;

		ProxyUtil.decorate(this);

		this.__meta = {...FilterBase._DEFAULT_META};
		this._meta = this._getProxy(this.__meta, "meta");
	}

	show () { this._meta.isHidden = false; }

	hide () { this._meta.isHidden = true; }

	getBaseSaveableState () { return {meta: {...this.__meta}}; }

	resetBase () {
		Object.assign(this._meta, MiscUtil.copy(FilterBase._DEFAULT_META));
	}

	getBaseSubHashes () {
		const anyNotDefault = Object.keys(FilterBase._DEFAULT_META).find(k => this._meta[k] !== FilterBase._DEFAULT_META[k]);
		if (anyNotDefault) {
			const serMeta = Object.keys(FilterBase._DEFAULT_META).map(k => FilterUtil.compress(this._meta[k]));
			return [UrlUtil.packSubHash(FilterBase.getSubHashPrefix("meta", this.header), serMeta)]
		} else return null;
	}

	setBaseFromSubHashState (state) {
		let hasMeta = false;
		Object.entries(state).forEach(([k, vals]) => {
			const prop = FilterBase.getProp(k);
			if (prop === "meta") {
				hasMeta = true;
				const data = vals.map(v => FilterUtil.decompress(v));
				Object.keys(FilterBase._DEFAULT_META).forEach((k, i) => this._meta[k] = data[i]);
			}
		});

		if (!hasMeta) this.resetBase();
	}

	setBaseStateFromLoaded (toLoad) { Object.assign(this._meta, toLoad.meta); }

	static getSubHashPrefix (prop, header) {
		if (FilterBase._SUB_HASH_PREFIXES[prop]) {
			const prefix = FilterBase._SUB_HASH_PREFIXES[prop];
			return `${prefix}${UrlUtil.pack(header)}`;
		}
		throw new Error(`Unknown property "${prop}"`);
	}

	static getProp (prefix) {
		return Parser._parse_bToA(FilterBase._SUB_HASH_PREFIXES, prefix);
	}

	getChildFilters () { return []; }

	$render () { throw new Error(`Unimplemented!`); }
	getValues () { throw new Error(`Unimplemented!`); }
	reset () { throw new Error(`Unimplemented!`); }
	update () { throw new Error(`Unimplemented!`); }
	toDisplay () { throw new Error(`Unimplemented!`); }
	addItem () { throw new Error(`Unimplemented!`); }
	// N.B.: due to a bug in Chrome, these return a copy of the underlying state rather than a copy of the proxied state
	getSaveableState () { throw new Error(`Unimplemented!`); }
	setStateFromLoaded () { throw new Error(`Unimplemented!`); }
	getSubHashes () { throw new Error(`Unimplemented!`); }
	setFromSubHashState () { throw new Error(`Unimplemented!`); }
	setFromValues () { throw new Error(`Unimplemented!`); }
}
FilterBase._DEFAULT_META = {
	isHidden: false,
	combineBlue: "or",
	combineRed: "or"
};
// These are assumed to be the same length (4 characters)
FilterBase._SUB_HASH_STATE_PREFIX = "flst";
FilterBase._SUB_HASH_META_PREFIX = "flmt";
FilterBase._SUB_HASH_NESTS_HIDDEN_PREFIX = "flnh";
FilterBase._SUB_HASH_PREFIXES = {
	state: FilterBase._SUB_HASH_STATE_PREFIX,
	meta: FilterBase._SUB_HASH_META_PREFIX,
	nestsHidden: FilterBase._SUB_HASH_NESTS_HIDDEN_PREFIX
};

class Filter extends FilterBase {
	static _getAsFilterItems (items) {
		return items ? items.map(it => it instanceof FilterItem ? it : new FilterItem({item: it})) : null;
	}

	static _validateItemNests (items, nests) {
		if (!nests) return;
		const noNest = items.find(it => !nests[it.nest]);
		if (noNest) throw new Error(`Did not have a nest: "${noNest.item}"`);
		const invalid = items.find(it => !it.nest || !nests[it.nest]);
		if (invalid) throw new Error(`Invalid nest: "${invalid.item}"`);
	}

	/**
	 * @param opts Options object.
	 * @param opts.items Array of filter items, either `FilterItem` or strings. e.g. `["DMG", "VGM"]`
	 * @param [opts.nests] Key-value object of `"Nest Name": {...nestMeta}`. Nests are used to group/nest filters.
	 * @param [opts.displayFn] Function which translates an item to a displayable form, e.g. `"MM` -> "Monster Manual"`
	 * @param [opts.selFn] Function which returns true if an item should be displayed by default; false otherwise.
	 * @param [opts.deselFn] Function which returns true if an item should be hidden by default; false otherwise.
	 * @param [opts.itemSortFn] Function which should be used to sort the `items` array if new entries are added.
	 *        Defaults to ascending alphabetical sort.
	 * @param [opts.groupFn] Function which takes an item and assigns it to a group.
	 * @param [opts.minimalUi] True if the filter should render with a reduced UI, false otherwise.
	 * @param [opts.umbrellaItems] Items which should, when set active, show everything in the filter. E.g. "All".
	 * @param [opts.umbrellaExcludes] Items which should ignore the state of any `umbrellaItems`
	 */
	constructor (opts) {
		super(opts);
		this._items = Filter._getAsFilterItems(opts.items || []);
		this._nests = opts.nests;
		this._displayFn = opts.displayFn;
		this._selFn = opts.selFn;
		this._deselFn = opts.deselFn;
		this._itemSortFn = opts.itemSortFn === undefined ? SortUtil.ascSort : opts.itemSortFn;
		this._groupFn = opts.groupFn;
		this._minimalUi = opts.minimalUi;
		this._umbrellaItems = Filter._getAsFilterItems(opts.umbrellaItems);
		this._umbrellaExcludes = Filter._getAsFilterItems(opts.umbrellaExcludes);

		Filter._validateItemNests(this._items, this._nests);

		this._filterBox = null;
		this.__state = {};
		this._state = this._getProxy(this.__state, "state");
		this._items.forEach(it => this._defaultItemState(it));
		this.__$wrpFilter = null;
		this.__$wrpPills = null;
		this.__$wrpMini = null;
		this.__$wrpNestHeadInner = null;
		this._updateNestSummary = null;
		this.__nestsHidden = {};
		this._nestsHidden = this._getProxy(this.__nestsHidden, "nestsHidden");
		this._isNestsDirty = false;
		this._isItemsDirty = false;
		this._pillGroupsMeta = {};
	}

	getSaveableState () {
		return {
			[this.header]: {
				...this.getBaseSaveableState(),
				state: {...this.__state},
				nestsHidden: {...this.__nestsHidden}
			}
		};
	}

	setStateFromLoaded (filterState) {
		if (filterState && filterState[this.header]) {
			const toLoad = filterState[this.header];
			this.setBaseStateFromLoaded(toLoad);
			Object.assign(this._state, toLoad.state);
			Object.assign(this._nestsHidden, toLoad.nestsHidden);
		}
	}

	getSubHashes () {
		const out = [];

		const baseMeta = this.getBaseSubHashes();
		if (baseMeta) out.push(...baseMeta);

		const areNotDefaultState = Object.entries(this._state).filter(([k, v]) => {
			if (this._deselFn) {
				const isDesel = this._deselFn(k);
				return (isDesel && v !== 2) || (!isDesel && v !== 0);
			} else if (this._selFn) {
				const isSel = this._selFn(k);
				return (isSel && v !== 1) || (!isSel && v !== 0);
			} else return v !== 0;
		});
		if (areNotDefaultState.length) {
			// serialize state as `key=value` pairs
			const serPillStates = areNotDefaultState.map(([k, v]) => `${UrlUtil.pack(k)}=${v}`);
			out.push(UrlUtil.packSubHash(FilterBase.getSubHashPrefix("state", this.header), serPillStates));
		}

		const areNotDefaultNestsHidden = Object.entries(this._nestsHidden).filter(([k, v]) => !(this._nests[k].isHidden === v));
		if (areNotDefaultNestsHidden.length) {
			// serialize nestsHidden as `key=value` pairs
			const nestsHidden = areNotDefaultNestsHidden.map(([k]) => `${UrlUtil.pack(k)}=1`);
			out.push(UrlUtil.packSubHash(FilterBase.getSubHashPrefix("nestsHidden", this.header), nestsHidden));
		}

		return out.length ? out : null;
	}

	setFromSubHashState (state) {
		this.setBaseFromSubHashState(state);

		let hasState = false;
		let hasNestsHidden = false;

		Object.entries(state).forEach(([k, vals]) => {
			const prop = FilterBase.getProp(k);
			switch (prop) {
				case "state": {
					hasState = true;
					vals.forEach(v => {
						const [statePropLower, state] = v.split("=");
						const stateProp = Object.keys(this._state).find(k => k.toLowerCase() === statePropLower);
						if (stateProp) this._state[stateProp] = Number(state);
					});
					break;
				}
				case "nestsHidden": {
					hasNestsHidden = true;
					vals.forEach(v => {
						const [nestNameLower, state] = v.split("=");
						const nestName = Object.keys(this._nestsHidden).find(k => k.toLowerCase() === nestNameLower);
						if (nestName) this._nestsHidden[nestName] = !!Number(state);
					});
					break;
				}
			}
		});

		if (!hasState) this.reset();
		if (!hasNestsHidden) this._resetNestsHidden();
	}

	setFromValues (values) {
		if (values[this.header]) {
			Object.keys(this._state).forEach(k => this._state[k] = 0);
			Object.assign(this._state, values[this.header]);
		}
	}

	_resetNestsHidden () {
		if (this._nests) Object.entries(this._nests).forEach(([nestName, nestMeta]) => this._nestsHidden[nestName] = !!nestMeta.isHidden);
	}

	_defaultItemState (item) {
		// if both a selFn and a deselFn are specified, we default to deselecting
		this._state[item.item] = this._deselFn && this._deselFn(item.item) ? 2 : this._selFn && this._selFn(item.item) ? 1 : 0
	}

	_$getPill (item) {
		const $btnPill = $(`<div class="fltr__pill">${this._displayFn ? this._displayFn(item.item) : item.item}</div>`)
			.click(() => {
				if (++this._state[item.item] > 2) this._state[item.item] = 0;
			})
			.contextmenu((evt) => {
				if (evt.ctrlKey) return true;
				evt.preventDefault();

				if (--this._state[item.item] < 0) this._state[item.item] = 2;
			});
		const hook = () => {
			const val = FilterBox._PILL_STATES[this._state[item.item]];
			$btnPill.attr("state", val);
			if (item.changeFn) item.changeFn(item.item, val);
		};
		this._addHook("state", item.item, hook);
		hook();

		return $btnPill;
	}

	_$getMini (item) {
		const $btnMini = $(`<div class="fltr__mini-pill">
			${this._displayFn ? this._displayFn(item.item) : item.item}
		</div>`)
			.attr("state", FilterBox._PILL_STATES[this._state[item.item]])
			.click(() => {
				this._state[item.item] = 0;
				this._filterBox.fireChangeEvent();
			});
		const hook = () => $btnMini.attr("state", FilterBox._PILL_STATES[this._state[item.item]]);
		this._addHook("state", item.item, hook);
		hook();

		const hideHook = () => $btnMini.toggleClass("hidden", this._filterBox.isMinisHidden(this.header));
		this._filterBox.registerMinisHiddenHook(this.header, hideHook);
		hideHook();

		if (this._deselFn && this._deselFn(item.item)) $btnMini.addClass("fltr__mini-pill--default-desel");
		else if (this._selFn && this._selFn(item.item)) $btnMini.addClass("fltr__mini-pill--default-sel");

		return $btnMini;
	}

	_doSetPillsAll () {
		Object.keys(this._state).forEach(k => this._state[k] = 1);
	}

	_doSetPillsClear () {
		Object.keys(this._state).forEach(k => this._state[k] = 0);
	}

	_doSetPillsNone () {
		Object.keys(this._state).forEach(k => this._state[k] = 2);
	}

	_doSetPinsDefault () {
		this.reset();
	}

	_$getHeaderControls (opts) {
		const $btnAll = $(`<button class="btn btn-default ${opts.isMulti ? "btn-xxs" : "btn-xs"} fltr__h-btn--all">All</button>`).click(() => this._doSetPillsAll());
		const $btnClear = $(`<button class="btn btn-default ${opts.isMulti ? "btn-xxs" : "btn-xs"} fltr__h-btn--clear">Clear</button>`).click(() => this._doSetPillsClear());
		const $btnNone = $(`<button class="btn btn-default ${opts.isMulti ? "btn-xxs" : "btn-xs"} fltr__h-btn--none">None</button>`).click(() => this._doSetPillsNone());
		const $btnDefault = $(`<button class="btn btn-default ${opts.isMulti ? "btn-xxs" : "btn-xs"}">Default</button>`).click(() => this._doSetPinsDefault());

		const $wrpStateBtns = $$`<div class="btn-group">${$btnAll}${$btnClear}${$btnNone}${$btnDefault}</div>`;

		const $wrpSummary = $(`<div class="flex-v-center"/>`).hide();

		const $btnCombineBlue = $$`<button class="btn btn-default ${opts.isMulti ? "btn-xxs" : "btn-xs"} fltr__h-btn-logic--blue fltr__h-btn-logic" title="Positive matches mode for this filter. AND requires all blues to match, OR requires at least one blue to match."/>`
			.click(() => this._meta.combineBlue = this._meta.combineBlue === "or" ? "and" : "or");
		const hookCombineBlue = () => $btnCombineBlue.text(this._meta.combineBlue.toUpperCase());
		this._addHook("meta", "combineBlue", hookCombineBlue);
		hookCombineBlue();

		const $btnCombineRed = $$`<button class="btn btn-default ${opts.isMulti ? "btn-xxs" : "btn-xs"} fltr__h-btn-logic--red fltr__h-btn-logic" title="Negative match mode for this filter. AND requires all reds to match, OR requires at least one red to match."/>`
			.click(() => this._meta.combineRed = this._meta.combineRed === "or" ? "and" : "or");
		const hookCombineRed = () => $btnCombineRed.text(this._meta.combineRed.toUpperCase());
		this._addHook("meta", "combineRed", hookCombineRed);
		hookCombineRed();

		const $btnShowHide = $(`<button class="btn btn-default ${opts.isMulti ? "btn-xxs" : "btn-xs"} ml-2">Hide</button>`)
			.click(() => this._meta.isHidden = !this._meta.isHidden);
		const hookShowHide = () => {
			$btnShowHide.toggleClass("active", this._meta.isHidden);
			$wrpStateBtns.toggle(!this._meta.isHidden);
			$wrpSummary.toggle(this._meta.isHidden).empty();

			// render summary
			const cur = this.getValues()[this.header];

			$(`<span class="fltr__summary_item fltr__summary_item--include"/>`)
				.attr("title", `${cur._totals.yes} hidden "required" tags`)
				.text(cur._totals.yes)
				.toggle(!!cur._totals.yes)
				.appendTo($wrpSummary);

			$(`<span class="fltr__summary_item_spacer"/>`)
				.toggle(!!(cur._totals.yes && cur._totals.no))
				.appendTo($wrpSummary);

			$(`<span class="fltr__summary_item fltr__summary_item--exclude"/>`)
				.attr("title", `${cur._totals.no} hidden "excluded" tags`)
				.text(cur._totals.no)
				.toggle(!!cur._totals.no)
				.appendTo($wrpSummary);
		};
		this._addHook("meta", "isHidden", hookShowHide);
		hookShowHide();

		return $$`
		<div class="flex-v-center">
			${$wrpStateBtns}
			${$wrpSummary}
			<span class="btn-group ml-2">
				${$btnCombineBlue}
				${$btnCombineRed}
			</span>
			${$btnShowHide}
		</div>`;
	}

	/**
	 * @param opts Options.
	 * @param opts.filterBox The FilterBox to which this filter is attached.
	 * @param opts.isFirst True if this is visually the first filter in the box.
	 * @param opts.$wrpMini The form mini-view element.
	 * @param opts.isMulti The name of the MultiFilter this filter belongs to, if any.
	 */
	$render (opts) {
		this._filterBox = opts.filterBox;
		this.__$wrpMini = opts.$wrpMini;

		const $wrpControls = this._$getHeaderControls(opts);

		this.__$wrpPills = $$`<div class="fltr__wrp-pills ${this._groupFn ? "fltr__wrp-subs" : ""}"/>`;
		const hook = () => this.__$wrpPills.toggle(!this._meta.isHidden);
		this._addHook("meta", "isHidden", hook);
		hook();

		if (this._nests) {
			const $wrpNestHead = $(`<div class="fltr__wrp-pills--sub"/>`).appendTo(this.__$wrpPills);
			this.__$wrpNestHeadInner = $(`<div class="flex flex-wrap"/>`).appendTo($wrpNestHead);

			const $wrpNestHeadSummary = $(`<div class="fltr__summary_nest"/>`).appendTo($wrpNestHead);

			this._updateNestSummary = () => {
				const stats = {high: 0, low: 0};
				this._items.filter(it => this._state[it.item] && this._nestsHidden[it.nest]).forEach(it => {
					const key = this._state[it.item] === 1 ? "high" : "low";
					stats[key]++;
				});
				$wrpNestHeadSummary.empty();
				if (stats.high) {
					$(`<span class="fltr__summary_item fltr__summary_item--include">${stats.high}</span>`)
						.attr("title", `${stats.high} hidden "required" tag${stats.high === 1 ? "" : "s"}`)
						.appendTo($wrpNestHeadSummary);
				}
				if (stats.high && stats.low) $(`<span class="fltr__summary_item_spacer"/>`).appendTo($wrpNestHeadSummary);
				if (stats.low) {
					$(`<span class="fltr__summary_item fltr__summary_item--exclude">${stats.low}</span>`)
						.attr("title", `${stats.low} hidden "excluded" tag${stats.low === 1 ? "" : "s"}`)
						.appendTo($wrpNestHeadSummary);
				}
			};

			this._doRenderNests();
		}

		this._doRenderPills();
		this._doRenderMiniPills();

		this.__$wrpFilter = $$`<div>
			${opts.isFirst ? "" : `<div class="fltr__dropdown-divider ${opts.isMulti ? "fltr__dropdown-divider--indented" : ""} mb-1"/>`}
			<div class="split fltr__h ${this._minimalUi ? "fltr__minimal-hide" : ""} mb-1">
				<div class="ml-2">${opts.isMulti ? "\u2012" : ""} ${this.header}</div>
				${$wrpControls}
			</div>
			${this.__$wrpPills}
		</div>`;

		this._doToggleDisplay();

		return this.__$wrpFilter;
	}

	getValues () {
		const state = MiscUtil.copy(this._state);
		// remove state for any currently-absent filters
		Object.keys(state).filter(k => !this._items.some(it => `${it.item}` === k)).forEach(k => delete state[k]);
		const out = {...state};

		// add helper data
		out._isActive = Object.values(state).some(Boolean);
		out._totals = {yes: 0, no: 0, ignored: 0};
		Object.values(state).forEach(v => {
			const totalKey = v === 0 ? "ignored" : v === 1 ? "yes" : "no";
			out._totals[totalKey]++;
		});
		out._andOr = {blue: this._meta.combineBlue, red: this._meta.combineRed};
		return {[this.header]: out};
	}

	reset (isResetAll) {
		if (isResetAll) {
			this.resetBase();
			this._resetNestsHidden();
		}
		Object.keys(this._state).forEach(k => delete this._state[k]);
		this._items.forEach(it => this._defaultItemState(it));
	}

	_doRenderPills () {
		if (this._itemSortFn) this._items.sort(this._itemSortFn);
		this._items.forEach(it => {
			if (!it.$rendered) {
				it.$rendered = this._$getPill(it);
				if (it.nest) {
					const hook = () => it.$rendered.toggle(!this._nestsHidden[it.nest]);
					this._addHook("nestsHidden", it.nest, hook);
					hook();
				}
			}

			if (this._groupFn) {
				const group = this._groupFn(it);
				if (!this._pillGroupsMeta[group]) {
					this._pillGroupsMeta[group] = {
						$hrDivider: $(`<hr class="fltr__dropdown-divider--sub">`).appendTo(this.__$wrpPills),
						$wrpPills: $(`<div class="fltr__wrp-pills--sub"/>`).appendTo(this.__$wrpPills)
					};

					Object.entries(this._pillGroupsMeta)
						.sort((a, b) => SortUtil.ascSortLower(a[0], b[0]))
						.forEach(([groupKey, groupMeta], i) => {
							groupMeta.$hrDivider.appendTo(this.__$wrpPills);
							if (i === 0 && this._nests == null) groupMeta.$hrDivider.hide();
							groupMeta.$wrpPills.appendTo(this.__$wrpPills);
						});

					if (this._nests) {
						this._pillGroupsMeta[group].toggleDividerFromNestVisibility = () => {
							const groupItems = this._items.filter(it => this._groupFn(it) === group);
							const hiddenGroupItems = groupItems.filter(it => this._nestsHidden[it.nest]);
							this._pillGroupsMeta[group].$hrDivider.toggle(groupItems.length !== hiddenGroupItems.length);
						};

						// bind group dividers to show/hide depending on nest visibility state
						Object.keys(this._nests).forEach(nestName => {
							const hook = () => this._pillGroupsMeta[group].toggleDividerFromNestVisibility();
							this._addHook("nestsHidden", nestName, hook);
							hook();
							this._pillGroupsMeta[group].toggleDividerFromNestVisibility();
						});
					}
				}

				this._pillGroupsMeta[group].$wrpPills.append(it.$rendered);
			} else this.__$wrpPills.append(it.$rendered);
		});
	}

	_doRenderMiniPills () {
		this._items.forEach(it => {
			// re-append existing elements to sort them
			(it.$mini = it.$mini || this._$getMini(it)).appendTo(this.__$wrpMini);
		});
	}

	_doToggleDisplay () {
		// if there are no items, hide everything
		this.__$wrpFilter.toggleClass("fltr__no-items", !this._items.length);
	}

	_doRenderNests () {
		Object.entries(this._nests)
			.sort((a, b) => SortUtil.ascSort(a[0], b[0])) // array 0 (key) is the nest name
			.forEach(([nestName, nestMeta]) => {
				if (nestMeta._$btnNest == null) {
					// this can be restored from a saved state, otherwise, initialise it
					if (this._nestsHidden[nestName] == null) this._nestsHidden[nestName] = !!nestMeta.isHidden;

					const $btnText = $(`<span>${nestName} [${this._nestsHidden[nestName] ? "+" : "\u2212"}]</span>`);
					nestMeta._$btnNest = $$`<div class="fltr__btn_nest">${$btnText}</div>`
						.click(() => this._nestsHidden[nestName] = !this._nestsHidden[nestName]);

					const hook = () => {
						$btnText.text(`${nestName} [${this._nestsHidden[nestName] ? "+" : "\u2212"}]`);

						const stats = {high: 0, low: 0, total: 0};
						this._items
							.filter(it => it.nest === nestName)
							.find(it => {
								const key = this._state[it.item] === 1 ? "high" : this._state[it.item] ? "low" : "ignored";
								stats[key]++;
								stats.total++;
							});
						const allHigh = stats.total === stats.high;
						const allLow = stats.total === stats.low;
						nestMeta._$btnNest.toggleClass("fltr__btn_nest--include-all", this._nestsHidden[nestName] && allHigh)
							.toggleClass("fltr__btn_nest--exclude-all", this._nestsHidden[nestName] && allLow)
							.toggleClass("fltr__btn_nest--include", this._nestsHidden[nestName] && !!(!allHigh && !allLow && stats.high && !stats.low))
							.toggleClass("fltr__btn_nest--exclude", this._nestsHidden[nestName] && !!(!allHigh && !allLow && !stats.high && stats.low))
							.toggleClass("fltr__btn_nest--both", this._nestsHidden[nestName] && !!(!allHigh && !allLow && stats.high && stats.low));

						this._updateNestSummary();
					};

					this._items
						.filter(it => it.nest === nestName)
						.find(it => {
							this._addHook("state", it.item, hook);
						});

					this._addHook("nestsHidden", nestName, hook);
					hook();
				}
				nestMeta._$btnNest.appendTo(this.__$wrpNestHeadInner);
			});

		this._updateNestSummary();
	}

	update () {
		if (this._isNestsDirty) {
			this._isNestsDirty = false;

			this._doRenderNests();
		}

		if (this._isItemsDirty) {
			this._isItemsDirty = false;

			this._doRenderPills();
		}

		// always render the mini-pills, to ensure the overall order in the grid stays correct (shared between multiple filters)
		this._doRenderMiniPills();
		this._doToggleDisplay();
	}

	addItem (item) {
		if (item == null) return;
		if (item instanceof Array) item.forEach(it => this.addItem(it));
		else if (!this._items.find(it => Filter._isItemsEqual(it, item))) {
			item = item instanceof FilterItem ? item : new FilterItem({item});
			Filter._validateItemNests([item], this._nests);

			this._isItemsDirty = true;
			this._items.push(item);
			if (this._state[item.item] == null) this._defaultItemState(item);
		}
	}

	static _isItemsEqual (item1, item2) {
		return (item1 instanceof FilterItem ? item1.item : item1) === (item2 instanceof FilterItem ? item2.item : item2);
	}

	removeItem (item) {
		const ixItem = this._items.findIndex(it => Filter._isItemsEqual(it, item));
		if (~ixItem) {
			const item = this._items[ixItem];

			// FIXME this doesn't remove any associated hooks, and is therefore a minor memory leak
			this._isItemsDirty = true;
			item.$rendered.detach();
			item.$mini.detach();
			this._items.splice(ixItem, 1);
		}
	}

	addNest (nestName, nestMeta) {
		// may need to allow this in future
		// can easily be circumvented by initialising with empty nests in filter construction
		if (!this._nests) throw new Error(`Filter was not nested!`);
		if (!this._nests[nestName]) {
			this._isNestsDirty = true;
			this._nests[nestName] = nestMeta;

			// bind group dividers to show/hide based on the new nest
			if (this._groupFn) {
				Object.keys(this._pillGroupsMeta).forEach(group => {
					const hook = () => this._pillGroupsMeta[group].toggleDividerFromNestVisibility();
					this._addHook("nestsHidden", nestName, hook);
					hook();
					this._pillGroupsMeta[group].toggleDividerFromNestVisibility();
				});
			}
		}
	}

	toDisplay (boxState, entryVal) {
		const filterState = boxState[this.header];
		if (!filterState) return true;

		const totals = filterState._totals;

		if (!(entryVal instanceof Array)) entryVal = [entryVal];
		entryVal = entryVal.map(it => it instanceof FilterItem ? it : new FilterItem({item: it}));

		const isUmbrella = () => {
			if (this._umbrellaItems) {
				if (!entryVal) return false;

				if (this._umbrellaExcludes && this._umbrellaExcludes.some(it => filterState[it.item])) return false;

				return this._umbrellaItems.some(u => entryVal.includes(u.item)) &&
					(this._umbrellaItems.some(u => filterState[u.item] === 0) || this._umbrellaItems.some(u => filterState[u.item] === 1));
			}
		};

		let hide = false;
		let display = false;

		if (filterState._andOr.blue === "or") {
			// default to displaying
			if (totals.yes === 0) display = true;

			// if any are 1 (blue) include if they match
			display = display || entryVal.some(fi => filterState[fi.item] === 1 || isUmbrella());
		} else {
			const totalYes = entryVal.filter(fi => filterState[fi.item] === 1).length;
			display = !totals.yes || totals.yes === totalYes;
		}

		if (filterState._andOr.red === "or") {
			// if any are 2 (red) exclude if they match
			hide = hide || entryVal.filter(fi => !fi.isIgnoreRed).some(fi => filterState[fi.item] === 2);
		} else {
			const totalNo = entryVal.filter(fi => !fi.isIgnoreRed).filter(fi => filterState[fi.item] === 2).length;
			hide = totals.no && totals.no === totalNo;
		}

		return display && !hide;
	}
}

class RangeFilter extends FilterBase {
	/**
	 * @param opts Options object.
	 * @param [opts.min] Minimum slider value.
	 * @param [opts.max] Maximum slider value.
	 * @param [opts.isLabelled] If this slider has labels.
	 * @param [opts.isAllowGreater] If this slider should allow all items greater than its max.
	 * @param [opts.suffix] Suffix to add to numbers displayed above slider.
	 * @param [opts.labelSortFn] Function used to sort labels if new labels are added. Defaults to ascending alphabetical.
	 */
	constructor (opts) {
		super(opts);
		this._min = Number(opts.min || 0);
		this._max = Number(opts.max || 0);
		this._labels = opts.isLabelled ? [] : null;
		this._isAllowGreater = !!opts.isAllowGreater;
		this._suffix = opts.suffix;
		this._labelSortFn = opts.labelSortFn || SortUtil.ascSort;

		this._filterBox = null;
		this.__state = {
			min: this._min,
			max: this._max,
			curMin: this._min,
			curMax: this._max
		};
		this._state = this._getProxy(this.__state, "state");
		this._isLabelsDirty = false;
		this.__$wrpSlider = null;
		this.__$wrpMini = null;
		this._$btnsMini = [];
		this._$slider = null;
	}

	getSaveableState () {
		return {
			[this.header]: {
				...this.getBaseSaveableState(),
				state: {...this.__state}
			}
		};
	}

	setStateFromLoaded (filterState) {
		if (filterState && filterState[this.header]) {
			const toLoad = filterState[this.header];
			this.setBaseStateFromLoaded(toLoad);
			Object.assign(this._state, toLoad.state);
		}
	}

	getSubHashes () {
		const out = [];

		const baseMeta = this.getBaseSubHashes();
		if (baseMeta) out.push(...baseMeta);

		const serSliderState = [
			this._state.min !== this._state.curMin ? `min=${this._state.curMin}` : null,
			this._state.max !== this._state.curMax ? `max=${this._state.curMax}` : null
		].filter(Boolean);
		if (serSliderState.length) {
			out.push(UrlUtil.packSubHash(FilterBase.getSubHashPrefix("state", this.header), serSliderState));
		}

		return out.length ? out : null;
	}

	setFromSubHashState (state) {
		this.setBaseFromSubHashState(state);

		let hasState = false;

		Object.entries(state).forEach(([k, vals]) => {
			const prop = FilterBase.getProp(k);
			if (prop === "state") {
				hasState = true;
				vals.forEach(v => {
					const [prop, val] = v.split("=");
					if (val.startsWith("&") && !this._labels) throw new Error(`Could not dereference label: "${val}"`);

					let num;
					if (val.startsWith("&")) { // prefixed with "&" for "address (index) of..."
						const clean = val.replace("&", "");
						num = this._labels.findIndex(it => String(it) === clean);
						if (!~num) throw new Error(`Could not find index for label "${clean}"`);
					} else num = Number(val);

					switch (prop) {
						case "min":
							if (num < this._state.min) this._state.min = num;
							this._state.curMin = Math.max(this._state.min, num);
							break;
						case "max":
							if (num > this._state.max) this._state.max = num;
							this._state.curMax = Math.min(this._state.max, num);
							break;
						default: throw new Error(`Unknown prop "${prop}"`);
					}
				});
			}
		});

		if (!hasState) this.reset();
	}

	setFromValues (values) {
		if (values[this.header]) {
			const vals = values[this.header];

			if (vals.min != null) this._state.curMin = Math.max(this._state.min, vals.min);
			else this._state.curMin = this._state.min;

			if (vals.max != null) this._state.curMax = Math.max(this._state.max, vals.max);
			else this._state.curMax = this._state.max;
		}
	}

	_$getHeaderControls () {
		const $btnReset = $(`<button class="btn btn-default btn-xs">Reset</button>`).click(() => this.reset());
		const $wrpBtnReset = $$`<div>${$btnReset}</div>`;

		const $wrpSummary = $(`<div class="flex-v-center fltr__summary_item fltr__summary_item--include"/>`).hide();

		const $btnShowHide = $(`<button class="btn btn-default btn-xs ml-2 ${this._meta.isHidden ? "active" : ""}">Hide</button>`)
			.click(() => this._meta.isHidden = !this._meta.isHidden);
		const hook = () => {
			$btnShowHide.toggleClass("active", this._meta.isHidden);
			$wrpBtnReset.toggle(!this._meta.isHidden);
			$wrpSummary.toggle(this._meta.isHidden);

			// render summary
			const cur = this.getValues()[this.header];

			const isRange = !cur.isMinVal && !cur.isMaxVal;
			const isCapped = !cur.isMinVal || !cur.isMaxVal;
			$wrpSummary
				.attr("title", isRange ? `Hidden range` : isCapped ? `Hidden limit` : "")
				.text(isRange ? `${cur.min}-${cur.max}` : !cur.isMinVal ? `≥ ${cur.min}` : !cur.isMaxVal ? `≤ ${cur.max}` : "")
		};
		this._addHook("meta", "isHidden", hook);
		hook();

		return $$`
		<div class="flex-v-center">
			${$wrpBtnReset}
			${$wrpSummary}
			${$btnShowHide}
		</div>`;
	}

	/**
	 * @param opts Options.
	 * @param opts.filterBox The FilterBox to which this filter is attached.
	 * @param opts.isFirst True if this is visually the first filter in the box.
	 * @param opts.$wrpMini The form mini-view element.
	 * @param opts.isMulti The name of the MultiFilter this filter belongs to, if any.
	 */
	$render (opts) {
		this._filterBox = opts.filterBox;
		this.__$wrpMini = opts.$wrpMini;

		const $wrpControls = opts.isMulti ? null : this._$getHeaderControls();

		this.__$wrpSlider = $$`<div class="fltr__wrp-pills fltr__wrp-pills--flex"/>`;
		const hook = () => this.__$wrpSlider.toggle(!this._meta.isHidden);
		this._addHook("meta", "isHidden", hook);
		hook();

		// prepare slider options
		const getSliderOpts = () => {
			const sliderOpts = {};
			if (this._labels) {
				sliderOpts.labels = this._labels.sort(this._labelSortFn);
			} else if (this._isAllowGreater) {
				sliderOpts.labels = {last: `${this._state.max}+`};
			}
			if (this._suffix) sliderOpts.suffix = this._suffix;
			return sliderOpts;
		};
		const sliderOpts = getSliderOpts();

		this._$slider = $(`<div class="fltr__slider"/>`).appendTo(this.__$wrpSlider);
		this._$slider
			.slider({
				min: this._min,
				max: this._max,
				range: true,
				values: [this._min, this._max]
			})
			.slider("pips", sliderOpts)
			.slider("float", sliderOpts)
			.slider().on("slidestop", () => { // triggered when the user stops sliding
				const [min, max] = this._$slider.slider("values");
				this._state.curMin = min;
				this._state.curMax = max;
			});

		const $btnMiniGt = $(`<div class="fltr__mini-pill" state="ignore"/>`)
			.click(() => {
				this._state.curMin = this._state.min;
				this._filterBox.fireChangeEvent();
			})
			.appendTo(this.__$wrpMini);
		const $btnMiniLt = $(`<div class="fltr__mini-pill" state="ignore"/>`)
			.click(() => {
				this._state.curMax = this._state.max;
				this._filterBox.fireChangeEvent();
			})
			.appendTo(this.__$wrpMini);
		const $btnMiniEq = $(`<div class="fltr__mini-pill" state="ignore"/>`)
			.click(() => {
				this._state.curMin = this._state.min;
				this._state.curMax = this._state.max;
				this._filterBox.fireChangeEvent();
			})
			.appendTo(this.__$wrpMini);
		this._$btnsMini.push($btnMiniGt, $btnMiniLt, $btnMiniEq);

		const hideHook = () => {
			const isHidden = this._filterBox.isMinisHidden(this.header);
			$btnMiniGt.toggleClass("hidden", isHidden);
			$btnMiniLt.toggleClass("hidden", isHidden);
			$btnMiniEq.toggleClass("hidden", isHidden);
		};
		this._filterBox.registerMinisHiddenHook(this.header, hideHook);
		hideHook();

		const handleMiniUpdate = () => {
			if (this._state.curMin === this._state.curMax) {
				$btnMiniGt.attr("state", FilterBox._PILL_STATES[0]);
				$btnMiniLt.attr("state", FilterBox._PILL_STATES[0]);
				$btnMiniEq.attr("state", FilterBox._PILL_STATES[1])
					.text(`${this.header} = ${this._labels ? this._labels[this._state.curMin] : this._state.curMin}`);
			} else {
				if (this._state.min !== this._state.curMin) {
					$btnMiniGt.attr("state", FilterBox._PILL_STATES[1])
						.text(`${this.header} ≥ ${this._labels ? this._labels[this._state.curMin] : this._state.curMin}`);
				} else $btnMiniGt.attr("state", FilterBox._PILL_STATES[0]);

				if (this._state.max !== this._state.curMax) {
					$btnMiniLt.attr("state", FilterBox._PILL_STATES[1])
						.text(`${this.header} ≤ ${this._labels ? this._labels[this._state.curMax] : this._state.curMax}`);
				} else $btnMiniLt.attr("state", FilterBox._PILL_STATES[0]);

				$btnMiniEq.attr("state", FilterBox._PILL_STATES[0]);
			}
		};

		const handleCurUpdate = () => {
			// defer this otherwise slider fails to update with correct values
			setTimeout(() => this._$slider.slider("values", [this._state.curMin, this._state.curMax]), 5);
			handleMiniUpdate();
		};

		const handleLimitUpdate = () => {
			const sliderOpts = getSliderOpts();
			this._$slider.slider("option", {min: this._state.min, max: this._state.max})
				.slider("pips", sliderOpts)
				.slider("float", sliderOpts);
			handleMiniUpdate();
		};

		this._addHook("state", "min", handleLimitUpdate);
		this._addHook("state", "max", handleLimitUpdate);
		this._addHook("state", "curMin", handleCurUpdate);
		this._addHook("state", "curMax", handleCurUpdate);
		handleCurUpdate();
		handleLimitUpdate();

		if (opts.isMulti) {
			this._$slider.addClass("grow");
			this.__$wrpSlider.addClass("grow");
			return $$`<div class="flex">
				<div class="fltr__range-inline-label">${this.header}</div>
				${this.__$wrpSlider}
			</div>`;
		} else {
			return $$`<div class="flex-col">
				${opts.isFirst ? "" : `<div class="fltr__dropdown-divider mb-1"/>`}
				<div class="split fltr__h ${this._minimalUi ? "fltr__minimal-hide" : ""} mb-1">
					<div>${this.header}</div>
					${$wrpControls}
				</div>
				${this.__$wrpSlider}
			</div>`;
		}
	}

	getValues () {
		const out = {
			isMaxVal: this._state.max === this._state.curMax,
			isMinVal: this._state.min === this._state.curMin,
			max: this._state.curMax,
			min: this._state.curMin
		};
		out._isActive = !(out.isMinVal && out.isMaxVal);
		return {[this.header]: out};
	}

	reset (isResetAll) {
		if (isResetAll) this.resetBase();
		this._state.curMin = this._state.min;
		this._state.curMax = this._state.max;
	}

	update () {
		// (labels will be automatically updated by the slider handlers)
		// always render the mini-pills, to ensure the overall order in the grid stays correct (shared between multiple filters)
		this._$btnsMini.forEach($it => this.__$wrpMini.append($it));
	}

	toDisplay (boxState, entryVal) {
		const filterState = boxState[this.header];
		if (!filterState) return true; // discount any filters which were not rendered

		// match everything if filter is set to complete range
		if (entryVal == null) return filterState.min === this._state.min && filterState.max === this._state.max;

		if (this._labels) {
			const slice = this._labels.slice(filterState.min, filterState.max + 1);
			if (entryVal instanceof Array) {
				return !!entryVal.find(it => slice.includes(it));
			} else {
				return slice.includes(entryVal);
			}
		} else {
			const isGtMin = entryVal instanceof Array ? filterState.min <= Math.min(...entryVal) : filterState.min <= entryVal;
			const isLtMax = entryVal instanceof Array ? filterState.max >= Math.max(...entryVal) : filterState.max >= entryVal;
			if (this._isAllowGreater) return isGtMin && (isLtMax || filterState.max === this._state.max);
			return isGtMin && isLtMax;
		}
	}

	addItem (item) {
		if (this._labels) {
			if (item == null) return;
			if (item instanceof Array) item.forEach(it => this.addItem(it));
			else if (!this._labels.some(it => it === item)) {
				this._labels.push(item);
				this._isLabelsDirty = true;
			}

			this._addItem_addNumber(this._labels.length - 1);
		} else {
			this._addItem_addNumber(item);
		}
	}

	_addItem_addNumber (number) {
		if (number == null || isNaN(number)) return;
		if (number >= this._state.min && number <= this._state.max) return; // it's already in the range
		if (this._state.min == null && this._state.max == null) this._state.min = this._state.max = number;
		else {
			const old = {...this.__state};

			if (number < old.min) this._state.min = number;
			if (number > old.max) this._state.max = number;

			// if the slider was previously at the full extent of its range, maintain this
			if (old.curMin === old.min) this._state.curMin = this._state.min;
			if (old.curMax === old.max) this._state.curMax = this._state.max;
		}
	}
}

class MultiFilter extends FilterBase {
	constructor (opts) {
		super(opts);
		this._filters = opts.filters;

		this.__state = {
			...MultiFilter._DETAULT_STATE,
			mode: opts.mode || MultiFilter._DETAULT_STATE.mode
		};
		this._state = this._getProxy(this.__state, "state")
	}

	getChildFilters () {
		return [...this._filters, ...this._filters.map(f => f.getChildFilters())].flat();
	}

	getSaveableState () {
		const out = {
			[this.header]: {
				...this.getBaseSaveableState(),
				state: {...this.__state}
			}
		};
		this._filters.forEach(it => Object.assign(out, it.getSaveableState()));
		return out;
	}

	setStateFromLoaded (filterState) {
		if (filterState && filterState[this.header]) {
			const toLoad = filterState[this.header];
			this.setBaseStateFromLoaded(toLoad);
			Object.assign(this._state, toLoad.state);
			this._filters.forEach(it => it.setStateFromLoaded(filterState));
		}
	}

	getSubHashes () {
		const out = [];

		const baseMeta = this.getBaseSubHashes();
		if (baseMeta) out.push(...baseMeta);

		const anyNotDefault = Object.keys(MultiFilter._DETAULT_STATE).find(k => this._state[k] !== MultiFilter._DETAULT_STATE[k]);
		if (anyNotDefault) {
			const serState = Object.keys(MultiFilter._DETAULT_STATE).map(k => FilterUtil.compress(this._state[k]));
			out.push(UrlUtil.packSubHash(FilterBase.getSubHashPrefix("state", this.header), serState));
		}

		// each getSubHashes should return an array of arrays, or null
		// flatten any arrays of arrays into our array of arrays
		this._filters.map(it => it.getSubHashes()).filter(Boolean).forEach(it => out.push(...it));
		return out.length ? out : null;
	}

	setFromSubHashState (state) {
		this.setBaseFromSubHashState(state);

		let hasState = false;

		Object.entries(state).forEach(([k, vals]) => {
			const prop = FilterBase.getProp(k);
			if (prop === "state") {
				hasState = true;
				const data = vals.map(v => FilterUtil.decompress(v));
				Object.keys(MultiFilter._DETAULT_STATE).forEach((k, i) => this._state[k] = data[i]);
			}
		});

		if (!hasState) this._reset();
	}

	setFromValues (values) {
		this._filters.forEach(it => it.setFromValues(values));
	}

	$render (opts) {
		const $btnAndOr = $(`<div class="fltr__group-comb-toggle text-muted"/>`)
			.click(() => this._state.mode = this._state.mode === "and" ? "or" : "and");
		const hookAndOr = () => $btnAndOr.text(`(group ${this._state.mode.toUpperCase()})`);
		this._addHook("state", "mode", hookAndOr);
		hookAndOr();

		const $children = this._filters.map((it, i) => it.$render({...opts, isMulti: true, isFirst: i === 0}));
		const $wrpChildren = $$`<div>${$children}</div>`;

		const $wrpSummary = $(`<div class="fltr__summary_item"/>`).hide();

		const $btnResetAll = $(`<button class="btn btn-default btn-xs ml-2">Reset All</button>`)
			.click(() => this._filters.forEach(it => it.reset()));
		const $btnShowHide = $(`<button class="btn btn-default btn-xs ml-2 ${this._meta.isHidden ? "active" : ""}">Hide</button>`)
			.click(() => this._meta.isHidden = !this._meta.isHidden);
		const $wrpControls = $$`<div class="flex-v-center">
			${$wrpSummary}${$btnResetAll}${$btnShowHide}
		</div>`;

		const hookShowHide = () => {
			$btnShowHide.toggleClass("active", this._meta.isHidden);
			$wrpChildren.toggle(!this._meta.isHidden);
			$wrpSummary.toggle(this._meta.isHidden);

			const numActive = this._filters.map(it => it.getValues()[it.header]._isActive).filter(Boolean).length;
			if (numActive) {
				$wrpSummary
					.attr("title", `${numActive} hidden active filter${numActive === 1 ? "" : "s"}`)
					.text(`(${numActive})`);
			}
		};
		this._addHook("meta", "isHidden", hookShowHide);
		hookShowHide();

		return $$`<div class="flex-col">
			${opts.isFirst ? "" : `<div class="fltr__dropdown-divider mb-1"/>`}
			<div class="split fltr__h ${this._minimalUi ? "fltr__minimal-hide" : ""} mb-1">
				<div class="flex-v-center">
					<div class="mr-2">${this.header}</div>
					${$btnAndOr}
				</div>
				${$wrpControls}
			</div>
			${$wrpChildren}
		</div>`;
	}

	getValues () {
		const out = {};
		this._filters.forEach(it => Object.assign(out, it.getValues()));
		return out;
	}

	_reset () {
		Object.assign(this._state, MultiFilter._DETAULT_STATE);
	}

	reset (isResetAll) {
		if (isResetAll) this.resetBase();
		this._reset();
		this._filters.forEach(it => it.reset(isResetAll));
	}

	update () {
		this._filters.forEach(it => it.update());
	}

	toDisplay (boxState, entryValArr) {
		if (this._filters.length !== entryValArr.length) throw new Error("Number of filters and number of values did not match");

		const results = [];
		for (let i = this._filters.length - 1; i >= 0; --i) {
			const f = this._filters[i];
			if (f instanceof RangeFilter) {
				results.push(f.toDisplay(boxState, entryValArr[i]))
			} else {
				const totals = boxState[f.header]._totals;

				if (totals.yes === 0 && totals.no === 0) results.push(null);
				else results.push(f.toDisplay(boxState, entryValArr[i]));
			}
		}

		const resultsActive = results.filter(r => r !== null);
		if (this._state.mode === "or") {
			if (!resultsActive.length) return true;
			return resultsActive.find(r => r);
		} else {
			return resultsActive.filter(r => r).length === resultsActive.length;
		}
	}

	addItem () { throw new Error(`Cannot add item to MultiFilter! Add the item to a child filter instead.`); }
}
MultiFilter._DETAULT_STATE = {
	mode: "or"
};

// validate subhash prefixes
(() => {
	const boxPrefixes = Object.values(FilterBox._SUB_HASH_PREFIXES).filter(it => it.length !== FilterUtil.SUB_HASH_PREFIX_LENGTH);
	const filterPrefixes = Object.values(FilterBase._SUB_HASH_PREFIXES).filter(it => it.length !== FilterUtil.SUB_HASH_PREFIX_LENGTH);
	const allPrefixes = boxPrefixes.concat(filterPrefixes);
	if (allPrefixes.length) throw new Error(`Invalid prefixes! ${allPrefixes.map(it => `"${it}"`).join(", ")} ${allPrefixes.length === 1 ? `is` : `was`} not of length ${FilterUtil.SUB_HASH_PREFIX_LENGTH}`);
})();
FilterUtil.SUB_HASH_PREFIXES = new Set([...Object.values(FilterBox._SUB_HASH_PREFIXES), ...Object.values(FilterBase._SUB_HASH_PREFIXES)]);
