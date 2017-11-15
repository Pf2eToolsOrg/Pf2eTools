const JSON_URL = "data/spells.json";

const META_RITUAL = "Rituals";
const META_TECHNOMAGIC = "Technomagic";

const P_LEVEL = "level";
const P_NORMALISED_TIME= "normalisedTime";
const P_SCHOOL = "school";
const P_NORMALISED_RANGE = "normalisedRange";

const RNG_SPECIAL =  "special";
const RNG_POINT =  "point";
const RNG_LINE =  "line";
const RNG_CUBE = "cube";
const RNG_CONE = "cone";
const RNG_RADIUS = "radius";
const RNG_SPHERE = "sphere";
const RNG_HEMISPHERE  = "hemisphere";
const RNG_SELF = "self";
const RNG_SIGHT = "sight";
const RNG_UNLIMITED = "unlimited";
const RNG_UNLIMITED_SAME_PLANE = "plane";
const RNG_TOUCH = "touch";

const STR_WIZARD = "Wizard";
const STR_FIGHTER = "Fighter";
const STR_ELD_KNIGHT = "Eldritch Knight";
const STR_ROGUE = "Rogue";
const STR_ARC_TCKER = "Arcane Trickster";

const UNT_FEET = "feet";
const UNT_MILES = "miles";

const TM_ACTION = "action";
const TM_B_ACTION = "bonus action";
const TM_REACTION = "reaction";
const TM_ROUND = "round";
const TM_MINS = "minute";
const TM_HRS = "hour";
const TO_HIDE_SINGLETON_TIMES = [TM_ACTION, TM_B_ACTION, TM_REACTION, TM_ROUND];

const SKL_ABJ = "A";
const SKL_EVO = "V";
const SKL_ENC = "E";
const SKL_ILL = "I";
const SKL_DIV = "D";
const SKL_NEC = "N";
const SKL_TRA = "T";
const SKL_CON = "C";
function getSchoolStr(school) {
	if (school === SKL_ABJ) return "Abjuration";
	if (school === SKL_EVO) return "Evocation";
	if (school === SKL_ENC) return "Enchantment";
	if (school === SKL_ILL) return "Illusion";
	if (school === SKL_DIV) return "Divination";
	if (school === SKL_NEC) return "Necromancy";
	if (school === SKL_TRA) return "Transmutation";
	if (school === SKL_CON) return "Conjuration";
}

const CANTRIP = "Cantrip";
function getTblSpellLevelStr (level) {
	if (level === 0) return CANTRIP;
	if (level === 1) return level+"st";
	if (level === 2) return level+"nd";
	if (level === 3) return level+"rd";
	return level+"th";
}
function getSpellLevelStr (level) {
	return level === 0 ? getTblSpellLevelStr(level) : getTblSpellLevelStr(level) + "-level";
}
function getFltrSpellLevelStr(level) {
	return level === 0 ? getTblSpellLevelStr(level) : getTblSpellLevelStr(level) + " level";
}

function getNormalisedTime(time) {
	const firstTime = time[0];
	let multiplier = 1;
	let offset = 0;
	switch (firstTime.unit) {
		case TM_B_ACTION:
			offset = 1;
			break;
		case TM_REACTION:
			offset = 2;
			break;
		case TM_ROUND:
			multiplier = 6;
			break;
		case TM_MINS:
			multiplier = 60;
			break;
		case TM_HRS:
			multiplier = 3600;
			break;
	}
	if (time.length > 1) offset += 1;
	return (multiplier * firstTime.number) + offset;
}

const INCHES_PER_FOOT = 12;
const FEET_PER_MILE = 5280;
function getNormalisedRange(range) {
	let multiplier = 1;
	let distance = 0;
	let offset = 0;

	switch(range.type) {
		case RNG_SPECIAL:
			return 1000000000;
		case RNG_POINT:
			adjustForDistance();
			break;
		case RNG_LINE:
			offset = 1;
			adjustForDistance();
			break;
		case RNG_CONE:
			offset = 2;
			adjustForDistance();
			break;
		case RNG_RADIUS:
			offset = 3;
			adjustForDistance();
			break;
		case RNG_HEMISPHERE:
			offset = 4;
			adjustForDistance();
			break;
		case RNG_SPHERE:
			offset = 5;
			adjustForDistance();
			break;
		case RNG_CUBE:
			offset = 6;
			adjustForDistance();
			break;
	}

	// value in inches, to allow greater granularity
	return (multiplier * distance) + offset;

	function adjustForDistance() {
		const dist = range.distance;
		switch (dist.type) {
			case UNT_FEET:
				multiplier = INCHES_PER_FOOT;
				distance = dist.amount;
				break;
			case UNT_MILES:
				multiplier = INCHES_PER_FOOT*FEET_PER_MILE;
				distance = dist.amount;
				break;
			case RNG_SELF:
				distance = 0;
				break;
			case RNG_TOUCH:
				distance = 1;
				break;
			case RNG_SIGHT:
				multiplier = FEET_PER_MILE*FEET_PER_MILE;
				distance = 12; // assume sight range of person ~100 ft. above the ground
				break;
			case RNG_UNLIMITED_SAME_PLANE: // from BolS, if/when it gets restored
				distance = 900000000;
				break;
			case RNG_UNLIMITED:
				distance = 900000001;
				break;
		}
	}
}

function getTblTimeStr(time) {
	if (time.number === 1 && TO_HIDE_SINGLETON_TIMES.includes(time.unit)) {
		return time.unit.uppercaseFirst();
	} else {
		return getTimeStrHelper(time);
	}
}

function getTimeStr(times) {
	return times.map(t => `${getTimeStrHelper(t)}${t.condition ? `, ${t.condition}`: ""}`).join(" or  ");
}

function getTimeStrHelper(time) {
	return `${time.number} ${time.unit}${time.number > 1 ? "s" : ""}`
}

function getRangeStr(range) {
	switch(range.type) {
		case RNG_SPECIAL:
			return "Special";
		case RNG_POINT:
			return renderPoint();
		case RNG_LINE:
		case RNG_CUBE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_SPHERE:
		case RNG_HEMISPHERE:
			return renderArea();
	}

	function renderPoint() {
		const dist = range.distance;
		switch (dist.type) {
			case UNT_FEET:
			case UNT_MILES:
				return `${dist.amount} ${dist.amount === 1 ? getSingletonUnit(dist.type) : dist.type}`;
			case RNG_SELF:
				return "Self";
			case RNG_SIGHT:
				return "Sight";
			case RNG_UNLIMITED:
				return "Unlimited";
			case RNG_TOUCH:
				return "Touch";
		}
	}
	function renderArea() {
		const size = range.distance;
		return `${size.amount}-${getSingletonUnit(size.type)}${getAreaStyleStr()}`;

		function getAreaStyleStr() {
			return range.type === RNG_SPHERE || range.type === RNG_HEMISPHERE ? "-radius" : " " + range.type;
		}
	}
}

function getSingletonUnit(unit) {
	if (unit === UNT_FEET) return "foot";
	if (unit.charAt(unit.length-1) === "s") return unit.slice(0, -1);
	return unit;
}

function getFltrActionVal(unit) {
	unit = unit.toLowerCase();
	return getSingletonUnit(unit);
}

function getComponentsStr(comp) {
	const out = [];
	if (comp.v) out.push("V");
	if (comp.s) out.push("S");
	if (comp.m) {
		out.push("M");
		if (comp.m.length) out.push(`(${comp.m})`)
	}
	return out.join(", ");
}

function getDurationStr(dur) {
	return dur.map(d => {
		switch (d.type) {
			case "special":
				return "Special";
			case "instant":
				return `Instantaneous${d.condition ? ` (${d.condition})` : ""}`;
			case "timed":
				const con = d.concentration;
				const upTo = d.duration.upTo;
				return `${con ? "Concentration, " : ""}${upTo && con ? "u" : upTo ? "U" : ""}${upTo ? "p to " : ""}${d.duration.amount} ${d.duration.amount === 1 ? getSingletonUnit(d.duration.type) : d.duration.type}`;
			case "permanent":
				return `Until ${d.ends.map(m => m === "dispell" ? "dispelled" : m === "trigger" ? "triggered" : undefined).join(" or ")}`

		}
	}).join(" or ") + (dur.length > 1 ? " (see below)" : "");
}

function getTblClassesStr(classes) {
	return classes.fromClassList.sort((a, b) => ascSort(a.name, b.name)).map(c => `<span title="Source: ${parse_sourceJsonToFull(c.source)}">${c.name}</span>`).join(", ") +
		(classes.fromSubclass ?
			", " + classes.fromSubclass.sort((a, b) => {
				const byName = ascSort(a.class.name, b.class.name);
				return byName ? byName : ascSort(a.subclass.name, b.subclass.name);
			}).map(c => `<span title="Source: ${parse_sourceJsonToFull(c.class.source)}">${c.class.name}</span> <span title="Source: ${parse_sourceJsonToFull(c.class.source)}">(${c.subclass.name})</span>`).join(", ") : "")
}

function getClassFilterStr(c) {
	return `${c.name}${c.source !== SRC_PHB ? ` (${parse_sourceJsonToAbv(c.source)})` : ""}`;
}

window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

let spellList;
function onJsonLoad(data) {
	tableDefault = $("#stats").html();

	spellList = data.spell;

	const filterAndSearchBar = document.getElementById(ID_SEARCH_BAR);

	// TODO concentration filter
	// TODO components filter
	const sourceFilter = new Filter("Source", FLTR_SOURCE, [], parse_sourceJsonToFull);
	const levelFilter = new Filter("Level", FLTR_LEVEL, [], getFltrSpellLevelStr);
	const metaFilter = new Filter("Type", FLTR_META, [META_RITUAL, META_TECHNOMAGIC]);
	const schoolFilter = new Filter("School", FLTR_SCHOOL, [], getSchoolStr);
	const timeFilter = new Filter("Cast Time", FLTR_ACTION,
		[
			"Action",
			"Bonus Action",
			"Reaction",
			"Rounds",
			"Minutes",
			"Hours"
		], Filter.asIs, getFltrActionVal);
	const rangeFilter = new Filter("Range", FLTR_RANGE, [], getRangeStr, getRangeStr);
	const normalizedRangeItems = [];
	const classFilter = new Filter("Class", FLTR_CLASS, []);
	const filterList = [
		sourceFilter,
		levelFilter,
		metaFilter,
		schoolFilter,
		timeFilter,
		rangeFilter,
		classFilter
	];
	const filterBox = new FilterBox(filterAndSearchBar, filterList);

	for (let i = 0; i < spellList.length; i++) {
		const spell = spellList[i];

		let levelText = getTblSpellLevelStr(spell.level);
		if (spell.meta && spell.meta.ritual) levelText += " (ritual)";
		if (spell.meta && spell.meta.technomagic) levelText += " (tech.)";

		if (spell.classes.fromClassList.filter(c => c.name === STR_WIZARD && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) spell.classes.fromSubclass = [];
			spell.classes.fromSubclass.push({class: {name: STR_FIGHTER, source: SRC_PHB}, subclass: {name: STR_ELD_KNIGHT, source: SRC_PHB}});
			spell.classes.fromSubclass.push({class: {name: STR_ROGUE, source: SRC_PHB}, subclass: {name: STR_ARC_TCKER, source: SRC_PHB}})
		}

		// used for sorting
		spell[P_NORMALISED_TIME] = getNormalisedTime(spell.time);
		spell[P_NORMALISED_RANGE] = getNormalisedRange(spell.range);

		// populate table
		const tableItem = `
			<li class='row' ${FLTR_ID}="${i}">
				<a id='${i}' href='#${encodeForHash([spell.name, spell.source])}' title="${spell.name}">
					<span class='name col-xs-3 col-xs-3-5'>${spell.name}</span>
					<span class='source col-xs-1 source${spell.source}' title="${parse_sourceJsonToFull(spell.source)}">${parse_sourceJsonToAbv(spell.source)}</span>
					<span class='level col-xs-1 col-xs-1-7'>${levelText}</span>
					<span class='time col-xs-1 col-xs-1-7' title="${getTimeStr(spell.time)}">${getTblTimeStr(spell.time[0])}</span>
					<span class='school col-xs-1 col-xs-1-7 school_${spell.school}' title="${getSchoolStr(spell.school)}">${getSchoolStr(spell.school)}</span>
					<span class='range col-xs-2 col-xs-2-4'>${getRangeStr(spell.range)}</span>
					
					<span class='classes' style='display: none'>${getTblClassesStr(spell.classes)}</span>
				</a>
			</li>`;
		$("ul.spells").append(tableItem);

		// populate filters
		if ($.inArray(spell.source, sourceFilter.items) === -1) sourceFilter.items.push(spell.source);
		if ($.inArray(spell.level, levelFilter.items) === -1) levelFilter.items.push(spell.level);
		if ($.inArray(spell.school, schoolFilter.items) === -1) schoolFilter.items.push(spell.school);
		if ($.inArray(spell[P_NORMALISED_RANGE], normalizedRangeItems) === -1) {
			rangeFilter.items.push(spell.range);
			normalizedRangeItems.push(spell[P_NORMALISED_RANGE]);
		}
		// TODO good solution for subclasses
		spell.classes.fromClassList.forEach(c => {
			const withSrc = getClassFilterStr(c);
			if($.inArray(withSrc, classFilter.items) === -1) classFilter.items.push(withSrc);
		});
	}

	// sort filters
	sourceFilter.items.sort(ascSort);
	levelFilter.items.sort(ascSortSpellLevel);
	metaFilter.items.sort(ascSort);
	schoolFilter.items.sort(ascSort);
	rangeFilter.items.sort(ascSortSpellRange);
	classFilter.items.sort(ascSort);

	function ascSortSpellLevel(a, b) {
		if (a === b) return 0;
		if (a === CANTRIP) return -1;
		if (b === CANTRIP) return 1;
		return ascSort(a, b);
	}

	function ascSortSpellRange(a, b) {
		return getNormalisedRange(a) - getNormalisedRange(b);
	}

	const list = search({
		valueNames: ["name", "source", "level", "time", "school", "range", "classes"],
		listClass: "spells"
	});

	// add filter reset to reset button
	document.getElementById(ID_RESET_BUTTON).addEventListener(EVNT_CLICK, function() {
		filterBox.reset();
		deselectUaEepc(true);
	}, false);

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		function () {
			list.filter(function(item) {
				const f = filterBox.getValues();
				const s = spellList[$(item.elm).attr(FLTR_ID)];

				const rightSource = f[sourceFilter.header][FilterBox.VAL_SELECT_ALL] || f[sourceFilter.header][s.source];
				const rightLevel = f[levelFilter.header][FilterBox.VAL_SELECT_ALL] || f[levelFilter.header][s.level];
				const rightMeta = f[metaFilter.header][FilterBox.VAL_SELECT_ALL]
					|| (s.meta && ((f[metaFilter.header][META_RITUAL] && s.meta.ritual) || (f[metaFilter.header][META_TECHNOMAGIC]) && s.meta.technomagic));
				const rightSchool = f[schoolFilter.header][FilterBox.VAL_SELECT_ALL] || f[schoolFilter.header][s.school];
				const rightTime = f[timeFilter.header][FilterBox.VAL_SELECT_ALL] || s.time.map(t => f[timeFilter.header][t.unit]).filter(b => b).length > 0;
				const rightRange = f[rangeFilter.header][FilterBox.VAL_SELECT_ALL] || f[rangeFilter.header][getRangeStr(s.range)];
				// TODO good solution for subclasses
				const rightClass = f[classFilter.header][FilterBox.VAL_SELECT_ALL]
					|| s.classes.fromClassList.map(c => f[classFilter.header][getClassFilterStr(c)]).filter(b => b).length > 0;

				return rightSource && rightLevel && rightMeta && rightSchool && rightTime && rightRange && rightClass;
			});
		}
	);

	$("#filtertools").find("button.sort").on(EVNT_CLICK, function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		list.sort($(this).data("sort"), { order: $(this).attr("sortby"), sortFunction: sortSpells });
	});

	// default de-select UA and EEPC sources
	deselectUaEepc();

	initHistory();

	function deselectUaEepc(hardDeselect) {
		hardDeselect = hardDeselect === undefined || hardDeselect === null ? false : hardDeselect;
		if (window.location.hash.length) {
			let spellSource = spellList[getSelectedListElement().attr("id")].source;
			if (hardDeselect && (spellSource === SRC_EEPC || spellSource.startsWith(SRC_UA_PREFIX))) {
				deSelNoHash();
			} else {
				spellSource = spellList[getSelectedListElement().attr("id")].source;
				filterBox.deselectIf(function (val) {
					return val === SRC_EEPC && spellSource !== val || val.startsWith(SRC_UA_PREFIX) && spellSource !== val
				}, sourceFilter.header);
			}
		} else {
			deSelNoHash();
		}
		function deSelNoHash() {
			filterBox.deselectIf(function(val) { return val === SRC_EEPC || val.startsWith(SRC_UA_PREFIX) }, sourceFilter.header);
		}
	}
}

function sortSpells(a, b, o) {
	a = spellList[a.elm.getAttribute(FLTR_ID)];
	b = spellList[b.elm.getAttribute(FLTR_ID)];

	if (o.valueName === "name") {
		return fallback();
	}

	if (o.valueName === "source") {
		const bySrc = ascSort(a.source, b.source);
		return bySrc !== 0 ? bySrc : ascSort(a.name, b.name);
	}

	if (o.valueName === "level") {
		return orFallback(ascSort, P_LEVEL);
	}

	if (o.valueName === "time") {
		return orFallback(ascSort, P_NORMALISED_TIME);
	}

	if (o.valueName === "school") {
		return orFallback(ascSort, P_SCHOOL);
	}

	if (o.valueName === "range") {
		return orFallback(ascSort, P_NORMALISED_RANGE);
	}

	return 0;

	function byName() {
		return ascSort(a.name, b.name);
	}
	function bySource() {
		return ascSort(a.source, b.source);
	}
	function fallback() {
		const onName = byName();
		return onName !== 0 ? onName : bySource();
	}
	function orFallback(func, prop) {
		const initial = func(a[prop], b[prop]);
		return initial !== 0 ? initial : fallback();
	}
}

const renderer = new EntryRenderer();
function loadhash (id) {
	$("#stats").html(tableDefault);
	const spell = spellList[id];

	const renderStack = [];

	renderStack.push(`<tr><th id="name" colspan="6"><span style="float: left">${spell.name}</span><span style="float: right" class="source${spell.source}" title="${parse_sourceJsonToFull(spell.source)}">${parse_sourceJsonToAbv(spell.source)}</span></th></tr>`);

	let levelSchoolStr = spell.level === 0 ? `${getSchoolStr(spell.school)} ${getSpellLevelStr(spell.level)}`: `${getSpellLevelStr(spell.level)} ${getSchoolStr(spell.school)}`;
	// these tags are (so far) mutually independent, so we don't need to combine the text
	if (spell.meta && spell.meta.ritual) levelSchoolStr += " (ritual)";
	if (spell.meta && spell.meta.technomagic) levelSchoolStr += " (technomagic)";
	renderStack.push(`<tr><td id="levelschoolritual" style="text-transform: lowercase;" colspan="6"><span>${levelSchoolStr}</span></td></tr>`);

	renderStack.push(`<tr><td id="castingtime" colspan="6"><span class="bold">Casting Time: </span>${getTimeStr(spell.time)}</td></tr>`);

	renderStack.push(`<tr><td id="range" colspan="6"><span class="bold">Range: </span>${getRangeStr(spell.range)}</td></tr>`);

	renderStack.push(`<tr><td id="components" colspan="6"><span class="bold">Components: </span>${getComponentsStr(spell.components)}</td></tr>`);

	renderStack.push(`<tr><td id="range" colspan="6"><span class="bold">Duration: </span>${getDurationStr(spell.duration)}</td></tr>`);

	renderStack.push(`<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>`);

	const entryList = {type: "entries", entries: spell.entries};

	renderer.recursiveEntryRender(entryList, renderStack, 1, `<tr class='text'><td colspan='6' class='text'>`, `</td></tr>`, true);

	renderStack.push(`<tr><td id="classes" colspan="6"><span class="bold">Classes: </span>${getTblClassesStr(spell.classes)}</td></tr>`);

	const topBorder = $("#topBorder");
	topBorder.after(renderStack.join(""));
}
