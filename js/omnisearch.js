let catIndex;
let searchIndex;

window.addEventListener("load", init);

function init () {
	const $nav = $(`#navbar`);
	$nav.append(`
		<div class="input-group" style="padding: 3px 0;">
			<input id="omnisearch-input" class="form-control" placeholder="Search">
			<div class="input-group-btn">
				<button class="btn btn-default" id="omnisearch-submit" ><span class="glyphicon glyphicon-search"></span></button>
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

	const MAX_RESULTS = 15;
	$searchSubmit.on("click", (e) => {
		e.stopPropagation();
		const srch = $searchIn.val();

		let page = 0;

		const results = searchIndex.search(srch, {
			fields: {
				s: {boost: 100},
				src: {boost: 10},
				c: {boost: 1}
			},
			bool: "AND",
			expand: true
		});

		if (results.length) {
			renderLinks();
		} else {
			$searchOut.html("");
			$searchOutWrapper.hide();
		}

		function renderLinks () {
			$searchOut.html("");
			const base = page * MAX_RESULTS;
			for (let i = base; i < Math.max(Math.min(results.length, MAX_RESULTS+base), base); ++i) {
				const r = results[i].doc;
				$searchOut.append(`
				<p>
					<a href="${r.url}" target="_blank">${r.c}: ${r.s}</a>
					<i title="${Parser.sourceJsonToFull(r.src)}">${Parser.sourceJsonToAbv(r.src)}${r.pg ? ` p${r.pg}` : ""}</i>
				</p>`);
			}
			$searchOutWrapper.css("display", "flex");

			// add pagination if there are many results
			if (results.length > MAX_RESULTS) {
				const $pgControls = $(`<div class="omnisearch-pagination-wrapper">`);
				if (page > 0) {
					const $prv = $(`<span class="pg-left pg-control"><span class="glyphicon glyphicon-chevron-left"></span></span>`).on("click", () => {
						page--;
						renderLinks();
					});
					$pgControls.append($prv);
				} else ($pgControls.append(`<span class="pg-left">`));
				$pgControls.append(`<span class="pg-count">Page ${page+1}/${Math.ceil(results.length/MAX_RESULTS)} (${results.length} results)</span>`);
				if (results.length - (page * MAX_RESULTS) > MAX_RESULTS) {
					const $nxt = $(`<span class="pg-right pg-control"><span class="glyphicon glyphicon-chevron-right"></span></span>`).on("click", () => {
						page++;
						renderLinks();
					});
					$pgControls.append($nxt)
				} else ($pgControls.append(`<span class="pg-right pg-control">`));
				$searchOut.append($pgControls);
			}
		}
	});
}

function onSearchLoad (data) {
	searchIndex = elasticlunr(function () {
		this.addField("s");
		this.addField("c");
		this.addField("src");
		this.setRef("id")
	});
	data.forEach(d => {
		d.c = Parser.pageCategoryToFull(d.c);
		searchIndex.addDoc(d);
	});
}