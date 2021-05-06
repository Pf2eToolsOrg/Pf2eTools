"use strict";

class VariantRulesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterVariantRules();
		super({
			dataSource: "data/variantrules.json",

			pageFilter,

			listClass: "variantrules",

			sublistClass: "subvariantrules",

			dataProps: ["variantrule"],
		});
	}

	getListItem (rule, rlI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(rule, isExcluded);

		const searchStack = [];
		for (const e1 of rule.entries) {
			Renderer.getNames(searchStack, e1);
		}

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(rule.source);
		const hash = UrlUtil.autoEncodeHash(rule);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-7 pl-0">${rule.name}</span>
			<span class="col-3 text-center">${rule.type ? rule.type : "\u2014"}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(rule.source)} pr-0" title="${Parser.sourceJsonToFull(rule.source)}" ${BrewUtil.sourceJsonToStyle(rule.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			rlI,
			eleLi,
			rule.name,
			{
				hash,
				search: searchStack.join(","),
				source,
				type: rule.type || "",
			},
			{
				uniqueId: rule.uniqueId ? rule.uniqueId : rlI,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, this._dataList[item.ix]));
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row"><a href="#${hash}" class="lst--border">
				<span class="bold col-10 pl-0">${it.name}</span>
				<span class="col-3 text-center pr-0">${it.type ? it.type : "\u2014"}</span>
			</a></li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it.type || "",
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const rule = this._dataList[id];
		renderStatblock(rule);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		if (!sub.length) return;

		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);

		const $title = $(`.rd__h[data-title-index="${sub[0]}"]`);
		if ($title.length) $title[0].scrollIntoView();
	}
}

function renderStatblock (rule) {
	const $content = $("#pagecontent").empty();

	function buildStatsTab () {
		$content.append(RenderVariantRules.$getRenderedVariantRule(rule));
	}
	async function buildInfoTab () {
		const quickRules = await Renderer.utils.pGetQuickRules("variantRule");
		$content.append(quickRules);
	}

	const statTab = Renderer.utils.tabButton(
		"Rule",
		() => {},
		buildStatsTab,
	);
	const infoTab = Renderer.utils.tabButton(
		"Quick Rules",
		() => {},
		buildInfoTab,
	);
	Renderer.utils.bindTabButtons(statTab, infoTab);
}

let variantRulesPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	variantRulesPage = new VariantRulesPage();
	variantRulesPage.pOnLoad()
});
