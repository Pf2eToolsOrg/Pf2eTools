"use strict";
const JSON_URL = "data/feats.json";
let tabledefault = "";
let featlist;

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let filterBox;
function onJsonLoad (data) {
	tabledefault = $("#pagecontent").html();
	featlist = data.feat;

	const sourceFilter = getSourceFilter();
	const asiFilter = getAsiFilter();
	const prereqFilter = new Filter({
		header: "Prerequisite",
		items: ["Ability", "Race", "Proficiency", "Spellcasting"]
	});
	filterBox = initFilterBox(
		sourceFilter,
		asiFilter,
		prereqFilter
	);

	const featTable = $("ul.feats");
	let tempString = "";
	for (let i = 0; i < featlist.length; i++) {
		const curfeat = featlist[i];
		const name = curfeat.name;
		const ability = utils_getAbilityData(curfeat.ability);
		if (!ability.asText) ability.asText = STR_NONE;
		curfeat._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering
		let prereqText = EntryRenderer.feat.getPrerequisiteText(curfeat.prerequisite, true);
		if (!prereqText) prereqText = STR_NONE;
		const CLS_COL_1 = "name col-xs-3 col-xs-3-8";
		const CLS_COL_2 = `source col-xs-1 col-xs-1-7 source${curfeat.source}`;
		const CLS_COL_3 = "ability " + (ability.asText === STR_NONE ? "list-entry-none " : "") + "col-xs-3 col-xs-3-5";
		const CLS_COL_4 = "prerequisite " + (prereqText === STR_NONE ? "list-entry-none " : "") + "col-xs-3";

		const preSet = new Set();
		(curfeat.prerequisite || []).forEach(it => preSet.add(...Object.keys(it)));
		curfeat._fPrereq = [...preSet].map(it => it.uppercaseFirst());

		curfeat._slAbility = ability.asText;
		curfeat._slPrereq = prereqText;

		tempString += `
			<li class="row" ${FLTR_ID}="${i}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(curfeat)}' title='${name}'>
					<span class='${CLS_COL_1}'>${name}</span>
					<span class='${CLS_COL_2}' title='${Parser.sourceJsonToFull(curfeat.source)}'>${Parser.sourceJsonToAbv(curfeat.source)}</span>
					<span class='${CLS_COL_3}'>${ability.asText}</span>
					<span class='${CLS_COL_4}'>${prereqText}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(curfeat.source);
	}
	featTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	// init list
	const list = ListUtil.search({
		valueNames: ['name', 'source', 'ability', 'prerequisite'],
		listClass: "feats"
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	// filtering function
	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const ft = featlist[$(item.elm).attr(FLTR_ID)];
			return filterBox.toDisplay(
				f,
				ft.source,
				ft._fAbility,
				ft._fPrereq
			);
		});
		FilterBox.nextIfHidden(featlist);
	}

	History.init();
	handleFilterChange();
	RollerUtil.addListRollButton();

	const subList = ListUtil.initSublist({
		valueNames: ["name", "ability", "prerequisite", "id"],
		listClass: "subfeats",
		itemList: featlist,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(featlist);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
	ListUtil.initGenericPinnable();
	ListUtil.loadState();
}

function getSublistItem (feat, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(feat)}" title="${feat.name}">
				<span class="name col-xs-4">${feat.name}</span>		
				<span class="ability col-xs-4 ${feat._slAbility === STR_NONE ? "list-entry-none" : ""}">${feat._slAbility}</span>		
				<span class="prerequisite col-xs-4 ${feat._slPrereq === STR_NONE ? "list-entry-none" : ""}">${feat._slPrereq}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

const renderer = new EntryRenderer();
function loadhash (id) {
	const $content = $("#pagecontent");
	$content.html(tabledefault);
	const feat = featlist[id];
	const source = feat.source;
	const sourceFull = Parser.sourceJsonToFull(source);

	$content.find("th.name").html(`<span class="stats-name">${feat.name}</span><span class="stats-source source${source}" title="${sourceFull}">${Parser.sourceJsonToAbv(source)}</span>`);

	const prerequisite = EntryRenderer.feat.getPrerequisiteText(feat.prerequisite);
	$content.find("td#prerequisite").html(prerequisite ? `Prerequisite: ${prerequisite}` : "");
	$content.find("tr.text").remove();
	EntryRenderer.feat.mergeAbilityIncrease(feat);

	const renderStack = [];
	renderer.recursiveEntryRender({entries: feat.entries}, renderStack, 2);

	$content.find("tr#text").after(`<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>`);
	$content.find(`#source`).html(`<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${feat.page}</td>`);
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
}