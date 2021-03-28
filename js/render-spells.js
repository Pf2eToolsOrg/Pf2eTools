class RenderSpells {
	static $getRenderedSpell (sp) {
		return $$`${Renderer.spell.getCompactRenderedString(sp)}`
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
