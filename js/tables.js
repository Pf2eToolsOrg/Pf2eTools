"use strict";

class TablesPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();

		super({
			dataSource: async () => {
				const datas = await Promise.all(["data/generated/gendata-tables.json", "data/tables.json"].map(url => DataUtil.loadJSON(url)));
				const combined = {};
				datas.forEach(data => {
					Object.entries(data).forEach(([k, v]) => {
						if (combined[k] && combined[k] instanceof Array && v instanceof Array) combined[k] = combined[k].concat(v);
						else if (combined[k] == null) combined[k] = v;
						else throw new Error(`Could not merge keys for key "${k}"`);
					});
				});
				return combined;
			},

			filters: [
				sourceFilter
			],
			filterSource: sourceFilter,

			listClass: "tablesdata",
			listOptions: {
				sortByInitial: "sortName"
			},

			sublistClass: "subtablesdata",

			dataProps: ["table", "tableGroup"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, tbI) {
		const sortName = it.name.replace(/^\s*([\d,.]+)\s*gp/, (...m) => m[1].replace(Parser._numberCleanRegexp, "").padStart(9, "0"));

		// populate filters
		this._sourceFilter.addItem(it.source);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="bold col-10 pl-0">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			tbI,
			eleLi,
			it.name,
			{
				hash,
				sortName,
				source,
				uniqueid: it.uniqueId ? it.uniqueId : tbI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const it = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				it.source
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row"><a href="#${hash}" title="${it.name}"><span class="bold col-12 px-0">${it.name}</span></a></li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const it = this._dataList[id];

		$("#pagecontent").empty().append(RenderTables.$getRenderedTable(it));

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const tablesPage = new TablesPage();
window.addEventListener("load", () => tablesPage.pOnLoad());
