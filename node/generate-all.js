async function main () {
	await require("./generate-search-index.js");
	require("./generate-gmscreen-reference.js");
	require("./generate-quick-reference.js");
	require("./generate-feat-trees.js");
	require("./generate-nav-adventure-book-index.js");
}

main().catch(e => { throw e; });
