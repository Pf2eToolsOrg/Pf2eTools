"use strict";

class FeatsPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterFeats();
		super({
			dataSource: "data/feats/feats-crb.json",

			pageFilter,

			listClass: "feats",

			sublistClass: "subfeats",

			dataProps: ["feat"],
		});
	}

	getListItem (feat, ftI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(feat, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(feat.source);
		const hash = UrlUtil.autoEncodeHash(feat);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-3-8 pl-0">${feat.name}${feat.add_hash ? `<span class="ve-muted"> (${feat.add_hash})</span>` : ""}</span>
			<span class="col-1-5 text-center">${feat._slType}</span>
			<span class="col-1-3 text-center">${Parser.getOrdinalForm(feat.level)}</span>
			<span class="col-4-1">${feat._slPrereq}</span>
			<span class="source col-1-3 text-center ${Parser.sourceJsonToColor(feat.source)} pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${BrewUtil.sourceJsonToStyle(feat.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ftI,
			eleLi,
			feat.name,
			{
				hash,
				source,
				level: feat.level,
				type: feat._slType,
				prerequisites: feat._slPrereq,
			},
			{
				uniqueId: feat.uniqueId ? feat.uniqueId : ftI,
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

	getSublistItem (feat, pinId) {
		const hash = UrlUtil.autoEncodeHash(feat);
		const source = Parser.sourceJsonToAbv(feat.source);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-3-8 pl-0">${feat.name}${feat.add_hash ? `<span class="ve-muted"> (${feat.add_hash})</span>` : ""}</span>
				<span class="col-1-5 text-center">${feat._slType}</span>
				<span class="col-1-3 text-center">${Parser.getOrdinalForm(feat.level)}</span>
				<span class="col-4-1">${feat._slPrereq}</span>
				<span class="source col-1-3 text-center ${Parser.sourceJsonToColor(feat.source)} pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${BrewUtil.sourceJsonToStyle(feat.source)}>${source}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			feat.name,
			{
				hash,
				source,
				level: feat.level,
				type: feat._slType,
				prerequisites: feat._slPrereq,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const feat = this._dataList[id];
		const $pgContent = $("#pagecontent").empty();
		const buildStatsTab = () => {
			$pgContent.append(RenderFeats.$getRenderedFeat(feat));
		};
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules("feat");
			$pgContent.append(quickRules);
		}
		const statsTab = Renderer.utils.tabButton(
			"Feat",
			() => {},
			buildStatsTab,
		);
		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		Renderer.utils.bindTabButtons(statsTab, infoTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

let featsPage;
window.addEventListener("load", async () => {
	await Renderer.trait.buildCategoryLookup();
	featsPage = new FeatsPage()
	featsPage.pOnLoad()
});
