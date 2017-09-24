var tabledefault = "";

window.onload = function load() {
	tabledefault = $("#stats").html();
	var rewardlist = rewarddata;

	for (var i = 0; i < rewardlist.length; i++) {
		var curreward = rewardlist[i];
		var name = curreward.name;
		$("ul.rewards").append("<li id='"+i+"' data-link='"+encodeURI(name)+"'><span class='name'>"+name+"</span></li>");
	}

	var options = {
		valueNames: ['name'],
		listClass: "rewards"
	}

	var rewardslist = new List("listcontainer", options);
	rewardslist.sort ("name")

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

	// reset button
	$("button#reset").click(function() {
		$("#filtertools select").val("All");
		$("#search").val("");
		rewardlist.search("");
		rewardlist.filter();
		rewardlist.sort("name");
		rewardlist.update();
	})

}

function loadhash (id) {
	$("#stats").html(tabledefault);
	var rewardlist = rewarddata;
	var curreward = rewardlist[id];

	var name = curreward.name;
	$("th#name").html(name);

	$("tr.text").remove();

	var textlist = curreward.text;
	var texthtml = "";

	for (var i = 0; i < textlist.length; i++) {
		if (!textlist[i]) continue;
		texthtml = texthtml + "<p>"+textlist[i]+"</p>";
	}

	$("tr#text").after("<tr class='text'><td colspan='6' class='text"+i+"'>"+texthtml+"</td></tr>");

};
