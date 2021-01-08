class RenderDeities {
	static $getRenderedDeity (deity) {
		const renderer = Renderer.get().setFirstSection(true);
		const entry = {
			type: "pf2-h3",
			name: `${deity.name}${deity.alignment && deity.alignment.length === 1 ? ` (${deity.alignment[0]})` : ""}`,
			entries: [
				...deity.info,
			],
		};
		return $$`
			${Renderer.utils.getExcludedDiv(deity, "deity", UrlUtil.PG_DEITIES)}
			${renderer.render(entry)}
			${Renderer.deity.getEdictsAnathemaAlign(deity)}
			${Renderer.deity.getDevoteeBenefits(deity)}
			${deity.reprinted ? `<p class="pf2-p"><i class="text-muted">Note: this deity has been reprinted in a newer publication.</i></p>` : ""}
			${Renderer.utils.getPageP(deity)}`;
	}
}
