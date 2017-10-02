// TEXT COMBINING ======================================================================================================
function utils_combineText(textList, tagPerItem, textBlockInlineTitle) {
	tagPerItem = tagPerItem === undefined ? null : tagPerItem;
	textBlockInlineTitle = textBlockInlineTitle === undefined ? null : textBlockInlineTitle;
	let textStack = "";
	for (let i = 0; i < textList.length; ++i) {
		if (typeof textList[i] === 'object') {
			if (textList[i].istable === "YES") {
				textStack += utils_makeTable(textList[i]);
			}
			if (textList[i].hassavedc === "YES") {
				textStack += utils_makeAttDc(textList[i]);
			}
			if (textList[i].hasattackmod === "YES") {
				textStack += utils_makeAttAttackMod(textList[i]);
			}
		} else {
			let openTag = tagPerItem === null ? "" : "<" + tagPerItem + ">";
			let closeTag = tagPerItem === null ? "" : "</" + tagPerItem + ">";
			let inlineTitle = textBlockInlineTitle !== null && i === 0 ? textBlockInlineTitle : "";
			textStack += openTag + inlineTitle + textList[i] + closeTag;
		}
	}
	return textStack;
}

function utils_makeTable(tableObject) {
	let tableStack = "<table>";
	if (tableObject.caption !== undefined) {
		tableStack += "<caption>" + tableObject.caption + "</caption>";
	}
	tableStack += "<thead><tr>";

	for (let i = 0; i < tableObject.thead.length; ++i) {
		tableStack += "<th" + makeTableThClassText(tableObject, i) + ">" + tableObject.thead[i] + "</th>"
	}

	tableStack += "</tr></thead><tbody>";
	for (let i = 0; i < tableObject.tbody.length; ++i) {
		tableStack += "<tr>";
		for (let j = 0; j < tableObject.tbody[i].length; ++j) {
			tableStack += "<td" + makeTableTdClassText(tableObject, j) + ">" + tableObject.tbody[i][j] + "</td>";
		}
		tableStack += "</tr>";
	}
	tableStack += "</tbody></table>";
	return tableStack;
}

function utils_makeAttDc(attDcObj) {
	return "<p class='spellabilitysubtext'><span>" + attDcObj.name + " save DC</span> = 8 + your proficiency bonus + your " + utils_makeAttChoose(attDcObj.attributes) + "</p>"

}
function utils_makeAttAttackMod(attAtkObj) {
	return "<p class='spellabilitysubtext'><span>" + attAtkObj.name + " attack modifier</span> = your proficiency bonus + your " + utils_makeAttChoose(attAtkObj.attributes) + "</p>"
}
function utils_makeAttChoose(attList) {
	if (attList.length === 1) {
		return parse_attAbvToFull(attList[0]) + " modifier";
	} else {
		let attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(parse_attAbvToFull(attList[i]));
		}
		return attsTemp.join(" or ") + " modifier (your choice)";
	}
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

// PARSING =============================================================================================================
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

const SRC_PHB = "PHB";
const SRC_EEPC = "EEPC";
const SRC_SCAG = "SCAG";
const SRC_UAMystic = "UAMystic";
const SRC_UAStarterSpells = "UAStarterSpells";
const SRC_UAModern = "UAModern";
const SRC_UATOBM = "UATOBM";
const SRC_BOLS_3PP = "BoLS 3pp";
function parse_sourceToFull (source) {
	if (source === SRC_PHB) source = "Player's Handbook";
	if (source === SRC_EEPC) source = "Elemental Evil Player's Companion";
	if (source === SRC_SCAG) source = "Sword Coast Adventurer's Guide";
	if (source === SRC_UAMystic) source = "Unearthed Arcana: The Mystic Class";
	if (source === SRC_UAStarterSpells) source = "Unearthed Arcana: Starter Spells";
	if (source === SRC_UAModern) source = "Unearthed Arcana: Modern Magic";
	if (source === SRC_UATOBM) source = "Unearthed Arcana: That Old Black Magic";
	if (source === SRC_BOLS_3PP) source = "Book of Lost Spells (3pp)";
	return source;
}
function parse_sourceToAbv(source) {
	if (source === SRC_PHB) source = "PHB";
	if (source === SRC_EEPC) source = "EEPC";
	if (source === SRC_SCAG) source = "SCAG";
	if (source === SRC_UAMystic) source = "UAM";
	if (source === SRC_UAStarterSpells) source = "UASS";
	if (source === SRC_UAModern) source = "UAMM";
	if (source === SRC_UATOBM) source = "UAOBM";
	if (source === SRC_BOLS_3PP) source = "BLS";
	return source;
}

// DATA LINKS ==========================================================================================================
function utils_nameToDataLink(name) {
	return encodeURIComponent(name.toLowerCase()).replace("'","%27");
}