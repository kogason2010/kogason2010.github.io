/* instruments/nca-sample-prep/model.js — The sample-prep island: balance, ultrasonic bath, vacuum filtration, vortex mixer, vials.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildSamplePrep (js/chemistry/instruments.js) */
"use strict";

function buildSamplePrep() {
  const T = CH.top;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
  const vialCols = ["#e3632d", "#3fa7d6", "#9b7bff"];   // vial cap colours, as on the UHPLC's tray
  const gSp = hotGroup("sampleprep", "Sample prep", V3(1.35, T + 1.05, 1.2), chem, "chem");
  const IXc = 1.35, IZc = 1.2, IT = T;
  box(2.7, IT - 0.06, 1.0, C.cab, IXc, (IT - 0.06) / 2, IZc, gSp);
  for (let x = IXc - 1.35; x < IXc + 1.34; x += 0.675) box(0.66, IT - 0.28, 0.014, C.cab, x + 0.337, (IT - 0.28) / 2 + 0.1, IZc + 0.507, gSp, { roughness: 0.55 });
  box(2.78, 0.06, 1.08, C.epoxy, IXc, IT - 0.03, IZc, gSp);
  // analytical balance with a draft shield
  const bx = IXc - 1.0;
  box(0.36, 0.1, 0.42, 0xeef0f0, bx, IT + 0.05, IZc, gSp); box(0.3, 0.26, 0.3, glass, bx, IT + 0.23, IZc - 0.03, gSp).castShadow = false;
  cyl(0.06, 0.06, 0.01, C.steel, bx, IT + 0.105, IZc - 0.03, gSp, 20, steelM);
  const balLcd = screenTex(120, 40, lcdLines); balLcd.draw(["  10.002 mg", "STABLE"]); plane(0.13, 0.04, new THREE.MeshBasicMaterial({ map: balLcd.t }), bx, IT + 0.075, IZc + 0.212, 0, gSp);
  // ultrasonic bath with a beaker and a shimmer on the water
  const sx = IXc - 0.4;
  box(0.44, 0.22, 0.32, 0xd9dee0, sx, IT + 0.11, IZc, gSp, steelM);
  box(0.4, 0.012, 0.28, 0x7fb6d1, sx, IT + 0.2, IZc, gSp, { roughness: 0.1, metalness: 0.1 });
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.05, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); ripple.rotation.x = -Math.PI / 2; ripple.position.set(sx + 0.08, IT + 0.208, IZc); gSp.add(ripple);
  beaker(sx - 0.08, IT + 0.12, IZc, 0.06, 0.14, 0xe9f2f7, 0.6, gSp);
  box(0.16, 0.05, 0.012, CH.front, sx, IT + 0.07, IZc + 0.166, gSp);
  // vacuum filtration: side-arm flask, funnel with clamp, small pump
  const fx = IXc + 0.25;
  flask(fx, IT, IZc - 0.05, 0.11, 0xe9eef4, gSp);
  cyl(0.06, 0.02, 0.1, glass, fx, IT + 0.42, IZc - 0.05, gSp, 18).castShadow = false; cyl(0.06, 0.06, 0.14, glass, fx, IT + 0.53, IZc - 0.05, gSp, 18).castShadow = false;
  cyl(0.055, 0.055, 0.05, 0xdcecf8, fx, IT + 0.5, IZc - 0.05, gSp, 18, { transparent: true, opacity: 0.6 });
  box(0.24, 0.12, 0.16, 0x3f6f95, fx + 0.33, IT + 0.06, IZc - 0.05, gSp);
  tubeAlong(gSp, [V3(fx + 0.08, IT + 0.26, IZc - 0.05), V3(fx + 0.18, IT + 0.25, IZc - 0.05), V3(fx + 0.22, IT + 0.12, IZc - 0.05)], 0.008, mat(0xd8a26a, { roughness: 0.6 }));
  // vortex mixer with a tube; vial rack and syringe filters
  const vx2 = IXc + 0.95;
  cyl(0.07, 0.08, 0.1, 0x2a2f33, vx2, IT + 0.05, IZc - 0.2, gSp, 20); cyl(0.03, 0.03, 0.02, 0x8a959b, vx2, IT + 0.11, IZc - 0.2, gSp, 16);
  const vtube = cyl(0.012, 0.012, 0.1, glass, vx2, IT + 0.17, IZc - 0.2, gSp, 10); vtube.castShadow = false;
  box(0.3, 0.04, 0.16, 0xdfe4e6, vx2, IT + 0.02, IZc + 0.18, gSp);
  for (let i = 0; i < 12; i++) { const x = vx2 - 0.12 + (i % 6) * 0.048, z = IZc + 0.14 + Math.floor(i / 6) * 0.07; cyl(0.012, 0.012, 0.05, glass, x, IT + 0.065, z, gSp, 10).castShadow = false; cyl(0.013, 0.013, 0.012, new THREE.Color(vialCols[i % 3]).getHex(), x, IT + 0.096, z, gSp, 10); }
  [0, 1, 2].forEach(i => { cyl(0.012, 0.004, 0.03, 0xf2f4f5, IXc + 0.65 + i * 0.05, IT + 0.015, IZc + 0.3, gSp, 10); });
  // a mobile phase being made up: graduated cylinder and a labelled bottle
  cyl(0.035, 0.035, 0.3, glass, IXc + 0.62, IT + 0.15, IZc - 0.28, gSp, 16).castShadow = false; cyl(0.032, 0.032, 0.18, 0xdcecf8, IXc + 0.62, IT + 0.095, IZc - 0.28, gSp, 16, { transparent: true, opacity: 0.6 });
  solventBottle(gSp, IXc - 1.0, IT, IZc + 0.35, 0.08, 0.26, 0xdcecf8, "0.1% FA\nWATER", "#2f6fb5");
  // stools
  [[IXc - 0.7, IZc + 1.0], [IXc + 0.5, IZc + 1.05]].forEach(([x, z]) => { cyl(0.2, 0.2, 0.06, 0x4e5a60, x, 0.9, z, chem, 24); cyl(0.03, 0.03, 0.86, C.steel, x, 0.45, z, chem, 10, steelM); cyl(0.2, 0.24, 0.03, 0x4e5a60, x, 0.02, z, chem, 24); });
  Object.assign(FX_CHEM, { ripple });
}
