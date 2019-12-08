const fs = require("fs");
require("../js/utils");
const ut = require("./util");

class GenTables {
	constructor () {
		this.sectionOrders = {};
	}

	_doLoadBookAndAdventureData () {
		const out = ut.readJson(`./data/books.json`).book.map(idx => {
			if (!GenTables.BOOK_BLACKLIST[idx.id]) {
				idx.bookData = JSON.parse(fs.readFileSync(`./data/book/book-${idx.id.toLowerCase()}.json`, "utf-8"));
				return idx;
			}
		}).filter(it => it);

		out.push(...ut.readJson(`./data/adventures.json`).adventure.map(idx => {
			if (GenTables.ADVENTURE_WHITELIST[idx.id]) {
				idx.adventureData = JSON.parse(fs.readFileSync(`./data/adventure/adventure-${idx.id.toLowerCase()}.json`, "utf-8"));
				return idx;
			}
		}).filter(it => it));

		return out;
	}

	_doLoadClassData () {
		const index = ut.readJson(`./data/class/index.json`);
		const allData = Object.values(index).map(it => ut.readJson(`./data/class/${it}`));
		const out = allData.reduce((a, b) => ({class: a.class.concat(b.class)}), {class: []});
		return out.class;
	}

	_getTableSectionIndex (chapterName, sectionName, dryRun) {
		((this.sectionOrders[chapterName] =
			this.sectionOrders[chapterName] || {})[sectionName] =
			this.sectionOrders[chapterName][sectionName] || 1);
		const val = this.sectionOrders[chapterName][sectionName];
		if (!dryRun) this.sectionOrders[chapterName][sectionName]++;
		return val;
	}

	_search (path, metaToAdd, section, data, outStacks, isAdventure) {
		if (data.data && data.data.tableIgnore) return;
		if (data.entries) {
			const nxtSection = data.name || section;
			if (data.name) path.push(data.name);
			data.entries.forEach(ent => this._search(path, metaToAdd, nxtSection, ent, outStacks, isAdventure));
			if (data.name) path.pop();
		} else if (data.items) {
			if (data.name) path.push(data.name);
			data.items.forEach(item => this._search(path, metaToAdd, section, item, outStacks, isAdventure));
			if (data.name) path.pop();
		} else if (data.type === "table") {
			if (isAdventure && !(data.data && data.data.tableInclude)) return;
			const cpy = MiscUtil.copy(data);
			const pathCpy = MiscUtil.copy(path);
			this._search__setMeta(cpy, metaToAdd, pathCpy, section);
			outStacks.table.push(cpy);
		} else if (data.type === "tableGroup") {
			if (isAdventure && !(data.data && data.data.tableInclude)) return;
			const cpy = MiscUtil.copy(data);
			const pathCpy = MiscUtil.copy(path);
			this._search__setMeta(cpy, metaToAdd, pathCpy, section);
			outStacks.tableGroup.push(cpy);
		}
	}

	_search__setMeta (obj, metaToAdd, path, section) {
		obj.tempMeta = metaToAdd;
		obj.path = path;
		obj.section = section;
		obj.sectionIndex = this._getTableSectionIndex(metaToAdd.name, section);
	}

	static _cleanSectionName (name) {
		return name.replace(/^(?:Step )?[-\d]+[:.]?\s*/, "");
	}

	static _isSectionInTitle (sections, title) {
		return sections.some(section => title.toLowerCase().includes(section.toLowerCase()));
	}

	static _cleanData (table) {
		delete table.path;
		delete table.section;
		delete table.sectionIndex;

		if (table.tempMeta.metaType === "adventure-book") {
			table.chapter = table.tempMeta;
			delete table.tempMeta;

			// clean chapter
			if (table.data && table.data.tableChapterIgnore) {
				delete table.chapter;
			} else {
				const chapterOut = {};
				chapterOut.name = table.chapter.name;
				chapterOut.ordinal = table.chapter.ordinal;
				chapterOut.index = table.chapter.index;
				table.chapter = chapterOut;
			}
		} else if (table.tempMeta.metaType === "class") {
			table.class = {name: table.tempMeta.className, source: table.tempMeta.classSource};
			delete table.tempMeta;
		} else if (table.tempMeta.metaType === "subclass") {
			table.subclass = {
				name: table.tempMeta.subclassName,
				source: table.tempMeta.subclassSource,
				className: table.tempMeta.className,
				classSource: table.tempMeta.classSource
			};
			delete table.tempMeta;
		}

		if (table.type === "table") delete table.type;
		delete table.data;
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
		const docs = this._doLoadBookAndAdventureData();

		docs.forEach(doc => {
			const stacks = {table: [], tableGroup: []};

			const _PROPS = ["bookData", "adventureData"];
			_PROPS.forEach(prop => {
				if (!doc[prop]) return;
				doc[prop].data.forEach((chapter, i) => {
					const chapterMeta = doc.contents[i];
					chapterMeta.index = i;
					chapterMeta.metaType = "adventure-book";
					const path = [];
					this._search(path, chapterMeta, doc.name, chapter, stacks, prop === "adventureData");
				});
			});

			const tablesToAdd = stacks.table.map(it => {
				const cleanSections = it.path.map(section => GenTables._cleanSectionName(section));

				if (it.data && it.data.tableNamePrefix && it.caption) {
					it.name = `${it.data.tableNamePrefix}; ${it.caption}`;
				} else if (it.data && it.data.tableName) {
					it.name = it.data.tableName;
				} else if (it.caption) {
					if (GenTables._isSectionInTitle(cleanSections, it.caption) || (it.data && it.data.skipSectionPrefix)) {
						it.name = it.caption;
					} else {
						it.name = `${cleanSections.last()}; ${it.caption}`;
					}
				} else {
					if (it.sectionIndex === 1 && this._getTableSectionIndex(it.tempMeta.name, it.section, true) === 2) {
						it.name = cleanSections.last();
					} else {
						it.name = `${cleanSections.last()}; ${it.sectionIndex}`;
					}
				}

				it.source = doc.id;
				GenTables._cleanData(it);
				return it;
			});

			const tableGroupsToAdd = stacks.tableGroup.map(it => {
				const cleanSections = it.path.map(section => GenTables._cleanSectionName(section));
				if (!it.name) throw new Error("Group had no name!");

				if (!GenTables._isSectionInTitle(cleanSections, it.name)) {
					it.name = `${cleanSections.last()}; ${it.name}`;
				}

				it.source = doc.id;
				GenTables._cleanData(it);
				return it;
			});

			output.tables = output.tables.concat(tablesToAdd);
			output.tableGroups = output.tableGroups.concat(tableGroupsToAdd);
		});
	}

	_addClassData (output) {
		const classes = this._doLoadClassData();

		classes.forEach(cls => {
			const stacks = {table: [], tableGroup: []};
			const path = [];

			cls.classFeatures.forEach((lvl, lvlI) => {
				const meta = {
					metaType: "class",
					className: cls.name,
					classSource: cls.source || SRC_PHB,
					level: lvlI + 1
				};
				lvl.forEach(feat => this._search(path, meta, cls.name, feat, stacks, true));
			});

			const gainScFeaturesAt = [];
			cls.classFeatures.forEach((lvl, i) => {
				if (lvl.some(it => it.gainSubclassFeature)) gainScFeaturesAt.push(i + 1);
			});

			if (cls.subclasses) {
				cls.subclasses.forEach(sc => {
					sc.subclassFeatures.forEach((lvl, scI) => {
						const meta = {
							metaType: "subclass",
							className: cls.name,
							classSource: cls.source || SRC_PHB,
							level: gainScFeaturesAt[scI],
							subclassName: sc.name,
							subclassSource: sc.source || cls.source || SRC_PHB
						};
						lvl.forEach(feat => this._search(path, meta, cls.name, feat, stacks, true));
					});
				});
			}

			const tablesToAdd = stacks.table.map(it => {
				it.name = it.caption;
				it.source = it.tempMeta.subclassSource || it.tempMeta.classSource;

				GenTables._cleanData(it);
				return it;
			});

			output.tables = output.tables.concat(tablesToAdd);
		});
	}
}
GenTables.BOOK_BLACKLIST = {};
GenTables.ADVENTURE_WHITELIST = {};

const generator = new GenTables();
generator.run();
