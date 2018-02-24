"use strict";
const JSON_URL = "data/races.json";
const JSON_FLUFF_URL = "data/fluff-races.json";
const FLUFF_UNCOMMON = {
	name: "Uncommon Races",
	type: "inset",
	entries: [
		"This race, and those listed below, are uncommon. They don't exist in every world of D&D, and even where they are found, they are less widespread than dwarves, elves, halflings, and humans. In the cosmopolitan cities of the D&D multiverse, most people hardly look twice at members of even the most exotic races. But the small towns and villages that dot the countryside are different. The common folk aren't accustomed to seeing members of these races, and they react accordingly.",
		{
			type: "entries",
			name: "Dragonborn",
			entries: [
				"It's easy to assume that a dragonborn is a monster, especially if his or her scales betray a chromatic heritage. Unless the dragonborn starts breathing fire and causing destruction, though, people are likely to respond with caution rather than outright fear."
			]
		},
		{
			type: "entries",
			name: "Gnome",
			entries: [
				"Gnomes don't look like a threat and can quickly disarm suspicion with good humor. The common folk are often curious about gnomes, likely never having seen one before, but they are rarely hostile or fearful."
			]
		},
		{
			type: "entries",
			name: "Half-Elf",
			entries: [
				"Although many people have never seen a half-elf, virtually everyone knows they exist. A half-elf stranger's arrival is followed by gossip behind the half-elf's back and stolen glances across the common room, rather than any confrontation or open curiosity."
			]
		},
		{
			type: "entries",
			name: "Half-Orc",
			entries: [
				"It's usually safe to assume that a half-orc is belligerent and quick to anger, so people watch themselves around an unfamiliar half-orc. Shopkeepers might surreptitiously hide valuable or fragile goods when a half-orc comes in, and people slowly clear out of a tavern, assuming a fight will break out soon."
			]
		},
		{
			type: "entries",
			name: "Tiefling",
			entries: [
				"Half-orcs are greeted with a practical caution, but tieflings are the subject of supernatural fear. The evil of their heritage is plainly visible in their features, and as far as most people are concerned, a tiefling could very well be a devil straight from the Nine Hells. People might make warding signs as a tiefling approaches, cross the street to avoid passing near, or bar shop doors before a tiefling can enter."
			]
		}
	]
};
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

		tempString +=
			`<li ${FLTR_ID}='${i}'>
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
		})
	}

	initHistory();
	handleFilterChange();
	RollerUtil.addListRollButton();
	EntryRenderer.hover.bindPopoutButton(raceList);
}

const renderer = new EntryRenderer();

function loadhash (id) {
	const $pgContent = $("#pagecontent");
	$pgContent.html(tableDefault);
	$pgContent.find("td").show();

	const race = raceList[id];

	EntryRenderer.utils.bindTabButtons(
		"Traits",
		"Info",
		() => {},
		() => {},
		() => {
			function get$Tr() {
				return $(`<tr class="text">`);
			}
			function get$Td() {
				return $(`<td colspan="6" class="text">`);
			}

			$pgContent.append(EntryRenderer.utils.getBorderTr());
			$pgContent.append(EntryRenderer.utils.getNameTr(race));
			let $tr = get$Tr();
			let $td = get$Td().appendTo($tr);
			$pgContent.append($tr);
			$pgContent.append(EntryRenderer.utils.getBorderTr());

			DataUtil.loadJSON(JSON_FLUFF_URL, (data) => {
				const subFluff = data.race.find(it => it.name === race.name && it.source === race.source);
				const baseFluff = data.race.find(it => it.name === race._baseName && it.source === race._baseSource);
				if (subFluff || baseFluff) {
					if (subFluff && !baseFluff) {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: subFluff.entries}));
					} else if (subFluff && baseFluff) {
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
					} else {
						renderer.setFirstSection(true);
						$td.append(renderer.renderEntry({type: "section", entries: baseFluff.entries}));
					}
					if (subFluff && subFluff.uncommon || baseFluff && baseFluff.uncommon) {
						let $tr2 = get$Tr();
						let $td2 = get$Td().appendTo($tr2);
						$tr.after($tr2);
						$tr.after(EntryRenderer.utils.getDividerTr());
						renderer.setFirstSection(true);
						$td2.append(renderer.renderEntry(FLUFF_UNCOMMON));
					}
				} else {
					$td.empty();
					$td.append(HTML_NO_INFO);
				}
			});
		}
	);

	$pgContent.find("th.name").html(`<span class="stats-name">${race.name}</span><span class="stats-source source${race.source}" title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>`);

	const size = Parser.sizeAbvToFull(race.size);
	$pgContent.find("td#size span").html(size);

	const ability = race.ability ? utils_getAbilityData(race.ability) : {asText: "None"};
	$pgContent.find("td#ability span").html(ability.asText);

	$pgContent.find("td#speed span").html(EntryRenderer.race.getSpeedString(race));

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