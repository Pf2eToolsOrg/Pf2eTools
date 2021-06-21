"use strict";

class PageFilterClasses extends PageFilter {
	constructor () {
		super();
		this._perceptionFilter = new Filter({header: "Perception"});
		this._fortFilter = new Filter({header: "Fortitude"});
		this._refFilter = new Filter({header: "Reflex"});
		this._willFilter = new Filter({header: "Will"});
		this._skillsFilter = new Filter({header: "Skills"})
		this._proficienciesFilter = new MultiFilter({
			header: "Initial Proficiencies",
			filters: [this._perceptionFilter, this._fortFilter, this._refFilter, this._willFilter, this._skillsFilter],
		});
		this._miscFilter = new Filter({header: "Miscellaneous", itemSortFn: null});
		this._optionsFilter = new OptionsFilter({
			header: "Other Options",
			defaultState: {
				isDisplayClassIfSubclassActive: false,
			},
			displayFn: k => {
				switch (k) {
					case "isDisplayClassIfSubclassActive": return "Display Class if Any Subclass is Visible";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
			displayFnMini: k => {
				switch (k) {
					case "isDisplayClassIfSubclassActive": return "Sc>C";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
		});

		this._sourceWalker = MiscUtil.getWalker({keyBlacklist: new Set(["type", "data"])}).walk;
		this._sourcePrimitiveHandlers = {
			string: (obj, lastKey) => {
				if (lastKey === "source") this._sourceFilter.addItem(obj);
				return obj;
			},
		};
	}

	get optionsFilter () { return this._optionsFilter; }

	mutateForFilters (cls, opts) {
		cls._fSources = SourceFilter.getCompleteFilterSources(cls);
		cls._fSourceSubclass = [...new Set([cls.source, ...cls.subclasses.map(it => it.source)])];

		cls._fPerception = Parser.proficiencyAbvToFull(cls.initialProficiencies.perception);
		cls._fFort = Parser.proficiencyAbvToFull(cls.initialProficiencies.fort);
		cls._fRef = Parser.proficiencyAbvToFull(cls.initialProficiencies.ref);
		cls._fWill = Parser.proficiencyAbvToFull(cls.initialProficiencies.will);
		cls._fSkills = [];
		Object.keys(cls.initialProficiencies.skills).forEach(pr => {
			switch (pr) {
				case "t": cls._fSkills.push(cls.initialProficiencies.skills[pr]); break;
				case "e": cls._fSkills.push(cls.initialProficiencies.skills[pr].map(s => `${s} (Expert)`)); break;
				case "m": cls._fSkills.push(cls.initialProficiencies.skills[pr].map(s => `${s} (Master)`)); break;
				case "l": cls._fSkills.push(cls.initialProficiencies.skills[pr].map(s => `${s} (Legendary)`)); break;
				default: break;
			}
		});
		cls._fMisc = [];
	}

	_addEntrySourcesToFilter (entry) { this._sourceWalker(entry, this._sourcePrimitiveHandlers); }

	addToFilters (cls, isExcluded, opts) {
		if (isExcluded) return;
		opts = opts || {};
		const subclassExclusions = opts.subclassExclusions || {};
		this._sourceFilter.addItem(cls._fSources);

		if (cls.fluff) cls.fluff.forEach(it => this._addEntrySourcesToFilter(it));
		cls.classFeatures.forEach(lvlFeatures => lvlFeatures.forEach(feature => this._addEntrySourcesToFilter(feature)));

		cls.subclasses.forEach(sc => {
			const isScExcluded = (subclassExclusions[sc.source] || {})[sc.name] || false;
			if (!isScExcluded) {
				this._sourceFilter.addItem(sc.source);
				sc.subclassFeatures.forEach(lvlFeatures => lvlFeatures.forEach(feature => this._addEntrySourcesToFilter(feature)))
			}
		});
		this._perceptionFilter.addItem(cls._fPerception);
		this._fortFilter.addItem(cls._fFort);
		this._refFilter.addItem(cls._fRef);
		this._willFilter.addItem(cls._fWill);
		this._miscFilter.addItem(cls._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._proficienciesFilter,
			this._miscFilter,
			this._optionsFilter,
		];
	}

	isClassNaturallyDisplayed (values, cls) {
		return this._filterBox.toDisplay(
			values,
			cls.source,
			Array(this._proficienciesFilter._filters.length),
			cls._fMisc,
		);
	}

	isAnySubclassDisplayed (values, cls) {
		return values[this._optionsFilter.header].isDisplayClassIfSubclassActive && (cls.subclasses || []).some(sc => {
			return this._filterBox.toDisplay(
				values,
				sc.source,
				Array(this._proficienciesFilter._filters.length),
				sc._fMisc,
			);
		});
	}

	getActiveSource (values) {
		const sourceFilterValues = values[this._sourceFilter.header];
		if (!sourceFilterValues) return null;
		return Object.keys(sourceFilterValues).find(it => this._sourceFilter.toDisplay(values, it));
	}

	toDisplay (values, c) {
		return this._filterBox.toDisplay(
			values,
			this.isAnySubclassDisplayed(values, c) ? c._fSourceSubclass : c._fSources,
			[
				c._fPerception,
				c._fFort,
				c._fRef,
				c._fWill,
				c._fSkills,
			],
			c._fMisc,
		)
	}
}
