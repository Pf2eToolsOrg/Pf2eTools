const ut = require("../js/utils.js");
const er = require("../js/render.js");
const od = require("../js/omnidexer.js");

UtilSearchIndex = {
	CORE_SOURCES: new Set([SRC_PHB, SRC_MM, SRC_DMG, SRC_VGM, SRC_MTF, SRC_XGE, SRC_SCAG]),

	/**
	 * Prefer "core" sources, then official sources, then others.
	 */
	sortSources: (a, b) => {
		const aCore = Number(UtilSearchIndex.CORE_SOURCES.has(a));
		const bCore = Number(UtilSearchIndex.CORE_SOURCES.has(b));
		if (aCore !== bCore) return bCore - aCore;
		const aStandard = Number(!SourceUtil.isNonstandardSource(a));
		const bStandard = Number(!SourceUtil.isNonstandardSource(b));
		return aStandard !== bStandard ? bStandard - aStandard : SortUtil.ascSortLower(a || "", b || "");
	}
};

UtilSearchIndex.pGetIndex = async function (doLogging = true, noFilter = false) {
	return UtilSearchIndex._pGetIndex({}, doLogging, noFilter);
};

UtilSearchIndex.pGetIndexAlternate = async function (forProp, doLogging = true, noFilter = false) {
	const opts = {alternate: forProp};
	return UtilSearchIndex._pGetIndex(opts, doLogging, noFilter);
};

UtilSearchIndex._pGetIndex = async function (opts, doLogging = true, noFilter = false) {
	const indexer = new od.Omnidexer();

	od.Omnidexer.TO_INDEX__FROM_INDEX_JSON
		.filter(it => opts.alternate ? it.alternateIndexes && it.alternateIndexes[opts.alternate] : true)
		.forEach(toIndex => {
			const index = require(`../data/${toIndex.dir}/index.json`);
			Object.entries(index)
				.sort(([kA], [kB]) => UtilSearchIndex.sortSources(kA, kB))
				.forEach(([_, filename]) => {
					const absF = `../data/${toIndex.dir}/${filename}`;
					const contents = require(absF);
					if (doLogging) console.log(`indexing ${absF}`);
					const addOptions = {isNoFilter: noFilter};
					if (opts.alternate) addOptions.alt = toIndex.alternateIndexes[opts.alternate];
					indexer.addToIndex(toIndex, contents, addOptions);
				})
		});

	await Promise.all(
		od.Omnidexer.TO_INDEX
			.filter(toIndex => opts.alternate ? toIndex.alternateIndexes && toIndex.alternateIndexes[opts.alternate] : true)
			.map(async toIndex => {
				const filename = `../data/${toIndex.file}`;
				const data = require(filename);

				async function pAddData (data) {
					if (doLogging) console.log(`indexing ${filename}`);
					Object.values(data)
						.filter(it => it instanceof Array)
						.forEach(it => it.sort((a, b) => UtilSearchIndex.sortSources(a.source || MiscUtil.get(a, "inherits", "source"), b.source || MiscUtil.get(b, "inherits", "source")) || SortUtil.ascSortLower(a.name || MiscUtil.get(a, "inherits", "name") || "", b.name || MiscUtil.get(b, "inherits", "name") || "")));
					const addOptions = {isNoFilter: noFilter};
					if (opts.alternate) addOptions.alt = toIndex.alternateIndexes[opts.alternate];
					indexer.addToIndex(toIndex, data, addOptions);
				}

				if (toIndex.postLoad) {
					toIndex.postLoad(data);
					await pAddData(data)
				} else await pAddData(data);
			})
	);

	return indexer.getIndex();
};

// this should be generalised if further specific indexes are required
UtilSearchIndex.pGetIndexAdditionalItem = async function (baseIndex = 0, doLogging = true) {
	const indexer = new od.Omnidexer(baseIndex);

	await Promise.all(od.Omnidexer.TO_INDEX.filter(it => it.category === Parser.CAT_ID_ITEM).map(async ti => {
		const f = `../data/${ti.file}`;
		const j = require(f);

		async function pAddData (j) {
			if (ti.additionalIndexes && ti.additionalIndexes.item) {
				if (doLogging) console.log(`indexing ${f}`);
				const extra = await ti.additionalIndexes.item(indexer, j);
				extra.forEach(add => indexer.pushToIndex(add));
			}
		}

		if (ti.postLoad) {
			ti.postLoad(j);
			await pAddData(j)
		} else await pAddData(j);
	}));

	return indexer.getIndex();
};

module.exports.UtilSearchIndex = UtilSearchIndex;
