class RenderTrapsHazards {
	static $getRenderedTrapHazard (it) {
		const renderStack = [];

		Renderer.get().recursiveRender({entries: it.entries}, renderStack, {depth: 2});

		const simplePart = Renderer.traphazard.getSimplePart(Renderer.get(), it);
		const complexPart = Renderer.traphazard.getComplexPart(Renderer.get(), it);
		const subtitle = Renderer.traphazard.getSubtitle(it);

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr(it, it.__prop)}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TRAPS_HAZARDS})}
		${subtitle ? `<tr class="text"><td colspan="6"><i>${Renderer.traphazard.getSubtitle(it)}</i></td>` : ""}
		<tr class="text"><td colspan="6">${renderStack.join("")}${simplePart || ""}${complexPart || ""}</td></tr>
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}`;
	}
}
