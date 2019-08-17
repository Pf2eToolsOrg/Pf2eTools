class RenderTables {
	static $getRenderedTable (it) {
		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(it)}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		${Renderer.table.getCompactRenderedString(it)}
		${it.chapter ? `<tr class="text"><td colspan="6">
		${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table` : "These tables"} can be found in ${Parser.sourceJsonToFull(it.source)}${Parser.bookOrdinalToAbv(it.chapter.ordinal, true)}, {@book ${it.chapter.name}|${it.source}|${it.chapter.index}|${it.chapter.name}}.}`)}
		</td></tr>` : ""}
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}`;
	}
}
