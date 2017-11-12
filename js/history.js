const HASH_PART_SEP = ",";
const HASH_LIST_SEP = "_";
const HASH_START = "#";

function hashchange(e) {
	const [link, ...sub] = _getHashParts();

	if (!e || sub.length === 0) {
		const $el = _getListElem(link);
		const toLoad = $el.attr("id");
		if (toLoad === undefined) _freshLoad();
		else {
			loadhash($el.attr("id"));
			document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
		}
	}

	if (typeof loadsub === "function" && sub.length > 0)
		loadsub(sub)
}

function initHistory() {
	window.onhashchange = hashchange;
	if (window.location.hash.length) {
		hashchange();
	} else {
		_freshLoad();
	}
}

function getSelectedListElement() {
	const [link, ...sub] = _getHashParts();
	return _getListElem(link);
}

function _getHashParts() {
	return window.location.hash.slice(1).split(HASH_PART_SEP);
}

function _getListElem(link) {
	return $(`#listcontainer a[href='#${link.toLowerCase()}']`);
}

function _freshLoad() {
	location.replace($("#listcontainer .list a").attr('href'));
}