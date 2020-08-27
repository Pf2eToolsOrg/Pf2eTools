class RenderSpells {
	static $getRenderedSpell(sp, subclassLookup) {
		const renderer = Renderer.get();

		const renderStack = [];
		renderer.setFirstSection(true);

		renderStack.push(`
		${Renderer.utils.getNameDiv(sp, {page: UrlUtil.PG_SPELLS})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(sp.traits)}`);

		if (sp.traditions !== null) {
			renderStack.push(`<p class="pf-2-stat-indent-second-line"><strong>Traditions </strong>${sp.traditions.join(", ").toLowerCase()}</p>`);
		} else if (sp.domain !== null) {
			renderStack.push(`<p class="pf-2-stat-indent-second-line"><strong>Domain </strong>${sp.domain.toLowerCase()}</p>`);
		}
		let components = ``;
		let components_list = [];
		if (sp.components_focus) {
			components_list.push("focus")
		}
		if (sp.components_material) {
			components_list.push("material")
		}
		if (sp.components_somatic) {
			components_list.push("somatic")
		}
		if (sp.components_verbal) {
			components_list.push("verbal")
		}
		components = components_list.join(", ")
		let cast = ``
		if (!["action", "reaction", "free"].includes(sp.cast["unit"])) {
			components = `(` + components + `)`
			cast = `${sp.cast.number} ${sp.cast.unit}${sp.cast.number > 1 ? "s" : ""}`
		} else {
			if (sp.cast.symbol === "[A]") {
				cast = `<svg class="pf2-1action-icon"><use href="#A"></use></svg>`
			}
			if (sp.cast.symbol === "[AA]") {
				cast = `<svg class="pf2-2action-icon"><use href="#AA"></use></svg>`
			}
			if (sp.cast.symbol === "[AAA]") {
				cast = `<svg class="pf2-3action-icon"><use href="#AAA"></use></svg>`
			}
			if (sp.cast.symbol === "[R]") {
				cast = `<svg class="pf2-reaction-icon"><use href="#R"></use></svg>`
			}
			if (sp.cast.symbol === "[F]") {
				cast = `<svg class="pf2-free-action-icon"><use href="#F"></use></svg>`
			}

		}

		let cst_tr_req = ``;
		if (sp.cost !== null) {
			cst_tr_req = `; <strong>Cost </strong>${sp.cost}`;
		}
		if (sp.trigger !== null) {
			cst_tr_req += `; <strong>Trigger </strong>${sp.trigger}`;
		}
		if (sp.requirements !== null) {
			cst_tr_req += `; <strong>Requirements </strong>${sp.requirements}`;
		}
		renderStack.push(`<p class="pf-2-stat-indent-second-line"><strong>Cast </strong>${cast} ${components}${cst_tr_req}</p>`);

		let rg_ar_tg = ``;
		if (sp.range.type !== null) {
			rg_ar_tg = `<strong>Range </strong>${sp.range.entry}`
		}
		if (sp.area !== null) {
			if (rg_ar_tg === ``) {
				rg_ar_tg = `<strong>Area </strong>${sp.area}`
			} else {
				rg_ar_tg += `; <strong>Area </strong>${sp.area}`
			}
		}
		if (sp.targets !== null) {
			if (rg_ar_tg === ``) {
				rg_ar_tg = `<strong>Targets </strong>${sp.targets}`
			} else {
				rg_ar_tg += `; <strong>Targets </strong>${sp.targets}`
			}
		}
		if (rg_ar_tg !== ``) {
			renderStack.push(`<p class="pf-2-stat-indent-second-line">${rg_ar_tg}</p>`);
		}

		let st_dr = ``
		let basic = ``
		if (sp.saving_throw_basic) {
			basic = `basic `
		}
		if (sp.saving_throw !== null) {
			st_dr = `<strong>Saving Throw </strong>${basic}${sp.saving_throw}`
		}
		if (sp.duration["type"] !== null) {
			if (st_dr === ``) {
				st_dr = `<strong>Duration </strong>${sp.duration["entry"]}`
			} else {
				st_dr += `; <strong>Duration </strong>${sp.duration["entry"]}`
			}
		}
		if (st_dr !== ``) {
			renderStack.push(`<p class="pf-2-stat-indent-second-line">${st_dr}</p>`);
		}

		renderStack.push(Renderer.utils.getDividerDiv());

		let entry_html = ``;
		entry_html = `<p class="pf2-stat-text">${sp.entry}</p>`;
		if (sp.success_degree !== null) {
			for (let key in sp.success_degree) {
				entry_html += `<p class="pf-2-stat-indent-second-line"><strong>${key} </strong>${sp.success_degree[key]}</p>`
			}
		}
		if (sp.affliction !== null) {
			entry_html += Renderer.utils.render_affliction(sp.affliction)
		}
		renderStack.push(entry_html);

		if (sp.heightened) {
			let heighten_html = ``
			if (sp.heightened_plus_x !== null) {
				heighten_html = `<p class="pf-2-stat-indent-second-line"><strong>Heightened (+${sp.heightened_plus_x[0]}) </strong>${sp.heightened_plus_x[1]}</p>`
			} else {
				for (let plus_x of sp.heightened_x) {
					heighten_html += `<p class="pf-2-stat-indent-second-line"><strong>Heightened (${Parser.getOrdinalForm(plus_x[0])}) </strong>${plus_x[1]}</p>`
				}
			}
			renderStack.push(Renderer.utils.getDividerDiv())
			renderStack.push(heighten_html);
		}
		/*
		renderStack.push(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr(sp, "spell")}
			${Renderer.utils.getNameTr(sp, {page: UrlUtil.PG_SPELLS})}
			<tr><td><p class="pf2-h1">DEEZ NUTS</p></td></tr>
			<tr><td class="rd-spell__level-school-ritual" colspan="6"><span>TEST</span></td></tr>
			<tr><td colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull([sp.cast])}</td></tr>
			<tr><td colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(sp.range)}</td></tr>
			<tr><td colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(sp.components, sp.level)}</td></tr>
			<tr><td colspan="6"><span class="bold">Duration: </span>${Parser.spDurationToFull([sp.duration])}</td></tr>
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
			sp.races.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Races: </span>${sp.races.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@race ${r.name}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join(", ")}</td></tr>`);
		}

		if (sp.backgrounds) {
			sp.backgrounds.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Backgrounds: </span>${sp.backgrounds.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@background ${r.name}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join(", ")}</td></tr>`);
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
		*/
		return $(renderStack.join(""));
	}

	static async pGetSubclassLookup() {
		const subclassLookup = {};
		Object.assign(subclassLookup, await DataUtil.loadJSON(`data/generated/gendata-subclass-lookup.json`));
		const homebrew = await BrewUtil.pAddBrewData();
		RenderSpells.mergeHomebrewSubclassLookup(subclassLookup, homebrew);
		return subclassLookup
	}

	static mergeHomebrewSubclassLookup(subclassLookup, homebrew) {
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
					subclassLookup[clSrc] || {})[sc.class] =
					subclassLookup[clSrc][sc.class] || {};

				const target = subclassLookup[clSrc][sc.class];
				(target[sc.source] =
					target[sc.source] || {})[sc.shortName] =
					target[sc.source][sc.shortName] || {name: sc.name}
			})
		}
	}
}
