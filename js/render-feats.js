class RenderFeats {
	static $getRenderedFeat (feat) {
		const prerequisite = Renderer.utils.getPrerequisiteText(feat.prerequisite);
		const renderStack = [];
		Renderer.get().setFirstSection(true).recursiveRender({entries: feat.entries}, renderStack, {depth: 2});

		return $$`
			${Renderer.utils.getExcludedDiv(feat, "feat", UrlUtil.PG_FEATS)}
			${Renderer.utils.getNameDiv(feat, {page: UrlUtil.PG_FEATS, type:'FEAT', activity: true})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(feat.traits)}
			${Renderer.feat.getSubHead(feat)}
			<div class="pf2-stat-text">${renderStack.join("")}${Renderer.feat.getSpecial(feat)}</div>
			${Renderer.utils.getPageP(feat)}
		`;
	}
}
