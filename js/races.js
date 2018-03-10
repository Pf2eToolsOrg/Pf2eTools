"use strict";
const JSON_URL = "data/races.json";
const JSON_FLUFF_URL = "data/fluff-races.json";
let tableDefault = "";

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad)
};

let raceList;

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
	if (abils.choose) {
		abils.choose.forEach(ch => {
			const by = ch.amount || 1;
			ch.from.forEach(asi => {
				out.add(makeAbilObj(asi, by));
			});
		});
	}
	Object.keys(abils).forEach(abil => {
		if (abil !== "choose") {
			out.add(makeAbilObj(abil, abils[abil]));
		}
	});
	return Array.from(out.values());
}

function mapAbilityObjToFull (abilObj) {
	return `${Parser.attAbvToFull(abilObj.asi)} ${abilObj.amount < 0 ? "" : "+"}${abilObj.amount}`;
}

let filterBox;
function onJsonLoad (data) {
	tableDefault = $("#pagecontent").html();

	raceList = EntryRenderer.race.mergeSubraces(data.race);

	const sourceFilter = getSourceFilter();
	const asiFilter = new Filter({
		header: "Ability Bonus (Including Subrace)",
		items: [
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
		]
	});
	const sizeFilter = new Filter({header: "Size", displayFn: Parser.sizeAbvToFull});
	const speedFilter = new Filter({header: "Speed", items: ["Climb", "Fly", "Swim", "Walk"]});
	const miscFilter = new Filter({
		header: "Miscellaneous",
		items: ["Darkvision", "NPC Race"],
		deselFn: (it) => {
			return it === "NPC Race";
		}
	});

	filterBox = initFilterBox(
		sourceFilter,
		asiFilter,
		sizeFilter,
		speedFilter,
		miscFilter
	);

	const racesTable = $("ul.races");
	let tempString = "";
	for (let i = 0; i < raceList.length; i++) {
		const race = raceList[i];

		const ability = race.ability ? utils_getAbilityData(race.ability) : {asTextShort: "None"};
		race._fAbility = race.ability ? getAbilityObjs(race.ability).map(a => mapAbilityObjToFull(a)) : []; // used for filtering
		race._fSpeed = race.speed.walk ? [race.speed.climb ? "Climb" : null, race.speed.fly ? "Fly" : null, race.speed.swim ? "Swim" : null, "Walk"].filter(it => it) : "Walk";
		race._fMisc = [race.darkvision ? "Darkvision" : null, race.npc ? "NPC Race" : null].filter(it => it);
		// convert e.g. "Elf (High)" to "High Elf" and add as a searchable field
		const bracketMatch = /^(.*?) \((.*?)\)$/.exec(race.name);

		race._slAbility = ability.asTextShort;

		tempString +=
			`<li class="row" ${FLTR_ID}='${i}' onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(race)}' title='${race.name}'>
					<span class='name col-xs-4'>${race.name}</span>
					<span class='ability col-xs-4'>${ability.asTextShort}</span>
					<span class='size col-xs-2'>${Parser.sizeAbvToFull(race.size)}</span>
					<span class='source col-xs-2 source${race.source}' title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>
					${bracketMatch ? `<span class="clean-name hidden">${bracketMatch[2]} ${bracketMatch[1]}</span>` : ""}
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(race.source);
		sizeFilter.addIfAbsent(race.size);
	}

	racesTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	sizeFilter.items.sort(ascSortSize);

	function ascSortSize (a, b) {
		return SortUtil.ascSort(toNum(a), toNum(b));

		function toNum (size) {
			switch (size) {
				case "M":
					return 0;
				case "S":
					return -1;
				case "V":
					return 1;
			}
		}
	}

	const list = ListUtil.search({
		valueNames: ['name', 'ability', 'size', 'source', 'clean-name'],
		listClass: "races"
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const r = raceList[$(item.elm).attr(FLTR_ID)];
			return filterBox.toDisplay(
				f,
				r.source,
				r._fAbility,
				r.size,
				r._fSpeed,
				r._fMisc
			);
		});
		FilterBox.nextIfHidden(raceList);
	}

	History.init();
	handleFilterChange();
	RollerUtil.addListRollButton();

	const subList = ListUtil.initSublist({
		valueNames: ["name", "ability", "size", "id"],
		listClass: "subraces",
		itemList: raceList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	EntryRenderer.hover.bindPopoutButton(raceList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton();
	ListUtil.initGenericPinnable();
	ListUtil.loadState();
}

function getSublistItem (race, pinId) {
	return `
		<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
			<a href="#${UrlUtil.autoEncodeHash(race)}" title="${race.name}">
				<span class="name col-xs-5">${race.name}</span>		
				<span class="ability col-xs-5">${race._slAbility}</span>		
				<span class="size col-xs-2">${Parser.sizeAbvToFull(race.size)}</span>		
				<span class="id hidden">${pinId}</span>				
			</a>
		</li>
	`;
}

const renderer = new EntryRenderer();
function loadhash (id) {
	const $pgContent = $("#pagecontent");
	$pgContent.html(tableDefault);
	$pgContent.find("td").show();

	const race = raceList[id];

	const traitTab = EntryRenderer.utils.tabButton(
		"Traits"
	);
	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => {},
		() => {
			function get$Tr () {
				return $(`<tr class="text">`);
			}
			function get$Td () {
				return $(`<td colspan="6" class="text">`);
			}

			$pgContent.append(EntryRenderer.utils.getBorderTr());
			$pgContent.append(EntryRenderer.utils.getNameTr(race));
			let $tr = get$Tr();
			let $td = get$Td().appendTo($tr);
			$pgContent.append($tr);
			$pgContent.append(EntryRenderer.utils.getBorderTr());

			DataUtil.loadJSON(JSON_FLUFF_URL, (data) => {
				function renderMeta (prop) {
					let $tr2 = get$Tr();
					let $td2 = get$Td().appendTo($tr2);
					$tr.after($tr2);
					$tr.after(EntryRenderer.utils.getDividerTr());
					renderer.setFirstSection(true);
					$td2.append(renderer.renderEntry(data.meta[prop]));
					$tr = $tr2;
					$td = $td2;
				}

				const subFluff = data.race.find(it => it.name.toLowerCase() === race.name.toLowerCase() && it.source.toLowerCase() === race.source.toLowerCase());
				const baseFluff = data.race.find(it => race._baseName && it.name.toLowerCase() === race._baseName.toLowerCase() && race._baseSource && it.source.toLowerCase() === race._baseSource.toLowerCase());
				if (subFluff || baseFluff) {
					if (subFluff && subFluff.entries && !baseFluff) {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: subFluff.entries}));
					} else if (subFluff && subFluff.entries && baseFluff && baseFluff.entries) {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: subFluff.entries}));
						let $tr2 = get$Tr();
						let $td2 = get$Td().appendTo($tr2);
						$tr.after($tr2);
						$tr.after(EntryRenderer.utils.getDividerTr());
						renderer.setFirstSection(true);
						$td2.append(renderer.renderEntry({type: "section", name: race._baseName, entries: baseFluff.entries}));
						$tr = $tr2;
						$td = $td2;
					} else if (baseFluff && baseFluff.entries) {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: baseFluff.entries}));
					}
					if ((subFluff && subFluff.uncommon) || (baseFluff && baseFluff.uncommon)) {
						renderMeta("uncommon");
					}
					if ((subFluff && subFluff.monstrous) || (baseFluff && baseFluff.monstrous)) {
						renderMeta("monstrous");
					}
				} else {
					$td.empty();
					$td.append(HTML_NO_INFO);
				}
			});
		}
	);
	EntryRenderer.utils.bindTabButtons(traitTab, infoTab);

	$pgContent.find("th.name").html(`<span class="stats-name">${race.name}</span><span class="stats-source source${race.source}" title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>`);

	const size = Parser.sizeAbvToFull(race.size);
	$pgContent.find("td#size span").html(size);

	const ability = race.ability ? utils_getAbilityData(race.ability) : {asText: "None"};
	$pgContent.find("td#ability span").html(ability.asText);

	$pgContent.find("td#speed span").html(Parser.getSpeedString(race));

	const renderStack = [];
	renderStack.push("<tr class='text'><td colspan='6'>");
	renderer.recursiveEntryRender({type: "entries", entries: race.entries}, renderStack, 1);
	renderStack.push("</td></tr>");
	if (race.npc) {
		renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
		renderer.recursiveEntryRender(
			`{@i Note: This race is listed in the {@i Dungeon Master's Guide} as an option for creating NPCs. It is not designed for use as a playable race.}`
			, renderStack, 2);
		renderStack.push(`</section></td></tr>`);
	}
	renderStack.push(EntryRenderer.utils.getPageTr(race));

	$pgContent.find('tbody tr:last').before(renderStack.join(""));
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
}