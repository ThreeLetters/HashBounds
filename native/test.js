var hs = require('./index.js');
var objs = [];
for (var i = 0; i < 100000; i++) {

    var obj = {
        bounds: {
            x: Math.random() * 10000,
            y: Math.random() * 10000,
            width: Math.random() * 100,
            height: Math.random() * 100
        }
    }
    objs.push(obj)
}
var hash = new hs(5, 3);


var start = Date.now();
objs.forEach((obj) => {
    hash.insert(obj, obj.bounds)
})
var end = Date.now();
var diff = end - start;
console.log(diff)
var start = Date.now();
var total = 0;
objs.forEach((obj) => {
    obj.count = hash.toArray(obj.bounds).length
    total += obj.count;
})
var end = Date.now();
var diff2 = end - start;
console.log(diff2, total)
