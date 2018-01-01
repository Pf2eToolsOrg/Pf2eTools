"use strict";

let renderArea;

let adventures;
const adventureContent = {};

const TABLE_START = `<tr><th class="border" colspan="6"></th></tr>`;
const TABLE_END = `<tr><th class="border" colspan="6"></th></tr>`;

// track mouse position
let cX;
let cY;
document.onmousemove = function (e) {
	cX = e.clientX;
	cY = e.clientY;
};

window.onload = function load () {
	renderArea = $(`#stats`);

	renderArea.append(TABLE_START);
	renderArea.append(`<tr><td colspan="6" class="initial-message">Select an adventure to begin</td></tr>`);
	renderArea.append(TABLE_END);

	loadJSON(CONTENTS_URL, onJsonLoad);
};

function onJsonLoad (data) {
	adventures = data.adventure;

	const adventuresList = $("ul.contents");
	adventuresList.append($(`
		<li>
			<a href='adventures.html'>
				<span class='name'>\u21FD All Adventures</span>
			</a>
		</li>
	`));

	let tempString = "";
	for (let i = 0; i < adventures.length; i++) {
		const adv = adventures[i];

		tempString +=
			`<li class="adventure-contents-item" data-adventureid="${UrlUtil.encodeForHash(adv.id)}">
				<a id="${i}" href='#${adv.id},0' title='${adv.name}'>
					<span class='name'>${adv.name}</span>
				</a>
				${makeContentsBlock(adv, false, true, false)}
			</li>`;
	}
	adventuresList.append(tempString);

	// Add show/hide handles to section names, and update styles
	const allAdvHeaders = $(`ul.adv-headers`);
	// add styles to all
	allAdvHeaders.prev(`li`).find(`a`).css("display", "flex").css("justify-content", "space-between").css("padding", "0");
	// add expand/collapse to only those with children
	allAdvHeaders.filter((i, ele) => $(ele).children().length).prev(`li`).find(`a`).append(`<span class="showhide" onclick="sectToggle(event, this)" data-hidden="false">[\u2013]</span>`);

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	window.onhashchange = hashChange;
	if (window.location.hash.length) {
		hashChange();
	}
}

// custom loading for this page, so it can serve multiple sources
function hashChange () {
	const [advId, ...hashParts] = window.location.hash.slice(1).split(HASH_PART_SEP);
	const fromIndex = adventures.filter(adv => UrlUtil.encodeForHash(adv.id) === UrlUtil.encodeForHash(advId));
	if (fromIndex.length) {
		document.title = `${fromIndex[0].name} - 5etools`;
		// prevent TftYP names from causing the header to wrap
		const shortName = fromIndex[0].name.includes(Parser.SOURCE_JSON_TO_FULL[SRC_TYP]) ? fromIndex[0].name.replace(Parser.SOURCE_JSON_TO_FULL[SRC_TYP], Parser.sourceJsonToAbv(SRC_TYP)) : fromIndex[0].name;
		$(`.adv-header`).html(shortName);
		$(`.adv-message`).html("Select a chapter on the left, and browse the content on the right");
		loadAdventure(fromIndex[0], advId, hashParts);
	} else {
		throw new Error("No adventure with ID: " + advId);
	}
}

let allContents;
let thisContents;

function loadAdventure (fromIndex, advId, hashParts) {
	if (adventureContent[advId] !== undefined) {
		handle(adventureContent[advId]);
	} else {
		loadJSON(`data/adventure/adventure-${advId}.json`, function (data) {
			adventureContent[advId] = data.data;
			handle(data.data);
		});
	}

	function handle (data) {
		allContents = $(`.adventure-contents-item`);
		thisContents = allContents.filter(`[data-adventureid="${UrlUtil.encodeForHash(advId)}"]`);
		thisContents.show();
		allContents.filter(`[data-adventureid!="${UrlUtil.encodeForHash(advId)}"]`).hide();
		onAdventureLoad(data, fromIndex, advId, hashParts);
		addSearch(fromIndex, advId);
	}
}

const renderer = new EntryRenderer();

const curRender = {
	curAdvId: "NONE",
	chapter: -1
};

function onAdventureLoad (data, fromIndex, advId, hashParts) {
	let chapter = 0;
	let scrollTo;
	let forceScroll = false;
	if (hashParts && hashParts.length > 0) chapter = Number(hashParts[0]);
	if (hashParts && hashParts.length > 1) {
		scrollTo = $(`[href="#${advId},${chapter},${hashParts[1]}"]`).data("header");

		// fallback to scanning the document
		if (!scrollTo) {
			scrollTo = decodeURIComponent(hashParts[1]);
			forceScroll = true;
		}
	}

	if (curRender.chapter !== chapter || curRender.curAdvId !== advId) {
		thisContents.children(`ul`).children(`ul, li`).removeClass("active");
		thisContents.children(`ul`).children(`li:nth-of-type(${chapter + 1}), ul:nth-of-type(${chapter + 1})`).addClass("active");

		curRender.curAdvId = advId;
		curRender.chapter = chapter;
		renderArea.html("");

		renderArea.append(TABLE_START);
		const textStack = [];
		renderer.recursiveEntryRender(data[chapter], textStack);
		renderArea.append(`<tr class='text'><td colspan='6'>${textStack.join("")}</td></tr>`);
		renderArea.append(TABLE_END);

		if (scrollTo) {
			setTimeout(() => {
				scrollClick(scrollTo);
			}, 75)
		}
	} else {
		if (hashParts.length <= 1) {
			$(window).scrollTop(0);
		} else if (forceScroll) {
			scrollClick(scrollTo);
		}
	}
}

function sectToggle (evt, ele) {
	evt.stopPropagation();
	evt.preventDefault();
	const $ele = $(ele);
	const $childList = $ele.closest(`li`).next(`ul.adv-headers`);
	if ($ele.data("hidden")) {
		$childList.show();
		$ele.data("hidden", false);
		$ele.html(`[\u2013]`);
	} else {
		$childList.hide();
		$ele.data("hidden", true);
		$ele.html(`[+]`);
	}
}

let $body;
let $findAll;

function addSearch (indexData, advId) {
	$body = $body || $(`body`);

	$body.on("click", () => {
		if ($findAll) $findAll.remove();
	});

	$body.off("keypress");
	$body.on("keypress", (e) => {
		if ((e.key === "f" && noModifierKeys(e))) {
			if ($findAll) $findAll.remove();
			const winWidth = window.innerWidth;
			const winHeight = window.innerHeight;
			const flipX = cX > (winWidth - 700);
			const flipY = cY > (winHeight - 500);
			$findAll = $(`<div class="f-all-wrapper"/>`).on("click", (e) => {
				e.stopPropagation();
			});

			if (flipX) $findAll.css("right", 10);
			else $findAll.css("left", cX);
			if (flipY) $findAll.css("bottom", 10);
			else $findAll.css("top", cY);

			const $results = $(`<div class="f-all-out">`);
			const $srch = $(`<input class="form-control" placeholder="Find text...">`).on("keypress", (e) => {
				e.stopPropagation();
				if (e.key === "Enter" && noModifierKeys(e)) {
					$results.html("");
					const found = [];
					const toSearch = adventureContent[advId];
					toSearch.forEach((s, i) => searchEntriesFor(i, "", found, $srch.val(), s));
					if (found.length) {
						$results.show();
						found.forEach(f => {
							$results.append(`
							<p>
								<a href="#${UrlUtil.encodeForHash(advId)}${HASH_PART_SEP}${f.ch}${f.h ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(f.h)}` : ""}">
									<i>${indexData.contents[f.ch].name}: ${f.h}</i> | ${f.p}
								</a>
							</p>`);
						})
					} else {
						$results.hide();
					}
				}
			});
			$findAll.append($srch).append($results);

			$body.append($findAll);

			$srch.focus();
			// because somehow creating an input box from an event and then focusing it adds the "f" character? :joy:
			setTimeout(() => {
				$srch.val("");
			}, 5)
		}
	});

	function noModifierKeys (e) {
		return !e.ctrlKey && !e.altKey && !e.metaKey;
	}

	const EXTRA_WORDS = 2;
	function searchEntriesFor (chapterIndex, prevLastName, appendTo, term, obj) {
		if (term === undefined || term === null) return;
		const cleanTerm = term.toLowerCase().trim();
		if (!cleanTerm) return;

		const lastName = obj.name ? obj.name : prevLastName;
		if (obj.entries) {
			obj.entries.forEach(e => searchEntriesFor(chapterIndex, lastName, appendTo, term, e))
		} else if (obj.items) {
			obj.items.forEach(e => searchEntriesFor(chapterIndex, lastName, appendTo, term, e))
		} else if (obj.rows) {
			obj.rows.forEach(r => {
				r.forEach(c => searchEntriesFor(chapterIndex, lastName, appendTo, term, c));
			})
		} else if (typeof obj === "string") {
			const renderStack = [];
			renderer.recursiveEntryRender(obj, renderStack);
			const rendered = $(`<p>${renderStack.join("")}</p>`).text();

			const toCheck = rendered.toLowerCase();
			if (toCheck.includes(cleanTerm)) {
				if (!appendTo.length || appendTo[appendTo.length - 1].h !== lastName) {
					const first = toCheck.indexOf(cleanTerm);
					const last = toCheck.lastIndexOf(cleanTerm);

					const slice = first === last
						? getSubstring(rendered, first, first)
						: `${getSubstring(rendered, first, first + cleanTerm.length)} ... ${getSubstring(rendered, last, last + cleanTerm.length)}`;
					appendTo.push({ch: chapterIndex, h: lastName, p: slice});
				}
			}
		} else if (!(obj.type === "image" || obj.type === "link")) {
			throw new Error("Unhandled entity type")
		}

		function getSubstring (rendered, first, last) {
			let spaceCount = 0;
			let braceCount = 0;
			let pre = "";
			let i = first - 1;
			for (; i >= 0; --i) {
				pre = rendered.charAt(i) + pre;
				if (rendered.charAt(i) === " " && braceCount === 0) {
					spaceCount++;
				}
				if (spaceCount > EXTRA_WORDS) {
					break;
				}
			}
			pre = pre.trimLeft();
			const preDots = i > 0;

			spaceCount = 0;
			let post = "";
			const start = first === last ? last + cleanTerm.length : last;
			i = Math.min(start, rendered.length);
			for (; i < rendered.length; ++i) {
				post += rendered.charAt(i);
				if (rendered.charAt(i) === " " && braceCount === 0) {
					spaceCount++;
				}
				if (spaceCount > EXTRA_WORDS) {
					break;
				}
			}
			post = post.trimRight();
			const postDots = i < rendered.length;

			return `${preDots ? "..." : ""}${pre}<span class="highlight">${term}</span>${post}${postDots ? "..." : ""}`
		}
	}
}