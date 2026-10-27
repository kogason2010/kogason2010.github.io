/* js/campus/water.js — Reflective pond with lily pads and reeds; the plaza fountain (two tiers, falling sheets of water,
   arcing jets, foam, ripples and caustics, lit from under the water at night).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// pond and fountain
function buildWater() {
  /* ---- water: a reflective pond, then the fountain ---- */
  const wc = canvasOf(256, 256), wcg = wc.getContext("2d"), wimg = wcg.createImageData(256, 256), waves = Array.from({ length: 9 }, () => [((Math.random() * 7) | 0) + 1, ((Math.random() * 7) | 0) - 3, Math.random() * 6.28, 0.4 + Math.random() * 0.6]);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { let hgt = 0; waves.forEach(([kx, ky, ph, a]) => { hgt += a * Math.sin((kx * x + ky * y) / 256 * 6.283 + ph); }); const v = (hgt / 9 * 0.5 + 0.5) * 255, i = (y * 256 + x) * 4; wimg.data[i] = wimg.data[i + 1] = wimg.data[i + 2] = v; wimg.data[i + 3] = 255; }
  wcg.putImageData(wimg, 0, 0);
  const waterN = normalFrom(wc, 3);
  flat(new THREE.CircleGeometry(8.9, 64), mat(0xc9b88f, { roughness: 1 }), -30, 0.014, 30);
  flat(new THREE.RingGeometry(9.6, 11.2, 72), new THREE.MeshStandardMaterial({ ...setRepeat(pathSet, 6, 1), roughness: 0.9 }), -30, 0.016, 30);
  if (THREE.Water && !LIGHT) {
    FX.pond = new THREE.Water(new THREE.CircleGeometry(8.1, 64), { textureWidth: 256, textureHeight: 256, waterNormals: waterN, sunDirection: SUN_DIR.clone(), sunColor: 0xffffff, waterColor: 0x1e4c58, distortionScale: 1.4, fog: true, alpha: 1.0 });
    FX.pond.material.uniforms.size.value = 5.5; FX.pond.rotation.x = -Math.PI / 2; FX.pond.position.set(-30, 0.05, 30); world.add(FX.pond);
    const reflect = FX.pond.onBeforeRender; FX.pond.onBeforeRender = function (...a) {
      const gv = FX.grass.visible, saved = FX.chunks.map(ch => ch.meshes[0].visible), cast = FX.chunks.map(ch => ch.meshes[0].castShadow);
      FX.grass.visible = false; FX.chunks.forEach(ch => { const v = !ch.far && Math.hypot(ch.sphere.center.x + 30, ch.sphere.center.z - 30) < 30 + ch.sphere.radius; ch.meshes.forEach(m => { m.visible = v; }); });
      reflect.apply(this, a);
      FX.grass.visible = gv; FX.chunks.forEach((ch, i) => ch.meshes.forEach(m => { m.visible = saved[i]; m.castShadow = cast[i]; }));
    };
  } else {
    const pw = waterN.clone(); pw.needsUpdate = true; pw.repeat.set(3, 3);
    flat(new THREE.CircleGeometry(8.1, 64), new THREE.MeshStandardMaterial({ color: 0x2a6476, roughness: 0.05, metalness: 0.2, normalMap: pw, normalScale: new THREE.Vector2(0.5, 0.5) }), -30, 0.05, 30);
  }
  CAMPUS.ponds.push([-30, 30, 8]); CAMPUS.circles.push([-30, 30, 8.25, "pond"]);
  const padMat = mat(0x4f8f3e, { roughness: 0.55 }), flowerPad = mat(0xf3d6e4, { roughness: 0.5 });
  for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, r = 1.8 + rnd() * 5.4, x = -30 + Math.cos(a) * r, z = 30 + Math.sin(a) * r; flat(new THREE.CircleGeometry(0.26 + rnd() * 0.2, 14, 0.35, 5.7), padMat, x, 0.07, z).rotation.z = rnd() * 6.28; if (i % 4 === 0) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.08, 7), flowerPad); f.position.set(x, 0.1, z); world.add(f); } }
  const reedGeo = new THREE.ConeGeometry(0.02, 1, 4); reedGeo.translate(0, 0.5, 0); paint(reedGeo, (x, y, z, c) => c.setRGB(0.06 + y * 0.14, 0.1 + y * 0.14, 0.03 + y * 0.03));
  const reeds = new THREE.InstancedMesh(reedGeo, windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 0.06, 0.2), 420), rm = new THREE.Matrix4();
  // reeds grow in clumps round the edge, not an even fence: 16 clumps of varied size, gaps between them
  const clumps = Array.from({ length: 16 }, (_, k) => ({ a: (k + rnd() * 0.6) / 16 * 6.283, n: 0.4 + rnd() * 1.2, h: 0.6 + rnd() * 0.7 }));
  for (let i = 0; i < 420; i++) { const cl = clumps[i % 16], a = cl.a + (rnd() - 0.5) * 0.26 * cl.n, r = 7.55 + Math.pow(rnd(), 1.5) * 1.0, s = (0.3 + rnd() * 0.75) * cl.h * (1 - Math.abs(a - cl.a) * 1.6); rm.compose(V(-30 + Math.cos(a) * r, 0, 30 + Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.25, 0, (rnd() - 0.5) * 0.25)), V(1, s, 1)); reeds.setMatrixAt(i, rm); }
  reeds.castShadow = true; world.add(reeds);
  buildFountain(waterN);
}

/* ---- the fountain ---- */
// a smooth tiling noise (a wrapped grid of random values, eased between), w x w, n cells across
function tileNoise(w, n, R) {
  const cell = Array.from({ length: n * n }, () => R()), out = new Float32Array(w * w), sm = t => t * t * (3 - 2 * t), C = (i, j) => cell[((j + n) % n) * n + ((i + n) % n)];
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const fx = x / w * n, fy = y / w * n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0);
    out[y * w + x] = (C(x0, y0) * (1 - tx) + C(x0 + 1, y0) * tx) * (1 - ty) + (C(x0, y0 + 1) * (1 - tx) + C(x0 + 1, y0 + 1) * tx) * ty;
  }
  return out;
}
// a grey texture (linear) from a function of x, y in 0..1
function greyTex(w, h, fn) {
  const c = canvasOf(w, h), g = c.getContext("2d"), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = Math.max(0, Math.min(255, fn(x, y) * 255)), i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return { tex: t, canvas: c };
}
// shared vertex shader for the water effects (they are lit by their own colours, fogged like everything else)
const FOUNT_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
#include <fog_pars_vertex>
void main() { vUv = uv; vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mvPosition.xyz; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const FOUNT_END = `#include <tonemapping_fragment>
#include <encodings_fragment>
#include <fog_fragment>
}`;
// falling and rising water: streaks that run along the sheet (uAxis 0: along v, as on a lathe; 1: along u, as on a tube),
// fading in where the water leaves the stone and breaking up toward the end
const SHEET_FS = `uniform sampler2D tStreak; uniform float uTime, uSpeed, uOpacity, uAxis; uniform vec2 uRep; uniform vec3 uCol, uGlow;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
#include <fog_pars_fragment>
void main() {
  float f = mix(vUv.y, vUv.x, uAxis), c = mix(vUv.x, vUv.y, uAxis);
  float s = texture2D(tStreak, vec2(c * uRep.x, f * uRep.y - uTime * uSpeed)).r;
  float s2 = texture2D(tStreak, vec2(c * uRep.x * 0.53 + 0.31, f * uRep.y * 0.7 - uTime * uSpeed * 1.3)).r;
  float fres = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  float fade = smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.72, 1.0, f) * 0.8);
  float a = clamp((0.12 + 1.25 * s * s2) * (0.5 + 0.5 * fres), 0.0, 1.0) * fade * uOpacity;
  gl_FragColor = vec4(uCol * (0.7 + 0.6 * s) + uGlow, a);
` + FOUNT_END;
// foam where water lands (a ring at radius uR, uW wide, churning outward) and ripples running out from it
const SURF_FS = `uniform sampler2D tNoise; uniform float uTime, uR, uW, uOpacity; uniform vec3 uCol;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
#include <fog_pars_fragment>
void main() {
  float r = length(vP.xy), u = atan(vP.y, vP.x) * 0.159155, d = r - uR;
  float n = texture2D(tNoise, vec2(u * 9.0, d * 1.3 - uTime * 0.4)).r, n2 = texture2D(tNoise, vec2(u * 14.0 + 0.4, d * 2.1 - uTime * 0.27)).r;
  float foam = smoothstep(0.38, 0.8, n * n2 * 1.9) * exp(-d * d / (uW * uW));
  float rip = pow(0.5 + 0.5 * sin(abs(d) * 24.0 - uTime * 3.4 + n * 2.0), 12.0) * exp(-abs(d) * 1.6) * 0.5;
  gl_FragColor = vec4(uCol, clamp(foam + rip, 0.0, 1.0) * uOpacity);
` + FOUNT_END;
// moving light on the floor under the water: two networks of caustic lines drifting across each other
const CAUSTIC_FS = `uniform sampler2D tC; uniform float uTime, uStr, uR; uniform vec3 uCol;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
#include <fog_pars_fragment>
void main() {
  vec2 p = vP.xy; float a = texture2D(tC, p * 0.34 + vec2(uTime * 0.021, uTime * 0.013)).r, b = texture2D(tC, p * 0.27 + vec2(-uTime * 0.016, uTime * 0.022) + 0.37).r;
  float c = pow((a + b) * 0.5, 2.2) * 2.2 * (1.0 - smoothstep(uR - 0.25, uR, length(p)));
  gl_FragColor = vec4(uCol * c * uStr, 1.0);
` + FOUNT_END;

// The fountain in the middle of the plaza: a moulded stone basin, a fluted pedestal, two bowls and a finial, water
// spilling from both bowls in sheets, a jet from the top, eight jets arcing in from the rim, foam and ripples where the
// water lands, and a mosaic floor under clear water with caustics. FX.fountain holds what moves and what changes at night.
function buildFountain(waterN) {
  const R = seeded(8128), FT = FX.fountain = { sheets: [], surfs: [], caustic: null, floor: null };
  // limestone: soft mottling and specks, its bumps from the same values
  const n1 = tileNoise(256, 6, R), n2 = tileNoise(256, 24, R), stoneV = (x, y) => 0.55 * n1[y * 256 + x] + 0.45 * n2[y * 256 + x] + (R() < 0.04 ? -0.25 : 0);
  const sv = new Float32Array(256 * 256); for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) sv[y * 256 + x] = stoneV(x, y);
  const sMap = greyTex(256, 256, (x, y) => 0.78 + 0.22 * sv[y * 256 + x]), sBump = greyTex(256, 256, (x, y) => sv[y * 256 + x]);
  sMap.tex.encoding = THREE.sRGBEncoding; const sN = normalFrom(sBump.canvas, 0.7);
  const stoneSet = (ru, rv) => setRepeat({ map: sMap.tex, normalMap: sN }, ru, rv);
  const stoneM = (ru, rv) => new THREE.MeshStandardMaterial({ color: 0xbfb29a, roughness: 0.82, ...stoneSet(ru, rv) });
  const lathe = (pts, seg, m, y, ripple) => {
    const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg);
    if (ripple) { const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), yy = P.getY(i), z = P.getZ(i), k = ripple(Math.atan2(z, x), yy); P.setXYZ(i, x * k, yy, z * k); } g.computeVertexNormals(); }
    const o = new THREE.Mesh(g, m); o.position.y = y; o.castShadow = o.receiveShadow = true; world.add(o); return o;
  };
  // basin: a plinth, a wall with a bead moulding, a rounded coping, the inner wall
  lathe([[3.92, 0], [3.92, 0.07], [3.84, 0.1], [3.8, 0.14], [3.8, 0.36], [3.85, 0.39], [3.85, 0.43], [3.92, 0.47], [3.97, 0.52], [3.95, 0.58], [3.87, 0.62], [3.6, 0.64], [3.37, 0.62], [3.3, 0.57], [3.29, 0.5], [3.3, 0.12]], 128, stoneM(18, 1.5), 0);
  // mosaic floor: blue and turquoise tiles, a gold ring and a white star in the middle
  const mosaic = ctex(512, 512, (g, w) => {
    g.fillStyle = "#1d2c33"; g.fillRect(0, 0, w, w);
    const blues = ["#1f5f8b", "#2470a0", "#1a5276", "#2b7fae", "#2f8a9e"];
    for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
      const x = (i + 0.5) / 32 - 1, y = (j + 0.5) / 32 - 1, r = Math.hypot(x, y), t = Math.atan2(y, x);
      let col = blues[(R() * blues.length) | 0];
      if (r < 0.24 * (0.55 + 0.45 * Math.abs(Math.cos(4 * t)))) col = r < 0.07 ? "#e8c66a" : "#eef2f0";
      else if (r > 0.5 && r < 0.565) col = (Math.floor((t + Math.PI) / (2 * Math.PI) * 48) % 2) ? "#d9b45a" : "#f1ede2";
      else if (r > 0.82 && r < 0.865) col = "#5cc6c9";
      g.fillStyle = col; g.fillRect(i * 8 + 0.6, j * 8 + 0.6, 6.8, 6.8);
    }
  });
  FT.floor = new THREE.MeshStandardMaterial({ map: mosaic, emissiveMap: mosaic, emissive: 0x000000, roughness: 0.45 });
  flat(new THREE.CircleGeometry(3.3, 72), FT.floor, 0, 0.12, 0);
  // caustics drawn over the floor (added light, under the water)
  const cw = 128, pts = Array.from({ length: 22 }, () => [R() * cw, R() * cw]);
  const caus = greyTex(cw, cw, (x, y) => {
    let d1 = 1e9, d2 = 1e9;
    pts.forEach(([px, py]) => { for (const ox of [-cw, 0, cw]) for (const oy of [-cw, 0, cw]) { const d = Math.hypot(x - px - ox, y - py - oy); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } });
    return 1 - THREE.MathUtils.smoothstep(d2 - d1, 0, 5);
  }).tex;
  FT.caustic = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tC: { value: null }, uTime: { value: 0 }, uStr: { value: 0.5 }, uR: { value: 3.3 }, uCol: { value: new THREE.Color(0.75, 0.95, 1.0) } }]),
    vertexShader: FOUNT_VS, fragmentShader: CAUSTIC_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
  FT.caustic.uniforms.tC.value = caus;
  flat(new THREE.CircleGeometry(3.3, 72), FT.caustic, 0, 0.125, 0).userData.keep = true;
  // pedestal: fluted shaft between mouldings; bowls with scalloped undersides; an upper column and a finial
  const fluted = (a, y) => (y > 0.5 && y < 1.2 ? 1 + 0.05 * Math.cos(a * 16) : 1);
  lathe([[0.75, 0], [0.75, 0.14], [0.6, 0.2], [0.55, 0.32], [0.42, 0.4], [0.36, 0.5], [0.33, 0.6], [0.33, 1.1], [0.35, 1.22], [0.46, 1.34], [0.5, 1.44], [0.38, 1.56], [0.3, 1.72], [0.24, 1.94]], 64, stoneM(4, 1.5), 0.12, fluted);
  const scallop = n => (a, y) => (y < 0.3 ? 1 + 0.035 * Math.max(0, Math.cos(a * n)) * Math.sin(Math.min(1, y / 0.3) * Math.PI) : 1);
  lathe([[0.24, 0], [0.6, 0.04], [1.0, 0.14], [1.3, 0.3], [1.42, 0.38], [1.45, 0.43], [1.42, 0.48], [1.32, 0.48], [1.28, 0.44], [1.0, 0.3], [0.5, 0.22], [0.2, 0.2]], 96, stoneM(8, 1), 2.06, scallop(20));
  lathe([[0.22, 0], [0.22, 0.08], [0.16, 0.16], [0.13, 0.26], [0.13, 0.7], [0.16, 0.76], [0.21, 0.82], [0.22, 0.9]], 32, stoneM(2, 1), 2.26, (a, y) => (y > 0.26 && y < 0.7 ? 1 + 0.06 * Math.cos(a * 10) : 1));
  lathe([[0.1, 0], [0.28, 0.03], [0.48, 0.09], [0.62, 0.17], [0.68, 0.21], [0.7, 0.24], [0.68, 0.27], [0.63, 0.27], [0.6, 0.24], [0.45, 0.16], [0.22, 0.12], [0.08, 0.11]], 64, stoneM(4, 1), 3.16, scallop(14));
  lathe([[0.1, 0], [0.12, 0.05], [0.06, 0.1], [0.09, 0.18], [0.1, 0.24], [0.06, 0.3], [0.03, 0.34]], 24, stoneM(1, 1), 3.27);
  // clear water: the floor and caustics show through, the sky reflects in it
  const bn = waterN.clone(); bn.needsUpdate = true; bn.repeat.set(2.5, 2.5); FX.basinN = bn;
  FX.basinMat = new THREE.MeshStandardMaterial({ color: 0x3f93a8, roughness: 0.03, metalness: 0, normalMap: bn, normalScale: new THREE.Vector2(0.45, 0.45), transparent: true, opacity: 0.58 });
  FX.basinMat.userData.env = 1.4;
  [[3.3, 0.48], [1.28, 2.49], [0.61, 3.39]].forEach(([r, y]) => flat(new THREE.CircleGeometry(r, 72), FX.basinMat, 0, y, 0));
  // streaks for the moving water
  const streak = (() => { const c = canvasOf(64, 256), g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 260; i++) { const x = R() * 64, y = R() * 256, l = 20 + R() * 110, a = 0.25 + R() * 0.75; g.strokeStyle = `rgba(255,255,255,${a.toFixed(2)})`; g.lineWidth = 1 + R() * 2.2; [0, -256, 256].forEach(o => { g.beginPath(); g.moveTo(x, y + o); g.lineTo(x, y + o + l); g.stroke(); }); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const sheet = (geo, axis, rep, speed, opacity, y) => {
    const m = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tStreak: { value: null }, uTime: { value: 0 }, uSpeed: { value: speed }, uOpacity: { value: opacity }, uAxis: { value: axis }, uRep: { value: new THREE.Vector2(rep[0], rep[1]) }, uCol: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() } }]),
      vertexShader: FOUNT_VS, fragmentShader: SHEET_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true });
    m.uniforms.tStreak.value = streak; FT.sheets.push(m);
    const o = new THREE.Mesh(geo, m); o.position.y = y; o.renderOrder = 2; o.userData.keep = true; world.add(o); return o;
  };
  const fall = (r0, y0, r1, y1, n) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return new THREE.Vector2(r0 + (r1 - r0) * Math.sqrt(t), y0 - (y0 - y1) * t * t); });
  sheet(new THREE.LatheGeometry(fall(1.455, 2.5, 1.88, 0.47, 16), 96), 0, [26, 2], 0.9, 0.6, 0);   // from the big bowl into the basin
  sheet(new THREE.LatheGeometry(fall(0.71, 3.4, 0.95, 2.48, 12), 64), 0, [14, 1.5], 0.8, 0.6, 0);   // from the small bowl into the big one
  sheet(new THREE.LatheGeometry([[0.028, 0], [0.04, 0.3], [0.055, 0.65], [0.06, 0.85], [0.03, 1.0]].map(p => new THREE.Vector2(p[0], p[1])), 12), 0, [2, 2], 1.4, 0.9, 3.6);   // the jet from the finial
  // eight jets arcing in from bronze spouts on the coping, landing where the falling sheet does
  const bronze = mat(0x6b5a3a, { metalness: 0.8, roughness: 0.35 }), arcs = [];
  for (let k = 0; k < 8; k++) {
    const a = (k + 0.5) * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a), path = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16, r = 3.36 + (1.95 - 3.36) * t, y = 0.68 * (1 - t) + 0.48 * t + 3.9 * 0.25 * 4 * t * (1 - t); path.push(new THREE.Vector3(ca * r, y, sa * r)); }
    arcs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 32, 0.022, 6, false));
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.16, 10), bronze); sp.position.set(ca * 3.42, 0.66, sa * 3.42); sp.rotation.set(0, -a, 0); sp.rotateZ(0.36); sp.castShadow = true; world.add(sp);
  }
  sheet(joinGeos(arcs), 1, [1.2, 3], 1.5, 0.8, 0);
  // foam and ripples where the water lands: in the basin, the big bowl and the small bowl
  const noise = tileNoise(128, 16, R), noiseTex = greyTex(128, 128, (x, y) => noise[y * 128 + x]).tex;
  [[3.28, 0.484, 1.9, 0.22], [1.27, 2.494, 0.95, 0.14], [0.6, 3.394, 0.42, 0.12]].forEach(([r, y, landR, w]) => {
    const m = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tNoise: { value: null }, uTime: { value: 0 }, uR: { value: landR }, uW: { value: w }, uOpacity: { value: 0.85 }, uCol: { value: new THREE.Color(0.95, 0.98, 1.0) } }]),
      vertexShader: FOUNT_VS, fragmentShader: SURF_FS, transparent: true, depthWrite: false, fog: true });
    m.uniforms.tNoise.value = noiseTex; FT.surfs.push(m);
    const o = flat(new THREE.CircleGeometry(r, 72), m, 0, y, 0); o.renderOrder = 1; o.userData.keep = true;
  });
  CAMPUS.circles.push([0, 0, 3.95, "fountain"]);
  // spray: drops crowning the jet, drops breaking off where the sheets land, splashes under the arcing jets
  { const JN = LIGHT ? 420 : 900, g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(JN * 3), 3));
    FX.jets = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.055, map: dotTex, color: 0xeef8ff, transparent: true, opacity: 0.85, depthWrite: false })); FX.jets.frustumCulled = false; FX.jets.renderOrder = 3; world.add(FX.jets);
    FX.jetSeeds = Array.from({ length: JN }, (_, i) => [i % 4, Math.random() * 6.283, Math.random(), 0.8 + Math.random() * 0.4]); }
  fountainNight(false);
}
// geometries with position, normal, uv and an index, joined into one
function joinGeos(list) {
  const out = { position: [], normal: [], uv: [] }, ix = []; let base = 0;
  list.forEach(g => { Object.keys(out).forEach(k => out[k].push(...g.attributes[k].array)); g.index.array.forEach(i => ix.push(i + base)); base += g.attributes.position.count; });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(out.position, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(out.normal, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(out.uv, 2)); g.setIndex(ix); return g;
}
// by night lamps under the water light the floor, and the moving water glows with them
function fountainNight(on) {
  const FT = FX.fountain; if (!FT) return;
  FT.floor.emissive.setHex(on ? 0x2a6f80 : 0x000000);
  FT.sheets.forEach(m => { m.uniforms.uCol.value.setRGB(...(on ? [0.16, 0.22, 0.3] : [0.85, 0.97, 1.05])); m.uniforms.uGlow.value.setRGB(...(on ? [0.05, 0.3, 0.36] : [0, 0, 0])); });
  FT.surfs.forEach(m => { m.uniforms.uCol.value.setRGB(...(on ? [0.25, 0.6, 0.65] : [0.95, 0.98, 1.0])); });
  FT.caustic.uniforms.uStr.value = on ? 0.35 : 0.5; FT.caustic.uniforms.uCol.value.setRGB(...(on ? [0.4, 0.9, 1.0] : [0.75, 0.95, 1.0]));
}
// per frame: the water moves, and the spray follows the jets
function updateFountain(dt, time) {
  const FT = FX.fountain; if (!FT) return;
  FT.sheets.forEach(m => { m.uniforms.uTime.value = time; }); FT.surfs.forEach(m => { m.uniforms.uTime.value = time; }); FT.caustic.uniforms.uTime.value = time;
  FX.basinN.offset.x += dt * 0.03; FX.basinN.offset.y += dt * 0.02;
  const jp = FX.jets.geometry.attributes.position;
  for (let i = 0; i < FX.jetSeeds.length; i++) {
    const [kind, a, ph, sp] = FX.jetSeeds[i], t = (time * 0.7 * sp + ph) % 1;
    if (kind === 0) { const r = t * 0.5 * sp, y = 4.6 + t * 0.3 - t * t * 1.5; jp.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r); }                 // crowning the jet, falling into the small bowl
    else if (kind === 1) { const r = 1.82 + ph * 0.22 + t * 0.12, y = 0.48 + Math.sin(t * Math.PI) * 0.22 * sp; jp.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r); }   // where the big sheet lands
    else if (kind === 2) { const j = Math.floor(ph * 8), aj = (j + 0.5) * Math.PI / 4, rr = t * 0.22 * sp, y = 0.48 + Math.sin(t * Math.PI) * 0.26; jp.setXYZ(i, Math.cos(aj) * 1.95 + Math.cos(a) * rr, y, Math.sin(aj) * 1.95 + Math.sin(a) * rr); }   // under each arcing jet
    else { const r = 0.9 + ph * 0.12, y = 2.49 + Math.sin(t * Math.PI) * 0.14; jp.setXYZ(i, Math.cos(a + t * 0.3) * r, y, Math.sin(a + t * 0.3) * r); }   // where the small sheet lands
  }
  jp.needsUpdate = true;
}
