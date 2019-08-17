"use strict";

class VariantRulesPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();

		super({
			dataSource: "data/variantrules.json",

			filters: [
				sourceFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "source", "search"],
			listClass: "variantrules",

			sublistValueNames: ["name", "id"],
			sublistClass: "subvariantrules",

			dataProps: ["variantrule"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (rule, rlI) {
		const searchStack = [];
		for (const e1 of rule.entries) {
			Renderer.getNames(searchStack, e1);
		}

		// populate filters
		this._sourceFilter.addItem(rule.source);

		return `
			<li class="row" ${FLTR_ID}="${rlI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${rlI}" href="#${UrlUtil.autoEncodeHash(rule)}" title="${rule.name}">
					<span class="name col-10 pl-0">${rule.name}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(rule.source)} pr-0" title="${Parser.sourceJsonToFull(rule.source)}" ${BrewUtil.sourceJsonToStyle(rule.source)}>${Parser.sourceJsonToAbv(rule.source)}</span>
					<span class="search hidden">${searchStack.join(",")}</span>
				</a>
			</li>`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const r = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				r.source
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (rule, pinId) {
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(rule)}" title="${rule.name}">
					<span class="name col-12 px-0">${rule.name}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
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
