"use strict";

const JSON_URL = "data/names.json";

let nameList;
const renderer = Renderer.get();

function makeContentsBlock (i, loc) {
	let out = "<ul>";
	loc.tables.forEach((t, j) => {
		const tableName = getTableName(loc, t);
		out += `<li><a id="${i},${j}" href="#${UrlUtil.encodeForHash([loc.name, loc.source, t.option])}" title="${tableName}">${tableName}</a></li>`;
	});
	out += "</ul>";
	return out;
}

function getTableName (loc, table) {
	return `${loc.name} - ${table.option}`;
}

window.onload = function load () {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
};

window.onhashchange = () => {
	const [link] = Hist._getHashParts();
	const $a = $(`a[href="#${link}"]`);
	if (!$a.length || !link) {
		window.location.hash = $(`.list.names`).find("a").attr("href");
		return;
	}
	const id = $a.attr("id");
	document.title = `${$a.attr("title")} - 5etools`;
	loadHash(id);
};

let list;
function onJsonLoad (data) {
	nameList = data.name;

	list = ListUtil.initList({
		listClass: "names"
	});
	ListUtil.setOptions({primaryLists: [list]});

	for (let i = 0; i < nameList.length; i++) {
		const loc = nameList[i];

		const eleLi = document.createElement("li");

		eleLi.innerHTML = `<span class="name" onclick="showHideList(this)" title="Source: ${Parser.sourceJsonToFull(loc.source)}">${loc.name}</span>${makeContentsBlock(i, loc)}`;

		const listItem = new ListItem(i, eleLi, loc.name);

		list.addItem(listItem);
	}

	list.init();
	window.onhashchange();
}

function showHideList (ele) {
	const $ele = $(ele);
	$ele.next(`ul`).toggle();
}

function loadHash (id) {
	renderer.setFirstSection(true);

	const [iLoad, jLoad] = id.split(",").map(n => Number(n));
	const race = nameList[iLoad];
	const table = race.tables[jLoad].table;
	const tableName = getTableName(race, race.tables[jLoad]);
	const diceType = race.tables[jLoad].diceType;

	let htmlText = `
		<tr>
			<td colspan="6">
				<table class="striped-odd">
					<caption>${tableName}</caption>
					<thead>
						<tr>
							<th class="col-2 text-center">
								<span class="roller" onclick="rollAgainstTable('${iLoad}', '${jLoad}')">d${diceType}</span>
							</th>
							<th class="col-10">Name</th>
						</tr>
					</thead>`;

	for (let i = 0; i < table.length; i++) {
		const range = table[i].min === table[i].max ? pad(table[i].min) : `${pad(table[i].min)}-${pad(table[i].max)}`;
		htmlText += `<tr><td class="text-center">${range}</td><td>${getRenderedText(table[i].result)}</td></tr>`;
	}

	htmlText += `
				</table>
			</td>
		</tr>`;
	$("#pagecontent").html(htmlText);

	// update list highlights
	$(".list.names").find(`.list-multi-selected`).removeClass("list-multi-selected");
	$(`a[id="${id}"]`).parent().addClass("list-multi-selected");
}

function pad (number) {
	return String(number).padStart(2, "0");
}

function getRenderedText (rawText) {
	if (rawText.indexOf("{@") !== -1) {
		const stack = [];
		renderer.recursiveRender(rawText, stack);
		return stack.join("");
	} else return rawText;
}

function rollAgainstTable (iLoad, jLoad) {
	iLoad = Number(iLoad);
	jLoad = Number(jLoad);
	const race = nameList[iLoad];
	const table = race.tables[jLoad];
	const rollTable = table.table;

	rollTable._rMax = rollTable._rMax == null ? Math.max(...rollTable.filter(it => it.min != null).map(it => it.min), ...rollTable.filter(it => it.max != null).map(it => it.max)) : rollTable._rMax;
	rollTable._rMin = rollTable._rMin == null ? Math.min(...rollTable.filter(it => it.min != null).map(it => it.min), ...rollTable.filter(it => it.max != null).map(it => it.max)) : rollTable._rMin;

	const roll = RollerUtil.randomise(rollTable._rMax, rollTable._rMin);

	let result;
	for (let i = 0; i < rollTable.length; i++) {
		const row = rollTable[i];
		const trueMin = row.max != null && row.max < row.min ? row.max : row.min;
		const trueMax = row.max != null && row.max > row.min ? row.max : row.min;
		if (roll >= trueMin && roll <= trueMax) {
			result = getRenderedText(row.result);
			break;
		}
	}

	// add dice results
	result = result.replace(RollerUtil.DICE_REGEX, function (match) {
		const r = Renderer.dice.parseRandomise2(match);
		return `<span class="roller" onmousedown="event.preventDefault()" onclick="reroll(this)">${match}</span> (<span class="result">${r}</span>)`
	});

	Renderer.dice.addRoll({name: `${race.name} - ${table.option}`}, `<span><strong>${pad(roll)}</strong> ${result}</span>`);
}

function reroll (ele) {
	const $ele = $(ele);
	const resultRoll = Renderer.dice.parseRandomise2($ele.html());
	$ele.next(".result").html(resultRoll);
}
