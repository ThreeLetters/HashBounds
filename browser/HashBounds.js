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
function Holder(parent, x,y,power,lvl) {
        this.PARENT = parent;
        if (this.PARENT) this.PARENT.CHILDREN.push(this)
        this.MAP = new Map();
        this.POWER = power;
        this.LVL = lvl
        this.LEN = 0;
        this.X = x;
        this.Y = y;
      this.BOUNDS = {
       x: x << power,
       y: y << power,
       width: 2 << power,
       height: 2 << power
      }
        this.CHILDREN = []
      
    }
 Holder.prototype.checkIntersect = function(r1,r2) {
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
Holder.prototype.set = function (id, node) {

    this.MAP.set(id, node)
    this.add()
}
Holder.prototype.add = function () {
    ++this.LEN;
    if (this.PARENT) {
        this.PARENT.add();


    }
}
Holder.prototype.sub = function () {
    --this.LEN;
    if (this.PARENT) {
        this.PARENT.sub();
    }
}
Holder.prototype.delete = function (id) {
    this.MAP.delete(id)
    this.sub()
}
Holder.prototype._get = function(bounds,call) {
        if (!this.LEN) return true;
        if (!this._every(call)) return false;
        if (this.CHILDREN[0]) {
            for (var i = 0; i < 4; ++i) {
              if (this.checkIntersect(bounds,this.CHILDREN[i].bounds)) {
                 if (!this.CHILDREN[i]._get(bounds,call)) return false;
              }
            }
           
        }
        return true;
    }
Holder.prototype._every = function (c) {
    var a = this.MAP.entries()
    var b;
    while (b = a.next().value) {
        if (!c(b[1], b[0])) return false;
    }
    return true;
}



function Grid(g, p, size, minc, prev) {
    this.POWER = g;
    this.LEVEL = p;
    this.PREV = prev;
    this.SIZE = size;
    this.MIN = minc * -1;
    this.DATA = {};
    this.LENGTH = 0;
    this.init()
}
Grid.prototype.init = function () {
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
            this.DATA[key] = new Holder(l, i);

        }
    }
}

Grid.prototype.getKey = function (x, y) {
    return {
        x: x >> this.POWER,
        y: y >> this.POWER
    }
}
Grid.prototype._getKey = function (x, y) {
    return x | y

}
Grid.prototype._get = function (bounds, call) {
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

Grid.prototype.insert = function (node) {

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
Grid.prototype.delete = function (node) {
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
Grid.prototype.toArray = function (array, bounds) {
    if (this.LENGTH <= 0) return;
    var hsh = {};

    this._get(bounds, function (cell) {

        cell._get(bounds,function (obj, i) {
            if (hsh[i]) return true;
            hsh[i] = true;
            array.push(obj);
return true;
        })
        return true;
    })
}
Grid.prototype.every = function (bounds, call) {
    if (this.LENGTH <= 0) return;
    var hsh = {};

    this._get(bounds, function (cell) {

        return cell._get(bounds,function (obj, i) {
            if (hsh[i]) return true;
            hsh[i] = true;
            return call(obj);

        })
    })
}
Grid.prototype.forEach = function (bounds, call) {

    if (this.LENGTH <= 0) return;
    var hsh = {};

    this._get(bounds, function (cell) {

        cell._get(bounds,function (obj, i) {
            if (hsh[i]) return true;
            hsh[i] = true;
            call(obj);
            return true;
        })
        return true;
    })
}

function HashBounds(power, lvl, max, minc) {

    this.INITIAL = power;
    this.LVL = lvl;
    this.MAX = max;
    this.MINC = minc || 0;
    this.MIN = power + 1;
    this.LEVELS = []
       this.BASE = false;
    this.lastid = 0;
    this.createLevels()
    this.SQRT = [];
    this.setupSQRT()
}
HashBounds.prototype.setupSQRT = function () {
    for (var i = 0; i < 255; ++i) {
        this.SQRT.push(Math.floor(Math.sqrt(i)))
    }
}
HashBounds.prototype.createLevels = function () {
    this.LEVELS = [];

    var last = false
    for (var i = this.LVL - 1; i >= 0; --i) {
        var a = this.INITIAL + i;

        var grid = new Grid(a, i, this.MAX >> a, this.MINC >> a, last)
        if (!this.BASE) this.BASE = grid;
        this.LEVELS[i] = grid;
        last = grid;
    }

}
HashBounds.prototype.clear = function () {
    this.createLevels();
}
HashBounds.prototype.update = function (node) {
    this.delete(node)
    this.insert(node)
}
HashBounds.prototype.insert = function (node) {
    if (node.hash) throw "ERR: A node cannot be already in a hash!"
    var bounds = node.bounds;
    node.hash = {}
    if (!node._HashID) node._HashID = ++this.lastid;
    if (node._HashSize == node.bounds.width + node.bounds.height) {
        this.LEVELS[node._HashIndex].insert(node);
        return;
    }

    var index = this.SQRT[(node.bounds.width + node.bounds.height) >> this.MIN]
    if (index >= this.LVL) index = this.LVL - 1;

    node._HashIndex = index;
    node._HashSize = node.bounds.width + node.bounds.height;
    this.LEVELS[index].insert(node);
    //for (var i = 0; i < len; ++i) {
    //   if (this.LEVELS[len - i - 1].insert(node)) break;
    //}
}


HashBounds.prototype.delete = function (node) {
    if (!node.hash) throw "ERR: Node is not in a hash!"
    this.LEVELS[node.hash.level].delete(node)
    node.hash = null;
}
HashBounds.prototype.toArray = function (bounds) {
  this.BASE.toArray(bounds)
}
HashBounds.prototype.every = function (bounds, call) {
   return this.BASE.every(bounds,call)
}
HashBounds.prototype.forEach = function (bounds, call) {
 this.BASE.forEach(bounds,call)
}
