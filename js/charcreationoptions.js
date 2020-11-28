"use strict";

class BackgroundPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterCharCreationOptions();
		super({
			dataSource: "data/charcreationoptions.json",
			dataSourceFluff: "data/fluff-charcreationoptions.json",

			pageFilter,

			listClass: "charcreationoptions",

			sublistClass: "subcharcreationoptions",

			dataProps: ["charoption"],
		});
	}

	getListItem (it, itI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const hash = UrlUtil.autoEncodeHash(it);
		const source = Parser.sourceJsonToAbv(it.source);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-2 text-center pl-0" title="${it._dOptionType}">${it.optionType}</span>
			<span class="bold col-8">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)} pr-0" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			itI,
			eleLi,
			it.name,
			{
				hash,
				source,
				type: it._dOptionType,
			},
			{
				uniqueId: it.uniqueId || itI,
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

		const $ele = $$`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="col-2 text-center pl-0" title="${it._dOptionType}">${it.optionType}</span>
				<span class="bold col-10 pr-0">${it.name}</span>
			</a>
		</li>`
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				source: Parser.sourceJsonToAbv(it.source),
				type: it._dOptionType,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];

		function buildStatsTab () {
			$content.append(RenderCharCreationOptions.$getRenderedCharCreationOption(it));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab({
				isImageTab,
				$content,
				entity: it,
				pFnGetFluff: Renderer.charoption.pGetFluff,
			});
		}

		const statTab = Renderer.utils.tabButton(
			"Traits",
			() => {},
			buildStatsTab,
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			buildFluffTab.bind(null, true),
		);

		Renderer.utils.bindTabButtons(statTab, picTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const backgroundsPage = new BackgroundPage();
window.addEventListener("load", () => backgroundsPage.pOnLoad());
