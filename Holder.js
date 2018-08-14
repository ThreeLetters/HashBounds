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

module.exports = class Holder {
    constructor(parent, x, y, power, lvl) {
        this.PARENT = parent;
        this.CHILDINDEX = 0;
        if (this.PARENT != null) this.PARENT.CHILDREN[this.PARENT.CHILDINDEX++] = this
        this.MAP = [];
        this.POWER = power;
        this.LVL = lvl
        this.LEN = 0;
        this.X = x;
        this.Y = y;
        this.KEY = ((x + 32767) << 16) | (y + 32767);
        this.BOUNDS = {
            x: x << power,
            y: y << power,
            width: 1 << power,
            height: 1 << power
        }

        this.BOUNDS.minX = this.BOUNDS.x
        this.BOUNDS.minY = this.BOUNDS.y
        this.BOUNDS.maxX = this.BOUNDS.x + this.BOUNDS.width;
        this.BOUNDS.maxY = this.BOUNDS.y + this.BOUNDS.height;

        this.CHILDREN = [];
    }

    add() {
        ++this.LEN;
        if (this.PARENT != null) this.PARENT.add();
    }

    checkIntersect(r1, r2) {
        var mx1 = r1.x + r1.width,
            mx2 = r2.x + r2.width,
            my1 = r1.y + r1.height,
            my2 = r2.y + r2.height;
        return !(r2.x >= mx1 || mx2 <= r1.x || r2.y >= my1 || my2 <= r1.y)
    }

    getQuad(bounds, bounds2) {
        if (this.CHILDINDEX === 0) return -2;

        var minX = bounds.minX,
            minY = bounds.minY,
            maxX = bounds.maxX,
            maxY = bounds.maxY,
            minX2 = bounds2.minX,
            minY2 = bounds2.minY,
            maxX2 = bounds2.maxX,
            maxY2 = bounds2.maxY,
            halfY = bounds2.y + (bounds2.height >> 1),
            halfX = bounds2.x + (bounds2.width >> 1);


        var top = maxY <= halfY;
        var bottom = minY > halfY;
        var left = maxX <= halfX;
        var right = minX > halfX;


        if (top) {
            if (left) return [this.CHILDREN[0]];
            else if (right) return [this.CHILDREN[2]];
            return [this.CHILDREN[0], this.CHILDREN[2]];
        } else if (bottom) {
            if (left) return [this.CHILDREN[1]];
            else if (right) return [this.CHILDREN[3]];
            return [this.CHILDREN[1], this.CHILDREN[3]];
        }

        if (left) {
            return [this.CHILDREN[0], this.CHILDREN[1]];
        } else if (right) {
            return [this.CHILDREN[2], this.CHILDREN[3]];
        }

        if (bounds.width < bounds2.width || bounds.height < bounds2.height || minX > minX2 || maxX < maxX2 || minY > minY2 || maxY < maxY2) {

            return [this.CHILDREN[0], this.CHILDREN[1], this.CHILDREN[2], this.CHILDREN[3]];
        }
        return -1; // too big
    }
    _every(call, QID) {
        for (var i = 0; i < this.MAP.length; i++) {
            if (this.MAP[i].hash.check != QID) {

                this.MAP[i].hash.check = QID;
                if (!call(this.MAP[i])) return false;
            }
        }
        return true;
    }
    every(bounds, call, QID) {
        if (this.LEN === 0) return true;
        var quads = this.getQuad(bounds, this.BOUNDS)

        if (quads === -1) return this.everyAll(call, QID);

        if (!this._every(call, QID)) return false;

        if (quads === -2) return true;

        for (var i = 0; i < quads.length; i++) {
            if (!quads[i].every(bounds, call, QID)) return false;
        }
        return true;
    }

    everyAll(call, QID) {
        if (this.LEN === 0) return true;

        if (!this._every(call, QID)) return false;
        if (this.CHILDINDEX !== 0) {
            for (var i = 0; i < 4; ++i) {
                if (!this.CHILDREN[i].everyAll(call, QID)) return false;
            }
        }
        return true;
    }

    sub() {
        --this.LEN;
        if (this.PARENT != null) this.PARENT.sub();
    }
    delete(node, key) {

        var index = node.hash.indexes[key];
        var swap = this.MAP[index] = this.MAP[this.MAP.length - 1];
        swap.hash.indexes[(this.X - swap.hash.k1x) * (swap.hash.k2y - swap.hash.k1y + 1) + this.Y - swap.hash.k1y] = index;
        this.MAP.pop();
        this.sub()
    }
    set(node, key) {
        node.hash.indexes[key] = this.MAP.length;
        this.MAP.push(node)
        this.add()
    }
}
