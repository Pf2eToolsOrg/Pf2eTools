"use strict";

const JSON_SRC_INDEX = "index.json";

function multisourceLoad(jsonDir, dataCategory, dataFn) {
	// load the index
	loadJSON(jsonDir+JSON_SRC_INDEX, function(index) { onIndexLoad(index, jsonDir, dataCategory, dataFn) });
}

let loadedSources;
function onIndexLoad(src2UrlMap, jsonDir, dataProp, addFunction) {
	// track loaded sources
	loadedSources = {};
	Object.keys(src2UrlMap).forEach(src => loadedSources[src] = {url: jsonDir+src2UrlMap[src], loaded: false});

	// collect a list of sources to load
	const sources = Object.keys(src2UrlMap);
	const defaultSel = sources.filter(s => defaultSourceSelFn(s));
	const userSel = FilterBox.getSelectedSources();

	const allSources = [];

	// add any sources from the user's saved filters, provided they have URLs and haven't already been added
	if (userSel) {
		userSel
			.filter(src => src2UrlMap[src])
			.filter(src => $.inArray(src, allSources) === -1)
			.forEach(src => allSources.push(src));
	}
	// if there's no saved filters, load the defaults
	if (allSources.length === 0) {
		// remove any sources that don't have URLs
		defaultSel.filter(src => src2UrlMap[src]).forEach(src => allSources.push(src));
	}

	// add source from the current hash, if there is one
	if (window.location.hash.length) {
		const [link, ...sub] = _getHashParts();
		const src = link.split(HASH_LIST_SEP)[1];
		const hashSrcs = {};
		sources.forEach(src => hashSrcs[encodeForHash(src)] = src);
		const mapped = hashSrcs[src];
		if (mapped && $.inArray(mapped, allSources) === -1) {
			allSources.push(mapped);
		}
	}

	// make a list of src : url objects
	const toLoads = allSources.map(src => ({src: src, url: jsonDir+src2UrlMap[src]}));

	pageInit();

	if (toLoads.length > 0) {
		chainLoadJSON(
			toLoads,
			0,
			[],
			function(toLoad) {
				loadedSources[toLoad.src].loaded = true;
			},
			function(dataStack) {
				let toAdd = [];
				dataStack.forEach(d => toAdd = toAdd.concat(d[dataProp]));
				addFunction(toAdd);
			}
		);
	}
}