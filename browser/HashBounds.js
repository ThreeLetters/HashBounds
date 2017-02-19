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
function Root() {
   this.NODE = -1;
 }
  Root.prototype.delete = function() {
    
  }
  Root.prototype.forEach = function() {
    
  }
  Root.prototype.every = function() {
    return true;
  }
  


function Node(parent,node) {
   this.PARENT = parent;
   this.NODE = node;
 }
  
  Node.prototype.delete = function(node) {
    if (this.PARENT.NODE == node)
      this.PARENT = this.PARENT.PARENT;
    else 
      this.PARENT.delete(node);
      
      
  }
  Node.prototype.forEach = function(call) {
    call(this.NODE)
    this.PARENT.forEach(call)
  }
  Node.prototype.every = function(call) {
     if (!call(this.NODE)) return false;
    return this.PARENT.forEach(call);
  }
  
  


function LinkedList() {
    this.LIST = new Root()
  }
  LinkedList.prototype.insert = function(node) {
    this.LIST = new Node(this.LIST,node);
  }
  LinkedList.prototype.delete = function(node) {
     if (this.LIST.NODE == node)
      this.LIST = this.LIST.PARENT;
    else 
      this.LIST.delete(node);
      
  }
  LinkedList.prototype.forEach = function(call) {
    this.LIST.forEach(call)
  }
  LinkedList.prototype.every = function(call) {
    return this.LIST.every(call)
  }
function Holder(parent, x, y, power, lvl) {
    this.PARENT = parent;
    this.PARENT.CHILDREN.push(this)
    this.MAP = new Map();
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
Holder.prototype.checkIntersect = function (r1, r2) {
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
Holder.prototype.insert = function (node) {

    this.MAP.insert(node)
    this.add()
}
Holder.prototype.add = function () {
    ++this.LEN;
        this.PARENT.add();
}
Holder.prototype.sub = function () {
    --this.LEN;
        this.PARENT.sub();
}
Holder.prototype.delete = function (node) {
    this.MAP.delete(node)
    this.sub()
}
Holder.prototype._get = function (bounds, call) {
    if (!this.LEN) return true;
    if (!this.MAP.every(call)) return false;
    if (this.CHILDREN[0]) {
        for (var i = 0; i < 4; ++i) {
            if (this.checkIntersect(bounds, this.CHILDREN[i].BOUNDS)) {
                if (!this.CHILDREN[i]._get(bounds, call)) return false;
            }
        }

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


           if (this.PREV) var l = this.PREV.DATA[this._getKey(bx, by)]; else
                  var l = {CHILDREN: [],add: function() {},sub: function() {}}
            this.DATA[key] = new Holder(l, j, i, this.POWER, this.LVL);

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
    var x1 = node.bounds.x,
        y1 = node.bounds.y,
        x2 = node.bounds.x + node.bounds.width,
        y2 = node.bounds.y + node.bounds.height;

    var k1 = this.getKey(x1, y1)
    var k2 = this.getKey(x2, y2)
    node.hash.k1 = k1
    node.hash.k2 = k2
    node.hash.level = this.LEVEL
    for (var j = k1.x; j <= k2.x; ++j) {
        var x = j << 16;
        for (var i = k1.y; i <= k2.y; ++i) {

            var ke = this._getKey(x, i);
            // console.log(ke)
            this.DATA[ke].insert(node)
        }

    }
    return true;
}
Grid.prototype.delete = function (node) {
    var k1 = node.hash.k1
    var k2 = node.hash.k2
    var lenX = k2.x + 1,
        lenY = k2.y + 1;
    for (var j = k1.x; j < lenX; ++j) {
        var x = j << 16;
        for (var i = k1.y; i < lenY; ++i) {


            var ke = this._getKey(x, i);

            this.DATA[ke].delete(node)
        }

    }
}
Grid.prototype.toArray = function (array, bounds) {

    var hsh = {};

    this._get(bounds, function (cell) {

        cell._get(bounds, function (obj, i) {
            if (hsh[obj._HashID]) return true;
            hsh[obj._HashID] = true;
            array.push(obj);
            return true;
        })
        return true;
    })
}
Grid.prototype.every = function (bounds, call) {

    var hsh = {};

    this._get(bounds, function (cell) {

        return cell._get(bounds, function (obj, i) {
            if (hsh[obj._HashID]) return true;
            hsh[obj._HashID] = true;
            return call(obj);

        })
    })
}
Grid.prototype.forEach = function (bounds, call) {


    var hsh = {};

    this._get(bounds, function (cell) {

        cell._get(bounds, function (obj, i) {
            if (hsh[obj._HashID]) return true;
            hsh[obj._HashID] = true;
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

var last = false;
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
    return this.BASE.every(bounds, call)
}
HashBounds.prototype.forEach = function (bounds, call) {
    this.BASE.forEach(bounds, call)
}
