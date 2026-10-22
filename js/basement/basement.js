/* js/basement/basement.js — Spiral stair and the basement SFC suite (room, SFC instrument, CO2 supply, workstation model).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Spiral stair: a round opening in the floor leads down to the basement SFC suite ---------- */
const BY = -3.6;                                         // basement floor level (top of the slab)
const STAIR = { x: -2.0, z: 3.35, r: 0.78 }, RISE = 0.2, NTREAD = 17;
const DTH = THREE.MathUtils.degToRad(25), GAP = THREE.MathUtils.degToRad(64);
const stairSteel = mat(0x56636b, { metalness: 0.55, roughness: 0.38 }), treadMat = mat(0x3d474e, { metalness: 0.45, roughness: 0.6 });
const railMat = mat(C.steel, { metalness: 0.7, roughness: 0.3 });
const treadGeo = (() => {
  const r0 = 0.07, r1 = 0.74, a = DTH / 2 + 0.012, s = new THREE.Shape();
  s.moveTo(r0 * Math.cos(-a), r0 * Math.sin(-a)); s.absarc(0, 0, r1, -a, a, false);
  s.lineTo(r0 * Math.cos(a), r0 * Math.sin(a)); s.absarc(0, 0, r0, a, -a, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false, curveSegments: 6 }); g.rotateX(-Math.PI / 2); return g;
})();
// angles run counter-clockwise seen from above; direction of angle a on the floor is (cos a, -sin a)
const treadTop = i => -(i + 1) * RISE;
// clip: nothing is built below this height (upstairs, the flight vanishes into the dark well)
function spiral(parent, i0, i1, poleBottom, poleTop, clip) {
  clip = clip == null ? -1e9 : clip;
  for (let i = i0; i <= i1; i++) {
    if (treadTop(i) - 0.035 > clip) {
      const t = new THREE.Mesh(treadGeo, treadMat); t.rotation.y = i * DTH; t.position.set(STAIR.x, treadTop(i) - 0.035, STAIR.z);
      t.castShadow = t.receiveShadow = true; parent.add(t);
    }
    const a = i * DTH + DTH * 0.35, bx = STAIR.x + Math.cos(a) * 0.71, bz = STAIR.z - Math.sin(a) * 0.71;
    const b0 = Math.max(treadTop(i), clip), b1 = treadTop(i) + 0.9;
    if (b1 - b0 > 0.05) cyl(0.009, 0.009, b1 - b0, railMat, bx, (b0 + b1) / 2, bz, parent, 6);
  }
  const pts = [];
  for (let a = i0 * DTH - DTH * 0.5; a <= i1 * DTH + DTH * 0.5 + 1e-6; a += DTH / 4) {
    const y = -(1 + a / DTH) * RISE + 0.9; if (y < clip) break;
    pts.push(new THREE.Vector3(STAIR.x + Math.cos(a) * 0.71, y, STAIR.z - Math.sin(a) * 0.71));
  }
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 4, 0.02, 8, false), railMat); rail.castShadow = true; parent.add(rail);
  // newel post where the handrail starts, standing on the top tread
  const p0 = pts[0]; cyl(0.024, 0.024, p0.y - treadTop(i0) + 0.02, railMat, p0.x, (p0.y + treadTop(i0)) / 2, p0.z, parent, 10);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8), railMat); knob.position.copy(p0); parent.add(knob);
  cyl(0.055, 0.055, poleTop - poleBottom, stairSteel, STAIR.x, (poleTop + poleBottom) / 2, STAIR.z, parent, 16);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), stairSteel); cap.position.set(STAIR.x, poleTop, STAIR.z); parent.add(cap);
}
// upstairs: guard rail round the opening (open on the room side), a short well, the top two treads
const gStairs = hotGroup("stairs", "Downstairs", new THREE.Vector3(STAIR.x, 1.5, STAIR.z));
(function () {
  const R = STAIR.r + 0.05, arc = Math.PI * 2 - GAP;
  [[1.02, 0.024], [0.56, 0.014]].forEach(([y, th]) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(R, th, 8, 80, arc), railMat);
    t.rotation.set(-Math.PI / 2, 0, GAP / 2); t.position.set(STAIR.x, y, STAIR.z); t.castShadow = true; t.userData.noNav = true; gStairs.add(t);
  });
  for (let j = 0; j < 9; j++) { const a = GAP / 2 + j * arc / 8; cyl(0.02, 0.02, 1.02, railMat, STAIR.x + Math.cos(a) * R, 0.51, STAIR.z - Math.sin(a) * R, gStairs, 8); }
  const kick = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.1, 80, 1, true, GAP / 2 + Math.PI / 2, arc), mat(C.yellow, { side: THREE.DoubleSide, roughness: 0.5 }));
  kick.position.set(STAIR.x, 0.05, STAIR.z); kick.userData.noNav = true; gStairs.add(kick);   // ring-shaped: the robot's map uses an exact disc instead
  const edge = new THREE.Mesh(new THREE.RingGeometry(STAIR.r, STAIR.r + 0.045, 64), mat(C.yellow, { roughness: 0.6 }));
  edge.rotation.x = -Math.PI / 2; edge.position.set(STAIR.x, 0.006, STAIR.z); gStairs.add(edge);
  // the well only goes as deep as the slab, so nothing hangs out under the diorama; it reads as a dark drop
  const well = new THREE.Mesh(new THREE.CylinderGeometry(STAIR.r, STAIR.r, 0.3, 64, 1, true), mat(0x56626a, { side: THREE.BackSide, roughness: 0.9 }));
  well.position.set(STAIR.x, -0.15, STAIR.z); gStairs.add(well);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(STAIR.r, 64), new THREE.MeshBasicMaterial({ color: 0x0b1115 }));
  dark.rotation.x = -Math.PI / 2; dark.position.set(STAIR.x, -0.29, STAIR.z); gStairs.add(dark);
  spiral(gStairs, 0, 5, -0.29, 0.98, -0.27);
})();

/* ---------- Basement: SFC suite (hidden until you take the stairs) ---------- */
const basement = new THREE.Group(); basement.visible = false; scene.add(basement);
const WTOP = -0.31, WH = WTOP - (BY - 0.3);
const concreteTex = tex((g, w, h) => {
  g.fillStyle = "#8d9497"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 60, gr = g.createRadialGradient(x, y, 0, x, y, r), d = Math.random() < 0.5; gr.addColorStop(0, d ? "rgba(70,78,82,0.07)" : "rgba(200,206,208,0.07)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 3000; i++) { const k = Math.random(); g.fillStyle = k < 0.5 ? "rgba(255,255,255,0.2)" : "rgba(40,48,52,0.22)"; g.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4); }
  g.fillStyle = "rgba(48,56,60,0.55)"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);           // saw-cut joints
}, 512, 512);
concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping; concreteTex.repeat.set(4 * ROOMSZ / 8.4, 4 * ROOMSZ / 8.4); concreteTex.anisotropy = 8;
box(ROOMSZ, 0.3, ROOMSZ, 0x5d666b, ROOMMID, BY - 0.15, ROOMMID, basement);
dropShadow(basement, BY - 0.7);
const bFloor = new THREE.Mesh(new THREE.PlaneGeometry(ROOMSZ, ROOMSZ), new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.8, metalness: 0.02 }));
bFloor.rotation.x = -Math.PI / 2; bFloor.position.set(ROOMMID, BY + 0.002, ROOMMID); bFloor.receiveShadow = true; basement.add(bFloor);
// painted block walls
const blockTex = tex((g, w, h) => {
  g.fillStyle = "#d5dbd8"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(120,132,130,0.55)"; g.lineWidth = 2;
  for (let r = 0; r < 4; r++) { const y = r * h / 4; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let c = 0; c < 3; c++) { const x = (c + (r % 2) * 0.5) * w / 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h / 4); g.stroke(); } }
  for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.25)" : "rgba(90,100,98,0.12)"; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
}, 256, 256);
blockTex.wrapS = blockTex.wrapT = THREE.RepeatWrapping;
function blockWall(len, x, z, ry) {
  const t = blockTex.clone(); t.needsUpdate = true; t.repeat.set(len / 0.8, WH / 0.8);
  const m = plane(len, WH, new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }), x, BY - 0.3 + WH / 2, z, ry, basement); m.receiveShadow = true;
}
box(0.3, WH, ROOMSZ, 0xc9d0cd, -4.35, BY - 0.3 + WH / 2, ROOMMID, basement);
box(ROOMSZ, WH, 0.3, 0xc9d0cd, ROOMMID, BY - 0.3 + WH / 2, -4.35, basement);
blockWall(ROOMSZ, -4.199, ROOMMID, Math.PI / 2);
blockWall(ROOMSZ, ROOMMID, -4.199, 0);
box(0.34, 0.05, ROOMSZ + 0.04, 0xeef1ef, -4.35, WTOP + 0.025, ROOMMID, basement);
box(ROOMSZ + 0.04, 0.05, 0.34, 0xeef1ef, ROOMMID, WTOP + 0.025, -4.35, basement);
box(0.05, 0.9, ROOMSZ, 0x7d8f96, -4.17, BY + 0.45, ROOMMID, basement, { roughness: 0.6 });          // painted dado band
box(ROOMSZ, 0.9, 0.05, 0x7d8f96, ROOMMID, BY + 0.45, -4.17, basement, { roughness: 0.6 });
// exposed services along the tops of the walls
[[0.045, C.steel, 3.02, 0.6], [0.032, 0xb87333, 2.86, 0.35], [0.022, 0x8a9499, 2.74, 0.5]].forEach(([r, c, y, m]) => {
  cyl(r, r, ROOMSZ, c, ROOMMID, BY + y, -4.1 + r, basement, 12, { metalness: m, roughness: 0.4 }).rotation.z = Math.PI / 2;
  cyl(r, r, ROOMSZ, c, -4.1 + r, BY + y, ROOMMID, basement, 12, { metalness: m, roughness: 0.4 }).rotation.x = Math.PI / 2;
});
for (let s = -3.6; s <= 4.9; s += 1.7) { box(0.03, 0.36, 0.06, 0x6b767c, s, BY + 2.88, -4.17, basement); box(0.06, 0.36, 0.03, 0x6b767c, -4.17, BY + 2.88, s, basement); }
// wall-mounted light fittings
const fixMat = new THREE.MeshBasicMaterial({ color: 0xf2f8ff });
[[-1.6, -4.13, 0], [1.4, -4.13, 0], [-4.13, -0.6, 1], [-4.13, 1.9, 1]].forEach(([x, z, side]) => {
  const g = new THREE.Group(); g.position.set(x, BY + 2.55, z); if (side) g.rotation.y = Math.PI / 2; basement.add(g);
  box(1.2, 0.09, 0.12, 0xdfe5e8, 0, 0, 0.02, g); box(1.1, 0.04, 0.02, fixMat, 0, -0.01, 0.085, g);
});
const bLight = new THREE.PointLight(0xeef6ff, 0.55, 9, 2); bLight.position.set(-0.4, BY + 2.7, -1.2); basement.add(bLight);
// floor drain and safety striping in front of the gas cylinders
const drainTex = tex((g, w, h) => { g.fillStyle = "#59636a"; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 7); g.fill(); g.fillStyle = "#1c2226"; for (let x = 18; x < w - 12; x += 12) g.fillRect(x, 22, 5, h - 44); g.strokeStyle = "#3d464c"; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 7); g.stroke(); }, 128, 128);
const drain = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), new THREE.MeshStandardMaterial({ map: drainTex, transparent: true, roughness: 0.85, metalness: 0.1 }));
drain.rotation.x = -Math.PI / 2; drain.position.set(1.2, BY + 0.006, 0.6); drain.receiveShadow = true; basement.add(drain);
const stripeTex = tex((g, w, h) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, w, h); g.fillStyle = "#1f2428"; for (let x = -h; x < w; x += 28) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 14, h); g.lineTo(x + 14 + h, 0); g.lineTo(x + h, 0); g.fill(); } }, 256, 32);
const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.12), new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.6 }));
stripe.rotation.set(-Math.PI / 2, 0, Math.PI / 2); stripe.position.set(-3.6, BY + 0.007, -1.95); stripe.receiveShadow = true; basement.add(stripe);

// stair from the ceiling opening down to the basement floor
const gUp = hotGroup("upstairs", "Upstairs", new THREE.Vector3(STAIR.x + 0.3, BY + 0.75, STAIR.z + 0.5), basement, "down");
spiral(gUp, 0, NTREAD - 1, BY, 0.98);
cyl(0.16, 0.16, 0.04, stairSteel, STAIR.x, BY + 0.02, STAIR.z, gUp, 20);

/* SFC bench along the back wall */
const SY = BY + 1.31, SZ = -3.8, SF = -3.45;                   // bench top, module centre line, module fronts
box(4.8, 1.22, 0.78, C.cab, 0.1, BY + 0.61, -3.81, basement);
for (let x = -2.1; x <= 2.3; x += 0.8) { box(0.76, 1.0, 0.014, C.cab, x + 0.4, BY + 0.6, -3.415, basement, { roughness: 0.55 }); box(0.12, 0.014, 0.03, C.steel, x + 0.4, BY + 1.02, -3.395, basement, { metalness: 0.6 }); }
box(4.9, 0.06, 0.82, C.epoxy, 0.1, SY - 0.03, -3.8, basement);
const gSFC = hotGroup("sfc", "SFC", new THREE.Vector3(-0.35, BY + 2.75, -3.7), basement, "down");
const sBody = 0x202427, sDoor = 0x2c3236, sTrim = 0x5d676d;
function screenTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const api = { c, t, draw(...a) { draw(c.getContext("2d"), w, h, ...a); t.needsUpdate = true; } }; return api;
}
function lcdLines(g, W, H, lines) {
  g.fillStyle = "#0f1a20"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#8fe6ff"; g.font = "bold 13px monospace"; lines.forEach((l, i) => g.fillText(l, 6, 17 + i * 17));
}
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
// data system: monitor showing the live chromatogram
const MX = 1.72;
const gSfcPC = hotGroup("sfcpc", "SFC workstation", new THREE.Vector3(MX, SY + 1.0, -3.6), basement, "down");
box(0.08, 0.3, 0.08, 0x2a2f33, MX, SY + 0.15, -3.7, gSfcPC); box(0.26, 0.02, 0.2, 0x2a2f33, MX, SY + 0.01, -3.68, gSfcPC);
box(0.76, 0.48, 0.04, 0x1a1f23, MX, SY + 0.52, -3.62, gSfcPC);
const sfcScreen = screenTex(512, 304, () => {});
const sfcScreenMesh = plane(0.72, 0.43, new THREE.MeshBasicMaterial({ map: sfcScreen.t }), MX, SY + 0.52, -3.597, 0, gSfcPC);
box(0.46, 0.02, 0.15, 0x2a2f33, MX - 0.05, SY + 0.012, -3.33, gSfcPC); box(0.06, 0.02, 0.09, 0x2a2f33, MX + 0.3, SY + 0.012, -3.33, gSfcPC);
// chiller on the floor at the end of the bench, coolant lines up to the CO₂ pump head
box(0.5, 0.62, 0.56, 0xe7ebec, -2.78, BY + 0.31, -3.85, basement);
box(0.36, 0.3, 0.012, 0x3a4248, -2.78, BY + 0.3, -3.564, basement);
const chillLcd = screenTex(120, 40, lcdLines); chillLcd.draw(["COOL  5.0C", "RUN"]);
plane(0.14, 0.047, new THREE.MeshBasicMaterial({ map: chillLcd.t }), -2.78, BY + 0.53, -3.564, 0, basement);
const hoseMat2 = mat(0x2a2f33, { roughness: 0.7 });
[0, 1].forEach(i => basement.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.68 + i * 0.08, BY + 0.62, -3.95), new THREE.Vector3(-2.55 + i * 0.08, BY + 1.5, -4.05), new THREE.Vector3(AX - 0.2 + i * 0.06, SY + 0.32, -4.12)]), 30, 0.014, 8, false), hoseMat2)));
// flammables cabinet
box(0.9, 1.1, 0.55, C.yellow, 3.45, BY + 0.55, -3.86, basement, { roughness: 0.5 });
box(0.012, 0.9, 0.01, 0xb08a1c, 3.45, BY + 0.58, -3.58, basement);
plane(0.36, 0.08, new THREE.MeshBasicMaterial({ map: flamTex }), 3.45, BY + 0.95, -3.582, 0, basement);

// CO₂ supply: dip-tube cylinders on the left wall, regulators, a header to the pump; a CO₂ monitor on the wall
const gCO2 = hotGroup("co2", "CO₂ supply", new THREE.Vector3(-3.95, BY + 2.0, -1.95), basement, "down");
const co2Tex = tex((g, w, h) => { g.fillStyle = "#f1f3f4"; g.fillRect(0, 0, w, h); g.fillStyle = "#1a2228"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("CO₂", w / 2, 26); g.font = "bold 10px sans-serif"; g.fillText("LIQUID · DIP TUBE", w / 2, 42); }, 128, 50);
[-2.35, -1.95, -1.55].forEach(z => {
  const cx = -3.93;
  cyl(0.115, 0.115, 1.3, 0x59656d, cx, BY + 0.67, z, gCO2, 24, { metalness: 0.35, roughness: 0.45 });
  cyl(0.04, 0.115, 0.14, 0x59656d, cx, BY + 1.39, z, gCO2, 24, { metalness: 0.35, roughness: 0.45 });
  cyl(0.03, 0.03, 0.09, C.steel, cx, BY + 1.5, z, gCO2, 12, { metalness: 0.8 });
  box(0.07, 0.05, 0.05, 0x8a959b, cx + 0.05, BY + 1.56, z, gCO2, { metalness: 0.6 });
  const lab2 = new THREE.Mesh(new THREE.CylinderGeometry(0.117, 0.117, 0.16, 24, 1, true, Math.PI / 2 - 0.8, 1.6), new THREE.MeshStandardMaterial({ map: co2Tex, roughness: 0.5 }));
  lab2.position.set(cx, BY + 1.05, z); gCO2.add(lab2);
  gCO2.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(cx + 0.08, BY + 1.57, z), new THREE.Vector3(cx + 0.1, BY + 1.72, z + 0.06), new THREE.Vector3(-4.06, BY + 1.86, z)]), 16, 0.008, 6, false), steelLine));
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.008, 6, 32), mat(0x9aa4a9, { metalness: 0.7 })); chain.rotation.x = Math.PI / 2; chain.position.set(cx, BY + 1.1, z); gCO2.add(chain);
});
box(0.04, 0.12, 1.1, 0x6b767c, -4.16, BY + 1.1, -1.95, gCO2);
const CO2_LINE = [new THREE.Vector3(-4.06, BY + 1.86, -1.55), new THREE.Vector3(-4.06, BY + 1.86, -4.06), new THREE.Vector3(AX - 0.12, BY + 1.86, -4.06), new THREE.Vector3(AX - 0.12, SY + 0.3, -4.06), new THREE.Vector3(AX - 0.12, SY + 0.3, -4.13)];
gCO2.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(CO2_LINE, false, "chordal", 0), 80, 0.014, 8, false), steelLine));
const co2Mon = screenTex(128, 64, (g, W, H, ppm) => {
  g.fillStyle = "#0f1a20"; g.fillRect(0, 0, W, H); g.fillStyle = "#97a9b4"; g.font = "bold 11px monospace"; g.fillText("CO2 MONITOR", 8, 15);
  g.fillStyle = "#8fffb0"; g.font = "bold 24px monospace"; g.fillText(String(ppm), 8, 44); g.font = "bold 11px monospace"; g.fillText("ppm", 82, 44);
  g.fillStyle = "#3fd17a"; g.beginPath(); g.arc(W - 12, 10, 4, 0, 7); g.fill();
});
co2Mon.draw(640);
box(0.06, 0.22, 0.3, 0xe7ebec, -4.16, BY + 1.75, -0.75, basement);
plane(0.22, 0.11, new THREE.MeshBasicMaterial({ map: co2Mon.t }), -4.128, BY + 1.77, -0.75, Math.PI / 2, basement);
const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc23a3a, { transparent: true, opacity: 0.85, roughness: 0.2 }));
strobe.position.set(-4.12, BY + 1.88, -0.75); basement.add(strobe);
// anti-fatigue mat in front of the instrument bench
const matTex = tex((g, w, h) => { g.fillStyle = "#23292d"; g.fillRect(0, 0, w, h); g.fillStyle = "#2e353a"; for (let y = 4; y < h; y += 10) for (let x = 4 + ((y / 10) % 2) * 5; x < w; x += 10) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); } g.strokeStyle = "#f2c230"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); }, 256, 80);
const bmat = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 0.75), new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.95 }));
bmat.rotation.x = -Math.PI / 2; bmat.position.set(-0.25, BY + 0.008, -2.98); bmat.receiveShadow = true; basement.add(bmat);
// a steel cart with spare solvent
(function () {
  const cx = 2.35, cz = -1.75, steelM = { metalness: 0.6, roughness: 0.35 };
  [0.18, 0.62, 0.95].forEach(y => box(0.9, 0.025, 0.55, C.steel, cx, BY + y, cz, basement, steelM));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    cyl(0.014, 0.014, 0.88, C.steel, cx + sx * 0.43, BY + 0.53, cz + sz * 0.255, basement, 8, steelM);
    cyl(0.035, 0.035, 0.03, 0x2a2f33, cx + sx * 0.4, BY + 0.05, cz + sz * 0.23, basement, 12).rotation.x = Math.PI / 2;
  });
  box(0.03, 0.03, 0.5, 0x2a2f33, cx + 0.47, BY + 0.98, cz, basement);
  [[-0.28, 0x8a4b1d], [-0.05, 0x8a4b1d], [0.2, 0xe9eef0]].forEach(([dx, c], i) => {
    cyl(0.075, 0.075, 0.3, c, cx + dx, BY + 0.97 + 0.15, cz + (i % 2 ? 0.06 : -0.05), basement, 18, { roughness: 0.3, transparent: c !== 0xe9eef0, opacity: 0.92 });
    cyl(0.03, 0.03, 0.05, 0x1f2428, cx + dx, BY + 0.97 + 0.325, cz + (i % 2 ? 0.06 : -0.05), basement, 12);
  });
  box(0.32, 0.18, 0.26, 0xc9a77a, cx - 0.1, BY + 0.72, cz, basement, { roughness: 0.9 });
})();
basementClock = wallClock(basement, 2.75, BY + 2.05, -4.16, 0.24);

// tubing on the instrument fronts (the flow path), used by the live run
const peekLine = mat(C.peek, { roughness: 0.4 });
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const MIX = V3(AX + 0.27, SY + 0.43, SF + 0.04);
const FLOW = {
  co2: new THREE.CatmullRomCurve3([...CO2_LINE.slice(0, 4), V3(AX + 0.22, SY + 0.3, -4.13), V3(AX + 0.27, SY + 0.32, SF + 0.04), MIX], false, "chordal", 0),
  mod: new THREE.CatmullRomCurve3([V3(AX - 0.08, pumpMod.top + 0.3, SZ + 0.05), V3(AX + 0.05, pumpMod.top + 0.36, SZ + 0.12), V3(AX + 0.2, pumpMod.top + 0.1, SF + 0.04), V3(AX + 0.25, SY + 0.6, SF + 0.04), MIX], false, "centripetal"),
  mix: new THREE.CatmullRomCurve3([MIX, V3(BX2 - 0.24, SY + 0.43, SF + 0.04), V3(BX2 + 0.26, SY + 0.43, SF + 0.04), V3(BX2 + 0.3, SY + 0.3, SF + 0.03), V3(COL_X0 - 0.06, colY, COL_Z + 0.02), V3(COL_X0 - 0.03, colY, COL_Z)], false, "centripetal"),
  out: new THREE.CatmullRomCurve3([V3(COL_X0 + COL_L + 0.03, colY, COL_Z), V3(COL_X0 + COL_L + 0.06, colY + 0.06, COL_Z + 0.02), V3(CX2 + 0.3, ovenY + ovenH + 0.15, SF + 0.03), V3(CX2 + 0.43, ovenY + ovenH + 0.05, SF + 0.04), V3(DX - 0.2, SY + 0.35, SF + 0.04), V3(DX + 0.05, SY + 0.35, SF + 0.02), V3(DX + 0.05, bpr.top - 0.02, -3.95)], false, "centripetal"),
};
["mod", "mix", "out"].forEach(k => { const m = new THREE.Mesh(new THREE.TubeGeometry(FLOW[k], 80, 0.0065, 6, false), peekLine); m.castShadow = true; gSFC.add(m); });
gSFC.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(FLOW.co2.points.slice(3), false, "chordal", 0), 40, 0.009, 6, false), steelLine));
hotspots.find(h => h.key === "sfc").focus = { center: new THREE.Vector3(-0.35, SY + 0.45, SZ + 0.1), size: new THREE.Vector3(3.1, 1.25, 0.7) };
