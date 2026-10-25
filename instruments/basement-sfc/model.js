/* instruments/basement-sfc/model.js — SFC (supercritical fluid chromatograph) on the basement bench.
   CO₂ and modifier pumps, autosampler, column oven with PDA, back-pressure regulator and vent, the chiller, and the tubing
   the live run (js/basement/sfc.js) sends sample along.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     BX2, CX2, pumpCO2, pumpMod, sampler, trayY, VIAL_X, PORT_X, VIAL_Z, carriage, colY, COL_L, COL_X0, COL_Z, ovenLcd, det, cellMat, bpr, gNeedle, VENT, FLOW (js/basement/sfc.js) */
"use strict";

const SY = BY + 1.31, SZ = -3.8, SF = -3.45;                   // bench top, module centre line, module fronts
const gSFC = hotGroup("sfc", "SFC", new THREE.Vector3(-0.35, BY + 2.75, -3.7), basement, "down");
const sBody = 0x202427, sDoor = 0x2c3236, sTrim = 0x5d676d;
function sModule(cx, y, w, h, o) {
  o = o || {};
  box(w, h - 0.012, 0.7, sBody, cx, y + h / 2, SZ, gSFC);
  const dh = h - 0.06, cy = y + h / 2;
  if (!o.noDoor) box(w * 0.62, dh, 0.02, o.window ? smoked : sDoor, cx + w * 0.14, cy, SF + 0.01, gSFC);
  box(0.012, dh * 0.55, 0.012, sTrim, cx - w * 0.2, cy, SF + 0.024, gSFC);
  let lcd = null;
  if (o.lcd) { lcd = screenTex(120, 40, lcdLines); lcd.draw(o.lcd); plane(0.15, 0.05, new THREE.MeshBasicMaterial({ map: lcd.t }), cx - w * 0.5 + 0.1, cy + dh * 0.2, SF + 0.002, 0, gSFC); }
  led(cx - w * 0.5 + 0.05, cy - dh * 0.28, SF + 0.008, o.led || 0x3fd17a, gSFC);
  return { top: y + h, lcd };
}
// stack A: CO₂ pump (chilled head) and modifier pump, methanol bottle on top
const AX = -1.55, BX2 = -0.91, CX2 = -0.08, DX = 0.69;
const pumpCO2 = sModule(AX, SY, 0.5, 0.42, { lcd: ["CO2  2.40", "mL/min"] });
const pumpMod = sModule(AX, pumpCO2.top, 0.5, 0.36, { lcd: ["MeOH 0.60", "mL/min"] });
box(0.46, 0.02, 0.6, C.steel, AX, pumpMod.top + 0.01, SZ, gSFC, { metalness: 0.5 });
cyl(0.085, 0.085, 0.3, glass, AX - 0.08, pumpMod.top + 0.17, SZ + 0.05, gSFC, 20).castShadow = false;
cyl(0.078, 0.078, 0.22, 0xe8eef5, AX - 0.08, pumpMod.top + 0.13, SZ + 0.05, gSFC, 20, { transparent: true, opacity: 0.55, roughness: 0.1 });
cyl(0.035, 0.035, 0.05, 0xe08a2a, AX - 0.08, pumpMod.top + 0.345, SZ + 0.05, gSFC, 12);
const meohTex = tex((g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "#c23a3a"; g.fillRect(0, 0, w, 8); g.fillStyle = "#1a2228"; g.font = "bold 15px sans-serif"; g.textAlign = "center"; g.fillText("METHANOL", w / 2, 30); }, 96, 40);
const ml = new THREE.Mesh(new THREE.CylinderGeometry(0.087, 0.087, 0.08, 20, 1, true, -0.6, 1.2), new THREE.MeshStandardMaterial({ map: meohTex, roughness: 0.6 })); ml.position.set(AX - 0.08, pumpMod.top + 0.16, SZ + 0.05); gSFC.add(ml);
// stack B: autosampler with an open vial tray and a needle gantry on top
const sampler = sModule(BX2, SY, 0.62, 0.62, { window: true, lcd: ["VIAL --", "READY"] });
const trayY = sampler.top;
box(0.56, 0.03, 0.4, 0x3a4248, BX2, trayY + 0.015, SZ + 0.08, gSFC);
const VIAL_X = [BX2 - 0.2, BX2 - 0.08, BX2 + 0.04], PORT_X = BX2 + 0.19, VIAL_Z = SZ + 0.12, VIAL_TOP = trayY + 0.03 + 0.075;
const vialCaps = ["#2bb3a3", "#8a63d2", "#e8892c"].map((c, i) => {
  cyl(0.02, 0.02, 0.07, glass, VIAL_X[i], trayY + 0.065, VIAL_Z, gSFC, 14).castShadow = false;
  cyl(0.017, 0.017, 0.045, i === 0 ? 0xdff3ef : i === 1 ? 0xe9e1f6 : 0xf6dcc0, VIAL_X[i], trayY + 0.055, VIAL_Z, gSFC, 14, { transparent: true, opacity: 0.8 });
  return cyl(0.022, 0.022, 0.018, new THREE.Color(c).getHex(), VIAL_X[i], VIAL_TOP + 0.004, VIAL_Z, gSFC, 14, { roughness: 0.4 });
});
cyl(0.026, 0.026, 0.012, C.steel, PORT_X, trayY + 0.036, VIAL_Z, gSFC, 16, { metalness: 0.7 });
[-0.27, 0.27].forEach(dx => box(0.025, 0.36, 0.025, 0x6b767c, BX2 + dx, trayY + 0.18, VIAL_Z - 0.06, gSFC));
box(0.58, 0.03, 0.04, 0x6b767c, BX2, trayY + 0.36, VIAL_Z - 0.06, gSFC);
const carriage = new THREE.Group(); carriage.position.set(PORT_X, trayY + 0.36, VIAL_Z); gSFC.add(carriage);
box(0.06, 0.07, 0.07, 0x2c3236, 0, -0.01, -0.02, carriage);
const needle = cyl(0.0035, 0.0035, 0.22, C.steel, 0, -0.15, 0, carriage, 6, { metalness: 0.8 });
// stack C: column oven with a window onto the column, PDA detector above
const ovenH = 0.44, ovenY = SY, colY = ovenY + ovenH / 2, COL_L = 0.62, COL_X0 = CX2 - COL_L / 2, COL_Z = SF - 0.09;
box(0.86, ovenH - 0.012, 0.56, sBody, CX2, ovenY + ovenH / 2, SZ - 0.07, gSFC);                    // body behind the window
box(0.86, 0.05, 0.16, sBody, CX2, ovenY + 0.025, SF - 0.08, gSFC); box(0.86, 0.05, 0.16, sBody, CX2, ovenY + ovenH - 0.031, SF - 0.08, gSFC);
box(0.05, ovenH - 0.012, 0.16, sBody, CX2 - 0.405, ovenY + ovenH / 2, SF - 0.08, gSFC); box(0.05, ovenH - 0.012, 0.16, sBody, CX2 + 0.405, ovenY + ovenH / 2, SF - 0.08, gSFC);
box(0.76, ovenH - 0.1, 0.01, 0x141b1f, CX2, colY, SZ + 0.21, gSFC, { roughness: 0.9 });               // dark back panel so bands show
const ovenGlass = new THREE.MeshStandardMaterial({ color: 0xdff2ff, roughness: 0.04, transparent: true, opacity: 0.14, depthWrite: false });
box(0.76, ovenH - 0.1, 0.008, ovenGlass, CX2, colY, SF - 0.004, gSFC).castShadow = false;
const colGlass = new THREE.MeshStandardMaterial({ color: 0xe6f6ff, roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false });
const colTube = cyl(0.032, 0.032, COL_L, colGlass, CX2, colY, COL_Z, gSFC, 20); colTube.rotation.z = Math.PI / 2; colTube.castShadow = false;
[-1, 1].forEach(s => { const f = cyl(0.042, 0.042, 0.05, C.steel, CX2 + s * (COL_L / 2 + 0.02), colY, COL_Z, gSFC, 16, { metalness: 0.8, roughness: 0.25 }); f.rotation.z = Math.PI / 2; });
const ovenLcd = screenTex(120, 40, lcdLines); ovenLcd.draw(["OVEN 40.0C", "COL 1"]);
plane(0.13, 0.044, new THREE.MeshBasicMaterial({ map: ovenLcd.t }), CX2 + 0.33, ovenY + ovenH - 0.03, SF + 0.002, 0, gSFC);
const det = sModule(CX2, ovenY + ovenH, 0.86, 0.3, { lcd: ["PDA 254nm", "0.000 AU"] });
const cellMat = new THREE.MeshBasicMaterial({ color: 0x24313a }); const cell = box(0.05, 0.05, 0.012, cellMat, CX2 + 0.3, ovenY + ovenH + 0.15, SF + 0.012, gSFC);
// stack D: back-pressure regulator; vent line up to an extraction snorkel
const bpr = sModule(DX, SY, 0.5, 0.5, { lcd: ["BPR", "150 bar"], noDoor: true });
const gauge = cyl(0.07, 0.07, 0.02, 0xe9eef0, DX + 0.12, SY + 0.27, SF + 0.01, gSFC, 28, { roughness: 0.3 }); gauge.rotation.x = Math.PI / 2;
const gNeedle = new THREE.Group(); gNeedle.position.set(DX + 0.12, SY + 0.27, SF + 0.024); gSFC.add(gNeedle); box(0.055, 0.006, 0.004, 0xc23a3a, 0.024, 0, 0, gNeedle);
const VENT = new THREE.Vector3(DX + 0.05, BY + 2.08, -3.62);
const ventPts = [new THREE.Vector3(DX + 0.05, bpr.top, -3.95), new THREE.Vector3(DX + 0.05, BY + 2.02, -3.95), new THREE.Vector3(DX + 0.05, BY + 2.12, -3.85), new THREE.Vector3(DX + 0.05, BY + 2.12, -3.68), VENT];
const steelLine = mat(C.steel, { metalness: 0.75, roughness: 0.3 });
basement.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ventPts, false, "centripetal"), 40, 0.012, 8, false), steelLine));
const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.17, 0.2, 24, 1, true), mat(0x8fa0a8, { side: THREE.DoubleSide, metalness: 0.4, roughness: 0.4 }));
cone.position.set(VENT.x, BY + 2.5, VENT.z); basement.add(cone);
basement.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(VENT.x, BY + 2.6, VENT.z), new THREE.Vector3(VENT.x, BY + 2.85, -3.75), new THREE.Vector3(VENT.x, BY + 2.95, -4.15)]), 24, 0.05, 12, false), mat(0x9aa8ae, { metalness: 0.4, roughness: 0.45 })));
// chiller on the floor at the end of the bench, coolant lines up to the CO₂ pump head
box(0.5, 0.62, 0.56, 0xe7ebec, -2.78, BY + 0.31, -3.85, basement);
box(0.36, 0.3, 0.012, 0x3a4248, -2.78, BY + 0.3, -3.564, basement);
const chillLcd = screenTex(120, 40, lcdLines); chillLcd.draw(["COOL  5.0C", "RUN"]);
plane(0.14, 0.047, new THREE.MeshBasicMaterial({ map: chillLcd.t }), -2.78, BY + 0.53, -3.564, 0, basement);
const hoseMat2 = mat(0x2a2f33, { roughness: 0.7 });
[0, 1].forEach(i => basement.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.68 + i * 0.08, BY + 0.62, -3.95), new THREE.Vector3(-2.55 + i * 0.08, BY + 1.5, -4.05), new THREE.Vector3(AX - 0.2 + i * 0.06, SY + 0.32, -4.12)]), 30, 0.014, 8, false), hoseMat2)));

// tubing on the instrument fronts (the flow path), used by the live run
const peekLine = mat(C.peek, { roughness: 0.4 });
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// the CO₂ line from the cylinders on the left wall to the pump (instruments/basement-co2 draws it); the flow follows it
const CO2_FEED = [V3(-4.06, BY + 1.86, -1.55), V3(-4.06, BY + 1.86, -4.06), V3(AX - 0.12, BY + 1.86, -4.06), V3(AX - 0.12, SY + 0.3, -4.06)];
const MIX = V3(AX + 0.27, SY + 0.43, SF + 0.04);
const FLOW = {
  co2: new THREE.CatmullRomCurve3([...CO2_FEED, V3(AX + 0.22, SY + 0.3, -4.13), V3(AX + 0.27, SY + 0.32, SF + 0.04), MIX], false, "chordal", 0),
  mod: new THREE.CatmullRomCurve3([V3(AX - 0.08, pumpMod.top + 0.3, SZ + 0.05), V3(AX + 0.05, pumpMod.top + 0.36, SZ + 0.12), V3(AX + 0.2, pumpMod.top + 0.1, SF + 0.04), V3(AX + 0.25, SY + 0.6, SF + 0.04), MIX], false, "centripetal"),
  mix: new THREE.CatmullRomCurve3([MIX, V3(BX2 - 0.24, SY + 0.43, SF + 0.04), V3(BX2 + 0.26, SY + 0.43, SF + 0.04), V3(BX2 + 0.3, SY + 0.3, SF + 0.03), V3(COL_X0 - 0.06, colY, COL_Z + 0.02), V3(COL_X0 - 0.03, colY, COL_Z)], false, "centripetal"),
  out: new THREE.CatmullRomCurve3([V3(COL_X0 + COL_L + 0.03, colY, COL_Z), V3(COL_X0 + COL_L + 0.06, colY + 0.06, COL_Z + 0.02), V3(CX2 + 0.3, ovenY + ovenH + 0.15, SF + 0.03), V3(CX2 + 0.43, ovenY + ovenH + 0.05, SF + 0.04), V3(DX - 0.2, SY + 0.35, SF + 0.04), V3(DX + 0.05, SY + 0.35, SF + 0.02), V3(DX + 0.05, bpr.top - 0.02, -3.95)], false, "centripetal"),
};
["mod", "mix", "out"].forEach(k => { const m = new THREE.Mesh(new THREE.TubeGeometry(FLOW[k], 80, 0.0065, 6, false), peekLine); m.castShadow = true; gSFC.add(m); });
gSFC.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(FLOW.co2.points.slice(3), false, "chordal", 0), 40, 0.009, 6, false), steelLine));
hotspots.find(h => h.key === "sfc").focus = { center: new THREE.Vector3(-0.35, SY + 0.45, SZ + 0.1), size: new THREE.Vector3(3.1, 1.25, 0.7) };
