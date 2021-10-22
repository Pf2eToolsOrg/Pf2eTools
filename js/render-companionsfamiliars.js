class RenderCompanionsFamiliars {
	static $getRenderedCompanionFamiliar (it) {
		if (it.__prop === "companion") return $$`${Renderer.companion.getRenderedString(it)}`;
		else if (it.__prop === "familiar") return $$`${Renderer.familiar.getRenderedString(it)}`;
		else if (it.__prop === "eidolon") return $$`${Renderer.eidolon.getRenderedString(it)}`;
	}
}
