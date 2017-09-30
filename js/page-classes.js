function parsesize (size) {
	if (size === "T") size = "Tiny";
	if (size === "S") size = "Small";
	if (size === "M") size = "Medium";
	if (size === "L") size = "Large";
	if (size === "H") size = "Huge";
	if (size === "G") size = "Gargantuan";
	return size;
}

function parseschool (school) {
	if (school === "A") return "abjuration";
	if (school === "EV") return "evocation";
	if (school === "EN") return "enchantment";
	if (school === "I") return "illusion";
	if (school === "D") return "divination";
	if (school === "N") return "necromancy";
	if (school === "T") return "transmutation";
	if (school === "C") return "conjuration";
	return false;
}

function parsespelllevel (level) {
	if (isNaN (level)) return false;
	if (level === "0") return "cantrip";
	if (level === "1") return level+"st";
	if (level === "2") return level+"nd";
	if (level === "3") return level+"rd";
	return level+"th";
}

function asc_sort(a, b){
	return ($(b).text()) < ($(a).text()) ? 1 : -1;
}

function dec_sort(a, b){
	return ($(b).text()) > ($(a).text()) ? 1 : -1;
}

var tabledefault="";
var classtabledefault ="";

window.onload = function load() {
	tabledefault = $("#stats").html();
	statsprofdefault = $("#statsprof").html();
	classtabledefault = $("#classtable").html();

	var classlist = classdata.compendium.class;

	for (var i = 0; i < classlist.length; i++) {
		var curclass = classlist[i];

		$("ul.classes").append("<li id='"+i+"' data-link='"+encodeURI(curclass.name)+"'><span class='name'>"+curclass.name+"</span></li>");

	}

	var options = {
		valueNames: ['name'],
		listClass: "classes"
	};

	var classlist = new List("listcontainer", options);
	classlist.sort ("name");

	$("ul.list li").mousedown(function(e) {
		if (e.which === 2) {
			window.open("#"+$(this).attr("data-link"), "_blank").focus();
			e.preventDefault();
			e.stopPropagation();
			return;
		}
	});

	$("ul.list li").click(function(e) {
		window.location.hash = "#"+$(this).attr("data-link");
	});

	if (window.location.hash.length) {
		window.onhashchange();
	} else $("ul.list li:eq(0)").click();

	// reset button
	$("button#reset").click(function() {
		$("#filtertools select").val("All");
		$("#search").val("");
		classlist.search("");
		classlist.filter();
		classlist.sort("name");
		classlist.update();
	})
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	$("#statsprof").html(statsprofdefault);
	$("#classtable").html(classtabledefault);
	var classlist = classdata.compendium.class;
	var curclass = classlist[id];

	$("th#name").html(curclass.name);

	$("td#hp div#hitdice span").html("1d"+curclass.hd);
	$("td#hp div#hp1stlevel span").html(curclass.hd+" + your Constitution modifier");
	$("td#hp div#hphigherlevels span").html("1d"+curclass.hd+" (or "+(curclass.hd/2+1)+") + your Constitution modifier per "+curclass.name+" level after 1st");

	$("td#prof div#saves span").html(curclass.proficiency);

	$("tr:has(.slotlabel)").hide();
	$("#classtable tr").not(":has(th)").append("<td class='featurebuffer'></td>");

	var subclasses = [];
	for (var i = curclass.autolevel.length-1; i >= 0; i--) {
		var curlevel = curclass.autolevel[i];

		// spell slots and table data
		if (!curlevel.feature) {
			if (curlevel.slots) {
				$("tr:has(.slotlabel)").show();
				if (curlevel.slots.__text) curlevel.slots = curlevel.slots.__text;
				var curslots = curlevel.slots.split(",");
				if (curslots[0] !== "0" && $("th.slotbuffer").attr("colspan") < 4) {
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("th.slotlabel").attr("colspan", curslots.length-1);
				if (curslots.length > 1) $(".featurebuffer").hide();

				for (var a = 0; a < curslots.length; a++) {
					if (curslots[a] === "0") continue;
					$(".spellslots"+a).show();
					$("tr#level"+curlevel._level+" td.spellslots"+a).html(curslots[a]);
				}
			}

			if (curlevel.spellsknown) {
				if (!$(".spellsknown").length) {
					$("th.spellslots0").after("<th class='spellsknown newfeature'>Spells Known</th>");
					$("td.spellslots0").after("<td class='spellsknown newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.spellsknown").html(curlevel.spellsknown);
			}


			if (curlevel.invocationsknown) {
				if (!$(".invocationsknown").length) {
					$("th.spellslots5").after("<th class='spellslots newfeature'>Spell Slots</th> <th class='slotlevel newfeature'>Slot Level</th> <th class='invocationsknown newfeature'>Invocations Known</th>");
					$("td.spellslots5").after("<td class='spellslots newfeature'></td> <td class='slotlevel newfeature'></td> <td class='invocationsknown newfeature'>Invocations Known</td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+3);
				}
				$(".spellslots5").hide();
				$("tr#level"+curlevel._level+" td.spellslots").html(curlevel.spellslots);
				$("tr#level"+curlevel._level+" td.slotlevel").html(curlevel.slotlevel);
				$("tr#level"+curlevel._level+" td.invocationsknown").html(curlevel.invocationsknown);
				$("tr:has(.slotlabel)").hide();
			}

			if (curlevel.rages) {
				if (!$(".rages").length) {
					$("th.spellslots0").before("<th class='rages newfeature'>Rages</th> <th class='ragedamage newfeature'>Rage Damage</th>");
					$("td.spellslots0").before("<td class='rages newfeature'></td> <td class='ragedamage newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+2);
				}
				$("tr#level"+curlevel._level+" td.rages").html(curlevel.rages);
				$("tr#level"+curlevel._level+" td.ragedamage").html(curlevel.ragedamage);
			}

			if (curlevel.martialarts) {
				if (!$(".kipoints").length) {
					$("th.pb").after("<th class='martialarts newfeature'>Martial Arts</th> <th class='kipoints newfeature'>Ki Points</th> <th class='unarmoredmovement newfeature'>Unarmored Movement</th>");
					$("td.pb").after("<td class='martialarts newfeature'></td> <td class='kipoints newfeature'></td> <td class='unarmoredmovement newfeature'></td>");
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+3);
					$("th.slotbuffer").attr("colspan", $("th.slotbuffer").attr("colspan")+3);
				}
				$("tr#level"+curlevel._level+" td.martialarts").html(curlevel.martialarts);
				$("tr#level"+curlevel._level+" td.kipoints").html(curlevel.kipoints);
				$("tr#level"+curlevel._level+" td.unarmoredmovement").html(curlevel.unarmoredmovement);
			}

			if (curlevel.sneakattack) {
				if (!$(".sneakattack").length) {
					$("th.pb").after("<th class='sneakattack newfeature'>Sneak Attack</th>");
					$("td.pb").after("<td class='sneakattack newfeature'></td>");
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.sneakattack").html(curlevel.sneakattack);
			}

			if (curlevel.sorcerypoints) {
				if (!$(".sorcerypoints").length) {
					$("th.pb").after("<th class='sorcerypoints newfeature'>Sorcery Points</th>");
					$("td.pb").after("<td class='sorcerypoints newfeature'></td>");
					$("#classtable td.border").attr("colspan", parseInt($("#classtable td.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}

				$("tr#level"+curlevel._level+" td.sorcerypoints").html(curlevel.sorcerypoints);
			}

			if (curlevel.psilimit) {
				if (!$(".psilimit").length) {
					$("th.spellslots0").after("<th class='psilimit newfeature'>Psi Limit</th>");
					$("td.spellslots0").after("<td class='psilimit newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.psilimit").html(curlevel.psilimit);
			}

			if (curlevel.psipoints) {
				if (!$(".psipoints").length) {
					$("th.spellslots0").after("<th class='psipoints newfeature'>Psi Points</th>");
					$("td.spellslots0").after("<td class='psipoints newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.psipoints").html(curlevel.psipoints);
			}

			if (curlevel.disciplinesknown) {
				if (!$(".disciplinesknown").length) {
					$("th.spellslots0").after("<th class='disciplinesknown newfeature'>Disciplines Known</th>");
					$("td.spellslots0").after("<td class='disciplinesknown newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.disciplinesknown").html(curlevel.disciplinesknown);
			}

			if (curlevel.talentsknown) {
				if (!$(".talentsknown").length) {
					$("th.spellslots0").after("<th class='talentsknown newfeature'>Talents Known</th>");
					$("td.spellslots0").after("<td class='talentsknown newfeature'></td>");
					$("#classtable th.border").attr("colspan", parseInt($("#classtable th.border").attr("colspan"))+1);
					$("th.slotbuffer").attr("colspan", parseInt($("th.slotbuffer").attr("colspan"))+1);
				}
				$("tr#level"+curlevel._level+" td.talentsknown").html(curlevel.talentsknown);
			}

			// other features
		} else for (var a = curlevel.feature.length-1; a >= 0; a--) {
			var curfeature = curlevel.feature[a];
			var link = curlevel._level + "_" + a;


			if (curfeature._optional === "YES") {
				subclasses.push(curfeature);
			}

			let styleClass = "";
			let isInlineHeader = curfeature.suboption === "2";
			let removeSubclassNamePrefix = curfeature.subclass !== undefined && curfeature.suboption === undefined;
			let hasSubclassPrefix = curfeature.subclass !== undefined && curfeature.suboption === "1";
			if (curfeature.subclass === undefined && curfeature.suboption === undefined) styleClass = "feature";
			else if (curfeature.subclass === undefined && curfeature.suboption !== undefined && curfeature._optional === "YES") styleClass = "optionalsubfeature sub" + curfeature.suboption;
			else if (curfeature.subclass === undefined && curfeature.suboption !== undefined) styleClass = "subfeature sub" + curfeature.suboption;
			else if (curfeature.subclass !== undefined && curfeature.suboption === undefined) styleClass = "subclassfeature";
			else if (curfeature.subclass !== undefined && curfeature.suboption !== undefined) styleClass = "subclasssubfeature sub" + curfeature.suboption;

			if (curfeature.name === "Starting Proficiencies") {
				$("td#prof div#armor span").html(curfeature.text[1].split(":")[1]);
				$("td#prof div#weapons span").html(curfeature.text[2].split(":")[1]);
				$("td#prof div#tools span").html(curfeature.text[3].split(":")[1]);
				$("td#prof div#skills span").html(curfeature.text[4].split(":")[1]);
				continue;
			}

			if (curfeature.name === "Starting Equipment") {
				$("#equipment div").html("<p>"+curfeature.text.join("</p><p>"));
				continue;
			}

			// write out list to class table
			var multifeature = "";
			if (curlevel.feature.length !== 1 && a !== 0) multifeature = ", ";
			let featureSpan = document.createElement('span');
			featureSpan.setAttribute('data-link', link);
            featureSpan.onclick = function() {scrollToFeature(featureSpan.getAttribute('data-link'))};
            featureSpan.innerHTML = curfeature.name;
			if (curfeature._optional !== "YES" && curfeature.suboption === undefined) $("tr#level"+curlevel._level+" td.features").prepend(featureSpan).prepend(multifeature);

			// display features in bottom section
			var dataua = (curfeature.subclass !== undefined && curfeature.subclass.indexOf(" (UA)") !== -1) ? "true" : "false";
			let subclassPrefix = hasSubclassPrefix ? "<span class='subclass-prefix'>" + curfeature.subclass.split(": ")[1] +": </span>" : "";
			if (isInlineHeader) {
				let namePart = curfeature.name === undefined ? null : "<span id='feature" + link + "' class='inline-header'>" + subclassPrefix + curfeature.name + ".</span> ";
				$("#features").after("<tr><td colspan='6' class='_class_feature " + styleClass + "' data-subclass='" + curfeature.subclass + "' data-ua='" + dataua + "'>" + utils_combineText(curfeature.text, "p", namePart) + "</td></tr>");
			} else {
				let namePart = curfeature.name === undefined ? "" : "<strong id='feature" + link + "'>" + subclassPrefix + (removeSubclassNamePrefix ? curfeature.name.split(": ")[1] : curfeature.name) + "</strong>";
				$("#features").after("<tr><td colspan='6' class='_class_feature " + styleClass + "' data-subclass='" + curfeature.subclass + "' data-ua='" + dataua + "'>" + namePart + utils_combineText(curfeature.text, "p") + "</td></tr>");
			}
		}

	}

	$("td.features, td.slots, td.newfeature").each(function() {
		if ($(this).html() === "") $(this).html("—")
	});

	$("div#subclasses span").remove();
	var prevsubclass = 0;
	for (var i = 0; i < subclasses.length; i++) {

		if (typeof subclasses[i].issubclass !== "undefined" && subclasses[i].issubclass !== "YES") {
			$(".feature[data-subclass='"+subclasses[i].subclass+"']").hide();
			continue;
		}

		if (!prevsubclass) prevsubclass = subclasses[i].subclass;

		if (subclasses[i].issubclass === "YES") $("div#subclasses").prepend("<span data-subclass='"+subclasses[i].name+"'><em style='display: none;'>"+subclasses[i].name.split(": ")[0]+": </em><span>"+subclasses[i].name.split(": ")[1]+"</span></span>");
	}

	$("#subclasses > span").sort(asc_sort).appendTo("#subclasses");
	$("#subclasses > span").click(function() {
		const name = $(this).children("span").text()
		if ($(this).hasClass("active"))
			window.location.hash = window.location.hash.replace(/\,.*/, "")
		else
			window.location.hash = window.location.hash.replace(/\,.*|$/, "," + encodeURIComponent(name).replace("'", "%27"))
	});

	return;
}

function scrollToFeature(ele) {
	let goTo = document.getElementById("feature"+ele);
    goTo.scrollIntoView();
}

function loadsub(sub) {
	const $el = $(`#subclasses span:contains('${decodeURIComponent(sub)}')`).first();
	if ($el.hasClass("active")) {
		$("._class_feature").show();
		$(".subclass-prefix").show();
		$el.removeClass("active");
		return;
	}

	$("#subclasses .active").removeClass("active");
	$el.addClass("active");

	$("._class_feature[data-subclass!='"+$el.text()+"'][data-subclass!='undefined']").hide();
	$(".subclass-prefix").hide();
	$("._class_feature[data-subclass='"+$el.text()+"']").show();
}

