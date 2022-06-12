"use strict";

class TraitsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterTraits();
		super({
			dataSource: DataUtil.trait.loadJSON,

			pageFilter,

			listClass: "traits",

			sublistClass: "subtraits",

			dataProps: ["trait"],
		});
		this._traitIndex = null;
	}

	getListItem (it, vhI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${UrlUtil.autoEncodeHash(it)}" class="lst--border">
			<span class="bold col-10 pl-0">${it.name}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			vhI,
			eleLi,
			it.name,
			{
				hash,
				source,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : vhI,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, this._dataList[item.ix]));
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row"><a href="#${hash}" class="lst--border"><span class="name col-12 px-0">${it.name}</span></a></li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
			},
		);
		return listItem;
	}

	async pOnLoad () {
		this._traitIndex = TraitIndexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/traits.json`));
		await super.pOnLoad();
	}

	doLoadHash (id) {
		const $content = $(`#pagecontent`).empty();
		const trt = this._dataList[id];
		const trtIndex = (this._traitIndex || {})[trt.name.toLowerCase()];

		function buildStatsTab () {
			$content.append(Renderer.trait.getRenderedString(trt));
		}
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules("trait");
			$content.append(quickRules);
		}
		function buildUsesTab () {
			const renderer = Renderer.get().setFirstSection(true);
			$content.append(renderer.render({type: "pf2-h3", name: trt.name, entries: ["This trait is used in the following statblocks."]}));

			Object.entries(trtIndex).forEach(([catStr, objects]) => {
				const cat = Number(catStr);
				const catName = Parser.CAT_ID_TO_FULL[cat];
				// FIXME: This doesnt work in many cases. Perhaps index it as well.
				const catHref = `${UrlUtil.CAT_TO_PAGE[cat]}#${objects[0].u},${trt.categories.map(c => `flst${c}:${trt.name}=1`).join(",")}`;
				const $wrapper = $(`<div><a href="${catHref}">${renderer.render({type: "pf2-h4", name: `${catName} (${objects.length})`})}</a></div>`);
				$wrapper.append(objects.sort((a, b) => SortUtil.ascSortProp("n", a, b)).map(obj => {
					const hoverStr = `onmouseover="Renderer.hover.pHandleLinkMouseOver(event, this, '${UrlUtil.categoryToHoverPage(cat)}', '${obj.s}', '${obj.u.replace(/'/g, "\\'")}')" onmouseleave="Renderer.hover.handleLinkMouseLeave(event, this)" onmousemove="Renderer.hover.handleLinkMouseMove(event, this)" ${Renderer.hover.getPreventTouchString()}`;
					const href = `${Renderer.get().baseUrl}${UrlUtil.categoryToPage(cat)}#${obj.u}`;
					return `<a href="${href}" ${hoverStr}>${obj.n}</a>`;
				}).join(", "));
				$wrapper.appendTo($content);
			});
		}
		const statTab = Renderer.utils.tabButton(
			"Trait",
			() => {},
			buildStatsTab,
		);
		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		const usesTab = Renderer.utils.tabButton(
			"References",
			() => {},
			buildUsesTab,
		)
		const tabs = [statTab, infoTab];
		if (trtIndex) tabs.push(usesTab);
		Renderer.utils.bindTabButtons(...tabs);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

let traitsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	traitsPage = new TraitsPage();
	traitsPage.pOnLoad()
});
