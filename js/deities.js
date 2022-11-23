"use strict";

class DeitiesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterDeities();
		super({
			dataSource: DataUtil.deity.loadJSON,

			pageFilter,

			listClass: "deities",

			sublistClass: "subdeities",

			dataProps: ["deity"],
		});
	}

	getListItem (g, dtI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(g, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(g.source);
		const hash = UrlUtil.autoEncodeHash(g);
		const alignment = g.alignment?.alignment ? g.alignment.alignment.map(x => x.length > 2 ? x : x.toUpperCase()).join("") : "\u2014";
		const domains = g._fDomains ? g._fDomains.join(", ") : "\u2014";

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-3 pl-0">${g.name}</span>
			<span class="col-2 text-center">${g.category}</span>
			<span class="col-2 text-center">${alignment}</span>
			<span class="col-3 ${!g._fDomains || g._fDomains[0] === VeCt.STR_NONE ? `list-entry-none` : ""}">${domains}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(g.source)}" title="${Parser.sourceJsonToFull(g.source)}" ${BrewUtil.sourceJsonToStyle(g.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			dtI,
			eleLi,
			g.name,
			{
				hash,
				source,
				title: g.title || "",
				category: g.category,
				alignment,
				domains,
			},
			{
				uniqueId: g.uniqueId ? g.uniqueId : dtI,
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

	getSublistItem (g, pinId) {
		const hash = UrlUtil.autoEncodeHash(g);

		const alignment = g.alignment?.alignment ? g.alignment.alignment.join("") : "\u2014";

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-5-2 pl-0">${g.name}</span>
				<span class="col-3-4 text-center">${g.category}</span>
				<span class="col-3-4 text-center pr-0">${alignment}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			g.name,
			{
				hash,
				category: g.category,
				alignment,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const deity = this._dataList[id];
		renderStatblock(deity);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}

	_getSearchCache (entity) {
		const ptrOut = {_: ""};
		Object.keys(entity).filter(it => !it.startsWith("_")).forEach(it => this._getSearchCache_handleEntryProp(entity, it, ptrOut));
		return ptrOut._;
	}
}

function renderStatblock (deity) {
	const $content = $("#pagecontent").empty()

	function buildStatsTab () {
		$content.append(Renderer.deity.getRenderedString(deity));
	}
	function buildIntercessionTab () {
		$content.append(Renderer.deity.getIntercession(deity))
	}
	async function buildFluffTab () {
		const pGetFluff = async () => {
			const fluff = await Renderer.pGetFluff(deity);
			return fluff ? fluff.entries || [] : [];
		}
		$content.append(Renderer.getRenderedLore({lore: await pGetFluff()}))
	}
	const buildInfoTab = async () => {
		if (deity.category === "Philosophy") {
			const quickRules = await Renderer.utils.pGetQuickRules("deityPhilosophy");
			$content.append(quickRules);
		} else {
			const quickRules = await Renderer.utils.pGetQuickRules("deity");
			$content.append(quickRules);
			if (deity.category === "Pantheon") {
				const quickRulesExtra = await Renderer.utils.pGetQuickRules("deityPantheon");
				$content.append(quickRulesExtra);
			}
			if (deity.intercession) {
				const quickRulesExtra = await Renderer.utils.pGetQuickRules("deityIntercession");
				$content.append(quickRulesExtra);
			}
		}
	}
	const buildImageTab = async () => {
		$content.append(Renderer.getImage(deity))
	}
	const statTab = Renderer.utils.tabButton(
		"Deity",
		() => {},
		buildStatsTab,
	);
	const intercessionTab = Renderer.utils.tabButton(
		"Intercession",
		() => {},
		buildIntercessionTab,
	);
	const loreTab = Renderer.utils.tabButton(
		"Lore",
		() => {},
		buildFluffTab,
	);
	const infoTab = Renderer.utils.tabButton(
		"Quick Rules",
		() => {},
		buildInfoTab,
	);
	const imageTab = Renderer.utils.tabButton(
		"Images",
		() => {},
		buildImageTab,
	);
	const tabs = [statTab];
	if (deity.intercession) tabs.push(intercessionTab);
	if (deity.hasLore) tabs.push(loreTab);
	if (deity.images) tabs.push(imageTab);
	tabs.push(infoTab);
	Renderer.utils.bindTabButtons(...tabs);
}

let deitiesPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	deitiesPage = new DeitiesPage();
	deitiesPage.pOnLoad()
});
