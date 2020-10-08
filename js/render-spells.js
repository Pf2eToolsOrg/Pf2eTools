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
		if (sp.components.F) {
			components_list.push("focus")
		}
		if (sp.components.M) {
			components_list.push("material")
		}
		if (sp.components.S) {
			components_list.push("somatic")
		}
		if (sp.components.V) {
			components_list.push("verbal")
		}
		components = components_list.join(", ")
		let cast = ``
		let castStack = []
		renderer.recursiveRender(sp.cast.entry, castStack, {depth:1}, {prefix: `<span>`, suffix: `</span>`})
		cast = castStack.join('')
		if (!Parser.SP_TIME_ACTIONS.includes(sp.cast.unit) && components.length) {
			components = `(` + components + `)`
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
				rg_ar_tg = `<strong>Area </strong>${sp.area.entry}`
			} else {
				rg_ar_tg += `; <strong>Area </strong>${sp.area.entry}`
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

		const entryList = {type: 'entries', entries: sp.entries};
		renderStack.push(`<div class="pf2-stat-text">`)
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		renderStack.push(`</div>`)

		if (sp.heightened.heigthened) {
			renderStack.push(Renderer.utils.getDividerDiv())
			if (sp.heightened.plus_x !== null) {
				renderStack.push(`<p class="pf-2-stat-indent-second-line"><strong>Heightened (+${sp.heightened.plus_x.level}) </strong>`)
				renderer.recursiveRender(sp.heightened.plus_x.entry, renderStack, {depth: 1})
				renderStack.push(`</p>`)
			}
			if (sp.heightened.x !== null) {
				for (let x of sp.heightened.x) {
					renderStack.push(`<p class="pf-2-stat-indent-second-line"><strong>Heightened (${Parser.getOrdinalForm(x.level)}) </strong>`)
					renderer.recursiveRender(x.entry, renderStack, {depth: 1})
					renderStack.push(`</p>`)
				}
			}
			if (sp.heightened.no_x !== null) {
				renderStack.push(`<p class="pf-2-stat-indent-second-line"><strong>Heightened </strong>`)
				renderer.recursiveRender(sp.heightened.no_x.entry, renderStack, {depth: 1})
				renderStack.push(`</p>`)
			}
		}
		renderStack.push(`<p class="pf-2-stat-source"><strong>${sp.source}</strong> page ${sp.page_nr}</p>`);

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
