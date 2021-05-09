"use strict";

class PageFilterDeities extends PageFilter {
	static unpackAlignment (g) {
		g.alignment.sort(SortUtil.alignmentSort);
		if (g.alignment.length === 2 && g.alignment.includes("N")) {
			const out = [...g.alignment];
			if (out[0] === "N") out[0] = "NX";
			else out[1] = "NY";
			return out;
		}
		return MiscUtil.copy(g.alignment);
	}

	constructor () {
		super();
		this._sourceFilter = new SourceFilter();
		this._pantheonFilter = new Filter({
			header: "Pantheon",
			items: [
				"Golarion",
			],
		});
		this._alignmentFilter = new Filter({
			header: "Alignment",
			items: ["L", "NX", "C", "G", "NY", "E", "N"],
			displayFn: Parser.alignmentAbvToFull,
			itemSortFn: null,
		});
		this._fontFilter = new Filter({header: "Divine Font", displayFn: StrUtil.toTitleCase});
		this._skillFilter = new Filter({header: "Divine Skill", displayFn: StrUtil.toTitleCase});
		this._weaponFilter = new Filter({header: "Favored Weapon", displayFn: StrUtil.toTitleCase});
		this._domainFilter = new Filter({header: "Domain", displayFn: StrUtil.toTitleCase});
		this._spellFilter = new Filter({header: "Cleric Spells", displayFn: StrUtil.toTitleCase});
		this._benefitsFilter = new MultiFilter({
			header: "Devotee Benefits",
			filters: [this._fontFilter, this._skillFilter, this._weaponFilter, this._domainFilter, this._spellFilter],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: [],
			displayFn: StrUtil.uppercaseFirst,
		});
	}

	mutateForFilters (g) {
		g._fSources = SourceFilter.getCompleteFilterSources(g);
		g._fAlign = g.alignment ? PageFilterDeities.unpackAlignment(g) : [];
		if (g.devoteeBenefits) {
			g._fFont = g.devoteeBenefits.font;
			g._fSkill = g.devoteeBenefits.skill;
			g._fWeapon = g.devoteeBenefits.weapon.map(w => w.split("|")[0]);
			g._fDomains = g.devoteeBenefits.domains || [VeCt.STR_NONE];
			g._fSpells = Object.keys(g.devoteeBenefits.spells).map(k => g.devoteeBenefits.spells[k]).flat().map(s => s.split("|")[0]) || [];
		} else {
			g._fDomains = [VeCt.STR_NONE];
		}
		g._fDomains.sort(SortUtil.ascSort);

		g._fMisc = [];
		if (g.lore || g.symbolImg) g._fMisc.push("Has Lore");
		if (g.intercession) g._fMisc.push("Has Divine Intercession")
	}

	addToFilters (g, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(g._fSources);
		if (g._fFont) this._fontFilter.addItem(g._fFont);
		if (g._fSkill) this._skillFilter.addItem(g._fSkill);
		if (g._fWeapon) this._weaponFilter.addItem(g._fWeapon);
		this._domainFilter.addItem(g._fDomains);
		this._spellFilter.addItem(g._fSpells);
		this._pantheonFilter.addItem(g.pantheon);
		this._miscFilter.addItem(g._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._alignmentFilter,
			this._pantheonFilter,
			this._benefitsFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, g) {
		return this._filterBox.toDisplay(
			values,
			g._fSources,
			g._fAlign,
			g.pantheon,
			[
				g._fFont,
				g._fSkill,
				g._fWeapon,
				g._fDomains,
				g._fSpells,
			],
			g._fMisc,
		)
	}
}
