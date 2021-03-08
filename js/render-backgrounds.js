class RenderBackgrounds {
	static $getRenderedBackground (bg) {
		const renderStack = [];
		Renderer.get().setFirstSection(true).recursiveRender(bg.entries, renderStack, {pf2StatFix: true});

		return $$`
		${Renderer.utils.getNameDiv(bg, {page: UrlUtil.PG_BACKGROUNDS, type: "BACKGROUND"})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getExcludedDiv(bg, "background", UrlUtil.PG_BACKGROUNDS)}
		${renderStack.join("")}
		${Renderer.utils.getPageP(bg)}
		`
	}
}
