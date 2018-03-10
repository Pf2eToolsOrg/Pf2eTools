"use strict";
const JSON_URL = "data/cultsboons.json";

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let cultListAndBoon;
function onJsonLoad (data) {
	data.cult.forEach(it => it._type = "c");
	data.boon.forEach(it => it._type = "b");
	cultListAndBoon = data.cult.concat(data.boon);

	let tempString = "";
	cultListAndBoon.forEach((it, i) => {
		tempString += `
			<li>
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name" title="${it.name}">${it.name}</span>
				</a>
			</li>`;
	});
	$("ul.cultsboons").append(tempString);

	const list = ListUtil.search({
		valueNames: ['name'],
		listClass: "cultsboons"
	});

	History.init();
}

function loadhash (id) {
	const it = cultListAndBoon[id];

	const renderer = new EntryRenderer();
	const renderStack = [];
	const sourceFull = Parser.sourceJsonToFull(it.source);

	if (it._type === "c") {
		if (it.goal || it.cultists || it.signaturespells) {
			const fauxList = {
				type: "list",
				style: "list-hang",
				items: []
			};
			if (it.goal) {
				fauxList.items.push({
					type: "item",
					name: "Goals:",
					entry: it.goal.entry
				});
			}

			if (it.cultists) {
				fauxList.items.push({
					type: "item",
					name: "Typical Cultists:",
					entry: it.cultists.entry
				});
			}
			if (it.signaturespells) {
				fauxList.items.push({
					type: "item",
					name: "Signature Spells:",
					entry: it.signaturespells.entry
				});
			}
			renderer.recursiveEntryRender(fauxList, renderStack, 2);
		}
		renderer.recursiveEntryRender({entries: it.entries}, renderStack, 2);

		$("#pagecontent").html(`
			<tr><th class="border" colspan="6"></th></tr>
			<tr><th class="name" colspan="6"><span class="stats-name">${it.name}</span><span class="stats-source source${it.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(it.source)}</span></th></tr>
			<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
			<tr class='text'><td colspan='6' class='text'>${renderStack.join("")}</td></tr>
			<tr><th class="border" colspan="6"></th></tr>
		`);
	} else {
		if (it._type === "b") {
			const benefits = {type: "list", style: "list-hang-notitle", items: []};
			benefits.items.push({
				type: "item",
				name: "Ability Score Adjustment:",
				entry: it.ability ? it.ability.entry : "None"
			});
			benefits.items.push({
				type: "item",
				name: "Signature Spells:",
				entry: it.signaturespells ? it.signaturespells.entry : "None"
			});
			renderer.recursiveEntryRender(benefits, renderStack, 1);
			renderer.recursiveEntryRender({entries: it.entries}, renderStack, 1);
			$("#pagecontent").html(`
				<tr><th class="border" colspan="6"></th></tr>
				<tr><th class="name" colspan="6"><span class="stats-name">${it.name}</span><span class="stats-source source${it.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(it.source)}</span></th></tr>
				<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>
				<tr><th class="border" colspan="6"></th></tr>
			`);
		}
	}
}
