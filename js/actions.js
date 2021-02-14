"use strict";

class ActionsPage extends ListPage {
	static sortActions (a, b, o) {
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "time": return SortUtil.ascSort(a.values.normalisedTime, b.values.normalisedTime) || SortUtil.compareListNames(a, b);
		}
	}

	static getTblTimeStr (time) {
		return time.unit === `Varies` ? `Varies` : Parser.TIME_ACTIONS.includes(time.unit) ? `${Parser.TIME_TO_FULL[time.unit].uppercaseFirst()}`
			: `${time.number} ${time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
	}

	static getNormalisedTime (time) {
		let multiplier = 1;
		let offset = 0;
		if (time == null) {
			return 0
		}
		if (time === "Exploration") return 900000000;
		if (time === "Downtime") return 900000001;
		switch (time.unit) {
			case Parser.TM_F: offset = 1; break;
			case Parser.TM_R: offset = 2; break;
			case Parser.TM_A: multiplier = 10; break;
			case Parser.TM_AA: multiplier = 20; break;
			case Parser.TM_AAA: multiplier = 30; break;
			case Parser.TM_ROUND: multiplier = 60; break;
			case Parser.TM_MINS: multiplier = 600; break;
			case Parser.TM_HRS: multiplier = 36000; break;
			case "Varies": multiplier = 100; break;
		}
		return (multiplier * time.number) + offset;
	}

	constructor () {
		const pageFilter = new PageFilterActions();
		super({
			dataSource: "data/actions.json",

			pageFilter,

			listClass: "actions",

			listOptions: {
				fnSort: ActionsPage.sortActions,
			},

			sublistClass: "subactions",

			dataProps: ["action"],
		});
	}

	getListItem (it, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		let time;
		if (it.activity) time = ActionsPage.getTblTimeStr(it.activity);
		else if (it.traits.includes("Exploration")) time = "Exploration";
		else if (it.traits.includes("Downtime")) time = "Downtime";
		else time = "\u2014"

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-6 bold pl-0">${it.name}</span>
			<span class="col-4">${time}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			it.name,
			{
				hash,
				source,
				time,
				normalisedTime: ActionsPage.getNormalisedTime(it.activity || time),
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : anI,
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
		let time;
		if (it.activity) time = ActionsPage.getTblTimeStr(it.activity);
		else if (it.traits.includes("Exploration")) time = "Exploration";
		else if (it.traits.includes("Downtime")) time = "Downtime";
		else time = "\u2014"

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-8 pl-0">${it.name}</span>
				<span class="col-4 pr-0">${time}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				time,
				normalisedTime: ActionsPage.getNormalisedTime(it.activity || time),
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];
		renderStatblock(it);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

function renderStatblock (action) {
	const $content = $("#pagecontent").empty()

	function buildStatsTab () {
		$content.append(RenderActions.$getRenderedAction(action));
	}
	function buildInfoTab () {
		$content.append(Renderer.action.getQuickRules(action))
	}
	const statTab = Renderer.utils.tabButton(
		"Action",
		() => {},
		buildStatsTab,
	);
	const infoTab = Renderer.utils.tabButton(
		"Quick Rules",
		() => {},
		buildInfoTab,
	);
	if (action.info) Renderer.utils.bindTabButtons(statTab, infoTab);
	else Renderer.utils.bindTabButtons(statTab);
}

const actionsPage = new ActionsPage();
window.addEventListener("load", () => actionsPage.pOnLoad());
