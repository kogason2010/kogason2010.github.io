/* js/chemistry/instruments.js — The NCA benches, and the order its instruments are built in. Each instrument is its own
   file in instruments/nca-* (a function this calls); the robot assembly line is js/chemistry/assembly.js.
   Front faces point toward +z (back bench) or +x (left wall).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

function buildChemInstruments() {
  const T = CH.top, BZ = -3.8, BF = -3.41;               // bench top, back-bench centre line, bench front
  const steelM = { metalness: 0.6, roughness: 0.35 };

  /* ---- back bench: base cabinets with an epoxy top (an open steel frame under the mass spec) ---- */
  box(4.75, T - 0.06, 0.78, C.cab, -1.58, (T - 0.06) / 2, BZ, chem);
  for (let x = -3.95; x < 0.75; x += 0.78) { box(0.76, T - 0.28, 0.014, C.cab, x + 0.39, (T - 0.28) / 2 + 0.1, BF - 0.003, chem, { roughness: 0.55 }); box(0.12, 0.014, 0.03, C.steel, x + 0.39, T - 0.24, BF + 0.015, chem, steelM); }
  box(6.95, 0.06, 0.82, C.epoxy, -0.48, T - 0.03, BZ, chem);
  [[0.85, -4.12], [0.85, -3.48], [2.92, -4.12], [2.92, -3.48]].forEach(([x, z]) => box(0.06, T - 0.06, 0.06, 0x56636b, x, (T - 0.06) / 2, z, chem, steelM));
  box(2.1, 0.04, 0.68, 0x56636b, 1.88, 0.22, BZ, chem, steelM);                                  // lower shelf of the steel frame
  // shelf above the bench with spare bottles and column boxes
  box(5.2, 0.04, 0.32, 0xeef1ef, -1.2, 2.55, -4.04, chem); [-3.6, -1.2, 1.2].forEach(x => box(0.03, 0.18, 0.28, 0xb9c3c8, x, 2.46, -4.04, chem));
  [-3.5, -3.3, -3.1].forEach((x, i) => bottle(x, 2.57, -4.04, 0.07, 0.24, [0xe9eef0, 0xe9eef0, 0x8a4b1d][i], 0x2f6fb5, chem));
  [[-2.6, 0x2f6fb5], [-2.35, 0xd23c3c], [-2.1, 0x3fae6a], [-1.85, 0xf2c230]].forEach(([x, c]) => box(0.2, 0.07, 0.24, c, x, 2.605, -4.04, chem, { roughness: 0.6 }));

  // the instruments, in the order their tags are listed
  buildUhplc(); buildLcWorkstation(); buildIntegratedLc(); buildLcMs();
  buildSolventCabinet(); buildColumnStorage(); buildPrepLc(); buildSamplePrep();

  // the floor tape keeps a walkway clear in front of the instruments; a solvent waste carboy sits below the UHPLC
  cyl(0.15, 0.15, 0.4, 0xe9eef0, -1.12, 0.2, -3.18, chem, 20, { roughness: 0.4 }); cyl(0.05, 0.05, 0.05, 0xf2c230, -1.12, 0.43, -3.18, chem, 14);
  const wasteTex = tex((g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "#c8262b"; g.font = "bold 16px sans-serif"; g.textAlign = "center"; g.fillText("SOLVENT", w / 2, 22); g.fillText("WASTE", w / 2, 42); }, 96, 52);
  const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.14, 20, 1, true, -0.7, 1.4), new THREE.MeshStandardMaterial({ map: wasteTex, roughness: 0.6 })); wl.position.set(-1.12, 0.22, -3.18); chem.add(wl);
}
