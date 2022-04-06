const fs = require("fs");
const ut = require("./util.js");
Object.assign(global, require("../js/converterutils.js"));

class PdfConverter {
	static doConvert (args) {
		const sourceText = fs.readFileSync(args.if, "utf-8");
		this.converter = new Converter({
			config: TokenizerUtils.defaultConfig,
			tokenizerUtilsClass: TokenizerUtils,
		});
		let json = this.converter.parse(sourceText, {source: args.source});
		const outPath = args.of || `./trash/pdf-parsed/${args.prop}-${args.source}.json`;
		const dirPart = outPath.split("/").slice(0, -1).join("/");
		fs.mkdirSync(dirPart, {recursive: true});
		fs.writeFileSync(outPath, CleanUtil.getCleanJson(json));
	}
}

/**
 * Args:
 * if="./dir/src.txt"
 * of="./data/spells/spells-src.json"
 * source="SRC"
 */
async function main () {
	await TagJsons.pInit();
	const ARGS = ut.ArgParser.parse();
	PdfConverter.doConvert(ARGS);
}

if (require.main === module) {
	main().then(() => console.log("Parsing complete.")).catch(e => { throw e; });
}
