
function randomNumber (min, max) {
	return Math.floor(Math.random() * max) + min;
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

window.onload = loadloot;

function loadloot() {

	// clear
	$("button#clear").click(function() {
		$("#lootoutput").html("");
	});

	// loot rolling button
	$("button#genloot").click(function() {
		rollLoot($("#cr").val(), $("#hoard").prop("checked"));
	});

	return;
}

// roll for loot
function rollLoot(cr,hoard=false) {
	$("#lootoutput > ul:eq(4), #lootoutput > hr:eq(4)").remove();
	$("#lootoutput").prepend("<ul></ul><hr>")

	// find the appropriate table based on CR and if hoard or individual
	var tableset = hoard ? lootdata.hoard : lootdata.individual;
	var curtable = null;
	for (let i = 0; i < tableset.length; i++) {
		if (cr >= parseInt(tableset[i].mincr) && cr <= parseInt(tableset[i].maxcr)) {
			curtable = tableset[i];
			break;
		}
	}

	if (!curtable) {
		return;
	}

	//$("#lootoutput").html(JSON.stringify(curtable));


	// roll on tables
	var lootroll = randomNumber (1, 100);
	var loottable = curtable.table;
	var loot = null;
	for (let i = 0; i < loottable.length; i++) {
		if (lootroll >= parseInt (loottable[i].min) && lootroll <= parseInt (loottable[i].max)) {
			loot = loottable[i];
			break;
		}
	}

	if (!loot) {
		return;
	}

	// take care of individual treasure
	if (!hoard) {
		const formattedCoins = getFormattedCoinsForDisplay(loot);
		$("#lootoutput ul:eq(0)").prepend(`<li> ${formattedCoins} </li>`);

		return;

		// and now for hoards
	} else {
		const treasure = [];

		treasure.push(getFormattedCoinsForDisplay(curtable.coins));

		// gems and art objects

		// check if it's gems or art objects
		var artgems = (loot.gems || loot.artobjects) && loot.artobjects ? loot.artobjects : loot.gems;
		var usingart = (loot.gems || loot.artobjects) && loot.artobjects ? true : false;

		if (artgems) {
			// get the appropriate table set
			let artgemstable = (loot.gems || loot.artobjects) && loot.artobjects ? lootdata.artobjects : lootdata.gemstones;
			for (let i = 0; i < artgemstable.length; i++) {
				if (artgemstable[i].type === artgems.type) {
					artgemstable = artgemstable[i];
					break;
				}
			}

			// number of rolls on the table
			const roll = droll.roll(artgems.amount).total;
			const gems = [];

			let gemartliststring = ""
			if (usingart) {
				gemartliststring += "<li>x"+roll+" "+numberWithCommas(artgems.type)+" gp art objects:<ul></ul></li>"
			} else gemartliststring += "<li>x"+roll+" "+numberWithCommas(artgems.type)+" gp gemstones:<ul></ul></li>"
			$("#lootoutput ul:eq(0)").append(gemartliststring)
			for (let i = 0; i < roll; i++) {
				const tableroll = randomNumber (0, artgemstable.table.length-1);
				const gemstring = artgemstable.table[tableroll]
				gems.push(gemstring);
			}

			for (let i = 0; i < gems.length; i++) {
				$("#lootoutput ul:eq(0) ul:eq(0)").append("<li>"+gems[i]+"</li>");
			}

			$("#lootoutput ul:eq(0) ul:eq(0) li").each(function() {
				const curitem = this;
				let curamount = 1;
				$("#lootoutput ul:eq(0) ul:eq(0) li").each(function() {
					if ($(this).text() === $(curitem).text() && this !== curitem) {
						$(this).remove();
						curamount++;
					}
				})
				if (curamount > 1) {
					$(curitem).prepend ("x"+curamount+" ");
				}
			})
		}

		// magic items
		if (loot.magicitems) {

			magicitemtabletype = [];
			magicitemtableamounts = [];
			magicitemtabletype.push(loot.magicitems.type.split(",")[0])
			magicitemtableamounts.push(loot.magicitems.amount.split(",")[0])
			if (loot.magicitems.type.indexOf(",") !== -1) {
				magicitemtabletype.push(loot.magicitems.type.split(",")[1])
				magicitemtableamounts.push(loot.magicitems.amount.split(",")[1])
			}

			for (let v = 0; v < magicitemtabletype.length; v++) {
				const curtype = magicitemtabletype[v];
				const curamount = magicitemtableamounts[v];

				// find the appropriate table
				let magicitemstable = lootdata.magicitems;
				for (let i = 0; i < magicitemstable.length; i++) {
					if (magicitemstable[i].type === curtype) {
						magicitemstable = magicitemstable[i];
						break;
					}
				}

				// number of rolls on the table
				const roll = droll.roll(curamount).total;
				const magicitems = [];

				//$("#lootoutput ul:eq(0)").append("<li><span class='unselectable'>x"+roll+" magic items from table "+curtype+":</span><ul></ul></li>");
				$("#lootoutput ul:eq(0) > li").last().append("<hr>");
				for (let i = 0; i < roll; i++) {

					let curmagicitem = null;
					const itemroll = randomNumber(1,100);
					for (let n = 0; n < magicitemstable.table.length; n++) {
						if (itemroll >= parseInt(magicitemstable.table[n].min) && itemroll <= parseInt(magicitemstable.table[n].max)) {
							curmagicitem = magicitemstable.table[n];
							break;
						}
					}

					let magicitemstring = curmagicitem.item;
					if (curmagicitem.table) {
						magicitemstring += " (" + curmagicitem.table[randomNumber (0, curmagicitem.table.length-1)] + ")";
					}
					magicitems.push(magicitemstring);
				}


				for (let i = 0; i < magicitems.length; i++) {
					//$("#lootoutput ul:eq(0) li:contains('table "+curtype+"') ul:eq(0)").append('<li>'+magicitems[i]+'</li>');
					$("#lootoutput ul:eq(0)").append("<li class=\"magicitem\">"+magicitems[i]+"</li>");
				}


				$("#lootoutput ul:eq(0) > li.magicitem").each(function() {
					const curitem = this;
					let curamount = 1;
					$("#lootoutput ul:eq(0) > li.magicitem").each(function() {
						if ($(this).text() === $(curitem).text() && this !== curitem) {
							$(this).remove();
							curamount++;
						}
					})
					if (curamount > 1) {
						$(curitem).prepend ("x"+curamount+" ");
					}
				})

			}
		}

		for (let i = 0; i < treasure.length; i++) {
			$("#lootoutput ul:eq(0)").prepend("<li>"+treasure[i]+"</li>");
		}


	}
	return;
}

/**
 * @param  {LootTable} loot - the loot table from which we will extract coin values
 * @return {string} a string representing a nested bulleted list of coin values,
 * 					along with a total sum in GP.
 */
function getFormattedCoinsForDisplay(loot){
	const generatedCoins = generateCoinsFromLoot(loot);

	const individuallyFormattedCoins = [];
	generatedCoins.forEach((coin) => {
		individuallyFormattedCoins.unshift("<li>"+ numberWithCommas(coin.value) + " " + coin.denomination + "</li>");
	});

	const totalValueGP = getGPValueFromCoins(generatedCoins);

	const combinedFormattedCoins = individuallyFormattedCoins.reduce((total, formattedCoin) => {
		return total += formattedCoin;
	}, "");

	return `${totalValueGP} gp total<ul> ${combinedFormattedCoins}</ul>`;
}

/**
 * @param  {LootTable} loot - the loot table from which we will extract coin values
 * @return {Array<Coin>} - a list of coins contained in the loot table
 */
function generateCoinsFromLoot(loot){
	const retVal = [];

	const coins = [loot.cp, loot.sp, loot.ep, loot.gp, loot.pp]
	const coinnames = ["cp","sp","ep","gp","pp"];

	for (let i = coins.length-1; i >= 0; i--) {
		if (!coins[i]){
			continue;
		} 

		const roll = coins[i].split("*")[0];
		const multiplier = coins[i].split("*")[1];

		let rolledValue = droll.roll(roll).total;

		if (multiplier){
			rolledValue *= parseInt(multiplier);
		}

		const coin = {};
		coin.denomination = coinnames[i];
		coin.value = rolledValue;

		retVal.push(coin);
	}

	return retVal;
}

/**
 * @param  {Array<Coin>} coins - a list of coins to convert to GP
 * @return {number} the combined value of all the coins supplied, in GP, truncated to two decimal places
 */
function getGPValueFromCoins(coins){
	const initialValue = 0;

	const retVal = coins.reduce((total, coin) => {
		switch(coin.denomination){
			case "cp":
				return total += (coin.value * 0.01);
			case "sp":
				return total += (coin.value * 0.1);
			case "ep":
				return total += (coin.value * 0.5);
			case "gp":
				return total += coin.value;
			case "pp":
				return total += (coin.value * 10);
			default:
				return total;
		}
	}, initialValue);

	return parseFloat(retVal.toFixed(2));
}
