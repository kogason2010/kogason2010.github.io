/* js/lab/room.js — The lab room: floor, walls, window, eyewash, extinguisher, floor markings, clocks, the clickable-group helper and the exit door.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// Shell: tiled floor + two walls
const STAIR_HOLE = { x: -2.0, z: 3.35, r: 0.78 };
function slabShape() {
  const sh = new THREE.Shape(); sh.moveTo(ROOM0, -ROOM1); sh.lineTo(ROOM1, -ROOM1); sh.lineTo(ROOM1, -ROOM0); sh.lineTo(ROOM0, -ROOM0); sh.lineTo(ROOM0, -ROOM1);
  const h = new THREE.Path(); h.absarc(STAIR_HOLE.x, -STAIR_HOLE.z, STAIR_HOLE.r, 0, Math.PI * 2, true); sh.holes.push(h); return sh;
}
const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(slabShape(), { depth: 0.3, bevelEnabled: false, curveSegments: 64 }), mat(0x6c7880));
slab.rotation.x = -Math.PI / 2; slab.position.y = -0.31; slab.castShadow = slab.receiveShadow = true; lab.add(slab);
const floorTex = tex((g, w, h) => {
  g.fillStyle = "#7c8990"; g.fillRect(0, 0, w, h);
  const n = 4, s = w / n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const v = ((r * 5 + c * 3) % 4) * 4 - 6;
    g.fillStyle = `rgb(${150 + v},${161 + v},${168 + v})`; g.fillRect(c * s + 1.5, r * s + 1.5, s - 3, s - 3);
  }
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * w, y = Math.random() * h, k = Math.random();
    g.fillStyle = k < 0.5 ? "rgba(255,255,255,0.22)" : k < 0.85 ? "rgba(40,52,60,0.22)" : "rgba(120,140,155,0.35)";
    g.fillRect(x, y, 1.6, 1.6);
  }
}, 512, 512);
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(4.8 / 8.4, 4.8 / 8.4); floorTex.offset.set(2.4, 2.4); floorTex.anisotropy = 8;
const floorMesh = new THREE.Mesh(new THREE.ShapeGeometry(slabShape(), 64), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.62, metalness: 0.02 }));
floorMesh.rotation.x = -Math.PI / 2; floorMesh.position.y = 0.002; floorMesh.receiveShadow = true; lab.add(floorMesh);
const aoTex = tex((g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(18,26,32,0.5)"); gr.addColorStop(1, "rgba(18,26,32,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 8, 128);
const aoMat = new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false });
function ao(w, h, x, y, z, rx, ry, rz) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), aoMat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.renderOrder = 1; lab.add(m); }
// back wall pieces around the door opening
const DX0 = DOOR.x - DOOR.w / 2, DX1 = DOOR.x + DOOR.w / 2;
ao(ROOMSZ, 1.1, ROOMMID, 0.006, -3.65, -Math.PI / 2, 0, 0);
ao(ROOMSZ, 1.1, -3.65, 0.007, ROOMMID, -Math.PI / 2, 0, Math.PI / 2);
ao(DX0 - ROOM0, 0.9, (ROOM0 + DX0) / 2, 0.45, -4.195, 0, 0, Math.PI);
ao(ROOM1 - DX1, 0.9, (DX1 + ROOM1) / 2, 0.45, -4.195, 0, 0, Math.PI);
ao(ROOMSZ, 0.9, -4.195, 0.45, ROOMMID, 0, Math.PI / 2, Math.PI);
box(0.3, 5, ROOMSZ, C.wallA, -4.35, 2.35, ROOMMID);
box(DX0 - ROOM0, 5, 0.3, C.wallB, (ROOM0 + DX0) / 2, 2.35, -4.35);
box(ROOM1 - DX1, 5, 0.3, C.wallB, (DX1 + ROOM1) / 2, 2.35, -4.35);
box(DOOR.w, 4.85 - DOOR.h, 0.3, C.wallB, DOOR.x, (4.85 + DOOR.h) / 2, -4.35);
box(0.06, 0.16, ROOMSZ, C.trim, -4.17, 0.08, ROOMMID);
box(DX0 - ROOM0, 0.16, 0.06, C.trim, (ROOM0 + DX0) / 2, 0.08, -4.17);
box(ROOM1 - DX1, 0.16, 0.06, C.trim, (DX1 + ROOM1) / 2, 0.08, -4.17);
box(0.34, 0.05, ROOMSZ + 0.04, 0xeef1ef, -4.35, 4.875, ROOMMID);
box(ROOMSZ + 0.04, 0.05, 0.34, 0xeef1ef, ROOMMID, 4.875, -4.35);
box(6.0, 0.14, 0.06, C.steel, 0.4, 1.55, -4.18, null, { metalness: 0.5, roughness: 0.4 });
for (let x = -1.4; x < 2.6; x += 0.9) box(0.12, 0.08, 0.02, 0xffffff, x, 1.55, -4.14);
const signTex = tex((g, w, h) => {
  g.fillStyle = "#1f9a4f"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#fff"; g.fillRect(w * 0.42, h * 0.18, w * 0.16, h * 0.5); g.fillRect(w * 0.25, h * 0.35, w * 0.5, h * 0.16);
  g.font = "bold 14px sans-serif"; g.textAlign = "center"; g.fillText("EYEWASH", w / 2, h * 0.9);
}, 96, 96);
plane(0.5, 0.5, new THREE.MeshBasicMaterial({ map: signTex }), -4.19, 2.4, -0.5, Math.PI / 2);
// window above the instrument bench (sky changes with the lights)
const winCanvas = document.createElement("canvas"); winCanvas.width = 128; winCanvas.height = 96;
const winTex = new THREE.CanvasTexture(winCanvas); winTex.encoding = THREE.sRGBEncoding;
function paintWindow(nightOn) {
  const g = winCanvas.getContext("2d"), W = 128, H = 96, gr = g.createLinearGradient(0, 0, 0, H);
  if (nightOn) { gr.addColorStop(0, "#0b1433"); gr.addColorStop(1, "#24366a"); } else { gr.addColorStop(0, "#6fa8e8"); gr.addColorStop(1, "#cfe6f7"); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = nightOn ? "#1a2448" : "#8fb3c9";
  [[0, 70, 30, 26], [26, 60, 20, 36], [44, 74, 28, 22], [70, 56, 22, 40], [90, 68, 38, 28]].forEach(b => g.fillRect(b[0], b[1], b[2], b[3]));
  if (nightOn) { g.fillStyle = "#ffe9a8"; for (let i = 0; i < 18; i++) g.fillRect(4 + (i * 37) % 120, 62 + (i * 13) % 30, 2, 2); g.fillStyle = "#fff"; [[12, 10], [50, 22], [96, 8], [110, 30]].forEach(p => g.fillRect(p[0], p[1], 1.5, 1.5)); }
  winTex.needsUpdate = true;
}
paintWindow(false);
plane(1.9, 1.15, new THREE.MeshBasicMaterial({ map: winTex }), -4.192, 3.6, 1.75, Math.PI / 2);
[[3.6 + 0.6, 2.02, 0.07], [3.6 - 0.6, 2.02, 0.07]].forEach(([y, w, h]) => box(0.08, h, w, 0xeef1ef, -4.17, y, 1.75));
[1.75 - 0.98, 1.75 + 0.98, 1.75].forEach((z, i) => box(0.08, 1.2, i === 2 ? 0.05 : 0.07, 0xeef1ef, -4.17, 3.6, z));
box(0.16, 0.04, 2.1, 0xeef1ef, -4.12, 2.98, 1.75);
const winGlow = new THREE.PointLight(0xcfe6ff, 0.35, 5, 2); winGlow.position.set(-3.5, 3.4, 1.75); scene.add(winGlow);
// plumbed eyewash: supply pipe, arm, bowl, two spray heads with caps, push flag, drain
(function () {
  const EZ = -0.5, BXW = -3.82, BY = 1.42, chrome = { metalness: 0.8, roughness: 0.25 };
  cyl(0.025, 0.025, BY - 0.05, C.steel, -4.12, (BY - 0.05) / 2, EZ - 0.12, null, 10, chrome);
  const arm = cyl(0.025, 0.025, 0.3, C.steel, -3.97, BY - 0.07, EZ - 0.12, null, 10, chrome); arm.rotation.z = Math.PI / 2;
  cyl(0.025, 0.025, 0.12, C.steel, BXW, BY - 0.07, EZ - 0.06, null, 10, chrome).rotation.x = Math.PI / 2;
  cyl(0.2, 0.11, 0.11, C.yellow, BXW, BY, EZ, null, 32, { roughness: 0.4 });
  cyl(0.17, 0.17, 0.01, 0xd9a91f, BXW, BY + 0.05, EZ, null, 32);
  [-0.07, 0.07].forEach(dz => {
    cyl(0.022, 0.022, 0.09, C.steel, BXW, BY + 0.08, EZ + dz, null, 10, chrome);
    cyl(0.034, 0.034, 0.025, 0x1f9a4f, BXW, BY + 0.135, EZ + dz, null, 14);
  });
  const flag = box(0.03, 0.12, 0.16, C.yellow, BXW + 0.24, BY - 0.02, EZ, null); flag.rotation.z = -0.25;
  cyl(0.01, 0.01, 0.22, C.steel, BXW + 0.13, BY - 0.04, EZ, null, 8, chrome).rotation.z = Math.PI / 2;
  cyl(0.03, 0.03, BY - 0.06, C.steel, BXW, (BY - 0.06) / 2, EZ, null, 10, chrome);
  box(0.5, 0.004, 0.5, 0x1f9a4f, BXW + 0.05, 0.013, EZ).castShadow = false;
})();
// fire extinguisher + sign on the left wall
(function () {
  const fz = 3.75, fxw = -4.06;
  box(0.04, 0.14, 0.12, C.metal, -4.17, 1.42, fz);
  cyl(0.09, 0.09, 0.55, 0xc8262b, fxw, 1.12, fz, null, 20, { roughness: 0.35 });
  cyl(0.06, 0.09, 0.06, 0xc8262b, fxw, 1.42, fz, null, 20, { roughness: 0.35 });
  cyl(0.025, 0.025, 0.08, 0x222222, fxw, 1.49, fz, null, 10);
  box(0.16, 0.025, 0.04, 0x222222, fxw + 0.04, 1.53, fz);
  const hosePts = [new THREE.Vector3(fxw + 0.02, 1.48, fz + 0.03), new THREE.Vector3(fxw + 0.1, 1.3, fz + 0.09), new THREE.Vector3(fxw + 0.1, 0.95, fz + 0.09)];
  const hm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hosePts), 20, 0.012, 6, false), mat(0x222222)); lab.add(hm);
  const fsTex = tex((g, w, h) => { g.fillStyle = "#c8262b"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText("FIRE", w / 2, h * 0.45); g.fillText("EXTINGUISHER", w / 2, h * 0.78); }, 128, 64);
  plane(0.36, 0.18, new THREE.MeshBasicMaterial({ map: fsTex }), -4.19, 1.95, fz, Math.PI / 2);
})();
// yellow floor marking in front of the instrument bench
box(0.07, 0.006, 2.8, C.yellow, -2.72, 0.014, 1.45).castShadow = false;
box(1.45, 0.006, 0.07, C.yellow, -3.42, 0.014, 0.08).castShadow = false;

// soft drop shadow beneath the diorama
const dropTex = tex((g, w, h) => {
  g.shadowColor = "rgba(16,26,34,0.55)"; g.shadowBlur = 70; g.shadowOffsetX = w;
  g.fillStyle = "#000"; g.fillRect(-w + 110, 110, w - 220, h - 220);
}, 512, 512);
const dropMat = new THREE.MeshBasicMaterial({ map: dropTex, transparent: true, depthWrite: false, opacity: 0.8 });
function dropShadow(parent, y) { const sz = 12.5 * ROOMSZ / 8.4, m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), dropMat); m.rotation.x = -Math.PI / 2; m.position.set(ROOMMID + 0.25, y, ROOMMID + 0.25); m.renderOrder = -1; m.userData.noNav = m.userData.noSample = true; parent.add(m); return m; }
dropShadow(lab, -0.7);

// a wall clock that keeps the visitor's local time
const clocks = [];
let basementClock = null;
function wallClock(parent, x, y, z, r) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const face = cyl(r, r, 0.03, 0xf6f7f5, 0, 0, 0, g, 48, { roughness: 0.4 }); face.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.016, 8, 56), mat(0x2b3136, { roughness: 0.4 })); rim.position.z = 0.012; g.add(rim);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, t = box(i % 3 ? 0.008 : 0.014, r * (i % 3 ? 0.1 : 0.16), 0.004, 0x2b3136, Math.sin(a) * r * 0.8, Math.cos(a) * r * 0.8, 0.017, g); t.rotation.z = -a; t.castShadow = false; }
  const hand = (len, w, c, z) => { const p = new THREE.Group(); p.position.z = z; g.add(p); const b = box(w, len, 0.004, c, 0, len * 0.4, 0, p); b.castShadow = false; return p; };
  const c = { h: hand(r * 0.5, 0.016, 0x1f2428, 0.02), m: hand(r * 0.74, 0.011, 0x1f2428, 0.024), s: hand(r * 0.82, 0.005, 0xd23c3c, 0.028) };
  const hub = cyl(0.012, 0.012, 0.01, 0xd23c3c, 0, 0, 0.032, g, 12); hub.rotation.x = Math.PI / 2;
  clocks.push(c); return c;
}
function updateClocks() {
  const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
  clocks.forEach(c => { c.s.rotation.z = -Math.floor(s) / 60 * Math.PI * 2; c.m.rotation.z = -m / 60 * Math.PI * 2; c.h.rotation.z = -h / 12 * Math.PI * 2; });
}
wallClock(lab, 0.2, 3.7, -4.16, 0.26);

/* ---------- Exit door: back wall, past the robot dock. Opens onto the campus. ---------- */
const gDoor = hotGroup("exit", "Exit", new THREE.Vector3(DOOR.x, 2.95, -4.05));
// what you see through the open door: sky, distant trees, lawn and the path
const outTex = tex((g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, "#7fb3e6"); sky.addColorStop(1, "#d9ecf7"); g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.55);
  g.fillStyle = "#5f8f63"; for (let x = -10; x < w + 20; x += 18) { g.beginPath(); g.arc(x, h * 0.53, 14 + (x * 7) % 9, Math.PI, 0); g.fill(); }
  const grass = g.createLinearGradient(0, h * 0.53, 0, h); grass.addColorStop(0, "#8dbb6a"); grass.addColorStop(1, "#6e9f52"); g.fillStyle = grass; g.fillRect(0, h * 0.53, w, h);
  g.fillStyle = "#cfcac0"; g.beginPath(); g.moveTo(w * 0.42, h * 0.56); g.lineTo(w * 0.58, h * 0.56); g.lineTo(w * 0.95, h); g.lineTo(w * 0.05, h); g.closePath(); g.fill();
}, 128, 256);
plane(DOOR.w + 0.2, DOOR.h + 0.1, new THREE.MeshBasicMaterial({ map: outTex }), DOOR.x, DOOR.h / 2, -4.62, 0, gDoor);
const doorFrame = mat(0xe9edee, { roughness: 0.4 });
[-1, 1].forEach(sd => box(0.08, DOOR.h + 0.08, 0.07, doorFrame, DOOR.x + sd * (DOOR.w / 2 + 0.04), (DOOR.h + 0.08) / 2, -4.165, gDoor));
box(DOOR.w + 0.16, 0.08, 0.07, doorFrame, DOOR.x, DOOR.h + 0.04, -4.165, gDoor);
// the leaf hangs on a pivot at its hinge edge and swings outward
const doorPivot = new THREE.Group(); doorPivot.position.set(DOOR.x - DOOR.w / 2 + 0.01, 0, -4.23); gDoor.add(doorPivot);
const DW = DOOR.w - 0.03, leafMat = mat(0x5f7f96, { roughness: 0.45 });
box(DW, DOOR.h - 0.02, 0.045, leafMat, DW / 2, (DOOR.h - 0.02) / 2 + 0.005, 0, doorPivot);
const vision = new THREE.MeshStandardMaterial({ color: 0x9fc4dd, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55 });
[0.026, -0.026].forEach(dz => box(0.24, 0.62, 0.004, vision, DW * 0.68, 1.55, dz, doorPivot).castShadow = false);
box(DW - 0.12, 0.05, 0.06, C.steel, DW / 2 + 0.02, 1.02, 0.05, doorPivot, { metalness: 0.7, roughness: 0.3 });          // push bar
[0.08, DW - 0.06].forEach(x => box(0.05, 0.1, 0.07, 0x9aa4a9, x, 1.02, 0.045, doorPivot, { metalness: 0.6 }));
box(DW - 0.04, 0.22, 0.006, C.steel, DW / 2, 0.12, 0.026, doorPivot, { metalness: 0.75, roughness: 0.3 });              // kick plate
box(0.36, 0.05, 0.05, 0x8a959b, 0.3, DOOR.h - 0.12, 0.05, doorPivot, { metalness: 0.5 });                              // closer
// EXIT sign
const exitTex = tex((g, w, h) => { g.fillStyle = "#f7faf8"; g.fillRect(0, 0, w, h); g.fillStyle = "#13a04a"; g.font = "bold 46px sans-serif"; g.textAlign = "center"; g.fillText("EXIT", w / 2, h * 0.72); }, 192, 72);
box(0.5, 0.2, 0.07, 0xf2f4f3, DOOR.x, DOOR.h + 0.32, -4.15, gDoor);
plane(0.46, 0.17, new THREE.MeshBasicMaterial({ map: exitTex }), DOOR.x, DOOR.h + 0.32, -4.114, 0, gDoor);
let doorOpen = 0, doorGoal = 0;
function updateDoor(dt) {
  if (Math.abs(doorGoal - doorOpen) < 1e-3) return;
  doorOpen += Math.sign(doorGoal - doorOpen) * Math.min(Math.abs(doorGoal - doorOpen), dt * 1.6);
  const e = doorOpen * doorOpen * (3 - 2 * doorOpen); doorPivot.rotation.y = e * 1.5;
}
