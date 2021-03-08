class RenderAbilities {
	static $getRenderedAbility (it) {
		const renderStack = [""]
		Renderer.get().setFirstSection(true).recursiveRender(it.entries, renderStack, {pf2StatFix: true})
		return $$`
		${Renderer.utils.getExcludedDiv(it, "ability", UrlUtil.PG_ABILITIES)}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_ABILITIES, activity: true, type: ""})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(it.traits || [])}
		${Renderer.ability.getSubHead(it)}
		${renderStack.join("")}
		${Renderer.utils.getPageP(it)}`
	}
}
