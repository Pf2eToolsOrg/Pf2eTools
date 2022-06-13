"use strict";
class OptionalFeaturesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterOptionalFeatures();

		super({
			dataSource: "data/optionalfeatures.json",
			pageFilter,
			listClass: "optionalfeatures",
			sublistClass: "suboptionalfeatures",
			dataProps: ["optionalfeature"],
		});
	}

	getListItem (it, ivI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-6 pl-0">${it.name}</span>
			<span class="col-3 text-center">${it.type}</span>
			<span class="col-3 ${Parser.sourceJsonToColor(it.source)} text-center pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ivI,
			eleLi,
			it.name,
			{
				hash,
				source,
				type: it.type,
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : ivI,
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

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-6 pl-0">${it.name}</span>
				<span class="col-6 text-center">${it.type}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it.type,
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];
		const $pgContent = $("#pagecontent").empty();
		const buildStatsTab = () => {
			$pgContent.append(Renderer.optionalFeature.getRenderedString(it));

			const $wrpTab = $(`#stat-tabs`);
			$wrpTab.find(`.opt-feature-type`).remove();
			const $wrpOptFeatType = $(`<div class="opt-feature-type"/>`).prependTo($wrpTab);
			$(`<span class="roller">${it.type}</span>`)
				.click(() => {
					this._filterBox.setFromValues({"Feature Type": {[it.type]: 1}});
					this.handleFilterChange();
				}).appendTo($wrpOptFeatType);
		};
		const statsTab = Renderer.utils.tabButton(
			"data",
			() => {},
			buildStatsTab,
		);
		Renderer.utils.bindTabButtons(statsTab);
		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

const optionalFeaturesPage = new OptionalFeaturesPage();
window.addEventListener("load", () => optionalFeaturesPage.pOnLoad());
