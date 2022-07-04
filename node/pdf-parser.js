const fs = require("fs");
const ut = require("./util.js");
Object.assign(global, require("../js/converterutils.js"));
Object.assign(global, require("../js/render.js"));
Object.assign(global, require("../js/converter.js"));

/*
	How To:
	1. Create a new .txt file and copy all of the statblocks from a book into it. The name of the file determines its source.
	2. Run this script. node node\pdf-parser.js input="./path/to/dir"
	3. The parser will split the txt, parse each chunk, save chunks without errors as data, and those with errors as txt.
*/

class PdfConverter extends Converter {
	constructor (opts) {
		opts = opts || {};
		super(opts);
		this._args = opts.args;
		this._errors = {};
	}

	exec () {
		const files = ut.listFiles({dir: this._args.input, whitelistFileExts: [".txt"]});
		// console.log(`Parsing ${files.length} files...`);
		files.filter(f => f.endsWith(".txt") && !f.endsWith("-errors.txt")).forEach(file => {
			this._parseFile(file);
		});
		if (Object.keys(this._errors).length) {
			console.log("Encountered errors while parsing:");
			Object.entries(this._errors).forEach(([file, errors]) => {
				console.log(`"${file}": ${errors.length} errors:`);
				errors.forEach(err => console.log(`--- "${err.block}": ${err.e.message}`))
				console.log("-----------------------------------------------")
			})
		}
	}

	_parseFile (file) {
		console.log(`Parsing "${file}"...`);
		const source = file.split("/").last().replace(/\.txt/, "");
		const {data, strFailedChunks} = this._parseChunks(file, source);
		const fileErr = file.replace(/\.txt/, "-errors.txt");
		if (strFailedChunks.length) fs.writeFileSync(fileErr, strFailedChunks);
		else if (fs.existsSync(fileErr)) fs.unlinkSync(fileErr);
		Object.keys(data).forEach(key => {
			const folder = key === "creature" ? "bestiary" : `${key}s`;
			const dirPart = `${this._args.output || "./trash/parsed"}/${folder}`;
			fs.mkdirSync(dirPart, {recursive: true});
			const out = {[key]: data[key]};
			const filePath = `${dirPart}/${key}s-${source.toLowerCase()}`;
			console.log(`Writing to "${filePath}"...`);
			fs.writeFileSync(filePath, CleanUtil.getCleanJson(out));
		});
	}

	_parseChunks (file, source) {
		const fileContent = fs.readFileSync(file, "utf-8");
		const sourceText = this._preprocessString(fileContent);
		const chunks = sourceText.split(/\n{2,}/).map(it => it.trim()).filter(it => it !== "");
		let page = 0;
		let data = {};
		let strFailedChunks = "";
		chunks.forEach(chunk => {
			if (/^\d+$/.test(chunk)) {
				page = Number(/\d+/.exec(chunk));
			} else {
				try {
					const parsed = this.parse(`${chunk}\n\n\n`, {source, initialPage: page});
					data = MiscUtil.merge(data, parsed);
				} catch (e) {
					strFailedChunks += `\n\n${page}\n\n${chunk}`;
					const err = {e, block: chunk.trim().split("\n")[0]};
					(this._errors[file] = this._errors[file] || []).push(err);
				}
			}
		});
		return {data, strFailedChunks};
	}
}

/**
 * Args:
 * input="./dir"
 * output="./trash"
 * merge
 */
async function main () {
	ut.patchLoadJson();
	const args = ut.ArgParser.parse();
	const converter = new PdfConverter({
		tokenizerUtilsClass: TokenizerUtils,
		config: TokenizerUtils.defaultConfig,
		args,
	});
	await converter.init();
	converter.exec();
	// converter._parseFile("../txt/Adventures/APs/SoT0.txt")
	ut.unpatchLoadJson();
}

if (require.main === module) {
	main().then(() => console.log("Parsing complete.")).catch(e => { throw e; });
}
