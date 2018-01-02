const fs = require('fs');

/* // FIXME this should update the version number in the 5etools.html footer
const VERSION_FILE = "version.txt";

if (!fs.existsSync(VERSION_FILE)) {
	console.warn(`No version.txt found in root directory, creating...`);
	fs.writeFileSync(VERSION_FILE, "1.0.0", "utf8");
} else {
	let contents = fs.readFileSync(VERSION_FILE, 'utf8').trim();
	const m = /^(\d+)((\.\d+)*)([a-z]+)?$/.exec(contents);
	if (m) {
		const splitVer = contents.split(".");
		splitVer[splitVer.length - 1] = Number(splitVer[splitVer.length - 1].replace(/[^0-9]/g, "")) + 1;
		fs.writeFileSync(VERSION_FILE, splitVer.join("."), "utf8");
	} else {
		throw new Error(`Could not read version number from ${VERSION_FILE}`);
	}
}
*/