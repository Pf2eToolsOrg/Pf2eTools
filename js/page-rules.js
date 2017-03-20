
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
    var rulesid = "";

    if (currules.data["Based On"]) {
      rulesid = currules.data["Based On"] + currules.id.toString();
    } else {
      rulesid = currules.id.toString();
    }

		if (!currules.ability) currules.ability = "";
		$("ul.rules").append("<li id='"+i+"' data-link='"+encodeURI(name)+"'><span class='name col-xs-12'>"+name+"</span> <span class='id' style='display: none;'>"+rulesid+"</span></li>");
	}

	var options = {
		valueNames: ['name', 'id'],
		listClass: "rules"
	}

	var ruleslist = new List("listcontainer", options);

  ruleslist.sort ("name");

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
		document.title = decodeURI($(this).attr("data-link")) + " - 5etools ruless";
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
}

function userules (id) {
	$("#rulescontent").html(contentdefault);

	var ruleslist = rulesdata.compendium.rules;
	var currules =  ruleslist[id];

  $("#rulescontent").html(currules.htmlcontent);
  $("#rulescontent").prepend(`<h1>`+currules.name+`</h1>`)

	return;
};
