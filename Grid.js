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
    constructor(g, p, size, minc, prev) {
        this.POWER = g;
        this.LEVEL = p;
        this.PREV = prev;
        this.SIZE = size;
        this.MIN = minc * -1;
        this.DATA = {};
        this.init()
    }
    init() {
        if (this.SIZE >= 65535) {
            throw "Maximum amount of buckets are 65535^2"
        } // Max limit is 65535 (16 bits) 
        // console.log(this.SIZE)
        for (var j = this.MIN; j <= this.SIZE; ++j) {
            var x = j << 16
            var bx = (j >> 1) << 16;
            for (var i = this.MIN; i <= this.SIZE; ++i) {

                var by = i >> 1
                var key = this._getKey(x, i);


                if (this.PREV) var l = this.PREV.DATA[this._getKey(bx, by)];
                else var l = false;
                this.DATA[key] = new Holder(l, j, i, this.POWER, this.LVL);

            }
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
        var x1 = bounds.x,
            y1 = bounds.y,
            x2 = bounds.x + bounds.width,
            y2 = bounds.y + bounds.height;

        var k1 = this.getKey(x1, y1)
        var k2 = this.getKey(x2, y2)

        for (var j = k1.x; j <= k2.x; ++j) {

            var x = j << 16;

            for (var i = k1.y; i <= k2.y; ++i) {


                var key = this._getKey(x, i);
                if (this.DATA[key]) {
                    if (!call(this.DATA[key])) return false
                }

            }
        }
        return true;
    }

    insert(node) {

        //   var a = this.getKey(node.bounds.width, node.bounds.height);
        // if (a.x + a.y >= 2 && this.LEVEL != 0) return false;

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
    delete(node) {
        var k1 = node.hash.k1
        var k2 = node.hash.k2
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
    toArray(array, bounds) {
        var hsh = {};

        this._get(bounds, function (cell) {

            cell.forEach(bounds, function (obj, i) {
                if (hsh[i]) return true;
                hsh[i] = true;
                array.push(obj);
                return true;
            })
            return true;
        })
    }
    every(bounds, call) {
        var hsh = {};

        this._get(bounds, function (cell) {

            return cell.every(bounds, function (obj, i) {
                if (hsh[i]) return true;
                hsh[i] = true;
                return call(obj);

            })
        })
    }
    forEach(bounds, call) {

        var hsh = {};

        this._get(bounds, function (cell) {

            cell._get(bounds, function (obj, i) {
                if (hsh[i]) return true;
                hsh[i] = true;
                call(obj);
                return true;
            }, )
            return true;
        })
    }
}