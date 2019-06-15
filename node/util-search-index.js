const ut = require('../js/utils.js');
const er = require('../js/render.js');
const od = require('../js/omnidexer.js');

UtilSearchIndex = {};

UtilSearchIndex.pGetIndex = async function (doLogging = true, noFilter = false) {
	return UtilSearchIndex._pGetIndex({}, doLogging, noFilter);
};

UtilSearchIndex.pGetIndexAlternate = async function (forProp, doLogging = true, noFilter = false) {
	const opts = {alternate: forProp};
	return UtilSearchIndex._pGetIndex(opts, doLogging, noFilter);
};

UtilSearchIndex._pGetIndex = async function (options, doLogging = true, noFilter = false) {
	const indexer = new od.Omnidexer();

	od.Omnidexer.TO_INDEX__FROM_INDEX_JSON
		.filter(it => options.alternate ? it.alternateIndexes && it.alternateIndexes[options.alternate] : true)
		.forEach(ti => {
			const index = require(`../data/${ti.dir}/index.json`);
			Object.values(index).forEach(j => {
				const absF = `../data/${ti.dir}/${j}`;
				const contents = require(absF);
				if (doLogging) console.log(`indexing ${absF}`);
				const addOptions = {isNoFilter: noFilter};
				if (options.alternate) addOptions.alt = ti.alternateIndexes[options.alternate];
				indexer.addToIndex(ti, contents, addOptions);
			})
		});

	await Promise.all(
		od.Omnidexer.TO_INDEX
			.filter(it => options.alternate ? it.alternateIndexes && it.alternateIndexes[options.alternate] : true)
			.map(async ti => {
				const f = `../data/${ti.file}`;
				const j = require(f);

				async function pAddData (j) {
					if (doLogging) console.log(`indexing ${f}`);
					const addOptions = {isNoFilter: noFilter};
					if (options.alternate) addOptions.alt = ti.alternateIndexes[options.alternate];
					indexer.addToIndex(ti, j, addOptions);
				}

				if (ti.postLoad) {
					ti.postLoad(j);
					await pAddData(j)
				} else await pAddData(j);
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
