"use strict";

const CONTENTS_URL = "data/adventures.json";

function makeContentsBlock (adv, addPrefix, addOnclick, defaultHidden) {
	let out =
		`<ul class="adv-contents" ${defaultHidden ? `style="display: none;"` : ""}>`;

	adv.contents.forEach((c, i) => {
		out +=
			`<li>
				<a href="${addPrefix ? "adventure.html" : ""}#${adv.id},${i}" ${addOnclick ? `onclick="$(window).scrollTop(0);"` : ""}>
					<span class="sect">${getOrdinalText(c.ordinal)}${c.name}</span>
				</a>
			</li>`;
		out += makeHeadersBlock(adv.id, i, c, addPrefix, addOnclick);
	});

	out +=
		"</ul>";
	return out;

	function getOrdinalText (ordinal) {
		if (ordinal === undefined) return "";
		return `${ordinal.type === "part" ? `Part ${ordinal.number} \u2014 ` : ordinal.type === "chapter" ? `Ch. ${ordinal.number}: ` : `Ep. ${ordinal.number}: `}`;
	}
}

function makeHeadersBlock (advId, chapterIndex, chapter, addPrefix, addOnclick) {
	let out =
		`<ul class="adv-headers">`;
	chapter.headers.forEach(c => {
		out +=
			`<li>
				<a href="${addPrefix ? "adventure.html" : ""}#${advId},${chapterIndex},${encodeForHash(c)}" data-chapter="${chapterIndex}" data-header="${c}" ${addOnclick ? `onclick="scrollClick('${c.replace("'", "\\'")}')"` : ""}>${c}</a>
			</li>`
	});
	out +=
		"</ul>";
	return out;
}

function scrollClick (scrollTo) {
	const goTo = $(`div.statsBlockHead > span.entry-title:contains("${scrollTo}")`);
	if (goTo[0]) {
		goTo[0].scrollIntoView();
	}
}