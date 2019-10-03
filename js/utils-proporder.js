"use strict";

class PropOrder {
	static getOrdered (obj, dataProp) {
		const order = (() => {
			switch (dataProp) {
				case "monster": return PropOrder.MONSTER;
				case "spell": return PropOrder.SPELL;
				default: throw new Error(`Unhandled prop "${dataProp}"`);
			}
		})();

		const out = {};
		const keySet = new Set(Object.keys(obj));
		const seenKeys = new Set();
		order.forEach(k => {
			seenKeys.add(k);
			if (keySet.has(k)) out[k] = obj[k];
		});
		// ensure any non-orderable keys are maintained
		const otherKeys = CollectionUtil.setDiff(keySet, seenKeys);
		[...otherKeys].forEach(k => out[k] = obj[k]);
		return out;
	}
}
PropOrder.MONSTER = [
	"name",
	"shortName",
	"alias",
	"group",

	"isNpc",
	"isNamedCreature",

	"source",
	"sourceSub",
	"page",
	"otherSources",

	"_copy",

	"level",
	"size",
	"type",
	"alignment",

	"ac",
	"hp",
	"speed",

	"str",
	"dex",
	"con",
	"int",
	"wis",
	"cha",

	"save",
	"skill",
	"senses",
	"passive",
	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",
	"languages",
	"cr",

	"spellcasting",
	"trait",
	"actionNote",
	"action",
	"reaction",
	"legendaryHeader",
	"legendaryActions",
	"legendary",
	"legendaryGroup",
	"variant",

	"environment",
	"fluff",
	"familiar",
	"dragonCastingColor",

	"tokenUrl",
	"soundClip",

	"altArt",

	"traitTags",
	"senseTags",
	"actionTags",
	"languageTags",
	"damageTags",
	"spellcastingTags",
	"miscTags"
];
PropOrder.SPELL = [
	"name",

	"source",
	"page",
	"otherSources",

	"level",
	"school",
	"subschools",
	"time",
	"range",
	"components",
	"duration",
	"meta",

	"entries",
	"entriesHigherLevel",

	"damageResist",
	"damageImmune",
	"damageVulnerable",

	"damageInflict",
	"conditionInflict",

	"spellAttack",
	"savingThrow",
	"opposedCheck",

	"miscTags",
	"areaTags",

	"classes",
	"races",
	"backgrounds"
];
