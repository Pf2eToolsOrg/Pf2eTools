"use strict";

class OrganizationsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterOrganizations();
		super({
			dataSource: "data/organizations.json",

			pageFilter,

			listClass: "organizations",

			sublistClass: "suborganizations",

			dataProps: ["organization"],
		});
	}

	getListItem (g, dtI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(g, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(g.source);
		const hash = UrlUtil.autoEncodeHash(g);

		const alignment = g.followerAlignment.map(it => it.main).join(", ") || "\u2014";
		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-7 pl-0">${g.name}</span>
			<span class="col-3 text-center">${alignment}</span>
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
		const alignment = g.followerAlignment.map(it => it.main).join(", ") || "\u2014";
		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-9 pl-0">${g.name}</span>
				<span class="col-3 text-center">${alignment}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			g.name,
			{
				hash,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const organization = this._dataList[id];
		renderStatblock(organization);
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

function renderStatblock (organization) {
	const $content = $("#pagecontent").empty()

	function buildStatsTab () {
		$content.append(Renderer.organization.getRenderedString(organization));
	}
	async function buildLoreTab () {
		const pGetFluff = async () => {
			const fluff = await Renderer.organization.pGetFluff(organization);
			return fluff ? fluff.entries || [] : [];
		}
		$content.append(Renderer.organization.getRenderedLore({lore: await pGetFluff()}))
	}
	const buildInfoTab = async () => {
		const quickRules = await Renderer.utils.pGetQuickRules("organization");
		$content.append(quickRules);
	}
	const buildImageTab = async () => {
		$content.append(Renderer.organization.getImage(organization))
	}
	const statTab = Renderer.utils.tabButton(
		"Organization",
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
	if (organization.hasLore) tabs.push(loreTab);
	if (organization.images) tabs.push(imageTab);
	tabs.push(infoTab)
	Renderer.utils.bindTabButtons(...tabs);
}

let organizationsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	organizationsPage = new OrganizationsPage();
	organizationsPage.pOnLoad()
});
