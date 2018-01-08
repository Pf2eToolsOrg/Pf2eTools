// ************************************************************************* //
// Strict mode should not be used, as the roll20 script depends on this file //
// ************************************************************************* //

// ENTRY RENDERING =====================================================================================================
/*
 * // EXAMPLE USAGE //
 *
 * const entryRenderer = new EntryRenderer();
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
function EntryRenderer () {
	this.wrapperTag = "div";
	this.baseUrl = "";

	this._subVariant = false;

	/**
	 * Set the tag used to group rendered elements
	 * @param tag to use
	 */
	this.setWrapperTag = function (tag) {
		this.wrapperTag = tag;
	};

	/**
	 * Set the base url for rendered links.
	 * Usage: `renderer.setBaseUrl("https://www.cool.site/")` (note the "http" prefix and "/" suffix)
	 * @param url to use
	 */
	this.setBaseUrl = function (url) {
		this.baseUrl = url;
	};

	/**
	 * Recursively walk down a tree of "entry" JSON items, adding to a stack of strings to be finally rendered to the
	 * page. Note that this function does _not_ actually do the rendering, see the example code above for how to display
	 * the result.
	 *
	 * @param entry An "entry" usually defined in JSON. A schema is available in tests/schema
	 * @param textStack A reference to an array, which will hold all our strings as we recurse
	 * @param depth The current recursion depth. Optional; default 0, or -1 for type "section" entries
	 * @param prefix The (optional) prefix to be added to the textStack before whatever is added by the current call
	 * @param suffix The (optional) suffix to be added to the textStack after whatever is added by the current call
	 * @param forcePrefixSuffix force the prefix and suffix to be added (useful for the first call from external code)
	 */
	this.recursiveEntryRender = function (entry, textStack, depth, prefix, suffix, forcePrefixSuffix) {
		depth = depth === undefined || depth === null ? entry.type === "section" ? -1 : 0 : depth;
		prefix = prefix === undefined || prefix === null ? null : prefix;
		suffix = suffix === undefined || suffix === null ? null : suffix;
		forcePrefixSuffix = forcePrefixSuffix === undefined || forcePrefixSuffix === null ? false : forcePrefixSuffix;

		if (forcePrefixSuffix) renderPrefix();
		if (typeof entry === "object") {
			// the root entry (e.g. "Rage" in barbarian "classFeatures") is assumed to be of type "entries"
			const type = entry.type === undefined || entry.type === "section" ? "entries" : entry.type;
			switch (type) {
				// TODO add an "insert box" type

				// recursive
				case "entries":
					handleEntries(this);
					break;
				case "options":
					handleOptions(this);
					break;
				case "list":
					if (entry.items) {
						if (entry.name) textStack.push(`<p class="list-name">${entry.name}</p>`);
						textStack.push(`<ul ${entry.style ? `class="${entry.style}"` : ""}>`);
						for (let i = 0; i < entry.items.length; i++) {
							this.recursiveEntryRender(entry.items[i], textStack, depth + 1, `<li ${isNonstandardSource(entry.items[i].source) ? `class="${CLSS_NON_STANDARD_SOURCE}"` : ""}>`, "</li>");
						}
						textStack.push("</ul>");
					}
					break;
				case "table":
					renderTable(this);
					break;
				case "inset":
					textStack.push(`<${this.wrapperTag} class="statsBlockInset">`);
					if (typeof entry.name !== 'undefined') textStack.push(`<span class="entry-title">${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, "<p>", "</p>");
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "insetReadaloud":
					textStack.push(`<${this.wrapperTag} class="statsBlockInsetReadaloud">`);
					if (typeof entry.name !== 'undefined') textStack.push(`<span class="entry-title">${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, "<p>", "</p>");
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "variant":
					textStack.push(`<${this.wrapperTag} class="statsBlockInset">`);
					textStack.push(`<span class="entry-title">Variant: ${entry.name}</span>`);
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, 2, "<p>", "</p>");
					}
					textStack.push(`</${this.wrapperTag}>`);
					break;
				case "variantSub": {
					// pretend this is an inline-header'd entry, but set a flag so we know not to add bold
					this._subVariant = true;
					const fauxEntry = entry;
					fauxEntry.type = "entries";
					this.recursiveEntryRender(fauxEntry, textStack, 2, "<p>", "</p>");
					this._subVariant = false;
					break;
				}

				case "invocation":
					handleInvocation(this);
					break;
				case "patron":
					handlePatron(this);
					break;

				// block
				case "abilityDc":
					renderPrefix();
					textStack.push(`<span class='ability-block'><span>${entry.name} save DC</span> = 8 + your proficiency bonus + your ${utils_makeAttChoose(entry.attributes)}</span>`);
					renderSuffix();
					break;
				case "abilityAttackMod":
					renderPrefix();
					textStack.push(`<span class='ability-block'><span>${entry.name} attack modifier</span> = your proficiency bonus + your ${utils_makeAttChoose(entry.attributes)}</span>`);
					renderSuffix();
					break;
				case "abilityGeneric":
					renderPrefix();
					textStack.push(`<span class='ability-block'><span>${entry.name}</span> = ${entry.text} ${utils_makeAttChoose(entry.attributes)}</span>`);
					renderSuffix();
					break;

				// inline
				case "inline":
					if (entry.entries) {
						for (let i = 0; i < entry.entries.length; i++) {
							this.recursiveEntryRender(entry.entries[i], textStack, depth);
						}
					}
					break;
				case "bonus":
					textStack.push((entry.value < 0 ? "" : "+") + entry.value);
					break;
				case "bonusSpeed":
					textStack.push((entry.value < 0 ? "" : "+") + entry.value + "ft.");
					break;
				case "dice":
					textStack.push(EntryRenderer.getEntryDice(entry));
					break;
				case "link":
					renderLink(this, entry);
					break;

				// list items
				case "item":
					renderPrefix();
					this.recursiveEntryRender(entry.entry, textStack, depth, `<p><span class="bold">${entry.name}</span> `, "</p>");
					renderSuffix();
					break;

				// images
				case "image": {
					renderPrefix();
					if (entry.title) textStack.push(`<div class="img-title">${entry.title}</div>`);
					let href;
					if (entry.href.type === "internal") {
						const imgPart = `img/${entry.href.path}`;
						href = this.baseUrl === "" ? `${this.baseUrl}${imgPart}` : UrlUtil.link(imgPart);
					}
					textStack.push(`
						<div class="img-wrapper">
						<a href="${href}" target='_blank' ${entry.title ? `title="${entry.title}"` : ""}>
							<img src="${href}" onload="EntryRenderer._onImgLoad()">
						</a>
						</div>
					`);
					renderSuffix();
					break;
				}
			}
		} else if (typeof entry === "string") { // block
			renderPrefix();
			renderString(this);
			renderSuffix();
		} else { // block
			// for ints or any other types which do not require specific rendering
			renderPrefix();
			textStack.push(entry);
			renderSuffix();
		}
		if (forcePrefixSuffix) renderSuffix();

		function renderPrefix () {
			if (prefix !== null) {
				textStack.push(prefix);
			}
		}

		function renderSuffix () {
			if (suffix !== null) {
				textStack.push(suffix);
			}
		}

		function renderTable (self) {
			// TODO add handling for rowLabel property

			textStack.push("<table>");

			if (entry.caption !== undefined) {
				textStack.push(`<caption>${entry.caption}</caption>`);
			}
			textStack.push("<thead>");
			textStack.push("<tr>");

			if (entry.colLabels) {
				for (let i = 0; i < entry.colLabels.length; ++i) {
					textStack.push(`<th ${getTableThClassText(i)}>${entry.colLabels[i]}</th>`);
				}
			}

			textStack.push("</tr>");
			textStack.push("</thead>");
			textStack.push("<tbody>");

			for (let i = 0; i < entry.rows.length; ++i) {
				textStack.push("<tr>");
				for (let j = 0; j < entry.rows[i].length; ++j) {
					textStack.push(`<td ${makeTableTdClassText(j)}>`);
					self.recursiveEntryRender(entry.rows[i][j], textStack, depth + 1);
					textStack.push("</td>");
				}
				textStack.push("</tr>");
			}

			textStack.push("</tbody>");
			if (entry.footnotes !== undefined) {
				textStack.push("<tfoot>");
				for (let i = 0; i < entry.footnotes.length; ++i) {
					textStack.push(`<tr><td colspan="99">`);
					self.recursiveEntryRender(entry.footnotes[i], textStack, depth + 1);
					textStack.push("</td></tr>");
				}
				textStack.push("</tfoot>");
			}
			textStack.push("</table>");

			function getTableThClassText (i) {
				return entry.colStyles === undefined || i >= entry.colStyles.length ? "" : `class="${entry.colStyles[i]}"`;
			}

			function makeTableTdClassText (i) {
				if (entry.rowStyles !== undefined) {
					return entry.rowStyles === undefined || i >= entry.rowStyles.length ? "" : `class="${entry.rowStyles[i]}"`;
				} else {
					return getTableThClassText(i);
				}
			}
		}

		function handleEntries (self) {
			handleEntriesOptionsInvocationPatron(self, true);
		}

		function handleOptions (self) {
			if (entry.entries) {
				entry.entries = entry.entries.sort((a, b) => a.name && b.name ? ascSort(a.name, b.name) : a.name ? -1 : b.name ? 1 : 0);
				handleEntriesOptionsInvocationPatron(self, false);
			}
		}

		function handleInvocation (self) {
			handleEntriesOptionsInvocationPatron(self, true);
		}

		function handlePatron (self) {
			handleEntriesOptionsInvocationPatron(self, false);
		}

		function handleEntriesOptionsInvocationPatron (self, incDepth) {
			const inlineTitle = depth >= 2;
			const nextDepth = incDepth ? depth + 1 : depth;
			const styleString = getStyleString();
			const dataString = getDataString();
			const preReqText = getPreReqText();
			const headerSpan = entry.name !== undefined ? `<span class="entry-title">${entry.name}${inlineTitle ? "." : ""}</span> ` : "";

			if (entry.entries || entry.name) {
				textStack.push(`<${self.wrapperTag} ${dataString} ${styleString}>${headerSpan}${preReqText}`);
				if (entry.entries) {
					for (let i = 0; i < entry.entries.length; i++) {
						self.recursiveEntryRender(entry.entries[i], textStack, nextDepth, "<p>", "</p>");
					}
				}
				textStack.push(`</${self.wrapperTag}>`);
			}

			function getStyleString () {
				const styleClasses = [];
				if (isNonstandardSource(entry.source)) styleClasses.push(CLSS_NON_STANDARD_SOURCE);
				if (inlineTitle && entry.name !== undefined) {
					if (self._subVariant) styleClasses.push(EntryRenderer.HEAD_2_SUB_VARIANT);
					else styleClasses.push(EntryRenderer.HEAD_2);
				} else styleClasses.push(depth === -1 ? EntryRenderer.HEAD_NEG_1 : depth === 0 ? EntryRenderer.HEAD_0 : EntryRenderer.HEAD_1);
				if ((entry.type === "invocation" || entry.type === "patron") && entry.subclass !== undefined) styleClasses.push(CLSS_SUBCLASS_FEATURE);
				return styleClasses.length > 0 ? `class="${styleClasses.join(" ")}"` : "";
			}

			function getDataString () {
				let dataString = "";
				if (entry.type === "invocation" || entry.type === "patron") {
					const titleString = entry.source ? `title="Source: ${Parser.sourceJsonToFull(entry.source)}"` : "";
					if (entry.subclass !== undefined) dataString = `${ATB_DATA_SC}="${entry.subclass.name}" ${ATB_DATA_SRC}="${Parser._getSourceStringFromSource(entry.subclass.source)}" ${titleString}`;
					else dataString = `${ATB_DATA_SC}="${EntryRenderer.DATA_NONE}" ${ATB_DATA_SRC}="${EntryRenderer.DATA_NONE}" ${titleString}`;
				}
				return dataString;
			}

			function getPreReqText () {
				if (entry.prerequisite) return `<span class="prerequisite">Prerequisite: ${entry.prerequisite}</span>`;
				return "";
			}
		}

		function renderLink (self, entry) {
			function getHoverString () {
				if (!entry.href.hover) return "";
				return `onmouseover="EntryRenderer.hover.show(this, '${entry.href.hover.page}', '${entry.href.hover.source}', '${UrlUtil.encodeForHash(entry.href.hash)}')"`
			}

			let href;
			if (entry.href.type === "internal") {
				// baseURL is blank by default
				href = `${self.baseUrl}${entry.href.path}#`;
				if (entry.href.hash !== undefined) {
					href += UrlUtil.encodeForHash(entry.href.hash);
					if (entry.href.subhashes !== undefined) {
						for (let i = 0; i < entry.href.subhashes.length; i++) {
							const subHash = entry.href.subhashes[i];
							href += `,${UrlUtil.encodeForHash(subHash.key)}:${UrlUtil.encodeForHash(subHash.value)}`
						}
					}
				}
			} else if (entry.href.type === "external") {
				href = entry.href.url;
			}
			textStack.push(`<a href="${href}" target="_blank" ${getHoverString()}>${entry.text}</a>`);
		}

		function renderString (self) {
			const tagSplit = splitByTags();
			for (let i = 0; i < tagSplit.length; i++) {
				const s = tagSplit[i];
				if (s === undefined || s === null || s === "") continue;
				if (s.charAt(0) === "@") {
					const [tag, text] = splitFirstSpace(s);

					if (tag === "@bold" || tag === "@b" || tag === "@italic" || tag === "@i" || tag === "@skill" || tag === "@action" || tag === "@link") { // FIXME remove "@link"
						switch (tag) {
							// FIXME remove "@link"
							case "@link":
								textStack.push(`<u>`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</u>`);
								break;

							case "@b":
							case "@bold":
								textStack.push(`<b>`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</b>`);
								break;
							case "@i":
							case "@italic":
								textStack.push(`<i>`);
								self.recursiveEntryRender(text, textStack, depth);
								textStack.push(`</i>`);
								break;
							case "@action": // Convert this to a tag once the rules data are more navigable
								textStack.push(`<span title="${Parser.actionToExplanation(text)}" class="explanation">${text}</span>`);
								break;
							case "@skill": // Convert this to a tag once the rules data are more navigable
								textStack.push(`<span title="${Parser.skillToExplanation(text)}" class="explanation">${text}</span>`);
								break;
						}
					} else if (tag === "@dice" || tag === "@hit") {
						const fauxEntry = {
							type: "dice",
							rollable: true
						};

						switch (tag) {
							case "@dice": {
								// format: {@dice 1d2+3+4d5-6} // TODO do we need to handle e.g. 4d6+1-1d4+2 (negative dice exp)?
								const spl = text.toLowerCase().replace(/\s/g, "").split(/[+-]/g).map(s => s.trim());
								// recombine modifiers
								const toRoll = [];
								for (let i = 0; i < spl.length; ++i) {
									const it = spl[i];
									if (it.includes("d")) {
										const m = /^(\d+)d(\d+)$/.exec(it);
										toRoll.push({
											number: Number(m[1]),
											faces: Number(m[2]),
											modifier: 0,
											hideModifier: true
										});
									} else {
										toRoll[toRoll.length - 1].modifier += Number(it);
										toRoll[toRoll.length - 1].hideModifier = false;
									}
								}

								fauxEntry.toRoll = toRoll;
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							}
							case "@hit": {
								// format: {@hit +1} or {@hit -2}
								fauxEntry.toRoll = [
									{
										number: 1,
										faces: 20,
										modifier: Number(text),
										hideDice: true
									}
								];
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							}
						}
					} else {
						const [name, source, displayText, ...others] = text.split("|");
						const hash = `${name}${source ? `${HASH_LIST_SEP}${source}` : ""}`;

						const fauxEntry = {
							type: "link",
							href: {
								type: "internal",
								hash: hash
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
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@item":
								fauxEntry.href.path = "items.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_DMG;
								fauxEntry.href.hover = {
									page: UrlUtil.PG_ITEMS,
									source: source || SRC_DMG
								};
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@class": {
								if (others.length) {
									fauxEntry.href.subhashes = [{"key": "sub", "value": others[0].trim() + "~phb"}] // TODO pass this in
								}
								fauxEntry.href.path = "classes.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_PHB;
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							}
							case "@creature":
								fauxEntry.href.path = "bestiary.html";
								if (!source) fauxEntry.href.hash += HASH_LIST_SEP + SRC_MM;
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@condition":
								fauxEntry.href.path = "conditions.html";
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@background":
								fauxEntry.href.path = "backgrounds.html";
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
						}
					}
				} else {
					textStack.push(s);
				}
			}

			function splitFirstSpace (string) {
				return [
					string.substr(0, string.indexOf(' ')),
					string.substr(string.indexOf(' ') + 1)
				]
			}

			function splitByTags () {
				let tagDepth = 0;
				let inTag = false;
				let char, char2;
				const out = [];
				let curStr = "";
				for (let i = 0; i < entry.length; ++i) {
					char = entry.charAt(i);
					char2 = i < entry.length - 1 ? entry.charAt(i + 1) : null;

					switch (char) {
						case "{":
							if (char2 === "@") {
								if (tagDepth++ > 0) {
									curStr += char;
								} else {
									out.push(curStr);
									inTag = false;
									curStr = "";
								}
							} else {
								curStr += char;
							}
							break;
						case "}":
							if (--tagDepth === 0) {
								out.push(curStr);
								curStr = "";
							} else {
								curStr += char;
							}
							break;
						default:
							curStr += char;
					}
				}
				if (curStr.length > 0) out.push(curStr);

				return out;
			}
		}
	};
}

EntryRenderer._rollerClick = function (ele, toRoll) {
	const $ele = $(ele);
	const total = toRoll.map(d => droll.roll(EntryRenderer._getDiceString(d, true)).total).reduce((a, b) => a + b);
	if ($ele.data("rolled")) {
		$ele.html(`${$ele.html().split("=")[0].trim()} = ${total}`);
	} else {
		$ele.data("rolled", true);
		$ele.html(`${$ele.html()} = ${total}`);
	}
};

EntryRenderer._getDiceString = function (diceItem, isDroll) {
	return `${!diceItem.hideDice || isDroll ? `${diceItem.number}d${diceItem.faces}` : ""}${!diceItem.hideModifier && diceItem.modifier !== undefined ? `${diceItem.modifier >= 0 ? "+" : ""}${diceItem.modifier}` : ""}`;
};

EntryRenderer.getEntryDice = function (entry) {
	function getDiceAsStr () {
		const stack = [];
		entry.toRoll.forEach(d => stack.push(EntryRenderer._getDiceString(d)));
		return stack.join("+");
	}

	// TODO make droll integration optional
	if (typeof droll !== "undefined" && entry.rollable === true) {
		// TODO output this somewhere nice
		// TODO make this less revolting

		// TODO output to small tooltip-stype bubble? Close on mouseout
		return `<span class='roller unselectable' onclick='EntryRenderer._rollerClick(this, ${JSON.stringify(entry.toRoll)})'>${getDiceAsStr()}</span>`;
	} else {
		return getDiceAsStr();
	}
};

EntryRenderer.feat = {
	getPrerequisiteText: function (prereqList, isShorthand, doMakeAsArray) {
		isShorthand = isShorthand === undefined || isShorthand === null ? false : isShorthand;
		doMakeAsArray = doMakeAsArray === undefined || doMakeAsArray === null ? false : doMakeAsArray;
		const outStack = [];
		if (prereqList === undefined || prereqList === null) return "";
		for (let i = 0; i < prereqList.length; ++i) {
			const pre = prereqList[i];
			if (pre.race !== undefined) {
				for (let j = 0; j < pre.race.length; ++j) {
					if (isShorthand) {
						const DASH = "-";
						const raceNameParts = pre.race[j].name.split(DASH);
						let raceName = [];
						for (let k = 0; k < raceNameParts.length; ++k) {
							raceName.push(raceNameParts[k].uppercaseFirst());
						}
						raceName = raceName.join(DASH);
						outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
					} else {
						const raceName = j === 0 ? pre.race[j].name.uppercaseFirst() : pre.race[j].name;
						outStack.push(raceName + (pre.race[j].subrace !== undefined ? " (" + pre.race[j].subrace + ")" : ""))
					}
				}
			}
			if (pre.ability !== undefined) {
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
			if (pre.proficiency !== undefined) {
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
		}
		if (doMakeAsArray) {
			return outStack;
		} else {
			if (isShorthand) return outStack.join("/");
			else return StrUtil.joinPhraseArray(outStack, ", ", " or ");
		}
	},

	mergeAbilityIncrease: function (feat) {
		const entries = feat.entries;
		const abilityObj = feat.ability;
		if (!abilityObj || feat._hasMergedAbility) return;
		feat._hasMergedAbility = true;
		entries.find(e => e.type === "list").items.unshift(abilityObjToListItem());

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
						const abbChoicesText = StrUtil.joinPhraseArray(abbChoices, ", ", " or ");
						abbArr.push(`Increase your ${abbChoicesText} by ${amount}${TO_MAX_OF_TWENTY}`);
					}
				}
			}
			return abbArr.join(" ");
		}
	}
};

EntryRenderer.spell = {
	getCompactRenderedString: function (spell) {
		if (!this.renderer) {
			this.renderer = new EntryRenderer();
		}
		let renderer = this.renderer;

		const renderStack = [];

		renderStack.push(`
			<tr><th class="name" colspan="6">
				<span class="stats-name">${spell.name}</span>
				<span class="stats-source source${spell.source}" title="${Parser.sourceJsonToFull(spell.source)}">
					${Parser.sourceJsonToAbv(spell.source)}${spell.page ? ` p${spell.page}` : ""}
				</span>
			</th></tr>
			<tr><td colspan="6">
				<table class="summary">
					<tr>
						<th colspan="1">Level</th>
						<th colspan="1">School</th>
						<th colspan="2">Casting Time</th>
						<th colspan="2">Range</th>
					</tr>	
					<tr>
						<td colspan="1">${Parser.spLevelToFull(spell.level)}${Parser.spMetaToFull(spell.meta)}</td>
						<td colspan="1">${Parser.spSchoolAbvToFull(spell.school)}</td>
						<td colspan="2">${Parser.spTimeListToFull(spell.time)}</td>
						<td colspan="2">${Parser.spRangeToFull(spell.range)}</td>
					</tr>
					<tr>
						<th colspan="4">Components</th>
						<th colspan="2">Duration</th>
					</tr>	
					<tr>
						<td colspan="4">${Parser.spComponentsToFull(spell.components)}</td>
						<td colspan="2">${Parser.spDurationToFull(spell.duration)}</td>
					</tr>
				</table>
			</td></tr>
		`);

		renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
		const entryList = {type: "entries", entries: spell.entries};
		renderer.recursiveEntryRender(entryList, renderStack, 1);
		if (spell.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
			renderer.recursiveEntryRender(higherLevelsEntryList, renderStack, 2);
		}
		renderStack.push(`</td></tr>`);

		return renderStack.join("");
	},

	getRenderedString: function (spell, renderer) {
		const renderStack = [];
		const sourceFull = Parser.sourceJsonToFull(spell.source);

		renderStack.push(`
			<tr><th class="border" colspan="6"></th></tr>
			<tr><th class="name" colspan="6"><span class="stats-name">${spell.name}</span><span class="stats-source source${spell.source}" title="${sourceFull}">${Parser.sourceJsonToAbv(spell.source)}</span></th></tr>
			<tr><td class="levelschoolritual" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(spell.level, spell.school, spell.meta)}</span></td></tr>
			<tr><td class="castingtime" colspan="6"><span class="bold">Casting Time: </span>${Parser.spTimeListToFull(spell.time)}</td></tr>
			<tr><td class="range" colspan="6"><span class="bold">Range: </span>${Parser.spRangeToFull(spell.range)}</td></tr>
			<tr><td class="components" colspan="6"><span class="bold">Components: </span>${Parser.spComponentsToFull(spell.components)}</td></tr>
			<tr><td class="range" colspan="6"><span class="bold">Duration: </span>${Parser.spDurationToFull(spell.duration)}</td></tr>
			<tr><td class="divider" colspan="6"><div></div></td></tr>
		`);

		const entryList = {type: "entries", entries: spell.entries};
		renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);
		renderer.recursiveEntryRender(entryList, renderStack, 1);
		if (spell.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: spell.entriesHigherLevel};
			renderer.recursiveEntryRender(higherLevelsEntryList, renderStack, 2);
		}
		renderStack.push(`</td></tr>`);

		renderStack.push(`<tr class="text"><td class="classes" colspan="6"><span class="bold">Classes: </span>${Parser.spMainClassesToFull(spell.classes)}</td></tr>`);

		if (spell.classes.fromSubclass) {
			const currentAndLegacy = Parser.spSubclassesToCurrentAndLegacyFull(spell.classes);
			renderStack.push(`<tr class="text"><td colspan="6"><span class="bold">Subclasses: </span>${currentAndLegacy[0]}</td></tr>`);
			if (currentAndLegacy[1]) {
				renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted"><span class="bold">Subclasses (legacy): </span>${currentAndLegacy[1]}</section></td></tr>`);
			}
		}

		if (spell.scrollNote) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
			renderer.recursiveEntryRender(
				`{@italic Note: Both the {@class ${STR_FIGHTER} (${STR_ELD_KNIGHT})} and the {@class ${STR_ROGUE} (${STR_ARC_TCKER})} spell lists include all {@class ${STR_WIZARD}} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`
				, renderStack, 2);
			renderStack.push(`</section></td></tr>`);
		}

		renderStack.push(`
			<td colspan=6><b>Source: </b> <i>${sourceFull}</i>, page ${spell.page}</td>
			<tr><th class="border" colspan="6"></th></tr>
		`);

		return renderStack.join("");
	}
};

EntryRenderer.item = {
	getDamageAndPropertiesText: function (item) {
		const type = item.type || "";
		let damage = "";
		let damageType = "";
		if (item.weaponCategory) {
			if (item.dmg1) damage = utils_makeRoller(item.dmg1);
			if (item.dmgType) damageType = Parser.dmgTypeToFull(item.dmgType);
		} else if (type === "LA" || type === "MA" || type === "HA") {
			damage = "AC " + item.ac + (type === "LA" ? " + Dex" : type === "MA" ? " + Dex (max 2)" : "");
		} else if (type === "S") {
			damage = "AC +" + item.ac;
		} else if (type === "MNT" || type === "VEH") {
			const speed = item.speed;
			const capacity = item.carryingcapacity;
			if (speed) damage += "Speed=" + speed;
			if (speed && capacity) damage += type === "MNT" ? ", " : "<br>";
			if (capacity) {
				damage += "Carrying Capacity=" + capacity;
				if (capacity.indexOf("ton") === -1 && capacity.indexOf("passenger") === -1) damage += Number(capacity) === 1 ? " lb." : " lbs.";
			}
		}

		let propertiesTxt = "";
		if (item.property) {
			const properties = item.property.split(",");
			for (let i = 0; i < properties.length; i++) {
				const prop = properties[i];
				let a = item._propertyList[prop].name;
				if (prop === "V") a = `${a} (${utils_makeRoller(item.dmg2)})`;
				if (prop === "T" || prop === "A" || prop === "AF") a = `${a} (${item.range}ft.)`;
				if (prop === "RLD") a = `${a} (${item.reload} shots)`;
				a = (i > 0 ? ", " : item.dmg1 ? "- " : "") + a;
				propertiesTxt += a;
			}
		}
		return [damage, damageType, propertiesTxt];
	},

	getCompactRenderedString: function (item) {
		if (!this.renderer) {
			this.renderer = new EntryRenderer();
		}
		let renderer = this.renderer;

		const renderStack = [];

		renderStack.push(`<tr><th class="name" colspan="6"><span class="stats-name">${item.name}</span><span class="stats-source source${item.source}" title="${Parser.sourceJsonToFull(item.source)}">${Parser.sourceJsonToAbv(item.source)}${item.page ? ` p${item.page}` : ""}</span></th></tr>`);

		renderStack.push(`<tr><td class="typerarityattunement" colspan="6">${item.typeText}${`${item.tier ? `, ${item.tier}` : ""}${item.rarity ? `, ${item.rarity}` : ""}`} ${item.reqAttune || ""}</td>`);

		const [damage, damageType, propertiesTxt] = EntryRenderer.item.getDamageAndPropertiesText(item);
		renderStack.push(`<tr><td colspan="2">${item.value ? item.value + (item.weight ? ", " : "") : ""}${item.weight ? item.weight + (Number(item.weight) === 1 ? " lb." : " lbs.") : ""}</td><td class="damageproperties" colspan="4">${damage} ${damageType} ${propertiesTxt}</tr>`);

		renderStack.push(`<tr><td class="divider" colspan="6"><div></div></td></tr>`);

		renderStack.push(`<tr class='text'><td colspan='6' class='text'>`);

		// TODO rendering
		const entryList = {type: "entries", entries: item.entries};
		renderer.recursiveEntryRender(entryList, renderStack, 1);

		renderStack.push(`</td></tr>`);

		return renderStack.join(" ");
	},

	/**
	 * Runs callback with itemList as argument
	 * @param callback
	 */
	buildList: function (callback) {
		let itemList;
		let basicItemList;
		let variantList;
		const propertyList = {};
		const typeList = {};

		DataUtil.loadJSON("data/items.json", addBasicItems);

		function addBasicItems (itemData) {
			itemList = itemData.item;
			DataUtil.loadJSON("data/basicitems.json", addVariants);
		}

		function addVariants (basicItemData) {
			basicItemList = basicItemData.basicitem;
			const itemPropertyList = basicItemData.itemProperty;
			const itemTypeList = basicItemData.itemType;
			// Convert the property and type list JSONs into look-ups, i.e. use the abbreviation as a JSON property name
			for (let i = 0; i < itemPropertyList.length; i++) {
				propertyList[itemPropertyList[i].abbreviation] = itemPropertyList[i].name ? JSON.parse(JSON.stringify(itemPropertyList[i])) : {
					"name": itemPropertyList[i].entries[0].name.toLowerCase(),
					"entries": itemPropertyList[i].entries
				};
			}
			for (let i = 0; i < itemTypeList.length; i++) {
				typeList[itemTypeList[i].abbreviation] = itemTypeList[i].name ? JSON.parse(JSON.stringify(itemTypeList[i])) : {
					"name": itemTypeList[i].entries[0].name.toLowerCase(),
					"entries": itemTypeList[i].entries
				};
			}
			DataUtil.loadJSON("data/magicvariants.json", mergeBasicItems);
		}

		function mergeBasicItems (variantData) {
			variantList = variantData.variant;
			itemList = itemList.concat(basicItemList);
			for (let i = 0; i < variantList.length; i++) {
				variantList[i].tier = variantList[i].inherits.tier;
				variantList[i].rarity = variantList[i].inherits.rarity;
				variantList[i].source = variantList[i].inherits.source;
				variantList[i].page = variantList[i].inherits.page;
				if (!variantList[i].entries && variantList[i].inherits.entries) variantList[i].entries = JSON.parse(JSON.stringify(variantList[i].inherits.entries));
				if (variantList[i].requires.armor) variantList[i].armor = variantList[i].requires.armor;
				if (variantList[i].inherits.resist) variantList[i].resist = variantList[i].inherits.resist;
				if (variantList[i].inherits.reqAttune) variantList[i].reqAttune = variantList[i].inherits.reqAttune;
			}
			itemList = itemList.concat(variantList);
			for (let i = 0; i < basicItemList.length; i++) {
				const curBasicItem = basicItemList[i];
				basicItemList[i].category = "Basic";
				if (curBasicItem.entries === undefined) curBasicItem.entries = [];
				const curBasicItemName = curBasicItem.name.toLowerCase();
				for (let j = 0; j < variantList.length; j++) {
					const curVariant = variantList[j];
					const curRequires = curVariant.requires;
					let hasRequired = curBasicItemName.indexOf(" (") === -1;
					for (const requiredProperty in curRequires) if (curRequires.hasOwnProperty(requiredProperty) && curBasicItem[requiredProperty] !== curRequires[requiredProperty]) hasRequired = false;
					// hasRequired = hasRequired && Object.keys(curRequires).every(req => curBasicItem[req] === curRequires.requires[req]);
					if (curVariant.excludes) {
						const curExcludes = curVariant.excludes;
						for (const excludedProperty in curExcludes) if (curExcludes.hasOwnProperty(excludedProperty) && curBasicItem[excludedProperty] === curExcludes[excludedProperty]) hasRequired = false;
					}
					if (hasRequired) {
						const curInherits = curVariant.inherits;
						const tmpBasicItem = JSON.parse(JSON.stringify(curBasicItem));
						delete tmpBasicItem.value; // Magic items do not inherit the value of the non-magical item
						tmpBasicItem.category = "Specific Variant";
						for (const inheritedProperty in curInherits) {
							if (curInherits.hasOwnProperty(inheritedProperty)) {
								if (inheritedProperty === "namePrefix") {
									tmpBasicItem.name = curInherits.namePrefix + tmpBasicItem.name;
								} else if (inheritedProperty === "nameSuffix") {
									tmpBasicItem.name += curInherits.nameSuffix;
								} else if (inheritedProperty === "entries") {
									for (let k = curInherits.entries.length - 1; k > -1; k--) {
										let tmpText = curInherits.entries[k];
										if (typeof tmpText === "string") {
											if (tmpBasicItem.dmgType) tmpText = tmpText.replace(/{@dmgType}/g, Parser.dmgTypeToFull(tmpBasicItem.dmgType));
											if (curInherits.genericBonus) tmpText = tmpText.replace(/{@genericBonus}/g, curInherits.genericBonus);
											if (tmpText.indexOf("{@lowerName}") !== -1) tmpText = tmpText.split("{@lowerName}").join(curBasicItemName);
										}
										tmpBasicItem.entries.unshift(tmpText);
									}
								} else tmpBasicItem[inheritedProperty] = curInherits[inheritedProperty];
							}
						}
						itemList.push(tmpBasicItem);
					}
				}
			}
			enhanceItems();
		}

		function enhanceItems () {
			for (let i = 0; i < itemList.length; i++) {
				const item = itemList[i];
				if (item.noDisplay) continue;
				if (itemList[i].type === "GV") itemList[i].category = "Generic Variant";
				if (itemList[i].category === undefined) itemList[i].category = "Other";
				if (item.entries === undefined) itemList[i].entries = [];
				if (item.type && typeList[item.type]) for (let j = 0; j < typeList[item.type].entries.length; j++) itemList[i].entries = pushObject(itemList[i].entries, typeList[item.type].entries[j]);
				if (item.property) {
					const properties = item.property.split(",");
					for (let j = 0; j < properties.length; j++) if (propertyList[properties[j]].entries) for (let k = 0; k < propertyList[properties[j]].entries.length; k++) itemList[i].entries = pushObject(itemList[i].entries, propertyList[properties[j]].entries[k]);
				}
				// The following could be encoded in JSON, but they depend on more than one JSON property; maybe fix if really bored later
				if (item.armor) {
					if (item.resist) itemList[i].entries = pushObject(itemList[i].entries, "You have resistance to " + item.resist + " damage while you wear this armor.");
					if (item.armor && item.stealth) itemList[i].entries = pushObject(itemList[i].entries, "The wearer has disadvantage on Stealth (Dexterity) checks.");
					if (item.type === "HA" && item.strength) itemList[i].entries = pushObject(itemList[i].entries, "If the wearer has a Strength score lower than " + item.strength + ", their speed is reduced by 10 feet.");
				} else if (item.resist) {
					if (item.type === "P") itemList[i].entries = pushObject(itemList[i].entries, "When you drink this potion, you gain resistance to " + item.resist + " damage for 1 hour.");
					if (item.type === "RG") itemList[i].entries = pushObject(itemList[i].entries, "You have resistance to " + item.resist + " damage while wearing this ring.");
				}
				if (item.type === "SCF") {
					if (item.scfType === "arcane") itemList[i].entries = pushObject(itemList[i].entries, "An arcane focus is a special item designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus, using it in place of any material component which does not list a cost.");
					if (item.scfType === "druid") itemList[i].entries = pushObject(itemList[i].entries, "A druid can use such a druidic focus as a spellcasting focus, using it in place of any material component that does not have a cost.");
					if (item.scfType === "holy") {
						itemList[i].entries = pushObject(itemList[i].entries, "A holy symbol is a representation of a god or pantheon.");
						itemList[i].entries = pushObject(itemList[i].entries, "A cleric or paladin can use a holy symbol as a spellcasting focus, using it in place of any material components which do not list a cost. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.");
					}
				}

				// bind pointer to propertyList
				if (item.property) {
					item._propertyList = propertyList;
				}

				// bake in types
				const type = [];
				if (item.wondrous) type.push("Wondrous Item");
				if (item.technology) type.push(item.technology);
				if (item.age) type.push(item.age);
				if (item.weaponCategory) type.push(item.weaponCategory + " Weapon");
				if (item.type) type.push(Parser.itemTypeToAbv(item.type));
				if (item.poison) type.push("Poison");
				item.procType = type;
				item.typeText = type.join(", ");

				// bake in attunement
				let attunement = "No";
				if (item.reqAttune !== undefined) {
					if (item.reqAttune === "YES") {
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
			}
			callback(itemList);
		}

		function pushObject (targetObject, objectToBePushed) {
			const copiedObject = JSON.parse(JSON.stringify(targetObject));
			copiedObject.push(objectToBePushed);
			return copiedObject;
		}
	}
};

EntryRenderer.hover = {
	linkCache: {},

	_addToCache: function (page, source, hash, item) {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		if (!this.linkCache[page]) this.linkCache[page] = [];
		const pageLvl = this.linkCache[page];
		if (!pageLvl[source]) pageLvl[source] = [];
		const srcLvl = pageLvl[source];
		srcLvl[hash] = item;
	},

	_getFromCache: function (page, source, hash) {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		return this.linkCache[page][source][hash];
	},

	_isCached: function (page, source, hash) {
		page = page.toLowerCase();
		source = source.toLowerCase();
		hash = hash.toLowerCase();

		return this.linkCache[page] && this.linkCache[page][source] && this.linkCache[page][source][hash];
	},

	_makeWindow: function () {
		const winW = EntryRenderer.hover._curHovering.winW;
		const winH = EntryRenderer.hover._curHovering.winH;
		const ele = EntryRenderer.hover._curHovering.ele;
		const page = EntryRenderer.hover._curHovering.cPage;
		const source = EntryRenderer.hover._curHovering.cSource;
		const hash = EntryRenderer.hover._curHovering.cHash;
		const content = EntryRenderer.hover._curHovering.renderFunction(EntryRenderer.hover._getFromCache(page, source, hash));

		const offset = $(ele).offset();
		const vpOffsetT = offset.top - $(document).scrollTop();
		const vpOffsetL = offset.left - $(document).scrollLeft();

		const fromBottom = vpOffsetT > winH / 2;
		const fromRight = vpOffsetL > winW / 2;

		const $hov = $(`<div class="hoverbox"/>`);
		const $stats = $(`<table class="stats"></table>`);
		$stats.append(content);
		$hov.append(`<div class="hoverborder"></div>`)
			.append($stats)
			.append(`<div class="hoverborder"></div>`);

		if (fromBottom) $hov.css("bottom", winH - vpOffsetT);
		else $hov.css("top", vpOffsetT + $(ele).height() + 1);

		if (fromRight) $hov.css("right", winW - vpOffsetL);
		else $hov.css("left", vpOffsetL + $(ele).width() + 1);

		$(ele).bind("mouseleave", () => {
			$hov.remove();
		});

		// backup deletion, just in case
		$hov.on("click", () => {
			$hov.remove()
		});

		$(`body`).append($hov);

		// readjust position if vertically clipping off screen
		const hvVertOffset = $hov.offset().top - $(document).scrollTop();
		if (hvVertOffset < 0) {
			$hov.css("top", 0).css("bottom", "");
		} else {
			const calcHeight = $hov.height();
			if (hvVertOffset + calcHeight > winH) {
				$hov.css("top", 0).css("bottom", "");
			}
		}

		$(ele).css("cursor", "");
		EntryRenderer.hover._showInProgress = false;
		EntryRenderer.hover._curHovering = null;
	},

	_showInProgress: false,
	_hoverId: 1,
	_curHovering: null,
	show: function (ele, page, source, hash) {
		const winW = $(window).width();
		const winH = $(window).height();

		// don't show on mobile
		if (winW <= 768) return;

		let hoverId;
		const curHoverId = $(ele).data("hover-id");
		if (curHoverId) {
			hoverId = curHoverId;
		} else {
			hoverId = EntryRenderer.hover._hoverId++;
			$(ele).data("hover-id", hoverId);
		}
		let renderFunction;
		switch (page) {
			case UrlUtil.PG_SPELLS:
				renderFunction = EntryRenderer.spell.getCompactRenderedString;
				break;
			case UrlUtil.PG_ITEMS:
				renderFunction = EntryRenderer.item.getCompactRenderedString;
				break;
			default:
				throw new Error(`No hover render function specified for page ${page}`)
		}
		EntryRenderer.hover._curHovering = {
			hoverId: hoverId,
			winW: winW,
			winH: winH,
			ele: ele,
			renderFunction: renderFunction,
			cPage: page,
			cSource: source,
			cHash: hash
		};

		// return if another event chain is handling the event
		if (EntryRenderer.hover._showInProgress) {
			return;
		}

		EntryRenderer.hover._showInProgress = true;
		$(ele).css("cursor", "wait");

		// clean up any old event listeners
		$(ele).unbind("mouseleave");

		// cancel hover if the mouse leaves
		$(ele).bind("mouseleave", () => {
			EntryRenderer.hover._curHovering = null;
		});

		switch (page) {
			case UrlUtil.PG_SPELLS: {
				const BASE_URL = `data/spells/`;

				if (!EntryRenderer.hover._isCached(page, source, hash)) {
					DataUtil.loadJSON(`${BASE_URL}index.json`, (data) => {
						const procData = {};
						Object.keys(data).forEach(k => procData[k.toLowerCase()] = data[k]);
						DataUtil.loadJSON(`${BASE_URL}${procData[source.toLowerCase()]}`, (data) => {
							data.spell.forEach(spell => {
								const spellHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](spell);
								EntryRenderer.hover._addToCache(page, spell.source, spellHash, spell)
							});
							EntryRenderer.hover._makeWindow();
						});
					});
				} else {
					EntryRenderer.hover._makeWindow();
				}
				break;
			}

			case UrlUtil.PG_ITEMS: {
				if (!EntryRenderer.hover._isCached(page, source, hash)) {
					EntryRenderer.item.buildList((allItems) => {
						allItems.forEach(item => {
							const itemHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
							EntryRenderer.hover._addToCache(page, item.source, itemHash, item)
						});
						EntryRenderer.hover._makeWindow();
					});
				} else {
					EntryRenderer.hover._makeWindow();
				}
				break;
			}
		}
	}
};

/**
 * Recursively find all the names of entries, useful for indexing
 * @param nameStack an array to append the names to
 * @param entry the base entry
 */
EntryRenderer.getNames = function (nameStack, entry) {
	if (entry.name) nameStack.push(entry.name);
	if (entry.entries) {
		for (const eX of entry.entries) {
			EntryRenderer.getNames(nameStack, eX);
		}
	} else if (entry.items) {
		for (const eX of entry.items) {
			EntryRenderer.getNames(nameStack, eX);
		}
	}
};

EntryRenderer._onImgLoad = function () {
	if (typeof onimgload === "function") onimgload()
};

EntryRenderer.HEAD_NEG_1 = "statsBlockSectionHead";
EntryRenderer.HEAD_0 = "statsBlockHead";
EntryRenderer.HEAD_1 = "statsBlockSubHead";
EntryRenderer.HEAD_2 = "statsInlineHead";
EntryRenderer.HEAD_2_SUB_VARIANT = "statsInlineHeadSubVariant";
EntryRenderer.DATA_NONE = "data-none";

if (typeof module !== "undefined") {
	module.exports.EntryRenderer = EntryRenderer;
}