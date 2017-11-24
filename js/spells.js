const JSON_URL = "data/spells.json";

// toss these into the "Tags" section to save screen space
const META_ADD_CONC = "Concentration";
const META_ADD_V = "Verbal";
const META_ADD_S = "Somatic";
const META_ADD_M = "Material";
// real meta tags
const META_RITUAL = "Ritual";
const META_TECHNOMAGIC = "Technomagic";

const P_LEVEL = "level";
const P_NORMALISED_TIME= "normalisedTime";
const P_SCHOOL = "school";
const P_NORMALISED_RANGE = "normalisedRange";

const STR_WIZARD = "Wizard";
const STR_FIGHTER = "Fighter";
const STR_ROGUE = "Rogue";
const STR_CLERIC = "Cleric";
const STR_SORCERER = "Sorcerer";
const STR_ELD_KNIGHT = "Eldritch Knight";
const STR_ARC_TCKER = "Arcane Trickster";
const STR_DIV_SOUL = "Divine Soul";
const STR_FAV_SOUL_V2 = "Favored Soul v2 (UA)";
const STR_FAV_SOUL_V3 = "Favored Soul v3 (UA)";

const TM_ACTION = "action";
const TM_B_ACTION = "bonus action";
const TM_REACTION = "reaction";
const TM_ROUND = "round";
const TM_MINS = "minute";
const TM_HRS = "hour";
const TO_HIDE_SINGLETON_TIMES = [TM_ACTION, TM_B_ACTION, TM_REACTION, TM_ROUND];

const F_RNG_POINT = "Point";
const F_RNG_AREA = "Area";
const F_RNG_SELF = "Self";
const F_RNG_TOUCH = "Touch";
const F_RNG_SPECIAL = "Special";

function getFltrSpellLevelStr(level) {
	return level === 0 ? Parser.spLevelToFull(level) : Parser.spLevelToFull(level) + " level";
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

function getRangeType(range) {
	switch(range.type) {
		case RNG_SPECIAL:
			return F_RNG_SPECIAL;
		case RNG_POINT:
			switch (range.distance.type) {
				case RNG_SELF:
					return F_RNG_SELF;
				case RNG_TOUCH:
					return F_RNG_TOUCH;
				default:
					return F_RNG_POINT;
			}
		case RNG_LINE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_HEMISPHERE:
		case RNG_SPHERE:
		case RNG_CUBE:
			return F_RNG_AREA
	}
}

function getTblTimeStr(time) {
	if (time.number === 1 && TO_HIDE_SINGLETON_TIMES.includes(time.unit)) {
		return time.unit.uppercaseFirst();
	} else {
		return Parser.getTimeToFull(time);
	}
}

function getFltrActionVal(unit) {
	unit = unit.toLowerCase();
	return Parser.getSingletonUnit(unit);
}

function getClassFilterStr(c) {
	const nm = c.name.split("(")[0].trim();
	return `${nm}${c.source !== SRC_PHB ? ` (${Parser.sourceJsonToAbv(c.source)})` : ""}`;
}

function deselectUaEepc(val) {
	if (window.location.hash.length) {
		let spellSource = spellList[getSelectedListElement().attr("id")].source;
		if (spellSource === SRC_EEPC || spellSource.startsWith(SRC_UA_PREFIX)) {
			return deSelNoHash();
		} else {
			return val === SRC_EEPC && spellSource !== val || val.startsWith(SRC_UA_PREFIX) && spellSource !== val;
		}
	} else {
		return deSelNoHash();
	}
	function deSelNoHash() {
		return val === SRC_EEPC || val.startsWith(SRC_UA_PREFIX);
	}
}

function deselectSubclasses(val) {
	return true;
}

window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

let spellList;
function onJsonLoad(data) {
	tableDefault = $("#stats").html();

	spellList = data.spell;

	const filterAndSearchBar = document.getElementById(ID_SEARCH_BAR);

	const sourceFilter = new Filter({header: "Source", items: [], displayFn: Parser.sourceJsonToFullTrimUa, desel: deselectUaEepc});
	const levelFilter = new Filter({header: "Level", items: [], displayFn: getFltrSpellLevelStr});
	const classFilter = new Filter({header: "Class", items: []});
	const subclassFilter = new Filter({header: "Subclass", items: [], desel: deselectSubclasses});
	const metaFilter = new Filter({
		header: "Tag",
		items: [META_ADD_CONC, META_ADD_V, META_ADD_S, META_ADD_M, META_RITUAL, META_TECHNOMAGIC]
	});
	const schoolFilter = new Filter({header: "School", items: [], displayFn: Parser.spSchoolAbvToFull});
	const timeFilter = new Filter({
		header: "Cast Time",
		items: [
			"Action",
			"Bonus Action",
			"Reaction",
			"Rounds",
			"Minutes",
			"Hours"
		],
		valueFn: getFltrActionVal
	});
	const rangeFilter = new Filter({
		header: "Range",
		items: [
			F_RNG_SELF,
			F_RNG_TOUCH,
			F_RNG_POINT,
			F_RNG_AREA,
			F_RNG_SPECIAL
		]
	});
	const filterList = [
		sourceFilter,
		levelFilter,
		classFilter,
		subclassFilter,
		metaFilter,
		schoolFilter,
		timeFilter,
		rangeFilter
	];
	const filterBox = new FilterBox(filterAndSearchBar, filterList);

	const spellTable = $("ul.spells");
	let tempString = "";
	for (let i = 0; i < spellList.length; i++) {
		const spell = spellList[i];

		let levelText = Parser.spLevelToFull(spell.level);
		if (spell.meta && spell.meta.ritual) levelText += " (rit.)";
		if (spell.meta && spell.meta.technomagic) levelText += " (tec.)";

		// add eldritch knight and arcane trickster
		if (spell.classes.fromClassList.filter(c => c.name === STR_WIZARD && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) spell.classes.fromSubclass = [];
			spell.classes.fromSubclass.push({
				class: {name: STR_FIGHTER, source: SRC_PHB},
				subclass: {name: STR_ELD_KNIGHT, source: SRC_PHB}
			});
			spell.classes.fromSubclass.push({
				class: {name: STR_ROGUE, source: SRC_PHB},
				subclass: {name: STR_ARC_TCKER, source: SRC_PHB}
			});
			if (spell.level > 4) {
				spell.scrollNote = true;
			}
		}

		// add divine soul, favored soul v2, favored soul v3
		if (spell.classes.fromClassList.filter(c => c.name === STR_CLERIC && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) spell.classes.fromSubclass = [];
			spell.classes.fromSubclass.push({
				class: {name: STR_SORCERER, source: SRC_PHB},
				subclass: {name: STR_DIV_SOUL, source: SRC_XGE}
			});
			spell.classes.fromSubclass.push({
				class: {name: STR_SORCERER, source: SRC_PHB},
				subclass: {name: STR_FAV_SOUL_V2, source: SRC_UAS}
			});
			spell.classes.fromSubclass.push({
				class: {name: STR_SORCERER, source: SRC_PHB},
				subclass: {name: STR_FAV_SOUL_V3, source: SRC_UARSC}
			});
		}

		// used for sorting
		spell[P_NORMALISED_TIME] = getNormalisedTime(spell.time);
		spell[P_NORMALISED_RANGE] = getNormalisedRange(spell.range);

		// populate table
		tempString += `
			<li class='row' ${FLTR_ID}="${i}">
				<a id='${i}' href='#${encodeForHash([spell.name, spell.source])}' title="${spell.name}">
					<span class='name col-xs-3 col-xs-3-5'>${spell.name}</span>
					<span class='source col-xs-1 source${spell.source}' title="${Parser.sourceJsonToFull(spell.source)}">${Parser.sourceJsonToAbv(spell.source)}</span>
					<span class='level col-xs-1 col-xs-1-7'>${levelText}</span>
					<span class='time col-xs-1 col-xs-1-7' title="${Parser.spTimeListToFull(spell.time)}">${getTblTimeStr(spell.time[0])}</span>
					<span class='school col-xs-1 col-xs-1-7 school_${spell.school}' title="${Parser.spSchoolAbvToFull(spell.school)}">${Parser.spSchoolAbvToFull(spell.school)}</span>
					<span class='range col-xs-2 col-xs-2-4'>${Parser.spRangeToFull(spell.range)}</span>
					
					<span class='classes' style='display: none'>${Parser.spClassesToFull(spell.classes)}</span>
				</a>
			</li>`;

		// populate filters
		if ($.inArray(spell.source, sourceFilter.items) === -1) sourceFilter.items.push(spell.source);
		if ($.inArray(spell.level, levelFilter.items) === -1) levelFilter.items.push(spell.level);
		if ($.inArray(spell.school, schoolFilter.items) === -1) schoolFilter.items.push(spell.school);
		if (spell.classes.fromSubclass) {
			spell.classes.fromSubclass.forEach(c => {
				const scWithSrc = getClassFilterStr(c.subclass);
				if ($.inArray(scWithSrc, subclassFilter.items) === -1) subclassFilter.items.push(scWithSrc);
			});
		}
		spell.classes.fromClassList.forEach(c => {
			const withSrc = getClassFilterStr(c);
			if($.inArray(withSrc, classFilter.items) === -1) classFilter.items.push(withSrc);
		});
	}

	spellTable.append(tempString);

	// sort filters
	sourceFilter.items.sort(ascSort);
	levelFilter.items.sort(ascSortSpellLevel);
	schoolFilter.items.sort(ascSort);
	classFilter.items.sort(ascSort);
	subclassFilter.items.sort(ascSort);

	function ascSortSpellLevel(a, b) {
		if (a === b) return 0;
		if (a === STR_CANTRIP) return -1;
		if (b === STR_CANTRIP) return 1;
		return ascSort(a, b);
	}

	const list = search({
		valueNames: ["name", "source", "level", "time", "school", "range", "classes"],
		listClass: "spells"
	});

	// add filter reset to reset button
	document.getElementById(ID_RESET_BUTTON).addEventListener(EVNT_CLICK, function() {
		filterBox.reset();
	}, false);

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange() {
		list.filter(function(item) {
			const f = filterBox.getValues();
			const s = spellList[$(item.elm).attr(FLTR_ID)];

			let valGroup;

			const rightSource = f[sourceFilter.header][FilterBox.VAL_SELECT_ALL] || f[sourceFilter.header][s.source];
			const rightLevel = f[levelFilter.header][FilterBox.VAL_SELECT_ALL] || f[levelFilter.header][s.level];
			const rightMeta = handleMetaConditions(s, f[metaFilter.header], metaFilter.isInverted());
			const rightSchool = f[schoolFilter.header][FilterBox.VAL_SELECT_ALL] || f[schoolFilter.header][s.school];
			const rightTime = f[timeFilter.header][FilterBox.VAL_SELECT_ALL] || s.time.map(t => f[timeFilter.header][t.unit]).filter(b => b).length > 0;
			const rightRange = f[rangeFilter.header][FilterBox.VAL_SELECT_ALL] || f[rangeFilter.header][getRangeType(s.range)];
			let rightClass;
			valGroup = f[classFilter.header];
			if (!classFilter.isInverted()) {
				rightClass = f[classFilter.header][FilterBox.VAL_SELECT_ALL]
					|| s.classes.fromClassList.filter(c => valGroup[getClassFilterStr(c)]).length > 0;
			} else {
				rightClass = f[classFilter.header][FilterBox.VAL_SELECT_ALL]
					|| s.classes.fromClassList.filter(c => !valGroup[getClassFilterStr(c)]).length === 0;
			}
			let rightSubclass;
			valGroup = f[subclassFilter.header];
			if (!subclassFilter.isInverted()) {
				rightSubclass = f[subclassFilter.header][FilterBox.VAL_SELECT_ALL]
					|| s.classes.fromSubclass && s.classes.fromSubclass.filter(sc => valGroup[getClassFilterStr(sc.subclass)]).length > 0;
			} else {
				rightSubclass = f[subclassFilter.header][FilterBox.VAL_SELECT_ALL]
					|| !s.classes.fromSubclass || s.classes.fromSubclass.filter(sc => !valGroup[getClassFilterStr(sc.subclass)]).length === 0;
			}

			let rightClassAndSubclass;
			if ( (classFilter.isInverted() || subclassFilter.isInverted()) && !(classFilter.isInverted() && !subclassFilter.isInverted()) ) {
				rightClassAndSubclass = rightClass && rightSubclass;
			} else {
				rightClassAndSubclass = rightClass || rightSubclass;
			}

			return rightSource && rightLevel && rightMeta && rightSchool && rightTime && rightRange && rightClassAndSubclass;
		});
	}
	function handleMetaConditions(s, valGroup, isInverted) {
		if (valGroup[FilterBox.VAL_SELECT_ALL]) return true;
		if (!isInverted) {
			return ( s.meta && ((valGroup[META_RITUAL] && s.meta.ritual) || (valGroup[META_TECHNOMAGIC] && s.meta.technomagic)) )
				|| ( valGroup[META_ADD_CONC] && s.duration.filter(d => d.concentration).length )
				|| ( valGroup[META_ADD_V] && s.components.v )
				|| ( valGroup[META_ADD_S] && s.components.s )
				|| ( valGroup[META_ADD_M] && s.components.m );
		} else {
			return ( implies(s.meta && s.meta.ritual, valGroup[META_RITUAL]) )
				&& ( implies(s.meta && s.meta.technomagic, valGroup[META_TECHNOMAGIC]) )
				&& ( implies(s.duration.filter(d => d.concentration).length, valGroup[META_ADD_CONC]) )
				&& ( implies(s.components.v, valGroup[META_ADD_V]) )
				&& ( implies(s.components.s, valGroup[META_ADD_S]) )
				&& ( implies(s.components.m, valGroup[META_ADD_M]) );
		}
	}

	$("#filtertools").find("button.sort").on(EVNT_CLICK, function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		list.sort($(this).data("sort"), { order: $(this).attr("sortby"), sortFunction: sortSpells });
	});

	initHistory();
	handleFilterChange();
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

	renderStack.push(`<tr><th id="name" colspan="6"><span style="float: left">${spell.name}</span><span style="float: right" class="source${spell.source}" title="${Parser.sourceJsonToFull(spell.source)}">${Parser.sourceJsonToAbv(spell.source)}</span></th></tr>`);

	renderStack.push(`<tr><td id="levelschoolritual" style="text-transform: lowercase;" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(spell.level, spell.school, spell.meta)}</span></td></tr>`);

	renderStack.push(`<tr><td id="castingtime" colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull(spell.time)}</td></tr>`);

	renderStack.push(`<tr><td id="range" colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(spell.range)}</td></tr>`);

	renderStack.push(`<tr><td id="components" colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(spell.components)}</td></tr>`);

	renderStack.push(`<tr><td id="range" colspan="6"><span class="bold">Duration: </span>${Parser.spDurationToFull(spell.duration)}</td></tr>`);

	renderStack.push(`<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>`);

	const entryList = {type: "entries", entries: spell.entries};

	renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
	renderer.recursiveEntryRender(entryList, renderStack, 1);

	if (spell.entriesHigherLevel) {
		const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
		renderer.recursiveEntryRender(higherLevelsEntryList, renderStack, 2);
	}

	renderStack.push(`</td></tr>`);

	renderStack.push(`<tr class="text"><td id="classes" colspan="6"><span class="bold">Classes: </span>${Parser.spMainClassesToFull(spell.classes)}</td></tr>`);

	if (spell.classes.fromSubclass) {
		const currentAndLegacy = Parser.spSubclassesToCurrentAndLegacyFull(spell.classes);
		renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Subclasses: </span>${currentAndLegacy[0]}</td></tr>`);
		if (currentAndLegacy[1]) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Subclasses (legacy): </span>${currentAndLegacy[1]}</section></td></tr>`);
		}
	}

	if (spell.scrollNote) {
		renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
		renderer.recursiveEntryRender(
			`{@italic Note: Both the {@class ${STR_FIGHTER} (${STR_ELD_KNIGHT})} and the {@class ${STR_ROGUE} (${STR_ARC_TCKER})} spell lists include all {@class ${STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`
			, renderStack, 2);
		renderStack.push(`</section></td></tr>`);
	}

	const topBorder = $("#topBorder");
	topBorder.after(renderStack.join(""));
}
