"use strict";

class Prx {
	static addHook (prop, hook) {
		this.px._hooks[prop] = this.px._hooks[prop] || [];
		this.px._hooks[prop].push(hook);
	}

	static addHookAll (hook) {
		this.px._hooksAll.push(hook);
	}

	static toString () {
		return JSON.stringify(this, (k, v) => k === "px" ? undefined : v);
	}

	static copy () {
		return JSON.parse(Prx.toString.bind(this)());
	}

	static get (toProxy) {
		toProxy.px = {
			addHook: Prx.addHook.bind(toProxy),
			addHookAll: Prx.addHookAll.bind(toProxy),
			toString: Prx.toString.bind(toProxy),
			copy: Prx.copy.bind(toProxy),
			_hooksAll: [],
			_hooks: {},
		};

		return new Proxy(toProxy, {
			set: (object, prop, value) => {
				object[prop] = value;
				toProxy.px._hooksAll.forEach(hook => hook(prop, value));
				if (toProxy.px._hooks[prop]) toProxy.px._hooks[prop].forEach(hook => hook(prop, value));
				return true;
			},
			deleteProperty: (object, prop) => {
				delete object[prop];
				toProxy.px._hooksAll.forEach(hook => hook(prop, null));
				if (toProxy.px._hooks[prop]) toProxy.px._hooks[prop].forEach(hook => hook(prop, null));
				return true;
			},
		});
	}
}

class ProxyBase {
	constructor () {
		this.__hooks = {};
		this.__hooksAll = {};
		this.__hooksTmp = null;
		this.__hooksAllTmp = null;
	}

	_getProxy (hookProp, toProxy) {
		return new Proxy(toProxy, {
			set: (object, prop, value) => {
				if (object[prop] === value) return true;
				object[prop] = value;
				if (this.__hooksAll[hookProp]) this.__hooksAll[hookProp].forEach(hook => hook(prop, value));
				if (this.__hooks[hookProp] && this.__hooks[hookProp][prop]) this.__hooks[hookProp][prop].forEach(hook => hook(prop, value));
				return true;
			},
			deleteProperty: (object, prop) => {
				if (!(prop in object)) return true;
				delete object[prop];
				if (this.__hooksAll[hookProp]) this.__hooksAll[hookProp].forEach(hook => hook(prop, null));
				if (this.__hooks[hookProp] && this.__hooks[hookProp][prop]) this.__hooks[hookProp][prop].forEach(hook => hook(prop, null));
				return true;
			},
		});
	}

	_getDeepProxy (hookProp, toProxy) {
		const handler = {
			get: (object, prop) => {
				if (prop === "__isProxy") return true;
				const value = object[prop];
				if (value === undefined) return;
				if (value === null) return null;
				if (typeof value === "object" && !value.__isProxy) object[prop] = new Proxy(value, handler);
				return object[prop];
			},
			set: (object, prop, value) => {
				if (object[prop] === value) return true;
				object[prop] = value;
				if (this.__hooksAll[hookProp]) this.__hooksAll[hookProp].forEach(hook => hook(prop, null));
				if (this.__hooks[hookProp] && this.__hooks[hookProp][prop]) this.__hooks[hookProp][prop].forEach(hook => hook(prop, null));
				return true;
			},
		}
		return new Proxy(toProxy, handler)
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
		ProxyBase._addHook_to(this.__hooks, hookProp, prop, hook);
		if (this.__hooksTmp) ProxyBase._addHook_to(this.__hooksTmp, hookProp, prop, hook);
	}

	static _addHook_to (obj, hookProp, prop, hook) {
		((obj[hookProp] = obj[hookProp] || {})[prop] = (obj[hookProp][prop] || [])).push(hook);
	}

	_addHookAll (hookProp, hook) {
		ProxyBase._addHookAll_to(this.__hooksAll, hookProp, hook);
		if (this.__hooksAllTmp) ProxyBase._addHookAll_to(this.__hooksAllTmp, hookProp, hook)
	}

	static _addHookAll_to (obj, hookProp, hook) {
		(obj[hookProp] = obj[hookProp] || []).push(hook);
	}

	_removeHook (hookProp, prop, hook) {
		ProxyBase._removeHook_from(this.__hooks, hookProp, prop, hook);
		if (this.__hooksTmp) ProxyBase._removeHook_from(this.__hooksTmp, hookProp, prop, hook);
	}

	static _removeHook_from (obj, hookProp, prop, hook) {
		if (obj[hookProp] && obj[hookProp][prop]) {
			const ix = obj[hookProp][prop].findIndex(hk => hk === hook);
			if (~ix) obj[hookProp][prop].splice(ix, 1);
		}
	}

	_removeHookAll (hookProp, hook) {
		ProxyBase._removeHookAll_from(this.__hooksAll, hookProp, hook);
		if (this.__hooksAllTmp) ProxyBase._removeHook_from(this.__hooksAllTmp, hookProp, hook);
	}

	static _removeHookAll_from (obj, hookProp, hook) {
		if (obj[hookProp]) {
			const ix = obj[hookProp].findIndex(hk => hk === hook);
			if (~ix) obj[hookProp].splice(ix, 1);
		}
	}

	_resetHooks (hookProp) {
		if (hookProp !== undefined) delete this.__hooks[hookProp];
		else Object.keys(this.__hooks).forEach(prop => delete this.__hooks[prop]);
	}

	_resetHooksAll (hookProp) {
		if (hookProp !== undefined) delete this.__hooksAll[hookProp];
		else Object.keys(this.__hooksAll).forEach(prop => delete this.__hooksAll[prop]);
	}

	_saveHookCopiesTo (obj) { this.__hooksTmp = obj; }
	_saveHookAllCopiesTo (obj) { this.__hooksAllTmp = obj; }

	/**
	 * Object.assign equivalent, overwrites values on the current proxied object with some new values,
	 *   then trigger all the appropriate event handlers.
	 * @param hookProp Hook property, e.g. "state".
	 * @param proxyProp Proxied object property, e.g. "_state".
	 * @param underProp Underlying object property, e.g. "__state".
	 * @param toObj
	 * @param isOverwrite If the overwrite should clean/delete all data from the object beforehand.
	 */
	_proxyAssign (hookProp, proxyProp, underProp, toObj, isOverwrite) {
		const oldKeys = Object.keys(this[proxyProp]);
		const nuKeys = new Set(Object.keys(toObj));
		const dirtyKeys = new Set();

		if (isOverwrite) {
			oldKeys.forEach(k => {
				if (!nuKeys.has(k) && this[underProp] !== undefined) {
					delete this[underProp][k];
					dirtyKeys.add(k);
				}
			});
		}

		nuKeys.forEach(k => {
			if (!CollectionUtil.deepEquals(this[underProp][k], toObj[k])) {
				this[underProp][k] = toObj[k];
				dirtyKeys.add(k);
			}
		});

		dirtyKeys.forEach(k => {
			if (this.__hooksAll[hookProp]) this.__hooksAll[hookProp].forEach(hk => hk(k, this[underProp][k]));
			if (this.__hooks[hookProp] && this.__hooks[hookProp][k]) this.__hooks[hookProp][k].forEach(hk => hk(k, this[underProp][k]));
		});
	}

	_proxyAssignSimple (hookProp, toObj, isOverwrite) {
		return this._proxyAssign(hookProp, `_${hookProp}`, `__${hookProp}`, toObj, isOverwrite);
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
	 */
	static strToInt (string, fallbackEmpty = 0, opts) { return UiUtil._strToNumber(string, fallbackEmpty, opts, true) }

	/**
	 * @param string String to parse.
	 * @param [fallbackEmpty] Fallback number if string is empty.
	 * @param [opts] Options Object.
	 * @param [opts.max] Max allowed return value.
	 * @param [opts.min] Min allowed return value.
	 * @param [opts.fallbackOnNaN] Return value if not a number.
	 */
	static strToNumber (string, fallbackEmpty = 0, opts) { return UiUtil._strToNumber(string, fallbackEmpty, opts, false) }

	static _strToNumber (string, fallbackEmpty = 0, opts, isInt) {
		opts = opts || {};
		let out;
		string = string.trim();
		if (!string) out = fallbackEmpty;
		else {
			const num = UiUtil._parseStrAsNumber(string, isInt);
			out = isNaN(num) || !isFinite(num)
				? opts.fallbackOnNaN !== undefined ? opts.fallbackOnNaN : 0
				: num;
		}
		if (opts.max != null) out = Math.min(out, opts.max);
		if (opts.min != null) out = Math.max(out, opts.min);
		return out;
	}

	/**
	 * @param string String to parse.
	 * @param [fallbackEmpty] Fallback value if string is empty.
	 * @param [opts] Options Object.
	 * @param [opts.fallbackOnNaB] Return value if not a boolean.
	 */
	static strToBool (string, fallbackEmpty = null, opts) {
		opts = opts || {};
		if (!string) return fallbackEmpty;
		string = string.trim().toLowerCase();
		if (!string) return fallbackEmpty;
		return string === "true" ? true : string === "false" ? false : opts.fallbackOnNaB;
	}

	static intToBonus (int) { return `${int >= 0 ? "+" : ""}${int}`; }

	static getEntriesAsText (entryArray) {
		if (!entryArray || !entryArray.length) return "";
		const lines = JSON.stringify(entryArray, null, 2)
			.replace(/^\s*\[/, "").replace(/]\s*$/, "")
			.split("\n")
			.filter(it => it.trim())
			.map(it => {
				const trim = it.replace(/^\s\s/, "");
				const mQuotes = /^"(.*?)",?$/.exec(trim);
				if (mQuotes) return mQuotes[1]; // if string, strip quotes
				else return `  ${trim}`; // if object, indent
			});

		let out = "";
		const len = lines.length;
		for (let i = 0; i < len; ++i) {
			out += lines[i];

			if (i < len - 1) {
				out += "\n";
				if (!lines[i].startsWith("  ")) out += "\n";
			}
		}
		return out;
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
				type: "danger",
			});
			return lines;
		}
	}

	/**
	 * @param {Object} [opts] Options object.
	 * @param {string} [opts.title] Modal title.
	 *
	 * @param {string} [opts.title] Modal title.
	 *
	 * @param [opts.isUncappedHeight] {boolean}
	 * @param [opts.isUncappedWidth] {boolean}
	 * @param [opts.isHeight100] {boolean}
	 * @param [opts.isWidth100] {boolean}
	 * @param [opts.isMinHeight0] {boolean}
	 * @param [opts.isMaxWidth640p] {boolean}
	 * @param [opts.isFullscreenModal] {boolean} An alternate mode.
	 * @param [opts.isHeaderBorder] {boolean}
	 *
	 * @param {function} [opts.cbClose] Callback run when the modal is closed.
	 * @param {JQuery} [opts.$titleSplit] Element to have split alongside the title.
	 * @param {int} [opts.zIndex] Z-index of the modal.
	 * @param {number} [opts.overlayColor] Overlay color.
	 * @param {boolean} [opts.isPermanent] If the modal should be impossible to close.
	 * @param {boolean} [opts.isIndestructible] If the modal elements should be detached, not removed.
	 * @param {boolean} [opts.isClosed] If the modal should start off closed.
	 * @param {boolean} [opts.isEmpty] If the modal should contain no content.
	 * @param {boolean} [opts.hasFooter] If the modal has a footer.
	 * @returns {object}
	 */
	static getShowModal (opts) {
		opts = opts || {};

		UiUtil._initModalEscapeHandler();
		UiUtil._initModalMouseupHandlers();
		$(document.activeElement).blur(); // blur any active element as it will be behind the modal

		// if the user closed the modal by clicking the "cancel" background, isDataEntered is false
		const pHandleCloseClick = async (isDataEntered, ...args) => {
			if (opts.cbClose) await opts.cbClose(isDataEntered, ...args);

			if (opts.isIndestructible) $overlay.detach();
			else $overlay.remove();

			doTeardown();
		};

		const doTeardown = () => {
			UiUtil._popFromModalStack(modalStackMeta);
			if (!UiUtil._MODAL_STACK.length) document.body.classList.remove(`ui-modal__body-active`);
		};

		const doOpen = () => {
			$overlay.appendTo(document.body);
			document.body.classList.add(`ui-modal__body-active`);
		};

		const $overlay = $(`<div class="ui-modal__overlay">`);
		if (opts.zIndex != null) $overlay.css({zIndex: opts.zIndex});
		if (opts.overlayColor != null) $overlay.css({backgroundColor: opts.overlayColor});

		// In "fullscreen" mode, blank out the modal background
		const $overlayBlind = opts.isFullscreenModal
			? $(`<div class="ui-modal__overlay-blind w-100 h-100 flex-col"></div>`).appendTo($overlay)
			: null;

		const $scroller = $(`<div class="ui-modal__scroller flex-col"></div>`);

		const modalWindowClasses = [
			opts.isWidth100 ? `w-100` : "",
			opts.isHeight100 ? "h-100" : "",
			opts.isUncappedHeight ? "ui-modal__inner--uncap-height" : "",
			opts.isUncappedWidth ? "ui-modal__inner--uncap-width" : "",
			opts.isMinHeight0 ? `ui-modal__inner--no-min-height` : "",
			opts.isMaxWidth640p ? `ui-modal__inner--max-width-640p` : "",
			opts.isFullscreenModal ? `ui-modal__inner--mode-fullscreen my-0 pt-0` : "",
			opts.hasFooter ? `pb-0` : "",
		].filter(Boolean);

		const $btnCloseModal = opts.isFullscreenModal
			? $(`<button class="btn btn-danger btn-xs"><span class="glyphicon glyphicon-remove"></span></button>`)
				.click(() => pHandleCloseClick(false))
			: null;

		const $modalFooter = opts.hasFooter ? $(`<div class="no-shrink w-100 flex-col ui-modal__footer ${opts.isFullscreenModal ? `ui-modal__footer--fullscreen mt-1` : ""}"></div>`) : null;

		const $modal = $$`<div class="ui-modal__inner flex-col dropdown-menu ${modalWindowClasses.join(" ")}">
			${!opts.isEmpty && opts.title ? $$`<div class="split-v-center no-shrink ${opts.isHeaderBorder ? `ui-modal__header--border` : ""} ${opts.isFullscreenModal ? `ui-modal__header--fullscreen mb-1` : ""}">
				${opts.title ? `<h4 class="my-2">${opts.title.escapeQuotes()}</h4>` : ""}${opts.$titleSplit || ""}${$btnCloseModal}
			</div>` : null}

			${!opts.isEmpty ? $scroller : null}

			${$modalFooter}
		</div>`
			.appendTo(opts.isFullscreenModal ? $overlayBlind : $overlay);

		$overlay
			.mouseup(evt => {
				if (evt.target !== $overlay[0]) return;
				if (evt.target !== UiUtil._MODAL_LAST_MOUSEDOWN) return;
				if (opts.isPermanent) return;
				evt.stopPropagation();
				evt.preventDefault();
				return pHandleCloseClick(false);
			});

		if (!opts.isClosed) doOpen();

		const modalStackMeta = {
			isPermanent: opts.isPermanent,
			pHandleCloseClick,
			doTeardown,
		};
		if (!opts.isClosed) UiUtil._pushToModalStack(modalStackMeta);

		const out = {
			$modal,
			$modalInner: $scroller,
			$modalFooter,
			doClose: pHandleCloseClick,
			doTeardown,
		};

		if (opts.isIndestructible || opts.isClosed) {
			out.doOpen = () => {
				UiUtil._pushToModalStack(modalStackMeta);
				doOpen();
			};
		}

		return out;
	}

	static _pushToModalStack (modalStackMeta) {
		if (!UiUtil._MODAL_STACK.includes(modalStackMeta)) {
			UiUtil._MODAL_STACK.push(modalStackMeta);
		}
	}

	static _popFromModalStack (modalStackMeta) {
		const ixStack = UiUtil._MODAL_STACK.indexOf(modalStackMeta);
		if (~ixStack) UiUtil._MODAL_STACK.splice(ixStack, 1);
	}

	static _initModalEscapeHandler () {
		if (UiUtil._MODAL_STACK) return;
		UiUtil._MODAL_STACK = [];

		document.addEventListener("keydown", evt => {
			if (evt.which !== 27) return;
			if (!UiUtil._MODAL_STACK.length) return;
			if (EventUtil.isInInput(evt)) return;

			const outerModalMeta = UiUtil._MODAL_STACK.last();
			if (!outerModalMeta) return;
			evt.stopPropagation();
			if (!outerModalMeta.isPermanent) return outerModalMeta.pHandleCloseClick(false);
		});
	}

	static _initModalMouseupHandlers () {
		document.addEventListener("mousedown", evt => {
			UiUtil._MODAL_LAST_MOUSEDOWN = evt.target;
		});
	}

	static addModalSep ($modalInner) {
		$modalInner.append(`<hr class="ui-modal__row-sep">`);
	}

	static $getAddModalRow ($modalInner, tag = "div") {
		return $(`<${tag} class="ui-modal__row"></${tag}>`).appendTo($modalInner);
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
		if (opts.helpText) $row.title(opts.helpText);
		return $row;
	}

	static $getAddModalRowCb ($modalInner, labelText, objectWithProp, propName, helpText) {
		const $row = UiUtil.$getAddModalRow($modalInner, "label").addClass(`ui-modal__row--cb`);
		if (helpText) $row.title(helpText);
		$row.append(`<span>${labelText}</span>`);
		const $cb = $(`<input type="checkbox">`).appendTo($row)
			.keydown(evt => {
				if (evt.key === "Escape") $cb.blur();
			})
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
		if (opts.helpText) $row.title(opts.helpText);
		$row.append(`<span>${labelText}</span>`);
		const $sel = $(`<select class="form-control input-xs w-30">`).appendTo($row);
		values.forEach((val, i) => $(`<option value="${i}"></option>`).text(opts.fnDisplay ? opts.fnDisplay(val) : val).appendTo($sel));
		// N.B. this doesn't support null values
		const ix = values.indexOf(objectWithProp[propName]);
		$sel.val(`${~ix ? ix : 0}`)
			.change(() => objectWithProp[propName] = values[$sel.val()]);
		return $sel;
	}

	static _parseStrAsNumber (str, isInt) {
		const wrpTree = Renderer.dice.lang.getTree3(str);
		if (!wrpTree) return NaN;
		const out = wrpTree.tree.evl({});
		if (!isNaN(out) && isInt) return Math.round(out);
		return out;
	}

	static bindTypingEnd ({$ipt, fnKeyup, fnKeypress, fnKeydown, fnClick} = {}) {
		let timerTyping;
		$ipt
			.on("keyup search paste", evt => {
				clearTimeout(timerTyping);
				timerTyping = setTimeout(() => { fnKeyup(evt); }, UiUtil.TYPE_TIMEOUT_MS);
			})
			.on("keypress", (e) => {
				if (fnKeypress) fnKeypress(e);
			})
			.on("keydown", evt => {
				if (fnKeydown) fnKeydown(evt);
				clearTimeout(timerTyping);
			})
			.on("click", () => {
				if (fnClick) fnClick();
			});
	}

	static async pDoForceFocus (ele, {timeout = 250} = {}) {
		if (!ele) return;
		ele.focus();

		const forceFocusStart = Date.now();
		while ((Date.now() < forceFocusStart + timeout) && document.activeElement !== ele) {
			await MiscUtil.pDelay(33);
			ele.focus();
		}
	}
}
UiUtil.SEARCH_RESULTS_CAP = 75;
UiUtil.TYPE_TIMEOUT_MS = 100; // auto-search after 100ms
UiUtil._MODAL_STACK = null;
UiUtil._MODAL_LAST_MOUSEDOWN = null;

class ListUiUtil {
	/**
	 * (Public method for Plutonium use)
	 * Handle doing a checkbox-based selection toggle on a list.
	 * @param list
	 * @param item List item. Must have a "data" property with a "cbSel" (the checkbox).
	 * @param evt Click event.
	 * @param [opts] Options object.
	 * @param [opts.isNoHighlightSelection] If highlighting selected rows should be skipped.
	 * @param [opts.fnOnSelectionChange] Function to call when selection status of an item changes.
	 * @param [opts.fnGetCb] Function which gets the checkbox from a list item.
	 */
	static handleSelectClick (list, item, evt, opts) {
		opts = opts || {};
		evt.preventDefault();
		evt.stopPropagation();

		if (evt && evt.shiftKey && list.__firstListSelection) {
			if (list.__lastListSelection === item) {
				// on double-tapping the end of the selection, toggle it on/off

				const cb = this._getCb(item, opts);
				this._updateCb(item, opts, !cb.checked);
			} else if (list.__firstListSelection === item && list.__lastListSelection) {
				// If the item matches the last clicked, clear all checkboxes from our last selection

				const ix1 = list.visibleItems.indexOf(list.__firstListSelection);
				const ix2 = list.visibleItems.indexOf(list.__lastListSelection);

				const [ixStart, ixEnd] = [ix1, ix2].sort(SortUtil.ascSort);
				for (let i = ixStart; i <= ixEnd; ++i) {
					const it = list.visibleItems[i];
					this._updateCb(it, opts, false);
				}

				this._updateCb(item, opts);
			} else {
				// on a shift-click, toggle all the checkboxes to true...

				const ix1 = list.visibleItems.indexOf(list.__firstListSelection);
				const ix2 = list.visibleItems.indexOf(item);
				const ix2Prev = list.__lastListSelection ? list.visibleItems.indexOf(list.__lastListSelection) : null;

				const [ixStart, ixEnd] = [ix1, ix2].sort(SortUtil.ascSort);
				for (let i = ixStart; i <= ixEnd; ++i) {
					const it = list.visibleItems[i];
					this._updateCb(it, opts);
				}

				// ...except those between the last selection and this selection, set those to false
				if (ix2Prev != null) {
					if (ix2Prev > ixEnd) {
						for (let i = ixEnd + 1; i <= ix2Prev; ++i) {
							const it = list.visibleItems[i];
							this._updateCb(it, opts, false);
						}
					} else if (ix2Prev < ixStart) {
						for (let i = ix2Prev; i < ixStart; ++i) {
							const it = list.visibleItems[i];
							this._updateCb(it, opts, false);
						}
					}
				}
			}

			list.__lastListSelection = item;
		} else {
			// on a normal click, or if there's been no initial selection, just toggle the checkbox

			const cbMaster = this._getCb(item, opts);
			if (cbMaster) {
				cbMaster.checked = !cbMaster.checked;

				if (opts.fnOnSelectionChange) opts.fnOnSelectionChange(item, cbMaster.checked);

				if (!opts.isNoHighlightSelection) {
					if (cbMaster.checked) item.ele instanceof $ ? item.ele.addClass("list-multi-selected") : item.ele.classList.add("list-multi-selected");
					else item.ele instanceof $ ? item.ele.removeClass("list-multi-selected") : item.ele.classList.remove("list-multi-selected");
				}
			} else {
				if (!opts.isNoHighlightSelection) {
					item.ele instanceof $ ? item.ele.removeClass("list-multi-selected") : item.ele.classList.remove("list-multi-selected");
				}
			}

			list.__firstListSelection = item;
			list.__lastListSelection = null;
		}
	}

	/**
	 * Handle doing a radio-based selection toggle on a list.
	 * @param list
	 * @param item List item. Must have a "data" property with a "cbSel" (the radio input).
	 * @param evt Click event.
	 */
	static handleSelectClickRadio (list, item, evt) {
		evt.preventDefault();
		evt.stopPropagation();

		list.items.forEach(it => {
			if (it === item) {
				// Setting this to true *should* cause the browser to update the rest for us, but since list items can
				//   be filtered/hidden, the browser won't necessarily update them all. Therefore, forcibly set
				//   `checked = false` below.
				it.data.cbSel.checked = true;
				it.ele.classList.add("list-multi-selected");
			} else {
				it.data.cbSel.checked = false;
				it.ele.classList.remove("list-multi-selected");
			}
		})
	}

	static _getCb (item, opts) { return opts.fnGetCb ? opts.fnGetCb(item) : item.data.cbSel; }

	static _updateCb (item, opts, toVal = true) {
		const cbSlave = this._getCb(item, opts);
		if (cbSlave) {
			cbSlave.checked = toVal;
			if (opts.fnOnSelectionChange) opts.fnOnSelectionChange(item, toVal);
		}

		if (!opts.isNoHighlightSelection) {
			if (toVal) item.ele instanceof $ ? item.ele.addClass("list-multi-selected") : item.ele.classList.add("list-multi-selected");
			else item.ele instanceof $ ? item.ele.removeClass("list-multi-selected") : item.ele.classList.remove("list-multi-selected");
		}
	}

	/**
	 * (Public method for Plutonium use)
	 */
	static bindSelectAllCheckbox ($cbAll, list) {
		$cbAll.change(() => {
			const isChecked = $cbAll.prop("checked");
			list.visibleItems.forEach(item => {
				if (item.data.cbSel) item.data.cbSel.checked = isChecked;

				if (isChecked) item.ele instanceof $ ? item.ele.addClass("list-multi-selected") : item.ele.classList.add("list-multi-selected");
				else item.ele instanceof $ ? item.ele.removeClass("list-multi-selected") : item.ele.classList.remove("list-multi-selected");
			});
		});
	}

	static bindPreviewButton (renderFn, allData, item, btnShowHidePreview) {
		btnShowHidePreview.addEventListener("click", evt => {
			const entity = allData[item.ix];

			const elePreviewWrp = this.getOrAddListItemPreviewLazy(item);

			this.handleClickBtnShowHideListPreview(evt, renderFn, entity, btnShowHidePreview, elePreviewWrp);
		});
	}

	static handleClickBtnShowHideListPreview (evt, renderFn, entity, btnShowHidePreview, elePreviewWrp) {
		evt.stopPropagation();

		const nxtText = btnShowHidePreview.innerHTML.trim() === this.HTML_GLYPHICON_EXPAND ? this.HTML_GLYPHICON_CONTRACT : this.HTML_GLYPHICON_EXPAND;

		elePreviewWrp.classList.toggle("ve-hidden", nxtText === this.HTML_GLYPHICON_EXPAND);
		btnShowHidePreview.innerHTML = nxtText;

		const elePreviewWrpInner = elePreviewWrp.lastElementChild;

		if (elePreviewWrpInner.innerHTML) return;

		elePreviewWrpInner.addEventListener("click", evt => { evt.stopPropagation(); });
		$(elePreviewWrpInner).empty();
		$$`<div class="pf2-stat stats">${renderFn(entity)}</div>`.appendTo(elePreviewWrpInner);
	}

	static getOrAddListItemPreviewLazy (item) {
		// We lazily add the preview UI, to mitigate rendering performance issues
		let elePreviewWrp;
		if (item.ele.children.length === 1) {
			elePreviewWrp = e_({
				tag: "div",
				clazz: "ve-hidden flex",
				children: [
					e_({tag: "div", clazz: "col-0-5"}),
					e_({tag: "div", clazz: "col-11-5 ui-list__wrp-preview py-2 pr-2"}),
				],
			}).appendTo(item.ele);
		} else elePreviewWrp = item.ele.lastElementChild;
		return elePreviewWrp;
	}

	static bindPreviewAllButton ($btnAll, list) {
		$btnAll.click(async () => {
			const nxtHtml = $btnAll.html() === ListUiUtil.HTML_GLYPHICON_EXPAND
				? ListUiUtil.HTML_GLYPHICON_CONTRACT
				: ListUiUtil.HTML_GLYPHICON_EXPAND;

			if (nxtHtml === ListUiUtil.HTML_GLYPHICON_CONTRACT && list.visibleItems.length > 500) {
				const isSure = await InputUiUtil.pGetUserBoolean({
					title: "Are You Sure?",
					htmlDescription: `You are about to expand ${list.visibleItems.length} rows. This may seriously degrade performance.<br>Are you sure you want to continue?`,
				});
				if (!isSure) return;
			}

			$btnAll.html(nxtHtml);

			list.visibleItems.forEach(listItem => {
				if (listItem.data.btnShowHidePreview.innerHTML !== nxtHtml) listItem.data.btnShowHidePreview.click();
			});
		});
	}
}
ListUiUtil.HTML_GLYPHICON_EXPAND = `[+]`;
ListUiUtil.HTML_GLYPHICON_CONTRACT = `[\u2012]`;

class TabUiUtil {
	static decorate (obj) {
		obj.__tabMetas = {};

		obj._resetTabs = function (tabGroup) {
			tabGroup = tabGroup || "_default";
			(obj.__tabMetas[tabGroup] || [])
				.filter(Boolean)
				.forEach(tab => tab.fnCleanup());
			obj.__tabMetas[tabGroup] = [];
		};

		obj._setActiveTab = function (tab, tabGroup) {
			tabGroup = tabGroup || "_default";
			const activeProp = `activeTab__${tabGroup}`;

			const tabMeta = obj.__tabMetas[tabGroup];

			const ix = tabMeta.indexOf(tab);
			if (~ix) {
				const _proxyProp = `_${tab.proxyProp}`;
				obj[_proxyProp][activeProp] = ix;
			}
		};

		obj._hasPrevTab = function (proxyProp, tabGroup) { return obj.__hasTab(proxyProp, tabGroup, -1); };
		obj._hasNextTab = function (proxyProp, tabGroup) { return obj.__hasTab(proxyProp, tabGroup, 1); };

		obj.__hasTab = function (proxyProp, tabGroup, offset) {
			tabGroup = tabGroup || "_default";
			const activeProp = `activeTab__${tabGroup}`;
			const _proxyProp = `_${proxyProp}`;
			const ixActive = obj[_proxyProp][activeProp];
			return !!(obj.__tabMetas[tabGroup] && obj.__tabMetas[tabGroup][ixActive + offset]);
		};

		obj._doSwitchToPrevTab = function (proxyProp, tabGroup) { return obj.__doSwitchToTab(proxyProp, tabGroup, -1); };
		obj._doSwitchToNextTab = function (proxyProp, tabGroup) { return obj.__doSwitchToTab(proxyProp, tabGroup, 1); };

		obj.__doSwitchToTab = function (proxyProp, tabGroup, offset) {
			if (!obj.__hasTab(proxyProp, tabGroup, offset)) return;
			tabGroup = tabGroup || "_default";
			const activeProp = `activeTab__${tabGroup}`;
			const _proxyProp = `_${proxyProp}`;
			obj[_proxyProp][activeProp] = obj[_proxyProp][activeProp] + offset;
		};

		/**
		 * @param proxyProp
		 * @param hk
		 * @param [opts]
		 * @param [opts.tabGroup]
		 */
		obj._addHookActiveTab = function (proxyProp, hk, opts) {
			opts = opts || {};

			const tabGroup = opts.tabGroup || "_default";
			const activeProp = `activeTab__${tabGroup}`;

			this._addHook(proxyProp, activeProp, hk);
		};

		/**
		 * @param ix The tabs ordinal index.
		 * @param name The name to display on the tab.
		 * @param proxyProp E.g. "state", "meta", ...
		 * @param [opts] Options object.
		 * @param [opts.tabGroup] User-defined string identifying which group of tabs this belongs to.
		 * @param [opts.hasBorder] True if the tab should compensate for having a top border; i.e. pad itself.
		 * @param [opts.hasBackground] True if the tab should have a flat-color background.
		 * @param [opts.cbTabChange] Callback function to call on tab change.
		 * @param [opts.btnCss]
		 */
		obj._getTab = function (ix, name, proxyProp, opts) {
			const tabGroup = opts.tabGroup || "_default";

			const activeProp = `activeTab__${tabGroup}`;

			const _proxyProp = `_${proxyProp}`;
			const __proxyProp = `__${proxyProp}`;
			obj[__proxyProp][activeProp] = obj[__proxyProp][activeProp] || 0;

			const $btnTab = $(`<button class="btn btn-default ui-tab__btn-tab-head ${opts.btnCss ? opts.btnCss : ""}">${name}</button>`)
				.click(() => obj[_proxyProp][activeProp] = ix);

			const $wrpTab = $(`<div class="ui-tab__wrp-tab-body ve-hidden ${opts.hasBorder ? "ui-tab__wrp-tab-body--border" : ""} ${opts.hasBackground ? "ui-tab__wrp-tab-body--background" : ""}"></div>`);

			const hkActiveTab = (prop, ixActive, prevIxActive) => {
				$btnTab.toggleClass("ui-tab__btn-tab-head--active", ixActive === ix);
				$wrpTab.toggleVe(ixActive === ix);

				if (opts.cbTabChange) {
					// If we were the tab switched away from, run the on-change callback (ensuring it only gets called once)
					if (prevIxActive === ix && ixActive !== ix) opts.cbTabChange();
				}
			};
			obj._addHook(proxyProp, activeProp, hkActiveTab);
			hkActiveTab(activeProp, obj[_proxyProp][activeProp]);

			const tab = {
				ix,
				$btnTab,
				$wrpTab,
				proxyProp,
				fnCleanup: () => {
					obj._removeHook(proxyProp, activeProp, hkActiveTab);
				},
			};

			(obj.__tabMetas[tabGroup] = obj.__tabMetas[tabGroup] || [])[ix] = tab;

			return tab;
		};
	}
}

// TODO have this respect the blacklist?
class SearchUiUtil {
	static async pDoGlobalInit () {
		elasticlunr.clearStopWords();
		// await Renderer.item.populatePropertyAndTypeReference();
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

		const initIndexForFullCat = (doc) => {
			if (!availContent[doc.cf]) {
				availContent[doc.cf] = elasticlunr(function () {
					this.addField("n");
					this.addField("s");
					this.setRef("id");
				});
				SearchUtil.removeStemmer(availContent[doc.cf]);
			}
		};

		const handleDataItem = (d, isAlternate) => {
			if (SearchUiUtil._isNoHoverCat(d.c) || fromDeepIndex(d)) return;
			d.cf = d.c === Parser.CAT_ID_CREATURE ? "Creature" : Parser.pageCategoryToFull(d.c);
			if (isAlternate) d.cf = `alt_${d.cf}`;
			initIndexForFullCat(d);
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
			initIndexForFullCat(d);
			availContent.ALL.addDoc(d);
			availContent[d.cf].addDoc(d);
		});

		return availContent;
	}
}
SearchUiUtil.NO_HOVER_CATEGORIES = new Set([
	Parser.CAT_ID_ADVENTURE,
	Parser.CAT_ID_BOOK,
	Parser.CAT_ID_QUICKREF,
	Parser.CAT_ID_PAGE,
]);

// based on GM screen's AddMenuSearchTab
class SearchWidget {
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
	 * @param $iptSearch input element
	 * @param opts Options object.
	 * @param opts.fnSearch Function which runs the search.
	 * @param opts.fnShowWait Function which displays loading dots
	 * @param opts.flags Flags object; modified during user interaction.
	 * @param opts.flags.isWait Flag tracking "waiting for user to stop typing"
	 * @param opts.flags.doClickFirst Flag tracking "should first result get clicked"
	 * @param opts.flags.doClickFirst Flag tracking "should first result get clicked"
	 * @param opts.$ptrRows Pointer to array of rows.
	 */
	static bindAutoSearch ($iptSearch, opts) {
		UiUtil.bindTypingEnd({
			$ipt: $iptSearch,
			fnKeyup: () => {
				opts.fnSearch && opts.fnSearch();
			},
			fnKeypress: evt => {
				if (evt.which === 13) {
					opts.flags.doClickFirst = true;
					opts.fnSearch && opts.fnSearch();
				}
			},
			fnKeydown: evt => {
				if (opts.flags.isWait) {
					opts.flags.isWait = false;
					opts.fnShowWait && opts.fnShowWait();
				} else {
					switch (evt.which) {
						case 40: { // down
							if (opts.$ptrRows && opts.$ptrRows._[0]) {
								evt.preventDefault();
								opts.$ptrRows._[0].focus();
							}
							break;
						}
						case 13: { // enter
							if (opts.$ptrRows && opts.$ptrRows._[0]) {
								evt.preventDefault();
								opts.$ptrRows._[0].click();
							}
							break;
						}
					}
				}
			},
			fnClick: () => {
				if (opts.fnSearch && $iptSearch.val() && $iptSearch.val().trim().length) opts.fnSearch();
			},
		});
	}

	static bindRowHandlers ({result, $row, $ptrRows, fnHandleClick}) {
		return $row
			.keydown(evt => {
				switch (evt.which) {
					case 13: { // enter
						return fnHandleClick(result);
					}
					case 38: { // up
						evt.preventDefault();
						const ixRow = $ptrRows._.indexOf($row);
						const $prev = $ptrRows._[ixRow - 1];
						if ($prev) $prev.focus();
						else $ptrRows.focus();
						break;
					}
					case 40: { // down
						evt.preventDefault();
						const ixRow = $ptrRows._.indexOf($row);
						const $nxt = $ptrRows._[ixRow + 1];
						if ($nxt) $nxt.focus();
						break;
					}
				}
			})
			.click(() => fnHandleClick(result));
	}

	static docToPageSourceHash (doc) {
		const page = UrlUtil.categoryToHoverPage(doc.c);
		const source = doc.s;
		const hash = doc.u;

		return {page, source, hash};
	}

	/**
	 * @param indexes An object with index names (categories) as the keys, and indexes as the values.
	 * @param cbSearch Callback to run on user clicking a search result.
	 * @param options Options object.
	 * @param options.defaultCategory Default search category.
	 * @param options.fnFilterResults Function which takes a document and returns false if it is to be filtered out of the results.
	 * @param options.searchOptions Override for default elasticlunr search options.
	 * @param options.fnTransform Function which transforms the document before passing it back to cbSearch.
	 */
	constructor (indexes, cbSearch, options) {
		options = options || {};

		this._indexes = indexes;
		this._cat = options.defaultCategory || "ALL";
		this._cbSearch = cbSearch;
		this._fnFilterResults = options.fnFilterResults || null;
		this._searchOptions = options.searchOptions || null;
		this._fnTransform = options.fnTransform || null;

		this._flags = {
			doClickFirst: false,
			isWait: false,
		};
		this._$ptrRows = {_: []};

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
				s: {expand: true},
			},
			bool: "AND",
			expand: true,
		};
	}

	__$getRow (r) {
		return $(`<div class="ui-search__row" tabindex="0">
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
		this._$wrpResults.empty().append(SearchWidget.getSearchEnter());
	}

	__showMsgWait () {
		this._$wrpResults.empty().append(SearchWidget.getSearchLoading())
	}

	__showMsgNoResults () {
		this._flags.isWait = true;
		this._$wrpResults.empty().append(SearchWidget.getSearchNoResults());
	}

	__doSearch () {
		const searchInput = this._$iptSearch.val().trim();

		const index = this._indexes[this._cat];
		const results = index.search(searchInput, this.__getSearchOptions());

		const {toProcess, resultCount} = (() => {
			if (results.length) {
				if (this._fnFilterResults) {
					const filtered = results.filter(it => this._fnFilterResults(it.doc));
					return {
						toProcess: filtered.slice(0, UiUtil.SEARCH_RESULTS_CAP),
						resultCount: filtered.length,
					}
				} else {
					return {
						toProcess: results.slice(0, UiUtil.SEARCH_RESULTS_CAP),
						resultCount: results.length,
					}
				}
			} else {
				// If the user has entered a search and we found nothing, return no results
				if (searchInput.trim()) {
					return {
						toProcess: [],
						resultCount: 0,
					};
				}

				// Otherwise, we have no search term, so show a default list of results
				if (this._fnFilterResults) {
					const filtered = Object.values(index.documentStore.docs).filter(it => this._fnFilterResults(it)).map(it => ({doc: it}));
					return {
						toProcess: filtered.slice(0, UiUtil.SEARCH_RESULTS_CAP),
						resultCount: filtered.length,
					}
				} else {
					return {
						toProcess: Object.values(index.documentStore.docs).slice(0, UiUtil.SEARCH_RESULTS_CAP).map(it => ({doc: it})),
						resultCount: Object.values(index.documentStore.docs).length,
					}
				}
			}
		})();

		this._$wrpResults.empty();
		this._$ptrRows._ = [];

		if (resultCount) {
			const handleClick = (r) => {
				if (this._fnTransform) this._cbSearch(this._fnTransform(r.doc));
				else this._cbSearch(r.doc);
			};

			if (this._flags.doClickFirst) {
				handleClick(toProcess[0]);
				this._flags.doClickFirst = false;
				return;
			}

			const res = toProcess.slice(0, UiUtil.SEARCH_RESULTS_CAP);

			res.forEach(r => {
				const $row = this.__$getRow(r).appendTo(this._$wrpResults);
				SearchWidget.bindRowHandlers({result: r, $row, $ptrRows: this._$ptrRows, fnHandleClick: handleClick});
				this._$ptrRows._.push($row);
			});

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
			this._$rendered = $(`<div class="ui-search__wrp-output"></div>`);
			const $wrpControls = $(`<div class="ui-search__wrp-controls"></div>`).appendTo(this._$rendered);

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
			this._$wrpResults = $(`<div class="ui-search__wrp-results"></div>`).appendTo(this._$rendered);

			let lastSearchTerm = "";
			SearchWidget.bindAutoSearch(this._$iptSearch, {
				flags: this._flags,
				fnSearch: this.__doSearch.bind(this),
				fnShowWait: this.__showMsgWait.bind(this),
				$ptrRows: this._$ptrRows,
			});

			// On the first keypress, switch to loading dots
			this._$iptSearch.keydown(evt => {
				if (evt.key === "Escape") this._$iptSearch.blur();
				if (evt.which !== 13) {
					if (lastSearchTerm === "") this.__showMsgWait();
					lastSearchTerm = this._$iptSearch.val();
				}
			});

			this.__doSearch();
		}
	}

	doFocus () {
		this._$iptSearch.focus();
	}

	// region entity searches
	static async pGetUserAdventureSearch (opts) {
		await SearchWidget.pLoadCustomIndex("entity_Adventures", `${Renderer.get().baseUrl}data/adventures.json`, "adventure", Parser.CAT_ID_ADVENTURE, UrlUtil.PG_ADVENTURE, "adventures");
		return SearchWidget.pGetUserEntitySearch("Select Adventure", "entity_Adventures", opts);
	}
	// endregion

	/**
	 *
	 * @param title
	 * @param indexName
	 * @param [opts]
	 * @param [opts.fnFilterResults]
	 * @param [opts.fnTransform]
	 */
	static async pGetUserEntitySearch (title, indexName, opts) {
		opts = opts || {};

		return new Promise(resolve => {
			const searchOpts = {defaultCategory: indexName};
			if (opts.fnFilterResults) searchOpts.fnFilterResults = opts.fnFilterResults;
			if (opts.fnTransform) searchOpts.fnTransform = opts.fnTransform;

			const searchWidget = new SearchWidget(
				{[indexName]: SearchWidget.CONTENT_INDICES[indexName]},
				(docOrTransformed) => {
					doClose(false); // "cancel" close
					resolve(docOrTransformed);
				},
				searchOpts,
			);
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title,
				cbClose: (doResolve) => {
					searchWidget.$wrpSearch.detach();
					if (doResolve) resolve(null); // ensure resolution
				},
			});
			$modalInner.append(searchWidget.$wrpSearch);
			searchWidget.doFocus();
		});
	}

	// region custom search indexes
	static async pLoadCustomIndex (contentIndexName, dataSource, jsonProp, catId, page, errorName) {
		if (SearchWidget.P_LOADING_INDICES[contentIndexName]) await SearchWidget.P_LOADING_INDICES[contentIndexName];
		else {
			const doClose = SearchWidget._showLoadingModal();

			try {
				SearchWidget.P_LOADING_INDICES[contentIndexName] = (SearchWidget.CONTENT_INDICES[contentIndexName] = await SearchWidget._pGetIndex(dataSource, jsonProp, catId, page));
				SearchWidget.P_LOADING_INDICES[contentIndexName] = null;
			} catch (e) {
				JqueryUtil.doToast({type: "danger", content: `Could not load ${errorName}! ${VeCt.STR_SEE_CONSOLE}`});
				throw e;
			} finally {
				doClose();
			}
		}
	}

	static async _pGetIndex (dataSource, prop, catId, page) {
		const index = elasticlunr(function () {
			this.addField("n");
			this.addField("s");
			this.setRef("id");
		});

		const [featJson, homebrew] = await Promise.all([
			typeof dataSource === "string" ? DataUtil.loadJSON(dataSource) : dataSource(),
			BrewUtil.pAddBrewData(),
		]);

		featJson[prop].concat(homebrew[prop] || []).forEach((it, i) => index.addDoc({
			id: i,
			c: catId,
			cf: Parser.pageCategoryToFull(catId),
			h: 1,
			n: it.name,
			p: it.page,
			s: it.source,
			u: UrlUtil.URL_TO_HASH_BUILDER[page](it),
		}));

		return index;
	}

	static _showLoadingModal () {
		const {$modalInner, doClose} = UiUtil.getShowModal({isPermanent: true});
		$(`<div class="flex-vh-center w-100 h-100"><span class="dnd-font italic ve-muted">Loading...</span></div>`).appendTo($modalInner);
		return doClose;
	}
	// endregion
}
SearchWidget.P_LOADING_CONTENT = null;
SearchWidget.CONTENT_INDICES = {};
SearchWidget.P_LOADING_INDICES = {};

class InputUiUtil {
	/**
	 * @param opts Options.
	 * @param opts.min Minimum value.
	 * @param opts.max Maximum value.
	 * @param opts.int If the value returned should be an integer.
	 * @param opts.title Prompt title.
	 * @param opts.default Default value.
	 * @param [opts.$elePre] Element to add before the number input.
	 * @param [opts.$elePost] Element to add after the number input.
	 * @param [opts.isPermanent] If the prompt can only be closed by entering a number.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @param [opts.storageKey_default] Storage key for a "default" value override using the user's last/previous input.
	 * @param [opts.isGlobal_default] If the "default" storage key is global (rather than page-specific).
	 * @return {Promise<number>} A promise which resolves to the number if the user entered one, or null otherwise.
	 */
	static async pGetUserNumber (opts) {
		opts = opts || {};

		let defaultVal = opts.default !== undefined ? opts.default : null;
		if (opts.storageKey_default) {
			const prev = await (opts.isGlobal_default ? StorageUtil.pGet(opts.storageKey_default) : StorageUtil.pGetForPage(opts.storageKey_default));
			if (prev != null) defaultVal = prev;
		}

		return new Promise(resolve => {
			const $iptNumber = $(`<input class="form-control mb-2 text-right" ${opts.min ? `min="${opts.min}"` : ""} ${opts.max ? `max="${opts.max}"` : ""}>`)
				.keydown(evt => {
					if (evt.key === "Escape") { $iptNumber.blur(); return; }
					// return key
					if (evt.which === 13) doClose(true);
					evt.stopPropagation();
				});
			if (defaultVal !== undefined) $iptNumber.val(defaultVal);

			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));

			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Enter a Number",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);

					if (!isDataEntered) return resolve(null);
					const raw = $iptNumber.val();
					if (!raw.trim()) return resolve(null);
					let num = UiUtil.strToInt(raw);
					if (opts.min) num = Math.max(opts.min, num);
					if (opts.max) num = Math.min(opts.max, num);
					if (opts.int) num = Math.round(num);

					if (opts.storageKey_default) {
						opts.isGlobal_default
							? StorageUtil.pSet(opts.storageKey_default, num)
							: StorageUtil.pSetForPage(opts.storageKey_default, num);
					}

					resolve(num);
				},
			});

			if (opts.$elePre) opts.$elePre.appendTo($modalInner);
			$iptNumber.appendTo($modalInner);
			if (opts.$elePost) opts.$elePost.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
			$iptNumber.focus();
			$iptNumber.select();
		});
	}

	/**
	 * @param [opts] Options.
	 * @param [opts.title] Prompt title.
	 * @param [opts.textYesRemember] Text for "yes, and remember" button.
	 * @param [opts.textYes] Text for "yes" button.
	 * @param [opts.textNo] Text for "no" button.
	 * @param [opts.htmlDescription] Description HTML for the modal.
	 * @param [opts.storageKey] Storage key to use when "remember" options are passed.
	 * @param [opts.isGlobal] If the stored setting is global when "remember" options are passed.
	 * @param [opts.fnRemember] Custom function to run when saving the "yes and remember" option.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise} A promise which resolves to true/false if the user chose, or null otherwise.
	 */
	static async pGetUserBoolean (opts) {
		opts = opts || {};

		if (opts.storageKey) {
			const prev = await (opts.isGlobal ? StorageUtil.pGet(opts.storageKey) : StorageUtil.pGetForPage(opts.storageKey));
			if (prev != null) return prev;
		}

		return new Promise(resolve => {
			const $btnTrueRemember = opts.textYesRemember ? $(`<button class="btn btn-primary flex-v-center mr-3"><span class="glyphicon glyphicon-ok mr-2"></span><span>${opts.textYesRemember}</span></button>`)
				.click(() => {
					doClose(true, true);
					if (opts.fnRemember) {
						opts.fnRemember(true);
					} else {
						opts.isGlobal
							? StorageUtil.pSet(opts.storageKey, true)
							: StorageUtil.pSetForPage(opts.storageKey, true);
					}
				}) : null;

			const $btnTrue = $(`<button class="btn btn-primary flex-v-center mr-3"><span class="glyphicon glyphicon-ok mr-2"></span><span>${opts.textYes || "OK"}</span></button>`)
				.click(() => doClose(true, true));

			const $btnFalse = $(`<button class="btn btn-default btn-sm flex-v-center"><span class="glyphicon glyphicon-remove mr-2"></span><span>${opts.textNo || "Cancel"}</span></button>`)
				.click(() => doClose(true, false));

			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));

			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Choose",
				isMinHeight0: true,
				cbClose: (isDataEntered, value) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);

					if (!isDataEntered) return resolve(null);
					if (value == null) throw new Error(`Callback must receive a value!`); // sanity check
					resolve(value);
				},
			});

			if (opts.htmlDescription && opts.htmlDescription.trim()) $$`<div class="flex w-100 mb-1">${opts.htmlDescription}</div>`.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right py-1 px-1">${$btnTrueRemember}${$btnTrue}${$btnFalse}${$btnSkip}</div>`.appendTo($modalInner);
			$btnTrue.focus();
			$btnTrue.select();
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
	 * @param [opts.isAllowNull] If an empty input should be treated as null.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise} A promise which resolves to the index of the item the user selected (or an object if fnGetExtraState is passed), or null otherwise.
	 */
	static pGetUserEnum (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const $selEnum = $(`<select class="form-control mb-2"><option value="-1" disabled>${opts.placeholder || "Select..."}</option></select>`);

			if (opts.isAllowNull) $(`<option value="-1"></option>`).text(opts.fnDisplay ? opts.fnDisplay(null, -1) : "(None)").appendTo($selEnum);

			opts.values.forEach((v, i) => $(`<option value="${i}"></option>`).text(opts.fnDisplay ? opts.fnDisplay(v, i) : v).appendTo($selEnum));
			if (opts.default != null) $selEnum.val(opts.default);
			else $selEnum[0].selectedIndex = 0;

			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));

			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Select an Option",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);

					if (!isDataEntered) return resolve(null);
					const ix = Number($selEnum.val());
					if (!~ix) return resolve(null);
					if (opts.fnGetExtraState) {
						const out = {extraState: opts.fnGetExtraState()};
						if (opts.isResolveItem) out.item = opts.values[ix];
						else out.ix = ix;
						resolve(out)
					} else resolve(opts.isResolveItem ? opts.values[ix] : ix);
				},
			});
			$selEnum.appendTo($modalInner);
			if (opts.$elePost) opts.$elePost.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
			$selEnum.focus();
		});
	}

	/**
	 * @param opts Options.
	 * @param [opts.values] Array of values. Mutually incompatible with "valueGroups".
	 * @param [opts.valueGroups] Array of value groups (of the form `{name: "Group Name", values: [...]}`). Mutually incompatible with "values".
	 * @param [opts.title] Prompt title.
	 * @param [opts.htmlDescription] Description HTML for the modal.
	 * @param [opts.count] Number of choices the user can make (cannot be used with min/max).
	 * @param [opts.min] Minimum number of choices the user can make (cannot be used with count).
	 * @param [opts.max] Maximum number of choices the user can make (cannot be used with count).
	 * @param [opts.defaults] Array of default-selected indices.
	 * @param [opts.required] Array of always-selected indices.
	 * @param [opts.isResolveItems] True if the promise should resolve to an array of the items instead of the indices.
	 * @param [opts.fnDisplay] Function which takes a value and returns display text.
	 * @param [opts.modalOpts] Options to pass through to the underlying modal class.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise} A promise which resolves to the indices of the items the user selected, or null otherwise.
	 */
	static pGetUserMultipleChoice (opts) {
		return new Promise(resolve => {
			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));

			const prop = "formData";

			const initialState = {};
			if (opts.defaults) opts.defaults.forEach(ix => initialState[ComponentUiUtil.getMetaWrpMultipleChoice_getPropIsActive(prop, ix)] = true);
			if (opts.required) {
				opts.required.forEach(ix => {
					initialState[ComponentUiUtil.getMetaWrpMultipleChoice_getPropIsActive(prop, ix)] = true; // "requires" implies "default"
					initialState[ComponentUiUtil.getMetaWrpMultipleChoice_getPropIsRequired(prop, ix)] = true;
				});
			}

			const comp = BaseComponent.fromObject(initialState);

			let title = opts.title;
			if (!title) {
				if (opts.count != null) title = `Choose ${Parser.numberToText(opts.count).uppercaseFirst()}`;
				else if (opts.min != null && opts.max != null) title = `Choose Between ${Parser.numberToText(opts.min).uppercaseFirst()} and ${Parser.numberToText(opts.max).uppercaseFirst()} Options`;
				else if (opts.min != null) title = `Choose At Least ${Parser.numberToText(opts.min).uppercaseFirst()}`;
				else title = `Choose At Most ${Parser.numberToText(opts.max).uppercaseFirst()}`;
			}

			const {$ele: $wrpList, propIsAcceptable} = ComponentUiUtil.getMetaWrpMultipleChoice(comp, prop, opts);
			$wrpList.addClass(`mb-1`);

			const hkIsAcceptable = () => $btnOk.attr("disabled", !comp._state[propIsAcceptable]);
			comp._addHookBase(propIsAcceptable, hkIsAcceptable)
			hkIsAcceptable();

			const {$modalInner, doClose} = UiUtil.getShowModal({
				...(opts.modalOpts || {}),
				title,
				isMinHeight0: true,
				isUncappedHeight: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);

					if (!isDataEntered) return resolve(null);

					const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(comp, prop);

					if (!opts.isResolveItems) resolve(ixs);
					else if (opts.values) resolve(ixs.map(ix => opts.values[ix]));
					else if (opts.valueGroups) {
						const allValues = opts.valueGroups.map(it => it.values).flat();
						resolve(ixs.map(ix => allValues[ix]))
					}
				},
			});
			if (opts.htmlDescription) $modalInner.append(opts.htmlDescription);
			$wrpList.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right no-shrink pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
			$wrpList.focus();
		});
	}

	/**
	 * NOTE: designed to work with FontAwesome.
	 *
	 * @param opts Options.
	 * @param opts.values Array of icon metadata. Items should be of the form: `{name: "<n>", iconClass: "<c>", buttonClass: "<cs>", buttonClassActive: "<cs>"}`
	 * @param opts.title Prompt title.
	 * @param opts.default Default selected index.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise<number>} A promise which resolves to the index of the item the user selected, or null otherwise.
	 */
	static pGetUserIcon (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			let lastIx = opts.default != null ? opts.default : -1;
			const onclicks = [];

			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Select an Option",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);
					if (!isDataEntered) return resolve(null);
					return resolve(~lastIx ? lastIx : null);
				},
			});

			$$`<div class="flex flex-wrap flex-h-center mb-2">${opts.values.map((v, i) => {
				const $btn = $$`<div class="m-2 btn ${v.buttonClass || "btn-default"} ui__btn-xxl-square flex-col flex-h-center">
					${v.iconClass ? `<div class="ui-icn__wrp-icon ${v.iconClass} mb-1"></div>` : ""}
					${v.iconContent ? v.iconContent : ""}
					<div class="whitespace-normal w-100">${v.name}</div>
				</div>`
					.click(() => {
						lastIx = i;
						onclicks.forEach(it => it());
					})
					.toggleClass(v.buttonClassActive || "active", opts.default === i);
				if (v.buttonClassActive && opts.default === i) {
					$btn.removeClass("btn-default").addClass(v.buttonClassActive);
				}

				onclicks.push(() => {
					$btn.toggleClass(v.buttonClassActive || "active", lastIx === i);
					if (v.buttonClassActive) $btn.toggleClass("btn-default", lastIx !== i);
				});
				return $btn;
			})}</div>`.appendTo($modalInner);

			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));

			$$`<div class="flex-v-center flex-h-right pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
		});
	}

	/**
	 * @param [opts] Options.
	 * @param [opts.title] Prompt title.
	 * @param [opts.default] Default value.
	 * @param [opts.autocomplete] Array of autocomplete strings. REQUIRES INCLUSION OF THE TYPEAHEAD LIBRARY.
	 * @param [opts.isCode] If the text is code.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise<String>} A promise which resolves to the string if the user entered one, or null otherwise.
	 */
	static pGetUserString (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const $iptStr = $(`<input class="form-control mb-2" type="text">`)
				.val(opts.default)
				.keydown(async evt => {
					if (evt.key === "Escape") { $iptStr.blur(); return; }

					if (opts.autocomplete) {
						// prevent double-binding the return key if we have autocomplete enabled
						await MiscUtil.pDelay(17); // arbitrary delay to allow dropdown to render (~1000/60, i.e. 1 60 FPS frame)
						if ($modalInner.find(`.typeahead.dropdown-menu`).is(":visible")) return;
					}
					// return key
					if (evt.which === 13) doClose(true);
					evt.stopPropagation();
				});
			if (opts.isCode) $iptStr.addClass("code");
			if (opts.autocomplete && opts.autocomplete.length) $iptStr.typeahead({source: opts.autocomplete});
			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Enter Text",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);
					if (!isDataEntered) return resolve(null);
					const raw = $iptStr.val();
					return resolve(raw);
				},
			});
			$iptStr.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
			$iptStr.focus();
			$iptStr.select();
		});
	}

	/**
	 * @param [opts] Options.
	 * @param [opts.title] Prompt title.
	 * @param [opts.buttonText] Prompt title.
	 * @param [opts.default] Default value.
	 * @param [opts.disabled] If the text area is disabled.
	 * @param [opts.isCode] If the text is code.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise<String>} A promise which resolves to the string if the user entered one, or null otherwise.
	 */
	static pGetUserText (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const $iptStr = $(`<textarea class="form-control mb-2 resize-vertical w-100" ${opts.disabled ? "disabled" : ""}></textarea>`)
				.val(opts.default);
			if (opts.isCode) $iptStr.addClass("code");
			const $btnOk = $(`<button class="btn btn-primary mr-2">${opts.buttonText || "OK"}</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Enter Text",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);
					if (!isDataEntered) return resolve(null);
					const raw = $iptStr.val();
					if (!raw.trim()) return resolve(null);
					else return resolve(raw);
				},
			});
			$iptStr.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
			$iptStr.focus();
			$iptStr.select();
		});
	}

	/**
	 * @param opts Options.
	 * @param opts.title Prompt title.
	 * @param opts.default Default value.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise<String>} A promise which resolves to the color if the user entered one, or null otherwise.
	 */
	static pGetUserColor (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const $iptRgb = $(`<input class="form-control mb-2" ${opts.default != null ? `value="${opts.default}"` : ""} type="color">`);
			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Choose Color",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);
					if (!isDataEntered) return resolve(null);
					const raw = $iptRgb.val();
					if (!raw.trim()) return resolve(null);
					else return resolve(raw);
				},
			});
			$iptRgb.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
			$iptRgb.focus();
			$iptRgb.select();
		});
	}

	/**
	 *
	 * @param [opts] Options object.
	 * @param [opts.title] Modal title.
	 * @param [opts.default] Default angle.
	 * @param [opts.stepButtons] Array of labels for quick-set buttons, which will be evenly spread around the clock.
	 * @param [opts.step] Number of steps in the gauge (default 360; would be e.g. 12 for a "clock").
	 * @param [opts.isSkippable] If the prompt is skippable.
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

			const $arm = $(`<div class="ui-dir__arm"></div>`);
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
								zIndex: 1002,
							})
							.click(() => {
								curAngle = SEG_ANGLE * i;
								handleAngle();
							}),
					);
				}

				const $wrpInner = $$`<div class="flex-vh-center relative">${$btns}${$pad}</div>`
					.css({
						width: CONTROLS_RADIUS * 2,
						height: CONTROLS_RADIUS * 2,
					});

				return $$`<div class="flex-vh-center">${$wrpInner}</div>`
					.css({
						width: (CONTROLS_RADIUS * 2) + BTN_STEP_SIZE + BORDER_PAD,
						height: (CONTROLS_RADIUS * 2) + BTN_STEP_SIZE + BORDER_PAD,
					})
			})() : null;

			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Select Direction",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);
					$document.off(`mousemove.${evtId} touchmove${evtId} mouseup.${evtId} touchend${evtId} touchcancel${evtId}`);
					if (!isDataEntered) return resolve(null);
					if (curAngle < 0) curAngle += 360;
					return resolve(curAngle); // TODO returning the step number is more useful if step is specified?
				},
			});
			$$`<div class="flex-vh-center mb-3">
				${$padOuter || $pad}
			</div>`.appendTo($modalInner);
			$$`<div class="flex-v-center flex-h-right pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
		});
	}

	/**
	 * @param [opts] Options.
	 * @param [opts.title] Prompt title.
	 * @param [opts.default] Default values. Should be an object of the form `{num, faces, bonus}`.
	 * @param [opts.isSkippable] If the prompt is skippable.
	 * @return {Promise<String>} A promise which resolves to a dice string if the user entered values, or null otherwise.
	 */
	static pGetUserDice (opts) {
		opts = opts || {};
		return new Promise(resolve => {
			const comp = BaseComponent.fromObject({
				num: (opts.default && opts.default.num) || 1,
				faces: (opts.default && opts.default.faces) || 6,
				bonus: (opts.default && opts.default.bonus) || null,
			});

			comp.render = function ($parent) {
				$parent.empty();

				const $iptNum = ComponentUiUtil.$getIptInt(this, "num", 0, {$ele: $(`<input class="form-control input-xs form-control--minimal text-center mr-1">`)})
					.appendTo($parent)
					.keydown(evt => {
						if (evt.key === "Escape") { $iptNum.blur(); return; }
						// return key
						if (evt.which === 13) doClose(true);
						evt.stopPropagation();
					});
				const $selFaces = ComponentUiUtil.$getSelEnum(this, "faces", {values: Renderer.dice.DICE})
					.addClass("mr-2").addClass("text-center").css("textAlignLast", "center");

				const $iptBonus = $(`<input class="form-control input-xs form-control--minimal text-center">`)
					.change(() => this._state.bonus = UiUtil.strToInt($iptBonus.val(), null, {fallbackOnNaN: null}))
					.keydown(evt => {
						if (evt.key === "Escape") { $iptBonus.blur(); return; }
						// return key
						if (evt.which === 13) doClose(true);
						evt.stopPropagation();
					});
				const hook = () => $iptBonus.val(this._state.bonus != null ? UiUtil.intToBonus(this._state.bonus) : this._state.bonus);
				comp._addHookBase("bonus", hook);
				hook();

				$$`<div class="flex-vh-center">${$iptNum}<div class="mr-1">d</div>${$selFaces}${$iptBonus}</div>`.appendTo($parent);
			};

			comp.getAsString = function () {
				return `${this._state.num}d${this._state.faces}${this._state.bonus ? UiUtil.intToBonus(this._state.bonus) : ""}`;
			};

			const $btnOk = $(`<button class="btn btn-primary mr-2">OK</button>`)
				.click(() => doClose(true));
			const $btnCancel = $(`<button class="btn btn-default">Cancel</button>`)
				.click(() => doClose(false));
			const $btnSkip = !opts.isSkippable ? null : $(`<button class="btn btn-default ml-3">Skip</button>`)
				.click(() => doClose(VeCt.SYM_UI_SKIP));
			const {$modalInner, doClose} = UiUtil.getShowModal({
				title: opts.title || "Enter Dice",
				isMinHeight0: true,
				cbClose: (isDataEntered) => {
					if (typeof isDataEntered === "symbol") return resolve(isDataEntered);
					if (!isDataEntered) return resolve(null);
					return resolve(comp.getAsString());
				},
			});

			comp.render($modalInner);

			$$`<div class="flex-v-center flex-h-center pb-1 px-1">${$btnOk}${$btnCancel}${$btnSkip}</div>`.appendTo($modalInner);
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
			$(document.body).off(`mouseup.drag__stop`);
		};

		const doDragRender = () => {
			if (dragMeta.on) doDragCleanup();

			$(document.body).on(`mouseup.drag__stop`, () => {
				if (dragMeta.on) doDragCleanup();
			});

			dragMeta.on = true;
			dragMeta.$wrap = $(`<div class="flex-col ui-drag__wrp-drag-block"></div>`).appendTo(opts.$parent);
			dragMeta.$dummies = [];

			const ids = opts.componentsParent[opts.componentsProp].map(it => it.id);

			ids.forEach(id => {
				const $dummy = $(`<div class="w-100 ${id === opts.componentId ? "ui-drag__wrp-drag-dummy--highlight" : "ui-drag__wrp-drag-dummy--lowlight"}"></div>`)
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
	 * @param $fnGetRow Function which returns a $row element. Is a function instead of a value so it can be lazy-loaded later.
	 * @param opts Options object.
	 * @param opts.$parent
	 * @param opts.swapRowPositions
	 * @param [opts.$children] An array of row elements.
	 * @param [opts.$getChildren] Should return an array as described in the "$children" option.
	 */
	static $getDragPadOpts ($fnGetRow, opts) {
		if (!opts.$parent || !opts.swapRowPositions || (!opts.$children && !opts.$getChildren)) throw new Error("Missing required option(s)!");

		const dragMeta = {};
		const doDragCleanup = () => {
			dragMeta.on = false;
			dragMeta.$wrap.remove();
			dragMeta.$dummies.forEach($d => $d.remove());
			$(document.body).off(`mouseup.drag__stop`);
		};

		const doDragRender = () => {
			if (dragMeta.on) doDragCleanup();

			$(document.body).on(`mouseup.drag__stop`, () => {
				if (dragMeta.on) doDragCleanup();
			});

			dragMeta.on = true;
			dragMeta.$wrap = $(`<div class="flex-col ui-drag__wrp-drag-block"></div>`).appendTo(opts.$parent);
			dragMeta.$dummies = [];

			const $children = opts.$getChildren ? opts.$getChildren() : opts.$children;
			const ixRow = $children.indexOf($fnGetRow());

			$children.forEach(($child, i) => {
				const dimensions = {w: $child.outerWidth(true), h: $child.outerHeight(true)};
				const $dummy = $(`<div class="${i === ixRow ? "ui-drag__wrp-drag-dummy--highlight" : "ui-drag__wrp-drag-dummy--lowlight"}"></div>`)
					.width(dimensions.w).height(dimensions.h)
					.mouseup(() => {
						if (dragMeta.on) doDragCleanup();
					})
					.appendTo(dragMeta.$wrap);
				dragMeta.$dummies.push($dummy);

				if (i !== ixRow) { // on entering other areas, swap positions
					$dummy.mouseenter(() => {
						opts.swapRowPositions(i, ixRow);
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

	/**
	 * @param $fnGetRow Function which returns a $row element. Is a function instead of a value so it can be lazy-loaded later.
	 * @param $parent Parent elements to attach row elements to. Should have (e.g.) "relative" CSS positioning.
	 * @param parent Parent component which has a pod decomposable as {swapRowPositions, <$children|$getChildren>}.
	 * @return jQuery
	 */
	static $getDragPad2 ($fnGetRow, $parent, parent) {
		const {swapRowPositions, $children, $getChildren} = parent;
		const nxtOpts = {$parent, swapRowPositions, $children, $getChildren};
		return this.$getDragPadOpts($fnGetRow, nxtOpts)
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
	 * @param options.mode (Optional) Mode to build in, "select", "edit" or "add". Defaults to "select".
	 * @param options.source (Optional) Homebrew source object.
	 * @param options.isRequired (Optional) True if a source must be selected.
	 */
	static render (options) {
		options = SourceUiUtil._getValidOptions(options);
		options.$parent.empty();
		options.mode = options.mode || "select";

		const isEditMode = options.mode === "edit";

		let jsonDirty = false;
		const $iptName = $(`<input class="form-control ui-source__ipt-named">`)
			.keydown(evt => { if (evt.key === "Escape") $iptName.blur(); })
			.change(() => {
				if (!jsonDirty && !isEditMode) $iptJson.val($iptName.val().replace(/[^-_a-zA-Z]/g, ""));
				$iptName.removeClass("form-control--error");
			});
		if (options.source) $iptName.val(options.source.full);
		const $iptAbv = $(`<input class="form-control ui-source__ipt-named">`)
			.keydown(evt => { if (evt.key === "Escape") $iptAbv.blur(); })
			.change(() => {
				$iptAbv.removeClass("form-control--error");
			});
		if (options.source) $iptAbv.val(options.source.abbreviation);
		const $iptJson = $(`<input class="form-control ui-source__ipt-named" ${isEditMode ? "disabled" : ""}>`)
			.keydown(evt => { if (evt.key === "Escape") $iptJson.blur(); })
			.change(() => {
				jsonDirty = true;
				$iptJson.removeClass("form-control--error");
			});
		if (options.source) $iptJson.val(options.source.json);
		const $iptUrl = $(`<input class="form-control ui-source__ipt-named">`)
			.keydown(evt => { if (evt.key === "Escape") $iptUrl.blur(); });
		if (options.source) $iptUrl.val(options.source.url);
		const $iptAuthors = $(`<input class="form-control ui-source__ipt-named">`)
			.keydown(evt => { if (evt.key === "Escape") $iptAuthors.blur(); });
		if (options.source) $iptAuthors.val((options.source.authors || []).join(", "));
		const $iptConverters = $(`<input class="form-control ui-source__ipt-named">`)
			.keydown(evt => { if (evt.key === "Escape") $iptConverters.blur(); });
		if (options.source) $iptConverters.val((options.source.convertedBy || []).join(", "));

		const $btnOk = $(`<button class="btn btn-primary">OK</button>`)
			.click(() => {
				let incomplete = false;
				[$iptName, $iptAbv, $iptJson].forEach($ipt => {
					const val = $ipt.val();
					if (!val || !val.trim()) (incomplete = true) && $ipt.addClass("form-control--error");
				});
				if (incomplete) return;

				const jsonVal = $iptJson.val().trim();
				if (!isEditMode && BrewUtil.hasSourceJson(jsonVal)) {
					$iptJson.addClass("form-control--error");
					JqueryUtil.doToast({content: `The JSON identifier "${jsonVal}" already exists!`, type: "danger"});
					return;
				}

				const source = {
					json: jsonVal,
					abbreviation: $iptAbv.val().trim(),
					full: $iptName.val().trim(),
					url: $iptUrl.val().trim(),
					authors: $iptAuthors.val().trim().split(",").map(it => it.trim()).filter(Boolean),
					convertedBy: $iptConverters.val().trim().split(",").map(it => it.trim()).filter(Boolean),
				};

				options.cbConfirm(source, options.mode !== "edit");
			});

		const $btnCancel = options.isRequired && !isEditMode
			? null
			: $(`<button class="btn btn-default ml-2">Cancel</button>`).click(() => options.cbCancel());

		const $btnUseExisting = $(`<button class="btn btn-default">Use an Existing Source</button>`)
			.click(() => {
				$stageInitial.hide();
				$stageExisting.show();

				// cleanup
				[$iptName, $iptAbv, $iptJson].forEach($ipt => $ipt.removeClass("form-control--error"));
			});

		const $stageInitial = $$`<div class="h-100 w-100 flex-vh-center"><div>
			<h3 class="text-center">${isEditMode ? "Edit Homebrew Source" : "Add a Homebrew Source"}</h3>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="The name or title for the homebrew you wish to create. This could be the name of a book or PDF; for example, 'Bestiary 1'">Title</span>
				${$iptName}
			</div></div>
			<div class="row ui-source__row mb-2"><div class="col-12 flex-v-center">
				<span class="mr-2 ui-source__name help" title="An abbreviated form of the title. This will be shown in lists on the site, and in the top-right corner of statblocks or data entries; for example, 'B1'">Abbreviation</span>
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
				<span class="mr-2 ui-source__name help" title="A comma-separated list of people who converted the homebrew to Pf2eTools' format, e.g. 'John Doe, Joe Bloggs'">Converted By</span>
				${$iptConverters}
			</div></div>
			<div class="text-center mb-2">${$btnOk}${$btnCancel}</div>

			${!isEditMode && BrewUtil.homebrewMeta.sources && BrewUtil.homebrewMeta.sources.length ? $$`<div class="flex-vh-center mb-3 mt-3"><span class="ui-source__divider"></span>or<span class="ui-source__divider"></span></div>
			<div class="flex-vh-center">${$btnUseExisting}</div>` : ""}
		</div></div>`.appendTo(options.$parent);

		const $selExisting = $$`<select class="form-control input-sm">
			<option disabled>Select</option>
			${(BrewUtil.homebrewMeta.sources || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full)).map(s => `<option value="${s.json.escapeQuotes()}">${s.full.escapeQuotes()}</option>`)}
		</select>`.change(() => $selExisting.removeClass("form-control--error"));
		$selExisting[0].selectedIndex = 0;

		const $btnConfirmExisting = $(`<button class="btn btn-default btn-sm">Confirm</button>`)
			.click(() => {
				if ($selExisting[0].selectedIndex !== 0) {
					const sourceJson = $selExisting.val();
					const source = BrewUtil.sourceJsonToSource(sourceJson);
					options.cbConfirmExisting(source);

					// cleanup
					$selExisting[0].selectedIndex = 0;
					$stageExisting.hide();
					$stageInitial.show();
				} else $selExisting.addClass("form-control--error");
			});

		const $btnBackExisting = $(`<button class="btn btn-default btn-sm mr-2">Back</button>`)
			.click(() => {
				$selExisting[0].selectedIndex = 0;
				$stageExisting.hide();
				$stageInitial.show();
			});

		const $stageExisting = $$`<div class="h-100 w-100 flex-vh-center" style="display: none;"><div>
			<h3 class="text-center">Select a Homebrew Source</h3>
			<div class="row mb-2"><div class="col-12 flex-vh-center">${$selExisting}</div></div>
			<div class="row"><div class="col-12 flex-vh-center">${$btnBackExisting}${$btnConfirmExisting}</div></div>
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

	_setState (toState) {
		this._proxyAssign("state", "_state", "__state", toState, true);
	}

	_getState () { return MiscUtil.copy(this.__state) }

	getPod () {
		this.__pod = this.__pod || {
			get: (prop) => this._state[prop],
			set: (prop, val) => this._state[prop] = val,
			delete: (prop) => delete this._state[prop],
			addHook: (prop, hook) => this._addHookBase(prop, hook),
			addHookAll: (hook) => this._addHookAll("state", hook),
			removeHook: (prop, hook) => this._removeHookBase(prop, hook),
			triggerCollectionUpdate: (prop) => this._triggerCollectionUpdate(prop),
			setState: (state) => this._setState(state),
			getState: () => this._getState(),
			assign: (toObj, isOverwrite) => this._proxyAssign("state", "_state", "__state", toObj, isOverwrite),
			pLock: lockName => this._pLock(lockName),
			unlock: lockName => this._unlock(lockName),
			component: this,
		};
		return this.__pod;
	}

	// to be overridden as required
	_getDefaultState () { return {}; }

	getBaseSaveableState () {
		return {
			state: MiscUtil.copy(this.__state),
		};
	}

	setBaseSaveableStateFrom (toLoad) {
		toLoad.state && Object.assign(this._state, toLoad.state);
	}

	/**
	 * @param opts Options object.
	 * @param opts.prop The state property.
	 * @param [opts.namespace] The render namespace.
	 */
	_getRenderedCollection (opts) {
		opts = opts || {};
		const renderedLookupProp = opts.namespace ? `${opts.namespace}.${opts.prop}` : opts.prop;
		return (this.__rendered[renderedLookupProp] = this.__rendered[renderedLookupProp] || {});
	}

	/**
	 * Asynchronous version available below.
	 * @param opts Options object.
	 * @param opts.prop The state property.
	 * @param [opts.fnDeleteExisting] Function to run on deleted render meta. Arguments are `rendered, item`.
	 * @param opts.fnUpdateExisting Function to run on existing render meta. Arguments are `rendered, item`.
	 * @param opts.fnGetNew Function to run which generates existing render meta. Arguments are `item`.
	 * @param [opts.isDiffMode] If a diff of the state should be taken/checked before updating renders.
	 * @param [opts.namespace] A namespace to store these renders under. Useful if multiple renders are being made from
	 *        the same collection.
	 */
	_renderCollection (opts) {
		opts = opts || {};

		const rendered = this._getRenderedCollection(opts);
		const toDelete = new Set(Object.keys(rendered));

		(this._state[opts.prop] || []).forEach((it, i) => {
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
				opts.fnUpdateExisting(meta, it, i);
			} else {
				const meta = opts.fnGetNew(it, i);

				// If the "get new" function returns null, skip rendering this entity
				if (meta == null) return;

				meta.data = it;
				if (!meta.$wrpRow) throw new Error(`A "$wrpRow" property is required in order for deletes!`);

				if (opts.isDiffMode) meta.hash = CryptUtil.md5(JSON.stringify(it));

				rendered[it.id] = meta;
			}
		});

		toDelete.forEach(id => {
			const meta = rendered[id];
			meta.$wrpRow.remove();
			delete rendered[id];
			if (opts.fnDeleteExisting) opts.fnDeleteExisting(meta);
		});
	}

	/**
	 * Synchronous version available above.
	 * @param [opts] Options object.
	 * @param opts.prop The state property.
	 * @param [opts.pFnDeleteExisting] Function to run on deleted render meta. Arguments are `rendered, item`.
	 * @param opts.pFnUpdateExisting Function to run on existing render meta. Arguments are `rendered, item`.
	 * @param opts.pFnGetNew Function to run which generates existing render meta. Arguments are `item`.
	 * @param [opts.isDiffMode] If updates should be run in "diff" mode (i.e. no update is run if nothing has changed).
	 * @param [opts.isMultiRender] If multiple renders will be produced.
	 * @param [opts.additionalCaches] Additional cache objects to be cleared on entity delete. Should be objects with
	 *        entity IDs as keys.
	 * @param [opts.namespace] A namespace to store these renders under. Useful if multiple renders are being made from
	 *        the same collection.
	 */
	async _pRenderCollection (opts) {
		opts = opts || {};

		const rendered = this._getRenderedCollection(opts);
		const entities = this._state[opts.prop];
		return this._pRenderCollection_doRender(rendered, entities, opts);
	}

	async _pRenderCollection_doRender (rendered, entities, opts) {
		opts = opts || {};

		const toDelete = new Set(Object.keys(rendered));

		// Run the external functions in serial, to prevent element re-ordering
		for (let i = 0; i < entities.length; ++i) {
			const it = entities[i];

			if (!it.id) throw new Error(`Collection item did not have an ID!`);
			// N.B.: Meta can be an array, if one item maps to multiple renders (e.g. the same is shown in two places)
			const meta = rendered[it.id];

			toDelete.delete(it.id);
			if (meta) {
				if (opts.isDiffMode) {
					// Hashing the stringified JSON relies on the property order remaining consistent, but this is fine
					const nxtHash = CryptUtil.md5(JSON.stringify(it));
					if (nxtHash !== meta.__hash) meta.__hash = nxtHash;
					else continue;
				}

				const nxtMeta = await opts.pFnUpdateExisting(meta, it);
				// Overwrite the existing renders in multi-render mode
				//    Otherwise, just ignore the result--single renders never modify their render
				if (opts.isMultiRender) rendered[it.id] = nxtMeta;
			} else {
				const meta = await opts.pFnGetNew(it);
				// If the generator decides there's nothing to render, skip this item
				if (meta == null) continue;

				if (opts.isMultiRender && meta.some(it => !it.$wrpRow)) throw new Error(`A "$wrpRow" property is required in order for deletes!`);
				if (!opts.isMultiRender && !meta.$wrpRow) throw new Error(`A "$wrpRow" property is required in order for deletes!`);

				if (opts.isDiffMode) meta.__hash = CryptUtil.md5(JSON.stringify(it));

				rendered[it.id] = meta;
			}
		}

		for (const id of toDelete) {
			const meta = rendered[id];
			if (opts.isMultiRender) meta.forEach(it => it.$wrpRow.remove());
			else meta.$wrpRow.remove();
			if (opts.additionalCaches) opts.additionalCaches.forEach(it => delete it[id]);
			delete rendered[id];
			if (opts.pFnDeleteExisting) await opts.pFnDeleteExisting(meta);
		}
	}

	/**
	 * Detach (and thus preserve) rendered collection elements so they can be re-used later.
	 * @param prop The state property.
	 * @param [namespace] A namespace to store these renders under. Useful if multiple renders are being made from
	 *        the same collection.
	 */
	_detachCollection (prop, namespace = null) {
		const renderedLookupProp = namespace ? `${namespace}.${prop}` : prop;
		const rendered = (this.__rendered[renderedLookupProp] = this.__rendered[renderedLookupProp] || {});
		Object.values(rendered).forEach(it => it.$wrpRow.detach());
	}

	/**
	 * Wipe any rendered collection elements, and reset the render cache.
	 * @param prop The state property.
	 * @param [namespace] A namespace to store these renders under. Useful if multiple renders are being made from
	 *        the same collection.
	 */
	_resetCollectionRenders (prop, namespace = null) {
		const renderedLookupProp = namespace ? `${namespace}.${prop}` : prop;
		const rendered = (this.__rendered[renderedLookupProp] = this.__rendered[renderedLookupProp] || {});
		Object.values(rendered).forEach(it => it.$wrpRow.remove());
		delete this.__rendered[renderedLookupProp];
	}

	render () { throw new Error("Unimplemented!"); }

	// to be overridden as required
	getSaveableState () { return {...this.getBaseSaveableState()}; }
	setStateFrom (toLoad) { this.setBaseSaveableStateFrom(toLoad); }

	async _pLock (lockName) {
		while (this.__locks[lockName]) await this.__locks[lockName].lock;
		let unlock = null;
		const lock = new Promise(resolve => unlock = resolve);
		this.__locks[lockName] = {
			lock,
			unlock,
		}
	}

	_unlock (lockName) {
		const lockMeta = this.__locks[lockName];
		if (lockMeta) {
			delete this.__locks[lockName];
			lockMeta.unlock();
		}
	}

	_triggerCollectionUpdate (prop) {
		if (!this._state[prop]) return;
		this._state[prop] = [...this._state[prop]];
	}

	static _toCollection (array) {
		if (array) return array.map(it => ({id: CryptUtil.uid(), entity: it}));
	}

	static _fromCollection (array) {
		if (array) return array.map(it => it.entity);
	}

	static fromObject (obj, ...noModCollections) {
		const comp = new this();
		Object.entries(MiscUtil.copy(obj)).forEach(([k, v]) => {
			if (v == null) comp.__state[k] = v;
			else if (noModCollections.includes(k)) comp.__state[k] = v;
			else if (typeof v === "object" && v instanceof Array) comp.__state[k] = BaseComponent._toCollection(v);
			else comp.__state[k] = v;
		});
		return comp;
	}

	static fromObjectNoMod (obj) { return this.fromObject(obj, ...Object.keys(obj)); }

	toObject () {
		const cpy = MiscUtil.copy(this.__state);
		Object.entries(cpy).forEach(([k, v]) => {
			if (v != null && v instanceof Array && v.every(it => it && it.id)) cpy[k] = BaseComponent._fromCollection(v);
		});
		return cpy;
	}
}

/**
 * A "layer" of state which is applied over the base state.
 *  This allows e.g. a temporary stat reduction to modify a statblock, without actually
 *  modifying the underlying component.
 */
class CompLayer extends ProxyBase {
	constructor (component, layerName, data) {
		super();

		this._name = layerName;
		this.__data = data;

		this.data = this._getProxy("data", this.__data);

		this._addHookAll("data", prop => component.updateLayersActive(prop));
	}

	getSaveableState () {
		return {
			name: this._name,
			data: MiscUtil.copy(this.__data),
		}
	}

	static fromSavedState (component, savedState) { return new CompLayer(component, savedState.name, savedState.data); }
}

const MixinComponentHistory = compClass => class extends compClass {
	constructor () {
		super(...arguments);
		this._histStackUndo = [];
		this._histStackRedo = [];
		this._isHistDisabled = true;
		this._histPropBlacklist = new Set();
		this._histPropWhitelist = null;

		this._histInitialState = null;
	}

	set isHistDisabled (val) { this._isHistDisabled = val; }
	addBlacklistProps (...props) { props.forEach(p => this._histPropBlacklist.add(p)); }
	addWhitelistProps (...props) {
		this._histPropWhitelist = this._histPropWhitelist || new Set();
		props.forEach(p => this._histPropWhitelist.add(p));
	}

	/**
	 * This should be initialised after all other hooks have been added
	 */
	initHistory () {
		// Track the initial state, and watch for further modifications
		this._histInitialState = MiscUtil.copy(this._state);
		this._isHistDisabled = false;

		this._addHookAll("state", prop => {
			if (this._isHistDisabled) return;
			if (this._histPropBlacklist.has(prop)) return;
			if (this._histPropWhitelist && !this._histPropWhitelist.has(prop)) return;

			this.recordHistory();
		});
	}

	recordHistory () {
		const stateCopy = MiscUtil.copy(this._state);

		// remove any un-tracked properties
		this._histPropBlacklist.forEach(prop => delete stateCopy[prop]);
		if (this._histPropWhitelist) Object.keys(stateCopy).filter(k => !this._histPropWhitelist.has(k)).forEach(k => delete stateCopy[k]);

		this._histStackUndo.push(stateCopy);
		this._histStackRedo = [];
	}

	_histAddExcludedProperties (stateCopy) {
		Object.entries(this._state).forEach(([k, v]) => {
			if (this._histPropBlacklist.has(k)) return stateCopy[k] = v;
			if (this._histPropWhitelist && !this._histPropWhitelist.has(k)) stateCopy[k] = v
		});
	}

	undo () {
		if (this._histStackUndo.length) {
			const lastHistDisabled = this._isHistDisabled;
			this._isHistDisabled = true;

			const curState = this._histStackUndo.pop();
			this._histStackRedo.push(curState);
			const toApply = MiscUtil.copy(this._histStackUndo.last() || this._histInitialState);
			this._histAddExcludedProperties(toApply);
			this._setState(toApply);

			this._isHistDisabled = lastHistDisabled;
		} else {
			const lastHistDisabled = this._isHistDisabled;
			this._isHistDisabled = true;

			const toApply = MiscUtil.copy(this._histInitialState);
			this._histAddExcludedProperties(toApply);
			this._setState(toApply);

			this._isHistDisabled = lastHistDisabled;
		}
	}

	redo () {
		if (!this._histStackRedo.length) return;

		const lastHistDisabled = this._isHistDisabled;
		this._isHistDisabled = true;

		const toApplyRaw = this._histStackRedo.pop();
		this._histStackUndo.push(toApplyRaw);
		const toApply = MiscUtil.copy(toApplyRaw);
		this._histAddExcludedProperties(toApply);
		this._setState(toApply);

		this._isHistDisabled = lastHistDisabled;
	}
};

class ComponentUiUtil {
	static trackHook (hooks, prop, hook) {
		hooks[prop] = hooks[prop] || [];
		hooks[prop].push(hook);
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [fallbackEmpty] Fallback number if string is empty.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.html] HTML to convert to element to use.
	 * @param [opts.max] Max allowed return value.
	 * @param [opts.min] Min allowed return value.
	 * @param [opts.offset] Offset to add to value displayed.
	 * @param [opts.padLength] Number of digits to pad the number to.
	 * @param [opts.fallbackOnNaN] Return value if not a number.
	 * @param [opts.isAllowNull] If an empty input should be treated as null.
	 * @param [opts.asMeta] If a meta-object should be returned containing the hook and the checkbox.
	 * @param [opts.hookTracker] Object in which to track hook.
	 * @param [opts.decorationLeft] Decoration to be added to the left-hand-side of the input. Can be `"ticker"` or `"clear"`. REQUIRES `asMeta` TO BE SET.
	 * @param [opts.decorationRight] Decoration to be added to the right-hand-side of the input. Can be `"ticker"` or `"clear"`. REQUIRES `asMeta` TO BE SET.
	 * @return {JQuery}
	 */
	static $getIptInt (component, prop, fallbackEmpty = 0, opts) {
		return ComponentUiUtil._$getIptNumeric(component, prop, UiUtil.strToInt, fallbackEmpty, opts);
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [fallbackEmpty] Fallback number if string is empty.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.html] HTML to convert to element to use.
	 * @param [opts.max] Max allowed return value.
	 * @param [opts.min] Min allowed return value.
	 * @param [opts.offset] Offset to add to value displayed.
	 * @param [opts.padLength] Number of digits to pad the number to.
	 * @param [opts.fallbackOnNaN] Return value if not a number.
	 * @param [opts.isAllowNull] If an empty input should be treated as null.
	 * @param [opts.asMeta] If a meta-object should be returned containing the hook and the checkbox.
	 * @param [opts.decorationLeft] Decoration to be added to the left-hand-side of the input. Can be `"ticker"` or `"clear"`. REQUIRES `asMeta` TO BE SET.
	 * @param [opts.decorationRight] Decoration to be added to the right-hand-side of the input. Can be `"ticker"` or `"clear"`. REQUIRES `asMeta` TO BE SET.
	 * @return {JQuery}
	 */
	static $getIptNumber (component, prop, fallbackEmpty = 0, opts) {
		return ComponentUiUtil._$getIptNumeric(component, prop, UiUtil.strToNumber, fallbackEmpty, opts);
	}

	static _$getIptNumeric (component, prop, fnConvert, fallbackEmpty = 0, opts) {
		opts = opts || {};
		opts.offset = opts.offset || 0;

		const $ipt = (opts.$ele || $(opts.html || `<input class="form-control input-xs form-control--minimal text-right">`)).disableSpellcheck()
			.keydown(evt => {
				if (evt.key === "Escape") $ipt.blur();
			})
			.change(() => {
				const raw = $ipt.val().trim();

				if (opts.isAllowNull && !raw) return component._state[prop] = null;

				if (raw.startsWith("=")) {
					// if it starts with "=", force-set to the value provided
					component._state[prop] = fnConvert(raw.slice(1), fallbackEmpty, opts) - opts.offset;
				} else {
					// otherwise, try to modify the previous value
					const mUnary = /^[-+/*^]/.exec(raw);
					if (mUnary) {
						const cur = component._state[prop];
						let proc = raw;
						proc = proc.slice(1).trim();
						const mod = fnConvert(proc, fallbackEmpty, opts);
						const full = `${cur}${mUnary[0]}${mod}`;
						component._state[prop] = fnConvert(full, fallbackEmpty, opts) - opts.offset;
					} else {
						component._state[prop] = fnConvert(raw, fallbackEmpty, opts) - opts.offset;
					}
				}
			});
		const hook = () => {
			if (opts.isAllowNull && component._state[prop] == null) {
				return $ipt.val(null);
			}
			const num = (component._state[prop] || 0) + opts.offset;
			$ipt.val(opts.padLength ? `${num}`.padStart(opts.padLength, "0") : num)
		};
		if (opts.hookTracker) ComponentUiUtil.trackHook(opts.hookTracker, prop, hook);
		component._addHookBase(prop, hook);
		hook();

		if (opts.asMeta) return this._getIptDecoratedMeta(component, prop, $ipt, hook, opts);
		else return $ipt;
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param [opts] Options Object.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.html] HTML to convert to element to use.
	 * @param [opts.isNoTrim] If the text should not be trimmed.
	 * @param [opts.isAllowNull] If null should be allowed (and preferred) for empty inputs
	 * @param [opts.asMeta] If a meta-object should be returned containing the hook and the checkbox.
	 * @param [opts.autocomplete] Array of autocomplete strings. REQUIRES INCLUSION OF THE TYPEAHEAD LIBRARY.
	 * @param [opts.decorationLeft] Decoration to be added to the left-hand-side of the input. Can be `"search"` or `"clear"`. REQUIRES `asMeta` TO BE SET.
	 * @param [opts.decorationRight] Decoration to be added to the right-hand-side of the input. Can be `"search"` or `"clear"`. REQUIRES `asMeta` TO BE SET.
	 */
	static $getIptStr (component, prop, opts) {
		opts = opts || {};

		// Validate options
		if ((opts.decorationLeft || opts.decorationRight) && !opts.asMeta) throw new Error(`Input must be created with "asMeta" option`);

		const $ipt = (opts.$ele || $(opts.html || `<input class="form-control input-xs form-control--minimal">`))
			.keydown(evt => { if (evt.key === "Escape") $ipt.blur(); })
			.disableSpellcheck();
		UiUtil.bindTypingEnd({
			$ipt,
			fnKeyup: () => {
				const nxtVal = opts.isNoTrim ? $ipt.val() : $ipt.val().trim();
				component._state[prop] = opts.isAllowNull && !nxtVal ? null : nxtVal;
			},
		});

		if (opts.autocomplete && opts.autocomplete.length) $ipt.typeahead({source: opts.autocomplete});
		const hook = () => {
			if (component._state[prop] == null) $ipt.val(null);
			else {
				// If the only difference is start/end whitespace, leave it; otherwise, adding spaces is frustrating
				if ($ipt.val().trim() !== component._state[prop]) $ipt.val(component._state[prop]);
			}
		};
		component._addHookBase(prop, hook);
		hook();

		if (opts.asMeta) return this._getIptDecoratedMeta(component, prop, $ipt, hook, opts);
		else return $ipt;
	}

	// FIXME: Temporary workaround
	static $getIptStr2 (component, prop, opts) {
		opts = opts || {};

		// Validate options
		if ((opts.decorationLeft || opts.decorationRight) && !opts.asMeta) throw new Error(`Input must be created with "asMeta" option`);

		const $ipt = (opts.$ele || $(opts.html || `<input class="form-control input-xs form-control--minimal">`))
			.keydown(evt => {
				try {
					if (evt.key === "Escape") $ipt.blur();
				} catch (e) {
					// $ipt was removed?
				}
			})
			.disableSpellcheck()
			.change(() => {
				const nxtVal = opts.isNoTrim ? $ipt.val() : $ipt.val().trim();
				component._state[prop] = opts.isAllowNull && !nxtVal ? null : nxtVal;
			});

		if (opts.autocomplete && opts.autocomplete.length) $ipt.typeahead({source: opts.autocomplete});
		const hook = () => {
			if (component._state[prop] == null) $ipt.val(null);
			else {
				// If the only difference is start/end whitespace, leave it; otherwise, adding spaces is frustrating
				if ($ipt.val().trim() !== component._state[prop]) $ipt.val(component._state[prop]);
			}
		};
		component._addHookBase(prop, hook);
		hook();

		if (opts.asMeta) return this._getIptDecoratedMeta(component, prop, $ipt, hook, opts);
		else return $ipt;
	}

	static _getIptDecoratedMeta (component, prop, $ipt, hook, opts) {
		const out = {$ipt, unhook: () => component._removeHookBase(prop, hook)};

		if (opts.decorationLeft || opts.decorationRight) {
			let $decorLeft;
			let $decorRight;

			if (opts.decorationLeft) {
				$ipt.addClass(`ui-ideco__ipt ui-ideco__ipt--left`);
				$decorLeft = ComponentUiUtil._$getDecor(component, prop, $ipt, opts.decorationLeft, "left", opts);
			}

			if (opts.decorationRight) {
				$ipt.addClass(`ui-ideco__ipt ui-ideco__ipt--right`);
				$decorRight = ComponentUiUtil._$getDecor(component, prop, $ipt, opts.decorationRight, "right", opts);
			}

			out.$wrp = $$`<div class="relative w-100">${$ipt}${$decorLeft}${$decorRight}</div>`
		}

		return out;
	}

	static _$getDecor (component, prop, $ipt, decorType, side, opts) {
		switch (decorType) {
			case "search": {
				return $(`<div class="ui-ideco__wrp ui-ideco__wrp--${side} no-events flex-vh-center"><span class="glyphicon glyphicon-search" type="submit"></span></div>`);
			}
			case "clear": {
				return $(`<div class="ui-ideco__wrp ui-ideco__wrp--${side} flex-vh-center clickable" title="Clear"><span class="glyphicon glyphicon-remove"></span></div>`)
					.click(() => $ipt.val("").change().keydown().keyup());
			}
			case "ticker": {
				const isValidValue = val => {
					if (opts.max != null && val > opts.max) return false;
					if (opts.min != null && val < opts.min) return false;
					return true;
				};

				const handleClick = (delta) => {
					// TODO(future) this should be run first to evaluate any lingering expressions in the input, but it
					//  breaks when the number is negative, as we need to add a "=" to the front of the input before
					//  evaluating
					// $ipt.change();
					const nxt = component._state[prop] + delta;
					if (!isValidValue(nxt)) return;
					component._state[prop] = nxt;
					$ipt.focus();
				};

				const $btnUp = $(`<button class="btn btn-default ui-ideco__btn-ticker bold no-select">+</button>`)
					.click(() => handleClick(1));

				const $btnDown = $(`<button class="btn btn-default ui-ideco__btn-ticker bold no-select">\u2012</button>`)
					.click(() => handleClick(-1));

				return $$`<div class="ui-ideco__wrp ui-ideco__wrp--${side} flex-vh-center flex-col">
					${$btnUp}
					${$btnDown}
				</div>`;
			}
			case "spacer": {
				return "";
			}
			default: throw new Error(`Unimplemented!`);
		}
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

		const $ipt = (opts.$ele || $(`<textarea class="form-control input-xs form-control--minimal resize-vertical"></textarea>`))
			.keydown(evt => { if (evt.key === "Escape") $ipt.blur(); })
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

		const $ipt = (opts.$ele || $(`<input class="form-control input-xs form-control--minimal ui__ipt-color" type="color">`))
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
	 * @param [opts.html] HTML to convert to element to use.
	 * @param [opts.text] Button text, if element is not specified.
	 * @param [opts.fnHookPost] Function to run after primary hook.
	 * @param [opts.stateName] State name.
	 * @param [opts.stateProp] State prop.
	 * @param [opts.isInverted] If the toggle display should be inverted.
	 * @param [opts.activeClass] CSS class to use when setting the button as "active."
	 * @param [opts.activeTitle] Title to use when setting the button as "active."
	 * @param [opts.inactiveTitle] Title to use when setting the button as "active."
	 * @param [opts.activeText] Text to use when setting the button as "active."
	 * @param [opts.inactiveText] Text to use when setting the button as "active."
	 * @return {JQuery}
	 */
	static $getBtnBool (component, prop, opts) {
		opts = opts || {};

		if (opts.html) opts.$ele = $(opts.html);

		const activeClass = opts.activeClass || "active";
		const stateName = opts.stateName || "state";
		const stateProp = opts.stateProp || "_state";

		const $btn = (opts.$ele || $(`<button class="btn btn-xs btn-default">${opts.text || "Toggle"}</button>`))
			.click(() => component[stateProp][prop] = !component[stateProp][prop])
			.contextmenu(evt => {
				evt.preventDefault();
				component[stateProp][prop] = !component[stateProp][prop];
			});
		const hook = () => {
			$btn.toggleClass(activeClass, opts.isInverted ? !component[stateProp][prop] : !!component[stateProp][prop]);
			if (opts.activeTitle || opts.inactiveTitle) $btn.title(component[stateProp][prop] ? (opts.activeTitle || "") : (opts.inactiveTitle || ""));
			if (opts.activeText || opts.inactiveText) $btn.text(component[stateProp][prop] ? (opts.activeText || "Toggle") : (opts.inactiveText || "Toggle"));
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
	 * @param [opts.asMeta] If a meta-object should be returned containing the hook and the input.
	 * @return {JQuery}
	 */
	static $getCbBool (component, prop, opts) {
		opts = opts || {};

		const $cb = (opts.$ele || $(`<input type="checkbox">`))
			.keydown(evt => {
				if (evt.key === "Escape") $cb.blur();
			})
			.change(() => component._state[prop] = $cb.prop("checked"));
		const hook = () => $cb.prop("checked", !!component._state[prop]);
		component._addHookBase(prop, hook);
		hook();

		return opts.asMeta ? ({$cb, unhook: () => component._removeHookBase(prop, hook)}) : $cb;
	}

	/**
	 * A select2-style dropdown.
	 * @param comp An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param opts Options Object.
	 * @param opts.values Values to display.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.html] HTML to convert to element to use.
	 * @param [opts.isAllowNull] If null is allowed.
	 * @param [opts.fnDisplay] Value display function.
	 * @param [opts.displayNullAs] If null values are allowed, display them as this string.
	 * @param [opts.asMeta] If a meta-object should be returned containing the hook and the select.
	 * @return {JQuery}
	 */
	static $getSelSearchable (comp, prop, opts) {
		opts = opts || {};

		const $iptDisplay = (opts.$ele || $(opts.html || `<input class="form-control input-xs form-control--minimal">`))
			.addClass("ui-sel2__ipt-display pr-1")
			.attr("tabindex", "-1")
			.click(() => $iptSearch.focus().select())
			.disableSpellcheck();

		const handleSearchChange = () => {
			const cleanTerm = this._$getSelSearchable_getSearchString($iptSearch.val());
			metaOptions.forEach(it => {
				it.isVisible = it.searchTerm.includes(cleanTerm);
				it.$ele.toggleVe(it.isVisible);
			});
		};
		const handleSearchChangeDebounced = MiscUtil.debounce(handleSearchChange, 30);

		const $iptSearch = (opts.$ele || $(opts.html || `<input class="form-control input-xs form-control--minimal">`))
			.addClass("absolute ui-sel2__ipt-search")
			.keydown(evt => {
				switch (evt.key) {
					case "Escape": evt.stopPropagation(); return $iptSearch.blur();

					case "ArrowDown": {
						evt.preventDefault();
						const visibleMetaOptions = metaOptions.filter(it => it.isVisible);
						if (!visibleMetaOptions.length) return;
						visibleMetaOptions[0].$ele.focus();
						break;
					}

					case "Enter": {
						const visibleMetaOptions = metaOptions.filter(it => it.isVisible);
						if (!visibleMetaOptions.length) return;
						comp._state[prop] = visibleMetaOptions[0].value;
						break;
					}

					default: handleSearchChangeDebounced();
				}
			})
			.change(() => handleSearchChangeDebounced())
			.click(() => $iptSearch.focus().select())
			.disableSpellcheck();

		const $wrpChoices = $(`<div class="absolute ui-sel2__wrp-options overflow-y-scroll"></div>`);

		const $wrp = $$`<div class="flex relative ui-sel2__wrp w-100">
			${$iptDisplay}
			${$iptSearch}
			${$wrpChoices}
		</div>`;

		const procValues = opts.isAllowNull ? [null, ...opts.values] : opts.values;
		const metaOptions = procValues.map((v, i) => {
			const display = v == null ? (opts.displayNullAs || "\u2014") : opts.fnDisplay ? opts.fnDisplay(v) : v;

			const $ele = $(`<div class="flex-v-center py-1 px-1 clickable ui-sel2__disp-option ${v == null ? `italic` : ""}" tabindex="${i}">${display}</div>`)
				.click(() => {
					comp._state[prop] = v;
					$(document.activeElement).blur();
				})
				.keydown(evt => {
					switch (evt.key) {
						case "Escape": evt.stopPropagation(); return $ele.blur();

						case "ArrowDown": {
							evt.preventDefault();
							const visibleMetaOptions = metaOptions.filter(it => it.isVisible);
							if (!visibleMetaOptions.length) return;
							const ixCur = visibleMetaOptions.indexOf(out);
							const nxt = visibleMetaOptions[ixCur + 1];
							if (nxt) nxt.$ele.focus();
							break;
						}

						case "ArrowUp": {
							evt.preventDefault();
							const visibleMetaOptions = metaOptions.filter(it => it.isVisible);
							if (!visibleMetaOptions.length) return;
							const ixCur = visibleMetaOptions.indexOf(out);
							const prev = visibleMetaOptions[ixCur - 1];
							if (prev) return prev.$ele.focus();
							$iptSearch.focus();
							break;
						}

						case "Enter": {
							comp._state[prop] = v;
							$iptSearch.focus();
							break;
						}
					}
				})
				.appendTo($wrpChoices);

			const out = {
				value: v,
				isVisible: true,
				searchTerm: this._$getSelSearchable_getSearchString(display),
				$ele,
			};
			return out;
		});

		const hk = () => {
			if (comp._state[prop] == null) $iptDisplay.addClass("italic").val(opts.displayNullAs || "\u2014");
			else $iptDisplay.removeClass("italic").val(opts.fnDisplay ? opts.fnDisplay(comp._state[prop]) : comp._state[prop]);

			metaOptions.forEach(it => it.$ele.removeClass("active"))
			const metaActive = metaOptions.find(it => it.value == null ? comp._state[prop] == null : it.value === comp._state[prop]);
			if (metaActive) metaActive.$ele.addClass("active");
		};
		comp._addHookBase(prop, hk);
		hk();

		return opts.asMeta ? ({$wrp, unhook: () => comp._removeHookBase(prop, hk)}) : $wrp;
	}

	static _$getSelSearchable_getSearchString (str) {
		if (str == null) return "";
		return str.trim().toLowerCase().replace(/\s+/g, " ");
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param opts Options Object.
	 * @param opts.values Values to display.
	 * @param [opts.$ele] Element to use.
	 * @param [opts.html] HTML to convert to element to use.
	 * @param [opts.isAllowNull] If null is allowed.
	 * @param [opts.fnDisplay] Value display function.
	 * @param [opts.displayNullAs] If null values are allowed, display them as this string.
	 * @param [opts.asMeta] If a meta-object should be returned containing the hook and the select.
	 * @return {JQuery}
	 */
	static $getSelEnum (component, prop, opts) {
		opts = opts || {};

		const $sel = (opts.$ele || $(opts.html || `<select class="form-control input-xs"></select>`))
			.change(() => {
				const ix = Number($sel.val());
				if (~ix) component._state[prop] = opts.values[ix];
				else {
					if (opts.isAllowNull) component._state[prop] = null;
					else component._state[prop] = opts.values[0];
				}
			});
		if (opts.isAllowNull) $(`<option/>`, {value: -1, text: opts.displayNullAs || "\u2014"}).appendTo($sel);
		opts.values.forEach((it, i) => $(`<option/>`, {value: i, text: opts.fnDisplay ? opts.fnDisplay(it) : it}).appendTo($sel));
		const hook = () => {
			const searchFor = component._state[prop] === undefined ? null : component._state[prop];
			// Null handling is done in change handler
			const ix = opts.values.indexOf(searchFor);
			$sel.val(`${ix}`);
		};
		component._addHookBase(prop, hook);
		hook();
		return opts.asMeta ? ({$sel, unhook: () => component._removeHookBase(prop, hook)}) : $sel;
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param opts Options Object.
	 * @param opts.values Values to display.
	 * @param [opts.fnDisplay] Value display function.
	 * @return {JQuery}
	 */
	static $getPickEnum (component, prop, opts) {
		opts = opts || {};

		const initialVals = opts.values
			.mergeMap(v => ({[v]: component._state[prop] && component._state[prop].includes(v)}));

		const menu = ContextUtil.getMenu(opts.values.map(it => new ContextUtil.Action(
			opts.fnDisplay ? opts.fnDisplay(it) : it,
			() => pickComp.getPod().set(it, true),
		)));

		const pickComp = BaseComponent.fromObject(initialVals);
		pickComp.render = function ($parent) {
			$parent.empty();

			Object.entries(this._state).forEach(([k, v]) => {
				if (v === false) return;

				const $btnRemove = $(`<button class="btn btn-danger ui-pick__btn-remove">×</button>`)
					.click(() => this._state[k] = false);
				$$`<div class="flex mx-1 mb-1 ui-pick__disp-pill"><div class="px-1 ui-pick__disp-text flex-v-center">${opts.fnDisplay ? opts.fnDisplay(k) : k}</div>${$btnRemove}</div>`.appendTo($parent);
			});
		};

		const $btnAdd = $(`<button class="btn btn-xxs btn-default ui-pick__btn-add mb-1">+</button>`)
			.click(evt => ContextUtil.pOpenMenu(evt, menu));

		const $wrpPills = $(`<div class="flex flex-wrap w-100"></div>`);
		const $wrp = $$`<div class="flex-v-center">${$btnAdd}${$wrpPills}</div>`;
		pickComp._addHookAll("state", () => {
			component._state[prop] = Object.keys(pickComp._state).filter(k => pickComp._state[k]);
			pickComp.render($wrpPills);
		});
		pickComp.render($wrpPills);
		return $wrp;
	}

	/**
	 * @param component An instance of a class which extends BaseComponent.
	 * @param prop Component to hook on.
	 * @param opts Options Object.
	 * @param opts.values Values to display.
	 * @param [opts.fnDisplay] Value display function.
	 * @param [opts.isDisallowNull] True if null is not an allowed value.
	 * @param [opts.asMeta] If a meta-object should be returned containing the hook and the wrapper.
	 * @param [opts.isIndent] If the checkboxes should be indented.
	 * @return {JQuery}
	 */
	static $getCbsEnum (component, prop, opts) {
		opts = opts || {};

		const $wrp = $(`<div class="flex-col w-100"></div>`);
		const metas = opts.values.map(it => {
			const $cb = $(`<input type="checkbox">`)
				.keydown(evt => {
					if (evt.key === "Escape") $cb.blur();
				})
				.change(() => {
					let didUpdate = false;
					const ix = (component._state[prop] || []).indexOf(it);
					if (~ix) component._state[prop].splice(ix, 1);
					else {
						if (component._state[prop]) component._state[prop].push(it);
						else {
							didUpdate = true;
							component._state[prop] = [it];
						}
					}
					if (!didUpdate) component._state[prop] = [...component._state[prop]];
				});

			$$`<label class="split-v-center my-1 stripe-odd ${opts.isIndent ? "ml-4" : ""}"><div class="no-wrap flex-v-center">${opts.fnDisplay ? opts.fnDisplay(it) : it}</div>${$cb}</label>`.appendTo($wrp);

			return {$cb, value: it};
		});

		const hook = () => metas.forEach(meta => meta.$cb.prop("checked", component._state[prop] && component._state[prop].includes(meta.value)));
		component._addHookBase(prop, hook);
		hook();

		return opts.asMeta ? {$wrp, unhook: () => component._removeHookBase(prop, hook)} : $wrp;
	}

	/**
	 * @param comp
	 * @param prop Base prop. This will be expanded with `__...`-suffixed sub-props as required.
	 * @param opts Options.
	 * @param [opts.values] Array of values. Mutually incompatible with "valueGroups".
	 * @param [opts.valueGroups] Array of value groups (of the form `{name: "Group Name", values: [...]}`). Mutually incompatible with "values".
	 * @param [opts.count] Number of choices the user can make (cannot be used with min/max).
	 * @param [opts.min] Minimum number of choices the user can make (cannot be used with count).
	 * @param [opts.max] Maximum number of choices the user can make (cannot be used with count).
	 * @param [opts.isResolveItems] True if the promise should resolve to an array of the items instead of the indices. // TODO maybe remove?
	 * @param [opts.fnDisplay] Function which takes a value and returns display text.
	 */
	static getMetaWrpMultipleChoice (comp, prop, opts) {
		opts = opts || {};
		this._getMetaWrpMultipleChoice_doValidateOptions(opts);

		const rowMetas = [];
		const $eles = [];
		const ixsSelectionOrder = [];

		const propIsAcceptable = this.getMetaWrpMultipleChoice_getPropIsAcceptable(prop);
		const propPulse = this.getMetaWrpMultipleChoice_getPropPulse(prop);
		const propIxMax = this._getMetaWrpMultipleChoice_getPropValuesLength(prop);

		const valueGroups = opts.valueGroups || [{values: opts.values}];

		let ixValue = 0;
		valueGroups.forEach((group, i) => {
			if (i !== 0) $eles.push($(`<hr class="w-100 hr-1 hr--dotted">`));

			if (group.name) $eles.push($(`<div class="flex-v-center row py-1"><span class="mr-2">‒</span><span>${group.name}</span></div>`));

			if (group.text) $eles.push($(`<div class="flex-v-center row py-1"><div class="ml-1 mr-3"></div><i>${group.text}</i></div>`));

			group.values.forEach(v => {
				const ixValueFrozen = ixValue;

				const propIsActive = this.getMetaWrpMultipleChoice_getPropIsActive(prop, ixValueFrozen);
				const propIsRequired = this.getMetaWrpMultipleChoice_getPropIsRequired(prop, ixValueFrozen);

				// In the case of pre-existing selections, add these to our selection order tracking as they appear
				if (comp._state[propIsActive] && !comp._state[propIsRequired]) ixsSelectionOrder.push(ixValueFrozen);

				const $cb = comp._state[propIsRequired]
					? $(`<input type="checkbox" disabled checked>`)
					: ComponentUiUtil.$getCbBool(comp, propIsActive);
				const hk = () => {
					// region Selection order
					const ixIx = ixsSelectionOrder.findIndex(it => it === ixValueFrozen);
					if (~ixIx) ixsSelectionOrder.splice(ixIx, 1);
					if (comp._state[propIsActive]) ixsSelectionOrder.push(ixValueFrozen);
					// endregion

					// region Enable/disable
					const activeRows = rowMetas.filter(it => comp._state[it.propIsActive]);

					if (opts.count != null) {
						// If we're above the max allowed count, deselect a checkbox in FIFO order
						if (activeRows.length > opts.count) {
							// FIFO (`.shift`) makes logical sense, but FILO (`.splice` second-from-last) _feels_ better
							const ixFirstSelected = ixsSelectionOrder.splice(ixsSelectionOrder.length - 2, 1)[0];
							if (ixFirstSelected != null) {
								const propIsActiveOther = this.getMetaWrpMultipleChoice_getPropIsActive(prop, ixFirstSelected);
								comp._state[propIsActiveOther] = false;

								comp._state[propPulse] = !comp._state[propPulse];
							}
							return;
						}
					}

					let isAcceptable = false;
					if (opts.count != null) {
						if (activeRows.length === opts.count) isAcceptable = true;
					} else {
						if (activeRows.length >= (opts.min || 0) && activeRows.length <= (opts.max || Number.MAX_SAFE_INTEGER)) isAcceptable = true;
					}

					// Save this to a flag in the state object that external code can read
					comp._state[propIsAcceptable] = isAcceptable;
					// endregion

					comp._state[propPulse] = !comp._state[propPulse];
				};
				comp._addHookBase(propIsActive, hk);
				hk();

				rowMetas.push({
					$cb,
					propIsActive,
					unhook: () => comp._removeHookBase(propIsActive, hk),
				});

				$eles.push($$`<label class="flex-v-center row py-1 stripe-even">
					<div class="col-1 flex-vh-center">${$cb}</div>
					<div class="col-11 flex-v-center">${opts.fnDisplay ? opts.fnDisplay(v, ixValueFrozen) : v}</div>
				</label>`);

				ixValue++;
			});
		});

		// Sort the initial selection order (i.e. that from defaults) by lowest to highest, such that new clicks
		//   will remove from the first element in visual order
		ixsSelectionOrder.sort((a, b) => SortUtil.ascSort(a, b));

		comp.__state[propIxMax] = ixValue;

		// Always return this as a "meta" object
		const unhook = () => rowMetas.forEach(it => it.unhook());
		return {
			$ele: $$`<div class="flex-col w-100 overflow-y-auto">${$eles}</div>`,
			propIsAcceptable,
			propPulse,
			unhook,
			cleanup: () => {
				unhook();
				// This will trigger a final "pulse"
				Object.keys(comp._state)
					.filter(it => it.startsWith(`${prop}__`))
					.forEach(it => delete comp._state[it]);
			},
		};
	}

	static getMetaWrpMultipleChoice_getPropIsAcceptable (prop) { return `${prop}__isAcceptable`; }
	static getMetaWrpMultipleChoice_getPropPulse (prop) { return `${prop}__pulse`; }
	static _getMetaWrpMultipleChoice_getPropValuesLength (prop) { return `${prop}__length`; }
	static getMetaWrpMultipleChoice_getPropIsActive (prop, ixValue) { return `${prop}__isActive_${ixValue}`; }
	static getMetaWrpMultipleChoice_getPropIsRequired (prop, ixValue) { return `${prop}__isRequired_${ixValue}`; }

	static getMetaWrpMultipleChoice_getSelectedIxs (comp, prop) {
		const out = [];
		const len = comp._state[this._getMetaWrpMultipleChoice_getPropValuesLength(prop)] || 0;
		for (let i = 0; i < len; ++i) {
			if (comp._state[this.getMetaWrpMultipleChoice_getPropIsActive(prop, i)]) out.push(i);
		}
		return out;
	}

	static getMetaWrpMultipleChoice_getSelectedValues (comp, prop, {values, valueGroups}) {
		const selectedIxs = this.getMetaWrpMultipleChoice_getSelectedIxs(comp, prop);
		if (values) return selectedIxs.map(ix => values[ix]);

		const selectedIxsSet = new Set(selectedIxs);
		const out = [];
		let ixValue = 0;
		valueGroups.forEach(group => {
			group.values.forEach(v => {
				if (selectedIxsSet.has(ixValue)) out.push(v);
				ixValue++;
			});
		});
		return out;
	}

	static _getMetaWrpMultipleChoice_doValidateOptions (opts) {
		if ((Number(!!opts.values) + Number(!!opts.valueGroups)) !== 1) throw new Error(`Exactly one of "values" and "valueGroups" must be specified!`);

		if (opts.count != null && (opts.min != null || opts.max != null)) throw new Error(`Chooser must be either in "count" mode or "min/max" mode!`);
		// If no mode is specified, default to a "count 1" chooser
		if (opts.count == null && opts.min == null && opts.max == null) opts.count = 1;
	}

	static $getSliderRange (comp, opts) {
		opts = opts || {};
		const slider = new ComponentUiUtil.RangeSlider({comp, ...opts});
		return slider.$get();
	}
}
ComponentUiUtil.RangeSlider = class {
	constructor (
		{
			comp,
			propMin,
			propMax,
			propCurMin,
			propCurMax,
			fnDisplay,
		},
	) {
		this._comp = comp;
		this._propMin = propMin;
		this._propMax = propMax;
		this._propCurMin = propCurMin;
		this._propCurMax = propCurMax;
		this._fnDisplay = fnDisplay;

		this._isSingle = !this._propCurMax;

		// region Make a copy of the interesting bits of the parent component, so we can freely change them without
		//   outside performance implications
		const compCpyState = {
			[this._propMin]: this._comp._state[this._propMin],
			[this._propCurMin]: this._comp._state[this._propCurMin],
			[this._propMax]: this._comp._state[this._propMax],
		};
		if (!this._isSingle) compCpyState[this._propCurMax] = this._comp._state[this._propCurMax];
		this._compCpy = BaseComponent.fromObject(compCpyState);

		// Sync parent changes to our state
		this._comp._addHook("state", this._propMin, () => this._compCpy._state[this._propMin] = this._comp._state[this._propMin]);
		this._comp._addHook("state", this._propCurMin, () => this._compCpy._state[this._propCurMin] = this._comp._state[this._propCurMin]);
		this._comp._addHook("state", this._propMax, () => this._compCpy._state[this._propMax] = this._comp._state[this._propMax]);

		if (!this._isSingle) this._comp._addHook("state", this._propCurMax, () => this._compCpy._state[this._propCurMax] = this._comp._state[this._propCurMax]);
		// endregion

		this._cacheRendered = null;
		this._dispTrackOuter = null;
		this._dispTrackInner = null;
		this._thumbLow = null;
		this._thumbHigh = null;
		this._dragMeta = null;
	}

	$get () {
		const out = this.get();
		return $(out);
	}

	get () {
		this.constructor._init();
		this.constructor._ALL_SLIDERS.add(this);

		if (this._cacheRendered) return this._cacheRendered;

		// region Top part
		const dispValueLeft = this._isSingle ? this._getSpcSingleValue() : this._getDispValue({isVisible: true, side: "left"});
		const dispValueRight = this._getDispValue({isVisible: true, side: "right"});

		this._dispTrackInner = this._isSingle ? null : e_({
			tag: "div",
			clazz: "ui-slidr__track-inner h-100 absolute",
		});

		this._thumbLow = this._getThumb();
		this._thumbHigh = this._isSingle ? null : this._getThumb();

		this._dispTrackOuter = e_({
			tag: "div",
			clazz: `relative w-100 ui-slidr__track-outer`,
			children: [
				this._dispTrackInner,
				this._thumbLow,
				this._thumbHigh,
			].filter(Boolean),
		});

		const wrpTrack = e_({
			tag: "div",
			clazz: `flex-v-center w-100 h-100 ui-slidr__wrp-track clickable`,
			mousedown: evt => {
				const thumb = this._getClosestThumb(evt);
				this._handleMouseDown(evt, thumb);
			},
			children: [
				this._dispTrackOuter,
			],
		});

		const wrpTop = e_({
			tag: "div",
			clazz: "flex-v-center w-100 ui-slidr__wrp-top",
			children: [
				dispValueLeft,
				wrpTrack,
				dispValueRight,
			].filter(Boolean),
		});
		// endregion

		// region Bottom part
		const wrpPips = e_({
			tag: "div",
			clazz: `w-100 flex relative clickable h-100 ui-slidr__wrp-pips`,
			mousedown: evt => {
				const thumb = this._getClosestThumb(evt);
				this._handleMouseDown(evt, thumb);
			},
		});

		const wrpBottom = e_({
			tag: "div",
			clazz: "w-100 flex-vh-center ui-slidr__wrp-bottom",
			children: [
				this._isSingle ? this._getSpcSingleValue() : this._getDispValue({side: "left"}), // Pad the start
				wrpPips,
				this._getDispValue({side: "right"}), // and the end
			].filter(Boolean),
		});
		// endregion

		// region Hooks
		const hkChangeValue = () => {
			const min = this._compCpy._state[this._propMin]; const max = this._compCpy._state[this._propMax];

			const curMin = this._compCpy._state[this._propCurMin];
			const pctMin = ((curMin - min) / (max - min)) * 100;
			this._thumbLow.style.left = `calc(${pctMin}% - ${this.constructor._W_THUMB_PX / 2}px)`;
			const toDisplayLeft = this._fnDisplay ? `${this._fnDisplay(curMin)}`.qq() : curMin;
			if (!this._isSingle) dispValueLeft.html(toDisplayLeft);

			if (!this._isSingle) {
				this._dispTrackInner.style.left = `${pctMin}%`;

				const curMax = this._compCpy._state[this._propCurMax];
				const pctMax = ((curMax - min) / (max - min)) * 100;
				this._dispTrackInner.style.right = `${100 - pctMax}%`;
				this._thumbHigh.style.left = `calc(${pctMax}% - ${this.constructor._W_THUMB_PX / 2}px)`;
				dispValueRight.html(this._fnDisplay ? `${this._fnDisplay(curMax)}`.qq() : curMax);
			} else {
				dispValueRight.html(toDisplayLeft);
			}
		};

		const hkChangeLimit = () => {
			const pips = [];

			const numPips = this._compCpy._state[this._propMax] - this._compCpy._state[this._propMin];
			let pipIncrement = 1;
			// Cap the number of pips
			if (numPips > ComponentUiUtil.RangeSlider._MAX_PIPS) pipIncrement = Math.ceil(numPips / ComponentUiUtil.RangeSlider._MAX_PIPS);

			let i, len;
			for (
				i = this._compCpy._state[this._propMin], len = this._compCpy._state[this._propMax] + 1;
				i < len;
				i += pipIncrement
			) {
				pips.push(this._getWrpPip({
					isMajor: i === this._compCpy._state[this._propMin] || i === (len - 1),
					value: i,
				}));
			}

			// Ensure the last pip is always rendered, even if we're reducing pips
			if (i !== this._compCpy._state[this._propMax]) pips.push(this._getWrpPip({isMajor: true, value: this._compCpy._state[this._propMax]}));

			wrpPips.empty();
			e_({
				ele: wrpPips,
				children: pips,
			});

			hkChangeValue();
		};

		this._compCpy._addHook("state", this._propMin, hkChangeLimit);
		this._compCpy._addHook("state", this._propMax, hkChangeLimit);
		this._compCpy._addHook("state", this._propCurMin, hkChangeValue);
		if (!this._isSingle) this._compCpy._addHook("state", this._propCurMax, hkChangeValue);

		hkChangeLimit();
		// endregion

		const wrp = e_({
			tag: "div",
			clazz: "flex-col w-100 ui-slidr__wrp",
			children: [
				wrpTop,
				wrpBottom,
			],
		});

		return this._cacheRendered = wrp;
	}

	destroy () {
		this.constructor._ALL_SLIDERS.delete(this);
		if (this._cacheRendered) this._cacheRendered.remove();
	}

	_getDispValue ({isVisible, side}) {
		return e_({
			tag: "div",
			clazz: `overflow-hidden ui-slidr__disp-value no-shrink no-grow flex-vh-center bold no-select ${isVisible ? `ui-slidr__disp-value--visible` : ""} ui-slidr__disp-value--${side}`,
		});
	}

	_getSpcSingleValue () {
		return e_({
			tag: "div",
			clazz: `px-2`,
		});
	}

	_getThumb () {
		const thumb = e_({
			tag: "div",
			clazz: "ui-slidr__thumb absolute clickable",
			mousedown: evt => this._handleMouseDown(evt, thumb),
		}).attr("draggable", true);

		return thumb;
	}

	_getWrpPip ({isMajor, value} = {}) {
		const min = this._compCpy._state[this._propMin]; const max = this._compCpy._state[this._propMax];
		const pctValue = ((value - min) / (max - min)) * 100;
		const posLeft = `${pctValue}%`;
		const styleLeft = `left: ${posLeft};`;

		const pip = e_({
			tag: "div",
			clazz: `ui-slidr__pip ${isMajor ? `ui-slidr__pip--major` : `absolute`}`,
		});

		const dispLabel = e_({
			tag: "div",
			clazz: "absolute ui-slidr__pip-label flex-vh-center ve-small no-wrap",
			html: isMajor ? this._fnDisplay ? `${this._fnDisplay(value)}`.qq() : value : "",
		});

		return e_({
			tag: "div",
			clazz: "flex-col flex-vh-center absolute no-select",
			children: [
				pip,
				dispLabel,
			],
			style: styleLeft,
		});
	}

	/**
	 * Convert pixel-space to track-space.
	 * Example usage:
	 * ```
	 * click: evt => {
	 *   const {x: trackOriginX, width: trackWidth} = this._dispTrackOuter.getBoundingClientRect();
	 *   const value = this._getRelativeValue(evt, {trackOriginX, trackWidth});
	 *   this._handleClick(evt, value);
	 * }
	 * ```
	 */
	_getRelativeValue (evt, {trackOriginX, trackWidth}) {
		const min = this._compCpy._state[this._propMin]; const max = this._compCpy._state[this._propMax];

		const xEvt = EventUtil.getClientX(evt) - trackOriginX;
		const rawVal = min
			+ Math.round(
				(xEvt / trackWidth) * (max - min),
			);

		return Math.min(max, Math.max(min, rawVal)); // Clamp eet
	}

	_getClosestThumb (evt) {
		if (this._isSingle) return this._thumbLow;

		const {x: trackOriginX, width: trackWidth} = this._dispTrackOuter.getBoundingClientRect();
		const value = this._getRelativeValue(evt, {trackOriginX, trackWidth});

		if (value < this._compCpy._state[this._propCurMin]) return this._thumbLow;
		if (value > this._compCpy._state[this._propCurMax]) return this._thumbHigh;

		const {distToMin, distToMax} = this._getDistsToCurrentMinAndMax(value);
		if (distToMax < distToMin) return this._thumbHigh;
		return this._thumbLow;
	}

	_getDistsToCurrentMinAndMax (value) {
		if (this._isSingle) throw new Error(`Can not get distance to max value for singleton slider!`);

		// Move the closest slider to this pip's location
		const distToMin = Math.abs(this._compCpy._state[this._propCurMin] - value);
		const distToMax = Math.abs(this._compCpy._state[this._propCurMax] - value);
		return {distToMin, distToMax}
	}

	_handleClick (evt, value) {
		evt.stopPropagation();
		evt.preventDefault();

		// If lower than the lowest value, set the low value
		if (value < this._compCpy._state[this._propCurMin]) this._compCpy._state[this._propCurMin] = value;

		// If higher than the highest value, set the high value
		if (value > this._compCpy._state[this._propCurMax]) this._compCpy._state[this._propCurMax] = value;

		// Move the closest slider to this pip's location
		const {distToMin, distToMax} = this._getDistsToCurrentMinAndMax(value);

		if (distToMax < distToMin) this._compCpy._state[this._propCurMax] = value;
		else this._compCpy._state[this._propCurMin] = value;
	}

	_handleMouseDown (evt, thumb) {
		evt.preventDefault();
		evt.stopPropagation();

		// region Set drag metadata
		const {x: trackOriginX, width: trackWidth} = this._dispTrackOuter.getBoundingClientRect();

		thumb.addClass(`ui-slidr__thumb--hover`);

		this._dragMeta = {
			trackOriginX,
			trackWidth,
			thumb,
		};
		// endregion

		this._handleMouseMove(evt)
	}

	_handleMouseUp () {
		const wasActive = this._doDragCleanup();

		// On finishing a slide, push our state to the parent comp
		if (wasActive) {
			const nxtState = {
				[this._propMin]: this._compCpy._state[this._propMin],
				[this._propMax]: this._compCpy._state[this._propMax],
				[this._propCurMin]: this._compCpy._state[this._propCurMin],
			};
			if (!this._isSingle) nxtState[this._propCurMax] = this._compCpy._state[this._propCurMax];

			this._comp._proxyAssignSimple("state", nxtState);
		}
	}

	_handleMouseMove (evt) {
		if (!this._dragMeta) return;

		const val = this._getRelativeValue(evt, this._dragMeta);

		if (this._dragMeta.thumb === this._thumbLow) {
			if (val > this._compCpy._state[this._propCurMax]) return;
			this._compCpy._state[this._propCurMin] = val;
		} else if (this._dragMeta.thumb === this._thumbHigh) {
			if (val < this._compCpy._state[this._propCurMin]) return;
			this._compCpy._state[this._propCurMax] = val;
		}
	}

	_doDragCleanup () {
		const isActive = this._dragMeta != null;

		if (this._dragMeta?.thumb) this._dragMeta.thumb.removeClass(`ui-slidr__thumb--hover`);

		this._dragMeta = null;

		return isActive;
	}

	static _init () {
		if (this._isInit) return;
		document.addEventListener("mousemove", evt => {
			for (const slider of this._ALL_SLIDERS) {
				slider._handleMouseMove(evt);
			}
		});

		document.addEventListener("mouseup", evt => {
			for (const slider of this._ALL_SLIDERS) {
				slider._handleMouseUp(evt);
			}
		});
	}
}
ComponentUiUtil.RangeSlider._isInit = false;
ComponentUiUtil.RangeSlider._ALL_SLIDERS = new Set();
ComponentUiUtil.RangeSlider._W_THUMB_PX = 16;
ComponentUiUtil.RangeSlider._W_LABEL_PX = 24;
ComponentUiUtil.RangeSlider._MAX_PIPS = 40;

if (typeof module !== "undefined") {
	module.exports = {
		ProxyBase,
		UiUtil,
		ListUiUtil,
		TabUiUtil,
		SearchUiUtil,
		SearchWidget,
		InputUiUtil,
		DragReorderUiUtil,
		SourceUiUtil,
		BaseComponent,
		ComponentUiUtil,
	}
}
