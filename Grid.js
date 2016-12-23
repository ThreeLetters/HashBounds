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
    constructor(g, p) {
        this.POWER = g;
        this.LEVEL = p;
        this.DATA = {};
        this.LENGTH = 0;
    }
    getKey(x, y) {
        return {
            x: Math.floor(x >> this.POWER),
            y: Math.floor(y >> this.POWER)
        }
    }
    insert(node) {

        var a = this.getKey(node.bounds.width, node.bounds.height);
        if (a.x + a.y >= 3 || this.LEVEL == 0) return false;
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
                if (!this.DATA[ke]) this.DATA[ke] = new Map()
                this.DATA[ke].set(node.hash.id, node)
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

                this.DATA[ke].delete(node.hash.id)
            }

        }
    }
    toArray(array, bounds) {
        if (this.LENGTH <= 0) return;
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;

                if (this.DATA[ke]) this.DATA[ke].forEach((node) => {
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
            y2 = bounds.y + bounds.height;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;

                if (this.DATA[ke])
                    if (!this.DATA[ke].every(call)) return false;
            }

        }
        return true;
    }
    forEach(bounds, call) {
        if (this.LENGTH <= 0) return;
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        for (var i = k1.y; i < k2.y + 1; i++) {
            for (var j = k1.x; j < k2.x + 1; j++) {
                var ke = j + ":" + i;

                if (this.DATA[ke])
                    this.DATA[ke].forEach(call)
            }

        }

    }
}