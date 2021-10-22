"use strict";

// noinspection JSUnresolvedVariable
class PageFilterVehicles extends PageFilter {
	static _priceCategory (value) {
		if (typeof value !== "number") return "0 gp";
		if (value < 5 * 100) return "0 gp";
		else if (value < 10 * 100) return "5 gp";
		else if (value < 50 * 100) return "10 gp";
		else if (value < 100 * 100) return "50 gp";
		else if (value < 500 * 100) return "100 gp";
		else if (value < 750 * 100) return "500 gp";
		else if (value < 1000 * 100) return "750 gp";
		else if (value < 2500 * 100) return "1,000 gp";
		else if (value < 5000 * 100) return "2,500 gp";
		else if (value < 10000 * 100) return "5,000 gp";
		else if (value < 25000 * 100) return "10,000 gp";
		else if (value < 50000 * 100) return "25,000 gp";
		else if (value < 100000 * 100) return "50,000 gp";
		else return "100,000+ gp";
	}

	constructor () {
		super();
		this._levelFilter = new RangeFilter({header: "Level"});
		this._traitFilter = new TraitsFilter({header: "Traits"});
		this._priceFilter = new RangeFilter({
			header: "Price",
			isLabelled: true,
			labels: ["0 gp", "5 gp", "10 gp", "50 gp", "100 gp", "250 gp", "500 gp", "750 gp", "1,000 gp", "2,500 gp", "5,000 gp", "10,000 gp", "25,000 gp", "50,000 gp", "100,000+ gp"],
			labelSortFn: null,
		});
		this._longFilter = new RangeFilter({header: "Long"});
		this._wideFilter = new RangeFilter({header: "Wide"});
		this._highFilter = new RangeFilter({header: "High"});
		this._spaceFilter = new MultiFilter({
			header: "Space",
			filters: [this._longFilter, this._wideFilter, this._highFilter],
		});
		this._crewSizeFilter = new RangeFilter({header: "Crew Size"});
		this._crewTypesFilter = new Filter({
			header: "Members",
			displayFn: (it) => it.toTitleCase(),
		});
		this._crewFilter = new MultiFilter({
			header: "Crew",
			filters: [this._crewSizeFilter, this._crewTypesFilter],
		});
		this._passengerFilter = new RangeFilter({header: "Passengers"});
		this._speedFilter = new RangeFilter({
			header: "Speed",
			isLabelled: true,
		});
		this._speedTypeFilter = new Filter({
			header: "Speed Types",
			displayFn: (x) => x.uppercaseFirst(),
		})
		this._speedMultiFilter = new MultiFilter({
			header: "Speeds",
			filters: [this._speedFilter, this._speedTypeFilter],
		});
		this._acFilter = new RangeFilter({header: "Armor Class"});
		this._hardnessFilter = new RangeFilter({header: "Hardness"});
		this._hpFilter = new RangeFilter({header: "Hit Points"});
		this._fortFilter = new RangeFilter({header: "Fortitude"});
		this._refFilter = new RangeFilter({header: "Reflex"});
		this._willFilter = new RangeFilter({header: "Will"});
		this._savingThrowFilter = new MultiFilter({
			header: "Saving Throws",
			filters: [this._fortFilter],
		});
		this._immunitiesFilter = new Filter({
			header: "Immunities",
			displayFn: StrUtil.toTitleCase,
		});
		this._resistancesFilter = new Filter({
			header: "Resistances",
			displayFn: StrUtil.toTitleCase,
		});
		this._weaknessesFilter = new Filter({
			header: "Weaknesses",
			displayFn: StrUtil.toTitleCase,
		});
		this._defenseFilter = new MultiFilter({
			header: "Defenses",
			filters: [this._acFilter, this._hardnessFilter, this._hpFilter],
		});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		it._sPrice = Parser.priceToValue(it.price);

		it._fTraits = ([...(it.traits || []), it.size]).filter(Boolean).map(t => Parser.getTraitName(t));
		if (!it._fTraits.map(t => Renderer.trait.isTraitInCategory(t, "Rarity")).some(Boolean)) it._fTraits.push("Common");
		it._fCrewSize = (it.crew || []).map(it => it.number).reduce((a, b) => a + b, 0);
		it._fCrewTypes = (it.crew || []).map(it => it.type);
		it._fPrice = PageFilterVehicles._priceCategory(it._sPrice);
		it._fAC = Math.max(...Object.values(it.defenses.ac));
		it._fHardness = Math.max(...Object.values(it.defenses.hardness));
		it._fHP = Math.max(...Object.values(it.defenses.hp));
		it._fResistances = it.defenses.resistances ? it.defenses.resistances.map(r => r.name) : [];
		it._fWeaknesses = it.defenses.weaknesses ? it.defenses.weaknesses.map(w => w.name) : [];
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._levelFilter.addItem(it.level);
		this._traitFilter.addItem(it._fTraits);
		this._priceFilter.addItem(it._fPrice);
		this._longFilter.addItem(it.space.long.number);
		this._wideFilter.addItem(it.space.wide.number);
		this._highFilter.addItem(it.space.high.number);
		this._crewSizeFilter.addItem(it._fCrewSize);
		this._crewTypesFilter.addItem(it._fCrewTypes);
		this._passengerFilter.addItem(it.passengers || 0);
		this._speedTypeFilter.addItem(it.speed.type);
		this._speedFilter.addItem(it.speed.speed);
		this._acFilter.addItem(it._fAC);
		this._hardnessFilter.addItem(it._fHardness);
		this._hpFilter.addItem(it._fHP);
		if (it.defenses.savingThrows.fort) this._fortFilter.addItem(it.defenses.savingThrows.fort);
		if (it.defenses.savingThrows.ref) this._fortFilter.addItem(it.defenses.savingThrows.ref);
		if (it.defenses.savingThrows.will) this._fortFilter.addItem(it.defenses.savingThrows.will);
		this._immunitiesFilter.addItem(it.defenses.immunities);
		this._resistancesFilter.addItem(it._fResistances);
		this._weaknessesFilter.addItem(it._fWeaknesses);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._levelFilter,
			this._traitFilter,
			this._priceFilter,
			this._spaceFilter,
			this._crewFilter,
			this._passengerFilter,
			this._speedMultiFilter,
			this._defenseFilter,
			this._savingThrowFilter,
			this._immunitiesFilter,
			this._resistancesFilter,
			this._weaknessesFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.level,
			it._fTraits,
			it._fPrice,
			[
				it.space.long.number,
				it.space.wide.number,
				it.space.high.number,
			],
			[
				it._fCrewSize,
				it._fCrewTypes,
			],
			it.passengers || 0,
			[
				it.speed.speed,
				it.speed.type,
			],
			[
				it.defenses._fAC,
				it.defenses._fHardness,
				it.defenses._fHP,
			],
			[
				it.defenses.savingThrows.fort,
			],
			it.defenses.immunities,
			it._fResistances,
			it._fWeaknesses,
		)
	}
}
