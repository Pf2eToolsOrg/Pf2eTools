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

			listValueNames: ["name", "source", "uniqueid"],
			listClass: "rewards",

			sublistValueNames: ["name", "id"],
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

		return `
		<li class="row" ${FLTR_ID}="${rwI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
			<a id="${rwI}" href="#${UrlUtil.autoEncodeHash(reward)}" title="${reward.name}">
				<span class="name col-10 pl-0">${reward.name}</span>
				<span class="source col-2 text-center ${Parser.sourceJsonToColor(reward.source)} pr-0" title="${Parser.sourceJsonToFull(reward.source)}" ${BrewUtil.sourceJsonToStyle(reward.source)}>${Parser.sourceJsonToAbv(reward.source)}</span>
				
				<span class="uniqueid hidden">${reward.uniqueId ? reward.uniqueId : rwI}</span>
			</a>
		</li>`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const r = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				r.source,
				r.type
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (reward, pinId) {
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(reward)}" title="${reward.name}">
					<span class="name col-12 px-0">${reward.name}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		Renderer.get().setFirstSection(true);
		const $content = $("#pagecontent").empty();
		const reward = this._dataList[id];

		$content.append(`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(reward)}
		<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
		${Renderer.reward.getRenderedString(reward)}
		${Renderer.utils.getPageTr(reward)}
		${Renderer.utils.getBorderTr()}
	`);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const rewardsPage = new RewardsPage();
window.addEventListener("load", () => rewardsPage.pOnLoad());
