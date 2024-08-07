"use strict";

/*
	I have no idea what I am doing - MrVauxs
	For future reference: Preprepared tables with basic results, as per the Deep Backgrounds rule tables
	Now to actually build an UI around it... oh and switch case for the results to actually mean something.
*/

const RNG = RollerUtil.randomise;

function rollFamilySize () {
	return GenUtil.getFromTable(FAMILY_SIZE, RNG(100));
}

function rollHomeland () {
	return GenUtil.getFromTable(HOMELAND, RNG(20 + ancestryMod));
}

function rollMajorChEvent () {
	return GenUtil.getFromTable(MAJOR_CHILDHOOD_EVENT, RNG(20));
}

function rollInfAssociate () {
	return GenUtil.getFromTable(INFLUENCIAL_ASSOCIATE, RNG(20));
}

function rollInsRelationships () {
	return GenUtil.getFromTable(INSPIRING_RELATIONSHIPS, RNG(12));
}

function rollChalRelationships () {
	return GenUtil.getFromTable(CHALLENGING_RELATIONSHIPS, RNG(12));
}

const FAMILY_SIZE = [
	{min: 1, max: 4, result: [0, 0, 0]},
	{min: 5, max: 8, result: [0, 0, 1]},
	{min: 9, max: 20, result: [0, 0, 2]},
	{min: 21, max: 34, result: [0, 1, 3]},
	{min: 35, max: 39, result: [1, 2, 3]},
	{min: 40, max: 50, result: [1, 2, 4]},
	{min: 51, max: 60, result: [2, 3, 4]},
	{min: 61, max: 65, result: [2, 3, 5]},
	{min: 66, max: 69, result: [2, 4, 5]},
	{min: 70, max: 78, result: [3, 4, 5]},
	{min: 79, max: 80, result: [4, 4, 6]},
	{min: 81, max: 87, result: [4, 5, 6]},
	{min: 88, max: 90, result: [5, 5, 6]},
	{min: 91, max: 93, result: [5, 6, 7]},
	{min: 94, max: 95, result: [6, 6, 7]},
	{min: 96, max: 97, result: [6, 7, 7]},
	{min: 98, max: 99, result: [7, 7, 8]},
	{min: 100, max: 100, result: [8, 8, 8]},
];
const HOMELAND = [
	{min: -10, max: 1, result: "Underground"},
	{min: 2, max: 3, result: "Frontier"},
	{min: 4, max: 5, result: "Trade Town"},
	{min: 6, max: 7, result: "Simple Village"},
	{min: 8, max: 9, result: "Cosmopolitan City"},
	{min: 10, max: 11, result: "Metropolis"},
	{min: 12, max: 12, result: "Front Lines"},
	{min: 13, max: 14, result: "Itinerant"},
	{min: 15, max: 15, result: "Another Ancestry's Settlement"},
	{min: 16, max: 16, result: "Coastal Community"},
	{min: 17, max: 18, result: "Religious Community"},
	{min: 19, max: 30, result: "Academic Community"},
];
const MAJOR_CHILDHOOD_EVENT = [
	{min: 1, max: 1, result: "Abandoned in a Distant Land"},
	{min: 2, max: 2, result: "Academy Trained"},
	{min: 3, max: 3, result: "Attained a Magical Gift"},
	{min: 4, max: 4, result: "Betrayed"},
	{min: 5, max: 5, result: "Bullied"},
	{min: 6, max: 6, result: "Captured by Giants"},
	{min: 7, max: 7, result: "Claimed an Inheritance"},
	{min: 8, max: 8, result: "Died"},
	{min: 9, max: 9, result: "Fell In with a Bad Crowd"},
	{min: 10, max: 10, result: "Had an Ordinary Childhood"},
	{min: 11, max: 11, result: "Had Your First Kill"},
	{min: 12, max: 12, result: "Kidnapped"},
	{min: 13, max: 13, result: "Lost in the Wilderness"},
	{min: 14, max: 14, result: "Met a Fantastic Creature"},
	{min: 15, max: 15, result: "Raided"},
	{min: 16, max: 16, result: "Robbed"},
	{min: 17, max: 17, result: "Survived a Disaster"},
	{min: 18, max: 18, result: "Trained by a Mentor"},
	{min: 19, max: 19, result: "Witnessed War"},
	{min: 20, max: 20, result: "Won a Competition"},
];
const INFLUENCIAL_ASSOCIATE = [
	{min: 1, max: 1, result: "The Academic"},
	{min: 2, max: 2, result: "The Boss"},
	{min: 3, max: 3, result: "The Champion"},
	{min: 4, max: 4, result: "The Confidante"},
	{min: 5, max: 5, result: "The Crafter"},
	{min: 6, max: 6, result: "The Criminal"},
	{min: 7, max: 7, result: "The Dead One"},
	{min: 8, max: 8, result: "The Fiend"},
	{min: 9, max: 9, result: "The Fool"},
	{min: 10, max: 10, result: "The Hunter"},
	{min: 11, max: 11, result: "The Liege Lord"},
	{min: 12, max: 12, result: "The Lover"},
	{min: 13, max: 13, result: "The Mentor"},
	{min: 14, max: 14, result: "The Mercenary"},
	{min: 15, max: 15, result: "The Mystic"},
	{min: 16, max: 16, result: "The Pariah"},
	{min: 17, max: 17, result: "The Relative"},
	{min: 18, max: 18, result: "The Seer"},
	{min: 19, max: 19, result: "The Wanderer"},
	{min: 20, max: 20, result: "The Well-Connected Friend"},
];
const INSPIRING_RELATIONSHIPS = [
	{min: 1, max: 1, result: "Animal Helpers"},
	{min: 2, max: 2, result: "Comrade-in-Arms"},
	{min: 3, max: 3, result: "Desperate Intimidation"},
	{min: 4, max: 4, result: "Homelessness"},
	{min: 5, max: 5, result: "Kindly Witch"},
	{min: 6, max: 6, result: "Liberators"},
	{min: 7, max: 7, result: "Magician"},
	{min: 8, max: 8, result: "Missing Child"},
	{min: 9, max: 9, result: "Patron of the Arts"},
	{min: 10, max: 10, result: "Religious Students"},
	{min: 11, max: 11, result: "Timely Cure"},
	{min: 12, max: 12, result: "Wasteland Survivors"},
];
const CHALLENGING_RELATIONSHIPS = [
	{min: 1, max: 1, result: "Accidental Fall"},
	{min: 2, max: 2, result: "Accusation of Theft"},
	{min: 3, max: 3, result: "Called Before Judges"},
	{min: 4, max: 4, result: "Matter of Might"},
	{min: 5, max: 5, result: "Mercantile Expertise"},
	{min: 6, max: 6, result: "Privileged Position"},
	{min: 7, max: 7, result: "Relationship Ender"},
	{min: 8, max: 8, result: "Rival Trackers"},
	{min: 9, max: 9, result: "Seeking Accolades"},
	{min: 10, max: 10, result: "Slander"},
	{min: 11, max: 11, result: "Social Maneuvering"},
	{min: 12, max: 12, result: "Spy"},
];