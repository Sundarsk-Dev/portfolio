"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
class Events {
  constructor() { this.listeners = {}; }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name) { (this.listeners[name] || []).forEach(fn => fn()); }
}
class Node extends Events {
  constructor() { super(); this.hidden = true; this.dataset = {}; this.attributes = {}; this.animations = []; }
  setAttribute(name, value) { this.attributes[name] = value; }
  decode() { return this.failDecode ? Promise.reject(new Error("Unavailable image")) : Promise.resolve(); }
  animate() {
    let finish, cancel;
    const finished = new Promise((resolve, reject) => { finish = resolve; cancel = reject; });
    const animation = {
      finished, playState: "running", finish,
      pause() { this.playState = "paused"; },
      play() { this.playState = "running"; },
      cancel() { this.playState = "idle"; cancel(new Error("Cancelled")); }
    };
    this.animations.push(animation);
    return animation;
  }
}
function checkNavigation() {
  const navigationSource = fs.readFileSync(path.join(__dirname, "../assets/navigation.js"), "utf8");
  function setupNavigation({ reduced = false, incoming = "", hash = "", history = false, storageDenied = false } = {}) {
    const document = new Events();
    const classes = new Set();
    document.documentElement = { classList: {
      add: value => classes.add(value), remove: value => classes.delete(value)
    } };
    const intro = new Node();
    document.querySelectorAll = () => [intro];
    document.querySelector = () => null;
    const style = { isConnected: false, remove() { this.isConnected = false; } };
    document.createElement = () => style;
    document.head = { append: value => { value.isConnected = true; } };
    const window = Object.assign(new Events(), { onpagereveal: null, clearTimeout() {} });
    const motion = Object.assign(new Events(), { matches: reduced });
    window.matchMedia = () => motion;
    const store = new Map(incoming ? [["portfolio-navigation-input", incoming]] : []);
    const storage = {
      getItem(key) { if (storageDenied) throw new Error("Denied"); return store.get(key); },
      removeItem(key) { if (storageDenied) throw new Error("Denied"); store.delete(key); },
      setItem(key, value) { if (storageDenied) throw new Error("Denied"); store.set(key, value); }
    };
    vm.runInNewContext(navigationSource, {
      document, window, sessionStorage: storage, URL,
      location: { href: "https://portfolio.test/index.html" + hash, origin: "https://portfolio.test", pathname: "/index.html", hash },
      performance: { getEntriesByType: () => [{ type: history ? "back_forward" : "navigate" }] }
    });
    document.emit("DOMContentLoaded");
    return { document, window, motion, classes, intro, style, store };
  }
  const first = setupNavigation();
  assert.equal(first.intro.animations.length, 1);
  assert(first.classes.has("pointer-navigation"));
  first.document.emit("keydown");
  assert(first.classes.has("keyboard-navigation"));
  assert.equal(first.intro.animations[0].playState, "idle");
  first.document.emit("pointerdown");
  assert(first.classes.has("pointer-navigation"));
  first.motion.matches = true;
  first.motion.emit("change");
  for (const options of [{ reduced: true }, { incoming: "pointer" }, { incoming: "keyboard" }, { hash: "#work" }, { history: true }]) {
    const app = setupNavigation(options);
    assert.equal(app.intro.animations.length, 0);
  }
  assert.equal(setupNavigation({ storageDenied: true }).intro.animations.length, 1);
  const keyboard = setupNavigation({ incoming: "keyboard" });
  let skipped = 0;
  const transition = { viewTransition: { ready: Promise.reject(new Error("Skipped native transition")), skipTransition() { skipped++; } } };
  keyboard.window.listeners.pagereveal[0](transition);
  keyboard.window.listeners.pageswap[0](transition);
  assert.equal(skipped, 2);
  const click = (app, overrides = {}) => {
    const anchor = { href: "https://portfolio.test/projects/trace.html", target: "", hasAttribute: () => false };
    const event = { defaultPrevented: false, button: 0, detail: 1, target: { closest: () => anchor }, ...overrides };
    app.document.listeners.click[0](event);
    return event;
  };
  const pointer = setupNavigation();
  assert.equal(click(pointer).defaultPrevented, false, "Navigation must remain native");
  assert.equal(pointer.store.get("portfolio-navigation-input"), "pointer");
  pointer.store.clear();
  click(pointer, { ctrlKey: true });
  assert.equal(pointer.store.size, 0, "Modifier clicks must remain untouched");
  click(pointer, { detail: 0 });
  assert.equal(pointer.store.get("portfolio-navigation-input"), "keyboard");
  console.log("PASS: entrance, keyboard cancellation, native navigation, modifier clicks, reduced motion, history/hash routes, denied storage, keyboard transition skip.");
}

checkNavigation();
console.log("Scope: isolated navigation checks with browser API doubles.");
