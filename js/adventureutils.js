"use strict";

const CONTENTS_URL = "data/adventures.json";

function makeContentsBlock (adv, addPrefix, addOnclick) {
	let out =
		"<ul>";

	adv.contents.forEach((c, i) => {
		out +=
			`<li><a href="${addPrefix ? "adventure.html" : ""}#${adv.id},${i}" ${addOnclick ? `onclick="$(window).scrollTop(0);"` : ""}>${(c.part ? `Part ${c.part} \u2014 ` : "")}${c.name}</a></li>`;
		out += makeHeadersBlock(adv.id, i, c, addPrefix, addOnclick);
	});

	out +=
		"</ul>";
	return out;
}

function makeHeadersBlock (advId, chapterIndex, chapter, addPrefix, addOnclick) {
	let out =
		"<ul>";
	chapter.headers.forEach(c => {
		out +=
			`<li>
				<a href="${addPrefix ? "adventure.html" : ""}#${advId},${chapterIndex},${encodeForHash(c)}" data-chapter="${chapterIndex}" data-header="${c}" ${addOnclick ? `onclick="scrollClick('${c}')"` : ""}>${c}</a>
			</li>`
	});
	out +=
		"</ul>";
	return out;
}

function scrollClick (scrollTo) {
	const goTo = $(`span.entry-title:contains(${scrollTo})`);
	if (goTo[0]) {
		goTo[0].scrollIntoView();
	}
}