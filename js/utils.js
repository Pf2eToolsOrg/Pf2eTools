const STR_EMPTY = "";
const STR_VOID_LINK = "javascript:void(0)";
const STR_SLUG_DASH = "-";
const STR_APOSTROPHE = "\u2019";

const ID_SEARCH_BAR = "filter-search-input-group";
const ID_RESET_BUTTON = "reset";

const TYP_STRING = "string";
const TYP_NUMBER = "number";
const TYP_OBJECT = "object";

const ELE_SPAN = "span";
const ELE_UL = "ul";
const ELE_LI = "li";
const ELE_A = "a";
const ELE_P = "p";
const ELE_DIV = "div";
const ELE_BUTTON = "button";
const ELE_INPUT = "input";

const EVNT_MOUSEOVER = "mouseover";
const EVNT_MOUSEOUT = "mouseout";
const EVNT_MOUSELEAVE = "mouseleave";
const EVNT_MOUSEENTER = "mouseenter";
const EVNT_CLICK = "click";

const ATB_ID = "id";
const ATB_CLASS = "class";
const ATB_TITLE = "title";
const ATB_VALUE = "value";
const ATB_HREF = "href";
const ATB_STYLE = "style";
const ATB_CHECKED = "checked";
const ATB_TYPE = "type";
const ATB_ONCLICK = "onclick";

const STL_DISPLAY_INITIAL = "display: initial";
const STL_DISPLAY_NONE = "display: none";

const FLTR_SOURCE = "filterSource";
const FLTR_TYPE = "filterType";
const FLTR_CR = "filterCr";
const FLTR_3PP = "filter3pp";
const FLTR_ABILITIES = "filterAbilities";
const FLTR_ORDER = "filterOrder";
const FLTR_ABILITIES_CHOOSE = "filterAbilitiesChoose";
const FLTR_SIZE = "filterSize";
const FLTR_LEVEL = "filterLevel";
const FLTR_SCHOOL = "filterSchool";
const FLTR_RANGE = "filterRange";
const FLTR_CLASS = "filterClass";
const FLTR_META = "filterMeta";
const FLTR_ACTION = "filterAction";
const FLTR_TIER = "filterTier";
const FLTR_RARITY = "filterRarity";
const FLTR_ATTUNEMENT = "filterAttunement";
const FLTR_LIST_SEP = ";";

const CLSS_NON_STANDARD_SOURCE = "spicy-sauce";
const CLSS_SUBCLASS_FEATURE = "subclass-feature";

const ATB_DATA_LIST_SEP = "||";
const ATB_DATA_PART_SEP = "::";
const ATB_DATA_SC = "data-subclass";
const ATB_DATA_SRC = "data-source";

// STRING ==============================================================================================================
// Appropriated from StackOverflow (literally, the site uses this code)
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
	"use strict";
	let str = this.toString();
	if (arguments.length) {
		const t = typeof arguments[0];
		let key;
		const args = TYP_STRING === t || TYP_NUMBER === t ?
			Array.prototype.slice.call(arguments)
			: arguments[0];

		for (key in args) {
			str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
		}
	}

	return str;
};

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

String.prototype.uppercaseFirst = String.prototype.uppercaseFirst ||
function () {
	const str = this.toString();
	if (str.length === 0) return str;
	if (str.length === 1) return str.charAt(0).toUpperCase();
	return str.charAt(0).toUpperCase() + str.slice(1);
};

// TEXT COMBINING ======================================================================================================
function utils_combineText(textList, tagPerItem, textBlockInlineTitle) {
	tagPerItem = tagPerItem === undefined ? null : tagPerItem;
	textBlockInlineTitle = textBlockInlineTitle === undefined ? null : textBlockInlineTitle;
	let textStack = "";
	if (typeof textList === TYP_STRING) {
		return getString(textList, true)
	}
	for (let i = 0; i < textList.length; ++i) {
		if (typeof textList[i] === TYP_OBJECT) {
			if (textList[i].islist === "YES") {
				textStack += utils_makeOldList(textList[i]);
			}
			if (textList[i].type === "list") {
				textStack += utils_makeList(textList[i]);
			}
			if (textList[i].hassubtitle === "YES") {
				// if required, add inline header before we go deeper
				if (textBlockInlineTitle !== null && i === 0) {
					textStack += textBlockInlineTitle;
				}
				textStack += utils_combineText(textList[i].text, tagPerItem, utils_makeSubHeader(textList[i].title));
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
			textStack += getString(textList[i], textBlockInlineTitle !== null && i === 0)
		}
	}
	return textStack;

	function getString(text, addTitle) {
		const openTag = tagPerItem === null ? "" : "<" + tagPerItem + ">";
		const closeTag = tagPerItem === null ? "" : "</" + tagPerItem + ">";
		const inlineTitle = addTitle ? textBlockInlineTitle : "";
		return openTag + inlineTitle + text + closeTag;
	}
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
function utils_makeLink(linkObj) {
	let href;
	if (linkObj.href.type === "internal") {
		href = `${linkObj.href.path}#`;
		if (linkObj.href.hash !== undefined) {
			if (linkObj.href.hash.type === "constant") {
				href += linkObj.href.hash.value;
			} else if (linkObj.href.hash.type === "multipart") {
				const partStack = [];
				for (let i = 0; i < linkObj.href.hash.parts.length; i++) {
					const part = linkObj.href.hash.parts[i];
					partStack.push(`${part.key}:${part.value}`)
				}
				href += partStack.join(",");
			}
		}
	} else if (linkObj.href.type === "external") {
		href = linkObj.href.url;
	}
	return `<a href='${href}' target='_blank'>${linkObj.text}</a>`;
}
function utils_makeOldList(listObj) { //to handle islist === "YES"
	let outStack = "<ul>";
	for (let i = 0; i < listObj.items.length; ++i) {
		const cur = listObj.items[i];
		outStack += "<li>";
		for (let j = 0; j < cur.entries.length; ++j) {
			if (cur.entries[j].hassubtitle === "YES") {
				outStack += "<br>" + utils_makeListSubHeader(cur.entries[j].title) + cur.entries[j].entries;
			} else {
				outStack += cur.entries[j];
			}
		}
		outStack += "</li>";
	}
	return outStack + "</ul>";
}
function utils_makeList(listObj) { //to handle type === "list"
	let listTag = "ul";
	const subtype = listObj.subtype;
	let suffix = "";
	if(subtype === "ordered") {
		listTag = "ol";
		if (listObj.ordering) suffix = " type=\""+listObj.ordering+"\"";
	}//NOTE: "description" lists are more complex - can handle those later if required
	let outStack = "<"+listTag+suffix+">";
	for (let i = 0; i < listObj.items.length; ++i) {
		const listItem = listObj.items[i];
		outStack += "<li>";
		for (let j = 0; j < listItem.length; ++j) {
			if (listItem[j].type === "link") {
				outStack += utils_makeLink(listItem[j]);
			} else {
				outStack += listItem[j];
			}
		}
		outStack += "</li>";
	}
	return outStack + "</"+listTag+">";

}
function utils_makeSubHeader(text) {
	return "<span class='stats-sub-header'>" + text + ".</span> "
}
function utils_makeListSubHeader(text) {
	return "<span class='stats-list-sub-header'>" + text + ".</span> "
}
function utils_makeAttChoose(attList) {
	if (attList.length === 1) {
		return parse_attAbvToFull(attList[0]) + " modifier";
	} else {
		const attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(parse_attAbvToFull(attList[i]));
		}
		return attsTemp.join(" or ") + " modifier (your choice)";
	}
}
function utils_makeRoller(text) {
	return text.replace(/([1-9]\d*)?d([1-9]\d*)(\s?[+-]\s?\d+)?/g, "<span class='roller' data-roll='$&'>$&</span>");
}


function makeTableThClassText(tableObject, i) {
	return tableObject.thstyleclass === undefined || i >= tableObject.thstyleclass.length ? "" : " class=\"" + tableObject.thstyleclass[i] + "\"";
}
function makeTableTdClassText(tableObject, i) {
	if (tableObject.tdstyleclass !== undefined) {
		return tableObject.tdstyleclass === undefined || i >= tableObject.tdstyleclass.length ? "" : " class=\"" + tableObject.tdstyleclass[i] + "\"";
	} else {
		return makeTableThClassText(tableObject, i);
	}
}

function utils_makePrerequisite(prereqList, shorthand, makeAsArray) {
	shorthand = shorthand === undefined || shorthand === null ? false : shorthand;
	makeAsArray = makeAsArray === undefined || makeAsArray === null ? false : makeAsArray;
	const outStack = [];
	if (prereqList === undefined || prereqList === null) return "";
	for (let i = 0; i < prereqList.length; ++i) {
		const pre = prereqList[i];
		if (pre.race !== undefined) {
			for (let j = 0; j < pre.race.length; ++j) {
				if (shorthand) {
					const DASH = "-";
					const raceNameParts = pre.race[j].name.split(DASH);
					let raceName = [];
					for (let k = 0; k < raceNameParts.length; ++k) {
						raceName.push(raceNameParts[k].uppercaseFirst());
					}
					raceName = raceName.join(DASH);
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				} else {
					const raceName = j === 0 ? pre.race[j].name.uppercaseFirst() : pre.race[j].name;
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				}
			}
		}
		if (pre.ability !== undefined) {
			// this assumes all ability requirements are the same (13), correct as of 2017-10-06
			let attCount = 0;
			for (let j = 0; j < pre.ability.length; ++j) {
				for (const att in pre.ability[j]) {
					if (!pre.ability[j].hasOwnProperty(att)) continue;
					if (shorthand) {
						outStack.push(att.uppercaseFirst() + (attCount === pre.ability.length -1 ? " 13+" : ""));
					} else {
						outStack.push(parse_attAbvToFull(att) + (attCount === pre.ability.length -1 ? " 13 or higher" : ""));
					}
					attCount++;
				}
			}
		}
		if (pre.proficiency !== undefined) {
			// only handles armor proficiency requirements,
			for (let j = 0; j < pre.proficiency.length; ++j) {
				for (const type in pre.proficiency[j]) { // type is armor/weapon/etc.
					if (!pre.proficiency[j].hasOwnProperty(type)) continue;
					if (type === "armor") {
						if (shorthand) {
							outStack.push("prof " + parse_armorFullToAbv(pre.proficiency[j][type]) + " armor");
						} else {
							outStack.push("Proficiency with " + pre.proficiency[j][type] + " armor");
						}
					}
				}
			}
		}
		if (pre.spellcasting === "YES") {
			if (shorthand) {
				outStack.push("Spellcasting");
			} else {
				outStack.push("The ability to cast at least one spell");
			}
		}
	}
	if (makeAsArray) {
		return outStack;
	} else {
		if (shorthand) return outStack.join("/");
		else return utils_joinPhraseArray(outStack, ", ", " or ");
	}
}

class AbilityData {
	constructor(asText, asCollection) {
		this.asText = asText;
		this.asCollection = asCollection;
		this.asFilterCollection = asCollection.join(FLTR_LIST_SEP);
	}
}
function utils_getAbilityData(abObj) {
	const ABILITIES = ["Str", "Dex", "Con", "Int", "Wis", "Cha"];
	const mainAbs = [];
	const allAbs = [];
	const abs = [];
	if (abObj !== undefined) {
		handleAllAbilities(abObj);
		handleAbilitiesChoose();
		return new AbilityData(abs.join("; "), allAbs);
	}
	return new AbilityData("", []);

	function handleAllAbilities(abilityList) {
		for (let a = 0; a < ABILITIES.length; ++a) {
			handleAbility(abilityList, ABILITIES[a])
		}
	}

	function handleAbility(parent, ab) {
		if (parent[ab.toLowerCase()] !== undefined) {
			abs.push(ab + " " + (parent[ab.toLowerCase()] < 0 ? "" : "+") + parent[ab.toLowerCase()]);
			mainAbs.push(ab);
			allAbs.push(ab.toLowerCase());
		}
	}

	function handleAbilitiesChoose() {
		if (abObj.choose !== undefined) {
			for (let i = 0; i < abObj.choose.length; ++i) {
				const item = abObj.choose[i];
				let outStack = "Choose ";
				if (item.predefined !== undefined) {
					for (let j = 0; j < item.predefined.length; ++j) {
						const subAbs = [];
						handleAllAbilities(subAbs, item.predefined[j]);
						outStack += subAbs.join(", ") + (j === item.predefined.length - 1 ? "" : " or ");
					}
				} else {
					const allAbilities = item.from.length === 6;
					const allAbilitiesWithParent = isAllAbilitiesWithParent(item);
					let amount = item.amount === undefined ? 1 : item.amount;
					amount = (amount < 0 ? "" : "+") + amount;
					if (allAbilities) {
						outStack += "any ";
					} else if (allAbilitiesWithParent) {
						outStack += "any other ";
					}
					if (item.count !== undefined && item.count > 1) {
						outStack += getNumberString(item.count) + " ";
					}
					if (allAbilities || allAbilitiesWithParent) {
						outStack += amount;
					} else {
						for (let j = 0; j < item.from.length; ++j) {
							let suffix = "";
							if (item.from.length > 1) {
								if (j === item.from.length-2) {
									suffix = " or ";
								} else if (j < item.from.length-2) {
									suffix = ", "
								}
							}
							let thsAmount = " " + amount;
							if (item.from.length > 1) {
								if (j !== item.from.length-1) {
									thsAmount = "";
								}
							}
							outStack += item.from[j].uppercaseFirst() + thsAmount + suffix;
						}
					}
				}
				abs.push(outStack)
			}

		}
	}

	function isAllAbilitiesWithParent(chooseAbs) {
		const tempAbilities = [];
		for (let i = 0; i < mainAbs.length; ++i) {
			tempAbilities.push(mainAbs[i].toLowerCase());
		}
		for (let i = 0; i < chooseAbs.from.length; ++i) {
			const ab = chooseAbs.from[i].toLowerCase();
			if (!tempAbilities.includes(ab)) tempAbilities.push(ab);
			if (!allAbs.includes(ab.toLowerCase)) allAbs.push(ab.toLowerCase());
		}
		return tempAbilities.length === 6;
	}
	function getNumberString(amount) {
		if (amount === 1) return "one";
		if (amount === 2) return "two";
		if (amount === 3) return "three";
		else return amount;
	}
}

// PARSING =============================================================================================================
function _parse_aToB(abMap, a) {
	a = a.trim();
	if (abMap[a] !== undefined) return abMap[a];
	return a;
}
function _parse_bToA(abMap, b) {
	b = b.trim();
	for (const v in abMap) {
		if (!abMap.hasOwnProperty(v)) continue;
		if (abMap[v] === b) return v
	}
	return b;
}

const ATB_ABV_TO_FULL = {
	"str": "Strength",
	"dex": "Dexterity",
	"con": "Constitution",
	"int": "Intelligence",
	"wis": "Wisdom",
	"cha": "Charisma"
};
function parse_attAbvToFull(abv) {
	return _parse_aToB(ATB_ABV_TO_FULL, abv);
}
function parse_attFullToAbv(full) {
	return _parse_bToA(ATB_ABV_TO_FULL, full);
}

const SIZE_ABV_TO_FULL = {
	"T": "Tiny",
	"S": "Small",
	"M": "Medium",
	"L": "Large",
	"H": "Huge",
	"G": "Gargantuan",
	"V": "Varies"
};
function parse_sizeAbvToFull (abv) {
	return _parse_aToB(SIZE_ABV_TO_FULL, abv);
}

function getAbilityModifier (abilityScore) {
	let modifier = Math.floor((abilityScore - 10) / 2);
	if (modifier >= 0) modifier = "+"+modifier;
	return modifier;
}

function addCommas(intNum) {
	return (intNum + "").replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}

const XP_CHART = [200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000, 18000, 20000, 22000, 25000, 30000, 41000, 50000, 62000, 75000, 90000, 105000, 102000, 135000, 155000];

function parse_crToXp (cr) {
	if (cr === "Unknown") return "Unknown";
	if (cr === "0") return "0 or 10";
	if (cr === "1/8") return "25";
	if (cr === "1/4") return "50";
	if (cr === "1/2") return "100";
	return addCommas (XP_CHART[parseInt(cr)-1]);
}

function parse_crToNumber (cr) {
	const parts = cr.trim().split("/");
	if (parts.length === 1) return Number(parts[0]);
	else if (parts.length === 2) return Number(parts[0]) / Number(parts[1]);
	else return 0;
}

const ARMOR_ABV_TO_FULL = {
	"l.": "light",
	"m.": "medium",
	"h.": "heavy",
};
function parse_armorFullToAbv(armor) {
	return _parse_bToA(ARMOR_ABV_TO_FULL, armor);
}

const SRC_CoS = "CoS";
const SRC_DMG = "DMG";
const SRC_EEPC = "EEPC";
const SRC_EET = "EET";
const SRC_HotDQ = "HotDQ";
const SRC_LMoP = "LMoP";
const SRC_MM = "MM";
const SRC_OotA = "OotA";
const SRC_PHB = "PHB";
const SRC_PotA = "PotA";
const SRC_PSA = "PSA";
const SRC_PSI = "PSI";
const SRC_PSK = "PSK";
const SRC_PSZ = "PSZ";
const SRC_RoT = "RoT";
const SRC_RoTOS = "RoTOS";
const SRC_SCAG = "SCAG";
const SRC_SKT = "SKT";
const SRC_ToA = "ToA";
const SRC_ToD = "ToD";
const SRC_TTP = "TTP";
const SRC_TYP = "TftYP";
const SRC_VGM = "VGM";
const SRC_XGE = "XGE";

const SRC_ALCoS = "ALCurseOfStrahd";
const SRC_ALEE = "ALElementalEvil";
const SRC_ALRoD = "ALRageOfDemons";

const SRC_UA_PREFIX = "UA";
const SRC_UAA = SRC_UA_PREFIX + "Artificer";
const SRC_UAEAG = SRC_UA_PREFIX + "EladrinAndGith";
const SRC_UAEBB = SRC_UA_PREFIX + "Eberron";
const SRC_UAFFR = SRC_UA_PREFIX + "FeatsForRaces";
const SRC_UAFFS = SRC_UA_PREFIX + "FeatsForSkills";
const SRC_UAFO = SRC_UA_PREFIX + "FiendishOptions";
const SRC_UAFT = SRC_UA_PREFIX + "Feats";
const SRC_UAGH = SRC_UA_PREFIX + "GothicHeroes";
const SRC_UAMDM = SRC_UA_PREFIX + "ModernMagic";
const SRC_UASSP = SRC_UA_PREFIX + "StarterSpells";
const SRC_UATMC = SRC_UA_PREFIX + "TheMysticClass";
const SRC_UATOBM = SRC_UA_PREFIX + "ThatOldBlackMagic";
const SRC_UATRR = SRC_UA_PREFIX + "TheRangerRevised";
const SRC_UAWA = SRC_UA_PREFIX + "WaterborneAdventures";
const SRC_UAVR = SRC_UA_PREFIX + "VariantRules";
const SRC_UALDR = SRC_UA_PREFIX + "LightDarkUnderdark";
const SRC_UARAR = SRC_UA_PREFIX + "RangerAndRogue";
const SRC_UAATOSC = SRC_UA_PREFIX + "ATrioOfSubclasses";
const SRC_UABPP = SRC_UA_PREFIX + "BarbarianPrimalPaths";
const SRC_UARSC = SRC_UA_PREFIX + "RevisedSubclasses";
const SRC_UAKOO = SRC_UA_PREFIX + "KitsOfOld";
const SRC_UABBC = SRC_UA_PREFIX + "BardBardColleges";
const SRC_UACDD = SRC_UA_PREFIX + "ClericDivineDomains";
const SRC_UAD = SRC_UA_PREFIX + "Druid";
const SRC_UARCO = SRC_UA_PREFIX + "RevisedClassOptions";
const SRC_UAF = SRC_UA_PREFIX + "Fighter";
const SRC_UAM = SRC_UA_PREFIX + "Monk";
const SRC_UAP = SRC_UA_PREFIX + "Paladin";
const SRC_UAMC = SRC_UA_PREFIX + "ModifyingClasses";
const SRC_UAS = SRC_UA_PREFIX + "Sorcerer";
const SRC_UAWAW = SRC_UA_PREFIX + "WarlockAndWizard";
const SRC_UATF = SRC_UA_PREFIX + "TheFaithful";
const SRC_UAWR = SRC_UA_PREFIX + "WizardRevisited";
const SRC_UAESR = SRC_UA_PREFIX + "ElfSubraces";

const SRC_BOLS_3PP = "BoLS 3pp";
const SRC_ToB_3PP = "ToB 3pp";

const AL_PREFIX = "Adventurers League: ";
const PS_PREFIX = "Plane Shift: ";
const UA_PREFIX = "Unearthed Arcana: ";

const SOURCE_JSON_TO_FULL = {};
SOURCE_JSON_TO_FULL[SRC_CoS] = "Curse of Strahd";
SOURCE_JSON_TO_FULL[SRC_DMG] = "Dungeon Master's Guide";
SOURCE_JSON_TO_FULL[SRC_EEPC] = "Elemental Evil Player's Companion";
SOURCE_JSON_TO_FULL[SRC_EET] = "Elemental Evil: Trinkets";
SOURCE_JSON_TO_FULL[SRC_HotDQ] = "Hoard of the Dragon Queen";
SOURCE_JSON_TO_FULL[SRC_LMoP] = "Lost Mine of Phandelver";
SOURCE_JSON_TO_FULL[SRC_MM] = "Monster Manual";
SOURCE_JSON_TO_FULL[SRC_OotA] = "Out of the Abyss";
SOURCE_JSON_TO_FULL[SRC_PHB] = "Player's Handbook";
SOURCE_JSON_TO_FULL[SRC_PotA] = "Princes of the Apocalypse";
SOURCE_JSON_TO_FULL[SRC_RoT] = "The Rise of Tiamat";
SOURCE_JSON_TO_FULL[SRC_RoTOS] = "The Rise of Tiamat Online Supplement";
SOURCE_JSON_TO_FULL[SRC_SCAG] = "Sword Coast Adventurer's Guide";
SOURCE_JSON_TO_FULL[SRC_SKT] = "Storm King's Thunder";
SOURCE_JSON_TO_FULL[SRC_ToA] = "Tomb of Annihilation";
SOURCE_JSON_TO_FULL[SRC_ToD] = "Tyranny of Dragons";
SOURCE_JSON_TO_FULL[SRC_TTP] = "The Tortle Package";
SOURCE_JSON_TO_FULL[SRC_TYP] = "Tales from the Yawning Portal";
SOURCE_JSON_TO_FULL[SRC_VGM] = "Volo's Guide to Monsters";
SOURCE_JSON_TO_FULL[SRC_XGE] = "Xanathar's Guide to Everything";
SOURCE_JSON_TO_FULL[SRC_ALCoS] = AL_PREFIX + "Curse of Strahd";
SOURCE_JSON_TO_FULL[SRC_ALEE] = AL_PREFIX + "Elemental Evil";
SOURCE_JSON_TO_FULL[SRC_ALRoD] = AL_PREFIX + "Rage of Demons";
SOURCE_JSON_TO_FULL[SRC_PSA] = PS_PREFIX + "Amonkhet";
SOURCE_JSON_TO_FULL[SRC_PSI] = PS_PREFIX + "Innistrad";
SOURCE_JSON_TO_FULL[SRC_PSK] = PS_PREFIX + "Kaladesh";
SOURCE_JSON_TO_FULL[SRC_PSZ] = PS_PREFIX + "Zendikar";
SOURCE_JSON_TO_FULL[SRC_UAA] = UA_PREFIX + "Artificer";
SOURCE_JSON_TO_FULL[SRC_UAEAG] = UA_PREFIX + "Eladrin and Gith";
SOURCE_JSON_TO_FULL[SRC_UAEBB] = UA_PREFIX + "Eberron";
SOURCE_JSON_TO_FULL[SRC_UAFFR] = UA_PREFIX + "Feats for Races";
SOURCE_JSON_TO_FULL[SRC_UAFFS] = UA_PREFIX + "Feats for Skills";
SOURCE_JSON_TO_FULL[SRC_UAFO] = UA_PREFIX + "Fiendish Options";
SOURCE_JSON_TO_FULL[SRC_UAFT] = UA_PREFIX + "Feats";
SOURCE_JSON_TO_FULL[SRC_UAGH] = UA_PREFIX + "Gothic Heroes";
SOURCE_JSON_TO_FULL[SRC_UAMDM] = UA_PREFIX + "Modern Magic";
SOURCE_JSON_TO_FULL[SRC_UASSP] = UA_PREFIX + "Starter Spells";
SOURCE_JSON_TO_FULL[SRC_UATMC] = UA_PREFIX + "The Mystic Class";
SOURCE_JSON_TO_FULL[SRC_UATOBM] = UA_PREFIX + "That Old Black Magic";
SOURCE_JSON_TO_FULL[SRC_UATRR] = UA_PREFIX + "The Ranger, Revised";
SOURCE_JSON_TO_FULL[SRC_UAWA] = UA_PREFIX + "Waterborne Adventures";
SOURCE_JSON_TO_FULL[SRC_UAVR] = UA_PREFIX + "Variant Rules";
SOURCE_JSON_TO_FULL[SRC_UALDR] = UA_PREFIX + "Light, Dark, Underdark!";
SOURCE_JSON_TO_FULL[SRC_UARAR] = UA_PREFIX + "Ranger and Rogue";
SOURCE_JSON_TO_FULL[SRC_UAATOSC] = UA_PREFIX + "A Trio of Subclasses";
SOURCE_JSON_TO_FULL[SRC_UABPP] = UA_PREFIX + "Barbarian Primal Paths";
SOURCE_JSON_TO_FULL[SRC_UARSC] = UA_PREFIX + "Revised Subclasses";
SOURCE_JSON_TO_FULL[SRC_UAKOO] = UA_PREFIX + "Kits of Old";
SOURCE_JSON_TO_FULL[SRC_UABBC] = UA_PREFIX + "Bard: Bard Colleges";
SOURCE_JSON_TO_FULL[SRC_UACDD] = UA_PREFIX + "Cleric: Divine Domains";
SOURCE_JSON_TO_FULL[SRC_UAD] = UA_PREFIX + "Druid";
SOURCE_JSON_TO_FULL[SRC_UARCO] = UA_PREFIX + "Revised Class Options";
SOURCE_JSON_TO_FULL[SRC_UAF] = UA_PREFIX + "Fighter";
SOURCE_JSON_TO_FULL[SRC_UAM] = UA_PREFIX + "Monk";
SOURCE_JSON_TO_FULL[SRC_UAP] = UA_PREFIX + "Paladin";
SOURCE_JSON_TO_FULL[SRC_UAMC] = UA_PREFIX + "Modifying Classes";
SOURCE_JSON_TO_FULL[SRC_UAS] = UA_PREFIX + "Sorcerer";
SOURCE_JSON_TO_FULL[SRC_UAWAW] = UA_PREFIX + "Warlock and Wizard";
SOURCE_JSON_TO_FULL[SRC_UATF] = UA_PREFIX + "The Faithful";
SOURCE_JSON_TO_FULL[SRC_UAWR] = UA_PREFIX + "Wizard Revisited";
SOURCE_JSON_TO_FULL[SRC_UAESR] = UA_PREFIX + "Elf Subraces";
SOURCE_JSON_TO_FULL[SRC_BOLS_3PP] = "Book of Lost Spells (3pp)";
SOURCE_JSON_TO_FULL[SRC_ToB_3PP] = "Tome of Beasts (3pp)";

const SOURCE_JSON_TO_ABV = {};
SOURCE_JSON_TO_ABV[SRC_CoS] = "CoS";
SOURCE_JSON_TO_ABV[SRC_DMG] = "DMG";
SOURCE_JSON_TO_ABV[SRC_EEPC] = "EEPC";
SOURCE_JSON_TO_ABV[SRC_EET] = "EET";
SOURCE_JSON_TO_ABV[SRC_HotDQ] = "HotDQ";
SOURCE_JSON_TO_ABV[SRC_LMoP] = "LMoP";
SOURCE_JSON_TO_ABV[SRC_MM] = "MM";
SOURCE_JSON_TO_ABV[SRC_OotA] = "OotA";
SOURCE_JSON_TO_ABV[SRC_PHB] = "PHB";
SOURCE_JSON_TO_ABV[SRC_PotA] = "PotA";
SOURCE_JSON_TO_ABV[SRC_RoT] = "RoT";
SOURCE_JSON_TO_ABV[SRC_RoTOS] = "RoTOS";
SOURCE_JSON_TO_ABV[SRC_SCAG] = "SCAG";
SOURCE_JSON_TO_ABV[SRC_SKT] = "SKT";
SOURCE_JSON_TO_ABV[SRC_ToA] = "ToA";
SOURCE_JSON_TO_ABV[SRC_ToD] = "ToD";
SOURCE_JSON_TO_ABV[SRC_TTP] = "TTP";
SOURCE_JSON_TO_ABV[SRC_TYP] = "TftYP";
SOURCE_JSON_TO_ABV[SRC_VGM] = "VGM";
SOURCE_JSON_TO_ABV[SRC_XGE] = "XGE";
SOURCE_JSON_TO_ABV[SRC_ALCoS] = "ALCoS";
SOURCE_JSON_TO_ABV[SRC_ALEE] = "ALEE";
SOURCE_JSON_TO_ABV[SRC_ALRoD] = "ALRoD";
SOURCE_JSON_TO_ABV[SRC_PSA] = "PSA";
SOURCE_JSON_TO_ABV[SRC_PSI] = "PSI";
SOURCE_JSON_TO_ABV[SRC_PSK] = "PSK";
SOURCE_JSON_TO_ABV[SRC_PSZ] = "PSZ";
SOURCE_JSON_TO_ABV[SRC_UAA] = "UAA";
SOURCE_JSON_TO_ABV[SRC_UAEAG] = "UAEaG";
SOURCE_JSON_TO_ABV[SRC_UAEBB] = "UAEB";
SOURCE_JSON_TO_ABV[SRC_UAFFR] = "UAFFR";
SOURCE_JSON_TO_ABV[SRC_UAFFS] = "UAFFS";
SOURCE_JSON_TO_ABV[SRC_UAFO] = "UAFO";
SOURCE_JSON_TO_ABV[SRC_UAFT] = "UAFT";
SOURCE_JSON_TO_ABV[SRC_UAGH] = "UAGH";
SOURCE_JSON_TO_ABV[SRC_UAMDM] = "UAMM";
SOURCE_JSON_TO_ABV[SRC_UASSP] = "UASS";
SOURCE_JSON_TO_ABV[SRC_UATMC] = "UAM";
SOURCE_JSON_TO_ABV[SRC_UATOBM] = "UAOBM";
SOURCE_JSON_TO_ABV[SRC_UATRR] = "UATRR";
SOURCE_JSON_TO_ABV[SRC_UAWA] = "UAWA";
SOURCE_JSON_TO_ABV[SRC_UAVR] = "UAVR";
SOURCE_JSON_TO_ABV[SRC_UALDR] = "UALDU";
SOURCE_JSON_TO_ABV[SRC_UARAR] = "UARAR";
SOURCE_JSON_TO_ABV[SRC_UAATOSC] = "UAATOSC";
SOURCE_JSON_TO_ABV[SRC_UABPP] = "UABPP";
SOURCE_JSON_TO_ABV[SRC_UARSC] = "UARSC";
SOURCE_JSON_TO_ABV[SRC_UAKOO] = "UAKOO";
SOURCE_JSON_TO_ABV[SRC_UABBC] = "UABBC";
SOURCE_JSON_TO_ABV[SRC_UACDD] = "UACDD";
SOURCE_JSON_TO_ABV[SRC_UAD] = "UAD";
SOURCE_JSON_TO_ABV[SRC_UARCO] = "UARCO";
SOURCE_JSON_TO_ABV[SRC_UAF] = "UAF";
SOURCE_JSON_TO_ABV[SRC_UAM] = "UAM";
SOURCE_JSON_TO_ABV[SRC_UAP] = "UAP";
SOURCE_JSON_TO_ABV[SRC_UAMC] = "UAMC";
SOURCE_JSON_TO_ABV[SRC_UAS] = "UAS";
SOURCE_JSON_TO_ABV[SRC_UAWAW] = "UAWAW";
SOURCE_JSON_TO_ABV[SRC_UATF] = "UATF";
SOURCE_JSON_TO_ABV[SRC_UAWR] = "UAWR";
SOURCE_JSON_TO_ABV[SRC_UAESR] = "UAESR";
SOURCE_JSON_TO_ABV[SRC_BOLS_3PP] = "BolS (3pp)";
SOURCE_JSON_TO_ABV[SRC_ToB_3PP] = "ToB (3pp)";

function parse_sourceJsonToFull (source) {
	return _parse_aToB(SOURCE_JSON_TO_FULL, source).replace("'", STR_APOSTROPHE);
}
function parse_sourceJsonToAbv(source) {
	return _parse_aToB(SOURCE_JSON_TO_ABV, source);
}

function isSuperceded(name, source) {
	return (name !== undefined && name !== null && source !== undefined && source !== null) &&
		(name === "Way of the Sun Soul" && source === SRC_SCAG) ||
		(name === "Mastermind" && source === SRC_SCAG) ||
		(name === "Swashbuckler" && source === SRC_SCAG) ||
		(name === "Storm Sorcery" && source === SRC_SCAG);
}

function isNonstandardSource(source) {
	return (source !== undefined && source !== null) && (source.startsWith(SRC_UA_PREFIX) || source === SRC_PSA || source === SRC_PSK || source === SRC_EEPC || source === SRC_PSI || source === SRC_PSZ);
}

function parse_stringToSlug(str) {
	return str.toLowerCase().replace(/[^\w ]+/g, STR_EMPTY).replace(/ +/g, STR_SLUG_DASH);
}

const ITEM_TYPE_JSON_TO_ABV = {
	"A": "Ammunition",
	"AT": "Artisan Tool",
	"EXP": "Explosive",
	"G": "Adventuring Gear",
	"GS": "Gaming Set",
	"HA": "Heavy Armor",
	"INS": "Instrument",
	"LA": "Light Armor",
	"M": "Melee Weapon",
	"MA": "Medium Armor",
	"MNT": "Mount",
	"P": "Potion",
	"R": "Ranged Weapon",
	"RD": "Rod",
	"RG": "Ring",
	"S": "Shield",
	"SC": "Scroll",
	"SCF": "Spellcasting Focus",
	"T": "Tool",
	"TAH": "Tack and Harness",
	"TG": "Trade Good",
	"VEH": "Vehicle",
	"WD": "Wand"
};

function parse_itemTypeToAbv (type) {
	return _parse_aToB(ITEM_TYPE_JSON_TO_ABV, type);
}

const DMGTYPE_JSON_TO_FULL = {
	"B": "bludgeoning",
	"N": "necrotic",
	"P": "piercing",
	"R": "radiant",
	"S": "slashing"
};

function parse_dmgTypeToFull (dmgType) {
	return _parse_aToB(DMGTYPE_JSON_TO_FULL, dmgType);
}

const NUMBERS_ONES = ['','one','two','three','four','five','six','seven','eight','nine'];
const NUMBERS_TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const NUMBERS_TEENS = ['ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
function parse_numberToString(num) {
	if (num === 0) return "zero";
	else return parse_hundreds(num);

	function parse_hundreds(num){
		if (num > 99){
			return NUMBERS_ONES[Math.floor(num/100)]+" hundred "+parse_tens(num%100);
		}
		else{
			return parse_tens(num);
		}
	}
	function parse_tens(num){
		if (num<10) return NUMBERS_ONES[num];
		else if (num>=10 && num<20) return NUMBERS_TEENS[num-10];
		else{
			return NUMBERS_TENS[Math.floor(num/10)]+" "+NUMBERS_ONES[num%10];
		}
	}
}

const PROPERTY_JSON_TO_ABV = {
	"2H": "two-handed",
	"A": "ammunition",
	"BF": "burst fire",
	"F": "finesse",
	"H": "heavy",
	"L": "light",
	"LD": "loading",
	"R": "reach",
	"RLD": "reload",
	"S": "special",
	"T": "thrown",
	"V": "versatile"
};

function parse_propertyToAbv (property) {
	return _parse_aToB(PROPERTY_JSON_TO_ABV, property);
}

// DATA LINKS ==========================================================================================================
function utils_nameToDataLink(name) {
	return encodeURIComponent(name.toLowerCase()).replace("'","%27");
}

// CONVENIENCE/ELEMENTS ================================================================================================
// TODO refactor/remove (switch to jQuery versions)
function toggleCheckBox(cb) {
	if (cb.checked === true) cb.checked = false;
	else cb.checked = true;
}
function stopEvent(event) {
	event.stopPropagation();
	event.preventDefault();
}
function toggleVisible(element) {
	if (isShowing(element)) hide(element);
	else show(element);
}
function isShowing(element) {
	return element.hasAttribute(ATB_STYLE) && element.getAttribute(ATB_STYLE).includes(STL_DISPLAY_INITIAL);
}
function show(element) {
	element.setAttribute(ATB_STYLE, STL_DISPLAY_INITIAL);
}
function hide(element) {
	element.setAttribute(ATB_STYLE, STL_DISPLAY_NONE);
}

// SEARCH AND FILTER ===================================================================================================
function search(options) {
	const list = new List("listcontainer", options);
	list.sort("name")
	$("#reset").click(function() {
		$("#filtertools select").val("All");
		$("#search").val("");
		list.search();
		list.sort("name");
		list.filter();
	})
	return list
}

function addDropdownOption(dropdown, optionVal, optionText) {
	if (optionVal === undefined || optionVal === null) return;
	let inOptions = false;
	dropdown.find("option").each(function() {
		if (this.value === optionVal) {
			inOptions = true;
			return false;
		}
	});
	if (!inOptions) {
		dropdown.append("<option value='" + optionVal + "'>" + optionText + "</option>");
	}
}

// ENCODING/DECODING ===================================================================================================
function encodeForHash(str) {
	return encodeURIComponent(str).toLowerCase().replace("'","%27")
}

// SORTING =============================================================================================================
// TODO refactor
function ascSort(a, b) {
	if (b === a) return 0;
	return b < a ? 1 : -1;
}

function asc_sort(a, b){
	if ($(b).text() === $(a).text()) return 0;
	return $(b).text() < $(a).text() ? 1 : -1;
}

function asc_sort_cr(a, b) {
	const aNum = parse_crToNumber($(a).text());
	const bNum = parse_crToNumber($(b).text());
	if (aNum === bNum) return 0;
	return bNum < aNum ? 1 : -1;
}

function asc_sort_range(a, b){
	if (parseInt(b.value) === parseInt(a.value)) return 0;
	return parseInt(b.value) < parseInt(a.value) ? 1 : -1;
}

function desc_sort(a, b){
	if ($(b).text() === $(a).text()) return 0;
	return $(b).text() > $(a).text() ? 1 : -1;
}

function compareNames(a, b) {
	if (b._values.name.toLowerCase() === a._values.name.toLowerCase()) return 0;
	else if (b._values.name.toLowerCase() > a._values.name.toLowerCase()) return 1;
	else if (b._values.name.toLowerCase() < a._values.name.toLowerCase()) return -1;
}

// ARRAYS ==============================================================================================================
Array.prototype.joinConjunct = String.prototype.joinConjunct ||
function (joinWith, conjunctWith) {
	return this.length === 1 ? String(this[0]) : this.length === 2 ? this.join(conjunctWith) : this.slice(0, -1).join(joinWith) + conjunctWith + this.slice(-1);
};

// JSON LOADING ========================================================================================================
function loadJSON(url, onLoadFunction, ...otherData) {
	const request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.overrideMimeType("application/json");
	request.onload = function() {
		const data = JSON.parse(this.response);
		onLoadFunction(data, otherData);
	};
	request.send();
}
