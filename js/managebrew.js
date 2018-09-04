class ManageBrew {
	static initialise () {
		BrewUtil.pAddBrewData()
			.then(() => BrewUtil.pAddLocalBrewData())
			.catch(BrewUtil.purgeBrew)
			.then(() => {
				ManageBrew.render();
			})
	}

	static render () {
		// standard brew manager
		const $brew = $(`#brewmanager`).empty();
		const $window = $(`<div style="position: relative;"/>`);
		BrewUtil._renderBrewScreen($brew, $(`<div/>`), $window, false, () => ManageBrew.render());

		// brew meta manager
		if (BrewUtil.homebrewMeta) {
			const $meta = $(`#metamanager`).empty();
			const metaKeys = Object.keys(BrewUtil.homebrewMeta).filter(it => it !== "sources");
			if (metaKeys.length) {
				$meta.append(`
					<hr>
					<h4>Metadata</h4>
					<p><i>Warning: deleting metadata may invalidate or otherwise corrupt homebrew that depends on it. Use with caution.</i></p>
				`);

				const handleSecChange = (i) => {
					if (i < metaKeys.length - 1) {
						$meta.append(`<br>`);
					}
				};

				metaKeys.sort(SortUtil.ascSort).forEach((metaType, i) => {
					const populateGenericSection = (title, displayFn) => {
						const $wrpSect = $(`<div/>`).appendTo($meta);

						const renderSection = () => {
							const keys = Object.keys(BrewUtil.homebrewMeta[metaType] || {});

							$wrpSect.empty();
							if (keys.length) {
								$wrpSect.append(`<div class="bold">${title}:</div>`);
								const $lst = $(`<ul class="list-display-only" style="padding-top: 0"/>`).appendTo($wrpSect);

								keys.forEach(k => {
									const toDisplay = displayFn ? displayFn(BrewUtil.homebrewMeta, metaType, k) : k.toTitleCase();

									const $row = $(`<li class="row manbrew__row">
										<span class="action col-xs-10 manbrew__col--tall">${toDisplay}</span>
									</li>`).appendTo($lst);

									const $btns = $(`<span class="col-xs-2 text-align-right"/>`).appendTo($row);
									$(`<button class="btn btn-danger btn-sm"><span class="glyphicon glyphicon-trash"></span></button>`).appendTo($btns).click(() => {
										delete BrewUtil.homebrewMeta[metaType][k];
										if (!Object.keys(BrewUtil.homebrewMeta[metaType]).length) delete BrewUtil.homebrewMeta[metaType];
										BrewUtil.storage.setItem(HOMEBREW_META_STORAGE, JSON.stringify(BrewUtil.homebrewMeta));
										renderSection();
									});
								});
							}
						};

						renderSection();
					};

					switch (metaType) {
						case "actions": {
							populateGenericSection("Actions");
							break;
						}
						case "spellDistanceUnits": {
							populateGenericSection("Spell Distance Units");
							break;
						}
						case "spellSchools":
							populateGenericSection("Spell Schools", (brew, metaType, k) => brew[metaType][k].full || k);
							break;
					}
					handleSecChange(i);
				})
			}
		}
	}
}

window.addEventListener("load", () => {
	ManageBrew.initialise();
});
