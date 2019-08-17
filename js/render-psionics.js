class RenderPsionics {
	static $getRenderedPsionic (psi) {
		const renderer = Renderer.get().setFirstSection(true);
		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(psi)}
			<tr>
				<td colspan="6"><i>${psi.type === "T" ? Parser.psiTypeToFull(psi.type) : `${psi._fOrder} ${Parser.psiTypeToFull(psi.type)}`}</i><span id="order"></span> <span id="type"></span></td>
			</tr>
			<tr><td class="divider" colspan="6"><div></div></td></tr>
			<tr class="text"><td colspan="6" id="text">${psi.type === "T" ? Renderer.psionic.getTalentText(psi, renderer) : Renderer.psionic.getDisciplineText(psi, renderer)}</td></tr>
			${Renderer.utils.getPageTr(psi)}
			${Renderer.utils.getBorderTr()}
		`
	}
}
