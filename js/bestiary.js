"use strict";

const JSON_DIR = "data/bestiary/";
const FLUFF_INDEX = "fluff-index.json";
const JSON_LIST_NAME = "monster";
const ECGEN_BASE_PLAYERS = 4; // assume a party size of four
const renderer = Renderer.get();

window.PROF_MODE_BONUS = "bonus";
window.PROF_MODE_DICE = "dice";
window.PROF_DICE_MODE = PROF_MODE_BONUS;

const meta = {};
const languages = {};
let ixFluff = {};

class BestiaryPage {
	// region static
	// for use in homebrew only
	static addLegendaryGroups (toAdd) {
		if (!toAdd || !toAdd.length) return;

		toAdd.forEach(lg => {
			meta[lg.source] = meta[lg.source] || {};
			meta[lg.source][lg.name] = lg;
		});
	}
	// endregion

	constructor () {
		this._pageFilter = new PageFilterBestiary();
	}

	getListItem (mon, mI) {
		const hash = UrlUtil.autoEncodeHash(mon);
		if (!mon.uniqueId && _addedHashes.has(hash)) return null;
		_addedHashes.add(hash);
		if (ExcludeUtil.isExcluded(mon.name, "monster", mon.source)) return null;

		this._pageFilter.addToFilters(mon);

		const eleLi = document.createElement("li");
		eleLi.className = "row";
		eleLi.addEventListener("click", (evt) => handleBestiaryLiClick(evt, listItem));
		eleLi.addEventListener("contextmenu", (evt) => handleBestiaryLiContext(evt, listItem));

		const source = Parser.sourceJsonToAbv(mon.source);
		const type = mon._pTypes.asText.uppercaseFirst();
		const cr = mon._pCr || "\u2014";

		eleLi.innerHTML += `<a href="#${hash}" onclick="handleBestiaryLinkClick(event)" class="lst--border">
			${EncounterBuilder.getButtons(mI, mon.uniqueId)}
			<span class="ecgen__name bold col-4-2 pl-0">${mon.name}</span>
			<span class="type col-4-1">${type}</span>
			<span class="col-1-7 text-center">${cr}</span>
			<span title="${Parser.sourceJsonToFull(mon.source)}${Renderer.utils.getSourceSubText(mon)}" class="col-2 text-center ${Parser.sourceJsonToColor(mon.source)} pr-0" ${BrewUtil.sourceJsonToStyle(mon.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			mI,
			eleLi,
			mon.name,
			{
				hash,
				source,
				type,
				cr,
				group: mon.group || "",
				alias: (mon.alias || []).map(it => `"${it}"`).join(","),
				uniqueId: mon.uniqueId ? mon.uniqueId : mI
			}
		);

		return listItem;
	}

	handleFilterChange () {
		if (Hist.initialLoad) return;

		const f = this._pageFilter.filterBox.getValues();
		list.filter(li => {
			const m = monsters[li.ix];
			return this._pageFilter.toDisplay(f, m);
		});
		onFilterChangeMulti(monsters);
		encounterBuilder.resetCache();
	}

	async pGetSublistItem (monRaw, pinId, addCount, data = {}) {
		const mon = await (data.scaled ? ScaleCreature.scale(monRaw, data.scaled) : monRaw);
		Renderer.monster.updateParsed(mon);
		const subHash = data.scaled ? `${HASH_PART_SEP}${MON_HASH_SCALED}${HASH_SUB_KV_SEP}${data.scaled}` : "";
		Renderer.monster.initParsed(mon);

		const name = mon._displayName || mon.name;
		const hash = `${UrlUtil.autoEncodeHash(mon)}${subHash}`;
		const type = mon._pTypes.asText.uppercaseFirst();
		const count = addCount || 1;
		const cr = mon._pCr || "Unknown";

		const $hovStatblock = $(`<span class="col-1-4 help--hover ecgen__visible">Statblock</span>`)
			.mouseover(evt => EncounterBuilder.doStatblockMouseOver(evt, $hovStatblock[0], pinId, mon._isScaledCr))
			.mousemove(evt => Renderer.hover.handleLinkMouseMove(evt, $hovStatblock[0]))
			.mouseleave(evt => Renderer.hover.handleLinkMouseLeave(evt, $hovStatblock[0]));

		const hovTokenMeta = EncounterBuilder.getTokenHoverMeta(mon);
		const $hovToken = $(`<span class="col-1-2 ecgen__visible help--hover">Token</span>`)
			.mouseover(evt => hovTokenMeta.mouseOver(evt, $hovToken[0]))
			.mousemove(evt => hovTokenMeta.mouseMove(evt, $hovToken[0]))
			.mouseleave(evt => hovTokenMeta.mouseLeave(evt, $hovToken[0]));

		const $hovImage = $(`<span class="col-1-2 ecgen__visible help--hover">Image</span>`)
			.mouseover(evt => EncounterBuilder.handleImageMouseOver(evt, $hovImage, pinId));

		const $ptCr = (() => {
			if (cr === "Unknown") return $(`<span class="col-1-2 text-center">${cr}</span>`);

			const $iptCr = $(`<input value="${cr}" class="ecgen__cr_input form-control form-control--minimal input-xs">`)
				.change(() => encounterBuilder.doCrChange($iptCr, pinId, mon._isScaledCr));

			return $$`<span class="col-1-2 text-center">${$iptCr}</span>`;
		})();

		const $eleCount1 = $(`<span class="col-2 text-center">${count}</span>`);
		const $eleCount2 = $(`<span class="col-2 pr-0 text-center">${count}</span>`);

		const $ele = $$`<li class="row row--bestiary_sublist">
			<a href="#${hash}" draggable="false" class="ecgen__hidden lst--border">
				<span class="bold col-5 pl-0">${name}</span>
				<span class="col-3-8">${type}</span>
				<span class="col-1-2 text-center">${cr}</span>
				${$eleCount1}
			</a>
			
			<div class="list__item_inner ecgen__visible--flex lst--border">
				${EncounterBuilder.$getSublistButtons(pinId, mon.uniqueId, true)}
				<span class="ecgen__name--sub col-3-5">${name}</span>
				${$hovStatblock}
				${$hovToken}
				${$hovImage}
				${$ptCr}
				${$eleCount2}
			</div>
		</li>`
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			name,
			{
				hash,
				source: Parser.sourceJsonToAbv(mon.source),
				type,
				cr,
				count,
				uniqueId: data.uid || ""
			},
			{
				$elesCount: [$eleCount1, $eleCount2]
			}
		);

		return listItem;
	}

	doLoadHash (id) {
		const mon = monsters[id];

		renderStatblock(mon);

		loadSubHash([]);
		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._pageFilter.filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub, sublistFuncPreload);

		printBookView.handleSub(sub);

		const scaledHash = sub.find(it => it.startsWith(MON_HASH_SCALED));
		if (scaledHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledHash)[MON_HASH_SCALED][0]);
			const scaleToStr = Parser.numberToCr(scaleTo);
			const mon = monsters[Hist.lastLoadedId];
			if (Parser.isValidCr(scaleToStr) && scaleTo !== Parser.crToNumber(lastRendered.mon.cr)) {
				ScaleCreature.scale(mon, scaleTo).then(scaled => renderStatblock(scaled, true));
			}
		}

		encounterBuilder.handleSubhash(sub);
	}

	async pOnLoad () {
		window.loadHash = this.doLoadHash.bind(this);
		window.loadSubHash = this.doLoadSubHash.bind(this);

		await this._pageFilter.pInitFilterBox({
			$wrpFormTop: $(`#filter-search-input-group`).attr("title", "Hotkey: f"),
			$btnReset: $(`#reset`)
		});

		encounterBuilder = new EncounterBuilder();
		encounterBuilder.initUi();
		await Promise.all([
			ExcludeUtil.pInitialise(),
			Renderer.monster.pPopulateMetaAndLanguages(meta, languages),
			(async () => ixFluff = await DataUtil.loadJSON(JSON_DIR + FLUFF_INDEX))()
		]);
		await pMultisourceLoad(JSON_DIR, JSON_LIST_NAME, pPageInit, addMonsters, pPostLoad);
		if (Hist.lastLoadedId == null) Hist._freshLoad();
		ExcludeUtil.checkShowAllExcluded(monsters, $(`#pagecontent`));
		bestiaryPage.handleFilterChange();
		encounterBuilder.initState();
	}
}

function handleBrew (homebrew) {
	BestiaryPage.addLegendaryGroups(homebrew.legendaryGroup);
	addMonsters(homebrew.monster);
	return Promise.resolve();
}

function pPostLoad () {
	return new Promise(resolve => {
		BrewUtil.pAddBrewData()
			.then(handleBrew)
			.then(() => BrewUtil.bind({list}))
			.then(() => BrewUtil.pAddLocalBrewData())
			.then(async () => {
				BrewUtil.makeBrewButton("manage-brew");
				BrewUtil.bind({filterBox: bestiaryPage._pageFilter.filterBox, sourceFilter: bestiaryPage._pageFilter.sourceFilter});
				await ListUtil.pLoadState();
				resolve();
			});
	})
}

let encounterBuilder;
let list;
let subList;
let printBookView;

async function pPageInit (loadedSources) {
	Object.keys(loadedSources)
		.map(src => new FilterItem({item: src, changeFn: loadSource(JSON_LIST_NAME, addMonsters)}))
		.forEach(fi => bestiaryPage._pageFilter.sourceFilter.addItem(fi));

	list = ListUtil.initList(
		{
			listClass: "monsters",
			fnSort: PageFilterBestiary.sortMonsters
		}
	);
	ListUtil.setOptions({primaryLists: [list]});
	SortUtil.initBtnSortHandlers($(`#filtertools`), list);

	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	list.on("updated", () => {
		$outVisibleResults.html(`${list.visibleItems.length}/${list.items.length}`);
	});

	// filtering function
	$(bestiaryPage._pageFilter.filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		bestiaryPage.handleFilterChange.bind(bestiaryPage)
	);

	subList = ListUtil.initSublist({
		listClass: "submonsters",
		fnSort: PageFilterBestiary.sortMonsters,
		onUpdate: onSublistChange,
		uidHandler: (mon, uid) => ScaleCreature.scale(mon, Number(uid.split("_").last())),
		uidUnpacker: getUnpackedUid
	});
	SortUtil.initBtnSortHandlers($("#sublistsort"), subList);

	const baseHandlerOptions = {shiftCount: 5};
	function addHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistAdd(Hist.lastLoadedId, true, 5, getScaledData());
				else ListUtil.pDoSublistAdd(Hist.lastLoadedId, true, 1, getScaledData());
			} else ListUtil.genericAddButtonHandler(evt, baseHandlerOptions);
		};
	}
	function subtractHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistSubtract(Hist.lastLoadedId, 5, getScaledData());
				else ListUtil.pDoSublistSubtract(Hist.lastLoadedId, 1, getScaledData());
			} else ListUtil.genericSubtractButtonHandler(evt, baseHandlerOptions);
		};
	}
	ListUtil.bindAddButton(addHandlerGenerator, baseHandlerOptions);
	ListUtil.bindSubtractButton(subtractHandlerGenerator, baseHandlerOptions);
	ListUtil.initGenericAddable();

	// region print view
	printBookView = new BookModeView(
		"bookview",
		$(`#btn-printbook`),
		"If you wish to view multiple creatures, please first make a list",
		"Bestiary Printer View",
		async $wrpContent => {
			const toShow = await Promise.all(ListUtil.genericPinKeyMapper());

			toShow.sort((a, b) => SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name));

			let numShown = 0;

			const stack = [];

			const renderCreature = (mon) => {
				stack.push(`<div class="bkmv__wrp-item"><table class="stats stats--book stats--bkmv"><tbody>`);
				stack.push(Renderer.monster.getCompactRenderedString(mon, renderer));
				if (mon.legendaryGroup) {
					const thisGroup = (meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name];
					if (thisGroup) {
						stack.push(Renderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Lair Actions", "lairActions", 0));
						stack.push(Renderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Regional Effects", "regionalEffects", 0));
					}
				}
				stack.push(`</tbody></table></div>`);
			};

			stack.push(`<div class="w-100 h-100">`);
			toShow.forEach(mon => renderCreature(mon));
			if (!toShow.length && Hist.lastLoadedId != null) {
				renderCreature(monsters[Hist.lastLoadedId]);
			}
			stack.push(`</div>`);

			numShown += toShow.length;
			$wrpContent.append(stack.join(""));

			return numShown;
		},
		true
	);
	// endregion

	// region proficiency bonus/dice toggle
	const profBonusDiceBtn = $("button#profbonusdice");
	profBonusDiceBtn.click(function () {
		if (window.PROF_DICE_MODE === PROF_MODE_DICE) {
			window.PROF_DICE_MODE = PROF_MODE_BONUS;
			this.innerHTML = "Use Proficiency Dice";
			$("#pagecontent").find(`span.render-roller, span.dc-roller`).each(function () {
				const $this = $(this);
				$this.attr("mode", "");
				$this.html($this.attr("data-roll-prof-bonus"));
			});
		} else {
			window.PROF_DICE_MODE = PROF_MODE_DICE;
			this.innerHTML = "Use Proficiency Bonus";
			$("#pagecontent").find(`span.render-roller, span.dc-roller`).each(function () {
				const $this = $(this);
				$this.attr("mode", "dice");
				$this.html($this.attr("data-roll-prof-dice"));
			});
		}
	});
	// endregion
}

class EncounterBuilderUtils {
	static getSublistedEncounter () {
		return ListUtil.sublist.items.map(it => {
			const mon = monsters[it.ix];
			if (mon.cr) {
				const crScaled = it.values.uniqueId ? Number(getUnpackedUid(it.values.uniqueId).scaled) : null;
				return {
					cr: it.values.cr,
					count: Number(it.values.count),

					// used for encounter adjuster
					crScaled: crScaled,
					uid: it.values.uniqueId,
					hash: UrlUtil.autoEncodeHash(mon)
				}
			}
		}).filter(it => it && it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));
	}

	static calculateListEncounterXp (playerCount) {
		return EncounterBuilderUtils.calculateEncounterXp(EncounterBuilderUtils.getSublistedEncounter(), playerCount);
	}

	static getCrCutoff (data) {
		data = data.filter(it => getCr(it) !== 100).sort((a, b) => SortUtil.ascSort(getCr(b), getCr(a)));

		// "When making this calculation, don't count any monsters whose challenge rating is significantly below the average
		// challenge rating of the other monsters in the group unless you think the weak monsters significantly contribute
		// to the difficulty of the encounter." -- DMG, p. 82

		// no cutoff for CR 0-2
		return getCr(data[0]) <= 2 ? 0 : getCr(data[0]) / 2;
	}

	/**
	 * @param data an array of {cr: n, count: m} objects
	 * @param playerCount number of players in the party
	 */
	static calculateEncounterXp (data, playerCount = ECGEN_BASE_PLAYERS) {
		data = data.filter(it => getCr(it) !== 100)
			.sort((a, b) => SortUtil.ascSort(getCr(b), getCr(a)));

		let baseXp = 0;
		let relevantCount = 0;
		if (!data.length) return {baseXp: 0, relevantCount: 0, adjustedXp: 0};

		const crCutoff = EncounterBuilderUtils.getCrCutoff(data);
		data.forEach(it => {
			if (getCr(it) >= crCutoff) relevantCount += it.count;
			baseXp += (Parser.crToXpNumber(Parser.numberToCr(getCr(it))) || 0) * it.count;
		});

		const playerAdjustedXpMult = Parser.numMonstersToXpMult(relevantCount, playerCount);

		const adjustedXp = playerAdjustedXpMult * baseXp;
		return {baseXp, relevantCount, adjustedXp, meta: {crCutoff, playerCount, playerAdjustedXpMult}};
	}
}

let _$totalCr;
function onSublistChange () {
	_$totalCr = _$totalCr || $(`#totalcr`);
	const xp = EncounterBuilderUtils.calculateListEncounterXp(encounterBuilder.lastPlayerCount);
	_$totalCr.html(`${xp.baseXp.toLocaleString()} XP (<span class="help" title="Adjusted Encounter XP">Enc</span>: ${(xp.adjustedXp).toLocaleString()} XP)`);
	if (encounterBuilder.isActive()) encounterBuilder.updateDifficulty();
	else encounterBuilder.doSaveState();
}

let monsters = [];
let mI = 0;
const lastRendered = {mon: null, isScaled: false};
function getScaledData () {
	const last = lastRendered.mon;
	return {scaled: last._isScaledCr, uid: getUid(last.name, last.source, last._isScaledCr)};
}

function getUid (name, source, scaledCr) {
	return `${name}_${source}_${scaledCr}`.toLowerCase();
}

function handleBestiaryLiClick (evt, listItem) {
	if (encounterBuilder.isActive()) Renderer.hover.doPopoutCurPage(evt, monsters, listItem.ix);
	else list.doSelect(listItem, evt);
}

function handleBestiaryLiContext (evt, listItem) {
	if (!encounterBuilder.isActive()) ListUtil.openContextMenu(evt, list, listItem);
}

function handleBestiaryLinkClick (evt) {
	if (encounterBuilder.isActive()) evt.preventDefault();
}

const _addedHashes = new Set();
function addMonsters (data) {
	if (!data || !data.length) return;
	monsters = monsters.concat(data);

	// build the table
	for (; mI < monsters.length; mI++) {
		const mon = monsters[mI];
		const listItem = bestiaryPage.getListItem(mon, mI);
		if (!listItem) continue;
		list.addItem(listItem);
	}

	list.update();

	bestiaryPage._pageFilter.filterBox.render();
	bestiaryPage.handleFilterChange();

	ListUtil.setOptions({
		itemList: monsters,
		getSublistRow: bestiaryPage.pGetSublistItem.bind(bestiaryPage),
		primaryLists: [list]
	});

	function popoutHandlerGenerator (toList) {
		return (evt) => {
			const mon = toList[Hist.lastLoadedId];
			if (evt.shiftKey) {
				const $content = Renderer.hover.$getHoverContent_statsCode(mon);
				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						title: `${mon.name} \u2014 Source Data`,
						isPermanent: true,
						isBookContent: true
					}
				);
			} else {
				if (lastRendered.mon != null && lastRendered.isScaled) {
					const renderFn = Renderer.hover._pageToRenderFn(UrlUtil.getCurrentPage());
					const $content = $$`<table class="stats">${renderFn(lastRendered.mon)}</table>`;
					Renderer.hover.getShowWindow(
						$content,
						Renderer.hover.getWindowPositionFromEvent(evt),
						{
							pageUrl: `#${UrlUtil.autoEncodeHash(lastRendered.mon)}`,
							title: lastRendered.mon._displayName || lastRendered.mon.name,
							isPermanent: true
						}
					);
				} else {
					Renderer.hover.doPopoutCurPage(evt, toList, Hist.lastLoadedId);
				}
			}
		};
	}

	Renderer.hover.bindPopoutButton(monsters, popoutHandlerGenerator);
	UrlUtil.bindLinkExportButton(bestiaryPage._pageFilter.filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton(sublistFuncPreload);

	Renderer.utils.bindPronounceButtons();
}

function sublistFuncPreload (json, funcOnload) {
	if (json.l && json.l.items && json.l.sources) { // if it's an encounter file
		json.items = json.l.items;
		json.sources = json.l.sources;
	}
	const loaded = Object.keys(loadedSources).filter(it => loadedSources[it].loaded);
	const lowerSources = json.sources.map(it => it.toLowerCase());
	const toLoad = Object.keys(loadedSources).filter(it => !loaded.includes(it)).filter(it => lowerSources.includes(it.toLowerCase()));
	const loadTotal = toLoad.length;
	if (loadTotal) {
		let loadCount = 0;
		toLoad.forEach(src => {
			loadSource(JSON_LIST_NAME, (monsters) => {
				addMonsters(monsters);
				if (++loadCount === loadTotal) {
					funcOnload();
				}
			})(src, "yes");
		});
	} else {
		funcOnload();
	}
}

let profBtn = null;
function renderStatblock (mon, isScaled) {
	lastRendered.mon = mon;
	lastRendered.isScaled = isScaled;
	renderer.setFirstSection(true);

	const $content = $("#pagecontent").empty();
	const $wrpBtnProf = $(`#wrp-profbonusdice`);

	if (profBtn !== null) {
		$wrpBtnProf.append(profBtn);
		profBtn = null;
	}

	function buildStatsTab () {
		const $btnScaleCr = mon.cr != null ? $(`
			<button id="btn-scale-cr" title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-signal"/>
			</button>`)
			.off("click").click((evt) => {
				evt.stopPropagation();
				const mon = monsters[Hist.lastLoadedId];
				const lastCr = lastRendered.mon ? lastRendered.mon.cr.cr || lastRendered.mon.cr : mon.cr.cr || mon.cr;
				Renderer.monster.getCrScaleTarget($btnScaleCr, lastCr, (targetCr) => {
					if (targetCr === Parser.crToNumber(mon.cr)) renderStatblock(mon);
					else Hist.setSubhash(MON_HASH_SCALED, targetCr);
				});
			}).toggle(Parser.crToNumber(mon.cr.cr || mon.cr) !== 100) : null;

		const $btnResetScaleCr = mon.cr != null ? $(`
			<button id="btn-reset-cr" title="Reset CR Scaling" class="mon__btn-reset-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-refresh"></span>
			</button>`)
			.click(() => Hist.setSubhash(MON_HASH_SCALED, null))
			.toggle(isScaled) : null;

		$content.append(RenderBestiary.$getRenderedCreature(mon, meta, {$btnScaleCr, $btnResetScaleCr}));

		// tokens
		(() => {
			const $tokenImages = [];

			// statblock scrolling handler
			$(`#wrp-pagecontent`).off("scroll").on("scroll", function () {
				$tokenImages.forEach($img => {
					$img
						.toggle(this.scrollTop < 32)
						.css({
							opacity: (32 - this.scrollTop) / 32,
							top: -this.scrollTop
						});
				});
			});

			const $floatToken = $(`#float-token`).empty();

			function imgError (ele) {
				if (ele) $(ele).parent().remove();
				$(`#pagecontent th.name`).css("padding-right", "0.3em");
				$(`.mon__wrp-size-type-align`).css("max-width", "none");
				$(`.mon__wrp-avoid-token`).css("max-width", "none");
			}

			if (mon.tokenUrl || !mon.uniqueId) {
				const imgLink = Renderer.monster.getTokenUrl(mon);
				const $img = $(`<img src="${imgLink}" class="mon__token" alt="${mon.name}">`)
					.on("error", () => imgError($img));
				$tokenImages.push($img);
				const $lnkToken = $$`<a href="${imgLink}" class="mon__wrp-token" target="_blank" rel="noopener">${$img}</a>`.appendTo($floatToken);

				const altArtMeta = [];

				if (mon.altArt) altArtMeta.push(...MiscUtil.copy(mon.altArt));
				if (mon.variant) {
					const variantTokens = mon.variant.filter(it => it.token).map(it => it.token);
					if (variantTokens.length) altArtMeta.push(...MiscUtil.copy(variantTokens).map(it => ({...it, displayName: `Variant; ${it.name}`})));
				}

				if (altArtMeta.length) {
					// make a fake entry for the original token
					altArtMeta.unshift({$ele: $lnkToken});

					const buildEle = (meta) => {
						if (!meta.$ele) {
							const imgLink = Renderer.monster.getTokenUrl({name: meta.name, source: meta.source});
							const $img = $(`<img src="${imgLink}" class="mon__token" alt="${meta.displayName || meta.name}">`)
								.on("error", () => {
									$img.attr(
										"src",
										`data:image/svg+xml,${encodeURIComponent(`
											<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
												<circle cx="200" cy="200" r="175" fill="#b00"/>
												<rect x="190" y="40" height="320" width="20" fill="#ddd" transform="rotate(45 200 200)"/>
												<rect x="190" y="40" height="320" width="20" fill="#ddd" transform="rotate(135 200 200)"/>
											</svg>`
										)}`
									);
								});
							$tokenImages.push($img);
							meta.$ele = $$`<a href="${imgLink}" class="mon__wrp-token" target="_blank" rel="noopener">${$img}</a>`
								.hide()
								.css("max-width", "100%") // hack to ensure the token gets shown at max width on first look
								.appendTo($floatToken);
						}
					};
					altArtMeta.forEach(buildEle);

					let ix = 0;
					const handleClick = (evt, direction) => {
						evt.stopPropagation();
						evt.preventDefault();

						// avoid going off the edge of the list
						if (ix === 0 && !~direction) return;
						if (ix === altArtMeta.length - 1 && ~direction) return;

						ix += direction;

						if (!~direction) { // left
							if (ix === 0) {
								$btnLeft.hide();
								$wrpFooter.hide();
							}
							$btnRight.show();
						} else {
							$btnLeft.show();
							$wrpFooter.show();
							if (ix === altArtMeta.length - 1) {
								$btnRight.hide();
							}
						}
						altArtMeta.filter(it => it.$ele).forEach(it => it.$ele.hide());

						const meta = altArtMeta[ix];
						meta.$ele.show();
						setTimeout(() => meta.$ele.css("max-width", ""), 10); // hack to clear the earlier 100% width

						if (meta.name && meta.source) $footer.html(`<div>${meta.displayName || meta.name}; <span title="${Parser.sourceJsonToFull(meta.source)}">${Parser.sourceJsonToAbv(meta.source)}${meta.page > 0 ? ` p${meta.page}` : ""}</span></div>`);
						else $footer.html("");

						$wrpFooter.detach().appendTo(meta.$ele);
						$btnLeft.detach().appendTo(meta.$ele);
						$btnRight.detach().appendTo(meta.$ele);
					};

					// append footer first to be behind buttons
					const $footer = $(`<div class="mon__token-footer"/>`);
					const $wrpFooter = $$`<div class="mon__wrp-token-footer">${$footer}</div>`.hide().appendTo($lnkToken);

					const $btnLeft = $$`<div class="mon__btn-token-cycle mon__btn-token-cycle--left"><span class="glyphicon glyphicon-chevron-left"/></div>`
						.click(evt => handleClick(evt, -1)).appendTo($lnkToken)
						.hide();

					const $btnRight = $$`<div class="mon__btn-token-cycle mon__btn-token-cycle--right"><span class="glyphicon glyphicon-chevron-right"/></div>`
						.click(evt => handleClick(evt, 1)).appendTo($lnkToken);
				}
			} else imgError();
		})();

		// inline rollers //////////////////////////////////////////////////////////////////////////////////////////////
		const isProfDiceMode = PROF_DICE_MODE === PROF_MODE_DICE;
		function _addSpacesToDiceExp (exp) {
			return exp.replace(/([^0-9d])/gi, " $1 ").replace(/\s+/g, " ");
		}

		// add proficiency dice stuff for attack rolls, since those _generally_ have proficiency
		// this is not 100% accurate; for example, ghouls don't get their prof bonus on bite attacks
		// fixing it would probably involve machine learning though; we need an AI to figure it out on-the-fly
		// (Siri integration forthcoming)
		$content.find(".render-roller")
			.filter(function () {
				return $(this).text().match(/^([-+])?\d+$/);
			})
			.each(function () {
				const bonus = Number($(this).text());
				const expectedPB = Parser.crToPb(mon.cr);

				// skills and saves can have expertise
				let expert = 1;
				let pB = expectedPB;
				let fromAbility;
				let ability;
				if ($(this).parent().attr("data-mon-save")) {
					const title = $(this).attr("title");
					ability = title.split(" ")[0].trim().toLowerCase().substring(0, 3);
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				} else if ($(this).parent().attr("data-mon-skill")) {
					const title = $(this).attr("title");
					ability = Parser.skillToAbilityAbv(title.toLowerCase().trim());
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				}
				const withoutPB = bonus - pB;
				try {
					// if we have proficiency bonus, convert the roller
					if (expectedPB > 0) {
						const profDiceString = _addSpacesToDiceExp(`${expert}d${pB * (3 - expert)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

						$(this).attr("data-roll-prof-bonus", $(this).text());
						$(this).attr("data-roll-prof-dice", profDiceString);

						// here be (chromatic) dragons
						const cached = $(this).attr("onclick");
						const nu = `
							(function(it) {
								if (PROF_DICE_MODE === PROF_MODE_DICE) {
									Renderer.dice.rollerClick(event, it, '{"type":"dice","rollable":true,"toRoll":"1d20 + ${profDiceString}"}'${$(this).prop("title") ? `, '${$(this).prop("title")}'` : ""})
								} else {
									${cached.replace(/this/g, "it")}
								}
							})(this)`;

						$(this).attr("onclick", nu);

						if (isProfDiceMode) {
							$(this).html(profDiceString);
						}
					}
				} catch (e) {
					setTimeout(() => {
						throw new Error(`Invalid save or skill roller! Bonus was ${bonus >= 0 ? "+" : ""}${bonus}, but creature's PB was +${expectedPB} and relevant ability score (${ability}) was ${fromAbility >= 0 ? "+" : ""}${fromAbility} (should have been ${expectedPB + fromAbility >= 0 ? "+" : ""}${expectedPB + fromAbility} total)`);
					}, 0);
				}
			});

		$content.find("p").each(function () {
			$(this).find(`.rd__dc`).each((i, e) => {
				const $e = $(e);
				const dc = Number($e.html());

				const expectedPB = Parser.crToPb(mon.cr);
				if (expectedPB > 0) {
					const withoutPB = dc - expectedPB;
					const profDiceString = _addSpacesToDiceExp(`1d${(expectedPB * 2)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

					$e
						.addClass("dc-roller")
						.attr("mode", isProfDiceMode ? "dice" : "")
						.mousedown((evt) => window.PROF_DICE_MODE === window.PROF_MODE_DICE && evt.preventDefault())
						.attr("onclick", `dcRollerClick(event, this, '${profDiceString}')`)
						.attr("data-roll-prof-bonus", `${dc}`)
						.attr("data-roll-prof-dice", profDiceString)
						.html(isProfDiceMode ? profDiceString : dc)
				}
			});
		});

		$(`#wrp-pagecontent`).scroll();
	}

	function buildFluffTab (isImageTab) {
		return Renderer.utils.pBuildFluffTab(
			isImageTab,
			$content,
			mon,
			Renderer.monster.getFluff.bind(null, mon, meta),
			`${JSON_DIR}${ixFluff[mon.source]}`,
			() => ixFluff[mon.source]
		);
	}

	// reset tabs
	const statTab = Renderer.utils.tabButton(
		"Statblock",
		() => {
			$wrpBtnProf.append(profBtn);
			$(`#float-token`).show();
		},
		buildStatsTab
	);
	const infoTab = Renderer.utils.tabButton(
		"Info",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		buildFluffTab
	);
	const picTab = Renderer.utils.tabButton(
		"Images",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		() => buildFluffTab(true)
	);
	Renderer.utils.bindTabButtons(statTab, infoTab, picTab);
}

function handleUnknownHash (link, sub) {
	const src = Object.keys(loadedSources).find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		loadSource(JSON_LIST_NAME, (monsters) => {
			addMonsters(monsters);
			Hist.hashChange();
		})(src, "yes");
	}
}

// Used in DC roller event handlers
function dcRollerClick (event, ele, exp) {
	if (window.PROF_DICE_MODE === PROF_MODE_BONUS) return;
	const it = {
		type: "dice",
		rollable: true,
		toRoll: exp
	};
	Renderer.dice.rollerClick(event, ele, JSON.stringify(it));
}

function getUnpackedUid (uid) {
	return {scaled: Number(uid.split("_").last()), uid};
}

function getCr (obj) {
	if (obj.crScaled != null) return obj.crScaled;
	if (obj.cr == null) return null;
	return typeof obj.cr === "string" ? obj.cr.includes("/") ? Parser.crToNumber(obj.cr) : Number(obj.cr) : obj.cr;
}

const bestiaryPage = new BestiaryPage();
window.addEventListener("load", () => bestiaryPage.pOnLoad());
