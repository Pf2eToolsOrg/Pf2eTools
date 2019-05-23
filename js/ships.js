"use strict";

const JSON_URL = "data/ships.json";

window.onload = async function load () {
	await ExcludeUtil.pInitialise();
	SortUtil.initHandleFilterButtonClicks();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

const sourceFilter = getSourceFilter();
let filterBox;
let list;
async function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "source", "uniqueid"],
		listClass: "ships",
		sortFunction: SortUtil.listSort
	});

	filterBox = await pInitFilterBox(
		sourceFilter
	);

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
		valueNames: ["name", "id"],
		listClass: "subships",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addShips(data);
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
			ExcludeUtil.checkShowAllExcluded(shipList, $(`#pagecontent`));
		});
}

function handleBrew (homebrew) {
	addShips({ship: homebrew.ship});
	return Promise.resolve();
}

let shipList = [];
let shI = 0;
function addShips (data) {
	if (!data.ship || !data.ship.length) return;
	shipList = shipList.concat(data.ship);

	let tempString = "";
	for (; shI < shipList.length; shI++) {
		const it = shipList[shI];

		if (ExcludeUtil.isExcluded(it.name, "ship", it.source)) continue;

		const abvSource = Parser.sourceJsonToAbv(it.source);
		tempString += `
			<li class="row" ${FLTR_ID}="${shI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${shI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-10">${it.name}</span>
					<span class="source col-2 text-align-center ${Parser.sourceJsonToColor(abvSource)}" title="${Parser.sourceJsonToFull(it.source)}">${abvSource}</span>
					
					<span class="uniqueid hidden">${it.uniqueId ? it.uniqueId : shI}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addItem(it.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$(`#shipList`).append(tempString);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: shipList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	Renderer.hover.bindPopoutButton(shipList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const it = shipList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			it.source
		);
	});
	FilterBox.selectFirstVisible(shipList);
}

function getSublistItem (it, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
				<span class="name col-12">${it.name}</span>
				<span class="id hidden">${pinId}</span>
			</a>
		</li>
	`;
}

function loadhash (jsonIndex) {
	Renderer.get().setFirstSection(true);
	const ship = shipList[jsonIndex];
	const $content = $(`#pagecontent`).empty();

	function buildStatsTab () {
		$content.append(Renderer.ship.getRenderedString(ship));
	}

	function buildFluffTab (isImageTab) {
		return Renderer.utils.buildFluffTab(
			isImageTab,
			$content,
			ship,
			(fluffJson) => ship.fluff || fluffJson.ship.find(it => it.name === ship.name && it.source === ship.source),
			`data/fluff-ships.json`,
			() => true
		);
	}

	const statTab = Renderer.utils.tabButton(
		"Item",
		() => {},
		buildStatsTab
	);
	const infoTab = Renderer.utils.tabButton(
		"Info",
		() => {},
		buildFluffTab
	);
	const picTab = Renderer.utils.tabButton(
		"Images",
		() => {},
		() => buildFluffTab(true)
	);

	Renderer.utils.bindTabButtons(statTab, infoTab, picTab);

	ListUtil.updateSelected();
}

function loadsub (sub) {
	sub = filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}
