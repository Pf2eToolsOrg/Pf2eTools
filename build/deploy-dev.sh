#!/bin/bash

echo "Versioning."
ver="$(git rev-parse --short HEAD)"
sed -i -e 's;<title>5etools</title>;<title>5etools Dev:'"$ver"'</title>;g' 5etools.html

echo "Making js ugly."
for f in js/*.js ; do npm run uglifyjs -- --compress --mangle -o "$f" -- "$f" ; done
