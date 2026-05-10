/**
 * CJS stub for `rettime` (ESM-only package).
 * Provides the minimal Emitter and TypedEvent API needed by MSW v2 in Jest.
 */
"use strict";

class LensList {
  constructor() {
    this._list = [];
    this._lens = new Map();
  }
  get [Symbol.iterator]() {
    return this._list[Symbol.iterator].bind(this._list);
  }
  entries() {
    return this._lens.entries();
  }
  get(key) {
    return this._lens.get(key) || [];
  }
  getAll() {
    return this._list.map(([, value]) => value);
  }
  append(key, value) {
    this._list.push([key, value]);
    if (!this._lens.has(key)) this._lens.set(key, []);
    this._lens.get(key).push(value);
  }
  prepend(key, value) {
    this._list.unshift([key, value]);
    if (!this._lens.has(key)) this._lens.set(key, []);
    this._lens.get(key).unshift(value);
  }
  delete(key, value) {
    if (this._list.length === 0) return false;
    const values = this._lens.get(key);
    if (!values) return false;
    const index = values.indexOf(value);
    if (index === -1) return false;
    values.splice(index, 1);
    const listIndex = this._list.findIndex(
      (item) => item[0] === key && item[1] === value,
    );
    if (listIndex !== -1) this._list.splice(listIndex, 1);
    return true;
  }
  deleteAll(key) {
    if (this._list.length === 0) return;
    this._list = this._list.filter((item) => item[0] !== key);
    this._lens.delete(key);
  }
  get size() {
    return this._list.length;
  }
  clear() {
    this._list.length = 0;
    this._lens.clear();
  }
}

class TypedEvent extends MessageEvent {
  constructor(...args) {
    super(args[0], args[1]);
    this._defaultPrevented = false;
  }
  get defaultPrevented() {
    return this._defaultPrevented;
  }
  preventDefault() {
    super.preventDefault();
    this._defaultPrevented = true;
  }
}

class Emitter {
  constructor() {
    this._listeners = new LensList();
  }
  on(event, listener) {
    this._listeners.append(event, listener);
    return () => this._listeners.delete(event, listener);
  }
  once(event, listener) {
    const off = this.on(event, (...args) => {
      off();
      listener(...args);
    });
    return off;
  }
  emit(event, ...args) {
    const listeners = this._listeners.get(event);
    for (const listener of listeners) {
      listener(...args);
    }
  }
  removeAllListeners(event) {
    if (event != null) {
      this._listeners.deleteAll(event);
    } else {
      this._listeners.clear();
    }
  }
}

module.exports = { Emitter, TypedEvent };
