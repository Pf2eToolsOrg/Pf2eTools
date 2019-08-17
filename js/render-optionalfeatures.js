class RenderOptionalFeatures {
	static $getRenderedOptionalFeature (it) {
		return $$`${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(it)}
		${it.prerequisite ? `<tr><td colspan="6"><i>${Renderer.optionalfeature.getPrerequisiteText(it.prerequisite)}</i></td></tr>` : ""}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr><td colspan="6">${Renderer.get().render({entries: it.entries}, 1)}</td></tr>
		${Renderer.optionalfeature.getPreviouslyPrintedText(it)}
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}`
	}
}
