"use strict";

const JSON_URL = "data/rules.json";

let renderArea;
let books;
let bookData;

window.onload = function load () {
	renderArea = $(`#pagecontent`);

	renderArea.append(EntryRenderer.utils.getBorderTr());
	renderArea.append(`<tr><td colspan="6" class="initial-message">Loading...</td></tr>`);
	renderArea.append(EntryRenderer.utils.getBorderTr());

	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad (data) {
	books = data.book;
	bookData = data.data;

	const allContents = $("ul.contents");

	let tempString = "";
	for (let i = 0; i < books.length; i++) {
		const book = books[i];

		tempString +=
			`<li class="contents-item" data-bookid="${UrlUtil.encodeForHash(book.id)}">
				<a id="${i}" href='#${book.id},0' title='${book.name}'>
					<span class='name'>${book.name}</span>
				</a>
				${BookUtil.makeContentsBlock({book: book, addOnclick: true})}
			</li>`;
	}
	allContents.append(tempString);

	BookUtil.addHeaderHandles();

	const list = new List("listcontainer", {
		valueNames: ['name'],
		listClass: "contents"
	});

	window.onhashchange = rulesHashChange;
	if (window.location.hash.length) {
		rulesHashChange();
	} else {
		$(`.contents-item`).show();
	}

	// addSearch( ... ) // TODO migrate this across
}

const renderer = new EntryRenderer();
function rulesHashChange () {
	const [bookId, ...hashParts] = window.location.hash.slice(1).split(HASH_PART_SEP);
	const fromIndex = books.find(bk => UrlUtil.encodeForHash(bk.id) === UrlUtil.encodeForHash(bookId));
	const fromDataK = Object.keys(bookData).find(k => UrlUtil.encodeForHash(k) === UrlUtil.encodeForHash(bookId));
	if (fromIndex && fromDataK) {
		const allContents = $(`.contents-item`);
		BookUtil.thisContents = allContents.filter(`[data-bookid="${UrlUtil.encodeForHash(bookId)}"]`);

		BookUtil.showBookContent(bookData[fromDataK], fromIndex, bookId, hashParts, renderer, renderArea);
	} else {
		throw new Error("No rules book with ID: " + bookId);
	}
}
