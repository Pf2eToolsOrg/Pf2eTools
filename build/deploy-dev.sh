#!/bin/bash

echo "Making the javascript cry (Minifying)."
for f in js/*.js
do
    # utils.js minification is broken. Remove this 'if' when fixed.
    if [ "$f" == "utils.js" ] ; then
          continue;
    fi
    npm run uglifyjs -- --compress --mangle -o "$f" -- "$f"
done