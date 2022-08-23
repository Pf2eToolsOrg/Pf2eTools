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
	"name",
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
	"feat",
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
];
PropOrder._ARCHETYPE = [
	"name",
	"source",
	"page",
	"otherSources",

	"entries",
	"extraFeats",
	"benefits",
	"miscTags",
];
PropOrder._FEAT = [
	"name",
	"source",
	"page",
	"otherSources",
	"add_hash",

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
			"Str",
			"Dex",
			"Con",
			"Int",
			"Wis",
			"Cha",
		],
	}),
	"hp",
	"skill",
	"senses",
	"speed",
	"support",
	"maneuver",
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
];
PropOrder._HAZARD = [
	"name",
	"source",
	"page",
	"otherSources",

	"level",
	"traits",
	"stealth",
	"description",
	"disable",
	"defenses",
	"actions",
	"routine",
	"reset",
];
PropOrder._ACTION = [
	"name",
	"source",
	"page",
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

	"source",
	"page",
	"otherSources",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"_trait",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._CREATURE__COPY_MOD,
			}),
			"_preserve",
		],
	}),

	"level",
	"traits",
	// "creatureType", // Does removing this break anything?

	"perception",
	"senses",
	new PropOrder._ObjectKey("languages", {
		order: [
			"languages",
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

	"ac",
	"savingThrows",
	"hp",
	"hardness",
	"immunities",
	"weaknesses",
	"resistances",

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
PropOrder._CONDITION = [
	"name",
	"source",
	"page",
	"otherSources",

	"entries",
];
PropOrder._ITEM = [
	"name",
	"source",
	"page",
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
	"_vmod",
];
PropOrder._SPELL = [
	"name",

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
];
PropOrder._ABILITY = [
	"name",
	"source",
	"page",
	"otherSources",

	"activity",
	"traits",
	"requirements",
	"trigger",

	"entries",
];
PropOrder._DEITY = [
	"name",
	"alias",
	"source",
	"page",
	"otherSources",
	"core",

	"alignment",
	"category",
	"info",

	"edicts",
	"anathema",
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
	"hasLore",
	"images",
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
];
PropOrder._TRAIT = [
	"name",
	"source",
	"page",
	"otherSources",

	"categories",
	"implies",
	"entries",
	"_data",
];
PropOrder._PROP_TO_LIST = {
	"table": PropOrder._TABLE,
	"ancestry": PropOrder._ANCESTRY,
	"versatileHeritage": PropOrder._VE_HERITAGE,
	"background": PropOrder._BACKGROUND,
	"class": PropOrder._CLASS,
	"archetype": PropOrder._ARCHETYPE,
	"feat": PropOrder._FEAT,
	"companion": PropOrder._COMPANION,
	"familiar": PropOrder._FAMILIAR,
	"hazard": PropOrder._HAZARD,
	"action": PropOrder._ACTION,
	"creature": PropOrder._CREATURE,
	"condition": PropOrder._CONDITION,
	"item": PropOrder._ITEM,
	"baseitem": PropOrder._ITEM,
	"spell": PropOrder._SPELL,
	"curse": PropOrder._AFFLICTION,
	"disease": PropOrder._AFFLICTION,
	"ability": PropOrder._ABILITY,
	"deity": PropOrder._DEITY,
	"language": PropOrder._LANGUAGE,
	"place": PropOrder._PLACE,
	"ritual": PropOrder._RITUAL,
	"vehicle": PropOrder._VEHICLE,
	"trait": PropOrder._TRAIT,
};

if (typeof module !== "undefined") {
	module.exports = PropOrder;
}
