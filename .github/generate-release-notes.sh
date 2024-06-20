#!/bin/bash

set -e

if [[ $# -eq 0 ]]; then
    echo "No arguments provided. Usage: generate-release-notes.sh <version>"
    exit 1
fi

version=$1

# Release version number without "v" prefix to match the format of changelog.json.
version_number="${version#v}"

# This parses the JSON blob for this specific version from changelog.json.
changelog="$(
    jq --arg version "$version_number" --compact-output \
    '.changelog [] | select(.ver == $version)'                    \
    data/changelog.json
)"

if [[ -z "$changelog" ]]; then
    echo "Changelog entry for version $version does not exist."
    exit 1
fi

{
    # The "hub" tool reads all text up to the first empty line as the release
    # title.
    # * For changelog entries with a title, this is formatted as
    #   '<version>, "<title>" Edition' to match the format of the site's
    #   changelog page.
    #
    # * For changelog entries without a title, this is formatted as simply
    #   '<version>'.
    echo -n "$version"
    jq -r 'if has("title") then ", \(.title | tojson) Edition\n" else "\n" end' <<< "$changelog"

    # Some changelogs include an alternate title. This is included in the body
    # of the release notes and formatted as 'AKA "<altTitle>" Edition' to match
    # the site's changelog page.
    jq -j 'if has("titleAlt") then "AKA \(.titleAlt | tojson) Edition\n" else "" end' <<< "$changelog"

    # Changelog text is already markdown-formatted, so no additional formatting
    # needs to be done here.
    # Spappz: jk actually it's HTML and needs to be coerced
    changelog=$(sed -E "s/<\/?i>/*/g" <<< "$changelog")
    changelog=$(sed -E "s/<\/?b>/**/g" <<< "$changelog")
    changelog=$(sed -E "s/<\/?kbd>/\`/g" <<< "$changelog")
    changelog=$(sed -E "s/<\/?sup>/\"/g" <<< "$changelog")
    jq -r '.txt' <<< "$changelog"

	# Add stagnation notice
	printf '\n**Note:** Pf2eTools is still stagnated as per [v0.8.5](https://github.com/Pf2eToolsOrg/Pf2eTools/releases/tag/v0.8.5). However, we are making good progress on the new site! An alpha is available to our [supporters](https://ko-fi.com/mrvauxs); you can also join our [Discord server](https://discord.gg/2hzNxErtVu) to receive more informal updates or just chat about things.\n'
}
