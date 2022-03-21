#!/bin/bash

echo "Adding gtags."

find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e '/<!--PF2ETOOLS_SCRIPT_HEAD_ANCHOR-->/a <script async src="https://www.googletagmanager.com/gtag/js?id=G-675SELNZR4"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag("js", new Date());gtag("config", "G-675SELNZR4");</script>' $line
    done

