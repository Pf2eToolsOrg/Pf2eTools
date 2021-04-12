"use strict";

const ECGEN_BASE_PLAYERS = 4; // assume a party size of four
const renderer = Renderer.get();

window.PROF_MODE_BONUS = "bonus";
window.PROF_MODE_DICE = "dice";
window.PROF_DICE_MODE = PROF_MODE_BONUS;

class BestiaryPage {
	constructor () {
		this._pageFilter = new PageFilterBestiary();
		this._multiSource = new MultiSource({
			fnHandleData: addCreatures,
			prop: "creature",
		});
	}

	getListItem (cr, mI) {
		const hash = UrlUtil.autoEncodeHash(cr);
		if (!cr.uniqueId && _addedHashes.has(hash)) return null;
		_addedHashes.add(hash);

		const isExcluded = ExcludeUtil.isExcluded(hash, "monster", cr.source);

		this._pageFilter.mutateAndAddToFilters(cr, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;
		eleLi.addEventListener("click", (evt) => handleBestiaryLiClick(evt, listItem));
		eleLi.addEventListener("contextmenu", (evt) => handleBestiaryLiContext(evt, listItem));

		const source = Parser.sourceJsonToAbv(cr.source);
		const type = cr.creatureType;
		const level = cr.level;

		eleLi.innerHTML += `<a href="#${hash}" onclick="handleBestiaryLinkClick(event)" class="lst--border">
			${EncounterBuilder.getButtons(mI)}
			<span class="ecgen__name bold col-4-2 pl-0">${cr.name}</span>
			<span class="type col-4-1">${type}</span>
			<span class="col-1-7 text-center">${level}</span>
			<span title="${Parser.sourceJsonToFull(cr.source)}${Renderer.utils.getSourceSubText(cr)}" class="col-2 text-center ${Parser.sourceJsonToColor(cr.source)} pr-0" ${BrewUtil.sourceJsonToStyle(cr.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			mI,
			eleLi,
			cr.name,
			{
				hash,
				source,
				level: cr.level,
				type: cr.creatureType,
			},
			{
				uniqueId: cr.uniqueId ? cr.uniqueId : mI,
				isExcluded,
			},
		);

		return listItem;
	}

	handleFilterChange () {
		if (Hist.initialLoad) return;

		const f = this._pageFilter.filterBox.getValues();
		list.filter(li => {
			const m = creatures[li.ix];
			return this._pageFilter.toDisplay(f, m);
		});
		MultiSource.onFilterChangeMulti(creatures);
		encounterBuilder.resetCache();
	}

	async pGetSublistItem (monRaw, pinId, addCount, data = {}) {
		const cr = await (data.scaled ? ScaleCreature.scale(monRaw, data.scaled) : monRaw);
		const subHash = data.scaled ? `${HASH_PART_SEP}${VeCt.HASH_MON_SCALED}${HASH_SUB_KV_SEP}${data.scaled}` : "";

		const name = cr._displayName || cr.name;
		const hash = `${UrlUtil.autoEncodeHash(cr)}${subHash}`;
		const type = cr.creatureType
		const count = addCount || 1;
		const level = cr.level;

		const $hovStatblock = $(`<span class="col-1-9 text-center help--hover ecgen__visible">Statblock</span>`)
			.mouseover(evt => EncounterBuilder.doStatblockMouseOver(evt, $hovStatblock[0], pinId, cr._isScaledLvl))
			.mousemove(evt => Renderer.hover.handleLinkMouseMove(evt, $hovStatblock[0]))
			.mouseleave(evt => Renderer.hover.handleLinkMouseLeave(evt, $hovStatblock[0]));

		const $hovImage = $(`<span class="col-1-9 text-center ecgen__visible help--hover">Image</span>`)
			.mouseover(evt => EncounterBuilder.handleImageMouseOver(evt, $hovImage, pinId));

		const $ptCr = (() => {
			if (level === "Unknown") return $(`<span class="col-1-2 text-center">${level}</span>`);

			const $iptLvl = $(`<input value="${level}" class="ecgen__cr_input form-control form-control--minimal input-xs">`)
				.click(() => $iptLvl.select())
				.change(() => encounterBuilder.pDoLvlChange($iptLvl, pinId, cr._isScaledLvl));

			return $$`<span class="col-1-2 text-center">${$iptLvl}</span>`;
		})();

		const $eleCount1 = $(`<span class="col-2 text-center">${count}</span>`);
		const $eleCount2 = $(`<span class="col-2 pr-0 text-center">${count}</span>`);

		const $ele = $$`<li class="row row--bestiary_sublist">
			<a href="#${hash}" draggable="false" class="ecgen__hidden lst--border">
				<span class="bold col-5 pl-0">${name}</span>
				<span class="col-3-8">${type}</span>
				<span class="col-1-2 text-center">${level}</span>
				${$eleCount1}
			</a>

			<div class="lst__wrp-cells ecgen__visible--flex lst--border">
				${EncounterBuilder.$getSublistButtons(pinId, getCreatureCustomHashId(cr))}
				<span class="ecgen__name--sub col-3-5">${name}</span>
				${$hovStatblock}
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
				source: Parser.sourceJsonToAbv(cr.source),
				type,
				level,
				count,
			},
			{
				uniqueId: data.uniqueId || "",
				customHashId: getCreatureCustomHashId(cr),
				$elesCount: [$eleCount1, $eleCount2],
			},
		);

		return listItem;
	}

	doLoadHash (id) {
		const mon = creatures[id];

		renderStatblock(mon);

		loadSubHash([]);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._pageFilter.filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub, pPreloadSublistSources);

		await printBookView.pHandleSub(sub);

		const scaledHash = sub.find(it => it.startsWith(VeCt.HASH_MON_SCALED));
		if (scaledHash) {
			const scaleTo = Number(UrlUtil.unpackSubHash(scaledHash)[VeCt.HASH_MON_SCALED][0]);
			const cr = creatures[Hist.lastLoadedId];
			if (Parser.isValidCreatureLvl(scaleTo) && scaleTo !== lastRendered.creature.level) {
				ScaleCreature.scale(cr, scaleTo).then(scaled => renderStatblock(scaled, true));
			}
		}

		encounterBuilder.handleSubhash(sub);
	}

	async pOnLoad () {
		window.loadHash = this.doLoadHash.bind(this);
		window.loadSubHash = this.pDoLoadSubHash.bind(this);

		await this._pageFilter.pInitFilterBox({
			$iptSearch: $(`#lst__search`),
			$wrpFormTop: $(`#filter-search-group`).title("Hotkey: f"),
			$btnReset: $(`#reset`),
		});

		encounterBuilder = new EncounterBuilder();
		encounterBuilder.initUi();
		await Promise.all([
			ExcludeUtil.pInitialise(),
		]);
		// TODO: Homebrew functionality
		const creatureAbilities = await DataUtil.loadJSON("data/abilities.json");
		Renderer.hover._pCacheAndGet_populate(UrlUtil.PG_ABILITIES, creatureAbilities, "ability");
		await bestiaryPage._multiSource.pMultisourceLoad("data/bestiary/", this._pageFilter.filterBox, pPageInit, addCreatures, pPostLoad);
		if (Hist.lastLoadedId == null) Hist._freshLoad();
		ExcludeUtil.checkShowAllExcluded(creatures, $(`#pagecontent`));
		bestiaryPage.handleFilterChange();
		encounterBuilder.initState();
		window.dispatchEvent(new Event("toolsLoaded"));
	}

	static popoutHandlerGenerator (toList) {
		return (evt) => {
			const mon = toList[Hist.lastLoadedId];
			const toRender = lastRendered.mon != null && lastRendered.isScaled ? lastRendered.mon : mon;

			if (evt.shiftKey) {
				const $content = Renderer.hover.$getHoverContent_statsCode(toRender);
				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						title: `${toRender._displayName || toRender.name} \u2014 Source Data`,
						isPermanent: true,
						isBookContent: true,
					},
				);
			} else {
				const pageUrl = `#${UrlUtil.autoEncodeHash(toRender)}${toRender._isScaledLvl ? `${HASH_PART_SEP}${VeCt.HASH_MON_SCALED}${HASH_SUB_KV_SEP}${toRender._isScaledCr}` : ""}`;

				const renderFn = Renderer.hover._pageToRenderFn(UrlUtil.getCurrentPage());
				const $content = $$`<table class="stats">${renderFn(toRender)}</table>`;
				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						pageUrl,
						title: toRender._displayName || toRender.name,
						isPermanent: true,
					},
				);
			}
		};
	}
}

function handleBrew (homebrew) {
	addCreatures(homebrew.creature);
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
		.map(src => new FilterItem({item: src, pFnChange: bestiaryPage._multiSource.pLoadSource.bind(bestiaryPage._multiSource)}))
		.forEach(fi => bestiaryPage._pageFilter.sourceFilter.addItem(fi));

	list = ListUtil.initList(
		{
			listClass: "creatures",
			fnSort: PageFilterBestiary.sortCreatures,
		},
	);
	ListUtil.setOptions({primaryLists: [list]});
	SortUtil.initBtnSortHandlers($(`#filtertools`), list);

	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	list.on("updated", () => {
		$outVisibleResults.html(`${list.visibleItems.length}/${list.items.length}`);
	});

	// filtering function
	bestiaryPage._pageFilter.filterBox.on(
		FilterBox.EVNT_VALCHANGE,
		bestiaryPage.handleFilterChange.bind(bestiaryPage),
	);

	subList = ListUtil.initSublist({
		listClass: "subcreatures",
		fnSort: PageFilterBestiary.sortCreatures,
		onUpdate: onSublistChange,
		customHashHandler: (mon, uid) => ScaleCreature.scale(mon, Number(uid.split("_").last())),
		customHashUnpacker: getUnpackedCustomHashId,
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
	printBookView = new BookModeView({
		hashKey: "bookview",
		$openBtn: $(`#btn-printbook`),
		noneVisibleMsg: "If you wish to view multiple creatures, please first make a list",
		pageTitle: "Bestiary Printer View",
		popTblGetNumShown: async ($wrpContent) => {
			const toShow = await Promise.all(ListUtil.genericPinKeyMapper());

			toShow.sort((a, b) => SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name));

			let numShown = 0;

			const stack = [];

			const renderCreature = (mon) => {
				stack.push(`<div class="bkmv__wrp-item"><div class="pf2-stat stats stats--book stats--bkmv">`);
				stack.push(Renderer.creature.getCompactRenderedString(mon).html());
				stack.push(`</div></div>`);
			};

			stack.push(`<div class="w-100 h-100">`);
			toShow.forEach(mon => renderCreature(mon));
			if (!toShow.length && Hist.lastLoadedId != null) {
				renderCreature(creatures[Hist.lastLoadedId]);
			}
			stack.push(`</div>`);

			numShown += toShow.length;
			$wrpContent.append(stack.join(""));

			return numShown;
		},
		hasPrintColumns: true,
	});
	// endregion
}

class EncounterBuilderUtils {
	static getSublistedEncounter () {
		return ListUtil.sublist.items.map(it => {
			const cr = creatures[it.ix];
			if (cr.level != null) {
				const lvlScaled = it.data.customHashId ? Number(getUnpackedCustomHashId(it.data.customHashId).scaled) : null;
				return {
					level: it.values.level,
					count: Number(it.values.count),

					// used for encounter adjuster
					lvlScaled: lvlScaled,
					customHashId: it.data.customHashId,
					hash: UrlUtil.autoEncodeHash(cr),
				}
			}
		}).filter(it => it && it.level !== 100).sort((a, b) => SortUtil.ascSort(b.level, a.level));
	}

	static calculateListEncounterXp (partyMeta) {
		return EncounterBuilderUtils.calculateEncounterXp(EncounterBuilderUtils.getSublistedEncounter(), partyMeta);
	}

	static getCreatureXP (partyMeta, creature) {
		const d = getLvl(creature) - partyMeta.partyLevel
		if (d < -4) return 0;
		else if (d === -4) return 10;
		else if (d === -3) return 15;
		else if (d === -2) return 20;
		else if (d === -1) return 30;
		else if (d === 0) return 40;
		else if (d === 1) return 60;
		else if (d === 2) return 80;
		else if (d === 3) return 120;
		else if (d === 4) return 160;
		else if (d > 4) return 160 + 2 ** (Math.floor((d - 5) / 2)) * 80;
		return 0
	}

	/**
	 * @param data an array of {lvl: n, count: m} objects
	 * @param partyMeta number of players in the party
	 */
	static calculateEncounterXp (data, partyMeta = null) {
		// Make a default, generic-sized party of level 1 players
		if (partyMeta == null) partyMeta = new EncounterPartyMeta([{level: 1, count: ECGEN_BASE_PLAYERS}])

		data = data.filter(it => getLvl(it) !== 100)
			.sort((a, b) => SortUtil.ascSort(getLvl(b), getLvl(a)));

		let XP = 0;
		let feasibleCount = 0;
		let underCount = 0;
		let overCount = 0;
		if (!data.length) return {XP, feasibleCount, overCount, underCount};

		data.forEach(it => {
			if (getLvl(it) - partyMeta.partyLevel > 4) overCount += 1;
			else if (getLvl(it) - partyMeta.partyLevel < -4) underCount += 1;
			else feasibleCount += 1;
			XP += EncounterBuilderUtils.getCreatureXP(partyMeta, it) * it.count;
		});

		return {XP, feasibleCount, overCount, underCount, meta: {partySize: partyMeta.partySize}};
	}
}

let _$totalCr;
function onSublistChange () {
	_$totalCr = _$totalCr || $(`#totalcr`);
	const crCount = ListUtil.sublist.items.map(it => it.values.count).reduce((a, b) => a + b, 0);
	_$totalCr.html(`${crCount} creature${crCount === 1 ? "" : "s"}`);
	if (encounterBuilder.isActive()) encounterBuilder.updateDifficulty();
	else encounterBuilder.doSaveState();
}

let creatures = [];
let mI = 0;
const lastRendered = {creature: null, isScaled: false};
function getScaledData () {
	const last = lastRendered.creature;
	return {scaled: last._isScaledLvl, customHashId: getCreatureCustomHashId(last)};
}

function getCustomHashId (name, source, scaledLvl) {
	return `${name}_${source}_${scaledLvl}`.toLowerCase();
}

function getCreatureCustomHashId (mon) {
	if (mon._isScaledLvl != null) return getCustomHashId(mon.name, mon.source, mon._isScaledLvl);
	return null;
}

function handleBestiaryLiClick (evt, listItem) {
	if (encounterBuilder.isActive()) Renderer.hover.doPopoutCurPage(evt, creatures, listItem.ix);
	else list.doSelect(listItem, evt);
}

function handleBestiaryLiContext (evt, listItem) {
	if (!encounterBuilder.isActive()) ListUtil.openContextMenu(evt, list, listItem);
}

function handleBestiaryLinkClick (evt) {
	if (encounterBuilder.isActive()) evt.preventDefault();
}

const _addedHashes = new Set();
function addCreatures (data) {
	if (!data || !data.length) return;

	creatures.push(...data);

	// build the table
	for (; mI < creatures.length; mI++) {
		const mon = creatures[mI];
		const listItem = bestiaryPage.getListItem(mon, mI);
		if (!listItem) continue;
		list.addItem(listItem);
	}

	list.update();

	bestiaryPage._pageFilter.filterBox.render();
	bestiaryPage.handleFilterChange();

	ListUtil.setOptions({
		itemList: creatures,
		getSublistRow: bestiaryPage.pGetSublistItem.bind(bestiaryPage),
		primaryLists: [list],
	});

	const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
	Renderer.hover.bindPopoutButton($btnPop, creatures, BestiaryPage.popoutHandlerGenerator.bind(BestiaryPage), "Popout Window (SHIFT for Source Data)");
	UrlUtil.bindLinkExportButton(bestiaryPage._pageFilter.filterBox);
	ListUtil.bindOtherButtons({
		download: true,
		upload: {
			pFnPreLoad: pPreloadSublistSources,
		},
		sendToBrew: {
			mode: "creatureBuilder",
			fnGetMeta: () => ({
				page: UrlUtil.getCurrentPage(),
				source: Hist.getHashSource(),
				hash: Hist.getHashParts()[0],
			}),
		},
	});

	Renderer.utils.bindPronounceButtons();
}

async function pPreloadSublistSources (json) {
	if (json.l && json.l.items && json.l.sources) { // if it's an encounter file
		json.items = json.l.items;
		json.sources = json.l.sources;
	}
	const loaded = Object.keys(bestiaryPage._multiSource.loadedSources)
		.filter(it => bestiaryPage._multiSource.loadedSources[it].loaded);
	const lowerSources = json.sources.map(it => it.toLowerCase());
	const toLoad = Object.keys(bestiaryPage._multiSource.loadedSources)
		.filter(it => !loaded.includes(it))
		.filter(it => lowerSources.includes(it.toLowerCase()));
	const loadTotal = toLoad.length;
	if (loadTotal) {
		await Promise.all(toLoad.map(src => bestiaryPage._multiSource.pLoadSource(src, "yes")));
	}
}

function renderStatblock (cr, isScaled) {
	lastRendered.creature = cr;
	lastRendered.isScaled = isScaled;
	renderer.setFirstSection(true);

	const $content = $("#pagecontent").empty();

	function buildStatsTab () {
		const $btnScaleLvl = cr.level != null ? $(`
			<button id="btn-scale-lvl" title="Scale Creature By Level (Highly Experimental)" class="mon__btn-scale-lvl btn btn-xs btn-default">
				<span class="glyphicon glyphicon-signal"/>
			</button>`)
			.off("click").click((evt) => {
				evt.stopPropagation();
				const win = (evt.view || {}).window;
				const creature = creatures[Hist.lastLoadedId];
				const lastLvl = lastRendered.creature ? lastRendered.creature.level : creature.level;
				Renderer.creature.getLvlScaleTarget(win, $btnScaleLvl, lastLvl, (targetLvl) => {
					if (targetLvl === creature.level) renderStatblock(creature);
					else Hist.setSubhash(VeCt.HASH_MON_SCALED, targetLvl);
				});
			}).toggle(cr.level !== 100) : null;

		const $btnResetScaleLvl = cr.level != null ? $(`
			<button id="btn-scale-lvl" title="Reset CR Scaling" class="mon__btn-scale-lvl btn btn-xs btn-default">
				<span class="glyphicon glyphicon-refresh"></span>
			</button>`)
			.click(() => Hist.setSubhash(VeCt.HASH_MON_SCALED, null))
			.toggle(isScaled) : null;

		$content.append(RenderBestiary.$getRenderedCreature(cr, {$btnScaleLvl, $btnResetScaleLvl}));

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
				const expectedPB = Parser.crToPb(cr.cr);

				// skills and saves can have expertise
				let expert = 1;
				let pB = expectedPB;
				let fromAbility;
				let ability;
				if ($(this).parent().attr("data-mon-save")) {
					const monSave = $(this).parent().attr("data-mon-save");
					ability = monSave.split("|")[0].trim().toLowerCase();
					fromAbility = Parser.getAbilityModNumber(cr[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				} else if ($(this).parent().attr("data-mon-skill")) {
					const monSkill = $(this).parent().attr("data-mon-skill");
					ability = Parser.skillToAbilityAbv(monSkill.split("|")[0].toLowerCase().trim());
					fromAbility = Parser.getAbilityModNumber(cr[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				} else if ($(this).data("packed-dice").successThresh !== null) return; // Ignore "recharge"

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
									Renderer.dice.pRollerClick(event, it, '{"type":"dice","rollable":true,"toRoll":"1d20 + ${profDiceString}"}'${$(this).prop("title") ? `, '${$(this).prop("title")}'` : ""})
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

		$content.find("p, li").each(function () {
			$(this).find(`.rd__dc`).each((i, e) => {
				const $e = $(e);
				const dc = Number($e.html());

				const expectedPB = Parser.crToPb(cr.cr);
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

	// reset tabs
	const statTab = Renderer.utils.tabButton(
		"Statblock",
		() => {
			$(`#float-token`).show();
		},
		buildStatsTab,
	);
	Renderer.utils.bindTabButtons(statTab);
}

async function pHandleUnknownHash (link, sub) {
	const src = Object.keys(bestiaryPage._multiSource.loadedSources)
		.find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		await bestiaryPage._multiSource.pLoadSource(src, "yes");
		Hist.hashChange();
	}
}

function getUnpackedCustomHashId (customHashId) {
	return {scaled: Number(customHashId.split("_").last()), customHashId};
}

function getLvl (obj) {
	if (obj.lvlScaled != null) return obj.lvlScaled;
	return Number(obj.level) || null;
}

let bestiaryPage;
window.addEventListener("load", async () => {
	await Renderer.trait.buildCategoryLookup();
	bestiaryPage = new BestiaryPage();
	bestiaryPage.pOnLoad()
});
