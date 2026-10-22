/* js/campus/setup.js — Campus constants, shared state and the small procedural toolkit (noise, canvas textures, normal maps, geometry merging, wind sway).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ======================================================================
   Campus: walk out of the exit door and drive the robot around a science campus.
   Built the first time you step outside, so the lab itself still loads fast.
   ====================================================================== */
const world = new THREE.Group(); world.visible = false; scene.add(world);
const WB = 58;                                                     // hedge boundary (half size, metres)
const CAMPUS = { boxes: [], circles: [], paths: [], bldg: [], lots: [], ponds: [], plazas: [] };
let worldBuilt = false, worldOn = false, worldBusy = false;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const seeded = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const LAB_DOOR = { x: 0, z: -18 }, SPAWN = { x: 0, z: -14.2, h: -Math.PI / 2 };
const CHEM_DOOR = { x: 31.6, z: 0, hinted: false }, CHEM_SPAWN = { x: 30.0, z: 0, h: Math.PI, msg: "Back outside, by NCA" };
const LIB_DOOR = { x: 0, z: 35.6, hinted: false }, LIB_SPAWN = { x: 0, z: 33.3, h: Math.PI / 2, msg: "Back outside, by the Library" };
const wSpots = [], wSpotLayer = new THREE.Group(), finds = [];
let wMessTotal = 0, wMessDone = 0, wFound = 0;
// everything the campus needs to animate or retint, filled in by buildWorld()
const FX = { wind: { value: 0 }, sunV: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color(0, 0, 0) }, grass: null, grassU: null, sky: null, envDay: null, envNight: null, pond: null, basinMat: null, basinN: null,
  jets: null, jetSeeds: null, dna: null, lampGlow: null, lampPools: null, windowMats: [], carLights: [], stars: null, fireflies: null, flySeeds: null,
  motes: null, birds: [], butterflies: [], clouds: [], night: null };
let wbot = null, wBrush = null, wTurret = null, wLightMat = null, headlight = null, burstRing = null;
const SUN_DIR = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(56), THREE.MathUtils.degToRad(118)), MOON_DIR = new THREE.Vector3(-300, 230, -380).normalize();

/* small procedural toolkit: value noise, canvas textures, normal maps from height */
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
           L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
function fbm(x, y, z, oct) { let a = 0, f = 1, amp = 0.5; for (let i = 0; i < (oct || 4); i++) { a += amp * vnoise(x * f, y * f, z * f); f *= 2.03; amp *= 0.5; } return a; }
function ctex(w, h, draw, linear) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); if (!linear) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function normalFrom(hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext("2d").getImageData(0, 0, w, h).data, out = document.createElement("canvas"); out.width = w; out.height = h;
  const og = out.getContext("2d"), img = og.createImageData(w, h), H = (x, y) => src[((((y % h) + h) % h) * w + (((x % w) + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  og.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(out); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const canvasOf = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
function setRepeat(set, rx, ry) { const o = {}; for (const k in set) { const t = set[k].clone(); t.needsUpdate = true; t.repeat.set(rx, ry); o[k] = t; } return o; }
// merge a list of non-indexed-able geometries (position/normal/color) into one
function mergeGeos(list) {
  const parts = list.map(g => (g.index ? g.toNonIndexed() : g)), n = parts.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  parts.forEach(g => {
    const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); o += c;
  });
  const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(pos, 3)); m.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); m.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return m;
}
function paint(geo, fn) { const p = geo.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), col); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo; }
const windy = (m, amount, from, oneSided) => {   // leaves sway with the shared wind clock; cards light the same from both sides
  m.customProgramCacheKey = () => "windy" + amount + "_" + from + (oneSided ? "_1" : "");
  m.onBeforeCompile = sh => {
    sh.uniforms.uWind = FX.wind;
    // cut-out leaves must still write full alpha, or the page behind the transparent canvas glows through their edges
    if (oneSided) {
      Object.assign(sh.uniforms, { uSunV: FX.sunV, uSunCol: FX.sunCol });
      sh.fragmentShader = "#undef DOUBLE_SIDED\nuniform vec3 uSunV;\nuniform vec3 uSunCol;\nvarying vec3 vVP;\n" + sh.fragmentShader
        .replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "outgoingLight += diffuseColor.rgb * uSunCol * pow(max(dot(normalize(vVP), uSunV), 0.0), 3.0) * (0.3 + 0.7 * getShadowMask());\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );")
        .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n\tgl_FragColor.a = 1.0;");
      sh.vertexShader = "varying vec3 vVP;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n\tvVP = mvPosition.xyz;");
    }
    sh.vertexShader = "uniform float uWind;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec3 wp0 = vec3(0.0);
      #ifdef USE_INSTANCING
        wp0 = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #endif
      float bend = max(transformed.y - ${from.toFixed(2)}, 0.0);
      transformed.x += sin(uWind * 1.3 + wp0.x * 0.21 + wp0.z * 0.17) * ${amount.toFixed(3)} * bend;
      transformed.z += cos(uWind * 1.1 + wp0.x * 0.13 - wp0.z * 0.19) * ${(amount * 0.7).toFixed(3)} * bend;
      ${oneSided ? "#ifdef USE_UV\n transformed += vec3(sin(uWind * 3.1 + position.x * 2.3 + position.z * 1.7), 0.5 * sin(uWind * 2.3 + position.y * 3.0), cos(uWind * 2.7 + position.z * 2.1)) * 0.025 * uv.y;\n #endif" : ""}`);
  };
  return m;
};

/* shared while the campus is being built (buildWorld fills these) */
let rnd = null, blobTex = null, pathSet = null;
const blobs = [];                                                          // contact shadows: [x, z, sx, sz, rot]
const shrubs = [];                                                         // [x, z, size] beside building entrances
const tmp = new THREE.Matrix4();
const wbox = (w, h, d, c, x, y, z, o) => box(w, h, d, c, x, y, z, world, o);
const wcyl = (rt, rb, h, c, x, y, z, seg, o) => cyl(rt, rb, h, c, x, y, z, world, seg, o);
const flat = (geo, material, x, y, z) => { const m = new THREE.Mesh(geo, material); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; world.add(m); return m; };
// ground height: flat inside the campus, rolling hills beyond the hedge
function hillH(x, z) { const r = Math.max(Math.abs(x), Math.abs(z)), k = THREE.MathUtils.smoothstep(r, 64, 150); return k * (fbm(x * 0.012, 0, z * 0.012, 4) * 34 - 6) - 0.02 * (1 - k); }
