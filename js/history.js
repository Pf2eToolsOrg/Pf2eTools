window.onhashchange = function hashchange(e) {
	const [link, sub] = window.location.hash.slice(1).split(',');

	if (!e || !sub) {
		const $el = $(`ul.list li[data-link='${link}']:eq(0)`);
		loadhash($el.attr("id"));
		document.title = decodeURIComponent($el.attr("data-link")).replace("%27","'") + " - 5etools";
	}

	if (sub)
		loadsub(sub)
}
