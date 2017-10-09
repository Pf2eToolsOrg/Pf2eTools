var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var conditionlist = conditiondata;

	for (var i = 0; i < conditionlist.length; i++) {
		var curcondition = conditionlist[i];
		var name = curcondition.name;
		$("ul.conditions").append("<li id='"+i+"' data-link='"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name' title='"+name+"'>"+name+"</span></li>");
	}

	const list = search({
		valueNames: ['name'],
		listClass: "conditions"
	});

	$("ul.list li").mousedown(function(e) {
		if (e.which === 2) {
			console.log("#"+$(this).attr("data-link"))
			window.open("#"+$(this).attr("data-link"), "_blank").focus();
			e.preventDefault();
			e.stopPropagation();
			return;
		}
	});

	$("ul.list li").click(function(e) {
		window.location = "#"+$(this).attr("data-link");
	});

	if (window.location.hash.length) {
		window.onhashchange();
	} else $("ul.list li:eq(0)").click();

}

function loadhash (id) {
	$("#stats").html(tabledefault);
	var conditionlist = conditiondata;
	var curcondition = conditionlist[id];

	var name = curcondition.name;
	$("th#name").html(name);

	$("tr.text").remove();

	$("tr#text").after("<tr class='text'><td colspan='6'>"+utils_combineText(curcondition.text, "p")+"</td></tr>");
}
