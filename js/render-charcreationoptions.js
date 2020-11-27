class RenderCharCreationOptions {
	static $getRenderedCharCreationOption (it) {
		const renderStack = [];
		const entryList = {type: "entries", entries: it.entries};
		Renderer.get().setFirstSection(true).recursiveRender(entryList, renderStack);

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr(it, "charoption")}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_CHAR_CREATION_OPTIONS})}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}
		`
	}
}
