const JSON_URL = "data/backgrounds.json";
let tabledefault = "";
let bglist;

window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad(data) {
	bglist = data.background;

	tabledefault = $("#stats").html();

	for (var i = 0; i < bglist.length; i++) {
		const curbg = bglist[i];
		const name = curbg.name;
		$("ul.backgrounds").append("<li "+FLTR_SOURCE+"='"+curbg.source+"'><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name col-xs-9'>"+name.replace("Variant ","")+"</span> <span class='source col-xs-3' title='"+parse_sourceJsonToFull(curbg.source)+"'>"+parse_sourceJsonToAbv(curbg.source)+"</span></a></li>");

		addDropdownOption($("select.sourcefilter"), curbg.source, parse_sourceJsonToFull(curbg.source))
	}

	$("select.sourcefilter option").sort(asc_sort).appendTo('select.sourcefilter');
	$("select.sourcefilter").val("All");

	const list = search({
		valueNames: ['name', 'source'],
		listClass: "backgrounds"
	});

	$("form#filtertools select").change(function(){
		const sourcefilter = $("select.sourcefilter").val();

		list.filter(function(item) {
			if (sourcefilter === "All" || item.elm.getAttribute(FLTR_SOURCE) === sourcefilter) return true;
			return false;
		});
	});

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	const curbg = bglist[id];
	const name = curbg.name;
	const source = curbg.source;
	const sourceAbv = parse_sourceJsonToAbv(source);
	const sourceFull = parse_sourceJsonToFull(source);
	$("th#name").html("<span title=\""+sourceFull+"\" class='source source"+sourceAbv+"'>"+sourceAbv+"</span> "+name);
	const traitlist = curbg.trait;
	$("tr.trait").remove();

	for (let n = traitlist.length-1; n >= 0; n--) {
		let texthtml = "";
		texthtml += utils_combineText(traitlist[n].text, "p", "<span class='name'>"+traitlist[n].name+".</span> ");

		const subtraitlist = traitlist[n].subtrait;
		if (subtraitlist !== undefined) {
			for (var j = 0; j < subtraitlist.length; j++) {
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
