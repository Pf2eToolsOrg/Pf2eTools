const ut = require("../node/util");
const rl = require("readline-sync");
const fs = require("fs");

const BLACKLIST_FILE_PREFIXES = [
	...ut.FILE_PREFIX_BLACKLIST,
	"fluff-",

	// specific files
	"roll20-tables.json",
	"roll20-items.json",
	"makebrew-creature.json",
	"srd-spells.json",
	"srd-monsters.json",
	"roll20.json",
	"spells-stream.json"
];

const BLACKLIST_KEYS = new Set([
	"_meta",
	"data",
	"itemProperty",
	"lifeClass",
	"lifeBackground",
	"lifeTrinket",
	"cr",
	"monsterfeatures",
	"adventure",
	"book",
	"itemTypeAdditionalEntries",
	"legendaryGroup"
]);

function run (isModificationMode) {
	console.log(`##### Checking for Missing Page Numbers #####`);
	const FILE_MAP = {};
	const files = ut.listFiles({dir: `./data`, blacklistFilePrefixes: BLACKLIST_FILE_PREFIXES});
	files
		.forEach(file => {
			let mods = 0;

			const json = ut.readJson(file);
			Object.keys(json)
				.filter(k => !BLACKLIST_KEYS.has(k))
				.forEach(k => {
					const data = json[k];
					if (data instanceof Array) {
						const noPage = data.filter(it => !(it.inherits ? it.inherits.page : it.page));
						if (noPage.length) {
							console.log(`${file}:`);
							if (isModificationMode) console.log(`\t${noPage.length} missing page number${noPage.length === 1 ? "" : "s"}`);
						}
						noPage
							.forEach(it => {
								const ident = `${k} ${(it.source || (it.inherits && it.inherits.source))} ${it.name}`;
								if (isModificationMode) {
									console.log(`  ${ident}`);
									const page = rl.questionInt("  - Page = ");
									if (page) {
										it.page = page;
										mods++;
									}
								} else {
									const list = (FILE_MAP[file] = FILE_MAP[file] || []);
									list.push(ident);
								}
							});
					}
				});

			if (mods > 0) {
				let answer;
				while (!["y", "n", "quit"].includes(answer)) {
					answer = rl.question(`Save file with ${mods} modification${mods === 1 ? "" : "s"}? [y/n/quit]`);
					if (answer === "y") {
						console.log(`Saving ${file}...`);
						fs.writeFileSync(file, ut.getCleanStringJson(json), "utf-8");
					} else if (answer === "quit") {
						process.exit(1);
					}
				}
			}
		});

	const filesWithMissingPages = Object.keys(FILE_MAP);
	if (filesWithMissingPages.length) {
		console.warn(`##### Files with Missing Page Numbers #####`);
		filesWithMissingPages.forEach(f => {
			console.warn(`${f}:`);
			FILE_MAP[f].forEach(it => console.warn(`\t${it}`));
		});
	} else console.log(`Page numbers are as expected.`);
}

if (require.main === module) run(true);
else run(false);
