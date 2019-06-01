#!/bin/bash

version=$1

echo "Making the javascript cry (Minifying)."
for f in js/*.js
do
    # utils.js minification is broken. Remove this 'if' when fixed.
    if [ "$f" == "utils.js" ] ; then
          continue;
    fi
    npm run uglifyjs -- --compress --mangle -o "$f" -- "$f"
done

echo "Optimizing the header."
# Header / Day-Night mode
npm run uglifyjs -- js/styleswitch.js js/navigation.js -o js/header.js -c -m
rm js/styleswitch.js js/navigation.js

# Replace the files with the minified version we made above
find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e 's;js/styleswitch.js;js/header.js;g' $line
		sed -n -i '/js\/navigation.js/!p' $line
    done

echo "Optimizing the JS."
# Improve cache performance by gluing these together. Order is important. `echo`s add newlines.
cat js/utils.js <(echo ";") js/utils-ui.js <(echo ";") js/omnidexer.js <(echo ";") js/omnisearch.js <(echo ";") js/render.js <(echo ";") js/scalecreature.js > js/shared.js
rm js/utils.js js/utils-ui.js js/omnidexer.js js/omnisearch.js js/render.js js/scalecreature.js

# Replace the files with the minified version we made above
find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e 's;js/utils.js;js/shared.js;g' $line
		sed -n -i '/js\/utils-ui.js/!p' $line
		sed -n -i '/js\/omnidexer.js/!p' $line
		sed -n -i '/js\/omnisearch.js/!p' $line
		sed -n -i '/js\/render.js/!p' $line
		sed -n -i '/js\/scalecreature.js/!p' $line
    done

echo "Replacing local files with combined jsdelivr."

# Set the IS_DEPLOYED variable for production.
sed -i 's/IS_DEPLOYED\s*=\s*undefined/IS_DEPLOYED='"\"${version}\""'/g' js/utils.js

find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -n -i '/lib\/jquery.js/!p' $line
        sed -n -i '/lib\/list.js/!p' $line
        sed -n -i '/lib\/elasticlunr.js/!p' $line
		# Lots of messy escapes below, you care about the version number after the @ sign & the comma.
        sed -i -e '/<!--5ETOOLS_SCRIPT_ANCHOR-->/a <script type="text/javascript" src="https://cdn.jsdelivr.net/combine/npm/jquery@3.2/dist/jquery.min.js,npm/list.js@1.5/dist/list.min.js,gh/weixsong/elasticlunr.js@0.9/elasticlunr.min.js"><\/script> <script>window.jQuery || document.write(`<script src="/lib\/jquery.js"><\\\/script>`); window.List || document.write(`<script src="/lib\/list.js"><\\\/script>`);<\/script>' $line
    done

echo "Installing Query Strings."
for file in js/*; do
    find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done
for file in css/*; do
    find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done
