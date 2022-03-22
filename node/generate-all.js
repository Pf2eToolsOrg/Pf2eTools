async function main () {
	await require("./generate-search-index");
	require("./generate-gmscreen-reference");
	require("./generate-quick-reference");
	require("./generate-feat-trees");
	require("./generate-nav-adventure-book-index");
}

main().catch(e => { throw e; });
