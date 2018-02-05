"use strict";
const JSON_URL = "data/cults.json";

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let tableDefault;
let cultList;

function onJsonLoad (data) {
	tableDefault = $("#pagecontent").html();
	cultList = data.cult;

	let tempString = "";
	for (let i = 0; i < cultList.length; i++) {
		const cult = cultList[i];

		tempString += `
			<li>
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(cult)}' title='${cult.name}'>
					<span class='name' title='${cult.name}'>${cult.name}</span>
				</a>
			</li>`;
	}
	$("ul.cults").append(tempString);

	const list = ListUtil.search({
		valueNames: ['name'],
		listClass: "cults"
	});

	initHistory();
}

function loadhash (id) {
	const curcult = cultList[id];

	const renderer = new EntryRenderer();
	const renderStack = [];
	const sourceFull = Parser.sourceJsonToFull(curcult.source);

	if (curcult.goal || curcult.cultists || curcult.signaturespells) {
		const fauxList = {
			type: "list",
			style: "list-hang",
			items: []
		};
		if (curcult.goal) {
			fauxList.items.push({
				type: "item",
				name: "Goals:",
				entry: curcult.goal.entry
			});
		}

		if (curcult.cultists) {
			fauxList.items.push({
				type: "item",
				name: "Typical Cultists:",
				entry: curcult.cultists.entry
			});
		}
		if (curcult.signaturespells) {
			fauxList.items.push({
				type: "item",
				name: "Signature Spells:",
				entry: curcult.signaturespells.entry
			});
		}
		renderer.recursiveEntryRender(fauxList, renderStack, 2);
	}
	renderer.recursiveEntryRender({entries: curcult.entries}, renderStack, 2);

	$("#pagecontent").html(`
		<tr><th class="border" colspan="6"></th></tr>
		<tr><th class="name" colspan="6"><span class="stats-name">${curcult.name}</span><span class="stats-source source${curcult.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(curcult.source)}</span></th></tr>
		<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
		<tr class='text'><td colspan='6' class='text'>${renderStack.join("")}</td></tr>
		<tr><th class="border" colspan="6"></th></tr>
	`);
}
