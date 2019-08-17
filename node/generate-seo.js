const fs = require("fs");
require("../js/utils");
require("../js/render");

function rd (path) {
	return JSON.parse(fs.readFileSync(path, "utf-8"));
}

const version = rd("package.json").version;

const getTemplate = (page) => `<!DOCTYPE html><html lang="en"><head>
<!--5ETOOLS_VERSION-->
<meta charset="utf-8"><meta name="description" content=""><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><title>5etools</title><link rel="stylesheet" href="/css/bootstrap.css?v=${version}"><link rel="stylesheet" href="/css/jquery-ui.css?v=${version}"><link rel="stylesheet" href="/css/jquery-ui-slider-pips.css?v=${version}"><link rel="stylesheet" href="/css/style.css?v=${version}"><link rel="icon" href="/favicon.png"><script type="text/javascript" src="/js/header.js"></script></head><body><header class="hidden-xs hidden-sm page__header"><div class="container"><h1 class="page__title"></h1></div></header><nav class="container page__nav" id="navigation"><ul class="nav page__nav-inner" id="navbar"></ul></nav><div class="cancer__wrp-leaderboard"><!--5ETOOLS_AD_LEADERBOARD--></div><div class="cancer__wrp-sidebar-rhs"><!--5ETOOLS_AD_RIGHT_1--><div class="cancer__sidebar-rhs-inner"><!--5ETOOLS_AD_RIGHT_2--></div></div><main class="container"><div class="row"><table id="pagecontent" class="stats"><tr><th class="border" colspan="6"></th></tr><tr><td colspan="6" class="initial-message">Loading...</td></tr><tr><th class="border" colspan="6"></th></tr></table></div><div class="row" id="link-page"></div></main><script type="text/javascript" src="https://cdn.jsdelivr.net/combine/npm/jquery@3.2/dist/jquery.min.js,npm/list.js@1.5/dist/list.min.js,gh/weixsong/elasticlunr.js@0.9/elasticlunr.min.js"></script><script type="text/javascript" src="/lib/localforage.js"></script><script type="text/javascript" src="/lib/jquery-ui.js"></script><script type="text/javascript" src="/lib/jquery-ui-slider-pip.js"></script><script type="text/javascript" src="/js/shared.js"></script><script type="text/javascript" src="/js/render-${page}.js"></script><script type="text/javascript" src="/js/seo-loader.js"></script><script></script></body></html>`;

// Monkey patch
(() => {
	DataUtil.loadJSON = async (url) => {
		const data = rd(url);
		await DataUtil.pDoMetaMerge(data);
		return data;
	};
})();

const toGenerate = [
	{
		page: "spells",
		pGetEntries: () => {
			const index = rd(`data/spells/index.json`);
			const fileData = Object.entries(index)
				.map(([_, filename]) => rd(`data/spells/${filename}`));
			return fileData.map(it => MiscUtil.copy(it.spell)).flat();
		}
	},
	{
		page: "bestiary",
		pGetEntries: () => {
			const index = rd(`data/bestiary/index.json`);
			const fileData = Object.entries(index)
				.map(([source, filename]) => ({source: source, json: rd(`data/bestiary/${filename}`)}));
			// Filter to prevent duplicates from "otherSources" copies
			return fileData.map(it => MiscUtil.copy(it.json.monster.filter(mon => mon.source === it.source))).flat();
		}
	},
	{
		page: "items",
		pGetEntries: async () => {
			return Renderer.item.pBuildList();
		}
	}

	// TODO expand this as required
];

const isIndex = process.argv[2] === "--index";
let indexStack = "";

async function main () {
	let total = 0;
	console.log(`Generating SEO pages...`);
	await Promise.all(toGenerate.map(async meta => {
		const pageTemplate = getTemplate(meta.page);
		const entries = await meta.pGetEntries();
		const builder = UrlUtil.URL_TO_HASH_BUILDER[`${meta.page}.html`];
		entries.forEach(ent => {
			const hash = decodeURIComponent(builder(ent))
				.replace(/\//g, "~S")
				.replace(/"/g, "~Q");
			const path = `seo/${meta.page}__${hash}.htm`;
			if (isIndex) {
				indexStack += `<a href="https://5etools.com/${path}">${ent.name} :: <span title="${Parser.sourceJsonToFull(ent.source)}">${Parser.sourceJsonToAbv(ent.source)}</span></a>`;
			} else {
				fs.writeFileSync(`./${path}`, pageTemplate, "utf-8");
			}
			total++;
			if (total % 100 === 0) console.log(isIndex ? `Indexed ${total} pages...` : `Wrote ${total} files...`);
		});
	}));
	console.log(isIndex ? `Indexed ${total} pages.` : `Wrote ${total} files.`);
	if (isIndex) {
		fs.writeFileSync(
			`seo-index.html`,
			`<!DOCTYPE html><html lang="en"><head>
<title>Index</title>
<style>
* {
	box-sizing: border-box;
}

html,
body {
	font-family: monospace;
	width: 100%;
	height: 100%;
	padding: 0;
	margin: 0;
}

a {
	display: block;
	margin-bottom: 3px;
	width: 600px;
}

.wrp {
	padding: 10px;
	margin: 0;
	display: flex;
	justify-content: center;
}

.col {
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	max-width: 400px;
	width: 100%;
}
</style>
</head>
<body><div class="wrp"><div class="col">${indexStack}</div></div></body>`,
			"utf-8"
		);
	}
}

main().then(() => console.log(`SEO page ${isIndex ? "indexing" : "generation"} complete.`)).catch(e => console.error(e));
