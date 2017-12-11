"use strict";

let adventures;

window.onload = function load() {
	loadJSON(CONTENTS_URL, onJsonLoad);
};

function onJsonLoad(data) {

	adventures = data.adventure;

	const adventuresList = $("ul.adventures");
	let tempString = "";
	for (let i = 0; i < adventures.length; i++) {
		const adv = adventures[i];

		tempString +=
			`<li>
				<a href='adventure.html#${adv.id}' title='${adv.name}'>
					<span class='name'>${adv.name}</span> 
				</a>
				${makeContentsBlock(adv, true, false)}
			</li>`;
	}
	adventuresList.append(tempString);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "adventures"
	});

	list.sort("name");
	$("#reset").click(function() {
		$("#search").val("");
		list.search();
		list.sort("name");
		list.filter();
	});
}
