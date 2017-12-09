"use strict";

const CONTENTS_URL = "data/adventures.json";

function makeContentsBlock(adv, addPrefix) {
	let out =
		"<ul>";

	adv.contents.forEach((c, i) => {
		out +=
			`<li><a href="${addPrefix ? "adventure.html" : ""}#${adv.id},${i}">${(c.part ? `Part ${c.part} \u2014 ` : "")}${c.name}</a></li>`;
		out += makeHeadersBlock(adv.id, i, c, addPrefix);
	});

	out +=
		"</ul>";
	return out;
}

function makeHeadersBlock(advId, chapterIndex, chapter, addPrefix) {
	let out =
		"<ul>";
	chapter.headers.forEach(c => {
		out +=
			`<li><a href="${addPrefix ? "adventure.html" : ""}#${advId},${chapterIndex},${encodeForHash(c)}" data-chapter="${chapterIndex}" data-header="${c}">${c}</a></li>`
	});
	out +=
		"</ul>";
	return out;
}