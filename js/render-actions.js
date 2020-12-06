class RenderActions {
	static $getRenderedAction (it) {
		return $$`
		${Renderer.utils.getExcludedDiv(it, "action")}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_ACTIONS, activity: true, type: ""})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(it.traits || [])}
		${Renderer.feat.getSubHead(it)}
		<div class="pf2-stat-text">
		${Renderer.get().setFirstSection(true).render({entries: it.entries})}
		</div>
		${Renderer.utils.getPageP(it)}`
	}
}
