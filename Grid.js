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
module.exports = class Grid {
    constructor(g, p,size) {
        this.POWER = g;
        this.LEVEL = p;
        this.SIZE = size;
        this.DATA = {};
        this.LENGTH = 0;
        this.init()
    }
    init() {
     for (var i = 0; i< this.size; ++i) {
        for (var j = 0; j< this.size; ++j) {
           var key = j + ":" + i;
           this.DATA[key] = new Map()    
               
     }   
     }
           
    }
    _every(m, c) {
        var a = m.entries()
        var b;
        while (b = a.next().value) {
            if (!c(b[1], b[0])) return false;
        }
        return true;
    }

    getKey(x, y) {
        return {
            x: x >> this.POWER,
            y: y >> this.POWER
        }
    }
    insert(node) {

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
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;
                this.DATA[ke].set(node._HashID, node)
            }

        }
        return true;
    }
    delete(node) {
        var k1 = node.hash.k1
        var k2 = node.hash.k2
        this.LENGTH--;
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;

                this.DATA[ke].delete(node._HashID)
            }

        }
    }
    toArray(array, bounds) {
        if (this.LENGTH <= 0) return;
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height,
            h = {};

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;

                if (this.DATA[ke]) this.DATA[ke].forEach((node, i) => {

                    if (h[i]) return;
                    h[i] = true;
                    array.push(node)
                })
            }

        }
    }
    every(bounds, call) {
        if (this.LENGTH <= 0) return true;
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height,
            h = {};

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;

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
    forEach(bounds, call) {
        if (this.LENGTH <= 0) return;
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height,
            h = {};

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;

                if (this.DATA[ke])
                    this.DATA[ke].forEach((a, b) => {
                        if (h[b]) return;
                        h[b] = true;
                        call(a, b)
                    })
            }

        }

    }
}
