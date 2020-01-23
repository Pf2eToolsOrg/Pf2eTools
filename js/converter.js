"use strict";

window.onload = doPageInit;

class ConverterUiUtil {
	static renderSideMenuDivider ($menu, heavy) { $menu.append(`<hr class="sidemenu__row__divider ${heavy ? "sidemenu__row__divider--heavy" : ""}">`); }
}

class BaseConverter extends BaseComponent {
	static _getDisplayMode (mode) {
		switch (mode) {
			case "html": return "HTML";
			case "md": return "Markdown";
			case "txt": return "Text";
			default: throw new Error(`Unimplemented!`)
		}
	}

	static _getValidOptions (options) {
		options = options || {};
		if (!options.cbWarning || !options.cbOutput) throw new Error(`Missing required callback options!`);
		return options;
	}

	/**
	 * @param ui Converter UI instance.
	 * @param opts Options object.
	 * @param opts.converterId Converter unique ID.
	 * @param [opts.canSaveLocal] If the output of this converter is suitable for saving to local homebrew.
	 * @param opts.modes Available converter parsing modes (e.g. "txt", "html", "md")
	 * @param [opts.hasPageNumbers] If the entity has page numbers.
	 * @param [opts.titleCaseFields] Array of fields to be (optionally) title-cased.
	 * @param [opts.hasSource] If the output entities can have a source field.
	 * @param opts.prop The data prop for the output entrity.
	 */
	constructor (ui, opts) {
		super();
		this._ui = ui;

		this._converterId = opts.converterId;
		this._canSaveLocal = !!opts.canSaveLocal;
		this._modes = opts.modes;
		this._hasPageNumbers = opts.hasPageNumbers;
		this._titleCaseFields = opts.titleCaseFields;
		this._hasSource = opts.hasSource;
		this._prop = opts.prop;

		// Add default starting state from options
		this._state.mode = this._modes[0];
		if (this._hasPageNumbers) this._state.page = 0;
		if (this._titleCaseFields) this._state.isTitleCase = false;
		if (this._hasSource) this._state.source = "";

		this._addHookAll("state", this._ui.saveSettingsDebounced);
	}

	get converterId () { return this._converterId; }
	get canSaveLocal () { return this._canSaveLocal; }
	get prop () { return this._prop; }

	renderSidebar (parent, $parent) {
		const $wrpSidebar = $(`<div class="w-100 flex-col"/>`).appendTo($parent);
		const hkShowSidebar = () => $wrpSidebar.toggleClass("hidden", parent.get("converter") !== this._converterId);
		parent.addHook("converter", hkShowSidebar);
		hkShowSidebar();

		this._renderSidebar(parent, $wrpSidebar);
		this._renderSidebarSamplesPart(parent, $wrpSidebar);
		this._renderSidebarConverterOptionsPart(parent, $wrpSidebar);
		this._renderSidebarPagePart(parent, $wrpSidebar);
		this._renderSidebarSourcePart(parent, $wrpSidebar);
	}

	_renderSidebar () { throw new Error("Unimplemented!"); }
	handleParse () { throw new Error("Unimplemented!"); }
	_getSample () { throw new Error("Unimplemented!"); }

	// region sidebar
	_renderSidebarSamplesPart (parent, $wrpSidebar) {
		const $btnsSamples = this._modes.map(mode => {
			return $(`<button class="btn btn-sm btn-default">Sample ${BaseConverter._getDisplayMode(mode)}</button>`)
				.click(() => {
					this._ui.inText = this._getSample(mode);
					this._state.mode = mode;
				});
		});

		$$`<div class="sidemenu__row flex-vh-center-around">${$btnsSamples}</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarConverterOptionsPart (parent, $wrpSidebar) {
		const hasModes = this._modes.length > 1;

		if (!hasModes && !this._titleCaseFields) return;

		if (hasModes) {
			const $selMode = ComponentUiUtil.$getSelEnum(this, "mode", {values: this._modes, html: `<select class="form-control input-sm select-inline"/>`, fnDisplay: it => `Parse as ${BaseConverter._getDisplayMode(it)}`});
			$$`<div class="sidemenu__row flex-vh-center-around">${$selMode}</div>`.appendTo($wrpSidebar);
		}

		if (this._titleCaseFields) {
			const $cbTitleCase = ComponentUiUtil.$getCbBool(this, "isTitleCase");
			$$`<div class="sidemenu__row split-v-center">
				<label class="sidemenu__row__label sidemenu__row__label--cb-label" title="Should the creature's name be converted to title-case? Useful when pasting a name which is all-caps."><span>Title-Case Name</span>
				${$cbTitleCase}
			</label></div>`.appendTo($wrpSidebar);
		}
		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarPagePart (parent, $wrpSidebar) {
		if (!this._hasPageNumbers) return;

		const $iptPage = ComponentUiUtil.$getIptInt(this, "page", 0, {html: `<input class="form-control input-sm" type="number" style="max-width: 9rem;">`});
		$$`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Page</div>${$iptPage}</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarSourcePart (parent, $wrpSidebar) {
		if (!this._hasSource) return;

		const $wrpSourceOverlay = $(`<div class="h-100 w-100"/>`);
		let modalMeta = null;

		const rebuildStageSource = (options) => {
			SourceUiUtil.render({
				...options,
				$parent: $wrpSourceOverlay,
				cbConfirm: (source) => {
					const isNewSource = options.mode !== "edit";

					if (isNewSource) BrewUtil.addSource(source);
					else BrewUtil.updateSource(source);

					if (isNewSource) parent.set("availableSources", [...parent.get("availableSources"), source.json]);
					this._state.source = source.json;

					if (modalMeta) modalMeta.doClose();
				},
				cbConfirmExisting: (source) => {
					this._state.source = source.json;

					if (modalMeta) modalMeta.doClose();
				},
				cbCancel: () => {
					if (modalMeta) modalMeta.doClose();
				}
			});
		};

		const $selSource = $$`
			<select class="form-control input-sm"><option value="">(None)</option></select>`
			.change(() => this._state.source = $selSource.val());
		const hkSource = () => $selSource.val(this._state.source);
		hkSource();
		this._addHookBase("source", hkSource);

		const hkAvailSources = () => {
			const curSources = new Set($selSource.find(`option`).map((i, e) => $(e).val()));
			const nxtSources = new Set(parent.get("availableSources"));
			parent.get("availableSources").forEach(source => {
				const fullSource = BrewUtil.sourceJsonToSource(source);
				nxtSources.add(source);
				if (!curSources.has(source)) {
					$(`<option/>`, {val: fullSource.json, text: fullSource.full}).appendTo($selSource);
				}
			});
			const toDelete = CollectionUtil.setDiff(curSources, nxtSources);
			if (toDelete.size) $selSource.find(`option`).filter((i, e) => toDelete.has($(e).val())).remove();
		};
		parent.addHook("availableSources", hkAvailSources);
		hkAvailSources();

		$$`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Source</div>${$selSource}</div>`.appendTo($wrpSidebar);

		const $btnSourceEdit = $(`<button class="btn btn-default btn-sm mr-2">Edit Selected Source</button>`)
			.click(() => {
				const curSourceJson = this._state.source;
				if (!curSourceJson) {
					JqueryUtil.doToast({type: "warning", content: "No source selected!"});
					return;
				}

				const curSource = BrewUtil.sourceJsonToSource(curSourceJson);
				if (!curSource) return;
				rebuildStageSource({mode: "edit", source: MiscUtil.copy(curSource)});
				modalMeta = UiUtil.getShowModal({
					fullHeight: true,
					isLarge: true,
					cbClose: () => $wrpSourceOverlay.detach()
				});
				$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
			});
		$$`<div class="sidemenu__row">${$btnSourceEdit}</div>`.appendTo($wrpSidebar);

		const $btnSourceAdd = $(`<button class="btn btn-default btn-sm">Add New Source</button>`).click(() => {
			rebuildStageSource({mode: "add"});
			modalMeta = UiUtil.getShowModal({
				fullHeight: true,
				isLarge: true,
				cbClose: () => $wrpSourceOverlay.detach()
			});
			$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
		});
		$$`<div class="sidemenu__row">${$btnSourceAdd}</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}
	// endregion

	// region conversion
	_getAsTitle (prop, line) {
		return this._titleCaseFields && this._titleCaseFields.includes(prop) && this._state.isTitleCase
			? line.toLowerCase().toTitleCase()
			: line;
	}

	_getCleanInput (ipt) {
		return ipt
			.replace(/[−–‒]/g, "-") // convert minus signs to hyphens
		;
	}

	static _hasEntryContent (trait) {
		return trait && (trait.name || (trait.entries.length === 1 && trait.entries[0]) || trait.entries.length > 1);
	}
	// endregion
}

class ConverterUi extends BaseComponent {
	constructor () {
		super();

		this._editorIn = null;
		this._editorOut = null;

		this._converters = {};

		this._saveInputDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_INPUT, this._editorIn.getValue()), 50);
		this.saveSettingsDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_STATE, this.getBaseSaveableState()), 50);

		this._addHookAll("state", () => this.saveSettingsDebounced());
	}

	set converters (converters) { this._converters = converters; }
	get activeConverter () { return this._converters[this._state.converter]; }

	getBaseSaveableState () {
		return {
			...super.getBaseSaveableState(),
			...Object.values(this._converters).map(it => ({[it.converterId]: it.getBaseSaveableState()}))
				.reduce((a, b) => Object.assign(a, b))
		}
	}

	async pInit () {
		// region load state
		const savedState = await StorageUtil.pGetForPage(ConverterUi.STORAGE_STATE);
		if (savedState) {
			this.setBaseSaveableStateFrom(savedState);
			Object.values(this._converters).forEach(it => it.setBaseSaveableStateFrom(savedState[it.converterId]));
		}

		// forcibly overwrite available sources with fresh data
		this._state.availableSources = (BrewUtil.homebrewMeta.sources || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);

		// reset this temp flag
		this._state.hasAppended = false;
		// endregion

		this._editorIn = ace.edit("converter_input");
		this._editorIn.setOptions({
			wrap: true,
			showPrintMargin: false
		});
		try {
			const prevInput = await StorageUtil.pGetForPage(ConverterUi.STORAGE_INPUT);
			if (prevInput) this._editorIn.setValue(prevInput, -1);
		} catch (ignored) { setTimeout(() => { throw ignored; }) }
		this._editorIn.on("change", () => this._saveInputDebounced());

		this._editorOut = ace.edit("converter_output");
		this._editorOut.setOptions({
			wrap: true,
			showPrintMargin: false,
			readOnly: true
		});

		$(`#editable`).click(() => {
			if (confirm(`Edits will be overwritten as you parse new statblocks. Enable anyway?`)) this._outReadOnly = false;
		});

		const $btnSaveLocal = $(`#save_local`).click(async () => {
			const output = this._outText;
			if (output && output.trim()) {
				try {
					const prop = this.activeConverter.prop;
					const entries = JSON.parse(`[${output}]`);

					const invalidSources = entries.map(it => !it.source || !BrewUtil.hasSourceJson(it.source) ? (it.name || it.caption || "(Unnamed)").trim() : false).filter(Boolean);
					if (invalidSources.length) {
						JqueryUtil.doToast({
							content: `One or more entries have missing or unknown sources: ${invalidSources.join(", ")}`,
							type: "danger"
						});
						return;
					}

					// ignore duplicates
					const _dupes = {};
					const dupes = [];
					const dedupedEntries = entries.map(it => {
						const lSource = it.source.toLowerCase();
						const lName = it.name.toLowerCase();
						_dupes[lSource] = _dupes[lSource] || {};
						if (_dupes[lSource][lName]) {
							dupes.push(it.name);
							return null;
						} else {
							_dupes[lSource][lName] = true;
							return it;
						}
					}).filter(Boolean);
					if (dupes.length) {
						JqueryUtil.doToast({
							type: "warning",
							content: `Ignored ${dupes.length} duplicate entr${dupes.length === 1 ? "y" : "ies"}`
						})
					}

					// handle overwrites
					const overwriteMeta = dedupedEntries.map(it => {
						const ix = (BrewUtil.homebrew[prop] || []).findIndex(bru => bru.name.toLowerCase() === it.name.toLowerCase() && bru.source.toLowerCase() === it.source.toLowerCase());
						if (~ix) {
							return {
								isOverwrite: true,
								ix,
								entry: it
							}
						} else return {entry: it, isOverwrite: false};
					}).filter(Boolean);
					const willOverwrite = overwriteMeta.map(it => it.isOverwrite).filter(Boolean);
					if (willOverwrite.length && !confirm(`This will overwrite ${willOverwrite.length} entr${willOverwrite.length === 1 ? "y" : "ies"}. Are you sure?`)) {
						return;
					}

					await Promise.all(overwriteMeta.map(meta => {
						if (meta.isOverwrite) {
							return BrewUtil.pUpdateEntryByIx(prop, meta.ix, MiscUtil.copy(meta.entry));
						} else {
							return BrewUtil.pAddEntry(prop, MiscUtil.copy(meta.entry));
						}
					}));

					JqueryUtil.doToast({
						type: "success",
						content: `Saved!`
					});

					Omnisearch.pAddToIndex("monster", overwriteMeta.filter(meta => !meta.isOverwrite).map(meta => meta.entry));
				} catch (e) {
					JqueryUtil.doToast({
						content: `Current output was not valid JSON!`,
						type: "danger"
					});
					setTimeout(() => { throw e });
				}
			} else {
				JqueryUtil.doToast({
					content: "Nothing to save!",
					type: "danger"
				});
			}
		});
		const hkConverter = () => {
			$btnSaveLocal.toggleClass("hidden", !this.activeConverter.canSaveLocal);
		};
		this._addHookBase("converter", hkConverter);
		hkConverter();

		$(`#download`).click(() => {
			const output = this._outText;
			if (output && output.trim()) {
				try {
					const prop = this.activeConverter.prop;
					const out = {[prop]: JSON.parse(`[${output}]`)};
					DataUtil.userDownload(`converter-output`, out);
				} catch (e) {
					JqueryUtil.doToast({
						content: `Current output was not valid JSON. Downloading as <span class="code">.txt</span> instead.`,
						type: "warning"
					});
					DataUtil.userDownloadText(`converter-output.txt`, output);
					setTimeout(() => { throw e; });
				}
			} else {
				JqueryUtil.doToast({
					content: "Nothing to download!",
					type: "danger"
				});
			}
		});

		/**
		 * Wrap a function in an error handler which will wipe the error output, and append future errors to it.
		 * @param toRun
		 */
		const catchErrors = (toRun) => {
			try {
				$(`#lastWarnings`).hide().html("");
				$(`#lastError`).hide().html("");
				this._editorOut.resize();
				toRun();
			} catch (x) {
				const splitStack = x.stack.split("\n");
				const atPos = splitStack.length > 1 ? splitStack[1].trim() : "(Unknown location)";
				const message = `[Error] ${x.message} ${atPos}`;
				$(`#lastError`).show().html(message);
				this._editorOut.resize();
				setTimeout(() => { throw x });
			}
		};

		const doConversion = (isAppend) => {
			catchErrors(() => {
				if (isAppend && this._state.hasAppended && !confirm("You're about to overwrite multiple entries. Are you sure?")) return;

				const chunks = (this._state.inputSeparator
					? this.inText.split(this._state.inputSeparator)
					: [this.inText]).map(it => it.trim()).filter(Boolean);
				if (!chunks.length) return this.showWarning("No input!");

				chunks
					.reverse() // reverse as the append is actually a prepend
					.forEach((chunk, i) => {
						this.activeConverter.handleParse(
							chunk,
							this.doCleanAndOutput.bind(this),
							this.showWarning.bind(this),
							isAppend || i !== 0 // always clear the output for the first non-append chunk, then append
						);
					});
			});
		};

		$("#parsestatblock").on("click", () => doConversion(false));
		$(`#parsestatblockadd`).on("click", () => doConversion(true));

		this.initSideMenu();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	initSideMenu () {
		const $mnu = $(`.sidemenu`);

		const $selConverter = ComponentUiUtil.$getSelEnum(
			this,
			"converter",
			{
				values: [
					"Creature",
					// "Spell", // TODO uncomment when the spell converter is in a usable state
					"Table"
				],
				html: `<select class="form-control input-sm"/>`
			}
		);

		$$`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Mode</div>${$selConverter}</div>`
			.appendTo($mnu);

		ConverterUiUtil.renderSideMenuDivider($mnu);

		// region mult-part parsing options
		const $iptInputSeparator = ComponentUiUtil.$getIptStr(this, "inputSeparator", {html: `<input class="form-control input-sm">`}).addClass("code");
		$$`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label help mr-2" title="A separator used to mark the end of one to-be-converted entity (creature, spell, etc.) so that multiple entities can be converted in one run. If left blank, the entire input text will be parsed as one entity.">Separator</div>${$iptInputSeparator}</div>`
			.appendTo($mnu);

		ConverterUiUtil.renderSideMenuDivider($mnu);
		// endregion

		const $wrpConverters = $(`<div class="w-100 flex-col"/>`).appendTo($mnu);
		Object
			.keys(this._converters)
			.sort(SortUtil.ascSortLower)
			.forEach(k => this._converters[k].renderSidebar(this.getPod(), $wrpConverters))
	}

	showWarning (text) {
		$(`#lastWarnings`).show().append(`<div>[Warning] ${text}</div>`);
		this._editorOut.resize();
	}

	doCleanAndOutput (obj, append) {
		const asCleanString = CleanUtil.getCleanJson(obj);
		if (append) {
			this._outText = `${asCleanString},\n${this._outText}`;
			this._state.hasAppended = true;
		} else {
			this._outText = asCleanString;
			this._state.hasAppended = false;
		}
	}

	set _outReadOnly (val) { this._editorOut.setOptions({readOnly: val}); }

	get _outText () { return this._editorOut.getValue(); }
	set _outText (text) { return this._editorOut.setValue(text, -1); }

	get inText () { return CleanUtil.getCleanString((this._editorIn.getValue() || "").trim(), false); }
	set inText (text) { return this._editorIn.setValue(text, -1); }

	_getDefaultState () { return MiscUtil.copy(ConverterUi._DEFAULT_STATE); }
}
ConverterUi.STORAGE_INPUT = "converterInput";
ConverterUi.STORAGE_STATE = "converterState";
ConverterUi._DEFAULT_STATE = {
	hasAppended: false,
	converter: "Creature",
	sourceJson: "",
	inputSeparator: "==="
};

async function doPageInit () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	const [spellData, itemData] = await Promise.all([
		SpellcastingTraitConvert.pGetSpellData(),
		Renderer.item.pBuildList(),
		BrewUtil.pAddBrewData() // init homebrew
	]);
	SpellcastingTraitConvert.init(spellData);
	AcConvert.init(itemData);

	const ui = new ConverterUi();

	const statblockConverter = new SpellConverter(ui);
	const spellConverter = new CreatureConverter(ui);
	const tableConverter = new TableConverter(ui);

	ui.converters = {
		[statblockConverter.converterId]: statblockConverter,
		[spellConverter.converterId]: spellConverter,
		[tableConverter.converterId]: tableConverter
	};

	return ui.pInit();
}
