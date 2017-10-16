function parsesource (src) {
	let source = src;
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
	if (source === "Unearthed Arcana: Fiendish Options") source = "UA FO";
	if (source === "The Tortle Package") source = "TP";
	if (source === "Plane Shift Zendikar") source = "PSZ";
	if (source === "Plane Shift Kaladesh") source = "PSK";
	if (source === "Plane Shift Innistrad") source = "PSI";
	if (source === "Plane Shift Amonkhet") source = "PSA";
	return source;
}

window.onload = function load() {
	tabledefault = $("#stats").html();

	var racelist = racedata.compendium.race;

	for (var i = 0; i < racelist.length; i++) {
		var currace = racelist[i];
		var name = currace.name;
		$("ul.races").append("<li><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name col-xs-4'>"+name+"</span> <span class='ability col-xs-4'>"+utils_getAttributeText(currace.ability)+"</span> <span class='size col-xs-2'>"+parsesize(currace.size)+"</span> <span class='source col-xs-2' title=\""+currace.source+"\">"+parsesource(currace.source)+"</span></a></li>");

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


	const list = search({
		valueNames: ['name', 'ability', 'size', 'source'],
		listClass: "races"
	});

	$("form#filtertools select").change(function(){
		var sourcefilter = $("select.sourcefilter").val();
		var sizefilter = $("select.sizefilter").val();
		var bonusfilter = $("select.bonusfilter").val();

		list.filter(function(item) {
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

	if (window.location.hash.length) {
		window.onhashchange();
	} else $("#listcontainer a").get(0).click();
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

	var ability = utils_getAttributeText(currace.ability);
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
			let header = "<span class='name'>" + trait.name + (traitlist[n].text === undefined ? "" : ".") + "</span> ";
			toAddTd.innerHTML = traitlist[n].text === undefined ? header : " " + (utils_combineText(traitlist[n].text, "p", header));
		} else {
			let header = "<span class='name'>" + trait.name + ".</span> ";
			toAddTd.innerHTML = (utils_combineText(traitlist[n].text, "p", header));
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
}
