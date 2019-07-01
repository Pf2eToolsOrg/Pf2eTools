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
	this._headerIndex = 1;
	this._tagExportDict = null;
	this._roll20Ids = null;
	this._trackTitles = {enabled: false, titles: {}};
	this._enumerateTitlesRel = {enabled: false, titles: {}};

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

	/**
	 * Other sections should be prefixed with a vertical divider
	 * @param bool
	 */
	this.setFirstSection = function (bool) {
		this._firstSection = bool;
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

	this.setRoll20Ids = function (roll20Ids) {
		this._roll20Ids = roll20Ids;
	};

	this.resetRoll20Ids = function () {
		this._roll20Ids = null;
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

	/**
	 * Recursively walk down a tree of "entry" JSON items, adding to a stack of strings to be finally rendered to the
	 * page. Note that this function does _not_ actually do the rendering, see the example code above for how to display
	 * the result.
	 *
	 * @param entry An "entry" usually defined in JSON. A schema is available in tests/schema
	 * @param textStack A reference to an array, which will hold all our strings as we recurse
	 * @param meta Meta state.
	 * @param meta.depth The current recursion depth. Optional; default 0, or -1 for type "section" entries.
	 */
	this.recursiveRender = function (entry, textStack, meta) {
		// respect the API of the original, but set up for using string concatenations
		if (textStack.length === 0) textStack[0] = "";
		else textStack.reverse();

		// initialise meta
		meta = meta || {};
		meta._typeStack = [];
		meta.depth = meta.depth == null ? 0 : meta.depth;

		this._recursiveRender(entry, textStack, meta);
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

				// images
				case "image": this._renderImage(entry, textStack, meta, options); break;
				case "gallery": this._renderGallery(entry, textStack, meta, options); break;

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
			textStack[0] += entry;
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
		textStack[0] += `<div class="${meta._typeStack.includes("gallery") ? "rd__wrp-gallery-image" : ""}">`;
		let href;
		if (entry.href.type === "internal") {
			const imgPart = `img/${entry.href.path}`;
			href = this.baseUrl !== "" ? `${this.baseUrl}${imgPart}` : UrlUtil.link(imgPart);
		} else if (entry.href.type === "external") {
			href = entry.href.url;
		}
		const svg = this._lazyImages && entry.width != null && entry.height != null
			? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${entry.width}" height="${entry.height}"><rect width="100%" height="100%" fill="#ccc3"/></svg>`)}`
			: null;
		textStack[0] += `<div class="rd__wrp-image"><a href="${href}" target="_blank" rel="noopener" ${entry.title ? `title="${entry.title}"` : ""}><img class="rd__image" src="${svg || href}" ${entry.altText ? `alt="${entry.altText}"` : ""} ${svg ? `data-src="${href}"` : ""} ${getStylePart()}></a></div>`;
		if (entry.title) textStack[0] += `<div class="rd__image-title"><div class="rd__image-title-inner">${entry.title}</div></div>`;
		else if (entry._galleryTitlePad) textStack[0] += `<div class="rd__image-title">&nbsp;</div>`;
		textStack[0] += `</div>`;
		this._renderSuffix(entry, textStack, meta, options);
		if (entry.imageType === "map") textStack[0] += `</div>`;
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
					if (roRender[ixCell].entry) {
						toRenderCell = roRender[ixCell].entry;
					} else if (roRender[ixCell].roll) {
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
					}
				} else {
					toRenderCell = roRender[ixCell];
				}
				bodyStack[0] += `<td ${this._renderTable_makeTableTdClassText(entry, ixCell)} ${this._renderTable_getCellDataStr(roRender[ixCell])} ${roRender[ixCell].width ? `colspan="${roRender[ixCell].width}"` : ""}>`;
				if (r.style === "row-indent-first" && ixCell === 0) bodyStack[0] += `<div class="rd__tab-indent"/>`;
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
				textStack[0] += `<th ${this._renderTable_getTableThClassText(entry, i)} data-isroller="${rollCols[i]}">`;
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

		const headerSpan = entry.name ? `<span class="rd__h ${headerClass}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}> <span class="entry-title-inner">${this.render({type: "inline", entries: [entry.name]})}${isInlineTitle ? "." : ""}</span>${pagePart}</span> ` : "";

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
				}
				meta.depth = cacheDepth;
			}
			textStack[0] += `</${this.wrapperTag}>`;
		}
	};

	this._renderEntriesSubtypes_getDataString = function (entry) {
		let dataString = "";
		if (entry.type === "optfeature" || entry.type === "patron") {
			const titleString = entry.source ? `title="Source: ${Parser.sourceJsonToFull(entry.source)}"` : "";
			if (entry.subclass != null) dataString = `${ATB_DATA_SC}="${entry.subclass.name}" ${ATB_DATA_SRC}="${Parser._getSourceStringFromSource(entry.subclass.source)}" ${titleString}`;
			else dataString = `${ATB_DATA_SC}="${Renderer.DATA_NONE}" ${ATB_DATA_SRC}="${Renderer.DATA_NONE}" ${titleString}`;
		}
		return dataString;
	};

	this._renderEntriesSubtypes_renderPreReqText = function (entry, textStack, meta) {
		if (entry.prerequisite) {
			textStack[0] += `<span class="prerequisite">Prerequisite: `;
			this._recursiveRender({type: "inline", entries: [entry.prerequisite]}, textStack, meta);
			textStack[0] += `</span>`;
		}
	};

	this._renderEntriesSubtypes_getStyleString = function (entry, meta, isInlineTitle) {
		const styleClasses = [];
		styleClasses.push(this._getStyleClass(entry.source));
		if (isInlineTitle) {
			if (this._subVariant) styleClasses.push(Renderer.HEAD_2_SUB_VARIANT);
			else styleClasses.push(Renderer.HEAD_2);
		} else styleClasses.push(meta.depth === -1 ? Renderer.HEAD_NEG_1 : meta.depth === 0 ? Renderer.HEAD_0 : Renderer.HEAD_1);
		if ((entry.type === "optfeature" || entry.type === "patron") && entry.subclass != null) styleClasses.push(CLSS_SUBCLASS_FEATURE);
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
			if (entry.name) textStack[0] += `<p class="rd__list-name">${entry.name}</p>`;
			const cssClasses = this._renderList_getListCssClasses(entry, textStack, meta, options);
			textStack[0] += `<ul ${cssClasses ? `class="${cssClasses}"` : ""}>`;
			const len = entry.items.length;
			for (let i = 0; i < len; ++i) {
				const item = entry.items[i];
				const className = `${this._getStyleClass(item.source)}${item.type === "itemSpell" ? " rd__li-spell" : ""}`;
				textStack[0] += `<li ${className ? `class="${className}"` : ""}>`;
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(entry.items[i], textStack, meta);
				meta.depth = cacheDepth;
				textStack[0] += "</li>";
			}
			textStack[0] += "</ul>";
		}
	};

	this._renderInset = function (entry, textStack, meta, options) {
		textStack[0] += `<${this.wrapperTag} class="rd__b-inset">`;
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
		textStack[0] += `</${this.wrapperTag}>`;
	};

	this._renderInsetReadaloud = function (entry, textStack, meta, options) {
		textStack[0] += `<${this.wrapperTag} class="rd__b-inset rd__b-inset--readaloud">`;
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
		textStack[0] += `</${this.wrapperTag}>`;
	};

	this._renderVariant = function (entry, textStack, meta, options) {
		this._handleTrackTitles(entry.name);
		textStack[0] += `<${this.wrapperTag} class="rd__b-inset">`;
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

	this._renderSpellcasting = function (entry, textStack, meta, options) {
		const hidden = new Set(entry.hidden || []);
		const toRender = [{type: "entries", name: entry.name, entries: entry.headerEntries ? MiscUtil.copy(entry.headerEntries) : []}];

		if (entry.constant || entry.will || entry.rest || entry.daily || entry.weekly) {
			const tempList = {type: "list", "style": "list-hang-notitle", items: []};
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
			const tempList = {type: "list", "style": "list-hang-notitle", items: []};
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
					tempList.items.push({type: "itemSpell", name: `${levelCantrip} ${slotsAtWill}:`, entry: spells.spells.join(", ")})
				}
			}
			toRender[0].entries.push(tempList);
		}

		if (entry.footerEntries) toRender.push({type: "entries", entries: entry.footerEntries});
		this._recursiveRender({type: "entries", entries: toRender}, textStack, meta);
	};

	this._renderQuote = function (entry, textStack, meta, options) {
		textStack[0] += `<p><i>`;
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			this._recursiveRender(entry.entries[i], textStack, meta);
			if (i !== entry.entries.length - 1) textStack[0] += `<br>`;
			else textStack[0] += `</i>`;
		}
		if (entry.by) {
			const tempStack = [""];
			this._recursiveRender(entry.by, tempStack, meta);
			textStack[0] += `<span class="rd__quote-by">\u2014 ${tempStack.join("")}${entry.from ? `, <i>${entry.from}</i>` : ""}</span>`;
		}
		textStack[0] += `</p>`;
	};

	this._renderOptfeature = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, true);
	};

	this._renderPatron = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, false);
	};

	this._renderAbilityDc = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class='text-center'><b>${entry.name} save DC</b> = 8 + your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}</div>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderAbilityAttackMod = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class='text-center'><b>${entry.name} attack modifier</b> = your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}</div>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderAbilityGeneric = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class='text-center'>${entry.name ? `<b>${entry.name}</b>  = ` : ""}${entry.text}${entry.attributes ? ` ${Parser.attrChooseToFull(entry.attributes)}` : ""}</div>`;
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
		textStack[0] += (entry.value < 0 ? "" : "+") + entry.value + " ft.";
	};

	this._renderDice = function (entry, textStack, meta, options) {
		textStack[0] += Renderer.getEntryDice(entry, entry.name);
	};

	this._renderActions = function (entry, textStack, meta, options) {
		this._handleTrackTitles(entry.name);
		textStack[0] += `<${this.wrapperTag} class="${Renderer.HEAD_2}"><span class="rd__h rd__h--3" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}.</span></span> `;
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
		textStack[0] += `</${this.wrapperTag}>`;
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
		textStack[0] += `<table class="rd__b-data">`;
		textStack[0] += `<thead><tr><th class="rd__data-embed-header" colspan="6" onclick="((ele) => {
						$(ele).find('.rd__data-embed-name').toggle(); 
						$(ele).find('.rd__data-embed-toggle').text($(ele).text().includes('+') ? '[\u2013]' : '[+]'); 
						$(ele).closest('table').find('tbody').toggle()
					})(this)"><span style="display: none;" class="rd__data-embed-name">${entry.dataCreature.name}</span><span class="rd__data-embed-toggle">[\u2013]</span></th></tr></thead><tbody>`;
		textStack[0] += Renderer.monster.getCompactRenderedString(entry.dataCreature, this);
		textStack[0] += `</tbody></table>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderDataSpell = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<table class="rd__b-data">`;
		textStack[0] += `<thead><tr><th class="rd__data-embed-header" colspan="6" onclick="((ele) => {
						$(ele).find('.rd__data-embed-name').toggle(); 
						$(ele).find('.rd__data-embed-toggle').text($(ele).text().includes('+') ? '[\u2013]' : '[+]'); 
						$(ele).closest('table').find('tbody').toggle()
					})(this)"><span style="display: none;" class="rd__data-embed-name">${entry.dataSpell.name}</span><span class="rd__data-embed-toggle">[\u2013]</span></th></tr></thead><tbody>`;
		textStack[0] += Renderer.spell.getCompactRenderedString(entry.dataSpell, this);
		textStack[0] += `</tbody></table>`;
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderGallery = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="rd__wrp-gallery">`;
		const len = entry.images.length;
		const anyNamed = entry.images.find(it => it.title);
		for (let i = 0; i < len; ++i) {
			const img = MiscUtil.copy(entry.images[i]);
			if (anyNamed && !img.title) img._galleryTitlePad = true; // force un-title images to pad to match their siblings
			delete img.imageType;
			this._recursiveRender(img, textStack, meta);
		}
		textStack[0] += `</div>`;
	};

	this._renderHomebrew = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<div class="homebrew-section">`;
		if (entry.oldEntries) {
			const mouseOver = Renderer.hover.createOnMouseHover(entry.oldEntries);
			let markerText;
			if (entry.movedTo) {
				markerText = "(See moved content)";
			} else if (entry.entries) {
				markerText = "(See replaced content)";
			} else {
				markerText = "(See removed content)";
			}
			textStack[0] += `<span class="homebrew-old-content" href="#${window.location.hash}" ${mouseOver}>${markerText}</span>`;
		}

		textStack[0] += `<span class="homebrew-notice"></span>`;

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
		textStack[0] += `<button class="btn btn-default btn-xs mb-1" onclick="{const $e = $(this).next('pre'); MiscUtil.pCopyTextToClipboard($e.text());JqueryUtil.showCopiedEffect($e)}">Copy Code</button>
			<pre>${entry.preformatted}</pre>
		`;
	};

	this._renderHr = function (entry, textStack, meta, options) {
		textStack[0] += `<hr class="rd__hr">`;
	};

	this._getStyleClass = function (source) {
		const outList = [];
		if (SourceUtil.isNonstandardSource(source)) outList.push(CLSS_NON_STANDARD_SOURCE);
		if (BrewUtil.hasSourceJson(source)) outList.push(CLSS_HOMEBREW_SOURCE);
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
					case "@note":
						textStack[0] += `<i class="text-muted">`;
						this._recursiveRender(text, textStack, meta);
						textStack[0] += `</i>`;
						break;
					case "@atk":
						textStack[0] += `<i>${Renderer.attackTagToFull(text)}</i>`;
						break;
					case "@h":
						textStack[0] += `<i>Hit:</i> `;
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
						const [rollText, displayText, name, ...others] = text.split("|");
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
								// format: {@recharge 4}
								fauxEntry.toRoll = "1d6";
								const asNum = Number(rollText || 6);
								fauxEntry.successThresh = 7 - asNum;
								fauxEntry.successMax = 6;
								textStack[0] += `(Recharge `;
								fauxEntry.displayText = `${asNum}${asNum < 6 ? `\u20136` : ""}`;
								this._recursiveRender(fauxEntry, textStack, meta);
								textStack[0] += `)`;
								break;
							}
						}

						break;
					}

					// SCALE DICE //////////////////////////////////////////////////////////////////////////////////////
					case "@scaledice": {
						// format: {@scaledice 2d6;3d6|2-8,9|1d6}
						const [baseRoll, progression, addPerProgress] = text.split("|");
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

						const fauxEntry = {
							type: "dice",
							rollable: true,
							toRoll: baseRoll,
							displayText: addPerProgress,
							prompt: {
								entry: "Cast at...",
								options
							}
						};
						this._recursiveRender(fauxEntry, textStack, meta);

						break;
					}

					// LINKS ///////////////////////////////////////////////////////////////////////////////////////////
					case "@filter": {
						// format: {@filter Warlock Spells|spells|level=1;2|class=Warlock}
						const [displayText, page, ...filters] = text.split("|");

						const fauxEntry = {
							type: "link",
							text: displayText,
							href: {
								type: "internal",
								path: `${page}.html`,
								hash: HASH_BLANK,
								hashPreEncoded: true,
								subhashes: filters.map(f => {
									const [fname, fvals, fopts] = f.split("=").map(s => s.trim()).filter(s => s);
									const key = fname.startsWith("fb") ? fname : `flst${UrlUtil.encodeForHash(fname)}`;

									let value;
									if (fvals.startsWith("[") && fvals.endsWith("]")) { // range
										const [min, max] = fvals.substring(1, fvals.length - 1).split(";").map(it => it.trim());
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
										value = fvals.split(";").map(s => s.trim()).filter(s => s).map(s => {
											const spl = s.split("!");
											if (spl.length === 2) return `${UrlUtil.encodeForHash(spl[1])}=2`
											return `${UrlUtil.encodeForHash(s)}=1`
										}).join(HASH_SUB_LIST_SEP);
									}

									const out = {
										key,
										value,
										preEncoded: true
									};

									if (fopts) {
										return [out, {
											key: `flmt${UrlUtil.encodeForHash(fname)}`,
											value: fopts,
											preEncoded: true
										}];
									}
									return out;
								}).flat()
							}
						};
						this._recursiveRender(fauxEntry, textStack, meta);

						break;
					}
					case "@link": {
						const [displayText, url] = text.split("|");
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
						const [displayText, page, hash] = text.split("|");
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
						const [displayText, footnoteText, optTitle] = text.split("|");
						const onMouseOver = Renderer.hover.createOnMouseHover([footnoteText, optTitle ? `{@note ${optTitle}}` : ""].filter(Boolean));
						textStack[0] += `<span class="help" ${onMouseOver}>`;
						this._recursiveRender(displayText, textStack, meta);
						textStack[0] += `</span>`;

						break;
					}
					case "@homebrew": {
						const [newText, oldText] = text.split("|");
						const tooltip = [];
						if (newText && oldText) {
							tooltip.push("<strong>This is a homebrew addition, replacing the following:</strong>");
						} else if (newText) {
							tooltip.push("<strong>This is a homebrew addition.</strong>")
						} else if (oldText) {
							tooltip.push("<strong>The following text has been removed with this homebrew:</strong>")
						}
						if (oldText) {
							tooltip.push(oldText);
						}
						const onMouseOver = Renderer.hover.createOnMouseHover(tooltip);
						textStack[0] += `<span class="homebrew-inline" ${onMouseOver}>`;
						this._recursiveRender(newText || "[...]", textStack, meta);
						textStack[0] += `</span>`;

						break;
					}
					case "@skill":
					case "@action":
					case "@sense": {
						const expander = (() => {
							switch (tag) {
								case "@skill": return Parser.skillToExplanation;
								case "@action": return Parser.actionToExplanation;
								case "@sense": return Parser.senseToExplanation;
							}
						})();
						const [name, displayText] = text.split("|");
						const onMouseOver = Renderer.hover.createOnMouseHover(expander(name), name);
						textStack[0] += `<span class="help--hover" ${onMouseOver}>${displayText || name}</span>`;

						break;
					}
					case "@area": {
						const [areaCode, flags, displayText, ...others] = text.split("|");
						const splCode = areaCode.split(">"); // use pos [0] for names without ">"s, and pos [1] for names with (as pos [2] is for sequence ID)
						const renderText = displayText || `${flags && flags.includes("u") ? "A" : "a"}rea ${splCode.length === 1 ? splCode[0] : splCode[1]}`;
						if (typeof BookUtil === "undefined") { // for the roll20 script
							textStack[0] += renderText;
						} else {
							const area = BookUtil.curRender.headerMap[areaCode] || {entry: {name: ""}}; // default to prevent rendering crash on bad tag
							const onMouseOver = Renderer.hover.createOnMouseHoverEntry(area.entry, true);
							textStack[0] += `<a href="#${BookUtil.curRender.curBookId},${area.chapter},${UrlUtil.encodeForHash(area.entry.name)}" ${onMouseOver} onclick="BookUtil.handleReNav(this)">${renderText}</a>`;
						}

						break;
					}

					// CONTENT TAGS ////////////////////////////////////////////////////////////////////////////////////
					case "@book":
					case "@adventure": {
						// format: {@tag Display Text|DMG< |chapter< |section >< |number > >}
						const page = tag === "@book" ? "book.html" : "adventure.html";
						const [displayText, book, chapter, section, number] = text.split("|");
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
						const [name, pantheon, source, displayText, ...others] = text.split("|");
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

					// HOMEBREW LOADING ////////////////////////////////////////////////////////////////////////////////
					case "@loader": {
						const [name, file] = text.split("|");
						const path = /^.*?:\/\//.test(file) ? file : `https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/${file}`;
						textStack[0] += `<span onclick="BrewUtil.handleLoadbrewClick(this, '${path.escapeQuotes()}', '${name.escapeQuotes()}')" class="rd__wrp-loadbrew--ready" title="Click to install homebrew">${name}<span class="glyphicon glyphicon-download-alt rd__loadbrew-icon rd__loadbrew-icon"/></span>`;
						break;
					}

					default: {
						const [name, source, displayText, ...others] = text.split("|");
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
								if (others.length) {
									const scSource = others.length > 1 ? `~${others[1].trim()}` : "~phb";
									fauxEntry.href.subhashes = [
										{key: "sub", value: others[0].trim() + scSource},
										{key: "sources", value: 2}
									];
									if (others.length > 2) {
										fauxEntry.href.subhashes.push({key: CLSS_HASH_FEATURE_KEY, value: others[2].trim()})
									}
								}
								fauxEntry.href.path = "classes.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
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
									fauxEntry.href.hover.prelodId = `${MON_HASH_SCALED}:${targetCrNum}`;
									fauxEntry.href.subhashes = [
										{key: MON_HASH_SCALED, value: targetCrNum}
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
							case "@ship":
								fauxEntry.href.path = UrlUtil.PG_SHIPS;
								// enable this if/when there's a printed source with ships
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_GoS;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_SHIPS,
									source: source || SRC_GoS
								};
								this._recursiveRender(fauxEntry, textStack, meta);
								break;
						}

						break;
					}
				}
			} else textStack[0] += s;
		}
	};

	this._renderLink = function (entry, textStack, meta, options) {
		let href;
		if (entry.href.type === "internal") {
			// baseURL is blank by default
			href = `${this.baseUrl}${entry.href.path}#`;
			if (entry.href.hash != null) {
				href += entry.href.hashPreEncoded ? entry.href.hash : UrlUtil.encodeForHash(entry.href.hash);
			}
			if (entry.href.subhashes != null) {
				for (let i = 0; i < entry.href.subhashes.length; ++i) {
					const subHash = entry.href.subhashes[i];
					if (subHash.preEncoded) href += `${HASH_PART_SEP}${subHash.key}${HASH_SUB_KV_SEP}`;
					else href += `${HASH_PART_SEP}${UrlUtil.encodeForHash(subHash.key)}${HASH_SUB_KV_SEP}`;
					if (subHash.value != null) {
						if (subHash.preEncoded) href += subHash.value;
						else href += UrlUtil.encodeForHash(subHash.value);
					} else {
						// TODO allow list of values
						href += subHash.values.map(v => UrlUtil.encodeForHash(v)).join(HASH_SUB_LIST_SEP);
					}
				}
			}
		} else if (entry.href.type === "external") {
			href = entry.href.url;
		}
		// overwrite href if there's an available Roll20 handout/character
		if (entry.href.hover && this._roll20Ids) {
			const procHash = UrlUtil.encodeForHash(entry.href.hash);
			const id = this._roll20Ids[procHash];
			if (id) {
				href = `http://journal.roll20.net/${id.type}/${id.roll20Id}`;
			}
		}

		textStack[0] += `<a href="${href}" ${entry.href.type === "internal" ? "" : `target="_blank" rel="noopener"`} ${this._renderLink_getHoverString(entry)}>${this.render(entry.text)}</a>`;
	};

	this._renderLink_getHoverString = function (entry) {
		if (!entry.href.hover) return "";
		const procHash = UrlUtil.encodeForHash(entry.href.hash).replace(/'/g, "\\'");
		if (this._tagExportDict) {
			this._tagExportDict[procHash] = {
				page: entry.href.hover.page,
				source: entry.href.hover.source,
				hash: procHash
			};
		}
		return `onmouseover="Renderer.hover.mouseOver(event, this, '${entry.href.hover.page}', '${entry.href.hover.source}', '${procHash}', false, ${entry.href.hover.prelodId ? `'${entry.href.hover.prelodId}'` : "null"})" ${Renderer.hover._getPreventTouchString()}`;
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

Renderer.HOVER_TAG_TO_PAGE = {
	"spell": UrlUtil.PG_SPELLS,
	"item": UrlUtil.PG_ITEMS,
	"creature": UrlUtil.PG_BESTIARY,
	"condition": UrlUtil.PG_CONDITIONS_DISEASES,
	"disease": UrlUtil.PG_CONDITIONS_DISEASES,
	"background": UrlUtil.PG_BACKGROUNDS,
	"race": UrlUtil.PG_RACES,
	"optfeature": UrlUtil.PG_OPT_FEATURES,
	"feat": UrlUtil.PG_FEATS,
	"reward": UrlUtil.PG_REWARDS,
	"psionic": UrlUtil.PG_PSIONICS,
	"object": UrlUtil.PG_OBJECTS,
	"cult": UrlUtil.PG_CULTS_BOONS,
	"boon": UrlUtil.PG_CULTS_BOONS,
	"trap": UrlUtil.PG_TRAPS_HAZARDS,
	"hazard": UrlUtil.PG_TRAPS_HAZARDS
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

		const len = string.length;
		for (let i = 0; i < len; ++i) {
			char = string[i];
			char2 = string[i + 1];

			switch (char) {
				case "{":
					if (char2 === leadingCharacter) {
						if (tagDepth++ > 0) {
							curStr += "{";
						} else {
							out.push(curStr);
							curStr = "";
						}
					} else curStr += "{";
					break;

				case "}":
					if (tagDepth === 0) {
						curStr += "}";
					} else if (--tagDepth === 0) {
						out.push(curStr);
						curStr = "";
					} else curStr += "}";
					break;

				default: curStr += char; break;
			}
		}

		if (curStr) out.push(curStr);

		return out;
	}
};

Renderer.splitByTags = Renderer._splitByTagsBase("@");
Renderer.splitByPropertyInjectors = Renderer._splitByTagsBase("=");

Renderer.getEntryDice = function (entry, name) {
	function legacyDiceToString (array) {
		let stack = "";
		array.forEach(r => {
			stack += `${r.neg ? "-" : stack === "" ? "" : "+"}${r.number || 1}d${r.faces}${r.mod ? r.mod > 0 ? `+${r.mod}` : r.mod : ""}`
		});
		return stack;
	}

	function getDiceAsStr () {
		if (entry.successThresh) return `${entry.successThresh} percent`;
		else if (typeof entry.toRoll === "string") return entry.toRoll;
		else {
			// handle legacy format
			return legacyDiceToString(entry.toRoll)
		}
	}

	function pack (obj) {
		return `'${JSON.stringify(obj).escapeQuotes()}'`;
	}

	const toDisplay = entry.displayText ? entry.displayText : getDiceAsStr();

	if (entry.rollable === true) {
		const toPack = MiscUtil.copy(entry);
		if (typeof toPack.toRoll !== "string") {
			// handle legacy format
			toPack.toRoll = legacyDiceToString(toPack.toRoll);
		}

		return `<span class='roller render-roller' title="${name ? `${name.escapeQuotes()}` : ""}" onmousedown="event.preventDefault()" onclick="Renderer.dice.rollerClickUseData(event, this)" data-packed-dice=${pack(toPack)}>${toDisplay}</span>`;
	} else return toDisplay;
};

Renderer.getAbilityData = function (abObj) {
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
			for (let i = 0; i < abObj.choose.length; ++i) {
				const item = abObj.choose[i];
				let outStack = "";
				if (item.predefined != null) {
					for (let j = 0; j < item.predefined.length; ++j) {
						const subAbs = [];
						handleAllAbilities(item.predefined[j], subAbs);
						outStack += subAbs.join(", ") + (j === item.predefined.length - 1 ? "" : " or ");
					}
				} else if (item.weighted) {
					const w = item.weighted;
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
					continue;
				} else {
					const allAbilities = item.from.length === 6;
					const allAbilitiesWithParent = isAllAbilitiesWithParent(item);
					let amount = item.amount === undefined ? 1 : item.amount;
					amount = (amount < 0 ? "" : "+") + amount;
					if (allAbilities) {
						outStack += "any ";
					} else if (allAbilitiesWithParent) {
						outStack += "any other ";
					}
					if (item.count !== undefined && item.count > 1) {
						outStack += Parser.numberToText(item.count) + " ";
					}
					if (allAbilities || allAbilitiesWithParent) {
						outStack += `unique ${amount}`;
					} else {
						for (let j = 0; j < item.from.length; ++j) {
							let suffix = "";
							if (item.from.length > 1) {
								if (j === item.from.length - 2) {
									suffix = " or ";
								} else if (j < item.from.length - 2) {
									suffix = ", ";
								}
							}
							let thsAmount = " " + amount;
							if (item.from.length > 1) {
								if (j !== item.from.length - 1) {
									thsAmount = "";
								}
							}
							outStack += item.from[j].uppercaseFirst() + thsAmount + suffix;
						}
					}
				}
				toConvertToText.push("Choose " + outStack);
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
	 * @param [opts.isAddPageNum] True if the name row should include the page number.
	 * @param [opts.prefix] Prefix to display before the name.
	 * @param [opts.suffix] Suffix to display after the name.
	 * @param [opts.pronouncePart] Suffix to display after the name.
	 */
	getNameTr: (it, opts) => {
		opts = opts || {};
		return `<tr>
			<th class="rnd-name name" colspan="6">
				<div class="name-inner">
					<div class="flex-v-center">
						<span class="stats-name copyable" onmousedown="event.preventDefault()" onclick="Renderer.utils._pHandleNameClick(this, '${it.source.escapeQuotes()}')">${opts.prefix || ""}${it._displayName || it.name}${opts.suffix || ""}</span>
						${opts.pronouncePart || ""}
					</div>
					<span class="stats-source ${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)}${Renderer.utils.getSourceSubText(it)}" ${BrewUtil.sourceJsonToStyle(it.source)}>
						${Parser.sourceJsonToAbv(it.source)}${opts.isAddPageNum && it.page > 0 ? ` p${it.page}` : ""}
					</span>
				</div>
			</th>
		</tr>`;
	},

	async _pHandleNameClick (ele) {
		await MiscUtil.pCopyTextToClipboard($(ele).text());
		JqueryUtil.showCopiedEffect($(ele));
	},

	getPageTr: (it) => {
		return `<td colspan=6>${Renderer.utils._getPageTrText(it)}</td>`;
	},

	_getPageTrText: (it) => {
		function getAltSourceText (prop, introText) {
			if (it[prop] && it[prop].length) {
				return `${introText} ${it[prop].map(as => {
					if (as.entry) {
						return Renderer.get().render(as.entry);
					} else {
						return `<i title="${Parser.sourceJsonToFull(as.source)}">${Parser.sourceJsonToAbv(as.source)}</i>${as.page > 0 ? `, page ${as.page}` : ""}`;
					}
				}).join("; ")}`
			} else return "";
		}
		const sourceSub = Renderer.utils.getSourceSubText(it);
		const baseText = it.page > 0 ? `<b>Source: </b> <i title="${Parser.sourceJsonToFull(it.source)}${sourceSub}">${Parser.sourceJsonToAbv(it.source)}${sourceSub}</i>, page ${it.page}` : "";
		const addSourceText = getAltSourceText("additionalSources", "Additional information from");
		const otherSourceText = getAltSourceText("otherSources", "Also found in");
		const externalSourceText = getAltSourceText("externalSources", "External sources:");

		return `${[baseText, addSourceText, otherSourceText, externalSourceText].filter(it => it).join(". ")}${baseText && (addSourceText || otherSourceText || externalSourceText) ? "." : ""}`;
	},

	getAbilityRoller (statblock, ability) {
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

		toAdd.reverse().forEach($t => $wrpTab.prepend($t));
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
			const fromList = (BrewUtil.homebrew[prop] || []).find(it => it.name === entry.fluff[mappedProp].name && it.source === entry.fluff[mappedProp].source);
			if (fromList) {
				assignPropsIfExist(fromList, "name", "type", "entries", "images");
			}
		}

		if (entry.fluff[mappedPropAppend]) {
			const fromList = (BrewUtil.homebrew[prop] || []).find(it => it.name === entry.fluff[mappedPropAppend].name && it.source === entry.fluff[mappedPropAppend].source);
			if (fromList) {
				if (fromList.entries) {
					fluff.entries = MiscUtil.copy(fluff.entries || []);
					fluff.entries.push(...fluff.entries);
				}
				if (fromList.images) {
					fluff.images = MiscUtil.copy(fluff.images || []);
					fluff.images.push(...fromList.images);
				}
			}
		}

		return fluff;
	},

	/**
	 * @param isImageTab True if this is the "Images" tab, false otherwise
	 * @param $content The statblock wrapper
	 * @param record Item to build tab for (e.g. a monster; an item)
	 * @param fnFluffBuilder Function which builds the final fluff object from available data (handling any merges/etc)
	 * @param fluffUrl Fluff data URL
	 * @param fnCheckSourceInIndex Function which returns true if the record's source has a fluff data file
	 */
	buildFluffTab (isImageTab, $content, record, fnFluffBuilder, fluffUrl, fnCheckSourceInIndex) {
		const renderer = Renderer.get();

		$content.append(Renderer.utils.getBorderTr());
		$content.append(Renderer.utils.getNameTr(record));
		const $tr = $(`<tr class="text"/>`);
		$content.append($tr);
		const $td = $(`<td colspan="6" class="text"/>`).appendTo($tr);
		$content.append(Renderer.utils.getBorderTr());

		function renderFluff (data) {
			renderer.setFirstSection(true);
			const fluff = fnFluffBuilder(data);

			if (!fluff) {
				$td.empty().append(isImageTab ? HTML_NO_IMAGES : HTML_NO_INFO);
				return;
			}

			if (isImageTab) {
				if (fluff.images) {
					fluff.images.forEach(img => $td.append(renderer.render(img, 1)));
				} else {
					$td.append(HTML_NO_IMAGES);
				}
			} else {
				if (fluff.entries) {
					const depth = fluff.type === "section" ? -1 : 2;
					if (fluff.type !== "section") renderer.setFirstSection(false);
					$td.append(renderer.render({type: fluff.type, entries: fluff.entries}, depth));
				} else {
					$td.append(HTML_NO_INFO);
				}
			}
		}

		if ((fnCheckSourceInIndex && fnCheckSourceInIndex(record.source)) || record.fluff) {
			if (record.fluff) renderFluff();
			else DataUtil.loadJSON(fluffUrl).then(renderFluff);
		} else {
			$td.empty();
			if (isImageTab) $td.append(HTML_NO_IMAGES);
			else $td.append(HTML_NO_INFO);
		}
	}
};

Renderer.feat = {
	getPrerequisiteText: function (prereqList, isShorthand, doMakeAsArray) {
		isShorthand = isShorthand == null ? false : isShorthand;
		doMakeAsArray = doMakeAsArray == null ? false : doMakeAsArray;
		const andStack = [];
		if (prereqList == null) return "";
		for (let i = 0; i < prereqList.length; ++i) {
			const outStack = [];
			const pre = prereqList[i];
			if (pre.level) {
				if (isShorthand) {
					outStack.push(`Lvl ${pre.level}`);
				} else {
					outStack.push(`${Parser.spLevelToFull(pre.level)} level`);
				}
			}
			if (pre.race != null) {
				for (let j = 0; j < pre.race.length; ++j) {
					if (isShorthand) {
						const DASH = "-";
						const raceNameParts = pre.race[j].name.split(DASH);
						let raceName = [];
						for (let k = 0; k < raceNameParts.length; ++k) {
							raceName.push(raceNameParts[k].uppercaseFirst());
						}
						raceName = raceName.join(DASH);
						outStack.push(raceName + (pre.race[j].subrace != null ? " (" + pre.race[j].subrace + ")" : ""))
					} else {
						const raceName = j === 0 ? pre.race[j].name.uppercaseFirst() : pre.race[j].name;
						outStack.push(raceName + (pre.race[j].subrace != null ? " (" + pre.race[j].subrace + ")" : ""))
					}
				}
			}
			if (pre.ability != null) {
				// this assumes all ability requirements are the same (13), correct as of 2017-10-06
				let attCount = 0;
				for (let j = 0; j < pre.ability.length; ++j) {
					for (const att in pre.ability[j]) {
						if (!pre.ability[j].hasOwnProperty(att)) continue;
						if (isShorthand) {
							outStack.push(att.uppercaseFirst() + (attCount === pre.ability.length - 1 ? " 13+" : ""));
						} else {
							outStack.push(Parser.attAbvToFull(att) + (attCount === pre.ability.length - 1 ? " 13 or higher" : ""));
						}
						attCount++;
					}
				}
			}
			if (pre.proficiency != null) {
				// only handles armor proficiency requirements,
				for (let j = 0; j < pre.proficiency.length; ++j) {
					for (const type in pre.proficiency[j]) { // type is armor/weapon/etc.
						if (!pre.proficiency[j].hasOwnProperty(type)) continue;
						if (type === "armor") {
							if (isShorthand) {
								outStack.push("prof " + Parser.armorFullToAbv(pre.proficiency[j][type]) + " armor");
							} else {
								outStack.push("Proficiency with " + pre.proficiency[j][type] + " armor");
							}
						}
					}
				}
			}
			if (pre.spellcasting) {
				if (isShorthand) {
					outStack.push("Spellcasting");
				} else {
					outStack.push("The ability to cast at least one spell");
				}
			}
			if (pre.special) {
				if (isShorthand) outStack.push("Special");
				else {
					const renderer = Renderer.get();
					outStack.push(renderer.render(pre.special));
				}
			}
			andStack.push(outStack);
		}
		if (doMakeAsArray) {
			return andStack.reduce((a, b) => a.concat(b), []);
		} else {
			if (isShorthand) return andStack.map(it => it.join("/")).join("; ");
			else {
				const anyLong = andStack.filter(it => it.length > 1).length && andStack.length > 1;
				return andStack.map(it => it.joinConjunct(", ", " or ")).joinConjunct(anyLong ? "; " : ", ", anyLong ? " and " : ", ");
			}
		}
	},

	mergeAbilityIncrease: function (feat) {
		const entries = feat.entries;
		const abilityObj = feat.ability;
		if (!abilityObj || feat._hasMergedAbility) return;
		feat._hasMergedAbility = true;
		const targetList = entries.find(e => e.type === "list");
		if (targetList) targetList.items.unshift(abilityObjToListItem());
		else {
			// this should never happen, but display sane output anyway, and throw an out-of-order exception
			entries.unshift(abilityObjToListItem());
			setTimeout(() => {
				throw new Error(`Could not find object of type "list" in "entries" for feat "${feat.name}" from source "${feat.source}" when merging ability scores! Reformat the feat to include a "list"-type entry.`);
			}, 1);
		}

		function abilityObjToListItem () {
			const TO_MAX_OF_TWENTY = ", to a maximum of 20.";
			const abbArr = [];
			if (!abilityObj.choose) {
				Object.keys(abilityObj).forEach(ab => abbArr.push(`Increase your ${Parser.attAbvToFull(ab)} score by ${abilityObj[ab]}${TO_MAX_OF_TWENTY}`));
			} else {
				const choose = abilityObj.choose;
				for (let i = 0; i < choose.length; ++i) {
					if (choose[i].from.length === 6) {
						if (choose[i].textreference) { // only used in "Resilient"
							abbArr.push(`Increase the chosen ability score by ${choose[i].amount}${TO_MAX_OF_TWENTY}`);
						} else {
							abbArr.push(`Increase one ability score of your choice by ${choose[i].amount}${TO_MAX_OF_TWENTY}`);
						}
					} else {
						const from = choose[i].from;
						const amount = choose[i].amount;
						const abbChoices = [];
						for (let j = 0; j < from.length; ++j) {
							abbChoices.push(Parser.attAbvToFull(from[j]));
						}
						const abbChoicesText = abbChoices.joinConjunct(", ", " or ");
						abbArr.push(`Increase your ${abbChoicesText} by ${amount}${TO_MAX_OF_TWENTY}`);
					}
				}
			}
			return abbArr.join(" ");
		}
	},

	getCompactRenderedString: (feat) => {
		const renderer = Renderer.get();
		const renderStack = [];

		const prerequisite = Renderer.feat.getPrerequisiteText(feat.prerequisite);
		Renderer.feat.mergeAbilityIncrease(feat);
		renderStack.push(`
			${Renderer.utils.getNameTr(feat, {isAddPageNum: true})}
			<tr class='text'><td colspan='6' class='text'>
			${prerequisite ? `<p><i>Prerequisite: ${prerequisite}</i></p>` : ""}
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
	getCompactRenderedString: (spell) => {
		const renderer = Renderer.get();
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getNameTr(spell, {isAddPageNum: true})}
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
						<td colspan="4">${Parser.spComponentsToFull(spell)}</td>
						<td colspan="2">${Parser.spDurationToFull(spell.duration)}</td>
					</tr>
				</table>
			</td></tr>
		`);

		renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
		const entryList = {type: "entries", entries: spell.entries};
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		if (spell.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, renderStack, {depth: 2});
		}
		renderStack.push(`<div><span class="bold">Classes: </span>${Parser.spMainClassesToFull(spell.classes)}</div>`);
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	},

	getRenderedString: (spell, renderer, subclassLookup) => {
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(spell)}
			<tr><td class="levelschoolritual" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(spell.level, spell.school, spell.meta, spell.subschools)}</span></td></tr>
			<tr><td class="castingtime" colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull(spell.time)}</td></tr>
			<tr><td class="range" colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(spell.range)}</td></tr>
			<tr><td class="components" colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(spell)}</td></tr>
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
			renderer.recursiveRender(`{@italic Note: Both the {@class ${STR_FIGHTER} (${STR_ELD_KNIGHT})} and the {@class ${STR_ROGUE} (${STR_ARC_TCKER})} spell lists include all {@class ${STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`, renderStack, {depth: 2});
			renderStack.push(`</section></td></tr>`);
		}

		renderStack.push(`
			${Renderer.utils.getPageTr(spell)}
			${Renderer.utils.getBorderTr()}
		`);

		return renderStack.join("");
	}
};

Renderer.condition = {
	getCompactRenderedString: (cond) => {
		const renderer = Renderer.get();
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getNameTr(cond, {isAddPageNum: true})}
			<tr class="text"><td colspan="6">
		`);
		renderer.recursiveRender({entries: cond.entries}, renderStack);
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	}
};

Renderer.background = {
	getCompactRenderedString (bg) {
		return `
		${Renderer.utils.getNameTr(bg, {isAddPageNum: true})}
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
		}).join("/");
	}
};

Renderer.optionalfeature = {
	_prereqWeights: {
		prereqLevel: 0,
		prereqPact: 1,
		prereqPatron: 2,
		prereqSpell: 3,
		prereqFeature: 4,
		prereqItem: 5,
		prereqSpecial: 6,
		[undefined]: 7
	},
	getPrerequisiteText: (prerequisites, listMode) => {
		if (!prerequisites) return listMode ? "\u2014" : STR_NONE;

		prerequisites.sort((a, b) => {
			if (a.type === b.type) return SortUtil.ascSortLower(a.name, b.name);
			return Renderer.optionalfeature._prereqWeights[a.type] - Renderer.optionalfeature._prereqWeights[b.type]
		});

		const outList = prerequisites.map(it => {
			switch (it.type) {
				case "prereqLevel":
					return listMode ? false : `${Parser.levelToFull(it.level)} level`;
				case "prereqPact":
					return Parser.prereqPactToFull(it.entry);
				case "prereqPatron":
					return listMode ? `${Parser.prereqPatronToShort(it.entry)} patron` : `${it.entry} patron`;
				case "prereqSpell":
					return listMode ? it.entries.map(x => x.split("|")[0].toTitleCase()).join("; ") : it.entries.map(sp => Parser.prereqSpellToFull(sp)).joinConjunct(", ", " or ");
				case "prereqFeature":
					return listMode ? it.entries.map(x => x.toTitleCase()).join("; ") : it.entries.joinConjunct(", ", " or ");
				case "prereqItem":
					return listMode ? it.entries.map(x => x.toTitleCase()).join("; ") : it.entries.joinConjunct(", ", " or ");
				case "prereqSpecial":
					return listMode ? (it.entrySummary || Renderer.stripTags(it.entry)) : Renderer.get().render(it.entry);
				default: // string
					return it;
			}
		});

		if (!outList.filter(Boolean).length) return listMode ? "\u2014" : STR_NONE;
		return listMode ? outList.filter(Boolean).join(", ") : `Prerequisites: ${outList.join(", ")}`;
	},

	getListPrerequisiteLevelText (prerequisites) {
		if (!prerequisites || !prerequisites.some(it => it.type === "prereqLevel")) return "\u2014";
		return prerequisites.find(it => it.type === "prereqLevel").level;
	},

	getPreviouslyPrintedText (it) {
		return it.data && it.data.previousVersion ? `<tr><td colspan="6"><p>${Renderer.get().render(`{@i An earlier version of this ${Parser.optFeatureTypeToFull(it.featureType)} is available in }${Parser.sourceJsonToFull(it.data.previousVersion.source)} {@i as {@optfeature ${it.data.previousVersion.name}|${it.data.previousVersion.source}}.}`)}</p></td></tr>` : ""
	},

	getCompactRenderedString: (it) => {
		const renderer = Renderer.get();
		const renderStack = [];

		renderStack.push(`
			${Renderer.utils.getNameTr(it, {isAddPageNum: true})}
			<tr class="text"><td colspan="6">
			${it.prerequisite ? `<p><i>${Renderer.optionalfeature.getPrerequisiteText(it.prerequisite)}</i></p>` : ""}
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
		return `<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>`;
	},

	getCompactRenderedString: (reward) => {
		return `
			${Renderer.utils.getNameTr(reward, {isAddPageNum: true})}
			${Renderer.reward.getRenderedString(reward)}
		`;
	}
};

Renderer.race = {
	getCompactRenderedString: (race) => {
		const renderer = Renderer.get();
		const renderStack = [];

		const ability = Renderer.getAbilityData(race.ability);
		renderStack.push(`
			${Renderer.utils.getNameTr(race, {isAddPageNum: true})}
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
			</td></tr>
			<tr class='text'><td colspan='6'>
		`);
		renderer.recursiveRender({type: "entries", entries: race.entries}, renderStack, {depth: 1});
		renderStack.push("</td></tr>");

		return renderStack.join("");
	},

	mergeSubraces: (races) => {
		const out = [];
		races.forEach(r => {
			Array.prototype.push.apply(out, Renderer.race._mergeSubrace(r));
		});
		return out;
	},

	_mergeSubrace: (race) => {
		if (race.subraces) {
			const srCopy = JSON.parse(JSON.stringify(race.subraces));
			const out = [];

			srCopy.forEach(s => {
				const cpy = JSON.parse(JSON.stringify(race));
				cpy._baseName = cpy.name;
				cpy._baseSource = cpy.source;
				delete cpy.subraces;

				// merge names, abilities, entries, tags
				if (s.name) {
					cpy.name = `${cpy.name} (${s.name})`;
					delete s.name;
				}
				if (s.ability) {
					if (s.ability.overwrite || !cpy.ability) cpy.ability = {};
					cpy.ability = Object.assign(cpy.ability, s.ability);
					delete cpy.ability.overwrite;
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
				// TODO needs a mechanism to allow subraces to override unwanted tags
				if (s.traitTags) {
					cpy.traitTags = (cpy.traitTags || []).concat(s.traitTags);
					delete s.traitTags;
				}
				if (s.languageTags) {
					cpy.languageTags = (cpy.languageTags || []).concat(s.languageTags);
					delete s.languageTags;
				}

				// overwrite everything else
				Object.assign(cpy, s);

				out.push(cpy);
			});
			return out;
		} else {
			return [race];
		}
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

	getCompactRenderedString: (deity) => {
		const renderer = Renderer.get();
		return `
			${Renderer.utils.getNameTr(deity, {isAddPageNum: true, suffix: deity.title ? `, ${deity.title.toTitleCase()}` : ""})}
			<tr><td colspan="6">
				<div class="rd__compact-stat">${Renderer.deity.getOrderedParts(deity, `<p>`, `</p>`)}</div>
			</td>
			${deity.entries ? `<tr><td colspan="6"><div class="border"></div></td></tr><tr><td colspan="6">${renderer.render({entries: deity.entries}, 1)}</td></tr>` : ""}
		`;
	}
};

Renderer.object = {
	getCompactRenderedString: (obj) => {
		const renderer = Renderer.get();
		const row2Width = 12 / ((!!obj.resist + !!obj.vulnerable) || 1);
		return `
			${Renderer.utils.getNameTr(obj, {isAddPageNum: true})}
			<tr><td colspan="6">
				<table class="summary striped-even">
					<tr>
						<th colspan="3" class="text-center">Type</th>
						<th colspan="2" class="text-center">AC</th>
						<th colspan="2" class="text-center">HP</th>
						<th colspan="5" class="text-center">Damage Imm.</th>
					</tr>
					<tr>
						<td colspan="3" class="text-center">${Parser.sizeAbvToFull(obj.size)} object</td>					
						<td colspan="2" class="text-center">${obj.ac}</td>
						<td colspan="2" class="text-center">${obj.hp}</td>
						<td colspan="5" class="text-center">${obj.immune}</td>
					</tr>
					${obj.resist || obj.vulnerable ? `
					<tr>
						${obj.resist ? `<th colspan="${row2Width}" class="text-center">Damage Res.</th>` : ""}
						${obj.vulnerable ? `<th colspan="${row2Width}" class="text-center">Damage Vuln.</th>` : ""}
					</tr>
					<tr>
						${obj.resist ? `<td colspan="${row2Width}" class="text-center">${obj.resist}</td>` : ""}
						${obj.vulnerable ? `<td colspan="${row2Width}" class="text-center">${obj.vulnerable}</td>` : ""}
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

	getCompactRenderedString: (it) => {
		const renderer = Renderer.get();
		const subtitle = Renderer.traphazard.getSubtitle(it);
		return `
			${Renderer.utils.getNameTr(it, {isAddPageNum: true})}
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
		benefits.items.push({
			type: "item",
			name: "Ability Score Adjustment:",
			entry: it.ability ? it.ability.entry : "None"
		});
		benefits.items.push({
			type: "item",
			name: "Signature Spells:",
			entry: it.signaturespells ? it.signaturespells.entry : "None"
		});
		renderer.recursiveRender(benefits, renderStack, {depth: 1});
	},

	getCompactRenderedString: (it) => {
		const renderer = Renderer.get();

		const renderStack = [];
		if (it._type === "c") {
			Renderer.cultboon.doRenderCultParts(it, renderer, renderStack);
			renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 2});
			return `${Renderer.utils.getNameTr(it, {isAddPageNum: true})}
				<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
				<tr class='text'><td colspan='6' class='text'>${renderStack.join("")}</td></tr>`;
		} else if (it._type === "b") {
			Renderer.cultboon.doRenderBoonParts(it, renderer, renderStack);
			renderer.recursiveRender({entries: it.entries}, renderStack, {depth: 1});
			return `${Renderer.utils.getNameTr(it, {isAddPageNum: true})}
			<tr class='text'><td colspan='6'>${renderStack.join("")}</td></tr>`;
		}
	}
};

Renderer.monster = {
	_MERGE_REQUIRES_PRESERVE: {
		legendaryGroup: true,
		environment: true,
		soundClip: true,
		page: true,
		altArt: true,
		otherSources: true,
		variant: true,
		dragonCastingColor: true
	},
	_mergeCache: null,
	async pMergeCopy (monList, mon, options) {
		function search () {
			return monList.find(it => {
				Renderer.monster._mergeCache[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](it)] = it;
				return it.name === mon._copy.name && it.source === mon._copy.source;
			});
		}

		if (mon._copy) {
			const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon._copy);
			Renderer.monster._mergeCache = Renderer.monster._mergeCache || {};
			const it = Renderer.monster._mergeCache[hash] || search();
			if (!it) return;
			return Renderer.monster._pApplyCopy(MiscUtil.copy(it), mon, options);
		}
	},

	async _pApplyCopy (copyFrom, copyTo, options = {}) {
		if (options.doKeepCopy) copyTo.__copy = MiscUtil.copy(copyFrom);

		// convert everything to arrays
		function normaliseMods (obj) {
			Object.entries(obj._mod).forEach(([k, v]) => {
				if (!(v instanceof Array)) obj._mod[k] = [v];
			});
		}

		const copyMeta = copyTo._copy || {};

		if (copyMeta._mod) normaliseMods(copyMeta);

		// fetch and apply any external traits -- append them to existing copy mods where available
		let racials = null;
		if (copyMeta._trait) {
			const traitData = await DataUtil.loadJSON("data/bestiary/traits.json");
			racials = traitData.trait.find(t => t.name.toLowerCase() === copyMeta._trait.name.toLowerCase() && t.source.toLowerCase() === copyMeta._trait.source.toLowerCase());
			if (!racials) throw new Error(`Could not find traits to apply with name "${copyMeta._trait.name}" and source "${copyMeta._trait.source}"`);
			racials = MiscUtil.copy(racials);

			if (racials.apply._mod) {
				normaliseMods(racials.apply);

				if (copyMeta._mod) {
					Object.entries(racials.apply._mod).forEach(([k, v]) => {
						if (copyMeta._mod[k]) copyMeta._mod[k] = copyMeta._mod[k].concat(v);
						else copyMeta._mod[k] = v;
					});
				} else copyMeta._mod = racials.apply._mod;
			}

			delete copyMeta._trait;
		}

		// copy over required values
		Object.keys(copyFrom).forEach(k => {
			if (copyTo[k] === null) return delete copyTo[k];
			if (copyTo[k] == null) {
				if (Renderer.monster._MERGE_REQUIRES_PRESERVE[k]) {
					if (copyTo._copy._preserve && copyTo._copy._preserve[k]) copyTo[k] = copyFrom[k];
				} else copyTo[k] = copyFrom[k];
			}
		});

		// apply any root racial properties after doing base copy
		if (racials && racials.apply._root) Object.entries(racials.apply._root).forEach(([k, v]) => copyTo[k] = v);

		// mod helpers /////////////////
		function doEnsureArray (obj, prop) {
			if (!(obj[prop] instanceof Array)) obj[prop] = [obj[prop]];
		}

		function doMod_appendStr (modInfo, prop) {
			if (copyTo[prop]) copyTo[prop] = `${copyTo[prop]}${modInfo.joiner || ""}${modInfo.str}`;
			else copyTo[prop] = modInfo.str;
		}

		function doMod_replaceTxt (modInfo, prop) {
			const re = new RegExp(modInfo.replace, `g${modInfo.flags || ""}`);
			if (copyTo[prop]) {
				copyTo[prop].forEach(it => {
					if (it.entries) it.entries = JSON.parse(JSON.stringify(it.entries).replace(re, modInfo.with));
					if (it.headerEntries) it.headerEntries = JSON.parse(JSON.stringify(it.headerEntries).replace(re, modInfo.with));
				});
			}
		}

		function doMod_prependArr (modInfo, prop) {
			doEnsureArray(modInfo, "items");
			copyTo[prop] = copyTo[prop] ? modInfo.items.concat(copyTo[prop]) : modInfo.items
		}

		function doMod_appendArr (modInfo, prop) {
			doEnsureArray(modInfo, "items");
			copyTo[prop] = copyTo[prop] ? copyTo[prop].concat(modInfo.items) : modInfo.items
		}

		function doMod_replaceArr (modInfo, prop, isThrow = true) {
			doEnsureArray(modInfo, "items");

			if (!copyTo[prop]) {
				if (isThrow) throw new Error(`Could not find "${prop}" array`);
				return false;
			}

			let ixOld;
			if (modInfo.replace.regex) {
				const re = new RegExp(modInfo.replace.regex, modInfo.replace.flags || "");
				ixOld = copyTo[prop].findIndex(it => it.name ? re.test(it.name) : typeof it === "string" ? re.test(it) : false);
			} else {
				ixOld = copyTo[prop].findIndex(it => it.name ? it.name === modInfo.replace : it === modInfo.replace);
			}

			if (~ixOld) {
				copyTo[prop].splice(ixOld, 1, ...modInfo.items);
				return true;
			} else if (isThrow) throw new Error(`Could not find "${prop}" item with name "${modInfo.replace}" to replace`);
			return false;
		}

		function doMod_replaceOrAppendArr (modInfo, prop) {
			const didReplace = doMod_replaceArr(modInfo, prop, false);
			if (!didReplace) doMod_appendArr(modInfo, prop);
		}

		function doMod_removeArr (modInfo, prop) {
			if (modInfo.names) {
				doEnsureArray(modInfo, "names");
				modInfo.names.forEach(nameToRemove => {
					const ixOld = copyTo[prop].findIndex(it => it.name === nameToRemove);
					if (~ixOld) copyTo[prop].splice(ixOld, 1);
					else throw new Error(`Could not find "${prop}" item with name "${nameToRemove}" to remove`);
				});
			} else if (modInfo.items) {
				doEnsureArray(modInfo, "items");
				modInfo.items.forEach(itemToRemove => {
					const ixOld = copyTo[prop].findIndex(it => it === itemToRemove);
					if (~ixOld) copyTo[prop].splice(ixOld, 1);
					else throw new Error(`Could not find "${prop}" item "${itemToRemove}" to remove`);
				});
			} else throw new Error(`One of "names" or "items" must be provided!`)
		}

		function doMod_calculateProp (modInfo, prop) {
			copyTo[prop] = copyTo[prop] || {};
			const toExec = modInfo.formula.replace(/<\$([^$]+)\$>/g, (...m) => {
				switch (m[1]) {
					case "prof_bonus": return Parser.crToPb(copyTo.cr);
					case "dex_mod": return Parser.getAbilityModNumber(copyTo.dex);
					default: throw new Error(`Unknown variable "${m[1]}"`);
				}
			});
			// eslint-disable-next-line no-eval
			copyTo[prop][modInfo.prop] = eval(toExec);
		}

		function doMod_scalarAddProp (modInfo, prop) {
			function applyTo (k) {
				const out = Number(copyTo[prop][k]) + modInfo.scalar;
				const isString = typeof copyTo[prop][k] === "string";
				copyTo[prop][k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
			}

			if (!copyTo[prop]) return;
			if (modInfo.prop === "*") Object.keys(copyTo[prop]).forEach(k => applyTo(k));
			else applyTo(modInfo.prop);
		}

		function doMod_scalarMultProp (modInfo, prop) {
			function applyTo (k) {
				let out = Number(copyTo[prop][k]) * modInfo.scalar;
				if (modInfo.floor) out = Math.floor(out);
				const isString = typeof copyTo[prop][k] === "string";
				copyTo[prop][k] = isString ? `${out >= 0 ? "+" : ""}${out}` : out;
			}

			if (!copyTo[prop]) return;
			if (modInfo.prop === "*") Object.keys(copyTo[prop]).forEach(k => applyTo(k));
			else applyTo(modInfo.prop);
		}

		function doMod_addSenses (modInfo) {
			doEnsureArray(modInfo, "senses");
			copyTo.senses = copyTo.senses || [];
			modInfo.senses.forEach(sense => {
				let found = false;
				for (let i = 0; i < copyTo.senses.length; ++i) {
					const m = new RegExp(`${sense.type} (\\d+)`, "i").exec(copyTo.senses[i]);
					if (m) {
						found = true;
						// if the creature already has a greater sense of this type, do nothing
						if (Number(m[1]) < sense.type) {
							copyTo.senses[i] = `${sense.type} ${sense.range} ft.`;
						}
						break;
					}
				}

				if (!found) copyTo.senses.push(`${sense.type} ${sense.range} ft.`);
			});
		}

		function doMod_addSkills (modInfo) {
			copyTo.skill = copyTo.skill || [];
			Object.entries(modInfo.skills).forEach(([skill, mode]) => {
				// mode: 1 = proficient; 2 = expert
				const total = mode * Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(copyTo[Parser.skillToAbilityAbv(skill)]);
				const asText = total >= 0 ? `+${total}` : `-${total}`;
				if (copyTo.skill && copyTo.skill[skill]) {
					// update only if ours is larger (prevent reduction in skill score)
					if (Number(copyTo.skill[skill]) < total) copyTo.skill[skill] = asText;
				} else copyTo.skill[skill] = asText;
			});
		}

		function doMod_addSpells (modInfo) {
			if (!copyTo.spellcasting) throw new Error(`Creature did not have a spellcasting property!`);

			// TODO should be rewritten to handle non-slot-based spellcasters
			// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
			const trait0 = copyTo.spellcasting[0].spells;
			Object.keys(modInfo.spells).forEach(k => {
				if (!trait0[k]) trait0[k] = modInfo.spells[k];
				else {
					// merge the objects
					const spellCategoryNu = modInfo.spells[k];
					const spellCategoryOld = trait0[k];
					Object.keys(spellCategoryNu).forEach(kk => {
						if (!spellCategoryOld[kk]) spellCategoryOld[kk] = spellCategoryNu[kk];
						else {
							if (typeof spellCategoryOld[kk] === "object") {
								if (spellCategoryOld[kk] instanceof Array) spellCategoryOld[kk] = spellCategoryOld[kk].concat(spellCategoryNu[kk]).sort(SortUtil.ascSortLower);
								else throw new Error(`Object at key ${kk} not an array!`);
							} else spellCategoryOld[kk] = spellCategoryNu[kk];
						}
					});
				}
			});
		}

		function doMod_replaceSpells (modInfo) {
			if (!copyTo.spellcasting) throw new Error(`Creature did not have a spellcasting property!`);

			// TODO should be rewritten to handle non-slot-based spellcasters
			// TODO could accept a "position" or "name" parameter should spells need to be added to other spellcasting traits
			const trait0 = copyTo.spellcasting[0].spells;
			Object.keys(modInfo.spells).forEach(k => {
				if (trait0[k]) {
					const spellCategoryNu = modInfo.spells[k];
					const spellCategoryOld = trait0[k];
					Object.keys(spellCategoryNu).forEach(kk => {
						doEnsureArray(spellCategoryNu[kk], "with");

						if (spellCategoryOld[kk]) {
							if (typeof spellCategoryOld[kk] === "object") {
								if (spellCategoryOld[kk] instanceof Array) {
									const ix = spellCategoryOld[kk].indexOf(spellCategoryNu[kk].replace);
									if (~ix) {
										spellCategoryOld[kk].splice(ix, 1, ...spellCategoryNu[kk].with);
										spellCategoryOld[kk].sort(SortUtil.ascSortLower);
									}
								} else throw new Error(`Object at key ${kk} not an array!`);
							} else {
								if (spellCategoryNu[kk].replace === spellCategoryOld[kk]) {
									spellCategoryOld[kk] = spellCategoryNu[kk].with;
								}
							}
						}
					});
				}
			});
		}

		function doMod_scalarAddHit (modInfo, prop) {
			if (!copyTo[prop]) return;
			copyTo[prop] = JSON.parse(JSON.stringify(copyTo[prop]).replace(/{@hit ([-+]?\d+)}/g, (m0, m1) => `{@hit ${Number(m1) + modInfo.scalar}}`))
		}

		function doMod_scalarAddDc (modInfo, prop) {
			if (!copyTo[prop]) return;
			copyTo[prop] = JSON.parse(JSON.stringify(copyTo[prop]).replace(/{@dc (\d+)}/g, (m0, m1) => `{@dc ${Number(m1) + modInfo.scalar}}`));
		}

		function doMod_maxSize (modInfo) {
			const ixCur = Parser.SIZE_ABVS.indexOf(copyTo.size);
			const ixMax = Parser.SIZE_ABVS.indexOf(modInfo.max);
			if (ixCur < 0 || ixMax < 0) throw new Error(`Unhandled size!`);
			copyTo.size = Parser.SIZE_ABVS[Math.min(ixCur, ixMax)]
		}

		function doMod_scalarMultXp (modInfo) {
			function getOutput (input) {
				let out = input * modInfo.scalar;
				if (modInfo.floor) out = Math.floor(out);
				return out;
			}

			if (copyTo.cr.xp) copyTo.cr.xp = getOutput(copyTo.cr.xp);
			else {
				const curXp = Parser.crToXpNumber(copyTo.cr);
				if (!copyTo.cr.cr) copyTo.cr = {cr: copyTo.cr};
				copyTo.cr.xp = getOutput(curXp);
			}
		}

		function doMod (modInfos, ...properties) {
			function handleProp (prop) {
				modInfos.forEach(modInfo => {
					if (typeof modInfo === "string") {
						switch (modInfo) {
							case "remove": return delete copyTo[prop];
							default: throw new Error(`Unhandled mode: ${modInfo}`);
						}
					} else {
						switch (modInfo.mode) {
							case "appendStr": return doMod_appendStr(modInfo, prop);
							case "replaceTxt": return doMod_replaceTxt(modInfo, prop);
							case "prependArr": return doMod_prependArr(modInfo, prop);
							case "appendArr": return doMod_appendArr(modInfo, prop);
							case "replaceArr": return doMod_replaceArr(modInfo, prop);
							case "replaceOrAppendArr": return doMod_replaceOrAppendArr(modInfo, prop);
							case "removeArr": return doMod_removeArr(modInfo, prop);
							case "calculateProp": return doMod_calculateProp(modInfo, prop);
							case "scalarAddProp": return doMod_scalarAddProp(modInfo, prop);
							case "scalarMultProp": return doMod_scalarMultProp(modInfo, prop);
							// bestiary specific
							case "addSenses": return doMod_addSenses(modInfo);
							case "addSkills": return doMod_addSkills(modInfo);
							case "addSpells": return doMod_addSpells(modInfo);
							case "replaceSpells": return doMod_replaceSpells(modInfo);
							case "scalarAddHit": return doMod_scalarAddHit(modInfo, prop);
							case "scalarAddDc": return doMod_scalarAddDc(modInfo, prop);
							case "maxSize": return doMod_maxSize(modInfo);
							case "scalarMultXp": return doMod_scalarMultXp(modInfo);
							default: throw new Error(`Unhandled mode: ${modInfo.mode}`);
						}
					}
				});
			}

			properties.forEach(prop => handleProp(prop));
			// special case for "no property" modifications, i.e. underscore-key'd
			if (!properties.length) handleProp();
		}

		// apply mods
		if (copyMeta._mod) {
			// pre-convert any dynamic text
			Object.entries(copyMeta._mod).forEach(([k, v]) => {
				copyMeta._mod[k] = JSON.parse(
					JSON.stringify(v)
						.replace(/<\$([^$]+)\$>/g, (...m) => {
							const parts = m[1].split("__");

							switch (parts[0]) {
								case "name": return copyTo.name;
								case "short_name":
								case "title_name": {
									return copyTo.isNpc ? copyTo.name.split(" ")[0] : `${parts[0] === "title_name" ? "The " : "the "}${copyTo.name.toLowerCase()}`;
								}
								case "spell_dc": {
									if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
									return 8 + Parser.getAbilityModNumber(Number(copyTo[parts[1]])) + Parser.crToPb(copyTo.cr);
								}
								case "to_hit": {
									if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
									const total = Parser.crToPb(copyTo.cr) + Parser.getAbilityModNumber(Number(copyTo[parts[1]]));
									return total >= 0 ? `+${total}` : total;
								}
								case "damage_mod": {
									if (!Parser.ABIL_ABVS.includes(parts[1])) throw new Error(`Unknown ability score "${parts[1]}"`);
									const total = Parser.getAbilityModNumber(Number(copyTo[parts[1]]));
									return total === 0 ? "" : total > 0 ? ` +${total}` : ` ${total}`;
								}
								case "damage_avg": {
									const replaced = parts[1].replace(/(str|dex|con|int|wis|cha)/gi, (...m2) => Parser.getAbilityModNumber(Number(copyTo[m2[0]])))
									const clean = replaced.replace(/[^-+/*0-9.,]+/g, "");
									// eslint-disable-next-line no-eval
									return Math.floor(eval(clean));
								}
								default: return m[0];
							}
						})
				);
			});

			Object.entries(copyMeta._mod).forEach(([prop, modInfos]) => {
				if (prop === "*") doMod(modInfos, "action", "reaction", "trait", "legendary", "variant", "spellcasting");
				else if (prop === "_") doMod(modInfos);
				else doMod(modInfos, prop);
			});
		}

		// add filter tag
		copyTo._isCopy = true;

		// cleanup
		delete copyTo._copy;
	},

	getLegendaryActionIntro: (mon) => {
		function getCleanName () {
			if (mon.shortName) return mon.shortName;
			const base = mon.name.split(",")[0];
			const cleanDragons = base
				.replace(/(?:adult|ancient|young) \w+ (dragon|dracolich)/gi, "$1");
			return mon.isNamedCreature ? cleanDragons.split(" ")[0] : cleanDragons.toLowerCase();
		}

		if (mon.legendaryHeader) {
			return mon.legendaryHeader.map(line => Renderer.get().render(line)).join("</p><p>");
		} else {
			const legendaryActions = mon.legendaryActions || 3;
			const legendaryName = getCleanName();
			return `${mon.isNamedCreature ? "" : "The "}${legendaryName} can take ${legendaryActions} legendary action${legendaryActions > 1 ? "s" : ""}, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. ${mon.isNamedCreature ? "" : "The "}${legendaryName} regains spent legendary actions at the start of its turn.`
		}
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

	getCrScaleTarget ($btnScaleCr, initialCr, cbRender, isCompact) {
		const $body = $(`body`);
		function cleanSliders () {
			$body.find(`.mon__cr_slider_wrp`).remove();
		}

		const $wrp = $(`<div class="mon__cr_slider_wrp ${isCompact ? "mon__cr_slider_wrp--compact" : ""}"/>`);
		const $sld = $(`<div class="mon__cr_slider"/>`).appendTo($wrp);

		const curr = Parser.CRS.indexOf(initialCr);
		if (curr === -1) throw new Error(`Initial CR ${initialCr} was not valid!`);

		cleanSliders();
		const evtName = "click.cr-scaler";
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
		return mon[key] ? `
		<tr class="mon__stat-header-underline"><td colspan="6"><span class="mon__sect-header-inner">${title}</span></td></tr>
		<tr class="text compact"><td colspan="6">
		${key === "legendary" && mon.legendary ? `<p>${Renderer.monster.getLegendaryActionIntro(mon)}</p>` : ""}
		${mon[key].map(it => it.rendered || renderer.render(it, depth)).join("")}
		</td></tr>
		` : "";
	},

	getCompactRenderedString: (mon, renderer, options = {}) => {
		renderer = renderer || Renderer.get();

		const renderStack = [];
		const isCrHidden = Parser.crToNumber(mon.cr) === 100;

		renderStack.push(`
			${Renderer.utils.getNameTr(mon, {isAddPageNum: true})}
			<tr><td colspan="6"><i>${mon.level ? `${Parser.levelToFull(mon.level)}-level ` : ""}${Parser.sizeAbvToFull(mon.size)} ${Parser.monTypeToFullObj(mon.type).asText}${mon.alignment ? `, ${Parser.alignmentListToFull(mon.alignment).toLowerCase()}` : ""}</i></td></tr>
			<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr><td colspan="6">
				<table class="summary-noback" style="position: relative;">
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
							${options.showScaler && Parser.isValidCr(mon.cr.cr || mon.cr) ? `
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
					${mon.save ? `<p><b>Saving Throws:</b> ${Object.keys(mon.save).sort(SortUtil.ascSortAtts).map(s => Renderer.monster.getSave(renderer, s, mon.save[s])).join(", ")}</p>` : ""}
					${mon.skill ? `<p><b>Skills:</b> ${Renderer.monster.getSkillsString(renderer, mon)}</p>` : ""}
					<p><b>Senses:</b> ${mon.senses ? `${Renderer.monster.getRenderedSenses(mon.senses)}, ` : ""}passive Perception ${mon.passive}</p>
					<p><b>Languages:</b> ${Renderer.monster.getRenderedLanguages(mon.languages)}</p>
					${mon.vulnerable ? `<p><b>Damage Vuln.:</b> ${Parser.monImmResToFull(mon.vulnerable)}</p>` : ""}
					${mon.resist ? `<p><b>Damage Res.:</b> ${Parser.monImmResToFull(mon.resist)}</p>` : ""}
					${mon.immune ? `<p><b>Damage Imm.:</b> ${Parser.monImmResToFull(mon.immune)}</p>` : ""}
					${mon.conditionImmune ? `<p><b>Condition Imm.:</b> ${Parser.monCondImmToFull(mon.conditionImmune)}</p>` : ""}
				</div>
			</td></tr>
			${mon.trait || mon.spellcasting ? `<tr><td colspan="6"><div class="border"></div></td></tr>
			<tr class="text compact"><td colspan="6">
			${Renderer.monster.getOrderedTraits(mon, renderer).map(it => it.rendered || renderer.render(it, 2)).join("")}
			</td></tr>` : ""}
			${Renderer.monster.getCompactRenderedStringSection(mon, renderer, "Actions", "action", 2)}
			${Renderer.monster.getCompactRenderedStringSection(mon, renderer, "Reactions", "reaction", 2)}
			${Renderer.monster.getCompactRenderedStringSection(mon, renderer, "Legendary Actions", "legendary", 2)}
			${mon.variant || (mon.dragonCastingColor && !mon.spellcasting) ? `
			<tr class="text compact"><td colspan="6">
			${mon.variant ? mon.variant.map(it => it.rendered || renderer.render(it)).join("") : ""}
			${mon.dragonCastingColor ? Renderer.monster.getDragonCasterVariant(renderer, mon) : ""}
			</td></tr>
			` : ""}
		`);

		return renderStack.join("");
	},

	getRenderedHp: (hp) => {
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
		let trait = mon.trait ? JSON.parse(JSON.stringify(mon.trait)) : null;
		if (mon.spellcasting) {
			const spellTraits = Renderer.monster.getSpellcastingRenderedTraits(mon, renderer);
			// weave spellcasting in with other traits
			trait = trait ? trait.concat(spellTraits) : spellTraits;
		}
		if (trait) return trait.sort((a, b) => SortUtil.monTraitSort(a.name, b.name));
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
		return mon.tokenUrl || UrlUtil.link(`img/${Parser.sourceJsonToAbv(mon.source)}/${Parser.nameToTokenName(mon.name)}.png`);
	},

	getFluff (mon, legendaryMeta, fluffJson) {
		const predefined = Renderer.utils.getPredefinedFluff(mon, "monsterFluff");

		const rawFluff = predefined || (fluffJson || {monster: []}).monster.find(it => it.name === mon.name && it.source === mon.source);

		if (!rawFluff) return null;
		const fluff = MiscUtil.copy(rawFluff);

		// TODO is this good enough? Should additionally check for lair blocks which are not the last, and tag them with
		//   "data": {"lairRegionals": true}, and insert the lair/regional text there if available (do the current "append" otherwise)
		let hasAddedLegendary = false;
		function addLegendaryGroup (fluff) {
			if (hasAddedLegendary) return;
			hasAddedLegendary = true;
			const thisGroup = legendaryMeta[mon.legendaryGroup.source][mon.legendaryGroup.name];
			const handleProp = (prop, name) => {
				if (thisGroup[prop]) {
					fluff.entries.push({
						type: "section",
						entries: [{
							type: "entries",
							entries: [{
								type: "entries",
								name,
								entries: MiscUtil.copy(thisGroup[prop])
							}]
						}]
					});
				}
			};

			handleProp("lairActions", "Lair Actions");
			handleProp("regionalEffects", "Regional Effects");
		}

		if (fluff.entries && mon.legendaryGroup && (legendaryMeta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name]) {
			addLegendaryGroup(fluff);
		}

		function handleRecursive (ptrFluff) {
			const fluff = MiscUtil.copy(ptrFluff.fluff);
			ptrFluff.fluff = fluff;
			const cachedAppendCopy = fluff._appendCopy; // prevent _copy from overwriting this

			if (fluff._copy) {
				const cpy = MiscUtil.copy(fluffJson.monster.find(it => fluff._copy.name === it.name && fluff._copy.source === it.source));
				// preserve these
				const name = fluff.name;
				const src = fluff.source;
				const images = fluff.images;

				// remove this
				delete fluff._copy;

				Object.assign(fluff, cpy);
				fluff.name = name;
				fluff.source = src;
				if (images) fluff.images = images;

				if (fluff.entries && mon.legendaryGroup && (legendaryMeta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name]) {
					addLegendaryGroup(fluff);
				}

				handleRecursive(ptrFluff);
			}

			if (cachedAppendCopy) {
				const cpy = MiscUtil.copy(fluffJson.monster.find(it => cachedAppendCopy.name === it.name && cachedAppendCopy.source === it.source));
				if (cpy.images) {
					if (!fluff.images) fluff.images = cpy.images;
					else fluff.images = fluff.images.concat(cpy.images);
				}
				if (cpy.entries) {
					if (!fluff.entries) fluff.entries = cpy.entries;
					else {
						if ((cpy.entries[0] || {}).type !== "section") {
							fluff.entries = fluff.entries.concat({type: "section", entries: cpy.entries})
						} else fluff.entries = fluff.entries.concat(cpy.entries);
					}
				}
				delete fluff._appendCopy;

				fluff._copy = cpy._copy;
				fluff._appendCopy = cpy._appendCopy;

				if (fluff.entries && mon.legendaryGroup && (legendaryMeta[mon.legendaryGroup.source] || {})[mon.legendaryGroup.name]) {
					addLegendaryGroup(fluff);
				}

				handleRecursive(ptrFluff);
			}
		}

		const ptrFluff = {fluff};
		if (ptrFluff.fluff._copy || ptrFluff.fluff._appendCopy) {
			handleRecursive(ptrFluff);
		}

		return ptrFluff.fluff;
	},

	getRenderedSenses (senses) {
		if (typeof senses === "string") senses = [senses]; // handle legacy format
		const senseStr = senses.join(", ").replace(/(^| )(tremorsense|blindsight|truesight|darkvision)( |$)/gi, (...m) => `${m[1]}{@sense ${m[2]}}${m[3]}`);
		return Renderer.get().render(senseStr);
	},

	getRenderedLanguages (languages) {
		if (typeof languages === "string") languages = [languages]; // handle legacy format
		return languages ? languages.join(", ") : "\u2014";
	}
};

Renderer.item = {
	// avoid circular references by deciding a global link direction for specific <-> general
	// default is general -> specific
	LINK_SPECIFIC_TO_GENERIC_DIRECTION: 1,

	getDamageAndPropertiesText: function (item) {
		const type = item.type || "";
		let damage = "";
		let damageType = "";
		if (item.weaponCategory) {
			if (item.dmg1) damage = Renderer.get().render(item.dmg1);
			if (item.dmgType) damageType = Parser.dmgTypeToFull(item.dmgType);
		} else if (type === "LA" || type === "MA" || type === "HA") {
			damage = "AC " + item.ac + (type === "LA" ? " + Dex" : type === "MA" ? " + Dex (max 2)" : "");
		} else if (type === "S") {
			damage = "AC +" + item.ac;
		} else if (type === "MNT" || type === "VEH" || type === "SHP" || type === "AIR") {
			const speed = item.speed;
			const capacity = item.carryingcapacity;
			if (speed) damage += "Speed: " + speed;
			if (speed && capacity) damage += type === "MNT" ? ", " : "<br>";
			if (capacity) {
				damage += "Carrying Capacity: " + capacity;
				if (capacity.indexOf("ton") === -1 && capacity.indexOf("passenger") === -1) damage += Number(capacity) === 1 ? " lb." : " lbs.";
			}
			if (type === "SHP" || type === "AIR") {
				damage += `<br>Crew ${item.crew}, AC ${item.vehAc}, HP ${item.vehHp}${item.vehDmgThresh ? `, Damage Threshold ${item.vehDmgThresh}` : ""}`;
			}
		}

		function sortProperties (a, b) {
			return SortUtil.ascSort(item._allPropertiesPtr[a].name, item._allPropertiesPtr[b].name)
		}

		let propertiesTxt = "";
		if (item.property) {
			const properties = item.property.sort(sortProperties);
			for (let i = 0; i < properties.length; ++i) {
				const prop = properties[i];
				let a = item._allPropertiesPtr[prop].name;
				if (prop === "V") a = `${a} (${Renderer.get().render(item.dmg2)})`;
				if (prop === "T" || prop === "A" || prop === "AF") a = `${a} (${item.range} ft.)`;
				if (prop === "RLD") a = `${a} (${item.reload} shots)`;
				a = (i > 0 ? ", " : item.dmg1 ? "- " : "") + a;
				propertiesTxt += a;
			}
		} else {
			const parts = [];
			if (item.range) parts.push(`range ${item.range} ft.`);
			propertiesTxt += `${item.dmg1 ? " - " : ""}${parts.join(", ")}`;
		}
		return [damage, damageType, propertiesTxt];
	},

	getTypeRarityAndAttunementText (item) {
		const typeRarity = [
			item.typeText === "Other" ? "" : item.typeText.trim(),
			[item.tier, (item.rarity && Renderer.item.doRenderRarity(item.rarity) ? item.rarity : "")].map(it => (it || "").trim()).filter(it => it).join(", ")
		].filter(Boolean).join(", ");
		return item.reqAttune ? `${typeRarity} ${item.reqAttune}` : typeRarity
	},

	getCompactRenderedString: function (item) {
		const renderer = Renderer.get();

		const renderStack = [];

		renderStack.push(Renderer.utils.getNameTr(item, {isAddPageNum: true}));

		renderStack.push(`<tr><td class="typerarityattunement" colspan="6">${Renderer.item.getTypeRarityAndAttunementText(item)}</td>`);

		const [damage, damageType, propertiesTxt] = Renderer.item.getDamageAndPropertiesText(item);
		renderStack.push(`<tr>
			<td colspan="2">${[Parser.itemValueToFull(item), Parser.itemWeightToFull(item)].filter(Boolean).join(", ").uppercaseFirst()}</td>
			<td class="text-right" colspan="4">${damage} ${damageType} ${propertiesTxt}</td>
		</tr>`);

		if (item.entries && item.entries.length) {
			renderStack.push(Renderer.utils.getDividerTr());
			renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
			const entryList = {type: "entries", entries: item.entries};
			renderer.recursiveRender(entryList, renderStack, {depth: 1});
			if (item.additionalEntries) {
				const additionEntriesList = {type: "entries", entries: item.additionalEntries};
				renderer.recursiveRender(additionEntriesList, renderStack, {depth: 1});
			}
			renderStack.push(`</td></tr>`);
		}

		return renderStack.join("");
	},

	_hiddenRarity: new Set(["None", "Unknown", "Unknown (Magic)", "Varies"]),
	doRenderRarity (rarity) {
		return !Renderer.item._hiddenRarity.has(rarity);
	},

	_builtLists: {},
	_propertyMap: {},
	_typeMap: {},
	_additionalEntriesMap: {},
	_addProperty (p) {
		if (Renderer.item._propertyMap[p.abbreviation]) return;
		Renderer.item._propertyMap[p.abbreviation] = p.name ? MiscUtil.copy(p) : {
			"name": p.entries[0].name.toLowerCase(),
			"entries": p.entries
		};
	},
	_addType (t) {
		if (Renderer.item._typeMap[t.abbreviation]) return;
		Renderer.item._typeMap[t.abbreviation] = t.name ? MiscUtil.copy(t) : {
			"name": t.entries[0].name.toLowerCase(),
			"entries": t.entries
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
				})
				.catch(BrewUtil.pPurgeBrew);
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
	/**
	 * Runs callback with itemList as argument
	 * @param opts.fnCallback Run with args: allItems.
	 * @param opts Options object.
	 * @param opts.urls Overrides for default URLs.
	 * @param opts.isAddGroups Whether item groups should be included.
	 * @param opts.isBlacklistVariants Whether the blacklist should be respected when applying magic variants.
	 */
	async pBuildList (opts) {
		opts = opts || {};
		opts.isAddGroups = !!opts.isAddGroups;
		opts.urls = opts.urls || {};

		const kBlacklist = opts.isBlacklistVariants ? "withBlacklist" : "withoutBlacklist";
		if (Renderer.item._builtLists[kBlacklist]) {
			const cached = opts.isAddGroups ? Renderer.item._builtLists[kBlacklist] : Renderer.item._builtLists[kBlacklist].filter(it => !it._isItemGroup);

			if (opts.fnCallback) return opts.fnCallback(cached);
			return cached;
		}

		// allows URLs to be overridden (used by roll20 script)
		const itemUrl = opts.urls.items || `${Renderer.get().baseUrl}data/items.json`;
		const baseItemUrl = opts.urls.baseitems || `${Renderer.get().baseUrl}data/items-base.json`;
		const magicVariantUrl = opts.urls.magicvariants || `${Renderer.get().baseUrl}data/magicvariants.json`;

		const itemList = await pLoadItems();
		const baseItems = await Renderer.item._pGetAndProcBaseItems(await DataUtil.loadJSON(baseItemUrl));
		const [genericVariants, linkedLootTables] = await Renderer.item._pGetAndProcGenericVariants(await DataUtil.loadJSON(magicVariantUrl), true);
		const genericAndSpecificVariants = Renderer.item._createSpecificVariants(baseItems, genericVariants, linkedLootTables);
		const allItems = itemList.concat(baseItems).concat(genericAndSpecificVariants);
		Renderer.item._enhanceItems(allItems);
		Renderer.item._builtLists[kBlacklist] = allItems;
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

	async _pGetAndProcGenericVariants (variantData, isRespectBlacklist) {
		variantData.variant.forEach(Renderer.item._genericVariants_addInheritedPropertiesToSelf);
		if (isRespectBlacklist) {
			return [
				variantData.variant.filter(it => !ExcludeUtil.isExcluded(it.name, "variant", it.source)),
				variantData.linkedLootTables
			]
		}
		return [variantData.variant, variantData.linkedLootTables];
	},

	_createSpecificVariants (baseItems, genericVariants, linkedLootTables) {
		function isMissingRequiredProperty (baseItem, genericVariant) {
			return !~genericVariant.requires.findIndex(req => !~Object.keys(req).findIndex(reqK => baseItem[reqK] !== req[reqK]));
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
			if (baseItem.source !== SRC_PHB && baseItem.source !== SRC_DMG) specificVariant.entries.unshift(`{@note The base item can be found in ${Parser.sourceJsonToFull(baseItem.source)}.}`);
			delete specificVariant.value; // Magic items do not inherit the value of the non-magical item
			specificVariant.category = "Specific Variant";
			Object.keys(inherits).forEach((inheritedProperty) => {
				switch (inheritedProperty) {
					case "namePrefix": specificVariant.name = `${inherits.namePrefix}${specificVariant.name}`; break;
					case "nameSuffix": specificVariant.name = `${specificVariant.name}${inherits.nameSuffix}`; break;
					case "entries": {
						inherits.entries.forEach((ent, i) => {
							if (typeof ent === "string") {
								ent = Renderer.applyProperties(ent, Renderer.item._getInjectableProps(baseItem, inherits));
							}
							specificVariant.entries.splice(i, 0, ent);
						});
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
			curBaseItem.category = "Basic";
			if (curBaseItem.entries == null) curBaseItem.entries = [];

			if (curBaseItem.quantity) return; // e.g. "Arrows (20)"

			genericVariants.forEach((curGenericVariant) => {
				if (isMissingRequiredProperty(curBaseItem, curGenericVariant)) return;
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
			genericBonus: inherits.genericBonus
		}
	},

	_genericVariants_addInheritedPropertiesToSelf (genericVariant) {
		genericVariant.tier = genericVariant.inherits.tier;
		genericVariant.rarity = genericVariant.inherits.rarity;
		genericVariant.source = genericVariant.inherits.source;
		genericVariant.page = genericVariant.inherits.page;
		if (!genericVariant.entries && genericVariant.inherits.entries) {
			genericVariant.entries = MiscUtil.copy(genericVariant.inherits.entries.map(ent => typeof ent === "string" ? Renderer.applyProperties(ent, genericVariant.inherits) : ent));
		}
		if (genericVariant.requires.armor) genericVariant.armor = genericVariant.requires.armor;
		if (genericVariant.inherits.resist) genericVariant.resist = genericVariant.inherits.resist;
		if (genericVariant.inherits.reqAttune) genericVariant.reqAttune = genericVariant.inherits.reqAttune;
		if (genericVariant.inherits.lootTables) genericVariant.lootTables = genericVariant.inherits.lootTables;
	},

	_priceRe: /^(\d+)(\w+)$/,
	enhanceItem (item) {
		if (item._isEnhanced) return;
		item._isEnhanced = true;
		if (item.noDisplay) return;
		if (item.type === "GV") item.category = "Generic Variant";
		if (item.category == null) item.category = "Other";
		if (item.entries == null) item.entries = [];
		if (item.type && Renderer.item._typeMap[item.type]) Renderer.item._typeMap[item.type].entries.forEach(e => !(item.type === "A" && item.ammunition) && item.entries.push(e));
		if (item.property) {
			item.property.forEach(p => {
				if (!Renderer.item._propertyMap[p]) throw new Error(`Item property ${p} not found. You probably meant to load the property/type reference first; see \`Renderer.item.populatePropertyAndTypeReference()\`.`);
				if (Renderer.item._propertyMap[p].entries) {
					Renderer.item._propertyMap[p].entries.forEach(e => {
						item.entries.push(e);
					})
				}
			});
		}
		// The following could be encoded in JSON, but they depend on more than one JSON property; maybe fix if really bored later
		if (item.armor) {
			if (item.resist) item.entries.push("You have resistance to " + item.resist + " damage while you wear this armor.");
			if (item.armor && item.stealth) item.entries.push("The wearer has disadvantage on Stealth (Dexterity) checks.");
			if (item.type === "HA" && item.strength) item.entries.push("If the wearer has a Strength score lower than " + item.strength + ", their speed is reduced by 10 feet.");
		} else if (item.resist) {
			if (item.type === "P") item.entries.push("When you drink this potion, you gain resistance to " + item.resist + " damage for 1 hour.");
			if (item.type === "RG") item.entries.push("You have resistance to " + item.resist + " damage while wearing this ring.");
		}
		if (item.type === "SCF") {
			if (item.scfType === "arcane") item.entries.push("An arcane focus is a special item designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus, using it in place of any material component which does not list a cost.");
			if (item.scfType === "druid") item.entries.push("A druid can use such a druidic focus as a spellcasting focus, using it in place of any material component that does not have a cost.");
			if (item.scfType === "holy") {
				item.entries.push("A holy symbol is a representation of a god or pantheon.");
				item.entries.push("A cleric or paladin can use a holy symbol as a spellcasting focus, using it in place of any material components which do not list a cost. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.");
			}
		}
		// add additional entries based on type (e.g. XGE variants)
		if (item.type === "T" || item.type === "AT" || item.type === "INS" || item.type === "GS") { // tools, artisan tools, instruments, gaming sets
			(item.additionalEntries = item.additionalEntries || []).push({type: "hr"}, `{@note See the {@5etools Tool Proficiencies|variantrules.html|${UrlUtil.encodeForHash(["Tool Proficiencies", "XGE"])}} entry on the Variant and Optional rules page for more information.}`);
		}
		if (item.type && Renderer.item._additionalEntriesMap[item.type]) {
			const additional = Renderer.item._additionalEntriesMap[item.type];
			(item.additionalEntries = item.additionalEntries || []).push({type: "entries", entries: additional});
		}

		// bind pointer to propertyList
		if (item.property) {
			item._allPropertiesPtr = Renderer.item._propertyMap;
		}

		// bake in types
		const type = [];
		const filterType = [];
		const typeListText = [];
		let showingBase = false;
		if (item.wondrous) {
			type.push("Wondrous Item");
			filterType.push("Wondrous Item");
			typeListText.push("Wondrous Item");
		}
		if (item.staff) {
			type.push("Staff");
			filterType.push("Staff");
			typeListText.push("Staff");
		}
		if (item.firearm) {
			type.push("Firearm");
			filterType.push("Firearm");
			typeListText.push("Firearm");
		}
		if (item.age) {
			type.push(item.age);
			filterType.push(item.age);
			typeListText.push(item.age);
		}
		if (item.weaponCategory) {
			type.push(`${item.weaponCategory} Weapon${item.baseItem ? ` (${Renderer.get().render(`{@item ${item.baseItem}`)})` : ""}`);
			filterType.push(`${item.weaponCategory} Weapon`);
			typeListText.push(`${item.weaponCategory} Weapon`);
			showingBase = true;
		}
		if (item.type) {
			const abv = Parser.itemTypeToAbv(item.type);
			if (!showingBase && !!item.baseItem) {
				type.push(`${abv} (${Renderer.get().render(`{@item ${item.baseItem}`)})`);
			} else type.push(abv);
			filterType.push(abv);
			typeListText.push(abv);
		}
		if (item.poison) {
			type.push("Poison");
			filterType.push("Poison");
			typeListText.push("Poison");
		}
		item.procType = filterType;
		item.typeText = type.join(", ");
		item.typeListText = typeListText.join(", ");

		// bake in attunement
		let attunement = "No";
		if (item.reqAttune != null) {
			if (item.reqAttune === true) {
				attunement = "Yes";
				item.reqAttune = "(Requires Attunement)"
			} else if (item.reqAttune === "OPTIONAL") {
				attunement = "Optional";
				item.reqAttune = "(Attunement Optional)"
			} else if (item.reqAttune.toLowerCase().startsWith("by")) {
				attunement = "By...";
				item.reqAttune = "(Requires Attunement " + item.reqAttune + ")";
			} else {
				attunement = "Yes"; // throw any weird ones in the "Yes" category (e.g. "outdoors at night")
				item.reqAttune = "(Requires Attunement " + item.reqAttune + ")";
			}
		}
		item.attunementCategory = attunement;

		// handle item groups
		if (item._isItemGroup) {
			item.entries.push(
				"Multiple variants of this item exist, as listed below:",
				{
					type: "list",
					items: item.items.map(it => typeof it === "string" ? `{@item ${it}}` : `{@item ${it.name}|${it.source}}`)
				}
			);
		}

		// format price nicely
		// 5 characters because e.g. XXXgp is fine
		if (item.value && item.value.length > 5) {
			const m = Renderer.item._priceRe.exec(item.value);
			if (m) {
				item.value = `${Number(m[1]).toLocaleString()}${m[2]}`;
			}
		}

		(function addBaseItemList (item) {
			// item.variants was added during generic variant creation
			// TAG ITEM_VARIANTS
			const variants = item.variants;

			function createItemLink (item) {
				return `{@item ${item.name}|${item.source}}`;
			}

			if (variants && variants.length) {
				const entries = item.entries;
				entries.push({
					type: "entries",
					name: "Base items",
					entries: [
						"This item variant can be applied to the following base items:",
						{
							type: "list",
							items: variants.map(({base, specificVariant}) => {
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
		const [genericVariants, linkedLootTables] = await Renderer.item._pGetAndProcGenericVariants(rawVariants);
		const genericAndSpecificVariants = Renderer.item._createSpecificVariants(basicItems, genericVariants, linkedLootTables);

		const revNames = [];
		genericAndSpecificVariants.forEach(item => {
			if (item.variants) delete item.variants; // prevent circular references
			const revName = Renderer.item.modifierPostToPre(MiscUtil.copy(item));
			if (revName) revNames.push(revName);
		});

		genericAndSpecificVariants.push(...revNames);

		return genericAndSpecificVariants;
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
			if (bracketPart !== null) modeTitleArray.push(bracketPart);
			if (subMode) return `${modeTitleArray.join(" ")}`;
			else return `${modeTitleArray.join(" ")}</span>`;

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

	getTalentText: (psionic, renderer) => {
		const renderStack = [];
		renderer.recursiveRender(({entries: psionic.entries, type: "entries"}), renderStack);
		return renderStack.join("");
	},

	getDisciplineText: (psionic, renderer) => {
		const modeStringArray = [];
		for (let i = 0; i < psionic.modes.length; ++i) {
			modeStringArray.push(Renderer.psionic.getModeString(psionic, renderer, i));
		}

		return `${Renderer.psionic.getDescriptionString(psionic, renderer)}${Renderer.psionic.getFocusString(psionic, renderer)}${modeStringArray.join("")}`;
	},

	getDescriptionString: (psionic, renderer) => {
		return `<p>${renderer.render({type: "inline", entries: [psionic.description]})}</p>`;
	},

	getFocusString: (psionic, renderer) => {
		return `<p><span class='psi-focus-title'>Psychic Focus.</span> ${renderer.render({type: "inline", entries: [psionic.focus]})}</p>`;
	},

	getModeString: (psionic, renderer, modeIndex) => {
		const mode = psionic.modes[modeIndex];
		Renderer.psionic.enhanceMode(mode, false);

		const renderStack = [];
		renderer.recursiveRender(mode, renderStack, {depth: 2});
		const modeString = renderStack.join("");
		if (psionic.modes[modeIndex].submodes == null) return modeString;
		const subModeString = getSubModeString();
		return `${modeString}${subModeString}`;

		function getSubModeString () {
			const subModes = psionic.modes[modeIndex].submodes;

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
		}
	},

	getCompactRenderedString: (psionic) => {
		const renderer = Renderer.get();

		const typeOrderStr = psionic.type === "T" ? Parser.psiTypeToFull(psionic.type) : `${psionic.order} ${Parser.psiTypeToFull(psionic.type)}`;
		const bodyStr = psionic.type === "T" ? Renderer.psionic.getTalentText(psionic, renderer) : Renderer.psionic.getDisciplineText(psionic, renderer);

		return `
			${Renderer.utils.getNameTr(psionic, {isAddPageNum: true})}
			<tr class="text"><td colspan="6">
			<p><i>${typeOrderStr}</i></p>
			${bodyStr}
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
		return `
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(rule)}
			</td></tr>
		`;
	}
};

Renderer.table = {
	getCompactRenderedString (it) {
		it.type = it.type || "table";
		return `
			<tr class="text"><td colspan="6">
			${Renderer.get().setFirstSection(true).render(it)}
			</td></tr>
		`;
	}
};

Renderer.ship = {
	getCompactRenderedString (ship) {
		// TODO improve this if/when ships are added to a finalised product
		return Renderer.ship.getRenderedString(ship);
	},

	getRenderedString (ship) {
		const renderer = Renderer.get();

		function getSectionTitle (title) {
			return `<tr class="mon__stat-header-underline"><td colspan="6"><span>${title}</span></td></tr>`
		}

		function getActionPart () {
			return renderer.render({entries: ship.action});
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

		return `
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(ship)}
			<tr class="text"><td colspan="6"><i>${Parser.sizeAbvToFull(ship.size)} vehicle${ship.dimensions ? `, (${ship.dimensions.join(" by ")})` : ""}</i><br></td></tr>
			<tr class="text"><td colspan="6">
				<div><b>Creature Capacity</b> ${ship.capCrew} crew${ship.capPassenger ? `, ${ship.capPassenger} passengers` : ""}</div>
				${ship.capCargo ? `<div><b>Cargo Capacity</b> ${typeof ship.capCargo === "string" ? ship.capCargo : `${ship.capCargo} ton${ship.capCargo === 1 ? "" : "s"}`}</div>` : ""}
				<div><b>Travel Pace</b> ${ship.pace} miles per hour (${ship.pace * 24} miles per day)</div>
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
						<td class="text-center">${Renderer.utils.getAbilityRoller(ship, "str")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(ship, "dex")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(ship, "con")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(ship, "int")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(ship, "wis")}</td>
						<td class="text-center">${Renderer.utils.getAbilityRoller(ship, "cha")}</td>
					</tr>
				</table>
			</td></tr>
			<tr class="text"><td colspan="6">
				${ship.immune ? `<div><b>Damage Immunities</b> ${Parser.monImmResToFull(ship.immune)}</div>` : ""}
				${ship.conditionImmune ? `<div><b>Condition Immunities</b> ${Parser.monCondImmToFull(ship.conditionImmune)}</div>` : ""}
			</td></tr>
			${ship.action ? getSectionTitle("Actions") : ""}
			${ship.action ? `<tr><td colspan="6">${getActionPart()}</td></tr>` : ""}
			${getSectionTitle("Hull")}
			<tr><td colspan="6">
			${getSectionHpPart(ship.hull)}
			</td></tr>
			${(ship.control || []).map(getControlSection).join("")}
			${(ship.movement || []).map(getMovementSection).join("")}
			${(ship.weapon || []).map(getWeaponSection).join("")}
			${(ship.other || []).map(getOtherSection).join("")}
			${Renderer.utils.getPageTr(ship)}
			${Renderer.utils.getBorderTr()}
		`;
	}
};

Renderer.hover = {
	linkCache: {},
	_isInit: false,
	_active: {},

	_dmScreen: null,
	bindDmScreen (screen) {
		this._dmScreen = screen;
	},

	_lastMouseHoverId: -1,
	_mouseHovers: {},
	createOnMouseHover (entries, title = "Homebrew") {
		const id = Renderer.hover._lastMouseHoverId++;
		Renderer.hover._mouseHovers[id] = {data: {hoverTitle: title}, entries: MiscUtil.copy(entries)};
		return `onmouseover="Renderer.hover.mouseOverHoverTooltip(event, this, ${id})" ${Renderer.hover._getPreventTouchString()}`;
	},

	createOnMouseHoverEntry (entry, isBookContent) {
		const id = Renderer.hover.__initOnMouseHoverEntry(entry);
		return `onmouseover="Renderer.hover.mouseOverHoverTooltip(event, this, ${id}, ${!!isBookContent})" ${Renderer.hover._getPreventTouchString()}`;
	},

	_getPreventTouchString () {
		return `ontouchstart="Renderer.hover.handleTouchStart(event, this)"`
	},

	handleTouchStart (evt, ele) {
		// on large touchscreen devices only (e.g. iPads)
		if (!Renderer.hover._isSmallScreen()) {
			// cache the link location and redirect it to void
			$(ele).data("href", $(ele).data("href") || $(ele).attr("href"));
			$(ele).attr("href", STR_VOID_LINK);
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

	__initOnMouseHoverEntry (entry) {
		const id = Renderer.hover._lastMouseHoverId++;
		Renderer.hover._mouseHovers[id] = {
			...entry,
			data: {hoverTitle: entry.name}
		};
		return id;
	},

	__updateOnMouseHoverEntry (id, entry) {
		Renderer.hover._mouseHovers[id] = {
			...entry,
			data: {hoverTitle: entry.name}
		};
	},

	bindOnMouseHoverEntry (entry, isBookContent) {
		const id = Renderer.hover.__initOnMouseHoverEntry(entry);
		return (event, ele) => Renderer.hover.mouseOverHoverTooltip(event, ele, id, !!isBookContent);
	},

	_addToCache: (page, source, hash, item) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		((Renderer.hover.linkCache[page] =
			Renderer.hover.linkCache[page] || [])[source] =
			Renderer.hover.linkCache[page][source] || [])[hash] = item;
	},

	_getFromCache: (page, source, hash) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		return Renderer.hover.linkCache[page][source][hash];
	},

	_isCached: (page, source, hash) => {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		return Renderer.hover.linkCache[page] && Renderer.hover.linkCache[page][source] && Renderer.hover.linkCache[page][source][hash];
	},

	pCacheAndGet (page, source, hash) {
		return new Promise(resolve => {
			Renderer.hover._doFillThenCall(page, source, hash, () => {
				const it = Renderer.hover._getFromCache(page, source, hash);
				resolve(it);
			});
		})
	},

	_doFillThenCall: (page, source, hash, callbackFn) => {
		/**
		 * @param data the data
		 * @param listProp list property in the data
		 * @param itemModifier optional function to run per item; takes listProp and an item as parameters
		 */
		function populate (data, listProp, itemModifier) {
			data[listProp].forEach(it => {
				const itHash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
				if (itemModifier) itemModifier(listProp, it);
				Renderer.hover._addToCache(page, it.source, itHash, it);
			});
		}

		function loadMultiSource (page, baseUrl, listProp) {
			if (!Renderer.hover._isCached(page, source, hash)) {
				BrewUtil.pAddBrewData()
					.then((data) => {
						if (!data[listProp]) return;
						populate(data, listProp);
					})
					.catch(BrewUtil.pPurgeBrew)
					.then(() => DataUtil.loadJSON(`${Renderer.get().baseUrl}${baseUrl}index.json`))
					.then((data) => {
						const officialSources = {};
						Object.entries(data).forEach(([k, v]) => officialSources[k.toLowerCase()] = v);
						const officialSource = officialSources[source.toLowerCase()];
						if (officialSource) {
							DataUtil.loadJSON(`${Renderer.get().baseUrl}${baseUrl}${officialSource}`)
								.then((data) => {
									populate(data, listProp);
									callbackFn();
								});
						} else callbackFn(); // source to load is 3rd party, which was already handled
					});
			} else callbackFn();
		}

		function _pLoadSingleBrew (listProps, itemModifier) {
			return new Promise(resolve => {
				BrewUtil.pAddBrewData()
					.then((data) => {
						listProps = listProps instanceof Array ? listProps : [listProps];
						listProps.forEach(lp => {
							if (data[lp]) populate(data, lp, itemModifier);
						});
						resolve();
					})
					.catch(BrewUtil.pPurgeBrew);
			});
		}

		function _handleSingleData (data, listProps, itemModifier) {
			if (listProps instanceof Array) listProps.forEach(p => populate(data, p, itemModifier));
			else populate(data, listProps, itemModifier);
			callbackFn();
		}

		function loadSimple (page, jsonFile, listProps, itemModifier) {
			if (!Renderer.hover._isCached(page, source, hash)) {
				_pLoadSingleBrew(listProps, itemModifier)
					.then(() => DataUtil.loadJSON(`${Renderer.get().baseUrl}data/${jsonFile}`))
					.then((data) => _handleSingleData(data, listProps, itemModifier));
			} else callbackFn();
		}

		function loadCustom (page, jsonFile, listProps, itemModifier, loader) {
			if (!Renderer.hover._isCached(page, source, hash)) {
				_pLoadSingleBrew(listProps, itemModifier)
					.then(() => DataUtil[loader].loadJSON(Renderer.get().baseUrl))
					.then((data) => _handleSingleData(data, listProps, itemModifier));
			} else callbackFn();
		}

		function _classes_indexFeatures (cls) {
			// de-nest sources in case modified by classes page
			UrlUtil.class.getIndexedEntries(cls).forEach(it => Renderer.hover._addToCache(UrlUtil.PG_CLASSES, it.source.source || it.source, it.hash, it.entry));
		}

		switch (page) {
			case "generic":
			case "hover": callbackFn(); break;
			case UrlUtil.PG_CLASSES: {
				if (!Renderer.hover._isCached(page, source, hash)) {
					(async () => {
						try {
							const brewData = await BrewUtil.pAddBrewData();
							(brewData.class || []).forEach(cc => _classes_indexFeatures(cc));
						} catch (e) { BrewUtil.pPurgeBrew(e); }
						const data = await DataUtil.class.loadJSON();
						data.class.forEach(cc => _classes_indexFeatures(cc));
						callbackFn();
					})();
				} else callbackFn();
				break;
			}
			case UrlUtil.PG_SPELLS: loadMultiSource(page, `data/spells/`, "spell"); break;
			case UrlUtil.PG_BESTIARY: loadMultiSource(page, `data/bestiary/`, "monster"); break;
			case UrlUtil.PG_ITEMS: {
				if (!Renderer.hover._isCached(page, source, hash)) {
					Renderer.item.pBuildList({
						fnCallback: (allItems) => {
							// populate brew once the main item properties have been loaded
							BrewUtil.pAddBrewData()
								.then(async (data) => {
									const itemList = await Renderer.item.getItemsFromHomebrew(data);
									if (!itemList.length) return;
									itemList.forEach(it => {
										const itHash = UrlUtil.URL_TO_HASH_BUILDER[page](it);
										Renderer.hover._addToCache(page, it.source, itHash, it);
										const revName = Renderer.item.modifierPostToPre(it);
										if (revName) Renderer.hover._addToCache(page, it.source, UrlUtil.URL_TO_HASH_BUILDER[page](revName), it);
									});
								})
								.catch(BrewUtil.pPurgeBrew)
								.then(() => {
									allItems.forEach(item => {
										const itemHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
										Renderer.hover._addToCache(page, item.source, itemHash, item);
										const revName = Renderer.item.modifierPostToPre(item);
										if (revName) Renderer.hover._addToCache(page, item.source, UrlUtil.URL_TO_HASH_BUILDER[page](revName), item);
									});
									callbackFn();
								});
						},
						isAddGroups: true,
						isBlacklistVariants: true
					});
				} else callbackFn();
				break;
			}
			case UrlUtil.PG_BACKGROUNDS: loadSimple(page, "backgrounds.json", "background"); break;
			case UrlUtil.PG_FEATS: loadSimple(page, "feats.json", "feat"); break;
			case UrlUtil.PG_OPT_FEATURES: loadSimple(page, "optionalfeatures.json", "optionalfeature"); break;
			case UrlUtil.PG_PSIONICS: loadSimple(page, "psionics.json", "psionic"); break;
			case UrlUtil.PG_REWARDS: loadSimple(page, "rewards.json", "reward"); break;
			case UrlUtil.PG_RACES: {
				if (!Renderer.hover._isCached(page, source, hash)) {
					BrewUtil.pAddBrewData()
						.then((data) => {
							if (!data.race) return;
							populate(data, "race");
						})
						.catch(BrewUtil.pPurgeBrew)
						.then(() => {
							DataUtil.loadJSON(`${Renderer.get().baseUrl}data/races.json`).then((data) => {
								const merged = Renderer.race.mergeSubraces(data.race);
								merged.forEach(race => {
									const raceHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](race);
									Renderer.hover._addToCache(page, race.source, raceHash, race)
								});
								callbackFn();
							});
						});
				} else {
					callbackFn();
				}
				break;
			}
			case UrlUtil.PG_DEITIES: loadCustom(page, "deities.json", "deity", null, "deity"); break;
			case UrlUtil.PG_OBJECTS: loadSimple(page, "objects.json", "object"); break;
			case UrlUtil.PG_TRAPS_HAZARDS: loadSimple(page, "trapshazards.json", ["trap", "hazard"]); break;
			case UrlUtil.PG_VARIATNRULES: loadSimple(page, "variantrules.json", "variantrule"); break;
			case UrlUtil.PG_CULTS_BOONS: {
				loadSimple(page, "cultsboons.json", ["cult", "boon"], (listProp, item) => item._type = listProp === "cult" ? "c" : "b");
				break;
			}
			case UrlUtil.PG_CONDITIONS_DISEASES: {
				loadSimple(page, "conditionsdiseases.json", ["condition", "disease"], (listProp, item) => item._type = listProp === "condition" ? "c" : "d");
				break;
			}
			case UrlUtil.PG_TABLES: {
				loadSimple(page, "generated/gendata-tables.json", ["table", "tableGroup"], (listProp, item) => item._type = listProp === "table" ? "t" : "g");
				break;
			}
			case UrlUtil.PG_SHIPS: loadSimple(page, "ships.json", "ship"); break;
			default: throw new Error(`No load function defined for page ${page}`);
		}
	},

	_teardownWindow: (hoverId) => {
		const obj = Renderer.hover._active[hoverId];
		if (obj) {
			obj.$ele.attr("data-hover-active", false);
			obj.$hov.remove();
			$(document).off(obj.mouseUpId);
			$(document).off(obj.mouseMoveId);
			$(window).off(obj.resizeId);
		}
		delete Renderer.hover._active[hoverId];
	},

	_makeWindow () {
		if (!Renderer.hover._curHovering) {
			reset();
			return;
		}

		const hoverId = Renderer.hover._curHovering.hoverId;
		const ele = Renderer.hover._curHovering.ele;
		let preLoaded = Renderer.hover._curHovering.preLoaded;
		const page = Renderer.hover._curHovering.cPage;
		const source = Renderer.hover._curHovering.cSource;
		const hash = Renderer.hover._curHovering.cHash;
		const permanent = Renderer.hover._curHovering.permanent;
		const clientX = Renderer.hover._curHovering.clientX;
		const renderFn = Renderer.hover._curHovering.renderFunction;
		const isBookContent = Renderer.hover._curHovering.isBookContent;

		// if it doesn't seem to exist, return
		if (!preLoaded && page !== "hover" && !Renderer.hover._isCached(page, source, hash)) {
			Renderer.hover._showInProgress = false;
			setTimeout(() => {
				throw new Error(`Could not load hash ${hash} with source ${source} from page ${page}`);
			}, 1);
			return;
		}

		const toRender = page === "hover" ? {name: source.data.hoverTitle || ""} : preLoaded || Renderer.hover._getFromCache(page, source, hash);
		const content = page === "hover" ? renderFn(source) : renderFn(toRender);

		$(ele).attr("data-hover-active", true);

		const offset = $(ele).offset();
		const vpOffsetT = offset.top - $(document).scrollTop();
		const vpOffsetL = offset.left - $(document).scrollLeft();

		const fromBottom = vpOffsetT > $(window).height() / 2;
		const fromRight = vpOffsetL > $(window).width() / 2;

		const $hov = $(`<div class="hwin" style="right: -600px"/>`);
		const $wrpStats = $(`<div class="hwin__wrp-table"/>`);

		const $body = $(`body`);
		const $ele = $(ele);

		$ele.on("mouseleave.hoverwindow", (evt) => {
			Renderer.hover._cleanWindows();
			if (!($brdrTop.attr("data-perm") === "true") && !evt.shiftKey) {
				teardown();
			} else {
				$(ele).attr("data-hover-active", true);
				// use attr to let the CSS see it
				$brdrTop.attr("data-perm", true);
				delete Renderer.hover._active[hoverId];
			}
		});

		const windowTitle = page === "generic" ? (preLoaded.data || {}).hoverTitle || "" : toRender._displayName || toRender.name;

		const $hovTitle = $(`<span class="window-title">${windowTitle}</span>`);
		const $stats = $(`<table class="stats ${isBookContent ? "stats-book stats-book--hover" : ""}"/>`);
		$stats.append(content);

		$stats.off("click", ".mon__btn-scale-cr").on("click", ".mon__btn-scale-cr", function (evt) {
			evt.stopPropagation();
			const $this = $(this);
			const initialCr = preLoaded && preLoaded._originalCr != null ? preLoaded._originalCr : toRender.cr.cr || toRender.cr;
			const lastCr = preLoaded ? preLoaded.cr.cr || preLoaded.cr : toRender.cr.cr || toRender.cr;
			Renderer.monster.getCrScaleTarget($this, lastCr, (targetCr) => {
				if (Parser.numberToCr(targetCr) === initialCr) {
					const original = Renderer.hover._getFromCache(page, source, hash);
					preLoaded = original;
					$stats.empty().append(renderFn(original));
					$hovTitle.text(original._displayName || original.name);
				} else {
					ScaleCreature.scale(toRender, targetCr).then(scaledContent => {
						preLoaded = scaledContent;
						$stats.empty().append(renderFn(scaledContent));
						$hovTitle.text(scaledContent._displayName || scaledContent.name);
					});
				}
			}, true);
		});
		$stats.off("click", ".mon__btn-reset-cr").on("click", ".mon__btn-reset-cr", function () {
			const original = Renderer.hover._getFromCache(page, source, hash);
			preLoaded = original;
			$stats.empty().append(renderFn(original));
			$hovTitle.text(original._displayName || original.name);
		});

		let drag = {};
		function handleDragMousedown (evt, type) {
			if (evt.which === 0 || evt.which === 1) evt.preventDefault();
			$hov.css({
				"z-index": 201, // temporarily display it on top
				"animation": "initial"
			});
			drag.type = type;
			drag.startX = EventUtil.getClientX(evt);
			drag.startY = EventUtil.getClientY(evt);
			drag.baseTop = parseFloat($hov.css("top"));
			drag.baseLeft = parseFloat($hov.css("left"));
			drag.baseHeight = $wrpStats.height();
			drag.baseWidth = $hov.width();
			if (type < 9) {
				$wrpStats.css("max-height", "initial");
				$hov.css("max-width", "initial");
			}
		}
		function handleDragClick () {
			$hov.css("z-index", ""); // remove the temporary z-boost...
			$hov.parent().append($hov); // ...and properly bring it to the front
		}

		const $brdrTopRightResize = $(`<div class="hoverborder__resize-ne"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 1))
			.on("click", handleDragClick);

		const $brdrRightResize = $(`<div class="hoverborder__resize-e"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 2))
			.on("click", handleDragClick);

		const $brdrBottomRightResize = $(`<div class="hoverborder__resize-se"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 3))
			.on("click", handleDragClick);

		const $brdrBtm = $(`<div class="hoverborder hoverborder--btm ${isBookContent ? "hoverborder-book" : ""}"><div class="hoverborder__resize-s"/></div>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 4))
			.on("click", handleDragClick);

		const $brdrBtmLeftResize = $(`<div class="hoverborder__resize-sw"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 5))
			.on("click", handleDragClick);

		const $brdrLeftResize = $(`<div class="hoverborder__resize-w"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 6))
			.on("click", handleDragClick);

		const $brdrTopLeftResize = $(`<div class="hoverborder__resize-nw"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 7))
			.on("click", handleDragClick);

		const $brdrTopResize = $(`<div class="hoverborder__resize-n"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 8))
			.on("click", handleDragClick);

		const $brdrTop = $(`<div class="hoverborder hoverborder--top ${isBookContent ? "hoverborder-book" : ""}" ${permanent ? `data-perm="true"` : ""} data-hover-id="${hoverId}"/>`)
			.on("mousedown touchstart", (evt) => handleDragMousedown(evt, 9))
			.on("click", handleDragClick)
			.on("contextmenu", (evt) => {
				if (!evt.ctrlKey) ContextUtil.handleOpenContextMenu(evt, ele, "hoverBorder");
			});

		const mouseUpId = `mouseup.${hoverId} touchend.${hoverId}`;
		const mouseMoveId = `mousemove.${hoverId} touchmove.${hoverId}`;
		const resizeId = `resize.${hoverId}`;

		function isOverHoverTarget (evt, target) {
			return EventUtil.getClientX(evt) >= target.left &&
				EventUtil.getClientX(evt) <= target.left + target.width &&
				EventUtil.getClientY(evt) >= target.top &&
				EventUtil.getClientY(evt) <= target.top + target.height;
		}

		function handleNorthDrag (evt) {
			const diffY = Math.max(drag.startY - EventUtil.getClientY(evt), 80 - drag.baseHeight); // prevent <80 height, as this will cause the box to move downwards
			$wrpStats.css("height", drag.baseHeight + diffY);
			$hov.css("top", drag.baseTop - diffY);
			drag.startY = EventUtil.getClientY(evt);
			drag.baseHeight = $wrpStats.height();
			drag.baseTop = parseFloat($hov.css("top"));
		}

		function handleEastDrag (evt) {
			const diffX = drag.startX - EventUtil.getClientX(evt);
			$hov.css("width", drag.baseWidth - diffX);
			drag.startX = EventUtil.getClientX(evt);
			drag.baseWidth = $hov.width();
		}

		function handleSouthDrag (evt) {
			const diffY = drag.startY - EventUtil.getClientY(evt);
			$wrpStats.css("height", drag.baseHeight - diffY);
			drag.startY = EventUtil.getClientY(evt);
			drag.baseHeight = $wrpStats.height();
		}

		function handleWestDrag (evt) {
			const diffX = Math.max(drag.startX - EventUtil.getClientX(evt), 150 - drag.baseWidth);
			$hov.css("width", drag.baseWidth + diffX)
				.css("left", drag.baseLeft - diffX);
			drag.startX = EventUtil.getClientX(evt);
			drag.baseWidth = $hov.width();
			drag.baseLeft = parseFloat($hov.css("left"));
		}

		$(document)
			.on(mouseUpId, (evt) => {
				if (drag.type) {
					if (drag.type < 9) {
						$wrpStats.css("max-height", "");
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
						if (this._dmScreen) {
							const panel = this._dmScreen.getPanelPx(EventUtil.getClientX(evt), EventUtil.getClientY(evt));
							if (!panel) return;
							this._dmScreen.setHoveringPanel(panel);
							const target = panel.getAddButtonPos();

							if (isOverHoverTarget(evt, target)) {
								if (preLoaded && preLoaded._isScaledCr != null) panel.doPopulate_StatsScaledCr(page, source, hash, preLoaded.cr.cr || preLoaded.cr);
								else panel.doPopulate_Stats(page, source, hash);
								altTeardown();
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
		$(window).on(resizeId, () => adjustPosition(true));

		$brdrTop.attr("data-display-title", false);
		$brdrTop.on("dblclick", () => {
			const curState = $brdrTop.attr("data-display-title");
			$brdrTop.attr("data-display-title", curState === "false");
			$brdrTop.attr("data-perm", true);
			$hov.toggleClass("hwin--minified", curState === "false");
			delete Renderer.hover._active[hoverId];
		});
		$brdrTop.append($hovTitle);
		const $brdTopRhs = $(`<div class="flex" style="margin-left: auto;"/>`).appendTo($brdrTop);

		if (page && source && hash) {
			const $btnGotoPage = $(`<span class="top-border-icon glyphicon glyphicon-new-window" style="margin-right: 2px;" title="Go to Page"></span>`)
				.click(() => window.location = `${page}#${hash}`)
				.appendTo($brdTopRhs);
		}

		// TODO fix dice rollers?
		// TODO fix hover links?
		const $btnPopout = $(`<span class="top-border-icon glyphicon glyphicon-modal-window hvr__popout" style="margin-right: 2px;" title="Open as Popup Window"></span>`)
			.on("click", (evt) => {
				evt.stopPropagation();
				const h = $stats.height();
				const win = open(
					"",
					toRender._displayName || toRender.name,
					`width=600,height=${h}location=0,menubar=0,status=0,titlebar=0,toolbar=0`
				);
				win.document.write(`
					<!DOCTYPE html>
					<html lang="en" class="${styleSwitcher.getActiveStyleSheet() === StyleSwitcher.STYLE_NIGHT ? StyleSwitcher.NIGHT_CLASS : ""}"><head>
						<meta name="viewport" content="width=device-width, initial-scale=1">
						<title>${toRender._displayName || toRender.name}</title>
						<link rel="stylesheet" href="css/bootstrap.css">
						<link rel="stylesheet" href="css/jquery-ui.css">
						<link rel="stylesheet" href="css/jquery-ui-slider-pips.css">
						<link rel="stylesheet" href="css/style.css">
						<link rel="icon" href="favicon.png">
						<style>
							html, body { width: 100%; height: 100%; }
							body { overflow-y: scroll; }
						</style>
					</head><body>
					<div class="hwin hoverbox--popout" style="max-width: initial; max-height: initial; box-shadow: initial;">
					${$stats[0].outerHTML}
					</div>
					</body></html>
				`);
				altTeardown();
			}).appendTo($brdTopRhs);

		const $btnClose = $(`<span class="delete-icon glyphicon glyphicon-remove hvr__close" title="Close"></span>`)
			.on("click", (evt) => {
				evt.stopPropagation();
				altTeardown();
			}).appendTo($brdTopRhs);

		$wrpStats.append($stats);

		$hov.append($brdrTopResize).append($brdrTopRightResize).append($brdrRightResize).append($brdrBottomRightResize)
			.append($brdrBtmLeftResize).append($brdrLeftResize).append($brdrTopLeftResize)

			.append($brdrTop)
			.append($wrpStats)
			.append($brdrBtm);

		$body.append($hov);
		if (!permanent) {
			Renderer.hover._active[hoverId] = {
				$hov: $hov,
				$ele: $ele,
				resizeId: resizeId,
				mouseUpId: mouseUpId,
				mouseMoveId: mouseMoveId
			};
		}

		if (fromBottom) $hov.css("top", vpOffsetT - ($hov.height() + 10));
		else $hov.css("top", vpOffsetT + $(ele).height() + 10);

		if (fromRight) $hov.css("left", (clientX || vpOffsetL) - ($hov.width() + 10));
		else $hov.css("left", (clientX || (vpOffsetL + $(ele).width())) + 10);

		adjustPosition(true);

		$(ele).css("cursor", "");
		reset();

		function adjustPosition () {
			// readjust position...
			// ...if vertically clipping off screen
			const hvTop = parseFloat($hov.css("top"));
			if (hvTop < 0) {
				$hov.css("top", 0);
			} else if (hvTop >= $(window).height() - Renderer.hover._BAR_HEIGHT) {
				$hov.css("top", $(window).height() - Renderer.hover._BAR_HEIGHT);
			}
			// ...if horizontally clipping off screen
			const hvLeft = parseFloat($hov.css("left"));
			if (hvLeft < 0) $hov.css("left", 0);
			else if (hvLeft + $hov.width() > $(window).width()) {
				$hov.css("left", Math.max($(window).width() - $hov.width(), 0));
			}
		}

		function teardown () {
			Renderer.hover._teardownWindow(hoverId);
		}

		// alternate teardown for 'x' button
		function altTeardown () {
			$ele.attr("data-hover-active", false);
			$hov.remove();
			$(document).off(mouseUpId);
			$(document).off(mouseMoveId);
			$(window).off(resizeId);
			delete Renderer.hover._active[hoverId];
		}

		function reset () {
			Renderer.hover._showInProgress = false;
			Renderer.hover._curHovering = null;
		}
	},

	getGenericCompactRenderedString (entry) {
		return `
			<tr class="text homebrew-hover"><td colspan="6">
			${Renderer.get().setFirstSection(true).render(entry)}
			</td></tr>
		`;
	},

	_pageToRenderFn (page) {
		switch (page) {
			case "generic":
			case "hover": return Renderer.hover.getGenericCompactRenderedString;
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
			case UrlUtil.PG_SHIPS: return Renderer.ship.getCompactRenderedString;
			default: return null;
		}
	},

	// used in hover strings
	mouseOverHoverTooltip (evt, ele, id, isBookContent) {
		const data = Renderer.hover._mouseHovers[id];
		if (data == null) return setTimeout(() => { throw new Error(`No "data" found for hover ID ${id}`) }); // this should never occur, but does on other platforms
		Renderer.hover.show({evt, ele, page: "hover", source: data, hash: "", isBookContent});
	},

	mouseOver (evt, ele, page, source, hash, isPopout, preloadId) {
		if (preloadId != null) {
			const [type, data] = preloadId.split(":");
			switch (type) {
				case MON_HASH_SCALED: {
					Renderer.hover.pCacheAndGet(page, source, hash).then(mon => {
						ScaleCreature.scale(mon, Number(data)).then(scaled => {
							Renderer.hover.mouseOverPreloaded(evt, ele, scaled, page, source, hash, isPopout);
						});
					});
					break;
				}
			}
		} else Renderer.hover.show({evt, ele, page, source, hash, isPopout});
	},

	mouseOverPreloaded (evt, ele, preLoaded, page, source, hash, isPopout) {
		Renderer.hover.show({evt, ele, preLoaded, page, source, hash, isPopout});
	},

	/**
	 * The most basic hover display possible. Creates a new window which displays the thing.
	 */
	doHover (evt, ele, entries) {
		Renderer.hover.show({evt, ele, preLoaded: entries, page: "generic"});
	},

	/**
	 * As above, but designed to be used with e.g. button clicks, as opposed to hover.
	 */
	doOpenWindow (evt, ele, entries) {
		const fauxEvent = {shiftKey: true, clientX: evt.clientX, clientY: evt.clientY};
		Renderer.hover.show({evt: fauxEvent, ele, preLoaded: entries, page: "generic"});
	},

	_doInit () {
		if (!Renderer.hover._isInit) {
			Renderer.hover._isInit = true;
			$(`body`).on("click", () => Renderer.hover._cleanWindows());
			ContextUtil.doInitContextMenu("hoverBorder", (evt, ele, $invokedOn, $selectedMenu) => {
				const $perms = $(`.hoverborder[data-perm="true"]`);
				switch (Number($selectedMenu.data("ctx-id"))) {
					case 0: $perms.attr("data-display-title", "false"); break;
					case 1: $perms.attr("data-display-title", "true"); break;
					case 2: $(`.hvr__close`).click(); break;
				}
			}, ["Maximize All", "Minimize All", null, "Close All"]);
		}
	},

	_isSmallScreen () {
		const outerWindow = (() => {
			let loops = 100;
			let curr = window.top;
			while (window.parent !== curr) {
				curr = window.parent;
				if (loops-- < 0) return window; // safety precaution
			}
			return curr;
		})();

		return $(outerWindow).width() <= 768;
	},

	_BAR_HEIGHT: 16,
	_showInProgress: false,
	_hoverId: 1,
	_popoutId: -1,
	_curHovering: null,
	show: (options) => {
		const evt = options.evt;
		const ele = options.ele;
		const preLoaded = options.preLoaded;
		const page = options.page;
		const source = options.source;
		const hash = options.hash;
		const isPopout = options.isPopout;
		const isBookContent = options.isBookContent;

		const $ele = $(ele);
		Renderer.hover._doInit();

		// don't show on narrow screens
		if (Renderer.hover._isSmallScreen() && !evt.shiftKey) return;

		let hoverId;
		if (isPopout) {
			// always use a new hover ID if popout
			hoverId = Renderer.hover._popoutId--;
			$ele.attr("data-hover-id", hoverId);
		} else {
			const curHoverId = $ele.attr("data-hover-id");
			if (curHoverId) hoverId = Number(curHoverId);
			else {
				hoverId = Renderer.hover._hoverId++;
				$ele.attr("data-hover-id", hoverId);
			}
		}

		const alreadyHovering = $ele.attr("data-hover-active");
		const $curWin = $(`.hoverborder[data-hover-id="${hoverId}"]`);
		if (alreadyHovering === "true" && $curWin.length) return;

		const renderFunction = Renderer.hover._pageToRenderFn(page);
		if (!renderFunction) throw new Error(`No hover render function specified for page ${page}`);
		Renderer.hover._curHovering = {
			hoverId: hoverId,
			ele: ele,
			renderFunction: renderFunction,
			preLoaded: preLoaded,
			cPage: page,
			cSource: source,
			cHash: hash,
			permanent: evt.shiftKey,
			clientX: EventUtil.getClientX(evt),
			isBookContent
		};

		// return if another event chain is handling the event
		if (Renderer.hover._showInProgress) return;

		Renderer.hover._showInProgress = true;
		$ele.css("cursor", "wait")
			.off("mouseleave.hoverwindow"); // clean up any old event listeners

		// clean up any abandoned windows
		Renderer.hover._cleanWindows();

		// cancel hover if the mouse leaves
		$ele.on("mouseleave.hoverwindow", () => {
			if (!Renderer.hover._curHovering || !Renderer.hover._curHovering.permanent) {
				Renderer.hover._curHovering = null;
			}
		});

		Renderer.hover._doFillThenCall(page, source, hash, Renderer.hover._makeWindow.bind(Renderer.hover));
	},

	_cleanWindows: () => {
		const ks = Object.keys(Renderer.hover._active);
		ks.forEach(hovId => Renderer.hover._teardownWindow(hovId));
	},

	bindPopoutButton (toList, handlerGenerator) {
		const $btnPop = ListUtil.getOrTabRightButton(`btn-popout`, `new-window`)
			.off("click")
			.attr("title", "Popout Window (SHIFT for Source Data)");

		const popoutCodeId = Renderer.hover.__initOnMouseHoverEntry({});

		$btnPop.on("click", handlerGenerator ? handlerGenerator(toList, $btnPop, popoutCodeId) : (evt) => {
			if (History.lastLoadedId !== null) {
				if (evt.shiftKey) {
					Renderer.hover.handlePopoutCode(evt, toList, $btnPop, popoutCodeId);
				} else Renderer.hover.doPopout($btnPop, toList, History.lastLoadedId, evt.clientX);
			}
		});
	},

	handlePopoutCode (evt, toList, $btnPop, popoutCodeId) {
		const data = toList[History.lastLoadedId];
		const cleanCopy = DataUtil.cleanJson(MiscUtil.copy(data));
		Renderer.hover.__updateOnMouseHoverEntry(popoutCodeId, {
			type: "code",
			name: `${data.name} \u2014 Source Data`,
			preformatted: JSON.stringify(cleanCopy, null, "\t")
		});
		$btnPop.attr("data-hover-active", false);
		Renderer.hover.mouseOverHoverTooltip({shiftKey: true, clientX: evt.clientX}, $btnPop.get(0), popoutCodeId, true);
	},

	doPopout: ($btnPop, list, index, clientX) => {
		$btnPop.attr("data-hover-active", false);
		const it = list[index];
		Renderer.hover.mouseOver({shiftKey: true, clientX: clientX}, $btnPop.get(0), UrlUtil.getCurrentPage(), it.source, UrlUtil.autoEncodeHash(it), true);
	},

	doPopoutPreloaded ($btnPop, it, clientX) {
		$btnPop.attr("data-hover-active", false);
		Renderer.hover.mouseOverPreloaded({shiftKey: true, clientX: clientX}, $btnPop.get(0), it, UrlUtil.getCurrentPage(), it.source, UrlUtil.autoEncodeHash(it), true);
	},

	// helpers to get clientX/Y on mobile
	_getClientX (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientX : evt.clientX; },
	_getClientY (evt) { return evt.touches && evt.touches.length ? evt.touches[0].clientY : evt.clientY; }
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

	parseRandomise2 (str) {
		if (!str || !str.trim()) return null;
		const tree = Renderer.dice._parse2(str);
		if (tree) return tree.evl({});
		else return null;
	},

	parseAverage (str) {
		if (!str || !str.trim()) return null;
		const tree = Renderer.dice._parse2(str);
		if (tree) return tree.avg({});
		else return null;
	},

	parseToTree (str) {
		if (!str || !str.trim()) return null;
		return Renderer.dice._parse2(str);
	},

	_showBox: () => {
		if (Renderer.dice._$wrpRoll.css("display") !== "flex") {
			Renderer.dice._$minRoll.hide();
			Renderer.dice._$wrpRoll.css("display", "flex");
			Renderer.dice._$iptRoll.prop("placeholder", `${Renderer.dice._randomPlaceholder()} or "/help"`);
		}
	},

	_hideBox: () => {
		Renderer.dice._$minRoll.show();
		Renderer.dice._$wrpRoll.css("display", "");
	},

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

	DICE: [4, 6, 8, 10, 12, 20, 100],
	_randomPlaceholder: () => {
		const count = RollerUtil.randomise(10);
		const faces = Renderer.dice.DICE[RollerUtil.randomise(Renderer.dice.DICE.length - 1)];
		const mod = (RollerUtil.randomise(3) - 2) * RollerUtil.randomise(10);
		const drop = (count > 1) && RollerUtil.randomise(5) === 5;
		const dropDir = drop ? RollerUtil.randomise(2) === 2 ? "h" : "l" : "";
		const dropAmount = drop ? RollerUtil.randomise(count - 1) : null;
		return `${count}d${faces}${drop ? `d${dropDir}${dropAmount}` : ""}${mod < 0 ? mod : mod > 0 ? `+${mod}` : ""}`;
	},

	async init () {
		const $wrpRoll = $(`<div class="rollbox"/>`);
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
			.on("keypress", (e) => {
				if (e.which === 13) { // return
					Renderer.dice.roll2($iptRoll.val(), {
						user: true,
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

		$wrpRoll.on("click", ".out-roll-item-code", (evt) => Renderer.dice._$iptRoll.val(evt.target.innerHTML).focus());

		Renderer.dice.storage = await StorageUtil.pGet(ROLLER_MACRO_STORAGE) || {};
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

	_contextRollLabel: "rollChooser",
	_contextPromptLabel: "rollPrompt",
	rollerClickUseData (evt, ele) {
		const $ele = $(ele);
		const rollData = $ele.data("packed-dice");
		let name = $ele.attr("title") || null;
		let shiftKey = evt.shiftKey;

		const options = rollData.toRoll.split(";").map(it => it.trim()).filter(it => it);
		(options.length > 1 ? new Promise(resolve => {
			const cpy = MiscUtil.copy(rollData);

			ContextUtil.doInitContextMenu(Renderer.dice._contextRollLabel, (mostRecentEvt, _1, _2, _3, invokedOnId) => {
				shiftKey = mostRecentEvt.shiftKey;
				cpy.toRoll = options[invokedOnId];
				resolve(cpy);
			}, [{text: "Choose Roll", disabled: true}, null, ...options.map(it => `Roll ${it}`)]);

			ContextUtil.handleOpenContextMenu(evt, ele, Renderer.dice._contextRollLabel, (choseOption) => {
				if (!choseOption) resolve();
			});
		}) : Promise.resolve(rollData)).then(async chosenRollData => {
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

			(rollData.prompt ? new Promise(resolve => {
				const sortedKeys = Object.keys(rollDataCpy.prompt.options).sort(SortUtil.ascSortLower);

				ContextUtil.doInitContextMenu(Renderer.dice._contextPromptLabel, (mostRecentEvt, _1, _2, _3, invokedOnId) => {
					if (invokedOnId == null) resolve();

					shiftKey = mostRecentEvt.shiftKey;
					const k = sortedKeys[invokedOnId];
					const fromScaling = rollDataCpy.prompt.options[k];
					if (!fromScaling) {
						name = "";
						resolve(rollDataCpy);
					} else {
						name = `${Parser.spLevelToFull(k)}-level cast`;
						rollDataCpy.toRoll += `+${fromScaling}`;
						resolve(rollDataCpy);
					}
				}, [{text: rollDataCpy.prompt.entry, disabled: true}, null, ...sortedKeys.map(it => `${Parser.spLevelToFull(it)} level`)]);

				ContextUtil.handleOpenContextMenu(evt, ele, Renderer.dice._contextPromptLabel, (choseOption) => {
					if (!choseOption) resolve();
				});
			}) : Promise.resolve(rollDataCpy)).then((rollDataCpy) => {
				if (!rollDataCpy) return;

				Renderer.dice.rollerClick({shiftKey}, ele, JSON.stringify(rollDataCpy), name);
			});
		});
	},

	__rerollNextInlineResult (ele) {
		const $ele = $(ele);
		const $result = $ele.next(`.result`);
		const r = Renderer.dice.__rollPackedData($ele);
		$result.text(r);
	},

	__rollPackedData ($ele) {
		const tree = Renderer.dice._parse2($ele.data("packed-dice").toRoll);
		return tree.evl({});
	},

	rollerClick: (evtMock, ele, packed, name) => {
		const $ele = $(ele);
		const entry = JSON.parse(packed);
		function attemptToGetTitle () {
			// try use table caption
			let titleMaybe = $(ele).closest(`table:not(.stats)`).children(`caption`).text();
			if (titleMaybe) return titleMaybe.trim();
			// ty use list item title
			titleMaybe = $(ele).parent().children(`.list-item-title`).text();
			if (titleMaybe) return titleMaybe.trim();
			// try use stats table name row
			titleMaybe = $(ele).closest(`table.stats`).children(`tbody`).first().children(`tr`).first().find(`th.name .stats-name`).text();
			if (titleMaybe) return titleMaybe.trim();
			// otherwise, use the section title, where applicable
			titleMaybe = $(ele).closest(`div`).children(`.rd__h`).first().find(`.entry-title-inner`).text();
			if (titleMaybe) titleMaybe = titleMaybe.trim().replace(/[.,:]\s*$/, "");
			return titleMaybe;
		}

		function attemptToGetName () {
			const $hov = $ele.closest(`.hwin`);
			if ($hov.length) return $hov.find(`.stats-name`).first().text();
			const $roll = $ele.closest(`.out-roll-wrp`);
			if ($roll.length) return $roll.data("name");
			let name = document.title.replace("- 5etools", "").trim();
			return name === "DM Screen" ? "Dungeon Master" : name;
		}

		function getThRoll (total) {
			const $table = $ele.closest(`table`);
			const $td = $table.find(`td`).filter((i, e) => {
				const $e = $(e);
				if (!$e.closest(`table`).is($table)) return false;
				return total >= Number($e.data("roll-min")) && total <= Number($e.data("roll-max"));
			});
			if ($td.length && $td.nextAll().length) {
				const tableRow = $td.nextAll().get().map(ele => ele.innerHTML.trim()).filter(it => it).join(" | ");
				const $row = $(`<span class="message">${tableRow}</span>`);
				$row.find(`.render-roller`).each((i, e) => {
					const $e = $(e);
					const r = Renderer.dice.__rollPackedData($e);
					$e.attr("onclick", `Renderer.dice.__rerollNextInlineResult(this)`);
					$e.after(` (<span class="result">${r}</span>)`);
				});
				return $row.html();
			}
			return `<span class="message">No result found matching roll ${total}?! <span class="help--subtle" title="Bug!">🐛</span></span>`;
		}

		const rolledBy = {
			name: attemptToGetName(),
			label: name != null ? name : attemptToGetTitle(ele)
		};

		function doRoll (toRoll = entry) {
			if ($ele.parent().is("th") && $ele.parent().attr("data-isroller") === "true") Renderer.dice.rollEntry(toRoll, rolledBy, getThRoll);
			else Renderer.dice.rollEntry(toRoll, rolledBy);
		}

		// roll twice on shift, rolling advantage/crits where appropriate
		if (evtMock.shiftKey) {
			if (entry.subType === "damage") {
				const dice = [];
				entry.toRoll.replace(/(\d+)?d(\d+)/gi, (m0) => dice.push(m0));
				entry.toRoll = `${entry.toRoll}${dice.length ? `+${dice.join("+")}` : ""}`;
				doRoll();
			} else if (entry.subType === "d20") {
				entry.toRoll = `2d20dl1${entry.d20mod}`;
				doRoll();
			} else {
				Renderer.dice._showMessage("Rolling twice...", rolledBy);
				doRoll();
				doRoll();
			}
		} else doRoll();
	},

	/**
	 * Returns the total rolled, if available
	 */
	roll2 (str, rolledBy) {
		str = str.trim();
		if (!str) return;
		if (rolledBy.user) Renderer.dice._addHistory(str);

		if (str.startsWith("/")) Renderer.dice._handleCommand(str, rolledBy);
		else if (str.startsWith("#")) return Renderer.dice._handleSavedRoll(str, rolledBy);
		else {
			const [head, ...tail] = str.split(":");
			if (tail.length) {
				str = tail.join(":");
				rolledBy.label = head;
			}
			const tree = Renderer.dice._parse2(str);
			return Renderer.dice._handleRoll2(tree, rolledBy);
		}
	},

	rollEntry: (entry, rolledBy, cbMessage) => {
		const tree = Renderer.dice._parse2(entry.toRoll);
		tree.successThresh = entry.successThresh;
		tree.successMax = entry.successMax;
		Renderer.dice._handleRoll2(tree, rolledBy, cbMessage);
	},

	_handleRoll2 (tree, rolledBy, cbMessage) {
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		const $out = Renderer.dice._$lastRolledBy;

		if (tree) {
			const meta = {};
			const result = tree.evl(meta);
			const fullText = meta.text.join("");
			const allMax = meta.allMax.length && !(meta.allMax.filter(it => !it).length);
			const allMin = meta.allMin.length && !(meta.allMin.filter(it => !it).length);

			const lbl = rolledBy.label && (!rolledBy.name || rolledBy.label.trim().toLowerCase() !== rolledBy.name.trim().toLowerCase()) ? rolledBy.label : null;

			const totalPart = tree.successThresh
				? `<span class="roll">${result > (tree.successMax || 100) - tree.successThresh ? "Success!" : "Failure"}</span>`
				: `<span class="roll ${allMax ? "roll-max" : allMin ? "roll-min" : ""}">${result}</span>`;

			const title = `${rolledBy.name ? `${rolledBy.name} \u2014 ` : ""}${lbl ? `${lbl}: ` : ""}${tree._asString}`;

			$out.append(`
				<div class="out-roll-item" title="${title}">
					<div>
						${lbl ? `<span class="roll-label">${lbl}: </span>` : ""}
						${totalPart}
						<span class="all-rolls text-muted">${fullText}</span>
						${cbMessage ? `<span class="message">${cbMessage(result)}</span>` : ""}
					</div>
					<div class="out-roll-item-button-wrp">
						<button title="Copy to input" class="btn btn-default btn-xs btn-copy-roll" onclick="Renderer.dice._$iptRoll.val('${tree._asString.replace(/\s+/g, "")}'); Renderer.dice._$iptRoll.focus()"><span class="glyphicon glyphicon-pencil"></span></button>
					</div>
				</div>`);

			return result;
		} else {
			$out.append(`<div class="out-roll-item">Invalid input! Try &quot;/help&quot;</div>`);
		}
		Renderer.dice._scrollBottom();
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
			await StorageUtil.pSet(ROLLER_MACRO_STORAGE, Renderer.dice.storage);
		}

		if (com === "/help" || com === "/h") {
			Renderer.dice._showMessage(
				`Drop highest (<span class="out-roll-item-code">2d4dh1</span>) and lowest (<span class="out-roll-item-code">4d6dl1</span>) are supported.<br>
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

	_handleSavedRoll (id, rolledBy) {
		id = id.replace(/^#/, "");
		const macro = Renderer.dice.storage[id];
		if (macro) {
			rolledBy.label = id;
			const tree = Renderer.dice._parse2(macro);
			return Renderer.dice._handleRoll2(tree, rolledBy);
		} else Renderer.dice._showMessage(`Macro <span class="out-roll-item-code">#${id}</span> not found`, Renderer.dice.SYSTEM_USER);
	},

	addRoll: (rolledBy, msgText) => {
		if (!msgText.trim()) return;
		Renderer.dice._showBox();
		Renderer.dice._checkHandleName(rolledBy.name);
		Renderer.dice._$outRoll.prepend(`<div class="out-roll-item" title="${rolledBy.name || ""}">${msgText}</div>`);
		Renderer.dice._scrollBottom();
	},

	_checkHandleName: (name) => {
		if (!Renderer.dice._$lastRolledBy || Renderer.dice._$lastRolledBy.data("name") !== name) {
			Renderer.dice._$outRoll.prepend(`<div class="text-muted out-roll-id">${name}</div>`);
			Renderer.dice._$lastRolledBy = $(`<div class="out-roll-wrp"/>`).data("name", name);
			Renderer.dice._$outRoll.prepend(Renderer.dice._$lastRolledBy);
		}
	},

	_cleanOperators2 (str) { // TODO doesn't handle unary minus
		function cleanExpressions (ipt) {
			function P (str) {
				this._ = str;
			}

			ipt = `(${ipt})`.split("");

			let maxDepth = 0;
			function findMaxDepth () {
				maxDepth = 0;
				let curDepth = 0;
				for (let i = 0; i < ipt.length; ++i) {
					const c = ipt[i];
					if (typeof c !== "string") continue;

					switch (c) {
						case "(":
							curDepth++;
							break;
						case ")":
							maxDepth = Math.max(maxDepth, curDepth);
							curDepth--;
							break;
					}
				}
				if (curDepth !== 0) return null;
			}
			findMaxDepth();

			function processDepth () {
				let curDepth = 0;
				let lastOpenIndex = null;
				for (let i = 0; i < ipt.length; ++i) {
					const c = ipt[i];
					if (typeof c !== "string") continue;

					switch (c) {
						case "(":
							lastOpenIndex = i;
							curDepth++;
							break;
						case ")":
							if (curDepth === maxDepth) {
								let slice = [...ipt.slice(lastOpenIndex + 1, i)];
								if (!slice.length) return null; // handle "()"

								let replacement;
								// if there are drops, handle them by converting them to function format
								if (slice.includes("l") || slice.includes("h")) {
									if (!slice.includes("d")) return null;

									const outStack = [];

									let firstIx = null;
									let mode = null;
									let stack = [];

									const handleOutput = () => {
										if (mode === "l" || mode === "h") {
											const numPart = [];
											const facePart = [];
											const dropPart = [];
											let fn = null;
											let part = numPart;
											for (let i = 0; i < stack.length; ++i) {
												const c = stack[i];
												if (c === "d") {
													part = facePart;
												} else if (c === "l" || c === "h") {
													fn = c;
													part = dropPart;
												} else {
													part.push(c);
												}
											}
											outStack.push(fn, "(", ...numPart, ",", ...facePart, ",", ...dropPart, ")");
										} else {
											outStack.push(...stack);
										}

										firstIx = null;
										mode = null;
										stack = [];
									};

									for (let i = 0; i < slice.length; ++i) {
										const c = slice[i];

										if (c === "d") {
											if (mode != null) return null;
											mode = "d";
											stack.push("d");
										} else if (c === "l") {
											if (mode !== "d") return null;
											mode = "l";
											stack.push("l");
										} else if (c === "h") {
											if (mode !== "d") return null;
											mode = "h";
											stack.push("h");
										} else if (c instanceof P || c.isNumeric()) {
											if (firstIx == null) firstIx = i;
											stack.push(c);
										} else {
											handleOutput();
											stack.push(c);
										}
									}
									handleOutput();

									replacement = new P(outStack);
								} else {
									replacement = new P(slice);
								}

								ipt.splice(lastOpenIndex, i - lastOpenIndex + 1, replacement);

								lastOpenIndex = null;
							}
							curDepth--;
							break;
					}
				}
				return true;
			}

			while (maxDepth > 0) {
				const success = processDepth();
				if (!success) return null;
				findMaxDepth();
			}

			const outStack = [];
			function flatten (it) {
				if (it instanceof P) {
					outStack.push("(");
					it._.forEach(nxt => flatten(nxt));
					outStack.push(")");
				} else if (it instanceof Array) {
					it.forEach(nxt => flatten(nxt));
				} else if (typeof it === "string") {
					outStack.push(it);
				} else {
					throw new Error("Should never occur!");
				}
			}
			flatten(ipt);

			// strip the extra braces added for parsing
			return outStack.slice(1, outStack.length - 1).join("");
		}

		str = str.toLowerCase()
			.replace(/\s+/g, "") // clean whitespace
			.replace(/[×x]/g, "*") // convert mult signs
			.replace(/\*\*/g, "^") // convert ** to ^
			.replace(/÷/g, "/") // convert div signs
			.replace(/,/g, "") // remove commas
			.replace(/(^|[^\d)])d(\d)/g, (...m) => `${m[1]}1d${m[2]}`) // ensure unary dice have number
			.replace(/dl/g, "l").replace(/dh/g, "h") // shorthand drop lowest/highest
			.replace(/\)\(/g, ")*(").replace(/(\d)\(/g, "$1*("); // add multiplication signs

		let len;
		let nextLen;
		do {
			len = str.length;
			// compact successive +/-
			str = str.replace(/--/g, "+").replace(/\+\++/g, "+")
				.replace(/-\+/g, "-").replace(/\+-/g, "-");
			nextLen = str.length;
		} while (len !== nextLen);
		return cleanExpressions(str);
	},

	_parse2 (infix) {
		const displayString = infix;

		function infixToPostfix (infix) {
			function cleanArray (arr) {
				for (let i = 0; i < arr.length; ++i) {
					if (arr[i] === "") arr.splice(i, 1);
				}
				return arr;
			}

			const OPS = {
				"d": {precedence: 5, assoc: "R"},
				"^": {precedence: 4, assoc: "R"},
				"/": {precedence: 3, assoc: "L"},
				"*": {precedence: 3, assoc: "L"},
				"+": {precedence: 2, assoc: "L"},
				"-": {precedence: 2, assoc: "L"}
			};

			infix = Renderer.dice._cleanOperators2(infix);
			if (infix == null) return null;
			infix = cleanArray(infix.split(/([-+*/^()dlh,])/));

			const opStack = [];
			let outQueue = "";

			const handleOpPop = () => outQueue += `${opStack.pop()} `;
			const handleAtom = (tkn) => outQueue += `${tkn} `;

			for (let i = 0; i < infix.length; ++i) {
				const tkn = infix[i];

				if (tkn.isNumeric()) {
					handleAtom(tkn);
				} else if (tkn === "l" || tkn === "h") {
					opStack.push(tkn);
				} else if (tkn === ",") {
					while (opStack.peek() && opStack.peek() !== "(") {
						handleOpPop();
					}
				} else if (OPS[tkn]) {
					const o1 = tkn;
					let o2 = opStack.last();

					while (OPS[o2] && ((OPS[o1].assoc === "L" && OPS[o1].precedence <= OPS[o2].precedence) || (OPS[o1].assoc === "R" && OPS[o1].precedence < OPS[o2].precedence))) {
						handleOpPop();
						o2 = opStack.last();
					}

					opStack.push(o1);
				} else if (tkn === "(") {
					opStack.push(tkn);
					handleAtom(tkn);
				} else if (tkn === ")") {
					while (opStack.last() !== "(") {
						handleOpPop();
					}
					handleAtom(tkn);

					opStack.pop();

					// ensure function names get added
					if (opStack.last() === "l" || opStack.last() === "h") {
						handleOpPop();
					}
				}
			}

			while (opStack.length > 0) {
				handleOpPop();
			}

			return outQueue.trim();
		}

		function postfixToTree (postfix) {
			const OPS = {
				"d": (...args) => new Dice(...args),
				"^": (...args) => new Pow(...args),
				"**": (...args) => new Pow(...args),
				"/": (...args) => new Div(...args),
				"*": (...args) => new Mult(...args),
				"+": (...args) => new Add(...args),
				"-": (...args) => new Sub(...args)
			};
			const FNS = {
				"l": {
					args: 3,
					fn: function (...args) {
						return new Dice(...args, "l")
					}
				},
				"h": {
					args: 3,
					fn: function (...args) {
						return new Dice(...args, "h")
					}
				}
			};

			function prep (meta) {
				meta.text = meta.text || [];
				meta.rawText = meta.rawText || [];
				meta.allMax = meta.allMax || [];
				meta.allMin = meta.allMin || [];
			}

			function handlePrO (meta, self) {
				if (self.pr) {
					meta.text.push("(");
					meta.rawText.push("(");
				}
			}

			function handlePrC (meta, self) {
				if (self.pr) {
					meta.text.push(")");
					meta.rawText.push(")");
				}
			}

			function Atom (n) {
				this.type = "atom";
				this.n = n;
				this.pr = false;

				this.evl = meta => {
					prep(meta);

					handlePrO(meta, this);
					meta.text.push(n);
					meta.rawText.push(n);
					handlePrC(meta, this);
					return Number(n);
				};

				this.avg = meta => this.evl(meta);

				this._nxt = function* () { yield Number(n); };
				this.nxt = this._nxt.bind(this);
			}

			function Dice (num, faces, drop, dropType) {
				this.type = "dice";
				this.num = num;
				this.faces = faces;
				this.drop = drop;
				this.dropType = dropType;
				this.pr = false;

				this.evl = meta => this._get(meta, "evl");

				this.avg = meta => this._get(meta, "avg");

				// this ignore drops, and outputs each possible result only once
				this._nxt = function* () {
					const genNum = num.nxt();

					let n, f;
					while (!(n = genNum.next()).done) {
						const genFaces = faces.nxt();
						while (!(f = genFaces.next()).done) {
							const maxRoll = n.value * f.value;
							// minimum is "N," i.e. every roll was a 1
							for (let roll = n.value; roll <= maxRoll; ++roll) {
								yield roll;
							}
						}
					}
				};
				this.nxt = this._nxt.bind(this);

				this._get = (meta, nextFn) => {
					prep(meta);

					// N.B. this discards nested rolls, e.g. `3d20dl(1d2)` will never have the 1d2 result shown.
					const numN = num[nextFn]({});
					const facesN = faces[nextFn]({});

					const rolls = [...new Array(numN)].map(_ => nextFn === "avg" ? (facesN + 1) / 2 : RollerUtil.randomise(facesN));

					const prOpen = rolls.length > 1 ? "(" : "";
					const prClose = rolls.length > 1 ? ")" : "";
					if (drop != null) {
						const dropNum = Math.min(drop[nextFn]({}), numN);
						rolls.sort(SortUtil.ascSort).reverse();
						if (dropType === "h") rolls.reverse();

						const inSlice = rolls.slice(0, rolls.length - dropNum);
						const outSlice = rolls.slice(rolls.length - dropNum, rolls.length);

						handlePrO(meta, this);
						meta.text.push(`${prOpen}${inSlice.length ? `[${inSlice.join("]+[")}]` : ""}${outSlice.length ? `<span style="text-decoration: red line-through;">+[${outSlice.join("]+[")}]</span>` : ""}${prClose}`);
						meta.rawText.push(`${prOpen}${inSlice.length ? `[${inSlice.join("]+[")}]` : ""}${outSlice.length ? `+[${outSlice.join("]+[")}]` : ""}${prClose}`);
						handlePrC(meta, this);

						this._handleMinMax(meta, inSlice, facesN);

						return Math.sum(...inSlice);
					} else {
						const raw = `${prOpen}[${rolls.join("]+[")}]${prClose}`;

						handlePrO(meta, this);
						meta.text.push(raw);
						meta.rawText.push(raw);
						handlePrC(meta, this);

						this._handleMinMax(meta, rolls, facesN);

						return Math.sum(...rolls);
					}
				};

				this._handleMinMax = (meta, rolls, faces) => {
					const maxRolls = rolls.filter(it => it === faces);
					const minRolls = rolls.filter(it => it === 1);
					meta.allMax.push(maxRolls.length && maxRolls.length === rolls.length);
					meta.allMin.push(minRolls.length && minRolls.length === rolls.length);
				};
			}

			function Add (a, b) {
				this.type = "add";
				this.a = a;
				this.b = b;
				this.pr = false;

				this.evl = meta => this._get(meta, "evl");

				this.avg = meta => this._get(meta, "avg");

				this._nxt = function* () {
					const genL = a.nxt();

					let l, r;
					while (!(l = genL.next()).done) {
						const genR = b.nxt();
						while (!(r = genR.next()).done) {
							yield l.value + r.value;
						}
					}
				};
				this.nxt = this._nxt.bind(this);

				this._get = (meta, nextFn) => {
					prep(meta);

					handlePrO(meta, this);
					const l = a[nextFn](meta);
					meta.text.push("+");
					meta.rawText.push("+");
					const r = b[nextFn](meta);
					handlePrC(meta, this);

					return l + r;
				};
			}

			function Sub (a, b) {
				this.type = "sub";
				this.a = a;
				this.b = b;
				this.pr = false;

				this.evl = meta => this._get(meta, "evl");

				this.avg = meta => this._get(meta, "avg");

				this._nxt = function* () {
					const genL = a.nxt();

					let l, r;
					while (!(l = genL.next()).done) {
						const genR = b.nxt();
						while (!(r = genR.next()).done) {
							yield l.value - r.value;
						}
					}
				};
				this.nxt = this._nxt.bind(this);

				this._get = (meta, nextFn) => {
					prep(meta);

					handlePrO(meta, this);
					const l = a[nextFn](meta);
					meta.text.push("-");
					meta.rawText.push("-");
					const r = b[nextFn](meta);
					handlePrC(meta, this);

					return l - r;
				};
			}

			function Mult (a, b) {
				this.type = "mult";
				this.a = a;
				this.b = b;
				this.pr = false;

				this.evl = meta => this._get(meta, "evl");

				this.avg = meta => this._get(meta, "avg");

				this._nxt = function* () {
					const genL = a.nxt();

					let l, r;
					while (!(l = genL.next()).done) {
						const genR = b.nxt();
						while (!(r = genR.next()).done) {
							yield l.value * r.value;
						}
					}
				};
				this.nxt = this._nxt.bind(this);

				this._get = (meta, nextFn) => {
					prep(meta);

					handlePrO(meta, this);
					const l = a[nextFn](meta);
					meta.text.push("×");
					meta.rawText.push("×");
					const r = b[nextFn](meta);
					handlePrC(meta, this);

					return l * r;
				}
			}

			function Div (a, b) {
				this.type = "div";
				this.a = a;
				this.b = b;
				this.pr = false;

				this.evl = meta => this._get(meta, "evl");

				this.avg = meta => this._get(meta, "avg");

				this._nxt = function* () {
					const genL = a.nxt();

					let l, r;
					while (!(l = genL.next()).done) {
						const genR = b.nxt();
						while (!(r = genR.next()).done) {
							yield l.value / r.value;
						}
					}
				};
				this.nxt = this._nxt.bind(this);

				this._get = (meta, nextFn) => {
					prep(meta);

					handlePrO(meta, this);
					const l = a[nextFn](meta);
					meta.text.push("÷");
					meta.rawText.push("÷");
					const r = b[nextFn](meta);
					handlePrC(meta, this);

					return l / r;
				}
			}

			function Pow (n, e) {
				this.type = "pow";
				this.n = n;
				this.e = e;
				this.pr = false;

				this.evl = (meta) => this._get(meta, "evl");

				this.avg = meta => this._get(meta, "avg");

				this._nxt = function* () {
					const genL = a.nxt();

					let l, r;
					while (!(l = genL.next()).done) {
						const genR = b.nxt();
						while (!(r = genR.next()).done) {
							yield Math.pow(l.value, r.value);
						}
					}
				};
				this.nxt = this._nxt.bind(this);

				this._get = (meta, nextFn) => {
					prep(meta);

					handlePrO(meta, this);
					const nNum = n[nextFn](meta);
					meta.text.push("<sup>");
					meta.rawText.push("^");
					const eNum = e[nextFn](meta);
					meta.text.push("</sup>");
					handlePrC(meta, this);

					return Math.pow(nNum, eNum);
				}
			}

			let out = null;

			const fnStack = [];
			let nextHasParens = false;
			const ipt = postfix.replace(/[()]/g, (...m) => m[0] === ")" ? "(" : ")") // flip parentheses
				.split(" ").reverse();

			for (let i = 0; i < ipt.length; ++i) {
				const c = ipt[i];

				if (c.isNumeric()) {
					const atomic = new Atom(c);
					if (nextHasParens) {
						atomic.pr = true;
						nextHasParens = false;
					}
					if (!fnStack.length) {
						out = atomic;
					} else {
						let last = fnStack.peek();
						last.args.unshift(atomic);

						while (fnStack.length && last.reqArgs === last.args.length) {
							let cur = fnStack.pop();

							if (fnStack.peek()) {
								last = fnStack.peek();
								last.args.unshift(cur);
							}
						}

						if (!fnStack.length) {
							out = last;
						}
					}
				} else if (OPS[c]) {
					const op = {fn: OPS[c], reqArgs: 2, args: []};
					if (nextHasParens) {
						op.pr = true;
						nextHasParens = false;
					}
					fnStack.push(op);
				} else if (FNS[c]) {
					const fn = {fn: FNS[c].fn, reqArgs: FNS[c].args, args: []};
					if (nextHasParens) {
						fn.pr = true;
						nextHasParens = false;
					}
					fnStack.push(fn);
				} else if (c === "(") {
					nextHasParens = true;
				}
			}

			if (out == null) return null;

			function toTree (cur) {
				if (cur.evl) {
					return cur;
				} else {
					const node = cur.fn(...cur.args.map(it => toTree(it)));
					if (cur.pr) node.pr = true;
					return node;
				}
			}

			return toTree(out);
		}

		const postfix = infixToPostfix(infix);
		if (postfix == null) return null;
		const tree = postfixToTree(postfix);
		if (tree == null) return null;
		tree._asString = displayString;
		return tree;
	}
};
if (!IS_ROLL20 && typeof window !== "undefined") {
	window.addEventListener("load", Renderer.dice.init);
}

/**
 * Recursively find all the names of entries, useful for indexing
 * @param nameStack an array to append the names to
 * @param entry the base entry
 * @param maxDepth maximum depth to search for
 * @param depth start (used internally when recursing)
 */
Renderer.getNames = function (nameStack, entry, maxDepth = -1, depth = 0) {
	if (maxDepth !== -1 && depth > maxDepth) return;
	if (entry.name) nameStack.push(Renderer.stripTags(entry.name));
	if (entry.entries) {
		for (const eX of entry.entries) {
			Renderer.getNames(nameStack, eX, maxDepth, depth + 1);
		}
	} else if (entry.items) {
		for (const eX of entry.items) {
			Renderer.getNames(nameStack, eX, maxDepth, depth + 1);
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
						return text.replace(/^{@(i|italic|b|bold|s|strike) (.*?)}$/, "$1");

					case "@h": return "Hit: ";

					case "@dc": return `DC ${text}`;

					case "@atk": return Renderer.attackTagToFull(text);

					case "@chance":
					case "@d20":
					case "@damage":
					case "@dice":
					case "@hit":
					case "@recharge": {
						const [rollText, displayText] = text.split("|");
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

					case "@action":
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
					case "@loader": {
						const parts = text.split("|");
						return parts[0];
					}

					case "@area":
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
					case "@object":
					case "@optfeature":
					case "@psionic":
					case "@race":
					case "@reward":
					case "@ship":
					case "@spell":
					case "@table":
					case "@trap":
					case "@variantrule": {
						const parts = text.split("|");
						return parts.length >= 3 ? parts[2] : parts[0];
					}

					case "@deity": {
						const parts = text.split("|");
						return parts.length >= 4 ? parts[3] : parts[0];
					}

					case "@homebrew": {
						const [newText, oldText] = text.split("|");
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
					return !/\d+([-\u2013]\d+)?/.exec(it[0]);
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
		const m = /^(\d+)([-\u2013](\d+))?$/.exec(String(row[0]).trim());
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

	const $images = $(`img[data-src]`);
	const config = {
		rootMargin: "150px 0px", // if the image gets within 150px of the viewport
		threshold: 0.01
	};

	if (Renderer._imageObserver) Renderer._imageObserver.disconnect();
	Renderer._imageObserver = new IntersectionObserver(onIntersection, config);
	$images.each((i, image) => Renderer._imageObserver.observe(image));
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
