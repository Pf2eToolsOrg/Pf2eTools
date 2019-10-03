"use strict";

class ItemsPage {
	static rarityValue (rarity) {
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

	static sortItems (a, b, o) {
		if (o.sortBy === "name") return SortUtil.compareListNames(a, b);
		else if (o.sortBy === "type") return SortUtil.ascSortLower(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "source") return SortUtil.ascSortLower(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "rarity") return SortUtil.ascSort(ItemsPage.rarityValue(b.values.rarity), ItemsPage.rarityValue(a.values.rarity)) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "attunement") return SortUtil.ascSort(a.values.attunement, b.values.attunement) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "weight") return SortUtil.ascSort(a.values.weight, b.values.weight) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "cost") return SortUtil.ascSort(a.values.cost, b.values.cost) || SortUtil.compareListNames(a, b);
		else return 0;
	}
}

window.onload = async function load () {
	await ExcludeUtil.pInitialise();
	return pPopulateTablesAndFilters({item: await Renderer.item.pBuildList({isAddGroups: true, isBlacklistVariants: true})});
};

let mundaneList;
let magicList;
let subList;
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
async function pPopulateTablesAndFilters (data) {
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

	mundaneList = ListUtil.initList({
		listClass: "mundane",
		fnSort: ItemsPage.sortItems,
		dbgName: "mundane"
	});
	magicList = ListUtil.initList({
		listClass: "magic",
		fnSort: ItemsPage.sortItems
	});
	mundaneList.nextList = magicList;
	magicList.prevList = mundaneList;
	ListUtil.setOptions({primaryLists: [mundaneList, magicList]});

	const $elesMundaneAndMagic = $(`.ele-mundane-and-magic`);
	$(`.side-label--mundane`).click(() => {
		filterBox.setFromValues({Miscellaneous: {Mundane: 1}});
		handleFilterChange();
	});
	$(`.side-label--magic`).click(() => {
		filterBox.setFromValues({Miscellaneous: {Magic: 1}});
		handleFilterChange();
	});
	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	mundaneList.on("updated", () => {
		const $elesMundane = $(`.ele-mundane`);

		// Force-show the mundane list if there are no items on display
		if (magicList.visibleItems.length) $elesMundane.toggle(!!mundaneList.visibleItems.length);
		else $elesMundane.show();
		$elesMundaneAndMagic.toggle(!!(mundaneList.visibleItems.length && magicList.visibleItems.length));

		const current = mundaneList.visibleItems.length + magicList.visibleItems.length;
		const total = mundaneList.items.length + magicList.items.length;
		$outVisibleResults.html(`${current}/${total}`);
	});
	magicList.on("updated", () => {
		const $elesMundane = $(`.ele-mundane`);
		const $elesMagic = $(`.ele-magic`);

		$elesMagic.toggle(!!magicList.visibleItems.length);
		// Force-show the mundane list if there are no items on display
		if (!magicList.visibleItems.length) $elesMundane.show();
		else $elesMundane.toggle(!!mundaneList.visibleItems.length);
		$elesMundaneAndMagic.toggle(!!(mundaneList.visibleItems.length && magicList.visibleItems.length));

		const current = mundaneList.visibleItems.length + magicList.visibleItems.length;
		const total = mundaneList.items.length + magicList.items.length;
		$outVisibleResults.html(`${current}/${total}`);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	SortUtil.initBtnSortHandlers($("#filtertools-mundane"), mundaneList);
	SortUtil.initBtnSortHandlers($("#filtertools-magic"), magicList);

	subList = ListUtil.initSublist({
		listClass: "subitems",
		fnSort: ItemsPage.sortItems,
		getSublistRow: getSublistItem,
		onUpdate: onSublistChange
	});
	SortUtil.initBtnSortHandlers($("#sublistsort"), subList);
	ListUtil.initGenericAddable();

	addItems(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(() => BrewUtil.bind({lists: [mundaneList, magicList]}))
		.then(() => BrewUtil.pAddLocalBrewData())
		.catch(BrewUtil.pPurgeBrew)
		.then(async () => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({lists: [mundaneList, magicList], filterBox, sourceFilter});
			await ListUtil.pLoadState();
			RollerUtil.addListRollButton();
			ListUtil.addListShowHide();

			mundaneList.init();
			magicList.init();
			subList.init();

			Hist.init(true);
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

	for (; itI < itemList.length; itI++) {
		const item = itemList[itI];
		if (ExcludeUtil.isExcluded(item.name, "item", item.source)) continue;
		if (item.noDisplay) continue;
		Renderer.item.enhanceItem(item);

		const tierTags = [];
		tierTags.push(item.tier ? item.tier : "None");

		// for filter to use
		item._fTier = tierTags;
		item._fProperties = item.property ? item.property.map(p => Renderer.item._propertyMap[p].name).filter(n => n) : [];
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

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const hash = UrlUtil.autoEncodeHash(item);
		const source = Parser.sourceJsonToAbv(item.source);

		if (isMundane) {
			eleLi.innerHTML = `<a href="#${hash}">
				<span class="col-3 pl-0 bold">${item.name}</span>
				<span class="col-4-3">${item.typeListText}</span>
				<span class="col-1-5 text-center">${item.value || item.valueMult ? Parser.itemValueToFull(item, true).replace(/ +/g, "\u00A0") : "\u2014"}</span>
				<span class="col-1-5 text-center">${Parser.itemWeightToFull(item, true) || "\u2014"}</span>
				<span class="col-1-7 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</span>
			</a>`;

			const listItem = new ListItem(
				itI,
				eleLi,
				item.name,
				{
					hash,
					source,
					type: item.typeListText,
					cost: item._fCost,
					weight: Parser.weightValueToNumber(item.weight),
					uniqueid: item.uniqueId ? item.uniqueId : itI
				}
			);
			eleLi.addEventListener("click", (evt) => mundaneList.doSelect(listItem, evt));
			eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, mundaneList, listItem));
			mundaneList.addItem(listItem);
		} else {
			eleLi.innerHTML += `<a href="#${hash}">
				<span class="col-3-5 pl-0 bold">${item.name}</span>
				<span class="col-3-3">${item.typeListText}</span>
				<span class="col-1-5 text-center">${Parser.itemWeightToFull(item, true) || "\u2014"}</span>
				<span class="attunement col-0-6 text-center">${item.attunementCategory !== "No" ? "×" : ""}</span>
				<span class="rarity col-1-4">${item.rarity}</span>
				<span class="source col-1-7 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</span>
			</a>`;

			const listItem = new ListItem(
				itI,
				eleLi,
				item.name,
				{
					source,
					hash,
					type: item.typeListText,
					rarity: item.rarity,
					attunement: item.attunementCategory !== "No",
					weight: Parser.weightValueToNumber(item.weight),
					uniqueid: item.uniqueId ? item.uniqueId : itI
				}
			);
			eleLi.addEventListener("click", (evt) => magicList.doSelect(listItem, evt));
			eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, magicList, listItem));
			magicList.addItem(listItem);
		}

		// populate filters
		sourceFilter.addItem(item.source);
		item.procType.forEach(t => typeFilter.addItem(t));
		tierTags.forEach(tt => tierFilter.addItem(tt));
		item._fProperties.forEach(p => propertyFilter.addItem(p));
		attachedSpellsFilter.addItem(item.attachedSpells);
		lootTableFilter.addItem(item.lootTables);
	}

	// populate table labels
	$(`h3.ele-mundane span.side-label`).text("Mundane");
	$(`h3.ele-magic span.side-label`).text("Magic");

	mundaneList.update();
	magicList.update();

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
	function listFilter (li) {
		const it = itemList[li.ix];
		return filterBox.toDisplay(
			f,
			it.source,
			it.procType,
			it._fTier,
			it.rarity,
			it._fProperties,
			it.attunementCategory,
			it.category,
			it._fCost,
			it._fFocus,
			it._fMisc,
			it.lootTables,
			it.attachedSpells
		);
	}
	mundaneList.filter(listFilter);
	magicList.filter(listFilter);
	FilterBox.selectFirstVisible(itemList);
}

function onSublistChange () {
	const $totalWeight = $(`#totalweight`);
	const $totalValue = $(`#totalvalue`);
	let weight = 0;
	let value = 0;
	ListUtil.sublist.items.forEach(it => {
		const item = itemList[it.ix];
		const count = it.values.count;
		if (item.weight) weight += Number(item.weight) * count;
		if (item.value) value += Parser.coinValueToNumber(item.value) * count;
	});
	$totalWeight.text(`${weight.toLocaleString()} lb${weight !== 1 ? "s" : ""}.`);
	$totalValue.text(`${value.toLocaleString()}gp`)
}

function getSublistItem (item, pinId, addCount) {
	const hash = UrlUtil.autoEncodeHash(item);
	const count = addCount || 1;

	const $dispCount = $(`<span class="text-center col-2 pr-0">${count}</span>`);
	const $ele = $$`<li class="row">
		<a href="#${hash}">
			<span class="bold col-6 pl-0">${item.name}</span>
			<span class="text-center col-2">${item.weight ? `${item.weight} lb${item.weight > 1 ? "s" : ""}.` : "\u2014"}</span>
			<span class="text-center col-2">${item.value ? item.value.replace(/ +/g, "\u00A0") : "\u2014"}</span>
			${$dispCount}
		</a>
	</li>`.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

	const listItem = new ListItem(
		pinId,
		$ele,
		item.name,
		{
			hash,
			source: Parser.sourceJsonToAbv(item.source),
			weight: Parser.weightValueToNumber(item.weight),
			cost: item._fCost,
			count
		},
		{
			$elesCount: [$dispCount]
		}
	);
	return listItem;
}

const renderer = Renderer.get();
function loadHash (id) {
	renderer.setFirstSection(true);
	const $content = $(`#pagecontent`).empty();
	const item = itemList[id];

	function buildStatsTab () {
		$content.append(RenderItems.$getRenderedItem(item));
	}

	function buildFluffTab (isImageTab) {
		return Renderer.utils.pBuildFluffTab(
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
