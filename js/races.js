"use strict";

class RacesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterRaces();
		super({
			dataSource: async () => {
				const rawRaceData = await DataUtil.loadJSON("data/races.json");
				const raceData = Renderer.race.mergeSubraces(rawRaceData.race);
				return {race: raceData};
			},
			dataSourceFluff: "data/fluff-races.json",

			pageFilter,

			listClass: "races",

			sublistClass: "subraces",

			dataProps: ["race"],

			hasAudio: true
		});
	}

	getListItem (race, rcI, isExcluded) {
		this._pageFilter.addToFilters(race, isExcluded);

		const ability = race.ability ? Renderer.getAbilityData(race.ability) : {asTextShort: "None"};

		// convert e.g. "Elf (High)" to "High Elf" and add as a searchable field
		const bracketMatch = /^(.*?) \((.*?)\)$/.exec(race.name);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const hash = UrlUtil.autoEncodeHash(race);
		const size = Parser.sizeAbvToFull(race.size);
		const source = Parser.sourceJsonToAbv(race.source);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="bold col-4 pl-0">${race.name}</span>
			<span class="col-4">${ability.asTextShort}</span>
			<span class="col-2">${size}</span>
			<span class="col-2 text-center ${Parser.sourceJsonToColor(race.source)} pr-0" title="${Parser.sourceJsonToFull(race.source)}" ${BrewUtil.sourceJsonToStyle(race.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			rcI,
			eleLi,
			race.name,
			{
				hash,
				ability: ability.asTextShort,
				size,
				source,
				cleanName: bracketMatch ? `${bracketMatch[2]} ${bracketMatch[1]}` : "",
				isExcluded,
				uniqueId: race.uniqueId ? race.uniqueId : rcI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._pageFilter.filterBox.getValues();
		this._list.filter(it => this._pageFilter.toDisplay(f, this._dataList[it.ix]));
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (race, pinId) {
		const hash = UrlUtil.autoEncodeHash(race);

		const $ele = $(`
			<li class="row">
				<a href="#${UrlUtil.autoEncodeHash(race)}" class="lst--border">
					<span class="bold col-5 pl-0">${race.name}</span>
					<span class="col-5">${race._slAbility}</span>
					<span class="col-2 pr-0">${Parser.sizeAbvToFull(race.size)}</span>
				</a>
			</li>
		`).contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			race.name,
			{
				hash,
				ability: race._slAbility
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const renderer = this._renderer;
		renderer.setFirstSection(true);
		const $content = $("#pagecontent").empty();
		const race = this._dataList[id];

		function buildStatsTab () {
			$content.append(RenderRaces.$getRenderedRace(race));
		}

		function buildFluffTab (isImageTab) {
			return Renderer.utils.pBuildFluffTab(
				isImageTab,
				$content,
				race,
				getFluff,
				`data/fluff-races.json`,
				() => true
			);
		}

		function getFluff (fluffJson) {
			const predefined = Renderer.utils.getPredefinedFluff(race, "raceFluff");
			if (predefined) return predefined;

			const subFluff = fluffJson.race.find(it => it.name.toLowerCase() === race.name.toLowerCase() && it.source.toLowerCase() === race.source.toLowerCase());

			const baseFluff = race._baseName && race.name.toLowerCase() === race._baseName.toLowerCase() ? "" : fluffJson.race.find(it => race._baseName && it.name.toLowerCase() === race._baseName.toLowerCase() && race._baseSource && it.source.toLowerCase() === race._baseSource.toLowerCase());

			if (!subFluff && !baseFluff) return null;

			const findFluff = (toFind) => fluffJson.race.find(it => toFind.name.toLowerCase() === it.name.toLowerCase() && toFind.source.toLowerCase() === it.source.toLowerCase());

			const fluff = {type: "section"};

			const addFluff = (fluffToAdd, isBase) => {
				if (fluffToAdd.entries && !(isBase && subFluff && subFluff._excludeBaseEntries)) {
					fluff.entries = fluff.entries || [];
					const toAdd = {type: "section", entries: MiscUtil.copy(fluffToAdd.entries)};
					if (isBase && !fluffToAdd.entries.length) toAdd.name = race._baseName;
					fluff.entries.push(toAdd);
				}
				if (fluffToAdd.images && !(isBase && subFluff && subFluff._excludeBaseImages)) {
					fluff.images = fluff.images || [];
					fluff.images.push(...MiscUtil.copy(fluffToAdd.images));
				}
				if (fluffToAdd._appendCopy) {
					const toAppend = findFluff(fluffToAdd._appendCopy);
					if (toAppend.entries) {
						fluff.entries = fluff.entries || [];
						const toAdd = {type: "section", entries: MiscUtil.copy(toAppend.entries)};
						if (isBase && !fluffToAdd.entries.length) toAdd.name = race._baseName;
						fluff.entries.push(toAdd);
					}
					if (toAppend.images) {
						fluff.images = fluff.images || [];
						fluff.images.push(...MiscUtil.copy(toAppend.images));
					}
				}
			};

			if (subFluff) addFluff(subFluff);
			if (baseFluff) addFluff(baseFluff, true);

			if ((subFluff && subFluff.uncommon) || (baseFluff && baseFluff.uncommon)) {
				const entryUncommon = {type: "section", entries: [MiscUtil.copy(fluffJson.meta.uncommon)]};
				if (fluff.entries) {
					fluff.entries.push(entryUncommon);
				} else {
					fluff.entries = [Renderer.utils.HTML_NO_INFO];
					fluff.entries.push(...entryUncommon.entries)
				}
			}

			if ((subFluff && subFluff.monstrous) || (baseFluff && baseFluff.monstrous && (!subFluff || (subFluff.monstrous == null || subFluff.monstrous)))) {
				const entryMonstrous = {type: "section", entries: [MiscUtil.copy(fluffJson.meta.monstrous)]};
				if (fluff.entries) {
					fluff.entries.push(entryMonstrous);
				} else {
					fluff.entries = [Renderer.utils.HTML_NO_INFO];
					fluff.entries.push(...entryMonstrous.entries)
				}
			}

			if (fluff.entries && fluff.entries.length && fluff.entries[0].type === "section") {
				const firstSection = fluff.entries.splice(0, 1)[0];
				fluff.entries.unshift(...firstSection.entries);
			}

			return fluff;
		}

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

const racesPage = new RacesPage();
window.addEventListener("load", () => racesPage.pOnLoad());
