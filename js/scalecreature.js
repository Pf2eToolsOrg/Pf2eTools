"use strict";

const ScaleCreature = {

	// Tables do not include entries for level 25, just use level 24
	_LvlAbilityMods: {
		"-1": [3, 3, 2, 0],
		"0": [3, 3, 2, 0],
		"1": [5, 4, 3, 1],
		"2": [5, 4, 3, 1],
		"3": [5, 4, 3, 1],
		"4": [6, 5, 3, 2],
		"5": [6, 5, 4, 2],
		"6": [7, 5, 3, 2],
		"7": [7, 6, 4, 2],
		"8": [7, 6, 4, 3],
		"9": [7, 6, 4, 3],
		"10": [8, 7, 5, 3],
		"11": [8, 7, 5, 3],
		"12": [8, 7, 5, 4],
		"13": [9, 8, 5, 4],
		"14": [9, 8, 5, 4],
		"15": [9, 8, 6, 4],
		"16": [10, 9, 6, 5],
		"17": [10, 9, 6, 5],
		"18": [10, 9, 6, 5],
		"19": [11, 10, 6, 5],
		"20": [11, 10, 7, 6],
		"21": [11, 10, 7, 6],
		"22": [11, 10, 8, 6],
		"23": [11, 10, 8, 6],
		"24": [13, 12, 9, 7],
		"25": [13, 12, 9, 7],
	},
	_LvlPerception: {
		"-1": [9, 8, 5, 2, 0],
		"0": [10, 9, 6, 3, 1],
		"1": [11, 10, 7, 4, 2],
		"2": [12, 11, 8, 5, 3],
		"3": [14, 12, 9, 6, 4],
		"4": [15, 14, 11, 8, 6],
		"5": [17, 15, 12, 9, 7],
		"6": [18, 17, 14, 11, 8],
		"7": [20, 18, 15, 12, 10],
		"8": [21, 19, 16, 13, 11],
		"9": [23, 21, 18, 15, 12],
		"10": [24, 22, 19, 16, 14],
		"11": [26, 24, 21, 18, 15],
		"12": [27, 25, 22, 19, 16],
		"13": [29, 26, 23, 20, 18],
		"14": [30, 28, 25, 22, 19],
		"15": [32, 29, 26, 23, 20],
		"16": [33, 30, 28, 25, 22],
		"17": [35, 32, 29, 26, 23],
		"18": [36, 33, 30, 27, 24],
		"19": [38, 35, 32, 29, 26],
		"20": [39, 36, 33, 30, 27],
		"21": [41, 38, 35, 32, 28],
		"22": [43, 39, 36, 33, 30],
		"23": [44, 40, 37, 34, 31],
		"24": [46, 42, 38, 36, 32],
		"25": [46, 42, 38, 36, 32],
	},
	_LvlSkills: {
		"-1": [8, 5, 4, 2, 1],
		"0": [9, 6, 5, 3, 2],
		"1": [10, 7, 6, 4, 3],
		"2": [11, 8, 7, 5, 4],
		"3": [13, 10, 9, 7, 5],
		"4": [15, 12, 10, 8, 7],
		"5": [16, 13, 12, 10, 8],
		"6": [18, 15, 13, 11, 9],
		"7": [20, 17, 15, 13, 11],
		"8": [21, 18, 16, 14, 12],
		"9": [23, 20, 18, 16, 13],
		"10": [25, 22, 19, 17, 15],
		"11": [26, 23, 21, 19, 16],
		"12": [28, 25, 22, 20, 17],
		"13": [30, 27, 24, 22, 19],
		"14": [31, 28, 25, 23, 20],
		"15": [33, 30, 27, 25, 21],
		"16": [35, 32, 28, 26, 23],
		"17": [36, 33, 30, 28, 24],
		"18": [38, 35, 31, 29, 25],
		"19": [40, 37, 33, 31, 27],
		"20": [41, 38, 34, 32, 28],
		"21": [43, 40, 36, 34, 29],
		"22": [45, 42, 37, 35, 31],
		"23": [46, 43, 38, 36, 32],
		"24": [48, 45, 40, 38, 33],
		"25": [48, 45, 40, 38, 33],
	},
	_LvlAC: {
		"-1": [18, 15, 14, 12],
		"0": [19, 16, 15, 13],
		"1": [19, 16, 15, 13],
		"2": [21, 18, 17, 15],
		"3": [22, 19, 18, 16],
		"4": [24, 21, 20, 18],
		"5": [25, 22, 21, 19],
		"6": [27, 24, 23, 21],
		"7": [28, 25, 24, 22],
		"8": [30, 27, 26, 24],
		"9": [31, 28, 27, 25],
		"10": [33, 30, 29, 27],
		"11": [34, 31, 30, 28],
		"12": [36, 33, 32, 30],
		"13": [37, 34, 33, 31],
		"14": [39, 36, 35, 33],
		"15": [40, 37, 36, 34],
		"16": [42, 39, 38, 36],
		"17": [43, 40, 39, 37],
		"18": [45, 42, 41, 39],
		"19": [46, 43, 42, 40],
		"20": [48, 45, 44, 42],
		"21": [49, 46, 45, 43],
		"22": [51, 48, 47, 45],
		"23": [52, 49, 48, 46],
		"24": [54, 51, 50, 48],
		"25": [54, 51, 50, 48],
	},
	_LvlSavingThrows: {
		"-1": [9, 8, 5, 2, 0],
		"0": [10, 9, 6, 3, 1],
		"1": [11, 10, 7, 4, 2],
		"2": [12, 11, 8, 5, 3],
		"3": [14, 12, 9, 6, 4],
		"4": [15, 14, 11, 8, 6],
		"5": [17, 15, 12, 9, 7],
		"6": [18, 17, 14, 11, 8],
		"7": [20, 18, 15, 12, 10],
		"8": [21, 19, 16, 13, 11],
		"9": [23, 21, 18, 15, 12],
		"10": [24, 22, 19, 16, 14],
		"11": [26, 24, 21, 18, 15],
		"12": [27, 25, 22, 19, 16],
		"13": [29, 26, 23, 20, 18],
		"14": [30, 28, 25, 22, 19],
		"15": [32, 29, 26, 23, 20],
		"16": [33, 30, 28, 25, 22],
		"17": [35, 32, 29, 26, 23],
		"18": [36, 33, 30, 27, 24],
		"19": [38, 35, 32, 29, 26],
		"20": [39, 36, 33, 30, 27],
		"21": [41, 38, 35, 32, 28],
		"22": [43, 39, 36, 33, 30],
		"23": [44, 40, 37, 34, 31],
		"24": [46, 42, 38, 36, 32],
		"25": [46, 42, 38, 36, 32],
	},
	_LvlHP: {
		"-1": [9, 8, 7, 6, 5],
		"0": [20, 17, 16, 14, 13, 11],
		"1": [26, 24, 21, 19, 16, 14],
		"2": [40, 36, 32, 28, 25, 21],
		"3": [59, 53, 48, 42, 37, 31],
		"4": [78, 72, 63, 57, 48, 42],
		"5": [97, 91, 78, 72, 59, 53],
		"6": [123, 115, 99, 91, 75, 67],
		"7": [148, 140, 119, 111, 90, 82],
		"8": [173, 165, 139, 131, 105, 97],
		"9": [198, 190, 159, 151, 120, 112],
		"10": [223, 215, 179, 171, 135, 127],
		"11": [248, 240, 199, 191, 150, 142],
		"12": [273, 265, 219, 211, 165, 157],
		"13": [298, 290, 239, 231, 180, 172],
		"14": [323, 315, 259, 251, 195, 187],
		"15": [348, 340, 279, 271, 210, 202],
		"16": [373, 365, 299, 291, 225, 217],
		"17": [398, 390, 319, 311, 240, 232],
		"18": [423, 415, 339, 331, 255, 247],
		"19": [448, 440, 359, 351, 270, 262],
		"20": [473, 465, 379, 371, 285, 277],
		"21": [505, 495, 405, 395, 305, 295],
		"22": [544, 532, 436, 424, 329, 317],
		"23": [581, 569, 466, 454, 351, 339],
		"24": [633, 617, 508, 492, 383, 367],
		"25": [633, 617, 508, 492, 383, 367],
	},
	_regexHealingAbilities: /(healing |regeneration )(\d)+/g,
	_LvlResistanceWeakness: {
		"-1": [1, 1],
		"0": [3, 1],
		"1": [3, 2],
		"2": [5, 2],
		"3": [6, 3],
		"4": [7, 4],
		"5": [8, 4],
		"6": [9, 5],
		"7": [10, 5],
		"8": [11, 6],
		"9": [12, 6],
		"10": [13, 7],
		"11": [14, 7],
		"12": [15, 8],
		"13": [16, 8],
		"14": [17, 9],
		"15": [18, 9],
		"16": [19, 9],
		"17": [19, 10],
		"18": [20, 10],
		"19": [21, 11],
		"20": [22, 11],
		"21": [23, 12],
		"22": [24, 12],
		"23": [25, 13],
		"24": [26, 13],
		"25": [26, 13],
	},
	_LvlAttackBonus: {
		"-1": [10, 8, 6, 4],
		"0": [10, 8, 6, 4],
		"1": [11, 9, 7, 5],
		"2": [13, 11, 9, 7],
		"3": [14, 12, 10, 8],
		"4": [16, 14, 12, 9],
		"5": [17, 15, 13, 11],
		"6": [19, 17, 15, 12],
		"7": [20, 18, 16, 13],
		"8": [22, 20, 18, 15],
		"9": [23, 21, 19, 16],
		"10": [25, 23, 21, 17],
		"11": [27, 24, 22, 19],
		"12": [28, 26, 24, 20],
		"13": [29, 27, 25, 21],
		"14": [31, 29, 27, 23],
		"15": [32, 30, 28, 24],
		"16": [34, 32, 30, 25],
		"17": [35, 33, 31, 27],
		"18": [37, 35, 33, 28],
		"19": [38, 36, 34, 29],
		"20": [40, 38, 36, 31],
		"21": [41, 39, 37, 32],
		"22": [43, 41, 39, 33],
		"23": [44, 42, 40, 35],
		"24": [46, 44, 42, 36],
		"25": [46, 44, 42, 36],
	},
	_LvlExpectedDamage: {
		"-1": [4, 3, 3, 2],
		"0": [6, 5, 4, 3],
		"1": [8, 6, 5, 4],
		"2": [11, 9, 8, 6],
		"3": [15, 12, 10, 8],
		"4": [18, 14, 12, 9],
		"5": [20, 16, 13, 11],
		"6": [23, 18, 15, 12],
		"7": [25, 20, 17, 13],
		"8": [28, 22, 18, 15],
		"9": [30, 24, 20, 16],
		"10": [33, 26, 22, 17],
		"11": [35, 28, 23, 19],
		"12": [38, 30, 25, 20],
		"13": [40, 32, 27, 21],
		"14": [43, 34, 28, 23],
		"15": [45, 36, 30, 24],
		"16": [48, 37, 31, 25],
		"17": [50, 38, 32, 26],
		"18": [53, 40, 33, 27],
		"19": [55, 42, 35, 28],
		"20": [58, 44, 37, 29],
		"21": [60, 46, 38, 31],
		"22": [63, 48, 40, 32],
		"23": [65, 50, 42, 33],
		"24": [68, 52, 44, 35],
		"25": [68, 52, 44, 35],
	},
	_LvlDamageFormula: {
		"-1": ["1d6+1", "1d4+1", "1d4", "1d4"],
		"0": ["1d6+3", "1d6+2", "1d4+2", "1d4+1"],
		"1": ["1d8+4", "1d6+3", "1d6+2", "1d4+2"],
		"2": ["1d12+4", "1d10+4", "1d8+4", "1d6+3"],
		"3": ["1d12+8", "1d10+6", "1d8+6", "1d6+5"],
		"4": ["2d10+7", "2d8+5", "2d6+5", "2d4+4"],
		"5": ["2d12+7", "2d8+7", "2d6+6", "2d4+6"],
		"6": ["2d12+10", "2d8+9", "2d6+8", "2d4+7"],
		"7": ["2d12+12", "2d10+9", "2d8+8", "2d6+6"],
		"8": ["2d12+15", "2d10+11", "2d8+9", "2d6+8"],
		"9": ["2d12+17", "2d10+13", "2d8+11", "2d6+9"],
		"10": ["2d12+20", "2d12+13", "2d10+11", "2d6+10"],
		"11": ["2d12+22", "2d12+15", "2d10+12", "2d8+10"],
		"12": ["3d12+19", "3d10+14", "3d8+12", "3d6+10"],
		"13": ["3d12+21", "3d10+16", "3d8+14", "3d6+11"],
		"14": ["3d12+24", "3d10+18", "3d8+15", "3d6+13"],
		"15": ["3d12+26", "3d12+17", "3d10+14", "3d6+14"],
		"16": ["3d12+29", "3d12+18", "3d10+15", "3d6+15"],
		"17": ["3d12+31", "3d12+19", "3d10+16", "3d6+16"],
		"18": ["3d12+34", "3d12+20", "3d10+17", "3d6+17"],
		"19": ["4d12+29", "4d10+20", "4d8+17", "4d6+14"],
		"20": ["4d12+32", "4d10+22", "4d8+19", "4d6+15"],
		"21": ["4d12+34", "4d10+24", "4d8+20", "4d6+17"],
		"22": ["4d12+37", "4d10+26", "4d8+22", "4d6+18"],
		"23": ["4d12+39", "4d12+24", "4d10+20", "4d6+19"],
		"24": ["4d12+42", "4d12+26", "4d10+22", "4d6+21"],
		"25": ["4d12+42", "4d12+26", "4d10+22", "4d6+21"],
	},
	_LvlSpellAtkBonus: {
		"-1": [11, 8, 5],
		"0": [11, 8, 5],
		"1": [12, 9, 6],
		"2": [14, 10, 7],
		"3": [15, 12, 9],
		"4": [17, 13, 10],
		"5": [18, 14, 11],
		"6": [19, 16, 13],
		"7": [21, 17, 14],
		"8": [22, 18, 15],
		"9": [24, 20, 17],
		"10": [25, 21, 18],
		"11": [26, 22, 19],
		"12": [28, 24, 21],
		"13": [29, 25, 22],
		"14": [31, 26, 23],
		"15": [32, 28, 25],
		"16": [33, 29, 26],
		"17": [35, 30, 27],
		"18": [36, 32, 29],
		"19": [38, 33, 30],
		"20": [39, 34, 31],
		"21": [40, 36, 33],
		"22": [42, 37, 34],
		"23": [43, 38, 35],
		"24": [44, 40, 37],
		"25": [44, 40, 37],
	},
	_LvlSpellDC: {
		"-1": [19, 16, 13],
		"0": [19, 16, 13],
		"1": [20, 17, 14],
		"2": [22, 18, 15],
		"3": [23, 20, 17],
		"4": [25, 21, 18],
		"5": [26, 22, 19],
		"6": [27, 24, 21],
		"7": [29, 25, 22],
		"8": [30, 26, 23],
		"9": [32, 28, 25],
		"10": [33, 29, 26],
		"11": [34, 30, 27],
		"12": [36, 32, 29],
		"13": [37, 33, 30],
		"14": [39, 34, 31],
		"15": [40, 36, 33],
		"16": [41, 37, 34],
		"17": [43, 38, 35],
		"18": [44, 40, 37],
		"19": [46, 41, 38],
		"20": [47, 42, 39],
		"21": [48, 44, 41],
		"22": [50, 45, 42],
		"23": [51, 46, 43],
		"24": [52, 48, 45],
		"25": [52, 48, 45],
	},
	_LvlSpellsPerLvl: {
		"-1": [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		"0": [3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		"1": [5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		"2": [5, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		"3": [5, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0],
		"4": [5, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0],
		"5": [5, 3, 3, 2, 0, 0, 0, 0, 0, 0, 0],
		"6": [5, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0],
		"7": [5, 3, 3, 3, 2, 0, 0, 0, 0, 0, 0],
		"8": [5, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0],
		"9": [5, 3, 3, 3, 3, 2, 0, 0, 0, 0, 0],
		"10": [5, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
		"11": [5, 3, 3, 3, 3, 3, 2, 0, 0, 0, 0],
		"12": [5, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0],
		"13": [5, 3, 3, 3, 3, 3, 3, 2, 0, 0, 0],
		"14": [5, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0],
		"15": [5, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0],
		"16": [5, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0],
		"17": [5, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0],
		"18": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0],
		"19": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
		"20": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
		"21": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2],
		"22": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2],
		"23": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		"24": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		"25": [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
	},
	// Unlimited Use | Limited Use
	_LvlAreaDamage: {
		"-1": [2, 4],
		"0": [4, 6],
		"1": [5, 7],
		"2": [7, 11],
		"3": [9, 14],
		"4": [11, 18],
		"5": [12, 21],
		"6": [14, 25],
		"7": [15, 28],
		"8": [17, 32],
		"9": [18, 35],
		"10": [20, 39],
		"11": [21, 42],
		"12": [23, 46],
		"13": [24, 49],
		"14": [26, 53],
		"15": [27, 56],
		"16": [28, 60],
		"17": [29, 63],
		"18": [30, 67],
		"19": [32, 70],
		"20": [33, 74],
		"21": [35, 77],
		"22": [36, 81],
		"23": [38, 84],
		"24": [39, 88],
		"25": [39, 88],
	},

	_rng: null,
	_initRng (cr, toLvl) {
		let h = CryptUtil.hashCode(toLvl);
		h = 31 * h + CryptUtil.hashCode(cr.source);
		h = 31 * h + CryptUtil.hashCode(cr.name);
		this._rng = Math.seed(h);
	},

	/**
	 * @async
	 * @param creature Creature data.
	 * @param toLvl target CR, as a number.
	 * @return {Promise<creature>} the scaled creature.
	 */
	async scale (creature, toLvl) {
		await this._pInitSpellCache();
		if (toLvl == null || toLvl === "Unknown") throw new Error("Attempting to scale unknown level!");

		this._initRng(creature, toLvl);
		creature = JSON.parse(JSON.stringify(creature));

		const lvlIn = creature.level;
		if (lvlIn === toLvl) throw new Error("Attempting to scale creature to own level!");
		if (lvlIn > 25) throw new Error("Attempting to scale a creature beyond level 25!");
		if (lvlIn < -1) throw new Error("Attempting to scale a creature below level -1!");

		if (lvlIn === toLvl + 1) creature = this._scaleWeak(creature);
		else if (lvlIn === toLvl - 1) creature = this._scaleElite(creature);
		else {
			// Use creature building rules: Gamemastery Guide, pages 56 ff.
			this._adjustAbilityMods(creature, lvlIn, toLvl);
			this._adjustPerception(creature, lvlIn, toLvl);
			this._adjustSkills(creature, lvlIn, toLvl);
			this._adjustAC(creature, lvlIn, toLvl);
			this._adjustSavingThrows(creature, lvlIn, toLvl);
			this._adjustHP(creature, lvlIn, toLvl);
			this._adjustItems(creature, lvlIn, toLvl);
			this._adjustAttacks(creature, lvlIn, toLvl);
			this._adjustSpellcasting(creature, lvlIn, toLvl);
			this._adjustAbilities(creature, lvlIn, toLvl);

			creature.level = toLvl;
			creature._displayName = `${creature.name} (Lvl ${toLvl})`;
			creature._isScaledLvl = toLvl;
			creature._originalLvl = creature._originalLvl || lvlIn;
		}

		return creature;
	},

	async _scaleElite (creature) {
		/*
		Elite Adjustments
		Sometimes you’ll want a creature that’s just a bit more powerful than normal so that you can present a challenge
		that would otherwise be trivial, or show that one enemy is stronger than its kin. To do this quickly and easily,
		apply the elite adjustments to its statistics as follows:
		• Increase the creature’s AC, attack modifiers, DCs, saving throws, Perception, and skill modifiers by 2.
		• Increase the damage of its Strikes and other offensive abilities by 2. If the creature has limits on how many
		  times or how often it can use an ability (such as a spellcaster’s spells or a dragon’s Breath Weapon),
		  increase the damage by 4 instead.
		• Increase the creature’s Hit Points based on its starting level (see the table below).
		Starting Level | HP Increase
		---------------+------------
		1 or lower     | 10
		2–4            | 15
		5–19           | 20
		20+            | 30
		 */
		Object.keys(creature.ac).forEach(key => {
			if (key !== "abilities") creature.ac[key] += 2;
		});
		["Fort", "Ref", "Will"].forEach(st => Object.keys(creature.savingThrows[st]).forEach(key => creature.savingThrows[st][key] += 2));
		Object.keys(creature.perception).forEach(key => creature.perception[key] += 2);
		Object.keys(creature.skills).forEach(skill => Object.keys(creature.skills[skill]).forEach(key => creature.skills[skill][key] += 2));
		if (creature.spellcasting != null) {
			creature.spellcasting.forEach(sc => {
				if (sc.DC) sc.DC += 2;
				if (sc.attack) sc.attack += 2;
			});
		}
		creature.attacks.forEach(a => {
			a.attack += 2;
			a.damage = a.damage.replace(/(\d+d\d+)([+-]?\d*)/, (formula, formulaNoMod, mod) => {
				if (!mod) return `${formula}+2`;
				else {
					if (Number(mod) + 2 > 0) return `${formulaNoMod}+${Number(mod) + 2}`;
					else if (Number(mod) + 2 < 0) return `${formulaNoMod}${Number(mod) + 2}`;
					else return `${formulaNoMod}`
				}
			});
		});
		const adjustAbility = (ab) => {
			const {isLimited, isArea} = this._isAbilityAreaLimited(ab);
			const bonus = isLimited ? 4 : 2;
			ab.entries = ab.entries.map(e => {
				if (typeof e === "string") {
					// Do not scale flat check DCs
					e = e.replaceAll(/DC (\d+)(?!\d* flat)/g, (...m) => {
						return `DC ${Number(m[1]) + 2}`;
					});
					// Do not scale status, circumstance, item bonus...
					e = e.replaceAll(/@hit (\d+)/g, (...m) => {
						return `@hit ${Number(m[1]) + 2}`;
					});
					e = e.replaceAll(/@damage (\d+d\d+)([+-]?\d*)/g, (formula, formulaNoMod, mod) => {
						if (!mod) return `@damage ${formula}+${bonus}`;
						else {
							if (Number(mod) + bonus > 0) return `@damage ${formulaNoMod}+${Number(mod) + bonus}`;
							else if (Number(mod) + bonus < 0) return `@damage ${formulaNoMod}${Number(mod) + bonus}`;
							else return `@damage ${formulaNoMod}`
						}
					});
				} else throw new Error(`Unhandled entry type.`);
				return e;
			});
			return ab
		};
		creature.abilitiesTop.map(ab => adjustAbility(ab));
		creature.abilitiesMid.map(ab => adjustAbility(ab));
		creature.abilitiesBot.map(ab => adjustAbility(ab));
		if (creature.level < 2) creature.hp[0].hp += 10;
		else if (creature.level < 5) creature.hp[0].hp += 15;
		else if (creature.level < 20) creature.hp[0].hp += 20;
		else creature.hp[0].hp += 30;

		creature._displayName = `Elite ${creature.name}`;
		creature.level += 1;
		creature._isScaledLvl = creature.level;
		creature._originalLvl = creature._originalLvl || creature.level;
		return creature;
	},

	async _scaleWeak (creature) {
		/*
		Weak Adjustments
		Sometimes you’ll want a creature that’s weaker than normal so you can use a creature that would otherwise be too
		challenging, or show that one enemy is weaker than its kin. To do this quickly and easily, apply the weak
		adjustments to its statistics as follows.
		• Decrease the creature’s AC, attack modifiers, DCs, saving throws, and skill modifiers by 2.
		• Decrease the damage of its Strikes and other offensive abilities by 2. If the creature has limits on how many
		  times or how often it can use an ability (such as a spellcaster’s spells or a dragon’s Breath Weapon),
		  decrease the damage by 4 instead.
		• Decrease the creature’s HP based on its starting level.
		Starting Level | HP Decrease
		---------------+------------
		1–2            | –10
		3–5            | –15
		6–20           | –20
		21+            | –30
		 */
		Object.keys(creature.ac).forEach(key => {
			if (key !== "abilities") creature.ac[key] -= 2;
		});
		["Fort", "Ref", "Will"].forEach(st => Object.keys(creature.savingThrows[st]).forEach(key => creature.savingThrows[st][key] -= 2));
		Object.keys(creature.perception).forEach(key => creature.perception[key] -= 2);
		Object.keys(creature.skills).forEach(skill => Object.keys(creature.skills[skill]).forEach(key => creature.skills[skill][key] -= 2));
		if (creature.spellcasting != null) {
			creature.spellcasting.forEach(sc => {
				if (sc.DC) sc.DC -= 2;
				if (sc.attack) sc.attack -= 2;
			});
		}
		creature.attacks.forEach(a => {
			a.attack -= 2;
			a.damage = a.damage.replace(/(\d+d\d+)([+-]?\d*)/, (formula, formulaNoMod, mod) => {
				if (!mod) return `${formula}-2`;
				else {
					if (Number(mod) - 2 > 0) return `${formulaNoMod}+${Number(mod) - 2}`;
					else if (Number(mod) - 2 < 0) return `${formulaNoMod}${Number(mod) - 2}`;
					else return `${formulaNoMod}`
				}
			});
		});
		const adjustAbility = (ab) => {
			const {isLimited, isArea} = this._isAbilityAreaLimited(ab);
			const bonus = isLimited ? -4 : -2;
			ab.entries = ab.entries.map(e => {
				if (typeof e === "string") {
					// Do not scale flat check DCs
					e = e.replaceAll(/DC (\d+)(?!\d* flat)/g, (...m) => {
						return `DC ${Number(m[1]) - 2}`;
					});
					// Do not scale status, circumstance, item bonus...
					e = e.replaceAll(/@hit (\d+)/g, (...m) => {
						return `@hit ${Number(m[1]) - 2}`;
					});
					e = e.replaceAll(/@damage (\d+d\d+)([+-]?\d*)/g, (formula, formulaNoMod, mod) => {
						if (!mod) return `@damage ${formula}+${bonus}`;
						else {
							if (Number(mod) + bonus > 0) return `@damage ${formulaNoMod}+${Number(mod) + bonus}`;
							else if (Number(mod) + bonus < 0) return `@damage ${formulaNoMod}${Number(mod) + bonus}`;
							else return `@damage ${formulaNoMod}`
						}
					});
				} else throw new Error(`Unhandled entry type.`);
				return e;
			});
			return ab
		};
		creature.abilitiesTop.map(ab => adjustAbility(ab));
		creature.abilitiesMid.map(ab => adjustAbility(ab));
		creature.abilitiesBot.map(ab => adjustAbility(ab));
		if (creature.level < 2) creature.hp[0].hp -= 10;
		else if (creature.level < 5) creature.hp[0].hp -= 15;
		else if (creature.level < 20) creature.hp[0].hp -= 20;
		else creature.hp[0].hp -= 30;

		creature._displayName = `Weak ${creature.name}`;
		creature.level -= 1;
		creature._isScaledLvl = creature.level;
		creature._originalLvl = creature._originalLvl || creature.level;
		return creature;
	},

	_getIntervalAndIdx (lvl, map, value) {
		const ranges = map[lvl];
		let i = 0;
		let I = [0, value]
		let idx = [-1, -1]
		while (i < ranges.length) {
			if (ranges[i] >= value) {
				I[1] = ranges[i]
				idx[1] = i;
			} else {
				I[0] = ranges[i];
				idx[0] = i;
				break;
			}
			i++;
		}
		return {I, idx}
	},

	_intervalTransform (x, I0, I1) {
		const [a0, b0] = I0;
		const [a1, b1] = I1;
		return Math.round((x - a0) * ((b1 - a1) / (b0 - a0)) + a1)
	},

	_scaleValue (lvlIn, toLvl, value, map) {
		const {I: I0, idx} = this._getIntervalAndIdx(lvlIn, map, value);
		let I1;
		if (idx[1] === -1) I1 = [map[toLvl][idx[0]], map[toLvl][idx[0]] + I0[1] - I0[0]];
		else if (idx[0] === -1) I1 = [map[toLvl][idx[1]] - I0[1] + I0[0], map[toLvl][idx[1]]];
		else I1 = [map[toLvl][idx[0]], map[toLvl][idx[1]]];
		return this._intervalTransform(value, I0, I1)
	},

	_getDiceEV (diceExp) {
		diceExp = diceExp.replace(/\s*/g, "");
		const asAverages = diceExp.replace(/d(\d+)/gi, (...m) => {
			return ` * ${(Number(m[1]) + 1) / 2}`;
		});
		return MiscUtil.expEval(asAverages);
	},

	_scaleDice (initFormula, expectation, opts) {
		opts = opts || {};
		// Usually a damage expression works best when roughly half the damage is from dice and half is from the flat modifier.
		const targetDice = opts.noMod ? expectation : expectation / 2;
		const dice = Number(initFormula.match(/d(\d+)/)[1]);
		const numDice = Math.round(targetDice * 2 / (dice + 1));
		const mod = opts.noMod ? 0 : Math.round(expectation - numDice * (dice + 1) / 2);
		return `${numDice}d${dice}${mod ? `+${mod}` : ""}`;
	},

	_adjustAbilityMods (creature, lvlIn, toLvl) {
		Object.keys(creature.abilityMods).forEach(abMod => {
			const mod = creature.abilityMods[abMod];
			const levelDiff = toLvl - lvlIn;
			if (mod < -3) {
				// Do nothing for terrible scores (high level zombies should stay dumb)
			} else if (mod < 0) {
				// slightly increase if toLvl >> lvlIn
				creature.abilityMods[abMod] += Math.floor(levelDiff / 5);
			} else {
				creature.abilityMods[abMod] = this._scaleValue(lvlIn, toLvl, mod, this._LvlAbilityMods);
			}
		});
	},

	_adjustPerception (creature, lvlIn, toLvl) {
		const defaultPerception = creature.perception.default;
		creature.perception.default = this._scaleValue(lvlIn, toLvl, defaultPerception, this._LvlPerception);
		Object.keys(creature.perception).forEach(key => {
			if (key !== "default") creature.perception[key] += creature.perception.default - defaultPerception;
		});
	},

	_adjustSkills (creature, lvlIn, toLvl) {
		Object.keys(creature.skills).forEach(skill => {
			const defaultSkill = creature.skills[skill].default;
			creature.skills[skill].default = this._scaleValue(lvlIn, toLvl, defaultSkill, this._LvlSkills);
			Object.keys(creature.skills[skill]).forEach(key => {
				if (key !== "default") creature.skills[skill][key] += creature.skills[skill].default - defaultSkill;
			});
		});
	},

	_adjustAC (creature, lvlIn, toLvl) {
		const defaultAc = creature.ac.default;
		creature.ac.default = this._scaleValue(lvlIn, toLvl, defaultAc, this._LvlAC);
		Object.keys(creature.ac).forEach(key => {
			if (key !== "default" && key !== "abilities") creature.ac[key] += creature.ac.default - defaultAc;
		});
	},

	_adjustSavingThrows (creature, lvlIn, toLvl) {
		["Fort", "Ref", "Will"].forEach(st => {
			const defaultSave = creature.savingThrows[st].default;
			creature.savingThrows[st].default = this._scaleValue(lvlIn, toLvl, defaultSave, this._LvlSavingThrows);
			Object.keys(creature.savingThrows[st]).forEach(key => {
				if (key !== "default") creature.savingThrows[st][key] += creature.savingThrows[st].default - defaultSave;
			});
		});
	},

	_adjustItems (creature, lvlIn, toLvl) {
		// TODO: up/downgrade items based on level
	},

	_adjustHP (creature, lvlIn, toLvl) {
		for (let hp of creature.hp) {
			hp.hp = this._scaleValue(lvlIn, toLvl, hp.hp, this._LvlHP);
			if (hp.hp > 100) {
				hp.hp += 2;
				hp.hp -= hp.hp % 5
			}
			for (let i = 0; i < (hp.abilities || []).length; i++) {
				hp.abilities[i] = hp.abilities[i].replace(this._regexHealingAbilities, (match, name, amt) => {
					const amount = this._scaleValue(lvlIn, toLvl, Number(amt), this._LvlExpectedDamage)
					return `${name}${amount}`;
				});
			}
		}
	},

	_adjustResistances (creature, lvlIn, toLvl) {
		// TODO:
	},

	_adjustAttacks (creature, lvlIn, toLvl) {
		if (creature.attacks == null) return;
		creature.attacks.forEach(a => {
			a.attack = this._scaleValue(lvlIn, toLvl, a.attack, this._LvlAttackBonus);
			const dpr = (a.damage.match(/\d+d\d+[+-]?\d*/g) || []).map(f => this._getDiceEV(f)).reduce((a, b) => a + b, 0);
			const scaledDpr = this._scaleValue(lvlIn, toLvl, dpr, this._LvlExpectedDamage);
			a.damage = a.damage.replaceAll(/\d+d\d+([+-]?\d*)/g, (formula, mod) => {
				const scaleTo = this._getDiceEV(formula) * scaledDpr / dpr;
				const opts = mod ? {} : {noMod: true};
				return this._scaleDice(formula, scaleTo, opts);
			});
		});
	},

	_adjustSpellcasting (creature, lvlIn, toLvl) {
		if (creature.spellcasting == null) return;
		creature.spellcasting.forEach(sc => {
			if (sc.DC) sc.DC = this._scaleValue(lvlIn, toLvl, sc.DC, this._LvlSpellDC);
			if (sc.attack) sc.attack = this._scaleValue(lvlIn, toLvl, sc.attack, this._LvlSpellAtkBonus);
			if (sc.type === "Prepared" || sc.type === "Spontaneous") {
				const countPreperations = (lvl) => sc.entry[lvl].spells.map(it => Number(it.amount) || 1).reduce((a, b) => a + b, 0);
				const highestSpell = Object.keys(sc.entry).map(it => Number(it)).filter(Number).sort(SortUtil.ascSort).reverse()[0];
				const bonusSpells = Math.max(highestSpell != null ? sc.entry[highestSpell].slots || countPreperations(highestSpell) - this._LvlSpellsPerLvl[lvlIn][highestSpell] : 0, 0);
				if (lvlIn > toLvl) {
					for (let i = 10; i > Math.ceil(toLvl / 2); i--) {
						delete sc.entry[i];
					}
					sc.entry[0].level = Math.ceil(toLvl / 2);
					if (sc.type === "Prepared") {
						// Need to remove some preparations
						for (let i = Math.ceil(toLvl / 2); i > -1; i--) {
							const preps = this._LvlSpellsPerLvl[toLvl][i] + bonusSpells;
							let tries = 20;
							while (countPreperations(i) > preps && tries-- > 0) {
								const rand = RollerUtil.roll(sc.entry[i].spells.length, this._rng);
								if (Number(sc.entry[i].spells[rand].amount)) {
									if (Number(sc.entry[i].spells[rand].amount) > 2) sc.entry[i].spells[rand].amount -= 1;
									else delete sc.entry[i].spells[rand].amount;
								} else if (sc.entry[i].spells[rand].amount == null) sc.entry[i].spells.splice(rand, 1);
							}
						}
					} else if (sc.type === "Spontaneous") {
						for (let i = Math.ceil(toLvl / 2); i > 0; i--) {
							sc.entry[i].slots = this._LvlSpellsPerLvl[toLvl][i] + bonusSpells;
						}
					}
				} else {
					sc.entry[0].level = Math.min(10, Math.ceil(toLvl / 2));
					// TODO: Instead of random spells, select thematically appropriate ones
					const addSpell = (lvl) => {
						let randomSpell = null;
						let tries = 20;
						while ((sc.entry[lvl].spells.map(it => it.name.toLowerCase()).includes(randomSpell) || !randomSpell) && tries-- > 0) {
							randomSpell = this._spells[sc.tradition][lvl][RollerUtil.roll(this._spells[sc.tradition][lvl].length, this._rng)];
						}
						sc.entry[lvl].spells.push({"name": randomSpell});
					}
					// generate new spell entries
					if (sc.type === "Prepared") {
						for (let i = highestSpell; i <= Math.min(10, Math.ceil(toLvl / 2)); i++) {
							const preps = this._LvlSpellsPerLvl[toLvl][i] + bonusSpells;
							sc.entry[i] = sc.entry[i] || {"spells": []};
							while (countPreperations(i) < preps) {
								addSpell(i);
							}
							sc.entry[i].spells.last().notes = `or other {@filter ${sc.tradition.toLowerCase()} ${Parser.getOrdinalForm(i)} level spells|spells|source=CRB|tradition=${sc.tradition}|level=${i}}`;
						}
					} else if (sc.type === "Spontaneous") {
						for (let i = highestSpell; i <= Math.min(10, Math.ceil(toLvl / 2)); i++) {
							sc.entry[i] = sc.entry[i] || {"spells": []};
							sc.entry[i].slots = this._LvlSpellsPerLvl[toLvl][i] + bonusSpells;
							while (sc.entry[i].spells.length < sc.entry[i].slots - 1) {
								addSpell(i);
							}
							sc.entry[i].spells.last().notes = `or other {@filter ${sc.tradition.toLowerCase()} ${Parser.getOrdinalForm(i)} level spells|spells|source=CRB|tradition=${sc.tradition}|level=${i}}`;
						}
					}
				}
			}
			// TODO: Adjust Innate spellcasting features slightly? ~> Maybe remove severely over-leveled spells
		});
	},
	_spells: null,
	_pInitSpellCache () {
		if (this._spells) return Promise.resolve();

		this._spells = {};
		return this._spells = DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/spells-crb.json`).then(data => {
			this.__initSpellCache(data);
		});
	},
	__initSpellCache (data) {
		data.spell.forEach(sp => {
			(sp.traditions || []).forEach(t => {
				let it = (this._spells[t] = this._spells[t] || {});
				it = (it[sp.level] = it[sp.level] || []);
				it.push(sp.name.toLowerCase());
			});
		});
	},

	_adjustAbilities (creature, lvlIn, toLvl) {
		const adjustAbility = (ab) => {
			// TODO: Scale areas, ranges, durations, number of targets...
			const {isLimited, isArea} = this._isAbilityAreaLimited(ab);

			ab.entries = ab.entries.map(e => {
				if (typeof e === "object") {
					if (e.type === "affliction") {
						e.DC = this._scaleValue(lvlIn, toLvl, e.DC, this._LvlSpellDC);
						for (let s of e.stages) {
							s.entry.replaceAll(/@damage (\d+d\d+[+-]?\d*)/g, (...m) => {
								return `@damage ${this._scaleDice(m[1], this._scaleValue(lvlIn, toLvl, this._getDiceEV(m[1]), this._LvlExpectedDamage))}`;
							});
						}
					}
				} else if (typeof e === "string") {
					// Do not scale flat check DCs
					e = e.replaceAll(/DC (\d+)(?!\d* flat)/g, (...m) => {
						return `DC ${this._scaleValue(lvlIn, toLvl, Number(m[1]), this._LvlSpellDC)}`;
					});
					// Do not scale status, circumstance, item bonus...
					e = e.replaceAll(/@hit (\d+)/g, (...m) => {
						return `@hit ${this._scaleValue(lvlIn, toLvl, Number(m[1]), this._LvlAttackBonus)}`;
					});
					e = e.replaceAll(/@damage (\d+d\d+[+-]?\d*)/g, (...m) => {
						const scaleTo = isArea ? this._LvlAreaDamage[toLvl][Number(isLimited)] / this._LvlAreaDamage[lvlIn][Number(isLimited)] * this._getDiceEV(m[1]) : this._scaleValue(lvlIn, toLvl, this._getDiceEV(m[1]), this._LvlExpectedDamage);
						return `@damage ${this._scaleDice(m[1], scaleTo)}`;
					});
				} else throw new Error(`Unhandled entry type ${typeof e}.`);
				return e;
			});
			return ab
		};
		creature.abilitiesTop.map(ab => adjustAbility(ab));
		creature.abilitiesMid.map(ab => adjustAbility(ab));
		creature.abilitiesBot.map(ab => adjustAbility(ab));
	},
	_isAbilityAreaLimited (ab) {
		let isArea = Boolean(ab.area);
		let isLimited = false;
		const entry = ab.entries.filter(it => typeof it === "string").join(" ");
		if (entry.match(/foot (cone|line|burst|emanation|cylinder)/i)) isArea = true;
		if (entry.match(/can.t use .+ again\W/i)) isLimited = true;
		return {isLimited, isArea}
	},
};
