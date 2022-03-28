class RenderItems {
	static $getRenderedItem (item) {
		const renderStack = [""]
		Renderer.get().recursiveRender(item.entries, renderStack, {pf2StatFix: true})
		return $$`
			${Renderer.utils.getExcludedDiv(item, "item")}
			${Renderer.utils.getNameDiv(item, {page: UrlUtil.PG_ITEMS})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(item.traits)}
			${Renderer.item.getSubHead(item)}
			${renderStack.join("")}
			${Renderer.item.getVariantsHtml(item)}
			${Renderer.item.getCraftRequirements(item)}
			${Renderer.item.getDestruction(item)}
			${Renderer.item.getSpecial(item)}
			${Renderer.utils.getPageP(item)}
		`;
	}
}
