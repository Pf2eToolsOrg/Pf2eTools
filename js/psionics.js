"use strict";

function getHiddenModeList (psionic) {
	const modeList = psionic.modes;
	if (modeList === undefined) return "";
	const outArray = [];
	for (let i = 0; i < modeList.length; ++i) {
		outArray.push(`"${modeList[i].name}"`);
		if (modeList[i].submodes != null) {
			const subModes = modeList[i].submodes;
			for (let j = 0; j < subModes.length; ++j) {
				outArray.push(`"${subModes[j].name}"`)
			}
		}
	}
	return outArray.join(",");
}

class PsionicsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter({
			deselFn: () => false
		});
		const typeFilter = new Filter({header: "Type", items: [Parser.PSI_ABV_TYPE_TALENT, Parser.PSI_ABV_TYPE_DISCIPLINE], displayFn: Parser.psiTypeToFull});
		const orderFilter = new Filter({
			header: "Order",
			items: ["Avatar", "Awakened", "Immortal", "Nomad", "Wu Jen", Parser.PSI_ORDER_NONE]
		});

		super({
			dataSource: "data/psionics.json",

			filters: [
				sourceFilter,
				typeFilter,
				orderFilter
			],
			filterSource: sourceFilter,

			listClass: "psionics",

			sublistClass: "subpsionics",

			dataProps: ["psionic"],

			bookViewOptions: {
				$btnOpen: $(`#btn-psibook`),
				noneVisibleMsg: "If you wish to view multiple psionics, please first make a list",
				pageTitle: "Psionics Book View",
				popTblGetNumShown: $wrpContent => {
					const toShow = ListUtil.getSublistedIds().map(id => this._dataList[id]);

					const stack = [];
					const renderPsionic = (p) => {
						stack.push(`<div class="bkmv__wrp-item"><table class="stats stats--book stats--bkmv"><tbody>`);
						stack.push(Renderer.psionic.getCompactRenderedString(p));
						stack.push(`</tbody></table></div>`);
					};

					const renderType = (type) => {
						const toRender = toShow.filter(p => p.type === type);
						if (toRender.length) {
							toRender.forEach(p => renderPsionic(p));
						}
					};

					renderType("T");
					renderType("D");

					if (!toShow.length && Hist.lastLoadedId != null) {
						renderPsionic(this._dataList[Hist.lastLoadedId]);
					}

					if (!toShow.length && Hist.lastLoadedId != null) {
						stack.push(`<tr class="spellbook-level"><td>`);
						renderPsionic(this._dataList[Hist.lastLoadedId]);
						stack.push(`</td></tr>`);
					}

					$wrpContent.append(stack.join(""));
					return toShow.length;
				}
			},

			tableViewOptions: {
				title: "Psionics",
				colTransforms: {
					name: {name: "Name", transform: true},
					source: {name: "Source", transform: (it) => `<span class="${Parser.sourceJsonToColor(it)}" title="${Parser.sourceJsonToFull(it)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it)}</span>`},
					_text: {name: "Text", transform: (it) => it.type === "T" ? Renderer.psionic.getTalentText(it, Renderer.get()) : Renderer.psionic.getDisciplineText(it, Renderer.get()), flex: 3}
				},
				filter: {generator: ListUtil.basicFilterGenerator},
				sorter: (a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source)
			}
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (p, psI) {
		p._fOrder = Parser.psiOrderToFull(p.order);

		// populate filters
		this._sourceFilter.addItem(p.source);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(p.source);
		const hash = UrlUtil.autoEncodeHash(p);
		const type = Parser.psiTypeToFull(p.type);

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="bold col-6">${p.name}</span>
			<span class="col-2">${type}</span>
			<span class="col-2 ${p._fOrder === STR_NONE ? "list-entry-none" : ""}">${p._fOrder}</span>
			<span class="col-2 text-center" title="${Parser.sourceJsonToFull(p.source)}" ${BrewUtil.sourceJsonToStyle(p.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			psI,
			eleLi,
			p.name,
			{
				hash,
				source,
				type,
				order: p._fOrder,
				uniqueid: p.uniqueId ? p.uniqueId : psI,
				searchModeList: getHiddenModeList(p)
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const p = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				p.source,
				p.type,
				p._fOrder
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (p, pinId) {
		const hash = UrlUtil.autoEncodeHash(p);
		const type = Parser.psiTypeToFull(p.type);

		const $ele = $(`<li class="row">
			<a href="#${hash}">
				<span class="bold col-6 pl-0">${p.name}</span>
				<span class="col-3">${type}</span>
				<span class="col-3 ${p._fOrder === STR_NONE ? "list-entry-none" : ""} pr-0">${p._fOrder}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			p.name,
			{
				hash,
				type,
				order: p._fOrder
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const psi = this._dataList[id];

		$(`#pagecontent`).empty().append(RenderPsionics.$getRenderedPsionic(psi));

		loadSubHash([]);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);

		this._bookView.handleSub(sub);
	}
}

const psionicsPage = new PsionicsPage();
window.addEventListener("load", () => psionicsPage.pOnLoad());
