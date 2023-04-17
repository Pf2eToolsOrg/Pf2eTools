# Pf2e.Tools

[![pages-build-deployment](https://github.com/Pf2eToolsOrg/Pf2eTools/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/Pf2eToolsOrg/Pf2eTools/actions/workflows/pages/pages-build-deployment) [![Build and Deploy](https://github.com/Pf2eToolsOrg/Pf2eTools/actions/workflows/main.yml/badge.svg)](https://github.com/Pf2eToolsOrg/Pf2eTools/actions/workflows/main.yml)

Visit the main site (not yet) or go to the unofficial GitHub [mirror](https://pf2etools.com).

[Join the Pf2eTools Discord here!](https://discord.gg/2hzNxErtVu)

## Help and Support

Please see [our Discord server](https://discord.gg/2hzNxErtVu) for FAQs, installation guides, supported integrations, and more.

---

## Developer Notes

### Data Sources and Versioning

Only "official" (that is, published by Paizo) data is to be included in the site. Anything else should be added to the homebrew repository.

Prioritise RAW above all else. Aim to provide a 1:1 copy of the original data. Obvious typos (for instance, mathematical errors in creature statblocks) may be corrected at the discretion of the maintainer(s).

Aim to use the latest version of any published material. Older versions which are sufficiently different (and relevant to community interests) can be moved to the homebrew repository.

### Target JavaScript Version

Targeting ES6 was the original intent, but more modern features have long since crept into the code. Therefore, if something is available as standard in both Chrome and Firefox (preferably in versions dating back at least a couple of months), and isn't bleeding-edge, one can reasonable justify using it. As with all things, use common sense.

### Style Guidelines

#### Code

- Use tabs over spaces.

#### CSS

- The [BEM](http://getbem.com/) ("Block Element Modifier") naming strategy should be used where possible.

#### Data/Text

- Format JSON to match the default output of JavaScript's `JSON.stringify` (using tabs for indentation), i.e. one line per bracket and one line per value. JSON files programmatically generated from other JSON files (i.e. those stored in `data/generated`) should be minified, however.

- When "tagging" references in data (e.g. `{@creature goblin}`), the following rules apply:
  - Only tag references which are _intended as references_. For example, the Wizard class in `You gain one cantrip of your choice from the wizard spell list` should be tagged, whereas the Wizard class in `Together, a group of seven powerful wizards sought to contain the demon` should not be tagged. One is a reference to the mechanical class, one is merely the casual usage of the word "wizard."
  - In a similar vein, never tag anything within a `quote`-type block. Even if the quote directly refers to a specific creature, we can assume the quote is from a universe/perspective in which (for example) statblocks don't exist, and therefore the tag should be omitted to maintain the flavour of the quote.
  - Within data from a source, avoid referencing content from a source printed after the publication of that source.

### JSON Cleaning

Parts of the JSON cleaning & style guidelines are also automated and can be applied using `npm run clean-jsons`. Additionally, this cleanup script is also run automatically as part of `npm run build`.

#### Trailing commas

To remove trailing commas in JSON:

Find: `(.*?)(,)(:?\s*]|\s*})`

Replace: `$1$3`

#### Character replacement

- `’` should be replaced with `'`
- `“` and `”` should be replaced with `"`
- `—` (em dash) should be replaced with `\u2014` (Unicode for em dash)
- `–` should be replaced with `\u2013` (Unicode for en dash)
- `−` should be replaced with `\u2212` (Unicode for minus sign)
- `•` should be not be used unless the JSON in question is not yet covered by the entryRenderer, i.e. should be encoded as a list
- the only Unicode escape sequences allowed are `\u2014`, `\u2013`, and `\u2212`; all other characters (unless noted above) should be stored as-is

#### Convention for dashes

- `-` (hyphen) should **only** be used to hyphenate words, e.g. `60-foot` and `18th-level`
- `\u2014` should be used for parenthetical dash pairs, or for marking empty table rows.
- `\u2013` should be used for joining numerical ranges, e.g. `1-5` should become `1\u20135`.
- `\u2212` should be used for unary minus signs, in the case of penalties. For example, `"You have a -5 penalty to..."` should become `"You have a \u22125 penalty to..."`.
- any whitespace on any side of a `\u2014` should be removed

#### Convention for measurement

- Adjectives: a hyphen and the full name of the unit of measure should be used, e.g. dragon exhales acid in a `60-foot line`
- Nouns: a space and the short name of the unit of measure (including the trailing period) should be used, e.g. `blindsight 60 ft.`, `darkvision 120 ft.`
- Time: a slash, `/`, with no spaces on either side followed by the capitalised unit of time, e.g. `2/Turn`, `3/Day`

#### Convention for Dice

Dice should be written as `[X]dY[ <+|-|×> Z]`, i.e. with a space between dice and operator, and a space between operator and modifier. Some examples of acceptable formatting are: `d6`, `2d6`, or `2d6 + 1`.

#### Convention for Item Names

Item names should be title-case, with the exception of units in parentheses, which should be sentence-case. Items who's volume or amount is specified by container (e.g. `(vial)`) treat the container as a unit.

### Mouse/Keyboard Events

Avoid binding ALT-modified events, as these are not available under MacOS or various Linux flavors. Binding SHIFT-/CTRL-modified events is preferred.

### Dev Server

Do `npm run serve:dev` to launch a local dev server that serves the project files on [`http://localhost:8080/index.html`](http://localhost:8080/index.html).

### JSON Schema

The repository contains a JSON Schema for the data files in `test/schema-template/schema.json`. The schema is currently a work in progress.

Details for how to make use of the schema vary based on what setup you are using to work with the repo.

#### Visual Studio Code

To use the JSON Schema with Visual Studio Code, head to Settings and locate the `JSON: Schemas` setting. It is recommended you add this configuration only for the local workspace.

```json
"json.schemas": [
	{
		"fileMatch": [
			"data/**/*.json"
		],
		"url": "./test/schema-template/schema.json"
	}
]
```

### Version bump

Do `npm run version-bump -- [OPTION]`, where `[OPTION]` is one of the following:

- `major` to increment the major version (`1.2.3` will become `2.0.0`)
- `minor` to increment the minor version (`1.2.3` will become `1.3.0`)
- `patch` to increment the patch version (`1.2.3` will become `1.2.4`)
- a version number (like `1.2.3`)

It will first run the tests and fail to increase the version if the tests fail.
It will then automatically replace the version in the files where it needs to be replaced, create a commit with the message `chore(version): bump` and create a tag (in the form `v1.2.3`) at the commit.
This feature can be easily disabled by doing `npm config set git-tag-version false`.

---

## License

This project is licensed under the terms of the MIT license.
