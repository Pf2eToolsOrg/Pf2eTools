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
		const type = cr.creature_type;
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
				type: cr.creature_type,
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
		const mon = await (data.scaled ? ScaleCreature.scale(monRaw, data.scaled) : monRaw);
		const subHash = data.scaled ? `${HASH_PART_SEP}${VeCt.HASH_MON_SCALED}${HASH_SUB_KV_SEP}${data.scaled}` : "";

		const name = mon._displayName || mon.name;
		const hash = `${UrlUtil.autoEncodeHash(mon)}${subHash}`;
		const type = mon.creature_type
		const count = addCount || 1;
		const cr = mon.level

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
				.click(() => $iptCr.select())
				.change(() => encounterBuilder.pDoCrChange($iptCr, pinId, mon._isScaledCr));

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

			<div class="lst__wrp-cells ecgen__visible--flex lst--border">
				${EncounterBuilder.$getSublistButtons(pinId, getCreatureCustomHashId(mon))}
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
			},
			{
				uniqueId: data.uniqueId || "",
				customHashId: getCreatureCustomHashId(mon),
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
			const scaleToStr = Parser.numberToCr(scaleTo);
			const mon = creatures[Hist.lastLoadedId];
			if (Parser.isValidCr(scaleToStr) && scaleTo !== Parser.crToNumber(lastRendered.mon.cr)) {
				ScaleCreature.scale(mon, scaleTo).then(scaled => renderStatblock(scaled, true));
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
		const creatureAbilities = await DataUtil.loadJSON("data/abilities.json");
		Renderer.hover._pCacheAndGet_populate(UrlUtil.PG_ABILITIES, creatureAbilities, "ability");
		await bestiaryPage._multiSource.pMultisourceLoad("data/bestiary/", this._pageFilter.filterBox, pPageInit, addCreatures, pPostLoad);
		if (Hist.lastLoadedId == null) Hist._freshLoad();
		ExcludeUtil.checkShowAllExcluded(creatures, $(`#pagecontent`));
		bestiaryPage.handleFilterChange();
		encounterBuilder.initState();
		window.dispatchEvent(new Event("toolsLoaded"));
	}

	// TODO refactor this and spell markdown section
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
			} else if (evt.ctrlKey || evt.metaKey) {
				const name = `${toRender._displayName || toRender.name} \u2014 Markdown`;
				const mdText = RendererMarkdown.get().render({entries: [{type: "dataCreature", dataCreature: toRender}]});
				const $content = Renderer.hover.$getHoverContent_miscCode(name, mdText);

				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						title: name,
						isPermanent: true,
						isBookContent: true,
					},
				);
			} else {
				const pageUrl = `#${UrlUtil.autoEncodeHash(toRender)}${toRender._isScaledCr ? `${HASH_PART_SEP}${VeCt.HASH_MON_SCALED}${HASH_SUB_KV_SEP}${toRender._isScaledCr}` : ""}`;

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
	DataUtil.creature.populateMetaReference(homebrew);
	addCreatures(homebrew.monster);
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
		popTblGetNumShown: async ($wrpContent, $dispName, $wrpControlsToPass) => {
			const toShow = await Promise.all(ListUtil.genericPinKeyMapper());

			toShow.sort((a, b) => SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name));

			let numShown = 0;

			const stack = [];

			const renderCreature = (mon) => {
				stack.push(`<div class="bkmv__wrp-item"><div class="pf2-stat stats stats--book stats--bkmv">`);
				stack.push(Renderer.creature.getCompactRenderedString(mon));
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

			// region Markdown
			const pGetAsMarkdown = async () => {
				const toRender = toShow.length ? toShow : [creatures[Hist.lastLoadedId]];
				return RendererMarkdown.monster.pGetMarkdownDoc(toRender);
			};

			const $btnDownloadMarkdown = $(`<button class="btn btn-default btn-sm">Download as Markdown</button>`)
				.click(async () => DataUtil.userDownloadText("bestiary.md", await pGetAsMarkdown()));

			const $btnCopyMarkdown = $(`<button class="btn btn-default btn-sm px-2" title="Copy Markdown to Clipboard"><span class="glyphicon glyphicon-copy"/></button>`)
				.click(async () => {
					await MiscUtil.pCopyTextToClipboard(await pGetAsMarkdown());
					JqueryUtil.showCopiedEffect($btnCopyMarkdown);
				});

			const $btnDownloadMarkdownSettings = $(`<button class="btn btn-default btn-sm px-2" title="Markdown Settings"><span class="glyphicon glyphicon-cog"/></button>`)
				.click(async () => RendererMarkdown.pShowSettingsModal());

			$$`<div class="flex-v-center btn-group ml-2">
				${$btnDownloadMarkdown}
				${$btnCopyMarkdown}
				${$btnDownloadMarkdownSettings}
			</div>`.appendTo($wrpControlsToPass);
			// endregion

			return numShown;
		},
		hasPrintColumns: true,
	});
	// endregion
}

class EncounterBuilderUtils {
	static getSublistedEncounter () {
		return ListUtil.sublist.items.map(it => {
			const mon = creatures[it.ix];
			if (mon.cr) {
				const crScaled = it.data.customHashId ? Number(getUnpackedCustomHashId(it.data.customHashId).scaled) : null;
				return {
					cr: it.values.cr,
					count: Number(it.values.count),

					approxHp: it.data.approxHp,
					approxAc: it.data.approxAc,

					// used for encounter adjuster
					crScaled: crScaled,
					customHashId: it.data.customHashId,
					hash: UrlUtil.autoEncodeHash(mon),
				}
			}
		}).filter(it => it && it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));
	}

	static calculateListEncounterXp (partyMeta) {
		return EncounterBuilderUtils.calculateEncounterXp(EncounterBuilderUtils.getSublistedEncounter(), partyMeta);
	}

	static getCrCutoff (data, partyMeta) {
		data = data.filter(it => getCr(it) !== 100).sort((a, b) => SortUtil.ascSort(getCr(b), getCr(a)));
		if (!data.length) return 0;

		// no cutoff for CR 0-2
		if (getCr(data[0]) <= 2) return 0;

		// "When making this calculation, don't count any creatures whose challenge rating is significantly below the average
		// challenge rating of the other creatures in the group unless you think the weak creatures significantly contribute
		// to the difficulty of the encounter." -- DMG, p. 82

		// Spread the CRs into a single array
		const crValues = [];
		data.forEach(it => {
			const cr = getCr(it);
			for (let i = 0; i < it.count; ++i) crValues.push(cr);
		});

		const crMetas = [];

		// If there's precisely one CR value, use it
		if (crValues.length === 1) {
			crMetas.push({
				mean: crValues[0],
				deviation: 0,
			});
		} else {
			// Get an average CR for every possible encounter without one of the creatures in the encounter
			for (let i = 0; i < crValues.length; ++i) {
				const crValueFilt = crValues.filter((_, j) => i !== j);
				const crMean = Math.mean(...crValueFilt);
				const crStdDev = Math.sqrt((1 / crValueFilt.length) * crValueFilt.map(it => (it - crMean) ** 2).reduce((a, b) => a + b, 0));
				crMetas.push({mean: crMean, deviation: crStdDev});
			}
		}

		// "unless you think the weak creatures significantly contribute to the difficulty of the encounter"
		// For player levels <5, always include every creature. We assume that levels 5> will have strong
		//   AoE/multiattack, allowing trash to be quickly cleared.
		if (!partyMeta.isPartyLevelFivePlus()) return crValues[0];

		// Sort by descending CR -> ascending deviation
		crMetas.sort((a, b) => SortUtil.ascSort(b.mean, a.mean) || SortUtil.ascSort(a.deviation, b.deviation));

		// "significantly below the average" -> cutoff at half the average
		return crMetas[0].mean / 2;
	}

	/**
	 * @param data an array of {cr: n, count: m} objects
	 * @param partyMeta number of players in the party
	 */
	static calculateEncounterXp (data, partyMeta = null) {
		// Make a default, generic-sized party of level 1 players
		if (partyMeta == null) partyMeta = new EncounterPartyMeta([{level: 1, count: ECGEN_BASE_PLAYERS}])

		data = data.filter(it => getCr(it) !== 100)
			.sort((a, b) => SortUtil.ascSort(getCr(b), getCr(a)));

		let baseXp = 0;
		let relevantCount = 0;
		if (!data.length) return {baseXp: 0, relevantCount: 0, adjustedXp: 0};

		const crCutoff = EncounterBuilderUtils.getCrCutoff(data, partyMeta);
		data.forEach(it => {
			if (getCr(it) >= crCutoff) relevantCount += it.count;
			baseXp += (Parser.crToXpNumber(Parser.numberToCr(getCr(it))) || 0) * it.count;
		});

		const playerAdjustedXpMult = Parser.numMonstersToXpMult(relevantCount, partyMeta.cntPlayers);

		const adjustedXp = playerAdjustedXpMult * baseXp;
		return {baseXp, relevantCount, adjustedXp, meta: {crCutoff, playerCount: partyMeta.cntPlayers, playerAdjustedXpMult}};
	}
}

let _$totalCr;
function onSublistChange () {
	_$totalCr = _$totalCr || $(`#totalcr`);
	const xp = EncounterBuilderUtils.calculateListEncounterXp(encounterBuilder.lastPartyMeta);
	const monCount = ListUtil.sublist.items.map(it => it.values.count).reduce((a, b) => a + b, 0);
	_$totalCr.html(`${monCount} creature${monCount === 1 ? "" : "s"}; ${xp.baseXp.toLocaleString()} XP (<span class="help" title="Adjusted Encounter XP">Enc</span>: ${(xp.adjustedXp).toLocaleString()} XP)`);
	if (encounterBuilder.isActive()) encounterBuilder.updateDifficulty();
	else encounterBuilder.doSaveState();
}

let creatures = [];
let mI = 0;
const lastRendered = {mon: null, isScaled: false};
function getScaledData () {
	const last = lastRendered.mon;
	return {scaled: last._isScaledCr, customHashId: getCreatureCustomHashId(last)};
}

function getCustomHashId (name, source, scaledCr) {
	return `${name}_${source}_${scaledCr}`.toLowerCase();
}

function getCreatureCustomHashId (mon) {
	if (mon._isScaledCr != null) return getCustomHashId(mon.name, mon.source, mon._isScaledCr);
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

	function popoutHandlerGenerator (toList) {
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
			} else if (evt.ctrlKey || evt.metaKey) {
				const name = `${toRender._displayName || toRender.name} \u2014 Markdown`;
				const mdText = RendererMarkdown.get().render({entries: [{type: "dataCreature", dataCreature: toRender}]});
				const $content = Renderer.hover.$getHoverContent_miscCode(name, mdText);

				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						title: name,
						isPermanent: true,
						isBookContent: true,
					},
				);
			} else {
				const pageUrl = `#${UrlUtil.autoEncodeHash(toRender)}${toRender._isScaledCr ? `${HASH_PART_SEP}${VeCt.HASH_MON_SCALED}${HASH_SUB_KV_SEP}${toRender._isScaledCr}` : ""}`;

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

	const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`);
	Renderer.hover.bindPopoutButton($btnPop, creatures, BestiaryPage.popoutHandlerGenerator.bind(BestiaryPage), "Popout Window (SHIFT for Source Data; CTRL for Markdown Render)");
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

let $btnProf = null;
function renderStatblock (mon, isScaled) {
	lastRendered.mon = mon;
	lastRendered.isScaled = isScaled;
	renderer.setFirstSection(true);

	const $content = $("#pagecontent").empty();
	const $wrpBtnProf = $(`#wrp-profbonusdice`);

	if ($btnProf !== null) {
		$wrpBtnProf.append($btnProf);
		$btnProf = null;
	}

	function buildStatsTab () {
		const $btnScaleCr = mon.cr != null ? $(`
			<button id="btn-scale-cr" title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-signal"/>
			</button>`)
			.off("click").click((evt) => {
				evt.stopPropagation();
				const win = (evt.view || {}).window;
				const mon = creatures[Hist.lastLoadedId];
				const lastCr = lastRendered.mon ? lastRendered.mon.cr.cr || lastRendered.mon.cr : mon.cr.cr || mon.cr;
				Renderer.creature.getCrScaleTarget(win, $btnScaleCr, lastCr, (targetCr) => {
					if (targetCr === Parser.crToNumber(mon.cr)) renderStatblock(mon);
					else Hist.setSubhash(VeCt.HASH_MON_SCALED, targetCr);
				});
			}).toggle(Parser.crToNumber(mon.cr.cr || mon.cr) !== 100) : null;

		const $btnResetScaleCr = mon.cr != null ? $(`
			<button id="btn-reset-cr" title="Reset CR Scaling" class="mon__btn-reset-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-refresh"></span>
			</button>`)
			.click(() => Hist.setSubhash(VeCt.HASH_MON_SCALED, null))
			.toggle(isScaled) : null;

		$content.append(RenderBestiary.$getRenderedCreature(mon, {$btnScaleCr, $btnResetScaleCr}));

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
					const monSave = $(this).parent().attr("data-mon-save");
					ability = monSave.split("|")[0].trim().toLowerCase();
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				} else if ($(this).parent().attr("data-mon-skill")) {
					const monSkill = $(this).parent().attr("data-mon-skill");
					ability = Parser.skillToAbilityAbv(monSkill.split("|")[0].toLowerCase().trim());
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
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
		const pGetFluffEntries = async () => {
			const mon = creatures[Hist.lastLoadedId];
			const fluff = await Renderer.creature.pGetFluff(mon);
			return fluff.entries || [];
		};

		// Add Markdown copy button
		const $headerControls = isImageTab ? null : (() => {
			const actions = [
				new ContextUtil.Action(
					"Copy as JSON",
					async () => {
						const fluffEntries = await pGetFluffEntries();
						MiscUtil.pCopyTextToClipboard(JSON.stringify(fluffEntries, null, "\t"));
						JqueryUtil.showCopiedEffect($btnOptions);
					},
				),
				new ContextUtil.Action(
					"Copy as Markdown",
					async () => {
						const fluffEntries = await pGetFluffEntries();
						const rendererMd = RendererMarkdown.get().setFirstSection(true);
						MiscUtil.pCopyTextToClipboard(fluffEntries.map(f => rendererMd.render(f)).join("\n"));
						JqueryUtil.showCopiedEffect($btnOptions);
					},
				),
			]
			const menu = ContextUtil.getMenu(actions);

			const $btnOptions = $(`<button class="btn btn-default btn-xs btn-stats-name"><span class="glyphicon glyphicon-option-vertical"/></button>`)
				.click(evt => ContextUtil.pOpenMenu(evt, menu));

			return $$`<div class="flex-v-center btn-group ml-2">${$btnOptions}</div>`;
		})();

		return Renderer.utils.pBuildFluffTab({
			isImageTab,
			$content,
			entity: mon,
			pFnGetFluff: Renderer.creature.pGetFluff,
			$headerControls,
		});
	}

	// reset tabs
	const statTab = Renderer.utils.tabButton(
		"Statblock",
		() => {
			$wrpBtnProf.append($btnProf);
			$(`#float-token`).show();
		},
		buildStatsTab,
	);
	const infoTab = Renderer.utils.tabButton(
		"Info",
		() => {
			$btnProf = $wrpBtnProf.children().length ? $wrpBtnProf.children().detach() : $btnProf;
			$(`#float-token`).hide();
		},
		buildFluffTab,
	);
	const picTab = Renderer.utils.tabButton(
		"Images",
		() => {
			$btnProf = $wrpBtnProf.children().length ? $wrpBtnProf.children().detach() : $btnProf;
			$(`#float-token`).hide();
		},
		() => buildFluffTab(true),
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

// Used in DC roller event handlers
function dcRollerClick (event, ele, exp) {
	if (window.PROF_DICE_MODE === PROF_MODE_BONUS) return;
	const it = {
		type: "dice",
		rollable: true,
		toRoll: exp,
	};
	Renderer.dice.pRollerClick(event, ele, JSON.stringify(it));
}

function getUnpackedCustomHashId (customHashId) {
	return {scaled: Number(customHashId.split("_").last()), customHashId};
}

function getCr (obj) {
	if (obj.crScaled != null) return obj.crScaled;
	if (obj.cr == null || obj.cr === "Unknown" || obj.cr === "\u2014") return null;
	return typeof obj.cr === "string" ? obj.cr.includes("/") ? Parser.crToNumber(obj.cr) : Number(obj.cr) : obj.cr;
}

const bestiaryPage = new BestiaryPage();
window.addEventListener("load", () => bestiaryPage.pOnLoad());
