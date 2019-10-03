"use strict";

class BooksList {
	constructor (options) {
		this.contentsUrl = options.contentsUrl;
		this.fnSort = options.fnSort;
		this.dataProp = options.dataProp;
		this.enhanceRowDataFn = options.enhanceRowDataFn;
		this.rootPage = options.rootPage;
		this.rowBuilderFn = options.rowBuilderFn;

		this.list = null;
		this.dataIx = 0;
		this.dataList = [];
	}

	async pOnPageLoad () {
		ExcludeUtil.pInitialise(); // don't await, as this is only used for search
		const data = await DataUtil.loadJSON(this.contentsUrl);
		return this.pOnJsonLoad(data);
	}

	async pOnJsonLoad (data) {
		const $iptSearch = $(`#search`);

		const fnSort = (a, b, o) => this.fnSort(this.dataList, a, b, o);
		this.list = new List({
			$wrpList: $("ul.books"),
			$iptSearch,
			fnSort
		});
		SortUtil.initBtnSortHandlers($(`#filtertools`), this.list);

		$("#reset").click(() => {
			this.list.reset();

			$(`.showhide`).each((i, ele) => {
				const $ele = $(ele);
				if (!$ele.data("hidden")) {
					BookUtil.indexListToggle(null, ele);
				}
			});
		});

		this.addData(data);
		const brewData = await BrewUtil.pAddBrewData();
		await handleBrew(brewData);
		BrewUtil.bind({list: this.list});
		try {
			await BrewUtil.pAddLocalBrewData();
		} catch (e) {
			await BrewUtil.pPurgeBrew(e);
		}
		BrewUtil.makeBrewButton("manage-brew");
		this.list.init();
	}

	addData (data) {
		if (!data[this.dataProp] || !data[this.dataProp].length) return;

		this.dataList = this.dataList.concat(data[this.dataProp]);

		for (; this.dataIx < this.dataList.length; this.dataIx++) {
			const it = this.dataList[this.dataIx];
			if (this.enhanceRowDataFn) this.enhanceRowDataFn(it);

			const eleLi = document.createElement("li");

			eleLi.innerHTML = `<a href="${this.rootPage}#${UrlUtil.encodeForHash(it.id)}" class="book-name">
				<span class="w-100">${this.rowBuilderFn(it)}</span>
				<span class="showhide" onclick="BookUtil.indexListToggle(event, this)" data-hidden="true">[+]</span>
			</a>
			${BookUtil.makeContentsBlock({book: it, addPrefix: this.rootPage, defaultHidden: true})}`;

			const listItem = new ListItem(
				this.dataIx,
				eleLi,
				it.name,
				{
					source: it.id,
					uniqueid: it.uniqueId
				}
			);

			this.list.addItem(listItem);
		}

		this.list.update();
	}
}
