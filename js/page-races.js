
function parsesource (src) {
	source = src;
	if (source === "Player's Handbook") source = "PHB";
	if (source === "Elemental Evil Player's Companion") source = "EEPC";
	if (source === "Sword Coast Adventurer's Guide") source = "SCAG";
	if (source === "Dungeon Master's Guide") source = "DMG";
	if (source === "Volo's Guide to Monsters") source = "VGM";
	if (source === "Unearthed Arcana: Eberron") source = "UA Eb";
	if (source === "Unearthed Arcana: Waterborne Adventures") source = "UA WA";
	if (source === "Unearthed Arcana: That Old Black Magic") source = "UA TOBM";
	if (source === "Unearthed Arcana: Gothic Heroes") source = "UA GH";
	if (source === "Unearthed Arcana: Eladrin and Gith") source = "UA EG";
	if (source === "The Tortle Package") source = "TP";
	if (source === "Plane Shift Zendikar") source = "PSZ";
	if (source === "Plane Shift Kaladesh") source = "PSK";
	if (source === "Plane Shift Innistrad") source = "PSI";
	if (source === "Plane Shift Amonkhet") source = "PSA";
	return source;
}


function parsesize (size) {
	if (size === "T") size = "Tiny";
	if (size === "S") size = "Small";
	if (size === "M") size = "Medium";
	if (size === "L") size = "Large";
	if (size === "H") size = "Huge";
	if (size === "G") size = "Gargantuan";
	if (size === "V") size = "Varies";
	return size;
}

function tagcontent (curitem, tag, multi=false) {
	if (!curitem.getElementsByTagName(tag).length) return false;
	return curitem.getElementsByTagName(tag)[0].childNodes[0].nodeValue;
}

function asc_sort(a, b){
	return ($(b).text()) < ($(a).text()) ? 1 : -1;
}

function dec_sort(a, b){
	return ($(b).text()) > ($(a).text()) ? 1 : -1;
}

function getAttributeText(race) {
	const ATTRIBUTES = ["Str", "Dex", "Con", "Int", "Wis", "Cha"];
	let atts = [];
	if (race.ability !== undefined) {
		handleAllAttributes(atts, race.ability);
		handleAttributesChoose();
		return atts.join("; ");
	}
	return "";

	function handleAllAttributes(targetArray, abilityList) {
		for (let a = 0; a < ATTRIBUTES.length; ++a) {
			handleAttribute(targetArray, abilityList, ATTRIBUTES[a])
		}
	}

	function handleAttribute(targetArray, parent, att) {
		if (parent[att.toLowerCase()] !== undefined) targetArray.push(att + " " + (parent[att.toLowerCase()].includes("-") ? "" : "+") + parent[att.toLowerCase()]);
	}

	function handleAttributesChoose() {
		if (race.ability.choose !== undefined) {
			for (let i = 0; i < race.ability.choose.length; ++i) {
				let item = race.ability.choose[i];
				let outStack = "Choose ";
				if (item.predefined !== undefined) {
					for (let j = 0; j < item.predefined.length; ++j) {
						let subAtts = [];
						handleAllAttributes(subAtts, item.predefined[j]);
						outStack += subAtts.join(", ") + (j === item.predefined.length - 1 ? "" : " or ");
					}
				} else {
					let allAttributes = item.from.length === 6;
					let amount = item.amount === undefined ? "1" : item.amount;
					if (allAttributes) {
						outStack += "any ";
					}
					if (item.count !== undefined && item.count > 1) {
						outStack += getNumberString(item.count) + " ";
					}
					if (allAttributes) {
						outStack += "+" + amount;
					} else {
						for (let j = 0; j < item.from.length; ++j) {
							let capitalisedAtt = item.from[j].charAt(0).toUpperCase() + item.from[j].slice(1);
							outStack += capitalisedAtt + " +" + amount + (j === item.from.length - 1 ? "" : " or ");
						}
					}
				}
				atts.push(outStack)
			}
		}
	}

	function getNumberString(amount) {
		if (amount === 1) return "one";
		if (amount === 2) return "two";
		if (amount === 3) return "three";
		else return amount;
	}
}

window.onload = function load() {
	tabledefault = $("#stats").html();

	var racelist = racedata.compendium.race;

	for (var i = 0; i < racelist.length; i++) {
		var currace = racelist[i];
		var name = currace.name;
		$("ul.races").append("<li id='"+i+"' data-link='"+encodeURI(name)+"'><span class='name col-xs-4'>"+name+"</span> <span class='ability col-xs-4'>"+getAttributeText(currace)+"</span> <span class='size col-xs-2'>"+parsesize(currace.size)+"</span> <span class='source col-xs-2' title=\""+currace.source+"\">"+parsesource(currace.source)+"</span></li>");

		if (!$("select.sourcefilter:contains(\""+currace.source+"\")").length) {
			$("select.sourcefilter").append("<option value='"+parsesource(currace.source)+"'>"+currace.source+"</option>");
		}

		if (!$("select.sizefilter:contains(\""+parsesize(currace.size)+"\")").length) {
			$("select.sizefilter").append("<option value='"+parsesize(currace.size)+"'>"+parsesize(currace.size)+"</option>");
		}
	}

	$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
	$("select.sourcefilter").val("All");

	$("select.sizefilter option").sort(asc_sort).appendTo('select.sizefilter');
	$("select.sizefilter").val("All");


	var options = {
		valueNames: ['name', 'ability', 'size', 'source'],
		listClass: "races"
	}

	var raceslist = new List("listcontainer", options);
	raceslist.sort ("name")

	$("form#filtertools select").change(function(){
		var sourcefilter = $("select.sourcefilter").val();
		var sizefilter = $("select.sizefilter").val();
		var bonusfilter = $("select.bonusfilter").val();

		raceslist.filter(function(item) {
			var rightsource = false;
			var rightsize = false;
			var rightbonuses = false;
			if (sourcefilter === "All" || item.values().source.indexOf(sourcefilter) !== -1) rightsource = true;
			if (sizefilter === "All" || item.values().size.indexOf(sizefilter) !== -1) rightsize = true;
			if (bonusfilter === "All" || item.values().ability.indexOf(bonusfilter) !== -1) rightbonuses = true;
			if (rightsource && rightsize && rightbonuses) return true;
			return false;
		});
	});

	$("ul.list li").mousedown(function(e) {
		if (e.which === 2) {
			console.log("#"+$(this).attr("data-link"))
			window.open("#"+$(this).attr("data-link"), "_blank").focus();
			e.preventDefault();
			e.stopPropagation();
			return;
		}
	});

	$("ul.list li").click(function(e) {
		window.location = "#"+$(this).attr("data-link");
	});

	if (window.location.hash.length) {
		window.onhashchange();
	} else $("ul.list li:eq(0)").click();

	// reset button
	$("button#reset").click(function() {
		$("#filtertools select").val("All");
		$("#search").val("");
		racelist.search("");
		racelist.filter();
		racelist.sort("name");
		racelist.update();
	})
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	$("#stats td").show();

	var racelist = racedata.compendium.race;
	var currace = racelist[id];

	var name = currace.name;
	$("th#name").html(name);

	var size = parsesize (currace.size);
	$("td#size span").html(size);
	if (size === "") $("td#size").hide();

	var ability = getAttributeText(currace);
	$("td#ability span").html(ability);

	var speed = currace.speed + (currace.speed === "Varies" ? "" : "ft. ");
	$("td#speed span").html(speed);
	if (speed === "") $("td#speed").hide();

	var traitlist = currace.trait;
	$("tr.trait").remove();
	for (let n = 0; n < traitlist.length; ++n) {
		let trait = traitlist[n];
        let parent = $('table#stats tbody tr:last');
        let toAddTr = document.createElement('tr');
        toAddTr.className = 'trait';
        let toAddTd = document.createElement('td');
        toAddTd.className = 'trait'+n;
        toAddTd.colSpan = 6;
		let toAdd;
		if (trait.optionheading === "YES") {
			toAdd = document.createElement('span');
			toAdd.className = 'name';
            toAdd.innerHTML = trait.name + (traitlist[n].text === undefined ? "" : ".");
			toAddTd.append(toAdd);
			toAddTd.innerHTML += " " + (utils_combineText(traitlist[n].text));
		} else {
            toAdd = document.createElement('span');
            toAdd.className = 'name';
            toAdd.innerHTML = trait.name + ".";
            toAddTd.append(toAdd);
            toAddTd.innerHTML += " " + (utils_combineText(traitlist[n].text));
            if (trait.suboption === "YES") {
				toAddTd.className = "suboption";
			} else if (trait.subsuboption === "YES") {
				toAddTd.className = "subsuboption";
			}
		}
        toAddTr.appendChild(toAddTd);
        parent.before(toAddTr);
	}
	return;
};
