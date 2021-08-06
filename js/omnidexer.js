"use strict";

if (typeof require !== "undefined") {
	require("../js/utils.js");
	require("../js/render.js");
	require("../js/render-dice.js");
}

class Omnidexer {
	constructor (id = 0) {
		/**
		 * Produces index of the form:
		 * {
		 *   n: "Display Name",
		 *   b: "Base Name" // Optional; name is used if not specified
		 *   s: "PHB", // source
		 *   u: "spell name_phb, // hash
		 *   uh: "spell name_phb, // Optional; hash for href if the link should be different from the hover lookup hash.
		 *   p: 110, // page
		 *   h: 1 // if isHover enabled, otherwise undefined
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
			m: this._metaMap,
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
	async pAddToIndex (arbiter, json, options) {
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
				p: Omnidexer.getProperty(it, arbiter.page || "page"),
			};
			if (arbiter.isHover) toAdd.h = 1;
			if (options.alt) {
				if (options.alt.additionalProperties) Object.entries(options.alt.additionalProperties).forEach(([k, getV]) => toAdd[k] = getV(it));
			}
			Object.assign(toAdd, toMerge);
			return toAdd;
		};

		const pHandleItem = async (it, i, name) => {
			if (it.noDisplay) return;

			const toAdd = getToAdd(it, {n: name}, i);

			if ((options.isNoFilter || (!arbiter.include && !(arbiter.filter && arbiter.filter(it))) || (!arbiter.filter && (!arbiter.include || arbiter.include(it)))) && !arbiter.isOnlyDeep) index.push(toAdd);

			const primary = {it: it, ix: i, parentName: name};
			const deepItems = await arbiter.pGetDeepIndex(this, primary, it);
			deepItems.forEach(item => {
				const toAdd = getToAdd(it, item);
				if (!arbiter.filter || !arbiter.filter(it)) index.push(toAdd);
			});
		};

		const dataArr = Omnidexer.getProperty(json, arbiter.listProp);
		if (dataArr) {
			for (let i = 0; i < dataArr.length; ++i) {
				const it = dataArr[i];

				const name = Omnidexer.getProperty(it, arbiter.primary || "name");
				await pHandleItem(it, i, name);

				if (it.alias) it.alias.forEach(a => pHandleItem(it, i, a));
			}
		}

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

class IndexableDirectory {
	/**
	 * @param opts Options object.
	 * @param [opts.category]
	 * @param [opts.dir]
	 * @param [opts.indexFile]
	 * @param [opts.primary]
	 * @param [opts.source]
	 * @param [opts.listProp]
	 * @param [opts.brewProp]
	 * @param [opts.baseUrl]
	 * @param [opts.isHover]
	 * @param [opts.alternateIndexes]
	 * @param [opts.isOnlyDeep]
	 * @param [opts.pFnPreProcBrew] An un-bound function
	 * @param [opts.hashBuilder]
	 */
	constructor (opts) {
		this.category = opts.category;
		this.dir = opts.dir;
		this.indexFile = opts.indexFile;
		this.primary = opts.primary;
		this.source = opts.source;
		this.listProp = opts.listProp;
		this.brewProp = opts.brewProp;
		this.baseUrl = opts.baseUrl;
		this.isHover = opts.isHover;
		this.alternateIndexes = opts.alternateIndexes;
		this.isOnlyDeep = opts.isOnlyDeep;
		this.pFnPreProcBrew = opts.pFnPreProcBrew;
		this.hashBuilder = opts.hashBuilder;
	}

	pGetDeepIndex () { return []; }
}

class IndexableDirectoryAncestries extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_ANCESTRY,
			dir: "ancestries",
			primary: "name",
			source: "source",
			listProp: "ancestry",
			baseUrl: "ancestries.html",
			isHover: true,
		});
	}
}

class IndexableDirectoryHeritages extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_HERITAGE,
			dir: "ancestries",
			primary: "name",
			source: "source",
			listProp: "ancestry",
			baseUrl: "ancestries.html",
			isHover: false,
			isOnlyDeep: true,
		});
	}

	pGetDeepIndex (indexer, primary, it) {
		if (!it.heritage) return [];
		return it.heritage.map(h => ({
			b: h.name,
			n: `${h.name} (${primary.parentName})`,
			s: indexer.getMetaId("s", h.source),
			u: `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ANCESTRIES](it)}${HASH_PART_SEP}${UrlUtil.getAncestriesPageStatePart({heritage: h})}`,
			p: h.page,
		}));
	}
}

class IndexableDirectoryVeHeritages extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_HERITAGE,
			dir: "ancestries",
			primary: "name",
			source: "source",
			listProp: "versatileHeritage",
			baseUrl: "ancestries.html",
			isHover: false,
			hashBuilder: (it) => `${HASH_BLANK}${HASH_PART_SEP}${UrlUtil.getAncestriesPageStatePart({heritage: it})}`,
		});
	}
}

class IndexableDirectoryBackgrounds extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_BACKGROUND,
			dir: "backgrounds",
			primary: "name",
			source: "source",
			listProp: "background",
			baseUrl: "backgrounds.html",
			isHover: true,
		});
	}
}

class IndexableDirectoryBestiary extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_CREATURE,
			dir: "bestiary",
			primary: "name",
			source: "source",
			listProp: "creature",
			baseUrl: "bestiary.html",
			isHover: true,
		});
	}
}

class IndexableDirectoryFeats extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_FEAT,
			dir: "feats",
			primary: "name",
			source: "source",
			listProp: "feat",
			baseUrl: "feats.html",
			isHover: true,
		});
	}
}

class IndexableDirectoryItems extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_ITEM,
			dir: "items",
			primary: "name",
			source: "source",
			listProp: "item",
			baseUrl: "items.html",
			isHover: true,
		});
	}
}

class IndexableDirectorySpells extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_SPELL,
			dir: "spells",
			primary: "name",
			source: "source",
			listProp: "spell",
			baseUrl: "spells.html",
			isHover: true,
			alternateIndexes: {
				spell: {
					additionalProperties: {
						lvl: spell => spell.level,
					},
				},
			},
		});
	}
}

class IndexableDirectoryClass extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_CLASS,
			dir: "class",
			primary: "name",
			source: "source",
			listProp: "class",
			baseUrl: "classes.html",
			isHover: true,
		});
	}
}

class IndexableDirectorySubclass extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_SUBCLASS,
			dir: "class",
			primary: "name",
			source: "source",
			listProp: "class",
			brewProp: "subclass",
			baseUrl: "classes.html",
			isHover: true,
			isOnlyDeep: true,
			pFnPreProcBrew: IndexableDirectorySubclass._pPreProcessSubclassBrew,
		});
	}

	pGetDeepIndex (indexer, primary, it) {
		if (!it.subclasses) return [];
		return it.subclasses.map(sc => ({
			b: sc.name,
			n: `${sc.name} (${primary.parentName})`,
			s: indexer.getMetaId("s", sc.source),
			u: `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](it)}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: sc})}`,
			p: sc.page,
		}));
	}

	static async _pPreProcessSubclassBrew (brew) {
		const classData = await DataUtil.class.loadJSON();

		const subclasses = MiscUtil.copy(brew.subclass || []);
		const sourceToClass = {};
		subclasses.filter(sc => sc.className).forEach(sc => {
			sc.classSource = sc.classSource || SRC_CRB;
			((sourceToClass[sc.classSource] = sourceToClass[sc.classSource] || {})[sc.className] = sourceToClass[sc.classSource][sc.className] || []).push(sc);
		});

		const out = [];
		Object.entries(sourceToClass).forEach(([source, classToScList]) => {
			Object.entries(classToScList).forEach(([className, scList]) => {
				let cls = classData.class.find(it => it.name.toLowerCase() === className.toLowerCase() && (it.source || SRC_CRB).toLowerCase() === source.toLowerCase());
				if (!cls && brew.class && brew.class.length) cls = brew.class.find(it => it.name.toLowerCase() === className.toLowerCase() && (it.source || SRC_PHB).toLowerCase() === source.toLowerCase());

				if (cls) {
					const cpy = MiscUtil.copy(cls);
					cpy.subclasses = scList;
					out.push(cpy);
				} else {
					// Create a fake class, which will at least allow the subclass to be indexed (although not its features)
					out.push({
						name: className,
						source,
						subclasses: scList,
					});
				}
			});
		});
		return {[this.listProp]: out};
	}
}

class IndexableDirectoryClassFeature extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_CLASS_FEATURE,
			dir: "class",
			primary: "name",
			source: "source",
			listProp: "classFeature",
			baseUrl: "classes.html",
			isOnlyDeep: true,
			isHover: true,
		});
	}

	async pGetDeepIndex (indexer, primary, it) {
		// TODO(Future) this could pull in the class data to get an accurate feature index; default to 0 for now
		const ixFeature = 0;
		const classPageHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: it.className, source: it.classSource})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({feature: {ixLevel: it.level - 1, ixFeature}})}`;
		return [
			{
				n: `${it.className} ${it.level}; ${it.name}`,
				s: it.source,
				u: UrlUtil.URL_TO_HASH_BUILDER["classFeature"](it),
				uh: classPageHash,
				p: it.page,
			},
		];
	}
}

class IndexableDirectorySubclassFeature extends IndexableDirectory {
	constructor () {
		super({
			category: Parser.CAT_ID_SUBCLASS_FEATURE,
			dir: "class",
			primary: "name",
			source: "source",
			listProp: "subclassFeature",
			baseUrl: "classes.html",
			isOnlyDeep: true,
			isHover: true,
		});
	}

	async pGetDeepIndex (indexer, primary, it) {
		const ixFeature = 0;
		const pageStateOpts = {
			subclass: {shortName: it.subclassShortName, source: it.source},
			feature: {ixLevel: it.level - 1, ixFeature},
		};
		const classPageHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: it.className, source: it.classSource})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart(pageStateOpts)}`;
		return [
			{
				n: `${it.subclassShortName} ${it.className} ${it.level}; ${it.name}`,
				s: it.source,
				u: UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](it),
				uh: classPageHash,
				p: it.page,
			},
		];
	}
}

Omnidexer.TO_INDEX__FROM_INDEX_JSON = [
	new IndexableDirectoryAncestries(),
	new IndexableDirectoryHeritages(),
	new IndexableDirectoryVeHeritages(),
	new IndexableDirectoryBestiary(),
	new IndexableDirectoryBackgrounds(),
	new IndexableDirectoryFeats(),
	new IndexableDirectoryItems(),
	new IndexableDirectorySpells(),
	new IndexableDirectoryClass(),
	new IndexableDirectorySubclass(),
	new IndexableDirectoryClassFeature(),
	new IndexableDirectorySubclassFeature(),
];

class IndexableFile {
	/**
	 * @param opts Options object.
	 * @param opts.category a category from utils.js (see `Parser.pageCategoryToFull`)
	 * @param opts.file source JSON file
	 * @param [opts.primary] (default "name") JSON property to index, per item. Can be a chain of properties e.g. `outer.inner.name`
	 * @param [opts.source] (default "source") JSON property containing the item's source, per item. Can be a chan of properties, e.g. `outer.inner.source`
	 * @param [opts.page] (default "page") JSON property containing the item's page in the relevant book, per item. Can be a chain of properties, e.g. `outer.inner.page`
	 * @param opts.listProp the JSON always has a root property containing the list of items. Provide the name of this property here. Can be a chain of properties e.g. `outer.inner.name`
	 * @param opts.baseUrl the base URL (which page) to use when forming index URLs
	 * @param [opts.hashBuilder] a function which takes a data item and returns a hash for it. Generally not needed, as UrlUtils has a defined list of hash-building functions for each page.
	 * @param [opts.test_extraIndex] a function which can optionally be called per item if `doExtraIndex` is true. Used to generate a complete list of links for testing; should not be used for production index. Should return full index objects.
	 * @param [opts.isHover] a boolean indicating if the generated link should have `Renderer` isHover functionality.
	 * @param [opts.filter] a function which takes a data item and returns true if it should not be indexed, false otherwise
	 * @param [opts.include] a function which takes a data item and returns true if it should be indexed, false otherwise
	 * @param [opts.postLoad] a function which takes the data set, does some post-processing, and runs a callback when done (synchronously)
	 * @param opts.isOnlyDeep
	 * @param opts.additionalIndexes
	 */
	constructor (opts) {
		this.category = opts.category;
		this.file = opts.file;
		this.primary = opts.primary;
		this.source = opts.source;
		this.page = opts.page;
		this.listProp = opts.listProp;
		this.baseUrl = opts.baseUrl;
		this.hashBuilder = opts.hashBuilder;
		this.test_extraIndex = opts.test_extraIndex;
		this.isHover = opts.isHover;
		this.filter = opts.filter;
		this.include = opts.include;
		this.postLoad = opts.postLoad;
		this.isOnlyDeep = opts.isOnlyDeep;
		this.additionalIndexes = opts.additionalIndexes;
	}

	/**
	 * A function which returns an additional "deep" list of index docs.
	 */
	pGetDeepIndex () { return []; }
}

class IndexableFileBaseItems extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_ITEM,
			file: "items/baseitems.json",
			listProp: "baseitem",
			baseUrl: "items.html",
			isHover: true,
		});
	}
}

class IndexableFileArchetypes extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_ARCHETYPE,
			file: "archetypes.json",
			listProp: "archetype",
			baseUrl: "archetypes.html",
			isHover: true,
		});
	}
}

class IndexableFileConditions extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_CONDITION,
			file: "conditions.json",
			listProp: "condition",
			baseUrl: "conditions.html",
			isHover: true,
		});
	}
}

class IndexableFileDiseases extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_AFFLICTION,
			file: "afflictions.json",
			listProp: "disease",
			baseUrl: "afflictions.html",
			isHover: true,
		});
	}
}

class IndexableFileCurses extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_AFFLICTION,
			file: "afflictions.json",
			listProp: "curse",
			baseUrl: "afflictions.html",
			isHover: true,
		});
	}
}

class IndexableFileItemCurses extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_AFFLICTION,
			file: "afflictions.json",
			listProp: "itemcurse",
			baseUrl: "afflictions.html",
			isHover: true,
		});
	}
}

class IndexableFileVariantRules extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_VARIANT_RULE,
			file: "variantrules.json",
			listProp: "variantrule",
			baseUrl: "variantrules.html",
			isHover: true,
		});
	}
}

class IndexableFileAdventures extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_ADVENTURE,
			file: "adventures.json",
			source: "id",
			listProp: "adventure",
			baseUrl: "adventure.html",
		});
	}
}

class IndexableFileBooks extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_BOOK,
			file: "books.json",
			source: "id",
			listProp: "book",
			baseUrl: "book.html",
		});
	}
}

class IndexableFileQuickReference extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_QUICKREF,
			file: "generated/bookref-quick.json",
			listProp: "data.bookref-quick",
			baseUrl: "quickreference.html",
			hashBuilder: (it, ix) => `bookref-quick,${ix}`,
			isOnlyDeep: true,
			isHover: true,
		});

		this._walker = MiscUtil.getWalker();
	}

	static getChapterNameMetas (it) {
		const nameMetas = [];
		const nameCounts = {};
		const walker = MiscUtil.getWalker({isDepthFirst: true});
		walker.walk(it, {
			object: (obj) => {
				if (!obj.data || (obj.data.quickref == null && !obj.data.quickrefIndex)) return obj;

				const meta = {};
				const lowName = obj.name.toLowerCase();
				nameCounts[lowName] = nameCounts[lowName] || 0;
				nameCounts[lowName]++;
				meta.ixBook = nameCounts[lowName] - 1;
				meta.alias = obj.alias;
				meta.name = obj.name;
				meta.source = obj.source;
				meta.page = obj.page;
				meta.entry = obj;
				nameMetas.push(meta);
				return obj;
			},
		});
		return nameMetas
	}

	pGetDeepIndex (indexer, primary, it) {
		return it.entries
			.map(it => {
				return IndexableFileQuickReference.getChapterNameMetas(it).map(nameMeta => {
					return [
						IndexableFileQuickReference._getDeepDoc(indexer, primary, nameMeta),
						...(nameMeta.alias || []).map(alias => IndexableFileQuickReference._getDeepDoc(indexer, primary, nameMeta, alias)),
					]
				}).flat();
			})
			.flat();
	}

	static _getDeepDoc (indexer, primary, nameMeta, alias) {
		const hashParts = [
			"bookref-quick",
			primary.ix,
			UrlUtil.encodeForHash(nameMeta.name.toLowerCase()),
		];
		if (nameMeta.ixBook) hashParts.push(nameMeta.ixBook);
		else hashParts.push(0);

		return {
			n: alias || nameMeta.name,
			u: hashParts.join(HASH_PART_SEP),
			s: indexer.getMetaId("s", nameMeta.source),
			p: nameMeta.page,
		};
	}
}

class IndexableFileDeities extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_DEITY,
			file: "deities.json",
			listProp: "deity",
			baseUrl: "deities.html",
			isHover: true,
		});
	}
}

class IndexableFileHazards extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_HAZARD,
			file: "hazards.json",
			listProp: "hazard",
			baseUrl: "hazards.html",
			isHover: true,
		});
	}
}

class IndexableFileTables extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_TABLE,
			file: "tables.json",
			listProp: "table",
			baseUrl: "tables.html",
			isHover: true,
		});
	}
}

class IndexableFileActions extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_ACTION,
			file: "actions.json",
			listProp: "action",
			baseUrl: "actions.html",
			isHover: true,
		});
	}
}

class IndexableFileCreatureAbilities extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_ABILITY,
			file: "abilities.json",
			listProp: "ability",
			baseUrl: "abilities.html",
			isHover: true,
		});
	}
}

class IndexableFileLanguages extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_LANGUAGE,
			file: "languages.json",
			listProp: "language",
			baseUrl: "languages.html",
			isHover: true,
		});
	}

	pGetDeepIndex (indexer, primary, it) {
		return (it.dialects || []).map(d => ({
			n: d,
		}));
	}
}

class IndexableFileTraits extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_TRAIT,
			file: "traits.json",
			listProp: "trait",
			baseUrl: "traits.html",
			isHover: true,
		});
	}
}

class IndexableFileCompanions extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_COMPANION,
			file: "companionsfamiliars.json",
			listProp: "companion",
			baseUrl: "companionsfamiliars.html",
			isHover: true,
		});
	}
}

class IndexableFileFamiliars extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_FAMILIAR,
			file: "companionsfamiliars.json",
			listProp: "familiar",
			baseUrl: "companionsfamiliars.html",
			isHover: true,
		});
	}
}

class IndexableFileRituals extends IndexableFile {
	constructor () {
		super({
			category: Parser.CAT_ID_RITUAL,
			file: "rituals.json",
			listProp: "ritual",
			baseUrl: "rituals.html",
			isHover: true,
		});
	}
}

Omnidexer.TO_INDEX = [
	new IndexableFileArchetypes(),
	new IndexableFileBaseItems(),
	new IndexableFileConditions(),
	new IndexableFileDiseases(),
	new IndexableFileCurses(),
	new IndexableFileItemCurses(),

	new IndexableFileQuickReference(),
	new IndexableFileVariantRules(),
	new IndexableFileBooks(),
	new IndexableFileDeities(),
	new IndexableFileHazards(),
	new IndexableFileTables(),

	new IndexableFileActions(),
	new IndexableFileCreatureAbilities(),
	new IndexableFileLanguages(),
	new IndexableFileTraits(),
	new IndexableFileCompanions(),
	new IndexableFileFamiliars(),
	new IndexableFileAdventures(),
	new IndexableFileRituals(),
];

class IndexableSpecial {
	pGetIndex () { throw new Error(`Unimplemented!`); }
}

class IndexableSpecialPages extends IndexableSpecial {
	pGetIndex () {
		return Object.entries(UrlUtil.PG_TO_NAME)
			.map(([page, name]) => ({
				n: name,
				c: Parser.CAT_ID_PAGE,
				u: page,
			}))
	}
}

Omnidexer.TO_INDEX__SPECIAL = [
	new IndexableSpecialPages(),
];

if (typeof module !== "undefined") {
	module.exports.Omnidexer = Omnidexer;
}
