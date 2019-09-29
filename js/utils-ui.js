class ProxyBase {
	constructor () {
		this.__hooks = {};
		this.__hooksAll = {};
	}

	_getProxy (hookProp, toProxy) {
		return new Proxy(toProxy, {
			set: (object, prop, value) => {
				object[prop] = value;
				if (this.__hooksAll[hookProp]) this.__hooksAll[hookProp].forEach(hook => hook(prop, value));
				if (this.__hooks[hookProp] && this.__hooks[hookProp][prop]) this.__hooks[hookProp][prop].forEach(hook => hook(prop, value));
				return true;
			},
			deleteProperty: (object, prop) => {
				delete object[prop];
				if (this.__hooksAll[hookProp]) this.__hooksAll[hookProp].forEach(hook => hook(prop, null));
				if (this.__hooks[hookProp] && this.__hooks[hookProp][prop]) this.__hooks[hookProp][prop].forEach(hook => hook(prop, null));
				return true;
			}
		});
	}

	/**
	 * Register a hook versus a root property on the state object. **INTERNAL CHANGES TO CHILD OBJECTS ON THE STATE
	 *   OBJECT ARE NOT TRACKED**.
	 * @param hookProp The state object.
	 * @param prop The root property to track.
	 * @param hook The hook to run. Will be called with two arguments; the property and the value of the property being
	 *   modified.
	 */
	_addHook (hookProp, prop, hook) {
		((this.__hooks[hookProp] = this.__hooks[hookProp] || {})[prop] = (this.__hooks[hookProp][prop] || [])).push(hook);
	}

	_addHookAll (hookProp, hook) {
		(this.__hooksAll[hookProp] = this.__hooksAll[hookProp] || []).push(hook);
	}

	_removeHook (hookProp, prop, hook) {
		if (this.__hooks[hookProp] && this.__hooks[hookProp][prop]) {
			const ix = this.__hooks[hookProp][prop].findIndex(hk => hk === hook);
			if (~ix) this.__hooks[hookProp][prop].splice(ix, 1);
		}
	}

	_resetHooks (hookProp) {
		delete this.__hooks[hookProp];
	}
}

class UiUtil {
	/**
	 * @param string String to parse.
	 * @param [fallbackEmpty] Fallback number if string is empty.
	 * @param [opts] Options Object.
	 * @param [opts.max] Max allowed return value.
	 * @param [opts.min] Min allowed return value.
	 * @param [opts.fallbackOnNaN] Return value if not a number.
	 * @return {number}
	 */
	static strToInt (string, fallbackEmpty = 0, opts) {
		opts = opts || {};
		let out;
		if (!string.trim()) out = fallbackEmpty;
		else {
			const preDot = string.split(".")[0].trim();
			const unary = preDot.replace(/^([-+]*).*$/, (...m) => m[1]);
			const numPart = preDot.replace(/[^0-9]/g, "");
			const num = Number(`${unary}${numPart}` || 0);
			out = isNaN(num)
				? opts.fallbackOnNaN !== undefined ? opts.fallbackOnNaN : 0
				: num;
		}
		if (opts.max != null) out = Math.min(out, opts.max);
		if (opts.min != null) out = Math.max(out, opts.min);
		return out;
	}

	static getEntriesAsText (entryArray) {
		if (!entryArray || !entryArray.length) return "";
		return JSON.stringify(entryArray, null, 2)
			.replace(/^\s*\[/, "").replace(/]\s*$/, "")
			.split("\n")
			.filter(it => it.trim())
			.map(it => {
				const trim = it.replace(/^\s\s/, "");
				const mQuotes = /^"(.*?)",?$/.exec(trim);
				if (mQuotes) return mQuotes[1]; // if string, strip quotes
				else return `  ${trim}`; // if object, indent
			})
			.join("\n")
	}

	static getTextAsEntries (text) {
		try {
			const lines = [];
			text.split("\n").filter(it => it.trim()).forEach(it => {
				if (/^\s/.exec(it)) lines.push(it); // keep indented lines as-is
				else lines.push(`"${it.replace(/"/g, `\\"`)}",`); // wrap strings
			});
			if (lines.length) lines[lines.length - 1] = lines.last().replace(/^(.*?),?$/, "$1"); // remove trailing comma
			return JSON.parse(`[${lines.join("")}]`);
		} catch (e) {
			const lines = text.split("\n").filter(it => it.trim());
			const slice = lines.join(" \\ ").substring(0, 30);
			JqueryUtil.doToast({
				content: `Could not parse entries! Error was: ${e.message}<br>Text was: ${slice}${slice.length === 30 ? "..." : ""}`,
				type: "danger"
			});
			return lines;
		}
	}

	static getSearchNoResults () {
		return `<div class="ui-search__message"><i>No results.</i></div>`;
	}

	static getSearchLoading () {
		return `<div class="ui-search__message"><i>\u2022\u2022\u2022</i></div>`;
	}

	static getSearchEnter () {
		return `<div class="ui-search__message"><i>Enter a search.</i></div>`;
	}

	/**
	 * @param $srch input element
	 * @param opt should contain:
	 *  `search` -- function which runs search
	 *  `flags` -- object which contains:
	 *    `isWait` -- flag tracking "waiting for user to stop typing"
	 *    `doClickFirst` -- flag tracking "should first result get clicked"
	 *  `showWait` -- function which displays loading dots
	 */
	static bindAutoSearch ($srch, opt) {
		UiUtil.bindTypingEnd(
			$srch,
			() => {
				opt.search();
			},
			(e) => {
				if (e.which === 13) {
					opt.flags.doClickFirst = true;
					opt.search();
				}
			},
			() => {
				if (opt.flags.isWait) {
					opt.flags.isWait = false;
					opt.showWait();
				}
			},
			() => {
				if ($srch.val() && $srch.val().trim().length) opt.search();
			}
		);
	}

	static bindTypingEnd ($ipt, fnKeyup, fnKeypress, fnKeydown, fnClick) {
		let typeTimer;
		$ipt.on("keyup search", (e) => {
			clearTimeout(typeTimer);
			typeTimer = setTimeout(() => {
				fnKeyup(e);
			}, UiUtil.TYPE_TIMEOUT_MS);
		});
		$ipt.on("keypress", (e) => {
			if (fnKeypress) fnKeypress(e);
		});
		$ipt.on("keydown", (e) => {
			if (fnKeydown) fnKeydown(e);
			clearTimeout(typeTimer);
		});
		$ipt.on("click", () => {
			if (fnClick) fnClick();
		});
	}

	/**
	 * @param {Object} [opts] Options object.
	 * @param {string} [opts.title] Modal title.
	 * @param {boolean} [opts.fullHeight] If the modal should take up (almost) the full height of the screen.
	 * @param {boolean} [opts.isLarge] If the modal should have (almost) unrestrained dimensions
	 * @param {boolean} [opts.noMinHeight] If the modal should have no minimum height.
	 * @param {function} [opts.cbClose] Callback run when the modal is closed.
	 * @param {JQuery} [opts.titleSplit] Element to have split alongside the title.
	 * @param {int} [opts.zIndex] Z-index of the modal.
	 * @param {number} [opts.overlayColor] Overlay color.
	 * @param {boolean} [opts.isPermanent] If the modal should be impossible to close.
	 * @returns {object}
	 */
	static getShowModal (opts) {
		opts = opts || {};

		// if the user closed the modal by clicking the "cancel" background, isDataEntered is false
		const handleCloseClick = async (isDataEntered, ...args) => {
			if (opts.cbClose) await opts.cbClose(isDataEntered, ...args);
			$modal.remove();
		};

		const $modal = $(`<div class="ui-modal__overlay">`);
		if (opts.zIndex != null) $modal.css({zIndex: opts.zIndex});
		if (opts.overlayColor != null) $modal.css({backgroundColor: opts.overlayColor});
		const $scroller = $(`<div class="ui-modal__scroller"/>`);
		const $modalInner = $$`<div class="ui-modal__inner ui-modal__inner--modal dropdown-menu ${opts.isLarge ? ` ui-modal__inner--large` : ""}${opts.fullHeight ? "h-100" : ""}"><div class="split flex-v-center no-shrink">${opts.title ? `<h4>${opts.title.escapeQuotes()}</h4>` : ""}${opts.titleSplit || ""}</div>${$scroller}</div>`
			.appendTo($modal);
		if (opts.noMinHeight) $modalInner.css("height", "initial");

		$modal.click(evt => {
			if (evt.target === $modal[0]) {
				if (opts.isPermanent) return;
				handleCloseClick(false);
			}
		});

		$(`body`).append($modal);
		return {
			$modalInner: $scroller,
			doClose: handleCloseClick
		};
	}

	static addModalSep ($modalInner) {
		$modalInner.append(`<hr class="ui-modal__row-sep">`);
	}

	static $getAddModalRow ($modalInner, tag = "div") {
		return $(`<${tag} class="ui-modal__row"/>`).appendTo($modalInner);
	}

	/**
	 * @param $modalInner Element this row should be added to.
	 * @param headerText Header text.
	 * @param [opts] Options object.
	 * @param [opts.helpText] Help text (title) of select dropdown.
	 * @param [opts.$eleRhs] Element to attach to the right-hand side of the header.
	 */
	static $getAddModalRowHeader ($modalInner, headerText, opts) {
		opts = opts || {};
		const $row = UiUtil.$getAddModalRow($modalInner, "h5").addClass("bold");
		if (opts.$eleRhs) $$`<div class="split flex-v-center w-100 pr-1"><span>${headerText}</span>${opts.$eleRhs}</div>`.appendTo($row);
		else $row.text(headerText);
		if (opts.helpText) $row.attr("title", opts.helpText);
		return $row;
	}

	static $getAddModalRowCb ($modalInner, labelText, objectWithProp, propName, helpText) {
		const $row = UiUtil.$getAddModalRow($modalInner, "label").addClass(`ui-modal__row--cb`);
		if (helpText) $row.attr("title", helpText);
		$row.append(`<span>${labelText}</span>`);
		const $cb = $(`<input type="checkbox">`).appendTo($row)
			.prop("checked", objectWithProp[propName])
			.on("change", () => objectWithProp[propName] = $cb.prop("checked"));
		return $cb;
	}

	/**
	 *
	 * @param $modalInner Element this row should be added to.
	 * @param labelText Row label.
	 * @param objectWithProp Object to mutate when changing select values.
	 * @param propName Property to set in `objectWithProp`.
	 * @param values Values to display in select dropdown.
	 * @param [opts] Options object.
	 * @param [opts.helpText] Help text (title) of select dropdown.
	 * @param [opts.fnDisplay] Function used to map values to displayable versions.
	 */
	static $getAddModalRowSel ($modalInner, labelText, objectWithProp, propName, values, opts) {
		opts = opts || {};
		const $row = UiUtil.$getAddModalRow($modalInner, "label").addClass(`ui-modal__row--sel`);
		if (opts.helpText) $row.attr("title", opts.helpText);
		$row.append(`<span>${labelText}</span>`);
		const $sel = $(`<select class="form-control input-xs w-30">`).appendTo($row);
		values.forEach((val, i) => $(`<option value="${i}"/>`).text(opts.fnDisplay ? opts.fnDisplay(val) : val).appendTo($sel));
		// N.B. this doesn't support null values
		const ix = values.indexOf(objectWithProp[propName]);
		$sel.val(`${~ix ? ix : 0}`)
			.change(() => objectWithProp[propName] = values[$sel.val()]);
		return $sel;
	}
}
UiUtil.SEARCH_RESULTS_CAP = 75;
UiUtil.TYPE_TIMEOUT_MS = 100; // auto-search after 100ms

class ProfUiUtil {
	/**
	 * @param state Initial state.
	 * @param [opts] Options object.
	 * @param [opts.isSimple] If the cycler only has "not proficient" and "proficient" options
	 */
	static getProfCycler (state = 0, opts) {
		opts = opts || {};

		const STATES = opts.isSimple ? Object.keys(ProfUiUtil.PROF_TO_FULL).slice(0, 2) : Object.keys(ProfUiUtil.PROF_TO_FULL);

		const NUM_STATES = Object.keys(STATES).length;

		// validate initial state
		state = Number(state) || 0;
		if (state >= NUM_STATES) state = NUM_STATES - 1;
		else if (state < 0) state = 0;

		const $btnCycle = $(`<button class="ui-prof__btn-cycle"/>`)
			.click(() => {
				$btnCycle
					.attr("data-state", ++state >= NUM_STATES ? state = 0 : state)
					.attr("title", ProfUiUtil.PROF_TO_FULL[state].name)
					.trigger("change");
			})
			.contextmenu(evt => {
				evt.preventDefault();
				$btnCycle
					.attr("data-state", --state < 0 ? state = NUM_STATES - 1 : state)
					.attr("title", ProfUiUtil.PROF_TO_FULL[state].name)
					.trigger("change");
			});
		const setState = (nuState) => {
			state = nuState;
			if (state > NUM_STATES) state = 0;
			else if (state < 0) state = NUM_STATES - 1;
			$btnCycle.attr("data-state", state);
		};
		return {
			$ele: $btnCycle,
			setState,
			getState: () => state
		}
	}
}
ProfUiUtil.PROF_TO_FULL = {
	"0": {
		name: "No proficiency",
		mult: 0
	},
	"1": {
		name: "Proficiency",
		mult: 1
	},
	"2": {
		name: "Expertise",
		mult: 2
	},
	"3": {
		name: "Half proficiency",
		mult: 0.5
	}
};

class TabUiUtil {
	static decorate (obj) {
		obj.__tabMetas = {};

		/**
		 * @param ix The tabs ordinal index.
		 * @param name The name to display on the tab.
		 * @param opts Options object.
		 * @param opts.tabGroup User-defined string identifying which group of tabs this belongs to.
		 * @param opts.stateObj The state object in which this tab should track/set its active status. Usually a proxy.
		 * @param [opts.hasBorder] True if the tab should compensate for having a top border; i.e. pad itself.
		 * @param [opts.cbTabChange] Callback function to call on tab change.
		 */
		obj._getTab = function (ix, name, opts) {
			opts.tabGroup = opts.tabGroup || "_default";

			const activeProp = `activeTab__${opts.tabGroup}`;

			if (!obj.__tabMetas[opts.tabGroup]) obj.__tabMetas[opts.tabGroup] = [];
			const tabMeta = obj.__tabMetas[opts.tabGroup];
			opts.stateObj[activeProp] = opts.stateObj[activeProp] || 0;

			const isActive = opts.stateObj[activeProp] === ix;

			const $btnTab = $(`<button class="btn btn-default stat-tab ${isActive ? "stat-tab-sel" : ""}">${name}</button>`)
				.click(() => {
					const prevTab = tabMeta[opts.stateObj[activeProp]];
					prevTab.$btnTab.removeClass("stat-tab-sel");
					prevTab.$wrpTab.hide();

					opts.stateObj[activeProp] = ix;
					$btnTab.addClass("stat-tab-sel");
					$wrpTab.show();
					if (opts.cbTabChange) opts.cbTabChange();
				});

			const $wrpTab = $(`<div class="ui-tab__wrp-tab-body ${opts.hasBorder ? "ui-tab__wrp-tab-body--border" : ""}" ${isActive ? `style="display: block;"` : ""}/>`);

			const out = {ix, $btnTab, $wrpTab};
			tabMeta[ix] = out;
			return out;
		};

		obj._resetTabs = function (tabGroup) {
			tabGroup = tabGroup || "_default";
			obj.__tabMetas[tabGroup] = [];
		};
	}
}

// TODO have this respect the blacklist?
class SearchUiUtil {
	static async pDoGlobalInit () {
		elasticlunr.clearStopWords();
		await Renderer.item.populatePropertyAndTypeReference();
	}

	static _isNoHoverCat (cat) {
		return SearchUiUtil.NO_HOVER_CATEGORIES.has(cat);
	}

	static async pGetContentIndices (options) {
		options = options || {};

		const availContent = {};

		const data = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index.json`));

		const additionalData = {};
		if (options.additionalIndices) {
			await Promise.all(options.additionalIndices.map(async add => {
				additionalData[add] = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index-${add}.json`));
				const maxId = additionalData[add].last().id;
				const brewIndex = await BrewUtil.pGetAdditionalSearchIndices(maxId, add);
				if (brewIndex.length) additionalData[add] = additionalData[add].concat(brewIndex);
			}));
		}

		const alternateData = {};
		if (options.alternateIndices) {
			await Promise.all(options.alternateIndices.map(async alt => {
				alternateData[alt] = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index-alt-${alt}.json`));
				const maxId = alternateData[alt].last().id;
				const brewIndex = await BrewUtil.pGetAlternateSearchIndices(maxId, alt);
				if (brewIndex.length) alternateData[alt] = alternateData[alt].concat(brewIndex);
			}));
		}

		const fromDeepIndex = (d) => d.d; // flag for "deep indexed" content that refers to the same item

		availContent.ALL = elasticlunr(function () {
			this.addField("n");
			this.addField("s");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(availContent.ALL);

		// Add main site index
		let ixMax = 0;

		const handleDataItem = (d, isAlternate) => {
			if (SearchUiUtil._isNoHoverCat(d.c) || fromDeepIndex(d)) return;
			d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
			if (isAlternate) d.cf = `alt_${d.cf}`;
			if (!availContent[d.cf]) {
				availContent[d.cf] = elasticlunr(function () {
					this.addField("n");
					this.addField("s");
					this.setRef("id");
				});
				SearchUtil.removeStemmer(availContent[d.cf]);
			}
			if (!isAlternate) availContent.ALL.addDoc(d);
			availContent[d.cf].addDoc(d);
			ixMax = Math.max(ixMax, d.id);
		};

		data.forEach(d => handleDataItem(d));
		Object.values(additionalData).forEach(arr => arr.forEach(d => handleDataItem(d)));
		Object.values(alternateData).forEach(arr => arr.forEach(d => handleDataItem(d, true)));

		// Add homebrew
		Omnisearch.highestId = Math.max(ixMax, Omnisearch.highestId);

		const brewIndex = await BrewUtil.pGetSearchIndex();

		brewIndex.forEach(d => {
			if (SearchUiUtil._isNoHoverCat(d.c) || fromDeepIndex(d)) return;
			d.cf = Parser.pageCategoryToFull(d.c);
			d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
			availContent.ALL.addDoc(d);
			availContent[d.cf].addDoc(d);
		});

		return availContent;
	}
}
SearchUiUtil.NO_HOVER_CATEGORIES = new Set([
	Parser.CAT_ID_ADVENTURE,
	Parser.CAT_ID_CLASS,
	Parser.CAT_ID_QUICKREF
]);

// based on DM screen's AddMenuSearchTab
class SearchWidget {
	/**
	 * @param indexes An object with index names (categories) as the keys, and indexes as the values.
	 * @param cbSearch Callback to run on user clicking a search result.
	 * @param options Options object.
	 * @param options.defaultCategory Default search category.
	 * @param options.resultFilter Function which takes a document and returns false if it is to be filtered out of the results.
	 * @param options.searchOptions Override for default elasticlunr search options.
	 * @param options.fnTransform Override for default document transformation before being passed to cbSearch.
	 */
	constructor (indexes, cbSearch, options) {
		options = options || {};

		this._indexes = indexes;
		this._cat = options.defaultCategory || "ALL";
		this._cbSearch = cbSearch;
		this._resultFilter = options.resultFilter || null;
		this._searchOptions = options.searchOptions || null;
		this._fnTransform = options.fnTransform || null;

		this._flags = {
			doClickFirst: false,
			isWait: false
		};

		this._$selCat = null;
		this._$iptSearch = null;
		this._$wrpResults = null;

		this._$rendered = null;
	}

	static pDoGlobalInit () {
		if (!SearchWidget.P_LOADING_CONTENT) {
			SearchWidget.P_LOADING_CONTENT = (async () => {
				Object.assign(SearchWidget.CONTENT_INDICES, await SearchUiUtil.pGetContentIndices({additionalIndices: ["item"], alternateIndices: ["spell"]}));
			})();
		}
		return SearchWidget.P_LOADING_CONTENT;
	}

	__getSearchOptions () {
		return this._searchOptions || {
			fields: {
				n: {boost: 5, expand: true},
				s: {expand: true}
			},
			bool: "AND",
			expand: true
		};
	}

	static __get$Row (r) {
		return $(`<div class="ui-search__row">
			<span>${r.doc.n}</span>
			<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
		</div>`);
	}

	static __getAllTitle () {
		return "All Categories";
	}

	static __getCatOptionText (it) {
		return it;
	}

	get $wrpSearch () {
		if (!this._$rendered) this._render();
		return this._$rendered
	}

	__showMsgInputRequired () {
		this._flags.isWait = true;
		this._$wrpResults.empty().append(UiUtil.getSearchEnter());
	}

	__showMsgWait () {
		this._$wrpResults.empty().append(UiUtil.getSearchLoading())
	}

	__showMsgNoResults () {
		this._flags.isWait = true;
		this._$wrpResults.empty().append(UiUtil.getSearchEnter());
	}

	__doSearch () {
		const searchInput = this._$iptSearch.val().trim();

		const index = this._indexes[this._cat];
		const results = index.search(searchInput, this.__getSearchOptions());

		const {toProcess, resultCount} = (() => {
			if (results.length) {
				if (this._resultFilter) {
					const filtered = results.filter(it => this._resultFilter(it.doc));
					return {
						toProcess: filtered.slice(0, UiUtil.SEARCH_RESULTS_CAP),
						resultCount: filtered.length
					}
				} else {
					return {
						toProcess: results.slice(0, UiUtil.SEARCH_RESULTS_CAP),
						resultCount: results.length
					}
				}
			} else {
				if (this._resultFilter) {
					const filtered = Object.values(index.documentStore.docs).filter(it => this._resultFilter(it)).map(it => ({doc: it}));
					return {
						toProcess: filtered.slice(0, UiUtil.SEARCH_RESULTS_CAP),
						resultCount: filtered.length
					}
				} else {
					return {
						toProcess: Object.values(index.documentStore.docs).slice(0, UiUtil.SEARCH_RESULTS_CAP).map(it => ({doc: it})),
						resultCount: Object.values(index.documentStore.docs).length
					}
				}
			}
		})();

		this._$wrpResults.empty();
		if (toProcess.length) {
			const handleClick = (r) => {
				if (this._fnTransform) this._cbSearch(this._fnTransform(r.doc));
				else {
					const page = UrlUtil.categoryToPage(r.doc.c);
					const source = r.doc.s;
					const hash = r.doc.u;

					this._cbSearch(page, source, hash);
				}
			};

			if (this._flags.doClickFirst) {
				handleClick(toProcess[0]);
				this._flags.doClickFirst = false;
				return;
			}

			const res = toProcess.slice(0, UiUtil.SEARCH_RESULTS_CAP);

			res.forEach(r => SearchWidget.__get$Row(r).on("click", () => handleClick(r)).appendTo(this._$wrpResults));

			if (resultCount > UiUtil.SEARCH_RESULTS_CAP) {
				const diff = resultCount - UiUtil.SEARCH_RESULTS_CAP;
				this._$wrpResults.append(`<div class="ui-search__row ui-search__row--readonly">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
			}
		} else {
			if (!searchInput.trim()) this.__showMsgInputRequired();
			else this.__showMsgNoResults();
		}
	}

	_render () {
		if (!this._$rendered) {
			this._$rendered = $(`<div class="ui-search__wrp-output"/>`);
			const $wrpControls = $(`<div class="ui-search__wrp-controls"/>`).appendTo(this._$rendered);

			this._$selCat = $(`<select class="form-control ui-search__sel-category">
				<option value="ALL">${SearchWidget.__getAllTitle()}</option>
				${Object.keys(this._indexes).sort().filter(it => it !== "ALL").map(it => `<option value="${it}">${SearchWidget.__getCatOptionText(it)}</option>`).join("")}
			</select>`)
				.appendTo($wrpControls).toggle(Object.keys(this._indexes).length !== 1)
				.on("change", () => {
					this._cat = this._$selCat.val();
					this.__doSearch();
				});

			this._$iptSearch = $(`<input class="ui-search__ipt-search search form-control" autocomplete="off" placeholder="Search...">`).appendTo($wrpControls);
			this._$wrpResults = $(`<div class="ui-search__wrp-results"/>`).appendTo(this._$rendered);

			UiUtil.bindAutoSearch(this._$iptSearch, {
				flags: this._flags,
				search: this.__doSearch.bind(this),
				showWait: this.__showMsgWait.bind(this)
			});

			this.__doSearch();
		}
	}

	doFocus () {
		this._$iptSearch.focus();
	}

	static addToIndexes (prop, entry) {
		const nextId = Object.values(SearchWidget.CONTENT_INDICES.ALL.documentStore.docs).length;

		const indexer = new Omnidexer(nextId);

		const toIndex = {[prop]: [entry]};

		Omnidexer.TO_INDEX__FROM_INDEX_JSON.filter(it => it.listProp === prop)
			.forEach(it => indexer.addToIndex(it, toIndex));
		Omnidexer.TO_INDEX.filter(it => it.listProp === prop)
			.forEach(it => indexer.addToIndex(it, toIndex));

		const toAdd = Omnidexer.decompressIndex(indexer.getIndex());
		toAdd.forEach(d => {
			d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
			SearchWidget.CONTENT_INDICES.ALL.addDoc(d);
			SearchWidget.CONTENT_INDICES[d.cf].addDoc(d);
		});
	}

	static async pGetUserSpellSearch (opts) {
		opts = opts || {};
		await SearchWidget.P_LOADING_CONTENT;

		const nxtOpts = {};
		if (opts.level != null) nxtOpts.resultFilter = result => result.lvl === opts.level;
		const tagBuilder = (encName, encSource) => `{@spell ${decodeURIComponent(encName)}${encSource !== UrlUtil.encodeForHash(SRC_PHB) ? `|${decodeURIComponent(encSource)}` : ""}}`;
		const title = opts.level === 0 ? "Select Cantrip" : "Select Spell";
		return SearchWidget.pGetUserEntitySearch(title, "alt_Spell", tagBuilder, nxtOpts);
	}

	static async pGetUserEntitySearch (title, indexName, tagBuilder, opts) {
		opts = opts || {};

		return new Promise(resolve => {
			const searchOpts = {defaultCategory: indexName};
			if (opts.resultFilter) searchOpts.resultFilter = opts.resultFilter;

			const searchWidget = new SearchWidget(
				{[indexName]: SearchWidget.CONTENT_INDICES[indexName]},
				(page, source, hash) => {
					const [encName, encSource] = hash.split(HASH_LIST_SEP);
					doClose(false); // "cancel" close
					resolve({
						page,
						source,
						hash,
						name: encName,
						tag: tagBuilder(encName, encSource)
					});
				},
				searchOpts
			);
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title,
				cbClose: (doResolve) => {
					searchWidget.$wrpSearch.detach();
					if (doResolve) resolve(null); // ensure resolution
				}
			});
			$modalInner.append(searchWidget.$wrpSearch);
			searchWidget.doFocus();
		});
	}
}
SearchWidget.P_LOADING_CONTENT = null;
SearchWidget.CONTENT_INDICES = {};

class InputUiUtil {
	/**
	 * @param opts Options.
	 * @param opts.min Minimum value.
	 * @param opts.max Maximum value.
	 * @param opts.int If the value returned should be an integer.
	 * @param opts.title Prompt title.
	 * @param opts.default Default value.
	 * @return {Promise<number>} A promise which resolves to the number if the user entered one, or null otherwise.
	 */
	static pGetUserNumber (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const $iptNumber = $(`<input class="form-control mb-2 text-right" type="number" ${opts.min ? `min="${opts.min}"` : ""} ${opts.max ? `max="${opts.max}"` : ""} ${opts.default != null ? `value="${opts.default}"` : ""}>`)
				.keydown(evt => {
					// return key
					if (evt.which === 13) doClose(true);
					evt.stopPropagation();
				});
			const $btnOk = $(`<button class="btn btn-default">Enter</button>`)
				.click(() => doClose(true));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Enter a Number",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) return resolve(null);
					const raw = $iptNumber.val();
					if (!raw.trim()) return resolve(null);
					let num = Number(raw) || 0;
					if (opts.min) num = Math.max(opts.min, num);
					if (opts.max) num = Math.min(opts.max, num);
					if (opts.int) return resolve(Math.round(num));
					else resolve(num);
				}
			});
			$iptNumber.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$iptNumber.focus();
			$iptNumber.select();
		});
	}

	/**
	 * @param opts Options.
	 * @param opts.values Array of values.
	 * @param [opts.placeholder] Placeholder text.
	 * @param [opts.title] Prompt title.
	 * @param [opts.default] Default selected index.
	 * @param [opts.fnDisplay] Function which takes a value and returns display text.
	 * @param [opts.isResolveItem] True if the promise should resolve the item instead of the index.
	 * @param [opts.$elePost] Element to add below the select box.
	 * @param [opts.fnGetExtraState] Function which returns additional state from, generally, other elements in the modal.
	 * @return {Promise} A promise which resolves to the index of the item the user selected (or an object if fnGetExtraState is passed), or null otherwise.
	 */
	static pGetUserEnum (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const $selEnum = $(`<select class="form-control mb-2"><option value="-1" disabled>${opts.placeholder || "Select..."}</option></select>`);

			opts.values.forEach((v, i) => $(`<option value="${i}"/>`).text(opts.fnDisplay ? opts.fnDisplay(v, i) : v).appendTo($selEnum));
			if (opts.default != null) $selEnum.val(opts.default);
			else $selEnum[0].selectedIndex = 0;

			const $btnOk = $(`<button class="btn btn-default">Confirm</button>`)
				.click(() => doClose(true));

			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Select an Option",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) return resolve(null);
					const ix = Number($selEnum.val());
					if (!~ix) return resolve(null);
					if (opts.fnGetExtraState) {
						const out = {extraState: opts.fnGetExtraState()};
						if (opts.isResolveItem) out.item = opts.values[ix];
						else out.ix = ix;
						resolve(out)
					} else resolve(opts.isResolveItem ? opts.values[ix] : ix);
				}
			});
			$selEnum.appendTo($modalInner);
			if (opts.$elePost) opts.$elePost.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$selEnum.focus();
		});
	}

	/**
	 * @param opts Options.
	 * @param opts.values Array of values.
	 * @param [opts.title] Prompt title.
	 * @param [opts.count] Number of choices the user can make (cannot be used with min/max).
	 * @param [opts.min] Minimum number of choices the user can make (cannot be used with count).
	 * @param [opts.max] Maximum number of choices the user can make (cannot be used with count).
	 * @param [opts.defaults] Default selected indices.
	 * @param [opts.isResolveItems] True if the promise should resolve to an array of the items instead of the indices.
	 * @param [opts.fnDisplay] Function which takes a value and returns display text.
	 * @return {Promise} A promise which resolves to the indices of the items the user selected, or null otherwise.
	 */
	static pGetUserMultipleChoice (opts) {
		opts = opts || {};

		if (opts.count != null && (opts.min != null || opts.max != null)) throw new Error(`Chooser must be either in "count" mode or "min/max" mode!`);
		// If no mode is specified, default to a "count 1" chooser
		if (opts.count == null && opts.min == null && opts.max == null) opts.count = 1;

		class ChoiceRow extends BaseComponent {
			_getDefaultState () { return {isActive: false}; }
		}

		return new Promise(resolve => {
			const $btnOk = $(`<button class="btn btn-default">Confirm</button>`)
				.click(() => doClose(true));

			const rowMetas = [];
			opts.values.forEach((v, i) => {
				const comp = new ChoiceRow();
				if (opts.defaults) comp._state.isActive = opts.defaults.includes(i);

				const $cb = ComponentUiUtil.$getCbBool(comp, "isActive");
				const hookDisable = () => {
					const activeRows = rowMetas.filter(it => it.comp._state.isActive);

					let isAcceptable = false;
					if (opts.count != null) {
						if (activeRows.length >= opts.count) isAcceptable = true;
					} else {
						if (activeRows.length >= (opts.min || 0) && activeRows.length <= (opts.max || Number.MAX_SAFE_INTEGER)) isAcceptable = true;
					}

					if (isAcceptable) {
						if (opts.count != null || (opts.max != null && activeRows.length === opts.max)) {
							rowMetas.forEach(it => it.$cb.attr("disabled", !it.comp._state.isActive));
						} else {
							rowMetas.forEach(it => it.$cb.attr("disabled", false));
						}
						$btnOk.attr("disabled", false);
					} else {
						rowMetas.forEach(it => it.$cb.attr("disabled", false));
						$btnOk.attr("disabled", true);
					}
				};
				comp._addHookBase("isActive", hookDisable);
				hookDisable();

				rowMetas.push({
					$cb,
					$ele: $$`<label class="flex-v-center row my-1">
						<div class="col-2 flex-vh-center">${$cb}</div>
						<div class="col-10">${opts.fnDisplay ? opts.fnDisplay(v, i) : v}</div>
					</label>`,
					comp
				});
			});

			const $wrpList = $$`<div class="flex-col w-100 striped-even mb-1 overflow-y-auto">${rowMetas.map(it => it.$ele)}</div>`;

			let title = opts.title;
			if (!title) {
				if (opts.count != null) title = `Choose ${Parser.numberToText(opts.count).uppercaseFirst()}`;
				else if (opts.min != null && opts.max != null) title = `Choose Between ${Parser.numberToText(opts.min).uppercaseFirst()} and ${Parser.numberToText(opts.max).uppercaseFirst()} Options`;
				else if (opts.min != null) title = `Choose At Least ${Parser.numberToText(opts.min).uppercaseFirst()}`;
				else title = `Choose At Most ${Parser.numberToText(opts.max).uppercaseFirst()}`;
			}

			const {$modalInner, doClose} = UiUtil.getShowModal({
				title,
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) return resolve(null);

					const ixs = rowMetas.map((row, ix) => row.comp._state.isActive ? ix : null).filter(it => it != null);
					resolve(opts.isResolveItems ? ixs.map(ix => opts.values[ix]) : ixs);
				}
			});
			$modalInner.addClass("flex-col");
			$wrpList.appendTo($modalInner);
			$$`<div class="flex-vh-center no-shrink">${$btnOk}</div>`.appendTo($modalInner);
			$wrpList.focus();
		});
	}

	/**
	 * NOTE: designed to work with FontAwesome.
	 *
	 * @param opts Options.
	 * @param opts.values Array of icon metadata. Items should be of the form: `{name: "<n>", iconClass: "<c>", buttonClass: "<cs>"}`
	 * @param opts.title Prompt title.
	 * @param opts.default Default selected index.
	 * @return {Promise<number>} A promise which resolves to the index of the item the user selected, or null otherwise.
	 */
	static pGetUserIcon (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			let lastIx = opts.default != null ? opts.default : -1;
			const onclicks = [];

			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Select an Option",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) return resolve(null);
					return resolve(~lastIx ? lastIx : null);
				}
			});

			$$`<div class="flex flex-wrap flex-h-center mb-2">${opts.values.map((v, i) => {
				const $btn = $$`<div class="m-2 btn ${v.buttonClass || "btn-default"} ui-icn__btn flex-col flex-h-center">
					${v.iconClass ? `<div class="ui-icn__wrp-icon ${v.iconClass} mb-1"></div>` : ""}
					${v.iconContent ? v.iconContent : ""}
					<div class="whitespace-normal w-100">${v.name}</div>
				</div>`
					.click(() => {
						lastIx = i;
						onclicks.forEach(it => it());
					})
					.toggleClass("active", opts.default === i);
				onclicks.push(() => $btn.toggleClass("active", lastIx === i));
				return $btn;
			})}</div>`.appendTo($modalInner);

			const $btnOk = $(`<button class="btn btn-default">Confirm</button>`)
				.click(() => doClose(true));

			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
		});
	}

	/**
	 * @param opts Options.
	 * @param opts.title Prompt title.
	 * @param opts.default Default value.
	 * @param opts.autocomplete Array of autocomplete strings. REQUIRES INCLUSION OF THE TYPEAHEAD LIBRARY.
	 * @return {Promise<String>} A promise which resolves to the string if the user entered one, or null otherwise.
	 */
	static pGetUserString (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const $iptStr = $(`<input class="form-control mb-2" ${opts.default != null ? `value="${opts.default}"` : ""}>`)
				.keydown(async evt => {
					if (opts.autocomplete) {
						// prevent double-binding the return key if we have autocomplete enabled
						await MiscUtil.pDelay(17); // arbitrary delay to allow dropdown to render (~1000/60, i.e. 1 60 FPS frame)
						if ($modalInner.find(`.typeahead.dropdown-menu`).is(":visible")) return;
					}
					// return key
					if (evt.which === 13) doClose(true);
					evt.stopPropagation();
				});
			if (opts.autocomplete && opts.autocomplete.length) $iptStr.typeahead({source: opts.autocomplete});
			const $btnOk = $(`<button class="btn btn-default">Enter</button>`)
				.click(() => doClose(true));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Enter Text",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) return resolve(null);
					const raw = $iptStr.val();
					if (!raw.trim()) return resolve(null);
					else return resolve(raw);
				}
			});
			$iptStr.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$iptStr.focus();
			$iptStr.select();
		});
	}

	/**
	 *
	 * @param [opts] Options object.
	 * @param [opts.title] Modal title.
	 * @param [opts.default] Default angle.
	 * @param [opts.stepButtons] Array of labels for quick-set buttons, which will be evenly spread around the clock.
	 * @param [opts.step] Number of steps in the gauge (default 360; would be e.g. 12 for a "clock").
	 * @returns {Promise<number>} A promise which resolves to the number of degrees if the user pressed "Enter," or null otherwise.
	 */
	static pGetUserDirection (opts) {
		const X = 0;
		const Y = 1;
		const DEG_CIRCLE = 360;

		opts = opts || {};
		const step = Math.max(2, Math.min(DEG_CIRCLE, opts.step || DEG_CIRCLE));
		const stepDeg = DEG_CIRCLE / step;

		function getAngle (p1, p2) {
			return Math.atan2(p2[Y] - p1[Y], p2[X] - p1[X]) * 180 / Math.PI;
		}

		return new Promise(resolve => {
			let active = false;
			let curAngle = Math.min(DEG_CIRCLE, opts.default) || 0;

			const $arm = $(`<div class="ui-dir__arm"/>`);
			const handleAngle = () => $arm.css({transform: `rotate(${curAngle + 180}deg)`});
			handleAngle();

			const $pad = $$`<div class="ui-dir__face">${$arm}</div>`.on("mousedown touchstart", evt => {
				active = true;
				handleEvent(evt);
			});

			const $document = $(document);
			const evtId = `ui_user_dir_${CryptUtil.uid()}`;
			$document.on(`mousemove.${evtId} touchmove${evtId}`, evt => {
				handleEvent(evt);
			}).on(`mouseup.${evtId} touchend${evtId} touchcancel${evtId}`, evt => {
				evt.preventDefault();
				evt.stopPropagation();
				active = false;
			});
			const handleEvent = (evt) => {
				if (!active) return;

				const coords = [EventUtil.getClientX(evt), EventUtil.getClientY(evt)];

				const {top, left} = $pad.offset();
				const center = [left + ($pad.width() / 2), top + ($pad.height() / 2)];
				curAngle = getAngle(center, coords) + 90;
				if (step !== DEG_CIRCLE) curAngle = Math.round(curAngle / stepDeg) * stepDeg;
				else curAngle = Math.round(curAngle);
				handleAngle();
			};

			const BTN_STEP_SIZE = 26;
			const BORDER_PAD = 16;
			const CONTROLS_RADIUS = (92 + BTN_STEP_SIZE + BORDER_PAD) / 2;
			const $padOuter = opts.stepButtons ? (() => {
				const steps = opts.stepButtons;
				const SEG_ANGLE = 360 / steps.length;

				const $btns = [];

				for (let i = 0; i < steps.length; ++i) {
					const theta = (SEG_ANGLE * i * (Math.PI / 180)) - (1.5708); // offset by -90 degrees
					const x = CONTROLS_RADIUS * Math.cos(theta);
					const y = CONTROLS_RADIUS * Math.sin(theta);
					$btns.push(
						$(`<button class="btn btn-default btn-xxs absolute">${steps[i]}</button>`)
							.css({
								top: y + CONTROLS_RADIUS - (BTN_STEP_SIZE / 2),
								left: x + CONTROLS_RADIUS - (BTN_STEP_SIZE / 2),
								width: BTN_STEP_SIZE,
								height: BTN_STEP_SIZE,
								zIndex: 1002
							})
							.click(() => {
								curAngle = SEG_ANGLE * i;
								handleAngle();
							})
					);
				}

				const $wrpInner = $$`<div class="flex-vh-center relative">${$btns}${$pad}</div>`
					.css({
						width: CONTROLS_RADIUS * 2,
						height: CONTROLS_RADIUS * 2
					});

				return $$`<div class="flex-vh-center">${$wrpInner}</div>`
					.css({
						width: (CONTROLS_RADIUS * 2) + BTN_STEP_SIZE + BORDER_PAD,
						height: (CONTROLS_RADIUS * 2) + BTN_STEP_SIZE + BORDER_PAD
					})
			})() : null;

			const $btnOk = $(`<button class="btn btn-default">Confirm</button>`)
				.click(() => doClose(true));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Select Direction",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					$document.off(`mousemove.${evtId} touchmove${evtId} mouseup.${evtId} touchend${evtId} touchcancel${evtId}`);
					if (!isDataEntered) return resolve(null);
					if (curAngle < 0) curAngle += 360;
					return resolve(curAngle); // TODO returning the step number is more useful if step is specified?
				}
			});
			$$`<div class="flex-vh-center mb-3">
				${$padOuter || $pad}
			</div>`.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
		});
	}
}

class DragReorderUiUtil {
	/**
	 * Create a draggable pad capable of re-ordering rendered components. This requires to components to have:
	 *  - an `id` getter
	 *  - a `pos` getter and setter
	 *  - a `height` getter
	 *
	 * @param opts Options object.
	 * @param opts.$parent The parent element containing the rendered components.
	 * @param opts.componentsParent The object which has the array of components as a property.
	 * @param opts.componentsProp The property name of the components array.
	 * @param opts.componentId This component ID.
	 * @param [opts.marginSide] The margin side; "r" or "l" (defaults to "l").
	 */
	static $getDragPad (opts) {
		opts = opts || {};

		const getComponentById = (id) => opts.componentsParent[opts.componentsProp].find(it => it.id === id);

		const dragMeta = {};
		const doDragCleanup = () => {
			dragMeta.on = false;
			dragMeta.$wrap.remove();
			dragMeta.$dummies.forEach($d => $d.remove());
		};

		const doDragRender = () => {
			if (dragMeta.on) doDragCleanup();

			dragMeta.on = true;
			dragMeta.$wrap = $(`<div class="flex-col ui-drag__wrp-drag-block"/>`).appendTo(opts.$parent);
			dragMeta.$dummies = [];

			const ids = opts.componentsParent[opts.componentsProp].map(it => it.id);

			ids.forEach(id => {
				const $dummy = $(`<div class="w-100 ${id === opts.componentId ? "ui-drag__wrp-drag-dummy--highlight" : "ui-drag__wrp-drag-dummy--lowlight"}"/>`)
					.height(getComponentById(id).height)
					.mouseup(() => {
						if (dragMeta.on) doDragCleanup();
					})
					.appendTo(dragMeta.$wrap);
				dragMeta.$dummies.push($dummy);

				if (id !== opts.componentId) { // on entering other areas, swap positions
					$dummy.mouseenter(() => {
						const cachedPos = getComponentById(id).pos;

						getComponentById(id).pos = getComponentById(opts.componentId).pos;
						getComponentById(opts.componentId).pos = cachedPos;

						doDragRender();
					});
				}
			});
		};

		return $(`<div class="m${opts.marginSide || "l"}-2 ui-drag__patch" title="Drag to Reorder">
		<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		</div>`).mousedown(() => doDragRender());
	}

	/**
	 * @param comp The component which will contain the drag pad.
	 * @param $parent Parent elements to attach row elements to.
	 * @param parent Parent component which has a pod decomposable as {swapRowPositions, childComponents}.
	 * @return jQuery
	 */
	static $getDragPad2 (comp, $parent, parent) {
		const {swapRowPositions, childComponents} = parent;

		const dragMeta = {};
		const doDragCleanup = () => {
			dragMeta.on = false;
			dragMeta.$wrap.remove();
			dragMeta.$dummies.forEach($d => $d.remove());
		};

		const doDragRender = () => {
			if (dragMeta.on) doDragCleanup();

			dragMeta.on = true;
			dragMeta.$wrap = $(`<div class="flex-col ui-drag__wrp-drag-block"/>`).appendTo($parent);
			dragMeta.$dummies = [];

			const ixRow = childComponents.indexOf(comp);

			childComponents.forEach((row, i) => {
				const dimensions = {w: row.$row.outerWidth(true), h: row.$row.outerHeight(true)};
				const $dummy = $(`<div class="${i === ixRow ? "ui-drag__wrp-drag-dummy--highlight" : "ui-drag__wrp-drag-dummy--lowlight"}"/>`)
					.width(dimensions.w).height(dimensions.h)
					.mouseup(() => {
						if (dragMeta.on) doDragCleanup();
					})
					.appendTo(dragMeta.$wrap);
				dragMeta.$dummies.push($dummy);

				if (i !== ixRow) { // on entering other areas, swap positions
					$dummy.mouseenter(() => {
						swapRowPositions(i, ixRow);
						doDragRender();
					});
				}
			});
		};

		return $(`<div class="mr-2 ui-drag__patch" title="Drag to Reorder">
		<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		<div class="ui-drag__patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		</div>`).mousedown(() => doDragRender());
	}
}

class SourceUiUtil {
	static _getValidOptions (options) {
		if (!options) throw new Error(`No options were specified!`);
		if (!options.$parent || !options.cbConfirm || !options.cbConfirmExisting || !options.cbCancel) throw new Error(`Missing options!`);
		options.mode = options.mode || "add";
		return options;
	}

	/**
	 * @param options Options object.
	 * @param options.$parent Parent element.
	 * @param options.cbConfirm Confirmation callback for inputting new sources.
	 * @param options.cbConfirmExisting Confirmation callback for selecting existing sources.
	 * @param options.cbCancel Cancellation callback.
	 * @param options.mode (Optional) Mode to build in, either "edit" or "add". Defaults to "add".
	 * @param options.source (Optional) Homebrew source object.
	 * @param options.isRequired (Optional) True if a source must be selected.
	 */
	static render (options) {
		options = SourceUiUtil._getValidOptions(options);
		options.$parent.empty();

		const isNewSource = options.mode !== "edit";
		const isAddSource = options.mode === "add";

		let jsonDirty = false;
		const $iptName = $(`<input class="form-control ui-source__ipt-named">`)
			.change(() => {
				if (!jsonDirty && isNewSource) $iptJson.val($iptName.val().replace(/[^-_a-zA-Z]/g, ""));
				$iptName.removeClass("error-background");
			});
		if (options.source) $iptName.val(options.source.full);
		const $iptAbv = $(`<input class="form-control ui-source__ipt-named">`)
			.change(() => {
				$iptAbv.removeClass("error-background");
			});
		if (options.source) $iptAbv.val(options.source.abbreviation);
		const $iptJson = $(`<input class="form-control ui-source__ipt-named" ${isNewSource ? "" : "disabled"}>`)
			.change(() => {
				jsonDirty = true;
				$iptJson.removeClass("error-background");
			});
		if (options.source) $iptJson.val(options.source.json);
		const $iptUrl = $(`<input class="form-control ui-source__ipt-named">`);
		if (options.source) $iptUrl.val(options.source.url);
		const $iptAuthors = $(`<input class="form-control ui-source__ipt-named">`);
		if (options.source) $iptAuthors.val((options.source.authors || []).join(", "));
		const $iptConverters = $(`<input class="form-control ui-source__ipt-named">`);
		if (options.source) $iptConverters.val((options.source.convertedBy || []).join(", "));

		const $btnConfirm = $(`<button class="btn btn-default">Confirm</button>`)
			.click(() => {
				let incomplete = false;
				[$iptName, $iptAbv, $iptJson].forEach($ipt => {
					const val = $ipt.val();
					if (!val || !val.trim()) (incomplete = true) && $ipt.addClass("error-background");
				});
				if (incomplete) return;

				const jsonVal = $iptJson.val().trim();
				if (isNewSource && BrewUtil.hasSourceJson(jsonVal)) {
					$iptJson.addClass("error-background");
					JqueryUtil.doToast({content: `The JSON identifier "${jsonVal}" already exists!`, type: "danger"});
					return;
				}

				const source = {
					json: jsonVal,
					abbreviation: $iptAbv.val().trim(),
					full: $iptName.val().trim(),
					url: $iptUrl.val().trim(),
					authors: $iptAuthors.val().trim().split(",").map(it => it.trim()).filter(Boolean),
					convertedBy: $iptConverters.val().trim().split(",").map(it => it.trim()).filter(Boolean)
				};

				options.cbConfirm(source);
			});

		const $btnCancel = !options.isRequired && (isAddSource || !isNewSource) ? $(`<button class="btn btn-default mr-2">Cancel</button>`)
			.click(() => {
				options.cbCancel();
			}) : null;

		const $btnUseExisting = $(`<button class="btn btn-default">Use an Existing Source</button>`)
			.click(() => {
				$stageInitial.hide();
				$stageExisting.show();

				// cleanup
				[$iptName, $iptAbv, $iptJson].forEach($ipt => $ipt.removeClass("error-background"));
			});

		const $stageInitial = $$`<div class="h-100 w-100 flex-vh-center"><div>
			<h3 class="text-center">${isNewSource ? "Add a Homebrew Source" : "Edit Homebrew Source"}</h3>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="The name or title for the homebrew you wish to create. This could be the name of a book or PDF; for example, 'Monster Manual'">Title</span>
				${$iptName}
			</div></div>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="An abbreviated form of the title. This will be shown in lists on the site, and in the top-right corner of statblocks or data entries; for example, 'MM'">Abbreviation</span>
				${$iptAbv}
			</div></div>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="This will be used to identify your homebrew universally, so should be unique to you and you alone">JSON Identifier</span>
				${$iptJson}
			</div></div>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="A link to the original homebrew, e.g. a GM Binder page">Source URL</span>
				${$iptUrl}
			</div></div>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="A comma-separated list of authors, e.g. 'John Doe, Joe Bloggs'">Author(s)</span>
				${$iptAuthors}
			</div></div>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="A comma-separated list of people who converted the homebrew to 5etools' format, e.g. 'John Doe, Joe Bloggs'">Converted By</span>
				${$iptConverters}
			</div></div>
			<div class="text-center mb-2">${$btnCancel}${$btnConfirm}</div>
			
			${isNewSource && !isAddSource && BrewUtil.homebrewMeta.sources && BrewUtil.homebrewMeta.sources.length ? $$`<div class="flex-vh-center mb-3 mt-3"><span class="ui-source__divider"/>or<span class="ui-source__divider"/></div>
			<div class="flex-vh-center">${$btnUseExisting}</div>` : ""}
		</div></div>`.appendTo(options.$parent);

		const $selExisting = $$`<select class="form-control input-sm">
			<option disabled>Select</option>
			${(BrewUtil.homebrewMeta.sources || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full)).map(s => `<option value="${s.json.escapeQuotes()}">${s.full.escapeQuotes()}</option>`)}
		</select>`.change(() => $selExisting.removeClass("error-background"));
		$selExisting[0].selectedIndex = 0;

		const $btnConfirmExisting = $(`<button class="btn btn-default btn-sm">Confirm</button>`)
			.click(() => {
				if ($selExisting[0].selectedIndex !== 0) {
					const jsonSource = $selExisting.val();
					const source = BrewUtil.sourceJsonToSource(jsonSource);
					options.cbConfirmExisting(source);

					// cleanup
					$selExisting[0].selectedIndex = 0;
					$stageExisting.hide();
					$stageInitial.show();
				} else $selExisting.addClass("error-background");
			});

		const $stageExisting = $$`<div class="h-100 w-100 flex-vh-center" style="display: none;"><div>
			<h3 class="text-center">Select a Homebrew Source</h3>
			<div class="row mb-2"><div class="col-12 flex-vh-center">${$selExisting}</div></div>
			<div class="row"><div class="col-12 flex-vh-center">${$btnConfirmExisting}</div></div>
		</div></div>`.appendTo(options.$parent);
	}
}

class BaseComponent extends ProxyBase {
	constructor () {
		super();

		this.__locks = {};
		this.__rendered = {};

		// state
		this.__state = {...this._getDefaultState()};
		this._state = this._getProxy("state", this.__state);
	}

	_addHookBase (prop, hook) {
		this._addHook("state", prop, hook);
	}

	_removeHookBase (prop, hook) {
		this._removeHook("state", prop, hook);
	}

	getPod () {
		return {
			get: (prop) => this._state[prop],
			set: (prop, val) => this._state[prop] = val,
			delete: (prop) => delete this._state[prop],
			addHook: (prop, hook) => this._addHookBase(prop, hook),
			removeHook: (prop, hook) => this._removeHookBase(prop, hook),
			triggerCollectionUpdate: (prop) => this._triggerCollectionUpdate(prop),
			component: this
		}
	}

	// to be overridden as required
	_getDefaultState () { return {}; }

	getBaseSaveableState () {
		return {
			state: MiscUtil.copy(this.__state)
		};
	}

	setBaseSaveableStateFrom (toLoad) {
		toLoad.state && Object.assign(this._state, toLoad.state);
	}

	/**
	 * Asynchronous version available below.
	 * @param prop The state property.
	 * @param cbExists Function to run on existing render meta. Arguments are `rendered, item, i`.
	 * @param cbNotExists Function to run which generates existing render meta. Arguments are `item, i`.
	 * @param [opts] Options object.
	 * @param [opts.isDiffMode] If a diff of the state should be taken/checked before updating renders.
	 */
	_renderCollection (prop, cbExists, cbNotExists, opts) {
		opts = opts || {};

		const rendered = (this.__rendered[prop] = this.__rendered[prop] || {});
		const toDelete = new Set(Object.keys(rendered));

		(this._state[prop] || []).forEach((it, i) => {
			if (it.id == null) throw new Error(`Collection item did not have an ID!`);
			const meta = rendered[it.id];

			toDelete.delete(it.id);
			if (meta) {
				if (opts.isDiffMode) {
					// Hashing the stringified JSON relies on the property order remaining consistent, but this is fine
					const nxtHash = CryptUtil.md5(JSON.stringify(it));
					if (nxtHash !== meta.__hash) {
						meta.__hash = nxtHash;
					} else return;
				}

				meta.data = it; // update any existing pointers
				cbExists(meta, it, i);
			} else {
				const meta = cbNotExists(it, i);
				meta.data = it;
				if (!meta.$wrpRow) throw new Error(`A "$wrpRow" property is required in order for deletes!`);

				if (opts.isDiffMode) meta.hash = CryptUtil.md5(JSON.stringify(it));

				rendered[it.id] = meta;
			}
		});

		this._renderCollection_doDeletes(rendered, toDelete);
	}

	/**
	 * Synchronous version available below.
	 * @param prop The state property.
	 * @param cbExists Function to run on existing render meta. Arguments are `rendered, item, i`.
	 * @param cbNotExists Function to run which generates existing render meta. Arguments are `item, i`.
	 * @param [opts] Options object.
	 */
	async _pRenderCollection (prop, cbExists, cbNotExists, opts) {
		opts = opts || {};

		const rendered = (this.__rendered[prop] = this.__rendered[prop] || {});
		const toDelete = new Set(Object.keys(rendered));

		// Run the external functions in serial, to prevent element re-ordering
		for (let i = 0; i < this._state[prop].length; ++i) {
			const it = this._state[prop][i];

			if (!it.id) throw new Error(`Collection item did not have an ID!`);
			const meta = rendered[it.id];

			toDelete.delete(it.id);
			if (meta) {
				if (opts.isDiffMode) {
					// Hashing the stringified JSON relies on the property order remaining consistent, but this is fine
					const nxtHash = CryptUtil.md5(JSON.stringify(it));
					if (nxtHash !== meta.__hash) {
						meta.__hash = nxtHash;
					} else continue;
				}

				meta.data = it; // update any existing pointers
				await cbExists(meta, it, i);
			} else {
				const meta = await cbNotExists(it, i);
				// If the generator decides there's nothing to render, skip this item
				if (meta == null) continue;

				meta.data = it;
				if (!meta.$wrpRow) throw new Error(`A "$wrpRow" property is required in order for deletes!`);

				if (opts.isDiffMode) meta.hash = CryptUtil.md5(JSON.stringify(it));

				rendered[it.id] = meta;
			}
		}

		this._renderCollection_doDeletes(rendered, toDelete);
	}

	_renderCollection_doDeletes (rendered, toDelete) {
		toDelete.forEach(id => {
			const meta = rendered[id];
			meta.$wrpRow.remove();
			delete rendered[id];
		});
	}

	/**
	 * Detach (and thus preserve) rendered collection elements so they can be re-used later.
	 * @param prop The state property.
	 */
	_detachCollection (prop) {
		const rendered = (this.__rendered[prop] = this.__rendered[prop] || {});
		Object.values(rendered).forEach(it => it.$wrpRow.detach());
	}

	/**
	 * Wipe any rendered collection elements, and reset the render cache.
	 * @param prop The state property.
	 */
	_resetCollectionRenders (prop) {
		const rendered = (this.__rendered[prop] = this.__rendered[prop] || {});
		Object.values(rendered).forEach(it => it.$wrpRow.remove());
		delete this.__rendered[prop];
	}

	render () { throw new Error("Unimplemented!"); }

	// to be overridden as required
	getSaveableState () { return {...this.getBaseSaveableState()}; }
	setStateFrom (toLoad) { this.setBaseSaveableStateFrom(toLoad); }

	async _pLock (lockName) {
		const lockMeta = this.__locks[lockName];
		if (lockMeta) await lockMeta.lock;
		let unlock = null;
		const lock = new Promise(resolve => unlock = resolve);
		this.__locks[lockName] = {
			lock,
			unlock
		}
	}

	_unlock (lockName) {
		const lockMeta = this.__locks[lockName];
		if (lockMeta) {
			lockMeta.unlock();
		}
	}

	_triggerCollectionUpdate (prop) {
		this._state[prop] = [...this._state[prop]];
	}

	static _toCollection (array) {
		if (array) return array.map(it => ({id: CryptUtil.uid(), entity: it}));
	}

	static _fromCollection (array) {
		if (array) return array.map(it => it.entity);
	}

	static fromObject (obj, ...noModCollections) {
		const comp = new BaseComponent();
		Object.entries(MiscUtil.copy(obj)).forEach(([k, v]) => {
			if (v == null) comp.__state[k] = v;
			else if (noModCollections.includes(k)) comp.__state[k] = v;
			else if (typeof v === "object" && v instanceof Array) comp.__state[k] = BaseComponent._toCollection(v);
			else comp.__state[k] = v;
		});
		return comp;
	}

	toObject () {
		const cpy = MiscUtil.copy(this.__state);
		Object.entries(cpy).forEach(([k, v]) => {
			if (v != null && v instanceof Array && v.every(it => it && it.id)) cpy[k] = BaseComponent._fromCollection(v);
		});
		return cpy;
	}
}

class BaseLayeredComponent extends BaseComponent {
	constructor () {
		super();

		// layers
		this._layers = [];
		this.__layerMeta = {};
		this._layerMeta = this._getProxy("layerMeta", this.__layerMeta);
	}

	_addHookDeep (prop, hook) {
		this._addHookBase(prop, hook);
		this._addHook("layerMeta", prop, hook);
	}

	_removeHookDeep (prop, hook) {
		this._removeHookBase(prop, hook);
		this._removeHook("layerMeta", prop, hook);
	}

	_getBase (prop) {
		return this._state[prop];
	}

	_get (prop) {
		if (this._layerMeta[prop]) {
			for (let i = this._layers.length - 1; i >= 0; --i) {
				const val = this._layers[i].data[prop];
				if (val != null) return val;
			}
			// this should never fall through, but if it does, returning the base value is fine
		}
		return this._state[prop];
	}

	_addLayer (layer) {
		this._layers.push(layer);
		this._addLayer_addLayerMeta(layer);
	}

	_addLayer_addLayerMeta (layer) {
		Object.entries(layer.data).forEach(([k, v]) => this._layerMeta[k] = v != null);
	}

	_removeLayer (layer) {
		const ix = this._layers.indexOf(layer);
		if (~ix) {
			this._layers.splice(ix, 1);

			// regenerate layer meta
			Object.keys(this._layerMeta).forEach(k => delete this._layerMeta[k]);
			this._layers.forEach(l => this._addLayer_addLayerMeta(l));
		}
	}

	updateLayersActive (prop) {
		// this uses the fact that updating a proxy value to the same value still triggers hooks
		//   anything listening to changes in this flag will be forced to recalculate from base + all layers
		this._layerMeta[prop] = this._layers.some(l => l.data[prop] != null);
	}

	getBaseSaveableState () {
		return {
			state: MiscUtil.copy(this.__state),
			layers: MiscUtil.copy(this._layers.map(l => l.getSaveableState()))
		};
	}

	setBaseSaveableStateFrom (toLoad) {
		toLoad.state && Object.assign(this._state, toLoad.state);
		if (toLoad.layers) toLoad.layers.forEach(l => this._addLayer(CharLayer.fromSavedState(this, l)));
	}

	getPod () {
		return {
			...super.getPod(),

			addHookDeep: (prop, hook) => this._addHookDeep(prop, hook),
			removeHookDeep: (prop, hook) => this._removeHookDeep(prop, hook),
			getBase: (prop) => this._getBase(prop),
			get: (prop) => this._get(prop),
			addLayer: (name, data) => {
				// FIXME
				const l = new CharLayer(this, name, data);
				this._addLayer(l);
				return l;
			},
			removeLayer: (layer) => this._removeLayer(layer),
			layers: this._layers // FIXME avoid passing this directly to the child
		}
	}
}

class ComponentUiUtil {
	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [fallbackEmpty] Fallback number if string is empty.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.max] Max allowed return value.
	 * @param [opts.min] Min allowed return value.
	 * @param [opts.offset] Offset to add to value displayed.
	 * @param [opts.padLength] Number of digits to pad the number to.
	 * @param [opts.fallbackOnNaN] Return value if not a number.
	 * @return {JQuery}
	 */
	static $getIptInt (component, prop, fallbackEmpty = 0, opts) {
		opts = opts || {};
		opts.offset = opts.offset || 0;

		const $ipt = (opts.$ele || $(`<input class="form-control input-xs form-control--minimal text-right">`))
			.change(() => component._state[prop] = UiUtil.strToInt($ipt.val(), fallbackEmpty, opts) - opts.offset);
		const hook = () => {
			const num = (component._state[prop] || 0) + opts.offset;
			$ipt.val(opts.padLength ? `${num}`.padStart(opts.padLength, "0") : num)
		};
		component._addHookBase(prop, hook);
		hook();
		return $ipt;
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @return {JQuery}
	 */
	static $getIptStr (component, prop, opts) {
		opts = opts || {};

		const $ipt = (opts.$ele || $(`<input class="form-control input-xs form-control--minimal">`))
			.change(() => component._state[prop] = $ipt.val().trim());
		const hook = () => $ipt.val(component._state[prop]);
		component._addHookBase(prop, hook);
		hook();
		return $ipt
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @return {JQuery}
	 */
	static $getIptEntries (component, prop, opts) {
		opts = opts || {};

		const $ipt = (opts.$ele || $(`<textarea class="form-control input-xs form-control--minimal resize-vertical"/>`))
			.change(() => component._state[prop] = UiUtil.getTextAsEntries($ipt.val().trim()));
		const hook = () => $ipt.val(UiUtil.getEntriesAsText(component._state[prop]));
		hook();
		return $ipt;
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @return {JQuery}
	 */
	static $getIptColor (component, prop, opts) {
		opts = opts || {};

		const $ipt = (opts.$ele || $(`<input class="form-control input-xs form-control--minimal" type="color">`))
			.change(() => component._state[prop] = $ipt.val());
		const hook = () => $ipt.val(component._state[prop]);
		component._addHookBase(prop, hook);
		hook();
		return $ipt;
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.fnHookPost] Function to run after primary hook.
	 * @param [opts.stateName] State name.
	 * @param [opts.stateProp] State prop.
	 * @return {JQuery}
	 */
	static $getBtnBool (component, prop, opts) {
		opts = opts || {};

		const stateName = opts.stateName || "state";
		const stateProp = opts.stateProp || "_state";

		const $btn = (opts.$ele || $(`<button class="btn btn-xs btn-default">Toggle</button>`))
			.click(() => component[stateProp][prop] = !component[stateProp][prop]);
		const hook = () => {
			$btn.toggleClass("active", !!component[stateProp][prop]);
			if (opts.fnHookPost) opts.fnHookPost(component[stateProp][prop]);
		};
		component._addHook(stateName, prop, hook);
		hook();
		return $btn
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @return {JQuery}
	 */
	static $getCbBool (component, prop, opts) {
		opts = opts || {};

		const $cb = (opts.$ele || $(`<input type="checkbox">`))
			.change(() => component._state[prop] = $cb.prop("checked"));
		const hook = () => $cb.prop("checked", !!component._state[prop]);
		component._addHookBase(prop, hook);
		hook();
		return $cb
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param opts Options Object.
	 * @param opts.values Values to display.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.isAllowNull] If null is allowed.
	 * @param [opts.fnDisplay] Value display function.
	 * @return {JQuery}
	 */
	static $getSelEnum (component, prop, opts) {
		opts = opts || {};

		const $sel = (opts.$ele || $(`<select class="form-control input-xs"/>`))
			.change(() => {
				const ix = Number($sel.val());
				if (~ix) component._state[prop] = opts.values[ix];
				else {
					if (opts.isAllowNull) component._state[prop] = null;
					else component._state[prop] = 0;
				}
			});
		if (opts.isAllowNull) $(`<option/>`, {value: -1, text: "\u2014"}).appendTo($sel);
		opts.values.forEach((it, i) => $(`<option/>`, {value: i, text: opts.fnDisplay ? opts.fnDisplay(it) : it}).appendTo($sel));
		const hook = () => {
			// Null handling is done in change handler
			const ix = opts.values.indexOf(component._state[prop]);
			$sel.val(`${ix}`);
		};
		component._addHookBase(prop, hook);
		hook();
		return $sel
	}
}

if (typeof module !== "undefined") {
	module.exports = {
		ProxyBase,
		UiUtil,
		ProfUiUtil,
		TabUiUtil,
		SearchUiUtil,
		SearchWidget,
		InputUiUtil,
		DragReorderUiUtil,
		SourceUiUtil,
		BaseComponent,
		ComponentUiUtil
	}
}
