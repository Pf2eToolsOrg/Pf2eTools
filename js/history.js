window.onhashchange = function hashchange(e) {
	const [link, sub] = window.location.hash.slice(1).split(',');

	if (!e || !sub) {
		const $el = $(`#listcontainer a[href='#${link.toLowerCase()}']`);
		loadhash($el.attr("id"));
		document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
	}

	if (sub) {
		loadsub(sub)
	}
}
