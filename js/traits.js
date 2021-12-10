"use strict";

class TraitsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterTraits();
		super({
			dataSource: DataUtil.trait.loadJSON,

			pageFilter,

			listClass: "traits",

			sublistClass: "subtraits",

			dataProps: ["trait"],
		});
	}

	getListItem (it, vhI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${UrlUtil.autoEncodeHash(it)}" class="lst--border">
			<span class="bold col-10 pl-0">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			vhI,
			eleLi,
			it.name,
			{
				hash,
				source,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : vhI,
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

		const $ele = $(`<li class="row"><a href="#${hash}" class="lst--border"><span class="name col-12 px-0">${it.name}</span></a></li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $(`#pagecontent`).empty();
		const trt = this._dataList[id];

		function buildStatsTab () {
			$content.append(RenderTraits.$getRenderedTrait(trt));
		}
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules("trait");
			$content.append(quickRules);
		}
		const statTab = Renderer.utils.tabButton(
			"Trait",
			() => {},
			buildStatsTab,
		);
		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		Renderer.utils.bindTabButtons(statTab, infoTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

let traitsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	traitsPage = new TraitsPage();
	traitsPage.pOnLoad()
});
