const fs = require("fs");
const utB = require("./util-book-reference.js");

fs.writeFileSync("../data/generated/bookref-quick.json", JSON.stringify(utB.UtilBookReference.getIndex({name: "Quick Reference", id: "bookref-quick", tag: "quickref"})), "utf8");
console.log("Updated Quick references.");
