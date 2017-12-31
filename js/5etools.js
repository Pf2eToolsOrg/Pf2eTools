let searchIndex;

window.addEventListener("load", init);

function init () {
	loadJSON("search/index.json", onSearchLoad);

	const searchOut = $(`#search-output`);
	const searchIn = $(`#search-input`);
	const searchSubmit = $(`#search-submit`);

	searchIn.on("keypress", (e) => {
		if (e.which === 13) {
			searchSubmit.click();
		}
	});

	// TODO paginate?
	const MAX_RESULTS = 25;
	searchSubmit.on("click", () => {
		const srch = searchIn.val();

		const results = searchIndex.search(srch, {
			bool: "OR",
			expand: true
		});

		searchOut.html("");
		for (let i = 0; i < Math.max(Math.min(results.length, MAX_RESULTS), 0); ++i) {
			const r = results[i].doc;
			searchOut.append(`<a href="${r.url}" target="_blank">${r.s}</a>`);
			searchOut.append(`<br>`);
		}
		if (results.length > MAX_RESULTS) searchOut.append(`<i>${results.length - MAX_RESULTS} more results not shown. Try narrowing your search.</i>`);
		searchOut.show();
	});
}

function onSearchLoad (data) {
	searchIndex = elasticlunr(function () {
		this.addField("s");
		this.setRef("id")
	});
	data.forEach(d => searchIndex.addDoc(d));
}