#!/usr/bin/env python
# -*- coding: utf-8 -*-

def handle_input_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as input_file: 
        output = handle_input_text(input_file.read())

        with open(filepath, 'w', encoding='utf-8', newline='\n') as output_file:
            output_file.write(output)

def handle_input_text(text):
    import re

    regexes = []

    # Add table caption to "Harrowing Event" (see "Haunted One" background)
    regexes.append((re.compile(r'^(\s*)("Prior to becoming.*Choose a harrowing event that haunts you, or roll 1d10.",)\n\s*("1 -)', flags=re.MULTILINE), r'\g<1>\g<2>\n\g<1>"d10 - Event",\n\g<1>\g<3>'))
    # Remove leading <br> such as "<br>1" -> "1"
    regexes.append((re.compile(r'^(\s*)"\<br\>', flags=re.MULTILINE), r'\g<1>"'))
    # Fix errors such as "1-  Text" -> "1 - Text"
    regexes.append((re.compile(r'^(\s*)"(\d+)-\s', flags=re.MULTILINE), r'\g<1>"\g<2> -'))
    # Consolidate "1. Text" -> "1 - Text"
    regexes.append((re.compile(r'^(\s*)"(\d+)\.', flags=re.MULTILINE), r'\g<1>"\g<2> -'))
    # Consolidate 1 -> "1", because we need strings to allow a range of numbers (see "Inheritor" background)
    regexes.append((re.compile(r'^(\s*)(\d+),\n', flags=re.MULTILINE), r'\g<1>"\g<2>",\n'))
    # Prepare data for "table" object
    regexes.append((re.compile(r'^(\s*)"(d\d+) - (.*)",\n((?:\s*"(\d+(?:-\d)?) - .*",?\n)+)', flags=re.MULTILINE), 
                      r'\g<1>{\n\g<1>\t"istable": "YES",\n\g<1>\t"thead": [\n\g<1>\t\t\t"\g<2>",\n\g<1>\t\t\t"\g<3>"\n\g<1>\t],\n\g<1>\t"thstyleclass": [\n\g<1>\t\t\t"col-xs-1 text-align-center",\n\g<1>\t\t\t"col-xs-11"\n\g<1>\t],\n\g<1>\t"tbody": [\n\g<4>\g<1>\t]\n\g<1>}\n'))
    # Replace the text with tbody object
    regexes.append((re.compile(r'^(\s*)"(\d+(?:-\d)?) - (.*)"(,?)\n', flags=re.MULTILINE), 
                    r'\g<1>\t\t[\n\g<1>\t\t\t"\g<2>",\n\g<1>\t\t\t"\g<3>"\n\g<1>\t\t]\g<4>\n'))

    for regex in regexes:
        text = regex[0].sub(regex[1], text)

    return text

if __name__ == '__main__':
    import os.path

    handle_input_file(os.path.join("..", "data", "backgrounds.json"))
