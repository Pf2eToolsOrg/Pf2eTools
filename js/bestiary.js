const BESTIARY_JSON_URL = "data/bestiary.json";
const BESTIARY_TOB_JSON_URL = "data/bestiary-tob.json";

window.onload = function load() {
	tableDefault = $("#stats").html();
	loadJSON(BESTIARY_JSON_URL, addToB);
};

function addToB(mainData) {
	loadJSON(BESTIARY_TOB_JSON_URL, populate, mainData);
}

let monsters;
function populate(tobData, mainData) {
	monsters = mainData[0].monster;
	monsters = monsters.concat(tobData.monster);

	// parse all the monster data
	for (let i = 0; i < monsters.length; i++) {
		const name = monsters[i].name;
		const source = monsters[i].source;
		const fullsource = Parser.sourceJsonToFull(source);
		const type = monsters[i].type;
		const cr = monsters[i].cr === undefined ? "Unknown" : monsters[i].cr;

		const abvSource = Parser.sourceJsonToAbv(source);
		const is3pp = source.includes("3pp");

		$("ul#monsters").append(`<li ${FLTR_TYPE}='${type}' ${FLTR_SOURCE}='${source}' ${FLTR_CR}='${cr}' ${FLTR_3PP}='${is3pp}'><a id=${i} href='#${encodeForHash(name)}_${encodeForHash(source)}' title="${name}"><span class='name col-xs-4 col-xs-4-2'>${name}</span> <span title="${fullsource}" class='col-xs-1 col-xs-1-8 source source${abvSource}'>${abvSource}</span> <span class='type col-xs-4 col-xs-4-3'>${type}</span> <span class='col-xs-1 col-xs-1-7 text-align-center cr'>${cr}</span></a></li>`);

		addDropdownOption($("select.typefilter"), type, Parser.sourceJsonToFull(type));
		addDropdownOption($("select.sourcefilter"), source, fullsource);
		addDropdownOption($("select.crfilter"), cr, cr);

		$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
		$("select.sourcefilter").val("All");
	}

	$("select.typefilter option").sort(asc_sort).appendTo('select.typefilter');
	$("select.typefilter").val("All");

	$("select.crfilter option").sort(asc_sort_cr).appendTo('select.crfilter');
	$("select.crfilter option[value=0]").before($("select.crfilter option[value=All]"));
	$("select.crfilter").val("All");

	const list = search({
		valueNames: ["name", "source", "type", "cr"]
	});

	initHistory();

	// filtering
	$("form#filtertools select").change(function(){
		var typefilter = $("select.typefilter").val();
		var sourcefilter = $("select.sourcefilter").val();
		var crfilter = $("select.crfilter").val();
		var thirdpartyfilter = $("select.pp3filter").val();

		list.filter(function(item) {
			var righttype = false;
			var rightsource = false;
			var rightcr = false;
			var rightparty = false;

			if (typefilter === "All" || item.elm.getAttribute(FLTR_TYPE) === typefilter) righttype = true;
			if (sourcefilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourcefilter) rightsource = true;
			if (crfilter === "All" || item.elm.getAttribute(FLTR_CR) === crfilter) rightcr = true;
			if (thirdpartyfilter === "All") rightparty = true;
			if (thirdpartyfilter === "None" && item.elm.getAttribute(FLTR_3PP) === "false") rightparty = true;
			if (thirdpartyfilter === "Only" && item.elm.getAttribute(FLTR_3PP) === "true") rightparty = true;
			if (righttype && rightsource && rightcr && rightparty) return true;
			return false;
		});
	});

	$("#filtertools button.sort").on("click", function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		list.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortmonsters });
	});

	// collapse/expand button
	$("button#expandcollapse").click(function() {
		$("main .row:eq(0) > div:eq(0)").toggleClass("col-sm-5").toggle();
		$("main .row:eq(0) > div:eq(1)").toggleClass("col-sm-12").toggleClass("col-sm-7");
	});

	// proficiency bonus/dice toggle
	const profBonusDiceBtn = $("button#profbonusdice");
	profBonusDiceBtn.useDice = false;
	profBonusDiceBtn.click(function() {
		// TODO switch the rollers to using PD/PB
		if (this.useDice) {
			this.innerHTML = "Use Proficiency Dice";
			$("#stats").find(`span.roller[${ATB_PROF_MODE}]`).each(function() {
				const $this = $(this);
				$this.attr(ATB_PROF_MODE, PROF_MODE_BONUS);
				$this.html($this.attr(ATB_PROF_BONUS_STR));
			})
		} else {
			this.innerHTML = "Use Proficiency Bonus";
			$("#stats").find(`span.roller[${ATB_PROF_MODE}]`).each(function() {
				const $this = $(this);
				$this.attr(ATB_PROF_MODE, PROF_MODE_DICE);
				$this.html($this.attr(ATB_PROF_DICE_STR));
			})
		}
		this.useDice = !this.useDice;
	})
}

// sorting for form filtering
function sortmonsters(a, b, o) {
	if (o.valueName === "name") {
		return ((b._values.name.toLowerCase()) > (a._values.name.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "type") {
		return ((b._values.type.toLowerCase()) > (a._values.type.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "source") {
		return ((b._values.source.toLowerCase()) > (a._values.source.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "cr") {
		// always put the unknown items last
		if (a._values.cr === undefined || a._values.cr === "Unknown")  return -1;
		if (b._values.cr === undefined || b._values.cr === "Unknown")  return 1;
		if ((a._values.cr === undefined || a._values.cr === "Unknown") && (b._values.cr === undefined || b._values.cr === "Unknown")) return 0;
		let acr = a._values.cr.replace("CR ", "").replace(" ", "");
		let bcr = b._values.cr.replace("CR ", "").replace(" ", "");
		if (acr === "1/2") acr = "-1";
		if (bcr === "1/2") bcr = "-1";
		if (acr === "1/4") acr = "-2";
		if (bcr === "1/4") bcr = "-2";
		if (acr === "1/8") acr = "-3";
		if (bcr === "1/8") bcr = "-3";
		if (acr === "0") acr = "-4";
		if (bcr === "0") bcr = "-4";
		return (parseInt(bcr) > parseInt(acr)) ? 1 : -1;
	}

	return 1;

}

// load selected monster stat block
function loadhash (id) {
	$("#stats").html(tableDefault);
	var mon = monsters[id];
	var name = mon.name;
	var source = mon.source;
	var fullsource = Parser.sourceJsonToFull(source);
	var type = mon.type;
	source = Parser.sourceJsonToAbv(source);

	imgError = function (x) {
		$(x).parent().siblings(".source").css("margin-right", "-4.8em");
		$(x).remove();

	};

	$("th#name").html("<span title=\"" + fullsource + "\" class='source source" + source + "'>" + source + "<br></span> <a href=\"img/" + source + "/" + name + ".png\" target='_blank'><img src=\"img/" + source + "/" + name + ".png\" class='token' onerror='imgError(this)'></a>" + name);

	$("td span#size").html(Parser.sizeAbvToFull(mon.size));

	$("td span#type").html(type);

	$("td span#alignment").html(mon.alignment);

	$("td span#ac").html(mon.ac);

	$("td span#hp").html(mon.hp);

	$("td span#speed").html(mon.speed);

	$("td#str span.score").html(mon.str);
	$("td#str span.mod").html(Parser.getAbilityModifier(mon.str));

	$("td#dex span.score").html(mon.dex);
	$("td#dex span.mod").html(Parser.getAbilityModifier(mon.dex));

	$("td#con span.score").html(mon.con);
	$("td#con span.mod").html(Parser.getAbilityModifier(mon.con));

	$("td#int span.score").html(mon.int);
	$("td#int span.mod").html(Parser.getAbilityModifier(mon.int));

	$("td#wis span.score").html(mon.wis);
	$("td#wis span.mod").html(Parser.getAbilityModifier(mon.wis));

	$("td#cha span.score").html(mon.cha);
	$("td#cha span.mod").html(Parser.getAbilityModifier(mon.cha));

	var saves = mon.save;
	if (saves && saves.length > 0) {
		$("td span#saves").parent().show();
		$("td span#saves").html(saves);
	} else {
		$("td span#saves").parent().hide();
	}

	var skills = mon.skill;
	if (skills && skills.length > 0 && skills[0]) {
		$("td span#skills").parent().show();
		$("td span#skills").html(skills);
	} else {
		$("td span#skills").parent().hide();
	}

	var dmgvuln = mon.vulnerable;
	if (dmgvuln && dmgvuln.length > 0) {
		$("td span#dmgvuln").parent().show();
		$("td span#dmgvuln").html(dmgvuln);
	} else {
		$("td span#dmgvuln").parent().hide();
	}

	var dmgres = mon.resist;
	if (dmgres && dmgres.length > 0) {
		$("td span#dmgres").parent().show();
		$("td span#dmgres").html(dmgres);
	} else {
		$("td span#dmgres").parent().hide();
	}

	var dmgimm = mon.immune;
	if (dmgimm && dmgimm.length > 0) {
		$("td span#dmgimm").parent().show();
		$("td span#dmgimm").html(dmgimm);
	} else {
		$("td span#dmgimm").parent().hide();
	}

	var conimm = mon.conditionImmune;
	if (conimm && conimm.length > 0) {
		$("td span#conimm").parent().show();
		$("td span#conimm").html(conimm);
	} else {
		$("td span#conimm").parent().hide();
	}

	var senses = mon.senses;
	if (senses && senses.length > 0) {
		$("td span#senses").html(senses + ", ");
	} else {
		$("td span#senses").html("");
	}

	var passive = mon.passive;
	if (passive && passive.length > 0) {
		$("td span#pp").html(passive)
	}

	var languages = mon.languages;
	if (languages && languages.length > 0) {
		$("td span#languages").html(languages);
	} else {
		$("td span#languages").html("\u2014");
	}

	var cr = mon.cr === undefined ? "Unknown" : mon.cr;
	$("td span#cr").html(cr);
	$("td span#xp").html(Parser.crToXp(cr));

	var traits = mon.trait;
	$("tr.trait").remove();

	if (traits) for (var i = traits.length - 1; i >= 0; i--) {
		var traitname = traits[i].name;

		var traittext = traits[i].text;
		var traittexthtml = "";
		var renderedcount = 0;
		for (var n = 0; n < traittext.length; n++) {
			if (!traittext[n]) continue;

			renderedcount++;
			var firstsecond = "";
			if (renderedcount === 1) firstsecond = "first ";
			if (renderedcount === 2) firstsecond = "second ";

			var spells = "";
			if (traitname.indexOf("Spellcasting") !== -1 && traittext[n].indexOf(": ") !== -1) spells = "spells";
			if (traitname.indexOf("Variant") !== -1 && traitname.indexOf("Coven") !== -1 && traittext[n].indexOf(": ") !== -1) spells = "spells";

			traittexthtml = traittexthtml + "<p class='" + firstsecond + spells + "'>" + traittext[n].replace(/\u2022\s?(?=C|\d|At\swill)/g, "");
			+"</p>";
		}

		$("tr#traits").after("<tr class='trait'><td colspan='6' class='trait" + i + "'><span class='name'>" + traitname + ".</span> " + traittexthtml + "</td></tr>");

		// parse spells, make hyperlinks
		$("tr.trait").children("td").children("p.spells").each(function () {
			let spellslist = $(this).html();
			if (spellslist[0] === "*") return;
			spellslist = spellslist.split(": ")[1].split(/\, (?!\+|\dd|appears|inside gems)/g);
			for (let i = 0; i < spellslist.length; i++) {
				spellslist[i] = "<a href='spells.html#" + encodeURIComponent((spellslist[i].replace(/(\*)| \(([^\)]+)\)/g, ""))).toLowerCase().replace("'", "%27") + "_" + "phb' target='_blank'>" + spellslist[i] + "</a>";
				if (i !== spellslist.length - 1) spellslist[i] = spellslist[i] + ", ";
			}

			$(this).html($(this).html().split(": ")[0] + ": " + spellslist.join(""))
		});
	}

	const actions = mon.action;
	$("tr.action").remove();

	if (actions && actions.length) for (let i = actions.length - 1; i >= 0; i--) {
		const actionname = actions[i].name;
		const actiontext = actions[i].text;
		let actiontexthtml = "";
		let renderedcount = 0;
		for (let n = 0; n < actiontext.length; n++) {
			if (!actiontext[n]) continue;

			renderedcount++;
			let firstsecond = "";
			if (renderedcount === 1) firstsecond = "first ";
			if (renderedcount === 2) firstsecond = "second ";

			actiontexthtml = actiontexthtml + "<p class='"+firstsecond+"'>"+actiontext[n]+"</p>";
		}

		$("tr#actions").after("<tr class='action'><td colspan='6' class='action"+i+"'><span class='name'>"+actionname+".</span> "+actiontexthtml+"</td></tr>");
	}

	const reactions = mon.reaction;
	$("tr#reactions").hide();
	$("tr.reaction").remove();

	if (reactions && (reactions.text || reactions.length)) {

		$("tr#reactions").show();

		if (!reactions.length) {
			const reactionname = reactions.name;
			const reactiontext = reactions.text;
			let reactiontexthtml = "";
			let renderedcount = 0;
			for (let n = 0; n < reactiontext.length; n++) {
				if (!reactiontext[n]) continue;

				renderedcount++;
				let firstsecond = "";
				if (renderedcount === 1) firstsecond = "first ";
				if (renderedcount === 2) firstsecond = "second ";

				reactiontexthtml = reactiontexthtml + "<p class='" + firstsecond + "'>" + reactiontext[n] + "</p>";
			}

			$("tr#reactions").after("<tr class='reaction'><td colspan='6' class='reaction0'><span class='name'>" + reactionname + ".</span> " + reactiontexthtml + "</td></tr>");
		}

		if (reactions.length) for (let i = reactions.length - 1; i >= 0; i--) {
			const reactionname = reactions[i].name;

			const reactiontext = reactions[i].text;
			let reactiontexthtml = "<span>" + reactiontext + "</span>";
			for (let n = 1; n < reactiontext.length; n++) {
				if (!reactiontext[n]) continue;
				reactiontexthtml = reactiontexthtml + "<p>" + reactiontext[n] + "</p>";
			}

			$("tr#reactions").after("<tr class='reaction'><td colspan='6' class='reaction" + i + "'><span class='name'>" + reactionname + ".</span> " + reactiontexthtml + "</td></tr>");
		}
	}

	const legendaries = mon.legendary;
	$("tr.legendary").remove();
	$("tr#legendaries").hide();
	if (legendaries && legendaries.length) {
		$("tr#legendaries").show();

		for (let i = legendaries.length - 1; i >= 0; i--) {
			let legendaryname = "";
			const legendarytext = legendaries[i].text;
			let legendarytexthtml = "";

			if (legendaries[i].name) {
				legendaryname = legendaries[i].name + ".";
			}

			let renderedcount = 0;
			for (let n = 0; n < legendarytext.length; n++) {
				if (!legendarytext[n]) continue;

				renderedcount++;
				let firstsecond = "";
				if (renderedcount === 1) firstsecond = "first ";
				if (renderedcount === 2) firstsecond = "second ";

				legendarytexthtml = legendarytexthtml + "<p class='" + firstsecond + "'>" + legendarytext[n] + "</p>";
			}

			$("tr#legendaries").after("<tr class='legendary'><td colspan='6' class='legendary" + i + "'><span class='name'>" + legendaryname + "</span> " + legendarytexthtml + "</td></tr>");
		}

		if ($("tr.legendary").length && !$("tr.legendary span.name:empty").length && !$("tr.legendary span.name:contains(Legendary Actions)").length) {
			$("tr#legendaries").after("<tr class='legendary'><td colspan='6' class='legendary0'><span class='name'></span> <span>" + name + " can take 3 legendary actions, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. " + name + " regains spent legendary actions at the start of his turn.</span></td></tr>");
		}

	}

	// add click links for rollables
	$("#stats #abilityscores td").each(function () {
		$(this).wrapInner("<span class='roller' data-roll='1d20" + $(this).children(".mod").html() + "'></span>");
	});

	if (mon.skill) {
		$("#skills").each(makeSkillRoller);
	}
	if (mon.save) {
		$("#saves").each(makeSaveRoller);
		// function () { $(this).html($(this).html().replace(/\+\d+/g, "<span class='roller' data-roll='1d20$&'>$&</span>")) }
	}
	function makeSkillRoller() {
		// mon.skill is always a 1-length array, with no negative modifiers
		const $this = $(this);
		const skills = $this.html().split(",").map(s => s.trim());
		const out = [];
		skills.map(s => {
			const spl = s.split("+").map(s => s.trim());
			const bonus = Number(spl[1]);
			const fromAbility = Parser.getAbilityModNumber(mon[getAttribute(spl[0])]);
			const expectedPB = getProfBonusFromCr(mon.cr);
			const pB = bonus - fromAbility;

			const expert = (pB === expectedPB * 2) ? 2 : 1;
			const pBonusStr = `+${bonus}`;
			const pDiceStr = `${expert}d${pB*(3-expert)}+${fromAbility}`;

			out.push(renderSkillOrSaveRoller(spl[0], pBonusStr, pDiceStr, false));
		});
		$this.html(out.join(", "));
	}
	function makeSaveRoller() {
		// mon.save has no negative modifiers
		const $this = $(this);
		const saves = $this.html().split(",").map(s => s.trim());
		const out = [];
		saves.map(s => {
			const spl = s.split("+").map(s => s.trim());
			const bonus = Number(spl[1]);
			const fromAbility = Parser.getAbilityModNumber(mon[spl[0].toLowerCase()]);
			const expectedPB = getProfBonusFromCr(mon.cr);
			const pB = bonus - fromAbility;

			const expert = (pB === expectedPB * 2) ? 2 : 1;
			const pBonusStr = `+${bonus}`;
			const pDiceStr = `${expert}d${pB*(3-expert)}+${fromAbility}`;

			out.push(renderSkillOrSaveRoller(spl[0], pBonusStr, pDiceStr, true));
		});
		$this.html(out.join(", "));
	}
	function renderSkillOrSaveRoller(itemName, profBonusString, profDiceString, isSave) {
		return `${itemName} <span class='roller' title="${itemName} ${isSave ? " save" : ""}" data-roll-alt="1d20;${profDiceString}" data-roll='1d20${profBonusString}' ${ATB_PROF_MODE}='${PROF_MODE_BONUS}' ${ATB_PROF_DICE_STR}="+${profDiceString}" ${ATB_PROF_BONUS_STR}="${profBonusString}">${profBonusString}</span>`;
	}

	// inline rollers
	$("#stats p").each(function(){
		addNonD20Rollers(this);

		// add proficiency dice stuff for attack rolls, since those _generally_ have proficiency
		// this is not 100% accurate; for example, ghouls don't get their prof bonus on bite attacks
		// fixing it would probably involve machine learning though; we need an AI to figure it out on-the-fly
		// (Siri integration forthcoming)
		$(this).html($(this).html().replace(/(\-|\+)?\d+(?= to hit)/g, function(match) {
			const bonus = Number(match);

			const expectedPB = getProfBonusFromCr(mon.cr);
			const withoutPB = bonus - expectedPB;

			if (expectedPB > 0) {
				const profDiceString = `1d${expectedPB*2}${withoutPB >= 0 ? "+" : ""}${withoutPB}`;

				return `<span class='roller' data-roll-alt='1d20;${profDiceString}' data-roll='1d20${match}' ${ATB_PROF_MODE}='${PROF_MODE_BONUS}' ${ATB_PROF_DICE_STR}="+${profDiceString}" ${ATB_PROF_BONUS_STR}="${match}">${match}</span>`
			} else {
				return `<span class='roller' data-roll='1d20${match}'>${match}</span>`; // if there was no proficiency bonus to work with, fall back on this
			}
		}))
	});
	$("#stats span#hp").each(function() {
		addNonD20Rollers(this);
	});
	function addNonD20Rollers (ele) {
		$(ele).html($(ele).html().replace(/\d+d\d+(\s?(\-|\+)\s?\d+\s?)?/g, "<span class='roller' data-roll='$&'>$&</span>"));
	}

	$(".spells span.roller").contents().unwrap();
	$("#stats").find("span.roller").click(function() {
		const $this = $(this);
		let roll;
		let rollResult;
		if ($this.attr(ATB_PROF_MODE) === PROF_MODE_DICE) {
			roll = $this.attr("data-roll-alt").replace(/\s+/g, "");
			// hacks because droll doesn't support e.g. "1d20+1d4+2" :joy: :ok_hand:
			const multi = roll.split(";");
			roll = roll.replace(";", "+");
			rollResult =  droll.roll(multi[0]);
			const res2 = droll.roll(multi[1]);
			rollResult.rolls = rollResult.rolls.concat(res2.rolls);
			rollResult.total += res2.total;
		} else {
			roll = $this.attr("data-roll").replace(/\s+/g, "");
			rollResult =  droll.roll(roll);
		}
		let name = $("#name").clone().children().remove().end().text();
		$("div#output").prepend(`<span>${name}: <em>${roll}</em> rolled ${$this.attr("title") ? `${$this.attr("title")} ` : "" }for <strong>${rollResult.total}</strong> (<em>${rollResult.rolls.join(", ")}</em>)<br></span>`).show();
		$("div#output span:eq(5)").remove();
	})
}

const ATB_PROF_MODE = "mode";
const ATB_PROF_BONUS_STR = "profBonusStr";
const ATB_PROF_DICE_STR = "profDiceStr";
const PROF_MODE_BONUS = "bonus";
const PROF_MODE_DICE = "dice";
function getProfBonusFromCr(cr) {
	if (CR_TO_PROF[cr]) return CR_TO_PROF[cr];
	return 0;
}
const CR_TO_PROF = {
	"0"			: 2,
	"1/8"		: 2,
	"1/4"		: 2,
	"1/2"		: 2,
	"1"			: 2,
	"2"			: 2,
	"3"			: 2,
	"4"			: 2,
	"5"			: 3,
	"6"			: 3,
	"7"			: 3,
	"8"			: 3,
	"9"			: 4,
	"10"		: 4,
	"11"		: 4,
	"12"		: 4,
	"13"		: 5,
	"14"		: 5,
	"15"		: 5,
	"16"		: 5,
	"17"		: 6,
	"18"		: 6,
	"19"		: 6,
	"20"		: 6,
	"21"		: 7,
	"22"		: 7,
	"23"		: 7,
	"24"		: 7,
	"25"		: 8,
	"26"		: 8,
	"27"		: 8,
	"28"		: 8,
	"29"		: 9,
	"30"		: 9
};
const skillSaveRe = /\+\d+/g;
const SKILL_TO_ATB_ABV = {
	"athletics": "dex",
	"acrobatics": "dex",
	"sleight of Hand": "dex",
	"stealth": "dex",
	"arcana": "int",
	"history": "int",
	"investigation": "int",
	"nature": "int",
	"religion": "int",
	"animal Handling": "wis",
	"insight": "wis",
	"medicine":  "wis",
	"perception": "wis",
	"survival": "wis",
	"deception": "cha",
	"intimidation": "cha",
	"performance": "cha",
	"persuasion": "cha"
};
function getAttribute(skill) {
	return SKILL_TO_ATB_ABV[skill.toLowerCase().trim()];
}