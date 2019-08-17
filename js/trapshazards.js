"use strict";

function filterTypeSort (a, b) {
	a = a.item;
	b = b.item;
	return SortUtil.ascSortLower(Parser.trapHazTypeToFull(a), Parser.trapHazTypeToFull(b));
}

class TrapsHazardsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const typeFilter = new Filter({
			header: "Type",
			items: [
				"MECH",
				"MAG",
				"SMPL",
				"CMPX",
				"HAZ",
				"WTH",
				"ENV",
				"WLD",
				"GEN"
			],
			displayFn: Parser.trapHazTypeToFull,
			itemSortFn: filterTypeSort
		});

		super({
			dataSource: "data/trapshazards.json",

			filters: [
				sourceFilter,
				typeFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "trapType", "source", "uniqueid"],
			listClass: "trapshazards",

			sublistValueNames: ["name", "type", "id"],
			sublistClass: "subtrapshazards",

			dataProps: ["trap", "hazard"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, thI) {
		it.trapHazType = it.trapHazType || "HAZ";

		// populate filters
		this._sourceFilter.addItem(it.source);

		return `
			<li class="row" ${FLTR_ID}="${thI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${thI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-6 pl-0">${it.name}</span>
					<span class="trapType col-4">${Parser.trapHazTypeToFull(it.trapHazType)}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it.source)}</span>
					
					<span class="uniqueid hidden">${it.uniqueId ? it.uniqueId : thI}</span>
				</a>
			</li>
		`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const it = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				it.source,
				it.trapHazType
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-8 pl-0">${it.name}</span>
					<span class="type col-4 pr-0">${Parser.trapHazTypeToFull(it.trapHazType)}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const it = this._dataList[id];

		$(`#pagecontent`).empty().append(RenderTrapsHazards.$getRenderedTrapHazard(it));

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const trapsHazardsPage = new TrapsHazardsPage();
window.addEventListener("load", () => trapsHazardsPage.pOnLoad());
