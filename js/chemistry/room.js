/* js/chemistry/room.js — The Chemistry building's LC lab: the room itself (floor, walls, window, exit door, signs, lights).
   Built the first time you drive in from the campus. Same footprint and diorama view as the Kogason lab.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const chem = new THREE.Group(); chem.visible = false; scene.add(chem);
let chemBuilt = false;
// the hall is much bigger than the Kogason lab: the LC benches stay in the back-left corner, and a robot assembly line runs across the new space to the right
const CHR = { x0: ROOM0, x1: 15.6, z0: ROOM0, z1: 7.4 }; CHR.w = CHR.x1 - CHR.x0; CHR.d = CHR.z1 - CHR.z0; CHR.cx = (CHR.x0 + CHR.x1) / 2; CHR.cz = (CHR.z0 + CHR.z1) / 2;

function buildChemRoom() {
  // slab and tiled floor (cooler, bluer tiles than the Kogason lab)
  box(CHR.w, 0.3, CHR.d, 0x66747d, CHR.cx, -0.16, CHR.cz, chem);
  const ft = tex((g, w, h) => {
    g.fillStyle = "#7a8891"; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const v = ((r * 3 + c * 5) % 4) * 4 - 6; g.fillStyle = `rgb(${146 + v},${160 + v},${172 + v})`; g.fillRect(c * s + 1.5, r * s + 1.5, s - 3, s - 3); }
    for (let i = 0; i < 2600; i++) { const k = Math.random(); g.fillStyle = k < 0.5 ? "rgba(255,255,255,0.22)" : k < 0.85 ? "rgba(40,52,60,0.22)" : "rgba(110,140,170,0.35)"; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6); }
  }, 512, 512);
  ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(CHR.w * 4.8 / 8.4, CHR.d * 4.8 / 8.4); ft.anisotropy = 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(CHR.w, CHR.d), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.6, metalness: 0.02 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CHR.cx, 0.002, CHR.cz); floor.receiveShadow = true; chem.add(floor);
  { const ds = dropShadow(chem, -0.7); ds.scale.set(CHR.w / ROOMSZ, CHR.d / ROOMSZ, 1); ds.position.set(CHR.cx + 0.25, -0.7, CHR.cz + 0.25); }
  // soft darkening where floor meets wall
  const aoC = (w, h, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), aoMat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.renderOrder = 1; chem.add(m); };
  aoC(CHR.w, 1.1, CHR.cx, 0.006, -3.65, -Math.PI / 2, 0, 0); aoC(CHR.d, 1.1, -3.65, 0.007, CHR.cz, -Math.PI / 2, 0, Math.PI / 2);
  // walls, with the exit door in the back wall (same place as the Kogason lab's)
  const DX0 = DOOR.x - DOOR.w / 2, DX1 = DOOR.x + DOOR.w / 2;
  box(0.3, 5, CHR.d, CH.wallA, -4.35, 2.35, CHR.cz, chem);
  box(DX0 - ROOM0, 5, 0.3, CH.wallB, (ROOM0 + DX0) / 2, 2.35, -4.35, chem);
  box(CHR.x1 - DX1, 5, 0.3, CH.wallB, (DX1 + CHR.x1) / 2, 2.35, -4.35, chem);
  box(DOOR.w, 4.85 - DOOR.h, 0.3, CH.wallB, DOOR.x, (4.85 + DOOR.h) / 2, -4.35, chem);
  box(0.06, 0.16, CHR.d, C.trim, -4.17, 0.08, CHR.cz, chem);
  box(DX0 - ROOM0, 0.16, 0.06, C.trim, (ROOM0 + DX0) / 2, 0.08, -4.17, chem); box(CHR.x1 - DX1, 0.16, 0.06, C.trim, (DX1 + CHR.x1) / 2, 0.08, -4.17, chem);
  box(0.34, 0.05, CHR.d + 0.04, 0xeef1ef, -4.35, 4.875, CHR.cz, chem); box(CHR.w + 0.04, 0.05, 0.34, 0xeef1ef, CHR.cx, 4.875, -4.35, chem);
  // a blue band at bench height round both walls, and the lab's name
  box(0.03, 0.12, CHR.d, CH.accent, -4.185, 2.25, CHR.cz, chem, { roughness: 0.5 });
  box(CHR.x1 - DX1, 0.12, 0.03, CH.accent, (DX1 + CHR.x1) / 2, 2.25, -4.185, chem, { roughness: 0.5 });
  box(DX0 - ROOM0, 0.12, 0.03, CH.accent, (ROOM0 + DX0) / 2, 2.25, -4.185, chem, { roughness: 0.5 });
  const nameTex = tex((g, w, h) => { g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, w, h); g.fillStyle = "#2b3238"; g.font = "800 64px 'Bricolage Grotesque', 'Segoe UI', sans-serif"; g.fillText("NCA", 8, 70); g.fillStyle = "#2f6fb5"; g.font = "500 30px 'IBM Plex Mono', monospace"; g.fillText("LIQUID CHROMATOGRAPHY LAB", 10, 112); }, 640, 128);
  plane(2.6, 0.52, new THREE.MeshBasicMaterial({ map: nameTex, transparent: true }), -4.18, 3.95, -1.4, Math.PI / 2, chem);
  // window on the left wall (the same sky as the Kogason lab's window, so it follows the lights)
  plane(1.9, 1.15, new THREE.MeshBasicMaterial({ map: winTex }), -4.192, 3.35, 2.35, Math.PI / 2, chem);
  [[3.35 + 0.6, 2.02, 0.07], [3.35 - 0.6, 2.02, 0.07]].forEach(([y, w, h]) => box(0.08, h, w, 0xeef1ef, -4.17, y, 2.35, chem));
  [2.35 - 0.98, 2.35 + 0.98, 2.35].forEach((z, i) => box(0.08, 1.2, i === 2 ? 0.05 : 0.07, 0xeef1ef, -4.17, 3.35, z, chem));
  box(0.16, 0.04, 2.1, 0xeef1ef, -4.12, 2.73, 2.35, chem);
  // ceiling light fittings on the walls
  const fix = new THREE.MeshBasicMaterial({ color: 0xf4f9ff }); FX_CHEM.fix = fix;
  [[-2.4, -4.13, 0], [0.6, -4.13, 0], [2.9, -4.13, 0], [6.6, -4.13, 0], [9.4, -4.13, 0], [12.2, -4.13, 0], [14.6, -4.13, 0], [-4.13, -0.2, 1], [-4.13, 4.6, 1]].forEach(([x, z, side]) => {
    const g = new THREE.Group(); g.position.set(x, 4.35, z); if (side) g.rotation.y = Math.PI / 2; chem.add(g);
    box(1.3, 0.09, 0.14, 0xdfe5e8, 0, 0, 0.03, g); box(1.2, 0.04, 0.02, fix, 0, -0.01, 0.105, g);
  });
  FX_CHEM.clock = wallClock(chem, 3.7, 3.5, -4.16, 0.24).h.parent;
  // fire extinguisher by the door
  cyl(0.09, 0.09, 0.55, 0xc8262b, 3.86, 0.62, -4.03, chem, 20, { roughness: 0.35 }); cyl(0.06, 0.09, 0.06, 0xc8262b, 3.86, 0.92, -4.03, chem, 20, { roughness: 0.35 });
  box(0.16, 0.025, 0.04, 0x222222, 3.9, 1.0, -4.03, chem); box(0.12, 0.14, 0.04, C.metal, 3.86, 0.92, -4.17, chem);
  // exit door: same build as the Kogason lab's, swings out onto the campus
  const gx = hotGroup("chemExit", "Exit", new THREE.Vector3(DOOR.x, 2.95, -4.05), chem, "chem");
  plane(DOOR.w + 0.2, DOOR.h + 0.1, new THREE.MeshBasicMaterial({ map: outTex }), DOOR.x, DOOR.h / 2, -4.62, 0, gx);
  [-1, 1].forEach(sd => box(0.08, DOOR.h + 0.08, 0.07, doorFrame, DOOR.x + sd * (DOOR.w / 2 + 0.04), (DOOR.h + 0.08) / 2, -4.165, gx));
  box(DOOR.w + 0.16, 0.08, 0.07, doorFrame, DOOR.x, DOOR.h + 0.04, -4.165, gx);
  const piv = new THREE.Group(); piv.position.set(DOOR.x - DOOR.w / 2 + 0.01, 0, -4.23); gx.add(piv); FX_CHEM.doorPivot = piv;
  box(DW, DOOR.h - 0.02, 0.045, mat(0x4f6f8e, { roughness: 0.45 }), DW / 2, (DOOR.h - 0.02) / 2 + 0.005, 0, piv);
  [0.026, -0.026].forEach(dz => { box(0.24, 0.62, 0.004, vision, DW * 0.68, 1.55, dz, piv).castShadow = false; });
  box(DW - 0.12, 0.05, 0.06, C.steel, DW / 2 + 0.02, 1.02, 0.05, piv, { metalness: 0.7, roughness: 0.3 });
  box(DW - 0.04, 0.22, 0.006, C.steel, DW / 2, 0.12, 0.026, piv, { metalness: 0.75, roughness: 0.3 });
  box(0.5, 0.2, 0.07, 0xf2f4f3, DOOR.x, DOOR.h + 0.32, -4.15, gx);
  plane(0.46, 0.17, new THREE.MeshBasicMaterial({ map: exitTex }), DOOR.x, DOOR.h + 0.32, -4.114, 0, gx);
  // safety: yellow floor tape in front of the instrument bench
  box(6.9, 0.006, 0.07, C.yellow, -0.4, 0.014, -2.45, chem).castShadow = false;
}

// shared bits the LC files fill in (door pivot, live instrument parts, screens)
const FX_CHEM = { doorOpen: 0, doorGoal: 0 };
function updateChemDoor(dt) {
  if (!FX_CHEM.doorPivot || Math.abs(FX_CHEM.doorGoal - FX_CHEM.doorOpen) < 1e-3) return;
  FX_CHEM.doorOpen += Math.sign(FX_CHEM.doorGoal - FX_CHEM.doorOpen) * Math.min(Math.abs(FX_CHEM.doorGoal - FX_CHEM.doorOpen), dt * 1.6);
  const e = FX_CHEM.doorOpen * FX_CHEM.doorOpen * (3 - 2 * FX_CHEM.doorOpen); FX_CHEM.doorPivot.rotation.y = e * 1.5;
}
