/* instruments/nca-hplc-modules/model.js — The HPLC modules the assembly robots stack.
   Autosampler, detector, two pumps, system controller, solvent tray and column oven: each one merged, vertex-coloured mesh
   plus its screen or glass. js/chemistry/assembly.js puts them on the line.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     MOD_KINDS, makeModule, modTextures (js/chemistry/assembly.js) */
"use strict";

/* ---------- the HPLC modules: each is one merged, vertex-coloured mesh (plus a screen or glass where needed) ---------- */
const MOD = {
  body: 0x3a3e43, panel: 0x62676d, dark: 0x1f2226, edge: 0x2c3035, led: 0x9ff0d6, steel: 0xb9c0c4,
  W: 0.42, D: 0.5,
};
const MOD_KINDS = {
  sampler: { h: 0.4, name: "Autosampler" }, detector: { h: 0.18, name: "Detector" }, pumpA: { h: 0.18, name: "Pump A" }, pumpB: { h: 0.18, name: "Pump B" },
  controller: { h: 0.26, name: "System controller" }, tray: { h: 0.11, name: "Solvent tray" }, oven: { h: 0.82, name: "Column oven", w: 0.22 },
};
const STACK = ["sampler", "detector", "pumpA", "pumpB", "controller", "tray"];   // bottom to top
const modMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.15 });
const ledMat = new THREE.MeshBasicMaterial({ color: MOD.led, toneMapped: false });
let modScreenTex = null, ovenScreenTex = null;
function makeModule(kind) {
  const k = MOD_KINDS[kind], W = k.w || MOD.W, D = MOD.D, H = k.h, F = D / 2, g = new THREE.Group(), parts = [];
  g.userData.kind = kind; g.userData.h = H;
  if (kind === "tray") {
    modPart(parts, W, 0.05, D, 0, 0.025, 0, MOD.body);
    // the steel rail round the top, which the gripper takes hold of
    [[W - 0.04, 0.02, 0.02, 0, 0.1, F - 0.03], [W - 0.04, 0.02, 0.02, 0, 0.1, -F + 0.03], [0.02, 0.02, D - 0.04, W / 2 - 0.03, 0.1, 0], [0.02, 0.02, D - 0.04, -W / 2 + 0.03, 0.1, 0]].forEach(r => modPart(parts, ...r, MOD.steel));
    [[-W / 2 + 0.03, F - 0.03], [W / 2 - 0.03, F - 0.03], [-W / 2 + 0.03, -F + 0.03], [W / 2 - 0.03, -F + 0.03]].forEach(([x, z]) => modPart(parts, 0.02, 0.06, 0.02, x, 0.075, z, MOD.steel));
    modPart(parts, 0.02, 0.02, D - 0.06, 0, 0.11, 0, MOD.steel);                       // a handle bar across the middle
    const m = new THREE.Mesh(mergeGeos(parts), modMat); m.castShadow = true; g.add(m);
    [-0.1, 0.1].forEach(x => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 18), glass); b.position.set(x, 0.18, 0.02); g.add(b);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.17, 18), new THREE.MeshStandardMaterial({ color: x < 0 ? 0xdcecf8 : 0xf1e6f6, transparent: true, opacity: 0.55, roughness: 0.1 })); l.position.set(x, 0.135, 0.02); g.add(l);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.04, 14), new THREE.MeshStandardMaterial({ color: 0xd9dcdd, roughness: 0.5 })); c.position.set(x, 0.33, 0.02); g.add(c);
    });
    return g;
  }
  modPart(parts, W, H - 0.008, D, 0, H / 2, 0, MOD.body);
  modPart(parts, W, 0.008, D, 0, H - 0.004, 0, MOD.edge);                               // a dark seam between stacked modules
  if (kind === "sampler") {
    modPart(parts, W * 0.9, H * 0.42, 0.012, 0, H * 0.7, F + 0.006, MOD.panel); modPart(parts, W * 0.9, H * 0.36, 0.012, 0, H * 0.27, F + 0.006, MOD.panel);
    modPart(parts, W * 0.84, 0.012, 0.016, 0, H * 0.53, F + 0.014, MOD.dark); modPart(parts, W * 0.84, 0.03, 0.016, 0, 0.04, F + 0.014, MOD.dark);
  } else if (kind === "controller") {
    modPart(parts, W * 0.94, H * 0.8, 0.01, 0, H * 0.52, F + 0.005, MOD.dark);
  } else if (kind === "oven") {
    modPart(parts, W * 0.86, H * 0.5, 0.012, 0, H * 0.3, F + 0.006, MOD.panel); modPart(parts, W * 0.8, H * 0.3, 0.01, 0, H * 0.75, F + 0.005, MOD.dark);
    modPart(parts, 0.04, 0.04, 0.012, 0, H * 0.18, F + 0.014, MOD.dark);
  } else {
    // pumps and detector: a slim control strip on the left, a panel door, a dark bar near the bottom
    modPart(parts, W * 0.22, H * 0.86, 0.012, -W * 0.37, H / 2, F + 0.006, MOD.dark);
    modPart(parts, W * 0.7, H * 0.82, 0.012, W * 0.12, H / 2, F + 0.006, MOD.panel);
    modPart(parts, W * 0.62, 0.008, 0.016, W * 0.12, H * 0.16, F + 0.014, MOD.dark);
    modPart(parts, 0.012, 0.012, 0.016, -W * 0.37, H * 0.35, F + 0.014, 0xe9eef0);
    if (kind === "detector") modPart(parts, W * 0.62, 0.03, 0.016, W * 0.12, H * 0.32, F + 0.014, MOD.dark);
  }
  const m = new THREE.Mesh(mergeGeos(parts), modMat); m.castShadow = true; m.receiveShadow = true; g.add(m);
  // little mint status strips, and screens on the controller and the oven
  if (kind === "pumpA" || kind === "pumpB" || kind === "detector") { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.012, H * 0.4), ledMat); l.position.set(-W * 0.37, H * 0.62, F + 0.013); g.add(l); }
  if (kind === "controller") { const s = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, H * 0.66), new THREE.MeshBasicMaterial({ map: modScreenTex, toneMapped: false })); s.position.set(0, H * 0.53, F + 0.012); g.add(s); g.userData.screen = s; }
  if (kind === "oven") { const s = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.74, H * 0.24), new THREE.MeshBasicMaterial({ map: ovenScreenTex, toneMapped: false })); s.position.set(0, H * 0.75, F + 0.011); g.add(s); }
  return g;
}
function modTextures() {
  modScreenTex = tex((c, w, h) => {
    c.fillStyle = "#0e1a24"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8f2f8"; c.font = "bold 15px sans-serif"; c.fillText("Nexera", 10, 20);
    c.fillStyle = "#3fd17a"; c.beginPath(); c.arc(w - 50, 15, 3, 0, 7); c.fill(); c.font = "10px sans-serif"; c.fillText("READY", w - 42, 19);
    [["PRESSURE", "32.4"], ["FLOW", "0.40"], ["OVEN", "40.0"]].forEach(([k, v], i) => { const x = 8 + i * (w - 16) / 3; c.fillStyle = "#1b2a36"; c.fillRect(x, 28, (w - 16) / 3 - 6, 36); c.fillStyle = "#9fb3c2"; c.font = "8px sans-serif"; c.fillText(k, x + 4, 38); c.fillStyle = "#fff"; c.font = "bold 15px sans-serif"; c.fillText(v, x + 4, 58); });
    c.strokeStyle = "#4fa3e8"; c.lineWidth = 2; c.beginPath(); for (let x = 10; x < w - 10; x++) { const u = (x - 10) / (w - 20), y = h - 18 - 34 * Math.exp(-Math.pow((u - 0.42) / 0.03, 2)) - 18 * Math.exp(-Math.pow((u - 0.7) / 0.035, 2)); x === 10 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  }, 256, 128);
  ovenScreenTex = tex((c, w, h) => { c.fillStyle = "#0e1a24"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8f2f8"; c.font = "bold 12px sans-serif"; c.fillText("COLUMN OVEN", 8, 16); c.font = "bold 26px sans-serif"; c.fillText("40.0", 8, 48); c.fillStyle = "#3fd17a"; c.font = "10px sans-serif"; c.fillText("READY", w - 50, 48); }, 128, 64);
}
