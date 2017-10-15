window.onhashchange = function hashchange(e) {
	const [link, sub] = window.location.hash.slice(1).split(',');

	if (!e || !sub) {
		let $el = $(`#listcontainer a[href='#${link.toLowerCase()}']`);
		//For some reason the above does not work for Backgrounds, so this is a TEMPORARY work-around
		if($el.attr("id") === undefined) {$el = $(`ul.list li[data-link='${link.toLowerCase()}']:eq(0)`)}
		loadhash($el.attr("id"));
		document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
	}

	if (sub) {
		loadsub(sub)
	}
}
