window.onload = function load() {
	$("#rollbutton").click(rollstats);
	$("input.score").change(changestats);

	if (window.location.hash)
		window.onhashchange();
	else
		window.location.hash = "#rolled";
}

window.onhashchange = function hashchange() {
	const hash = window.location.hash.slice(1);
	$(".statmethod").hide();
	$("#" + hash).show();
}

function changestats() {
	var pointcount = 0;
	var budget = $("#budget").val();
	$(".score").each(function() {
		pointcount += $(this).val()-8;
		if ($(this).val() >= 14) pointcount++;
		if ($(this).val() >= 15) pointcount++;
	})

	if (pointcount > budget) {
		$(this).val($(this).data("prev"));
		return false;
	}

	$(this).next(".finalscore").val($(this).val()+$(this).next(".mod").val());
	$("#remaining").val(budget-pointcount);
	$(this).data("prev", $(this).val());
}

function rollstats() {
	var rolls = [];
	for (var i = 0; i < 6; i++) {
		var curroll = droll.roll("4d6").rolls.sort().splice(1);
		curroll = curroll[0] + curroll[1] + curroll[2];
		rolls.push(curroll);
	}

	$("#rolled #rolls").prepend("<p>"+rolls.join(", ")+"</p>");
	$("#rolled #rolls p:eq(10)").remove();
}
