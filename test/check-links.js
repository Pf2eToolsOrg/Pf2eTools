const fs = require('fs');

const re = /{@(\w+) (.*?)\|(.*?)(\|.*?)?}/g;

function recursiveAdd (file) {
	if (file.endsWith(".json")) ALL_JSON.push(file);
	else if (fs.lstatSync(file).isDirectory()) {
		fs.readdirSync(file).forEach(nxt => {
			recursiveAdd(`${file}/${nxt}`)
		})
	}
}

const ALL_JSON = [];
recursiveAdd("./data");

// spell|item|class|creature|condition|background

ALL_JSON.forEach(j => {
	const contents = fs.readFileSync(j, 'utf8');
	const allTags = [];
	let match;
	while (match = re.exec(contents)) {
		allTags.push(match[0])
	}
	console.log("asd")
});

console.log("data");