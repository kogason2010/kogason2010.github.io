/* js/lab/wall-items.js — Whiteboard (Contact) and reagent cabinet (About).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// Whiteboard (contact)
const gBoard = hotGroup("contact", "Contact", new THREE.Vector3(3.2, 4.0, -4.0));
const boardTex = tex((g, w, h) => {
  g.fillStyle = "#fbfcfc"; g.fillRect(0, 0, w, h);
  g.lineCap = "round"; g.font = "bold 22px 'Comic Sans MS', cursive";
  g.fillStyle = "#0a5fb4"; g.fillText("https://", 18, 40);
  g.fillStyle = "#c23a3a"; g.fillText("trentkoga.com", 18, 70);
  g.strokeStyle = "#0a5fb4"; g.lineWidth = 3; g.beginPath(); g.moveTo(20, 140);
  for (let x = 20; x < 230; x += 4) g.lineTo(x, 140 - 40 * Math.exp(-Math.pow((x - 120) / 18, 2)) - 15 * Math.exp(-Math.pow((x - 180) / 10, 2)));
  g.stroke();
  g.strokeStyle = "#1f262b"; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 145); g.lineTo(235, 145); g.stroke();
}, 256, 160);
box(1.4, 0.92, 0.04, C.steel, 3.2, 3.35, -4.18, gBoard, { metalness: 0.4 });
plane(1.32, 0.84, new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.4 }), 3.2, 3.35, -4.155, 0, gBoard);
box(1.3, 0.04, 0.08, C.steel, 3.2, 2.87, -4.12, gBoard);
[0x0a5fb4, 0xc23a3a, 0x1f262b].forEach((c, i) => cyl(0.015, 0.015, 0.14, c, 3.0 + i * 0.12, 2.9, -4.11, gBoard, 8).rotation.z = Math.PI / 2);

// Lab coat + waste bin (decor)
box(0.08, 0.06, 0.12, C.steel, 3.5, 2.35, -4.14);
box(0.55, 1.1, 0.12, C.coat, 3.5, 1.75, -4.08);
box(0.13, 0.9, 0.11, C.coat, 3.2, 1.8, -4.06).rotation.z = 0.06;
box(0.13, 0.9, 0.11, C.coat, 3.8, 1.8, -4.06).rotation.z = -0.06;
cyl(0.24, 0.2, 0.6, C.yellow, 2.75, 0.3, -3.95);
cyl(0.25, 0.25, 0.05, 0x2a2f33, 2.75, 0.62, -3.95);

// Reagent cabinet (about)
const gCab = hotGroup("about", "About", new THREE.Vector3(-3.85, 3.35, -2.0));
const CX = -3.9, CZ = -2.0;
box(0.55, 2.7, 0.06, C.cab, CX, 1.35, CZ - 0.8, gCab);
box(0.55, 2.7, 0.06, C.cab, CX, 1.35, CZ + 0.8, gCab);
box(0.04, 2.7, 1.6, 0xdfe5e8, CX - 0.26, 1.35, CZ, gCab);
box(0.55, 0.06, 1.66, C.cab, CX, 2.72, CZ, gCab);
box(0.55, 0.8, 1.6, C.cab, CX, 0.4, CZ, gCab);
box(0.02, 0.6, 0.74, 0xdfe5e8, CX + 0.28, 0.4, CZ - 0.4, gCab); box(0.02, 0.6, 0.74, 0xdfe5e8, CX + 0.28, 0.4, CZ + 0.4, gCab);
const corr = tex((g, w, h) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, w, h); g.fillStyle = "#1a242a"; g.font = "bold 13px sans-serif"; g.textAlign = "center"; g.fillText("CORROSIVES", w / 2, h * 0.62); }, 128, 32);
plane(0.6, 0.15, new THREE.MeshBasicMaterial({ map: corr }), CX + 0.3, 0.6, CZ, Math.PI / 2, gCab);
[1.4, 2.05].forEach(y => box(0.5, 0.04, 1.56, C.cab, CX, y, CZ, gCab));
const bcols = [C.amber, 0xe8eef1, 0x8fd0ff, C.amber, 0xffd9a0, 0xe8eef1];
for (let s = 0; s < 3; s++) {
  const y = [0.82, 1.42, 2.07][s];
  if (s === 0) { for (let i = 0; i < 6; i++) box(0.36, 0.5, 0.1, [C.line, 0x51616c, C.yellow][i % 3], CX - 0.02, y + 0.27, CZ - 0.6 + i * 0.13, gCab); continue; }
  for (let i = 0; i < 6; i++) bottle(CX, y, CZ - 0.6 + i * 0.24, 0.07, 0.3 + ((i * 7 + s) % 3) * 0.05, bcols[(i + s) % 6], i % 2 ? 0x111111 : C.line, gCab);
}
box(0.02, 1.85, 0.78, glass, CX + 0.28, 1.78, CZ - 0.39, gCab).castShadow = false;
box(0.02, 1.85, 0.78, glass, CX + 0.28, 1.78, CZ + 0.39, gCab).castShadow = false;
box(0.04, 0.3, 0.04, C.steel, CX + 0.31, 1.78, CZ - 0.06, gCab); box(0.04, 0.3, 0.04, C.steel, CX + 0.31, 1.78, CZ + 0.06, gCab);
