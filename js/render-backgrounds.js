class RenderBackgrounds {
	static $getRenderedBackground (bg) {
		const renderStack = [];
		const entryList = {type: "entries", entries: bg.entries};
		Renderer.get().setFirstSection(true).recursiveRender(entryList, renderStack);

		return $$`
		${Renderer.utils.getNameDiv(bg, {page: UrlUtil.PG_BACKGROUNDS, type:'BACKGROUND'})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getExcludedDiv(bg, "background", UrlUtil.PG_BACKGROUNDS)}
		<div class="pf2-stat-text">${renderStack.join("")}</div>
		${Renderer.utils.getPageP(bg)}
		`
	}
}
