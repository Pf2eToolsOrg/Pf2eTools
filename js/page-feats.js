function asc_sort(a, b){
	return ($(b).text()) < ($(a).text()) ? 1 : -1;
}

function dec_sort(a, b){
	return ($(b).text()) > ($(a).text()) ? 1 : -1;
}

var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var featlist = featdata.compendium.feat;

	for (var i = 0; i < featlist.length; i++) {
		var curfeat = featlist[i];
		var name = curfeat.name;
		$("ul.feats").append("<li id='"+i+"' data-link='"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name col-xs-9'>"+name+"</span> <span class='source col-xs-2' title='"+curfeat.source+"'>"+parse_abbreviateSource(curfeat.source)+"</span></li>");

		if (!$("select.sourcefilter:contains(\""+parse_sourceToFull(curfeat.source)+"\")").length) {
			$("select.sourcefilter").append("<option value='"+parse_abbreviateSource(curfeat.source)+"'>"+parse_sourceToFull(curfeat.source)+"</option>");
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
		window.location = "#"+$(this).attr("data-link");
	});

	if (window.location.hash.length) {
		window.onhashchange();
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

function loadhash (id) {
	$("#stats").html(tabledefault);
	var featlist = featdata.compendium.feat;
	var curfeat = featlist[id];

	var name = curfeat.name;
	$("th#name").html(name);

	$("td#prerequisite").html("")
	var prerequisite = utils_makePrerequisite(curfeat.prerequisite);
	if (prerequisite) $("td#prerequisite").html("Prerequisite: "+prerequisite);

	$("tr.text").remove();

	addAttributeItem(curfeat.ability, curfeat.text);

	$("tr#text").after("<tr class='text'><td colspan='6'>"+utils_combineText(curfeat.text, "p")+"</td></tr>");

	function addAttributeItem(abilityObj, textArray) {
		if (abilityObj === undefined) return;
		for (let i = 0; i < textArray.length; ++i) { // insert the new list item at the head of the first list we find list
			if (textArray[i].islist === "YES") {
                textArray[i].items.unshift(abilityObjToListItem())
            }
		}

        function abilityObjToListItem() {
        	let listItem = {};
            listItem.text = attChooseText(abilityObj);
			return listItem;

			function attChooseText() {
				const TO_MAX_OF_TWENTY = ", to a maximum of 20.";
				if (abilityObj.choose === undefined) {
                    let abbArr = [];
                    for (let att in abilityObj) {
                        if(!abilityObj.hasOwnProperty(att)) continue;
                        abbArr.push("Increase your " + parse_attAbvToFull(att) + " score by " + abilityObj[att] + TO_MAX_OF_TWENTY);
                    }
                    return abbArr.join(" ");
				} else {
                    let abbArr = [];
					for (let i = 0; i < abilityObj.choose.length; ++i) {
                        if (abilityObj.choose[i].from.length === 6) {
                            abbArr.push("Increase one ability score of your choice by " + abilityObj.choose.amount + TO_MAX_OF_TWENTY);
                        } else {
                        	let from = abilityObj.choose[i].from;
                        	let amount = abilityObj.choose[i].amount;
                        	let abbChoices = [];
                        	for (let j = 0; j < from.length; ++j) {
                                abbChoices.push(parse_attAbvToFull(from[j]));
							}
							let abbChoicesText = utils_joinPhraseArray(abbChoices, ", ", " or ");
                            abbArr.push("Increase your " + abbChoicesText + " by " + amount + TO_MAX_OF_TWENTY)
						}
					}
                    return abbArr.join(" ");
				}
			}
		}
    }
};
