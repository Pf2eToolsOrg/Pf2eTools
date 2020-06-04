"use strict";

const Omnisearch = {
	_PLACEHOLDER_TEXT: "Search everywhere...",
	_searchIndex: null,
	_adventureBookLookup: null, // A map of `<sourceLower>: (adventureCatId|bookCatId)`
	_pLoadSearch: null,
	_CATEGORY_COUNTS: {},
	highestId: -1,

	init: function () {
		if (IS_VTT) return;

		const $nav = $(`#navbar`);

		const $iptSearch = $(`<input class="form-control search omni__input" placeholder="${Omnisearch._PLACEHOLDER_TEXT}" title="Hotkey: F. Disclaimer: unlikely to search everywhere. Use with caution.">`).disableSpellcheck();
		const $searchSubmit = $(`<button class="btn btn-default omni__submit" tabindex="-1"><span class="glyphicon glyphicon-search"></span></button>`);

		const $searchInputWrapper = $$`
			<div class="input-group omni__wrp-input">
				${$iptSearch}
				<div class="input-group-btn">
					${$searchSubmit}
				</div>
			</div>
		`.appendTo($nav);

		const $searchOutWrapper = $(`<div class="omni__wrp-output"/>`).insertAfter($nav);
		const $searchOut = $(`<div class="omni__output"/>`).appendTo($searchOutWrapper);

		let clickFirst = false;

		const $body = $(`body`);
		$body.on("click", () => $searchOutWrapper.hide());
		$searchOut.on("click", e => {
			e.stopPropagation();
			Renderer.hover.cleanTempWindows();
		});

		$iptSearch.on("keydown", (e) => {
			e.stopPropagation();
			Renderer.hover.cleanTempWindows();
			switch (e.which) {
				case 13: // enter
					clickFirst = true;
					$searchSubmit.click();
					break;
				case 38: // up
					e.preventDefault();
					break;
				case 40: // down
					e.preventDefault();
					$searchOut.find(`a`).first().focus();
					break;
				case 27: // escape
					$iptSearch.val("");
					$iptSearch.blur();
			}
		});

		// auto-search after 100ms
		const TYPE_TIMEOUT_MS = 100;
		let typeTimer;
		$iptSearch.on("keyup", (e) => {
			clickFirst = false;
			if (e.which >= 37 && e.which <= 40) return;
			clearTimeout(typeTimer);
			typeTimer = setTimeout(() => $searchSubmit.click(), TYPE_TIMEOUT_MS);
		});
		$iptSearch.on("keydown", () => clearTimeout(typeTimer));
		$iptSearch.on("click", (e) => {
			e.stopPropagation();
			Renderer.hover.cleanTempWindows();
			if ($iptSearch.val() && $iptSearch.val().trim().length) $searchSubmit.click();
		});

		$searchSubmit.on("click", (e) => {
			e.stopPropagation();
			Renderer.hover.cleanTempWindows();
			pDoSearch();
		});

		initScrollHandler();

		const MAX_RESULTS = 15;
		async function pDoSearch () {
			await Omnisearch.pInit();

			const srch = $iptSearch.val();

			const basicTokens = srch.split(/\s+/g);

			const tokenMetas = [];
			// Filter out any special tokens
			const filteredBasicTokens = basicTokens.filter(t => {
				t = t.toLowerCase().trim();

				let category = Object.keys(Omnisearch._CATEGORY_COUNTS)
					.map(k => k.toLowerCase())
					.find(k => (`in:${k}` === t || `in:${k}s` === t));

				// Alias categories
				if (!category) {
					if (t === "in:creature" || t === "in:creatures" || t === "in:monster" || t === "in:monsters") category = "bestiary";
				}

				const mSource = /^source:(.*)$/.exec(t);
				const mPage = /^page:\s*(\d+)\s*(-\s*(\d+)\s*)?$/.exec(t);

				if (category || mSource || mPage) {
					tokenMetas.push({
						token: t,
						hasCategory: !!category,
						hasSource: !!mSource,
						hasPageRange: !!mPage,
						category,
						source: mSource ? mSource[1].trim() : null,
						pageRange: mPage ? [Number(mPage[1]), mPage[3] ? Number(mPage[3]) : Number(mPage[1])] : null
					});
					return false;
				}
				return true;
			});

			let page = 0;
			let results;

			const specialTokenMetasCategory = tokenMetas.filter(it => it.hasCategory);
			const specialTokenMetasSource = tokenMetas.filter(it => it.hasSource);
			const specialTokenMetasPageRange = tokenMetas.filter(it => it.hasPageRange);
			if (
				(specialTokenMetasCategory.length === 1 || specialTokenMetasSource.length >= 1 || specialTokenMetasPageRange.length >= 1)
				&& (specialTokenMetasCategory.length <= 1) // Sanity constraints--on an invalid search, run the default search
			) {
				const categoryTerm = specialTokenMetasCategory.length ? specialTokenMetasCategory[0].category.toLowerCase() : null;
				const sourceTerms = specialTokenMetasSource.map(it => it.source);
				const pageRanges = specialTokenMetasPageRange.map(it => it.pageRange);
				// Glue the remaining tokens back together, and pass them to search lib
				const searchTerm = filteredBasicTokens.join(" ");

				results = searchTerm
					? Omnisearch._searchIndex
						.search(
							searchTerm,
							{
								fields: {
									n: {boost: 5, expand: true},
									s: {expand: true}
								},
								bool: "AND",
								expand: true
							}
						)
					: Object.values(Omnisearch._searchIndex.documentStore.docs).map(it => ({doc: it}));

				results = results
					.filter(r => !categoryTerm || (r.doc.cf.toLowerCase() === categoryTerm))
					.filter(r => !sourceTerms.length || (sourceTerms.includes(r.doc.s.toLowerCase())))
					.filter(r => !pageRanges.length || (r.doc.p && pageRanges.some(range => r.doc.p >= range[0] && r.doc.p <= range[1])));
			} else {
				results = Omnisearch._searchIndex.search(
					srch,
					{
						fields: {
							n: {boost: 5, expand: true},
							s: {expand: true}
						},
						bool: "AND",
						expand: true
					}
				);
			}

			if (!doShowUaEtc()) {
				results = results.filter(r => r.doc.s && !SourceUtil._isNonstandardSourceWiz(r.doc.s));
			}

			if (!doHideBlacklisted() && ExcludeUtil.getList().length) {
				results = results.filter(r => {
					if (r.doc.c === Parser.CAT_ID_QUICKREF) return true;
					const bCat = Parser.pageCategoryToProp(r.doc.c);
					const bName = r.doc.b || r.doc.n;
					return !ExcludeUtil.isExcluded(bName, bCat, r.doc.s);
				});
			}

			if (results.length) {
				renderLinks();
			} else {
				$searchOut.empty();
				$searchOutWrapper.hide();
			}

			function renderLinks () {
				function getHoverStr (category, url, src) {
					return `onmouseover="Renderer.hover.pHandleLinkMouseOver(event, this, '${UrlUtil.categoryToPage(category)}', '${src}', '${url.replace(/'/g, "\\'")}')" onmouseleave="Renderer.hover.handleLinkMouseLeave(event, this)" onmousemove="Renderer.hover.handleLinkMouseMove(event, this)" ${Renderer.hover.getPreventTouchString()}`;
				}

				$searchOut.empty();

				const showUa = doShowUaEtc();
				const $btnUaEtc = $(`<button class="btn btn-default btn-xs mr-2 ${showUa ? "active" : ""}" title="Filter Unearthed Arcana and other unofficial source results" tabindex="-1">Include UA/etc.</button>`)
					.on("click", () => {
						setShowUaEtc(!showUa);
						pDoSearch();
					});

				const hideBlacklisted = doHideBlacklisted();
				const $btnBlacklist = $(`<button class="btn btn-default btn-xs mr-2 ${hideBlacklisted ? "active" : ""}" title="Filter blacklisted content results" tabindex="-1">Include Blacklisted</button>`)
					.on("click", () => {
						setShowBlacklisted(!hideBlacklisted);
						pDoSearch();
					});

				const $btnHelp = $(`<button class="btn btn-default btn-xs" title="Help"><span class="glyphicon glyphicon-info-sign"></span></button>`)
					.click(() => {
						const {$modalInner} = UiUtil.getShowModal({
							title: "Help",
							isMinHeight0: true
						});

						$modalInner.append(`
							<p>The following search syntax is available:</p>
							<ul>
								<li><code>in:&lt;category&gt;</code> where <code>&lt;category&gt;</code> can be &quot;spell&quot;, &quot;item&quot;, &quot;bestiary&quot;, etc.</li>
								<li><code>source:&lt;abbreviation&gt;</code> where <code>&lt;abbreviation&gt;</code> is an abbreviated source/book name (&quot;PHB&quot;, &quot;MM&quot;, etc.)</li>
								<li><code>page:&lt;number&gt;</code> or <code>page:&lt;rangeStart&gt;-&lt;rangeEnd&gt;</code></li>
							</ul>
						`);
					});

				$searchOut.append($(`<div class="text-right"/>`).append([$btnUaEtc, $btnBlacklist, $btnHelp]));
				const base = page * MAX_RESULTS;
				for (let i = base; i < Math.max(Math.min(results.length, MAX_RESULTS + base), base); ++i) {
					const r = results[i].doc;

					const $link = $(`<a href="${Renderer.get().baseUrl}${UrlUtil.categoryToPage(r.c)}#${r.u}" ${r.h ? getHoverStr(r.c, r.u, r.s) : ""}>${r.cf}: ${r.n}</a>`)
						.keydown(evt => Omnisearch.handleLinkKeyDown(evt, $link, $iptSearch, $searchOut));

					const ptSourceInner = `<i title="${Parser.sourceJsonToFull(r.s)}">${Parser.sourceJsonToAbv(r.s)}${r.p ? ` p${r.p}` : ""}</i>`;
					const {s: source, p: page} = r;
					const adventureBookSourceHref = SourceUtil.getAdventureBookSourceHref(source, page);
					const ptSource = adventureBookSourceHref
						? `<a href="${adventureBookSourceHref}">${ptSourceInner}</a>`
						: ptSourceInner;

					$$`<p>
						${$link}
						${ptSource}
					</p>`.appendTo($searchOut);
				}
				$searchOutWrapper.css("display", "flex");

				// add pagination if there are many results
				if (results.length > MAX_RESULTS) {
					const $pgControls = $(`<div class="omni__wrp-paginate">`);
					if (page > 0) {
						const $prv = $(`<span class="omni__paginate-left has-results-left omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-left"></span></span>`).on("click", () => {
							page--;
							renderLinks();
						});
						$pgControls.append($prv);
					} else ($pgControls.append(`<span class="omni__paginate-left">`));
					$pgControls.append(`<span class="paginate-count">Page ${page + 1}/${Math.ceil(results.length / MAX_RESULTS)} (${results.length} results)</span>`);
					if (results.length - (page * MAX_RESULTS) > MAX_RESULTS) {
						const $nxt = $(`<span class="omni__paginate-right has-results-right omni__paginate-ctrl"><span class="glyphicon glyphicon-chevron-right"></span></span>`).on("click", () => {
							page++;
							renderLinks();
						});
						$pgControls.append($nxt)
					} else ($pgControls.append(`<span class="omni__paginate-right omni__paginate-ctrl">`));
					$searchOut.append($pgControls);
				}

				if (clickFirst) {
					$searchOut.find(`a`).first()[0].click();
				}
			}
		}
		const STORAGE_NAME_UA_ETC = "search-ua-etc";
		const STORAGE_NAME_BLACKLIST = "search-blacklist";
		const CK_SHOW = "SHOW";
		const CK_HIDE = "HIDE";

		let showUaEtc;
		function doShowUaEtc () {
			if (!showUaEtc) showUaEtc = StorageUtil.syncGet(STORAGE_NAME_UA_ETC);
			return showUaEtc !== CK_HIDE;
		}

		function setShowUaEtc (value) {
			showUaEtc = value ? CK_SHOW : CK_HIDE;
			StorageUtil.syncSet(STORAGE_NAME_UA_ETC, showUaEtc);
		}

		let hideBlacklisted;
		function doHideBlacklisted () {
			if (!hideBlacklisted) hideBlacklisted = StorageUtil.syncGet(STORAGE_NAME_BLACKLIST);
			return hideBlacklisted === CK_SHOW;
		}

		function setShowBlacklisted (value) {
			hideBlacklisted = value ? CK_SHOW : CK_HIDE;
			StorageUtil.syncSet(STORAGE_NAME_BLACKLIST, hideBlacklisted);
		}

		function initScrollHandler () {
			const $window = $(window);
			$window.on("scroll", evt => {
				if (Renderer.hover.isSmallScreen(evt)) {
					$iptSearch.attr("placeholder", Omnisearch._PLACEHOLDER_TEXT);
					$searchInputWrapper.removeClass("omni__wrp-input--scrolled");
					$searchOut.removeClass("omni__output--scrolled");
				} else {
					if ($window.scrollTop() > 50) {
						$iptSearch.attr("placeholder", "");
						$searchInputWrapper.addClass("omni__wrp-input--scrolled");
						$searchOut.addClass("omni__output--scrolled");
					} else {
						$iptSearch.attr("placeholder", Omnisearch._PLACEHOLDER_TEXT);
						$searchInputWrapper.removeClass("omni__wrp-input--scrolled");
						$searchOut.removeClass("omni__output--scrolled");
					}
				}
			});
		}

		$body.on("keypress", (e) => {
			if (!noModifierKeys(e) || MiscUtil.isInInput(e)) return;
			if (e.key === "f" || e.key === "F") {
				const toSel = e.key === "F" ? $iptSearch : $(`#filter-search-input-group`).find(`.search`);
				// defer, otherwise the "f" will be input into the search field
				setTimeout(() => toSel.select().focus(), 0);
			}
		});
	},

	async pInit () {
		if (!Omnisearch._searchIndex) {
			if (Omnisearch._pLoadSearch) await Omnisearch._pLoadSearch;
			else {
				Omnisearch._pLoadSearch = Omnisearch._pDoSearchLoad();
				await Omnisearch._pLoadSearch;
				Omnisearch._pLoadSearch = null;
			}
		}
	},

	_pDoSearchLoad: async function () {
		const data = Omnidexer.decompressIndex(await DataUtil.loadJSON(`${Renderer.get().baseUrl}search/index.json`));

		elasticlunr.clearStopWords();
		Omnisearch._searchIndex = elasticlunr(function () {
			this.addField("n");
			this.addField("cf");
			this.addField("s");
			this.setRef("id");
		});
		SearchUtil.removeStemmer(Omnisearch._searchIndex);

		data.forEach(Omnisearch._addToIndex);
		Omnisearch.highestId = data.last().id;

		// this doesn't update if the 'Brew changes later, but so be it.
		const brewIndex = await BrewUtil.pGetSearchIndex();
		brewIndex.forEach(Omnisearch._addToIndex);
		if (brewIndex.length) Omnisearch.highestId = brewIndex.last().id

		Omnisearch._adventureBookLookup = {};
		[brewIndex, data].forEach(index => {
			index.forEach(it => {
				if (it.c === Parser.CAT_ID_ADVENTURE || it.c === Parser.CAT_ID_BOOK) Omnisearch._adventureBookLookup[it.s.toLowerCase()] = it.c;
			});
		});
	},

	async pAddToIndex (prop, ...entries) {
		if (!entries.length) return;

		await Omnisearch.pInit();
		const indexer = new Omnidexer(Omnisearch.highestId + 1);

		const toIndex = {[prop]: entries};

		Omnidexer.TO_INDEX__FROM_INDEX_JSON.filter(it => it.listProp === prop)
			.forEach(it => indexer.addToIndex(it, toIndex));
		Omnidexer.TO_INDEX.filter(it => it.listProp === prop)
			.forEach(it => indexer.addToIndex(it, toIndex));

		const toAdd = Omnidexer.decompressIndex(indexer.getIndex());
		toAdd.forEach(Omnisearch._addToIndex);
		if (toAdd.length) Omnisearch.highestId = toAdd.last().id
	},

	_addToIndex (d) {
		d.cf = Parser.pageCategoryToFull(d.c);
		if (!Omnisearch._CATEGORY_COUNTS[d.cf]) Omnisearch._CATEGORY_COUNTS[d.cf] = 1;
		else Omnisearch._CATEGORY_COUNTS[d.cf]++;
		Omnisearch._searchIndex.addDoc(d);
	},

	handleLinkKeyDown (e, $ele, $searchIn, $searchOut) {
		Renderer.hover.cleanTempWindows();
		switch (e.which) {
			case 37: { // left
				e.preventDefault();
				if ($(`.has-results-left`).length) {
					const ix = $ele.parent().index() - 1; // offset as the control bar is at position 0
					$(`.omni__paginate-left`).click();
					const $psNext = $searchOut.find(`p`);
					$($psNext[ix] || $psNext[$psNext.length - 1]).find(`a`).focus();
				}
				break;
			}
			case 38: { // up
				e.preventDefault();
				if ($ele.parent().prev().find(`a`).length) {
					$ele.parent().prev().find(`a`).focus();
				} else if ($(`.has-results-left`).length) {
					$(`.omni__paginate-left`).click();
					$searchOut.find(`a`).last().focus();
				} else {
					$searchIn.focus();
				}
				break;
			}
			case 39: { // right
				e.preventDefault();
				if ($(`.has-results-right`).length) {
					const ix = $ele.parent().index() - 1; // offset as the control bar is at position 0
					$(`.omni__paginate-right`).click();
					const $psNext = $searchOut.find(`p`);
					$($psNext[ix] || $psNext[$psNext.length - 1]).find(`a`).focus();
				}
				break;
			}
			case 40: { // down
				e.preventDefault();
				if ($ele.parent().next().find(`a`).length) {
					$ele.parent().next().find(`a`).focus();
				} else if ($(`.has-results-right`).length) {
					$(`.omni__paginate-right`).click();
					$searchOut.find(`a`).first().focus();
				}
				break;
			}
		}
	},

	addScrollTopFloat () {
		const $wrpTop = $(`<div class="bk__to-top"/>`).appendTo($("body"));
		const $btnToTop = $(`<button class="btn btn-sm btn-default" title="To Top"><span class="glyphicon glyphicon-arrow-up"/></button>`).appendTo($wrpTop).click(() => MiscUtil.scrollPageTop());

		$(window).on("scroll", () => {
			if ($(window).scrollTop() > 50) $wrpTop.addClass("bk__to-top--scrolled");
			else $wrpTop.removeClass("bk__to-top--scrolled");
		});

		return $wrpTop;
	}
};

window.addEventListener("load", Omnisearch.init);
