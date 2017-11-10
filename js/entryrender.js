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
class EntryRenderer {

	/**
	 * @param entry An "entry" usually defined in JSON. There ought to be a schema for it somewhere (TODO)
	 *
	 * @param textStack A reference to an array, which will hold all our strings as we recurse
	 * @param depth The current recursion depth. Optional, default 0, or -1 for type "section" entries
	 * @param prefix The (optional) prefix to be added to the textStack before whatever is added by the current call
	 * @param suffix The (optional) suffix to be added to the textStack after whatever is added by the current call
	 */
	recursiveEntryRender(entry, textStack, depth, prefix, suffix) {
		depth = depth === undefined || depth === null ? entry.type === "section" ? -1 : 0 : depth;
		prefix = prefix === undefined || prefix === null ? "" : prefix;
		suffix = suffix === undefined || suffix === null ? "" : suffix;

		if (prefix) textStack.push(prefix);
		if (typeof entry === "object") {
			// the root entry (e.g. "Rage" in barbarian "classFeatures") is assumed to be of type "entries"
			const type = entry.type === undefined || entry.type === "section" ? "entries" : entry.type;
			switch (type) {
				case "entries":
				case "options":
					const inlineTitle = depth >= 2;
					if (inlineTitle) {
						textStack.push("<p>");
						for (let i = 0; i < entry.entries.length; i++) {
							const nextPrefix = i === 0 ? "<p>" + entry.name !== undefined ? "<span class='statsInlineHead'>" + entry.name + ".</span> " : "" : "<p>";
							const nextSuffix = "</p>";

							this.recursiveEntryRender(
								entry.entries[i],
								textStack,
								depth + 1,
								nextPrefix,
								nextSuffix
							);
						}
					} else {
						if (entry.name !== undefined) textStack.push("<span class='" + (depth === -1 ? "statsBlockSectionHead" : depth === 0 ? "statsBlockHead" : "statsBlockSubHead") + "'>" + entry.name + "</span>");
						for (let i = 0; i < entry.entries.length; i++) {
							this.recursiveEntryRender(entry.entries[i], textStack, depth + 1, "<p>", "</p>");
						}
					}
					break;
				case "list":
					textStack.push("<ul>");
					for (let i = 0; i < entry.items.length; i++) {
						this.recursiveEntryRender(entry.items[i], textStack, depth + 1, "<li>", "</li>");
					}
					textStack.push("</ul>");
					break;
				case "table":
					renderTable(this);
					break;
				case "inline":
					for (let i = 0; i < entry.entries.length; i++) {
						this.recursiveEntryRender(entry.entries[i], textStack, depth);
					}
					break;
				case "bonus":
					textStack.push((entry.value < 0 ? "" : "+") + entry.value);
					break;
				case "bonusSpeed":
					textStack.push((entry.value < 0 ? "" : "+") + entry.value + "ft.");
					break;
				case "dice":
					// TODO make this (optionally) clickable to roll the dice?
					textStack.push(String(entry.number) + "d" + entry.faces);
					break;
				case "abilityDc":
					// something similar to `utils_makeAttDc` but with new naming conventions
					break;
				case "abilityAttackMod":
					// something similar to `utils_makeAttAttackMod` but with new naming conventions
					break;
				case "link":
					renderLink(entry);
					break;
			}
		} else if (typeof entry === "string") {
			renderString(this);
		} else {
			// for ints etc
			textStack.push(entry);
		}
		if (suffix) textStack.push(suffix);

		function renderTable(self) {
			// TODO add handling for rowLabel property

			textStack.push("<table>");

			if (entry.caption !== undefined) {
				textStack.push("<caption>" + entry.caption + "</caption>");
			}
			textStack.push("<thead>");
			textStack.push("<tr>");

			for (let i = 0; i < entry.colLabels.length; ++i) {
				textStack.push("<th" + getTableThClassText(i) + ">" + entry.colLabels[i] + "</th>");
			}

			textStack.push("</tr>");
			textStack.push("</thead>");
			textStack.push("<tbody>");

			for (let i = 0; i < entry.rows.length; ++i) {
				textStack.push("<tr>");
				for (let j = 0; j < entry.rows[i].length; ++j) {
					textStack.push("<td" + makeTableTdClassText(j) + ">");
					self.recursiveEntryRender(entry.rows[i][j], textStack, depth + 1);
					textStack.push("</td>");
				}
				textStack.push("</tr>");
			}

			textStack.push("</tbody>");
			textStack.push("</table>");

			function getTableThClassText(i) {
				return entry.colStyles === undefined || i >= entry.colStyles.length ? "" : " class=\"" + entry.colStyles[i] + "\"";
			}

			function makeTableTdClassText(i) {
				if (entry.rowStyles !== undefined) {
					return entry.rowStyles === undefined || i >= entry.rowStyles.length ? "" : " class=\"" + entry.rowStyles[i] + "\"";
				} else {
					return getTableThClassText(i);
				}
			}
		}

		function renderLink(entry) {
			/*
			// TODO schema this somewhere
			"entryLink": {
				"allOf" : [
					{"$ref" : "#/definitions/entry"},
					{
						"properties": {
							"type": {"const": "link"},
							"text": {
								"type": "string"
							},
							"href": {
								"oneOf": [
									{
										"properties": {
											"type": {"const": "internal"},
											"path": {
												"type": "string"
											},
											"hash": {
												"type": "string"
											},
											"subhashes": {
												"type": "array",
												"items": {
													"type": "object",
													"properties": {
														"key": {
															"type": "string"
														},
														"value": {
															"type": "string"
														}
													},
													"required": ["key", "value"],
													"additionalProperties": false
												}
											}
										},
										"required": ["type", "path"],
										"additionalProperties": false
									},
									{
										"properties": {
											"type": {"const": "external"},
											"url": {
												"type": "string"
											}
										},
										"required": ["type", "url"],
										"additionalProperties": false
									}
								]
							}
						},
						"required": ["text", "href"],
						"additionalProperties": false
					}
				]
			}
			 */
			let href;
			if (entry.href.type === "internal") {
				href = `${entry.href.path}#`;
				if (entry.href.hash !== undefined) {
					href += encodeForHash(entry.href.hash);
					if (entry.href.subhashes !== undefined) {
						for (let i = 0; i < entry.href.subhashes.length; i++) {
							const subHash = entry.href.subhashes[i];
							href += `,${encodeForHash(subHash.key)}:${encodeForHash(subHash.value)}`
						}
					}
				}
			} else if (entry.href.type === "external") {
				href = entry.href.url;
			}
			textStack.push(`<a href='${href}' target='_blank'>${entry.text}</a>`);
		}

		function renderString(self) {
			const tagSplit = entry.split(EntryRenderer.RE_INLINE);
			if (tagSplit.length > 1) {
				for (let i = 0; i < tagSplit.length; i++) {
					const s = tagSplit[i];
					if (s.charAt(0) === "@") {
						const [tag, text] = splitFirstSpace(s);
						const fauxEntry = {
							"type": "link",
							"href": {
								"type": "internal",
								"hash": text
							},
							"text": text
						};
						switch (tag) {
							case "@spell":
								fauxEntry.href.path = "spells.html";
								fauxEntry.href.hash = fauxEntry.href.hash += "_phb";
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@item":
								fauxEntry.href.path = "items.html";
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@class":
								const classMatch = EntryRenderer.RE_INLINE_CLASS.exec(text);
								if (classMatch) {
									fauxEntry.href.hash = classMatch[1].trim();
									fauxEntry.href.subhashes = [{"key": "subclass", "value": classMatch[2].trim()}]
								}
								fauxEntry.href.path = "classes.html";
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@creature":
								fauxEntry.href.path = "bestiary.html";
								self.recursiveEntryRender(fauxEntry, textStack, depth);
								break;
							case "@bold":
								textStack.push(`<b>${text}</b>`);
								break;
						}
					} else {
						textStack.push(s);
					}
				}
			} else {
				textStack.push(entry);
			}

			function splitFirstSpace(string) {
				return [
					string.substr(0, string.indexOf(' ')),
					string.substr(string.indexOf(' ')+1)
				]
			}
		}
	}
}
EntryRenderer.RE_INLINE = /{(@.*? .*?)}/g;
EntryRenderer.RE_INLINE_CLASS = /(.*?) \((.*?)\)/;