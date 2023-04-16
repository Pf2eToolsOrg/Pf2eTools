"use strict";

class RelicGiftsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterRelicGifts();

		super({
			dataSource: "data/relicgifts.json",
			pageFilter,
			listClass: "relicgifts",
			sublistClass: "subrelicgifts",
			dataProps: ["relicGift"],
		});
	}

	getListItem (it, cdI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const aspects = it.aspects.map(aspect => typeof aspect === "string" ? aspect : aspect.name).join(", ");

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-5-4 pl-0">${it.name}${it.add_hash ? `<span class="ve-muted"> (${it.add_hash})</span>` : ""}</span>
			<span class="col-3 text-center capitalise">${aspects}</span>
			<span class="col-1-6 text-center capitalise">${it.tier}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			cdI,
			eleLi,
			it.name,
			{
				hash,
				source,
				aspects,
				tier: it.tier,
				aliases: it.alias ? it.alias.join(" - ") : "",
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
		const aspects = it.aspects.join(", ");

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-7 pr-0">${it.name}${it.add_hash ? `<span class="ve-muted"> (${it.add_hash})</span>` : ""}</span>
				<span class="col-3-5 text-center capitalise">${it.aspects.map(aspect => typeof aspect === "string" ? aspect : aspect.name).join(", ")}</span>
				<span class="col-1-5 text-center capitalise">${it.tier}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				aspects,
				tier: it.tier,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];

		function buildStatsTab () {
			$content.append(Renderer.relicGift.getRenderedString(it));
		}
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules("relicGift");
			$content.append(quickRules);
			if (it.miscTags.includes("soulSeed")) {
				const quickRulesExtra = await Renderer.utils.pGetQuickRules("soulSeed");
				$content.append(quickRulesExtra);
			}
		}

		const statTab = Renderer.utils.tabButton(
			"Relic Gift",
			() => {},
			buildStatsTab,
		);
		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		Renderer.utils.bindTabButtons(statTab, infoTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const relicGiftsPage = new RelicGiftsPage();
window.addEventListener("load", () => relicGiftsPage.pOnLoad());
