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
        this.NEXT = false;

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


                if (this.PREV) var l = this.PREV.DATA[bx | (by + 32767)];
                else
                    var l = {
                        CHILDREN: [],
                        add: function () {},
                        sub: function () {}
                    }
                this.DATA[key] = new Holder(l, j, i, this.POWER, this.LEVEL);

            }
        }
    }
    createAt(x, y) {
        var kx = (x + 32767) << 16;
        var ky = y + 32767;

        if (this.PREV) {
            var bx = ((x >> 1) + 32767) << 16;
            var by = y >> 1;

            var l = this.PREV.DATA[bx | (by + 32767)];
        } else
            var l = {
                CHILDREN: [],
                add: function () {},
                sub: function () {}
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
    _getKey(x, y) {
        return x | y

    }
    _get(bounds, call) {
        if (!bounds) {
            for (var key in this.DATA) {
                if (this.DATA[key]) {
                    if (!call(this.DATA[key])) return false
                }
            }
            return true;
        }
        var x1 = bounds.minX,
            y1 = bounds.minY,
            x2 = bounds.maxX,
            y2 = bounds.maxY;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)

        for (var j = k1.x; j <= k2.x; ++j) {

            var x = (j + 32767) << 16;

            for (var i = k1.y; i <= k2.y; ++i) {


                var key = x | (i + 32767);
                if (this.DATA[key]) {
                    if (!call(this.DATA[key])) return false
                }

            }
        }
        return true;
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
    checkChange(node, bounds) {
        var x1 = bounds.minX,
            y1 = bounds.minY,
            x2 = bounds.maxX,
            y2 = bounds.maxY;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)

        return node.hash.k1.x != k1.x || node.hash.k1.y != k1.y || node.hash.k2.x != k2.x || node.hash.k2.y != k2.y
    }

    insert(node, bounds) {

        var x1 = bounds.minX,
            y1 = bounds.minY,
            x2 = bounds.maxX,
            y2 = bounds.maxY;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)
        node.hash.k1 = k1
        node.hash.k2 = k2
        node.hash.level = this.LEVEL;

        for (var j = k1.x; j <= k2.x; ++j) {
            var x = (j + 32767) << 16;
            for (var i = k1.y; i <= k2.y; ++i) {
                var ke = x | (i + 32767);
                // console.log(ke)
                if (!this.DATA[ke]) this.sendCreateAt(j, i);

                this.DATA[ke].set(node)
            }
        }
        return true;
    }
    delete(node) {
        var k1 = node.hash.k1
        var k2 = node.hash.k2
        var lenX = k2.x,
            lenY = k2.y;
        for (var j = k1.x; j <= lenX; ++j) {
            var x = (j + 32767) << 16;
            for (var i = k1.y; i <= lenY; ++i) {


                var ke = x | (i + 32767);

                this.DATA[ke].delete(node)
            }

        }
    }
    toArray(bounds) {
        var hsh = {};
        var array = [];
        this._get(bounds, function (cell) {
            cell.forEach(bounds, function (obj) {
                if (hsh[obj._HashID]) return;
                hsh[obj._HashID] = true;
                array.push(obj);

            })
            return true;
        })
        return array;
    }
    every(bounds, call) {
        var hsh = {};
        return this._get(bounds, function (cell) {
            return cell.every(bounds, function (obj, i) {
                if (hsh[obj._HashID]) return true;
                hsh[obj._HashID] = true;
                return call(obj);

            })
        })
    }
    forEach(bounds, call) {
        var hsh = {};
        this._get(bounds, function (cell) {
            cell.forEach(bounds, function (obj, i) {
                if (hsh[obj._HashID]) return;
                hsh[obj._HashID] = true;
                call(obj);

            })
            return true;
        })
    }
}
