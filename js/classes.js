const HASH_SUBCLASS = "subclass:";
const HASH_FEATURE = "feature:";
const HASH_HIDE_FEATURES = "hidefeatures:";

var tabledefault="";
var classtabledefault ="";

let classlist;

window.onload = function load() {
	const jsonURL = "data/classes.json";

	const request = new XMLHttpRequest();
	request.open('GET', jsonURL, true);
	request.overrideMimeType("application/json");
	request.onload = function() {
		const data = JSON.parse(this.response);

		classlist = data.class;

		tabledefault = $("#stats").html();
		statsprofdefault = $("#statsprof").html();
		classtabledefault = $("#classtable").html();

		for (let i = 0; i < classlist.length; i++) {
			var curclass = classlist[i];
			$("ul.classes").append("<li><a id='"+i+"' href='#"+encodeURI(curclass.name).toLowerCase()+"' title='"+curclass.name+"'><span class='name col-xs-9'>"+curclass.name+"</span><span class='source col-xs-3' title='"+parse_sourceJsonToFull(curclass.source)+"'>"+parse_sourceJsonToAbv(curclass.source)+"</span></a></li>");
		}

		const list = search({
			valueNames: ['name', 'source'],
			listClass: "classes"
		});

		initHistory()
	};
	request.send();
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	$("#statsprof").html(statsprofdefault);
	$("#classtable").html(classtabledefault);
	var curclass = classlist[id];

	$("th#name").html(curclass.name);

	$("td#hp div#hitdice span").html("1d"+curclass.hd);
	$("td#hp div#hp1stlevel span").html(curclass.hd+" + your Constitution modifier");
	$("td#hp div#hphigherlevels span").html("1d"+curclass.hd+" (or "+(curclass.hd/2+1)+") + your Constitution modifier per "+curclass.name+" level after 1st");

	$("td#prof div#saves span").html(curclass.proficiency);

	$("tr:has(.slotlabel)").hide();
	$("#classtable tr").not(":has(th)").append("<td class='featurebuffer'></td>");

	var subclasses = [];
	for (let i = curclass.autolevel.length-1; i >= 0; i--) {
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
		} else for (let a = curlevel.feature.length-1; a >= 0; a--) {
			const curfeature = curlevel.feature[a];
			const link = curfeature.name === undefined ? a : encodeURIComponent(curfeature.name.toLowerCase());

			if (curfeature._optional === "YES") {
				subclasses.push(curfeature);
			}

			let styleClass = "";
			const isInlineHeader = curfeature.suboption === "2";
			const removeSubclassNamePrefix = curfeature.subclass !== undefined && curfeature.suboption === undefined;
			const hasSubclassPrefix = curfeature.subclass !== undefined && curfeature.suboption === "1";
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
			const featureSpan = document.createElement(ELE_A);
			featureSpan.setAttribute(ATB_HREF, getFeatureHash(link));
			featureSpan.setAttribute(ATB_CLASS, "featurelink");
			featureSpan.addEventListener("click", function() {
				document.getElementById("feature"+link).scrollIntoView();
			})
			featureSpan.innerHTML = curfeature.name;
			if (curfeature._optional !== "YES" && curfeature.suboption === undefined) $("tr#level"+curlevel._level+" td.features").prepend(featureSpan).prepend(multifeature);

			// display features in bottom section
			var dataua = (curfeature.subclass !== undefined && curfeature.subclass.indexOf(" (UA)") !== -1) ? "true" : "false";
			const subclassPrefix = hasSubclassPrefix ? "<span class='subclass-prefix'>" + curfeature.subclass.split(": ")[1] +": </span>" : "";
			const dataSubclass = curfeature.subclass === undefined ? undefined : curfeature.subclass.toLowerCase();
			if (isInlineHeader) {
				const namePart = curfeature.name === undefined ? null : "<span id='feature" + link + "' class='inline-header'>" + subclassPrefix + curfeature.name + ".</span> ";
				$("#features").after("<tr><td colspan='6' class='_class_feature " + styleClass + "' data-subclass='" + dataSubclass + "' data-ua='" + dataua + "'>" + utils_combineText(curfeature.text, "p", namePart) + "</td></tr>");
			} else {
				const namePart = curfeature.name === undefined ? "" : "<strong id='feature" + link + "'>" + subclassPrefix + (removeSubclassNamePrefix ? curfeature.name.split(": ")[1] : curfeature.name) + "</strong>";
				const prerequisitePart = curfeature.prerequisite === undefined ? "" : "<p class='prerequisite'>Prerequisite: " + curfeature.prerequisite + "</p>";
				$("#features").after("<tr><td colspan='6' class='_class_feature " + styleClass + "' data-subclass='" + dataSubclass + "' data-ua='" + dataua + "'>" + namePart + prerequisitePart + utils_combineText(curfeature.text, "p") + "</td></tr>");
			}
		}

	}

	$("td.features, td.slots, td.newfeature").each(function() {
		if ($(this).html() === "") $(this).html("\u2014")
	});

	$("div#subclasses span").remove();
	for (let i = 0; i < subclasses.length; i++) {
		if (subclasses[i].issubclass === "YES") $("div#subclasses").prepend("<span data-subclass='"+(subclasses[i].name.toLowerCase())+"'><em style='display: none;'>"+subclasses[i].name.split(": ")[0]+": </em><span>"+subclasses[i].name.split(": ")[1]+"</span></span>");
	}

	$("#subclasses > span").sort(asc_sort).appendTo("#subclasses");
	$("#subclasses > span").click(function() {
		const name = $(this).children("span").text()
		window.location.hash = handleSubclassClick($(this), name)
	});

	$("div#subclasses").prepend($(`<span class="divider">`));
	const toggle = $(`<span class="active" id="class-features-toggle"><span>Class Features</span></span>`);
	$("div#subclasses").prepend(toggle)
	toggle.click(function() {
		window.location.hash = handleToggleFeaturesClicks($(this))
	});

	const subclassHashK = "subclass:";
	function handleSubclassClick(subButton, name) {
		const outStack = [];
		const split = window.location.hash.split(",");

		const encodedSubClass = encodeURIComponent(name).replace("'", "%27").toLowerCase();
		const subclassLink = subclassHashK + encodedSubClass;

		if (subButton.hasClass("active")) {
			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart);
				else {
					const subClassStack = [];
					const subClasses = hashPart.substr(subclassHashK.length).split("+");
					for (let j = 0; j < subClasses.length; j++) {
						const subClass = subClasses[j];
						if (subClass !== encodedSubClass) subClassStack.push(subClass);
					}
					if (subClassStack.length > 0) outStack.push(subclassHashK + subClassStack.join("+"));
				}
			}
		} else {
			let hasSubclassHash = false;

			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart);
				else {
					const subClassStack = [];
					const subClasses = hashPart.substr(subclassHashK.length).split("+");
					for (let j = 0; j < subClasses.length; j++) {
						const subClass = subClasses[j];
						if (subClass !== encodedSubClass) subClassStack.push(subClass);
					}
					subClassStack.push(encodedSubClass);
					if (subClassStack.length > 0) outStack.push(subclassHashK + subClassStack.join("+"));

					hasSubclassHash = true;
				}
			}

			if (!hasSubclassHash) outStack.push(subclassLink);
		}

		return outStack.join(",").toLowerCase();
	}

	function handleToggleFeaturesClicks(subButton) {
		const outStack = [];
		const split = window.location.hash.split(",");

		for (let i = 0; i < split.length; i++) {
			const hashPart = split[i];
			if (!hashPart.startsWith(HASH_HIDE_FEATURES)) outStack.push(hashPart);
		}
		if (subButton.hasClass("active")) {
			outStack.push(HASH_HIDE_FEATURES + "true")
		} else {
			outStack.push(HASH_HIDE_FEATURES + "false")
		}

		return outStack.join(",").toLowerCase();
	}

	function getFeatureHash(featureLink) {
		const hashFeatureLink = HASH_FEATURE + featureLink;
		const outStack = [];
		const split = window.location.hash.split(",");

		let hasFeature = false;

		for (let i = 0; i < split.length; i++) {
			const hashPart = split[i];
			if (!hashPart.startsWith(HASH_FEATURE)) outStack.push(hashPart);
			else {
				outStack.push(hashFeatureLink);
				hasFeature = true;
			}
		}

		if (!hasFeature) outStack.push(hashFeatureLink);

		return outStack.join(",").toLowerCase();
	}
}

function loadsub(sub) {
	let rawSubclasses = null;
	let subclasses = null;
	let feature = null;
	let hideClassFeatures = null;

	for (let i = 0; i < sub.length; i++) {
		const hashPart = sub[i];

		if (hashPart.startsWith(HASH_SUBCLASS)) {
			rawSubclasses = hashPart;
			subclasses = hashPart.slice(HASH_SUBCLASS.length).split("+");
		}
		if (hashPart.startsWith(HASH_FEATURE)) feature = hashPart.slice(HASH_FEATURE.length);
		if (hashPart.startsWith(HASH_HIDE_FEATURES)) hideClassFeatures = hashPart.slice(HASH_HIDE_FEATURES.length) === "true";
	}

	if (subclasses !== null) {
		addFeatureHashes(rawSubclasses);

		const $toShow = [];
		const $toHide = [];
		const subClassSpanList = document.getElementById("subclasses").getElementsByTagName("span");
		outer: for (let i = 0; i < subClassSpanList.length; ++i) {
			let shown = false;
			for (let j = 0; j < subclasses.length; j++) {
				if (subClassSpanList[i].getAttribute('data-subclass') === "none") continue outer; // the class features pill
				const sc = decodeURIComponent(subclasses[j].toLowerCase());
				if (subClassSpanList[i].getAttribute('data-subclass') !== undefined && subClassSpanList[i].getAttribute('data-subclass') !== null
					&& subClassSpanList[i].getAttribute('data-subclass').split(":").slice(1).join(":").trim() === sc.trim()) {

					shown = true;
					break;
				}
			}
			if (shown) {
				$toShow.push($(subClassSpanList[i]));
			} else {
				$toHide.push($(subClassSpanList[i]));
			}
		}

		if ($toShow.length === 0) {
			displayAll();
		} else {
			for (let i = 0; i < $toShow.length; i++) {
				const $el = $toShow[i];
				if (!$el.hasClass("active")) {
					$el.addClass("active");
				}
				$("._class_feature[data-subclass='"+$el.text().toLowerCase()+"']").show();
			}
			for (let i = 0; i < $toHide.length; i++) {
				const $el = $toHide[i];
				if ($el.hasClass("active")) {
					$el.removeClass("active");
				}
				$("._class_feature[data-subclass='"+$el.text().toLowerCase()+"']").hide();
			}
		}

		// show subclass prefixes if we're displaying more than 1 subclass
		if ($toShow.length !== 1) {
			$(".subclass-prefix").show();
		} else {
			$(".subclass-prefix").hide();
		}
	} else {
		displayAll();
	}

	const cfToggle = $("#class-features-toggle");
	if (hideClassFeatures !== null && hideClassFeatures) {
		cfToggle.removeClass("active");
		$(`._class_feature[data-subclass="undefined"]`).hide();
	} else {
		cfToggle.addClass("active");
		$(`._class_feature[data-subclass="undefined"]`).show();
	}

	function addFeatureHashes (rawSubclasses) {
		rawSubclasses = (rawSubclasses === undefined || rawSubclasses === null) ? null : rawSubclasses;
		let needsSubClass = rawSubclasses !== null;
		$(".featurelink").each(
			function() {
				const splitHash = this.href.split(",");
				const hashStack = [];

				for (let i = 0; i < splitHash.length; i++) {
					const hashPart = splitHash[i];

					if (hashPart.startsWith(HASH_SUBCLASS)) {
						if (rawSubclasses !== null) {
							hashStack.push(rawSubclasses);
							needsSubClass = false;
						}
					}
					else hashStack.push(hashPart);
				}

				if (needsSubClass) hashStack.push(rawSubclasses);

				this.href = hashStack.join(",")
			}
		)
	}

	function displayAll() {
		addFeatureHashes();
		$("#subclasses .active").not("#class-features-toggle").removeClass("active");
		$("._class_feature").show();
		$(".subclass-prefix").show();
	}
}
