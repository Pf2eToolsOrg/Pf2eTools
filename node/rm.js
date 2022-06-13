const {rmDirRecursiveSync} = require("./util.js");

if (process.argv.length < 3) throw new Error(`An argument is required!`);

const tgt = process.argv[2];
console.log(`Removing: ${tgt}`);
rmDirRecursiveSync(tgt);