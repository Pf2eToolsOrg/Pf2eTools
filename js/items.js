"use strict";

window.onload = async function load () {
	await ExcludeUtil.pInitialise();
	Renderer.item.pBuildList({
		fnCallback: incItemList => populateTablesAndFilters({item: incItemList}),
		isAddGroups: true,
		isBlacklistVariants: true
	});
};

function rarityValue (rarity) {
	switch (rarity) {
		case "None": return 0;
		case "Common": return 1;
		case "Uncommon": return 2;
		case "Rare": return 3;
		case "Very Rare": return 4;
		case "Legendary": return 5;
		case "Artifact": return 6;
		case "Other": return 7;
		case "Varies": return 8;
		case "Unknown (Magic)": return 9;
		case "Unknown": return 10;
		default: return 11;
	}
}

function sortItems (a, b, o) {
	if (o.valueName === "name") return b._values.name.toLowerCase() > a._values.name.toLowerCase() ? 1 : -1;
	else if (o.valueName === "type") {
		if (b._values.type === a._values.type) return SortUtil.compareNames(a, b);
		return b._values.type.toLowerCase() > a._values.type.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "source") {
		if (b._values.source === a._values.source) return SortUtil.compareNames(a, b);
		return b._values.source.toLowerCase() > a._values.source.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "rarity") {
		if (b._values.rarity === a._values.rarity) return SortUtil.compareNames(a, b);
		return rarityValue(b._values.rarity) > rarityValue(a._values.rarity) ? 1 : -1;
	} else if (o.valueName === "count") {
		return SortUtil.ascSort(Number(a.values().count), Number(b.values().count));
	} else if (o.valueName === "weight") {
		return SortUtil.ascSort(Number(a.values().weight), Number(b.values().weight));
	} else if (o.valueName === "cost") {
		return SortUtil.ascSort(Number(a.values().cost), Number(b.values().cost));
	} else return 0;
}

let mundaneList;
let magicList;
const sourceFilter = getSourceFilter();
const DEFAULT_HIDDEN_TYPES = new Set(["$", "Futuristic", "Modern", "Renaissance"]);
const typeFilter = new Filter({header: "Type", deselFn: (it) => DEFAULT_HIDDEN_TYPES.has(it)});
const tierFilter = new Filter({header: "Tier", items: ["None", "Minor", "Major"], itemSortFn: null});
const propertyFilter = new Filter({header: "Property", displayFn: StrUtil.uppercaseFirst});
const costFilter = new RangeFilter({header: "Cost", min: 0, max: 100, isAllowGreater: true, suffix: "gp"});
const focusFilter = new Filter({header: "Spellcasting Focus", items: ["Bard", "Cleric", "Druid", "Paladin", "Sorcerer", "Warlock", "Wizard"]});
const attachedSpellsFilter = new Filter({header: "Attached Spells", displayFn: (it) => it.split("|")[0].toTitleCase(), itemSortFn: SortUtil.ascSortLower});
const lootTableFilter = new Filter({header: "Found On", items: ["Magic Item Table A", "Magic Item Table B", "Magic Item Table C", "Magic Item Table D", "Magic Item Table E", "Magic Item Table F", "Magic Item Table G", "Magic Item Table H", "Magic Item Table I"]});

let filterBox;
async function populateTablesAndFilters (data) {
	const rarityFilter = new Filter({
		header: "Rarity",
		items: ["None", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unknown", "Unknown (Magic)", "Other"],
		itemSortFn: null
	});
	const attunementFilter = new Filter({header: "Attunement", items: ["Yes", "By...", "Optional", "No"], itemSortFn: null});
	const categoryFilter = new Filter({
		header: "Category",
		items: ["Basic", "Generic Variant", "Specific Variant", "Other"],
		deselFn: (it) => it === "Specific Variant",
		itemSortFn: null
	});
	const miscFilter = new Filter({header: "Miscellaneous", items: ["Ability Score Adjustment", "Charges", "Cursed", "Magic", "Mundane", "Sentient"]});

	filterBox = await pInitFilterBox({filters: [sourceFilter, typeFilter, tierFilter, rarityFilter, propertyFilter, attunementFilter, categoryFilter, costFilter, focusFilter, miscFilter, lootTableFilter, attachedSpellsFilter]});

	const mundaneOptions = {
		valueNames: ["name", "type", "cost", "weight", "source", "uniqueid"],
		listClass: "mundane",
		sortClass: "none",
		sortFunction: sortItems
	};
	mundaneList = ListUtil.search(mundaneOptions);
	const magicOptions = {
		valueNames: ["name", "type", "weight", "rarity", "source", "uniqueid"],
		listClass: "magic",
		sortClass: "none",
		sortFunction: sortItems
	};
	magicList = ListUtil.search(magicOptions);

	const mundaneWrapper = $(`.ele-mundane`);
	const magicWrapper = $(`.ele-magic`);
	$(`.side-label--mundane`).click(() => {
		filterBox.setFromValues({Miscellaneous: {Mundane: 1}});
		handleFilterChange();
	});
	$(`.side-label--magic`).click(() => {
		filterBox.setFromValues({Miscellaneous: {Magic: 1}});
		handleFilterChange();
	});
	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	mundaneList.__listVisible = true;
	mundaneList.on("updated", () => {
		hideListIfEmpty(mundaneList, mundaneWrapper);
		const current = mundaneList.visibleItems.length + magicList.visibleItems.length;
		const total = mundaneList.items.length + magicList.items.length;
		$outVisibleResults.html(`${current}/${total}`);
	});
	magicList.__listVisible = true;
	magicList.on("updated", () => {
		hideListIfEmpty(magicList, magicWrapper);
		const current = mundaneList.visibleItems.length + magicList.visibleItems.length;
		const total = mundaneList.items.length + magicList.items.length;
		$outVisibleResults.html(`${current}/${total}`);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function hideListIfEmpty (list, $eles) {
		if (list.visibleItems.length === 0) {
			if (list.__listVisible) {
				list.__listVisible = false;
				$eles.hide();
			}
		} else if (!list.__listVisible) {
			list.__listVisible = true;
			$eles.show();
		}
	}

	$("#filtertools-mundane").find("button.sort").on("click", function (evt) {
		evt.stopPropagation();
		const $this = $(this);
		const direction = $this.data("sortby") === "asc" ? "desc" : "asc";
		$this.data("sortby", direction);
		SortUtil.handleFilterButtonClick.call(this, "#filtertools-mundane", $this, direction);
		mundaneList.sort($this.data("sort"), {order: $this.data("sortby"), sortFunction: sortItems});
	});

	$("#filtertools-magic").find("button.sort").on("click", function (evt) {
		evt.stopPropagation();
		const $this = $(this);
		const direction = $this.data("sortby") === "asc" ? "desc" : "asc";

		$this.data("sortby", direction);
		SortUtil.handleFilterButtonClick.call(this, "#filtertools-magic", $this, direction);
		magicList.sort($this.data("sort"), {order: $this.data("sortby"), sortFunction: sortItems});
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
		});
	});

	const subList = ListUtil.initSublist(
		{
			valueNames: ["name", "weight", "price", "count", "id"],
			listClass: "subitems",
			sortFunction: sortItems,
			getSublistRow: getSublistItem,
			onUpdate: onSublistChange
		}
	);
	ListUtil.initGenericAddable();

	addItems(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(() => BrewUtil.bind({list}))
		.then(() => BrewUtil.pAddLocalBrewData())
		.catch(BrewUtil.pPurgeBrew)
		.then(async () => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({lists: [mundaneList, magicList], filterBox, sourceFilter});
			await ListUtil.pLoadState();
			RollerUtil.addListRollButton();
			ListUtil.addListShowHide();

			History.init(true);
			ExcludeUtil.checkShowAllExcluded(itemList, $(`#pagecontent`));
		});
}

async function handleBrew (homebrew) {
	const itemList = await Renderer.item.getItemsFromHomebrew(homebrew);
	addItems({item: itemList});
}

let itemList = [];
let itI = 0;
function addItems (data) {
	if (!data.item || !data.item.length) return;
	itemList = itemList.concat(data.item);

	const liList = {mundane: "", magic: ""}; // store the <li> tag content here and change the DOM once for each property after the loop

	for (; itI < itemList.length; itI++) {
		const item = itemList[itI];
		if (ExcludeUtil.isExcluded(item.name, "item", item.source)) continue;
		if (item.noDisplay) continue;
		Renderer.item.enhanceItem(item);

		const name = item.name;
		const tierTags = [];
		tierTags.push(item.tier ? item.tier : "None");

		// for filter to use
		item._fTier = tierTags;
		item._fProperties = item.property ? item.property.map(p => item._allPropertiesPtr[p].name).filter(n => n) : [];
		item._fMisc = item.sentient ? ["Sentient"] : [];
		if (item.curse) item._fMisc.push("Cursed");
		const isMundane = item.rarity === "None" || item.rarity === "Unknown" || item.category === "Basic";
		item._fMisc.push(isMundane ? "Mundane" : "Magic");
		if (item.ability) item._fMisc.push("Ability Score Adjustment");
		if (item.charges) item._fMisc.push("Charges");
		item._fCost = Parser.coinValueToNumber(item.value);
		if (item.focus || item.type === "INS" || item.type === "SCF") {
			item._fFocus = item.focus ? item.focus === true ? ["Bard", "Cleric", "Druid", "Paladin", "Sorcerer", "Warlock", "Wizard"] : [...item.focus] : [];
			if (item.type === "INS" && !item._fFocus.includes("Bard")) item._fFocus.push("Bard");
			if (item.type === "SCF") {
				switch (item.scfType) {
					case "arcane": {
						if (!item._fFocus.includes("Sorcerer")) item._fFocus.push("Sorcerer");
						if (!item._fFocus.includes("Warlock")) item._fFocus.push("Warlock");
						if (!item._fFocus.includes("Wizard")) item._fFocus.push("Wizard");
						break;
					}
					case "druid": {
						if (!item._fFocus.includes("Druid")) item._fFocus.push("Druid");
						break;
					}
					case "holy":
						if (!item._fFocus.includes("Cleric")) item._fFocus.push("Cleric");
						if (!item._fFocus.includes("Paladin")) item._fFocus.push("Paladin");
						break;
				}
			}
		}

		if (isMundane) {
			liList["mundane"] += `
			<li class="row" ${FLTR_ID}=${itI} onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${itI}" href="#${UrlUtil.autoEncodeHash(item)}" title="${name}">
					<span class="name col-3 pl-0">${name}</span>
					<span class="type col-4-3">${item.typeListText}</span>
					<span class="col-1-5 text-center">${item.value || item.valueMult ? Parser.itemValueToFull(item, true).replace(/ +/g, "\u00A0") : "\u2014"}</span>
					<span class="col-1-5 text-center">${Parser.itemWeightToFull(item, true) || "\u2014"}</span>
					<span class="source col-1-7 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${Parser.sourceJsonToAbv(item.source)}</span>
					
					<span class="cost hidden">${item._fCost}</span>
					<span class="weight hidden">${Parser.weightValueToNumber(item.weight)}</span>
					<span class="uniqueid hidden">${item.uniqueId ? item.uniqueId : itI}</span>
				</a>
			</li>`;
		} else {
			liList["magic"] += `
			<li class="row" ${FLTR_ID}=${itI} onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${itI}" href="#${UrlUtil.autoEncodeHash(item)}" title="${name}">
					<span class="name col-3-5 pl-0">${name}</span>
					<span class="type col-3-3">${item.typeListText}</span>
					<span class="col-1-5 text-center">${Parser.itemWeightToFull(item, true) || "\u2014"}</span>
					<span class="rarity col-2">${item.rarity}</span>
					<span class="source col-1-7 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${Parser.sourceJsonToAbv(item.source)}</span>
					
					<span class="weight hidden">${Parser.weightValueToNumber(item.weight)}</span>
					<span class="uniqueid hidden">${item.uniqueId ? item.uniqueId : itI}</span>
				</a>
			</li>`;
		}

		// populate filters
		sourceFilter.addItem(item.source);
		item.procType.forEach(t => typeFilter.addItem(t));
		tierTags.forEach(tt => tierFilter.addItem(tt));
		item._fProperties.forEach(p => propertyFilter.addItem(p));
		attachedSpellsFilter.addItem(item.attachedSpells);
		lootTableFilter.addItem(item.lootTables);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(mundaneList, magicList);
	// populate table
	$("ul.list.mundane").append(liList.mundane);
	$("ul.list.magic").append(liList.magic);
	// populate table labels
	$(`h3.ele-mundane span.side-label`).text("Mundane");
	$(`h3.ele-magic span.side-label`).text("Magic");

	mundaneList.reIndex();
	magicList.reIndex();
	if (lastSearch) {
		mundaneList.search(lastSearch);
		magicList.search(lastSearch);
	}
	mundaneList.sort("name", {order: "desc"});
	magicList.sort("name", {order: "desc"});
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: itemList,
		getSublistRow: getSublistItem,
		primaryLists: [mundaneList, magicList]
	});
	ListUtil.bindAddButton();
	ListUtil.bindSubtractButton();
	Renderer.hover.bindPopoutButton(itemList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

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
			i._fCost,
			i._fFocus,
			i._fMisc,
			i.lootTables,
			i.attachedSpells
		);
	}
	mundaneList.filter(listFilter);
	magicList.filter(listFilter);
	FilterBox.selectFirstVisible(itemList);
}

function onSublistChange () {
	const totalWeight = $(`#totalweight`);
	const totalValue = $(`#totalvalue`);
	let weight = 0;
	let value = 0;
	ListUtil.sublist.items.forEach(it => {
		const item = itemList[Number(it._values.id)];
		const count = Number($(it.elm).find(".count").text());
		if (item.weight) weight += Number(item.weight) * count;
		if (item.value) value += Parser.coinValueToNumber(item.value) * count;
	});
	totalWeight.text(`${weight.toLocaleString()} lb${weight > 1 ? "s" : ""}.`);
	totalValue.text(`${value.toLocaleString()}gp`)
}

function getSublistItem (item, pinId, addCount) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(item)}" title="${item.name}">
				<span class="name col-6 pl-0">${item.name}</span>
				<span class="weight text-center col-2">${item.weight ? `${item.weight} lb${item.weight > 1 ? "s" : ""}.` : "\u2014"}</span>
				<span class="price text-center col-2">${item.value ? item.value.replace(/ +/g, "\u00A0") : "\u2014"}</span>
				<span class="count text-center col-2 pr-0">${addCount || 1}</span>
				
				<span class="cost hidden">${item._fCost}</span>
				<span class="id hidden">${pinId}</span>
			</a>
		</li>
	`;
}

const renderer = Renderer.get();
function loadHash (id) {
	renderer.setFirstSection(true);
	const $content = $(`#pagecontent`).empty();
	const item = itemList[id];

	function buildStatsTab () {
		const [damage, damageType, propertiesTxt] = Renderer.item.getDamageAndPropertiesText(item);

		const $toAppend = $(`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(item)}
		<tr><td class="typerarityattunement" colspan="6">${Renderer.item.getTypeRarityAndAttunementText(item)}</td></tr>
		<tr>
			<td colspan="2">${[Parser.itemValueToFull(item), Parser.itemWeightToFull(item)].filter(Boolean).join(", ").uppercaseFirst()}</td>
			<td class="text-right" colspan="4"><span>${damage}</span> <span>${damageType}</span> <span>${propertiesTxt}</span></td>
		</tr>
		<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
		${Renderer.utils.getPageTr(item)}
		${Renderer.utils.getBorderTr()}
		`);
		$content.append($toAppend);

		const source = item.source;
		const sourceFull = Parser.sourceJsonToFull(source);

		const type = item.type || "";
		if (type === "INS" || type === "GS") item.additionalSources = item.additionalSources || [];
		if (type === "INS") {
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 83)) item.additionalSources.push({ "source": "XGE", "page": 83 })
		} else if (type === "GS") {
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 81)) item.additionalSources.push({ "source": "XGE", "page": 81 })
		}
		const addSourceText = item.additionalSources ? `. Additional information from ${item.additionalSources.map(as => `<i>${Parser.sourceJsonToFull(as.source)}</i>, page ${as.page}`).join("; ")}.` : null;
		$content.find("td#source span").html(`<i>${sourceFull}</i>${item.page > 0 ? `, page ${item.page}${addSourceText || ""}` : ""}`);

		$content.find("tr.text").remove();
		const renderStack = [];
		if (item.entries && item.entries.length) {
			const entryList = {type: "entries", entries: item.entries};
			renderer.recursiveRender(entryList, renderStack, {depth: 1});
		}

		if (item.additionalEntries) {
			const additionEntriesList = {type: "entries", entries: item.additionalEntries};
			renderer.recursiveRender(additionEntriesList, renderStack, {depth: 1});
		}

		if (item.lootTables) {
			renderStack.push(`<div><span class="bold">Found On: </span>${item.lootTables.sort(SortUtil.ascSortLower).map(tbl => renderer.render(`{@table ${tbl}}`)).join(", ")}</div>`);
		}

		const renderedText = renderStack.join("")
			.split(item.name.toLowerCase())
			.join(`<i>${item.name.toLowerCase()}</i>`)
			.split(item.name.toLowerCase().toTitleCase())
			.join(`<i>${item.name.toLowerCase().toTitleCase()}</i>`);
		if (renderedText && renderedText.trim()) {
			$content.find("tr#text").show().after(`
			<tr class="text">
				<td colspan="6" class="text1">
					${renderedText}
				</td>
			</tr>
		`);
		} else $content.find("tr#text").hide();
	}

	function buildFluffTab (isImageTab) {
		return Renderer.utils.buildFluffTab(
			isImageTab,
			$content,
			item,
			(fluffJson) => item.fluff || fluffJson.item.find(it => it.name === item.name && it.source === item.source),
			`data/fluff-items.json`,
			() => true
		);
	}

	const statTab = Renderer.utils.tabButton(
		"Item",
		() => {},
		buildStatsTab
	);
	const infoTab = Renderer.utils.tabButton(
		"Info",
		() => {},
		buildFluffTab
	);
	const picTab = Renderer.utils.tabButton(
		"Images",
		() => {},
		buildFluffTab.bind(null, true)
	);

	// only display the "Info" tab if there's some fluff info--currently (2018-12-13), no official item has text fluff
	if (item.fluff && item.fluff.entries) Renderer.utils.bindTabButtons(statTab, infoTab, picTab);
	else Renderer.utils.bindTabButtons(statTab, picTab);

	ListUtil.updateSelected();
}

function loadSubHash (sub) {
	sub = filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);
}
