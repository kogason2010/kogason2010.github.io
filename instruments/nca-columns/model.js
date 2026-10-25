/* instruments/nca-columns/model.js — Column storage on the left wall: labelled drawers with boxed columns on top.
   Faces +x.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildColumnStorage (js/chemistry/instruments.js) */
"use strict";

function buildColumnStorage() {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
  // turns a part to face +x, for the left wall
  const left = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; return g; };
  const gCo = hotGroup("columns", "Columns", V3(-3.85, 1.4, -1.3), chem, "chem");
  const cc = left(-3.97, -1.45); gCo.add(cc);
  box(0.9, 1.1, 0.42, 0xdfe4e6, 0, 0.55, 0, cc, { roughness: 0.5 });
  const drawerTex = tex((g, w, h) => { g.fillStyle = "#cfd6d9"; g.fillRect(0, 0, w, h); g.fillStyle = "#1a2228"; g.font = "bold 13px monospace"; g.fillText(["C18 · 1.9 µm", "C18 · 2.7 µm SPP", "C8 · 3 µm", "PHENYL-HEXYL", "HILIC", "CHIRAL", "GUARD COLS"][Math.floor(Math.random() * 7)], 8, 20); }, 160, 32);
  for (let r = 0; r < 6; r++) for (let c2 = 0; c2 < 2; c2++) {
    const y = 0.12 + r * 0.17, x = -0.22 + c2 * 0.44;
    box(0.41, 0.15, 0.012, 0xc5cdd1, x, y + 0.07, 0.215, cc, { roughness: 0.45 }); box(0.12, 0.016, 0.02, 0x6b767c, x, y + 0.11, 0.228, cc, steelM);
    if (r % 2 === 0) plane(0.2, 0.04, new THREE.MeshBasicMaterial({ map: drawerTex }), x - 0.06, y + 0.06, 0.223, 0, cc);
  }
  // columns and boxes on top
  [[-0.3, 0x2f6fb5], [-0.12, 0xd23c3c], [0.06, 0x3fae6a]].forEach(([dx, c]) => box(0.16, 0.06, 0.32, c, dx, 1.13, 0, cc, { roughness: 0.55 }));
  [-0.05, 0.05].forEach((dz, i) => { const col = cyl(0.012, 0.012, 0.16, C.steel, 0.25, 1.115, dz, cc, 12, steelM); col.rotation.x = Math.PI / 2; cyl(0.018, 0.018, 0.03, i ? 0x2f6fb5 : 0xd23c3c, 0.25, 1.115, dz + 0.09, cc, 12).rotation.x = Math.PI / 2; });
}
