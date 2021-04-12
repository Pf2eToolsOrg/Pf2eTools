class RenderBestiary {
	static $getRenderedCreature (cr, options) {
		options = options || {};
		const traits = (cr.rarity === "Common" ? [] : [cr.rarity]).concat([cr.alignment]).concat([cr.size]).concat(cr.traits.concat(cr.creatureType).sort());

		return $$`${Renderer.utils.getExcludedDiv(cr, "creature", UrlUtil.PG_BESTIARY)}
			${Renderer.utils.getNameDiv(cr, {type: cr.type || "CREATURE", page: UrlUtil.PG_BESTIARY, $btnResetScaleLvl: options.$btnResetScaleLvl, $btnScaleLvl: options.$btnScaleLvl, asJquery: true})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(traits)}
			${Renderer.creature.getPerception(cr)}
			${Renderer.creature.getLanguages(cr)}
			${Renderer.creature.getSkills(cr)}
			${Renderer.creature.getAbilityMods(cr.abilityMods)}
			${cr.abilitiesTop.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.creature.getItems(cr)}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getDefenses(cr)}
			${cr.abilitiesMid.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getSpeed(cr)}
			${Renderer.creature.getAttacks(cr)}
			${Renderer.creature.getSpellcasting(cr)}
			${Renderer.creature.getRituals(cr)}
			${cr.abilitiesBot.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.utils.getPageP(cr)}`;
	}
}
