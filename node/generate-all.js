async function main () {
	await require("./generate-search-index");
	require("./generate-gmscreen-reference");
	require("./generate-quick-reference");
}

main().catch(e => { throw e; });
