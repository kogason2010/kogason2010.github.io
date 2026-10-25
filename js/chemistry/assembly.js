/* js/chemistry/assembly.js — The robot assembly line in NCA's new hall: four robot arms stack a modular HPLC on pallets
   that index along a conveyor. Autosampler first, then the detector, two pumps, the system controller and the solvent
   tray, with the column oven set alongside; a QC arch checks each finished system, and it ships off the end.
   The arms are solved each frame with simple two-link inverse kinematics, so they really reach for each part.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const ASM = {
  Z: 1.15, TOP: 0.9, PITCH: 1.6, X0: 5.2, slots: 7,              // conveyor line along +x; slot 0 is the infeed, 5 the QC arch, 6 the outfeed
  robots: [], pallets: [], phase: "work", t: 0, built: 0, dyn: null, belt: null, scan: null, qcLight: null, counter: null,
};
ASM.slotX = i => ASM.X0 + i * ASM.PITCH;

/* ---------- the HPLC modules: each is one merged, vertex-coloured mesh (plus a screen or glass where needed) ---------- */
const MOD = {
  body: 0x3a3e43, panel: 0x62676d, dark: 0x1f2226, edge: 0x2c3035, led: 0x9ff0d6, steel: 0xb9c0c4,
  W: 0.42, D: 0.5,
};
const MOD_KINDS = {
  sampler: { h: 0.4, name: "Autosampler" }, detector: { h: 0.18, name: "Detector" }, pumpA: { h: 0.18, name: "Pump A" }, pumpB: { h: 0.18, name: "Pump B" },
  controller: { h: 0.26, name: "System controller" }, tray: { h: 0.11, name: "Solvent tray" }, oven: { h: 0.82, name: "Column oven", w: 0.22 },
};
const STACK = ["sampler", "detector", "pumpA", "pumpB", "controller", "tray"];   // bottom to top
const modMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.15 });
const ledMat = new THREE.MeshBasicMaterial({ color: MOD.led, toneMapped: false });
let modScreenTex = null, ovenScreenTex = null;
function modPart(list, w, h, d, x, y, z, color) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); paint(g, (px, py, pz, c) => c.setHex(color)); list.push(g); }
function makeModule(kind) {
  const k = MOD_KINDS[kind], W = k.w || MOD.W, D = MOD.D, H = k.h, F = D / 2, g = new THREE.Group(), parts = [];
  g.userData.kind = kind; g.userData.h = H;
  if (kind === "tray") {
    modPart(parts, W, 0.05, D, 0, 0.025, 0, MOD.body);
    // the steel rail round the top, which the gripper takes hold of
    [[W - 0.04, 0.02, 0.02, 0, 0.1, F - 0.03], [W - 0.04, 0.02, 0.02, 0, 0.1, -F + 0.03], [0.02, 0.02, D - 0.04, W / 2 - 0.03, 0.1, 0], [0.02, 0.02, D - 0.04, -W / 2 + 0.03, 0.1, 0]].forEach(r => modPart(parts, ...r, MOD.steel));
    [[-W / 2 + 0.03, F - 0.03], [W / 2 - 0.03, F - 0.03], [-W / 2 + 0.03, -F + 0.03], [W / 2 - 0.03, -F + 0.03]].forEach(([x, z]) => modPart(parts, 0.02, 0.06, 0.02, x, 0.075, z, MOD.steel));
    modPart(parts, 0.02, 0.02, D - 0.06, 0, 0.11, 0, MOD.steel);                       // a handle bar across the middle
    const m = new THREE.Mesh(mergeGeos(parts), modMat); m.castShadow = true; g.add(m);
    [-0.1, 0.1].forEach(x => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 18), glass); b.position.set(x, 0.18, 0.02); g.add(b);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.17, 18), new THREE.MeshStandardMaterial({ color: x < 0 ? 0xdcecf8 : 0xf1e6f6, transparent: true, opacity: 0.55, roughness: 0.1 })); l.position.set(x, 0.135, 0.02); g.add(l);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.04, 14), new THREE.MeshStandardMaterial({ color: 0xd9dcdd, roughness: 0.5 })); c.position.set(x, 0.33, 0.02); g.add(c);
    });
    return g;
  }
  modPart(parts, W, H - 0.008, D, 0, H / 2, 0, MOD.body);
  modPart(parts, W, 0.008, D, 0, H - 0.004, 0, MOD.edge);                               // a dark seam between stacked modules
  if (kind === "sampler") {
    modPart(parts, W * 0.9, H * 0.42, 0.012, 0, H * 0.7, F + 0.006, MOD.panel); modPart(parts, W * 0.9, H * 0.36, 0.012, 0, H * 0.27, F + 0.006, MOD.panel);
    modPart(parts, W * 0.84, 0.012, 0.016, 0, H * 0.53, F + 0.014, MOD.dark); modPart(parts, W * 0.84, 0.03, 0.016, 0, 0.04, F + 0.014, MOD.dark);
  } else if (kind === "controller") {
    modPart(parts, W * 0.94, H * 0.8, 0.01, 0, H * 0.52, F + 0.005, MOD.dark);
  } else if (kind === "oven") {
    modPart(parts, W * 0.86, H * 0.5, 0.012, 0, H * 0.3, F + 0.006, MOD.panel); modPart(parts, W * 0.8, H * 0.3, 0.01, 0, H * 0.75, F + 0.005, MOD.dark);
    modPart(parts, 0.04, 0.04, 0.012, 0, H * 0.18, F + 0.014, MOD.dark);
  } else {
    // pumps and detector: a slim control strip on the left, a panel door, a dark bar near the bottom
    modPart(parts, W * 0.22, H * 0.86, 0.012, -W * 0.37, H / 2, F + 0.006, MOD.dark);
    modPart(parts, W * 0.7, H * 0.82, 0.012, W * 0.12, H / 2, F + 0.006, MOD.panel);
    modPart(parts, W * 0.62, 0.008, 0.016, W * 0.12, H * 0.16, F + 0.014, MOD.dark);
    modPart(parts, 0.012, 0.012, 0.016, -W * 0.37, H * 0.35, F + 0.014, 0xe9eef0);
    if (kind === "detector") modPart(parts, W * 0.62, 0.03, 0.016, W * 0.12, H * 0.32, F + 0.014, MOD.dark);
  }
  const m = new THREE.Mesh(mergeGeos(parts), modMat); m.castShadow = true; m.receiveShadow = true; g.add(m);
  // little mint status strips, and screens on the controller and the oven
  if (kind === "pumpA" || kind === "pumpB" || kind === "detector") { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.012, H * 0.4), ledMat); l.position.set(-W * 0.37, H * 0.62, F + 0.013); g.add(l); }
  if (kind === "controller") { const s = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, H * 0.66), new THREE.MeshBasicMaterial({ map: modScreenTex, toneMapped: false })); s.position.set(0, H * 0.53, F + 0.012); g.add(s); g.userData.screen = s; }
  if (kind === "oven") { const s = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.74, H * 0.24), new THREE.MeshBasicMaterial({ map: ovenScreenTex, toneMapped: false })); s.position.set(0, H * 0.75, F + 0.011); g.add(s); }
  return g;
}
function modTextures() {
  modScreenTex = tex((c, w, h) => {
    c.fillStyle = "#0e1a24"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8f2f8"; c.font = "bold 15px sans-serif"; c.fillText("Nexera", 10, 20);
    c.fillStyle = "#3fd17a"; c.beginPath(); c.arc(w - 50, 15, 3, 0, 7); c.fill(); c.font = "10px sans-serif"; c.fillText("READY", w - 42, 19);
    [["PRESSURE", "32.4"], ["FLOW", "0.40"], ["OVEN", "40.0"]].forEach(([k, v], i) => { const x = 8 + i * (w - 16) / 3; c.fillStyle = "#1b2a36"; c.fillRect(x, 28, (w - 16) / 3 - 6, 36); c.fillStyle = "#9fb3c2"; c.font = "8px sans-serif"; c.fillText(k, x + 4, 38); c.fillStyle = "#fff"; c.font = "bold 15px sans-serif"; c.fillText(v, x + 4, 58); });
    c.strokeStyle = "#4fa3e8"; c.lineWidth = 2; c.beginPath(); for (let x = 10; x < w - 10; x++) { const u = (x - 10) / (w - 20), y = h - 18 - 34 * Math.exp(-Math.pow((u - 0.42) / 0.03, 2)) - 18 * Math.exp(-Math.pow((u - 0.7) / 0.035, 2)); x === 10 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  }, 256, 128);
  ovenScreenTex = tex((c, w, h) => { c.fillStyle = "#0e1a24"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8f2f8"; c.font = "bold 12px sans-serif"; c.fillText("COLUMN OVEN", 8, 16); c.font = "bold 26px sans-serif"; c.fillText("40.0", 8, 48); c.fillStyle = "#3fd17a"; c.font = "10px sans-serif"; c.fillText("READY", w - 50, 48); }, 128, 64);
}

/* ---------- robot arms ---------- */
const ARM = { L1: 1.0, L2: 0.92, LG: 0.26, PED: 0.9, SH: 0.3, OFF: 0.1 };
const armWhite = 0xf1f3f2, armBlue = 0x2f6fb5, armDark = 0x2b3238;
function armMesh(build) { const parts = []; build((w, h, d, x, y, z, c) => modPart(parts, w, h, d, x, y, z, c), (r, h, x, y, z, c, rx) => { const g = new THREE.CylinderGeometry(r, r, h, 20); if (rx) g.rotateX(Math.PI / 2); g.translate(x, y, z); paint(g, (a, b, d, col) => col.setHex(c)); parts.push(g); }); const m = new THREE.Mesh(mergeGeos(parts), modMat); m.castShadow = true; return m; }
function buildArmRobot(x, z, picks) {
  const r = { x, z, picks, step: 0, t: 0, busy: false, carry: null, grip: 0, tip: new THREE.Vector3(x, 2.2, z + 0.6), home: new THREE.Vector3(x - 0.15, 2.25, z + 0.35) };
  r.tip.copy(r.home);
  // pedestal and base are static; the rest is a chain of joints
  box(0.56, ARM.PED, 0.56, armDark, x, ARM.PED / 2, z, chem, { roughness: 0.5 });
  box(0.6, 0.03, 0.6, C.yellow, x, ARM.PED + 0.015, z, chem, { roughness: 0.5 });
  const turret = new THREE.Group(); turret.position.set(x, ARM.PED + 0.03, z); ASM.dyn.add(turret); r.turret = turret;
  turret.add(armMesh((b, cy) => { cy(0.22, 0.12, 0, 0.06, 0, armWhite); cy(0.17, 0.16, 0, 0.2, 0, armWhite); cy(0.18, 0.03, 0, 0.13, 0, armBlue); b(0.2, 0.16, 0.26, ARM.OFF, ARM.SH - 0.02, 0, armWhite); }));
  const shoulder = new THREE.Group(); shoulder.position.set(ARM.OFF, ARM.SH, 0); turret.add(shoulder); r.shoulder = shoulder;
  shoulder.add(armMesh((b, cy) => { cy(0.12, 0.3, 0, 0, 0, armBlue, true); b(0.15, ARM.L1, 0.16, 0, ARM.L1 / 2, 0, armWhite); b(0.16, 0.05, 0.17, 0, ARM.L1 * 0.62, 0, armBlue); }));
  const elbow = new THREE.Group(); elbow.position.set(0, ARM.L1, 0); shoulder.add(elbow); r.elbow = elbow;
  elbow.add(armMesh((b, cy) => { cy(0.1, 0.26, 0, 0, 0, armBlue, true); b(0.12, ARM.L2, 0.13, 0, ARM.L2 / 2, 0, armWhite); }));
  const wrist = new THREE.Group(); wrist.position.set(0, ARM.L2, 0); elbow.add(wrist); r.wrist = wrist;
  wrist.add(armMesh((b, cy) => { cy(0.075, 0.2, 0, 0, 0, armBlue, true); }));
  const tool = new THREE.Group(); wrist.add(tool); r.tool = tool;
  tool.add(armMesh((b, cy) => { cy(0.06, 0.1, 0, 0.06, 0, armWhite); b(0.2, 0.05, 0.08, 0, 0.13, 0, armDark); }));
  r.fingers = [-1, 1].map(s => { const f = armMesh(b => b(0.025, 0.12, 0.07, 0, 0.2, 0, armDark)); f.position.x = s * 0.07; tool.add(f); return f; });
  // a feeder lift beside each arm, holding the next part it needs
  const fx = x - 0.85, fz = z - 0.55; r.feeder = new THREE.Vector3(fx, 0.95, fz);
  box(0.58, 0.95, 0.64, 0x56636b, fx, 0.475, fz, chem, { metalness: 0.5, roughness: 0.4 });
  box(0.6, 0.02, 0.66, C.yellow, fx, 0.96, fz, chem, { roughness: 0.5 });
  r.stock = null; refillFeeder(r, true);
  return r;
}
function refillFeeder(r, instant) {
  const kind = r.picks[r.step % r.picks.length];
  const m = makeModule(kind); m.position.copy(r.feeder); m.position.y += 0.02; ASM.dyn.add(m); r.stock = m;
  m.userData.rise = instant ? 1 : 0; if (!instant) m.scale.set(1, 0.01, 1);
}
// two-link IK in the arm's vertical plane, with the gripper kept pointing straight down
function solveArm(r) {
  const dx = r.tip.x - r.x, dz = r.tip.z - r.z, yaw = Math.atan2(-dz, dx);
  r.turret.rotation.y = yaw;
  const px = Math.hypot(dx, dz) - ARM.OFF, py = r.tip.y + ARM.LG - (ARM.PED + 0.03 + ARM.SH);
  const D = Math.min(ARM.L1 + ARM.L2 - 1e-3, Math.max(0.15, Math.hypot(px, py)));
  const phi = Math.atan2(px, py), gam = Math.acos(Math.max(-1, Math.min(1, (ARM.L1 * ARM.L1 + D * D - ARM.L2 * ARM.L2) / (2 * ARM.L1 * D))));
  const bet = Math.acos(Math.max(-1, Math.min(1, (ARM.L1 * ARM.L1 + ARM.L2 * ARM.L2 - D * D) / (2 * ARM.L1 * ARM.L2))));
  const a1 = phi - gam, a2 = Math.PI - bet, a3 = Math.PI - a1 - a2;
  r.shoulder.rotation.z = -a1; r.elbow.rotation.z = -a2; r.wrist.rotation.z = -a3;
  r.tool.rotation.y = -yaw;                                 // roll the tool so the gripper keeps facing the line
  r.fingers.forEach((f, i) => { f.position.x = (i ? 1 : -1) * (0.07 - r.grip * 0.035); });
}

/* ---------- the line ---------- */
function newPallet(slot, upTo) {
  const p = { slot, x: ASM.slotX(slot), g: new THREE.Group(), stack: [], oven: null, qc: false };
  p.g.position.set(p.x, ASM.TOP, ASM.Z); ASM.dyn.add(p.g);
  const plate = armMesh(b => { b(0.96, 0.05, 0.7, 0, 0.025, 0, 0x4a545a); [-0.35, 0.35].forEach(z => b(0.98, 0.02, 0.04, 0, 0.05, z, 0x2f6fb5)); }); p.g.add(plate);
  // pallets further down the line arrive already carrying what earlier stations added
  const order = ["sampler", "detector", "pumpA", "pumpB", "controller", "tray", "oven"];
  order.slice(0, upTo || 0).forEach(k => addToPallet(p, makeModule(k)));
  ASM.pallets.push(p); return p;
}
const STACK_X = -0.13, OVEN_X = 0.24;
function stackTop(p) { return 0.052 + p.stack.reduce((a, m) => a + m.userData.h, 0); }
function placeOn(p, kind) { return kind === "oven" ? new THREE.Vector3(OVEN_X, 0.052, 0) : new THREE.Vector3(STACK_X, stackTop(p), 0); }
function addToPallet(p, m) {
  const at = placeOn(p, m.userData.kind); m.position.copy(at); m.scale.set(1, 1, 1); p.g.add(m);
  if (m.userData.kind === "oven") p.oven = m; else p.stack.push(m);
}
// where each part is gripped: its top centre (the tray by its handle bar)
const gripHeight = kind => kind === "tray" ? 0.12 : MOD_KINDS[kind].h;

function buildAssembly() {
  modTextures();
  ASM.dyn = new THREE.Group(); chem.add(ASM.dyn);
  const x0 = ASM.slotX(0) - 0.7, x1 = ASM.slotX(ASM.slots - 1) + 0.6, L = x1 - x0, cx = (x0 + x1) / 2, Z = ASM.Z, T = ASM.TOP;
  const g = hotGroup("assembly", "Robot assembly line", new THREE.Vector3(9.8, 3.25, Z - 0.4), chem, "chem");
  // conveyor: steel frame, side rails, a dark belt whose texture runs when the line indexes
  [0.32, -0.32].forEach(dz => box(L, 0.08, 0.06, C.steel, cx, T - 0.06, Z + dz, g, { metalness: 0.6, roughness: 0.35 }));
  for (let x = x0 + 0.3; x < x1; x += 1.2) [0.3, -0.3].forEach(dz => box(0.06, T - 0.1, 0.06, 0x56636b, x, (T - 0.1) / 2, Z + dz, g, { metalness: 0.5, roughness: 0.4 }));
  box(L, 0.04, 0.56, 0x56636b, cx, 0.18, Z, g, { metalness: 0.5, roughness: 0.4 });
  const beltT = tex((c, w, h) => { c.fillStyle = "#23282c"; c.fillRect(0, 0, w, h); c.fillStyle = "#30363b"; for (let x = 0; x < w; x += 16) c.fillRect(x, 0, 6, h); }, 128, 32);
  beltT.wrapS = beltT.wrapT = THREE.RepeatWrapping; beltT.repeat.set(L / 0.25, 1);
  ASM.belt = plane(L, 0.6, new THREE.MeshStandardMaterial({ map: beltT, roughness: 0.8 }), cx, T - 0.018, Z, 0, g); ASM.belt.rotation.x = -Math.PI / 2; ASM.beltT = beltT;
  // a QC arch over slot 5 with a scanning bar of light, and a pass lamp
  const qx = ASM.slotX(5);
  [-0.55, 0.55].forEach(dz => box(0.1, 1.55, 0.1, CH.body, qx, T + 0.78, Z + dz, g));
  box(0.2, 0.14, 1.24, CH.body, qx, T + 1.6, Z, g); box(0.21, 0.04, 1.0, CH.accent, qx, T + 1.53, Z, g);
  ASM.scan = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.04), new THREE.MeshBasicMaterial({ color: 0x5ff0dc, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  ASM.scan.rotation.y = Math.PI / 2; ASM.scan.position.set(qx, T + 0.4, Z); ASM.dyn.add(ASM.scan);
  ASM.qcLight = new THREE.MeshBasicMaterial({ color: 0x334047, toneMapped: false });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), ASM.qcLight); lamp.position.set(qx, T + 1.75, Z); ASM.dyn.add(lamp);
  // outfeed: the finished system waits on rollers, then ships
  box(0.9, 0.04, 0.8, C.steel, ASM.slotX(6), T - 0.04, Z, g, { metalness: 0.6, roughness: 0.35 });
  // a low safety fence along the front, with yellow posts
  const fenceM = new THREE.MeshStandardMaterial({ color: 0xcfe6f2, transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false });
  const fz = Z + 1.0; box(L + 0.4, 0.9, 0.02, fenceM, cx, 0.6, fz, g).castShadow = false;
  for (let x = x0 - 0.2; x <= x1 + 0.25; x += (L + 0.4) / 6) box(0.07, 1.1, 0.07, C.yellow, x, 0.55, fz, g, { roughness: 0.45 });
  box(L + 0.4, 0.05, 0.05, C.yellow, cx, 1.08, fz, g, { roughness: 0.45 });
  box(L + 1.0, 0.006, 0.07, C.yellow, cx, 0.014, fz + 0.3, g).castShadow = false;
  // the four arms, each with its part list
  ASM.robots = [["sampler"], ["detector", "pumpA"], ["pumpB", "controller"], ["tray", "oven"]].map((picks, i) => buildArmRobot(ASM.slotX(i + 1), Z - 1.0, picks));
  // a sign and a running count on the back wall
  const sign = tex((c, w, h) => { c.fillStyle = "#2b3238"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.font = "800 44px 'Bricolage Grotesque', 'Segoe UI', sans-serif"; c.fillText("HPLC ASSEMBLY", 24, 58); c.fillStyle = "#9fb3c2"; c.font = "500 22px 'IBM Plex Mono', monospace"; c.fillText("AUTOMATED LINE · NCA", 26, 92); c.fillStyle = "#2f6fb5"; c.fillRect(0, h - 10, w, 10); }, 512, 128);
  plane(3.4, 0.85, new THREE.MeshBasicMaterial({ map: sign }), 8.4, 3.7, -4.18, 0, chem);
  ASM.counter = screenTex(256, 96, (c, w, h, n) => { c.fillStyle = "#0e1a24"; c.fillRect(0, 0, w, h); c.fillStyle = "#9fb3c2"; c.font = "500 15px 'IBM Plex Mono', monospace"; c.fillText("SYSTEMS BUILT", 14, 28); c.fillStyle = "#5ff0dc"; c.font = "700 46px 'IBM Plex Mono', monospace"; c.fillText(String(n), 14, 80); });
  ASM.counter.draw(0); box(1.5, 0.62, 0.06, 0x1b2228, 12.0, 3.7, -4.17, chem); plane(1.4, 0.52, new THREE.MeshBasicMaterial({ map: ASM.counter.t, toneMapped: false }), 12.0, 3.7, -4.13, 0, chem);
  // racks of boxed modules along the back wall, waiting their turn
  for (let i = 0; i < 4; i++) { const rx = 6.2 + i * 2.4; [0.4, 1.2, 2.0].forEach(y => box(1.8, 0.04, 0.6, 0x56636b, rx, y, -3.85, chem, { metalness: 0.5, roughness: 0.4 })); [-0.88, 0.88].forEach(dx => box(0.05, 2.1, 0.05, 0x56636b, rx + dx, 1.05, -3.6, chem)); [0.4, 1.2, 2.0].forEach((y, k) => [-0.55, 0, 0.55].forEach((dx, j) => { if ((i + k + j) % 4 !== 3) box(0.44, 0.34, 0.5, [0xc9a77a, 0xbfa071][(i + j) % 2], rx + dx, y + 0.19, -3.85, chem, { roughness: 0.85 }); })); }
  // pallets already in flight, so the line is busy from the start
  const preset = [0, 0, 1, 3, 5, 7, 7];                      // parts each pallet already carries: what the stations before it have added
  for (let s = 0; s < ASM.slots; s++) { const p = newPallet(s, preset[s]); if (s >= 5) p.qc = true; }
  ASM.phase = "work"; ASM.t = 0; startRobots();
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(9.0, 1.7, Z - 0.4), size: new THREE.Vector3(6.0, 2.4, 2.2) }; hotspots[hotspots.length - 1].front = [0.25, 0, 1];
}
function palletAt(slot) { return ASM.pallets.find(p => p.slot === slot); }
function startRobots() { ASM.robots.forEach((r, i) => { r.pallet = palletAt(i + 1); r.queue = r.pallet ? r.picks.slice() : []; r.busy = r.queue.length > 0; r.t = 0; r.seg = 0; }); }

// one pick-and-place: a list of moves (target, seconds), with grip and release at the right moments
const PICK_T = [0.7, 0.35, 0.2, 0.35, 0.8, 0.35, 0.2, 0.35];
const easeIO = u => u * u * (3 - 2 * u);
function robotWaypoints(r, kind) {
  const p = r.pallet, place = placeOn(p, kind).add(p.g.position), gh = gripHeight(kind);
  const fe = r.feeder.clone(); fe.y += 0.02;
  const lift = kind === "tray" ? 0.3 : 0.28;                     // clearance over whatever is already on the stack
  const aboveF = fe.clone().setY(Math.max(fe.y + gh + lift, 2.0)), atF = fe.clone().setY(fe.y + gh - 0.02);
  const aboveP = place.clone().setY(Math.max(place.y + gh + lift, 2.1)), atP = place.clone().setY(place.y + gh - 0.02);
  return [aboveF, atF, atF, aboveF, aboveP, atP, atP, aboveP];
}
function updateRobot(r, dt) {
  if (!r.busy) { r.tip.lerp(r.home, 1 - Math.exp(-dt * 3)); r.grip += (0 - r.grip) * Math.min(1, dt * 8); solveArm(r); return; }
  if (!r.way) { r.kind = r.queue[0]; r.way = robotWaypoints(r, r.kind); r.from = r.tip.clone(); r.seg = 0; r.t = 0; }
  r.t += dt; const dur = PICK_T[r.seg], u = easeIO(Math.min(1, r.t / dur));
  r.tip.lerpVectors(r.from, r.way[r.seg], u);
  if (r.seg === 2) r.grip = u;                                    // close on the part
  if (r.seg === 6) r.grip = 1 - u;                                // let go
  if (r.carry) { r.carry.position.set(r.tip.x, r.tip.y - gripHeight(r.kind) + 0.02, r.tip.z); }
  if (r.t >= dur) {
    if (r.seg === 2 && r.stock) { r.carry = r.stock; r.stock = null; }                                                  // picked up
    if (r.seg === 6 && r.carry) { addToPallet(r.pallet, r.carry); r.carry = null; r.step++; refillFeeder(r, false); }   // set down, and a new part rises
    r.from = r.way[r.seg].clone(); r.seg++; r.t = 0;
    if (r.seg >= r.way.length) { r.way = null; r.queue.shift(); if (!r.queue.length) r.busy = false; }
  }
  solveArm(r);
}
function updateAssembly(dt, time) {
  if (!ASM.dyn) return;
  ASM.robots.forEach(r => {
    updateRobot(r, dt);
    if (r.stock && r.stock.userData.rise < 1) { r.stock.userData.rise = Math.min(1, r.stock.userData.rise + dt / 0.7); r.stock.scale.y = Math.max(0.01, easeIO(r.stock.userData.rise)); }
  });
  ASM.t += dt;
  const qcP = palletAt(5);
  if (ASM.phase === "work") {
    // the QC arch sweeps the system under it, then lights green
    const sweep = Math.min(1, ASM.t / 2.4);
    ASM.scan.position.y = ASM.TOP + 0.1 + 1.3 * (0.5 - 0.5 * Math.cos(sweep * Math.PI * 2));
    ASM.scan.material.opacity = qcP ? 0.85 * (sweep < 1 ? 1 : 0) : 0;
    ASM.qcLight.color.setHex(qcP && sweep >= 1 ? 0x3fe07a : 0x334047);
    if (qcP && sweep >= 1) qcP.qc = true;
    if (ASM.robots.every(r => !r.busy) && ASM.t > 2.8) { ASM.phase = "index"; ASM.t = 0; ASM.pallets.forEach(p => { p.from = p.x; }); }
  } else {
    // index: everything moves one station along; the belt runs with it
    const u = easeIO(Math.min(1, ASM.t / 1.8));
    ASM.pallets.forEach(p => { p.x = p.from + ASM.PITCH * u; p.g.position.x = p.x; if (p.slot === ASM.slots - 1) { const s = Math.max(0.001, 1 - u); p.g.scale.set(s, s, s); p.g.position.y = ASM.TOP + u * 0.4; } });
    ASM.beltT.offset.x = (ASM.beltBase || 0) - u * ASM.PITCH / (0.25 * 1);
    ASM.scan.material.opacity = 0;
    if (ASM.t >= 1.8) {
      ASM.beltBase = ((ASM.beltBase || 0) - ASM.PITCH / 0.25) % 1;
      const out = palletAt(ASM.slots - 1);
      if (out) { ASM.dyn.remove(out.g); ASM.pallets.splice(ASM.pallets.indexOf(out), 1); ASM.built++; ASM.counter.draw(ASM.built); }
      ASM.pallets.forEach(p => { p.slot++; p.x = ASM.slotX(p.slot); p.g.position.x = p.x; });
      const fresh = newPallet(0, 0); fresh.g.scale.set(0.01, 0.01, 0.01); fresh.grow = 0;
      ASM.phase = "work"; ASM.t = 0; startRobots();
    }
  }
  ASM.pallets.forEach(p => { if (p.grow !== undefined && p.grow < 1) { p.grow = Math.min(1, p.grow + dt / 0.6); const s = Math.max(0.01, easeIO(p.grow)); p.g.scale.set(s, s, s); } });
}
