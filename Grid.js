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

var Holder = require('./Holder.js')
module.exports = class Grid {
    constructor(g, p, sizeX, sizeY, prev) {
        this.POWER = g;
        this.LEVEL = p;
        this.PREV = prev;
        this.NEXT = null;
        this.QUERYID = 1;
        if (this.PREV) this.PREV.NEXT = this;
        this.SIZEX = sizeX;
        this.SIZEY = sizeY;
        this.DATA = {};
        this.init()
    }

    init() {

        for (var j = 0; j < this.SIZEX; ++j) {
            var x = (j + 32767) << 16
            if (this.PREV) var bx = ((j >> 1) + 32767) << 16;
            for (var i = 0; i < this.SIZEY; ++i) {

                var by = i >> 1;
                var key = x | (i + 32767);
                var l = null;

                if (this.PREV !== null) l = this.PREV.DATA[bx | (by + 32767)];

                this.DATA[key] = new Holder(l, j, i, this.POWER, this.LEVEL);

            }
        }
    }
    sendCreateAt(x, y) {

        var X = x << this.POWER,
            Y = y << this.POWER;

        var root = this;

        while (root.PREV) {
            root = root.PREV;
        }
        // console.log("CREATING:")
        root.createAt(X >> root.POWER, Y >> root.POWER)
    }
    createAt(x, y) {
        var kx = (x + 32767) << 16;
        var ky = y + 32767;
        var l = null;
        if (this.PREV !== null) {
            var bx = ((x >> 1) + 32767) << 16;
            var by = y >> 1;

            l = this.PREV.DATA[bx | (by + 32767)];
        }

        this.DATA[kx | ky] = new Holder(l, x, y, this.POWER, this.LEVEL);

        if (this.NEXT) {
            var dx = x << 1,
                dy = y << 1
            this.NEXT.createAt(dx, dy)
            this.NEXT.createAt(dx, dy + 1)
            this.NEXT.createAt(dx + 1, dy)
            this.NEXT.createAt(dx + 1, dy + 1)
        }
    }
    getKey(x, y) {
        return {
            x: x >> this.POWER,
            y: y >> this.POWER
        }
    }
    _get(bounds, call) {

    }
    checkChange(node, k1x, k1y, k2x, k2y) {
        return node.hash.k1x != k1x || node.hash.k1y != k1y || node.hash.k2x != k2x || node.hash.k2y != k2y
    }

    update(node, bounds) {
        var x1 = bounds.minX,
            y1 = bounds.minY,
            x2 = bounds.maxX,
            y2 = bounds.maxY;


        var k1x = x1 >> this.POWER,
            k1y = y1 >> this.POWER,
            k2x = x2 >> this.POWER,
            k2y = y2 >> this.POWER;

        if (this.checkChange(node, k1x, k1y, k2x, k2y)) {
            this.delete(node)
            this.insert(node, bounds, k1x, k1y, k2x, k2y)
            return true;
        } else {
            return false;
        }

    }
    insert(node, bounds, k1x, k1y, k2x, k2y) {

        var x1 = bounds.minX,
            y1 = bounds.minY,
            x2 = bounds.maxX,
            y2 = bounds.maxY;
        if (k1x === undefined) {
            k1x = x1 >> this.POWER;
            k1y = y1 >> this.POWER;
            k2x = x2 >> this.POWER;
            k2y = y2 >> this.POWER;
        }
        node.hash.k1x = k1x
        node.hash.k1y = k1y;
        node.hash.k2x = k2x
        node.hash.k2y = k2y;
        var width = (k2x - k1x + 1),
            height = (k2y - k1y + 1)
        for (var j = k1x; j <= k2x; ++j) {
            var x = (j + 32767) << 16;
            var x2 = (j - k1x) * height;
            for (var i = k1y; i <= k2y; ++i) {
                var ke = x | (i + 32767);
                // console.log(ke)
                if (!this.DATA[ke]) this.sendCreateAt(j, i);

                this.DATA[ke].set(node, x2 + i - k1y)
            }
        }
        return true;
    }
    delete(node) {
        var k1x = node.hash.k1x
        var k1y = node.hash.k1y;
        var k2x = node.hash.k2x;
        var k2y = node.hash.k2y
        var width = (k2x - k1x + 1),
            height = (k2y - k1y + 1);
        for (var j = k1x; j <= k2x; ++j) {
            var x = (j + 32767) << 16;
            var x2 = (j - k1x) * height;
            for (var i = k1y; i <= k2y; ++i) {
                var ke = x | (i + 32767);
                this.DATA[ke].delete(node, x2 + i - k1y)
            }
        }
    }

    every(bounds, call, QID) {
        if (bounds === null) {
            for (var key in this.DATA) {
                if (this.DATA[key]) {
                    if (!this.DATA[key].everyAll(call, QID)) return false
                }
            }
            return true;
        }
        var x1 = bounds.minX,
            y1 = bounds.minY,
            x2 = bounds.maxX,
            y2 = bounds.maxY;

        var k1x = x1 >> this.POWER,
            k1y = y1 >> this.POWER,
            k2x = x2 >> this.POWER,
            k2y = y2 >> this.POWER;

        for (var j = k1x; j <= k2x; ++j) {
            var x = (j + 32767) << 16;
            for (var i = k1y; i <= k2y; ++i) {
                var key = x | (i + 32767);
                if (this.DATA[key]) {
                    if (!this.DATA[key].every(bounds, call, QID)) return false
                }
            }
        }
        return true;
    }

}
