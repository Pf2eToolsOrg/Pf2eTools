const Validator = require('jsonschema').Validator;

const TESTS_PASSED = 0;
const TESTS_FAILED = 1;

validateSchema();

function validateSchema(){
	const validator = new Validator();
	attachHelperSchemaTo(validator);

	let errors = [];
	const results = [];

	// Push all validation results here
	results.push(validateClassesWith(validator));
	results.push(validateVariantFeaturesWith(validator));
	results.push(validateSpellsWith(validator));

	results.forEach( (result) => {
		if(!result.valid){
			errors = errors.concat(result.errors);
		}
	});


	// Reporting
	console.log(errors);
	if(errors.length > 0){
		console.error(JSON.stringify(errors, null, 2));
		console.warn(`Tests failed: ${errors.length}`);
		process.exit(TESTS_FAILED);
	}
	else{
		console.log("All schema tests passed.");
		process.exit(TESTS_PASSED);
	}
}

/**
 * Reads and attaches all necessary helper subschemae 
 * to a Validator object.
 * @param  {jsonschema.Validator} validator The validator to attach the good stuff to
 * @return {void}
 */
function attachHelperSchemaTo(validator){
	const entrySchema = require("./schema/entry.json");
	validator.addSchema(entrySchema, "/Entry");
}

/**
 * Validates classes.json using its corresponding schema
 * @return {jsonschema.Result} The result of the validation.
 */
function validateClassesWith(validator){
	const classesSchema = require("./schema/classes.json");
	const classes = require("../data/classes.json");
	return validator.validate(classes, classesSchema, {nestedErrors: true});
}

/**
 * Validates variantrules.json using its corresponding schema
 * @return {jsonschema.Result} The result of the validation.
 */
function validateVariantFeaturesWith(validator){
	const variantRulesSchema = require("./schema/variantrules.json");
	const variantRules = require("../data/variantrules.json");
	return validator.validate(variantRules, variantRulesSchema, {nestedErrors: true});
}


/**
 * Validates spells.json using its corresponding schema
 * @return {jsonschema.Result} The result of the validation.
 */
function validateSpellsWith(validator){
	const spellSchema = require("./schema/spells.json");
	const spells = require("../data/spells.json");
	return validator.validate(spells, spellSchema, {nestedErrors: true});
}