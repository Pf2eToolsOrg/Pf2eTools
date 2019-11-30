"use strict";

class FeatsPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const asiFilter = getAsiFilter();
		const otherPrereqFilter = new Filter({
			header: "Other",
			items: ["Ability", "Race", "Proficiency", "Special", "Spellcasting"]
		});
		const levelFilter = new Filter({
			header: "Level",
			itemSortFn: SortUtil.ascSortNumericalSuffix
		});
		const prerequisiteFilter = new MultiFilter({header: "Prerequisite", filters: [otherPrereqFilter, levelFilter]});
		const miscFilter = new Filter({header: "Miscellaneous", items: ["SRD"]});

		super({
			dataSource: "data/feats.json",

			filters: [
				sourceFilter,
				asiFilter,
				prerequisiteFilter,
				miscFilter
			],
			filterSource: sourceFilter,

			listClass: "feats",

			sublistClass: "subfeats",

			dataProps: ["feat"]
		});

		this._sourceFilter = sourceFilter;
		this._levelFilter = levelFilter;
	}

	getListItem (feat, ftI) {
		const name = feat.name;
		const ability = Renderer.getAbilityData(feat.ability);
		if (!ability.asText) ability.asText = STR_NONE;
		feat._fAbility = ability.asCollection.filter(a => !ability.areNegative.includes(a)); // used for filtering
		let prereqText = Renderer.utils.getPrerequisiteText(feat.prerequisite, true);
		if (!prereqText) prereqText = STR_NONE;

		const preSet = new Set();
		(feat.prerequisite || []).forEach(it => preSet.add(...Object.keys(it)));
		feat._fPrereqOther = [...preSet].map(it => it.uppercaseFirst());
		if (feat.prerequisite) {
			feat._fPrereqLevel = feat.prerequisite.filter(it => it.level != null).map(it => `Level ${it.level.level}`);
			this._levelFilter.addItem(feat._fPrereqLevel);
		}
		feat._fMisc = feat.srd ? ["SRD"] : [];

		feat._slAbility = ability.asText;
		feat._slPrereq = prereqText;

		// populate filters
		this._sourceFilter.addItem(feat.source);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(feat.source);
		const hash = UrlUtil.autoEncodeHash(feat);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-3-8 pl-0">${name}</span>
			<span class="col-3-5 ${ability.asText === STR_NONE ? "list-entry-none " : ""}">${ability.asText}</span>
			<span class="col-3 ${(prereqText === STR_NONE ? "list-entry-none " : "")}">${prereqText}</span>
			<span class="source col-1-7 text-center ${Parser.sourceJsonToColor(feat.source)} pr-0" title="${Parser.sourceJsonToFull(feat.source)}" ${BrewUtil.sourceJsonToStyle(feat.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ftI,
			eleLi,
			feat.name,
			{
				hash,
				source,
				ability: ability.asText,
				prerequisite: prereqText,
				uniqueId: feat.uniqueId ? feat.uniqueId : ftI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const ft = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				ft.source,
				ft._fAbility,
				[
					ft._fPrereqOther,
					ft._fPrereqLevel
				],
				ft._fMisc
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (feat, pinId) {
		const hash = UrlUtil.autoEncodeHash(feat);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-4 pl-0">${feat.name}</span>
				<span class="col-4 ${feat._slAbility === STR_NONE ? "list-entry-none" : ""}">${feat._slAbility}</span>
				<span class="col-4 ${feat._slPrereq === STR_NONE ? "list-entry-none" : ""} pr-0">${feat._slPrereq}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			feat.name,
			{
				hash,
				ability: feat._slAbility,
				prerequisite: feat._slPrereq
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const feat = this._dataList[id];

		$("#pagecontent").empty().append(RenderFeats.$getRenderedFeat(feat));

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const featsPage = new FeatsPage();
window.addEventListener("load", () => featsPage.pOnLoad());
