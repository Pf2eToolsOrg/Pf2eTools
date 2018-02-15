"use strict";
const HASH_FEATURE = "f:";
const HASH_HIDE_FEATURES = "hideclassfs:";
const HASH_ALL_SOURCES = "allsrc:";
const HASH_COMP_VIEW = "compview:";
const HASH_BOOK_VIEW = "bookview:";

const CLSS_FEATURE_LINK = "feature-link";
const CLSS_ACTIVE = "active";
const CLSS_SUBCLASS_PILL = "sc-pill";
const CLSS_PANEL_LINK = "pnl-link";
const CLSS_CLASS_FEATURES_ACTIVE = "cf-active";
const CLSS_OTHER_SOURCES_ACTIVE = "os-active";
const CLSS_SUBCLASS_PREFIX = "subclass-prefix";
const CLSS_CLASS_FEATURE = "class-feature";
const CLSS_GAIN_SUBCLASS_FEATURE = "gain-subclass-feature";
const ID_CLASS_FEATURES_TOGGLE = "cf-toggle";
const ID_OTHER_SOURCES_TOGGLE = "os-toggle";

const STR_PROF_NONE = "none";

const ATB_DATA_FEATURE_LINK = "data-flink";
const ATB_DATA_FEATURE_ID = "data-flink-id";
const ATB_DATA_SC_LIST = "data-subclass-list";

let tableDefault;
let statsProfDefault;
let classTableDefault;

let classes;
let list;

const jsonURL = "data/classes.json";

const renderer = new EntryRenderer();

window.onload = function load () {
	tableDefault = $("#pagecontent").html();
	statsProfDefault = $("#statsprof").html();
	classTableDefault = $("#classtable").html();

	DataUtil.loadJSON(jsonURL, onJsonLoad);
};

function getClassHash (aClass) {
	return `#${UrlUtil.autoEncodeHash(aClass)}`;
}

function getEncodedSubclass (name, source) {
	return `${UrlUtil.encodeForHash(name)}${HASH_SUB_LIST_SEP}${UrlUtil.encodeForHash(source)}`;
}

function getTableDataScData (scName, scSource) {
	return scName + ATB_DATA_PART_SEP + scSource;
}

function cleanScSource (source) {
	return Parser._getSourceStringFromSource(source);
}

function cleanSetHash (toSet) {
	window.location.hash = toSet.replace(/,+/g, ",").replace(/,$/, "").toLowerCase();
}

function onJsonLoad (data) {
	list = ListUtil.search({
		valueNames: ['name', 'source', 'uniqueid'],
		listClass: "classes"
	});

	const invocFeature = data.class
		.find(it => it.name === "Warlock" && it.source === SRC_PHB).classFeatures[1]
		.find(f => f.name === "Eldritch Invocations");
	if (invocFeature) {
		const toRemove = invocFeature.entries.findIndex(it => it.type === "options");
		const toSwitch = invocFeature.entries.findIndex(it => it.includes("Your invocation options are detailed at the end of the class description."));
		if (toRemove !== -1 && toSwitch !== -1) {
			invocFeature.entries[toSwitch] = {
				type: "inlineBlock",
				entries: [
					"At 2nd level, you gain two eldritch invocations of your choice. See the ",
					{
						"type": "link",
						"href": {
							"type": "internal",
							"path": "invocations.html"
						},
						"text": "Invocations page"
					},
					" for the list of available options. When you gain certain warlock levels, you gain additional invocations of your choice."
				]
			};
			invocFeature.entries.splice(toRemove, 1);
		}
	}
	addClassData(data);

	BrewUtil.addBrewData(handleBrew, HOMEBREW_STORAGE);
	BrewUtil.makeBrewButton("manage-brew");
	BrewUtil.setList(list);

	function handleBrew (homebrew) {
		addClassData(homebrew);
		addSubclassData(homebrew);
	}

	initHistory();
	initCompareMode();
	initReaderMode();
}

function addClassData (data) {
	if (!data.class || !data.class.length) return;

	// alphabetically sort subclasses
	for (const c of data.class) {
		c.subclasses = c.subclasses.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	}

	// for any non-standard source classes, mark subclasses from the same source as "forceStandard"
	data.class.filter(c => isNonstandardSource(c.source) || c.source === SRC_HOMEBREW).forEach(c => c.subclasses.filter(sc => sc.source === c.source).forEach(sc => sc.source = {"source": sc.source, "forceStandard": true}));

	let i = 0;
	if (!classes) {
		classes = data.class;
	} else {
		i = classes.length;
		classes = classes.concat(data.class);
	}

	const classTable = $("ul.classes");
	let tempString = "";
	for (; i < classes.length; i++) {
		const curClass = classes[i];
		tempString +=
			`<li ${curClass.uniqueId ? `data-unique-id="${curClass.uniqueId}"` : ""}>
				<a id='${i}' href='${getClassHash(curClass)}' title='${curClass.name}'>
					<span class='name col-xs-8'>${curClass.name}</span>
					<span class='source col-xs-4 text-align-center source${Parser.sourceJsonToAbv(curClass.source)}' title='${Parser.sourceJsonToFull(curClass.source)}'>${Parser.sourceJsonToAbv(curClass.source)}</span>
					<span class="uniqueid hidden">${curClass.uniqueId ? curClass.uniqueId : i}</span>
				</a>
			</li>`;
	}
	classTable.append(tempString);
	list.reIndex();
	list.sort("name");
}

function getSubclassStyles (sc) {
	const styleClasses = [CLSS_SUBCLASS_FEATURE];
	const nonStandard = isNonstandardSource(sc.source) || hasBeenReprinted(sc.shortName, sc.source);
	if (nonStandard) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
	if (cleanScSource(sc.source) === SRC_HOMEBREW) styleClasses.push(CLSS_HOMEBREW_SOURCE);
	return styleClasses;
}

function addSubclassData (data) {
	if (!data.subclass || !data.subclass.length) return;

	const scData = data.subclass;
	scData.forEach(subClass => {
		// get the class
		const c = classes.find(c => c.name.toLowerCase() === subClass.class.toLowerCase());
		if (!c) {
			alert(`Could not add subclass; could not find class with name: ${subClass.class}`);
			return;
		}

		c.subclasses = c.subclasses.concat(subClass);

		// sort subclasses
		c.subclasses = c.subclasses.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	});
	hashchange();
}

let curClass;
function loadhash (id) {
	$("#pagecontent").html(tableDefault);
	$("#statsprof").html(statsProfDefault);
	$("#classtable").html(classTableDefault);
	curClass = classes[id];

	// name
	$("th#nameTable").html(curClass.name);
	$("th#nameSummary").html(curClass.name);
	if (curClass.authors) {
		$("th#author").html(`By ${curClass.authors.join(", ")}`).show();
	} else {
		$("th#author").html("").hide();
	}

	// SUMMARY SIDEBAR =================================================================================================
	// hit dice and HP
	const hdEntry = {toRoll: [curClass.hd], rollable: true};
	$("td#hp div#hitdice span").html(EntryRenderer.getEntryDice(hdEntry, "Hit die"));
	$("td#hp div#hp1stlevel span").html(curClass.hd.faces + " + your Constitution modifier");
	$("td#hp div#hphigherlevels span").html(`${EntryRenderer.getEntryDice(hdEntry, "Hit die")} (or ${(curClass.hd.faces / 2 + 1)}) + your Constitution modifier per ${curClass.name} level after 1st`);

	// save proficiency
	$("td#prof div#saves span").html(curClass.proficiency.map(p => Parser.attAbvToFull(p)).join(", "));

	// starting proficiencies
	const sProfs = curClass.startingProficiencies;
	const profSel = $("td#prof");
	profSel.find("div#armor span").html(sProfs.armor === undefined ? STR_PROF_NONE : sProfs.armor.map(a => a === "light" || a === "medium" || a === "heavy" ? a + " armor" : a).join(", "));
	profSel.find("div#weapons span").html(sProfs.weapons === undefined ? STR_PROF_NONE : sProfs.weapons.map(w => w === "simple" || w === "martial" ? w + " weapons" : w).join(", "));
	profSel.find("div#tools span").html(sProfs.tools === undefined ? STR_PROF_NONE : sProfs.tools.join(", "));
	profSel.find("div#skills span").html(sProfs.skills === undefined ? STR_PROF_NONE : getSkillProfString(sProfs.skills));

	function getSkillProfString (skills) {
		const numString = Parser.numberToString(skills.choose);
		return skills.from.length === 18 ? `Choose any ${numString}.` : `Choose ${numString} from ${CollectionUtil.joinConjunct(skills.from, ", ", ", and ")}.`
	}

	// starting equipment
	const sEquip = curClass.startingEquipment;
	const fromBackground = sEquip.additionalFromBackground ? "<p>You start with the following items, plus anything provided by your background.</p>" : "";
	const defList = sEquip.default.length === 0 ? "" : `<ul><li>${sEquip.default.join("</li><li>")}</ul>`;
	const goldAlt = sEquip.goldAlternative === undefined ? "" : `<p>Alternatively, you may start with ${sEquip.goldAlternative} gp to buy your own equipment.</p>`;
	$("#equipment").find("div").html(`${fromBackground}${defList}${goldAlt}`);

	// FEATURE TABLE ===================================================================================================
	const tData = curClass.classTableGroups;
	const groupHeaders = $("#groupHeaders");
	const colHeaders = $("#colHeaders");
	const levelTrs = [];
	for (let i = 0; i < tData.length; i++) {
		const tGroup = tData[i];

		const hasTitle = tGroup.title !== undefined;
		let subclassData = "";
		if (tGroup.subclasses !== undefined) {
			subclassData = `${ATB_DATA_SC_LIST}="${tGroup.subclasses.map(s => getTableDataScData(s.name, cleanScSource(s.source))).join(ATB_DATA_LIST_SEP)}"`;
		}
		groupHeaders.append(`<th ${hasTitle ? `class="colGroupTitle"` : ""} colspan="${tGroup.colLabels.length}" ${subclassData}>${hasTitle ? tGroup.title : ""}</th>`);

		for (let j = 0; j < tGroup.colLabels.length; j++) {
			let lbl = renderer.renderEntry(tGroup.colLabels[j]);
			colHeaders.append(`<th class="centred-col" ${subclassData}>${lbl}</th>`)
		}

		for (let j = 0; j < tGroup.rows.length; j++) {
			const tr = $(`#level${j + 1}`);
			levelTrs[j] = tr;
			for (let k = 0; k < tGroup.rows[j].length; k++) {
				let entry = tGroup.rows[j][k];
				if (entry === 0) entry = "\u2014";
				const stack = [];
				renderer.recursiveEntryRender(entry, stack, "", "");
				tr.append(`<td class="centred-col" ${subclassData}>${stack.join("")}</td>`)
			}
		}
	}

	// FEATURE DESCRIPTIONS ============================================================================================
	const renderStack = [];
	const topBorder = $("#ftTopBorder");
	let subclassIndex = 0; // the subclass array is not 20 elements
	for (let i = 0; i < levelTrs.length; i++) {
		// track class table feature names
		const tblLvlFeatures = levelTrs[i].find(".features");
		const featureNames = [];

		// add class features to render stack
		const lvlFeatureList = curClass.classFeatures[i];
		for (let j = 0; j < lvlFeatureList.length; j++) {
			const feature = lvlFeatureList[j];
			const featureId = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}_${i}`;

			const featureLinkPart = `${HASH_FEATURE}${UrlUtil.encodeForHash(feature.name)}${i}`;
			const featureLink = $(`<a href="${getClassHash(curClass)}${HASH_PART_SEP}${featureLinkPart}" class="${CLSS_FEATURE_LINK}" ${ATB_DATA_FEATURE_LINK}="${featureLinkPart}" ${ATB_DATA_FEATURE_ID}="${featureId}">${feature.name}</a>`);
			featureLink.click(function () {
				document.getElementById(featureId).scrollIntoView();
			});
			if (feature.type !== "inset") featureNames.push(featureLink);

			const styleClasses = [CLSS_CLASS_FEATURE];
			if (feature.gainSubclassFeature) styleClasses.push(CLSS_GAIN_SUBCLASS_FEATURE);

			renderer.recursiveEntryRender(feature, renderStack, 0, `<tr id="${featureId}" class="${styleClasses.join(" ")}"><td colspan="6">`, `</td></tr>`, true);

			// add subclass features to render stack if appropriate
			if (feature.gainSubclassFeature) {
				for (let k = 0; k < curClass.subclasses.length; k++) {
					const subClass = curClass.subclasses[k];
					for (let l = 0; l < subClass.subclassFeatures[subclassIndex].length; l++) {
						const subFeature = subClass.subclassFeatures[subclassIndex][l];

						// if this is not the subclass intro, add the subclass to the feature name
						// this will only be shown if there are multiple subclasses displayed
						if (subFeature.name === undefined) {
							for (let m = 0; m < subFeature.entries.length; m++) {
								const childEntry = subFeature.entries[m];
								if (childEntry.name !== undefined && !childEntry.name.startsWith(`<span class="${CLSS_SUBCLASS_PREFIX}">`)) {
									childEntry.name = `<span class="${CLSS_SUBCLASS_PREFIX}">${subClass.name}: </span>${childEntry.name}`;
								}
							}
						}

						const styleClasses = getSubclassStyles(subClass);
						renderer.recursiveEntryRender(subFeature, renderStack, 0, `<tr class="${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClass.name}" ${ATB_DATA_SRC}="${cleanScSource(subClass.source)}"><td colspan="6">`, `</td></tr>`, true);
					}
				}
				subclassIndex++;
			}
		}

		// render class table feature names
		if (featureNames.length === 0) tblLvlFeatures.html("\u2014");
		else {
			for (let j = 0; j < featureNames.length; j++) {
				tblLvlFeatures.append(featureNames[j]);
				if (j < featureNames.length - 1) tblLvlFeatures.append(", ");
			}
		}
	}
	topBorder.after(renderStack.join(""));

	// hide UA/other sources by default
	$(`.${CLSS_NON_STANDARD_SOURCE}`).not(`.${CLSS_SUBCLASS_PILL}`).not(`.${CLSS_PANEL_LINK}`).hide();

	// CLASS FEATURE/UA/SUBCLASS PILL BUTTONS ==========================================================================
	const subclassPillWrapper = $("div#subclasses");
	// remove any from previous class
	subclassPillWrapper.find("span").remove();

	// show/hide class features pill
	makeGenericTogglePill("Class Features", CLSS_CLASS_FEATURES_ACTIVE, ID_CLASS_FEATURES_TOGGLE, HASH_HIDE_FEATURES, true);

	// show/hide UA/other sources
	const allSourcesToggle = makeGenericTogglePill("All Sources", CLSS_OTHER_SOURCES_ACTIVE, ID_OTHER_SOURCES_TOGGLE, HASH_ALL_SOURCES, false);

	// spacer before the subclass pills
	subclassPillWrapper.append($(`<span class="divider">`));

	// subclass pills
	const subClasses = curClass.subclasses
		.map(sc => ({"name": sc.name, "source": sc.source, "shortName": sc.shortName}))
		.sort(function (a, b) {
			return SortUtil.ascSort(a.shortName, b.shortName)
		});
	for (let i = 0; i < subClasses.length; i++) {
		const nonStandardSource = isNonstandardSource(subClasses[i].source) || hasBeenReprinted(subClasses[i].shortName, subClasses[i].source);
		const styleClasses = [CLSS_ACTIVE, CLSS_SUBCLASS_PILL];
		if (nonStandardSource) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
		if (cleanScSource(subClasses[i].source) === SRC_HOMEBREW) styleClasses.push(CLSS_HOMEBREW_SOURCE);
		const pillText = hasBeenReprinted(subClasses[i].shortName, subClasses[i].source) ? `${subClasses[i].shortName} (${Parser.sourceJsonToAbv(subClasses[i].source)})` : subClasses[i].shortName;
		const pill = $(`<span class="${styleClasses.join(" ")}" ${ATB_DATA_SC}="${subClasses[i].name}" ${ATB_DATA_SRC}="${cleanScSource(subClasses[i].source)}" title="Source: ${Parser.sourceJsonToFull(subClasses[i].source)}"><span>${pillText}</span></span>`);
		pill.click(function () {
			handleSubclassClick($(this).hasClass(CLSS_ACTIVE), subClasses[i].name, cleanScSource(subClasses[i].source));
		});
		if (nonStandardSource) pill.hide();
		subclassPillWrapper.append(pill);
	}

	// call loadsub with a blank sub-hash, to ensure the right content is displayed
	loadsub("");

	// helper functions
	function makeGenericTogglePill (pillText, pillActiveClass, pillId, hashKey, defaultActive) {
		const pill = $(`<span id="${pillId}"><span>${pillText}</span></span>`);
		if (defaultActive) pill.addClass(pillActiveClass);
		subclassPillWrapper.append(pill);
		pill.click(function () {
			let active = $(this).hasClass(pillActiveClass);
			if (!defaultActive) active = !active;
			handleToggleFeaturesClicks(active)
		});
		return pill;

		function handleToggleFeaturesClicks (isPillActive) {
			const outStack = [];
			const split = window.location.hash.split(HASH_PART_SEP);

			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(hashKey)) outStack.push(hashPart);
			}
			if (isPillActive) {
				outStack.push(hashKey + "true")
			} else {
				outStack.push(hashKey + "false")
			}

			cleanSetHash(outStack.join(HASH_PART_SEP));
		}
	}

	function handleSubclassClick (isPillActive, subclassName, subclassSource) {
		const outStack = [];
		const split = window.location.hash.split(HASH_PART_SEP);

		const encodedSubClass = getEncodedSubclass(subclassName, subclassSource);
		const subclassLink = HASH_SUBCLASS + encodedSubClass;

		if (isPillActive && window.location.hash.includes(HASH_SUBCLASS)) {
			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart);
				else {
					const subClassStack = [];
					const subClasses = hashPart.substr(HASH_SUBCLASS.length).split(HASH_LIST_SEP);
					for (let j = 0; j < subClasses.length; j++) {
						const subClass = subClasses[j];
						if (subClass !== encodedSubClass) subClassStack.push(subClass);
					}
					if (subClassStack.length > 0) outStack.push(HASH_SUBCLASS + subClassStack.join(HASH_LIST_SEP));
				}
			}
		} else {
			let hasSubclassHash = false;

			for (let i = 0; i < split.length; i++) {
				const hashPart = split[i];
				if (!hashPart.startsWith(HASH_SUBCLASS)) outStack.push(hashPart);
				else {
					const subClassStack = [];
					const subClasses = hashPart.substr(HASH_SUBCLASS.length).split(HASH_LIST_SEP);
					for (let j = 0; j < subClasses.length; j++) {
						const subClass = subClasses[j];
						if (subClass !== encodedSubClass) subClassStack.push(subClass);
					}
					subClassStack.push(encodedSubClass);
					if (subClassStack.length > 0) outStack.push(HASH_SUBCLASS + subClassStack.join(HASH_LIST_SEP));

					hasSubclassHash = true;
				}
			}

			if (!hasSubclassHash) outStack.push(subclassLink);
		}

		cleanSetHash(outStack.join(HASH_PART_SEP));
	}
}

let prevFeature = null;

function loadsub (sub) {
	const curHash = window.location.hash;

	let subclasses = null;
	let feature = null;
	let hideClassFeatures = null;
	let showAllSources = null;
	let bookView = null;
	let comparisonView = null;

	function sliceTrue (hashPart, findString) {
		return hashPart.slice(findString.length) === "true";
	}

	for (let i = 0; i < sub.length; i++) {
		const hashPart = sub[i];

		if (hashPart.startsWith(HASH_SUBCLASS)) subclasses = hashPart.slice(HASH_SUBCLASS.length).split(HASH_LIST_SEP);
		if (hashPart.startsWith(HASH_FEATURE)) feature = hashPart;
		if (hashPart.startsWith(HASH_HIDE_FEATURES)) hideClassFeatures = sliceTrue(hashPart, HASH_HIDE_FEATURES);
		if (hashPart.startsWith(HASH_ALL_SOURCES)) showAllSources = sliceTrue(hashPart, HASH_ALL_SOURCES);
		if (hashPart.startsWith(HASH_BOOK_VIEW)) bookView = sliceTrue(hashPart, HASH_BOOK_VIEW);
		if (hashPart.startsWith(HASH_COMP_VIEW)) comparisonView = sliceTrue(hashPart, HASH_COMP_VIEW);
	}

	const hideOtherSources = !ClassBookView.bookViewActive && (showAllSources === null || showAllSources === false);

	// deselect any pills that would be hidden
	if (subclasses !== null && hideOtherSources) {
		const toDeselect = [];
		$(`.${CLSS_SUBCLASS_PILL}.${CLSS_NON_STANDARD_SOURCE}.${CLSS_ACTIVE}`).each(function () {
			const $this = $(this);
			const thisSc = getEncodedSubclass($this.attr(ATB_DATA_SC), $this.attr(ATB_DATA_SRC));
			if ($.inArray(subclasses, thisSc)) {
				toDeselect.push(thisSc)
			}
		});
		const toKeep = subclasses.filter(sc => toDeselect.indexOf(sc) < 0);
		if (toKeep.length !== subclasses.length) {
			const newHashStack = [];
			for (let i = 0; i < sub.length; i++) {
				const hashPart = sub[i];

				if (!hashPart.startsWith(HASH_SUBCLASS)) newHashStack.push(hashPart);
				else if (toKeep.length > 0) newHashStack.push(HASH_SUBCLASS + toKeep.join(HASH_LIST_SEP))
			}
			const curParts = _getHashParts();
			if (curParts.length > 1) {
				const newParts = [curParts[0]].concat(newHashStack);
				cleanSetHash(HASH_START + newParts.join(HASH_PART_SEP));
			}
			return;
		}
	}

	if (subclasses !== null) {
		updateClassTableLinks();

		const $toShow = [];
		const $toHide = [];
		const $subClassSpanList = $(`.${CLSS_SUBCLASS_PILL}`);
		$subClassSpanList.each(
			function () {
				const $this = $(this);
				const thisSc = getEncodedSubclass($this.attr(ATB_DATA_SC), $this.attr(ATB_DATA_SRC));
				let shown = false;

				for (let j = 0; j < subclasses.length; j++) {
					const sc = subclasses[j].toLowerCase();
					if (sc.trim() === thisSc) {
						shown = true;
						break;
					}
				}
				if (shown) {
					$toShow.push($this);
				} else {
					$toHide.push($this);
				}
			}
		);

		ClassBookView.updateVisible($toShow, $toHide);

		if ($toShow.length === 0) {
			hideAllSubclasses();
		} else {
			const otherSrcSubFeat = $(`#pagecontent`).find(`div.${CLSS_NON_STANDARD_SOURCE}`);
			const shownInTable = [];

			$.each($toShow, function (i, v) {
				v.addClass(CLSS_ACTIVE);
				$(`.${CLSS_SUBCLASS_FEATURE}[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).show();
				if (hideOtherSources) otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();
				else otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).show();

				const asInTable = getTableDataScData(v.attr(ATB_DATA_SC), v.attr(ATB_DATA_SRC));
				shownInTable.push(asInTable);
				handleTableGroups(shownInTable, asInTable, true);
			});

			$.each($toHide, function (i, v) {
				v.removeClass(CLSS_ACTIVE);
				$(`.${CLSS_SUBCLASS_FEATURE}[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();
				otherSrcSubFeat.filter(`[${ATB_DATA_SC}="${v.attr(ATB_DATA_SC)}"][${ATB_DATA_SRC}="${v.attr(ATB_DATA_SRC)}"]`).hide();

				const asInTable = getTableDataScData(v.attr(ATB_DATA_SC), v.attr(ATB_DATA_SRC));
				handleTableGroups(shownInTable, asInTable, false);
			});

			if (hideOtherSources) {
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`:not([${ATB_DATA_SC}]):not([${ATB_DATA_SRC}])`).hide();
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`[${ATB_DATA_SC}="${EntryRenderer.DATA_NONE}"][${ATB_DATA_SRC}="${EntryRenderer.DATA_NONE}"]`).hide();
			} else {
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`:not([${ATB_DATA_SC}]):not([${ATB_DATA_SRC}])`).show();
				otherSrcSubFeat.not(`.${CLSS_SUBCLASS_FEATURE}`).filter(`[${ATB_DATA_SC}="${EntryRenderer.DATA_NONE}"][${ATB_DATA_SRC}="${EntryRenderer.DATA_NONE}"]`).show();
			}
		}

		// show subclass prefixes if we're displaying more than 1 subclass
		if ($toShow.length !== 1) {
			$(`.${CLSS_SUBCLASS_PREFIX}`).show();
		} else {
			$(`.${CLSS_SUBCLASS_PREFIX}`).hide();
		}
	} else {
		hideAllSubclasses();
		ClassBookView.updateVisible([], $(`.${CLSS_SUBCLASS_PILL}`).map((i, e) => $(e)).get());
	}

	// hide class features as required
	const cfToggle = $(`#${ID_CLASS_FEATURES_TOGGLE}`);
	const allCf = $(`#pagecontent`).find(`.${CLSS_CLASS_FEATURE}`);
	const toToggleCf = allCf.not(`.${CLSS_GAIN_SUBCLASS_FEATURE}`);
	const isHideClassFeatures = hideClassFeatures !== null && hideClassFeatures;
	// if showing no subclass and hiding class features, hide the "gain a feature at this level" labels
	if (isHideClassFeatures && subclasses === null) {
		allCf.hide();
		$(`#please-select-message`).addClass("showing");
	} else {
		allCf.show();
		$(`#please-select-message`).removeClass("showing");
	}
	if (isHideClassFeatures) {
		cfToggle.removeClass(CLSS_CLASS_FEATURES_ACTIVE);
		toToggleCf.hide();
	} else {
		cfToggle.addClass(CLSS_CLASS_FEATURES_ACTIVE);
		toToggleCf.show();
	}

	// show UA/etc pills as required
	const srcToggle = $(`#${ID_OTHER_SOURCES_TOGGLE}`);
	const toToggleSrc = $(`.${CLSS_SUBCLASS_PILL}.${CLSS_NON_STANDARD_SOURCE}`).not(`.${CLSS_PANEL_LINK}`);
	if (hideOtherSources) {
		srcToggle.removeClass(CLSS_OTHER_SOURCES_ACTIVE);
		toToggleSrc.hide();
	} else {
		srcToggle.addClass(CLSS_OTHER_SOURCES_ACTIVE);
		toToggleSrc.show();
	}

	// scroll to the linked feature if required
	if (feature !== null && (prevFeature === null || prevFeature !== feature)) {
		document.getElementById($(`[${ATB_DATA_FEATURE_LINK}="${feature}"]`)[0].getAttribute(ATB_DATA_FEATURE_ID)).scrollIntoView();
		prevFeature = feature;
	}

	updateClassTableLinks();

	if (bookView) ClassBookView.open();
	else ClassBookView.teardown();

	if (comparisonView) SubclassComparisonView.open();
	else SubclassComparisonView.teardown();

	function handleTableGroups (shownInTable, tableDataTag, show) {
		$(`[data-subclass-list]`).each(
			function () {
				const $this = $(this);
				const scs = $this.attr(ATB_DATA_SC_LIST).split(ATB_DATA_LIST_SEP);

				// if another class has shown this item, don't hide it
				if (!show) {
					for (let i = 0; i < scs.length; i++) {
						const sc = scs[i];
						if ($.inArray(sc, shownInTable) !== -1) {
							return;
						}
					}
				}

				for (let i = 0; i < scs.length; i++) {
					const sc = scs[i];
					if (sc === tableDataTag) {
						if (show) $this.show();
						else $this.hide();
						break;
					}
				}
			}
		);
	}

	function updateClassTableLinks () {
		const hashParts = curHash.slice(1).split(HASH_PART_SEP);
		const outParts = [];
		for (let i = 0; i < hashParts.length; i++) {
			const part = hashParts[i];
			if (!part.startsWith(HASH_FEATURE)) outParts.push(part);
		}
		$(`.${CLSS_FEATURE_LINK}`).each(
			function () {
				const $this = $(this);
				this.href = HASH_START + outParts.join(HASH_PART_SEP) + HASH_PART_SEP + $this.attr(ATB_DATA_FEATURE_LINK);
			}
		)
	}

	function hideAllSubclasses () {
		updateClassTableLinks();
		const $pgContent = $(`#pagecontent`);
		$(`.${CLSS_SUBCLASS_PILL}`).removeClass(CLSS_ACTIVE);
		$pgContent.find(`.${CLSS_SUBCLASS_FEATURE}`).hide();
		$(`.${CLSS_SUBCLASS_PREFIX}`).hide();
		const allNonstandard = $pgContent.find(`div.${CLSS_NON_STANDARD_SOURCE}`);
		allNonstandard.hide();
		// if we're showing features from other sources, make sure these stay visible
		if (!hideOtherSources) {
			allNonstandard.not(`.${CLSS_SUBCLASS_FEATURE}`).not(`.${CLSS_SUBCLASS_PILL}`).show();
		}
		// hide all table col groups
		// TODO add handling for non-standard sources if UA non-caster->caster subclass are introduced
		$(`[data-subclass-list]`).each(
			function () {
				$(this).hide();
			}
		);
	}
}

function initCompareMode () {
	$(`#btn-comparemode`).on("click", () => {
		cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${SubclassComparisonView.SUBHASH}`);
	});
}

const SubclassComparisonView = {
	SUBHASH: `${HASH_COMP_VIEW}true`,
	compareViewActive: false,
	_$body: null,
	_$wrpBookUnder: null,
	_$wrpBook: null,

	open: () => {
		function hashTeardown () {
			cleanSetHash(window.location.hash.replace(SubclassComparisonView.SUBHASH, ""));
		}

		if (SubclassComparisonView.compareViewActive) return;
		SubclassComparisonView.compareViewActive = true;

		const $body = $(`body`);
		const $wrpBookUnder = $(`<div class="book-view-under"/>`);
		const $wrpBook = $(`<div class="book-view"/>`);
		SubclassComparisonView._$body = $body;
		SubclassComparisonView._$wrpBookUnder = $wrpBookUnder;
		SubclassComparisonView._$wrpBook = $wrpBook;

		$body.css("overflow", "hidden");

		const $bkTbl = $(`<table class="stats stats-book" style="font-size: 1.0em; font-family: inherit;"/>`);
		const $brdTop = $(`<tr><th class="border close-border" style="width: 100%;"><div/></th></tr>`);
		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"></span>`)
			.on("click", () => {
				hashTeardown();
			});
		$brdTop.find(`div`).append($btnClose);
		$bkTbl.append($brdTop);

		const $tbl = $(`<table class="stats stats-book" style="width: auto; margin: 0 auto; font-family: inherit;"/>`);
		const renderStack = [];
		const numScLvls = curClass.subclasses[0].subclassFeatures.length;
		for (let i = 0; i < numScLvls; ++i) {
			renderStack.push(`<tr>`);
			curClass.subclasses.forEach((sc, j) => {
				renderStack.push(`<td class="subclass-features-${j} ${getSubclassStyles(sc).join(" ")}">`);
				sc.subclassFeatures[i].forEach(f => {
					renderer.recursiveEntryRender(f, renderStack);
				});
				renderStack.push(`</td>`);
			});
			renderStack.push(`</tr>`);
			renderStack.push(`<tr><th colspan="6"><hr></th></tr>`);
		}
		$tbl.append(renderStack.join(""));

		let numShown = 0;
		curClass.subclasses.forEach((sc, i) => {
			const $pill = $(`.sc-pill[data-subclass="${sc.name}"]`);
			if (!($pill.hasClass("active"))) {
				$tbl.find(`.subclass-features-${i}`).hide();
			} else {
				numShown++;
			}
		});

		$tbl.find(`tr > td > div`).css("width", "400px");
		const $tblRow = $(`<tr/>`);
		$tblRow.append($(`<div style="overflow: auto; max-height: calc(100vh - 16px); ${numShown ? "" : "display: none;"}"/>`).append($tbl));
		const $msgRow = $(`<tr ${numShown ? `style="display: none;"` : ""}><td class="text-align-center"><span class="initial-message">Please select some subclasses first</span><br></td></tr>`);
		$msgRow.find(`td`).append($(`<button class="btn btn-default">Close</button>`).on("click", () => {
			hashTeardown();
		}));
		$bkTbl.append($tblRow).append($msgRow).append(EntryRenderer.utils.getBorderTr());

		$wrpBook.append($bkTbl);
		$body.append($wrpBookUnder).append($wrpBook);
	},

	teardown: () => {
		if (SubclassComparisonView.compareViewActive) {
			SubclassComparisonView._$body.css("overflow", "");
			SubclassComparisonView._$wrpBookUnder.remove();
			SubclassComparisonView._$wrpBook.remove();
			SubclassComparisonView.compareViewActive = false;
		}
	}
};

const ClassBookView = {
	SUBHASH: `${HASH_BOOK_VIEW}true`,
	bookViewActive: false,
	_$body: null,
	_$wrpBookUnder: null,
	_$wrpBook: null,
	_$bkTbl: null,
	_$scToggles: {},

	open: () => {
		function tglCf ($bkTbl, $cfToggle) {
			$bkTbl.find(`.class-features`).toggle();
			$cfToggle.toggleClass("cf-active");
		}

		function hashTeardown () {
			cleanSetHash(window.location.hash.replace(ClassBookView.SUBHASH, ""));
		}

		if (ClassBookView.bookViewActive) return;
		ClassBookView.bookViewActive = true;

		const $body = $(`body`);
		const $wrpBookUnder = $(`<div class="book-view-under"/>`);
		const $wrpBook = $(`<div class="book-view"/>`);
		ClassBookView._$body = $body;
		ClassBookView._$wrpBookUnder = $wrpBookUnder;
		ClassBookView._$wrpBook = $wrpBook;

		$body.css("overflow", "hidden");

		// main panel
		const $pnlContent = $(`<div class="pnl-content"/>`);
		const $bkTbl = $(`<table class="stats stats-book"/>`);
		ClassBookView._$bkTbl = $bkTbl;
		const $brdTop = $(`<tr><th class="border close-border" colspan="6"><div/></th></tr>`);
		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove"></span>`)
			.on("click", () => {
				hashTeardown();
			});
		$brdTop.find(`div`).append($btnClose);
		$bkTbl.append($brdTop);

		const renderStack = [];
		renderer.setFirstSection(true);
		renderer.recursiveEntryRender({type: "section", name: curClass.name}, renderStack, 0, `<tr><td colspan="6">`, `</td></tr>`, true);

		renderStack.push(`<tr class="class-features"><td colspan="6">`);
		curClass.classFeatures.forEach(lvl => {
			lvl.forEach(cf => {
				renderer.recursiveEntryRender(cf, renderStack);
			});
		});
		renderStack.push(`</td></tr>`);

		curClass.subclasses.forEach((sc, i) => {
			renderStack.push(`<tr class="subclass-features-${i} ${getSubclassStyles(sc).join(" ")}"><td colspan="6">`);
			sc.subclassFeatures.forEach(lvl => {
				lvl.forEach(f => {
					renderer.recursiveEntryRender(f, renderStack);
				});
			});
			renderStack.push(`</td></tr>`);
		});
		renderStack.push(EntryRenderer.utils.getBorderTr());
		$bkTbl.append(renderStack.join(""));
		$pnlContent.append($bkTbl);

		// menu panel
		const $pnlMenu = $(`<div class="pnl-menu"/>`);
		const $cfPill = $(`#cf-toggle`);

		const $cfToggle = $(`<span class="pnl-link cf-active">Class Features</span>`).on("click", () => {
			tglCf($bkTbl, $cfToggle);
			$cfPill.click();
		});

		if (!($cfPill.hasClass("cf-active"))) {
			tglCf($bkTbl, $cfToggle);
		}

		$pnlMenu.append($cfToggle);

		curClass.subclasses.forEach((sc, i) => {
			const name = hasBeenReprinted(sc.shortName, sc.source) ? `${sc.shortName} (${Parser.sourceJsonToAbv(sc.source)})` : sc.shortName;
			const styles = getSubclassStyles(sc);
			const $pill = $(`.sc-pill[data-subclass="${sc.name}"][data-source="${sc.source}"]`);

			const $scToggle = $(`<span class="pnl-link active ${styles.join(" ")}" title="Source: ${Parser.sourceJsonToFull(sc.source)}" data-i="${i}" data-bk-subclass="${sc.name}" data-bk-source="${sc.source}">${name}</span>`).on("click", () => {
				ClassBookView.tglSc($bkTbl, $scToggle, i);
				$pill.click();
			});

			if (!($pill.hasClass("active"))) {
				ClassBookView.tglSc($bkTbl, $scToggle, i);
			}

			ClassBookView._$scToggles[String(i)] = $scToggle;
			$pnlMenu.append($scToggle);
		});

		const $menClose = $(`<span class="pnl-link pnl-link-close">\u21FD Close</span>`).on("click", () => {
			hashTeardown();
		});
		$pnlMenu.append($menClose);

		// right (blank) panel
		const $pnlBlank = $(`<div class="pnl-menu pnl-menu-pad"/>`);

		$wrpBook.append($pnlMenu).append($pnlContent).append($pnlBlank);
		$body.append($wrpBookUnder).append($wrpBook);
	},

	teardown: () => {
		if (ClassBookView.bookViewActive) {
			ClassBookView._$bkTbl = null;
			ClassBookView._$scToggles = {};

			ClassBookView._$body.css("overflow", "");
			ClassBookView._$wrpBookUnder.remove();
			ClassBookView._$wrpBook.remove();
			ClassBookView.bookViewActive = false;
		}
	},

	tglSc: ($bkTbl, $scToggle, i) => {
		$bkTbl.find(`.subclass-features-${i}`).toggle();
		$scToggle.toggleClass("active");
	},

	updateVisible: ($toShow, $toHide) => {
		function doUpdate ($list, show) {
			$list.map($p => {
				const $it = ClassBookView._$wrpBook.find(`.pnl-link[data-bk-subclass="${$p.attr(ATB_DATA_SC)}"][data-bk-source="${$p.attr(ATB_DATA_SRC)}"]`);
				if ($it.length) {
					const index = $it.data("i");
					const $real = ClassBookView._$scToggles[index];
					if (show && !$real.hasClass("active")) {
						ClassBookView.tglSc(ClassBookView._$bkTbl, $real, Number(index));
					} if (!show && $real.hasClass("active")) {
						ClassBookView.tglSc(ClassBookView._$bkTbl, $real, Number(index));
					}
				}
			});
		}

		if (ClassBookView.bookViewActive) {
			// $toShow/$toHide are lists of subclass pills
			doUpdate($toShow, true);
			doUpdate($toHide, false);
		}
	}
};

function initReaderMode () {
	$(`#btn-readmode`).on("click", () => {
		cleanSetHash(`${window.location.hash}${HASH_PART_SEP}${ClassBookView.SUBHASH}`);
	});
}