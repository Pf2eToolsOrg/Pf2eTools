

function parsesize (size) {
	if (size == "T") size = "Tiny";
	if (size == "S") size = "Small";
	if (size == "M") size = "Medium";
	if (size == "L") size = "Large";
	if (size == "H") size = "Huge";
	if (size == "G") size = "Gargantuan";
	return size;
}

function parseschool (school) {
	if (school == "A") return "abjuration";
	if (school == "EV") return "evocation";
	if (school == "EN") return "enchantment";
	if (school == "I") return "illusion";
	if (school == "D") return "divination";
	if (school == "N") return "necromancy";
	if (school == "T") return "transmutation";
	if (school == "C") return "conjuration";
	return "";
}

function parsespelllevel (level) {
	if (isNaN (level)) return "";
	if (level === "0") return "cantrip"
	if (level === "2") return level+"nd";
	if (level === "3") return level+"rd";
	if (level === "1") return level+"st";
	return level+"th";
}

function parsesource (source) {
	if (source === "PHB") source = "Player's Handbook";
	if (source === "EEPC") source = "Elemental Evil Player's Companion";
	if (source === "SCAG") source = "Sword Coast Adventurer's Guide";
	if (source === "UAMystic") source = "Unearthed Arcana: The Mystic Class";
	return source;
}

function asc_sort(a, b){
    return ($(b).text()) < ($(a).text()) ? 1 : -1;
}

function dec_sort(a, b){
    return ($(b).text()) > ($(a).text()) ? 1 : -1;
}

window.onload = loadspells;

function loadspells() {
	tabledefault = $("#stats").html();

	var spelllist = spelldata.compendium.spell;

		for (var i = 0; i < spelllist.length; i++) {
			var curspell = spelllist[i];
			var name = curspell.name;
			if (curspell.level[0] === "P") name += " (Psionics)";

			var leveltext = parsespelllevel(curspell.level);
			if (parseInt(curspell.level) > 0) leveltext += " level"
			if (curspell.ritual === "YES") leveltext += " (ritual)";

			var schooltext = parseschool(curspell.school);
			if (!schooltext) {
				if (curspell.level[1] === "D") {
					schooltext = curspell.classes.split(/Mystic \(/g)[1].split(")")[0];
					schooltext += " Discipline";
					leveltext = "Discipline";
				} else if (curspell.level[1] === "T") {
					schooltext = "Psionic Talent";
					leveltext = "Talent";
				}
			}

			var source = "PHB";
			if (curspell.source) {
				source = curspell.source;
			} else {
				curspell.source = "PHB";
			}


			$("ul.spells").append("<li class='row' id='"+i+"' data-link='"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"' data-name='"+encodeURIComponent(name).replace("'","%27")+"'><span class='name col-xs-3'>"+name+"</span> <span class='source col-xs-2' title=\""+parsesource(source)+"\">"+source+"</span> <span class='level col-xs-2'>"+leveltext+"</span> <span class='school col-xs-2'>"+schooltext+"</span> <span class='classes col-xs-3'>"+curspell.classes+"</span> </li>");

			if (!$("select.levelfilter:contains('"+parsespelllevel(curspell.level)+"')").length) {
				$("select.levelfilter").append("<option value='"+curspell.level+"'>"+parsespelllevel(curspell.level)+"</option>");
			}

			if (!$("select.schoolfilter:contains('"+parseschool (curspell.school)+"')").length) {
				$("select.schoolfilter").append("<option value='"+parseschool (curspell.school)+"'>"+parseschool (curspell.school)+"</option>");
			}

			if (!$("select.sourcefilter:contains(\""+parsesource(source)+"\")").length) {
				$("select.sourcefilter").append("<option value='"+source+"'>"+parsesource(source)+"</option>");
			}

			var classlist = curspell.classes.split(",");
			for (var a = 0; a < classlist.length; a++) {
				if (classlist[a][0] === " ") classlist[a] = classlist[a].replace(/^\s+|\s+$/g, "")
				if (!$("select.classfilter option[value='"+classlist[a]+"']").length) {
					$("select.classfilter").append("<option title=\""+classlist[a]+"\" value='"+classlist[a]+"'>"+classlist[a]+"</option>")
				}
			}

		}

		$("select.levelfilter option").sort(asc_sort).appendTo('select.levelfilter');
		$("select.levelfilter option[value=1]").before($("select.levelfilter option[value=All]"));
		$("select.levelfilter option[value=1]").before($("select.levelfilter option[value=0]"));
		$("select.levelfilter").val("All");

		$("select.schoolfilter option").sort(asc_sort).appendTo('select.schoolfilter');
		$("select.schoolfilter").val("All");

		$("select.classfilter option").sort(asc_sort).appendTo('select.classfilter');
		$("select.classfilter").val("All");

		$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
		$("select.sourcefilter").val("All");

		var options = {
			valueNames: ['name', 'source', 'level', 'school', 'classes'],
			listClass: "spells"
		}

		var spellslist = new List("listcontainer", options);
		spellslist.sort ("name")

		$("ul.list li").mousedown(function(e) {
			if (e.which === 2) {
				console.log("#"+$(this).attr("data-link").toLowerCase())
				window.open("#"+$(this).attr("data-link").toLowerCase(), "_blank").focus();
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		});

		$("ul.list li").click(function(e) {
			usespell($(this).attr("id"));
			document.title = decodeURIComponent($(this).attr("data-name")).replace("%27","'") + " - 5etools Spells";
			window.location = "#"+$(this).attr("data-link").toLowerCase();
		});

		if (window.location.hash.length) {
			$("ul.list li[data-link='"+window.location.hash.split("#")[1].toLowerCase()+"']:eq(0)").click();
		} else $("ul.list li:eq(0)").click();

		$("form#filtertools select").change(function(){
			var levelfilter = $("select.levelfilter").val();
			if (levelfilter !== "All") {

				if (levelfilter[0] !== "d" && levelfilter[0] !== "t") {
					levelfilter = parsespelllevel (levelfilter);
					if (levelfilter !== "cantrip") {
						levelfilter = levelfilter + " level"
					} else levelfilter = "cantrip";
					if ($(".ritualfilter").val() === "Rituals") levelfilter = levelfilter + " (ritual)"
				}
			} else if ($(".ritualfilter").val() === "Rituals") levelfilter = "(ritual)"

			var schoolfilter = $("select.schoolfilter").val();
			var classfilter = $("select.classfilter").val();
			var sourcefilter = $("select.sourcefilter").val();

			spellslist.filter(function(item) {
				var rightlevel = false;
				var rightschool = false;
				var rightclass = false;
				var rightsource = false;

				if (levelfilter === "All" || item.values().level.indexOf(levelfilter) !== -1) rightlevel = true;
				if (schoolfilter === "All" || item.values().school === schoolfilter) rightschool = true;
				var classes = item.values().classes.split(", ");
				for (var c = 0; c < classes.length; c++) {
					if (classes[c] === classfilter) rightclass = true;
				}
				if (classfilter === "All") rightclass = true;
				if (sourcefilter === "All" || item.values().source === sourcefilter) rightsource = true;
				if (rightlevel && rightschool && rightclass && rightsource) return true;
				return false;
			});
		});

		$("#filtertools small").click(function() {
			$("#search").val("psionics");
			spellslist.search("psionics");
		})

		$("#filtertools button.sort").on("click", function() {
			if ($(this).attr("sortby") === "asc") {
				$(this).attr("sortby", "desc");
			} else $(this).attr("sortby", "asc");
			spellslist.sort($(this).data("sort"), { order: $(this).attr("sortby"), sortFunction: sortspells });
		});

			// reset button
			$("button#reset").click(function() {
				$("#filtertools select").val("All");
				$("#search").val("");
				spellslist.search("");
				spellslist.filter();
				spellslist.sort("name");
				spellslist.update();
			})
}

function sortspells(a, b, o) {
	if (o.valueName === "name") {
		return ((b._values.name.toLowerCase()) > (a._values.name.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "school") {
		return ((b._values.school.toLowerCase()) > (a._values.school.toLowerCase())) ? 1 : -1;
	}


	if (o.valueName === "level") {
		var alevel = a._values.level.replace(" ", "").replace("cantrip", "0")[0];
		var blevel = b._values.level.replace(" ", "").replace("cantrip", "0")[0];
		if (alevel === "D") alevel = "10";
		if (blevel === "D") blevel = "10";
		if (alevel === "T") alevel = "11";
		if (blevel === "T") blevel = "11";
		return (parseInt(blevel) > parseInt(alevel)) ? 1 : -1;
	}

	return 1;

}

function usespell (id) {
			$("#stats").html(tabledefault);
			var spelllist = spelldata.compendium.spell;
			var curspell = spelllist[id];

			$("th#name").html("<span title=\""+parsesource(curspell.source)+"\" class='source source"+curspell.source+"'>"+curspell.source+"</span> "+curspell.name);

			// $("th#name").html(curspell.name);

			if (curspell.level[0] !== "P") {
				$("td span#school").html(parseschool(curspell.school));
				if (curspell.level === "0") {
					$("td span#school").css('textTransform', 'capitalize');
					$("td span#level").css('textTransform', 'lowercase!important');
					$("td span#level").html(" cantrip").detach().appendTo("td span#school");
				} else {
					$("td span#school").css('textTransform', 'lowercase');
					$("td span#level").html(parsespelllevel (curspell.level)+"-level");
				}

				if (curspell.ritual === "YES") {
					$("td span#ritual").show();
				} else $("td span#ritual").hide();

				$("td#components span").html(curspell.components);
				$("td#range span").html(curspell.range);
				$("td#castingtime span").html(curspell.time);
				$("td#duration span").html(curspell.duration);
			} else {
				var psitype = "";
				if (curspell.level[1] === "D") {
					psitype = curspell.classes.split(/Mystic \(/g)[1].split(")")[0];
					psitype += " Discipline";
				} else if (curspell.level[1] === "T") {
					psitype = "Psionic Talent";
				}
				$("td#levelschoolritual").html(psitype);
				$("td#castingtime").html("");
				$("td#range").html("");
				$("td#components").html("");
				$("td#duration").html("");
			}

			$("tr.text").remove();
			var textlist = curspell.text;
			var texthtml = "";

			if (textlist[0].length === 1) {
				texthtml = "<p>"+textlist+"</p>";
			} else for (var i = 0; i < textlist.length; i++) {
				if (!textlist[i]) continue;
				if (curspell.level[0] !== "P") {
					texthtml = texthtml + "<p>"+textlist[i].replace("At Higher Levels: ", "<strong>At Higher Levels:</strong> ").replace("This spell can be found in the Elemental Evil Player's Companion","")+"</p>";
				} else {
					texthtml = texthtml + "<p>"+textlist[i].replace(/^.*(\(.*psi.*?\)|Psychic Focus|Bestial Transformation)\./g,"<strong>$&</strong>")+"</p>";
				}
			}
			$("tr#text").after("<tr class='text'><td colspan='6' class='text"+i+"'>"+texthtml+"</td></tr>");

			$("td#classes span").html(curspell.classes);

			return;
		};
