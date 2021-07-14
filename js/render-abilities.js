class RenderAbilities {
	static $getRenderedAbility (it) {
		return $$`
		${Renderer.utils.getExcludedDiv(it, "ability", UrlUtil.PG_ABILITIES)}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_ABILITIES, activity: true, type: ""})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(it.traits || [])}
		${Renderer.ability.getSubHead(it)}
		${Renderer.generic.getRenderedEntries(it)}
		${Renderer.utils.getPageP(it)}`
	}
}
