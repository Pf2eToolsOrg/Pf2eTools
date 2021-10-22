class RenderBestiary {
	static $getRenderedCreature (cr, options) {
		cr = scaleCreature.applyVarRules(cr);
		options = options || {};
		const traits = [];
		if (cr.rarity !== "Common") traits.push(cr.rarity);
		if (cr.alignment != null) traits.push(cr.alignment);
		if (cr.size != null) traits.push(cr.size);
		if (cr.traits != null && cr.traits.length) traits.push(...cr.traits);
		if (cr.creatureType != null) traits.push(...cr.creatureType);

		return $$`${Renderer.utils.getExcludedDiv(cr, "creature", UrlUtil.PG_BESTIARY)}
			${Renderer.utils.getNameDiv(cr, {type: cr.type || "CREATURE", page: UrlUtil.PG_BESTIARY, $btnResetScaleLvl: options.$btnResetScaleLvl, $btnScaleLvl: options.$btnScaleLvl, asJquery: true})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(traits)}
			${Renderer.creature.getPerception(cr)}
			${Renderer.creature.getLanguages(cr)}
			${Renderer.creature.getSkills(cr)}
			${Renderer.creature.getAbilityMods(cr.abilityMods)}
			${cr.abilitiesTop != null ? cr.abilitiesTop.map(it => Renderer.creature.getRenderedAbility(it, {noButton: true})) : ""}
			${Renderer.creature.getItems(cr)}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getDefenses(cr)}
			${cr.abilitiesMid != null ? cr.abilitiesMid.map(it => Renderer.creature.getRenderedAbility(it, {noButton: true})) : ""}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getSpeed(cr)}
			${Renderer.creature.getAttacks(cr)}
			${Renderer.creature.getSpellcasting(cr)}
			${Renderer.creature.getRituals(cr)}
			${cr.abilitiesBot != null ? cr.abilitiesBot.map(it => Renderer.creature.getRenderedAbility(it, {noButton: true})) : ""}
			${Renderer.utils.getPageP(cr)}`;
	}
}
