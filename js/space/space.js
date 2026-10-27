/* js/space/space.js — Low Earth orbit: the secret place above the campus. Hold Space (or Fly) for ten seconds outside to
   break orbit, or use the Space button once it's unlocked. Up here the robot flies freely: past a satellite, through a
   loop of glowing rings, round an asteroid field, with the Earth below, the Moon, the Sun and the Milky Way.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const spaceWorld = new THREE.Group(); spaceWorld.visible = false; scene.add(spaceWorld);
let spaceBuilt = false, spaceOn = false;
const SPACE_KEY = "kogason-space-unlocked";
let spaceUnlocked = false;
try { spaceUnlocked = localStorage.getItem(SPACE_KEY) === "1"; } catch (e) { /* storage blocked: stays locked this visit */ }
const SUN_SPACE = new THREE.Vector3(0.52, 0.42, 0.74).normalize();
const EARTH = { c: new THREE.Vector3(0, -235, -70), R: 190 };
const SP = { p: new THREE.Vector3(), v: new THREE.Vector3(), h: Math.PI / 2, w: 0, roll: 0, pitch: 0, rings: 0, warnT: 0 };
const SPX = { sky: null, follow: null, bot: null, jet: null, brush: null, turret: null, rings: [], rocks: null, rockList: [], sat: null, satLight: null, clouds: null, earth: null,
  dust: null, trail: null, trailPts: [], blink: 0 };

/* ---------- textures ---------- */
function milkyWayTex() {
  return ctex(4096, 2048, (g, w, h) => {
    g.fillStyle = "#020309"; g.fillRect(0, 0, w, h);
    const rnd = seeded(31);
    // the galactic band: a tilted sine across the sky, soft glows built from many faint blobs
    const bandY = x => h * (0.5 + 0.18 * Math.sin(x / w * Math.PI * 2 + 0.6));
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * w, y = bandY(x) + (rnd() - 0.5) * h * 0.16 * (0.4 + rnd()), r = 18 + rnd() * 90;
      const warm = rnd(), col = warm < 0.55 ? [150, 160, 210] : warm < 0.85 ? [210, 180, 160] : [190, 120, 170];
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.035 + rnd() * 0.03})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // the bright core near one end
    const cx = w * 0.72, cy = bandY(cx), core = g.createRadialGradient(cx, cy, 0, cx, cy, h * 0.22);
    core.addColorStop(0, "rgba(255,226,190,0.38)"); core.addColorStop(0.4, "rgba(220,170,150,0.12)"); core.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = core; g.fillRect(cx - h * 0.3, cy - h * 0.3, h * 0.6, h * 0.6);
    g.globalCompositeOperation = "source-over";
    // dust lanes down the middle of the band
    for (let i = 0; i < 900; i++) {
      const x = rnd() * w, y = bandY(x) + (rnd() - 0.5) * h * 0.035, r = 10 + rnd() * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(2,3,9,0.22)"); gr.addColorStop(1, "rgba(2,3,9,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // faint stars painted on, denser in the band
    for (let i = 0; i < 26000; i++) {
      const x = rnd() * w, inBand = rnd() < 0.55, y = inBand ? bandY(x) + (rnd() - 0.5) * h * 0.22 : rnd() * h, a = 0.25 + rnd() * 0.6;
      g.fillStyle = `rgba(${200 + rnd() * 55 | 0},${200 + rnd() * 55 | 0},255,${a})`; g.fillRect(x, y, rnd() < 0.08 ? 2 : 1, 1);
    }
  });
}
function nebulaTex(c1, c2, seed) {
  return ctex(512, 512, (g, w, h) => {
    const rnd = seeded(seed); g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 220; i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.7) * w * 0.34, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d * 0.7, r = 30 + rnd() * 110;
      const c = rnd() < 0.6 ? c1 : c2, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.05 + rnd() * 0.05})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}
// the Earth is drawn per pixel: continents, deserts, forests, ice, clouds and city lights from 3D noise on the sphere,
// so coastlines stay sharp however close you fly
const EARTH_NOISE = `
float hash3d(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise3d(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3d(i), hash3d(i + vec3(1,0,0)), f.x), mix(hash3d(i + vec3(0,1,0)), hash3d(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3d(i + vec3(0,0,1)), hash3d(i + vec3(1,0,1)), f.x), mix(hash3d(i + vec3(0,1,1)), hash3d(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm3d(vec3 p) { float a = 0.0, w = 0.5; for (int i = 0; i < 6; i++) { a += w * noise3d(p); p = p * 2.03 + 11.7; w *= 0.5; } return a; }`;
const EARTH_VERT = "varying vec3 vObj; varying vec3 vNw; varying vec3 vView; void main(){ vObj = position; vec4 wp = modelMatrix * vec4(position, 1.0); vNw = normalize(mat3(modelMatrix) * normal); vView = cameraPosition - wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }";
function earthMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { uSun: { value: SUN_SPACE } }, vertexShader: EARTH_VERT, fragmentShader: `uniform vec3 uSun; varying vec3 vObj; varying vec3 vNw; varying vec3 vView; ${EARTH_NOISE}
void main() {
  vec3 n = normalize(vObj); float h = fbm3d(n * 1.9 + vec3(7.0, 3.0, 11.0));
  float land = smoothstep(0.495, 0.505, h), lat = abs(n.y);
  float dry = clamp(smoothstep(0.32, 0.0, abs(lat - 0.28)) * fbm3d(n * 5.0 + 2.0) * 1.6, 0.0, 1.0);
  vec3 lc = mix(vec3(0.10, 0.27, 0.10), vec3(0.66, 0.55, 0.34), dry); lc = mix(lc, vec3(0.42, 0.37, 0.31), smoothstep(0.6, 0.72, h));
  vec3 oc = mix(vec3(0.015, 0.07, 0.22), vec3(0.04, 0.30, 0.46), smoothstep(0.42, 0.497, h));
  vec3 col = mix(oc, lc, land);
  float ice = smoothstep(0.80, 0.86, lat + (fbm3d(n * 6.0) - 0.5) * 0.14); col = mix(col, vec3(0.93, 0.96, 0.99), ice);
  vec3 N = normalize(vNw), V = normalize(vView); float d = dot(N, uSun);
  float spec = pow(max(dot(N, normalize(uSun + V)), 0.0), 70.0) * (1.0 - land) * (1.0 - ice);
  vec3 day = col * (max(d, 0.0) * 1.25 + 0.015) + vec3(1.0, 0.94, 0.82) * spec * 0.9 * step(0.0, d);
  float city = smoothstep(0.64, 0.78, fbm3d(n * 46.0)) * land * (1.0 - ice) * (1.0 - dry * 0.7) * smoothstep(0.08, -0.18, d);
  gl_FragColor = vec4(day + vec3(1.0, 0.72, 0.38) * city, 1.0);
}` });
}
function cloudMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { uSun: { value: SUN_SPACE }, uTime: { value: 0 } }, transparent: true, depthWrite: false, vertexShader: EARTH_VERT, fragmentShader: `uniform vec3 uSun; uniform float uTime; varying vec3 vObj; varying vec3 vNw; varying vec3 vView; ${EARTH_NOISE}
void main() {
  vec3 n = normalize(vObj); vec3 q = n * vec3(5.0, 9.0, 5.0) + vec3(40.0 + uTime * 0.004, 2.0, 9.0);
  float c = fbm3d(q + fbm3d(q * 0.6) * 0.9), a = smoothstep(0.57, 0.72, c) * 0.88;
  float d = dot(normalize(vNw), uSun);
  gl_FragColor = vec4(vec3(1.0) * (max(d, 0.0) * 1.1 + 0.025), a * 0.92);
}` });
}
function moonTex() {
  return ctex(512, 256, (g, w, h) => {
    const rnd = seeded(5); g.fillStyle = "#9a9a96"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 60; g.fillStyle = `rgba(60,60,64,${0.1 + rnd() * 0.18})`; g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 420; i++) { const x = rnd() * w, y = rnd() * h, r = 1 + Math.pow(rnd(), 3) * 14; g.strokeStyle = "rgba(220,220,214,0.35)"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.fillStyle = "rgba(40,40,44,0.25)"; g.beginPath(); g.arc(x + r * 0.15, y + r * 0.15, r * 0.8, 0, 7); g.fill(); }
  });
}
function spaceGlowTex(stops) {
  return ctex(256, 256, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); stops.forEach(([o, c]) => r.addColorStop(o, c)); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
const addSprite = (map, s, color, opacity) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: color || 0xffffff, transparent: true, opacity: opacity == null ? 1 : opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false })); m.scale.set(s, s, 1); return m; };

/* ---------- building the scene ---------- */
function buildSpace() {
  if (spaceBuilt) return;
  spaceBuilt = true;
  // things infinitely far away travel with the camera: sky, stars, nebulae, the Sun
  const follow = new THREE.Group(); spaceWorld.add(follow); SPX.follow = follow;
  SPX.sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 64, 32), new THREE.MeshBasicMaterial({ map: milkyWayTex(), side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
  SPX.sky.rotation.set(0.5, 0.3, 0.9); SPX.sky.renderOrder = -10; follow.add(SPX.sky);
  // bright stars as round, twinkling points
  { const N = 3200, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), ph = new Float32Array(N), rnd = seeded(8), v = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      v.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().multiplyScalar(1500 + rnd() * 200); v.toArray(pos, i * 3);
      const t = rnd(); c.setHSL(t < 0.2 ? 0.08 : t < 0.35 ? 0.6 : 0.62, t < 0.35 ? 0.6 : 0.15, 0.75 + rnd() * 0.25); c.toArray(col, i * 3);
      size[i] = Math.pow(rnd(), 6) * 6 + 1.1; ph[i] = rnd() * 6.28;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(size, 1)); geo.setAttribute("phase", new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: "attribute float size; attribute float phase; uniform float uTime; uniform float uPR; varying vec3 vC; varying float vA; void main(){ vC = color; vA = 0.75 + 0.25 * sin(uTime * (1.3 + phase) + phase * 7.0); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = size * uPR; }",
      fragmentShader: "varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r); gl_FragColor = vec4(vC * vA, a * vA); }" });
    SPX.stars = new THREE.Points(geo, m); SPX.stars.frustumCulled = false; follow.add(SPX.stars); }
  [[[200, 70, 190], [80, 70, 220], 3, [-0.6, 0.25, -0.75], 900], [[60, 170, 200], [40, 90, 200], 11, [0.85, 0.35, -0.3], 760], [[230, 120, 90], [150, 60, 140], 17, [-0.2, -0.15, 0.95], 640], [[120, 90, 230], [200, 90, 170], 23, [0.1, 0.9, 0.2], 820]].forEach(([c1, c2, s, d, sc]) => {
    const sp = addSprite(nebulaTex(c1, c2, s), sc, 0xffffff, 0.9); sp.position.set(d[0], d[1], d[2]).normalize().multiplyScalar(1450); sp.renderOrder = -9; follow.add(sp);
  });
  const sunGlow = spaceGlowTex([[0, "rgba(255,255,250,1)"], [0.08, "rgba(255,246,220,0.95)"], [0.25, "rgba(255,200,140,0.25)"], [1, "rgba(255,160,90,0)"]]);
  const sunP = SUN_SPACE.clone().multiplyScalar(1400);
  [[260, 1], [900, 0.35], [2200, 0.12]].forEach(([s, o]) => { const sp = addSprite(sunGlow, s, 0xffffff, o); sp.position.copy(sunP); sp.renderOrder = -8; follow.add(sp); });

  // the Earth, its clouds and a blue atmosphere
  SPX.earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH.R, 128, 64), earthMaterial());
  // tilted so the tropics face you when you arrive (not the ice cap); the planet turns about its own axis
  const tilt = new THREE.Group(); tilt.position.copy(EARTH.c); tilt.rotation.set(1.45, 0, 0.32); spaceWorld.add(tilt);
  SPX.earth.rotation.y = 1.2; tilt.add(SPX.earth);
  SPX.clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH.R * 1.008, 128, 64), cloudMaterial());
  SPX.clouds.rotation.y = 1.2; tilt.add(SPX.clouds);
  const atmo = (R, side, power, k, op) => new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN_SPACE }, uOp: { value: op } }, side, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vW = normalize(mat3(modelMatrix) * normal); vN = normalize(normalMatrix * normal); vV = normalize(-(modelViewMatrix * vec4(position,1.0)).xyz); gl_Position = projectionMatrix * viewMatrix * wp; }",
    fragmentShader: `uniform vec3 uSun; uniform float uOp; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f = ${k}; float lit = smoothstep(-0.35, 0.4, dot(vW, uSun)); vec3 col = mix(vec3(0.25,0.55,1.0), vec3(0.55,0.8,1.0), f); gl_FragColor = vec4(col * lit, clamp(pow(f, ${power}) * uOp, 0.0, 1.0) * lit); }` }));
  const inner = atmo(EARTH.R * 1.012, THREE.FrontSide, "2.6", "1.0 - max(dot(vN, vV), 0.0)", 1.4); inner.position.copy(EARTH.c); spaceWorld.add(inner);
  const outer = atmo(EARTH.R * 1.09, THREE.BackSide, "1.6", "max(dot(-vN, vV) - 0.05, 0.0) * 1.7", 1.0); outer.position.copy(EARTH.c); spaceWorld.add(outer);

  // the Moon
  const moon = new THREE.Mesh(new THREE.SphereGeometry(30, 64, 32), new THREE.MeshStandardMaterial({ map: moonTex(), roughness: 1 })); moon.position.set(-330, 90, -560); spaceWorld.add(moon);

  // KOGASON-1, a little science satellite: gold-foil bus, two solar wings, a dish and a blinking beacon
  const sat = new THREE.Group(); sat.position.set(16, 3, -34); spaceWorld.add(sat); SPX.sat = sat;
  const foil = ctex(256, 256, (g, w, h) => { const rnd = seeded(12); g.fillStyle = "#c9962e"; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "255,226,140" : "120,80,20"},${0.15 + rnd() * 0.3})`; const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd() * 50 - 25, y + rnd() * 50 - 25); g.lineTo(x + rnd() * 40 - 20, y + rnd() * 40 - 20); g.fill(); } });
  const panelT = ctex(256, 128, (g, w, h) => { g.fillStyle = "#0f1f4a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#5a7ad0"; g.lineWidth = 2; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(140,170,255,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  box(2.2, 2.2, 3.2, new THREE.MeshStandardMaterial({ map: foil, metalness: 0.9, roughness: 0.35 }), 0, 0, 0, sat);
  [-1, 1].forEach(s => {
    box(0.1, 0.1, 1.6, mat(0xb8bec4, { metalness: 0.8, roughness: 0.3 }), s * 1.9, 0, 0, sat).rotation.y = Math.PI / 2;
    const wing = box(7, 0.06, 2.6, new THREE.MeshStandardMaterial({ map: panelT, metalness: 0.6, roughness: 0.25, emissive: 0x0a1430 }), s * 6.2, 0, 0, sat);
  });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 12, 0, Math.PI * 2, 0, 0.9), new THREE.MeshStandardMaterial({ color: 0xeef1f3, roughness: 0.4, side: THREE.DoubleSide })); dish.position.set(0, 1.9, 0.6); dish.rotation.x = -0.4; sat.add(dish);
  cyl(0.03, 0.03, 1.2, mat(0xdfe3e6), 0, 2.1, 0.9, sat, 6);
  SPX.satLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff5040, toneMapped: false })); SPX.satLight.position.set(0, 1.25, -1.5); sat.add(SPX.satLight);
  const satName = ctex(512, 96, (g, w, h) => { g.fillStyle = "#111820"; g.fillRect(0, 0, w, h); g.fillStyle = "#e9eef2"; g.font = "700 54px 'IBM Plex Mono', monospace"; g.textAlign = "center"; g.fillText("KOGASON-1", w / 2, h * 0.72); });
  plane(2.0, 0.38, new THREE.MeshBasicMaterial({ map: satName }), 1.11, 0.4, 0, Math.PI / 2, sat);

  // eight rings in a loop to fly through
  const ringPath = t => new THREE.Vector3(Math.sin(t) * 46 - 46, 1.5 + Math.sin(t * 2) * 8, -14 + Math.cos(t) * 40);   // ring 1 sits straight ahead of where you arrive
  const halo = spaceGlowTex([[0, "rgba(120,255,240,0)"], [0.82, "rgba(120,255,240,0)"], [0.9, "rgba(120,255,240,0.55)"], [1, "rgba(120,255,240,0)"]]);
  for (let i = 0; i < 8; i++) {
    const t = Math.PI / 2 + i / 8 * Math.PI * 2, p = ringPath(t), n = ringPath(t + 0.01).sub(p).normalize();
    const g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().add(n)); spaceWorld.add(g);
    const m = new THREE.MeshBasicMaterial({ color: 0x5ff0dc, toneMapped: false });
    g.add(new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.16, 12, 64), m));
    const h2 = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: halo, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); g.add(h2);
    SPX.rings.push({ g, m, halo: h2, c: p, n, done: false, side: 0 });
  }

  // an asteroid field off to one side: lumpy rocks, slowly turning together
  { const rnd = seeded(41), base = new THREE.IcosahedronGeometry(1, 2), pa = base.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const k = 0.72 + fbm(v.x * 1.7 + 3, v.y * 1.7, v.z * 1.7, 3) * 0.6; pa.setXYZ(i, v.x * k, v.y * k * 0.85, v.z * k); }
    base.computeVertexNormals();
    const N = 260, rocks = new THREE.InstancedMesh(base, new THREE.MeshStandardMaterial({ color: 0x8a7f74, roughness: 0.95, flatShading: true }), N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const field = new THREE.Group(); field.position.set(110, -6, -40); spaceWorld.add(field); SPX.rocks = field;
    for (let i = 0; i < N; i++) {
      const a = rnd() * Math.PI * 2, r = 20 + rnd() * 60, p = new THREE.Vector3(Math.cos(a) * r, (rnd() - 0.5) * 14 * (1 - r / 120), Math.sin(a) * r * 0.7);
      const s = 0.4 + Math.pow(rnd(), 3) * 5; q.setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6));
      m4.compose(p, q, new THREE.Vector3(s, s * (0.7 + rnd() * 0.5), s)); rocks.setMatrixAt(i, m4); rocks.setColorAt(i, c.setHSL(0.07, 0.12 + rnd() * 0.1, 0.32 + rnd() * 0.2));
      if (s > 1.2) SPX.rockList.push({ p, r: s * 0.9 });
    }
    field.add(rocks); }

  // the robot, its jet and the ribbon it leaves behind
  SPX.bot = bot.clone(true); spaceWorld.add(SPX.bot);
  SPX.brush = SPX.bot.children[bot.children.indexOf(brush)]; SPX.turret = SPX.bot.children[bot.children.indexOf(turret)];
  SPX.bot.traverse(o => { if (o.material === botLight) o.material = new THREE.MeshBasicMaterial({ color: 0x5ff0dc, toneMapped: false }); });
  SPX.jet = makeJet(); SPX.bot.add(SPX.jet);
  // jets on the back too, for forward thrust
  SPX.back = makeJet(); SPX.back.rotation.z = -Math.PI / 2; SPX.back.position.set(-0.17, 0.06, 0); SPX.bot.add(SPX.back);
  { const N = 48, geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3)); geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3));
    const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
    SPX.trail = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    SPX.trail.frustumCulled = false; spaceWorld.add(SPX.trail); SPX.trailN = N; }
  // drifting dust close to the camera, so speed reads even far from anything
  { const N = 700, pos = new Float32Array(N * 3), rnd = seeded(9); for (let i = 0; i < N * 3; i++) pos[i] = (rnd() - 0.5) * 70;
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    SPX.dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9fb6d8, size: 0.09, transparent: true, opacity: 0.6, depthWrite: false })); SPX.dust.frustumCulled = false; spaceWorld.add(SPX.dust); SPX.dustBase = pos.slice(); }
}

/* ---------- going up and coming down ---------- */
function setSpaceHud(on) {
  hudEl.classList.toggle("space", on);
  document.getElementById("hudEyebrow").textContent = on ? "Low Earth orbit" : "Campus · drive mode";
  document.getElementById("hudTitle").textContent = on ? "Out of this world" : "Out for a spin";
  mmEl.hidden = on || !worldOn; flyEl.textContent = on ? "Up" : "Fly"; boostEl.textContent = on ? "Down" : "Boost";
  spaceBtnSync();
}
function spaceBtnSync() {
  const b = document.getElementById("goSpace");
  b.classList.toggle("locked", !spaceUnlocked); b.hidden = spaceOn;
  b.setAttribute("aria-label", spaceUnlocked ? "Go to space" : "Space (locked: hold Space for 10 seconds to unlock)");
  b.title = spaceUnlocked ? "" : "Locked: hold Space (or Fly) for 10 seconds outside";
  document.getElementById("goCampus").hidden = !spaceOn;
}
function unlockSpace() { spaceUnlocked = true; try { localStorage.setItem(SPACE_KEY, "1"); } catch (e) { /* fine: unlocked for this visit */ } spaceBtnSync(); }
function enterSpace() {
  if (!worldOn || worldBusy || spaceOn) return;
  worldBusy = true;
  fade(true, 550, async () => {
    if (!spaceBuilt) await runWithLoader("Orbit", "Lifting off", [["Lighting the stars", () => buildSpace()]]);
    buildSpace();
    world.visible = false; spaceWorld.visible = true; spaceOn = true; scene.fog = null; scene.environment = null;
    camera.far = 4000; camera.updateProjectionMatrix();
    renderer.toneMappingExposure = 0.85;
    hemi.color.setHex(0x3a4a6e); hemi.groundColor.setHex(0x101420); hemi.intensity = 0.35; fill.intensity = 0;
    sun.color.setHex(0xfff6ea); sun.intensity = 2.6; headlight.intensity = 0;
    SP.p.set(0, 0, 0); SP.v.set(0, 0, 0); SP.h = Math.PI / 2; SP.w = 0; SP.roll = SP.pitch = 0; SPX.trailPts.length = 0;
    SPX.rings.forEach(r => { r.done = false; r.m.color.setHex(0x5ff0dc); r.halo.material.color.setHex(0xffffff); r.side = 0; }); SP.rings = 0;
    CAM.yaw = 0; CAM.pitch = 0.28; CAM.dist = 5.5;
    hudNearEl().hidden = true; hudAltEl.hidden = false; setSpaceHud(true); spaceHudSync();
    hint.textContent = COARSE ? "Stick to fly · hold Up or Down · drag elsewhere to look around" : "W A S D to fly · Space to rise · Shift to sink · drag to look · scroll to zoom";
    updateSpace(0, 0); chaseSpace(0, true); warmUp();
    fade(false, 900, () => { worldBusy = false; toast("Welcome to orbit. Fly through the eight glowing rings"); }, "#000000");
  }, "#000000");
}
// back down to the campus, arriving high over the plaza and gliding in
const SPACE_RETURN = { x: 0, z: -14, h: -Math.PI / 2, y: 26, msg: "Back from orbit. Let go to glide down" };
function leaveSpace() {
  if (!spaceOn || worldBusy) return;
  worldBusy = true;
  fade(true, 550, () => { closeSpace(); setupWorld(SPACE_RETURN); fade(false, 700, () => { worldBusy = false; }); }, "#000000");
}
// tidy space away without changing what comes next (the campus, the lab or another building sets itself up)
function closeSpace() {
  if (!spaceOn) return;
  spaceOn = false; spaceWorld.visible = false; setSpaceHud(false);
}
const hudNearEl = () => document.getElementById("hudNear");
function spaceHudSync() { document.getElementById("hudRings").textContent = `${SP.rings} / ${SPX.rings.length}`; }

/* ---------- flying ---------- */
const _f = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3();
function updateSpace(dt, time) {
  let thr = 0, str = 0;
  if (keys.KeyW || keys.ArrowUp) thr += 1; if (keys.KeyS || keys.ArrowDown) thr -= 1;
  if (keys.KeyA || keys.ArrowLeft) str += 1; if (keys.KeyD || keys.ArrowRight) str -= 1;
  if (joy.active) { thr = -joy.y; str = -joy.x; }
  const up = (keys.Space || flyHeld ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight || keys.KeyC || boostHeld ? 1 : 0);
  // turn, then ease velocity toward where the sticks point: forward along the heading, up and down on the world axis
  SP.w += (str * 1.9 - SP.w) * Math.min(1, dt * 5); SP.h += SP.w * dt;
  _f.set(Math.cos(SP.h), 0, -Math.sin(SP.h));
  _t.copy(_f).multiplyScalar(thr >= 0 ? thr * 16 : thr * 6); _t.y = up * 9;
  SP.v.lerp(_t, Math.min(1, dt * (thr || up ? 1.4 : 0.6)));
  SP.p.addScaledVector(SP.v, dt);
  // don't wander off: a soft pull home past 260 m; the Earth, the satellite and big rocks push back
  const far = SP.p.length();
  if (far > 260) { SP.v.addScaledVector(SP.p, -dt * (far - 260) * 0.02); SP.warnT -= dt; if (SP.warnT <= 0) { toast("Drifting too far. Turning you back toward the rings"); SP.warnT = 6; } }
  const toE = _q.copy(SP.p).sub(EARTH.c), dE = toE.length(), minE = EARTH.R + 14;
  if (dE < minE) { SP.p.copy(EARTH.c).addScaledVector(toE, minE / dE); SP.v.addScaledVector(toE.normalize(), Math.max(0, -SP.v.dot(toE)) + 2); }
  const push = (c, r) => { const d = _q.copy(SP.p).sub(c), L = d.length(); if (L < r && L > 1e-4) { SP.p.copy(c).addScaledVector(d, r / L); SP.v.addScaledVector(d.normalize(), -Math.min(0, SP.v.dot(d)) * 1.3); camShake = Math.max(camShake, 0.12); } };
  if (SPX.sat) push(SPX.sat.position, 3.4);
  if (SPX.rocks) { SPX.rocks.updateMatrixWorld(); SPX.rockList.forEach(r => push(_t.copy(r.p).applyMatrix4(SPX.rocks.matrixWorld), r.r + 0.5)); }

  // rings: count each the first time you pass through its middle
  SPX.rings.forEach((r, i) => {
    const d = _q.copy(SP.p).sub(r.c), side = Math.sign(d.dot(r.n));
    if (!r.done && r.side && side && side !== r.side && d.length() < 3.1) {
      r.done = true; SP.rings++; r.m.color.setHex(0xffd36b); r.halo.material.color.setHex(0xffc060); spaceHudSync();
      toast(SP.rings === SPX.rings.length ? "All eight rings! Ace pilot" : `Ring ${SP.rings} of ${SPX.rings.length}`); camShake = 0.1;
    }
    r.side = side; r.halo.material.opacity = (r.done ? 0.5 : 0.75) + 0.25 * Math.sin(time * 3 + i);
    r.g.rotateZ(dt * 0.3);
  });

  // the robot: banks into turns, noses up and down with climbs, jets glow with thrust
  SP.roll += (-SP.w * 0.32 - SP.roll) * Math.min(1, dt * 4); SP.pitch += (SP.v.y * 0.035 - SP.pitch) * Math.min(1, dt * 4);
  SPX.bot.position.copy(SP.p); SPX.bot.position.y += Math.sin(time * 1.6) * 0.06;
  SPX.bot.rotation.set(SP.roll, SP.h, SP.pitch, "YXZ");
  SPX.brush.rotation.y += dt * 30; SPX.turret.rotation.y += dt * 2;
  const lift = Math.max(0, up), fwd = Math.max(0, thr);
  SPX.jet.visible = true; SPX.jet.scale.set(1, 0.35 + lift * (0.8 + Math.random() * 0.4), 1); SPX.jet.material.opacity = 0.25 + lift * 0.35;
  SPX.back.visible = fwd > 0; SPX.back.scale.set(1, fwd * (1 + Math.random() * 0.5), 1); SPX.back.material.opacity = 0.5 * fwd;

  // the ribbon trail: newest point at the robot, fading to nothing
  const tp = SPX.trailPts; tp.unshift(SPX.bot.position.clone().addScaledVector(_f, -0.2)); if (tp.length > SPX.trailN) tp.pop();
  const pa = SPX.trail.geometry.attributes.position, ca = SPX.trail.geometry.attributes.color, cd = _t.copy(camera.position);
  for (let i = 0; i < SPX.trailN; i++) {
    const p = tp[Math.min(i, tp.length - 1)] || SP.p, nx = tp[Math.min(i + 1, tp.length - 1)] || p;
    const dir = _q.copy(p).sub(nx); if (dir.lengthSq() < 1e-6) dir.copy(_f);
    const side = dir.cross(_f.clone().copy(cd).sub(p)).normalize(), k = i < tp.length ? 1 - i / SPX.trailN : 0, w = 0.05 * k + 0.008;
    pa.setXYZ(i * 2, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w); pa.setXYZ(i * 2 + 1, p.x - side.x * w, p.y - side.y * w, p.z - side.z * w);
    const sp = Math.min(1, SP.v.length() / 10), near = Math.min(1, Math.max(0, (p.distanceTo(cd) - 2.5) / 3)), b = k * k * (0.2 + 0.8 * sp) * near * Math.max(0, 1 - p.distanceTo(SP.p) / 6) * 0.7;
    ca.setXYZ(i * 2, 0.35 * b, 0.95 * b, 0.88 * b); ca.setXYZ(i * 2 + 1, 0.35 * b, 0.95 * b, 0.88 * b);
  }
  pa.needsUpdate = ca.needsUpdate = true;
  _f.set(Math.cos(SP.h), 0, -Math.sin(SP.h));

  // the rest of the sky
  if (SPX.sat) { SPX.sat.rotation.y += dt * 0.12; SPX.sat.rotation.x = Math.sin(time * 0.2) * 0.15; SPX.blink += dt; SPX.satLight.visible = SPX.blink % 1.6 < 0.12; }
  if (SPX.rocks) SPX.rocks.rotation.y += dt * 0.012;
  SPX.earth.rotation.y += dt * 0.004; SPX.clouds.rotation.y += dt * 0.004; SPX.clouds.material.uniforms.uTime.value = time;
  SPX.stars.material.uniforms.uTime.value = time; SPX.stars.material.uniforms.uPR.value = renderer.getPixelRatio();
  const sun0 = SUN_SPACE; sun.position.copy(SP.p).addScaledVector(sun0, 50); sun.target.position.copy(SP.p);
  chaseSpace(dt, false);
  SPX.follow.position.copy(camera.position);
  // dust wraps round the camera
  const dp = SPX.dust.geometry.attributes.position, db = SPX.dustBase, cp = camera.position;
  for (let i = 0; i < dp.count; i++) {
    const wrap = (b, c) => { let v = b - c; v = ((v % 70) + 105) % 70 - 35; return c + v; };
    dp.setXYZ(i, wrap(db[i * 3], cp.x), wrap(db[i * 3 + 1], cp.y), wrap(db[i * 3 + 2], cp.z));
  }
  dp.needsUpdate = true;
  altClock -= dt; if (altClock <= 0) { altClock = 0.2; hudAltEl.textContent = `Speed ${SP.v.length().toFixed(0)} m/s · ${Math.round(400 + (SP.p.distanceTo(EARTH.c) - EARTH.R - 200) * 0.6)} km up`; }
  adaptResolution();
}
// chase camera in 3D: behind and a little above, drag to look round, scroll to zoom
function chaseSpace(dt, snap) {
  const yaw = SP.h + CAM.yaw, cp = Math.cos(CAM.pitch), dist = CAM.dist + 1.5;
  const want = _q.set(-Math.cos(yaw) * cp, Math.sin(CAM.pitch), Math.sin(yaw) * cp).multiplyScalar(dist).add(SP.p).add(_t.set(0, 0.4, 0));
  const look = new THREE.Vector3(Math.cos(SP.h) * 1.4, 0.3, -Math.sin(SP.h) * 1.4).add(SP.p);
  const k = snap ? 1 : 1 - Math.exp(-dt * 5);
  camera.position.lerp(want, k); CAM.look.lerp(look, snap ? 1 : 1 - Math.exp(-dt * 8));
  if (camShake > 0) { camShake -= dt; camera.position.x += (Math.random() - 0.5) * camShake * 0.25; camera.position.y += (Math.random() - 0.5) * camShake * 0.25; }
  camera.lookAt(CAM.look);
  if (!CAM.drag) { CAM.idle += dt; if (CAM.idle > 1.4) CAM.yaw *= Math.exp(-dt * 1.6); }
}
document.getElementById("goSpace").addEventListener("click", () => {
  if (spaceUnlocked) enterSpace(); else toast("Locked. Hold Space (or Fly) for 10 seconds to break orbit");
});
document.getElementById("goCampus").addEventListener("click", () => leaveSpace());
