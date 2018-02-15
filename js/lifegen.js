"use strict";

const JSON_URL = "data/life.json";

const RNG = EntryRenderer.dice.randomise;

function _testRng (rollFn) {
	const counts = {};
	for (let i = 0; i < 1000000; ++i) {
		const it = rollFn().result;
		if (!counts[it]) counts[it] = 1;
		else counts[it]++;
	}
	return counts;
}

function _getFromTable (table, roll) {
	const it = {};
	Object.assign(it, table.find(it => {
		return it.min === roll || it.max && roll >= it.min && roll <= it.max;
	}));
	Object.keys(it).forEach(k => {
		if (typeof it[k] === "function") {
			it[k] = it[k]();
		}
	});
	return it;
}
function rollSuppAlignment () {
	return _getFromTable(SUPP_ALIGNMENT, RNG(6) + RNG(6) + RNG(6));
}
function rollSuppDeath () {
	return _getFromTable(SUPP_DEATH, RNG(12));
}
function rollSuppClass () {
	return _getFromTable(SUPP_CLASS, RNG(100));
}
function rollSuppOccupation () {
	return _getFromTable(SUPP_OCCUPATION, RNG(100));
}
function rollSuppRace () {
	return _getFromTable(SUPP_RACE, RNG(100));
}
function rollSuppRelationship () {
	return _getFromTable(SUPP_RELATIONSHIP, RNG(4) + RNG(4) + RNG(4));
}
function rollSuppStatus () {
	return _getFromTable(SUPP_STATUS, RNG(6) + RNG(6) + RNG(6));
}

function choose (...lst) {
	return fmtChoice(rollOnArray(lst));
}

function fmtChoice(str) {
	return `(<i>${str}</i>)`;
}

function rollOnArray (lst) {
	return lst[RNG(lst.length) - 1]
}

const RACES = ["Elf", "Dwarf", "Half-Elf", "Half-Orc", "Tiefling"];

const PARENTS_HALF_ELF = [
	{"min": 1, "max": 5, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was an elf and the other ${fmtChoice(p === 1 ? "father" : "mother")} was a human.` }, "display": "One parent was an elf and the other was a human."},
	{"min": 6, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was an elf and the other ${fmtChoice(p === 1 ? "father" : "mother")} was a half-elf.` }, "display": "One parent was an elf and the other was a half-elf."},
	{"min": 7, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was a human and the other ${fmtChoice(p === 1 ? "father" : "mother")} was a half-elf.` }, "display": "One parent was a human and the other was a half-elf."},
	{"min": 8, "result": "Both parents were half-elves."}
];

const PARENTS_HALF_ORC = [
	{"min": 1, "max": 3, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was an orc and the other ${fmtChoice(p === 1 ? "father" : "mother")} was a human.`}, "display": "One parent was an orc and the other was a human."},
	{"min": 4, "max": 5, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was an orc and the other ${fmtChoice(p === 1 ? "father" : "mother")} was a half-orc.`}, "display": "One parent was an orc and the other was a half-orc."},
	{"min": 6, "max": 7, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was a human and the other ${fmtChoice(p === 1 ? "father" : "mother")} was a half-orc.`}, "display": "One parent was a human and the other was a half-orc."},
	{"min": 8, "display": "Both parents were half-orcs."}
];

const PARENTS_TIEFLING = [
	{"min": 1, "max": 4, "display": "Both parents were humans, their infernal heritage dormant until you came along."},
	{"min": 5, "max": 6, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was a tiefling and the other ${fmtChoice(p === 1 ? "father": "mother")} was a human.`}, "display": "One parent was a tiefling and the other was a human."},
	{"min": 7, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was a tiefling and the other ${fmtChoice(p === 1 ? "father": "mother")} was a devil.`}, "display": "One parent was a tiefling and the other was a devil."},
	{"min": 8, "result": () => {const p = RNG(2); return `One parent ${fmtChoice(p === 1 ? "mother" : "father")} was a human and the other ${fmtChoice(p === 1 ? "father": "mother")} was a devil.`}, "display": "One parent was a human and the other was a devil."}
];

const BIRTHPLACES = [
	{"min": 1, "max": 50, "result": "Home"},
	{"min": 51, "max": 55, "result": "Home of a family friend"},
	{"min": 56, "max": 63, "result": () => `Home of a healer or midwife ${choose("healer", "midwife")}`,"display": "Home of a healer or midwife"},
	{"min": 64, "max": 65, "result": () => `Carriage, cart, or wagon ${choose("carriage", "cart", "wagon")}`, "display": "Carriage, cart, or wagon"},
	{"min": 66, "max": 68, "result": () => `Barn, shed, or other outbuilding ${choose("barn", "shed", "outbuilding")}`, "display": "Barn, shed, or other outbuilding"},
	{"min": 69, "max": 70, "result": "Cave"},
	{"min": 71, "max": 72, "result": "Field"},
	{"min": 73, "max": 74, "result": "Forest"},
	{"min": 75, "max": 77, "result": "Temple"},
	{"min": 78, "result": "Battlefield"},
	{"min": 79, "max": 80, "result": () => `Alley or street ${choose("alley", "street")}`, "display": "Alley or street"},
	{"min": 81, "max": 82, "result": () => `Brothel, tavern, or inn ${choose("brothel", "tavern", "inn")}`, "display": "Brothel, tavern, or inn"},
	{"min": 83, "max": 84, "result": () => `Castle, keep, tower, or palace ${choose("castle", "keep", "tower", "palace")}`, "display": "Castle, keep, tower, or palace"},
	{"min": 85, "result": () => `Sewer or rubbish heap ${choose("sewer", "rubbish heap")}`, "display": "Sewer or rubbish heap"},
	{"min": 86, "max": 88, "result": "Among people of a different race"},
	{"min": 89, "max": 91, "result": () => `On board a boat or a ship ${choose("boat", "ship")}`, "display": "On board a boat or a ship"},
	{"min": 92, "max": 93, "result": () => `In a prison or in the headquarters of a secret organization ${choose("prison", "headquarters of a secret organization")}`, "display": "In a prison or in the headquarters of a secret organization"},
	{"min": 94, "max": 95, "result": "In a sage’s laboratory"},
	{"min": 96, "result": "In the Feywild"},
	{"min": 97, "result": "In the Shadowfell"},
	{"min": 98, "result": () => `On the Astral Plane or the Ethereal Plane ${choose("Astral Plane", "Ethereal Plane")}`, "display": "On the Astral Plane or the Ethereal Plane"},
	{"min": 99, "result": "On an Inner Plane of your choice"},
	{"min": 100, "result": "On an Outer Plane of your choice"}
];

function absentParent (parent) {
	return _getFromTable(ABSENT_PARENT, RNG(4)).result.replace("parent", `$& ${fmtChoice(parent)}</i>`);
}

function absentBothParents () {
	const p = RNG(2);
	return `${absentParent(p === 1 ? "mother" : "father")} ${absentParent(p === 1 ? "mother" : "father")}`;
}

function otherParent (parent) {
	return parent === "mother" ? "father" : "mother";
}

function singleParentOrStep (parent) {
	const p = RNG(2);
	return `Single ${parent} or step${parent} ${fmtChoice(p === 1 ? parent : `step${parent}`)}. ${p === 1 ? `${absentParent(otherParent(parent))}` : absentBothParents()}`
}

const FAMILY = [
	{"min": 1, "result": () => `None. ${absentBothParents()}`, "display": "None"},
	{"min": 2, "result": () => `Institution, such as an asylum. ${absentBothParents()}`, "display": "Institution, such as an asylum"},
	{"min": 3, "result": () => `Temple. ${absentBothParents()}`, "display": "Temple"},
	{"min": 4, "max": 5, "result": () => `Orphanage. ${absentBothParents()}`, "display": "Orphanage"},
	{"min": 6, "max": 7, "result": () => `Guardian. ${absentBothParents()}`, "display": "Guardian"},
	{"min": 8, "max": 15, "result": () => `Paternal or maternal aunt, uncle, or both; or extended family such as a tribe or clan ${choose("paternal uncle", "maternal aunt", "paternal uncle and maternal aunt", "extended family such as a tribe or clan")}. ${absentBothParents()}`, "display": "Paternal or maternal aunt, uncle, or both; or extended family such as a tribe or clan"},
	{"min": 16, "max": 25, "result": () => `Paternal or maternal grandparent(s) ${choose("paternal grandfather", "maternal grandmother", "paternal grandfather and maternal grandmother")}. ${absentBothParents()}`, "display": "Paternal or maternal grandparent(s)"},
	{"min": 26, "max": 35, "result": () => `Adoptive family (same or different race) ${choose("same race", "different race")}. ${absentBothParents()}`, "display": "Adoptive family (same or different race)"},
	{"min": 36, "max": 55, "result": () => singleParentOrStep("father"), "display": "Single father or stepfather"},
	{"min": 56, "max": 75, "result": () => singleParentOrStep("mother"), "display": "Single mother or stepmother"},
	{"min": 76, "max": 100, "result": "Mother and father"}
];

const ABSENT_PARENT = [
	{"min": 1, "result": () => `Your parent died (${rollSuppDeath().result.lowercaseFirst()}).`, "display": "Your parent died (roll on the Cause of Death supplemental table)."},
	{"min": 2, "result": () => `Your parent was imprisoned, enslaved, or otherwise taken away ${choose("imprisoned", "enslaved", "otherwise taken away")}.`, "display": "Your parent was imprisoned, enslaved, or otherwise taken away."},
	{"min": 3, "result": "Your parent abandoned you."},
	{"min": 4, "result": "Your parent disappeared to an unknown fate."}
];

const FAMILY_LIFESTYLE = [
	{"min": 3, "result": "Wretched (-40)", "modifier": -40},
	{"min": 4, "max": 5, "result": "Squalid (-20)", "modifier": -20},
	{"min": 6, "max": 8, "result": "Poor (-10)", "modifier": -10},
	{"min": 9, "max": 12, "result": "Modest (+0)", "modifier": 0},
	{"min": 13, "max": 15, "result": "Comfortable (+10)", "modifier": 10},
	{"min": 16, "max": 17, "result": "Wealthy (+20)", "modifier": 20},
	{"min": 18, "result": "Aristocratic (+40)", "modifier": 40}
];

const CHILDHOOD_HOME = [
	{"min": 0, "result": "On the streets"},
	{"min": 1, "max": 20, "result": "Rundown shack"},
	{"min": 21, "max": 30, "result": "No permanent residence; you moved around a lot"},
	{"min": 31, "max": 40, "result": () => `Encampment or village ${choose("encampment", "village")} in the wilderness`, "display": "Encampment or village in the wilderness"},
	{"min": 41, "max": 50, "result": "Apartment in a rundown neighborhood"},
	{"min": 51, "max": 70, "result": "Small house"},
	{"min": 71, "max": 90, "result": "Large house"},
	{"min": 91, "max": 110, "result": "Mansion"},
	{"min": 111, "result": `Palace or castle ${choose("palace", "castle")}`, "display": "Palace or castle"}
];

const CHILDHOOD_MEMORIES = [
	{"min": 3, "result": "I am still haunted by my childhood, when I was treated badly by my peers."},
	{"min": 4, "max": 5, "result": "I spent most of my childhood alone, with no close friends."},
	{"min": 6, "max": 8, "result": "Others saw me as being different or strange, and so I had few companions."},
	{"min": 9, "max": 12, "result": "I had a few close friends and lived an ordinary childhood."},
	{"min": 13, "max": 15, "result": "I had several friends, and my childhood was generally a happy one."},
	{"min": 16, "max": 17, "result": "I always found it easy to make friends, and I loved being around people."},
	{"min": 18, "result": "Everyone knew who I was, and I had friends everywhere I went."}
];

const LIFE_EVENTS_AGE = [
	{"min": 1, "max": 20, "age": () => RNG(20), "result": "20 years or younger", "events": 1},
	{"min": 21, "max": 59, "age": () => RNG(10) + 20, "result": "21–30 years", "events": () => RNG(4)},
	{"min": 60, "max": 69, "age": () => RNG(10) + 30, "result": "31–40 years", "events": () => RNG(6)},
	{"min": 70, "max": 89, "age": () => RNG(10) + 40, "result": "41–50 years", "events": () => RNG(8)},
	{"min": 90, "max": 99, "age": () => RNG(10) + 50, "result": "51–60 years", "events": () => RNG(10)},
	{"min": 100, "age": () => RNG(690) + 60, "result": "61 years or older", "events": () => RNG(12)} // max age = 750; max elven age
];

const LIFE_EVENTS = [
	{"min": 1, "max": 10, "result": "You suffered a tragedy. Roll on the Tragedies table."},
	{"min": 11, "max": 20, "result": "You gained a bit of good fortune. Roll on the Boons table."},
	{"min": 21, "max": 30, "result": "You fell in love or got married. If you get this result more than once, you can choose to have a child instead. Work with your DM to determine the identity of your love interest."},
	{"min": 31, "max": 40, "result": "You made an enemy of an adventurer. Roll a d6. An odd number indicates you are to blame for the rift, and an even number indicates you are blameless. Use the supplemental tables and work with your DM to determine this hostile character’s identity and the danger this enemy poses to you."},
	{"min": 41, "max": 50, "result": "You made a friend of an adventurer. Use the supplemental tables and work with your DM to add more detail to this friendly character and establish how your friendship began."},
	{"min": 51, "max": 70, "result": "You spent time working in a job related to your background. Start the game with an extra 2d6 gp."},
	{"min": 71, "max": 75, "result": "You met someone important. Use the supplemental tables to determine this character’s identity and how this individual feels about you. Work out additional details with your DM as needed to fit this character into your backstory."},
	{"min": 76, "max": 80, "result": "You went on an adventure. Roll on the Adventures table to see what happened to you. Work with your DM to determine the nature of the adventure and the creatures you encountered."},
	{"min": 81, "max": 85, "result": "You had a supernatural experience. Roll on the Supernatural Events table to find out what it was."},
	{"min": 86, "max": 90, "result": "You fought in a battle. Roll on the War table to learn what happened to you. Work with your DM to come up with the reason for the battle and the factions involved. It might have been a small conflict between your community and a band of orcs, or it could have been a major battle in a larger war."},
	{"min": 91, "max": 95, "result": "You committed a crime or were wrongly accused of doing so. Roll on the Crime table to determine the nature of the offense and on the Punishment table to see what became of you."},
	{"min": 96, "max": 99, "result": "You encountered something magical. Roll on the Arcane Matters table."},
	{"min": 100, "result": "Something truly strange happened to you. Roll on the Weird Stuff table."}
];

const LIFE_EVENTS_ADVENTURES = [
	{"min": 1, "max": 10, "result": "You nearly died. You have nasty scars on your body, and you are missing an ear, 1d3 fingers, or 1d4 toes."},
	{"min": 11, "max": 20, "result": "You suffered a grievous injury. Although the wound healed, it still pains you from time to time."},
	{"min": 21, "max": 30, "result": "You were wounded, but in time you fully recovered."},
	{"min": 31, "max": 40, "result": "You contracted a disease while exploring a filthy warren. You recovered from the disease, but you have a persistent cough, pockmarks on your skin, or prematurely gray hair."},
	{"min": 41, "max": 50, "result": "You were poisoned by a trap or a monster. You recovered, but the next time you must make a saving throw against poison, you make the saving throw with disadvantage."},
	{"min": 51, "max": 60, "result": "You lost something of sentimental value to you during your adventure. Remove one trinket from your possessions."},
	{"min": 61, "max": 70, "result": "You were terribly frightened by something you encountered and ran away, abandoning your companions to their fate."},
	{"min": 71, "max": 80, "result": "You learned a great deal during your adventure. The next time you make an ability check or a saving throw, you have advantage on the roll."},
	{"min": 81, "max": 90, "result": "You found some treasure on your adventure. You have 2d6 gp left from your share of it."},
	{"min": 91, "max": 99, "result": "You found a considerable amount of treasure on your adventure. You have 1d20 + 50 gp left from your share of it."},
	{"min": 100, "result": "You came across a common magic item (of the DM’s choice)."}
];

const SUPP_ALIGNMENT = [
	{"min": 1, "max": 3, "result": () => {return RNG(2) === 1 ? ["C", "E"] : ["C", "N"]}, "display": "Chaotic evil (50%) or chaotic neutral (50%)"},
	{"min": 4, "max": 5, "result": ["L", "E"], "display": "Lawful evil"},
	{"min": 6, "max": 8, "result": ["N", "E"], "display": "Neutral evil"},
	{"min": 9, "max": 12, "result": ["N"], "display": "Neutral"},
	{"min": 13, "max": 15, "result": ["N", "G"], "display": "Neutral good"},
	{"min": 16, "max": 17, "result": () => {return RNG(2) === 1 ? ["L", "G"] : ["L", "N"]}, "display": "Lawful good (50%) or lawful neutral (50%)"},
	{"min": 18, "result": () => {return RNG(2) === 1 ? ["C", "G"] : ["C", "N"]}, "display": "Chaotic good (50%) or chaotic neutral (50%)"}
];

const SUPP_DEATH = [
	{"min": 1, "result": "Cause unknown"},
	{"min": 2, "result": "Murdered"},
	{"min": 3, "result": "Killed in battle"},
	{"min": 4, "result": "Accident related to class or occupation"},
	{"min": 5, "result": "Accident unrelated to class or occupation"},
	{"min": 6, "max": 7, "result": "Natural causes, such as disease or old age"},
	{"min": 8, "result": "Apparent suicide"},
	{"min": 9, "result": () => `Torn apart by an animal or a natural disaster ${choose("animal", "natural disaster")}`, "display": "Torn apart by an animal or a natural disaster"},
	{"min": 10, "result": () => "Consumed by a monster"},
	{"min": 11, "result": () => `Executed for a crime or tortured to death ${choose("executed for a crime", "tortured to death")}`, "display": "Executed for a crime or tortured to death"},
	{"min": 12, "result": "Bizarre event, such as being hit by a meteorite, struck down by an angry god, or killed by a hatching slaad egg"}
];

const SUPP_CLASS = [
	{"min": 1, "max": 7, "result": "Barbarian"},
	{"min": 8, "max": 14, "result": "Bard"},
	{"min": 15, "max": 29, "result": "Cleric"},
	{"min": 30, "max": 36, "result": "Druid"},
	{"min": 37, "max": 52, "result": "Fighter"},
	{"min": 53, "max": 58, "result": "Monk"},
	{"min": 59, "max": 64, "result": "Paladin"},
	{"min": 65, "max": 70, "result": "Ranger"},
	{"min": 71, "max": 84, "result": "Rogue"},
	{"min": 85, "max": 89, "result": "Sorcerer"},
	{"min": 90, "max": 94, "result": "Warlock"},
	{"min": 95, "max": 100, "result": "Wizard"}
];

const SUPP_OCCUPATION = [
	{"min": 1, "max": 5, "result": "Academic"},
	{"min": 6, "max": 10, "result": () => `Adventurer (${rollSuppClass().result})`, "display": "Adventurer (roll on the Class table)"},
	{"min": 11, "result": "Aristocrat"},
	{"min": 12, "max": 26, "result": () => `Artisan or guild member ${choose("artisan", "guild member")}`, "display": "Artisan or guild member"},
	{"min": 27, "max": 31, "result": "Criminal"},
	{"min": 32, "max": 36, "result": "Entertainer"},
	{"min": 37, "max": 38, "result": () => `Exile, hermit, or refugee ${choose("exile", "hermit", "refugee")}`, "display": "Exile, hermit, or refugee"},
	{"min": 39, "max": 43, "result": () => `Explorer or wanderer ${choose("explorer", "wanderer")}`, "display": "Explorer or wanderer"},
	{"min": 44, "max": 55, "result": () => `Farmer or herder ${choose("farmer", "herder")}`, "display": "Farmer or herder"},
	{"min": 56, "max": 60, "result": () => `Hunter or trapper ${choose("hunter", "trapper")}`, "display": "Hunter or trapper"},
	{"min": 61, "max": 75, "result": "Laborer"},
	{"min": 76, "max": 80, "result": "Merchant"},
	{"min": 81, "max": 85, "result": () => `Politician or bureaucrat ${choose("politician", "bureaucrat")}`, "display": "Politician or bureaucrat"},
	{"min": 86, "max": 90, "result": "Priest"},
	{"min": 91, "max": 95, "result": "Sailor"},
	{"min": 96, "max": 100, "result": "Soldier"}
];

const SUPP_RACE = [
	{"min": 1, "max": 40, "result": "Human"},
	{"min": 41, "max": 50, "result": "Dwarf"},
	{"min": 51, "max": 60, "result": "Elf"},
	{"min": 61, "max": 70, "result": "Halfling"},
	{"min": 71, "max": 75, "result": "Dragonborn"},
	{"min": 76, "max": 80, "result": "Gnome"},
	{"min": 81, "max": 85, "result": "Half-elf"},
	{"min": 86, "max": 90, "result": "Half-orc"},
	{"min": 91, "max": 95, "result": "Tiefling"},
	{"min": 96, "max": 100, "result": "DM’s choice"}
];

const SUPP_RELATIONSHIP = [
	{"min": 3, "max": 4, "result": "Hostile"},
	{"min": 5, "max": 10, "result": "Friendly"},
	{"min": 11, "max": 12, "result": "Indifferent"}
];

const SUPP_STATUS = [
	{"min": 3, "result": () => {return `Dead (${rollSuppDeath().result.lowercaseFirst()})`}, "display": "Dead (roll on the Cause of Death table)", "dead": true},
	{"min": 4, "max": 5, "result": () => `Missing or status unknown ${choose("missing", "status unknown")}`, "display": "Missing or status unknown"},
	{"min": 6, "max": 8, "result": () => `Alive, but doing poorly due to injury, financial trouble, or relationship difficulties ${choose("injury", "financial trouble", "relationship difficulties")}`, "display": "Alive, but doing poorly due to injury, financial trouble, or relationship difficulties"},
	{"min": 9, "max": 12, "result": "Alive and well"},
	{"min": 13, "max": 15, "result": "Alive and quite successful"},
	{"min": 16, "max": 17, "result": "Alive and infamous"},
	{"min": 18, "result": "Alive and famous"}
];

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let classList;
let bgList;
let trinketList;
let $selCha;
let $selRace;
let $selBg;
let $selClass;
function onJsonLoad (data) {
	bgList = data.lifeBackground.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	classList = data.lifeClass.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	trinketList = data.lifeTrinket;

	$selRace = $(`#race`);
	$selCha = $(`#cha`);
	$selBg = $(`#background`);
	$selClass = $(`#class`);

	$selRace.append(`<option value="Random" selected>Random</option>`);
	$selRace.append(`<option value="Other">Other</option>`);
	RACES.forEach(r => $selRace.append(`<option value="${r}">${r}</option>`));
	for (let i = -5; i <= 5; ++i) {
		$selCha.append(`<option value="${i}" ${i === 0 ? "selected" : ""}>${i >= 0 ? "+": ""}${i}</option>`)
	}
	$selBg.append(`<option value="-1" selected>Random</option>`);
	bgList.forEach((b, i) => $selBg.append(`<option value="${i}">${b.name}</option>`));
	$selClass.append(`<option value="-1" selected>Random</option>`);
	classList.forEach((c, i) => $selClass.append(`<option value="${i}">${c.name}</option>`));
}

function roll () {
	function concatSentences (...lst) {
		const stack = [];
		lst.filter(it => it).forEach(it => {
			if (typeof it === "string" || typeof it === "number") {
				stack.push(it);
			} else if (typeof it === "function") {
				stack.push(it());
			} else { // array
				Array.prototype.push.apply(stack, ...it)
			}
		});
		return joinParaList(stack);
	}
	function joinParaList (lst) {
		return `<p>${lst.join(`</p><p>`)}</p>`;
	}
	$(`.output`).show();

	const selRace = $selRace.val();
	const race = selRace === "Random" ? RNG(100) > 48 ? rollOnArray(RACES) : "Other" : selRace; // 48/100 is the same odds as the spell "Reincarnate"

	// PARENTS
	const $parents = $(`#parents`);
	const knowParents = RNG(100) > 5;
	const knowParentsStr = knowParents ? "Parents: You know who your parents are or were." : "Parents: You do not know who your parents were.";

	let parentage = null;
	if (knowParents) {
		switch (race) {
			case "Half-Elf":
				parentage = `${race} parents: ${_getFromTable(PARENTS_HALF_ELF, RNG(8)).result}`;
				break;
			case "Half-Orc":
				parentage = `${race} parents: ${_getFromTable(PARENTS_HALF_ORC, RNG(8)).result}`;
				break;
			case "Tiefling":
				parentage = `${race} parents: ${_getFromTable(PARENTS_TIEFLING, RNG(8)).result}`;
				break;
		}
	}

	function getPersonDetails (doRace) {
		const status = rollSuppStatus();
		const align = rollSuppAlignment().result.map(it => Parser.dtAlignmentToFull(it)).join(" ");
		const occ = rollSuppOccupation().result;
		const relate = rollSuppRelationship().result;
		const out = [
			`Alignment: ${align}`,
			`Occupation: ${occ}`,
			`Relationship: ${relate}`,
			`Status: ${status.result}`
		];
		if (doRace) {
			const race = rollSuppRace().result;
			out.splice(index, 0, race);
		}
		return out;
	}

	$parents.html(concatSentences(`<p>Race: ${race}</p>`, knowParentsStr, parentage));
	if (knowParents) {
		const mum = getPersonDetails();
		const dad = getPersonDetails();
		$parents.append(`<p><b>Mother:</b></p>`);
		$parents.append(joinParaList(mum));
		$parents.append(`<p><b>Father:</b></p>`);
		$parents.append(joinParaList(dad));
	}

	// BIRTHPLACE
	const $birthplace = $(`#birthplace`);
	const rollBirth = RNG(100);
	const birth = `Birthplace: ${_getFromTable(BIRTHPLACES, rollBirth).result}`;

	const strangeBirth = RNG(100) === 100 ? "A strange event coincided with your birth: the moon briefly turning red, all the milk within a mile spoiling, the water in the area freezing solid in midsummer, all the iron in the home rusting or turning to silver, or some other unusual event of your choice" : "";
	$birthplace.html(concatSentences(birth, strangeBirth));

	// SIBLINGS
	const $siblings = $(`#siblings`);
	function getBirthOrder () {
		const rollBirthOrder = RNG(6) + RNG(6);
		if (rollBirthOrder < 3) {
			return "Twin, triplet, or quadruplet"
		} else if (rollBirthOrder < 8) {
			return "Older";
		} else {
			return "Younger";
		}
	}

	const rollSibCount = RNG(5);
	let sibCount = 0;
	switch (rollSibCount) {
		case 2:
			sibCount = RNG(3);
			break;
		case 3:
			sibCount = RNG(4) + 1;
			break;
		case 4:
			sibCount = RNG(6) + 2;
			break;
		case 5:
			sibCount = RNG(8) + 3;
			break;
	}
	if (race === "Elf" || race === "Dwarf") {
		sibCount = Math.max(sibCount - 2, 0);
	}

	if (sibCount > 0) {
		$siblings.empty();
		$siblings.append(`<p>You have ${sibCount} sibling${sibCount > 1 ? "s" : ""}.</p>`);
		for (let i = 0; i < sibCount; ++i) {
			$siblings.append(`<p><b>${getBirthOrder()} sibling ${choose("brother", "sister")}:</b></p>`);
			$siblings.append(joinParaList(getPersonDetails()));
		}
	} else {
		$siblings.html("You are an only child.");
	}

	// FAMILY
	const $family = $(`#family`);
	const $wrpFam = $(`<div><p>Family: ${_getFromTable(FAMILY, RNG(100)).result}</p></div>`);
	$family.empty();
	$family.append($wrpFam);
	let famIndex = 1;
	const $btnSuppFam = $(`<button class="btn btn-xs btn-default">Roll Supplemental Tables details</button>`).on("click", () => {
		const supDetails = getPersonDetails();
		const $wrpRes = $(`<div class="output-wrp-border"/>`);
		$wrpRes.append(`<p><b>Family Member Roll ${famIndex++}</b></p>`);
		$wrpRes.append(joinParaList(supDetails));
		$wrpFam.append($wrpRes);
	});
	$wrpFam.append(`<p>You can roll on the Relationship table to determine how your family members or other important figures in your life feel about you. You can also use the Race, Occupation, and Alignment tables to learn more about the family members or guardians who raised you.</p>`).append($(`<p>`).append($btnSuppFam));

	const rollFamLifestyle = _getFromTable(FAMILY_LIFESTYLE, RNG(6) + RNG(6) + RNG(6));
	$family.append(`<p>Family lifestyle: ${rollFamLifestyle.result}`);
	const rollFamHome = Math.min(Math.max(RNG(100) + rollFamLifestyle.modifier, 0), 111);
	const rollFamHomeRes = _getFromTable(CHILDHOOD_HOME, rollFamHome).result;
	$family.append(`<p>Childhood Home: ${rollFamHomeRes}</p>`);

	const rollChildMems = Math.min(Math.max(RNG(6) + RNG(6) + RNG(6) + Number($selCha.val()), 3), 18);
	$family.append(`<p>Childhood memories: ${_getFromTable(CHILDHOOD_MEMORIES, rollChildMems).result}`);

	// PERSONAL DECISIONS
	const $personal = $(`#personal`).empty();
	const selBg = Number($selBg.val());
	const myBg = selBg === -1 ? rollOnArray(bgList) : bgList[selBg];
	$personal.append(`<p>Background: ${myBg.name}</p>`);
	$personal.append(`<p>I became a ${myBg.name} because: ${rollOnArray(myBg.reasons)}</p>`);

	// CLASS TRAINING
	const $clss = $(`#clss`).empty();
	const selClass = Number($selClass.val());
	const myClass = selClass === -1 ? rollOnArray(classList) : classList[selClass];
	$clss.append(`<p>Class: ${myClass.name}</p>`);
	$clss.append(`<p>I became a ${myClass.name} because: ${rollOnArray(myClass.reasons)}</p>`);

	// LIFE EVENTS
	const $events = $(`#events`).empty();
	const age = _getFromTable(LIFE_EVENTS_AGE, RNG(100));
	$events.append(`<p>Current age: ${age.result} ${fmtChoice(`${age.age} year${age.age > 1 ? "s" : ""} old`)}</p>`);
	for (let i = 0; i < age.events; ++i ) {

	}
}