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

function HashBounds(power, lvl, max) {
        this.INITIAL = power;
        this.LVL = lvl;
        this.MAX = max;
        this.MIN = power - 1;
        this.LEVELS = []
        this.lastid = 0;
        this.createLevels()
        this.SQRT = [];
        this.setupSQRT()
    }

    HashBounds.prototype.setupSQRT = function() {
        for (var i = 0; i < 255; ++i) {
            this.SQRT.push(Math.floor(Math.sqrt(i)))
        }
    }

    HashBounds.prototype.createLevels = function() {
        this.LEVELS = [];
        var a = this.INITIAL;
        for (var i = 0; i < this.LVL; i++, a++) {

            this.LEVELS.push(new Grid(a, i, this.MAX >> a))
        }
    }
    HashBounds.prototype.clear = function() {
        this.createLevels();
    }
    HashBounds.prototype.update = function(node) {
        this.delete(node)
        this.insert(node)
    }
    HashBounds.prototype.insert = function(node) {
        if (node.hash) throw "ERR: A node cannot be already in a hash!"
        var bounds = node.bounds;
        node.hash = {}
        if (!node._HashID) node._HashID = ++this.lastid;
        if (node._HashSize == node.bounds.width + node.bounds.height) {
            this.LEVELS[node._HashIndex].insert(node);
            return;
        }

        var index = this.SQRT[(node.bounds.width + node.bounds.height) >> this.MIN]
        if (index > this.LVL) index = this.LVL;

        node._HashIndex = index;
        node._HashSize = node.bounds.width + node.bounds.height;
        this.LEVELS[index].insert(node);
        //for (var i = 0; i < len; ++i) {
        //   if (this.LEVELS[len - i - 1].insert(node)) break;
        //}
    }


    HashBounds.prototype.delete = function(node) {
        if (!node.hash) throw "ERR: Node is not in a hash!"
        this.LEVELS[node.hash.level].delete(node)
        node.hash = null;
    }
    HashBounds.prototype.toArray = function(bounds) {
        var array = [];
        for (var i = 0; i < this.LEVELS.length; i++) {
            this.LEVELS[i].toArray(array, bounds)
        }
        return array;
    }
    HashBounds.prototype.every = function(bounds, call) {
        for (var i = 0; i < this.LEVELS.length; i++) {
            if (!this.LEVELS[i].every(bounds, call)) return false;
        }
        return true;
    }
    HashBounds.prototype.forEach = function(bounds, call) {
        for (var i = 0; i < this.LEVELS.length; i++) {
            this.LEVELS[i].forEach(bounds, call)
        }
    }


