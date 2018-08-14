/*
 hashbounds: A spatial partitioning system

 Author: Andrews54757
 License: AGPL-3.0 (https://github.com/ThreeLetters/HashBounds/blob/master/LICENSE)
 Source: https://github.com/ThreeLetters/HashBounds
 Build: v4.5.6
 Built on: 14/08/2018
*/

// /Library/WebServer/Documents/HashBounds/Holder.js
class Holder {
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
// /Library/WebServer/Documents/HashBounds/Grid.js
class Grid {
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
// /Library/WebServer/Documents/HashBounds/index.js
class HashBounds {
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
    truncateBounds(bounds) {
        if (bounds.TYPE === 1) {

            bounds.x = Math.min(bounds.x, this.MAXX);
            bounds.y = Math.min(bounds.y, this.MAXX);

            if (bounds.x + bounds.width > this.MAXX) {
                bounds.width = this.MAXX - bounds.x;
            }
            if (bounds.y + bounds.height > this.MAXY) {
                bounds.height = this.MAXY - bounds.y;
            }


        } else if (bounds.TYPE === 2) {
            bounds.minX = Math.min(bounds.minX, this.MAXX);
            bounds.minY = Math.min(bounds.minY, this.MAXY);
            bounds.maxX = Math.min(bounds.maxX, this.MAXX);
            bounds.maxY = Math.min(bounds.maxY, this.MAXY);
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
