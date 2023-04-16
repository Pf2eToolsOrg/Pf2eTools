"use strict";

class TablesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterTables();
		super({
			// dataSource: DataUtil.table.pLoadAll,
			dataSource: "data/tables.json",

			pageFilter,

			listClass: "tablesdata",
			listOptions: {
				sortByInitial: "sortName",
			},

			sublistClass: "subtablesdata",

			dataProps: ["table", "tableGroup"],
		});
	}

	getListItem (it, tbI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const sortName = it.name.replace(/^\s*([\d,.]+)\s*gp/, (...m) => m[1].replace(Parser._numberCleanRegexp, "").padStart(9, "0"));

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-10 pl-0">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			tbI,
			eleLi,
			it.name,
			{
				hash,
				sortName,
				source,
				aliases: it.alias ? it.alias.join(" - ") : "",
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : tbI,
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

		const $ele = $(`<li class="row"><a href="#${hash}" class="lst--border" title="${it.name}"><span class="bold col-12 px-0">${it.name}</span></a></li>`)
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
		const it = this._dataList[id];
		it.type = it.type || "table";
		const $pgContent = $("#pagecontent").empty();
		const buildStatsTab = () => {
			$pgContent.append(Renderer.table.getRenderedString(it));
			$pgContent.append(Renderer.utils.getPageP(it));
		};
		const buildInfoTab = async () => {
			let quickRulesType;
			switch (it.source) {
				case "CHD":
					quickRulesType = "criticalHitDeck";
					break;
				case "CFD":
					quickRulesType = "criticalFumbleDeck";
					break;
				case "HPD":
					quickRulesType = "heroPointDeck";
					break;
				default:
					return;
			}
			const quickRules = await Renderer.utils.pGetQuickRules(quickRulesType);
			$pgContent.append(quickRules);
		}
		const statsTab = Renderer.utils.tabButton(
			"Table",
			() => {},
			buildStatsTab,
		);
		const tabs = [statsTab];
		if (it.source === "CFD" || it.source === "CHD" || it.source === "HPD") {
			const infoTab = Renderer.utils.tabButton(
				"Quick Rules",
				() => {},
				buildInfoTab,
			);
			tabs.push(infoTab);
		}
		Renderer.utils.bindTabButtons(...tabs);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const tablesPage = new TablesPage();
window.addEventListener("load", () => tablesPage.pOnLoad());
