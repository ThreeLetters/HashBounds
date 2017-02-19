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

class Root {
 constructor() {
   this.NODE = -1;
 }
  delete() {
    
  }
  forEach() {
    
  }
  every() {
    return true;
  }
  
}

class Node {
 constructor(parent,node) {
   this.PARENT = parent;
   this.NODE = node;
 }
  
  delete(node) {
    if (this.PARENT.NODE == node)
      this.PARENT = this.PARENT.PARENT;
    else 
      this.PARENT.delete(node);
      
      
  }
  forEach(call) {
    call(this.NODE)
    this.PARENT.forEach(call)
  }
  every(call) {
     if (!call(this.NODE)) return false;
    return this.PARENT.forEach(call);
  }
  
  
}

module.exports = class LinkedList {
  constructor() {
    this.LIST = new Root()
  }
  insert(node) {
    this.LIST = new Node(this.LIST,node);
  }
  delete(node) {
     if (this.LIST.NODE == node)
      this.LIST = this.LIST.PARENT;
    else 
      this.LIST.delete(node);
      
  }
  forEach(call) {
    this.LIST.forEach(call)
  }
  every(call) {
    return this.LIST.every(call)
  }
  
  
}
