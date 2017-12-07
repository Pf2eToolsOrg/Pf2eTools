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

fs.readdirSync(`./test/schema`)
	.filter(category => !category.endsWith(".json")) // only directories
	.forEach(category => {
		console.log(`Testing category ${category}`);
		const schemas = fs.readdirSync(`./test/schema/${category}`);
		fs.readdirSync(`./data/${category}`).forEach(dataFile => {
			schemas.filter(schema => dataFile.startsWith(schema.split(".")[0])).forEach(schema => {
				console.log(`Testing data/${category}/${dataFile}`.padEnd(50), ` against schema/${category}/${schema}`);
				results.push(validator.validate(require(`../data/${category}/${dataFile}`), require(`./schema/${category}/${schema}`), {nestedErrors: true}));
			})
		})
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
