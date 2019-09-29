"use strict";

const STR_REPRINTED = "reprinted";

function unpackAlignment (g) {
	g.alignment.sort(SortUtil.alignmentSort);
	if (g.alignment.length === 2 && g.alignment.includes("N")) {
		const out = [...g.alignment];
		if (out[0] === "N") out[0] = "NX";
		else out[1] = "NY";
		return out;
	}
	return MiscUtil.copy(g.alignment);
}

class DeitiesPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const pantheonFilter = new Filter({
			header: "Pantheon",
			items: [
				"Celtic",
				"Dawn War",
				"Dragonlance",
				"Drow",
				"Dwarven",
				"Eberron",
				"Egyptian",
				"Elven",
				"Faerûnian",
				"Forgotten Realms",
				"Gnomish",
				"Greek",
				"Greyhawk",
				"Halfling",
				"Nonhuman",
				"Norse",
				"Orc"
			]
		});
		const categoryFilter = new Filter({
			header: "Category",
			items: [
				STR_NONE,
				"Other Faiths of Eberron",
				"The Dark Six",
				"The Gods of Evil",
				"The Gods of Good",
				"The Gods of Neutrality",
				"The Sovereign Host"
			],
			itemSortFn: null
		});
		const alignmentFilter = new Filter({
			header: "Alignment",
			items: ["L", "NX", "C", "G", "NY", "E", "N"],
			displayFn: Parser.alignmentAbvToFull,
			itemSortFn: null
		});
		const domainFilter = new Filter({
			header: "Domain",
			items: ["Arcana", "Death", "Forge", "Grave", "Knowledge", "Life", "Light", "Nature", STR_NONE, "Order", "Tempest", "Trickery", "War"]
		});
		const miscFilter = new Filter({
			header: "Miscellaneous",
			items: [STR_REPRINTED],
			displayFn: StrUtil.uppercaseFirst,
			deselFn: (it) => { return it === STR_REPRINTED }
		});

		super({
			dataSource: DataUtil.deity.loadJSON,

			filters: [
				sourceFilter,
				alignmentFilter,
				pantheonFilter,
				categoryFilter,
				domainFilter,
				miscFilter
			],
			filterSource: sourceFilter,

			listClass: "deities",

			sublistClass: "subdeities",

			dataProps: ["deity"]
		});

		this._sourceFilter = sourceFilter;
		this._pantheonFilter = pantheonFilter;
		this._categoryFilter = categoryFilter;
	}

	getListItem (g, dtI) {
		g._fAlign = unpackAlignment(g);
		if (!g.category) g.category = STR_NONE;
		if (!g.domains) g.domains = [STR_NONE];
		g.domains.sort(SortUtil.ascSort);

		g._fReprinted = g.reprinted ? STR_REPRINTED : "";

		this._sourceFilter.addItem(g.source);
		this._pantheonFilter.addItem(g.pantheon);
		this._categoryFilter.addItem(g.category);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(g.source);
		const hash = UrlUtil.autoEncodeHash(g);
		const alignment = g.alignment.join("");
		const domains = g.domains.join(", ");

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="bold col-3 pl-0">${g.name}</span>
			<span class="col-2 text-center">${g.pantheon}</span>
			<span class="col-2 text-center">${alignment}</span>
			<span class="col-3 ${g.domains[0] === STR_NONE ? `list-entry-none` : ""}">${domains}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(g.source)} pr-0" title="${Parser.sourceJsonToFull(g.source)}" ${BrewUtil.sourceJsonToStyle(g.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			dtI,
			eleLi,
			g.name,
			{
				hash,
				source,
				pantheon: g.pantheon,
				alignment,
				domains,
				uniqueid: g.uniqueId ? g.uniqueId : dtI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const g = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				g.source,
				g._fAlign,
				g.pantheon,
				g.category,
				g.domains,
				g._fReprinted
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (g, pinId) {
		const hash = UrlUtil.autoEncodeHash(g);

		const alignment = g.alignment.join("");
		const domains = g.domains.join(", ");

		const $ele = $(`<li class="row">
			<a href="#${hash}">
				<span class="bold col-4 pl-0">${g.name}</span>
				<span class="col-2">${g.pantheon}</span>
				<span class="col-2">${alignment}</span>
				<span class="col-4 ${g.domains[0] === STR_NONE ? `list-entry-none` : ""} pr-0">${domains}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			g.name,
			{
				hash,
				pantheon: g.pantheon,
				alignment,
				domains
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const deity = this._dataList[id];

		$(`#pagecontent`).empty().append(RenderDeities.$getRenderedDeity(deity));

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const deitiesPage = new DeitiesPage();
window.addEventListener("load", () => deitiesPage.pOnLoad());
