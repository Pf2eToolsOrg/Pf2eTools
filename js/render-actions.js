class RenderActions {
	static $getRenderedAction (it) {
		return $$`
		${Renderer.utils.getExcludedDiv(it, "action", UrlUtil.PG_ACTIONS)}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_ACTIONS, activity: true, type: ""})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(it.traits || [])}
		${Renderer.action.getSubHead(it)}
		${Renderer.generic.getRenderedEntries(it)}
		${Renderer.utils.getPageP(it)}`
	}
}
