/* instruments/lab-contact-board/model.js — Whiteboard on the back wall (the Contact tag).
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room. */
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
