/* instruments/nca-lc-pc/model.js — The LC workstation PC: shows the UHPLC run and opens the LC app.
   js/chemistry/lc.js draws the screen.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js calls.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildLcWorkstation (js/chemistry/instruments.js) */
"use strict";

function buildLcWorkstation() {
  const T = CH.top;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const MXC = -0.85;
  const gPC = hotGroup("lcpc", "LC workstation", V3(MXC, T + 0.9, -3.4), chem, "chem");
  box(0.08, 0.3, 0.08, 0x2a2f33, MXC, T + 0.15, -3.72, gPC); box(0.26, 0.02, 0.2, 0x2a2f33, MXC, T + 0.01, -3.7, gPC);
  box(0.76, 0.48, 0.04, 0x1a1f23, MXC, T + 0.52, -3.64, gPC);
  const lcScreen = screenTex(512, 304, () => {});
  const lcScreenMesh = plane(0.72, 0.43, new THREE.MeshBasicMaterial({ map: lcScreen.t }), MXC, T + 0.52, -3.617, 0, gPC);
  box(0.46, 0.02, 0.15, 0x2a2f33, MXC - 0.05, T + 0.012, -3.35, gPC); box(0.06, 0.02, 0.09, 0x2a2f33, MXC + 0.3, T + 0.012, -3.35, gPC);
  Object.assign(FX_CHEM, { lcScreen, lcScreenMesh });
}
