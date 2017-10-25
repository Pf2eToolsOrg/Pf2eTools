var mundanelist;
var magiclist;

window.onload = function load() {
	tabledefault = $("#stats").html();

	var itemlist = itemdata.compendium.item;

	for (var i = 0; i < itemlist.length; i++) {

		var curitem = itemlist[i];
		var name = curitem.name;
		var source = curitem.source;

		var type = curitem.type.split(",");
		if (type[0] === "$") continue;

		for (var j = 0; j < type.length; j++) {
			type[j] = parse_itemTypeToAbv (type[j]);
			if (!$("select.typefilter option[value='"+type[j]+"']").length) {
				$("select.typefilter").append("<option value='"+type[j]+"'>"+type[j]+"</option>")
			}
		}

		var rarity = curitem.rarity;
		if (!rarity) rarity = "None";

		var destinationlist = "ul.list.mundane";
		curitemstring = JSON.stringify (curitem);
		if (curitem.rarity || curitem.reqAttune || type.indexOf("W") !== -1 || curitemstring.search(/((magic)|(Devastation Orb)|(Storm Boomerang)|(\s?Spiked Armor\s?)|(Bottled Breath))/g) !== -1) {
			destinationlist = "ul.list.magic";
		}

		$(destinationlist).append("<li><a id='"+i+"' href=\"#"+encodeURIComponent(name).toLowerCase().replace("'","%27")+"\" title=\""+name+"\"><span class='name col-xs-4'>"+name+"</span> <span class='type col-xs-4 col-xs-4-3'>"+type.join(", ")+"</span> <span class='sourcename col-xs-1 col-xs-1-7' title=\""+parse_sourceJsonToFull(source)+"\"><span class='source'>"+parse_sourceJsonToAbv(source)+"</span></span> <span class='rarity col-xs-2'>"+rarity+"</span></a></li>");

		if (!$("select.sourcefilter option[value='"+parse_sourceJsonToAbv(source)+"']").length) {
			$("select.sourcefilter").append("<option title=\""+source+"\" value='"+parse_sourceJsonToAbv(source)+"'>"+parse_sourceJsonToFull(source)+"</option>")
		}
		$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
		$("select.sourcefilter").val("All");
	}

	var options = {
		valueNames: ["name", "source", "type", "rarity"],
		listClass: "mundane"
	};

	mundanelist = search(options);
	options.listClass = "magic";
	magiclist = search(options);

	$(".typefilter option").sort(asc_sort).appendTo(".typefilter");
	$("select.typefilter option[value=All]").prependTo(".typefilter");
	$(".typefilter").val("All");

	initHistory()

	$("form#filtertools select").change(function(){
		var typefilter = $("select.typefilter").val();
		var sourcefilter = $("select.sourcefilter").val().replace(" ","");
		var rarityfilter = $("select.rarityfilter").val();

		mundanelist.filter(function(item) {
			var righttype = false;
			var rightsource = false;
			var rightrarity = false;
			if (typefilter === "All" || item.values().type.indexOf(typefilter) !== -1) righttype = true;
			if (sourcefilter === "All" || item.values().source === sourcefilter) rightsource = true;
			if (rarityfilter === "All" || item.values().rarity === rarityfilter) rightrarity = true;
			if (righttype && rightsource && rightrarity) return true;
			return false;
		});

		magiclist.filter(function(item) {
			var righttype = false;
			var rightsource = false;
			var rightrarity = false;
			if (typefilter === "All" || item.values().type.indexOf(typefilter) !== -1) righttype = true;
			if (sourcefilter === "All" || item.values().source === sourcefilter) rightsource = true;
			if (rarityfilter === "All" || item.values().rarity === rarityfilter) rightrarity = true;
			if (righttype && rightsource && rightrarity) return true;
			return false;
		});

	});

	$("#filtertools button.sort").on("click", function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		magiclist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortitems });
		mundanelist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortitems });
	});

	$("#itemcontainer h3").not(":has(input)").click(function() {
		if ($(this).next("ul.list").css("max-height") === "500px") {
			$(this).siblings("ul.list").animate({
				maxHeight: "250px",
				display: "block"
			});
			return;
		}

		$(this).next("ul.list").animate({
			maxHeight: "500px",
			display: "block"
		}).siblings("ul.list").animate({
			maxHeight: "0",
			display: "none"
		})
	});
}

function rarityValue(rarity) {
	if (rarity === "None") return 0;
	if (rarity === "Common") return 1;
	if (rarity === "Uncommon") return 2;
	if (rarity === "Rare") return 3;
	if (rarity === "Very Rare") return 4;
	if (rarity === "Legendary") return 5;
	if (rarity === "Artifact") return 6;
	if (rarity === "Unknown") return 7;
	return 0;
}

function sortitems(a, b, o) {
	if (o.valueName === "name") {
		return ((b._values.name.toLowerCase()) > (a._values.name.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "type") {
		if (b._values.type === a._values.type) return compareNames(a, b);
		return ((b._values.type.toLowerCase()) > (a._values.type.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "source") {
		if (b._values.source === a._values.source) return compareNames(a, b);
		return ((b._values.source.toLowerCase()) > (a._values.source.toLowerCase())) ? 1 : -1;
	}

	if (o.valueName === "rarity") {
		if (b._values.rarity === a._values.rarity) return compareNames(a, b);
		return (rarityValue(b._values.rarity) > rarityValue(a._values.rarity)) ? 1 : -1;
	}

	return 1;
}

function loadhash (id) {
	$("#currentitem").html(tabledefault);
	var itemlist = itemdata.compendium.item;
	var curitem = itemlist[id];

	var name = curitem.name;
	var source = curitem.source;

	sourceshort = parse_sourceJsonToAbv(source);
	sourcefull = parse_sourceJsonToFull(source);
	$("th#name").html("<span title=\""+sourcefull+"\" class='source source"+sourceshort+"'>"+sourceshort+"</span> "+name);
	$("td#source span").html(sourcefull+", page "+curitem.page);


	$("span#value").html("");
	if (curitem.value) {
		var value = curitem.value;
		if (curitem.weight) value = value + ", ";
		$("td span#value").html(value);
	} else $("td span#value").html("");

	$("span#weight").html("");
	if (curitem.weight) {
		var weight = curitem.weight;
		if (weight == 1) {
			$("td span#weight").html(weight+" lb.");
		} else $("td span#weight").html(weight+" lbs.");
	} else $("td span#weight").html("");

	var attunetext = curitem.reqAttune
	if (attunetext) {
		$("td span#attunement").html("(Requires Attunement"+(attunetext === "YES" ? "" : attunetext)+")");
	} else $("td span#attunement").html("");
		
	var textlist = curitem.text;
	$("tr.text").remove();
	var texthtml = "";

	if (textlist) {
		for (let n = 0; n < textlist.length; n++) {
			if (!textlist[n]) continue;
			let curtextstring = JSON.stringify (textlist[n]);
			if (textlist[n].istable === "YES") {
				texthtml += utils_makeTable(textlist[n]);
			} else {
				texthtml = texthtml + "<p>"+textlist[n].replace(/(Curse|Sentience|Personality)(\.|\:) /g, '<strong>$1.</strong> ')+"</p>";
			}
		}
	}

	$("td span#type").html("");
	$("span#damage").html("");
	$("span#damagetype").html("");
	var type = curitem.type.split(",");
	let bonuslocation=name.indexOf(" +");
	let notseenbonus=true;

	for (var n = 0; n < type.length; n++) {
		var curtype = type[n];
		if (n > 0) $("td span#type").append (", ");
		$("td span#type").append(parse_itemTypeToAbv(curtype));
		if (curtype === "M" || curtype === "R" || curtype === "GUN") {
			$("span#damage").html(curitem.dmg1);
			if(curitem.dmgType) $("span#damagetype").html(parse_dmgTypeToFull(curitem.dmgType));
		}
		if (curtype === "S") $("span#damage").html("AC +"+curitem.ac);
		if (curtype === "LA" ||curtype === "MA"|| curtype === "HA") {
			if (curtype === "LA") $("span#damage").html("AC "+curitem.ac+" + Dex");
			if (curtype === "MA") $("span#damage").html("AC "+curitem.ac+" + Dex (max 2)");
			if (curtype === "HA") $("span#damage").html("AC "+curitem.ac);
			if (bonuslocation !== -1) texthtml += "<p>You have a "+name.substr(bonuslocation+1,2)+" bonus to AC while wearing this armor.</p>";
			if (name.indexOf("Acid Resistance") !== -1) texthtml += "<p>You have resistance to acid damage while you wear this armor.</p>";
			if (name.indexOf("Cold Resistance") !== -1) texthtml += "<p>You have resistance to cold damage while you wear this armor.</p>";
			if (name.indexOf("Fire Resistance") !== -1) texthtml += "<p>You have resistance to fire damage while you wear this armor.</p>";
			if (name.indexOf("Force Resistance") !== -1) texthtml += "<p>You have resistance to force damage while you wear this armor.</p>";
			if (name.indexOf("Lightning Resistance") !== -1) texthtml += "<p>You have resistance to lightning damage while you wear this armor.</p>";
			if (name.indexOf("Necrotic Resistance") !== -1) texthtml += "<p>You have resistance to necrotic damage while you wear this armor.</p>";
			if (name.indexOf("Poison Resistance") !== -1) texthtml += "<p>You have resistance to poison damage while you wear this armor.</p>";
			if (name.indexOf("Psychic Resistance") !== -1) texthtml += "<p>You have resistance to psychic damage while you wear this armor.</p>";
			if (name.indexOf("Radiant Resistance") !== -1) texthtml += "<p>You have resistance to radiant damage while you wear this armor.</p>";
			if (name.indexOf("Thunder Resistance") !== -1) texthtml += "<p>You have resistance to thunder damage while you wear this armor.</p>";
			if (curtype === "HA" && curitem.strength !== undefined) texthtml += "<p>If the wearer has a Strength score lower than " + curitem.strength + ", their speed is reduced by 10 feet.</p>";
			if (curitem.adamantine === "YES") texthtml += "<p>This suit of armor is reinforced with adamantine, one of the hardest substances in existence. While you're wearing it, any critical hit against you becomes a normal hit.</p>";
			if (curitem.stealth === "YES") texthtml += "<p>The wearer has disadvantage on Stealth (Dexterity) checks.</p>";
		} else if (curtype === "A" || curtype === "AF") {
			if (bonuslocation !== -1) texthtml += "<p>You have a "+name.substr(bonuslocation+1,2)+" bonus to attack and damage rolls made with this piece of magic ammunition. Once it hits a target, the ammunition is no longer magical.</p>";
		} else if (curtype === "S") {
			if (bonuslocation !== -1) texthtml += "<p>While holding this shield, you have a "+name.substr(bonuslocation+1,2)+" bonus to AC. This bonus is in addition to the shield's normal bonus to AC.</p>";
		} else if (curtype === "M" || curtype === "MARW" || curtype === "R" || curtype === "SIMW") {
			if (bonuslocation !== -1 && notseenbonus) {
				texthtml += "<p>You have a "+name.substr(bonuslocation+1,2)+" bonus to attack and damage rolls made with this weapon.</p>";
				notseenbonus=false;
			}
		}
	}

	$("tr#text").after("<tr class='text'><td colspan='6' class='text1'>"+texthtml+"</td></tr>");

	$("td span#rarity").html("");
	var rarity = curitem.rarity;
	if (rarity) $("td span#rarity").html(", "+rarity);

	$("span#properties").html("");
	if (curitem.property) {
		var properties = curitem.property.split(",");
		$("span#damagetype").append(" - ");
		for (var i = 0; i < properties.length; i++) {
			var a = b = properties[i];
			a = parse_propertyToAbv (a);
			if (b === "V") a = a + " (" + curitem.dmg2 + ")";
			if (b === "T" || b === "A") a = a + " (" + curitem.range + "ft.)";
			if (b === "RLD") a = a + " (" + curitem.reload + " shots)";
			if (i > 0) a = ", "+a;
			$("span#properties").append(a);
		}
	}

}
