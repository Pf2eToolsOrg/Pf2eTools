"use strict";

let psionicsBookView;

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

			listValueNames: ["name", "source", "type", "order", "mode-list", "uniqueid"],
			listClass: "psionics",

			sublistValueNames: ["name", "type", "order", "id"],
			sublistClass: "subpsionics",

			dataProps: ["psionic"],

			bookViewOptions: {
				$btnOpen: $(`#btn-psibook`),
				noneVisibleMsg: "If you wish to view multiple psionics, please first make a list",
				popTblGetNumShown: ($tbl) => {
					const toShow = ListUtil.getSublistedIds().map(id => this._dataList[id]);

					const stack = [];
					const renderSpell = (p) => {
						stack.push(`<table class="spellbook-entry"><tbody>`);
						stack.push(Renderer.psionic.getCompactRenderedString(p));
						stack.push(`</tbody></table>`);
					};

					const renderType = (type) => {
						const toRender = toShow.filter(p => p.type === type);
						if (toRender.length) {
							stack.push(Renderer.utils.getBorderTr(`<span class="spacer-name">${Parser.psiTypeToFull(type)}</span>`));

							stack.push(`<tr class="spellbook-level"><td>`);
							toRender.forEach(p => renderSpell(p));
							stack.push(`</td></tr>`);
						}
					};

					renderType("T");
					renderType("D");

					if (!toShow.length && History.lastLoadedId != null) {
						stack.push(`<tr class="spellbook-level"><td>`);
						renderSpell(this._dataList[History.lastLoadedId]);
						stack.push(`</td></tr>`);
					}

					$tbl.append(stack.join(""));
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

		return `
			<li class="row" ${FLTR_ID}="${psI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${psI}" href="#${UrlUtil.autoEncodeHash(p)}" title="${p.name}">
					<span class="name col-6">${p.name}</span>
					<span class="type col-2">${Parser.psiTypeToFull(p.type)}</span>
					<span class="order col-2 ${p._fOrder === STR_NONE ? "list-entry-none" : ""}">${p._fOrder}</span>
					<span class="source col-2 text-center" title="${Parser.sourceJsonToFull(p.source)}" ${BrewUtil.sourceJsonToStyle(p.source)}>${Parser.sourceJsonToAbv(p.source)}</span>
					
					<span class="mode-list hidden">${getHiddenModeList(p)}</span>
					<span class="uniqueid hidden">${p.uniqueId ? p.uniqueId : psI}</span>
				</a>
			</li>
		`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const p = this._dataList[$(item.elm).attr(FLTR_ID)];
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
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(p)}" title="${p.name}">
					<span class="name col-6 pl-0">${p.name}</span>
					<span class="type col-3">${Parser.psiTypeToFull(p.type)}</span>
					<span class="order col-3 ${p._fOrder === STR_NONE ? "list-entry-none" : ""} pr-0">${p._fOrder}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);
		const $content = $(`#pagecontent`).empty();

		const psi = this._dataList[id];

		$content.append(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(psi)}
			<tr>
				<td colspan="6"><i>${psi.type === "T" ? Parser.psiTypeToFull(psi.type) : `${psi._fOrder} ${Parser.psiTypeToFull(psi.type)}`}</i><span id="order"></span> <span id="type"></span></td>
			</tr>
			<tr><td class="divider" colspan="6"><div></div></td></tr>
			<tr class="text"><td colspan="6" id="text">${psi.type === "T" ? Renderer.psionic.getTalentText(psi, this._renderer) : Renderer.psionic.getDisciplineText(psi, this._renderer)}</td></tr>
			${Renderer.utils.getPageTr(psi)}
			${Renderer.utils.getBorderTr()}
		`);

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
