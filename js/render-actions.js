class RenderActions {
	static $getRenderedAction (it) {
		const renderStack = [""]
		Renderer.get().setFirstSection(true).recursiveRender(it.entries, renderStack, {pf2StatFix: true})
		return $$`
		${Renderer.utils.getExcludedDiv(it, "action", UrlUtil.PG_ACTIONS)}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_ACTIONS, activity: true, type: ""})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(it.traits || [])}
		${Renderer.action.getSubHead(it)}
		${renderStack.join("")}
		${Renderer.utils.getPageP(it)}`
	}
}
