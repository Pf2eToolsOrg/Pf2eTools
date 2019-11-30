"use strict";

class PageFilterBestiary {
	// region static
	static sortMonsters (a, b, o) {
		if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "type": return SortUtil.ascSort(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "cr": return SortUtil.ascSortCr(a.values.cr, b.values.cr) || SortUtil.compareListNames(a, b);
		}
	}

	static ascSortMiscFilter (a, b) {
		a = a.item;
		b = b.item;
		if (a.includes(PageFilterBestiary.MISC_FILTER_SPELLCASTER) && b.includes(PageFilterBestiary.MISC_FILTER_SPELLCASTER)) {
			a = Parser.attFullToAbv(a.replace(PageFilterBestiary.MISC_FILTER_SPELLCASTER, ""));
			b = Parser.attFullToAbv(b.replace(PageFilterBestiary.MISC_FILTER_SPELLCASTER, ""));
			return SortUtil.ascSortAtts(a, b);
		} else return SortUtil.ascSort(a, b);
	}

	static getAllImmRest (toParse, key) {
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

	static dispVulnFilter (item) {
		return `${StrUtil.uppercaseFirst(item)} Vuln`;
	}

	static dispResFilter (item) {
		return `${StrUtil.uppercaseFirst(item)} Res`;
	}

	static dispImmFilter (item) {
		return `${StrUtil.uppercaseFirst(item)} Imm`;
	}
	// endregion

	constructor () {
		this._creatureMeta = {};
		this._languages = {};

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
			displayFn: (k) => this._languages[k],
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
		const vulnerableFilter = new Filter({
			header: "Vulnerabilities",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: PageFilterBestiary.dispVulnFilter
		});
		const resistFilter = new Filter({
			header: "Resistance",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: PageFilterBestiary.dispResFilter
		});
		const immuneFilter = new Filter({
			header: "Immunity",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: PageFilterBestiary.dispImmFilter
		});
		const defenceFilter = new MultiFilter({header: "Damage", mode: "and", filters: [vulnerableFilter, resistFilter, immuneFilter]});
		const conditionImmuneFilter = new Filter({
			header: "Condition Immunity",
			items: PageFilterBestiary.CONDS,
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
			items: ["Familiar", ...Object.keys(Parser.MON_MISC_TAG_TO_FULL), "Lair Actions", "Legendary", "Adventure NPC", "Spellcaster", ...Object.values(Parser.ATB_ABV_TO_FULL).map(it => `${PageFilterBestiary.MISC_FILTER_SPELLCASTER}${it}`), "Regional Effects", "Reactions", "Swarm", "Has Variants", "Modified Copy", "Has Alternate Token", "SRD"],
			displayFn: (it) => Parser.monMiscTagToFull(it).uppercaseFirst(),
			deselFn: (it) => it === "Adventure NPC",
			itemSortFn: PageFilterBestiary.ascSortMiscFilter
		});
		const spellcastingTypeFilter = new Filter({
			header: "Spellcasting Type",
			items: ["F", "I", "P", "S", "CB", "CC", "CD", "CP", "CR", "CS", "CL", "CW"],
			displayFn: Parser.monSpellcastingTagToFull
		});

		this._filterBox = null;

		this._sourceFilter = sourceFilter;
		this._crFilter = crFilter;
		this._sizeFilter = sizeFilter;
		this._speedFilter = speedFilter;
		this._speedTypeFilter = speedTypeFilter;
		this._strengthFilter = strengthFilter;
		this._dexterityFilter = dexterityFilter;
		this._constitutionFilter = constitutionFilter;
		this._intelligenceFilter = intelligenceFilter;
		this._wisdomFilter = wisdomFilter;
		this._charismaFilter = charismaFilter;
		this._abilityScoreFilter = abilityScoreFilter;
		this._acFilter = acFilter;
		this._averageHpFilter = averageHpFilter;
		this._typeFilter = typeFilter;
		this._tagFilter = tagFilter;
		this._alignmentFilter = alignmentFilter;
		this._languageFilter = languageFilter;
		this._damageTypeFilter = damageTypeFilter;
		this._senseFilter = senseFilter;
		this._skillFilter = skillFilter;
		this._saveFilter = saveFilter;
		this._environmentFilter = environmentFilter;
		this._vulnerableFilter = vulnerableFilter;
		this._resistFilter = resistFilter;
		this._immuneFilter = immuneFilter;
		this._defenceFilter = defenceFilter;
		this._conditionImmuneFilter = conditionImmuneFilter;
		this._traitFilter = traitFilter;
		this._actionReactionFilter = actionReactionFilter;
		this._miscFilter = miscFilter;
		this._spellcastingTypeFilter = spellcastingTypeFilter;
	}

	get filterBox () { return this._filterBox; }
	get sourceFilter () { return this._sourceFilter; }

	addToFilters (mon) {
		Renderer.monster.initParsed(mon);
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
			else if (tempAlign.length === 1 && tempAlign.includes("N")) Array.prototype.push.apply(tempAlign, PageFilterBestiary._NEUT_ALIGNS);
			mon._fAlign = tempAlign;
		} else {
			mon._fAlign = null;
		}
		mon._fVuln = mon.vulnerable ? PageFilterBestiary.getAllImmRest(mon.vulnerable, "vulnerable") : [];
		mon._fRes = mon.resist ? PageFilterBestiary.getAllImmRest(mon.resist, "resist") : [];
		mon._fImm = mon.immune ? PageFilterBestiary.getAllImmRest(mon.immune, "immune") : [];
		mon._fCondImm = mon.conditionImmune ? PageFilterBestiary.getAllImmRest(mon.conditionImmune, "conditionImmune") : [];
		mon._fSave = mon.save ? Object.keys(mon.save) : [];
		mon._fSkill = mon.skill ? Object.keys(mon.skill) : [];
		mon._fSources = ListUtil.getCompleteFilterSources(mon);

		// region populate filters
		this._sourceFilter.addItem(mon._fSources);
		if (mon._pCr != null) this._crFilter.addItem(mon._pCr);
		this._strengthFilter.addItem(mon.str);
		this._dexterityFilter.addItem(mon.dex);
		this._constitutionFilter.addItem(mon.con);
		this._intelligenceFilter.addItem(mon.int);
		this._wisdomFilter.addItem(mon.wis);
		this._charismaFilter.addItem(mon.cha);
		this._speedFilter.addItem(mon._fSpeed);
		mon.ac.forEach(it => this._acFilter.addItem(it.ac || it));
		if (mon.hp.average) this._averageHpFilter.addItem(mon.hp.average);
		mon._pTypes.tags.forEach(t => this._tagFilter.addItem(t));
		mon._fMisc = mon.legendary || mon.legendaryGroup ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
		if (mon.spellcasting) {
			mon._fMisc.push("Spellcaster");
			mon.spellcasting.forEach(sc => {
				if (sc.ability) mon._fMisc.push(`${PageFilterBestiary.MISC_FILTER_SPELLCASTER}${Parser.attAbvToFull(sc.ability)}`);
			});
		}
		if (mon.isNpc) mon._fMisc.push("Adventure NPC");
		if (mon.legendaryGroup && (this._creatureMeta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name]) {
			if ((this._creatureMeta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name].lairActions) mon._fMisc.push("Lair Actions");
			if ((this._creatureMeta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name].regionalEffects) mon._fMisc.push("Regional Effects");
		}
		if (mon.reaction) mon._fMisc.push("Reactions");
		if (mon.variant) mon._fMisc.push("Has Variants");
		if (mon.miscTags) mon._fMisc.push(...mon.miscTags);
		if (mon._isCopy) mon._fMisc.push("Modified Copy");
		if (mon.altArt) mon._fMisc.push("Has Alternate Token");
		if (mon.srd) mon._fMisc.push("SRD");
		this._traitFilter.addItem(mon.traitTags);
		this._actionReactionFilter.addItem(mon.actionTags);
		this._environmentFilter.addItem(mon.environment);
		// endregion
	}

	async pInitFilterBox (opts) {
		opts.filters = [
			this._sourceFilter,
			this._crFilter,
			this._typeFilter,
			this._tagFilter,
			this._environmentFilter,
			this._defenceFilter,
			this._conditionImmuneFilter,
			this._traitFilter,
			this._actionReactionFilter,
			this._miscFilter,
			this._spellcastingTypeFilter,
			this._sizeFilter,
			this._speedFilter,
			this._speedTypeFilter,
			this._alignmentFilter,
			this._saveFilter,
			this._skillFilter,
			this._senseFilter,
			this._languageFilter,
			this._damageTypeFilter,
			this._acFilter,
			this._averageHpFilter,
			this._abilityScoreFilter
		];

		await Renderer.monster.pPopulateMetaAndLanguages(this._creatureMeta, this._languages);
		Object.keys(this._languages).sort((a, b) => SortUtil.ascSortLower(this._languages[a], this._languages[b]))
			.forEach(la => this._languageFilter.addItem(la));

		this._filterBox = new FilterBox(opts);
		await this._filterBox.pDoLoadState();
	}

	toDisplay (values, m) {
		return this._filterBox.toDisplay(
			values,
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
	}
}
PageFilterBestiary._NEUT_ALIGNS = ["NX", "NY"];
PageFilterBestiary.MISC_FILTER_SPELLCASTER = "Spellcaster, ";
PageFilterBestiary.DMG_TYPES = [
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
PageFilterBestiary.CONDS = [
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
