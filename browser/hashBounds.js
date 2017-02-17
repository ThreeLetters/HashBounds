"use strict"
/*
       HashBounds - A hierarchical spacial hashing system
    Copyright (C) 2016 Andrew S

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
function Grid(g, p, size) {
    
        this.POWER = g;
        this.LEVEL = p;
        this.SIZE = size;
        this.DATA = {};
        this.LENGTH = 0;
        this.init()
    }
    Grid.prototype.init = function() {
        if (this.SIZE >= 65535) {
            throw "Maximum amount of buckets are 65535^2"
        } // Max limit is 65535 (16 bits) 
        // console.log(this.SIZE)
        for (var j = 0; j <= this.SIZE; ++j) {
            var x = j << 16
            for (var i = 0; i <= this.SIZE; ++i) {

                var key = this._getKey(x, i);
                // console.log(key)
                this.DATA[key] = new Map()

            }
        }

    }
    Grid.prototype._every = function(m, c) {
        var a = m.entries()
        var b;
        while (b = a.next().value) {
            if (!c(b[1], b[0])) return false;
        }
        return true;
    }

    Grid.prototype.getKey = function(x, y) {
        return {
            x: x >> this.POWER,
            y: y >> this.POWER
        }
    }
    Grid.prototype._getKey = function(x, y) {
        return x | y

    }
    Grid.prototype.checkBorders = function(x, y) {
        return !(x > this.SIZE || y > this.SIZE)

    }
    Grid.prototype.insert = function(node) {

        //   var a = this.getKey(node.bounds.width, node.bounds.height);
        // if (a.x + a.y >= 2 && this.LEVEL != 0) return false;
        this.LENGTH++;
        var x1 = node.bounds.x,
            y1 = node.bounds.y,
            x2 = node.bounds.x + node.bounds.width,
            y2 = node.bounds.y + node.bounds.height;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        node.hash.k1 = k1
        node.hash.k2 = k2
        node.hash.level = this.LEVEL
        var lenX = k2.x + 1,
            lenY = k2.y + 1;
        for (var j = k1.x; j < lenX; ++j) {
            var x = j << 16;
            for (var i = k1.y; i < lenY; ++i) {

                var ke = this._getKey(x, i);
                // console.log(ke)
                this.DATA[ke].set(node._HashID, node)
            }

        }
        return true;
    }
    Grid.prototype.delete = function(node) {
        var k1 = node.hash.k1
        var k2 = node.hash.k2
        this.LENGTH--;
        var lenX = k2.x + 1,
            lenY = k2.y + 1;
        for (var j = k1.x; j < lenX; ++j) {
            var x = j << 16;
            for (var i = k1.y; i < lenY; ++i) {


                var ke = this._getKey(x, i);

                this.DATA[ke].delete(node._HashID)
            }

        }
    }
    Grid.prototype.toArray = function(array, bounds) {
        if (this.LENGTH <= 0) return;

        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height,
            h = {};

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var j = k1.x; j <= k2.x; ++j) {
            var x = j << 16;
            for (var i = k1.y; i <= k2.y; ++i) {

                var ke = this._getKey(x, i);

                if (this.DATA[ke]) this.DATA[ke].forEach((node, i) => {

                    if (h[i]) return;
                    h[i] = true;
                    array.push(node)
                })
            }

        }
    }
    Grid.prototype.every = function(bounds, call) {
        if (this.LENGTH <= 0) return true;
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height,
            h = {};

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var j = k1.x; j <= k2.x; ++j) {
            var x = j << 16;
            for (var i = k1.y; i <= k2.y; ++i) {

                var ke = this._getKey(x, i);

                if (this.DATA[ke])
                    if (!this._every(this.DATA[ke], (a, b) => {

                            if (h[b]) return true;
                            h[b] = true;
                            return call(a, b);
                        })) return false;
            }

        }
        return true;
    }
    Grid.prototype.forEach = function(bounds, call) {
        if (this.LENGTH <= 0) return;
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height,
            h = {};

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)

        for (var j = k1.x; j <= k2.x; ++j) {
            var x = j << 16;
            for (var i = k1.y; i <= k2.y; ++i) {

                var ke = this._getKey(x, i);

                if (this.DATA[ke])
                    this.DATA[ke].forEach((a, b) => {
                        if (h[b]) return;
                        h[b] = true;
                        call(a, b)
                    })
            }

        }

    }

function HashBounds(power, lvl, max) {
        this.INITIAL = power;
        this.LVL = lvl;
        this.MAX = max;
        this.MIN = power - 1;
        this.LEVELS = []
        this.lastid = 0;
        this.createLevels()
        this.SQRT = [];
        this.setupSQRT()
    }

    HashBounds.prototype.setupSQRT = function() {
        for (var i = 0; i < 255; ++i) {
            this.SQRT.push(Math.floor(Math.sqrt(i)))
        }
    }

    HashBounds.prototype.createLevels = function() {
        this.LEVELS = [];
        var a = this.INITIAL;
        for (var i = 0; i < this.LVL; i++, a++) {

            this.LEVELS.push(new Grid(a, i, this.MAX >> a))
        }
    }
    HashBounds.prototype.clear = function() {
        this.createLevels();
    }
    HashBounds.prototype.update = function(node) {
        this.delete(node)
        this.insert(node)
    }
    HashBounds.prototype.insert = function(node) {
        if (node.hash) throw "ERR: A node cannot be already in a hash!"
        var bounds = node.bounds;
        node.hash = {}
        if (!node._HashID) node._HashID = ++this.lastid;
        if (node._HashSize == node.bounds.width + node.bounds.height) {
            this.LEVELS[node._HashIndex].insert(node);
            return;
        }

        var index = this.SQRT[(node.bounds.width + node.bounds.height) >> this.MIN]
        if (index > this.LVL) index = this.LVL;

        node._HashIndex = index;
        node._HashSize = node.bounds.width + node.bounds.height;
        this.LEVELS[index].insert(node);
        //for (var i = 0; i < len; ++i) {
        //   if (this.LEVELS[len - i - 1].insert(node)) break;
        //}
    }


    HashBounds.prototype.delete = function(node) {
        if (!node.hash) throw "ERR: Node is not in a hash!"
        this.LEVELS[node.hash.level].delete(node)
        node.hash = null;
    }
    HashBounds.prototype.toArray = function(bounds) {
        var array = [];
        for (var i = 0; i < this.LEVELS.length; i++) {
            this.LEVELS[i].toArray(array, bounds)
        }
        return array;
    }
    HashBounds.prototype.every = function(bounds, call) {
        for (var i = 0; i < this.LEVELS.length; i++) {
            if (!this.LEVELS[i].every(bounds, call)) return false;
        }
        return true;
    }
    HashBounds.prototype.forEach = function(bounds, call) {
        for (var i = 0; i < this.LEVELS.length; i++) {
            this.LEVELS[i].forEach(bounds, call)
        }
    }


