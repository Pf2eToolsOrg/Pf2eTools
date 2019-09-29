"use strict";

class RewardsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const typeFilter = new Filter({
			header: "Type",
			items: [
				"Blessing",
				"Boon",
				"Charm"
			]
		});

		super({
			dataSource: "data/rewards.json",

			filters: [
				sourceFilter,
				typeFilter
			],
			filterSource: sourceFilter,

			listClass: "rewards",

			sublistClass: "subrewards",

			dataProps: ["reward"]
		});

		this._sourceFilter = sourceFilter;
		this._typeFilter = typeFilter;
	}

	getListItem (reward, rwI) {
		// populate filters
		this._sourceFilter.addItem(reward.source);
		this._typeFilter.addItem(reward.type);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(reward.source);
		const hash = UrlUtil.autoEncodeHash(reward);

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="name col-10 pl-0">${reward.name}</span>
			<span class="source col-2 text-center ${Parser.sourceJsonToColor(reward.source)} pr-0" title="${Parser.sourceJsonToFull(reward.source)}" ${BrewUtil.sourceJsonToStyle(reward.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			rwI,
			eleLi,
			reward.name,
			{
				hash,
				source,
				uniqueid: reward.uniqueId ? reward.uniqueId : rwI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const r = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				r.source,
				r.type
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (reward, pinId) {
		const hash = UrlUtil.autoEncodeHash(reward);

		const $ele = $(`<li class="row"><a href="#${hash}"><span class="name col-12 px-0">${reward.name}</span></a></li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			reward.name,
			{
				hash
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const reward = this._dataList[id];

		$("#pagecontent").empty().append(RenderRewards.$getRenderedReward(reward));

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const rewardsPage = new RewardsPage();
window.addEventListener("load", () => rewardsPage.pOnLoad());
