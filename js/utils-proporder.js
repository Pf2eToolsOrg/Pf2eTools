"use strict";

// TODO add deep sorting, e.g. "_copy" sections should be sorted
class PropOrder {
	/**
	 * @param obj
	 * @param dataProp
	 * @param [opts] Options object.
	 * @param [opts.fnUnhandledKey] Function to call on each unhandled key.
	 */
	static getOrdered (obj, dataProp, opts) {
		opts = opts || {};

		const order = PropOrder._PROP_TO_LIST[dataProp];
		if (!order) throw new Error(`Unhandled prop "${dataProp}"`);

		return this._getOrdered(obj, order, opts, dataProp);
	}

	static _getOrdered (obj, order, opts, path) {
		const out = {};
		const keySet = new Set(Object.keys(obj));
		const seenKeys = new Set();
		order.forEach(k => {
			if (typeof k === "string") {
				seenKeys.add(k);
				if (keySet.has(k)) out[k] = obj[k];
			} else {
				const key = k.key;

				seenKeys.add(key);

				if (keySet.has(key)) {
					if (!obj[key]) return out[key] = obj[key]; // Handle nulls

					if (k instanceof PropOrder._ObjectKey) {
						const nxtPath = `${path}.${key}`;
						if (k.fnGetOrder) out[key] = this._getOrdered(obj[key], k.fnGetOrder(), opts, nxtPath);
						else if (k.order) out[key] = this._getOrdered(obj[key], k.order, opts, nxtPath);
						else out[key] = obj[key];
					} else if (k instanceof PropOrder._ArrayKey) {
						const nxtPath = `${path}[n].${key}`;
						if (k.fnGetOrder) out[key] = obj[key].map(it => this._getOrdered(it, k.fnGetOrder(), opts, nxtPath));
						else if (k.order) out[key] = obj[key].map(it => this._getOrdered(it, k.order, opts, nxtPath));
						else out[key] = obj[key];

						if (k.fnSort && out[key] instanceof Array) out[key].sort(k.fnSort);
					} else throw new Error(`Unimplemented!`);
				}
			}
		});

		// ensure any non-orderable keys are maintained
		const otherKeys = CollectionUtil.setDiff(keySet, seenKeys);
		[...otherKeys].forEach(k => {
			out[k] = obj[k];
			if (opts.fnUnhandledKey) opts.fnUnhandledKey(`${path}.${k}`);
		});

		return out;
	}

	static hasOrder (dataProp) { return !!PropOrder._PROP_TO_LIST[dataProp]; }
}

PropOrder._ObjectKey = class {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
	}
};

PropOrder._ArrayKey = class {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 * @param [opts.fnSort] Function to sort arrays with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
		this.fnSort = opts.fnSort;
	}
};

PropOrder._TABLE = [
	"type",
	"name",
	"alias",
	"id",
	"source",
	"page",
	"otherSources",

	"rollable",
	"style",
	"minimizeTo",
	"labelRowIdx",
	"labelColIdx",
	"colSizes",
	"colStyles",
	"rowStyles",
	"cellStyles",
	"footStyles",
	"introStyles",
	"outroStyles",
	"spans",

	"intro",
	"rows",
	"footnotes",
	"outro",
];
PropOrder._ANCESTRY = [
	"name",
	"source",
	"page",
	"otherSources",

	"rarity",
	"hp",
	"size",
	"speed",
	"boosts",
	"flaw",
	"languages",
	"traits",
	"features",

	"flavor",
	"info",
	"heritageInfo",
	"heritage",

	new PropOrder._ObjectKey("summary", {
		order: [
			"text",
			"images",
		],
	}),
];
PropOrder._VE_HERITAGE = [
	"name",
	"source",
	"page",
	"otherSources",
	"versatile",

	"rarity",
	"traits",

	"entries",
	"info",
	"summary",
];
PropOrder._BACKGROUND = [
	"name",
	"source",
	"page",
	"otherSources",

	"traits",
	"entries",

	"boosts",
	"skills",
	"lore",
	"feats",
	"spells",
	"miscTags",
];
PropOrder._BACKGROUND_FLUFF = [
];
PropOrder._CLASS = [
	"name",
	"source",
	"page",
	"otherSources",

	"keyAbility",
	"hp",

	"initialProficiencies",
	"advancement",

	"classFeatures",
	"subclasses",

	"classFeaturesIntro",
	"flavor",
	"fluff",
	"summary",
	"rarity",
	"sampleBuilds",
];
PropOrder._CLASS_FEATURE = [
	"name",
	"source",
	"page",
	"className",
	"classSource",

	"subclasses",
	"level",
	"type",
	"entries",
];
PropOrder._SUBCLASS_FEATURE = [
	"name",
	"source",
	"page",
	"className",
	"classSource",

	"subclassShortName",
	"subclassSource",
	"level",
	"entries",
];
PropOrder._ARCHETYPE = [
	"name",
	"source",
	"page",
	"otherSources",

	"dedicationLevel",
	"rarity",

	"entries",
	"extraFeats",
	"benefits",
	"miscTags",
];
PropOrder._FEAT = [
	"name",
	"source",
	"page",
	"add_hash",
	"otherSources",

	"activity",
	"level",
	"featType",
	"traits",
	"prerequisites",
	"frequency",
	"trigger",
	"cost",
	"requirements",
	"access",

	"amp",
	"entries",
	"special",

	"leadsTo",
];
PropOrder._COMPANION = [
	"name",
	"source",
	"page",
	"otherSources",

	"type",
	"fluff",
	"access",
	"size",
	"attacks",
	new PropOrder._ObjectKey("abilityMods", {
		order: [
			"str",
			"dex",
			"con",
			"int",
			"wis",
			"cha",
		],
	}),
	"hp",
	"skill",
	"senses",
	"speed",
	"support",
	"maneuver",
	"traits",
	"special",
];
PropOrder._COMPANION_ABILITY = [
	"name",
	"source",
	"page",
	"tier",
	"traits",
	"entries",
];
PropOrder._FAMILIAR = [
	"name",
	"source",
	"page",
	"otherSources",

	"type",
	"traits",
	"access",
	"requires",
	"granted",
	"abilities",
	"fluff",
	"alignment",
];
PropOrder._FAMILIAR_ABILITY = [
	"name",
	"source",
	"page",
	"type",
	"entries",
];
PropOrder._EIDOLON = [
	"name",
	"type",
	"source",
	"page",
	"fluff",
	"tradition",
	"traits",
	"alignment",
	"home",
	"size",
	"suggestedAttacks",
	"stats",
	"skills",
	"senses",
	"languages",
	"speed",
	"abilities",
];
PropOrder._HAZARD = [
	"name",
	"source",
	"page",
	"otherSources",

	"level",
	"traits",
	"stealth",
	"perception",
	"abilities",
	"description",
	"disable",
	"defenses",
	"actions",
	"routine",
	"speed",
	"attacks",
	"reset",
];
PropOrder._ACTION = [
	"name",
	"alias",
	"source",
	"page",
	"add_hash",
	"otherSources",

	"activity",
	"traits",
	"actionType",
	"cost",
	"prerequisites",
	"frequency",
	"trigger",
	"requirements",

	"entries",
	"special",

	"info",
];
PropOrder._CREATURE = [
	"name",
	"alias",
	"isNpc",
	"hasImages",

	"source",
	"page",
	"description",
	"foundIn",
	"otherSources",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"creatureAdjustment",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._CREATURE__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"level",
	"traits",

	"perception",
	"senses",
	new PropOrder._ObjectKey("languages", {
		order: [
			"languages",
			"notes",
			"abilities",
		],
	}),
	"skills",
	new PropOrder._ObjectKey("abilityMods", {
		order: [
			"str",
			"dex",
			"con",
			"int",
			"wis",
			"cha",
		],
	}),
	"items",

	new PropOrder._ObjectKey("defenses", {
		order: [
			"ac",
			"savingThrows",
			"hp",
			"thresholds",
			"hardness",
			"immunities",
			"weaknesses",
			"resistances",
		],
	}),

	"speed",
	"attacks",
	"spellcasting",
	"rituals",
	new PropOrder._ObjectKey("abilities", {
		order: [
			"top",
			"mid",
			"bot",
		],
	}),
];
PropOrder._CREATURE__COPY_MOD = [
	"*",
	"_",
	...PropOrder._CREATURE,
];
PropOrder._CREATURE_FLUFF = [
	"name",
	"altName",

	"source",
	"page",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._CREATURE_FLUFF__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"entries",
	"images",
];
PropOrder._CREATURE_FLUFF__COPY_MOD = [
	"*",
	"_",
	...PropOrder._CREATURE_FLUFF,
];
PropOrder._CONDITION = [
	"name",
	"source",
	"page",
	"otherSources",

	"entries",
	"group",
];
PropOrder._ITEM = [
	"name",
	"source",
	"page",
	"add_hash",
	"otherSources",

	"equipment",
	"type",
	"level",

	"traits",

	"access",
	"price",
	"usage",
	"bulk",
	"ac",
	"ac2", // FIXME:
	"dexCap",
	"shieldData",
	"str",
	"checkPen",
	"speedPen",
	"activate",
	"onset",
	"ammunition",
	"damage",
	"damageType",
	"hands",
	"reload",
	"range",
	"ranged",
	"category",
	"subCategory",
	"group",
	"appliesTo",

	"perception",
	"communication",
	"skills",
	"abilityMods",
	"savingThrows",

	"entries",
	"craftReq",

	"generic",
	"variants",
	"genericItem",
	"_vmod",

	"weaponData",
	"comboWeaponData",
	"armorData",
	"siegeWeaponData",
	"destruction",
	"contract",
	"hasFluff",
	"special",
	"cost",
	"trigger",
	"requirements",
	"duration",
];
PropOrder._ITEM_FLUFF = [
	"name",
	"source",
	"page",

	"_copy",

	"entries",
	"images",
];
PropOrder._SPELL = [
	"name",
	"alias",

	"source",
	"page",
	"otherSources",

	"type",
	"focus",
	"level",
	"traits",
	"school",
	"domains",
	"traditions",
	"spellLists",
	"subclass",
	"cast",
	"components",
	"cost",
	"trigger",
	"requirements",
	"range",
	"area",
	"targets",
	"savingThrow",
	"savingThrowBasic",
	"duration",
	"sustain",
	"dismiss",

	"entries",

	"heightened",
	"amp",

	"miscTags",
];
PropOrder._AFFLICTION = [
	"name",
	"source",
	"page",
	"otherSources",

	"type",
	"level",
	"traits",
	"usage",
	"entries",
	"temptedCurse",
];
PropOrder._ABILITY = [
	"name",
	"source",
	"page",
	"add_hash",
	"otherSources",
	"creature",

	"activity",
	"traits",
	"requirements",
	"trigger",
	"frequency",

	"entries",
];
PropOrder._DEITY = [
	"name",
	"alias",
	"source",
	"page",
	"hasLore",
	"category",
	"otherSources",
	"core",

	"pantheonMembers",
	"areasOfConcern",
	"alignment",
	"edicts",
	"anathema",
	"font",
	"divineAbility",
	"domains",
	"alternateDomains",
	"spells",
	"divineSkill",

	"info",

	"favoredWeapon",
	"avatar",
	"followerAlignment",

	new PropOrder._ObjectKey("devoteeBenefits", {
		order: [
			"edicts",
			"anathema",
			"font",
			"ability",
			"skill",
			"domains",
			"alternateDomains",
			"spells",
			"weapon",
			"avatar",
		],
	}),

	"intercession",
	"entries",
	"images",
];
PropOrder._DEITY_FLUFF = [
	"name",
	"source",
	"page",

	"_copy",

	"entries",
	"lore",
];
PropOrder._LANGUAGE = [
	"name",
	"source",
	"page",
	"otherSources",

	"type",
	"typicalSpeakers",
	"regions",
	"entries",

	"fonts",
];
PropOrder._PLACE = [
	"name",
	"source",
	"page",
	"otherSources",

	"category",
	"level",
	"traits",
	"sections",
	"planeData",
	"entries",
	"settlementData",
	"residents",
	"description",
	"nationData",
];
PropOrder._RITUAL = [
	"name",
	"source",
	"page",
	"otherSources",

	"level",
	"traits",
	"cast",
	"cost",
	"secondaryCasters",
	"primaryCheck",
	"secondaryCheck",
	"requirements",
	"range",
	"area",
	"targets",
	"duration",

	"entries",
	"heightened",
];
PropOrder._VEHICLE = [
	"name",
	"source",
	"page",
	"otherSources",

	"level",
	"traits",
	"size",
	"price",
	"space",
	"crew",
	"passengers",
	"pilotingCheck",
	"defenses",
	"speed",
	"collision",
	"abilities",
	"entries",
	"passengersNote",
	"destruction",
];
PropOrder._TRAIT = [
	"name",
	"alias",
	"source",
	"page",
	"otherSources",

	"categories",
	"implies",
	"entries",
	"variable",
	"_data",
];
PropOrder._ADVENTURE = [
	"name",
	"id",
	"source",
	"coverUrl",
	"published",
	"storyline",
	"group",
	"level",
	"contents",
];
PropOrder._BOOK = [
	"name",
	"id",
	"source",
	"group",
	"coverUrl",
	"published",
	"author",
	"contents",
];
PropOrder._ORGANIZATION = [
	"name",
	"source",
	"page",

	"traits",
	"title",
	"scope",
	"goals",
	"headquarters",
	"keyMembers",
	"allies",
	"enemies",
	"assets",
	"requirements",
	"followerAlignment",
	"values",
	"anathema",
	"hasLore",
];
PropOrder._ORGANIZATION_FLUFF = [
	"name",
	"source",
	"page",

	"entries",
];
PropOrder._CREATURE_TEMPLATE = [
	"name",
	"type",
	"hasLore",
	"source",
	"page",

	"entries",
	"abilities",
	"optAbilities",
];
PropOrder._CREATURE_TEMPLATE_FLUFF = [
	"name",
	"source",
	"page",

	"_copy",

	"entries",
];
PropOrder._DOMAIN = [
	"name",
	"source",
	"page",

	"entries",
];
PropOrder._EVENT = [
	"name",
	"source",
	"page",

	"level",
	"traits",
	"applicableSkills",
	"entries",
];
PropOrder._GROUP = [
	"name",
	"type",
	"source",
	"page",

	"specialization",
];
PropOrder._OPTIONAL_FEATURE = [
	"name",
	"add_hash",
	"source",
	"page",

	"type",
	"traits",
	"prerequisite",
	"entries",
];
PropOrder._RELIC_GIFT = [
	"name",
	"add_hash",
	"source",
	"page",

	"tier",
	"traits",
	"aspects",
	"prerequisites",
	"entries",
	"itemTypes",
	"miscTags",
];
PropOrder._SKILL = [
	"name",
	"source",
	"page",

	"entries",
];
PropOrder._SOURCE = [
	"unreleased",
	"source",
	"date",
	"errata",
	"accessory",
	"store",
	"name",
	"adventure",
	"entries",
	"vanilla",
	"defaultSource",
];
PropOrder._VARIANTRULE = [
	"name",
	"source",
	"page",

	"category",
	"subCategory",
	"rarity",
	"entries",
];
PropOrder._PROP_TO_LIST = {
	"table": PropOrder._TABLE,
	"ancestry": PropOrder._ANCESTRY,
	"versatileHeritage": PropOrder._VE_HERITAGE,
	"background": PropOrder._BACKGROUND,
	"backgroundFluff": PropOrder._BACKGROUND_FLUFF,
	"class": PropOrder._CLASS,
	"classFeature": PropOrder._CLASS_FEATURE,
	"subclassFeature": PropOrder._SUBCLASS_FEATURE,
	"archetype": PropOrder._ARCHETYPE,
	"feat": PropOrder._FEAT,
	"companion": PropOrder._COMPANION,
	"companionAbility": PropOrder._COMPANION_ABILITY,
	"familiar": PropOrder._FAMILIAR,
	"familiarAbility": PropOrder._FAMILIAR_ABILITY,
	"hazard": PropOrder._HAZARD,
	"action": PropOrder._ACTION,
	"creature": PropOrder._CREATURE,
	"creatureFluff": PropOrder._CREATURE_FLUFF,
	"condition": PropOrder._CONDITION,
	"item": PropOrder._ITEM,
	"itemFluff": PropOrder._ITEM_FLUFF,
	"baseitem": PropOrder._ITEM,
	"spell": PropOrder._SPELL,
	"curse": PropOrder._AFFLICTION,
	"disease": PropOrder._AFFLICTION,
	"ability": PropOrder._ABILITY,
	"deity": PropOrder._DEITY,
	"deityFluff": PropOrder._DEITY_FLUFF,
	"language": PropOrder._LANGUAGE,
	"place": PropOrder._PLACE,
	"ritual": PropOrder._RITUAL,
	"vehicle": PropOrder._VEHICLE,
	"trait": PropOrder._TRAIT,
	"adventure": PropOrder._ADVENTURE,
	"book": PropOrder._BOOK,
	"organization": PropOrder._ORGANIZATION,
	"organizationFluff": PropOrder._ORGANIZATION_FLUFF,
	"creatureTemplate": PropOrder._CREATURE_TEMPLATE,
	"creatureTemplateFluff": PropOrder._CREATURE_TEMPLATE_FLUFF,
	"domain": PropOrder._DOMAIN,
	"event": PropOrder._EVENT,
	"group": PropOrder._GROUP,
	"optionalfeature": PropOrder._OPTIONAL_FEATURE,
	"relicGift": PropOrder._RELIC_GIFT,
	"skill": PropOrder._SKILL,
	"source": PropOrder._SOURCE,
	"variantrule": PropOrder._VARIANTRULE,
};

if (typeof module !== "undefined") {
	module.exports = PropOrder;
}
