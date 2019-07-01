"use strict";

function imgError (x) {
	if (x) $(x).parent().remove();
	$(`.rnd-name`).find(`span.stats-source`).css("margin-right", "0");
}

function handleStatblockScroll (event, ele) {
	$(`#token_image`)
		.toggle(ele.scrollTop < 32)
		.css({
			opacity: (32 - ele.scrollTop) / 32,
			top: -ele.scrollTop
		})
}

class ObjectsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();

		super({
			dataSource: "data/objects.json",

			filters: [
				sourceFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "size", "source", "uniqueid"],
			listClass: "objects",

			sublistValueNames: ["name", "size", "id"],
			sublistClass: "subobjects",

			dataProps: ["object"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (obj, obI) {
		this._sourceFilter.addItem(obj.source);

		return `
			<li class="row" ${FLTR_ID}="${obI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id="${obI}" href="#${UrlUtil.autoEncodeHash(obj)}" title="${obj.name}">
					<span class="name col-8 pl-0">${obj.name}</span>
					<span class="size col-2">${Parser.sizeAbvToFull(obj.size)}</span>
					<span class="source col-2 text-center ${Parser.sourceJsonToColor(obj.source)} pr-0" title="${Parser.sourceJsonToFull(obj.source)}" ${BrewUtil.sourceJsonToStyle(obj.source)}>${Parser.sourceJsonToAbv(obj.source)}</span>
					
					<span class="uniqueid hidden">${obj.uniqueId ? obj.uniqueId : obI}</span>
				</a>
			</li>
		`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const it = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				it.source
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (obj, pinId) {
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(obj)}" title="${obj.name}">
					<span class="name col-9 pl-0">${obj.name}</span>
					<span class="ability col-3 pr-0">${Parser.sizeAbvToFull(obj.size)}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);

		const obj = this._dataList[id];

		const renderStack = [];

		if (obj.entries) this._renderer.recursiveRender({entries: obj.entries}, renderStack, {depth: 2});
		if (obj.actionEntries) this._renderer.recursiveRender({entries: obj.actionEntries}, renderStack, {depth: 2});

		const $content = $(`#pagecontent`).empty();
		$content.append(`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(obj)}
		<tr class="text"><td colspan="6"><i>${obj.type !== "GEN" ? `${Parser.sizeAbvToFull(obj.size)} object` : `Variable size object`}</i><br></td></tr>
		<tr class="text"><td colspan="6">
			<b>Armor Class:</b> ${obj.ac}<br>
			<b>Hit Points:</b> ${obj.hp}<br>
			<b>Damage Immunities:</b> ${obj.immune}<br>
			${obj.resist ? `<b>Damage Resistances:</b> ${obj.resist}<br>` : ""}
			${obj.vulnerable ? `<b>Damage Vulnerabilities:</b> ${obj.vulnerable}<br>` : ""}
		</td></tr>
		<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
		${Renderer.utils.getPageTr(obj)}
		${Renderer.utils.getBorderTr()}
	`);

		const $floatToken = $(`#float-token`).empty();
		if (obj.tokenUrl || !obj.uniqueId) {
			const imgLink = obj.tokenUrl || UrlUtil.link(`img/objects/${obj.name.replace(/"/g, "")}.png`);
			$floatToken.append(`
			<a href="${imgLink}" target="_blank" rel="noopener">
				<img src="${imgLink}" id="token_image" class="token" onerror="imgError(this)" alt="${obj.name}">
			</a>`
			);
		} else imgError();

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const objecsPage = new ObjectsPage();
window.addEventListener("load", () => objecsPage.pOnLoad());
