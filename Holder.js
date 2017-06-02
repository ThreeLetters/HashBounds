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
var QuickMapV2 = require('./QuickMapV2.js')
module.exports = class Holder {
    constructor(parent, x, y, power, lvl) {
        this.PARENT = parent;
        this.PARENT.CHILDREN.push(this)
        this.MAP = [];
        this.POWER = power;
        this.LVL = lvl
        this.LEN = 0;
        this.X = x;
        this.Y = y;
        this.BOUNDS = {
            x: x << power,
            y: y << power,
            width: 1 << power,
            height: 1 << power
        }
        this.CHILDREN = []

    }
    checkIntersect(r1, r2) {
        var mx1 = r1.x + r1.width,
            mx2 = r2.x + r2.width,
            my1 = r1.y + r1.height,
            my2 = r2.y + r2.height;
        /*
        !(r2.left > r1.right || 
           r2.right < r1.left || 
           r2.top > r1.bottom ||
           r2.bottom < r1.top);
        
        */



        return !(r2.x >= mx1 || mx2 <= r1.x || r2.y >= my1 || my2 <= r1.y)

    }

    set(node) {

        this.MAP.push(node)
        this.add()
    }
    add() {
        ++this.LEN;
        this.PARENT.add();


    }

    getQuad(bounds, bounds2) {
        if (!this.CHILDREN[0]) return -2;

        var minX = bounds.x,
            minY = bounds.y,
            maxX = bounds.x + bounds.width,
            maxY = bounds.y + bounds.height,
            minX2 = bounds2.x,
            minY2 = bounds2.y,
            maxX2 = bounds2.x + bounds2.width,
            maxY2 = bounds2.y + bounds2.height,
            halfY = bounds2.y + (bounds2.height >> 1),
            halfX = bounds2.x + (bounds2.width >> 1);


        var top = maxY <= halfY;
        var bottom = minY > halfY;
        var left = maxX <= halfX;
        var right = minX > halfX;


        if (top) {
            if (left) return [0];
            else if (right) return [2];
            return [0, 2];
        } else if (bottom) {
            if (left) return [1];
            else if (right) return [3];
            return [1, 3];
        }

        if (left) {
            return [0, 1];
        } else if (right) {
            return [2, 3];
        }

        if (bounds.width < bounds2.width || bounds.height < bounds2.height) return [0, 1, 2, 3];
        return -1; // too big
    }



    forEachAll(call) {
        if (!this.LEN) return;
        this.MAP.forEach(call)

        for (var i = 0; i < this.CHILDREN.length; ++i) {
            this.CHILDREN[i].forEachAll(call)
        }


    }
    forEach(bounds, call) {
        if (!this.LEN) return;


        var quads = this.getQuad(bounds, this.BOUNDS)

        if (quads === -1) return this.forEachAll(call);

        this.MAP.forEach(call)

        if (quads === -2) return

        quads.forEach((q) => {
            var child = this.CHILDREN[q];
            if (child) child.forEach(bounds, call)
        })


        return;
    }
    every(bounds, call) {
        if (!this.LEN) return true;

        var quads = this.getQuad(bounds, this.BOUNDS)

        if (quads === -1) return this.everyAll(call);

        if (!this.MAP.every(call)) return false;

        if (quads === -2) return true;

        return quads.every((q) => {
            var child = this.CHILDREN[q];
            if (!child) return true;
            return this.CHILDREN[i].every(bounds, call)
        })
    }
    everyAll(call) {
        if (!this.LEN) return true;
        if (!this.MAP.every(call)) return false;
        for (var i = 0; i < this.CHILDREN.length; ++i) {
            if (!this.CHILDREN[i].everyAll(call)) return false;
        }
        return true;
    }

    sub() {
        --this.LEN;
        this.PARENT.sub();
    }
    delete(node) {
        var ind = this.MAP.indexOf(node)
        this.MAP.splice(ind, 1);
        this.sub()
    }



}