#!/bin/bash

echo "Adding gtags."

find . -maxdepth 1 -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
		# Lots of messy escapes below, you care about the version number after the @ sign & the comma.
        sed -i -e '/<!--PF2ETOOLS_SCRIPT_ANCHOR-->/a <script async src="https://www.googletagmanager.com/gtag/js?id=G-675SELNZR4"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag("js", new Date());gtag("config", "G-675SELNZR4");</script>' $line
    done

