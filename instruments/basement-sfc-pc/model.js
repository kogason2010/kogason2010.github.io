/* instruments/basement-sfc-pc/model.js — The SFC workstation: the monitor that shows the live run.
   js/basement/sfc.js draws the screen.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     sfcScreen, sfcScreenMesh (js/basement/sfc.js) */
"use strict";

const PC_TOP = BY + 1.31;   // the SFC bench top it stands on

// data system: monitor showing the live chromatogram
const MX = 1.72;
const gSfcPC = hotGroup("sfcpc", "SFC workstation", new THREE.Vector3(MX, PC_TOP + 1.0, -3.6), basement, "down");
box(0.08, 0.3, 0.08, 0x2a2f33, MX, PC_TOP + 0.15, -3.7, gSfcPC); box(0.26, 0.02, 0.2, 0x2a2f33, MX, PC_TOP + 0.01, -3.68, gSfcPC);
box(0.76, 0.48, 0.04, 0x1a1f23, MX, PC_TOP + 0.52, -3.62, gSfcPC);
const sfcScreen = screenTex(512, 304, () => {});
const sfcScreenMesh = plane(0.72, 0.43, new THREE.MeshBasicMaterial({ map: sfcScreen.t }), MX, PC_TOP + 0.52, -3.597, 0, gSfcPC);
box(0.46, 0.02, 0.15, 0x2a2f33, MX - 0.05, PC_TOP + 0.012, -3.33, gSfcPC); box(0.06, 0.02, 0.09, 0x2a2f33, MX + 0.3, PC_TOP + 0.012, -3.33, gSfcPC);
