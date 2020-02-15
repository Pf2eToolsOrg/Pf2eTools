"use strict";

class LanguagesPage extends ListPage {
	constructor () {
		const sourceFilter = SourceFilter.getInstance();
		const typeFilter = new Filter({header: "Type", items: ["standard", "exotic", "secret"], itemSortFn: null, displayFn: StrUtil.uppercaseFirst});
		const scriptFilter = new Filter({header: "Script", displayFn: StrUtil.uppercaseFirst});
		const miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"]});

		super({
			dataSource: "data/languages.json",

			filters: [
				sourceFilter,
				typeFilter,
				scriptFilter,
				miscFilter
			],
			filterSource: sourceFilter,

			listClass: "languages",

			sublistClass: "sublanguages",

			dataProps: ["language"]
		});

		this._sourceFilter = sourceFilter;
		this._scriptFilter = scriptFilter;
	}

	getListItem (it, anI, isExcluded) {
		it._fMisc = it.srd ? ["SRD"] : [];

		if (!isExcluded) {
			// populate filters
			this._sourceFilter.addItem(it.source);
			this._scriptFilter.addItem(it.script);
		}

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-6 bold pl-0">${it.name}</span>
			<span class="col-2 text-center">${(it.type || "\u2014").uppercaseFirst()}</span>
			<span class="col-2 text-center">${(it.script || "\u2014").toTitleCase()}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			it.name,
			{
				hash,
				source,
				dialects: it.dialects || [],
				type: it.type || "",
				script: it.script || ""
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
				it.type,
				it.script,
				it._fMisc
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-8 pl-0">${it.name}</span>
				<span class="col-2 text-center">${(it.type || "\u2014").uppercaseFirst()}</span>
				<span class="col-2 text-center pr-0">${(it.script || "\u2014").toTitleCase()}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it.type || "",
				script: it.script || ""
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];

		function buildStatsTab () {
			$content.append(RenderLanguages.$getRenderedLanguage(it));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab(
				isImageTab,
				$content,
				it,
				(fluffJson) => it.fluff || fluffJson.languageFluff.find(l => it.name === l.name && it.source === l.source),
				`data/fluff-languages.json`,
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

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const languagesPage = new LanguagesPage();
window.addEventListener("load", () => languagesPage.pOnLoad());
