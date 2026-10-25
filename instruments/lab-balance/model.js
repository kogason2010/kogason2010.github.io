/* instruments/lab-balance/model.js — Analytical balance with its glass draft shield, on the back bench.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room. */
"use strict";

// analytical balance with draft shield
box(0.34, 0.11, 0.44, C.inst, 0.32, 1.365, -3.72, lab);
box(0.2, 0.05, 0.012, C.bezel, 0.32, 1.37, -3.494, lab);
plane(0.14, 0.03, new THREE.MeshBasicMaterial({ color: 0x7fe3ff }), 0.32, 1.37, -3.487, 0, lab);
cyl(0.07, 0.07, 0.01, C.steel, 0.32, 1.43, -3.76, lab, 20, { metalness: 0.7, roughness: 0.25 });
box(0.3, 0.32, 0.32, glass, 0.32, 1.585, -3.78, lab).castShadow = false;
box(0.31, 0.015, 0.33, C.inst, 0.32, 1.75, -3.78, lab);
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => box(0.012, 0.32, 0.012, C.inst, 0.32 + p[0] * 0.15, 1.585, -3.78 + p[1] * 0.16, lab));
