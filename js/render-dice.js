Renderer.dice = {
	SYSTEM_USER: {
		name: "Desna", // goddess of luck
	},
	POS_INFINITE: 100000000000000000000, // larger than this, and we start to see "e" numbers appear

	_$wrpRoll: null,
	_$minRoll: null,
	_$iptRoll: null,
	_$outRoll: null,
	_$head: null,
	_hist: [],
	_histIndex: null,
	_$lastRolledBy: null,
	_storage: null,

	_isManualMode: false,

	// region Utilities
	DICE: [4, 6, 8, 10, 12, 20, 100],
	getNextDice (faces) {
		const idx = Renderer.dice.DICE.indexOf(faces);
		if (~idx) return Renderer.dice.DICE[idx + 1];
		else return null;
	},

	getPreviousDice (faces) {
		const idx = Renderer.dice.DICE.indexOf(faces);
		if (~idx) return Renderer.dice.DICE[idx - 1];
		else return null;
	},
	// endregion

	// region GM Screen integration
	_panel: null,
	bindDmScreenPanel (panel, title) {
		if (Renderer.dice._panel) { // there can only be one roller box
			Renderer.dice.unbindDmScreenPanel();
		}
		Renderer.dice._showBox();
		Renderer.dice._panel = panel;
		panel.doPopulate_Rollbox(title);
	},

	unbindDmScreenPanel () {
		if (Renderer.dice._panel) {
			$(`body`).append(Renderer.dice._$wrpRoll);
			Renderer.dice._panel.close$TabContent();
			Renderer.dice._panel = null;
			Renderer.dice._hideBox();
			Renderer.dice._$wrpRoll.removeClass("rollbox-panel");
		}
	},

	get$Roller () {
		return Renderer.dice._$wrpRoll;
	},
	// endregion

	/**
	 * Silently roll an expression and get the result.
	 * Note that this does not support dynamic variables (e.g. user proficiency bonus).
	 */
	parseRandomise2 (str) {
		if (!str || !str.trim()) return null;
		const wrpTree = Renderer.dice.lang.getTree3(str);
		if (wrpTree) return wrpTree.tree.evl({});
		else return null;
	},

	/**
	 * Silently get the average of an expression.
	 * Note that this does not support dynamic variables (e.g. user proficiency bonus).
	 */
	parseAverage (str) {
		if (!str || !str.trim()) return null;
		const wrpTree = Renderer.dice.lang.getTree3(str);
		if (wrpTree) return wrpTree.tree.avg({});
		else return null;
	},

	// region Roll box UI
	_showBox () {
		if (Renderer.dice._$wrpRoll.css("display") !== "flex") {
			Renderer.dice._$minRoll.hide();
			Renderer.dice._$wrpRoll.css("display", "flex");
			Renderer.dice._$iptRoll.prop("placeholder", `${Renderer.dice._getRandomPlaceholder()} or "/help"`);
		}
	},

	_hideBox () {
		Renderer.dice._$minRoll.show();
		Renderer.dice._$wrpRoll.css("display", "");
	},

	_getRandomPlaceholder () {
		const count = RollerUtil.randomise(10);
		const faces = Renderer.dice.DICE[RollerUtil.randomise(Renderer.dice.DICE.length - 1)];
		const mod = (RollerUtil.randomise(3) - 2) * RollerUtil.randomise(10);
		const drop = (count > 1) && RollerUtil.randomise(5) === 5;
		const dropDir = drop ? RollerUtil.randomise(2) === 2 ? "h" : "l" : "";
		const dropAmount = drop ? RollerUtil.randomise(count - 1) : null;
		return `${count}d${faces}${drop ? `d${dropDir}${dropAmount}` : ""}${mod < 0 ? mod : mod > 0 ? `+${mod}` : ""}`;
	},

	/** Initialise the roll box UI. */
	async _pInit () {
		const $wrpRoll = $(`<div class="rollbox"></div>`);
		const $minRoll = $(`<div class="rollbox-min"><span class="glyphicon glyphicon-chevron-up"></span></div>`).on("click", () => {
			Renderer.dice._showBox();
			Renderer.dice._$iptRoll.focus();
		});
		const $head = $(`<div class="head-roll"><span class="hdr-roll">Dice Roller</span><span class="delete-icon glyphicon glyphicon-remove"></span></div>`)
			.on("click", () => {
				if (!Renderer.dice._panel) Renderer.dice._hideBox();
			});
		const $outRoll = $(`<div class="out-roll">`);
		const $iptRoll = $(`<input class="ipt-roll form-control" autocomplete="off" spellcheck="false">`)
			.on("keypress", async e => {
				if (e.which === 13) { // return
					await Renderer.dice.pRoll2($iptRoll.val(), {
						isUser: true,
						name: "Anon",
					});
					$iptRoll.val("");
				}
				e.stopPropagation();
			}).on("keydown", (e) => {
				// arrow keys only work on keydown
				if (e.which === 38) { // up arrow
					e.preventDefault();
					Renderer.dice._prevHistory();
				} else if (e.which === 40) { // down arrow
					e.preventDefault();
					Renderer.dice._nextHistory()
				}
			});
		$wrpRoll.append($head).append($outRoll).append($iptRoll);

		Renderer.dice._$wrpRoll = $wrpRoll;
		Renderer.dice._$minRoll = $minRoll;
		Renderer.dice._$head = $head;
		Renderer.dice._$outRoll = $outRoll;
		Renderer.dice._$iptRoll = $iptRoll;

		$(`body`).append($minRoll).append($wrpRoll);

		$wrpRoll.on("click", ".out-roll-item-code", (evt) => Renderer.dice._$iptRoll.val($(evt.target).text()).focus());

		Renderer.dice.storage = await StorageUtil.pGet(VeCt.STORAGE_ROLLER_MACRO) || {};
	},

	_prevHistory () { Renderer.dice._histIndex--; Renderer.dice._prevNextHistory_load(); },
	_nextHistory () { Renderer.dice._histIndex++; Renderer.dice._prevNextHistory_load(); },

	_prevNextHistory_load () {
		Renderer.dice._cleanHistoryIndex();
		const nxtVal = Renderer.dice._hist[Renderer.dice._histIndex];
		Renderer.dice._$iptRoll.val(nxtVal);
		if (nxtVal) Renderer.dice._$iptRoll[0].selectionStart = Renderer.dice._$iptRoll[0].selectionEnd = nxtVal.length;
	},

	_cleanHistoryIndex: () => {
		if (!Renderer.dice._hist.length) {
			Renderer.dice._histIndex = null;
		} else {
			Renderer.dice._histIndex = Math.min(Renderer.dice._hist.length, Math.max(Renderer.dice._histIndex, 0))
		}
	},

	_addHistory: (str) => {
		Renderer.dice._hist.push(str);
		// point index at the top of the stack
		Renderer.dice._histIndex = Renderer.dice._hist.length;
	},

	_scrollBottom: () => {
		Renderer.dice._$outRoll.scrollTop(1e10);
	},
	// endregion

	// region Event handling
	async pRollerClickUseData (evt, ele) {
		const $ele = $(ele);
		const rollData = $ele.data("packed-dice");
		let name = $ele.data("roll-name");
		let shiftKey = evt.shiftKey;
		let ctrlKey = evt.ctrlKey || evt.metaKey;

		const options = rollData.toRoll.split(";").map(it => it.trim()).filter(Boolean);

		let chosenRollData;
		if (options.length > 1) {
			const cpyRollData = MiscUtil.copy(rollData);
			const menu = ContextUtil.getMenu([
				new ContextUtil.Action(
					"Choose Roll",
					null,
					{isDisabled: true},
				),
				null,
				...options.map(it => new ContextUtil.Action(
					`Roll ${it}`,
					evt => {
						shiftKey = shiftKey || evt.shiftKey;
						ctrlKey = ctrlKey || (evt.ctrlKey || evt.metaKey);
						cpyRollData.toRoll = it;
						return cpyRollData
					},
				)),
			]);

			chosenRollData = await ContextUtil.pOpenMenu(evt, menu);
		} else chosenRollData = rollData;

		if (!chosenRollData) return;

		const rePrompt = /#\$prompt_number:?([^$]*)\$#/g;
		const results = [];
		let m;
		while ((m = rePrompt.exec(chosenRollData.toRoll))) {
			const optionsRaw = m[1];
			const opts = {};
			if (optionsRaw) {
				const spl = optionsRaw.split(",");
				spl.map(it => it.trim()).forEach(part => {
					const [k, v] = part.split("=").map(it => it.trim());
					switch (k) {
						case "min":
						case "max":
							opts[k] = Number(v); break;
						default:
							opts[k] = v; break;
					}
				});
			}

			if (opts.min == null) opts.min = 0;
			if (opts.max == null) opts.max = Renderer.dice.POS_INFINITE;
			if (opts.default == null) opts.default = 0;

			const input = await InputUiUtil.pGetUserNumber(opts);
			if (input == null) return;
			results.push(input);
		}

		const rollDataCpy = MiscUtil.copy(chosenRollData);
		rePrompt.lastIndex = 0;
		rollDataCpy.toRoll = rollDataCpy.toRoll.replace(rePrompt, () => results.shift());

		// If there's a prompt, prompt the user to select the dice
		let rollDataCpyToRoll;
		if (rollData.prompt) {
			const sortedKeys = Object.keys(rollDataCpy.prompt.options).sort(SortUtil.ascSortLower);
			const menu = ContextUtil.getMenu([
				new ContextUtil.Action(rollDataCpy.prompt.entry, null, {isDisabled: true}),
				null,
				...sortedKeys
					.map(it => {
						const title = rollDataCpy.prompt.mode === "psi"
							? `${it} point${it === "1" ? "" : "s"}`
							: `${Parser.spLevelToFull(it)} level`;

						return new ContextUtil.Action(
							title,
							evt => {
								shiftKey = shiftKey || evt.shiftKey;
								ctrlKey = ctrlKey || (evt.ctrlKey || evt.metaKey);

								const fromScaling = rollDataCpy.prompt.options[it];
								if (!fromScaling) {
									name = "";
									return rollDataCpy;
								} else {
									name = rollDataCpy.prompt.mode === "psi" ? `${it} psi activation` : `${Parser.spLevelToFull(it)}-level cast`;
									rollDataCpy.toRoll += `+${fromScaling}`;
									return rollDataCpy;
								}
							},
						)
					}),
			]);

			rollDataCpyToRoll = await ContextUtil.pOpenMenu(evt, menu);
		} else rollDataCpyToRoll = rollDataCpy;

		if (!rollDataCpyToRoll) return;
		await Renderer.dice.pRollerClick({shiftKey, ctrlKey}, ele, JSON.stringify(rollDataCpyToRoll), name);
	},

	__rerollNextInlineResult (ele) {
		const $ele = $(ele);
		const $result = $ele.next(`.result`);
		const r = Renderer.dice.__rollPackedData($ele);
		$result.text(r);
	},

	__rollPackedData ($ele) {
		// Note that this does not support dynamic variables (e.g. user proficiency bonus)
		const wrpTree = Renderer.dice.lang.getTree3($ele.data("packed-dice").toRoll);
		return wrpTree.tree.evl({});
	},

	_pRollerClick_getMsgBug (total) { return `<span class="message">No result found matching roll ${total}?! <span class="help--subtle" title="Bug!">🐛</span></span>`; },

	async pRollerClick (evtMock, ele, packed, name) {
		const $ele = $(ele);
		const entry = JSON.parse(packed);
		function attemptToGetNameOfRoll () {
			// try use table caption
			let titleMaybe = $(ele).closest(`table:not(.stats)`).children(`caption`).text();
			if (titleMaybe) return titleMaybe.trim();

			// try use list item title
			titleMaybe = $(ele).parent().children(`.list-item-title`).text();
			if (titleMaybe) return titleMaybe.trim();

			// use the section title, where applicable
			titleMaybe = $(ele).closest(`div`).children(`.rd__h`).first().find(`.entry-title-inner`).text();
			if (titleMaybe) {
				titleMaybe = titleMaybe.trim().replace(/[.,:]\s*$/, "");
				return titleMaybe;
			}

			return titleMaybe;
		}

		function attemptToGetNameOfRoller () {
			const $hov = $ele.closest(`.hwin`);
			if ($hov.length) return $hov.find(`.stats-name`).first().text();
			const $roll = $ele.closest(`.out-roll-wrp`);
			if ($roll.length) return $roll.data("name");
			const $dispPanelTitle = $ele.closest(`.gm-screen-panel`).children(`.panel-control-title`);
			if ($dispPanelTitle.length) return $dispPanelTitle.text().trim();
			let name = document.title.replace("- Pf2eTools", "").trim();
			return name === "GM Screen" ? "Game Master" : name;
		}

		function _$getRowFromTotal (total) {
			let $table = $ele;
			while ($table.length) {
				if ($table.hasClass("pf2-table")) break;
				else if ($table.children(".pf2-table").length) {
					$table = $table.children(".pf2-table").first();
					break;
				}
				$table = $table.parent();
			}
			const $cells = $table.find(`.pf2-table__entry`).filter((i, e) => {
				const $e = $(e);
				if (!$e.closest(`.pf2-table`).is($table)) return false;
				return total >= Number($e.data("roll-min")) && total <= Number($e.data("roll-max"));
			});
			if ($cells.length) return $cells.get();
			return null;
		}

		function _rollInlineRollers ($ele) {
			$ele.find(`.render-roller`).each((i, e) => {
				const $e = $(e);
				const r = Renderer.dice.__rollPackedData($e);
				$e.attr("onclick", `Renderer.dice.__rerollNextInlineResult(this)`);
				$e.after(` (<span class="result">${r}</span>)`);
			});
		}

		function fnGetMessageTable (total) {
			const eles = _$getRowFromTotal(total);
			if (eles) {
				const tableRow = eles.map(ele => ele.innerHTML.trim()).filter(it => it).join(" | ");
				const $row = $(`<span class="message">${tableRow}</span>`);
				_rollInlineRollers($ele);
				return $row.html();
			}
			return Renderer.dice._pRollerClick_getMsgBug(total);
		}

		const rolledBy = {
			name: attemptToGetNameOfRoller(),
			label: name != null ? name : attemptToGetNameOfRoll(ele),
		};

		const modRollMeta = Renderer.dice.getEventModifiedRollMeta(evtMock, entry);
		const isRollOnTableCell = ($ele) => {
			let $parent = $ele.parent();
			let isLabel = false
			while ($parent.length) {
				if ($parent.hasClass("pf2-table__label")) isLabel = true;
				if ($parent.hasClass("pf2-table--rollable")) return isLabel;
				$parent = $parent.parent();
			}
			return false;
		}
		if (isRollOnTableCell($ele) || modRollMeta.entry.onTable) {
			Renderer.dice.pRollEntry(modRollMeta.entry, rolledBy, {fnGetMessage: fnGetMessageTable, rollCount: modRollMeta.rollCount});
		} else Renderer.dice.pRollEntry(modRollMeta.entry, rolledBy, {rollCount: modRollMeta.rollCount});
	},

	getEventModifiedRollMeta (evt, entry) {
		// Change roll type/count depending on CTRL/SHIFT status
		const out = {rollCount: 1, entry};

		if (evt.shiftKey) {
			if (entry.subType === "damage") { // If SHIFT is held, roll crit
				const dice = [];
				// TODO(future) in order for this to correctly catch everything, would need to parse the toRoll as a tree and then pull all dice expressions from the first level of that tree
				entry.toRoll = `(${entry.toRoll}) * 2`;
			} else if (entry.subType === "d20") { // If SHIFT is held, roll advantage
				// If we have a cached d20mod value, use it
				if (entry.d20mod != null) entry.toRoll = `2d20dl1${entry.d20mod}`;
				else entry.toRoll = entry.toRoll.replace(/^\s*1?\s*d\s*20/, "2d20dl1");
			} else out.rollCount = 2; // otherwise, just roll twice
		}

		if (evt.ctrlKey || evt.metaKey) {
			if (entry.subType === "damage") { // If CTRL is held, half the damage
				entry.toRoll = `floor((${entry.toRoll}) / 2)`;
			} else if (entry.subType === "d20") { // If CTRL is held, roll disadvantage (assuming SHIFT is not held)
				// If we have a cached d20mod value, use it
				if (entry.d20mod != null) entry.toRoll = `2d20dh1${entry.d20mod}`;
				else entry.toRoll = entry.toRoll.replace(/^\s*1?\s*d\s*20/, "2d20dh1");
			} else out.rollCount = 2; // otherwise, just roll twice
		}

		return out;
	},
	// endregion

	/**
	 * Parse and roll a string, and display the result in the roll box.
	 * Returns the total rolled, if available.
	 * @param str
	 * @param rolledBy
	 * @param rolledBy.isUser
	 * @param rolledBy.name The name of the roller.
	 * @param rolledBy.label The label for this roll.
	 * @param [opts] Options object.
	 * @param [opts.isResultUsed] If an input box should be provided for the user to enter the result (manual mode only).
	 */
	async pRoll2 (str, rolledBy, opts) {
		opts = opts || {};
		str = str
			.trim()
			.replace(/\/r(?:oll)? /gi, "").trim() // Remove any leading "/r"s, for ease of use
		;
		if (!str) return;
		if (rolledBy.isUser) Renderer.dice._addHistory(str);

		if (str.startsWith("/")) Renderer.dice._handleCommand(str, rolledBy);
		else if (str.startsWith("#")) return Renderer.dice._pHandleSavedRoll(str, rolledBy, opts);
		else {
			const [head, ...tail] = str.split(":");
			if (tail.length) {
				str = tail.join(":");
				rolledBy.label = head;
			}
			const wrpTree = Renderer.dice.lang.getTree3(str);
			return Renderer.dice._pHandleRoll2(wrpTree, rolledBy, opts);
		}
	},

	/**
	 * Parse and roll an entry, and display the result in the roll box.
	 * Returns the total rolled, if available.
	 * @param entry
	 * @param rolledBy
	 * @param [opts] Options object.
	 * @param [opts.isResultUsed] If an input box should be provided for the user to enter the result (manual mode only).
	 * @param [opts.rollCount]
	 */
	async pRollEntry (entry, rolledBy, opts) {
		opts = opts || {};

		const rollCount = Math.round(opts.rollCount || 1);
		delete opts.rollCount;
		if (rollCount <= 0) throw new Error(`Invalid roll count: ${rollCount} (must be a positive integer)`);

		const wrpTree = Renderer.dice.lang.getTree3(entry.toRoll);
		wrpTree.tree.successThresh = entry.successThresh;
		wrpTree.tree.successMax = entry.successMax;

		// arbitrarily return the result of the highest roll if we roll multiple times
		const results = [];
		if (rollCount > 1) Renderer.dice._showMessage(`Rolling twice...`, rolledBy);
		for (let i = 0; i < rollCount; ++i) {
			const result = await Renderer.dice._pHandleRoll2(wrpTree, rolledBy, opts);
			if (result == null) return null;
			results.push(result);
		}
		return Math.max(...results);
	},

	/**
	 * @param wrpTree
	 * @param rolledBy
	 * @param [opts] Options object.
	 * @param [opts.fnGetMessage]
	 * @param [opts.isResultUsed]
	 */
	async _pHandleRoll2 (wrpTree, rolledBy, opts) {
		opts = opts || {};

		if (wrpTree.meta && wrpTree.meta.hasPb) {
			const userPb = await InputUiUtil.pGetUserNumber({
				min: 0,
				int: true,
				title: "Enter Proficiency Bonus",
				default: 2,
				storageKey_default: "dice.playerProficiencyBonus",
				isGlobal_default: true,
			});
			if (userPb == null) return null;
			opts.pb = userPb;
		}

		if (Renderer.dice._isManualMode) return Renderer.dice._pHandleRoll2_manual(wrpTree.tree, rolledBy, opts);
		else return Renderer.dice._pHandleRoll2_automatic(wrpTree.tree, rolledBy, opts);
	},

	/**
	 * @param tree
	 * @param rolledBy
	 * @param [opts] Options object.
	 * @param [opts.fnGetMessage]
	 * @param [opts.pb] User-entered proficiency bonus, to be propagated to the meta.
	 */
	_pHandleRoll2_automatic (tree, rolledBy, opts) {
		opts = opts || {};

		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		const $out = Renderer.dice._$lastRolledBy;

		if (tree) {
			const meta = {};
			if (opts.pb) meta.pb = opts.pb;
			const result = tree.evl(meta);
			const fullHtml = (meta.html || []).join("");
			const allMax = meta.allMax && meta.allMax.length && !(meta.allMax.filter(it => !it).length);
			const allMin = meta.allMin && meta.allMin.length && !(meta.allMin.filter(it => !it).length);

			const lbl = rolledBy.label && (!rolledBy.name || rolledBy.label.trim().toLowerCase() !== rolledBy.name.trim().toLowerCase()) ? rolledBy.label : null;

			const totalPart = tree.successThresh
				? `<span class="roll">${result > (tree.successMax || 100) - tree.successThresh ? "Success!" : "Failure"}</span>`
				: `<span class="roll ${allMax ? "roll-max" : allMin ? "roll-min" : ""}">${result}</span>`;

			const title = `${rolledBy.name ? `${rolledBy.name} \u2014 ` : ""}${lbl ? `${lbl}: ` : ""}${tree}`;

			$out.append(`
				<div class="out-roll-item" title="${title}">
					<div>
						${lbl ? `<span class="roll-label">${lbl}: </span>` : ""}
						${totalPart}
						<span class="all-rolls ve-muted">${fullHtml}</span>
						${opts.fnGetMessage ? `<span class="message">${opts.fnGetMessage(result)}</span>` : ""}
					</div>
					<div class="out-roll-item-button-wrp">
						<button title="Copy to input" class="btn btn-default btn-xs btn-copy-roll" onclick="Renderer.dice._$iptRoll.val('${tree.toString().replace(/\s+/g, "")}'); Renderer.dice._$iptRoll.focus()"><span class="glyphicon glyphicon-pencil"></span></button>
					</div>
				</div>`);

			ExtensionUtil.doSendRoll({dice: tree.toString(), rolledBy: rolledBy.name, label: lbl});

			Renderer.dice._scrollBottom();
			return result;
		} else {
			$out.append(`<div class="out-roll-item">Invalid input! Try &quot;/help&quot;</div>`);
			Renderer.dice._scrollBottom();
			return null;
		}
	},

	_pHandleRoll2_manual (tree, rolledBy, opts) {
		opts = opts || {};

		if (!tree) return JqueryUtil.doToast({type: "danger", content: `Invalid roll input!`});

		const title = (rolledBy.label || "").toTitleCase() || "Roll Dice";
		const $dispDice = $(`<div class="p-2 bold flex-vh-center rll__prompt-header">${tree.toString()}</div>`);
		if (opts.isResultUsed) {
			return InputUiUtil.pGetUserNumber({
				title,
				$elePre: $dispDice,
			});
		} else {
			const {$modalInner} = UiUtil.getShowModal({
				title,
				isMinHeight0: true,
			});
			$dispDice.appendTo($modalInner);
			return null;
		}
	},

	_showMessage (message, rolledBy) {
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		const $out = Renderer.dice._$lastRolledBy;
		$out.append(`<div class="out-roll-item out-roll-item--message">${message}</div>`);
		Renderer.dice._scrollBottom();
	},

	_validCommands: new Set(["/c", "/cls", "/clear"]),
	_handleCommand (com, rolledBy) {
		Renderer.dice._showMessage(`<span class="out-roll-item-code">${com}</span>`, rolledBy); // parrot the user's command back to them
		const PREF_MACRO = "/macro";
		function showInvalid () {
			Renderer.dice._showMessage("Invalid input! Try &quot;/help&quot;", Renderer.dice.SYSTEM_USER);
		}

		function checkLength (arr, desired) {
			return arr.length === desired;
		}

		async function pSave () {
			await StorageUtil.pSet(VeCt.STORAGE_ROLLER_MACRO, Renderer.dice.storage);
		}

		if (com === "/help" || com === "/h") {
			Renderer.dice._showMessage(
				`<ul class="rll__list">
					<li>Keep highest; <span class="out-roll-item-code">4d6kh3</span></li>
					<li>Drop lowest; <span class="out-roll-item-code">4d6dl1</span></li>
					<li>Drop highest; <span class="out-roll-item-code">3d4dh1</span></li>
					<li>Keep lowest; <span class="out-roll-item-code">3d4kl1</span></li>

					<li>Reroll equal; <span class="out-roll-item-code">2d4r1</span></li>
					<li>Reroll less; <span class="out-roll-item-code">2d4r&lt;2</span></li>
					<li>Reroll less or equal; <span class="out-roll-item-code">2d4r&lt;=2</span></li>
					<li>Reroll greater; <span class="out-roll-item-code">2d4r&gt;2</span></li>
					<li>Reroll greater equal; <span class="out-roll-item-code">2d4r&gt;=3</span></li>

					<li>Explode equal; <span class="out-roll-item-code">2d4x4</span></li>
					<li>Explode less; <span class="out-roll-item-code">2d4x&lt;2</span></li>
					<li>Explode less or equal; <span class="out-roll-item-code">2d4x&lt;=2</span></li>
					<li>Explode greater; <span class="out-roll-item-code">2d4x&gt;2</span></li>
					<li>Explode greater equal; <span class="out-roll-item-code">2d4x&gt;=3</span></li>

					<li>Count Successes equal; <span class="out-roll-item-code">2d4cs=4</span></li>
					<li>Count Successes less; <span class="out-roll-item-code">2d4cs&lt;2</span></li>
					<li>Count Successes less or equal; <span class="out-roll-item-code">2d4cs&lt;=2</span></li>
					<li>Count Successes greater; <span class="out-roll-item-code">2d4cs&gt;2</span></li>
					<li>Count Successes greater equal; <span class="out-roll-item-code">2d4cs&gt;=3</span></li>

					<li>Margin of Success; <span class="out-roll-item-code">2d4ms=4</span></li>

					<li>Dice pools; <span class="out-roll-item-code">{2d8, 1d6}</span></li>
					<li>Dice pools with modifiers; <span class="out-roll-item-code">{1d20+7, 10}kh1</span></li>

					<li>Rounding; <span class="out-roll-item-code">floor(1.5)</span>, <span class="out-roll-item-code">ceil(1.5)</span>, <span class="out-roll-item-code">round(1.5)</span></li>

					<li>Average; <span class="out-roll-item-code">avg(8d6)</span></li>
				</ul>
				Up and down arrow keys cycle input history.<br>
				Anything before a colon is treated as a label (<span class="out-roll-item-code">Fireball: 6d6</span>)<br>
Use <span class="out-roll-item-code">${PREF_MACRO} list</span> to list saved macros.<br>
				Use <span class="out-roll-item-code">${PREF_MACRO} add myName 1d2+3</span> to add (or update) a macro. Macro names should not contain spaces or hashes.<br>
				Use <span class="out-roll-item-code">${PREF_MACRO} remove myName</span> to remove a macro.<br>
				Use <span class="out-roll-item-code">#myName</span> to roll a macro.<br>
				Use <span class="out-roll-item-code">/clear</span> to clear the roller.`,
				Renderer.dice.SYSTEM_USER,
			);
		} else if (com.startsWith(PREF_MACRO)) {
			const [_, mode, ...others] = com.split(/\s+/);

			if (!["list", "add", "remove", "clear"].includes(mode)) showInvalid();
			else {
				switch (mode) {
					case "list":
						if (checkLength(others, 0)) {
							Object.keys(Renderer.dice.storage).forEach(name => {
								Renderer.dice._showMessage(`<span class="out-roll-item-code">#${name}</span> \u2014 ${Renderer.dice.storage[name]}`, Renderer.dice.SYSTEM_USER);
							})
						} else {
							showInvalid();
						}
						break;
					case "add": {
						if (checkLength(others, 2)) {
							const [name, macro] = others;
							if (name.includes(" ") || name.includes("#")) showInvalid();
							else {
								Renderer.dice.storage[name] = macro;
								pSave()
									.then(() => Renderer.dice._showMessage(`Saved macro <span class="out-roll-item-code">#${name}</span>`, Renderer.dice.SYSTEM_USER));
							}
						} else {
							showInvalid();
						}
						break;
					}
					case "remove":
						if (checkLength(others, 1)) {
							if (Renderer.dice.storage[others[0]]) {
								delete Renderer.dice.storage[others[0]];
								pSave()
									.then(() => Renderer.dice._showMessage(`Removed macro <span class="out-roll-item-code">#${others[0]}</span>`, Renderer.dice.SYSTEM_USER));
							} else {
								Renderer.dice._showMessage(`Macro <span class="out-roll-item-code">#${others[0]}</span> not found`, Renderer.dice.SYSTEM_USER);
							}
						} else {
							showInvalid();
						}
						break;
				}
			}
		} else if (Renderer.dice._validCommands.has(com)) {
			switch (com) {
				case "/c":
				case "/cls":
				case "/clear":
					Renderer.dice._$outRoll.empty();
					Renderer.dice._$lastRolledBy.empty();
					Renderer.dice._$lastRolledBy = null;
					break;
			}
		} else showInvalid();
	},

	_pHandleSavedRoll (id, rolledBy, opts) {
		id = id.replace(/^#/, "");
		const macro = Renderer.dice.storage[id];
		if (macro) {
			rolledBy.label = id;
			const wrpTree = Renderer.dice.lang.getTree3(macro);
			return Renderer.dice._pHandleRoll2(wrpTree, rolledBy, opts);
		} else Renderer.dice._showMessage(`Macro <span class="out-roll-item-code">#${id}</span> not found`, Renderer.dice.SYSTEM_USER);
	},

	addRoll (rolledBy, msgText) {
		if (!msgText.trim()) return;
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		Renderer.dice._$outRoll.prepend(`<div class="out-roll-item" title="${rolledBy.name || ""}">${msgText}</div>`);
		Renderer.dice._scrollBottom();
	},

	addElement (rolledBy, $ele) {
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		$$`<div class="out-roll-item out-roll-item--message">${$ele}</div>`.appendTo(Renderer.dice._$lastRolledBy);
		Renderer.dice._scrollBottom();
	},

	_checkHandleName (name) {
		if (!Renderer.dice._$lastRolledBy || Renderer.dice._$lastRolledBy.data("name") !== name) {
			Renderer.dice._$outRoll.prepend(`<div class="ve-muted out-roll-id">${name}</div>`);
			Renderer.dice._$lastRolledBy = $(`<div class="out-roll-wrp"></div>`).data("name", name);
			Renderer.dice._$outRoll.prepend(Renderer.dice._$lastRolledBy);
		}
	},
};

Renderer.dice.lang = {
	// region Public API
	validate3 (str) {
		str = str.trim();

		// region Lexing
		let lexed;
		try {
			lexed = Renderer.dice.lang._lex3(str).lexed;
		} catch (e) {
			return e.message;
		}
		// endregion

		// region Parsing
		try {
			Renderer.dice.lang._parse3(lexed);
		} catch (e) {
			return e.message;
		}
		// endregion

		return null;
	},

	getTree3 (str, isSilent = true) {
		str = str.trim();
		if (isSilent) {
			try {
				const {lexed, lexedMeta} = Renderer.dice.lang._lex3(str);
				return {tree: Renderer.dice.lang._parse3(lexed), meta: lexedMeta};
			} catch (e) {
				return null;
			}
		} else {
			const {lexed, lexedMeta} = Renderer.dice.lang._lex3(str);
			return {tree: Renderer.dice.lang._parse3(lexed), meta: lexedMeta};
		}
	},
	// endregion

	// region Lexer
	_M_NUMBER_CHAR: /[0-9.]/,
	_M_SYMBOL_CHAR: /[-+/*^=><florceidhkxunavgsmpb,]/,

	_M_NUMBER: /^[\d.,]+$/,
	_lex3 (str) {
		const self = {
			tokenStack: [],
			parenCount: 0,
			braceCount: 0,
			mode: null,
			token: "",
			hasPb: false,
		};

		str = str
			.trim()
			.toLowerCase()
			// region Convert some natural language
			.replace(/\s+plus\s+/g, " + ")
			.replace(/\s+minus\s+/g, " - ")
			.replace(/\s+times\s+/g, " * ")
			// endregion
			.replace(/\s+/g, "")
			.replace(/[×]/g, "*") // convert mult signs
			.replace(/\*\*/g, "^") // convert ** to ^
			.replace(/÷/g, "/") // convert div signs
			.replace(/--/g, "+") // convert double negatives
			.replace(/\+-|-\+/g, "-") // convert negatives
		;

		if (!str) return {lexed: [], lexedMeta: {}};

		this._lex3_lex(self, str);

		return {lexed: self.tokenStack, lexedMeta: {hasPb: self.hasPb}};
	},

	_lex3_lex (self, l) {
		const len = l.length;

		for (let i = 0; i < len; ++i) {
			const c = l[i];

			switch (c) {
				case "(":
					self.parenCount++;
					this._lex3_outputToken(self);
					self.token = "(";
					this._lex3_outputToken(self);
					break;
				case ")":
					self.parenCount--;
					if (self.parenCount < 0) throw new Error(`Syntax error: closing <code>)</code> without opening <code>(</code>`);
					this._lex3_outputToken(self);
					self.token = ")";
					this._lex3_outputToken(self);
					break;
				case "{":
					self.braceCount++;
					this._lex3_outputToken(self);
					self.token = "{";
					this._lex3_outputToken(self);
					break;
				case "}":
					self.braceCount--;
					if (self.parenCount < 0) throw new Error(`Syntax error: closing <code>}</code> without opening <code>(</code>`);
					this._lex3_outputToken(self);
					self.token = "}";
					this._lex3_outputToken(self);
					break;
				// single-character operators
				case "+": case "-": case "*": case "/": case "^": case ",":
					this._lex3_outputToken(self);
					self.token += c;
					this._lex3_outputToken(self);
					break;
				default: {
					if (Renderer.dice.lang._M_NUMBER_CHAR.test(c)) {
						if (self.mode === "symbol") this._lex3_outputToken(self);
						self.token += c;
						self.mode = "text";
					} else if (Renderer.dice.lang._M_SYMBOL_CHAR.test(c)) {
						if (self.mode === "text") this._lex3_outputToken(self);
						self.token += c;
						self.mode = "symbol";
					} else throw new Error(`Syntax error: unexpected character <code>${c}</code>`);
					break;
				}
			}
		}

		// empty the stack of any remaining content
		this._lex3_outputToken(self);
	},

	_lex3_outputToken (self) {
		if (!self.token) return;

		switch (self.token) {
			case "(": self.tokenStack.push(Renderer.dice.tk.PAREN_OPEN); break;
			case ")": self.tokenStack.push(Renderer.dice.tk.PAREN_CLOSE); break;
			case "{": self.tokenStack.push(Renderer.dice.tk.BRACE_OPEN); break;
			case "}": self.tokenStack.push(Renderer.dice.tk.BRACE_CLOSE); break;
			case ",": self.tokenStack.push(Renderer.dice.tk.COMMA); break;
			case "+": self.tokenStack.push(Renderer.dice.tk.ADD); break;
			case "-": self.tokenStack.push(Renderer.dice.tk.SUB); break;
			case "*": self.tokenStack.push(Renderer.dice.tk.MULT); break;
			case "/": self.tokenStack.push(Renderer.dice.tk.DIV); break;
			case "^": self.tokenStack.push(Renderer.dice.tk.POW); break;
			case "pb": self.tokenStack.push(Renderer.dice.tk.PB); self.hasPb = true; break;
			case "floor": self.tokenStack.push(Renderer.dice.tk.FLOOR); break;
			case "ceil": self.tokenStack.push(Renderer.dice.tk.CEIL); break;
			case "round": self.tokenStack.push(Renderer.dice.tk.ROUND); break;
			case "avg": self.tokenStack.push(Renderer.dice.tk.AVERAGE); break;
			case "d": self.tokenStack.push(Renderer.dice.tk.DICE); break;
			case "dh": self.tokenStack.push(Renderer.dice.tk.DROP_HIGHEST); break;
			case "kh": self.tokenStack.push(Renderer.dice.tk.KEEP_HIGHEST); break;
			case "dl": self.tokenStack.push(Renderer.dice.tk.DROP_LOWEST); break;
			case "kl": self.tokenStack.push(Renderer.dice.tk.KEEP_LOWEST); break;
			case "r": self.tokenStack.push(Renderer.dice.tk.REROLL_EXACT); break;
			case "r>": self.tokenStack.push(Renderer.dice.tk.REROLL_GT); break;
			case "r>=": self.tokenStack.push(Renderer.dice.tk.REROLL_GTEQ); break;
			case "r<": self.tokenStack.push(Renderer.dice.tk.REROLL_LT); break;
			case "r<=": self.tokenStack.push(Renderer.dice.tk.REROLL_LTEQ); break;
			case "x": self.tokenStack.push(Renderer.dice.tk.EXPLODE_EXACT); break;
			case "x>": self.tokenStack.push(Renderer.dice.tk.EXPLODE_GT); break;
			case "x>=": self.tokenStack.push(Renderer.dice.tk.EXPLODE_GTEQ); break;
			case "x<": self.tokenStack.push(Renderer.dice.tk.EXPLODE_LT); break;
			case "x<=": self.tokenStack.push(Renderer.dice.tk.EXPLODE_LTEQ); break;
			case "cs=": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_EXACT); break;
			case "cs>": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_GT); break;
			case "cs>=": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_GTEQ); break;
			case "cs<": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_LT); break;
			case "cs<=": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_LTEQ); break;
			case "ms=": self.tokenStack.push(Renderer.dice.tk.MARGIN_SUCCESS_EXACT); break;
			case "ms>": self.tokenStack.push(Renderer.dice.tk.MARGIN_SUCCESS_GT); break;
			case "ms>=": self.tokenStack.push(Renderer.dice.tk.MARGIN_SUCCESS_GTEQ); break;
			case "ms<": self.tokenStack.push(Renderer.dice.tk.MARGIN_SUCCESS_LT); break;
			case "ms<=": self.tokenStack.push(Renderer.dice.tk.MARGIN_SUCCESS_LTEQ); break;
			default: {
				if (Renderer.dice.lang._M_NUMBER.test(self.token)) {
					if (self.token.split(Parser._decimalSeparator).length > 2) throw new Error(`Syntax error: too many decimal separators <code>${self.token}</code>`);
					self.tokenStack.push(Renderer.dice.tk.NUMBER(self.token));
				} else throw new Error(`Syntax error: unexpected token <code>${self.token}</code>`);
			}
		}

		self.token = "";
	},
	// endregion

	// region Parser
	_parse3 (lexed) {
		const self = {
			ixSym: -1,
			syms: lexed,
			sym: null,
			lastAccepted: null,
		};

		this._parse3_nextSym(self);
		return this._parse3_expression(self);
	},

	_parse3_nextSym (self) {
		const cur = self.syms[self.ixSym];
		self.ixSym++;
		self.sym = self.syms[self.ixSym];
		return cur;
	},

	_parse3_match (self, symbol) {
		if (self.sym == null) return false;
		if (symbol.type) symbol = symbol.type; // If it's a typed token, convert it to its underlying type
		return self.sym.type === symbol;
	},

	_parse3_accept (self, symbol) {
		if (this._parse3_match(self, symbol)) {
			const out = self.sym;
			this._parse3_nextSym(self);
			self.lastAccepted = out;
			return out;
		}
		return false;
	},

	_parse3_expect (self, symbol) {
		const accepted = this._parse3_accept(self, symbol);
		if (accepted) return accepted;
		if (self.sym) throw new Error(`Unexpected input: Expected <code>${symbol}</code> but found <code>${self.sym}</code>`);
		else throw new Error(`Unexpected end of input: Expected <code>${symbol}</code>`);
	},

	_parse3_factor (self) {
		if (this._parse3_accept(self, Renderer.dice.tk.TYP_NUMBER)) {
			// Workaround for comma-separated numbers--if we're inside a dice pool, treat the commas as dice pool separators.
			//   Otherwise, merge together adjacent numbers.
			let braceCount = 0;
			self.syms.find(it => {
				if (it.type === Renderer.dice.tk.BRACE_OPEN.type) braceCount++;
				else if (it.type === Renderer.dice.tk.BRACE_CLOSE.type) braceCount--;
				return it === self.sym;
			});

			if (braceCount) {
				return new Renderer.dice.parsed.Factor(self.lastAccepted);
			} else {
				// Combine comma-separated parts
				const syms = [self.lastAccepted];
				while (this._parse3_accept(self, Renderer.dice.tk.COMMA)) {
					const sym = this._parse3_expect(self, Renderer.dice.tk.TYP_NUMBER);
					syms.push(sym);
				}
				const sym = Renderer.dice.tk.NUMBER(syms.map(it => it.value).join(""));
				return new Renderer.dice.parsed.Factor(sym);
			}
		} else if (this._parse3_accept(self, Renderer.dice.tk.PB)) {
			return new Renderer.dice.parsed.Factor(Renderer.dice.tk.PB);
		} else if (
			this._parse3_match(self, Renderer.dice.tk.FLOOR)
			|| this._parse3_match(self, Renderer.dice.tk.CEIL)
			|| this._parse3_match(self, Renderer.dice.tk.ROUND)
			|| this._parse3_match(self, Renderer.dice.tk.AVERAGE)) {
			const children = [];

			children.push(this._parse3_nextSym(self));
			this._parse3_expect(self, Renderer.dice.tk.PAREN_OPEN);
			children.push(this._parse3_expression(self));
			this._parse3_expect(self, Renderer.dice.tk.PAREN_CLOSE);

			return new Renderer.dice.parsed.Function(children);
		} else if (this._parse3_accept(self, Renderer.dice.tk.PAREN_OPEN)) {
			const exp = this._parse3_expression(self);
			this._parse3_expect(self, Renderer.dice.tk.PAREN_CLOSE);
			return new Renderer.dice.parsed.Factor(exp, {hasParens: true})
		} else if (this._parse3_accept(self, Renderer.dice.tk.BRACE_OPEN)) {
			const children = [];

			children.push(this._parse3_expression(self));
			while (this._parse3_accept(self, Renderer.dice.tk.COMMA)) children.push(this._parse3_expression(self));

			this._parse3_expect(self, Renderer.dice.tk.BRACE_CLOSE);

			const modPart = [];
			this._parse3__dice_modifiers(self, modPart);

			return new Renderer.dice.parsed.Pool(children, modPart[0])
		} else {
			if (self.sym) throw new Error(`Unexpected input: <code>${self.sym}</code>`);
			else throw new Error(`Unexpected end of input`);
		}
	},

	_parse3_dice (self) {
		const children = [];

		// if we've omitting the X in XdY, add it here
		if (this._parse3_match(self, Renderer.dice.tk.DICE)) children.push(new Renderer.dice.parsed.Factor(Renderer.dice.tk.NUMBER(1)));
		else children.push(this._parse3_factor(self));

		while (this._parse3_match(self, Renderer.dice.tk.DICE)) {
			this._parse3_nextSym(self);
			children.push(this._parse3_factor(self));
			this._parse3__dice_modifiers(self, children);
		}
		return new Renderer.dice.parsed.Dice(children);
	},

	_parse3__dice_modifiers (self, children) { // used in both dice and dice pools
		// Collect together all dice mods
		const modsMeta = new Renderer.dice.lang.DiceModMeta();

		while (
			this._parse3_match(self, Renderer.dice.tk.DROP_HIGHEST)
			|| this._parse3_match(self, Renderer.dice.tk.KEEP_HIGHEST)
			|| this._parse3_match(self, Renderer.dice.tk.DROP_LOWEST)
			|| this._parse3_match(self, Renderer.dice.tk.KEEP_LOWEST)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_EXACT)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_GT)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_GTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_LT)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_LTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_EXACT)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_GT)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_GTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_LT)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_LTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_EXACT)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_GT)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_GTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_LT)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_LTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.MARGIN_SUCCESS_EXACT)
			|| this._parse3_match(self, Renderer.dice.tk.MARGIN_SUCCESS_GT)
			|| this._parse3_match(self, Renderer.dice.tk.MARGIN_SUCCESS_GTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.MARGIN_SUCCESS_LT)
			|| this._parse3_match(self, Renderer.dice.tk.MARGIN_SUCCESS_LTEQ)
		) {
			const nxtSym = this._parse3_nextSym(self);
			const nxtFactor = this._parse3_factor(self);

			if (nxtSym.isSuccessMode) modsMeta.isSuccessMode = true;
			modsMeta.mods.push({modSym: nxtSym, numSym: nxtFactor});
		}

		if (modsMeta.mods.length) children.push(modsMeta);
	},

	_parse3_exponent (self) {
		const children = [];
		children.push(this._parse3_dice(self));
		while (this._parse3_match(self, Renderer.dice.tk.POW)) {
			this._parse3_nextSym(self);
			children.push(this._parse3_dice(self));
		}
		return new Renderer.dice.parsed.Exponent(children);
	},

	_parse3_term (self) {
		const children = [];
		children.push(this._parse3_exponent(self));
		while (this._parse3_match(self, Renderer.dice.tk.MULT) || this._parse3_match(self, Renderer.dice.tk.DIV)) {
			children.push(this._parse3_nextSym(self));
			children.push(this._parse3_exponent(self));
		}
		return new Renderer.dice.parsed.Term(children);
	},

	_parse3_expression (self) {
		const children = [];
		if (this._parse3_match(self, Renderer.dice.tk.ADD) || this._parse3_match(self, Renderer.dice.tk.SUB)) children.push(this._parse3_nextSym(self));
		children.push(this._parse3_term(self));
		while (this._parse3_match(self, Renderer.dice.tk.ADD) || this._parse3_match(self, Renderer.dice.tk.SUB)) {
			children.push(this._parse3_nextSym(self));
			children.push(this._parse3_term(self));
		}
		return new Renderer.dice.parsed.Expression(children);
	},
	// endregion

	// region Utilities
	DiceModMeta: class {
		constructor () {
			this.isDiceModifierGroup = true;
			this.isSuccessMode = false;
			this.mods = [];
		}
	},
	// endregion
};

Renderer.dice.tk = {
	Token: class {
		/**
		 * @param type
		 * @param value
		 * @param asString
		 * @param [opts] Options object.
		 * @param [opts.isDiceModifier] If the token is a dice modifier, e.g. "dl"
		 * @param [opts.isSuccessMode] If the token is a "success"-based dice modifier, e.g. "cs="
		 */
		constructor (type, value, asString, opts) {
			opts = opts || {};
			this.type = type;
			this.value = value;
			this._asString = asString;
			if (opts.isDiceModifier) this.isDiceModifier = true;
			if (opts.isSuccessMode) this.isSuccessMode = true;
		}

		eq (other) { return other && other.type === this.type; }

		toString () {
			if (this._asString) return this._asString;
			return this.toDebugString();
		}

		toDebugString () { return `${this.type}${this.value ? ` :: ${this.value}` : ""}` }
	},

	_new (type, asString, opts) { return new Renderer.dice.tk.Token(type, null, asString, opts); },

	TYP_NUMBER: "NUMBER",
	TYP_DICE: "DICE",
	TYP_SYMBOL: "SYMBOL", // Cannot be created by lexing, only parsing

	NUMBER (val) { return new Renderer.dice.tk.Token(Renderer.dice.tk.TYP_NUMBER, val); },
};
Renderer.dice.tk.PAREN_OPEN = Renderer.dice.tk._new("PAREN_OPEN", "(");
Renderer.dice.tk.PAREN_CLOSE = Renderer.dice.tk._new("PAREN_CLOSE", ")");
Renderer.dice.tk.BRACE_OPEN = Renderer.dice.tk._new("BRACE_OPEN", "{");
Renderer.dice.tk.BRACE_CLOSE = Renderer.dice.tk._new("BRACE_CLOSE", "}");
Renderer.dice.tk.COMMA = Renderer.dice.tk._new("COMMA", ",");
Renderer.dice.tk.ADD = Renderer.dice.tk._new("ADD", "+");
Renderer.dice.tk.SUB = Renderer.dice.tk._new("SUB", "-");
Renderer.dice.tk.MULT = Renderer.dice.tk._new("MULT", "*");
Renderer.dice.tk.DIV = Renderer.dice.tk._new("DIV", "/");
Renderer.dice.tk.POW = Renderer.dice.tk._new("POW", "^");
Renderer.dice.tk.PB = Renderer.dice.tk._new("PB", "pb");
Renderer.dice.tk.FLOOR = Renderer.dice.tk._new("FLOOR", "floor");
Renderer.dice.tk.CEIL = Renderer.dice.tk._new("CEIL", "ceil");
Renderer.dice.tk.ROUND = Renderer.dice.tk._new("ROUND", "round");
Renderer.dice.tk.AVERAGE = Renderer.dice.tk._new("AVERAGE", "avg");
Renderer.dice.tk.DICE = Renderer.dice.tk._new("DICE", "d");
Renderer.dice.tk.DROP_HIGHEST = Renderer.dice.tk._new("DH", "dh", {isDiceModifier: true});
Renderer.dice.tk.KEEP_HIGHEST = Renderer.dice.tk._new("KH", "kh", {isDiceModifier: true});
Renderer.dice.tk.DROP_LOWEST = Renderer.dice.tk._new("DL", "dl", {isDiceModifier: true});
Renderer.dice.tk.KEEP_LOWEST = Renderer.dice.tk._new("KL", "kl", {isDiceModifier: true});
Renderer.dice.tk.REROLL_EXACT = Renderer.dice.tk._new("REROLL", "r", {isDiceModifier: true});
Renderer.dice.tk.REROLL_GT = Renderer.dice.tk._new("REROLL_GT", "r>", {isDiceModifier: true});
Renderer.dice.tk.REROLL_GTEQ = Renderer.dice.tk._new("REROLL_GTEQ", "r>=", {isDiceModifier: true});
Renderer.dice.tk.REROLL_LT = Renderer.dice.tk._new("REROLL_LT", "r<", {isDiceModifier: true});
Renderer.dice.tk.REROLL_LTEQ = Renderer.dice.tk._new("REROLL_LTEQ", "r<=", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_EXACT = Renderer.dice.tk._new("EXPLODE", "x", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_GT = Renderer.dice.tk._new("EXPLODE_GT", "x>", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_GTEQ = Renderer.dice.tk._new("EXPLODE_GTEQ", "x>=", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_LT = Renderer.dice.tk._new("EXPLODE_LT", "x<", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_LTEQ = Renderer.dice.tk._new("EXPLODE_LTEQ", "x<=", {isDiceModifier: true});
Renderer.dice.tk.COUNT_SUCCESS_EXACT = Renderer.dice.tk._new("COUNT_SUCCESS_EXACT", "cs=", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_GT = Renderer.dice.tk._new("COUNT_SUCCESS_GT", "cs>", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_GTEQ = Renderer.dice.tk._new("COUNT_SUCCESS_GTEQ", "cs>=", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_LT = Renderer.dice.tk._new("COUNT_SUCCESS_LT", "cs<", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_LTEQ = Renderer.dice.tk._new("COUNT_SUCCESS_LTEQ", "cs<=", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.MARGIN_SUCCESS_EXACT = Renderer.dice.tk._new("MARGIN_SUCCESS_EXACT", "ms=", {isDiceModifier: true});
Renderer.dice.tk.MARGIN_SUCCESS_GT = Renderer.dice.tk._new("MARGIN_SUCCESS_GT", "ms>", {isDiceModifier: true});
Renderer.dice.tk.MARGIN_SUCCESS_GTEQ = Renderer.dice.tk._new("MARGIN_SUCCESS_GTEQ", "ms>=", {isDiceModifier: true});
Renderer.dice.tk.MARGIN_SUCCESS_LT = Renderer.dice.tk._new("MARGIN_SUCCESS_LT", "ms<", {isDiceModifier: true});
Renderer.dice.tk.MARGIN_SUCCESS_LTEQ = Renderer.dice.tk._new("MARGIN_SUCCESS_LTEQ", "ms<=", {isDiceModifier: true});

Renderer.dice.AbstractSymbol = class {
	constructor () { this.type = Renderer.dice.tk.TYP_SYMBOL; }
	eq (symbol) { return symbol && this.type === symbol.type; }
	evl (meta) { this.meta = meta; return this._evl(meta); }
	avg (meta) { this.meta = meta; return this._avg(meta); }
	min (meta) { this.meta = meta; return this._min(meta); } // minimum value of all _rolls_, not the minimum possible result
	max (meta) { this.meta = meta; return this._max(meta); } // maximum value of all _rolls_, not the maximum possible result
	_evl () { throw new Error("Unimplemented!"); }
	_avg () { throw new Error("Unimplemented!"); }
	_min () { throw new Error("Unimplemented!"); } // minimum value of all _rolls_, not the minimum possible result
	_max () { throw new Error("Unimplemented!"); } // maximum value of all _rolls_, not the maximum possible result
	toString () { throw new Error("Unimplemented!"); }
	addToMeta (meta, html, text) {
		if (!meta) return;
		text = text || html;
		(meta.html = meta.html || []).push(html);
		(meta.text = meta.text || []).push(text);
	}
};

Renderer.dice.parsed = {
	_PARTITION_EQ: (r, compareTo) => r === compareTo,
	_PARTITION_GT: (r, compareTo) => r > compareTo,
	_PARTITION_GTEQ: (r, compareTo) => r >= compareTo,
	_PARTITION_LT: (r, compareTo) => r < compareTo,
	_PARTITION_LTEQ: (r, compareTo) => r <= compareTo,

	/**
	 * @param fnName
	 * @param meta
	 * @param vals
	 * @param nodeMod
	 * @param opts Options object.
	 * @param [opts.fnGetRerolls] Function which takes a set of rolls to be rerolled and generates the next set of rolls.
	 * @param [opts.fnGetExplosions] Function which takes a set of rolls to be exploded and generates the next set of rolls.
	 * @param [opts.faces]
	 */
	_handleModifiers (fnName, meta, vals, nodeMod, opts) {
		opts = opts || {};

		const displayVals = vals.slice(); // copy the array so we can sort the original

		const {mods} = nodeMod;

		for (const mod of mods) {
			vals.sort(SortUtil.ascSortProp.bind(null, "val")).reverse();

			const modNum = mod.numSym[fnName]();

			switch (mod.modSym.type) {
				case Renderer.dice.tk.DROP_HIGHEST.type:
				case Renderer.dice.tk.KEEP_HIGHEST.type:
				case Renderer.dice.tk.DROP_LOWEST.type:
				case Renderer.dice.tk.KEEP_LOWEST.type: {
					const isHighest = mod.modSym.type.endsWith("H");

					const splitPoint = isHighest ? modNum : vals.length - modNum;

					const highSlice = vals.slice(0, splitPoint);
					const lowSlice = vals.slice(splitPoint, vals.length);

					switch (mod.modSym.type) {
						case Renderer.dice.tk.DROP_HIGHEST.type:
						case Renderer.dice.tk.KEEP_LOWEST.type:
							highSlice.forEach(val => val.isDropped = true);
							break;
						case Renderer.dice.tk.KEEP_HIGHEST.type:
						case Renderer.dice.tk.DROP_LOWEST.type:
							lowSlice.forEach(val => val.isDropped = true);
							break;
						default: throw new Error(`Unimplemented!`);
					}
					break;
				}

				case Renderer.dice.tk.REROLL_EXACT.type:
				case Renderer.dice.tk.REROLL_GT.type:
				case Renderer.dice.tk.REROLL_GTEQ.type:
				case Renderer.dice.tk.REROLL_LT.type:
				case Renderer.dice.tk.REROLL_LTEQ.type: {
					let fnPartition;
					switch (mod.modSym.type) {
						case Renderer.dice.tk.REROLL_EXACT.type: fnPartition = Renderer.dice.parsed._PARTITION_EQ; break;
						case Renderer.dice.tk.REROLL_GT.type: fnPartition = Renderer.dice.parsed._PARTITION_GT; break;
						case Renderer.dice.tk.REROLL_GTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_GTEQ; break;
						case Renderer.dice.tk.REROLL_LT.type: fnPartition = Renderer.dice.parsed._PARTITION_LT; break;
						case Renderer.dice.tk.REROLL_LTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_LTEQ; break;
						default: throw new Error(`Unimplemented!`);
					}

					const toReroll = vals.filter(val => fnPartition(val.val, modNum));
					toReroll.forEach(val => val.isDropped = true);

					const nuVals = opts.fnGetRerolls(toReroll);

					vals.push(...nuVals);
					displayVals.push(...nuVals);
					break;
				}

				case Renderer.dice.tk.EXPLODE_EXACT.type:
				case Renderer.dice.tk.EXPLODE_GT.type:
				case Renderer.dice.tk.EXPLODE_GTEQ.type:
				case Renderer.dice.tk.EXPLODE_LT.type:
				case Renderer.dice.tk.EXPLODE_LTEQ.type: {
					let fnPartition;
					switch (mod.modSym.type) {
						case Renderer.dice.tk.EXPLODE_EXACT.type: fnPartition = Renderer.dice.parsed._PARTITION_EQ; break;
						case Renderer.dice.tk.EXPLODE_GT.type: fnPartition = Renderer.dice.parsed._PARTITION_GT; break;
						case Renderer.dice.tk.EXPLODE_GTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_GTEQ; break;
						case Renderer.dice.tk.EXPLODE_LT.type: fnPartition = Renderer.dice.parsed._PARTITION_LT; break;
						case Renderer.dice.tk.EXPLODE_LTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_LTEQ; break;
						default: throw new Error(`Unimplemented!`);
					}

					let tries = 999; // limit the maximum explosions to a sane amount
					let lastLen;
					let toExplodeNext = vals;
					do {
						lastLen = vals.length;

						const [toExplode] = toExplodeNext.partition(roll => !roll.isExploded && fnPartition(roll.val, modNum));
						toExplode.forEach(roll => roll.isExploded = true);

						const nuVals = opts.fnGetExplosions(toExplode);

						// cache the new rolls, to improve performance over massive explosion sets
						toExplodeNext = nuVals;

						vals.push(...nuVals);
						displayVals.push(...nuVals);
					} while (tries-- > 0 && vals.length !== lastLen);

					if (!~tries) JqueryUtil.doToast({type: "warning", content: `Stopped exploding after 999 additional rolls.`});

					break;
				}

				case Renderer.dice.tk.COUNT_SUCCESS_EXACT.type:
				case Renderer.dice.tk.COUNT_SUCCESS_GT.type:
				case Renderer.dice.tk.COUNT_SUCCESS_GTEQ.type:
				case Renderer.dice.tk.COUNT_SUCCESS_LT.type:
				case Renderer.dice.tk.COUNT_SUCCESS_LTEQ.type: {
					let fnPartition;
					switch (mod.modSym.type) {
						case Renderer.dice.tk.COUNT_SUCCESS_EXACT.type: fnPartition = Renderer.dice.parsed._PARTITION_EQ; break;
						case Renderer.dice.tk.COUNT_SUCCESS_GT.type: fnPartition = Renderer.dice.parsed._PARTITION_GT; break;
						case Renderer.dice.tk.COUNT_SUCCESS_GTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_GTEQ; break;
						case Renderer.dice.tk.COUNT_SUCCESS_LT.type: fnPartition = Renderer.dice.parsed._PARTITION_LT; break;
						case Renderer.dice.tk.COUNT_SUCCESS_LTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_LTEQ; break;
						default: throw new Error(`Unimplemented!`);
					}

					const successes = vals.filter(val => fnPartition(val.val, modNum));
					successes.forEach(val => val.isSuccess = true);

					break;
				}

				case Renderer.dice.tk.MARGIN_SUCCESS_EXACT.type:
				case Renderer.dice.tk.MARGIN_SUCCESS_GT.type:
				case Renderer.dice.tk.MARGIN_SUCCESS_GTEQ.type:
				case Renderer.dice.tk.MARGIN_SUCCESS_LT.type:
				case Renderer.dice.tk.MARGIN_SUCCESS_LTEQ.type: {
					const total = vals.map(it => it.val).reduce((valA, valB) => valA + valB, 0);

					const subDisplayDice = displayVals.map(r => `[${Renderer.dice.parsed._rollToNumPart(r, opts.faces)}]`).join("+");

					let delta;
					let subDisplay;
					switch (mod.modSym.type) {
						case Renderer.dice.tk.MARGIN_SUCCESS_EXACT.type:
						case Renderer.dice.tk.MARGIN_SUCCESS_GT.type:
						case Renderer.dice.tk.MARGIN_SUCCESS_GTEQ.type: {
							delta = total - modNum;

							subDisplay = `(${subDisplayDice})-${modNum}`;

							break;
						}
						case Renderer.dice.tk.MARGIN_SUCCESS_LT.type:
						case Renderer.dice.tk.MARGIN_SUCCESS_LTEQ.type: {
							delta = modNum - total;

							subDisplay = `${modNum}-(${subDisplayDice})`;

							break;
						}
						default: throw new Error(`Unimplemented!`);
					}

					while (vals.length) {
						vals.pop();
						displayVals.pop();
					}

					vals.push({val: delta});
					displayVals.push({val: delta, htmlDisplay: subDisplay});

					break;
				}

				default: throw new Error(`Unimplemented!`);
			}
		}

		return displayVals;
	},

	_rollToNumPart (r, faces) {
		if (faces == null) return r.val;
		return r.val === faces ? `<span class="rll__max--muted">${r.val}</span>` : r.val === 1 ? `<span class="rll__min--muted">${r.val}</span>` : r.val;
	},

	Function: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		_evl (meta) { return this._invoke("evl", meta); }
		_avg (meta) { return this._invoke("avg", meta); }
		_min (meta) { return this._invoke("min", meta); }
		_max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const [symFunc, symExp] = this._nodes;
			switch (symFunc.type) {
				case Renderer.dice.tk.FLOOR.type: {
					this.addToMeta(meta, "floor(");
					const out = Math.floor(symExp[fnName](meta));
					this.addToMeta(meta, ")");
					return out;
				}
				case Renderer.dice.tk.CEIL.type: {
					this.addToMeta(meta, "ceil(");
					const out = Math.ceil(symExp[fnName](meta));
					this.addToMeta(meta, ")");
					return out;
				}
				case Renderer.dice.tk.ROUND.type: {
					this.addToMeta(meta, "round(");
					const out = Math.round(symExp[fnName](meta));
					this.addToMeta(meta, ")");
					return out;
				}
				case Renderer.dice.tk.AVERAGE.type: {
					return symExp.avg(meta);
				}
				default: throw new Error(`Unimplemented!`);
			}
		}

		toString () {
			let out;
			const [symFunc, symExp] = this._nodes;
			switch (symFunc.type) {
				case Renderer.dice.tk.FLOOR.type: out = "floor"; break;
				case Renderer.dice.tk.CEIL.type: out = "ceil"; break;
				case Renderer.dice.tk.ROUND.type: out = "round"; break;
				case Renderer.dice.tk.AVERAGE.type: out = "avg"; break;
				default: throw new Error(`Unimplemented!`);
			}
			out += `(${symExp.toString()})`;
			return out;
		}
	},

	Pool: class extends Renderer.dice.AbstractSymbol {
		constructor (nodesPool, nodeMod) {
			super();
			this._nodesPool = nodesPool;
			this._nodeMod = nodeMod;
		}

		_evl (meta) { return this._invoke("evl", meta); }
		_avg (meta) { return this._invoke("avg", meta); }
		_min (meta) { return this._invoke("min", meta); }
		_max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const vals = this._nodesPool.map(it => {
				const subMeta = {};
				return {node: it, val: it[fnName](subMeta), meta: subMeta};
			});

			if (this._nodeMod && vals.length) {
				const isSuccessMode = this._nodeMod.isSuccessMode;

				const modOpts = {
					fnGetRerolls: toReroll => toReroll.map(val => {
						const subMeta = {};
						return {node: val.node, val: val.node[fnName](subMeta), meta: subMeta};
					}),
					fnGetExplosions: toExplode => toExplode.map(val => {
						const subMeta = {};
						return {node: val.node, val: val.node[fnName](subMeta), meta: subMeta};
					}),
				};

				const displayVals = Renderer.dice.parsed._handleModifiers(fnName, meta, vals, this._nodeMod, modOpts);

				const asHtml = displayVals.map(v => {
					const html = v.meta.html.join("");
					if (v.isDropped) return `<span class="rll__dropped">(${html})</span>`;
					else if (v.isExploded) return `<span class="rll__exploded">(</span>${html}<span class="rll__exploded">)</span>`;
					else if (v.isSuccess) return `<span class="rll__success">(${html})</span>`;
					else return `(${html})`;
				}).join("+");

				const asText = displayVals.map(v => `(${v.meta.text.join("")})`).join("+");

				this.addToMeta(meta, asHtml, asText);

				if (isSuccessMode) {
					return vals.filter(it => !it.isDropped && it.isSuccess).length;
				} else {
					return vals.filter(it => !it.isDropped).map(it => it.val).sum();
				}
			} else {
				this.addToMeta(meta, `${vals.map(it => `(${it.meta.html.join("")})`).join("+")}`, `${vals.map(it => `(${it.meta.text.join("")})`).join("+")}`);
				return vals.map(it => it.val).sum();
			}
		}

		toString () {
			return `{${this._nodesPool.map(it => it.toString()).join(", ")}}${this._nodeMod ? this._nodeMod.toString() : ""}`;
		}
	},

	Factor: class extends Renderer.dice.AbstractSymbol {
		constructor (node, opts) {
			super();
			opts = opts || {};
			this._node = node;
			this._hasParens = !!opts.hasParens;
		}

		_evl (meta) { return this._invoke("evl", meta); }
		_avg (meta) { return this._invoke("avg", meta); }
		_min (meta) { return this._invoke("min", meta); }
		_max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			switch (this._node.type) {
				case Renderer.dice.tk.TYP_NUMBER: {
					this.addToMeta(meta, this.toString());
					return Number(this._node.value);
				}
				case Renderer.dice.tk.TYP_SYMBOL: {
					if (this._hasParens) this.addToMeta(meta, "(");
					const out = this._node[fnName](meta);
					if (this._hasParens) this.addToMeta(meta, ")");
					return out;
				}
				case Renderer.dice.tk.PB.type: {
					this.addToMeta(meta, this.toString(meta));
					return meta.pb == null ? 0 : meta.pb;
				}
				default: throw new Error(`Unimplemented!`);
			}
		}

		toString (indent) {
			let out;
			switch (this._node.type) {
				case Renderer.dice.tk.TYP_NUMBER: out = this._node.value; break;
				case Renderer.dice.tk.TYP_SYMBOL: out = this._node.toString(); break;
				case Renderer.dice.tk.PB.type: out = this.meta ? (this.meta.pb || 0) : "PB"; break;
				default: throw new Error(`Unimplemented!`);
			}
			return this._hasParens ? `(${out})` : out;
		}
	},

	Dice: class extends Renderer.dice.AbstractSymbol {
		static _facesToValue (faces, fnName) {
			switch (fnName) {
				case "evl": return RollerUtil.randomise(faces);
				case "avg": return (faces + 1) / 2;
				case "min": return 1;
				case "max": return faces;
			}
		}

		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		_evl (meta) { return this._invoke("evl", meta); }
		_avg (meta) { return this._invoke("avg", meta); }
		_min (meta) { return this._invoke("min", meta); }
		_max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			if (this._nodes.length === 1) return this._nodes[0][fnName](meta); // if it's just a factor

			// N.B. we don't pass "meta" to symbol evaluation inside the dice expression--we therefore won't see
			//   the metadata from the nested rolls, but that's OK.

			const view = this._nodes.slice();
			// Shift the first symbol and use that as our initial number of dice
			//   e.g. the "2" in 2d3d5
			const numSym = view.shift();
			let tmp = numSym[fnName]();

			while (view.length) {
				if (Math.round(tmp) !== tmp) throw new Error(`Number of dice to roll (${tmp}) was not an integer!`);

				// Use the next symbol as our number of faces
				//   e.g. the "3" in `2d3d5`
				// When looping, the number of dice may have been a complex expression with modifiers; take the next
				//   non-modifier symbol as the faces.
				//   e.g. the "20" in `(2d3kh1r1)d20` (parentheses for emphasis)
				const facesSym = view.shift();
				const faces = facesSym[fnName]();
				if (Math.round(faces) !== faces) throw new Error(`Dice face count (${faces}) was not an integer!`);

				const isLast = view.length === 0 || (view.length === 1 && view.last().isDiceModifierGroup);
				tmp = this._invoke_handlePart(fnName, meta, view, tmp, faces, isLast);
			}

			return tmp;
		}

		_invoke_handlePart (fnName, meta, view, num, faces, isLast) {
			const rolls = [...new Array(num)].map(() => ({val: Renderer.dice.parsed.Dice._facesToValue(faces, fnName)}));
			let displayRolls;
			let isSuccessMode = false;

			if (view.length && view[0].isDiceModifierGroup) {
				const nodeMod = view[0];

				if (fnName === "evl" || fnName === "min" || fnName === "max") { // avoid handling dice modifiers in "average" mode
					isSuccessMode = nodeMod.isSuccessMode;

					const modOpts = {
						faces,
						fnGetRerolls: toReroll => [...new Array(toReroll.length)].map(() => ({val: Renderer.dice.parsed.Dice._facesToValue(faces, fnName)})),
						fnGetExplosions: toExplode => [...new Array(toExplode.length)].map(() => ({val: Renderer.dice.parsed.Dice._facesToValue(faces, fnName)})),
					};

					displayRolls = Renderer.dice.parsed._handleModifiers(fnName, meta, rolls, nodeMod, modOpts);
				}

				view.shift();
			} else displayRolls = rolls;

			if (isLast) { // only display the dice for the final roll, e.g. in 2d3d4 show the Xd4
				const asHtml = displayRolls.map(r => {
					if (r.htmlDisplay) return r.htmlDisplay;

					const numPart = Renderer.dice.parsed._rollToNumPart(r, faces);

					if (r.isDropped) return `<span class="rll__dropped">[${numPart}]</span>`;
					else if (r.isExploded) return `<span class="rll__exploded">[</span>${numPart}<span class="rll__exploded">]</span>`;
					else if (r.isSuccess) return `<span class="rll__success">[${numPart}]</span>`;
					else return `[${numPart}]`;
				}).join("+");

				const asText = displayRolls.map(r => `[${r.val}]`).join("+");

				this.addToMeta(
					meta,
					asHtml,
					asText,
				);
			}

			if (fnName === "evl") {
				const maxRolls = rolls.filter(it => it.val === faces && !it.isDropped);
				const minRolls = rolls.filter(it => it.val === 1 && !it.isDropped);
				meta.allMax = meta.allMax || [];
				meta.allMin = meta.allMin || [];
				meta.allMax.push(maxRolls.length && maxRolls.length === rolls.length);
				meta.allMin.push(minRolls.length && minRolls.length === rolls.length);
			}

			if (isSuccessMode) {
				return rolls.filter(it => !it.isDropped && it.isSuccess).length;
			} else {
				return rolls.filter(it => !it.isDropped).map(it => it.val).sum();
			}
		}

		toString () {
			if (this._nodes.length === 1) return this._nodes[0].toString(); // if it's just a factor

			const [numSym, facesSym] = this._nodes;
			let out = `${numSym.toString()}d${facesSym.toString()}`;

			for (let i = 2; i < this._nodes.length; ++i) {
				const n = this._nodes[i];
				if (n.isDiceModifierGroup) out += n.mods.map(it => `${it.modSym.toString()}${it.numSym.toString()}`).join("");
				else out += `d${n.toString()}`;
			}

			return out;
		}
	},

	Exponent: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		_evl (meta) { return this._invoke("evl", meta); }
		_avg (meta) { return this._invoke("avg", meta); }
		_min (meta) { return this._invoke("min", meta); }
		_max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const view = this._nodes.slice();
			let val = view.pop()[fnName](meta);
			while (view.length) {
				this.addToMeta(meta, "^");
				val = view.pop()[fnName](meta) ** val;
			}
			return val;
		}

		toString () {
			const view = this._nodes.slice();
			let out = view.pop().toString();
			while (view.length) out = `${view.pop().toString()}^${out}`;
			return out;
		}
	},

	Term: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		_evl (meta) { return this._invoke("evl", meta); }
		_avg (meta) { return this._invoke("avg", meta); }
		_min (meta) { return this._invoke("min", meta); }
		_max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			let out = this._nodes[0][fnName](meta);

			for (let i = 1; i < this._nodes.length; i += 2) {
				if (this._nodes[i].eq(Renderer.dice.tk.MULT)) {
					this.addToMeta(meta, " × ");
					out *= this._nodes[i + 1][fnName](meta);
				} else if (this._nodes[i].eq(Renderer.dice.tk.DIV)) {
					this.addToMeta(meta, " ÷ ");
					out /= this._nodes[i + 1][fnName](meta)
				} else throw new Error(`Unimplemented!`);
			}

			return out;
		}

		toString () {
			let out = this._nodes[0].toString();
			for (let i = 1; i < this._nodes.length; i += 2) {
				if (this._nodes[i].eq(Renderer.dice.tk.MULT)) out += ` * ${this._nodes[i + 1].toString()}`;
				else if (this._nodes[i].eq(Renderer.dice.tk.DIV)) out += ` / ${this._nodes[i + 1].toString()}`;
				else throw new Error(`Unimplemented!`);
			}
			return out;
		}
	},

	Expression: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		_evl (meta) { return this._invoke("evl", meta); }
		_avg (meta) { return this._invoke("avg", meta); }
		_min (meta) { return this._invoke("min", meta); }
		_max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const view = this._nodes.slice();

			let isNeg = false;
			if (view[0].eq(Renderer.dice.tk.ADD) || view[0].eq(Renderer.dice.tk.SUB)) {
				isNeg = view.shift().eq(Renderer.dice.tk.SUB);
				if (isNeg) this.addToMeta(meta, "-");
			}

			let out = view[0][fnName](meta);
			if (isNeg) out = -out;

			for (let i = 1; i < view.length; i += 2) {
				if (view[i].eq(Renderer.dice.tk.ADD)) {
					this.addToMeta(meta, " + ");
					out += view[i + 1][fnName](meta);
				} else if (view[i].eq(Renderer.dice.tk.SUB)) {
					this.addToMeta(meta, " - ");
					out -= view[i + 1][fnName](meta);
				} else throw new Error(`Unimplemented!`);
			}

			return out;
		}

		toString (indent = 0) {
			let out = "";
			const view = this._nodes.slice();

			let isNeg = false;
			if (view[0].eq(Renderer.dice.tk.ADD) || view[0].eq(Renderer.dice.tk.SUB)) {
				isNeg = view.shift().eq(Renderer.dice.tk.SUB);
				if (isNeg) out += "-";
			}

			out += view[0].toString(indent);
			for (let i = 1; i < view.length; i += 2) {
				if (view[i].eq(Renderer.dice.tk.ADD)) out += ` + ${view[i + 1].toString(indent)}`;
				else if (view[i].eq(Renderer.dice.tk.SUB)) out += ` - ${view[i + 1].toString(indent)}`;
				else throw new Error(`Unimplemented!`);
			}
			return out;
		}
	},
};

if (!IS_VTT && typeof window !== "undefined") {
	window.addEventListener("load", Renderer.dice._pInit);
}
