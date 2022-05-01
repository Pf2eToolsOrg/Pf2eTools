"use strict";

class PlacesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterPlaces();

		super({
			dataSource: "data/places.json",

			pageFilter,

			listClass: "places",

			sublistClass: "subplaces",

			dataProps: ["place"],
		});
	}

	getListItem (it, cdI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-5-5">${it.name}</span>
			<span class="text-center col-4">${it.category}</span>
			<span class="col-2-5 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			cdI,
			eleLi,
			it.name,
			{
				hash,
				source,
				category: it.category,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : cdI,
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

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-7 pl-0">${it.name}</span>
				<span class="text-center col-5 pr-0">${it.category}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				category: it.category,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];

		function buildStatsTab () {
			$content.append(Renderer.place.getRenderedString(it));
		}
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules(it.category);
			$content.append(quickRules);
		}

		const statTab = Renderer.utils.tabButton(
			it.category,
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

let placesPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	placesPage = new PlacesPage();
	placesPage.pOnLoad()
});
