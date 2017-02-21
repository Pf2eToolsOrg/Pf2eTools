
window.onload = loadstats

function loadstats() {

	if (!window.location.hash) window.location = "#0";

	$("#rolltabs a").click(function() {
		$(".statmethod").hide();
		$(".statmethod:eq("+$(this).attr("href").split("#")[1]+")").show();
		$(this).parent().siblings().removeClass("active");
		$(this).parent().addClass("active");
	})

	if (window.location.hash) $("#rolltabs a:eq("+window.location.hash.split("#")[1]+")").click();
	$("#rollbutton").click(rollstats);

	// evaluate
	var beingchanged = false;
	$("input.score").change(function() {
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

	})

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
