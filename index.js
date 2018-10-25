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

var Grid = require('./Grid.js');
module.exports = class HashBounds {
    constructor(power, lvl, maxX, maxY) {
        this.INITIAL = power;
        this.LVL = lvl;
        this.MAXX = maxX;
        this.MAXY = maxY || maxX;
        this.POWER = power;
        this.MAXVAL;
        this.LEVELS = []
        this.lastid = 0;
        this.BASE;
        this.createLevels()
        this.log2;
        this.QUERYID = 1;
        this.setupLog2();
    }
    getQueryID() {
        if (this.QUERYID >= 4294967295) {
            this.QUERYID = 1;
        } else this.QUERYID++;
        return this.QUERYID;
    }

    setupLog2() {
        var pow = (1 << this.LVL) - 1;
        this.MAXVAL = pow;
        this.log2 = new Uint8Array(pow);

        for (var i = 0; i < pow; ++i) {
            this.log2[i] = (Math.floor(Math.log2(i + 1)))
        }
    }

    createLevels() {
        this.LEVELS = [];
        this.ID = Math.floor(Math.random() * 100000);
        for (var i = this.LVL - 1; i >= 0; --i) {
            var a = this.INITIAL + i;
            var b = 1 << a;
            this.LEVELS[i] = new Grid(a, i, Math.ceil(this.MAXX / b), Math.ceil(this.MAXY / b), (i == this.LVL - 1) ? null : this.LEVELS[i + 1])
            if (i == this.LVL - 1) this.BASE = this.LEVELS[i];
        }
    }
    clear() {
        this.createLevels();
    }
    update(node, bounds) {

        if (!node._InHash || node._HashParent !== this.ID) {
            return this.insert(node, bounds)
        }
        this.convertBounds(bounds);
        var prev = node.hash.cachedIndex;
        var level = this.getLevel(node, bounds);

        if (prev != level) {
            this.LEVELS[prev].delete(node)
            this.LEVELS[level].insert(node, bounds);
            return true;
        } else {

            return this.LEVELS[level].update(node, bounds)

        }
    }
    getLevel(node, bounds) {
        if (node.hash.cacheWidth === bounds.width && node.hash.cacheHeight === bounds.height) {
            return node.hash.cachedIndex;
        }

        var i = (Math.max(bounds.width, bounds.height) >> this.POWER);
        var index;
        if (i >= this.MAXVAL) {
            index = this.LVL - 1;
        } else {
            index = this.log2[i];
        }

        node.hash.cachedIndex = index;
        node.hash.cacheWidth = bounds.width;
        node.hash.cacheHeight = bounds.height;

        return index;
    }
    insert(node, bounds) {
        if (node._HashParent !== this.ID) {
            node.hash = {
                k1x: 0,
                k1y: 0,
                k2x: 0,
                k2y: 0,
                indexes: [],
                cachedIndex: 0,
                cacheWidth: 0,
                cacheHeight: 0,
                id: ++this.lastid,
                check: 0
            }
            node._HashParent = this.ID;
        } else
        if (node._InHash) throw "ERR: A node cannot be already in this hash!"; // check if it already is inserted

        this.convertBounds(bounds);


        this.LEVELS[this.getLevel(node, bounds)].insert(node, bounds);
        node._InHash = true;
    }

    delete(node) {
        if (!node._InHash || node._HashParent !== this.ID) throw "ERR: Node is not in this hash!"
        this.LEVELS[node.hash.cachedIndex].delete(node)
        node._InHash = false;
    }
    toArray(bounds) {
        if (bounds)
            this.convertBounds(bounds);
        else bounds = null;
        var arr = [];
        this.BASE.every(bounds, (obj) => {
            arr.push(obj);
            return true;
        }, this.getQueryID())
        return arr;
    }
    every(bounds, call) {
        if (!call) {
            call = bounds;
            bounds = null;
        } else
            this.convertBounds(bounds);

        return this.BASE.every(bounds, call, this.getQueryID());
    }
    forEach(bounds, call) {
        if (!call) {
            call = bounds;
            bounds = null;
        } else
            this.convertBounds(bounds);

        this.BASE.every(bounds, (obj) => {
            call(obj)
            return true;
        }, this.getQueryID());
    }
    mmToPS(bounds) { // min-max to pos-size
        bounds.x = bounds.minX;
        bounds.y = bounds.minY;
        bounds.width = bounds.maxX - bounds.minX;
        bounds.height = bounds.maxY - bounds.minY;
    }
    psToMM(bounds) { // pos-size to min-max

        bounds.minX = bounds.x;
        bounds.minY = bounds.y;

        bounds.maxX = bounds.x + bounds.width;
        bounds.maxY = bounds.y + bounds.height;
    }

    checkBoundsMax(bounds) { // check if bounds exceeds max size
        this.convertBounds(bounds);
        return (bounds.maxX < this.MAXX && bounds.maxY < this.MAXY)
    }
    truncateBounds(bounds, minX, minY, maxX, maxY) {
        if (bounds.TYPE === 1) {

            bounds.x = Math.min(bounds.x, minX);
            bounds.y = Math.min(bounds.y, minY);

            if (bounds.x + bounds.width > maxX) {
                bounds.width = maxX - bounds.x;
            }
            if (bounds.y + bounds.height > maxY) {
                bounds.height = maxY - bounds.y;
            }


        } else if (bounds.TYPE === 2) {
            bounds.minX = Math.max(bounds.minX, minX);
            bounds.minY = Math.max(bounds.minY, minY);
            bounds.maxX = Math.min(bounds.maxX, maxX);
            bounds.maxY = Math.min(bounds.maxY, maxY);
        } else {
            throw "ERR: Bound not formatted! Please make sure bounds were put through the convertBounds function";
        }
    }
    convertBounds(bounds) { // convert for our purposes
        if (bounds.TYPE === undefined) {
            if (bounds.x !== undefined) {
                this.psToMM(bounds);
                bounds.TYPE = 1;
            } else {
                this.mmToPS(bounds);
                bounds.TYPE = 2;
            }
        } else if (bounds.TYPE === 1) {
            this.psToMM(bounds);
        } else if (bounds.TYPE === 2) {
            this.mmToPS(bounds);
        }
    }
}
