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
			{regex: /^(.+)\s(SPELL|CANTRIP|FOCUS) (\d{1,2})\n/, type: "SPELL", mode: "spell"},
			{regex: /^([^\n[]*?)\s(\[.+]\s)?FEAT (\d{1,2})\n/, type: "FEAT", mode: "feat"},
			{regex: /^(.+)\s(ITEM|RUNE|MATERIAL|SNARE) (\d{1,2}\+?)\n/, type: "ITEM", mode: "item"},
			{regex: /^(.*?)\sBACKGROUND\n/, type: "BACKGROUND", mode: "background"},
			{regex: /^(.*?)\sCREATURE (–?\d{1,2})\n/, type: "CREATURE", mode: "creature"},
		]
	}

	static get traits () {
		return [
			{regex: /^MODULAR B, P, OR S\s/, type: "TRAIT"},
			{regex: /^LG\s/, type: "TRAIT"},
			{regex: /^NG\s/, type: "TRAIT"},
			{regex: /^CG\s/, type: "TRAIT"},
			{regex: /^LN\s/, type: "TRAIT"},
			{regex: /^N\s/, type: "TRAIT"},
			{regex: /^CN\s/, type: "TRAIT"},
			{regex: /^LE\s/, type: "TRAIT"},
			{regex: /^NE\s/, type: "TRAIT"},
			{regex: /^CE\s/, type: "TRAIT"},
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
			{regex: /^Activate\s/, type: "ACTIVATE", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Activation\s/, type: "ACTIVATE", lookbehind: /(\n|[;.)]\s)$/},
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
			{regex: /^Cast(ing)?\s/, type: "CAST", lookbehind: /(\n|[;.)]\s)$/},
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
			{regex: /^Effects?\s/, type: "EFFECT", lookbehind: /(\n|[;.)\]]\s)$/, lookahead: true},
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
			{regex: /^Prerequisites?\s/, type: "PREREQUISITES", lookbehind: /(\n|[;.)]\s)$/},
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
			{regex: /^Requirements?\s/, type: "REQUIREMENTS", lookbehind: /(\n|[;.)\]]\s)$/},
		]
	}
	static get savingThrow () {
		return [
			{regex: /^Saving Throw\s/, type: "SAVING_THROW", lookbehind: /(\n|[;.)]\s)$/, lookaheadIncDepth: 2},
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
			{regex: /^Domain\s/, type: "DOMAIN", class: "Cleric", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Mystery\s/, type: "MYSTERY", class: "Oracle", lookbehind: /(\n|[;.)]\s)$/},
			{regex: /^Patron\s/, type: "PATRON", class: "Witch", lookbehind: /(\n|[;.)]\s)$/},
		]
	}
	static get trigger () {
		return [
			{regex: /^Trigger\s/, type: "TRIGGER", lookbehind: /(\n|[;.)\]]\s)$/, lookaheadIncDepth: 3},
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
	static get skills () {
		return [
			{regex: /^Acrobatics\s/, type: "ACROBATICS", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Arcana\s/, type: "ARCANA", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Athletics\s/, type: "ATHLETICS", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Crafting\s/, type: "CRAFTING", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Deception\s/, type: "DECEPTION", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Diplomacy\s/, type: "DIPLOMACY", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Intimidation\s/, type: "INTIMIDATION", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^([A-Z][\w]*?)\sLore\s/, type: "LORE", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Medicine\s/, type: "MEDICINE", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Nature\s/, type: "NATURE", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Occultism\s/, type: "OCCULTISM", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Performance\s/, type: "PERFORMANCE", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Religion\s/, type: "RELIGION", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Society\s/, type: "SOCIETY", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Stealth\s/, type: "STEALTH", lookbehind: /(\Skills\s|n|[,);]\s)$/},
			{regex: /^Survival\s/, type: "SURVIVAL", lookbehind: /(Skills\s|\n|[,);]\s)$/},
			{regex: /^Thievery\s/, type: "THIEVERY", lookbehind: /(Skills\s|\n|[,);]\s)$/},
		]
	}
	static get skillsProp () {
		return [
			{regex: /^Skills\s/, type: "SKILLS", lookbehind: /\n$/},
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
			{regex: /^Str\s(.*?)\sDex\s(.*?)\sCon\s(.*?)\sInt\s(.*?)\sWis\s(.*?)\sCha\s(.*?)\s/, type: "CR_ABILITY_SCORES", lookbehind: /\n$/},
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
			{regex: /^HP\s/, type: "HP", lookbehind: /\n$/},
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
			{regex: /^Hardness\s/, type: "HARDNESS", lookbehind: /(\n|[;,.)]\s)$/},
		]
	}
	static get speed () {
		return [
			{regex: /^Speed\s/, type: "SPEED", lookbehind: /\n$/},
		]
	}
	static get damage () {
		return [
			{regex: /^Damage\s/, type: "DAMAGE"},
		]
	}
	static get attacks () {
		return [
			{regex: /^Melee\s/, type: "MELEE", lookbehind: /(\n|action?]\s?)$/},
			{regex: /^Ranged\s/, type: "RANGED", lookbehind: /(\n|action?]\s?)$/},
		]
	}
	static get spellCasting () {
		return [
			{regex: /^((?:[A-Z][a-z]+ )+)Spells\s/, type: "SPELL_CASTING", lookbehind: /\n$/},
		]
	}
	static get cantrips () {
		return [
			{regex: /^Cantrips\s/, type: "CANTRIPS", lookbehind: /;\s$/},
		]
	}
	static get constant () {
		return [
			{regex: /^Constant\s/, type: "CONSTANT", lookbehind: /;\s$/},
		]
	}
	static get spellDC () {
		return [
			{regex: /^DC (\d+)[;,.]\s/, type: "SPELL_DC", lookbehind: /Spells\s$/},
		]
	}
	static get spellAttack () {
		return [
			{regex: /^attack \+(\d+)[;,.]\s/, type: "SPELL_ATTACK", lookbehind: /(Spells\s|DC \d+[,.;]\s)$/},
		]
	}
	static get focusPoints () {
		return [
			{regex: /^\(\d Focus Points?\)\s/, type: "FOCUS_POINT"},
			{regex: /^\d Focus Points?\s/, type: "FOCUS_POINT"},
		]
	}
	static get ritualCasting () {
		return [
			{regex: /^((?:[A-Z][a-z]+ )+)Rituals\s/, type: "RITUAL_CASTING", lookbehind: /\n$/},
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
			...this.skills,
			...this.items,
			...this.creatureAbilityScores,
			...this.ac,
			...this.creatureSavingThrows,
			...this.hp,
			...this.resistances,
			...this.weaknesses,
			...this.immunities,
			...this.hardness,
			...this.speed,
			...this.attacks,
			...this.damage,
			...this.spellCasting,
			...this.cantrips,
			...this.constant,
			...this.spellDC,
			...this.spellAttack,
			...this.focusPoints,
			...this.ritualCasting,
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

	static get heightened () {
		return [
			{regex: /^Heightened\s\(\+\d+\)\s/, type: "HEIGHTENED_PLUS_X"},
			{regex: /^Heightened\s\(\d+(st|nd|rd|th)\)\s/, type: "HEIGHTENED_X"},
			{regex: /^Heightened\s/, type: "HEIGHTENED"},
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
			{regex: /^Stage\s\d+\s/, type: "STAGE", lookahead: true},
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
			{regex: /^Special/, type: "SPECIAL"},
		]
	}

	static get actions () {
		return [
			{regex: /^\[one.action]\s/, type: "ACTION"},
			{regex: /^\[two.actions?]\s/, type: "TWO_ACTIONS"},
			{regex: /^\[three.actions?]\s/, type: "THREE_ACTIONS"},
			{regex: /^\[reaction]\s/, type: "REACTION"},
			{regex: /^\[free.action]\s/, type: "FREE_ACTION"},
			{regex: /^\[>]\s/, type: "ACTION"},
			{regex: /^\[>>]\s/, type: "TWO_ACTIONS"},
			{regex: /^\[>>>]\s/, type: "THREE_ACTIONS"},
			{regex: /^\[R|r]\s/, type: "REACTION"},
			{regex: /^\[F|f]\s/, type: "FREE_ACTION"},
			{regex: /^:a:\s/, type: "ACTION"},
			{regex: /^:aa:\s/, type: "TWO_ACTIONS"},
			{regex: /^:aaa:\s/, type: "THREE_ACTIONS"},
			{regex: /^:r:\s/, type: "REACTION"},
			{regex: /^:f:\s/, type: "FREE_ACTION"},
		]
	}

	static get genericEntries () {
		return [
			{regex: /^•/, type: "LIST_MARKER"},
			// Preventing dangling commas and semi-colons (word token) in many stat-blocks
			{regex: /^\(.*?\)[.,;]?/s, type: "PARENTHESIS"},
		]
	}

	static get words () {
		return [
			{regex: /^[\S]*;(?=\n)/, type: "WORD_SEMICOLON_NEWLINE"},
			{regex: /^[\S]*;/, type: "WORD_SEMICOLON"},
			{regex: /^[\S]*[.!?:](?=\n)/, type: "WORD_TERM_NEWLINE"},
			{regex: /^[\S]*[.!?:]/, type: "WORD_TERM"},
			{regex: /^[\S]+(?=\n)/, type: "WORD_NEWLINE"},
			{regex: /^[\S]+/, type: "WORD"},
		]
	}

	static get defaultConfig () {
		return {
			default: [
				...this.pageNumbers,

				// DATA HEADERS
				...this.dataHeaders,

				{regex: /^\s+/, type: null},
			],
			spell: [
				...this.endData,

				// PROPERTIES
				...this.propertiesSpells,

				// DATA ENTRIES
				...this.traits,
				...this.successDegrees,
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
			{regex: /Fortitude/, unit: "Fort", full: "Fortitude"},
			{regex: /Fort/, unit: "Fort", full: "Fortitude"},
			{regex: /Reflex/, unit: "Reflex", full: "Reflex"},
			{regex: /Will/, unit: "Will", full: "Will"},
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
			{regex: /precise/, type: "precise"},
			{regex: /imprecise/, type: "imprecise"},
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
		this._mode = null;
	}

	init (string) {
		this._string = string;
		this._cursor = 0;
		this._mode = "default"
	}

	hasMoreTokens () {
		return this._cursor < this._string.length;
	}

	getNextToken () {
		if (!this.hasMoreTokens()) return null;

		const string = this._string.slice(this._cursor);
		const lookBehindString = this._string.slice(0, this._cursor);

		for (const {regex, type, mode, lookbehind, ...opts} of this._config[this._mode]) {
			const value = this._match(regex, string);

			if (lookbehind && value && !this._lookBehind(lookbehind, lookBehindString)) continue;
			if (value == null) continue;
			this._cursor += value.length;
			if (type == null) return this.getNextToken();
			if (mode) this._mode = mode;
			if (this._lookBehind(/\n\s*$/, lookBehindString)) opts.isStartNewLine = true;

			return {type, value, ...opts};
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
}

if (typeof module !== "undefined") {
	module.exports = {
		Tokenizer,
		TokenizerUtils,
	}
}
