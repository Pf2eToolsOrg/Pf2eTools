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
		return `${ordinal.type === "part" ? `Part ${ordinal.identifier} \u2014 ` : ordinal.type === "chapter" ? `Ch. ${ordinal.identifier}: ` : ordinal.type === "episode" ? `Ep. ${ordinal.identifier}: ` : `App. ${ordinal.identifier}: `}`;
	}
}

function makeHeadersBlock (advId, chapterIndex, chapter, addPrefix, addOnclick) {
	let out =
		`<ul class="adv-headers">`;
	chapter.headers && chapter.headers.forEach(c => {
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
	if (goTo.length) {
		goTo[goTo.length - 1].scrollIntoView();
		return;
	}
	const goToSub = $(`div.statsBlockSubHead > span.entry-title:textEquals("${scrollTo}")`);
	if (goToSub.length) {
		goToSub[goToSub.length - 1].scrollIntoView();
		return;
	}
	const goToInset = $(`div.statsBlockInset > span.entry-title:textEquals("${scrollTo}")`);
	if (goToInset.length) {
		goToInset[goToInset.length - 1].scrollIntoView();
	}
}

window.addEventListener("load", () => {
	// Add a selector to match exact text to jQuery's arsenal
	$.expr[':'].textEquals = (el, i, m) => {
		const searchText = m[3];
		const match = $(el).text().trim().match(`^${searchText}$`);
		return match && match.length > 0;
	};
});