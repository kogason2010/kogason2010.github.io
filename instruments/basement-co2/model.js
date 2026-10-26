/* instruments/basement-co2/model.js — CO₂ supply: dip-tube cylinders, regulators, the line to the SFC's pump, and the CO₂ monitor.
   The cylinders stand against the left wall and face +x.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     strobe (js/basement/sfc.js) */
"use strict";

// where the line ends: the SFC's CO₂ pump inlet (instruments/basement-sfc), and the steel for the line
const CO2_IN = { x: -1.55 - 0.12, y: BY + 1.31 + 0.3 };
const co2Steel = mat(C.steel, { metalness: 0.75, roughness: 0.3 });

// CO₂ supply: dip-tube cylinders on the left wall, regulators, a header to the pump; a CO₂ monitor on the wall
const gCO2 = hotGroup("co2", "CO₂ supply", new THREE.Vector3(-3.95, BY + 2.0, -1.95), basement, "down");
const co2Tex = tex((g, w, h) => { g.fillStyle = "#f1f3f4"; g.fillRect(0, 0, w, h); g.fillStyle = "#1a2228"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("CO₂", w / 2, 26); g.font = "bold 10px sans-serif"; g.fillText("LIQUID · DIP TUBE", w / 2, 42); }, 128, 50);
[-2.35, -1.95, -1.55].forEach(z => {
  const cx = -3.93;
  cyl(0.115, 0.115, 1.3, 0x59656d, cx, BY + 0.67, z, gCO2, 24, { metalness: 0.35, roughness: 0.45 });
  cyl(0.04, 0.115, 0.14, 0x59656d, cx, BY + 1.39, z, gCO2, 24, { metalness: 0.35, roughness: 0.45 });
  cyl(0.03, 0.03, 0.09, C.steel, cx, BY + 1.5, z, gCO2, 12, { metalness: 0.8 });
  box(0.07, 0.05, 0.05, 0x8a959b, cx + 0.05, BY + 1.56, z, gCO2, { metalness: 0.6 });
  const lab2 = new THREE.Mesh(new THREE.CylinderGeometry(0.117, 0.117, 0.16, 24, 1, true, Math.PI / 2 - 0.8, 1.6), new THREE.MeshStandardMaterial({ map: co2Tex, roughness: 0.5 }));
  lab2.position.set(cx, BY + 1.05, z); gCO2.add(lab2);
  gCO2.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(cx + 0.08, BY + 1.57, z), new THREE.Vector3(cx + 0.1, BY + 1.72, z + 0.06), new THREE.Vector3(-4.06, BY + 1.86, z)]), 16, 0.008, 6, false), co2Steel));
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.008, 6, 32), mat(0x9aa4a9, { metalness: 0.7 })); chain.rotation.x = Math.PI / 2; chain.position.set(cx, BY + 1.1, z); gCO2.add(chain);
});
box(0.04, 0.12, 1.1, 0x6b767c, -4.16, BY + 1.1, -1.95, gCO2);
const CO2_LINE = [new THREE.Vector3(-4.06, BY + 1.86, -1.55), new THREE.Vector3(-4.06, BY + 1.86, -4.06), new THREE.Vector3(CO2_IN.x, BY + 1.86, -4.06), new THREE.Vector3(CO2_IN.x, CO2_IN.y, -4.06), new THREE.Vector3(CO2_IN.x, CO2_IN.y, -4.13)];
gCO2.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(CO2_LINE, false, "chordal", 0), 80, 0.014, 8, false), co2Steel));
const co2Mon = screenTex(128, 64, (g, W, H, ppm) => {
  g.fillStyle = "#0f1a20"; g.fillRect(0, 0, W, H); g.fillStyle = "#97a9b4"; g.font = "bold 11px monospace"; g.fillText("CO2 MONITOR", 8, 15);
  g.fillStyle = "#8fffb0"; g.font = "bold 24px monospace"; g.fillText(String(ppm), 8, 44); g.font = "bold 11px monospace"; g.fillText("ppm", 82, 44);
  g.fillStyle = "#3fd17a"; g.beginPath(); g.arc(W - 12, 10, 4, 0, 7); g.fill();
});
co2Mon.draw(640);
box(0.06, 0.22, 0.3, 0xe7ebec, -4.16, BY + 1.75, -0.75, basement);
plane(0.22, 0.11, new THREE.MeshBasicMaterial({ map: co2Mon.t }), -4.128, BY + 1.77, -0.75, Math.PI / 2, basement);
const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc23a3a, { transparent: true, opacity: 0.85, roughness: 0.2 }));
strobe.position.set(-4.12, BY + 1.88, -0.75); basement.add(strobe);

// What the camera frames when you click the tag: the cylinders and the monitor (the line runs on to the SFC)
hotspots.find(h => h.key === "co2").focus = { center: new THREE.Vector3(-3.85, BY + 1.15, -1.6), size: new THREE.Vector3(0.7, 1.9, 2.1) };
