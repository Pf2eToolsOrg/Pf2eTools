"use strict";

const CONTENTS_URL = "data/adventures.json";

function makeContentsBlock(adv) {
	let out =
		"<ul>";

	adv.contents.forEach((c, i) => {
		out +=
			`<li><a href="adventure.html#${adv.id},${i}">${(c.part ? `Part ${c.part} \u2014 ` : "")}${c.name}</a></li>`;
		out += makeSectionsBlock(adv.id, i, c);
	});

	out +=
		"</ul>";
	return out;
}

function makeSectionsBlock(advId, chapterIndex, chapter) {
	let out =
		"<ul>";
	chapter.sections.forEach(c => {
		out +=
			`<li><a href="adventure.html#${advId},${chapterIndex},${encodeForHash(c)}">${c}</a></li>`
	});
	out +=
		"</ul>";
	return out;
}