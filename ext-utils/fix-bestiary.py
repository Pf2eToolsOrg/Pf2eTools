#!/usr/bin/env python
# -*- coding: utf-8 -*-
from collections import OrderedDict

def _dont_split_commas_within_parenteses(string):
    import re

    return re.split(r',\s*(?![^()]*\))', string)

def _parse_json(filepath):
    import json

    with open(filepath, encoding='utf-8') as file:
        data = json.load(file, object_pairs_hook=OrderedDict)
        return data

def _dump_json(data, filepath):
    import json

    with open(filepath, 'w', encoding='utf-8') as outfile:
        json.dump(data, outfile, ensure_ascii=False, indent='\t')

def _skills_to_dict(filepath):
    bestiary = _parse_json(filepath)

    for monster in bestiary['monster']:
        skill_orig = monster.get('skill')

        if isinstance(skill_orig, list):
            skill_string = skill_orig[0]

            if skill_string and isinstance(skill_string, str):
                skill_dict = OrderedDict()

                skill_list = _dont_split_commas_within_parenteses(skill_string)

                for skill in skill_list:
                    skill_name = skill.split('+', 1)[0].strip().lower()
                    skill_bonus = '+' + skill.split('+', 1)[1].strip()

                    skill_dict[skill_name] = skill_bonus

            monster['skill'] = skill_dict

    _dump_json(bestiary, filepath)

if __name__ == '__main__':
    import os.path

    _skills_to_dict(os.path.join("..", "data", "bestiary.json"))
    _skills_to_dict(os.path.join("..", "data", "bestiary-tob.json"))
