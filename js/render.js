// ************************************************************************* //
// Strict mode should not be used, as the roll20 script depends on this file //
// ************************************************************************* //

// ENTRY RENDERING =====================================================================================================
/*
 * // EXAMPLE USAGE //
 *
 * const entryRenderer = new Renderer();
 *
 * const topLevelEntry = mydata[0];
 * // prepare an array to hold the string we collect while recursing
 * const textStack = [];
 *
 * // recurse through the entry tree
 * entryRenderer.renderEntries(topLevelEntry, textStack);
 *
 * // render the final product by joining together all the collected strings
 * $("#myElement").html(toDisplay.join(""));
 */
function Renderer () {
	this.wrapperTag = "div";
	this.baseUrl = "";
	this.baseMediaUrls = {};

	this._lazyImages = false;
	this._subVariant = false;
	this._firstSection = true;
	this._isAddHandlers = true;
	this._headerIndex = 1;
	this._tagExportDict = null;
	this._trackTitles = {enabled: false, titles: {}};
	this._enumerateTitlesRel = {enabled: false, titles: {}};
	this._hooks = {};
	this._fnPostProcess = null;
	this._extraSourceClasses = null;
	this._depthTracker = null;
	this._depthTrackerAdditionalProps = [];
	this._lastDepthTrackerSource = null;
	this._isInternalLinksDisabled = false;
	this._fnsGetStyleClasses = {};

	/**
	 * Enables/disables lazy-load image rendering.
	 * @param bool true to enable, false to disable.
	 */
	this.setLazyImages = function (bool) {
		// hard-disable lazy loading if the Intersection API is unavailable (e.g. under iOS 12)
		if (typeof IntersectionObserver === "undefined") this._lazyImages = false;
		else this._lazyImages = !!bool;
		return this;
	};

	/**
	 * Set the tag used to group rendered elements
	 * @param tag to use
	 */
	this.setWrapperTag = function (tag) {
		this.wrapperTag = tag;
		return this;
	};

	/**
	 * Set the base url for rendered links.
	 * Usage: `renderer.setBaseUrl("https://www.example.com/")` (note the "http" prefix and "/" suffix)
	 * @param url to use
	 */
	this.setBaseUrl = function (url) {
		this.baseUrl = url;
		return this;
	};

	this.setBaseMediaUrl = function (mediaDir, url) {
		this.baseMediaUrls[mediaDir] = url;
		return this;
	}

	/**
	 * Other sections should be prefixed with a vertical divider
	 * @param bool
	 */
	this.setFirstSection = function (bool) {
		this._firstSection = bool;
		return this;
	};

	/**
	 * Disable adding JS event handlers on elements.
	 * @param bool
	 */
	this.setAddHandlers = function (bool) {
		this._isAddHandlers = bool;
		return this;
	};

	/**
	 * Add a post-processing function which acts on the final rendered strings from a root call.
	 * @param fn
	 */
	this.setFnPostProcess = function (fn) {
		this._fnPostProcess = fn;
		return this;
	};

	/**
	 * Specify a list of extra classes to be added to those rendered on entries with sources.
	 * @param arr
	 */
	this.setExtraSourceClasses = function (arr) {
		this._extraSourceClasses = arr;
		return this;
	};

	/**
	 * Headers are ID'd using the attribute `data-title-index` using an incrementing int. This resets it to 1.
	 */
	this.resetHeaderIndex = function () {
		this._headerIndex = 1;
		this._trackTitles.titles = {};
		this._enumerateTitlesRel.titles = {};
		return this;
	};

	/**
	 * Pass an object to have the renderer export lists of found @-tagged content during renders
	 *
	 * @param toObj the object to fill with exported data. Example results:
	 * 			{
	 *				commoner_mm: {page: "bestiary.html", source: "MM", hash: "commoner_mm"},
	 *				storm%20giant_mm: {page: "bestiary.html", source: "MM", hash: "storm%20giant_mm"},
	 *				detect%20magic_phb: {page: "spells.html", source: "PHB", hash: "detect%20magic_phb"}
	 *			}
	 * 			These results intentionally match those used for hover windows, so can use the same cache/loading paths
	 */
	this.doExportTags = function (toObj) {
		this._tagExportDict = toObj;
		return this;
	};

	/**
	 * Reset/disable tag export
	 */
	this.resetExportTags = function () {
		this._tagExportDict = null;
		return this;
	};

	/** Used by Foundry config. */
	this.setInternalLinksDisabled = function (bool) {
		this._isInternalLinksDisabled = bool;
		return this;
	};

	this.isInternalLinksDisabled = function () {
		return !!this._isInternalLinksDisabled;
	};

	/** Bind function which apply exta CSS classes to entry/list renders.  */
	this.setFnGetStyleClasses = function (identifier, fn) {
		this._fnsGetStyleClasses[identifier] = fn;
		return this;
	};

	/**
	 * If enabled, titles with the same name will be given numerical identifiers.
	 * This identifier is stored in `data-title-relative-index`
	 */
	this.setEnumerateTitlesRel = function (bool) {
		this._enumerateTitlesRel.enabled = bool;
		return this;
	};

	this._getEnumeratedTitleRel = function (name) {
		if (this._enumerateTitlesRel.enabled && name) {
			const clean = name.toLowerCase();
			this._enumerateTitlesRel.titles[clean] = this._enumerateTitlesRel.titles[clean] || 0;
			return `data-title-relative-index="${this._enumerateTitlesRel.titles[clean]++}"`;
		} else return "";
	};

	this.setTrackTitles = function (bool) {
		this._trackTitles.enabled = bool;
		return this;
	};

	this.getTrackedTitles = function () {
		return MiscUtil.copy(this._trackTitles.titles);
	};

	this._handleTrackTitles = function (name) {
		if (this._trackTitles.enabled) {
			this._trackTitles.titles[this._headerIndex] = name;
		}
	};

	this._handleTrackDepth = function (entry, depth) {
		if (entry.name && this._depthTracker) {
			this._lastDepthTrackerSource = entry.source || this._lastDepthTrackerSource;
			const additionalData = this._depthTrackerAdditionalProps.length
				? this._depthTrackerAdditionalProps.mergeMap(it => ({[it]: entry[it]}))
				: {};
			this._depthTracker.push({
				...additionalData,
				depth,
				name: entry.name,
				type: entry.type,
				ixHeader: this._headerIndex,
				source: this._lastDepthTrackerSource,
				data: entry.data,
				page: entry.page,
				alias: entry.alias,
				entry,
			});
		}
	};

	this.addHook = function (entryType, hookType, fnHook) {
		((this._hooks[entryType] = this._hooks[entryType] || {})[hookType] =
			this._hooks[entryType][hookType] || []).push(fnHook);
	};

	this.removeHook = function (entryType, hookType, fnHook) {
		const ix = ((this._hooks[entryType] = this._hooks[entryType] || {})[hookType] =
			this._hooks[entryType][hookType] || []).indexOf(fnHook);
		if (~ix) this._hooks[entryType][hookType].splice(ix, 1);
	};

	this._getHooks = function (entryType, hookType) {
		return (this._hooks[entryType] || {})[hookType] || [];
	};

	/**
	 * Specify an array where the renderer will record rendered header depths.
	 * Items added to the array are of the form: `{name: "Header Name", depth: 1, type: "entries", source: "PHB"}`
	 */
	this.setDepthTracker = function (arr, ...additionalProps) {
		this._depthTracker = arr;
		this._depthTrackerAdditionalProps = additionalProps || [];
		return this;
	};

	/**
	 * Recursively walk down a tree of "entry" JSON items, adding to a stack of strings to be finally rendered to the
	 * page. Note that this function does _not_ actually do the rendering, see the example code above for how to display
	 * the result.
	 *
	 * @param entry An "entry" usually defined in JSON. A schema is available in tests/schema
	 * @param textStack A reference to an array, which will hold all our strings as we recurse
	 * @param meta Meta state.
	 * @param meta.depth The current recursion depth. Optional; default 0, or -1 for type "section" entries.
	 * @param options Render options.
	 * @param options.prefix String to prefix rendered lines with.
	 */
	this.recursiveRender = function (entry, textStack, meta, options) {
		if (entry instanceof Array) {
			entry.forEach(nxt => this.recursiveRender(nxt, textStack, meta, options));
			return;
		}

		// respect the API of the original, but set up for using string concatenations
		if (textStack.length === 0) textStack[0] = "";
		else textStack.reverse();

		// initialise meta
		meta = meta || {};
		meta._typeStack = [];
		meta.depth = meta.depth == null ? 0 : meta.depth;

		this._recursiveRender(entry, textStack, meta, options);
		if (this._fnPostProcess) textStack[0] = this._fnPostProcess(textStack[0]);
		textStack.reverse();
	};

	/**
	 * Inner rendering code. Uses string concatenation instead of an array stack, for ~2x the speed.
	 * @param entry As above.
	 * @param textStack As above.
	 * @param meta As above, with the addition of...
	 * @param options
	 *          .prefix The (optional) prefix to be added to the textStack before whatever is added by the current call
	 *          .suffix The (optional) suffix to be added to the textStack after whatever is added by the current call
	 * @private
	 */
	this._recursiveRender = function (entry, textStack, meta, options) {
		if (entry == null) return; // Avoid dying on nully entries
		if (!textStack) throw new Error("Missing stack!");
		if (!meta) throw new Error("Missing metadata!");
		if (entry.type === "section") meta.depth = -1;

		options = options || {};
		if (options.pf2StatFix && !options.prefix && !options.suffix) {
			options.prefix = "<p class=\"pf2-stat__text\">"
			options.suffix = "</p>"
		}

		meta._didRenderPrefix = false;
		meta._didRenderSuffix = false;

		if (typeof entry === "object") {
			// the root entry (e.g. "Rage" in barbarian "classFeatures") is assumed to be of type "entries"
			const type = entry.type == null || entry.type === "section" ? "entries" : entry.type;

			meta._typeStack.push(type);

			switch (type) {
				// pf2
				case "pf2-h1":
					this._renderPf2H1(entry, textStack, meta, options);
					break;
				case "pf2-h1-flavor":
					this._renderPf2H1Flavor(entry, textStack, meta, options);
					break;
				case "pf2-h2":
					this._renderPf2H2(entry, textStack, meta, options);
					break;
				case "pf2-h3":
					this._renderPf2H3(entry, textStack, meta, options);
					break;
				case "pf2-h4":
					this._renderPf2H4(entry, textStack, meta, options);
					break;
				case "pf2-h5":
					this._renderPf2H5(entry, textStack, meta, options);
					break;
				case "pf2-sidebar":
					this._renderPf2Sidebar(entry, textStack, meta, options);
					break;
				case "pf2-inset":
					this._renderPf2Inset(entry, textStack, meta, options);
					break;
				case "pf2-tips-box":
					this._renderPf2TipsBox(entry, textStack, meta, options);
					break;
				case "pf2-sample-box":
					this._renderPf2SampleBox(entry, textStack, meta, options);
					break;
				case "pf2-red-box":
					this._renderPf2RedBox(entry, textStack, meta, options);
					break;
				case "pf2-brown-box":
					this._renderPf2BrownBox(entry, textStack, meta, options);
					break;
				case "pf2-key-ability":
					this._renderPf2KeyAbility(entry, textStack, meta, options);
					break;
				case "pf2-title":
					this._renderPf2Title(entry, textStack, meta, options);
					break;
				case "pf2-options":
					this._renderPf2Options(entry, textStack, meta, options);
					break;
				// recursive
				case "entries":
					this._renderEntries(entry, textStack, meta, options);
					break;
				case "options":
					this._renderOptions(entry, textStack, meta, options);
					break;
				case "list":
					this._renderList(entry, textStack, meta, options);
					break;
				case "table":
					this._renderTable(entry, textStack, meta, options);
					break;
				case "table-legacy":
					this._renderTableLegacy(entry, textStack, meta, options);
					break;
				case "tableGroup":
					this._renderTableGroup(entry, textStack, meta, options);
					break;
				case "inset":
					this._renderInset(entry, textStack, meta, options);
					break;
				case "insetReadaloud":
					this._renderInsetReadaloud(entry, textStack, meta, options);
					break;
				case "variant":
					this._renderVariant(entry, textStack, meta, options);
					break;
				case "variantSub":
					this._renderVariantSub(entry, textStack, meta, options);
					break;
				case "spellcasting":
					this._renderSpellcasting(entry, textStack, meta, options);
					break;
				case "quote":
					this._renderQuote(entry, textStack, meta, options);
					break;
				case "optfeature":
					this._renderOptfeature(entry, textStack, meta, options);
					break;
				case "patron":
					this._renderPatron(entry, textStack, meta, options);
					break;

				// pf2-statblock
				case "affliction":
					this._renderAffliction(entry, textStack, meta, options);
					break;
				case "success_degree":
					this._renderSuccessDegree(entry, textStack, meta, options);
					break;
				case "leveled_effect":
					this._renderLeveledEffect(entry, textStack, meta, options);
					break;
				case "ability":
					this._renderAbility(entry, textStack, meta, options);
					break;
				case "attack":
					this._renderAttack(entry, textStack, meta, options);
					break;
				case "activation":
				case "activate":
					this._renderActivation(entry, textStack, meta, options);
					break;
				// block
				case "abilityDc":
					this._renderAbilityDc(entry, textStack, meta, options);
					break;
				case "abilityAttackMod":
					this._renderAbilityAttackMod(entry, textStack, meta, options);
					break;
				case "abilityGeneric":
					this._renderAbilityGeneric(entry, textStack, meta, options);
					break;

				// inline
				case "inline":
					this._renderInline(entry, textStack, meta, options);
					break;
				case "inlineBlock":
					this._renderInlineBlock(entry, textStack, meta, options);
					break;
				case "bonus":
					this._renderBonus(entry, textStack, meta, options);
					break;
				case "bonusSpeed":
					this._renderBonusSpeed(entry, textStack, meta, options);
					break;
				case "dice":
					this._renderDice(entry, textStack, meta, options);
					break;
				case "link":
					this._renderLink(entry, textStack, meta, options);
					break;
				case "actions":
					this._renderActions(entry, textStack, meta, options);
					break;

				// list items
				case "item":
					this._renderItem(entry, textStack, meta, options);
					break;
				case "itemSub":
					this._renderItemSub(entry, textStack, meta, options);
					break;
				case "itemSpell":
					this._renderItemSpell(entry, textStack, meta, options);
					break;

				// entire data records
				case "dataCreature":
					this._renderDataCreature(entry, textStack, meta, options);
					break;
				case "dataSpell":
					this._renderDataSpell(entry, textStack, meta, options);
					break;
				case "dataTrapHazard":
					this._renderDataTrapHazard(entry, textStack, meta, options);
					break;
				case "dataObject":
					this._renderDataObject(entry, textStack, meta, options);
					break;
				case "dataItem":
					this._renderDataItem(entry, textStack, meta, options);
					break;

				// images
				case "image":
					this._renderImage(entry, textStack, meta, options);
					break;
				case "gallery":
					this._renderGallery(entry, textStack, meta, options);
					break;

				// flowchart
				case "flowchart":
					this._renderFlowchart(entry, textStack, meta, options);
					break;
				case "flowBlock":
					this._renderFlowBlock(entry, textStack, meta, options);
					break;

				// homebrew changes
				case "homebrew":
					this._renderHomebrew(entry, textStack, meta, options);
					break;

				// misc
				case "code":
					this._renderCode(entry, textStack, meta, options);
					break;
				case "hr":
					this._renderHr(entry, textStack, meta, options);
					break;
			}

			meta._typeStack.pop();
		} else if (typeof entry === "string") { // block
			this._renderPrefix(entry, textStack, meta, options);
			this._renderString(entry, textStack, meta, options);
			this._renderSuffix(entry, textStack, meta, options);
		} else { // block
			// for ints or any other types which do not require specific rendering
			this._renderPrefix(entry, textStack, meta, options);
			this._renderPrimitive(entry, textStack, meta, options);
			this._renderSuffix(entry, textStack, meta, options);
		}
	};

	this._adjustDepth = function (meta, dDepth) {
		const cachedDepth = meta.depth;
		meta.depth += dDepth;
		meta.depth = Math.min(Math.max(-1, meta.depth), 2); // cap depth between -1 and 2 for general use
		return cachedDepth;
	};

	this._renderPrefix = function (entry, textStack, meta, options) {
		if (meta._didRenderPrefix) return;
		if (options.prefix != null) {
			textStack[0] += options.prefix;
			meta._didRenderPrefix = true;
		}
	};

	this._renderSuffix = function (entry, textStack, meta, options) {
		if (meta._didRenderSuffix) return;
		if (options.suffix != null) {
			textStack[0] += options.suffix;
			meta._didRenderSuffix = true;
		}
	};

	this._renderImage = function (entry, textStack, meta, options) {
		function getStylePart () {
			return entry.maxWidth ? `style="max-width: ${entry.maxWidth}px"` : "";
		}

		if (entry.imageType === "map") textStack[0] += `<div class="rd__wrp-map">`;
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class="float-clear"></div>`;
		textStack[0] += `<div class="${meta._typeStack.includes("gallery") ? "rd__wrp-gallery-image" : ""}">`;

		const href = this._renderImage_getUrl(entry);
		const svg = this._lazyImages && entry.width != null && entry.height != null
			? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${entry.width}" height="${entry.height}"><rect width="100%" height="100%" fill="#ccc3"></rect></svg>`)}`
			: null;
		textStack[0] += `<div class="${this._renderImage_getWrapperClasses(entry, meta)}">
			<a href="${href}" target="_blank" rel="noopener noreferrer" ${entry.title ? `title="${Renderer.stripTags(entry.title)}"` : ""}>
				<img class="${this._renderImage_getImageClasses(entry, meta)}" src="${svg || href}" ${entry.altText ? `alt="${entry.altText}"` : ""} ${svg ? `data-src="${href}"` : ""} ${getStylePart()}>
			</a>
		</div>`;
		if (entry.title || entry.mapRegions) {
			textStack[0] += `<div class="rd__image-title">
				${entry.title ? `<div class="rd__image-title-inner ${entry.title && entry.mapRegions ? "mr-2" : ""}">${this.render(entry.title)}</div>` : ""}
				${entry.mapRegions ? `<button class="btn btn-xs btn-default rd__image-btn-viewer" onclick="RenderMap.pShowViewer(event, this)" data-rd-packed-map="${this._renderImage_getMapRegionData(entry)}"><span class="glyphicon glyphicon-picture"></span> Dynamic Viewer</button>` : ""}
			</div>`;
		} else if (entry._galleryTitlePad) textStack[0] += `<div class="rd__image-title">&nbsp;</div>`;

		textStack[0] += `</div>`;
		this._renderSuffix(entry, textStack, meta, options);
		if (entry.imageType === "map") textStack[0] += `</div>`;
	};

	this._renderImage_getMapRegionData = function (entry) {
		return JSON.stringify(this.getMapRegionData(entry)).escapeQuotes();
	};

	this.getMapRegionData = function (entry) {
		return {
			regions: entry.mapRegions,
			width: entry.width,
			height: entry.height,
			href: this._renderImage_getUrl(entry),
			hrefThumbnail: this._renderImage_getUrlThumbnail(entry),
		};
	};

	this._renderImage_getWrapperClasses = function (entry) {
		const out = ["rd__wrp-image", "relative"];
		if (entry.style) {
			switch (entry.style) {
				case "comic-speaker-left":
					out.push("rd__comic-img-speaker", "rd__comic-img-speaker--left");
					break;
				case "comic-speaker-right":
					out.push("rd__comic-img-speaker", "rd__comic-img-speaker--right");
					break;
			}
		}
		return out.join(" ");
	};

	this._renderImage_getImageClasses = function (entry) {
		const out = ["rd__image"];
		if (entry.style) {
			switch (entry.style) {
				case "deity-symbol":
					out.push("rd__img-small");
					break;
			}
		}
		return out.join(" ");
	};

	this._renderImage_getUrl = function (entry) {
		return Renderer.utils.getMediaUrl(entry, "href", "img");
	};
	this._renderImage_getUrlThumbnail = function (entry) {
		return Renderer.utils.getMediaUrl(entry, "hrefThumbnail", "img");
	};

	this._renderList_getListCssClasses = function (entry, textStack, meta, options) {
		const out = [`rd__list`];
		if (entry.style || entry.columns) {
			if (entry.style) out.push(...entry.style.split(" ").map(it => `rd__${it}`));
			if (entry.columns) out.push(`columns-${entry.columns}`);
		}
		return out.join(" ");
	};

	this._renderTableGroup = function (entry, textStack, meta, options) {
		const len = entry.tables.length;
		for (let i = 0; i < len; ++i) this._recursiveRender(entry.tables[i], textStack, meta);
	};

	this._renderTableLegacy = function (entry, textStack, meta, options) {
		// TODO add handling for rowLabel property
		if (entry.intro) {
			const len = entry.intro.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.intro[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
		}

		textStack[0] += `<table class="${entry.style || ""} ${entry.isStriped === false ? "" : "stripe-odd-table"}">`;

		const autoRollMode = Renderer.getTableRollMode(entry);
		const toRenderLabel = autoRollMode ? RollerUtil.getFullRollCol(entry.colLabels[0]) : null;
		const isInfiniteResults = autoRollMode === RollerUtil.ROLL_COL_VARIABLE;

		// caption
		if (entry.caption != null) textStack[0] += `<caption>${entry.caption}</caption>`;

		// body -- temporarily build this to own string; append after headers
		const rollCols = [];
		let bodyStack = [""];
		bodyStack[0] += "<tbody>";
		const lenRows = entry.rows.length;
		for (let ixRow = 0; ixRow < lenRows; ++ixRow) {
			bodyStack[0] += "<tr>";
			const r = entry.rows[ixRow];
			let roRender = r.type === "row" ? r.row : r;

			const len = roRender.length;
			for (let ixCell = 0; ixCell < len; ++ixCell) {
				rollCols[ixCell] = rollCols[ixCell] || false;

				// preconvert rollables
				if (autoRollMode && ixCell === 0) {
					roRender = Renderer.getRollableRow(
						roRender,
						{
							isForceInfiniteResults: isInfiniteResults,
							isFirstRow: ixRow === 0,
							isLastRow: ixRow === lenRows - 1,
						},
					);
					rollCols[ixCell] = true;
				}

				let toRenderCell;
				if (roRender[ixCell].type === "cell") {
					if (roRender[ixCell].roll) {
						rollCols[ixCell] = true;
						if (roRender[ixCell].entry) {
							toRenderCell = roRender[ixCell].entry;
						} else if (roRender[ixCell].roll.exact != null) {
							toRenderCell = roRender[ixCell].roll.pad ? StrUtil.padNumber(roRender[ixCell].roll.exact, 2, "0") : roRender[ixCell].roll.exact;
						} else {
							// TODO(Future) render "negative infinite" minimum nicely (or based on an example from a book, if one ever occurs)
							//   "Selling a Magic Item" from DMG p129 almost meets this, but it has its own display

							const dispMin = roRender[ixCell].roll.displayMin != null ? roRender[ixCell].roll.displayMin : roRender[ixCell].roll.min;
							const dispMax = roRender[ixCell].roll.displayMax != null ? roRender[ixCell].roll.displayMax : roRender[ixCell].roll.max;

							if (dispMax === Renderer.dice.POS_INFINITE) {
								toRenderCell = roRender[ixCell].roll.pad
									? `${StrUtil.padNumber(dispMin, 2, "0")}+`
									: `${dispMin}+`;
							} else {
								toRenderCell = roRender[ixCell].roll.pad
									? `${StrUtil.padNumber(dispMin, 2, "0")}-${StrUtil.padNumber(dispMax, 2, "0")}`
									: `${dispMin}-${dispMax}`;
							}
						}
					} else if (roRender[ixCell].entry) {
						toRenderCell = roRender[ixCell].entry;
					}
				} else {
					toRenderCell = roRender[ixCell];
				}
				bodyStack[0] += `<td ${this._renderTable_makeTableTdClassText(entry, ixCell)} ${this._renderTable_getCellDataStr(roRender[ixCell])} ${roRender[ixCell].width ? `colspan="${roRender[ixCell].width}"` : ""}>`;
				if (r.style === "row-indent-first" && ixCell === 0) bodyStack[0] += `<div class="rd__tab-indent"></div>`;
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(toRenderCell, bodyStack, meta);
				meta.depth = cacheDepth;
				bodyStack[0] += "</td>";
			}
			bodyStack[0] += "</tr>";
		}
		bodyStack[0] += "</tbody>";

		// header
		textStack[0] += "<thead>";
		textStack[0] += "<tr>";
		if (entry.colLabels) {
			const len = entry.colLabels.length;
			for (let i = 0; i < len; ++i) {
				const lbl = entry.colLabels[i];
				textStack[0] += `<th ${this._renderTable_getTableThClassText(entry, i)} data-rd-isroller="${rollCols[i]}" ${entry.isNameGenerator ? `data-rd-namegeneratorrolls="${(entry.colLabels || []).length - 1}"` : ""}>`;
				this._recursiveRender(autoRollMode && i === 0 ? RollerUtil.getFullRollCol(lbl) : lbl, textStack, meta);
				textStack[0] += `</th>`;
			}
		}
		textStack[0] += "</tr>";
		textStack[0] += "</thead>";

		textStack[0] += bodyStack[0];

		// footer
		if (entry.footnotes != null) {
			textStack[0] += "<tfoot>";
			const len = entry.footnotes.length;
			for (let i = 0; i < len; ++i) {
				textStack[0] += `<tr><td colspan="99">`;
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(entry.footnotes[i], textStack, meta);
				meta.depth = cacheDepth;
				textStack[0] += "</td></tr>";
			}
			textStack[0] += "</tfoot>";
		}
		textStack[0] += "</table>";

		if (entry.outro) {
			const len = entry.outro.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.outro[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
		}
	};

	this._renderTable = function (entry, textStack, meta, options) {
		// TODO: implement rollable tables
		const numCol = Math.max(...entry.rows.map(x => x.type === "multiRow" ? x.rows.map(y => y.length) : x.length).flat());
		const gridTemplate = entry.colSizes ? entry.colSizes.map(x => `${String(x)}fr`).join(" ") : "1fr ".repeat(numCol)
		textStack[0] += `<div class="${entry.style || "pf2-table"}${this._firstSection ? " mt-0" : ""}" style="grid-template-columns: ${gridTemplate}">`
		if (entry.style && entry.style.includes("pf2-box__table--red")) {
			if (entry.colStyles == null) entry.colStyles = Array(numCol).fill("");
			entry.colStyles[0] += " no-border-left";
			entry.colStyles[numCol - 1] += " no-border-right";
		}

		if (entry.name) {
			if (entry.id) {
				textStack[0] += `<div class="pf2-table__caption">TABLE ${entry.id}: ${entry.name}</div>`
			} else {
				textStack[0] += `<div class="pf2-table__name">${entry.name}</div>`
			}
		}
		if (entry.intro) {
			const len = entry.intro.length;
			for (let i = 0; i < len; ++i) {
				let styles = `${entry.introStyles ? entry.introStyles[i] || "" : ""}`
				this._recursiveRender(entry.intro[i], textStack, meta, {
					prefix: `<div class="pf2-table__intro ${styles}">`,
					suffix: "</div>",
				});
			}
		}

		const lenRows = entry.rows.length;
		const labelRowIdx = entry.labelRowIdx ? entry.labelRowIdx : [0];
		let rowParity = 0;
		let idxSpan = 0;

		const renderRow = function (renderer, row, idxRow) {
			const lenCol = row.length;
			if (row.type === "multiRow") {
				row.rows.forEach(r => {
					renderRow(renderer, r, idxRow);
					rowParity = (rowParity + 1) % 2;
				});
				rowParity = (rowParity + 1) % 2;
			} else if (lenCol === numCol) {
				for (let idxCol = 0; idxCol < lenCol; ++idxCol) {
					let styles = renderer._renderTable_getStyles(entry, idxRow, idxCol, false, rowParity);
					textStack[0] += `<div class="${styles}">`;
					renderer._recursiveRender(row[idxCol], textStack, meta);
					textStack[0] += `</div>`;
				}
				if (labelRowIdx.includes(idxRow)) {
					rowParity = 0;
				} else {
					rowParity = (rowParity + 1) % 2;
				}
			} else {
				let last_end = 1;
				for (let idxCol = 0; idxCol < lenCol; ++idxCol) {
					let styles = renderer._renderTable_getStyles(entry, idxRow, idxCol, true, rowParity);
					let span = entry.spans[idxSpan][idxCol];
					if (last_end !== span[0]) {
						textStack[0] += `<div class="${styles}" style="grid-column:${last_end}/${span[0]}"></div>`;
					}
					textStack[0] += `<div class="${styles}" style="grid-column:${span[0]}/${span[1]}">${row[idxCol]}</div>`;
					last_end = span[1];
				}
				if (labelRowIdx.includes(idxRow)) {
					rowParity = 0;
				} else {
					rowParity = (rowParity + 1) % 2;
				}
				if (last_end !== numCol + 1) {
					let styles = renderer._renderTable_getStyles(entry, idxRow, numCol, true, rowParity);
					textStack[0] += `<div class="${styles}" style="grid-column:${last_end}/${lenCol}"></div>`;
				}
				idxSpan += 1;
			}
		};

		for (let idxRow = 0; idxRow < lenRows; ++idxRow) {
			const row = entry.rows[idxRow];
			renderRow(this, row, idxRow);
		}

		if (entry.footnotes != null) {
			const len = entry.footnotes.length;
			for (let i = 0; i < len; ++i) {
				let styles = `${entry.footStyles ? entry.footStyles[i] || "" : ""}`
				this._recursiveRender(entry.footnotes[i], textStack, meta, {
					prefix: `<div class="pf2-table__footnote ${styles}">`,
					suffix: "</div>",
				});
			}
		}
		if (entry.outro) {
			const len = entry.outro.length;
			for (let i = 0; i < len; ++i) {
				let styles = `${entry.outroStyles ? entry.outroStyles[i] || "" : ""}`
				this._recursiveRender(entry.outro[i], textStack, meta, {
					prefix: `<div class="pf2-table__outro ${styles}">`,
					suffix: "</div>",
				});
			}
		}

		textStack[0] += `</div>`
	};

	this._renderTable_getStyles = function (entry, rowIdx, colIdx, noColStyle, rowParity) {
		const labelRowIdx = entry.labelRowIdx ? entry.labelRowIdx : [0];
		const labelColIdx = entry.labelColIdx ? entry.labelColIdx : [];
		let row_styles = ""
		let col_styles = ""
		let cell_styles = ""
		let type_styles = ""
		if (entry.rowStyles && typeof (entry.rowStyles[0]) === "string") {
			row_styles = `${entry.rowStyles ? entry.rowStyles[rowIdx] || "" : ""}`;
		} else if (entry.rowStyles) {
			for (let rs of entry.rowStyles) {
				if (rs.row === rowIdx) {
					row_styles = rs.style;
					break;
				}
			}
		}
		if (!noColStyle && entry.colStyles && typeof (entry.colStyles[0]) === "string") {
			col_styles = `${entry.colStyles ? entry.colStyles[colIdx] || "" : ""}`;
		} else if (!noColStyle && entry.colStyles) {
			for (let cs of entry.colStyles) {
				if (cs.col === rowIdx) {
					col_styles = cs.style;
					break;
				}
			}
		}
		if (entry.cellStyles) {
			for (let cs of entry.cellStyles) {
				if (cs.row === rowIdx && cs.col === colIdx) {
					cell_styles = cs.style;
					break;
				}
			}
		}

		if (labelRowIdx.includes(rowIdx)) {
			type_styles = "pf2-table__label"
		} else if (!noColStyle && labelColIdx.includes(colIdx)) {
			type_styles = "pf2-table__label"
		} else {
			type_styles = `pf2-table__entry ${rowParity ? "odd" : ""}`
		}

		return `${row_styles} ${col_styles} ${cell_styles} ${type_styles}`
	};

	this._renderTable_getCellDataStr = function (ent) {
		function convertZeros (num) {
			if (num === 0) return 100;
			return num;
		}

		if (ent.roll) {
			return `data-roll-min="${convertZeros(ent.roll.exact != null ? ent.roll.exact : ent.roll.min)}" data-roll-max="${convertZeros(ent.roll.exact != null ? ent.roll.exact : ent.roll.max)}"`
		}

		return "";
	};

	this._renderTable_getTableThClassText = function (entry, i) {
		return entry.colStyles == null || i >= entry.colStyles.length ? "" : `class="${entry.colStyles[i]}"`;
	};

	this._renderTable_makeTableTdClassText = function (entry, i) {
		if (entry.rowStyles != null) return i >= entry.rowStyles.length ? "" : `class="${entry.rowStyles[i]}"`;
		else return this._renderTable_getTableThClassText(entry, i);
	};

	this._renderEntries = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, true);
	};

	this._getPagePart = function (entry, isInset) {
		if (!Renderer.utils.isDisplayPage(entry.page)) return "";
		return ` <span class="rd__title-link ${isInset ? `rd__title-link--inset` : ""}">${entry.source ? `<span class="help--subtle" title="${Parser.sourceJsonToFull(entry.source)}">${Parser.sourceJsonToAbv(entry.source)}</span> ` : ""}p${entry.page}</span>`;
	};

	this._inlineHeaderTerminators = new Set([".", ",", "!", "?", ";", ":"]);
	this._renderEntriesSubtypes = function (entry, textStack, meta, options, incDepth) {
		const isInlineTitle = meta.depth >= 2;
		const isAddPeriod = isInlineTitle && entry.name && !this._inlineHeaderTerminators.has(entry.name[entry.name.length - 1]);
		const pagePart = !isInlineTitle ? this._getPagePart(entry) : "";
		const nextDepth = incDepth && meta.depth < 2 ? meta.depth + 1 : meta.depth;
		const styleString = this._renderEntriesSubtypes_getStyleString(entry, meta, isInlineTitle);
		const dataString = this._getDataString(entry);
		if (entry.name != null) this._handleTrackTitles(entry.name);

		const headerClass = `rd__h--${meta.depth + 1}`; // adjust as the CSS is 0..4 rather than -1..3

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		const headerSpan = entry.name ? `<span class="rd__h ${headerClass}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}> <span class="entry-title-inner"${!pagePart && entry.source ? ` title="Source: ${Parser.sourceJsonToFull(entry.source)}${entry.page ? `, p${entry.page}` : ""}"` : ""}>${this.render({
			type: "inline",
			entries: [entry.name],
		})}${isAddPeriod ? "." : ""}</span>${pagePart}</span> ` : "";

		if (meta.depth === -1) {
			if (!this._firstSection) textStack[0] += `<hr class="rd__hr rd__hr--section">`;
			this._firstSection = false;
		}

		if (entry.entries || entry.name) {
			textStack[0] += `<${this.wrapperTag} ${dataString} ${styleString}>${headerSpan}`;
			this._renderEntriesSubtypes_renderPreReqText(entry, textStack, meta);
			if (entry.entries) {
				const cacheDepth = meta.depth;
				const len = entry.entries.length;
				for (let i = 0; i < len; ++i) {
					meta.depth = nextDepth;
					this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
					// Add a spacer for style sets that have vertical whitespace instead of indents
					if (i === 0 && cacheDepth >= 2) textStack[0] += `<div class="rd__spc-inline-post"></div>`;
				}
				meta.depth = cacheDepth;
			}
			textStack[0] += `</${this.wrapperTag}>`;
		}

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._getDataString = function (entry) {
		let dataString = "";
		if (entry.source) dataString += `data-source="${entry.source}"`;
		if (entry.data) {
			for (const k in entry.data) {
				if (!k.startsWith("rd-")) continue;
				dataString += ` data-${k}="${`${entry.data[k]}`.escapeQuotes()}"`;
			}
		}
		return dataString;
	};

	this._renderEntriesSubtypes_renderPreReqText = function (entry, textStack, meta) {
		if (entry.prerequisite) {
			textStack[0] += `<span class="rd__prerequisite">Prerequisite: `;
			this._recursiveRender({type: "inline", entries: [entry.prerequisite]}, textStack, meta);
			textStack[0] += `</span>`;
		}
	};

	this._renderEntriesSubtypes_getStyleString = function (entry, meta, isInlineTitle) {
		const styleClasses = ["rd__b"];
		styleClasses.push(this._getStyleClass(entry));
		if (isInlineTitle) {
			if (this._subVariant) styleClasses.push(Renderer.HEAD_2_SUB_VARIANT);
			else styleClasses.push(Renderer.HEAD_2);
		} else styleClasses.push(meta.depth === -1 ? Renderer.HEAD_NEG_1 : meta.depth === 0 ? Renderer.HEAD_0 : Renderer.HEAD_1);
		return styleClasses.length > 0 ? `class="${styleClasses.join(" ")}"` : "";
	};

	this._renderOptions = function (entry, textStack, meta, options) {
		if (!entry.entries) return;
		entry.entries = entry.entries.sort((a, b) => a.name && b.name ? SortUtil.ascSort(a.name, b.name) : a.name ? -1 : b.name ? 1 : 0);

		if (entry.style && entry.style === "list-hang-notitle") {
			const fauxEntry = {
				type: "list",
				style: "list-hang-notitle",
				items: entry.entries.map(ent => {
					if (typeof ent === "string") return ent;

					const out = {...ent, type: "item"};
					if (ent.name) out.name = this._inlineHeaderTerminators.has(ent.name[ent.name.length - 1]) ? out.name : `${out.name}.`;
					return out;
				}),
			};
			this._renderList(fauxEntry, textStack, meta, options);
		} else this._renderEntriesSubtypes(entry, textStack, meta, options, false);
	};

	this._renderList = function (entry, textStack, meta, options) {
		if (entry.items) {
			if (entry.name) textStack[0] += `<div class="rd__list-name">${entry.name}</div>`;
			const cssClasses = this._renderList_getListCssClasses(entry, textStack, meta, options);
			textStack[0] += `<ul ${cssClasses ? `class="${cssClasses}"` : ""}>`;
			const isListHang = entry.style && entry.style.split(" ").includes("list-hang");
			const len = entry.items.length;
			for (let i = 0; i < len; ++i) {
				const item = entry.items[i];
				// Special case for child lists -- avoid wrapping in LI tags to avoid double-bullet
				if (item.type !== "list") {
					const className = `${this._getStyleClass(item)}${item.type === "itemSpell" ? " rd__li-spell" : ""}`;
					textStack[0] += `<li class="rd__li ${className}">`;
				}
				// If it's a raw string in a hanging list, wrap it in a div to allow for the correct styling
				if (isListHang && typeof item === "string") textStack[0] += "<div>";
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(item, textStack, meta);
				meta.depth = cacheDepth;
				if (isListHang && typeof item === "string") textStack[0] += "</div>";
				if (item.type !== "list") textStack[0] += "</li>";
			}
			textStack[0] += "</ul>";
		}
	};

	this._renderLeveledEffect = function (entry, textStack, meta, options) {
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);
		const arr_effects = entry.entries;
		arr_effects.forEach(x => {
			textStack[0] += `<p class="pf2-stat__section"><strong>${x["range_str"]} </strong>`;
			this._recursiveRender(x["entry"], textStack, meta);
			textStack[0] += `</p>`;
		});

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	}

	this._renderAttack = function (entry, textStack, meta, options) {
		textStack[0] += `<p class="pf2-stat__section attack">`
		textStack[0] += `<span><strong>${entry.range} </strong>`
		textStack[0] += this.render(`{@as 1} `)
		textStack[0] += `${entry.name} `
		textStack[0] += `</span>`
		textStack[0] += this.render(`{@hit ${entry.attack}||${entry.name.uppercaseFirst()} `)
		textStack[0] += `<span>`
		if (entry.traits != null) {
			let traits = []
			entry.traits.forEach((t) => {
				let traitname = Parser.getTraitName(t)
				traits.push(`{@trait ${traitname}|${Parser.TRAITS_TO_TRAITS_SRC[traitname]}|${t}}`)
			});
			textStack[0] += this.render(` (${traits.join(", ")})`)
		}
		textStack[0] += `, <strong>Damage </strong>`
		textStack[0] += this.render(entry.damage)

		textStack[0] += `</span></p>`
	};

	this._renderAbility = function (entry, textStack, meta, options) {
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);
		const renderer = Renderer.get().setFirstSection(true);

		textStack[0] += `<div class="pf2-stat pf2-book--stat">`;
		textStack[0] += Renderer.utils.getNameDiv(entry, {activity: true, type: ""});
		textStack[0] += Renderer.utils.getDividerDiv();
		textStack[0] += Renderer.utils.getTraitsDiv(entry.traits || []);
		textStack[0] += Renderer.action.getSubHead(entry);
		entry.entries.forEach(it => renderer._recursiveRender(it, textStack, meta, {pf2StatFix: true}));
		textStack[0] += `</div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	}

	this._renderActivation = function (entry, textStack, meta, options) {
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		textStack[0] += `<p class="pf2-stat__section"><span><strong>${entry.name ? entry.name : "Activate"} </strong>`
		if (entry.activity != null) this._recursiveRender(`${entry.activity.entry} `, textStack, meta);
		if (entry.components != null && entry.components.length) textStack[0] += `${entry.components.join(", ")}; `
		if (entry.frequency != null) {
			textStack[0] += `<strong>Frequency </strong>`
			this._recursiveRender(`${entry.frequency} `, textStack, meta)
		}
		if (entry.requirements != null) {
			textStack[0] += `<strong>Requirements </strong>`
			this._recursiveRender(`${entry.requirements} `, textStack, meta)
		}
		if (entry.trigger != null) {
			textStack[0] += `<strong>Trigger </strong>`
			this._recursiveRender(`${entry.trigger} `, textStack, meta)
		}
		textStack[0] += `<strong>Effect </strong>`
		entry.effect.forEach((e) => {
			this._recursiveRender(e, textStack, meta)
		})

		textStack[0] += `</span></p>`

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	}

	this._renderSuccessDegree = function (entry, textStack, meta, options) {
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		for (let key in entry.entries) {
			textStack[0] += `<span class="pf2-stat__section"><strong>${key} </strong>`
			if (typeof (entry.entries[key]) === "string") {
				this._recursiveRender(entry.entries[key], textStack, meta, {prefix: "<span>", suffix: "</span>"});
			} else if (Array.isArray(entry.entries[key])) {
				entry.entries[key].forEach((e) => {
					this._recursiveRender(e, textStack, meta, {prefix: "<span>", suffix: "</span>"});
				});
			}
			textStack[0] += `</span>`
		}

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	}

	this._renderAffliction = function (entry, textStack, meta, options) {
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);
		const renderer = Renderer.get();

		const dict = entry.entries;
		let traits = []
		if (dict["traits"]) {
			dict["traits"].forEach((t) => {
				let traitname = Parser.getTraitName(t);
				traits.push(`{@trait ${t}|${Parser.TRAITS_TO_TRAITS_SRC[traitname]}}`);
			});
		}
		if (!options.isAbility) textStack[0] += `<p class="pf2-stat__section">`
		if (dict["name"] != null) {
			textStack[0] += `<strong>${dict["name"]} </strong> `;
		}
		if (traits.length) {
			textStack[0] += `(${renderer.render(traits.join(", "))}); `;
		}
		if (dict["level"] != null) {
			textStack[0] += `<strong>Level </strong>${dict["level"]}. `;
		}
		if (dict["note"] != null) {
			textStack[0] += `${this.render(dict["note"])} `;
		}
		if (dict["DC"] != null) {
			textStack[0] += `<strong>Saving Throw </strong>DC ${dict["DC"]} ${dict["saving throw"]}. `;
		}
		if (dict["onset"] != null) {
			textStack[0] += ` <strong>Onset</strong> ${dict["onset"]}`;
		}
		if (dict["max duration"] != null) {
			textStack[0] += ` <strong>Maximum Duration</strong> ${dict["max duration"]}`;
		}
		if (dict["stages"]) {
			for (let stage of dict["stages"]) {
				textStack[0] += ` <strong>Stage ${stage["stage"]} </strong>`;
				this._recursiveRender(stage["entry"], textStack, meta);
				if (stage["duration"] != null) {
					textStack[0] += ` (${stage["duration"]});`;
				}
			}
		}
		if (dict["effect"]) {
			textStack[0] += ` <strong>Effect </strong>`;
			dict["effect"].forEach(it => this._recursiveRender(it, textStack, meta));
		}
		textStack[0] = textStack[0].replace(/;$/, ".");
		if (!options.isAbility) textStack[0] += `</p>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2H1 = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="pf2-wrp-h1" ${dataString}>`;
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<p class="pf2-h1" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></p>`;
		}
		this._firstSection = false;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: `<p class="pf2-p">`, suffix: `</p>`});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `<div class="float-clear"></div>`;
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2H1Flavor = function (entry, textStack, meta, options) {
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				textStack[0] += `<p class="pf2-h1-flavor rd__h">${this.render(entry.entries[i])}</p>`;
			}
		}
		textStack[0] += this._getPf2ChapterSwirl()

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._getPf2ChapterSwirl = function () {
		return `<div class="flex">
                <div class="pf2-chapter__line pf2-chapter__line--l"></div>
                <svg class="pf2-chapter__swirl pf2-chapter__swirl--l" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 134.57 57.84"><path d="M800.2,632.26a36.88,36.88,0,0,1-11.08-1.86c-8.26-3.54-12-5.67-17.94-13.93a39.28,39.28,0,0,1-5.08-10.05,19.27,19.27,0,0,0-8-10.95,12.64,12.64,0,0,0-6.67-2.22,8.8,8.8,0,0,0-5.57,2c-3.7,2.94-4.55,7.11-2.52,12.38a16.63,16.63,0,0,0,.81,1.71c-6.64-2.41-9.19-8.31-9-20.51v-.69l-.66.2c-1.67.51-3.34,1-5,1.57-7.53,2.4-15.31,4.88-23,4.88a31.28,31.28,0,0,1-12.92-2.68,38.86,38.86,0,0,0,7,.65c13,0,24.65-7,34.88-13.11a29.75,29.75,0,0,1,15.33-4.26c12.49,0,23.44,7.86,26,18.68a1.29,1.29,0,0,0,.62.73,1.49,1.49,0,0,1,.2.15l.34.3.33-.31c6.21-5.84,10.58-8.33,14.61-8.33,2.41,0,4.75.91,7.37,2.85C805,593,806,596.86,803.49,602c-1.87-4.49-4.64-7-7.82-7a7.19,7.19,0,0,0-2.8.61c-4.1,1.74-5.67,7.06-3.65,12.37a13.49,13.49,0,0,0,12.35,8.61,10.84,10.84,0,0,0,1.13-.06A13.18,13.18,0,0,0,814.34,605c1.23-8.66-2.06-15-10.06-19.4,7.2.2,11.07,4.31,14.18,8.74l.1.14a38.92,38.92,0,0,1,3,4.81,23.4,23.4,0,0,1,2,13c0,.35-.07.61-.07.76-1,6.1-2.89,8.43-3.89,9.68-4,5-6.37,6-8.84,7.07A37.67,37.67,0,0,1,800.2,632.26Z" transform="translate(-689.69 -574.92)"/><path d="M750.77,575.92c12.26,0,23,7.7,25.54,18.3a1.78,1.78,0,0,0,.82,1,.83.83,0,0,1,.15.11l.69.61.66-.63c6-5.66,10.43-8.19,14.27-8.19a11.76,11.76,0,0,1,7.07,2.75c4.24,3.15,5.34,6.46,3.53,10.87-1.94-4-4.69-6.24-7.83-6.24a7.66,7.66,0,0,0-3,.65c-4.34,1.85-6,7.44-3.92,13a14,14,0,0,0,12.82,8.93,11.66,11.66,0,0,0,1.18-.06,13.67,13.67,0,0,0,12.08-12c1.16-8.17-1.59-14.35-8.41-18.78,5.63.88,8.92,4.48,11.63,8.34l.1.14a37.88,37.88,0,0,1,3,4.73,22.87,22.87,0,0,1,2,12.75c0,.32-.06.54-.07.72-1,6-2.81,8.26-3.78,9.47-4,4.94-6.23,5.91-8.64,6.92a37.17,37.17,0,0,1-10.37,2.38,36.67,36.67,0,0,1-10.9-1.82c-8.17-3.51-11.82-5.62-17.72-13.76a39.37,39.37,0,0,1-5-9.91,19.72,19.72,0,0,0-8.22-11.22,13.05,13.05,0,0,0-6.94-2.3,9.29,9.29,0,0,0-5.88,2.14c-3.84,3.05-4.76,7.53-2.68,13,.07.19.15.37.23.55-5.5-2.61-7.62-8.38-7.44-19.53l0-1.37-1.31.4c-1.68.51-3.38,1.05-5,1.58-7.49,2.38-15.24,4.85-22.86,4.85a31.61,31.61,0,0,1-8.44-1.11c.84.06,1.69.08,2.54.08,13.18,0,24.85-7,35.14-13.18a29.27,29.27,0,0,1,15.07-4.19m0-1a30.19,30.19,0,0,0-15.58,4.33c-11,6.59-22,13-34.63,13a38.2,38.2,0,0,1-10.87-1.59,31.87,31.87,0,0,0,16.77,4.62c9.46,0,18.8-3.63,28.18-6.47-.21,13.11,2.82,19.17,10.49,21.37-.48-1-1-1.83-1.34-2.74-1.71-4.43-1.53-8.71,2.36-11.81a8.27,8.27,0,0,1,5.26-1.92,12.1,12.1,0,0,1,6.4,2.15,18.67,18.67,0,0,1,7.81,10.67,39.89,39.89,0,0,0,5.16,10.19c5.94,8.2,9.55,10.41,18.18,14.12a37.78,37.78,0,0,0,11.25,1.88A38.5,38.5,0,0,0,811,630.31c2.64-1.12,5-2.22,9-7.22,1.23-1.54,3-4,4-10a24.66,24.66,0,0,0-2-14,41.26,41.26,0,0,0-3.13-5c-3.56-5.07-7.7-9-15.17-9-.46,0-.94,0-1.43,0,9.18,4.34,12.86,10.78,11.57,19.8a12.74,12.74,0,0,1-11.19,11.11c-.36,0-.72.05-1.08.05a12.94,12.94,0,0,1-11.88-8.28c-1.91-5-.45-10.11,3.37-11.74a6.69,6.69,0,0,1,2.61-.57c3,0,5.6,2.35,7.42,6.78q.15.39.36.39c.11,0,.23-.08.37-.24,2.77-5.47,1.76-9.63-3.25-13.36a12.79,12.79,0,0,0-7.67-3c-4.26,0-8.84,2.72-14.95,8.46-.23-.2-.6-.37-.66-.61-2.78-11.58-14.21-19.07-26.52-19.07Z" transform="translate(-689.69 -574.92)"/></svg>
                <svg class="pf2-chapter__swirl pf2-chapter__swirl--r" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 134.57 57.84"><path d="M800.2,632.26a36.88,36.88,0,0,1-11.08-1.86c-8.26-3.54-12-5.67-17.94-13.93a39.28,39.28,0,0,1-5.08-10.05,19.27,19.27,0,0,0-8-10.95,12.64,12.64,0,0,0-6.67-2.22,8.8,8.8,0,0,0-5.57,2c-3.7,2.94-4.55,7.11-2.52,12.38a16.63,16.63,0,0,0,.81,1.71c-6.64-2.41-9.19-8.31-9-20.51v-.69l-.66.2c-1.67.51-3.34,1-5,1.57-7.53,2.4-15.31,4.88-23,4.88a31.28,31.28,0,0,1-12.92-2.68,38.86,38.86,0,0,0,7,.65c13,0,24.65-7,34.88-13.11a29.75,29.75,0,0,1,15.33-4.26c12.49,0,23.44,7.86,26,18.68a1.29,1.29,0,0,0,.62.73,1.49,1.49,0,0,1,.2.15l.34.3.33-.31c6.21-5.84,10.58-8.33,14.61-8.33,2.41,0,4.75.91,7.37,2.85C805,593,806,596.86,803.49,602c-1.87-4.49-4.64-7-7.82-7a7.19,7.19,0,0,0-2.8.61c-4.1,1.74-5.67,7.06-3.65,12.37a13.49,13.49,0,0,0,12.35,8.61,10.84,10.84,0,0,0,1.13-.06A13.18,13.18,0,0,0,814.34,605c1.23-8.66-2.06-15-10.06-19.4,7.2.2,11.07,4.31,14.18,8.74l.1.14a38.92,38.92,0,0,1,3,4.81,23.4,23.4,0,0,1,2,13c0,.35-.07.61-.07.76-1,6.1-2.89,8.43-3.89,9.68-4,5-6.37,6-8.84,7.07A37.67,37.67,0,0,1,800.2,632.26Z" transform="translate(-689.69 -574.92)"/><path d="M750.77,575.92c12.26,0,23,7.7,25.54,18.3a1.78,1.78,0,0,0,.82,1,.83.83,0,0,1,.15.11l.69.61.66-.63c6-5.66,10.43-8.19,14.27-8.19a11.76,11.76,0,0,1,7.07,2.75c4.24,3.15,5.34,6.46,3.53,10.87-1.94-4-4.69-6.24-7.83-6.24a7.66,7.66,0,0,0-3,.65c-4.34,1.85-6,7.44-3.92,13a14,14,0,0,0,12.82,8.93,11.66,11.66,0,0,0,1.18-.06,13.67,13.67,0,0,0,12.08-12c1.16-8.17-1.59-14.35-8.41-18.78,5.63.88,8.92,4.48,11.63,8.34l.1.14a37.88,37.88,0,0,1,3,4.73,22.87,22.87,0,0,1,2,12.75c0,.32-.06.54-.07.72-1,6-2.81,8.26-3.78,9.47-4,4.94-6.23,5.91-8.64,6.92a37.17,37.17,0,0,1-10.37,2.38,36.67,36.67,0,0,1-10.9-1.82c-8.17-3.51-11.82-5.62-17.72-13.76a39.37,39.37,0,0,1-5-9.91,19.72,19.72,0,0,0-8.22-11.22,13.05,13.05,0,0,0-6.94-2.3,9.29,9.29,0,0,0-5.88,2.14c-3.84,3.05-4.76,7.53-2.68,13,.07.19.15.37.23.55-5.5-2.61-7.62-8.38-7.44-19.53l0-1.37-1.31.4c-1.68.51-3.38,1.05-5,1.58-7.49,2.38-15.24,4.85-22.86,4.85a31.61,31.61,0,0,1-8.44-1.11c.84.06,1.69.08,2.54.08,13.18,0,24.85-7,35.14-13.18a29.27,29.27,0,0,1,15.07-4.19m0-1a30.19,30.19,0,0,0-15.58,4.33c-11,6.59-22,13-34.63,13a38.2,38.2,0,0,1-10.87-1.59,31.87,31.87,0,0,0,16.77,4.62c9.46,0,18.8-3.63,28.18-6.47-.21,13.11,2.82,19.17,10.49,21.37-.48-1-1-1.83-1.34-2.74-1.71-4.43-1.53-8.71,2.36-11.81a8.27,8.27,0,0,1,5.26-1.92,12.1,12.1,0,0,1,6.4,2.15,18.67,18.67,0,0,1,7.81,10.67,39.89,39.89,0,0,0,5.16,10.19c5.94,8.2,9.55,10.41,18.18,14.12a37.78,37.78,0,0,0,11.25,1.88A38.5,38.5,0,0,0,811,630.31c2.64-1.12,5-2.22,9-7.22,1.23-1.54,3-4,4-10a24.66,24.66,0,0,0-2-14,41.26,41.26,0,0,0-3.13-5c-3.56-5.07-7.7-9-15.17-9-.46,0-.94,0-1.43,0,9.18,4.34,12.86,10.78,11.57,19.8a12.74,12.74,0,0,1-11.19,11.11c-.36,0-.72.05-1.08.05a12.94,12.94,0,0,1-11.88-8.28c-1.91-5-.45-10.11,3.37-11.74a6.69,6.69,0,0,1,2.61-.57c3,0,5.6,2.35,7.42,6.78q.15.39.36.39c.11,0,.23-.08.37-.24,2.77-5.47,1.76-9.63-3.25-13.36a12.79,12.79,0,0,0-7.67-3c-4.26,0-8.84,2.72-14.95,8.46-.23-.2-.6-.37-.66-.61-2.78-11.58-14.21-19.07-26.52-19.07Z" transform="translate(-689.69 -574.92)"/></svg>
                <div class="pf2-chapter__line pf2-chapter__line--r"></div>
            	</div>`
	};

	this._renderPf2H2 = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="pf2-wrp-h2" ${dataString}>`;
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		if (entry.step != null) {
			textStack[0] += `<p class="pf2-h2__step-num">${entry.step}</p>`
			textStack[0] += `<p class="pf2-h2__step">STEP ${entry.step}</p>`
		}

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<p class="pf2-h2 rd__h ${this._firstSection ? "p-0" : ""}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></p>`;
		}
		this._firstSection = false;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: `<p class="pf2-p">`, suffix: `</p>`});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</${this.wrapperTag}>`;
		textStack[0] += `<div style="clear: left"></div>`

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2H3 = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="pf2-wrp-h3" ${dataString}>`;
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<p class="pf2-h3 rd__h ${this._firstSection ? "p-0" : ""}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span>`;
			if (entry.level) textStack[0] += `<span class="pf2-h3--lvl">${Parser.getOrdinalForm(entry.level)}</span>`;
			textStack[0] += `</p>`;
		}
		this._firstSection = false;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: `<p class="pf2-p">`, suffix: `</p>`});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2H4 = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="pf2-wrp-h4" ${dataString}>`;
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<p class="pf2-h4 rd__h ${this._firstSection ? "p-0" : ""}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></p>`;
		}
		this._firstSection = false;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: `<p class="pf2-p">`, suffix: `</p>`});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2H5 = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="pf2-wrp-h5" ${dataString}>`;
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<p class="pf2-h5 rd__h ${this._firstSection ? "mt-0" : ""}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></p>`;
		}
		this._firstSection = false;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: `<p class="pf2-p">`, suffix: `</p>`});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2Title = function (entry, textStack, meta, options) {
		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<p class="pf2-title" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></p>`;
		}
	};

	this._renderPf2Sidebar = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<div class="pf2-sidebar" ${dataString}>`;
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<p class="pf2-sidebar__title" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></p>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2
				this._recursiveRender(entry.entries[i], textStack, meta, {
					prefix: `<p class="pf2-sidebar__text">`,
					suffix: `</p>`,
				});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2SampleBox = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<div class="pf2-sample-box" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<div class="pf2-sample-box__title" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></div>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {
					prefix: "<p class=\"pf2-sample-box__text\">",
					suffix: "</p>",
				});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2Inset = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<div class="pf2-inset" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta);
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2TipsBox = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<div class="pf2-tips-box" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<div class="pf2-tips-box__title" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></div>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {
					prefix: "<p class=\"pf2-tips-box__text\">",
					suffix: "</p>",
				});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._getPf2BoxSwirl = function (right, styles) {
		if (right) {
			return `<svg class="pf2-box__swirl pf2-box__swirl--right ${styles}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 415 242"><path d="M1.39,241.51S-.3,71.14.05,71.33s21.77.19,32.62-.44a162.92,162.92,0,0,0,29-4.21,129.52,129.52,0,0,0,27.54-10c8.58-4.32,17.24-9.56,24-16.44a43.08,43.08,0,0,0,4.59-5.49c1-1.5,2-3.17,3.91-3.57s4.35.29,6.29.8A35.38,35.38,0,0,1,133.82,34c7.47,3.44,13.3,9.39,18.13,15.91a89.19,89.19,0,0,1,13.26,25.78c1.48,4.57,2.64,9.21,4.58,13.63a61.82,61.82,0,0,0,6.74,11.73c2.61,3.56,5.66,7.34,9.24,10,4,3,8.62,2.55,13.35,2.47,11.33-.18,22.66-.48,34-.17q4.14.11,8.28.34a32.22,32.22,0,0,0,7-.12,20.35,20.35,0,0,0,10-4.63,38.2,38.2,0,0,0,9.1-45.84,30.88,30.88,0,0,0-7.34-10,26.81,26.81,0,0,0-10.24-5.2C242.33,45.83,233.56,46.47,227,51a24.54,24.54,0,0,0-10.11,21,19.36,19.36,0,0,0,3.58,11.17,14.84,14.84,0,0,0,9.09,5.51,16.64,16.64,0,0,0,6,0c.78-.15,2.12-.6,2.74.19.31.39-.07.72-.35,1.14s-.51.73-.78,1.08a20.38,20.38,0,0,1-9.7,6.52c-16.57,5.41-33.26-7.15-38.83-22.31a36.82,36.82,0,0,1-2.27-12,60.62,60.62,0,0,1,1.48-13,67.43,67.43,0,0,1,9.44-23.9A59.61,59.61,0,0,1,216.74,8,58.69,58.69,0,0,1,242,.23a76.68,76.68,0,0,1,28.17,3.05,72.58,72.58,0,0,1,24.69,13.37c13.36,11,23,26.29,26.26,43.33a68.81,68.81,0,0,1,0,25.47c-.22,1.17-.45,2.35-.75,3.5a21.3,21.3,0,0,0-.74,2.56,3.63,3.63,0,0,0,.21,1.73s.22.62.32.66.89-.3,1-.35c1.16-.38,2.32-.74,3.49-1.08a82.23,82.23,0,0,1,14.91-2.91,69.58,69.58,0,0,1,53.47,18A65.83,65.83,0,0,1,414.44,155a66.94,66.94,0,0,1-19.32,47.35c-.38-2.72-.69-5.46-1.07-8.18-1.16-8.35-3.23-16.73-7.36-24.14a41.74,41.74,0,0,0-16.33-16.32,61.34,61.34,0,0,0-11.21-4.65c-1.69-.53-4.26-1.45-5.89-.27s-1.68,4-1.78,5.8c-.28,5-.1,10-.1,14.93q0,35.78,0,71.53"/></svg>`
		} else {
			return `<svg class="pf2-box__swirl pf2-box__swirl--left ${styles}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 415 242"><path d="M63.05,241.05V169.52c0-5,.18-10-.09-14.93-.11-1.81-.13-4.6-1.78-5.8s-4.2-.26-5.89.27a61.34,61.34,0,0,0-11.21,4.65A41.74,41.74,0,0,0,27.75,170c-4.13,7.41-6.2,15.79-7.36,24.14-.38,2.72-.69,5.46-1.07,8.18A66.94,66.94,0,0,1,0,155a65.82,65.82,0,0,1,21.38-47.46,69.62,69.62,0,0,1,53.48-18,82.23,82.23,0,0,1,14.91,2.91q1.76.51,3.48,1.08c.16,0,.91.41,1,.35a2.86,2.86,0,0,0,.32-.66,3.63,3.63,0,0,0,.21-1.73A21.3,21.3,0,0,0,94.09,89c-.3-1.15-.53-2.33-.75-3.5a68.81,68.81,0,0,1,0-25.47c3.23-17,12.9-32.38,26.26-43.33A72.58,72.58,0,0,1,144.3,3.28a76.68,76.68,0,0,1,28.17-3A58.69,58.69,0,0,1,197.7,8a59.71,59.71,0,0,1,19.5,18.51,67.43,67.43,0,0,1,9.44,23.9,60.62,60.62,0,0,1,1.48,13,36.82,36.82,0,0,1-2.27,12c-5.57,15.16-22.26,27.72-38.83,22.31a20.33,20.33,0,0,1-9.7-6.52c-.27-.35-.54-.71-.79-1.08s-.65-.75-.34-1.14c.62-.79,2-.34,2.74-.19a16.64,16.64,0,0,0,6,0A14.86,14.86,0,0,0,194,83.25a19.44,19.44,0,0,0,3.58-11.17,24.54,24.54,0,0,0-10.11-21c-6.58-4.57-15.35-5.21-22.94-3.14a26.81,26.81,0,0,0-10.24,5.2,30.74,30.74,0,0,0-7.34,10,38.2,38.2,0,0,0,9.1,45.84,20.36,20.36,0,0,0,10,4.63,32.32,32.32,0,0,0,7,.12q4.14-.24,8.28-.34c11.33-.31,22.66,0,34,.17,4.73.08,9.33.48,13.34-2.47,3.59-2.63,6.64-6.41,9.25-10a61.82,61.82,0,0,0,6.74-11.73c1.94-4.42,3.1-9.06,4.58-13.63a88.94,88.94,0,0,1,13.26-25.78c4.83-6.52,10.66-12.47,18.13-15.91A35.06,35.06,0,0,1,286.44,32c1.94-.51,4.28-1.23,6.29-.8s2.85,2.07,3.91,3.57a43.08,43.08,0,0,0,4.59,5.49c6.77,6.88,15.43,12.12,24,16.44a129.64,129.64,0,0,0,27.53,10,163.16,163.16,0,0,0,29,4.21c10.85.63,32.27.62,32.62.44S413,241.51,413,241.51"/></svg>`
		}
	};

	this._renderPf2BrownBox = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<div ${dataString} style="display: flex; clear: left">`;
		textStack[0] += `<div class="pf2-box pf2-box--brown">`;
		textStack[0] += this._getPf2BoxSwirl(false, "pf2-box--brown")
		textStack[0] += `<div class="pf2-box__swirl-connection pf2-box--brown"></div>`
		textStack[0] += this._getPf2BoxSwirl(true, "pf2-box--brown")

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="pf2-box__title" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></span>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p class='pf2-box__text'>", suffix: "</p>"});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</div></div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2RedBox = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<div class="pf2-box pf2-box--red" ${dataString} style="clear: left">`;
		textStack[0] += this._getPf2BoxSwirl(false, "pf2-box--red")
		textStack[0] += `<div class="pf2-box__swirl-connection pf2-box--red"></div>`
		textStack[0] += this._getPf2BoxSwirl(true, "pf2-box--red")

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="pf2-box__title" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></span>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {
					prefix: "<p class='pf2-box__text'>",
					suffix: "</p>",
				});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2KeyAbility = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<div class="pf2-key-abilities" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.ability != null) {
			textStack[0] += `<div class="pf2-key-abilities__ab">`;
			textStack[0] += `<p class="pf2-key-abilities__title">KEY ABILITY</p>`;
			const len = entry.ability.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.ability[i], textStack, meta, {
					prefix: "<p class='pf2-key-abilities__text'>",
					suffix: "</p>",
				});
				meta.depth = cacheDepth;
			}
			textStack[0] += `</div>`;
		}

		if (entry.hp != null) {
			textStack[0] += `<div class="pf2-key-abilities__hp">`;
			textStack[0] += `<p class="pf2-key-abilities__title">HIT POINTS</p>`;
			const len = entry.hp.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.hp[i], textStack, meta, {
					prefix: "<p class='pf2-key-abilities__text'>",
					suffix: "</p>",
				});
				meta.depth = cacheDepth;
			}
			textStack[0] += `</div>`;
		}

		textStack[0] += `</div>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderPf2Options = function (entry, textStack, meta, options) {
		if (!entry.items || !entry.items.length) return;
		if (!entry.skipSort) entry.items = entry.items.sort((a, b) => a.name && b.name ? SortUtil.ascSort(a.name, b.name) : a.name ? -1 : b.name ? 1 : 0);
		const renderer = Renderer.get();
		entry.items.forEach(it => {
			const style = entry.style ? entry.style : "pf2-book__option";
			textStack[0] += `<p class="${style}">${it.name ? `<strong>${it.name}: </strong>` : ""}${renderer.render(it.entries.shift())}</p>`;
			it.entries.forEach(e => this._recursiveRender(e, textStack, meta, {prefix: `<p class="${style}">`, suffix: `</p>`}));
		});
	};

	this._renderInset = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="rd__b-inset" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="rd__h rd__h--2-inset" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span>${this._getPagePart(entry, true)}</span>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `<div class="float-clear"></div>`;
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderInsetReadaloud = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="rd__b-inset rd__b-inset--readaloud" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="rd__h rd__h--2-inset" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span>${this._getPagePart(entry, true)}</span>`;
		}
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			const cacheDepth = meta.depth;
			meta.depth = 2;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			meta.depth = cacheDepth;
		}
		textStack[0] += `<div class="float-clear"></div>`;
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderVariant = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);

		this._handleTrackTitles(entry.name);
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		textStack[0] += `<${this.wrapperTag} class="rd__b-inset" ${dataString}>`;
		textStack[0] += `<span class="rd__h rd__h--2-inset" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">Variant: ${entry.name}</span></span>`;
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			const cacheDepth = meta.depth;
			meta.depth = 2;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			meta.depth = cacheDepth;
		}
		if (entry.variantSource) textStack[0] += Renderer.utils.getSourceAndPageTrHtml(entry.variantSource);
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderVariantInner = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);

		this._handleTrackTitles(entry.name);
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		textStack[0] += `<${this.wrapperTag} class="rd__b-inset-inner" ${dataString}>`;
		textStack[0] += `<span class="rd__h rd__h--2-inset" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></span>`;
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			const cacheDepth = meta.depth;
			meta.depth = 2;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			meta.depth = cacheDepth;
		}
		if (entry.variantSource) textStack[0] += Renderer.utils.getSourceAndPageTrHtml(entry.variantSource);
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderVariantSub = function (entry, textStack, meta, options) {
		// pretend this is an inline-header'd entry, but set a flag so we know not to add bold
		this._subVariant = true;
		const fauxEntry = entry;
		fauxEntry.type = "entries";
		const cacheDepth = meta.depth;
		meta.depth = 3;
		this._recursiveRender(fauxEntry, textStack, meta, {prefix: "<p>", suffix: "</p>"});
		meta.depth = cacheDepth;
		this._subVariant = false;
	};

	this._renderSpellcasting_getEntries = function (entry) {
		const hidden = new Set(entry.hidden || []);
		const toRender = [{
			type: "entries",
			name: entry.name,
			entries: entry.headerEntries ? MiscUtil.copy(entry.headerEntries) : [],
		}];

		if (entry.constant || entry.will || entry.rest || entry.daily || entry.weekly || entry.ritual) {
			const tempList = {type: "list", style: "list-hang-notitle", items: [], data: {isSpellList: true}};
			if (entry.constant && !hidden.has("constant")) {
				tempList.items.push({
					type: "itemSpell",
					name: `Constant:`,
					entry: entry.constant.join(", "),
				});
			}
			if (entry.will && !hidden.has("will")) {
				tempList.items.push({
					type: "itemSpell",
					name: `At will:`,
					entry: entry.will.join(", "),
				});
			}
			if (entry.rest && !hidden.has("rest")) {
				for (let lvl = 9; lvl > 0; lvl--) {
					const rest = entry.rest;
					if (rest[lvl]) {
						tempList.items.push({
							type: "itemSpell",
							name: `${lvl}/rest:`,
							entry: rest[lvl].join(", "),
						});
					}
					const lvlEach = `${lvl}e`;
					if (rest[lvlEach]) {
						tempList.items.push({
							type: "itemSpell",
							name: `${lvl}/rest each:`,
							entry: rest[lvlEach].join(", "),
						});
					}
				}
			}
			if (entry.daily && !hidden.has("daily")) {
				for (let lvl = 9; lvl > 0; lvl--) {
					const daily = entry.daily;
					if (daily[lvl]) {
						tempList.items.push({
							type: "itemSpell",
							name: `${lvl}/day:`,
							entry: daily[lvl].join(", "),
						});
					}
					const lvlEach = `${lvl}e`;
					if (daily[lvlEach]) {
						tempList.items.push({
							type: "itemSpell",
							name: `${lvl}/day each:`,
							entry: daily[lvlEach].join(", "),
						});
					}
				}
			}
			if (entry.weekly && !hidden.has("weekly")) {
				for (let lvl = 9; lvl > 0; lvl--) {
					const weekly = entry.weekly;
					if (weekly[lvl]) {
						tempList.items.push({
							type: "itemSpell",
							name: `${lvl}/week:`,
							entry: weekly[lvl].join(", "),
						});
					}
					const lvlEach = `${lvl}e`;
					if (weekly[lvlEach]) {
						tempList.items.push({
							type: "itemSpell",
							name: `${lvl}/week each:`,
							entry: weekly[lvlEach].join(", "),
						});
					}
				}
			}
			if (entry.ritual && !hidden.has("ritual")) {
				tempList.items.push({
					type: "itemSpell",
					name: `Rituals:`,
					entry: entry.ritual.join(", "),
				});
			}
			if (tempList.items.length) toRender[0].entries.push(tempList);
		}

		if (entry.spells && !hidden.has("spells")) {
			const tempList = {type: "list", style: "list-hang-notitle", items: [], data: {isSpellList: true}};
			for (let lvl = 0; lvl < 10; ++lvl) {
				const spells = entry.spells[lvl];
				if (spells) {
					let levelCantrip = `${Parser.spLevelToFull(lvl)}${(lvl === 0 ? "s" : " level")}`;
					let slotsAtWill = ` (at will)`;
					const slots = spells.slots;
					if (slots >= 0) slotsAtWill = slots > 0 ? ` (${slots} slot${slots > 1 ? "s" : ""})` : ``;
					if (spells.lower && spells.lower !== lvl) {
						levelCantrip = `${Parser.spLevelToFull(spells.lower)}-${levelCantrip}`;
						if (slots >= 0) slotsAtWill = slots > 0 ? ` (${slots} ${Parser.spLevelToFull(lvl)}-level slot${slots > 1 ? "s" : ""})` : ``;
					}
					tempList.items.push({
						type: "itemSpell",
						name: `${levelCantrip}${slotsAtWill}:`,
						entry: spells.spells.join(", ") || "\u2014",
					})
				}
			}
			toRender[0].entries.push(tempList);
		}

		if (entry.footerEntries) toRender.push({type: "entries", entries: entry.footerEntries});
		return toRender;
	};

	this._renderSpellcasting = function (entry, textStack, meta, options) {
		const toRender = this._renderSpellcasting_getEntries(entry);
		this._recursiveRender({type: "entries", entries: toRender}, textStack, meta);
	};

	this._renderQuote = function (entry, textStack, meta, options) {
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			textStack[0] += `<p class="rd__quote-line ${i === len - 1 && entry.by ? `rd__quote-line--last` : ""}">${i === 0 ? "&ldquo;" : ""}`;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<i>", suffix: "</i>"});
			textStack[0] += `${i === len - 1 ? "&rdquo;" : ""}</p>`;
		}
		if (entry.by) {
			textStack[0] += `<p>`;
			const tempStack = [""];
			this._recursiveRender(entry.by, tempStack, meta);
			textStack[0] += `<span class="rd__quote-by">\u2014 ${tempStack.join("")}${entry.from ? `, <i>${entry.from}</i>` : ""}</span>`;
			textStack[0] += `</p>`;
		}
	};

	this._renderOptfeature = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, true);
	};

	this._renderPatron = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, false);
	};

	this._renderAbilityDc = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class="text-center"><b>`;
		this._recursiveRender(entry.name, textStack, meta);
		textStack[0] += ` save DC</b> = 8 + your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}</div>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderAbilityAttackMod = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class="text-center"><b>`;
		this._recursiveRender(entry.name, textStack, meta);
		textStack[0] += ` attack modifier</b> = your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}</div>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderAbilityGeneric = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class="text-center">`;
		if (entry.name) this._recursiveRender(entry.name, textStack, meta, {prefix: "<b>", suffix: "</b> = "});
		textStack[0] += `${entry.text}${entry.attributes ? ` ${Parser.attrChooseToFull(entry.attributes)}` : ""}</div>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderInline = function (entry, textStack, meta, options) {
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta);
		}
	};

	this._renderInlineBlock = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta);
		}
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderBonus = function (entry, textStack, meta, options) {
		textStack[0] += (entry.value < 0 ? "" : "+") + entry.value;
	};

	this._renderBonusSpeed = function (entry, textStack, meta, options) {
		textStack[0] += entry.value === 0 ? "\u2014" : `${entry.value < 0 ? "" : "+"}${entry.value} ft.`;
	};

	this._renderDice = function (entry, textStack, meta, options) {
		textStack[0] += Renderer.getEntryDice(entry, entry.name, this._isAddHandlers);
	};

	this._renderActions = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);

		this._handleTrackTitles(entry.name);
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 2);

		textStack[0] += `<${this.wrapperTag} class="${Renderer.HEAD_2}" ${dataString}><span class="rd__h rd__h--3" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}.</span></span> `;
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			this._recursiveRender(entry.entries[i], textStack, meta, {
				prefix: "<p>",
				suffix: "</p>",
			});
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderItem = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<p><span class="bold list-item-title">${this.render(entry.name)}</span> `;
		if (entry.entry) this._recursiveRender(entry.entry, textStack, meta);
		else if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.entries[i], textStack, meta, {
					prefix: i > 0 ? `<span class="rd__p-cont-indent">` : "",
					suffix: i > 0 ? "</span>" : "",
				});
			}
		}
		textStack[0] += "</p>";
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderItemSub = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._recursiveRender(entry.entry, textStack, meta, {
			prefix: `<p><span class="italic list-item-title">${entry.name}</span> `,
			suffix: "</p>",
		});
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderItemSpell = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._recursiveRender(entry.entry, textStack, meta, {prefix: `<p>${entry.name} `, suffix: "</p>"});
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataCreature = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataCreature.name);
		textStack[0] += Renderer.creature.getCompactRenderedString(entry.dataCreature, this, {isEmbeddedEntity: true});
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataSpell = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataSpell.name);
		textStack[0] += Renderer.spell.getCompactRenderedString(entry.dataSpell, {isEmbeddedEntity: true});
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataTrapHazard = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataTrapHazard.name);
		textStack[0] += Renderer.hazard.getCompactRenderedString(entry.dataTrapHazard, {isEmbeddedEntity: true});
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataObject = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataObject.name);
		textStack[0] += Renderer.object.getCompactRenderedString(entry.dataObject, {isEmbeddedEntity: true});
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataItem = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataItem.name);
		const id = CryptUtil.uid();
		const asString = JSON.stringify(entry.dataItem);
		textStack[0] += `<script id="dataItem-${id}">Renderer.item.populatePropertyAndTypeReference().then(() => {const dataItem = ${asString}; Renderer.item.enhanceItem(dataItem); $("#dataItem-${id}").replaceWith(Renderer.item.getCompactRenderedString(dataItem,  {isEmbeddedEntity: true}))})</script>`
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataHeader = function (textStack, name) {
		textStack[0] += `<table class="rd__b-data">`;
		textStack[0] += `<thead><tr><th class="rd__data-embed-header" colspan="6" onclick="((ele) => {
						$(ele).find('.rd__data-embed-name').toggle();
						$(ele).find('.rd__data-embed-toggle').text($(ele).text().includes('+') ? '[\u2013]' : '[+]');
						$(ele).closest('table').find('tbody').toggle()
					})(this)"><span style="display: none;" class="rd__data-embed-name">${name}</span><span class="rd__data-embed-toggle">[\u2013]</span></th></tr></thead><tbody>`;
	};

	this._renderDataFooter = function (textStack) {
		textStack[0] += `</tbody></table>`;
	};

	this._renderGallery = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="rd__wrp-gallery">`;
		const len = entry.images.length;
		const anyNamed = entry.images.find(it => it.title);
		for (let i = 0; i < len; ++i) {
			const img = MiscUtil.copy(entry.images[i]);
			if (anyNamed && !img.title) img._galleryTitlePad = true; // force untitled images to pad to match their siblings
			delete img.imageType;
			this._recursiveRender(img, textStack, meta, options);
		}
		textStack[0] += `</div>`;
	};

	this._renderFlowchart = function (entry, textStack, meta, options) {
		// TODO style this
		textStack[0] += `<div class="rd__wrp-flowchart">`;
		const len = entry.blocks.length;
		for (let i = 0; i < len; ++i) {
			this._recursiveRender(entry.blocks[i], textStack, meta, options);
			if (i !== len - 1) {
				textStack[0] += `<div class="rd__s-v-flow"></div>`
			}
		}
		textStack[0] += `</div>`;
	};

	this._renderFlowBlock = function (entry, textStack, meta, options) {
		const dataString = this._getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="rd__b-flow" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="rd__h rd__h--2-flow-block" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></span>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `<div class="float-clear"></div>`;
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderHomebrew = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class="homebrew-section"><div class="homebrew-float"><span class="homebrew-notice"></span>`;

		if (entry.oldEntries) {
			const hoverMeta = Renderer.hover.getMakePredefinedHover({
				type: "entries",
				name: "Homebrew",
				entries: entry.oldEntries,
			});
			let markerText;
			if (entry.movedTo) {
				markerText = "(See moved content)";
			} else if (entry.entries) {
				markerText = "(See replaced content)";
			} else {
				markerText = "(See removed content)";
			}
			textStack[0] += `<span class="homebrew-old-content" href="#${window.location.hash}" ${hoverMeta.html}>${markerText}</span>`;
		}

		textStack[0] += `</div>`;

		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.entries[i], textStack, meta, {
					prefix: "<p>",
					suffix: "</p>",
				})
			}
		} else if (entry.movedTo) {
			textStack[0] += `<i>This content has been moved to ${entry.movedTo}.</i>`;
		} else {
			textStack[0] += "<i>This content has been deleted.</i>";
		}

		textStack[0] += `</div>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderCode = function (entry, textStack, meta, options) {
		const isWrapped = !!StorageUtil.syncGet("rendererCodeWrap");
		textStack[0] += `
			<div class="flex-col h-100">
				<div class="flex no-shrink pt-1">
					<button class="btn btn-default btn-xs mb-1 mr-2" onclick="Renderer.events.handleClick_copyCode(event, this)">Copy Code</button>
					<button class="btn btn-default btn-xs mb-1 ${isWrapped ? "active" : ""}" onclick="Renderer.events.handleClick_toggleCodeWrap(event, this)">Word Wrap</button>
				</div>
				<pre class="h-100 w-100 mb-1 ${isWrapped ? "rd__pre-wrap" : ""}">${entry.preformatted}</pre>
			</div>
		`;
	};

	this._renderHr = function (entry, textStack, meta, options) {
		textStack[0] += `<hr class="rd__hr">`;
	};

	this._getStyleClass = function (entry) {
		const outList = [];
		if (SourceUtil.isNonstandardSource(entry.source)) outList.push("spicy-sauce");
		if (BrewUtil.hasSourceJson(entry.source)) outList.push("refreshing-brew");
		if (this._extraSourceClasses) outList.push(...this._extraSourceClasses);
		for (const k in this._fnsGetStyleClasses) {
			const fromFn = this._fnsGetStyleClasses[k](entry);
			if (fromFn) outList.push(...fromFn);
		}
		return outList.join(" ");
	};

	this._renderString = function (entry, textStack, meta, options) {
		const tagSplit = Renderer.splitByTags(entry);
		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;
			if (s.startsWith("{@")) {
				const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));
				this._renderString_renderTag(textStack, meta, options, tag, text);
			} else textStack[0] += s;
		}
	};

	this._renderString_renderTag = function (textStack, meta, options, tag, text) {
		switch (tag) {
			// BASIC STYLES/TEXT ///////////////////////////////////////////////////////////////////////////////
			case "@as":
			case "@actionsymbol":
				textStack[0] += `<span class="pf2-action-icon" data-symbol="${text}"></span>`;
				textStack[0] += `<span class="pf2-action-icon-copy-text">${this._renderString_actionCopyText(text)}</span>`;
				break;
			case "@b":
			case "@bold":
				textStack[0] += `<b>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</b>`;
				break;
			case "@i":
			case "@italic":
				textStack[0] += `<i>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</i>`;
				break;
			case "@s":
			case "@strike":
				textStack[0] += `<s>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</s>`;
				break;
			case "@u":
			case "@underline":
				textStack[0] += `<u>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</u>`;
				break;
			case "@sup":
				textStack[0] += `<sup>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</sup>`;
				break;
			case "@note":
				textStack[0] += `<i class="ve-muted">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</i>`;
				break;
			case "@atk":
				textStack[0] += `<i>${Renderer.attackTagToFull(text)}</i>`;
				break;
			case "@h":
				textStack[0] += `<i>Hit:</i> `;
				break;
			case "@color": {
				const [toDisplay, color] = Renderer.splitTagByPipe(text);
				const scrubbedColor = BrewUtil.getValidColor(color);

				textStack[0] += `<span style="color: #${scrubbedColor}">`;
				this._recursiveRender(toDisplay, textStack, meta);
				textStack[0] += `</span>`;
				break;
			}
			case "@highlight": {
				const [toDisplay, color] = Renderer.splitTagByPipe(text);
				const scrubbedColor = color ? BrewUtil.getValidColor(color) : null;

				textStack[0] += scrubbedColor ? `<span style="background-color: #${scrubbedColor}">` : `<span class="rd__highlight">`;
				textStack[0] += toDisplay;
				textStack[0] += `</span>`;
				break;
			}
			case "@indentFirst":
				textStack[0] += `<span class="text-indent-first">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@indent": // FIXME: Deprecated
			case "@indentSubsequent":
				textStack[0] += `<span class="text-indent-subsequent">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;

			// Comic styles ////////////////////////////////////////////////////////////////////////////////////
			case "@comic":
				textStack[0] += `<span class="rd__comic">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH1":
				textStack[0] += `<span class="rd__comic rd__comic--h1">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH2":
				textStack[0] += `<span class="rd__comic rd__comic--h2">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH3":
				textStack[0] += `<span class="rd__comic rd__comic--h3">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH4":
				textStack[0] += `<span class="rd__comic rd__comic--h4">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicNote":
				textStack[0] += `<span class="rd__comic rd__comic--note">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;

			// DCs /////////////////////////////////////////////////////////////////////////////////////////////
			case "@dc": {
				textStack[0] += `DC <span class="rd__dc">${text}</span>`;
				break;
			}

			// DICE ////////////////////////////////////////////////////////////////////////////////////////////
			case "@dice":
			case "@damage":
			case "@hit":
			case "@d20":
			case "@chance":
			case "@recharge": {
				const fauxEntry = {
					type: "dice",
					rollable: true,
				};
				const [rollText, displayText, name, ...others] = Renderer.splitTagByPipe(text);
				if (displayText) fauxEntry.displayText = displayText;
				if (name) fauxEntry.name = name;

				switch (tag) {
					case "@dice": {
						// format: {@dice 1d2 + 3 + 4d5 - 6}
						fauxEntry.toRoll = rollText;
						if (!displayText && rollText.includes(";")) fauxEntry.displayText = rollText.replace(/;/g, "/");
						if ((!fauxEntry.displayText && rollText.includes("#$")) || (fauxEntry.displayText && fauxEntry.displayText.includes("#$"))) fauxEntry.displayText = (fauxEntry.displayText || rollText).replace(/#\$prompt_number[^$]*\$#/g, "(n)");
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					}
					case "@damage": {
						fauxEntry.toRoll = rollText;
						fauxEntry.subType = "damage";
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					}
					case "@d20":
					case "@hit": {
						// format: {@hit +1} or {@hit -2}
						let mod;
						if (!isNaN(rollText)) {
							const n = Number(rollText);
							mod = `${n >= 0 ? "+" : ""}${n}`;
						} else mod = rollText;
						fauxEntry.displayText = fauxEntry.displayText || mod;
						fauxEntry.toRoll = `1d20${mod}`;
						fauxEntry.subType = "d20";
						fauxEntry.d20mod = mod;
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					}
					case "@chance": {
						// format: {@chance 25|display text|rollbox rollee name}
						fauxEntry.toRoll = `1d100`;
						fauxEntry.successThresh = Number(rollText);
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					}
					case "@recharge": {
						// format: {@recharge 4|flags}
						const flags = displayText ? displayText.split("") : null; // "m" for "minimal" = no brackets
						fauxEntry.toRoll = "1d6";
						const asNum = Number(rollText || 6);
						fauxEntry.successThresh = 7 - asNum;
						fauxEntry.successMax = 6;
						textStack[0] += `${flags && flags.includes("m") ? "" : "("}Recharge `;
						fauxEntry.displayText = `${asNum}${asNum < 6 ? `\u20136` : ""}`;
						this._recursiveRender(fauxEntry, textStack, meta);
						textStack[0] += `${flags && flags.includes("m") ? "" : ")"}`;
						break;
					}
				}

				break;
			}

			case "@hitYourSpellAttack": {
				const fauxEntry = {
					type: "dice",
					rollable: true,
					subType: "d20",
					displayText: "your spell attack modifier",
					toRoll: `1d20 + #$prompt_number:title=Enter your Spell Attack Modifier$#`,
				};
				this._recursiveRender(fauxEntry, textStack, meta);
				break;
			}

			// SCALE DICE //////////////////////////////////////////////////////////////////////////////////////
			case "@scaledice":
			case "@scaledamage": {
				const fauxEntry = Renderer.parseScaleDice(tag, text);
				this._recursiveRender(fauxEntry, textStack, meta);
				break;
			}

			// LINKS ///////////////////////////////////////////////////////////////////////////////////////////
			case "@filter": {
				// format: {@filter Warlock Spells|spells|level=1;2|class=Warlock}
				const [displayText, page, ...filters] = Renderer.splitTagByPipe(text);

				let customHash;
				const fauxEntry = {
					type: "link",
					text: displayText,
					href: {
						type: "internal",
						path: `${page}.html`,
						hash: HASH_BLANK,
						hashPreEncoded: true,
						subhashes: filters.map(f => {
							const [fName, fVals, fMeta, fOpts] = f.split("=").map(s => s.trim());
							const isBoxData = fName.startsWith("fb");
							const key = isBoxData ? fName : `flst${UrlUtil.encodeForHash(fName)}`;

							let value;
							// special cases for "search" and "hash" keywords
							if (isBoxData) {
								return {
									key,
									value: fVals,
									preEncoded: true,
								}
							} else if (fName === "search") {
								// "search" as a filter name is hackily converted to a box meta option
								return {
									key: VeCt.FILTER_BOX_SUB_HASH_SEARCH_PREFIX,
									value: UrlUtil.encodeForHash(fVals),
									preEncoded: true,
								};
							} else if (fName === "hash") {
								customHash = fVals;
								return null;
							} else if (fVals.startsWith("[") && fVals.endsWith("]")) { // range
								const [min, max] = fVals.substring(1, fVals.length - 1).split(";").map(it => it.trim());
								if (max == null) { // shorthand version, with only one value, becomes min _and_ max
									value = [
										`min=${min}`,
										`max=${min}`,
									].join(HASH_SUB_LIST_SEP);
								} else {
									value = [
										min ? `min=${min}` : "",
										max ? `max=${max}` : "",
									].filter(Boolean).join(HASH_SUB_LIST_SEP);
								}
							} else {
								value = fVals.split(";").map(s => s.trim()).filter(s => s).map(s => {
									const spl = s.split("!");
									if (spl.length === 2) return `${UrlUtil.encodeForHash(spl[1])}=2`;
									return `${UrlUtil.encodeForHash(s)}=1`
								}).join(HASH_SUB_LIST_SEP);
							}

							const out = [{
								key,
								value,
								preEncoded: true,
							}];

							if (fMeta) {
								out.push({
									key: `flmt${UrlUtil.encodeForHash(fName)}`,
									value: fMeta,
									preEncoded: true,
								});
							}

							if (fOpts) {
								out.push({
									key: `flop${UrlUtil.encodeForHash(fName)}`,
									value: fOpts,
									preEncoded: true,
								});
							}

							return out;
						}).flat().filter(Boolean),
					},
				};

				if (customHash) fauxEntry.href.hash = customHash;

				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}
			case "@link": {
				const [displayText, url] = Renderer.splitTagByPipe(text);
				let outUrl = url == null ? displayText : url;
				if (!outUrl.startsWith("http")) outUrl = `http://${outUrl}`; // avoid HTTPS, as the D&D homepage doesn't support it
				const fauxEntry = {
					type: "link",
					href: {
						type: "external",
						url: outUrl,
					},
					text: displayText,
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}
			case "@PF2eTools":
			case "@5etools": {
				const [displayText, page, hash] = Renderer.splitTagByPipe(text);
				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: page,
					},
					text: displayText,
				};
				if (hash) {
					fauxEntry.hash = hash;
					fauxEntry.hashPreEncoded = true;
				}
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			// OTHER HOVERABLES ////////////////////////////////////////////////////////////////////////////////
			case "@footnote": {
				const [displayText, footnoteText, optTitle] = Renderer.splitTagByPipe(text);
				const hoverMeta = Renderer.hover.getMakePredefinedHover({
					type: "entries",
					name: optTitle ? optTitle.toTitleCase() : "Footnote",
					entries: [footnoteText, optTitle ? `{@note ${optTitle}}` : ""].filter(Boolean),
				});
				textStack[0] += `<span class="help" ${hoverMeta.html}>`;
				this._recursiveRender(displayText, textStack, meta);
				textStack[0] += `</span>`;

				break;
			}
			case "@homebrew": {
				const [newText, oldText] = Renderer.splitTagByPipe(text);
				const tooltipEntries = [];
				if (newText && oldText) {
					tooltipEntries.push("{@b This is a homebrew addition, replacing the following:}");
				} else if (newText) {
					tooltipEntries.push("{@b This is a homebrew addition.}")
				} else if (oldText) {
					tooltipEntries.push("{@b The following text has been removed with this homebrew:}")
				}
				if (oldText) {
					tooltipEntries.push(oldText);
				}
				const hoverMeta = Renderer.hover.getMakePredefinedHover({
					type: "entries",
					name: "Homebrew Modifications",
					entries: tooltipEntries,
				});
				textStack[0] += `<span class="homebrew-inline" ${hoverMeta.html}>`;
				this._recursiveRender(newText || "[...]", textStack, meta);
				textStack[0] += `</span>`;

				break;
			}
			case "@skill":
			case "@sense": {
				const expander = (() => {
					switch (tag) {
						case "@skill":
							return Parser.skillToExplanation;
						case "@sense":
							return Parser.senseToExplanation;
					}
				})();
				const [name, displayText] = Renderer.splitTagByPipe(text);
				const hoverMeta = Renderer.hover.getMakePredefinedHover({
					type: "pf2-h3",
					name: name.toTitleCase(),
					entries: expander(name),
				}, {isBookContent: true});
				textStack[0] += `<span class="help--hover" ${hoverMeta.html}>${displayText || name}</span>`;

				break;
			}
			case "@area": {
				const [compactText, areaId, flags, ...others] = Renderer.splitTagByPipe(text);

				const renderText = flags && flags.includes("x")
					? compactText
					: `${flags && flags.includes("u") ? "A" : "a"}rea ${compactText}`;

				if (typeof BookUtil === "undefined") { // for the roll20 script
					textStack[0] += renderText;
				} else {
					const area = BookUtil.curRender.headerMap[areaId] || {entry: {name: ""}}; // default to prevent rendering crash on bad tag
					const hoverMeta = Renderer.hover.getMakePredefinedHover(area.entry, {
						isLargeBookContent: true,
						depth: area.depth,
					});
					textStack[0] += `<a href="#${BookUtil.curRender.curBookId},${area.chapter},${UrlUtil.encodeForHash(area.entry.name)},0" ${hoverMeta.html}>${renderText}</a>`;
				}

				break;
			}

			// HOMEBREW LOADING ////////////////////////////////////////////////////////////////////////////////
			case "@loader": {
				const {name, path} = this._renderString_getLoaderTagMeta(text);
				textStack[0] += `<span onclick="BrewUtil.handleLoadbrewClick(this, '${path.escapeQuotes()}', '${name.escapeQuotes()}')" class="rd__wrp-loadbrew--ready" title="Click to install homebrew">${name}<span class="glyphicon glyphicon-download-alt rd__loadbrew-icon rd__loadbrew-icon"></span></span>`;
				break;
			}

			// CONTENT TAGS ////////////////////////////////////////////////////////////////////////////////////
			case "@book":
			case "@adventure": {
				// format: {@tag Display Text|DMG< |chapter< |section >< |number > >}
				const page = tag === "@book" ? "book.html" : "adventure.html";
				const [displayText, book, chapter, section, rawNumber] = Renderer.splitTagByPipe(text);
				const number = rawNumber || 0;
				const hash = `${book}${chapter ? `${HASH_PART_SEP}${chapter}${section ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(section)}${number != null ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(number)}` : ""}` : ""}` : ""}`;
				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: page,
						hash,
						hashPreEncoded: true,
					},
					text: displayText,
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			case "@deity": {
				const [name, pantheon, source, displayText, ...others] = Renderer.splitTagByPipe(text);
				const hash = `${name}${pantheon ? `${HASH_LIST_SEP}${pantheon}` : ""}${source ? `${HASH_LIST_SEP}${source}` : ""}`;

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						hash,
					},
					text: (displayText || name),
				};

				fauxEntry.href.path = UrlUtil.PG_DEITIES;
				if (!pantheon) fauxEntry.href.hash += `${HASH_LIST_SEP}golarion`;
				if (!source) fauxEntry.href.hash += `${HASH_LIST_SEP}${SRC_CRB}`;
				fauxEntry.href.hover = {
					page: UrlUtil.PG_DEITIES,
					source: source || SRC_CRB,
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			case "@condition": {
				const [name, source, displayText, ...others] = Renderer.splitTagByPipe(text);

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: UrlUtil.PG_CONDITIONS,
						hash: `${name}${source ? `${HASH_LIST_SEP}${source}` : `${HASH_LIST_SEP}${SRC_CRB}`}`,
						hover: {
							page: UrlUtil.PG_CONDITIONS,
							source: source || SRC_CRB,
						},
					},
					text: (displayText || name),
				};
				this._recursiveRender(fauxEntry, textStack, meta);
				break;
			}

			case "@trait": {
				const [name, source, displayText, ...others] = Renderer.splitTagByPipe(text);
				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: UrlUtil.PG_TRAITS,
						hash: `${name.replace(/\s(?:\d|[A-Z]|\()(.+|$)/, "")}${source ? `${HASH_LIST_SEP}${source}` : ""}`,
						hover: {
							page: UrlUtil.PG_TRAITS,
							source: source || SRC_CRB,
						},
					},
					text: (displayText || name),
				};

				if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_CRB;
				this._recursiveRender(fauxEntry, textStack, meta);
				break;
			}

			case "@classFeature": {
				const unpacked = DataUtil.class.unpackUidClassFeature(text);

				const classPageHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({
					name: unpacked.className,
					source: unpacked.classSource,
				})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({
					feature: {
						ixLevel: unpacked.level - 1,
						ixFeature: 0,
					},
				})}`;

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: UrlUtil.PG_CLASSES,
						hash: classPageHash,
						hashPreEncoded: true,
						hover: {
							page: "classfeature",
							source: unpacked.source,
							hash: UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked),
							hashPreEncoded: true,
						},
					},
					text: (unpacked.displayText || unpacked.name),
				};

				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			case "@subclassFeature": {
				const unpacked = DataUtil.class.unpackUidSubclassFeature(text);

				const classPageHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({
					name: unpacked.className,
					source: unpacked.classSource,
				})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({
					feature: {
						ixLevel: unpacked.level - 1,
						ixFeature: 0,
					},
				})}`;

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: UrlUtil.PG_CLASSES,
						hash: classPageHash,
						hashPreEncoded: true,
						hover: {
							page: "subclassfeature",
							source: unpacked.source,
							hash: UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked),
							hashPreEncoded: true,
						},
					},
					text: (unpacked.displayText || unpacked.name),
				};

				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			case "@runeItem": {
				const {hashes, displayText, name, source} = DataUtil.runeItem.unpackUid(text);
				let [baseItemHash, ...runeHashes] = hashes;

				const preloadId = `${VeCt.HASH_ITEM_RUNES}${HASH_SUB_KV_SEP}${baseItemHash}${HASH_SUB_LIST_SEP}${runeHashes.join(HASH_SUB_LIST_SEP)}`;
				const itemsPageHash = `${baseItemHash}${HASH_PART_SEP}runebuilder${HASH_SUB_KV_SEP}true${HASH_SUB_LIST_SEP}${runeHashes.join(HASH_SUB_LIST_SEP)}`;

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: UrlUtil.PG_ITEMS,
						hash: itemsPageHash,
						hashPreEncoded: true,
						hover: {
							page: UrlUtil.PG_ITEMS,
							source,
							hash: UrlUtil.URL_TO_HASH_BUILDER["runeItem"]({name, source}),
							hashPreEncoded: true,
							preloadId,
						},
					},
					text: displayText || name,
				};
				this._recursiveRender(fauxEntry, textStack, meta);
				break;
			}
			default: {
				const {name, source, displayText, others} = DataUtil.generic.unpackUid(text, tag);
				const hash = `${name}${HASH_LIST_SEP}${source}`;

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						hash,
					},
					text: (displayText || name),
				};
				switch (tag) {
					case "@spell":
						fauxEntry.href.path = "spells.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_SPELLS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@item":
						fauxEntry.href.path = "items.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_ITEMS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@class": {
						fauxEntry.href.hover = {
							page: UrlUtil.PG_CLASSES,
							source,
						};
						if (others.length) {
							const [subclassShortName, subclassSource, featurePart] = others;

							const classStateOpts = {
								subclass: {
									shortName: subclassShortName.trim(),
									source: subclassSource
										// Subclass state uses the abbreviated form of the source for URL shortness
										? Parser.sourceJsonToAbv(subclassSource.trim())
										: SRC_CRB,
								},
							};

							// Don't include the feature part for hovers, as it is unsupported
							const hoverSubhashObj = UrlUtil.unpackSubHash(UrlUtil.getClassesPageStatePart(classStateOpts));
							fauxEntry.href.hover.subhashes = [{
								key: "state",
								value: hoverSubhashObj.state,
								preEncoded: true,
							}];

							if (featurePart) {
								const featureParts = featurePart.trim().split("-");
								classStateOpts.feature = {
									ixLevel: featureParts[0] || "0",
									ixFeature: featureParts[1] || "0",
								};
							}

							const subhashObj = UrlUtil.unpackSubHash(UrlUtil.getClassesPageStatePart(classStateOpts));

							fauxEntry.href.subhashes = [
								{key: "state", value: subhashObj.state.join(HASH_SUB_LIST_SEP), preEncoded: true},
								{key: "fltsource", value: "clear"},
								{key: "flstmiscellaneous", value: "clear"},
							];
						}
						fauxEntry.href.path = "classes.html";
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					}
					case "@creature":
						fauxEntry.href.path = "bestiary.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_BESTIARY,
							source,
						};
						// ...|scaledCr}
						if (others.length) {
							const targetCrNum = Parser.crToNumber(others[0]);
							fauxEntry.href.hover.preloadId = `${VeCt.HASH_MON_SCALED}:${targetCrNum}`;
							fauxEntry.href.subhashes = [
								{key: VeCt.HASH_MON_SCALED, value: targetCrNum},
							];
							fauxEntry.text = displayText || `${name} (CR ${others[0]})`;
						}
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@disease":
					case "@curse":
					case "@itemcurse":
						fauxEntry.href.path = "afflictions.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_AFFLICTIONS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@background":
						fauxEntry.href.path = "backgrounds.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_BACKGROUNDS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@ancestry":
						fauxEntry.href.path = "ancestries.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_ANCESTRIES,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@companion":
					case "@familiar":
						fauxEntry.href.path = "companionsfamiliars.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_COMPANIONS_FAMILIARS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@feat":
						fauxEntry.href.path = "feats.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_FEATS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@hazard":
						fauxEntry.href.path = "hazards.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_HAZARDS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@variantrule":
						fauxEntry.href.path = "variantrules.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_VARIANTRULES,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@table":
						fauxEntry.href.path = "tables.html";
						fauxEntry.href.hover = {
							page: UrlUtil.PG_TABLES,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@action":
						fauxEntry.href.path = UrlUtil.PG_ACTIONS;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_ACTIONS,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@ability":
						fauxEntry.href.path = UrlUtil.PG_ABILITIES;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_ABILITIES,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@language":
						fauxEntry.href.path = UrlUtil.PG_LANGUAGES;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_LANGUAGES,
							source,
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
				}

				break;
			}
		}
	};

	this._renderString_actionCopyText = function (text) {
		switch (text.toLowerCase()) {
			case "1":
			case "a":
				return "[>]"
			case "2":
			case "d":
				return "[>>]"
			case "3":
			case "t":
				return "[>>>]"
			case "f":
				return "[F]"
			case "r":
				return "[R]"
			default:
				return "[?]"
		}
	};

	this._renderString_getLoaderTagMeta = function (text) {
		const [name, file] = Renderer.splitTagByPipe(text);
		const path = /^.*?:\/\//.test(file) ? file : `https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/${file}`;
		return {name, path};
	};

	this._renderPrimitive = function (entry, textStack, meta, options) {
		textStack[0] += entry;
	};

	this._renderLink = function (entry, textStack, meta, options) {
		let href = this._renderLink_getHref(entry);

		const metasHooks = this._getHooks("link", "ele").map(hook => hook(entry)).filter(Boolean);
		const isDisableEvents = metasHooks.some(it => it.isDisableEvents);

		if (this._isInternalLinksDisabled && entry.href.type === "internal") {
			textStack[0] += `<span class="bold" ${isDisableEvents ? "" : this._renderLink_getHoverString(entry)} ${metasHooks.map(it => it.string).join(" ")}>${this.render(entry.text)}</span>`
		} else {
			textStack[0] += `<a href="${href}" ${entry.href.type === "internal" ? "" : `target="_blank" rel="noopener noreferrer"`} ${isDisableEvents ? "" : this._renderLink_getHoverString(entry)} ${metasHooks.map(it => it.string)}>${this.render(entry.text)}</a>`;
		}
	};

	this._renderLink_getHref = function (entry) {
		let href;
		if (entry.href.type === "internal") {
			// baseURL is blank by default
			href = `${this.baseUrl}${entry.href.path}#`;
			if (entry.href.hash != null) {
				href += entry.href.hashPreEncoded ? entry.href.hash : UrlUtil.encodeForHash(entry.href.hash);
			}
			if (entry.href.subhashes != null) {
				for (let i = 0; i < entry.href.subhashes.length; ++i) {
					href += this._renderLink_getSubhashPart(entry.href.subhashes[i]);
				}
			}
		} else if (entry.href.type === "external") {
			href = entry.href.url;
		}
		return href;
	};

	this._renderLink_getSubhashPart = function (subHash) {
		let out = "";
		if (subHash.preEncoded) out += `${HASH_PART_SEP}${subHash.key}${HASH_SUB_KV_SEP}`;
		else out += `${HASH_PART_SEP}${UrlUtil.encodeForHash(subHash.key)}${HASH_SUB_KV_SEP}`;
		if (subHash.value != null) {
			if (subHash.preEncoded) out += subHash.value;
			else out += UrlUtil.encodeForHash(subHash.value);
		} else {
			// TODO allow list of values
			out += subHash.values.map(v => UrlUtil.encodeForHash(v)).join(HASH_SUB_LIST_SEP);
		}
		return out;
	};

	this._renderLink_getHoverString = function (entry) {
		if (!entry.href.hover) return "";

		let procHash = entry.href.hover.hash
			? entry.href.hover.hashPreEncoded ? entry.href.hover.hash : UrlUtil.encodeForHash(entry.href.hover.hash)
			: entry.href.hashPreEncoded ? entry.href.hash : UrlUtil.encodeForHash(entry.href.hash);
		procHash = procHash.replace(/'/g, "\\'");

		if (this._tagExportDict) {
			this._tagExportDict[procHash] = {
				page: entry.href.hover.page,
				source: entry.href.hover.source,
				hash: procHash,
			};
		}

		if (entry.href.hover.subhashes) {
			for (let i = 0; i < entry.href.hover.subhashes.length; ++i) {
				procHash += this._renderLink_getSubhashPart(entry.href.hover.subhashes[i]);
			}
		}

		if (this._isAddHandlers) return `onmouseover="Renderer.hover.pHandleLinkMouseOver(event, this, '${entry.href.hover.page}', '${entry.href.hover.source}', '${procHash}', ${entry.href.hover.preloadId ? `'${entry.href.hover.preloadId}'` : "null"})" onmouseleave="Renderer.hover.handleLinkMouseLeave(event, this)" onmousemove="Renderer.hover.handleLinkMouseMove(event, this)"  ${Renderer.hover.getPreventTouchString()}`;
		else return "";
	};

	/**
	 * Helper function to render an entity using this renderer
	 * @param entry
	 * @param depth
	 * @returns {string}
	 */
	this.render = function (entry, depth = 0) {
		const tempStack = [];
		this.recursiveRender(entry, tempStack, {depth});
		return tempStack.join("");
	};
}

Renderer.ENTRIES_WITH_ENUMERATED_TITLES = [
	{type: "section", key: "entries", depth: -1},
	{type: "entries", key: "entries", depthIncrement: 1},
	{type: "options", key: "entries"},
	{type: "inset", key: "entries", depth: 2},
	{type: "insetReadaloud", key: "entries", depth: 2},
	{type: "variant", key: "entries", depth: 2},
	{type: "variantInner", key: "entries", depth: 2},
	{type: "actions", key: "entries", depth: 2},
	{type: "flowBlock", key: "entries", depth: 2},
	{type: "optfeature", key: "entries", depthIncrement: 1},
	{type: "patron", key: "entries"},
];

Renderer.ENTRIES_WITH_CHILDREN = [
	...Renderer.ENTRIES_WITH_ENUMERATED_TITLES,
	{type: "list", key: "items"},
	{type: "table", key: "rows"},
];

Renderer.events = {
	handleClick_copyCode (evt, ele) {
		const $e = $(ele).parent().next("pre");
		MiscUtil.pCopyTextToClipboard($e.text());
		JqueryUtil.showCopiedEffect($e);
	},

	handleClick_toggleCodeWrap (evt, ele) {
		const nxt = !StorageUtil.syncGet("rendererCodeWrap");
		StorageUtil.syncSet("rendererCodeWrap", nxt);
		const $btn = $(ele).toggleClass("active", nxt);
		const $e = $btn.parent().next("pre");
		$e.toggleClass("rd__pre-wrap", nxt);
	},
};

Renderer.applyProperties = function (entry, object) {
	const propSplit = Renderer.splitByPropertyInjectors(entry);
	const len = propSplit.length;
	if (len === 1) return entry;

	let textStack = "";

	for (let i = 0; i < len; ++i) {
		const s = propSplit[i];
		if (!s) continue;
		if (s.startsWith("{=")) {
			const [path, modifiers] = s.slice(2, -1).split("/");
			let fromProp = object[path];

			if (modifiers) {
				for (const modifier of modifiers) {
					switch (modifier) {
						case "a": // render "a"/"an" depending on prop value
							fromProp = Renderer.applyProperties._leadingAn.has(fromProp[0].toLowerCase()) ? "an" : "a";
							break;

						case "l":
							fromProp = fromProp.toLowerCase();
							break; // convert text to lower case
						case "t":
							fromProp = fromProp.toTitleCase();
							break; // title-case text
						case "u":
							fromProp = fromProp.toUpperCase();
							break; // uppercase text
					}
				}
			}
			textStack += fromProp;
		} else textStack += s;
	}

	return textStack;
};
Renderer.applyProperties._leadingAn = new Set(["a", "e", "i", "o", "u"]);

Renderer.applyAllProperties = function (entries, object) {
	const handlers = {string: (str) => Renderer.applyProperties(str, object)};
	return MiscUtil.getWalker().walk(entries, handlers);
};

Renderer.attackTagToFull = function (tagStr) {
	function renderTag (tags) {
		return `${tags.includes("m") ? "Melee " : tags.includes("r") ? "Ranged " : tags.includes("g") ? "Magical " : tags.includes("a") ? "Area " : ""}${tags.includes("w") ? "Weapon " : tags.includes("s") ? "Spell " : ""}`;
	}

	const tagGroups = tagStr.toLowerCase().split(",").map(it => it.trim()).filter(it => it).map(it => it.split(""));
	if (tagGroups.length > 1) {
		const seen = new Set(tagGroups.last());
		for (let i = tagGroups.length - 2; i >= 0; --i) {
			tagGroups[i] = tagGroups[i].filter(it => {
				const out = !seen.has(it);
				seen.add(it);
				return out;
			});
		}
	}
	return `${tagGroups.map(it => renderTag(it)).join(" or ")}Attack:`;
};

Renderer.splitFirstSpace = function (string) {
	const firstIndex = string.indexOf(" ");
	return firstIndex === -1 ? [string, ""] : [string.substr(0, firstIndex), string.substr(firstIndex + 1)];
};

Renderer._splitByTagsBase = function (leadingCharacter) {
	return function (string) {
		let tagDepth = 0;
		let char, char2;
		const out = [];
		let curStr = "";
		let isLastOpen = false;

		const len = string.length;
		for (let i = 0; i < len; ++i) {
			char = string[i];
			char2 = string[i + 1];

			switch (char) {
				case "{":
					isLastOpen = true;
					if (char2 === leadingCharacter) {
						if (tagDepth++ > 0) {
							curStr += "{";
						} else {
							out.push(curStr.replace(/<VE_LEAD>/g, leadingCharacter));
							curStr = `{${leadingCharacter}`;
							++i;
						}
					} else curStr += "{";
					break;

				case "}":
					isLastOpen = false;
					curStr += "}";
					if (tagDepth !== 0 && --tagDepth === 0) {
						out.push(curStr.replace(/<VE_LEAD>/g, leadingCharacter));
						curStr = "";
					}
					break;

				case leadingCharacter: {
					if (!isLastOpen) curStr += "<VE_LEAD>";
					else curStr += leadingCharacter;
					break;
				}

				default:
					isLastOpen = false;
					curStr += char;
					break;
			}
		}

		if (curStr) out.push(curStr.replace(/<VE_LEAD>/g, leadingCharacter));

		return out;
	};
};

Renderer.splitByTags = Renderer._splitByTagsBase("@");
Renderer.splitByPropertyInjectors = Renderer._splitByTagsBase("=");

Renderer._splitByPipeBase = function (leadingCharacter) {
	return function (string) {
		let tagDepth = 0;
		let char, char2;
		const out = [];
		let curStr = "";

		const len = string.length;
		for (let i = 0; i < len; ++i) {
			char = string[i];
			char2 = string[i + 1];

			switch (char) {
				case "{":
					if (char2 === leadingCharacter) tagDepth++;
					curStr += "{";

					break;

				case "}":
					if (tagDepth) tagDepth--;
					curStr += "}";

					break;

				case "|": {
					if (tagDepth) curStr += "|";
					else {
						out.push(curStr);
						curStr = "";
					}
					break;
				}

				default: {
					curStr += char;
					break;
				}
			}
		}

		if (curStr) out.push(curStr);
		return out;
	};
};

Renderer.splitTagByPipe = Renderer._splitByPipeBase("@");

Renderer.getEntryDice = function (entry, name, isAddHandlers = true) {
	const toDisplay = Renderer.getEntryDiceDisplayText(entry);

	if (entry.rollable === true) return Renderer.getRollableEntryDice(entry, name, isAddHandlers, toDisplay);
	else return toDisplay;
};

Renderer.getRollableEntryDice = function (entry, name, isAddHandlers = true, toDisplay) {
	const toPack = MiscUtil.copy(entry);
	if (typeof toPack.toRoll !== "string") {
		// handle legacy format
		toPack.toRoll = Renderer.legacyDiceToString(toPack.toRoll);
	}

	const handlerPart = isAddHandlers ? `onmousedown="event.preventDefault()" onclick="Renderer.dice.pRollerClickUseData(event, this)" data-packed-dice='${JSON.stringify(toPack).escapeQuotes()}'` : "";

	const rollableTitlePart = isAddHandlers ? Renderer.getEntryDiceTitle(toPack.subType) : null;
	const titlePart = isAddHandlers
		? `title="${[name, rollableTitlePart].filter(Boolean).join(". ").escapeQuotes()}" ${name ? `data-roll-name="${name}"` : ""}`
		: name ? `title="${name.escapeQuotes()}" data-roll-name="${name.escapeQuotes()}"` : "";

	return `<span class="roller render-roller" ${titlePart} ${handlerPart}>${toDisplay}</span>`;
};

Renderer.getEntryDiceTitle = function (subType) {
	return `Click to roll. ${subType === "damage" ? "SHIFT to roll a critical hit, CTRL to half damage (rounding down)." : subType === "d20" ? "SHIFT to roll with advantage, CTRL to roll with disadvantage." : "SHIFT/CTRL to roll twice."}`
};

Renderer.legacyDiceToString = function (array) {
	let stack = "";
	array.forEach(r => {
		stack += `${r.neg ? "-" : stack === "" ? "" : "+"}${r.number || 1}d${r.faces}${r.mod ? r.mod > 0 ? `+${r.mod}` : r.mod : ""}`
	});
	return stack;
};

Renderer.getEntryDiceDisplayText = function (entry) {
	function getDiceAsStr () {
		if (entry.successThresh) return `${entry.successThresh} percent`;
		else if (typeof entry.toRoll === "string") return entry.toRoll;
		else {
			// handle legacy format
			return Renderer.legacyDiceToString(entry.toRoll)
		}
	}

	return entry.displayText ? entry.displayText : getDiceAsStr();
};

Renderer.parseScaleDice = function (tag, text) {
	// format: {@scaledice 2d6;3d6|2-8,9|1d6|psi} (or @scaledamage)
	const [baseRoll, progression, addPerProgress, renderMode] = Renderer.splitTagByPipe(text);
	const progressionParse = MiscUtil.parseNumberRange(progression, 1, 9);
	const baseLevel = Math.min(...progressionParse);
	const options = {};
	const isMultableDice = /^(\d+)d(\d+)$/i.exec(addPerProgress);

	const getSpacing = () => {
		let diff = null;
		const sorted = [...progressionParse].sort(SortUtil.ascSort);
		for (let i = 1; i < sorted.length; ++i) {
			const prev = sorted[i - 1];
			const curr = sorted[i];
			if (diff == null) diff = curr - prev;
			else if (curr - prev !== diff) return null;
		}
		return diff;
	};

	const spacing = getSpacing();
	progressionParse.forEach(k => {
		const offset = k - baseLevel;
		if (isMultableDice && spacing != null) {
			options[k] = offset ? `${Number(isMultableDice[1]) * (offset / spacing)}d${isMultableDice[2]}` : "";
		} else {
			options[k] = offset ? [...new Array(Math.floor(offset / spacing))].map(_ => addPerProgress).join("+") : "";
		}
	});

	const out = {
		type: "dice",
		rollable: true,
		toRoll: baseRoll,
		displayText: addPerProgress,
		prompt: {
			entry: renderMode === "psi" ? "Spend Psi Points..." : "Cast at...",
			mode: renderMode,
			options,
		},
	};
	if (tag === "@scaledamage") out.subType = "damage";

	return out;
};

Renderer.getAbilityData = function (abArr) {
	function doRenderOuter (abObj) {
		const mainAbs = [];
		const asCollection = [];
		const areNegative = [];
		const toConvertToText = [];
		const toConvertToShortText = [];

		if (abObj != null) {
			handleAllAbilities(abObj);
			handleAbilitiesChoose();
			return new Renderer._AbilityData(toConvertToText.join("; "), toConvertToShortText.join("; "), asCollection, areNegative);
		}

		return new Renderer._AbilityData("", "", [], []);

		function handleAllAbilities (abObj, targetList) {
			MiscUtil.copy(Parser.ABIL_ABVS)
				.sort((a, b) => SortUtil.ascSort(abObj[b] || 0, abObj[a] || 0))
				.forEach(shortLabel => handleAbility(abObj, shortLabel, targetList));
		}

		function handleAbility (abObj, shortLabel, optToConvertToTextStorage) {
			if (abObj[shortLabel] != null) {
				const isNegMod = abObj[shortLabel] < 0;
				const toAdd = `${shortLabel.uppercaseFirst()} ${(isNegMod ? "" : "+")}${abObj[shortLabel]}`;

				if (optToConvertToTextStorage) {
					optToConvertToTextStorage.push(toAdd);
				} else {
					toConvertToText.push(toAdd);
					toConvertToShortText.push(toAdd);
				}

				mainAbs.push(shortLabel.uppercaseFirst());
				asCollection.push(shortLabel);
				if (isNegMod) areNegative.push(shortLabel);
			}
		}

		function handleAbilitiesChoose () {
			if (abObj.choose != null) {
				const ch = abObj.choose;
				let outStack = "";
				if (ch.weighted) {
					const w = ch.weighted;
					const areIncreaseShort = [];
					const areIncrease = w.weights.filter(it => it >= 0).sort(SortUtil.ascSort).reverse().map(it => {
						areIncreaseShort.push(`+${it}`);
						return `one ability to increase by ${it}`;
					});
					const areReduceShort = [];
					const areReduce = w.weights.filter(it => it < 0).map(it => -it).sort(SortUtil.ascSort).map(it => {
						areReduceShort.push(`-${it}`);
						return `one ability to decrease by ${it}`;
					});
					const froms = w.from.map(it => it.uppercaseFirst());
					const startText = froms.length === 6
						? `Choose `
						: `From ${froms.joinConjunct(", ", " and ")} choose `;
					toConvertToText.push(`${startText}${areIncrease.concat(areReduce).joinConjunct(", ", " and ")}`);
					toConvertToShortText.push(`${froms.length === 6 ? "Any combination " : ""}${areIncreaseShort.concat(areReduceShort).join("/")}${froms.length === 6 ? "" : ` from ${froms.join("/")}`}`);
				} else {
					const allAbilities = ch.from.length === 6;
					const allAbilitiesWithParent = isAllAbilitiesWithParent(ch);
					let amount = ch.amount === undefined ? 1 : ch.amount;
					amount = (amount < 0 ? "" : "+") + amount;
					if (allAbilities) {
						outStack += "any ";
					} else if (allAbilitiesWithParent) {
						outStack += "any other ";
					}
					if (ch.count != null && ch.count > 1) {
						outStack += `${Parser.numberToText(ch.count)} `;
					}
					if (allAbilities || allAbilitiesWithParent) {
						outStack += `${ch.count > 1 ? "unique " : ""}${amount}`;
					} else {
						for (let j = 0; j < ch.from.length; ++j) {
							let suffix = "";
							if (ch.from.length > 1) {
								if (j === ch.from.length - 2) {
									suffix = " or ";
								} else if (j < ch.from.length - 2) {
									suffix = ", ";
								}
							}
							let thsAmount = ` ${amount}`;
							if (ch.from.length > 1) {
								if (j !== ch.from.length - 1) {
									thsAmount = "";
								}
							}
							outStack += ch.from[j].uppercaseFirst() + thsAmount + suffix;
						}
					}
				}

				if (outStack.trim()) {
					toConvertToText.push(`Choose ${outStack}`);
					toConvertToShortText.push(outStack.uppercaseFirst());
				}
			}
		}

		function isAllAbilitiesWithParent (chooseAbs) {
			const tempAbilities = [];
			for (let i = 0; i < mainAbs.length; ++i) {
				tempAbilities.push(mainAbs[i].toLowerCase());
			}
			for (let i = 0; i < chooseAbs.from.length; ++i) {
				const ab = chooseAbs.from[i].toLowerCase();
				if (!tempAbilities.includes(ab)) tempAbilities.push(ab);
				if (!asCollection.includes(ab.toLowerCase)) asCollection.push(ab.toLowerCase());
			}
			return tempAbilities.length === 6;
		}
	}

	const outerStack = (abArr || [null]).map(it => doRenderOuter(it));
	if (outerStack.length <= 1) return outerStack[0];
	return new Renderer._AbilityData(
		`Choose one of: ${outerStack.map((it, i) => `(${Parser.ALPHABET[i].toLowerCase()}) ${it.asText}`).join(" ")}`,
		`One from: ${outerStack.map((it, i) => `(${Parser.ALPHABET[i].toLowerCase()}) ${it.asTextShort}`).join(" ")}`,
		[...new Set(outerStack.map(it => it.asCollection).flat())],
		[...new Set(outerStack.map(it => it.areNegative).flat())],
	);
};

Renderer._AbilityData = function (asText, asTextShort, asCollection, areNegative) {
	this.asText = asText;
	this.asTextShort = asTextShort;
	this.asCollection = asCollection;
	this.areNegative = areNegative;
};

Renderer.utils = {
	getBorderTr: (optText) => {
		return `<tr><th class="border" colspan="6">${optText || ""}</th></tr>`;
	},

	getBorderDiv: (optText) => {
		return `<div class="border">${optText || ""}</div>`;
	},

	getDividerDiv: () => {
		return `<div class="pf2-stat__line"></div>`
	},

	getTraitsDiv: (traits) => {
		traits = traits || [];
		let traits_html = ``;
		for (let trait of traits) {
			let traitname = Parser.getTraitName(trait);
			let source = Parser.TRAITS_TO_TRAITS_SRC[traitname];
			let hash = `${traitname}${HASH_LIST_SEP}${source}`;
			let url = `${UrlUtil.PG_TRAITS}#${hash}`;
			let href = {
				type: "internal",
				path: "traits.html",
				hash: hash,
				hover: {
					page: UrlUtil.PG_TRAITS,
					source: source,
				},
			}
			let procHash = UrlUtil.encodeForHash(href.hash).replace(/'/g, "\\'");
			const hoverMeta = `onmouseover="Renderer.hover.pHandleLinkMouseOver(event, this, '${href.hover.page}', '${href.hover.source}', '${procHash}', ${href.hover.preloadId ? `'${href.hover.preloadId}'` : "null"})" onmouseleave="Renderer.hover.handleLinkMouseLeave(event, this)" onmousemove="Renderer.hover.handleLinkMouseMove(event, this)"  ${Renderer.hover.getPreventTouchString()}`

			let styles = "pf2-trait";
			if (traits.indexOf(trait) === 0) {
				styles += " pf2-trait--left"
			}
			if (traits.indexOf(trait) === traits.length - 1) {
				styles += " pf2-trait--right"
			}
			if (trait === "Uncommon") {
				styles += " pf2-trait--uncommon"
			} else if (trait === "Rare") {
				styles += " pf2-trait--rare"
			} else if (trait === "Unique") {
				styles += " pf2-trait--unique"
			} else if (Parser.TRAITS_SIZE.includes(trait)) {
				styles += " pf2-trait--size"
			} else if (Parser.TRAITS_ALIGN_ABV.includes(trait)) {
				styles += " pf2-trait--alignment"
			}
			traits_html += `<a href="${url}" class="${styles}" ${hoverMeta}>${trait}</a>`;
		}
		return traits_html
	},

	getNotes: (dict, exclude, dice, dice_name) => {
		if (Object.keys(dict).length > exclude.length) {
			let notes = [` (`]
			for (let key in dict) {
				if (!exclude.includes(key)) {
					if (dice) {
						notes.push(Renderer.get().render(`{@d20 ${dict[key]}||${dice_name != null ? dice_name : key}}`))
					} else notes.push(`${dict[key]}`)
					notes.push(` ${key}`)
					notes.push(`, `)
				}
			}
			notes[notes.length - 1] = ")"
			return notes.join("")
		} else return ""
	},

	getDividerTr: () => {
		return `<tr><td class="divider" colspan="6"><div></div></td></tr>`;
	},

	getSourceSubText (it) {
		return it.sourceSub ? ` \u2014 ${it.sourceSub}` : "";
	},

	/**
	 * @param it Entity to render the name row for.
	 * @param [opts] Options object.
	 * @param [opts.prefix] Prefix to display before the name.
	 * @param [opts.suffix] Suffix to display after the name.
	 * @param [opts.controlRhs] Additional control(s) to display after the name.
	 * @param [opts.extraThClasses] Additional TH classes to include.
	 * @param [opts.page] The hover page for this entity.
	 * @param [opts.asJquery] If the element should be returned as a jQuery object.
	 * @param [opts.extensionData] Additional data to pass to listening extensions when the send button is clicked.
	 * @param [opts.isEmbeddedEntity] True if this is an embedded entity, i.e. one from a `"dataX"` entry.
	 */
	getNameTr: (it, opts) => {
		opts = opts || {};

		let dataPart = "";
		let pageLinkPart;
		if (opts.page) {
			const hash = UrlUtil.URL_TO_HASH_BUILDER[opts.page](it);
			dataPart = `data-page="${opts.page}" data-source="${it.source.escapeQuotes()}" data-hash="${hash.escapeQuotes()}" ${opts.extensionData != null ? `data-extension="${`${opts.extensionData}`.escapeQuotes()}"` : ""}`;
			pageLinkPart = SourceUtil.getAdventureBookSourceHref(it.source, it.page);

			// Enable Rivet import for entities embedded in entries
			if (opts.isEmbeddedEntity) Renderer.hover.addEmbeddedToCache(opts.page, it.source, hash, MiscUtil.copy(it));
		}

		const tagPartSourceStart = `<${pageLinkPart ? `a href="${Renderer.get().baseUrl}${pageLinkPart}"` : "span"}`;
		const tagPartSourceEnd = `</${pageLinkPart ? "a" : "span"}>`;

		// Add data-page/source/hash attributes for external script use (e.g. Rivet)
		const $ele = $$`<tr>
			<th class="rnd-name ${opts.extraThClasses ? opts.extraThClasses.join(" ") : ""}" colspan="6" ${dataPart}>
				<div class="name-inner">
					<div class="flex-v-center">
						<span class="stats-name copyable" onmousedown="event.preventDefault()" onclick="Renderer.utils._pHandleNameClick(this)">${opts.prefix || ""}${it._displayName || it.name}${opts.suffix || ""}</span>
						${opts.controlRhs || ""}
						${ExtensionUtil.ACTIVE && opts.page ? `<button title="Send to Foundry (SHIFT for Temporary Import)" class="btn btn-xs btn-default btn-stats-name ml-2" onclick="ExtensionUtil.pDoSendStats(event, this)"><span class="glyphicon glyphicon-send"></span></button>` : ""}
					</div>
					<div class="stats-source flex-v-baseline">
						${tagPartSourceStart} class="help--subtle ${it.source ? `${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)}${Renderer.utils.getSourceSubText(it)}` : ""}" ${BrewUtil.sourceJsonToStyle(it.source)}>${it.source ? Parser.sourceJsonToAbv(it.source) : ""}${tagPartSourceEnd}

						${Renderer.utils.isDisplayPage(it.page) ? ` ${tagPartSourceStart} class="rd__stats-name-page ml-1" title="Page ${it.page}">p${it.page}${tagPartSourceEnd}` : ""}
					</div>
				</div>
			</th>
		</tr>`;

		if (opts.asJquery) return $ele;
		else return $ele[0].outerHTML;
	},

	getNameDiv: (it, opts) => {
		opts = opts || {};

		let dataPart = "";
		if (opts.page) {
			const hash = UrlUtil.URL_TO_HASH_BUILDER[opts.page](it);
			dataPart = `data-page="${opts.page}" data-source="${it.source.escapeQuotes()}" data-hash="${hash.escapeQuotes()}"`;
		}
		const type = opts.type != null ? opts.type : it.type || ""
		const level = opts.level != null ? `${opts.level}` : (!isNaN(Number(it.level)) || typeof it.level === "string") ? ` ${it.level}` : ""
		const activity = opts.activity ? ` ${it.activity != null && it.activity.entry.includes("@as") ? Renderer.get().render(it.activity.entry) : ``}` : ``
		const $ele = $$`<div style="display: flex" class="${opts.extraThClasses ? opts.extraThClasses.join(" ") : ""}" ${dataPart}>
			<p class="pf2-stat__name"><span class="stats-name copyable" onmousedown="event.preventDefault()" onclick="Renderer.utils._pHandleNameClick(this)">${opts.prefix || ""}${it._displayName || it.name}${opts.suffix || ""}</span>${activity}</p>
			${opts.controlRhs || ""}
			<p class="pf2-stat__name pf2-stat__name--level">${type}${level}</p>
		</div>`;
		if (opts.asJquery) return $ele;
		else return $ele[0].outerHTML;
	},

	isDisplayPage (page) {
		return page != null && ((!isNaN(page) && page > 0) || isNaN(page));
	},

	getExcludedTr (it, dataProp, page) {
		if (!ExcludeUtil.isInitialised) return "";
		const hash = page ? UrlUtil.URL_TO_HASH_BUILDER[page](it) : UrlUtil.autoEncodeHash(it);
		const isExcluded = ExcludeUtil.isExcluded(hash, dataProp, it.source);
		return isExcluded ? `<tr><td colspan="6" class="pt-3 text-center text-danger"><b><i>Warning: This content has been <a href="blacklist.html">blacklisted</a>.</i></b></td></tr>` : "";
	},

	getExcludedDiv (it, dataProp, page) {
		if (!ExcludeUtil.isInitialised) return "";
		const hash = page ? UrlUtil.URL_TO_HASH_BUILDER[page](it) : UrlUtil.autoEncodeHash(it);
		const isExcluded = ExcludeUtil.isExcluded(hash, dataProp, it.source);
		return isExcluded ? `<div class="pt-3 text-center text-danger"><b><i>Warning: This content has been <a href="blacklist.html">blacklisted</a>.</i></b></div>` : "";
	},

	getSourceAndPageTrHtml (it) {
		const html = Renderer.utils.getSourceAndPageHtml(it);
		return html ? `<b>Source:</b> ${html}` : "";
	},

	_getAltSourceHtmlOrText (it, prop, introText, isText) {
		if (!it[prop] || !it[prop].length) return "";

		return `${introText} ${it[prop].map(as => {
			if (as.entry) return Renderer.get().render(isText ? Renderer.stripTags(as.entry) : as.entry);
			return `${isText ? "" : `<i title="${Parser.sourceJsonToFull(as.source)}">`}${Parser.sourceJsonToAbv(as.source)}${isText ? "" : `</i>`}${Renderer.utils.isDisplayPage(as.page) ? `, page ${as.page}` : ""}`;
		}).join("; ")}`;
	},

	getPageP: (it) => {
		return `<p class="pf2-stat__source"><strong>${Parser.sourceJsonToFull(it.source)}</strong>, page ${it.page}.</p>`;
	},

	getSourceAndPageHtml (it) {
		return this._getSourceAndPageHtmlOrText(it);
	},
	getSourceAndPageText (it) {
		return this._getSourceAndPageHtmlOrText(it, true);
	},

	_getSourceAndPageHtmlOrText (it, isText) {
		const sourceSub = Renderer.utils.getSourceSubText(it);
		const baseText = `${isText ? `` : `<i title="${Parser.sourceJsonToFull(it.source)}${sourceSub}">`}${Parser.sourceJsonToAbv(it.source)}${sourceSub}${isText ? "" : `</i>`}${Renderer.utils.isDisplayPage(it.page) ? `, page ${it.page}` : ""}`;
		const addSourceText = Renderer.utils._getAltSourceHtmlOrText(it, "additionalSources", "Additional information from", isText);
		const otherSourceText = Renderer.utils._getAltSourceHtmlOrText(it, "otherSources", "Also found in", isText);
		const srdText = it.srd ? `Available in the ${isText ? "" : `<span title="Systems Reference Document">`}SRD${isText ? "" : `</span>`}${typeof it.srd === "string" ? ` (as &quot;${it.srd}&quot;)` : ""}` : "";
		const externalSourceText = Renderer.utils._getAltSourceHtmlOrText(it, "externalSources", "External sources:", isText);

		return `${[baseText, addSourceText, otherSourceText, srdText, externalSourceText].filter(it => it).join(". ")}${baseText && (addSourceText || otherSourceText || srdText || externalSourceText) ? "." : ""}`;
	},

	async _pHandleNameClick (ele) {
		await MiscUtil.pCopyTextToClipboard($(ele).text());
		JqueryUtil.showCopiedEffect($(ele));
	},

	getPageTr (it) {
		return `<tr><td colspan=6>${Renderer.utils.getSourceAndPageTrHtml(it)}</td></tr>`;
	},

	getAbilityRoller (statblock, ability) {
		if (statblock[ability] == null) return "\u2014";
		const mod = Parser.getAbilityModifier(statblock[ability]);
		return Renderer.get().render(`{@d20 ${mod}|${statblock[ability]} (${mod})|${Parser.attAbvToFull(ability)}}`);
	},

	tabButton: (label, funcChange, funcPopulate) => {
		return {
			label: label,
			funcChange: funcChange,
			funcPopulate: funcPopulate,
		};
	},
	_tabs: {},
	_curTab: null,
	_prevTab: null,
	bindTabButtons: (...tabButtons) => {
		Renderer.utils._tabs = {};
		Renderer.utils._prevTab = Renderer.utils._curTab;
		Renderer.utils._curTab = null;

		const $content = $("#pagecontent");
		const $wrpTab = $(`#stat-tabs`);

		$wrpTab.find(`.stat-tab-gen`).remove();

		let initialTab = null;
		const toAdd = tabButtons.map((tb, i) => {
			const toSel = (!Renderer.utils._prevTab && i === 0) || (Renderer.utils._prevTab && Renderer.utils._prevTab.label === tb.label);
			const $t = $(`<span class="ui-tab__btn-tab-head ${toSel ? `ui-tab__btn-tab-head--active` : ""} btn btn-default stat-tab-gen">${tb.label}</span>`);
			tb.$t = $t;
			$t.click(() => {
				const curTab = Renderer.utils._curTab;
				const tabs = Renderer.utils._tabs;

				if (!curTab || curTab.label !== tb.label) {
					if (curTab) curTab.$t.removeClass(`ui-tab__btn-tab-head--active`);
					Renderer.utils._curTab = tb;
					$t.addClass(`ui-tab__btn-tab-head--active`);
					if (curTab) tabs[curTab.label].content = $content.children().detach();

					tabs[tb.label] = tb;
					if (!tabs[tb.label].content && tb.funcPopulate) {
						tb.funcPopulate();
					} else {
						$content.append(tabs[tb.label].content);
					}
					if (tb.funcChange) tb.funcChange();
				}
			});
			if (Renderer.utils._prevTab && Renderer.utils._prevTab.label === tb.label) initialTab = $t;
			return $t;
		});

		if (tabButtons.length !== 1) toAdd.reverse().forEach($t => $wrpTab.prepend($t));
		(initialTab || toAdd[toAdd.length - 1]).click();
	},

	_pronounceButtonsBound: false,
	bindPronounceButtons () {
		if (Renderer.utils._pronounceButtonsBound) return;
		Renderer.utils._pronounceButtonsBound = true;
		$(`body`).on("click", ".btn-name-pronounce", function () {
			const audio = $(this).find(`.name-pronounce`)[0];
			audio.currentTime = 0;
			audio.play();
		});
	},

	/**
	 * @param entry Data entry to search for fluff on, e.g. a creature
	 * @param prop The fluff index reference prop, e.g. `"monsterFluff"`
	 */
	getPredefinedFluff (entry, prop) {
		if (!entry.fluff) return null;

		const mappedProp = `_${prop}`;
		const mappedPropAppend = `_append${prop.uppercaseFirst()}`;
		const fluff = {};

		const assignPropsIfExist = (fromObj, ...props) => {
			props.forEach(prop => {
				if (fromObj[prop]) fluff[prop] = fromObj[prop];
			});
		};

		assignPropsIfExist(entry.fluff, "name", "type", "entries", "images");

		if (entry.fluff[mappedProp]) {
			const fromList = (BrewUtil.homebrew[prop] || []).find(it =>
				it.name === entry.fluff[mappedProp].name
				&& it.source === entry.fluff[mappedProp].source,
			);
			if (fromList) {
				assignPropsIfExist(fromList, "name", "type", "entries", "images");
			}
		}

		if (entry.fluff[mappedPropAppend]) {
			const fromList = (BrewUtil.homebrew[prop] || []).find(it => it.name === entry.fluff[mappedPropAppend].name && it.source === entry.fluff[mappedPropAppend].source);
			if (fromList) {
				if (fromList.entries) {
					fluff.entries = MiscUtil.copy(fluff.entries || []);
					fluff.entries.push(...MiscUtil.copy(fromList.entries));
				}
				if (fromList.images) {
					fluff.images = MiscUtil.copy(fluff.images || []);
					fluff.images.push(...MiscUtil.copy(fromList.images));
				}
			}
		}

		return fluff;
	},

	async pGetFluff ({entity, pFnPostProcess, fluffUrl, fluffBaseUrl, fluffProp} = {}) {
		let predefinedFluff = Renderer.utils.getPredefinedFluff(entity, fluffProp);
		if (predefinedFluff) {
			if (pFnPostProcess) predefinedFluff = await pFnPostProcess(predefinedFluff);
			return predefinedFluff;
		}
		if (!fluffBaseUrl && !fluffUrl) return null;

		const fluffIndex = fluffBaseUrl ? await DataUtil.loadJSON(`${Renderer.get().baseUrl}${fluffBaseUrl}fluff-index.json`) : null;
		if (fluffIndex && !fluffIndex[entity.source]) return null;

		const data = fluffIndex && fluffIndex[entity.source]
			? await DataUtil.loadJSON(`${Renderer.get().baseUrl}${fluffBaseUrl}${fluffIndex[entity.source]}`)
			: await DataUtil.loadJSON(`${Renderer.get().baseUrl}${fluffUrl}`);
		if (!data) return null;

		let fluff = (data[fluffProp] || []).find(it => it.name === entity.name && it.source === entity.source);
		if (!fluff) return null;

		// Avoid modifying the original object
		if (pFnPostProcess) fluff = await pFnPostProcess(fluff);
		return fluff;
	},

	_TITLE_SKIP_TYPES: new Set(["entries", "section"]),
	/**
	 * @param {isImageTab} True if this is the "Images" tab, false otherwise
	 * @param {$content} The statblock wrapper
	 * @param {entity} Entity to build tab for (e.g. a creature; an item)
	 * @param {pFnGetFluff} Function which gets the entity's fluff.
	 */
	async pBuildFluffTab ({isImageTab, $content, entity, $headerControls, pFnGetFluff} = {}) {
		const renderer = Renderer.get();

		$content.append(Renderer.utils.getBorderTr());
		$content.append(Renderer.utils.getNameTr(entity, {controlRhs: $headerControls, asJquery: true}));
		const $td = $(`<td colspan="6" class="text"></td>`);
		$$`<tr class="text">${$td}</tr>`.appendTo($content);
		$content.append(Renderer.utils.getBorderTr());

		const fluff = MiscUtil.copy((await pFnGetFluff(entity)) || {});
		fluff.entries = fluff.entries || [Renderer.utils.HTML_NO_INFO];
		fluff.images = fluff.images || [Renderer.utils.HTML_NO_IMAGES];

		renderer.setFirstSection(true);
		const renderedText = fluff[isImageTab ? "images" : "entries"].map((ent, i) => {
			if (isImageTab) return `<p>${renderer.render(ent)}</p>`;

			// If the first entry has a name, and it matches the name of the statblock, remove it to avoid having two
			//   of the same title stacked on top of each other.
			if (i === 0 && ent.name && entity.name && (Renderer.utils._TITLE_SKIP_TYPES).has(ent.type)) {
				const entryLowName = ent.name.toLowerCase().trim();
				const entityLowName = entity.name.toLowerCase().trim();

				if (entryLowName.includes(entityLowName) || entityLowName.includes(entryLowName)) {
					const cpy = MiscUtil.copy(ent);
					delete cpy.name;
					return renderer.render(cpy);
				} else return renderer.render(ent);
			} else {
				if (typeof ent === "string") return `<p>${renderer.render(ent)}</p>`;
				else return renderer.render(ent);
			}
		}).join("");
		$td.fastSetHtml(renderedText);
	},

	async pGetQuickRules (prop) {
		const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/quickrules.json`);
		const renderer = Renderer.get().setFirstSection(true);
		const toRender = data[prop];
		const textStack = [""];
		renderer.recursiveRender(toRender.entries, textStack, {depth: 1}, {prefix: "<p class='pf2-p'>", suffix: "</p>"});
		return $$`${textStack.join("")}${Renderer.utils.getPageP(toRender)}`;
	},

	HTML_NO_INFO: "<i>No information available.</i>",
	HTML_NO_IMAGES: "<i>No images available.</i>",

	_prereqWeights: {
		level: 0,
		pact: 1,
		patron: 2,
		spell: 3,
		race: 4,
		ability: 5,
		proficiency: 6,
		spellcasting: 7,
		feature: 8,
		item: 9,
		other: 10,
		otherSummary: 11,
		[undefined]: 12,
	},
	_getPrerequisiteText_getShortClassName (className) {
		// remove all the vowels except the first
		const ixFirstVowel = /[aeiou]/.exec(className).index;
		const start = className.slice(0, ixFirstVowel + 1);
		let end = className.slice(ixFirstVowel + 1);
		end = end.replace().replace(/[aeiou]/g, "");
		return `${start}${end}`.toTitleCase();
	},
	getPrerequisiteText: (prerequisites, isListMode = false, blacklistKeys = new Set()) => {
		if (!prerequisites) return isListMode ? "\u2014" : "";

		const listOfChoices = prerequisites.map(pr => {
			return Object.entries(pr)
				.sort(([kA], [kB]) => Renderer.utils._prereqWeights[kA] - Renderer.utils._prereqWeights[kB])
				.map(([k, v]) => {
					if (blacklistKeys.has(k)) return false;

					switch (k) {
						case "level": {
							// a generic level requirement (as of 2020-03-11, homebrew only)
							if (typeof v === "number") {
								if (isListMode) return `Lvl ${v}`
								else return `${Parser.getOrdinalForm(v)} level`
							} else if (!v.class && !v.subclass) {
								if (isListMode) return `Lvl ${v.level}`
								else return `${Parser.getOrdinalForm(v.level)} level`
							}

							const isSubclassVisible = v.subclass && v.subclass.visible;
							const isClassVisible = v.class && (v.class.visible || isSubclassVisible); // force the class name to be displayed if there's a subclass being displayed
							if (isListMode) {
								const shortNameRaw = isClassVisible ? Renderer.utils._getPrerequisiteText_getShortClassName(v.class.name) : null;
								return `${isClassVisible ? `${shortNameRaw.slice(0, 4)}${isSubclassVisible ? "*" : "."} ` : ""} Lvl ${v.level}`
							} else {
								let classPart = "";
								if (isClassVisible && isSubclassVisible) classPart = ` ${v.class.name} (${v.subclass.name})`;
								else if (isClassVisible) classPart = ` ${v.class.name}`;
								else if (isSubclassVisible) classPart = ` &lt;remember to insert class name here&gt; (${v.subclass.name})`; // :^)
								return `${Parser.getOrdinalForm(v.level)} level${isClassVisible ? ` ${classPart}` : ""}`
							}
						}
						case "pact":
							return Parser.prereqPactToFull(v);
						case "patron":
							return isListMode ? `${Parser.prereqPatronToShort(v)} patron` : `${v} patron`;
						case "spell":
							return isListMode
								? v.map(x => x.split("#")[0].split("|")[0].toTitleCase()).join("/")
								: v.map(sp => Parser.prereqSpellToFull(sp)).joinConjunct(", ", " or ");
						case "feature":
							return isListMode ? v.map(x => x.toTitleCase()).join("/") : v.joinConjunct(", ", " or ");
						case "item":
							return isListMode ? v.map(x => x.toTitleCase()).join("/") : v.joinConjunct(", ", " or ");
						case "otherSummary":
							return isListMode ? (v.entrySummary || Renderer.stripTags(v.entry)) : Renderer.get().render(v.entry);
						case "other":
							return isListMode ? "Special" : Renderer.get().render(v);
						case "race": {
							const parts = v.map((it, i) => {
								if (isListMode) {
									return `${it.name.toTitleCase()}${it.subrace != null ? ` (${it.subrace})` : ""}`;
								} else {
									const raceName = it.displayEntry ? Renderer.get().render(it.displayEntry) : i === 0 ? it.name.toTitleCase() : it.name;
									return `${raceName}${it.subrace != null ? ` (${it.subrace})` : ""}`;
								}
							});
							return isListMode ? parts.join("/") : parts.joinConjunct(", ", " or ");
						}
						case "ability": {
							// `v` is an array or objects with str/dex/... properties; array is "OR"'d togther, object is "AND"'d together

							let hadMultipleInner = false;
							let hadMultiMultipleInner = false;
							let allValuesEqual = null;

							outer: for (const abMeta of v) {
								for (const req of Object.values(abMeta)) {
									if (allValuesEqual == null) allValuesEqual = req;
									else {
										if (req !== allValuesEqual) {
											allValuesEqual = null;
											break outer;
										}
									}
								}
							}

							const abilityOptions = v.map(abMeta => {
								if (allValuesEqual) {
									const abList = Object.keys(abMeta);
									hadMultipleInner = hadMultipleInner || abList.length > 1;
									return isListMode ? abList.map(ab => ab.uppercaseFirst()).join(", ") : abList.map(ab => Parser.attAbvToFull(ab)).joinConjunct(", ", " and ");
								} else {
									const groups = {};

									Object.entries(abMeta).forEach(([ab, req]) => {
										(groups[req] = groups[req] || []).push(ab);
									});

									let isMulti = false;
									const byScore = Object.entries(groups)
										.sort(([reqA], [reqB]) => SortUtil.ascSort(Number(reqB), Number(reqA)))
										.map(([req, abs]) => {
											hadMultipleInner = hadMultipleInner || abs.length > 1;
											if (abs.length > 1) hadMultiMultipleInner = isMulti = true;

											abs = abs.sort(SortUtil.ascSortAtts);
											return isListMode
												? `${abs.map(ab => ab.uppercaseFirst()).join(", ")} ${req}+`
												: `${abs.map(ab => Parser.attAbvToFull(ab)).joinConjunct(", ", " and ")} ${req} or higher`;
										});

									return isListMode
										? `${isMulti || byScore.length > 1 ? "(" : ""}${byScore.join(" & ")}${isMulti || byScore.length > 1 ? ")" : ""}`
										: isMulti ? byScore.joinConjunct("; ", " and ") : byScore.joinConjunct(", ", " and ");
								}
							});

							// if all values were equal, add the "X+" text at the end, as the options render doesn't include it
							if (isListMode) {
								return `${abilityOptions.join("/")}${allValuesEqual != null ? ` ${allValuesEqual}+` : ""}`
							} else {
								const isComplex = hadMultiMultipleInner || hadMultipleInner || allValuesEqual == null;
								const joined = abilityOptions.joinConjunct(
									hadMultiMultipleInner ? " - " : hadMultipleInner ? "; " : ", ",
									isComplex ? ` <i>or</i> ` : " or ",
								);
								return `${joined}${allValuesEqual != null ? ` ${allValuesEqual} or higher` : ""}`
							}
						}
						case "proficiency": {
							const parts = v.map(obj => {
								return Object.entries(obj).map(([profType, prof]) => {
									switch (profType) {
										case "armor": {
											return isListMode ? `Prof ${Parser.armorFullToAbv(prof)} armor` : `Proficiency with ${prof} armor`;
										}
										case "weapon": {
											return isListMode ? `Prof ${Parser.weaponFullToAbv(prof)} weapon` : `Proficiency with a ${prof} weapon`;
										}
										default:
											throw new Error(`Unhandled proficiency type: "${profType}"`);
									}
								})
							});
							return isListMode ? parts.join("/") : parts.joinConjunct(", ", " or ");
						}
						case "spellcasting":
							return isListMode ? "Spellcasting" : "The ability to cast at least one spell";
						default:
							throw new Error(`Unhandled key: ${k}`);
					}
				})
				.filter(Boolean)
				.join(", ");
		}).filter(Boolean);

		if (!listOfChoices.length) return isListMode ? "\u2014" : "";
		return isListMode ? listOfChoices.join("/") : `Prerequisites: ${listOfChoices.joinConjunct("; ", " or ")}`;
	},

	getMediaUrl (entry, prop, mediaDir) {
		if (!entry[prop]) return "";

		let href = "";
		if (entry[prop].type === "internal") {
			const baseUrl = Renderer.get().baseMediaUrls[mediaDir] || Renderer.get().baseUrl;
			const mediaPart = `${mediaDir}/${entry[prop].path}`;
			href = baseUrl !== "" ? `${baseUrl}${mediaPart}` : UrlUtil.link(mediaPart);
		} else if (entry[prop].type === "external") {
			href = entry[prop].url;
		}
		return href;
	},
};

Renderer.feat = {
	getSubHead (feat) {
		const renderStack = [];
		const renderer = Renderer.get()
		if (feat.prerequisites != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Prerequisites </strong>${renderer.render(feat.prerequisites)}</p>`);
		}
		if (feat.frequency != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Frequency </strong>${renderer.render(feat.frequency)}</p>`);
		}
		if (feat.trigger != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Trigger </strong>${renderer.render(feat.trigger)}</p>`);
		}
		if (feat.cost != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Cost </strong>${renderer.render(feat.cost)}</p>`);
		}
		if (feat.requirements != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Requirements </strong>${renderer.render(feat.requirements)}</p>`);
		}
		if (renderStack.length !== 0) renderStack.push(`${Renderer.utils.getDividerDiv()}`)
		return renderStack.join("");
	},

	getSpecial (feat) {
		if (feat.special != null) {
			return `<p><strong>Special </strong>${feat.special}</p>`
		} else return ``
	},

	getCompactRenderedString (feat) {
		const renderer = Renderer.get();
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getExcludedDiv(feat, "feat", UrlUtil.PG_FEATS)}
			${Renderer.utils.getNameDiv(feat, {page: UrlUtil.PG_FEATS, type: "FEAT", activity: true})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(feat.traits)}
			${Renderer.feat.getSubHead(feat)}
		`);
		renderer.recursiveRender(feat.entries, renderStack, {depth: 2}, {pf2StatFix: true});
		renderStack.push(Renderer.feat.getSpecial(feat))
		renderStack.push(Renderer.utils.getPageP(feat))

		return renderStack.join("");
	},
};

Renderer.get = () => {
	if (!Renderer.defaultRenderer) Renderer.defaultRenderer = new Renderer();
	return Renderer.defaultRenderer;
};

Renderer.spell = {
	getCompactRenderedString (spell) {
		const renderer = Renderer.get();
		const renderStack = [];
		renderer.setFirstSection(true);
		const level = spell.type === "CANTRIP" ? " 1" : ` ${spell.level}`;

		renderStack.push(`
		${Renderer.utils.getExcludedDiv(spell, "spell", UrlUtil.PG_SPELLS)}
		${Renderer.utils.getNameDiv(spell, {page: UrlUtil.PG_SPELLS, level: level})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(spell.traits)}`);

		if (spell.traditions !== null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Traditions </strong>${spell.traditions.join(", ").toLowerCase()}</p>`);
		} else if (spell.domain !== null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Domain </strong>${spell.domain.toLowerCase()}</p>`);
		}
		let components = ``;
		let components_list = [];
		if (spell.components.F) {
			components_list.push("focus")
		}
		if (spell.components.M) {
			components_list.push("material")
		}
		if (spell.components.S) {
			components_list.push("somatic")
		}
		if (spell.components.V) {
			components_list.push("verbal")
		}
		components = components_list.join(", ")
		let cast = ``
		let castStack = []
		renderer.recursiveRender(spell.cast.entry, castStack, {depth: 1}, {prefix: `<span>`, suffix: `</span>`})
		cast = castStack.join("")
		if (!Parser.TIME_ACTIONS.includes(spell.cast.unit) && components.length) {
			components = `(${components})`
		}

		let cst_tr_req = ``;
		if (spell.cost !== null) {
			cst_tr_req = `; <strong>Cost </strong>${spell.cost}`;
		}
		if (spell.trigger !== null) {
			cst_tr_req += `; <strong>Trigger </strong>${spell.trigger}`;
		}
		if (spell.requirements !== null) {
			cst_tr_req += `; <strong>Requirements </strong>${spell.requirements}`;
		}
		renderStack.push(`<p class="pf2-stat__section"><strong>Cast </strong>${cast} ${components}${cst_tr_req}</p>`);

		let rg_ar_tg = ``;
		if (spell.range.type !== null) {
			rg_ar_tg = `<strong>Range </strong>${spell.range.entry}`
		}
		if (spell.area !== null) {
			if (rg_ar_tg === ``) {
				rg_ar_tg = `<strong>Area </strong>${spell.area.entry}`
			} else {
				rg_ar_tg += `; <strong>Area </strong>${spell.area.entry}`
			}
		}
		if (spell.targets !== null) {
			if (rg_ar_tg === ``) {
				rg_ar_tg = `<strong>Targets </strong>${spell.targets}`
			} else {
				rg_ar_tg += `; <strong>Targets </strong>${spell.targets}`
			}
		}
		if (rg_ar_tg !== ``) {
			renderStack.push(`<p class="pf2-stat__section">${rg_ar_tg}</p>`);
		}

		let st_dr = ``
		let basic = ``
		if (spell.saving_throw_basic) {
			basic = `basic `
		}
		if (spell.saving_throw !== null) {
			st_dr = `<strong>Saving Throw </strong>${basic}${spell.saving_throw}`
		}
		if (spell.duration["type"] !== null) {
			if (st_dr === ``) {
				st_dr = `<strong>Duration </strong>${spell.duration["entry"]}`
			} else {
				st_dr += `; <strong>Duration </strong>${spell.duration["entry"]}`
			}
		}
		if (st_dr !== ``) {
			renderStack.push(`<p class="pf2-stat__section">${st_dr}</p>`);
		}

		renderStack.push(Renderer.utils.getDividerDiv());

		renderer.recursiveRender(spell.entries, renderStack, {depth: 1}, {pf2StatFix: true});

		if (spell.heightened.heightened) {
			renderStack.push(Renderer.utils.getDividerDiv())
			if (spell.heightened.plus_x !== null) {
				renderStack.push(`<p class="pf2-stat__section"><strong>Heightened (+${spell.heightened.plus_x.level}) </strong>`)
				renderer.recursiveRender(spell.heightened.plus_x.entry, renderStack, {depth: 1})
				renderStack.push(`</p>`)
			}
			if (spell.heightened.x !== null) {
				for (let x of spell.heightened.x) {
					renderStack.push(`<p class="pf2-stat__section"><strong>Heightened (${Parser.getOrdinalForm(x.level)}) </strong>`)
					renderer.recursiveRender(x.entry, renderStack, {depth: 1})
					renderStack.push(`</p>`)
				}
			}
			if (spell.heightened.no_x !== null) {
				renderStack.push(`<p class="pf2-stat__section"><strong>Heightened </strong>`)
				renderer.recursiveRender(spell.heightened.no_x.entry, renderStack, {depth: 1})
				renderStack.push(`</p>`)
			}
		}
		renderStack.push(Renderer.utils.getPageP(spell));
		return renderStack.join("");
	},

	pGetFluff (sp) {
		return Renderer.utils.pGetFluff({
			entity: sp,
			fluffBaseUrl: `data/spells/`,
			fluffProp: "spellFluff",
		});
	},
};

Renderer.condition = {
	getCompactRenderedString (cond) {
		const renderer = Renderer.get();
		const renderStack = [];
		renderer.setFirstSection(true);

		renderStack.push(`${Renderer.utils.getExcludedDiv(cond, cond.__prop || cond._type, UrlUtil.PG_CONDITIONS)}`)
		renderStack.push(`
			${Renderer.utils.getNameDiv(cond, {page: UrlUtil.PG_CONDITIONS, type: "condition"})}
			${Renderer.utils.getDividerDiv()}
		`);
		renderer.recursiveRender(cond.entries, renderStack, {depth: 1}, {pf2StatFix: true});

		return renderStack.join("");
	},
};

Renderer.affliction = {
	getCompactRenderedString (affliction) {
		const renderer = Renderer.get();
		const renderStack = [];
		renderer.setFirstSection(true);
		const rLvl = isNaN(Number(affliction.level)) ? `, ${affliction.level}` : ` ${affliction.level}`;

		renderStack.push(`${Renderer.utils.getExcludedDiv(affliction, affliction.__prop || affliction._type, UrlUtil.PG_AFFLICTIONS)}`)
		renderStack.push(`
			${Renderer.utils.getNameDiv(affliction, {page: UrlUtil.PG_AFFLICTIONS, level: rLvl})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(affliction.traits || [])}
		`);
		renderer.recursiveRender(affliction.entries, renderStack, {depth: 1}, {pf2StatFix: true});
		renderStack.push(Renderer.utils.getPageP(affliction))

		return renderStack.join("");
	},
};

Renderer.trait = {
	getRenderedString (trait) {
		const renderer = Renderer.get();
		const renderStack = [];
		renderer.setFirstSection(true);
		renderStack.push(`${Renderer.utils.getExcludedDiv(trait, "trait", UrlUtil.PG_TRAITS)}`)
		renderStack.push(`
			${Renderer.utils.getNameDiv(trait, {page: UrlUtil.PG_TRAITS})}
			${Renderer.utils.getDividerDiv()}
		`);
		renderer.recursiveRender(trait.entries, renderStack, {depth: 1}, {pf2StatFix: true});

		return renderStack.join("");
	},
};

Renderer.background = {
	getCompactRenderedString (bg) {
		return `
		${Renderer.utils.getExcludedTr(bg, "background", UrlUtil.PG_BACKGROUNDS)}
		${Renderer.utils.getNameTr(bg, {page: UrlUtil.PG_BACKGROUNDS})}
		<tr class="text"><td colspan="6">
		${Renderer.get().render({type: "entries", entries: bg.entries})}
		</td></tr>
		`;
	},

	_summariseProfs (profGroupArr, short, collectIn, hoverTag) {
		if (!profGroupArr) return "";

		function getEntry (s) {
			return short ? s.toTitleCase() : hoverTag ? `{@${hoverTag} ${s.toTitleCase()}}` : s.toTitleCase();
		}

		function sortKeys (a, b) {
			if (a === b) return 0;
			if (a === "choose") return 1;
			if (b === "choose") return -1;
			return SortUtil.ascSort(a, b);
		}

		return profGroupArr.map(profGroup => {
			let sep = ", ";
			const toJoin = Object.keys(profGroup).sort(sortKeys).filter(k => profGroup[k]).map((k, i) => {
				if (k === "choose") {
					sep = "; ";
					const choose = profGroup[k];
					const chooseProfs = choose.from.map(s => {
						collectIn && !collectIn.includes(s) && collectIn.push(s);
						return getEntry(s);
					});
					return `${short ? `${i === 0 ? "C" : "c"}hoose ` : ""}${choose.count || 1} ${short ? `of` : `from`} ${chooseProfs.joinConjunct(", ", " or ")}`;
				} else {
					collectIn && !collectIn.includes(k) && collectIn.push(k);
					return getEntry(k);
				}
			});
			return toJoin.join(sep);
		}).join(" <i>or</i> ");
	},

	pGetFluff (bg) {
		return Renderer.utils.pGetFluff({
			entity: bg,
			fluffUrl: "data/fluff-backgrounds.json",
			fluffProp: "backgroundFluff",
		});
	},
};

Renderer.ancestry = {
	getCompactRenderedString (race) {
		const renderer = Renderer.get();
		const renderStack = [];

		const ability = Renderer.getAbilityData(race.ability);
		renderStack.push(`
			${Renderer.utils.getExcludedTr(race, "ancestry", UrlUtil.PG_ANCESTRIES)}
			${Renderer.utils.getNameTr(race, {page: UrlUtil.PG_ANCESTRIES})}
			${!race._isBaseRace ? `
			<tr><td colspan="6">
				<table class="summary stripe-even-table">
					<tr>
						<th class="col-4 text-center">Ability Scores</th>
						<th class="col-4 text-center">Size</th>
						<th class="col-4 text-center">Speed</th>
					</tr>
					<tr>
						<td class="text-center">${ability.asText}</td>
						<td class="text-center">${Parser.sizeAbvToFull(race.size)}</td>
						<td class="text-center">${Parser.getSpeedString(race)}</td>
					</tr>
				</table>
			</td></tr>` : ""}
			<tr class="text"><td colspan="6">
		`);
		race._isBaseRace
			? renderer.recursiveRender({type: "entries", entries: race._baseRaceEntries}, renderStack, {depth: 1})
			: renderer.recursiveRender({type: "entries", entries: race.entries}, renderStack, {depth: 1});
		renderStack.push("</td></tr>");

		return renderStack.join("");
	},

	/**
	 * @param races
	 * @param [opts] Options object.
	 * @param [opts.isAddBaseRaces] If an entity should be created for each base ancestry.
	 */
	mergeSubraces (races, opts) {
		opts = opts || {};

		const out = [];
		races.forEach(r => {
			if (r.subraces && !r.subraces.length) delete r.subraces;

			if (r.subraces) {
				r.subraces.forEach(sr => {
					sr.source = sr.source || r.source;
					sr._isSubRace = true;
				});

				r.subraces.sort((a, b) => SortUtil.ascSortLower(a.name || "_", b.name || "_") || SortUtil.ascSortLower(Parser.sourceJsonToAbv(a.source), Parser.sourceJsonToAbv(b.source)));
			}

			if (opts.isAddBaseRaces && r.subraces) {
				const baseRace = MiscUtil.copy(r);

				baseRace._isBaseRace = true;

				const isAnyNoName = r.subraces.some(it => !it.name);
				if (isAnyNoName) {
					baseRace._rawName = baseRace.name;
					baseRace.name = `${baseRace.name} (Base)`;
				}

				const nameCounts = {};
				r.subraces.filter(sr => sr.name).forEach(sr => nameCounts[sr.name.toLowerCase()] = (nameCounts[sr.name.toLowerCase()] || 0) + 1);
				nameCounts._ = r.subraces.filter(sr => !sr.name).length;

				const lst = {
					type: "list",
					items: r.subraces.map(sr => {
						const count = nameCounts[(sr.name || "_").toLowerCase()];
						const idName = Renderer.ancestry._getSubraceName(r.name, sr.name);
						return `{@race ${idName}|${sr.source}${count > 1 ? `|${idName} (<span title="${Parser.sourceJsonToFull(sr.source).escapeQuotes()}">${Parser.sourceJsonToAbv(sr.source)}</span>)` : ""}}`;
					}),
				};

				baseRace._baseRaceEntries = [
					{
						type: "section",
						entries: [
							"This ancestry has multiple subraces, as listed below:",
							lst,
						],
					},
					{
						type: "section",
						entries: [
							{
								type: "entries",
								entries: [
									{
										type: "entries",
										name: "Traits",
										entries: [
											...MiscUtil.copy(baseRace.entries),
										],
									},
								],
							},
						],
					},
				];

				delete baseRace.subraces;

				out.push(baseRace);
			}

			out.push(...Renderer.ancestry._mergeSubraces(r));
		});

		return out;
	},

	_getSubraceName (raceName, subraceName) {
		if (!subraceName) return raceName;

		const mBrackets = /^(.*?)(\(.*?\))$/i.exec(raceName || "");
		if (!mBrackets) return `${raceName} (${subraceName})`;

		const bracketPart = mBrackets[2].substring(1, mBrackets[2].length - 1);
		return `${mBrackets[1]}(${[bracketPart, subraceName].join("; ")})`;
	},

	_mergeSubraces (race) {
		if (!race.subraces) return [race];
		return MiscUtil.copy(race.subraces).map(s => Renderer.ancestry._getMergedSubrace(race, s));
	},

	_getMergedSubrace (race, s) {
		const cpy = MiscUtil.copy(race);
		cpy._baseName = cpy.name;
		cpy._baseSource = cpy.source;
		cpy._baseSrd = cpy.srd;
		delete cpy.subraces;
		delete cpy.srd;

		// merge names, abilities, entries, tags
		if (s.name) {
			cpy._subraceName = s.name;

			if (s.alias) {
				cpy.alias = s.alias.map(it => Renderer.ancestry._getSubraceName(cpy.name, it));
				delete s.alias;
			}

			cpy.name = Renderer.ancestry._getSubraceName(cpy.name, s.name);
			delete s.name;
		}
		if (s.ability) {
			// If the base ancestry doesn't have any ability scores, make a set of empty records
			if ((s.overwrite && s.overwrite.ability) || !cpy.ability) cpy.ability = s.ability.map(() => ({}));

			if (cpy.ability.length !== s.ability.length) throw new Error(`Race and subrace ability array lengths did not match!`);
			s.ability.forEach((obj, i) => Object.assign(cpy.ability[i], obj));
			delete s.ability;
		}
		if (s.entries) {
			s.entries.forEach(e => {
				if (e.data && e.data.overwrite) {
					const toOverwrite = cpy.entries.findIndex(it => it.name.toLowerCase().trim() === e.data.overwrite.toLowerCase().trim());
					if (~toOverwrite) cpy.entries[toOverwrite] = e;
					else cpy.entries.push(e);
				} else {
					cpy.entries.push(e);
				}
			});
			delete s.entries;
		}

		if (s.traitTags) {
			if (s.overwrite && s.overwrite.traitTags) cpy.traitTags = s.traitTags;
			else cpy.traitTags = (cpy.traitTags || []).concat(s.traitTags);
			delete s.traitTags;
		}

		if (s.languageProficiencies) {
			if (s.overwrite && s.overwrite.languageProficiencies) cpy.languageProficiencies = s.languageProficiencies;
			else cpy.languageProficiencies = cpy.languageProficiencies = (cpy.languageProficiencies || []).concat(s.languageProficiencies);
			delete s.languageProficiencies;
		}

		// TODO make a generalised merge system? Probably have one of those lying around somewhere [bestiary schema?]
		if (s.skillProficiencies) {
			// Overwrite if possible
			if (!cpy.skillProficiencies || (s.overwrite && s.overwrite["skillProficiencies"])) cpy.skillProficiencies = s.skillProficiencies;
			else {
				if (!s.skillProficiencies.length || !cpy.skillProficiencies.length) throw new Error(`No items!`);
				if (s.skillProficiencies.length > 1 || cpy.skillProficiencies.length > 1) throw new Error(`Subrace merging does not handle choices!`); // Implement if required

				// Otherwise, merge
				if (s.skillProficiencies.choose) {
					if (cpy.skillProficiencies.choose) throw new Error(`Subrace choose merging is not supported!!`); // Implement if required
					cpy.skillProficiencies.choose = s.skillProficiencies.choose;
					delete s.skillProficiencies.choose;
				}
				Object.assign(cpy.skillProficiencies[0], s.skillProficiencies[0]);
			}

			delete s.skillProficiencies;
		}

		// overwrite everything else
		Object.assign(cpy, s);

		// For any null'd out fields on the subrace, delete the field
		Object.entries(cpy)
			.forEach(([k, v]) => {
				if (v != null) return;
				delete cpy[k];
			});

		return cpy;
	},

	adoptSubraces (allRaces, subraces) {
		const nxtData = [];

		subraces.forEach(sr => {
			if (!sr.race || !sr.race.name || !sr.race.source) throw new Error(`Subrace was missing parent race!`);

			const _baseRace = allRaces.find(r => r.name === sr.race.name && r.source === sr.race.source);
			if (!_baseRace) throw new Error(`Could not find parent race for subrace!`);

			const subraceListEntry = ((_baseRace._baseRaceEntries[0] || {}).entries || []).find(it => it.type === "list");
			subraceListEntry.items.push(`{@race ${_baseRace._rawName || _baseRace.name} (${sr.name})|${sr.source || _baseRace.source}}`);

			// Attempt to graft multiple subraces from the same data set onto the same base ancestry copy
			let baseRace = nxtData.find(r => r.name === sr.race.name && r.source === sr.race.source);
			if (!baseRace) {
				// copy and remove base-ancestry-specific data
				baseRace = MiscUtil.copy(_baseRace);
				if (baseRace._rawName) {
					baseRace.name = baseRace._rawName;
					delete baseRace._rawName;
				}
				delete baseRace._isBaseRace;
				delete baseRace._baseRaceEntries;

				nxtData.push(baseRace);
			}

			baseRace.subraces = baseRace.subraces || [];
			baseRace.subraces.push(sr);
		});

		return nxtData;
	},

	async pPostProcessFluff (race, raceFluff) {
		if (!(raceFluff.uncommon || raceFluff.monstrous)) return raceFluff;

		raceFluff = MiscUtil.copy(raceFluff);

		const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/fluff-races.json`);

		if (raceFluff.uncommon) {
			raceFluff.entries = raceFluff.entries || [];
			raceFluff.entries.push(MiscUtil.copy(data.raceFluffMeta.uncommon));
		}

		if (raceFluff.monstrous) {
			raceFluff.entries = raceFluff.entries || [];
			raceFluff.entries.push(MiscUtil.copy(data.raceFluffMeta.monstrous));
		}

		return raceFluff;
	},

	pGetFluff (race) {
		return Renderer.utils.pGetFluff({
			entity: race,
			fluffProp: "raceFluff",
			fluffUrl: `data/fluff-races.json`,
			pFnPostProcess: Renderer.ancestry.pPostProcessFluff.bind(null, race),
		});
	},
};

Renderer.deity = {
	getCompactRenderedString (deity) {
		const renderer = Renderer.get().setFirstSection(true);
		const entry = {
			type: "pf2-h3",
			name: `${deity.name}${deity.alignment && deity.alignment.length === 1 ? ` (${deity.alignment[0]})` : ""}`,
			entries: [
				...deity.info,
			],
		};
		return `${Renderer.utils.getExcludedDiv(deity, "deity", UrlUtil.PG_DEITIES)}
			${renderer.render(entry)}
			${Renderer.deity.getEdictsAnathemaAlign(deity)}
			${Renderer.deity.getDevoteeBenefits(deity)}
			${deity.reprinted ? `<p class="pf2-p"><i class="text-muted">Note: this deity has been reprinted in a newer publication.</i></p>` : ""}
			${Renderer.utils.getPageP(deity)}`;
	},

	getEdictsAnathemaAlign (deity) {
		let out = []
		if (deity.edicts) out.push(`<p class="pf2-book__option"><strong>Edicts </strong>${deity.edicts.join(", ")}</p>`)
		if (deity.anathema) out.push(`<p class="pf2-book__option"><strong>Anathema </strong>${deity.anathema.join(", ")}</p>`)
		if (deity.followerAlignment) out.push(`<p class="pf2-book__option"><strong>Follower Alignments </strong>${deity.followerAlignment.join(", ")}</p>`)
		return out.join("")
	},

	getClericSpells (spells) {
		return Object.keys(spells).map(k => `${Parser.getOrdinalForm(k)}: ${spells[k].map(s => `{@spell ${s}}`).join(", ")}`).join(", ");
	},

	getDevoteeBenefits (deity) {
		if (deity.devoteeBenefits == null) return "";
		const renderer = Renderer.get()
		const b = deity.devoteeBenefits;
		return `${renderer.render({type: "pf2-h4", name: "Devotee Benefits"})}
			<p class="pf2-book__option mt-2"><strong>Divine Font </strong>${renderer.render(`{@spell ${b.font}}`)}</p>
			<p class="pf2-book__option"><strong>Divine Skill </strong>${renderer.render(`{@skill ${b.skill}}`)}</p>
			<p class="pf2-book__option"><strong>Favored Weapon </strong>${renderer.render(`{@item ${b.weapon}}`)}</p>
			<p class="pf2-book__option"><strong>Domains </strong>${renderer.render(b.domains.join(", "))}</p>
			<p class="pf2-book__option"><strong>Cleric Spells </strong>${renderer.render(Renderer.deity.getClericSpells(b.spells))}</p>
			${b.alternateDomains ? `<p class="pf2-book__option"><strong>Alternate Domains </strong>${renderer.render(b.domains.join(", "))}</p>` : ""}
			${b.ability ? `<p class="pf2-book__option"><strong>Divine Ability </strong>${renderer.render(b.ability.entry)}</p>` : ""}`;
	},

	getRenderedLore (deity) {
		const textStack = [""];
		const renderer = Renderer.get().setFirstSection(true)
		if (deity.lore) {
			deity.lore.forEach(l => {
				if (l.source !== deity.source) l.entries.push(`{@note published in ${l.source}, page ${l.page}.}`);
				renderer.recursiveRender(l, textStack, {depth: 1});
			});
		}
		return textStack.join("");
	},

	getIntercession (deity) {
		const textStack = [""];
		const renderer = Renderer.get().setFirstSection(true)
		if (deity.intercession) {
			const entry = {type: "pf2-h2",
				name: "Divine Intercession",
				entries: deity.intercession.flavor ? deity.intercession.flavor : [],
			};
			renderer.recursiveRender(entry, textStack, {depth: 1});
			if (deity.intercession.boon) {
				Object.keys(deity.intercession.boon)
					.map(key => `<p class="pf2-book__option"><strong>${key} </strong>${renderer.render(deity.intercession.boon[key])}</p>`)
					.forEach(it => textStack.push(it))
			}
			if (deity.intercession.curse) {
				Object.keys(deity.intercession.curse)
					.map(key => `<p class="pf2-book__option"><strong>${key} </strong>${renderer.render(deity.intercession.curse[key])}</p>`)
					.forEach(it => textStack.push(it))
			}
			textStack.push(`<p class="pf2-p">${renderer.render(`{@note published in ${deity.intercession.source}, page ${deity.intercession.page}.}`)}</p>`)
		}
		return textStack.join("");
	},
};

Renderer.hazard = {
	getCompactRenderedString (hazard) {
		const renderStack = [""];
		const renderer = Renderer.get();
		renderStack.push(`
		${Renderer.utils.getExcludedDiv(hazard, "hazard", UrlUtil.PG_HAZARDS)}
		${Renderer.utils.getNameDiv(hazard, {page: UrlUtil.PG_HAZARDS, type: "HAZARD"})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(hazard.traits || [])}`);
		if (hazard.stealth) {
			let stealthText = hazard.stealth.dc != null ? `DC ${hazard.stealth.dc}` : `{@d20 ${hazard.stealth.bonus >= 0 ? "+" : ""}${hazard.stealth.bonus}||Stealth}`;
			if (hazard.stealth.min_prof) stealthText += ` (${hazard.stealth.min_prof})`;
			if (hazard.stealth.notes) stealthText += ` ${hazard.stealth.notes}`;
			renderStack.push(`<p class="pf2-stat__section"><strong>Stealth </strong>${renderer.render(stealthText)}</p>`);
		}
		if (hazard.description) {
			const descriptionStack = [`<p class="pf2-stat__section--wide"><strong>Description </strong>`];
			renderer.recursiveRender(hazard.description, descriptionStack, {depth: 1});
			descriptionStack.push(`</p>`);
			renderStack.push(descriptionStack.join(""));
		}
		renderStack.push(Renderer.utils.getDividerDiv());
		if (hazard.disable) {
			const disableStack = [`<p class="pf2-stat__section"><strong>Disable </strong>`];
			renderer.recursiveRender(hazard.disable.entries, disableStack, {depth: 1});
			disableStack.push(`</p>`);
			renderStack.push(disableStack.join(""));
		}
		if (hazard.defenses) {
			const def = hazard.defenses
			const defensesStack = [`<p class="pf2-stat__section">`];
			const sectionAcSt = []
			const sectionTwo = []
			if (def.ac) {
				sectionAcSt.push(Object.keys(def.ac)
					.map(k => `<strong>${k === "default" ? "" : `${k} `}AC </strong>${def.ac[k]}`).join(", "));
			}
			if (def.saving_throws) {
				sectionAcSt.push(Object.keys(def.saving_throws).filter(k => def.saving_throws[k] != null)
					.map(k => `<strong>${k.uppercaseFirst()} </strong>{@d20 ${def.saving_throws[k]}||${Parser.savingThrowAbvToFull(k)}}`).join(", "));
			}
			defensesStack.push(renderer.render(sectionAcSt.join("; ")))
			if (sectionAcSt.length) defensesStack.push(`</p><p class="pf2-stat__section">`);
			if (def.hardness != null && def.hp != null) {
				// FIXME: self-evident
				sectionTwo.push(Object.keys(def.hardness).map(k => `<strong>${k === "default" ? "" : `${k} `}Hardness </strong>${def.hardness[k]}${def.hp[k] != null ? `, <strong>${k === "default" ? "" : `${k} `}HP </strong>${def.hp[k]}${def.bt && def.bt[k] != null ? ` (BT ${def.bt[k]})` : ""}${def.notes && def.notes[k] != null ? ` ${renderer.render(def.notes[k])}` : ""}` : ""}`).join("; "));
			} else if (def.hp != null) {
				sectionTwo.push(Object.keys(def.hp)
					.map(k => `<strong>${k === "default" ? "" : `${k} `}HP </strong>${def.hp[k]}${def.bt && def.bt[k] != null ? `, (BT ${def.bt[k]})` : ""}`).join("; "));
			} else throw new Error("What? Hardness but no HP?") // TODO: ...Maybe?
			if (def.immunities) sectionTwo.push(`<strong>Immunities </strong>${def.immunities.join(", ")}`);
			if (def.weaknesses) sectionTwo.push(`<strong>Weaknesses </strong>${def.weaknesses.join(", ")}`);
			if (def.resistances) sectionTwo.push(`<strong>Resistances </strong>${def.resistances.join(", ")}`);
			defensesStack.push(renderer.render(sectionTwo.join("; ")))
			defensesStack.push(`</p>`);
			renderStack.push(defensesStack.join(""));
		}
		if (hazard.actions) {
			hazard.actions.forEach(a => {
				if (a.type === "ability") renderStack.push(Renderer.hazard.getRenderedAbility(a));
				else {
					renderStack.push(`<p class="pf2-stat__section">`);
					renderStack.push(`<span><strong>${a.range} </strong>`);
					renderStack.push(Renderer.get().render(`{@as 1} `));
					renderStack.push(`${a.name} `);
					renderStack.push(`</span>`);
					renderStack.push(Renderer.get().render(`{@hit ${a.attack}||${a.name.uppercaseFirst()} `));
					renderStack.push(`<span>`);
					if (a.traits != null) {
						let traits = [];
						a.traits.forEach((t) => {
							let traitname = Parser.getTraitName(t)
							traits.push(`{@trait ${traitname}|${Parser.TRAITS_TO_TRAITS_SRC[traitname]}|${t}}`)
						});
						renderStack.push(Renderer.get().render(` (${traits.join(", ")})`));
					}
					renderStack.push(`, <strong>Damage </strong>`);
					renderStack.push(renderer.render(a.damage));

					renderStack.push(`</span>`);
					renderStack.push(`</p>`);
				}
			});
		}
		if (hazard.routine) {
			renderStack.push(Renderer.utils.getDividerDiv());
			hazard.routine.forEach((entry, idx) => {
				if (idx !== 0) {
					if (typeof entry === "object") renderStack.push(Renderer.hazard.getRenderedAbility(entry));
					else renderer.recursiveRender(entry, renderStack, {depth: 1}, {prefix: `<p class="pf2-stat__text--wide">`, suffix: "</p>"});
				} else renderStack.push(`<p class="pf2-stat__text--wide"><strong>Routine </strong>${renderer.render(entry)}</p>`);
			});
		}
		if (hazard.reset) {
			renderStack.push(Renderer.utils.getDividerDiv());
			renderStack.push(`<p class="pf2-stat__section--wide"><strong>Reset </strong>`);
			renderer.recursiveRender(hazard.reset, renderStack, {depth: 1});
			renderStack.push(`</p>`);
		}
		renderStack.push(Renderer.utils.getPageP(hazard))
		return renderStack.join("")
	},

	getRenderedAbility (ability, options) {
		options = options || {};

		const renderer = Renderer.get();
		const entryStack = [];
		renderer.recursiveRender(ability.entries, entryStack, {depth: 2}, {isAbility: true});

		let trts = []
		if (ability.traits != null && ability.traits.length) {
			ability.traits.forEach((t) => {
				let traitname = Parser.getTraitName(t)
				trts.push(Renderer.get().render(`{@trait ${traitname}|${Parser.TRAITS_TO_TRAITS_SRC[traitname]}|${t}}`))
			});
		}

		return `<p class="pf2-stat__section"><span><strong>${ability.name} </strong>
					${ability.activity ? renderer.render(ability.activity.entry) : ""}
					${trts.length ? `(${trts.join(", ")}); ` : ""}
					${ability.frequency ? `<strong>Frequency </strong>${renderer.render(ability.frequency)}` : ""}
					${ability.requirements ? `<strong>Requirements </strong>${renderer.render(ability.requirements)}` : ""}
					${ability.trigger ? `<strong>Trigger </strong>${renderer.render(ability.trigger)}` : ""}
					${ability.frequency || ability.requirements || ability.trigger ? "<strong>Effect </strong>" : ""}
					${entryStack.join("")}
					</span></p>`;
	},
};

Renderer.creature = {
	getPerception (cr) {
		const perception = cr.perception;
		const senses = cr.senses;
		let renderStack = [];
		renderStack.push(`<p class="pf2-stat__section">`)
		renderStack.push(`<span><strong>Perception </strong></span>`)
		renderStack.push(Renderer.get().render(`{@d20 ${perception.default}||Perception}`))
		renderStack.push(`<span>`)
		renderStack.push(Renderer.utils.getNotes(perception, ["default"], true, "Perception"))
		let sensesStack = []
		sensesStack.push(senses.precise.concat([""]).join(" (precise), "))
		sensesStack.push(senses.imprecise.concat([""]).join(" (imprecise), "))
		sensesStack.push(senses.vague.concat([""]).join(" (vague), "))
		sensesStack.push(senses.other.join(", "))
		let sensesString = sensesStack.join("")
		if (sensesString !== "") {
			renderStack.push("; ")
			renderStack.push(sensesString)
		}
		renderStack.push(`</span>`)
		renderStack.push(`</p>`)

		return renderStack.join("")
	},

	getLanguages (cr) {
		if (cr.languages != null && (cr.languages.languages.length !== 0 || cr.languages.language_abilities.length !== 0)) {
			let renderStack = [];

			renderStack.push(`<p class="pf2-stat__section">`)
			renderStack.push(`<span><strong>Languages </strong></span>`)
			renderStack.push(`<span>`)
			renderStack.push(cr.languages.languages.join(", "))
			if (cr.languages.language_abilities.length !== 0) {
				if (cr.languages.languages.length !== 0) renderStack.push("; ")
				renderStack.push(cr.languages.language_abilities.join(", "))
			}
			renderStack.push(`</span>`)
			renderStack.push(`</p>`)

			return renderStack.join("")
		} else return ""
	},

	getSkills (cr) {
		if (cr.skills != null && (Object.keys(cr.skills).length !== 0)) {
			let renderStack = [];

			renderStack.push(`<p class="pf2-stat__section">`)
			renderStack.push(`<span><strong>Skills </strong></span>`)
			let skills = []
			for (let key in cr.skills) {
				let skill = `<span>${key} </span>`
				skill += Renderer.get().render(`{@d20 ${cr.skills[key]["default"]}||${key}`)
				skill += Renderer.utils.getNotes(cr.skills[key], ["default"], true, key)
				skills.push(skill)
			}

			renderStack.push(skills.sort().join("<span>, </span>"))
			renderStack.push(`</p>`)

			return renderStack.join("")
		} else return ""
	},

	getAbilityMods (mods) {
		let renderStack = [];
		renderStack.push(`<p class="pf2-stat__section">`)
		renderStack.push(`<span><strong>Str </strong></span>`)
		renderStack.push(Renderer.get().render(`{@d20 ${mods.Str}||Strength}`))
		renderStack.push(`<span>, <strong>Dex </strong></span>`)
		renderStack.push(Renderer.get().render(`{@d20 ${mods.Dex}||Dexterity}`))
		renderStack.push(`<span>, <strong>Con </strong></span>`)
		renderStack.push(Renderer.get().render(`{@d20 ${mods.Con}||Constitution}`))
		renderStack.push(`<span>, <strong>Int </strong></span>`)
		renderStack.push(Renderer.get().render(`{@d20 ${mods.Int}||Intelligence}`))
		renderStack.push(`<span>, <strong>Wis </strong></span>`)
		renderStack.push(Renderer.get().render(`{@d20 ${mods.Wis}||Wisdom}`))
		renderStack.push(`<span>, <strong>Cha </strong></span>`)
		renderStack.push(Renderer.get().render(`{@d20 ${mods.Cha}||Charisma}`))
		renderStack.push(`</p>`)
		return renderStack.join("")
	},

	getItems (cr) {
		if (cr.items != null) {
			let renderStack = [];
			renderStack.push(`<p class="pf2-stat__section">`)
			renderStack.push(`<span><strong>Items </strong></span>`)
			renderStack.push(Renderer.get().render(cr.items.join(", ")))
			renderStack.push(`</p>`)
			return renderStack.join("")
		} else return ""
	},

	getDefenses (cr) {
		let renderStack = [];
		renderStack.push(`<p class="pf2-stat__section">`)
		const ac = cr.armor_class
		renderStack.push(`<span><strong>AC </strong>${ac.default}`)
		renderStack.push(Renderer.utils.getNotes(ac, ["default", "abilities"], false))
		if (ac.abilities != null) renderStack.push(`; ${ac.abilities}`);
		const st = cr.saving_throws
		renderStack.push(`; <strong>Fort </strong>`)
		renderStack.push(Renderer.get().render(`{@d20 ${st.Fort.default}||Fortitude Save}`))
		renderStack.push(Renderer.utils.getNotes(st.Fort, ["default", "abilities"], "Fortitude Save"))
		renderStack.push(`, <strong>Ref </strong>`)
		renderStack.push(Renderer.get().render(`{@d20 ${st.Ref.default}||Reflex Save}`))
		renderStack.push(Renderer.utils.getNotes(st.Ref, ["default", "abilities"], "Reflex Save"))
		renderStack.push(`, <strong>Will </strong>`)
		renderStack.push(Renderer.get().render(`{@d20 ${st.Will.default}||Will Save}`))
		renderStack.push(Renderer.utils.getNotes(st.Will, ["default", "abilities"], "Will Save"))
		if (st.abilities != null) renderStack.push(`, ${st.abilities}`);
		renderStack.push(`</span>`)
		renderStack.push(`</p>`)

		renderStack.push(`<p class="pf2-stat__section">`)
		const hp = cr.hit_points
		for (i = 0; i < hp.length; i++) {
			renderStack.push(`<span><strong>HP </strong>${hp[i].note != null ? `${hp[i].note} ` : ``}${hp[i].HP}`)
			renderStack.push(`${hp[i].abilities != null ? `, ${hp[i].abilities}` : ``}`)
			renderStack.push(`${(i === hp.length - 1) ? `` : ` `}`)
		}
		if (cr.hardness != null) {
			renderStack.push(`; <strong>Hardness </strong>${cr.hardness}`)
		}
		if (cr.immunities != null) {
			renderStack.push(`; <strong>Immunities </strong>${cr.immunities.damage.concat(cr.immunities.condition).sort().join(", ")}`)
		}
		if (cr.weaknesses != null) {
			renderStack.push(`; <strong>Weaknesses </strong>`)
			let ws = []
			for (let x of cr.weaknesses) {
				if (typeof (x) === "string") {
					ws.push(x)
				} else {
					ws.push(`${x.name} ${x.amount}${x.note ? ` ${x.note}` : ``}`)
				}
			}
			renderStack.push(ws.join(", "))
		}
		if (cr.resistances != null) {
			renderStack.push(`; <strong>Resistances </strong>`)
			let rs = []
			for (let x of cr.resistances) {
				if (typeof (x) === "string") {
					rs.push(x)
				} else {
					rs.push(`${x.name} ${x.amount}${x.note ? ` ${x.note}` : ``}`)
				}
			}
			renderStack.push(rs.join(", "))
		}
		renderStack.push(`</span>`)
		renderStack.push(`</p>`)

		return renderStack.join("")
	},

	getSpeed (cr) {
		let renderStack = [];
		renderStack.push(`<p class="pf2-stat__section">`)
		renderStack.push(`<span><strong>Speed </strong>`)
		let speeds = []
		if (cr.speed.walk != null) speeds.push(`${cr.speed.walk} feet`)
		for (let key in cr.speed) {
			if (key !== "abilities" && key !== "walk") {
				speeds.push(`${key} ${cr.speed[key]} feet`)
			}
		}
		renderStack.push(speeds.join(", "))
		if (cr.speed.abilities != null) {
			renderStack.push("; ")
			renderStack.push(cr.speed.abilities.join(", "))
		}
		renderStack.push(`</span>`)
		renderStack.push(`</p>`)
		return renderStack.join("")
	},

	getAttacks (cr) {
		let renderStack = [];
		for (let attack of cr.attacks) {
			renderStack.push(`<p class="pf2-stat__section">`)
			renderStack.push(`<span><strong>${attack.range} </strong>`)
			renderStack.push(Renderer.get().render(`{@as 1} `))
			renderStack.push(`${attack.name}`)
			renderStack.push(`</span>`)
			if (attack.attack != null) renderStack.push(Renderer.get().render(` {@hit ${attack.attack}||${attack.name.uppercaseFirst()} `))
			renderStack.push(`<span>`)
			if (attack.traits != null) {
				let traits = []
				attack.traits.forEach((t) => {
					let traitname = Parser.getTraitName(t)
					traits.push(`{@trait ${traitname}|${Parser.TRAITS_TO_TRAITS_SRC[traitname]}|${t}}`)
				});
				renderStack.push(Renderer.get().render(` (${traits.join(", ")})`))
			}
			renderStack.push(`, <strong>Damage </strong>`)
			renderStack.push(Renderer.get().render(attack.damage))

			renderStack.push(`</span>`)
			renderStack.push(`</p>`)
		}
		return renderStack.join("")
	},

	getSpellcasting (cr) {
		if (cr.spellcasting != null) {
			const renderer = Renderer.get()
			let renderStack = [];
			for (let sc of cr.spellcasting) {
				renderStack.push(`<p class="pf2-stat__section">`)
				renderStack.push(`<span><strong>${sc.name} Spells</strong> DC ${sc.DC}</span>`)
				if (sc.attack != null) {
					renderStack.push(renderer.render(`<span>, attack </span>{@d20 ${sc.attack}||Spell attack}`))
				}
				Object.keys(sc.entry).sort().reverse().forEach((lvl) => {
					if (lvl !== " constant") {
						renderStack.push(`<span>; <strong>${lvl === "0" ? "Cantrips" : Parser.getOrdinalForm(lvl)} </strong>`)
						if (sc.entry[lvl].level != null) renderStack.push(`<strong>(${Parser.getOrdinalForm(sc.entry[lvl].level)}) </strong>`)
						if (sc.entry[lvl].slots != null) renderStack.push(`(${sc.entry[lvl].slots} slots) `)
						if (sc.entry[lvl].fp != null) renderStack.push(`${sc.entry[lvl].fp} `)
						renderStack.push(`</span>`)
						let spells = []
						for (let spell of sc.entry[lvl].spells) {
							let amount = spell.amount != null ? typeof (spell.amount) === "number" ? [`×${spell.amount}`] : [spell.amount] : []
							let notes = spell.notes != null ? spell.notes : []
							let bracket = ""
							if (amount.length || notes.length) {
								bracket = ` (${amount.concat(notes).join(", ")})`
							}
							spells.push(`{@spell ${spell.name}|${spell.source || SRC_CRB}|${spell.name}}${bracket}`)
						}
						renderStack.push(renderer.render(spells.join(", ")))
					} else {
						renderStack.push(`<span>; <strong>Constant </strong></span>`)
						Object.keys(sc.entry[lvl]).sort().reverse().forEach((clvl) => {
							renderStack.push(`<span><strong>(${Parser.getOrdinalForm(clvl)}) </strong></span>`)
							let spells = []
							for (let spell of sc.entry[lvl][clvl].spells) {
								let notes = spell.notes != null ? spell.notes : []
								let bracket = ""
								if (notes.length) {
									bracket = ` (${notes.join(", ")})`
								}
								spells.push(`{@spell ${spell.name}|${spell.source || SRC_CRB}|${spell.name}}${bracket}`)
							}
							renderStack.push(renderer.render(`${spells.join(", ")}; `))
						});
					}
				});
				renderStack.push(`</p>`)
			}
			return renderStack.join("")
		} else return ""
	},

	getRituals (cr) {
		if (cr.rituals != null) {
			const renderer = Renderer.get()
			let renderStack = [];
			cr.rituals.forEach((feature) => {
				renderStack.push(`<p class="pf2-stat__section">`)
				renderStack.push(`<span><strong>${feature.tradition} Rituals</strong> DC ${feature.DC}</span>; `)
				let rituals = []
				feature.rituals.forEach((ritual) => {
					let bracket = ""
					let notes = ritual.notes != null ? ritual.notes : []
					let level = ritual.level != null ? [Parser.getOrdinalForm(ritual.level)] : []
					if (level.length || notes.length) {
						bracket = ` (${level.concat(notes).join(", ")})`
					}
					rituals.push(`{@spell ${ritual.name}|${ritual.source || SRC_CRB}|${ritual.name}}${bracket}`)
				});
				renderStack.push(renderer.render(rituals.join(", ")))
				renderStack.push(`</p>`)
			})
			return renderStack.join("")
		} else return ""
	},

	getCompactRenderedString (cr, renderer, options) {
		options = options || {};
		const traits = (cr.rarity === "Common" ? [] : [cr.rarity]).concat([cr.alignment]).concat([cr.size]).concat(cr.traits.concat(cr.creature_type).sort())

		return $$`<div class="pf2-stat">${Renderer.utils.getExcludedDiv(cr, "creature", UrlUtil.PG_BESTIARY)}
			${Renderer.utils.getNameDiv(cr, {page: UrlUtil.PG_BESTIARY})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(traits)}
			${Renderer.creature.getPerception(cr)}
			${Renderer.creature.getLanguages(cr)}
			${Renderer.creature.getSkills(cr)}
			${Renderer.creature.getAbilityMods(cr.ability_modifiers)}
			${cr.abilities_interactive.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.creature.getItems(cr)}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getDefenses(cr)}
			${cr.abilities_automatic.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.utils.getDividerDiv()}
			${Renderer.creature.getSpeed(cr)}
			${Renderer.creature.getAttacks(cr)}
			${Renderer.creature.getSpellcasting(cr)}
			${Renderer.creature.getRituals(cr)}
			${cr.abilities_active.map(it => Renderer.creature.getRenderedAbility(it))}
			${Renderer.utils.getPageP(cr)}</div>`;
	},

	getRenderedAbility (ability, options) {
		options = options || {};

		const renderer = Renderer.get();
		const entryStack = [];
		renderer.recursiveRender(ability.entries, entryStack);

		const buttonClass = Parser.stringToSlug(`ab ${ability.name}`);

		let trts = []
		if (ability.traits != null && ability.traits.length) {
			ability.traits.forEach((t) => {
				let traitname = Parser.getTraitName(t)
				trts.push(Renderer.get().render(`{@trait ${traitname}|${Parser.TRAITS_TO_TRAITS_SRC[traitname]}|${t}}`))
			});
		}

		let renderedGenericAbility;
		if (ability.generic) {
			const hash = UrlUtil.encodeForHash([ability.name, "BST"]);
			const genericAbility = Renderer.hover._getFromCache(UrlUtil.PG_ABILITIES, "BST", hash);
			renderedGenericAbility = this.getRenderedAbility(genericAbility, {generic: true});
		}
		return $$`<p class="pf2-stat__section ${buttonClass} ${options.generic ? "hidden" : ""}"><span><strong>${ability.generic || options.generic ? `${renderer.render(`{@ability ${ability.name}}`)}` : ability.name} </strong>
					${ability.activity ? renderer.render(ability.activity.entry) : ""}
					${ability.generic || options.generic ? this.getAbilityTextButton(buttonClass, options.generic) : ""}
					${trts.length ? `(${trts.join(", ")}); ` : ""}
					${ability.frequency ? `<strong>Frequency </strong>${renderer.render(ability.frequency)}` : ""}
					${ability.requirements ? `<strong>Requirements </strong>${renderer.render(ability.requirements)}` : ""}
					${ability.trigger ? `<strong>Trigger </strong>${renderer.render(ability.trigger)}` : ""}
					${ability.frequency || ability.requirements || ability.trigger ? "<strong>Effect </strong>" : ""}
					${entryStack.join("")}
					</span></p>
					${renderedGenericAbility || ""}`;
	},

	getAbilityTextButton (buttonClass, generic) {
		return $(`<button title="Toggle short/long text" class="btn btn-xs btn-default">
					<span class="glyphicon ${generic ? "glyphicon-eye-close" : "glyphicon-eye-open"}"></span></button>`)
			.on("click").click((evt) => {
				evt.stopPropagation();
				$(`.${buttonClass}`).toggleClass("hidden");
			});
	},

	// legacy

	getCrScaleTarget (win, $btnScaleCr, initialCr, cbRender, isCompact) {
		const evtName = "click.cr-scaler";
		const $body = $(win.document.body);

		function cleanSliders () {
			$body.find(`.mon__cr_slider_wrp`).remove();
			$btnScaleCr.off(evtName);
		}

		const $wrp = $(`<div class="mon__cr_slider_wrp ${isCompact ? "mon__cr_slider_wrp--compact" : ""}"></div>`);
		const $sld = $(`<div class="mon__cr_slider"></div>`).appendTo($wrp);

		const curr = Parser.CRS.indexOf(initialCr);
		if (curr === -1) throw new Error(`Initial CR ${initialCr} was not valid!`);

		cleanSliders();
		$btnScaleCr.off(evtName).on(evtName, (evt) => evt.stopPropagation());
		$wrp.on(evtName, (evt) => evt.stopPropagation());
		$body.off(evtName).on(evtName, cleanSliders);

		const subOpts = {
			labels: Parser.CRS,
		};
		$sld.slider({
			min: 0,
			max: Parser.CRS.length - 1,
			value: curr,
		}).slider("pips", subOpts).slider("float", subOpts);

		$sld.slider().on("slidechange", () => {
			const ix = $sld.slider("value");
			cbRender(Parser.crToNumber(Parser.CRS[ix]));
			$body.off(evtName);
			cleanSliders();
		});

		$btnScaleCr.after($wrp);
	},

	getSensesPart (mon) {
		return `${mon.senses ? `${Renderer.creature.getRenderedSenses(mon.senses)}, ` : ""}passive Perception ${mon.passive || "\u2014"}`;
	},

	/**
	 * @param mon
	 * @param renderer
	 * @param [opts]
	 * @param [opts.isCompact]
	 * @param [opts.isEmbeddedEntity]
	 */
	getLegacyCompactRenderedString (mon, renderer, opts) {
		opts = opts || {};
		if (opts.isCompact === undefined) opts.isCompact = true;

		renderer = renderer || Renderer.get();

		const renderStack = [];
		const isCrHidden = Parser.crToNumber(mon.cr) === 100;
		const legGroup = DataUtil.creature.getMetaGroup(mon);
		const hasToken = mon.tokenUrl || mon.hasToken;
		const extraThClasses = !opts.isCompact && hasToken ? ["mon__name--token"] : null;

		renderStack.push(`
			${Renderer.utils.getExcludedTr(mon, "creature", UrlUtil.PG_BESTIARY)}
			${Renderer.utils.getNameTr(mon, {
		page: UrlUtil.PG_BESTIARY,
		extensionData: mon._isScaledCr,
		extraThClasses,
		isEmbeddedEntity: opts.isEmbeddedEntity,
	})}
			<tr><td colspan="6"><i>${Renderer.creature.getTypeAlignmentPart(mon)}</i></td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<table class="summary-noback relative">
					<tr>
						<th>Armor Class</th>
						<th>Hit Points</th>
						<th>Speed</th>
						${isCrHidden ? "" : "<th>Challenge Rating</th>"}
					</tr>
					<tr>
						<td>${Parser.acToFull(mon.ac)}</td>
						<td>${Renderer.creature.getRenderedHp(mon.hp)}</td>
						<td>${Parser.getSpeedString(mon)}</td>
						${isCrHidden ? "" : `
						<td>
							${Parser.monCrToFull(mon.cr, {isMythic: !!mon.mythic})}
							${opts.showScaler && Parser.isValidCr(mon.cr ? (mon.cr.cr || mon.cr) : null) ? `
							<button title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr btn btn-xs btn-default">
								<span class="glyphicon glyphicon-signal"></span>
							</button>
							` : ""}
							${opts.isScaled ? `
							<button title="Reset CR Scaling" class="mon__btn-reset-cr btn btn-xs btn-default">
								<span class="glyphicon glyphicon-refresh"></span>
							</button>
							` : ""}
						</td>
						`}
					</tr>
				</table>
			</td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<table class="summary stripe-even-table">
					<tr>
						<th class="col-2 text-center">STR</th>
						<th class="col-2 text-center">DEX</th>
						<th class="col-2 text-center">CON</th>
						<th class="col-2 text-center">INT</th>
						<th class="col-2 text-center">WIS</th>
						<th class="col-2 text-center">CHA</th>
					</tr>
					<tr>
						<td class="text-center">${Renderer.utils.getAbilityRoller(mon, "str")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(mon, "dex")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(mon, "con")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(mon, "int")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(mon, "wis")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(mon, "cha")}</td>
					</tr>
				</table>
			</td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<div class="rd__compact-stat">
					${mon.save ? `<p><b>Saving Throws</b> ${Renderer.creature.getSavesPart(mon)}</p>` : ""}
					${mon.skill ? `<p><b>Skills</b> ${Renderer.creature.getSkillsString(renderer, mon)}</p>` : ""}
					${mon.vulnerable ? `<p><b>Damage Vuln.</b> ${Parser.monImmResToFull(mon.vulnerable)}</p>` : ""}
					${mon.resist ? `<p><b>Damage Res.</b> ${Parser.monImmResToFull(mon.resist)}</p>` : ""}
					${mon.immune ? `<p><b>Damage Imm.</b> ${Parser.monImmResToFull(mon.immune)}</p>` : ""}
					${mon.conditionImmune ? `<p><b>Condition Imm.</b> ${Parser.monCondImmToFull(mon.conditionImmune)}</p>` : ""}
					${opts.isHideSenses ? "" : `<p><b>Senses</b> ${Renderer.creature.getSensesPart(mon)}</p>`}
					${opts.isHideLanguages ? "" : `<p><b>Languages</b> ${Renderer.creature.getRenderedLanguages(mon.languages)}</p>`}
				</div>
			</td></tr>
			${mon.trait || mon.spellcasting ? `<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr class="text compact"><td colspan="6">
			${Renderer.creature.getOrderedTraits(mon, renderer).map(it => it.rendered || renderer.render(it, 2)).join("")}
			</td></tr>` : ""}
			${Renderer.creature.getCompactRenderedStringSection(mon, renderer, "Actions", "action", 2)}
			${Renderer.creature.getCompactRenderedStringSection(mon, renderer, "Bonus Actions", "bonus", 2)}
			${Renderer.creature.getCompactRenderedStringSection(mon, renderer, "Reactions", "reaction", 2)}
			${Renderer.creature.getCompactRenderedStringSection(mon, renderer, "Legendary Actions", "legendary", 2)}
			${Renderer.creature.getCompactRenderedStringSection(mon, renderer, "Mythic Actions", "mythic", 2)}
			${legGroup && legGroup.lairActions ? Renderer.creature.getCompactRenderedStringSection(legGroup, renderer, "Lair Actions", "lairActions", 1) : ""}
			${legGroup && legGroup.regionalEffects ? Renderer.creature.getCompactRenderedStringSection(legGroup, renderer, "Regional Effects", "regionalEffects", 1) : ""}
			${mon.variant || (mon.dragonCastingColor && !mon.spellcasting) ? `
			<tr class="text compact"><td colspan="6">
			${mon.variant ? mon.variant.map(it => it.rendered || renderer.render(it)).join("") : ""}
			${mon.dragonCastingColor ? Renderer.creature.getDragonCasterVariant(renderer, mon) : ""}
			${mon.footer ? renderer.render({entries: mon.footer}) : ""}
			</td></tr>
			` : ""}
		`);

		return renderStack.join("");
	},

	getRenderedHp: (hp, isPlainText) => {
		function getMaxStr () {
			const mHp = /^(\d+)d(\d+)([-+]\d+)?$/i.exec(hp.formula);
			if (mHp) {
				const num = Number(mHp[1]);
				const faces = Number(mHp[2]);
				const mod = mHp[3] ? Number(mHp[3]) : 0;
				return `Maximum: ${(num * faces) + mod}`;
			} else return "";
		}

		if (hp.special != null) return hp.special;
		if (/^\d+d1$/.exec(hp.formula)) {
			return hp.average;
		} else {
			const maxStr = getMaxStr(hp.formula);
			if (isPlainText) return `${hp.average} (${hp.formula})`;
			return `${maxStr ? `<span title="${maxStr}" class="help--subtle">` : ""}${hp.average}${maxStr ? "</span>" : ""} ${Renderer.get().render(`({@dice ${hp.formula}|${hp.formula}|Hit Points})`)}`;
		}
	},

	getSpellcastingRenderedTraits: (mon, renderer) => {
		const out = [];
		mon.spellcasting.forEach(entry => {
			entry.type = entry.type || "spellcasting";
			const renderStack = [];
			renderer.recursiveRender(entry, renderStack, {depth: 2});
			out.push({name: entry.name, rendered: renderStack.join("")});
		});
		return out;
	},

	getOrderedTraits: (mon, renderer) => {
		let trait = mon.trait ? MiscUtil.copy(mon.trait) : null;
		if (mon.spellcasting) {
			const spellTraits = Renderer.creature.getSpellcastingRenderedTraits(mon, renderer);
			// weave spellcasting in with other traits
			trait = trait ? trait.concat(spellTraits) : spellTraits;
		}
		if (trait) return trait.sort((a, b) => SortUtil.monTraitSort(a, b));
	},

	getSkillsString (renderer, mon) {
		function makeSkillRoller (name, mod) {
			return Renderer.get().render(`{@d20 ${mod}|${mod}|${name}}`);
		}

		function doSortMapJoinSkillKeys (obj, keys, joinWithOr) {
			const toJoin = keys.sort(SortUtil.ascSort).map(s => `<span data-mon-skill="${s.toTitleCase()}|${obj[s]}">${renderer.render(`{@skill ${s.toTitleCase()}}`)} ${makeSkillRoller(s.toTitleCase(), obj[s])}</span>`);
			return joinWithOr ? toJoin.joinConjunct(", ", " or ") : toJoin.join(", ")
		}

		const skills = doSortMapJoinSkillKeys(mon.skill, Object.keys(mon.skill).filter(k => k !== "other" && k !== "special"));
		if (mon.skill.other || mon.skill.special) {
			const others = mon.skill.other && mon.skill.other.map(it => {
				if (it.oneOf) {
					return `plus one of the following: ${doSortMapJoinSkillKeys(it.oneOf, Object.keys(it.oneOf), true)}`
				}
				throw new Error(`Unhandled monster "other" skill properties!`)
			});
			const special = mon.skill.special && Renderer.get().render(mon.skill.special);
			return [skills, others, special].filter(Boolean).join(", ");
		} else return skills;
	},

	getTokenUrl (mon) {
		return mon.tokenUrl || UrlUtil.link(`${Renderer.get().baseMediaUrls["img"] || Renderer.get().baseUrl}img/${Parser.sourceJsonToAbv(mon.source)}/${Parser.nameToTokenName(mon.name)}.png`);
	},

	postProcessFluff (mon, fluff) {
		const cpy = MiscUtil.copy(fluff);

		// TODO is this good enough? Should additionally check for lair blocks which are not the last, and tag them with
		//   "data": {"lairRegionals": true}, and insert the lair/regional text there if available (do the current "append" otherwise)
		const thisGroup = DataUtil.creature.getMetaGroup(mon);
		const handleGroupProp = (prop, name) => {
			if (thisGroup && thisGroup[prop]) {
				cpy.entries = cpy.entries || [];
				cpy.entries.push({
					type: "entries",
					entries: [
						{
							type: "entries",
							name,
							entries: MiscUtil.copy(thisGroup[prop]),
						},
					],
				});
			}
		};

		handleGroupProp("lairActions", "Lair Actions");
		handleGroupProp("regionalEffects", "Regional Effects");
		handleGroupProp("mythicEncounter", `${mon.name} as a Mythic Encounter`);

		return cpy;
	},

	getRenderedSenses (senses, isPlainText) {
		if (typeof senses === "string") senses = [senses]; // handle legacy format
		if (isPlainText) return senses.join(", ");
		const senseStr = senses
			.join(", ")
			.replace(/(^| |\()(tremorsense|blindsight|truesight|darkvision)(\)| |$)/gi, (...m) => `${m[1]}{@sense ${m[2]}}${m[3]}`)
			.replace(/(^| |\()(blind|blinded)(\)| |$)/gi, (...m) => `${m[1]}{@condition blinded||${m[2]}}${m[3]}`)
		;
		return Renderer.get().render(senseStr);
	},

	getRenderedLanguages (languages) {
		if (typeof languages === "string") languages = [languages]; // handle legacy format
		return languages ? languages.map(it => Renderer.get().render(it)).join(", ") : "\u2014";
	},

	initParsed (mon) {
		mon._pTypes = mon._pTypes || Parser.monTypeToFullObj(mon.type); // store the parsed type
		mon._pCr = mon._pCr || (mon.cr == null ? "\u2014" : (mon.cr.cr || mon.cr));
		if (!mon._fCr) {
			mon._fCr = [mon._pCr];
			if (mon.cr) {
				if (mon.cr.lair) mon._fCr.push(mon.cr.lair);
				if (mon.cr.coven) mon._fCr.push(mon.cr.coven);
			}
		}
	},

	updateParsed (mon) {
		delete mon._pTypes;
		delete mon._pCr;
		delete mon._fCr;
		Renderer.creature.initParsed(mon);
	},

	pGetFluff (mon) {
		return Renderer.utils.pGetFluff({
			entity: mon,
			pFnPostProcess: Renderer.creature.postProcessFluff.bind(null, mon),
			fluffBaseUrl: `data/bestiary/`,
			fluffProp: "monsterFluff",
		});
	},
};

Renderer.item = {
	// avoid circular references by deciding a global link direction for specific <-> general
	// default is general -> specific
	LINK_SPECIFIC_TO_GENERIC_DIRECTION: 1,

	_sortProperties (a, b) {
		return SortUtil.ascSort(Renderer.item.propertyMap[a].name, Renderer.item.propertyMap[b].name)
	},

	_getPropertiesText (item) {
		if (item.property) {
			let renderedDmg2 = false;

			const renderedProperties = item.property
				.sort(Renderer.item._sortProperties)
				.map(prop => {
					const fullProp = Renderer.item.propertyMap[prop];

					if (fullProp.template) {
						const toRender = fullProp.template.replace(/{{([^}]+)}}/g, (...m) => {
							// Special case for damage dice -- need to add @damage tags
							if (m[1] === "item.dmg1") {
								return Renderer.item._renderDamage(item.dmg1);
							} else if (m[1] === "item.dmg2") {
								renderedDmg2 = true;
								return Renderer.item._renderDamage(item.dmg2);
							}

							const spl = m[1].split(".");
							switch (spl[0]) {
								case "prop_name":
									return fullProp.name;
								case "item": {
									const path = spl.slice(1);
									if (!path.length) return `{@i missing key path}`;
									return MiscUtil.get(item, ...path) || "";
								}
								default:
									return `{@i unknown template root: "${spl[0]}"}`;
							}
						});
						return Renderer.get().render(toRender);
					} else return fullProp.name;
				});

			if (!renderedDmg2 && item.dmg2) renderedProperties.unshift(`alt. ${Renderer.item._renderDamage(item.dmg2)}`);

			return `${item.dmg1 && renderedProperties.length ? " - " : ""}${renderedProperties.join(", ")}`
		} else {
			const parts = [];
			if (item.dmg2) parts.push(`alt. ${Renderer.item._renderDamage(item.dmg2)}`);
			if (item.range) parts.push(`range ${item.range} ft.`);
			return `${item.dmg1 && parts.length ? " - " : ""}${parts.join(", ")}`;
		}
	},

	_renderDamage (dmg) {
		if (!dmg) return "";
		dmg = dmg.trim();
		const mDice = /^{@dice ([^}]+)}$/i.exec(dmg)
		if (mDice) return Renderer.get().render(`{@damage ${mDice[1]}}`);
		const tagged = dmg.replace(RollerUtil.DICE_REGEX, (...m) => `{@damage ${m[1]}}`);
		return Renderer.get().render(tagged);
	},

	getDamageAndPropertiesText: function (item) {
		const damageParts = [];

		if (item.dmg1) damageParts.push(Renderer.item._renderDamage(item.dmg1));

		// armor
		if (item.ac != null) {
			const prefix = item.type === "S" ? "+" : "";
			const suffix = item.type === "LA" ? " + Dex" : item.type === "MA" ? " + Dex (max 2)" : "";
			damageParts.push(`AC ${prefix}${item.ac}${suffix}`);
		}
		if (item.acSpecial != null) damageParts.push(item.ac != null ? item.acSpecial : `AC ${item.acSpecial}`);

		// mounts
		if (item.speed != null) damageParts.push(`Speed: ${item.speed}`);
		if (item.carryingCapacity) damageParts.push(`Carrying Capacity: ${item.carryingCapacity} lb.`);

		// vehicles
		if (item.vehSpeed || item.capCargo || item.capPassenger || item.crew || item.crewMin || item.crewMax || item.vehAc || item.vehHp || item.vehDmgThresh || item.travelCost || item.shippingCost) {
			const vehPartUpper = item.vehSpeed ? `Speed: ${Parser.numberToVulgar(item.vehSpeed)} mph` : null;

			const vehPartMiddle = item.capCargo || item.capPassenger ? `Carrying Capacity: ${[item.capCargo ? `${Parser.numberToFractional(item.capCargo)} ton${item.capCargo === 0 || item.capCargo > 1 ? "s" : ""} cargo` : null, item.capPassenger ? `${item.capPassenger} passenger${item.capPassenger === 1 ? "" : "s"}` : null].filter(Boolean).join(", ")}` : null;

			const {travelCostFull, shippingCostFull} = Parser.itemVehicleCostsToFull(item);

			// These may not be present in homebrew
			const vehPartLower = [
				item.crew ? `Crew ${item.crew}` : null,
				item.crewMin && item.crewMax ? `Crew ${item.crewMin}-${item.crewMax}` : null,
				item.vehAc ? `AC ${item.vehAc}` : null,
				item.vehHp ? `HP ${item.vehHp}${item.vehDmgThresh ? `, Damage Threshold ${item.vehDmgThresh}` : ""}` : null,
			].filter(Boolean).join(", ");

			damageParts.push([
				vehPartUpper,
				vehPartMiddle,

				// region ~~Dammit Mercer~~ Additional fields present in EGW
				travelCostFull ? `Personal Travel Cost: ${travelCostFull} per mile per passenger` : null,
				shippingCostFull ? `Shipping Cost: ${shippingCostFull} per 100 pounds per mile` : null,
				// endregion

				vehPartLower,
			].filter(Boolean).join("<br>"));
		}

		const damage = damageParts.join(", ");
		const damageType = item.dmgType ? Parser.dmgTypeToFull(item.dmgType) : "";
		const propertiesTxt = Renderer.item._getPropertiesText(item);

		return [damage, damageType, propertiesTxt];
	},

	getAttunementAndAttunementCatText (item, prop = "reqAttune") {
		let attunement = null;
		let attunementCat = "No";
		if (item[prop] != null && item[prop] !== false) {
			if (item[prop] === true) {
				attunementCat = "Yes";
				attunement = "(requires attunement)"
			} else if (item[prop] === "optional") {
				attunementCat = "Optional";
				attunement = "(attunement optional)"
			} else if (item[prop].toLowerCase().startsWith("by")) {
				attunementCat = "By...";
				attunement = `(requires attunement ${item[prop]})`;
			} else {
				attunementCat = "Yes"; // throw any weird ones in the "Yes" category (e.g. "outdoors at night")
				attunement = `(requires attunement ${item[prop]})`;
			}
		}
		return [attunement, attunementCat]
	},

	getHtmlAndTextTypes (item) {
		const typeListHtml = [];
		const typeListText = [];
		let showingBase = false;
		if (item.wondrous) {
			typeListHtml.push(`wondrous item${item.tattoo ? ` (tattoo)` : ""}`);
			typeListText.push("wondrous item");
		}
		if (item.tattoo) {
			typeListText.push("tattoo");
		}
		if (item.staff) {
			typeListHtml.push("staff");
			typeListText.push("staff");
		}
		if (item.ammo) {
			typeListHtml.push("ammunition");
			typeListText.push("ammunition");
		}
		if (item.firearm) {
			typeListHtml.push("firearm");
			typeListText.push("firearm");
		}
		if (item.age) {
			typeListHtml.push(item.age);
			typeListText.push(item.age);
		}
		if (item.weaponCategory) {
			typeListHtml.push(`${item.weaponCategory} weapon${item.baseItem ? ` (${Renderer.get().render(`{@item ${item.baseItem}}`)})` : ""}`);
			typeListText.push(`${item.weaponCategory} weapon`);
			showingBase = true;
		}
		if (item.staff && item.type !== "M") { // DMG p140: "Unless a staff's description says otherwise, a staff can be used as a quarterstaff."
			typeListHtml.push("melee weapon");
			typeListText.push("melee weapon");
		}
		if (item.type) {
			const fullType = Renderer.item.getItemTypeName(item.type);

			if (!showingBase && !!item.baseItem) typeListHtml.push(`${fullType} (${Renderer.get().render(`{@item ${item.baseItem}}`)})`);
			else if (item.type === "S") typeListHtml.push(Renderer.get().render(`armor ({@item shield|phb})`));
			else typeListHtml.push(fullType);

			typeListText.push(fullType);
		}
		if (item.poison) {
			typeListHtml.push(`poison${item.poisonTypes ? ` (${item.poisonTypes.joinConjunct(", ", " or ")})` : ""}`);
			typeListText.push("poison");
		}
		return [typeListText, typeListHtml.join(", ")];
	},

	getRenderedEntries (item, isCompact) {
		const renderer = Renderer.get();

		const handlers = {
			string: (str) => {
				const stack = [];
				let depth = 0;

				const tgtLen = item.name.length;
				const tgtName = item.name.toLowerCase();
				const tgtLenPlural = item.name.length + 1;
				const tgtNamePlural = `${tgtName}s`;

				const len = str.length;
				for (let i = 0; i < len; ++i) {
					const c = str[i];

					switch (c) {
						case "{": {
							if (str[i + 1] === "@") depth++;
							stack.push(c);
							break;
						}
						case "}": {
							if (depth) depth--;
							stack.push(c);
							break;
						}
						default:
							stack.push(c);
							break;
					}

					if (!depth) {
						if (stack.slice(-tgtLen).join("").toLowerCase() === tgtName) {
							stack.splice(stack.length - tgtLen, tgtLen, `{@i ${stack.slice(-tgtLen).join("")}}`)
						} else if (stack.slice(-tgtLenPlural).join("").toLowerCase() === tgtNamePlural) {
							stack.splice(stack.length - tgtLenPlural, tgtLenPlural, `{@i ${stack.slice(-tgtLenPlural).join("")}}`)
						}
					}
				}

				return stack.join("");
			},
		};

		const walkerKeyBlacklist = new Set(["caption", "type", "colLabels", "dataCreature", "dataSpell", "dataItem", "dataObject", "dataTrapHazard", "name"]);

		const renderStack = [];
		if (item._fullEntries || (item.entries && item.entries.length)) {
			const entryList = MiscUtil.copy({type: "entries", entries: item._fullEntries || item.entries});
			const procEntryList = MiscUtil.getWalker({keyBlacklist: walkerKeyBlacklist}).walk(entryList, handlers);
			renderer.recursiveRender(procEntryList, renderStack, {depth: 1});
		}

		if (item._fullAdditionalEntries || item.additionalEntries) {
			const additionEntriesList = MiscUtil.copy({
				type: "entries",
				entries: item._fullAdditionalEntries || item.additionalEntries,
			});
			const procAdditionEntriesList = MiscUtil.getWalker({keyBlacklist: walkerKeyBlacklist}).walk(additionEntriesList, handlers);
			renderer.recursiveRender(procAdditionEntriesList, renderStack, {depth: 1});
		}

		if (!isCompact && item.lootTables) {
			renderStack.push(`<div><span class="bold">Found On: </span>${item.lootTables.sort(SortUtil.ascSortLower).map(tbl => renderer.render(`{@table ${tbl}}`)).join(", ")}</div>`);
		}

		return renderStack.join("").trim();
	},

	getSubHead (item) {
		const renderStack = [];
		const renderer = Renderer.get()
		if (item.price) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Price </strong>${Parser.priceToFull(item.price)}</p>`);
		}
		if (item.ammunition) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Ammunition </strong>${item.ammunition}</p>`);
			// TODO: links to items?
		}
		if (item.usage != null || item.bulk != null) {
			renderStack.push(`<p class="pf2-stat__section">`);
			if (item.usage != null) renderStack.push(`<strong>Usage </strong>${item.usage}`)
			if (item.usage != null && item.bulk != null) renderStack.push("; ")
			if (item.bulk != null) renderStack.push(`<strong>Bulk </strong> ${item.bulk}`)
			renderStack.push(`</p>`);
		}
		if (item.ac != null || item.dexCap != null) {
			renderStack.push(`<p class="pf2-stat__section">`);
			if (item.ac != null) renderStack.push(`<strong>AC Bonus </strong>${Parser.numToBonus(item.ac)}; `)
			if (item.ac != null && item.dexCap != null) renderStack.push("; ")
			if (item.dexCap != null) renderStack.push(`<strong>Dex Cap </strong>${Parser.numToBonus(item.dexCap)}`)
			renderStack.push(`</p>`);
		}
		if (item.str != null || item.checkPen != null || item.speedPen != null) {
			let tempStack = []
			if (item.str != null) tempStack.push(`<strong>Strength </strong>${item.str}`)
			if (item.checkPen != null) tempStack.push(`<strong>Check Penalty </strong>${Parser.numToBonus(item.checkPen)}`)
			if (item.speedPen != null) tempStack.push(`<strong>Speed Penalty </strong>${Parser.numToBonus(item.speedPen)}`)
			renderStack.push(`<p class="pf2-stat__section">${tempStack.join("; ")}</p>`)
		}
		if (item.group != null) renderStack.push(`<p class="pf2-stat__section"><strong>Group </strong>${renderer.render(item.group)}</p>`)
		if (item.activate) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Activate </strong>${renderer.render(item.activate.activity.entry)} `);
			if (item.activate.components != null) {
				renderStack.push(`${renderer.render(item.activate.components)}`);
			}
			if (item.activate.frequency != null) {
				renderStack.push(`; <strong>Frequency </strong>${renderer.render(item.activate.frequency)}`);
			}
			if (item.activate.trigger != null) {
				renderStack.push(`; <strong>Trigger </strong>${renderer.render(item.activate.trigger)}`);
			}
			if (item.activate.requirements != null) {
				renderStack.push(`; <strong>Requirements </strong>${renderer.render(item.activate.requirements)}`);
			}
			renderStack.push(`</p>`);
		}
		if (item.onset) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Onset </strong>${item.price.amount} ${item.price.coin} ${item.price.note ? item.price.note : ""}</p>`);
		}
		if (renderStack.length !== 0) renderStack.push(`${Renderer.utils.getDividerDiv()}`)
		return renderStack.join("");
	},

	getVariantsHtml (item) {
		if (!item.generic || !item.variants || !item.variants.length) return "";
		const renderStack = [];
		const renderer = Renderer.get()
		item.variants.forEach((v) => {
			renderStack.push(Renderer.utils.getDividerDiv())
			renderStack.push(`<p class="pf2-stat__section--wide"><strong>Type </strong>${v.type}; `)
			if (v.level != null) renderStack.push(`<strong>Level </strong>${v.level}; `)
			if (v.traits != null && v.traits.length) {
				let trts = []
				v.traits.forEach((t) => {
					let traitname = Parser.getTraitName(t)
					trts.push(renderer.render(`{@trait ${traitname}|${Parser.TRAITS_TO_TRAITS_SRC[traitname]}|${t}}`))
				});
				renderStack[0] += `(${trts.join(", ")}); `
			}
			if (v.price != null) renderStack.push(`<strong>Price </strong>${Parser.priceToFull(v.price)}; `)
			if (v.bulk != null) renderStack.push(`<strong>Bulk </strong>${v.bulk}; `)
			if (v.entries != null && v.entries.length) renderer.recursiveRender(v.entries, renderStack)
			if (v.craft_requirements != null) renderStack.push(`<strong>Craft Requirements </strong>${v.craft_requirements}; `)
			if (v.shield_stats != null) renderStack.push(`The shield has Hardness ${v.shield_stats.hardness}, HP ${v.shield_stats.HP}, and BT ${v.shield_stats.BT}.`)
			renderStack.push(`</p>`)
		});
		return renderStack.join("")
	},

	getCraftRequirements (item) {
		if (item.craft_requirements != null) {
			return `${Renderer.utils.getDividerDiv()}<p class="pf2-stat__section"><strong>Craft Requirements </strong>${Renderer.get().render(item.craft_requirements)}</p>`
		} else return ""
	},

	getCompactRenderedString (item, opts) {
		opts = opts || {};
		const renderStack = [""]
		Renderer.get().recursiveRender(item.entries, renderStack, {depth: 1}, {pf2StatFix: true})

		return `${Renderer.utils.getExcludedDiv(item, "item", UrlUtil.PG_ITEMS)}
			${Renderer.utils.getNameDiv(item, {page: UrlUtil.PG_ITEMS})}
			${Renderer.utils.getDividerDiv()}
			${Renderer.utils.getTraitsDiv(item.traits)}
			${Renderer.item.getSubHead(item)}
			${renderStack.join("")}
			${Renderer.item.getVariantsHtml(item)}
			${Renderer.item.getCraftRequirements(item)}
			${Renderer.utils.getPageP(item)}`;
	},

	_hiddenRarity: new Set(["none", "unknown", "unknown (magic)", "varies"]),
	doRenderRarity (rarity) {
		return !Renderer.item._hiddenRarity.has(rarity);
	},

	_builtLists: {},
	propertyMap: {},
	typeMap: {},
	_additionalEntriesMap: {},
	_addProperty (p) {
		if (Renderer.item.propertyMap[p.abbreviation]) return;
		Renderer.item.propertyMap[p.abbreviation] = p.name ? MiscUtil.copy(p) : {
			name: p.entries[0].name.toLowerCase(),
			entries: p.entries,
			template: p.template,
		};
	},
	_addType (t) {
		if (Renderer.item.typeMap[t.abbreviation]) return;
		Renderer.item.typeMap[t.abbreviation] = t.name ? MiscUtil.copy(t) : {
			name: t.entries[0].name.toLowerCase(),
			entries: t.entries,
		};
	},
	_addAdditionalEntries (e) {
		if (Renderer.item._additionalEntriesMap[e.appliesTo]) return;
		Renderer.item._additionalEntriesMap[e.appliesTo] = MiscUtil.copy(e.entries);
	},
	async _pAddBrewPropertiesAndTypes () {
		const brew = await BrewUtil.pAddBrewData();
		(brew.itemProperty || []).forEach(p => Renderer.item._addProperty(p));
		(brew.itemType || []).forEach(t => Renderer.item._addType(t));
	},
	_addBasePropertiesAndTypes (baseItemData) {
		Object.entries(Parser.ITEM_TYPE_JSON_TO_ABV).forEach(([abv, name]) => Renderer.item._addType({
			abbreviation: abv,
			name,
		}));
		// Convert the property and type list JSONs into look-ups, i.e. use the abbreviation as a JSON property name
		baseItemData.itemType.forEach(t => {
			// air/water vehicles share a type
			if (t.abbreviation === "SHP") {
				const cpy = MiscUtil.copy(t);
				cpy.abbreviation = "AIR";
				Renderer.item._addType(cpy);
			}
			Renderer.item._addType(t);
		});
		baseItemData.itemTypeAdditionalEntries.forEach(e => Renderer.item._addAdditionalEntries(e));
	},

	_lockBuildList: null,
	async _pLockBuildList () {
		while (Renderer.item._lockBuildList) await Renderer.item._lockBuildList.lock;
		let unlock = null;
		const lock = new Promise(resolve => unlock = resolve);
		Renderer.item._lockBuildList = {
			lock,
			unlock,
		}
	},

	_unlockBuildList () {
		const lockMeta = Renderer.item._lockBuildList;
		if (Renderer.item._lockBuildList) {
			delete Renderer.item._lockBuildList;
			lockMeta.unlock();
		}
	},

	/**
	 * Runs callback with itemList as argument
	 * @param [opts] Options object.
	 * @param [opts.fnCallback] Run with args: allItems.
	 * @param [opts.urls] Overrides for default URLs.
	 * @param [opts.isAddGroups] Whether item groups should be included.
	 * @param [opts.isBlacklistVariants] Whether the blacklist should be respected when applying magic variants.
	 */
	async pBuildList (opts) {
		await Renderer.item._pLockBuildList();

		opts = opts || {};
		opts.urls = opts.urls || {};

		const kBlacklist = opts.isBlacklistVariants ? "withBlacklist" : "withoutBlacklist";
		if (Renderer.item._builtLists[kBlacklist]) {
			const cached = Renderer.item._builtLists[kBlacklist];

			Renderer.item._unlockBuildList();
			if (opts.fnCallback) return opts.fnCallback(cached);
			return cached;
		}

		// allows URLs to be overridden (used by roll20 script)
		const itemUrl = opts.urls.items || `${Renderer.get().baseUrl}data/items/items-crb.json`;
		const baseItemUrl = opts.urls.baseitems || `${Renderer.get().baseUrl}data/items/items-base.json`;

		const itemList = await Renderer.item._pGetAndProcItems(await DataUtil.loadJSON(itemUrl));
		const baseItems = await Renderer.item._pGetAndProcBaseItems(await DataUtil.loadJSON(baseItemUrl));
		const allItems = [...itemList, ...baseItems];
		Renderer.item._enhanceItems(allItems);
		Renderer.item._builtLists[kBlacklist] = allItems;

		Renderer.item._unlockBuildList();
		if (opts.fnCallback) return opts.fnCallback(allItems);
		return allItems;
	},

	async _pGetAndProcItems (itemData) {
		let items = []
		itemData.item.forEach((it) => {
			if (!it.generic) items.push(it)
			else items.push(...Renderer.item._createVariants(it))
		});
		return items
	},

	_getVariantName (variant, genericName) {
		let name = ""
		if (!genericName.toLowerCase().includes(variant.type.toLowerCase()) && !variant.type.toLowerCase().includes(genericName.toLowerCase())) {
			name = `${variant.type} ${genericName}`.toTitleCase()
		} else {
			name = variant.type.toTitleCase()
		}
		return name
	},

	_createVariants (genericItem) {
		let items = [genericItem]
		genericItem.variants.forEach((v) => {
			let varItem = MiscUtil.copy(genericItem)
			varItem.name = this._getVariantName(v, genericItem.name)
			varItem.level = v.level
			varItem.price = v.price
			varItem.bulk = v.bulk
			varItem.shield_stats = v.shield_stats
			varItem.craft_requirements = v.craft_requirements
			varItem.entries.push(...v.entries)
			varItem.generic = "V"
			delete varItem.variants
			items.push(varItem)
		});
		return items
	},

	async _pGetAndProcBaseItems (baseItemData) {
		Renderer.item._addBasePropertiesAndTypes(baseItemData);
		await Renderer.item._pAddBrewPropertiesAndTypes();
		return baseItemData.baseitem;
	},

	_getAndProcGenericVariants (variantData, isRespectBlacklist) {
		variantData.variant.forEach(Renderer.item._genericVariants_addInheritedPropertiesToSelf);
		if (isRespectBlacklist) {
			return [
				variantData.variant.filter(it => !ExcludeUtil.isExcluded(it.name, "variant", it.source)),
				variantData.linkedLootTables,
			]
		}
		return [variantData.variant, variantData.linkedLootTables];
	},

	_initFullEntries (item) {
		item._fullEntries = item._fullEntries || (item.entries ? MiscUtil.copy(item.entries) : []);
	},

	_initFullAdditionalEntries (item) {
		item._fullAdditionalEntries = item._fullAdditionalEntries || (item.additionalEntries ? MiscUtil.copy(item.additionalEntries) : []);
	},

	/**
	 * @param baseItems
	 * @param genericVariants
	 * @param [opts]
	 * @param [opts.linkedLootTables]
	 */
	_createSpecificVariants (baseItems, genericVariants, opts) {
		opts = opts || {};

		const genericAndSpecificVariants = [];
		baseItems.forEach((curBaseItem) => {
			curBaseItem._category = "Basic";
			if (curBaseItem.entries == null) curBaseItem.entries = [];

			if (curBaseItem.packContents) return; // e.g. "Arrows (20)"

			genericVariants.forEach((curGenericVariant) => {
				if (!Renderer.item._createSpecificVariants_hasRequiredProperty(curBaseItem, curGenericVariant)) return;
				if (Renderer.item._createSpecificVariants_hasExcludedProperty(curBaseItem, curGenericVariant)) return;

				genericAndSpecificVariants.push(Renderer.item._createSpecificVariants_createSpecificVariant(curBaseItem, curGenericVariant, opts));
			});
		});
		return genericAndSpecificVariants;
	},

	_createSpecificVariants_hasRequiredProperty (baseItem, genericVariant) {
		return genericVariant.requires.some(req => Object.entries(req).every(([k, v]) => baseItem[k] === v));
	},

	_createSpecificVariants_hasExcludedProperty (baseItem, genericVariant) {
		const curExcludes = genericVariant.excludes || {};
		return !!Object.keys(curExcludes).find(key => {
			if (curExcludes[key] instanceof Array) {
				return (baseItem[key] instanceof Array ? baseItem[key].find(it => curExcludes[key].includes(it)) : curExcludes[key].includes(baseItem[key]));
			}
			return baseItem[key] instanceof Array ? baseItem[key].find(it => curExcludes[key] === it) : curExcludes[key] === baseItem[key];
		});
	},

	/**
	 * @param baseItem
	 * @param genericVariant
	 * @param [opts]
	 * @param [opts.linkedLootTables]
	 */
	_createSpecificVariants_createSpecificVariant (baseItem, genericVariant, opts) {
		const inherits = genericVariant.inherits;
		const specificVariant = MiscUtil.copy(baseItem);
		// Recent enhancements/entry cache
		specificVariant._isEnhanced = false;
		delete specificVariant._fullEntries;

		if (baseItem.source !== SRC_CRB && baseItem.source !== SRC_APG) {
			Renderer.item._initFullEntries(specificVariant);
			specificVariant._fullEntries.unshift(`{@note The base item can be found in ${Parser.sourceJsonToFull(baseItem.source)}.}`);
		}

		specificVariant._baseName = baseItem.name;
		specificVariant._baseSrd = baseItem.srd;
		if (baseItem.source !== inherits.source) specificVariant._baseSource = baseItem.source;

		// Magic items do not inherit the value of the non-magical item
		delete specificVariant.value;

		// Magic variants apply their own SRD info; page info
		delete specificVariant.srd;
		delete specificVariant.page;

		specificVariant._category = "Specific Variant";
		Object.keys(inherits).forEach((inheritedProperty) => {
			switch (inheritedProperty) {
				case "namePrefix":
					specificVariant.name = `${inherits.namePrefix}${specificVariant.name}`;
					break;
				case "nameSuffix":
					specificVariant.name = `${specificVariant.name}${inherits.nameSuffix}`;
					break;
				case "entries": {
					Renderer.item._initFullEntries(specificVariant);

					const appliedPropertyEntries = Renderer.applyAllProperties(inherits.entries, Renderer.item._getInjectableProps(baseItem, inherits));
					appliedPropertyEntries.forEach((ent, i) => specificVariant._fullEntries.splice(i, 0, ent));
					break;
				}
				case "nameRemove": {
					specificVariant.name = specificVariant.name.replace(new RegExp(inherits[inheritedProperty], "g"), "")

					break;
				}
				case "weightExpression":
				case "valueExpression": {
					const exp = Renderer.item._createSpecificVariants_evaluateExpression(baseItem, specificVariant, inherits, inheritedProperty);

					const result = Renderer.dice.parseRandomise2(exp);
					if (result != null) {
						switch (inheritedProperty) {
							case "weightExpression":
								specificVariant.weight = result;
								break;
							case "valueExpression":
								specificVariant.value = result;
								break;
						}
					}

					break;
				}
				case "barding": {
					specificVariant.bardingType = baseItem.type;
					break;
				}
				default:
					specificVariant[inheritedProperty] = inherits[inheritedProperty];
			}
		});

		// track the specific variant on the parent generic, to later render as part of the stats
		// TAG ITEM_VARIANTS
		if (~Renderer.item.LINK_SPECIFIC_TO_GENERIC_DIRECTION) {
			genericVariant.variants = genericVariant.variants || [];
			genericVariant.variants.push({base: baseItem, specificVariant});
		}

		// add reverse link to get generic from specific--primarily used for indexing
		if (!~Renderer.item.LINK_SPECIFIC_TO_GENERIC_DIRECTION) specificVariant.genericVariant = genericVariant;

		// add linked loot tables
		if (opts.linkedLootTables && opts.linkedLootTables[specificVariant.source] && opts.linkedLootTables[specificVariant.source][specificVariant.name]) {
			(specificVariant.lootTables = specificVariant.lootTables || []).push(...opts.linkedLootTables[specificVariant.source][specificVariant.name])
		}

		return specificVariant;
	},

	_createSpecificVariants_evaluateExpression (baseItem, specificVariant, inherits, inheritedProperty) {
		return inherits[inheritedProperty].replace(/\[\[([^\]]+)]]/g, (...m) => {
			const propPath = m[1].split(".");
			return propPath[0] === "item"
				? MiscUtil.get(specificVariant, ...propPath.slice(1))
				: propPath[0] === "baseItem"
					? MiscUtil.get(baseItem, ...propPath.slice(1))
					: MiscUtil.get(specificVariant, ...propPath);
		});
	},

	_enhanceItems (allItems) {
		allItems.forEach((item) => Renderer.item.enhanceItem(item));
		return allItems;
	},

	/**
	 * @param genericVariants
	 * @param opts
	 * @param [opts.baseItemsUrl]
	 * @param [opts.additionalBaseItems]
	 * @param [opts.baseItems]
	 * @param [opts.isSpecificVariantsOnly]
	 */
	async pGetGenericAndSpecificVariants (genericVariants, opts) {
		opts = opts || {};

		let baseItems;
		if (opts.baseItems) {
			baseItems = opts.baseItems;
		} else {
			opts.baseItemsUrl = opts.baseItemsUrl || `${Renderer.get().baseUrl}data/items/items-base.json`;
			const baseItemData = await DataUtil.loadJSON(opts.baseItemsUrl);
			Renderer.item._addBasePropertiesAndTypes(baseItemData);
			baseItems = [...baseItemData.baseitem, ...(opts.additionalBaseItems || [])];
		}

		await Renderer.item._pAddBrewPropertiesAndTypes();
		genericVariants.forEach(Renderer.item._genericVariants_addInheritedPropertiesToSelf);
		const specificVariants = Renderer.item._createSpecificVariants(baseItems, genericVariants);
		const outSpecificVariants = Renderer.item._enhanceItems(specificVariants);

		if (opts.isSpecificVariantsOnly) return outSpecificVariants;

		const outGenericVariants = Renderer.item._enhanceItems(genericVariants);
		return [...outGenericVariants, ...outSpecificVariants];
	},

	_getInjectableProps (baseItem, inherits) {
		return {
			baseName: baseItem.name,
			dmgType: baseItem.dmgType ? Parser.dmgTypeToFull(baseItem.dmgType) : null,
			bonusAc: inherits.bonusAc,
			bonusWeapon: inherits.bonusWeapon,
			bonusWeaponAttack: inherits.bonusWeaponAttack,
			bonusWeaponDamage: inherits.bonusWeaponDamage,
			bonusSpellAttack: inherits.bonusSpellAttack,
			bonusSavingThrow: inherits.bonusSavingThrow,
		}
	},

	_INHERITED_PROPS_BLACKLIST: new Set([
		"entries", // Entries have specific merging
		"namePrefix", // Name prefix/suffix are meaningless
		"nameSuffix",
	]),
	_genericVariants_addInheritedPropertiesToSelf (genericVariant) {
		if (genericVariant._isInherited) return;
		genericVariant._isInherited = true;

		for (const prop in genericVariant.inherits) {
			if (Renderer.item._INHERITED_PROPS_BLACKLIST.has(prop)) continue;

			const val = genericVariant.inherits[prop];

			if (val == null) delete genericVariant[prop];
			else if (genericVariant[prop]) {
				if (genericVariant[prop] instanceof Array && val instanceof Array) genericVariant[prop] = MiscUtil.copy(genericVariant[prop]).concat(val);
				else genericVariant[prop] = val;
			} else genericVariant[prop] = genericVariant.inherits[prop];
		}

		if (!genericVariant.entries && genericVariant.inherits.entries) {
			genericVariant.entries = MiscUtil.copy(Renderer.applyAllProperties(genericVariant.inherits.entries, genericVariant.inherits));
		}
		if (genericVariant.requires.armor) genericVariant.armor = genericVariant.requires.armor;
	},

	getItemTypeName (t) {
		const fullType = Renderer.item.typeMap[t];
		if (!fullType) throw new Error(`Item type ${t} not found. You probably meant to load the property/type reference first; see \`Renderer.item.populatePropertyAndTypeReference()\`.`);
		return fullType.name || t;
	},

	enhanceItem (item) {
		return;
		if (item._isEnhanced) return;
		item._isEnhanced = true;
		if (item.noDisplay) return;
		if (item.type === "GV") item._category = "Generic Variant";
		if (item._category == null) item._category = "Other";
		if (item.entries == null) item.entries = [];
		if (item.type && Renderer.item.typeMap[item.type] && Renderer.item.typeMap[item.type].entries) {
			Renderer.item._initFullEntries(item);
			Renderer.item.typeMap[item.type].entries.forEach(e => item._fullEntries.push(e));
		}
		if (item.property) {
			item.property.forEach(p => {
				if (!Renderer.item.propertyMap[p]) throw new Error(`Item property ${p} not found. You probably meant to load the property/type reference first; see \`Renderer.item.populatePropertyAndTypeReference()\`.`);
				if (Renderer.item.propertyMap[p].entries) {
					Renderer.item._initFullEntries(item);
					Renderer.item.propertyMap[p].entries.forEach(e => item._fullEntries.push(e));
				}
			});
		}
		// The following could be encoded in JSON, but they depend on more than one JSON property; maybe fix if really bored later
		if (item.type === "LA" || item.type === "MA" || item.type === "HA") {
			if (item.resist) {
				Renderer.item._initFullEntries(item);
				item._fullEntries.push(`You have resistance to ${item.resist} damage while you wear this armor.`);
			}
			if (item.stealth) {
				Renderer.item._initFullEntries(item);
				item._fullEntries.push("The wearer has disadvantage on Dexterity ({@skill Stealth}) checks.");
			}
			if (item.type === "HA" && item.strength) {
				Renderer.item._initFullEntries(item);
				item._fullEntries.push(`If the wearer has a Strength score lower than ${item.strength}, their speed is reduced by 10 feet.`);
			}
		} else if (item.resist) {
			if (item.type === "P") {
				Renderer.item._initFullEntries(item);
				item._fullEntries.push(`When you drink this potion, you gain resistance to ${item.resist} damage for 1 hour.`);
			}
			if (item.type === "RG") {
				Renderer.item._initFullEntries(item);
				item._fullEntries.push(`You have resistance to ${item.resist} damage while wearing this ring.`);
			}
			if (!item.type && item.wondrous && item.tattoo) {
				Renderer.item._initFullEntries(item);
				item._fullEntries.push(
					`Produced by a special needle, this magic tattoo features designs that emphasize one color (${item.color}).`,
					{
						type: "entries",
						name: "Tattoo Attunement",
						entries: [
							"To attune to this item, you hold the needle to your skin where you want the tattoo to appear, pressing the needle there throughout the attunement process. When the attunement is complete, the needle turns into the ink that becomes the tattoo, which appears on the skin.",
							"If your attunement to the tattoo ends, the tattoo vanishes, and the needle reappears in your space.",
						],
					},
					{
						type: "entries",
						name: "Damage Resistance",
						entries: [
							`While the tattoo is on your skin, you have resistance to ${item.resist} damage`,
						],
					},
					{
						type: "entries",
						name: "Damage Absorption",
						entries: [
							`When you take ${item.resist} damage, you can use your reaction to gain immunity against that instance of the damage, and you regain a number of hit points equal to half the damage you would have taken. Once this reaction is used, it can't be used again until the next dawn.`,
						],
					},
				);
			}
		}
		if (item.type === "SCF") {
			if (item._isItemGroup) {
				if (item.scfType === "arcane" && item.source !== SRC_ERLW) {
					Renderer.item._initFullEntries(item);
					item._fullEntries.push("An arcane focus is a special item\u2014an orb, a crystal, a rod, a specially constructed staff, a wand-like length of wood, or some similar item\u2014designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus.");
				}
				if (item.scfType === "druid") {
					Renderer.item._initFullEntries(item);
					item._fullEntries.push("A druidic focus might be a sprig of mistletoe or holly, a wand or scepter made of yew or another special wood, a staff drawn whole out of a living tree, or a totem object incorporating feathers, fur, bones, and teeth from sacred animals. A druid can use such an object as a spellcasting focus.");
				}
				if (item.scfType === "holy") {
					Renderer.item._initFullEntries(item);
					item._fullEntries.push("A holy symbol is a representation of a god or pantheon. It might be an amulet depicting a symbol representing a deity, the same symbol carefully engraved or inlaid as an emblem on a shield, or a tiny box holding a fragment of a sacred relic. A cleric or paladin can use a holy symbol as a spellcasting focus. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.");
				}
			} else {
				if (item.scfType === "arcane") {
					Renderer.item._initFullEntries(item);
					item._fullEntries.push("An arcane focus is a special item designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus.");
				}
				if (item.scfType === "druid") {
					Renderer.item._initFullEntries(item);
					item._fullEntries.push("A druid can use this object as a spellcasting focus.");
				}
				if (item.scfType === "holy") {
					Renderer.item._initFullEntries(item);
					item._fullEntries.push("A holy symbol is a representation of a god or pantheon.");
					item._fullEntries.push("A cleric or paladin can use a holy symbol as a spellcasting focus. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.");
				}
			}
		}
		// add additional entries based on type (e.g. XGE variants)
		if (item.type === "T" || item.type === "AT" || item.type === "INS" || item.type === "GS") { // tools, artisan's tools, instruments, gaming sets
			Renderer.item._initFullAdditionalEntries(item);
			item._fullAdditionalEntries.push({type: "hr"}, `{@note See the {@variantrule Tool Proficiencies|XGE} entry for more information.}`);
		}

		// Add additional sources for all instruments and gaming sets
		if (item.type === "INS" || item.type === "GS") item.additionalSources = item.additionalSources || [];
		if (item.type === "INS") {
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 83)) {
				item.additionalSources.push({
					"source": "XGE",
					"page": 83,
				});
			}
		} else if (item.type === "GS") {
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 81)) {
				item.additionalSources.push({
					"source": "XGE",
					"page": 81,
				});
			}
		}

		if (item.type && Renderer.item._additionalEntriesMap[item.type]) {
			Renderer.item._initFullAdditionalEntries(item);
			const additional = Renderer.item._additionalEntriesMap[item.type];
			item._fullAdditionalEntries.push({type: "entries", entries: additional});
		}

		// bake in types
		const [typeListText, typeHtml] = Renderer.item.getHtmlAndTextTypes(item);
		item._typeListText = typeListText;
		item._typeHtml = typeHtml;

		// bake in attunement
		const [attune, attuneCat] = Renderer.item.getAttunementAndAttunementCatText(item);
		item._attunement = attune;
		item._attunementCategory = attuneCat;

		if (item.reqAttuneAlt) {
			const [attuneAlt, attuneCatAlt] = Renderer.item.getAttunementAndAttunementCatText(item, "reqAttuneAlt");
			item._attunementCategory = [attuneCat, attuneCatAlt];
		}

		// handle item groups
		if (item._isItemGroup) {
			Renderer.item._initFullEntries(item);
			item._fullEntries.push(
				"Multiple variations of this item exist, as listed below:",
				{
					type: "list",
					items: item.items.map(it => typeof it === "string" ? `{@item ${it}}` : `{@item ${it.name}|${it.source}}`),
				},
			);
		}

		// region Add base items list
		// item.variants was added during generic variant creation
		// TAG ITEM_VARIANTS
		if (item.variants && item.variants.length) {
			Renderer.item._initFullEntries(item);
			item._fullEntries.push({
				type: "entries",
				name: "Base items",
				entries: [
					"This item variant can be applied to the following base items:",
					{
						type: "list",
						items: item.variants.map(({base, specificVariant}) => {
							return `{@item ${base.name}|${base.source}} ({@item ${specificVariant.name}|${specificVariant.source}})`
						}),
					},
				],
			});
		}
		// endregion
	},

	unenhanceItem (item) {
		if (!item._isEnhanced) return;
		delete item._isEnhanced;
		delete item._fullEntries;
	},

	async getItemsFromHomebrew (homebrew) {
		(homebrew.itemProperty || []).forEach(p => Renderer.item._addProperty(p));
		(homebrew.itemType || []).forEach(t => Renderer.item._addType(t));
		let items = [...(homebrew.baseitem || []), ...(homebrew.item || [])];
		Renderer.item._enhanceItems(items);

		let isReEnhanceVariants = false;

		// Get specific variants for brew base items, using official generic variants
		if (homebrew.baseitem && homebrew.baseitem.length) {
			isReEnhanceVariants = true;

			const variants = await Renderer.item.pGetGenericAndSpecificVariants(
				Renderer.item._builtLists["genericVariants"],
				{baseItems: homebrew.baseitem || [], isSpecificVariantsOnly: true},
			);
			items = [...items, ...variants];
		}

		// Get specific and generic variants for official and brew base items, using brew generic variants
		if (homebrew.variant && homebrew.variant.length) {
			isReEnhanceVariants = true;

			const variants = await Renderer.item.pGetGenericAndSpecificVariants(
				homebrew.variant,
				{additionalBaseItems: homebrew.baseitem || []},
			);
			items = [...items, ...variants];
		}

		// Regenerate the full entries for the generic variants, as there may be more specific variants to add to their
		//   specific variant lists.
		if (isReEnhanceVariants && Renderer.item._builtLists["genericVariants"]) {
			Renderer.item._builtLists["genericVariants"].forEach(item => {
				item.variants.sort((a, b) => SortUtil.ascSortLower(a.base.name, b.base.name) || SortUtil.ascSortLower(a.base.source, b.base.source));
				Renderer.item.unenhanceItem(item);
				Renderer.item.enhanceItem(item);
			});
		}

		return items;
	},

	// flip e.g. "longsword +1" to "+1 longsword"
	modifierPostToPre (item) {
		const m = /^(.*)(?:,)? (\+\d+)$/.exec(item.name);
		if (m) return Object.assign(MiscUtil.copy(item), {name: `${m[2]} ${m[1]}`});
		else return null
	},

	_isRefPopulated: false,
	populatePropertyAndTypeReference: () => {
		if (Renderer.item._isRefPopulated) return Promise.resolve();
		return new Promise((resolve, reject) => {
			DataUtil.loadJSON(`${Renderer.get().baseUrl}data/items/items-base.json`)
				.then(data => {
					if (Renderer.item._isRefPopulated) {
						resolve();
					} else {
						try {
							Object.entries(Parser.ITEM_TYPE_JSON_TO_ABV).forEach(([abv, name]) => Renderer.item._addType({
								abbreviation: abv,
								name,
							}));
							data.itemProperty.forEach(p => Renderer.item._addProperty(p));
							data.itemType.forEach(t => Renderer.item._addType(t));
							data.itemTypeAdditionalEntries.forEach(e => Renderer.item._addAdditionalEntries(e));
							Renderer.item._pAddBrewPropertiesAndTypes()
								.then(() => {
									Renderer.item._isRefPopulated = true;
									resolve();
								});
						} catch (e) {
							reject(e);
						}
					}
				});
		});
	},

	// fetch every possible indexable item from official data
	async getAllIndexableItems (rawVariants, rawBaseItems) {
		Renderer.item.LINK_SPECIFIC_TO_GENERIC_DIRECTION = -1;

		const basicItems = await Renderer.item._pGetAndProcBaseItems(rawBaseItems);
		const [genericVariants, linkedLootTables] = await Renderer.item._getAndProcGenericVariants(rawVariants);
		const specificVariants = Renderer.item._createSpecificVariants(basicItems, genericVariants, {linkedLootTables});

		const revNames = [];
		[...genericVariants, ...specificVariants].forEach(item => {
			if (item.variants) delete item.variants; // prevent circular references
			const revName = Renderer.item.modifierPostToPre(MiscUtil.copy(item));
			if (revName) revNames.push(revName);
		});

		specificVariants.push(...revNames);

		return specificVariants;
	},

	pGetFluff (item) {
		return Renderer.utils.pGetFluff({
			entity: item,
			fluffProp: "itemFluff",
			fluffUrl: `data/fluff-items.json`,
		});
	},
};

Renderer.runeItem = {
	getRuneShortName (rune) {
		if (rune.shortName) return rune.shortName;
		let name = typeof rune === "string" ? rune : rune.name;
		if (name.startsWith("+")) return name.split(" ")[0];
		return name.toTitleCase();
	},

	getTag (baseItem, runes) {
		return [baseItem].map(it => [it.name, it.source]).concat(runes.map(it => [it.name, it.source])).flat().join("|")
	},

	getHashesFromTag (tag) {
		const split = tag.split("|").map(it => it.trim()).map(it => it === "" ? SRC_CRB : it);
		if (split.length % 2) {
			split.pop();
		}
		const out = [];
		while (split.length) { out.push(split.splice(0, 2)) }
		return out.map(it => UrlUtil.encodeForHash(it));
	},

	getRuneItem (baseItem, runes) {
		let runeItem = MiscUtil.copy(baseItem);
		runeItem.name = [...runes.map(r => Renderer.runeItem.getRuneShortName(r)), runeItem.name].join(" ");
		runeItem.type = "item";
		runeItem.category = "Rune Item";
		runeItem.level = Math.max(...runes.map(r => r.level));
		runeItem.traits = [...new Set([baseItem.traits, ...runes.map(it => it.traits)].flat())].sort(SortUtil.sortTraits);
		const value = [baseItem, ...runes].map(it => Parser.priceToValue(it.price)).reduce((a, b) => a + b, 0);
		runeItem.price = {coin: "gp", amount: Math.floor(value / 100)};
		runeItem.entries = [runeItem.entries, ...runes.map(r => r.entries.map((e, idx) => idx === 0 ? `{@bold ${r.name}} ${e}` : e))].flat();
		runeItem.runeItem = true;
		return runeItem;
	},
};

Renderer.rule = {
	getCompactRenderedString (rule) {
		return `
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(rule)}
			</td></tr>
		`;
	},
};

Renderer.variantrule = {
	getCompactRenderedString (rule) {
		const cpy = MiscUtil.copy(rule);
		delete cpy.name;
		return `
			${Renderer.utils.getExcludedTr(rule, "variantrule", UrlUtil.PG_VARIANTRULES)}
			${Renderer.utils.getNameTr(rule, {page: UrlUtil.PG_VARIANTRULES})}
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(cpy)}
			</td></tr>
		`;
	},
};

Renderer.table = {
	getCompactRenderedString (it) {
		it.type = it.type || "table";
		const cpy = MiscUtil.copy(it);
		delete cpy.name;
		return `
			${Renderer.utils.getExcludedTr(it, "table", UrlUtil.PG_TABLES)}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TABLES})}
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(it)}
			</td></tr>
		`;
	},
};

Renderer.action = {
	getCompactRenderedString (it, opts) {
		opts = opts || {};
		let renderStack = [""];
		Renderer.get().setFirstSection(true).recursiveRender(it.entries, renderStack, {depth: 1}, {pf2StatFix: true})
		return `
		${Renderer.utils.getExcludedDiv(it, "action", UrlUtil.PG_ACTIONS)}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_ACTIONS, activity: true, type: ""})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(it.traits || [])}
		${Renderer.action.getSubHead(it)}
		${renderStack.join("")}
		${opts.noPage ? "" : Renderer.utils.getPageP(it)}`;
	},
	getSubHead (it) {
		const renderStack = [];
		const renderer = Renderer.get()
		if (it.prerequisites != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Prerequisites </strong>${renderer.render(it.prerequisites)}</p>`);
		}
		if (it.frequency != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Frequency </strong>${renderer.render(it.frequency)}</p>`);
		}
		if (it.trigger != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Trigger </strong>${renderer.render(it.trigger)}</p>`);
		}
		if (it.requirements != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Requirements </strong>${renderer.render(it.requirements)}</p>`);
		}
		if (renderStack.length !== 0) renderStack.push(`${Renderer.utils.getDividerDiv()}`)
		return renderStack.join("");
	},
	getQuickRules (it) {
		let renderStack = [""]
		Renderer.get().setFirstSection(true).recursiveRender({type: "pf2-h3", name: it.name, entries: it.info}, renderStack, {depth: 1})
		return `
		${Renderer.utils.getExcludedDiv(it, "action", UrlUtil.PG_ACTIONS)}
		${renderStack.join("")}
		${Renderer.utils.getPageP(it)}`
	},
};

Renderer.ability = {
	getCompactRenderedString (it) {
		let renderStack = [""]
		Renderer.get().setFirstSection(true).recursiveRender(it.entries, renderStack, {depth: 1}, {pf2StatFix: true})
		return `
		${Renderer.utils.getExcludedDiv(it, "ability", UrlUtil.PG_ABILITIES)}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_ABILITIES, activity: true, type: ""})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(it.traits || [])}
		${Renderer.ability.getSubHead(it)}
		${renderStack.join("")}
		${Renderer.utils.getPageP(it)}`;
	},
	getSubHead (it) {
		const renderStack = [];
		const renderer = Renderer.get()
		if (it.prerequisites != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Prerequisites </strong>${renderer.render(it.prerequisites)}</p>`);
		}
		if (it.frequency != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Frequency </strong>${renderer.render(it.frequency)}</p>`);
		}
		if (it.trigger != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Trigger </strong>${renderer.render(it.trigger)}</p>`);
		}
		if (it.requirements != null) {
			renderStack.push(`<p class="pf2-stat__section"><strong>Requirements </strong>${renderer.render(it.requirements)}</p>`);
		}
		if (renderStack.length !== 0) renderStack.push(`${Renderer.utils.getDividerDiv()}`)
		return renderStack.join("");
	},
	getQuickRules (it) {
		let renderStack = [""]
		Renderer.get().setFirstSection(true).recursiveRender({type: "pf2-h3", name: it.name, entries: it.info}, renderStack, {depth: 1})
		return `
		${Renderer.utils.getExcludedDiv(it, "action", UrlUtil.PG_ACTIONS)}
		${renderStack.join("")}
		${Renderer.utils.getPageP(it)}`
	},
};

Renderer.language = {
	getCompactRenderedString (it) {
		return Renderer.language.getRenderedString(it);
	},

	getRenderedString (it) {
		const textStack = [""];
		const renderer = Renderer.get().setFirstSection(true);
		const allEntries = [];
		if (it.entries) allEntries.push(...it.entries);
		if (!allEntries.length && !it.typicalSpeakers) allEntries.push("{@i No information available.}");
		renderer.recursiveRender(allEntries, textStack, {depth: 2}, {pf2StatFix: true})

		return `
		${Renderer.utils.getExcludedDiv(it, "language", UrlUtil.PG_LANGUAGES)}
		${Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_LANGUAGES, type: `${it.type ? `${it.type} ` : ""}language`})}
		${Renderer.utils.getDividerDiv()}
		${it.typicalSpeakers ? `<p class="pf2-stat__section"><b>Typical Speakers</b> ${Renderer.get().render(it.typicalSpeakers.join(", "))}</b></p>` : ""}
		${allEntries.length ? `${Renderer.get().setFirstSection(true).render(allEntries)}` : ""}
		${Renderer.utils.getPageP(it)}`;
	},

	pGetFluff (it) {
		return Renderer.utils.pGetFluff({
			entity: it,
			fluffProp: "languageFluff",
			fluffUrl: `data/fluff-languages.json`,
		});
	},
};

Renderer.adventureBook = {
	getEntryIdLookup (bookData, doThrowError = true) {
		const out = {};
		const titlesRel = {};

		let chapIx;
		const depthStack = [];
		const handlers = {
			object: (obj) => {
				Renderer.ENTRIES_WITH_ENUMERATED_TITLES
					.forEach(meta => {
						if (obj.type !== meta.type) return;

						const curDepth = depthStack.length ? depthStack.last() : 0;
						const nxtDepth = meta.depth ? meta.depth : meta.depthIncrement ? curDepth + meta.depthIncrement : curDepth;

						depthStack.push(
							Math.min(
								nxtDepth,
								2,
							),
						);

						if (obj.id) {
							if (out[obj.id]) {
								(out.__BAD = out.__BAD || []).push(obj.id);
							} else {
								out[obj.id] = {
									chapter: chapIx,
									entry: obj,
									depth: depthStack.last(),
								};

								if (obj.name) {
									const cleanName = obj.name.toLowerCase();
									titlesRel[cleanName] = titlesRel[cleanName] || 0;
									out[obj.id].ixTitleRel = titlesRel[cleanName]++;
									out[obj.id].nameClean = cleanName;
								}
							}
						}
					});

				return obj;
			},
			postObject: (obj) => {
				Renderer.ENTRIES_WITH_ENUMERATED_TITLES
					.forEach(meta => {
						if (obj.type !== meta.type) return;

						depthStack.pop();
					});
			},
		};

		bookData.forEach((chap, _chapIx) => {
			chapIx = _chapIx;
			MiscUtil.getWalker().walk(chap, handlers);
		});

		if (doThrowError) if (out.__BAD) throw new Error(`IDs were already in storage: ${out.__BAD.map(it => `"${it}"`).join(", ")}`);

		return out;
	},
};

Renderer.companionfamiliar = {
	getRenderedString (it) {
		if (it.type === "Companion") return Renderer.companion.getRenderedString(it);
		if (it.type === "Familiar") return Renderer.familiar.getRenderedString(it);
	},
};

Renderer.companion = {
	getRenderedString (companion) {
		const renderer = Renderer.get();
		return $$`${Renderer.utils.getExcludedDiv(companion, "companion", UrlUtil.PG_COMPANIONS_FAMILIARS)}
		${Renderer.utils.getNameDiv(companion, {type: "Companion"})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(companion.traits)}
		${companion.access ? `<p class="pf2-stat__section"><strong>Access </strong>${companion.access}</p>` : ""}
		${(companion.traits && companion.traits.length) || companion.access ? Renderer.utils.getDividerDiv() : ""}
		${companion.fluff ? `<p class="pf2-stat__section--wide">${renderer.render(companion.fluff)}</p>` : ""}
		<p class="pf2-stat__section"><strong>Size </strong>${companion.size}</p>
		${Renderer.creature.getAttacks(companion)}
		${Renderer.creature.getAbilityMods(companion.abilityMod)}
		<p class="pf2-stat__section"><strong>Hit Points </strong>${companion.HP}</p>
		<p class="pf2-stat__section"><strong>Skill </strong>${renderer.render(`{@skill ${companion.skill}}`)}</p>
		${Renderer.creature.getSpeed(companion)}
		<p class="pf2-stat__section"><strong>Support Benefit </strong>${renderer.render(companion.support)}</p>
		<p class="pf2-stat__section mb-4"><strong>Advanced Maneuver </strong>${companion.maneuver.name}</p>
		${Renderer.action.getCompactRenderedString(companion.maneuver, {noPage: true})}
		${Renderer.utils.getPageP(companion)}`;
	},
};

Renderer.familiar = {
	getRenderedString (familiar) {
		return $$`${Renderer.utils.getExcludedDiv(familiar, "familiar", UrlUtil.PG_COMPANIONS_FAMILIARS)}
		${Renderer.utils.getNameDiv(familiar, {type: "Familiar"})}
		${Renderer.utils.getDividerDiv()}
		${Renderer.utils.getTraitsDiv(familiar.traits)}
		${familiar.alignment ? `<p class="pf2-stat__section"><strong>Alignment </strong>${familiar.alignment}</p>` : ""}
		<p class="pf2-stat__section"><strong>Required Number of Abilities </strong>${familiar.requires}</p>
		<p class="pf2-stat__section"><strong>Granted Abilities </strong>${familiar.granted.join(", ")}</p>
		${Renderer.utils.getDividerDiv()}
		${familiar.abilities.map(a => Renderer.creature.getRenderedAbility(a))}
		${Renderer.utils.getPageP(familiar)}`;
	},
};

Renderer.generic = {
	getCompactRenderedString (it) {
		return `
		${Renderer.utils.getNameDiv(it)}
		${Renderer.get().setFirstSection(true).render({entries: it.entries})}
		${Renderer.utils.getPageP(it)}`;
	},
};

Renderer.hover = {
	TAG_TO_PAGE: {
		"spell": UrlUtil.PG_SPELLS,
		"item": UrlUtil.PG_ITEMS,
		"creature": UrlUtil.PG_BESTIARY,
		"condition": UrlUtil.PG_CONDITIONS,
		"disease": UrlUtil.PG_AFFLICTIONS,
		"curse": UrlUtil.PG_AFFLICTIONS,
		"itemcurse": UrlUtil.PG_AFFLICTIONS,
		"background": UrlUtil.PG_BACKGROUNDS,
		"race": UrlUtil.PG_ANCESTRIES,
		"optfeature": UrlUtil.PG_COMPANIONS_FAMILIARS,
		"feat": UrlUtil.PG_FEATS,
		"trap": UrlUtil.PG_HAZARDS,
		"hazard": UrlUtil.PG_HAZARDS,
		"deity": UrlUtil.PG_DEITIES,
		"variantrule": UrlUtil.PG_VARIANTRULES,
	},

	LinkMeta: function () {
		this.isHovered = false;
		this.isLoading = false;
		this.isPermanent = false;
		this.windowMeta = null;
	},

	_BAR_HEIGHT: 16,

	_linkCache: {},
	_eleCache: new Map(),
	_entryCache: {},
	_isInit: false,
	_dmScreen: null,
	_lastId: 0,
	_contextMenu: null,
	_contextMenuLastClickedHeader: null,

	bindDmScreen (screen) {
		this._dmScreen = screen;
	},

	_getNextId () {
		return ++Renderer.hover._lastId;
	},

	_doInit () {
		if (!Renderer.hover._isInit) {
			Renderer.hover._isInit = true;

			$(document.body).on("click", () => Renderer.hover.cleanTempWindows());

			Renderer.hover._contextMenu = ContextUtil.getMenu([
				new ContextUtil.Action(
					"Maximize All",
					() => {
						const $permWindows = $(`.hoverborder[data-perm="true"]`);
						$permWindows.attr("data-display-title", "false");
					},
				),
				new ContextUtil.Action(
					"Minimize All",
					() => {
						const $permWindows = $(`.hoverborder[data-perm="true"]`);
						$permWindows.attr("data-display-title", "true");
					},
				),
				null,
				new ContextUtil.Action(
					"Close Others",
					() => {
						const $thisHoverClose = $(Renderer.hover._contextMenuLastClickedHeader).closest(`.hoverborder--top`).find(`.hvr__close`);
						$(`.hvr__close`).not($thisHoverClose).click();
					},
				),
				new ContextUtil.Action(
					"Close All",
					() => $(`.hvr__close`).click(),
				),
			]);
		}
	},

	cleanTempWindows () {
		for (const [ele, meta] of Renderer.hover._eleCache.entries()) {
			if (!meta.isPermanent && meta.windowMeta && !document.body.contains(ele)) {
				meta.windowMeta.doClose();
			} else if (!meta.isPermanent && meta.isHovered && meta.windowMeta) {
				// Check if any elements have failed to clear their hovering status on mouse move
				const bounds = ele.getBoundingClientRect();
				if (EventUtil._mouseX < bounds.x
					|| EventUtil._mouseY < bounds.y
					|| EventUtil._mouseX > bounds.x + bounds.width
					|| EventUtil._mouseY > bounds.y + bounds.height) {
					meta.windowMeta.doClose();
				}
			}
		}
	},

	_getSetMeta (ele) {
		if (!Renderer.hover._eleCache.has(ele)) Renderer.hover._eleCache.set(ele, new Renderer.hover.LinkMeta());
		return Renderer.hover._eleCache.get(ele);
	},

	_handleGenericMouseOverStart (evt, ele) {
		// Don't open on small screens unless forced
		if (Renderer.hover.isSmallScreen(evt) && !evt.shiftKey) return;

		Renderer.hover.cleanTempWindows();

		const meta = Renderer.hover._getSetMeta(ele);
		if (meta.isHovered || meta.isLoading) return; // Another hover is already in progress

		// Set the cursor to a waiting spinner
		ele.style.cursor = "wait";

		meta.isHovered = true;
		meta.isLoading = true;
		meta.isPermanent = evt.shiftKey;

		return meta;
	},

	// (Baked into render strings)
	async pHandleLinkMouseOver (evt, ele, page, source, hash, preloadId) {
		Renderer.hover._doInit();

		const meta = Renderer.hover._handleGenericMouseOverStart(evt, ele);
		if (meta == null) return;

		if (evt.ctrlKey && Renderer.hover._pageToFluffFn(page)) meta.isFluff = true;

		let toRender;
		if (preloadId != null) {
			const [type, data] = preloadId.split(":");
			switch (type) {
				case VeCt.HASH_MON_SCALED: {
					const baseMon = await Renderer.hover.pCacheAndGet(page, source, hash);
					toRender = await ScaleCreature.scale(baseMon, Number(data));
					break;
				}
				case VeCt.HASH_ITEM_RUNES: {
					toRender = Renderer.hover._getFromCache(page, source, hash);
					if (toRender) break;
					const [baseItem, ...runes] = await Promise.all(data.split(HASH_SUB_LIST_SEP).map(h => Renderer.hover.pCacheAndGet(page, h.split(HASH_LIST_SEP)[1], h)));
					toRender = Renderer.runeItem.getRuneItem(baseItem, runes);
					Renderer.hover._addToCache(page, source, hash, toRender);
					break;
				}
			}
		} else {
			if (meta.isFluff) {
				// Try to fetch the fluff directly
				toRender = await Renderer.hover.pCacheAndGet(`fluff__${page}`, source, hash);
				// Fall back on fluff attached to the object itself
				const entity = await Renderer.hover.pCacheAndGet(page, source, hash);
				const pFnGetFluff = Renderer.hover._pageToFluffFn(page);
				toRender = await pFnGetFluff(entity);
			} else toRender = await Renderer.hover.pCacheAndGet(page, source, hash);
		}

		meta.isLoading = false;
		// Check if we're still hovering the entity
		if (!meta.isHovered && !meta.isPermanent) return;

		const $content = meta.isFluff
			? Renderer.hover.$getHoverContent_fluff(page, toRender)
			: Renderer.hover.$getHoverContent_stats(page, toRender);
		const sourceData = {
			type: "stats",
			page,
			source,
			hash,
		};
		meta.windowMeta = Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title: toRender ? toRender.name : "",
				isPermanent: meta.isPermanent,
				pageUrl: `${Renderer.get().baseUrl}${page}#${hash}`,
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = meta.isFluff = false,
			},
			sourceData,
		);

		// Reset cursor
		ele.style.cursor = "";

		if (page === UrlUtil.PG_BESTIARY && !meta.isFluff) {
			const win = (evt.view || {}).window;
			const renderFn = Renderer.hover._pageToRenderFn(page);
			if (win._IS_POPOUT) {
				$content.find(`.mon__btn-scale-cr`).remove();
				$content.find(`.mon__btn-reset-cr`).remove();
			} else {
				$content
					.on("click", ".mon__btn-scale-cr", (evt) => {
						evt.stopPropagation();
						const win = (evt.view || {}).window;

						const $btn = $(evt.target).closest("button");
						const initialCr = toRender._originalCr != null ? toRender._originalCr : toRender.cr.cr || toRender.cr;
						const lastCr = toRender.cr.cr || toRender.cr;

						Renderer.creature.getCrScaleTarget(
							win,
							$btn,
							lastCr,
							async (targetCr) => {
								const original = await Renderer.hover.pCacheAndGet(page, source, hash);
								if (Parser.numberToCr(targetCr) === initialCr) {
									toRender = original;
									sourceData.type = "stats";
									delete sourceData.cr;
								} else {
									toRender = await ScaleCreature.scale(toRender, targetCr);
									sourceData.type = "statsCreatureScaled";
									sourceData.crNumber = targetCr;
								}

								$content.empty().append(renderFn(toRender));
								meta.windowMeta.$windowTitle.text(toRender._displayName || toRender.name);
							},
							true,
						);
					});

				$content
					.on("click", ".mon__btn-reset-cr", async () => {
						toRender = await Renderer.hover.pCacheAndGet(page, source, hash);
						$content.empty().append(renderFn(toRender));
						meta.windowMeta.$windowTitle.text(toRender._displayName || toRender.name);
					});
			}
		}
	},

	// (Baked into render strings)
	handleLinkMouseLeave (evt, ele) {
		const meta = Renderer.hover._eleCache.get(ele);
		ele.style.cursor = "";

		if (!meta || meta.isPermanent) return;

		if (evt.shiftKey) {
			meta.isPermanent = true;
			meta.windowMeta.setIsPermanent(true);
			return;
		}

		meta.isHovered = false;
		if (meta.windowMeta) {
			meta.windowMeta.doClose();
			meta.windowMeta = null;
		}
	},

	// (Baked into render strings)
	handleLinkMouseMove (evt, ele) {
		const meta = Renderer.hover._eleCache.get(ele);
		if (!meta || meta.isPermanent || !meta.windowMeta) return;

		meta.windowMeta.setPosition(Renderer.hover.getWindowPositionFromEvent(evt));

		if (evt.shiftKey && !meta.isPermanent) {
			meta.isPermanent = true;
			meta.windowMeta.setIsPermanent(true);
		}
	},

	/**
	 * (Baked into render strings)
	 * @param evt
	 * @param ele
	 * @param entryId
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [opts.isLargeBookContent]
	 */
	handlePredefinedMouseOver (evt, ele, entryId, opts) {
		opts = opts || {};

		const meta = Renderer.hover._handleGenericMouseOverStart(evt, ele);
		if (meta == null) return;

		Renderer.hover.cleanTempWindows();

		const toRender = Renderer.hover._entryCache[entryId];

		meta.isLoading = false;
		// Check if we're still hovering the entity
		if (!meta.isHovered && !meta.isPermanent) return;

		const $content = Renderer.hover.$getHoverContent_generic(toRender, opts);
		meta.windowMeta = Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title: toRender.data && toRender.data.hoverTitle != null ? toRender.data.hoverTitle : toRender.name,
				isPermanent: meta.isPermanent,
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = false,
			},
		);

		// Reset cursor
		ele.style.cursor = "";
	},

	// (Baked into render strings)
	handlePredefinedMouseLeave (evt, ele) {
		return Renderer.hover.handleLinkMouseLeave(evt, ele)
	},

	// (Baked into render strings)
	handlePredefinedMouseMove (evt, ele) {
		return Renderer.hover.handleLinkMouseMove(evt, ele)
	},

	getWindowPositionFromEvent (evt) {
		const ele = evt.target;

		const offset = $(ele).offset();
		const vpOffsetT = offset.top - $(document).scrollTop();
		const vpOffsetL = offset.left - $(document).scrollLeft();

		const fromBottom = vpOffsetT > window.innerHeight / 2;
		const fromRight = vpOffsetL > window.innerWidth / 2;

		return {
			mode: "autoFromElement",
			vpOffsetT,
			vpOffsetL,
			fromBottom,
			fromRight,
			eleHeight: $(ele).height(),
			eleWidth: $(ele).width(),
			clientX: EventUtil.getClientX(evt),
			window: (evt.view || {}).window || window,
		}
	},

	getWindowPositionExact (x, y, evt = null) {
		return {
			window: ((evt || {}).view || {}).window || window,
			mode: "exact",
			x,
			y,
		}
	},

	getWindowPositionExactVisibleBottom (x, y, evt = null) {
		return {
			...Renderer.hover.getWindowPositionExact(x, y, evt),
			mode: "exactVisibleBottom",
		};
	},

	_WINDOW_METAS: {},
	MIN_Z_INDEX: 200,
	_MAX_Z_INDEX: 300,
	_DEFAULT_WIDTH_PX: 600,
	_BODY_SCROLLER_WIDTH_PX: 15,

	_getZIndex () {
		const zIndices = Object.values(Renderer.hover._WINDOW_METAS).map(it => it.zIndex);
		if (!zIndices.length) return Renderer.hover.MIN_Z_INDEX;
		return Math.max(...zIndices);
	},

	_getNextZIndex (hoverId) {
		const cur = Renderer.hover._getZIndex();
		// If we're already the highest index, continue to use this index
		if (hoverId != null && Renderer.hover._WINDOW_METAS[hoverId].zIndex === cur) return cur;
		// otherwise, go one higher
		const out = cur + 1;

		// If we've broken through the max z-index, try to free up some z-indices
		if (out > Renderer.hover._MAX_Z_INDEX) {
			const sortedWindowMetas = Object.entries(Renderer.hover._WINDOW_METAS)
				.sort(([kA, vA], [kB, vB]) => SortUtil.ascSort(vA.zIndex, vB.zIndex));

			if (sortedWindowMetas.length >= (Renderer.hover._MAX_Z_INDEX - Renderer.hover.MIN_Z_INDEX)) {
				// If we have too many window open, collapse them into one z-index
				sortedWindowMetas.forEach(([k, v]) => {
					v.setZIndex(Renderer.hover.MIN_Z_INDEX);
				})
			} else {
				// Otherwise, ensure one consistent run from min to max z-index
				sortedWindowMetas.forEach(([k, v], i) => {
					v.setZIndex(Renderer.hover.MIN_Z_INDEX + i);
				});
			}

			return Renderer.hover._getNextZIndex(hoverId);
		} else return out;
	},

	/**
	 * @param $content Content to append to the window.
	 * @param position The position of the window. Can be specified in various formats.
	 * @param [opts] Options object.
	 * @param [opts.isPermanent] If the window should have the expanded toolbar of a "permanent" window.
	 * @param [opts.title] The window title.
	 * @param [opts.isBookContent] If the hover window contains book content. Affects the styling of borders.
	 * @param [opts.pageUrl] A page URL which is navigable via a button in the window header
	 * @param [opts.cbClose] Callback to run on window close.
	 * @param [opts.width] An initial width for the window.
	 * @param [opts.height] An initial height fot the window.
	 * @param [opts.$pFnGetPopoutContent] A function which loads content for this window when it is popped out.
	 * @param [opts.fnGetPopoutSize] A function which gets a `{width: ..., height: ...}` object with dimensions for a
	 * popout window.
	 * @param [sourceData] Source data which can be used to load the contents into the DM screen.
	 * @param [sourceData.type]
	 */
	getShowWindow ($content, position, opts, sourceData) {
		opts = opts || {};

		Renderer.hover._doInit();

		const initialWidth = opts.width == null ? Renderer.hover._DEFAULT_WIDTH_PX : opts.width;
		const initialZIndex = Renderer.hover._getNextZIndex();

		const $body = $(position.window.document.body);
		const $hov = $(`<div class="hwin"></div>`)
			.css({
				"right": -initialWidth,
				"width": initialWidth,
				"zIndex": initialZIndex,
			});
		const $wrpContent = $(`<div class="hwin__wrp-table"></div>`);
		if (opts.height != null) $wrpContent.css("height", opts.height);
		const $hovTitle = $(`<span class="window-title">${opts.title || ""}</span>`);

		const out = {};
		const hoverId = Renderer.hover._getNextId();
		Renderer.hover._WINDOW_METAS[hoverId] = out;
		const mouseUpId = `mouseup.${hoverId} touchend.${hoverId}`;
		const mouseMoveId = `mousemove.${hoverId} touchmove.${hoverId}`;
		const resizeId = `resize.${hoverId}`;

		const doClose = () => {
			$hov.remove();
			$(position.window.document).off(mouseUpId);
			$(position.window.document).off(mouseMoveId);
			$(position.window).off(resizeId);

			delete Renderer.hover._WINDOW_METAS[hoverId];

			if (opts.cbClose) opts.cbClose(out);
		};

		let drag = {};

		function handleDragMousedown (evt, type) {
			if (evt.which === 0 || evt.which === 1) evt.preventDefault();
			out.zIndex = Renderer.hover._getNextZIndex(hoverId);
			$hov.css({
				"z-index": out.zIndex,
				"animation": "initial",
			});
			drag.type = type;
			drag.startX = EventUtil.getClientX(evt);
			drag.startY = EventUtil.getClientY(evt);
			drag.baseTop = parseFloat($hov.css("top"));
			drag.baseLeft = parseFloat($hov.css("left"));
			drag.baseHeight = $wrpContent.height();
			drag.baseWidth = parseFloat($hov.css("width"));
			if (type < 9) {
				$wrpContent.css({
					"height": drag.baseHeight,
					"max-height": "initial",
				});
				$hov.css("max-width", "initial");
			}
		}

		const $brdrTopRightResize = $(`<div class="hoverborder__resize-ne"></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 1));

		const $brdrRightResize = $(`<div class="hoverborder__resize-e"></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 2));

		const $brdrBottomRightResize = $(`<div class="hoverborder__resize-se"></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 3));

		const $brdrBtm = $(`<div class="hoverborder hoverborder--btm ${opts.isBookContent ? "hoverborder-book" : ""}"><div class="hoverborder__resize-s"></div></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 4));

		const $brdrBtmLeftResize = $(`<div class="hoverborder__resize-sw"></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 5));

		const $brdrLeftResize = $(`<div class="hoverborder__resize-w"></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 6));

		const $brdrTopLeftResize = $(`<div class="hoverborder__resize-nw"></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 7));

		const $brdrTopResize = $(`<div class="hoverborder__resize-n"></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 8));

		const $brdrTop = $(`<div class="hoverborder hoverborder--top ${opts.isBookContent ? "hoverborder-book" : ""}" ${opts.isPermanent ? `data-perm="true"` : ""}></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 9))
			.on("contextmenu", (evt) => {
				Renderer.hover._contextMenuLastClickedHeader = $brdrTop[0];
				ContextUtil.pOpenMenu(evt, Renderer.hover._contextMenu);
			});

		function isOverHoverTarget (evt, target) {
			return EventUtil.getClientX(evt) >= target.left
				&& EventUtil.getClientX(evt) <= target.left + target.width
				&& EventUtil.getClientY(evt) >= target.top
				&& EventUtil.getClientY(evt) <= target.top + target.height;
		}

		function handleNorthDrag (evt) {
			const diffY = Math.max(drag.startY - EventUtil.getClientY(evt), 80 - drag.baseHeight); // prevent <80 height, as this will cause the box to move downwards
			$wrpContent.css("height", drag.baseHeight + diffY);
			$hov.css("top", drag.baseTop - diffY);
			drag.startY = EventUtil.getClientY(evt);
			drag.baseHeight = $wrpContent.height();
			drag.baseTop = parseFloat($hov.css("top"));
		}

		function handleEastDrag (evt) {
			const diffX = drag.startX - EventUtil.getClientX(evt);
			$hov.css("width", drag.baseWidth - diffX);
			drag.startX = EventUtil.getClientX(evt);
			drag.baseWidth = parseFloat($hov.css("width"));
		}

		function handleSouthDrag (evt) {
			const diffY = drag.startY - EventUtil.getClientY(evt);
			$wrpContent.css("height", drag.baseHeight - diffY);
			drag.startY = EventUtil.getClientY(evt);
			drag.baseHeight = $wrpContent.height();
		}

		function handleWestDrag (evt) {
			const diffX = Math.max(drag.startX - EventUtil.getClientX(evt), 150 - drag.baseWidth);
			$hov.css("width", drag.baseWidth + diffX)
				.css("left", drag.baseLeft - diffX);
			drag.startX = EventUtil.getClientX(evt);
			drag.baseWidth = parseFloat($hov.css("width"));
			drag.baseLeft = parseFloat($hov.css("left"));
		}

		$(position.window.document)
			.on(mouseUpId, (evt) => {
				if (drag.type) {
					if (drag.type < 9) {
						$wrpContent.css("max-height", "");
						$hov.css("max-width", "");
					}
					adjustPosition();

					if (drag.type === 9) {
						// handle mobile button touches
						if (evt.target.classList.contains("hvr__close") || evt.target.classList.contains("hvr__popout")) {
							evt.preventDefault();
							drag.type = 0;
							$(evt.target).click();
							return;
						}

						// handle DM screen integration
						if (this._dmScreen && sourceData) {
							const panel = this._dmScreen.getPanelPx(EventUtil.getClientX(evt), EventUtil.getClientY(evt));
							if (!panel) return;
							this._dmScreen.setHoveringPanel(panel);
							const target = panel.getAddButtonPos();

							if (isOverHoverTarget(evt, target)) {
								switch (sourceData.type) {
									case "stats": {
										panel.doPopulate_Stats(sourceData.page, sourceData.source, sourceData.hash);
										break;
									}
									case "statsCreatureScaled": {
										panel.doPopulate_StatsScaledCr(sourceData.page, sourceData.source, sourceData.hash, sourceData.crNumber);
										break;
									}
								}
								doClose();
							}
							this._dmScreen.resetHoveringButton();
						}
					}
					drag.type = 0;
				}
			})
			.on(mouseMoveId, (evt) => {
				switch (drag.type) {
					case 1:
						handleNorthDrag(evt);
						handleEastDrag(evt);
						break;
					case 2:
						handleEastDrag(evt);
						break;
					case 3:
						handleSouthDrag(evt);
						handleEastDrag(evt);
						break;
					case 4:
						handleSouthDrag(evt);
						break;
					case 5:
						handleSouthDrag(evt);
						handleWestDrag(evt);
						break;
					case 6:
						handleWestDrag(evt);
						break;
					case 7:
						handleNorthDrag(evt);
						handleWestDrag(evt);
						break;
					case 8:
						handleNorthDrag(evt);
						break;
					case 9: {
						const diffX = drag.startX - EventUtil.getClientX(evt);
						const diffY = drag.startY - EventUtil.getClientY(evt);
						$hov.css("left", drag.baseLeft - diffX)
							.css("top", drag.baseTop - diffY);
						drag.startX = EventUtil.getClientX(evt);
						drag.startY = EventUtil.getClientY(evt);
						drag.baseTop = parseFloat($hov.css("top"));
						drag.baseLeft = parseFloat($hov.css("left"));

						// handle DM screen integration
						if (this._dmScreen) {
							const panel = this._dmScreen.getPanelPx(EventUtil.getClientX(evt), EventUtil.getClientY(evt));
							if (!panel) return;
							this._dmScreen.setHoveringPanel(panel);
							const target = panel.getAddButtonPos();

							if (isOverHoverTarget(evt, target)) this._dmScreen.setHoveringButton(panel);
							else this._dmScreen.resetHoveringButton();
						}
						break;
					}
				}
			});
		$(position.window).on(resizeId, () => adjustPosition(true));

		const doToggleMinimizedMaximized = () => {
			const curState = $brdrTop.attr("data-display-title");
			const isNextMinified = curState === "false";
			$brdrTop.attr("data-display-title", isNextMinified);
			$brdrTop.attr("data-perm", true);
			$hov.toggleClass("hwin--minified", isNextMinified);
		};

		const doMaximize = () => {
			$brdrTop.attr("data-display-title", false);
			$hov.toggleClass("hwin--minified", false);
		};

		$brdrTop.attr("data-display-title", false);
		$brdrTop.on("dblclick", () => doToggleMinimizedMaximized());
		$brdrTop.append($hovTitle);
		const $brdTopRhs = $(`<div class="flex" style="margin-left: auto;"></div>`).appendTo($brdrTop);

		if (opts.pageUrl && !position.window._IS_POPOUT && !Renderer.get().isInternalLinksDisabled()) {
			const $btnGotoPage = $(`<a class="top-border-icon glyphicon glyphicon-modal-window" style="margin-right: 2px;" title="Go to Page" href="${opts.pageUrl}"></a>`)
				.appendTo($brdTopRhs);
		}

		if (!position.window._IS_POPOUT) {
			const $btnPopout = $(`<span class="top-border-icon glyphicon glyphicon-new-window hvr__popout" style="margin-right: 2px;" title="Open as Popup Window"></span>`)
				.on("click", async evt => {
					evt.stopPropagation();

					const dimensions = opts.fnGetPopoutSize ? opts.fnGetPopoutSize() : {
						width: 600,
						height: $content.height(),
					};
					const win = open(
						"",
						opts.title || "",
						`width=${dimensions.width},height=${dimensions.height}location=0,menubar=0,status=0,titlebar=0,toolbar=0`,
					);

					win._IS_POPOUT = true;
					win.document.write(`
						<!DOCTYPE html>
						<html lang="en" class="${typeof styleSwitcher !== "undefined" && styleSwitcher.getActiveDayNight() === StyleSwitcher.STYLE_NIGHT ? StyleSwitcher.NIGHT_CLASS : ""}"><head>
							<meta name="viewport" content="width=device-width, initial-scale=1">
							<title>${opts.title}</title>
							${$(`link[rel="stylesheet"][href]`).map((i, e) => e.outerHTML).get().join("\n")}
							<!-- Favicons -->
							<link rel="icon" type="image/svg+xml" href="favicon.svg?v=1.115">
							<link rel="icon" type="image/png" sizes="256x256" href="favicon-256x256.png">
							<link rel="icon" type="image/png" sizes="144x144" href="favicon-144x144.png">
							<link rel="icon" type="image/png" sizes="128x128" href="favicon-128x128.png">
							<link rel="icon" type="image/png" sizes="64x64" href="favicon-64x64.png">
							<link rel="icon" type="image/png" sizes="48x48" href="favicon-48x48.png">
							<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
							<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">

							<!-- Chrome Web App Icons -->
							<link rel="manifest" href="manifest.webmanifest">
							<meta name="application-name" content="PF2eTools">
							<meta name="theme-color" content="#006bc4">

							<!-- Windows Start Menu tiles -->
							<meta name="msapplication-config" content="browserconfig.xml"/>
							<meta name="msapplication-TileColor" content="#006bc4">

							<!-- Apple Touch Icons -->
							<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png">
							<link rel="apple-touch-icon" sizes="360x360" href="apple-touch-icon-360x360.png">
							<link rel="apple-touch-icon" sizes="167x167" href="apple-touch-icon-167x167.png">
							<link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
							<link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png">
							<meta name="apple-mobile-web-app-title" content="PF2eTools">

							<!-- macOS Safari Pinned Tab and Touch Bar -->
							<link rel="mask-icon" href="safari-pinned-tab.svg" color="#006bc4">

							<style>
								html, body { width: 100%; height: 100%; }
								body { overflow-y: scroll; }
								.hwin--popout { max-width: 100%; max-height: 100%; box-shadow: initial; width: 100%; overflow-y: auto; }
							</style>
						</head><body class="rd__body-popout">
						<div class="hwin hoverbox--popout hwin--popout"></div>
						<script type="text/javascript" src="js/parser.js"></script>
						<script type="text/javascript" src="js/utils.js"></script>
						<script type="text/javascript" src="lib/jquery.js"></script>
						</body></html>
					`);

					let $cpyContent;
					if (opts.$pFnGetPopoutContent) {
						$cpyContent = await opts.$pFnGetPopoutContent();
					} else {
						$cpyContent = $content.clone(true, true);
						$cpyContent.find(`.mon__btn-scale-cr`).remove();
						$cpyContent.find(`.mon__btn-reset-cr`).remove();
					}

					let ticks = 50;
					while (!win.document.body && ticks-- > 0) await MiscUtil.pDelay(5);

					$cpyContent.appendTo($(win.document).find(`.hoverbox--popout`));

					win.Renderer = Renderer;

					doClose();
				}).appendTo($brdTopRhs);
		}

		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove hvr__close" title="Close"></span>`)
			.on("click", (evt) => {
				evt.stopPropagation();
				doClose();
			}).appendTo($brdTopRhs);

		$wrpContent.append($content);

		$hov.append($brdrTopResize).append($brdrTopRightResize).append($brdrRightResize).append($brdrBottomRightResize)
			.append($brdrBtmLeftResize).append($brdrLeftResize).append($brdrTopLeftResize)

			.append($brdrTop)
			.append($wrpContent)
			.append($brdrBtm);

		$body.append($hov);

		const setPosition = (pos) => {
			switch (pos.mode) {
				case "autoFromElement": {
					if (pos.fromBottom) $hov.css("top", pos.vpOffsetT - ($hov.height() + 10));
					else $hov.css("top", pos.vpOffsetT + pos.eleHeight + 10);

					if (pos.fromRight) $hov.css("left", (pos.clientX || pos.vpOffsetL) - (parseFloat($hov.css("width")) + 10));
					else $hov.css("left", (pos.clientX || (pos.vpOffsetL + pos.eleWidth)) + 10);
					break;
				}
				case "exact": {
					$hov.css({
						"left": pos.x,
						"top": pos.y,
					});
					break;
				}
				case "exactVisibleBottom": {
					$hov.css({
						"left": pos.x,
						"top": pos.y,
						"animation": "initial", // Briefly remove the animation so we can calculate the height
					});

					let yPos = pos.y;

					const {bottom: posBottom, height: winHeight} = $hov[0].getBoundingClientRect();
					const height = position.window.innerHeight
					if (posBottom > height) {
						yPos = position.window.innerHeight - winHeight;
						$hov.css({
							"top": yPos,
							"animation": "",
						});
					}

					break;
				}
				default:
					throw new Error(`Positiong mode unimplemented: "${pos.mode}"`);
			}

			adjustPosition(true);
		};

		setPosition(position);

		function adjustPosition () {
			const eleHov = $hov[0];
			// use these pre-computed values instead of forcing redraws for speed (saves ~100ms)
			const hvTop = parseFloat(eleHov.style.top);
			const hvLeft = parseFloat(eleHov.style.left);
			const hvWidth = parseFloat(eleHov.style.width);
			const screenHeight = position.window.innerHeight;
			const screenWidth = position.window.innerWidth;

			// readjust position...
			// ...if vertically clipping off screen
			if (hvTop < 0) eleHov.style.top = `0px`;
			else if (hvTop >= screenHeight - Renderer.hover._BAR_HEIGHT) {
				$hov.css("top", screenHeight - Renderer.hover._BAR_HEIGHT);
			}

			// ...if horizontally clipping off screen
			if (hvLeft < 0) $hov.css("left", 0);
			else if (hvLeft + hvWidth + Renderer.hover._BODY_SCROLLER_WIDTH_PX > screenWidth) {
				$hov.css("left", Math.max(screenWidth - hvWidth - Renderer.hover._BODY_SCROLLER_WIDTH_PX, 0));
			}
		}

		const setIsPermanent = (isPermanent) => {
			opts.isPermanent = isPermanent;
			$brdrTop.attr("data-perm", isPermanent);
		};

		const setZIndex = (zIndex) => {
			$hov.css("z-index", zIndex);
			out.zIndex = zIndex;
		};

		const doZIndexToFront = () => {
			const nxtZIndex = Renderer.hover._getNextZIndex(hoverId);
			setZIndex(nxtZIndex);
		};

		out.$windowTitle = $hovTitle;
		out.zIndex = initialZIndex;
		out.setZIndex = setZIndex

		out.setPosition = setPosition;
		out.setIsPermanent = setIsPermanent;
		out.doClose = doClose;
		out.doMaximize = doMaximize;
		out.doZIndexToFront = doZIndexToFront;

		return out;
	},

	/**
	 * @param entry
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [opts.isLargeBookContent]
	 * @param [opts.depth]
	 */
	getMakePredefinedHover (entry, opts) {
		opts = opts || {};

		const id = Renderer.hover._getNextId();
		Renderer.hover._entryCache[id] = entry;
		return {
			id,
			html: `onmouseover="Renderer.hover.handlePredefinedMouseOver(event, this, ${id}, ${JSON.stringify(opts).escapeQuotes()})" onmousemove="Renderer.hover.handlePredefinedMouseMove(event, this)" onmouseleave="Renderer.hover.handlePredefinedMouseLeave(event, this)" ${Renderer.hover.getPreventTouchString()}`,
			mouseOver: (evt, ele) => Renderer.hover.handlePredefinedMouseOver(evt, ele, id, opts),
			mouseMove: (evt, ele) => Renderer.hover.handlePredefinedMouseMove(evt, ele),
			mouseLeave: (evt, ele) => Renderer.hover.handlePredefinedMouseLeave(evt, ele),
			touchStart: (evt, ele) => Renderer.hover.handleTouchStart(evt, ele),
		};
	},

	updatePredefinedHover (id, entry) {
		Renderer.hover._entryCache[id] = entry;
	},

	getPreventTouchString () {
		return `ontouchstart="Renderer.hover.handleTouchStart(event, this)"`
	},

	handleTouchStart (evt, ele) {
		// on large touchscreen devices only (e.g. iPads)
		if (!Renderer.hover.isSmallScreen(evt)) {
			// cache the link location and redirect it to void
			$(ele).data("href", $(ele).data("href") || $(ele).attr("href"));
			$(ele).attr("href", "javascript:void(0)");
			// restore the location after 100ms; if the user long-presses the link will be restored by the time they
			//   e.g. attempt to open a new tab
			setTimeout(() => {
				const data = $(ele).data("href");
				if (data) {
					$(ele).attr("href", data);
					$(ele).data("href", null);
				}
			}, 100);
		}
	},

	// region entry fetching
	addEmbeddedToCache (page, source, hash, entity) {
		Renderer.hover._addToCache(page, source, hash, entity);
	},

	_addToCache: (page, source, hash, entity) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		((Renderer.hover._linkCache[page] =
			Renderer.hover._linkCache[page] || {})[source] =
			Renderer.hover._linkCache[page][source] || {})[hash] = entity;
	},

	_getFromCache: (page, source, hash, opts) => {
		opts = opts || {};

		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		const out = MiscUtil.get(Renderer.hover._linkCache, page, source, hash);
		if (opts.isCopy && out != null) return MiscUtil.copy(out);
		return out;
	},

	_isCached: (page, source, hash) => {
		return Renderer.hover._linkCache[page] && Renderer.hover._linkCache[page][source] && Renderer.hover._linkCache[page][source][hash];
	},

	_psCacheLoading: {},
	_flagsCacheLoaded: {},
	_locks: {},
	_flags: {},

	/**
	 * @param page
	 * @param hash
	 * @param [opts] Options object.
	 * @param [opts.isCopy] If a copy, rather than the original entity, should be returned.
	 */
	async pCacheAndGetHash (page, hash, opts) {
		const source = decodeURIComponent(hash.split(HASH_LIST_SEP).last());
		return Renderer.hover.pCacheAndGet(page, source, hash, opts);
	},

	/**
	 * @param page
	 * @param source
	 * @param hash
	 * @param [opts] Options object.
	 * @param [opts.isCopy] If a copy, rather than the original entity, should be returned.
	 */
	async pCacheAndGet (page, source, hash, opts) {
		opts = opts || {};

		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		const existingOut = Renderer.hover._getFromCache(page, source, hash, opts);
		if (existingOut) return existingOut;

		switch (page) {
			case "generic":
			case "hover":
				return null;
			case UrlUtil.PG_CLASSES:
				return Renderer.hover._pCacheAndGet_pLoadClasses(page, source, hash, opts);
			case UrlUtil.PG_SPELLS:
				return Renderer.hover._pCacheAndGet_pLoadMultiSource(page, source, hash, opts, `data/spells/`, "spell", Renderer.spell.prePopulateHover);
			case UrlUtil.PG_BESTIARY:
				return Renderer.hover._pCacheAndGet_pLoadMultiSource(page, source, hash, opts, `data/bestiary/`, "creature", data => DataUtil.creature.populateMetaReference(data));
			case UrlUtil.PG_ITEMS: {
				const loadKey = UrlUtil.PG_ITEMS;

				await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
					page,
					source,
					hash,
					loadKey,
					async () => {
						const allItems = await Renderer.item.pBuildList({
							isAddGroups: true,
							isBlacklistVariants: true,
						});
						// populate brew once the main item properties have been loaded
						const brewData = await BrewUtil.pAddBrewData();
						const itemList = await Renderer.item.getItemsFromHomebrew(brewData);
						itemList.forEach(it => {
							const itHash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
							Renderer.hover._addToCache(page, it.source, itHash, it);
							const revName = Renderer.item.modifierPostToPre(it);
							if (revName) Renderer.hover._addToCache(page, it.source, UrlUtil.URL_TO_HASH_BUILDER[page](revName), it);
						});

						allItems.forEach(item => {
							const itemHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
							Renderer.hover._addToCache(page, item.source, itemHash, item);
							const revName = Renderer.item.modifierPostToPre(item);
							if (revName) Renderer.hover._addToCache(page, item.source, UrlUtil.URL_TO_HASH_BUILDER[page](revName), item);
						});
					},
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}
			case UrlUtil.PG_BACKGROUNDS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "backgrounds.json", "background");
			case UrlUtil.PG_FEATS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "feats/feats-crb.json", "feat");
			case UrlUtil.PG_COMPANIONS_FAMILIARS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "companionsfamiliars.json", ["companion", "familiar"]);
			case UrlUtil.PG_ANCESTRIES: {
				const loadKey = UrlUtil.PG_ANCESTRIES;

				await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
					page,
					source,
					hash,
					loadKey,
					async () => {
						const brewData = await BrewUtil.pAddBrewData();
						let mergedBrewData = [];
						if (brewData.race) {
							mergedBrewData = Renderer.ancestry.mergeSubraces(brewData.race, {isAddBaseRaces: true})
							Renderer.hover._pCacheAndGet_populate(page, {race: mergedBrewData}, "race");
						}

						const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/races.json`);
						const merged = Renderer.ancestry.mergeSubraces(data.race, {isAddBaseRaces: true});
						Renderer.hover._pCacheAndGet_populate(page, {race: merged}, "race");

						if (brewData.subrace) {
							const racesWithNuSubraces = Renderer.ancestry.adoptSubraces(
								[...mergedBrewData, ...merged],
								brewData.subrace,
							);
							const mergedBrew = Renderer.ancestry.mergeSubraces(racesWithNuSubraces);
							Renderer.hover._pCacheAndGet_populate(page, {race: mergedBrew}, "race");
						}
					},
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}
			case UrlUtil.PG_DEITIES:
				return Renderer.hover._pCacheAndGet_pLoadCustom(page, source, hash, opts, "deities.json", "deity", null, "deity");
			case UrlUtil.PG_HAZARDS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "hazards.json", ["hazard"]);
			case UrlUtil.PG_VARIANTRULES:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "variantrules.json", "variantrule");
			case UrlUtil.PG_CONDITIONS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "conditions.json", ["condition"], (listProp, item) => item.__prop = listProp);
			case UrlUtil.PG_AFFLICTIONS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "afflictions.json", ["disease", "curse", "itemcurse"], (listProp, item) => item.__prop = listProp);
			case UrlUtil.PG_TABLES:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "generated/gendata-tables.json", ["table", "tableGroup"], (listProp, item) => item.__prop = listProp);
			case UrlUtil.PG_ACTIONS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "actions.json", "action");
			case UrlUtil.PG_ABILITIES:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "abilities.json", "ability");
			case UrlUtil.PG_LANGUAGES:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "languages.json", "language");
			case UrlUtil.PG_TRAITS:
				return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "traits.json", "trait");
			// region adventure/books/references
			case UrlUtil.PG_QUICKREF: {
				const loadKey = UrlUtil.PG_QUICKREF;

				await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
					page,
					source,
					hash,
					loadKey,
					async () => {
						const json = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/bookref-quick.json`);

						json.data["bookref-quick"].forEach((chapter, ixChapter) => {
							const metas = IndexableFileQuickReference.getChapterNameMetas(chapter);

							metas.forEach(nameMeta => {
								const hashParts = [
									"bookref-quick",
									ixChapter,
									UrlUtil.encodeForHash(nameMeta.name.toLowerCase()),
								];
								if (nameMeta.ixBook) hashParts.push(nameMeta.ixBook);

								const hash = hashParts.join(HASH_PART_SEP);

								Renderer.hover._addToCache(page, nameMeta.source, hash, nameMeta.entry);
							});
						});
					},
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}

			case UrlUtil.PG_ADVENTURE: {
				const loadKey = `${page}${source}`;

				await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
					page,
					source,
					hash,
					loadKey,
					async () => {
						// region Brew
						const brew = await BrewUtil.pAddBrewData();

						// Get only the ids that exist in both data + contents
						const brewDataIds = (brew.adventureData || []).filter(it => it.id).map(it => it.id);
						const brewContentsIds = new Set(...(brew.adventure || []).filter(it => it.id).map(it => it.id));
						const matchingBrewIds = brewDataIds.filter(id => brewContentsIds.has(id));

						matchingBrewIds.forEach(id => {
							const brewData = (brew.adventureData || []).find(it => it.id === id);
							const brewContents = (brew.adventure || []).find(it => it.id === id);

							const pack = {
								adventure: brewContents,
								adventureData: brewData,
							};

							const hash = UrlUtil.URL_TO_HASH_BUILDER[page](brewContents);
							Renderer.hover._addToCache(page, brewContents.source, hash, pack);
						});
						// endregion

						const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/adventures.json`);
						const fromIndex = index.adventure.find(it => UrlUtil.URL_TO_HASH_BUILDER[page](it) === hash);
						if (!fromIndex) return Renderer.hover._getFromCache(page, source, hash, opts);

						const json = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/adventure/adventure-${hash}.json`);

						const pack = {
							adventure: fromIndex,
							adventureData: json,
						};

						Renderer.hover._addToCache(page, fromIndex.source, hash, pack);
					},
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}
			// enregion

			// region per-page fluff
			case `fluff__${UrlUtil.PG_BESTIARY}`:
				return Renderer.hover._pCacheAndGet_pLoadMultiSourceFluff(page, source, hash, opts, `data/bestiary/`, "monsterFluff");
			case `fluff__${UrlUtil.PG_SPELLS}`:
				return Renderer.hover._pCacheAndGet_pLoadMultiSourceFluff(page, source, hash, opts, `data/spells/`, "spellFluff");
			case `fluff__${UrlUtil.PG_BACKGROUNDS}`:
				return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "data/backgrounds/fluff-backgrounds.json", "backgroundFluff");
			case `fluff__${UrlUtil.PG_ITEMS}`:
				return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "fluff-conditions.json", ["conditionFluff", "diseaseFluff"]);
				// endregion

			// region props
			case "classfeature":
				return Renderer.hover._pCacheAndGet_pLoadClassFeatures(page, source, hash, opts);
			case "subclassfeature":
				return Renderer.hover._pCacheAndGet_pLoadSubclassFeatures(page, source, hash, opts);

			case "raw_classfeature":
				return Renderer.hover._pCacheAndGet_pLoadClassFeatures(page, source, hash, opts);
			case "raw_subclassfeature":
				return Renderer.hover._pCacheAndGet_pLoadSubclassFeatures(page, source, hash, opts);

			default:
				throw new Error(`No load function defined for page ${page}`);
		}
	},

	async _pCacheAndGet_pDoLoadWithLock (page, source, hash, loadKey, pFnLoad) {
		if (Renderer.hover._psCacheLoading[loadKey]) await Renderer.hover._psCacheLoading[loadKey];

		if (!Renderer.hover._flagsCacheLoaded[loadKey] || !Renderer.hover._isCached(page, source, hash)) {
			Renderer.hover._psCacheLoading[loadKey] = (async () => {
				await pFnLoad();

				Renderer.hover._flagsCacheLoaded[loadKey] = true;
			})();
			await Renderer.hover._psCacheLoading[loadKey];
		}
	},

	/**
	 * @param page
	 * @param data the data
	 * @param listProp list property in the data
	 * @param [opts]
	 * @param [opts.fnMutateItem] optional function to run per item; takes listProp and an item as parameters
	 * @param [opts.fnGetHash]
	 */
	_pCacheAndGet_populate (page, data, listProp, opts) {
		opts = opts || {};

		data[listProp].forEach(it => {
			const itHash = (opts.fnGetHash || UrlUtil.URL_TO_HASH_BUILDER[page])(it);
			if (opts.fnMutateItem) opts.fnMutateItem(listProp, it);
			Renderer.hover._addToCache(page, it.source, itHash, it);
		});
	},

	async _pCacheAndGet_pLoadMultiSource (page, source, hash, opts, baseUrl, listProp, fnPrePopulate = null) {
		const loadKey = `${page}${source}`;

		await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
			page,
			source,
			hash,
			loadKey,
			async () => {
				const brewData = await BrewUtil.pAddBrewData();
				if (fnPrePopulate) fnPrePopulate(brewData, {isBrew: true});
				if (brewData[listProp]) Renderer.hover._pCacheAndGet_populate(page, brewData, listProp, {fnGetHash: opts.fnGetHash});
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${baseUrl}${opts.isFluff ? "fluff-" : ""}index.json`);
				const officialSources = {};
				Object.entries(index).forEach(([k, v]) => officialSources[k.toLowerCase()] = v);

				const officialSource = officialSources[source.toLowerCase()];
				if (officialSource) {
					const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${baseUrl}${officialSource}`);
					if (fnPrePopulate) fnPrePopulate(data, {isBrew: false});
					Renderer.hover._pCacheAndGet_populate(page, data, listProp, {fnGetHash: opts.fnGetHash});
				}
				// (else source to load is 3rd party, which was already handled)
			},
		);

		return Renderer.hover._getFromCache(page, source, hash, opts);
	},

	async _pCacheAndGet_pLoadMultiSourceFluff (page, source, hash, opts, baseUrl, listProp, fnPrePopulate = null) {
		const nxtOpts = MiscUtil.copy(opts);
		nxtOpts.isFluff = true;
		nxtOpts.fnGetHash = it => UrlUtil.encodeForHash([it.name, it.source]);
		return Renderer.hover._pCacheAndGet_pLoadMultiSource(page, source, hash, nxtOpts, baseUrl, listProp);
	},

	async _pCacheAndGet_pLoadSingleBrew (page, opts, listProps, fnMutateItem) {
		const brewData = await BrewUtil.pAddBrewData();
		listProps = listProps instanceof Array ? listProps : [listProps];
		listProps.forEach(lp => {
			if (brewData[lp]) {
				Renderer.hover._pCacheAndGet_populate(page, brewData, lp, {
					fnMutateItem,
					fnGetHash: opts.fnGetHash,
				});
			}
		});
	},

	_pCacheAndGet_handleSingleData (page, opts, data, listProps, fnMutateItem) {
		if (listProps instanceof Array) {
			listProps.forEach(prop => data[prop] && Renderer.hover._pCacheAndGet_populate(page, data, prop, {
				fnMutateItem,
				fnGetHash: opts.fnGetHash,
			}));
		} else Renderer.hover._pCacheAndGet_populate(page, data, listProps, {fnMutateItem, fnGetHash: opts.fnGetHash});
	},

	async _pCacheAndGet_pLoadSimple (page, source, hash, opts, jsonFile, listProps, fnMutateItem) {
		const loadKey = jsonFile;

		await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
			page,
			source,
			hash,
			loadKey,
			async () => {
				await Renderer.hover._pCacheAndGet_pLoadSingleBrew(page, opts, listProps, fnMutateItem);
				const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/${jsonFile}`);
				Renderer.hover._pCacheAndGet_handleSingleData(page, opts, data, listProps, fnMutateItem);
			},
		);

		return Renderer.hover._getFromCache(page, source, hash, opts);
	},

	async _pCacheAndGet_pLoadSimpleFluff (page, source, hash, opts, jsonFile, listProps, fnMutateItem) {
		const nxtOpts = MiscUtil.copy(opts);
		nxtOpts.isFluff = true;
		nxtOpts.fnGetHash = it => UrlUtil.encodeForHash([it.name, it.source]);
		return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, nxtOpts, jsonFile, listProps, fnMutateItem);
	},

	async _pCacheAndGet_pLoadCustom (page, source, hash, opts, jsonFile, listProps, itemModifier, loader) {
		const loadKey = jsonFile;

		await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
			page,
			source,
			hash,
			loadKey,
			async () => {
				await Renderer.hover._pCacheAndGet_pLoadSingleBrew(page, opts, listProps, itemModifier);
				const data = await DataUtil[loader].loadJSON();
				Renderer.hover._pCacheAndGet_handleSingleData(page, opts, data, listProps, itemModifier);
			},
		);

		return Renderer.hover._getFromCache(page, source, hash, opts);
	},

	async _pCacheAndGet_pLoadClasses (page, source, hash, opts) {
		const loadKey = UrlUtil.PG_CLASSES;

		await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
			page,
			source,
			hash,
			loadKey,
			async () => {
				const pAddToIndex = async cls => {
					// add class
					const clsHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls);
					cls = await DataUtil.class.pGetDereferencedClassData(cls);
					const clsEntries = {
						name: cls.name,
						type: "section",
						entries: MiscUtil.copy((cls.classFeatures || []).flat()),
					};
					Renderer.hover._addToCache(UrlUtil.PG_CLASSES, cls.source || SRC_CRB, clsHash, clsEntries);

					// add subclasses
					await Promise.all((cls.subclasses || []).map(async sc => {
						sc = await DataUtil.class.pGetDereferencedSubclassData(sc);
						const scHash = `${clsHash}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: sc})}`;
						const scEntries = {type: "section", entries: MiscUtil.copy((sc.subclassFeatures || []).flat())};
						// Always use the class source where available, as these are all keyed as sub-hashes on the classes page
						Renderer.hover._addToCache(UrlUtil.PG_CLASSES, cls.source || sc.source || SRC_CRB, scHash, scEntries);
						// Add a copy using the subclass source, for omnisearch results
						Renderer.hover._addToCache(UrlUtil.PG_CLASSES, sc.source || SRC_CRB, scHash, scEntries);
					}));

					// add all class/subclass features
					UrlUtil.class.getIndexedEntries(cls).forEach(it => Renderer.hover._addToCache(UrlUtil.PG_CLASSES, it.source, it.hash, it.entry));
				};

				const pAddSubclassToIndex = async sc => {
					const cls = classData.class.find(it => it.name === sc.className && it.source === (sc.classSource || SRC_CRB));
					if (!cls) return;
					const clsHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls);

					// add subclasse
					sc = await DataUtil.class.pGetDereferencedSubclassData(sc);
					const scHash = `${clsHash}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: sc})}`;
					const scEntries = {type: "section", entries: MiscUtil.copy((sc.subclassFeatures || []).flat())};
					// Always use the class source where available, as these are all keyed as sub-hashes on the classes page
					Renderer.hover._addToCache(UrlUtil.PG_CLASSES, cls.source || sc.source || SRC_CRB, scHash, scEntries);
					// Add a copy using the subclass source, for omnisearch results
					Renderer.hover._addToCache(UrlUtil.PG_CLASSES, sc.source || SRC_CRB, scHash, scEntries);

					// Reduce the class down so we only have subclass features
					const cpyClass = MiscUtil.copy(cls);
					cpyClass.classFeatures = (cpyClass.classFeatures || []).map(lvlFeatureList => {
						return lvlFeatureList.filter(feature => feature.gainSubclassFeature)
					});

					cpyClass.subclasses = [sc];

					// add all class/subclass features
					UrlUtil.class.getIndexedEntries(cpyClass).forEach(it => Renderer.hover._addToCache(UrlUtil.PG_CLASSES, it.source, it.hash, it.entry));
				};

				const classData = await DataUtil.class.loadJSON();
				const brewData = await BrewUtil.pAddBrewData();
				await Promise.all((brewData.class || []).map(cc => pAddToIndex(cc)));
				for (const sc of (brewData.subclass || [])) await pAddSubclassToIndex(sc);
				await Promise.all(classData.class.map(cc => pAddToIndex(cc)));
			},
		);

		return Renderer.hover._getFromCache(page, source, hash, opts);
	},

	async _pCacheAndGet_pLoadClassFeatures (page, source, hash, opts) {
		const loadKey = page;

		await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
			page,
			source,
			hash,
			loadKey,
			async () => {
				const brewData = await BrewUtil.pAddBrewData();
				await Renderer.hover._pCacheAndGet_pDoDereferenceNestedAndCache(brewData.classFeature, "classFeature", UrlUtil.URL_TO_HASH_BUILDER["classFeature"]);
				await Renderer.hover._pCacheAndGet_pLoadOfficialClassAndSubclassFeatures();
			},
		);

		return Renderer.hover._getFromCache(page, source, hash, opts);
	},

	async _pCacheAndGet_pLoadSubclassFeatures (page, source, hash, opts) {
		const loadKey = page;

		await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
			page,
			source,
			hash,
			loadKey,
			async () => {
				const brewData = await BrewUtil.pAddBrewData();
				await Renderer.hover._pCacheAndGet_pDoDereferenceNestedAndCache(brewData.subclassFeature, "subclassFeature", UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"]);
				await Renderer.hover._pCacheAndGet_pLoadOfficialClassAndSubclassFeatures();
			},
		);

		return Renderer.hover._getFromCache(page, source, hash, opts);
	},

	async _pCacheAndGet_pDoDereferenceNestedAndCache (entities, page, fnGetHash) {
		if (!entities) return;

		const entriesWithRefs = {};
		const entriesWithoutRefs = {};
		const ptrHasRef = {_: false};

		const walker = MiscUtil.getWalker({
			keyBlacklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLACKLIST,
			isNoModification: true,
		});
		const handlers = {
			object: (obj) => {
				if (ptrHasRef._) return obj;
				if (obj.type === "refClassFeature" || obj.type === "refSubclassFeature" || obj.type === "refOptionalfeature") ptrHasRef._ = true;
				return obj;
			},
		};

		entities.forEach(ent => {
			// Cache the raw version
			const hash = fnGetHash(ent);
			Renderer.hover._addToCache(`raw_${page}`, ent.source, hash, ent);

			ptrHasRef._ = false;
			walker.walk(ent.entries, handlers);

			(ptrHasRef._ ? entriesWithRefs : entriesWithoutRefs)[hash] = ptrHasRef._ ? MiscUtil.copy(ent) : ent;
		});

		let cntDerefLoops = 0;
		while (Object.keys(entriesWithRefs).length && cntDerefLoops < 25) { // conservatively avoid infinite looping
			const hashes = Object.keys(entriesWithRefs);
			for (const hash of hashes) {
				const ent = entriesWithRefs[hash];

				const toReplaceMetas = [];
				walker.walk(
					ent.entries,
					{
						array: (arr) => {
							for (let i = 0; i < arr.length; ++i) {
								const it = arr[i];
								if (it.type === "refClassFeature" || it.type === "refSubclassFeature" || it.type === "refOptionalfeature") {
									toReplaceMetas.push({
										...it,
										array: arr,
										ix: i,
									});
								}
							}
							return arr;
						},
					},
				);

				let cntReplaces = 0;
				for (const toReplaceMeta of toReplaceMetas) {
					switch (toReplaceMeta.type) {
						case "refClassFeature":
						case "refSubclassFeature": {
							const prop = toReplaceMeta.type === "refClassFeature" ? "classFeature" : "subclassFeature";
							const refUnpacked = toReplaceMeta.type === "refClassFeature"
								? DataUtil.class.unpackUidClassFeature(toReplaceMeta.classFeature)
								: DataUtil.class.unpackUidSubclassFeature(toReplaceMeta.subclassFeature);
							const refHash = UrlUtil.URL_TO_HASH_BUILDER[prop](refUnpacked);

							// Skip blacklisted
							if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(refHash, prop, refUnpacked.source, {isNoCount: true})) {
								cntReplaces++;
								toReplaceMeta.array[toReplaceMeta.ix] = {};
								break;
							}

							// Homebrew can e.g. reference cross-file
							const cpy = entriesWithoutRefs[refHash]
								? MiscUtil.copy(entriesWithoutRefs[refHash])
								: Renderer.hover._getFromCache(prop, refUnpacked.source, refHash, {isCopy: true});

							if (cpy) {
								cntReplaces++;
								delete cpy.className;
								delete cpy.classSource;
								delete cpy.subclassShortName;
								delete cpy.subclassSource;
								delete cpy.level;
								delete cpy.header;
								if (ent.source === cpy.source) delete cpy.source;
								if (ent.page === cpy.page) delete cpy.page;
								if (toReplaceMeta.name) cpy.name = toReplaceMeta.name;
								toReplaceMeta.array[toReplaceMeta.ix] = cpy;
							}

							break;
						}

						case "refOptionalfeature": {
							const refUnpacked = DataUtil.generic.unpackUid(toReplaceMeta.optionalfeature, "optfeature");
							const refHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_COMPANIONS_FAMILIARS](refUnpacked);

							// Skip blacklisted
							if (ExcludeUtil.isInitialised && ExcludeUtil.isExcluded(refHash, "optionalfeature", refUnpacked.source, {isNoCount: true})) {
								cntReplaces++;
								toReplaceMeta.array[toReplaceMeta.ix] = {};
								break;
							}

							const cpy = await Renderer.hover.pCacheAndGetHash(UrlUtil.PG_COMPANIONS_FAMILIARS, refHash, {isCopy: true});
							if (cpy) {
								cntReplaces++;
								delete cpy.featureType;
								delete cpy.prerequisite;
								if (ent.source === cpy.source) delete cpy.source;
								if (ent.page === cpy.page) delete cpy.page;
								if (toReplaceMeta.name) cpy.name = toReplaceMeta.name;
								toReplaceMeta.array[toReplaceMeta.ix] = cpy;
							}

							break;
						}
					}
				}

				if (cntReplaces === toReplaceMetas.length) {
					delete entriesWithRefs[hash];
					entriesWithoutRefs[hash] = ent;
				}
			}

			cntDerefLoops++;
		}

		Object.values(entriesWithoutRefs).forEach(ent => {
			Renderer.hover._addToCache(page, ent.source, fnGetHash(ent), ent);
		});

		// Add the failed-to-resolve entities to the cache nonetheless
		const entriesWithRefsVals = Object.values(entriesWithRefs);
		if (entriesWithRefsVals.length) {
			JqueryUtil.doToast({
				type: "danger",
				content: `Failed to load references for ${entriesWithRefsVals.length} entr${entriesWithRefsVals.length === 1 ? "y" : "ies"}!`,
			});
		}

		entriesWithRefsVals.forEach(ent => {
			Renderer.hover._addToCache(page, ent.source, fnGetHash(ent), ent);
		});
	},

	async _pCacheAndGet_pLoadOfficialClassAndSubclassFeatures () {
		const lockKey = "classFeature__subclassFeature";
		if (Renderer.hover._flags[lockKey]) return;
		if (!Renderer.hover._locks[lockKey]) Renderer.hover._locks[lockKey] = new VeLock();
		await Renderer.hover._locks[lockKey].pLock();
		if (Renderer.hover._flags[lockKey]) return;

		try {
			const rawClassData = await DataUtil.class.loadRawJSON();

			await Renderer.hover._pCacheAndGet_pDoDereferenceNestedAndCache(rawClassData.classFeature, "classFeature", UrlUtil.URL_TO_HASH_BUILDER["classFeature"]);
			await Renderer.hover._pCacheAndGet_pDoDereferenceNestedAndCache(rawClassData.subclassFeature, "subclassFeature", UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"]);

			Renderer.hover._flags[lockKey] = true;
		} finally {
			Renderer.hover._locks[lockKey].unlock();
		}
	},
	// endregion

	getGenericCompactRenderedString (entry, depth = 0) {
		const textStack = [""]
		Renderer.get().setFirstSection(true).recursiveRender(entry, textStack, {depth: depth}, {prefix: "<p class=\"pf2-p\">", suffix: "</p>"})
		return `
			${textStack.join("")}
		`;
	},

	_pageToRenderFn (page) {
		switch (page) {
			case "generic":
			case "hover":
				return Renderer.hover.getGenericCompactRenderedString;
			case UrlUtil.PG_QUICKREF:
			case UrlUtil.PG_CLASSES:
				// FIXME: Classes rendering
				return Renderer.hover.getGenericCompactRenderedString;
			case UrlUtil.PG_SPELLS:
				return Renderer.spell.getCompactRenderedString;
			case UrlUtil.PG_ITEMS:
				return Renderer.item.getCompactRenderedString;
			case UrlUtil.PG_BESTIARY:
				return (it) => Renderer.creature.getCompactRenderedString(it, null, {
					showScaler: true,
					isScaled: it._originalCr != null,
				});
			case UrlUtil.PG_CONDITIONS:
				return Renderer.condition.getCompactRenderedString;
			case UrlUtil.PG_AFFLICTIONS:
				return Renderer.affliction.getCompactRenderedString;
			case UrlUtil.PG_BACKGROUNDS:
				return Renderer.background.getCompactRenderedString;
			case UrlUtil.PG_FEATS:
				return Renderer.feat.getCompactRenderedString;
			case UrlUtil.PG_COMPANIONS_FAMILIARS:
				return Renderer.companionfamiliar.getRenderedString;
			case UrlUtil.PG_ANCESTRIES:
				return Renderer.ancestry.getCompactRenderedString;
			case UrlUtil.PG_DEITIES:
				return Renderer.deity.getCompactRenderedString;
			case UrlUtil.PG_HAZARDS:
				return Renderer.hazard.getCompactRenderedString;
			case UrlUtil.PG_VARIANTRULES:
				return Renderer.variantrule.getCompactRenderedString;
			case UrlUtil.PG_TABLES:
				return Renderer.table.getCompactRenderedString;
			case UrlUtil.PG_ACTIONS:
				return Renderer.action.getCompactRenderedString;
			case UrlUtil.PG_ABILITIES:
				return Renderer.ability.getCompactRenderedString;
			case UrlUtil.PG_LANGUAGES:
				return Renderer.language.getCompactRenderedString;
			case UrlUtil.PG_TRAITS:
				return Renderer.trait.getRenderedString;
			// region props
			case "classfeature":
			case "classFeature":
				return Renderer.hover.getGenericCompactRenderedString;
			case "subclassfeature":
			case "subclassFeature":
				return Renderer.hover.getGenericCompactRenderedString;
			// endregion
			default:
				return null;
		}
	},

	_pageToFluffFn (page) {
		switch (page) {
			case UrlUtil.PG_BESTIARY:
				return Renderer.creature.pGetFluff;
			case UrlUtil.PG_ITEMS:
				return Renderer.item.pGetFluff;
			case UrlUtil.PG_SPELLS:
				return Renderer.spell.pGetFluff;
			case UrlUtil.PG_ANCESTRIES:
				return Renderer.ancestry.pGetFluff;
			case UrlUtil.PG_BACKGROUNDS:
				return Renderer.background.pGetFluff;
			case UrlUtil.PG_LANGUAGES:
				return Renderer.language.pGetFluff;
			default:
				return null;
		}
	},

	isSmallScreen (evt) {
		evt = evt || {};
		const win = (evt.view || {}).window || window;
		return win.innerWidth <= 768;
	},

	bindPopoutButton ($btnPop, toList, handlerGenerator, title) {
		$btnPop
			.off("click")
			.title(title || "Popout Window (SHIFT for Source Data)");

		$btnPop.on(
			"click",
			handlerGenerator
				? handlerGenerator(toList)
				: (evt) => {
					if (Hist.lastLoadedId !== null) {
						const toRender = toList[Hist.lastLoadedId];

						if (evt.shiftKey) {
							const $content = Renderer.hover.$getHoverContent_statsCode(toRender);
							Renderer.hover.getShowWindow(
								$content,
								Renderer.hover.getWindowPositionFromEvent(evt),
								{
									title: `${toRender.name} \u2014 Source Data`,
									isPermanent: true,
									isBookContent: true,
								},
							);
						} else {
							Renderer.hover.doPopoutCurPage(evt, toList, Hist.lastLoadedId);
						}
					}
				},
		);
	},

	$getHoverContent_stats (page, toRender) {
		const renderFn = Renderer.hover._pageToRenderFn(page);
		return $$`<div class="stats pf2-stat">${renderFn(toRender)}</div>`;
	},

	$getHoverContent_fluff (page, toRender) {
		if (!toRender) {
			return $$`<table class="stats"><tr class="text"><td colspan="6" class="p-2 text-center">${Renderer.utils.HTML_NO_INFO}</td></tr></table>`;
		}

		toRender = MiscUtil.copy(toRender);

		if (toRender.images) {
			const cachedImages = toRender.images;
			delete toRender.images;

			toRender.entries = toRender.entries || [];
			const hasText = toRender.entries.length > 0;
			if (hasText) toRender.entries.unshift({type: "hr"});
			toRender.entries.unshift(...cachedImages.reverse());
		}

		return $$`<div class="stats">${Renderer.generic.getCompactRenderedString(toRender)}</div>`;
	},

	$getHoverContent_statsCode (toRender) {
		const cleanCopy = DataUtil.cleanJson(MiscUtil.copy(toRender));
		return Renderer.hover.$getHoverContent_miscCode(
			`${cleanCopy.name} \u2014 Source Data`,
			JSON.stringify(cleanCopy, null, "\t"),
		);
	},

	$getHoverContent_miscCode (name, code) {
		const toRenderCode = {
			type: "code",
			name,
			preformatted: code,
		};
		return $$`<div class="stats stats--book">${Renderer.get().render(toRenderCode)}</div>`;
	},

	/**
	 * @param toRender
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [opts.isLargeBookContent]
	 * @param [opts.depth]
	 */
	$getHoverContent_generic (toRender, opts) {
		opts = opts || {};

		return $$`<div class="stats ${opts.isBookContent || opts.isLargeBookContent ? "pf2-book" : "pf2-stat"} ${opts.isLargeBookContent ? "stats--book-large" : ""}">${Renderer.hover.getGenericCompactRenderedString(toRender, opts.depth || 0)}</div>`;
	},

	doPopoutCurPage (evt, allEntries, index) {
		const it = allEntries[index];
		const $content = Renderer.hover.$getHoverContent_stats(UrlUtil.getCurrentPage(), it);
		Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				pageUrl: `#${UrlUtil.autoEncodeHash(it)}`,
				title: it._displayName || it.name,
				isPermanent: true,
			},
		);
	},
};

/**
 * Recursively find all the names of entries, useful for indexing
 * @param nameStack an array to append the names to
 * @param entry the base entry
 * @param [opts] Options object.
 * @param [opts.maxDepth] Maximum depth to search for
 * @param [opts.depth] Start depth (used internally when recursing)
 * @param [opts.typeBlacklist] A set of entry types to avoid.
 */
Renderer.getNames = function (nameStack, entry, opts) {
	opts = opts || {};
	if (opts.maxDepth == null) opts.maxDepth = false;
	if (opts.depth == null) opts.depth = 0;

	if (opts.typeBlacklist && entry.type && opts.typeBlacklist.has(entry.type)) return;

	if (opts.maxDepth !== false && opts.depth > opts.maxDepth) return;
	if (entry.name) nameStack.push(Renderer.stripTags(entry.name));
	if (entry.entries) {
		let nextDepth = entry.type === "section" ? -1 : entry.type === "entries" ? opts.depth + 1 : opts.depth;
		for (const eX of entry.entries) {
			const nxtOpts = {...opts};
			nxtOpts.depth = nextDepth;
			Renderer.getNames(nameStack, eX, nxtOpts);
		}
	} else if (entry.items) {
		for (const eX of entry.items) {
			Renderer.getNames(nameStack, eX, opts);
		}
	}
};

Renderer.getNumberedNames = function (entry) {
	const renderer = new Renderer().setTrackTitles(true);
	renderer.render(entry);
	const titles = renderer.getTrackedTitles();
	const out = {};
	Object.entries(titles).forEach(([k, v]) => {
		v = Renderer.stripTags(v);
		out[v] = Number(k);
	});
	return out;
};

// dig down until we find a name, as feature names can be nested
Renderer.findName = function (entry) {
	function search (it) {
		if (it instanceof Array) {
			for (const child of it) {
				const n = search(child);
				if (n) return n;
			}
		} else if (it instanceof Object) {
			if (it.name) return it.name;
			else {
				for (const child of Object.values(it)) {
					const n = search(child);
					if (n) return n;
				}
			}
		}
	}

	return search(entry);
};

Renderer.stripTags = function (str) {
	if (!str) return str;
	let nxtStr = Renderer._stripTagLayer(str);
	while (nxtStr.length !== str.length) {
		str = nxtStr;
		nxtStr = Renderer._stripTagLayer(str);
	}
	return nxtStr;
};

Renderer._stripTagLayer = function (str) {
	if (str.includes("{@")) {
		const tagSplit = Renderer.splitByTags(str);
		return tagSplit.filter(it => it).map(it => {
			if (it.startsWith("{@")) {
				let [tag, text] = Renderer.splitFirstSpace(it.slice(1, -1));
				text = text.replace(/<\$([^$]+)\$>/gi, ""); // remove any variable tags
				switch (tag) {
					case "@b":
					case "@bold":
					case "@i":
					case "@italic":
					case "@indent":
					case "@indentFirst":
					case "@indentSubsequent":
					case "@s":
					case "@strike":
					case "@u":
					case "@underline":
					case "@sup":
						return text;

					case "@h":
						return "Hit: ";

					case "@dc":
						return `DC ${text}`;

					case "@atk":
						return Renderer.attackTagToFull(text);

					case "@chance":
					case "@d20":
					case "@damage":
					case "@dice":
					case "@hit":
					case "@recharge": {
						const [rollText, displayText] = Renderer.splitTagByPipe(text);
						switch (tag) {
							case "@damage":
							case "@dice": {
								return displayText || rollText.replace(/;/g, "/");
							}
							case "@d20":
							case "@hit": {
								return displayText || (() => {
									const n = Number(rollText);
									if (isNaN(n)) {
										throw new Error(`Could not parse "${rollText}" as a number!`)
									}
									return `${n >= 0 ? "+" : ""}${n}`;
								})();
							}
							case "@recharge": {
								const asNum = Number(rollText || 6);
								if (isNaN(asNum)) {
									throw new Error(`Could not parse "${rollText}" as a number!`)
								}
								return `(Recharge ${asNum}${asNum < 6 ? `\u20136` : ""})`;
							}
							case "@chance": {
								return displayText || `${rollText} percent`;
							}
						}
						throw new Error(`Unhandled tag: ${tag}`);
					}

					case "@hitYourSpellAttack":
						return "your spell attack modifier";

					case "@comic":
					case "@comicH1":
					case "@comicH2":
					case "@comicH3":
					case "@comicH4":
					case "@comicNote":
					case "@note":
					case "@sense":
					case "@skill": {
						return text;
					}

					case "@5etools":
					case "@PF2eTools":
					case "@adventure":
					case "@book":
					case "@filter":
					case "@footnote":
					case "@link":
					case "@scaledice":
					case "@scaledamage":
					case "@loader":
					case "@color":
					case "@highlight": {
						const parts = Renderer.splitTagByPipe(text);
						return parts[0];
					}

					case "@area": {
						const [compactText, areaId, flags, ...others] = Renderer.splitTagByPipe(text);

						return flags && flags.includes("x")
							? compactText
							: `${flags && flags.includes("u") ? "A" : "a"}rea ${compactText}`;
					}

					case "@action":
					case "@ability":
					case "@background":
					case "@class":
					case "@condition":
					case "@creature":
					case "@disease":
					case "@feat":
					case "@hazard":
					case "@item":
					case "@language":
					case "@object":
					case "@ancestry":
					case "@reward":
					case "@spell":
					case "@status":
					case "@table":
					case "@trap":
					case "@trait":
					case "@variantrule": {
						const parts = Renderer.splitTagByPipe(text);
						return parts.length >= 3 ? parts[2] : parts[0];
					}

					case "@deity": {
						const parts = Renderer.splitTagByPipe(text);
						return parts.length >= 4 ? parts[3] : parts[0];
					}

					case "@classFeature": {
						const parts = Renderer.splitTagByPipe(text);
						return parts.length >= 6 ? parts[5] : parts[0];
					}

					case "@subclassFeature": {
						const parts = Renderer.splitTagByPipe(text);
						return parts.length >= 8 ? parts[7] : parts[0];
					}

					case "@runeItem": {
						const parts = Renderer.splitTagByPipe(text);
						return parts.length % 2 ? parts[parts.length - 1] : parts.push(parts.shift()).map(it => it[0]).map(it => Renderer.runeItem.getRuneShortName(it)).join(" ");
					}

					case "@homebrew": {
						const [newText, oldText] = Renderer.splitTagByPipe(text);
						if (newText && oldText) {
							return `${newText} [this is a homebrew addition, replacing the following: "${oldText}"]`;
						} else if (newText) {
							return `${newText} [this is a homebrew addition]`;
						} else if (oldText) {
							return `[the following text has been removed due to homebrew: ${oldText}]`;
						} else throw new Error(`Homebrew tag had neither old nor new text!`);
					}

					default:
						throw new Error(`Unhandled tag: "${tag}"`);
				}
			} else return it;
		}).join("");
	}
	return str;
};

Renderer.getTableRollMode = function (table) {
	if (!table.colLabels || table.colLabels.length < 2) return RollerUtil.ROLL_COL_NONE;

	const rollColMode = RollerUtil.getColRollType(table.colLabels[0]);
	if (!rollColMode) return RollerUtil.ROLL_COL_NONE;

	// scan the first column to ensure all rollable
	if (table.rows.some(it => {
		try {
			// u2012 = figure dash; u2013 = en-dash
			return !/^\d+([-\u2012\u2013]\d+)?/.exec(it[0]);
		} catch (e) {
			return true;
		}
	})) return RollerUtil.ROLL_COL_NONE;

	return rollColMode;
};

/**
 * This assumes validation has been done in advance.
 * @param row
 * @param [opts]
 * @param [opts.cbErr]
 * @param [opts.isForceInfiniteResults]
 * @param [opts.isFirstRow] Used it `isForceInfiniteResults` is specified.
 * @param [opts.isLastRow] Used it `isForceInfiniteResults` is specified.
 */
Renderer.getRollableRow = function (row, opts) {
	opts = opts || {};
	row = MiscUtil.copy(row);
	try {
		const cleanRow = String(row[0]).trim();

		// format: "20 or lower"; "99 or higher"
		const mLowHigh = /^(\d+) or (lower|higher)$/i.exec(cleanRow)
		if (mLowHigh) {
			row[0] = {type: "cell", entry: cleanRow}; // Preseve the original text

			if (mLowHigh[2].toLowerCase() === "lower") {
				row[0].roll = {
					min: -Renderer.dice.POS_INFINITE,
					max: Number(mLowHigh[1]),
				};
			} else {
				row[0].roll = {
					min: Number(mLowHigh[1]),
					max: Renderer.dice.POS_INFINITE,
				};
			}

			return row;
		}

		// format: "95-00" or "12"
		// u2012 = figure dash; u2013 = en-dash
		const m = /^(\d+)([-\u2012\u2013](\d+))?$/.exec(cleanRow);
		if (m) {
			if (m[1] && !m[2]) {
				row[0] = {
					type: "cell",
					roll: {
						exact: Number(m[1]),
					},
				};
				if (m[1][0] === "0") row[0].roll.pad = true;
				Renderer.getRollableRow._handleInfiniteOpts(row, opts);
			} else {
				row[0] = {
					type: "cell",
					roll: {
						min: Number(m[1]),
						max: Number(m[3]),
					},
				};
				if (m[1][0] === "0" || m[3][0] === "0") row[0].roll.pad = true;
				Renderer.getRollableRow._handleInfiniteOpts(row, opts);
			}
		} else {
			// format: "12+"
			const m = /^(\d+)\+$/.exec(row[0]);
			row[0] = {
				type: "cell",
				roll: {
					min: Number(m[1]),
					max: Renderer.dice.POS_INFINITE,
				},
			};
		}
	} catch (e) {
		if (opts.cbErr) opts.cbErr(row[0], e);
	}
	return row;
};
Renderer.getRollableRow._handleInfiniteOpts = function (row, opts) {
	if (!opts.isForceInfiniteResults) return;

	const isExact = row[0].roll.exact != null;

	if (opts.isFirstRow) {
		if (!isExact) row[0].roll.displayMin = row[0].roll.min;
		row[0].roll.min = -Renderer.dice.POS_INFINITE;
	}

	if (opts.isLastRow) {
		if (!isExact) row[0].roll.displayMax = row[0].roll.max;
		row[0].roll.max = Renderer.dice.POS_INFINITE;
	}
};

Renderer.initLazyImageLoaders = function () {
	function onIntersection (obsEntries) {
		obsEntries.forEach(entry => {
			if (entry.intersectionRatio > 0) { // filter observed entries for those that intersect
				Renderer._imageObserver.unobserve(entry.target);
				const $img = $(entry.target);
				$img.attr("src", $img.attr("data-src")).removeAttr("data-src");
			}
		});
	}

	let printListener = null;
	const $images = $(`img[data-src]`);
	const config = {
		rootMargin: "150px 0px", // if the image gets within 150px of the viewport
		threshold: 0.01,
	};

	if (Renderer._imageObserver) {
		Renderer._imageObserver.disconnect();
		window.removeEventListener("beforeprint", printListener);
	}

	Renderer._imageObserver = new IntersectionObserver(onIntersection, config);
	$images.each((i, image) => Renderer._imageObserver.observe(image));

	// If we try to print a page with un-loaded images, attempt to load them all first
	printListener = () => {
		alert(`All images in the page will now be loaded. This may take a while.`);
		$images.each((i, image) => {
			Renderer._imageObserver.unobserve(image);
			const $img = $(image);
			$img.attr("src", $img.attr("data-src")).removeAttr("data-src");
		});
	};
	window.addEventListener("beforeprint", printListener);
};
Renderer._imageObserver = null;

Renderer.HEAD_NEG_1 = "rd__b--0";
Renderer.HEAD_0 = "rd__b--1";
Renderer.HEAD_1 = "rd__b--2";
Renderer.HEAD_2 = "rd__b--3";
Renderer.HEAD_2_SUB_VARIANT = "rd__b--4";
Renderer.DATA_NONE = "data-none";

if (typeof module !== "undefined") {
	module.exports.Renderer = Renderer;
	global.Renderer = Renderer;
}
