module.exports = {
	"env": {
		"browser": true,
		"es6": true
	},
	"globals": {
		"$": true,
		"droll": true,
	},
	"rules": {
		"no-console": 2,
		"no-extra-semi": 2,
		"no-inner-declarations": 2,
		"no-mixed-spaces-and-tabs": 2,
		"no-redeclare": 2,
		"no-unreachable": 2,
		"prefer-const": [
			"warn",
			{
				"destructuring": "any",
				"ignoreReadBeforeAssign": false
			}
		],

		"indent": [
			"error",
			"tab"
		]
	}
}