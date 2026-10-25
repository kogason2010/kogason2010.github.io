/* instruments/lab-about-cabinet/model.js — Glass-fronted reagent cabinet on the left wall (the About tag).
   Faces +x.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room. */
"use strict";

// Reagent cabinet (about)
const gCab = hotGroup("about", "About", new THREE.Vector3(-3.85, 3.35, -2.0));
const CX = -3.9, CZ = -2.0;
box(0.55, 2.7, 0.06, C.cab, CX, 1.35, CZ - 0.8, gCab);
box(0.55, 2.7, 0.06, C.cab, CX, 1.35, CZ + 0.8, gCab);
box(0.04, 2.7, 1.6, 0xdfe5e8, CX - 0.26, 1.35, CZ, gCab);
box(0.55, 0.06, 1.66, C.cab, CX, 2.72, CZ, gCab);
box(0.55, 0.8, 1.6, C.cab, CX, 0.4, CZ, gCab);
box(0.02, 0.6, 0.74, 0xdfe5e8, CX + 0.28, 0.4, CZ - 0.4, gCab); box(0.02, 0.6, 0.74, 0xdfe5e8, CX + 0.28, 0.4, CZ + 0.4, gCab);
const corr = tex((g, w, h) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, w, h); g.fillStyle = "#1a242a"; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText("CORROSIVES", w / 2, h * 0.62); }, 128, 32);
plane(0.6, 0.15, new THREE.MeshBasicMaterial({ map: corr }), CX + 0.3, 0.6, CZ, Math.PI / 2, gCab);
[1.4, 2.05].forEach(y => box(0.5, 0.04, 1.56, C.cab, CX, y, CZ, gCab));
const bcols = [C.amber, 0xe8eef1, 0x8fd0ff, C.amber, 0xffd9a0, 0xe8eef1];
for (let s = 0; s < 3; s++) {
  const y = [0.82, 1.42, 2.07][s];
  if (s === 0) { for (let i = 0; i < 6; i++) box(0.36, 0.5, 0.1, [C.line, 0x51616c, C.yellow][i % 3], CX - 0.02, y + 0.27, CZ - 0.6 + i * 0.13, gCab); continue; }
  for (let i = 0; i < 6; i++) bottle(CX, y, CZ - 0.6 + i * 0.24, 0.07, 0.3 + ((i * 7 + s) % 3) * 0.05, bcols[(i + s) % 6], i % 2 ? 0x111111 : C.line, gCab);
}
box(0.02, 1.85, 0.78, glass, CX + 0.28, 1.78, CZ - 0.39, gCab).castShadow = false;
box(0.02, 1.85, 0.78, glass, CX + 0.28, 1.78, CZ + 0.39, gCab).castShadow = false;
box(0.04, 0.3, 0.04, C.steel, CX + 0.31, 1.78, CZ - 0.06, gCab); box(0.04, 0.3, 0.04, C.steel, CX + 0.31, 1.78, CZ + 0.06, gCab);
