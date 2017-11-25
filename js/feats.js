"use strict";
const JSON_URL = "data/feats.json";
let tabledefault = "";
let featlist;

window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad(data) {
	const NONE = "None";
	tabledefault = $("#stats").html();
	featlist = data.feat;
	for (let i = 0; i < featlist.length; i++) {
		const curfeat = featlist[i];
		const name = curfeat.name;
		const ability = utils_getAbilityData(curfeat.ability);
		if (!ability.asText) ability.asText = NONE;
		const isAbilityChoose = ability.asText.toLowerCase().includes("choose any");
		let prereqText = utils_makePrerequisite(curfeat.prerequisite, true);
		if (!prereqText) prereqText = NONE;
		const CLS_COL_1 = "name col-xs-3 col-xs-3-8";
		const CLS_COL_2 = `source col-xs-1 col-xs-1-7 source${curfeat.source}`;
		const CLS_COL_3 = "ability " + (ability.asText === NONE ? "list-entry-none " : "") + "col-xs-3 col-xs-3-5";
		const CLS_COL_4 = "prerequisite " + (prereqText === NONE ? "list-entry-none " : "") + "col-xs-3";
		$("ul.feats").append(`<li ${FLTR_SOURCE}='${curfeat.source}' ${FLTR_ABILITIES}='${ability.asFilterCollection}' ${FLTR_ABILITIES_CHOOSE}='${isAbilityChoose}'><a id='${i}' href='#${encodeForHash(name)+HASH_LIST_SEP+encodeForHash(curfeat.source)}' title='${name}'><span class='${CLS_COL_1}'>${name}</span> <span class='${CLS_COL_2}' title='${Parser.sourceJsonToFull(curfeat.source)}'>${Parser.sourceJsonToAbv(curfeat.source)}</span> <span class='${CLS_COL_3}'>${ability.asText}</span><span class='${CLS_COL_4}'>${prereqText}</span></a></li>`);

		addDropdownOption($("select.sourcefilter"), curfeat.source, Parser.sourceJsonToFull(curfeat.source));
	}
	$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
	$("select.sourcefilter").val("All");
	const list = search({
		valueNames: ['name', 'source', 'ability', 'prerequisite'],
		listClass: "feats"
	});
	$("form#filtertools select").change(function() {
		const sourcefilter = $("select.sourcefilter").val();
		const bonusfilter = $("select.bonusfilter").val();
		list.filter(function(item) {
			const rightsource = sourcefilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourcefilter;
			const bonusList = item.elm.getAttribute(FLTR_ABILITIES).split(FLTR_LIST_SEP);
			const rightbonuses = bonusfilter === "All" || bonusfilter === "Any" && item.elm.getAttribute(FLTR_ABILITIES_CHOOSE) === "true" && bonusList.length === 6 || bonusList.includes(bonusfilter);
			if (rightsource && rightbonuses) return true;
			return false;
		});
	});
	initHistory()
}

function loadhash(id) {
	$("#stats").html(tabledefault);
	var curfeat = featlist[id];
	var name = curfeat.name;
	$("th#name").html(name);
	$("td#prerequisite").html("")
	var prerequisite = utils_makePrerequisite(curfeat.prerequisite);
	if (prerequisite) $("td#prerequisite").html("Prerequisite: " + prerequisite);
	$("tr.text").remove();
	addAttributeItem(curfeat.ability, curfeat.entries);
	$("tr#text").after("<tr class='text'><td colspan='6'>" + utils_combineText(curfeat.entries, "p") + "</td></tr>");

	function addAttributeItem(abilityObj, textArray) {
		if (abilityObj === undefined) return;
		for (let i = 0; i < textArray.length; ++i) { // insert the new list item at the head of the first list we find list; flag with "hasabilityitem" so we don't do it more than once
			if (textArray[i].type === "list" && textArray[i].hasabilityitem !== "YES") {
				textArray[i].hasabilityitem = "YES";
				textArray[i].items.unshift(abilityObjToListItem())
			}
		}

		function abilityObjToListItem() {
			const TO_MAX_OF_TWENTY = ", to a maximum of 20.";
			const abbArr = [];
			if (abilityObj.choose === undefined) {
				for (const att in abilityObj) {
					if (!abilityObj.hasOwnProperty(att)) continue;
					abbArr.push("Increase your " + Parser.attAbvToFull(att) + " score by " + abilityObj[att] + TO_MAX_OF_TWENTY);
				}
			} else {
				const choose=abilityObj.choose;
				for (let i = 0; i < choose.length; ++i) {
					if (choose[i].from.length === 6) {
						if (choose[i].textreference === "YES") { // only used in "Resilient"
							abbArr.push("Increase the chosen ability score by " + choose[i].amount + TO_MAX_OF_TWENTY);
						} else {
							abbArr.push("Increase one ability score of your choice by " + choose[i].amount + TO_MAX_OF_TWENTY);
						}
					} else {
						const from = choose[i].from;
						const amount = choose[i].amount;
						const abbChoices = [];
						for (let j = 0; j < from.length; ++j) {
							abbChoices.push(Parser.attAbvToFull(from[j]));
						}
						const abbChoicesText = utils_joinPhraseArray(abbChoices, ", ", " or ");
						abbArr.push("Increase your " + abbChoicesText + " by " + amount + TO_MAX_OF_TWENTY);
					}
				}
			}
			return abbArr.join(" ");
		}
	}
}
