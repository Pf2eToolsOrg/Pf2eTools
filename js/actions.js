"use strict";

class ActionsPage extends ListPage {
	static _getTimeText (time) {
		return typeof time === "string" ? time : Parser.getTimeToFull(time)
	}

	constructor () {
		const sourceFilter = SourceFilter.getInstance();
		const timeFilter = new Filter({
			header: "Type",
			displayFn: StrUtil.uppercaseFirst,
			itemSortFn: SortUtil.ascSortLower
		});
		const miscFilter = new Filter({header: "Miscellaneous", items: ["Optional/Variant Action", "SRD"]});

		super({
			dataSource: "data/actions.json",

			filters: [
				sourceFilter,
				timeFilter,
				miscFilter
			],
			filterSource: sourceFilter,

			listClass: "actions",

			sublistClass: "subactions",

			dataProps: ["action"]
		});

		this._sourceFilter = sourceFilter;
		this._timeFilter = timeFilter;
		this._miscFilter = miscFilter;
	}

	getListItem (it, anI, isExcluded) {
		it._fTime = it.time ? it.time.map(it => it.unit || it) : null;
		it._fMisc = it.srd ? ["SRD"] : [];
		if (it.fromVariant) it._fMisc.push("Optional/Variant Action");

		if (!isExcluded) {
			// populate filters
			this._sourceFilter.addItem(it.source);
			this._timeFilter.addItem(it._fTime);
		}

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const time = it.time ? it.time.map(tm => ActionsPage._getTimeText(tm)).join("/") : "\u2014";

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
				time
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
				it._fMisc
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const time = it.time ? it.time.map(tm => ActionsPage._getTimeText(tm)).join("/") : "\u2014";

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
				time
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
