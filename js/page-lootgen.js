
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
    rollLoot($("#cr").val(), $("#hoard").prop('checked'));
  });

  return;
}

// roll for loot
function rollLoot(cr,hoard=false) {
  $("#lootoutput > ul:eq(4), #lootoutput > hr:eq(4)").remove();
  $("#lootoutput").prepend("<ul></ul><hr>")

  // find the appropriate table based on CR and if hoard or individual
  var tableset = (hoard) ? lootdata.hoard : lootdata.individual;
  var curtable = null;
  for (i = 0; i < tableset.length; i++) {
    if (cr >= parseInt(tableset[i].mincr) && cr <= parseInt(tableset[i].maxcr)) {
      curtable = tableset[i];
      break;
    }
  }

  if (!curtable) {
    console.log("No table found");
    return;
  }

  //  $("#lootoutput").html(JSON.stringify(curtable));


  // roll on tables
  var lootroll = randomNumber (1, 100);
  console.log("Loot roll: ", lootroll);
  var loottable = curtable.table;
  var loot = null;
  for (var i = 0; i < loottable.length; i++) {
    if (lootroll >= parseInt (loottable[i].min) && lootroll <= parseInt (loottable[i].max)) {
      loot = loottable[i];
      break;
    }
  }

  if (!loot) {
    console.log("Loot rolling error");
    return;
  }


  // take care of individual treasure
  if (!hoard) {
    var coins = [loot.cp, loot.sp, loot.ep, loot.gp, loot.pp]
    var coinnames = ["cp","sp","ep","gp","pp"];
    for (var i = coins.length-1; i >= 0; i--) {
      if (!coins[i]) continue;
      var roll = coins[i].split("*")[0];
      var multiplier = coins[i].split("*")[1];
      coins[i] = droll.roll(roll).total;
      if (multiplier) coins[i] *= parseInt(multiplier);
      $("#lootoutput ul:eq(0)").prepend('<li>'+numberWithCommas(coins[i])+' '+coinnames[i]+'</li>');
    }
    return;

    // and now for hoards
  } else {
    var treasure = [];
    var coins = [curtable.coins.cp, curtable.coins.sp, curtable.coins.ep, curtable.coins.gp, curtable.coins.pp]
    var coinnames = ["cp","sp","ep","gp","pp"];
    for (var i = coins.length-1; i >= 0; i--) {
      if (!coins[i]) continue;
      var roll = coins[i].split("*")[0];
      var multiplier = coins[i].split("*")[1];
      coins[i] = droll.roll(roll).total;
      if (multiplier) coins[i] *= parseInt(multiplier);
      treasure.push(String(numberWithCommas(coins[i])+" "+coinnames[i]));
    }

    // gems and art objects

    // check if it's gems or art objects
    var artgems = ((loot.gems || loot.artobjects) && loot.artobjects) ? loot.artobjects : loot.gems;
    var usingart = ((loot.gems || loot.artobjects) && loot.artobjects) ? true : false;

    if (artgems) {
      // get the appropriate table set
      var artgemstable = ((loot.gems || loot.artobjects) && loot.artobjects) ? lootdata.artobjects : lootdata.gemstones;
      for (var i = 0; i < artgemstable.length; i++) {
        if (artgemstable[i].type === artgems.type) {
          artgemstable = artgemstable[i];
          break;
        }
      }

      // number of rolls on the table
      var roll = droll.roll(artgems.amount).total;
      var gems = [];

      var gemartliststring = ""
      if (usingart) {
        gemartliststring += "<li>x"+roll+" "+numberWithCommas(artgems.type)+" gp art objects:<ul></ul></li>"
      } else gemartliststring += "<li>x"+roll+" "+numberWithCommas(artgems.type)+" gp gemstones:<ul></ul></li>"
      $("#lootoutput ul:eq(0)").append(gemartliststring)
      for (var i = 0; i < roll; i++) {
        var tableroll = randomNumber (0, artgemstable.table.length-1);
        var gemstring = artgemstable.table[tableroll]
        gems.push(gemstring);
      }

      for (var i = 0; i < gems.length; i++) {
        $("#lootoutput ul:eq(0) ul:eq(0)").append('<li>'+gems[i]+'</li>');
      }

      $("#lootoutput ul:eq(0) ul:eq(0) li").each(function() {
        var curitem = this;
        var curamount = 1;
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

      for (var v = 0; v < magicitemtabletype.length; v++) {
        var curtype = magicitemtabletype[v];
        var curamount = magicitemtableamounts[v];

        // find the appropriate table
        var magicitemstable = lootdata.magicitems;
        for (var i = 0; i < magicitemstable.length; i++) {
          if (magicitemstable[i].type === curtype) {
            magicitemstable = magicitemstable[i];
            break;
          }
        }

        // number of rolls on the table
        var roll = droll.roll(curamount).total;
        var magicitems = [];

    //    $("#lootoutput ul:eq(0)").append("<li><span class='unselectable'>x"+roll+" magic items from table "+curtype+":</span><ul></ul></li>");
      $("#lootoutput ul:eq(0) > li").last().append("<hr>");
        for (var i = 0; i < roll; i++) {

          var curmagicitem = null;
          var itemroll = randomNumber(1,100);
          console.log("item roll: ", itemroll)
          for (var n = 0; n < magicitemstable.table.length; n++) {
            if (itemroll >= parseInt(magicitemstable.table[n].min) && itemroll <= parseInt(magicitemstable.table[n].max)) {
              curmagicitem = magicitemstable.table[n];
              break;
            }
          }

          var magicitemstring = curmagicitem.item;
          if (curmagicitem.table) {
            magicitemstring += " (" + curmagicitem.table[randomNumber (0, curmagicitem.table.length-1)] + ")";
          }
          magicitems.push(magicitemstring);
        }


        for (var i = 0; i < magicitems.length; i++) {
        //  $("#lootoutput ul:eq(0) li:contains('table "+curtype+"') ul:eq(0)").append('<li>'+magicitems[i]+'</li>');
          $("#lootoutput ul:eq(0)").append('<li class="magicitem">'+magicitems[i]+'</li>');
        }


              $("#lootoutput ul:eq(0) > li.magicitem").each(function() {
                var curitem = this;
                var curamount = 1;
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

      for (var i = 0; i < treasure.length; i++) {
        $("#lootoutput ul:eq(0)").prepend('<li>'+treasure[i]+'</li>');
      }


    }
    return;
  }
