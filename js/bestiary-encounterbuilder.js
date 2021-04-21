"use strict";

class EncounterBuilder extends ProxyBase {
	constructor () {
		super();

		this.stateInit = false;
		this._cache = null;
		this._lastPartyMeta = null;
		this._advanced = false;
		this._lock = new VeLock();

		this._cachedTitle = null;

		// Encounter save/load
		this.__state = {
			savedEncounters: {},
			activeKey: null,
		};
		this._state = this._getProxy("state", this.__state);
		this._$iptName = null;
		this._$btnSave = null;
		this._$btnReload = null;
		this._$btnLoad = null;
		this.pSetSavedEncountersThrottled = MiscUtil.throttle(this._pSetSavedEncounters.bind(this), 50);
		this._infoHoverId = null;

		this.doSaveStateDebounced = MiscUtil.debounce(this.doSaveState, 50);
	}

	initUi () {
		$(`#btn-encounterbuild`).off("click").click(() => Hist.setSubhash(EncounterBuilder.HASH_KEY, true));
		$(`#btn-encounterstatblock`).off("click").click(() => Hist.setSubhash(EncounterBuilder.HASH_KEY, null));

		this._initRandomHandlers();
		this._initAdjustHandlers();

		$(`.ecgen__add_players`).click(() => {
			if (this._advanced) this.addAdvancedPlayerRow(false);
			else this.addPlayerRow(false)
		});

		const $cbAdvanced = $(`.ecgen__players_advanced`).change(() => {
			const party = this.getPartyMeta();
			this._advanced = !!$cbAdvanced.prop("checked");
			if (this._advanced) {
				let first = true;
				party.levelMetas.forEach(it => {
					[...new Array(it.count)].forEach(() => {
						this.addAdvancedPlayerRow(first, false, "", it.level);
						first = false;
					});
				});
				$(`.ecgen__player_group`).remove();
				this.updateDifficulty();
			} else {
				let first = true;
				party.levelMetas.forEach(it => {
					this.addPlayerRow(first, false, it.count, it.level);
					first = false;
				});
				$(`.ecgen__player_advanced`).remove();
				this.updateDifficulty();
			}
			this.updateUiIsAdvanced(this._advanced);
		});

		const $btnSvUrl = $(`.ecgen__sv_url`).click(async () => {
			const encounterPart = UrlUtil.packSubHash(EncounterUtil.SUB_HASH_PREFIX, [JSON.stringify(this.getSaveableState())], {isEncodeBoth: true});
			const parts = [location.href, encounterPart];
			await MiscUtil.pCopyTextToClipboard(parts.join(HASH_PART_SEP));
			JqueryUtil.showCopiedEffect($btnSvUrl);
		});
		$(`.ecgen__sv_file`).click(() => DataUtil.userDownload(`encounter`, this.getSaveableState()));
		$(`.ecgen__ld_file`).click(async () => {
			const json = await DataUtil.pUserUpload();
			if (json.items && json.sources) { // if it's a bestiary sublist
				json.l = {
					items: json.items,
					sources: json.sources,
				}
			}
			this.pDoLoadState(json);
		});
		$(`.ecgen__reset`).title(`SHIFT-click to reset players`).click(evt => confirm("Are you sure?") && encounterBuilder.pReset({isNotResetPlayers: !evt.shiftKey, isNotAddInitialPlayers: !evt.shiftKey}));

		const $btnSvTxt = $(`.ecgen__sv_text`).click(() => {
			const toCopyCreatures = ListUtil.sublist.items
				.map(it => ({name: it.name, ...it.values}))
				.sort((a, b) => SortUtil.ascSortLower(a.name, b.name))
				.map(it => `${it.count}× ${it.name}`)
				.join(", ");
			MiscUtil.pCopyTextToClipboard(`${toCopyCreatures}`);
			JqueryUtil.showCopiedEffect($btnSvTxt);
		});
	}

	_initRandomHandlers () {
		JqueryUtil.bindDropdownButton($(`#ecgen_dropdown_rng`));

		const $btnGen = $(`.ecgen_rng`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter($btnGen.data("mode"))
		});

		$(`.ecgen_rng_trivial`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("trivial");
			$btnGen.data("mode", "trivial").text("Random Trivial").title("Randomly generate a Trivial-threat encounter");
		});
		$(`.ecgen_rng_low`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("low");
			$btnGen.data("mode", "low").text("Random Low").title("Randomly generate a Low-threat encounter");
		});
		$(`.ecgen_rng_moderate`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("moderate");
			$btnGen.data("mode", "moderate").text("Random Moderate").title("Randomly generate a Moderate-threat encounter");
		});
		$(`.ecgen_rng_severe`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("severe");
			$btnGen.data("mode", "severe").text("Random Severe").title("Randomly generate a Severe-threat encounter");
		});
		$(`.ecgen_rng_extreme`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("extreme");
			$btnGen.data("mode", "extreme").text("Random Extreme").title("Randomly generate an Extreme-threat encounter");
		});
	}

	_initAdjustHandlers () {
		JqueryUtil.bindDropdownButton($(`#ecgen_dropdown_adj`));

		const $btnAdjust = $(`.ecgen_adj`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter($btnAdjust.data("mode"))
		});

		$(`.ecgen_adj_trivial`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("trivial");
			$btnAdjust.data("mode", "trivial").text("Adjust to Trivial").title("Adjust the current encounter difficulty to a Trivial-threat encounter");
		});
		$(`.ecgen_adj_low`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("low");
			$btnAdjust.data("mode", "low").text("Adjust to Low").title("Adjust the current encounter difficulty to a Low-threat encounter");
		});
		$(`.ecgen_adj_moderate`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("moderate");
			$btnAdjust.data("mode", "moderate").text("Adjust to Moderate").title("Adjust the current encounter difficulty to a Moderate-threat encounter");
		});
		$(`.ecgen_adj_severe`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("severe");
			$btnAdjust.data("mode", "severe").text("Adjust to Severe").title("Adjust the current encounter difficulty to a Severe-threat encounter");
		});
		$(`.ecgen_adj_extreme`).click((evt) => {
			evt.preventDefault();
			this.pDoAdjustEncounter("extreme");
			$btnAdjust.data("mode", "extreme").text("Adjust to Extreme").title("Adjust the current encounter difficulty to an Extreme-threat encounter");
		});
	}

	updateUiIsAdvanced () {
		$(`.ecgen__players_advanced`).prop("checked", this._advanced);
		$(`.ecgen__player_advanced_extra_head `).remove();
		$(`.ecgen__player_advanced_extra_foot`).remove();
		if (this._advanced) {
			$(`.ecgen__add_players`).html(`<span class="glyphicon glyphicon-plus"></span> Add Another Player`);
			$(`.ecgen__group_lhs`).addClass(`ecgen__group_lhs--advanced`);
			$(`.ecgen__advanced_help`).show();
		} else {
			$(`.ecgen__add_players`).html(`<span class="glyphicon glyphicon-plus"></span> Add Another Level`);
			$(`.ecgen__group_lhs`).removeClass(`ecgen__group_lhs--advanced`);
			$(`.ecgen__advanced_help`).hide();
		}
	}

	async initState () {
		const initialState = await EncounterUtil.pGetInitialState();
		if (initialState && initialState.data) await this.pDoLoadState(initialState.data, initialState.type === "local");
		else this.addInitialPlayerRows();
		this.stateInit = true;
		await this._initSavedEncounters();
	}

	addInitialPlayerRows (first) {
		if (this._advanced) this.addAdvancedPlayerRow(first);
		else this.addPlayerRow(first, true, ECGEN_BASE_PLAYERS);
	}

	/**
	 * @param [opts] Options object
	 * @param [opts.isNotRemoveCreatures] If creature rows should not be removed.
	 * @param [opts.isNotResetPlayers] If player info should not be reset.
	 * @param [opts.isNotAddInitialPlayers] If initial player info should not be added.
	 */
	async pReset (opts) {
		opts = opts || {};
		if (!opts.isNotRemoveCreatures) await ListUtil.pDoSublistRemoveAll();
		if (!opts.isNotResetPlayers) this.removeAllPlayerRows();
		if (!opts.isNotAddInitialPlayers) this.addInitialPlayerRows();

		this._state.activeKey = null;
		this.pSetSavedEncountersThrottled();
	}

	async pDoLoadState (savedState, playersOnly) {
		await this.pReset({isNotAddInitialPlayers: true, isNotRemoveCreatures: playersOnly});
		if (!savedState) return;
		try {
			if (savedState.a) {
				this._advanced = true;
				this.updateUiIsAdvanced();
				if (savedState.d && savedState.d.length) {
					savedState.d.forEach((details, i) => this.addAdvancedPlayerRow(!i, false, details.n, details.l, details.x));
				} else this.addInitialPlayerRows(false);

				if (savedState.c && savedState.c.length) {
					savedState.c.forEach(col => {
						this.addAdvancedColumnHeader(col);
						this.addAdvancedColumnFooter();
					});
				}
			} else {
				if (savedState.p && savedState.p.length) {
					savedState.p.forEach(({count, level}, i) => this.addPlayerRow(!i, false, count, level));
				} else this.addInitialPlayerRows(false);
			}

			if (savedState.l && !playersOnly) {
				await pPreloadSublistSources(savedState.l);
				await ListUtil.pDoJsonLoad(savedState.l, false);
			}

			this.updateDifficulty();
		} catch (e) {
			JqueryUtil.doToast({content: `Could not load encounter! Was the file valid?`, type: "danger"});
			this.pReset();
		}
	}

	getSaveableState () {
		const out = {
			p: this.getPartyMeta().levelMetas,
			l: ListUtil.getExportableSublist(),
			a: this._advanced,
		};
		if (this._advanced) {
			out.c = $(`.ecgen__players_head_advanced`).find(`.ecgen__player_advanced_extra_head`).map((i, e) => $(e).val()).get();
			out.d = $(`.ecgen__player_advanced`).map((i, e) => {
				const $e = $(e);
				const extras = $e.find(`.ecgen__player_advanced_extra`).map((i, e) => $(e).val()).get();
				while (extras.length < out.c.length) extras.push(""); // pad array to match columns length

				return {
					n: $e.find(`.ecgen__player_advanced__name`).val(),
					l: Number($e.find(`.ecgen__player_advanced__level`).val()),
					x: extras.slice(0, out.c.length), // cap at columns length
				};
			}).get();
		}
		return out;
	}

	doSaveState () {
		if (this.stateInit) EncounterUtil.pDoSaveState(this.getSaveableState());
	}

	generateCache () {
		// create a map of {XP: [creature list]}
		if (this._cache == null) {
			const partyMeta = this.getPartyMeta();
			this._cache = (() => {
				const out = {};
				list.visibleItems.map(it => creatures[it.ix]).filter(c => !c.isNpc).forEach(c => {
					const xp = EncounterBuilderUtils.getCreatureXP(partyMeta, c);
					if (xp) (out[xp] = out[xp] || []).push(c);
				});
				return out;
			})();
		}
	}

	resetCache () {
		this._cache = null;
	}

	async pDoAdjustEncounter (difficulty) {
		let currentEncounter = EncounterBuilderUtils.getSublistedEncounter();
		if (!currentEncounter.length) {
			return JqueryUtil.doToast({content: `The current encounter contained no creatures! Please add some first.`, type: "warning"})
		}
		currentEncounter.forEach(creatureType => creatureType.count = 1);

		const partyMeta = this.getPartyMeta();
		let encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, partyMeta);

		const ixLow = EncounterBuilder.TIERS.indexOf(difficulty);
		if (!~ixLow) throw new Error(`Unhandled difficulty level: "${difficulty}"`);
		const [targetMin, targetMax] = [
			Math.floor(partyMeta[EncounterBuilder.TIERS[ixLow - 1] || 10]),
			Math.ceil((partyMeta[EncounterBuilder.TIERS[ixLow]])),
		];

		if (encounterXp.XP > targetMax) {
			JqueryUtil.doToast({content: `Could not adjust the current encounter to ${difficulty.uppercaseFirst()}, try removing some creatures!`, type: "danger"})
		} else {
			// randomly choose creatures to skip
			// generate array of [0, 1, ... n-1] where n = number of unique creatures
			// this will be used to determine how many of the unique creatures we want to skip
			const numSkipTotals = [...new Array(currentEncounter.length)].map((_, ix) => ix);

			const doTryAdjusting = () => {
				if (!numSkipTotals.length) return -1; // no solution possible, so exit loop

				let skipIx = 0;
				// 7/12 * 7/12 * ... chance of moving the skipIx along one
				while (!(RollerUtil.randomise(12) > 7) && skipIx < numSkipTotals.length - 1) skipIx++;

				const numSkips = numSkipTotals.splice(skipIx, 1)[0]; // remove the selected skip amount; we'll try the others if this one fails
				const curUniqueCreatures = [...currentEncounter];
				if (numSkips) {
					[...new Array(numSkips)].forEach(() => {
						const ixRemove = RollerUtil.randomise(curUniqueCreatures.length) - 1;
						curUniqueCreatures.splice(ixRemove, 1);
					});
				}

				let maxTries = 999;
				while (!(encounterXp.XP > targetMin && encounterXp.XP <= targetMax) && maxTries-- > 0) {
					// chance to skip each creature at each iteration
					// otherwise, the case where every creature is relevant produces an equal number of every creature
					const pickFrom = [...curUniqueCreatures];
					if (pickFrom.length > 1) {
						let loops = Math.floor(pickFrom.length / 2);
						// skip [half, n-1] creatures
						loops = RollerUtil.randomise(pickFrom.length - 1, loops);
						while (loops-- > 0) {
							const ix = RollerUtil.randomise(pickFrom.length) - 1;
							pickFrom.splice(ix, 1);
						}
					}

					while (pickFrom.length) {
						const ix = RollerUtil.randomise(pickFrom.length) - 1;
						const picked = pickFrom.splice(ix, 1)[0];
						picked.count++;
						encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, partyMeta);
						if (encounterXp.XP > targetMax) {
							picked.count--;
							encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, partyMeta);
						}
					}
				}

				return maxTries < 0 ? 0 : 1; // 1 if a solution was found, 0 otherwise
			};

			const invalidSolutions = [];
			let lastSolution;
			while (!(lastSolution = doTryAdjusting())) { // -1/1 = complete; 0 = continue
				invalidSolutions.push(MiscUtil.copy(currentEncounter));
				currentEncounter.forEach(it => it.count = 1); // reset for next attempt
			}

			// no good solution was found, so pick the closest invalid solution
			if (lastSolution === -1 && invalidSolutions.length) {
				currentEncounter = invalidSolutions.map(is => ({
					encounter: is,
					distance: (() => {
						const xp = EncounterBuilderUtils.calculateEncounterXp(is, partyMeta);
						if (xp > targetMax) return xp - targetMax;
						else if (xp < targetMin) return targetMin - xp;
						else return 0;
					})(),
				})).sort((a, b) => SortUtil.ascSort(a.distance, b.distance))[0].encounter;
			}

			const trashMobs = currentEncounter.filter(it => it.level && it.level < partyMeta.partyLevel - 4);
			const throttle = Math.min(...currentEncounter.filter(it => it.level && it.level >= partyMeta.partyLevel - 4).map(it => it.count));

			if (trashMobs.length) {
				const medLvl = partyMeta.median;
				const partySize = partyMeta.partySize;

				// try to avoid flooding low-level parties
				const playerToCreatureRatio = [medLvl < 3 ? 0.8 : 1, 4.2 * Math.log10(0.42 * medLvl + 1) + 0.42]
				const [minDesired, maxDesired] = [Math.floor(playerToCreatureRatio[0] * partySize), Math.min(Math.ceil(playerToCreatureRatio[1] * partySize), throttle + 6)];
				while (true) {
					const totalCreatures = currentEncounter.map(it => it.count).reduce((a, b) => a + b, 0);

					// if there's less than min desired, large chance of adding more
					// if there's more than max desired, small chance of adding more
					// if there's between min and max desired, medium chance of adding more
					const chanceToAdd = totalCreatures < minDesired ? 90 : totalCreatures > maxDesired ? 40 : 75;

					const isAdd = RollerUtil.roll(100) < chanceToAdd;
					if (isAdd) {
						RollerUtil.rollOnArray(trashMobs).count++;
						encounterXp = EncounterBuilderUtils.calculateEncounterXp(currentEncounter, partyMeta);
					} else break;
				}
			}
		}

		await this._pLoadSublist({
			items: currentEncounter.map(creatureType => ({
				h: creatureType.hash,
				c: `${creatureType.count}`,
				customHashId: creatureType.customHashId || undefined,
			})),
			sources: ListUtil.getExportableSublist().sources,
		});
	}

	async pDoGenerateEncounter (difficulty) {
		const partyMeta = this.getPartyMeta();

		const ixLow = EncounterBuilder.TIERS.indexOf(difficulty);
		if (!~ixLow) throw new Error(`Unhandled difficulty level: "${difficulty}"`);
		const budget = partyMeta[EncounterBuilder.TIERS[ixLow]];

		this.generateCache();

		const closestSolution = this._pDoGenerateEncounter_generateClosestEncounter(partyMeta, budget);

		if (closestSolution) {
			const toLoad = {items: []};
			const sources = new Set();
			closestSolution.encounter.forEach(it => {
				toLoad.items.push({h: UrlUtil.autoEncodeHash(it.cr), c: String(it.count)});
				sources.add(it.cr.source);
			});
			toLoad.sources = [...sources];
			await this._pLoadSublist(toLoad);
		} else {
			await ListUtil.pDoSublistRemoveAll();
			this.updateDifficulty();
		}
		if (EncounterBuilderUtils.calculateListEncounterXp(partyMeta).XP === 0) {
			JqueryUtil.doToast({
				content: `Could not generate a ${difficulty.uppercaseFirst()}-threat encounter with filtered creatures! Try adjusting the filters.`,
				type: "warning",
			});
		}
	}

	_pDoGenerateEncounter_generateClosestEncounter (partyMeta, budget) {
		const getCurrentEncounterMeta = (encounter) => {
			const data = encounter.map(it => ({level: it.cr.level, count: it.count}));
			return EncounterBuilderUtils.calculateEncounterXp(data, partyMeta);
		};

		const calcNextBudget = (encounter) => {
			if (!encounter.length) return budget;

			const curr = getCurrentEncounterMeta(encounter);
			return budget - curr.XP;
		};

		const addToEncounter = (encounter, xp) => {
			const existing = encounter.filter(it => it.xp === xp);
			if (existing.length && RollerUtil.roll(100) < 85) { // 85% chance to add another copy of an existing monster
				RollerUtil.rollOnArray(existing).count++;
			} else {
				const rolled = RollerUtil.rollOnArray(this._cache[xp]);
				// add to an existing group, if present
				const existing = encounter.find(it => it.cr.source === rolled.source && it.cr.name === rolled.name);
				if (existing) existing.count++;
				else {
					encounter.push({
						xp: xp,
						cr: rolled,
						count: 1,
					});
				}
			}
		};

		const doFind = (budget) => {
			const xps = Object.values(Parser.XP_CHART).filter(x => x <= budget).sort(SortUtil.ascSort);
			const enc = [];

			let nextBudget = budget;
			while (xps.length) {
				const xp = xps[Math.floor(Math.sqrt(RollerUtil.roll(xps.length ** 2)))];
				if (xp > nextBudget) {
					xps.splice(xps.indexOf(xp), 1);
					continue;
				}
				if (this._cache[xp] == null) {
					xps.splice(xps.indexOf(xp), 1);
					continue;
				}
				addToEncounter(enc, xp);

				nextBudget = calcNextBudget(enc);
			}
			return enc;
		};

		const encounter = doFind(budget)
		return {encounter, XP: getCurrentEncounterMeta(encounter).XP}
	}

	async _pLoadSublist (toLoad) {
		await pPreloadSublistSources(toLoad);
		await ListUtil.pDoJsonLoad(toLoad, false);
		this.updateDifficulty();
	}

	addAdvancedPlayerRow (first = true, doUpdate = true, name, level, extraCols) {
		$(`.ecgen__wrp_add_players`).before(EncounterBuilder.getAdvancedPlayerRow(first, name, level, extraCols));
		if (doUpdate) this.updateDifficulty();
	}

	addPlayerRow (first = true, doUpdate = true, count, level) {
		$(`.ecgen__wrp_add_players`).before(EncounterBuilder.getPlayerRow(first, count, level));
		if (doUpdate) this.updateDifficulty();
	}

	removeAllPlayerRows () {
		$(`.ecgen__player_group`).remove();
		$(`.ecgen__player_advanced`).remove();
	}

	isActive () {
		return Hist.getSubHash(EncounterBuilder.HASH_KEY) === "true";
	}

	show () {
		this._cachedTitle = this._cachedTitle || document.title;
		document.title = "Encounter Builder - Pf2eTools";
		$(`body`).addClass("ecgen_active");
		this.updateDifficulty();
	}

	hide () {
		if (this._cachedTitle) {
			document.title = this._cachedTitle;
			this._cachedTitle = null;
		}
		$(`body`).removeClass("ecgen_active");
	}

	handleClick (evt, ix, add, customHashId) {
		const data = customHashId ? {customHashId} : undefined;
		if (add) ListUtil.pDoSublistAdd(ix, true, evt.shiftKey ? 5 : 1, data);
		else ListUtil.pDoSublistSubtract(ix, evt.shiftKey ? 5 : 1, data);
	}

	async pHandleShuffleClick (ix) {
		await this._lock.pLock();

		try {
			const cr = creatures[ix];
			const xp = EncounterBuilderUtils.getCreatureXP(this.getPartyMeta(), cr);
			if (!xp) return; // if Unknown/etc

			const curr = ListUtil.getExportableSublist();
			const hash = UrlUtil.autoEncodeHash(cr);
			const itemToSwitch = curr.items.find(it => it.h === hash);

			this.generateCache();
			const availMons = this._cache[xp];
			if (availMons.length !== 1) {
				// note that this process does not remove any old sources

				let reroll = cr;
				let rolledHash = hash;
				while (rolledHash === hash) {
					reroll = RollerUtil.rollOnArray(availMons);
					rolledHash = UrlUtil.autoEncodeHash(reroll);
				}
				itemToSwitch.h = rolledHash;
				if (!curr.sources.includes(reroll.source)) {
					curr.sources.push(reroll.source);
				}

				// do a pass to merge any duplicates
				outer: for (let i = 0; i < curr.items.length; ++i) {
					const item = curr.items[i];
					for (let j = i - 1; j >= 0; --j) {
						const prevItem = curr.items[j];

						if (item.h === prevItem.h) {
							prevItem.c = String(Number(prevItem.c) + Number(item.c));
							curr.items.splice(i, 1);
							continue outer;
						}
					}
				}

				await this._pLoadSublist(curr);
			} // else can't reroll
		} finally {
			this._lock.unlock();
		}
	}

	handleSubhash () {
		// loading state from the URL is instead handled as part of EncounterUtil.pGetInitialState
		if (Hist.getSubHash(EncounterBuilder.HASH_KEY) === "true") this.show();
		else this.hide();
	}

	removeAdvancedPlayerRow (ele) {
		const $ele = $(ele);
		$ele.closest(`.ecgen__player_advanced`).remove();
		this.updateDifficulty();
	}

	removePlayerRow (ele) {
		const $ele = $(ele);
		$ele.closest(`.ecgen__player_group`).remove();
		this.updateDifficulty();
	}

	updateDifficulty () {
		const {partyMeta, encounter} = this.calculateXp();

		const $elTrivial = $(`.ecgen__trivial`).removeClass("bold").html(`<span class="help--subtle" title="${EncounterBuilder._TITLE_TRIVIAL}">Trivial:</span> ${partyMeta.trivial.toLocaleString()} XP`);
		const $elLow = $(`.ecgen__low`).removeClass("bold").html(`<span class="help--subtle" title="${EncounterBuilder._TITLE_LOW}">Low:</span> ${partyMeta.low.toLocaleString()} XP`);
		const $elModerate = $(`.ecgen__moderate`).removeClass("bold").html(`<span class="help--subtle" title="${EncounterBuilder._TITLE_MODERATE}">Moderate:</span> ${partyMeta.moderate.toLocaleString()} XP`);
		const $elSevere = $(`.ecgen__severe`).removeClass("bold").html(`<span class="help--subtle" title="${EncounterBuilder._TITLE_SEVERE}">Severe:</span> ${partyMeta.severe.toLocaleString()} XP`);
		const $elExtreme = $(`.ecgen__extreme`).removeClass("bold").html(`<span class="help--subtle" title="${EncounterBuilder._TITLE_EXTREME}">Extreme:</span> ${partyMeta.extreme.toLocaleString()} XP`);

		if (encounter.feasibleCount + encounter.underCount + encounter.overCount !== 0) {
			let difficulty = "TPK";
			if (encounter.XP <= partyMeta.trivial) {
				difficulty = "Trivial";
				$elTrivial.addClass("bold");
			} else if (encounter.XP <= partyMeta.low) {
				difficulty = "Low";
				$elLow.addClass("bold");
			} else if (encounter.XP <= partyMeta.moderate) {
				difficulty = "Moderate";
				$elModerate.addClass("bold");
			} else if (encounter.XP <= partyMeta.severe) {
				difficulty = "Severe";
				$elSevere.addClass("bold");
			} else if (encounter.XP <= partyMeta.extreme) {
				difficulty = "Extreme";
				$elExtreme.addClass("bold");
			} else {
				// greater than extreme difficulty
			}
			$(`.ecgen__req_creatures`).showVe();
			$(`.ecgen__rating`).text(`Difficulty: ${difficulty}`);
			$(`.ecgen__xp_total`).text(`Encounter XP: ${encounter.XP.toLocaleString()}`);
		} else {
			$(`.ecgen__req_creatures`).hideVe();
		}

		if (encounter.overCount) $(`.ecgen__overlevel`).showVe()
		else $(`.ecgen__overlevel`).hideVe()

		this.doSaveState();
	}

	getPartyMeta () {
		let rawPlayerArr;
		if (this._advanced) {
			const $players = $(`.ecgen__player_advanced`);
			const countByLevel = {};
			$players.each((i, e) => {
				const level = $(e).find(`.ecgen__player_advanced__level`).val();
				countByLevel[level] = (countByLevel[level] || 0) + 1;
			});
			rawPlayerArr = Object.entries(countByLevel).map(([level, count]) => ({level: Number(level), count}));
		} else {
			rawPlayerArr = $(`.ecgen__player_group`).map((i, e) => {
				const $e = $(e);
				return {
					count: Number($e.find(`.ecgen__player_group__count`).val()),
					level: Number($e.find(`.ecgen__player_group__level`).val()),
				}
			}).get();
		}

		const out = new EncounterPartyMeta(rawPlayerArr);
		this._lastPartyMeta = out;
		return out;
	}

	get lastPartyMeta () { return this._lastPartyMeta; }

	calculateXp () {
		const partyMeta = this.getPartyMeta();
		const encounter = EncounterBuilderUtils.calculateListEncounterXp(partyMeta);
		return {partyMeta: partyMeta, encounter: encounter};
	}

	static async doStatblockMouseOver (evt, ele, ixMon, scaledTo) {
		const mon = creatures[ixMon];

		const hash = UrlUtil.autoEncodeHash(mon);
		const preloadId = scaledTo != null ? `${VeCt.HASH_MON_SCALED}:${scaledTo}` : null;
		return Renderer.hover.pHandleLinkMouseOver(evt, ele, UrlUtil.PG_BESTIARY, mon.source, hash, preloadId);
	}

	static async handleImageMouseOver (evt, $ele, ixMon) {
		// We'll rebuild the mouseover handler with whatever we load
		$ele.off("mouseover");

		const mon = creatures[ixMon];

		const handleNoImages = () => {
			const hoverMeta = Renderer.hover.getMakePredefinedHover(
				{
					type: "entries",
					entries: [
						Renderer.utils.HTML_NO_IMAGES,
					],
					data: {
						hoverTitle: `Image \u2014 ${mon.name}`,
					},
				},
				{isBookContent: true},
			);
			$ele.mouseover(evt => hoverMeta.mouseOver(evt, $ele[0]))
				.mousemove(evt => hoverMeta.mouseMove(evt, $ele[0]))
				.mouseleave(evt => hoverMeta.mouseLeave(evt, $ele[0]));
			$ele.mouseover();
		};

		const handleHasImages = () => {
			if (fluff && fluff.images && fluff.images.length) {
				const hoverMeta = Renderer.hover.getMakePredefinedHover(
					{
						type: "image",
						href: fluff.images[0].href,
						data: {
							hoverTitle: `Image \u2014 ${mon.name}`,
						},
					},
					{isBookContent: true},
				);
				$ele.mouseover(evt => hoverMeta.mouseOver(evt, $ele[0]))
					.mousemove(evt => hoverMeta.mouseMove(evt, $ele[0]))
					.mouseleave(evt => hoverMeta.mouseLeave(evt, $ele[0]));
				$ele.mouseover();
			} else return handleNoImages();
		};

		const fluff = await Renderer.creature.pGetFluff(mon);

		if (fluff) handleHasImages();
		else handleNoImages();
	}

	async pDoLvlChange ($iptLvl, ixCr, scaledTo) {
		await this._lock.pLock();

		if (!$iptLvl) return;

		try {
			const creature = creatures[ixCr];
			const baseLvl = creature.level;
			const targetLvl = Number($iptLvl.val());

			if (Parser.isValidCreatureLvl(targetLvl)) {
				if (targetLvl === scaledTo) return;

				const state = ListUtil.getExportableSublist();
				const toFindHash = UrlUtil.autoEncodeHash(creature);

				const toFindUid = !(scaledTo == null || baseLvl === scaledTo) ? getCustomHashId(creature.name, creature.source, scaledTo) : null;
				const ixCurrItem = state.items.findIndex(it => {
					if (scaledTo == null || scaledTo === baseLvl) return !it.customHashId && it.h === toFindHash;
					else return it.customHashId === toFindUid;
				});
				if (!~ixCurrItem) throw new Error(`Could not find previously sublisted item!`);

				const toFindNxtUid = baseLvl !== targetLvl ? getCustomHashId(creature.name, creature.source, targetLvl) : null;
				const nextItem = state.items.find(it => {
					if (targetLvl === baseLvl) return !it.customHashId && it.h === toFindHash;
					else return it.customHashId === toFindNxtUid;
				});

				// if there's an existing item with a matching UID (or lack of), merge into it
				if (nextItem) {
					const curr = state.items[ixCurrItem];
					nextItem.c = `${Number(nextItem.c || 1) + Number(curr.c || 1)}`;
					state.items.splice(ixCurrItem, 1);
				} else {
					// if we're returning to the original level, wipe the existing UID. Otherwise, adjust it
					if (targetLvl === baseLvl) delete state.items[ixCurrItem].customHashId;
					else state.items[ixCurrItem].customHashId = getCustomHashId(creature.name, creature.source, targetLvl);
				}

				await this._pLoadSublist(state);
			} else {
				JqueryUtil.doToast({
					content: `"${$iptLvl.val()}" is not a valid Level! Please enter a valid level (between -1 and -25).`,
					type: "danger",
				});
				$iptLvl.val(scaledTo || baseLvl);
			}
		} finally {
			this._lock.unlock();
		}
	}

	addAdvancedColumnHeader (name) {
		$(`.ecgen__advanced_add_col`).before(EncounterBuilder.getAdvancedPlayerDetailHeader(name));
	}

	addAdvancedColumnFooter () {
		$(`.ecgen__wrp_add_players`).append(`
			<div class="ecgen__player_advanced_narrow ecgen__player_advanced_extra_foot mr-1">
				<button class="btn btn-xs btn-danger ecgen__advanced_remove_col" onclick="encounterBuilder.removeAdvancedColumn(this)" title="Remove Column"><span class="glyphicon-trash glyphicon"/></button>
			</div>
		`);
	}

	addAdvancedColumn () {
		this.addAdvancedColumnHeader();
		$(`.ecgen__player_advanced`).each((i, e) => {
			$(e).find(`input`).last().after(EncounterBuilder.getAdvancedPlayerDetailColumn());
		});
		this.addAdvancedColumnFooter();
		this.doSaveStateDebounced();
	}

	removeAdvancedColumn (ele) {
		const $e = $(ele);
		const pos = $(`.ecgen__wrp_add_players`).find(`.ecgen__player_advanced_extra_foot`).index($e.parent());
		$e.parent().remove();
		$(`.ecgen__player_advanced`).each((i, e) => {
			$($(e).find(`.ecgen__player_advanced_extra`)[pos]).remove();
		});
		$($(`.ecgen__players_head_advanced .ecgen__player_advanced_extra_head`)[pos]).remove();
	}

	static getAdvancedPlayerDetailHeader (name) {
		return `
			<input class="ecgen__player_advanced_narrow ecgen__player_advanced_extra_head form-control form-control--minimal input-xs text-center mr-1" autocomplete="new-password" value="${(name || "").escapeQuotes()}" onchange="encounterBuilder.doSaveStateDebounced()">
		`;
	}

	static getAdvancedPlayerDetailColumn (value) {
		return `
			<input class="ecgen__player_advanced_narrow ecgen__player_advanced_extra form-control form-control--minimal input-xs text-center mr-1" value="${(value || "").escapeQuotes()}" onchange="encounterBuilder.doSaveStateDebounced()">
		`;
	}

	static getAdvancedPlayerRow (isFirst, name, level, extraVals) {
		extraVals = extraVals || [...new Array($(`.ecgen__player_advanced_extra_head`).length)].map(() => "");
		return `
			<div class="row mb-2 ecgen__player_advanced">
				<div class="w-100 flex ecgen__player_advanced_flex">
					<input class="ecgen__player_advanced__name form-control form-control--minimal input-xs mr-1" value="${(name || "").escapeQuotes()}" onchange="encounterBuilder.doSaveStateDebounced()">
					<input value="${level || 1}" min="1" max="20" type="number" class="ecgen__player_advanced__level ecgen__player_advanced_narrow form-control form-control--minimal input-xs text-right mr-1" onchange="encounterBuilder.updateDifficulty()">
					${extraVals.map(it => EncounterBuilder.getAdvancedPlayerDetailColumn(it)).join("")}
					${!isFirst ? `
					<button class="btn btn-danger btn-xs ecgen__del_players" onclick="encounterBuilder.removeAdvancedPlayerRow(this)" title="Remove Player">
						<span class="glyphicon glyphicon-trash"></span>
					</button>
					` : `<div class="ecgen__del_players_filler"/>`}
				</div>
			</div>
		`;
	}

	static getPlayerRow (isFirst, count, level) {
		count = Number(count) || 1;
		level = Number(level) || 1;
		return `
			<div class="flex-v-center mb-2 ecgen__player_group">
				<div class="w-20">
					<select class="ecgen__player_group__count form-control form-control--minimal input-xs" onchange="encounterBuilder.updateDifficulty()">
					${[...new Array(12)].map((_, i) => `<option ${(count === i + 1) ? "selected" : ""}>${i + 1}</option>`).join("")}
					</select>
				</div>
				<div class="w-20">
					<select class="ecgen__player_group__level form-control form-control--minimal input-xs" onchange="encounterBuilder.updateDifficulty()" >
						${[...new Array(20)].map((_, i) => `<option ${(level === i + 1) ? "selected" : ""}>${i + 1}</option>`).join("")}
					</select>
				</div>
				${!isFirst ? `
				<div class="ml-2 flex-v-center" style="height: 20px;">
					<button class="btn btn-danger btn-xs ecgen__del_players" onclick="encounterBuilder.removePlayerRow(this)" title="Remove Player Group">
						<span class="glyphicon glyphicon-trash"></span>
					</button>
				</div>
				` : ""}
			</div>
		`;
	}

	static getButtons (monId) {
		return `<span class="ecgen__visible col-1 no-wrap pl-0" onclick="event.preventDefault(); event.stopPropagation()">
			<button title="Add (SHIFT for 5)" class="btn btn-success btn-xs ecgen__btn_list" onclick="encounterBuilder.handleClick(event, ${monId}, 1)"><span class="glyphicon glyphicon-plus"></span></button>
			<button title="Subtract (SHIFT for 5)" class="btn btn-danger btn-xs ecgen__btn_list" onclick="encounterBuilder.handleClick(event, ${monId}, 0)"><span class="glyphicon glyphicon-minus"></span></button>
		</span>`;
	}

	static $getSublistButtons (monId, customHashId) {
		const $btnAdd = $(`<button title="Add (SHIFT for 5)" class="btn btn-success btn-xs ecgen__btn_list"><span class="glyphicon glyphicon-plus"/></button>`)
			.click(evt => encounterBuilder.handleClick(evt, monId, true, customHashId));

		const $btnSub = $(`<button title="Subtract (SHIFT for 5)" class="btn btn-danger btn-xs ecgen__btn_list"><span class="glyphicon glyphicon-minus"/></button>`)
			.click(evt => encounterBuilder.handleClick(evt, monId, false, customHashId));

		const $btnRandomize = $(`<button title="Randomize Monster" class="btn btn-default btn-xs ecgen__btn_list"><span class="glyphicon glyphicon-random" style="right: 1px"/></button>`)
			.click(() => encounterBuilder.pHandleShuffleClick(monId));

		return $$`<span class="ecgen__visible col-1-5 no-wrap pl-0">
			${$btnAdd}
			${$btnSub}
			${$btnRandomize}
		</span>`
			.click(evt => {
				evt.preventDefault();
				evt.stopPropagation()
			});
	}

	// region saved encounters
	async _initSavedEncounters () {
		const $wrpControls = $(`#ecgen__wrp-save-controls`).empty();

		const savedState = await EncounterUtil.pGetSavedState();
		Object.assign(this._state, savedState);

		const pLoadActiveEncounter = async () => {
			// save/restore the active key, to prevent it from being killed by the reset
			const cached = this._state.activeKey;
			const encounter = this._state.savedEncounters[this._state.activeKey];
			await this.pDoLoadState(encounter.data);
			this._state.activeKey = cached;
			this.pSetSavedEncountersThrottled();
		};

		this._$iptName = $(`<input class="form-control form-control--minimal mb-3 mt-0 px-2 text-right bold" style="max-width: 330px;"/>`)
			.change(() => {
				const name = this._$iptName.val().trim() || "(Unnamed Encounter)";
				this._$iptName.val(name);
				const encounter = this._state.savedEncounters[this._state.activeKey];
				encounter.name = name;
				this._state.savedEncounters = {
					...this._state.savedEncounters,
					[this._state.activeKey]: encounter,
				};
				this.pSetSavedEncountersThrottled();
			});
		const hookName = () => {
			if (this._state.activeKey) {
				const encounter = this._state.savedEncounters[this._state.activeKey];
				this._$iptName.val(encounter.name);
			} else this._$iptName.val("");
			this.pSetSavedEncountersThrottled();
		};
		this._addHook("state", "savedEncounters", hookName);
		this._addHook("state", "activeKey", hookName);
		hookName();

		this._$btnNew = $(`<button class="btn btn-default btn-xs mr-2" title="New Encounter (SHIFT-click to reset players)"><span class="glyphicon glyphicon glyphicon-file"/></button>`)
			.click(evt => {
				this._state.activeKey = null;
				encounterBuilder.pReset({isNotResetPlayers: !evt.shiftKey, isNotAddInitialPlayers: !evt.shiftKey});
			});
		const hookDisplayNew = () => this._$btnNew.toggleClass("hidden", !this._state.activeKey);
		this._addHook("state", "activeKey", hookDisplayNew);
		hookDisplayNew();

		// TODO set window title to encounter name on save?
		this._$btnSave = $(`<button class="btn btn-default btn-xs mr-2" title="Save Encounter"/>`)
			.click(async () => {
				if (this._state.activeKey) {
					const encounter = this._state.savedEncounters[this._state.activeKey];
					encounter.data = this.getSaveableState();

					this._state.savedEncounters = {
						...this._state.savedEncounters,
						[this._state.activeKey]: encounter,
					};
					this.pSetSavedEncountersThrottled();
					JqueryUtil.doToast({type: "success", content: "Saved!"});
				} else {
					const name = await InputUiUtil.pGetUserString({title: "Enter Encounter Name"});

					if (name != null) {
						const key = CryptUtil.uid();
						this._state.savedEncounters = {
							...this._state.savedEncounters,
							[key]: {
								name,
								data: this.getSaveableState(),
							},
						};
						this._state.activeKey = key;
						this.pSetSavedEncountersThrottled();
						JqueryUtil.doToast({type: "success", content: "Saved!"});
					}
				}
			});
		const hookButtonText = () => this._$btnSave.html(this._state.activeKey ? `<span class="glyphicon glyphicon-floppy-disk"/>` : "Save Encounter");
		this._addHook("state", "activeKey", hookButtonText);
		hookButtonText();

		const pDoReload = async () => {
			const inStorage = await EncounterUtil.pGetSavedState();
			const prev = inStorage.savedEncounters[this._state.activeKey];
			if (!prev) {
				return JqueryUtil.doToast({
					content: `Could not find encounter in storage! Has it been deleted?`,
					type: "danger",
				});
			} else {
				this._state.savedEncounters = {
					...this._state.savedEncounters,
					[this._state.activeKey]: prev,
				};
				await pLoadActiveEncounter();
			}
		};
		this._$btnReload = $(`<button class="btn btn-default btn-xs mr-2" title="Reload Current Encounter"><span class="glyphicon glyphicon-refresh"/></button>`)
			.click(() => pDoReload());

		this._$btnLoad = $(`<button class="btn btn-default btn-xs">Load Encounter</button>`)
			.click(async () => {
				const inStorage = await EncounterUtil.pGetSavedState();
				const {$modalInner} = UiUtil.getShowModal({title: "Saved Encounters"});
				const $wrpRows = $(`<div class="flex-col w-100 h-100"/>`).appendTo($modalInner);

				const encounters = inStorage.savedEncounters;
				if (Object.keys(encounters).length) {
					let rendered = Object.keys(encounters).length;
					Object.entries(encounters)
						.sort((a, b) => SortUtil.ascSortLower(a[1].name || "", b[1].name || ""))
						.forEach(([k, v]) => {
							const $iptName = $(`<input class="input input-xs form-control form-control--minimal mr-2">`)
								.val(v.name)
								.change(() => {
									const name = $iptName.val().trim() || "(Unnamed Encounter)";
									$iptName.val(name);
									const loaded = this._state.savedEncounters[k];
									loaded.name = name;
									this._state.savedEncounters = {...this._state.savedEncounters};
									this.pSetSavedEncountersThrottled();
								});

							const $btnLoad = $(`<button class="btn btn-primary btn-xs mr-2">Load</button>`)
								.click(async () => {
									// if we've already got the correct encounter loaded, reload it
									if (this._state.activeKey === k) await pDoReload();
									else this._state.activeKey = k;

									await pLoadActiveEncounter();
								});

							const $btnDelete = $(`<button class="btn btn-danger btn-xs"><span class="glyphicon glyphicon-trash"/></button>`)
								.click(() => {
									if (this._state.activeKey === k) this._state.activeKey = null;
									this._state.savedEncounters = Object.keys(this._state.savedEncounters)
										.filter(it => it !== k)
										.mergeMap(it => ({[it]: this._state.savedEncounters[it]}));
									$row.remove();
									if (!--rendered) $$`<div class="w-100 flex-vh-center italic">No saved encounters</div>`.appendTo($wrpRows);
									this.pSetSavedEncountersThrottled();
								});

							const $row = $$`<div class="flex-v-center w-100 mb-2">
								${$iptName}
								${$btnLoad}
								${$btnDelete}
							</div>`.appendTo($wrpRows);
						});
				} else $$`<div class="w-100 flex-vh-center italic">No saved encounters</div>`.appendTo($wrpRows)
			});

		const hookActiveKey = () => {
			// show/hide controls
			this._$iptName.toggle(!!this._state.activeKey);
			this._$btnReload.toggle(!!this._state.activeKey);
		};
		this._addHook("state", "activeKey", hookActiveKey);
		hookActiveKey();

		$$`<div class="flex-col" style="align-items: flex-end;">
			${this._$iptName}
			<div class="flex-h-right">${this._$btnNew}${this._$btnSave}${this._$btnReload}${this._$btnLoad}</div>
		</div>`.appendTo($wrpControls);
	}

	_pSetSavedEncounters () {
		if (!this.stateInit) return;
		return StorageUtil.pSet(EncounterUtil.SAVED_ENCOUNTER_SAVE_LOCATION, this.__state);
	}
	// endregion
}
EncounterBuilder.HASH_KEY = "encounterbuilder";
EncounterBuilder.TIERS = ["trivial", "low", "moderate", "severe", "extreme", "tpk"];
EncounterBuilder._TITLE_TRIVIAL = `Trivial-threat encounters are so easy that the characters have essentially no chance of losing; they shouldn't even need to spend significant resources unless they are particularly wasteful. These encounters work best as warm-ups, palate cleansers, or reminders of how awesome the characters are. A trivial-threat encounter can still be fun to play, so don't ignore them just because of the lack of threat.`
EncounterBuilder._TITLE_LOW = `Low-threat encounters present a veneer of difficulty and typically use some of the party's resources. However, it would be rare or the result of very poor tactics for the entire party to be seriously threatened.`
EncounterBuilder._TITLE_MODERATE = `Moderate-threat encounters are a serious challenge to the characters, though unlikely to overpower them completely. Characters usually need to use sound tactics and manage their resources wisely to come out of a moderate-threat encounter ready to continue on and face a harder challenge without resting.`
EncounterBuilder._TITLE_SEVERE = `Severe-threat encounters are the hardest encounters most groups of characters can consistently defeat. These encounters are most appropriate for important moments in your story, such as confronting a final boss. Bad luck, poor tactics, or a lack of resources due to prior encounters can easily turn a severe-threat encounter against the characters, and a wise group keeps the option to disengage open.`
EncounterBuilder._TITLE_EXTREME = `Extreme-threat encounters are so dangerous that they are likely to be an even match for the characters, particularly if the characters are low on resources. This makes them too challenging for most uses. An extremethreat encounter might be appropriate for a fully rested group of characters that can go all-out, for the climactic encounter at the end of an entire campaign, or for a group of veteran players using advanced tactics and teamwork.`

class EncounterPartyMeta {
	constructor (arr) {
		this.levelMetas = []; // Array of `{level: x, count: y}`
		this.levels = [];

		arr.forEach(it => {
			const existingLvl = this.levelMetas.find(x => x.level === it.level);
			if (existingLvl) existingLvl.count += it.count;
			else this.levelMetas.push({count: it.count, level: it.level});
			this.levels.push(...Array(it.count).fill(it.level));
		});

		this.levels.sort(SortUtil.ascSort);
		const len = this.levels.length;
		const medianLevel = len % 2 ? this.levels[(len - 1) / 2] : (this.levels[len / 2 - 1] + this.levels[len / 2]) / 2;
		this.median = medianLevel;
		const avgLevel = Math.round(this.levels.reduce((a, b) => a + b, 0) / len);

		if (len <= 2) {
			// There are few characters.
			this.partyLevel = avgLevel;
			this.partySize = len;
		} else if (medianLevel - this.levels[2] <= 1 && this.levels[len - 1] - medianLevel === 0) {
			// Everyone has the same level.
			// Use the highest level if only one or two characters are behind.
			this.partyLevel = this.levels[len - 1];
			this.partySize = len;
		} else if (medianLevel - this.levels[0] <= 1 && this.levels[len - 2] - medianLevel <= 1 && this.levels[len - 1] - medianLevel >= 2) {
			// If only one character is two or more levels ahead, use a party level suitable for the lower-level
			// characters, and adjust the encounters as if there were one additional PC for every 2 levels the
			// higher-level character has beyond the rest of the party.
			this.partyLevel = medianLevel;
			this.partySize = len + Math.floor((this.levels[len - 1] - medianLevel) / 2);
		} else {
			// Imbalanced party.
			this.partyLevel = avgLevel;
			this.partySize = len;
		}
		this.budgetTrivial = 40 + (this.partySize - ECGEN_BASE_PLAYERS) * 10
		this.budgetLow = 60 + (this.partySize - ECGEN_BASE_PLAYERS) * 15
		this.budgetModerate = 80 + (this.partySize - ECGEN_BASE_PLAYERS) * 20
		this.budgetSevere = 120 + (this.partySize - ECGEN_BASE_PLAYERS) * 30
		this.budgetExtreme = 160 + (this.partySize - ECGEN_BASE_PLAYERS) * 40
		this.budgetTPK = 240 + (this.partySize - ECGEN_BASE_PLAYERS) * 80

		this.imbalanced = this.levels[len - 1] - this.levels > 5
	}

	// Expose these as getters to ease factoring elsewhere
	get trivial () { return this.budgetTrivial }
	get low () { return this.budgetLow }
	get moderate () { return this.budgetModerate }
	get severe () { return this.budgetSevere }
	get extreme () { return this.budgetExtreme }
	get tpk () { return this.budgetTPK }

	encounterDifficulty (xp) {
		if (xp <= this.trivial) return "trivial";
		else if (xp <= this.low) return "low";
		else if (xp <= this.moderate) return "moderate";
		else if (xp <= this.severe) return "severe";
		else if (xp <= this.extreme) return "extreme";
		else return "TPK";
	}
}
