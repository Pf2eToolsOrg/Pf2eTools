"use strict";

const ASI_SORT_POS = {
	Strength: 0,
	Dexterity: 1,
	Constitution: 2,
	Intelligence: 3,
	Wisdom: 4,
	Charisma: 5
};

function getAbilityObjs (abils) {
	function makeAbilObj (asi, amount) {
		return {
			asi: asi,
			amount: amount,
			_toIdString: () => {
				return `${asi}${amount}`
			}
		}
	}

	const out = new CollectionUtil.ObjectSet();

	(abils || []).forEach(abil => {
		if (abil.choose) {
			const ch = abil.choose;

			if (ch.weighted) {
				// add every ability + weight combo
				ch.weighted.from.forEach(f => {
					ch.weighted.weights.forEach(w => {
						out.add(makeAbilObj(f, w));
					});
				});
			} else {
				const by = ch.amount || 1;
				ch.from.forEach(asi => out.add(makeAbilObj(asi, by)));
			}
		}
		Object.keys(abil).filter(prop => prop !== "choose").forEach(prop => out.add(makeAbilObj(prop, abil[prop])));
	});

	return Array.from(out.values());
}

function mapAbilityObjToFull (abilObj) {
	return `${Parser.attAbvToFull(abilObj.asi)} ${abilObj.amount < 0 ? "" : "+"}${abilObj.amount}`;
}

function getSpeedRating (speed) {
	return speed > 30 ? "Walk (Fast)" : speed < 30 ? "Walk (Slow)" : "Walk";
}

function filterAscSortSize (a, b) {
	a = a.item;
	b = b.item;

	return SortUtil.ascSort(toNum(a), toNum(b));

	function toNum (size) {
		switch (size) {
			case "M": return 0;
			case "S": return -1;
			case "V": return 1;
		}
	}
}

function filterAscSortAsi (a, b) {
	a = a.item;
	b = b.item;

	if (a === "Player Choice") return -1;
	else if (a.startsWith("Any") && b.startsWith("Any")) {
		const aAbil = a.replace("Any", "").replace("Increase", "").trim();
		const bAbil = b.replace("Any", "").replace("Increase", "").trim();
		return ASI_SORT_POS[aAbil] - ASI_SORT_POS[bAbil];
	} else if (a.startsWith("Any")) {
		return -1;
	} else if (b.startsWith("Any")) {
		return 1;
	} else {
		const [aAbil, aScore] = a.split(" ");
		const [bAbil, bScore] = b.split(" ");
		return (ASI_SORT_POS[aAbil] - ASI_SORT_POS[bAbil]) || (Number(bScore) - Number(aScore));
	}
}

class RacesPage extends ListPage {
	static getLanguageProficiencyTags (lProfs) {
		if (!lProfs) return [];

		const outSet = new Set();
		lProfs.forEach(lProfGroup => {
			Object.keys(lProfGroup).filter(k => k !== "choose").forEach(k => outSet.add(k.toTitleCase()));
			if (lProfGroup.choose) outSet.add("Choose");
		});

		return [...outSet];
	}

	constructor () {
		const sourceFilter = getSourceFilter();
		const sizeFilter = new Filter({header: "Size", displayFn: Parser.sizeAbvToFull, itemSortFn: filterAscSortSize});
		const asiFilter = new Filter({
			header: "Ability Bonus (Including Subrace)",
			items: [
				"Player Choice",
				"Any Strength Increase",
				"Any Dexterity Increase",
				"Any Constitution Increase",
				"Any Intelligence Increase",
				"Any Wisdom Increase",
				"Any Charisma Increase",
				"Strength +2",
				"Strength +1",
				"Dexterity +2",
				"Dexterity +1",
				"Constitution +2",
				"Constitution +1",
				"Intelligence +2",
				"Intelligence +1",
				"Wisdom +2",
				"Wisdom +1",
				"Charisma +2",
				"Charisma +1"
			],
			itemSortFn: filterAscSortAsi
		});
		const baseRaceFilter = new Filter({header: "Base Race"});
		const speedFilter = new Filter({header: "Speed", items: ["Climb", "Fly", "Swim", "Walk (Fast)", "Walk", "Walk (Slow)"]});
		const traitFilter = new Filter({
			header: "Traits",
			items: [
				"Amphibious",
				"Armor Proficiency",
				"Damage Resistance",
				"Darkvision", "Superior Darkvision",
				"Dragonmark",
				"Improved Resting",
				"Monstrous Race",
				"Natural Armor",
				"NPC Race",
				"Powerful Build",
				"Skill Proficiency",
				"Spellcasting",
				"Tool Proficiency",
				"Unarmed Strike",
				"Uncommon Race",
				"Weapon Proficiency"
			],
			deselFn: (it) => {
				return it === "NPC Race";
			}
		});
		const languageFilter = new Filter({
			header: "Languages",
			items: [
				"Abyssal",
				"Celestial",
				"Choose",
				"Common",
				"Draconic",
				"Dwarvish",
				"Elvish",
				"Giant",
				"Gnomish",
				"Goblin",
				"Halfling",
				"Infernal",
				"Orc",
				"Other",
				"Primordial",
				"Sylvan",
				"Undercommon"
			],
			umbrellaItems: ["Choose"]
		});

		super({
			dataSource: async () => {
				const rawRaceData = await DataUtil.loadJSON("data/races.json");
				const raceData = Renderer.race.mergeSubraces(rawRaceData.race);
				return {race: raceData};
			},
			dataSourceFluff: "data/fluff-races.json",

			filters: [
				sourceFilter,
				asiFilter,
				sizeFilter,
				speedFilter,
				traitFilter,
				languageFilter,
				baseRaceFilter
			],
			filterSource: sourceFilter,

			listClass: "races",

			sublistClass: "subraces",

			dataProps: ["race"],

			hasAudio: true
		});

		this._sourceFilter = sourceFilter;
		this._sizeFilter = sizeFilter;
		this._asiFilter = asiFilter;
		this._baseRaceFilter = baseRaceFilter;
	}

	getListItem (race, rcI) {
		const ability = race.ability ? Renderer.getAbilityData(race.ability) : {asTextShort: "None"};
		if (race.ability) {
			const abils = getAbilityObjs(race.ability);
			race._fAbility = abils.map(a => mapAbilityObjToFull(a));
			const increases = {};
			abils.filter(it => it.amount > 0).forEach(it => increases[it.asi] = true);
			Object.keys(increases).forEach(it => race._fAbility.push(`Any ${Parser.attAbvToFull(it)} Increase`));
			if (race.ability.choose) race._fAbility.push("Player Choice");
		} else race._fAbility = [];
		race._fSpeed = race.speed.walk ? [race.speed.climb ? "Climb" : null, race.speed.fly ? "Fly" : null, race.speed.swim ? "Swim" : null, getSpeedRating(race.speed.walk)].filter(it => it) : getSpeedRating(race.speed);
		race._fMisc = [
			race.darkvision === 120 ? "Superior Darkvision" : race.darkvision ? "Darkvision" : null,
			race.hasSpellcasting ? "Spellcasting" : null
		].filter(it => it).concat(race.traitTags || []);
		race._fSources = ListUtil.getCompleteFilterSources(race);
		race._fLangs = RacesPage.getLanguageProficiencyTags(race.languageProficiencies);

		race._slAbility = ability.asTextShort;

		// convert e.g. "Elf (High)" to "High Elf" and add as a searchable field
		const bracketMatch = /^(.*?) \((.*?)\)$/.exec(race.name);

		// populate filters
		this._sourceFilter.addItem(race._fSources);
		this._sizeFilter.addItem(race.size);
		this._asiFilter.addItem(race._fAbility);
		this._baseRaceFilter.addItem(race._baseName);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const hash = UrlUtil.autoEncodeHash(race);
		const size = Parser.sizeAbvToFull(race.size);
		const source = Parser.sourceJsonToAbv(race.source);

		eleLi.innerHTML = `<a href="#${hash}">
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
				uniqueid: race.uniqueId ? race.uniqueId : rcI
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
				r._fSources,
				r._fAbility,
				r.size,
				r._fSpeed,
				r._fMisc,
				r._fLangs,
				r._baseName
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (race, pinId) {
		const hash = UrlUtil.autoEncodeHash(race);

		const $ele = $(`
			<li class="row">
				<a href="#${UrlUtil.autoEncodeHash(race)}" title="${race.name}">
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

			const subFluff = race._baseName && race.name.toLowerCase() === race._baseName.toLowerCase() ? "" : fluffJson.race.find(it => it.name.toLowerCase() === race.name.toLowerCase() && it.source.toLowerCase() === race.source.toLowerCase());

			const baseFluff = fluffJson.race.find(it => race._baseName && it.name.toLowerCase() === race._baseName.toLowerCase() && race._baseSource && it.source.toLowerCase() === race._baseSource.toLowerCase());

			if (!subFluff && !baseFluff) return null;

			const findFluff = (toFind) => fluffJson.race.find(it => toFind.name.toLowerCase() === it.name.toLowerCase() && toFind.source.toLowerCase() === it.source.toLowerCase());

			const fluff = {type: "section"};

			const addFluff = (fluffToAdd, isBase) => {
				if (fluffToAdd.entries) {
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

			if ((subFluff && subFluff.monstrous) || (baseFluff && baseFluff.monstrous)) {
				const entryMonstrous = {type: "section", entries: [MiscUtil.copy(fluffJson.meta.monstrous)]};
				if (fluff.entries) {
					fluff.entries.push(entryMonstrous);
				} else {
					fluff.entries = [Renderer.utils.HTML_NO_INFO];
					fluff.entries.push(...entryMonstrous.entries)
				}
			}

			if (fluff.entries.length && fluff.entries[0].type === "section") {
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
