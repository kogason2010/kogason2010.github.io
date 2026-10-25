/* js/lab/robot.js — The robot vacuum's brain: the floor map, route planning, messes and cleaning, docking. The robot and
   its dock are an instrument: instruments/lab-robot-vacuum.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Robot brain: maps the floor from the scene, plans routes, finds messes, cleans them, docks to charge ---------- */
const GN = 120, CELL = ROOMSZ / GN, NAV_R = BOT_R + 0.05;
const cIdx = v => Math.floor((v - ROOM0) / CELL), cPos = i => ROOM0 + (i + 0.5) * CELL;
const kAt = (x, z) => { const i = cIdx(x), j = cIdx(z); return i < 0 || j < 0 || i >= GN || j >= GN ? -1 : j * GN + i; };
const spotLayer = new THREE.Group(); spotLayer.userData.noNav = true; lab.add(spotLayer);
let nav = null;
function buildNav() {
  lab.updateMatrixWorld(true);
  const N = GN * GN, solid = new Uint8Array(N), cover = new Uint8Array(N), bb = new THREE.Box3();
  const toLab = new THREE.Matrix4().copy(lab.matrixWorld).invert(), mw = new THREE.Matrix4();
  lab.traverse(o => {
    if (!o.isMesh) return;
    for (let p = o; p && p !== lab; p = p.parent) if (p === bot || p.userData.noNav || !p.visible) return;
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
    bb.copy(g.boundingBox).applyMatrix4(mw.multiplyMatrices(toLab, o.matrixWorld));
    if (bb.max.y < 0.03 || bb.min.y > 2.2) return;        // floor markings, wall shelves
    const low = bb.min.y < 0.9;                            // reaches below a bench top: the robot can't pass
    const i0 = Math.max(0, cIdx(bb.min.x)), i1 = Math.min(GN - 1, cIdx(bb.max.x));
    const j0 = Math.max(0, cIdx(bb.min.z)), j1 = Math.min(GN - 1, cIdx(bb.max.z));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { cover[j * GN + i] = 1; if (low) solid[j * GN + i] = 1; }
  });
  // the stair opening is a cliff: keep the whole disc (and the rail's gap) off limits
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) if (Math.hypot(cPos(i) - STAIR.x, cPos(j) - STAIR.z) < STAIR.r + 0.17) { solid[j * GN + i] = 1; cover[j * GN + i] = 1; }
  // distance to the nearest obstacle (two-pass chamfer), capped by the distance to the floor's open edges
  const d = new Float32Array(N);
  for (let k = 0; k < N; k++) d[k] = solid[k] ? 0 : 1e6;
  const D2 = Math.SQRT2;
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
    const k = j * GN + i; let v = d[k]; if (!v) continue;
    if (i > 0) v = Math.min(v, d[k - 1] + 1);
    if (j > 0) { v = Math.min(v, d[k - GN] + 1); if (i > 0) v = Math.min(v, d[k - GN - 1] + D2); if (i < GN - 1) v = Math.min(v, d[k - GN + 1] + D2); }
    d[k] = v;
  }
  for (let j = GN - 1; j >= 0; j--) for (let i = GN - 1; i >= 0; i--) {
    const k = j * GN + i; let v = d[k]; if (!v) continue;
    if (i < GN - 1) v = Math.min(v, d[k + 1] + 1);
    if (j < GN - 1) { v = Math.min(v, d[k + GN] + 1); if (i < GN - 1) v = Math.min(v, d[k + GN + 1] + D2); if (i > 0) v = Math.min(v, d[k + GN - 1] + D2); }
    d[k] = v;
  }
  const clear = new Float32Array(N), free = new Uint8Array(N), reach = new Uint8Array(N), cells = [];
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
    const k = j * GN + i, edge = Math.min(i + 0.5, GN - i - 0.5, j + 0.5, GN - j - 0.5) * CELL;
    clear[k] = solid[k] ? 0 : Math.min(d[k] * CELL - CELL * 0.5, edge);
    free[k] = clear[k] >= NAV_R ? 1 : 0;
  }
  // everything the robot can drive to from its dock
  const ax = DOCK.x - Math.cos(DOCK.h) * 0.6, az = DOCK.z + Math.sin(DOCK.h) * 0.6;
  let s = kAt(ax, az); const q = [];
  if (s >= 0 && free[s]) { reach[s] = 1; q.push(s); }
  for (let h = 0; h < q.length; h++) {
    const k = q[h], i = k % GN, j = (k / GN) | 0; cells.push(k);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= GN || nj >= GN) continue;
      const n = nj * GN + ni; if (free[n] && !reach[n]) { reach[n] = 1; q.push(n); }
    }
  }
  nav = { solid, cover, clear, free, reach, cells, g: new Float32Array(N), from: new Int32Array(N), seen: new Uint32Array(N), shut: new Uint32Array(N), run: 0, ax, az };
}
function snap(x, z) {
  const i0 = cIdx(x), j0 = cIdx(z); let best = -1, bd = 1e9;
  for (let r = 0; r <= 8 && best < 0; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= GN || j >= GN) continue;
    const k = j * GN + i; if (!nav.reach[k]) continue;
    const dd = di * di + dj * dj; if (dd < bd) { bd = dd; best = k; }
  }
  return best;
}
function sight(ax, az, bx, bz) {
  const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (CELL * 0.5));
  for (let s = 1; s <= n; s++) { const k = kAt(ax + (bx - ax) * s / n, az + (bz - az) * s / n); if (k < 0 || !nav.reach[k]) return false; }
  return true;
}
// A* over the floor grid; corridors' centres cost less so the robot keeps a polite distance from furniture
function plan(sx, sz, tx, tz) {
  const s = snap(sx, sz), t = snap(tx, tz); if (s < 0 || t < 0) return null;
  const { g, from, seen, shut, clear, reach } = nav, run = ++nav.run, ti = t % GN, tj = (t / GN) | 0;
  const hk = [], hv = [];
  const push = (k, v) => { let i = hk.length; hk.push(k); hv.push(v); while (i > 0) { const p = (i - 1) >> 1; if (hv[p] <= v) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = v; };
  const pop = () => { const top = hk[0], lk = hk.pop(), lv = hv.pop(); if (hk.length) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= hk.length) break; if (c + 1 < hk.length && hv[c + 1] < hv[c]) c++; if (hv[c] >= lv) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; } hk[i] = lk; hv[i] = lv; } return top; };
  const est = k => { const dx = Math.abs(k % GN - ti), dz = Math.abs(((k / GN) | 0) - tj); return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz); };
  g[s] = 0; seen[s] = run; from[s] = -1; push(s, est(s));
  while (hk.length) {
    const k = pop(); if (shut[k] === run) continue; shut[k] = run; if (k === t) break;
    const i = k % GN, j = (k / GN) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= GN || nj >= GN) continue;
      const n = nj * GN + ni; if (!reach[n] || shut[n] === run) continue;
      if (di && dj && (!reach[j * GN + ni] || !reach[nj * GN + i])) continue;
      const c = (di && dj ? Math.SQRT2 : 1) * (1 + 1.6 * Math.max(0, 0.75 - clear[n]) / 0.75), ng = g[k] + c;
      if (seen[n] !== run || ng < g[n]) { g[n] = ng; seen[n] = run; from[n] = k; push(n, ng + est(n)); }
    }
  }
  if (shut[t] !== run) return null;
  const raw = [];
  for (let k = t; k >= 0; k = from[k]) raw.push([cPos(k % GN), cPos((k / GN) | 0)]);
  raw.reverse(); raw[0] = [sx, sz]; raw.push([tx, tz]);
  // pull the string: keep only the corners the robot actually needs to turn at
  const pts = []; let cur = 0, len = 0;
  while (cur < raw.length - 1) {
    let nx = cur + 1;
    for (let j = raw.length - 1; j > cur + 1; j--) if (sight(raw[cur][0], raw[cur][1], raw[j][0], raw[j][1])) { nx = j; break; }
    len += Math.hypot(raw[nx][0] - raw[cur][0], raw[nx][1] - raw[cur][1]);
    pts.push(raw[nx]); cur = nx;
  }
  return { pts, len };
}

/* Messes: each is a little canvas the robot actually wipes clean as it drives over it */
const MESS = {
  coffee: { label: "a coffee ring", size: 0.42, rough: 0.35, speck: [0.36, 0.22, 0.1], draw(g) {
    let gr = g.createRadialGradient(64, 64, 8, 64, 64, 40); gr.addColorStop(0, "rgba(120,78,40,0.10)"); gr.addColorStop(1, "rgba(110,70,34,0.28)");
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 40, 0, 7); g.fill();
    const ring = (cx, cy, r, a0, a1, w, al) => { g.strokeStyle = `rgba(88,52,24,${al})`; g.lineWidth = w; g.beginPath(); for (let a = a0; a <= a1; a += 0.08) { const rr = r + Math.sin(a * 3 + cx) * 1.4 + Math.sin(a * 7) * 0.7; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.stroke(); };
    ring(64, 64, 40, 0, 6.35, 3.6, 0.8); ring(73, 57, 37, 0.4, 3.3, 1.6, 0.45);
    g.fillStyle = "rgba(88,52,24,0.65)"; [[104, 70, 4], [110, 76, 2.4], [30, 96, 3], [24, 101, 1.8]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], p[2], 0, 7); g.fill(); });
  } },
  dust: { label: "a dust bunny", size: 0.5, rough: 0.95, speck: [0.42, 0.42, 0.4], draw(g) {
    for (let c = 0; c < 5; c++) {
      const cx = 64 + Math.cos(c * 1.9) * 18 * (c ? 1 : 0), cy = 64 + Math.sin(c * 1.9) * 14 * (c ? 1 : 0), r = c ? 13 + (c * 7) % 7 : 21;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, "rgba(104,102,96,0.95)"); gr.addColorStop(0.55, "rgba(122,120,114,0.7)"); gr.addColorStop(1, "rgba(130,128,122,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    }
    g.strokeStyle = "rgba(92,90,86,0.6)"; g.lineWidth = 0.9;
    for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, r = Math.random() * 26, x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r, b = Math.random() * 6.28; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(b) * 5, y + Math.sin(b) * 5, x + Math.cos(b + 0.8) * 9, y + Math.sin(b + 0.8) * 9); g.stroke(); }
    g.fillStyle = "rgba(80,78,74,0.7)"; for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, r = 20 + Math.random() * 32; g.fillRect(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 1.4, 1.4); }
  } },
  buffer: { label: "a buffer spill", size: 0.48, rough: 0.08, speck: [0.6, 0.78, 0.9], draw(g) {
    const blob = (cx, cy, r, ph) => { g.beginPath(); for (let a = 0; a <= 6.3; a += 0.12) { const rr = r * (1 + 0.16 * Math.sin(a * 3 + ph) + 0.08 * Math.sin(a * 5 + ph * 2)); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85); } g.closePath(); };
    blob(62, 64, 34, 0.7); g.fillStyle = "rgba(150,196,226,0.42)"; g.fill(); g.strokeStyle = "rgba(236,242,246,0.65)"; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = "rgba(150,196,226,0.5)"; [[104, 50, 5], [110, 62, 3], [24, 86, 4], [98, 96, 2.6]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], p[2], 0, 7); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 2.2; g.beginPath(); g.arc(56, 56, 19, 3.6, 4.6); g.stroke();
  } },
  beads: { label: "spilled silica gel", size: 0.48, rough: 0.3, speck: [0.94, 0.55, 0.16], draw(g) {
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * 6.28, r = i < 26 ? Math.abs((Math.random() + Math.random() - 1) * 26) : 26 + Math.random() * 26;
      const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r * 0.9, s = 2.4 + Math.random() * 1.2;
      g.fillStyle = "rgba(20,24,28,0.25)"; g.beginPath(); g.arc(x + 1, y + 1.2, s, 0, 7); g.fill();
      g.fillStyle = Math.random() < 0.75 ? "#f08a24" : "#3a6fd8"; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,0.75)"; g.beginPath(); g.arc(x - s * 0.35, y - s * 0.35, s * 0.32, 0, 7); g.fill();
    }
  } },
  leaves: { label: "fallen leaves", size: 0.6, rough: 0.9, speck: [0.78, 0.45, 0.16], draw(g) {
    const cols = ["#c8692b", "#e0a03a", "#a2452a", "#8a9a3a", "#d4822e"];
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * 6.28, r = Math.random() * 38, x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r, rot = Math.random() * 6.28, L = 9 + Math.random() * 6;
      g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = cols[i % cols.length];
      g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -L * 0.6, L, 0); g.quadraticCurveTo(0, L * 0.6, -L, 0); g.fill();
      g.strokeStyle = "rgba(60,30,10,0.45)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L + 3, 0); g.stroke(); g.restore();
    }
  } },
  prints: { label: "muddy footprints", size: 0.72, rough: 0.9, speck: [0.34, 0.28, 0.22], draw(g) {
    const print = (x, y, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = "rgba(78,64,50,0.6)";
      g.beginPath(); g.ellipse(0, -9, 8.5, 13, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(0, 15, 7, 7.5, 0, 0, 7); g.fill();
      g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
      for (let t = -18; t < 22; t += 4.2) g.fillRect(-10, t, 20, 1.1);
      g.restore();
    };
    print(50, 78, -0.12); print(80, 40, 0.1);
  } },
};
const MESS_KINDS = ["coffee", "dust", "buffer", "beads", "prints", "dust", "coffee"];
const spots = [];
function addSpot(x, z, kind, fromTap, o) {
  o = o || {};
  const K = MESS[kind], S = 128, cnv = document.createElement("canvas"); cnv.width = cnv.height = S;
  const g = cnv.getContext("2d");
  g.translate(64, 64); g.rotate(Math.random() * Math.PI * 2); g.translate(-64, -64); K.draw(g); g.setTransform(1, 0, 0, 1, 0, 0);
  const M = 16, ink = new Float32Array(M * M), px = g.getImageData(0, 0, S, S).data; let total = 0;
  for (let y = 0; y < S; y += 2) for (let xx = 0; xx < S; xx += 2) { const a = px[(y * S + xx) * 4 + 3] / 255; ink[((y / 8) | 0) * M + ((xx / 8) | 0)] += a; total += a; }
  const t = new THREE.CanvasTexture(cnv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  const size = K.size * (o.scale || 1) * (0.9 + Math.random() * 0.2);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: K.rough, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, o.y || 0.009, z); m.receiveShadow = true; m.renderOrder = 2; m.userData.noSample = true;
  (o.layer || spotLayer).add(m);
  const sp = { x, z, size, kind, label: K.label, g, tex: t, mesh: m, ink, total, left: 1, pop: fromTap ? 0 : 1, fade: -1, dirty: false };
  if (fromTap) m.scale.setScalar(0.01);
  (o.list || spots).push(sp); return sp;
}
// the brush roll sits under the middle of the robot: wipe a soft disc of the canvas and the matching coverage cells
function wipe(sp, bx, bz, a, rad) {
  const S = 128, M = 16, cs = S / M, u = ((bx - sp.x) / sp.size + 0.5) * S, v = ((bz - sp.z) / sp.size + 0.5) * S, r = ((rad || 0.17) / sp.size) * S;
  if (u < -r || v < -r || u > S + r || v > S + r) return false;
  const g = sp.g; g.save(); g.globalCompositeOperation = "destination-out";
  const gr = g.createRadialGradient(u, v, 0, u, v, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.65, `rgba(0,0,0,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(u, v, r, 0, 7); g.fill(); g.restore(); sp.tex.needsUpdate = true;
  let sum = 0, hit = 0;
  for (let k = 0; k < M * M; k++) {
    const cu = (k % M + 0.5) * cs, cv2 = (((k / M) | 0) + 0.5) * cs;
    if (Math.hypot(cu - u, cv2 - v) < r * 0.85) { hit += sp.ink[k]; sp.ink[k] *= 1 - a; }
    sum += sp.ink[k];
  }
  sp.left = sum / sp.total;
  return hit / sp.total > 0.004;
}
function removeSpot(sp) {
  const i = spots.indexOf(sp); if (i >= 0) spots.splice(i, 1);
  spotLayer.remove(sp.mesh); sp.mesh.geometry.dispose(); sp.mesh.material.dispose(); sp.tex.dispose();
}
// a sparkle ring where a mess used to be
const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
const shine = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 48), shineMat); shine.rotation.x = -Math.PI / 2; shine.position.y = 0.012; shine.visible = false; shine.userData.noNav = shine.userData.noSample = true; lab.add(shine);
let shineT = 0;
// flecks the side brush flicks in toward the intake
const FLECKS = 36, fleckGeo = new THREE.BufferGeometry(), fleckPos = new Float32Array(FLECKS * 3), fleckCol = new Float32Array(FLECKS * 3), flecks = [];
fleckGeo.setAttribute("position", new THREE.BufferAttribute(fleckPos, 3)); fleckGeo.setAttribute("color", new THREE.BufferAttribute(fleckCol, 3));
for (let i = 0; i < FLECKS; i++) { flecks.push({ life: 0 }); fleckPos[i * 3 + 1] = -1; }
const fleckPts = new THREE.Points(fleckGeo, new THREE.PointsMaterial({ size: 0.028, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
fleckPts.frustumCulled = false; lab.add(fleckPts);
let fleckNext = 0, fleckI = 0;

// the robot's state
const R = { x: 0, z: 0, h: DOCK.h, v: 0, w: 0, acc: 0, state: "charge", t: 0, path: null, goal: null, battery: 0.86, cleaned: 0, patrols: 0,
  spin: 0, spinMode: 0, flash: 0, happy: 0, stuckT: 0, lastX: 0, lastZ: 0, spiral: 0, passes: 0, rethink: false, msg: "", msgT: 0 };
const dockFwd = () => [Math.cos(DOCK.h), -Math.sin(DOCK.h)];
function placeDocked() { R.x = DOCK.x; R.z = DOCK.z; R.h = DOCK.h; bot.position.set(R.x, 0.003, R.z); bot.rotation.set(0, R.h, 0); }
placeDocked();
let spawnIn = 16;
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const okAt = (x, z, r) => { const k = kAt(x, z); return k >= 0 && nav.clear[k] >= r; };
function setState(s) { R.state = s; R.t = 0; }
function go(tx, tz, then) { const p = plan(R.x, R.z, tx, tz); if (!p) return false; R.path = p.pts; R.goal = then; return true; }
// steer like a two-wheeled robot: turn toward the target, only roll forward once roughly facing it
function drive(tx, tz, dt, vmax, careful) {
  const dx = tx - R.x, dz = tz - R.z, dist = Math.hypot(dx, dz), err = wrapA(Math.atan2(-dz, dx) - R.h);
  const wT = Math.max(-2.6, Math.min(2.6, err * 4.5));
  R.w += (wT - R.w) * Math.min(1, dt * 10); R.h += R.w * dt;
  const align = Math.max(0, Math.cos(err)), vT = vmax * Math.pow(align, 6) * Math.min(1, dist / (careful ? 0.12 : 0.3) + 0.15);
  const dv = Math.max(-0.6 * dt, Math.min(0.45 * dt, vT - R.v)); R.v += dv; R.acc = dv / Math.max(dt, 1e-4);
  const nx = R.x + Math.cos(R.h) * R.v * dt, nz = R.z - Math.sin(R.h) * R.v * dt;
  if (okAt(nx, nz, BOT_R + 0.005)) { R.x = nx; R.z = nz; return dist; }
  R.v = 0; return -1;    // bumper hit
}
function turnTo(h, dt) {
  const err = wrapA(h - R.h), wT = Math.max(-2.2, Math.min(2.2, err * 5));
  R.w += (wT - R.w) * Math.min(1, dt * 10); R.h += R.w * dt; R.v *= 0.8;
  return Math.abs(err) < 0.03;
}
function follow(dt, vmax) {
  if (!R.path || !R.path.length) return true;
  const p = R.path[0], last = R.path.length === 1;
  const d = drive(p[0], p[1], dt, vmax, last);
  if (d < 0) { setState("bump"); return false; }
  if (d < (last ? 0.05 : 0.14)) R.path.shift();
  return !R.path.length;
}
function nearestSpot() {
  let best = null, bl = 1e9;
  spots.forEach(sp => { if (sp.fade >= 0 || sp.pop < 1) return; const p = plan(R.x, R.z, sp.x, sp.z); if (!p) { sp.fade = 0; return; } if (p.len < bl) { bl = p.len; best = { sp, p }; } });
  return best;
}
function spawnMess(x, z, fromTap) {
  if (!nav || spots.length >= 7) return null;
  return addSpot(x, z, MESS_KINDS[(Math.random() * MESS_KINDS.length) | 0], fromTap);
}
function randomMessSpot() {
  for (let n = 0; n < 80; n++) {
    const k = nav.cells[(Math.random() * nav.cells.length) | 0], x = cPos(k % GN), z = cPos((k / GN) | 0);
    if (nav.cover[k] || nav.clear[k] < NAV_R + 0.12) continue;
    if (Math.hypot(x - R.x, z - R.z) < 1.2 || Math.hypot(x - DOCK.x, z - DOCK.z) < 0.9) continue;
    if (spots.some(s => Math.hypot(s.x - x, s.z - z) < 0.9)) continue;
    return [x, z];
  }
  return null;
}
function tapFloor(x, z) {
  if (!nav) return;
  const k = kAt(x, z);
  if (k < 0 || !nav.reach[k] || nav.cover[k] || Math.hypot(x - R.x, z - R.z) < BOT_R + 0.12) { say("I can't reach that spot"); return; }
  if (spots.length >= 7) { say("That's plenty of mess for now"); return; }
  spawnMess(x, z, true); R.rethink = true; say("Ooh, a mess! On my way");
}
function say(m) { R.msg = m; R.msgT = 2.6; botTipFor = 2.6; }
function pokeBot() {
  R.flash = 1.3; botTipFor = 3;
  if (R.state === "charge" || R.state.startsWith("dock") || R.state === "undock") { R.spin = 0.9; R.spinMode = 1; }
  else { R.spin = 1.3; R.spinMode = 0; }
}

function updateBot(dt, time) {
  if (!nav) { buildNav(); for (let i = 0; i < 2; i++) { const p = randomMessSpot(); if (p) spawnMess(p[0], p[1], false); } }
  R.t += dt;
  // new messes appear every so often
  spawnIn -= dt;
  if (spawnIn <= 0) { spawnIn = 20 + Math.random() * 18; if (spots.length < 4) { const p = randomMessSpot(); if (p) { spawnMess(p[0], p[1], false); R.rethink = true; } } }
  const moving = !(R.state === "charge");
  let brushRate = moving ? 18 : 0, lidar = 3;
  if (R.spin > 0) {
    // poked: a happy pirouette (or a wiggle while it's parked on the dock)
    R.spin -= dt; R.v *= 0.85;
  } else switch (R.state) {
    case "charge":
      R.battery = Math.min(1, R.battery + dt / 16);
      if (R.t > 2.5 && ((spots.some(s => s.pop >= 1 && s.fade < 0) && R.battery > 0.5) || (R.battery >= 1 && R.t > 14))) { R.patrols = 0; setState("undock"); }
      break;
    case "undock": {
      const [fx, fz] = dockFwd(); R.v = -0.16; R.x -= fx * 0.16 * dt; R.z -= fz * 0.16 * dt;
      if (Math.hypot(R.x - nav.ax, R.z - nav.az) < 0.03 || R.t > 5) { R.x = nav.ax; R.z = nav.az; R.v = 0; setState("think"); }
      break;
    }
    case "think": {
      // pause and sweep the turret around before deciding
      lidar = 11; R.v *= 0.8; R.w *= 0.8;
      if (R.t < 0.9) break;
      R.rethink = false;
      if (R.battery < 0.2) { if (go(nav.ax, nav.az, "dockAlign")) setState("home"); else R.t = 0; break; }
      const n = nearestSpot();
      if (n) { R.path = n.p.pts; R.goal = n.sp; setState("seek"); break; }
      if (R.patrols >= 2) { if (go(nav.ax, nav.az, "dockAlign")) { setState("home"); break; } }
      // now and then, go and peer down the stairwell
      const cx = STAIR.x + STAIR.r + 0.05 + NAV_R + 0.2, czz = STAIR.z;
      if (Math.random() < 0.22 && Math.hypot(R.x - cx, R.z - czz) > 1.5 && go(cx, czz, null)) { R.patrols++; setState("cliffGo"); break; }
      for (let tries = 0; tries < 12; tries++) {
        const k = nav.cells[(Math.random() * nav.cells.length) | 0], x = cPos(k % GN), z = cPos((k / GN) | 0);
        if (Math.hypot(x - R.x, z - R.z) < 1.6 || nav.clear[k] < NAV_R + 0.08) continue;
        if (go(x, z, null)) { R.patrols++; setState("patrol"); break; }
      }
      if (R.state === "think") R.t = 0.5;
      break;
    }
    case "seek":
      if (!spots.includes(R.goal) || R.goal.fade >= 0) { setState("think"); R.t = 0.7; break; }
      if (R.rethink && R.t > 0.5) { R.rethink = false; setState("think"); R.t = 0.75; break; }
      if (follow(dt, 0.34)) { R.spiral = 0; R.passes = 0; setState("clean"); }
      break;
    case "clean": {
      const sp = R.goal;
      if (!spots.includes(sp) || sp.fade >= 0) { setState("happy"); break; }
      brushRate = 34;
      // spiral outward over the mess, skipping any part of the spiral the robot can't fit into
      const rMax = Math.max(0.05, sp.size / 2 - 0.08), turns = 2.4 + sp.size * 2, a0 = sp.x * 3 + sp.z;
      const at = s => [sp.x + Math.cos(a0 + s * turns * 6.283) * rMax * s, sp.z + Math.sin(a0 + s * turns * 6.283) * rMax * s];
      let p = at(R.spiral);
      while (R.spiral < 1 && (Math.hypot(p[0] - R.x, p[1] - R.z) < 0.1 || !okAt(p[0], p[1], NAV_R - 0.02))) { R.spiral = Math.min(1, R.spiral + 0.01); p = at(R.spiral); }
      if (R.spiral >= 1) {
        R.passes++;
        if (sp.left < 0.3 || R.passes >= 2) { sp.fade = 0; setState("happy"); R.cleaned++; break; }
        R.spiral = 0;
      }
      if (drive(p[0], p[1], dt, 0.2, true) < 0) { R.spiral = Math.min(1, R.spiral + 0.05); }
      break;
    }
    case "happy":
      R.happy = 1 - R.t / 0.9; R.v *= 0.85;
      if (R.t > 1.0) { R.happy = 0; setState("think"); R.t = 0.3; }
      break;
    case "patrol":
      if (R.rethink && spots.length) { R.rethink = false; setState("think"); R.t = 0.6; break; }
      if (follow(dt, 0.3)) { setState("think"); R.t = 0.2; }
      break;
    case "cliffGo":
      if (R.rethink && spots.length) { R.rethink = false; setState("think"); R.t = 0.6; break; }
      if (follow(dt, 0.26)) setState("cliff");
      break;
    case "cliff": {
      // turn to face the opening, creep to the edge, think better of it, back off
      lidar = 9;
      if (R.t < 1.2) { turnTo(Math.atan2(-(STAIR.z - R.z), STAIR.x - R.x), dt); break; }
      if (R.t < 1.8) { R.v = 0.06; R.x += Math.cos(R.h) * 0.06 * dt; R.z -= Math.sin(R.h) * 0.06 * dt; break; }
      if (R.t < 2.0) { R.v = 0; if (R.msg.indexOf("stairs") < 0 || R.msgT <= 0) { say("Whoa, stairs. Not today."); R.flash = 0.8; } break; }
      if (R.t < 2.9) { R.v = -0.12; R.x -= Math.cos(R.h) * 0.12 * dt; R.z += Math.sin(R.h) * 0.12 * dt; break; }
      R.v = 0; setState("think"); R.t = 0.3;
      break;
    }
    case "home":
      if (R.rethink && R.battery >= 0.2 && spots.length) { R.rethink = false; setState("think"); R.t = 0.6; break; }
      if (follow(dt, 0.32)) setState("dockAlign");
      break;
    case "dockAlign": {
      // line up with the dock, then creep straight in
      const [fx, fz] = dockFwd(), d = Math.hypot(R.x - nav.ax, R.z - nav.az);
      if (d > 0.05) { if (drive(nav.ax, nav.az, dt, 0.12, true) < 0) setState("bump"); break; }
      if (turnTo(DOCK.h, dt) && R.t > 0.4) setState("dockIn");
      break;
    }
    case "dockIn": {
      const [fx, fz] = dockFwd(), rest = (DOCK.x - R.x) * fx + (DOCK.z - R.z) * fz;
      R.v = Math.min(0.12, rest * 1.2 + 0.03); R.h += wrapA(DOCK.h - R.h) * Math.min(1, dt * 6);
      if (rest <= 0.004) { placeDocked(); R.v = 0; setState("charge"); break; }
      const lat = (DOCK.x - R.x) * -fz + (DOCK.z - R.z) * fx, pull = lat * Math.min(1, dt * 3);
      R.x += fx * R.v * dt - fz * pull; R.z += fz * R.v * dt + fx * pull;
      break;
    }
    case "bump":
      // bumper tapped something: back off a touch and re-plan
      R.v = -0.1; R.x -= Math.cos(R.h) * 0.1 * dt; R.z += Math.sin(R.h) * 0.1 * dt;
      if (!okAt(R.x, R.z, BOT_R)) { R.x += Math.cos(R.h) * 0.1 * dt; R.z -= Math.sin(R.h) * 0.1 * dt; }
      if (R.t > 0.35) { R.v = 0; setState("think"); R.t = 0.4; }
      break;
  }
  if (moving && R.state !== "undock" && R.state !== "dockIn" && R.state !== "dockAlign") R.battery = Math.max(0, R.battery - dt / (R.state === "clean" ? 190 : 260));
  if (R.state === "dockAlign" || R.state === "dockIn" || R.state === "undock") R.battery = Math.max(0, R.battery - dt / 400);

  // wipe whatever is under the brush roll, and flick a few flecks toward the intake
  let wiping = null;
  if (R.state !== "charge" && R.spin <= 0) spots.forEach(sp => {
    if (sp.fade >= 0 || sp.pop < 1) return;
    if (Math.hypot(R.x - sp.x, R.z - sp.z) < sp.size / 2 + 0.2 && wipe(sp, R.x, R.z, 1 - Math.exp(-dt * (R.state === "clean" ? 2.4 : 1.4)))) wiping = sp;
    if (sp.left < 0.06 && R.goal !== sp) { sp.fade = 0; R.cleaned++; }
  });
  fleckNext -= dt;
  if (wiping && fleckNext <= 0) {
    fleckNext = 0.045;
    const f = flecks[fleckI = (fleckI + 1) % FLECKS], c = Math.cos(R.h), s = Math.sin(R.h), bx = BOT_R * 0.75, bz = -BOT_R * 0.75 + (Math.random() - 0.5) * 0.08;
    f.sx = R.x + c * bx + s * bz; f.sz = R.z - s * bx + c * bz; f.ex = R.x + c * 0.06; f.ez = R.z - s * 0.06; f.life = 1;
    const col = MESS[wiping.kind].speck; fleckCol[fleckI * 3] = col[0]; fleckCol[fleckI * 3 + 1] = col[1]; fleckCol[fleckI * 3 + 2] = col[2]; fleckGeo.attributes.color.needsUpdate = true;
  }
  flecks.forEach((f, i) => {
    if (f.life <= 0) { fleckPos[i * 3 + 1] = -1; return; }
    f.life -= dt / 0.35; const e = 1 - Math.max(0, f.life);
    fleckPos[i * 3] = f.sx + (f.ex - f.sx) * e; fleckPos[i * 3 + 1] = 0.02 + Math.sin(e * Math.PI) * 0.05; fleckPos[i * 3 + 2] = f.sz + (f.ez - f.sz) * e;
  });
  fleckGeo.attributes.position.needsUpdate = true;

  // messes: pop in when tapped, fade out (with a sparkle) once clean
  for (let i = spots.length - 1; i >= 0; i--) {
    const sp = spots[i];
    if (sp.pop < 1) { sp.pop = Math.min(1, sp.pop + dt / 0.35); const e = sp.pop, k = 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2); sp.mesh.scale.setScalar(Math.max(0.01, k)); }
    if (sp.fade >= 0) {
      if (sp.fade === 0 && sp.left < 0.8) { shine.position.x = sp.x; shine.position.z = sp.z; shine.visible = true; shineT = 1; }
      sp.fade += dt / 0.6; sp.mesh.material.opacity = Math.max(0, 1 - sp.fade);
      if (sp.fade >= 1) { if (R.goal === sp) R.goal = null; removeSpot(sp); }
    }
  }
  if (shineT > 0) { shineT -= dt / 0.9; const e = 1 - shineT; shine.scale.setScalar(1 + e * 1.6); shineMat.opacity = Math.max(0, shineT) * 0.8; if (shineT <= 0) shine.visible = false; }

  // body language: lean into acceleration, spin, wiggle, sweep the turret
  let yaw = R.h;
  if (R.spin > 0) {
    const e = 1 - R.spin / 1.3, ease = e < 0.5 ? 2 * e * e : 1 - 2 * (1 - e) * (1 - e);
    yaw += R.spinMode ? Math.sin(R.spin * 28) * 0.16 * (R.spin / 0.9) : ease * Math.PI * 2; lidar = 14;
  }
  if (R.happy > 0) yaw += Math.sin(R.t * 24) * 0.22 * R.happy;
  const pitch = Math.max(-0.035, Math.min(0.035, R.acc * 0.05));
  bot.rotation.set(0, yaw, bot.rotation.z + (pitch - bot.rotation.z) * Math.min(1, dt * 8));
  bot.position.set(R.x, 0.003, R.z);
  brush.rotation.y += dt * brushRate;
  turret.rotation.y += dt * lidar;

  // the light ring tells you what it's up to
  R.flash -= dt; R.msgT -= dt;
  let col = 0x3fe0d0;
  if (R.state === "charge") { const b = 0.55 + 0.45 * Math.sin(time * 2.4); col = new THREE.Color(0x4fe07a).multiplyScalar(R.battery >= 1 ? 1 : b).getHex(); }
  else if (R.state === "clean") col = Math.sin(time * 9) > 0 ? 0x9ff3ea : 0x3fe0d0;
  else if (R.state === "happy") col = 0x6dff9a;
  else if (R.state === "home" || R.state.startsWith("dock")) col = R.battery < 0.2 && Math.sin(time * 4) > 0 ? 0xffa040 : 0x5aa0ff;
  if (R.flash > 0 && Math.sin(time * 22) > 0) col = 0xffffff;
  botLight.color.setHex(col);
  dockLed.color.setHex(R.state === "charge" ? (R.battery >= 1 ? 0x4fe07a : (Math.sin(time * 3) > 0 ? 0x4fe07a : 0x1d5a30)) : 0x2a6a44);
  updateBotTip(dt);
}

// a small status bubble over the robot on hover or after a tap
const botTip = document.createElement("div"); botTip.className = "bot-tip"; botTip.setAttribute("aria-hidden", "true"); document.body.appendChild(botTip);
let botHover = false, botTipFor = 0, botTipText = "";
const tipV = new THREE.Vector3();
function botStatus() {
  if (R.msgT > 0) return R.msg;
  if (R.spin > 0) return R.spinMode ? "Hee hee, that tickles" : "Wheee!";
  const pct = Math.round(R.battery * 100);
  switch (R.state) {
    case "charge": return R.battery >= 1 ? "Docked and fully charged" : `Charging · ${pct}%`;
    case "undock": return "Heading out";
    case "think": return "Scanning for messes";
    case "seek": return R.goal ? `Off to clean ${R.goal.label}` : "Scanning for messes";
    case "clean": return R.goal ? `Cleaning ${R.goal.label} · ${Math.round((1 - R.goal.left) * 100)}%` : "Cleaning";
    case "happy": return "Spotless!";
    case "patrol": return "All clean · on patrol";
    case "cliffGo": return "Exploring";
    case "cliff": return "Peeking at the stairs";
    case "home": return R.battery < 0.2 ? "Low battery, heading home" : "Heading home to rest";
    case "bump": return "Oops, bumped something";
    default: return "Docking";
  }
}
function updateBotTip(dt) {
  botTipFor -= dt;
  const show = (botHover || botTipFor > 0) && lab.visible && !pMode && !deskOpen;
  botTip.classList.toggle("on", show);
  if (!show) return;
  const left = spots.filter(s => s.fade < 0).length;
  const txt = `<b>${botStatus()}</b>Battery ${Math.round(R.battery * 100)}% · ${R.cleaned} cleaned${left ? ` · ${left} to go` : ""}<span>Tap me to spin · tap the floor to make a mess</span>`;
  if (txt !== botTipText) { botTip.innerHTML = txt; botTipText = txt; }
  tipV.set(R.x, 0.32, R.z); lab.localToWorld(tipV); tipV.project(camera);
  const r = renderer.domElement.getBoundingClientRect(), px = r.left + (tipV.x + 1) / 2 * r.width, py = r.top + (1 - tipV.y) / 2 * r.height;
  const w = botTip.offsetWidth, h = botTip.offsetHeight, x = Math.min(innerWidth - w - 8, Math.max(8, px - w / 2));
  const y = py - h - 10 < 8 ? py + 36 : py - h - 10;    // keep the bubble on screen
  botTip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}
