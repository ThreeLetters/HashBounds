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

var Grid = require('./Grid.js')
/*
Map.prototype.every = function (c) {
    var a = this.entries()
    var b;
    while (b = a.next().value) {
        if (!c(b[1], b[0])) return true;
    }
  return false;
}
Map.prototype.toArray = function () {
    var array = [];
    this.forEach(function (a) {
        array.push(a)
    })
    return array
}
Map.prototype.map = function(c) {
  var f = new Map();
 var a = this.entries()
    var b;
    while (b = a.next().value) {
        f.set(b[0],c(b[1], b[0])) 
    }
  return f;
  
}
Map.prototype.filter = function(c) {
  var f = new Map();
 var a = this.entries()
    var b;
    while (b = a.next().value) {
        if (c(b[1], b[0])) f.set(b[0],b[1])
    }
  return f;
  
}
*/
module.exports = class HashBounds {
    constructor(power, lvl, max) {
        this.INITIAL = power;
        this.LVL = lvl;
        this.MAX = max;
        this.MIN = power - lvl;
        this.LEVELS = []
        this.lastid = 0;
        this.createLevels()

    }
    createLevels() {
        this.LEVELS = [];
        var a = this.INITIAL;
        for (var i = 0; i < this.LVL; i++) {
            
            this.LEVELS.push(new Grid(a++,i,this.MAX >> 0))
        }
    }
       clear() {
        this.createLevels();      
       }
       update(node) {
        this.delete(node)
              this.insert(node)
       }
    insert(node) {
        if (node.hash) throw "ERR: A node cannot be already in a hash!"
        var bounds = node.bounds;
        node.hash = {}
          if (!node._HashID) node._HashID = ++this.lastid;
       if (node._HashSize == node.bounds.width + node.bounds.height) {
                   this.LEVELS[node._HashIndex].insert(node);
              return;
       }
        var len = this.LEVELS.length
       var index = Math.max(len - ((node.bounds.width + node.bounds.height) >> (this.MIN - 2)),0)
       node._HashIndex = index;
           node._HashSize = node.bounds.width + node.bounds.height;
       this.LEVELS[index].insert(node);
        //for (var i = 0; i < len; ++i) {
         //   if (this.LEVELS[len - i - 1].insert(node)) break;
        //}
    }


    delete(node) {
        if (!node.hash) throw "ERR: Node is not in a hash!"
        this.LEVELS[node.hash.level].delete(node)
        node.hash = null;
    }
    toArray(bounds) {
        var array = [];
        for (var i = 0; i < this.LEVELS.length; i++) {
            this.LEVELS[i].toArray(array, bounds)
        }
        return array;
    }
    every(bounds, call) {
        for (var i = 0; i < this.LEVELS.length; i++) {
            if (!this.LEVELS[i].every(bounds, call)) return false;
        }
           return true;
    }
    forEach(bounds, call) {
        for (var i = 0; i < this.LEVELS.length; i++) {
            this.LEVELS[i].forEach(bounds, call)
        }
    }

}
