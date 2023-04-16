"use strict";
class EventsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterEvents();

		super({
			dataSource: "data/events.json",
			pageFilter,
			listClass: "events",
			sublistClass: "subevents",
			dataProps: ["event"],
		});
	}

	getListItem (it, ivI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-8 pl-0">${it.name}</span>
			<span class="col-2 text-center">${it.level}</span>
			<span class="col-3 ${Parser.sourceJsonToColor(it.source)} text-center" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ivI,
			eleLi,
			it.name,
			{
				hash,
				source,
				level: it.level,
				aliases: it.alias ? it.alias.join(" - ") : "",
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
				<span class="bold col-11 pl-0">${it.name}</span>
				<span class="col-2 text-center">${it.level}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				level: it.level,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];
		const $content = $("#pagecontent").empty();
		function buildStatsTab () {
			$content.append(Renderer.event.getRenderedString(it));
		}
		const statsTab = Renderer.utils.tabButton(
			"Event",
			() => { },
			buildStatsTab,
		);
		Renderer.utils.bindTabButtons(statsTab);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const eventsPage = new EventsPage();
window.addEventListener("load", () => eventsPage.pOnLoad());
