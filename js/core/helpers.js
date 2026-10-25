/* js/core/helpers.js — The building blocks every model is made from: colours, materials, box / cyl / plane, drawn textures,
   status LEDs, instrument modules, LCD screens, merged vertex-coloured parts, and the NCA's LC module and solvent bottle.
   Shared by the site and the offline instrument viewer (instruments/), so an instrument looks the same in both.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Levels ---------- */
const BY = -3.6;                                         // basement floor level (top of the slab)

/* ---------- Colours, materials and shapes ---------- */
const C = {
  tileA: 0x8f9ca5, tileB: 0x9ba7af, wallA: 0xbccbc4, wallB: 0xdbe1dd, trim: 0x46525a,
  cab: 0x6f8ea5, hood: 0xdfe4e6, hoodIn: 0xb7c3c9, cabLine: 0x4f6b80, splash: 0x8fb9b7, epoxy: 0x24292d, metal: 0x3a4248, steel: 0xb7c0c5,
  inst: 0xf3f4f2, bezel: 0x2b3136, line: 0x0068b7, inst2: 0xe4e7e6,
  amber: 0x9a5a1c, yellow: 0xf2c230, coat: 0xf7f9fa, peek: 0xd8b48a
};

function mat(color, opts) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, metalness: 0.05 }, opts || {})); }
const glass = new THREE.MeshStandardMaterial({ color: 0xdff2ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false });
const smoked = new THREE.MeshStandardMaterial({ color: 0x1c2a36, roughness: 0.1, transparent: true, opacity: 0.75 });
function box(w, h, d, color, x, y, z, parent, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === "object" ? color : mat(color, opts));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  (parent || lab).add(m); return m;
}
function cyl(rt, rb, h, color, x, y, z, parent, seg, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), typeof color === "object" ? color : mat(color, opts));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  (parent || lab).add(m); return m;
}
function plane(w, h, material, x, y, z, ry, parent) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z); if (ry) m.rotation.y = ry; (parent || lab).add(m); return m;
}
function beaker(x, y, z, r, h, liquid, fill, parent) {
  const g = cyl(r, r, h, glass, x, y + h / 2, z, parent, 20); g.castShadow = false;
  if (liquid != null) cyl(r * 0.92, r * 0.92, h * fill, liquid, x, y + (h * fill) / 2 + 0.005, z, parent, 20, { roughness: 0.25, transparent: true, opacity: 0.85 });
}
function flask(x, y, z, r, liquid, parent) {
  const body = cyl(r * 0.3, r, r * 1.5, glass, x, y + r * 0.75, z, parent, 20); body.castShadow = false;
  const neck = cyl(r * 0.28, r * 0.28, r * 0.9, glass, x, y + r * 1.95, z, parent, 14); neck.castShadow = false;
  if (liquid != null) cyl(r * 0.62, r * 0.92, r * 0.6, liquid, x, y + r * 0.31, z, parent, 20, { roughness: 0.25, transparent: true, opacity: 0.85 });
}
function bottle(x, y, z, r, h, color, cap, parent) {
  cyl(r, r, h, color, x, y + h / 2, z, parent, 14, { roughness: 0.35 });
  cyl(r * 0.55, r * 0.55, h * 0.18, cap, x, y + h + h * 0.09, z, parent, 12);
}
function tex(draw, w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
const leds = [];
function led(x, y, z, color, parent) {
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color }));
  l.position.set(x, y, z); (parent || lab).add(l); leds.push(l); return l;
}
// An instrument module: off-white body, charcoal bezel, blue accent line.
// face: "z" (front toward +z) or "x" (front toward +x)
function module(face, cx, y, cz, w, h, d, parent, opt) {
  opt = opt || {};
  box(face === "z" ? w : d, h - 0.012, face === "z" ? d : w, C.inst, cx, y + h / 2, cz, parent);
  const fx = face === "x" ? cx + d / 2 + 0.006 : cx, fz = face === "z" ? cz + d / 2 + 0.006 : cz;
  const bw = w * 0.84;
  const bez = opt.window ? smoked : C.bezel;
  if (face === "z") {
    box(bw, h * 0.6, 0.014, bez, fx, y + h * 0.54, fz, parent);
    box(bw, 0.016, 0.016, C.line, fx, y + h * 0.17, fz, parent);
    led(fx + bw / 2 - 0.04, y + h * 0.17, fz + 0.012, opt.led || 0x3fd17a, parent);
  } else {
    box(0.014, h * 0.6, bw, bez, fx, y + h * 0.54, fz, parent);
    box(0.016, 0.016, bw, C.line, fx, y + h * 0.17, fz, parent);
    led(fx + 0.012, y + h * 0.17, fz + bw / 2 - 0.04, opt.led || 0x3fd17a, parent);
  }
  return y + h;
}

/* ---------- Tagged groups: each instrument is one (its tag, hover glow and click open it) ---------- */
const hotspots = [];
function hotGroup(key, label, anchor, parent, level) {
  const g = new THREE.Group(); g.userData.key = key; (parent || lab).add(g);
  hotspots.push({ key, label, group: g, anchor: new THREE.Vector3().copy(anchor), level: level || "up" });
  return g;
}

// shrink or grow a group about a point (the HPLC and IC are modelled full size, then scaled to fit their benches)
function scaleAbout(g, s, px, py, pz) { g.scale.setScalar(s); g.position.set(px * (1 - s), py * (1 - s), pz * (1 - s)); }

/* ---------- Canvas screens: draw(...) repaints and uploads; lcdLines is the usual two-line LCD ---------- */
function screenTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const api = { c, t, draw(...a) { draw(c.getContext("2d"), w, h, ...a); t.needsUpdate = true; } }; return api;
}
function lcdLines(g, W, H, lines) {
  g.fillStyle = "#0f1a20"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#8fe6ff"; g.font = "bold 13px monospace"; lines.forEach((l, i) => g.fillText(l, 6, 17 + i * 17));
}

// merge a list of non-indexed-able geometries (position/normal/color) into one
function mergeGeos(list) {
  const parts = list.map(g => (g.index ? g.toNonIndexed() : g)), n = parts.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  parts.forEach(g => {
    const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); o += c;
  });
  const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(pos, 3)); m.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); m.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return m;
}
function paint(geo, fn) { const p = geo.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), col); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo; }
// one coloured box for mergeGeos
function modPart(list, w, h, d, x, y, z, color) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); paint(g, (px, py, pz, c) => c.setHex(color)); list.push(g); }

/* ---------- NCA: bench height and palette, LC modules and solvent bottles ---------- */
const CH = { top: 1.28, wallA: 0xc3ced6, wallB: 0xe1e7ea, accent: 0x2f6fb5, body: 0xe9ecec, front: 0x2b3238, trim: 0x8b979e };
// an LC module: light body, charcoal front (or a smoked window), blue accent line, optional LCD and LED
function lcModule(parent, cx, y, cz, w, h, d, o) {
  o = o || {};
  box(w, h - 0.012, d, o.body || CH.body, cx, y + h / 2, cz, parent);
  const fz = cz + d / 2;
  box(w * 0.96, h - 0.05, 0.012, o.window ? smoked : (o.front || CH.front), cx, y + h / 2, fz + 0.006, parent);
  box(w * 0.96, 0.012, 0.014, C.line, cx, y + 0.032, fz + 0.014, parent);
  let lcd = null;
  if (o.lcd) { lcd = screenTex(120, 40, lcdLines); lcd.draw(o.lcd); plane(0.14, 0.047, new THREE.MeshBasicMaterial({ map: lcd.t }), cx - w / 2 + 0.11, y + h - 0.06, fz + 0.014, 0, parent); }
  led(cx + w / 2 - 0.05, y + h - 0.05, fz + 0.016, o.led || 0x3fd17a, parent);
  return { top: y + h, lcd };
}
const solventLabel = (txt, col) => tex((g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = col; g.fillRect(0, 0, w, 9); g.fillStyle = "#1a2228"; g.font = "bold 14px sans-serif"; g.textAlign = "center"; txt.split("\n").forEach((l, i) => g.fillText(l, w / 2, 26 + i * 15)); }, 96, 56);
function solventBottle(parent, x, y, z, r, h, liquid, label, labelCol, cap) {
  cyl(r, r, h, glass, x, y + h / 2, z, parent, 20).castShadow = false;
  cyl(r * 0.92, r * 0.92, h * 0.78, liquid, x, y + h * 0.39 + 0.004, z, parent, 20, { transparent: true, opacity: 0.5, roughness: 0.1 });
  cyl(r * 0.4, r * 0.45, h * 0.16, cap || 0x2f6fb5, x, y + h + h * 0.08, z, parent, 14, { roughness: 0.4 });
  if (label) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.3, 20, 1, true, -0.7, 1.4), new THREE.MeshStandardMaterial({ map: solventLabel(label, labelCol), roughness: 0.6 })); m.position.set(x, y + h * 0.45, z); parent.add(m); }
  return y + h + h * 0.16;
}
function tubeAlong(parent, pts, r, material, closed) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, !!closed, "centripetal"), Math.max(20, pts.length * 14), r, 6, !!closed), material); m.castShadow = true; parent.add(m); return m;
}
