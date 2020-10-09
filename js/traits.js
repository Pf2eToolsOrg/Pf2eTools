"use strict";

class TraitsPage extends ListPage {
	constructor () {
		const sourceFilter = SourceFilter.getInstance();

		super({
			dataSource: "data/traits.json",

			filters: [
				sourceFilter
			],
			filterSource: sourceFilter,

			listClass: "traits",

			sublistClass: "subtraits",

			dataProps: ["trait"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, vhI, isExcluded) {
		if (!isExcluded) {
			// populate filters
			this._sourceFilter.addItem(it.source);
		}

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
				source
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : vhI,
				isExcluded
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const it = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				it.source
			);
		});
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
				hash
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const trt = this._dataList[id];
		const $content = $(`#pagecontent`).empty();

		function buildStatsTab () {
			$content.append(RenderTraits.$getRenderedTrait(trt));
		}

		const statTab = Renderer.utils.tabButton(
			"Item",
			buildStatsTab
		);

		Renderer.utils.bindTabButtons(statTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const traitsPage = new TraitsPage();
window.addEventListener("load", () => traitsPage.pOnLoad());
