## 5e Tools
[Go to 5etools](https://5egmegaanon.github.io/5etools/5etools.html)

## Data Documentation
5etools uses data stored in JSON format. Each page loads a single file of JSON, which is loaded via a script tag to allow local use in Chrome.

### Bestiary
Each monster entry needs the following JSON data. Examples of this data can be found in [bestiary.json](data/bestiary.json).

- name - The name of the creature, properly capitalized.
- size - The size of the creature, denoted as a single uppercase letter (T, S, M, L, H, or G)
- type - The type of the creature, followed by a comma, followed by the sourcebook of the monster, such as "humanoid (any race), Volo's Guide)".
- alignment - The alignment of the creature.
- ac - The AC of the creature, followed by the armor, source, or other notes in parentheses, such as "12 (15 with mage armor)"
- hp - The average hit points of the creature, followed by the hit dice of the creature in parentheses, such as "84 (13d8+26)".
- speed - Each of the creature's speeds, separate by commas, such as "10 ft., swim 40 ft.".
- str - The Strength score of the creature.
- dex - The Dexterity score of the creature.
- con - The Constitution score of the creature.
- int - The Intelligence score of the creature.
- wis - The Wisdom score of the creature.
- cha - The Charisma score of the creature.
- save - The saving throw bonuses the creature has with shortened and capitalized ability names, separated by commas, such as "Con +6, Int +8, Wis +6"
- skill - The skill bonuses of the creature. Due to legacy format, this is presented as an array with a single string entry containing each skill bonus separated by commas, such as ["Deception +3, Stealth +5"]
- passive - The passive Perception score of the creature.
- languages - The languages the creature knows, separated by commas.
- cr - The Challenge Rating of the monster.
- trait - An array of traits that the creature has. Each trait needs the following:
  - name - The name of the trait.
  - text - An array of strings, each entry being a single paragraph of the trait.
- action - An array of actions that the creature has. Each action needs the following:
  - name - The name of the action.
  - text - An array of strings, each entry being a single paragraph of the action.
- reaction - An array of reactions that the creature has. Each reaction needs the following:
  - name - The name of the reaction.
  - text - An array of strings, each entry being a single paragraph of the reaction.
- legendary - An array of legendary actions that the creature has. Each action needs the following:
  - name - The name of the legendary action, with the number of actions it costs in parentheses after if it costs more than 1 legendary action. A creature such as Tiamat that has a special description of its legendary actions leaves the first legendary entry with a blank string as its name.
  - text - An array of strings, each entry being a single paragraph of the legendary action. A creature such as Tiamat that has a special description of its legendary actions places the description in this array, leaving name as a blank string.
