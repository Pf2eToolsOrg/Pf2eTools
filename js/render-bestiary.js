class RenderBestiary {
	static _getRenderedSection(sectionTrClass, sectionEntries, sectionLevel) {
		const renderer = Renderer.get();
		const renderStack = [];
		sectionEntries.forEach(e => {
			if (e.rendered) renderStack.push(e.rendered);
			else renderer.recursiveRender(e, renderStack, {depth: sectionLevel + 1});
		});

		return `<tr class="${sectionTrClass}"><td colspan="6" class="mon__sect-row-inner">${renderStack.join("")}</td></tr>`;
	}


	/**
	 * @param {Object} mon Creature data.
	 * @param {Object} options
	 * @param {jQuery} options.$btnScaleCr CR scaler button.
	 * @param {jQuery} options.$btnResetScaleCr CR scaler reset button.
	 */
	static $getRenderedCreature(mon, options) {
		options = options || {};
		const renderer = Renderer.get();

		let renderStack = []

		const traits = (mon.rarity === "Common" ? [] : [mon.rarity]).concat([mon.alignment]).concat([mon.size]).concat(mon.traits.concat(mon.creature_type).sort())

		renderStack.push(`${Renderer.utils.getNameDiv(mon, {page: UrlUtil.PG_BESTIARY})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(traits)}
			${Renderer.monster.getPerception(mon)}
			${Renderer.monster.getLanguages(mon)}
			${Renderer.monster.getSkills(mon)}
			${Renderer.monster.getAbilityMods(mon)}
			${Renderer.monster.getItems(mon)}`)
		mon.abilities_interactive.forEach((ab) => {renderer.recursiveRender(ab, renderStack, {depth: 1})})
		renderStack.push(`${Renderer.utils.getDividerDiv()}
			${Renderer.monster.getDefenses(mon)}`)
		mon.abilities_automatic.forEach((ab) => {renderer.recursiveRender(ab, renderStack, {depth: 1})})
		renderStack.push(`${Renderer.utils.getDividerDiv()}
			${Renderer.monster.getSpeed(mon)}
			${Renderer.monster.getAttacks(mon)}
			${Renderer.monster.getSpellcasting(mon)}
			${Renderer.monster.getRituals(mon)}`)
		mon.abilities_active.forEach((ab) => {renderer.recursiveRender(ab, renderStack, {depth: 1})})


		return (renderStack.join(''))
	}
}
