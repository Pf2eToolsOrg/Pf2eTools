class RenderBestiary {
	/**
	 * @param {Object} cr Creature data.
	 * @param {Object} options
	 * @param {jQuery} options.$btnScaleCr CR scaler button.
	 * @param {jQuery} options.$btnResetScaleCr CR scaler reset button.
	 */
	static $getRenderedCreature(cr, options) {
		options = options || {};
		const renderer = Renderer.get();

		let renderStack = []

		const traits = (cr.rarity === "Common" ? [] : [cr.rarity]).concat([cr.alignment]).concat([cr.size]).concat(cr.traits.concat(cr.creature_type).sort())

		renderStack.push(`${Renderer.utils.getNameDiv(cr, {page: UrlUtil.PG_BESTIARY})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(traits)}
			${Renderer.creature.getPerception(cr)}
			${Renderer.creature.getLanguages(cr)}
			${Renderer.creature.getSkills(cr)}
			${Renderer.creature.getAbilityMods(cr)}`)
		cr.abilities_interactive.forEach((ab) => {renderer.recursiveRender(ab, renderStack, {depth: 1})})
		renderStack.push(`${Renderer.creature.getItems(cr)}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getDefenses(cr)}`)
		cr.abilities_automatic.forEach((ab) => {renderer.recursiveRender(ab, renderStack, {depth: 1})})
		renderStack.push(`${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getSpeed(cr)}
			${Renderer.creature.getAttacks(cr)}
			${Renderer.creature.getSpellcasting(cr)}
			${Renderer.creature.getRituals(cr)}`)
		cr.abilities_active.forEach((ab) => {renderer.recursiveRender(ab, renderStack, {depth: 1})})
		renderStack.push(Renderer.utils.getPageP(cr));

		return (renderStack.join(''))
	}
}
