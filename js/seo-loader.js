window.addEventListener("load", async () => {
	Renderer.get().setBaseUrl("/");
	await Renderer.trait.preloadTraits();
	const it = await Renderer.hover.pCacheAndGet(`${_SEO_PAGE}.html`, _SEO_SOURCE, _SEO_HASH);

	document.title = `${it.name} - Pf2eTools`;
	$(`.page__title`).text(`${_SEO_PAGE.toTitleCase()}: ${it.name}`);

	$(`<div class="col-12 flex-vh-center my-2 pt-3">
		<button class="btn btn-primary">
			<a href="/${_SEO_PAGE}.html" style="font-size: 1.7em; color: white;">${_SEO_STYLE === 1 ? `View All` : `View Complete`} ${_SEO_PAGE.toTitleCase()}</a>
		</button>
	</div>`).appendTo($(`#link-page`));

	const $content = $(`#pagecontent`).empty();

	$(`.nav__link`).each((i, e) => {
		const $e = $(e);
		const href = $e.attr("href");
		if (!href.startsWith("http") && href.endsWith(".html")) $e.attr("href", `../${href}`);
	});

	switch (_SEO_PAGE) {
		case "spells": $content.append(Renderer.spell.getRenderedString(it)); break;
		case "bestiary": {
			$content.append(Renderer.creature.getRenderedString(it));
			$(`.mon__name--token`).css({paddingRight: 5});
			break;
		}
		case "items": $content.append(Renderer.item.getRenderedString(it)); break;
		case "feats": $content.append(Renderer.feat.getRenderedString(it, {renderLeadsTo: true})); break;
		case "backgrounds": $content.append(Renderer.background.getRenderedString(it)); break;
	}
});
