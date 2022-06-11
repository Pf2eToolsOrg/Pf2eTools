const fs = require("fs");
const xmlbuilder = require("xmlbuilder");
require("../js/utils");
require("../js/render");
require("../js/render-dice");

function rd (path) {
	return JSON.parse(fs.readFileSync(path, "utf-8"));
}

const BASE_SITE_URL = "https://pf2etools.com/";
const version = rd("package.json").version;

const lastMod = (() => {
	const date = new Date();
	return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`
})();

const baseSitemapData = (() => {
	const out = {};

	// Scrape all the links from navigation.js -- avoid any unofficial HTML files which might exist
	const navText = fs.readFileSync("./js/navigation.js", "utf-8");
	navText.replace(/(?:"([^"]+\.html)"|'([^']+)\.html'|`([^`]+)\.html`)/gi, (...m) => {
		const str = m[1] || m[2] || m[3];
		if (str.includes("${")) return;
		out[str] = true;
	});

	return out;
})();

const getTemplate = (page, source, hash, textStyle) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="description" content=""><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="apple-mobile-web-app-capable" content="yes"><title>Pf2eTools</title><!--PF2ETOOLS_SCRIPT_HEAD_ANCHOR--><link rel="stylesheet" href="/css/bootstrap.css?v=${version}"><link rel="stylesheet" href="/css/jquery-ui.css?v=${version}"><link rel="stylesheet" href="/css/jquery-ui-slider-pips.css?v=${version}"><link rel="stylesheet" href="/css/style.css?v=${version}"><link rel="icon" type="image/svg+xml" href="favicon.svg"><link rel="icon" type="image/png" sizes="256x256" href="favicon-256x256.png"><link rel="icon" type="image/png" sizes="144x144" href="favicon-144x144.png"><link rel="icon" type="image/png" sizes="128x128" href="favicon-128x128.png"><link rel="icon" type="image/png" sizes="64x64" href="favicon-64x64.png"><link rel="icon" type="image/png" sizes="48x48" href="favicon-48x48.png"><link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png"><link rel="manifest" href="manifest.webmanifest"><meta name="application-name" content="Pf2eTools"><meta name="theme-color" content="#006bc4"><meta name="msapplication-config" content="browserconfig.xml"/><meta name="msapplication-TileColor" content="#006bc4"><link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png"><link rel="apple-touch-icon" sizes="360x360" href="apple-touch-icon-360x360.png"><link rel="apple-touch-icon" sizes="167x167" href="apple-touch-icon-167x167.png"><link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png"><link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png"><meta name="apple-mobile-web-app-title" content="Pf2eTools"><link rel="mask-icon" href="safari-pinned-tab.svg" color="#006bc4"><script src="/js/header.js?v=${VERSION_NUMBER}"></script><script>_SEO_PAGE="${page}";_SEO_SOURCE="${source}";_SEO_HASH="${hash}";_SEO_STYLE=${textStyle}</script><style>.concentration{padding-left: 5px;font-weight: bold;}.concentration--sublist{padding-left: 1px;}ul.list{height: initial;max-height: 100%;min-height: 100px;}ul.list.subitems{min-height: initial;}span.side-label{position: absolute;transform: rotate(-90deg);transform-origin: 0 0;font-size: 18px;bottom: 0;left: -22px;}h3.ele-mundane,h3.ele-magic{position: relative;margin: 0;}h3.ele-mundane span.side-label{}h3.ele-magic span.side-label{}@media (max-width: 991px){ul.list{max-height: 20em;}}@media (max-device-height: 700px){ul.list{max-height: 20em;}.viewport-wrapper{bottom: auto;}.view-col-wrapper{flex-direction: column;max-height: none;height: auto;}ul.list{max-height: 20em;}}.itm__list-divider{width: 100%;height: 1px;background: #ccc;}.night-mode .itm__list-divider{background: #555;}.itm__wrp-lists{flex: 7;}.itm__wrp-stats{flex: 5;}.itm__wrp-list{height: 100%;}.itm__wrp-list--empty{height: initial;flex-shrink: 0;}.style-switch__wide .itm__wrp-list{min-width: calc(50% - 10px);max-width: calc(50% - 10px);}.style-switch__wide .itm__wrp-list--mundane{margin-right: 20px;}.style-switch__wide #listcontainer.itm__wrp-lists{flex: initial;width: 100%;flex-flow: row;}.style-switch__wide .itm__wrp-stats{width: 480px;flex: initial;flex-shrink: 0;}.style-switch__wide .side-label{display: none !important;}.style-switch__wide .itm__list-divider{display: block !important;}</style></head><body><header class="hidden-xs hidden-sm page__header"><div class="container"><h1 class="page__title"></h1></div></header><nav class="container page__nav" id="navigation"><ul class="nav nav-pills page__nav-inner" id="navbar"></ul></nav><main class="container"><div class="wrp-stats-table"><div id="pagecontent" class="stats pf2-stat"><div class="initial-message">Loading...</div></div></div><div class="row" id="link-page"></div></main><script src="https://cdn.jsdelivr.net/combine/npm/jquery@3.4.1/dist/jquery.min.js,gh/weixsong/elasticlunr.js@0.9/elasticlunr.min.js"></script><script src="/lib/localforage.js"></script><script src="/lib/jquery-ui.js"></script><script src="/lib/jquery-ui-slider-pip.js"></script><script src="/js/shared.js?v=${VERSION_NUMBER}"></script><script src="/js/seo-loader.js?v=${VERSION_NUMBER}"></script><script src="/js/render-${page}.js?v=${VERSION_NUMBER}"></script></body></html>`;

// Monkey patch

(() => {
	DataUtil.loadJSON = async (url) => {
		const data = rd(url);
		await DataUtil.pDoMetaMerge(url, data);
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
			return fileData.map(it => MiscUtil.copy(it.spell)).reduce((a, b) => a.concat(b))
		},
		style: 1,
	},
	{
		page: "bestiary",
		pGetEntries: () => {
			const index = rd(`data/bestiary/index.json`);
			const fileData = Object.entries(index)
				.map(([source, filename]) => ({source: source, json: rd(`data/bestiary/${filename}`)}));
			// Filter to prevent duplicates from "otherSources" copies
			return fileData.map(it => MiscUtil.copy(it.json.creature.filter(mon => mon.source === it.source))).reduce((a, b) => a.concat(b))
		},
		style: 2,
	},
	{
		page: "items",
		pGetEntries: async () => {
			return Renderer.item.pBuildList();
		},
		style: 1,
	},
	{
		page: "feats",
		pGetEntries: () => {
			const index = rd(`data/feats/index.json`);
			const fileData = Object.entries(index)
				.map(([_, filename]) => rd(`data/feats/${filename}`));
			return fileData.map(it => MiscUtil.copy(it.feat)).reduce((a, b) => a.concat(b))
		},
		style: 1,
	},
	{
		page: "backgrounds",
		pGetEntries: () => {
			const index = rd(`data/backgrounds/index.json`);
			const fileData = Object.entries(index)
				.map(([_, filename]) => rd(`data/backgrounds/${filename}`));
			return fileData.map(it => MiscUtil.copy(it.background)).reduce((a, b) => a.concat(b))
		},
		style: 1,
	},

	// TODO expand this as required
];

const siteMapData = {};

async function main () {
	let total = 0;
	console.log(`Generating SEO pages...`);
	await Promise.all(toGenerate.map(async meta => {
		try {
			fs.mkdirSync(`./${meta.page}`, {recursive: true})
		} catch (err) {
			if (err.code !== "EEXIST") throw err
		}

		const entries = await meta.pGetEntries();
		const builder = UrlUtil.URL_TO_HASH_BUILDER[`${meta.page}.html`];
		entries.forEach(ent => {
			let offset = 0;
			let html;
			let path;
			while (true) {
				const hash = builder(ent);
				const sluggedHash = Parser.stringToSlug(decodeURIComponent(hash)).replace(/_/g, "-");
				path = `${meta.page}/${sluggedHash}${offset ? `-${offset}` : ""}.html`;
				if (siteMapData[path]) {
					++offset;
					continue;
				}

				html = getTemplate(meta.page, ent.source, hash, meta.style);

				siteMapData[path] = true;
				break;
			}

			if (offset > 0) console.warn(`\tDeduplicated URL using suffix: ${path}`);

			fs.writeFileSync(`./${path}`, html, "utf-8");

			total++;
			if (total % 100 === 0) console.log(`Wrote ${total} files...`);
		});
	}));
	console.log(`Wrote ${total} files.`);

	let sitemapLinkCount = 0;
	const $urlSet = xmlbuilder
		.create("urlset", {version: "1.0", encoding: "UTF-8"})
		.att("xmlns", "https://www.sitemaps.org/schemas/sitemap/0.9");

	const $urlRoot = $urlSet.ele("url");
	$urlRoot.ele("loc", BASE_SITE_URL);
	$urlRoot.ele("lastmod", lastMod);
	$urlRoot.ele("changefreq", "weekly");
	sitemapLinkCount++;

	Object.keys(baseSitemapData).forEach(url => {
		const $url = $urlSet.ele("url");
		$url.ele("loc", `${BASE_SITE_URL}${url}`);
		$url.ele("lastmod", lastMod);
		$url.ele("changefreq", "weekly");
		sitemapLinkCount++;
	});

	Object.keys(siteMapData).forEach(url => {
		const $url = $urlSet.ele("url");
		$url.ele("loc", `${BASE_SITE_URL}${url}`);
		$url.ele("lastmod", lastMod);
		$url.ele("changefreq", "monthly");
		sitemapLinkCount++;
	});

	const xml = $urlSet.end({pretty: true});
	fs.writeFileSync("./sitemap.xml", xml, "utf-8");
	console.log(`Wrote ${sitemapLinkCount.toLocaleString()} URL${sitemapLinkCount === 1 ? "" : "s"} to sitemap.xml`)
}

main().then(() => console.log(`SEO page generation complete.`)).catch(e => console.error(e));
