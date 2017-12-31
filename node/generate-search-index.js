const fs = require('fs');

const INDEX = [];

const TO_INDEX__FROM_INDEX_JSON = [
	{
		"category": 1,
		"dir": "bestiary",
		"primary": "name",
		"source": "source",
		"page": "page",
		"listProp": "monster",
		"baseUrl": "bestiary.html"
	},
	{
		"category": 2,
		"dir": "spells",
		"primary": "name",
		"source": "source",
		"page": "page",
		"listProp": "spell",
		"baseUrl": "spells.html"
	}
];

const TO_INDEX = [
	{
		"category": 3,
		"file": "backgrounds.json",
		"primary": "name",
		"source": "source",
		"listProp": "background",
		"baseUrl": "backgrounds.html"
	},
	{
		"category": 4,
		"file": "basicitems.json",
		"primary": "name",
		"source": "source",
		"page": "page",
		"listProp": "basicitem",
		"baseUrl": "items.html"
	},
	{
		"category": 5,
		"file": "classes.json",
		"primary": "name",
		"source": "source",
		"listProp": "class",
		"baseUrl": "classes.html"
	},
	{
		"category": 6,
		"file": "conditions.json",
		"primary": "name",
		"source": "source",
		"listProp": "condition",
		"baseUrl": "conditions.html"
	},
	{
		"category": 7,
		"file": "feats.json",
		"primary": "name",
		"source": "source",
		"listProp": "feat",
		"baseUrl": "feats.html"
	},
	{
		"category": 8,
		"file": "invocations.json",
		"primary": "name",
		"source": "source",
		"listProp": "invocation",
		"baseUrl": "invocations.html"
	},
	{
		"category": 4,
		"file": "items.json",
		"primary": "name",
		"source": "source",
		"page": "page",
		"listProp": "item",
		"baseUrl": "items.html"
	},
	{
		"category": 9,
		"file": "psionics.json",
		"primary": "name",
		"source": "source",
		"listProp": "psionic",
		"baseUrl": "psionics.html"
	},
	{
		"category": 10,
		"file": "races.json",
		"primary": "name",
		"source": "source",
		"listProp": "race",
		"baseUrl": "races.html"
	},
	{
		"category": 11,
		"file": "rewards.json",
		"primary": "name",
		"source": "source",
		"listProp": "reward",
		"baseUrl": "rewards.html"
	},
	{
		"category": 12,
		"file": "variantrules.json",
		"primary": "name",
		"source": "source",
		"listProp": "variantrule",
		"baseUrl": "variantrules.html"
	}
];

let id = 0;
function handleContents (arbiter, j) {
	j[arbiter.listProp].forEach(it => {
		const toAdd = {
			c: arbiter.category,
			url: `${arbiter.baseUrl}#${UrlUtil.URL_TO_HASH_BUILDER[arbiter.baseUrl](it)}`,
			s: it[arbiter.primary],
			src: it[arbiter.source],
			id: id++
		};
		if (arbiter.page) toAdd.pg = it[arbiter.page];
		INDEX.push(toAdd);
	})
}

TO_INDEX__FROM_INDEX_JSON.forEach(ti => {
	const index = require(`../data/${ti.dir}/index.json`);
	Object.values(index).forEach(j => {
		const absF = `../data/${ti.dir}/${j}`;
		const contents =  require(absF);
		console.log(`indexing ${absF}`);
		handleContents(ti, contents);
	})
});

TO_INDEX.forEach(ti => {
	const f = `../data/${ti.file}`;
	const j = require(f);
	console.log(`indexing ${f}`);
	handleContents(ti, j);
});

fs.writeFileSync("search/index.json", JSON.stringify(INDEX), "utf8");