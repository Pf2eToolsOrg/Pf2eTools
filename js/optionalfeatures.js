"use strict";

function optFeatSort (itemA, itemB, options) {
	if (options.sortBy === "level") {
		const aValue = Number(itemA.values.level) || 0;
		const bValue = Number(itemB.values.level) || 0;
		return SortUtil.ascSort(aValue, bValue) || SortUtil.listSort(itemA, itemB, options);
	}
	return SortUtil.listSort(itemA, itemB, options);
}

function filterFeatureTypeSort (a, b) {
	return SortUtil.ascSort(Parser.optFeatureTypeToFull(a.item), Parser.optFeatureTypeToFull(b.item))
}

class OptionalFeaturesPage extends ListPage {
	constructor () {
		const sourceFilter = getSourceFilter();
		const typeFilter = new Filter({
			header: "Feature Type",
			items: ["AI", "ED", "EI", "MM", "MV:B", "OTH", "FS:F", "FS:B", "FS:P", "FS:R", "PB"],
			displayFn: Parser.optFeatureTypeToFull,
			itemSortFn: filterFeatureTypeSort
		});
		const pactFilter = new Filter({
			header: "Pact Boon",
			items: ["Blade", "Chain", "Tome"],
			displayFn: Parser.prereqPactToFull
		});
		const patronFilter = new Filter({
			header: "Otherworldly Patron",
			items: ["The Archfey", "The Fiend", "The Great Old One", "The Hexblade", "The Kraken", "The Raven Queen", "The Seeker"],
			displayFn: Parser.prereqPatronToShort
		});
		const spellFilter = new Filter({
			header: "Spell",
			items: ["eldritch blast", "hex/curse"],
			displayFn: StrUtil.toTitleCase
		});
		const featureFilter = new Filter({
			header: "Feature",
			displayFn: StrUtil.toTitleCase
		});
		const levelFilter = new Filter({
			header: "Level",
			itemSortFn: SortUtil.ascSortNumericalSuffix,
			nests: []
		});
		const prerequisiteFilter = new MultiFilter({header: "Prerequisite", filters: [pactFilter, patronFilter, spellFilter, levelFilter, featureFilter]});

		super({
			dataSource: "data/optionalfeatures.json",

			filters: [
				sourceFilter,
				typeFilter,
				prerequisiteFilter
			],
			filterSource: sourceFilter,

			listClass: "optfeatures",
			listOptions: {
				fnSort: optFeatSort
			},

			sublistClass: "suboptfeatures",
			sublistOptions: {
				fnSort: optFeatSort
			},

			dataProps: ["optionalfeature"]
		});

		this._sourceFilter = sourceFilter;
		this._typeFilter = typeFilter;
		this._pactFilter = pactFilter;
		this._patronFilter = patronFilter;
		this._spellFilter = spellFilter;
		this._featureFilter = featureFilter;
		this._levelFilter = levelFilter;
	}

	getListItem (it, ivI) {
		it.featureType = it.featureType || "OTH";
		if (it.prerequisite) {
			it._sPrereq = true;
			it._fPrereqPact = it.prerequisite.filter(it => it.type === "prereqPact").map(it => {
				this._pactFilter.addItem(it.entry);
				return it.entry;
			});
			it._fPrereqPatron = it.prerequisite.filter(it => it.type === "prereqPatron").map(it => {
				this._patronFilter.addItem(it.entry);
				return it.entry;
			});
			it._fprereqSpell = it.prerequisite.filter(it => it.type === "prereqSpell").map(it => {
				const mapped = (it.entries || []).map(it => it.split("#")[0]);
				this._spellFilter.addItem(mapped);
				return mapped;
			});
			it._fprereqFeature = it.prerequisite.filter(it => it.type === "prereqFeature").map(it => {
				this._featureFilter.addItem(it.entries);
				return it.entries;
			});
			it._fPrereqLevel = it.prerequisite.filter(it => it.type === "prereqLevel").map(lvl => {
				const item = new FilterItem({
					item: `${lvl.class.name}${lvl.subclass ? ` (${lvl.subclass.name})` : ""} Level ${lvl.level}`,
					nest: lvl.class.name
				});
				this._levelFilter.addNest(lvl.class.name, {isHidden: true});
				this._levelFilter.addItem(item);
				return item;
			});
		}

		if (it.featureType instanceof Array) {
			it._dFeatureType = it.featureType.map(ft => Parser.optFeatureTypeToFull(ft));
			it._lFeatureType = it.featureType.join(", ");
			it.featureType.sort((a, b) => SortUtil.ascSortLower(Parser.optFeatureTypeToFull(a), Parser.optFeatureTypeToFull(b)));
		} else {
			it._dFeatureType = Parser.optFeatureTypeToFull(it.featureType);
			it._lFeatureType = it.featureType;
		}

		// populate filters
		this._sourceFilter.addItem(it.source);
		this._typeFilter.addItem(it.featureType);

		const eleLi = document.createElement("li");
		eleLi.className = "row";

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const prerequisite = Renderer.optionalfeature.getPrerequisiteText(it.prerequisite, true);
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(it.prerequisite);

		eleLi.innerHTML = `<a href="#${hash}">
			<span class="bold col-3-2 pl-0">${it.name}</span>
			<span class="col-1-5 text-center" title="${it._dFeatureType}">${it._lFeatureType}</span>
			<span class="col-4-8 ${prerequisite === "\u2014" ? "text-center" : ""}">${prerequisite}</span>
			<span class="col-1 text-center">${level}</span>
			<span class="col-1-5 ${Parser.sourceJsonToColor(it.source)} text-center pr-0" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			ivI,
			eleLi,
			it.name,
			{
				hash,
				source,
				prerequisite,
				level,
				type: it._lFeatureType,
				uniqueid: it.uniqueId ? it.uniqueId : ivI
			}
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => {
			const it = this._dataList[item.ix];
			return this._filterBox.toDisplay(
				f,
				it.source,
				it.featureType,
				[
					it._fPrereqPact,
					it._fPrereqPatron,
					it._fprereqSpell,
					it._fPrereqLevel,
					it._fprereqFeature
				]
			);
		});
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);
		const prerequisite = Renderer.optionalfeature.getPrerequisiteText(it.prerequisite, true);
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(it.prerequisite);

		const $ele = $(`<li class="row">
			<a href="#${hash}">
				<span class="bold col-4 pl-0">${it.name}</span>
				<span class="col-2 text-center" title="${it._dFeatureType}">${it._lFeatureType}</span>
				<span class="col-4-5 ${prerequisite === "\u2014" ? "text-center" : ""}">${prerequisite}</span>
				<span class="col-1-5 pr-0">${level}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it._lFeatureType,
				prerequisite,
				level
			}
		);
		return listItem;
	}

	doLoadHash (id) {
		const it = this._dataList[id];

		const $wrpTab = $(`#stat-tabs`);
		$wrpTab.find(`.opt-feature-type`).remove();
		const $wrpOptFeatType = $(`<div class="opt-feature-type"/>`).prependTo($wrpTab);
		if (it.featureType instanceof Array) {
			const commonPrefix = MiscUtil.findCommonPrefix(it.featureType.map(fs => Parser.optFeatureTypeToFull(fs)));
			if (commonPrefix) $wrpOptFeatType.append(`${commonPrefix.trim()} `);
			it.featureType.forEach((ft, i) => {
				if (i > 0) $wrpOptFeatType.append("/");
				$(`<span class="roller">${Parser.optFeatureTypeToFull(ft).substring(commonPrefix.length)}</span>`)
					.click(() => {
						filterBox.setFromValues({"Feature Type": {[ft]: 1}});
						handleFilterChange();
					})
					.appendTo($wrpOptFeatType);
			});
		} else {
			$(`<span class="roller">${Parser.optFeatureTypeToFull(it.featureType)}</span>`)
				.click(() => {
					filterBox.setFromValues({"Feature Type": {[it.featureType]: 1}});
					handleFilterChange();
				})
				.appendTo($wrpOptFeatType);
		}

		$(`#pagecontent`).empty().append(RenderOptionalFeatures.$getRenderedOptionalFeature(it));

		ListUtil.updateSelected();
	}

	doLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		ListUtil.setFromSubHashes(sub);
	}
}

const optionalFeaturesPage = new OptionalFeaturesPage();
window.addEventListener("load", () => optionalFeaturesPage.pOnLoad());
