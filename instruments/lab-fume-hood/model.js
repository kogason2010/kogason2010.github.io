/* instruments/lab-fume-hood/model.js — Fume hood and the simple distillation running inside it.
   Casework base, lined interior, framed sash, airflow monitor and duct; heating mantle, flask, condenser and receiver.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     flamTex (js/basement/basement.js)
     hoodLight, mantleMat (js/core/lights.js)
     bubbles, drip (js/lab/merge.js)
     vapGeo, vapor (js/lab/effects.js)
     updateDistill (js/lab/effects.js, js/main.js) */
"use strict";

// Fume hood: casework base, lined interior with baffle slots, framed sash raised partway, airflow monitor, duct
const HX = -2.95, HZ = -3.7, HWD = 1.8, HDP = 1.1, WS = 1.06, HTOP = 3.15;
const sashGlass = new THREE.MeshStandardMaterial({ color: 0xe6f4ff, roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false });
box(HWD, 0.98, 1.0, C.cab, HX, 0.5, HZ - 0.05);
[-0.44, 0.44].forEach(dx => {
  box(0.84, 0.82, 0.015, C.cab, HX + dx, 0.52, HZ + 0.455, null, { roughness: 0.55 });
  box(0.014, 0.2, 0.03, C.steel, HX + dx + (dx < 0 ? 0.36 : -0.36), 0.66, HZ + 0.475, null, { metalness: 0.6, roughness: 0.3 });
});
const flamTex = tex((g, w, h) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, w, h); g.fillStyle = "#c23a3a"; g.font = "bold 15px sans-serif"; g.textAlign = "center"; g.fillText("FLAMMABLE", w / 2, h * 0.68); }, 128, 28);
plane(0.36, 0.08, new THREE.MeshBasicMaterial({ map: flamTex }), HX - 0.44, 0.86, HZ + 0.464);
box(HWD + 0.04, 0.06, 1.04, C.epoxy, HX, WS - 0.03, HZ - 0.05);
cyl(0.03, 0.03, HWD - 0.3, C.steel, HX, WS + 0.03, HZ + 0.49, null, 12, { metalness: 0.6, roughness: 0.3 }).rotation.z = Math.PI / 2;
[-1, 1].forEach(s => {
  const px = HX + s * (HWD / 2 - 0.07);
  box(0.14, 3.77 - WS, HDP, C.hood, px, (WS + 3.77) / 2, HZ);
  cyl(0.055, 0.055, HTOP - WS, C.hood, px, (WS + HTOP) / 2, HZ + HDP / 2 - 0.03, null, 18);
});
const liner = 0xf4f6f6;
box(HWD - 0.28, HTOP - WS, 0.04, liner, HX, (WS + HTOP) / 2, HZ - 0.5);
[WS + 0.16, (WS + HTOP) / 2, HTOP - 0.16].forEach(y => box(1.3, 0.035, 0.01, 0x3a4248, HX, y, HZ - 0.476));
box(HWD - 0.28, 0.04, HDP - 0.04, liner, HX, HTOP, HZ);
plane(HWD - 0.5, 0.22, new THREE.MeshBasicMaterial({ color: 0xf4fbff }), HX, HTOP - 0.025, HZ - 0.05).rotation.x = Math.PI / 2;
box(HWD, 0.62, HDP + 0.02, C.hood, HX, HTOP + 0.31, HZ);
box(HWD - 0.3, 0.05, 0.01, 0x3a4248, HX, HTOP + 0.12, HZ + HDP / 2 + 0.012);
// sash raised partway, sliding up behind the header
const sB = WS + 0.78, sT = HTOP + 0.05;
box(HWD - 0.3, sT - sB, 0.016, sashGlass, HX, (sB + sT) / 2, HZ + 0.515).castShadow = false;   // set just behind the header's face
box(HWD - 0.28, 0.05, 0.04, C.steel, HX, sB, HZ + 0.52, null, { metalness: 0.6, roughness: 0.3 });
[-1, 1].forEach(s => box(0.03, sT - sB, 0.035, C.steel, HX + s * (HWD / 2 - 0.15), (sB + sT) / 2, HZ + 0.52, null, { metalness: 0.6, roughness: 0.3 }));
cyl(0.018, 0.018, HWD - 0.5, C.steel, HX, sB - 0.035, HZ + 0.56, null, 10, { metalness: 0.7, roughness: 0.25 }).rotation.z = Math.PI / 2;
// airflow monitor on the right post
const monTex = tex((g, w, h) => { g.fillStyle = "#0e151b"; g.fillRect(0, 0, w, h); g.fillStyle = "#3fd17a"; g.font = "bold 22px monospace"; g.fillText("0.50", 10, 30); g.font = "12px monospace"; g.fillStyle = "#97a9b4"; g.fillText("m/s  SAFE", 10, 50); }, 96, 60);
const monX = HX + HWD / 2 - 0.07;
box(0.12, 0.2, 0.02, 0x2b3136, monX, 2.35, HZ + HDP / 2 + 0.035);
plane(0.09, 0.06, new THREE.MeshBasicMaterial({ map: monTex }), monX, 2.38, HZ + HDP / 2 + 0.046);
led(monX, 2.28, HZ + HDP / 2 + 0.05, 0x3fd17a);
// service valves on the inner right post
[[0x1f63c9, 0.22], [0xc23a3a, 0.34], [0x1f9a4f, 0.46]].forEach(([c, dy]) => {
  const v = cyl(0.025, 0.025, 0.05, c, HX + HWD / 2 - 0.165, WS + dy, HZ - 0.2, null, 12); v.rotation.z = Math.PI / 2;
});
cyl(0.27, 0.27, 1.05, C.steel, HX, 3.77 + 0.52, HZ - 0.15, null, 24, { metalness: 0.6, roughness: 0.35 });
cyl(0.31, 0.31, 0.06, C.steel, HX, 3.8, HZ - 0.15, null, 24, { metalness: 0.6, roughness: 0.35 });
const hoodLight = new THREE.PointLight(0xf4fbff, 0.55, 2.8, 2); hoodLight.position.set(HX, HTOP - 0.25, HZ); scene.add(hoodLight);

// Simple distillation inside the hood: heating mantle + round-bottom flask, still head with thermometer,
// angled water-jacketed condenser with hoses, adapter dripping into an Erlenmeyer receiver
const dz = HZ - 0.08, fx = HX - 0.5;
const mantleMat = new THREE.MeshStandardMaterial({ color: 0x2b2f33, emissive: 0xff5a1a, emissiveIntensity: 0.6, roughness: 0.6 });
cyl(0.17, 0.15, 0.12, 0x3a4248, fx, WS + 0.06, dz);
const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mantleMat);
bowl.position.set(fx, WS + 0.2, dz); lab.add(bowl);
box(0.06, 0.04, 0.02, 0x14191c, fx, WS + 0.06, dz + 0.16);
const FR = 0.13, fcy = WS + 0.21;
const rb = new THREE.Mesh(new THREE.SphereGeometry(FR, 28, 20), glass); rb.position.set(fx, fcy, dz); lab.add(rb);
const liqMat = new THREE.MeshStandardMaterial({ color: 0x8ad7ff, roughness: 0.2, transparent: true, opacity: 0.75 });
const liq = new THREE.Mesh(new THREE.SphereGeometry(FR * 0.93, 24, 14, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), liqMat);
liq.position.set(fx, fcy, dz); lab.add(liq);
const neckTop = fcy + FR + 0.14;
cyl(0.03, 0.03, neckTop - (fcy + FR - 0.02), glass, fx, (neckTop + fcy + FR - 0.02) / 2, dz, null, 14).castShadow = false;
const headTop = neckTop + 0.17;
cyl(0.032, 0.032, headTop - neckTop, glass, fx, (neckTop + headTop) / 2, dz, null, 14).castShadow = false;
cyl(0.036, 0.03, 0.05, 0x2b3136, fx, headTop + 0.02, dz, null, 14);
cyl(0.008, 0.008, 0.36, glass, fx, headTop + 0.14, dz, null, 8).castShadow = false;
cyl(0.003, 0.003, 0.2, 0xd23c3c, fx, headTop + 0.06, dz, null, 6);
// condenser: from the side arm, sloping down to the right
const th = -0.2, armY = neckTop + 0.1, S = new THREE.Vector3(fx + 0.06, armY, dz), L = 0.8;
const dir = new THREE.Vector3(Math.cos(th), Math.sin(th), 0), E = S.clone().addScaledVector(dir, L);
function along(r, len, start, color, seg, opts) {
  const mid = start.clone().addScaledVector(dir, len / 2);
  const m = cyl(r, r, len, color, mid.x, mid.y, mid.z, null, seg || 16, opts);
  m.rotation.z = th - Math.PI / 2; return m;
}
along(0.016, 0.1, new THREE.Vector3(fx, armY + 0.02, dz), glass).castShadow = false;
along(0.05, L - 0.16, S.clone().addScaledVector(dir, 0.08), glass, 20).castShadow = false;
along(0.044, L - 0.18, S.clone().addScaledVector(dir, 0.09), 0x6fc3ff, 20, { transparent: true, opacity: 0.35, roughness: 0.1 });
along(0.015, L, S, glass, 10).castShadow = false;
// hose barbs + hoses (water in at the low end, out at the high end)
const barbIn = S.clone().addScaledVector(dir, L - 0.14), barbOut = S.clone().addScaledVector(dir, 0.14);
cyl(0.012, 0.012, 0.07, glass, barbIn.x, barbIn.y - 0.07, dz, null, 8);
cyl(0.012, 0.012, 0.07, glass, barbOut.x, barbOut.y + 0.07, dz, null, 8);
const hoseMat = mat(0x2a3036, { roughness: 0.5 });
function hose(pts) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.014, 8, false), hoseMat); m.castShadow = true; lab.add(m); }
const tapX = HX + 0.55;
cyl(0.02, 0.02, 0.08, C.steel, tapX, WS + 0.3, HZ - 0.44, null, 10, { metalness: 0.7 }).rotation.x = Math.PI / 2;
cyl(0.02, 0.02, 0.08, C.steel, tapX - 0.2, WS + 0.3, HZ - 0.44, null, 10, { metalness: 0.7 }).rotation.x = Math.PI / 2;
hose([new THREE.Vector3(barbIn.x, barbIn.y - 0.1, dz), new THREE.Vector3(barbIn.x + 0.04, WS + 0.12, dz - 0.05), new THREE.Vector3(tapX, WS + 0.06, HZ - 0.3), new THREE.Vector3(tapX, WS + 0.3, HZ - 0.4)]);
hose([new THREE.Vector3(barbOut.x, barbOut.y + 0.1, dz), new THREE.Vector3(barbOut.x + 0.05, barbOut.y + 0.22, dz - 0.15), new THREE.Vector3(tapX - 0.2, WS + 0.55, HZ - 0.38), new THREE.Vector3(tapX - 0.2, WS + 0.3, HZ - 0.4)]);
// receiving adapter bends down into the Erlenmeyer receiver
const tipY = E.y - 0.12;
cyl(0.016, 0.016, 0.14, glass, E.x + 0.01, E.y - 0.06, dz, null, 10).castShadow = false;
box(0.26, 0.04, 0.2, C.steel, E.x + 0.01, WS + 0.02, dz, null, { metalness: 0.5, roughness: 0.35 }); // lab jack
box(0.2, 0.03, 0.16, C.steel, E.x + 0.01, WS + 0.075, dz, null, { metalness: 0.5, roughness: 0.35 });
const rcvBase = WS + 0.09;
flask(E.x + 0.01, rcvBase, dz, 0.11, 0x8ad7ff);
// ring stands with clamps
[[fx, neckTop - 0.06], [S.x + dir.x * L * 0.5, S.y + dir.y * L * 0.5]].forEach(([sx, cy2]) => {
  box(0.26, 0.02, 0.16, 0x3a4248, sx, WS + 0.01, HZ - 0.38);
  cyl(0.011, 0.011, 1.15, C.steel, sx, WS + 0.575, HZ - 0.38, null, 8, { metalness: 0.7, roughness: 0.25 });
  const arm2 = cyl(0.008, 0.008, (HZ - 0.38) - dz, C.steel, sx, cy2, (HZ - 0.38 + dz) / 2, null, 6, { metalness: 0.7 }); arm2.rotation.x = Math.PI / 2;
  box(0.05, 0.03, 0.04, 0x3a4248, sx, cy2, HZ - 0.38);
  box(0.08, 0.025, 0.05, 0xc23a3a, sx, cy2, dz - 0.04);
});
// moving parts: boiling bubbles, a drip, rising vapor
const bubbles = [];
const bubMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.008 + (i % 3) * 0.004, 8, 6), bubMat); lab.add(b); bubbles.push({ m: b, a: Math.random() * 6.28, r: Math.random() * 0.06, p: Math.random() }); }
const drip = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), new THREE.MeshStandardMaterial({ color: 0x8ad7ff, roughness: 0.1, transparent: true, opacity: 0.9 }));
lab.add(drip);
const VAP_N = 70, vapPos = new Float32Array(VAP_N * 3), vapU = new Float32Array(VAP_N);
for (let i = 0; i < VAP_N; i++) vapU[i] = Math.random();
const vapPath = [new THREE.Vector3(fx, fcy + 0.02, dz), new THREE.Vector3(fx, armY + 0.02, dz), S.clone(), S.clone().addScaledVector(dir, L * 0.45)];
const vapCurve = new THREE.CatmullRomCurve3(vapPath);
const vapGeo = new THREE.BufferGeometry(); vapGeo.setAttribute("position", new THREE.BufferAttribute(vapPos, 3));
let vapor = null; // material assigned once the dot texture exists
function updateDistill(dt, time) {
  bubbles.forEach(b => {
    b.p += dt * (0.8 + b.r * 6);
    if (b.p > 1) { b.p = 0; b.a = Math.random() * 6.28; b.r = Math.random() * 0.07; }
    b.m.position.set(fx + Math.cos(b.a) * b.r, fcy - FR * 0.8 + b.p * FR * 0.85, dz + Math.sin(b.a) * b.r);
  });
  const ph = (time % 1.4) / 1.4;
  drip.visible = ph > 0.35;
  drip.position.set(E.x + 0.01, tipY - Math.max(0, ph - 0.35) * 1.5 * (tipY - (rcvBase + 0.28)) , dz);
  for (let i = 0; i < VAP_N; i++) {
    vapU[i] += dt * 0.18; if (vapU[i] > 1) vapU[i] = 0;
    const p = vapCurve.getPoint(vapU[i]);
    vapPos[i * 3] = p.x + Math.sin(time * 3 + i) * 0.012; vapPos[i * 3 + 1] = p.y + Math.cos(time * 2.4 + i) * 0.01; vapPos[i * 3 + 2] = p.z + Math.sin(time * 2 + i * 1.7) * 0.012;
  }
  vapGeo.attributes.position.needsUpdate = true;
}
