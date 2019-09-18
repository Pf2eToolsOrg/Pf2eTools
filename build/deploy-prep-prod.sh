#!/bin/bash

version=$1

# Set the IS_DEPLOYED variable for production.
sed -i 's/IS_DEPLOYED\s*=\s*undefined/IS_DEPLOYED='"\"${version}\""'/g' js/utils.js

echo "Making the javascript cry (Minifying)."
for f in js/*.js
do
    npm run minify -- "$f" --out-file "$f"
done

echo "Optimizing the header."
# Header / Day-Night mode
npm run minify -- js/styleswitch.js --out-file js/styleswitch.js
npm run minify -- js/navigation.js --out-file js/navigation.js
npm run minify -- js/browsercheck.js --out-file js/browsercheck.js
cat js/styleswitch.js <(echo ";") js/navigation.js <(echo ";") js/browsercheck.js > js/header.js
rm js/styleswitch.js js/navigation.js

# Replace the files with the minified version we made above
find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e 's;js/styleswitch.js;js/header.js;g' $line
		sed -n -i '/js\/navigation.js/!p' $line
		sed -n -i '/js\/browsercheck.js/!p' $line
    done

echo "Optimizing the JS."
# Improve cache performance by gluing these together. Order is important. `echo`s add newlines.
cat js/utils.js <(echo ";") js/utils-ui.js <(echo ";") js/omnidexer.js <(echo ";") js/omnisearch.js <(echo ";") js/render.js <(echo ";") js/scalecreature.js > js/shared.js
rm js/utils.js js/utils-ui.js js/omnidexer.js js/omnisearch.js js/render.js js/scalecreature.js

# Replace the files with the minified version we made above
find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e 's;js/utils.js;js/shared.js;g' $line
		sed -n -i '/js\/utils-ui.js/!p' $line
		sed -n -i '/js\/omnidexer.js/!p' $line
		sed -n -i '/js\/omnisearch.js/!p' $line
		sed -n -i '/js\/render.js/!p' $line
		sed -n -i '/js\/scalecreature.js/!p' $line
    done

echo "Installing Query Strings."
for file in js/*; do
    find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done
for file in css/*; do
    find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done
