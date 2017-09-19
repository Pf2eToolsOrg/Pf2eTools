window.onhashchange = function hashchange(e) {
	var $el = $("ul.list li[data-link='"+window.location.hash.split("#")[1].toLowerCase()+"']:eq(0)");
	usespell($el.attr("id"));
	document.title = decodeURIComponent($el.attr("data-name")).replace("%27","'") + " - 5etools Spells";
};

