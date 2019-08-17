class RenderRaces {
	static $getRenderedRace (race) {
		const renderer = Renderer.get().setFirstSection(true);

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(race, {pronouncePart: race.soundClip ? RenderRaces._getPronunciationButton(race) : ""})}
		<tr><td colspan="6"><b>Ability Scores:</b> ${(race.ability ? Renderer.getAbilityData(race.ability) : {asText: "None"}).asText}</td></tr>
		<tr><td colspan="6"><b>Size:</b> ${Parser.sizeAbvToFull(race.size)}</td></tr>
		<tr><td colspan="6"><b>Speed:</b> ${Parser.getSpeedString(race)}</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class="text"><td colspan="6">${renderer.render({type: "entries", entries: race.entries}, 1)}</td></tr>
		${race.traitTags && race.traitTags.includes("NPC Race") ? `<tr class="text"><td colspan="6"><section class="text-muted">
			${renderer.render(`{@i Note: This race is listed in the {@i Dungeon Master's Guide} as an option for creating NPCs. It is not designed for use as a playable race.}`, 2)}
		 </section></td></tr>` : ""}
		${Renderer.utils.getPageTr(race)}
		${Renderer.utils.getBorderTr()}`;
	}

	static _getPronunciationButton (race) {
		return `<button class="btn btn-xs btn-default btn-name-pronounce">
			<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
			<audio class="name-pronounce">
			   <source src="${race.soundClip}" type="audio/mpeg">
			   <source src="${Renderer.get().baseUrl}audio/races/${/^(.*?)(\(.*?\))?$/.exec(race._baseName || race.name)[1].trim().toLowerCase()}.mp3" type="audio/mpeg">
			</audio>
		</button>`;
	}
}
