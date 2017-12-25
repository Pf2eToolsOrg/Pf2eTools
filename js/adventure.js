"use strict";

let renderArea;

let adventures;
const adventureContent = {};

const TABLE_START = `<tr><th class="border" colspan="6"></th></tr>`;
const TABLE_END = `<tr><th class="border" colspan="6"></th></tr>`;

window.onload = function load () {
	renderArea = $(`#stats`);

	renderArea.append(TABLE_START);
	renderArea.append(`<tr><td colspan="6" class="initial-message">Select an adventure to begin</td></tr>`);
	renderArea.append(TABLE_END);

	loadJSON(CONTENTS_URL, onJsonLoad);
};

function onJsonLoad (data) {
	adventures = data.adventure;

	const adventuresList = $("ul.contents");
	adventuresList.append($(`
		<li>
			<a href='adventures.html'>
				<span class='name'>\u21FD All Adventures</span>
			</a>
		</li>
	`));

	let tempString = "";
	for (let i = 0; i < adventures.length; i++) {
		const adv = adventures[i];

		tempString +=
			`<li class="adventure-contents-item" data-adventureid="${adv.id}">
				<a id="${i}" href='#${adv.id},0' title='${adv.name}'>
					<span class='name'>${adv.name}</span>
				</a>
				${makeContentsBlock(adv, false, true, false)}
			</li>`;
	}
	adventuresList.append(tempString);

	// add show/hide handles to section names
	$(`ul.adv-headers`).prev(`li`).find(`a`).css("display", "flex").css("justify-content", "space-between").css("padding", "0").append(`<span class="showhide" onclick="sectToggle(event, this)" data-hidden="false">[\u2013]</span>`);

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
function hashChange () {
	const [advId, ...hashParts] = window.location.hash.slice(1).split(HASH_PART_SEP);
	const fromIndex = adventures.filter(adv => adv.id === advId);
	if (fromIndex.length) {
		document.title = `${fromIndex[0].name} - 5etools`;
		$(`.adv-header`).html(fromIndex[0].name);
		$(`.adv-message`).html("Select a chapter on the left, and browse the content on the right");
		loadAdventure(fromIndex[0], advId, hashParts);
	} else {
		throw new Error("No adventure with ID: " + advId);
	}
}

let allContents;
let thisContents;
function loadAdventure (fromIndex, advId, hashParts) {
	if (adventureContent[advId] !== undefined) {
		handle(adventureContent[advId]);
	} else {
		loadJSON(`data/adventure/adventure-${advId}.json`, function (data) {
			adventureContent[advId] = data.data;
			handle(data.data);
		});
	}

	function handle (data) {
		allContents = $(`.adventure-contents-item`);
		thisContents = allContents.filter(`[data-adventureid="${advId}"]`);
		thisContents.show();
		allContents.filter(`[data-adventureid!="${advId}"]`).hide();
		onAdventureLoad(data, fromIndex, advId, hashParts);
	}
}

const renderer = new EntryRenderer();

const curRender = {
	curAdvId: "NONE",
	chapter: -1
};
function onAdventureLoad (data, fromIndex, advId, hashParts) {
	let chapter = 0;
	let scrollTo;
	if (hashParts && hashParts.length > 0) chapter = Number(hashParts[0]);
	if (hashParts && hashParts.length > 1) {
		scrollTo = $(`[href="#${advId},${chapter},${hashParts[1]}"]`).data("header");
	}

	if (curRender.chapter !== chapter || curRender.curAdvId !== advId) {
		thisContents.children(`ul`).children(`ul, li`).removeClass("active");
		thisContents.children(`ul`).children(`li:nth-of-type(${chapter + 1}), ul:nth-of-type(${chapter + 1})`).addClass("active");

		curRender.curAdvId = advId;
		curRender.chapter = chapter;
		renderArea.html("");

		renderArea.append(TABLE_START);
		const textStack = [];
		renderer.recursiveEntryRender(data[chapter], textStack);
		renderArea.append(`<tr class='text'><td colspan='6'>${textStack.join("")}</td></tr>`);
		renderArea.append(TABLE_END);

		if (scrollTo) {
			setTimeout(() => {
				scrollClick(scrollTo);
			}, 75)
		}
	} else {
		if (hashParts.length <= 1) {
			$(window).scrollTop(0);
		}
	}
}

function sectToggle (evt, ele) {
	evt.stopPropagation();
	evt.preventDefault();
	const $ele = $(ele);
	const $childList = $ele.closest(`li`).next(`ul.adv-headers`);
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