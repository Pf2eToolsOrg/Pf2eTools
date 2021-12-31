"use strict";

class PageFilterOptionalFeatures extends PageFilter {
	constructor () {
		super();
		this._typeFilter = new Filter({header: "Feature Type"});
		this._levelFilter = new Filter({
			header: "Level",
			itemSortFn: SortUtil.ascSortNumericalSuffix,
			nests: [],
		});
		this._prerequisiteFilter = new MultiFilter({
			header: "Prerequisite",
			filters: [
				this._levelFilter,
			],
		});
	}

	mutateForFilters (it) {
		it._fSources = SourceFilter.getCompleteFilterSources(it);
		if (it.prerequisite) {
			it._sPrereq = true;
			it._fPrereqLevel = it.prerequisite.filter(it => it.level).map(it => {
				const lvlMeta = it.level;

				let item;
				let className;
				if (typeof lvlMeta === "number") {
					className = `(No Class)`;
					item = new FilterItem({
						item: `Level ${lvlMeta}`,
						nest: className,
					});
				} else {
					className = lvlMeta.class ? lvlMeta.class.name : `(No Class)`;
					item = new FilterItem({
						item: `${lvlMeta.class ? className : ""}${lvlMeta.subclass ? ` (${lvlMeta.subclass.name})` : ""} Level ${lvlMeta.level}`,
						nest: className,
					});
				}

				return item;
			});
		}
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it.type);
		(it._fPrereqLevel || []).forEach(it => {
			this._levelFilter.addNest(it.nest, {isHidden: true});
			this._levelFilter.addItem(it);
		});
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._prerequisiteFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.type,
			[
				it._fPrereqLevel,
			],
		)
	}
}
