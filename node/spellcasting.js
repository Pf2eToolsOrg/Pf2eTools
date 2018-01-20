const fs = require('fs');
let contents = [];
let check = true; // check the content instead of generating the full JSON
let brief = false; // display the "spellcasting" JSON
let fileInclude = "bestiary-"; // default to all bestiary files
const args = process.argv.slice(2); // omit the first two arguments (node and the path to this script)

for (let i = 0; i < args.length; i++) {
	if (args[i] === "--brief") {
		brief = true;
	} else if (args[i] === "--generate") {
		check = false;
	} else if (args[i] === "-F") {
		fileInclude += args[i + 1];
	}
}
if (!check) brief = false; // if we're generating the full JSON then do not also display "spellcasting" too

function recursiveCheck (file) {
	if (file.includes(fileInclude)) checkFile(file);
	else if (fs.lstatSync(file).isDirectory()) {
		fs.readdirSync(file).forEach(nxt => {
			recursiveCheck(`${file}/${nxt}`)
		})
	}
}

function checkFile (file) {
	if (check) console.log(file);
	contents = JSON.parse(fs.readFileSync(file, 'utf8'));
	for (let i = 0; i < contents.monster.length; i++) {
		let monster = contents.monster[i];
		let name = monster.name;
		if (monster.spells && check) console.log(`${name} has "spells"`);
		if (monster.trait) {
			let trait = monster.trait;
			for (let j = 0; j < trait.length; j++) if (trait[j].name.includes("Spellcasting")) parseSpellcasting(name, trait[j], i);
		}
	}
	if (!check) console.log(JSON.stringify(contents, null, 2));
}

function parseSpellcasting (monsterName, trait, contentsIndex) {
	let name = trait.name;
	let spellcasting = [];
	let spellcastingEntry = {"name": name, "headerEntries": [trait.text[0]]};
	if (name.includes("Innate Spellcasting")) {
		if (check) console.log(`${monsterName} has Innate Spellcasting`);
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
		if (check) console.log(`${monsterName} has Spellcasting`);
		for (let i = 1; i < trait.text.length; i++) {
			let thisLine = trait.text[i];
			if (thisLine.includes("Cantrip")) {
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcastingEntry.spells) spellcastingEntry.spells = {"0": {"spells": []}};
				spellcastingEntry.spells["0"].spells = value;
			} else if (thisLine.includes(" level")) {
				let property = thisLine.substr(0, 1);
				let value = thisLine.substring(thisLine.indexOf(": ") + 2).split(", ").map(i => parseSpell(i));
				if (!spellcastingEntry.spells) spellcastingEntry.spells = {};
				let slots = thisLine.includes(" slot") ? parseInt(thisLine.substr(11, 1)) : 0;
				spellcastingEntry.spells[property] = {"slots": slots, "spells": value};
			} else {
				spellcastingEntry.headerEntries.push(thisLine);
			}
		}
		spellcasting.push(spellcastingEntry);
	}
	if (brief) console.log(JSON.stringify({"spellcasting": [spellcastingEntry]}, null, 2));
	contents.monster[contentsIndex].spellcasting = spellcasting;
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

recursiveCheck("./data/bestiary");
