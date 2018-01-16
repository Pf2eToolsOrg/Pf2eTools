/* eslint-disable no-console */
const fs = require('fs');
let spellName = [];
let spellSource = [];

function recursiveCheck (file) {
	if (file.includes("bestiary-ho") || file.includes("spells-")) checkFile(file);
	else if (fs.lstatSync(file).isDirectory()) {
		fs.readdirSync(file).forEach(nxt => {
			recursiveCheck(`${file}/${nxt}`)
		})
	}
}

function checkFile (file) {
	console.log(file);
	const contents = JSON.parse(fs.readFileSync(file, 'utf8'));
	for (let i = 0; i < contents.monster.length; i++) {
		let monster = contents.monster[i];
		let name = monster.name;
		if (monster.spells) console.log(`${name} has "spells"`);
		if (monster.trait) {
			let trait = monster.trait;
			for (let j = 0; j < trait.length; j++) if (trait[j].name.includes("Spellcasting")) parseSpellcasting(name, trait[j]);
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

function parseSpellcasting (monsterName, trait) {
	let name = trait.name;
	console.log(monsterName);
	console.log(JSON.stringify(trait, null, 2));
	let spellcasting = {"name": name, "headerEntries": [trait.text[0]]};
	if (name.includes("Innate")) {
		for (let i = 1; i < trait.text.length; i++) {
			let thisLine = trait.text[i];
			if (thisLine.includes("/day")) {
				let property = thisLine.substr(0, 1) + (thisLine.includes(" each:") ? "e" : "");
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcasting.daily) spellcasting.daily = {};
				spellcasting.daily[property] = value;
			} else if (thisLine.startsWith("At will: ")) {
				spellcasting.will = thisLine.substring(9).split(", ").map(i => parseSpell(i));
			} else {
				spellcasting.headerEntries.push(thisLine);
			}
		}
	} else {
		for (let i = 1; i < trait.text.length; i++) {
			let thisLine = trait.text[i];
			if (thisLine.includes("Cantrip")) {
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcasting.spells) spellcasting.spells = {"0": {"spells": []}};
				spellcasting.spells["0"].spells = value;
			} else if (thisLine.includes(" level (")) {
				let property = thisLine.substr(0, 1);
				let slots = parseInt(thisLine.substr(11, 1));
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcasting.spells) spellcasting.spells = {};
				spellcasting.spells[property] = {"slots": slots, "spells": value};
			} else {
				spellcasting.headerEntries.push(thisLine);
			}
		}
	}
	console.log(`"spellcasting": ${JSON.stringify([spellcasting], null, 2)},`);
}

function parseDaily (line) {
	return {"property": property, "value": value};
}

recursiveCheck("./data/bestiary");
