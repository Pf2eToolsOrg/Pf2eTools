
function parsesource (src) {
	source = src;
	if (source === "Player's Handbook") source = "PHB";
	if (source === "Elemental Evil Player's Companion") source = "EEPC";
	if (source === "Sword Coast Adventurer's Guide") source = "SCAG";
	if (source === "Dungeon Master's Guide") source = "DMG";
	if (source === "Volo's Guide to Monsters") source = "VGM";
	if (source === "Unearthed Arcana: Eberron") source = "UA Eberron";
	if (source === "Unearthed Arcana: Waterborne Adventures") source = "UA Waterborne Adventures";
	if (source === "Unearthed Arcana: That Old Black Magic") source = "UA TOBM";
	if (source === "Unearthed Arcana: Gothic Heroes") source = "UA Gh";
	return source;
}


function parsesize (size) {
	if (size == "T") size = "Tiny";
	if (size == "S") size = "Small";
	if (size == "M") size = "Medium";
	if (size == "L") size = "Large";
	if (size == "H") size = "Huge";
	if (size == "G") size = "Gargantuan";
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

window.onload = loadraces;

function loadraces() {
	tabledefault = $("#stats").html();

	var racelist = racedata.compendium.race;

	for (var i = 0; i < racelist.length; i++) {
		var currace = racelist[i];
		var name = currace.name;
		if (!currace.ability) currace.ability = "";
		$("ul.races").append("<li id='"+i+"' data-link='"+encodeURI(name)+"'><span class='name'>"+name+"</span> <span class='ability'>"+currace.ability.replace(/(?:\s)(\d)/g, " +$1")+"</span> <span class='size'>"+parsesize(currace.size)+"</span> <span class='source'>Source: "+currace.source+" ("+parsesource(currace.source)+")</span></li>");

		if (!$("select.sourcefilter:contains(\""+currace.source+"\")").length) {
			$("select.sourcefilter").append("<option value='"+parsesource(currace.source)+"'>"+currace.source+"</option>");
		}

		if (!$("select.sizefilter:contains(\""+parsesize(currace.size)+"\")").length) {
			$("select.sizefilter").append("<option value='"+parsesize(currace.size)+"'>"+parsesize(currace.size)+"</option>");
		}

		// if (!$("select.bonusfilter:contains(\""+currace.ability.replace(/(?:\s)(\d)/g, " +$1")+"\")").length) {
		// 	$("select.bonusfilter").append("<option value='"+currace.ability.replace(/(?:\s)(\d)/g, " +$1")+"'>"+currace.ability.replace(/(?:\s)(\d)/g, " +$1")+"</option>");
		// }
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
		userace($(this).attr("id"));
		document.title = decodeURI($(this).attr("data-link")) + " - 5etools Races";
		window.location = "#"+$(this).attr("data-link");
	});

	if (window.location.hash.length) {
		$("ul.list li[data-link='"+window.location.hash.split("#")[1]+"']:eq(0)").click();
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

function userace (id) {
	$("#stats").html(tabledefault);
	$("#stats td").show();

	var racelist = racedata.compendium.race;
	var currace = racelist[id];

	var name = currace.name;
	$("th#name").html(name);

	var size = parsesize (currace.size);
	$("td#size span").html(size);
	if (size === "") $("td#size").hide();

	var ability = currace.ability.replace(/(?:\s)(\d)/g, " +$1");
	$("td#ability span").html(ability);

	var speed = currace.speed;
	$("td#speed span").html(speed+ "ft. ");
	if (speed === "") $("td#speed").hide();

	var traitlist = currace.trait;
	$("tr.trait").remove();
	for (var n = traitlist.length-1; n >= 0; n--) {
		var traitname = traitlist[n].name+".";
		if (traitname.indexOf("Variant Feature") !== -1) {
			traitname = traitname + "</span><p></p><span>"
		}
		texthtml = "<span class='name'>"+traitname+"</span> <p>"+traitlist[n].text.join("</p><p></p><p>")+"</p>"

		$("tr#traits").after("<tr class='trait'><td colspan='6' class='trait"+n+"'>"+texthtml+"</td></tr>");
	}
	return;
};
