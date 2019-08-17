class RenderCultsBoons {
	static $getRenderedCultBoon (it) {
		return it.__prop === "cult"
			? RenderCultsBoons._$getRenderedCult(it)
			: RenderCultsBoons._$getRenderedBoon(it);
	}

	static _$getRenderedCult (it) {
		const renderer = Renderer.get().setFirstSection(true);

		const renderStack = [];
		Renderer.cultboon.doRenderCultParts(it, renderer, renderStack);
		renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 2});

		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(it)}
			<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
			<tr class="text"><td colspan="6" class="text">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`;
	}

	static _$getRenderedBoon (it) {
		const renderer = Renderer.get().setFirstSection(true);

		const renderStack = [];
		it._displayName = it._displayName || `Demonic Boon: ${it.name}`;
		Renderer.cultboon.doRenderBoonParts(it, renderer, renderStack);
		renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 1});
		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(it)}
			<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(it)}
			${Renderer.utils.getBorderTr()}
		`;
	}
}
