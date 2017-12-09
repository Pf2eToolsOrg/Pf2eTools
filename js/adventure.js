"use strict";

let renderArea;

let adventures;

const TABLE_START = `<tr><th class="border" colspan="6"></th></tr>`;
const TABLE_END = `<tr><th class="border" colspan="6"></th></tr>`;

window.onload = function load() {
	renderArea = $(`#stats`);

	renderArea.append(TABLE_START);
	renderArea.append(`<tr><td colspan="6" class="initial-message">Select an adventure to begin</td></tr>`);
	renderArea.append(TABLE_END);

	loadJSON(CONTENTS_URL, onJsonLoad);
};

function onJsonLoad(data) {
	adventures = data.adventure;

	const adventuresList = $("ul.contents");
	let tempString = "";
	for (let i = 0; i < adventures.length; i++) {
		const adv = adventures[i];

		tempString +=
			`<li>
				<a id="${i}" href='#${adv.id},0' title='${adv.name}'>
					<span class='name'>${adv.name}</span> 
				</a>
				${makeContentsBlock(adv, false)}
			</li>`;
	}
	adventuresList.append(tempString);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	window.onhashchange = hashChange;
	if (window.location.hash.length) {
		hashChange();
	}
}

// custom loading for this page, so it can serve multiple sources
function hashChange() {
	const [advId, ...hashParts] = window.location.hash.slice(1).split(HASH_PART_SEP);
	const fromIndex = adventures.filter(adv => adv.id === advId);
	if (fromIndex.length) {
		document.title = `${fromIndex[0].name} - 5etools`;
		$(`.adv-header`).html(fromIndex[0].name);
		$(`.adv-message`).html("Select a chapter on the left, and browse the content on the right");
		loadAdventure(advId, hashParts);
	} else {
		throw "No adventure with ID: " + advId;
	}
}


function loadAdventure(advId, hashParts) {
	loadJSON(`data/adventures/${advId}.json`, function(data) {
		onAdventureLoad(data, advId, hashParts);
	});
}

const renderer = new EntryRenderer();
function onAdventureLoad(data, advId, hashParts) {
	let chapter = 0;
	let scrollTo;
	if (hashParts && hashParts.length > 0) chapter = Number(hashParts[0]);
	if (hashParts && hashParts.length > 1) {
		scrollTo  = $(`[href="#${advId},${chapter},${hashParts[1]}"]`).data("header");
	}

	renderArea.html("");

	renderArea.append(TABLE_START);
	const textStack = [];
	renderer.recursiveEntryRender(data[chapter], textStack);
	renderArea.append(`<tr class='text'><td colspan='6'>${textStack.join("")}</td></tr>`);
	renderArea.append(TABLE_END);

	if (scrollTo) {
		const goTo = $(`span.entry-title:contains(${scrollTo})`);
		if (goTo[0]) {
			goTo[0].scrollIntoView();
		}
	}
}