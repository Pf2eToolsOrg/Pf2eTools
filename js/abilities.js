"use strict";

class AbilitiesPage extends ListPage {
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
		const pageFilter = new PageFilterAbilities();
		super({
			dataSource: "data/abilities.json",

			pageFilter,

			listClass: "abilities",

			listOptions: {
				fnSort: AbilitiesPage.sortActions,
			},

			sublistClass: "subabilities",

			dataProps: ["ability"],
		});
	}

	getListItem (it, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const time = it.activity ? AbilitiesPage.getTblTimeStr(it.activity) : "\u2014";

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-6 bold pl-0">${it.name}</span>
			<span class="col-4 bold">${time}</span>
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
				normalisedTime: AbilitiesPage.getNormalisedTime(it.activity),
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

		const time = it.activity ? AbilitiesPage.getTblTimeStr(it.activity) : "\u2014";

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-8 pl-0">${it.name}</span>
				<span class="bold col-4 pr-0">${time}</span>
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
				normalisedTime: AbilitiesPage.getNormalisedTime(it.activity),
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

function renderStatblock (ability) {
	const $content = $("#pagecontent").empty()

	function buildStatsTab () {
		$content.append(RenderAbilities.$getRenderedAbility(ability));
	}
	const buildInfoTab = async () => {
		const quickRules = await Renderer.utils.pGetQuickRules("ability");
		$content.append(quickRules);
	}
	const statTab = Renderer.utils.tabButton(
		"Ability",
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

const abilitiesPage = new AbilitiesPage();
window.addEventListener("load", () => abilitiesPage.pOnLoad());
