var HashBounds = require('../index.js');

var hash = new HashBounds(3, 5, 100)

var obj = {
    bounds: {
        x: 12,
        y: 5,
        width: 1,
        height: 1
    },
    data: "hello"
}
hash.insert(obj)
var obj = {
    bounds: {
        x: 75,
        y: 70,
        width: 10,
        height: 12
    },
    data: "world"
}
hash.insert(obj)

console.log(hash.toArray({
        x: 0,
        y: 0,
        width: 20,
        height: 10
    })) // return first item
console.log(hash.toArray({
        x: 60,
        y: 60,
        width: 20,
        height: 20
    })) // return last item
console.log(hash.toArray({
        x: 0,
        y: 0,
        width: 100,
        height: 100
    })) // return both items