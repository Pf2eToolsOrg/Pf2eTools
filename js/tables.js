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

			listValueNames: ["name", "source", "sort-name"],
			listClass: "tablesdata",

			sublistValueNames: ["name", "id"],
			sublistClass: "subtablesdata",

			dataProps: ["table", "tableGroup"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, tbI) {
		const sortName = it.name.replace(/^([\d,.]+)gp/, (...m) => m[1].replace(Parser._numberCleanRegexp, "").padStart(9, "0"));

		// populate filters
		this._sourceFilter.addItem(it.source);

		return `
		<li class="row" ${FLTR_ID}="${tbI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
			<a id="${tbI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
				<span class="name col-10 pl-0">${it.name}</span>
				<span class="source col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it.source)}</span>
				<span class="hidden sort-name">${sortName}</span>
			</a>
		</li>`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const it = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				it.source
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (table, pinId) {
		return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(table)}">
				<span class="name col-12 px-0">${table.name}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>`;
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
