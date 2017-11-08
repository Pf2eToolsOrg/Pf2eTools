function parseschool (school) {
	if (school === "A") return "Abjuration";
	if (school === "EV") return "Evocation";
	if (school === "EN") return "Enchantment";
	if (school === "I") return "Illusion";
	if (school === "D") return "Divination";
	if (school === "N") return "Necromancy";
	if (school === "T") return "Transmutation";
	if (school === "C") return "Conjuration";
	return "";
}

const CANTRIP = "Cantrip";
function parsespelllevel (level) {
	if (isNaN (level)) return "";
	if (level === "0") return CANTRIP;
	if (level === "2") return level+"nd";
	if (level === "3") return level+"rd";
	if (level === "1") return level+"st";
	return level+"th";
}

function normalisetime(time) {
	if (time === "1 action") return 0;
	if (time === "1 action or 8 hours") return 1;
	if (time === "1 bonus action") return 2;
	if (time === "1 reaction") return 3;
	if (time === "1 reaction ...") return 4;
	const offset=time.indexOf(" ");
	if (offset < 0) return 100000;
	let multiplier=1;
	if (time.indexOf("round") > -1) multiplier=6;
	if (time.indexOf("minute") > -1) multiplier=60;
	if (time.indexOf("hour") > -1) multiplier=3600;
	return multiplier*Number(time.substr(0,offset));
}

function normaliserange(range) {
	let out=0;
	let adjust = 0;
	range = range.toLowerCase();
	if (range === "self") return -1;
	if (range === "touch") return 2;
	if (range === "sight") return 2*5280*12; // typically a few miles out-of-doors; the following values are simply very large numbers appropriately ordered in size
	if (range === "unlimited on the same plane") return 900000000; // a value from BoLS, so that it still works if/when we add it back in
	if (range === "unlimited") return 900000001;
	if (range === "special") return 1000000000;
	if (range === "varies") return 1000000001;
	if (range.substr(0, 6) === "self (") {
		range = range.substr(6).replace("-"," ");
		adjust = 1; // This will make the "self (" ranges appear immediately after the equivalent non-self ranges
	}
	if (range.indexOf("line)") > -1) adjust += 1;
	if (range.indexOf("radius)") > -1) adjust += 2;
	if (range.indexOf("cone)") > -1) adjust += 3;
	if (range.indexOf("hemisphere)") > -1) adjust += 4;
	if (range.indexOf(" sphere)") > -1) adjust += 5;
	if (range.indexOf("cube)") > -1) adjust += 6;
	if (range.indexOf(" ") > -1) out = 12*parseInt(range.substr(0,range.indexOf(" "))); // convert the out value to inches (to make single feet range differences larger than any adjustment)
	if (range.indexOf("mile") > -1) out = out * 5280;
	return out+adjust;
}

function trimcastingtime(time) {
	return time.indexOf(", which you take") > -1 ? time.substr(0, time.indexOf(", which you take")).trim()+" ..." : time.trim();
}

const META_RITUAL = "Rituals";
const META_TECHNOMAGIC = "Technomagic";

window.onload = function load() {
	tabledefault = $("#stats").html();

	const spelllist = spelldata.compendium.spell;

	const filterAndSearchBar = document.getElementById(ID_SEARCH_BAR);

	const sourceFilter = new Filter("Source", FLTR_SOURCE, [], parse_sourceJsonToFull, Filter.asIs);
	const levelFilter = new Filter("Level", FLTR_LEVEL, [], Filter.asIs, Filter.asIs);
	const metaFilter = new Filter("Type", FLTR_META, [], Filter.asIs, Filter.asIs);
	const schoolFilter = new Filter("School", FLTR_SCHOOL, [], parseschool, Filter.asIs);
	const timeFilter = new Filter("Cast Time", FLTR_ACTION,
		[
			"Actions",
			"Reactions",
			"Rounds",
			"Minutes",
			"Hours"
		], Filter.asIs, parse_stringToSlug);
	const rangeFilter = new Filter("Range", FLTR_RANGE, [], Filter.asIs, Filter.asIs);
	const classFilter = new Filter("Class", FLTR_CLASS, [], Filter.asIs, parse_stringToSlug);
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

	for (let i = 0; i < spelllist.length; i++) {
		const curspell = spelllist[i];
		const name = curspell.name;
		let leveltext = parsespelllevel(curspell.level);
		if (curspell.ritual === "YES") leveltext += " (ritual)";
		if (curspell.technomagic === "YES") leveltext += " (tech.)";
		if (!curspell.source) curspell.source = "PHB";
		if (!curspell.range) curspell.range = "Varies";
		const classlist = curspell.classes.split(",");
		for (let a = 0; a < classlist.length; a++) {
			classlist[a] = classlist[a].trim();
			if ($.inArray(classlist[a], classFilter.items) === -1) classFilter.items.push(classlist[a]);
			classlist[a] = parse_stringToSlug(classlist[a]);
		}
		const classFilterList = classlist.join(FLTR_LIST_SEP);
		const metaTags = [];
		if (curspell.ritual === "YES") metaTags.push(META_RITUAL);
		if (curspell.technomagic === "YES") metaTags.push(META_TECHNOMAGIC);
		const metaTagsString = metaTags.join(FLTR_LIST_SEP);
		let action = trimcastingtime(curspell.time).split(" ")[1];
		if (action.charAt(action.length-1) === "s") action = action.substr(0, action.length-1);
		action += "s";
		const spellFilterText = parsespelllevel(curspell.level) === CANTRIP ? parsespelllevel(curspell.level) : parsespelllevel(curspell.level) + " level";

		// populate table
		const toadd = `<li class='row' ${FLTR_LEVEL}='${spellFilterText}' ${FLTR_SCHOOL}='${curspell.school}' ${FLTR_SOURCE}='${curspell.source}' ${FLTR_RANGE}='${curspell.range}' ${FLTR_CLASS}='${classFilterList}' ${FLTR_META}='${metaTagsString}' ${FLTR_ACTION}='${action}'><a id='${i}' href='#${encodeURIComponent(name).toLowerCase().replace("'","%27")}' title="${name}"><span class='name col-xs-3 col-xs-3-5'>${name}</span> <span class='source col-xs-1' title="${parse_sourceJsonToFull(curspell.source)}">${parse_sourceJsonToAbv(curspell.source)}</span> <span class='level col-xs-1 col-xs-1-7'>${leveltext}</span> <span class='time col-xs-1 col-xs-1-7'>${trimcastingtime(curspell.time)}</span> <span class='school col-xs-1 col-xs-1-7'>${parseschool(curspell.school)}</span> <span class='classes' style='display: none'>${curspell.classes}</span> <span class='range col-xs-2 col-xs-2-4'>${curspell.range}</span></a></li>`;
		$("ul.spells").append(toadd);



		// populate filters
		if ($.inArray(curspell.source, sourceFilter.items) === -1) sourceFilter.items.push(curspell.source);
		if ($.inArray(spellFilterText, levelFilter.items) === -1) levelFilter.items.push(spellFilterText);
		for (let j = 0; j < metaTags.length; ++j) {
			const aMeta = metaTags[j];
			if ($.inArray(aMeta, metaFilter.items) === -1) metaFilter.items.push(aMeta);
		}
		if ($.inArray(curspell.school, schoolFilter.items) === -1) schoolFilter.items.push(curspell.school);
		if ($.inArray(curspell.range, rangeFilter.items) === -1) rangeFilter.items.push(curspell.range);
	}

	// sort filters
	sourceFilter.items.sort(ascSort);
	levelFilter.items.sort(ascSortSpellLevel);
	metaFilter.items.sort(ascSort);
	schoolFilter.items.sort(ascSort);
	rangeFilter.items.sort(ascSortSpellRange);
	classFilter.items.sort(ascSortSpellClass);


	function ascSortSpellLevel(a, b) {
		if (a === b) return 0;
		if (a === CANTRIP) return -1;
		if (b === CANTRIP) return 1;
		return ascSort(a, b);
	}
	function ascSortSpellRange(a, b) {
		return normaliserange(a) - normaliserange(b);
	}
	function ascSortSpellClass(a, b) {
		const hasSubclassA = a.includes("(") && !a.includes("(UA)");
		const hasSubclassB = b.includes("(") && !b.includes("(UA)");
		if (hasSubclassA && hasSubclassB) return ascSort(a, b);
		if (hasSubclassA) return 1;
		if (hasSubclassB) return -1;
		return ascSort(a, b)
	}

	const list = search({
		valueNames: ["name", "source", "level", "time", "school", "range", "classes"],
		listClass: "spells"
	});

	// add filter reset to reset button
	$(ID_RESET_BUTTON).on(EVNT_CLICK, function() {filterBox.reset();}, false);

	filterBox.render();
	initHistory();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		function () {
			list.filter(function(item) {
				const f = filterBox.getValues();
				const rightSource = f[sourceFilter.header][FilterBox.VAL_SELECT_ALL] || f[sourceFilter.header][sourceFilter.valueFunction($(item.elm).attr(sourceFilter.storageAttribute))];
				const rightLevel = f[levelFilter.header][FilterBox.VAL_SELECT_ALL] || f[levelFilter.header][levelFilter.valueFunction($(item.elm).attr(levelFilter.storageAttribute))];
				const allMeta = $(item.elm).attr(metaFilter.storageAttribute).split(FLTR_LIST_SEP);
				let anyRightMeta = false;
				for (let i = 0; i < allMeta.length; i++) {
					const t = allMeta[i];
					if (f[metaFilter.header][t]) {
						anyRightMeta = true;
						break;
					}
				}
				const rightMeta = f[metaFilter.header][FilterBox.VAL_SELECT_ALL] || anyRightMeta;
				const rightSchool = f[schoolFilter.header][FilterBox.VAL_SELECT_ALL] || f[schoolFilter.header][schoolFilter.valueFunction($(item.elm).attr(schoolFilter.storageAttribute))];
				const rightTime = f[timeFilter.header][FilterBox.VAL_SELECT_ALL] || f[timeFilter.header][timeFilter.valueFunction($(item.elm).attr(timeFilter.storageAttribute))];
				const rightRange = f[rangeFilter.header][FilterBox.VAL_SELECT_ALL] || f[rangeFilter.header][rangeFilter.valueFunction($(item.elm).attr(rangeFilter.storageAttribute))];
				const allClasses = $(item.elm).attr(classFilter.storageAttribute).split(FLTR_LIST_SEP);
				let anyRightClass = false;
				for (let i = 0; i < allClasses.length; i++) {
					const t = allClasses[i];
					if (f[classFilter.header][t]) {
						anyRightClass = true;
						break;
					}
				}
				const rightClass = f[classFilter.header][FilterBox.VAL_SELECT_ALL] || anyRightClass;

				return rightSource && rightLevel && rightMeta && rightSchool && rightTime && rightRange && rightClass
			});
		}
	);

	$("#filtertools button.sort").on("click", function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		list.sort($(this).data("sort"), { order: $(this).attr("sortby"), sortFunction: sortspells });
	});

	// default de-select UA sources
	filterBox.deselectIf(function(val) { return val === "EEPC" || val.startsWith("UA") }, sourceFilter.header);
};

function sortspells(a, b, o) {
	if (o.valueName === "name") {
		return compareNames(a, b);
	}

	if (o.valueName === "source") {
		if (b._values.source.toLowerCase() === a._values.source.toLowerCase()) return compareNames(a, b);
		return b._values.source.toLowerCase() > a._values.source.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "level") {
		let alevel = a._values.level.replace(" ", "").replace("cantrip", "0")[0];
		let blevel = b._values.level.replace(" ", "").replace("cantrip", "0")[0];
		alevel = (alevel.length < 2 ? "0" + alevel : alevel) + (a._values.level.includes("ritual") ? " 1" : "") + (a._values.level.includes("tech") ? " 2" : "");
		blevel = (blevel.length < 2 ? "0" + blevel : blevel) + (b._values.level.includes("ritual") ? " 1" : "") + (b._values.level.includes("tech") ? " 2" : "");
		if (blevel === alevel) return compareNames(a, b);
		return blevel > alevel ? 1 : -1;
	}

	if (o.valueName === "time") {
		if (normalisetime(b._values.time) === normalisetime(a._values.time)) return compareNames(a, b);
		return normalisetime(b._values.time) > normalisetime(a._values.time) ? 1 : -1;
	}

	if (o.valueName === "school") {
		if (b._values.school.toLowerCase() === a._values.school.toLowerCase()) return compareNames(a, b);
		return b._values.school.toLowerCase() > a._values.school.toLowerCase() ? 1 : -1;
	}

	if (o.valueName === "range") {
		if (normaliserange(b._values.range) === normaliserange(a._values.range)) return compareNames(a, b);
		return normaliserange(b._values.range) > normaliserange(a._values.range) ? 1 : -1;
	}

	return 0;
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	const curspell = spelldata.compendium.spell[id];

	$("th#name").html(`<span title="${parse_sourceJsonToFull(curspell.source)}" class='source source${curspell.source}'>${curspell.source}</span> ${curspell.name}`);

	$("td span#school").html(parseschool(curspell.school));
	if (curspell.level === "0") {
		$("td span#school").css("textTransform", "capitalize");
		$("td span#level").css("textTransform", "lowercase!important");
		$("td span#level").html(" cantrip").detach().appendTo("td span#school");
	} else {
		$("td span#school").css("textTransform", "lowercase");
		$("td span#level").html(parsespelllevel (curspell.level)+"-level");
	}

	if (curspell.ritual === "YES") {
		$("td span#ritual").show();
	} else $("td span#ritual").hide();

	if (curspell.technomagic === "YES") {
		$("td span#technomagic").show();
	} else $("td span#technomagic").hide();

	$("td#components span").html(curspell.components);
	$("td#range span").html(curspell.range);
	$("td#castingtime span").html(curspell.time);
	$("td#duration span").html(curspell.duration);

	$("tr.text").remove();
	const textlist = curspell.text;
	let texthtml = "";

	if (textlist[0].length === 1) {
		texthtml = `<p>${textlist}</p>`;
	} else for (let i = 0; i < textlist.length; i++) {
		// FIXME this information should be kept in JSON instead of being parsed out
		if (textlist[i].istable === "YES") {
			texthtml += utils_makeTable(textlist[i]);
		} else {
			if (!textlist[i]) continue;
			texthtml = texthtml + "<p>" + textlist[i].replace("At Higher Levels: ", "<strong>At Higher Levels:</strong> ") + "</p>";
		}
	}
	$("tr#text").after(`<tr class='text'><td colspan='6' class='text'>${texthtml}</td></tr>`);

	$("td#classes span").html(curspell.classes);

	return;
}
