var fs = require('fs');

var f1 = fs.readFileSync("../Holder.js", "utf8");
var f2 = fs.readFileSync("../Grid.js", "utf8");
var f3 = fs.readFileSync("../index.js", "utf8");

var license = f2.split("*/")[0] + "*/"

f1 = f1.split("module.exports = ")[1];
f2 = f2.split("module.exports = ")[1];
f3 = f3.split("module.exports = ")[1];

var final = [];

final.push(license, f1, f2, f3)


fs.writeFileSync("../browser/HashBounds.js", final.join("\n"));
