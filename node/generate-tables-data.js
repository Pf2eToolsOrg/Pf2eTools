const fs = require("fs");
require("../js/utils");
const ut = require("./util");
const UtilGenTables = require("./util-generate-tables-data.js");

class GenTables {
	_doLoadAdventureData () {
		return ut.readJson(`./data/adventures.json`).adventure
			.map(idx => {
				if (GenTables.ADVENTURE_WHITELIST[idx.id]) {
					return {
						adventure: idx,
						adventureData: JSON.parse(fs.readFileSync(`./data/adventure/adventure-${idx.id.toLowerCase()}.json`, "utf-8"))
					}
				}
			})
			.filter(it => it);
	}

	_doLoadBookData () {
		return ut.readJson(`./data/books.json`).book
			.map(idx => {
				if (!GenTables.BOOK_BLACKLIST[idx.id]) {
					return {
						book: idx,
						bookData: JSON.parse(fs.readFileSync(`./data/book/book-${idx.id.toLowerCase()}.json`, "utf-8"))
					};
				}
			})
			.filter(it => it);
	}

	_doLoadClassData () {
		const index = ut.readJson(`./data/class/index.json`);
		const allData = Object.values(index).map(it => ut.readJson(`./data/class/${it}`));
		const out = allData.reduce((a, b) => ({class: a.class.concat(b.class)}), {class: []});
		return out.class;
	}

	run () {
		const output = {tables: [], tableGroups: []};

		this._addBookAndAdventureData(output);
		this._addClassData(output);

		const toSave = JSON.stringify({table: output.tables, tableGroup: output.tableGroups});
		fs.writeFileSync(`./data/generated/gendata-tables.json`, toSave, "utf-8");
		console.log("Regenerated table data.");
	}

	_addBookAndAdventureData (output) {
		const advDocs = this._doLoadAdventureData();
		const bookDocs = this._doLoadBookData();

		advDocs.forEach(doc => {
			const {
				table: foundTables,
				tableGroup: foundTableGroups
			} = UtilGenTables.getAdventureBookTables(
				doc,
				{
					headProp: "adventure",
					bodyProp: "adventureData",
					isRequireIncludes: true
				}
			);

			output.tables.push(...foundTables);
			output.tableGroups.push(...foundTableGroups);
		});

		bookDocs.forEach(doc => {
			const {
				table: foundTables,
				tableGroup: foundTableGroups
			} = UtilGenTables.getAdventureBookTables(
				doc,
				{
					headProp: "book",
					bodyProp: "bookData"
				}
			);

			output.tables.push(...foundTables);
			output.tableGroups.push(...foundTableGroups);
		});
	}

	_addClassData (output) {
		const classes = this._doLoadClassData();

		classes.forEach(cls => {
			const {table: foundTables} = UtilGenTables.getClassTables(cls);
			output.tables.push(...foundTables);
		});
	}
}
GenTables.BOOK_BLACKLIST = {};
GenTables.ADVENTURE_WHITELIST = {};

const generator = new GenTables();
generator.run();
