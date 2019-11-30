"use strict";

class ConditionsDiseasesPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const typeFilter = new Filter({
			header: "Type",
			items: ["condition", "disease"],
			displayFn: StrUtil.uppercaseFirst,
			deselFn: (it) => it === "disease"
		});
		const miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"]});

		super({
			dataSource: "data/conditionsdiseases.json",

			filters: [
				sourceFilter,
				typeFilter,
				miscFilter
			],
			filterSource: sourceFilter,

			listClass: "conditions",

			sublistClass: "subconditions",

			dataProps: ["condition", "disease"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, cdI) {
		it._fMisc = it.srd ? ["SRD"] : [];

		// populate filters
		this._sourceFilter.addItem(it.source);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-3 text-center pl-0">${StrUtil.uppercaseFirst(it.__prop)}</span>
			<span class="bold col-7">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			cdI,
			eleLi,
			it.name,
			{
				hash,
				source,
				type: it.__prop,
				uniqueId: it.uniqueId ? it.uniqueId : cdI
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
				it.__prop,
				it._fMisc
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="col-2 pl-0 text-center">${it.__prop.uppercaseFirst()}</span>
				<span class="bold col-10 pr-0">${it.name}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it.__prop
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];

		function buildStatsTab () {
			$content.append(RenderConditionDiseases.$getRenderedConditionDisease(it));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab(
				isImageTab,
				$content,
				it,
				(fluffJson) => it.fluff || fluffJson.condition.find(cd => it.name === cd.name && it.source === cd.source),
				`data/fluff-conditionsdiseases.json`,
				() => true
			);
		}

		const statTab = Renderer.utils.tabButton(
			"Traits",
			() => {},
			buildStatsTab
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			buildFluffTab.bind(null, true)
		);

		Renderer.utils.bindTabButtons(statTab, picTab);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const conditionsDiseasesPage = new ConditionsDiseasesPage();
window.addEventListener("load", () => conditionsDiseasesPage.pOnLoad());
