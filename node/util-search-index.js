const ut = require("../js/utils.js");
const er = require("../js/render.js");
const od = require("../js/omnidexer.js");

class UtilSearchIndex {
	/**
	 * Prefer "core" sources, then official sources, then others.
	 */
	static _sortSources (a, b) {
		const aCore = Number(UtilSearchIndex.CORE_SOURCES.has(a));
		const bCore = Number(UtilSearchIndex.CORE_SOURCES.has(b));
		if (aCore !== bCore) return bCore - aCore;
		const aStandard = Number(!SourceUtil.isNonstandardSource(a));
		const bStandard = Number(!SourceUtil.isNonstandardSource(b));
		return aStandard !== bStandard ? bStandard - aStandard : SortUtil.ascSortLower(a, b);
	}

	static async pGetIndex (doLogging = true, noFilter = false) {
		return UtilSearchIndex._getIndex({}, doLogging, noFilter);
	}

	static getIndexAlternate (forProp, doLogging = true, noFilter = false) {
		const opts = {alternate: forProp};
		return UtilSearchIndex._getIndex(opts, doLogging, noFilter);
	}

	static _getIndex (opts, doLogging = true, noFilter = false) {
		const indexer = new od.Omnidexer();

		// Index entities from directories, e.g. creatures and spells
		od.Omnidexer.TO_INDEX__FROM_INDEX_JSON
			.filter(indexMeta => opts.alternate ? indexMeta.alternateIndexes && indexMeta.alternateIndexes[opts.alternate] : true)
			.forEach(indexMeta => {
				const dataIndex = require(`../data/${indexMeta.dir}/index.json`);
				Object.entries(dataIndex)
					.sort(([kA], [kB]) => UtilSearchIndex._sortSources(kA, kB))
					.forEach(([_, filename]) => {
						const filePath = `../data/${indexMeta.dir}/${filename}`;
						const contents = require(filePath);
						if (doLogging) console.log(`indexing ${filePath}`);
						const optsNxt = {isNoFilter: noFilter};
						if (opts.alternate) optsNxt.alt = indexMeta.alternateIndexes[opts.alternate];
						indexer.addToIndex(indexMeta, contents, optsNxt);
					})
			});

		// Index entities from single files
		od.Omnidexer.TO_INDEX
			.filter(indexMeta => opts.alternate ? indexMeta.alternateIndexes && indexMeta.alternateIndexes[opts.alternate] : true)
			.map(async indexMeta => {
				const filePath = `../data/${indexMeta.file}`;
				const data = require(filePath);

				if (indexMeta.postLoad) indexMeta.postLoad(data);

				if (doLogging) console.log(`indexing ${filePath}`);
				Object.values(data)
					.filter(it => it instanceof Array)
					.forEach(it => it.sort((a, b) => UtilSearchIndex._sortSources(a.source || MiscUtil.get(a, "inherits", "source"), b.source || MiscUtil.get(b, "inherits", "source")) || SortUtil.ascSortLower(a.name || MiscUtil.get(a, "inherits", "name") || "", b.name || MiscUtil.get(b, "inherits", "name") || "")));

				const optsNxt = {isNoFilter: noFilter};
				if (opts.alternate) optsNxt.alt = indexMeta.alternateIndexes[opts.alternate];
				indexer.addToIndex(indexMeta, data, optsNxt);
			})

		return indexer.getIndex();
	}

	// this should be generalised if further specific indexes are required
	static async pGetIndexAdditionalItem (baseIndex = 0, doLogging = true) {
		const indexer = new od.Omnidexer(baseIndex);

		await Promise.all(od.Omnidexer.TO_INDEX.filter(it => it.category === Parser.CAT_ID_ITEM).map(async ti => {
			const filename = `../data/${ti.file}`;
			const data = require(filename);

			if (ti.postLoad) ti.postLoad(data);

			if (ti.additionalIndexes && ti.additionalIndexes.item) {
				if (doLogging) console.log(`indexing ${filename}`);
				const extra = await ti.additionalIndexes.item(indexer, data);
				extra.forEach(add => indexer.pushToIndex(add));
			}
		}));

		return indexer.getIndex();
	}
}
UtilSearchIndex.CORE_SOURCES = new Set([SRC_PHB, SRC_MM, SRC_DMG, SRC_VGM, SRC_MTF, SRC_XGE, SRC_SCAG]);

module.exports = {UtilSearchIndex};
