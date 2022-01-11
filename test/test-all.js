"use strict";

function handleFail () {
	console.error("Tests failed!");
	process.exit(1);
}

async function main () {
	let testsPassed = true;
	testsPassed = testsPassed && await require("./test-json");
	if (!testsPassed) handleFail();
	testsPassed = testsPassed && await require("./test-misc");
	if (!testsPassed) handleFail();
	process.exit(0);
}

main()
	.then(() => console.log("Tests complete."))
	.catch(e => {
		console.error(e);
		throw e;
	});
