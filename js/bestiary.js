"use strict";

const JSON_DIR = "data/bestiary/";
const META_URL = "meta.json";
const FLUFF_INDEX = "fluff-index.json";
const JSON_LIST_NAME = "monster";
const ECGEN_BASE_PLAYERS = 4; // assume a party size of four
const renderer = EntryRenderer.getDefaultRenderer();

window.PROF_MODE_BONUS = "bonus";
window.PROF_MODE_DICE = "dice";
window.PROF_DICE_MODE = PROF_MODE_BONUS;

function imgError (x) {
	if (x) $(x).remove();
	$(`#pagecontent th.name`).css("padding-right", "0.3em");
	$(`.mon__wrp_hp`).css("max-width", "none");
}

function handleStatblockScroll (event, ele) {
	$(`#token_image`)
		.toggle(ele.scrollTop < 32)
		.css({
			opacity: (32 - ele.scrollTop) / 32,
			top: -ele.scrollTop
		});
}

const _MISC_FILTER_SPELLCASTER = "Spellcaster, ";
function ascSortMiscFilter (a, b) {
	if (a.includes(_MISC_FILTER_SPELLCASTER) && b.includes(_MISC_FILTER_SPELLCASTER)) {
		a = Parser.attFullToAbv(a.replace(_MISC_FILTER_SPELLCASTER, ""));
		b = Parser.attFullToAbv(b.replace(_MISC_FILTER_SPELLCASTER, ""));
		return SortUtil.ascSortAtts(b, a);
	} else return SortUtil.ascSort(a, b);
}

function getAllImmRest (toParse, key) {
	function recurse (it) {
		if (typeof it === "string") {
			out.push(it);
		} else if (it[key]) {
			it[key].forEach(nxt => recurse(nxt));
		}
	}
	const out = [];
	toParse.forEach(it => {
		recurse(it);
	});
	return out;
}

function basename (str, sep) {
	return str.substr(str.lastIndexOf(sep) + 1);
}

const meta = {};
const languages = {};

function pLoadMeta () {
	return new Promise(resolve => {
		DataUtil.loadJSON(JSON_DIR + META_URL)
			.then((data) => {
				// Convert the legendary Group JSONs into a look-up, i.e. use the name as a JSON property name
				for (let i = 0; i < data.legendaryGroup.length; i++) {
					meta[data.legendaryGroup[i].name] = {
						"lairActions": data.legendaryGroup[i].lairActions,
						"regionalEffects": data.legendaryGroup[i].regionalEffects
					};
				}
				Object.keys(data.language).forEach(k => languages[k] = data.language[k]);
				languageFilter.items = Object.keys(languages).sort((a, b) => SortUtil.ascSortLower(languages[a], languages[b]));
				resolve();
			});
	});
}

// for use in homebrew only
function addLegendaryGroups (toAdd) {
	if (!toAdd || !toAdd.length) return;

	toAdd.forEach(it => {
		meta[it.name] = {
			"lairActions": it.lairActions,
			"regionalEffects": it.regionalEffects
		}
	});
}

let ixFluff = {};
function pLoadFluffIndex () {
	return new Promise(resolve => {
		DataUtil.loadJSON(JSON_DIR + FLUFF_INDEX)
			.then((data) => {
				ixFluff = data;
				resolve();
			});
	});
}

function handleBrew (homebrew) {
	addLegendaryGroups(homebrew.legendaryGroup);
	addMonsters(homebrew.monster);
	return Promise.resolve();
}

function pPostLoad () {
	return new Promise(resolve => {
		BrewUtil.pAddBrewData()
			.then(handleBrew)
			.then(BrewUtil.pAddLocalBrewData)
			.catch(BrewUtil.pPurgeBrew)
			.then(async () => {
				BrewUtil.makeBrewButton("manage-brew");
				BrewUtil.bind({list, filterBox, sourceFilter});
				await ListUtil.pLoadState();
				resolve();
			});
	})
}

let filterBox;
window.onload = async function load () {
	filterBox = await pInitFilterBox(
		sourceFilter,
		crFilter,
		typeFilter,
		tagFilter,
		environmentFilter,
		defenceFilter,
		conditionImmuneFilter,
		traitFilter,
		actionReactionFilter,
		miscFilter,
		sizeFilter,
		speedFilter,
		alignmentFilter,
		saveFilter,
		skillFilter,
		senseFilter,
		languageFilter,
		acFilter,
		averageHpFilter,
		abilityScoreFilter
	);
	await ExcludeUtil.pInitialise();
	SortUtil.initHandleFilterButtonClicks();
	encounterBuilder.initUi();
	pLoadMeta()
		.then(pLoadFluffIndex)
		.then(multisourceLoad.bind(null, JSON_DIR, JSON_LIST_NAME, pPageInit, addMonsters, pPostLoad))
		.then(() => {
			if (History.lastLoadedId == null) History._freshLoad();
			ExcludeUtil.checkShowAllExcluded(monsters, $(`#pagecontent`));
			encounterBuilder.initState();
		});
};

let list;
let printBookView;
const sourceFilter = getSourceFilter();
const crFilter = new RangeFilter({header: "CR", labels: true});
const sizeFilter = new Filter({
	header: "Size",
	items: [
		SZ_TINY,
		SZ_SMALL,
		SZ_MEDIUM,
		SZ_LARGE,
		SZ_HUGE,
		SZ_GARGANTUAN,
		SZ_VARIES
	],
	displayFn: Parser.sizeAbvToFull
});
const speedFilter = new Filter({header: "Speed", items: ["walk", "burrow", "climb", "fly", "hover", "swim"], displayFn: StrUtil.uppercaseFirst});
const strengthFilter = new RangeFilter({header: "Strength", min: 1, max: 30});
const dexterityFilter = new RangeFilter({header: "Dexterity", min: 1, max: 30});
const constitutionFilter = new RangeFilter({header: "Constitution", min: 1, max: 30});
const intelligenceFilter = new RangeFilter({header: "Intelligence", min: 1, max: 30});
const wisdomFilter = new RangeFilter({header: "Wisdom", min: 1, max: 30});
const charismaFilter = new RangeFilter({header: "Charisma", min: 1, max: 30});
const abilityScoreFilter = new MultiFilter({name: "Ability Scores", compact: true, mode: "and"}, strengthFilter, dexterityFilter, constitutionFilter, intelligenceFilter, wisdomFilter, charismaFilter);
const acFilter = new RangeFilter({header: "Armor Class"});
const averageHpFilter = new RangeFilter({header: "Average Hit Points"});
const typeFilter = new Filter({
	header: "Type",
	items: [
		"aberration",
		"beast",
		"celestial",
		"construct",
		"dragon",
		"elemental",
		"fey",
		"fiend",
		"giant",
		"humanoid",
		"monstrosity",
		"ooze",
		"plant",
		"undead"
	],
	displayFn: StrUtil.uppercaseFirst
});
const tagFilter = new Filter({header: "Tag", displayFn: StrUtil.uppercaseFirst});
const alignmentFilter = new Filter({
	header: "Alignment",
	items: ["L", "NX", "C", "G", "NY", "E", "N", "U", "A"],
	displayFn: Parser.alignmentAbvToFull
});
const languageFilter = new Filter({
	header: "Languages",
	displayFn: (k) => languages[k],
	umbrellaItems: ["X", "XX"],
	umbrellaExcludes: ["CS"]
});
const senseFilter = new Filter({
	header: "Senses",
	displayFn: (it) => Parser.monSenseTagToFull(it).toTitleCase(),
	items: ["B", "D", "SD", "T", "U"]
});
const skillFilter = new Filter({
	header: "Skills",
	displayFn: (it) => it.toTitleCase(),
	items: ["acrobatics", "animal handling", "arcana", "athletics", "deception", "history", "insight", "intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight of hand", "stealth", "survival"]
});
const saveFilter = new Filter({
	header: "Saves",
	displayFn: Parser.attAbvToFull,
	items: [...Parser.ABIL_ABVS]
});
const environmentFilter = new Filter({
	header: "Environment",
	items: ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"],
	displayFn: StrUtil.uppercaseFirst
});
const DMG_TYPES = [
	"acid",
	"bludgeoning",
	"cold",
	"fire",
	"force",
	"lightning",
	"necrotic",
	"piercing",
	"poison",
	"psychic",
	"radiant",
	"slashing",
	"thunder"
];
const CONDS = [
	"blinded",
	"charmed",
	"deafened",
	"exhaustion",
	"frightened",
	"grappled",
	"incapacitated",
	"invisible",
	"paralyzed",
	"petrified",
	"poisoned",
	"prone",
	"restrained",
	"stunned",
	"unconscious",
	// not really a condition, but whatever
	"disease"
];
function dispVulnFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Vuln`;
}
const vulnerableFilter = new Filter({
	header: "Vulnerabilities",
	items: DMG_TYPES,
	displayFn: dispVulnFilter
});
function dispResFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Res`;
}
const resistFilter = new Filter({
	header: "Resistance",
	items: DMG_TYPES,
	displayFn: dispResFilter
});
function dispImmFilter (item) {
	return `${StrUtil.uppercaseFirst(item)} Imm`;
}
const immuneFilter = new Filter({
	header: "Immunity",
	items: DMG_TYPES,
	displayFn: dispImmFilter
});
const defenceFilter = new MultiFilter({name: "Damage", mode: "and"}, vulnerableFilter, resistFilter, immuneFilter);
const conditionImmuneFilter = new Filter({
	header: "Condition Immunity",
	items: CONDS,
	displayFn: StrUtil.uppercaseFirst
});
const traitFilter = new Filter({
	header: "Traits",
	items: [
		"Aggressive", "Ambusher", "Amorphous", "Amphibious", "Antimagic Susceptibility", "Brute", "Charge", "Damage Absorption", "Death Burst", "Devil's Sight", "False Appearance", "Fey Ancestry", "Flyby", "Hold Breath", "Illumination", "Immutable Form", "Incorporeal Movement", "Keen Senses", "Legendary Resistances", "Light Sensitivity", "Magic Resistance", "Magic Weapons", "Pack Tactics", "Pounce", "Rampage", "Reckless", "Regeneration", "Rejuvenation", "Shapechanger", "Siege Monster", "Sneak Attack", "Spider Climb", "Sunlight Sensitivity", "Turn Immunity", "Turn Resistance", "Undead Fortitude", "Water Breathing", "Web Sense", "Web Walker"
	]
});
const actionReactionFilter = new Filter({
	header: "Actions & Reactions",
	items: [
		"Frightful Presence", "Multiattack", "Parry", "Swallow", "Teleport", "Tentacles"
	]
});
const miscFilter = new Filter({
	header: "Miscellaneous",
	items: ["Familiar", "Lair Actions", "Legendary", "Named NPC", "Spellcaster", "Regional Effects", "Swarm"],
	displayFn: StrUtil.uppercaseFirst,
	deselFn: (it) => it === "Named NPC"
});

function pPageInit (loadedSources) {
	sourceFilter.items = Object.keys(loadedSources).map(src => new FilterItem({item: src, changeFn: loadSource(JSON_LIST_NAME, addMonsters)}));
	sourceFilter.items.sort(SortUtil.ascSort);

	list = ListUtil.search({
		valueNames: ["name", "source", "type", "cr", "group", "alias", "uniqueid"],
		listClass: "monsters",
		sortFunction: sortMonsters
	});
	list.on("updated", () => {
		filterBox.setCount(list.visibleItems.length, list.items.length);
	});

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	// sorting headers
	$("#filtertools").find("button.sort").on(EVNT_CLICK, function () {
		const $this = $(this);
		let direction = $this.data("sortby") === "desc" ? "asc" : "desc";

		$this.data("sortby", direction);
		$this.find('span').addClass($this.data("sortby") === "desc" ? "caret" : "caret caret--reverse");
		list.sort($this.data("sort"), {order: $this.data("sortby"), sortFunction: sortMonsters});
	});

	const subList = ListUtil.initSublist({
		valueNames: ["name", "source", "type", "cr", "count", "id", "uid"],
		listClass: "submonsters",
		sortFunction: sortMonsters,
		onUpdate: onSublistChange,
		uidHandler: (mon, uid) => ScaleCreature.scale(mon, Number(uid.split("_").last())),
		uidUnpacker: (uid) => ({scaled: Number(uid.split("_").last()), uid})
	});
	const baseHandlerOptions = {shiftCount: 5};
	function addHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistAdd(History.lastLoadedId, true, 5, getScaledData());
				else ListUtil.pDoSublistAdd(History.lastLoadedId, true, 1, getScaledData());
			} else ListUtil._genericAddButtonHandler(evt, baseHandlerOptions);
		};
	}
	function subtractHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistSubtract(History.lastLoadedId, 5, getScaledData());
				else ListUtil.pDoSublistSubtract(History.lastLoadedId, 1, getScaledData());
			} else ListUtil._genericSubtractButtonHandler(evt, baseHandlerOptions);
		};
	}
	ListUtil.bindAddButton(addHandlerGenerator, baseHandlerOptions);
	ListUtil.bindSubtractButton(subtractHandlerGenerator, baseHandlerOptions);
	ListUtil.initGenericAddable();

	// print view
	printBookView = new BookModeView("bookview", $(`#btn-printbook`), "If you wish to view multiple creatures, please first make a list",
		($tbl) => {
			return new Promise(resolve => {
				const promises = ListUtil._genericPinKeyMapper();

				Promise.all(promises).then(toShow => {
					toShow.sort((a, b) => SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name));

					let numShown = 0;

					const stack = [];

					const renderCreature = (mon) => {
						stack.push(`<table class="printbook-bestiary-entry"><tbody>`);
						stack.push(EntryRenderer.monster.getCompactRenderedString(mon, renderer));
						if (mon.legendaryGroup) {
							const thisGroup = meta[mon.legendaryGroup];
							stack.push(EntryRenderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Lair Actions", "lairActions", 0));
							stack.push(EntryRenderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Regional Effects", "regionalEffects", 0));
						}
						stack.push(`</tbody></table>`);
					};

					stack.push(`<tr class="printbook-bestiary"><td>`);
					toShow.forEach(mon => renderCreature(mon));
					if (!toShow.length && History.lastLoadedId != null) {
						renderCreature(monsters[History.lastLoadedId]);
					}
					stack.push(`</td></tr>`);

					numShown += toShow.length;
					$tbl.append(stack.join(""));
					resolve(numShown);
				});
			});
		}, true
	);

	// proficiency bonus/dice toggle
	const profBonusDiceBtn = $("button#profbonusdice");
	profBonusDiceBtn.click(function () {
		if (window.PROF_DICE_MODE === PROF_MODE_DICE) {
			window.PROF_DICE_MODE = PROF_MODE_BONUS;
			this.innerHTML = "Use Proficiency Dice";
			$("#pagecontent").find(`span.render-roller, span.dc-roller`).each(function () {
				const $this = $(this);
				$this.attr("mode", "");
				$this.html($this.attr("data-roll-prof-bonus"));
			});
		} else {
			window.PROF_DICE_MODE = PROF_MODE_DICE;
			this.innerHTML = "Use Proficiency Bonus";
			$("#pagecontent").find(`span.render-roller, span.dc-roller`).each(function () {
				const $this = $(this);
				$this.attr("mode", "dice");
				$this.html($this.attr("data-roll-prof-dice"));
			});
		}
	});

	return Promise.resolve();
}

function calculateListEncounterXp (playerCount) {
	const data = ListUtil.sublist.items.map(it => {
		const mon = monsters[Number(it._values.id)];
		if (mon.cr) {
			return {
				cr: Parser.crToNumber($(it.elm).find(".cr").text()),
				count: Number($(it.elm).find(".count").text())
			}
		}
	}).filter(it => it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));

	return calculateEncounterXp(data, playerCount);
}

/**
 * @param data an array of {cr: n, count: m} objects
 * @param playerCount number of players in the party
 */
function calculateEncounterXp (data, playerCount = ECGEN_BASE_PLAYERS) {
	data = data.filter(it => it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));

	let baseXp = 0;
	let relevantCount = 0;
	if (!data.length) return {baseXp: 0, relevantCount: 0, adjustedXp: 0};

	// "When making this calculation, don't count any monsters whose challenge rating is significantly below the average
	// challenge rating of the other monsters in the group unless you think the weak monsters significantly contribute
	// to the difficulty of the encounter." -- DMG, p. 82
	const crCutoff = (() => {
		// no cutoff for CR 0-2
		if (data[0].cr <= 2) {
			return 0;
		} else {
			let totalCount = 0;
			const averageCr = data.map(it => {
				totalCount += it.count;
				return it.cr * it.count;
			}).reduce((a, b) => a + b, 0) / totalCount;
			// cutoff: creatures with less than two-thirds average CR
			return averageCr * 0.66;
		}
	})();

	data.forEach(it => {
		if (it.cr >= crCutoff) relevantCount += it.count;
		baseXp += Parser.crToXpNumber(Parser.numberToCr(it.cr)) * it.count;
	});

	const playerAdjustedXpMult = Parser.numMonstersToXpMult(relevantCount, playerCount);

	const adjustedXp = playerAdjustedXpMult * baseXp;
	return {baseXp, relevantCount, adjustedXp, meta: {crCutoff, playerCount, playerAdjustedXpMult}};
}

function onSublistChange () {
	const $totalCr = $(`#totalcr`);
	const xp = calculateListEncounterXp(encounterBuilder.lastPlayerCount);
	$totalCr.html(`${xp.baseXp.toLocaleString()} XP (<span class="help" title="Adjusted Encounter XP">Enc</span>: ${(xp.adjustedXp).toLocaleString()} XP)`);
	if (encounterBuilder.isActive()) encounterBuilder.updateDifficulty();
	else encounterBuilder.doSaveState();
}

function handleFilterChange () {
	const f = filterBox.getValues();
	list.filter(function (item) {
		const m = monsters[$(item.elm).attr(FLTR_ID)];
		return filterBox.toDisplay(
			f,
			m._fSources,
			m._pCr,
			m._pTypes.type,
			m._pTypes.tags,
			m.environment,
			[
				m._fVuln,
				m._fRes,
				m._fImm
			],
			m._fCondImm,
			m.traitTags,
			m.actionTags,
			m._fMisc,
			m.size,
			m._fSpeed,
			m._fAlign,
			m._fSave,
			m._fSkill,
			m.senseTags,
			m.languageTags,
			m._fAc,
			m._fHp,
			[
				m.str,
				m.dex,
				m.con,
				m.int,
				m.wis,
				m.cha
			]
		);
	});
	onFilterChangeMulti(monsters);
	encounterBuilder.resetCache();
}

let monsters = [];
let mI = 0;
const lastRendered = {mon: null, isScaled: false};
function getScaledData () {
	const last = lastRendered.mon;
	return {scaled: last._isScaledCr, uid: getUid(last.name, last.source, last._isScaledCr)};
}

function getUid (name, source, scaledCr) {
	return `${name}_${source}_${scaledCr}`.toLowerCase();
}

function _initParsed (mon) {
	mon._pTypes = Parser.monTypeToFullObj(mon.type); // store the parsed type
	mon._pCr = mon.cr === undefined ? "Unknown" : (mon.cr.cr || mon.cr);
}

const _NEUT_ALIGNS = ["NX", "NY"];
function addMonsters (data) {
	if (!data || !data.length) return;

	monsters = monsters.concat(data);

	const table = $("ul.monsters");
	let textStack = "";
	// build the table
	for (; mI < monsters.length; mI++) {
		const mon = monsters[mI];
		EntryRenderer.monster.mergeCopy(monsters, mon);
		if (ExcludeUtil.isExcluded(mon.name, "monster", mon.source)) continue;
		_initParsed(mon);
		mon._fSpeed = Object.keys(mon.speed).filter(k => mon.speed[k]);
		if (mon.speed.canHover) mon._fSpeed.push("hover");
		mon._fAc = mon.ac.map(it => it.ac || it);
		mon._fHp = mon.hp.average;
		const tempAlign = typeof mon.alignment[0] === "object"
			? Array.prototype.concat.apply([], mon.alignment.map(a => a.alignment))
			: [...mon.alignment];
		if (tempAlign.includes("N") && !tempAlign.includes("G") && !tempAlign.includes("E")) tempAlign.push("NY");
		else if (tempAlign.includes("N") && !tempAlign.includes("L") && !tempAlign.includes("C")) tempAlign.push("NX");
		else if (tempAlign.length === 1 && tempAlign.includes("N")) Array.prototype.push.apply(tempAlign, _NEUT_ALIGNS);
		mon._fAlign = tempAlign;
		mon._fVuln = mon.vulnerable ? getAllImmRest(mon.vulnerable, "vulnerable") : [];
		mon._fRes = mon.resist ? getAllImmRest(mon.resist, "resist") : [];
		mon._fImm = mon.immune ? getAllImmRest(mon.immune, "immune") : [];
		mon._fCondImm = mon.conditionImmune ? getAllImmRest(mon.conditionImmune, "conditionImmune") : [];
		mon._fSave = mon.save ? Object.keys(mon.save) : [];
		mon._fSkill = mon.skill ? Object.keys(mon.skill) : [];
		mon._fSources = ListUtil.getCompleteSources(mon);

		const abvSource = Parser.sourceJsonToAbv(mon.source);

		textStack +=
			`<li class="row" ${FLTR_ID}="${mI}" onclick="ListUtil.toggleSelected(event, this)" oncontextmenu="ListUtil.openContextMenu(event, this)">
				<a id=${mI} href="#${UrlUtil.autoEncodeHash(mon)}" title="${mon.name}">
					${EncounterBuilder.getButtons(mI)}
					<span class="ecgen__name name col-4-2">${mon.name}</span>
					<span title="${Parser.sourceJsonToFull(mon.source)}${EntryRenderer.utils.getSourceSubText(mon)}" class="col-2 source text-align-center ${Parser.sourceJsonToColor(mon.source)}">${abvSource}</span>
					<span class="type col-4-1">${mon._pTypes.asText.uppercaseFirst()}</span>
					<span class="col-1-7 text-align-center cr">${mon._pCr}</span>
					${mon.group ? `<span class="group hidden">${mon.group}</span>` : ""}
					<span class="alias hidden">${(mon.alias || []).map(it => `"${it}"`).join(",")}</span>
					
					<span class="uniqueid hidden">${mon.uniqueId ? mon.uniqueId : mI}</span>
				</a>
			</li>`;

		// populate filters
		sourceFilter.addIfAbsent(mon._fSources);
		crFilter.addIfAbsent(mon._pCr);
		strengthFilter.addIfAbsent(mon.str);
		dexterityFilter.addIfAbsent(mon.dex);
		constitutionFilter.addIfAbsent(mon.con);
		intelligenceFilter.addIfAbsent(mon.int);
		wisdomFilter.addIfAbsent(mon.wis);
		charismaFilter.addIfAbsent(mon.cha);
		mon.ac.forEach(it => acFilter.addIfAbsent(it.ac || it));
		if (mon.hp.average) averageHpFilter.addIfAbsent(mon.hp.average);
		mon._pTypes.tags.forEach(t => tagFilter.addIfAbsent(t));
		mon._fMisc = mon.legendary || mon.legendaryGroup ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
		if (mon.spellcasting) {
			mon._fMisc.push("Spellcaster");
			mon.spellcasting.forEach(sc => {
				if (sc.ability) {
					const scAbility = `${_MISC_FILTER_SPELLCASTER}${Parser.attAbvToFull(sc.ability)}`;
					mon._fMisc.push(scAbility);
					miscFilter.addIfAbsent(scAbility);
				}
			});
		}
		if (mon.isNPC) mon._fMisc.push("Named NPC");
		if (mon.legendaryGroup && meta[mon.legendaryGroup]) {
			if (meta[mon.legendaryGroup].lairActions) mon._fMisc.push("Lair Actions");
			if (meta[mon.legendaryGroup].regionalEffects) mon._fMisc.push("Regional Effects");
		}
		traitFilter.addIfAbsent(mon.traitTags);
		actionReactionFilter.addIfAbsent(mon.actionTags);
	}
	const lastSearch = ListUtil.getSearchTermAndReset(list);
	table.append(textStack);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);
	crFilter.items.sort(SortUtil.ascSortCr);
	typeFilter.items.sort(SortUtil.ascSort);
	tagFilter.items.sort(SortUtil.ascSort);
	miscFilter.items.sort(ascSortMiscFilter);

	list.reIndex();
	if (lastSearch) list.search(lastSearch);
	list.sort("name");
	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: monsters,
		getSublistRow: pGetSublistItem,
		primaryLists: [list]
	});

	function popoutHandlerGenerator (toList, $btnPop, popoutCodeId) {
		return (evt) => {
			if (evt.shiftKey) {
				EntryRenderer.hover.handlePopoutCode(evt, toList, $btnPop, popoutCodeId);
			} else {
				if (lastRendered.mon != null && lastRendered.isScaled) EntryRenderer.hover.doPopoutPreloaded($btnPop, lastRendered.mon, evt.clientX);
				else if (History.lastLoadedId !== null) EntryRenderer.hover.doPopout($btnPop, toList, History.lastLoadedId, evt.clientX);
			}
		};
	}

	EntryRenderer.hover.bindPopoutButton(monsters, popoutHandlerGenerator);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton(sublistFuncPreload);

	$(`body`).on("click", ".btn-name-pronounce", function () {
		const audio = $(this).find(`.name-pronounce`)[0];
		audio.currentTime = 0;
		audio.play();
	});
}

function sublistFuncPreload (json, funcOnload) {
	const loaded = Object.keys(loadedSources).filter(it => loadedSources[it].loaded);
	const lowerSources = json.sources.map(it => it.toLowerCase());
	const toLoad = Object.keys(loadedSources).filter(it => !loaded.includes(it)).filter(it => lowerSources.includes(it.toLowerCase()));
	const loadTotal = toLoad.length;
	if (loadTotal) {
		let loadCount = 0;
		toLoad.forEach(src => {
			loadSource(JSON_LIST_NAME, (monsters) => {
				addMonsters(monsters);
				if (++loadCount === loadTotal) {
					funcOnload();
				}
			})(src, "yes");
		});
	} else {
		funcOnload();
	}
}

function pGetSublistItem (mon, pinId, addCount, data = {}) {
	return new Promise(resolve => {
		const pMon = data.scaled ? ScaleCreature.scale(mon, data.scaled) : Promise.resolve(mon);

		pMon.then(mon => {
			const subHash = data.scaled ? `${HASH_PART_SEP}${MON_HASH_SCALED}${HASH_SUB_KV_SEP}${data.scaled}` : "";
			_initParsed(mon);

			resolve(`
				<li class="row" ${FLTR_ID}="${pinId}" oncontextmenu="ListUtil.openSubContextMenu(event, this)">
					<a href="#${UrlUtil.autoEncodeHash(mon)}${subHash}" title="${mon._displayName || mon.name}" draggable="false">
						${EncounterBuilder.getButtons(pinId, true)}
						<span class="name ecgen__name--sub col-5">${mon._displayName || mon.name}</span>
						<span class="type col-3 ecgen__hidden">${mon._pTypes.asText.uppercaseFirst()}</span>
						
						<span class="type col-1-5 help--hover ecgen__visible" onmouseover="EncounterBuilder.doStatblockMouseOver(event, this, ${pinId}, ${mon._isScaledCr})">Statblock</span>
						<span class="type col-1-5 ecgen__visible help--hover" ${EncounterBuilder.getTokenMouseOver(mon)}>Token</span>
						
						<span class="cr col-2 text-align-center ${mon._pCr !== "Unknown" ? "ecgen__hidden" : ""}">${mon._pCr}</span>
						${mon._pCr !== "Unknown" ? `
							<span class="col-2 text-align-center ecgen__visible">
								<input value="${mon._pCr}" onchange="encounterBuilder.doCrChange(this, ${pinId}, ${mon._isScaledCr})" class="ecgen__cr_input">
							</span>
						` : ""}
						
						<span class="count col-2 text-align-center">${addCount || 1}</span>
						<span class="id hidden">${data.uid ? "" : pinId}</span>
						<span class="uid hidden">${data.uid || ""}</span>
					</a>
				</li>
			`);
		});
	});
}

// sorting for form filtering
function sortMonsters (a, b, o) {
	function getPrimary () {
		if (o.valueName === "count") return SortUtil.ascSort(Number(a.values().count), Number(b.values().count));
		a = monsters[a.elm.getAttribute(FLTR_ID)];
		b = monsters[b.elm.getAttribute(FLTR_ID)];
		switch (o.valueName) {
			case "name":
				return SortUtil.ascSort(a.name, b.name);
			case "type":
				return SortUtil.ascSort(a._pTypes.asText, b._pTypes.asText);
			case "source":
				return SortUtil.ascSort(a.source, b.source);
			case "cr":
				return SortUtil.ascSortCr(a._pCr, b._pCr);
		}
	}
	return getPrimary() || SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source);
}

let profBtn = null;
// load selected monster stat block
function loadhash (id) {
	const mon = monsters[id];

	renderStatblock(mon);

	loadsub([]);
	ListUtil.updateSelected();
}

function renderStatblock (mon, isScaled) {
	lastRendered.mon = mon;
	lastRendered.isScaled = isScaled;
	renderer.setFirstSection(true);

	const $content = $("#pagecontent").empty();
	const $wrpBtnProf = $(`#wrp-profbonusdice`);

	if (profBtn !== null) {
		$wrpBtnProf.append(profBtn);
		profBtn = null;
	}

	function buildStatsTab () {
		$content.append(`
		${EntryRenderer.utils.getBorderTr()}
		<tr><th class="name mon__name--token" colspan="6">Name <span class="source" title="Source book">SRC</span></th></tr>
		<tr><td id="sizetypealignment" colspan="6"><span id="size">${Parser.sizeAbvToFull(mon.size)}</span> <span id="type">type</span>, <span id="alignment">alignment</span></td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr><td colspan="6"><strong>Armor Class</strong> <span id="ac">## (source)</span></td></tr>
		<tr><td colspan="6"><div class="mon__wrp_hp"><strong>Hit Points</strong> <span id="hp">hp</span></div></td></tr>
		<tr><td colspan="6"><strong>Speed</strong> <span id="speed">30 ft.</span></td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr id="abilitynames"><th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th></tr>
		<tr id="abilityscores">
			<td id="str">${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.str)}|${mon.str} (${Parser.getAbilityModifier(mon.str)})|Strength}`)}</td>
			<td id="dex">${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.dex)}|${mon.dex} (${Parser.getAbilityModifier(mon.dex)})|Dexterity}`)}</td>
			<td id="con">${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.con)}|${mon.con} (${Parser.getAbilityModifier(mon.con)})|Constitution}`)}</td>
			<td id="int">${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.int)}|${mon.int} (${Parser.getAbilityModifier(mon.int)})|Intelligence}`)}</td>
			<td id="wis">${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.wis)}|${mon.wis} (${Parser.getAbilityModifier(mon.wis)})|Wisdom}`)}</td>
			<td id="cha">${EntryRenderer.getDefaultRenderer().renderEntry(`{@d20 ${Parser.getAbilityModifier(mon.cha)}|${mon.cha} (${Parser.getAbilityModifier(mon.cha)})|Charisma}`)}</td>
		</tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr><td colspan="6"><strong>Saving Throws</strong> <span id="saves">Str +0</span></td></tr>
		<tr><td colspan="6"><strong>Skills</strong> <span id="skills">Perception +0</span></td></tr>
		<tr><td colspan="6"><strong>Damage Vulnerabilities</strong> <span id="dmgvuln">fire</span></td></tr>
		<tr><td colspan="6"><strong>Damage Resistances</strong> <span id="dmgres">cold</span></td></tr>
		<tr><td colspan="6"><strong>Damage Immunities</strong> <span id="dmgimm">lightning</span></td></tr>
		<tr><td colspan="6"><strong>Condition Immunities</strong> <span id="conimm">exhaustion</span></td></tr>
		<tr><td colspan="6"><strong>Senses</strong> <span id="senses">darkvision 30 ft.</span> passive Perception <span id="pp">10</span></td></tr>
		<tr><td colspan="6"><strong>Languages</strong> <span id="languages">Common</span></td></tr>
		<tr><td colspan="6" style="position: relative;"><strong>Challenge</strong>
			<span id="cr">1 (450 XP)</span>
			<button id="btn-scale-cr" title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-signal"></span>
			</button>
			${isScaled ? `<button id="btn-reset-cr" title="Reset CR Scaling" class="mon__btn-reset-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-refresh"></span>
			</button>` : ""}
		</td></tr>
		<tr id="traits"><td class="divider" colspan="6"><div></div></td></tr>
		<tr class="trait"><td colspan="6"><span class="name">Trait.</span> <span class="content">Content.</span></td></tr>
		<tr id="actions"><td colspan="6"><span>Actions</span></td></tr>
		<tr class="action"><td colspan="6"><span class="name">Action.</span> <span class="content">Content.</span></td></tr>
		<tr id="reactions"><td colspan="6"><span>Reactions</span></td></tr>
		<tr class="reaction"><td colspan="6"><span class="name">Reaction.</span> <span class="content">Content.</span></td></tr>
		<tr id="legendaries"><td colspan="6"><span>Legendary Actions</span></td></tr>
		<tr class="legendary"><td colspan="6"><span class="name">Action.</span> <span class="content">Content.</span></td></tr>
		<tr id="lairactions"><td colspan="6"><span>Lair Actions</span></td></tr>
		<tr class="lairaction"><td colspan="6"><span class="name">Action.</span> <span class="content">Content.</span></td></tr>
		<tr id="regionaleffects"><td colspan="6"><span>Regional Effects</span></td></tr>
		<tr class="regionaleffect"><td colspan="6"><span class="name">Effect.</span> <span class="content">Content.</span></td></tr>
		<tr id="variants"></tr>
		<tr id="source"></tr>
		${EntryRenderer.utils.getBorderTr()}
		`);

		let renderStack = [];
		const displayName = mon._displayName || mon.name;
		const source = Parser.sourceJsonToAbv(mon.source);
		const sourceFull = Parser.sourceJsonToFull(mon.source);
		const type = mon._pTypes.asText;

		function getPronunciationButton () {
			return `<button class="btn btn-xs btn-default btn-name-pronounce">
				<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
				<audio class="name-pronounce">
				   <source src="${mon.soundClip}" type="audio/mpeg">
				   <source src="audio/bestiary/${basename(mon.soundClip, '/')}" type="audio/mpeg">
				</audio>
			</button>`;
		}

		const $floatToken = $(`#float-token`).empty();
		if (mon.tokenURL || !mon.uniqueId) {
			const imgLink = EntryRenderer.monster.getTokenUrl(mon);
			$floatToken.append(`
				<a href="${imgLink}" target="_blank">
					<img src="${imgLink}" id="token_image" class="token" onerror="imgError(this)" alt="${mon.name}">
				</a>`
			);
		} else imgError();

		$content.find(".mon__name--token").html(
			`<span class="stats-name copyable" onclick="EntryRenderer.utils._handleNameClick(this, '${mon.source.escapeQuotes()}')">${displayName}</span>
			${mon.soundClip ? getPronunciationButton() : ""}
			<span class="stats-source ${Parser.sourceJsonToColor(mon.source)}" title="${sourceFull}${EntryRenderer.utils.getSourceSubText(mon)}">${source}</span>`
		);

		// TODO most of this could be rolled into the string template above
		$content.find("td span#type").html(type);

		$content.find("td span#alignment").html(Parser.alignmentListToFull(mon.alignment).toLowerCase());

		$content.find("td span#ac").html(Parser.acToFull(mon.ac));

		$content.find("td span#hp").html(EntryRenderer.monster.getRenderedHp(mon.hp));

		$content.find("td span#speed").html(Parser.getSpeedString(mon));

		var saves = mon.save;
		if (saves) {
			const parsedSaves = Object.keys(saves).map(it => EntryRenderer.monster.getSave(renderer, it, mon.save[it])).join(", ");
			$content.find("td span#saves").parent().show();
			$content.find("td span#saves").html(parsedSaves);
		} else {
			$content.find("td span#saves").parent().hide();
		}

		var skills = mon.skill;
		if (skills) {
			$content.find("td span#skills").parent().show();
			$content.find("td span#skills").html(EntryRenderer.monster.getSkillsString(renderer, mon));
		} else {
			$content.find("td span#skills").parent().hide();
		}

		var dmgvuln = mon.vulnerable;
		if (dmgvuln) {
			$content.find("td span#dmgvuln").parent().show();
			$content.find("td span#dmgvuln").html(Parser.monImmResToFull(dmgvuln));
		} else {
			$content.find("td span#dmgvuln").parent().hide();
		}

		var dmgres = mon.resist;
		if (dmgres) {
			$content.find("td span#dmgres").parent().show();
			$content.find("td span#dmgres").html(Parser.monImmResToFull(dmgres));
		} else {
			$content.find("td span#dmgres").parent().hide();
		}

		var dmgimm = mon.immune;
		if (dmgimm) {
			$content.find("td span#dmgimm").parent().show();
			$content.find("td span#dmgimm").html(Parser.monImmResToFull(dmgimm));
		} else {
			$content.find("td span#dmgimm").parent().hide();
		}

		var conimm = mon.conditionImmune;
		if (conimm) {
			$content.find("td span#conimm").parent().show();
			$content.find("td span#conimm").html(Parser.monCondImmToFull(conimm));
		} else {
			$content.find("td span#conimm").parent().hide();
		}

		var senses = mon.senses;
		if (senses) {
			$content.find("td span#senses").html(senses + ", ");
		} else {
			$content.find("td span#senses").html("");
		}

		$content.find("td span#pp").html(mon.passive);

		var languages = mon.languages;
		if (languages) {
			$content.find("td span#languages").html(languages);
		} else {
			$content.find("td span#languages").html("\u2014");
		}

		$content.find("td span#cr").html(Parser.monCrToFull(mon.cr));

		const $btnScaleCr = $content.find("#btn-scale-cr");
		if (Parser.crToNumber(mon.cr.cr || mon.cr) === 100) $btnScaleCr.hide();
		else $btnScaleCr.show();
		$btnScaleCr.off("click").click((evt) => {
			evt.stopPropagation();
			const mon = monsters[History.lastLoadedId];
			const lastCr = lastRendered.mon ? lastRendered.mon.cr.cr || lastRendered.mon.cr : mon.cr.cr || mon.cr;
			EntryRenderer.monster.getCrScaleTarget($btnScaleCr, lastCr, (targetCr) => {
				if (targetCr === Parser.crToNumber(mon.cr)) renderStatblock(mon);
				else History.setSubhash(MON_HASH_SCALED, targetCr);
			});
		});

		const $btnResetScaleCr = $content.find("#btn-reset-cr");
		$btnResetScaleCr.click(() => History.setSubhash(MON_HASH_SCALED, null));

		$content.find("tr.trait").remove();

		let trait = EntryRenderer.monster.getOrderedTraits(mon, renderer);
		if (trait) renderSection("trait", "trait", trait, 1);

		const action = mon.action;
		$content.find("tr#actions").hide();
		$content.find("tr.action").remove();

		if (action) renderSection("action", "action", action, 1);

		const reaction = mon.reaction;
		$content.find("tr#reactions").hide();
		$content.find("tr.reaction").remove();

		if (reaction) renderSection("reaction", "reaction", reaction, 1);

		const dragonVariant = EntryRenderer.monster.getDragonCasterVariant(renderer, mon);
		const variants = mon.variant;
		const variantSect = $content.find(`#variants`);
		if (!variants && !dragonVariant) variantSect.hide();
		else {
			const rStack = [];
			(variants || []).forEach(v => renderer.recursiveEntryRender(v, rStack));
			if (dragonVariant) rStack.push(dragonVariant);
			variantSect.html(`<td colspan=6>${rStack.join("")}</td>`);
			variantSect.show();
		}

		const srcCpy = {
			source: mon.source,
			sourceSub: mon.sourceSub,
			page: mon.page,
			otherSources: mon.otherSources,
			additionalSources: mon.additionalSources,
			externalSources: mon.externalSources
		};
		const additional = mon.additionalSources ? JSON.parse(JSON.stringify(mon.additionalSources)) : [];
		if (mon.variant && mon.variant.length > 1) {
			mon.variant.forEach(v => {
				if (v.variantSource) {
					additional.push({
						source: v.variantSource.source,
						page: v.variantSource.page
					})
				}
			})
		}
		srcCpy.additionalSources = additional;
		const $trSource = $content.find(`#source`);
		const $tdSource = $(EntryRenderer.utils.getPageTr(srcCpy));
		$trSource.append($tdSource);
		if (mon.environment && mon.environment.length) {
			$tdSource.attr("colspan", 4);
			$trSource.append(`<td colspan="2" class="text-align-right mr-2"><i>Environment: ${mon.environment.sort(SortUtil.ascSortLower).map(it => it.toTitleCase()).join(", ")}</i></td>`)
		}

		const legendary = mon.legendary;
		$content.find("tr#legendaries").hide();
		$content.find("tr.legendary").remove();
		if (legendary) {
			renderSection("legendary", "legendary", legendary, 1);
			$content.find("tr#legendaries").after(`<tr class='legendary'><td colspan='6' class='legendary'><span class='name'></span> <span>${EntryRenderer.monster.getLegendaryActionIntro(mon)}</span></td></tr>`);
		}

		const legendaryGroup = mon.legendaryGroup;
		$content.find("tr.lairaction").remove();
		$content.find("tr#lairactions").hide();
		$content.find("tr.regionaleffect").remove();
		$content.find("tr#regionaleffects").hide();
		if (legendaryGroup) {
			const thisGroup = meta[legendaryGroup];
			if (thisGroup.lairActions) renderSection("lairaction", "legendary", thisGroup.lairActions, -1);
			if (thisGroup.regionalEffects) renderSection("regionaleffect", "legendary", thisGroup.regionalEffects, -1);
		}

		function renderSection (sectionTrClass, sectionTdClass, sectionEntries, sectionLevel) {
			let pluralSectionTrClass = sectionTrClass === `legendary` ? `legendaries` : `${sectionTrClass}s`;
			$content.find(`tr#${pluralSectionTrClass}`).show();
			renderStack = [];
			if (sectionTrClass === "legendary") {
				const cpy = MiscUtil.copy(sectionEntries).map(it => {
					if (it.name && it.entries) {
						it.name = `${it.name}.`;
						it.type = it.type || "item";
					}
					return it;
				});
				const toRender = {type: "list", style: "list-hang-notitle", items: cpy};
				renderer.recursiveEntryRender(toRender, renderStack, sectionLevel);
			} else {
				sectionEntries.forEach(e => {
					if (e.rendered) renderStack.push(e.rendered);
					else renderer.recursiveEntryRender(e, renderStack, sectionLevel + 1);
				});
			}
			$content.find(`tr#${pluralSectionTrClass}`).after(`<tr class='${sectionTrClass}'><td colspan='6' class='${sectionTdClass}'>${renderStack.join("")}</td></tr>`);
		}

		// add click links for rollables
		$content.find("#abilityscores td").each(function () {
			$(this).wrapInner(`<span class="roller" data-roll="1d20${$(this).children(".mod").html()}" title="${Parser.attAbvToFull($(this).prop("id"))}"></span>`);
		});

		const isProfDiceMode = PROF_DICE_MODE === PROF_MODE_DICE;
		function _addSpacesToDiceExp (exp) {
			return exp.replace(/([^0-9d])/gi, " $1 ").replace(/\s+/g, " ");
		}
		// inline rollers
		// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// add proficiency dice stuff for attack rolls, since those _generally_ have proficiency
		// this is not 100% accurate; for example, ghouls don't get their prof bonus on bite attacks
		// fixing it would probably involve machine learning though; we need an AI to figure it out on-the-fly
		// (Siri integration forthcoming)
		$content.find(".render-roller")
			.filter(function () {
				return $(this).text().match(/^([-+])?\d+$/);
			})
			.each(function () {
				const bonus = Number($(this).text());
				const expectedPB = Parser.crToPb(mon.cr);

				// skills and saves can have expertise
				let expert = 1;
				let pB = expectedPB;
				let fromAbility;
				let ability;
				if ($(this).parent().attr("data-mon-save")) {
					const title = $(this).attr("title");
					ability = title.split(" ")[0].trim().toLowerCase().substring(0, 3);
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				} else if ($(this).parent().attr("data-mon-skill")) {
					const title = $(this).attr("title");
					ability = Parser.skillToAbilityAbv(title.toLowerCase().trim());
					fromAbility = Parser.getAbilityModNumber(mon[ability]);
					pB = bonus - fromAbility;
					expert = (pB === expectedPB * 2) ? 2 : 1;
				}
				const withoutPB = bonus - pB;
				try {
					// if we have proficiency bonus, convert the roller
					if (expectedPB > 0) {
						const profDiceString = _addSpacesToDiceExp(`${expert}d${pB * (3 - expert)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

						$(this).attr("data-roll-prof-bonus", $(this).text());
						$(this).attr("data-roll-prof-dice", profDiceString);

						// here be (chromatic) dragons
						const cached = $(this).attr("onclick");
						const nu = `
							(function(it) {
								if (PROF_DICE_MODE === PROF_MODE_DICE) {
									EntryRenderer.dice.rollerClick(event, it, '{"type":"dice","rollable":true,"toRoll":"1d20 + ${profDiceString}"}'${$(this).prop("title") ? `, '${$(this).prop("title")}'` : ""})
								} else {
									${cached.replace(/this/g, "it")}
								}
							})(this)`;

						$(this).attr("onclick", nu);

						if (isProfDiceMode) {
							$(this).html(profDiceString);
						}
					}
				} catch (e) {
					setTimeout(() => {
						throw new Error(`Invalid save or skill roller! Bonus was ${bonus >= 0 ? "+" : ""}${bonus}, but creature's PB was +${expectedPB} and relevant ability score (${ability}) was ${fromAbility >= 0 ? "+" : ""}${fromAbility} (should have been ${expectedPB + fromAbility >= 0 ? "+" : ""}${expectedPB + fromAbility} total)`);
					}, 0);
				}
			});

		$content.find("p").each(function () {
			$(this).html($(this).html().replace(/DC\s*(\d+)/g, function (match, capture) {
				const dc = Number(capture);

				const expectedPB = Parser.crToPb(mon.cr);

				if (expectedPB > 0) {
					const withoutPB = dc - expectedPB;
					const profDiceString = _addSpacesToDiceExp(`1d${(expectedPB * 2)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

					return `DC <span class="dc-roller" mode="${isProfDiceMode ? "dice" : ""}" onmousedown="window.PROF_DICE_MODE === window.PROF_MODE_DICE &&  event.preventDefault()" onclick="dcRollerClick(event, this, '${profDiceString}')" data-roll-prof-bonus="${capture}" data-roll-prof-dice="${profDiceString}">${isProfDiceMode ? profDiceString : capture}</span>`;
				} else {
					return match; // if there was no proficiency bonus to work with, fall back on this
				}
			}));
		});
	}

	function buildFluffTab (isImageTab) {
		return EntryRenderer.utils.buildFluffTab(
			isImageTab,
			$content,
			mon,
			EntryRenderer.monster.getFluff.bind(null, mon, meta),
			`${JSON_DIR}${ixFluff[mon.source]}`,
			(source) => ixFluff[mon.source]
		);
	}

	// reset tabs
	const statTab = EntryRenderer.utils.tabButton(
		"Statblock",
		() => {
			$wrpBtnProf.append(profBtn);
			$(`#float-token`).show();
		},
		buildStatsTab
	);
	const infoTab = EntryRenderer.utils.tabButton(
		"Info",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		buildFluffTab
	);
	const picTab = EntryRenderer.utils.tabButton(
		"Images",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		() => buildFluffTab(true)
	);
	EntryRenderer.utils.bindTabButtons(statTab, infoTab, picTab);
}

function handleUnknownHash (link, sub) {
	const src = Object.keys(loadedSources).find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		loadSource(JSON_LIST_NAME, (monsters) => {
			addMonsters(monsters);
			History.hashChange();
		})(src, "yes");
	}
}

function dcRollerClick (event, ele, exp) {
	if (window.PROF_DICE_MODE === PROF_MODE_BONUS) return;
	const it = {
		type: "dice",
		rollable: true,
		toRoll: exp
	};
	EntryRenderer.dice.rollerClick(event, ele, JSON.stringify(it));
}

function loadsub (sub) {
	filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub, sublistFuncPreload);

	printBookView.handleSub(sub);

	const scaledHash = sub.find(it => it.startsWith(MON_HASH_SCALED));
	if (scaledHash) {
		const scaleTo = Number(UrlUtil.unpackSubHash(scaledHash)[MON_HASH_SCALED][0]);
		const scaleToStr = Parser.numberToCr(scaleTo);
		const mon = monsters[History.lastLoadedId];
		if (Parser.isValidCr(scaleToStr) && scaleTo !== Parser.crToNumber(lastRendered.mon.cr)) {
			ScaleCreature.scale(mon, scaleTo).then(scaled => renderStatblock(scaled, true));
		}
	}

	encounterBuilder.handleSubhash(sub);
}

class EncounterBuilder {
	constructor () {
		this.stateInit = false;
		this._cache = null;
		this._lastPlayerCount = null;
	}

	initUi () {
		// bind an event handler to prevent sublist link clicks when the encounter generator is active
		$(document).on("click", ".ecgen_active #sublistcontainer .list a", (evt) => {
			if (!evt.ctrlKey && !evt.shiftKey) {
				evt.preventDefault();
			}
		});

		$(`#btn-encounterbuild`).click(() => History.setSubhash(EncounterBuilder.HASH_KEY, true));
		$(`#btn-encounterstatblock`).click(() => History.setSubhash(EncounterBuilder.HASH_KEY, null));

		const $btnGen = $(`.ecgen_rng`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter($btnGen.data("mode"))
		});

		$(`.ecgen_rng_easy`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("easy");
			$btnGen.data("mode", "easy").text("Random Easy");
		});
		$(`.ecgen_rng_medium`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("medium");
			$btnGen.data("mode", "medium").text("Random Medium");
		});
		$(`.ecgen_rng_hard`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("hard");
			$btnGen.data("mode", "hard").text("Random Hard");
		});
		$(`.ecgen_rng_deadly`).click((evt) => {
			evt.preventDefault();
			this.pDoGenerateEncounter("deadly");
			$btnGen.data("mode", "deadly").text("Random Deadly");
		});

		$(`.ecgen__add_players`).click(() => this.addPlayerRow(false));

		const $btnSvUrl = $(`.ecgen__sv_url`).click(() => {
			const encounterPart = UrlUtil.packSubHash(EncounterUtil.SUB_HASH_PREFIX, [JSON.stringify(this.getSaveableState())], true);
			const parts = [location.href, encounterPart];
			copyText(parts.join(HASH_PART_SEP));
			JqueryUtil.showCopiedEffect($btnSvUrl);
		});
		$(`.ecgen__sv_file`).click(() => DataUtil.userDownload(`encounter`, this.getSaveableState()));
		$(`.ecgen__ld_file`).click(() => {
			DataUtil.userUpload((json) => {
				this.pDoLoadState(json);
			});
		});
		$(`.ecgen__reset`).click(() => confirm("Are you sure?") && encounterBuilder.pReset());
	}

	initState () {
		EncounterUtil.pGetSavedState().then(async savedState => {
			if (savedState) await this.pDoLoadState(savedState, true);
			else this.addInitialPlayerRows();
			this.stateInit = true;
		});
	}

	addInitialPlayerRows (first) {
		this.addPlayerRow(first, true, ECGEN_BASE_PLAYERS);
	}

	async pReset (doAddRows = true, playersOnly) {
		if (!playersOnly) ListUtil.pDoSublistRemoveAll();

		this.removeAllPlayerRows();
		if (doAddRows) this.addInitialPlayerRows();
	}

	async pDoLoadState (savedState, playersOnly) {
		await this.pReset(false, playersOnly);
		try {
			if (savedState.p.length) {
				savedState.p.forEach(({count, level}, i) => this.addPlayerRow(!i, false, count, level));
			} else this.addInitialPlayerRows(false);

			if (savedState.l && !playersOnly) {
				ListUtil.doJsonLoad(savedState.l, false, sublistFuncPreload);
			}
			this.updateDifficulty();
		} catch (e) {
			this.pReset();
		}
	}

	getSaveableState () {
		return {
			p: EncounterBuilder.getParty(),
			l: ListUtil._getExportableSublist()
		};
	}

	doSaveState () {
		if (this.stateInit) EncounterUtil.pDoSaveState(this.getSaveableState());
	}

	generateCache () {
		// create a map of {XP: [monster list]}
		if (this._cache == null) {
			this._cache = (() => {
				const out = {};
				list.visibleItems.map(it => monsters[Number(it.elm.getAttribute("filterid"))]).filter(m => !m.isNPC).forEach(m => {
					const mXp = Parser.crToXpNumber(m.cr.cr || m.cr);
					if (mXp) (out[mXp] = out[mXp] || []).push(m);
				});
				return out;
			})();
		}
	}

	resetCache () {
		this._cache = null;
	}

	async pDoGenerateEncounter (difficulty) {
		const TIERS = ["easy", "medium", "hard", "deadly", "yikes"];

		const xp = this.calculateXp();
		xp.party.yikes = xp.party.deadly * 1.1;

		const ixLow = TIERS.indexOf(difficulty);
		if (!~ixLow) throw new Error(`Unhandled difficulty level: "${difficulty}"`);
		const budget = xp.party[TIERS[ixLow + 1]] - 1;

		this.generateCache();

		const generateClosestEncounter = () => {
			const _xps = Object.keys(this._cache).map(it => Number(it)).sort(SortUtil.ascSort).reverse();
			/*
			Sorted array of:
			{
				cr: "1/2",
				xp: 50,
				crNum: 0.5
			}
			 */
			const _meta = Object.entries(Parser.XP_CHART_ALT).map(([cr, xp]) => ({cr, xp, crNum: Parser.crToNumber(cr)}))
				.sort((a, b) => SortUtil.ascSort(b.crNum, a.crNum));
			const getXps = (budget) => _xps.filter(it => it <= budget);

			const calcNextBudget = (encounter) => {
				const data = encounter.map(it => ({cr: Parser.crToNumber(it.mon.cr.cr || it.mon.cr), count: it.count}));
				if (!data.length) return budget;

				const curr = calculateEncounterXp(data, xp.party.count);
				const budgetRemaining = budget - curr.adjustedXp;

				const meta = _meta.filter(it => it.xp <= budgetRemaining);
				for (const m of meta) {
					if (m.crNum >= curr.meta.crCutoff) {
						const nextMult = Parser.numMonstersToXpMult(curr.relevantCount + 1, xp.party.count);
						return Math.floor((budget - (nextMult * curr.baseXp)) / nextMult);
					}
				}
				return budgetRemaining;
			};

			const addToEncounter = (encounter, xp) => {
				const existing = encounter.filter(it => it.xp === xp);
				if (existing.length && RollerUtil.roll(100) < 85) { // 85% chance to add another copy of an existing monster
					RollerUtil.rollOnArray(existing).count++;
				} else {
					const rolled = RollerUtil.rollOnArray(this._cache[xp]);
					// add to an existing group, if present
					const existing = encounter.find(it => it.mon.source === rolled.source && it.mon.name === rolled.name);
					if (existing) existing.count++;
					else {
						encounter.push({
							xp: xp,
							mon: rolled,
							count: 1
						});
					}
				}
			};

			let skipCount = 0;
			const doSkip = (xps, encounter, xp) => {
				// if there are existing entries at this XP, don't skip
				const existing = encounter.filter(it => it.xp === xp);
				if (existing.length) return false;

				// skip 70% of the time by default, less 13% chance per item skipped
				if (xps.length > 1) {
					const isSkip = RollerUtil.roll(100) < (70 - (13 * skipCount));
					if (isSkip) {
						skipCount++;
						const maxSkip = xps.length - 1;
						// flip coins; so long as we get heads, keep skipping
						for (let i = 0; i < maxSkip; ++i) {
							if (RollerUtil.roll(2) === 0) {
								return i;
							}
						}
						return maxSkip - 1;
					} else return 0;
				} else return false;
			};

			const doInitialSkip = (xps) => {
				// 50% of the time, skip the first 0-1/3rd of available CRs
				if (xps.length > 4 && RollerUtil.roll(2) === 1) {
					const skips = RollerUtil.roll(Math.ceil(xps.length / 3));
					return xps.slice(skips);
				} else return xps;
			};

			const doFind = (budget) => {
				const enc = [];
				const xps = doInitialSkip(getXps(budget));

				let nextBudget = budget;
				let skips = 0;
				let steps = 0;
				while (xps.length) {
					if (steps++ > 100) break;

					if (skips) {
						skips--;
						xps.shift();
						continue;
					}

					const xp = xps[0];

					if (xp > nextBudget) {
						xps.shift();
						continue;
					}

					skips = doSkip(xps, enc, xp);
					if (skips) {
						skips--;
						xps.shift();
						continue;
					}

					addToEncounter(enc, xp);

					nextBudget = calcNextBudget(enc);
				}

				return enc;
			};

			return doFind(budget);
		};

		const closestSolution = generateClosestEncounter();

		if (closestSolution) {
			const toLoad = {items: []};
			const sources = new Set();
			closestSolution.forEach(it => {
				toLoad.items.push({h: UrlUtil.autoEncodeHash(it.mon), c: String(it.count)});
				sources.add(it.mon.source);
			});
			toLoad.sources = [...sources];
			this._loadSublist(toLoad);
		} else {
			await ListUtil.pDoSublistRemoveAll();
			this.updateDifficulty();
		}
	}

	_loadSublist (toLoad) {
		ListUtil.doJsonLoad(toLoad, false, (json, funcOnload) => {
			sublistFuncPreload(json, () => {
				funcOnload();
				this.updateDifficulty();
			});
		});
	}

	addPlayerRow (first = true, doUpdate = true, count, level) {
		$(`.ecgen__wrp_add_players`).before(EncounterBuilder.getPlayerRow(first, count, level));
		if (doUpdate) this.updateDifficulty();
	}

	removeAllPlayerRows () {
		$(`.ecgen__player_group`).remove();
	}

	isActive () {
		return History.getSubHash(EncounterBuilder.HASH_KEY) === "true";
	}

	show () {
		$(`body`).addClass("ecgen_active");
		this.updateDifficulty();
	}

	hide () {
		$(`body`).removeClass("ecgen_active");
	}

	handleClick (evt, ix, add) {
		evt.stopPropagation();
		if (!evt.ctrlKey) evt.preventDefault();

		if (add) ListUtil.pDoSublistAdd(ix, true, evt.shiftKey ? 5 : 1, lastRendered.isScaled ? getScaledData() : undefined);
		else ListUtil.pDoSublistSubtract(ix, evt.shiftKey ? 5 : 1, lastRendered.isScaled ? getScaledData() : undefined);
	}

	handleShuffleClick (evt, ix) {
		evt.stopPropagation();
		if (!evt.ctrlKey) evt.preventDefault();

		const mon = monsters[ix];
		const xp = Parser.crToXpNumber(mon.cr.cr || mon.cr);
		if (!xp) return; // if Unknown/etc

		const curr = ListUtil._getExportableSublist();
		const hash = UrlUtil.autoEncodeHash(mon);
		const itemToSwitch = curr.items.find(it => it.h === hash);

		this.generateCache();
		const availMons = this._cache[xp];
		if (availMons.length !== 1) {
			// note that this process does not remove any old sources

			let reroll = mon;
			let rolledHash = hash;
			while (rolledHash === hash) {
				reroll = RollerUtil.rollOnArray(availMons);
				rolledHash = UrlUtil.autoEncodeHash(reroll);
			}
			itemToSwitch.h = rolledHash;
			if (!curr.sources.includes(reroll.source)) {
				curr.sources.push(reroll.source);
			}

			// do a pass to merge any duplicates
			outer: for (let i = 0; i < curr.items.length; ++i) {
				const item = curr.items[i];
				for (let j = i - 1; j >= 0; --j) {
					const prevItem = curr.items[j];

					if (item.h === prevItem.h) {
						prevItem.c = String(Number(prevItem.c) + Number(item.c));
						curr.items.splice(i, 1);
						continue outer;
					}
				}
			}

			this._loadSublist(curr);
		} // else can't reroll
	}

	handleContext (evt) {
		evt.stopPropagation();
	}

	handleSubhash () {
		// loading state from the URL is instead handled as part of EncounterUtil.pGetSavedState
		if (History.getSubHash(EncounterBuilder.HASH_KEY) === "true") this.show();
		else this.hide();
	}

	removePlayerRow (ele) {
		const $ele = $(ele);
		$ele.closest(`.ecgen__player_group`).remove();
		this.updateDifficulty();
	}

	updateDifficulty () {
		const xp = this.calculateXp();

		const $elEasy = $(`.ecgen__easy`).removeClass("bold").text(`Easy: ${xp.party.easy.toLocaleString()} XP`);
		const $elmed = $(`.ecgen__medium`).removeClass("bold").text(`Medium: ${xp.party.medium.toLocaleString()} XP`);
		const $elHard = $(`.ecgen__hard`).removeClass("bold").text(`Hard: ${xp.party.hard.toLocaleString()} XP`);
		const $elDeadly = $(`.ecgen__deadly`).removeClass("bold").text(`Deadly: ${xp.party.deadly.toLocaleString()} XP`);

		$(`.ecgen__daily_budget`).removeClass("bold").text(`Daily Budget: ${xp.party.daily.toLocaleString()} XP`);

		let difficulty = "Trivial";
		if (xp.encounter.adjustedXp >= xp.party.deadly) {
			difficulty = "Deadly";
			$elDeadly.addClass("bold");
		} else if (xp.encounter.adjustedXp >= xp.party.hard) {
			difficulty = "Hard";
			$elHard.addClass("bold");
		} else if (xp.encounter.adjustedXp >= xp.party.medium) {
			difficulty = "Medium";
			$elmed.addClass("bold");
		} else if (xp.encounter.adjustedXp >= xp.party.easy) {
			difficulty = "Easy";
			$elEasy.addClass("bold");
		}

		if (xp.encounter.relevantCount) {
			$(`.ecgen__req_creatures`).show();
			$(`.ecgen__rating`).text(`Difficulty: ${difficulty}`);
			$(`.ecgen__raw_total`).text(`Total XP: ${xp.encounter.baseXp.toLocaleString()}`);
			$(`.ecgen__raw_per_player`).text(`(${Math.floor(xp.encounter.baseXp / xp.party.count).toLocaleString()} per player)`);
			const infoHover = EntryRenderer.hover.bindOnMouseHoverEntry(
				{
					entries: [
						`{@b Adjusted by a ${xp.encounter.meta.playerAdjustedXpMult}× multiplier, based on a minimum challenge rating threshold of ${`${xp.encounter.meta.crCutoff.toFixed(2)}`.replace(/[,.]?0+$/, "")}*&dagger;, and a party size of ${xp.encounter.meta.playerCount} players.}`,
						`{@note * Calculated as a cumulative moving average of the challenge rating(s) in largest-first order, stopping when a challenge rating is found which is less than half of the current average, or all challenge ratings have been included in the average (whichever occurs first).}`,
						`<hr>`,
						{
							type: "quote",
							entries: [
								`&dagger; [...] don't count any monsters whose challenge rating is significantly below the average challenge rating of the other monsters in the group [...]`
							],
							"by": "{@book Dungeon Master's Guide, page 82|DMG|3|4 Modify Total XP for Multiple Monsters}"
						}
					]
				},
				true
			);
			$(`.ecgen__adjusted_total_info`).off("mouseover").on("mouseover", function (event) {
				infoHover(event, this);
			});
			$(`.ecgen__adjusted_total`).text(`Adjusted XP: ${xp.encounter.adjustedXp.toLocaleString()}`);
			$(`.ecgen__adjusted_per_player`).text(`(${Math.floor(xp.encounter.adjustedXp / xp.party.count).toLocaleString()} per player)`);
		} else {
			$(`.ecgen__req_creatures`).hide();
		}

		this.doSaveState();
	}

	static getParty () {
		return $(`.ecgen__player_group`).map((i, e) => {
			const $e = $(e);
			return {
				count: Number($e.find(`.ecgen__player_group__count`).val()),
				level: Number($e.find(`.ecgen__player_group__level`).val())
			}
		}).get();
	}

	get lastPlayerCount () {
		return this._lastPlayerCount;
	}

	calculateXp () {
		const party = EncounterBuilder.getParty();
		party.forEach(group => {
			group.easy = LEVEL_TO_XP_EASY[group.level] * group.count;
			group.medium = LEVEL_TO_XP_MEDIUM[group.level] * group.count;
			group.hard = LEVEL_TO_XP_HARD[group.level] * group.count;
			group.deadly = LEVEL_TO_XP_DEADLY[group.level] * group.count;
			group.daily = LEVEL_TO_XP_DAILY[group.level] * group.count;
		});
		const totals = party.reduce((a, b) => {
			Object.keys(a).forEach(k => a[k] = a[k] + b[k]);
			return a;
		}, {
			count: 0,
			level: 0,
			easy: 0,
			medium: 0,
			hard: 0,
			deadly: 0,
			daily: 0
		});
		const encounter = calculateListEncounterXp(totals.count);
		this._lastPlayerCount = totals.count;
		return {party: totals, encounter: encounter};
	}

	static async doStatblockMouseOver (evt, ele, ixMon, scaledTo) {
		const mon = monsters[ixMon];
		if (scaledTo != null) {
			const scaled = await ScaleCreature.scale(mon, scaledTo);
			EntryRenderer.hover.mouseOverPreloaded(evt, ele, scaled, UrlUtil.PG_BESTIARY, mon.source, UrlUtil.autoEncodeHash(mon));
		} else {
			EntryRenderer.hover.mouseOver(evt, ele, UrlUtil.PG_BESTIARY, mon.source, UrlUtil.autoEncodeHash(mon));
		}
	}

	static getTokenMouseOver (mon) {
		return EntryRenderer.hover.createOnMouseHoverEntry(
			{
				name: `Token \u2014 ${mon.name}`,
				type: "image",
				href: {
					type: "external",
					url: EntryRenderer.monster.getTokenUrl(mon)
				}
			},
			true
		);
	}

	doCrChange (ele, ixMon, scaledTo) {
		const $iptCr = $(ele);
		const mon = monsters[ixMon];
		const baseCr = mon.cr.cr || mon.cr;
		const baseCrNum = Parser.crToNumber(baseCr);
		const targetCr = $iptCr.val();

		if (Parser.isValidCr(targetCr)) {
			const targetCrNum = Parser.crToNumber(targetCr);

			if (targetCrNum === scaledTo) return;

			const state = ListUtil._getExportableSublist();
			const toFindHash = UrlUtil.autoEncodeHash(mon);

			const toFindUid = !(scaledTo == null || baseCrNum === scaledTo) ? getUid(mon.name, mon.source, scaledTo) : null;
			const ixCurrItem = state.items.findIndex(it => {
				if (scaledTo == null || scaledTo === baseCrNum) return it.uid == null && it.h === toFindHash;
				else return it.uid === toFindUid;
			});
			if (!~ixCurrItem) throw new Error(`Could not find previously sublisted item! 🐛`);

			const toFindNxtUid = baseCrNum !== targetCrNum ? getUid(mon.name, mon.source, targetCrNum) : null;
			const nextItem = state.items.find(it => {
				if (targetCrNum === baseCrNum) return it.uid == null && it.h === toFindHash;
				else return it.uid === toFindNxtUid;
			});
			// if there's an existing item with a matching UID (or lack of), merge into it
			if (nextItem) {
				const curr = state.items[ixCurrItem];
				nextItem.c = `${Number(nextItem.c || 1) + Number(curr.c || 1)}`;
				state.items.splice(ixCurrItem, 1);
			} else state.items[ixCurrItem].uid = getUid(mon.name, mon.source, targetCrNum);

			this._loadSublist(state);
		} else {
			alert(`"${$iptCr.val()}" is not a valid Challenge Rating! Please enter a valid CR (0-30). For fractions, "1/X" should be used.`);
			$iptCr.val(Parser.numberToCr(scaledTo || baseCr));
		}
	}

	static getPlayerRow (isFirst, count, level) {
		return `
			<div class="row mb-2 ecgen__player_group">
				<div class="col-3">
					<select class="ecgen__player_group__count" onchange="encounterBuilder.updateDifficulty()">
					${[...new Array(12)].map((_, i) => `<option ${(count === i + 1) ? "selected" : ""}>${i + 1}</option>`).join("")}
					</select>
				</div>
				<div class="col-3">
					<select class="ecgen__player_group__level" onchange="encounterBuilder.updateDifficulty()" >
						${[...new Array(20)].map((_, i) => `<option ${(level === i + 1) ? "selected" : ""}>${i + 1}</option>`).join("")}
					</select>
				</div>
				${!isFirst ? `
				<div class="col-3 flex" style="margin-left: -20px; align-items: center;">
					<button class="btn btn-danger btn-xs ecgen__del_players" onclick="encounterBuilder.removePlayerRow(this)">
						<span class="glyphicon glyphicon-remove" title="Remove Player Group"></span>
					</button>
				</div>
				` : ""}
			</div>
		`;
	}

	static getButtons (monId, isSublist) {
		return `
			<span class="ecgen__visible ${isSublist ? "col-1-5" : "col-1"} no-wrap" onclick="event.preventDefault()">
				<button title="Add (SHIFT for 5)" class="btn btn-success btn-xs ecgen__btn_list" onclick="encounterBuilder.handleClick(event, ${monId}, 1)" oncontextmenu="encounterBuilder.handleContext(event)">
					<span class="glyphicon glyphicon-plus"></span>
				</button>
				<button title="Subtract (SHIFT for 5)" class="btn btn-danger btn-xs ecgen__btn_list" onclick="encounterBuilder.handleClick(event, ${monId}, 0)" oncontextmenu="encounterBuilder.handleContext(event)">
					<span class="glyphicon glyphicon-minus"></span>
				</button>
				${isSublist ? `
				<button title="Randomize Monster" class="btn btn-default btn-xs ecgen__btn_list" onclick="encounterBuilder.handleShuffleClick(event, ${monId}, this)" oncontextmenu="encounterBuilder.handleContext(event)">
					<span class="glyphicon glyphicon-random" style="right: 1px"></span>
				</button>
				` : ""}
			</span>
		`;
	}
}
EncounterBuilder.HASH_KEY = "encounterbuilder";

const encounterBuilder = new EncounterBuilder();
