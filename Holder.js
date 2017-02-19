"use strict"

module.exports = class Holder {
    constructor(parent, x,y,power,lvl) {
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
    checkIntersect(r1,r2) {
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
    
    set(id, node) {

        this.MAP.set(id, node)
        this.add()
    }
    add() {
        ++this.len;

       

        if (this.PARENT) {
            this.PARENT.add();


        }
    }
  
    _get(bounds,call) {
        if (!this._every(call)) return false;
        if (this.CHILDREN) {
            for (var i = 0; i < 4; ++i) {
              if (this.checkIntersect(bounds,this.CHILDREN[i].bounds)) {
                 if (!this.CHILDREN[i]._get(bounds,call)) return false;
              }
            }
           
        }
        return true;
    }
    sub() {
        --this.len;
        if (this.PARENT) {
            this.PARENT.sub();
            
        }
    }
    delete(id) {
        this.MAP.delete(id)
        this.sub()
    }
    _every(c) {
        var a = this.MAP.entries()
        var b;
        while (b = a.next().value) {
            if (!c(b[1], b[0])) return false;
        }
        return true;
    }
    every(bounds,call) {
    var hsh = [];
        return this._get(bounds,function(o,i) {
            if (hsh[i]) return true; else hsh[i] = true;
            return call(o,i)
            
            
        })
    }
    forEach(bounds,call) {
        var hsh = [];
        this._get(bounds,function(o,i) {
            if (hsh[i]) return true; else hsh[i] = true;
            call(o,i)
            
            return true;
        })
    }
    
}
