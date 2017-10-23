window.onload = function load() {
	tabledefault = $("#stats").html();

	var racelist = racedata.compendium.race;

	for (var i = 0; i < racelist.length; i++) {
		var currace = racelist[i];
		var name = currace.name;
		$("ul.races").append("<li><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name col-xs-4'>"+name+"</span> <span class='ability col-xs-4'>"+utils_getAttributeText(currace.ability)+"</span> <span class='size col-xs-2'>"+parse_sizeAbvToFull(currace.size)+"</span> <span class='source col-xs-2' title=\""+currace.source+"\">"+parse_sourceJsonToAbv(currace.source)+"</span></a></li>");

		addDropdownOption($("select.sourcefilter"), parse_sourceJsonToAbv(currace.source), parse_sourceJsonToFull(currace.source));

		if (!$("select.sizefilter:contains(\""+parse_sizeAbvToFull(currace.size)+"\")").length) {
			$("select.sizefilter").append("<option value='"+parse_sizeAbvToFull(currace.size)+"'>"+parse_sizeAbvToFull(currace.size)+"</option>");
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

	var size = parse_sizeAbvToFull (currace.size);
	$("td#size span").html(size);
	if (size === "") $("td#size").hide();

	var ability = utils_getAttributeText(currace.ability);
	$("td#ability span").html(ability);

	var speed = currace.speed + (currace.speed === "Varies" ? "" : "ft. ");
	$("td#speed span").html(speed);
	if (speed === "") $("td#speed").hide();

	var traitlist = currace.trait;
	$("tr.trait").remove();

	let statsText = "<tr class='text'><td colspan='6'>";
	for (let n = 0; n < traitlist.length; ++n) {
		const trait = traitlist[n];

		const header = "<span class='name'>" + trait.name + ".</span> ";
		statsText += utils_combineText(traitlist[n].text, "p", header)
	}
	statsText += "</td></tr>";
	$('table#stats tbody tr:last').before(statsText);
}
