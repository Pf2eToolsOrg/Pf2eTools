"use strict";

const JSON_URL = "data/variantrules.json";

window.onload = async function load () {
	await ExcludeUtil.pInitialise();
	SortUtil.initHandleFilterButtonClicks();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

const entryRenderer = Renderer.get();

let list;
const sourceFilter = getSourceFilter();
let filterBox;

async function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'source', 'search'],
		listClass: "variantRules"
	});

	filterBox = await pInitFilterBox({filters: [sourceFilter]});

	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	list.on("updated", () => {
		$outVisibleResults.html(`${list.visibleItems.length}/${list.items.length}`);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	const subList = ListUtil.initSublist({
		valueNames: ["name", "id"],
		listClass: "subVariantRules",
		getSublistRow: getSublistItem
	});
	ListUtil.initGenericPinnable();

	addVariantRules(data);
	BrewUtil.pAddBrewData()
		.then(handleBrew)
		.then(() => BrewUtil.bind({list}))
		.then(() => BrewUtil.pAddLocalBrewData())
		.catch(BrewUtil.pPurgeBrew)
		.then(async () => {
			BrewUtil.makeBrewButton("manage-brew");
			BrewUtil.bind({filterBox, sourceFilter});
			await ListUtil.pLoadState();
			ListUtil.addListShowHide();

			History.init(true);
			ExcludeUtil.checkShowAllExcluded(rulesList, $(`#pagecontent`));
		});
}

function handleBrew (homebrew) {
	addVariantRules(homebrew);
	return Promise.resolve();
}

let rulesList = [];
let rlI = 0;
function addVariantRules (data) {
	if (!data.variantrule || !data.variantrule.length) return;

	rulesList = rulesList.concat(data.variantrule);

	let tempString = "";
	for (; rlI < rulesList.length; rlI++) {
		const rule = rulesList[rlI];
		if (ExcludeUtil.isExcluded(rule.name, "variantrule", rule.source)) continue;

		const searchStack = [];
		for (const e1 of rule.entries) {
			Renderer.getNames(searchStack, e1);
		}

		// populate table
		tempString += `
			<li class="row" ${FLTR_ID}="${rlI}" onclick="ListUtil.toggleSelected(event, this)">
				<a id="${rlI}" href="#${UrlUtil.autoEncodeHash(rule)}" title="${rule.name}">
					<span class="name col-10 pl-0">${rule.name}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(rule.source)} pr-0" title="${Parser.sourceJsonToFull(rule.source)}" ${BrewUtil.sourceJsonToStyle(rule.source)}>${Parser.sourceJsonToAbv(rule.source)}</span>
					<span class="search hidden">${searchStack.join(",")}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addItem(rule.source);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	$("ul.variantRules").append(tempString);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: rulesList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	Renderer.hover.bindPopoutButton(rulesList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
}

function getSublistItem (rule, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(rule)}" title="${rule.name}">
				<span class="name col-12 px-0">${rule.name}</span>
				<span class="id hidden">${pinId}</span>
			</a>
		</li>
	`;
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const r = rulesList[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(f, r.source);
	});
	FilterBox.selectFirstVisible(rulesList);
}

function loadHash (id) {
	const curRule = rulesList[id];

	entryRenderer.setFirstSection(true);
	const textStack = [];
	entryRenderer.resetHeaderIndex();
	entryRenderer.recursiveRender(curRule, textStack);
	$("#pagecontent").html(`
		${Renderer.utils.getBorderTr()}
		<tr class="text"><td colspan="6">${textStack.join("")}</td></tr>
		${Renderer.utils.getPageTr(curRule)}
		${Renderer.utils.getBorderTr()}
	`);

	loadSubHash([]);

	ListUtil.updateSelected();
}

function loadSubHash (sub) {
	if (!sub.length) return;

	sub = filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub);

	const $title = $(`.rd__h[data-title-index="${sub[0]}"]`);
	if ($title.length) $title[0].scrollIntoView();
}
