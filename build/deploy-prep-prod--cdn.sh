#!/bin/bash

echo "Replacing local files with combined jsdelivr."

jquery="3.4.1"
elasticlunr="0.9"

find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -n -i '/lib\/jquery.js/!p' $line
        sed -n -i '/lib\/elasticlunr.js/!p' $line
        sed -i -e "\#<!--PF2ETOOLS_SCRIPT_ANCHOR-->#a""<script src='https://cdn.jsdelivr.net/combine/npm/jquery@$jquery/dist/jquery.min.js,gh/weixsong/elasticlunr.js@$elasticlunr/elasticlunr.min.js'></script><script>window.jQuery || document.write('<script src=\'/lib/jquery.js\'></script></script>" $line
    done

