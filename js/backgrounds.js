"use strict";

class BackgroundPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterBackgrounds();
		super({
			dataSource: DataUtil.background.loadJSON,
			dataSourceFluff: "data/fluff-backgrounds.json",

			pageFilter,

			listClass: "backgrounds",

			sublistClass: "subbackgrounds",

			dataProps: ["background"],
		});
	}

	getListItem (bg, bgI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(bg, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const hash = UrlUtil.autoEncodeHash(bg);
		const name = bg.name
		const source = Parser.sourceJsonToAbv(bg.source);
		const boosts = bg.boosts.sort(SortUtil.abilitySort).join(", ");

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-4 pl-0">${bg.name}</span>
			<span class="col-6">${boosts}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(bg.source)}" title="${Parser.sourceJsonToFull(bg.source)} pr-0" ${BrewUtil.sourceJsonToStyle(bg.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			bgI,
			eleLi,
			name,
			{
				hash,
				source,
				boosts,
			},
			{
				uniqueId: bg.uniqueId || bgI,
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

	getSublistItem (bg, pinId) {
		const hash = UrlUtil.autoEncodeHash(bg);
		const boosts = bg.boosts.join(", ");
		const name = bg.name

		const $ele = $$`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-4 pl-0">${bg.name}</span>
				<span class="col-8 pr-0">${boosts}</span>
			</a>
		</li>`
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			name,
			{
				hash,
				source: Parser.sourceJsonToAbv(bg.source),
				boosts,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);
		const $pgContent = $("#pagecontent").empty();
		const bg = this._dataList[id];

		const buildStatsTab = () => {
			$pgContent.append(Renderer.background.getRenderedString(bg));
		};
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules("background");
			$pgContent.append(quickRules);
		}
		const statsTab = Renderer.utils.tabButton(
			"Background",
			() => {},
			buildStatsTab,
		);
		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		Renderer.utils.bindTabButtons(statsTab, infoTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

let backgroundsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	backgroundsPage = new BackgroundPage();
	backgroundsPage.pOnLoad()
});
