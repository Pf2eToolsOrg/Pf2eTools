"use strict";

function cultBoonTypeToFull (type) {
	return type === "cult" ? "Cult" : "Demonic Boon";
}

class CultsBoonsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const typeFilter = new Filter({
			header: "Type",
			items: ["boon", "cult"],
			displayFn: cultBoonTypeToFull
		});

		super({
			dataSource: "data/cultsboons.json",

			filters: [
				sourceFilter,
				typeFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "source", "type", "uniqueid"],
			listClass: "cultsboons",

			sublistValueNames: ["type", "name", "source", "id"],
			sublistClass: "subcultsboons",

			dataProps: ["cult", "boon"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, bcI) {
		// populate filters
		this._sourceFilter.addItem(it.source);

		return `
		<li class="row" ${FLTR_ID}="${bcI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
			<a id="${bcI}" href="#${UrlUtil.autoEncodeHash(it)}" title="${it.name}">
				<span class="type col-3 text-center pl-0">${cultBoonTypeToFull(it.__prop)}</span>
				<span class="name col-7">${it.name}</span>
				<span class="source col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it.source)}</span>
				
				<span class="uniqueid hidden">${it.uniqueId ? it.uniqueId : bcI}</span>
			</a>
		</li>`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const cb = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				cb.source,
				cb.__prop
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
		this._renderer.setFirstSection(true);

		const it = this._dataList[id];

		const renderStack = [];
		if (it.__prop === "cult") {
			Renderer.cultboon.doRenderCultParts(it, this._renderer, renderStack);
			this._renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 2});

			$("#pagecontent").html(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(it)}
			<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
			<tr class="text"><td colspan="6" class="text">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`);
		} else if (it.__prop === "boon") {
			it._displayName = it._displayName || `Demonic Boon: ${it.name}`;
			Renderer.cultboon.doRenderBoonParts(it, this._renderer, renderStack);
			this._renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 1});
			$("#pagecontent").html(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(it)}
			<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`);
		}

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const cultsBoonsPage = new CultsBoonsPage();
window.addEventListener("load", () => cultsBoonsPage.pOnLoad());
