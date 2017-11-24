const JSON_URL = "data/backgrounds.json";
let tabledefault = "";
let bgList;

window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad(data) {
	bgList = data.background;

	tabledefault = $("#stats").html();

	const sourceFilter = getSourceFilter();
	const filterBox = initFilterBox(sourceFilter);

	const bgTable = $("ul.backgrounds");
	let tempString = "";
	for (let i = 0; i < bgList.length; i++) {
		const bg = bgList[i];
		const name = bg.name;

		// populate table
		tempString +=
			`<li ${FLTR_ID}="${i}">
				<a id='${i}' href='#${encodeURI(name).toLowerCase()}' title='${name}'>
					<span class='name col-xs-9'>${name.replace("Variant ","")}</span> 
					<span class='source col-xs-3 source${bg.source}' title='${Parser.sourceJsonToFull(bg.source)}'>${Parser.sourceJsonToAbv(bg.source)}</span>
				</a>
			</li>`;

		// populate filters
		if ($.inArray(bg.source, sourceFilter.items) === -1) sourceFilter.items.push(bg.source);
		addDropdownOption($("select.sourcefilter"), bg.source, Parser.sourceJsonToFull(bg.source))
	}
	bgTable.append(tempString);

	const list = search({
		valueNames: ['name', 'source'],
		listClass: "backgrounds"
	});

	filterBox.render();

	// sort filters
	sourceFilter.items.sort(ascSort);

	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		function() {
			list.filter(function(item) {
				const f = filterBox.getValues();
				const bg = bgList[$(item.elm).attr(FLTR_ID)];

				return f[sourceFilter.header][FilterBox.VAL_SELECT_ALL] || f[sourceFilter.header][bg.source];
			});
		}
	);

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	const curbg = bgList[id];
	const name = curbg.name;
	const source = curbg.source;
	const sourceAbv = Parser.sourceJsonToAbv(source);
	const sourceFull = Parser.sourceJsonToFull(source);
	$("th#name").html(`<span title="${sourceFull}" class='source source${sourceAbv}'>${sourceAbv}</span> ${name}`);
	const traitlist = curbg.trait;
	$("tr.trait").remove();

	for (let n = traitlist.length-1; n >= 0; n--) {
		let texthtml = "";
		texthtml += utils_combineText(traitlist[n].text, "p", "<span class='name'>"+traitlist[n].name+".</span> ");

		const subtraitlist = traitlist[n].subtrait;
		if (subtraitlist !== undefined) {
			for (let j = 0; j < subtraitlist.length; j++) {
				texthtml = texthtml + "<p class='subtrait'>";
				const subtrait = subtraitlist[j];
				texthtml = texthtml + "<span class='name'>"+subtrait.name+".</span> ";
				for (let k = 0; k < subtrait.text.length; k++) {
					if (!subtrait.text[k]) continue;
					if (k === 0) {
						texthtml = texthtml + "<span>" + subtrait.text[k] + "</span>";
					} else {
						texthtml = texthtml + "<p class='subtrait'>" + subtrait.text[k] + "</p>";
					}
				}
				texthtml = texthtml + "</p>";
			}
		}

		$("tr#traits").after("<tr class='trait'><td colspan='6'>"+texthtml+"</td></tr>");
	}

}
