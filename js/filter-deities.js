"use strict";

class PageFilterDeities extends PageFilter {
	constructor () {
		super();
		this._sourceFilter = new SourceFilter();
		this._categoryFilter = new Filter({
			header: "Category",
			items: [],
		});
		this._alignmentFilter = new Filter({
			header: "Alignment",
			itemSortFn: SortUtil.alignmentSort,
			displayFn: Parser.alignAbvToFull,
		});
		this._fontFilter = new Filter({header: "Divine Font", displayFn: StrUtil.toTitleCase});
		this._skillFilter = new Filter({header: "Divine Skill", displayFn: StrUtil.toTitleCase});
		this._weaponFilter = new Filter({header: "Favored Weapon", displayFn: StrUtil.toTitleCase});
		this._domainFilter = new Filter({header: "Domain", displayFn: StrUtil.toTitleCase});
		this._0Filter = new Filter({"header": "Cantrips", displayFn: StrUtil.toTitleCase});
		this._1Filter = new Filter({"header": "1st", displayFn: StrUtil.toTitleCase});
		this._2Filter = new Filter({"header": "2nd", displayFn: StrUtil.toTitleCase});
		this._3Filter = new Filter({"header": "3rd", displayFn: StrUtil.toTitleCase});
		this._4Filter = new Filter({"header": "4th", displayFn: StrUtil.toTitleCase});
		this._5Filter = new Filter({"header": "5th", displayFn: StrUtil.toTitleCase});
		this._6Filter = new Filter({"header": "6th", displayFn: StrUtil.toTitleCase});
		this._7Filter = new Filter({"header": "7th", displayFn: StrUtil.toTitleCase});
		this._8Filter = new Filter({"header": "8th", displayFn: StrUtil.toTitleCase});
		this._9Filter = new Filter({"header": "9th", displayFn: StrUtil.toTitleCase});
		this._10Filter = new Filter({"header": "10th", displayFn: StrUtil.toTitleCase});
		this._spellFilter = new MultiFilter({
			header: "Cleric Spells by Level",
			filters: [this._0Filter, this._1Filter, this._2Filter, this._3Filter, this._4Filter, this._5Filter, this._6Filter, this._7Filter, this._8Filter, this._9Filter, this._10Filter],
		});
		this._benefitsFilter = new MultiFilter({
			header: "Devotee Benefits",
			filters: [this._fontFilter, this._skillFilter, this._weaponFilter, this._domainFilter],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: [],
			displayFn: StrUtil.uppercaseFirst,
		});
	}

	mutateForFilters (g) {
		g._fSources = SourceFilter.getCompleteFilterSources(g);
		g._fSpells = Array(11).map(_ => []);
		if (g.devoteeBenefits) {
			if (g.devoteeBenefits.font) g._fFont = g.devoteeBenefits.font;
			if (g.devoteeBenefits.skill) g._fSkill = g.devoteeBenefits.skill;
			if (g.devoteeBenefits.weapon) g._fWeapon = g.devoteeBenefits.weapon.map(w => w.split("|")[0]);
			if (g.devoteeBenefits.domains) g._fDomains = g.devoteeBenefits.domains || [VeCt.STR_NONE];
			if (g.devoteeBenefits.spells) g._fSpells = [...Array(11).keys()].map(l => (g.devoteeBenefits.spells[l] || []).map(s => s.split("|")[0]));
		} else {
			g._fDomains = [VeCt.STR_NONE];
		}
		if (g.domains) g._fDomains.sort(SortUtil.ascSort);

		g._fMisc = [];
		if (g.lore || g.symbolImg) g._fMisc.push("Has Lore");
		if (g.intercession) g._fMisc.push("Has Divine Intercession")
		if (g.core === true) g._fMisc.push("Core")
		if (g.hasLore === true) g._fMisc.push("Has Lore")
		if (g.images) g._fMisc.push("Has Images")
	}

	addToFilters (g, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(g._fSources);
		if (g._fFont) this._fontFilter.addItem(g._fFont);
		if (g._fSkill) this._skillFilter.addItem(g._fSkill);
		if (g._fWeapon) this._weaponFilter.addItem(g._fWeapon);
		if (g.alignment) this._alignmentFilter.addItem(g.alignment);
		this._domainFilter.addItem(g._fDomains);
		this._categoryFilter.addItem(g.category);
		this._miscFilter.addItem(g._fMisc);
		g._fSpells.forEach((sp, i) => {
			if (sp) {
				switch (i) {
					case 0: this._0Filter.addItem(sp); break;
					case 1: this._1Filter.addItem(sp); break;
					case 2: this._2Filter.addItem(sp); break;
					case 3: this._3Filter.addItem(sp); break;
					case 4: this._4Filter.addItem(sp); break;
					case 5: this._5Filter.addItem(sp); break;
					case 6: this._6Filter.addItem(sp); break;
					case 7: this._7Filter.addItem(sp); break;
					case 8: this._8Filter.addItem(sp); break;
					case 9: this._9Filter.addItem(sp); break;
					case 10: this._10Filter.addItem(sp); break;
				}
			}
		})
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._alignmentFilter,
			this._categoryFilter,
			this._benefitsFilter,
			this._spellFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, g) {
		return this._filterBox.toDisplay(
			values,
			g._fSources,
			g.alignment,
			g.category,
			[
				g._fFont,
				g._fSkill,
				g._fWeapon,
				g._fDomains,
			],
			g._fSpells,
			g._fMisc,
		)
	}
}
