/**
 * Script for deleting SEO folders.
 * Exists for environments with a space limit, such as Cloudflare Pages 25MB limit.
 */

const fs = require("fs");

const toDelete = [
	"spells",
	"bestiary",
	"items",
	"sitemap.xml",
	// TODO expand this as required, see generate-seo.js
];

async function main () {
	for (const dir of toDelete) {
		const path = `./${dir}`;
		if (fs.existsSync(path)) {
			console.log(`Deleting ${path}...`);
			fs.rmSync(path, { recursive: true, force: true });
		} else {
			console.log(`Path ${path} does not exist, skipping.`);
		}
	}
}
main().then(() => console.log(`SEO page deletion complete.`)).catch(e => console.error(e));