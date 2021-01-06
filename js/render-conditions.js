class RenderConditionDiseases {
	static $getRenderedConditionDisease (it) {
		const entryList = {type: "entries", entries: it.entries};
		const textStack = [];
		Renderer.get().setFirstSection(true).recursiveRender(entryList, textStack);

		return $$`${Renderer.condition.getCompactRenderedString(it)}`
	}
}
