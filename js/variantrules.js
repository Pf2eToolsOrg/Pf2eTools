"use strict";
const JSON_URL = "data/variantrules.json";

window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

let rulesList;
let tableDefault;

const entryRenderer = new EntryRenderer();

function getNames(nameStack, entry) {
	if (entry.name) nameStack.push(entry.name);
	if (entry.entries) {
		for (const eX of entry.entries) {
			getNames(nameStack, eX);
		}
	}
	if (entry.items) {
		for (const eX of entry.items) {
			getNames(nameStack, eX);
		}
	}
}

function onJsonLoad(data) {
	rulesList = data;
	tableDefault = $("#stats").html();

	const sourceFilter = getSourceFilter();
	const filterBox = initFilterBox(sourceFilter);

	let tempString = "";
	for (let i = 0; i < rulesList.length; i++) {
		const curRule = rulesList[i];

		const searchStack = [];
		for (const e1 of curRule.entries) {
			getNames(searchStack, e1);
		}

		// populate table
		tempString += `
			<li ${FLTR_ID}='${i}'>
				<a id='${i}' href='#${encodeForHash(curRule.name)}_${encodeForHash(curRule.source)}' title='${curRule.name}'>
					<span class='name col-xs-10'>${curRule.name}</span>
					<span class='source col-xs-2 source${Parser.sourceJsonToAbv(curRule.source)}' title='${Parser.sourceJsonToFull(curRule.source)}'>${Parser.sourceJsonToAbv(curRule.source)}</span>
					<span class="search hidden">${searchStack.join(",")}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(curRule.source);
	}
	$("ul.variantRules").append(tempString);

	const list = search({
		valueNames: ['name', 'source', 'search'],
		listClass: "variantRules"
	});

	sourceFilter.items.sort(ascSort);

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange() {
		list.filter(function(item) {
			const f = filterBox.getValues();
			const r = rulesList[$(item.elm).attr(FLTR_ID)];

			return sourceFilter.toDisplay(f, r.source);
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (id) {
	// reset details pane to initial HTML
	$("#stats").html(tableDefault);

	const curRule = rulesList[id];

	$("th#name").html(curRule.name);

	// build text list and display
	$("tr.text").remove();
	const textStack = [];
	entryRenderer.recursiveEntryRender(curRule, textStack);
	$("tr#text").after("<tr class='text'><td colspan='6'>" + textStack.join("") + "</td></tr>");
}