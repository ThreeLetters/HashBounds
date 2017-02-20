"use strict"
/*
No license here!

*/

class Root {
 constructor() {
   
 }
  forEach() {
    
  }
  every() {
   return true; 
  }
  
}

class ListNode {
 constructor(child,parent,node,id) {
   this.CHILD = child;
   this.NODE = node;
   this.ID = id;
   this.PARENT = parent;
 }
 destroy() {
  this.PARENT.CHILD = this.CHILD;
   this.CHILD.PARENT = PARENT;
 }
  forEach(call) {
    call(this.NODE,this.ID);
    this.CHILD.forEach(call);
    
  }
  every(call) {
    if (!call(this.NODE,this.ID)) return false;
    return this.CHILD.forEach(call);
  }
  
}
module.exports = class QuickMapV2 {
 constructor() {
   this.CHILD = new Root()
   this.ARRAY = [];
 }
  set(id,node) {
    var n = new ListNode(this.CHILD,this,node,id)
    this.CHILD.PARENT = n;
    this.CHILD = n;
    this.ARRAY[id] = n;
    return n;
  }
  delete(id) {
    this.ARRAY[id].destroy();
   this.ARRAY[id] = null;
  }
  get(id) {
     return this.ARRAY[id].NODE;
  }
  forEach(call) {
    this.CHILD.forEach(call)
  }
  every(call) {
    return this.CHILD.every(call)
  }

}
