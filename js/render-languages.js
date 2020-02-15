class RenderLanguages {
	static $getRenderedLanguage (it) {
		return $$`${Renderer.utils.getBorderTr()}
		${Renderer.language.getRenderedString(it)}
		${Renderer.utils.getBorderTr()}`;
	}
}
