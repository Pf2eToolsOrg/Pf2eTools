"use strict";
class CreatureTemplatePage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterCreatureTemplates();

		super({
			dataSource: "data/creaturetemplates.json",

			pageFilter,

			listClass: "creaturetemplates",

			sublistClass: "subcreaturetemplates",

			dataProps: ["creatureTemplate"],
		});
	}

	getListItem (g, dtI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(g, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(g.source);
		const hash = UrlUtil.autoEncodeHash(g);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-6 pl-0">${g.name}</span>
			<span class="text-center col-4">${g.type || "\u2014"}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(g.source)}" title="${Parser.sourceJsonToFull(g.source)}" ${BrewUtil.sourceJsonToStyle(g.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			dtI,
			eleLi,
			g.name,
			{
				type: g.type || "\u2014",
				hash,
				source,
				title: g.title || "",
				aliases: g.alias ? g.alias.join(" - ") : "",
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
		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-12 pl-0">${g.name}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			g.name,
			{
				type: g.type || "\u2014",
				hash,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const creatureTemplate = this._dataList[id];
		renderStatblock(creatureTemplate);
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

function renderStatblock (creatureTemplate) {
	const $content = $("#pagecontent").empty()

	function buildStatsTab () {
		$content.append(Renderer.creatureTemplate.getRenderedString(creatureTemplate));
	}
	async function buildLoreTab () {
		const pGetFluff = async () => {
			const fluff = await Renderer.creatureTemplate.pGetFluff(creatureTemplate);
			return fluff ? fluff.entries || [] : [];
		}
		$content.append(Renderer.creatureTemplate.getRenderedLore({lore: await pGetFluff()}))
	}
	const buildInfoTab = async () => {
		const quickRules = await Renderer.utils.pGetQuickRules("creatureTemplate");
		$content.append(quickRules);
	}
	const buildImageTab = async () => {
		$content.append(Renderer.creatureTemplate.getImage(creatureTemplate))
	}
	const statTab = Renderer.utils.tabButton(
		"Template",
		() => {},
		buildStatsTab,
	);
	const loreTab = Renderer.utils.tabButton(
		"Lore",
		() => {},
		buildLoreTab,
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
	const tabs = [statTab]
	// Kill Fluff for Paizo
	// if (creatureTemplate.hasLore) tabs.push(loreTab);
	if (creatureTemplate.images) tabs.push(imageTab);
	tabs.push(infoTab)
	Renderer.utils.bindTabButtons(...tabs);
}

let creatureTemplatePage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	creatureTemplatePage = new CreatureTemplatePage();
	creatureTemplatePage.pOnLoad()
});
