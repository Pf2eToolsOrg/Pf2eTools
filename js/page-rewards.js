window.onload = loadconditions;
var tabledefault = "";

function loadconditions() {
	tabledefault = $("#stats").html();
	var conditionlist = conditiondata;

		for (var i = 0; i < conditionlist.length; i++) {
			var curcondition = conditionlist[i];
			var name = curcondition.name;
			$("ul.conditions").append("<li id='"+i+"' data-link='"+encodeURI(name)+"'><span class='name'>"+name+"</span></li>");
		}

		var options = {
			valueNames: ['name'],
			listClass: "conditions"
		}

		var conditionslist = new List("listcontainer", options);
		conditionslist.sort ("name")

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
			usecondition($(this).attr("id"));
			document.title = decodeURI($(this).attr("data-link")) + " - 5etools conditions";
			window.location = "#"+$(this).attr("data-link");
		});

		if (window.location.hash.length) {
			$("ul.list li[data-link='"+window.location.hash.split("#")[1]+"']:eq(0)").click();
		} else $("ul.list li:eq(0)").click();

			// reset button
			$("button#reset").click(function() {
				$("#filtertools select").val("All");
				$("#search").val("");
				conditionslist.search("");
				conditionslist.filter();
				conditionslist.sort("name");
				conditionslist.update();
			})

	}

	function usecondition (id) {
			$("#stats").html(tabledefault);
			var conditionlist = conditiondata;
			var curcondition = conditionlist[id];

			var name = curcondition.name;
			$("th#name").html(name);

			$("tr.text").remove();

			var textlist = curcondition.text;
			var texthtml = "";

			for (var i = 0; i < textlist.length; i++) {
				if (!textlist[i]) continue;
				texthtml = texthtml + "<p>"+textlist[i]+"</p>";
			}

			$("tr#text").after("<tr class='text'><td colspan='6' class='text"+i+"'>"+texthtml+"</td></tr>");

		};
