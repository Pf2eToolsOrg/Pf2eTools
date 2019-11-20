class RenderSpells {
	static $getRenderedSpell (sp, subclassLookup) {
		const renderer = Renderer.get();

		const renderStack = [];
		renderer.setFirstSection(true);

		renderStack.push(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(sp)}
			<tr><td class="rd-spell__level-school-ritual" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(sp.level, sp.school, sp.meta, sp.subschools)}</span></td></tr>
			<tr><td colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull(sp.time)}</td></tr>
			<tr><td colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(sp.range)}</td></tr>
			<tr><td colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(sp.components, sp.level)}</td></tr>
			<tr><td colspan="6"><span class="bold">Duration: </span>${Parser.spDurationToFull(sp.duration)}</td></tr>
			${Renderer.utils.getDividerTr()}
		`);

		const entryList = {type: "entries", entries: sp.entries};
		renderStack.push(`<tr class="text"><td colspan="6" class="text">`);
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		if (sp.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: sp.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, renderStack, {depth: 2});
		}
		renderStack.push(`</td></tr>`);

		if (sp.classes && sp.classes.fromClassList) {
			const [current, legacy] = Parser.spClassesToCurrentAndLegacy(sp.classes);
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Classes: </span>${Parser.spMainClassesToFull({fromClassList: current})}</td></tr>`);
			if (legacy.length) renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Classes (legacy): </span>${Parser.spMainClassesToFull({fromClassList: legacy})}</section></td></tr>`);
		}

		if (sp.classes && sp.classes.fromSubclass) {
			const [current, legacy] = Parser.spSubclassesToCurrentAndLegacyFull(sp.classes, subclassLookup);
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Subclasses: </span>${current}</td></tr>`);
			if (legacy.length) {
				renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Subclasses (legacy): </span>${legacy}</section></td></tr>`);
			}
		}

		if (sp.classes && sp.classes.fromClassListVariant) {
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold" title="Source: ${Parser.sourceJsonToFull(SRC_UACFV)}">Variant Classes: </span>${Parser.spMainClassesToFull(sp.classes, false, "fromClassListVariant")}</td></tr>`);
		}

		if (sp.races) {
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Races: </span>${sp.races.map(r => renderer.render(`{@race ${r.name}|${r.source}}`)).join(", ")}</td></tr>`);
		}

		if (sp.backgrounds) {
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Backgrounds: </span>${sp.backgrounds.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).map(r => renderer.render(`{@background ${r.name}|${r.source}}`)).join(", ")}</td></tr>`);
		}

		if (sp._scrollNote) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
			renderer.recursiveRender(`{@italic Note: Both the {@class ${Renderer.spell.STR_FIGHTER} (${Renderer.spell.STR_ELD_KNIGHT})} and the {@class ${Renderer.spell.STR_ROGUE} (${Renderer.spell.STR_ARC_TCKER})} spell lists include all {@class ${Renderer.spell.STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`, renderStack, {depth: 2});
			renderStack.push(`</section></td></tr>`);
		}

		renderStack.push(`
			${Renderer.utils.getPageTr(sp)}
			${Renderer.utils.getBorderTr()}
		`);

		return $(renderStack.join(""));
	}

	static async pGetSubclassLookup () {
		const subclassLookup = {};
		Object.assign(subclassLookup, await DataUtil.loadJSON(`data/generated/gendata-subclass-lookup.json`));
		const homebrew = await BrewUtil.pAddBrewData();
		RenderSpells.mergeHomebrewSubclassLookup(subclassLookup, homebrew);
		return subclassLookup
	}

	static mergeHomebrewSubclassLookup (subclassLookup, homebrew) {
		if (homebrew.class) {
			homebrew.class.filter(it => it.subclasses).forEach(c => {
				(subclassLookup[c.source] =
					subclassLookup[c.source] || {})[c.name] =
					subclassLookup[c.source][c.name] || {};

				const target = subclassLookup[c.source][c.name];
				c.subclasses.forEach(sc => {
					(target[sc.source] =
						target[sc.source] || {})[sc.shortName || sc.name] =
						target[sc.source][sc.shortName || sc.name] || sc.name
				});
			})
		}

		if (homebrew.subclass) {
			homebrew.subclass.forEach(sc => {
				const clSrc = sc.classSource || SRC_PHB;
				(subclassLookup[clSrc] =
					subclassLookup[clSrc] || {})[sc.class] =
					subclassLookup[clSrc][sc.class] || {};

				const target = subclassLookup[clSrc][sc.class];
				(target[sc.source] =
					target[sc.source] || {})[sc.shortName || sc.name] =
					target[sc.source][sc.shortName || sc.name] || sc.name
			})
		}
	}
}
