"use strict";

const BookUtil = {
	scrollClick: (scrollTo, scrollIndex) => {
		const selectors = [
			`div.statsBlockSectionHead > span.entry-title:textEquals("${scrollTo}")`,
			`div.statsBlockHead > span.entry-title:textEquals("${scrollTo}")`,
			`div.statsBlockSubHead > span.entry-title:textEquals("${scrollTo}")`,
			`div.statsBlockInset > span.entry-title:textEquals("${scrollTo}")`
		];

		if (scrollIndex === undefined) {
			// textEquals selector defined below; added on window load
			const goToSect = $(selectors[0]);
			if (goToSect.length) {
				goToSect[goToSect.length - 1].scrollIntoView();
				return;
			}
			const goTo = $(selectors[1]);
			if (goTo.length) {
				goTo[goTo.length - 1].scrollIntoView();
				return;
			}
			const goToSub = $(selectors[2]);
			if (goToSub.length) {
				goToSub[goToSub.length - 1].scrollIntoView();
				return;
			}
			const goToInset = $(selectors[3]);
			if (goToInset.length) {
				goToInset[goToInset.length - 1].scrollIntoView();
			}
		} else {
			const goTo = $(`${selectors[0]}, ${selectors[1]}, ${selectors[2]}, ${selectors[3]}`);
			if (goTo.length) {
				if (goTo[scrollIndex]) goTo[scrollIndex].scrollIntoView();
				else goTo[goTo.length - 1].scrollIntoView();
			}
		}
	},

	makeContentsBlock: (options) => {
		let out =
			`<ul class="bk-contents" ${options.defaultHidden ? `style="display: none;"` : ""}>`;

		options.book.contents.forEach((c, i) => {
			out +=
				`<li>
				<a href="${options.addPrefix || ""}#${options.book.id},${i}" ${options.addOnclick ? `onclick="$(window).scrollTop(0);"` : ""}>
					<span class="sect">${BookUtil.getOrdinalText(c.ordinal)}${c.name}</span>
				</a>
			</li>`;
			out += BookUtil.makeHeadersBlock(options.book.id, i, c, options.addPrefix, options.addOnclick, options.defaultHeadersHidden);
		});

		out +=
			"</ul>";
		return out;
	},

	getOrdinalText: (ordinal) => {
		if (ordinal === undefined) return "";
		return `${ordinal.type === "part" ? `Part ${ordinal.identifier} \u2014 ` : ordinal.type === "chapter" ? `Ch. ${ordinal.identifier}: ` : ordinal.type === "episode" ? `Ep. ${ordinal.identifier}: ` : `App. ${ordinal.identifier}: `}`;
	},

	makeHeadersBlock: (bookId, chapterIndex, chapter, addPrefix, addOnclick, defaultHeadersHidden) => {
		let out =
			`<ul class="bk-headers" ${defaultHeadersHidden ? `style="display: none;"` : ""}>`;
		chapter.headers && chapter.headers.forEach(c => {
			out +=
				`<li>
				<a href="${addPrefix || ""}#${bookId},${chapterIndex},${UrlUtil.encodeForHash(c)}" data-book="${bookId}" data-chapter="${chapterIndex}" data-header="${c}" ${addOnclick ? `onclick="BookUtil.scrollClick('${c.replace(/'/g, "\\'")}')"` : ""}>${c}</a>
			</li>`
		});
		out +=
			"</ul>";
		return out;
	},

	addHeaderHandles: (defHidden) => {
		// Add show/hide handles to section names, and update styles
		const allHeaders = $(`ul.bk-headers`);
		// add styles to all
		allHeaders.prev(`li`).find(`a`).css("display", "flex").css("justify-content", "space-between").css("padding", "0");
		allHeaders.filter((i, ele) => $(ele).children().length).each((i, ele) => {
			const $ele = $(ele);
			// add expand/collapse to only those with children
			$ele.prev(`li`).find(`a`).append(`<span class="showhide" onclick="BookUtil.sectToggle(event, this)" data-hidden="true">${defHidden ? `[+]` : `[\u2013]`}</span>`);
		});
	},

	sectToggle:  (evt, ele) => {
		evt.stopPropagation();
		evt.preventDefault();
		const $ele = $(ele);
		const $childList = $ele.closest(`li`).next(`ul.bk-headers`);
		if ($ele.data("hidden")) {
			$childList.show();
			$ele.data("hidden", false);
			$ele.html(`[\u2013]`);
		} else {
			$childList.hide();
			$ele.data("hidden", true);
			$ele.html(`[+]`);
		}
	},

	thisContents: null,
	curRender: {
		curAdvId: "NONE",
		chapter: -1,
		data: {}
	},
	showBookContent: (data, fromIndex, bookId, hashParts, renderer, renderArea) => {
		let chapter = 0;
		let scrollTo;
		let scrollIndex;
		let forceScroll = false;
		if (hashParts && hashParts.length > 0) chapter = Number(hashParts[0]);
		if (hashParts && hashParts.length > 1) {
			scrollTo = $(`[href="#${bookId},${chapter},${hashParts[1]}"]`).data("header");

			// fallback to scanning the document
			if (!scrollTo) {
				scrollTo = decodeURIComponent(hashParts[1]);
				if (hashParts[2]) scrollIndex = Number(hashParts[2]);
				forceScroll = true;
			}
		}

		BookUtil.curRender.data = data;
		if (BookUtil.curRender.chapter !== chapter || BookUtil.curRender.curAdvId !== bookId) {
			BookUtil.thisContents.children(`ul`).children(`ul, li`).removeClass("active");
			BookUtil.thisContents.children(`ul`).children(`li:nth-of-type(${chapter + 1}), ul:nth-of-type(${chapter + 1})`).addClass("active");
			const $showHideBtn = BookUtil.thisContents.children(`ul`).children(`li:nth-of-type(${chapter + 1})`).find(`.showhide`);
			if ($showHideBtn.data("hidden")) $showHideBtn.click();

			BookUtil.curRender.curAdvId = bookId;
			BookUtil.curRender.chapter = chapter;
			renderArea.html("");

			renderArea.append(EntryRenderer.utils.getBorderTr());
			const textStack = [];
			renderer.recursiveEntryRender(data[chapter], textStack);
			renderArea.append(`<tr class='text'><td colspan='6'>${textStack.join("")}</td></tr>`);
			renderArea.append(EntryRenderer.utils.getBorderTr());

			if (scrollTo) {
				setTimeout(() => {
					BookUtil.scrollClick(scrollTo, scrollIndex);
				}, 75)
			}
		} else {
			if (hashParts.length <= 1) {
				$(window).scrollTop(0);
			} else if (forceScroll) {
				BookUtil.scrollClick(scrollTo, scrollIndex);
			}
		}
	}
};