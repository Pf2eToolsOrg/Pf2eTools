"use strict";

const JSON_URL = "data/trapshazards.json";

window.onload = async function load () {
	await ExcludeUtil.pInitialise();
	SortUtil.initHandleFilterButtonClicks();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

function filterTypeSort (a, b) {
	a = a.item;
	b = b.item;
	return SortUtil.ascSortLower(Parser.trapHazTypeToFull(a), Parser.trapHazTypeToFull(b));
}

const sourceFilter = getSourceFilter();
let filterBox;
let list;
async function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "trapType", "source", "uniqueid"],
		listClass: "trapshazards",
		sortFunction: SortUtil.listSort
	});

	const typeFilter = new Filter({
		header: "Type",
		items: [
			"MECH",
			"MAG",
			"SMPL",
			"CMPX",
			"HAZ",
			"WTH",
			"ENV",
			"WLD",
			"GEN"
		],
		displayFn: Parser.trapHazTypeToFull,
		itemSortFn: filterTypeSort
	});
	filterBox = await pInitFilterBox({
		filters: [
			sourceFilter,
			typeFilter
		]
	});

	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	list.on("updated", () => {
		$outVisibleResults.html(`${list.visibleItems.length}/${list.items.length}`);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "type", "id"],
		listClass: "subtrapshazards",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addTrapsHazards(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(() => BrewUtil.bind({list}))
		.then(() => BrewUtil.pAddLocalBrewData())
		.catch(BrewUtil.pPurgeBrew)
		.then(async () => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({filterBox, sourceFilter});
			await ListUtil.pLoadState();
			RollerUtil.addListRollButton();
			ListUtil.addListShowHide();

			History.init(true);
			ExcludeUtil.checkShowAllExcluded(trapsAndHazardsList, $(`#pagecontent`));
		});
}

function handleBrew (homebrew) {
	addTrapsHazards({trap: homebrew.trap});
	addTrapsHazards({hazard: homebrew.hazard});
	return Promise.resolve();
}

let trapsAndHazardsList = [];
let thI = 0;
function addTrapsHazards (data) {
	if ((!data.trap || !data.trap.length) && (!data.hazard || !data.hazard.length)) return;

	if (data.trap && data.trap.length) trapsAndHazardsList = trapsAndHazardsList.concat(data.trap);
	if (data.hazard && data.hazard.length) {
		data.hazard.forEach(h => h.trapHazType = h.trapHazType || "HAZ");
		trapsAndHazardsList = trapsAndHazardsList.concat(data.hazard);
	}

	let tempString = "";
	for (; thI < trapsAndHazardsList.length; thI++) {
		const it = trapsAndHazardsList[thI];
		if (!Renderer.traphazard.isTrap(it.trapHazType) && ExcludeUtil.isExcluded(it.name, "hazard", it.source)) continue;
		else if (Renderer.traphazard.isTrap(it.trapHazType) && ExcludeUtil.isExcluded(it.name, "trap", it.source)) continue;

		tempString += `
			<li class="row" ${FLTR_ID}="${thI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${thI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-6 pl-0">${it.name}</span>
					<span class="trapType col-4">${Parser.trapHazTypeToFull(it.trapHazType)}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it.source)}</span>
					
					<span class="uniqueid hidden">${it.uniqueId ? it.uniqueId : thI}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addItem(it.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#trapsHazardsList`).append(tempString);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: trapsAndHazardsList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	Renderer.hover.bindPopoutButton(trapsAndHazardsList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const it = trapsAndHazardsList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			it.source,
			it.trapHazType
		);
	});
	FilterBox.selectFirstVisible(trapsAndHazardsList);
}

function getSublistItem (it, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
				<span class="name col-8 pl-0">${it.name}</span>
				<span class="type col-4 pr-0">${Parser.trapHazTypeToFull(it.trapHazType)}</span>
				<span class="id hidden">${pinId}</span>
			</a>
		</li>
	`;
}

const renderer = Renderer.get();
function loadHash (jsonIndex) {
	renderer.setFirstSection(true);
	const it = trapsAndHazardsList[jsonIndex];

	const renderStack = [];

	renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 2});

	const simplePart = Renderer.traphazard.getSimplePart(renderer, it);
	const complexPart = Renderer.traphazard.getComplexPart(renderer, it);
	const subtitle = Renderer.traphazard.getSubtitle(it);
	const $content = $(`#pagecontent`).empty();
	$content.append(`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(it)}
		${subtitle ? `<tr class="text"><td colspan="6"><i>${Renderer.traphazard.getSubtitle(it)}</i></td>` : ""}
		<tr class="text"><td colspan="6">${renderStack.join("")}${simplePart || ""}${complexPart || ""}</td></tr>
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}

function loadSubHash (sub) {
	sub = filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}
