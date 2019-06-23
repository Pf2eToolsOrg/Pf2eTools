"use strict";

const GEN_JSON_URL = "data/generated/gendata-tables.json";
const JSON_URL = "data/tables.json";
const renderer = Renderer.get();

window.onload = function load () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search

	SortUtil.initHandleFilterButtonClicks();
	Promise.all([GEN_JSON_URL, JSON_URL].map(url => DataUtil.loadJSON(url))).then((datas) => {
		const combined = {};
		datas.forEach(data => {
			Object.entries(data).forEach(([k, v]) => {
				if (combined[k] && combined[k] instanceof Array && v instanceof Array) combined[k] = combined[k].concat(v);
				else if (combined[k] == null) combined[k] = v;
				else throw new Error(`Could not merge keys for key "${k}"`);
			});
		});
		onJsonLoad(combined);
	});
};

const sourceFilter = getSourceFilter();
let filterBox;
let list;
async function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ["name", "source", "sort-name"],
		listClass: "tablesdata"
	});

	filterBox = await pInitFilterBox({filters: [sourceFilter]});

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
		listClass: "subtablesdata",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addTables(data);
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
		});
}

function handleBrew (homebrew) {
	addTables(homebrew);
	return Promise.resolve();
}

let tableList = [];
let cdI = 0;
function addTables (data) {
	if ((!data.table || !data.table.length) && (!data.tableGroup || !data.tableGroup.length)) return;

	if (data.table) data.table.forEach(it => it._type = "t");
	if (data.tableGroup) data.tableGroup.forEach(it => it._type = "g");

	if (data.table && data.table.length) tableList = tableList.concat(data.table);
	if (data.tableGroup && data.tableGroup.length) tableList = tableList.concat(data.tableGroup);

	const tablesTable = $("ul.tablesdata");
	let tempString = "";
	for (; cdI < tableList.length; cdI++) {
		const it = tableList[cdI];

		const sortName = it.name.replace(/^([\d,.]+)gp/, (...m) => m[1].replace(Parser._numberCleanRegexp, "").padStart(9, "0"));

		tempString += `
			<li class="row" ${FLTR_ID}="${cdI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${cdI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-10 pl-0">${it.name}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it.source)}</span>
					<span class="hidden sort-name">${sortName}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addItem(it.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	tablesTable.append(tempString);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("sort-name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: tableList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	Renderer.hover.bindPopoutButton(tableList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function getSublistItem (table, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(table)}">
				<span class="name col-12 px-0">${table.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

// filtering function
function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const it = tableList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			it.source
		);
	});
	FilterBox.selectFirstVisible(tableList);
}

function loadHash (id) {
	renderer.setFirstSection(true);
	const $content = $("#pagecontent").empty();
	const it = tableList[id];

	$content.append(`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(it)}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		${Renderer.table.getCompactRenderedString(it)}
		${it.chapter ? `<tr class="text"><td colspan="6">
		${Renderer.get().render(`{@note ${it._type === "t" ? `This table` : "These tables"} can be found in ${Parser.sourceJsonToFull(it.source)}${Parser.bookOrdinalToAbv(it.chapter.ordinal, true)}, {@book ${it.chapter.name}|${it.source}|${it.chapter.index}|${it.chapter.name}}.}`)}
		</td></tr>` : ""}
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}
	`);

	ListUtil.updateSelected();
}

function loadSubHash (sub) {
	sub = filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}
