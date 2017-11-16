const ITEMS_JSON_URL = "data/items.json";
const BASIC_ITEMS_JSON_URL = "data/basicitems.json";
const MAGIC_VARIANTS_JSON_URL = "data/magicvariants.json";
const TYPE_DOSH ="$";
let tabledefault = "";
let itemList;
let basicItemList;
let variantList;

window.onload = function load() {
	loadJSON(ITEMS_JSON_URL, addBasicItems);
};

function addBasicItems(itemData) {
	itemList = itemData.item;
	loadJSON(BASIC_ITEMS_JSON_URL, addVariants);
}

function addVariants(basicItemData) {
	basicItemList = basicItemData.basicitem;
	loadJSON(MAGIC_VARIANTS_JSON_URL, mergeBasicItems);
}

function emphasize (strongWords, normalWords) { // FIX ME: Replace HTML tags with inline tags once we have the recursive renderer
	return "<p><strong>"+strongWords+".</strong> "+normalWords+"</p>";
}

function mergeBasicItems(variantData) {
	variantList = variantData.variant;
	itemList = itemList.concat(basicItemList);

	for (let i = 0; i < basicItemList.length; i++) {
		const curBasicItem = basicItemList[i];
		if(curBasicItem.text === undefined) curBasicItem.text=[];
		for (let j = 0; j < variantList.length; j++) {
			const curVariant = variantList[j];
			const curRequires = curVariant.requires;
			let hasRequired = true;
			for (const requiredProperty in curRequires) if (curRequires.hasOwnProperty(requiredProperty) && curBasicItem[requiredProperty] !== curRequires[requiredProperty]) hasRequired=false;
			if (curVariant.excludes) {
				const curExcludes = curVariant.excludes;
				for (const excludedProperty in curExcludes) if (curExcludes.hasOwnProperty(excludedProperty) && curBasicItem[excludedProperty] === curExcludes[excludedProperty]) hasRequired=false;
			}
			if (hasRequired) {
				const curInherits = curVariant.inherits
				const tmpBasicItem = JSON.parse(JSON.stringify(curBasicItem));
				delete tmpBasicItem.value; // Magic items do not inherit the value of the non-magical item
				for (const inheritedProperty in curInherits) {
					if (curInherits.hasOwnProperty(inheritedProperty)) {
						if (inheritedProperty === "namePrefix") {
							tmpBasicItem.name = curInherits.namePrefix+tmpBasicItem.name;
						} else if (inheritedProperty === "nameSuffix") {
							const tmpName = tmpBasicItem.name;
							tmpBasicItem.name = tmpName.indexOf(" (") !== -1 ? tmpName.replace(" (", curInherits.nameSuffix+" (") : tmpName+curInherits.nameSuffix;
						} else if (inheritedProperty === "text") {
							for (let k = curInherits.text.length-1; k > -1; k--) {
								let tmpText = curInherits.text[k];
								if (tmpBasicItem.dmgType) tmpText = tmpText.replace("{@dmgType}", Parser.dmgTypeToFull(tmpBasicItem.dmgType));
								if (curInherits.genericBonus) tmpText = tmpText.replace("{@genericBonus}", curInherits.genericBonus);
								tmpBasicItem.text.unshift(tmpText);
							}
						} else
							tmpBasicItem[inheritedProperty] = curInherits[inheritedProperty];
					}
				}
				itemList.push(tmpBasicItem);
			}
		}
	}
	enhanceItems();
}

function enhanceItems() { //FIX ME Move the texthtml processing from loadhash to here to make life easier for the renderer
	populateTablesAndFilters();
}

function rarityValue(rarity) { //Ordered by most frequently occuring rarities in the JSON
	if (rarity === "Rare") return 3;
	if (rarity === "None") return 0;
	if (rarity === "Uncommon") return 2;
	if (rarity === "Very Rare") return 4;
	if (rarity === "Legendary") return 5;
	if (rarity === "Artifact") return 6;
	if (rarity === "Unknown") return 7;
	if (rarity === "Common") return 1;
	return 0;
}

function sortitems(a, b, o) {
	if (o.valueName === "name") {
		return b._values.name.toLowerCase() > a._values.name.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "type") {
		if (b._values.type === a._values.type) return compareNames(a, b);
		return b._values.type.toLowerCase() > a._values.type.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "source") {
		if (b._values.source === a._values.source) return compareNames(a, b);
		return b._values.source.toLowerCase() > a._values.source.toLowerCase() ? 1 : -1;
	} else if (o.valueName === "rarity") {
		if (b._values.rarity === a._values.rarity) return compareNames(a, b);
		return rarityValue(b._values.rarity) > rarityValue(a._values.rarity) ? 1 : -1;
	} else return 1;
}

function populateTablesAndFilters() {
	tabledefault = $("#stats").html();

	const filterAndSearchBar = document.getElementById(ID_SEARCH_BAR);
	const filterList = [];
	const sourceFilter = new Filter("Source", FLTR_SOURCE, [], Parser.sourceJsonToFull, Parser.stringToSlug);
	filterList.push(sourceFilter);
	const typeFilter = new Filter("Type", FLTR_TYPE, [], Filter.asIs, Filter.asIs);
	filterList.push(typeFilter);
	const tierFilter = new Filter("Tier", FLTR_TIER, [
		"None",
		"Minor",
		"Major",
	], Filter.asIs, Filter.asIs);
	filterList.push(tierFilter);
	const rarityFilter = new Filter("Rarity", FLTR_RARITY, [
		"None",
		"Common",
		"Uncommon",
		"Rare",
		"Very Rare",
		"Legendary",
		"Artifact",
		"Unknown",
	], Filter.asIs, Filter.asIs);
	filterList.push(rarityFilter);
	const attunementFilter = new Filter("Attunement", FLTR_ATTUNEMENT, ["Yes", "By...", "Optional", "No"], Filter.asIs, Parser.stringToSlug);
	filterList.push(attunementFilter);
	const filterBox = new FilterBox(filterAndSearchBar, filterList);
	const liList = {mundane:"", magic:""}; // store the <li> tag content here and change the DOM once for each after the loop

	for (let i = 0; i < itemList.length; i++) {
		const curitem = itemList[i];
		const name = curitem.name;
		const rarity = curitem.rarity;
		const source = curitem.source;
		const sourceAbv = Parser.sourceJsonToAbv(source);
		const sourceFull = Parser.sourceJsonToFull(source);
		const type = [];
		if (curitem.wondrous) type.push("Wondrous Item");
		if (curitem.technology) type.push(curitem.technology);
		if (curitem.age) type.push(curitem.age);
		if (curitem.weaponCategory) type.push(curitem.weaponCategory+" Weapon");
		if (curitem.type) type.push(Parser.itemTypeToAbv(curitem.type));
		const typeList = type.join(","); // for filter to use
		itemList[i].typeText = type.join(", "); // for loadhash to use
		const tierTags = [];
		tierTags.push(curitem.tier ? curitem.tier : "None");
		const tierTagsString = tierTags.join(FLTR_LIST_SEP);
		let attunement = "No";
		if (curitem.reqAttune !== undefined) {
			if (curitem.reqAttune === "YES") attunement = "Yes";
			else if (curitem.reqAttune === "OPTIONAL") attunement = "Optional";
			else if (curitem.reqAttune.toLowerCase().startsWith("by")) attunement = "By...";
			else attunement = "Yes"; // throw any weird ones in the "Yes" category (e.g. "outdoors at night")
		}

		liList[rarity === "None" || rarity === "Unknown" ? "mundane" : "magic"] += `<li ${FLTR_SOURCE}='${source}' ${FLTR_TYPE}='${typeList}' ${FLTR_TIER}='${tierTagsString}' ${FLTR_RARITY}='${rarity}' ${FLTR_ATTUNEMENT}='${attunement}'><a id='${i}' href="#${encodeForHash(name)}_${encodeForHash(source)}" title="${name}"><span class='name col-xs-4'>${name}</span> <span class='type col-xs-4 col-xs-4-3'>${type.join(", ")}</span> <span class='source col-xs-1 col-xs-1-7 source${sourceAbv}' title="${sourceFull}">${sourceAbv}</span> <span class='rarity col-xs-2'>${rarity}</span></a></li>`;

		// populate filters
		if ($.inArray(source, sourceFilter.items) === -1) sourceFilter.items.push(source);
		for (let j = 0; j < type.length; ++j) if ($.inArray(type[j], typeFilter.items) === -1) typeFilter.items.push(type[j]);
		for (let j = 0; j < tierTags.length; ++j) if ($.inArray(tierTags[j], tierFilter.items) === -1) tierFilter.items.push(tierTags[j]);
	}
	// populate table
	$("ul.list.mundane").append(liList.mundane);
	$("ul.list.magic").append(liList.magic);
	// sort filters
	sourceFilter.items.sort(ascSort);
	typeFilter.items.sort(ascSort);

	const options = {
		valueNames: ["name", "source", "type", "rarity"],
		listClass: "mundane"
	};

	const mundanelist = search(options);
	options.listClass = "magic";
	const magiclist = search(options);

	// add filter reset to reset button
	document.getElementById(ID_RESET_BUTTON).addEventListener(EVNT_CLICK, function() {
		filterBox.reset();
		deselectDosh(true);
	}, false);

	filterBox.render();
	initHistory();

	// filtering function
	$(filterBox).on(
		FilterBox.EVNT_VALCHANGE,
		function () {
			mundanelist.filter(listFilter);
			magiclist.filter(listFilter);
		}
	);

	function listFilter(item) {
		const f = filterBox.getValues();
		const rightSource = f[sourceFilter.header][FilterBox.VAL_SELECT_ALL] || f[sourceFilter.header][sourceFilter.valueFunction($(item.elm).attr(sourceFilter.storageAttribute))];
		const allTypes = $(item.elm).attr(typeFilter.storageAttribute).split(",");
		let anyRightType = false;
		for (let i = 0; i < allTypes.length; i++) {
			const t = allTypes[i];
			if (f[typeFilter.header][t]) {
				anyRightType = true;
				break;
			}
		}
		const rightType = f[typeFilter.header][FilterBox.VAL_SELECT_ALL] || anyRightType;
		const rightTier = f[tierFilter.header][FilterBox.VAL_SELECT_ALL] || f[tierFilter.header][tierFilter.valueFunction($(item.elm).attr(tierFilter.storageAttribute))];
		const rightRarity = f[rarityFilter.header][FilterBox.VAL_SELECT_ALL] || f[rarityFilter.header][rarityFilter.valueFunction($(item.elm).attr(rarityFilter.storageAttribute))];
		const rightAttunement = f[attunementFilter.header][FilterBox.VAL_SELECT_ALL] || f[attunementFilter.header][attunementFilter.valueFunction($(item.elm).attr(attunementFilter.storageAttribute))];

		return rightSource && rightType && rightTier && rightRarity && rightAttunement;
	}

	$("#filtertools button.sort").on("click", function() {
		if ($(this).attr("sortby") === "asc") {
			$(this).attr("sortby", "desc");
		} else $(this).attr("sortby", "asc");
		magiclist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortitems });
		mundanelist.sort($(this).attr("sort"), { order: $(this).attr("sortby"), sortFunction: sortitems });
	});

	// default de-select Dosh types
	deselectDosh(true);

	function deselectDosh(hardDeselect) {
		hardDeselect = hardDeselect === undefined || hardDeselect === null ? false : hardDeselect;
		if (window.location.hash.length) {
			const itemType = itemList[getSelectedListElement().attr("id")].type;
			if (itemType === TYPE_DOSH && hardDeselect) {
				deselNoHash();
			} else {
				filterBox.deselectIf(function (val) {
					return val === TYPE_DOSH && itemType !== val
				}, typeFilter.header);
			}
		} else {
			deselNoHash();
		}
		function deselNoHash() {
			filterBox.deselectIf(function(val) {
				return val === TYPE_DOSH
			}, typeFilter.header);
		}
	}

	$("#itemcontainer h3").not(":has(input)").click(function() {
		if ($(this).next("ul.list").css("max-height") === "500px") {
			$(this).siblings("ul.list").animate({
				maxHeight: "250px",
				display: "block"
			});
			return;
		}

		$(this).next("ul.list").animate({
			maxHeight: "500px",
			display: "block"
		}).siblings("ul.list").animate({
			maxHeight: "0",
			display: "none"
		})
	});
}

function loadhash (id) {
	const ammoGenericText="<p>If you use a weapon that has the ammunition property to make a melee attack, you treat the weapon as an improvised weapon. A sling must be loaded to deal any damage when used in this way.</p>";
	const ammoFirearmText=emphasize("Ammunition", "You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack. The ammunition of a firearm is destroyed upon use.")+ammoGenericText;
	const ammoNormalText=emphasize("Ammunition", "You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack. At the end of the battle, you can recover half your expended ammunition by taking a minute to search the battlefield.")+ammoGenericText;
	$("#currentitem").html(tabledefault);
	const item = itemList[id];

	const source = item.source;
	const sourceAbv = Parser.sourceJsonToAbv(source);
	const sourceFull = Parser.sourceJsonToFull(source);
	$("th#name").html("<span title=\""+sourceFull+"\" class='source source"+sourceAbv+"'>"+sourceAbv+"</span> "+item.name);
	$("td#source span").html(sourceFull+", page "+item.page);

	let value = item.value;
	const weight = item.weight;
	$("span#value").html("");
	if (value) {
		if (weight) value = value + ", ";
		$("td span#value").html(value);
	} else $("td span#value").html("");
	$("span#weight").html("");
	$("td span#weight").html(weight ? weight+(weight == 1 ? " lb." : " lbs.") : "");

	$("td span#rarity").html("");
	const tier = item.tier;
	if (tier) $("td span#rarity").append(", "+tier);
	const rarity = item.rarity;
	if (rarity) $("td span#rarity").append(", "+rarity);

	const attunetext = item.reqAttune
	$("td span#attunement").html(attunetext ? (attunetext === "OPTIONAL" ? "(Attunement Optional)" : "(Requires Attunement"+(attunetext === "YES" ? "" : " "+attunetext)+")") : "");

	$("td span#type").html(item.typeText);
	$("span#damage").html("");
	$("span#damagetype").html("");
	let type = "";
	if (item.type) type = item.type;
	if (item.weaponCategory) {
		if(item.dmg1) $("span#damage").html(utils_makeRoller(item.dmg1));
		if(item.dmgType) $("span#damagetype").html(Parser.dmgTypeToFull(item.dmgType));
	} else if (type === "LA" ||type === "MA"|| type === "HA") {
		$("span#damage").html("AC "+item.ac+(type === "LA" ? " + Dex" : (type === "MA" ? " + Dex (max 2)" : "")));
	} else if (type === "S") {
		$("span#damage").html("AC +"+item.ac);
	} else if (type === "MNT" || type === "VEH") {
		const speed=item.speed;
		const capacity=item.carryingcapacity;
		if (speed) $("span#damage").append("Speed="+speed);
		if (speed && capacity) $("span#damage").append(type === "MNT" ? ", " : "<br>");
		if (capacity) {
			$("span#damage").append("Carrying Capacity="+capacity);
			if (capacity.indexOf("ton") === -1 && capacity.indexOf("passenger") === -1) $("span#damage").append(capacity == 1 ? " lb." : " lbs.");
		}
	}

	$("tr.text").remove();
	const textlist = item.text;
	let texthtml = "";
	if (textlist) {
		for (let n = 0; n < textlist.length; n++) {
			if (!textlist[n]) continue;
			if (textlist[n].istable === "YES") {
				texthtml += utils_makeTable(textlist[n]);
			} else {
				//FIX ME. Modify the JSON to include all required empasis.
				//If you need to stop a short initial sentence from being empasized then add a space to the start of that JSON text entry
				texthtml = texthtml + "<p>"+textlist[n].replace(/^(\w+'*\s?){1,6}(:|\.) /g, "<strong>$&</strong>")+"</p>";
			}
		}
	}
	if (type === "LA" ||type === "MA"|| type === "HA") {
		if (item.resist) texthtml += "<p>You have resistance to "+item.resist+" damage while you wear this armor.</p>";
		if (type === "HA" && item.strength) texthtml += "<p>If the wearer has a Strength score lower than " + item.strength + ", their speed is reduced by 10 feet.</p>";
		if (item.stealth) texthtml += "<p>The wearer has disadvantage on Stealth (Dexterity) checks.</p>";
	} else if (type === "A") {
		texthtml += item.age ? ammoFirearmText : ammoNormalText;
	} else if (type === "AT") {
		texthtml += "<p>These special tools include the items needed to pursue a craft or trade. Proficiency with a set of artisan's tools lets you add your proficiency bonus to any ability checks you make using the tools in your craft. Each type of artisan's tools requires a separate proficiency.</p>";
	} else if (type === "GS") {
		texthtml += "<p>If you are proficient with a gaming set, you can add your proficiency bonus to ability checks you make to play a game with that set. Each type of gaming set requires a separate proficiency.</p>";
	} else if (type === "INS") {
		texthtml += "<p>If you have proficiency with a given musical instrument, you can add your proficiency bonus to any ability checks you make to play music with the instrument.</p><p>A bard can use a musical instrument as a spellcasting focus, substituting it for any material component that does not list a cost.</p><p>Each type of musical instrument requires a separate proficiency.</p>";
	} else if (type === "P") {
		if (item.resist) texthtml += "<p>When you drink this potion, you gain resistance to "+item.resist+" damage for 1 hour.</p>";
	} else if (type === "RG") {
		if (item.resist) texthtml += "<p>You have resistance to "+item.resist+" damage while wearing this ring.</p>";
	} else if (type === "SCF") {
		if (item.scfType === "arcane") texthtml += "<p>An arcane focus is a special item designed to channel the power of arcane spells. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus, using it in place of any material component which does not list a cost.</p>";
		if (item.scfType === "druid") texthtml += "<p>A druid can use such a druidic focus as a spellcasting focus, using it in place of any material component that does not have a cost.</p>";
		if (item.scfType === "holy") texthtml += "<p>A holy symbol is a representation of a god or pantheon.</p><p>A cleric or paladin can use a holy symbol as a spellcasting focus, using it in place of any material components which do not list a cost. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield.</p>";
	} else if (type === "TG") {
		texthtml += "<p>Most wealth is not in coins. It is measured in livestock, grain, land, rights to collect taxes, or rights to resources (such as a mine or a forest).</p><p>Guilds, nobles, and royalty regulate trade. Chartered companies are granted rights to conduct trade along certain routes, to send merchant ships to various ports, or to buy or sell specific goods. Guilds set prices for the goods or services that they control, and determine who may or may not offer those goods and services. Merchants commonly exchange trade goods without using currency.</p>";
	}
	if (type === "R") texthtml += emphasize("Range", "A weapon that can be used to make a ranged attack has a range shown in parentheses after the ammunition or thrown property. The range lists two numbers. The first is the weapon's normal range in feet, and the second indicates the weapon's maximum range. When attacking a target beyond normal range, you have disadvantage on the attack roll. You can't attack a target beyond the weapon's long range.");

	$("span#properties").html("");
	if (item.property) {
		const properties = item.property.split(",");
		for (let i = 0; i < properties.length; i++) {
			let a = b = properties[i];
			a = Parser.propertyToAbv (a);
			if (b === "V") {
				a = a + " (" + utils_makeRoller(item.dmg2) + ")";
				texthtml += emphasize("Versatile", "This weapon can be used with one or two hands. A damage value in parentheses appears with the property \u2014 the damage when the weapon is used with two hands to make a melee attack.");
			}
			if (b === "T" || b === "A") a = a + " (" + item.range + "ft.)";
			if (b === "RLD") {
				a = a + " (" + item.reload + " shots)";
				texthtml += emphasize("Reload", "A limited number of shots can be made with a weapon that has the reload property. A character must then reload it using an action or a bonus action (the character's choice).");
			}
			a = (i > 0 ? ", " : (item.dmg1 ? "- " : "")) + a;
			$("span#properties").append(a);
			if (b === "2H") texthtml += emphasize("Two-Handed", "This weapon requires two hands to use.");
			if (b === "A") texthtml += item.age ? ammoFirearmText : ammoNormalText;
			if (b === "BF") texthtml += emphasize("Burst Fire", "A weapon that has the burst fire property can make a single-target attack, or it can spray a 10-foot-cube area within normal range with shots. Each creature in the area must succeed on a DC 15 Dexterity saving throw or take the weapon's normal damage. This action uses ten pieces of ammunition.");
			if (b === "F") texthtml += emphasize("Finesse", "When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.");
			if (b === "H") texthtml += emphasize("Heavy", "Small creatures have disadvantage on attack rolls with heavy weapons. A heavy weapon's size and bulk make it too large for a Small creature to use effectively.");
			if (b === "L") texthtml += emphasize("Light", "A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons.");
			if (b === "LD") texthtml += emphasize("Loading", "Because of the time required to load this weapon, you can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make.");
			if (b === "R") texthtml += emphasize("Reach", "This weapon adds 5 feet to your reach when you attack with it.");
			if (b === "T") texthtml += emphasize("Thrown", "If a weapon has the thrown property, you can throw the weapon to make a ranged attack. If the weapon is a melee weapon, you use the same ability modifier for that attack roll and damage roll that you would use for a melee attack with the weapon. For example, if you throw a handaxe, you use your Strength, but if you throw a dagger, you can use either your Strength or your Dexterity, since the dagger has the finesse property.");
		}
	}

	$("tr#text").after("<tr class='text'><td colspan='6' class='text1'>"+utils_makeRoller(texthtml)+"</td></tr>");
	$(".items span.roller").contents().unwrap();
	$("#stats span.roller").click(function() {
		var roll =$(this).attr("data-roll").replace(/\s+/g, "");
		var rollresult =  droll.roll(roll);
		var name = $("#name").clone().children().remove().end().text();
		$("div#output").prepend("<span>"+name + ": <em>"+roll+"</em> rolled for <strong>"+rollresult.total+"</strong> (<em>"+rollresult.rolls.join(", ")+"</em>)<br></span>").show();
		$("div#output span:eq(5)").remove();
	})
}
