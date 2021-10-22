class RenderVariantRules {
	static $getRenderedVariantRule (rule) {
		Renderer.get().setFirstSection(true);
		const textStack = [];
		Renderer.get().resetHeaderIndex();
		Renderer.get().recursiveRender(rule.entries, textStack);

		return $$`
		${Renderer.utils.getExcludedDiv(rule, "variantrule")}
		${textStack.join("")}
		${Renderer.utils.getPageP(rule)}`;
	}
}
