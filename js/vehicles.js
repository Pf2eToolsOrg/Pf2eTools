"use strict";

class VehiclesPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();

		super({
			dataSource: "data/vehicles.json",
			dataSourceFluff: "data/fluff-vehicles.json",

			filters: [
				sourceFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "source", "uniqueid"],
			listClass: "vehicles",

			sublistValueNames: ["name", "id"],
			sublistClass: "subvehicles",

			dataProps: ["vehicle"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, shI) {
		// populate filters
		this._sourceFilter.addItem(it.source);

		return `
			<li class="row" ${FLTR_ID}="${shI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${shI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-10 pl-0">${it.name}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it.source)}</span>
					
					<span class="uniqueid hidden">${it.uniqueId ? it.uniqueId : shI}</span>
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
				it.source
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
					<span class="name col-12 px-0">${it.name}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const vehicle = this._dataList[id];
		const $content = $(`#pagecontent`).empty();

		function buildStatsTab () {
			$content.append(RenderVehicles.$getRenderedVehicle(vehicle));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab(
				isImageTab,
				$content,
				vehicle,
				(fluffJson) => vehicle.fluff || fluffJson.vehicle.find(it => it.name === vehicle.name && it.source === vehicle.source),
				`data/fluff-vehicles.json`,
				() => true
			);
		}

		const statTab = Renderer.utils.tabButton(
			"Item",
			() => {},
			buildStatsTab
		);
		const infoTab = Renderer.utils.tabButton(
			"Info",
			() => {},
			buildFluffTab
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			() => buildFluffTab(true)
		);

		Renderer.utils.bindTabButtons(statTab, infoTab, picTab);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const vehiclesPage = new VehiclesPage();
window.addEventListener("load", () => vehiclesPage.pOnLoad());
