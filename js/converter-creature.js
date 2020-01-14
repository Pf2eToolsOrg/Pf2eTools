"use strict";

if (typeof module !== "undefined") {
	global.PropOrder = require("./utils-proporder.js");
}

class StatblockConverter {
	static _getValidOptions (options) {
		options = options || {};
		options.isAppend = options.isAppend || false;
		if (!options.cbWarning || !options.cbOutput) throw new Error(`Missing required callback options!`);
		return options;
	}

	/**
	 * Parses statblocks from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseText (inText, options) {
		options = StatblockConverter._getValidOptions(options);

		function startNextPhase (cur) {
			return (!cur.toUpperCase().indexOf("ACTION") || !cur.toUpperCase().indexOf("LEGENDARY ACTION") || !cur.toUpperCase().indexOf("REACTION"))
		}

		/**
		 * If the current line ends in a comma, we can assume the next line is a broken/wrapped part of the current line
		 */
		function absorbBrokenLine (isCrLine) {
			const NO_ABSORB_SUBTITLES = [
				"SAVING THROWS",
				"SKILLS",
				"DAMAGE VULNERABILITIES",
				"DAMAGE RESISTANCE",
				"DAMAGE IMMUNITIES",
				"CONDITION IMMUNITIES",
				"SENSES",
				"LANGUAGES",
				"CHALLENGE"
			];
			const NO_ABSORB_TITLES = [
				"ACTION",
				"LEGENDARY ACTION",
				"REACTION"
			];

			if (curLine) {
				if (curLine.trim().endsWith(",")) {
					const nxtLine = toConvert[++i];
					if (!nxtLine) return false;
					curLine = `${curLine.trim()} ${nxtLine.trim()}`;
					return true;
				}

				if (isCrLine) return false; // avoid absorbing past the CR line

				const nxtLine = toConvert[i + 1];
				if (!nxtLine) return false;

				if (ConvertUtil.isNameLine(nxtLine)) return false; // avoid absorbing the start of traits
				if (NO_ABSORB_TITLES.some(it => nxtLine.toUpperCase().includes(it))) return false;
				if (NO_ABSORB_SUBTITLES.some(it => nxtLine.toUpperCase().startsWith(it))) return false;

				i++;
				curLine = `${curLine.trim()} ${nxtLine.trim()}`;
				return true;
			}
			return false;
		}

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = (() => {
			const clean = StatblockConverter._getCleanInput(inText);
			const spl = clean.split(/(Challenge)/i);
			spl[0] = spl[0]
				.replace(/(\d\d?\s+\([-—+]\d+\)\s*)+/gi, (...m) => `${m[0].replace(/\n/g, " ").replace(/\s+/g, " ")}\n`); // collapse multi-line ability scores
			return spl.join("").split("\n").filter(it => it && it.trim());
		})();
		const stats = {};
		stats.source = options.source || "";
		// for the user to fill out
		stats.page = options.pageNumber;

		let prevLine = null;
		let curLine = null;
		let i;
		for (i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of monster
			if (i === 0) {
				stats.name = this._getCleanName(curLine, options);
				continue;
			}

			// size type alignment
			if (i === 1) {
				StatblockConverter._setCleanSizeTypeAlignment(stats, curLine, options);
				continue;
			}

			// armor class
			if (i === 2) {
				stats.ac = curLine.split_handleColon("Armor Class ", 1)[1];
				continue;
			}

			// hit points
			if (i === 3) {
				StatblockConverter._setCleanHp(stats, curLine);
				continue;
			}

			// speed
			if (i === 4) {
				this._setCleanSpeed(stats, curLine, options);
				continue;
			}

			// ability scores
			if (/STR\s*DEX\s*CON\s*INT\s*WIS\s*CHA/i.test(curLine)) {
				// skip forward a line and grab the ability scores
				++i;
				const abilities = toConvert[i].trim().split(/ ?\(([+\-—])?[0-9]*\) ?/g);
				stats.str = StatblockConverter._tryConvertNumber(abilities[0]);
				stats.dex = StatblockConverter._tryConvertNumber(abilities[2]);
				stats.con = StatblockConverter._tryConvertNumber(abilities[4]);
				stats.int = StatblockConverter._tryConvertNumber(abilities[6]);
				stats.wis = StatblockConverter._tryConvertNumber(abilities[8]);
				stats.cha = StatblockConverter._tryConvertNumber(abilities[10]);
				continue;
			}

			// alternate ability scores (alternating lines of abbreviation and score)
			if (Parser.ABIL_ABVS.includes(curLine.toLowerCase())) {
				// skip forward a line and grab the ability score
				++i;
				switch (curLine.toLowerCase()) {
					case "str": stats.str = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "dex": stats.dex = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "con": stats.con = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "int": stats.int = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "wis": stats.wis = StatblockConverter._tryGetStat(toConvert[i]); continue;
					case "cha": stats.cha = StatblockConverter._tryGetStat(toConvert[i]); continue;
				}
			}

			// saves (optional)
			if (!curLine.indexOf_handleColon("Saving Throws ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanSaves(stats, curLine, options);
				continue;
			}

			// skills (optional)
			if (!curLine.indexOf_handleColon("Skills ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanSkills(stats, curLine);
				continue;
			}

			// damage vulnerabilities (optional)
			if (!curLine.indexOf_handleColon("Damage Vulnerabilities ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanDamageVuln(stats, curLine);
				continue;
			}

			// damage resistances (optional)
			if (!curLine.indexOf_handleColon("Damage Resistance")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanDamageRes(stats, curLine);
				continue;
			}

			// damage immunities (optional)
			if (!curLine.indexOf_handleColon("Damage Immunities ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanDamageImm(stats, curLine);
				continue;
			}

			// condition immunities (optional)
			if (!curLine.indexOf_handleColon("Condition Immunities ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanConditionImm(stats, curLine);
				continue;
			}

			// senses
			if (!curLine.indexOf_handleColon("Senses ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanSenses(stats, curLine);
				continue;
			}

			// languages
			if (!curLine.indexOf_handleColon("Languages ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine());
				StatblockConverter._setCleanLanguages(stats, curLine);
				continue;
			}

			// challenges and traits
			// goes into actions
			if (!curLine.indexOf_handleColon("Challenge ")) {
				// noinspection StatementWithEmptyBodyJS
				while (absorbBrokenLine(true));
				StatblockConverter._setCleanCr(stats, curLine);
				continue;
			}

			// traits
			stats.trait = [];
			stats.action = [];
			stats.reaction = [];
			stats.legendary = [];

			let curTrait = {};

			let isTraits = true;
			let isActions = false;
			let isReactions = false;
			let isLegendaryActions = false;
			let isLegendaryDescription = false;

			// keep going through traits til we hit actions
			while (i < toConvert.length) {
				if (startNextPhase(curLine)) {
					isTraits = false;
					isActions = !curLine.toUpperCase().indexOf_handleColon("ACTION");
					if (isActions) {
						const mActionNote = /actions:?\s*\((.*?)\)/gi.exec(curLine);
						if (mActionNote) stats.actionNote = mActionNote[1];
					}
					isReactions = !curLine.toUpperCase().indexOf_handleColon("REACTION");
					isLegendaryActions = !curLine.toUpperCase().indexOf_handleColon("LEGENDARY ACTION");
					isLegendaryDescription = isLegendaryActions;
					i++;
					curLine = toConvert[i];
				}

				curTrait.name = "";
				curTrait.entries = [];

				const parseFirstLine = line => {
					curTrait.name = line.split(/([.!?])/g)[0];
					curTrait.entries.push(line.substring(curTrait.name.length + 1, line.length).trim());
				};

				if (isLegendaryDescription) {
					// usually the first paragraph is a description of how many legendary actions the creature can make
					// but in the case that it's missing the substring "legendary" and "action" it's probably an action
					const compressed = curLine.replace(/\s*/g, "").toLowerCase();
					if (!compressed.includes("legendary") && !compressed.includes("action")) isLegendaryDescription = false;
				}

				if (isLegendaryDescription) {
					curTrait.entries.push(curLine.trim());
					isLegendaryDescription = false;
				} else {
					parseFirstLine(curLine);
				}

				i++;
				curLine = toConvert[i];

				// collect subsequent paragraphs
				while (curLine && !ConvertUtil.isNameLine(curLine) && !startNextPhase(curLine)) {
					// The line is probably a wrapped continuation of the previous line if it starts with:
					//  - a lowercase word
					//  - "Hit:"
					//  - numbers (e.g. damage; "5 (1d6 + 2)")
					//  - opening brackets (e.g. damage; "(1d6 + 2)")
					//  - a spellcasting ability score name (Intelligence, Charisma, Wisdom) followed by an opening bracket
					if (typeof curTrait.entries.last() === "string" && /^([a-z]|Hit:|\d+\s+|\(|(Intelligence|Wisdom|Charisma)\s+\()/.test(curLine.trim())) {
						curTrait.entries.last(`${curTrait.entries.last().trim()} ${curLine.trim()}`);
					} else {
						curTrait.entries.push(curLine.trim());
					}
					i++;
					curLine = toConvert[i];
				}

				if (curTrait.name || curTrait.entries) {
					// convert dice tags
					DiceConvert.convertTraitActionDice(curTrait);

					// convert spellcasting
					if (isTraits) {
						if (curTrait.name.toLowerCase().includes("spellcasting")) {
							curTrait = this._tryParseSpellcasting(curTrait, false, options);
							if (curTrait.success) {
								// merge in e.g. innate spellcasting
								if (stats.spellcasting) stats.spellcasting = stats.spellcasting.concat(curTrait.out);
								else stats.spellcasting = curTrait.out;
							} else stats.trait.push(curTrait.out);
						} else {
							if (StatblockConverter._hasEntryContent(curTrait)) stats.trait.push(curTrait);
						}
					}
					if (isActions && StatblockConverter._hasEntryContent(curTrait)) stats.action.push(curTrait);
					if (isReactions && StatblockConverter._hasEntryContent(curTrait)) stats.reaction.push(curTrait);
					if (isLegendaryActions && StatblockConverter._hasEntryContent(curTrait)) stats.legendary.push(curTrait);
				}
				curTrait = {};
			}

			// Remove keys if they are empty
			if (stats.trait.length === 0) delete stats.trait;
			if (stats.reaction.length === 0) delete stats.reaction;
			if (stats.legendary.length === 0) delete stats.legendary;
		}

		(function doCleanLegendaryActionHeader () {
			if (stats.legendary) {
				stats.legendary = stats.legendary.map(it => {
					if (!it.name.trim() && !it.entries.length) return null;
					const m = /can take (\d) legendary actions/gi.exec(it.entries[0]);
					if (!it.name.trim() && m) {
						if (m[1] !== "3") stats.legendaryActions = Number(m[1]);
						return null;
					} else return it;
				}).filter(Boolean);
			}
		})();

		this._doStatblockPostProcess(stats, options);
		const statsOut = PropOrder.getOrdered(stats, "monster");
		options.cbOutput(statsOut, options.isAppend);
	}

	/**
	 * Parses statblocks from Homebrewery/GM Binder Markdown
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseMarkdown (inText, options) {
		options = StatblockConverter._getValidOptions(options);

		const self = this;

		function stripQuote (line) {
			return line.replace(/^\s*>\s*/, "").trim();
		}

		function stripDashStarStar (line) {
			return line.replace(/\**/g, "").replace(/^-/, "").trim();
		}

		function stripTripleHash (line) {
			return line.replace(/^###/, "").trim();
		}

		function stripLeadingSymbols (line) {
			const removeFirstInnerStar = line.trim().startsWith("*");
			const clean = line.replace(/^[^A-Za-z0-9]*/, "").trim();
			return removeFirstInnerStar ? clean.replace(/\*/, "") : clean;
		}

		function isInlineHeader (line) {
			// it should really start with "***" but, homebrew
			return line.trim().startsWith("**");
		}

		function isInlineLegendaryActionItem (line) {
			return /^-\s*\*\*\*?[^*]+/gi.test(line.trim());
		}

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = StatblockConverter._getCleanInput(inText).split("\n");
		let stats = null;

		const getNewStatblock = () => {
			return {
				source: options.source,
				page: options.pageNumber
			}
		};

		let parsed = 0;
		let hasMultipleBlocks = false;
		const doOutputStatblock = () => {
			if (trait != null) doAddFromParsed();
			if (stats) {
				this._doStatblockPostProcess(stats, options);
				const statsOut = PropOrder.getOrdered(stats, "monster");
				options.cbOutput(statsOut, options.isAppend);
			}
			stats = getNewStatblock();
			if (hasMultipleBlocks) options.isAppend = true; // append any further blocks we find in this parse
			parsed = 0;
		};

		let prevLine = null;
		let curLineRaw = null;
		let curLine = null;
		let prevBlank = true;
		let nextPrevBlank = true;
		let trait = null;

		function getCleanTraitText (line) {
			const [name, text] = line.replace(/^\*\*\*?/, "").split(/.\s*\*\*\*?/).map(it => it.trim());
			return [
				name,
				text.replace(/\*Hit(\*:|:\*) /g, "Hit: ") // clean hit tags for later replacement
			]
		}

		function getCleanLegendaryActionText (line) {
			return getCleanTraitText(line.trim().replace(/^-\s*/, ""));
		}

		function doAddFromParsed () {
			if (parsed === 9) { // traits
				doAddTrait();
			} else if (parsed === 10) { // actions
				doAddAction();
			} else if (parsed === 11) { // reactions
				doAddReaction();
			} else if (parsed === 12) { // legendary actions
				doAddLegendary();
			}
		}

		function doAddTrait () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.trait = stats.trait || [];

				DiceConvert.convertTraitActionDice(trait);

				// convert spellcasting
				if (trait.name.toLowerCase().includes("spellcasting")) {
					trait = self._tryParseSpellcasting(trait, true, options);
					if (trait.success) {
						// merge in e.g. innate spellcasting
						if (stats.spellcasting) stats.spellcasting = stats.spellcasting.concat(trait.out);
						else stats.spellcasting = trait.out;
					} else stats.trait.push(trait.out);
				} else {
					stats.trait.push(trait)
				}
			}
			trait = null;
		}

		function doAddAction () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.action = stats.action || [];

				DiceConvert.convertTraitActionDice(trait);
				stats.action.push(trait);
			}
			trait = null;
		}

		function doAddReaction () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.reaction = stats.reaction || [];

				DiceConvert.convertTraitActionDice(trait);
				stats.reaction.push(trait);
			}
			trait = null;
		}

		function doAddLegendary () {
			if (StatblockConverter._hasEntryContent(trait)) {
				stats.legendary = stats.legendary || [];

				DiceConvert.convertTraitActionDice(trait);
				stats.legendary.push(trait);
			}
			trait = null;
		}

		function getCleanedRaw (str) {
			return str.trim()
				.replace(/<br\s*(\/)?>/gi, ""); // remove <br>
		}

		let i = 0;
		for (; i < toConvert.length; i++) {
			prevLine = curLine;
			curLineRaw = getCleanedRaw(toConvert[i]);
			curLine = curLineRaw;

			if (curLine === "" || curLine.toLowerCase() === "\\pagebreak" || curLine.toLowerCase() === "\\columnbreak") {
				prevBlank = true;
				continue;
			} else nextPrevBlank = false;
			curLine = stripQuote(curLine).trim();
			if (curLine === "") continue;
			else if (
				(curLine === "___" && prevBlank) // handle nicely separated blocks
				|| curLineRaw === "___" // handle multiple stacked blocks
			) {
				if (stats !== null) hasMultipleBlocks = true;
				doOutputStatblock();
				prevBlank = nextPrevBlank;
				continue;
			} else if (curLine === "___") {
				prevBlank = nextPrevBlank;
				continue;
			}

			// name of monster
			if (parsed === 0) {
				curLine = curLine.replace(/^\s*##/, "").trim();
				stats.name = this._getCleanName(curLine, options);
				parsed++;
				continue;
			}

			// size type alignment
			if (parsed === 1) {
				curLine = curLine.replace(/^\**(.*?)\**$/, "$1");
				StatblockConverter._setCleanSizeTypeAlignment(stats, curLine, options);
				parsed++;
				continue;
			}

			// armor class
			if (parsed === 2) {
				stats.ac = stripDashStarStar(curLine).replace(/Armor Class/g, "").trim();
				parsed++;
				continue;
			}

			// hit points
			if (parsed === 3) {
				StatblockConverter._setCleanHp(stats, stripDashStarStar(curLine));
				parsed++;
				continue;
			}

			// speed
			if (parsed === 4) {
				this._setCleanSpeed(stats, stripDashStarStar(curLine), options);
				parsed++;
				continue;
			}

			// ability scores
			if (parsed === 5 || parsed === 6 || parsed === 7) {
				// skip the two header rows
				if (curLine.replace(/\s*/g, "").startsWith("|STR") || curLine.replace(/\s*/g, "").startsWith("|:-")) {
					parsed++;
					continue;
				}
				const abilities = curLine.split("|").map(it => it.trim()).filter(Boolean);
				Parser.ABIL_ABVS.map((abi, j) => stats[abi] = StatblockConverter._tryGetStat(abilities[j]));
				parsed++;
				continue;
			}

			if (parsed === 8) {
				// saves (optional)
				if (~curLine.indexOf("Saving Throws")) {
					StatblockConverter._setCleanSaves(stats, stripDashStarStar(curLine), options);
					continue;
				}

				// skills (optional)
				if (~curLine.indexOf("Skills")) {
					StatblockConverter._setCleanSkills(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage vulnerabilities (optional)
				if (~curLine.indexOf("Damage Vulnerabilities")) {
					StatblockConverter._setCleanDamageVuln(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage resistances (optional)
				if (~curLine.indexOf("Damage Resistance")) {
					StatblockConverter._setCleanDamageRes(stats, stripDashStarStar(curLine));
					continue;
				}

				// damage immunities (optional)
				if (~curLine.indexOf("Damage Immunities")) {
					StatblockConverter._setCleanDamageImm(stats, stripDashStarStar(curLine));
					continue;
				}

				// condition immunities (optional)
				if (~curLine.indexOf("Condition Immunities")) {
					StatblockConverter._setCleanConditionImm(stats, stripDashStarStar(curLine));
					continue;
				}

				// senses
				if (~curLine.indexOf("Senses")) {
					StatblockConverter._setCleanSenses(stats, stripDashStarStar(curLine));
					continue;
				}

				// languages
				if (~curLine.indexOf("Languages")) {
					StatblockConverter._setCleanLanguages(stats, stripDashStarStar(curLine));
					continue;
				}

				if (~curLine.indexOf("Challenge")) {
					StatblockConverter._setCleanCr(stats, stripDashStarStar(curLine));
					parsed++;
					continue;
				}
			}

			const cleanedLine = stripTripleHash(curLine);
			if (cleanedLine.toLowerCase() === "actions") {
				doAddFromParsed();
				parsed = 10;
				continue;
			} else if (cleanedLine.toLowerCase() === "reactions") {
				doAddFromParsed();
				parsed = 11;
				continue;
			} else if (cleanedLine.toLowerCase() === "legendary actions") {
				doAddFromParsed();
				parsed = 12;
				continue;
			}

			// traits
			if (parsed === 9) {
				if (isInlineHeader(curLine)) {
					doAddTrait();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// actions
			if (parsed === 10) {
				if (isInlineHeader(curLine)) {
					doAddAction();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// reactions
			if (parsed === 11) {
				if (isInlineHeader(curLine)) {
					doAddReaction();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					trait.entries.push(stripLeadingSymbols(curLine));
				}
			}

			// legendary actions
			if (parsed === 12) {
				if (isInlineLegendaryActionItem(curLine)) {
					doAddLegendary();
					trait = {name: "", entries: []};
					const [name, text] = getCleanLegendaryActionText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else if (isInlineHeader(curLine)) {
					doAddLegendary();
					trait = {name: "", entries: []};
					const [name, text] = getCleanTraitText(curLine);
					trait.name = name;
					trait.entries.push(stripLeadingSymbols(text));
				} else {
					if (!trait) { // legendary action intro text
						// ignore generic LA intro; the renderer will insert it
						if (!curLine.toLowerCase().includes("can take 3 legendary actions")) {
							trait = {name: "", entries: [stripLeadingSymbols(curLine)]};
						}
					} else trait.entries.push(stripLeadingSymbols(curLine));
				}
			}
		}

		doOutputStatblock();
	}

	getSample (format) {
		switch (format) {
			case "txt": return StatblockConverter.SAMPLE_TEXT;
			case "md": return StatblockConverter.SAMPLE_MARKDOWN;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	_doStatblockPostProcess (stats, options) {
		const doCleanup = () => {
			// remove any empty arrays
			Object.keys(stats).forEach(k => {
				if (stats[k] instanceof Array && stats[k].length === 0) {
					delete stats[k];
				}
			});
		};

		if (stats.trait) stats.trait.forEach(trait => RechargeConvert.tryConvertRecharge(trait, () => {}, () => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Manual recharge tagging required for trait "${trait.name}"`)));
		if (stats.action) stats.action.forEach(action => RechargeConvert.tryConvertRecharge(action, () => {}, () => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Manual recharge tagging required for action "${action.name}"`)));
		AcConvert.tryPostProcessAc(
			stats,
			(ac) => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}AC "${ac}" requires manual conversion`),
			(ac) => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Failed to parse AC "${ac}"`)
		);
		TagAttack.tryTagAttacks(stats, (atk) => options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Manual attack tagging required for "${atk}"`));
		TagHit.tryTagHits(stats);
		TagDc.tryTagDcs(stats);
		TagCondition.tryTagConditions(stats);
		TraitActionTag.tryRun(stats);
		LanguageTag.tryRun(stats);
		SenseTag.tryRun(stats);
		SpellcastingTypeTag.tryRun(stats);
		DamageTypeTag.tryRun(stats);
		MiscTag.tryRun(stats);
		doCleanup();
	}

	static _tryConvertNumber (strNumber) {
		try {
			return Number(strNumber.replace(/—/g, "-"))
		} catch (e) {
			return strNumber;
		}
	}

	static _tryParseType (strType) {
		try {
			const m = /^(.*?) (\(.*?\))\s*$/.exec(strType);
			if (m) {
				return {type: m[1].toLowerCase(), tags: m[2].split(",").map(s => s.replace(/\(/g, "").replace(/\)/g, "").trim().toLowerCase())}
			}
			return strType.toLowerCase();
		} catch (e) {
			return strType;
		}
	}

	static _tryGetStat (strLine) {
		try {
			return StatblockConverter._tryConvertNumber(/(\d+) \(.*?\)/.exec(strLine)[1]);
		} catch (e) {
			return 0;
		}
	}

	/**
	 * Tries to parse immunities, resistances, and vulnerabilities
	 * @param strDamage The string to parse.
	 * @param modProp the output property (e.g. "vulnerable").
	 */
	static _tryParseDamageResVulnImmune (strDamage, modProp) {
		// handle the case where a comma is mistakenly used instead of a semicolon
		if (strDamage.toLowerCase().includes(", bludgeoning, piercing, and slashing from")) {
			strDamage = strDamage.replace(/, (bludgeoning, piercing, and slashing from)/gi, "; $1")
		}

		const splSemi = strDamage.toLowerCase().split(";");
		const newDamage = [];
		try {
			splSemi.forEach(section => {
				const tempDamage = {};
				let pushArray = newDamage;
				if (section.includes("from")) {
					tempDamage[modProp] = [];
					pushArray = tempDamage[modProp];
					tempDamage["note"] = /from .*/.exec(section)[0];
					section = /(.*) from /.exec(section)[1];
				}
				section = section.replace(/and/g, "");
				section.split(",").forEach(s => pushArray.push(s.trim()));
				if ("note" in tempDamage) newDamage.push(tempDamage)
			});
			return newDamage;
		} catch (ignored) {
			return strDamage;
		}
	}

	_tryParseSpellcasting (trait, isMarkdown, options) {
		return SpellcastingTraitConvert.tryParseSpellcasting(trait, isMarkdown, (err) => options.cbWarning(err));
	}

	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _getCleanInput (ipt) {
		return ipt
			.replace(/[−–‒]/g, "-") // convert minus signs to hyphens
		;
	}

	_getCleanName (line, options) {
		return options.isTitleCaseName ? line.toLowerCase().toTitleCase() : line;
	}

	static _setCleanSizeTypeAlignment (stats, line, options) {
		const mSidekick = /^(\d+)(?:st|nd|rd|th)\s*\W+\s*level\s+(.*)$/i.exec(line.trim());
		if (mSidekick) {
			// sidekicks
			stats.level = Number(mSidekick[1]);
			stats.size = mSidekick[2].trim()[0].toUpperCase();
			stats.type = mSidekick[2].split(" ").splice(1).join(" ");
		} else {
			// regular creatures
			stats.size = line[0].toUpperCase();
			stats.type = line.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX)[0].split(" ").splice(1).join(" ");

			stats.alignment = line.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX)[1].toLowerCase();
			AlignmentConvert.tryConvertAlignment(stats, (ali) => options.cbWarning(`Alignment "${ali}" requires manual conversion`));
		}
		stats.type = StatblockConverter._tryParseType(stats.type);
	}

	static _setCleanHp (stats, line) {
		const rawHp = line.split_handleColon("Hit Points ", 1)[1];
		// split HP into average and formula
		const m = /^(\d+)\s*\((.*?)\)$/.exec(rawHp.trim());
		if (!m) stats.hp = {special: rawHp}; // for e.g. Avatar of Death
		else {
			stats.hp = {
				average: Number(m[1]),
				formula: m[2]
			};
			DiceConvert.cleanHpDice(stats);
		}
	}

	_setCleanSpeed (stats, line, options) {
		stats.speed = line;
		SpeedConvert.tryConvertSpeed(stats, options.cbWarning);
	}

	static _setCleanSaves (stats, line, options) {
		stats.save = line.split_handleColon("Saving Throws", 1)[1].trim();
		// convert to object format
		if (stats.save && stats.save.trim()) {
			const spl = stats.save.split(",").map(it => it.trim().toLowerCase()).filter(it => it);
			const nu = {};
			spl.forEach(it => {
				const m = /(\w+)\s*([-+])\s*(\d+)/.exec(it);
				if (m) {
					nu[m[1]] = `${m[2]}${m[3]}`;
				} else {
					options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Save "${it}" requires manual conversion`);
				}
			});
			stats.save = nu;
		}
	}

	static _setCleanSkills (stats, line) {
		stats.skill = line.split_handleColon("Skills", 1)[1].trim().toLowerCase();
		const split = stats.skill.split(",");
		const newSkills = {};
		try {
			split.forEach(s => {
				const splSpace = s.split(" ");
				const val = splSpace.pop().trim();
				let name = splSpace.join(" ").toLowerCase().trim().replace(/ /g, "");
				name = StatblockConverter.SKILL_SPACE_MAP[name] || name;
				newSkills[name] = val;
			});
			stats.skill = newSkills;
			if (stats.skill[""]) delete stats.skill[""]; // remove empty properties
		} catch (ignored) {
			return 0;
		}
	}

	static _setCleanDamageVuln (stats, line) {
		stats.vulnerable = line.split_handleColon("Vulnerabilities", 1)[1].trim();
		stats.vulnerable = StatblockConverter._tryParseDamageResVulnImmune(stats.vulnerable, "vulnerable");
	}

	static _setCleanDamageRes (stats, line) {
		stats.resist = (line.toLowerCase().includes("resistances") ? line.split_handleColon("Resistances", 1) : line.split_handleColon("Resistance", 1))[1].trim();
		stats.resist = StatblockConverter._tryParseDamageResVulnImmune(stats.resist, "resist");
	}

	static _setCleanDamageImm (stats, line) {
		stats.immune = line.split_handleColon("Immunities", 1)[1].trim();
		stats.immune = StatblockConverter._tryParseDamageResVulnImmune(stats.immune, "immune");
	}

	static _setCleanConditionImm (stats, line) {
		stats.conditionImmune = line.split_handleColon("Immunities", 1)[1];
		stats.conditionImmune = StatblockConverter._tryParseDamageResVulnImmune(stats.conditionImmune, "conditionImmune");
	}

	static _setCleanSenses (stats, line) {
		const senses = line.toLowerCase().split_handleColon("senses", 1)[1].trim();
		const tempSenses = [];
		senses.split(StrUtil.COMMA_SPACE_NOT_IN_PARENTHESES_REGEX).forEach(s => {
			s = s.trim();
			if (s) {
				if (s.includes("passive perception")) stats.passive = StatblockConverter._tryConvertNumber(s.split("passive perception")[1].trim());
				else tempSenses.push(s.trim());
			}
		});
		if (tempSenses.length) stats.senses = tempSenses;
		else delete stats.senses;
	}

	static _setCleanLanguages (stats, line) {
		stats.languages = line.split_handleColon("Languages", 1)[1].trim();
		if (stats.languages && /^([-–‒—]|\\u201\d)+$/.exec(stats.languages.trim())) delete stats.languages;
		else {
			stats.languages = stats.languages
			// Clean caps words
				.split(/(\W)/g)
				.map(s => {
					return s
						.replace(/Telepathy/g, "telepathy")
						.replace(/All/g, "all")
						.replace(/Understands/g, "understands")
						.replace(/Cant/g, "cant")
						.replace(/Can/g, "can")
				})
				.join("")
				.split(StrUtil.COMMA_SPACE_NOT_IN_PARENTHESES_REGEX);
		}
	}

	static _setCleanCr (stats, line) {
		stats.cr = line.split_handleColon("Challenge", 1)[1].trim().split("(")[0].trim();
	}

	static _hasEntryContent (trait) {
		return trait && (trait.name || (trait.entries.length === 1 && trait.entries[0]) || trait.entries.length > 1);
	}
}
StatblockConverter.SKILL_SPACE_MAP = {
	"sleightofhand": "sleight of hand",
	"animalhandling": "animal handling"
};
// region samples
StatblockConverter.SAMPLE_TEXT =
	`Mammon
Huge fiend (devil), lawful evil
Armor Class 20 (natural armor)
Hit Points 378 (28d12 + 196)
Speed 50 ft.
STR DEX CON INT WIS CHA
22 (+6) 13 (+1) 24 (+7) 23 (+6) 21 (+5) 26 (+8)
Saving Throws Dex +9, Int +14, Wis +13, Cha +16
Skills Deception +16, Insight +13, Perception +13, Persuasion +16
Damage Resistances cold
Damage Immunities fire, poison; bludgeoning, piercing, and slashing from weapons that aren't silvered
Condition Immunities charmed, exhaustion, frightened, poisoned
Senses truesight 120 ft., passive Perception 23
Languages all, telepathy 120 ft.
Challenge 25 (75,000 XP)
Innate Spellcasting. Mammon's innate spellcasting ability is Charisma (spell save DC 24, +16 to hit with spell attacks). He can innately cast the following spells, requiring no material components:
At will: charm person, detect magic, dispel magic, fabricate (Mammon can create valuable objects), heat metal, magic aura
3/day each: animate objects, counterspell, creation, instant summons, legend lore, teleport
1/day: imprisonment (minimus containment only, inside gems), sunburst
Spellcasting. Mammon is a 6th level spellcaster. His spellcasting ability is Intelligence (spell save DC 13; +5 to hit with spell attacks). He has the following wizard spells prepared:
Cantrips (at will): fire bolt, light, mage hand, prestidigitation
1st level (4 slots): mage armor, magic missile, shield
2nd level (3 slots): misty step, suggestion
3rd level (3 slots): fly, lightning bolt
Legendary Resistance (3/day). If Mammon fails a saving throw, he can choose to succeed instead.
Magic Resistance. Mammon has advantage on saving throws against spells and other magical effects.
Magic Weapons. Mammon's weapon attacks are magical.
ACTIONS
Multiattack. Mammon makes three attacks.
Purse. Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 19 (3d8 + 6) bludgeoning damage plus 18 (4d8) radiant damage.
Molten Coins. Ranged Weapon Attack: +14 to hit, range 40/120 ft., one target. Hit: 16 (3d6 + 6) bludgeoning damage plus 18 (4d8) fire damage.
Your Weight In Gold (Recharge 5-6). Mammon can use this ability as a bonus action immediately after hitting a creature with his purse attack. The creature must make a DC 24 Constitution saving throw. If the saving throw fails by 5 or more, the creature is instantly petrified by being turned to solid gold. Otherwise, a creature that fails the saving throw is restrained. A restrained creature repeats the saving throw at the end of its next turn, becoming petrified on a failure or ending the effect on a success. The petrification lasts until the creature receives a greater restoration spell or comparable magic.
LEGENDARY ACTIONS
Mammon can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. Mammon regains spent legendary actions at the start of his turn.
Attack. Mammon makes one purse or molten coins attack.
Make It Rain! Mammon casts gold and jewels into a 5-foot radius within 60 feet. One creature within 60 feet of the treasure that can see it must make a DC 24 Wisdom saving throw. On a failure, the creature must use its reaction to move its speed toward the trinkets, which vanish at the end of the turn.
Deep Pockets (3 actions). Mammon recharges his Your Weight In Gold ability.`;
StatblockConverter.SAMPLE_MARKDOWN =
	`___
>## Lich
>*Medium undead, any evil alignment*
>___
>- **Armor Class** 17
>- **Hit Points** 135 (18d8 + 54)
>- **Speed** 30 ft.
>___
>|STR|DEX|CON|INT|WIS|CHA|
>|:---:|:---:|:---:|:---:|:---:|:---:|
>|11 (+0)|16 (+3)|16 (+3)|20 (+5)|14 (+2)|16 (+3)|
>___
>- **Saving Throws** Con +10, Int +12, Wis +9
>- **Skills** Arcana +19, History +12, Insight +9, Perception +9
>- **Damage Resistances** cold, lightning, necrotic
>- **Damage Immunities** poison; bludgeoning, piercing, and slashing from nonmagical attacks
>- **Condition Immunities** charmed, exhaustion, frightened, paralyzed, poisoned
>- **Senses** truesight 120 ft., passive Perception 19
>- **Languages** Common plus up to five other languages
>- **Challenge** 21 (33000 XP)
>___
>***Legendary Resistance (3/Day).*** If the lich fails a saving throw, it can choose to succeed instead.
>
>***Rejuvenation.*** If it has a phylactery, a destroyed lich gains a new body in 1d10 days, regaining all its hit points and becoming active again. The new body appears within 5 feet of the phylactery.
>
>***Spellcasting.*** The lich is an 18th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 20, +12 to hit with spell attacks). The lich has the following wizard spells prepared:
>
>• Cantrips (at will): mage hand, prestidigitation, ray of frost
>• 1st level (4 slots): detect magic, magic missile, shield, thunderwave
>• 2nd level (3 slots): detect thoughts, invisibility, Melf's acid arrow, mirror image
>• 3rd level (3 slots): animate dead, counterspell, dispel magic, fireball
>• 4th level (3 slots): blight, dimension door
>• 5th level (3 slots): cloudkill, scrying
>• 6th level (1 slot): disintegrate, globe of invulnerability
>• 7th level (1 slot): finger of death, plane shift
>• 8th level (1 slot): dominate monster, power word stun
>• 9th level (1 slot): power word kill
>
>***Turn Resistance.*** The lich has advantage on saving throws against any effect that turns undead.
>
>### Actions
>***Paralyzing Touch.*** Melee Spell Attack: +12 to hit, reach 5 ft., one creature. *Hit*: 10 (3d6) cold damage. The target must succeed on a DC 18 Constitution saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.
>
>### Legendary Actions
>The lich can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The lich regains spent legendary actions at the start of its turn.
>
>- **Cantrip.** The lich casts a cantrip.
>- **Paralyzing Touch (Costs 2 Actions).** The lich uses its Paralyzing Touch.
>- **Frightening Gaze (Costs 2 Actions).** The lich fixes its gaze on one creature it can see within 10 feet of it. The target must succeed on a DC 18 Wisdom saving throw against this magic or become frightened for 1 minute. The frightened target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a target's saving throw is successful or the effect ends for it, the target is immune to the lich's gaze for the next 24 hours.
>- **Disrupt Life (Costs 3 Actions).** Each non-undead creature within 20 feet of the lich must make a DC 18 Constitution saving throw against this magic, taking 21 (6d6) necrotic damage on a failed save, or half as much damage on a successful one.
>
>`;
// endregion

if (typeof module !== "undefined") {
	module.exports = {
		StatblockConverter
	};
}
