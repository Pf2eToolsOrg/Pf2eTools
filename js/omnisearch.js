let searchIndex;

window.addEventListener("load", init);

function init () {
	const $nav = $(`#navbar`);
	$nav.append(`
		<div class="input-group" style="padding: 3px 0;">
			<input id="omnisearch-input" class="form-control" placeholder="Search">
			<div class="input-group-btn">
				<button class="btn btn-default" id="omnisearch-submit" >&#x1F50E;</button>
			</div>
		</div>
	`);
	$nav.after(`<div class="omnisearch-output-wrapper"><div id="omnisearch-output" class="omnisearch-output"></div></div>`);

	loadJSON("search/index.json", onSearchLoad);

	const $searchOutWrapper = $(`.omnisearch-output-wrapper`);
	const $searchOut = $(`#omnisearch-output`);
	const $searchIn = $(`#omnisearch-input`);
	const $searchSubmit = $(`#omnisearch-submit`);

	$(`body`).on("click", () => {
		$searchOutWrapper.hide();
	});

	$searchOut.on("click", (e) => {
		e.stopPropagation();
	});

	$searchIn.on("keypress", (e) => {
		if (e.which === 13) {
			$searchSubmit.click();
		}
	});

	// auto-search after 100ms
	const TYPE_TIMEOUT_MS = 100;
	let typeTimer;
	$searchIn.on("keyup", () => {
		clearTimeout(typeTimer);
		typeTimer = setTimeout(() => {$searchSubmit.click()}, TYPE_TIMEOUT_MS);
	});
	$searchIn.on("keydown", () => {
		clearTimeout(typeTimer);
	});

	const MAX_RESULTS = 25;
	$searchSubmit.on("click", (e) => {
		e.stopPropagation();
		const srch = $searchIn.val();

		const results = searchIndex.search(srch, {
			fields: {
				s: {boost: 10},
				src: {boost: 1}
			},
			bool: "OR",
			expand: true
		});

		$searchOut.html("");
		if (results.length) {
			for (let i = 0; i < Math.max(Math.min(results.length, MAX_RESULTS), 0); ++i) {
				const r = results[i].doc;
				$searchOut.append(`
				<p>
					<a href="${r.url}" target="_blank">${Parser.pageCategoryToFull(r.c)}: ${r.s}</a>
					<i title="${Parser.sourceJsonToFull(r.src)}">${Parser.sourceJsonToAbv(r.src)}${r.pg ? ` p${r.pg}` : ""}</i>
				</p>`);
			}
			if (results.length > MAX_RESULTS) $searchOut.append(`<p><i>${results.length - MAX_RESULTS} more results not shown. Try narrowing your search.</i></p>`);
			$searchOutWrapper.css("display", "flex");
		} else {
			$searchOutWrapper.hide();
		}
	});
}

function onSearchLoad (data) {
	searchIndex = elasticlunr(function () {
		this.addField("s");
		this.addField("src");
		this.setRef("id")
	});
	data.forEach(d => searchIndex.addDoc(d));
}