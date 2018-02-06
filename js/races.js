"use strict";
const JSON_URL = "data/races.json";
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

			const rightSource = sourceFilter.toDisplay(f, r.source);
			const rightAsi = asiFilter.toDisplay(f, r._fAbility);
			const rightSize = sizeFilter.toDisplay(f, r.size);
			const rightSpeed = speedFilter.toDisplay(f, r._fSpeed);
			const rightMisc = miscFilter.toDisplay(f, r._fMisc);

			return rightSource && rightAsi && rightSize && rightSpeed && rightMisc;
		})
	}

	initHistory();
	handleFilterChange();
	RollerUtil.addListRollButton();
}

const renderer = new EntryRenderer();

function loadhash (id) {
	const $pgContent = $("#pagecontent");
	$pgContent.html(tableDefault);
	$pgContent.find("td").show();

	const race = raceList[id];

	$("th.name").html(`<span class="stats-name">${race.name}</span><span class="stats-source source${race.source}" title="${Parser.sourceJsonToFull(race.source)}">${Parser.sourceJsonToAbv(race.source)}</span>`);

	const size = Parser.sizeAbvToFull(race.size);
	$("td#size span").html(size);

	const ability = race.ability ? utils_getAbilityData(race.ability) : {asText: "None"};
	$("td#ability span").html(ability.asText);

	$("td#speed span").html(EntryRenderer.race.getSpeedString(race));

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

	$('table#pagecontent tbody tr:last').before(renderStack.join(""));
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
}