"use strict";

class SchoolConvert {
	static tryConvertSchool (s, cbMan) {
		const school = (s.school || "").toLowerCase().trim();
		if (!school) return cbMan ? cbMan(s.school, "Spell school requires manual conversion") : null;

		const out = SchoolConvert._RES_SCHOOL.find(it => it.regex.test(school));
		if (out) s.school = out;
		else cbMan(s.school, "Spell school requires manual conversion");
	}
}
SchoolConvert._RES_SCHOOL = [];
Object.entries({
	"transmutation": "T",
	"necromancy": "N",
	"conjuration": "C",
	"abjuration": "A",
	"enchantment": "E",
	"evocation": "V",
	"illusion": "I",
	"divination": "D"
}).forEach(([k, v]) => {
	SchoolConvert._RES_SCHOOL.push({
		output: v,
		regex: RegExp(k, "i")
	});
});

// TODO rework this to be written in JavaScript
class SpellConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Spell",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "spell"
			}
		);
	}

	_renderSidebar (parent, $wrpSidebar) {
		$wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = {cbWarning, cbOutput, isAppend};

		switch (this._state.mode) {
			case "txt": return this.doParseText(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}

	_getSample (format) {
		switch (format) {
			case "txt": return SpellConverter.SAMPLE_TEXT;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}

	/**
	 * Takes a string with a unit of time for duration, and converts it to the proper input form. Instantaneous becomes
	 * instant, and any plural form such as minutes or hours becomes singular, minute or hours.
	 */
	static getTimeUnit (input) {
		if (input.toLowerCase() === "instantaneous") {
			return "instant";
		} else if (input.toLowerCase().endsWith("s")) {
			return input.toLowerCase().substring(0, input.length - 1);
		} else {
			return input.toLowerCase();
		}
	}

	static getDistanceUnit (input) {
		input = input.toLowerCase();
		if (input === "foot") return "feet";
		return input;
	}

	/**
	 * Parses spells from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseText (inText, options) {
		options = BaseConverter._getValidOptions(options);

		/**
		 * If the current line ends in a comma, we can assume the next line is a broken/wrapped part of the current line
		 */
		function absorbBrokenLine () {
			const NO_ABSORB_SUBTITLES = [
				"CASTING TIME",
				"RANGE",
				"COMPONENTS",
				"DURATION",
				"CLASSES",
				"AT HIGHER LEVELS"
			];

			if (curLine) {
				if (curLine.trim().endsWith(",")) {
					const nxtLine = toConvert[++i];
					if (!nxtLine) return false;
					curLine = `${curLine.trim()} ${nxtLine.trim()}`;
					return true;
				}

				const nxtLine = toConvert[i + 1];
				if (!nxtLine) return false;

				if (ConvertUtil.isNameLine(nxtLine)) return false; // avoid absorbing the start of traits
				if (NO_ABSORB_SUBTITLES.some(it => nxtLine.toUpperCase().startsWith(it))) return false;

				i++;
				curLine = `${curLine.trim()} ${nxtLine.trim()}`;
				return true;
			}
			return false;
		}

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = (() => {
			const clean = this._getCleanInput(inText);
			return clean.split("\n").filter(it => it && it.trim());
		})();
		const spell = {};
		spell.source = this._state.source;
		// for the user to fill out
		spell.page = this._state.page;

		let prevLine = null; // last line of text
		let curLine = null; // current line of text
		let i; // integer count for line number

		for (i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of spell
			if (i === 0) {
				spell.name = this._getAsTitle("name", curLine);
				continue;
			}

			// spell level, and school plus ritual
			if (i === 1) {
				SpellConverter._setCleanLevelSchoolRitual(spell, curLine, options);
				continue;
			}

			// casting time
			if (i === 2) {
				SpellConverter._setCleanCastingTime(spell, curLine);
				continue;
			}

			// range
			if (!curLine.indexOf_handleColon("Range")) {
				SpellConverter._setCleanRange(spell, curLine);
				continue;
			}

			// components
			if (!curLine.indexOf_handleColon("Components")) {
				SpellConverter._setCleanComponents(spell, curLine, options);
				continue;
			}

			// duration
			if (!curLine.indexOf_handleColon("Duration")) {
				SpellConverter._setCleanDuration(spell, curLine, options);
				continue;
			}

			// classes (optional)
			if (!curLine.indexOf_handleColon("Classes") || !curLine.indexOf_handleColon("Class")) {
				SpellConverter._setCleanClasses(spell, curLine, options);
				continue;
			}

			let isEntry = true; // turn false once we get to the end of the base level spell text, unless the loop ends at that time

			spell.entries = [];

			while (i < toConvert.length) {
				// goes into actions
				if (!curLine.indexOf_handleColon("At Higher Levels.") || !curLine.indexOf_handleColon("At Higher Levels")) {
					// make sure the last bit doesn't get added to the spell text
					isEntry = false;

					// noinspection StatementWithEmptyBodyJS
					while (absorbBrokenLine(true)) ;
					SpellConverter._setCleanHigherLevel(spell, curLine);
				} else if (isEntry) {
					// since all the headers have been put in everything else must be spell text until we get to the at higher level
					spell.entries.push(curLine);
				}
				i++;
				curLine = toConvert[i];
			}
		}

		this._doSpellPostProcess(spell, options);
		const statsOut = PropOrder.getOrdered(spell, "spell");
		options.cbOutput(statsOut, options.isAppend);
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	_doSpellPostProcess (stats, options) {
		const doCleanup = () => {
			// remove any empty arrays
			Object.keys(stats).forEach(k => {
				if (stats[k] instanceof Array && stats[k].length === 0) {
					delete stats[k];
				}
			});
		};
		TagCondition.tryTagConditions(stats);
		DamageTypeTag.tryRun(stats);
		doCleanup();
	}

	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	// cuts the string for spell level, school and ritual, checks if the first character is a number "4th-level transmutation" and parses as a leveled spell.
	// if not it treats it as a cantrip "Transmutation cantrip" does not check for ritual tag if its a cantrip
	// throws a warning if no valid school was found, does not process 10th-level or higher spells at all
	// calls setSchool for adding the correct school letter tag
	static _setCleanLevelSchoolRitual (stats, line) {
		const leveledSpell = /^(\d)(?:st|nd|rd|th)(-?|\s)(\S+)\s+(\w+)(\s?)(\(ritual\))?/gi.exec(line.trim());
		if (leveledSpell) {
			// if a level 1-9 spell
			stats.level = leveledSpell[1];
			stats.school = leveledSpell[4].trim();
			SchoolConvert.tryConvertSchool(stats);
			if (/ritual/i.exec(leveledSpell[6])) stats.meta = {ritual: true};
		} else {
			// cantrip
			stats.level = 0;
			stats.school = line.split(" ")[0];
			SchoolConvert.tryConvertSchool(stats);
		}
	}

	// strips off the word range
	// tests with if else, first if its touch, then self range aura, self range cone, self range line, just self, ranged point, and a catch all for special ranges
	// used examples to have it hard code the correct tags for each range variant.
	static _setCleanRange (stats, line) {
		const rawRange = line.split_handleColon("Range", 1)[1];
		if (/touch/gi.exec(rawRange.trim())) {
			stats.range = {
				type: "point",
				distance: {
					type: "touch"
				}
			};
		} else if (/self/gi.exec(rawRange.trim())) {
			if (/foot/gi.exec(rawRange.trim())) {
				if (/radius/gi.exec(rawRange.trim())) {
					const x = rawRange.split(/[\s-()]+/);
					stats.range = {
						type: "radius",
						distance: {
							type: SpellConverter.getDistanceUnit(x[2]),
							amount: Number(x[1])
						}
					};
				} else if (/cone/gi.exec(rawRange.trim())) {
					const x = rawRange.split(/[\s-()]+/);
					stats.range = {
						type: "cone",
						distance: {
							type: SpellConverter.getDistanceUnit(x[2]),
							amount: Number(x[1])
						}
					};
				} else if (/line/gi.exec(rawRange.trim())) {
					const x = rawRange.split(/[\s-()]+/);
					stats.range = {
						type: "line",
						distance: {
							type: SpellConverter.getDistanceUnit(x[2]),
							amount: Number(x[1])
						}
					};
				}
			} else {
				stats.range = {
					type: "point",
					distance: {
						type: "self"
					}
				};
			}
		} else if (/feet/gi.exec(rawRange.trim())) {
			const x = rawRange.split(/[\s-()]+/);
			stats.range = {
				type: "point",
				distance: {
					type: SpellConverter.getDistanceUnit(x[1]),
					amount: Number(x[0])
				}
			};
		} else {
			stats.range = {
				type: rawRange.split(/[\s-()]+/)
			};
		}
	}

	// splits the number from the string '1' from 'bonus action' then puts the number as the amount variable, and the text as the time and sets the tags with them.
	// incase there is no number for some reason there is an else.
	static _setCleanCastingTime (stats, line) {
		const str = line.split_handleColon("Casting Time", 1)[1].trim();
		if (/^([0-9]+)/.exec(str)) {
			const amount = str.split(" ")[0].trim();
			const time = str.replace(/[0-9]/g, "").trim();
			if (time.split(" ").length > 1) {
				const firstWord = time.match(/^(\S+)\s(.*)/).slice(1);
				firstWord[0] = firstWord[0].replace(/,/, "");
				stats.time = [{
					number: Number(amount),
					unit: SpellConverter.getTimeUnit(firstWord[0]),
					condition: firstWord[1]
				}];
			} else {
				stats.time = [{
					number: Number(amount),
					unit: SpellConverter.getTimeUnit(time)
				}];
			}
		} else {
			stats.time = [{
				unit: time
			}];
		}
	}

	// splits the line using commas before any () to make sure it keeps the material component text together
	// flips through each compnent in a loop incase they don't have all of them
	// material takes off the M and () to add the text
	// if there is a cost and extracts the number for it
	// checks if the word consume is in the line and sets the tag to true if it is
	static _setCleanComponents (stats, line, options) {
		const rawComponent = line.split_handleColon("Components", 1)[1].trim();
		const list = rawComponent.split(/,\s?(?![^(]*\))/gi);
		stats.components = {};
		for (let i = 0; list.length > i; i++) {
			if (/^v/i.exec(list[i].trim())) {
				stats.components["v"] = true;
			} else if (/^s/i.exec(list[i].trim())) {
				stats.components["s"] = true;
			} else if (/^m/i.test(list[i].trim())) {
				try {
					const materialText = /\(.+\)/.exec(list[i])[0].replace(/[()]/g, "");
					const cost = /\d*,?\d+\s?(?:cp|sp|ep|gp|pp)/gi.exec(/\(.+\)/.exec(list[i].trim()));
					const consume = /consume/i.exec(list[i].trim());
					if (cost && consume) {
						stats.components.m = {
							text: materialText,
							cost: Number(cost[0].split(" ")[0].replace(/,/g, "")),
							consume: true
						};
					} else if (cost) {
						stats.components.m = {
							text: materialText,
							cost: Number(cost[0].split(" ")[0].replace(/,/g, ""))
						};
					} else {
						stats.components.m = materialText;
					}
				} catch (error) {
					options.cbWarning(`Alignment "${rawComponent}" requires manual conversion`)
				}
			}
		}
	}

	// takes line and takes off duration header, then checks for in that order concentration, Instantaneous, until dispelled, and special
	// sets value same as in document, document sets all text inputs to lowercase through the getTimeUnit function
	// empty else statment at end is for putting in an error message when no duration was found
	static _setCleanDuration (stats, line, options) {
		const rawDuration = line.split_handleColon("Duration", 1)[1].trim();
		const focused = /^(Concentration)/gi.exec(rawDuration.trim());
		const instant = /^(Instantaneous)/gi.exec(rawDuration.trim());
		const permanent = /^(Until dispelled)/gi.exec(rawDuration.trim());
		const special = /^(special)/gi.exec(rawDuration.trim());

		if (focused) {
			const time = rawDuration.match(/\d+\s+[a-z]+/i);
			const time2 = time[0].split(" ");
			stats.duration = [{
				type: "timed",
				duration: {
					type: SpellConverter.getTimeUnit(time2[1]),
					amount: Number(time2[0])
				},
				concentration: true
			}];
		} else if (instant) {
			stats.duration = [{
				type: "instant"
			}];
		} else if (permanent) {
			const trigger = /(triggered)/gi.exec(rawDuration.trim());
			if (trigger) {
				stats.duration = [{
					type: "permanent",
					ends: [
						"dispel",
						"trigger"
					]
				}
				];
			} else {
				stats.duration = [{
					type: "permanent",
					ends: [
						"dispel"
					]
				}];
			}
		} else if (special) {
			stats.duration = [{
				type: "special"
			}];
		} else {
			const exists = /\d+\s+[a-z]+/gi.exec(rawDuration.trim());
			if (exists) {
				const time = rawDuration.match(/\d+\s+[a-z]+/i);
				const time2 = time[0].split(" ");
				stats.duration = [{
					type: "timed",
					duration: {
						type: SpellConverter.getTimeUnit(time2[1]),
						amount: Number(time2[0])
					}
				}];
			} else {
				// nothing was found/done
			}
		}
	}

	// takes the line, removes the Classes: fromt he front, then splits the classes into an array, using the comma's as the separator
	// loops through the array adding each class name with proper casing to a temporary array of objects
	// giving each object the source of PHB unless it is the artificer which gets ERLW
	// sets stats.classes' fromClassList key to the value of the array of objects
	static _setCleanClasses (stats, line, options) {
		let rawClasses;
		if (/^(Classes)/i.test(line)) {
			rawClasses = line.split_handleColon("Classes", 1)[1].trim();
		} else {
			rawClasses = line.split_handleColon("Class", 1)[1].trim();
		}

		const classList = rawClasses.split(/,\s*/i);
		const list = [];
		for (let i = 0; classList.length > i; i++) {
			classList[i] = classList[i].uppercaseFirst();
			if (classList[i] === "Artificer") {
				list.push({name: classList[i].uppercaseFirst(), source: "ERLW"});
			} else {
				list.push({name: classList[i].uppercaseFirst(), source: "PHB"});
			}
		}
		stats.classes = {fromClassList: list};
	}

	static _setCleanHigherLevel (stats, line) {
		const rawHigher = line.split_handleColon("At Higher Levels.", 1)[1].trim();
		if (!stats.entriesHigherLevel) {
			stats.entriesHigherLevel = [{
				type: "entries",
				name: "At Higher Levels",
				entries: [rawHigher]
			}];
		}
	}
}
// region sample
SpellConverter.SAMPLE_TEXT = `Chromatic Orb
1st-level evocation
Casting Time: 1 action
Range: 90 feet
Components: V, S, M (a diamond worth at least 50 gp)
Duration: Instantaneous

You hurl a 4-inch-diameter sphere of energy at a creature that you can see within range. You choose acid, cold, fire, lightning, poison, or thunder for the type of orb you create, and then make a ranged spell attack against the target. If the attack hits, the creature takes 3d8 damage of the type you chose.

At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.`;
// endregion
