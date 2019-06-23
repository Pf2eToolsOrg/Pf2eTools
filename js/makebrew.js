"use strict";

window.onload = () => {
	doPageInit().catch(e => { throw e })
};

class PageUi {
	constructor () {
		this._builders = {};

		this._$menuInner = null;
		this._$wrpSource = null;
		this._$wrpMain = null;
		this._$wrpInput = null;
		this._$wrpInputControls = null;
		this._$wrpOutput = null;

		this._allSources = [];
		this._$selSource = null;

		this.__saveableStates = null;
		this.doSaveDebounced = MiscUtil.debounce(() => this._doSave(), 50);

		this._settings = {};
		this._saveSettingsDebounced = MiscUtil.debounce(() => this._doSaveSettings(), 50);
	}

	set creatureBuilder (creatureBuilder) { this._builders.creatureBuilder = creatureBuilder; }

	get $wrpInput () { return this._$wrpInput; }

	get $wrpInputControls () { return this._$wrpInputControls; }

	get $wrpOutput () { return this._$wrpOutput; }

	get $wrpSideMenu () { return this._$menuInner; }

	get source () { return this._settings.activeSource || ""; }

	get allSources () { return this._allSources; }

	set source (json) {
		this._$selSource.val(json);
		this._settings.activeSource = json;
		this._doHandleUpdateSource();
	}

	_doSave () {
		this.__saveableStates = this.__saveableStates || {builders: {}};

		Object.entries(this._builders).forEach(([name, builder]) => {
			if (!this.__saveableStates.builders[name] || builder.isStateDirty) {
				this.__saveableStates.builders[name] = builder.getSaveableState();
				builder.isStateDirty = false;
			}
		});
		StorageUtil.pSetForPage(PageUi.STORAGE_STATE, this.__saveableStates);
	}

	_doSaveSettings () { StorageUtil.pSetForPage(PageUi.STORAGE_SETTINGS, this._settings); }

	async init () {
		this._settings = await StorageUtil.pGetForPage(PageUi.STORAGE_SETTINGS) || {};

		this._$wrpLoad = $(`#page_loading`);
		this._$wrpSource = $(`#page_source`);
		this._$wrpMain = $(`#page_main`);

		this._settings.activeBuilder = this._settings.activeBuilder || "creatureBuilder";

		this._initLhs();
		this._initRhs();
		this._initSideMenu();

		const storedState = await StorageUtil.pGetForPage(PageUi.STORAGE_STATE) || {};
		if (storedState.builders) {
			Object.entries(storedState.builders).forEach(([name, state]) => {
				if (this._builders[name]) this._builders[name].setStateFromLoaded(state);
			});
		}

		this._doRenderActiveBuilder();
		this._doInitNavHandler();

		if (!this._settings.activeSource || !BrewUtil.homebrewMeta.sources.some(it => it.json === this._settings.activeSource)) {
			this._doRebuildStageSource({mode: "add", isRequired: true});
			this.__setStageSource();
		} else {
			this.__setStageMain();
			this._sideMenuEnabled = true;
		}
	}

	__setStageSource () {
		this._$wrpLoad.hide();
		this._$wrpSource.show();
		this._$wrpMain.hide()
	}

	__setStageMain () {
		this._$wrpLoad.hide();
		this._$wrpSource.hide();
		this._$wrpMain.show()
	}

	_doRebuildStageSource (options) {
		SourceUiUtil.render({
			...options,
			$parent: this._$wrpSource,
			cbConfirm: (source) => {
				const isNewSource = options.mode !== "edit";

				if (isNewSource) BrewUtil.addSource(source);
				else BrewUtil.updateSource(source);

				this._settings.activeSource = source.json;

				if (isNewSource) this._doAddSourceOption(source);
				this._doHandleUpdateSource();
				this._sideMenuEnabled = true;
				this.__setStageMain();
			},
			cbConfirmExisting: (source) => {
				this._settings.activeSource = source.json;
				this._doHandleUpdateSource();
				this._sideMenuEnabled = true;
				this.__setStageMain();
			},
			cbCancel: () => {
				this._sideMenuEnabled = true;
				this.__setStageMain();
			}
		});
	}

	_initLhs () {
		this._$wrpInput = $(`#content_input`);
		this._$wrpInputControls = $(`#content_input_controls`);
	}

	_initRhs () {
		this._$wrpOutput = $(`#content_output`);
	}

	_initSideMenu () {
		const $mnu = $(`.sidemenu`);

		const prevMode = this._settings.activeBuilder;

		const $wrpMode = $(`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label mr-2">Mode</div></div>`).appendTo($mnu);
		const $selMode = $(`
			<select class="form-control input-xs">
				<option value="creatureBuilder">Creature</option>
			</select>
		`).appendTo($wrpMode).change(() => {
			this._settings.activeBuilder = $selMode.val();
			this._builders[this._settings.activeBuilder].renderSideMenu();
			this._saveSettingsDebounced();
		});

		$mnu.append(PageUi.__$getSideMenuDivider(true));

		const $wrpSource = $(`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label mr-2">Source</div></div>`).appendTo($mnu);
		this._allSources = (BrewUtil.homebrewMeta.sources || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);
		this._$selSource = $$`
			<select class="form-control input-xs">
				<option disabled>Select</option>
				${this._allSources.map(s => `<option value="${s.escapeQuotes()}">${Parser.sourceJsonToFull(s).escapeQuotes()}</option>`)}
			</select>`
			.appendTo($wrpSource)
			.change(() => {
				this._settings.activeSource = this._$selSource.val();
				this._doHandleUpdateSource();
			});
		if (this._settings.activeSource) this._$selSource.val(this._settings.activeSource);
		else this._$selSource[0].selectedIndex = 0;

		const $btnSourceEdit = $(`<button class="btn btn-default btn-xs mr-2">Edit Selected Source</button>`)
			.click(() => {
				const curSourceJson = this._settings.activeSource;
				const curSource = BrewUtil.sourceJsonToSource(curSourceJson);
				if (!curSource) return;
				this._doRebuildStageSource({mode: "edit", source: MiscUtil.copy(curSource)});
				this.__setStageSource();
			});
		$$`<div class="sidemenu__row">${$btnSourceEdit}</div>`.appendTo($mnu);

		const $btnSourceAdd = $(`<button class="btn btn-default btn-xs">Add New Source</button>`).click(() => {
			this._doRebuildStageSource({mode: "add"});
			this.__setStageSource();
		});
		$$`<div class="sidemenu__row">${$btnSourceAdd}</div>`.appendTo($mnu);

		$mnu.append(PageUi.__$getSideMenuDivider(true));
		this._$menuInner = $(`<div/>`).appendTo($mnu);

		if (prevMode) $selMode.val(prevMode).change();
	}

	set _sideMenuEnabled (val) { $(`.sidemenu__toggle`).toggle(!!val); }

	static __$getSideMenuDivider (heavy) {
		return $(`<hr class="sidemenu__row__divider ${heavy ? "sidemenu__row__divider--heavy" : ""}">`);
	}

	_doRenderActiveBuilder () {
		const activeBuilder = this._builders[this._settings.activeBuilder];
		activeBuilder.renderInput();
		activeBuilder.renderOutput();
	}

	_doInitNavHandler () {
		// More obnoxious than useful (the form is auto-saved automatically); disabled until further notice
		/*
		$(window).on("beforeunload", evt => {
			const message = this._builders[this._settings.activeBuilder].getOnNavMessage();
			if (message) {
				(evt || window.event).message = message;
				return message;
			}
		});
		*/
	}

	_doAddSourceOption (source) {
		this._allSources.push(source.json);
		// TODO this should detach + re-order. Ensure correct is re-selected; ensure disabled option is first
		this._$selSource.append(`<option value="${source.json.escapeQuotes()}">${source.full.escapeQuotes()}</option>`);
		this._builders[this._settings.activeBuilder].doHandleSourcesAdd();
	}

	_doHandleUpdateSource () {
		if (this._$selSource) this._$selSource.val(this._settings.activeSource);
		this._saveSettingsDebounced();
		this._builders[this._settings.activeBuilder].doHandleSourceUpdate();
	}

	_getJsonOutputTemplate () {
		return {_meta: {sources: [MiscUtil.copy(BrewUtil.sourceJsonToSource(this._settings.activeSource))]}};
	}
}
PageUi.STORAGE_STATE = "brewbuilderState";
PageUi.STORAGE_SETTINGS = "brewbuilderSettings";

class Builder {
	static async pInitAll () {
		return Promise.all(Builder._BUILDERS.map(b => b.pInit()))
	}

	constructor () {
		this._ui = null;
		this._isStateDirty = false;

		this._isEntrySaved = true;

		Builder._BUILDERS.push(this);
		ProxyUtil.decorate(this);
	}

	set ui (ui) { this._ui = ui; }

	get isStateDirty () { return this._isStateDirty; }
	set isStateDirty (val) { this._isStateDirty = val; }

	get isEntrySaved () { return this._isEntrySaved; }
	set isEntrySaved (val) { this._isEntrySaved = val; }

	getSaveableState () { throw new TypeError(`Unimplemented method!`); }
	setStateFromLoaded () { throw new TypeError(`Unimplemented method!`); }
	doHandleSourceUpdate () { throw new TypeError(`Unimplemented method!`); }
	doHandleSourcesAdd () { throw new TypeError(`Unimplemented method!`); }
	renderInput () { throw new TypeError(`Unimplemented method!`); }
	renderOutput () { throw new TypeError(`Unimplemented method!`); }
	renderSideMenu () { throw new TypeError(`Unimplemented method!`); }
	getOnNavMessage () { throw new TypeError(`Unimplemented method!`); }
	async pInit () {}
}
Builder._BUILDERS = [];

class BuilderUi {
	static $getSaveButton () {
		return $(`<button class="btn btn-xs btn-default mr-2 mkbru__cnt-save">Save</button>`);
	}

	static $getResetButton () {
		return $(`<button class="btn btn-xs btn-default">Reset</button>`);
	}

	static __setProp (toVal, options, state, ...path) {
		if (path.length > 1) {
			let cur = state;
			for (let i = 0; i < path.length - 1; ++i) cur = state[path[i]];

			if (toVal == null) {
				delete cur[path.last()];
				return null;
			} else return cur[path.last()] = toVal;
		} else {
			if (toVal == null) {
				delete state[path[0]];
				return null;
			} else return state[path[0]] = toVal;
		}
	}

	/**
	 *
	 * @param name Row name.
	 * @param [options] Options object.
	 * @param [options.eleType] HTML element to use.
	 * @param [options.isMarked] If a "group" vertical marker should be displayed between the name and the row body.
	 * @param [options.isRow] If the row body should use flex row (instead of flex col).
	 */
	static getLabelledRowTuple (name, options) {
		options = options || {};

		const eleType = options.eleType || "div";

		const $rowInner = $(`<div class="${options.isRow ? "flex" : "flex-col"} full-width"/>`);
		const $row = $$`<div class="mb-2 mkbru__row stripe-even"><${eleType} class="mkbru__wrp-row flex-v-center"><span class="mr-2 mkbru__row-name ${options.isMarked ? `mkbru__row-name--marked` : ""}">${name}</span>${options.isMarked ? `<div class="mkbru__row-mark mr-2"/>` : ""}${$rowInner}</${eleType}></div>`;
		return [$row, $rowInner];
	}

	static __$getRow (name, $ipt, options) {
		options = options || {};

		const eleType = options.eleType || "div";

		return $$`<div class="mb-2 mkbru__row stripe-even"><${eleType} class="mkbru__wrp-row flex-v-center">
		<span class="mr-2 mkbru__row-name ${options.title ? "help" : ""}" ${options.title ? `title="${options.title}"` : ""}>${name}</span>
		${$ipt}
		<${eleType}/></div>`
	}

	static $getStateIptString (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.getProperty(state, ...path);
		const $ipt = $(`<input class="form-control input-xs form-control--minimal ${options.type ? `type="${options.type}"` : ""}">`)
			.val(initialState)
			.change(() => {
				const raw = $ipt.val().trim();
				const set = BuilderUi.__setProp(raw || !options.nullable ? raw : null, options, state, ...path);
				fnRender();
				if (options.callback) options.callback(set);
			});
		return BuilderUi.__$getRow(name, $ipt, options);
	}

	static $getStateIptEntries (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.getProperty(state, ...path);
		const $ipt = $(`<textarea class="form-control form-control--minimal mkbru__ipt-textarea" ${options.placeholder ? `placeholder="${options.placeholder}"` : ""}/>`)
			.val(BuilderUi.getEntriesAsText(initialState))
			.change(() => {
				const raw = $ipt.val().trim();
				BuilderUi.__setProp(raw || !options.nullable ? BuilderUi.getTextAsEntries(raw) : null, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $ipt, options);
	}

	static $getStateIptStringArray (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple(name, {isMarked: true});
		const initialState = MiscUtil.getProperty(state, ...path) || [];
		const stringRows = [];

		const doUpdateState = () => {
			const raw = stringRows.map(row => row.getState()).filter(it => it.trim());
			BuilderUi.__setProp(raw.length || !options.nullable ? raw : null, options, state, ...path);
			fnRender();
		};

		const $wrpRows = $(`<div/>`).appendTo($rowInner);
		initialState.forEach(string => BuilderUi.$getStateIptStringArray__getRow(doUpdateState, stringRows, string).$wrp.appendTo($wrpRows));

		const $wrpBtnAdd = $(`<div/>`).appendTo($rowInner);
		$(`<button class="btn btn-xs btn-default">Add ${options.shortName}</button>`)
			.appendTo($wrpBtnAdd)
			.click(() => {
				BuilderUi.$getStateIptStringArray__getRow(doUpdateState, stringRows).$wrp.appendTo($wrpRows);
				doUpdateState();
			});

		return $row;
	}

	static $getStateIptStringArray__getRow (doUpdateState, stringRows, initialString) {
		const getState = () => $iptString.val().trim();

		const $iptString = $(`<input class="form-control form-control--minimal input-xs mr-2">`)
			.change(() => doUpdateState());
		if (initialString && initialString.trim()) $iptString.val(initialString);

		const $btnRemove = $(`<button class="btn btn-xs btn-danger" title="Remove Row"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => {
				stringRows.splice(stringRows.indexOf(out), 1);
				$wrp.empty().remove();
				doUpdateState();
			});

		const $wrp = $$`<div class="flex-v-center mb-2">${$iptString}${$btnRemove}</div>`;
		const out = {$wrp, getState};
		stringRows.push(out);
		return out;
	}

	static $getStateIptNumber (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.getProperty(state, ...path);
		const $ipt = $(`<input class="form-control input-xs form-control--minimal" type="number" ${options.placeholder ? `placeholder="${options.placeholder}"` : ""}>`)
			.val(initialState)
			.change(() => {
				const raw = $ipt.val().trim();
				BuilderUi.__setProp(raw || !options.nullable ? Number(raw) : null, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $ipt, options);
	}

	static $getStateIptEnum (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.getProperty(state, ...path);
		const $sel = $(`<select class="form-control input-xs form-control--minimal">`);
		if (options.nullable) $sel.append(`<option value="-1">(None)</option>`);
		options.vals.forEach((v, i) => $(`<option>`).val(i).text(options.fnDisplay ? options.fnDisplay(v) : v).appendTo($sel));
		const ixInitial = options.vals.indexOf(initialState);
		$sel.val(ixInitial)
			.change(() => {
				const ixOut = Number($sel.val());
				const out = ~ixOut ? options.vals[ixOut] : null;
				BuilderUi.__setProp(out, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $sel, options);
	}

	static $getStateIptBoolean (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;

		const initialState = MiscUtil.getProperty(state, ...path);
		const $ipt = $(`<input class="mkbru__ipt-cb" type="checkbox">`)
			.prop("checked", initialState)
			.change(() => {
				// assumes false => null, unless not nullable
				const raw = !!$ipt.prop("checked");
				BuilderUi.__setProp(raw || !options.nullable ? raw : null, options, state, ...path);
				fnRender();
			});
		return BuilderUi.__$getRow(name, $$`<div class="full-width flex-v-center">${$ipt}</div>`, {...options, eleType: "label"});
	}

	static $getStateIptBooleanArray (name, fnRender, state, options, ...path) {
		if (options.nullable == null) options.nullable = true;
		const [$row, $rowInner] = BuilderUi.getLabelledRowTuple(name, {isMarked: true});

		const initialState = MiscUtil.getProperty(state, ...path) || [];
		const $wrpIpts = $(`<div class="flex-col full-width mr-2"/>`).appendTo($rowInner);
		const inputs = [];
		options.vals.forEach(val => {
			const $cb = $(`<input class="mkbru__ipt-cb" type="checkbox">`)
				.prop("checked", initialState.includes(val))
				.change(() => {
					BuilderUi.__setProp(getState(), options, state, ...path);
					fnRender();
				});
			inputs.push({$ipt: $cb, val});
			$$`<label class="flex-v-center split stripe-odd--faint"><span>${options.fnDisplay ? options.fnDisplay(val) : val}</span>${$cb}</label>`.appendTo($wrpIpts);
		});

		const getState = () => {
			const raw = inputs.map(it => it.$ipt.prop("checked") ? it.val : false).filter(Boolean);
			return raw.length || !options.nullable ? raw : null;
		};

		return $row;
	}

	static getEntriesAsText (entryArray) {
		if (!entryArray || !entryArray.length) return "";
		return JSON.stringify(entryArray, null, 2)
			.replace(/^\s*\[/, "").replace(/]\s*$/, "")
			.split("\n")
			.filter(it => it.trim())
			.map(it => {
				const trim = it.replace(/^\s\s/, "");
				const mQuotes = /^"(.*?)"$/.exec(trim);
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

	static pGetUserSpellSearch (options) {
		options = options || {};
		return new Promise(resolve => {
			const searchOpts = {defaultCategory: "alt_Spell"};
			if (options.level != null) searchOpts.resultFilter = (result) => result.lvl === options.level;

			const searchWidget = new SearchWidget(
				{alt_Spell: SearchWidget.CONTENT_INDICES.alt_Spell},
				(page, source, hash) => {
					const [encName, encSource] = hash.split(HASH_LIST_SEP);
					$modalInner.data("close")(false); // "cancel" close
					resolve(`{@spell ${decodeURIComponent(encName)}${encSource !== UrlUtil.encodeForHash(SRC_PHB) ? `|${decodeURIComponent(encSource)}` : ""}}`)
				},
				searchOpts
			);
			const $modalInner = UiUtil.getShow$Modal(
				"Select Spell",
				(doResolve) => {
					searchWidget.$wrpSearch.detach();
					if (doResolve) resolve(null); // ensure resolution
				}
			);
			$modalInner.append(searchWidget.$wrpSearch);
			searchWidget.doFocus();
		});
	}

	/**
	 * @param $ipt The input to sort.
	 * @param cb Callback function.
	 * @param sortOptions Sort order options.
	 * @param sortOptions.bottom Regex patterns that, should a token match, that token should be sorted to the end. Warning: slow.
	 */
	static $getSplitCommasSortButton ($ipt, cb, sortOptions) {
		sortOptions = sortOptions || {};
		return $(`<button class="btn btn-xs btn-default">Sort</button>`)
			.click(() => {
				const spl = $ipt.val().split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX);
				$ipt.val(spl.sort((a, b) => {
					if (sortOptions.bottom) {
						const ixA = sortOptions.bottom.findIndex(re => {
							const m = re.test(a);
							re.lastIndex = 0;
							return m;
						});
						const ixB = sortOptions.bottom.findIndex(re => {
							const m = re.test(b);
							re.lastIndex = 0;
							return m;
						});

						if (~ixA && ~ixB) return 0;
						else if (~ixA) return 1;
						else if (~ixB) return -1;
						else return SortUtil.ascSortLower(a, b);
					} else return SortUtil.ascSortLower(a, b);
				}).join(", "));
				cb();
			});
	}

	static $getUpButton (cbUpdate, rows, myRow) {
		return $(`<button class="btn btn-xs btn-default mkbru__btn-up-row ml-2" title="Move Up"><span class="glyphicon glyphicon-arrow-up"/></button>`)
			.click(() => {
				const ix = rows.indexOf(myRow);
				const cache = rows[ix - 1];
				rows[ix - 1] = myRow;
				rows[ix] = cache;
				cbUpdate();
			})
	}

	static $getDownButton (cbUpdate, rows, myRow) {
		return $(`<button class="btn btn-xs btn-default mkbru__btn-down-row ml-2" title="Move Down"><span class="glyphicon glyphicon-arrow-down"/></button>`)
			.click(() => {
				const ix = rows.indexOf(myRow);
				const cache = rows[ix + 1];
				rows[ix + 1] = myRow;
				rows[ix] = cache;
				cbUpdate();
			})
	}

	static $getDragPad (cbUpdate, rows, myRow, options) {
		const dragMeta = {};
		const doDragCleanup = () => {
			dragMeta.on = false;
			dragMeta.$wrap.remove();
			dragMeta.$dummies.forEach($d => $d.remove());
		};

		const doDragRender = () => {
			if (dragMeta.on) doDragCleanup();

			dragMeta.on = true;
			dragMeta.$wrap = $(`<div class="flex-col mkbru__wrp-drag-block"/>`).appendTo(options.$wrpRowsOuter);
			dragMeta.$dummies = [];

			const ixRow = rows.indexOf(myRow);

			rows.forEach((row, i) => {
				const dimensions = {w: row.$ele.outerWidth(true), h: row.$ele.outerHeight(true)};
				const $dummy = $(`<div class="mkbru__wrp-drag-dummy ${i === ixRow ? "mkbru__wrp-drag-dummy--highlight" : "mkbru__wrp-drag-dummy--lowlight"}"/>`)
					.width(dimensions.w).height(dimensions.h)
					.mouseup(() => {
						if (dragMeta.on) {
							doDragCleanup();
						}
					})
					.appendTo(dragMeta.$wrap);
				dragMeta.$dummies.push($dummy);

				if (i !== ixRow) { // on entering other areas, swap positions
					$dummy.mouseenter(() => {
						const cache = rows[i];
						rows[i] = myRow;
						rows[ixRow] = cache;

						if (options.cbSwap) options.cbSwap(cache);

						cbUpdate();
						doDragRender();
					});
				}
			});
		};

		return $(`<div class="ml-2 mkbru__drag-patch" title="Drag to Reorder">
		<div class="mkbru__drag-patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		<div class="mkbru__drag-patch-col"><div>&#8729</div><div>&#8729</div><div>&#8729</div></div>
		</div>`).mousedown(() => doDragRender());
	}
}

async function doPageInit () {
	// generic init
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	try {
		await BrewUtil.pAddBrewData();
		await BrewUtil.pAddLocalBrewData();
	} catch (e) {
		await BrewUtil.pPurgeBrew();
		setTimeout(() => { throw e });
	}
	await SearchUiUtil.pDoGlobalInit();
	await SearchWidget.pDoGlobalInit();

	// page-specific init
	await Builder.pInitAll();
	Renderer.utils.bindPronounceButtons();
	return ui.init();
}

const ui = new PageUi();
