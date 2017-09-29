function utils_combineText(textList) {
	let textStack = "";
	for (let i = 0; i < textList.length; ++i) {
		if (textList[i].istable === "YES") {
			textStack += utils_makeTable(textList[i]);
		} else if (textList[i].isspellability === "YES") {
			textStack += utils_makeSpellAbilityDc(textList[i]);
			textStack += utils_makeSpellAttackModifier(textList[i]);
		} else {
			textStack += "<p>" + textList[i] + "</p>";
		}
	}
	return textStack;
}

function utils_makeTable(tableObject) {
	let tableStack = "<table><caption>" + tableObject.caption + "</caption><thead><tr>";

	for (let i = 0; i < tableObject.thead.length; ++i) {
		tableStack += "<th" + makeTableThClassText(tableObject, i) + ">" + tableObject.thead[i] + "</th>"
	}

	tableStack += "</tr></thead>";
	for (let i = 0; i < tableObject.tbody.length; ++i) {
		tableStack += "<tr>";
		for (let j = 0; j < tableObject.tbody[i].length; ++j) {
			tableStack += "<td" + makeTableTdClassText(tableObject, j) + ">" + tableObject.tbody[i][j] + "</td>";
		}
		tableStack += "</tr>";
	}
	return tableStack;
}

function utils_makeSpellAbilityDc(spellAttObject) {
	return "<p class='spellabilitysubtext'><span>Spell save DC</span> = 8 + your proficiency bonus + your " + parse_attAbvToFull(spellAttObject.attribute) + " modifier</p>"

}
function utils_makeSpellAttackModifier(spellAttObject) {
	return "<p class='spellabilitysubtext'><span>Spell attack modifier</span> = your proficiency bonus + your " + parse_attAbvToFull(spellAttObject.attribute) + " modifier</p>"
}

function makeTableThClassText(tableObject, i) {
	return (tableObject.thstyleclass === undefined || i >= tableObject.thstyleclass.length ? "" : " class=\"" + tableObject.thstyleclass[i] + "\"")
}
function makeTableTdClassText(tableObject, i) {
	if (tableObject.tdstyleclass !== undefined) {
		return (tableObject.tdstyleclass === undefined || i >= tableObject.tdstyleclass.length ? "" : " class=\"" + tableObject.tdstyleclass[i] + "\"")
	} else {
		return makeTableThClassText(tableObject, i);
	}
}

// PARSING FUNCTIONS ===================================================================================================
function parse_attAbvToFull(attribute) {
	const ABV_TO_FULL = {
		"str": "Strength",
		"dex": "Dexterity",
		"con": "Constitution",
		"int": "Intelligence",
		"wis": "Wisdom",
		"cha": "Charisma"
	};
	return ABV_TO_FULL[attribute.toLowerCase()];
}