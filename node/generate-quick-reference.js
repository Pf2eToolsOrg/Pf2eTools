const fs = require('fs');
const ut = require('../js/utils.js');
const er = require('../js/entryrender.js');

const SECTIONS = [
	"Character Creation",
	"Equipment",
	"Playing the Game",
	"Combat",
	"Adventuring"
];

const index = require(`../data/books.json`);
const bookData = [];
index.book.forEach(b => {
	const data = require(`../data/book/book-${b.id.toLowerCase()}.json`);
	bookData.push(data);
});

const out = {};
function isQuickRef (ent) {
	return ent.entries && ent.data && ent.data.quickref;
}
function recursiveAdd (ent) {
	if (isQuickRef(ent)) {
		const sect = ent.data.quickref;
		if (!out[sect]) {
			out[sect] = {
				sectName: SECTIONS[sect - 1],
				sections: []
			};
		}

		const toAdd = JSON.parse(JSON.stringify(ent));
		toAdd.type = "section";

		// remove any children which are themselves quickref sections
		const removeIndices = [];
		if (toAdd.entries) {
			toAdd.entries.forEach((nxt, i) => {
				if (isQuickRef(nxt)) {
					removeIndices.push(i);
					recursiveAdd(nxt)
				}
			})
		}

		if (removeIndices.length) {
			toAdd.entries = toAdd.entries.filter((it, i) => {
				return !removeIndices.includes(i)
			});
		}
		delete toAdd.data;

		out[sect].sections.push(toAdd)
	} else if (ent.entries) {
		ent.entries.forEach(nxt => recursiveAdd(nxt));
	}
}

bookData.forEach(book => {
	book.data.forEach(chap => {
		if (chap.entries) {
			recursiveAdd(chap);
		}
	})
});

const outJson = {
	reference: [{
		name: "Quick Reference",
		id: "quickreference",
		contents: []
	}],
	data: []
};
Object.keys(out).sort().forEach(i => {
	const sects = out[i].sections.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	// TODO
	outJson.reference[0].contents.push({
		name: out[i].sectName,
		headers: sects.map(s => s.name)
	});
	const toAdd = {
		type: "entries",
		entries: sects
	};
	outJson.data.push(toAdd);
});

const toWrite = JSON.stringify(outJson); // minify the file, so it's clear it was auto-generated
fs.writeFileSync("data/quickreference.json", toWrite, "utf8");
console.log("Updated quick-reference.");
