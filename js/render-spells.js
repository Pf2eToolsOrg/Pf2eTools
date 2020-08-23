class RenderSpells {
	static $getRenderedSpell (sp, subclassLookup) {
		const renderer = Renderer.get();

		const renderStack = [];
		renderer.setFirstSection(true);

		renderStack.push(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr(sp, "spell", UrlUtil.PG_SPELLS)}
			${Renderer.utils.getNameTr(sp, {page: UrlUtil.PG_SPELLS})}
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

		const fromClassList = Renderer.spell.getCombinedClasses(sp, "fromClassList");
		if (fromClassList.length) {
			const [current, legacy] = Parser.spClassesToCurrentAndLegacy(fromClassList);
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Classes: </span>${Parser.spMainClassesToFull(current)}</td></tr>`);
			if (legacy.length) renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Classes (legacy): </span>${Parser.spMainClassesToFull(legacy)}</section></td></tr>`);
		}

		const fromSubclass = Renderer.spell.getCombinedClasses(sp, "fromSubclass");
		if (fromSubclass.length) {
			const [current, legacy] = Parser.spSubclassesToCurrentAndLegacyFull(sp, subclassLookup);
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Subclasses: </span>${current}</td></tr>`);
			if (legacy.length) {
				renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Subclasses (legacy): </span>${legacy}</section></td></tr>`);
			}
		}

		const fromClassListVariant = Renderer.spell.getCombinedClasses(sp, "fromClassListVariant");
		if (fromClassListVariant.length) {
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold" title="Source: ${Parser.sourceJsonToFull(SRC_UACFV)}">Variant Classes: </span>${Parser.spMainClassesToFull(fromClassListVariant)}</td></tr>`);
		}

		if (sp.races) {
			sp.races.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Races: </span>${sp.races.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@race ${r.name}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join(", ")}</td></tr>`);
		}

		if (sp.backgrounds) {
			sp.backgrounds.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Backgrounds: </span>${sp.backgrounds.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@background ${r.name}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join(", ")}</td></tr>`);
		}

		if (sp.eldritchInvocations) {
			sp.eldritchInvocations.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Eldritch Invocations: </span>${sp.eldritchInvocations.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@optfeature ${r.name}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join(", ")}</td></tr>`);
		}

		if (sp._scrollNote) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
			renderer.recursiveRender(`{@italic Note: Both the {@class fighter||${Renderer.spell.STR_FIGHTER} (${Renderer.spell.STR_ELD_KNIGHT})|eldritch knight} and the {@class rogue||${Renderer.spell.STR_ROGUE} (${Renderer.spell.STR_ARC_TCKER})|arcane trickster} spell lists include all {@class ${Renderer.spell.STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`, renderStack, {depth: 2});
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
					sc.source = sc.source || c.source;
					sc.shortName = sc.shortName || sc.name;
					(target[sc.source] =
						target[sc.source] || {})[sc.shortName] =
						target[sc.source][sc.shortName] || {name: sc.name}
				});
			})
		}

		if (homebrew.subclass) {
			homebrew.subclass.forEach(sc => {
				const clSrc = sc.classSource || SRC_PHB;
				sc.shortName = sc.shortName || sc.name;

				(subclassLookup[clSrc] =
					subclassLookup[clSrc] || {})[sc.className] =
					subclassLookup[clSrc][sc.className] || {};

				const target = subclassLookup[clSrc][sc.className];
				(target[sc.source] =
					target[sc.source] || {})[sc.shortName] =
					target[sc.source][sc.shortName] || {name: sc.name}
			})
		}
	}
}
