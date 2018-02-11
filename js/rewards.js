"use strict";

const JSON_URL = "data/rewards.json";

let tableDefault;
let rewardList;

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad (data) {
	tableDefault = $("#pagecontent").html();
	rewardList = data.reward;

	const sourceFilter = getSourceFilter();
	const typeFilter = new Filter({
		header: "Type",
		items: [
			"Blessing",
			"Boon",
			"Charm",
			"Demonic Boon"
		]
	});

	const filterBox = initFilterBox(sourceFilter, typeFilter);

	let tempString = "";
	for (let i = 0; i < rewardList.length; i++) {
		const reward = rewardList[i];

		tempString += `
			<li class='row' ${FLTR_ID}='${i}'>
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(reward)}' title='${reward.name}'>
					<span class='name col-xs-10'>${reward.name}</span>
					<span class='source col-xs-2 source${Parser.sourceJsonToAbv(reward.source)}' title='${Parser.sourceJsonToFull(reward.source)}'>${Parser.sourceJsonToAbv(reward.source)}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(reward.source);
	}
	$("ul.rewards").append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	const list = ListUtil.search({
		valueNames: ["name", "source"],
		listClass: "rewards"
	});

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const r = rewardList[$(item.elm).attr(FLTR_ID)];
			return filterBox.toDisplay(
				f,
				r.source,
				r.type
			);
		});
	}

	initHistory();
	handleFilterChange();
	RollerUtil.addListRollButton();
}

function loadhash (id) {
	$("#pagecontent").html(tableDefault);
	const reward = rewardList[id];

	$("th.name").html(`<span class="stats-name">${reward.name}</span><span class="stats-source source${reward.source}" title="${Parser.sourceJsonToFull(reward.source)}">${Parser.sourceJsonToAbv(reward.source)}</span>`);

	$("tr.text").remove();
	$("tr#text").after(EntryRenderer.reward.getRenderedString(reward));
}
