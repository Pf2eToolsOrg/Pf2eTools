class RenderTraits {
	static $getRenderedTrait (trait) {
		return $$`
		${Renderer.trait.getRenderedString(trait)}
		<p class="pf-2-stat-source"><strong>${trait.source}</strong> ${trait.page ? `page ${trait.page}`: ``}</p>
		`;
	}
}
