class RenderDeities {
	static $getRenderedDeity (deity) {
		return $$`
			${Renderer.deity.getCompactRenderedString(deity)}`;
	}
}
