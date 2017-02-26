
function parsesource (src) {
	source = src;
	if (source === "Player's Handbook") source = "PHB";
	if (source === "Elemental Evil Player's Companion") source = "EEPC";
	if (source === "Unearthed Arcana: Eberron") source = "UA Eberron";
	if (source === "Unearthed Arcana: Feats") source = "UA Feats";
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

function asc_sort(a, b){
    return ($(b).text()) < ($(a).text()) ? 1 : -1;
}

function dec_sort(a, b){
    return ($(b).text()) > ($(a).text()) ? 1 : -1;
}

window.onload = loadfeats;
var tabledefault = "";

function loadfeats() {
	tabledefault = $("#stats").html();
	var featlist = featdata.compendium.feat;

		for (var i = 0; i < featlist.length; i++) {
			var curfeat = featlist[i];
			var name = curfeat.name;
			$("ul.feats").append("<li id='"+i+"' data-link='"+encodeURI(name)+"'><span class='name'>"+name+"</span> <span class='source'>Source: "+curfeat.source+" ("+parsesource(curfeat.source)+")</span></li>");

			if (!$("select.sourcefilter:contains(\""+curfeat.source+"\")").length) {
				$("select.sourcefilter").append("<option value='"+parsesource(curfeat.source)+"'>"+curfeat.source+"</option>");
			}
		}

		$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
		$("select.sourcefilter").val("All");

		var options = {
			valueNames: ['name', 'source'],
			listClass: "feats"
		}

		var featslist = new List("listcontainer", options);
		featslist.sort ("name");

		$("form#filtertools select").change(function(){
			var sourcefilter = $("select.sourcefilter").val();

			featslist.filter(function(item) {
				if (sourcefilter === "All" || item.values().source.indexOf(sourcefilter) !== -1) return true;
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
			usefeat($(this).attr("id"));
			document.title = decodeURI($(this).attr("data-link")) + " - 5etools Feats";
			window.location = "#"+$(this).attr("data-link");
		});

		if (window.location.hash.length) {
			$("ul.list li[data-link='"+window.location.hash.split("#")[1]+"']:eq(0)").click();
		} else $("ul.list li:eq(0)").click();

			// reset button
			$("button#reset").click(function() {
				$("#filtertools select").val("All");
				$("#search").val("");
				featslist.search("");
				featslist.filter();
				featslist.sort("name");
				featslist.update();
			})

	}

	function usefeat (id) {
			$("#stats").html(tabledefault);
			var featlist = featdata.compendium.feat;
			var curfeat = featlist[id];

			var name = curfeat.name;
			$("th#name").html(name);

			$("td#prerequisite").html("")
			var prerequisite = curfeat.prerequisite;
			if (prerequisite) $("td#prerequisite").html("Prerequisite: "+prerequisite);

			$("tr.text").remove();

			var textlist = curfeat.text;
			var texthtml = "";

			for (var i = 0; i < textlist.length; i++) {
				if (!textlist[i]) continue;
				texthtml = texthtml + "<p>"+textlist[i]+"</p>";
			}

			$("tr#text").after("<tr class='text'><td colspan='6' class='text"+i+"'>"+texthtml+"</td></tr>");

		};
