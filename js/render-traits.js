class RenderTraits {
	static $getRenderedTrait (trait) {
		return $$`
		${Renderer.trait.getRenderedString(trait)}
		${Renderer.utils.getPageP(trait)}
		`;
	}
}
