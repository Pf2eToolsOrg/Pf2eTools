## 5e Tools
[Go to 5etools](https://5egmegaanon.github.io/5etools/5etools.html)

## To-Do
- Continue Tome of Beasts entries.
- Clean up filtering interface.
- Plan layout of upcoming Mystic disciplines (spells? Special classes.html layout?)

## Notes
To remove trailing commas in JSON:
Find: (.*?)(,)(:?\s*]|\s*})
Replace: $1$3

## How to import 5etools bestiary into Roll20
Or: how to get every  monster into Roll20 with ease.

1. Go to https://github.com/5egmegaanon/D20plus. Follow the instructions for use: install Greasemonkey/Tampermonkey, install the script, then you're good to go.

2. Open the Roll20 game you want to import the monsters into.

3. With the userscript installed, go to the gear icon and hit Import Monster. Use the following URL for the prompt that pops up:
https://raw.githubusercontent.com/5egmegaanon/5etools/master/data/bestiary.json

4. Let it run. Your journal will fill up with monsters. It's not too laggy but can take a long time because of how many monsters there are.

5. Bam. Done. If you are using the Shaped sheet, be sure to open up the NPC sheets and let them convert before using it.

You can convert stat blocks to JSON for importing via [this converter](https://5egmegaanon.github.io/5etools/converter.html).
