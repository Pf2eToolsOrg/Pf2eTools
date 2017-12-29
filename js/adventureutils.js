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
	// textEquals selector defined below; added on window load
	const goTo = $(`div.statsBlockHead > span.entry-title:textEquals("${scrollTo}")`);
	if (goTo[0]) {
		goTo[0].scrollIntoView();
	}
	const goToSub = $(`div.statsBlockSubHead > span.entry-title:textEquals("${scrollTo}")`);
	if (goToSub[0]) {
		goToSub[0].scrollIntoView();
	}
	const goToInset = $(`div.statsBlockInset > span.entry-title:textEquals("${scrollTo}")`);
	if (goToInset[0]) {
		goToInset[0].scrollIntoView();
	}
}

window.addEventListener("load", () => {
	// Add a selector to match exact text to jQuery's arsenal
	$.expr[':'].textEquals = function(el, i, m) {
		const searchText = m[3];
		const match = $(el).text().trim().match(`^${searchText}$`);
		return match && match.length > 0;
	};
});