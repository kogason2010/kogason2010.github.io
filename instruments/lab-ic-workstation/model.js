/* instruments/lab-ic-workstation/model.js — The PC beside the Nexera IC, running the IC software.
   Monitor (with an anion chromatogram), keyboard and mouse; faces +x. Its tower is under the bench, in the IC's model.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     icScreen (js/lab/merge.js, js/lab/ic-workstation.js) */
"use strict";

// the IC bench: its front edge, its top, and where along it the PC sits (instruments/lab-nexera-ic sets up the same bench)
const ICPC = { x: -3.55, top: 1.31, z: 1.75 - 0.72 };

// a simple desktop computer next to the IC, running the instrument software
const icSoft = tex((g, W, H) => {
  g.fillStyle = "#e9eef2"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1d2c36"; g.fillRect(0, 0, W, 22);
  g.fillStyle = "#e9eef2"; g.font = "bold 12px sans-serif"; g.fillText("IC Data Acquisition  ·  Anions_std_03", 10, 15);
  g.fillStyle = "#ffffff"; g.fillRect(8, 30, W * 0.64, H - 62); g.strokeStyle = "#c7d0d6"; g.strokeRect(8, 30, W * 0.64, H - 62);
  const cw = W * 0.64, peaks = [[0.16, 0.45, "F"], [0.31, 0.85, "Cl"], [0.46, 0.25, "NO2"], [0.56, 0.3, "Br"], [0.66, 0.55, "NO3"], [0.78, 0.35, "PO4"], [0.9, 0.75, "SO4"]];
  g.strokeStyle = "#0b6f9a"; g.lineWidth = 1.6; g.beginPath();
  for (let x = 0; x <= cw - 8; x++) { const t = x / (cw - 8); let y = 0.03; peaks.forEach(p => { y += p[1] * Math.exp(-Math.pow((t - p[0]) / 0.011, 2)); }); const py = H - 40 - y * (H - 90); x ? g.lineTo(12 + x, py) : g.moveTo(12 + x, py); }
  g.stroke();
  g.fillStyle = "#4f5965"; g.font = "10px sans-serif"; peaks.forEach(p => g.fillText(p[2], 12 + p[0] * (cw - 8) - 6, H - 44 - p[1] * (H - 90) - 4));
  g.fillText("µS/cm", 14, 44); g.fillText("min", cw - 18, H - 36);
  const tx = W * 0.68; g.fillStyle = "#ffffff"; g.fillRect(tx, 30, W - tx - 8, H - 62); g.strokeStyle = "#c7d0d6"; g.strokeRect(tx, 30, W - tx - 8, H - 62);
  g.fillStyle = "#15191e"; g.font = "bold 10px sans-serif"; g.fillText("Ion", tx + 6, 44); g.fillText("RT min", tx + 40, 44);
  g.font = "10px sans-serif"; peaks.forEach((p, i) => { g.fillText(p[2], tx + 6, 60 + i * 14); g.fillText((2 + p[0] * 14).toFixed(2), tx + 40, 60 + i * 14); });
  g.fillStyle = "#1d2c36"; g.fillRect(0, H - 24, W, 24); g.fillStyle = "#3fd17a"; g.fillRect(10, H - 16, 8, 8);
  g.fillStyle = "#cfe3ee"; g.fillText("Ready  ·  run 4 of 12", 24, H - 8);
}, 320, 190);
const gPC = hotGroup("icpc", "IC workstation", new THREE.Vector3(ICPC.x, ICPC.top + 1.0, ICPC.z));
box(0.04, 0.5, 0.84, C.metal, ICPC.x - 0.2, ICPC.top + 0.44, ICPC.z, gPC);
const icScreen = plane(0.78, 0.44, new THREE.MeshBasicMaterial({ map: icSoft }), ICPC.x - 0.178, ICPC.top + 0.44, ICPC.z, Math.PI / 2, gPC);
box(0.06, 0.2, 0.06, C.metal, ICPC.x - 0.24, ICPC.top + 0.1, ICPC.z, gPC);
box(0.22, 0.02, 0.28, C.metal, ICPC.x - 0.22, ICPC.top + 0.01, ICPC.z, gPC);
box(0.2, 0.025, 0.56, 0x3a4047, ICPC.x + 0.18, ICPC.top + 0.013, ICPC.z, gPC);
box(0.11, 0.02, 0.07, 0x3a4047, ICPC.x + 0.2, ICPC.top + 0.012, ICPC.z - 0.4, gPC);
