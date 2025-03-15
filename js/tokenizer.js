"use strict";

class TokenizerUtils {
	// region config
	static get pageNumbers () {
		return [
			{regex: /^\d+\n/, type: "PAGE"},
		]
	}

	static get endData () {
		return [
			{regex: /^\n{2,}/, type: "END_DATA", mode: "default"},
			{regex: /^\s+$/, type: "END_DATA", mode: "default"},
		]
	}

	static get dataHeaders () {
		return [
			{regex: /^([^[]+?)\s?(\[[\w-]+\]\s)?(SPELL|CANTRIP|FOCUS) (\d{1,2})\s/, type: "SPELL", mode: "spell"},
			{regex: /^([^\n[]+?)\s?(\[[\w-]+]\s)?FEAT (\d{1,2})\s/, type: "FEAT", mode: "feat"},
			{regex: /^(.+)\s(ITEM|RUNE|MATERIAL|SNARE) (\d{1,2}\+?)\s/, type: "ITEM", mode: "item"},
			{regex: /^(.*?)\sBACKGROUND\s/, type: "BACKGROUND", mode: "background"},
			{regex: /^(.*?)\sCREATURE (–?\d{1,2})\s/, type: "CREATURE", mode: "creature"},
			{regex: /^(.*?)\sHAZARD (–?\d{1,2})\s/, type: "HAZARD", mode: "hazard"},
		]
	}
	static get unimplemented () {
		return [
			{regex: /^(.+)RITUAL[\s\S]*?\n{2,}/, type: "UNIMPLEMENTED"},
			{regex: /^(.+)VEHICLE[\s\S]*?\n{2,}/, type: "UNIMPLEMENTED"},
		]
	}

	static get traits () {
		return [
			{regex: /^MODULAR B, P, OR S\s/, type: "TRAIT"},
			{regex: /^[LNC][GNE]\s/, type: "TRAIT"},
			{regex: /^N\s/, type: "TRAIT"},
			{regex: /^[A-Z-]{3,}( [\dBPS])?\s/, type: "TRAIT"},
		]
	}

	static get access () {
		return [
			{regex: /^Access\s/, type: "ACCESS", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get activate () {
		return [
			{regex: /^Activate\b(?!—)/, type: "ACTIVATE", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Activation\b(?!—)/, type: "ACTIVATE", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get ammunition () {
		return [
			{regex: /^Ammunition\s/, type: "AMMUNITION", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get area () {
		return [
			{regex: /^Area\s/, type: "AREA", lookbehind: /(\n|[;.)\]]\s)$/},
		]
	}
	static get bulk () {
		return [
			{regex: /^Bulk\s/, type: "BULK", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get cast () {
		return [
			{regex: /^Cast(ing)?(?=\s|\[)/, type: "CAST", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get cost () {
		return [
			{regex: /^Cost\s/, type: "COST", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get duration () {
		return [
			{regex: /^Duration\s/, type: "DURATION", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get effect () {
		return [
			{regex: /^Effects?\s(?![^A-Z\W])/, type: "EFFECT", lookbehind: /(\n|[;.)\]]\s)$/, lookahead: true},
		]
	}
	static get frequency () {
		return [
			{regex: /^Frequency\s/, type: "FREQUENCY", lookbehind: /(\n|[;.)\]]\s)$/, lookaheadIncDepth: 3},
		]
	}
	static get level () {
		return [
			{regex: /^Level\s\d+[\s.;]/, type: "LEVEL", lookbehind: /(\n|[;.)]\s)$/, lookaheadIncDepth: 1},
		]
	}
	static get onset () {
		return [
			{regex: /^Onset\s/, type: "ONSET", lookbehind: /(\n|[;.)]\s)$/, lookaheadIncDepth: 2},
		]
	}
	static get prerequisites () {
		return [
			{regex: /^Prerequisites?\s/, type: "PREREQUISITES", lookbehind: /(\n|[;.)]\s)$/, lookaheadIncDepth: 3},
		]
	}
	static get price () {
		return [
			{regex: /^Price\s/, type: "PRICE", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get range () {
		return [
			{regex: /^Range\s/, type: "RANGE", lookbehind: /(\n|[;.)]\s)$/, lookaheadIncDepth: 3},
		]
	}
	static get requirements () {
		return [
			{regex: /^Requirements?\s/, type: "REQUIREMENTS", lookbehind: /(\n|[;.)\]]\s)$/, lookaheadIncDepth: 3},
		]
	}
	static get savingThrow () {
		return [
			{regex: /^(?:Saving Throw|Defense)\s/, type: "SAVING_THROW", lookbehind: /(\n|[;.)]\s)$/, lookaheadIncDepth: 2},
		]
	}
	static get shieldData () {
		return [
			{regex: /^The\sshield\shas\sHardness\s\d+,\sHP\s\d+,\sand\sBT\s\d+.?\s/i, type: "SHIELD_DATA"},
		]
	}
	static get targets () {
		return [
			{regex: /^Targets?\s/, type: "TARGETS", lookbehind: /(\n|[;.)\]]\s)$/, lookaheadIncDepth: 3},
		]
	}
	static get traditions () {
		return [
			{regex: /^Traditions?\s/, type: "TRADITIONS", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get traditionsSubclasses () {
		return [
			{regex: /^Domains?\s/, type: "DOMAIN", class: "Cleric", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Myster(y|ies)\s/, type: "MYSTERY", class: "Oracle", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Patrons?\s/, type: "PATRON", class: "Witch", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Lessons?\s/, type: "LESSON", class: "Witch", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Muses?\s/, type: "MUSE", class: "Bard", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get trigger () {
		return [
			{regex: /^Trigger\s/, type: "TRIGGER", lookbehind: /(\n|[;.)\]]\s)$/, lookaheadIncDepth: 3},
		]
	}
	static get category () {
		return [
			{regex: /^Category\s/, type: "CATEGORY", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get usage () {
		return [
			{regex: /^Usage\s/, type: "USAGE", lookbehind: /(\n|[;.)]\s)$/},
		]
	}

	static get perception () {
		return [
			{regex: /^Perception\s(\+?\d+)[;,.\s]/, type: "PERCEPTION", lookbehind: /\n$/},
		]
	}
	static get languages () {
		return [
			{regex: /^Languages?\s/, type: "LANGUAGES", lookbehind: /\n$/},
		]
	}

	static get skillsProp () {
		return [
			{regex: /^Skills\s/, type: "SKILLS", lookbehind: /\n$/, mode: "cr_skills"},
		]
	}
	static get skills () {
		return [
			{regex: /^Acrobatics\s/, type: "ACROBATICS"},
			{regex: /^Arcana\s/, type: "ARCANA"},
			{regex: /^Athletics\s/, type: "ATHLETICS"},
			{regex: /^Crafting\s/, type: "CRAFTING"},
			{regex: /^Deception\s/, type: "DECEPTION"},
			{regex: /^Diplomacy\s/, type: "DIPLOMACY"},
			{regex: /^Intimidation\s/, type: "INTIMIDATION"},
			{regex: /^Intimidate\s/, type: "INTIMIDATION"},
			{regex: /^([A-Z][a-z]*?)\sLore\s/, type: "LORE"},
			// We are back with ugly regex
			{regex: /^((?:\b[\w'-]*?\s)+)Lore\s/, type: "LORE"},
			{regex: /^Lore\s+\(.*?\)\s/, type: "LORE_SOME"},
			{regex: /^Lore\s/, type: "LORE_ALL"},
			{regex: /^Medicine\s/, type: "MEDICINE"},
			{regex: /^Nature\s/, type: "NATURE"},
			{regex: /^Occultism\s/, type: "OCCULTISM"},
			{regex: /^Performance\s/, type: "PERFORMANCE"},
			{regex: /^Religion\s/, type: "RELIGION"},
			{regex: /^Society\s/, type: "SOCIETY"},
			{regex: /^Stealth\s/, type: "STEALTH"},
			{regex: /^Survival\s/, type: "SURVIVAL"},
			{regex: /^Thievery\s/, type: "THIEVERY"},
		]
	}
	static get items () {
		return [
			{regex: /^Items\s/, type: "ITEMS", lookbehind: /\n$/},
		]
	}
	// TODO: Split this into pattern for each score?
	static get creatureAbilityScores () {
		return [
			{regex: /^Str\s(.*?)\sDex\s(.*?)\sCon\s(.*?)\sInt\s(.*?)\sWis\s(.*?)\sCha\s(.*?)\n/, type: "CR_ABILITY_SCORES", lookbehind: /\n$/},
		]
	}
	static get ac () {
		return [
			{regex: /^AC\s/, type: "AC", lookbehind: /\n$/},
		]
	}
	static get fort () {
		return [
			{regex: /^Fort\s/, type: "FORTITUDE", lookbehind: /[;,]\s$/},
		]
	}
	static get ref () {
		return [
			{regex: /^Ref\s/, type: "REFLEX", lookbehind: /[;,]\s$/},
		]
	}
	static get will () {
		return [
			{regex: /^Will\s/, type: "WILL", lookbehind: /[;,]\s$/},
		]
	}
	static get creatureSavingThrows () {
		return [
			...this.fort,
			...this.ref,
			...this.will,
		]
	}
	static get hp () {
		return [
			{regex: /^HP\s/, type: "HP", lookbehind: /\n$/, prev: {depth: 10, types: [...this.creatureSavingThrows.map(it => it.type)]}},
		]
	}
	static get thresholds () {
		return [
			{regex: /^Thresholds\s/, type: "THRESHOLDS", lookbehind: /(\n|[;,.)]\s)$/},
		]
	}
	static get resistances () {
		return [
			{regex: /^Resistances\s/, type: "RESISTANCES", lookbehind: /(\n|[;,.)]\s)$/},
		]
	}
	static get weaknesses () {
		return [
			{regex: /^Weaknesses\s/, type: "WEAKNESSES", lookbehind: /(\n|[;,.)]\s)$/},
		]
	}
	static get immunities () {
		return [
			{regex: /^Immunities\s/, type: "IMMUNITIES", lookbehind: /(\n|[;,.)]\s)$/},
		]
	}
	static get hardness () {
		return [
			{regex: /^Hardness\s/, type: "HARDNESS", lookbehind: /(\n|[;,.)]\s)$/, prev: {depth: 10, types: ["HP"]}},
		]
	}
	static get speed () {
		return [
			{regex: /^Speed\s(?![A-Z])/, type: "SPEED", lookbehind: /\n$/},
		]
	}
	static get damage () {
		return [
			{regex: /^Damage\s/, type: "DAMAGE", prev: {depth: 10, types: [...this.attacks.map(it => it.type)]}},
			// TODO/FIXME: Some creature attacks don't actually deal damage, but our data doesn't care about that
			{regex: /^Effect\s/, type: "DAMAGE", prev: {depth: 10, types: [...this.attacks.map(it => it.type)]}},
		]
	}
	static get attacks () {
		return [
			{regex: /^Melee\b(?!\s?[A-Z])/, type: "MELEE", lookbehind: /(\n|action?]\s?)$/},
			{regex: /^Ranged\b(?!\s?[A-Z])/, type: "RANGED", lookbehind: /(\n|action?]\s?)$/},
		]
	}
	// TODO: Improve this pattern... need to catch "Arcane Spontaneous Spells", "Occult Spells", "Champion Devotion Spells", etc.
	// Are there more abilities like the devourer's (AoA #4) "Soul Spells" OR messed up spell casting features?
	// We would need to predict or test next tokens to do this cleanly. Other alternative is checking while converting (easier)
	static get spellCasting () {
		return [
			{regex: /^((?:Arcane|Divine|Occult|Primal)\s(?:Innate|Prepared|Spontaneous)?)\s?Spells?/, type: "SPELL_CASTING", lookbehind: /\n$/, mode: "cr_spells"},
			{regex: /^((?:Innate|Prepared|Spontaneous)\s(?:Arcane|Divine|Occult|Primal)?)\s?Spells?/, type: "SPELL_CASTING", lookbehind: /\n$/, mode: "cr_spells"},
			{regex: /^((?:[A-Z][a-z]+\s)+Spells)\s(?![A-Z][a-z])/, type: "SPELL_CASTING", lookbehind: /\n$/, mode: "cr_spells"},
			{regex: /^(Witch Hexes)/, type: "SPELL_CASTING", lookbehind: /\n$/, mode: "cr_spells"},
		]
	}
	static get cantrips () {
		return [
			{regex: /^Cantrips\s/, type: "CANTRIPS"},
			{regex: /^Hex\sCantrips?\s/, type: "CANTRIPS"},
		]
	}
	static get constant () {
		return [
			{regex: /^Constant\s/, type: "CONSTANT"},
		]
	}
	static get spellDC () {
		return [
			{regex: /^DC\s(\d+)[;,.]\s/, type: "SPELL_DC"},
		]
	}
	static get spellAttack () {
		return [
			{regex: /^attack\s\+(\d+)[;,.]\s/, type: "SPELL_ATTACK"},
		]
	}
	static get focusPoints () {
		return [
			{regex: /^\(\d\sFocus\sPoints?\)[\s;,]/i, type: "FOCUS_POINT"},
			{regex: /^\d\sFocus\sPoints?[\s;,]/, type: "FOCUS_POINT"},
		]
	}
	static get ritualCasting () {
		return [
			{regex: /^((?:[A-Z][a-z]+ )+)Rituals\s/, type: "RITUAL_CASTING", lookbehind: /\n$/, mode: "cr_spells"},
			{regex: /^(Rituals)\s/, type: "RITUAL_CASTING", lookbehind: /\n$/, mode: "cr_spells"},
		]
	}

	static get stealth () {
		return [
			{regex: /^Stealth\s/, type: "HAZARD_STEALTH", lookbehind: /\n$/, mode: "h_stealth"},
		]
	}
	static get description () {
		return [
			{regex: /^Description\s/, type: "DESCRIPTION", lookbehind: /\n$/},
		]
	}
	static get disable () {
		return [
			{regex: /^Disable\s/, type: "DISABLE", lookbehind: /\n$/},
		]
	}
	static get hazardHP () {
		return [
			{regex: /^([A-Z]\w+\s)?HP\s(\d+)[\s;,.]/, type: "HAZARD_HP"},
		]
	}
	static get hazardBT () {
		return [
			{regex: /^\(BT\s\d+\)[\s;,.]/, type: "HAZARD_BT", prev: {depth: 1, types: [...this.hazardHP.map(it => it.type)]}},
		]
	}
	static get hazardHardness () {
		return [
			{regex: /^([A-Z]\w+\s)?Hardness\s(\d+)[\s;,.]/, type: "HAZARD_HARDNESS"},
		]
	}
	static get atkNoMAP () {
		return [
			{regex: /^no multiple attack penalty/, type: "ATK_NO_MAP"},
		]
	}
	static get reset () {
		return [
			{regex: /^Reset/, type: "RESET", lookbehind: /\n$/},
		]
	}
	static get routine () {
		return [
			{regex: /^Routine/, type: "ROUTINE", lookbehind: /\n$/},
		]
	}

	// TODO: propertiesSpells and propertiesFeats dont seem quite right...
	static get properties () {
		return [
			...this.access,
			...this.activate,
			...this.ammunition,
			...this.area,
			...this.bulk,
			...this.cast,
			...this.cost,
			...this.duration,
			...this.effect,
			...this.frequency,
			...this.onset,
			...this.prerequisites,
			...this.price,
			...this.range,
			...this.requirements,
			...this.savingThrow,
			...this.shieldData,
			...this.targets,
			...this.traditions,
			...this.traditionsSubclasses,
			...this.trigger,
			...this.category,
			...this.usage,
		]
	}
	static get propertiesSpells () {
		return [
			...this.access,
			...this.area,
			...this.cast,
			...this.cost,
			...this.duration,
			...this.effect,
			...this.frequency,
			...this.range,
			...this.requirements,
			...this.savingThrow,
			...this.targets,
			...this.traditions,
			...this.traditionsSubclasses,
			...this.trigger,
		]
	}
	static get propertiesFeats () {
		return [
			...this.access,
			...this.activate,
			...this.cost,
			...this.effect,
			...this.frequency,
			...this.prerequisites,
			...this.range,
			...this.requirements,
			...this.trigger,
		]
	}
	static get propertiesAbilities () {
		return [
			...this.activate,
			...this.area,
			...this.cost,
			...this.effect,
			...this.frequency,
			...this.range,
			...this.requirements,
			...this.targets,
			...this.trigger,
		]
	}
	static get propertiesItems () {
		return [
			...this.access,
			...this.activate,
			...this.ammunition,
			...this.bulk,
			...this.cost,
			...this.duration,
			...this.effect,
			...this.frequency,
			...this.level,
			...this.onset,
			...this.prerequisites,
			...this.price,
			...this.range,
			...this.requirements,
			...this.shieldData,
			...this.targets,
			...this.trigger,
			...this.usage,
			...this.category,
		]
	}
	static get propertiesBackgrounds () {
		return [
			...this.access,
			...this.propertiesAbilities,
		]
	}
	static get propertiesItemVariants () {
		return [
			...this.bulk,
			...this.level,
			...this.craftRequirements,
			...this.price,
			...this.shieldData,
		]
	}
	static get propertiesCreatures () {
		return [
			...this.perception,
			...this.languages,
			...this.skillsProp,
			...this.items,
			...this.creatureAbilityScores,
			...this.ac,
			...this.creatureSavingThrows,
			...this.hp,
			...this.thresholds,
			...this.resistances,
			...this.weaknesses,
			...this.immunities,
			...this.hardness,
			...this.speed,
			...this.attacks,
			...this.damage,
			...this.spellCasting,
			...this.ritualCasting,
		]
	}
	static get propertiesHazards () {
		return [
			...this.stealth,
			...this.description,
			...this.disable,
			...this.ac,
			...this.creatureSavingThrows,
			...this.hazardHardness,
			...this.hazardHP,
			...this.hazardBT,
			...this.immunities,
			...this.weaknesses,
			...this.resistances,
			...this.attacks,
			...this.damage,
			...this.atkNoMAP,
			...this.reset,
			...this.routine,
		]
	}

	static get itemVariants () {
		return [
			{regex: /^Type\s/, type: "ITEM_VARIANT", lookbehind: /\n$/},
		]
	}

	static get successDegrees () {
		return [
			{regex: /^Critical\sSuccess\s/, type: "CRIT_SUCCESS"},
			{regex: /^Success\s/, type: "SUCCESS"},
			{regex: /^Failure\s/, type: "FAILURE"},
			{regex: /^Critical\sFailure\s/, type: "CRIT_FAILURE"},
		]
	}

	static get amp () {
		return [
			{regex: /^Amp Heightened\s\(\+\d+\)[\s:]/, type: "AMP_HEIGHTENED_PLUS_X", lookbehind: /\n$/},
			{regex: /^Amp Heightened\s\(\d+(st|nd|rd|th)\)[\s:]/, type: "AMP_HEIGHTENED_X", lookbehind: /\n$/},
			{regex: /^Amp Heightened[\s:]/, type: "AMP_HEIGHTENED", lookbehind: /\n$/},
			{regex: /^Amp[\s:]/, type: "AMP", lookbehind: /\n$/},
		]
	}
	static get heightened () {
		return [
			{regex: /^Heightened\s\(\+\d+\)[\s:]/, type: "HEIGHTENED_PLUS_X"},
			{regex: /^Heightened\s\(\d+(st|nd|rd|th)\)[\s:]/, type: "HEIGHTENED_X"},
			{regex: /^Heightened[\s:]/, type: "HEIGHTENED"},
		]
	}

	static get lvlEffect () {
		return [
			{regex: /^\n\d+(st|nd|rd|th).\d+(st|nd|rd|th)\s/, type: "LVL_EFFECT_RANGE"},
			{regex: /^\n\d+(st|nd|rd|th)\sor\sHigher\s/, type: "LVL_EFFECT_RANGE"},
			{regex: /^\n\d+(st|nd|rd|th)\sor\sLower\s/, type: "LVL_EFFECT_RANGE"},
			{regex: /^\n\d+(st|nd|rd|th)\s/, type: "LVL_EFFECT_RANGE"},
		]
	}

	static get craftRequirements () {
		return [
			{regex: /^Craft\sRequirements?\s/, type: "CRAFT_REQUIREMENTS"},
		]
	}

	static get stage () {
		return [
			{regex: /^Stage\s\d+\s/, type: "STAGE", lookbehind: /(\n|[;.)\]]\s)$/, lookahead: true},
		]
	}
	static get afflictions () {
		return [
			{regex: /^Maximum\sDuration\s/, type: "MAX_DURATION", lookaheadIncDepth: 2},
			...this.stage,
			...this.onset,
			...this.savingThrow,
			...this.level,
		]
	}

	static get special () {
		return [
			{regex: /^Special\s/, type: "SPECIAL", lookbehind: /\n$/},
		]
	}

	static get actions () {
		return [
			{regex: /^\[one.action][\s;,.]?/, type: "ACTION", lookaheadIncDepth: 1},
			{regex: /^\[two.actions?][\s;,.]?/, type: "TWO_ACTIONS", lookaheadIncDepth: 1},
			{regex: /^\[three.actions?][\s;,.]?/, type: "THREE_ACTIONS", lookaheadIncDepth: 1},
			{regex: /^\[reaction][\s;,.]/, type: "REACTION", lookaheadIncDepth: 1},
			{regex: /^\[free.action][\s;,.]/, type: "FREE_ACTION", lookaheadIncDepth: 1},
			{regex: /^\[>][\s;,.]/, type: "ACTION", lookaheadIncDepth: 1},
			{regex: /^\[>>][\s;,.]/, type: "TWO_ACTIONS", lookaheadIncDepth: 1},
			{regex: /^\[>>>][\s;,.]/, type: "THREE_ACTIONS", lookaheadIncDepth: 1},
			{regex: /^\[R][\s;,.]/i, type: "REACTION", lookaheadIncDepth: 1},
			{regex: /^\[F][\s;,.]/i, type: "FREE_ACTION", lookaheadIncDepth: 1},
			{regex: /^:a:[\s;,.]/, type: "ACTION", lookaheadIncDepth: 1},
			{regex: /^:aa:[\s;,.]/, type: "TWO_ACTIONS", lookaheadIncDepth: 1},
			{regex: /^:aaa:[\s;,.]/, type: "THREE_ACTIONS", lookaheadIncDepth: 1},
			{regex: /^:r:[\s;,.]/, type: "REACTION", lookaheadIncDepth: 1},
			{regex: /^:f:[\s;,.]/, type: "FREE_ACTION", lookaheadIncDepth: 1},
		]
	}

	static get parenthesis () {
		return [
			// Preventing dangling commas and semi-colons (word token) in many stat-blocks
			{regex: /^\(.*?\)[.,;]?/s, type: "PARENTHESIS"},
		]
	}

	static get listMarker () {
		return [
			{regex: /^•/, type: "LIST_MARKER"},
		]
	}

	static get genericEntries () {
		return [
			...this.listMarker,
			...this.parenthesis,
		]
	}

	static get words () {
		return [
			{regex: /^[\S]*;(?=\s*\n)/, type: "WORD_SEMICOLON_NEWLINE"},
			{regex: /^[\S]*;/, type: "WORD_SEMICOLON"},
			{regex: /^[\S]*[.!?:](?=\s*\n)/, type: "WORD_TERM_NEWLINE"},
			{regex: /^[\S]*[.!?:]/, type: "WORD_TERM"},
			{regex: /^[\S]+(?=\s*\n)/, type: "WORD_NEWLINE"},
			{regex: /^[\S]+/, type: "WORD"},
		]
	}

	static get defaultConfig () {
		return {
			default: [
				...this.pageNumbers,

				// DATA HEADERS
				...this.dataHeaders,
				...this.unimplemented,

				{regex: /^\s+/, type: null},
			],
			spell: [
				...this.endData,

				// PROPERTIES
				...this.propertiesSpells,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
				...this.amp,
				...this.heightened,
				...this.afflictions,
				...this.lvlEffect,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
			feat: [
				...this.endData,

				// PROPERTIES
				...this.propertiesFeats,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
				...this.afflictions,
				...this.special,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
			item: [
				...this.endData,

				// PROPERTIES
				...this.propertiesItems,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
				...this.afflictions,
				...this.craftRequirements,
				...this.itemVariants,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
			background: [
				...this.endData,

				// PROPERTIES
				...this.propertiesBackgrounds,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
			creature: [
				...this.endData,

				// PROPERTIES
				...this.propertiesCreatures,
				...this.propertiesAbilities,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
				...this.afflictions,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
			cr_skills: [
				...this.skills,
				...this.parenthesis,
				{regex: /^\+\s?\d+/, type: "SKILL_BONUS"},
				{regex: /^[,;]\s/, type: null},
				{regex: /^\s+/, type: null},
			],
			cr_spells: [
				...this.endData,
				...this.cantrips,
				...this.constant,
				...this.spellDC,
				...this.spellAttack,
				...this.focusPoints,
				{regex: /^\d+\sslots?/, type: "CR_SPELL_SLOTS"},
				{regex: /^\(\d+\sslots?\)/, type: "CR_SPELL_SLOTS"},
				{regex: /^\d+(st|nd|rd|th)/, type: "CR_SPELL_LEVEL"},
				{regex: /^\(\d+(st|nd|rd|th)\)/, type: "CR_SPELL_LEVEL"},
				{regex: /^\(([x×](\d+)|at will)\)/, type: "CR_SPELL_AMOUNT"},
				{regex: /^([a-z][a-z-'’*!?]+\s?)+([A-Z\d]{2,})?/, type: "CR_SPELL"},
				{regex: /^[A-Z]([a-z-'’*!?]+\s?)+/, type: "CR_SPELL", prev: {depth: 1, types: ["SPELL_CASTING", "RITUAL_CASTING", "CR_SPELL_LEVEL", "CR_SPELL_SLOTS", "SPELL_DC", "CONSTANT", "CANTRIPS", "SPELL_ATTACK", "FOCUS_POINT"]}},
				...this.parenthesis,
				{regex: /^[,;]\s/, type: null},
				{regex: /^\s+/, type: null},
			],
			hazard: [
				...this.endData,

				// PROPERTIES
				...this.propertiesHazards,
				...this.propertiesAbilities,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
				...this.afflictions,

				// Generic
				...this.actions,
				...this.genericEntries,
				...this.words,
				{regex: /^\s+/, type: null},
			],
			h_stealth: [
				{regex: /^\+\s?\d+/, type: "H_STEALTH_BONUS"},
				{regex: /^DC\s\d+/, type: "H_STEALTH_DC"},
				{regex: /^\((untrained|trained|expert|master|legendary)\)/i, type: "H_STEALTH_MINPROF"},
				{regex: /^[,;]\s/, type: null},
				{regex: /^\s+/, type: null},
			],
		}
	}
	// endregion

	// region utilities
	static get spellComponents () {
		return {
			F: /focus/,
			S: /somatic/,
			M: /material/,
			V: /verbal/,
		}
	}

	static get rangeUnits () {
		return [
			{regex: /touch/, unit: "touch"},
			{regex: /feet/, unit: "feet"},
			{regex: /ft\./, unit: "feet"},
			{regex: /mile/, unit: "mile"},
			{regex: /planetary/, unit: "planetary"},
			{regex: /interplanar/, unit: "interplanar"},
			{regex: /unlimited/, unit: "unlimited"},
		]
	}

	static get timeUnits () {
		return [
			{regex: /turns?/, unit: "turn"},
			{regex: /rounds?/, unit: "round"},
			{regex: /minutes?/, unit: "minute"},
			{regex: /hours?/, unit: "hour"},
			{regex: /days?/, unit: "day"},
			{regex: /weeks?/, unit: "week"},
			{regex: /months?/, unit: "month"},
			{regex: /years?/, unit: "year"},
			{regex: /unlimited/, unit: "unlimited"},
		];
	}

	static get areaTypes () {
		return [
			{regex: /emanation/i, type: "Emanation"},
			{regex: /cone/i, type: "Cone"},
			{regex: /burst/i, type: "Burst"},
			{regex: /cylinder/i, type: "Cylinder"},
		];
	}

	static get savingThrows () {
		return [
			{regex: /Fortitude/, unit: "Fort", full: "Fortitude", short: "F"},
			{regex: /Fort/, unit: "Fort", full: "Fortitude", short: "F"},
			{regex: /Reflex/, unit: "Reflex", full: "Reflex", short: "R"},
			{regex: /Will/, unit: "Will", full: "Will", short: "W"},
			{regex: /AC/, unit: "AC", full: "AC", short: "AC"},
		]
	}
	static get abilityScores () {
		return [
			{regex: /Strength/, unit: "str", full: "Strength"},
			{regex: /Dexterity/, unit: "dex", full: "Dexterity"},
			{regex: /Constitution/, unit: "con", full: "Constitution"},
			{regex: /Intelligence/, unit: "int", full: "Intelligence"},
			{regex: /Wisdom/, unit: "wis", full: "Wisdom"},
			{regex: /Charisma/, unit: "cha", full: "Charisma"},
		]
	}

	static get sensesTypes () {
		return [
			{regex: /imprecise/, type: "imprecise"},
			{regex: /precise/, type: "precise"},
			{regex: /vague/, type: "vague"},
		]
	}

	static get activateComponents () {
		return [
			{regex: /command/, unit: "command"},
			{regex: /envision/, unit: "envision"},
			{regex: /interact/i, unit: "Interact"},
			{regex: /cast a spell/i, unit: "Cast a Spell"},
		]
	}

	static get itemCategories () {
		return [
			{cat: "Adjustment"},
			{cat: "Adventuring Gear"},
			{cat: "Ammunition"},
			{cat: "Apex"},
			{cat: "Artifact"},
			{cat: "Assistive Item"},
			{cat: "Bomb"},
			{cat: "Companion"},
			{cat: "Contract"},
			{cat: "Curse"},
			{cat: "Customization"},
			{cat: "Elixir"},
			{cat: "Grimoire"},
			{cat: "Material"},
			{cat: "Oil"},
			{cat: "Poison"},
			{cat: "Potion"},
			{cat: "Rune"},
			{cat: "Scroll"},
			{cat: "Shield"},
			{cat: "Siege Weapon"},
			{cat: "Snare"},
			{cat: "Spellheart"},
			{cat: "Staff"},
			{cat: "Missive"},
			{cat: "Structure"},
			{cat: "Talisman"},
			{cat: "Tattoo"},
			{cat: "Tool"},
			{cat: "Wand"},
			// Low priority:
			{cat: "Armor", reUsage: /^Worn Armor/i},
			{cat: "Weapon"},
			{cat: "Consumable"},
			{cat: "Held", reUsage: /^Held/i},
			{cat: "Worn", reUsage: /^Worn/i},
			{cat: "Other"},
		]
	}

	static get spellTraditions () {
		return [
			{regex: /Arcane/, unit: "Arcane"},
			{regex: /Occult/, unit: "Occult"},
			{regex: /Divine/, unit: "Divine"},
			{regex: /Primal/, unit: "Primal"},
		]
	}
	static get spellTypes () {
		return [
			{regex: /Prepared/, unit: "Prepared"},
			{regex: /Spontaneous/, unit: "Spontaneous"},
			{regex: /Innate/, unit: "Innate"},
			{regex: /Focus/, unit: "Focus"},
		]
	}

	static get sentences () {
		return this.words.map(w => w.type.replace(/WORD/, "SENTENCE"));
	}

	static get sentencesNewLine () {
		return this.sentences.filter(w => w.endsWith("NEWLINE"));
	}

	static get sentencesSemiColon () {
		return this.sentences.filter(w => /SEMICOLON/.test(w));
	}

	static get stringEntries () {
		return [
			...this.sentences,
			...this.actions.map(a => a.type),
			"PARENTHESIS",
		];
	}
	// endregion
}

class Tokenizer {
	constructor (config) {
		this._config = config;
		this._string = "";
		this._cursor = 0;
		this._modeStack = [];
		this._tokens = [];
	}
	get _mode () {
		return this._modeStack.last();
	}

	init (string) {
		this._string = string;
		this._cursor = 0;
		this._modeStack = ["default"];
	}

	hasMoreTokens () {
		return this._cursor < this._string.length;
	}

	getNextToken () {
		if (!this.hasMoreTokens()) return null;

		const string = this._string.slice(this._cursor);
		const lookBehindString = this._string.slice(0, this._cursor);

		for (const {regex, type, mode, lookbehind, prev, ...opts} of this._config[this._mode]) {
			const value = this._match(regex, string);

			if (lookbehind && value && !this._lookBehind(lookbehind, lookBehindString)) continue;
			if (value == null) continue;
			if (prev && this._checkPrev(prev)) continue;
			this._cursor += value.length;
			if (type == null) return this.getNextToken();
			if (type === "END_DATA") this._modeStack = [];
			if (mode) this._modeStack.push(mode);
			if (this._lookBehind(/\n\s*$/, lookBehindString)) opts.isStartNewLine = true;

			this._tokens.push(type);
			return {type, value, ...opts};
		}
		if (this._mode !== "default") {
			this._modeStack.pop();
			if (this._mode) return this.getNextToken();
		}

		throw new Error(`Unexpected token! "${string.slice(0, 50)}..."`);
	}

	_match (regexp, string) {
		const match = regexp.exec(string);
		if (match == null) return null;

		return match[0];
	}
	_lookBehind (regexp, string) {
		return regexp.test(string);
	}
	_checkPrev (prev) {
		const depth = prev.depth;
		const tokensToCheck = this._tokens.slice(this._tokens.length - depth);
		return !prev.types.some(t => tokensToCheck.includes(t));
	}
}

if (typeof module !== "undefined") {
	module.exports = {
		Tokenizer,
		TokenizerUtils,
	}
}
