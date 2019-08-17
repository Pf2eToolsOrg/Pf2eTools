window.addEventListener("load", async () => {
	const rawPage = UrlUtil.getCurrentPage();
	let [page, hash] = rawPage
		.replace(/\.html$/i, "")
		.replace(/~S/g, "/")
		.replace(/~Q/g, `"`)
		.split("__");
	hash = encodeURIComponent(hash);
	const [_, source] = hash.split("_");
	Renderer.get().setBaseUrl("/");
	const it = await Renderer.hover.pCacheAndGet(`${page}.html`, source, hash);

	document.title = `${it.name} - 5etools`;
	$(`.page__title`).text(`${page.toTitleCase()}: ${it.name}`);

	$(`<div class="col-12 flex-vh-center my-2"><a href="/${page}.html">Back to ${page.toTitleCase()}</a></div>`).appendTo($(`#link-page`));

	const $content = $(`#pagecontent`).empty();

	switch (page) {
		case "spells": $content.append(RenderSpells.$getRenderedSpell(it, {})); break;
		case "bestiary": {
			Renderer.utils.bindPronounceButtons();
			const meta = {};
			const languages = {};
			await RenderBestiary.pPopulateMetaAndLanguages(meta, languages);
			$content.append(RenderBestiary.$getRenderedCreature(it, meta));
			$(`.mon__name--token`).css({paddingRight: 5});
			break;
		}
		case "items": $content.append(RenderItems.$getRenderedItem(it)); break;

		// TODO expand this as required
		case "races": {
			Renderer.utils.bindPronounceButtons();
			break;
		}
	}
});
