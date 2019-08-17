class RenderObjects {
	static $getRenderedObject (obj) {
		const renderer = Renderer.get().setFirstSection(true);
		const renderStack = [];

		if (obj.entries) renderer.recursiveRender({entries: obj.entries}, renderStack, {depth: 2});
		if (obj.actionEntries) renderer.recursiveRender({entries: obj.actionEntries}, renderStack, {depth: 2});

		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(obj)}
			<tr class="text"><td colspan="6"><i>${obj.type !== "GEN" ? `${Parser.sizeAbvToFull(obj.size)} object` : `Variable size object`}</i><br></td></tr>
			<tr class="text"><td colspan="6">
				<b>Armor Class:</b> ${obj.ac}<br>
				<b>Hit Points:</b> ${obj.hp}<br>
				<b>Damage Immunities:</b> ${obj.immune}<br>
				${obj.resist ? `<b>Damage Resistances:</b> ${obj.resist}<br>` : ""}
				${obj.vulnerable ? `<b>Damage Vulnerabilities:</b> ${obj.vulnerable}<br>` : ""}
			</td></tr>
			<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(obj)}
			${Renderer.utils.getBorderTr()}`
	}
}
