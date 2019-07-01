"use strict";

class FeatsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const asiFilter = getAsiFilter();
		const prereqFilter = new Filter({
			header: "Prerequisite",
			items: ["Ability", "Race", "Proficiency", "Spellcasting"]
		});

		super({
			dataSource: "data/feats.json",

			filters: [
				sourceFilter,
				asiFilter,
				prereqFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "source", "ability", "prerequisite", "uniqueid"],
			listClass: "feats",

			sublistValueNames: ["name", "ability", "prerequisite", "id"],
			sublistClass: "subfeats",

			dataProps: ["feat"]
		});

		this._sourceFilter = sourceFilter;
	}

	getListItem (feat, ftI) {
		const name = feat.name;
		const ability = Renderer.getAbilityData(feat.ability);
		if (!ability.asText) ability.asText = STR_NONE;
		feat._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering
		let prereqText = Renderer.feat.getPrerequisiteText(feat.prerequisite, true);
		if (!prereqText) prereqText = STR_NONE;

		const preSet = new Set();
		(feat.prerequisite || []).forEach(it => preSet.add(...Object.keys(it)));
		feat._fPrereq = [...preSet].map(it => it.uppercaseFirst());

		feat._slAbility = ability.asText;
		feat._slPrereq = prereqText;

		// populate filters
		this._sourceFilter.addItem(feat.source);

		return `
		<li class="row" ${FLTR_ID}="${ftI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
			<a id="${ftI}" href="#${UrlUtil.autoEncodeHash(feat)}" title="${name}">
				<span class="name col-3-8 pl-0">${name}</span>
				<span class="ability col-3-5 ${ability.asText === STR_NONE ? "list-entry-none " : ""}">${ability.asText}</span>
				<span class="prerequisite col-3 ${(prereqText === STR_NONE ? "list-entry-none " : "")}">${prereqText}</span>
				<span class="source col-1-7 text-center ${Parser.sourceJsonToColor(feat.source)} pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${BrewUtil.sourceJsonToStyle(feat.source)}>${Parser.sourceJsonToAbv(feat.source)}</span>
				
				<span class="uniqueid hidden">${feat.uniqueId ? feat.uniqueId : ftI}</span>
			</a>
		</li>`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const ft = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				ft.source,
				ft._fAbility,
				ft._fPrereq
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (feat, pinId) {
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(feat)}" title="${feat.name}">
					<span class="name col-4 pl-0">${feat.name}</span>
					<span class="ability col-4 ${feat._slAbility === STR_NONE ? "list-entry-none" : ""}">${feat._slAbility}</span>
					<span class="prerequisite col-4 ${feat._slPrereq === STR_NONE ? "list-entry-none" : ""} pr-0">${feat._slPrereq}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);

		const $content = $("#pagecontent").empty();

		const feat = this._dataList[id];

		const prerequisite = Renderer.feat.getPrerequisiteText(feat.prerequisite);
		Renderer.feat.mergeAbilityIncrease(feat);
		const renderStack = [];
		this._renderer.recursiveRender({entries: feat.entries}, renderStack, {depth: 2});

		$content.append(`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(feat)}
		${prerequisite ? `<tr><td colspan="6"><span class="prerequisite">Prerequisite: ${prerequisite}</span></td></tr>` : ""}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>
		${Renderer.utils.getPageTr(feat)}
		${Renderer.utils.getBorderTr()}
	`);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const featsPage = new FeatsPage();
window.addEventListener("load", () => featsPage.pOnLoad());
