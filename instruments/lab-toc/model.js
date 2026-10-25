/* instruments/lab-toc/model.js — TOC analyzer on the island bench, with its carousel autosampler and carrier-gas cylinder.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     ITOP, TX, TZ (js/core/lights.js)
     furnaceMat (js/main.js)
     rotor (js/lab/merge.js, js/main.js) */
"use strict";

// the island bench this sits on (js/lab/island.js builds the bench at the same place)
const IX = 1.4, IZ = 1.3, ITOP = 1.26;

const gTOC = hotGroup("toc", "TOC analyzer", new THREE.Vector3(IX + 0.6, 2.8, IZ));
// TOC analyzer on the right, carousel autosampler on its left
const TX = IX + 0.95, TZ = IZ - 0.05, TW = 0.62, TH = 0.95, TD = 0.82, TF = TZ + TD / 2;
const tBody = 0xe4e7e8, tDark = 0x2b3136, BV = 0.03;
// body: side profile with a sloped upper front and rounded top corners, extruded across the width with beveled edges
const Dp = TD - 2 * BV, Hp = TH - 2 * BV, SLOPE = 0.07, KNEE = 0.42;
const prof = new THREE.Shape();
prof.moveTo(-Dp / 2, 0);
prof.lineTo(Dp / 2, 0);
prof.lineTo(Dp / 2, KNEE);
prof.lineTo(Dp / 2 - SLOPE, Hp - 0.07);
prof.quadraticCurveTo(Dp / 2 - SLOPE - 0.01, Hp, Dp / 2 - SLOPE - 0.08, Hp);
prof.lineTo(-Dp / 2 + 0.07, Hp);
prof.quadraticCurveTo(-Dp / 2, Hp, -Dp / 2, Hp - 0.07);
prof.closePath();
const bodyGeo = new THREE.ExtrudeGeometry(prof, { depth: TW - 2 * BV, bevelEnabled: true, bevelSize: BV, bevelThickness: BV, bevelSegments: 5, curveSegments: 10 });
bodyGeo.translate(0, 0, -(TW - 2 * BV) / 2);
const tocBody = new THREE.Mesh(bodyGeo, mat(tBody, { roughness: 0.45 }));
tocBody.rotation.y = -Math.PI / 2;
tocBody.position.set(TX, ITOP + BV, TZ);
tocBody.castShadow = true; tocBody.receiveShadow = true; gTOC.add(tocBody);
// vents on the right side
for (let i = 0; i < 7; i++) box(0.006, 0.012, 0.3, 0xb2b9bd, TX + TW / 2 + 0.002, ITOP + 0.5 + i * 0.045, TZ - 0.12, gTOC);
// upper fascia follows the sloped front
const lean = Math.atan2(SLOPE, Hp - 0.07 - KNEE);
const face = new THREE.Group();
face.position.set(TX, ITOP + BV + KNEE, TF); face.rotation.x = -lean; gTOC.add(face);
box(TW - 0.1, 0.42, 0.02, tDark, 0, 0.23, 0.008, face);
const tocUI = tex((g, W, H) => {
  g.fillStyle = "#0f1a20"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1d2c36"; g.fillRect(0, 0, W, 22);
  g.fillStyle = "#cfe3ee"; g.font = "bold 12px sans-serif"; g.fillText("Sample 07 / 32  ·  measuring", 8, 15);
  [["TC", "2.481"], ["IC", "0.355"], ["TOC", "2.126"]].forEach((t, i) => {
    g.fillStyle = "#97a9b4"; g.font = "11px sans-serif"; g.fillText(t[0], 10, 44 + i * 26);
    g.fillStyle = i === 2 ? "#3fd17a" : "#ffffff"; g.font = "bold 17px monospace"; g.fillText(t[1], 44, 46 + i * 26);
    g.fillStyle = "#97a9b4"; g.font = "10px sans-serif"; g.fillText("mg/L", 104, 46 + i * 26);
  });
  g.strokeStyle = "#2b3a44"; g.strokeRect(146, 30, 102, 92);
  g.strokeStyle = "#6aa6f0"; g.lineWidth = 2; g.beginPath();
  for (let x = 148; x < 246; x++) { const y = 116 - 70 * Math.exp(-Math.pow((x - 190) / 9, 2)) * (x > 190 ? Math.exp(-(x - 190) / 30) : 1); x === 148 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
}, 256, 132);
plane(0.36, 0.26, new THREE.MeshBasicMaterial({ map: tocUI }), -0.06, 0.25, 0.02, 0, face);
for (let k = 0; k < 5; k++) box(0.07, 0.032, 0.012, 0x4a545b, 0.19, 0.14 + k * 0.05, 0.022, face);
led(-0.22, 0.41, 0.022, 0x3fd17a, face);
// lower door with sample port and furnace window
box(TW - 0.12, 0.34, 0.02, tDark, TX, ITOP + 0.23, TF + 0.008, gTOC);
box(0.012, 0.26, 0.012, 0x4a545b, TX - 0.17, ITOP + 0.23, TF + 0.022, gTOC);
cyl(0.02, 0.02, 0.03, C.steel, TX - 0.06, ITOP + 0.33, TF + 0.028, gTOC, 12, { metalness: 0.7 }).rotation.x = Math.PI / 2;
const furnaceMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a });
box(0.12, 0.12, 0.01, 0x14191c, TX + 0.15, ITOP + 0.25, TF + 0.02, gTOC);
plane(0.085, 0.085, furnaceMat, TX + 0.15, ITOP + 0.25, TF + 0.026, 0, gTOC);
// carousel autosampler, left of the analyzer
const ASX = IX + 0.25, ASZ = IZ + 0.05;
cyl(0.3, 0.31, 0.16, tBody, ASX, ITOP + 0.08, ASZ, gTOC, 40);
const rotor = new THREE.Group(); rotor.position.set(ASX, ITOP + 0.16, ASZ); gTOC.add(rotor);
cyl(0.27, 0.27, 0.02, 0x9aa4ab, 0, 0.01, 0, rotor, 40);
[[0.21, 20], [0.13, 12]].forEach(([r, n]) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    cyl(0.022, 0.022, 0.1, glass, Math.cos(a) * r, 0.07, Math.sin(a) * r, rotor, 8).castShadow = false;
    cyl(0.023, 0.023, 0.018, i === 0 && r > 0.2 ? 0xd23c3c : tDark, Math.cos(a) * r, 0.13, Math.sin(a) * r, rotor, 8);
  }
});
cyl(0.29, 0.29, 0.15, smoked, ASX, ITOP + 0.16 + 0.075, ASZ, gTOC, 40).castShadow = false;
cyl(0.29, 0.29, 0.012, 0x3a4248, ASX, ITOP + 0.316, ASZ, gTOC, 40);
const tower = cyl(0.075, 0.075, 0.72, tBody, ASX, ITOP + 0.36, ASZ - 0.3, gTOC, 20); tower.scale.z = 0.9;
box(0.08, 0.32, 0.01, smoked, ASX, ITOP + 0.46, ASZ - 0.232, gTOC);
box(0.06, 0.05, 0.26, tDark, ASX, ITOP + 0.69, ASZ - 0.17, gTOC);
cyl(0.006, 0.006, 0.32, C.steel, ASX, ITOP + 0.52, ASZ - 0.06, gTOC, 6, { metalness: 0.7 });
const tubeLen = (TX - TW / 2) - (ASX + 0.075);
const tubeT = cyl(0.008, 0.008, tubeLen, C.peek, ASX + 0.075 + tubeLen / 2, ITOP + 0.62, ASZ - 0.3, gTOC, 6); tubeT.rotation.z = Math.PI / 2;
// carrier gas cylinder by the island
const GX = IX + 1.35 + 0.18, GZ = IZ - 0.25;
cyl(0.16, 0.16, 1.5, 0x5f7f9a, GX, 0.75, GZ, null, 20, { metalness: 0.3, roughness: 0.4 });
cyl(0.1, 0.16, 0.18, 0x5f7f9a, GX, 1.59, GZ, null, 20, { metalness: 0.3 });
cyl(0.04, 0.04, 0.16, C.steel, GX, 1.76, GZ, null, 10, { metalness: 0.7 });
box(0.12, 0.1, 0.08, C.steel, GX, 1.84, GZ + 0.03, null, { metalness: 0.7 });
[0.06, -0.06].forEach(dz => cyl(0.03, 0.03, 0.02, 0xdde3e6, GX, 1.86, GZ + 0.07 + dz * 0, null, 12).rotation.x = Math.PI / 2);
cyl(0.165, 0.165, 0.05, 0x1f9a4f, GX, 1.3, GZ, null, 20);
[0.55, 1.05].forEach(y => {
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.012, 6, 28), mat(0x2a2f33)); strap.rotation.x = Math.PI / 2; strap.position.set(GX, y, GZ); lab.add(strap);
  box(0.06, 0.05, 0.08, C.steel, GX - 0.17, y, GZ, null, { metalness: 0.6 });
});
const gasLine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(GX, 1.88, GZ + 0.06), new THREE.Vector3(GX - 0.05, 2.0, GZ + 0.05), new THREE.Vector3(TX + 0.2, 2.0, TZ - 0.38), new THREE.Vector3(TX + 0.2, 1.9, TZ - 0.42)
]), 30, 0.008, 6, false), mat(C.steel, { metalness: 0.7, roughness: 0.3 })); lab.add(gasLine);
