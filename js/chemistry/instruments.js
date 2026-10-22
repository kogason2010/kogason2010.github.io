/* js/chemistry/instruments.js — Everything on the benches in the Chemistry LC lab:
   the live UHPLC (pump, degasser, autosampler, column oven, PDA), the LC workstation PC, an integrated LC,
   the LC-MS/MS with its nitrogen generator, the prep LC with a fraction collector, the solvent cabinet,
   column storage, and the sample-prep island. Front faces point toward +z (back bench) or +x (left wall).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// an LC module: light body, charcoal front (or a smoked window), blue accent line, optional LCD and LED
function lcModule(parent, cx, y, cz, w, h, d, o) {
  o = o || {};
  box(w, h - 0.012, d, o.body || CH.body, cx, y + h / 2, cz, parent);
  const fz = cz + d / 2;
  box(w * 0.96, h - 0.05, 0.012, o.window ? smoked : (o.front || CH.front), cx, y + h / 2, fz + 0.006, parent);
  box(w * 0.96, 0.012, 0.014, C.line, cx, y + 0.032, fz + 0.014, parent);
  let lcd = null;
  if (o.lcd) { lcd = screenTex(120, 40, lcdLines); lcd.draw(o.lcd); plane(0.14, 0.047, new THREE.MeshBasicMaterial({ map: lcd.t }), cx - w / 2 + 0.11, y + h - 0.06, fz + 0.014, 0, parent); }
  led(cx + w / 2 - 0.05, y + h - 0.05, fz + 0.016, o.led || 0x3fd17a, parent);
  return { top: y + h, lcd };
}
const solventLabel = (txt, col) => tex((g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = col; g.fillRect(0, 0, w, 9); g.fillStyle = "#1a2228"; g.font = "bold 14px sans-serif"; g.textAlign = "center"; txt.split("\n").forEach((l, i) => g.fillText(l, w / 2, 26 + i * 15)); }, 96, 56);
function solventBottle(parent, x, y, z, r, h, liquid, label, labelCol, cap) {
  cyl(r, r, h, glass, x, y + h / 2, z, parent, 20).castShadow = false;
  cyl(r * 0.92, r * 0.92, h * 0.78, liquid, x, y + h * 0.39 + 0.004, z, parent, 20, { transparent: true, opacity: 0.5, roughness: 0.1 });
  cyl(r * 0.4, r * 0.45, h * 0.16, cap || 0x2f6fb5, x, y + h + h * 0.08, z, parent, 14, { roughness: 0.4 });
  if (label) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.3, 20, 1, true, -0.7, 1.4), new THREE.MeshStandardMaterial({ map: solventLabel(label, labelCol), roughness: 0.6 })); m.position.set(x, y + h * 0.45, z); parent.add(m); }
  return y + h + h * 0.16;
}
function tubeAlong(parent, pts, r, material, closed) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, !!closed, "centripetal"), Math.max(20, pts.length * 14), r, 6, !!closed), material); m.castShadow = true; parent.add(m); return m;
}

function buildChemInstruments() {
  const T = CH.top, BZ = -3.8, BF = -3.41;               // bench top, back-bench centre line, bench front
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
  const peek = mat(C.peek, { roughness: 0.4 }), steelLine = mat(C.steel, { metalness: 0.75, roughness: 0.3 });

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

  /* ---- UHPLC (the live system): pump + degasser, autosampler, column oven + PDA ---- */
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

  /* ---- LC workstation PC: shows the run and opens the app ---- */
  const MXC = -0.85;
  const gPC = hotGroup("lcpc", "LC workstation", V3(MXC, T + 0.9, -3.4), chem, "chem");
  box(0.08, 0.3, 0.08, 0x2a2f33, MXC, T + 0.15, -3.72, gPC); box(0.26, 0.02, 0.2, 0x2a2f33, MXC, T + 0.01, -3.7, gPC);
  box(0.76, 0.48, 0.04, 0x1a1f23, MXC, T + 0.52, -3.64, gPC);
  const lcScreen = screenTex(512, 304, () => {});
  const lcScreenMesh = plane(0.72, 0.43, new THREE.MeshBasicMaterial({ map: lcScreen.t }), MXC, T + 0.52, -3.617, 0, gPC);
  box(0.46, 0.02, 0.15, 0x2a2f33, MXC - 0.05, T + 0.012, -3.35, gPC); box(0.06, 0.02, 0.09, 0x2a2f33, MXC + 0.3, T + 0.012, -3.35, gPC);
  Object.assign(FX_CHEM, { lcScreen, lcScreenMesh });

  /* ---- integrated LC: everything in one cabinet, touchscreen and solvent tray on top ---- */
  const IX = 0.12;
  const gI = hotGroup("ilc", "Integrated LC", V3(IX + 0.05, T + 1.45, -3.7), chem, "chem");
  box(0.6, 1.02, 0.66, CH.body, IX, T + 0.51, BZ, gI);
  box(0.56, 0.42, 0.012, smoked, IX, T + 0.27, BZ + 0.336, gI);
  box(0.56, 0.38, 0.012, CH.front, IX, T + 0.74, BZ + 0.336, gI);
  const iTouch = screenTex(160, 110, (g, w, h) => { g.fillStyle = "#0f1a20"; g.fillRect(0, 0, w, h); g.fillStyle = "#2f6fb5"; g.fillRect(0, 0, w, 16); g.fillStyle = "#e8f2f8"; g.font = "bold 11px sans-serif"; g.fillText("Integrated LC  ·  Ready", 6, 12); g.strokeStyle = "#6aa6f0"; g.lineWidth = 2; g.beginPath(); for (let x = 6; x < w - 6; x++) { const t = (x - 6) / (w - 12) * 5, y = 96 - 60 * (Math.exp(-((t - 1.3) ** 2) / 0.004) + 0.6 * Math.exp(-((t - 2.4) ** 2) / 0.006) + 0.8 * Math.exp(-((t - 3.6) ** 2) / 0.008)); x === 6 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); });
  iTouch.draw(); plane(0.2, 0.14, new THREE.MeshBasicMaterial({ map: iTouch.t }), IX - 0.12, T + 0.8, BZ + 0.344, 0, gI);
  box(0.56, 0.012, 0.014, C.line, IX, T + 0.06, BZ + 0.345, gI); led(IX + 0.22, T + 0.92, BZ + 0.346, 0x3fd17a, gI);
  box(0.58, 0.025, 0.6, C.steel, IX, T + 1.035, BZ, gI, steelM);
  [[-0.17, 0xdcecf8, "A"], [-0.06, 0xdcecf8, "B"], [0.06, 0xf1e6f6, "C"], [0.17, 0xf1e6f6, "D"]].forEach(([dx, c, l]) => solventBottle(gI, IX + dx, T + 1.05, BZ + 0.05, 0.05, 0.22, c, l, l < "C" ? "#2f6fb5" : "#c23a3a"));

  /* ---- LC-MS/MS: LC stack, triple-quadrupole mass spec, nitrogen generator, rough pump ---- */
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
  box(MSW, 0.07, 0.75, 0xe2e6e7, MSX, T + MSH - 0.035, BZ, gM, { roughness: 0.45 });
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

  /* ---- left wall: solvent cabinet and column storage (fronts face +x) ---- */
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

  /* ---- left wall: prep LC bench with a big column and a fraction collector ---- */
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

  /* ---- sample prep island: balance, sonicator, vacuum filtration, vortex, vials ---- */
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

  // the floor tape keeps a walkway clear in front of the instruments; a solvent waste carboy sits below the UHPLC
  cyl(0.15, 0.15, 0.4, 0xe9eef0, -1.12, 0.2, -3.18, chem, 20, { roughness: 0.4 }); cyl(0.05, 0.05, 0.05, 0xf2c230, -1.12, 0.43, -3.18, chem, 14);
  const wasteTex = tex((g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "#c8262b"; g.font = "bold 16px sans-serif"; g.textAlign = "center"; g.fillText("SOLVENT", w / 2, 22); g.fillText("WASTE", w / 2, 42); }, 96, 52);
  const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.14, 20, 1, true, -0.7, 1.4), new THREE.MeshStandardMaterial({ map: wasteTex, roughness: 0.6 })); wl.position.set(-1.12, 0.22, -3.18); chem.add(wl);
}
