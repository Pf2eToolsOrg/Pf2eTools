async function main () {
	await require("./generate-search-index");
	require("./generate-dmscreen-reference");
	require("./generate-quick-reference");
	require("./generate-subclass-lookup");
}

main().catch(e => { throw e; });
