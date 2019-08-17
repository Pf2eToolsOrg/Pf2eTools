class RenderVariantRules {
	static $getRenderedVariantRule (rule) {
		Renderer.get().setFirstSection(true);
		const textStack = [];
		Renderer.get().resetHeaderIndex();
		Renderer.get().recursiveRender(rule, textStack);

		return $$`
		${Renderer.utils.getBorderTr()}
		<tr class="text"><td colspan="6">${textStack.join("")}</td></tr>
		${Renderer.utils.getPageTr(rule)}
		${Renderer.utils.getBorderTr()}`;
	}
}
