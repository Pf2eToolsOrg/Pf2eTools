// TODO implement remaining methods
class RendererMarkdown {
	constructor () {
		// FIXME this is awful
		const renderer = new Renderer();
		for (const k in renderer) {
			if (this[k] === undefined) {
				if (typeof renderer[k] === "function") this[k] = renderer[k].bind(this);
				else this[k] = MiscUtil.copy(renderer[k]);
			}
		}
	}

	static get () {
		return new RendererMarkdown();
	}

	// region recursive
	/*
	_renderEntries (entry, textStack, meta, options) {
		// (Use base implementation)
	}
	*/

	_renderEntriesSubtypes (entry, textStack, meta, options, incDepth) {
		const isInlineTitle = meta.depth >= 2;
		const nextDepth = incDepth && meta.depth < 2 ? meta.depth + 1 : meta.depth;

		if (entry.name) {
			if (isInlineTitle) {
				textStack[0] += `***${entry.name}.*** `;
			} else {
				const hashCount = meta._typeStack.length === 1 && meta.depth === -1 ? 1 : Math.min(6, meta.depth + 3);
				textStack[0] += `\n${"#".repeat(hashCount)} ${entry.name}\n`;
			}
		}

		if (entry.entries) {
			this._renderEntriesSubtypes_renderPreReqText(entry, textStack, meta);
			const cacheDepth = meta.depth;
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				meta.depth = nextDepth;
				this._recursiveRender(entry.entries[i], textStack, meta, {suffix: "\n"});
			}
			meta.depth = cacheDepth;
		}
	}

	_renderEntriesSubtypes_renderPreReqText (entry, textStack, meta) {
		if (entry.prerequisite) {
			textStack[0] += `*Prerequisite: `;
			this._recursiveRender({type: "inline", entries: [entry.prerequisite]}, textStack, meta);
			textStack[0] += `*\n`;
		}
	}

	/*
	_renderOptions (entry, textStack, meta, options) {
		// (Use base implementation)
	}
	*/

	_renderList (entry, textStack, meta, options) {
		if (!entry.items) return;

		const listDepth = Math.max(meta._typeStack.filter(it => it === "list").length - 1, 0);

		if (entry.name) textStack[0] += `##### ${entry.name}`;
		const indentSpaces = "  ".repeat(listDepth);

		const len = entry.items.length;
		for (let i = 0; i < len; ++i) {
			const item = entry.items[i];
			// Special case for child lists -- avoid double-hyphen-prefixing
			textStack[0] += `${indentSpaces}${item.type !== "list" ? "-" : ""}`;

			const cacheDepth = this._adjustDepth(meta, 1);
			this._recursiveRender(entry.items[i], textStack, meta, {prefix: indentSpaces, suffix: "\n"});
			meta.depth = cacheDepth;
		}

		textStack[0] += "\n";
	}

	_renderTable (entry, textStack, meta, options) {
		if (entry.intro) for (const ent of entry.intro) this._recursiveRender(ent, textStack, meta);

		textStack[0] += "\n";

		if (entry.caption) textStack[0] += `##### ${entry.caption}\n`;

		const hasLabels = entry.colLabels && entry.colLabels.length;
		// If there's no data, render a stub table.
		if (!hasLabels && (!entry.rows || !entry.rows.length)) {
			textStack[0] += `|   |\n`;
			textStack[0] += `|---|\n`;
			textStack[0] += `|   |\n`;
			return;
		}

		// TODO to format cell widths evenly, each header/cell should rendered to a string independently and stored in a buffer
		//   Once all the strings are available, we can pull out all the widths and pad as appropriate

		// Labels are required for markdown tables
		let labels = entry.colLabels;
		if (!hasLabels) {
			const numCells = Math.max(...entry.rows.map(r => r.length));
			labels = [...new Array(numCells)].map(() => "");
		}

		// Pad labels to style width
		if (entry.colStyles && labels.length < entry.colStyles.length) {
			labels = labels.concat([...new Array(entry.colStyles.length - labels.length)].map(() => ""));
		}

		for (const label of labels) textStack[0] += `| ${label} `;
		textStack[0] += "|\n";

		if (entry.colStyles) {
			let styles = entry.colStyles;
			// Pad styles to label width
			if (labels.length > entry.colStyles.length) {
				styles = styles.concat([...new Array(labels.length - entry.colStyles.length)].map(() => ""));
			}

			for (const style of styles) {
				textStack[0] += `|`;
				if (style.includes("text-center")) textStack[0] += ":---:";
				else if (style.includes("text-right")) textStack[0] += "---:";
				else textStack[0] += "---";
			}
			textStack[0] += "|\n";
		}

		if (!entry.rows) {
			textStack[0] += `||\n`;
			return;
		}

		for (const row of entry.rows) {
			const rowRender = row.type === "row" ? row.row : row;

			for (const cell of rowRender) {
				let toRenderCell;

				if (cell.type === "cell") {
					if (cell.roll) {
						if (cell.roll.entry) toRenderCell = cell.roll.entry;
						else if (cell.roll.exact != null) toRenderCell = cell.roll.pad ? StrUtil.padNumber(cell.roll.exact, 2, "0") : cell.roll.exact;
						else {
							toRenderCell = cell.roll.pad
								? `${StrUtil.padNumber(cell.roll.min, 2, "0")}-${StrUtil.padNumber(cell.roll.max, 2, "0")}`
								: `${cell.roll.min}-${cell.roll.max}`;
						}
					} else if (cell.entry) {
						toRenderCell = cell.entry;
					}
				} else {
					toRenderCell = cell;
				}

				textStack[0] += "| ";
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(toRenderCell, textStack, meta);
				meta.depth = cacheDepth;
				textStack[0] += " ";
			}
			textStack[0] += "|\n";
		}

		if (entry.footnotes) {
			for (const ent of entry.footnotes) {
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(ent, textStack, meta);
				meta.depth = cacheDepth;
			}
		}
		if (entry.outro) for (const ent of entry.intro) this._recursiveRender(ent, textStack, meta);

		textStack[0] += "\n";
	}

	/*
	_renderTableGroup (entry, textStack, meta, options) {
		// (Use base implementation)
	}
	*/

	_renderInset (entry, textStack, meta, options) {
		textStack[0] += "\n";
		if (entry.name != null) textStack[0] += `> ##### ${entry.name}\n`;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: ">", suffix: "\n"});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `\n`;
	}

	_renderInsetReadaloud (entry, textStack, meta, options) {
		textStack[0] += "\n";
		if (entry.name != null) textStack[0] += `>> ##### ${entry.name}\n`;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: ">>", suffix: "\n"});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `\n`;
	}

	_renderVariant (entry, textStack, meta, options) {
		textStack[0] += "\n";
		if (entry.name != null) textStack[0] += `> ##### Variant: ${entry.name}\n`;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: ">", suffix: "\n"});
				meta.depth = cacheDepth;
			}
		}
		if (entry.variantSource) textStack[0] += `${RendererMarkdown.utils.getPageText(entry.variantSource)}\n`;
		textStack[0] += "\n";
	}

	_renderVariantSub (entry, textStack, meta, options) {
		if (entry.name) textStack[0] += `*${entry.name}.* `;

		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.entries[i], textStack, meta, {suffix: "\n"});
			}
		}
	}

	/*
	_renderSpellcasting (entry, textStack, meta, options) {
		// (Use base implementation)
	}
	*/

	_renderQuote (entry, textStack, meta, options) {
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "*", suffix: "*"});
			if (i !== entry.entries.length - 1) textStack[0] += `\n`;
		}
		if (entry.by) {
			const tempStack = [""];
			this._recursiveRender(entry.by, tempStack, meta);
			textStack[0] += `\u2014 ${tempStack.join("")}${entry.from ? `, *${entry.from}*` : ""}`;
		}
	}

	/*
	_renderOptfeature (entry, textStack, meta, options) {
		// (Use base implementation)
	}

	_renderPatron (entry, textStack, meta, options) {
		// (Use base implementation)
	}
	// endregion
	*/

	// region block
	_renderAbilityDc (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `**${entry.name} save DC** = 8 + your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}`;
		this._renderSuffix(entry, textStack, meta, options);
	}

	_renderAbilityAttackMod (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `**${entry.name} attack modifier** = your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}`;
		this._renderSuffix(entry, textStack, meta, options);
	}

	_renderAbilityGeneric (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `${entry.name ? `**${entry.name}**  = ` : ""}${entry.text}${entry.attributes ? ` ${Parser.attrChooseToFull(entry.attributes)}` : ""}`;
		this._renderSuffix(entry, textStack, meta, options);
	}
	// endregion

	/*
	// region inline
	_renderInline (entry, textStack, meta, options) {
		// (Use base implementation)
	}

	_renderInlineBlock (entry, textStack, meta, options) {
		// (Use base implementation)
	}

	_renderBonus (entry, textStack, meta, options) {
		// (Use base implementation)
	}

	_renderBonusSpeed (entry, textStack, meta, options) {
		// (Use base implementation)
	}

	_renderDice (entry, textStack, meta, options) {

	}
	*/

	_renderLink (entry, textStack, meta, options) {
		const href = this._renderLink_getHref(entry);
		textStack[0] += `[${href}](${this.render(entry.text)})\n`;
	}

	/*
	_renderActions (entry, textStack, meta, options) {

	}

	_renderAttack (entry, textStack, meta, options) {

	}
	// endregion

	*/
	// region list items
	_renderItem (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `**${this.render(entry.name)}** `;
		if (entry.entry) this._recursiveRender(entry.entry, textStack, meta);
		else if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta, {prefix: i > 0 ? "  " : "", suffix: "\n"});
		}
		textStack[0] += "\n";
		this._renderSuffix(entry, textStack, meta, options);
	}

	_renderItemSub (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._recursiveRender(entry.entry, textStack, meta, {prefix: `*${this.render(entry.name)}* `, suffix: "\n"});
		this._renderSuffix(entry, textStack, meta, options);
	}

	_renderItemSpell (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._recursiveRender(entry.entry, textStack, meta, {prefix: `${entry.name} `, suffix: "\n"});
		this._renderSuffix(entry, textStack, meta, options);
	}
	// endregion

	// region data
	_renderDataCreature (entry, textStack, meta, options) {
		const mon = entry.dataCreature;

		const savePart = mon.save ? `\n>- **Saving Throws** ${Object.keys(mon.save).sort(SortUtil.ascSortAtts).map(it => RendererMarkdown.monster.getSave(it, mon.save[it])).join(", ")}` : "";
		const skillPart = mon.skill ? `\n>- **Skills** ${RendererMarkdown.monster.getSkillsString(renderer, mon)}` : "";
		const damVulnPart = mon.vulnerable ? `\n>- **Damage Vulnerabilities** ${Parser.monImmResToFull(mon.vulnerable)}` : "";
		const damResPart = mon.resist ? `\n>- **Damage Resistances** ${Parser.monImmResToFull(mon.resist)}` : "";
		const damImmPart = mon.immune ? `\n>- **Damage Immunities** ${Parser.monImmResToFull(mon.immune)}` : "";
		const condImmPart = mon.conditionImmune ? `\n>- **Condition Immunities** ${Parser.monCondImmToFull(mon.conditionImmune, true)}` : "";

		const traitArray = RendererMarkdown.monster.getOrderedTraits(mon);
		const traitsPart = traitArray && traitArray.length ? `\n${RendererMarkdown.monster._getRenderedSection(traitArray, 1)}` : "";

		const actionsPart = mon.action ? `\n### Actions\n${RendererMarkdown.monster._getRenderedSection(mon.action, 1)}` : "";
		const reactionsPart = mon.reaction ? `\n### Reactions\n${RendererMarkdown.monster._getRenderedSection(mon.reaction, 1)}` : "";
		const legendaryActionsPart = mon.legendary ? `\n### Legendary Actions\n${Renderer.monster.getLegendaryActionIntro(mon, RendererMarkdown.get())}\n${RendererMarkdown.monster._getRenderedSection(mon.legendary, 1)}` : "";

		textStack[0] += `\n
---
>## ${mon._displayName || mon.name}
>*${mon.level ? `${Parser.getOrdinalForm(mon.level)}-level ` : ""}${Parser.sizeAbvToFull(mon.size)} ${mon._pTypes.asText}${mon.alignment ? `, ${Parser.alignmentListToFull(mon.alignment).toLowerCase()}` : ""}*
>___
>- **Armor Class** ${Parser.acToFull(mon.ac)}
>- **Hit Points** ${Renderer.monster.getRenderedHp(mon.hp, true)}
>- **Speed** ${Parser.getSpeedString(mon)}
>___
>|${Parser.ABIL_ABVS.map(it => `${it.toUpperCase()}|`)}
>|:---:|:---:|:---:|:---:|:---:|:---:|
>|${Parser.ABIL_ABVS.map(ab => `${mon[ab]} (${Parser.getAbilityModifier(mon[ab])})|`)}
>___${savePart}${skillPart}${damVulnPart}${damResPart}${damImmPart}${condImmPart}
>- **Senses** ${mon.senses ? `${Renderer.monster.getRenderedSenses(mon.senses, true)}, ` : ""}passive Perception ${mon.passive || "\u2014"}
>- **Languages** ${Renderer.monster.getRenderedLanguages(mon.languages)}
>- **Challenge** ${mon.cr ? Parser.monCrToFull(mon.cr) : "\u2014"}
>___${traitsPart}${actionsPart}${reactionsPart}${legendaryActionsPart}\n`
	}

	/*
	_renderDataSpell (entry, textStack, meta, options) {

	}

	_renderDataTrapHazard (entry, textStack, meta, options) {

	}
	// endregion

	// region images
	_renderImage (entry, textStack, meta, options) {

	}

	_renderGallery (entry, textStack, meta, options) {

	}
	// endregion

	// region homebrew
	_renderHomebrew (entry, textStack, meta, options) {

	}
	// endregion
	*/

	// region misc
	_renderCode (entry, textStack, meta, options) {
		textStack[0] += "\n```\n";
		textStack[0] += entry.preformatted;
		textStack[0] += "\n```\n";
	}

	_renderHr (entry, textStack, meta, options) {
		textStack[0] += `\n---\n`;
	}
	// endregion

	// region primitives
	_renderString (entry, textStack, meta, options) { textStack[0] += entry }
	_renderPrimitive (entry, textStack, meta, options) { textStack[0] += `${entry}` }
	// endregion
}

RendererMarkdown.utils = class {
	static getPageText (it) {
		const sourceSub = Renderer.utils.getSourceSubText(it);
		const baseText = it.page > 0 ? `**Source:** *${Parser.sourceJsonToAbv(it.source)}${sourceSub}*, page ${it.page}` : "";
		const addSourceText = this._getPageText_getAltSourceText(it, "additionalSources", "Additional information from");
		const otherSourceText = this._getPageText_getAltSourceText(it, "otherSources", "Also found in");
		const externalSourceText = this._getPageText_getAltSourceText(it, "externalSources", "External sources:");

		return `${[baseText, addSourceText, otherSourceText, externalSourceText].filter(it => it).join(". ")}${baseText && (addSourceText || otherSourceText || externalSourceText) ? "." : ""}`;
	}

	static _getPageText_getAltSourceText (it, prop, introText) {
		if (!it[prop] || !it[prop].length) return "";

		return `${introText} ${it[prop].map(as => {
			if (as.entry) return Renderer.get().render(as.entry);
			else return `*${Parser.sourceJsonToAbv(as.source)}*${as.page > 0 ? `, page ${as.page}` : ""}`;
		}).join("; ")}`
	}
};

RendererMarkdown.monster = class {
	static getSave (attr, mod) {
		if (attr === "special") return Renderer.stripTags(mod);
		return `${attr.uppercaseFirst()} ${mod}`
	}

	static getSkillsString (mon) {
		function doSortMapJoinSkillKeys (obj, keys, joinWithOr) {
			const toJoin = keys.sort(SortUtil.ascSort).map(s => `${s.toTitleCase()} ${obj[s]}`);
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
			const special = mon.skill.special && Renderer.stripTags(mon.skill.special);
			return [skills, others, special].filter(Boolean).join(", ");
		} else return skills;
	}

	static _getRenderedSection (sectionEntries, sectionLevel) {
		const renderer = RendererMarkdown.get();
		const renderStack = [];
		sectionEntries.forEach(e => {
			if (e.rendered) renderStack.push(e.rendered);
			else renderer.recursiveRender(e, renderStack, {depth: sectionLevel + 1});
		});
		return renderStack.join("");
	}

	static getOrderedTraits (mon) {
		let traits = mon.trait ? MiscUtil.copy(mon.trait) : null;
		if (mon.spellcasting) traits = (traits || []).concat(RendererMarkdown.monster.getSpellcastingRenderedTraits(mon));
		if (traits) return traits.sort((a, b) => SortUtil.monTraitSort(a.name, b.name));
	}

	static getSpellcastingRenderedTraits (mon) {
		const out = [];
		mon.spellcasting.forEach(entry => {
			entry.type = entry.type || "spellcasting";
			const renderStack = [];
			RendererMarkdown.get().recursiveRender(entry, renderStack, {depth: 2});
			out.push({name: entry.name, rendered: renderStack.join("")});
		});
		return out;
	}
};

class MarkdownConverter {
	static getEntries (mdStr) {
		mdStr = mdStr.trim();
		if (!mdStr) return [];

		mdStr = this._getCleanGmBinder(mdStr);

		const buf = mdStr.split("\n").map(line => line.trimEnd());

		this._coalesceCreatures(buf);
		this._convertCreatures(buf);

		this._coalesceInsetsReadalouds(buf);
		this._convertInsetsReadalouds(buf);

		this._coalesceTables(buf);
		this._convertTables(buf);

		this._coalesceLists(buf);
		this._convertLists(buf);

		this._coalesceHeaders(buf);

		this._convertInlineStyling(buf);
		this._cleanEmptyLines(buf);
		this._cleanEntries(buf);

		return buf;
	}

	static _getCleanGmBinder (mdStr) {
		// Replace any GMB-specific markers
		mdStr = mdStr.replace(/(^|\n)\s*\\(pagebreakNum|pagebreak|columnbreak)/gi, "");

		// Scrub HTML
		try {
			const $jq = $(`<div>${mdStr}</div>`);
			$jq.find("*").remove();
			mdStr = $jq.text();
		} catch (e) {
			setTimeout(() => { throw e; });
		}

		return mdStr;
	}

	static _coalesceCreatures (buf) {
		for (let i = 0; i < buf.length; ++i) {
			const line = buf[i].trim();

			if (line === "___" || line === "---") {
				let j = 1;

				// Skip forwards until we run out of lines, or until we hit a line that isn't part of the block
				for (; i + j < buf.length; ++j) {
					const nxt = buf[i + j];
					if (!nxt || !nxt.startsWith(">")) break;
				}

				const creatureLines = buf.slice(i, i + j);
				// Remove any creature markers with no following content
				if (creatureLines.length === 1) {
					buf.splice(i, 1);
					i--;
				} else buf.splice(i, j, {mdType: "creature", lines: creatureLines});
			}
		}
	}

	static _convertCreatures (buf) {
		for (let i = 0; i < buf.length; ++i) {
			const line = buf[i];
			if (typeof line === "string") continue;

			if (line.mdType === "creature") {
				buf[i] = {
					type: "inset",
					name: "(To convert creature statblocks, please use the Text Converter utility)",
					entries: line.lines.slice(1).map(it => it.slice(1).trim())
				}
			}
		}
	}

	static _coalesce_getLastH5Index (line, i, curCaptionIx) {
		if (typeof line === "string") {
			if (line.trim()) {
				if (line.startsWith("##### ")) return i;
				else return -1;
			}
		} else return -1;
		return curCaptionIx;
	}

	/**
	 * Apply an array-modifying function recursively.
	 * @param obj The object to apply the function to.
	 * @param fn The function to apply. Note that it must modify the array in-place.
	 */
	static _coalesceConvert_doRecurse (obj, fn) {
		if (typeof obj !== "object") throw new TypeError(`Non-object ${obj} passed to object handler!`);

		if (obj instanceof Array) {
			fn(obj);

			obj.forEach(it => {
				if (typeof it !== "object") return;
				this._coalesceConvert_doRecurse(it, fn)
			});
		} else {
			if (obj.type) {
				const childMeta = Renderer.ENTRIES_WITH_CHILDREN.find(it => it.type === obj.type && obj[it.key]);
				if (childMeta) {
					this._coalesceConvert_doRecurse(obj[childMeta.key], fn);
				}
			}
		}
	}

	static _coalesceTables (buf) {
		let lastCaptionIx = -1;

		for (let i = 0; i < buf.length; ++i) {
			// Track the last caption position, so we can hoover it up later
			if (i > 0) {
				const lPrev = buf[i - 1];
				lastCaptionIx = this._coalesce_getLastH5Index(lPrev, i - 1, lastCaptionIx);
			}

			let l1 = buf[i];
			let l2 = buf[i + 1];

			// If we find valid table headers, start scanning in rows until we find something not table-like.
			// This can be a `#` header line; a `>` inset line; or a line that doesn't contain a pipe.
			// Additionally, if we find a pre-processed object (e.g. a creature), we're done.
			if (typeof l1 === "string" && typeof l2 === "string"
				&& l1.includes("|") && l2.includes("|")
				&& l2.includes("---") && /^[ |:-]+$/gi.exec(l2)
			) {
				l1 = l1.trim();
				l2 = l2.trim();

				let j = 2;
				for (; j < buf.length; ++j) {
					const lNxt = buf[i + j];
					if (!lNxt || !this._coalesceTables_isTableLine(lNxt)) break;
				}

				if (lastCaptionIx != null && ~lastCaptionIx) {
					const lines = buf.slice(lastCaptionIx, i + j);
					buf.splice(
						lastCaptionIx,
						j + (i - lastCaptionIx),
						{mdType: "table", caption: lines[0].replace("##### ", ""), lines: lines.slice(1)}
					);
				} else {
					const lines = buf.slice(i, i + j);
					buf.splice(i, j, {mdType: "table", lines});
				}
			}
		}
	}

	static _convertTables (buf) {
		for (let i = 0; i < buf.length; ++i) {
			const line = buf[i];
			if (typeof line === "string") continue;

			if (!line.mdType) {
				this._coalesceConvert_doRecurse(line, this._convertTables.bind(this));
			} else {
				if (line.mdType !== "table") continue;

				buf[i] = this.getConvertedTable(line.lines, line.caption);
			}
		}
	}

	static _coalesceTables_isTableLine (l) {
		if (typeof l !== "string") return false;
		l = l.trim();
		if (!l.includes("|")) return false;
		return !/^#+ /.test(l) && !l.startsWith("> ") && !/^[-*+]/.test(l);
	}

	static _coalesceLists (buf) {
		for (let i = 0; i < buf.length; ++i) {
			const line = buf[i];

			if (typeof line !== "string") {
				this._coalesceConvert_doRecurse(line, this._coalesceLists.bind(this));
			} else {
				const liM = this._coalesceLists_isListItem(line);
				if (liM) {
					let j = 1;
					let blankCount = 0;

					// Skip forwards until we run out of lines, or until we hit a line that isn't part of the block
					for (; i + j < buf.length; ++j) {
						const nxt = buf[i + j];
						if (!nxt || !nxt.trim()) {
							// Allow a max of one blank line before breaking into another list
							if (blankCount++ < 1) continue;
							else break
						}
						blankCount = 0;
						if (typeof nxt !== "string") break;
						if (!this._coalesceLists_isListItem(nxt)) break;
					}

					const listLines = buf.slice(i, i + j);
					buf.splice(i, j, {mdType: "list", lines: listLines.filter(it => it.trim())});
				}
			}
		}
	}

	static _coalesceLists_isListItem (line) { return /^(\s*)\* /.test(line) || /^(\s*)- /.test(line) || /^(\s*)\+ /.test(line); }

	static _convertLists (buf) {
		for (let i = 0; i < buf.length; ++i) {
			const line = buf[i];
			if (typeof line === "string") continue;

			if (!line.mdType) {
				this._coalesceConvert_doRecurse(line, this._convertLists.bind(this));
			} else {
				if (line.mdType !== "list") continue;

				// Normalise line depths
				line.lines = this._convertLists_doNormalise(line.lines);

				const stack = [];

				const getStackDepth = () => {
					if (!stack.length) return null;
					return stack.length - 1;
				};

				line.lines.forEach(l => {
					const depth = l.length - l.trimStart().length;
					const lText = l.trim();

					if (getStackDepth() == null) {
						const list = {type: "list", items: [lText]};
						stack.push(list);
					} else {
						if (depth === getStackDepth()) stack.last().items.push(lText);
						else if (depth > getStackDepth()) {
							const list = {type: "list", items: [lText]};
							stack.last().items.push(list);
							stack.push(list);
						} else if (depth < getStackDepth()) {
							while (depth < getStackDepth()) stack.pop();

							if (stack.length) stack.last().items.push(lText);
							else stack.push({type: "list", items: [lText]});
						}
					}
				});

				buf.splice(i, 1, stack[0]);
			}
		}
	}

	static _convertLists_doNormalise (lst) {
		const getCleanLine = l => l.replace(/^\s*[-+*]\s*/, "");

		// Allow +/- 1 depth range
		const isInDepthRange = (depthRange, depth) => (depthRange[0] == null && depthRange[1] == null) || (depth >= depthRange[0] - 1 && depth <= depthRange[1] + 1);

		const setDepthRange = (depthRange, depth) => depthRange[0] = depthRange[1] = depth;
		const expandDepthRange = (depthRange, depth) => {
			if (depthRange[0] == null && depthRange[1] == null) {
				depthRange[0] = depth;
				depthRange[1] = depth;
			} else {
				depthRange[0] = Math.min(depthRange[0], depth);
				depthRange[1] = Math.max(depthRange[1], depth);
			}
		};

		// Normalise leading whitespace
		let targetDepth = 0;

		const depthRange = [null, null];

		return lst.map(l => {
			const depth = l.length - l.trimStart().length;

			if (isInDepthRange(depthRange, depth)) {
				expandDepthRange(depthRange, depth);
			} else if (depth > depthRange[1]) {
				targetDepth++;
				setDepthRange(depthRange, depth);
			} else if (depth < depthRange[0]) {
				// If the depth is below where we're at, step our targetDepth by an appropriate count of 2-spaces
				const targetDepthReduction = Math.floor((depthRange[0] - depth) / 2);
				targetDepth = Math.max(0, targetDepth - targetDepthReduction);
				setDepthRange(depthRange, depth);
			}
			return `${" ".repeat(targetDepth)}${getCleanLine(l)}`;
		});
	}

	static _coalesceInsetsReadalouds (buf) {
		const getCleanLine = l => l.replace(/^>>?\s*/, "");

		for (let i = 0; i < buf.length; ++i) {
			let line = buf[i];

			if (typeof line !== "string") {
				this._coalesceConvert_doRecurse(line, this._coalesceInsetsReadalouds.bind(this));
			} else {
				line = line.trim();

				if (this._coalesceInsets_isInsetLine(line) || this._coalesceInsets_isReadaloudLine(line)) {
					let type = this._coalesceInsets_isReadaloudLine(line) ? "insetReadaloud" : "inset";

					let j = 1;
					const header = /^>\s*#####\s+/.test(line) ? line.replace(/^>\s*#####\s+/, "") : null;

					for (; j < buf.length; ++j) {
						const lNxt = buf[i + j];
						if (typeof lNxt === "object") continue;
						if (!lNxt) break;
						if (type === "insetReadaloud" && !this._coalesceInsets_isReadaloudLine(lNxt)) break;
						if (type === "inset" && !this._coalesceInsets_isInsetLine(lNxt)) break;
					}

					const lines = buf.slice(i, i + j).map(getCleanLine);
					const out = {mdType: type, lines};
					if (header) {
						out.name = header;
						lines.shift();
					}
					buf.splice(i, j, out);
				}
			}
		}
	}

	static _coalesceInsets_isReadaloudLine (l) {
		return l.trim().startsWith(">>");
	}

	static _coalesceInsets_isInsetLine (l) {
		return l.trim().startsWith(">");
	}

	static _convertInsetsReadalouds (buf) {
		for (let i = 0; i < buf.length; ++i) {
			const line = buf[i];
			if (typeof line === "string") continue;

			if (line.mdType === "inset" || line.mdType === "insetReadaloud") {
				const out = {
					type: line.mdType,
					name: line.name,
					entries: line.lines
				};
				if (!out.name || !out.name.trim()) delete out.name;
				buf[i] = out;
			}
		}
	}

	static _coalesceHeaders (buf) {
		const stack = [];

		const i = {_: 0};
		for (; i._ < buf.length; ++i._) {
			let line = buf[i._];

			if (typeof line !== "string") {
				if (!stack.length) continue;
				else {
					buf.splice(i._--, 1);

					stack.last().entries.push(line);
					continue;
				}
			} else line = line.trim();

			const mHashes = /^(#+) /.exec(line);
			const mInlineHeaderStars = /\*\*\*\s*([^.?!:]+[.?!:])\s*\*\*\*(.*)/.exec(line);
			const mInlineHeaderUnders = /___\s*([^.?!:]+[.?!:])\s*___(.*)/.exec(line);
			if (mHashes) {
				const name = line.replace(/^#+ /, "");
				const numHashes = line.length - (name.length + 1); // Add back one since we stripped a space
				switch (numHashes) {
					// # => "chapter" section, which should start a new section
					// ## => "regular" section, which should be embedded in a root section if possible
					case 1: this._coalesceHeaders_addBlock(buf, i, stack, -2, name); break;
					case 2: this._coalesceHeaders_addBlock(buf, i, stack, -1, name); break;
					// ### => l0 entries
					case 3: this._coalesceHeaders_addBlock(buf, i, stack, 0, name); break;
					// #### => l1 entries
					// ##### => l1 entries (TODO this should be something else? Is a bold small-caps header)
					case 4: this._coalesceHeaders_addBlock(buf, i, stack, 1, name); break;
					case 5: this._coalesceHeaders_addBlock(buf, i, stack, 1, name); break;
				}
			} else if (mInlineHeaderStars || mInlineHeaderUnders) {
				const mInline = mInlineHeaderStars || mInlineHeaderUnders;
				const name = mInline[1];
				const text = mInline[2];
				this._coalesceHeaders_addBlock(buf, i, stack, 2, name.replace(/[.?!:]\s*$/, ""));
				stack.last().entries.push(text);
			} else {
				if (!stack.length) continue;

				buf.splice(i._--, 1);
				stack.last().entries.push(line);
			}
		}
	}

	static _coalesceHeaders_getStackDepth (stack) {
		if (!stack.length) return null;

		let count = 0;
		let start = 0;
		for (let i = stack.length - 1; i >= 0; --i) {
			const ent = stack[i];
			if (ent.type === "section") {
				start = -1;
				break;
			} else {
				count++;
			}
		}

		return start + count;
	}

	static _coalesceHeaders_addBlock (buf, i, stack, depth, name) {
		const targetDepth = depth === -2 ? -1 : depth;

		const curDepth = this._coalesceHeaders_getStackDepth(stack);
		if (curDepth == null || depth === -2) { // -2 = new root section
			// If we're adding a new chapter, clear the stack
			while (stack.length) stack.pop();

			buf[i._] = this._coalesceHeaders_getRoot(stack, depth);
			if (depth <= 0) stack.last().name = name;
			else this._coalesceHeaders_handleTooShallow(stack, targetDepth, name);
		} else {
			if (curDepth === targetDepth) {
				this._coalesceHeaders_handleEqual(buf, i, stack, depth, targetDepth, name);
			} else if (curDepth < targetDepth) {
				buf.splice(i._--, 1);
				this._coalesceHeaders_handleTooShallow(stack, targetDepth, name);
			} else if (curDepth > targetDepth) {
				this._coalesceHeaders_handleTooDeep(buf, i, stack, depth, targetDepth, name);
			}
		}
	}

	static _coalesceHeaders_getRoot (stack, depth) {
		const root = {type: depth < 0 ? "section" : "entries", name: "", entries: []};
		stack.push(root);
		return root;
	}

	static _coalesceHeaders_handleEqual (buf, i, stack, depth, targetDepth, name) {
		if (stack.length > 1) stack.pop();
		else if (targetDepth !== -1) {
			// If we only have a root, and encounter an entry at the same level as our root, we need to turn the root into a section
			const nuRoot = {
				type: "section",
				entries: [
					stack[0]
				]
			};
			const ixRoot = buf.indexOf(stack[0]);
			if (~ixRoot) throw new Error(`Could not find root in buffer!`);
			buf[ixRoot] = nuRoot;
			stack.pop();
			stack.push(nuRoot);
		}

		if (stack.length) {
			buf.splice(i._--, 1);
			const nxtBlock = {type: depth < 0 ? "section" : "entries", name, entries: []};
			stack.last().entries.push(nxtBlock);
			stack.push(nxtBlock);
		} else {
			buf[i._] = this._coalesceHeaders_getRoot(stack, depth);
			stack.last().name = name;
		}
	}

	static _coalesceHeaders_handleTooShallow (stack, targetDepth, name) {
		while (this._coalesceHeaders_getStackDepth(stack) < targetDepth) {
			const nxt = {type: "entries", name: "", entries: []};
			stack.last().entries.push(nxt);
			stack.push(nxt);
		}
		stack.last().name = name;
	}

	static _coalesceHeaders_handleTooDeep (buf, i, stack, depth, targetDepth, name) {
		// Protect the first entry on the stack
		while (this._coalesceHeaders_getStackDepth(stack) > targetDepth && stack.length > 1) stack.pop();
		this._coalesceHeaders_handleEqual(buf, i, stack, depth, targetDepth, name);
	}

	static _convertInlineStyling (buf) {
		const handlers = {
			object: (ident, obj) => {
				for (const meta of Renderer.ENTRIES_WITH_CHILDREN) {
					if (obj.type !== meta.type) continue;
					if (!obj[meta.key]) continue;

					obj[meta.key] = obj[meta.key].map(ent => {
						if (typeof ent !== "string") return ent;

						// Handle "emphasis" markers (*italic*/**bold**/***bold+italic***)
						ent = ent.replace(/(\*+)(.+?)(\*+)|(_+)(.+?)(_+)/g, (...m) => {
							const [open, text, close] = m[1] ? [m[1], m[2], m[3]] : [m[4], m[5], m[6]];

							const minLen = Math.min(open.length, close.length);
							const cleanOpen = open.slice(minLen);
							const cleanClose = close.slice(minLen);

							if (minLen === 1) return `{@i ${cleanOpen}${text}${cleanClose}}`;
							else if (minLen === 2) return `{@b ${cleanOpen}${text}${cleanClose}}`;
							else return `{@b {@i ${cleanOpen}${text}${cleanClose}}}`;
						});

						// Strikethrough
						ent = ent.replace(/~~(.+?)~~/g, (...m) => `{@s ${m[1]}}`);

						// Links (basic inline only)
						ent = ent.replace(/\[(.+?)]\((.+?)\)/g, (...m) => `{@link ${m[1]}|${m[2]}}`);

						return ent;
					});
				}
				return obj;
			}
		};
		const nxtBuf = MiscUtil.getWalker().walk("convertInlineStyling", buf, handlers);
		while (buf.length) buf.pop();
		buf.push(...nxtBuf);
	}

	static _cleanEmptyLines (buf) {
		const handlersDoTrim = {
			array: (ident, arr) => arr.map(it => typeof it === "string" ? it.trim() : it)
		};
		const nxtBufTrim = MiscUtil.getWalker().walk("cleanEmptyLines", buf, handlersDoTrim);
		while (buf.length) buf.pop();
		buf.push(...nxtBufTrim);

		const handlersRmEmpty = {
			array: (ident, arr) => arr.filter(it => it && (typeof it !== "string" || it.trim()))
		};
		const nxtBufRmEmpty = MiscUtil.getWalker().walk("cleanEmptyLines", buf, handlersRmEmpty);
		while (buf.length) buf.pop();
		buf.push(...nxtBufRmEmpty);
	}

	static _cleanEntries (buf) {
		function recursiveClean (obj) {
			if (typeof obj === "object") {
				if (obj instanceof Array) {
					obj.forEach(x => recursiveClean(x));
				} else {
					if ((obj.type === "section" || obj.type === "entries") && obj.name != null && !obj.name.trim()) delete obj.name;
					if (obj.entries && !obj.entries.length) delete obj.entries;

					Object.values(obj).forEach(v => recursiveClean(v));
				}
			}
		}

		recursiveClean(buf);
	}

	// region Table Conversion
	static getConvertedTable (lines, caption) {
		// trim leading/trailing pipes if they're uniformly present
		const contentLines = lines.filter(l => l && l.trim());
		if (contentLines.every(l => l.trim().startsWith("|"))) lines = lines.map(l => l.replace(/^\s*\|(.*?)$/, "$1"));
		if (contentLines.every(l => l.trim().endsWith("|"))) lines = lines.map(l => l.replace(/^(.*?)\|\s*$/, "$1"));

		const tbl = {
			type: "table",
			caption,
			colLabels: [],
			colStyles: [],
			rows: []
		};

		let seenHeaderBreak = false;
		let alignment = [];
		lines.map(l => l.trim()).filter(Boolean).forEach(l => {
			const cells = l.split("|").map(it => it.trim());
			if (cells.length) {
				if (cells.every(c => !c || !!/^:?\s*---+\s*:?$/.exec(c))) { // a header break
					alignment = cells.map(c => {
						if (c.startsWith(":") && c.endsWith(":")) {
							return "text-center";
						} else if (c.startsWith(":")) {
							return "text-align-left";
						} else if (c.endsWith(":")) {
							return "text-right";
						} else {
							return "";
						}
					});
					seenHeaderBreak = true;
				} else if (seenHeaderBreak) {
					tbl.rows.push(cells);
				} else {
					tbl.colLabels = cells;
				}
			}
		});

		tbl.colStyles = alignment;
		this.postProcessTable(tbl);
		return tbl;
	}

	/**
	 * @param tbl The table to process.
	 * @param [opts] Options object. Defaults assume statblock parsing.
	 * @param [opts.isSkipDiceTag] If dice tagging should be skipped. Default false.
	 * @param [opts.tableWidth] The table width, in characters. 80 is good for statblocks, 150 is good for books.
	 * @param [opts.diceColWidth] The width (in 12ths) of any leading rollable dice column. 1 for statblocks, 2 for books.
	 */
	static postProcessTable (tbl, opts) {
		opts = opts || {};
		opts.tableWidth = opts.tableWidth || 80;
		opts.diceColWidth = opts.diceColWidth || 1;

		// Post-processing
		(function normalizeCellCounts () {
			// pad all rows to max width
			const maxWidth = Math.max(tbl.colLabels, ...tbl.rows.map(it => it.length));
			tbl.rows.forEach(row => {
				while (row.length < maxWidth) row.push("");
			});
		})();

		let isDiceCol0 = true;
		(function doCheckDiceOrNumericCol0 () {
			// check if first column is all strictly number-like
			tbl.rows.forEach(r => {
				if (!/^[-+*/×÷x^.,0-9$]+/i.exec((r[0] || "").trim())) return isDiceCol0 = false;
			});
		})();

		(function doCalculateWidths () {
			const BASE_CHAR_CAP = opts.tableWidth; // assume tables are approx 80 characters wide

			// Get the average/max width of each column
			let isAllBelowCap = true;
			const widthMeta = (() => {
				if (!tbl.rows.length) return null;

				const outAvgWidths = [...new Array(tbl.rows[0].length)].map(() => 0);
				// Include the headers in "max width" calculations
				const outMaxWidths = [...new Array(tbl.rows[0].length)].map((_, i) => tbl.colLabels[i] ? tbl.colLabels[i].length : 0);

				tbl.rows.forEach(r => {
					r.forEach((cell, i) => {
						if (cell.length > BASE_CHAR_CAP) isAllBelowCap = false;
						outAvgWidths[i] += Math.min(BASE_CHAR_CAP, cell.length);
						outMaxWidths[i] = Math.max(outMaxWidths[i], cell.length);
					});
				});

				return {
					avgWidths: outAvgWidths.map(it => it / tbl.rows.length),
					maxWidths: outMaxWidths
				};
			})();

			if (widthMeta == null) return;
			const {avgWidths, maxWidths} = widthMeta;

			// If we have a relatively sparse table, give each column enough to fit its max
			const assignColWidths = (widths) => {
				// Reserve some space for the dice column, if we have one
				const splitInto = isDiceCol0 ? 12 - opts.diceColWidth : 12;
				if (isDiceCol0) widths = widths.slice(1);

				const totalWidths = widths.reduce((a, b) => a + b, 0);
				const redistributedWidths = (() => {
					const MIN = totalWidths / splitInto;
					const sorted = widths.map((it, i) => ({ix: i, val: it})).sort((a, b) => SortUtil.ascSort(a.val, b.val));

					for (let i = 0; i < sorted.length - 1; ++i) {
						const it = sorted[i];
						if (it.val < MIN) {
							const diff = MIN - it.val;
							sorted[i].val = MIN;
							const toSteal = diff / sorted.length - (i + 1);
							for (let j = i + 1; j < sorted.length; ++j) {
								sorted[j].val -= toSteal;
							}
						}
					}

					return sorted.sort((a, b) => SortUtil.ascSort(a.ix, b.ix)).map(it => it.val);
				})();

				let nmlxWidths = redistributedWidths.map(it => it / totalWidths);
				while (nmlxWidths.reduce((a, b) => a + b, 0) > 1) {
					const diff = 1 - nmlxWidths.reduce((a, b) => a + b, 0);
					nmlxWidths = nmlxWidths.map(it => it + diff / nmlxWidths.length);
				}
				const twelfthWidths = nmlxWidths.map(it => Math.round(it * splitInto));

				if (isDiceCol0) tbl.colStyles[0] = `col-${opts.diceColWidth}`;
				twelfthWidths.forEach((it, i) => {
					const widthPart = `col-${it}`;
					const iOffset = isDiceCol0 ? i + 1 : i;
					tbl.colStyles[iOffset] = tbl.colStyles[iOffset] ? `${tbl.colStyles[iOffset]} ${widthPart}` : widthPart;
				});
			};

			assignColWidths(isAllBelowCap ? maxWidths : avgWidths);
		})();

		if (isDiceCol0 && !tbl.colStyles.includes("text-center")) tbl.colStyles[0] += " text-center";

		if (opts.isSkipDiceTag !== true) {
			(function tagRowDice () {
				tbl.rows = tbl.rows.map(r => r.map(c => c.replace(RollerUtil.DICE_REGEX, `{@dice $&}`)));
			})();
		}

		(function doCheckNumericCols () {
			tbl.colStyles.forEach((col, i) => {
				if (col.includes("text-center") || col.includes("text-right")) return;

				const counts = {number: 0, text: 0};

				tbl.rows.forEach(r => {
					if (typeof r[i] !== "string") return counts.text++;
					const clean = r[i]
						.replace(/[.,]/g, "") // Remove number separators
						.replace(/(^| )(cp|sp|gp|pp|lb\.|ft\.)( |$)/g, "") // Remove units
						.trim();
					counts[isNaN(Number(clean)) ? "text" : "number"]++
				});

				// If most of the cells in this column contain number data, right-align
				// Unless it's the first column, in which case, center-align
				if ((counts.number / tbl.rows.length) >= 0.80) {
					if (i === 0) tbl.colStyles[i] += ` text-center`;
					else tbl.colStyles[i] += ` text-right`
				}
			});
		})();

		// If there are columns which have a limited number of words, center these
		let isFewWordsCol1 = false;
		(function doCheckFewWordsCols () {
			// Do this in reverse order, as the style of the first column depends on the others
			for (let i = tbl.colStyles.length - 1; i >= 0; --i) {
				const col = tbl.colStyles[i];

				// If we're the first column and other columns are not center-aligned, don't center
				if (i === 0 && tbl.colStyles.length > 1 && tbl.colStyles.filter((_, i) => i !== 0).some(it => !it.includes("text-center"))) continue;

				const counts = {short: 0, long: 0};

				tbl.rows.forEach(r => {
					if (typeof r[i] !== "string") return counts.long++;
					const words = r[i].split(" ");
					counts[words.length <= 3 ? "short" : "long"]++
				});

				// If most of the cells in this column contain short text, center-align
				if ((counts.short / tbl.rows.length) >= 0.80) {
					if (i === 1) isFewWordsCol1 = true;
					if (col.includes("text-center") || col.includes("text-right")) continue;
					tbl.colStyles[i] += ` text-center`;
				}
			}
		})();

		this._doCleanTable(tbl);

		(function doEvenCenteredColumns () {
			if (!isDiceCol0) return;
			if (tbl.colStyles.length === 2 && isFewWordsCol1) {
				tbl.colStyles = ["col-6 text-center", "col-6 text-center"]
			}
		})();
	}

	static _doCleanTable (tbl) {
		if (!tbl.caption) delete tbl.caption;
		if (tbl.colLabels && !tbl.colLabels.some(Boolean)) delete tbl.colLabels;
		if (tbl.colStyles && !tbl.colStyles.some(Boolean)) delete tbl.colStyles;
	}
	// endregion
}

if (typeof module !== "undefined") {
	module.exports = {
		RendererMarkdown,
		MarkdownConverter
	}
}
