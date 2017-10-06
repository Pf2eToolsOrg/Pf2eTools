function utils_combineText(textList, tagPerItem, textBlockInlineTitle) {
	tagPerItem = tagPerItem === undefined ? null : tagPerItem;
	textBlockInlineTitle = textBlockInlineTitle === undefined ? null : textBlockInlineTitle;
	let textStack = "";
	for (let i = 0; i < textList.length; ++i) {
		if (typeof textList[i] === 'object') {
            if (textList[i].islist === "YES") {
                textStack += utils_makeList(textList[i]);
			}
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
function utils_makeList(listObj) {
	let outStack = "<ul>";
	for (let i = 0; i < listObj.items.length; ++i) {
		outStack += "<li>" + listObj.items[i].text + "</li>"
	}
	return outStack + "</ul>";
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

function utils_makePrerequisite(prereqList) {
    let outStack = [];
    if (prereqList === undefined || prereqList === null) return "";
	for (let i = 0; i < prereqList.length; ++i) {
        let pre = prereqList[i];
        if (pre.race !== undefined) {
			for (let j = 0; j < pre.race.length; ++j) {
                outStack.push(pre.race[j].name + (pre.race[j].subrace !== undefined ? "(" + pre.race[j].subrace + ")" : ""))
			}
		}
		if (pre.ability !== undefined) {
        	// this assumes all ability requirements are the same (13), correct as of 2017-10-06
        	let attCount = 0;
            for (let j = 0; j < pre.ability.length; ++j) {
                for (let att in pre.ability[j]) {
                    if (!pre.ability[j].hasOwnProperty(att)) continue;
                    outStack.push(parse_attAbvToFull(att) + (attCount === pre.ability.length -1 ? " 13 or higher" : ""));
                    attCount++;
                }
            }
		}
		if (pre.proficiency !== undefined) {
        	// only handles armor proficiency requirements,
            for (let j = 0; j < pre.proficiency.length; ++j) {
                for (let type in pre.proficiency[j]) { // type is armor/weapon/etc.
                    if (!pre.proficiency[j].hasOwnProperty(type)) continue;
                    if (type === "armor") outStack.push("Proficiency with " + pre.proficiency[j][type] + " armor");
					else console.log("unimplemented proficiency type in utils_makePrerequisite")
                }
            }
		}
		if (pre.spellcasting === "YES") {
            outStack.push("The ability to cast at least one spell");
		}
	}
	return utils_joinPhraseArray(outStack, ", ", " or ");
}

function utils_joinPhraseArray(array, joiner, lastJoiner) {
    if (array.length === 0) return "";
    if (array.length === 1) return array[0];
    if (array.length === 2) return array.join(lastJoiner);
    else {
        let outStr = "";
        for (let i = 0; i < array.length; ++i) {
            outStr += array[i];
            if (i < array.length-2) outStr += joiner;
            else if (i === array.length-2) outStr += lastJoiner
        }
        return outStr;
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

const SRC_PHB = "PHB";
const SRC_EEPC = "EEPC";
const SRC_SCAG = "SCAG";
const SRC_UAMystic = "UAMystic";
const SRC_UAStarterSpells = "UAStarterSpells";
const SRC_UAModern = "UAModern";
const SRC_UATOBM = "UATOBM";
const SRC_UAEBB = "UAEB";
const SRC_UAFT = "UAFT";
const SRC_UAFFS = "UAFFS";
const SRC_UAFFR = "UAFFR";
const SRC_PSK = "PSK";
const SRC_BOLS_3PP = "BoLS 3pp";

const UA_PREFIX = "Unearthed Arcana: ";
const PS_PREFIX = "Plane Shift: ";
function parse_sourceToFull (source) {
    if (source === SRC_PHB) source = "Player's Handbook";
    if (source === SRC_EEPC) source = "Elemental Evil Player's Companion";
    if (source === SRC_SCAG) source = "Sword Coast Adventurer's Guide";
    if (source === SRC_UAMystic) source = UA_PREFIX + "The Mystic Class";
    if (source === SRC_UAStarterSpells) source = UA_PREFIX + "Starter Spells";
    if (source === SRC_UAModern) source = UA_PREFIX + "Modern Magic";
    if (source === SRC_UATOBM) source = UA_PREFIX + "That Old Black Magic";
    if (source === SRC_UAEBB) source = UA_PREFIX + "Eberron";
    if (source === SRC_UAFT) source = UA_PREFIX + "Feats";
    if (source === SRC_UAFFS) source = UA_PREFIX + "Feats for Skills";
    if (source === SRC_UAFFR) source = UA_PREFIX + "Feats for Races";
    if (source === SRC_PSK) source = PS_PREFIX + "Kaladesh";
    if (source === SRC_BOLS_3PP) source = "Book of Lost Spells (3pp)";
    return source;
}
function parse_abbreviateSource(source) {
    if (source === SRC_PHB) source = "PHB";
    if (source === SRC_EEPC) source = "EEPC";
    if (source === SRC_SCAG) source = "SCAG";
    if (source === SRC_UAMystic) source = "UAM";
    if (source === SRC_UAStarterSpells) source = "UASS";
    if (source === SRC_UAModern) source = "UAMM";
    if (source === SRC_UATOBM) source = "UAOBM";
    if (source === SRC_UAEBB) source = "UAEB";
    if (source === SRC_UAFT) source = "UAFT";
    if (source === SRC_UAFFS) source = "UAFFS";
    if (source === SRC_UAFFR) source = "UAFFR";
    if (source === SRC_PSK) source = "PSK";
    if (source === SRC_BOLS_3PP) source = "BLS";
    return source;
}