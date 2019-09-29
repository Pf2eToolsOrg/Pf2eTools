"use strict";

class ObjectsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();

		super({
			dataSource: "data/objects.json",

			filters: [
				sourceFilter
			],
			filterSource: sourceFilter,

			listClass: "objects",

			sublistClass: "subobjects",

			dataProps: ["object"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (obj, obI) {
		this._sourceFilter.addItem(obj.source);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(obj.source);
		const hash = UrlUtil.autoEncodeHash(obj);
		const size = Parser.sizeAbvToFull(obj.size);

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="bold col-8 pl-0">${obj.name}</span>
			<span class="col-2 text-center">${size}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(obj.source)} pr-0" title="${Parser.sourceJsonToFull(obj.source)}" ${BrewUtil.sourceJsonToStyle(obj.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			obI,
			eleLi,
			obj.name,
			{
				hash,
				source,
				size,
				uniqueid: obj.uniqueId ? obj.uniqueId : obI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const it = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				it.source
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (obj, pinId) {
		const hash = UrlUtil.autoEncodeHash(obj);
		const size = Parser.sizeAbvToFull(obj.size);

		const $ele = $(`<li class="row">
			<a href="#${hash}" title="${obj.name}">
				<span class="bold col-9 pl-0">${obj.name}</span>
				<span class="col-3 pr-0 text-center">${size}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			obj.name,
			{
				hash,
				size
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const obj = this._dataList[id];

		const renderStack = [];

		if (obj.entries) this._renderer.recursiveRender({entries: obj.entries}, renderStack, {depth: 2});
		if (obj.actionEntries) this._renderer.recursiveRender({entries: obj.actionEntries}, renderStack, {depth: 2});

		$(`#pagecontent`).empty().append(RenderObjects.$getRenderedObject(obj));

		const $floatToken = $(`#float-token`).empty();
		if (obj.tokenUrl || !obj.uniqueId) {
			const imgLink = obj.tokenUrl || UrlUtil.link(`img/objects/${obj.name.replace(/"/g, "")}.png`);
			$floatToken.append(`
			<a href="${imgLink}" target="_blank" rel="noopener">
				<img src="${imgLink}" id="token_image" class="token" onerror="TokenUtil.imgError(this)" alt="${obj.name}">
			</a>`
			);
		} else TokenUtil.imgError();

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const objectsPage = new ObjectsPage();
window.addEventListener("load", () => objectsPage.pOnLoad());
