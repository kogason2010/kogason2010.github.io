/* js/campus/bots.js — The campus robots: six original lab bots with screen faces (four on two legs, a roller and a
   survey drone) going about their day. They find their way along the paths and round the plaza (A* over a coarse map
   of the campus that prefers paving to lawn), go in and out of the buildings and the café, sit on the benches, stop to
   chat, check a tablet, look at the fountain, the pond and the physic garden, and wait for the robot vacuum to pass
   (turning to watch it, with a smile, when it comes close).
   Each robot is one skinned mesh (its jointed parts merged onto a skeleton) plus its screen face and a glow layer, so
   all six cost a handful of draw calls.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// in this order so the four shown in Light graphics are a mix
const CBOT_TYPES = [
  { role: "Courier bot", kind: "biped", h: 1.0, w: 1.0, accent: 0x2f6fb5, eye: "#7fe3ff", carry: "rack" },
  { role: "Roller bot", kind: "ball", h: 1.0, w: 1.0, accent: 0x7a5fc0, eye: "#d2b8ff", carry: "phone" },
  { role: "Coffee-run bot", kind: "biped", h: 0.88, w: 1.0, accent: 0xc8463c, eye: "#ffd36b", carry: "cup" },
  { role: "Survey drone", kind: "hover", h: 1.0, w: 1.0, accent: 0x0a5fb4, eye: "#7fe3ff" },
  { role: "Lab-assist bot", kind: "biped", h: 1.16, w: 1.22, accent: 0xf2c230, eye: "#5fe39a", carry: "clipboard" },
  { role: "Little helper bot", kind: "biped", h: 0.7, w: 0.92, accent: 0x3a9d5a, eye: "#7fe3ff", pack: true },
];
const CBOT_HIP = 0.95;   // a two-legged bot's hip height, standing (before its own scale)

/* ---- building a robot ---- */
// a capsule along -y from 0 (top) to -len, radius r1 at the top and r2 at the bottom
function cbotCapsule(r1, r2, len) {
  const p = [], n = 5;
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI / 2; p.push(new THREE.Vector2(Math.cos(a) * r2, -len + r2 + Math.sin(a) * r2)); }
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; p.push(new THREE.Vector2(Math.cos(a) * r1, -r1 + Math.sin(a) * r1)); }
  return new THREE.LatheGeometry(p, 12);
}
// a screen face: eyes drawn per expression (normal, blink, happy, down, rest)
function cbotFace(color) {
  const c = document.createElement("canvas"); c.width = 128; c.height = 64; const g = c.getContext("2d"), t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const draw = expr => {
    g.fillStyle = "#0b1218"; g.fillRect(0, 0, 128, 64); g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 7; g.lineCap = "round";
    [38, 90].forEach(x => {
      if (expr === "blink") { g.beginPath(); g.moveTo(x - 11, 34); g.lineTo(x + 11, 34); g.stroke(); }
      else if (expr === "happy") { g.beginPath(); g.arc(x, 38, 11, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      else if (expr === "rest") { g.beginPath(); g.arc(x, 28, 11, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
      else { const y = expr === "down" ? 40 : 32; g.beginPath(); if (g.roundRect) g.roundRect(x - 9, y - 12, 18, 24, 8); else g.rect(x - 9, y - 12, 18, 24); g.fill(); g.fillStyle = "rgba(255,255,255,0.55)"; g.fillRect(x - 4, y - 8, 4, 5); g.fillStyle = color; }
    });
    t.needsUpdate = true;
  };
  draw("normal"); return { t, draw, expr: "normal" };
}
// merge parts (each a geometry placed on a bone) into one skinned geometry with vertex colours
function cbotMerge(parts, bones) {
  let nv = 0, ni = 0;
  parts.forEach(e => { e.geo.applyMatrix4(e.b.matrixWorld.clone().multiply(e.m)); nv += e.geo.attributes.position.count; ni += e.geo.index ? e.geo.index.count : e.geo.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), si = new Float32Array(nv * 4), sw = new Float32Array(nv * 4), idx = new Uint32Array(ni), c = new THREE.Color();
  let v = 0, k = 0;
  parts.forEach(e => {
    const g = e.geo, n = g.attributes.position.count, b = bones.indexOf(e.b); c.set(e.col);
    pos.set(g.attributes.position.array, v * 3); nor.set(g.attributes.normal.array, v * 3);
    for (let i = 0; i < n; i++) { col[(v + i) * 3] = c.r; col[(v + i) * 3 + 1] = c.g; col[(v + i) * 3 + 2] = c.b; si[(v + i) * 4] = b; sw[(v + i) * 4] = 1; }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[k++] = g.index.array[i] + v; else for (let i = 0; i < n; i++) idx[k++] = v + i;
    v += n; g.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4)); geo.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere(); geo.boundingSphere.radius += 0.5;   // room for the limbs to swing
  return geo;
}
function cbotBuild(o) {
  const P = [], GL = [], bones = [], tmp = new THREE.Object3D(), keep = m => { m.userData.keep = true; return m; };
  const SHELL = 0xeef1f2, DARK = 0x2a3036, ACC = o.accent, EYE = new THREE.Color(o.eye).getHex(), biped = o.kind === "biped", hover = o.kind === "hover";
  const bone = (parent, x, y, z) => { const b = new THREE.Bone(); b.position.set(x, y, z); if (parent) parent.add(b); bones.push(b); return b; };
  const add = (geo, col, x, y, z, b, rot, scl, glow) => {
    tmp.position.set(x, y, z); tmp.rotation.set(...(rot || [0, 0, 0])); tmp.scale.set(...(scl || [1, 1, 1])); tmp.updateMatrix();
    (glow ? GL : P).push({ geo, col, b, m: tmp.matrix.clone() });
  };
  const body = bone(null, 0, 0, 0); body.scale.set(o.w, o.h, o.w);
  const hips = bone(body, 0, biped ? CBOT_HIP : o.kind === "ball" ? 0.62 : 1.25, 0), spine = bone(hips, 0, 0, 0), extra = {};
  if (biped) add(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 18), DARK, 0, 0, 0, hips);
  if (o.kind === "ball") {
    const ball = extra.ball = bone(body, 0, 0.3, 0);
    add(new THREE.SphereGeometry(0.3, 22, 14), DARK, 0, 0, 0, ball); add(new THREE.TorusGeometry(0.3, 0.025, 8, 32), ACC, 0, 0, 0, ball, [0, Math.PI / 2, 0]);
    add(new THREE.CylinderGeometry(0.2, 0.26, 0.12, 20), SHELL, 0, -0.06, 0, hips);
  }
  if (hover) add(new THREE.TorusGeometry(0.22, 0.05, 10, 28), DARK, 0, -0.08, 0, hips, [Math.PI / 2, 0, 0]);
  add(cbotCapsule(0.19, 0.17, hover ? 0.45 : 0.56), SHELL, 0, hover ? 0.42 : 0.6, 0, spine, null, [1, 1, 0.78]);
  add(new THREE.CylinderGeometry(0.2, 0.196, 0.08, 24, 1, true), ACC, 0, 0.36, 0, spine, null, [1, 1, 0.78]);
  add(new THREE.CircleGeometry(0.035, 16), EYE, 0.07, 0.46, 0.15, spine, null, null, true);
  if (o.pack) { add(new THREE.BoxGeometry(0.26, 0.3, 0.12), ACC, 0, 0.36, -0.17, spine); add(new THREE.BoxGeometry(0.1, 0.04, 0.02), EYE, 0, 0.42, -0.235, spine, null, null, true); }
  const neck = bone(spine, 0, hover ? 0.46 : 0.6, 0); add(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 12), DARK, 0, 0.04, 0, neck);
  const head = bone(neck, 0, 0.19, 0);
  add(cbotCapsule(0.13, 0.13, 0.3), SHELL, -0.15, 0, 0, head, [0, 0, Math.PI / 2], [1, 1, 0.9]);   // a pill-shaped head, lying sideways
  [-1, 1].forEach(sd => { add(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), DARK, sd * 0.17, 0, 0, head, [0, 0, Math.PI / 2]); add(new THREE.TorusGeometry(0.05, 0.012, 6, 18), ACC, sd * 0.192, 0, 0, head, [0, Math.PI / 2, 0]); });
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), DARK, 0.05, 0.19, 0, head); add(new THREE.SphereGeometry(0.022, 10, 8), EYE, 0.05, 0.27, 0, head, null, null, true);
  const legs = [-1, 1].map(sd => {
    const thigh = bone(hips, sd * 0.09, -0.04, 0), knee = bone(thigh, 0, -0.42, 0), ankle = bone(knee, 0, -0.42, 0);
    if (biped) {
      add(cbotCapsule(0.075, 0.065, 0.42), SHELL, 0, 0, 0, thigh); add(new THREE.SphereGeometry(0.07, 12, 8), DARK, 0, 0, 0, knee);
      add(cbotCapsule(0.065, 0.075, 0.42), ACC, 0, -0.02, 0, knee); add(cbotCapsule(0.06, 0.06, 0.24), DARK, 0, -0.03, 0.15, ankle, [Math.PI / 2, 0, 0], [1.25, 1, 0.75]);
    }
    return { thigh, knee, ankle };
  });
  const arms = [-1, 1].map(sd => {
    const sh = bone(spine, sd * 0.235, hover ? 0.36 : 0.5, 0); add(new THREE.SphereGeometry(0.065, 12, 8), DARK, 0, 0, 0, sh); add(cbotCapsule(0.05, 0.045, 0.28), SHELL, 0, -0.02, 0, sh);
    const el = bone(sh, 0, -0.28, 0); add(new THREE.SphereGeometry(0.05, 10, 8), DARK, 0, 0, 0, el); add(cbotCapsule(0.048, 0.042, 0.25), ACC, 0, -0.01, 0, el);
    const hand = bone(el, 0, -0.26, 0); add(new THREE.BoxGeometry(0.07, 0.05, 0.06), DARK, 0, -0.01, 0, hand); [-0.022, 0.022].forEach(x => add(new THREE.BoxGeometry(0.016, 0.07, 0.03), DARK, x, -0.06, 0.012, hand));
    return { sh, el, hand };
  });
  const hand = arms[1].hand;
  if (o.carry === "cup") { add(new THREE.CylinderGeometry(0.035, 0.028, 0.11, 12), 0xf2f0ea, 0, -0.07, 0.05, hand); add(new THREE.CylinderGeometry(0.037, 0.037, 0.03, 12), 0x1f3d33, 0, -0.1, 0.05, hand); }
  if (o.carry === "phone") { add(new THREE.BoxGeometry(0.18, 0.012, 0.13), DARK, 0, -0.08, 0.05, hand); add(new THREE.PlaneGeometry(0.16, 0.11), 0x7fd3ff, 0, -0.073, 0.05, hand, [-Math.PI / 2, 0, 0], null, true); }
  if (o.carry === "rack") { add(new THREE.BoxGeometry(0.2, 0.03, 0.08), ACC, 0, -0.1, 0.05, hand); [0xe3632d, 0x3fa7d6, 0x9b7bff].forEach((c, i) => add(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 8), c, (i - 1) * 0.06, -0.04, 0.05, hand)); }
  if (o.carry === "clipboard") add(new THREE.BoxGeometry(0.03, 0.26, 0.2), 0xb8946a, 0.02, -0.09, 0.02, arms[0].hand);

  // one skinned mesh for the body, one for the glowing bits, on a shared skeleton
  body.updateMatrixWorld(true);
  const bodyM = new THREE.MeshStandardMaterial({ vertexColors: true, skinning: true, roughness: 0.4, metalness: 0.2 });
  const glowM = new THREE.MeshBasicMaterial({ vertexColors: true, skinning: true, toneMapped: false });
  const root = keep(new THREE.Group()), sk = keep(new THREE.SkinnedMesh(cbotMerge(P, bones), bodyM));
  sk.castShadow = sk.receiveShadow = true; sk.add(body); root.add(sk); sk.bind(new THREE.Skeleton(bones));
  const gl = keep(new THREE.SkinnedMesh(cbotMerge(GL, bones), glowM)); root.add(gl); gl.bind(sk.skeleton);
  const face = cbotFace(o.eye), faceM = new THREE.MeshBasicMaterial({ map: face.t, toneMapped: false });
  const fm = keep(new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.13), faceM)); fm.position.z = 0.123; head.add(fm);
  const mats = [bodyM, glowM, faceM];
  if (hover) {
    extra.jet = keep(new THREE.Mesh(new THREE.CircleGeometry(0.2, 24).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: EYE, transparent: true, opacity: 0.8, toneMapped: false }))); extra.jet.position.y = -0.1; hips.add(extra.jet);
    extra.wash = keep(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 1.1, 24, 1, true), new THREE.MeshBasicMaterial({ color: EYE, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }))); extra.wash.position.y = -0.66; hips.add(extra.wash);
  }
  world.add(root);
  return {
    o, root, sk, mats, glowM, hips, spine, neck, head, legs, arms, face, extra, biped,
    speed: biped ? 0.8 + 0.25 * o.h : 1.2, lawn: hover ? 1.3 : o.kind === "ball" ? 6 : 4,
    x: 0, z: 0, y: 0, heading: 0, phase: Math.random() * 6.28, state: "idle", t: 0, dur: 0, route: null, ri: 0, then: null,
    sitBlend: 0, sitOff: [0, 0], fade: 1, faded: false, blinkT: Math.random() * 3, lookYaw: null,
  };
}

/* ---- the campus map they find their way on: 0.5 m cells, each paving, gravel, lawn or blocked ---- */
const CBOT_NAV = { G: 0.5, N: 0, t: null };
function cbotNavBuild() {
  const NV = CBOT_NAV, G = NV.G, H = WB, N = NV.N = Math.round(2 * H / G), t = NV.t = new Uint8Array(N * N).fill(3);   // 1 paving, 2 gravel, 3 lawn, 0 blocked
  const I = v => Math.floor((v + H) / G), C = i => -H + (i + 0.5) * G;
  const each = (x0, z0, x1, z1, f) => { for (let j = Math.max(0, I(z0)); j <= Math.min(N - 1, I(z1)); j++) for (let i = Math.max(0, I(x0)); i <= Math.min(N - 1, I(x1)); i++) f(i, j, C(i), C(j)); };
  const circle = (x, z, r, v) => each(x - r, z - r, x + r, z + r, (i, j, cx, cz) => { if (Math.hypot(cx - x, cz - z) < r) t[j * N + i] = v; });
  const rect = (x0, z0, x1, z1, v) => each(x0, z0, x1, z1, (i, j) => { t[j * N + i] = v; });
  CAMPUS.plazas.forEach(p => circle(p[0], p[1], p[2] - 0.2, 1));
  CAMPUS.paths.forEach(([x1, z1, x2, z2, w]) => {
    const L = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / L, uz = (z2 - z1) / L, r = w / 2 - 0.15;
    each(Math.min(x1, x2) - r, Math.min(z1, z2) - r, Math.max(x1, x2) + r, Math.max(z1, z2) + r, (i, j, cx, cz) => {
      const s = Math.max(0, Math.min(L, (cx - x1) * ux + (cz - z1) * uz)); if (Math.hypot(cx - x1 - ux * s, cz - z1 - uz * s) < r) t[j * N + i] = 1;
    });
  });
  CAMPUS.lots.forEach(l => rect(l[0], l[1], l[2], l[3], 1));
  CAMPUS.gardens.forEach(g => circle(g[0], g[1], 5, 2));
  const INF = 0.35;   // a robot's half-width, and a little room
  CAMPUS.circles.forEach(c => circle(c[0], c[1], c[2] + INF, 0));
  CAMPUS.boxes.forEach(b => rect(b[0] - INF, b[1] - INF, b[2] + INF, b[3] + INF, 0));
  CAMPUS.mulch.forEach(m => rect(m.box[0], m.box[1], m.box[2], m.box[3], 0));
  each(-H, -H, H, H, (i, j, cx, cz) => { if (Math.abs(cx) > H - 2.6 || Math.abs(cz) > H - 2.6) t[j * N + i] = 0; });
  NV.g = new Float32Array(N * N); NV.from = new Int32Array(N * N); NV.seen = new Uint32Array(N * N); NV.done = new Uint32Array(N * N); NV.stamp = 0;
  NV.at = (x, z) => { const i = I(x), j = I(z); return i < 0 || j < 0 || i >= N || j >= N ? 0 : t[j * N + i]; };
  NV.I = I; NV.C = C;
  // open paving with room round it: where to chat, stroll to, and start from
  NV.open = [];
  for (let j = 2; j < N - 2; j++) for (let i = 2; i < N - 2; i++) {
    if (t[j * N + i] !== 1) continue; let ok = true;
    for (let dj = -2; dj <= 2 && ok; dj++) for (let di = -2; di <= 2; di++) if (!t[(j + dj) * N + i + di]) { ok = false; break; }
    if (ok) NV.open.push(j * N + i);
  }
  // the doors: four buildings with steps up to their doors, and the café's door off its terrace
  NV.doors = CAMPUS.bldg.filter(b => b.door).map(b => {
    const dx = b.door[0] - b.x, dz = b.door[1] - b.z, f = Math.abs(dx) / b.w > Math.abs(dz) / b.d ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
    return { name: b.name, D: [b.door[0], b.door[1]], f, B: [b.door[0] + f[0] * 1.7, b.door[1] + f[1] * 1.7], steps: true };
  });
  NV.doors.push({ name: "Café", D: [-15.7, -9.15], f: [0, 1], B: [-15.7, -8.2], steps: false });   // the shopfront door (buildCafe: CX + 1.3, ZF)
  // things worth stopping to look at: the fountain, the pond, the garden's beds and sundial, the sculpture, the café
  const V = NV.visits = [];
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; V.push([Math.cos(a) * 4.7, Math.sin(a) * 4.7, 0, 0]); }
  CAMPUS.circles.filter(c => c[3] === "pond").forEach(([px, pz, r]) => { const a0 = Math.atan2(-pz, -px); [-0.9, -0.45, 0, 0.45, 0.9].forEach(da => V.push([px + Math.cos(a0 + da) * (r + 1.2), pz + Math.sin(a0 + da) * (r + 1.2), px, pz])); });
  CAMPUS.circles.filter(c => c[3] === "sculpture").forEach(([sx, sz, r]) => { const d = Math.hypot(sx, sz); V.push([sx - sx / d * (r + 1.1), sz - sz / d * (r + 1.1), sx, sz]); });
  if (typeof GARDEN !== "undefined") {
    const cs = Math.cos(GARDEN.ry), sn = Math.sin(GARDEN.ry), at = (lx, lz) => [GARDEN.x + lx * cs + lz * sn, GARDEN.z - lx * sn + lz * cs];
    [[0, 3.0, -2.1, 1.9], [0, -2.9, 0, 0], [1.0, 0, 2.1, -1.9], [-1.0, 0, -2.1, -1.9]].forEach(([a, b, c, d]) => V.push([...at(a, b), ...at(c, d)]));
  }
  V.push([-17.6, -7.3, -17.6, -9.5]);
  NV.visits = V.filter(v => NV.at(v[0], v[1]) > 0);
  NV.seats = (CAMPUS.seats || []).map((s, i) => ({ i, S: [s[0], s[1]], h: s[2], A: [s[0] + Math.sin(s[2]) * 0.42, s[1] + Math.cos(s[2]) * 0.42], pre: [s[0] + Math.sin(s[2]) * 0.85, s[1] + Math.cos(s[2]) * 0.85] }));
  NV.taken = new Set();
}
// the walkable cell nearest a point (within 4 m), as an index, or -1
function cbotNear(x, z) {
  const NV = CBOT_NAV, N = NV.N, i0 = NV.I(x), j0 = NV.I(z);
  let best = -1, bd = 1e9;
  for (let r = 0; r <= 8 && best < 0; r++) for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) {
    if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || i < 0 || j < 0 || i >= N || j >= N || !NV.t[j * N + i]) continue;
    const d = Math.hypot(NV.C(i) - x, NV.C(j) - z); if (d < bd) { bd = d; best = j * N + i; }
  }
  return best;
}
// A* from one point to another; returns world points (smoothed, never cutting across worse ground than the path it found)
function cbotPath(sx, sz, gx, gz, lawn) {
  const NV = CBOT_NAV, N = NV.N, t = NV.t, s = cbotNear(sx, sz), goal = cbotNear(gx, gz);
  if (s < 0 || goal < 0) return null;
  const st = ++NV.stamp, g = NV.g, from = NV.from, seen = NV.seen, done = NV.done, cost = [0, 1, 1.2, lawn];
  const gi = goal % N, gj = (goal / N) | 0, h = c => { const dx = Math.abs(c % N - gi), dz = Math.abs(((c / N) | 0) - gj); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  const hf = [], hc = [];   // a binary heap of (f, cell)
  const push = (f, c) => { let k = hf.length; hf.push(f); hc.push(c); while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= f) break; hf[k] = hf[p]; hc[k] = hc[p]; k = p; } hf[k] = f; hc[k] = c; };
  const pop = () => { const c = hc[0], lf = hf.pop(), lc = hc.pop(); if (hf.length) { let k = 0; for (;;) { let m = 2 * k + 1; if (m >= hf.length) break; if (m + 1 < hf.length && hf[m + 1] < hf[m]) m++; if (hf[m] >= lf) break; hf[k] = hf[m]; hc[k] = hc[m]; k = m; } hf[k] = lf; hc[k] = lc; } return c; };
  g[s] = 0; seen[s] = st; from[s] = -1; push(h(s), s);
  let found = false, n = 0;
  while (hf.length && n++ < 60000) {
    const c = pop(); if (done[c] === st) continue; done[c] = st; if (c === goal) { found = true; break; }
    const ci = c % N, cj = (c / N) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const q = j * N + i, tq = t[q]; if (!tq || done[q] === st) continue;
      if (di && dj && (!t[cj * N + i] || !t[j * N + ci])) continue;   // no squeezing past a corner
      const ng = g[c] + cost[tq] * (di && dj ? 1.414 : 1);
      if (seen[q] !== st || ng < g[q]) { seen[q] = st; g[q] = ng; from[q] = c; push(ng + h(q), q); }
    }
  }
  if (!found) return null;
  const cells = []; for (let c = goal; c >= 0; c = from[c]) cells.push(c); cells.reverse();
  const pts = cells.map(c => [NV.C(c % N), NV.C((c / N) | 0), t[c]]);
  const lineOK = (a, b, mx) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 0.2); for (let k = 1; k < n; k++) { const v = NV.at(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n); if (!v || v > mx) return false; } return true; };
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1) {
    let j = i + 1, mx = Math.max(pts[i][2], pts[j][2]);
    while (j + 1 < pts.length) { const m2 = Math.max(mx, pts[j + 1][2]); if (!lineOK(pts[i], pts[j + 1], m2)) break; j++; mx = m2; }
    out.push(pts[j]); i = j;
  }
  return out.map(p => ({ x: p[0], z: p[1] }));
}
// the height of the steps up to a building's door, under a point
function cbotStepY(x, z) {
  const D = CBOT_NAV.doors; if (!D) return 0;
  for (const d of D) {
    if (!d.steps) continue;
    const fx = d.D[0] - d.f[0] * 0.6, fz = d.D[1] - d.f[1] * 0.6, a = (x - fx) * d.f[0] + (z - fz) * d.f[1], s = Math.abs((x - fx) * d.f[1] - (z - fz) * d.f[0]);
    if (s < 2.1 && a > -0.5 && a < 1.98) return a < 1.22 ? 0.42 : a < 1.6 ? 0.28 : 0.14;
  }
  return 0;
}

/* ---- what they do ---- */
function buildCampusBots() {
  FX.bots = CBOT_TYPES.slice(0, LIGHT ? 4 : 6).map(cbotBuild);
  FX.people = FX.bots.map(p => p.root);   // (the pond's reflection leaves them out)
}
// set off for somewhere, then do something there
function cbotGo(p, gx, gz, then, legs) {
  const r = cbotPath(p.x, p.z, gx, gz, p.lawn);
  if (!r) { p.state = "idle"; p.t = 0; p.dur = 1 + Math.random() * 2; p.then = null; return false; }
  if (r.length > 1 && Math.hypot(r[0].x - p.x, r[0].z - p.z) < 0.6) r.shift();   // already on the first cell
  r.push({ x: gx, z: gz }); (legs || []).forEach(l => r.push({ x: l[0], z: l[1] }));
  p.route = r; p.ri = 0; p.then = then; p.state = "walk"; p.t = 0;
  let L = 0; r.forEach((w, k) => { L += Math.hypot(w.x - (k ? r[k - 1].x : p.x), w.z - (k ? r[k - 1].z : p.z)); }); p.dur = L / p.speed * 2 + 25;   // give up and rethink after this
  return true;
}
function cbotLeave(p) { if (p.seat) { CBOT_NAV.taken.delete(p.seat.i); p.seat = null; } if (p.partner) { const q = p.partner; p.partner = null; if (q.partner === p) q.partner = null; } p.look = null; p.door = null; }
function cbotPlan(p) {
  const NV = CBOT_NAV, B = FX.bots, rnd = a => a[(Math.random() * a.length) | 0];
  cbotLeave(p);
  for (let tries = 0; tries < 4; tries++) {
    const r = Math.random();
    if (p.biped && r < 0.22) {   // a sit on a bench, one not too far away
      const free = NV.seats.filter(s => !NV.taken.has(s.i) && Math.hypot(s.S[0] - p.x, s.S[1] - p.z) < 45 && !B.some(q => q.seat && Math.hypot(q.seat.S[0] - s.S[0], q.seat.S[1] - s.S[1]) < 0.6));
      if (free.length) { const s = rnd(free); p.seat = s; NV.taken.add(s.i); if (cbotGo(p, s.pre[0], s.pre[1], "sit", [s.A])) return; cbotLeave(p); }
      continue;
    }
    if (r < 0.45) {   // in through a door, and out again later
      const ds = NV.doors.filter(d => Math.hypot(d.D[0] - p.x, d.D[1] - p.z) > 6), d = rnd(ds.length ? ds : NV.doors);
      p.door = d; if (cbotGo(p, d.B[0], d.B[1], "enter", [d.D])) return; continue;
    }
    if (r < 0.6) {   // say hello to another robot who's free
      const q = B.find(q => q !== p && !q.partner && (q.state === "walk" || q.state === "look" || q.state === "idle") && q.then !== "sit" && q.then !== "enter" && !q.faded && Math.hypot(q.x - p.x, q.z - p.z) < 40);
      if (!q) continue;
      const mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, near = NV.open.filter((c, k) => k % 3 === 0 && Math.hypot(NV.C(c % NV.N) - mx, NV.C((c / NV.N) | 0) - mz) < 12);
      if (!near.length) continue;
      const c = rnd(near), cx = NV.C(c % NV.N), cz = NV.C((c / NV.N) | 0), a = Math.random() * Math.PI, dx = Math.cos(a) * 0.62, dz = Math.sin(a) * 0.62;
      cbotLeave(q);
      if (cbotGo(p, cx + dx, cz + dz, "chat") && cbotGo(q, cx - dx, cz - dz, "chat")) { p.partner = q; q.partner = p; p.spotTo = [cx - dx, cz - dz]; q.spotTo = [cx + dx, cz + dz]; return; }
      continue;
    }
    if (r < 0.85 && NV.visits.length) { const v = rnd(NV.visits); p.look = v[2] || v[3] ? [v[2], v[3]] : [0, 0]; if (cbotGo(p, v[0], v[1], "look")) return; continue; }
    const c = rnd(NV.open);   // a stroll somewhere (stopping to check the tablet, if it has one)
    if (cbotGo(p, NV.C(c % NV.N), NV.C((c / NV.N) | 0), p.o.carry === "phone" && Math.random() < 0.6 ? "phone" : "look")) return;
  }
}
function cbotArrive(p) {
  p.t = 0; p.state = p.then || "idle"; p.then = null;
  if (p.state === "sit") { p.dur = 10 + Math.random() * 12; p.sitOff = [p.seat.S[0] - p.x, p.seat.S[1] - p.z]; }
  else if (p.state === "enter") p.dur = 1;
  else if (p.state === "chat") p.dur = 9 + Math.random() * 6;
  else if (p.state === "plan") cbotPlan(p);
  else p.dur = 3 + Math.random() * 5;
}
const cbotWrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function cbotTurn(p, want, dt, rate) { p.heading += cbotWrap(want - p.heading) * Math.min(1, dt * (rate || 5)); }
function cbotStep(p, dt) {
  const NV = CBOT_NAV;
  p.t += dt;
  let walking = false;
  if (p.state === "walk") {
    const w = p.route[p.ri], dx = w.x - p.x, dz = w.z - p.z, dist = Math.hypot(dx, dz), last = p.ri === p.route.length - 1;
    const hx = Math.sin(p.heading), hz = Math.cos(p.heading);
    const vac = typeof DRV !== "undefined" && DRV.y < 1.2 && Math.hypot(p.x + hx * 0.9 - DRV.x, p.z + hz * 0.9 - DRV.z) < 1.0;   // let the vacuum by
    p.vacT = vac ? (p.vacT || 0) + dt : 0;
    if (dist < (last ? 0.06 : 0.35)) { if (last) cbotArrive(p); else p.ri++; }
    else if (vac && p.vacT > 1.5) {   // it's parked in the way: step round it, on the side away from it
      const sd = (DRV.x - p.x) * hz - (DRV.z - p.z) * hx > 0 ? -1 : 1, nx = p.x + hz * sd * 0.7 * dt, nz = p.z - hx * sd * 0.7 * dt;
      if (NV.at(nx, nz)) { p.x = nx; p.z = nz; walking = true; }
    }
    else if (!vac) {
      const want = Math.atan2(dx, dz), dh = cbotWrap(want - p.heading); cbotTurn(p, want, dt);
      const step = Math.min(dist, p.speed * dt * Math.max(0.2, Math.cos(dh)));
      p.x += dx / dist * step; p.z += dz / dist * step; walking = true;
      // step aside for another robot just ahead (both step to their own right, so they pass)
      FX.bots.forEach(q => {
        if (q === p || q.faded) return; const ox = q.x - p.x, oz = q.z - p.z, d = Math.hypot(ox, oz);
        if (d > 0.01 && d < 1.1 && ox * hx + oz * hz > 0.3 * d && !last) { const nx = p.x + hz * 0.8 * dt, nz = p.z - hx * 0.8 * dt; if (NV.at(nx, nz)) { p.x = nx; p.z = nz; } }
      });
    }
    if (p.t > p.dur && p.state === "walk") { cbotLeave(p); cbotPlan(p); }   // stuck: think again
  } else if (p.state === "enter") {   // through the door, fading
    p.x -= p.door.f[0] * 0.55 * dt; p.z -= p.door.f[1] * 0.55 * dt; walking = true; cbotTurn(p, Math.atan2(-p.door.f[0], -p.door.f[1]), dt, 8);
    if (p.t > 0.9) { p.state = "inside"; p.t = 0; p.dur = 8 + Math.random() * 16; }
  } else if (p.state === "inside") {
    if (p.t > p.dur) {   // back out, onto the steps, and on to somewhere else
      const d = p.door; p.x = d.D[0] - d.f[0] * 0.3; p.z = d.D[1] - d.f[1] * 0.3; p.heading = Math.atan2(d.f[0], d.f[1]);
      p.route = [{ x: d.D[0], z: d.D[1] }, { x: d.B[0], z: d.B[1] }]; p.ri = 0; p.state = "walk"; p.then = "plan"; p.t = 0; p.dur = 30; p.door = null;
    }
  } else {
    if (p.state === "sit") cbotTurn(p, p.seat.h, dt, 4);
    else if (p.state === "chat") {
      const q = p.partner;
      if (!q || q.partner !== p) p.dur = Math.min(p.dur, p.t + 1.5);           // the other one left
      else if (q.state !== "chat") { p.t = Math.min(p.t, 0.5); if (q.state !== "walk") p.dur = 0; }   // still waiting for them
      cbotTurn(p, Math.atan2(p.spotTo[0] - p.x, p.spotTo[1] - p.z), dt, 4);
    } else if (p.look) cbotTurn(p, Math.atan2(p.look[0] - p.x, p.look[1] - p.z), dt, 3);
    if (p.t > p.dur) cbotPlan(p);
  }
  // sitting down and getting up, fading through doors, the steps underfoot
  p.sitBlend += ((p.state === "sit" ? 1 : 0) - p.sitBlend) * Math.min(1, dt * 3);
  p.fade += ((p.state === "enter" || p.state === "inside" ? 0 : 1) - p.fade) * Math.min(1, dt * 4);
  const faded = p.fade < 0.995;
  if (faded !== p.faded) { p.faded = faded; p.mats.forEach(m => { m.transparent = faded; m.needsUpdate = true; }); p.sk.castShadow = !faded; }
  if (faded) p.mats.forEach(m => { m.opacity = p.fade; });
  p.root.visible = p.fade > 0.02;
  if (!p.root.visible) return;
  const h = p.o.h, ty = cbotStepY(p.x, p.z) + p.sitBlend * (0.48 - 0.48 * h);
  p.y += (ty - p.y) * Math.min(1, dt * 10);
  p.root.position.set(p.x + p.sitOff[0] * p.sitBlend, p.y, p.z + p.sitOff[1] * p.sitBlend); p.root.rotation.y = p.heading;
  // the vacuum coming close: turn to watch it, and smile
  p.lookYaw = null;
  if (typeof DRV !== "undefined" && DRV.y < 1.2 && p.state !== "inside") {
    const ox = DRV.x - p.x, oz = DRV.z - p.z, d = Math.hypot(ox, oz);
    if (d < 3.5) p.lookYaw = Math.max(-1.1, Math.min(1.1, cbotWrap(Math.atan2(ox, oz) - p.heading)));
  }
  cbotPose(p, dt, walking);
}
function updateCampusBots(dt) {
  const B = FX.bots; if (!B || !B.length) return;
  dt = Math.min(dt, 0.1);
  if (!CBOT_NAV.t) {   // first frame on the campus: map it, put the robots out on the paving and give them each something to do
    cbotNavBuild();
    B.forEach(p => { const c = CBOT_NAV.open[(Math.random() * CBOT_NAV.open.length) | 0]; p.x = CBOT_NAV.C(c % CBOT_NAV.N); p.z = CBOT_NAV.C((c / CBOT_NAV.N) | 0); p.heading = Math.random() * 6.28; cbotPlan(p); });
  }
  B.forEach(p => cbotStep(p, dt));
}

/* ---- how they move ---- */
// the two-legged walk: thighs swing, knees fold through the swing, a bob twice a step, arms against the legs
function cbotWalk(p, dt, walking, speed) {
  const L = p.legs, A = p.arms, k = Math.min(1, dt * 8), lerp = (obj, key, v) => { obj[key] += (v - obj[key]) * k; };
  if (walking) p.phase += dt * speed * 4.6;
  const ph = p.phase, s = Math.sin(ph), amt = walking ? 1 : 0, sb = p.sitBlend;
  [0, 1].forEach(i => {
    const sg = i ? -1 : 1, sw = Math.sin(ph) * sg, sv = Math.cos(ph) * sg;
    const thigh = -0.45 * sw * amt, knee = amt * (0.12 + 0.95 * Math.pow(Math.max(0, sv), 1.4));
    lerp(L[i].thigh.rotation, "x", (1 - sb) * thigh + sb * -1.5);
    lerp(L[i].knee.rotation, "x", (1 - sb) * knee + sb * 1.5);
    lerp(L[i].ankle.rotation, "x", (1 - sb) * (-(thigh + knee) * 0.55 + amt * 0.25 * Math.max(0, -sv)));
  });
  p.hips.position.y = CBOT_HIP - sb * 0.4 + amt * 0.022 * Math.cos(2 * ph);
  lerp(p.hips.rotation, "y", 0.045 * s * amt); lerp(p.hips.rotation, "z", 0.035 * s * amt);
  lerp(p.spine.rotation, "y", -0.075 * s * amt); lerp(p.spine.rotation, "x", 0.06 * amt * speed - sb * 0.08);
  [0, 1].forEach(i => {
    const sg = i ? 1 : -1; let sh = 0.38 * Math.sin(ph) * sg * amt, el = -(0.25 + 0.3 * amt * Math.max(0, Math.sin(ph) * sg)), roll = (i ? -1 : 1) * 0.08;
    if (p.state === "sit") { sh = -0.5; el = -0.9; }
    if (p.state === "chat" && i === 1) { sh = -0.5 + 0.25 * Math.sin(p.t * 3.1); el = -1.2 + 0.3 * Math.sin(p.t * 4.3); roll = -0.25; }
    if (i === 1 && p.o.carry === "cup") { const sip = Math.sin(p.t * 0.9 + p.phase) > 0.93 && !walking; sh = sip ? -1.15 : -0.35 + sh * 0.25; el = sip ? -1.9 : -1.25; }
    if (i === 1 && p.o.carry === "rack") { sh = -0.3 + sh * 0.2; el = -1.3; }
    if (i === 0 && p.o.carry === "clipboard") { sh = -0.15; el = -1.6; roll = 0.45; }
    lerp(A[i].sh.rotation, "x", sh); lerp(A[i].el.rotation, "x", el); lerp(A[i].sh.rotation, "z", roll);
  });
  lerp(p.head.rotation, "x", p.state === "chat" ? -0.05 + 0.06 * Math.sin(p.t * 2.2) : p.state === "look" ? -0.05 : -0.06 * amt);
  const yaw = p.lookYaw != null ? p.lookYaw : p.state === "chat" ? 0.15 * Math.sin(p.t * 0.7) : p.state === "look" || p.state === "idle" ? 0.5 * Math.sin(p.t * 0.8) : 0;
  lerp(p.head.rotation, "y", yaw);
}
// the others roll or hover, lean into the move, and keep their arms in; and everyone's face
function cbotPose(p, dt, walking) {
  const speed = p.speed;
  if (p.biped) cbotWalk(p, dt, walking, speed);
  else {
    const k = Math.min(1, dt * 6), lean = walking ? 0.12 : 0;
    if (walking) p.phase += dt * speed * 4.2;
    p.hips.rotation.x += (lean - p.hips.rotation.x) * k;
    if (p.extra.ball && walking) p.extra.ball.rotation.x += dt * speed / 0.3;
    if (p.extra.jet) {
      p.hips.position.y = 1.25 + Math.sin(p.t * 2.1 + p.phase) * 0.05;
      p.extra.jet.material.opacity = (0.55 + 0.3 * Math.sin(p.t * 9)) * p.fade; p.extra.wash.material.opacity = (0.12 + 0.06 * Math.sin(p.t * 7)) * p.fade;
    }
    [0, 1].forEach(i => {
      const sg = i ? 1 : -1; let sh = walking ? 0.15 * Math.sin(p.phase) * sg - 0.1 : -0.15, el = p.extra.jet ? -1.3 : -0.5;   // the drone keeps its arms folded
      if (p.state === "chat" && i === 1) { sh = -0.6 + 0.25 * Math.sin(p.t * 3.1); el = -1.2 + 0.3 * Math.sin(p.t * 4.3); }
      if (i === 1 && p.o.carry === "phone") { sh = p.state === "phone" ? -1.1 : -0.5; el = p.state === "phone" ? -1.0 : -1.2; }
      p.arms[i].sh.rotation.x += (sh - p.arms[i].sh.rotation.x) * k; p.arms[i].el.rotation.x += (el - p.arms[i].el.rotation.x) * k;
    });
    p.head.rotation.x += ((p.state === "phone" ? 0.45 : 0) - p.head.rotation.x) * k;
    const yaw = p.lookYaw != null ? p.lookYaw : p.state === "look" || p.state === "idle" ? 0.6 * Math.sin(p.t * 1.1) : p.state === "chat" ? 0.15 * Math.sin(p.t * 0.7) : 0;
    p.head.rotation.y += (yaw - p.head.rotation.y) * k;
  }
  // the face: blinks now and then, smiles while chatting or watching the vacuum, looks down at a tablet, drowsy on a bench
  p.blinkT -= dt;
  let expr = p.state === "chat" || p.lookYaw != null ? "happy" : p.state === "phone" ? "down" : p.state === "sit" ? "rest" : "normal";
  if (p.blinkT < 0.12 && expr !== "happy") expr = "blink"; if (p.blinkT < 0) p.blinkT = 2 + Math.random() * 3;
  if (expr !== p.face.expr) { p.face.expr = expr; p.face.draw(expr); }
  const pulse = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(p.t * 3 + p.phase)); p.glowM.color.setRGB(pulse, pulse, pulse);
}
