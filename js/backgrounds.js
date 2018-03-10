"use strict";
const JSON_URL = "data/backgrounds.json";
const renderer = new EntryRenderer();
let tabledefault = "";
let bgList;

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let filterBox;
function onJsonLoad (data) {
	bgList = data.background;

	tabledefault = $("#pagecontent").html();

	const sourceFilter = getSourceFilter();
	filterBox = initFilterBox(sourceFilter);

	const bgTable = $("ul.backgrounds");
	let tempString = "";
	for (let i = 0; i < bgList.length; i++) {
		const bg = bgList[i];

		// populate table
		tempString +=
			`<li class="row" ${FLTR_ID}="${i}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(bg)}' title='${bg.name}'>
					<span class='name col-xs-10'>${bg.name.replace("Variant ", "")}</span>
					<span class='source col-xs-2 source${bg.source}' title='${Parser.sourceJsonToFull(bg.source)}'>${Parser.sourceJsonToAbv(bg.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(bg.source);
	}
	bgTable.append(tempString);

	const list = ListUtil.search({
		valueNames: ['name', 'source'],
		listClass: "backgrounds"
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	filterBox.render();

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const bg = bgList[$(item.elm).attr(FLTR_ID)];
			return filterBox.toDisplay(f, bg.source);
		});
		FilterBox.nextIfHidden(bgList);
	}

	History.init();
	handleFilterChange();
	RollerUtil.addListRollButton();

	const subList = ListUtil.initSublist({
		valueNames: ["name", "id"],
		listClass: "subbackgrounds",
		itemList: bgList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(bgList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
	ListUtil.initGenericPinnable();
	ListUtil.loadState();
}

function getSublistItem (bg, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(bg)}" title="${bg.name}">
				<span class="name col-xs-12">${bg.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

function loadhash (id) {
	const $content = $("#pagecontent");
	$content.html(tabledefault);
	const curbg = bgList[id];
	const name = curbg.name;
	const source = curbg.source;
	const sourceAbv = Parser.sourceJsonToAbv(source);
	const sourceFull = Parser.sourceJsonToFull(source);
	const renderStack = [];
	const entryList = {type: "entries", entries: curbg.entries};
	renderer.recursiveEntryRender(entryList, renderStack, 1);
	$content.find("th.name").html(`<span class="stats-name">${name}</span> <span title="${sourceFull}" class='stats-source source${sourceAbv}'>${sourceAbv}</span>`);
	$content.find("tr#traits").after(`<tr class='trait'><td colspan='6'>${renderStack.join("")}</td></tr>`);
	$content.find("#source").html(`<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${curbg.page}</td>`);
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
}