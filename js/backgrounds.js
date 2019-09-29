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

			listClass: "backgrounds",

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

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const name = bg.name.replace("Variant ", "");
		const hash = UrlUtil.autoEncodeHash(bg);
		const source = Parser.sourceJsonToAbv(bg.source);

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="bold col-4 pl-0">${name}</span>
			<span class="col-6">${skillDisplay}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(bg.source)}" title="${Parser.sourceJsonToFull(bg.source)} pr-0" ${BrewUtil.sourceJsonToStyle(bg.source)}>${source}</span>
			
			<span class="uniqueid hidden">${bg.uniqueId ? bg.uniqueId : bgI}</span>
		</a>`;

		const listItem = new ListItem(
			bgI,
			eleLi,
			name,
			{
				hash,
				source,
				skills: skillDisplay,
				uniqueid: bg.uniqueId || bgI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const bg = this._dataList[item.ix];
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
		const name = bg.name.replace("Variant ", "");
		const hash = UrlUtil.autoEncodeHash(bg);
		const skills = Renderer.background.getSkillSummary(bg.skillProficiencies || [], true);

		const $ele = $$`<li class="row">
			<a href="#${hash}">
				<span class="bold col-4 pl-0">${name}</span>
				<span class="col-8 pr-0">${skills}</span>
			</a>
		</li>`
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			name,
			{
				hash,
				source: Parser.sourceJsonToAbv(bg.source),
				skills
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		this._renderer.setFirstSection(true);
		const $pgContent = $("#pagecontent").empty();
		const bg = this._dataList[id];

		const buildStatsTab = () => {
			$pgContent.append(RenderBackgrounds.$getRenderedBackground(bg));
		};

		const buildFluffTab = (isImageTab) => {
			return Renderer.utils.pBuildFluffTab(
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
