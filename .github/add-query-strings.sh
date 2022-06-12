#!/bin/bash

set -e

if [[ $# -eq 0 ]]; then
    echo "No arguments provided. Usage: add-query-strings.sh <version>"
    exit 1
fi

version=$1

# Set the IS_DEPLOYED variable for production.
sed -i 's/IS_DEPLOYED\s*=\s*undefined/IS_DEPLOYED='"\"${version}\""'/g' js/utils.js


echo "Installing Query Strings."

# JS files
for file in js/*; do
    find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done

# Handle the unique service worker .js strings
find . -maxdepth 1 -type f -name '*.html' -print0 |
while IFS= read -r -d $'\0' line; do
    sed -i -e "s;/sw.js;/sw.js?v=${version};g" $line
done

# CSS files
for file in css/*; do
    find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done