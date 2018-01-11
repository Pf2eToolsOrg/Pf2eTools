"use strict";

const JSON_URL = "data/gods.json";


window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

function parseAlignmentToFull (alignment) {
	// TODO
	return alignment;
}

let godsList;

function onJsonLoad (data) {
	godsList = data.god;

	const alignmentFilter = new Filter({
		header: "Alignment", // TODO prefill
		displayFn: parseAlignmentToFull
	});
	const pantheonFilter = new Filter({
		header: "Pantheon" // TODO prefill
	});
	const domainFilter = new Filter({
		header: "Domain" // TODO prefill
	});

	const filterBox = initFilterBox(alignmentFilter, pantheonFilter, domainFilter);

	let tempString = "";
	godsList.forEach((g, i) => {
		g.domains.sort(ascSort);

		tempString += `
			<li class="row" ${FLTR_ID}="${i}">
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(g)}" title="${g.name}">
					<span class="name col-xs-4">${g.name}</span>
					<span class="pantheon col-xs-2 text-align-center">${g.pantheon}</span>
					<span class="alignment col-xs-2 text-align-center">${g.alignment}</span>
					<span class="domains col-xs-4">${g.domains.join(", ")}</span>
				</a>
			</li>
		`;

		// populate filters
		alignmentFilter.addIfAbsent(g.alignment);
		pantheonFilter.addIfAbsent(g.pantheon);
		g.domains.forEach(d => domainFilter.addIfAbsent(d))
	});
	$(`#godsList`).append(tempString);
	// sort filters
	// FIXME remove when they're static
	alignmentFilter.items.sort(ascSort);
	pantheonFilter.items.sort(ascSort);
	domainFilter.items.sort(ascSort);

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
	debugger
	$content.html(`
		<tr><th class="border" colspan="6"></th></tr>
		<tr><th class="name" colspan="6"><span class="stats-name">${god.name}</span><span class="stats-source source${god.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(god.source)}</span></th></tr>
		<tr><td colspan="6"><span class="bold">Pantheon: ${god.pantheon}</span></td></tr>
		<tr><td colspan="6"><span class="bold">Alignment: ${parseAlignmentToFull(god.alignment)}</span></td></tr>
		<tr><td colspan="6"><span class="bold">Domains: </span>${god.domains.join(", ")}</td></tr>
		<tr><td colspan="6"><span class="bold">Symbol: </span>${god.symbol}</td></tr>
		${god.page ? `<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${god.page}</td>` : ""}
		<tr><th class="border" colspan="6"></th></tr>
	`);
}
