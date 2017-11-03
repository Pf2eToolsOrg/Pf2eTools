const JSON_URL = "data/conditions.json";
let tabledefault = "";
let conditionlist;

window.onload = function load() {
	loadJSON(JSON_URL, onJsonLoad);
};

function onJsonLoad(data) {
	conditionlist = data.condition;

	tabledefault = $("#stats").html();

	for (let i = 0; i < conditionlist.length; i++) {
		const name = conditionlist[i].name;
		$("ul.conditions").append("<li><a id='"+i+"' href='#"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name' title='"+name+"'>"+name+"</span></a></li>");
	}

	const list = search({
		valueNames: ['name'],
		listClass: "conditions"
	});

	initHistory()
}

function loadhash (id) {
	$("#stats").html(tabledefault);
	const curcondition = conditionlist[id];
	$("th#name").html(curcondition.name);
	$("tr.text").remove();
	$("tr#text").after("<tr class='text'><td colspan='6'>"+utils_combineText(curcondition.entries, "p")+"</td></tr>");
}
