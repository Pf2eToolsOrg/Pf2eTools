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

	raceList = data.race;

	const sourceFilter = getSourceFilter();
	const asiFilter = new Filter({
		header: "Ability Bonus",
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

	filterBox = initFilterBox(
		sourceFilter,
		asiFilter,
		sizeFilter
	);

	const racesTable = $("ul.races");
	let tempString = "";
	for (let i = 0; i < raceList.length; i++) {
		const race = raceList[i];

		const ability = utils_getAbilityData(race.ability);
		race._fAbility = getAbilityObjs(race.ability).map(a => mapAbilityObjToFull(a)); // used for filtering
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
	sourceFilter.items.sort(ascSort);
	sizeFilter.items.sort(ascSortSize);

	function ascSortSize (a, b) {
		return ascSort(toNum(a), toNum(b));

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

			return rightSource && rightAsi && rightSize;
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

	const ability = utils_getAbilityData(race.ability);
	$("td#ability span").html(ability.asText);

	$("td#speed span").html(EntryRenderer.race.getSpeedString(race));

	const renderStack = [];
	const faux = {type: "entries", entries: race.entries};

	renderer.recursiveEntryRender(faux, renderStack, 1, "<tr class='text'><td colspan='6'>", "</td></tr>", true);

	$('table#pagecontent tbody tr:last').before(renderStack.join(""));
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
}