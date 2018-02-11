"use strict";
let tabledefault = "";

let itemList;

window.onload = function load () {
	EntryRenderer.item.buildList((incItemList) => {
		itemList = incItemList;
		populateTablesAndFilters();
	});
};

function rarityValue (rarity) { // Ordered by most frequently occurring rarities in the JSON
	if (rarity === "Rare") return 3;
	if (rarity === "None") return 0;
	if (rarity === "Uncommon") return 2;
	if (rarity === "Very Rare") return 4;
	if (rarity === "Legendary") return 5;
	if (rarity === "Artifact") return 6;
	if (rarity === "Unknown") return 7;
	if (rarity === "Common") return 1;
	return 0;
}

function sortItems (a, b, o) {
	if (o.valueName === "name") {
		return b._values.name.toLowerCase() > a._values.name.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "type") {
		if (b._values.type === a._values.type) return SortUtil.compareNames(a, b);
		return b._values.type.toLowerCase() > a._values.type.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "source") {
		if (b._values.source === a._values.source) return SortUtil.compareNames(a, b);
		return b._values.source.toLowerCase() > a._values.source.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "rarity") {
		if (b._values.rarity === a._values.rarity) return SortUtil.compareNames(a, b);
		return rarityValue(b._values.rarity) > rarityValue(a._values.rarity) ? 1 : -1;
	} else return 1;
}

function deselectFilter (deselectProperty, deselectValue) {
	return function (val) {
		if (window.location.hash.length) {
			const itemProperty = itemList[getSelectedListElement().attr("id")][deselectProperty];
			if (itemProperty === deselectValue) {
				return deselNoHash();
			} else {
				return val === deselectValue && itemProperty !== val;
			}
		} else {
			return deselNoHash();
		}

		function deselNoHash () {
			return val === deselectValue;
		}
	}
}

let mundanelist
let magiclist
function populateTablesAndFilters () {
	tabledefault = $("#pagecontent").html();

	const sourceFilter = getSourceFilter();
	const typeFilter = new Filter({header: "Type", deselFn: deselectFilter("type", "$")});
	const tierFilter = new Filter({header: "Tier", items: ["None", "Minor", "Major"]});
	const rarityFilter = new Filter({
		header: "Rarity",
		items: ["None", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unknown"]
	});
	const propertyFilter = new Filter({header: "Property", displayFn: StrUtil.uppercaseFirst});
	const attunementFilter = new Filter({header: "Attunement", items: ["Yes", "By...", "Optional", "No"]});
	const categoryFilter = new Filter({
		header: "Category",
		items: ["Basic", "Generic Variant", "Specific Variant", "Other"],
		deselFn: deselectFilter("category", "Specific Variant")
	});
	const miscFilter = new Filter({header: "Miscellaneous", items: ["Sentient"]});

	const filterBox = initFilterBox(sourceFilter, typeFilter, tierFilter, rarityFilter, propertyFilter, attunementFilter, categoryFilter, miscFilter);
	const liList = {mundane: "", magic: ""}; // store the <li> tag content here and change the DOM once for each property after the loop

	for (let i = 0; i < itemList.length; i++) {
		const curitem = itemList[i];
		if (curitem.noDisplay) continue;
		const name = curitem.name;
		const rarity = curitem.rarity;
		const category = curitem.category;
		const source = curitem.source;
		const sourceAbv = Parser.sourceJsonToAbv(source);
		const sourceFull = Parser.sourceJsonToFull(source);
		const tierTags = [];
		tierTags.push(curitem.tier ? curitem.tier : "None");

		// for filter to use
		curitem._fTier = tierTags;
		curitem._fProperties = curitem.property ? curitem.property.map(p => curitem._allPropertiesPtr[p].name).filter(n => n) : [];
		curitem._fMisc = curitem.sentient ? ["Sentient"] : [];

		liList[rarity === "None" || rarity === "Unknown" || category === "Basic" ? "mundane" : "magic"] += `
			<li ${FLTR_ID}=${i}>
				<a id="${i}" href="#${UrlUtil.autoEncodeHash(curitem)}" title="${name}">
					<span class="name col-xs-4">${name}</span>
					<span class="type col-xs-4 col-xs-4-3">${curitem.typeText}</span>
					<span class="source col-xs-1 col-xs-1-7 source${sourceAbv}" title="${sourceFull}">${sourceAbv}</span>
					<span class="rarity col-xs-2">${rarity}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(source);
		curitem.procType.forEach(t => typeFilter.addIfAbsent(t));
		tierTags.forEach(tt => tierFilter.addIfAbsent(tt));
		curitem._fProperties.forEach(p => propertyFilter.addIfAbsent(p));
	}
	// populate table
	$("ul.list.mundane").append(liList.mundane);
	$("ul.list.magic").append(liList.magic);
	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	typeFilter.items.sort(SortUtil.ascSort);

	const options = {
		valueNames: ["name", "source", "type", "rarity"],
		listClass: "mundane"
	};

	mundanelist = ListUtil.search(options);
	options.listClass = "magic";
	magiclist = ListUtil.search(options);

	const mundaneWrapper = $(`.ele-mundane`);
	const magicWrapper = $(`.ele-magic`);
	mundanelist.on("searchComplete", function () { hideListIfEmpty(mundanelist, mundaneWrapper) });
	magiclist.on("searchComplete", function () { hideListIfEmpty(magiclist, magicWrapper) });

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		function listFilter (item) {
			const i = itemList[$(item.elm).attr(FLTR_ID)];
			return filterBox.toDisplay(
				f,
				i.source,
				i.procType,
				i._fTier,
				i.rarity,
				i._fProperties,
				i.attunementCategory,
				i.category,
				i._fMisc
			);
		}
		mundanelist.filter(listFilter);
		magiclist.filter(listFilter);

		hideListIfEmpty(mundanelist, mundaneWrapper);
		hideListIfEmpty(magiclist, magicWrapper);
	}

	function hideListIfEmpty (list, $eles) {
		if (list.visibleItems.length === 0) {
			$eles.hide();
		} else {
			$eles.show();
		}
	}

	$("#filtertools").find("button.sort").on("click", function () {
		$(this).data("sortby", $(this).data("sortby") === "asc" ? "desc" : "asc");
		magiclist.sort($(this).data("sort"), {order: $(this).data("sortby"), sortFunction: sortItems});
		mundanelist.sort($(this).data("sort"), {order: $(this).data("sortby"), sortFunction: sortItems});
	});

	$("#itemcontainer").find("h3").not(":has(input)").click(function () {
		if ($(this).next("ul.list").css("max-height") === "500px") {
			$(this).siblings("ul.list").animate({
				maxHeight: "250px",
				display: "block"
			});
			return;
		}
		$(this).next("ul.list").animate({
			maxHeight: "500px",
			display: "block"
		}).siblings("ul.list").animate({
			maxHeight: "0",
			display: "none"
		})
	});

	RollerUtil.addListRollButton();
	addListShowHide();
	initHistory();
	handleFilterChange();
}

const renderer = new EntryRenderer();

function loadhash (id) {
	$("#currentitem").html(tabledefault);
	const item = itemList[id];
	const source = item.source;
	const sourceFull = Parser.sourceJsonToFull(source);
	$("th.name").html(`<span class="stats-name">${item.name}</span><span class="stats-source source${item.source}" title="${Parser.sourceJsonToFull(item.source)}">${Parser.sourceJsonToAbv(item.source)}</span>`);

	const type = item.type || "";
	if (type === "INS" || type === "GS") item.additionalSources = item.additionalSources || [];
	if (type === "INS") {
		item.additionalSources.push({ "source": "XGE", "page": 83 })
	} else if (type === "GS") {
		item.additionalSources.push({ "source": "XGE", "page": 81 })
	}
	const addSourceText = item.additionalSources ? `. Additional information from ${item.additionalSources.map(as => `<i>${Parser.sourceJsonToFull(as.source)}</i>, page ${as.page}`).join("; ")}.` : null;
	$("td#source span").html(`<i>${sourceFull}</i>, page ${item.page}${addSourceText || ""}`);

	$("td span#value").html(item.value ? item.value + (item.weight ? ", " : "") : "");
	$("td span#weight").html(item.weight ? item.weight + (Number(item.weight) === 1 ? " lb." : " lbs.") : "");
	$("td span#rarity").html((item.tier ? ", " + item.tier : "") + (item.rarity ? ", " + item.rarity : ""));
	$("td span#attunement").html(item.reqAttune ? item.reqAttune : "");
	$("td span#type").html(item.typeText);

	const [damage, damageType, propertiesTxt] = EntryRenderer.item.getDamageAndPropertiesText(item);
	$("span#damage").html(damage);
	$("span#damagetype").html(damageType);
	$("span#properties").html(propertiesTxt);

	$("tr.text").remove();
	const entryList = {type: "entries", entries: item.entries};
	const renderStack = [];
	renderer.recursiveEntryRender(entryList, renderStack, 1);

	// tools, artisan tools, instruments, gaming sets
	if (type === "T" || type === "AT" || type === "INS" || type === "GS") {
		renderStack.push(`<p class="text-align-center"><i>See the <a href="${renderer.baseUrl}variantrules.html#${UrlUtil.encodeForHash(["Tool Proficiencies", "XGE"])}" target="_blank">Tool Proficiencies</a> entry of the Variant and Optional rules page for more information</i></p>`);
		if (type === "INS") {
			const additionEntriesList = {type: "entries", entries: TOOL_INS_ADDITIONAL_ENTRIES};
			renderer.recursiveEntryRender(additionEntriesList, renderStack, 1);
		} else if (type === "GS") {
			const additionEntriesList = {type: "entries", entries: TOOL_GS_ADDITIONAL_ENTRIES};
			renderer.recursiveEntryRender(additionEntriesList, renderStack, 1);
		}
	}
	if (item.additionalEntries) {
		const additionEntriesList = {type: "entries", entries: item.additionalEntries};
		renderer.recursiveEntryRender(additionEntriesList, renderStack, 1);
	}

	$("tr#text").after(`
		<tr class="text">
			<td colspan="6" class="text1">
				${utils_makeRoller(renderStack.join("")).split(item.name.toLowerCase()).join("<i>" + item.name.toLowerCase() + "</i>").split(item.name.toLowerCase().uppercaseFirst()).join("<i>" + item.name.toLowerCase().uppercaseFirst() + "</i>")}
			</td>
		</tr>`);

	$(".items span.roller").contents().unwrap();
	$("#pagecontent span.roller").click(function () {
		const roll = $(this).attr("data-roll").replace(/\s+/g, "");
		EntryRenderer.dice.roll(roll, {
			name: item.name,
			label: $(".stats-name").text()
		});
	})
}

const TOOL_INS_ADDITIONAL_ENTRIES = [
	"Proficiency with a musical instrument indicates you are familiar with the techniques used to play it. You also have knowledge of some songs commonly performed with that instrument.",
	{
		"type": "entries",
		"name": "History",
		"entries": [
			"Your expertise aids you in recalling lore related to your instrument."
		]
	},
	{
		"type": "entries",
		"name": "Performance",
		"entries": [
			"Your ability to put on a good show is improved when you incorporate an instrument into your act."
		]
	},
	{
		"type": "entries",
		"name": "Compose a Tune",
		"entries": [
			"As part of a long rest, you can compose a new tune and lyrics for your instrument. You might use this ability to impress a noble or spread scandalous rumors with a catchy tune."
		]
	},
	{
		"type": "table",
		"caption": "Musical Instrument",
		"colLabels": [
			"Activity", "DC"
		],
		"colStyles": [
			"col-xs-10",
			"col-xs-2 text-align-center"
		],
		"rows": [
			["Identify a tune", "10"],
			["Improvise a tune", "20"]
		]
	}
];

const TOOL_GS_ADDITIONAL_ENTRIES = [
	"Proficiency with a gaming set applies to one type of game, such as Three-Dragon Ante or games of chance that use dice.",
	{
		"type": "entries",
		"name": "Components",
		"entries": [
			"A gaming set has all the pieces needed to play a specific game or type of game, such as a complete deck of cards or a board and tokens."
		]
	},
	{
		"type": "entries",
		"name": "History",
		"entries": [
			"Your mastery of a game includes knowledge of its history, as well as of important events it was connected to or prominent historical figures involved with it."
		]
	},
	{
		"type": "entries",
		"name": "Insight",
		"entries": [
			"Playing games with someone is a good way to gain understanding of their personality, granting you a better ability to discern their lies from their truths and read their mood."
		]
	},
	{
		"type": "entries",
		"name": "Sleight of Hand",
		"entries": [
			"Sleight of Hand is a useful skill for cheating at a game, as it allows you to swap pieces, palm cards, or alter a die roll. Alternatively, engrossing a target in a game by manipulating the components with dexterous movements is a great distraction for a pickpocketing attempt."
		]
	},
	{
		"type": "table",
		"caption": "Gaming Set",
		"colLabels": [
			"Activity", "DC"
		],
		"colStyles": [
			"col-xs-10",
			"col-xs-2 text-align-center"
		],
		"rows": [
			["Catch a player cheating", "15"],
			["Gain insight into an opponent's personality", "15"]
		]
	}
];
