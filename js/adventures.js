"use strict";

let adventures;

window.onload = function load () {
	loadJSON(CONTENTS_URL, onJsonLoad);
};

function onJsonLoad (data) {
	adventures = data.adventure;

	const adventuresList = $("ul.adventures");
	let tempString = "";
	for (let i = 0; i < adventures.length; i++) {
		const adv = adventures[i];

		tempString +=
			`<li>
				<a href='adventure.html#${adv.id}' title='${adv.name}' class="adv-name">
					<span class='name'>${adv.name}</span> <span class="showhide" onclick="advToggle(event, this)" data-hidden="true">[+]</span> <span class="source" style="display: none">${adv.id}</span>
				</a>
				${makeContentsBlock(adv, true, false, true)}
			</li>`;
	}
	adventuresList.append(tempString);

	const list = new List("listcontainer", {
		valueNames: ['name', 'source'],
		listClass: "adventures"
	});

	list.sort("name");
	$("#reset").click(function () {
		$("#search").val("");
		list.search();
		list.sort("name");
		list.filter();
	});
}

function advToggle (evt, ele) {
	evt.stopPropagation();
	evt.preventDefault();
	const $ele = $(ele);
	const $childList = $ele.closest(`li`).find(`ul.adv-contents`);
	if ($ele.data("hidden")) {
		$childList.show();
		$ele.data("hidden", false);
		$ele.html(`[\u2013]`);
	} else {
		$childList.hide();
		$ele.data("hidden", true);
		$ele.html(`[+]`);
	}
}
