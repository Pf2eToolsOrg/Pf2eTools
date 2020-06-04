"use strict";

class PageFilterDeities extends PageFilter {
	constructor () {
		super();
		this._sourceFilter = SourceFilter.getInstance();
		this._pantheonFilter = new Filter({
			header: "Pantheon",
			items: [
				"Celtic",
				"Dawn War",
				"Dragonlance",
				"Drow",
				"Dwarven",
				"Eberron",
				"Egyptian",
				"Elven",
				"Faerûnian",
				"Forgotten Realms",
				"Gnomish",
				"Greek",
				"Greyhawk",
				"Halfling",
				"Nonhuman",
				"Norse",
				"Orc"
			]
		});
		this._categoryFilter = new Filter({
			header: "Category",
			items: [
				VeCt.STR_NONE,
				"Other Faiths of Eberron",
				"The Dark Six",
				"The Gods of Evil",
				"The Gods of Good",
				"The Gods of Neutrality",
				"The Sovereign Host"
			],
			itemSortFn: null
		});
		this._alignmentFilter = new Filter({
			header: "Alignment",
			items: ["L", "NX", "C", "G", "NY", "E", "N"],
			displayFn: Parser.alignmentAbvToFull,
			itemSortFn: null
		});
		this._domainFilter = new Filter({
			header: "Domain",
			items: ["Arcana", "Death", "Forge", "Grave", "Knowledge", "Life", "Light", "Nature", VeCt.STR_NONE, "Order", "Tempest", "Trickery", "War"]
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: [STR_REPRINTED, "SRD"],
			displayFn: StrUtil.uppercaseFirst,
			deselFn: (it) => { return it === STR_REPRINTED }
		});
	}

	mutateForFilters (g) {
		g._fAlign = g.alignment ? unpackAlignment(g) : [];
		if (!g.category) g.category = VeCt.STR_NONE;
		if (!g.domains) g.domains = [VeCt.STR_NONE];
		g.domains.sort(SortUtil.ascSort);

		g._fMisc = g.reprinted ? [STR_REPRINTED] : [];
		if (g.srd) g._fMisc.push("SRD");
	}

	addToFilters (g, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(g.source);
		this._pantheonFilter.addItem(g.pantheon);
		this._categoryFilter.addItem(g.category);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._alignmentFilter,
			this._pantheonFilter,
			this._categoryFilter,
			this._domainFilter,
			this._miscFilter
		];
	}

	toDisplay (values, g) {
		return this._filterBox.toDisplay(
			values,
			g.source,
			g._fAlign,
			g.pantheon,
			g.category,
			g.domains,
			g._fMisc
		)
	}
}
