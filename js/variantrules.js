"use strict";

class VariantRulesPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"]});

		super({
			dataSource: "data/variantrules.json",

			filters: [
				sourceFilter,
				miscFilter
			],
			filterSource: sourceFilter,

			listClass: "variantrules",

			sublistClass: "subvariantrules",

			dataProps: ["variantrule"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (rule, rlI) {
		rule._fMisc = rule.srd ? ["SRD"] : [];

		const searchStack = [];
		for (const e1 of rule.entries) {
			Renderer.getNames(searchStack, e1);
		}

		// populate filters
		this._sourceFilter.addItem(rule.source);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(rule.source);
		const hash = UrlUtil.autoEncodeHash(rule);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-10 pl-0">${rule.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(rule.source)} pr-0" title="${Parser.sourceJsonToFull(rule.source)}" ${BrewUtil.sourceJsonToStyle(rule.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			rlI,
			eleLi,
			rule.name,
			{
				hash,
				search: searchStack.join(","),
				source,
				uniqueId: rule.uniqueId ? rule.uniqueId : rlI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const r = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				r.source,
				r._fMisc
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row"><a href="#${hash}" class="lst--border"><span class="bold col-12 px-0">${it.name}</span></a></li>`)
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
		const rule = this._dataList[id];

		$("#pagecontent").empty().append(RenderVariantRules.$getRenderedVariantRule(rule));

		loadSubHash([]);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		if (!sub.length) return;

		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);

		const $title = $(`.rd__h[data-title-index="${sub[0]}"]`);
		if ($title.length) $title[0].scrollIntoView();
	}
}

const variantRulesPage = new VariantRulesPage();
window.addEventListener("load", () => variantRulesPage.pOnLoad());
