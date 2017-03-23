
function tagcontent (curitem, tag, multi=false) {
	if (!curitem.getElementsByTagName(tag).length) return false;
	return curitem.getElementsByTagName(tag)[0].childNodes[0].nodeValue;
}

function asc_sort(a, b){
    return ($(b).text()) < ($(a).text()) ? 1 : -1;
}

function dec_sort(a, b){
    return ($(b).text()) > ($(a).text()) ? 1 : -1;
}

window.onload = loadrules;

function loadrules() {
	contentdefault = $("#rulescontent").html();

	var ruleslist = rulesdata.compendium.rules;

	for (var i = 0; i <  ruleslist.length; i++) {
		var currules =  ruleslist[i];
		var name = currules.name;
    var basedon = "";
    var rulesid = currules.id.toString();
		$("ul.rules."+currules.parentlist).append("<li id='"+i+"' data-link='"+encodeURI(name)+"'><span class='name col-xs-12'>"+name+"</span> <span class='id' style='display: none;'>"+rulesid+"</span></li>");
	}

	var options = {
		valueNames: ['name', 'id'],
		listClass: "rules"
	}

	var ruleslist = new List("listcontainer", options);

  ruleslist.sort ("name");

  $("ul.list.rules").each(function() {
    $(this).children("li").sort(function(a, b) {
        var sorta = $(a).children("span.id").text();
        var sortb = $(b).children("span.id").text();
        console.log(sorta);
        return (sorta > sortb) ? 1 : -1;
    }).appendTo(this);
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
		userules($(this).attr("id"));
		document.title = decodeURI($(this).attr("data-link")) + " - 5etools Rules";
		window.location = "#"+$(this).attr("data-link");
	});

	if (window.location.hash.length) {
		$("ul.list li[data-link='"+window.location.hash.split("#")[1]+"']:eq(0)").click();
	} else $("ul.list li:eq(0)").click();

	// reset button
	$("button#reset").click(function() {
		$("#filtertools select").val("All");
		$("#search").val("");
		 ruleslist.search("");
		 ruleslist.filter();
		 ruleslist.sort("names");
		 ruleslist.update();
	})

	$("#listcontainer h4").click(function() {
		$(this).next().slideToggle();
	}).css("cursor", "pointer");
}

function userules (id) {
	$("#rulescontent").html(contentdefault);

	var ruleslist = rulesdata.compendium.rules;
	var currules =  ruleslist[id];

  $("#rulescontent").html(currules.htmlcontent);
  $("#rulescontent").prepend(`<h1>`+currules.name+`</h1>`)

	return;
};
