/* js/lab/island.js — The island bench with its glassware, reagent shelf and stools. The TOC analyzer on it is an instrument:
   instruments/lab-toc.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// Island bench: glassware on the left, the TOC analyzer (instruments/lab-toc) on the right
const ISL = { x: 1.4, z: 1.3, top: 1.26 };
box(2.6, 1.15, 1.1, C.cab, ISL.x, 0.6, ISL.z);
for (let x = ISL.x - 0.65; x < ISL.x + 1.3; x += 0.65) box(0.01, 0.95, 1.12, C.cabLine, x, 0.6, ISL.z);
box(2.7, 0.08, 1.2, C.epoxy, ISL.x, 1.22, ISL.z);
box(0.95, 0.04, 0.2, C.steel, ISL.x - 0.7, 1.75, ISL.z - 0.3, null, { metalness: 0.5 });
[-1.15, -0.25].forEach(o => cyl(0.025, 0.025, 0.5, C.steel, ISL.x + o, 1.5, ISL.z - 0.3, null, 8));
[0x9ad8ff, C.amber, 0xffd9a0].forEach((c, i) => bottle(ISL.x - 1.0 + i * 0.3, 1.77, ISL.z - 0.3, 0.06, 0.24, c, i % 2 ? 0x111111 : C.line));
beaker(ISL.x - 1.0, ISL.top, ISL.z + 0.2, 0.13, 0.28, 0x6fd3a0, 0.55);
beaker(ISL.x - 0.7, ISL.top, ISL.z + 0.3, 0.09, 0.2, 0xb59cff, 0.6);
flask(ISL.x - 0.44, ISL.top, ISL.z + 0.22, 0.15, 0xff9a7a);

[[ISL.x - 0.6, ISL.z + 1.05], [ISL.x + 0.6, ISL.z + 1.05]].forEach(p => {
  cyl(0.24, 0.24, 0.08, 0x2a2f33, p[0], 0.9, p[1]);
  cyl(0.03, 0.03, 0.85, C.steel, p[0], 0.45, p[1], null, 8, { metalness: 0.6 });
  cyl(0.25, 0.25, 0.03, C.steel, p[0], 0.03, p[1], null, 5, { metalness: 0.6 });
});
