"use strict";

const JSON_URL = "data/gods.json";

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

function parseAlignmentToFull (alignment) {
	alignment = alignment.toUpperCase();
	switch (alignment) {
		case "L":
			return "Lawful";
		case "N":
			return "Neutral";
		case "C":
			return "Chaotic";
		case "G":
			return "Good";
		case "E":
			return "Evil";
	}
	return alignment;
}

function alignSort (a, b) {
	const first = ["L", "C"];
	if (a === b) return 0;
	if (first.includes(a)) return -1;
	return 1;
}

let godsList;

function onJsonLoad (data) {
	godsList = data.god;

	const alignmentFilter = new Filter({
		header: "Alignment",
		items: ["C", "E", "G", "L", "N"],
		displayFn: parseAlignmentToFull
	});
	const pantheonFilter = new Filter({
		header: "Pantheon",
		items: ["Celtic", "Dragonlance", "Eberron", "Egyptian", "Forgotten Realms", "Greek", "Greyhawk", "Nonhuman", "Norse"]
	});
	const domainFilter = new Filter({
		header: "Domain",
		items: ["Death", "Knowledge", "Life", "Light", "Nature", "Tempest", "Trickery", "War"]
	});

	const filterBox = initFilterBox(alignmentFilter, pantheonFilter, domainFilter);

	let tempString = "";
	godsList.forEach((g, i) => {
		g.alignment.sort(alignSort);
		g.domains.sort(ascSort);

		tempString += `
			<li class="row" ${FLTR_ID}="${i}">
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(g)}" title="${g.name}">
					<span class="name col-xs-4">${g.name}</span>
					<span class="pantheon col-xs-2 text-align-center">${g.pantheon}</span>
					<span class="alignment col-xs-2 text-align-center">${g.alignment.join("")}</span>
					<span class="domains col-xs-4">${g.domains.join(", ")}</span>
				</a>
			</li>
		`;
	});
	$(`#godsList`).append(tempString);

	const list = search({
		valueNames: ["name", "pantheon", "alignment", "domains", "symbol"],
		listClass: "gods",
		sortFunction: listSort
	});

	function listSort (itemA, itemB, options) {
		if (options.valueName === "name") return compareBy("name");
		else return compareByOrDefault(options.valueName, "name");

		function compareBy (valueName) {
			const aValue = itemA.values()[valueName].toLowerCase();
			const bValue = itemB.values()[valueName].toLowerCase();
			if (aValue === bValue) return 0;
			return (aValue > bValue) ? 1 : -1;
		}

		function compareByOrDefault (valueName, defaultValueName) {
			const initialCompare = compareBy(valueName);
			return initialCompare === 0 ? compareBy(defaultValueName) : initialCompare;
		}
	}

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const g = godsList[$(item.elm).attr(FLTR_ID)];

			const rightAlignment = alignmentFilter.toDisplay(f, g.alignment);
			const rightPantheon = pantheonFilter.toDisplay(f, g.pantheon);
			const rightDomain = domainFilter.toDisplay(f, g.domains);
			return rightAlignment && rightPantheon && rightDomain;
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (jsonIndex) {
	const god = godsList[jsonIndex];
	const sourceFull = Parser.sourceJsonToFull(god.source);

	const $content = $(`#pagecontent`);
	$content.html(`
		<tr><th class="border" colspan="6"></th></tr>
		<tr><th class="name" colspan="6"><span class="stats-name">${god.name}</span><span class="stats-source source${god.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(god.source)}</span></th></tr>
		<tr><td colspan="6"><span class="bold">Pantheon: </span>${god.pantheon}</td></tr>
		<tr><td colspan="6"><span class="bold">Alignment: </span>${god.alignment.map(a => parseAlignmentToFull(a)).join(" ")}</td></tr>
		<tr><td colspan="6"><span class="bold">Domains: </span>${god.domains.join(", ")}</td></tr>
		<tr><td colspan="6"><span class="bold">Symbol: </span>${god.symbol}</td></tr>
		${god.page ? `<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${god.page}</td>` : ""}
		<tr><th class="border" colspan="6"></th></tr>
	`);
}
