"use strict";

class ActionsPage extends ListPage {
	static sortActions(a,b,o) {
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "time": return SortUtil.ascSort(a.values.normalisedTime, b.values.normalisedTime) || SortUtil.compareListNames(a, b);
		}
	}

	static getTblTimeStr (time) {
		return time.unit === `Varies` ? `Varies` : Parser.SP_TIME_ACTIONS.includes(time.unit) ? `${Parser.SP_TIME_TO_FULL[time.unit].uppercaseFirst()}`
			: `${time.number} ${time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
	}

	static getNormalisedTime (time) {
		let multiplier = 1;
		let offset = 0;
		if (time == null) {
			return 0
		}
		switch (time.unit) {
			case Parser.SP_TM_PF_F: offset = 1; break;
			case Parser.SP_TM_PF_R: offset = 2; break;
			case Parser.SP_TM_PF_A: multiplier = 10; break;
			case Parser.SP_TM_PF_AA: multiplier = 20; break;
			case Parser.SP_TM_PF_AAA: multiplier = 30; break;
			case Parser.SP_TM_ROUND: multiplier = 60; break;
			case Parser.SP_TM_MINS: multiplier = 600; break;
			case Parser.SP_TM_HRS: multiplier = 36000; break;
			case "Varies": multiplier = 100; break;
		}
		return (multiplier * time.number) + offset;
	}

	constructor () {
		const sourceFilter = SourceFilter.getInstance();
		const timeFilter = new Filter({
			header: "Activity",
			items: [
				Parser.SP_TM_PF_A,
				Parser.SP_TM_PF_AA,
				Parser.SP_TM_PF_AAA,
				Parser.SP_TM_PF_F,
				Parser.SP_TM_PF_R,
				Parser.SP_TM_MINS,
				Parser.SP_TM_HRS,
				"Varies"
			],
			displayFn: Parser.spTimeUnitToFull,
			itemSortFn: null
		});
		const traitFilter = new Filter({header: "Traits"})
		const miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action", "SRD"]});

		super({
			dataSource: "data/actions.json",

			filters: [
				sourceFilter,
				timeFilter,
				traitFilter,
				miscFilter
			],
			filterSource: sourceFilter,

			listClass: "actions",

			listOptions: {
				fnSort: ActionsPage.sortActions
			},

			sublistClass: "subactions",

			dataProps: ["action"]
		});

		this._sourceFilter = sourceFilter;
		this._timeFilter = timeFilter;
		this._traitFilter = traitFilter;
		this._miscFilter = miscFilter;
	}

	getListItem (it, anI, isExcluded) {
		it._fTime = it.activity ? it.activity.unit : null;
		it._fMisc = it.srd ? ["SRD"] : [];

		if (!isExcluded) {
			// populate filters
			this._sourceFilter.addItem(it.source);
			this._traitFilter.addItem(it.traits)
			this._timeFilter.addItem(it._fTime);
		}

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const time = it.activity ? ActionsPage.getTblTimeStr(it.activity): "\u2014";

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
				normalisedTime: ActionsPage.getNormalisedTime(it.activity)
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : anI,
				isExcluded
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(li => {
			const it = this._dataList[li.ix];
			return this._filterBox.toDisplay(
				f,
				it.source,
				it._fTime,
				it.traits,
				it._fMisc
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const time = it.activity ? ActionsPage.getTblTimeStr(it.activity): "\u2014";

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
				normalisedTime: ActionsPage.getNormalisedTime(it.activity)
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];
		$("#pagecontent").empty().append(RenderActions.$getRenderedAction(it));
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const actionsPage = new ActionsPage();
window.addEventListener("load", () => actionsPage.pOnLoad());
