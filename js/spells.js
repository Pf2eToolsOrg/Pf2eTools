"use strict";

const JSON_DIR = "data/spells/";
const JSON_LIST_NAME = "spell";

// toss these into the "Tags" section to save screen space
const META_ADD_CONC = "Concentration";
const META_ADD_V = "Verbal";
const META_ADD_S = "Somatic";
const META_ADD_M = "Material";
const META_ADD_R = "Royalty";
const META_ADD_M_COST = "Material with Cost";
const META_ADD_M_CONSUMED = "Material is Consumed";
// real meta tags
const META_RITUAL = "Ritual";
const META_TECHNOMAGIC = "Technomagic";

const F_RNG_POINT = "Point";
const F_RNG_SELF_AREA = "Self (Area)";
const F_RNG_SELF = "Self";
const F_RNG_TOUCH = "Touch";
const F_RNG_SPECIAL = "Special";

const SUBCLASS_LOOKUP = {};

function getFltrSpellLevelStr (level) {
	return level === 0 ? Parser.spLevelToFull(level) : Parser.spLevelToFull(level) + " level";
}

function getNormalisedTime (time) {
	const firstTime = time[0];
	let multiplier = 1;
	let offset = 0;
	switch (firstTime.unit) {
		case Parser.SP_TM_B_ACTION: offset = 1; break;
		case Parser.SP_TM_REACTION: offset = 2; break;
		case Parser.SP_TM_ROUND: multiplier = 6; break;
		case Parser.SP_TM_MINS: multiplier = 60; break;
		case Parser.SP_TM_HRS: multiplier = 3600; break;
	}
	if (time.length > 1) offset += 0.5;
	return (multiplier * firstTime.number) + offset;
}

const INCHES_PER_FOOT = 12;
const FEET_PER_MILE = 5280;

function getNormalisedRange (range) {
	let multiplier = 1;
	let distance = 0;
	let offset = 0;

	switch (range.type) {
		case RNG_SPECIAL: return 1000000000;
		case RNG_POINT: adjustForDistance(); break;
		case RNG_LINE: offset = 1; adjustForDistance(); break;
		case RNG_CONE: offset = 2; adjustForDistance(); break;
		case RNG_RADIUS: offset = 3; adjustForDistance(); break;
		case RNG_HEMISPHERE: offset = 4; adjustForDistance(); break;
		case RNG_SPHERE: offset = 5; adjustForDistance(); break;
		case RNG_CYLINDER: offset = 6; adjustForDistance(); break;
		case RNG_CUBE: offset = 7; adjustForDistance(); break;
	}

	// value in inches, to allow greater granularity
	return (multiplier * distance) + offset;

	function adjustForDistance () {
		const dist = range.distance;
		switch (dist.type) {
			case UNT_FEET: multiplier = INCHES_PER_FOOT; distance = dist.amount; break;
			case UNT_MILES: multiplier = INCHES_PER_FOOT * FEET_PER_MILE; distance = dist.amount; break;
			case RNG_SELF: distance = 0; break;
			case RNG_TOUCH: distance = 1; break;
			case RNG_SIGHT: multiplier = INCHES_PER_FOOT * FEET_PER_MILE; distance = 12; break; // assume sight range of person ~100 ft. above the ground
			case RNG_UNLIMITED_SAME_PLANE: distance = 900000000; break; // from BolS (homebrew)
			case RNG_UNLIMITED: distance = 900000001; break;
			default: {
				// it's homebrew?
				const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "spellDistanceUnits", dist.type);
				if (fromBrew) {
					const ftPerUnit = fromBrew.feetPerUnit;
					if (ftPerUnit != null) {
						multiplier = INCHES_PER_FOOT * ftPerUnit;
						distance = dist.amount;
					} else {
						distance = 910000000; // default to max distance, to have them displayed at the bottom
					}
				}
				break;
			}
		}
	}
}

function getRangeType (range) {
	switch (range.type) {
		case RNG_SPECIAL: return F_RNG_SPECIAL;
		case RNG_POINT:
			switch (range.distance.type) {
				case RNG_SELF: return F_RNG_SELF;
				case RNG_TOUCH: return F_RNG_TOUCH;
				default: return F_RNG_POINT;
			}
		case RNG_LINE:
		case RNG_CONE:
		case RNG_RADIUS:
		case RNG_HEMISPHERE:
		case RNG_SPHERE:
		case RNG_CYLINDER:
		case RNG_CUBE:
			return F_RNG_SELF_AREA
	}
}

function getTblTimeStr (time) {
	return (time.number === 1 && Parser.SP_TIME_SINGLETONS.includes(time.unit))
		? `${time.unit.uppercaseFirst()}${time.unit === Parser.SP_TM_B_ACTION ? " acn." : ""}`
		: `${time.number} ${time.unit === Parser.SP_TM_B_ACTION ? "Bonus acn." : time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
}

function getClassFilterStr (c) {
	const nm = c.name.split("(")[0].trim();
	return `${nm}${c.source !== SRC_PHB ? ` (${Parser.sourceJsonToAbv(c.source)})` : ""}`;
}

function getMetaFilterObj (s) {
	const out = [];
	if (s.meta && s.meta.ritual) out.push(META_RITUAL);
	if (s.meta && s.meta.technomagic) out.push(META_TECHNOMAGIC);
	if (s.duration.filter(d => d.concentration).length) {
		out.push(META_ADD_CONC);
		s._isConc = true;
	} else s._isConc = false;
	if (s.components && s.components.v) out.push(META_ADD_V);
	if (s.components && s.components.s) out.push(META_ADD_S);
	if (s.components && s.components.m) out.push(META_ADD_M);
	if (s.components && s.components.r) out.push(META_ADD_R);
	if (s.components && s.components.m && s.components.m.cost) out.push(META_ADD_M_COST);
	if (s.components && s.components.m && s.components.m.consume) out.push(META_ADD_M_CONSUMED);
	if ((s.miscTags && s.miscTags.includes("PRM")) || s.duration.filter(it => it.type === "permanent").length) out.push(Parser.spMiscTagToFull("PRM"));
	if ((s.miscTags && s.miscTags.includes("SCL")) || s.entriesHigherLevel) out.push(Parser.spMiscTagToFull("SCL"));
	if (s.miscTags && s.miscTags.includes("HL")) out.push(Parser.spMiscTagToFull("HL"));
	if (s.miscTags && s.miscTags.includes("SMN")) out.push(Parser.spMiscTagToFull("SMN"));
	if (s.miscTags && s.miscTags.includes("SGT")) out.push(Parser.spMiscTagToFull("SGT"));
	return out;
}

function getFilterAbilitySave (ability) {
	return `${ability.uppercaseFirst().substring(0, 3)}. Save`;
}

function getFilterAbilityCheck (ability) {
	return `${ability.uppercaseFirst().substring(0, 3)}. Check`;
}

function handleBrew (homebrew) {
	RenderSpells.mergeHomebrewSubclassLookup(SUBCLASS_LOOKUP, homebrew);
	addSpells(homebrew.spell);
	return Promise.resolve();
}

class SpellsPage {
	static sortSpells (a, b, o) {
		a = spellList[a.ix];
		b = spellList[b.ix];

		if (o.sortBy === "name") return fallback();
		if (o.sortBy === "source") return SortUtil.ascSort(a.source, b.source) || SortUtil.ascSortLower(a.name, b.name);
		if (o.sortBy === "level") return orFallback(SortUtil.ascSort, "level");
		if (o.sortBy === "time") return orFallback(SortUtil.ascSort, "_normalisedTime");
		if (o.sortBy === "school") return orFallback(SortUtil.ascSort, "school");
		if (o.sortBy === "range") return orFallback(SortUtil.ascSort, "_normalisedRange");
		if (o.sortBy === "concentration") return orFallback(SortUtil.ascSort, "_isConc");
		return 0;

		function fallback () { return SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSort(a.source, b.source); }

		function orFallback (func, prop) {
			const initial = func(a[prop], b[prop]);
			return initial || fallback();
		}
	}
}

async function pPostLoad () {
	const homebrew = await BrewUtil.pAddBrewData();
	await handleBrew(homebrew);
	BrewUtil.bind({list});
	BrewUtil.makeBrewButton("manage-brew");
	BrewUtil.bind({filterBox, sourceFilter});
	await ListUtil.pLoadState();

	ListUtil.bindShowTableButton(
		"btn-show-table",
		"Spells",
		spellList,
		{
			name: {name: "Name", transform: true},
			source: {name: "Source", transform: (it) => `<span class="${Parser.sourceJsonToColor(it)}" title="${Parser.sourceJsonToFull(it)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${Parser.sourceJsonToAbv(it)}</span>`},
			level: {name: "Level", transform: (it) => Parser.spLevelToFull(it)},
			time: {name: "Casting Time", transform: (it) => getTblTimeStr(it[0])},
			duration: {name: "Duration", transform: (it) => Parser.spDurationToFull(it)},
			_school: {name: "School", transform: (sp) => `<span class="school_${sp.school}">${Parser.spSchoolAndSubschoolsAbvsToFull(sp.school, sp.subschools)}</span>`},
			range: {name: "Range", transform: (it) => Parser.spRangeToFull(it)},
			_components: {name: "Components", transform: (sp) => Parser.spComponentsToFull(sp.components, sp.level)},
			classes: {name: "Classes", transform: (it) => Parser.spMainClassesToFull(it)},
			entries: {name: "Text", transform: (it) => Renderer.get().render({type: "entries", entries: it}, 1), flex: 3},
			entriesHigherLevel: {name: "At Higher Levels", transform: (it) => Renderer.get().render({type: "entries", entries: (it || [])}, 1), flex: 2}
		},
		{generator: ListUtil.basicFilterGenerator},
		(a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source)
	);
}

window.onload = async function load () {
	let subclassLookup;
	[filterBox, subclassLookup] = await Promise.all([
		pInitFilterBox({
			filters: [
				sourceFilter,
				levelFilter,
				classAndSubclassFilter,
				raceFilter,
				backgroundFilter,
				metaFilter,
				schoolFilter,
				subSchoolFilter,
				damageFilter,
				conditionFilter,
				spellAttackFilter,
				saveFilter,
				checkFilter,
				timeFilter,
				durationFilter,
				rangeFilter,
				areaTypeFilter
			]
		}),
		RenderSpells.pGetSubclassLookup(),
		ExcludeUtil.pInitialise()
	]);
	Object.assign(SUBCLASS_LOOKUP, subclassLookup);
	await pMultisourceLoad(JSON_DIR, JSON_LIST_NAME, pPageInit, addSpells, pPostLoad);
	if (Hist.lastLoadedId == null) Hist._freshLoad();
	ExcludeUtil.checkShowAllExcluded(spellList, $(`#pagecontent`));
};

let list;
let subList;
let spellBookView;
let brewSpellClasses;
const sourceFilter = getSourceFilter();
const levelFilter = new Filter({
	header: "Level",
	items: [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9
	],
	displayFn: getFltrSpellLevelStr
});
const classFilter = new Filter({header: "Class"});
const subclassFilter = new Filter({
	header: "Subclass",
	nests: {},
	groupFn: (it) => SourceUtil.hasBeenReprinted(it.userData.subClass.name, it.userData.subClass.source) || Parser.sourceJsonToFull(it.userData.subClass.source).startsWith(UA_PREFIX) || Parser.sourceJsonToFull(it.userData.subClass.source).startsWith(PS_PREFIX)
});
const classAndSubclassFilter = new MultiFilter({header: "Classes", filters: [classFilter, subclassFilter]});
const raceFilter = new Filter({header: "Race"});
const backgroundFilter = new Filter({header: "Background"});
const metaFilter = new Filter({
	header: "Components & Miscellaneous",
	items: [META_ADD_CONC, META_ADD_V, META_ADD_S, META_ADD_M, META_ADD_M_COST, META_ADD_M_CONSUMED, ...Object.values(Parser.SP_MISC_TAG_TO_FULL), META_RITUAL, META_TECHNOMAGIC],
	itemSortFn: null
});
const schoolFilter = new Filter({
	header: "School",
	items: [...Parser.SKL_ABVS],
	displayFn: Parser.spSchoolAbvToFull
});
const subSchoolFilter = new Filter({
	header: "Subschool",
	items: [],
	displayFn: Parser.spSchoolAbvToFull
});
const damageFilter = new Filter({
	header: "Damage Type",
	items: MiscUtil.copy(Parser.DMG_TYPES),
	displayFn: StrUtil.uppercaseFirst
});
const conditionFilter = new Filter({
	header: "Conditions Inflicted",
	items: MiscUtil.copy(Parser.CONDITIONS),
	displayFn: StrUtil.uppercaseFirst
});
const spellAttackFilter = new Filter({
	header: "Spell Attack",
	items: ["M", "R", "O"],
	displayFn: Parser.spAttackTypeToFull,
	itemSortFn: null
});
const saveFilter = new Filter({
	header: "Saving Throw",
	items: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
	displayFn: getFilterAbilitySave,
	itemSortFn: null
});
const checkFilter = new Filter({
	header: "Opposed Ability Check",
	items: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
	displayFn: getFilterAbilityCheck,
	itemSortFn: null
});
const timeFilter = new Filter({
	header: "Cast Time",
	items: [
		Parser.SP_TM_ACTION,
		Parser.SP_TM_B_ACTION,
		Parser.SP_TM_REACTION,
		Parser.SP_TM_ROUND,
		Parser.SP_TM_MINS,
		Parser.SP_TM_HRS
	],
	displayFn: Parser.spTimeUnitToFull,
	itemSortFn: null
});
const durationFilter = new Filter({
	header: "Duration",
	items: [
		"instant",
		"timed",
		"permanent",
		"special"
	],
	displayFn: StrUtil.uppercaseFirst,
	itemSortFn: null
});
const rangeFilter = new Filter({
	header: "Range",
	items: [
		F_RNG_SELF,
		F_RNG_TOUCH,
		F_RNG_POINT,
		F_RNG_SELF_AREA,
		F_RNG_SPECIAL
	],
	itemSortFn: null
});
const areaTypeFilter = new Filter({
	header: "Area Style",
	items: ["ST", "MT", "R", "N", "C", "Y", "H", "L", "S", "Q", "W"],
	displayFn: Parser.spAreaTypeToFull,
	itemSortFn: null
});
let filterBox;

async function pPageInit (loadedSources) {
	Object.keys(loadedSources)
		.map(src => new FilterItem({item: src, changeFn: loadSource(JSON_LIST_NAME, addSpells)}))
		.forEach(fi => sourceFilter.addItem(fi));

	list = ListUtil.initList({
		listClass: "spells",
		fnSort: SpellsPage.sortSpells
	});
	ListUtil.setOptions({primaryLists: [list]});
	SortUtil.initBtnSortHandlers($(`#filtertools`), list);

	const $outVisibleResults = $(`.lst__wrp-search-visible`);
	list.on("updated", () => {
		$outVisibleResults.html(`${list.visibleItems.length}/${list.items.length}`);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	subList = ListUtil.initSublist({
		listClass: "subspells",
		fnSort: SpellsPage.sortSpells
	});
	SortUtil.initBtnSortHandlers($("#sublistsort"), subList);
	ListUtil.initGenericPinnable();

	spellBookView = new BookModeView(
		"bookview",
		$(`#btn-spellbook`),
		"If you wish to view multiple spells, please first make a list",
		"Spells Book View",
		($wrpContent, $dispName) => {
			const toShow = ListUtil.getSublistedIds().map(id => spellList[id]);

			const stack = [];
			const renderSpell = (sp) => {
				stack.push(`<div class="bkmv__wrp-item"><table class="stats stats--book stats--bkmv"><tbody>`);
				stack.push(Renderer.spell.getCompactRenderedString(sp));
				stack.push(`</tbody></table></div>`);
			};

			for (let i = 0; i < 10; ++i) {
				const atLvl = toShow.filter(sp => sp.level === i);
				if (atLvl.length) {
					stack.push(`<div class="w-100 h-100 bkmv__no-breaks">`);
					stack.push(`<div class="bkmv__spacer-name flex-v-center no-shrink">${Parser.spLevelToFullLevelText(i)}</div>`);
					atLvl.forEach(sp => renderSpell(sp));
					stack.push(`</div>`);
				}
			}

			if (!toShow.length && Hist.lastLoadedId != null) {
				stack.push(`<div class="w-100 h-100 no-breaks">`);
				const sp = spellList[Hist.lastLoadedId];
				renderSpell(sp);
				$dispName.text(Parser.spLevelToFullLevelText(sp.level));
				stack.push(`</div>`);
			}

			$wrpContent.append(stack.join(""));
			return toShow.length;
		}, true
	);

	// load homebrew class spell list addons
	brewSpellClasses = {PHB: {}};

	function handleSubclass (className, classSource = SRC_PHB, sc) {
		const genSubclassSpell = (it, subSubclass) => {
			const name = (typeof it === "string" ? it : it.name).toLowerCase();
			const source = typeof it === "string" ? "PHB" : it.source;
			brewSpellClasses[source] = brewSpellClasses[source] || {fromClassList: [], fromSubclass: []};
			brewSpellClasses[source][name] = brewSpellClasses[source][name] || {fromClassList: [], fromSubclass: []};
			const toAdd = {
				class: {
					name: className,
					source: classSource
				},
				subclass: {
					name: sc.shortName,
					source: sc.source
				}
			};
			if (subSubclass) toAdd.subclass.subSubclass = subSubclass;
			brewSpellClasses[source][name].fromSubclass.push(toAdd);
		};

		if (sc.subclassSpells) sc.subclassSpells.forEach(it => genSubclassSpell(it));
		if (sc.subSubclassSpells) $.each(sc.subSubclassSpells, (ssC, arr) => arr.forEach(it => genSubclassSpell(it, ssC)));
	}
	try {
		const homebrew = await BrewUtil.pAddBrewData();
		BrewUtil.bind({pHandleBrew: () => {}}); // temporarily bind "do nothing" brew handler
		await BrewUtil.pAddLocalBrewData(); // load local homebrew, so we can add any local spell classes
		BrewUtil.bind({pHandleBrew: null}); // unbind temporary handler

		if (homebrew.class) {
			homebrew.class.forEach(c => {
				if (c.classSpells) {
					c.classSpells.forEach(it => {
						const name = (typeof it === "string" ? it : it.name).toLowerCase();
						const source = typeof it === "string" ? "PHB" : it.source;
						brewSpellClasses[source] = brewSpellClasses[source] || {};
						brewSpellClasses[source][name] = brewSpellClasses[source][name] || {fromClassList: [], fromSubclass: []};
						brewSpellClasses[source][name].fromClassList.push({name: c.name, source: c.source});
					});
				}
				if (c.subclasses) c.subclasses.forEach(sc => handleSubclass(c.name, c.source, sc));
			})
		}
		if (homebrew.subclass) homebrew.subclass.forEach(sc => handleSubclass(sc.class, sc.classSource, sc));
	} catch (e) {
		await BrewUtil.pPurgeBrew(e);
	}
}

function getSublistItem (spell, pinId) {
	const hash = UrlUtil.autoEncodeHash(spell);
	const school = Parser.spSchoolAndSubschoolsAbvsShort(spell.school, spell.subschools);
	const level = Parser.spLevelToFull(spell.level);
	const time = getTblTimeStr(spell.time[0]);
	const concentration = spell._isConc ? "×" : "";
	const range = Parser.spRangeToFull(spell.range);

	const $ele = $(`<li class="row">
		<a href="#${UrlUtil.autoEncodeHash(spell)}" title="${spell.name}">
			<span class="bold col-3-2 pl-0">${spell.name}</span>
			<span class="capitalise col-1-5 text-center">${level}</span>
			<span class="col-1-8 text-center">${time}</span>
			<span class="capitalise col-1-6 school_${spell.school} text-center" title="${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools)}">${school}</span>
			<span class="concentration--sublist col-0-7 text-center" title="Concentration">${concentration}</span>
			<span class="range col-3-2 pr-0 text-right">${range}</span>
		</a>
	</li>`).contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

	const listItem = new ListItem(
		pinId,
		$ele,
		spell.name,
		{
			hash,
			school,
			level,
			time,
			concentration,
			range
		}
	);
	return listItem;
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(item => {
		const s = spellList[item.ix];
		return filterBox.toDisplay(
			f,
			s._fSources,
			s.level,
			[s._fClasses, s._fSubclasses],
			s._fRaces,
			s._fBackgrounds,
			s._fMeta,
			s.school,
			s.subschools,
			s.damageInflict,
			s.conditionInflict,
			s.spellAttack,
			s.savingThrow,
			s.opposedCheck,
			s._fTimeType,
			s._fDurationType,
			s._fRangeType,
			s.areaTags
		);
	});
	onFilterChangeMulti(spellList);
}

let spellList = [];
let spI = 0;

const _addedHashes = new Set();
function addSpells (data) {
	if (!data || !data.length) return;

	spellList = spellList.concat(data);

	for (; spI < spellList.length; spI++) {
		const spell = spellList[spI];
		const spHash = UrlUtil.autoEncodeHash(spell);
		if (!spell.uniqueId && _addedHashes.has(spHash)) continue;
		_addedHashes.add(spHash);
		if (ExcludeUtil.isExcluded(spell.name, "spell", spell.source)) continue;

		let levelText = Parser.spLevelToFull(spell.level);
		if (spell.meta && spell.meta.ritual) levelText += " (rit.)";
		if (spell.meta && spell.meta.technomagic) levelText += " (tec.)";

		RenderSpells.initClasses(spell, brewSpellClasses);

		// used for sorting
		spell._normalisedTime = getNormalisedTime(spell.time);
		spell._normalisedRange = getNormalisedRange(spell.range);

		// used for filtering
		spell._fSources = ListUtil.getCompleteFilterSources(spell);
		spell._fMeta = getMetaFilterObj(spell);
		spell._fClasses = spell.classes.fromClassList ? spell.classes.fromClassList.map(c => getClassFilterStr(c)) : [];
		spell._fSubclasses = spell.classes.fromSubclass
			? spell.classes.fromSubclass.map(c => new FilterItem({
				item: `${c.class.name}: ${getClassFilterStr(c.subclass)}`,
				nest: c.class.name,
				userData: {
					subClass: {
						name: c.subclass.name,
						source: c.subclass.source
					},
					className: c.class.name
				}
			}))
			: [];
		spell._fRaces = spell.races ? spell.races.map(r => r.baseName || r.name) : [];
		spell._fBackgrounds = spell.backgrounds ? spell.backgrounds.map(bg => bg.name) : [];
		spell._fTimeType = spell.time.map(t => t.unit);
		spell._fDurationType = spell.duration.map(t => t.type);
		spell._fRangeType = getRangeType(spell.range);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const hash = UrlUtil.autoEncodeHash(spell);
		const source = Parser.sourceJsonToAbv(spell.source);
		const time = getTblTimeStr(spell.time[0]);
		const school = Parser.spSchoolAndSubschoolsAbvsShort(spell.school, spell.subschools);
		const concentration = spell._isConc ? "×" : "";
		const range = Parser.spRangeToFull(spell.range);

		eleLi.innerHTML = `<a href="#${spHash}">
			<span class="bold col-2-9 pl-0">${spell.name}</span>
			<span class="col-1-5 text-center">${levelText}</span>
			<span class="col-1-7 text-center">${time}</span>
			<span class="col-1-2 school_${spell.school} text-center" title="${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools)}">${school}</span>
			<span class="col-0-6 text-center" title="Concentration">${concentration}</span>
			<span class="col-2-4 text-right">${range}</span>
			<span class="col-1-7 text-center ${Parser.sourceJsonToColor(spell.source)} pr-0" title="${Parser.sourceJsonToFull(spell.source)}" ${BrewUtil.sourceJsonToStyle(spell.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			spI,
			eleLi,
			spell.name,
			{
				hash,
				source,
				level: levelText,
				time,
				classes: Parser.spClassesToFull(spell.classes, true),
				concentration,
				uniqueid: spell.uniqueId ? spell.uniqueId : spI
			}
		);

		eleLi.addEventListener("click", (evt) => list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, list, listItem));

		list.addItem(listItem);

		// populate filters
		if (spell.level > 9) levelFilter.addItem(spell.level);
		sourceFilter.addItem(spell._fSources);
		raceFilter.addItem(spell._fRaces);
		backgroundFilter.addItem(spell._fBackgrounds);
		spell._fClasses.forEach(c => classFilter.addItem(c));
		spell._fSubclasses.forEach(sc => {
			subclassFilter.addNest(sc.userData.className, {isHidden: true});
			subclassFilter.addItem(sc);
		});
		subSchoolFilter.addItem(spell.subschools);
	}

	list.update();

	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: spellList,
		getSublistRow: getSublistItem,
		primaryLists: [list]
	});
	ListUtil.bindPinButton();
	Renderer.hover.bindPopoutButton(spellList);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton(sublistFuncPreload);
}

function sublistFuncPreload (json, funcOnload) {
	const loaded = Object.keys(loadedSources).filter(it => loadedSources[it].loaded);
	const lowerSources = json.sources.map(it => it.toLowerCase());
	const toLoad = Object.keys(loadedSources).filter(it => !loaded.includes(it)).filter(it => lowerSources.includes(it.toLowerCase()));
	const loadTotal = toLoad.length;
	if (loadTotal) {
		let loadCount = 0;
		toLoad.forEach(src => {
			loadSource(JSON_LIST_NAME, (spells) => {
				addSpells(spells);
				if (++loadCount === loadTotal) {
					funcOnload();
				}
			})(src, "yes");
		});
	} else {
		funcOnload();
	}
}

function loadHash (id) {
	const $pageContent = $("#pagecontent").empty();
	const spell = spellList[id];
	$pageContent.append(RenderSpells.$getRenderedSpell(spell, SUBCLASS_LOOKUP));
	loadSubHash([]);

	ListUtil.updateSelected();
}

function handleUnknownHash (link, sub) {
	const src = Object.keys(loadedSources).find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		loadSource(JSON_LIST_NAME, (spells) => {
			addSpells(spells);
			Hist.hashChange();
		})(src, "yes");
	} else {
		Hist._freshLoad();
	}
}

function loadSubHash (sub) {
	sub = filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub, sublistFuncPreload);

	spellBookView.handleSub(sub);
}
