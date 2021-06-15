class RenderFeats {
	static $getRenderedFeat (feat) {
		const renderStack = [];
		Renderer.get().setFirstSection(true).recursiveRender(feat.entries, renderStack, {pf2StatFix: true});
		return $$`
			${Renderer.utils.getExcludedDiv(feat, "feat", UrlUtil.PG_FEATS)}
			${Renderer.utils.getNameDiv(feat, {page: UrlUtil.PG_FEATS, type: "FEAT", activity: true})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(feat.traits)}
			${Renderer.feat.getSubHead(feat)}
			${renderStack.join("")}
			${Renderer.feat.getSpecial(feat)}
			${feat.addSections != null ? Renderer.generic.getRenderedSection(feat.addSections).join(Renderer.utils.getDividerDiv()) : ""}
			${Renderer.feat.getLeadsTo(feat)}
			${Renderer.utils.getPageP(feat)}
		`;
	}
}
