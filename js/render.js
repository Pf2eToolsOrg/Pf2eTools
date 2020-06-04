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

	this._lazyImages = false;
	this._subVariant = false;
	this._firstSection = true;
	this._isAddHandlers = true;
	this._headerIndex = 1;
	this._tagExportDict = null;
	this._roll20Ids = null;
	this._trackTitles = {enabled: false, titles: {}};
	this._enumerateTitlesRel = {enabled: false, titles: {}};
	this._hooks = {};
	this._fnPostProcess = null;
	this._extraSourceClasses = null;
	this._depthTracker = null;
	this._lastDepthTrackerSource = null;
	this._isInternalLinksDisabled = false;

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
	this.setWrapperTag = function (tag) { this.wrapperTag = tag; return this; };

	/**
	 * Set the base url for rendered links.
	 * Usage: `renderer.setBaseUrl("https://www.example.com/")` (note the "http" prefix and "/" suffix)
	 * @param url to use
	 */
	this.setBaseUrl = function (url) { this.baseUrl = url; return this; };

	/**
	 * Other sections should be prefixed with a vertical divider
	 * @param bool
	 */
	this.setFirstSection = function (bool) { this._firstSection = bool; return this; };

	/**
	 * Disable adding JS event handlers on elements.
	 * @param bool
	 */
	this.setAddHandlers = function (bool) { this._isAddHandlers = bool; return this; };

	/**
	 * Add a post-processing function which acts on the final rendered strings from a root call.
	 * @param fn
	 */
	this.setFnPostProcess = function (fn) { this._fnPostProcess = fn; return this; };

	/**
	 * Specify a list of extra classes to be added to those rendered on entries with sources.
	 * @param arr
	 */
	this.setExtraSourceClasses = function (arr) { this._extraSourceClasses = arr; return this; };

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

	this.setRoll20Ids = function (roll20Ids) {
		this._roll20Ids = roll20Ids;
		return this;
	};

	this.resetRoll20Ids = function () {
		this._roll20Ids = null;
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
			this._depthTracker.push({
				depth,
				name: entry.name,
				type: entry.type,
				ixHeader: this._headerIndex,
				source: this._lastDepthTrackerSource,
				data: entry.data,
				page: entry.page,
				alias: entry.alias,
				entry
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

	this._getHooks = function (entryType, hookType) { return (this._hooks[entryType] || {})[hookType] || []; };

	/**
	 * Specify an array where the renderer will record rendered header depths.
	 * Items added to the array are of the form: `{name: "Header Name", depth: 1, type: "entries", source: "PHB"}`
	 */
	this.setDepthTracker = function (arr) { this._depthTracker = arr; return this; };

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
			setTimeout(() => { throw new Error(`Array passed to renderer! The renderer only guarantees support for primitives and basic objects.`); });
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

		meta._didRenderPrefix = false;
		meta._didRenderSuffix = false;

		if (typeof entry === "object") {
			// the root entry (e.g. "Rage" in barbarian "classFeatures") is assumed to be of type "entries"
			const type = entry.type == null || entry.type === "section" ? "entries" : entry.type;

			meta._typeStack.push(type);

			switch (type) {
				// recursive
				case "entries": this._renderEntries(entry, textStack, meta, options); break;
				case "options": this._renderOptions(entry, textStack, meta, options); break;
				case "list": this._renderList(entry, textStack, meta, options); break;
				case "table": this._renderTable(entry, textStack, meta, options); break;
				case "tableGroup": this._renderTableGroup(entry, textStack, meta, options); break;
				case "inset": this._renderInset(entry, textStack, meta, options); break;
				case "insetReadaloud": this._renderInsetReadaloud(entry, textStack, meta, options); break;
				case "variant": this._renderVariant(entry, textStack, meta, options); break;
				case "variantSub": this._renderVariantSub(entry, textStack, meta, options); break;
				case "spellcasting": this._renderSpellcasting(entry, textStack, meta, options); break;
				case "quote": this._renderQuote(entry, textStack, meta, options); break;
				case "optfeature": this._renderOptfeature(entry, textStack, meta, options); break;
				case "patron": this._renderPatron(entry, textStack, meta, options); break;

				// block
				case "abilityDc": this._renderAbilityDc(entry, textStack, meta, options); break;
				case "abilityAttackMod": this._renderAbilityAttackMod(entry, textStack, meta, options); break;
				case "abilityGeneric": this._renderAbilityGeneric(entry, textStack, meta, options); break;

				// inline
				case "inline": this._renderInline(entry, textStack, meta, options); break;
				case "inlineBlock": this._renderInlineBlock(entry, textStack, meta, options); break;
				case "bonus": this._renderBonus(entry, textStack, meta, options); break;
				case "bonusSpeed": this._renderBonusSpeed(entry, textStack, meta, options); break;
				case "dice": this._renderDice(entry, textStack, meta, options); break;
				case "link": this._renderLink(entry, textStack, meta, options); break;
				case "actions": this._renderActions(entry, textStack, meta, options); break;
				case "attack": this._renderAttack(entry, textStack, meta, options); break;

				// list items
				case "item": this._renderItem(entry, textStack, meta, options); break;
				case "itemSub": this._renderItemSub(entry, textStack, meta, options); break;
				case "itemSpell": this._renderItemSpell(entry, textStack, meta, options); break;

				// entire data records
				case "dataCreature": this._renderDataCreature(entry, textStack, meta, options); break;
				case "dataSpell": this._renderDataSpell(entry, textStack, meta, options); break;
				case "dataTrapHazard": this._renderDataTrapHazard(entry, textStack, meta, options); break;
				case "dataObject": this._renderDataObject(entry, textStack, meta, options); break;

				// images
				case "image": this._renderImage(entry, textStack, meta, options); break;
				case "gallery": this._renderGallery(entry, textStack, meta, options); break;

				// flowchart
				case "flowchart": this._renderFlowchart(entry, textStack, meta, options); break;
				case "flowBlock": this._renderFlowBlock(entry, textStack, meta, options); break;

				// homebrew changes
				case "homebrew": this._renderHomebrew(entry, textStack, meta, options); break;

				// misc
				case "code": this._renderCode(entry, textStack, meta, options); break;
				case "hr": this._renderHr(entry, textStack, meta, options); break;
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
			hrefThumbnail: this._renderImage_getUrlThumbnail(entry)
		};
	};

	this._renderImage_getWrapperClasses = function (entry) {
		const out = ["rd__wrp-image"];
		if (entry.style) {
			switch (entry.style) {
				case "comic-speaker-left": out.push("rd__comic-img-speaker", "rd__comic-img-speaker--left"); break;
				case "comic-speaker-right": out.push("rd__comic-img-speaker", "rd__comic-img-speaker--right"); break;
			}
		}
		return out.join(" ");
	};

	this._renderImage_getImageClasses = function (entry) {
		const out = ["rd__image"];
		if (entry.style) {
			switch (entry.style) {
				case "deity-symbol": out.push("rd__img-small"); break;
			}
		}
		return out.join(" ");
	};

	this._renderImage_getUrl = function (entry) { return Renderer.utils.getMediaUrl(entry, "href", "img"); };
	this._renderImage_getUrlThumbnail = function (entry) { return Renderer.utils.getMediaUrl(entry, "hrefThumbnail", "img"); };

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

	this._renderTable = function (entry, textStack, meta, options) {
		// TODO add handling for rowLabel property
		if (entry.intro) {
			const len = entry.intro.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.intro[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
		}

		textStack[0] += `<table class="${entry.style || ""} ${entry.isStriped === false ? "" : "striped-odd"}">`;

		const autoMkRoller = Renderer.isRollableTable(entry);

		// caption
		if (entry.caption != null) textStack[0] += `<caption>${entry.caption}</caption>`;

		// body -- temporarily build this to own string; append after headers
		const rollCols = [];
		let bodyStack = [""];
		bodyStack[0] += "<tbody>";
		const len = entry.rows.length;
		for (let ixRow = 0; ixRow < len; ++ixRow) {
			bodyStack[0] += "<tr>";
			const r = entry.rows[ixRow];
			let roRender = r.type === "row" ? r.row : r;

			const len = roRender.length;
			for (let ixCell = 0; ixCell < len; ++ixCell) {
				rollCols[ixCell] = rollCols[ixCell] || false;

				// preconvert rollables
				if (autoMkRoller && ixCell === 0) {
					roRender = Renderer.getRollableRow(roRender);
					rollCols[ixCell] = true;
				}

				let toRenderCell;
				if (roRender[ixCell].type === "cell") {
					if (roRender[ixCell].roll) {
						rollCols[ixCell] = true;
						if (roRender[ixCell].roll.entry) {
							toRenderCell = roRender[ixCell].roll.entry;
						} else if (roRender[ixCell].roll.exact != null) {
							toRenderCell = roRender[ixCell].roll.pad ? StrUtil.padNumber(roRender[ixCell].roll.exact, 2, "0") : roRender[ixCell].roll.exact;
						} else {
							if (roRender[ixCell].roll.max === Renderer.dice.POS_INFINITE) {
								toRenderCell = roRender[ixCell].roll.pad
									? `${StrUtil.padNumber(roRender[ixCell].roll.min, 2, "0")}+`
									: `${roRender[ixCell].roll.min}+`;
							} else {
								toRenderCell = roRender[ixCell].roll.pad
									? `${StrUtil.padNumber(roRender[ixCell].roll.min, 2, "0")}-${StrUtil.padNumber(roRender[ixCell].roll.max, 2, "0")}`
									: `${roRender[ixCell].roll.min}-${roRender[ixCell].roll.max}`;
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
				this._recursiveRender(autoMkRoller && i === 0 && !lbl.includes("@dice") ? `{@dice ${lbl}}` : lbl, textStack, meta);
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

	this._renderEntriesSubtypes = function (entry, textStack, meta, options, incDepth) {
		const isInlineTitle = meta.depth >= 2;
		const pagePart = !isInlineTitle && entry.page > 0 ? ` <span class="rd__title-link">${entry.source ? `<span class="help--subtle" title="${Parser.sourceJsonToFull(entry.source)}">${Parser.sourceJsonToAbv(entry.source)}</span> ` : ""}p${entry.page}</span>` : "";
		const nextDepth = incDepth && meta.depth < 2 ? meta.depth + 1 : meta.depth;
		const styleString = this._renderEntriesSubtypes_getStyleString(entry, meta, isInlineTitle);
		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		if (entry.name != null) this._handleTrackTitles(entry.name);

		const headerClass = `rd__h--${meta.depth + 1}`; // adjust as the CSS is 0..4 rather than -1..3

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, meta.depth);

		const headerSpan = entry.name ? `<span class="rd__h ${headerClass}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}> <span class="entry-title-inner"${!pagePart && entry.source ? ` title="Source: ${Parser.sourceJsonToFull(entry.source)}${entry.page ? `, p${entry.page}` : ""}"` : ""}>${this.render({type: "inline", entries: [entry.name]})}${isInlineTitle ? "." : ""}</span>${pagePart}</span> ` : "";

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

	this._renderEntriesSubtypes_getDataString = function (entry) {
		let dataString = "";
		if (entry.source) dataString += `data-source="${entry.source}"`;
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
		styleClasses.push(this._getStyleClass(entry.source));
		if (isInlineTitle) {
			if (this._subVariant) styleClasses.push(Renderer.HEAD_2_SUB_VARIANT);
			else styleClasses.push(Renderer.HEAD_2);
		} else styleClasses.push(meta.depth === -1 ? Renderer.HEAD_NEG_1 : meta.depth === 0 ? Renderer.HEAD_0 : Renderer.HEAD_1);
		return styleClasses.length > 0 ? `class="${styleClasses.join(" ")}"` : "";
	};

	this._renderOptions = function (entry, textStack, meta, options) {
		if (entry.entries) {
			entry.entries = entry.entries.sort((a, b) => a.name && b.name ? SortUtil.ascSort(a.name, b.name) : a.name ? -1 : b.name ? 1 : 0);
			this._renderEntriesSubtypes(entry, textStack, meta, options, false);
		}
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
					const className = `${this._getStyleClass(item.source)}${item.type === "itemSpell" ? " rd__li-spell" : ""}`;
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

	this._renderInset = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="rd__b-inset" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="rd__h rd__h--2-inset" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></span>`;
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
		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="rd__b-inset rd__b-inset--readaloud" ${dataString}>`;

		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="rd__h rd__h--2-inset" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}</span></span>`;
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
		const dataString = this._renderEntriesSubtypes_getDataString(entry);

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
		if (entry.variantSource) textStack[0] += Renderer.utils._getPageTrText(entry.variantSource);
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
		const toRender = [{type: "entries", name: entry.name, entries: entry.headerEntries ? MiscUtil.copy(entry.headerEntries) : []}];

		if (entry.constant || entry.will || entry.rest || entry.daily || entry.weekly) {
			const tempList = {type: "list", style: "list-hang-notitle", items: [], data: {isSpellList: true}};
			if (entry.constant && !hidden.has("constant")) tempList.items.push({type: "itemSpell", name: `Constant:`, entry: entry.constant.join(", ")});
			if (entry.will && !hidden.has("will")) tempList.items.push({type: "itemSpell", name: `At will:`, entry: entry.will.join(", ")});
			if (entry.rest && !hidden.has("rest")) {
				for (let lvl = 9; lvl > 0; lvl--) {
					const rest = entry.rest;
					if (rest[lvl]) tempList.items.push({type: "itemSpell", name: `${lvl}/rest:`, entry: rest[lvl].join(", ")});
					const lvlEach = `${lvl}e`;
					if (rest[lvlEach]) tempList.items.push({type: "itemSpell", name: `${lvl}/rest each:`, entry: rest[lvlEach].join(", ")});
				}
			}
			if (entry.daily && !hidden.has("daily")) {
				for (let lvl = 9; lvl > 0; lvl--) {
					const daily = entry.daily;
					if (daily[lvl]) tempList.items.push({type: "itemSpell", name: `${lvl}/day:`, entry: daily[lvl].join(", ")});
					const lvlEach = `${lvl}e`;
					if (daily[lvlEach]) tempList.items.push({type: "itemSpell", name: `${lvl}/day each:`, entry: daily[lvlEach].join(", ")});
				}
			}
			if (entry.weekly && !hidden.has("weekly")) {
				for (let lvl = 9; lvl > 0; lvl--) {
					const weekly = entry.weekly;
					if (weekly[lvl]) tempList.items.push({type: "itemSpell", name: `${lvl}/week:`, entry: weekly[lvl].join(", ")});
					const lvlEach = `${lvl}e`;
					if (weekly[lvlEach]) tempList.items.push({type: "itemSpell", name: `${lvl}/week each:`, entry: weekly[lvlEach].join(", ")});
				}
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
					tempList.items.push({type: "itemSpell", name: `${levelCantrip}${slotsAtWill}:`, entry: spells.spells.join(", ")})
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
			textStack[0] += `<p class="rd__quote-line ${i === len - 1 && entry.by ? `rd__quote-line--last` : ""}">`;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<i>", suffix: "</i>"});
			textStack[0] += `</p>`;
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
		textStack[0] += `${entry.value < 0 ? "" : "+"}${entry.value} ft.`;
	};

	this._renderDice = function (entry, textStack, meta, options) {
		textStack[0] += Renderer.getEntryDice(entry, entry.name, this._isAddHandlers);
	};

	this._renderActions = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);

		this._handleTrackTitles(entry.name);
		const cachedLastDepthTrackerSource = this._lastDepthTrackerSource;
		this._handleTrackDepth(entry, 2);

		textStack[0] += `<${this.wrapperTag} class="${Renderer.HEAD_2}" ${dataString}><span class="rd__h rd__h--3" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}.</span></span> `;
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerSource = cachedLastDepthTrackerSource;
	};

	this._renderAttack = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<i>${Parser.attackTypeToFull(entry.attackType)}:</i> `;
		const len = entry.attackEntries.length;
		for (let i = 0; i < len; ++i) this._recursiveRender(entry.attackEntries[i], textStack, meta);
		textStack[0] += ` <i>Hit:</i> `;
		const len2 = entry.hitEntries.length;
		for (let i = 0; i < len2; ++i) this._recursiveRender(entry.hitEntries[i], textStack, meta);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderItem = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<p><span class="bold list-item-title">${this.render(entry.name)}</span> `;
		if (entry.entry) this._recursiveRender(entry.entry, textStack, meta);
		else if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta, {prefix: i > 0 ? `<span class="rd__p-cont-indent">` : "", suffix: i > 0 ? "</span>" : ""});
		}
		textStack[0] += "</p>";
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderItemSub = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._recursiveRender(entry.entry, textStack, meta, {prefix: `<p><span class="italic list-item-title">${entry.name}</span> `, suffix: "</p>"});
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
		textStack[0] += Renderer.monster.getCompactRenderedString(entry.dataCreature, this);
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataSpell = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataSpell.name);
		textStack[0] += Renderer.spell.getCompactRenderedString(entry.dataSpell);
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataTrapHazard = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataTrapHazard.name);
		textStack[0] += Renderer.traphazard.getCompactRenderedString(entry.dataTrapHazard);
		this._renderDataFooter(textStack);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataObject = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._renderDataHeader(textStack, entry.dataObject.name);
		textStack[0] += Renderer.object.getCompactRenderedString(entry.dataObject);
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
		const dataString = this._renderEntriesSubtypes_getDataString(entry);
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
			const hoverMeta = Renderer.hover.getMakePredefinedHover({type: "entries", name: "Homebrew", entries: entry.oldEntries});
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
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta)
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

	this._getStyleClass = function (source) {
		const outList = [];
		if (SourceUtil.isNonstandardSource(source)) outList.push("spicy-sauce");
		if (BrewUtil.hasSourceJson(source)) outList.push("refreshing-brew");
		if (this._extraSourceClasses) outList.push(...this._extraSourceClasses);
		return outList.join(" ");
	};

	this._renderString = function (entry, textStack, meta, options) {
		const tagSplit = Renderer.splitByTags(entry);
		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;
			if (s[0] === "@") {
				const [tag, text] = Renderer.splitFirstSpace(s);
				this._renderString_renderTag(textStack, meta, options, tag, text);
			} else textStack[0] += s;
		}
	};

	this._renderString_renderTag = function (textStack, meta, options, tag, text) {
		switch (tag) {
			// BASIC STYLES/TEXT ///////////////////////////////////////////////////////////////////////////////
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
				textStack[0] += toDisplay;
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
					rollable: true
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
						const n = Number(rollText);
						const mod = `${n >= 0 ? "+" : ""}${n}`;
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
									preEncoded: true
								}
							} else if (fName === "search") {
								// "search" as a filter name is hackily converted to a box meta option
								return {
									key: VeCt.FILTER_BOX_SUB_HASH_SEARCH_PREFIX,
									value: UrlUtil.encodeForHash(fVals),
									preEncoded: true
								};
							} else if (fName === "hash") {
								customHash = fVals;
								return null;
							} else if (fVals.startsWith("[") && fVals.endsWith("]")) { // range
								const [min, max] = fVals.substring(1, fVals.length - 1).split(";").map(it => it.trim());
								if (max == null) { // shorthand version, with only one value, becomes min _and_ max
									value = [
										`min=${min}`,
										`max=${min}`
									].join(HASH_SUB_LIST_SEP);
								} else {
									value = [
										min ? `min=${min}` : "",
										max ? `max=${max}` : ""
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
								preEncoded: true
							}];

							if (fMeta) {
								out.push({
									key: `flmt${UrlUtil.encodeForHash(fName)}`,
									value: fMeta,
									preEncoded: true
								});
							}

							if (fOpts) {
								out.push({
									key: `flop${UrlUtil.encodeForHash(fName)}`,
									value: fOpts,
									preEncoded: true
								});
							}

							return out;
						}).flat().filter(Boolean)
					}
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
						url: outUrl
					},
					text: displayText
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}
			case "@5etools": {
				const [displayText, page, hash] = Renderer.splitTagByPipe(text);
				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: page
					},
					text: displayText
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
					entries: [footnoteText, optTitle ? `{@note ${optTitle}}` : ""].filter(Boolean)
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
					entries: tooltipEntries
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
						case "@skill": return Parser.skillToExplanation;
						case "@sense": return Parser.senseToExplanation;
					}
				})();
				const [name, displayText] = Renderer.splitTagByPipe(text);
				const hoverMeta = Renderer.hover.getMakePredefinedHover({
					type: "entries",
					name: name.toTitleCase(),
					entries: expander(name)
				});
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
					const hoverMeta = Renderer.hover.getMakePredefinedHover(area.entry, {isLargeBookContent: true, depth: area.depth});
					textStack[0] += `<a href="#${BookUtil.curRender.curBookId},${area.chapter},${UrlUtil.encodeForHash(area.entry.name)}" ${hoverMeta.html}>${renderText}</a>`;
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
				const [displayText, book, chapter, section, number] = Renderer.splitTagByPipe(text);
				const hash = `${book}${chapter ? `${HASH_PART_SEP}${chapter}${section ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(section)}${number != null ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(number)}` : ""}` : ""}` : ""}`;
				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: page,
						hash,
						hashPreEncoded: true
					},
					text: displayText
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
						hash
					},
					text: (displayText || name)
				};

				fauxEntry.href.path = "deities.html";
				if (!pantheon) fauxEntry.href.hash += `${HASH_LIST_SEP}forgotten realms`;
				if (!source) fauxEntry.href.hash += `${HASH_LIST_SEP}${SRC_PHB}`;
				fauxEntry.href.hover = {
					page: UrlUtil.PG_DEITIES,
					source: source || SRC_PHB
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			default: {
				const [name, source, displayText, ...others] = Renderer.splitTagByPipe(text);
				const hash = `${name}${source ? `${HASH_LIST_SEP}${source}` : ""}`;

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						hash
					},
					text: (displayText || name)
				};
				switch (tag) {
					case "@spell":
						fauxEntry.href.path = "spells.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_SPELLS,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@item":
						fauxEntry.href.path = "items.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_ITEMS,
							source: source || SRC_DMG
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@class": {
						fauxEntry.href.hover = {
							page: UrlUtil.PG_CLASSES,
							source: source || SRC_PHB
						};
						if (others.length) {
							const classStateOpts = {
								subclass: {
									shortName: others[0].trim(),
									source: others.length > 1 ? others[1].trim() : "phb"
								}
							};

							// Don't include the feature part for hovers, as it is unsupported
							const hoverSubhashObj = UrlUtil.unpackSubHash(UrlUtil.getClassesPageStatePart(classStateOpts));
							fauxEntry.href.hover.subhashes = [{key: "state", value: hoverSubhashObj.state, preEncoded: true}];

							if (others.length > 2) {
								const featureParts = others[2].trim().split("-");
								classStateOpts.feature = {
									ixLevel: featureParts[0] || "0",
									ixFeature: featureParts[1] || "0"
								};
							}

							const subhashObj = UrlUtil.unpackSubHash(UrlUtil.getClassesPageStatePart(classStateOpts));

							fauxEntry.href.subhashes = [
								{key: "state", value: subhashObj.state.join(HASH_SUB_LIST_SEP), preEncoded: true},
								{key: "fltsource", value: "clear"},
								{key: "flstmiscellaneous", value: "clear"}
							];
						}
						fauxEntry.href.path = "classes.html";
						if (!source) fauxEntry.href.hash += `${HASH_LIST_SEP}${SRC_PHB}`;
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					}
					case "@creature":
						fauxEntry.href.path = "bestiary.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_MM;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_BESTIARY,
							source: source || SRC_MM
						};
						// ...|scaledCr}
						if (others.length) {
							const targetCrNum = Parser.crToNumber(others[0]);
							fauxEntry.href.hover.preloadId = `${VeCt.HASH_MON_SCALED}:${targetCrNum}`;
							fauxEntry.href.subhashes = [
								{key: VeCt.HASH_MON_SCALED, value: targetCrNum}
							];
							fauxEntry.text = displayText || `${name} (CR ${others[0]})`;
						}
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@condition":
						fauxEntry.href.path = "conditionsdiseases.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_CONDITIONS_DISEASES,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@disease":
						fauxEntry.href.path = "conditionsdiseases.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_CONDITIONS_DISEASES,
							source: source || SRC_DMG
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@background":
						fauxEntry.href.path = "backgrounds.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_BACKGROUNDS,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@race":
						fauxEntry.href.path = "races.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_RACES,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@optfeature":
						fauxEntry.href.path = "optionalfeatures.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_OPT_FEATURES,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@reward":
						fauxEntry.href.path = "rewards.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_REWARDS,
							source: source || SRC_DMG
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@feat":
						fauxEntry.href.path = "feats.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_FEATS,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@psionic":
						fauxEntry.href.path = "psionics.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_UATMC;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_PSIONICS,
							source: source || SRC_UATMC
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@object":
						fauxEntry.href.path = "objects.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_OBJECTS,
							source: source || SRC_DMG
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@boon":
					case "@cult":
						fauxEntry.href.path = "cultsboons.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_MTF;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_CULTS_BOONS,
							source: source || SRC_MTF
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@trap":
					case "@hazard":
						fauxEntry.href.path = "trapshazards.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_TRAPS_HAZARDS,
							source: source || SRC_DMG
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@variantrule":
						fauxEntry.href.path = "variantrules.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_VARIATNRULES,
							source: source || SRC_DMG
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@table":
						fauxEntry.href.path = "tables.html";
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_TABLES,
							source: source || SRC_DMG
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@vehicle":
						fauxEntry.href.path = UrlUtil.PG_VEHICLES;
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_GoS;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_VEHICLES,
							source: source || SRC_GoS
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@action":
						fauxEntry.href.path = UrlUtil.PG_ACTIONS;
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_ACTIONS,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
					case "@language":
						fauxEntry.href.path = UrlUtil.PG_LANGUAGES;
						if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
						fauxEntry.href.hover = {
							page: UrlUtil.PG_LANGUAGES,
							source: source || SRC_PHB
						};
						this._recursiveRender(fauxEntry, textStack, meta);
						break;
				}

				break;
			}
		}
	};

	this._renderString_getLoaderTagMeta = function (text) {
		const [name, file] = Renderer.splitTagByPipe(text);
		const path = /^.*?:\/\//.test(file) ? file : `https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/${file}`;
		return {name, path};
	};

	this._renderPrimitive = function (entry, textStack, meta, options) { textStack[0] += entry; };

	this._renderLink = function (entry, textStack, meta, options) {
		let href = this._renderLink_getHref(entry);

		// overwrite href if there's an available Roll20 handout/character
		if (entry.href.hover && this._roll20Ids) {
			const procHash = UrlUtil.encodeForHash(entry.href.hash);
			const id = this._roll20Ids[procHash];
			if (id) {
				href = `http://journal.roll20.net/${id.type}/${id.roll20Id}`;
			}
		}

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
		let procHash = UrlUtil.encodeForHash(entry.href.hash).replace(/'/g, "\\'");
		if (this._tagExportDict) {
			this._tagExportDict[procHash] = {
				page: entry.href.hover.page,
				source: entry.href.hover.source,
				hash: procHash
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

Renderer.ENTRIES_WITH_CHILDREN = [
	{type: "section", key: "entries"},
	{type: "entries", key: "entries"},
	{type: "inset", key: "entries"},
	{type: "insetReadaloud", key: "entries"},
	{type: "list", key: "items"},
	{type: "table", key: "rows"}
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
	}
};

Renderer.applyProperties = function (entry, object) {
	const propSplit = Renderer.splitByPropertyInjectors(entry);
	const len = propSplit.length;
	if (len === 1) return entry;

	let textStack = "";

	for (let i = 0; i < len; ++i) {
		const s = propSplit[i];
		if (!s) continue;
		if (s[0] === "=") {
			const [path, modifiers] = s.substring(1).split("/");
			let fromProp = object[path];

			if (modifiers) {
				for (const modifier of modifiers) {
					switch (modifier) {
						case "a": // render "a"/"an" depending on prop value
							fromProp = Renderer.applyProperties._leadingAn.has(fromProp[0].toLowerCase()) ? "an" : "a";
							break;

						case "l": fromProp = fromProp.toLowerCase(); break; // convert text to lower case
						case "t": fromProp = fromProp.toTitleCase(); break; // title-case text
						case "u": fromProp = fromProp.toUpperCase(); break; // uppercase text
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
	const handlers = {string: (ident, str) => Renderer.applyProperties(str, object)};
	return MiscUtil.getWalker().walk("applyAllProperties", entries, handlers);
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
							curStr = leadingCharacter;
							++i;
						}
					} else curStr += "{";
					break;

				case "}":
					isLastOpen = false;
					if (tagDepth === 0) {
						curStr += "}";
					} else if (--tagDepth === 0) {
						out.push(curStr.replace(/<VE_LEAD>/g, leadingCharacter));
						curStr = "";
					} else curStr += "}";
					break;

				case leadingCharacter: {
					if (!isLastOpen) curStr += "<VE_LEAD>";
					else curStr += leadingCharacter;
					break;
				}

				default: isLastOpen = false; curStr += char; break;
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
			options
		}
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
		[...new Set(outerStack.map(it => it.areNegative).flat())]
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
	 */
	getNameTr: (it, opts) => {
		opts = opts || {};

		let dataPart = "";
		let pageLinkPart;
		if (opts.page) {
			const hash = UrlUtil.URL_TO_HASH_BUILDER[opts.page](it);
			dataPart = `data-page="${opts.page}" data-source="${it.source.escapeQuotes()}" data-hash="${hash.escapeQuotes()}" ${opts.extensionData != null ? `data-extension="${`${opts.extensionData}`.escapeQuotes()}"` : ""}`;
			pageLinkPart = SourceUtil.getAdventureBookSourceHref(it.source, it.page);
		}

		// Add data-page/source/hash attributes for external script use (e.g. Rivet)
		const $ele = $$`<tr>
			<th class="rnd-name name ${opts.extraThClasses ? opts.extraThClasses.join(" ") : ""}" colspan="6" ${dataPart}>
				<div class="name-inner">
					<div class="flex-v-center">
						<span class="stats-name copyable" onmousedown="event.preventDefault()" onclick="Renderer.utils._pHandleNameClick(this)">${opts.prefix || ""}${it._displayName || it.name}${opts.suffix || ""}</span>
						${opts.controlRhs || ""}
						${ExtensionUtil.ACTIVE && opts.page ? `<button title="Send to Foundry (SHIFT for Temporary Import)" class="btn btn-xs btn-default btn-stats-name ml-2" onclick="ExtensionUtil.pDoSendStats(event, this)"><span class="glyphicon glyphicon-send"></span></button>` : ""}
					</div>
					<div class="stats-source flex-v-baseline">
						<span class="help--subtle ${it.source ? `${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)}${Renderer.utils.getSourceSubText(it)}` : ""}" ${BrewUtil.sourceJsonToStyle(it.source)}">${it.source ? Parser.sourceJsonToAbv(it.source) : ""}</span>
						${it.page > 0 ? ` <${pageLinkPart ? `a href="${pageLinkPart}"` : "span"} class="rd__stats-name-page ml-1" title="Page ${it.page}">p${it.page}</${pageLinkPart ? "a" : "span"}>` : ""}
					</div>
				</div>
			</th>
		</tr>`;

		if (opts.asJquery) return $ele;
		else return $ele[0].outerHTML;
	},

	getExcludedTr (it, dataProp) {
		if (!ExcludeUtil.isInitialised) return "";
		const isExcluded = ExcludeUtil.isExcluded(it.name, dataProp, it.source);
		return isExcluded ? `<tr><td colspan="6" class="pt-3 text-center text-danger"><b><i>Warning: This content has been blacklisted.</i></b></td></tr>` : "";
	},

	async _pHandleNameClick (ele) {
		await MiscUtil.pCopyTextToClipboard($(ele).text());
		JqueryUtil.showCopiedEffect($(ele));
	},

	getPageTr: (it) => {
		return `<tr><td colspan=6>${Renderer.utils._getPageTrText(it)}</td></tr>`;
	},

	_getPageTrText: (it) => {
		function getAltSourceText (prop, introText) {
			if (!it[prop] || !it[prop].length) return "";

			return `${introText} ${it[prop].map(as => {
				if (as.entry) return Renderer.get().render(as.entry);
				else {
					return `<i title="${Parser.sourceJsonToFull(as.source)}">${Parser.sourceJsonToAbv(as.source)}</i>${as.page > 0 ? `, page ${as.page}` : ""}`;
				}
			}).join("; ")}`
		}

		const sourceSub = Renderer.utils.getSourceSubText(it);
		const baseText = it.page > 0 ? `<b>Source:</b> <i title="${Parser.sourceJsonToFull(it.source)}${sourceSub}">${Parser.sourceJsonToAbv(it.source)}${sourceSub}</i>, page ${it.page}` : "";
		const addSourceText = getAltSourceText("additionalSources", "Additional information from");
		const otherSourceText = getAltSourceText("otherSources", "Also found in");
		const srdText = it.srd ? `Available in the <span title="Systems Reference Document">SRD</span>${typeof it.srd === "string" ? ` (as &quot;${it.srd}&quot;)` : ""}` : "";
		const externalSourceText = getAltSourceText("externalSources", "External sources:");

		return `${[baseText, addSourceText, otherSourceText, srdText, externalSourceText].filter(it => it).join(". ")}${baseText && (addSourceText || otherSourceText || srdText || externalSourceText) ? "." : ""}`;
	},

	getAbilityRoller (statblock, ability) {
		if (statblock[ability] == null) return "\u2014";
		const mod = Parser.getAbilityModifier(statblock[ability]);
		return Renderer.get().render(`{@d20 ${mod}|${statblock[ability]} (${mod})|${Parser.attAbvToFull(ability)}`);
	},

	tabButton: (label, funcChange, funcPopulate) => {
		return {
			label: label,
			funcChange: funcChange,
			funcPopulate: funcPopulate
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
			const $t = $(`<span class="stat-tab ${toSel ? `stat-tab-sel` : ""} btn btn-default stat-tab-gen">${tb.label}</span>`);
			tb.$t = $t;
			$t.click(() => {
				const curTab = Renderer.utils._curTab;
				const tabs = Renderer.utils._tabs;

				if (!curTab || curTab.label !== tb.label) {
					if (curTab) curTab.$t.removeClass(`stat-tab-sel`);
					Renderer.utils._curTab = tb;
					$t.addClass(`stat-tab-sel`);
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
	 * @param entry Data entry to search for fluff on, e.g. a monster
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
				&& it.source === entry.fluff[mappedProp].source
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
	 * @param {entity} Entity to build tab for (e.g. a monster; an item)
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
		[undefined]: 12
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
						case "pact": return Parser.prereqPactToFull(v);
						case "patron": return isListMode ? `${Parser.prereqPatronToShort(v)} patron` : `${v} patron`;
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
						case "other": return isListMode ? "Special" : Renderer.get().render(v);
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
									isComplex ? ` <i>or</i> ` : " or "
								);
								return `${joined}${allValuesEqual != null ? ` 13 or higher` : ""}`
							}
						}
						case "proficiency": {
							// only handles armor proficiency requirements,
							const parts = v.map(obj => {
								return Object.entries(obj).map(([profType, prof]) => {
									if (profType === "armor") {
										return isListMode ? `Prof ${Parser.armorFullToAbv(prof)} armor` : `Proficiency with ${prof} armor`;
									}
								})
							});
							return isListMode ? parts.join("/") : parts.joinConjunct(", ", " or ");
						}
						case "spellcasting": return isListMode ? "Spellcasting" : "The ability to cast at least one spell";
						case "psionics": return isListMode ? "Psionics" : Renderer.get().render("Psionic Talent feature or {@feat Wild Talent|UA2020PsionicOptionsRevisited} feat");
						default: throw new Error(`Unhandled key: ${k}`);
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
			const baseUrl = Renderer.get().baseUrl;
			const mediaPart = `${mediaDir}/${entry[prop].path}`;
			href = baseUrl !== "" ? `${baseUrl}${mediaPart}` : UrlUtil.link(mediaPart);
		} else if (entry[prop].type === "external") {
			href = entry[prop].url;
		}
		return href;
	}
};

Renderer.feat = {
	mergeAbilityIncrease: function (feat) {
		if (!feat.ability || feat._hasMergedAbility) return;
		feat._hasMergedAbility = true;
		if (feat.ability.every(it => it.hidden)) return;
		const targetList = feat.entries.find(e => e.type === "list");
		if (targetList) {
			feat.ability.forEach(abilObj => targetList.items.unshift(abilityObjToListItem(abilObj)));
		} else {
			// this should never happen, but display sane output anyway, and throw an out-of-order exception
			feat.ability.forEach(abilObj => feat.entries.unshift(abilityObjToListItem(abilObj)));

			setTimeout(() => {
				throw new Error(`Could not find object of type "list" in "entries" for feat "${feat.name}" from source "${feat.source}" when merging ability scores! Reformat the feat to include a "list"-type entry.`);
			}, 1);
		}

		function abilityObjToListItem (abilityObj) {
			const abbArr = [];
			if (!abilityObj.choose) {
				Object.keys(abilityObj).forEach(ab => abbArr.push(`Increase your ${Parser.attAbvToFull(ab)} score by ${abilityObj[ab]}, to a maximum of 20.`));
			} else {
				const choose = abilityObj.choose;
				if (choose.from.length === 6) {
					if (choose.entry) { // only used in "Resilient"
						abbArr.push(Renderer.get().render(choose.entry));
					} else {
						abbArr.push(`Increase one ability score of your choice by ${choose.amount}, to a maximum of 20.`);
					}
				} else {
					const from = choose.from;
					const amount = choose.amount;
					const abbChoices = [];
					for (let j = 0; j < from.length; ++j) {
						abbChoices.push(Parser.attAbvToFull(from[j]));
					}
					const abbChoicesText = abbChoices.joinConjunct(", ", " or ");
					abbArr.push(`Increase your ${abbChoicesText} by ${amount}, to a maximum of 20.`);
				}
			}
			return abbArr.join(" ");
		}
	},

	getCompactRenderedString (feat) {
		const renderer = Renderer.get();
		const renderStack = [];

		const prerequisite = Renderer.utils.getPrerequisiteText(feat.prerequisite);
		Renderer.feat.mergeAbilityIncrease(feat);
		renderStack.push(`
			${Renderer.utils.getExcludedTr(feat, "feat")}
			${Renderer.utils.getNameTr(feat, {page: UrlUtil.PG_FEATS})}
			<tr class="text"><td colspan="6" class="text">
			${prerequisite ? `<p><i>${prerequisite}</i></p>` : ""}
		`);
		renderer.recursiveRender({entries: feat.entries}, renderStack, {depth: 2});
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	}
};

Renderer.get = () => {
	if (!Renderer.defaultRenderer) Renderer.defaultRenderer = new Renderer();
	return Renderer.defaultRenderer;
};

Renderer.spell = {
	getCompactRenderedString (spell) {
		const renderer = Renderer.get();
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getExcludedTr(spell, "spell")}
			${Renderer.utils.getNameTr(spell, {page: UrlUtil.PG_SPELLS})}
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th colspan="1">Level</th>
						<th colspan="1">School</th>
						<th colspan="2">Casting Time</th>
						<th colspan="2">Range</th>
					</tr>
					<tr>
						<td colspan="1">${Parser.spLevelToFull(spell.level)}${Parser.spMetaToFull(spell.meta)}</td>
						<td colspan="1">${Parser.spSchoolAndSubschoolsAbvsToFull(spell.school, spell.subschools)}</td>
						<td colspan="2">${Parser.spTimeListToFull(spell.time)}</td>
						<td colspan="2">${Parser.spRangeToFull(spell.range)}</td>
					</tr>
					<tr>
						<th colspan="4">Components</th>
						<th colspan="2">Duration</th>
					</tr>
					<tr>
						<td colspan="4">${Parser.spComponentsToFull(spell.components, spell.level)}</td>
						<td colspan="2">${Parser.spDurationToFull(spell.duration)}</td>
					</tr>
				</table>
			</td></tr>
		`);

		renderStack.push(`<tr class="text"><td colspan="6" class="text">`);
		const entryList = {type: "entries", entries: spell.entries};
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		if (spell.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, renderStack, {depth: 2});
		}
		if (spell.classes && spell.classes.fromClassList) {
			const [current] = Parser.spClassesToCurrentAndLegacy(spell.classes);
			renderStack.push(`<div><span class="bold">Classes: </span>${Parser.spMainClassesToFull({fromClassList: current})}</div>`);
		}
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	},

	initClasses (spell, brewSpellClasses) {
		if (spell._isInitClasses) return;
		spell._isInitClasses = true;

		// TODO make a `_tempClasses` object that mirrors `classes` and add this temp data to it instead, to avoid polluting the main data
		// add eldritch knight and arcane trickster
		if (spell.classes && spell.classes.fromClassList && spell.classes.fromClassList.filter(c => c.name === Renderer.spell.STR_WIZARD && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) spell.classes.fromSubclass = [];
			spell.classes.fromSubclass.push({
				class: {name: Renderer.spell.STR_FIGHTER, source: SRC_PHB},
				subclass: {name: Renderer.spell.STR_ELD_KNIGHT, source: SRC_PHB}
			});
			spell.classes.fromSubclass.push({
				class: {name: Renderer.spell.STR_ROGUE, source: SRC_PHB},
				subclass: {name: Renderer.spell.STR_ARC_TCKER, source: SRC_PHB}
			});
			if (spell.level > 4) {
				spell._scrollNote = true;
			}
		}

		// add divine soul, favored soul v2, favored soul v3
		if (spell.classes && spell.classes.fromClassList && spell.classes.fromClassList.filter(c => c.name === Renderer.spell.STR_CLERIC && c.source === SRC_PHB).length) {
			if (!spell.classes.fromSubclass) {
				spell.classes.fromSubclass = [];
				spell.classes.fromSubclass.push({
					class: {name: Renderer.spell.STR_SORCERER, source: SRC_PHB},
					subclass: {name: Renderer.spell.STR_DIV_SOUL, source: SRC_XGE}
				});
			} else {
				if (!spell.classes.fromSubclass.find(it => it.class.name === Renderer.spell.STR_SORCERER && it.class.source === SRC_PHB && it.subclass.name === Renderer.spell.STR_DIV_SOUL && it.subclass.source === SRC_XGE)) {
					spell.classes.fromSubclass.push({
						class: {name: Renderer.spell.STR_SORCERER, source: SRC_PHB},
						subclass: {name: Renderer.spell.STR_DIV_SOUL, source: SRC_XGE}
					});
				}
			}
			spell.classes.fromSubclass.push({
				class: {name: Renderer.spell.STR_SORCERER, source: SRC_PHB},
				subclass: {name: Renderer.spell.STR_FAV_SOUL_V2, source: SRC_UAS}
			});
			spell.classes.fromSubclass.push({
				class: {name: Renderer.spell.STR_SORCERER, source: SRC_PHB},
				subclass: {name: Renderer.spell.STR_FAV_SOUL_V3, source: SRC_UARSC}
			});
		}

		if (spell.classes && spell.classes.fromClassList && spell.classes.fromClassList.find(it => it.name === "Wizard")) {
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
					class: {name: Renderer.spell.STR_CLERIC, source: SRC_PHB},
					subclass: {name: "Arcana", source: SRC_SCAG}
				});
			}

			// add arcana cleric
			if (spell.level >= 6) {
				(spell.classes.fromSubclass = spell.classes.fromSubclass || []).push({
					class: {name: Renderer.spell.STR_CLERIC, source: SRC_PHB},
					subclass: {name: "Arcana", source: SRC_SCAG}
				});
			}
		}

		if (spell.classes && spell.classes.fromClassList && spell.classes.fromClassList.find(it => it.name === "Druid")) {
			if (spell.level === 0) {
				// add nature cleric
				(spell.classes.fromSubclass = spell.classes.fromSubclass || []).push({
					class: {name: Renderer.spell.STR_CLERIC, source: SRC_PHB},
					subclass: {name: "Nature", source: SRC_PHB}
				});
			}
		}

		// add homebrew class/subclass
		if (brewSpellClasses) {
			const lowName = spell.name.toLowerCase();

			if (brewSpellClasses.spell) {
				if (brewSpellClasses.spell[spell.source] && brewSpellClasses.spell[spell.source][lowName]) {
					spell.classes = spell.classes || {};
					if (brewSpellClasses.spell[spell.source][lowName].fromClassList.length) {
						spell.classes.fromClassList = spell.classes.fromClassList || [];
						spell.classes.fromClassList.push(...brewSpellClasses.spell[spell.source][lowName].fromClassList);
					}
					if (brewSpellClasses.spell[spell.source][lowName].fromSubclass.length) {
						spell.classes.fromSubclass = spell.classes.fromSubclass || [];
						spell.classes.fromSubclass.push(...brewSpellClasses.spell[spell.source][lowName].fromSubclass);
					}
				}
			}

			if (brewSpellClasses.class && spell.classes && spell.classes.fromClassList) {
				// speed over safety
				outer: for (const src in brewSpellClasses.class) {
					const searchForClasses = brewSpellClasses.class[src];

					for (const clsLowName in searchForClasses) {
						const spellHasClass = spell.classes.fromClassList.some(cls => cls.source === src && cls.name.toLowerCase() === clsLowName);
						if (!spellHasClass) continue;

						const fromDetails = searchForClasses[clsLowName];

						if (fromDetails.fromClassList) {
							spell.classes.fromClassList.push(...fromDetails.fromClassList);
						}

						if (fromDetails.fromSubclass) {
							spell.classes.fromSubclass = spell.classes.fromSubclass || [];
							spell.classes.fromSubclass.push(...fromDetails.fromSubclass);
						}

						// Only add it once regardless of how many classes match
						break outer;
					}
				}
			}
		}
	},
	STR_WIZARD: "Wizard",
	STR_FIGHTER: "Fighter",
	STR_ROGUE: "Rogue",
	STR_CLERIC: "Cleric",
	STR_SORCERER: "Sorcerer",
	STR_ELD_KNIGHT: "Eldritch Knight",
	STR_ARC_TCKER: "Arcane Trickster",
	STR_DIV_SOUL: "Divine Soul",
	STR_FAV_SOUL_V2: "Favored Soul v2 (UA)",
	STR_FAV_SOUL_V3: "Favored Soul v3 (UA)",

	pGetFluff (sp) {
		return Renderer.utils.pGetFluff({
			entity: sp,
			fluffBaseUrl: `data/spells/`,
			fluffProp: "spellFluff"
		});
	}
};

Renderer.condition = {
	getCompactRenderedString (cond) {
		const renderer = Renderer.get();
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getExcludedTr(cond, cond.__prop || cond._type)}
			${Renderer.utils.getNameTr(cond, {page: UrlUtil.PG_CONDITIONS_DISEASES})}
			<tr class="text"><td colspan="6">
		`);
		renderer.recursiveRender({entries: cond.entries}, renderStack);
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	},

	pGetFluff (it) {
		return Renderer.utils.pGetFluff({
			entity: it,
			fluffUrl: `data/fluff-conditionsdiseases.json`,
			fluffProp: it.__prop === "condition" ? "conditionFluff" : "diseaseFluff"
		});
	}
};

Renderer.background = {
	getCompactRenderedString (bg) {
		return `
		${Renderer.utils.getExcludedTr(bg, "background")}
		${Renderer.utils.getNameTr(bg, {page: UrlUtil.PG_BACKGROUNDS})}
		<tr class="text"><td colspan="6">
		${Renderer.get().render({type: "entries", entries: bg.entries})}
		</td></tr>
		`;
	},

	getSkillSummary (skillProfsArr, short, collectIn) {
		return Renderer.background._summariseProfs(skillProfsArr, short, collectIn, `skill`);
	},

	getToolSummary (toolProfsArray, short, collectIn) {
		return Renderer.background._summariseProfs(toolProfsArray, short, collectIn);
	},

	getLanguageSummary (toolProfsArray, short, collectIn) {
		return Renderer.background._summariseProfs(toolProfsArray, short, collectIn);
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
			fluffProp: "backgroundFluff"
		});
	}
};

Renderer.optionalfeature = {
	getListPrerequisiteLevelText (prerequisites) {
		if (!prerequisites || !prerequisites.some(it => it.level)) return "\u2014";
		const levelPart = prerequisites.find(it => it.level).level;
		return levelPart.level || levelPart;
	},

	getPreviouslyPrintedText (it) {
		return it.previousVersion ? `<tr><td colspan="6"><p>${Renderer.get().render(`{@i An earlier version of this ${Parser.optFeatureTypeToFull(it.featureType)} is available in }${Parser.sourceJsonToFull(it.previousVersion.source)} {@i as {@optfeature ${it.previousVersion.name}|${it.previousVersion.source}}.}`)}</p></td></tr>` : ""
	},

	getCompactRenderedString (it) {
		const renderer = Renderer.get();
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getExcludedTr(it, "optionalfeature")}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_OPT_FEATURES})}
			<tr class="text"><td colspan="6">
			${it.prerequisite ? `<p><i>${Renderer.utils.getPrerequisiteText(it.prerequisite)}</i></p>` : ""}
		`);
		renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 1});
		renderStack.push(`</td></tr>`);
		renderStack.push(Renderer.optionalfeature.getPreviouslyPrintedText(it));

		return renderStack.join("");
	}
};

Renderer.reward = {
	getRenderedString: (reward) => {
		const renderer = Renderer.get();
		const renderStack = [];
		renderer.recursiveRender({entries: reward.entries}, renderStack, {depth: 1});
		return `<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>`;
	},

	getCompactRenderedString (reward) {
		return `
			${Renderer.utils.getExcludedTr(reward, "reward")}
			${Renderer.utils.getNameTr(reward, {page: UrlUtil.PG_REWARDS})}
			${Renderer.reward.getRenderedString(reward)}
		`;
	}
};

Renderer.race = {
	getCompactRenderedString (race) {
		const renderer = Renderer.get();
		const renderStack = [];

		const ability = Renderer.getAbilityData(race.ability);
		renderStack.push(`
			${Renderer.utils.getExcludedTr(race, "race")}
			${Renderer.utils.getNameTr(race, {page: UrlUtil.PG_RACES})}
			${!race._isBaseRace ? `
			<tr><td colspan="6">
				<table class="summary striped-even">
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
	 * @param [opts.isAddBaseRaces] If an entity should be created for each base race.
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
						const idName = Renderer.race._getSubraceName(r.name, sr.name);
						return `{@race ${idName}|${sr.source}${count > 1 ? `|${idName} (<span title="${Parser.sourceJsonToFull(sr.source).escapeQuotes()}">${Parser.sourceJsonToAbv(sr.source)}</span>)` : ""}}`;
					})
				};

				baseRace._baseRaceEntries = [
					"This race has multiple subraces, as listed below:",
					lst
				];

				delete baseRace.subraces;

				out.push(baseRace);
			}

			out.push(...Renderer.race._mergeSubrace(r));
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

	_mergeSubrace (race) {
		if (race.subraces) {
			const srCopy = JSON.parse(JSON.stringify(race.subraces));
			const out = [];

			srCopy
				.forEach(s => {
					const cpy = JSON.parse(JSON.stringify(race));
					cpy._baseName = cpy.name;
					cpy._baseSource = cpy.source;
					delete cpy.subraces;
					delete cpy.srd;

					// merge names, abilities, entries, tags
					if (s.name) {
						cpy._subraceName = s.name;

						if (s.alias) {
							cpy.alias = s.alias.map(it => Renderer.race._getSubraceName(cpy.name, it));
							delete s.alias;
						}

						cpy.name = Renderer.race._getSubraceName(cpy.name, s.name);
						delete s.name;
					}
					if (s.ability) {
						// If the base race doesn't have any ability scores, make a set of empty records
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

					out.push(cpy);
				});
			return out;
		} else {
			return [race];
		}
	},

	adoptSubraces (allRaces, subraces) {
		const nxtData = [];

		subraces.forEach(sr => {
			if (!sr.race || !sr.race.name || !sr.race.source) throw new Error(`Subrace was missing parent race!`);

			const _baseRace = allRaces.find(r => r.name === sr.race.name && r.source === sr.race.source);
			if (!_baseRace) throw new Error(`Could not find parent race for subrace!`);

			const subraceListEntry = _baseRace._baseRaceEntries.find(it => it.type === "list");
			subraceListEntry.items.push(`{@race ${_baseRace._rawName || _baseRace.name} (${sr.name})|${sr.source || _baseRace.source}}`);

			// Attempt to graft multiple subraces from the same data set onto the same base race copy
			let baseRace = nxtData.find(r => r.name === sr.race.name && r.source === sr.race.source);
			if (!baseRace) {
				// copy and remove base-race-specific data
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
			pFnPostProcess: Renderer.race.pPostProcessFluff.bind(null, race)
		});
	}
};

Renderer.deity = {
	_basePartTranslators: {
		"Alignment": {
			prop: "alignment",
			displayFn: (it) => it.map(a => Parser.alignmentAbvToFull(a)).join(" ")
		},
		"Pantheon": {
			prop: "pantheon"
		},
		"Category": {
			prop: "category"
		},
		"Domains": {
			prop: "domains",
			displayFn: (it) => it.join(", ")
		},
		"Province": {
			prop: "province"
		},
		"Alternate Names": {
			prop: "altNames",
			displayFn: (it) => it.join(", ")
		},
		"Symbol": {
			prop: "symbol"
		}
	},
	getOrderedParts (deity, prefix, suffix) {
		const parts = {};
		Object.entries(Renderer.deity._basePartTranslators).forEach(([k, v]) => {
			const val = deity[v.prop];
			if (val != null) {
				const outVal = v.displayFn ? v.displayFn(val) : val;
				parts[k] = outVal;
			}
		});
		if (deity.customProperties) Object.entries(deity.customProperties).forEach(([k, v]) => parts[k] = v);
		const allKeys = Object.keys(parts).sort(SortUtil.ascSortLower);
		return allKeys.map(k => `${prefix}<b>${k}: </b>${Renderer.get().render(parts[k])}${suffix}`).join("");
	},

	getCompactRenderedString (deity) {
		const renderer = Renderer.get();
		return `
			${Renderer.utils.getExcludedTr(deity, "deity")}
			${Renderer.utils.getNameTr(deity, {suffix: deity.title ? `, ${deity.title.toTitleCase()}` : "", page: UrlUtil.PG_DEITIES})}
			<tr><td colspan="6">
				<div class="rd__compact-stat">${Renderer.deity.getOrderedParts(deity, `<p>`, `</p>`)}</div>
			</td>
			${deity.entries ? `<tr><td colspan="6"><div class="border"></div></td></tr><tr><td colspan="6">${renderer.render({entries: deity.entries}, 1)}</td></tr>` : ""}
		`;
	}
};

Renderer.object = {
	getCompactRenderedString (obj) {
		const renderer = Renderer.get();
		const row2Width = 12 / ((!!obj.resist + !!obj.vulnerable + !!obj.conditionImmune) || 1);
		return `
			${Renderer.utils.getExcludedTr(obj, "object")}
			${Renderer.utils.getNameTr(obj, {page: UrlUtil.PG_OBJECTS})}
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th colspan="2" class="text-center">Type</th>
						<th colspan="2" class="text-center">AC</th>
						<th colspan="2" class="text-center">HP</th>
						<th colspan="2" class="text-center">Speed</th>
						<th colspan="4" class="text-center">Damage Imm.</th>
					</tr>
					<tr>
						<td colspan="2" class="text-center">${Parser.sizeAbvToFull(obj.size)} ${obj.creatureType ? Parser.monTypeToFullObj(obj.creatureType).asText : "object"}</td>
						<td colspan="2" class="text-center">${obj.ac != null ? obj.ac : "\u2014"}</td>
						<td colspan="2" class="text-center">${obj.hp}</td>
						<td colspan="2" class="text-center">${Parser.getSpeedString(obj)}</td>
						<td colspan="4" class="text-center">${Parser.monImmResToFull(obj.immune)}</td>
					</tr>
					${Parser.ABIL_ABVS.some(ab => obj[ab] != null) ? `
					<tr>${Parser.ABIL_ABVS.map(it => `<td colspan="2" class="text-center">${it.toUpperCase()}</td>`).join("")}</tr>
					<tr>${Parser.ABIL_ABVS.map(it => `<td colspan="2" class="text-center">${Renderer.utils.getAbilityRoller(obj, it)}</td>`).join("")}</tr>
					` : ""}
					${obj.resist || obj.vulnerable || obj.conditionImmune ? `
					<tr>
						${obj.resist ? `<th colspan="${row2Width}" class="text-center">Damage Res.</th>` : ""}
						${obj.vulnerable ? `<th colspan="${row2Width}" class="text-center">Damage Vuln.</th>` : ""}
						${obj.conditionImmune ? `<th colspan="${row2Width}" class="text-center">Condition Imm.</th>` : ""}
					</tr>
					<tr>
						${obj.resist ? `<td colspan="${row2Width}" class="text-center">${Parser.monImmResToFull(obj.resist)}</td>` : ""}
						${obj.vulnerable ? `<td colspan="${row2Width}" class="text-center">${Parser.monImmResToFull(obj.vulnerable)}</td>` : ""}
						${obj.conditionImmune ? `<td colspan="${row2Width}" class="text-center">${Parser.monCondImmToFull(obj.conditionImmune)}</td>` : ""}
					</tr>
					` : ""}
				</table>
			</td></tr>
			<tr class="text"><td colspan="6">
			${obj.entries ? renderer.render({entries: obj.entries}, 2) : ""}
			${obj.actionEntries ? renderer.render({entries: obj.actionEntries}, 2) : ""}
			</td></tr>
		`;
	}
};

Renderer.traphazard = {
	getSubtitle (it) {
		const type = it.trapHazType || "HAZ";
		switch (type) {
			case "GEN":
				return null;
			case "SMPL":
			case "CMPX":
				return `${Parser.trapHazTypeToFull(type)} (${Parser.tierToFullLevel(it.tier)}, ${Parser.threatToFull(it.threat)} threat)`;
			default:
				return Parser.trapHazTypeToFull(type);
		}
	},

	getSimplePart (renderer, it) {
		if (it.trapHazType === "SMPL") {
			return renderer.render({
				entries: [
					{
						type: "entries",
						name: "Trigger",
						entries: it.trigger
					},
					{
						type: "entries",
						name: "Effect",
						entries: it.effect
					},
					{
						type: "entries",
						name: "Countermeasures",
						entries: it.countermeasures
					}
				]
			}, 1);
		}
		return "";
	},

	getComplexPart (renderer, it) {
		if (it.trapHazType === "CMPX") {
			return renderer.render({
				entries: [
					{
						type: "entries",
						name: "Trigger",
						entries: it.trigger
					},
					{
						type: "entries",
						name: "Initiative",
						entries: [`The trap acts on ${Parser.trapInitToFull(it.initiative)}${it.initiativeNote ? ` (${it.initiativeNote})` : ""}.`]
					},
					it.eActive ? {
						type: "entries",
						name: "Active Elements",
						entries: it.eActive
					} : null,
					it.eDynamic ? {
						type: "entries",
						name: "Dynamic Elements",
						entries: it.eDynamic
					} : null,
					it.eConstant ? {
						type: "entries",
						name: "Constant Elements",
						entries: it.eConstant
					} : null,
					{
						type: "entries",
						name: "Countermeasures",
						entries: it.countermeasures
					}
				].filter(it => it)
			}, 1);
		}
		return "";
	},

	getCompactRenderedString (it) {
		const renderer = Renderer.get();
		const subtitle = Renderer.traphazard.getSubtitle(it);
		return `
			${Renderer.utils.getExcludedTr(it, it.__prop)}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TRAPS_HAZARDS})}
			${subtitle ? `<tr class="text"><td colspan="6"><i>${subtitle}</i>${Renderer.traphazard.getSimplePart(renderer, it)}${Renderer.traphazard.getComplexPart(renderer, it)}</td>` : ""}
			<tr class="text"><td colspan="6">${renderer.render({entries: it.entries}, 2)}</td></tr>
		`;
	},

	_trapTypes: new Set(["MECH", "MAG", "SMPL", "CMPX"]),
	isTrap (trapHazType) {
		return Renderer.traphazard._trapTypes.has(trapHazType);
	}
};

Renderer.cultboon = {
	doRenderCultParts (it, renderer, renderStack) {
		if (it.goal || it.cultists || it.signaturespells) {
			const fauxList = {
				type: "list",
				style: "list-hang-notitle",
				items: []
			};
			if (it.goal) {
				fauxList.items.push({
					type: "item",
					name: "Goals:",
					entry: it.goal.entry
				});
			}

			if (it.cultists) {
				fauxList.items.push({
					type: "item",
					name: "Typical Cultists:",
					entry: it.cultists.entry
				});
			}
			if (it.signaturespells) {
				fauxList.items.push({
					type: "item",
					name: "Signature Spells:",
					entry: it.signaturespells.entry
				});
			}
			renderer.recursiveRender(fauxList, renderStack, {depth: 2});
		}
	},

	doRenderBoonParts (it, renderer, renderStack) {
		const benefits = {type: "list", style: "list-hang-notitle", items: []};
		if (it.ability) {
			benefits.items.push({
				type: "item",
				name: "Ability Score Adjustment:",
				entry: it.ability ? it.ability.entry : "None"
			});
		}
		if (it.signaturespells) {
			benefits.items.push({
				type: "item",
				name: "Signature Spells:",
				entry: it.signaturespells ? it.signaturespells.entry : "None"
			});
		}
		if (benefits.items.length) renderer.recursiveRender(benefits, renderStack, {depth: 1});
	},

	getCompactRenderedString (it) {
		const renderer = Renderer.get();

		const renderStack = [];
		if (it.__prop === "cult") {
			Renderer.cultboon.doRenderCultParts(it, renderer, renderStack);
			renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 2});
			return `
			${Renderer.utils.getExcludedTr(it, "cult")}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_CULTS_BOONS})}
			<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
			<tr class="text"><td colspan="6" class="text">${renderStack.join("")}</td></tr>`;
		} else if (it.__prop === "boon") {
			Renderer.cultboon.doRenderBoonParts(it, renderer, renderStack);
			renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 1});
			it._displayName = it._displayName || it.name;
			return `
			${Renderer.utils.getExcludedTr(it, "boon")}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_CULTS_BOONS})}
			<tr class="text"><td colspan="6">${renderStack.join("")}</td></tr>`;
		}
	}
};

Renderer.monster = {
	getLegendaryActionIntro (mon, renderer = Renderer.get()) {
		function getCleanName () {
			if (mon.shortName === true) return mon.name;
			else if (mon.shortName) return mon.shortName;
			const base = mon.name.split(",")[0];
			const cleanDragons = base
				.replace(/(?:adult|ancient|young) \w+ (dragon|dracolich)/gi, "$1");
			return mon.isNamedCreature ? cleanDragons.split(" ")[0] : cleanDragons.toLowerCase();
		}

		if (mon.legendaryHeader) {
			return renderer.render({entries: mon.legendaryHeader});
		} else {
			const legendaryActions = mon.legendaryActions || 3;
			const legendaryName = getCleanName();
			return `${mon.isNamedCreature ? "" : "The "}${legendaryName} can take ${legendaryActions} legendary action${legendaryActions > 1 ? "s" : ""}, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. ${mon.isNamedCreature ? "" : "The "}${legendaryName} regains spent legendary actions at the start of its turn.`
		}
	},

	getMythicActionIntro (mon, renderer = Renderer.get()) {
		if (mon.mythicHeader) return renderer.render({entries: mon.mythicHeader});
		return "";
	},

	getSave (renderer, attr, mod) {
		if (attr === "special") return renderer.render(mod);
		else return renderer.render(`<span data-mon-save="${attr.uppercaseFirst()}|${mod}">${attr.uppercaseFirst()} {@d20 ${mod}|${mod}|${Parser.attAbvToFull([attr])} save}</span>`);
	},

	getDragonCasterVariant (renderer, dragon) {
		// if the dragon already has a spellcasting trait specified, don't add a note about adding a spellcasting trait
		if (!dragon.dragonCastingColor || dragon.spellcasting) return null;

		function getExampleSpells (maxSpellLevel, color) {
			const LVL_TO_COLOR_TO_SPELLS = {
				2: {
					B: ["darkness", "Melf's acid arrow", "fog cloud", "scorching ray"],
					G: ["ray of sickness", "charm person", "detect thoughts", "invisibility", "suggestion"],
					W: ["ice knife|XGE", "Snilloc's snowball swarm|XGE"],
					A: ["see invisibility", "magic mouth", "blindness/deafness", "sleep", "detect thoughts"],
					Z: ["gust of wind", "misty step", "locate object", "blur", "witch bolt", "thunderwave", "shield"],
					C: ["knock", "sleep", "detect thoughts", "blindness/deafness", "tasha's hideous laughter"]
				},
				3: {
					U: ["wall of sand|XGE", "thunder step|XGE", "lightning bolt", "blink", "magic missile", "slow"],
					R: ["fireball", "scorching ray", "haste", "erupting earth|XGE", "Aganazzar's scorcher|XGE"],
					O: ["slow", "slow", "fireball", "dispel magic", "counterspell", "Aganazzar's scorcher|XGE", "shield"],
					S: ["sleet storm", "protection from energy", "catnap|XGE", "locate object", "identify", "Leomund's tiny hut"]
				},
				4: {
					B: ["vitriolic sphere|XGE", "sickening radiance|XGE", "Evard's black tentacles", "blight", "hunger of Hadar"],
					W: ["fire shield", "ice storm", "sleet storm"],
					A: ["charm monster|XGE", "sending", "wall of sand|XGE", "hypnotic pattern", "tongues"],
					C: ["polymorph", "greater invisibility", "confusion", "stinking cloud", "major image", "charm monster|XGE"]
				},
				5: {
					U: ["telekinesis", "hold monster", "dimension door", "wall of stone", "wall of force"],
					G: ["cloudkill", "charm monster|XGE", "modify memory", "mislead", "hallucinatory terrain", "dimension door"],
					Z: ["steel wind strike|XGE", "control weather", "control winds|XGE", "watery sphere|XGE", "storm sphere|XGE", "tidal wave|XGE"],
					O: ["hold monster", "immolation|XGE", "wall of fire", "greater invisibility", "dimension door"],
					S: ["cone of cold", "ice storm", "teleportation circle", "skill empowerment|XGE", "creation", "Mordenkainen's private sanctum"]
				},
				6: {
					W: ["cone of cold", "wall of ice"],
					A: ["scrying", "Rary's telepathic bond", "Otto's irresistible dance", "legend lore", "hold monster", "dream"]
				},
				7: {
					B: ["power word pain|XGE", "finger of death", "disintegrate", "hold monster"],
					U: ["chain lightning", "forcecage", "teleport", "etherealness"],
					G: ["project image", "mirage arcane", "prismatic spray", "teleport"],
					Z: ["whirlwind|XGE", "chain lightning", "scatter|XGE", "teleport", "disintegrate", "lightning bolt"],
					C: ["symbol", "simulacrum", "reverse gravity", "project image", "Bigby's hand", "mental prison|XGE", "seeming"],
					S: ["Otiluke's freezing sphere", "prismatic spray", "wall of ice", "contingency", "arcane gate"]
				},
				8: {
					O: ["sunburst", "delayed blast fireball", "antimagic field", "teleport", "globe of invulnerability", "maze"]
				}
			};

			return (LVL_TO_COLOR_TO_SPELLS[maxSpellLevel] || {})[color];
		}

		const chaMod = Parser.getAbilityModNumber(dragon.cha);
		const pb = Parser.crToPb(dragon.cr);
		const maxSpellLevel = Math.floor(Parser.crToNumber(dragon.cr) / 3);
		const exampleSpells = getExampleSpells(maxSpellLevel, dragon.dragonCastingColor);
		const levelString = maxSpellLevel === 0 ? `${chaMod === 1 ? "This" : "These"} spells are Cantrips.` : `${chaMod === 1 ? "The" : "Each"} spell's level can be no higher than ${Parser.spLevelToFull(maxSpellLevel)}.`;
		const v = {
			type: "variant",
			name: "Dragons as Innate Spellcasters",
			entries: [
				"Dragons are innately magical creatures that can master a few spells as they age, using this variant.",
				`A young or older dragon can innately cast a number of spells equal to its Charisma modifier. Each spell can be cast once per day, requiring no material components, and the spell's level can be no higher than one-third the dragon's challenge rating (rounded down). The dragon's bonus to hit with spell attacks is equal to its proficiency bonus + its Charisma bonus. The dragon's spell save DC equals 8 + its proficiency bonus + its Charisma modifier.`,
				`{@i This dragon can innately cast ${Parser.numberToText(chaMod)} spell${chaMod === 1 ? "" : "s"}, once per day${chaMod === 1 ? "" : " each"}, requiring no material components. ${levelString} The dragon's spell save DC is ${pb + chaMod + 8}, and it has {@hit ${pb + chaMod}} to hit with spell attacks. See the {@filter spell page|spells|level=${[...new Array(maxSpellLevel + 1)].map((it, i) => i).join(";")}} for a list of spells the dragon is capable of casting.${exampleSpells ? ` A selection of examples are shown below:` : ""}`
			]
		};
		if (exampleSpells) {
			const ls = {
				type: "list",
				style: "italic",
				items: exampleSpells.map(it => `{@spell ${it}}`)
			};
			v.entries.push(ls);
		}
		return renderer.render(v);
	},

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
			labels: Parser.CRS
		};
		$sld.slider({
			min: 0,
			max: Parser.CRS.length - 1,
			value: curr
		}).slider("pips", subOpts).slider("float", subOpts);

		$sld.slider().on("slidechange", () => {
			const ix = $sld.slider("value");
			cbRender(Parser.crToNumber(Parser.CRS[ix]));
			$body.off(evtName);
			cleanSliders();
		});

		$btnScaleCr.after($wrp);
	},

	getCompactRenderedStringSection (mon, renderer, title, key, depth) {
		if (!mon[key]) return "";

		const noteKey = `${key}Note`;

		const toRender = key === "lairActions" || key === "regionalEffects"
			? [{type: "entries", entries: mon[key]}]
			: mon[key];

		return `<tr class="mon__stat-header-underline"><td colspan="6"><span class="mon__sect-header-inner">${title}${mon[noteKey] ? ` (<span class="ve-small">${mon[noteKey]}</span>)` : ""}</span></td></tr>
		<tr class="text compact"><td colspan="6">
		${key === "legendary" && mon.legendary ? `<p>${Renderer.monster.getLegendaryActionIntro(mon)}</p>` : ""}
		${key === "mythic" && mon.mythic ? `<p>${Renderer.monster.getMythicActionIntro(mon)}</p>` : ""}
		${toRender.map(it => it.rendered || renderer.render(it, depth)).join("")}
		</td></tr>`;
	},

	getTypeAlignmentPart (mon) { return `${mon.level ? `${Parser.getOrdinalForm(mon.level)}-level ` : ""}${Parser.sizeAbvToFull(mon.size)}${mon.sizeNote ? ` ${mon.sizeNote}` : ""} ${Parser.monTypeToFullObj(mon.type).asText}${mon.alignment ? `, ${Parser.alignmentListToFull(mon.alignment)}` : ""}`; },
	getSavesPart (mon) { return `${Object.keys(mon.save).sort(SortUtil.ascSortAtts).map(s => Renderer.monster.getSave(Renderer.get(), s, mon.save[s])).join(", ")}` },
	getSensesPart (mon) { return `${mon.senses ? `${Renderer.monster.getRenderedSenses(mon.senses)}, ` : ""}passive Perception ${mon.passive || "\u2014"}`; },

	getCompactRenderedString (mon, renderer, options = {}) {
		if (options.isCompact === undefined) options.isCompact = true;

		renderer = renderer || Renderer.get();

		const renderStack = [];
		const isCrHidden = Parser.crToNumber(mon.cr) === 100;
		const legGroup = DataUtil.monster.getMetaGroup(mon);
		const hasToken = mon.tokenUrl || mon.hasToken;
		const extraThClasses = !options.isCompact && hasToken ? ["mon__name--token"] : null;

		renderStack.push(`
			${Renderer.utils.getExcludedTr(mon, "monster")}
			${Renderer.utils.getNameTr(mon, {page: UrlUtil.PG_BESTIARY, extensionData: mon._isScaledCr, extraThClasses})}
			<tr><td colspan="6"><i>${Renderer.monster.getTypeAlignmentPart(mon)}</i></td></tr>
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
						<td>${Renderer.monster.getRenderedHp(mon.hp)}</td>
						<td>${Parser.getSpeedString(mon)}</td>
						${isCrHidden ? "" : `
						<td>
							${Parser.monCrToFull(mon.cr)}
							${options.showScaler && Parser.isValidCr(mon.cr ? (mon.cr.cr || mon.cr) : null) ? `
							<button title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr btn btn-xs btn-default">
								<span class="glyphicon glyphicon-signal"></span>
							</button>
							` : ""}
							${options.isScaled ? `
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
				<table class="summary striped-even">
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
					${mon.save ? `<p><b>Saving Throws</b> ${Renderer.monster.getSavesPart(mon)}</p>` : ""}
					${mon.skill ? `<p><b>Skills</b> ${Renderer.monster.getSkillsString(renderer, mon)}</p>` : ""}
					${mon.vulnerable ? `<p><b>Damage Vuln.</b> ${Parser.monImmResToFull(mon.vulnerable)}</p>` : ""}
					${mon.resist ? `<p><b>Damage Res.</b> ${Parser.monImmResToFull(mon.resist)}</p>` : ""}
					${mon.immune ? `<p><b>Damage Imm.</b> ${Parser.monImmResToFull(mon.immune)}</p>` : ""}
					${mon.conditionImmune ? `<p><b>Condition Imm.</b> ${Parser.monCondImmToFull(mon.conditionImmune)}</p>` : ""}
					${options.isHideSenses ? "" : `<p><b>Senses</b> ${Renderer.monster.getSensesPart(mon)}</p>`}
					${options.isHideLanguages ? "" : `<p><b>Languages</b> ${Renderer.monster.getRenderedLanguages(mon.languages)}</p>`}
				</div>
			</td></tr>
			${mon.trait || mon.spellcasting ? `<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr class="text compact"><td colspan="6">
			${Renderer.monster.getOrderedTraits(mon, renderer).map(it => it.rendered || renderer.render(it, 2)).join("")}
			</td></tr>` : ""}
			${Renderer.monster.getCompactRenderedStringSection(mon, renderer, "Actions", "action", 2)}
			${Renderer.monster.getCompactRenderedStringSection(mon, renderer, "Reactions", "reaction", 2)}
			${Renderer.monster.getCompactRenderedStringSection(mon, renderer, "Legendary Actions", "legendary", 2)}
			${Renderer.monster.getCompactRenderedStringSection(mon, renderer, "Mythic Actions", "mythic", 2)}
			${legGroup && legGroup.lairActions ? Renderer.monster.getCompactRenderedStringSection(legGroup, renderer, "Lair Actions", "lairActions", 1) : ""}
			${legGroup && legGroup.regionalEffects ? Renderer.monster.getCompactRenderedStringSection(legGroup, renderer, "Regional Effects", "regionalEffects", 1) : ""}
			${mon.variant || (mon.dragonCastingColor && !mon.spellcasting) ? `
			<tr class="text compact"><td colspan="6">
			${mon.variant ? mon.variant.map(it => it.rendered || renderer.render(it)).join("") : ""}
			${mon.dragonCastingColor ? Renderer.monster.getDragonCasterVariant(renderer, mon) : ""}
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
			const spellTraits = Renderer.monster.getSpellcastingRenderedTraits(mon, renderer);
			// weave spellcasting in with other traits
			trait = trait ? trait.concat(spellTraits) : spellTraits;
		}
		if (trait) return trait.sort((a, b) => SortUtil.monTraitSort(a, b));
	},

	getSkillsString (renderer, mon) {
		function makeSkillRoller (name, mod) {
			return Renderer.get().render(`{@d20 ${mod}|${mod}|${name}`);
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
		return mon.tokenUrl || UrlUtil.link(`${Renderer.get().baseUrl}img/${Parser.sourceJsonToAbv(mon.source)}/${Parser.nameToTokenName(mon.name)}.png`);
	},

	postProcessFluff (mon, fluff) {
		const cpy = MiscUtil.copy(fluff);

		// TODO is this good enough? Should additionally check for lair blocks which are not the last, and tag them with
		//   "data": {"lairRegionals": true}, and insert the lair/regional text there if available (do the current "append" otherwise)
		const thisGroup = DataUtil.monster.getMetaGroup(mon);
		const handleGroupProp = (prop, name) => {
			if (thisGroup && thisGroup[prop]) {
				cpy.entries = cpy.entries || [];
				cpy.entries.push({
					type: "entries",
					entries: [
						{
							type: "entries",
							name,
							entries: MiscUtil.copy(thisGroup[prop])
						}
					]
				});
			}
		};

		handleGroupProp("lairActions", "Lair Actions");
		handleGroupProp("regionalEffects", "Regional Effects");

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
	},

	updateParsed (mon) {
		delete mon._pTypes;
		delete mon._pCr;
		Renderer.monster.initParsed(mon);
	},

	pGetFluff (mon) {
		return Renderer.utils.pGetFluff({
			entity: mon,
			pFnPostProcess: Renderer.monster.postProcessFluff.bind(null, mon),
			fluffBaseUrl: `data/bestiary/`,
			fluffProp: "monsterFluff"
		});
	}
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
								case "prop_name": return fullProp.name;
								case "item": {
									const path = spl.slice(1);
									if (!path.length) return `{@i missing key path}`;
									return MiscUtil.get(item, ...path) || "";
								}
								default: return `{@i unknown template root: "${spl[0]}"}`;
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
				item.vehHp ? `HP ${item.vehHp}${item.vehDmgThresh ? `, Damage Threshold ${item.vehDmgThresh}` : ""}` : null
			].filter(Boolean).join(", ");

			damageParts.push([
				vehPartUpper,
				vehPartMiddle,

				// region ~~Dammit Mercer~~ Additional fields present in EGW
				travelCostFull ? `Personal Travel Cost: ${travelCostFull} per mile per passenger` : null,
				shippingCostFull ? `Shipping Cost: ${shippingCostFull} per 100 pounds per mile` : null,
				// endregion

				vehPartLower
			].filter(Boolean).join("<br>"));
		}

		const damage = damageParts.join(", ");
		const damageType = item.dmgType ? Parser.dmgTypeToFull(item.dmgType) : "";
		const propertiesTxt = Renderer.item._getPropertiesText(item);

		return [damage, damageType, propertiesTxt];
	},

	getTypeRarityAndAttunementText (item) {
		const typeRarity = [
			item._typeHtml === "Other" ? "" : item._typeHtml,
			[item.tier ? `${item.tier} tier` : "", (item.rarity && Renderer.item.doRenderRarity(item.rarity) ? item.rarity : "")].map(it => (it || "").trim()).filter(it => it).join(", ")
		].filter(Boolean).join(", ");
		return item.reqAttune ? `${typeRarity} ${item._attunement}` : typeRarity
	},

	getAttunementAndAttunementCatText (item) {
		let attunement = null;
		let attunementCat = "No";
		if (item.reqAttune != null && item.reqAttune !== false) {
			if (item.reqAttune === true) {
				attunementCat = "Yes";
				attunement = "(requires attunement)"
			} else if (item.reqAttune === "optional") {
				attunementCat = "Optional";
				attunement = "(attunement optional)"
			} else if (item.reqAttune.toLowerCase().startsWith("by")) {
				attunementCat = "By...";
				attunement = `(requires attunement ${item.reqAttune})`;
			} else {
				attunementCat = "Yes"; // throw any weird ones in the "Yes" category (e.g. "outdoors at night")
				attunement = `(requires attunement ${item.reqAttune})`;
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
			typeListHtml.push(`${item.weaponCategory} weapon${item.baseItem ? ` (${Renderer.get().render(`{@item ${item.baseItem}`)})` : ""}`);
			typeListText.push(`${item.weaponCategory} weapon`);
			showingBase = true;
		}
		if (item.staff && item.type !== "M") { // DMG p140: "Unless a staff's description says otherwise, a staff can be used as a quarterstaff."
			typeListHtml.push("melee weapon");
			typeListText.push("melee weapon");
		}
		if (item.type) {
			const abv = Parser.itemTypeToFull(item.type);
			if (!showingBase && !!item.baseItem) typeListHtml.push(`${abv} (${Renderer.get().render(`{@item ${item.baseItem}`)})`);
			else typeListHtml.push(abv);
			typeListText.push(abv);
		}
		if (item.poison) {
			typeListHtml.push("poison");
			typeListText.push("poison");
		}
		return [typeListText, typeListHtml.join(", ")];
	},

	getRenderedEntries (item, isCompact) {
		const renderer = Renderer.get();

		const handlers = {
			string: (ident, str) => {
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
						default: stack.push(c); break;
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
			}
		};

		const walkerKeyBlacklist = new Set(["caption", "type", "colLabels", "dataCreature", "dataSpell", "dataItem", "dataObject", "dataTrapHazard", "name"]);

		const renderStack = [];
		if (item._fullEntries || (item.entries && item.entries.length)) {
			const entryList = MiscUtil.copy({type: "entries", entries: item._fullEntries || item.entries});
			const procEntryList = MiscUtil.getWalker({keyBlacklist: walkerKeyBlacklist}).walk("italiciseName", entryList, handlers);
			renderer.recursiveRender(procEntryList, renderStack, {depth: 1});
		}

		if (item._fullAdditionalEntries || item.additionalEntries) {
			const additionEntriesList = MiscUtil.copy({type: "entries", entries: item._fullAdditionalEntries || item.additionalEntries});
			const procAdditionEntriesList = MiscUtil.getWalker({keyBlacklist: walkerKeyBlacklist}).walk("italiciseName", additionEntriesList, handlers);
			renderer.recursiveRender(procAdditionEntriesList, renderStack, {depth: 1});
		}

		if (!isCompact && item.lootTables) {
			renderStack.push(`<div><span class="bold">Found On: </span>${item.lootTables.sort(SortUtil.ascSortLower).map(tbl => renderer.render(`{@table ${tbl}}`)).join(", ")}</div>`);
		}

		return renderStack.join("").trim();
	},

	getCompactRenderedString (item) {
		const [damage, damageType, propertiesTxt] = Renderer.item.getDamageAndPropertiesText(item);
		const hasEntries = (item._fullEntries && item._fullEntries.length) || (item.entries && item.entries.length);

		return `
		${Renderer.utils.getExcludedTr(item, "item")}
		${Renderer.utils.getNameTr(item, {page: UrlUtil.PG_ITEMS})}
		<tr><td class="rd-item__type-rarity-attunement" colspan="6">${Renderer.item.getTypeRarityAndAttunementText(item).uppercaseFirst()}</td></tr>
		<tr>
			<td colspan="2">${[Parser.itemValueToFullMultiCurrency(item), Parser.itemWeightToFull(item)].filter(Boolean).join(", ").uppercaseFirst()}</td>
			<td class="text-right" colspan="4">${damage} ${damageType} ${propertiesTxt}</td>
		</tr>
		${hasEntries ? `${Renderer.utils.getDividerTr()}<tr class="text"><td colspan="6" class="text">${Renderer.item.getRenderedEntries(item, true)}</td></tr>` : ""}`;
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
			template: p.template
		};
	},
	_addType (t) {
		if (Renderer.item.typeMap[t.abbreviation]) return;
		Renderer.item.typeMap[t.abbreviation] = t.name ? MiscUtil.copy(t) : {
			name: t.entries[0].name.toLowerCase(),
			entries: t.entries
		};
	},
	_addAdditionalEntries (e) {
		if (Renderer.item._additionalEntriesMap[e.appliesTo]) return;
		Renderer.item._additionalEntriesMap[e.appliesTo] = MiscUtil.copy(e.entries);
	},
	_pAddBrewPropertiesAndTypes () {
		return new Promise(resolve => {
			BrewUtil.pAddBrewData()
				.then((brew) => {
					(brew.itemProperty || []).forEach(p => Renderer.item._addProperty(p));
					(brew.itemType || []).forEach(t => Renderer.item._addType(t));
					resolve();
				});
		});
	},
	_addBasePropertiesAndTypes (baseItemData) {
		// Convert the property and type list JSONs into look-ups, i.e. use the abbreviation as a JSON property name
		baseItemData.itemProperty.forEach(p => Renderer.item._addProperty(p));
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
			unlock
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
		opts.isAddGroups = !!opts.isAddGroups;
		opts.urls = opts.urls || {};

		const kBlacklist = opts.isBlacklistVariants ? "withBlacklist" : "withoutBlacklist";
		if (Renderer.item._builtLists[kBlacklist]) {
			const cached = opts.isAddGroups ? Renderer.item._builtLists[kBlacklist] : Renderer.item._builtLists[kBlacklist].filter(it => !it._isItemGroup);

			Renderer.item._unlockBuildList();
			if (opts.fnCallback) return opts.fnCallback(cached);
			return cached;
		}

		// allows URLs to be overridden (used by roll20 script)
		const itemUrl = opts.urls.items || `${Renderer.get().baseUrl}data/items.json`;
		const baseItemUrl = opts.urls.baseitems || `${Renderer.get().baseUrl}data/items-base.json`;
		const magicVariantUrl = opts.urls.magicvariants || `${Renderer.get().baseUrl}data/magicvariants.json`;

		const itemList = await pLoadItems();
		const baseItems = await Renderer.item._pGetAndProcBaseItems(await DataUtil.loadJSON(baseItemUrl));
		const [genericVariants, linkedLootTables] = Renderer.item._getAndProcGenericVariants(await DataUtil.loadJSON(magicVariantUrl), true);
		const genericAndSpecificVariants = Renderer.item._createSpecificVariants(baseItems, genericVariants, linkedLootTables);
		const allItems = itemList.concat(baseItems).concat(genericAndSpecificVariants);
		Renderer.item._enhanceItems(allItems);
		Renderer.item._builtLists[kBlacklist] = allItems;

		Renderer.item._unlockBuildList();
		if (opts.fnCallback) return opts.fnCallback(allItems);
		return allItems;

		async function pLoadItems () {
			const itemData = await DataUtil.loadJSON(itemUrl);
			const items = itemData.item;
			itemData.itemGroup.forEach(it => it._isItemGroup = true);
			return [...items, ...itemData.itemGroup];
		}
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
				variantData.linkedLootTables
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

	_createSpecificVariants (baseItems, genericVariants, linkedLootTables) {
		function hasRequiredProperty (baseItem, genericVariant) {
			return genericVariant.requires.some(req => Object.entries(req).every(([k, v]) => baseItem[k] === v));
		}

		function hasExcludedProperty (baseItem, genericVariant) {
			const curExcludes = genericVariant.excludes || {};
			return !!Object.keys(curExcludes).find(key => {
				if (curExcludes[key] instanceof Array) {
					return (baseItem[key] instanceof Array ? baseItem[key].find(it => curExcludes[key].includes(it)) : curExcludes[key].includes(baseItem[key]));
				}
				return baseItem[key] instanceof Array ? baseItem[key].find(it => curExcludes[key] === it) : curExcludes[key] === baseItem[key];
			});
		}

		function createSpecificVariant (baseItem, genericVariant) {
			const inherits = genericVariant.inherits;
			const specificVariant = MiscUtil.copy(baseItem);
			// Recent enhancements/entry cache
			specificVariant._isEnhanced = false;
			delete specificVariant._fullEntries;

			if (baseItem.source !== SRC_PHB && baseItem.source !== SRC_DMG) {
				Renderer.item._initFullEntries(specificVariant);
				specificVariant._fullEntries.unshift(`{@note The base item can be found in ${Parser.sourceJsonToFull(baseItem.source)}.}`);
			}

			specificVariant._baseName = baseItem.name;
			specificVariant._baseSrd = baseItem.srd;
			if (baseItem.source !== inherits.source) specificVariant._baseSource = baseItem.source;

			// Magic items do not inherit the value of the non-magical item
			delete specificVariant.value;

			// Magic variants apply their own SRD info
			delete specificVariant.srd;

			specificVariant._category = "Specific Variant";
			Object.keys(inherits).forEach((inheritedProperty) => {
				switch (inheritedProperty) {
					case "namePrefix": specificVariant.name = `${inherits.namePrefix}${specificVariant.name}`; break;
					case "nameSuffix": specificVariant.name = `${specificVariant.name}${inherits.nameSuffix}`; break;
					case "entries": {
						Renderer.item._initFullEntries(specificVariant);

						const appliedPropertyEntries = Renderer.applyAllProperties(inherits.entries, Renderer.item._getInjectableProps(baseItem, inherits));
						appliedPropertyEntries.forEach((ent, i) => specificVariant._fullEntries.splice(i, 0, ent));
						break;
					}
					case "valueExpression": {
						const exp = inherits.valueExpression.replace(/\[\[([^\]]+)]]/g, (...m) => {
							const propPath = m[1].split(".");
							return propPath[0] === "item"
								? MiscUtil.get(specificVariant, ...propPath.slice(1))
								: propPath[0] === "baseItem"
									? MiscUtil.get(baseItem, ...propPath.slice(1))
									: MiscUtil.get(specificVariant, ...propPath);
						});
						const result = Renderer.dice.parseRandomise2(exp);
						if (result != null) specificVariant.value = result;

						break;
					}
					default: specificVariant[inheritedProperty] = inherits[inheritedProperty];
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
			if (linkedLootTables && linkedLootTables[specificVariant.source] && linkedLootTables[specificVariant.source][specificVariant.name]) {
				(specificVariant.lootTables = specificVariant.lootTables || []).push(...linkedLootTables[specificVariant.source][specificVariant.name])
			}

			return specificVariant;
		}

		const genericAndSpecificVariants = [...genericVariants];
		baseItems.forEach((curBaseItem) => {
			curBaseItem._category = "Basic";
			if (curBaseItem.entries == null) curBaseItem.entries = [];

			if (curBaseItem.quantity) return; // e.g. "Arrows (20)"

			genericVariants.forEach((curGenericVariant) => {
				if (!hasRequiredProperty(curBaseItem, curGenericVariant)) return;
				if (hasExcludedProperty(curBaseItem, curGenericVariant)) return;

				genericAndSpecificVariants.push(createSpecificVariant(curBaseItem, curGenericVariant));
			});
		});
		return genericAndSpecificVariants;
	},

	_enhanceItems (allItems) {
		allItems.forEach((item) => Renderer.item.enhanceItem(item));
		return allItems;
	},

	async pGetGenericAndSpecificVariants (variants, opts) {
		opts = opts || {};
		opts.baseItemsUrl = opts.baseItemsUrl || `${Renderer.get().baseUrl}data/items-base.json`;

		const baseItemData = await DataUtil.loadJSON(opts.baseItemsUrl);
		const baseItems = baseItemData.baseitem.concat(opts.additionalBaseItems || []);
		Renderer.item._addBasePropertiesAndTypes(baseItemData);
		await Renderer.item._pAddBrewPropertiesAndTypes();
		variants.forEach(Renderer.item._genericVariants_addInheritedPropertiesToSelf);
		const genericAndSpecificVariants = Renderer.item._createSpecificVariants(baseItems, variants);
		return Renderer.item._enhanceItems(genericAndSpecificVariants);
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
			bonusSavingThrow: inherits.bonusSavingThrow
		}
	},

	_INHERITED_PROPS_BLACKLIST: new Set([
		"entries", // Entries have specific merging
		"bonusAc",
		"bonusWeapon",
		"bonusWeaponAttack",
		"bonusWeaponDamage",
		"bonusSpellAttack",
		"bonusSavingThrow",
		"namePrefix",
		"nameSuffix"
	]),
	_genericVariants_addInheritedPropertiesToSelf (genericVariant) {
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

	enhanceItem (item) {
		if (item._isEnhanced) return;
		item._isEnhanced = true;
		if (item.noDisplay) return;
		if (item.type === "GV") item._category = "Generic Variant";
		if (item._category == null) item._category = "Other";
		if (item.entries == null) item.entries = [];
		if (item.type && Renderer.item.typeMap[item.type]) {
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
				item._fullEntries.push("The wearer has disadvantage on Stealth (Dexterity) checks.");
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
		}
		if (item.type === "SCF") {
			if (item._isItemGroup) {
				if (item.scfType === "arcane") {
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
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 83)) item.additionalSources.push({"source": "XGE", "page": 83});
		} else if (item.type === "GS") {
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 81)) item.additionalSources.push({"source": "XGE", "page": 81});
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

		// handle item groups
		if (item._isItemGroup) {
			Renderer.item._initFullEntries(item);
			item._fullEntries.push(
				"Multiple variations of this item exist, as listed below:",
				{
					type: "list",
					items: item.items.map(it => typeof it === "string" ? `{@item ${it}}` : `{@item ${it.name}|${it.source}}`)
				}
			);
		}

		(function addBaseItemList (item) {
			// item.variants was added during generic variant creation
			// TAG ITEM_VARIANTS
			function createItemLink (item) {
				return `{@item ${item.name}|${item.source}}`;
			}

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
								return `${createItemLink(base)} (${createItemLink(specificVariant)})`
							})
						}
					]
				});
			}
		})(item);
	},

	async getItemsFromHomebrew (homebrew) {
		(homebrew.itemProperty || []).forEach(p => Renderer.item._addProperty(p));
		(homebrew.itemType || []).forEach(t => Renderer.item._addType(t));
		let items = (homebrew.baseitem || []).concat(homebrew.item || []);
		Renderer.item._enhanceItems(items);
		if (homebrew.variant && homebrew.variant.length) {
			const variants = await Renderer.item.pGetGenericAndSpecificVariants(
				homebrew.variant,
				{additionalBaseItems: homebrew.baseitem || []}
			);
			items = items.concat(variants);
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
			DataUtil.loadJSON(`${Renderer.get().baseUrl}data/items-base.json`)
				.then(data => {
					if (Renderer.item._isRefPopulated) {
						resolve();
					} else {
						try {
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
		const genericAndSpecificVariants = Renderer.item._createSpecificVariants(basicItems, genericVariants, linkedLootTables);

		const revNames = [];
		genericAndSpecificVariants.forEach(item => {
			if (item.variants) delete item.variants; // prevent circular references
			const revName = Renderer.item.modifierPostToPre(MiscUtil.copy(item));
			if (revName) revNames.push(revName);
		});

		genericAndSpecificVariants.push(...revNames);

		return genericAndSpecificVariants;
	},

	pGetFluff (item) {
		return Renderer.utils.pGetFluff({
			entity: item,
			fluffProp: "itemFluff",
			fluffUrl: `data/fluff-items.json`
		});
	}
};

Renderer.psionic = {
	enhanceMode: (mode) => {
		if (!mode.enhanced) {
			mode.name = `${mode.name} ${getModeSuffix(mode, false)}`;

			if (mode.submodes) {
				mode.submodes.forEach(sm => {
					sm.name = `${sm.name} ${getModeSuffix(sm, true)}`;
				});
			}

			mode.enhanced = true;
		}

		function getModeSuffix (mode, subMode) {
			subMode = subMode == null ? false : subMode;
			const modeTitleArray = [];
			const bracketPart = getModeTitleBracketPart();
			if (bracketPart != null) modeTitleArray.push(bracketPart);
			if (subMode) return `${modeTitleArray.join(" ")}`;
			else return `${modeTitleArray.join(" ")}`;

			function getModeTitleBracketPart () {
				const modeTitleBracketArray = [];

				if (mode.cost) modeTitleBracketArray.push(getModeTitleCost());
				if (mode.concentration) modeTitleBracketArray.push(getModeTitleConcentration());

				if (modeTitleBracketArray.length === 0) return null;
				return `(${modeTitleBracketArray.join("; ")})`;

				function getModeTitleCost () {
					const costMin = mode.cost.min;
					const costMax = mode.cost.max;
					const costString = costMin === costMax ? costMin : `${costMin}-${costMax}`;
					return `${costString} psi`;
				}

				function getModeTitleConcentration () {
					return `conc., ${mode.concentration.duration} ${mode.concentration.unit}.`
				}
			}
		}
	},

	getBodyText (psi, renderer) {
		const renderStack = [];
		if (psi.entries) Renderer.get().recursiveRender(({entries: psi.entries, type: "entries"}), renderStack);
		if (psi.focus) renderStack.push(Renderer.psionic.getFocusString(psi, renderer));
		if (psi.modes) renderStack.push(...psi.modes.map(mode => Renderer.psionic.getModeString(mode, renderer)));
		return renderStack.join("");
	},

	getDescriptionString: (psionic, renderer) => {
		return `<p>${renderer.render({type: "inline", entries: [psionic.description]})}</p>`;
	},

	getFocusString: (psionic, renderer) => {
		return `<p><span class="psi-focus-title">Psychic Focus.</span> ${renderer.render({type: "inline", entries: [psionic.focus]})}</p>`;
	},

	getModeString: (mode, renderer) => {
		Renderer.psionic.enhanceMode(mode);

		const renderStack = [];
		renderer.recursiveRender(mode, renderStack, {depth: 2});
		const modeString = renderStack.join("");
		if (mode.submodes == null) return modeString;
		const subModeString = Renderer.psionic.getSubModeString(mode.submodes, renderer);
		return `${modeString}${subModeString}`;
	},

	getSubModeString (subModes, renderer) {
		const fauxEntry = {
			type: "list",
			style: "list-hang-notitle",
			items: []
		};

		for (let i = 0; i < subModes.length; ++i) {
			fauxEntry.items.push({
				type: "item",
				name: subModes[i].name,
				entry: subModes[i].entries.join("<br>")
			});
		}
		const renderStack = [];
		renderer.recursiveRender(fauxEntry, renderStack, {depth: 2});
		return renderStack.join("");
	},

	getTypeOrderString (psi) {
		const typeMeta = Parser.psiTypeToMeta(psi.type);
		// if "isAltDisplay" is true, render as e.g. "Greater Discipline (Awakened)" rather than "Awakened Greater Discipline"
		return typeMeta.hasOrder
			? typeMeta.isAltDisplay ? `${typeMeta.full} (${psi.order})` : `${psi.order} ${typeMeta.full}`
			: typeMeta.full;
	},

	getCompactRenderedString (psi) {
		return `
			${Renderer.utils.getExcludedTr(psi, "psionic")}
			${Renderer.utils.getNameTr(psi, {page: UrlUtil.PG_PSIONICS})}
			<tr class="text"><td colspan="6">
			<p><i>${Renderer.psionic.getTypeOrderString(psi)}</i></p>
			${Renderer.psionic.getBodyText(psi, Renderer.get().setFirstSection(true))}
			</td></tr>
		`;
	}
};

Renderer.rule = {
	getCompactRenderedString (rule) {
		return `
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(rule)}
			</td></tr>
		`;
	}
};

Renderer.variantrule = {
	getCompactRenderedString (rule) {
		const cpy = MiscUtil.copy(rule);
		delete cpy.name;
		return `
			${Renderer.utils.getExcludedTr(rule, "variantrule")}
			${Renderer.utils.getNameTr(rule, {page: UrlUtil.PG_VARIATNRULES})}
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(cpy)}
			</td></tr>
		`;
	}
};

Renderer.table = {
	getCompactRenderedString (it) {
		it.type = it.type || "table";
		const cpy = MiscUtil.copy(it);
		delete cpy.name;
		return `
			${Renderer.utils.getExcludedTr(it, "table")}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TABLES})}
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(it)}
			</td></tr>
		`;
	}
};

Renderer.vehicle = {
	getCompactRenderedString (veh) {
		return Renderer.vehicle.getRenderedString(veh, {isCompact: true});
	},

	getRenderedString (veh, opts) {
		opts = opts || {};
		veh.vehicleType = veh.vehicleType || "SHIP";
		switch (veh.vehicleType) {
			case "SHIP": return Renderer.vehicle._getRenderedString_ship(veh, opts);
			case "INFWAR": return Renderer.vehicle._getRenderedString_infwar(veh, opts);
			case "CREATURE": return Renderer.monster.getCompactRenderedString(veh, null, {...opts, isHideLanguages: true, isHideSenses: true, isCompact: false});
			default: throw new Error(`Unhandled vehicle type "${veh.vehicleType}"`);
		}
	},

	_getRenderedString_ship (veh, opts) {
		const renderer = Renderer.get();

		function getSectionTitle (title) {
			return `<tr class="mon__stat-header-underline"><td colspan="6"><span>${title}</span></td></tr>`
		}

		function getActionPart () {
			return renderer.render({entries: veh.action});
		}

		function getSectionHpPart (sect, each) {
			if (!sect.ac && !sect.hp) return "";
			return `
				<div><b>Armor Class</b> ${sect.ac}</div>
				<div><b>Hit Points</b> ${sect.hp}${each ? ` each` : ""}${sect.dt ? ` (damage threshold ${sect.dt})` : ""}${sect.hpNote ? `; ${sect.hpNote}` : ""}</div>
			`;
		}

		function getControlSection (control) {
			if (!control) return "";
			return `
				<tr class="mon__stat-header-underline"><td colspan="6"><span>Control: ${control.name}</span></td></tr>
				<tr><td colspan="6">
				${getSectionHpPart(control)}
				<div>${renderer.render({entries: control.entries})}</div>
				</td></tr>
			`;
		}

		function getMovementSection (move) {
			if (!move) return "";

			function getLocomotionSection (loc) {
				const asList = {
					type: "list",
					style: "list-hang-notitle",
					items: [
						{
							type: "item",
							name: `Locomotion (${loc.mode})`,
							entries: loc.entries
						}
					]
				};
				return `<div>${renderer.render(asList)}</div>`;
			}

			function getSpeedSection (spd) {
				const asList = {
					type: "list",
					style: "list-hang-notitle",
					items: [
						{
							type: "item",
							name: `Speed (${spd.mode})`,
							entries: spd.entries
						}
					]
				};
				return `<div>${renderer.render(asList)}</div>`;
			}

			return `
				<tr class="mon__stat-header-underline"><td colspan="6"><span>${move.isControl ? `Control and ` : ""}Movement: ${move.name}</span></td></tr>
				<tr><td colspan="6">
				${getSectionHpPart(move)}
				${(move.locomotion || []).map(getLocomotionSection)}
				${(move.speed || []).map(getSpeedSection)}
				</td></tr>
			`;
		}

		function getWeaponSection (weap) {
			return `
				<tr class="mon__stat-header-underline"><td colspan="6"><span>Weapons: ${weap.name}${weap.count ? ` (${weap.count})` : ""}</span></td></tr>
				<tr><td colspan="6">
				${getSectionHpPart(weap, !!weap.count)}
				${renderer.render({entries: weap.entries})}
				</td></tr>
			`;
		}

		function getOtherSection (oth) {
			return `
				<tr class="mon__stat-header-underline"><td colspan="6"><span>${oth.name}</span></td></tr>
				<tr><td colspan="6">
				${getSectionHpPart(oth)}
				${renderer.render({entries: oth.entries})}
				</td></tr>
			`;
		}

		// Render UA ship actions at the top, to match later printed layout
		const otherSectionActions = (veh.other || []).filter(it => it.name === "Actions");
		const otherSectionOters = (veh.other || []).filter(it => it.name !== "Actions");

		const hasToken = veh.tokenUrl || veh.hasToken;
		const extraThClasses = !opts.isCompact && hasToken ? ["veh__name--token"] : null;

		return `
			${Renderer.utils.getExcludedTr(veh, "vehicle")}
			${Renderer.utils.getNameTr(veh, {extraThClasses, page: UrlUtil.PG_VEHICLES})}
			<tr class="text"><td colspan="6"><i>${Parser.sizeAbvToFull(veh.size)} vehicle${veh.dimensions ? ` (${veh.dimensions.join(" by ")})` : ""}</i><br></td></tr>
			<tr class="text"><td colspan="6">
				<div><b>Creature Capacity</b> ${veh.capCrew} crew${veh.capPassenger ? `, ${veh.capPassenger} passengers` : ""}</div>
				${veh.capCargo ? `<div><b>Cargo Capacity</b> ${typeof veh.capCargo === "string" ? veh.capCargo : `${veh.capCargo} ton${veh.capCargo === 1 ? "" : "s"}`}</div>` : ""}
				<div><b>Travel Pace</b> ${veh.pace} miles per hour (${veh.pace * 24} miles per day)</div>
			</td></tr>
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th class="col-2 text-center">STR</th>
						<th class="col-2 text-center">DEX</th>
						<th class="col-2 text-center">CON</th>
						<th class="col-2 text-center">INT</th>
						<th class="col-2 text-center">WIS</th>
						<th class="col-2 text-center">CHA</th>
					</tr>
					<tr>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "str")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "dex")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "con")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "int")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "wis")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "cha")}</td>
					</tr>
				</table>
			</td></tr>
			<tr class="text"><td colspan="6">
				${veh.immune ? `<div><b>Damage Immunities</b> ${Parser.monImmResToFull(veh.immune)}</div>` : ""}
				${veh.conditionImmune ? `<div><b>Condition Immunities</b> ${Parser.monCondImmToFull(veh.conditionImmune)}</div>` : ""}
			</td></tr>
			${veh.action ? getSectionTitle("Actions") : ""}
			${veh.action ? `<tr><td colspan="6">${getActionPart()}</td></tr>` : ""}
			${otherSectionActions.map(getOtherSection).join("")}
			${getSectionTitle("Hull")}
			<tr><td colspan="6">
			${getSectionHpPart(veh.hull)}
			</td></tr>
			${(veh.control || []).map(getControlSection).join("")}
			${(veh.movement || []).map(getMovementSection).join("")}
			${(veh.weapon || []).map(getWeaponSection).join("")}
			${otherSectionOters.map(getOtherSection).join("")}
		`;
	},

	_getRenderedString_infwar (veh, opts) {
		const renderer = Renderer.get();
		const dexMod = Parser.getAbilityModNumber(veh.dex);

		const hasToken = veh.tokenUrl || veh.hasToken;
		const extraThClasses = !opts.isCompact && hasToken ? ["veh__name--token"] : null;

		return `
			${Renderer.utils.getExcludedTr(veh, "vehicle")}
			${Renderer.utils.getNameTr(veh, {extraThClasses, page: UrlUtil.PG_VEHICLES})}
			<tr class="text"><td colspan="6"><i>${Parser.sizeAbvToFull(veh.size)} vehicle (${veh.weight.toLocaleString()} lb.)</i><br></td></tr>
			<tr class="text"><td colspan="6">
				<div><b>Creature Capacity</b> ${veh.capCreature} Medium creatures</div>
				<div><b>Cargo Capacity</b> ${Parser.weightToFull(veh.capCargo)}</div>
				<div><b>Armor Class</b> ${dexMod === 0 ? `19` : `${19 + dexMod} (19 while motionless)`}</div>
				<div><b>Hit Points</b> ${veh.hp.hp} (damage threshold ${veh.hp.dt}, mishap threshold ${veh.hp.mt})</div>
				<div><b>Speed</b> ${veh.speed} ft.</div>
			</td></tr>
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th class="col-2 text-center">STR</th>
						<th class="col-2 text-center">DEX</th>
						<th class="col-2 text-center">CON</th>
						<th class="col-2 text-center">INT</th>
						<th class="col-2 text-center">WIS</th>
						<th class="col-2 text-center">CHA</th>
					</tr>
					<tr>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "str")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "dex")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "con")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "int")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "wis")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(veh, "cha")}</td>
					</tr>
				</table>
			</td></tr>
			<tr class="text"><td colspan="6">
				${veh.immune ? `<div><b>Damage Immunities</b> ${Parser.monImmResToFull(veh.immune)}</div>` : ""}
				${veh.conditionImmune ? `<div><b>Condition Immunities</b> ${Parser.monCondImmToFull(veh.conditionImmune)}</div>` : ""}
			</td></tr>
			${veh.trait ? `<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr class="text compact"><td colspan="6">
			${Renderer.monster.getOrderedTraits(veh, renderer).map(it => it.rendered || renderer.render(it, 2)).join("")}
			</td></tr>` : ""}
			${Renderer.monster.getCompactRenderedStringSection(veh, renderer, "Action Stations", "actionStation", 2)}
			${Renderer.monster.getCompactRenderedStringSection(veh, renderer, "Reactions", "reaction", 2)}
		`;
	},

	pGetFluff (veh) {
		return Renderer.utils.pGetFluff({
			entity: veh,
			fluffProp: "vehicleFluff",
			fluffUrl: `data/fluff-vehicles.json`
		});
	}
};

Renderer.action = {
	getCompactRenderedString (it) {
		const cpy = MiscUtil.copy(it);
		delete cpy.name;
		return `${Renderer.utils.getExcludedTr(it, "action")}${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_ACTIONS})}
		<tr><td colspan="6">${Renderer.get().setFirstSection(true).render(cpy)}</td></tr>`;
	}
};

Renderer.language = {
	getCompactRenderedString (it) {
		return Renderer.language.getRenderedString(it);
	},

	getRenderedString (it) {
		const allEntries = [];

		const hasMeta = it.typicalSpeakers || it.script;

		if (it.entries) allEntries.push(...it.entries);
		if (it.dialects) {
			allEntries.push(`This language is a family which includes the following dialects: ${it.dialects.sort(SortUtil.ascSortLower).join(", ")}. Creatures that speak different dialects of the same language can communicate with one another.`);
		}

		if (!allEntries.length && !hasMeta) allEntries.push("{@i No information available.}");

		return `
		${Renderer.utils.getExcludedTr(it, "language")}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_LANGUAGES})}
		${it.type ? `<tr class="text"><td colspan="6" class="pt-0"><i>${it.type.toTitleCase()} language</i></td></tr>` : ""}
		${hasMeta ? `<tr class="text"><td colspan="6">
		${it.typicalSpeakers ? `<div><b>Typical Speakers</b> ${Renderer.get().render(it.typicalSpeakers.join(", "))}</b>` : ""}
		${it.script ? `<div><b>Script</b> ${Renderer.get().render(it.script)}</div>` : ""}
		<div></div>
		</td></tr>` : ""}
		${allEntries.length ? `<tr class="text"><td colspan="6">
		${Renderer.get().setFirstSection(true).render({entries: allEntries})}
		</td></tr>` : ""}
		${Renderer.utils.getPageTr(it)}`;
	},

	pGetFluff (it) {
		return Renderer.utils.pGetFluff({
			entity: it,
			fluffProp: "languageFluff",
			fluffUrl: `data/fluff-languages.json`
		});
	}
};

Renderer.adventureBook = {
	getEntryIdLookup (bookData, doThrowError = true) {
		const out = {};

		const depthStack = [];
		const handlers = {
			object: (chapIx, obj) => {
				Renderer.ENTRIES_WITH_CHILDREN
					.filter(meta => meta.key === "entries")
					.forEach(meta => {
						if (obj.type !== meta.type) return;

						depthStack.push(
							Math.min(
								obj.type === "section" ? -1 : depthStack.length ? depthStack.last() + 1 : 0,
								2
							)
						);

						if (obj.id) {
							if (out[obj.id]) {
								(out.__BAD = out.__BAD || []).push(obj.id);
							} else {
								out[obj.id] = {
									chapter: chapIx,
									entry: obj,
									depth: depthStack.last()
								};
							}
						}
					});
				return obj;
			},
			postObject: (chapIx, obj) => {
				Renderer.ENTRIES_WITH_CHILDREN
					.filter(meta => meta.key === "entries")
					.forEach(meta => {
						if (obj.type !== meta.type) return;

						depthStack.pop();
					});
			}
		};

		bookData.forEach((chap, chapIx) => MiscUtil.getWalker().walk(chapIx, chap, handlers));

		if (doThrowError) if (out.__BAD) throw new Error(`IDs were already in storage: ${out.__BAD.map(it => `"${it}"`).join(", ")}`);

		return out;
	}
};

Renderer.generic = {
	getCompactRenderedString (it) {
		return `
		${Renderer.utils.getNameTr(it)}
		<tr class="text"><td colspan="6">
		${Renderer.get().setFirstSection(true).render({entries: it.entries})}
		</td></tr>
		${Renderer.utils.getPageTr(it)}`;
	}
};

Renderer.hover = {
	TAG_TO_PAGE: {
		"spell": UrlUtil.PG_SPELLS,
		"item": UrlUtil.PG_ITEMS,
		"creature": UrlUtil.PG_BESTIARY,
		"condition": UrlUtil.PG_CONDITIONS_DISEASES,
		"disease": UrlUtil.PG_CONDITIONS_DISEASES,
		"background": UrlUtil.PG_BACKGROUNDS,
		"race": UrlUtil.PG_RACES,
		"optfeature": UrlUtil.PG_OPT_FEATURES,
		"reward": UrlUtil.PG_REWARDS,
		"feat": UrlUtil.PG_FEATS,
		"psionic": UrlUtil.PG_PSIONICS,
		"object": UrlUtil.PG_OBJECTS,
		"cult": UrlUtil.PG_CULTS_BOONS,
		"boon": UrlUtil.PG_CULTS_BOONS,
		"trap": UrlUtil.PG_TRAPS_HAZARDS,
		"hazard": UrlUtil.PG_TRAPS_HAZARDS,
		"deity": UrlUtil.PG_DEITIES,
		"variantrule": UrlUtil.PG_VARIATNRULES
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

	bindDmScreen (screen) { this._dmScreen = screen; },

	_getNextId () { return ++Renderer.hover._lastId; },

	_doInit () {
		if (!Renderer.hover._isInit) {
			Renderer.hover._isInit = true;

			$(document.body).on("click", () => Renderer.hover.cleanTempWindows());

			ContextUtil.doInitContextMenu(
				"hoverBorder",
				(evt, ele, $invokedOn, $selectedMenu, _, windowMeta) => { // windowMeta for future use for more options
					const $perms = $(`.hoverborder[data-perm="true"]`);
					switch (Number($selectedMenu.data("ctx-id"))) {
						case 0: $perms.attr("data-display-title", "false"); break;
						case 1: $perms.attr("data-display-title", "true"); break;
						case 2: {
							const $thisHoverClose = $(ele).closest(`.hoverborder--top`).find(`.hvr__close`);
							$(`.hvr__close`).not($thisHoverClose).click();
							break;
						}
						case 3: $(`.hvr__close`).click(); break;
					}
				},
				["Maximize All", "Minimize All", null, "Close Others", "Close All"]
			);
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
			hash
		};
		meta.windowMeta = Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				title: toRender ? toRender.name : "",
				isPermanent: meta.isPermanent,
				pageUrl: `${Renderer.get().baseUrl}${page}#${hash}`,
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = meta.isFluff = false
			},
			sourceData
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

						Renderer.monster.getCrScaleTarget(
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
							true
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
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = false
			}
		);

		// Reset cursor
		ele.style.cursor = "";
	},

	// (Baked into render strings)
	handlePredefinedMouseLeave (evt, ele) { return Renderer.hover.handleLinkMouseLeave(evt, ele) },

	// (Baked into render strings)
	handlePredefinedMouseMove (evt, ele) { return Renderer.hover.handleLinkMouseMove(evt, ele) },

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
			window: (evt.view || {}).window || window
		}
	},

	getWindowPositionExact (x, y, evt = null) {
		return {
			window: ((evt || {}).view || {}).window || window,
			mode: "exact",
			x,
			y
		}
	},

	getWindowPositionExactVisibleBottom (x, y, evt = null) {
		return {
			...Renderer.hover.getWindowPositionExact(x, y, evt),
			mode: "exactVisibleBottom"
		};
	},

	_WINDOW_METAS: {},
	_MIN_Z_INDEX: 200,
	_MAX_Z_INDEX: 300,
	_DEFAULT_WIDTH_PX: 600,
	_BODY_SCROLLER_WIDTH_PX: 15,

	_getZIndex () {
		const zIndices = Object.values(Renderer.hover._WINDOW_METAS).map(it => it.zIndex);
		if (!zIndices.length) return Renderer.hover._MIN_Z_INDEX;
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

			if (sortedWindowMetas.length >= (Renderer.hover._MAX_Z_INDEX - Renderer.hover._MIN_Z_INDEX)) {
				// If we have too many window open, collapse them into one z-index
				sortedWindowMetas.forEach(([k, v]) => {
					v.setZIndex(Renderer.hover._MIN_Z_INDEX);
				})
			} else {
				// Otherwise, ensure one consistent run from min to max z-index
				sortedWindowMetas.forEach(([k, v], i) => {
					v.setZIndex(Renderer.hover._MIN_Z_INDEX + i);
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
				"zIndex": initialZIndex
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
				"animation": "initial"
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
					"max-height": "initial"
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
			.on("contextmenu", (evt) => ContextUtil.handleOpenContextMenu(evt, $brdrTop[0], "hoverBorder", null, out));

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
					case 1: handleNorthDrag(evt); handleEastDrag(evt); break;
					case 2: handleEastDrag(evt); break;
					case 3: handleSouthDrag(evt); handleEastDrag(evt); break;
					case 4: handleSouthDrag(evt); break;
					case 5: handleSouthDrag(evt); handleWestDrag(evt); break;
					case 6: handleWestDrag(evt); break;
					case 7: handleNorthDrag(evt); handleWestDrag(evt); break;
					case 8: handleNorthDrag(evt); break;
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

					const dimensions = opts.fnGetPopoutSize ? opts.fnGetPopoutSize() : {width: 600, height: $content.height()};
					const win = open(
						"",
						opts.title || "",
						`width=${dimensions.width},height=${dimensions.height}location=0,menubar=0,status=0,titlebar=0,toolbar=0`
					);

					win._IS_POPOUT = true;
					win.document.write(`
						<!DOCTYPE html>
						<html lang="en" class="${typeof styleSwitcher !== "undefined" && styleSwitcher.getActiveDayNight() === StyleSwitcher.STYLE_NIGHT ? StyleSwitcher.NIGHT_CLASS : ""}"><head>
							<meta name="viewport" content="width=device-width, initial-scale=1">
							<title>${opts.title}</title>
							<link rel="manifest" href="manifest.webmanifest">
							${$(`link[rel="stylesheet"][href]`).map((i, e) => e.outerHTML).get().join("\n")}
							<link rel="icon" href="favicon.png">

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
						"top": pos.y
					});
					break;
				}
				case "exactVisibleBottom": {
					$hov.css({
						"left": pos.x,
						"top": pos.y,
						"animation": "initial" // Briefly remove the animation so we can calculate the height
					});

					let yPos = pos.y;

					const {bottom: posBottom, height: winHeight} = $hov[0].getBoundingClientRect();
					const height = position.window.innerHeight
					if (posBottom > height) {
						yPos = position.window.innerHeight - winHeight;
						$hov.css({
							"top": yPos,
							"animation": ""
						});
					}

					break;
				}
				default: throw new Error(`Positiong mode unimplemented: "${pos.mode}"`);
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
			touchStart: (evt, ele) => Renderer.hover.handleTouchStart(evt, ele)
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
	_addToCache: (page, source, hash, item) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		((Renderer.hover._linkCache[page] =
			Renderer.hover._linkCache[page] || [])[source] =
			Renderer.hover._linkCache[page][source] || [])[hash] = item;
	},

	_getFromCache: (page, source, hash, opts) => {
		opts = opts || {};

		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		const out = MiscUtil.get(Renderer.hover._linkCache, page, source, hash);
		if (opts.isCopy) return MiscUtil.copy(out);
		return out;
	},

	_isCached: (page, source, hash) => {
		return Renderer.hover._linkCache[page] && Renderer.hover._linkCache[page][source] && Renderer.hover._linkCache[page][source][hash];
	},

	_psCacheLoading: {},
	_flagsCacheLoaded: {},

	async pCacheAndGetHash (page, hash) {
		const source = hash.split(HASH_LIST_SEP).last();
		return Renderer.hover.pCacheAndGet(page, source, hash);
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

		switch (page) {
			case "generic":
			case "hover": return null;
			case UrlUtil.PG_CLASSES: {
				const loadKey = UrlUtil.PG_CLASSES;

				await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
					page,
					source,
					hash,
					loadKey,
					async () => {
						const addToIndex = (cls) => {
							// add class
							const clsHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls);
							const clsEntries = {name: cls.name, type: "section", entries: MiscUtil.copy((cls.classFeatures || []).flat())};
							Renderer.hover._addToCache(UrlUtil.PG_CLASSES, cls.source || SRC_PHB, clsHash, clsEntries);

							// add subclasses
							(cls.subclasses || []).forEach(sc => {
								const scHash = `${clsHash}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: sc})}`;
								const scEntries = {name: `${sc.name} (${cls.name})`, type: "section", entries: MiscUtil.copy((sc.subclassFeatures || []).flat())};
								Renderer.hover._addToCache(UrlUtil.PG_CLASSES, cls.source || SRC_PHB, scHash, scEntries);
							});

							// add all class/subclass features
							UrlUtil.class.getIndexedEntries(cls).forEach(it => Renderer.hover._addToCache(UrlUtil.PG_CLASSES, it.source, it.hash, it.entry));
						};

						const brewData = await BrewUtil.pAddBrewData();
						(brewData.class || []).forEach(cc => addToIndex(cc));
						const data = await DataUtil.class.loadJSON();
						data.class.forEach(cc => addToIndex(cc));
					}
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}
			case UrlUtil.PG_SPELLS: return Renderer.hover._pCacheAndGet_pLoadMultiSource(page, source, hash, opts, `data/spells/`, "spell");
			case UrlUtil.PG_BESTIARY: return Renderer.hover._pCacheAndGet_pLoadMultiSource(page, source, hash, opts, `data/bestiary/`, "monster", data => DataUtil.monster.populateMetaReference(data));
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
							isBlacklistVariants: true
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
					}
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}
			case UrlUtil.PG_BACKGROUNDS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "backgrounds.json", "background");
			case UrlUtil.PG_FEATS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "feats.json", "feat");
			case UrlUtil.PG_OPT_FEATURES: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "optionalfeatures.json", "optionalfeature");
			case UrlUtil.PG_PSIONICS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "psionics.json", "psionic");
			case UrlUtil.PG_REWARDS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "rewards.json", "reward");
			case UrlUtil.PG_RACES: {
				const loadKey = UrlUtil.PG_RACES;

				await Renderer.hover._pCacheAndGet_pDoLoadWithLock(
					page,
					source,
					hash,
					loadKey,
					async () => {
						const brewData = await BrewUtil.pAddBrewData();
						let mergedBrewData = [];
						if (brewData.race) {
							mergedBrewData = Renderer.race.mergeSubraces(brewData.race, {isAddBaseRaces: true})
							Renderer.hover._pCacheAndGet_populate(page, {race: mergedBrewData}, "race");
						}

						const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/races.json`);
						const merged = Renderer.race.mergeSubraces(data.race, {isAddBaseRaces: true});
						Renderer.hover._pCacheAndGet_populate(page, {race: merged}, "race");

						if (brewData.subrace) {
							const racesWithNuSubraces = Renderer.race.adoptSubraces(
								[...mergedBrewData, ...merged],
								brewData.subrace
							);
							const mergedBrew = Renderer.race.mergeSubraces(racesWithNuSubraces);
							Renderer.hover._pCacheAndGet_populate(page, {race: mergedBrew}, "race");
						}
					}
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}
			case UrlUtil.PG_DEITIES: return Renderer.hover._pCacheAndGet_pLoadCustom(page, source, hash, opts, "deities.json", "deity", null, "deity");
			case UrlUtil.PG_OBJECTS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "objects.json", "object");
			case UrlUtil.PG_TRAPS_HAZARDS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "trapshazards.json", ["trap", "hazard"]);
			case UrlUtil.PG_VARIATNRULES: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "variantrules.json", "variantrule");
			case UrlUtil.PG_CULTS_BOONS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "cultsboons.json", ["cult", "boon"], (listProp, item) => item.__prop = listProp);
			case UrlUtil.PG_CONDITIONS_DISEASES: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "conditionsdiseases.json", ["condition", "disease"], (listProp, item) => item.__prop = listProp);
			case UrlUtil.PG_TABLES: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "generated/gendata-tables.json", ["table", "tableGroup"], (listProp, item) => item.__prop = listProp);
			case UrlUtil.PG_VEHICLES: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "vehicles.json", "vehicle");
			case UrlUtil.PG_ACTIONS: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "actions.json", "action");
			case UrlUtil.PG_LANGUAGES: return Renderer.hover._pCacheAndGet_pLoadSimple(page, source, hash, opts, "languages.json", "language");

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
									UrlUtil.encodeForHash(nameMeta.name.toLowerCase())
								];
								if (nameMeta.ixBook) hashParts.push(nameMeta.ixBook);

								const hash = hashParts.join(HASH_PART_SEP);

								Renderer.hover._addToCache(page, nameMeta.source, hash, nameMeta.entry);
							});
						});
					}
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
								adventureData: brewData
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
							adventureData: json
						};

						Renderer.hover._addToCache(page, fromIndex.source, hash, pack);
					}
				);

				return Renderer.hover._getFromCache(page, source, hash, opts);
			}
			// enregion

			// region fluff
			case `fluff__${UrlUtil.PG_BESTIARY}`: return Renderer.hover._pCacheAndGet_pLoadMultiSourceFluff(page, source, hash, opts, `data/bestiary/`, "monsterFluff");
			case `fluff__${UrlUtil.PG_SPELLS}`: return Renderer.hover._pCacheAndGet_pLoadMultiSourceFluff(page, source, hash, opts, `data/spells/`, "spellFluff");
			case `fluff__${UrlUtil.PG_BACKGROUNDS}`: return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "fluff-backgrounds.json", "backgroundFluff");
			case `fluff__${UrlUtil.PG_ITEMS}`: return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "fluff-items.json", "itemFluff");
			case `fluff__${UrlUtil.PG_CONDITIONS_DISEASES}`: return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "fluff-conditionsdiseases.json", ["conditionFluff", "diseaseFluff"]);
			case `fluff__${UrlUtil.PG_RACES}`: return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "fluff-races.json", "raceFluff");
			case `fluff__${UrlUtil.PG_LANGUAGES}`: return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "fluff-languages.json", "languageFluff");
			case `fluff__${UrlUtil.PG_VEHICLES}`: return Renderer.hover._pCacheAndGet_pLoadSimpleFluff(page, source, hash, opts, "fluff-vehicles.json", "vehicleFluff");
			// endregion

			default: throw new Error(`No load function defined for page ${page}`);
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
				if (fnPrePopulate) fnPrePopulate(brewData);
				if (brewData[listProp]) Renderer.hover._pCacheAndGet_populate(page, brewData, listProp, {fnGetHash: opts.fnGetHash});
				const index = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${baseUrl}${opts.isFluff ? "fluff-" : ""}index.json`);
				const officialSources = {};
				Object.entries(index).forEach(([k, v]) => officialSources[k.toLowerCase()] = v);

				const officialSource = officialSources[source.toLowerCase()];
				if (officialSource) {
					const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${baseUrl}${officialSource}`);
					if (fnPrePopulate) fnPrePopulate(data);
					Renderer.hover._pCacheAndGet_populate(page, data, listProp, {fnGetHash: opts.fnGetHash});
				}
				// (else source to load is 3rd party, which was already handled)
			}
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
			if (brewData[lp]) Renderer.hover._pCacheAndGet_populate(page, brewData, lp, {fnMutateItem, fnGetHash: opts.fnGetHash});
		});
	},

	_pCacheAndGet_handleSingleData (page, opts, data, listProps, fnMutateItem) {
		if (listProps instanceof Array) listProps.forEach(prop => data[prop] && Renderer.hover._pCacheAndGet_populate(page, data, prop, {fnMutateItem, fnGetHash: opts.fnGetHash}));
		else Renderer.hover._pCacheAndGet_populate(page, data, listProps, {fnMutateItem, fnGetHash: opts.fnGetHash});
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
			}
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
			}
		);

		return Renderer.hover._getFromCache(page, source, hash, opts);
	},
	// endregion

	getGenericCompactRenderedString (entry, depth = 0) {
		return `
			<tr class="text homebrew-hover"><td colspan="6">
			${Renderer.get().setFirstSection(true).render(entry, depth)}
			</td></tr>
		`;
	},

	_pageToRenderFn (page) {
		switch (page) {
			case "generic":
			case "hover": return Renderer.hover.getGenericCompactRenderedString;
			case UrlUtil.PG_QUICKREF:
			case UrlUtil.PG_CLASSES: return Renderer.hover.getGenericCompactRenderedString;
			case UrlUtil.PG_SPELLS: return Renderer.spell.getCompactRenderedString;
			case UrlUtil.PG_ITEMS: return Renderer.item.getCompactRenderedString;
			case UrlUtil.PG_BESTIARY: return (it) => Renderer.monster.getCompactRenderedString(it, null, {showScaler: true, isScaled: it._originalCr != null});
			case UrlUtil.PG_CONDITIONS_DISEASES: return Renderer.condition.getCompactRenderedString;
			case UrlUtil.PG_BACKGROUNDS: return Renderer.background.getCompactRenderedString;
			case UrlUtil.PG_FEATS: return Renderer.feat.getCompactRenderedString;
			case UrlUtil.PG_OPT_FEATURES: return Renderer.optionalfeature.getCompactRenderedString;
			case UrlUtil.PG_PSIONICS: return Renderer.psionic.getCompactRenderedString;
			case UrlUtil.PG_REWARDS: return Renderer.reward.getCompactRenderedString;
			case UrlUtil.PG_RACES: return Renderer.race.getCompactRenderedString;
			case UrlUtil.PG_DEITIES: return Renderer.deity.getCompactRenderedString;
			case UrlUtil.PG_OBJECTS: return Renderer.object.getCompactRenderedString;
			case UrlUtil.PG_TRAPS_HAZARDS: return Renderer.traphazard.getCompactRenderedString;
			case UrlUtil.PG_VARIATNRULES: return Renderer.variantrule.getCompactRenderedString;
			case UrlUtil.PG_CULTS_BOONS: return Renderer.cultboon.getCompactRenderedString;
			case UrlUtil.PG_TABLES: return Renderer.table.getCompactRenderedString;
			case UrlUtil.PG_VEHICLES: return Renderer.vehicle.getCompactRenderedString;
			case UrlUtil.PG_ACTIONS: return Renderer.action.getCompactRenderedString;
			case UrlUtil.PG_LANGUAGES: return Renderer.language.getCompactRenderedString;
			default: return null;
		}
	},

	_pageToFluffFn (page) {
		switch (page) {
			case UrlUtil.PG_BESTIARY: return Renderer.monster.pGetFluff;
			case UrlUtil.PG_ITEMS: return Renderer.item.pGetFluff;
			case UrlUtil.PG_CONDITIONS_DISEASES: return Renderer.condition.pGetFluff;
			case UrlUtil.PG_SPELLS: return Renderer.spell.pGetFluff;
			case UrlUtil.PG_RACES: return Renderer.race.pGetFluff;
			case UrlUtil.PG_BACKGROUNDS: return Renderer.background.pGetFluff;
			case UrlUtil.PG_LANGUAGES: return Renderer.language.pGetFluff;
			case UrlUtil.PG_VEHICLES: return Renderer.vehicle.pGetFluff;
			default: return null;
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
									isBookContent: true
								}
							);
						} else {
							Renderer.hover.doPopoutCurPage(evt, toList, Hist.lastLoadedId);
						}
					}
				}
		);
	},

	$getHoverContent_stats (page, toRender) {
		const renderFn = Renderer.hover._pageToRenderFn(page);
		return $$`<table class="stats">${renderFn(toRender)}</table>`;
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

		return $$`<table class="stats">${Renderer.generic.getCompactRenderedString(toRender)}</table>`;
	},

	$getHoverContent_statsCode (toRender) {
		const cleanCopy = DataUtil.cleanJson(MiscUtil.copy(toRender));
		return Renderer.hover.$getHoverContent_miscCode(
			`${cleanCopy.name} \u2014 Source Data`,
			JSON.stringify(cleanCopy, null, "\t")
		);
	},

	$getHoverContent_miscCode (name, code) {
		const toRenderCode = {
			type: "code",
			name,
			preformatted: code
		};
		return $$`<table class="stats stats--book">${Renderer.get().render(toRenderCode)}</table>`;
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

		return $$`<table class="stats ${opts.isBookContent || opts.isLargeBookContent ? "stats--book" : ""} ${opts.isLargeBookContent ? "stats--book-large" : ""}">${Renderer.hover.getGenericCompactRenderedString(toRender, opts.depth || 0)}</table>`;
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
				isPermanent: true
			}
		);
	}
};

Renderer.dice = {
	SYSTEM_USER: {
		name: "Avandra" // goddess of luck
	},
	POS_INFINITE: 100000000000000000000, // larger than this, and we start to see "e" numbers appear

	_$wrpRoll: null,
	_$minRoll: null,
	_$iptRoll: null,
	_$outRoll: null,
	_$head: null,
	_hist: [],
	_histIndex: null,
	_$lastRolledBy: null,
	_storage: null,

	_isManualMode: false,

	// region Utilities
	DICE: [4, 6, 8, 10, 12, 20, 100],
	getNextDice (faces) {
		const idx = Renderer.dice.DICE.indexOf(faces);
		if (~idx) return Renderer.dice.DICE[idx + 1];
		else return null;
	},

	getPreviousDice (faces) {
		const idx = Renderer.dice.DICE.indexOf(faces);
		if (~idx) return Renderer.dice.DICE[idx - 1];
		else return null;
	},
	// endregion

	// region DM Screen integration
	_panel: null,
	bindDmScreenPanel (panel, title) {
		if (Renderer.dice._panel) { // there can only be one roller box
			Renderer.dice.unbindDmScreenPanel();
		}
		Renderer.dice._showBox();
		Renderer.dice._panel = panel;
		panel.doPopulate_Rollbox(title);
	},

	unbindDmScreenPanel () {
		if (Renderer.dice._panel) {
			$(`body`).append(Renderer.dice._$wrpRoll);
			Renderer.dice._panel.close$TabContent();
			Renderer.dice._panel = null;
			Renderer.dice._hideBox();
			Renderer.dice._$wrpRoll.removeClass("rollbox-panel");
		}
	},

	get$Roller () {
		return Renderer.dice._$wrpRoll;
	},
	// endregion

	/** Silently roll an expression and get the result. */
	parseRandomise2 (str) {
		if (!str || !str.trim()) return null;
		const tree = Renderer.dice.lang.getTree3(str);
		if (tree) return tree.evl({});
		else return null;
	},

	/** Silently get the average of an expression. */
	parseAverage (str) {
		if (!str || !str.trim()) return null;
		const tree = Renderer.dice.lang.getTree3(str);
		if (tree) return tree.avg({});
		else return null;
	},

	// region Roll box UI
	_showBox () {
		if (Renderer.dice._$wrpRoll.css("display") !== "flex") {
			Renderer.dice._$minRoll.hide();
			Renderer.dice._$wrpRoll.css("display", "flex");
			Renderer.dice._$iptRoll.prop("placeholder", `${Renderer.dice._getRandomPlaceholder()} or "/help"`);
		}
	},

	_hideBox () {
		Renderer.dice._$minRoll.show();
		Renderer.dice._$wrpRoll.css("display", "");
	},

	_getRandomPlaceholder () {
		const count = RollerUtil.randomise(10);
		const faces = Renderer.dice.DICE[RollerUtil.randomise(Renderer.dice.DICE.length - 1)];
		const mod = (RollerUtil.randomise(3) - 2) * RollerUtil.randomise(10);
		const drop = (count > 1) && RollerUtil.randomise(5) === 5;
		const dropDir = drop ? RollerUtil.randomise(2) === 2 ? "h" : "l" : "";
		const dropAmount = drop ? RollerUtil.randomise(count - 1) : null;
		return `${count}d${faces}${drop ? `d${dropDir}${dropAmount}` : ""}${mod < 0 ? mod : mod > 0 ? `+${mod}` : ""}`;
	},

	/** Initialise the roll box UI. */
	async _pInit () {
		const $wrpRoll = $(`<div class="rollbox"></div>`);
		const $minRoll = $(`<div class="rollbox-min"><span class="glyphicon glyphicon-chevron-up"></span></div>`).on("click", () => {
			Renderer.dice._showBox();
			Renderer.dice._$iptRoll.focus();
		});
		const $head = $(`<div class="head-roll"><span class="hdr-roll">Dice Roller</span><span class="delete-icon glyphicon glyphicon-remove"></span></div>`)
			.on("click", () => {
				if (!Renderer.dice._panel) Renderer.dice._hideBox();
			});
		const $outRoll = $(`<div class="out-roll">`);
		const $iptRoll = $(`<input class="ipt-roll form-control" autocomplete="off" spellcheck="false">`)
			.on("keypress", async e => {
				if (e.which === 13) { // return
					await Renderer.dice.pRoll2($iptRoll.val(), {
						isUser: true,
						name: "Anon"
					});
					$iptRoll.val("");
				}
				e.stopPropagation();
			}).on("keydown", (e) => {
				// arrow keys only work on keydown
				if (e.which === 38) { // up arrow
					Renderer.dice._prevHistory()
				} else if (e.which === 40) { // down arrow
					Renderer.dice._nextHistory()
				}
			});
		$wrpRoll.append($head).append($outRoll).append($iptRoll);

		Renderer.dice._$wrpRoll = $wrpRoll;
		Renderer.dice._$minRoll = $minRoll;
		Renderer.dice._$head = $head;
		Renderer.dice._$outRoll = $outRoll;
		Renderer.dice._$iptRoll = $iptRoll;

		$(`body`).append($minRoll).append($wrpRoll);

		$wrpRoll.on("click", ".out-roll-item-code", (evt) => Renderer.dice._$iptRoll.val($(evt.target).text()).focus());

		Renderer.dice.storage = await StorageUtil.pGet(VeCt.STORAGE_ROLLER_MACRO) || {};
	},

	_prevHistory: () => {
		Renderer.dice._histIndex--;
		Renderer.dice._cleanHistoryIndex();
		Renderer.dice._$iptRoll.val(Renderer.dice._hist[Renderer.dice._histIndex]);
	},

	_nextHistory: () => {
		Renderer.dice._histIndex++;
		Renderer.dice._cleanHistoryIndex();
		Renderer.dice._$iptRoll.val(Renderer.dice._hist[Renderer.dice._histIndex]);
	},

	_cleanHistoryIndex: () => {
		if (!Renderer.dice._hist.length) {
			Renderer.dice._histIndex = null;
		} else {
			Renderer.dice._histIndex = Math.min(Renderer.dice._hist.length, Math.max(Renderer.dice._histIndex, 0))
		}
	},

	_addHistory: (str) => {
		Renderer.dice._hist.push(str);
		// point index at the top of the stack
		Renderer.dice._histIndex = Renderer.dice._hist.length;
	},

	_scrollBottom: () => {
		Renderer.dice._$outRoll.scrollTop(1e10);
	},
	// endregion

	// region Event handling
	_contextRollLabel: "rollChooser",
	_contextPromptLabel: "rollPrompt",
	async pRollerClickUseData (evt, ele) {
		const $ele = $(ele);
		const rollData = $ele.data("packed-dice");
		let name = $ele.data("roll-name");
		let shiftKey = evt.shiftKey;
		let ctrlKey = evt.ctrlKey || evt.metaKey;

		const options = rollData.toRoll.split(";").map(it => it.trim()).filter(Boolean);

		let chosenRollData;
		if (options.length > 1) {
			chosenRollData = await new Promise(resolve => {
				const cpy = MiscUtil.copy(rollData);

				ContextUtil.doInitContextMenu(
					Renderer.dice._contextRollLabel,
					(mostRecentEvt, _1, _2, _3, invokedOnId) => {
						shiftKey = shiftKey || mostRecentEvt.shiftKey;
						ctrlKey = ctrlKey || (mostRecentEvt.ctrlKey || mostRecentEvt.metaKey);
						cpy.toRoll = options[invokedOnId];
						resolve(cpy);
					},
					[
						new ContextUtil.Action("Choose Roll", null, {isDisabled: true}),
						null,
						...options.map(it => `Roll ${it}`)
					]
				);

				ContextUtil.handleOpenContextMenu(evt, ele, Renderer.dice._contextRollLabel, (choseOption) => {
					if (!choseOption) resolve();
				});
			});
		} else chosenRollData = rollData;

		if (!chosenRollData) return;

		const rePrompt = /#\$prompt_number:?([^$]*)\$#/g;
		const results = [];
		let m;
		while ((m = rePrompt.exec(chosenRollData.toRoll))) {
			const optionsRaw = m[1];
			const opts = {};
			if (optionsRaw) {
				const spl = optionsRaw.split(",");
				spl.map(it => it.trim()).forEach(part => {
					const [k, v] = part.split("=").map(it => it.trim());
					switch (k) {
						case "min":
						case "max":
							opts[k] = Number(v); break;
						default:
							opts[k] = v; break;
					}
				});
			}

			if (opts.min == null) opts.min = 0;
			if (opts.max == null) opts.max = Renderer.dice.POS_INFINITE;
			if (opts.default == null) opts.default = 0;

			const input = await InputUiUtil.pGetUserNumber(opts);
			if (input == null) return;
			results.push(input);
		}

		const rollDataCpy = MiscUtil.copy(chosenRollData);
		rePrompt.lastIndex = 0;
		rollDataCpy.toRoll = rollDataCpy.toRoll.replace(rePrompt, () => results.shift());

		// If there's a prompt, prompt the user to select the dice
		let rollDataCpyToRoll;
		if (rollData.prompt) {
			rollDataCpyToRoll = await new Promise(resolve => {
				const sortedKeys = Object.keys(rollDataCpy.prompt.options).sort(SortUtil.ascSortLower);

				ContextUtil.doInitContextMenu(
					Renderer.dice._contextPromptLabel,
					(mostRecentEvt, _1, _2, _3, invokedOnId) => {
						if (invokedOnId == null) resolve();

						shiftKey = shiftKey || mostRecentEvt.shiftKey;
						ctrlKey = ctrlKey || (mostRecentEvt.ctrlKey || mostRecentEvt.metaKey);
						const k = sortedKeys[invokedOnId];
						const fromScaling = rollDataCpy.prompt.options[k];
						if (!fromScaling) {
							name = "";
							resolve(rollDataCpy);
						} else {
							name = rollDataCpy.prompt.mode === "psi" ? `${k} psi activation` : `${Parser.spLevelToFull(k)}-level cast`;
							rollDataCpy.toRoll += `+${fromScaling}`;
							resolve(rollDataCpy);
						}
					},
					[
						new ContextUtil.Action(rollDataCpy.prompt.entry, null, {isDisabled: true}),
						null,
						...sortedKeys.map(it => rollDataCpy.prompt.mode === "psi" ? `${it} point${it === "1" ? "" : "s"}` : `${Parser.spLevelToFull(it)} level`)
					]
				);

				ContextUtil.handleOpenContextMenu(evt, ele, Renderer.dice._contextPromptLabel, (choseOption) => {
					if (!choseOption) resolve();
				});
			});
		} else rollDataCpyToRoll = rollDataCpy;

		if (!rollDataCpyToRoll) return;
		await Renderer.dice.pRollerClick({shiftKey, ctrlKey}, ele, JSON.stringify(rollDataCpyToRoll), name);
	},

	__rerollNextInlineResult (ele) {
		const $ele = $(ele);
		const $result = $ele.next(`.result`);
		const r = Renderer.dice.__rollPackedData($ele);
		$result.text(r);
	},

	__rollPackedData ($ele) {
		const tree = Renderer.dice.lang.getTree3($ele.data("packed-dice").toRoll);
		return tree.evl({});
	},

	_pRollerClick_getMsgBug (total) { return `<span class="message">No result found matching roll ${total}?! <span class="help--subtle" title="Bug!">🐛</span></span>`; },

	async pRollerClick (evtMock, ele, packed, name) {
		const $ele = $(ele);
		const entry = JSON.parse(packed);
		function attemptToGetNameOfRoll () {
			// try use table caption
			let titleMaybe = $(ele).closest(`table:not(.stats)`).children(`caption`).text();
			if (titleMaybe) return titleMaybe.trim();

			// try use list item title
			titleMaybe = $(ele).parent().children(`.list-item-title`).text();
			if (titleMaybe) return titleMaybe.trim();

			// use the section title, where applicable
			titleMaybe = $(ele).closest(`div`).children(`.rd__h`).first().find(`.entry-title-inner`).text();
			if (titleMaybe) {
				titleMaybe = titleMaybe.trim().replace(/[.,:]\s*$/, "");
				return titleMaybe;
			}

			// try use stats table name row
			titleMaybe = $(ele).closest(`table.stats`).children(`tbody`).first().children(`tr`).first().find(`th.name .stats-name`).text();
			if (titleMaybe) return titleMaybe.trim();

			if (UrlUtil.getCurrentPage() === UrlUtil.PG_CHARACTERS) {
				// try use mini-entity name
				titleMaybe = ($(ele).closest(`.chr-entity__row`).find(".chr-entity__ipt-name").val() || "").trim();
				if (titleMaybe) return titleMaybe;
			}

			return titleMaybe;
		}

		function attemptToGetNameOfRoller () {
			const $hov = $ele.closest(`.hwin`);
			if ($hov.length) return $hov.find(`.stats-name`).first().text();
			const $roll = $ele.closest(`.out-roll-wrp`);
			if ($roll.length) return $roll.data("name");
			const $dispPanelTitle = $ele.closest(`.dm-screen-panel`).children(`.panel-control-title`);
			if ($dispPanelTitle.length) return $dispPanelTitle.text().trim();
			let name = document.title.replace("- 5etools", "").trim();
			return name === "DM Screen" ? "Dungeon Master" : name;
		}

		function _$getTdsFromTotal (total) {
			const $table = $ele.closest(`table`);
			const $tdRoll = $table.find(`td`).filter((i, e) => {
				const $e = $(e);
				if (!$e.closest(`table`).is($table)) return false;
				return total >= Number($e.data("roll-min")) && total <= Number($e.data("roll-max"));
			});
			if ($tdRoll.length && $tdRoll.nextAll().length) {
				return $tdRoll.nextAll().get();
			}
			return null;
		}

		function _rollInlineRollers ($ele) {
			$ele.find(`.render-roller`).each((i, e) => {
				const $e = $(e);
				const r = Renderer.dice.__rollPackedData($e);
				$e.attr("onclick", `Renderer.dice.__rerollNextInlineResult(this)`);
				$e.after(` (<span class="result">${r}</span>)`);
			});
		}

		function fnGetMessageTable (total) {
			const elesTd = _$getTdsFromTotal(total);
			if (elesTd) {
				const tableRow = elesTd.map(ele => ele.innerHTML.trim()).filter(it => it).join(" | ");
				const $row = $(`<span class="message">${tableRow}</span>`);
				_rollInlineRollers($ele);
				return $row.html();
			}
			return Renderer.dice._pRollerClick_getMsgBug(total);
		}

		function fnGetMessageGeneratorTable (ix, total) {
			const elesTd = _$getTdsFromTotal(total);
			if (elesTd) {
				const $row = $(`<span class="message">${elesTd[ix].innerHTML.trim()}</span>`);
				_rollInlineRollers($ele);
				return $row.html();
			}
			return Renderer.dice._pRollerClick_getMsgBug(total);
		}

		async function pRollGeneratorTable () {
			Renderer.dice.addElement(rolledBy, `<i>${rolledBy.label}:</i>`);

			const out = [];
			const numRolls = Number($parent.attr("data-rd-namegeneratorrolls"));
			const $ths = $ele.closest(`table`).find(`th`);
			for (let i = 0; i < numRolls; ++i) {
				const cpyRolledBy = MiscUtil.copy(rolledBy);
				cpyRolledBy.label = $($ths.get(i + 1)).text().trim();

				const result = await Renderer.dice.pRollEntry(modRollMeta.entry, cpyRolledBy, {fnGetMessage: fnGetMessageGeneratorTable.bind(null, i), rollCount: modRollMeta.rollCount});
				const elesTd = _$getTdsFromTotal(result);

				if (!elesTd) {
					out.push(`(no result)`);
					continue;
				}

				out.push(elesTd[i].innerHTML.trim());
			}

			Renderer.dice.addElement(rolledBy, `= ${out.join(" ")}`);
		}

		const rolledBy = {
			name: attemptToGetNameOfRoller(),
			label: name != null ? name : attemptToGetNameOfRoll(ele)
		};

		const modRollMeta = Renderer.dice.getEventModifiedRollMeta(evtMock, entry);
		let $parent = $ele.parent();
		while ($parent.length) {
			if ($parent.is("th") || $parent.is("p") || $parent.is("table")) break;
			$parent = $parent.parent();
		}

		if ($parent.is("th")) {
			const isRoller = $parent.attr("data-rd-isroller") === "true";
			if (isRoller && $parent.attr("data-rd-namegeneratorrolls")) {
				pRollGeneratorTable();
			} else {
				Renderer.dice.pRollEntry(modRollMeta.entry, rolledBy, {fnGetMessage: fnGetMessageTable, rollCount: modRollMeta.rollCount});
			}
		} else Renderer.dice.pRollEntry(modRollMeta.entry, rolledBy, {rollCount: modRollMeta.rollCount});
	},

	getEventModifiedRollMeta (evt, entry) {
		// Change roll type/count depending on CTRL/SHIFT status
		const out = {rollCount: 1, entry};

		if (evt.shiftKey) {
			if (entry.subType === "damage") { // If SHIFT is held, roll crit
				const dice = [];
				// TODO(future) in order for this to correctly catch everything, would need to parse the toRoll as a tree and then pull all dice expressions from the first level of that tree
				entry.toRoll
					.replace(/\s+/g, "") // clean whitespace
					.replace(/\d*?d\d+/gi, m0 => dice.push(m0));
				entry.toRoll = `${entry.toRoll}${dice.length ? `+${dice.join("+")}` : ""}`;
			} else if (entry.subType === "d20") { // If SHIFT is held, roll advantage
				// If we have a cached d20mod value, use it
				if (entry.d20mod != null) entry.toRoll = `2d20dl1${entry.d20mod}`;
				else entry.toRoll = entry.toRoll.replace(/^\s*1?\s*d\s*20/, "2d20dl1");
			} else out.rollCount = 2; // otherwise, just roll twice
		}

		if (evt.ctrlKey || evt.metaKey) {
			if (entry.subType === "damage") { // If CTRL is held, half the damage
				entry.toRoll = `floor((${entry.toRoll}) / 2)`;
			} else if (entry.subType === "d20") { // If CTRL is held, roll disadvantage (assuming SHIFT is not held)
				// If we have a cached d20mod value, use it
				if (entry.d20mod != null) entry.toRoll = `2d20dh1${entry.d20mod}`;
				else entry.toRoll = entry.toRoll.replace(/^\s*1?\s*d\s*20/, "2d20dh1");
			} else out.rollCount = 2; // otherwise, just roll twice
		}

		return out;
	},
	// endregion

	/**
	 * Parse and roll a string, and display the result in the roll box.
	 * Returns the total rolled, if available.
	 * @param str
	 * @param rolledBy
	 * @param rolledBy.isUser
	 * @param rolledBy.name The name of the roller.
	 * @param rolledBy.label The label for this roll.
	 * @param [opts] Options object.
	 * @param [opts.isResultUsed] If an input box should be provided for the user to enter the result (manual mode only).
	 */
	async pRoll2 (str, rolledBy, opts) {
		opts = opts || {};
		str = str.trim();
		if (!str) return;
		if (rolledBy.isUser) Renderer.dice._addHistory(str);

		if (str.startsWith("/")) Renderer.dice._handleCommand(str, rolledBy);
		else if (str.startsWith("#")) return Renderer.dice._pHandleSavedRoll(str, rolledBy, opts);
		else {
			const [head, ...tail] = str.split(":");
			if (tail.length) {
				str = tail.join(":");
				rolledBy.label = head;
			}
			const tree = Renderer.dice.lang.getTree3(str);
			return Renderer.dice._pHandleRoll2(tree, rolledBy, opts);
		}
	},

	/**
	 * Parse and roll an entry, and display the result in the roll box.
	 * Returns the total rolled, if available.
	 * @param entry
	 * @param rolledBy
	 * @param [opts] Options object.
	 * @param [opts.isResultUsed] If an input box should be provided for the user to enter the result (manual mode only).
	 * @param [opts.rollCount]
	 */
	async pRollEntry (entry, rolledBy, opts) {
		opts = opts || {};

		const rollCount = Math.round(opts.rollCount || 1);
		delete opts.rollCount;
		if (rollCount <= 0) throw new Error(`Invalid roll count: ${rollCount} (must be a positive integer)`);

		const tree = Renderer.dice.lang.getTree3(entry.toRoll);
		tree.successThresh = entry.successThresh;
		tree.successMax = entry.successMax;

		// arbitrarily return the result of the highest roll if we roll multiple times
		const results = [];
		if (rollCount > 1) Renderer.dice._showMessage(`Rolling twice...`, rolledBy);
		for (let i = 0; i < rollCount; ++i) {
			const result = await Renderer.dice._pHandleRoll2(tree, rolledBy, opts);
			if (result == null) return null;
			results.push(result);
		}
		return Math.max(...results);
	},

	/**
	 * @param tree
	 * @param rolledBy
	 * @param [opts] Options object.
	 * @param [opts.fnGetMessage]
	 * @param [opts.isResultUsed]
	 */
	_pHandleRoll2 (tree, rolledBy, opts) {
		opts = opts || {};
		if (Renderer.dice._isManualMode) return Renderer.dice._pHandleRoll2_manual(tree, rolledBy, opts);
		else return Renderer.dice._pHandleRoll2_automatic(tree, rolledBy, opts);
	},

	_pHandleRoll2_automatic (tree, rolledBy, opts) {
		opts = opts || {};

		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		const $out = Renderer.dice._$lastRolledBy;

		if (tree) {
			const meta = {};
			const result = tree.evl(meta);
			const fullHtml = (meta.html || []).join("");
			const allMax = meta.allMax && meta.allMax.length && !(meta.allMax.filter(it => !it).length);
			const allMin = meta.allMin && meta.allMin.length && !(meta.allMin.filter(it => !it).length);

			const lbl = rolledBy.label && (!rolledBy.name || rolledBy.label.trim().toLowerCase() !== rolledBy.name.trim().toLowerCase()) ? rolledBy.label : null;

			const totalPart = tree.successThresh
				? `<span class="roll">${result > (tree.successMax || 100) - tree.successThresh ? "Success!" : "Failure"}</span>`
				: `<span class="roll ${allMax ? "roll-max" : allMin ? "roll-min" : ""}">${result}</span>`;

			const title = `${rolledBy.name ? `${rolledBy.name} \u2014 ` : ""}${lbl ? `${lbl}: ` : ""}${tree}`;

			$out.append(`
				<div class="out-roll-item" title="${title}">
					<div>
						${lbl ? `<span class="roll-label">${lbl}: </span>` : ""}
						${totalPart}
						<span class="all-rolls ve-muted">${fullHtml}</span>
						${opts.fnGetMessage ? `<span class="message">${opts.fnGetMessage(result)}</span>` : ""}
					</div>
					<div class="out-roll-item-button-wrp">
						<button title="Copy to input" class="btn btn-default btn-xs btn-copy-roll" onclick="Renderer.dice._$iptRoll.val('${tree.toString().replace(/\s+/g, "")}'); Renderer.dice._$iptRoll.focus()"><span class="glyphicon glyphicon-pencil"></span></button>
					</div>
				</div>`);

			ExtensionUtil.doSendRoll({dice: tree.toString(), rolledBy: rolledBy.name, label: lbl});

			Renderer.dice._scrollBottom();
			return result;
		} else {
			$out.append(`<div class="out-roll-item">Invalid input! Try &quot;/help&quot;</div>`);
			Renderer.dice._scrollBottom();
			return null;
		}
	},

	_pHandleRoll2_manual (tree, rolledBy, opts) {
		opts = opts || {};

		if (!tree) return JqueryUtil.doToast({type: "danger", content: `Invalid roll input!`});

		const title = (rolledBy.label || "").toTitleCase() || "Roll Dice";
		const $dispDice = $(`<div class="p-2 bold flex-vh-center rll__prompt-header">${tree.toString()}</div>`);
		if (opts.isResultUsed) {
			return InputUiUtil.pGetUserNumber({
				title,
				$elePre: $dispDice
			});
		} else {
			const {$modalInner} = UiUtil.getShowModal({
				title,
				isMinHeight0: true
			});
			$dispDice.appendTo($modalInner);
			return null;
		}
	},

	_showMessage (message, rolledBy) {
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		const $out = Renderer.dice._$lastRolledBy;
		$out.append(`<div class="out-roll-item out-roll-item--message">${message}</div>`);
		Renderer.dice._scrollBottom();
	},

	_validCommands: new Set(["/c", "/cls", "/clear"]),
	_handleCommand (com, rolledBy) {
		Renderer.dice._showMessage(`<span class="out-roll-item-code">${com}</span>`, rolledBy); // parrot the user's command back to them
		const PREF_MACRO = "/macro";
		function showInvalid () {
			Renderer.dice._showMessage("Invalid input! Try &quot;/help&quot;", Renderer.dice.SYSTEM_USER);
		}

		function checkLength (arr, desired) {
			return arr.length === desired;
		}

		async function pSave () {
			await StorageUtil.pSet(VeCt.STORAGE_ROLLER_MACRO, Renderer.dice.storage);
		}

		if (com === "/help" || com === "/h") {
			Renderer.dice._showMessage(
				`<ul class="rll__list">
					<li>Keep highest; <span class="out-roll-item-code">4d6kh3</span></li>
					<li>Drop lowest; <span class="out-roll-item-code">4d6dl1</span></li>
					<li>Drop highest; <span class="out-roll-item-code">3d4dh1</span></li>
					<li>Keep lowest; <span class="out-roll-item-code">3d4kl1</span></li>

					<li>Reroll equal; <span class="out-roll-item-code">2d4r1</span></li>
					<li>Reroll less; <span class="out-roll-item-code">2d4r&lt;2</span></li>
					<li>Reroll less or equal; <span class="out-roll-item-code">2d4r&lt;=2</span></li>
					<li>Reroll greater; <span class="out-roll-item-code">2d4r&gt;2</span></li>
					<li>Reroll greater equal; <span class="out-roll-item-code">2d4r&gt;=3</span></li>

					<li>Explode equal; <span class="out-roll-item-code">2d4x4</span></li>
					<li>Explode less; <span class="out-roll-item-code">2d4x&lt;2</span></li>
					<li>Explode less or equal; <span class="out-roll-item-code">2d4x&lt;=2</span></li>
					<li>Explode greater; <span class="out-roll-item-code">2d4x&gt;2</span></li>
					<li>Explode greater equal; <span class="out-roll-item-code">2d4x&gt;=3</span></li>

					<li>Count Successes equal; <span class="out-roll-item-code">2d4cs=4</span></li>
					<li>Count Successes less; <span class="out-roll-item-code">2d4cs&lt;2</span></li>
					<li>Count Successes less or equal; <span class="out-roll-item-code">2d4cs&lt;=2</span></li>
					<li>Count Successes greater; <span class="out-roll-item-code">2d4cs&gt;2</span></li>
					<li>Count Successes greater equal; <span class="out-roll-item-code">2d4cs&gt;=3</span></li>

					<li>Dice pools; <span class="out-roll-item-code">{2d8, 1d6}</span></li>
					<li>Dice pools with modifiers; <span class="out-roll-item-code">{1d20+7, 10}kh1</span></li>

					<li>Rounding; <span class="out-roll-item-code">floor(1.5)</span>, <span class="out-roll-item-code">ceil(1.5)</span>, <span class="out-roll-item-code">round(1.5)</span></li>

					<li>Average; <span class="out-roll-item-code">avg(8d6)</span></li>
				</ul>
				Up and down arrow keys cycle input history.<br>
				Anything before a colon is treated as a label (<span class="out-roll-item-code">Fireball: 8d6</span>)<br>
Use <span class="out-roll-item-code">${PREF_MACRO} list</span> to list saved macros.<br>
				Use <span class="out-roll-item-code">${PREF_MACRO} add myName 1d2+3</span> to add (or update) a macro. Macro names should not contain spaces or hashes.<br>
				Use <span class="out-roll-item-code">${PREF_MACRO} remove myName</span> to remove a macro.<br>
				Use <span class="out-roll-item-code">#myName</span> to roll a macro.<br>
				Use <span class="out-roll-item-code">/clear</span> to clear the roller.`,
				Renderer.dice.SYSTEM_USER
			);
		} else if (com.startsWith(PREF_MACRO)) {
			const [_, mode, ...others] = com.split(/\s+/);

			if (!["list", "add", "remove", "clear"].includes(mode)) showInvalid();
			else {
				switch (mode) {
					case "list":
						if (checkLength(others, 0)) {
							Object.keys(Renderer.dice.storage).forEach(name => {
								Renderer.dice._showMessage(`<span class="out-roll-item-code">#${name}</span> \u2014 ${Renderer.dice.storage[name]}`, Renderer.dice.SYSTEM_USER);
							})
						} else {
							showInvalid();
						}
						break;
					case "add": {
						if (checkLength(others, 2)) {
							const [name, macro] = others;
							if (name.includes(" ") || name.includes("#")) showInvalid();
							else {
								Renderer.dice.storage[name] = macro;
								pSave()
									.then(() => Renderer.dice._showMessage(`Saved macro <span class="out-roll-item-code">#${name}</span>`, Renderer.dice.SYSTEM_USER));
							}
						} else {
							showInvalid();
						}
						break;
					}
					case "remove":
						if (checkLength(others, 1)) {
							if (Renderer.dice.storage[others[0]]) {
								delete Renderer.dice.storage[others[0]];
								pSave()
									.then(() => Renderer.dice._showMessage(`Removed macro <span class="out-roll-item-code">#${others[0]}</span>`, Renderer.dice.SYSTEM_USER));
							} else {
								Renderer.dice._showMessage(`Macro <span class="out-roll-item-code">#${others[0]}</span> not found`, Renderer.dice.SYSTEM_USER);
							}
						} else {
							showInvalid();
						}
						break;
				}
			}
		} else if (Renderer.dice._validCommands.has(com)) {
			switch (com) {
				case "/c":
				case "/cls":
				case "/clear":
					Renderer.dice._$outRoll.empty();
					Renderer.dice._$lastRolledBy.empty();
					Renderer.dice._$lastRolledBy = null;
					break;
			}
		} else showInvalid();
	},

	_pHandleSavedRoll (id, rolledBy, opts) {
		id = id.replace(/^#/, "");
		const macro = Renderer.dice.storage[id];
		if (macro) {
			rolledBy.label = id;
			const tree = Renderer.dice.lang.getTree3(macro);
			return Renderer.dice._pHandleRoll2(tree, rolledBy, opts);
		} else Renderer.dice._showMessage(`Macro <span class="out-roll-item-code">#${id}</span> not found`, Renderer.dice.SYSTEM_USER);
	},

	addRoll (rolledBy, msgText) {
		if (!msgText.trim()) return;
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		Renderer.dice._$outRoll.prepend(`<div class="out-roll-item" title="${rolledBy.name || ""}">${msgText}</div>`);
		Renderer.dice._scrollBottom();
	},

	addElement (rolledBy, $ele) {
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		$$`<div class="out-roll-item out-roll-item--message">${$ele}</div>`.appendTo(Renderer.dice._$lastRolledBy);
		Renderer.dice._scrollBottom();
	},

	_checkHandleName (name) {
		if (!Renderer.dice._$lastRolledBy || Renderer.dice._$lastRolledBy.data("name") !== name) {
			Renderer.dice._$outRoll.prepend(`<div class="ve-muted out-roll-id">${name}</div>`);
			Renderer.dice._$lastRolledBy = $(`<div class="out-roll-wrp"></div>`).data("name", name);
			Renderer.dice._$outRoll.prepend(Renderer.dice._$lastRolledBy);
		}
	}
};

Renderer.dice.lang = {
	validate3 (str) {
		str = str.trim();

		// region Lexing
		let lexed;
		try {
			lexed = Renderer.dice.lang._lex3(str)
		} catch (e) {
			return e.message;
		}
		// endregion

		// region Parsing
		try {
			Renderer.dice.lang._parse3(lexed);
		} catch (e) {
			return e.message;
		}
		// endregion

		return null;
	},

	getTree3 (str, isSilent = true) {
		str = str.trim();
		if (isSilent) {
			try {
				const lexed = Renderer.dice.lang._lex3(str);
				return Renderer.dice.lang._parse3(lexed);
			} catch (e) {
				return null;
			}
		} else {
			const lexed = Renderer.dice.lang._lex3(str);
			return Renderer.dice.lang._parse3(lexed);
		}
	},

	// region Lexer
	_M_NUMBER_CHAR: /[0-9.]/,
	_M_SYMBOL_CHAR: /[-+/*^=><florceidhkxunavgs,]/,

	_M_NUMBER: /^[\d.,]+$/,
	_lex3 (str) {
		const self = {
			tokenStack: [],
			parenCount: 0,
			braceCount: 0,
			mode: null,
			token: ""
		};

		str = str
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "")
			.replace(/[×]/g, "*") // convert mult signs
			.replace(/\*\*/g, "^") // convert ** to ^
			.replace(/÷/g, "/") // convert div signs
			.replace(/--/g, "+") // convert double negatives
			.replace(/\+-|-\+/g, "-") // convert negatives
		;

		if (!str) return [];

		this._lex3_lex(self, str);

		return self.tokenStack;
	},

	_lex3_lex (self, l) {
		const len = l.length;

		for (let i = 0; i < len; ++i) {
			const c = l[i];

			switch (c) {
				case "(":
					self.parenCount++;
					this._lex3_outputToken(self);
					self.token = "(";
					this._lex3_outputToken(self);
					break;
				case ")":
					self.parenCount--;
					if (self.parenCount < 0) throw new Error(`Syntax error: closing <code>)</code> without opening <code>(</code>`);
					this._lex3_outputToken(self);
					self.token = ")";
					this._lex3_outputToken(self);
					break;
				case "{":
					self.braceCount++;
					this._lex3_outputToken(self);
					self.token = "{";
					this._lex3_outputToken(self);
					break;
				case "}":
					self.braceCount--;
					if (self.parenCount < 0) throw new Error(`Syntax error: closing <code>}</code> without opening <code>(</code>`);
					this._lex3_outputToken(self);
					self.token = "}";
					this._lex3_outputToken(self);
					break;
				// single-character operators
				case "+": case "-": case "*": case "/": case "^": case ",":
					this._lex3_outputToken(self);
					self.token += c;
					this._lex3_outputToken(self);
					break;
				default: {
					if (Renderer.dice.lang._M_NUMBER_CHAR.test(c)) {
						if (self.mode === "symbol") this._lex3_outputToken(self);
						self.token += c;
						self.mode = "text";
					} else if (Renderer.dice.lang._M_SYMBOL_CHAR.test(c)) {
						if (self.mode === "text") this._lex3_outputToken(self);
						self.token += c;
						self.mode = "symbol";
					} else throw new Error(`Syntax error: unexpected character <code>${c}</code>`);
					break;
				}
			}
		}

		// empty the stack of any remaining content
		this._lex3_outputToken(self);
	},

	_lex3_outputToken (self) {
		if (!self.token) return;

		switch (self.token) {
			case "(": self.tokenStack.push(Renderer.dice.tk.PAREN_OPEN); break;
			case ")": self.tokenStack.push(Renderer.dice.tk.PAREN_CLOSE); break;
			case "{": self.tokenStack.push(Renderer.dice.tk.BRACE_OPEN); break;
			case "}": self.tokenStack.push(Renderer.dice.tk.BRACE_CLOSE); break;
			case ",": self.tokenStack.push(Renderer.dice.tk.COMMA); break;
			case "+": self.tokenStack.push(Renderer.dice.tk.ADD); break;
			case "-": self.tokenStack.push(Renderer.dice.tk.SUB); break;
			case "*": self.tokenStack.push(Renderer.dice.tk.MULT); break;
			case "/": self.tokenStack.push(Renderer.dice.tk.DIV); break;
			case "^": self.tokenStack.push(Renderer.dice.tk.POW); break;
			case "floor": self.tokenStack.push(Renderer.dice.tk.FLOOR); break;
			case "ceil": self.tokenStack.push(Renderer.dice.tk.CEIL); break;
			case "round": self.tokenStack.push(Renderer.dice.tk.ROUND); break;
			case "avg": self.tokenStack.push(Renderer.dice.tk.AVERAGE); break;
			case "d": self.tokenStack.push(Renderer.dice.tk.DICE); break;
			case "dh": self.tokenStack.push(Renderer.dice.tk.DROP_HIGHEST); break;
			case "kh": self.tokenStack.push(Renderer.dice.tk.KEEP_HIGHEST); break;
			case "dl": self.tokenStack.push(Renderer.dice.tk.DROP_LOWEST); break;
			case "kl": self.tokenStack.push(Renderer.dice.tk.KEEP_LOWEST); break;
			case "r": self.tokenStack.push(Renderer.dice.tk.REROLL_EXACT); break;
			case "r>": self.tokenStack.push(Renderer.dice.tk.REROLL_GT); break;
			case "r>=": self.tokenStack.push(Renderer.dice.tk.REROLL_GTEQ); break;
			case "r<": self.tokenStack.push(Renderer.dice.tk.REROLL_LT); break;
			case "r<=": self.tokenStack.push(Renderer.dice.tk.REROLL_LTEQ); break;
			case "x": self.tokenStack.push(Renderer.dice.tk.EXPLODE_EXACT); break;
			case "x>": self.tokenStack.push(Renderer.dice.tk.EXPLODE_GT); break;
			case "x>=": self.tokenStack.push(Renderer.dice.tk.EXPLODE_GTEQ); break;
			case "x<": self.tokenStack.push(Renderer.dice.tk.EXPLODE_LT); break;
			case "x<=": self.tokenStack.push(Renderer.dice.tk.EXPLODE_LTEQ); break;
			case "cs=": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_EXACT); break;
			case "cs>": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_GT); break;
			case "cs>=": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_GTEQ); break;
			case "cs<": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_LT); break;
			case "cs<=": self.tokenStack.push(Renderer.dice.tk.COUNT_SUCCESS_LTEQ); break;
			default: {
				if (Renderer.dice.lang._M_NUMBER.test(self.token)) {
					if (self.token.split(Parser._decimalSeparator).length > 2) throw new Error(`Syntax error: too many decimal separators <code>${self.token}</code>`);
					self.tokenStack.push(Renderer.dice.tk.NUMBER(self.token));
				} else throw new Error(`Syntax error: unexpected token <code>${self.token}</code>`);
			}
		}

		self.token = "";
	},
	// endregion

	// region Parser
	_parse3 (lexed) {
		const self = {
			ixSym: -1,
			syms: lexed,
			sym: null,
			lastAccepted: null
		};

		this._parse3_nextSym(self);
		return this._parse3_expression(self);
	},

	_parse3_nextSym (self) {
		const cur = self.syms[self.ixSym];
		self.ixSym++;
		self.sym = self.syms[self.ixSym];
		return cur;
	},

	_parse3_match (self, symbol) {
		if (self.sym == null) return false;
		if (symbol.type) symbol = symbol.type; // If it's a typed token, convert it to its underlying type
		return self.sym.type === symbol;
	},

	_parse3_accept (self, symbol) {
		if (this._parse3_match(self, symbol)) {
			const out = self.sym;
			this._parse3_nextSym(self);
			self.lastAccepted = out;
			return out;
		}
		return false;
	},

	_parse3_expect (self, symbol) {
		const accepted = this._parse3_accept(self, symbol);
		if (accepted) return accepted;
		if (self.sym) throw new Error(`Unexpected input: Expected <code>${symbol}</code> but found <code>${self.sym}</code>`);
		else throw new Error(`Unexpected end of input: Expected <code>${symbol}</code>`);
	},

	_parse3_factor (self) {
		if (this._parse3_accept(self, Renderer.dice.tk.TYP_NUMBER)) {
			// Combine comma-separated parts
			const syms = [self.lastAccepted];
			while (this._parse3_accept(self, Renderer.dice.tk.COMMA)) {
				const sym = this._parse3_expect(self, Renderer.dice.tk.TYP_NUMBER);
				syms.push(sym);
			}
			const sym = Renderer.dice.tk.NUMBER(syms.map(it => it.value).join(""));
			return new Renderer.dice.parsed.Factor(sym);
		} else if (
			this._parse3_match(self, Renderer.dice.tk.FLOOR)
			|| this._parse3_match(self, Renderer.dice.tk.CEIL)
			|| this._parse3_match(self, Renderer.dice.tk.ROUND)
			|| this._parse3_match(self, Renderer.dice.tk.AVERAGE)) {
			const children = [];

			children.push(this._parse3_nextSym(self));
			this._parse3_expect(self, Renderer.dice.tk.PAREN_OPEN);
			children.push(this._parse3_expression(self));
			this._parse3_expect(self, Renderer.dice.tk.PAREN_CLOSE);

			return new Renderer.dice.parsed.Function(children);
		} else if (this._parse3_accept(self, Renderer.dice.tk.PAREN_OPEN)) {
			const exp = this._parse3_expression(self);
			this._parse3_expect(self, Renderer.dice.tk.PAREN_CLOSE);
			return new Renderer.dice.parsed.Factor(exp, {hasParens: true})
		} else if (this._parse3_accept(self, Renderer.dice.tk.BRACE_OPEN)) {
			const children = [];

			children.push(this._parse3_expression(self));
			while (this._parse3_accept(self, Renderer.dice.tk.COMMA)) children.push(this._parse3_expression(self));

			this._parse3_expect(self, Renderer.dice.tk.BRACE_CLOSE);

			const modPart = [];
			this._parse3__dice_modifiers(self, modPart);

			return new Renderer.dice.parsed.Pool(children, modPart)
		} else {
			if (self.sym) throw new Error(`Unexpected input: <code>${self.sym}</code>`);
			else throw new Error(`Unexpected end of input`);
		}
	},

	_parse3_dice (self) {
		const children = [];

		// if we've omitting the X in XdY, add it here
		if (this._parse3_match(self, Renderer.dice.tk.DICE)) children.push(new Renderer.dice.parsed.Factor(Renderer.dice.tk.NUMBER(1)));
		else children.push(this._parse3_factor(self));

		while (this._parse3_match(self, Renderer.dice.tk.DICE)) {
			this._parse3_nextSym(self);
			children.push(this._parse3_factor(self));
			this._parse3__dice_modifiers(self, children);
		}
		return new Renderer.dice.parsed.Dice(children);
	},

	_parse3__dice_modifiers (self, children) { // used in both dice and dice pools
		if (
			this._parse3_match(self, Renderer.dice.tk.DROP_HIGHEST)
			|| this._parse3_match(self, Renderer.dice.tk.KEEP_HIGHEST)
			|| this._parse3_match(self, Renderer.dice.tk.DROP_LOWEST)
			|| this._parse3_match(self, Renderer.dice.tk.KEEP_LOWEST)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_EXACT)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_GT)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_GTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_LT)
			|| this._parse3_match(self, Renderer.dice.tk.REROLL_LTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_EXACT)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_GT)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_GTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_LT)
			|| this._parse3_match(self, Renderer.dice.tk.EXPLODE_LTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_EXACT)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_GT)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_GTEQ)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_LT)
			|| this._parse3_match(self, Renderer.dice.tk.COUNT_SUCCESS_LTEQ)
		) {
			children.push(this._parse3_nextSym(self));
			children.push(this._parse3_factor(self));
		}
	},

	_parse3_exponent (self) {
		const children = [];
		children.push(this._parse3_dice(self));
		while (this._parse3_match(self, Renderer.dice.tk.POW)) {
			this._parse3_nextSym(self);
			children.push(this._parse3_dice(self));
		}
		return new Renderer.dice.parsed.Exponent(children);
	},

	_parse3_term (self) {
		const children = [];
		children.push(this._parse3_exponent(self));
		while (this._parse3_match(self, Renderer.dice.tk.MULT) || this._parse3_match(self, Renderer.dice.tk.DIV)) {
			children.push(this._parse3_nextSym(self));
			children.push(this._parse3_exponent(self));
		}
		return new Renderer.dice.parsed.Term(children);
	},

	_parse3_expression (self) {
		const children = [];
		if (this._parse3_match(self, Renderer.dice.tk.ADD) || this._parse3_match(self, Renderer.dice.tk.SUB)) children.push(this._parse3_nextSym(self));
		children.push(this._parse3_term(self));
		while (this._parse3_match(self, Renderer.dice.tk.ADD) || this._parse3_match(self, Renderer.dice.tk.SUB)) {
			children.push(this._parse3_nextSym(self));
			children.push(this._parse3_term(self));
		}
		return new Renderer.dice.parsed.Expression(children);
	}
	// endregion
};

Renderer.dice.tk = {
	Token: class {
		/**
		 * @param type
		 * @param value
		 * @param asString
		 * @param [opts] Options object.
		 * @param [opts.isDiceModifier] If the token is a dice modifier, e.g. "dl"
		 * @param [opts.isSuccessMode] If the token is a "success"-based dice modifier, e.g. "cs="
		 */
		constructor (type, value, asString, opts) {
			opts = opts || {};
			this.type = type;
			this.value = value;
			this._asString = asString;
			if (opts.isDiceModifier) this.isDiceModifier = true;
			if (opts.isSuccessMode) this.isSuccessMode = true;
		}

		eq (other) { return other && other.type === this.type; }

		toString () {
			if (this._asString) return this._asString;
			return this.toDebugString();
		}

		toDebugString () { return `${this.type}${this.value ? ` :: ${this.value}` : ""}` }
	},

	_new (type, asString, opts) { return new Renderer.dice.tk.Token(type, null, asString, opts); },

	TYP_NUMBER: "NUMBER",
	TYP_DICE: "DICE",
	TYP_SYMBOL: "SYMBOL", // Cannot be created by lexing, only parsing

	NUMBER (val) { return new Renderer.dice.tk.Token(Renderer.dice.tk.TYP_NUMBER, val); }
};
Renderer.dice.tk.PAREN_OPEN = Renderer.dice.tk._new("PAREN_OPEN", "(");
Renderer.dice.tk.PAREN_CLOSE = Renderer.dice.tk._new("PAREN_CLOSE", ")");
Renderer.dice.tk.BRACE_OPEN = Renderer.dice.tk._new("BRACE_OPEN", "{");
Renderer.dice.tk.BRACE_CLOSE = Renderer.dice.tk._new("BRACE_CLOSE", "}");
Renderer.dice.tk.COMMA = Renderer.dice.tk._new("COMMA", ",");
Renderer.dice.tk.ADD = Renderer.dice.tk._new("ADD", "+");
Renderer.dice.tk.SUB = Renderer.dice.tk._new("SUB", "-");
Renderer.dice.tk.MULT = Renderer.dice.tk._new("MULT", "*");
Renderer.dice.tk.DIV = Renderer.dice.tk._new("DIV", "/");
Renderer.dice.tk.POW = Renderer.dice.tk._new("POW", "^");
Renderer.dice.tk.FLOOR = Renderer.dice.tk._new("FLOOR", "floor");
Renderer.dice.tk.CEIL = Renderer.dice.tk._new("CEIL", "ceil");
Renderer.dice.tk.ROUND = Renderer.dice.tk._new("ROUND", "round");
Renderer.dice.tk.AVERAGE = Renderer.dice.tk._new("AVERAGE", "avg");
Renderer.dice.tk.DICE = Renderer.dice.tk._new("DICE", "d");
Renderer.dice.tk.DROP_HIGHEST = Renderer.dice.tk._new("DH", "dh", {isDiceModifier: true});
Renderer.dice.tk.KEEP_HIGHEST = Renderer.dice.tk._new("KH", "kh", {isDiceModifier: true});
Renderer.dice.tk.DROP_LOWEST = Renderer.dice.tk._new("DL", "dl", {isDiceModifier: true});
Renderer.dice.tk.KEEP_LOWEST = Renderer.dice.tk._new("KL", "kl", {isDiceModifier: true});
Renderer.dice.tk.REROLL_EXACT = Renderer.dice.tk._new("REROLL", "r", {isDiceModifier: true});
Renderer.dice.tk.REROLL_GT = Renderer.dice.tk._new("REROLL_GT", "r>", {isDiceModifier: true});
Renderer.dice.tk.REROLL_GTEQ = Renderer.dice.tk._new("REROLL_GTEQ", "r>=", {isDiceModifier: true});
Renderer.dice.tk.REROLL_LT = Renderer.dice.tk._new("REROLL_LT", "r<", {isDiceModifier: true});
Renderer.dice.tk.REROLL_LTEQ = Renderer.dice.tk._new("REROLL_LTEQ", "r<=", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_EXACT = Renderer.dice.tk._new("EXPLODE", "x", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_GT = Renderer.dice.tk._new("EXPLODE_GT", "x>", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_GTEQ = Renderer.dice.tk._new("EXPLODE_GTEQ", "x>=", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_LT = Renderer.dice.tk._new("EXPLODE_LT", "x<", {isDiceModifier: true});
Renderer.dice.tk.EXPLODE_LTEQ = Renderer.dice.tk._new("EXPLODE_LTEQ", "x<=", {isDiceModifier: true});
Renderer.dice.tk.COUNT_SUCCESS_EXACT = Renderer.dice.tk._new("COUNT_SUCCESS_EXACT", "cs=", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_GT = Renderer.dice.tk._new("COUNT_SUCCESS_GT", "cs>", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_GTEQ = Renderer.dice.tk._new("COUNT_SUCCESS_GTEQ", "cs>=", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_LT = Renderer.dice.tk._new("COUNT_SUCCESS_LT", "cs<", {isDiceModifier: true, isSuccessMode: true});
Renderer.dice.tk.COUNT_SUCCESS_LTEQ = Renderer.dice.tk._new("COUNT_SUCCESS_LTEQ", "cs<=", {isDiceModifier: true, isSuccessMode: true});

Renderer.dice.AbstractSymbol = class {
	constructor () { this.type = Renderer.dice.tk.TYP_SYMBOL; }
	eq (symbol) { return symbol && this.type === symbol.type; }
	evl () { throw new Error("Unimplemented!"); }
	avg () { throw new Error("Unimplemented!"); }
	min () { throw new Error("Unimplemented!"); } // minimum value of all _rolls_, not the minimum possible result
	max () { throw new Error("Unimplemented!"); } // maximum value of all _rolls_, not the maximum possible result
	toString () { throw new Error("Unimplemented!"); }
	addToMeta (meta, html, text) {
		if (!meta) return;
		text = text || html;
		meta.html = meta.html || [];
		meta.text = meta.text || [];
		meta.html.push(html);
		meta.text.push(text);
	}
};

Renderer.dice.parsed = {
	_PARTITION_EQ: (r, compareTo) => r === compareTo,
	_PARTITION_GT: (r, compareTo) => r > compareTo,
	_PARTITION_GTEQ: (r, compareTo) => r >= compareTo,
	_PARTITION_LT: (r, compareTo) => r < compareTo,
	_PARTITION_LTEQ: (r, compareTo) => r <= compareTo,

	/**
	 * @param fnName
	 * @param meta
	 * @param vals
	 * @param modNodes
	 * @param opts Options object.
	 * @param [opts.fnGetRerolls] Function which takes a set of rolls to be rerolled and generates the next set of rolls.
	 * @param [opts.fnGetExplosions] Function which takes a set of rolls to be exploded and generates the next set of rolls.
	 */
	_handleModifiers (fnName, meta, vals, modNodes, opts) {
		opts = opts || {};

		const displayVals = vals.slice(); // copy the array so we can sort the original

		vals.sort(SortUtil.ascSortProp.bind(null, "val")).reverse();

		const [mod, modNumSym] = modNodes;
		const modNum = modNumSym[fnName]();

		switch (mod.type) {
			case Renderer.dice.tk.DROP_HIGHEST.type:
			case Renderer.dice.tk.KEEP_HIGHEST.type:
			case Renderer.dice.tk.DROP_LOWEST.type:
			case Renderer.dice.tk.KEEP_LOWEST.type: {
				const isHighest = mod.type.endsWith("H");

				const splitPoint = isHighest ? modNum : vals.length - modNum;

				const highSlice = vals.slice(0, splitPoint);
				const lowSlice = vals.slice(splitPoint, vals.length);

				switch (mod.type) {
					case Renderer.dice.tk.DROP_HIGHEST.type:
					case Renderer.dice.tk.KEEP_LOWEST.type:
						highSlice.forEach(val => val.isDropped = true);
						break;
					case Renderer.dice.tk.KEEP_HIGHEST.type:
					case Renderer.dice.tk.DROP_LOWEST.type:
						lowSlice.forEach(val => val.isDropped = true);
						break;
					default: throw new Error(`Unimplemented!`);
				}
				break;
			}

			case Renderer.dice.tk.REROLL_EXACT.type:
			case Renderer.dice.tk.REROLL_GT.type:
			case Renderer.dice.tk.REROLL_GTEQ.type:
			case Renderer.dice.tk.REROLL_LT.type:
			case Renderer.dice.tk.REROLL_LTEQ.type: {
				let fnPartition;
				switch (mod.type) {
					case Renderer.dice.tk.REROLL_EXACT.type: fnPartition = Renderer.dice.parsed._PARTITION_EQ; break;
					case Renderer.dice.tk.REROLL_GT.type: fnPartition = Renderer.dice.parsed._PARTITION_GT; break;
					case Renderer.dice.tk.REROLL_GTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_GTEQ; break;
					case Renderer.dice.tk.REROLL_LT.type: fnPartition = Renderer.dice.parsed._PARTITION_LT; break;
					case Renderer.dice.tk.REROLL_LTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_LTEQ; break;
					default: throw new Error(`Unimplemented!`);
				}

				const toReroll = vals.filter(val => fnPartition(val.val, modNum));
				toReroll.forEach(val => val.isDropped = true);

				const nuVals = opts.fnGetRerolls(toReroll);

				vals.push(...nuVals);
				displayVals.push(...nuVals);
				break;
			}

			case Renderer.dice.tk.EXPLODE_EXACT.type:
			case Renderer.dice.tk.EXPLODE_GT.type:
			case Renderer.dice.tk.EXPLODE_GTEQ.type:
			case Renderer.dice.tk.EXPLODE_LT.type:
			case Renderer.dice.tk.EXPLODE_LTEQ.type: {
				let fnPartition;
				switch (mod.type) {
					case Renderer.dice.tk.EXPLODE_EXACT.type: fnPartition = Renderer.dice.parsed._PARTITION_EQ; break;
					case Renderer.dice.tk.EXPLODE_GT.type: fnPartition = Renderer.dice.parsed._PARTITION_GT; break;
					case Renderer.dice.tk.EXPLODE_GTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_GTEQ; break;
					case Renderer.dice.tk.EXPLODE_LT.type: fnPartition = Renderer.dice.parsed._PARTITION_LT; break;
					case Renderer.dice.tk.EXPLODE_LTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_LTEQ; break;
					default: throw new Error(`Unimplemented!`);
				}

				let tries = 999; // limit the maximum explosions to a sane amount
				let lastLen;
				let toExplodeNext = vals;
				do {
					lastLen = vals.length;

					const [toExplode] = toExplodeNext.partition(roll => !roll.isExploded && fnPartition(roll.val, modNum));
					toExplode.forEach(roll => roll.isExploded = true);

					const nuVals = opts.fnGetExplosions(toExplode);

					// cache the new rolls, to improve performance over massive explosion sets
					toExplodeNext = nuVals;

					vals.push(...nuVals);
					displayVals.push(...nuVals);
				} while (tries-- > 0 && vals.length !== lastLen);

				if (!~tries) JqueryUtil.doToast({type: "warning", content: `Stopped exploding after 999 additional rolls.`});

				break;
			}

			case Renderer.dice.tk.COUNT_SUCCESS_EXACT.type:
			case Renderer.dice.tk.COUNT_SUCCESS_GT.type:
			case Renderer.dice.tk.COUNT_SUCCESS_GTEQ.type:
			case Renderer.dice.tk.COUNT_SUCCESS_LT.type:
			case Renderer.dice.tk.COUNT_SUCCESS_LTEQ.type: {
				let fnPartition;
				switch (mod.type) {
					case Renderer.dice.tk.COUNT_SUCCESS_EXACT.type: fnPartition = Renderer.dice.parsed._PARTITION_EQ; break;
					case Renderer.dice.tk.COUNT_SUCCESS_GT.type: fnPartition = Renderer.dice.parsed._PARTITION_GT; break;
					case Renderer.dice.tk.COUNT_SUCCESS_GTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_GTEQ; break;
					case Renderer.dice.tk.COUNT_SUCCESS_LT.type: fnPartition = Renderer.dice.parsed._PARTITION_LT; break;
					case Renderer.dice.tk.COUNT_SUCCESS_LTEQ.type: fnPartition = Renderer.dice.parsed._PARTITION_LTEQ; break;
					default: throw new Error(`Unimplemented!`);
				}

				const successes = vals.filter(val => fnPartition(val.val, modNum));
				successes.forEach(val => val.isSuccess = true);

				break;
			}

			default: throw new Error(`Unimplemented!`);
		}

		return displayVals;
	},

	Function: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		evl (meta) { return this._invoke("evl", meta); }
		avg (meta) { return this._invoke("avg", meta); }
		min (meta) { return this._invoke("min", meta); }
		max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const [symFunc, symExp] = this._nodes;
			switch (symFunc.type) {
				case Renderer.dice.tk.FLOOR.type: {
					this.addToMeta(meta, "floor(");
					const out = Math.floor(symExp[fnName](meta));
					this.addToMeta(meta, ")");
					return out;
				}
				case Renderer.dice.tk.CEIL.type: {
					this.addToMeta(meta, "ceil(");
					const out = Math.ceil(symExp[fnName](meta));
					this.addToMeta(meta, ")");
					return out;
				}
				case Renderer.dice.tk.ROUND.type: {
					this.addToMeta(meta, "round(");
					const out = Math.round(symExp[fnName](meta));
					this.addToMeta(meta, ")");
					return out;
				}
				case Renderer.dice.tk.AVERAGE.type: {
					return symExp.avg(meta);
				}
				default: throw new Error(`Unimplemented!`);
			}
		}

		toString () {
			let out;
			const [symFunc, symExp] = this._nodes;
			switch (symFunc.type) {
				case Renderer.dice.tk.FLOOR.type: out = "floor"; break;
				case Renderer.dice.tk.CEIL.type: out = "ceil"; break;
				case Renderer.dice.tk.ROUND.type: out = "round"; break;
				case Renderer.dice.tk.AVERAGE.type: out = "avg"; break;
				default: throw new Error(`Unimplemented!`);
			}
			out += `(${symExp.toString()})`;
			return out;
		}
	},

	Pool: class extends Renderer.dice.AbstractSymbol {
		constructor (nodesPool, nodesMod) {
			super();
			this._nodesPool = nodesPool;
			this._nodesMod = nodesMod;
		}

		evl (meta) { return this._invoke("evl", meta) }
		avg (meta) { return this._invoke("avg", meta) }
		min (meta) { return this._invoke("min", meta); }
		max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const vals = this._nodesPool.map((it, i) => {
				const subMeta = {};
				return {node: it, val: it[fnName](subMeta), meta: subMeta};
			});

			if (this._nodesMod.length && vals.length) {
				const isSuccessMode = this._nodesMod[0].isSuccessMode;

				const modOpts = {
					fnGetRerolls: toReroll => toReroll.map(val => {
						const subMeta = {};
						return {node: val.node, val: val.node[fnName](subMeta), meta: subMeta};
					}),
					fnGetExplosions: toExplode => toExplode.map(val => {
						const subMeta = {};
						return {node: val.node, val: val.node[fnName](subMeta), meta: subMeta};
					})
				};

				const displayVals = Renderer.dice.parsed._handleModifiers(fnName, meta, vals, this._nodesMod, modOpts);

				const asHtml = displayVals.map(v => {
					const html = v.meta.html.join("");
					if (v.isDropped) return `<span class="rll__dropped">(${html})</span>`;
					else if (v.isExploded) return `<span class="rll__exploded">(</span>${html}<span class="rll__exploded">)</span>`;
					else if (v.isSuccess) return `<span class="rll__success">(${html})</span>`;
					else return `(${html})`;
				}).join("+");

				const asText = displayVals.map(v => `(${v.meta.text.join("")})`).join("+");

				this.addToMeta(meta, asHtml, asText);

				if (isSuccessMode) {
					return vals.filter(it => !it.isDropped && it.isSuccess).length;
				} else {
					return Math.sum(...vals.filter(it => !it.isDropped).map(it => it.val));
				}
			} else {
				this.addToMeta(meta, `${vals.map(it => `(${it.meta.html.join("")})`).join("+")}`, `${vals.map(it => `(${it.meta.text.join("")})`).join("+")}`);
				return Math.sum(...vals.map(it => it.val));
			}
		}

		toString () {
			return `{${this._nodesPool.map(it => it.toString()).join(", ")}}${this._nodesMod.map(it => it.toString()).join("")}`
		}
	},

	Factor: class extends Renderer.dice.AbstractSymbol {
		constructor (node, opts) {
			super();
			opts = opts || {};
			this._node = node;
			this._hasParens = !!opts.hasParens;
		}

		evl (meta) { return this._invoke("evl", meta) }
		avg (meta) { return this._invoke("avg", meta) }
		min (meta) { return this._invoke("min", meta); }
		max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			switch (this._node.type) {
				case Renderer.dice.tk.TYP_NUMBER: {
					this.addToMeta(meta, this.toString());
					return Number(this._node.value);
				}
				case Renderer.dice.tk.TYP_SYMBOL: {
					if (this._hasParens) this.addToMeta(meta, "(");
					const out = this._node[fnName](meta);
					if (this._hasParens) this.addToMeta(meta, ")");
					return out;
				}
				default: throw new Error(`Unimplemented!`);
			}
		}

		toString () {
			let out;
			switch (this._node.type) {
				case Renderer.dice.tk.TYP_NUMBER: out = this._node.value; break;
				case Renderer.dice.tk.TYP_SYMBOL: out = this._node.toString(); break;
				default: throw new Error(`Unimplemented!`);
			}
			return this._hasParens ? `(${out})` : out;
		}
	},

	Dice: class extends Renderer.dice.AbstractSymbol {
		static _facesToValue (faces, fnName) {
			switch (fnName) {
				case "evl": return RollerUtil.randomise(faces);
				case "avg": return (faces + 1) / 2;
				case "min": return 1;
				case "max": return faces;
			}
		}

		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		evl (meta) { return this._invoke("evl", meta); }
		avg (meta) { return this._invoke("avg", meta); }
		min (meta) { return this._invoke("min", meta); }
		max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			if (this._nodes.length === 1) return this._nodes[0][fnName](meta); // if it's just a factor

			// N.B. we don't pass "meta" to symbol evaluation inside the dice expression--we therefore won't see
			//   the metadata from the nested rolls, but that's OK.

			const view = this._nodes.slice();
			// Shift the first symbol and use that as our initial number of dice
			//   e.g. the "2" in 2d3d3
			const numSym = view.shift();
			let num = numSym[fnName]();

			while (view.length) {
				if (Math.round(num) !== num) throw new Error(`Number of dice to roll (${num}) was not an integer!`);
				const isLast = view.length === 1 || (view.length === 3 && view.slice(-2, -1)[0].isDiceModifier);
				num = Math.floor(this._invoke_handlePart(fnName, meta, view, num, isLast));
			}
			return num;
		}

		_invoke_handlePart (fnName, meta, view, num, isLast) {
			const facesSym = view.shift();
			const faces = facesSym[fnName]();
			if (Math.round(faces) !== faces) throw new Error(`Dice face count (${faces}) was not an integer!`);

			const rolls = [...new Array(num)].map(() => ({val: Renderer.dice.parsed.Dice._facesToValue(faces, fnName)}));
			let displayRolls;
			let isSuccessMode = false;

			if (view.length && view[0].isDiceModifier) {
				if (fnName === "evl" || fnName === "min" || fnName === "max") { // avoid handling dice modifiers in "average" mode
					isSuccessMode = view[0].isSuccessMode;

					const modOpts = {
						fnGetRerolls: toReroll => [...new Array(toReroll.length)].map(() => ({val: Renderer.dice.parsed.Dice._facesToValue(faces, fnName)})),
						fnGetExplosions: toExplode => [...new Array(toExplode.length)].map(() => ({val: Renderer.dice.parsed.Dice._facesToValue(faces, fnName)}))
					};

					displayRolls = Renderer.dice.parsed._handleModifiers(fnName, meta, rolls, view, modOpts);
				}

				view.shift(); view.shift();
			} else displayRolls = rolls;

			if (isLast) { // only display the dice for the final roll, e.g. in 2d3d4 show the Xd4
				const asHtml = displayRolls.map(r => {
					const numPart = r.val === faces ? `<span class="rll__max--muted">${r.val}</span>` : r.val === 1 ? `<span class="rll__min--muted">${r.val}</span>` : r.val;

					if (r.isDropped) return `<span class="rll__dropped">[${numPart}]</span>`;
					else if (r.isExploded) return `<span class="rll__exploded">[</span>${numPart}<span class="rll__exploded">]</span>`;
					else if (r.isSuccess) return `<span class="rll__success">[${numPart}]</span>`;
					else return `[${numPart}]`;
				}).join("+");

				const asText = displayRolls.map(r => `[${r.val}]`).join("+");

				this.addToMeta(
					meta,
					asHtml,
					asText
				);
			}

			if (fnName === "evl") {
				const maxRolls = rolls.filter(it => it.val === faces && !it.isDropped);
				const minRolls = rolls.filter(it => it.val === 1 && !it.isDropped);
				meta.allMax = meta.allMax || [];
				meta.allMin = meta.allMin || [];
				meta.allMax.push(maxRolls.length && maxRolls.length === rolls.length);
				meta.allMin.push(minRolls.length && minRolls.length === rolls.length);
			}

			if (isSuccessMode) {
				return rolls.filter(it => !it.isDropped && it.isSuccess).length;
			} else {
				return Math.sum(...rolls.filter(it => !it.isDropped).map(it => it.val));
			}
		}

		toString () {
			if (this._nodes.length === 1) return this._nodes[0].toString(); // if it's just a factor

			const [numSym, facesSym] = this._nodes;
			let out = `${numSym.toString()}d${facesSym.toString()}`;

			if (this._nodes.length === 4) {
				const [modSym, modNumSym] = this._nodes.slice(2);
				out += `${modSym.toString()}${modNumSym.toString()}`;
			}

			return out;
		}
	},

	Exponent: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		evl (meta) { return this._invoke("evl", meta) }
		avg (meta) { return this._invoke("avg", meta) }
		min (meta) { return this._invoke("min", meta); }
		max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const view = this._nodes.slice();
			let val = view.pop()[fnName](meta);
			while (view.length) {
				this.addToMeta(meta, "^");
				val = Math.pow(view.pop()[fnName](meta), val);
			}
			return val;
		}

		toString () {
			const view = this._nodes.slice();
			let out = view.pop().toString();
			while (view.length) out = `${view.pop().toString()}^${out}`;
			return out;
		}
	},

	Term: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		evl (meta) { return this._invoke("evl", meta) }
		avg (meta) { return this._invoke("avg", meta) }
		min (meta) { return this._invoke("min", meta); }
		max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			let out = this._nodes[0][fnName](meta);

			for (let i = 1; i < this._nodes.length; i += 2) {
				if (this._nodes[i].eq(Renderer.dice.tk.MULT)) {
					this.addToMeta(meta, " × ");
					out *= this._nodes[i + 1][fnName](meta);
				} else if (this._nodes[i].eq(Renderer.dice.tk.DIV)) {
					this.addToMeta(meta, " ÷ ");
					out /= this._nodes[i + 1][fnName](meta)
				} else throw new Error(`Unimplemented!`);
			}

			return out;
		}

		toString () {
			let out = this._nodes[0].toString();
			for (let i = 1; i < this._nodes.length; i += 2) {
				if (this._nodes[i].eq(Renderer.dice.tk.MULT)) out += ` * ${this._nodes[i + 1].toString()}`;
				else if (this._nodes[i].eq(Renderer.dice.tk.DIV)) out += ` / ${this._nodes[i + 1].toString()}`;
				else throw new Error(`Unimplemented!`);
			}
			return out;
		}
	},

	Expression: class extends Renderer.dice.AbstractSymbol {
		constructor (nodes) {
			super();
			this._nodes = nodes;
		}

		evl (meta) { return this._invoke("evl", meta) }
		avg (meta) { return this._invoke("avg", meta) }
		min (meta) { return this._invoke("min", meta); }
		max (meta) { return this._invoke("max", meta); }

		_invoke (fnName, meta) {
			const view = this._nodes.slice();

			let isNeg = false;
			if (view[0].eq(Renderer.dice.tk.ADD) || view[0].eq(Renderer.dice.tk.SUB)) {
				isNeg = view.shift().eq(Renderer.dice.tk.SUB);
				if (isNeg) this.addToMeta(meta, "-");
			}

			let out = view[0][fnName](meta);
			if (isNeg) out = -out;

			for (let i = 1; i < view.length; i += 2) {
				if (view[i].eq(Renderer.dice.tk.ADD)) {
					this.addToMeta(meta, " + ");
					out += view[i + 1][fnName](meta);
				} else if (view[i].eq(Renderer.dice.tk.SUB)) {
					this.addToMeta(meta, " - ");
					out -= view[i + 1][fnName](meta);
				} else throw new Error(`Unimplemented!`);
			}

			return out;
		}

		toString (indent = 0) {
			let out = "";
			const view = this._nodes.slice();

			let isNeg = false;
			if (view[0].eq(Renderer.dice.tk.ADD) || view[0].eq(Renderer.dice.tk.SUB)) {
				isNeg = view.shift().eq(Renderer.dice.tk.SUB);
				if (isNeg) out += "-";
			}

			out += view[0].toString(indent);
			for (let i = 1; i < view.length; i += 2) {
				if (view[i].eq(Renderer.dice.tk.ADD)) out += ` + ${view[i + 1].toString(indent)}`;
				else if (view[i].eq(Renderer.dice.tk.SUB)) out += ` - ${view[i + 1].toString(indent)}`;
				else throw new Error(`Unimplemented!`);
			}
			return out;
		}
	}
};

if (!IS_VTT && typeof window !== "undefined") {
	window.addEventListener("load", Renderer.dice._pInit);
}

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
			if (it.startsWith("@")) {
				let [tag, text] = Renderer.splitFirstSpace(it);
				text = text.replace(/<\$([^$]+)\$>/gi, ""); // remove any variable tags
				switch (tag) {
					case "@b":
					case "@bold":
					case "@i":
					case "@italic":
					case "@s":
					case "@strike":
					case "@u":
					case "@underline":
						return text;

					case "@h": return "Hit: ";

					case "@dc": return `DC ${text}`;

					case "@atk": return Renderer.attackTagToFull(text);

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
					case "@background":
					case "@boon":
					case "@class":
					case "@condition":
					case "@creature":
					case "@cult":
					case "@disease":
					case "@feat":
					case "@hazard":
					case "@item":
					case "@language":
					case "@object":
					case "@optfeature":
					case "@psionic":
					case "@race":
					case "@reward":
					case "@vehicle":
					case "@spell":
					case "@table":
					case "@trap":
					case "@variantrule": {
						const parts = Renderer.splitTagByPipe(text);
						return parts.length >= 3 ? parts[2] : parts[0];
					}

					case "@deity": {
						const parts = Renderer.splitTagByPipe(text);
						return parts.length >= 4 ? parts[3] : parts[0];
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

					default: throw new Error(`Unhandled tag: "${tag}"`);
				}
			} else return it;
		}).join("");
	} return str;
};

Renderer.isRollableTable = function (table) {
	let autoMkRoller = false;
	if (table.colLabels) {
		autoMkRoller = table.colLabels.length >= 2 && RollerUtil.isRollCol(table.colLabels[0]);
		if (autoMkRoller) {
			// scan the first column to ensure all rollable
			const notRollable = table.rows.find(it => {
				try {
					// u2012 = figure dash; u2013 = en-dash
					return !/\d+([-\u2012\u2013]\d+)?/.exec(it[0]);
				} catch (e) {
					return true;
				}
			});
			if (notRollable) autoMkRoller = false;
		}
	}
	return autoMkRoller;
};

// assumes validation has been done in advance
Renderer.getRollableRow = function (row, cbErr) {
	row = MiscUtil.copy(row);
	try {
		// format: "95-00" or "12"
		// u2012 = figure dash; u2013 = en-dash
		const m = /^(\d+)([-\u2012\u2013](\d+))?$/.exec(String(row[0]).trim());
		if (m) {
			if (m[1] && !m[2]) {
				row[0] = {
					type: "cell",
					roll: {
						exact: Number(m[1])
					}
				};
				if (m[1][0] === "0") row[0].roll.pad = true;
			} else {
				row[0] = {
					type: "cell",
					roll: {
						min: Number(m[1]),
						max: Number(m[3])
					}
				};
				if (m[1][0] === "0" || m[3][0] === "0") row[0].roll.pad = true;
			}
		} else {
			// format: "12+"
			const m = /^(\d+)\+$/.exec(row[0]);
			row[0] = {
				type: "cell",
				roll: {
					min: Number(m[1]),
					max: Renderer.dice.POS_INFINITE
				}
			};
		}
	} catch (e) { if (cbErr) cbErr(row[0], e); }
	return row;
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
		threshold: 0.01
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
