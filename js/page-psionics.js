window.onload = function load() {

	const tableView = document.getElementById("psionics-list");

	let psionicList = psionicdata.compendium.psionic;
	populateListView(psionicList);
	initFiltersAndSearch(psionicList);
	initListLibrary();

	function populateListView(psionicList) {
		for (let i = 0; i < psionicList.length; ++i) {
			let psionic = psionicList[i];

			let listItem = getListItem(psionic, i);
			listItem.appendChild(getNameSpan(psionic));
			listItem.appendChild(getSourceSpan(psionic));
			listItem.appendChild(getTypeSpan(psionic));
			listItem.appendChild(getOrderSpan(psionic));

			tableView.appendChild(listItem);
		}

		function getListItem(psionic, i) {
			let listItem = document.createElement('li');
			listItem.setAttribute("class", "row");
			listItem.setAttribute("id", String(i));
			listItem.setAttribute("data-link", utils_nameToDataLink(psionic.name));
			listItem.setAttribute("title", psionic.name);
			return listItem;
		}
		function getNameSpan(psionic) {
			let span = document.createElement('span');
			span.setAttribute("class", "name col-xs-5");
			span.innerHTML = psionic.name;
			return span;
		}
		function getSourceSpan(psionic) {
			let span = document.createElement('span');
			span.setAttribute("class", "source col-xs-2");
			span.innerHTML = parse_sourceToAbv(psionic.source);
			return span;
		}
		function getTypeSpan(psionic) {
			let span = document.createElement('span');
			span.setAttribute("class", "type col-xs-2");
			span.innerHTML = parse_psionicTypeToFull(psionic.type);
			return span;
		}
		function getOrderSpan(psionic) {
			let span = document.createElement('span');
			span.setAttribute("class", "order col-xs-3");
			span.innerHTML = parse_psionicOrderToFull(psionic.order);
			return span;
		}
	}

	function initFiltersAndSearch() {
		// ids from html; items from json
		const filters = {
			sourceFilter: {item: "source", list: [], renderer: function(str) { return parse_sourceToFull(str); }},
			typeFilter: {item: "type", list: [], renderer: function(str) { return parse_psionicTypeToFull(str); }},
			orderFilter: {item: "order", list: [], renderer: function(str) { return parse_psionicOrderToFull(str); }}
		};

		populateFilterSets();
		initFilters();

		function populateFilterSets() {
			for (let i = 0; i < psionicList.length; ++i) {
				let psionic = psionicList[i];
				for (let id in filters) {
					if (filters.hasOwnProperty(id)) {
						let filterObj = filters[id];

						if (psionic[filterObj.item] !== undefined && filterObj.list.indexOf(psionic[filterObj.item]) === -1) {
							filterObj.list.push(psionic[filterObj.item]);
						}
					}
				}
			}
		}

		function initFilters() {
			addOptions();

			function addOptions() {
				for (let id in filters) {
					if (filters.hasOwnProperty(id)) {
						let filterBox = document.getElementById(id);

						sortStrings(filters[id].list);
						for (let i = 0; i < filters[id].list.length; ++i) {
							let option = getFilterOption(filters[id].list[i], filters[id].renderer);
							filterBox.appendChild(option);
						}
					}
				}

				function sortStrings(toSort) {
					toSort.sort(sortStringsComparator);
				}
				function sortStringsComparator(a, b) {
					a = a.toLowerCase();
					b = b.toLowerCase();
					if (a === b) return 0;
					else if (b < a) return 1;
					else if (a > b) return -1;
				}
				function getFilterOption(str, renderer) {
					let option = document.createElement('option');
					option.setAttribute("value", stringToSlug(str));
					option.innerHTML = renderer(str);
					return option;
				}
			}
		}


		function stringToSlug(str) {
			return str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
		}
	}

	function initListLibrary() {
		let options = {
			valueNames: ['name', 'source', 'type', 'order'],
			listClass: "psionics"
		};

		let psionicsList = new List("listcontainer", options);
		psionicsList.sort("name");
	}

	function parse_psionicTypeToFull(type) {
		if (type === "T") return "Talent";
		else if (type === "D") return "Discipline";
		else return type;
	}
	function parse_psionicOrderToFull(order) {
		return order === undefined ? "" : order;
	}
};

