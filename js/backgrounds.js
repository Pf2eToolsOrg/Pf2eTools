"use strict";
const JSON_URL = "data/backgrounds.json";
const renderer = new EntryRenderer();
let tabledefault = "";
let bgList;

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad (data) {
	bgList = data.background;

	tabledefault = $("#pagecontent").html();

	const sourceFilter = getSourceFilter();
	const filterBox = initFilterBox(sourceFilter);

	const bgTable = $("ul.backgrounds");
	let tempString = "";
	for (let i = 0; i < bgList.length; i++) {
		const bg = bgList[i];

		// populate table
		tempString +=
			`<li ${FLTR_ID}="${i}">
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
			return sourceFilter.toDisplay(f, bg.source);
		});
	}

	initHistory();
	handleFilterChange();
	RollerUtil.addListRollButton();
}

function loadhash (id) {
	$("#pagecontent").html(tabledefault);
	const curbg = bgList[id];
	const name = curbg.name;
	const source = curbg.source;
	const sourceAbv = Parser.sourceJsonToAbv(source);
	const sourceFull = Parser.sourceJsonToFull(source);
	const renderStack = [];
	const entryList = {type: "entries", entries: curbg.entries};
	renderer.recursiveEntryRender(entryList, renderStack, 1);
	$("th.name").html(`<span class="stats-name">${name}</span> <span title="${sourceFull}" class='stats-source source${sourceAbv}'>${sourceAbv}</span>`);
	$("tr#traits").after(`<tr class='trait'><td colspan='6'>${renderStack.join("")}</td></tr>`);
	$("#source").html(`<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${curbg.page}</td>`);
}
