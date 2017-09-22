window.onhashchange = function hashchange(e) {
	let $el = $("ul.list li[data-link='"+window.location.hash.split("#")[1]+"']:eq(0)");
	loadhash($el.attr("id"));
	document.title = decodeURIComponent($el.attr("data-link")).replace("%27","'") + " - 5etools";
}

