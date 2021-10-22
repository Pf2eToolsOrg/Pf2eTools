class RenderHazards {
	static $getRenderedTrapHazard (it) {
		return $$`
		${Renderer.hazard.getCompactRenderedString(it)}
		`;
	}
}
