"use strict";

const JSON_DIR = "data/bestiary/";
const FLUFF_INDEX = "fluff-index.json";
const JSON_LIST_NAME = "monster";
const ECGEN_BASE_PLAYERS = 4; // assume a party size of four
const renderer = Renderer.get();

window.PROF_MODE_BONUS = "bonus";
window.PROF_MODE_DICE = "dice";
window.PROF_DICE_MODE = PROF_MODE_BONUS;

class BestiaryPage {
	static sortMonsters (a, b, o) {
		function getPrimary () {
			if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count);
			a = monsters[a.ix];
			b = monsters[b.ix];
			switch (o.sortBy) {
				case "name": return SortUtil.ascSort(a.name, b.name);
				case "type": return SortUtil.ascSort(a._pTypes.asText, b._pTypes.asText);
				case "source": return SortUtil.ascSort(a.source, b.source);
				case "cr": return SortUtil.ascSortCr(a._pCr, b._pCr);
			}
		}
		return getPrimary() || SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source);
	}
}

const _MISC_FILTER_SPELLCASTER = "Spellcaster, ";
function ascSortMiscFilter (a, b) {
	a = a.item;
	b = b.item;
	if (a.includes(_MISC_FILTER_SPELLCASTER) && b.includes(_MISC_FILTER_SPELLCASTER)) {
		a = Parser.attFullToAbv(a.replace(_MISC_FILTER_SPELLCASTER, ""));
		b = Parser.attFullToAbv(b.replace(_MISC_FILTER_SPELLCASTER, ""));
		return SortUtil.ascSortAtts(a, b);
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

const meta = {};
const languages = {};

// for use in homebrew only
function addLegendaryGroups (toAdd) {
	if (!toAdd || !toAdd.length) return;

	toAdd.forEach(lg => {
		meta[lg.source] = meta[lg.source] || {};
		meta[lg.source][lg.name] = lg;
	});
}

let ixFluff = {};
async function pLoadFluffIndex () {
	ixFluff = await DataUtil.loadJSON(JSON_DIR + FLUFF_INDEX);
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
			.then(() => BrewUtil.bind({list}))
			.then(() => BrewUtil.pAddLocalBrewData())
			.catch(BrewUtil.pPurgeBrew)
			.then(async () => {
				BrewUtil.makeBrewButton("manage-brew");
				BrewUtil.bind({filterBox, sourceFilter});
				await ListUtil.pLoadState();
				resolve();
			});
	})
}

let filterBox;
let encounterBuilder;
window.onload = async function load () {
	filterBox = await pInitFilterBox({
		filters: [
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
			spellcastingTypeFilter,
			sizeFilter,
			speedFilter,
			speedTypeFilter,
			alignmentFilter,
			saveFilter,
			skillFilter,
			senseFilter,
			languageFilter,
			damageTypeFilter,
			acFilter,
			averageHpFilter,
			abilityScoreFilter
		]
	});
	encounterBuilder = new EncounterBuilder();
	encounterBuilder.initUi();
	await Promise.all([
		ExcludeUtil.pInitialise(),
		RenderBestiary.pPopulateMetaAndLanguages(meta, languages),
		pLoadFluffIndex()
	]);
	Object.keys(languages).sort((a, b) => SortUtil.ascSortLower(languages[a], languages[b]))
		.forEach(la => languageFilter.addItem(la));
	await pMultisourceLoad(JSON_DIR, JSON_LIST_NAME, pPageInit, addMonsters, pPostLoad);
	if (Hist.lastLoadedId == null) Hist._freshLoad();
	ExcludeUtil.checkShowAllExcluded(monsters, $(`#pagecontent`));
	handleFilterChange();
	encounterBuilder.initState();
};

let list;
let subList;
let printBookView;
const sourceFilter = getSourceFilter();
const crFilter = new RangeFilter({
	header: "Challenge Rating",
	isLabelled: true,
	labelSortFn: SortUtil.ascSortCr,
	labels: [...Parser.CRS]
});
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
	displayFn: Parser.sizeAbvToFull,
	itemSortFn: null
});
const speedFilter = new RangeFilter({header: "Speed", min: 30, max: 30});
const speedTypeFilter = new Filter({header: "Speed Type", items: ["walk", "burrow", "climb", "fly", "hover", "swim"], displayFn: StrUtil.uppercaseFirst});
const strengthFilter = new RangeFilter({header: "Strength", min: 1, max: 30});
const dexterityFilter = new RangeFilter({header: "Dexterity", min: 1, max: 30});
const constitutionFilter = new RangeFilter({header: "Constitution", min: 1, max: 30});
const intelligenceFilter = new RangeFilter({header: "Intelligence", min: 1, max: 30});
const wisdomFilter = new RangeFilter({header: "Wisdom", min: 1, max: 30});
const charismaFilter = new RangeFilter({header: "Charisma", min: 1, max: 30});
const abilityScoreFilter = new MultiFilter({
	header: "Ability Scores",
	mode: "and",
	filters: [strengthFilter, dexterityFilter, constitutionFilter, intelligenceFilter, wisdomFilter, charismaFilter]
});
const acFilter = new RangeFilter({header: "Armor Class"});
const averageHpFilter = new RangeFilter({header: "Average Hit Points"});
const typeFilter = new Filter({
	header: "Type",
	items: Parser.MON_TYPES,
	displayFn: StrUtil.toTitleCase,
	itemSortFn: SortUtil.ascSortLower
});
const tagFilter = new Filter({header: "Tag", displayFn: StrUtil.uppercaseFirst});
const alignmentFilter = new Filter({
	header: "Alignment",
	items: ["L", "NX", "C", "G", "NY", "E", "N", "U", "A"],
	displayFn: Parser.alignmentAbvToFull,
	itemSortFn: null
});
const languageFilter = new Filter({
	header: "Languages",
	displayFn: (k) => languages[k],
	umbrellaItems: ["X", "XX"],
	umbrellaExcludes: ["CS"]
});
const damageTypeFilter = new Filter({
	header: "Damage Inflicted",
	displayFn: (it) => Parser.dmgTypeToFull(it).toTitleCase(),
	items: ["A", "B", "C", "F", "O", "L", "N", "P", "I", "Y", "R", "S", "T"]
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
	items: [...Parser.ABIL_ABVS],
	itemSortFn: null
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
const defenceFilter = new MultiFilter({header: "Damage", mode: "and", filters: [vulnerableFilter, resistFilter, immuneFilter]});
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
	items: ["Familiar", ...Object.keys(Parser.MON_MISC_TAG_TO_FULL), "Lair Actions", "Legendary", "Adventure NPC", "Spellcaster", ...Object.values(Parser.ATB_ABV_TO_FULL).map(it => `${_MISC_FILTER_SPELLCASTER}${it}`), "Regional Effects", "Reactions", "Swarm", "Has Variants", "Modified Copy", "Has Alternate Token"],
	displayFn: (it) => Parser.monMiscTagToFull(it).uppercaseFirst(),
	deselFn: (it) => it === "Adventure NPC",
	itemSortFn: ascSortMiscFilter
});
const spellcastingTypeFilter = new Filter({
	header: "Spellcasting Type",
	items: ["F", "I", "P", "S", "CB", "CC", "CD", "CP", "CR", "CS", "CL", "CW"],
	displayFn: Parser.monSpellcastingTagToFull
});

async function pPageInit (loadedSources) {
	Object.keys(loadedSources)
		.map(src => new FilterItem({item: src, changeFn: loadSource(JSON_LIST_NAME, addMonsters)}))
		.forEach(fi => sourceFilter.addItem(fi));

	list = ListUtil.initList(
		{
			listClass: "monsters",
			fnSort: BestiaryPage.sortMonsters
		}
	);
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
		listClass: "submonsters",
		sortFunction: BestiaryPage.sortMonsters,
		onUpdate: onSublistChange,
		uidHandler: (mon, uid) => ScaleCreature.scale(mon, Number(uid.split("_").last())),
		uidUnpacker: getUnpackedUid
	});
	SortUtil.initBtnSortHandlers($("#sublistsort"), subList);

	const baseHandlerOptions = {shiftCount: 5};
	function addHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistAdd(Hist.lastLoadedId, true, 5, getScaledData());
				else ListUtil.pDoSublistAdd(Hist.lastLoadedId, true, 1, getScaledData());
			} else ListUtil.genericAddButtonHandler(evt, baseHandlerOptions);
		};
	}
	function subtractHandlerGenerator () {
		return (evt, proxyEvt) => {
			evt = proxyEvt || evt;
			if (lastRendered.isScaled) {
				if (evt.shiftKey) ListUtil.pDoSublistSubtract(Hist.lastLoadedId, 5, getScaledData());
				else ListUtil.pDoSublistSubtract(Hist.lastLoadedId, 1, getScaledData());
			} else ListUtil.genericSubtractButtonHandler(evt, baseHandlerOptions);
		};
	}
	ListUtil.bindAddButton(addHandlerGenerator, baseHandlerOptions);
	ListUtil.bindSubtractButton(subtractHandlerGenerator, baseHandlerOptions);
	ListUtil.initGenericAddable();

	// region print view
	printBookView = new BookModeView(
		"bookview",
		$(`#btn-printbook`),
		"If you wish to view multiple creatures, please first make a list",
		"Bestiary Printer View",
		async $wrpContent => {
			const toShow = await Promise.all(ListUtil.genericPinKeyMapper());

			toShow.sort((a, b) => SortUtil.ascSort(a._displayName || a.name, b._displayName || b.name));

			let numShown = 0;

			const stack = [];

			const renderCreature = (mon) => {
				stack.push(`<div class="bkmv__wrp-item"><table class="stats stats--book stats--bkmv"><tbody>`);
				stack.push(Renderer.monster.getCompactRenderedString(mon, renderer));
				if (mon.legendaryGroup) {
					const thisGroup = (meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name];
					if (thisGroup) {
						stack.push(Renderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Lair Actions", "lairActions", 0));
						stack.push(Renderer.monster.getCompactRenderedStringSection(thisGroup, renderer, "Regional Effects", "regionalEffects", 0));
					}
				}
				stack.push(`</tbody></table></div>`);
			};

			stack.push(`<div class="w-100 h-100">`);
			toShow.forEach(mon => renderCreature(mon));
			if (!toShow.length && Hist.lastLoadedId != null) {
				renderCreature(monsters[Hist.lastLoadedId]);
			}
			stack.push(`</div>`);

			numShown += toShow.length;
			$wrpContent.append(stack.join(""));

			return numShown;
		},
		true
	);
	// endregion

	// region proficiency bonus/dice toggle
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
	// endregion
}

class EncounterBuilderUtils {
	static getSublistedEncounter () {
		return ListUtil.sublist.items.map(it => {
			const mon = monsters[it.ix];
			if (mon.cr) {
				const crScaled = it.values.uniqueid ? Number(getUnpackedUid(it.values.uniqueid).scaled) : null;
				return {
					cr: it.values.cr,
					count: Number(it.values.count),

					// used for encounter adjuster
					crScaled: crScaled,
					uid: it.values.uniqueid,
					hash: UrlUtil.autoEncodeHash(mon)
				}
			}
		}).filter(it => it && it.cr !== 100).sort((a, b) => SortUtil.ascSort(b.cr, a.cr));
	}

	static calculateListEncounterXp (playerCount) {
		return EncounterBuilderUtils.calculateEncounterXp(EncounterBuilderUtils.getSublistedEncounter(), playerCount);
	}

	static getCrCutoff (data) {
		data = data.filter(it => getCr(it) !== 100).sort((a, b) => SortUtil.ascSort(getCr(b), getCr(a)));

		// "When making this calculation, don't count any monsters whose challenge rating is significantly below the average
		// challenge rating of the other monsters in the group unless you think the weak monsters significantly contribute
		// to the difficulty of the encounter." -- DMG, p. 82

		// no cutoff for CR 0-2
		return getCr(data[0]) <= 2 ? 0 : getCr(data[0]) / 2;
	}

	/**
	 * @param data an array of {cr: n, count: m} objects
	 * @param playerCount number of players in the party
	 */
	static calculateEncounterXp (data, playerCount = ECGEN_BASE_PLAYERS) {
		data = data.filter(it => getCr(it) !== 100)
			.sort((a, b) => SortUtil.ascSort(getCr(b), getCr(a)));

		let baseXp = 0;
		let relevantCount = 0;
		if (!data.length) return {baseXp: 0, relevantCount: 0, adjustedXp: 0};

		const crCutoff = EncounterBuilderUtils.getCrCutoff(data);
		data.forEach(it => {
			if (getCr(it) >= crCutoff) relevantCount += it.count;
			baseXp += (Parser.crToXpNumber(Parser.numberToCr(getCr(it))) || 0) * it.count;
		});

		const playerAdjustedXpMult = Parser.numMonstersToXpMult(relevantCount, playerCount);

		const adjustedXp = playerAdjustedXpMult * baseXp;
		return {baseXp, relevantCount, adjustedXp, meta: {crCutoff, playerCount, playerAdjustedXpMult}};
	}
}

let _$totalCr;
function onSublistChange () {
	_$totalCr = _$totalCr || $(`#totalcr`);
	const xp = EncounterBuilderUtils.calculateListEncounterXp(encounterBuilder.lastPlayerCount);
	_$totalCr.html(`${xp.baseXp.toLocaleString()} XP (<span class="help" title="Adjusted Encounter XP">Enc</span>: ${(xp.adjustedXp).toLocaleString()} XP)`);
	if (encounterBuilder.isActive()) encounterBuilder.updateDifficulty();
	else encounterBuilder.doSaveState();
}

function handleFilterChange () {
	if (Hist.initialLoad) return;

	const f = filterBox.getValues();
	list.filter(function (li) {
		const m = monsters[li.ix];
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
			m.spellcastingTags,
			m.size,
			m._fSpeed,
			m._fSpeedType,
			m._fAlign,
			m._fSave,
			m._fSkill,
			m.senseTags,
			m.languageTags,
			m.damageTags,
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

function handleBestiaryLiClick (evt, listItem) {
	if (encounterBuilder.isActive()) Renderer.hover.doPopoutCurPage(evt, monsters, listItem.ix);
	else list.doSelect(listItem, evt);
}

function handleBestiaryLiContext (evt, listItem) {
	if (!encounterBuilder.isActive()) ListUtil.openContextMenu(evt, list, listItem);
}

function handleBestiaryLinkClick (evt) {
	if (encounterBuilder.isActive()) evt.preventDefault();
}

const _NEUT_ALIGNS = ["NX", "NY"];
const _addedHashes = new Set();
function addMonsters (data) {
	if (!data || !data.length) return;
	monsters = monsters.concat(data);

	// build the table
	for (; mI < monsters.length; mI++) {
		const mon = monsters[mI];
		const hash = UrlUtil.autoEncodeHash(mon);
		if (!mon.uniqueId && _addedHashes.has(hash)) continue;
		_addedHashes.add(hash);
		if (ExcludeUtil.isExcluded(mon.name, "monster", mon.source)) continue;
		RenderBestiary.initParsed(mon);
		mon._fSpeedType = Object.keys(mon.speed).filter(k => mon.speed[k]);
		if (mon._fSpeedType.length) mon._fSpeed = mon._fSpeedType.map(k => mon.speed[k].number || mon.speed[k]).sort((a, b) => SortUtil.ascSort(b, a))[0];
		else mon._fSpeed = 0;
		if (mon.speed.canHover) mon._fSpeedType.push("hover");
		mon._fAc = mon.ac.map(it => it.ac || it);
		mon._fHp = mon.hp.average;
		if (mon.alignment) {
			const tempAlign = typeof mon.alignment[0] === "object"
				? Array.prototype.concat.apply([], mon.alignment.map(a => a.alignment))
				: [...mon.alignment];
			if (tempAlign.includes("N") && !tempAlign.includes("G") && !tempAlign.includes("E")) tempAlign.push("NY");
			else if (tempAlign.includes("N") && !tempAlign.includes("L") && !tempAlign.includes("C")) tempAlign.push("NX");
			else if (tempAlign.length === 1 && tempAlign.includes("N")) Array.prototype.push.apply(tempAlign, _NEUT_ALIGNS);
			mon._fAlign = tempAlign;
		} else {
			mon._fAlign = null;
		}
		mon._fVuln = mon.vulnerable ? getAllImmRest(mon.vulnerable, "vulnerable") : [];
		mon._fRes = mon.resist ? getAllImmRest(mon.resist, "resist") : [];
		mon._fImm = mon.immune ? getAllImmRest(mon.immune, "immune") : [];
		mon._fCondImm = mon.conditionImmune ? getAllImmRest(mon.conditionImmune, "conditionImmune") : [];
		mon._fSave = mon.save ? Object.keys(mon.save) : [];
		mon._fSkill = mon.skill ? Object.keys(mon.skill) : [];
		mon._fSources = ListUtil.getCompleteFilterSources(mon);

		const eleLi = document.createElement("li");
		eleLi.className = "row";
		eleLi.addEventListener("click", (evt) => handleBestiaryLiClick(evt, listItem));
		eleLi.addEventListener("contextmenu", (evt) => handleBestiaryLiContext(evt, listItem));

		const source = Parser.sourceJsonToAbv(mon.source);
		const type = mon._pTypes.asText.uppercaseFirst();
		const cr = mon._pCr || "\u2014";

		eleLi.innerHTML += `<a href="#${hash}" onclick="handleBestiaryLinkClick(event)">
			${EncounterBuilder.getButtons(mI, mon.uniqueId)}
			<span class="ecgen__name bold col-4-2 pl-0">${mon.name}</span>
			<span class="type col-4-1">${type}</span>
			<span class="col-1-7 text-center">${cr}</span>
			<span title="${Parser.sourceJsonToFull(mon.source)}${Renderer.utils.getSourceSubText(mon)}" class="col-2 text-center ${Parser.sourceJsonToColor(mon.source)} pr-0" ${BrewUtil.sourceJsonToStyle(mon.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			mI,
			eleLi,
			mon.name,
			{
				hash,
				source,
				type,
				cr,
				group: mon.group || "",
				alias: (mon.alias || []).map(it => `"${it}"`).join(","),
				uniqueid: mon.uniqueId ? mon.uniqueId : mI
			}
		);
		list.addItem(listItem);

		// populate filters
		sourceFilter.addItem(mon._fSources);
		if (mon._pCr != null) crFilter.addItem(mon._pCr);
		strengthFilter.addItem(mon.str);
		dexterityFilter.addItem(mon.dex);
		constitutionFilter.addItem(mon.con);
		intelligenceFilter.addItem(mon.int);
		wisdomFilter.addItem(mon.wis);
		charismaFilter.addItem(mon.cha);
		speedFilter.addItem(mon._fSpeed);
		mon.ac.forEach(it => acFilter.addItem(it.ac || it));
		if (mon.hp.average) averageHpFilter.addItem(mon.hp.average);
		mon._pTypes.tags.forEach(t => tagFilter.addItem(t));
		mon._fMisc = mon.legendary || mon.legendaryGroup ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
		if (mon.spellcasting) {
			mon._fMisc.push("Spellcaster");
			mon.spellcasting.forEach(sc => {
				if (sc.ability) mon._fMisc.push(`${_MISC_FILTER_SPELLCASTER}${Parser.attAbvToFull(sc.ability)}`);
			});
		}
		if (mon.isNpc) mon._fMisc.push("Adventure NPC");
		if (mon.legendaryGroup && (meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name]) {
			if ((meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name].lairActions) mon._fMisc.push("Lair Actions");
			if ((meta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name].regionalEffects) mon._fMisc.push("Regional Effects");
		}
		if (mon.reaction) mon._fMisc.push("Reactions");
		if (mon.variant) mon._fMisc.push("Has Variants");
		if (mon.miscTags) mon._fMisc.push(...mon.miscTags);
		if (mon._isCopy) mon._fMisc.push("Modified Copy");
		if (mon.altArt) mon._fMisc.push("Has Alternate Token");
		traitFilter.addItem(mon.traitTags);
		actionReactionFilter.addItem(mon.actionTags);
		environmentFilter.addItem(mon.environment);
	}

	list.update();

	filterBox.render();
	handleFilterChange();

	ListUtil.setOptions({
		itemList: monsters,
		getSublistRow: pGetSublistItem,
		primaryLists: [list]
	});

	function popoutHandlerGenerator (toList) {
		return (evt) => {
			const mon = toList[Hist.lastLoadedId];
			if (evt.shiftKey) {
				const $content = Renderer.hover.$getHoverContent_statsCode(mon);
				Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionFromEvent(evt),
					{
						title: `${mon.name} \u2014 Source Data`,
						isPermanent: true,
						isBookContent: true
					}
				);
			} else {
				if (lastRendered.mon != null && lastRendered.isScaled) {
					const renderFn = Renderer.hover._pageToRenderFn(UrlUtil.getCurrentPage());
					const $content = $$`<table class="stats">${renderFn(lastRendered.mon)}</table>`;
					Renderer.hover.getShowWindow(
						$content,
						Renderer.hover.getWindowPositionFromEvent(evt),
						{
							pageUrl: `#${UrlUtil.autoEncodeHash(lastRendered.mon)}`,
							title: lastRendered.mon._displayName || lastRendered.mon.name,
							isPermanent: true
						}
					);
				} else {
					Renderer.hover.doPopoutCurPage(evt, toList, Hist.lastLoadedId);
				}
			}
		};
	}

	Renderer.hover.bindPopoutButton(monsters, popoutHandlerGenerator);
	UrlUtil.bindLinkExportButton(filterBox);
	ListUtil.bindDownloadButton();
	ListUtil.bindUploadButton(sublistFuncPreload);

	Renderer.utils.bindPronounceButtons();
}

function sublistFuncPreload (json, funcOnload) {
	if (json.l && json.l.items && json.l.sources) { // if it's an encounter file
		json.items = json.l.items;
		json.sources = json.l.sources;
	}
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

async function pGetSublistItem (monRaw, pinId, addCount, data = {}) {
	const mon = await (data.scaled ? ScaleCreature.scale(monRaw, data.scaled) : monRaw);
	RenderBestiary.updateParsed(mon);
	const subHash = data.scaled ? `${HASH_PART_SEP}${MON_HASH_SCALED}${HASH_SUB_KV_SEP}${data.scaled}` : "";
	RenderBestiary.initParsed(mon);

	const name = mon._displayName || mon.name;
	const hash = `${UrlUtil.autoEncodeHash(mon)}${subHash}`;
	const type = mon._pTypes.asText.uppercaseFirst();
	const count = addCount || 1;
	const cr = mon._pCr || "Unknown";

	const $hovStatblock = $(`<span class="col-1-4 help--hover ecgen__visible">Statblock</span>`)
		.mouseover(evt => EncounterBuilder.doStatblockMouseOver(evt, $hovStatblock[0], pinId, mon._isScaledCr))
		.mousemove(evt => Renderer.hover.handleLinkMouseMove(evt, $hovStatblock[0]))
		.mouseleave(evt => Renderer.hover.handleLinkMouseLeave(evt, $hovStatblock[0]));

	const hovTokenMeta = EncounterBuilder.getTokenHoverMeta(mon);
	const $hovToken = $(`<span class="col-1-2 ecgen__visible help--hover">Token</span>`)
		.mouseover(evt => hovTokenMeta.mouseOver(evt, $hovToken[0]))
		.mousemove(evt => hovTokenMeta.mouseMove(evt, $hovToken[0]))
		.mouseleave(evt => hovTokenMeta.mouseLeave(evt, $hovToken[0]));

	const $hovImage = $(`<span class="col-1-2 ecgen__visible help--hover">Image</span>`)
		.mouseover(evt => EncounterBuilder.handleImageMouseOver(evt, $hovImage, pinId));

	const $ptCr = (() => {
		if (cr === "Unknown") return $(`<span class="col-1-2 text-center">${cr}</span>`);

		const $iptCr = $(`<input value="${cr}" class="ecgen__cr_input form-control form-control--minimal input-xs">`)
			.change(() => encounterBuilder.doCrChange($iptCr, pinId, mon._isScaledCr));

		return $$`<span class="col-1-2 text-center">${$iptCr}</span>`;
	})();

	const $eleCount1 = $(`<span class="col-2 text-center">${count}</span>`);
	const $eleCount2 = $(`<span class="col-2 pr-0 text-center">${count}</span>`);

	const $ele = $$`<li class="row row--bestiary_sublist">
		<a href="#${hash}" draggable="false" class="ecgen__hidden">
			<span class="bold col-5 pl-0">${name}</span>
			<span class="col-3-8">${type}</span>
			<span class="col-1-2 text-center">${cr}</span>
			${$eleCount1}
		</a>
		
		<div class="list__item_inner ecgen__visible--flex">
			${EncounterBuilder.$getSublistButtons(pinId, mon.uniqueId, true)}
			<span class="ecgen__name--sub col-3-5">${name}</span>
			${$hovStatblock}
			${$hovToken}
			${$hovImage}
			${$ptCr}
			${$eleCount2}
		</div>
	</li>`
		.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

	const listItem = new ListItem(
		pinId,
		$ele,
		name,
		{
			hash,
			source: Parser.sourceJsonToAbv(mon.source),
			type,
			cr,
			count,
			uniqueid: data.uid || ""
		},
		{
			$elesCount: [$eleCount1, $eleCount2]
		}
	);

	return listItem;
}

let profBtn = null;
// load selected monster stat block
function loadHash (id) {
	const mon = monsters[id];

	renderStatblock(mon);

	loadSubHash([]);
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
		const $btnScaleCr = mon.cr != null ? $(`
			<button id="btn-scale-cr" title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-signal"/>
			</button>`)
			.off("click").click((evt) => {
				evt.stopPropagation();
				const mon = monsters[Hist.lastLoadedId];
				const lastCr = lastRendered.mon ? lastRendered.mon.cr.cr || lastRendered.mon.cr : mon.cr.cr || mon.cr;
				Renderer.monster.getCrScaleTarget($btnScaleCr, lastCr, (targetCr) => {
					if (targetCr === Parser.crToNumber(mon.cr)) renderStatblock(mon);
					else Hist.setSubhash(MON_HASH_SCALED, targetCr);
				});
			}).toggle(Parser.crToNumber(mon.cr.cr || mon.cr) !== 100) : null;

		const $btnResetScaleCr = mon.cr != null ? $(`
			<button id="btn-reset-cr" title="Reset CR Scaling" class="mon__btn-reset-cr btn btn-xs btn-default">
				<span class="glyphicon glyphicon-refresh"></span>
			</button>`)
			.click(() => Hist.setSubhash(MON_HASH_SCALED, null))
			.toggle(isScaled) : null;

		$content.append(RenderBestiary.$getRenderedCreature(mon, meta, {$btnScaleCr, $btnResetScaleCr}));

		// tokens
		(() => {
			const $tokenImages = [];

			// statblock scrolling handler
			$(`#wrp-pagecontent`).off("scroll").on("scroll", function () {
				$tokenImages.forEach($img => {
					$img
						.toggle(this.scrollTop < 32)
						.css({
							opacity: (32 - this.scrollTop) / 32,
							top: -this.scrollTop
						});
				});
			});

			const $floatToken = $(`#float-token`).empty();

			function imgError (ele) {
				if (ele) $(ele).parent().remove();
				$(`#pagecontent th.name`).css("padding-right", "0.3em");
				$(`.mon__wrp-size-type-align`).css("max-width", "none");
				$(`.mon__wrp-avoid-token`).css("max-width", "none");
			}

			if (mon.tokenUrl || !mon.uniqueId) {
				const imgLink = Renderer.monster.getTokenUrl(mon);
				const $img = $(`<img src="${imgLink}" class="mon__token" alt="${mon.name}">`)
					.on("error", () => imgError($img));
				$tokenImages.push($img);
				const $lnkToken = $$`<a href="${imgLink}" class="mon__wrp-token" target="_blank" rel="noopener">${$img}</a>`.appendTo($floatToken);

				const altArtMeta = [];

				if (mon.altArt) altArtMeta.push(...MiscUtil.copy(mon.altArt));
				if (mon.variant) {
					const variantTokens = mon.variant.filter(it => it.token).map(it => it.token);
					if (variantTokens.length) altArtMeta.push(...MiscUtil.copy(variantTokens).map(it => ({...it, displayName: `Variant; ${it.name}`})));
				}

				if (altArtMeta.length) {
					// make a fake entry for the original token
					altArtMeta.unshift({$ele: $lnkToken});

					const buildEle = (meta) => {
						if (!meta.$ele) {
							const imgLink = Renderer.monster.getTokenUrl({name: meta.name, source: meta.source});
							const $img = $(`<img src="${imgLink}" class="mon__token" alt="${meta.displayName || meta.name}">`)
								.on("error", () => {
									$img.attr(
										"src",
										`data:image/svg+xml,${encodeURIComponent(`
											<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
												<circle cx="200" cy="200" r="175" fill="#b00"/>
												<rect x="190" y="40" height="320" width="20" fill="#ddd" transform="rotate(45 200 200)"/>
												<rect x="190" y="40" height="320" width="20" fill="#ddd" transform="rotate(135 200 200)"/>
											</svg>`
										)}`
									);
								});
							$tokenImages.push($img);
							meta.$ele = $$`<a href="${imgLink}" class="mon__wrp-token" target="_blank" rel="noopener">${$img}</a>`
								.hide()
								.css("max-width", "100%") // hack to ensure the token gets shown at max width on first look
								.appendTo($floatToken);
						}
					};
					altArtMeta.forEach(buildEle);

					let ix = 0;
					const handleClick = (evt, direction) => {
						evt.stopPropagation();
						evt.preventDefault();

						// avoid going off the edge of the list
						if (ix === 0 && !~direction) return;
						if (ix === altArtMeta.length - 1 && ~direction) return;

						ix += direction;

						if (!~direction) { // left
							if (ix === 0) {
								$btnLeft.hide();
								$wrpFooter.hide();
							}
							$btnRight.show();
						} else {
							$btnLeft.show();
							$wrpFooter.show();
							if (ix === altArtMeta.length - 1) {
								$btnRight.hide();
							}
						}
						altArtMeta.filter(it => it.$ele).forEach(it => it.$ele.hide());

						const meta = altArtMeta[ix];
						meta.$ele.show();
						setTimeout(() => meta.$ele.css("max-width", ""), 10); // hack to clear the earlier 100% width

						if (meta.name && meta.source) $footer.html(`<div>${meta.displayName || meta.name}; <span title="${Parser.sourceJsonToFull(meta.source)}">${Parser.sourceJsonToAbv(meta.source)}${meta.page > 0 ? ` p${meta.page}` : ""}</span></div>`);
						else $footer.html("");

						$wrpFooter.detach().appendTo(meta.$ele);
						$btnLeft.detach().appendTo(meta.$ele);
						$btnRight.detach().appendTo(meta.$ele);
					};

					// append footer first to be behind buttons
					const $footer = $(`<div class="mon__token-footer"/>`);
					const $wrpFooter = $$`<div class="mon__wrp-token-footer">${$footer}</div>`.hide().appendTo($lnkToken);

					const $btnLeft = $$`<div class="mon__btn-token-cycle mon__btn-token-cycle--left"><span class="glyphicon glyphicon-chevron-left"/></div>`
						.click(evt => handleClick(evt, -1)).appendTo($lnkToken)
						.hide();

					const $btnRight = $$`<div class="mon__btn-token-cycle mon__btn-token-cycle--right"><span class="glyphicon glyphicon-chevron-right"/></div>`
						.click(evt => handleClick(evt, 1)).appendTo($lnkToken);
				}
			} else imgError();
		})();

		// inline rollers //////////////////////////////////////////////////////////////////////////////////////////////
		const isProfDiceMode = PROF_DICE_MODE === PROF_MODE_DICE;
		function _addSpacesToDiceExp (exp) {
			return exp.replace(/([^0-9d])/gi, " $1 ").replace(/\s+/g, " ");
		}

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
									Renderer.dice.rollerClick(event, it, '{"type":"dice","rollable":true,"toRoll":"1d20 + ${profDiceString}"}'${$(this).prop("title") ? `, '${$(this).prop("title")}'` : ""})
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
			$(this).find(`.rd__dc`).each((i, e) => {
				const $e = $(e);
				const dc = Number($e.html());

				const expectedPB = Parser.crToPb(mon.cr);
				if (expectedPB > 0) {
					const withoutPB = dc - expectedPB;
					const profDiceString = _addSpacesToDiceExp(`1d${(expectedPB * 2)}${withoutPB >= 0 ? "+" : ""}${withoutPB}`);

					$e
						.addClass("dc-roller")
						.attr("mode", isProfDiceMode ? "dice" : "")
						.mousedown((evt) => window.PROF_DICE_MODE === window.PROF_MODE_DICE && evt.preventDefault())
						.attr("onclick", `dcRollerClick(event, this, '${profDiceString}')`)
						.attr("data-roll-prof-bonus", `${dc}`)
						.attr("data-roll-prof-dice", profDiceString)
						.html(isProfDiceMode ? profDiceString : dc)
				}
			});
		});

		$(`#wrp-pagecontent`).scroll();
	}

	function buildFluffTab (isImageTab) {
		return Renderer.utils.pBuildFluffTab(
			isImageTab,
			$content,
			mon,
			Renderer.monster.getFluff.bind(null, mon, meta),
			`${JSON_DIR}${ixFluff[mon.source]}`,
			() => ixFluff[mon.source]
		);
	}

	// reset tabs
	const statTab = Renderer.utils.tabButton(
		"Statblock",
		() => {
			$wrpBtnProf.append(profBtn);
			$(`#float-token`).show();
		},
		buildStatsTab
	);
	const infoTab = Renderer.utils.tabButton(
		"Info",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		buildFluffTab
	);
	const picTab = Renderer.utils.tabButton(
		"Images",
		() => {
			profBtn = profBtn || $wrpBtnProf.children().detach();
			$(`#float-token`).hide();
		},
		() => buildFluffTab(true)
	);
	Renderer.utils.bindTabButtons(statTab, infoTab, picTab);
}

function handleUnknownHash (link, sub) {
	const src = Object.keys(loadedSources).find(src => src.toLowerCase() === decodeURIComponent(link.split(HASH_LIST_SEP)[1]).toLowerCase());
	if (src) {
		loadSource(JSON_LIST_NAME, (monsters) => {
			addMonsters(monsters);
			Hist.hashChange();
		})(src, "yes");
	}
}

// Used in DC roller event handlers
function dcRollerClick (event, ele, exp) {
	if (window.PROF_DICE_MODE === PROF_MODE_BONUS) return;
	const it = {
		type: "dice",
		rollable: true,
		toRoll: exp
	};
	Renderer.dice.rollerClick(event, ele, JSON.stringify(it));
}

function getUnpackedUid (uid) {
	return {scaled: Number(uid.split("_").last()), uid};
}

function getCr (obj) {
	if (obj.crScaled != null) return obj.crScaled;
	if (obj.cr == null) return null;
	return typeof obj.cr === "string" ? obj.cr.includes("/") ? Parser.crToNumber(obj.cr) : Number(obj.cr) : obj.cr;
}

function loadSubHash (sub) {
	sub = filterBox.setFromSubHashes(sub);
	ListUtil.setFromSubHashes(sub, sublistFuncPreload);

	printBookView.handleSub(sub);

	const scaledHash = sub.find(it => it.startsWith(MON_HASH_SCALED));
	if (scaledHash) {
		const scaleTo = Number(UrlUtil.unpackSubHash(scaledHash)[MON_HASH_SCALED][0]);
		const scaleToStr = Parser.numberToCr(scaleTo);
		const mon = monsters[Hist.lastLoadedId];
		if (Parser.isValidCr(scaleToStr) && scaleTo !== Parser.crToNumber(lastRendered.mon.cr)) {
			ScaleCreature.scale(mon, scaleTo).then(scaled => renderStatblock(scaled, true));
		}
	}

	encounterBuilder.handleSubhash(sub);
}
