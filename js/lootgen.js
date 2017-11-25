"use strict";
const LOOT_JSON_URL = "data/loot.json";
const renderer = new EntryRenderer();
let lootList;

window.onload = function load() {
	loadJSON(LOOT_JSON_URL, loadloot);
};

function loadloot(lootData) {
	lootList = lootData;
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
	const tableset = hoard ? lootList.hoard : lootList.individual;
	let curtable = null;
	for (let i = 0; i < tableset.length; i++) {
		if (cr >= tableset[i].mincr && cr <= tableset[i].maxcr) {
			curtable = tableset[i];
			break;
		}
	}
	if (!curtable) {
		return;
	}
	// roll on tables
	const lootroll = randomNumber (1, 100);
	const loottable = curtable.table;
	let loot = null;
	for (let i = 0; i < loottable.length; i++) {
		if (lootroll >= loottable[i].min && lootroll <= loottable[i].max) {
			loot = loottable[i];
			break;
		}
	}
	if (!loot) {
		return;
	}
	// take care of individual treasure
	if (!hoard) {
		const formattedCoins = getFormattedCoinsForDisplay(loot.coins);
		$("#lootoutput ul:eq(0)").prepend(`<li> ${formattedCoins} </li>`);
		return;
		// and now for hoards
	} else {
		const treasure = [];
		treasure.push(getFormattedCoinsForDisplay(curtable.coins));
		// gems and art objects
		// check if it's gems or art objects
		const artgems = (loot.gems || loot.artobjects) && loot.artobjects ? loot.artobjects : loot.gems;
		const usingart = (loot.gems || loot.artobjects) && loot.artobjects ? true : false;
		if (artgems) {
			// get the appropriate table set
			let artgemstable = (loot.gems || loot.artobjects) && loot.artobjects ? lootList.artobjects : lootList.gemstones;
			for (let i = 0; i < artgemstable.length; i++) {
				if (artgemstable[i].type === artgems.type) {
					artgemstable = artgemstable[i];
					break;
				}
			}
			// number of rolls on the table
			const roll = droll.roll(artgems.amount).total;
			const gems = [];
			$("#lootoutput ul:eq(0)").append("<li>x"+roll+" "+Parser._addCommas(artgems.type)+" gp "+(usingart ? "art objects" : "gemstones")+":<ul></ul></li>");
			for (let i = 0; i < roll; i++) gems.push(artgemstable.table[randomNumber (0, artgemstable.table.length-1)]);
			for (let i = 0; i < gems.length; i++) $("#lootoutput ul:eq(0) ul:eq(0)").append("<li>"+gems[i]+"</li>");
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
			const magicitemtabletype = [];
			const magicitemtableamounts = [];
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
				let magicitemstable = lootList.magicitems;
				for (let i = 0; i < magicitemstable.length; i++) {
					if (magicitemstable[i].type === curtype) {
						magicitemstable = magicitemstable[i];
						break;
					}
				}
				// number of rolls on the table
				const roll = droll.roll(curamount).total;
				const magicitems = [];
				$("#lootoutput ul:eq(0) > li").last().append("<hr>");
				for (let i = 0; i < roll; i++) {
					let curmagicitem = null;
					const itemroll = randomNumber(1,100);
					for (let n = 0; n < magicitemstable.table.length; n++) {
						if (itemroll >= magicitemstable.table[n].min && itemroll <= magicitemstable.table[n].max) {
							curmagicitem = magicitemstable.table[n];
							break;
						}
					}
					let magicitemstring = parseLink(curmagicitem.item);
					if (curmagicitem.table) {
						magicitemstring += " (" + curmagicitem.table[randomNumber (0, curmagicitem.table.length-1)] + ")";
					}
					magicitems.push(magicitemstring);
				}
				for (let i = 0; i < magicitems.length; i++) $("#lootoutput ul:eq(0)").append("<li class=\"magicitem\">"+magicitems[i]+"</li>");
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
		for (let i = 0; i < treasure.length; i++) $("#lootoutput ul:eq(0)").prepend("<li>"+treasure[i]+"</li>");
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
		individuallyFormattedCoins.unshift("<li>"+ Parser._addCommas(coin.value) + " " + coin.denomination + "</li>");
	});
	const totalValueGP = Parser._addCommas(getGPValueFromCoins(generatedCoins));
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

function randomNumber (min, max) {
	return Math.floor(Math.random() * max) + min;
}

function parseLink (rawText) {
	if (rawText.startsWith("{@item ")) {
		const stack = [];
		renderer.recursiveEntryRender(rawText, stack);
		return stack.join("");
	} else return rawText;
}
