"use strict";

const CONTENTS_URL = "data/books.json";

let booksIndex;

window.onload = function load () {
	DataUtil.loadJSON(CONTENTS_URL, onJsonLoad);
};

function onJsonLoad (data) {
	booksIndex = data.book;

	const booksList = $("ul.books");
	let tempString = "";
	for (let i = 0; i < booksIndex.length; i++) {
		const book = booksIndex[i];

		tempString +=
			`<li ${FLTR_ID}="${i}">
				<a href='book.html#${book.id}' title='${book.name}' class="adv-name">
					<span class='name'>
						<span class="col-xs-6 col-xs-6-2">${book.name}</span>
					</span>
					<span class="showhide" onclick="BookUtil.indexListToggle(event, this)" data-hidden="true">[+]</span>
					<span class="source" style="display: none">${book.id}</span>
				</a>
				${BookUtil.makeContentsBlock({book: book, addPrefix: "book.html", defaultHidden: true})}
			</li>`;
	}
	booksList.append(tempString);

	const list = new List("listcontainer", {
		valueNames: ['name', 'source'],
		listClass: "books"
	});

	$("#filtertools").find("button.sort").on(EVNT_CLICK, function () {
		const $this = $(this);
		if ($this.attr("sortby") === "asc") {
			$this.attr("sortby", "desc");
		} else $this.attr("sortby", "asc");
		list.sort($this.data("sort"), {order: $this.attr("sortby")});
	});

	list.sort("name");
	$("#reset").click(function () {
		$("#search").val("");
		list.search();
		list.sort("name");
		list.filter();
		$(`.showhide`).each((i, ele) => {
			const $ele = $(ele);
			if (!$ele.data("hidden")) {
				BookUtil.indexListToggle(null, ele);
			}
		});
	});
}