/* instruments/nca-lcms/model.js — LC-MS/MS: LC stack, triple-quadrupole mass spectrometer, nitrogen generator, backing pump.
   The extraction snorkel over the ion source is part of it.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildLcMs (js/chemistry/instruments.js) */
"use strict";

function buildLcMs() {
  const T = CH.top, BZ = -3.8, BF = -3.41;               // bench top, back-bench centre line, bench front
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
  const peek = mat(C.peek, { roughness: 0.4 });
  const gM = hotGroup("lcms", "LC-MS/MS", V3(2.2, T + 0.95, -3.5), chem, "chem");
  const LX = 0.66;
  const p2 = lcModule(gM, LX, T, BZ, 0.42, 0.36, 0.6, { lcd: ["P  612 bar", "B  40 %"] });
  const a2 = lcModule(gM, LX, p2.top, BZ, 0.42, 0.44, 0.6, { window: true });
  const o2 = lcModule(gM, LX, a2.top, BZ, 0.42, 0.24, 0.6, { lcd: ["OVEN 40C", "C18"] });
  box(0.4, 0.02, 0.5, C.steel, LX, o2.top + 0.01, BZ, gM, steelM);
  solventBottle(gM, LX - 0.09, o2.top + 0.02, BZ + 0.05, 0.05, 0.2, 0xdcecf8, "A", "#2f6fb5"); solventBottle(gM, LX + 0.09, o2.top + 0.02, BZ + 0.05, 0.05, 0.2, 0xf1e6f6, "B", "#c23a3a");
  // the mass spectrometer: long body, dark front band with status lights, ion source housing on the left
  const MSX = 1.95, MSW = 1.6, MSH = 0.62;
  box(MSW, MSH, 0.74, 0xf1f3f3, MSX, T + MSH / 2, BZ, gM, { roughness: 0.45 });
  box(MSW + 0.006, 0.074, 0.75, 0xe2e6e7, MSX, T + MSH - 0.035, BZ, gM, { roughness: 0.45 });   // a hair proud of the body, so their faces don't fight
  box(MSW * 0.72, 0.26, 0.012, CH.front, MSX + 0.18, T + 0.36, BZ + 0.376, gM);
  box(MSW * 0.72, 0.014, 0.014, C.line, MSX + 0.18, T + 0.2, BZ + 0.38, gM);
  const msText = tex((g, w, h) => { g.fillStyle = "#2b3238"; g.fillRect(0, 0, w, h); g.fillStyle = "#e8f2f8"; g.font = "600 30px 'Segoe UI', sans-serif"; g.fillText("Triple Quad  LC-MS/MS", 18, 46); }, 512, 64);
  plane(0.62, 0.078, new THREE.MeshBasicMaterial({ map: msText }), MSX + 0.12, T + 0.43, BZ + 0.384, 0, gM);
  const msLeds = ["#3fd17a", "#3fd17a", "#f2c230", "#3fd17a"].map((c, i) => led(MSX + 0.52 + i * 0.06, T + 0.3, BZ + 0.384, new THREE.Color(c).getHex(), gM));
  // ion source: housing with a window, probe on top, nebulizer gas line
  const SXs = MSX - MSW / 2 + 0.17;
  box(0.26, 0.34, 0.2, 0xd9dee0, SXs, T + 0.32, BZ + 0.47, gM, { roughness: 0.4 });
  box(0.17, 0.2, 0.012, smoked, SXs, T + 0.33, BZ + 0.576, gM);
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45, depthWrite: false }));
  plume.rotation.x = Math.PI; plume.position.set(SXs, T + 0.36, BZ + 0.5); gM.add(plume);
  cyl(0.02, 0.02, 0.16, C.steel, SXs, T + 0.56, BZ + 0.47, gM, 12, steelM);
  tubeAlong(gM, [V3(LX + 0.2, o2.top - 0.12, BF + 0.03), V3(LX + 0.35, o2.top - 0.05, BF + 0.05), V3(SXs, T + 0.66, BZ + 0.47)], 0.005, peek);
  // nitrogen generator on the floor, gas line up to the source
  const NX = 3.32;
  box(0.52, 1.1, 0.62, 0xe4e8ea, NX, 0.55, BZ, gM, { roughness: 0.5 });
  box(0.44, 0.3, 0.012, CH.front, NX, 0.85, BZ + 0.316, gM);
  const n2Lcd = screenTex(120, 40, lcdLines); n2Lcd.draw(["N2  99.5%", "7.0 bar"]); plane(0.15, 0.05, new THREE.MeshBasicMaterial({ map: n2Lcd.t }), NX - 0.08, 0.9, BZ + 0.324, 0, gM);
  for (let i = 0; i < 6; i++) box(0.38, 0.012, 0.012, 0xb9c3c8, NX, 0.2 + i * 0.07, BZ + 0.316, gM);
  const n2Tex = tex((g, w, h) => { g.fillStyle = "#e4e8ea"; g.fillRect(0, 0, w, h); g.fillStyle = "#2f6fb5"; g.font = "bold 22px sans-serif"; g.fillText("N₂ GENERATOR", 8, 28); }, 256, 40);
  plane(0.42, 0.066, new THREE.MeshBasicMaterial({ map: n2Tex }), NX, 1.04, BZ + 0.316, 0, gM);
  tubeAlong(gM, [V3(NX - 0.15, 1.1, BZ - 0.1), V3(NX - 0.3, 1.5, BZ - 0.25), V3(MSX + 0.4, T + 0.7, BZ - 0.3), V3(SXs + 0.05, T + 0.5, BZ + 0.35)], 0.008, mat(0x2f6fb5, { roughness: 0.5 }));
  // rough (backing) pump on the lower shelf, exhaust hose to the wall
  box(0.42, 0.26, 0.3, 0x3f6f95, 2.2, 0.37, BZ, gM, { roughness: 0.45 }); cyl(0.09, 0.09, 0.04, 0x2a2f33, 2.2, 0.37, BZ + 0.17, gM, 20).rotation.x = Math.PI / 2;
  tubeAlong(gM, [V3(2.38, 0.42, BZ), V3(2.6, 0.6, -4.05), V3(2.65, 1.0, -4.15)], 0.025, mat(0x1f2428, { roughness: 0.8 }));
  // extraction snorkel over the ion source
  tubeAlong(chem, [V3(SXs + 0.1, 3.1, -4.15), V3(SXs + 0.1, 2.85, -3.9), V3(SXs, 2.25, -3.45)], 0.05, mat(0xc6ced2, { metalness: 0.35, roughness: 0.4 }));
  const hoodC = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.15, 0.17, 24, 1, true), mat(0xb9c3c8, { side: THREE.DoubleSide, metalness: 0.4, roughness: 0.4 })); hoodC.position.set(SXs, 2.15, -3.45); chem.add(hoodC);
  Object.assign(FX_CHEM, { plume, msLeds });
  hotspots.find(h => h.key === "lcms").focus = { center: V3(1.95, T + 0.4, BZ + 0.1), size: V3(3.4, 1.2, 0.8) };
}
