/* js/core/scene.js — Renderer, scene, camera, room size constants and the small modelling helpers (mat, box, cyl, plane, tex, led, module) the other files use.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Scene ---------- */
const stage = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const lab = new THREE.Group(); scene.add(lab);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
// room footprint: walls along x = -4.2 and z = -4.2, open (cut-away) sides at +5.4
const ROOM0 = -4.2, ROOM1 = 5.4, ROOMSZ = ROOM1 - ROOM0, ROOMMID = (ROOM0 + ROOM1) / 2;
const DOOR = { x: 4.6, w: 1.0, h: 2.2 };                 // exit door in the back wall, past the robot dock
const HOME = new THREE.Vector3(13.1, 10.5, 13.1);
const TARGET = new THREE.Vector3(0.3, 1.6, 0.3);
camera.position.copy(HOME);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minAzimuthAngle = 0.12;
controls.maxAzimuthAngle = Math.PI / 2 - 0.12;
controls.minPolarAngle = 0.45;
controls.maxPolarAngle = 1.3;
controls.minDistance = 8;
controls.maxDistance = 28;

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
