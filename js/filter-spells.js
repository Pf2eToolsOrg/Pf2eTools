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
				switch (fDur.duration.unit) {
					case "turn":
					case "round": return "1 Round";

					case "minute": {
						const amt = fDur.duration.number || 0;
						if (amt <= 1) return "1 Minute";
						if (amt <= 10) return "10 Minutes";
						if (amt <= 60) return "1 Hour";
						if (amt <= 8 * 60) return "8 Hours";
						return "24+ Hours";
					}

					case "hour": {
						const amt = fDur.duration.number || 0;
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

	static getFilterRange (spell) {
		const fRan = spell.range || {type: null};
		if (fRan.type !== null) {
			let norm_range = this.getNormalisedRange(fRan);
			if (norm_range === 1) {
				return "Touch"
			} else if (norm_range < PageFilterSpells.INCHES_PER_FOOT * 10) {
				return "5 feet"
			} else if (norm_range < PageFilterSpells.INCHES_PER_FOOT * 25) {
				return "10 feet"
			} else if (norm_range < PageFilterSpells.INCHES_PER_FOOT * 50) {
				return "25 feet"
			} else if (norm_range < PageFilterSpells.INCHES_PER_FOOT * 100) {
				return "50 feet"
			} else if (norm_range < PageFilterSpells.INCHES_PER_FOOT * 500) {
				return "100 feet"
			} else if (norm_range < PageFilterSpells.INCHES_PER_FOOT * PageFilterSpells.FEET_PER_MILE) {
				return "500 feet"
			} else if (norm_range < 900000000) {
				return "1 mile"
			} else if (norm_range < 900000001) {
				return "Planetary"
			} else if (norm_range < 900000002) {
				return "Unlimited"
			} else {
				return "Varies"
			}
		} else {
			return null
		}
	}

	static getNormalisedTime (time) {
		let multiplier = 1;
		let offset = 0;
		switch (time.unit) {
			case Parser.TM_F: offset = 1; break;
			case Parser.TM_R: offset = 2; break;
			case Parser.TM_A: multiplier = 10; break;
			case Parser.TM_AA: multiplier = 20; break;
			case Parser.TM_AAA: multiplier = 30; break;
			case Parser.TM_ROUND: multiplier = 60; break;
			case Parser.TM_MINS: multiplier = 600; break;
			case Parser.TM_HRS: multiplier = 36000; break;
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

	static getTblTimeStr (time) {
		return time.unit === `Varies` ? `Varies` : Parser.TIME_ACTIONS.includes(time.unit) ? `${Parser.TIME_TO_FULL[time.unit].uppercaseFirst()}`
			: `${time.number} ${time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
	}

	// endregion

	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._levelFilter = new Filter({
			header: "Level",
			items: [
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			],
			displayFn: PageFilterSpells.getFltrSpellLevelStr,
		});
		this._traditionFilter = new Filter({
			header: "Tradition",
			items: [...Parser.TRADITIONS],
			itemSortFn: null,
		});
		this._focusFilter = new Filter({
			header: "Spell Type",
			items: ["Focus Spell", "Spell"],
			itemSortFn: null,
		});
		this._classFilter = new Filter({header: "Classes"});
		this._domainFilter = new Filter({header: "Domains"})
		this._multiFocusFilter = new MultiFilter({
			header: "Focus Spells",
			filters: [this._focusFilter, this._classFilter, this._domainFilter],
		});
		this._componentsFilter = new Filter({
			header: "Components",
			items: ["Focus", "Material", "Somatic", "Verbal", "Cost"],
			itemSortFn: null,
		});
		this._savingThrowFilter = new Filter({
			header: "Saving Throw",
			items: ["Basic", "Fortitude", "Reflex", "Will"],
		});
		this._generalTrtFilter = new Filter({header: "General"});
		this._alignmentTrtFilter = new Filter({header: "Alignment"});
		this._elementalTrtFilter = new Filter({header: "Elemental"});
		this._energyTrtFilter = new Filter({header: "Energy"});
		this._rarityTrtFilter = new Filter({
			header: "Rarity",
			items: [...Parser.TRAITS_RARITY],
			itemSortFn: null,
		});
		this._sensesTrtFilter = new Filter({header: "Senses"});
		this._traitFilter = new MultiFilter({
			header: "Traits",
			filters: [this._rarityTrtFilter, this._alignmentTrtFilter, this._elementalTrtFilter, this._energyTrtFilter, this._sensesTrtFilter, this._generalTrtFilter],
		});
		this._schoolFilter = new Filter({
			header: "School",
			items: [...Parser.SKL_ABVS],
			displayFn: Parser.spSchoolAbvToFull,
			itemSortFn: (a, b) => SortUtil.ascSortLower(Parser.spSchoolAbvToFull(a.item), Parser.spSchoolAbvToFull(b.item)),
		});
		this._areaFilter = new Filter({
			header: "Area Types",
		});
		this._timeFilter = new Filter({
			header: "Cast Time",
			items: [
				Parser.TM_A,
				Parser.TM_AA,
				Parser.TM_AAA,
				Parser.TM_F,
				Parser.TM_R,
				Parser.TM_ROUND,
				Parser.TM_MINS,
				Parser.TM_HRS,
				"Varies",
			],
			displayFn: Parser.timeUnitToFull,
			itemSortFn: null,
		});
		this._durationFilter = new RangeFilter({
			header: "Duration",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Instant", "1 Round", "1 Minute", "10 Minutes", "1 Hour", "8 Hours", "24+ Hours", "Unlimited", "Special"],
		});

		this._rangeFilter = new RangeFilter({
			header: "Range",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Touch", "5 feet", "10 feet", "25 feet", "50 feet", "100 feet", "500 feet", "1 mile", "Planetary", "Unlimited", "Varies"],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Requirements", "Has Trigger", "Can be Heightened", "Can be Dismissed", "Sustained"],
		})
	}

	mutateForFilters (spell) {
		// used for sorting
		spell._normalisedTime = PageFilterSpells.getNormalisedTime(spell.cast);
		spell._normalisedRange = PageFilterSpells.getNormalisedRange(spell.range);

		// used for filtering
		spell._fTraditions = spell.traditions ? spell.traditions : [];
		spell._fFocus = spell.focus ? ["Focus Spell"] : ["Spell"];
		spell._fClasses = spell.traits.filter(t => Parser.TRAITS_CLASS.includes(t)) || [];
		spell._fgeneralTrts = spell.traits.filter(t => Parser.TRAITS_GENERAL.concat("Arcane", "Nonlethal", "Plant", "Poison", "Shadow").includes(t)) || [];
		spell._falignmentTrts = spell.traits.filter(t => Parser.TRAITS_ALIGN.includes(t)) || [];
		spell._felementalTrts = spell.traits.filter(t => Parser.TRAITS_ELEMENTAL.includes(t)) || [];
		spell._fenergyTrts = spell.traits.filter(t => Parser.TRAITS_ENERGY.includes(t)) || [];
		spell._frarityTrts = spell.traits.concat("Common").filter(t => Parser.TRAITS_RARITY.includes(t))[0];
		spell._fsenseTrts = spell.traits.filter(t => Parser.TRAITS_SENSE.includes(t)) || [];
		spell._fTimeType = [spell.cast["unit"]];
		spell._fDurationType = PageFilterSpells.getFilterDuration(spell);
		spell._areaTypes = spell.area ? spell.area.types : [];
		spell._fRange = PageFilterSpells.getFilterRange(spell)
		spell._fSavingThrow = spell.saving_throw == null ? [] : spell.saving_throw_basic ? [spell.saving_throw, "Basic"] : [spell.saving_throw];
		spell._fComponents = spell.cost == null ? [] : ["Cost"];
		if (spell.components.F) spell._fComponents.push("Focus");
		if (spell.components.M) spell._fComponents.push("Material");
		if (spell.components.S) spell._fComponents.push("Somatic");
		if (spell.components.V) spell._fComponents.push("Verbal");
		spell._fMisc = [];
		if (spell.requirements !== null) spell._fMisc.push("Has Requirements");
		if (spell.trigger !== null) spell._fMisc.push("Has Trigger");
		if (spell.heightened.heightened) spell._fMisc.push("Can be Heightened");
		if (spell.sustain) spell._fMisc.push("Sustained");
		if (spell.dismiss) spell._fMisc.push("Can be Dismissed");
	}

	addToFilters (spell, isExcluded) {
		if (isExcluded) return;

		if (spell.level > 10) this._levelFilter.addItem(spell.level);
		this._schoolFilter.addItem(spell.school);
		this._sourceFilter.addItem(spell.source);
		this._traditionFilter.addItem(spell._fTraditions);
		this._focusFilter.addItem(spell._fFocus);
		this._classFilter.addItem(spell._fClasses)
		if (typeof (spell.domain) === "string") this._domainFilter.addItem(spell.domain);
		this._generalTrtFilter.addItem(spell._fgeneralTrts);
		this._alignmentTrtFilter.addItem(spell._falignmentTrts);
		this._elementalTrtFilter.addItem(spell._felementalTrts);
		this._energyTrtFilter.addItem(spell._fenergyTrts);
		this._rarityTrtFilter.addItem(spell._frarityTrts);
		this._sensesTrtFilter.addItem(spell._fsenseTrts);
		this._areaFilter.addItem(spell._areaTypes)
		this._miscFilter.addItem(spell._fMisc)
	}

	async _pPopulateBoxOptions (opts) {
		await SourceUtil.pInitSubclassReprintLookup();

		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._traditionFilter,
			this._schoolFilter,
			this._componentsFilter,
			this._savingThrowFilter,
			this._multiFocusFilter,
			this._traitFilter,
			this._timeFilter,
			this._durationFilter,
			this._areaFilter,
			this._rangeFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, s) {
		return this._filterBox.toDisplay(
			values,
			s.source,
			s.level,
			s._fTraditions,
			s.school,
			s._fComponents,
			s._fSavingThrow,
			[
				s._fFocus,
				s._fClasses,
				s.domain,
			],
			[
				s._frarityTrts,
				s._falignmentTrts,
				s._felementalTrts,
				s._fenergyTrts,
				s._fsenseTrts,
				s._fgeneralTrts,
			],
			s._fTimeType,
			s._fDurationType,
			s._areaTypes,
			s._fRange,
			s._fMisc,
		)
	}
}

PageFilterSpells.INCHES_PER_FOOT = 12;
PageFilterSpells.FEET_PER_MILE = 5280;

class ModalFilterSpells extends ModalFilter {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: "Spells",
			pageFilter: new PageFilterSpells(),
			fnSort: PageFilterSpells.sortSpells,
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "3-9"},
			{sort: "level", text: "Level", width: "1-5"},
			{sort: "time", text: "Cast Time", width: "2-4"},
			{sort: "school", text: "School", width: "2-7"},
			{sort: "source", text: "Source", width: "1-5"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pInit () {
	}

	async _pLoadAllData () {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await DataUtil.spell.pLoadAll();
		const fromBrew = brew.spell || [];
		return [...fromData, ...fromBrew];
	}

	_getListItem (pageFilter, spell, spI) {
		const eleLabel = document.createElement("label");
		eleLabel.className = "row lst--border no-select lst__wrp-cells";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](spell);
		const source = Parser.sourceJsonToAbv(spell.source);
		const levelText = `${Parser.spLevelToFull(spell.level)}`;
		const time = PageFilterSpells.getTblTimeStr(spell.cast);
		const school = Parser.spSchoolAbvToFull(spell.school);

		eleLabel.innerHTML = `<div class="col-1 pl-0 flex-vh-center"><input type="checkbox" class="no-events"></div>
		<div class="bold col-3-9">${spell.name}</div>
		<div class="col-1-5 text-center">${levelText}</div>
		<div class="col-2-4 text-center">${time}</div>
		<div class="col-2-7 sp__school-${spell.school} text-center" title="${Parser.spSchoolAbvToFull(spell.school)}" ${Parser.spSchoolAbvToStyle(spell.school)}>${school}</div>
		<div class="col-1-5 pr-0 text-center ${Parser.sourceJsonToColor(spell.source)}" title="${Parser.sourceJsonToFull(spell.source)}" ${BrewUtil.sourceJsonToStyle(spell.source)}>${source}</div>`;

		return new ListItem(
			spI,
			eleLabel,
			spell.name,
			{
				hash,
				source,
				sourceJson: spell.source,
				level: spell.level,
				time,
				school: Parser.spSchoolAbvToFull(spell.school),
				normalisedTime: spell._normalisedTime,
			},
			{
				cbSel: eleLabel.firstElementChild.firstElementChild,
			},
		);
	}
}

if (typeof module !== "undefined") {
	module.exports = PageFilterSpells;
}
