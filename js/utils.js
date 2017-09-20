function utils_combineText(textList) {
    let textStack = "";
    for (let i = 0; i < textList.length; ++i) {
        if (textList[i].istable === "YES") {
            textStack += utils_makeTable(textList[i]);
        } else {
            textStack += "<p>" + textList[i] + "</p>";
        }
    }
    return textStack;
}

function utils_makeTable(tableObject) {
    let tableStack = "<table><caption>" + tableObject.caption + "</caption><thead><tr><td>" + tableObject.thead.join("</td><td>") + "</td></tr></thead>";
    for (let i = 0; i < tableObject.tbody.length; ++i) {
        tableStack += "<tr><td>" + tableObject.tbody[i].join("</td><td>") + "</td></tr>";
    }
    return tableStack;
}