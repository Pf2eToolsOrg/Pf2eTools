const fs = require('fs');
const utS = require("./util-search-index");

fs.writeFileSync("search/index.json", JSON.stringify(utS.UtilSearchIndex.getIndex()), "utf8");