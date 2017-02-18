"use strict"

module.exports = class Holder {
  constructor(parent) {
    this.parent = parent;
    this.map = new Map();
    this.children = [];
  }
  set(id,node) {
    this.map.set(id,node)
  }
  delete(id) {
   this.map.delete(id) 
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

