class PageFilterSpells {
	// region static
	static sortSpells (a, b, o) {
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "level": return SortUtil.ascSort(a.values.level, b.values.level) || SortUtil.compareListNames(a, b);
			case "school": return SortUtil.ascSort(a.values.school, b.values.school) || SortUtil.compareListNames(a, b);
			case "concentration": return SortUtil.ascSort(a.values.concentration, b.values.concentration) || SortUtil.compareListNames(a, b);
			case "time": return SortUtil.ascSort(a.values.normalisedTime, b.values.normalisedTime) || SortUtil.compareListNames(a, b);
			case "range": return SortUtil.ascSort(a.values.normalisedRange, b.values.normalisedRange) || SortUtil.compareListNames(a, b);
		}
	}

	static sortMetaFilter (a, b) {
		const ixA = PageFilterSpells._META_FILTER_BASE_ITEMS.indexOf(a.item);
		const ixB = PageFilterSpells._META_FILTER_BASE_ITEMS.indexOf(b.item);

		if (~ixA && ~ixB) return ixA - ixB;
		if (~ixA) return -1;
		if (~ixB) return 1;
		if (a.item === "SRD") return 1;
		if (b.item === "SRD") return -1;
		return SortUtil.ascSortLower(a, b);
	}

	static getFilterAbilitySave (ability) {
		return `${ability.uppercaseFirst().substring(0, 3)}. Save`;
	}

	static getFilterAbilityCheck (ability) {
		return `${ability.uppercaseFirst().substring(0, 3)}. Check`;
	}

	static getMetaFilterObj (s) {
		const out = [];
		if (s.meta) {
			Object.entries(s.meta)
				.filter(([_, v]) => v)
				.sort(SortUtil.ascSort)
				.forEach(([k]) => out.push(k.toTitleCase()));
		}
		if (s.duration.filter(d => d.concentration).length) {
			out.push(PageFilterSpells._META_ADD_CONC);
			s._isConc = true;
		} else s._isConc = false;
		if (s.components && s.components.v) out.push(PageFilterSpells._META_ADD_V);
		if (s.components && s.components.s) out.push(PageFilterSpells._META_ADD_S);
		if (s.components && s.components.m) out.push(PageFilterSpells._META_ADD_M);
		if (s.components && s.components.r) out.push(PageFilterSpells._META_ADD_R);
		if (s.components && s.components.m && s.components.m.cost) out.push(PageFilterSpells._META_ADD_M_COST);
		if (s.components && s.components.m && s.components.m.consume) out.push(PageFilterSpells._META_ADD_M_CONSUMED);
		if ((s.miscTags && s.miscTags.includes("PRM")) || s.duration.filter(it => it.type === "permanent").length) out.push(Parser.spMiscTagToFull("PRM"));
		if ((s.miscTags && s.miscTags.includes("SCL")) || s.entriesHigherLevel) out.push(Parser.spMiscTagToFull("SCL"));
		if (s.miscTags && s.miscTags.includes("HL")) out.push(Parser.spMiscTagToFull("HL"));
		if (s.miscTags && s.miscTags.includes("SMN")) out.push(Parser.spMiscTagToFull("SMN"));
		if (s.miscTags && s.miscTags.includes("SGT")) out.push(Parser.spMiscTagToFull("SGT"));
		if (s.srd) out.push("SRD");
		return out;
	}

	static getFilterDuration (spell) {
		const fDur = spell.duration[0] || {type: "special"};
		switch (fDur.type) {
			case "instant": return "Instant";
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
			case "permanent": return "Permanent";
			case "special":
			default: return "Special";
		}
	}

	static getNormalisedTime (time) {
		const firstTime = time[0];
		let multiplier = 1;
		let offset = 0;
		switch (firstTime.unit) {
			case Parser.SP_TM_B_ACTION: offset = 1; break;
			case Parser.SP_TM_REACTION: offset = 2; break;
			case Parser.SP_TM_ROUND: multiplier = 6; break;
			case Parser.SP_TM_MINS: multiplier = 60; break;
			case Parser.SP_TM_HRS: multiplier = 3600; break;
		}
		if (time.length > 1) offset += 0.5;
		return (multiplier * firstTime.number) + offset;
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
				case UNT_FEET: multiplier = PageFilterSpells.INCHES_PER_FOOT; distance = dist.amount; break;
				case UNT_MILES: multiplier = PageFilterSpells.INCHES_PER_FOOT * PageFilterSpells.FEET_PER_MILE; distance = dist.amount; break;
				case RNG_SELF: distance = 0; break;
				case RNG_TOUCH: distance = 1; break;
				case RNG_SIGHT: multiplier = PageFilterSpells.INCHES_PER_FOOT * PageFilterSpells.FEET_PER_MILE; distance = 12; break; // assume sight range of person ~100 ft. above the ground
				case RNG_UNLIMITED_SAME_PLANE: distance = 900000000; break; // from BolS (homebrew)
				case RNG_UNLIMITED: distance = 900000001; break;
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
		return level === 0 ? Parser.spLevelToFull(level) : Parser.spLevelToFull(level) + " level";
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
			? `${time.unit.uppercaseFirst()}${time.unit === Parser.SP_TM_B_ACTION ? " acn." : ""}`
			: `${time.number} ${time.unit === Parser.SP_TM_B_ACTION ? "Bonus acn." : time.unit.uppercaseFirst()}${time.number > 1 ? "s" : ""}`;
	}

	static getClassFilterItem (c) {
		const nm = c.name.split("(")[0].trim();
		const addSuffix = SourceUtil.isNonstandardSource(c.source || SRC_PHB) || BrewUtil.hasSourceJson(c.source || SRC_PHB);
		const name = `${nm}${addSuffix ? ` (${Parser.sourceJsonToAbv(c.source)})` : ""}`;
		return new FilterItem({
			item: name,
			userData: SourceUtil.getFilterGroup(c.source || SRC_PHB)
		});
	}
	// endregion

	constructor () {
		this._brewSpellClasses = {PHB: {}};

		const sourceFilter = getSourceFilter();
		const levelFilter = new Filter({
			header: "Level",
			items: [
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9
			],
			displayFn: PageFilterSpells.getFltrSpellLevelStr
		});
		const classFilter = new Filter({
			header: "Class",
			groupFn: it => it.userData
		});
		const subclassFilter = new Filter({
			header: "Subclass",
			nests: {},
			groupFn: (it) => SourceUtil.hasBeenReprinted(it.userData.subClass.name, it.userData.subClass.source) || Parser.sourceJsonToFull(it.userData.subClass.source).startsWith(UA_PREFIX) || Parser.sourceJsonToFull(it.userData.subClass.source).startsWith(PS_PREFIX)
		});
		const variantClassFilter = new Filter({header: "Variant Class"});
		const classAndSubclassFilter = new MultiFilter({header: "Classes", filters: [classFilter, subclassFilter, variantClassFilter]});
		const raceFilter = new Filter({header: "Race"});
		const backgroundFilter = new Filter({header: "Background"});
		const metaFilter = new Filter({
			header: "Components & Miscellaneous",
			items: [...PageFilterSpells._META_FILTER_BASE_ITEMS, "Ritual", "Technomagic", "SRD"],
			itemSortFn: PageFilterSpells.sortMetaFilter
		});
		const schoolFilter = new Filter({
			header: "School",
			items: [...Parser.SKL_ABVS],
			displayFn: Parser.spSchoolAbvToFull
		});
		const subSchoolFilter = new Filter({
			header: "Subschool",
			items: [],
			displayFn: Parser.spSchoolAbvToFull
		});
		const damageFilter = new Filter({
			header: "Damage Type",
			items: MiscUtil.copy(Parser.DMG_TYPES),
			displayFn: StrUtil.uppercaseFirst
		});
		const conditionFilter = new Filter({
			header: "Conditions Inflicted",
			items: MiscUtil.copy(Parser.CONDITIONS),
			displayFn: StrUtil.uppercaseFirst
		});
		const spellAttackFilter = new Filter({
			header: "Spell Attack",
			items: ["M", "R", "O"],
			displayFn: Parser.spAttackTypeToFull,
			itemSortFn: null
		});
		const saveFilter = new Filter({
			header: "Saving Throw",
			items: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
			displayFn: PageFilterSpells.getFilterAbilitySave,
			itemSortFn: null
		});
		const checkFilter = new Filter({
			header: "Opposed Ability Check",
			items: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
			displayFn: PageFilterSpells.getFilterAbilityCheck,
			itemSortFn: null
		});
		const timeFilter = new Filter({
			header: "Cast Time",
			items: [
				Parser.SP_TM_ACTION,
				Parser.SP_TM_B_ACTION,
				Parser.SP_TM_REACTION,
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
			labels: ["Instant", "1 Round", "1 Minute", "10 Minutes", "1 Hour", "8 Hours", "24+ Hours", "Permanent", "Special"]
		});
		const rangeFilter = new Filter({
			header: "Range",
			items: [
				PageFilterSpells.F_RNG_SELF,
				PageFilterSpells.F_RNG_TOUCH,
				PageFilterSpells.F_RNG_POINT,
				PageFilterSpells.F_RNG_SELF_AREA,
				PageFilterSpells.F_RNG_SPECIAL
			],
			itemSortFn: null
		});
		const areaTypeFilter = new Filter({
			header: "Area Style",
			items: ["ST", "MT", "R", "N", "C", "Y", "H", "L", "S", "Q", "W"],
			displayFn: Parser.spAreaTypeToFull,
			itemSortFn: null
		});

		this._filterBox = null;

		this._sourceFilter = sourceFilter;
		this._classFilter = classFilter;
		this._subclassFilter = subclassFilter;
		this._levelFilter = levelFilter;
		this._variantClassFilter = variantClassFilter;
		this._classAndSubclassFilter = classAndSubclassFilter;
		this._raceFilter = raceFilter;
		this._backgroundFilter = backgroundFilter;
		this._metaFilter = metaFilter;
		this._schoolFilter = schoolFilter;
		this._subSchoolFilter = subSchoolFilter;
		this._damageFilter = damageFilter;
		this._conditionFilter = conditionFilter;
		this._spellAttackFilter = spellAttackFilter;
		this._saveFilter = saveFilter;
		this._checkFilter = checkFilter;
		this._timeFilter = timeFilter;
		this._durationFilter = durationFilter;
		this._rangeFilter = rangeFilter;
		this._areaTypeFilter = areaTypeFilter;
	}

	get filterBox () { return this._filterBox; }
	get sourceFilter () { return this._sourceFilter; }

	populateHomebrewClassLookup (homebrew) {
		// load homebrew class spell list addons
		const handleSubclass = (className, classSource = SRC_PHB, sc) => {
			const genSubclassSpell = (it, subSubclass) => {
				const name = (typeof it === "string" ? it : it.name).toLowerCase();
				const source = typeof it === "string" ? "PHB" : it.source;
				this._brewSpellClasses[source] = this._brewSpellClasses[source] || {fromClassList: [], fromSubclass: []};
				this._brewSpellClasses[source][name] = this._brewSpellClasses[source][name] || {fromClassList: [], fromSubclass: []};
				const toAdd = {
					class: {
						name: className,
						source: classSource
					},
					subclass: {
						name: sc.shortName,
						source: sc.source
					}
				};
				if (subSubclass) toAdd.subclass.subSubclass = subSubclass;
				this._brewSpellClasses[source][name].fromSubclass.push(toAdd);
			};

			if (sc.subclassSpells) sc.subclassSpells.forEach(it => genSubclassSpell(it));
			if (sc.subSubclassSpells) $.each(sc.subSubclassSpells, (ssC, arr) => arr.forEach(it => genSubclassSpell(it, ssC)));
		};

		if (homebrew.class) {
			homebrew.class.forEach(c => {
				if (c.classSpells) {
					c.classSpells.forEach(it => {
						const name = (typeof it === "string" ? it : it.name).toLowerCase();
						const source = typeof it === "string" ? "PHB" : it.source;
						this._brewSpellClasses[source] = this._brewSpellClasses[source] || {};
						this._brewSpellClasses[source][name] = this._brewSpellClasses[source][name] || {fromClassList: [], fromSubclass: []};
						this._brewSpellClasses[source][name].fromClassList.push({name: c.name, source: c.source});
					});
				}
				if (c.subclasses) c.subclasses.forEach(sc => handleSubclass(c.name, c.source, sc));
			})
		}
		if (homebrew.subclass) homebrew.subclass.forEach(sc => handleSubclass(sc.class, sc.classSource, sc));
	}

	addToFilters (spell) {
		Renderer.spell.initClasses(spell, this._brewSpellClasses);

		// used for sorting
		spell._normalisedTime = PageFilterSpells.getNormalisedTime(spell.time);
		spell._normalisedRange = PageFilterSpells.getNormalisedRange(spell.range);

		// used for filtering
		spell._fSources = ListUtil.getCompleteFilterSources(spell);
		spell._fMeta = PageFilterSpells.getMetaFilterObj(spell);
		spell._fClasses = spell.classes && spell.classes.fromClassList ? spell.classes.fromClassList.map(PageFilterSpells.getClassFilterItem) : [];
		spell._fSubclasses = spell.classes && spell.classes.fromSubclass
			? spell.classes.fromSubclass.map(c => new FilterItem({
				item: `${c.class.name}: ${PageFilterSpells.getClassFilterItem(c.subclass).item}`,
				nest: c.class.name,
				userData: {
					subClass: {
						name: c.subclass.name,
						source: c.subclass.source
					},
					className: c.class.name
				}
			}))
			: [];
		spell._fVariantClasses = spell.classes && spell.classes.fromClassListVariant ? spell.classes.fromClassListVariant.map(PageFilterSpells.getClassFilterItem) : [];
		spell._fRaces = spell.races ? spell.races.map(r => r.baseName || r.name) : [];
		spell._fBackgrounds = spell.backgrounds ? spell.backgrounds.map(bg => bg.name) : [];
		spell._fTimeType = spell.time.map(t => t.unit);
		spell._fDurationType = PageFilterSpells.getFilterDuration(spell);
		spell._fRangeType = PageFilterSpells.getRangeType(spell.range);

		// region populate filters
		if (spell.level > 9) this._levelFilter.addItem(spell.level);
		this._sourceFilter.addItem(spell._fSources);
		this._metaFilter.addItem(spell._fMeta);
		this._raceFilter.addItem(spell._fRaces);
		this._backgroundFilter.addItem(spell._fBackgrounds);
		spell._fClasses.forEach(c => this._classFilter.addItem(c));
		spell._fSubclasses.forEach(sc => {
			this._subclassFilter.addNest(sc.userData.className, {isHidden: true});
			this._subclassFilter.addItem(sc);
		});
		spell._fVariantClasses.forEach(c => this._variantClassFilter.addItem(c));
		this._subSchoolFilter.addItem(spell.subschools);
		// endregion
	}

	async pInitFilterBox (opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._classAndSubclassFilter,
			this._raceFilter,
			this._backgroundFilter,
			this._metaFilter,
			this._schoolFilter,
			this._subSchoolFilter,
			this._damageFilter,
			this._conditionFilter,
			this._spellAttackFilter,
			this._saveFilter,
			this._checkFilter,
			this._timeFilter,
			this._durationFilter,
			this._rangeFilter,
			this._areaTypeFilter
		];

		this._filterBox = new FilterBox(opts);
		await this._filterBox.pDoLoadState();
	}

	toDisplay (values, s) {
		return this._filterBox.toDisplay(
			values,
			s._fSources,
			s.level,
			[s._fClasses, s._fSubclasses, s._fVariantClasses],
			s._fRaces,
			s._fBackgrounds,
			s._fMeta,
			s.school,
			s.subschools,
			s.damageInflict,
			s.conditionInflict,
			s.spellAttack,
			s.savingThrow,
			s.opposedCheck,
			s._fTimeType,
			s._fDurationType,
			s._fRangeType,
			s.areaTags
		)
	}
}
// toss these into the "Tags" section to save screen space
PageFilterSpells._META_ADD_CONC = "Concentration";
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

PageFilterSpells._META_FILTER_BASE_ITEMS = [PageFilterSpells._META_ADD_CONC, PageFilterSpells._META_ADD_V, PageFilterSpells._META_ADD_S, PageFilterSpells._META_ADD_M, PageFilterSpells._META_ADD_R, PageFilterSpells._META_ADD_M_COST, PageFilterSpells._META_ADD_M_CONSUMED, ...Object.values(Parser.SP_MISC_TAG_TO_FULL)];

PageFilterSpells.INCHES_PER_FOOT = 12;
PageFilterSpells.FEET_PER_MILE = 5280;
