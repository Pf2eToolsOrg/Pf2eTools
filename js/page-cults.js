var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var cultlist = cultdata;

	for (var i = 0; i < cultlist.length; i++) {
		var curcult = cultlist[i];
		var name = curcult.name;
		$("ul.cults").append("<li id='"+i+"' data-link='"+encodeURI(name).toLowerCase()+"' title='"+name+"'><span class='name' title='"+name+"'>"+name+"</span></li>");
	}

	const list = search({
		valueNames: ['name'],
		listClass: "cults"
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
	var cultlist = cultdata;
	var curcult = cultlist[id];

	var name = curcult.name;
	$("th#name").html(name);

	$("tr.text").remove();

	var textlist = curcult.text;
	var texthtml = "";

	if (curcult.cultists !== undefined) texthtml += utils_combineText(curcult.cultists.text, "p", "<span class='bold'>Goal:</span> ");
	texthtml += utils_combineText(textlist, "p");

	$("tr#text").after("<tr class='text'><td colspan='6'>"+texthtml+"</td></tr>");

};