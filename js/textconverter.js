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
					// Omnisearch.pAddToIndex("creature", overwriteMeta.filter(meta => !meta.isOverwrite).map(meta => meta.entry));
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

		this.initHelp();
		this.initSettings();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	initHelp () {
		const $helpButton = $(`#help`);
		$helpButton.click(() => {
			const {$modalInner, doClose} = UiUtil.getShowModal({
				isHeight100: true,
				isUncappedHeight: true,
				isMaxWidth640p: true, // For being able to see the converter. Also looks prettier than the wide text.
				title: "Help",
			});

			$$`<div class="alert alert-warning"><p><b>Note:</b> This feature is still under development. We can't guarantee a bug-free experience.</p></div>`.appendTo($modalInner);
			$$`<p>The Text Converter converts properly formatted text (meaning, Pf2e Statblock formatting) into Pf2eTools data. Mainly tested and used on Paizo's PDFs, but it should also work for anything using Pf2e's formatting.</p>`.appendTo($modalInner);
			$$`<p>This page also allows you to create homebrew directly to the website. <b>Please note that everything is stored locally. If this websites cookies / local storage gets deleted, so is your homebrew. <u style="font-size:1.1em">Backup responsibly.</u></b> Currently you can only do so using <i>Save State to File</i> in Settings next to the Searchbar. An option to export the homebrew fully will be available in the future.</p>`.appendTo($modalInner);
			$$`<p>A simple way to start creating homebrew is to go to <i>Converter Settings</i>, select <i>Add New Source</i>, and enter your desired name and abbreviation for the homebrew; additional details optional. If the new source does not get selected in the dropdown menu above the button, select it. Leave the menu and <i>Parse</i> to your hearts content, upon which click <i>Save to Homebrew</i>.</p>`.appendTo($modalInner);
			$$`<p>You can convert multiple things at once by putting a new line between each separate entry. In <i>another</i> newline, you can also type in the page number, which will be used for the subsequent entries until a new page number is written.</p>`.appendTo($modalInner);
			$$`<p class="ve-muted">For more information on how to create homebrew, please go to our <a href="https://discord.gg/2hzNxErtVu">Discord</a>.</p>`.appendTo($modalInner);
			ConverterUiUtil.renderSideMenuDivider($modalInner);
			$$`<p class="ve-muted">You can click on and see examples below. The buttons also tell you what the Text Converter can currently convert. Anything outside of that (ex. classes, rituals, traps) is unavailable and has to be done manually.</p>`.appendTo($modalInner);
			const $wrpSamples = $$`<div class="w-100 mb-2"></div>`.appendTo($modalInner);
			const $getSampleBtn = (btnText, sample) => {
				return $(`<button class="btn btn-default btn-sm mr-2">${btnText}</button>`).on("click", () => this.inText = sample.trim());
			}
			$getSampleBtn("Sample Creature", ConverterUi.SAMPLE_CREATURE).appendTo($wrpSamples);
			$getSampleBtn("Sample Feat", ConverterUi.SAMPLE_FEAT).appendTo($wrpSamples);
			$getSampleBtn("Sample Item", ConverterUi.SAMPLE_ITEM).appendTo($wrpSamples);
			$getSampleBtn("Sample Spell", ConverterUi.SAMPLE_SPELL).appendTo($wrpSamples);
			$getSampleBtn("Sample Background", ConverterUi.SAMPLE_BACKGROUND).appendTo($wrpSamples);

			$(`<button class="btn btn-sm btn-primary mt-auto mb-2 w-20 flex-h-center center-block">OK</button>`).click(doClose).appendTo($modalInner);
		})
	}

	initSettings () {
		const $settingsButton = $(`#settings`);
		$settingsButton.click(() => {
			const {$modalInner, doClose} = UiUtil.getShowModal({
				isHeight100: true,
				isUncappedHeight: true,
				title: "Converter Settings",
			});

			const $wrpSourcePart = $(`<div class="w-100 ve-flex-col mt-2"/>`).appendTo($modalInner);
			const pod = this.getPod();
			this._renderSettingsSourcePart(pod, $wrpSourcePart);
			this._renderSettingsPagePart(pod, $wrpSourcePart);
			ConverterUiUtil.renderSideMenuDivider($modalInner);
			this._renderSettingsSelectMode(pod, $wrpSourcePart);

			$(`<button class="btn btn-sm btn-primary mt-auto mb-2 w-20 flex-h-center center-block">OK</button>`).click(doClose).appendTo($modalInner);
		})
	}

	_renderSettingsPagePart (parent, $wrp) {
		const $iptPage = ComponentUiUtil.$getIptInt(this, "page", 0, {html: `<input class="form-control input-sm text-right" style="max-width: 9rem;">`});
		$$`<div class="w-100 mb-2 split-v-center"><div class="pr-2 help" title="Determines what's the default page of the content you're converting. If left blank, assumes 0.\nThis has the same effect as putting the page number in front of the statblock. Any subsequent statblock after that will use that page number.">Initial Page</div>${$iptPage}</div>`.appendTo($wrp);
	}

	_renderSettingsSourcePart (parent, $wrp) {
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

		$$`<div class="w-100 mb-2 split-v-center"><div class="pr-2">Source</div>${$selSource}</div>`.appendTo($wrp);

		// TODO: Delete Source?
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

		const $btnSourceAdd = $(`<button class="btn btn-default btn-sm">Add New Source</button>`).click(() => {
			rebuildStageSource({mode: "add"});
			modalMeta = UiUtil.getShowModal({
				isHeight100: true,
				isUncappedHeight: true,
				cbClose: () => $wrpSourceOverlay.detach(),
			});
			$wrpSourceOverlay.appendTo(modalMeta.$modalInner);
		});
		$$`<div class="w-100 text-right mb-2">${$btnSourceEdit}${$btnSourceAdd}</div>`.appendTo($wrp);

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
	}

	_renderSettingsSelectMode (parent, $wrp) {
		// TODO:
	}

	showWarning (text) {
		$(`#lastWarnings`).show().append(`<div>[Warning] ${text}</div>`);
		this._editorOut.resize();
	}

	doCleanAndOutput (obj, append) {
		if (append) {
			// FIXME: Check if this._outText is malformed
			const mergeWith = this._outText.length ? JSON.parse(this._outText) : {};
			const out = MiscUtil.merge(mergeWith, obj);
			this._outText = CleanUtil.getCleanJson(out);
		} else {
			this._outText = CleanUtil.getCleanJson(obj);
		}
	}

	set _outReadOnly (val) { this._editorOut.setOptions({readOnly: val}); }

	get _outText () { return this._editorOut.getValue(); }
	set _outText (text) { this._editorOut.setValue(text, -1); }

	get inText () { return this._editorIn.getValue(); }
	set inText (text) { this._editorIn.setValue(text, -1); }

	_getDefaultState () { return MiscUtil.copy(ConverterUi._DEFAULT_STATE); }
}
ConverterUi.STORAGE_INPUT = "converterInput";
ConverterUi.STORAGE_STATE = "converterState";
ConverterUi._DEFAULT_STATE = {
	converter: "All",
};
ConverterUi.SAMPLE_SPELL = `
FIREBALL SPELL 3
EVOCATION FIRE
Traditions arcane, primal
Cast [two-actions] somatic, verbal
Range 500 feet; Area 20-foot burst
Saving Throw basic Reflex
A roaring blast of fire appears at a spot you designate, dealing
6d6 fire damage.
Heightened (+1) The damage increases by 2d6.`;
ConverterUi.SAMPLE_FEAT = `
REACTIVE DISTRACTION [reaction] FEAT 20
CONCENTRATE MANIPULATE ROGUE
Prerequisites legendary in Deception, Perfect Distraction
Trigger You would be hit by an attack or targeted by an effect,
or you are within an effect’s area.
Requirements You have Perfect Distraction ready to use.
You reactively switch with your decoy to foil your foe. You use
Perfection Distraction, even if you were observed, as long as
you end the movement of your Sneak while concealed or in a
location with cover or greater cover. Your decoy is targeted
by the attack or effect instead of you. In the case of an area
effect, if your Sneak doesn’t move you out of the area, both
you and the decoy are targeted by the effect.`;
ConverterUi.SAMPLE_ITEM = `
DECANTER OF ENDLESS WATER ITEM 7
CONJURATION MAGICAL WATER
Price 320 gp
Usage held in 2 hands; Bulk L
This item looks like an ordinary glass flask full of water.
The stopper can’t be removed unless you speak one of
the item’s three command words, each of which causes water
to pour forth in a different way. Pulling the stopper straight
out creates fresh water, and rotating it as you pull creates salt
water. Any effect of the decanter lasts until the decanter is
plugged (with its own stopper, a finger, or the like).
Activate [one-action] command, Interact; Effect Speaking “stream,”
you cause water to pour at a rate of 1 gallon per round.
Activate [one-action] command, Interact; Effect Speaking “fountain,”
you cause water to pour in a 5-foot-long stream at a rate
of 5 gallons per round.
Activate [one-action] command, Interact; Effect Speaking “geyser,”
you cause a powerful deluge of water to erupt at a
rate of 15 gallons per round. You can direct the
stream at a creature, subjecting it to the effects
of hydraulic push (spell attack roll +15). You
can repeat this once per round as long as the
geyser continues, spending an Interact
action to direct the geyser each time.`;
ConverterUi.SAMPLE_BACKGROUND = `
HERMIT BACKGROUND
In an isolated place—like a cave, remote oasis, or secluded
mansion—you lived a life of solitude. Adventuring might
represent your first foray out among other people in some time.
This might be a welcome reprieve from solitude or an unwanted
change, but in either case, you’re likely still rough around
the edges.
Choose two ability boosts. One must be to Constitution or
Intelligence, and one is a free ability boost.
You’re trained in the Nature or Occultism skill, plus a Lore
skill related to the terrain you lived in as a hermit (such as Cave
Lore or Desert Lore). You gain the Dubious Knowledge skill feat.`;
ConverterUi.SAMPLE_CREATURE = `
LICH CREATURE 12
RARE
NE
MEDIUM
UNDEAD
Perception +20; darkvision
Languages Abyssal, Aklo, Common, Draconic, Elf, Infernal, Necril, Undercommon
Skills Arcana +28, Crafting +24 (can craft magic items), Deception +17, Diplomacy +19, Religion +22, Stealth +20
Str +0, Dex +4, Con +0, Int +6, Wis +4, Cha +3
Items potion of invisibility, scroll of teleport, greater staff of fire
AC 31; Fort +17, Ref +21, Will +23; +1 status to all saves vs. positive
HP 190, negative healing, rejuvenation; Immunities death effects, disease, paralyzed, poison, unconscious; Resistances cold 10, physical 10 (except magic bludgeoning)
Frightful Presence (aura, emotion, fear, mental) 60 feet, DC 29
Counterspell [reaction] Trigger A creature casts a spell the lich has prepared. Effect The lich expends a prepared spell to counter the triggering creature’s casting of that same spell. The lich loses its spell slot as if it had cast the triggering spell. The lich then attempts to counteract the triggering spell.
Speed 25 feet
Melee [one-action] hand +24 (finesse, magical), Damage 4d8 negative plus paralyzing touch
Arcane Prepared Spells DC 36, attack +26; 6th chain lightning, dominate, vampiric exsanguination; 5th cloudkill, cone of cold (×2), wall of ice; 4th dimension door, dispel magic, fire shield, fly; 3rd blindness, locate, magic missile, vampiric touch; 2nd false life, mirror image, resist energy, see invisibility; 1st fleet step, ray of enfeeblement (×2), true strike; Cantrips (6th) detect magic, mage hand, message, ray of frost, shield
Drain Phylactery [free-action] 6th level
Paralyzing Touch (arcane, curse, incapacitation, necromancy) DC 32
Steady Spellcasting If a reaction would disrupt the lich’s spellcasting action, the lich attempts a DC 15 flat check. On a success, the action isn’t disrupted.`;

let converterUi;
async function doPageInit () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	converterUi = new ConverterUi();
	const converter = new Converter({config: TokenizerUtils.defaultConfig, tokenizerUtilsClass: TokenizerUtils, cbWarn: converterUi.showWarning.bind(converterUi)});
	await converter.init();
	converterUi.converter = converter;
	return converterUi.pInit();
}
