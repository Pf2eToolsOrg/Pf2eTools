const fs = require('fs');
const Validator = require('jsonschema').Validator;
const validator = new Validator();
const helperFile = "entry.json";
validator.addSchema(require(`./schema/${helperFile}`), "/Entry");

const TESTS_PASSED = 0;
const TESTS_FAILED = 1;

const results = [];
let errors = [];

// Loop through each non-helper schema and push all validation results
fs.readdirSync("./test/schema")
	.filter(file => file.endsWith(".json")) // ignore directories
	.forEach(file => {
	if (file !== helperFile) results.push(validator.validate(require(`../data/${file}`), require(`./schema/${file}`), {nestedErrors: true}));
});

// Custom handling for the new spells data layout TODO expand to cover everything
fs.readdirSync(`./data/spells`)
	.filter(file => file.startsWith("spells") || file.startsWith("roll20"))
	.forEach(file => {
		if (file.startsWith("spells")) {
			results.push(validator.validate(require(`../data/spells/${file}`), require(`./schema/spells/spells.json`), {nestedErrors: true}));
		} else {
			results.push(validator.validate(require(`../data/spells/${file}`), require(`./schema/spells/roll20.json`), {nestedErrors: true}));
		}
});

results.forEach( (result) => {
	if (!result.valid) errors = errors.concat(result.errors);
});

// Reporting
if (errors.length > 0) {
	console.error(JSON.stringify(errors, null, 2));
	console.warn(`Tests failed: ${errors.length}`);
	process.exit(TESTS_FAILED);
} else {
	console.log("All schema tests passed.");
	process.exit(TESTS_PASSED);
}
