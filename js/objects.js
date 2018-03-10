"use strict";

const JSON_URL = "data/objects.json";
const NM_GENERIC_OBJECT = "Generic Object";
const STAT_VARIES = "Varies (see below)";

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let objectsList;
function onJsonLoad (data) {
	objectsList = data.object;
	if (!objectsList.find(({name}) => name === NM_GENERIC_OBJECT)) {
		objectsList.push({
			name: NM_GENERIC_OBJECT,
			size: "V",
			type: "generic",
			source: "DMG",
			page: 246,
			ac: STAT_VARIES,
			hp: STAT_VARIES,
			immune: STAT_VARIES,
			entries: data.generic
		});
	}

	let tempString = "";
	objectsList.forEach((obj, i) => {
		const abvSource = Parser.sourceJsonToAbv(obj.source);

		tempString += `
			<li class="row" ${FLTR_ID}="${i}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(obj)}" title="${obj.name}">
					<span class="name col-xs-8">${obj.name}</span>
					<span class="size col-xs-2">${Parser.sizeAbvToFull(obj.size)}</span>
					<span class="source col-xs-2 source${abvSource}" title="${Parser.sourceJsonToFull(obj.source)}">${abvSource}</span>
				</a>
			</li>
		`;
	});
	$(`#objectsList`).append(tempString);

	const list = ListUtil.search({
		valueNames: ["name", "size", "source"],
		listClass: "objects",
		sortFunction: SortUtil.listSort
	});

	History.init();
	EntryRenderer.hover.bindPopoutButton(objectsList);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "size", "id"],
		listClass: "subobjects",
		itemList: objectsList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	ListUtil.initGenericPinnable();
	ListUtil.loadState();
}

function getSublistItem (obj, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(obj)}" title="${obj.name}">
				<span class="name col-xs-9">${obj.name}</span>		
				<span class="ability col-xs-3">${Parser.sizeAbvToFull(obj.size)}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

const renderer = new EntryRenderer();
function loadhash (jsonIndex) {
	const obj = objectsList[jsonIndex];

	const renderStack = [];

	if (obj.entries) renderer.recursiveEntryRender({entries: obj.entries}, renderStack, 2);
	if (obj.actionEntries) renderer.recursiveEntryRender({entries: obj.actionEntries}, renderStack, 2);

	const $content = $(`#pagecontent`);
	$content.html(`
		${EntryRenderer.utils.getBorderTr()}
		${EntryRenderer.utils.getNameTr(obj)}
		<tr class="text"><td colspan="6"><i>${obj.type !== "generic" ? `${Parser.sizeAbvToFull(obj.size)} object` : `Variable size object`}</i><br></td></tr>
		<tr class="text"><td colspan="6">
			<b>Armor Class:</b> ${obj.ac}<br>
			<b>Hit Points:</b> ${obj.hp}<br>
			<b>Damage Immunities:</b> ${obj.immune}<br>
		</td></tr>
		<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
		${EntryRenderer.utils.getPageTr(obj)}
		${EntryRenderer.utils.getBorderTr()}
	`);

	const imgLink = UrlUtil.link(`img/objects/${obj.name.replace(/"/g, "")}.png`);
	$("th.name").append(`
		<a href="${imgLink}" target="_blank">
			<img src="${imgLink}" class="token">
		</a>`
	);
}