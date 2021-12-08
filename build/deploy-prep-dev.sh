#!/bin/bash

echo "Optimizing the header."
# Header / Day-Night mode
npm run minify:js -- js/styleswitch.js --output js/styleswitch.js
npm run minify:js -- js/navigation.js --output js/navigation.js
npm run minify:js -- js/browsercheck.js --output js/browsercheck.js
cat js/styleswitch.js <(echo ";") js/navigation.js <(echo ";") js/browsercheck.js > js/header.js

echo "Optimizing the JS."
# Improve cache performance by gluing these together. Order is important. `echo`s add newlines.
cat js/parser.js <(echo ";") js/utils.js <(echo ";") js/utils-ui.js <(echo ";") js/omnidexer.js <(echo ";") js/omnisearch.js <(echo ";") js/render.js <(echo ";") js/render-dice.js <(echo ";") js/scalecreature.js <(echo ";") js/hist.js > js/shared.js