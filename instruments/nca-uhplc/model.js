/* instruments/nca-uhplc/model.js — NCA's live UHPLC on the back bench.
   Pump and degasser with solvent bottles, autosampler with needle gantry, column oven and PDA, and the tubing the run follows.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildUhplc (js/chemistry/instruments.js) */
"use strict";

function buildUhplc() {
  const T = CH.top, BZ = -3.8, BF = -3.41;               // bench top, back-bench centre line, bench front
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
  const peek = mat(C.peek, { roughness: 0.4 });
  const gU = hotGroup("uhplc", "UHPLC", V3(-2.9, T + 1.75, -3.7), chem, "chem");
  const PX = -3.45, SX = -2.82, OX = -2.0;
  const pump = lcModule(gU, PX, T, BZ, 0.5, 0.44, 0.62, { lcd: ["P  480 bar", "B  5.0 %"] });
  const degas = lcModule(gU, PX, pump.top, BZ, 0.5, 0.16, 0.62, { lcd: ["DEGASSER", "ON"] });
  box(0.48, 0.025, 0.56, C.steel, PX, degas.top + 0.0125, BZ, gU, steelM);
  const BOT_A = V3(PX - 0.12, degas.top + 0.025, BZ + 0.06), BOT_B = V3(PX + 0.12, degas.top + 0.025, BZ + 0.06);
  solventBottle(gU, BOT_A.x, BOT_A.y, BOT_A.z, 0.085, 0.3, 0xdcecf8, "A\nWATER", "#2f6fb5");
  solventBottle(gU, BOT_B.x, BOT_B.y, BOT_B.z, 0.085, 0.3, 0xf1e6f6, "B\nACN", "#c23a3a");
  bottle(PX + 0.02, degas.top + 0.025, BZ - 0.17, 0.045, 0.16, 0xe9eef0, 0x3fae6a, gU);
  const sampler = lcModule(gU, SX, T, BZ, 0.6, 0.66, 0.62, { window: true, lcd: ["VIAL --", "READY"] });
  // vial tray and needle gantry on top of the autosampler
  const trayY = sampler.top;
  box(0.54, 0.03, 0.4, 0x3a4248, SX, trayY + 0.015, BZ + 0.08, gU);
  const VIALX = [SX - 0.2, SX - 0.08, SX + 0.04], PORTX = SX + 0.19, VIALZ = BZ + 0.12;
  const vialCols = ["#e3632d", "#3fa7d6", "#9b7bff"];
  VIALX.forEach((vx, i) => {
    cyl(0.02, 0.02, 0.07, glass, vx, trayY + 0.065, VIALZ, gU, 14).castShadow = false;
    cyl(0.017, 0.017, 0.045, [0xf7dccb, 0xd6eef8, 0xe9e1f6][i], vx, trayY + 0.055, VIALZ, gU, 14, { transparent: true, opacity: 0.8 });
    cyl(0.022, 0.022, 0.018, new THREE.Color(vialCols[i]).getHex(), vx, trayY + 0.108, VIALZ, gU, 14, { roughness: 0.4 });
  });
  cyl(0.026, 0.026, 0.012, C.steel, PORTX, trayY + 0.036, VIALZ, gU, 16, { metalness: 0.7 });
  [-0.26, 0.26].forEach(dx => box(0.025, 0.36, 0.025, 0x6b767c, SX + dx, trayY + 0.18, VIALZ - 0.06, gU));
  box(0.56, 0.03, 0.04, 0x6b767c, SX, trayY + 0.36, VIALZ - 0.06, gU);
  const carriage = new THREE.Group(); carriage.position.set(PORTX, trayY + 0.36, VIALZ); gU.add(carriage);
  box(0.06, 0.07, 0.07, 0x2c3236, 0, -0.01, -0.02, carriage); cyl(0.0035, 0.0035, 0.22, C.steel, 0, -0.15, 0, carriage, 6, { metalness: 0.8 });
  // column oven: window onto a horizontal column, PDA detector above
  const ovH = 0.44, colY = T + ovH / 2, COLL = 0.6, COLX0 = OX - COLL / 2, COLZ = BF - 0.1;
  box(0.86, ovH - 0.012, 0.52, CH.body, OX, T + ovH / 2, BZ - 0.06, gU);
  box(0.86, 0.05, 0.16, CH.body, OX, T + 0.025, BF - 0.08, gU); box(0.86, 0.05, 0.16, CH.body, OX, T + ovH - 0.031, BF - 0.08, gU);
  box(0.05, ovH - 0.012, 0.16, CH.body, OX - 0.405, T + ovH / 2, BF - 0.08, gU); box(0.05, ovH - 0.012, 0.16, CH.body, OX + 0.405, T + ovH / 2, BF - 0.08, gU);
  box(0.76, ovH - 0.1, 0.01, 0x141b1f, OX, colY, BZ + 0.2, gU, { roughness: 0.9 });
  box(0.76, ovH - 0.1, 0.008, new THREE.MeshStandardMaterial({ color: 0xdff2ff, roughness: 0.04, transparent: true, opacity: 0.14, depthWrite: false }), OX, colY, BF - 0.004, gU).castShadow = false;
  const colTube = cyl(0.026, 0.026, COLL, new THREE.MeshStandardMaterial({ color: 0xe6f6ff, roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false }), OX, colY, COLZ, gU, 20);
  colTube.rotation.z = Math.PI / 2; colTube.castShadow = false;
  [-1, 1].forEach(s => { const f = cyl(0.036, 0.036, 0.05, C.steel, OX + s * (COLL / 2 + 0.02), colY, COLZ, gU, 16, { metalness: 0.8, roughness: 0.25 }); f.rotation.z = Math.PI / 2; });
  const ovenLcd = screenTex(120, 40, lcdLines); ovenLcd.draw(["OVEN 40.0C", "C18 2.1x100"]);
  plane(0.13, 0.044, new THREE.MeshBasicMaterial({ map: ovenLcd.t }), OX + 0.33, T + ovH - 0.03, BF + 0.002, 0, gU);
  const det = lcModule(gU, OX, T + ovH, BZ, 0.86, 0.3, 0.62, { lcd: ["PDA 254nm", "0.000 AU"] });
  const cellMat = new THREE.MeshBasicMaterial({ color: 0x24313a }); box(0.05, 0.05, 0.012, cellMat, OX + 0.3, T + ovH + 0.15, BF + 0.02, gU);
  // waste bottle with a safety cap at the end of the line
  const WX = -1.47;
  cyl(0.07, 0.07, 0.22, 0xe9eef0, WX, T + 0.11, BZ + 0.1, gU, 18, { roughness: 0.35, transparent: true, opacity: 0.85 });
  cyl(0.065, 0.065, 0.08, 0xc9b98a, WX, T + 0.045, BZ + 0.1, gU, 18, { transparent: true, opacity: 0.7 });
  cyl(0.04, 0.045, 0.04, 0xf2c230, WX, T + 0.24, BZ + 0.1, gU, 14);
  // flow path: A and B through the degasser to the pump, pump → injector → column → detector cell → waste
  const MIXP = V3(PX + 0.22, T + 0.3, BF + 0.03);
  const FLOWLC = {
    a: new THREE.CatmullRomCurve3([V3(BOT_A.x, BOT_A.y + 0.28, BOT_A.z), V3(BOT_A.x, BOT_A.y + 0.38, BOT_A.z + 0.1), V3(PX - 0.2, degas.top - 0.05, BF + 0.03), V3(PX - 0.1, pump.top - 0.12, BF + 0.03), MIXP], false, "centripetal"),
    b: new THREE.CatmullRomCurve3([V3(BOT_B.x, BOT_B.y + 0.28, BOT_B.z), V3(BOT_B.x, BOT_B.y + 0.38, BOT_B.z + 0.1), V3(PX + 0.2, degas.top - 0.05, BF + 0.03), V3(PX + 0.16, pump.top - 0.12, BF + 0.03), MIXP], false, "centripetal"),
    mix: new THREE.CatmullRomCurve3([MIXP, V3(SX - 0.27, T + 0.3, BF + 0.035), V3(SX + 0.24, T + 0.3, BF + 0.035), V3(SX + 0.29, T + 0.24, BF + 0.03), V3(COLX0 - 0.06, colY, COLZ + 0.02), V3(COLX0 - 0.03, colY, COLZ)], false, "centripetal"),
    out: new THREE.CatmullRomCurve3([V3(COLX0 + COLL + 0.03, colY, COLZ), V3(COLX0 + COLL + 0.06, colY + 0.06, COLZ + 0.02), V3(OX + 0.3, T + ovH + 0.15, BF + 0.03), V3(OX + 0.44, T + ovH + 0.08, BF + 0.04), V3(WX, T + 0.4, BZ + 0.12), V3(WX, T + 0.26, BZ + 0.1)], false, "centripetal"),
  };
  Object.values(FLOWLC).forEach(c => { const m = new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.006, 6, false), peek); m.castShadow = true; gU.add(m); });
  Object.assign(FX_CHEM, { pump, degas, sampler, det, ovenLcd, cellMat, carriage, trayY, VIALX, PORTX, VIALZ, colY, COLX0, COLL, COLZ, FLOWLC });
  hotspots.find(h => h.key === "uhplc").focus = { center: V3(-2.5, T + 0.6, BZ + 0.1), size: V3(2.4, 1.3, 0.7) };
}
