class RenderConditionDiseases {
	static $getRenderedConditionDisease (it) {
		const entryList = {type: "entries", entries: it.entries};
		const textStack = [];
		Renderer.get().setFirstSection(true).recursiveRender(entryList, textStack);

		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(it)}
			<tr><td class="divider" colspan="6"><div></div></td></tr>
			<tr class="text"><td colspan="6">${textStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`
	}
}
