const STR_EMPTY = "";
const STR_ABV_TYPE_TALENT = "T";
const STR_ABV_TYPE_DISCIPLINE = "D";
const STR_TYPE_TALENT = "Talent";
const STR_TYPE_DISCIPLINE = "Discipline";

const ID_PSIONICS_LIST = "psionicsList";
const ID_LIST_CONTAINER = "listContainer";
const ID_SOURCE_FILTER = "sourceFilter";
const ID_TYPE_FILTER = "typeFilter";
const ID_ORDER_FILTER = "orderFilter";
const ID_STATS_NAME = "name";
const ID_STATS_ORDER_AND_TYPE = "orderAndType";
const ID_STATS_DURATION = "duration";
const ID_TEXT = "text";

const JSON_ITEM_NAME = "name";
const JSON_ITEM_SOURCE = "source";
const JSON_ITEM_TYPE = "type";
const JSON_ITEM_ORDER = "order";
const JSON_ITEM_TEXT = "text";
const JSON_ITEM_DURATION = "duration";

const ELE_SPAN = "span";
const ELE_LI = "li";
const ELE_OPTION = "option";
const ELE_P = "p";

const ATB_ID = "id";
const ATB_CLASS = "class";
const ATB_DATA_LINK = "data-link";
const ATB_TITLE = "title";
const ATB_VALUE = "value";

const CLS_PSIONICS = "psionics";
const CLS_ROW = "row";
const CLS_COL1 = "col-xs-5";
const CLS_COL2 = "col-xs-2";
const CLS_COL3 = "col-xs-2";
const CLS_COL4 = "col-xs-2";

const LIST_NAME = "name";
const LIST_SOURCE = "source";
const LIST_TYPE = "type";
const LIST_ORDER = "order";

window.onload = function load() {
	const TABLE_VIEW = document.getElementById(ID_PSIONICS_LIST);

	const PSIONIC_LIST = psionicdata.compendium.psionic;
	populateListView(PSIONIC_LIST);
	initFiltersAndSearch(PSIONIC_LIST);
	initListLibrary();
	selectFirstPsionic();

	function populateListView(psionicList) {
		for (let i = 0; i < psionicList.length; ++i) {
			let psionic = psionicList[i];

			let listItem = getListItem(psionic, i);
			listItem.appendChild(getNameSpan(psionic));
			listItem.appendChild(getSourceSpan(psionic));
			listItem.appendChild(getTypeSpan(psionic));
			listItem.appendChild(getOrderSpan(psionic));
			listItem.addEventListener("click", listItemClick, false);

			TABLE_VIEW.appendChild(listItem);
		}

		function getListItem(psionic, i) {
			let listItem = document.createElement(ELE_LI);
			listItem.setAttribute(ATB_CLASS, CLS_ROW);
			listItem.setAttribute(ATB_ID, String(i));
			listItem.setAttribute(ATB_DATA_LINK, utils_nameToDataLink(psionic[JSON_ITEM_NAME]));
			listItem.setAttribute(ATB_TITLE, psionic[JSON_ITEM_NAME]);
			return listItem;
		}
		function getNameSpan(psionic) {
			let span = document.createElement(ELE_SPAN);
			span.classList.add(LIST_NAME);
			span.classList.add(CLS_COL1);
			span.innerHTML = psionic[JSON_ITEM_NAME];
			return span;
		}
		function getSourceSpan(psionic) {
			let span = document.createElement(ELE_SPAN);
			span.classList.add(LIST_SOURCE);
			span.classList.add(CLS_COL2);
			span.innerHTML = parse_sourceToAbv(psionic[JSON_ITEM_SOURCE]);
			return span;
		}
		function getTypeSpan(psionic) {
			let span = document.createElement(ELE_SPAN);
			span.classList.add(LIST_TYPE);
			span.classList.add(CLS_COL3);
			span.innerHTML = parse_psionicTypeToFull(psionic[JSON_ITEM_TYPE]);
			return span;
		}
		function getOrderSpan(psionic) {
			let span = document.createElement(ELE_SPAN);
			span.classList.add(LIST_ORDER);
			span.classList.add(CLS_COL4);
			span.innerHTML = parse_psionicOrderToFull(psionic[JSON_ITEM_ORDER]);
			return span;
		}
		function listItemClick(event) {
			loadDataLink(this);

			function loadDataLink(listItem) {
				window.location = "#" + listItem.getAttribute(ATB_DATA_LINK);
			}
		}
	}

	function initFiltersAndSearch() {
		const filters = {};
		filters[ID_SOURCE_FILTER] = {item: JSON_ITEM_SOURCE, list: [], renderer: function(str) { return parse_sourceToFull(str); }};
		filters[ID_TYPE_FILTER] = {item: JSON_ITEM_TYPE, list: [], renderer: function(str) { return parse_psionicTypeToFull(str); }};
		filters[ID_ORDER_FILTER] = {item: JSON_ITEM_ORDER, list: [], renderer: function(str) { return parse_psionicOrderToFull(str); }};

		populateFilterSets();
		initFilters();

		function populateFilterSets() {
			for (let i = 0; i < PSIONIC_LIST.length; ++i) {
				let psionic = PSIONIC_LIST[i];
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
					let option = document.createElement(ELE_OPTION);
					option.setAttribute(ATB_VALUE, stringToSlug(str));
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
			valueNames: [LIST_NAME, LIST_SOURCE, LIST_TYPE, LIST_ORDER],
			listClass: CLS_PSIONICS,
			sortFunction: listSort
		};

		let psionicsList = new List(ID_LIST_CONTAINER, options);
		psionicsList.sort(LIST_NAME);

		function listSort(itemA, itemB, options) {
			if (options.valueName === LIST_NAME) return compareBy(LIST_NAME);
			else return compareByOrDefault(options.valueName, LIST_NAME);

			function compareBy(valueName) {
				let aValue = itemA.values()[valueName].toLowerCase();
				let bValue = itemB.values()[valueName].toLowerCase();
				if (aValue === bValue) return 0;
				return (aValue > bValue) ? 1 : -1;
			}
			function compareByOrDefault(valueName, defaultValueName) {
				let initialCompare = compareBy(valueName);
				return initialCompare === 0 ? compareBy(defaultValueName) : initialCompare;
			}
		}
	}

	function selectFirstPsionic() {
		let listItems = TABLE_VIEW.getElementsByTagName(ELE_LI);
		if (listItems.length > 0) {
			listItems[0].click();
		}
	}
};

function loadhash (jsonIndex) {
	const STATS_NAME = document.getElementById(ID_STATS_NAME);
	const STATS_ORDER_AND_TYPE = document.getElementById(ID_STATS_ORDER_AND_TYPE);
	const STATS_DURATION = document.getElementById(ID_STATS_DURATION);
	const STATS_TEXT = document.getElementById(ID_TEXT);

	let selectedPsionic = psionicdata.compendium.psionic[jsonIndex];

	STATS_NAME.innerHTML = selectedPsionic[JSON_ITEM_NAME];
	if (selectedPsionic[JSON_ITEM_TYPE] === STR_ABV_TYPE_TALENT) loadTalent();
	else if (selectedPsionic[JSON_ITEM_TYPE] === STR_ABV_TYPE_DISCIPLINE) loadDiscipline();

	function loadTalent() {
		STATS_ORDER_AND_TYPE.innerHTML = parse_psionicTypeToFull(selectedPsionic[JSON_ITEM_TYPE]);
		STATS_TEXT.innerHTML = utils_combineText(selectedPsionic[JSON_ITEM_TEXT], ELE_P);
		STATS_DURATION.innerHTML = STR_EMPTY;
	}
	function loadDiscipline() {
		STATS_ORDER_AND_TYPE.innerHTML = "{0} ({1})".formatUnicorn(parse_psionicTypeToFull(selectedPsionic[JSON_ITEM_TYPE]), selectedPsionic[JSON_ITEM_ORDER]);

		STATS_DURATION.innerHTML = getDurationString();
	}
	function getDurationString() {
		let duration = selectedPsionic[JSON_ITEM_DURATION];
		if (duration === undefined) return STR_EMPTY;
		else return getDurationElement();

		function getDurationElement() {

		}
	}
}

function parse_psionicTypeToFull(type) {
	if (type === STR_ABV_TYPE_TALENT) return STR_TYPE_TALENT;
	else if (type === STR_ABV_TYPE_DISCIPLINE) return STR_TYPE_DISCIPLINE;
	else return type;
}
function parse_psionicOrderToFull(order) {
	return order === undefined ? STR_EMPTY : order;
}
