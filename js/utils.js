const STR_EMPTY = "";
const STR_VOID_LINK = "javascript:void(0)";

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
const ATB_DATA_LINK = "data-link";
const ATB_TITLE = "title";
const ATB_VALUE = "value";
const ATB_HREF = "href";
const ATB_STYLE = "style";
const ATB_CHECKED = "checked";
const ATB_TYPE = "type";
const ATB_ONCLICK = "onclick";

const STL_DISPLAY_INITIAL = "display: initial";
const STL_DISPLAY_NONE = "display: none";

// STRING ==============================================================================================================
// Appropriated from StackOverflow (literally, the site uses this code)
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
	function () {
		"use strict";
		var str = this.toString();
		if (arguments.length) {
			var t = typeof arguments[0];
			var key;
			var args = (TYP_STRING === t || TYP_NUMBER === t) ?
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
		let str = this.toString();
		if (str.length === 0) return str;
		if (str.length === 1) return str.charAt(0).toUpperCase();
		return str.charAt(0).toUpperCase() + str.slice(1);;
	};

// TEXT COMBINING ======================================================================================================
function utils_combineText(textList, tagPerItem, textBlockInlineTitle) {
	tagPerItem = tagPerItem === undefined ? null : tagPerItem;
	textBlockInlineTitle = textBlockInlineTitle === undefined ? null : textBlockInlineTitle;
	let textStack = "";
	for (let i = 0; i < textList.length; ++i) {
		if (typeof textList[i] === TYP_OBJECT) {
            if (textList[i].islist === "YES") {
                textStack += utils_makeList(textList[i]);
			}
			if (textList[i].hassubtitle === "YES") {
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
		let cur = listObj.items[i];
		outStack += "<li>";
		for (let j = 0; j < cur.text.length; ++j) {
			if (cur.text[j].hassubtitle === "YES") {
				outStack += "<br>" + utils_makeListSubHeader(cur.text[j].title) + cur.text[j].text;
			} else {
				outStack += cur.text[j];
			}
		}
		outStack += "</li>";
	}
	return outStack + "</ul>";
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

function utils_makePrerequisite(prereqList, shorthand, makeAsArray) {
	shorthand = shorthand === undefined || shorthand === null ? false : shorthand;
	makeAsArray = makeAsArray === undefined || makeAsArray === null ? false : makeAsArray;
    let outStack = [];
    if (prereqList === undefined || prereqList === null) return "";
	for (let i = 0; i < prereqList.length; ++i) {
        let pre = prereqList[i];
        if (pre.race !== undefined) {
			for (let j = 0; j < pre.race.length; ++j) {
				if (shorthand) {
					const DASH = "-";
					let raceNameParts = pre.race[j].name.split(DASH);
					let raceName = [];
					for (let k = 0; k < raceNameParts.length; ++k) {
						raceName.push(raceNameParts[k].uppercaseFirst());
					}
					raceName = raceName.join(DASH);
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				} else {
					let raceName = j === 0 ? pre.race[j].name.uppercaseFirst() : pre.race[j].name;
					outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
				}
			}
		}
		if (pre.ability !== undefined) {
        	// this assumes all ability requirements are the same (13), correct as of 2017-10-06
        	let attCount = 0;
            for (let j = 0; j < pre.ability.length; ++j) {
                for (let att in pre.ability[j]) {
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
                for (let type in pre.proficiency[j]) { // type is armor/weapon/etc.
                    if (!pre.proficiency[j].hasOwnProperty(type)) continue;
                    if (type === "armor") {
                    	if (shorthand) {
							outStack.push("prof " + parse_armorToAbv(pre.proficiency[j][type]) + " armor");
						} else {
							outStack.push("Proficiency with " + pre.proficiency[j][type] + " armor");
						}
					}
					else console.log("unimplemented proficiency type in utils_makePrerequisite")
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

function utils_getAttributeText(attObj) {
	const ATTRIBUTES = ["Str", "Dex", "Con", "Int", "Wis", "Cha"];
	let mainAtts = [];
	let atts = [];
	if (attObj !== undefined) {
		handleAllAttributes(attObj);
		handleAttributesChoose();
		return atts.join("; ");
	}
	return "";

	function handleAllAttributes(abilityList) {
		for (let a = 0; a < ATTRIBUTES.length; ++a) {
			handleAttribute(abilityList, ATTRIBUTES[a])
		}
	}

	function handleAttribute(parent, att) {
		if (parent[att.toLowerCase()] !== undefined) {
			atts.push(att + " " + (parent[att.toLowerCase()] < 0 ? "" : "+") + parent[att.toLowerCase()]);
			mainAtts.push(att);
		}
	}

	function handleAttributesChoose() {
		if (attObj.choose !== undefined) {
			for (let i = 0; i < attObj.choose.length; ++i) {
				let item = attObj.choose[i];
				let outStack = "Choose ";
				if (item.predefined !== undefined) {
					for (let j = 0; j < item.predefined.length; ++j) {
						let subAtts = [];
						handleAllAttributes(subAtts, item.predefined[j]);
						outStack += subAtts.join(", ") + (j === item.predefined.length - 1 ? "" : " or ");
					}
				} else {
					let allAttributes = item.from.length === 6;
					let allAttributesWithParent = isAllAttributesWithParent(item);
					let amount = item.amount === undefined ? 1 : item.amount;
					amount = (amount < 0 ? "" : "+") + amount;
					if (allAttributes) {
						outStack += "any ";
					} else if (allAttributesWithParent) {
						outStack += "any other ";
					}
					if (item.count !== undefined && item.count > 1) {
						outStack += getNumberString(item.count) + " ";
					}
					if (allAttributes || allAttributesWithParent) {
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
				atts.push(outStack)
			}

			function isAllAttributesWithParent(item) {
				let tempAttributes = [];
				for (let i = 0; i < mainAtts.length; ++i) {
					tempAttributes.push(mainAtts[i].toLowerCase());
				}
				for (let i = 0; i < item.from.length; ++i) {
					let attb = item.from[i].toLowerCase();
					if (!tempAttributes.includes(attb)) {
						tempAttributes.push(attb)
					}
				}
				return tempAttributes.length === 6;
			}
		}
	}

	function getNumberString(amount) {
		if (amount === 1) return "one";
		if (amount === 2) return "two";
		if (amount === 3) return "three";
		else return amount;
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

const ARMR_LIGHT = "light";
const ARMR_MEDIUM = "medium";
const ARMR_HEAVY = "heavy";
const ARMR_LIGHT_ABBV = "l.";
const ARMR_MEDIUM_ABBV = "m.";
const ARMR_HEAVY_ABBV = "h.";
function parse_armorToAbv(armor) {
	if (armor === ARMR_LIGHT) armor = ARMR_LIGHT_ABBV;
	if (armor === ARMR_MEDIUM) armor = ARMR_MEDIUM_ABBV;
	if (armor === ARMR_HEAVY) armor = ARMR_HEAVY_ABBV;
	return armor;
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
const sourceToAbv = {};
sourceToAbv.SRC_PHB = "PHB";
sourceToAbv.SRC_EEPC = "EEPC";
sourceToAbv.SRC_SCAG = "SCAG";
sourceToAbv.SRC_UAMystic = "UAM";
sourceToAbv.SRC_UAStarterSpells = "UASS";
sourceToAbv.SRC_UAModern = "UAMM";
sourceToAbv.SRC_UATOBM = "UAOBM";
sourceToAbv.SRC_UAEBB = "UAEB";
sourceToAbv.SRC_UAFT = "UAFT";
sourceToAbv.SRC_UAFFS = "UAFFS";
sourceToAbv.SRC_UAFFR = "UAFFR";
sourceToAbv.SRC_PSK = "PSK";
sourceToAbv.SRC_BOLS_3PP = "BLS";
function parse_sourceToAbv(source) {
	if (sourceToAbv[source] !== undefined) return sourceToAbv[source];
    return source;
}
function parse_abvToSource(abv) {
	for (let v in sourceToAbv) {
		if (!sourceToAbv.hasOwnProperty(v)) continue;
		if (sourceToAbv[v] === abv) return v
	}
	return abv;
}

function parse_stringToSlug(str) {
	return str.toLowerCase().replace(/[^\w ]+/g, STR_EMPTY).replace(/ +/g, STR_SLUG_DASH);
}

// DATA LINKS ==========================================================================================================
function utils_nameToDataLink(name) {
	return encodeURIComponent(name.toLowerCase()).replace("'","%27");
}

// FILTERS =============================================================================================================
class FilterBox {
	constructor(inputGroup, filterList) {
		this.inputGroup = inputGroup;
		this.filterList = filterList;

		this.headers = {};
	}

	render() {
		let buttonGroup = getButtonGroup();

		let outer = makeOuterList();
		for (let i = 0; i < this.filterList.length; ++i) {
			outer.appendChild(makeOuterItem(this, this.filterList[i]));
		}
		buttonGroup.appendChild(outer);
		this.inputGroup.insertBefore(buttonGroup, this.inputGroup.firstChild);

		function getButtonGroup() {
			let buttonGroup = document.createElement(ELE_DIV);
			buttonGroup.setAttribute(ATB_CLASS, FilterBox.CLS_INPUT_GROUP_BUTTON);
			let filterButton = getFilterButton();
			buttonGroup.appendChild(filterButton);
			return buttonGroup;

			function getFilterButton() {
				let button = document.createElement(ELE_BUTTON);
				button.classList.add("btn");
				button.classList.add("btn-default");
				button.classList.add("dropdown-toggle");
				button.setAttribute("data-toggle", "dropdown");
				button.innerHTML = "Filter <span class='caret'></span>";
				return button;
			}
		}

		function makeOuterList() {
			let outL = document.createElement(ELE_UL);
			outL.setAttribute(ATB_CLASS, FilterBox.CLS_DROPDOWN_MENU);
			return outL;
		}

		function makeOuterItem(self, filter) {
			let outI = document.createElement(ELE_LI);
			outI.setAttribute(ATB_CLASS, FilterBox.CLS_DROPDOWN_SUBMENU);
			let innerListHeader = makeInnerHeader();
			outI.appendChild(innerListHeader);
			let innerList = makeInnerList();
			outI.appendChild(innerList);
			addEventHandlers();

			return outI;

			function makeInnerHeader() {
				let inH = document.createElement(ELE_A);
				inH.setAttribute(ATB_CLASS, FilterBox.CLS_SUBMENU_PARENT);
				inH.setAttribute(ATB_HREF, STR_VOID_LINK);
				inH.innerHTML = filter.header + " <span class='caret'></span>";
				return inH;
			}

			function makeInnerList() {
				let inL = document.createElement(ELE_UL);
				inL.setAttribute(ATB_CLASS, FilterBox.CLS_DROPDOWN_MENU);
				let selectAll = makeAllInnerItem();
				inL.appendChild(selectAll);
				inL.appendChild(makeInnerDividerItem());
				for (let j = 0; j < filter.items.length; ++j) {
					let displayText = filter.displayFunction(filter.items[j]);
					let valueText = filter.valueFunction(filter.items[j]);
					inL.appendChild(makeInnerItem(filter.header, displayText, valueText, true, selectAll.cb));
				}
				return inL;

				function makeAllInnerItem() {
					return makeInnerItem(filter.header, "Select All", FilterBox.VAL_SELECT_ALL, true);
				}

				function makeInnerDividerItem() {
					let divLi = document.createElement(ELE_LI);
					divLi.setAttribute(ATB_CLASS, FilterBox.CLS_DIVIDER);
					return divLi;
				}

				function makeInnerItem(header, displayText, valueText, isChecked, parentCheckBox) {
					parentCheckBox = parentCheckBox === undefined || parentCheckBox === null ? null : parentCheckBox;
					let innLi = document.createElement(ELE_LI);

					let child = getChild();

					innLi.appendChild(child);
					return innLi;

					function getChild() {
						let liLink = document.createElement(ELE_A); // bootstrap v3 requires dropdowns to contain links...
						liLink.setAttribute(ATB_HREF, STR_VOID_LINK);
						liLink.appendChild(getChild());
						liLink.addEventListener(EVNT_CLICK, clickHandler);
						return liLink;

						function getChild() {
							let liWrapper = document.createElement(ELE_DIV);
							liWrapper.setAttribute(ATB_CLASS, FilterBox.CLS_FILTER_SUBLIST_ITEM_WRAPPER);
							liWrapper.append(getTextChild());
							liWrapper.append(getCheckboxChild());
							return liWrapper;

							function getTextChild() {
								let text = document.createElement(ELE_SPAN);
								text.setAttribute(ATB_CLASS, "filter-sublist-item-text");
								text.innerHTML = displayText;
								return text;
							}
							function getCheckboxChild() {
								let cb = document.createElement(ELE_INPUT);
								cb.classList.add("filter-checkbox");
								cb.classList.add("readonly");
								cb.setAttribute(ATB_TYPE, "checkbox");
								cb.childCheckBoxes = [];
								if (isChecked) cb.checked  = true;
								if (parentCheckBox !== null) {
									parentCheckBox.childCheckBoxes.push(cb);
								}
								innLi.cb = cb;
								addToValueMap();
								return cb;

								function addToValueMap() {
									let valueObj;
									if (self.headers[header] !== undefined) valueObj = self.headers[header];
									else {
										valueObj = {entries: []};
										self.headers[header] = valueObj;
									}
									let entry = {};
									entry.value = valueText;
									entry.cb = cb;
									valueObj.entries.push(entry);
								}
							}
						}

						function clickHandler(event) {
							stopEvent(event);
							toggleCheckBox(innLi.cb);
							for (let i = 0; i < innLi.cb.childCheckBoxes.length; ++i) {
								innLi.cb.childCheckBoxes[i].checked = innLi.cb.checked; // set all the children to the parent's value
							}
							if (parentCheckBox !== null) {
								if (parentCheckBox.checked && !innLi.cb.checked) {
									// if we unchecked a child, we're no longer selecting all children, so uncheck the parent
									parentCheckBox.checked = false;
								} else if (!parentCheckBox.checked && innLi.cb.checked) {
									// if we checked a child, check if all the children are checked, and if so, check the parent
									let allChecked = true;
									for (let i = 0; i < parentCheckBox.childCheckBoxes.length; ++i) {
										if (!parentCheckBox.childCheckBoxes[i].checked) {
											allChecked = false;
											break;
										}
									}
									if (allChecked) parentCheckBox.checked = true;
								}
							}

							self._fireValChangeEvent();
						}
					}
				}
			}

			function addEventHandlers() {
				// open sub-menu when we hover over sub-menu header
				outI.addEventListener(
					EVNT_MOUSEOVER,
					function(event) {
						stopEvent(event);
						show(innerList);
					},
					false
				);
				// click version, required for mobile to function
				outI.addEventListener(
					EVNT_CLICK,
					function(event) {
						stopEvent(event);
						show(innerList);
					},
					false
				);

				// close other sub-menus when we hover over a sub-menu header
				outI.addEventListener(
					EVNT_MOUSEENTER,
					function(event) {
						stopEvent(event);
						let allOutIs = outI.parentNode.childNodes;
						for (let i = 0; i < allOutIs.length; ++i) {
							if (outI !== allOutIs[i]) {
								let childMenus = allOutIs[i].getElementsByClassName(FilterBox.CLS_DROPDOWN_MENU);
								for (let j = 0; j < childMenus.length; ++j) {
									hide(childMenus[j]);
								}
							}
						}
					},
					false
				);

				// prevent the sub-menu from closing on moving the cursor to the page
				innerList.addEventListener(
					EVNT_MOUSEOUT,
					function(event) {
						stopEvent(event);
					},
					false
				);

				// reset the menus on closing the filter interface
				$(buttonGroup).on({
					"hide.bs.dropdown":  function() { hide(innerList); }
				});
			}
		}
	}

	getValues() {
		let outObj = {};
		for (let header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			let cur = this.headers[header];
			let tempObj = {};
			for (let i = 0; i < cur.entries.length; ++i) {
				tempObj[cur.entries[i].value] = cur.entries[i].cb.checked;
			}
			outObj[header] = tempObj;
		}
		return outObj;
	}

	addEventListener (type, listener, useCapture) {
		this.inputGroup.addEventListener(type, listener, useCapture)
	}

	reset() {
		for (let header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			let cur = this.headers[header];
			for (let i = 0; i < cur.entries.length; ++i) {
				cur.entries[i].cb.checked = true;
			}
		}
		this._fireValChangeEvent();
	}

	_fireValChangeEvent() {
		let eventOut = new Event(FilterBox.EVNT_VALCHANGE);
		this.inputGroup.dispatchEvent(eventOut);
	}
}
FilterBox.CLS_INPUT_GROUP_BUTTON = "input-group-btn";
FilterBox.CLS_DROPDOWN_MENU = "dropdown-menu";
FilterBox.CLS_DROPDOWN_SUBMENU = "dropdown-submenu";
FilterBox.CLS_FILTER_SUBLIST_ITEM_WRAPPER = "filter-sublist-item-wrapper";
FilterBox.CLS_SUBMENU_PARENT = "submenu-parent";
FilterBox.CLS_DIVIDER = "divider";
FilterBox.VAL_SELECT_ALL = "select-all";
FilterBox.EVNT_VALCHANGE = "valchange";
class Filter {
	constructor(header, listClass, items, displayFunction, valueFunction) {
		this.header = header;
		this.listClass = listClass;
		this.items = items;
		this.displayFunction = displayFunction;
		this.valueFunction = valueFunction;
	}
}

// CONVENIENCE/ELEMENTS ================================================================================================
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