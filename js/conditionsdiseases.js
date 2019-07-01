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

		super({
			dataSource: "data/conditionsdiseases.json",

			filters: [
				sourceFilter,
				typeFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "source", "type", "uniqueid"],
			listClass: "conditions",

			sublistValueNames: ["name", "skills", "id"],
			sublistClass: "subconditions",

			dataProps: ["condition", "disease"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, cdI) {
		// populate filters
		this._sourceFilter.addItem(it.source);

		return `
		<li class="row" ${FLTR_ID}="${cdI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
			<a id='${cdI}' href='#${UrlUtil.autoEncodeHash(it)}' title="${it.name}">
				<span class="type col-3 text-center pl-0">${StrUtil.uppercaseFirst(it.__prop)}</span>
				<span class="name col-7">${it.name}</span>
				<span class="source col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it.source)}</span>
				
				<span class="uniqueid hidden">${it.uniqueId ? it.uniqueId : cdI}</span>
			</a>
		</li>`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const it = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				it.source,
				it.__prop
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(it)}">
				<span class="name col-12 px-0">${it.name}</span>
				<span class="id hidden">${pinId}</span>
			</a>
		</li>
	`;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];
		const entryList = {type: "entries", entries: it.entries};
		const textStack = [];
		this._renderer.recursiveRender(entryList, textStack);
		$content.append(`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(it)}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class="text"><td colspan="6">${textStack.join("")}</td></tr>
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}
	`);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const conditionsDiseasesPage = new ConditionsDiseasesPage();
window.addEventListener("load", () => conditionsDiseasesPage.pOnLoad());
