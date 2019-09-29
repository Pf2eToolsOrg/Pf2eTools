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

			listClass: "cultsboons",

			sublistClass: "subcultsboons",

			dataProps: ["cult", "boon"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (it, bcI) {
		// populate filters
		this._sourceFilter.addItem(it.source);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const type = cultBoonTypeToFull(it.__prop);

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="col-3 text-center pl-0">${type}</span>
			<span class="bold col-7">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			bcI,
			eleLi,
			it.name,
			{
				hash,
				source,
				type,
				uniqueid: it.uniqueId ? it.uniqueId : bcI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const cb = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				cb.source,
				cb.__prop
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row">
			<a href="#${hash}">
				<span class="col-3 text-center pl-0">${cultBoonTypeToFull(it.__prop)}</span>
				<span class="bold col-9 pr-0">${it.name}</span>
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
		const it = this._dataList[id];

		$("#pagecontent").empty().append(RenderCultsBoons.$getRenderedCultBoon(it));

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const cultsBoonsPage = new CultsBoonsPage();
window.addEventListener("load", () => cultsBoonsPage.pOnLoad());
