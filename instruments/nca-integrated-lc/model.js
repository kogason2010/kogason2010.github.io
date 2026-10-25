/* instruments/nca-integrated-lc/model.js — An integrated LC: everything in one cabinet, touchscreen and solvent tray on top.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildIntegratedLc (js/chemistry/instruments.js) */
"use strict";

function buildIntegratedLc() {
  const T = CH.top, BZ = -3.8;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const steelM = { metalness: 0.6, roughness: 0.35 };
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
}
