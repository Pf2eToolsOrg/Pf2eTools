"use strict";

window.addEventListener("load", () => doPageInit());

class ConverterUiUtil {
	static renderSideMenuDivider ($menu, heavy) { $menu.append(`<hr class="sidemenu__row__divider ${heavy ? "sidemenu__row__divider--heavy" : ""}">`); }
}

class ConverterUi extends BaseComponent {
	constructor () {
		super();

		this._editorIn = null;
		this._editorOut = null;

		this._converter = null;

		this._saveInputDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_INPUT, this._editorIn.getValue()), 50);
		this.saveSettingsDebounced = MiscUtil.debounce(() => StorageUtil.pSetForPage(ConverterUi.STORAGE_STATE, this.getBaseSaveableState()), 50);

		this._addHookAll("state", () => this.saveSettingsDebounced());
	}

	set converter (converter) { this._converter = converter; }

	async pInit () {
		// region load state
		const savedState = await StorageUtil.pGetForPage(ConverterUi.STORAGE_STATE);
		if (savedState) this.setBaseSaveableStateFrom(savedState);

		// forcibly overwrite available sources with fresh data
		this._state.availableSources = (BrewUtil.homebrewMeta.sources || []).sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
			.map(it => it.json);
		if (!this._state.availableSources.includes(this._state.source)) this._state.source = "";
		// endregion

		this._editorIn = ace.edit("converter_input");
		this._editorIn.setOptions({
			wrap: true,
			showPrintMargin: false,
		});
		try {
			const prevInput = await StorageUtil.pGetForPage(ConverterUi.STORAGE_INPUT);
			if (prevInput) this._editorIn.setValue(prevInput, -1);
		} catch (ignored) { setTimeout(() => { throw ignored; }); }
		this._editorIn.on("change", () => this._saveInputDebounced());

		this._editorOut = ace.edit("converter_output");
		this._editorOut.setOptions({
			wrap: true,
			showPrintMargin: false,
			readOnly: true,
		});

		await this._converter.init();

		$(`#editable`).click(() => {
			this._outReadOnly = false;
			JqueryUtil.doToast({type: "warning", content: "Enabled editing. Note that edits will be overwritten as you parse new statblocks."});
		});

		const $btnSaveLocal = $(`#save_local`).click(async () => {
			const output = this._outText;
			if (output && output.trim()) {
				try {
					const outJson = JSON.parse(output);
					const invalidSources = Object.values(outJson).flat().map(it => !it.source || !BrewUtil.hasSourceJson(it.source) ? (it.name || "(Unnamed)").trim() : false).filter(Boolean);
					if (invalidSources.length) {
						JqueryUtil.doToast({
							content: `One or more entries have missing or unknown sources: ${invalidSources.join(", ")}`,
							type: "danger",
						});
						return;
					}

					const dedupedJson = {};
					let numDupes = 0;
					Object.keys(outJson).forEach(prop => {
						const dupes = {};
						dedupedJson[prop] = outJson[prop].map(it => {
							const lSource = it.source.toLowerCase();
							const lName = it.name.toLowerCase();
							dupes[lSource] = dupes[lSource] || {};
							if (dupes[lSource][lName]) {
								numDupes += 1;
								return null;
							} else {
								dupes[lSource][lName] = true;
								return it;
							}
						}).filter(Boolean);
					});
					if (numDupes > 0) {
						JqueryUtil.doToast({
							type: "warning",
							content: `Ignored ${numDupes} duplicate ${numDupes === 1 ? "entry" : "entries"}`,
						});
					}

					const overwriteMeta = Object.keys(dedupedJson).map(prop => {
						return dedupedJson[prop].map(it => {
							const ix = (BrewUtil.homebrew[prop] || []).findIndex(bru => bru.name.toLowerCase() === it.name.toLowerCase() && bru.source.toLowerCase() === it.source.toLowerCase());
							if (~ix) {
								return {
									prop,
									isOverwrite: true,
									ix,
									entry: it,
								};
							} else return {entry: it, isOverwrite: false, prop};
						}).filter(Boolean);
					}).flat();

					const willOverwrite = overwriteMeta.map(it => it.isOverwrite).filter(Boolean);
					if (willOverwrite.length && !confirm(`This will overwrite ${willOverwrite.length} ${willOverwrite.length === 1 ? "entry" : "entries"}. Are you sure?`)) {
						return;
					}

					await Promise.all(overwriteMeta.map(meta => {
						if (meta.isOverwrite) {
							return BrewUtil.pUpdateEntryByIx(meta.prop, meta.ix, MiscUtil.copy(meta.entry));
						} else {
							return BrewUtil.pAddEntry(meta.prop, MiscUtil.copy(meta.entry));
						}
					}));

					JqueryUtil.doToast({
						type: "success",
						content: `Saved!`,
					});

					// TODO: Why?
					// Omnisearch.pAddToIndex("monster", overwriteMeta.filter(meta => !meta.isOverwrite).map(meta => meta.entry));
				} catch (e) {
					JqueryUtil.doToast({
						content: `Current output was not valid JSON!`,
						type: "danger",
					});
					setTimeout(() => { throw e; });
				}
			} else {
				JqueryUtil.doToast({
					content: "Nothing to save!",
					type: "danger",
				});
			}
		});

		$(`#download`).click(() => {
			const output = this._outText;
			if (output && output.trim()) {
				try {
					const out = JSON.parse(output);
					DataUtil.userDownload(`converter-output`, out);
				} catch (e) {
					JqueryUtil.doToast({
						content: `Current output was not valid JSON. Downloading as <span class="code">.txt</span> instead.`,
						type: "warning",
					});
					DataUtil.userDownloadText(`converter-output.txt`, output);
					setTimeout(() => { throw e; });
				}
			} else {
				JqueryUtil.doToast({
					content: "Nothing to download!",
					type: "danger",
				});
			}
		});

		/**
		 * Wrap a function in an error handler which will wipe the error output, and append future errors to it.
		 * @param pToRun
		 */
		const catchErrors = async (pToRun) => {
			try {
				$(`#lastWarnings`).hide().html("");
				$(`#lastError`).hide().html("");
				this._editorOut.resize();
				await pToRun();
			} catch (x) {
				const splitStack = x.stack.split("\n");
				const atPos = splitStack.length > 1 ? splitStack[1].trim() : "(Unknown location)";
				const message = `[Error] ${x.message} ${atPos}`;
				$(`#lastError`).show().html(message);
				this._editorOut.resize();
				setTimeout(() => { throw x; });
			}
		};

		const doConversion = (isAppend) => {
			catchErrors(async () => {
				if (
					!isAppend
					&& this._outText.length > 0
					&& !await InputUiUtil.pGetUserBoolean({title: "Are you Sure?", htmlDescription: "You're about to overwrite multiple entries. Are you sure?", textYes: "Yes", textNo: "Cancel"})
				) return;

				const opts = {
					source: this._state.source,
					initialPage: this._state.page,
					avgLineLength: 58,
				};
				const parsed = this._converter.parse(this.inText, opts);
				this.doCleanAndOutput(parsed, isAppend);
			});
		};

		$("#parsestatblock").on("click", () => doConversion(false));
		$(`#parsestatblockadd`).on("click", () => doConversion(true));

		this.initSideMenu();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	initSideMenu () {
		const $mnu = $(`.sidemenu`);

		// TODO: Allow for parsing of any number of different statblocks
		const $selConverter = ComponentUiUtil.$getSelEnum(
			this,
			"converter",
			{
				values: [
					"All",
				],
				html: `<select class="form-control input-sm"/>`,
			},
		);

		$$`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Mode</div>${$selConverter}</div>`
			.appendTo($mnu);

		ConverterUiUtil.renderSideMenuDivider($mnu);

		const $wrpSourcePart = $(`<div class="w-100 ve-flex-col"/>`).appendTo($mnu);
		const pod = this.getPod();
		this._renderSidebarPagePart(pod, $wrpSourcePart);
		this._renderSidebarSourcePart(pod, $wrpSourcePart);
	}

	_renderSidebarPagePart (parent, $wrpSidebar) {
		const $iptPage = ComponentUiUtil.$getIptInt(this, "page", 0, {html: `<input class="form-control input-sm text-right" style="max-width: 9rem;">`});
		$$`<div class="sidemenu__row split-v-center"><div class="sidemenu__row__label">Initial Page</div>${$iptPage}</div>`.appendTo($wrpSidebar);

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	_renderSidebarSourcePart (parent, $wrpSidebar) {
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
				},
			});
		};

		const $selSource = $$`
			<select class="form-control input-sm"><option value="">(None)</option></select>`
			.change(() => this._state.source = $selSource.val());

		$(`<option/>`, {val: "_divider", text: `\u2014`, disabled: true}).appendTo($selSource);

		Object.keys(Parser.SOURCE_JSON_TO_FULL)
			.forEach(src => $(`<option/>`, {val: src, text: Parser.sourceJsonToFull(src)}).appendTo($selSource));

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
					isHeight100: true,
					isUncappedHeight: true,
					cbClose: () => $wrpSourceOverlay.detach(),
				});
				$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
			});
		$$`<div class="sidemenu__row">${$btnSourceEdit}</div>`.appendTo($wrpSidebar);

		const $btnSourceAdd = $(`<button class="btn btn-default btn-sm">Add New Source</button>`).click(() => {
			rebuildStageSource({mode: "add"});
			modalMeta = UiUtil.getShowModal({
				isHeight100: true,
				isUncappedHeight: true,
				cbClose: () => $wrpSourceOverlay.detach(),
			});
			$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
		});
		$$`<div class="sidemenu__row">${$btnSourceAdd}</div>`.appendTo($wrpSidebar);

		const hkSource = () => {
			$selSource.val(this._state.source);
			$btnSourceEdit.toggle(![...Object.keys(Parser.SOURCE_JSON_TO_FULL), ""].includes(this._state.source));
		}
		hkSource();
		this._addHookBase("source", hkSource);

		const hkAvailSources = () => {
			const curSources = new Set($selSource.find(`option`).map((i, e) => $(e).val()));
			curSources.add("");
			const nxtSources = new Set(parent.get("availableSources"));
			nxtSources.add("");
			nxtSources.add("_divider");
			Object.keys(Parser.SOURCE_JSON_TO_FULL).forEach(it => nxtSources.add(it));

			const optionsToAdd = [];

			parent.get("availableSources").forEach(source => {
				nxtSources.add(source);
				if (!curSources.has(source)) {
					optionsToAdd.push(source);
				}
			});

			if (optionsToAdd.length) {
				const $optBrewLast = $selSource.find(`option[disabled]`).prev();
				optionsToAdd.forEach(source => {
					const fullSource = BrewUtil.sourceJsonToSource(source);
					$(`<option/>`, {val: fullSource.json, text: fullSource.full}).insertAfter($optBrewLast);
				});
			}

			const toDelete = CollectionUtil.setDiff(curSources, nxtSources);
			if (toDelete.size) $selSource.find(`option`).filter((i, e) => toDelete.has($(e).val())).remove();
		};
		parent.addHook("availableSources", hkAvailSources);
		hkAvailSources();

		ConverterUiUtil.renderSideMenuDivider($wrpSidebar);
	}

	showWarning (text) {
		$(`#lastWarnings`).show().append(`<div>[Warning] ${text}</div>`);
		this._editorOut.resize();
	}

	doCleanAndOutput (obj, append) {
		if (append) {
			// FIXME: Check if this._outText is malformed
			const out = MiscUtil.merge(JSON.parse(this._outText), obj);
			this._outText = CleanUtil.getCleanJson(out);
		} else {
			this._outText = CleanUtil.getCleanJson(obj);
		}
	}

	set _outReadOnly (val) { this._editorOut.setOptions({readOnly: val}); }

	get _outText () { return this._editorOut.getValue(); }
	set _outText (text) { this._editorOut.setValue(text, -1); }

	get inText () { return CleanUtil.getCleanString((this._editorIn.getValue() || "").trim()); }
	set inText (text) { this._editorIn.setValue(text, -1); }

	_getDefaultState () { return MiscUtil.copy(ConverterUi._DEFAULT_STATE); }
}
ConverterUi.STORAGE_INPUT = "converterInput";
ConverterUi.STORAGE_STATE = "converterState";
ConverterUi._DEFAULT_STATE = {
	converter: "All",
};

let converterUi;
async function doPageInit () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	// FIXME: Enable items tagging once we actually implement that
	const [spells, /* items, */ feats, traits, deities, actions] = await Promise.all([
		DataUtil.spell.pLoadAll(),
		// Renderer.item.pBuildList(),
		DataUtil.feat.loadJSON(),
		DataUtil.trait.loadJSON(),
		DataUtil.deity.loadJSON(),
		DataUtil.loadJSON(`${Renderer.get().baseUrl}data/actions.json`),
		BrewUtil.pAddBrewData(),
	]);
	await TagJsons.pInit({
		spells,
		// items,
		feats: feats.feat,
		traits: traits.trait,
		deities: deities.deity,
		actions: actions.action,
	})
	converterUi = new ConverterUi();
	converterUi.converter = new Converter({config: TokenizerUtils.defaultConfig, tokenizerUtilsClass: TokenizerUtils, cbWarn: converterUi.showWarning.bind(converterUi)});
	return converterUi.pInit();
}
