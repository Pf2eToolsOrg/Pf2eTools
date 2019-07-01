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

			listValueNames: ["name", "pantheon", "alignment", "domains", "symbol", "source", "uniqueid"],
			listClass: "deities",

			sublistValueNames: ["name", "pantheon", "alignment", "domains", "id"],
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

		return `
			<li class="row" ${FLTR_ID}="${dtI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${dtI}" href="#${UrlUtil.autoEncodeHash(g)}" title="${g.name}">
					<span class="name col-3 pl-0">${g.name}</span>
					<span class="pantheon col-2 text-center">${g.pantheon}</span>
					<span class="alignment col-2 text-center">${g.alignment.join("")}</span>
					<span class="domains col-3 ${g.domains[0] === STR_NONE ? `list-entry-none` : ""}">${g.domains.join(", ")}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(g.source)} pr-0" title="${Parser.sourceJsonToFull(g.source)}" ${BrewUtil.sourceJsonToStyle(g.source)}>${Parser.sourceJsonToAbv(g.source)}</span>
					
					<span class="uniqueid hidden">${g.uniqueId ? g.uniqueId : dtI}</span>
				</a>
			</li>
		`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const g = this._dataList[$(item.elm).attr(FLTR_ID)];
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
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(g)}" title="${g.name}">
					<span class="name col-4 pl-0">${g.name}</span>
					<span class="pantheon col-2">${g.pantheon}</span>
					<span class="alignment col-2">${g.alignment.join("")}</span>
					<span class="domains col-4 ${g.domains[0] === STR_NONE ? `list-entry-none` : ""} pr-0">${g.domains.join(", ")}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);
		const deity = this._dataList[id];

		const getDeityBody = (deity, reprintIndex) => {
			const renderStack = [];
			if (deity.entries) this._renderer.recursiveRender({entries: deity.entries}, renderStack);
			return `
			${reprintIndex ? `
				<tr><td colspan="6">
				<i class="text-muted">
				${reprintIndex === 1 ? `This deity is a reprint.` : ""} The version below was printed in an older publication (${Parser.sourceJsonToFull(deity.source)}${deity.page > 0 ? `, page ${deity.page}` : ""}).
				</i>
				</td></tr>
			` : ""}
	
			${Renderer.deity.getOrderedParts(deity, `<tr><td colspan="6">`, `</td></tr>`)}
			
			${deity.symbolImg ? `<tr><td colspan="6">${this._renderer.render({entries: [deity.symbolImg]})}</td></tr>` : ""}
			${renderStack.length ? `<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>` : ""}
			`;
		};

		const $content = $(`#pagecontent`).empty();
		$content.append(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(deity, {suffix: deity.title ? `, ${deity.title.toTitleCase()}` : ""})}
			${getDeityBody(deity)}
			${deity.reprinted ? `<tr class="text"><td colspan="6"><i class="text-muted">Note: this deity has been reprinted in a newer publication.</i></td></tr>` : ""}
			${Renderer.utils.getPageTr(deity)}
			${deity.previousVersions ? `
			${Renderer.utils.getDividerTr()}
			${deity.previousVersions.map((d, i) => getDeityBody(d, i + 1)).join(Renderer.utils.getDividerTr())}
			` : ""}
			${Renderer.utils.getBorderTr()}
		`);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const deitiesPage = new DeitiesPage();
window.addEventListener("load", () => deitiesPage.pOnLoad());
