window.onhashchange = function hashchange(e) {
	const [link, sub] = window.location.hash.slice(1).split(',');

	if (!e || !sub) {
		const $el = $(`ul.list li[data-link='${link.toLowerCase()}']:eq(0)`);
		loadhash($el.attr("id"));
		console.log($el[0]);
		document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
	}

	if (sub)
		loadsub(sub)
}
