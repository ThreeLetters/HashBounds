"use strict"

module.exports = class Holder {
  constructor(parent) {
    this.parent = parent;
    this.map = new Map();
    this.len = 0;
    this.children = [];
  }
  set(id,node) {
    
    this.map.set(id,node)
      this.add()
  }
  add() {
    ++this.len;
    if (this.parent) this.parent.add();
  }
  sub() {
    --this.len;
    if (this.parent) this.parent.sub();
  }
  delete(id) {
   this.map.delete(id) 
    this.sub()
  }
  every(c) {
        var a = this.map.entries()
        var b;
        while (b = a.next().value) {
            if (!c(b[1], b[0])) return false;
        }
        return true;
    }
  forEach(c) {
    return this.map.forEach(c);
  }
}

