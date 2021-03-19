class RenderBestiary {
	static $getRenderedCreature (cr, options) {
		options = options || {};
		const traits = (cr.rarity === "Common" ? [] : [cr.rarity]).concat([cr.alignment]).concat([cr.size]).concat(cr.traits.concat(cr.creature_type).sort());

		return $$`${Renderer.utils.getExcludedDiv(cr, "creature", UrlUtil.PG_BESTIARY)}
			${Renderer.utils.getNameDiv(cr, {type: cr.type || "CREATURE", page: UrlUtil.PG_BESTIARY, $btnResetScaleLvl: options.$btnResetScaleLvl, $btnScaleLvl: options.$btnScaleLvl, asJquery: true})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(traits)}
			${Renderer.creature.getPerception(cr)}
			${Renderer.creature.getLanguages(cr)}
			${Renderer.creature.getSkills(cr)}
			${Renderer.creature.getAbilityMods(cr.ability_modifiers)}
			${cr.abilities_interactive.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.creature.getItems(cr)}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getDefenses(cr)}
			${cr.abilities_automatic.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getSpeed(cr)}
			${Renderer.creature.getAttacks(cr)}
			${Renderer.creature.getSpellcasting(cr)}
			${Renderer.creature.getRituals(cr)}
			${cr.abilities_active.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.utils.getPageP(cr)}`;
	}
}
