"use strict";

const JSON_URL = "data/trapshazards.json";

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let trapsAndHazardsList;
function onJsonLoad (data) {
	const hazardsList = data.hazard;
	hazardsList.forEach(h => h.trapType = "HAZ");
	trapsAndHazardsList = data.trap.concat(hazardsList);

	let tempString = "";
	trapsAndHazardsList.forEach((it, i) => {
		const abvSource = Parser.sourceJsonToAbv(it.source);

		tempString += `
			<li class="row" ${FLTR_ID}="${i}">
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-xs-6">${it.name}</span>
					<span class="trapType col-xs-4">${Parser.trapTypeToFull(it.trapType)}</span>
					<span class="source col-xs-2 source${abvSource}" title="${Parser.sourceJsonToFull(it.source)}">${abvSource}</span>
				</a>
			</li>
		`;
	});
	$(`#trapsHazardsList`).append(tempString);

	const list = ListUtil.search({
		valueNames: ["name", "trapType", "source"],
		listClass: "trapshazards",
		sortFunction: SortUtil.listSort
	});

	initHistory();
}

const renderer = new EntryRenderer();
function loadhash (jsonIndex) {
	const it = trapsAndHazardsList[jsonIndex];

	const renderStack = [];

	renderer.recursiveEntryRender({entries: it.entries}, renderStack, 2);

	const $content = $(`#pagecontent`);
	$content.html(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(it)}
		<tr class="text"><td colspan="6"><i>${Parser.trapTypeToFull(it.trapType)}</i></td>
		<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
		${EntryRenderer.utils.getPageTr(it)}
		${EntryRenderer.utils.getBorderTr()}
	`);
}