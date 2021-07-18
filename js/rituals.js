"use strict";

class RitualsPage extends ListPage {
	static getTblTimeStr (time) {
		return time.unit === `Varies` ? `Varies` : Parser.TIME_ACTIONS.includes(time.unit) ? `${Parser.TIME_TO_FULL[time.unit].uppercaseFirst()}`
			: `${time.number} ${time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
	}

	constructor () {
		const pageFilter = new PageFilterRituals();
		super({
			dataSource: DataUtil.ritual.loadJSON,
			pageFilter,
			listClass: "rituals",
			sublistClass: "subrituals",
			dataProps: ["ritual"],
		});
	}

	getListItem (it, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const time = RitualsPage.getTblTimeStr(it.cast);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-6 bold pl-0">${it.name}</span>
			<span class="col-1-5 text-center">${Parser.getOrdinalForm(it.level)}</span>
			<span class="col-3 text-center">${time}</span>
			<span class="col-1-5 text-center ${Parser.sourceJsonToColor(it.source)} pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			it.name,
			{
				hash,
				source,
				level: it.level,
				time: it._normalisedTime,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : anI,
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

		const time = RitualsPage.getTblTimeStr(it.cast);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-6 pl-0">${it.name}</span>
				<span class="col-2 text-center">${Parser.getOrdinalForm(it.level)}</span>
				<span class="col-4 text-center pr-0">${time}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				level: it.level,
				time: it._normalisedTime,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];
		renderStatblock(it);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

function renderStatblock (ritual) {
	const $content = $("#pagecontent").empty()

	function buildStatsTab () {
		$content.append(RenderRituals.$getRenderedRitual(ritual));
	}
	const buildInfoTab = async () => {
		const quickRules = await Renderer.utils.pGetQuickRules("ritual");
		$content.append(quickRules);
	}
	const statTab = Renderer.utils.tabButton(
		"Ritual",
		() => {},
		buildStatsTab,
	);
	const infoTab = Renderer.utils.tabButton(
		"Quick Rules",
		() => {},
		buildInfoTab,
	);
	Renderer.utils.bindTabButtons(statTab, infoTab);
}

let ritualsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	ritualsPage = new RitualsPage();
	ritualsPage.pOnLoad();
});
