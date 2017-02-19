
[![NPM](https://img.shields.io/badge/Module-Npm-blue.svg)](https://www.npmjs.com/package/hashbounds)
[![Donate](https://img.shields.io/badge/Donate-Paypal-brightgreen.svg)](https://paypal.me/andrews54757)

[![Demo](https://cloud.githubusercontent.com/assets/13282284/23081424/b7cd5f16-f522-11e6-8fe9-dfdde154340d.png)](https://threeletters.github.io/HashBounds/browser/visual/)

# HashBounds
A super efficient collision check reducer. Also a good snack made out of potato made for programmers on their lunch breaks

# Usage
> npm install hashbounds

##### Hashbounds(basecellsize,lvls,max,min)

```
var HashBounds = require('hashbounds')
var hashBounds = new HashBounds(10,2,100) // size of base cells (In squares of 2), amount of levels, maximum value
var node = {
    bounds: {
        x: 10,
        y: 10,
        width: 5,
        height: 3
    }
}
hashBounds.insert(node) // add node

node.bounds.x = 4
hashBounds.update(node) // Update node (for moving cells)
var bounds = {
    x: 3,
    y: 0,
    width: 10,
    height: 10
}
var nodes = hashBounds.toArray(bounds) // gets nodes that is in/near the bounds
console.log(nodes.length)
hashBounds.delete(node)// delete node
```


## How does it work?

It is a combination of a Spatial Hash, a Heiracheal structure, and a Quad Tree merged togethor.

## Requirements
In order for this to work, all objects inserted must have include `bounds`.

```
var obj = {
    bounds: {
        x: 0, // x
        y: 0, // y
        width: 5, // width
        height: 5
    }
}
```

## Browser

`<script type="text/javascript" src="https://cdn.rawgit.com/ThreeLetters/HashBounds/master/browser/HashBounds.js"></script>`

## Methods:

1. insert(node): Insert a node into the map
2. delete(node): Remove a node from the map
3. update(node): Update the node in the map
4. clear(): Clear all nodes in the map
5. toArray(bounds): Get an array of objects in certain bounds
6. forEach(bounds,call): Loop through objects in certain bounds
7. every(bounds,call): Same a .forEach(bounds), but stops execution when returning false

## Other Info

* insert() method very fast (264,867 ops/sec, efficiency - O(1))
* delete(), less efficient than insert (9,201 ops/sec, efficiency - O(1)).
* update(), okay (8,541 ops/sec)
* forEach(), fast (Fast as a quadtree)
* More efficient than a quadtree
* More efficient than a spatial hash
* More efficient than a "normal" heiracheal hash
