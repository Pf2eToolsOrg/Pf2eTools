"use strict";

let renderArea;

let adventures;
let adv;

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
				<a id="${i}" href='#${adv.id}' title='${adv.name}'>
					<span class='name'>${adv.name}</span> 
				</a>
				${makeContentsBlock(adv)}
			</li>`;
	}
	adventuresList.append(tempString);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});
}

function loadhash (id) {
	const adventureUrl = adventures[id].id;
	loadJSON(`data/adventures/${adventureUrl}.json`, onAdventureLoad);
}

function onAdventureLoad(data) {
	console.log(data)
}

function loadsub(sub) {

}