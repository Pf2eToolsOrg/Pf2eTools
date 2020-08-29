"use strict";

if (typeof module !== "undefined") {
	const imports = require("./filter");
	Object.assign(global, imports);
}

class PageFilterSpells extends PageFilter {
	// region static
	static sortSpells (a, b, o) {
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "level": return SortUtil.ascSort(a.values.level, b.values.level) || SortUtil.compareListNames(a, b);
			case "school": return SortUtil.ascSort(a.values.school, b.values.school) || SortUtil.compareListNames(a, b);
			case "time": return SortUtil.ascSort(a.values.normalisedTime, b.values.normalisedTime) || SortUtil.compareListNames(a, b);
		}
	}

	static getFilterDuration (spell) {
		const fDur = spell.duration || {type: "special"};
		switch (fDur.type) {
			case null: return "Instant";
			case "timed": {
				if (!fDur.duration) return "Special";
				switch (fDur.duration.type) {
					case "turn":
					case "round": return "1 Round";

					case "minute": {
						const amt = fDur.duration.amount || 0;
						if (amt <= 1) return "1 Minute";
						if (amt <= 10) return "10 Minutes";
						if (amt <= 60) return "1 Hour";
						if (amt <= 8 * 60) return "8 Hours";
						return "24+ Hours";
					}

					case "hour": {
						const amt = fDur.duration.amount || 0;
						if (amt <= 1) return "1 Hour";
						if (amt <= 8) return "8 Hours";
						return "24+ Hours";
					}

					case "week":
					case "day":
					case "year": return "24+ Hours";
					default: return "Special";
				}
			}
			case "unlimited": return "Unlimited";
			case "special":
			default: return "Special";
		}
	}

	static getNormalisedTime (time) {
		let multiplier = 1;
		let offset = 0;
		switch (time.unit) {
			case Parser.SP_TM_PF_F: offset = 1; break;
			case Parser.SP_TM_PF_R: offset = 2; break;
			case Parser.SP_TM_PF_A: multiplier = 10; break;
			case Parser.SP_TM_PF_AA: multiplier = 10; break;
			case Parser.SP_TM_PF_AAA: multiplier = 10; break;
			case Parser.SP_TM_ROUND: multiplier = 60; break;
			case Parser.SP_TM_MINS: multiplier = 600; break;
			case Parser.SP_TM_HRS: multiplier = 36000; break;
		}
		return (multiplier * time.number) + offset;
	}

	static getNormalisedRange (range) {
		let multiplier = 1;
		let distance = 0;
		let offset = 0;

		switch (range.type) {
			case RNG_SPECIAL: return 1000000000;
			case RNG_POINT: adjustForDistance(); break;
			case RNG_LINE: offset = 1; adjustForDistance(); break;
			case RNG_CONE: offset = 2; adjustForDistance(); break;
			case RNG_RADIUS: offset = 3; adjustForDistance(); break;
			case RNG_HEMISPHERE: offset = 4; adjustForDistance(); break;
			case RNG_SPHERE: offset = 5; adjustForDistance(); break;
			case RNG_CYLINDER: offset = 6; adjustForDistance(); break;
			case RNG_CUBE: offset = 7; adjustForDistance(); break;
		}

		// value in inches, to allow greater granularity
		return (multiplier * distance) + offset;

		function adjustForDistance () {
			const dist = range.distance;
			switch (dist.type) {
				case null: distance = 0; break;
				case UNT_FEET: multiplier = PageFilterSpells.INCHES_PER_FOOT; distance = dist.amount; break;
				case UNT_MILES: multiplier = PageFilterSpells.INCHES_PER_FOOT * PageFilterSpells.FEET_PER_MILE; distance = dist.amount; break;
				case RNG_TOUCH: distance = 1; break;
				case RNG_UNLIMITED_SAME_PLANE: distance = 900000000; break; // from BolS (homebrew)
				case RNG_UNLIMITED: distance = 900000001; break;
				case "unknown": distance = 900000002; break;
				default: {
					// it's homebrew?
					const fromBrew = MiscUtil.get(BrewUtil.homebrewMeta, "spellDistanceUnits", dist.type);
					if (fromBrew) {
						const ftPerUnit = fromBrew.feetPerUnit;
						if (ftPerUnit != null) {
							multiplier = PageFilterSpells.INCHES_PER_FOOT * ftPerUnit;
							distance = dist.amount;
						} else {
							distance = 910000000; // default to max distance, to have them displayed at the bottom
						}
					}
					break;
				}
			}
		}
	}

	static getFltrSpellLevelStr (level) {
		return level === 0 ? Parser.spLevelToFull(level) : `${Parser.spLevelToFull(level)} level`;
	}

	static getRangeType (range) {
		switch (range.type) {
			case RNG_SPECIAL: return PageFilterSpells.F_RNG_SPECIAL;
			case RNG_POINT:
				switch (range.distance.type) {
					case RNG_SELF: return PageFilterSpells.F_RNG_SELF;
					case RNG_TOUCH: return PageFilterSpells.F_RNG_TOUCH;
					default: return PageFilterSpells.F_RNG_POINT;
				}
			case RNG_LINE:
			case RNG_CONE:
			case RNG_RADIUS:
			case RNG_HEMISPHERE:
			case RNG_SPHERE:
			case RNG_CYLINDER:
			case RNG_CUBE:
				return PageFilterSpells.F_RNG_SELF_AREA
		}
	}

	static getTblTimeStr (time) {
		return (time.number === 1 && Parser.SP_TIME_SINGLETONS.includes(time.unit))
			? `${time.unit.uppercaseFirst()}${time.unit === Parser.SP_TM_PF_F ? " Action" : ""}`
			: `${time.number} ${time.unit === Parser.SP_TM_PF_F ? "Free Action" : time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
	}

	// endregion

	constructor () {
		super();

		this._brewSpellClasses = {};

		const levelFilter = new Filter({
			header: "Level",
			items: [
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9
			],
			displayFn: PageFilterSpells.getFltrSpellLevelStr
		});
		const traditionFilter = new Filter({
			header: "Tradition & Focus Spells",
			items: [...Parser.TRADITIONS, "Focus Spell"],
			itemSortFn: null
		});

		const generaltrtFilter = new Filter({
			header: "General"});
		const alignmentTrtFilter = new Filter({header: "Alignment"});
		const elementalTrtFilter = new Filter({header: "Elemental"});
		const energyTrtFilter = new Filter({header: "Energy"});
		const rarityTrtFilter = new Filter({
			header: "Rarity",
			items: [...Parser.TRAITS_RARITY],
			itemSortFn: null
		});
		const senseTrtFilter = new Filter({header: "Senses"});
		const traitsFilter = new MultiFilter({
			header: "Traits",
			filters: [rarityTrtFilter, alignmentTrtFilter, elementalTrtFilter, energyTrtFilter, senseTrtFilter, generaltrtFilter]
		});

		const schoolFilter = new Filter({
			header: "School",
			items: [...Parser.SKL_ABVS],
			displayFn: Parser.spSchoolAbvToFull,
			itemSortFn: (a, b) => SortUtil.ascSortLower(Parser.spSchoolAbvToFull(a.item), Parser.spSchoolAbvToFull(b.item))
		});

		const timeFilter = new Filter({
			header: "Cast Time",
			items: [
				Parser.SP_TM_PF_A,
				Parser.SP_TM_PF_AA,
				Parser.SP_TM_PF_AAA,
				Parser.SP_TM_PF_F,
				Parser.SP_TM_PF_R,
				Parser.SP_TM_ROUND,
				Parser.SP_TM_MINS,
				Parser.SP_TM_HRS
			],
			displayFn: Parser.spTimeUnitToFull,
			itemSortFn: null
		});
		const durationFilter = new RangeFilter({
			header: "Duration",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Instant", "1 Round", "1 Minute", "10 Minutes", "1 Hour", "8 Hours", "24+ Hours", "Unlimited", "Special"]
		});


		this._levelFilter = levelFilter;
		this._traditionFilter = traditionFilter;
		this._traitFilter = traitsFilter;
		this._generalTrtFilter = generaltrtFilter;
		this._alignmentTrtFilter = alignmentTrtFilter;
		this._elementalTrtFilter = elementalTrtFilter;
		this._energyTrtFilter = energyTrtFilter;
		this._rarityTrtFilter = rarityTrtFilter;
		this._sensesTrtFilter = senseTrtFilter;
		this._schoolFilter = schoolFilter;
		this._timeFilter = timeFilter;
		this._durationFilter = durationFilter;
	}

	populateHomebrewClassLookup (homebrew) {
		// load homebrew class spell list addons
		// Three formats are available. A string (shorthand for "spell" format with source "PHB"), "spell" format (object
		//   with a `name` and a `source`), and "class" format (object with a `class` and a `source`).

		const handleSpellListItem = (it, className, classSource, subclassShortName, subclassSource, subSubclassName) => {
			const doAdd = (target) => {
				if (subclassShortName) {
					const toAdd = {
						class: {name: className, source: classSource},
						subclass: {name: subclassShortName, source: subclassSource}
					};
					if (subSubclassName) toAdd.subclass.subSubclass = subSubclassName;

					target.fromSubclass = target.fromSubclass || [];
					target.fromSubclass.push(toAdd);
				} else {
					const toAdd = {name: className, source: classSource};

					target.fromClassList = target.fromClassList || [];
					target.fromClassList.push(toAdd);
				}
			};

			if (it.class) {
				if (!it.class) return;

				this._brewSpellClasses.class = this._brewSpellClasses.class || {};

				const cls = it.class.toLowerCase();
				const source = it.source || SRC_PHB;

				this._brewSpellClasses.class[source] = this._brewSpellClasses.class[source] || {};
				this._brewSpellClasses.class[source][cls] = this._brewSpellClasses.class[source][cls] || {};

				doAdd(this._brewSpellClasses.class[source][cls]);
			} else {
				this._brewSpellClasses.spell = this._brewSpellClasses.spell || {};

				const name = (typeof it === "string" ? it : it.name).toLowerCase();
				const source = typeof it === "string" ? "PHB" : it.source;
				this._brewSpellClasses.spell[source] = this._brewSpellClasses.spell[source] || {};
				this._brewSpellClasses.spell[source][name] = this._brewSpellClasses.spell[source][name] || {fromClassList: [], fromSubclass: []};

				doAdd(this._brewSpellClasses.spell[source][name]);
			}
		};

		if (homebrew.class) {
			homebrew.class.forEach(c => {
				c.source = c.source || SRC_PHB;

				if (c.classSpells) c.classSpells.forEach(it => handleSpellListItem(it, c.name, c.source));
				if (c.subclasses) {
					c.subclasses.forEach(sc => {
						sc.shortName = sc.shortName || sc.name;
						sc.source = sc.source || c.source;

						if (sc.subclassSpells) sc.subclassSpells.forEach(it => handleSpellListItem(it, c.name, c.source, sc.shortName, sc.source));
						if (sc.subSubclassSpells) Object.entries(sc.subSubclassSpells).forEach(([ssC, arr]) => arr.forEach(it => handleSpellListItem(it, c.name, c.source, sc.shortName, sc.source, ssC)));
					});
				}
			})
		}

		if (homebrew.subclass) {
			homebrew.subclass.forEach(sc => {
				sc.classSource = sc.classSource || SRC_PHB;
				sc.shortName = sc.shortName || sc.name;
				sc.source = sc.source || sc.classSource;

				if (sc.subclassSpells) sc.subclassSpells.forEach(it => handleSpellListItem(it, sc.class, sc.classSource, sc.shortName, sc.source));
				if (sc.subSubclassSpells) Object.entries(sc.subSubclassSpells).forEach(([ssC, arr]) => arr.forEach(it => handleSpellListItem(it, sc.class, sc.classSource, sc.shortName, sc.source, ssC)));
			});
		}
	}

	mutateForFilters (spell) {
		Renderer.spell.initClasses(spell, this._brewSpellClasses);

		// used for sorting
		spell._normalisedTime = PageFilterSpells.getNormalisedTime(spell.cast);
		spell._normalisedRange = PageFilterSpells.getNormalisedRange(spell.range);

		// used for filtering
		spell._fSources = ListUtil.getCompleteFilterSources(spell);
		spell._fClasses = spell.traits.filter(t => Parser.TRAITS_CLASS.includes(t)) || [];
		spell._fTraditions = spell.traditions ? spell.traditions : spell.focus ? ["Focus Spell"] : [];
		spell._fgeneralTrts = spell.traits.filter(t => Parser.TRAITS_GENERAL.concat("Arcane", "Nonlethal", "Plant", "Poison", "Shadow").includes(t)) || [];
		spell._falignmentTrts = spell.traits.filter(t => Parser.TRAITS_ALIGN.includes(t)) || [];
		spell._felementalTrts = spell.traits.filter(t => Parser.TRAITS_ELEMENTAL.includes(t)) || [];
		spell._fenergyTrts = spell.traits.filter(t => Parser.TRAITS_ENERGY.includes(t)) || [];
		spell._frarityTrts = spell.traits.concat("Common").filter(t => Parser.TRAITS_RARITY.includes(t))[0];
		spell._fsenseTrts = spell.traits.filter(t => Parser.TRAITS_SENSE.includes(t)) || [];
		spell._fTimeType = [spell.cast["unit"]];
		spell._fDurationType = PageFilterSpells.getFilterDuration(spell);
	}

	addToFilters (spell, isExcluded) {
		if (isExcluded) return;

		if (spell.level > 9) this._levelFilter.addItem(spell.level);
		this._schoolFilter.addItem(spell.school);
		this._sourceFilter.addItem(spell._fSources);
		this._traditionFilter.addItem(spell._fTraditions);
		this._generalTrtFilter.addItem(spell._fgeneralTrts);
		this._alignmentTrtFilter.addItem(spell._falignmentTrts);
		this._elementalTrtFilter.addItem(spell._felementalTrts);
		this._energyTrtFilter.addItem(spell._fenergyTrts);
		this._rarityTrtFilter.addItem(spell._frarityTrts);
		this._sensesTrtFilter.addItem(spell._fsenseTrts);
	}

	async _pPopulateBoxOptions (opts) {
		await SourceUtil.pInitSubclassReprintLookup();

		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._traditionFilter,
			this._traitFilter,
			this._schoolFilter,
			this._timeFilter,
			this._durationFilter,
		];
	}

	toDisplay (values, s) {
		return this._filterBox.toDisplay(
			values,
			s._fSources,
			s.level,
			s._fTraditions,
			[
				s._frarityTrts,
				s._falignmentTrts,
				s._felementalTrts,
				s._fenergyTrts,
				s._fsenseTrts,
				s._fgeneralTrts
			],
			s.school,
			s._fTimeType,
			s._fDurationType,
		)
	}
}
// toss these into the "Tags" section to save screen space
PageFilterSpells._META_ADD_V = "Verbal";
PageFilterSpells._META_ADD_S = "Somatic";
PageFilterSpells._META_ADD_M = "Material";
PageFilterSpells._META_ADD_R = "Royalty";
PageFilterSpells._META_ADD_M_COST = "Material with Cost";
PageFilterSpells._META_ADD_M_CONSUMED = "Material is Consumed";

PageFilterSpells.F_RNG_POINT = "Point";
PageFilterSpells.F_RNG_SELF_AREA = "Self (Area)";
PageFilterSpells.F_RNG_SELF = "Self";
PageFilterSpells.F_RNG_TOUCH = "Touch";
PageFilterSpells.F_RNG_SPECIAL = "Special";

PageFilterSpells._META_FILTER_BASE_ITEMS = [PageFilterSpells._META_ADD_V, PageFilterSpells._META_ADD_S, PageFilterSpells._META_ADD_M, PageFilterSpells._META_ADD_R, PageFilterSpells._META_ADD_M_COST, PageFilterSpells._META_ADD_M_CONSUMED, ...Object.values(Parser.SP_MISC_TAG_TO_FULL)];

PageFilterSpells.INCHES_PER_FOOT = 12;
PageFilterSpells.FEET_PER_MILE = 5280;

class ModalFilterSpells extends ModalFilter {
	constructor (namespace) {
		super({
			modalTitle: "Spells",
			pageFilter: new PageFilterSpells(),
			fnSort: PageFilterSpells.sortSpells,
			namespace: namespace
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "3"},
			{sort: "level", text: "Level", width: "1-5"},
			{sort: "time", text: "Time", width: "2"},
			{sort: "school", text: "School", width: "1"},
			{sort: "source", text: "Source", width: "1"}
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pInit () {
		this._pageFilter.populateHomebrewClassLookup(BrewUtil.homebrew);
	}

	async _pLoadAllData () {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await DataUtil.spell.pLoadAll();
		const fromBrew = brew.spell || [];
		return [...fromData, ...fromBrew];
	}

	_getListItem (pageFilter, spell, spI) {
		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](spell);
		const source = Parser.sourceJsonToAbv(spell.source);
		const levelText = `${Parser.spLevelToFull(spell.level)}${spell.meta && spell.meta.ritual ? " (rit.)" : ""}${spell.meta && spell.meta.technomagic ? " (tec.)" : ""}`;
		const time = PageFilterSpells.getTblTimeStr(spell.time[0]);
		const school = Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools);

		eleLi.innerHTML = `<label class="lst--border unselectable">
			<div class="lst__wrp-cells">
				<div class="col-1 pl-0 flex-vh-center"><input type="checkbox" class="no-events"></div>
				<div class="bold col-3">${spell.name}</div>
				<div class="col-1-5 text-center">${levelText}</div>
				<div class="col-2 text-center">${time}</div>
				<div class="col-1 school_${spell.school} text-center" title="${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools)}" ${Parser.spSchoolAbvToStyle(spell.school)}>${school}</div>
				<div class="col-1 pr-0 text-center ${Parser.sourceJsonToColor(spell.source)}" title="${Parser.sourceJsonToFull(spell.source)}" ${BrewUtil.sourceJsonToStyle(spell.source)}>${source}</div>
			</div>
		</label>`;

		return new ListItem(
			spI,
			eleLi,
			spell.name,
			{
				hash,
				source,
				sourceJson: spell.source,
				level: spell.level,
				time,
				school: Parser.spSchoolAbvToFull(spell.school),
				classes: Parser.spClassesToFull(spell.classes, true),
				normalisedTime: spell._normalisedTime,
				normalisedRange: spell._normalisedRange
			},
			{
				cbSel: eleLi.firstElementChild.firstElementChild.firstElementChild.firstElementChild
			}
		);
	}
}

if (typeof module !== "undefined") {
	module.exports = PageFilterSpells;
}
