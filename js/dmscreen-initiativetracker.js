class InitiativeTracker {
	static make$Tracker (board, state) {
		const ALPHA = "ALPHA";
		const NUM = "NUMBER";
		const ASC = "ASC";
		const DESC = "DESC";

		const _propDefaultFalse = (savedVal) => !!savedVal;
		const _propDefaultTrue = (savedVal) => savedVal == null ? true : !!savedVal;

		const cfg = {
			sort: state.s || NUM,
			dir: state.d || DESC,
			isLocked: false,
			isRollHp: _propDefaultFalse(state.m),
			importIsRollGroups: _propDefaultTrue(state.g),
			importIsAddPlayers: _propDefaultTrue(state.p),
			importIsAppend: _propDefaultFalse(state.a),
			statsAddColumns: _propDefaultFalse(state.k),
			statsCols: state.c || []
		};

		const $wrpTracker = $(`<div class="dm-init"/>`);

		// Unused; to be considered for other applications
		const handleResize = () => {
			// if ($wrpTracker.width() > 420) { // approx width of a long name + controls
			// 	$wrpTracker.find(`.dm-init-row-mid`).show();
			// } else {
			// 	$wrpTracker.find(`.dm-init-row-mid`).hide();
			// }
		};
		board.reactor.on("panelResize", handleResize);
		$wrpTracker.on("destroyed", () => board.reactor.off("panelResize", handleResize));

		const makeImportSettingsModal = () => {
			const $modalInner = DmScreenUtil.getShow$Modal("Import Settings", () => board.doSaveStateDebounced());
			DmScreenUtil.addModal$Sep($modalInner);
			DmScreenUtil.getAddModal$RowCb($modalInner, "Roll hit points", cfg, "isRollHp");
			DmScreenUtil.getAddModal$RowCb($modalInner, "Roll groups of creatures together", cfg, "importIsRollGroups");
			DmScreenUtil.getAddModal$RowCb($modalInner, "Add players", cfg, "importIsAddPlayers");
			DmScreenUtil.getAddModal$RowCb($modalInner, "Add to existing tracker state", cfg, "importIsAppend");
		};

		// initialise "upload" context menu
		const contextId = `trackerLoader${RollerUtil.randomise(100000)}`;
		ContextUtil.doInitContextMenu(contextId, (evt, ele, $invokedOn, $selectedMenu) => {
			switch (Number($selectedMenu.data("ctx-id"))) {
				case 0:
					EncounterUtil.pGetSavedState().then(savedState => {
						if (savedState) convertAndLoadBestiaryList(savedState);
						else alert(`No saved encounter! Please first go to the Bestiary and create one.`);
					});
					break;
				case 1:
					DataUtil.userUpload((json) => {
						if (json) convertAndLoadBestiaryList(json);
					});
					break;
				case 2:
					makeImportSettingsModal();
					break;
			}
		}, ["From Current Bestiary Encounter", "From Bestiary Encounter File", null, "Import Settings"]);

		const $wrpTop = $(`<div class="dm-init-wrp-header-outer"/>`).appendTo($wrpTracker);
		const $wrpHeader = $(`
			<div class="dm-init-wrp-header">
				<div class="dm-init-row-lhs dm-init-header">
					<div class="full-width">Creature/Status</div>
				</div>

				<div class="dm-init-row-mid"/>

				<div class="dm-init-row-rhs">
					<div class="dm-init-header dm-init-header--input" title="Hit Points">HP</div>
					<div class="dm-init-header dm-init-header--input" title="Initiative Score">#</div>
					<div style="width: 20px;"/>
				</div>
			</div>
		`).appendTo($wrpTop);

		const $wrpEntries = $(`<div class="dm-init-wrp-entries"/>`).appendTo($wrpTop);

		const $wrpControls = $(`<div class="dm-init-wrp-controls"/>`).appendTo($wrpTracker);

		const $wrpAddNext = $(`<div/>`).appendTo($wrpControls);
		const $wrpAdd = $(`<div class="btn-group"/>`).appendTo($wrpAddNext);
		const $btnAdd = $(`<button class="btn btn-primary btn-xs dm-init-lockable" title="Add Player"><span class="glyphicon glyphicon-plus"/></button>`).appendTo($wrpAdd);
		const $btnAddMonster = $(`<button class="btn btn-success btn-xs dm-init-lockable mr-2" title="Add Monster"><span class="glyphicon glyphicon-print"/></button>`).appendTo($wrpAdd);
		$(`<button class="btn btn-default btn-xs" title="Next Turn"><span class="glyphicon glyphicon-step-forward"/></button>`).appendTo($wrpAddNext)
			.click(() => setNextActive());

		const $wrpSort = $(`<div class="btn-group"/>`).appendTo($wrpControls);
		$(`<button title="Sort Alphabetically" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-sort-by-alphabet"/></button>`).appendTo($wrpSort)
			.click(() => {
				if (cfg.sort === ALPHA) flipDir();
				else cfg.sort = ALPHA;
				doSort(ALPHA);
			});
		$(`<button title="Sort Numerically" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-sort-by-order"/></button>`).appendTo($wrpSort)
			.click(() => {
				if (cfg.sort === NUM) flipDir();
				else cfg.sort = NUM;
				doSort(NUM);
			});

		const $wrpUtils = $(`<div/>`).appendTo($wrpControls);
		const $wrpLockSettings = $(`<div class="btn-group"/>`).appendTo($wrpUtils);
		const $btnLock = $(`<button class="btn btn-danger btn-xs" title="Lock Tracker"><span class="glyphicon glyphicon-lock"></span></button>`).appendTo($wrpLockSettings);
		$btnLock.on("click", () => {
			if (cfg.isLocked) {
				$btnLock.removeClass("btn-success").addClass("btn-danger");
				$(".dm-init-lockable").toggleClass("disabled");
				$("input.dm-init-lockable").prop('disabled', false);
			} else {
				$btnLock.removeClass("btn-danger").addClass("btn-success");
				$(".dm-init-lockable").toggleClass("disabled");
				$("input.dm-init-lockable").prop('disabled', true);
			}
			cfg.isLocked = !cfg.isLocked;
			handleStatColsChange();
		});
		$(`<button class="btn btn-default btn-xs mr-2"><span class="glyphicon glyphicon-cog"></span></button>`)
			.appendTo($wrpLockSettings)
			.click(() => {
				const $modalInner = DmScreenUtil.getShow$Modal(
					"Settings",
					() => {
						handleStatColsChange();
						board.doSaveStateDebounced();
					}
				);
				DmScreenUtil.addModal$Sep($modalInner);
				DmScreenUtil.getAddModal$RowCb($modalInner, "Roll hit points", cfg, "isRollHp");
				DmScreenUtil.addModal$Sep($modalInner);

				const $cbStats = DmScreenUtil.getAddModal$RowCb($modalInner, "Additional Columns", cfg, "statsAddColumns");
				const $wrpTblStatsHead = DmScreenUtil._getAdd$Row($modalInner, "div")
					.addClass("tab-body-row--stats-header")
					// intentional difference in column widths compared to the rows, to position the long header
					//  ("Editable?") correctly
					.append(`
						<div class="row dm_init__stats_row">
							<div class="col-1-3"/>
							<div class="col-4-9">Auto-Fill With...</div>
							<div class="col-2-7">Abbreviation</div>
							<div class="col-1-7 text-align-center">Editable?</div>
						</div>
					`);
				const $wrpTblStats = DmScreenUtil._getAdd$Row($modalInner, "div").addClass("tab-body-row--stats");

				(() => {
					const $wrpStatsRows = $(`<div class="dm_init__stats_rows"/>`).appendTo($wrpTblStats);
					const $wrpBtn = $(`<div class="text-align-center"/>`).appendTo($wrpTblStats);

					const addRow = (thisCfg) => {
						if (!thisCfg) { // if new row
							thisCfg = {
								id: CryptUtil.uid(),
								p: "", // populate with...
								po: null, // populate with... (previous value)
								a: "", // abbreviation
								e: true, // editable
								o: cfg.statsCols.filter(it => !it.isDeleted).length + 1 // order
							};
							cfg.statsCols.push(thisCfg);
						}

						const $selPre = $(`
								<select class="form-control input-xs">
									<option value="">(None)</option>
									${Object.entries(InitiativeTracker.STAT_COLUMNS).map(([k, v]) => v.isHr ? `<option disabled>\u2014</option>` : `<option value="${k}">${v.name}</option>`)}
								</select>
							`).change(() => {
							const sel = InitiativeTracker.STAT_COLUMNS[$selPre.val()] || {};
							thisCfg.a = sel.abv || "";
							$iptAbv.val(thisCfg.a);
							thisCfg.po = thisCfg.p || null;
							thisCfg.p = $selPre.val() || "";

							board.doSaveStateDebounced();
						});
						if (thisCfg.p) {
							$selPre.val(thisCfg.p);
						}

						const $iptAbv = $(`<input class="form-control input-xs" placeholder="Abbreviation" value="${(thisCfg.a || "").escapeQuotes()}">`).change(() => {
							thisCfg.a = $iptAbv.val();
							board.doSaveStateDebounced();
						});

						const $cbEditable = $(`<input type="checkbox">`).prop("checked", !!thisCfg.e).change(() => {
							thisCfg.e = $cbEditable.prop("checked");
							board.doSaveStateDebounced();
						});

						const $btnDel = $(`<button class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-trash"/></button>`).click(() => {
							$row.remove();
							thisCfg.isDeleted = true;
							if (!$wrpTblStats.find(`.dm_init__stats_row`).length) {
								addRow();
							}
							board.doSaveStateDebounced();
						});

						const saveOrders = () => {
							const curr = {};
							$wrpTblStats.find(`.dm_init__stats_row`).each((i, e) => curr[$(e).attr("data-id")] = i);
							cfg.statsCols.forEach(it => {
								const newOrder = curr[it.id];
								if (newOrder != null) {
									it.o = newOrder;
								} else {
									it.o = -1;
								}
							});
						};

						const $btnUp = $(`<button class="btn btn-xs btn-default"><span class="glyphicon glyphicon-arrow-up"/></button>`).click(() => {
							if ($row.prev().length) {
								$row.prev().before($row);
								saveOrders();
								board.doSaveStateDebounced();
							}
						});

						const $btnDown = $(`<button class="btn btn-xs btn-default"><span class="glyphicon glyphicon-arrow-down dm_init__stats_down"/></button>`).click(() => {
							if ($row.next().length) {
								$row.next().after($row);
								saveOrders();
								board.doSaveStateDebounced();
							}
						});

						const $row = $(`
							<div class="row dm_init__stats_row dm_init__stats_row--item" data-id="${thisCfg.id}">
								<div class="col-1-3 btn-group text-align-center dm_init__stats_up_down"><div data-r="$btnUp"/><div data-r="$btnDown"/></div>
								<div class="col-1-3 dm_init__stats_up_down--spacer"></div>

								<div class="col-4-9"><div data-r="$selPre"/></div>
								<div class="col-3"><div data-r="$iptAbv"/></div>
								<div class="col-1 text-align-center"><div data-r="$cbEditable"/></div>
								<div class="col-1-5 text-align-center dm_init__stats_del"><div data-r="$btnDel"/></div>
							</div>
						`).appendTo($wrpStatsRows).swap({$selPre, $iptAbv, $cbEditable, $btnDel, $btnUp, $btnDown});
					};

					$(`<button class="btn btn-xs btn-default"><span class="glyphicon-plus glyphicon dm_init__stats_add"/></button>`)
						.appendTo($wrpBtn)
						.click(() => {
							addRow();
						});

					if (!cfg.statsCols.length) addRow();
					else cfg.statsCols.forEach(it => addRow(it));
				})();

				$cbStats.change(() => {
					$wrpTblStatsHead.toggle($cbStats.prop("checked"));
					$wrpTblStats.toggle($cbStats.prop("checked"));
				});
				$wrpTblStatsHead.toggle($cbStats.prop("checked"));
				$wrpTblStats.toggle($cbStats.prop("checked"));
			});

		const $wrpLoadReset = $(`<div class="btn-group"/>`).appendTo($wrpUtils);
		const $btnLoad = $(`<button title="Import an encounter from the Bestiary" class="btn btn-success btn-xs dm-init-lockable"><span class="glyphicon glyphicon-upload"/></button>`).appendTo($wrpLoadReset)
			.click((evt) => {
				if (cfg.isLocked) return;
				ContextUtil.handleOpenContextMenu(evt, $btnLoad, contextId);
			});
		$(`<button title="Reset" class="btn btn-danger btn-xs dm-init-lockable"><span class="glyphicon glyphicon-trash"/></button>`).appendTo($wrpLoadReset)
			.click(() => {
				if (cfg.isLocked) return;
				confirm("Are you sure?") && doReset();
			});

		$btnAdd.on("click", () => {
			if (cfg.isLocked) return;
			makeRow();
			doSort(cfg.sort);
			checkSetFirstActive();
		});

		$btnAddMonster.on("click", () => {
			if (cfg.isLocked) return;
			const flags = {
				doClickFirst: false,
				isWait: false
			};

			const $modal = $(`<div class="panel-addmenu">`);
			const $modalInner = $(`<div class="panel-addmenu-inner dropdown-menu">`).appendTo($modal);
			const doClose = () => $modal.remove();
			$modal.on("click", doClose);
			$modalInner.on("click", (e) => e.stopPropagation());
			$(`body`).append($modal);

			const $controls = $(`<div class="split" style="flex-shrink: 0"/>`).appendTo($modalInner);
			const $srch = $(`<input class="panel-tab-search search form-control" autocomplete="off" placeholder="Search...">`).appendTo($controls);
			const $wrpCount = $(`
				<div class="panel-tab-search-sub-wrp" style="padding-right: 0;">
					<div style="margin-right: 7px;">Add</div>
					<label class="panel-tab-search-sub-lbl"><input type="radio" name="mon-count" class="panel-tab-search-sub-ipt" value="1" checked> 1</label>
					<label class="panel-tab-search-sub-lbl"><input type="radio" name="mon-count" class="panel-tab-search-sub-ipt" value="2"> 2</label>
					<label class="panel-tab-search-sub-lbl"><input type="radio" name="mon-count" class="panel-tab-search-sub-ipt" value="3"> 3</label>
					<label class="panel-tab-search-sub-lbl"><input type="radio" name="mon-count" class="panel-tab-search-sub-ipt" value="5"> 5</label>
					<label class="panel-tab-search-sub-lbl"><input type="radio" name="mon-count" class="panel-tab-search-sub-ipt" value="8"> 8</label>
					<label class="panel-tab-search-sub-lbl"><input type="radio" name="mon-count" class="panel-tab-search-sub-ipt" value="-1"> <input type="number" class="form-control panel-tab-search-sub-ipt-custom" value="13" min="1"></label>
				</div>
			`).appendTo($controls);
			$wrpCount.find(`.panel-tab-search-sub-ipt-custom`).click(function () {
				$wrpCount.find(`.panel-tab-search-sub-ipt[value=-1]`).prop("checked", true);
				$(this).select();
			});
			const getCount = () => {
				const val = $wrpCount.find(`[name="mon-count"]`).filter(":checked").val();
				if (val === "-1") return Number($wrpCount.find(`.panel-tab-search-sub-ipt-custom`).val());
				return Number(val);
			};

			const $wrpCbRoll = $(`<label class="panel-tab-search-sub-wrp"> Roll HP</label>`).appendTo($controls);
			const $cbRoll = $(`<input type="checkbox">`).prop("checked", cfg.isRollHp).on("change", () => cfg.isRollHp = $cbRoll.prop("checked")).prependTo($wrpCbRoll);
			const $results = $(`<div class="panel-tab-results"/>`).appendTo($modalInner);

			const showMsgIpt = () => {
				flags.isWait = true;
				$results.empty().append(DmScreenUtil.getSearchEnter());
			};

			const showMsgDots = () => $results.empty().append(DmScreenUtil.getSearchLoading());

			const showNoResults = () => {
				flags.isWait = true;
				$results.empty().append(DmScreenUtil.getSearchNoResults());
			};

			const doSearch = () => {
				const srch = $srch.val().trim();
				const MAX_RESULTS = 75; // hard cap results

				const index = board.availContent["Creature"];
				const results = index.search(srch, {
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true}
					},
					bool: "AND",
					expand: true
				});
				const resultCount = results.length ? results.length : index.documentStore.length;
				const toProcess = results.length ? results : Object.values(index.documentStore.docs).slice(0, 75).map(it => ({doc: it}));

				$results.empty();
				if (toProcess.length) {
					const handleClick = (r) => {
						const name = r.doc.n;
						const source = r.doc.s;
						const count = getCount();
						if (isNaN(count) || count < 1) return;

						makeRow(name, undefined, undefined, false, source, undefined, $cbRoll.prop("checked"));
						if (count > 1) {
							for (let i = 1; i < count; ++i) makeRow(name, undefined, undefined, false, source, undefined, $cbRoll.prop("checked"));
						}
						doSort(cfg.sort);
						checkSetFirstActive();
						doClose();
					};

					const get$Row = (r) => {
						return $(`
							<div class="panel-tab-results-row">
								<span>${r.doc.n}</span>
								<span>${r.doc.s ? `<i title="${Parser.sourceJsonToFull(r.doc.s)}">${Parser.sourceJsonToAbv(r.doc.s)}${r.doc.p ? ` p${r.doc.p}` : ""}</i>` : ""}</span>
							</div>
						`);
					};

					if (flags.doClickFirst) {
						handleClick(toProcess[0]);
						flags.doClickFirst = false;
						return;
					}

					const res = toProcess.slice(0, MAX_RESULTS); // hard cap at 75 results

					res.forEach(r => get$Row(r).on("click", () => handleClick(r)).appendTo($results));

					if (resultCount > MAX_RESULTS) {
						const diff = resultCount - MAX_RESULTS;
						$results.append(`<div class="panel-tab-results-row panel-tab-results-row-display-only">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
					}
				} else {
					if (!srch.trim()) showMsgIpt();
					else showNoResults();
				}
			};

			DmScreenUtil.bindAutoSearch($srch, {
				flags: flags,
				search: doSearch,
				showWait: showMsgDots
			});

			$srch.focus();
			doSearch();
		});

		function getStatColsState ($row) {
			return $row.find(`.dm_init__stat`).map((i, e) => {
				return {
					v: $(e).find(`input`).val(),
					id: $(e).attr("data-id")
				};
			}).get();
		}

		function getSaveableState () {
			const rows = $wrpEntries.find(`.dm-init-row`).map((i, e) => {
				const $row = $(e);
				const $conds = $row.find(`.dm-init-cond`);
				const $iptDisplayName = $row.find(`input.displayName`);
				const n = $iptDisplayName.length ? {
					n: $row.find(`input.name`).val(),
					d: $iptDisplayName.val(),
					s: $row.find(`input.scaledCr`).val() || ""
				} : $row.find(`input.name`).val();
				return {
					n,
					k: getStatColsState($row),
					h: $row.find(`input.hp`).val(),
					i: $row.find(`input.score`).val(),
					a: 0 + $row.hasClass(`dm-init-row-active`),
					s: $row.find(`input.source`).val(),
					c: $conds.length ? $conds.map((i, e) => $(e).data("getState")()).get() : []
				}
			}).get();
			return {
				r: rows,
				s: cfg.sort,
				d: cfg.dir,
				m: cfg.isRollHp,
				g: cfg.importIsRollGroups,
				p: cfg.importIsAddPlayers,
				a: cfg.importIsAppend,
				k: cfg.statsAddColumns,
				c: cfg.statsCols.filter(it => !it.isDeleted)
			};
		}

		$wrpTracker.data("getState", getSaveableState);

		function setNextActive () {
			const $rows = $wrpEntries.find(`.dm-init-row`);

			const $rowsActive = $rows.filter(`.dm-init-row-active`).each((i, e) => {
				const $e = $(e);

				// tick down any conditions
				const $conds = $e.find(`.dm-init-cond`);
				if ($conds.length) $conds.each((i, e) => $(e).data("doTickDown")());

				$e.removeClass(`dm-init-row-active`);
			});

			let ix = $rows.index($rowsActive.get($rowsActive.length - 1)) + 1;

			const nxt = $rows.get(ix++);
			if (nxt) {
				const $nxt = $(nxt);
				let $curr = $nxt;
				do {
					// if names and initiatives are the same, skip forwards (groups of monsters)
					if ($curr.find(`input.name`).val() === $nxt.find(`input.name`).val() &&
						$curr.find(`input.score`).val() === $nxt.find(`input.score`).val()) {
						$curr.addClass(`dm-init-row-active`);
						const curr = $rows.get(ix++);
						if (curr) $curr = $(curr);
						else $curr = null;
					} else break;
				} while ($curr);
			} else checkSetFirstActive();
			board.doSaveStateDebounced();
		}

		function makeRow (nameOrMeta = "", hp = "", init = "", isActive, source, conditions = [], rollHp = false, statsCols) {
			const isMon = !!source;
			if (nameOrMeta instanceof Object) {
				// unpack saved
				nameOrMeta.name = nameOrMeta.name || nameOrMeta.n;
				nameOrMeta.displayName = nameOrMeta.displayName || nameOrMeta.d;
				nameOrMeta.scaledTo = nameOrMeta.scaledTo || (nameOrMeta.s ? Number(nameOrMeta.s) : null);
			}
			const displayName = nameOrMeta instanceof Object ? nameOrMeta.displayName : null;
			const name = nameOrMeta instanceof Object ? nameOrMeta.name : nameOrMeta;

			const $wrpRow = $(`<div class="dm-init-row ${isActive ? "dm-init-row-active" : ""}"/>`);

			const $wrpLhs = $(`<div class="dm-init-row-lhs"/>`).appendTo($wrpRow);
			const $iptName = $(`<input class="form-control input-sm name dm-init-lockable dm-init-row-input ${isMon ? "hidden" : ""}" placeholder="Name" value="${name}">`).appendTo($wrpLhs);
			$iptName.on("change", () => doSort(ALPHA));
			if (isMon) {
				const $rows = $wrpEntries.find(`.dm-init-row`);
				const curMon = $rows.find(".init-wrp-creature").filter((i, e) => $(e).parent().find(`input.name`).val() === name && $(e).parent().find(`input.source`).val() === source);
				let monNum = null;
				if (curMon.length) {
					if (curMon.length === 1) {
						const r = $(curMon.get(0));
						r.find(`.init-wrp-creature-link`).append(`<span data-number="1" class="dm_init__number">(1)</span>`);
						monNum = 2;
					} else {
						monNum = curMon.map((i, e) => $(e).find(`span[data-number]`).data("number")).get().reduce((a, b) => Math.max(Number(a), Number(b)), 0) + 1;
					}
				}

				const getLink = () => {
					if (typeof nameOrMeta === "string" || nameOrMeta.scaledTo == null) return EntryRenderer.getDefaultRenderer().renderEntry(`{@creature ${name}|${source}}`);
					else {
						const parts = [name, source, displayName, Parser.numberToCr(nameOrMeta.scaledTo)];
						return EntryRenderer.getDefaultRenderer().renderEntry(`{@creature ${parts.join("|")}}`);
					}
				};

				const $monName = $(`
					<div class="init-wrp-creature split">
						<span class="init-wrp-creature-link">
							${$(getLink()).attr("tabindex", "-1")[0].outerHTML}
							${monNum ? ` <span data-number="${monNum}" class="dm_init__number">(${monNum})</span>` : ""}
						</span>
					</div>
				`).appendTo($wrpLhs);
				$(`<button class="btn btn-success btn-xs dm-init-lockable" title="Add Another (SHIFT for Roll New)" tabindex="-1"><span class="glyphicon glyphicon-plus"></span></button>`)
					.click((evt) => {
						if (cfg.isLocked) return;
						makeRow(
							nameOrMeta,
							"",
							evt.shiftKey ? "" : $iptScore.val(),
							$wrpRow.hasClass("dm-init-row-active"),
							source,
							[],
							cfg.isRollHp,
							evt.shiftKey ? null : getStatColsState($wrpRow)
						);
						doSort(cfg.sort);
					}).appendTo($monName);
				$(`<input class="source hidden" value="${source}">`).appendTo($wrpLhs);

				if (nameOrMeta instanceof Object && nameOrMeta.scaledTo) {
					$(`<input class="displayName hidden" value="${displayName}">`).appendTo($wrpLhs);
					$(`<input class="scaledCr hidden" value="${nameOrMeta.scaledTo}">`).appendTo($wrpLhs);
				}
			}

			function addCondition (name, color, turns) {
				const state = {
					name: name,
					color: color,
					turns: turns ? Number(turns) : null
				};

				const tickDown = (fromClick) => {
					if (fromClick && state.turns == null) $cond.data("doRemove")(); // remove permanent conditions
					if (state.turns == null) return;
					else state.turns--;
					if (state.turns <= 0) $cond.data("doRemove")();
					else $cond.data("doRender")(fromClick);
				};

				const tickUp = (fromClick) => {
					if (fromClick && state.turns == null) state.turns = 0; // convert permanent condition
					if (state.turns == null) return;
					else state.turns++;
					$cond.data("doRender")(fromClick);
				};

				const render = (fromClick) => {
					const turnsText = `${state.turns} turn${state.turns > 1 ? "s" : ""} remaining`;
					const ttpText = state.name && state.turns ? `${state.name.escapeQuotes()} (${turnsText})` : state.name ? state.name.escapeQuotes() : state.turns ? turnsText : "";
					const getBar = () => {
						const style = state.turns == null || state.turns > 3
							? `background-image: linear-gradient(45deg, ${state.color} 41.67%, transparent 41.67%, transparent 50%, ${state.color} 50%, ${state.color} 91.67%, transparent 91.67%, transparent 100%); background-size: 8.49px 8.49px;`
							: `background: ${state.color};`;
						return `<div class="dm-init-cond-bar" style="${style}"/>`
					};
					const inner = state.turns
						? [...new Array(Math.min(state.turns, 3))].map(() => getBar()).join("")
						: getBar();
					$cond.attr("title", ttpText);

					$cond.tooltip({trigger: "hover"});
					if (ttpText) {
						// update tooltips
						$cond.tooltip("enable").tooltip("fixTitle");
						if (fromClick) $cond.tooltip("show");
					} else $cond.tooltip("disable");

					$cond.html(inner);
				};

				const $cond = $(`<div class="dm-init-cond"/>`)
					.data("doRender", render)
					.data("doRemove", () => $cond.tooltip("destroy").remove())
					.data("doTickDown", tickDown)
					.data("doTickUp", tickUp)
					.data("getState", () => JSON.parse(JSON.stringify(state)))
					.on("contextmenu", (e) => e.ctrlKey || (e.preventDefault() || tickDown(true)))
					.click(() => tickUp(true))
					.appendTo($conds);
				if (name) {
					const cond = InitiativeTracker.CONDITIONS.find(it => it.condName !== null && it.name.toLowerCase() === name.toLowerCase().trim());
					if (cond) {
						$cond.on("mouseover", (evt) => {
							if (evt.shiftKey) {
								evt.shiftKey = false;
								EntryRenderer.hover.mouseOver(
									evt,
									$cond[0],
									UrlUtil.PG_CONDITIONS_DISEASES,
									SRC_PHB,
									UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES]({name: cond.condName || cond.name, source: SRC_PHB})
								);
							}
						})
					}
				}
				render();
			}

			const $wrpConds = $(`<div class="split"/>`).appendTo($wrpLhs);
			const $conds = $(`<div class="dm-init-wrp-conds"/>`).appendTo($wrpConds);
			$(`<button class="btn btn-warning btn-xs dm-init-row-btn dm-init-row-btn-flag" title="Add Condition" tabindex="-1"><span class="glyphicon glyphicon-flag"/></button>`)
				.appendTo($wrpConds)
				.on("click", () => {
					const $modal = $(`<div class="panel-addmenu-inner dropdown-menu" style="height: initial"/>`);
					const $wrpModal = $(`<div class="panel-addmenu">`).appendTo($(`body`)).click(() => $wrpModal.remove());
					$modal.appendTo($wrpModal);
					const $modalInner = $(`<div class="modal-inner"/>`).appendTo($modal).click((evt) => evt.stopPropagation());

					const $wrpRows = $(`<div class="dm-init-modal-wrp-rows"/>`).appendTo($modalInner);

					const conds = InitiativeTracker.CONDITIONS;
					for (let i = 0; i < conds.length; i += 3) {
						const $row = $(`<div class="row mb-2"/>`).appendTo($wrpRows);
						const populateCol = (cond) => {
							const $col = $(`<div class="col-4 text-align-center"/>`).appendTo($row);
							if (cond) {
								$(`<button class="btn btn-default btn-xs btn-dm-init-cond" style="background-color: ${cond.color} !important;">${cond.name}</button>`).appendTo($col).click(() => {
									$iptName.val(cond.name);
									$iptColor.val(cond.color);
								});
							}
						};
						[conds[i], conds[i + 1], conds[i + 2]].forEach(populateCol);
					}

					$wrpRows.append(`<hr>`);

					$(`<div class="row mb-2">
						<div class="col-5">Name (optional)</div>
						<div class="col-2 text-align-center">Color</div>
						<div class="col-5">Duration (optional)</div>
					</div>`).appendTo($wrpRows);
					const $controls = $(`<div class="row mb-2"/>`).appendTo($wrpRows);
					const [$wrpName, $wrpColor, $wrpTurns] = [...new Array(3)].map((it, i) => $(`<div class="col-${i === 1 ? 2 : 5} text-align-center"/>`).appendTo($controls));
					const $iptName = $(`<input class="form-control">`)
						.on("keydown", (e) => {
							if (e.which === 13) $btnAdd.click();
						})
						.appendTo($wrpName);
					const $iptColor = $(`<input class="form-control" type="color" value="${MiscUtil.randomColor()}">`).appendTo($wrpColor);
					const $iptTurns = $(`<input class="form-control" type="number" step="1" min="1" placeholder="Unlimited">`)
						.on("keydown", (e) => {
							if (e.which === 13) $btnAdd.click();
						})
						.appendTo($wrpTurns);
					const $wrpAdd = $(`<div class="row">`).appendTo($wrpRows);
					const $wrpAddInner = $(`<div class="col-12 text-align-center">`).appendTo($wrpAdd);
					const $btnAdd = $(`<button class="btn btn-primary">Set Condition</button>`)
						.click(() => {
							addCondition($iptName.val().trim(), $iptColor.val(), $iptTurns.val());
							$wrpModal.remove();
						})
						.appendTo($wrpAddInner);
				});

			$(`<div class="dm-init-row-mid"/>`).appendTo($wrpRow);

			const $wrpRhs = $(`<div class="dm-init-row-rhs"/>`).appendTo($wrpRow);
			let curHp = hp;

			const $iptHp = $(`<input class="form-control input-sm hp dm-init-row-input text-align-right" placeholder="HP" value="${curHp}">`)
				.click(() => $iptHp.select())
				.appendTo($wrpRhs);
			const $iptScore = $(`<input class="form-control input-sm score dm-init-lockable dm-init-row-input text-align-right" placeholder="#" type="number" value="${init}">`)
				.on("change", () => doSort(NUM))
				.click(() => $iptScore.select())
				.appendTo($wrpRhs);

			if (isMon && (curHp === "" || init === "")) {
				const doUpdate = () => {
					const m = EntryRenderer.hover._getFromCache(UrlUtil.PG_BESTIARY, source, hash);

					// set or roll HP
					if (!rollHp && m.hp.average) {
						curHp = m.hp.average;
						$iptHp.val(curHp);
					} else if (rollHp && m.hp.formula) {
						curHp = EntryRenderer.dice.roll2(m.hp.formula, {
							user: false,
							name: getRollName(m),
							label: "HP"
						});
						$iptHp.val(curHp);
					}

					// roll initiative
					if (!init) {
						$iptScore.val(rollInitiative(m));
					}
				};

				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY]({name: name, source: source});
				if (EntryRenderer.hover._isCached(UrlUtil.PG_BESTIARY, source, hash)) doUpdate();
				else {
					EntryRenderer.hover._doFillThenCall(UrlUtil.PG_BESTIARY, source, hash, () => {
						if (!curHp) doUpdate();
					});
				}
			}

			$iptHp.on("change", () => {
				const nxt = $iptHp.val().trim();
				if (nxt && /^[-+0-9]*$/.exec(curHp) && /^[-+0-9]*$/.exec(nxt)) {
					const m = /^[+-]\d+/.exec(nxt);
					const parts = nxt.split(/([+-]\d+)/).filter(it => it);
					let temp = 0;
					parts.forEach(p => temp += Number(p));
					if (m) {
						curHp = Number(curHp) + temp;
					} else if (/[-+]/.exec(nxt)) {
						curHp = temp;
					} else {
						curHp = Number(nxt);
					}
					$iptHp.val(curHp);
				}
			});

			$(`<button class="btn btn-danger btn-xs dm-init-row-btn dm-init-lockable" title="Delete" tabindex="-1"><span class="glyphicon glyphicon-trash"/></button>`)
				.appendTo($wrpRhs)
				.on("click", () => {
					if (cfg.isLocked) return;
					if ($wrpRow.hasClass(`dm-init-row-active`) && $wrpEntries.find(`.dm-init-row`).length > 1) setNextActive();
					$wrpRow.remove();
				});

			populateRowStatCols($wrpRow, statsCols);
			conditions.forEach(c => addCondition(c.name, c.color, c.turns));
			$wrpRow.appendTo($wrpEntries);

			board.doSaveStateDebounced();

			return $wrpRow;
		}

		const populateRowStatCols = ($row, statsCols) => {
			const $mid = $row.find(`.dm-init-row-mid`);

			if (!cfg.statsAddColumns) return $mid.empty();

			const name = $row.find(`.name`).val();
			const source = $row.find(`.source`).val();
			const isMon = !!source;

			const existing = (() => {
				const existing = {};
				if (statsCols) {
					statsCols.forEach(it => existing[it.id] = {id: it.id, v: it.v});
				} else {
					$mid.find(`.dm_init__stat`).each((i, e) => {
						const $e = $(e);
						const id = $e.attr("data-id");
						existing[id] = {
							v: $e.find(`input`).val(),
							id
						};
					});
				}
				return existing;
			})();

			$mid.empty();

			cfg.statsCols.forEach(c => {
				const $ipt = $(`<input class="form-control input-sm dm_init__stat_ipt" ${!cfg.isLocked && (c.e || !isMon) ? "" : "disabled"}>`)
					.change(() => board.doSaveStateDebounced());

				const populateFromBlock = () => {
					const meta = InitiativeTracker.STAT_COLUMNS[c.p];
					if (isMon && meta) {
						const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY]({name: name, source: source});
						const populateStats = async () => {
							const mon = await EntryRenderer.hover.pCacheAndGet(UrlUtil.PG_BESTIARY, source, hash);
							$ipt.val(meta.get(mon));
							board.doSaveStateDebounced();
						};
						populateStats();
					}
				};

				if (c.p && c.po && isMon) { // on changing populate type, re-populate
					populateFromBlock();
				} else if (existing[c.id]) { // otherwise (or for players) use existing value
					$ipt.val(existing[c.id].v);
				} else if (c.p) { // otherwise, populate
					populateFromBlock();
				}

				$mid.append(`<div class="dm_init__stat" data-id="${c.id}"><div data-r/></div>`).swap($ipt);
			});
		};

		const handleStatColsChange = () => {
			// remove any deleted records; apply order
			cfg.statsCols = cfg.statsCols.filter(it => !it.isDeleted).sort((a, b) => a.o - b.o);

			const $wrpHead = $wrpHeader.find(`.dm-init-row-mid`).empty();

			if (cfg.statsAddColumns) {
				cfg.statsCols.forEach(c => {
					$wrpHead.append(`<div class="dm_init__stat_head" ${c.p && InitiativeTracker.STAT_COLUMNS[c.p] ? `title="${InitiativeTracker.STAT_COLUMNS[c.p].name}"` : ""}>${c.a || ""}</div>`);
				});
			}

			const $rows = $wrpEntries.find(`.dm-init-row`);
			$rows.each((i, e) => {
				populateRowStatCols($(e));
			});
			cfg.statsCols.forEach(c => c.po = null);
		};

		function checkSetFirstActive () {
			if ($wrpEntries.find(`.dm-init-row`).length && !$wrpEntries.find(`.dm-init-row-active`).length) {
				const $rows = $wrpEntries.find(`.dm-init-row`);
				const $first = $($rows.get(0));
				$first.addClass(`dm-init-row-active`);
				if ($rows.length > 1) {
					for (let i = 1; i < $rows.length; ++i) {
						const $nxt = $($rows.get(i));
						if ($nxt.find(`input.name`).val() === $first.find(`input.name`).val() &&
							$nxt.find(`input.score`).val() === $first.find(`input.score`).val()) {
							$nxt.addClass(`dm-init-row-active`);
						} else break;
					}
				}
				board.doSaveStateDebounced();
			}
		}

		function doSort (mode) {
			if (cfg.sort !== mode) return;
			const sorted = $wrpEntries.find(`.dm-init-row`).sort((a, b) => {
				let aVal = $(a).find(`input.${cfg.sort === ALPHA ? "name" : "score"}`).val();
				let bVal = $(b).find(`input.${cfg.sort === ALPHA ? "name" : "score"}`).val();
				let first = 0;
				let second = 0;
				if (cfg.sort === NUM) {
					aVal = Number(aVal);
					bVal = Number(bVal);
					first = cfg.dir === ASC ? SortUtil.ascSort(aVal, bVal) : SortUtil.ascSort(bVal, aVal);
				} else {
					let aVal2 = 0;
					let bVal2 = 0;

					const $aNum = $(a).find(`span[data-number]`);
					if ($aNum.length) aVal2 = $aNum.data("number");
					const $bNum = $(b).find(`span[data-number]`);
					if ($bNum.length) bVal2 = $bNum.data("number");

					first = cfg.dir === ASC ? SortUtil.ascSort(aVal, bVal) : SortUtil.ascSort(bVal, aVal);
					second = cfg.dir === ASC ? SortUtil.ascSort(aVal2, bVal2) : SortUtil.ascSort(bVal2, aVal2);
				}
				return first || second;
			});
			$wrpEntries.append(sorted);
			board.doSaveStateDebounced();
		}

		function flipDir () {
			cfg.dir = cfg.dir === ASC ? DESC : ASC;
		}

		function doReset () {
			$wrpEntries.empty();
			cfg.sort = NUM;
			cfg.dir = DESC;
		}

		let firstLoad = true;
		function loadState (state, noReset) {
			if (!firstLoad && !noReset) doReset();
			firstLoad = false;

			(state.r || []).forEach(r => {
				makeRow(r.n, r.h, r.i, r.a, r.s, r.c, false, r.k);
			});
			doSort(cfg.sort);
			checkSetFirstActive();
			handleStatColsChange();
			board.doSaveStateDebounced();
		}

		function getRollName (monster) {
			return `Initiative Tracker \u2014 ${monster.name}`;
		}

		function rollInitiative (monster) {
			return EntryRenderer.dice.roll2(`1d20${Parser.getAbilityModifier(monster.dex)}`, {
				user: false,
				name: getRollName(monster),
				label: "Initiative"
			});
		}

		function getOrRollHp (monster) {
			if (!cfg.isRollHp && monster.hp.average) {
				return `${monster.hp.average}`;
			} else if (cfg.isRollHp && monster.hp.formula) {
				return `${EntryRenderer.dice.roll2(monster.hp.formula, {
					user: false,
					name: getRollName(monster),
					label: "HP"
				})}`;
			}
			return "";
		}

		function convertAndLoadBestiaryList (bestiaryList) {
			const toLoad = {
				s: "NUM",
				d: "DESC",
				m: false,
				g: true,
				r: []
			};

			if (bestiaryList.p && cfg.importIsAddPlayers) {
				bestiaryList.p.forEach(playerGroup => {
					[...new Array(playerGroup.count || 1)].forEach(() => {
						toLoad.r.push({
							n: ``,
							h: "",
							i: "",
							a: 0,
							c: []
						});
					});
				});
			}

			if (bestiaryList.l && bestiaryList.l.items) {
				Promise.all(bestiaryList.l.items.map(it => {
					const count = Number(it.c);
					const hash = it.h;
					const scaling = (() => {
						if (it.uid) {
							const m = /_([\d.,]+)$/.exec(it.uid);
							if (m) {
								return Number(m[1]);
							} else return null;
						} else return null;
					})();
					const source = hash.split(HASH_LIST_SEP)[1];
					return new Promise(resolve => {
						EntryRenderer.hover.pCacheAndGet(UrlUtil.PG_BESTIARY, source, hash)
							.then(mon => {
								if (scaling != null) {
									ScaleCreature.scale(mon, scaling).then(scaled => {
										resolve({
											count,
											monster: scaled
										});
									});
								} else {
									resolve({
										count,
										monster: mon
									});
								}
							});
					})
				})).then((data) => {
					data.forEach(it => {
						const groupInit = cfg.importIsRollGroups ? rollInitiative(it.monster) : null;
						const groupHp = cfg.importIsRollGroups ? getOrRollHp(it.monster) : null;
						[...new Array(it.count || 1)].forEach(() => {
							toLoad.r.push({
								n: {
									name: it.monster.name,
									displayName: it.monster._displayName,
									scaledTo: it.monster._isScaledCr
								},
								i: `${cfg.importIsRollGroups ? groupInit : rollInitiative(it.monster)}`,
								a: 0,
								s: it.monster.source,
								c: [],
								h: `${cfg.importIsRollGroups ? groupHp : getOrRollHp(it.monster)}`
							});
						});
					});
					loadState(toLoad, cfg.importIsAppend);
				});
			} else loadState(toLoad, cfg.importIsAppend);
		}

		loadState(state);
		doSort(cfg.sort);

		return $wrpTracker;
	}
}
InitiativeTracker.CONDITIONS = [
	{
		name: "Blinded",
		color: "#434343"
	},
	{
		name: "Charmed",
		color: "#f01789"
	},
	{
		name: "Concentrating",
		color: "#009f7a",
		condName: null
	},
	{
		name: "Deafened",
		color: "#c7d0d3"
	},
	{
		name: "Drunk",
		color: "#ffcc00"
	},
	{
		name: "Exhausted",
		color: "#947a47",
		condName: "Exhaustion"
	},
	{
		name: "Frightened",
		color: "#c9ca18"
	},
	{
		name: "Grappled",
		color: "#8784a0"
	},
	{
		name: "Incapacitated",
		color: "#3165a0"
	},
	{
		name: "Invisible",
		color: "#7ad2d6"
	},
	{
		name: "!!On Fire!!",
		color: "#ff6800",
		condName: null
	},
	{
		name: "Paralyzed",
		color: "#c00900"
	},
	{
		name: "Petrified",
		color: "#a0a0a0"
	},
	{
		name: "Poisoned",
		color: "#4dc200"
	},
	{
		name: "Prone",
		color: "#5e60a0"
	},
	{
		name: "Restrained",
		color: "#d98000"
	},
	{
		name: "Stunned",
		color: "#a23bcb"
	},
	{
		name: "Unconscious",
		color: "#1c2383"
	}
];
InitiativeTracker._GET_STAT_COLUMN_HR = () => ({isHr: true});
InitiativeTracker.STAT_COLUMNS = {
	hpFormula: {
		name: "HP Formula",
		get: mon => (mon.hp || {}).formula
	},
	armorClass: {
		name: "Armor Class",
		abv: "AC",
		get: mon => mon.ac[0] ? (mon.ac[0].ac || mon.ac[0]) : null
	},
	passivePerception: {
		name: "Passive Perception",
		abv: "PP",
		get: mon => mon.passive
	},
	speed: {
		name: "Speed",
		abv: "SPD",
		get: mon => Math.max(0, ...Object.values(mon.speed || {})
			.map(it => it.number ? it.number : it)
			.filter(it => typeof it === "number"))
	},
	spellDc: {
		name: "Spell DC",
		abv: "DC",
		get: mon => Math.max(0, ...(mon.spellcasting || [])
			.filter(it => it.headerEntries)
			.map(it => {
				return it.headerEntries.map(it => {
					const found = [0];
					it.replace(/DC (\d+)/g, (...m) => found.push(Number(m[1])));
					return Math.max(...found);
				}).filter(Boolean)
			}))
	},
	legendaryActions: {
		name: "Legendary Actions",
		abv: "LA",
		get: mon => mon.legendaryActions || mon.legendary ? 3 : null
	},
	hr0: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Parser.ABIL_ABVS.forEach(it => {
			out[`${it}Save`] = {
				name: `${Parser.attAbvToFull(it)} Save`,
				abv: it.toUpperCase(),
				get: mon => mon.save && mon.save[it] ? mon.save[it] : Parser.getAbilityModifier(mon[it])
			};
		});
		return out;
	})(),
	hr1: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Parser.ABIL_ABVS.forEach(it => {
			out[`${it}Bonus`] = {
				name: `${Parser.attAbvToFull(it)} Bonus`,
				abv: it.toUpperCase(),
				get: mon => Parser.getAbilityModifier(mon[it])
			};
		});
		return out;
	})(),
	hr2: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Parser.ABIL_ABVS.forEach(it => {
			out[`${it}Score`] = {
				name: `${Parser.attAbvToFull(it)} Score`,
				abv: it.toUpperCase(),
				get: mon => mon[it]
			};
		});
		return out;
	})(),
	hr3: InitiativeTracker._GET_STAT_COLUMN_HR(),
	...(() => {
		const out = {};
		Object.keys(Parser.SKILL_TO_ATB_ABV).sort(SortUtil.ascSort).forEach(s => {
			out[s.toCamelCase()] = {
				name: s.toTitleCase(),
				abv: Parser.skillToShort(s).toUpperCase(),
				get: mon => mon.skill && mon.skill[s] ? mon.skill[s] : Parser.getAbilityModifier(mon[Parser.skillToAbilityAbv(s)])
			};
		});
		return out;
	})()
};
