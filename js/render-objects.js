class RenderObjects {
	static $getRenderedObject (obj) {
		const renderer = Renderer.get().setFirstSection(true);
		const renderStack = [];

		if (obj.entries) renderer.recursiveRender({entries: obj.entries}, renderStack, {depth: 2});
		if (obj.actionEntries) renderer.recursiveRender({entries: obj.actionEntries}, renderStack, {depth: 2});

		const hasToken = obj.tokenUrl || obj.hasToken;
		const extraThClasses = hasToken ? ["objs__name--token"] : null;

		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr(obj, "object")}
			${Renderer.utils.getNameTr(obj, {extraThClasses, page: UrlUtil.PG_OBJECTS})}
			<tr class="text"><td colspan="6"><i>${obj.objectType !== "GEN" ? `${Parser.sizeAbvToFull(obj.size)} ${obj.creatureType ? Parser.monTypeToFullObj(obj.creatureType).asText : "object"}` : `Variable size object`}</i><br></td></tr>
			<tr class="text"><td colspan="6">
				${obj.ac != null ? `<b>Armor Class:</b> ${obj.ac}<br>` : ""}
				<b>Hit Points:</b> ${obj.hp}<br>
				${obj.speed != null ? `<b>Speed:</b> ${Parser.getSpeedString(obj)}<br>` : ""}
				<b>Damage Immunities:</b> ${Parser.monImmResToFull(obj.immune)}<br>
				${Parser.ABIL_ABVS.some(ab => obj[ab] != null) ? `<b>Ability Scores:</b> ${Parser.ABIL_ABVS.filter(ab => obj[ab] != null).map(ab => renderer.render(`${ab.toUpperCase()} ${Renderer.utils.getAbilityRoller(obj, ab)}`)).join(", ")}` : ""}
				${obj.resist ? `<b>Damage Resistances:</b> ${Parser.monImmResToFull(obj.resist)}<br>` : ""}
				${obj.vulnerable ? `<b>Damage Vulnerabilities:</b> ${Parser.monImmResToFull(obj.vulnerable)}<br>` : ""}
				${obj.conditionImmune ? `<b>Condition Immunities:</b> ${Parser.monCondImmToFull(obj.conditionImmune)}<br>` : ""}
			</td></tr>
			<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>
			${Renderer.utils.getPageTr(obj)}
			${Renderer.utils.getBorderTr()}`
	}
}
