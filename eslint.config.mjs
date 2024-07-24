import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [...compat.extends("eslint:recommended"), {
	languageOptions: {
		globals: {
			...globals.browser,
			...globals.jquery,
		},

		ecmaVersion: 2022,
		sourceType: "module",
	},

	rules: {
		"accessor-pairs": "off",

		"array-callback-return": "error",

		"arrow-spacing": ["error", {
			before: true,
			after: true,
		}],

		"block-spacing": ["error", "always"],

		"brace-style": ["error", "1tbs", {
			allowSingleLine: true,
		}],

		"comma-dangle": ["error", {
			arrays: "always-multiline",
			objects: "always-multiline",
			imports: "always-multiline",
			exports: "always-multiline",
			functions: "always-multiline",
		}],

		"comma-spacing": ["error", {
			before: false,
			after: true,
		}],

		"comma-style": ["error", "last"],
		"constructor-super": "error",
		curly: ["error", "multi-line"],
		"default-case-last": "error",
		"dot-location": ["error", "property"],

		eqeqeq: ["error", "always", {
			null: "ignore",
		}],

		"func-call-spacing": ["error", "never"],

		"generator-star-spacing": ["error", {
			before: false,
			after: true,
		}],

		"handle-callback-err": ["error", "^(err|error)$"],

		indent: ["error", "tab", {
			SwitchCase: 1,
		}],

		"key-spacing": ["error", {
			beforeColon: false,
			afterColon: true,
		}],

		"keyword-spacing": ["error", {
			before: true,
			after: true,
		}],

		"new-cap": ["error", {
			newIsCap: true,
			capIsNew: false,
		}],

		"new-parens": "error",
		"no-array-constructor": "error",
		"no-caller": "error",
		"no-class-assign": "error",
		"no-compare-neg-zero": "error",
		"no-cond-assign": "error",
		"no-const-assign": "error",

		"no-constant-condition": ["error", {
			checkLoops: false,
		}],

		"no-control-regex": "error",
		"no-debugger": "error",
		"no-delete-var": "error",
		"no-dupe-args": "error",
		"no-dupe-class-members": "error",
		"no-dupe-keys": "error",
		"no-duplicate-case": "error",
		"no-duplicate-imports": "error",
		"no-empty-character-class": "error",
		"no-empty-pattern": "error",
		"no-eval": "error",
		"no-ex-assign": "error",
		"no-extra-bind": "error",
		"no-extra-boolean-cast": "error",
		"no-extra-parens": ["error", "functions"],
		"no-fallthrough": "error",
		"no-floating-decimal": "error",
		"no-func-assign": "error",
		"no-global-assign": "error",
		"no-implied-eval": "error",
		"no-inner-declarations": ["error", "functions"],
		"no-invalid-regexp": "error",
		"no-irregular-whitespace": "error",
		"no-iterator": "error",
		"no-label-var": "error",

		"no-labels": ["error", {
			allowLoop: true,
			allowSwitch: false,
		}],

		"no-lone-blocks": "error",

		"no-mixed-operators": ["error", {
			groups: [
				["==", "!=", "===", "!==", ">", ">=", "<", "<="],
				["&&", "||"],
				["in", "instanceof"],
			],

			allowSamePrecedence: true,
		}],

		"no-mixed-spaces-and-tabs": "error",
		"no-multi-spaces": "error",
		"no-multi-str": "error",

		"no-multiple-empty-lines": ["error", {
			max: 1,
			maxEOF: 0,
		}],

		"no-negated-in-lhs": "error",
		"no-new": "error",
		"no-new-func": "error",
		"no-new-object": "error",
		"no-new-require": "error",
		"no-new-symbol": "error",
		"no-new-wrappers": "error",
		"no-obj-calls": "error",
		"no-octal": "error",
		"no-octal-escape": "error",
		"no-path-concat": "error",
		"no-proto": "error",
		"no-redeclare": "error",
		"no-regex-spaces": "error",
		"no-return-await": "error",
		"no-self-assign": "error",
		"no-self-compare": "error",
		"no-sequences": "error",
		"no-shadow-restricted-names": "error",
		"no-sparse-arrays": "error",
		"no-template-curly-in-string": "error",
		"no-this-before-super": "error",
		"no-throw-literal": "error",
		"no-trailing-spaces": "error",
		"no-undef": "off",
		"no-undef-init": "error",
		"no-unexpected-multiline": "error",
		"no-unmodified-loop-condition": "error",

		"no-unneeded-ternary": ["error", {
			defaultAssignment: false,
		}],

		"no-unreachable": "error",
		"no-unreachable-loop": "error",
		"no-unsafe-finally": "error",
		"no-unsafe-negation": "error",

		"no-unused-expressions": ["error", {
			allowShortCircuit: true,
			allowTernary: true,
			allowTaggedTemplates: true,
		}],

		"no-unused-vars": "off", // Too much legacy code from mothersite we might want later

		"no-use-before-define": ["error", {
			functions: false,
			classes: false,
			variables: false,
		}],

		"no-useless-assignment": "error",
		"no-useless-call": "error",
		"no-useless-computed-key": "error",
		"no-useless-constructor": "error",
		"no-useless-escape": "error",
		"no-useless-rename": "error",
		"no-useless-return": "error",
		"no-var": "error",
		"no-whitespace-before-property": "error",
		"no-with": "error",

		"object-property-newline": ["error", {
			allowMultiplePropertiesPerLine: true,
		}],

		"one-var": ["error", {
			initialized: "never",
		}],

		"operator-linebreak": ["error", "after", {
			overrides: {
				"?": "before",
				":": "before",
				"+": "before",
				"-": "before",
				"*": "before",
				"/": "before",
				"||": "before",
				"&&": "before",
			},
		}],

		"padded-blocks": ["error", {
			blocks: "never",
			switches: "never",
			classes: "never",
		}],
		"prefer-const": "off", // This should be on but no way am I trying to fix that
		"prefer-promise-reject-errors": "error",
		"rest-spread-spacing": ["error", "never"],

		"semi-spacing": ["error", {
			before: false,
			after: true,
		}],

		"space-before-blocks": ["error", "always"],
		"space-before-function-paren": ["error", "always"],
		"space-in-parens": ["error", "never"],
		"space-infix-ops": "error",

		"space-unary-ops": ["error", {
			words: true,
			nonwords: false,
		}],

		"spaced-comment": ["error", "always", {
			line: {
				markers: ["*package", "!", "/", ",", "="],
			},

			block: {
				balanced: true,
				markers: ["*package", "!", ",", ":", "::", "flow-include"],
				exceptions: ["*"],
			},
		}],

		"symbol-description": "error",
		"template-curly-spacing": ["error", "never"],
		"template-tag-spacing": ["error", "never"],
		"unicode-bom": ["error", "never"],
		"use-isnan": "error",

		"valid-typeof": ["error", {
			requireStringLiterals: true,
		}],

		"wrap-iife": ["error", "any", {
			functionPrototypeMethods: true,
		}],

		"yield-star-spacing": ["error", "both"],
		yoda: ["error", "never"],
		"no-prototype-builtins": "off",
		"require-atomic-updates": "off",
		"no-console": "off", // Console messages are good, actually
		"prefer-template": "error",

		quotes: ["error", "double", {
			allowTemplateLiterals: true,
		}],
	},
}];
