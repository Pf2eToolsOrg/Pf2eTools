/* eslint-disable no-console */
const fs = require('fs');
var contents = [];

function recursiveCheck (file) {
	if (file.includes("bestiary-o") || file.includes("spells-")) checkFile(file);
	else if (fs.lstatSync(file).isDirectory()) {
		fs.readdirSync(file).forEach(nxt => {
			recursiveCheck(`${file}/${nxt}`)
		})
	}
}

function checkFile (file) {
	console.log(file);
	contents = JSON.parse(fs.readFileSync(file, 'utf8'));
	for (let i = 0; i < contents.monster.length; i++) {
		let monster = contents.monster[i];
		let name = monster.name;
		if (monster.spells) console.log(`${name} has "spells"`);
		if (monster.trait) {
			let trait = monster.trait;
			for (let j = 0; j < trait.length; j++) if (trait[j].name.includes("Spellcasting")) parseSpellcasting(name, trait[j], i);
		}
	}
}

function parseSpell (name) {
	let asterix = name.indexOf("*");
	let brackets = name.indexOf(" (");
	if (asterix !== -1) {
		return `{@spell ${name.substr(0, asterix)}}*`;
	} else if (brackets !== -1) {
		return `{@spell ${name.substr(0, brackets)}}${name.substring(brackets)}`;
	}
	return `{@spell ${name}}`;
}

function parseSpellcasting (monsterName, trait, contentsIndex) {
	let name = trait.name;
	console.log(monsterName);
	let spellcasting = [];
	let spellcastingEntry = {"name": name, "headerEntries": [trait.text[0]]};
	if (name.includes("Innate Spellcasting")) {
		console.log("has Innate Spellcasting");
		for (let i = 1; i < trait.text.length; i++) {
			let thisLine = trait.text[i];
			if (thisLine.includes("/day")) {
				let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcastingEntry.daily) spellcastingEntry.daily = {};
				spellcastingEntry.daily[property] = value;
			} else if (thisLine.startsWith("At will: ")) {
				spellcastingEntry.will = thisLine.substring(9).split(", ").map(i => parseSpell(i));
			} else {
				spellcastingEntry.headerEntries.push(thisLine);
			}
		}
		spellcasting.push(spellcastingEntry);
	} else {
		console.log("has Spellcasting");
		for (let i = 1; i < trait.text.length; i++) {
			let thisLine = trait.text[i];
			if (thisLine.includes("Cantrip")) {
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcastingEntry.spells) spellcastingEntry.spells = {"0": {"spells": []}};
				spellcastingEntry.spells["0"].spells = value;
			} else if (thisLine.includes(" level (")) {
				let property = thisLine.substr(0, 1);
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcastingEntry.spells) spellcastingEntry.spells = {};
				if (thisLine.includes(" slot")) {
					let slots = parseInt(thisLine.substr(11, 1));
					spellcastingEntry.spells[property] = {"slots": slots, "spells": value};
				} else {
					spellcastingEntry.spells[property] = {"spells": value};
				}
			} else {
				spellcastingEntry.headerEntries.push(thisLine);
			}
		}
		spellcasting.push(spellcastingEntry);
	}
	contents.monster[contentsIndex].spellcasting = spellcasting;
}

function parseDaily (line) {
	return {"property": property, "value": value};
}

recursiveCheck("./data/bestiary");
