class RenderTables {
	static $getRenderedTable (it) {
		it.type = it.type || "table";
		return $$`
		${Renderer.utils.getExcludedDiv(it, "table")}
		${Renderer.get().setFirstSection(true).render(it)}
		${Renderer.utils.getPageP(it)}`;
	}
}
