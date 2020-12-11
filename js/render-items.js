class RenderItems {
	static $getRenderedItem (item) {
		const renderer = Renderer.get()

		return $$`
			${Renderer.utils.getExcludedDiv(item, "item")}
			${Renderer.utils.getNameDiv(item, {page: UrlUtil.PG_ITEMS, level: item.level})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(item.traits)}
			${Renderer.item.getSubHead(item)}
			<div class="pf2-stat-text">
			${renderer.setFirstSection(true).render({entries: item.entries})}
			</div>
			${Renderer.item.getVariantsHtml(item)}
			${Renderer.item.getCraftRequirements(item)}
			${Renderer.utils.getPageP(item)}
		`;
	}
}
