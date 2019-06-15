"use strict";

if (typeof require !== "undefined") {
	require('../js/utils.js');
	require('../js/render.js');
}

class Omnidexer {
	constructor (id = 0) {
		/**
		 * Produces index of the form:
		 * {
		 *   n: "Display Name",
		 *   s: "PHB", // source
		 *   u: "spell name_phb,
		 *   p: 110, // page
		 *   h: 1 // if hover enabled, otherwise undefined
		 *   c: 10, // category ID
		 *   id: 123 // index ID
		 * }
		 */
		this._index = [];
		this.id = id;
		this._metaMap = {};
		this._metaIndices = {};
	}

	getIndex () {
		return {
			x: this._index,
			m: this._metaMap
		};
	}

	static decompressIndex (indexGroup) {
		const {x, m} = indexGroup;

		const props = new Set();
		// de-invert the metadata
		const lookup = {};
		Object.keys(m).forEach(k => {
			props.add(k);
			Object.entries(m[k]).forEach(([kk, vv]) => (lookup[k] = lookup[k] || {})[vv] = kk);
		});

		x.forEach(it => Object.keys(it).filter(k => props.has(k))
			.forEach(k => it[k] = lookup[k][it[k]] || it[k]));
		return x;
	}

	static getProperty (obj, withDots) {
		return withDots.split(".").reduce((o, i) => o[i], obj);
	}

	/**
	 * Compute and add an index item.
	 * @param arbiter The indexer arbiter.
	 * @param json A raw JSON object of a file, typically containing an array to be indexed.
	 * @param options Options object.
	 * @param options.isNoFilter If filtering rules are to be ignored (e.g. for tests).
	 * @param options.alt Sub-options for alternate indices.
	 */
	addToIndex (arbiter, json, options) {
		options = options || {};
		const index = this._index;
		let id = this.id;

		const getToAdd = (it, toMerge, i) => {
			const src = Omnidexer.getProperty(it, arbiter.source || "source");
			const hash = arbiter.hashBuilder
				? arbiter.hashBuilder(it, i)
				: UrlUtil.URL_TO_HASH_BUILDER[arbiter.baseUrl](it);
			const toAdd = {
				c: arbiter.category,
				s: this.getMetaId("s", src),
				id: id++,
				u: hash,
				p: Omnidexer.getProperty(it, arbiter.page || "page")
			};
			if (arbiter.hover) toAdd.h = 1;
			if (options.alt) {
				if (options.alt.additionalProperties) Object.entries(options.alt.additionalProperties).forEach(([k, getV]) => toAdd[k] = getV(it));
			}
			Object.assign(toAdd, toMerge);
			return toAdd;
		};

		const handleItem = (it, i, name) => {
			if (!it.noDisplay) {
				const toAdd = getToAdd(it, {n: name}, i);
				if ((options.isNoFilter || (!arbiter.include && !(arbiter.filter && arbiter.filter(it))) || (!arbiter.filter && (!arbiter.include || arbiter.include(it)))) && !arbiter.onlyDeep) index.push(toAdd);
				if (arbiter.deepIndex) {
					const primary = {it: it, i: i, parentName: name};
					const deepItems = arbiter.deepIndex(this, primary, it);
					deepItems.forEach(item => {
						const toAdd = getToAdd(it, item);
						if (!arbiter.filter || !arbiter.filter(it)) index.push(toAdd);
					})
				}
			}
		};

		Omnidexer.getProperty(json, arbiter.listProp).forEach((it, i) => {
			const name = Omnidexer.getProperty(it, arbiter.primary || "name");
			handleItem(it, i, name);

			if (it.alias) it.alias.forEach(a => handleItem(it, i, a));
		});

		this.id = id;
	}

	/**
	 * Directly add a pre-computed index item.
	 * @param item
	 */
	pushToIndex (item) {
		item.id = this.id++;
		this._index.push(item);
	}

	static arrIncludesOrEquals (checkAgainst, item) {
		return checkAgainst instanceof Array ? checkAgainst.includes(item) : checkAgainst === item;
	}

	getMetaId (k, v) {
		this._metaMap[k] = this._metaMap[k] || {};
		// store the index in "inverted" format to prevent extra quote characters around numbers
		if (this._metaMap[k][v] != null) return this._metaMap[k][v];
		else {
			this._metaIndices[k] = this._metaIndices[k] || 0;
			this._metaMap[k][v] = this._metaIndices[k];
			const out = this._metaIndices[k];
			this._metaIndices[k]++;
			return out;
		}
	}
}
/**
 * See docs for `TO_INDEX` below.
 * Instead of `file` these have `dir` and will read an `index.json` from that directory to find all files to be indexed
 */
Omnidexer.TO_INDEX__FROM_INDEX_JSON = [
	{
		category: Parser.CAT_ID_CREATURE,
		dir: "bestiary",
		primary: "name",
		source: "source",
		listProp: "monster",
		baseUrl: "bestiary.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_SPELL,
		dir: "spells",
		primary: "name",
		source: "source",
		listProp: "spell",
		baseUrl: "spells.html",
		hover: true,
		alternateIndexes: {
			spell: {
				additionalProperties: {
					lvl: spell => spell.level
				}
			}
		}
	},
	{
		category: Parser.CAT_ID_CLASS,
		dir: "class",
		primary: "name",
		source: "source",
		listProp: "class",
		baseUrl: "classes.html",
		deepIndex: (indexer, primary, it) => {
			if (!it.subclasses) return [];
			return it.subclasses.map(sc => ({
				n: `${primary.parentName}; ${sc.name}`,
				s: indexer.getMetaId("s", sc.source),
				u: `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](it)}${HASH_PART_SEP}${HASH_SUBCLASS}${UrlUtil.encodeForHash(sc.name)}${HASH_SUB_LIST_SEP}${UrlUtil.encodeForHash(sc.source)}`
			}))
		}
	},
	{
		category: Parser.CAT_ID_CLASS_FEATURE,
		dir: "class",
		primary: "name",
		source: "source",
		listProp: "class",
		baseUrl: "classes.html",
		onlyDeep: true,
		hover: true,
		deepIndex: (indexer, primary, it) => {
			const out = [];
			const entriesIxd = UrlUtil.class.getIndexedEntries(it);
			entriesIxd.forEach(it => {
				switch (it._type) {
					case "classFeature":
						out.push({
							n: `${primary.parentName} ${it.level}; ${it.name}`,
							s: it.source,
							u: it.hash
						});
						break;
					case "subclassFeature":
					case "subclassFeaturePart":
						out.push({
							n: `${it.subclassShortName} ${primary.parentName} ${it.level}; ${it.name}`,
							s: indexer.getMetaId("s", it.source),
							u: it.hash
						});
						break;
					default: throw new Error(`Unhandled type "${it._type}"`);
				}
			});
			return out;
		}
	}
];
/**
 * category: a category from utils.js (see `Parser.pageCategoryToFull`)
 * file: source JSON file
 * primary: (OPTIONAL; default "name") JSON property to index, per item.
 * 		Can be a chain of properties e.g. `outer.inner.name`
 * source: (OPTIONAL; default "source") JSON property containing the item's source, per item.
 * 		Can be a chan of properties, e.g. `outer.inner.source`
 * page: (OPTIONAL; default "page") JSON property containing the item's page in the relevant book, per item.
 * 		Can be a chain of properties, e.g. `outer.inner.page`
 * listProp: the JSON always has a root property containing the list of items. Provide the name of this property here.
 * 		Can be a chain of properties e.g. `outer.inner.name`
 * baseUrl: the base URL (which page) to use when forming index URLs
 * deepIndex: (OPTIONAL) a function which returns a list of strings to be indexed, in addition to the primary index.
 * 		Once indexed, these will share the item's source, URL (and page).
 * hashBuilder: (OPTIONAL) a function which takes a data item and returns a hash for it.
 * 		Generally not needed, as UrlUtils has a defined list of hash-building functions for each page.
 * test_extraIndex: (OPTIONAL) a function which can optionally be called per item if `doExtraIndex` is true.
 * 		Used to generate a complete list of links for testing; should not be used for production index.
 * 		Should return full index objects.
 * hover: (OPTIONAL) a boolean indicating if the generated link should have `Renderer` hover functionality.
 * filter: (OPTIONAL) a function which takes a data item and returns true if it should not be indexed, false otherwise
 * include: (OPTIONAL) a function which takes a data item and returns true if it should be indexed, false otherwise
 * postLoad: (OPTIONAL) a function which takes the data set, does some post-processing,
 * 		and runs a callback when done (synchronously)
 *
 */
Omnidexer.TO_INDEX = [
	{
		category: Parser.CAT_ID_BACKGROUND,
		file: "backgrounds.json",
		listProp: "background",
		baseUrl: "backgrounds.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_ITEM,
		file: "items-base.json",
		listProp: "baseitem",
		baseUrl: "items.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_CONDITION,
		file: "conditionsdiseases.json",
		listProp: "condition",
		baseUrl: "conditionsdiseases.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_FEAT,
		file: "feats.json",
		listProp: "feat",
		baseUrl: "feats.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_ELDRITCH_INVOCATION,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "EI")
	},
	{
		category: Parser.CAT_ID_METAMAGIC,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "MM")
	},
	{
		category: Parser.CAT_ID_MANEUVER_BATTLEMASTER,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "MV:B")
	},
	{
		category: Parser.CAT_ID_MANEUVER_CAVALIER,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "MV:C2-UA")
	},
	{
		category: Parser.CAT_ID_ARCANE_SHOT,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => {
			return Omnidexer.arrIncludesOrEquals(it.featureType, "AS:V1-UA") || Omnidexer.arrIncludesOrEquals(it.featureType, "AS:V2-UA") || Omnidexer.arrIncludesOrEquals(it.featureType, "AS")
		}
	},
	{
		category: Parser.CAT_ID_OPTIONAL_FEATURE_OTHER,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "OTH")
	},
	{
		category: Parser.CAT_ID_FIGHTING_STYLE,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "FS:F") || Omnidexer.arrIncludesOrEquals(it.featureType, "FS:B") || Omnidexer.arrIncludesOrEquals(it.featureType, "FS:R") || Omnidexer.arrIncludesOrEquals(it.featureType, "FS:P")
	},
	{
		category: Parser.CAT_ID_PACT_BOON,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "PB")
	},
	{
		category: Parser.CAT_ID_ELEMENTAL_DISCIPLINE,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "ED")
	},
	{
		category: Parser.CAT_ID_ARTIFICER_INFUSION,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "AI")
	},
	{
		category: Parser.CAT_ID_SHIP_UPGRADE,
		file: "optionalfeatures.json",
		listProp: "optionalfeature",
		baseUrl: "optionalfeatures.html",
		hover: true,
		include: (it) => Omnidexer.arrIncludesOrEquals(it.featureType, "SHP:H") || Omnidexer.arrIncludesOrEquals(it.featureType, "SHP:M") || Omnidexer.arrIncludesOrEquals(it.featureType, "SHP:W") || Omnidexer.arrIncludesOrEquals(it.featureType, "SHP:F")
	},
	{
		category: Parser.CAT_ID_ITEM,
		file: "items.json",
		listProp: "item",
		baseUrl: "items.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_ITEM,
		file: "items.json",
		listProp: "itemGroup",
		baseUrl: "items.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_PSIONIC,
		file: "psionics.json",
		listProp: "psionic",
		baseUrl: "psionics.html",
		deepIndex: (indexer, primary, it) => {
			if (!it.modes) return [];
			return it.modes.map(m => ({d: 1, n: `${primary.parentName}; ${m.name}`}))
		},
		hover: true
	},
	{
		category: Parser.CAT_ID_RACE,
		file: "races.json",
		listProp: "race",
		baseUrl: "races.html",
		onlyDeep: true,
		deepIndex: (indexer, primary, it) => {
			const subs = Renderer.race._mergeSubrace(it);
			return subs.map(r => ({
				n: r.name,
				s: indexer.getMetaId("s", r.source),
				u: UrlUtil.URL_TO_HASH_BUILDER["races.html"](r)
			}));
		},
		hover: true
	},
	{
		category: Parser.CAT_ID_OTHER_REWARD,
		file: "rewards.json",
		listProp: "reward",
		baseUrl: "rewards.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_VARIANT_OPTIONAL_RULE,
		file: "variantrules.json",
		listProp: "variantrule",
		baseUrl: "variantrules.html",
		deepIndex: (indexer, primary, it) => {
			const names = [];
			it.entries.forEach(e => {
				Renderer.getNames(names, e, 1);
			});
			const allNames = Renderer.getNumberedNames(it);
			const nameKeys = Object.keys(allNames).filter(it => names.includes(it));

			return nameKeys.map(n => {
				const ix = allNames[n];
				return {
					u: `${UrlUtil.encodeForHash([it.name, it.source])}${HASH_PART_SEP}${ix}`,
					d: 1,
					n: `${primary.parentName}; ${n}`
				};
			});
		}
	},
	{
		category: Parser.CAT_ID_ADVENTURE,
		file: "adventures.json",
		source: "id",
		listProp: "adventure",
		baseUrl: "adventure.html"
	},
	{
		category: Parser.CAT_ID_ITEM,
		file: "magicvariants.json",
		source: "inherits.source",
		page: "inherits.page",
		listProp: "variant",
		baseUrl: "items.html",
		hashBuilder: (it) => {
			return UrlUtil.encodeForHash([it.name, it.inherits.source]);
		},
		deepIndex: (indexer, primary, it) => {
			const revName = Renderer.item.modifierPostToPre(it);
			if (revName) {
				return [{
					d: 1,
					u: UrlUtil.encodeForHash([revName.name, it.inherits.source])
				}];
			}
			return [];
		},
		additionalIndexes: {
			item: async (indexer, rawVariants) => {
				const specVars = await (async () => {
					if (typeof module !== "undefined") return Renderer.item.getAllIndexableItems(rawVariants, require(`../data/items-base.json`));
					else {
						const baseItemJson = await DataUtil.loadJSON(`data/items-base.json`);
						const rawBaseItems = {...baseItemJson, baseitem: [...baseItemJson.baseitem]};
						const brew = await BrewUtil.pAddBrewData();
						if (brew.baseitem) rawBaseItems.baseitem.push(...brew.baseitem);
						return Renderer.item.getAllIndexableItems(rawVariants, rawBaseItems);
					}
				})();
				return specVars.map(sv => {
					const out = {
						c: Parser.CAT_ID_ITEM,
						u: UrlUtil.encodeForHash([sv.name, sv.source]),
						s: indexer.getMetaId("s", sv.source),
						n: sv.name,
						h: 1,
						p: sv.page
					};
					if (sv.genericVariant) {
						// use z-prefixed as "other data" properties
						out.zg = {
							n: indexer.getMetaId("n", sv.genericVariant.name),
							s: indexer.getMetaId("s", sv.genericVariant.source)
						};
					}
					return out;
				});
			}
		},
		hover: true
	},
	{
		category: Parser.CAT_ID_DEITY,
		file: "deities.json",
		postLoad: DataUtil.deity.doPostLoad,
		listProp: "deity",
		baseUrl: "deities.html",
		hover: true,
		filter: (it) => it.reprinted
	},
	{
		category: Parser.CAT_ID_OBJECT,
		file: "objects.json",
		listProp: "object",
		baseUrl: "objects.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_TRAP,
		file: "trapshazards.json",
		listProp: "trap",
		baseUrl: "trapshazards.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_HAZARD,
		file: "trapshazards.json",
		listProp: "hazard",
		baseUrl: "trapshazards.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_QUICKREF,
		file: "generated/bookref-quick.json",
		listProp: "data.bookref-quick",
		baseUrl: "quickreference.html",
		hashBuilder: (it, i) => {
			return `bookref-quick,${i}`;
		},
		onlyDeep: true,
		deepIndex: (indexer, primary, it) => {
			function getDoc (name, alias) {
				return {
					n: alias || name,
					u: `bookref-quick${HASH_PART_SEP}${primary.i}${HASH_PART_SEP}${UrlUtil.encodeForHash(name.toLowerCase())}`,
					s: undefined
				};
			}

			const names = it.entries.map(e => ({
				name: e.name,
				alias: e.alias
			}));
			return names.map(n => {
				const base = getDoc(n.name);
				return n.alias ? [base, ...n.alias.map(a => getDoc(n.name, a))] : [base];
			}).reduce((a, b) => a.concat(b), []);
		}
	},
	{
		category: Parser.CAT_ID_CULT,
		file: "cultsboons.json",
		listProp: "cult",
		baseUrl: "cultsboons.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_BOON,
		file: "cultsboons.json",
		listProp: "boon",
		baseUrl: "cultsboons.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_DISEASE,
		file: "conditionsdiseases.json",
		listProp: "disease",
		baseUrl: "conditionsdiseases.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_TABLE,
		file: "generated/gendata-tables.json",
		listProp: "table",
		baseUrl: "tables.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_TABLE_GROUP,
		file: "generated/gendata-tables.json",
		listProp: "tableGroup",
		baseUrl: "tables.html",
		hover: true
	},
	{
		category: Parser.CAT_ID_SHIP,
		file: "ships.json",
		listProp: "ship",
		baseUrl: "ships.html",
		hover: true
	}
];

if (typeof module !== "undefined") {
	module.exports.Omnidexer = Omnidexer;
}
