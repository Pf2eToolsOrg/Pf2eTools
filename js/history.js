window.onhashchange = function hashchange(e) {
	let $el = $("ul.list li[data-link='"+window.location.hash.split("#")[1].toLowerCase()+"']:eq(0)");
	loadhash($el.attr("id"));
	document.title = decodeURIComponent($el.attr("data-name")).replace("%27","'") + " - 5etools Spells";
}

