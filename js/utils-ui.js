class UiUtil {
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
		$ipt.on("keyup", (e) => {
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
	 * @param {string|Object} titleOrOpts Modal title, or an object of options, which are:
	 * @param {string} titleOrOpts.title Modal title.
	 * @param {boolean} titleOrOpts.fullHeight If the modal should take up (almost) the full height of the screen.
	 * @param {boolean} titleOrOpts.fullWidth If the modal should take up (almost) the full width of the screen.
	 * @param {boolean} titleOrOpts.noMinHeight If the modal should have no minimum height.
	 * @param {function} titleOrOpts.cbClose Callback run when the modal is closed.
	 * @param cbClose Callback run when the modal is closed.
	 * @returns JQuery Modal inner wrapper, to have content added as required.
	 */
	static getShow$Modal (titleOrOpts, cbClose) {
		titleOrOpts = titleOrOpts || {};
		const opts = typeof titleOrOpts === "string" ? {} : titleOrOpts;
		if (typeof titleOrOpts === "string") {
			opts.title = titleOrOpts;
			opts.cbClose = cbClose;
		} else if (cbClose) opts.cbClose = cbClose;

		// if the user closed the modal by clicking the "cancel" background, isDataEntered is false
		const handleCloseClick = async (isDataEntered, ...args) => {
			if (opts.cbClose) await opts.cbClose(isDataEntered, ...args);
			$modal.remove();
		};

		const $modal = $(`<div class="ui-modal__overlay">`);
		const $scroller = $(`<div class="ui-modal__scroller"/>`).data("close", (...args) => handleCloseClick(...args));
		const $modalInner = $$`<div class="ui-modal__inner ui-modal__inner--modal dropdown-menu${opts.fullWidth ? ` ui-modal__inner--large` : ""}${opts.fullHeight ? " full-height" : ""}">${opts.title ? `<h4>${opts.title}</h4>` : ""}${$scroller}</div>`
			.appendTo($modal).click(e => e.stopPropagation());
		if (opts.noMinHeight) $modalInner.css("height", "initial");

		$modal.click(() => handleCloseClick(false));

		$(`body`).append($modal);
		return $scroller;
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
		if (opts.$eleRhs) $$`<div class="split flex-v-center full-width pr-1"><span>${headerText}</span>${opts.$eleRhs}</div>`.appendTo($row);
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
		const $sel = $(`<select class="form-control input-xs width-30">`).appendTo($row);
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
	static getProfCycler (state = 0) {
		const NUM_STATES = Object.keys(ProfUiUtil.PROF_TO_FULL).length;

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
				if (evt.ctrlKey) return;
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

		const data = Omnidexer.decompressIndex(await DataUtil.loadJSON("search/index.json"));

		const additionalData = {};
		if (options.additionalIndices) {
			await Promise.all(options.additionalIndices.map(async add => {
				additionalData[add] = Omnidexer.decompressIndex(await DataUtil.loadJSON(`search/index-${add}.json`));
				const maxId = additionalData[add].last().id;
				const brewIndex = await BrewUtil.pGetAdditionalSearchIndices(maxId, add);
				if (brewIndex.length) additionalData[add] = additionalData[add].concat(brewIndex);
			}));
		}

		const alternateData = {};
		if (options.alternateIndices) {
			await Promise.all(options.alternateIndices.map(async alt => {
				alternateData[alt] = Omnidexer.decompressIndex(await DataUtil.loadJSON(`search/index-alt-${alt}.json`));
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

	static async pDoGlobalInit () {
		SearchWidget.CONTENT_INDICES = await SearchUiUtil.pGetContentIndices({additionalIndices: ["item"], alternateIndices: ["spell"]});
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
}
SearchWidget.CONTENT_INDICES = {};

class InputUiUtil {
	/**
	 * @param options Options.
	 * @param options.min Minimum value.
	 * @param options.max Maximum value.
	 * @param options.int If the value returned should be an integer.
	 * @param options.title Prompt title.
	 * @param options.default Default value.
	 * @return {Promise<number>} A promise which resolves to the number if the user entered one, or null otherwise.
	 */
	static pGetUserNumber (options) {
		options = options || {};
		return new Promise(resolve => {
			const $iptNumber = $(`<input class="form-control mb-2 text-right" type="number" ${options.min ? `min="${options.min}"` : ""} ${options.max ? `max="${options.max}"` : ""} ${options.default != null ? `value="${options.default}"` : ""}>`)
				.keydown(evt => {
					// return key
					if (evt.which === 13) $modalInner.data("close")(true);
					evt.stopPropagation();
				});
			const $btnOk = $(`<button class="btn btn-default">Enter</button>`)
				.click(() => $modalInner.data("close")(true));
			const $modalInner = UiUtil.getShow$Modal({
				title: options.title || "Enter a Number",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) resolve(null);
					const raw = $iptNumber.val();
					if (!raw.trim()) return null;
					let num = Number(raw) || 0;
					if (options.min) num = Math.max(options.min, num);
					if (options.max) num = Math.min(options.max, num);
					if (options.int) resolve(Math.round(num));
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
	 * @param options Options.
	 * @param options.values Array of enum values.
	 * @param options.placeholder Placeholder text.
	 * @param options.title Prompt title.
	 * @param options.default Default selected index.
	 * @return {Promise<number>} A promise which resolves to the index of the item the user selected, or null otherwise.
	 */
	static pGetUserEnum (options) {
		options = options || {};
		return new Promise(resolve => {
			const $selEnum = $(`<select class="form-control mb-2"><option value="-1" disabled>${options.placeholder || "Select..."}</option></select>`);

			options.values.forEach((v, i) => $(`<option value="${i}"/>`).text(v).appendTo($selEnum));
			if (options.default != null) $selEnum.val(options.default);
			else $selEnum[0].selectedIndex = 0;

			const $btnOk = $(`<button class="btn btn-default">Confirm</button>`)
				.click(() => $modalInner.data("close")(true));

			const $modalInner = UiUtil.getShow$Modal({
				title: options.title || "Select an Option",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) resolve(null);
					const ix = Number($selEnum.val());
					resolve(~ix ? ix : null);
				}
			});
			$selEnum.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$selEnum.focus();
		});
	}

	/**
	 * @param options Options.
	 * @param options.title Prompt title.
	 * @param options.default Default value.
	 * @param options.autocomplete Array of autocomplete strings. REQUIRES INCLUSION OF THE TYPEAHEAD LIBRARY.
	 * @return {Promise<String>} A promise which resolves to the string if the user entered one, or null otherwise.
	 */
	static pGetUserString (options) {
		options = options || {};
		return new Promise(resolve => {
			const $iptStr = $(`<input class="form-control mb-2" ${options.default != null ? `value="${options.default}"` : ""}>`)
				.keydown(async evt => {
					if (options.autocomplete) {
						// prevent double-binding the return key if we have autocomplete enabled
						await MiscUtil.pDelay(17); // arbitrary delay to allow dropdown to render (~1000/60, i.e. 1 60 FPS frame)
						if ($modalInner.find(`.typeahead.dropdown-menu`).is(":visible")) return;
					}
					// return key
					if (evt.which === 13) $modalInner.data("close")(true);
					evt.stopPropagation();
				});
			if (options.autocomplete && options.autocomplete.length) $iptStr.typeahead({source: options.autocomplete});
			const $btnOk = $(`<button class="btn btn-default">Enter</button>`)
				.click(() => $modalInner.data("close")(true));
			const $modalInner = UiUtil.getShow$Modal({
				title: options.title || "Enter Text",
				noMinHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) resolve(null);
					const raw = $iptStr.val();
					if (!raw.trim()) return null;
					else resolve(raw);
				}
			});
			$iptStr.appendTo($modalInner);
			$$`<div class="flex-vh-center">${$btnOk}</div>`.appendTo($modalInner);
			$iptStr.focus();
			$iptStr.select();
		});
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

		const $stageInitial = $$`<div class="full-height full-width flex-vh-center"><div>
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

		const $stageExisting = $$`<div class="full-height full-width flex-vh-center" style="display: none;"><div>
			<h3 class="text-center">Select a Homebrew Source</h3>
			<div class="row mb-2"><div class="col-12 flex-vh-center">${$selExisting}</div></div>
			<div class="row"><div class="col-12 flex-vh-center">${$btnConfirmExisting}</div></div>
		</div></div>`.appendTo(options.$parent);
	}
}
