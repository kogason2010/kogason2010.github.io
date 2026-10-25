/* instruments/nca-prep-lc/model.js — Prep LC on the left-wall bench: pump, big steel column and injection valve, UV detector, fraction collector.
   Faces +x.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildPrepLc (js/chemistry/instruments.js) */
"use strict";

function buildPrepLc() {
  const T = CH.top;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
  const steelLine = mat(C.steel, { metalness: 0.75, roughness: 0.3 });
  // turns a part to face +x, for the left wall
  const left = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; return g; };
  const gP = hotGroup("prep", "Prep LC", V3(-3.7, T + 1.05, 2.4), chem, "chem");
  box(0.78, T - 0.06, 3.4, C.cab, -3.8, (T - 0.06) / 2, 1.7, gP);
  for (let z = 0.0; z < 3.39; z += 0.68) box(0.014, T - 0.28, 0.66, C.cab, -3.403, (T - 0.28) / 2 + 0.1, z + 0.34, gP, { roughness: 0.55 });
  box(0.82, 0.06, 3.44, C.epoxy, -3.8, T - 0.03, 1.7, gP);
  const pb = left(-3.8, 0.45); gP.add(pb);
  const pp = lcModule(pb, 0, T, 0, 0.56, 0.5, 0.6, { lcd: ["PREP 40.0", "mL/min"] });
  solventBottle(pb, -0.14, pp.top, 0.02, 0.1, 0.36, 0xdcecf8, "A\nWATER", "#2f6fb5", 0x2f6fb5); solventBottle(pb, 0.14, pp.top, 0.02, 0.1, 0.36, 0xf1e6f6, "B\nMeOH", "#c23a3a", 0xc23a3a);
  // the prep column: wide steel column on a stand, manual injection valve with a loop
  const pc = left(-3.75, 1.2); gP.add(pc);
  box(0.3, 0.02, 0.3, 0x3a4248, 0, T + 0.01, 0, pc); cyl(0.012, 0.012, 0.95, C.steel, -0.1, T + 0.48, -0.08, pc, 10, steelM);
  const prepCol = cyl(0.05, 0.05, 0.42, C.steel, 0.02, T + 0.5, 0.02, pc, 24, { metalness: 0.75, roughness: 0.25 });
  [0.29, 0.71].forEach(y => cyl(0.06, 0.06, 0.04, 0x8a959b, 0.02, T + y, 0.02, pc, 24, steelM));
  [[0.36], [0.64]].forEach(([y]) => box(0.14, 0.02, 0.03, 0x2a2f33, -0.04, T + y, -0.03, pc));
  const valve = cyl(0.07, 0.07, 0.04, 0x2a2f33, 0, T + 0.83, 0.1, pc, 24); valve.rotation.x = Math.PI / 2; box(0.12, 0.02, 0.02, 0xc23a3a, 0.04, T + 0.85, 0.13, pc);
  tubeAlong(pc, [V3(0.05, T + 0.83, 0.13), V3(0.18, T + 0.9, 0.16), V3(0.16, T + 0.7, 0.18), V3(0.04, T + 0.78, 0.14)], 0.004, steelLine, false);
  const uv = left(-3.8, 1.78); gP.add(uv); lcModule(uv, 0, T, 0, 0.46, 0.26, 0.5, { lcd: ["UV 254nm", "0.21 AU"] });
  // fraction collector: rack of tubes under a moving drop head
  const fcg = left(-3.78, 2.72); gP.add(fcg);
  box(0.96, 0.1, 0.62, CH.body, 0, T + 0.05, 0, fcg); box(0.96, 0.08, 0.012, CH.front, 0, T + 0.06, 0.316, fcg);
  box(0.9, 0.02, 0.54, 0x3a4248, 0, T + 0.11, 0, fcg);
  const tubeCols = [0xffffff, 0xf2c230, 0xf08a24, 0xe0413a, 0x9b7bff, 0x3fa7d6];
  const tubeG = new THREE.CylinderGeometry(0.014, 0.014, 0.13, 10), tubeM = new THREE.InstancedMesh(tubeG, glass, 60), fillM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 10), new THREE.MeshStandardMaterial({ roughness: 0.2, transparent: true, opacity: 0.85 }), 60);
  const m4 = new THREE.Matrix4(), cl = new THREE.Color();
  for (let i = 0; i < 60; i++) {
    const r = Math.floor(i / 10), c2 = i % 10, x = -0.38 + c2 * 0.084, z = -0.22 + r * 0.088;
    m4.makeTranslation(x, T + 0.185, z); tubeM.setMatrixAt(i, m4);
    const lvl = i < 34 ? 0.03 + ((i * 37) % 9) / 100 : 0.001, col = tubeCols[Math.floor(i / 6) % tubeCols.length];
    m4.compose(V3(x, T + 0.125 + lvl / 2, z), new THREE.Quaternion(), V3(1, lvl, 1)); fillM.setMatrixAt(i, m4); fillM.setColorAt(i, cl.setHex(i < 34 ? col : 0xffffff));
  }
  fcg.add(tubeM, fillM);
  [-0.46, 0.46].forEach(dx => box(0.03, 0.44, 0.03, 0x6b767c, dx, T + 0.32, -0.3, fcg));
  box(0.96, 0.04, 0.05, 0x6b767c, 0, T + 0.54, -0.3, fcg);
  const fArm = new THREE.Group(); fArm.position.set(0, T + 0.54, 0); fcg.add(fArm);
  box(0.05, 0.04, 0.62, 0x2c3236, 0, 0, 0, fArm);
  const fHead = new THREE.Group(); fArm.add(fHead); box(0.06, 0.08, 0.06, 0x2c3236, 0, -0.05, 0, fHead); cyl(0.004, 0.004, 0.1, C.steel, 0, -0.13, 0, fHead, 6, steelM);
  Object.assign(FX_CHEM, { fArm, fHead });
}
