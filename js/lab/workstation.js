/* js/lab/workstation.js — The back bench, its stool, the shelf of reagent bottles above it and the bench light.
   The monitor and the balance on it are instruments: instruments/lab-projects-pc and instruments/lab-balance.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// Back bench + workstation (build)
const gWork = lab;
box(4.2, 1.2, 0.95, C.cab, 0.3, 0.62, -3.75, gWork);
for (let x = -1.45; x < 2.4; x += 0.7) box(0.02, 1.0, 0.01, C.cabLine, x, 0.65, -3.27, gWork);
box(4.3, 0.08, 1.1, C.epoxy, 0.3, 1.27, -3.72, gWork);
const specTex = tex((g, w, h) => {
  g.fillStyle = "#0e151b"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#24323c"; g.lineWidth = 1;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, i * h / 6); g.lineTo(w, i * h / 6); g.stroke(); }
  g.strokeStyle = "#6aa6f0"; g.lineWidth = 2; g.beginPath();
  for (let x = 0; x <= w; x++) {
    const t = x / w;
    const y = 0.02 + 0.8 * Math.exp(-Math.pow((t - 0.28) / 0.012, 2)) + 0.45 * Math.exp(-Math.pow((t - 0.47) / 0.015, 2)) + 0.95 * Math.exp(-Math.pow((t - 0.63) / 0.01, 2)) + 0.3 * Math.exp(-Math.pow((t - 0.78) / 0.02, 2));
    const py = h - 22 - y * (h - 50);
    x ? g.lineTo(x, py) : g.moveTo(x, py);
  }
  g.stroke();
  g.fillStyle = "#3fd17a"; g.font = "12px monospace"; g.fillText("UV 254 nm  ·  RUN 014", 10, 16);
  g.fillStyle = "#97a9b4"; g.fillText("min", w - 30, h - 6);
}, 320, 190);
// lab stool at the workstation
cyl(0.2, 0.2, 0.07, 0x2a2f33, 1.3, 0.9, -2.75);
cyl(0.028, 0.028, 0.85, C.steel, 1.3, 0.45, -2.75, null, 8, { metalness: 0.6 });
cyl(0.24, 0.24, 0.03, C.steel, 1.3, 0.03, -2.75, null, 5, { metalness: 0.6 });
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 24), mat(C.steel, { metalness: 0.6 })); ring.rotation.x = Math.PI / 2; ring.position.set(1.3, 0.4, -2.75); lab.add(ring);
box(0.3, 0.36, 0.2, C.metal, 2.28, 1.49, -3.9, gWork);
[0, 1, 2].forEach(i => cyl(0.025, 0.012, 0.42, i === 1 ? C.line : 0xe8eef1, 2.18 + i * 0.1, 1.85, -3.85, gWork, 8));
box(2.2, 0.06, 0.42, C.cab, 1.3, 2.95, -3.98, gWork);
[0.3, 1.3, 2.3].forEach(x => box(0.04, 0.3, 0.36, C.steel, x, 2.79, -4.0, gWork));
plane(2.0, 0.06, new THREE.MeshBasicMaterial({ color: 0xf4fbff }), 1.3, 2.9, -3.8, 0, gWork).rotation.x = Math.PI / 2;
[[0.4, 0x8fd0ff], [0.62, 0xe8eef1], [0.84, C.amber], [1.06, 0xffd9a0]].forEach((b, i) => bottle(b[0], 2.98, -3.98, 0.08, 0.3 + (i % 2) * 0.06, b[1], i % 2 ? C.line : 0xd23c3c, gWork));
[1.62, 1.8, 1.98].forEach((x, i) => box(0.12, 0.42, 0.32, [C.line, C.yellow, 0x51616c][i], x, 3.19, -3.98, gWork));
const benchLight = new THREE.PointLight(0xf4fbff, 0.6, 3.5, 2); benchLight.position.set(1.3, 2.7, -3.6); scene.add(benchLight);
