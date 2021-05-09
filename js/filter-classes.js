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
		})
	}

	get optionsFilter () { return this._optionsFilter; }

	mutateForFilters (cls, opts) {
		cls._fSources = SourceFilter.getCompleteFilterSources(cls);
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

	addToFilters (cls, isExcluded, opts) {
		if (isExcluded) return;
		this._sourceFilter.addItem(cls._fSources);
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
		opts.isCompact = true;
	}

	toDisplay (values, c) {
		return this._filterBox.toDisplay(
			values,
			c._fSources,
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
