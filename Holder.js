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
var LinkedList = require('./LinkedList.js')
module.exports = class Holder {
    constructor(parent, x, y, power, lvl) {
        this.PARENT = parent;
         this.PARENT.CHILDREN.push(this)
        this.MAP = new LinkedList();
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

    insert(node) {

        this.MAP.insert(node)
        this.add()
    }
    add() {
        ++this.LEN;
            this.PARENT.add();

        
    }

    every(bounds, call) {
        if (!this.LEN) return true;
        if (!this.MAP.every(call)) return false;
        if (this.CHILDREN[0]) {
            for (var i = 0; i < 4; ++i) {
                if (this.checkIntersect(bounds, this.CHILDREN[i].BOUNDS)) {
                    if (!this.CHILDREN[i].every(bounds, call)) return false;
                }
            }

        }
        return true;
    }
         forEach(bounds, call) {
        if (!this.LEN) return;
           this.MAP.forEach(call)
        if (this.CHILDREN[0]) {
            for (var i = 0; i < 4; ++i) {
                if (this.checkIntersect(bounds, this.CHILDREN[i].BOUNDS)) {
                    this.CHILDREN[i].forEach(bounds, call)
                }
            }

        }
        return;
    }
    sub() {
        --this.LEN;
            this.PARENT.sub();
    }
    delete(node) {
        this.MAP.delete(node)
        this.sub()
    }
   

}
