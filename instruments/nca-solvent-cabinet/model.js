/* instruments/nca-solvent-cabinet/model.js — The yellow flammables cabinet on the left wall, with its vent and solvent bottles.
   Faces +x.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildSolventCabinet (js/chemistry/instruments.js) */
"use strict";

function buildSolventCabinet() {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
  // turns a part to face +x, for the left wall
  const left = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; return g; };
  const gS = hotGroup("solvents", "Solvent cabinet", V3(-3.85, 2.45, -2.75), chem, "chem");
  const sc = left(-3.9, -2.65); gS.add(sc);
  box(0.92, 1.72, 0.56, C.yellow, 0, 0.86, 0, sc, { roughness: 0.5 });
  [-0.225, 0.225].forEach(dx => { box(0.44, 1.6, 0.014, 0xf0c74a, dx, 0.88, 0.287, sc, { roughness: 0.5 }); box(0.02, 0.18, 0.03, 0x6b767c, dx + (dx < 0 ? 0.19 : -0.19), 0.95, 0.305, sc, steelM); });
  const flamTex2 = tex((g, w, h) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, w, h); g.fillStyle = "#c8262b"; g.font = "bold 26px sans-serif"; g.textAlign = "center"; g.fillText("FLAMMABLE", w / 2, 30); g.font = "bold 15px sans-serif"; g.fillText("KEEP FIRE AWAY", w / 2, 52); }, 256, 64);
  plane(0.5, 0.125, new THREE.MeshBasicMaterial({ map: flamTex2 }), 0, 1.5, 0.296, 0, sc);
  [-0.3, 0.3].forEach(dx => cyl(0.04, 0.04, 0.03, 0x6b767c, dx, 1.76, -0.1, sc, 16));
  tubeAlong(sc, [V3(0.3, 1.77, -0.1), V3(0.3, 2.3, -0.2), V3(0.3, 3.0, -0.25)], 0.035, mat(0xb9c3c8, steelM));            // vent duct
  [[-0.3, 0xe9eef0], [-0.1, 0x8a4b1d], [0.12, 0xe9eef0], [0.3, 0x8a4b1d]].forEach(([dx, c]) => { cyl(0.08, 0.08, 0.3, c, dx, 1.87, 0.05, sc, 18, { roughness: 0.3, transparent: c !== 0xe9eef0, opacity: 0.92 }); cyl(0.03, 0.03, 0.05, 0x1f2428, dx, 2.04, 0.05, sc, 12); });
}
