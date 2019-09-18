class RenderSpells {
	static $getRenderedSpell (spell, subclassLookup) {
		const renderer = Renderer.get();

		const renderStack = [];
		renderer.setFirstSection(true);

		renderStack.push(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(spell)}
			<tr><td class="rd-spell__level-school-ritual" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(spell.level, spell.school, spell.meta, spell.subschools)}</span></td></tr>
			<tr><td class="castingtime" colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull(spell.time)}</td></tr>
			<tr><td class="range" colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(spell.range)}</td></tr>
			<tr><td class="components" colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(spell.components, spell.level)}</td></tr>
			<tr><td class="range" colspan="6"><span class="bold">Duration: </span>${Parser.spDurationToFull(spell.duration)}</td></tr>
			${Renderer.utils.getDividerTr()}
		`);

		const entryList = {type: "entries", entries: spell.entries};
		renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		if (spell.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, renderStack, {depth: 2});
		}
		renderStack.push(`</td></tr>`);

		renderStack.push(`<tr class="text"><td class="classes" colspan="6"><span class="bold">Classes: </span>${Parser.spMainClassesToFull(spell.classes)}</td></tr>`);

		if (spell.classes.fromSubclass) {
			const currentAndLegacy = Parser.spSubclassesToCurrentAndLegacyFull(spell.classes, subclassLookup);
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Subclasses: </span>${currentAndLegacy[0]}</td></tr>`);
			if (currentAndLegacy[1]) {
				renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Subclasses (legacy): </span>${currentAndLegacy[1]}</section></td></tr>`);
			}
		}

		if (spell.races) {
			renderStack.push(`<tr class="text"><td class="classes" colspan="6"><span class="bold">Races: </span>${spell.races.map(r => renderer.render(`{@race ${r.name}|${r.source}}`)).join(", ")}</td></tr>`);
		}

		if (spell.backgrounds) {
			renderStack.push(`<tr class="text"><td class="classes" colspan="6"><span class="bold">Backgrounds: </span>${spell.backgrounds.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).map(r => renderer.render(`{@background ${r.name}|${r.source}}`)).join(", ")}</td></tr>`);
		}

		if (spell._scrollNote) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
			renderer.recursiveRender(`{@italic Note: Both the {@class ${RenderSpells.STR_FIGHTER} (${RenderSpells.STR_ELD_KNIGHT})} and the {@class ${RenderSpells.STR_ROGUE} (${RenderSpells.STR_ARC_TCKER})} spell lists include all {@class ${RenderSpells.STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`, renderStack, {depth: 2});
			renderStack.push(`</section></td></tr>`);
		}

		renderStack.push(`
			${Renderer.utils.getPageTr(spell)}
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

	static initClasses (spell, brewSpellClasses) {
		if (spell._isInitClasses) return;
		spell._isInitClasses = true;

		// add eldritch knight and arcane trickster
		if (spell.classes.fromClassList && spell.classes.fromClassList.filter(c => c.name === RenderSpells.STR_WIZARD && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) spell.classes.fromSubclass = [];
			spell.classes.fromSubclass.push({
				class: {name: RenderSpells.STR_FIGHTER, source: SRC_PHB},
				subclass: {name: RenderSpells.STR_ELD_KNIGHT, source: SRC_PHB}
			});
			spell.classes.fromSubclass.push({
				class: {name: RenderSpells.STR_ROGUE, source: SRC_PHB},
				subclass: {name: RenderSpells.STR_ARC_TCKER, source: SRC_PHB}
			});
			if (spell.level > 4) {
				spell._scrollNote = true;
			}
		}

		// add divine soul, favored soul v2, favored soul v3
		if (spell.classes.fromClassList && spell.classes.fromClassList.filter(c => c.name === RenderSpells.STR_CLERIC && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) {
				spell.classes.fromSubclass = [];
				spell.classes.fromSubclass.push({
					class: {name: RenderSpells.STR_SORCERER, source: SRC_PHB},
					subclass: {name: RenderSpells.STR_DIV_SOUL, source: SRC_XGE}
				});
			} else {
				if (!spell.classes.fromSubclass.find(it => it.class.name === RenderSpells.STR_SORCERER && it.class.source === SRC_PHB && it.subclass.name === RenderSpells.STR_DIV_SOUL && it.subclass.source === SRC_XGE)) {
					spell.classes.fromSubclass.push({
						class: {name: RenderSpells.STR_SORCERER, source: SRC_PHB},
						subclass: {name: RenderSpells.STR_DIV_SOUL, source: SRC_XGE}
					});
				}
			}
			spell.classes.fromSubclass.push({
				class: {name: RenderSpells.STR_SORCERER, source: SRC_PHB},
				subclass: {name: RenderSpells.STR_FAV_SOUL_V2, source: SRC_UAS}
			});
			spell.classes.fromSubclass.push({
				class: {name: RenderSpells.STR_SORCERER, source: SRC_PHB},
				subclass: {name: RenderSpells.STR_FAV_SOUL_V3, source: SRC_UARSC}
			});
		}

		if (spell.classes.fromClassList && spell.classes.fromClassList.find(it => it.name === "Wizard")) {
			if (spell.level === 0) {
				// add high elf
				(spell.races || (spell.races = [])).push({
					name: "Elf (High)",
					source: SRC_PHB,
					baseName: "Elf",
					baseSource: SRC_PHB
				});
				// add arcana cleric
				(spell.classes.fromSubclass = spell.classes.fromSubclass || []).push({
					class: {name: RenderSpells.STR_CLERIC, source: SRC_PHB},
					subclass: {name: "Arcana", source: SRC_SCAG}
				});
			}

			// add arcana cleric
			if (spell.level >= 6) {
				(spell.classes.fromSubclass = spell.classes.fromSubclass || []).push({
					class: {name: RenderSpells.STR_CLERIC, source: SRC_PHB},
					subclass: {name: "Arcana", source: SRC_SCAG}
				});
			}
		}

		if (spell.classes.fromClassList && spell.classes.fromClassList.find(it => it.name === "Druid")) {
			if (spell.level === 0) {
				// add nature cleric
				(spell.classes.fromSubclass = spell.classes.fromSubclass || []).push({
					class: {name: RenderSpells.STR_CLERIC, source: SRC_PHB},
					subclass: {name: "Nature", source: SRC_PHB}
				});
			}
		}

		// add homebrew class/subclass
		if (brewSpellClasses) {
			const lowName = spell.name.toLowerCase();
			if (brewSpellClasses[spell.source] && brewSpellClasses[spell.source][lowName]) {
				spell.classes = spell.classes || {};
				if (brewSpellClasses[spell.source][lowName].fromClassList.length) {
					spell.classes.fromClassList = spell.classes.fromClassList || [];
					spell.classes.fromClassList = spell.classes.fromClassList.concat(brewSpellClasses[spell.source][lowName].fromClassList);
				}
				if (brewSpellClasses[spell.source][lowName].fromSubclass.length) {
					spell.classes.fromSubclass = spell.classes.fromSubclass || [];
					spell.classes.fromSubclass = spell.classes.fromSubclass.concat(brewSpellClasses[spell.source][lowName].fromSubclass);
				}
			}
		}
	}
}
RenderSpells.STR_WIZARD = "Wizard";
RenderSpells.STR_FIGHTER = "Fighter";
RenderSpells.STR_ROGUE = "Rogue";
RenderSpells.STR_CLERIC = "Cleric";
RenderSpells.STR_SORCERER = "Sorcerer";
RenderSpells.STR_ELD_KNIGHT = "Eldritch Knight";
RenderSpells.STR_ARC_TCKER = "Arcane Trickster";
RenderSpells.STR_DIV_SOUL = "Divine Soul";
RenderSpells.STR_FAV_SOUL_V2 = "Favored Soul v2 (UA)";
RenderSpells.STR_FAV_SOUL_V3 = "Favored Soul v3 (UA)";
