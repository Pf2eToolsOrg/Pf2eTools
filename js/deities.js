"use strict";

const JSON_URL = "data/deities.json";

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
	const last = ["G", "E"];
	if (a === b) return 0;
	if (first.includes(a)) return -1;
	if (last.includes(b)) return 1;
	return 1;
}

let deitiesList;

function onJsonLoad (data) {
	deitiesList = data.deity;

	const alignmentFilter = new Filter({
		header: "Alignment",
		items: ["C", "E", "G", "L", "N"],
		displayFn: parseAlignmentToFull
	});
	const pantheonFilter = new Filter({
		header: "Pantheon",
		items: ["Celtic", "Dragonlance", "Eberron", "Egyptian", "Forgotten Realms", "Greek", "Greyhawk", "Nonhuman", "Norse"]
	});
	const categoryFilter = new Filter({
		header: "Category",
		items: [STR_NONE]
	});
	const domainFilter = new Filter({
		header: "Domain",
		items: ["Death", "Knowledge", "Life", "Light", "Nature", STR_NONE, "Tempest", "Trickery", "War"]
	});

	const filterBox = initFilterBox(alignmentFilter, pantheonFilter, categoryFilter, domainFilter);

	let tempString = "";
	deitiesList.forEach((g, i) => {
		g.alignment.sort(alignSort);
		if (!g.category) g.category = STR_NONE;
		if (!g.domains) g.domains = [STR_NONE];
		g.domains.sort(ascSort);

		tempString += `
			<li class="row" ${FLTR_ID}="${i}">
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(g)}" title="${g.name}">
					<span class="name col-xs-4">${g.name}</span>
					<span class="pantheon col-xs-2 text-align-center">${g.pantheon}</span>
					<span class="alignment col-xs-2 text-align-center">${g.alignment.join("")}</span>
					<span class="domains col-xs-4 ${g.domains[0] === STR_NONE ? `list-entry-none` : ""}">${g.domains.join(", ")}</span>
				</a>
			</li>
		`;

		categoryFilter.addIfAbsent(g.category);
	});
	$(`#deitiesList`).append(tempString);
	// sort filters
	categoryFilter.items.sort();

	const list = search({
		valueNames: ["name", "pantheon", "alignment", "domains", "symbol"],
		listClass: "deities",
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
			const g = deitiesList[$(item.elm).attr(FLTR_ID)];

			const rightAlignment = alignmentFilter.toDisplay(f, g.alignment);
			const rightPantheon = pantheonFilter.toDisplay(f, g.pantheon);
			const rightCategory = categoryFilter.toDisplay(f, g.category);
			const rightDomain = domainFilter.toDisplay(f, g.domains);
			return rightAlignment && rightPantheon && rightCategory && rightDomain;
		});
	}

	initHistory();
	handleFilterChange();
}

function loadhash (jsonIndex) {
	const deity = deitiesList[jsonIndex];
	const sourceFull = Parser.sourceJsonToFull(deity.source);

	const $content = $(`#pagecontent`);
	$content.html(`
		<tr><th class="border" colspan="6"></th></tr>
		<tr><th class="name" colspan="6"><span class="stats-name">${deity.name}</span><span class="stats-source source${deity.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(deity.source)}</span></th></tr>
		<tr><td colspan="6"><span class="bold">Pantheon: </span>${deity.pantheon}</td></tr>
		${deity.category? `<tr><td colspan="6"><span class="bold">Category: </span>${deity.category}</td></tr>` : ""}
		<tr><td colspan="6"><span class="bold">Alignment: </span>${deity.alignment.map(a => parseAlignmentToFull(a)).join(" ")}</td></tr>
		<tr><td colspan="6"><span class="bold">Domains: </span>${deity.domains.join(", ")}</td></tr>
		<tr><td colspan="6"><span class="bold">Symbol: </span>${deity.symbol}</td></tr>
		${deity.page ? `<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${deity.page}</td>` : ""}
		<tr><th class="border" colspan="6"></th></tr>
	`);
}
