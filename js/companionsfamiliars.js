"use strict";
class CompanionsFamiliarsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterCompanionsFamiliars();

		super({
			dataSource: "data/companionsfamiliars.json",

			pageFilter,

			listClass: "companionsfamiliars",

			sublistClass: "subcompanionsfamiliars",

			dataProps: ["companion", "familiar", "eidolon"],
		});
	}

	getListItem (it, ivI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-6 pl-0">${it.name}</span>
			<span class="col-3 text-center">${it.type}</span>
			<span class="col-3 ${Parser.sourceJsonToColor(it.source)} text-center pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ivI,
			eleLi,
			it.name,
			{
				hash,
				source,
				type: it.type,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : ivI,
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
				<span class="bold col-6 pl-0">${it.name}</span>
				<span class="col-6 text-center">${it.type}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it.type,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];
		const $pgContent = $("#pagecontent").empty();
		const buildStatsTab = () => {
			$pgContent.append(RenderCompanionsFamiliars.$getRenderedCompanionFamiliar(it));
		};
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules(it.__prop);
			$pgContent.append(quickRules);
		}
		const buildFluffTab = () => {
			$pgContent.append(Renderer.get().render(it.fluff));
		}
		const statsTab = Renderer.utils.tabButton(
			"Statblock",
			() => {},
			buildStatsTab,
		);
		const fluffTab = Renderer.utils.tabButton(
			"Fluff",
			() => {},
			buildFluffTab,
		);
		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		Renderer.utils.bindTabButtons(statsTab, fluffTab, infoTab);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const companionsFamiliarsPage = new CompanionsFamiliarsPage();
window.addEventListener("load", () => companionsFamiliarsPage.pOnLoad());
