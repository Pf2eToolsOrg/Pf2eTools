"use strict";

class BackgroundPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const skillFilter = new Filter({header: "Skill Proficiencies", displayFn: StrUtil.toTitleCase});
		const toolFilter = new Filter({header: "Tool Proficiencies", displayFn: StrUtil.toTitleCase});
		const languageFilter = new Filter({header: "Language Proficiencies", displayFn: StrUtil.toTitleCase});

		super({
			dataSource: "data/backgrounds.json",
			dataSourceFluff: "data/fluff-backgrounds.json",

			filters: [
				sourceFilter,
				skillFilter,
				toolFilter,
				languageFilter
			],
			filterSource: sourceFilter,

			listValueNames: ["name", "source", "skills", "uniqueid"],
			listClass: "backgrounds",

			sublistValueNames: ["name", "skills", "id"],
			sublistClass: "subbackgrounds",

			dataProps: ["background"]
		});

		this._sourceFilter = sourceFilter;
		this._skillFilter = skillFilter;
		this._toolFilter = toolFilter;
		this._languageFilter = languageFilter;
	}

	getListItem (bg, bgI) {
		const skillDisplay = Renderer.background.getSkillSummary(bg.skillProficiencies, true, bg._fSkills = []);
		Renderer.background.getToolSummary(bg.toolProficiencies, true, bg._fTools = []);
		Renderer.background.getLanguageSummary(bg.languageProficiencies, true, bg._fLangs = []);

		// populate filters
		this._sourceFilter.addItem(bg.source);
		this._skillFilter.addItem(bg._fSkills);
		this._toolFilter.addItem(bg._fTools);
		this._languageFilter.addItem(bg._fLangs);

		return `
		<li class="row" ${FLTR_ID}="${bgI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
			<a id="${bgI}" href="#${UrlUtil.autoEncodeHash(bg)}" title="${bg.name}">
				<span class="name col-4 pl-0">${bg.name.replace("Variant ", "")}</span>
				<span class="skills col-6">${skillDisplay}</span>
				<span class="source col-2 text-center ${Parser.sourceJsonToColor(bg.source)}" title="${Parser.sourceJsonToFull(bg.source)} pr-0" ${BrewUtil.sourceJsonToStyle(bg.source)}>${Parser.sourceJsonToAbv(bg.source)}</span>
				
				<span class="uniqueid hidden">${bg.uniqueId ? bg.uniqueId : bgI}</span>
			</a>
		</li>`;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter((item) => {
			const bg = this._dataList[$(item.elm).attr(FLTR_ID)];
			return this._filterBox.toDisplay(
				f,
				bg.source,
				bg._fSkills,
				bg._fTools,
				bg._fLangs
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (bg, pinId) {
		return `
			<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
				<a href="#${UrlUtil.autoEncodeHash(bg)}" title="${bg.name}">
					<span class="name col-4 pl-0">${bg.name}</span>
					<span class="name col-8 pr-0">${Renderer.background.getSkillSummary(bg.skillProficiencies || [], true)}</span>
					<span class="id hidden">${pinId}</span>
				</a>
			</li>
		`;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);
		const $pgContent = $("#pagecontent").empty();
		const bg = this._dataList[id];

		const buildStatsTab = () => {
			const renderStack = [];
			const entryList = {type: "entries", entries: bg.entries};
			this._renderer.recursiveRender(entryList, renderStack);

			$pgContent.append(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(bg)}
			<tr><td class="divider" colspan="6"><div></div></td></tr>
			<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(bg)}
			${Renderer.utils.getBorderTr()}
			`);
		};

		const buildFluffTab = (isImageTab) => {
			return Renderer.utils.buildFluffTab(
				isImageTab,
				$pgContent,
				bg,
				(fluffJson) => bg.fluff || fluffJson.background.find(it => it.name === bg.name && it.source === bg.source),
				this._dataSourcefluff,
				() => true
			);
		};

		const traitTab = Renderer.utils.tabButton(
			"Traits",
			() => {},
			buildStatsTab
		);

		const infoTab = Renderer.utils.tabButton(
			"Info",
			() => {},
			buildFluffTab
		);
		const picTab = Renderer.utils.tabButton(
			"Images",
			() => {},
			buildFluffTab.bind(null, true)
		);
		Renderer.utils.bindTabButtons(traitTab, infoTab, picTab);

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const backgroundsPage = new BackgroundPage();
window.addEventListener("load", () => backgroundsPage.pOnLoad());
