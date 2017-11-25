module.exports = {
	"extends": "eslint:recommended",
	"env": {
		"browser": true,
		"es6": true
	},
	"rules": {
		"block-scoped-var": "error",
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1
			}
		],
		"no-alert": "error",
		"no-case-declarations": "off",
		"no-undef": "off",
		"no-unused-expressions": "error",
		"no-unused-vars": "off",
		"no-useless-escape": "off",
		"no-with": "error",
		"prefer-const": [
			"warn",
			{
				"destructuring": "any",
				"ignoreReadBeforeAssign": false
			}
		]
	}
}