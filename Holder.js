"use strict"

module.exports = class Holder {
    constructor(parent) {
        this.parent = parent;
        if (this.parent) this.parent.children.push(this)
        this.map = new Map();
        this.len = 0;
        this.skip = 2;
        this.id = ~~(Math.random() * 100)
        this.children = []
    }
    set(id, node) {

        this.map.set(id, node)
        this.add()
    }
    add() {
        ++this.len;

        this.skip = 0;

        if (this.parent) {
            this.parent.add();


        }
    }
    toArray() {
        var nodes = [];
        this.map.forEach(function (n) {
            nodes.push(n)
        })
        return nodes
    }
    sub() {
        --this.len;
        if (!this.len) this.skip = 1;

        if (this.parent) {
            this.parent.sub();
            this.skip = this.parent.skip * 2;

        }
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
