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

/* ---------- the parts: each module and each arm is an instrument (instruments/nca-hplc-modules, instruments/nca-robot-arm) ---------- */
// put the arm's next part on its feeder lift, rising into place unless instant
function refillFeeder(r, instant) {
  const kind = r.picks[r.step % r.picks.length];
  const m = makeModule(kind); m.position.copy(r.feeder); m.position.y += 0.02; ASM.dyn.add(m); r.stock = m;
  m.userData.rise = instant ? 1 : 0; if (!instant) m.scale.set(1, 0.01, 1);
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
  ASM.robots = [["sampler"], ["detector", "pumpA"], ["pumpB", "controller"], ["tray", "oven"]].map((picks, i) => { const r = buildArmRobot(ASM.slotX(i + 1), Z - 1.0, picks, ASM.dyn); refillFeeder(r, true); return r; });
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
