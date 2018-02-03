"use strict";

const JSON_URL = "data/psionics.json";

const STR_JOIN_MODE_LIST = ",";
const TMP_HIDDEN_MODE = `"{0}"`;

const ID_PSIONICS_LIST = "psionicsList";
const ID_STATS_ORDER_AND_TYPE = "orderAndType";
const ID_TEXT = "text";

const JSON_ITEM_NAME = "name";
const JSON_ITEM_SOURCE = "source";
const JSON_ITEM_TYPE = "type";
const JSON_ITEM_ORDER = "order";
const JSON_ITEM_MODES = "modes";
const JSON_ITEM_SUBMODES = "submodes";
const JSON_ITEM_MODE_TITLE = "title";
const CLS_PSIONICS = "psionics";
const CLS_COL1 = "col-xs-5";
const CLS_COL2 = "col-xs-2";
const CLS_COL3 = "col-xs-2";
const CLS_COL4 = "col-xs-2";
const CLS_HIDDEN = "hidden";
const CLS_LI_NONE = "list-entry-none";

const LIST_NAME = "name";
const LIST_SOURCE = "source";
const LIST_TYPE = "type";
const LIST_ORDER = "order";
const LIST_MODE_LIST = "mode-list";

function getHiddenModeList (psionic) {
	const modeList = psionic[JSON_ITEM_MODES];
	if (modeList === undefined) return STR_EMPTY;
	const outArray = [];
	for (let i = 0; i < modeList.length; ++i) {
		outArray.push(TMP_HIDDEN_MODE.formatUnicorn(modeList[i][JSON_ITEM_MODE_TITLE]));
		if (modeList[i][JSON_ITEM_SUBMODES] !== undefined) {
			const subModes = modeList[i][JSON_ITEM_SUBMODES];
			for (let j = 0; j < subModes.length; ++j) {
				outArray.push(TMP_HIDDEN_MODE.formatUnicorn(subModes[j][JSON_ITEM_MODE_TITLE]))
			}
		}
	}
	return outArray.join(STR_JOIN_MODE_LIST);
}

window.onload = function load () {
	DataUtil.loadJSON(JSON_URL, onJsonLoad);
};

let PSIONIC_LIST;

function onJsonLoad (data) {
	PSIONIC_LIST = data.psionic;

	const sourceFilter = getSourceFilter({
		deselFn: function (val) {
			return false;
		}
	});
	const typeFilter = new Filter({header: "Type", items: [Parser.PSI_ABV_TYPE_TALENT, Parser.PSI_ABV_TYPE_DISCIPLINE], displayFn: Parser.psiTypeToFull});
	const orderFilter = new Filter({
		header: "Order",
		items: ["Avatar", "Awakened", "Immortal", "Nomad", "Wu Jen", Parser.PSI_ORDER_NONE]
	});

	const filterBox = initFilterBox(sourceFilter, typeFilter, orderFilter);

	let tempString = "";
	PSIONIC_LIST.forEach(function (p, i) {
		p[JSON_ITEM_ORDER] = Parser.psiOrderToFull(p[JSON_ITEM_ORDER]);

		tempString += `
			<li class='row' ${FLTR_ID}="${i}">
				<a id='${i}' href='#${UrlUtil.autoEncodeHash(p)}' title="${p[JSON_ITEM_NAME]}">
					<span class='${LIST_NAME} ${CLS_COL1}'>${p[JSON_ITEM_NAME]}</span>
					<span class='${LIST_SOURCE} ${CLS_COL2}' title="${Parser.sourceJsonToFull(p[JSON_ITEM_SOURCE])}">${Parser.sourceJsonToAbv(p[JSON_ITEM_SOURCE])}</span>
					<span class='${LIST_TYPE} ${CLS_COL3}'>${Parser.psiTypeToFull(p[JSON_ITEM_TYPE])}</span>
					<span class='${LIST_ORDER} ${CLS_COL4} ${p[JSON_ITEM_ORDER] === STR_NONE ? CLS_LI_NONE : STR_EMPTY}'>${p[JSON_ITEM_ORDER]}</span>
					<span class='${LIST_MODE_LIST} ${CLS_HIDDEN}'>${getHiddenModeList(p)}</span>
				</a>
			</li>
		`;

		// populate filters
		sourceFilter.addIfAbsent(p[JSON_ITEM_SOURCE]);
	});
	$(`#${ID_PSIONICS_LIST}`).append(tempString);

	// sort filters
	sourceFilter.items.sort(SortUtil.ascSort);

	const list = ListUtil.search({
		valueNames: [LIST_NAME, LIST_SOURCE, LIST_TYPE, LIST_ORDER, LIST_MODE_LIST],
		listClass: CLS_PSIONICS,
		sortFunction: SortUtil.listSort
	});

	filterBox.render();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		handleFilterChange
	);

	function handleFilterChange () {
		const f = filterBox.getValues();
		list.filter(function (item) {
			const p = PSIONIC_LIST[$(item.elm).attr(FLTR_ID)];

			const rightSource = sourceFilter.toDisplay(f, p.source);
			const rightType = typeFilter.toDisplay(f, p.type);
			const rightOrder = orderFilter.toDisplay(f, p.order);

			return rightSource && rightType && rightOrder;
		});
	}

	initHistory();
	handleFilterChange();
	RollerUtil.addListRollButton();
}

let renderer;
function loadhash (jsonIndex) {
	if (!renderer) renderer = new EntryRenderer();

	const $name = $(`th.name`);
	const STATS_ORDER_AND_TYPE = document.getElementById(ID_STATS_ORDER_AND_TYPE);
	const STATS_TEXT = document.getElementById(ID_TEXT);

	const selectedPsionic = PSIONIC_LIST[jsonIndex];

	$name.html(selectedPsionic[JSON_ITEM_NAME]);
	if (selectedPsionic[JSON_ITEM_TYPE] === Parser.PSI_ABV_TYPE_TALENT) loadTalent();
	else if (selectedPsionic[JSON_ITEM_TYPE] === Parser.PSI_ABV_TYPE_DISCIPLINE) loadDiscipline();

	function loadTalent () {
		STATS_ORDER_AND_TYPE.innerHTML = Parser.psiTypeToFull(selectedPsionic[JSON_ITEM_TYPE]);
		STATS_TEXT.innerHTML = EntryRenderer.psionic.getTalentText(selectedPsionic, renderer);
	}

	function loadDiscipline () {
		STATS_ORDER_AND_TYPE.innerHTML = `${selectedPsionic[JSON_ITEM_ORDER]} ${Parser.psiTypeToFull(selectedPsionic[JSON_ITEM_TYPE])}`;
		STATS_TEXT.innerHTML = EntryRenderer.psionic.getDisciplineText(selectedPsionic, renderer);
	}
}
