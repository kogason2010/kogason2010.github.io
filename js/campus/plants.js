/* js/campus/plants.js — Trees (a port of EZ-Tree by Daniel Greenheck, MIT), their textures, shrubs and the hedge.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

let treeTex = null;
function treeTextures() {   // leaf and bark textures (EZ-Tree, MIT; bark via texturecan / polyhaven, CC0)
  if (treeTex) return treeTex;
  const L = new THREE.TextureLoader(), t = (f, srgb, rep) => { const x = L.load("assets/trees/" + f); if (srgb) x.encoding = THREE.sRGBEncoding; if (rep) x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 4; return x; };
  treeTex = { oak: t("oak_leaves.png", 1), ash: t("ash_leaves.png", 1), aspen: t("aspen_leaves.png", 1), gold: t("aspen_gold_leaves.png", 1), pine: t("pine_needles.png", 1),
    bark: { oak: [t("oak_bark_color.jpg", 1, 1), t("oak_bark_normal.jpg", 0, 1)], birch: [t("birch_bark_color.jpg", 1, 1), t("birch_bark_normal.jpg", 0, 1)], pine: [t("pine_bark_color.jpg", 1, 1), t("pine_bark_normal.jpg", 0, 1)] } };
  return treeTex;
}

/* ---- EZ-Tree port: recursive branches built ring by ring, crossed leaf quads on the last level ---- */
function ezRng(seed) {   // EZ-Tree's multiply-with-carry generator
  let w = (123456789 + seed) & 0xffffffff, z = (987654321 - seed) & 0xffffffff;
  return (max = 1, min = 0) => { z = (36969 * (z & 65535) + (z >> 16)) & 0xffffffff; w = (18000 * (w & 65535) + (w >> 16)) & 0xffffffff; return (max - min) * ((((z << 16) + (w & 65535)) >>> 0) / 4294967296) + min; };
}
function ezTree(o, height, lod) {
  const R = ezRng(o.seed), E = THREE.Euler, Q = THREE.Quaternion, V3 = THREE.Vector3, UP = new V3(0, 1, 0), XA = new V3(1, 0, 0);
  const br = { v: [], n: [], uv: [], ix: [] }, lf = { v: [], uv: [], ix: [] }, queue = [];
  const qForce = new Q().setFromUnitVectors(UP, new V3(0, 1, 0));
  if (lod) o = { ...o, levels: o.type === "deciduous" ? Math.max(1, o.levels - 1) : o.levels, children: o.type === "evergreen" ? [Math.round(o.children[0] * 0.55), ...o.children.slice(1)] : o.children };
  const segs = l => lod ? 3 : o.segments[l], secs = l => Math.max(1, Math.round(o.sections[l] * (lod ? 0.34 : 1)));
  const lv = o.levels, thin = (lod ? (o.type === "evergreen" ? 0.55 : 0.6) : 1) * (COARSE ? 0.7 : 1), leafCount = Math.max(2, Math.round(o.leafCount * thin)), leafSize = o.leafSize / Math.pow(thin, 0.6) * (lod ? (o.type === "deciduous" ? 1.6 : 1.45) : 1);
  const at = (sections, t) => {
    const n = sections.length - 1, si = Math.min(n, Math.floor(t * n)), A = sections[si], B = sections[Math.min(si + 1, n)], al = n ? (t - si / n) * n : 0;
    return { origin: new V3().lerpVectors(A.origin, B.origin, al), radius: (1 - al) * A.radius + al * B.radius, orient: new E().setFromQuaternion(new Q().setFromEuler(B.orient).slerp(new Q().setFromEuler(A.orient), al)) };
  };
  const turn = (parent, deg, radial) => new E().setFromQuaternion(new Q().setFromEuler(parent).multiply(new Q().setFromAxisAngle(UP, radial).multiply(new Q().setFromAxisAngle(XA, deg * Math.PI / 180))));
  const leaf = (origin, orient) => {
    const s = leafSize * (1 + R(o.leafVar, -o.leafVar));
    (lod ? [R() * Math.PI] : [0, Math.PI / 2]).forEach(rot => {
      const i0 = lf.v.length / 3, e = new E(0, rot, 0);
      [[-s / 2, s, 0, 1], [-s / 2, 0, 0, 0], [s / 2, 0, 1, 0], [s / 2, s, 1, 1]].forEach(([x, y, u, v]) => { const p = new V3(x, y, 0).applyEuler(e).applyEuler(orient).add(origin); lf.v.push(p.x, p.y, p.z); lf.uv.push(u, v); });
      lf.ix.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    });
  };
  queue.push({ origin: new V3(), orient: new E(), length: o.length[0], radius: o.radius[0], level: 0, sec: secs(0), seg: segs(0) });
  while (queue.length) {
    const b = queue.shift(), off = br.v.length / 3, so = b.orient.clone(), sp = b.origin.clone(), secLen = b.length / b.sec, sections = [], vScale = 1 / (2 * Math.PI * Math.max(b.radius, 0.05));
    for (let i = 0; i <= b.sec; i++) {
      let r = b.radius;
      if (i === b.sec && b.level === lv) r = 0.001;
      else if (o.type === "deciduous") r *= 1 - o.taper[b.level] * (i / b.sec);
      else r *= 1 - i / b.sec;
      let first;
      for (let j = 0; j < b.seg; j++) {
        const a = 2 * Math.PI * j / b.seg, nn = new V3(Math.cos(a), 0, Math.sin(a)).applyEuler(so), p = nn.clone().multiplyScalar(r).add(sp);
        br.v.push(p.x, p.y, p.z); br.n.push(nn.x, nn.y, nn.z); br.uv.push(j / b.seg, i * secLen * vScale); if (!j) first = [p, nn];
      }
      br.v.push(first[0].x, first[0].y, first[0].z); br.n.push(first[1].x, first[1].y, first[1].z); br.uv.push(1, i * secLen * vScale);
      sections.push({ origin: sp.clone(), orient: so.clone(), radius: r });
      sp.add(new V3(0, secLen, 0).applyEuler(so));
      const gn = Math.max(1, 1 / Math.sqrt(r)) * o.gnarl[b.level];
      so.x += R(gn, -gn); so.z += R(gn, -gn);
      const qs = new Q().setFromEuler(so).multiply(new Q().setFromAxisAngle(UP, o.twist[b.level]));
      qs.rotateTowards(qForce, o.force / r); so.setFromQuaternion(qs);
    }
    const N = b.seg + 1;
    for (let i = 0; i < b.sec; i++) for (let j = 0; j < b.seg; j++) { const v1 = off + i * N + j, v2 = v1 + 1; br.ix.push(v1, v1 + N, v2, v2, v1 + N, v2 + N); }
    if (o.type === "deciduous") {
      const last = sections[sections.length - 1];
      if (b.level < lv) queue.push({ origin: last.origin, orient: last.orient, length: o.length[b.level + 1], radius: last.radius, level: b.level + 1, sec: b.sec, seg: b.seg });
      else leaf(last.origin, last.orient);
    }
    if (b.level === lv) { const ro = R(); for (let i = 0; i < leafCount; i++) { const s = at(sections, R(1, o.leafStart)); leaf(s.origin, turn(s.orient, o.leafAngle, 2 * Math.PI * (ro + i / leafCount))); } }
    else if (b.level < lv) {
      const ro = R(), l = b.level + 1, cnt = o.children[b.level];
      for (let i = 0; i < cnt; i++) { const t = R(1, o.start[l]), s = at(sections, t); queue.push({ origin: s.origin, orient: turn(s.orient, o.angle[l], 2 * Math.PI * (ro + i / cnt)), length: o.length[l] * (o.type === "evergreen" ? 1 - t : 1), radius: o.radius[l] * s.radius, level: l, sec: secs(l), seg: segs(l) }); }
    }
  }
  // scale to campus size, then give the leaves soft volume lighting: normals out from the crown, inner leaves darker
  let top = 0; for (let i = 1; i < lf.v.length; i += 3) top = Math.max(top, lf.v[i]); for (let i = 1; i < br.v.length; i += 3) top = Math.max(top, br.v[i]);
  const k = height / top; br.v.forEach((x, i) => { br.v[i] = x * k; }); lf.v.forEach((x, i) => { lf.v[i] = x * k; });
  const bark = new THREE.BufferGeometry(); bark.setAttribute("position", new THREE.Float32BufferAttribute(br.v, 3)); bark.setAttribute("normal", new THREE.Float32BufferAttribute(br.n, 3)); bark.setAttribute("uv", new THREE.Float32BufferAttribute(br.uv, 2)); bark.setIndex(br.ix);
  const nq = lf.v.length / 12, c = new V3(); let cnt = 0;
  for (let i = 0; i < lf.v.length; i += 3) { if (lf.v[i + 1] > height * 0.25) { c.x += lf.v[i]; c.y += lf.v[i + 1]; c.z += lf.v[i + 2]; cnt++; } }
  c.divideScalar(Math.max(1, cnt)); c.y *= 0.95;
  let far = 0; const pc = new V3(), oo = new V3(), nor = new Float32Array(lf.v.length), col = new Float32Array(lf.v.length);
  for (let q = 0; q < nq; q++) { pc.set(0, 0, 0); for (let j = 0; j < 4; j++) pc.add(new V3(lf.v[q * 12 + j * 3], lf.v[q * 12 + j * 3 + 1], lf.v[q * 12 + j * 3 + 2])); pc.multiplyScalar(0.25); far = Math.max(far, pc.distanceTo(c)); }
  for (let q = 0; q < nq; q++) {
    pc.set(0, 0, 0); for (let j = 0; j < 4; j++) pc.add(new V3(lf.v[q * 12 + j * 3], lf.v[q * 12 + j * 3 + 1], lf.v[q * 12 + j * 3 + 2])); pc.multiplyScalar(0.25);
    oo.subVectors(pc, c); oo.y *= 1.25; const d = Math.min(1, oo.length() / far); oo.normalize(); if (!isFinite(oo.x)) oo.set(0, 1, 0);
    const shade = THREE.MathUtils.clamp(0.4 + 0.6 * Math.pow(d, 0.8) + 0.12 * oo.y, 0.3, 1.06);
    for (let j = 0; j < 4; j++) { nor.set([oo.x, oo.y, oo.z], q * 12 + j * 3); col.set([shade * o.tint[0], shade * o.tint[1], shade * o.tint[2]], q * 12 + j * 3); }
  }
  const leaves = new THREE.BufferGeometry(); leaves.setAttribute("position", new THREE.Float32BufferAttribute(lf.v, 3)); leaves.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); leaves.setAttribute("uv", new THREE.Float32BufferAttribute(lf.uv, 2)); leaves.setAttribute("color", new THREE.BufferAttribute(col, 3)); leaves.setIndex(lf.ix);
  return { bark, leaves };
}
// presets after EZ-Tree's oak / ash / aspen / pine (trimmed a little for a campus full of them)
const EZ = {
  oak: { seed: 35729, type: "deciduous", levels: 3, angle: [0, 54, 58, 32], children: [6, 4, 3], force: -0.01, gnarl: [0, -0.1, -0.15, 0.09], length: [37.24, 11.08, 12.39, 7.16], radius: [1.41, 0.9, 0.69, 1.19], sections: [8, 6, 3, 1], segments: [7, 5, 3, 3], start: [0, 0.49, 0.06, 0.12], taper: [0.73, 0.42, 0.69, 0.75], twist: [-0.23, 0.42, 0, 0], leafAngle: 42, leafCount: 15, leafStart: 0.16, leafSize: 3.3, leafVar: 0.6, tint: [0.84, 0.86, 0.8] },
  ash: { seed: 36330, type: "deciduous", levels: 3, angle: [0, 48, 75, 60], children: [7, 4, 3], force: -0.06, gnarl: [0.03, 0.25, 0.2, 0.09], length: [43.47, 27.14, 9.51, 4.6], radius: [2, 0.63, 0.76, 0.7], sections: [10, 6, 4, 2], segments: [9, 5, 3, 3], start: [0, 0.23, 0.33, 0], taper: [0.7, 0.7, 0.7, 0.7], twist: [0.09, -0.07, 0, 0], leafAngle: 55, leafCount: 13, leafStart: 0, leafSize: 3.4, leafVar: 0.6, tint: [0.92, 0.94, 0.88] },
  aspen: { seed: 18020, type: "deciduous", levels: 2, angle: [0, 75, 32, 7], children: [10, 3, 3], force: 0.0148, gnarl: [0.05, 0.12, 0.12, 0.02], length: [50, 6.07, 11.19, 1], radius: [0.72, 0.41, 0.7, 0.7], sections: [10, 6, 5, 3], segments: [8, 5, 3, 3], start: [0, 0.59, 0.35, 0], taper: [0.37, 0.13, 0.7, 0.7], twist: [0, 0, 0, 0], leafAngle: 30, leafCount: 13, leafStart: 0.124, leafSize: 3.5, leafVar: 0.6, tint: [1, 1, 0.92] },
  pine: { seed: 13977, type: "evergreen", levels: 1, angle: [0, 110, 16, 60], children: [64, 3, 5], force: -0.003, gnarl: [0.05, 0.08, 0, 0], length: [50, 23.87, 14.08, 1], radius: [1.05, 0.36, 0.7, 0.7], sections: [10, 6, 8, 6], segments: [8, 4, 4, 3], start: [0, 0.27, 0.14, 0.3], taper: [0.7, 0.7, 0.7, 0.7], twist: [0, 0, 0, 0], leafAngle: 39, leafCount: 22, leafStart: 0.09, leafSize: 1.7, leafVar: 0.2, tint: [0.9, 0.95, 0.9] },
};

// shadows for cut-out leaves: a depth material that drops the cut-away parts of the texture
const depthMats = {};
const depthMat = tex => depthMats[tex.uuid] || (depthMats[tex.uuid] = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide }));

/* ---- shrubs, planters and the hedge: cut-out leaf cards over leaf-textured cores ---- */
// The art for all of them, drawn once. The atlas holds cut-out cards in light greys, so each kind of shrub colours them
// with its own vertex colours: 0 a sprig of small leaves (top left), 1 a sprig of large leaves (top right), 2 a cluster
// of azalea flowers (bottom left), 3 a hydrangea head (bottom right). The tile is an opaque, repeating leaf texture for
// the shrubs' cores and the hedge; the mulch is for the beds.
let shrubKit = null;
function shrubArt() {
  if (shrubKit) return shrubKit;
  const R = seeded(4242), A = 512, c = canvasOf(A, A), g = c.getContext("2d"), grey = v => { v = Math.max(0, Math.min(255, v | 0)); return `rgb(${v},${v},${v})`; };
  // a pointed leaf from (x, y) along angle a: a lit upper half, a darker midrib and, on big leaves, side veins
  const leaf = (ctx, x, y, len, wid, a, v) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = grey(v); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.42, -wid, len, 0); ctx.quadraticCurveTo(len * 0.42, wid, 0, 0); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.42, -wid, len, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = Math.max(0.8, wid * 0.12); ctx.beginPath(); ctx.moveTo(len * 0.04, 0); ctx.lineTo(len * 0.88, 0);
    if (len > 40) for (let t = 0.22; t < 0.8; t += 0.16) [-1, 1].forEach(sd => { ctx.moveTo(len * t, 0); ctx.lineTo(len * (t + 0.12), sd * wid * 0.55 * (1 - t * 0.6)); });
    ctx.stroke(); ctx.restore();
  };
  // 0: small leaves filling a rough circle, the outer ones pointing outward and drawn last
  g.strokeStyle = grey(95); g.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; g.beginPath(); g.moveTo(128, 214); g.quadraticCurveTo(128 + Math.cos(a) * 40, 214 + Math.sin(a) * 70, 128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80); g.stroke(); }
  const small = [];
  for (let i = 0; i < 170; i++) { const r = 90 * Math.sqrt(R()), t = R() * 6.283; small.push([128 + Math.cos(t) * r, 128 + Math.sin(t) * r, t, r]); }
  small.sort((p, q) => p[3] - q[3]).forEach(([x, y, t]) => leaf(g, x, y, 14 + R() * 10, 5 + R() * 2.5, t + (R() - 0.5) * 1.6, 150 + R() * 85 + (128 - y) * 0.18));
  // 1: large leaves round a short stem, the side ones first
  const big = [];
  for (let i = 0; i < 17; i++) big.push([-Math.PI / 2 + (R() - 0.5) * 4.4, 50 + R() * 44]);
  big.sort((p, q) => Math.abs(q[0] + Math.PI / 2) - Math.abs(p[0] + Math.PI / 2)).forEach(([a, len]) => leaf(g, 384 + Math.cos(a) * 14, 140 + Math.sin(a) * 14, len, len * 0.27, a, 150 + R() * 80));
  // 2: five-petal flowers, shaded toward their throats
  for (let i = 0; i < 9; i++) {
    const r = i ? 34 + R() * 46 : 0, t = R() * 6.283, x = 128 + Math.cos(t) * r, y = 384 + Math.sin(t) * r, s = 24 + R() * 6, rot = R() * 1.3;
    for (let p = 0; p < 5; p++) {
      const a = rot + p * 1.2566, gr = g.createRadialGradient(x, y, 1, x, y, s);
      gr.addColorStop(0, grey(150)); gr.addColorStop(0.45, grey(228 - R() * 20)); gr.addColorStop(1, grey(250));
      g.fillStyle = gr; g.beginPath(); g.ellipse(x + Math.cos(a) * s * 0.48, y + Math.sin(a) * s * 0.48, s * 0.52, s * 0.38, a, 0, 6.283); g.fill();
    }
    g.strokeStyle = grey(120); g.lineWidth = 1.2; g.beginPath();
    for (let k = 0; k < 5; k++) { const a = rot + R() * 6.283; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55); }
    g.stroke();
  }
  // 3: a hydrangea head: a dome of small four-petal florets, lit from above, the middle ones on top
  const florets = [];
  for (let i = 0; i < 95; i++) { const r = 92 * Math.sqrt(R()), t = R() * 6.283; florets.push([384 + Math.cos(t) * r, 384 + Math.sin(t) * r * 0.9, r]); }
  florets.sort((p, q) => q[2] - p[2]).forEach(([x, y, r]) => {
    const s = 10 + R() * 4, v = 252 - r * 0.55 - (y - 384) * 0.25 - R() * 18, rot = R() * 1.6;
    for (let p = 0; p < 4; p++) { const a = rot + p * Math.PI / 2; g.fillStyle = grey(v - (p === 1 ? 14 : 0)); g.beginPath(); g.ellipse(x + Math.cos(a) * s * 0.45, y + Math.sin(a) * s * 0.45, s * 0.5, s * 0.36, a, 0, 6.283); g.fill(); }
    g.fillStyle = grey(v - 70); g.beginPath(); g.arc(x, y, 1.6, 0, 6.283); g.fill();
  });
  // bleed each card's colour into the empty texels round it, so mipmaps don't ring the leaves in black far away
  const img = g.getImageData(0, 0, A, A), d = img.data, has = new Uint8Array(A * A);
  for (let i = 0; i < A * A; i++) has[i] = d[i * 4 + 3] >= 24 ? 1 : 0;
  for (let pass = 0; pass < 8; pass++) {
    const add = [];
    for (let y = 0; y < A; y++) for (let x = 0; x < A; x++) {
      if (has[y * A + x]) continue;
      let r = 0, gg = 0, b = 0, n = 0;
      for (const [X, Y] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (X < 0 || Y < 0 || X >= A || Y >= A || !has[Y * A + X]) continue; const j = (Y * A + X) * 4; r += d[j]; gg += d[j + 1]; b += d[j + 2]; n++; }
      if (n) add.push(y * A + x, r / n, gg / n, b / n);
    }
    for (let k = 0; k < add.length; k += 4) { const i = add[k]; d[i * 4] = add[k + 1]; d[i * 4 + 1] = add[k + 2]; d[i * 4 + 2] = add[k + 3]; has[i] = 1; }
  }
  const px = new Uint8Array(A * A * 4);   // rows flipped, so the top of the drawing is the top of the texture
  for (let y = 0; y < A; y++) px.set(d.subarray(y * A * 4, (y + 1) * A * 4), (A - 1 - y) * A * 4);
  const atlas = new THREE.DataTexture(px, A, A, THREE.RGBAFormat);
  Object.assign(atlas, { encoding: THREE.sRGBEncoding, magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true, anisotropy: 4, needsUpdate: true });
  // the repeating leaf tile and its bumps (later leaves sit higher)
  const T = 256, tc = canvasOf(T, T), th = canvasOf(T, T), tg = tc.getContext("2d"), hg = th.getContext("2d");
  tg.fillStyle = grey(88); tg.fillRect(0, 0, T, T); hg.fillStyle = grey(30); hg.fillRect(0, 0, T, T);
  for (let i = 0; i < 430; i++) {
    const x = R() * T, y = R() * T, len = 14 + R() * 12, wid = 5 + R() * 3, a = R() * 6.283, v = 120 + R() * 105, hv = 70 + i / 430 * 185;
    for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) if (x + ox > -30 && x + ox < T + 30 && y + oy > -30 && y + oy < T + 30) { leaf(tg, x + ox, y + oy, len, wid, a, v); leaf(hg, x + ox, y + oy, len, wid, a, hv); }
  }
  const tile = new THREE.CanvasTexture(tc); tile.encoding = THREE.sRGBEncoding; tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.anisotropy = 8;
  // bark mulch: chips of a few browns over dark soil
  const mc = canvasOf(T, T), mh = canvasOf(T, T), mg = mc.getContext("2d"), mhg = mh.getContext("2d"), chips = ["#5b402b", "#2b1e15", "#76563a", "#47331f", "#8a6a4a"];
  mg.fillStyle = "#33251b"; mg.fillRect(0, 0, T, T); mhg.fillStyle = grey(50); mhg.fillRect(0, 0, T, T);
  for (let i = 0; i < 1500; i++) {
    const x = R() * T, y = R() * T, l = 3 + R() * 8, w = 1.5 + R() * 2.5, a = R() * 3.14, col = chips[(R() * chips.length) | 0], hv = 90 + R() * 160;
    for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) if (x + ox > -12 && x + ox < T + 12 && y + oy > -12 && y + oy < T + 12)
      [[mg, col], [mhg, grey(hv)]].forEach(([ctx, fs]) => { ctx.save(); ctx.translate(x + ox, y + oy); ctx.rotate(a); ctx.fillStyle = fs; ctx.fillRect(-l / 2, -w / 2, l, w); ctx.restore(); });
  }
  const mulch = new THREE.CanvasTexture(mc); mulch.encoding = THREE.sRGBEncoding; mulch.wrapS = mulch.wrapT = THREE.RepeatWrapping; mulch.anisotropy = 8;
  const cut = (amount, from) => windy(new THREE.MeshLambertMaterial({ vertexColors: true, map: atlas, alphaTest: 0.5, side: THREE.DoubleSide }), amount, from, true);
  shrubKit = {
    atlas, tile, tileN: normalFrom(th, 3), mulch, mulchN: normalFrom(mh, 4),
    coreMat: windy(new THREE.MeshLambertMaterial({ vertexColors: true, map: tile }), 0.03, -0.2), cardMat: cut(0.03, -0.2),
    hedgeMat: null, hedgeCardMat: cut(0.004, 0),
  };
  shrubKit.hedgeMat = new THREE.MeshStandardMaterial({ map: tile, normalMap: shrubKit.tileN, vertexColors: true, roughness: 0.9 });
  return shrubKit;
}

// one cut-out card into G: centre p, facing f, turned by a, s across, atlas quarter q, lit as if facing n, colour c
const _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _e3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), XAX = new THREE.Vector3(1, 0, 0);
function addCard(G, p, f, a, s, q, n, c) {
  _e1.crossVectors(Math.abs(f.y) > 0.95 ? XAX : UP, f).normalize(); _e2.crossVectors(f, _e1);
  _e3.copy(_e1).multiplyScalar(Math.cos(a)).addScaledVector(_e2, Math.sin(a)); _e2.multiplyScalar(Math.cos(a)).addScaledVector(_e1, -Math.sin(a)); _e1.copy(_e3);
  const u0 = (q % 2) * 0.5 + 0.004, v0 = (q < 2 ? 0.5 : 0) + 0.004, du = 0.492, i0 = G.pos.length / 3;
  [[-0.5, -0.5, 0, 0], [0.5, -0.5, 1, 0], [0.5, 0.5, 1, 1], [-0.5, 0.5, 0, 1]].forEach(([x, y, u, v]) => {
    G.pos.push(p.x + (_e1.x * x + _e2.x * y) * s, p.y + (_e1.y * x + _e2.y * y) * s, p.z + (_e1.z * x + _e2.z * y) * s);
    G.nor.push(n.x, n.y, n.z); G.uv.push(u0 + u * du, v0 + v * du); G.col.push(c.r, c.g, c.b);
  });
  G.ix.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
}
const newCards = () => ({ pos: [], nor: [], uv: [], col: [], ix: [] });
function cardGeo(G) {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(G.pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(G.uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(G.col, 3)); g.setIndex(G.ix); return g;
}

// a smooth, noise-lumped sphere (the shrubs' inner volume)
function lump(x, y, z, r, det, sy, seed) {
  const g = new THREE.IcosahedronGeometry(r, det), p = g.attributes.position, nrm = g.attributes.normal, d = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    d.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const k = 0.82 + fbm(d.x * 1.8 + seed, d.y * 1.8 + y, d.z * 1.8 + seed * 0.7, 3) * 0.4;
    p.setXYZ(i, d.x * r * k + x, d.y * r * k * sy + y, d.z * r * k + z); nrm.setXYZ(i, d.x, d.y, d.z);
  }
  return g;
}

// The kinds of shrub. w across and h tall (metres, before each plant's own scale), ring: lumps round the middle,
// sy: how tall each lump is for its width, leaf: colour (multiplied by the art's greys), q: which leaves from the atlas
// and size: how big their cards are, per: cards on one shrub, flowers: their art, count, card size and colours.
const SHRUB_KINDS = {
  box: { w: 1.0, h: 0.72, ring: 5, top: 2, sy: 0.85, leaf: [0.22, 0.44, 0.11], q: 0, size: 0.26, per: 300 },
  laurel: { w: 1.0, h: 1.15, ring: 5, top: 2, sy: 1.15, leaf: [0.29, 0.5, 0.13], q: 1, size: 0.34, per: 250 },
  azalea: { w: 1.0, h: 0.78, ring: 5, top: 2, sy: 0.85, leaf: [0.2, 0.39, 0.1], q: 0, size: 0.26, per: 250, flowers: { q: 2, n: 75, size: 0.24, low: -0.15, cols: [[1.0, 0.32, 0.55], [1.0, 0.5, 0.7], [0.95, 0.3, 0.45]] } },
  hydrangea: { w: 1.15, h: 0.95, ring: 5, top: 2, sy: 1.0, leaf: [0.25, 0.47, 0.13], q: 1, size: 0.34, per: 200, flowers: { q: 3, n: 24, size: 0.36, low: -0.05, cols: [[0.55, 0.68, 1.0], [0.78, 0.62, 1.0], [1.0, 1.0, 1.0]] } },
  copper: { w: 0.95, h: 0.72, ring: 5, top: 2, sy: 0.85, leaf: [0.56, 0.17, 0.12], q: 0, size: 0.26, per: 280 },
  bedding: { w: 0.5, h: 0.24, ring: 3, top: 0, sy: 0.75, leaf: [0.2, 0.42, 0.1], q: 0, size: 0.16, per: 40, det: 0 },   // the plaza planters
};
// one shrub of kind k: a core of lumps (darker inside, so gaps read as depth) and a coat of cards on the outside of it
function shrubGeos(k, R) {
  const L = [[0, k.h * 0.5, 0, k.w * 0.33]];
  for (let i = 0; i < k.ring; i++) { const a = (i + R() * 0.6) / k.ring * 6.283, r = k.w * (0.2 + R() * 0.07); L.push([Math.cos(a) * r, k.h * (0.3 + R() * 0.12), Math.sin(a) * r, k.w * (0.21 + R() * 0.05)]); }
  for (let i = 0; i < k.top; i++) { const a = R() * 6.283, r = k.w * 0.1; L.push([Math.cos(a) * r, k.h * (0.66 + R() * 0.08), Math.sin(a) * r, k.w * (0.19 + R() * 0.04)]); }
  const core = mergeGeos(L.map(([x, y, z, r], i) => lump(x, y, z, r * 0.84, k.det == null ? 1 : k.det, k.sy, i * 3.7 + 11)));
  paint(core, (x, y, z, c) => c.setRGB(k.leaf[0], k.leaf[1], k.leaf[2]).multiplyScalar(0.34 + 0.4 * Math.min(1, y / k.h)));
  { const P = core.attributes.position, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) { uv[i * 2] = (P.getX(i) * 0.8 + P.getZ(i) * 0.6) * 2.2; uv[i * 2 + 1] = (P.getY(i) + (P.getZ(i) * 0.8 - P.getX(i) * 0.6) * 0.5) * 2.2; }
    core.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); }
  const C = new THREE.Vector3(0, k.h * 0.45, 0), G = newCards(), d = new THREE.Vector3(), p = new THREE.Vector3(), o = new THREE.Vector3(), f = new THREE.Vector3(), n = new THREE.Vector3(), col = new THREE.Color();
  const wsum = L.reduce((a, l) => a + l[3] * l[3], 0), rand3 = (v, s) => v.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).multiplyScalar(s);
  const pick = () => { let t = R() * wsum; for (const l of L) { t -= l[3] * l[3]; if (t <= 0) return l; } return L[0]; };
  const buried = (l0) => L.some(l => l !== l0 && Math.hypot(p.x - l[0], (p.y - l[1]) / k.sy, p.z - l[2]) < l[3] * 0.8);
  // a point on the outside of the shrub (p), the direction out of its lump (d), and the shrub's outward direction (o)
  const place = (low, out) => {
    for (let tries = 0; tries < 12; tries++) {
      const l = pick(); d.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (d.lengthSq() < 0.02) continue; d.normalize(); if (d.y < low) continue;
      const r = l[3] * (out + R() * 0.15); p.set(l[0] + d.x * r, l[1] + d.y * r * k.sy, l[2] + d.z * r);
      if (p.y > 0.03 && !buried(l)) break;
    }
    o.subVectors(p, C).multiply(_e3.set(1, 1.3, 1)).normalize();
  };
  const per = Math.round(k.per * (COARSE ? 0.6 : 1));
  for (let i = 0; i < per; i++) {
    place(-0.45, 0.9); const t = Math.min(1, Math.max(0, p.y / k.h));
    f.copy(o).multiplyScalar(0.55).addScaledVector(d, 0.45).add(rand3(_e3, 0.6)).normalize(); n.copy(o).multiplyScalar(0.65).addScaledVector(d, 0.35).normalize();
    const shade = (0.42 + 0.58 * THREE.MathUtils.smoothstep(t, 0, 0.6)) * (0.8 + R() * 0.35);
    col.setRGB(k.leaf[0] * shade * (0.88 + R() * 0.24), k.leaf[1] * shade * (0.94 + R() * 0.12), k.leaf[2] * shade * (0.9 + R() * 0.2));
    if (t > 0.65 && R() < 0.25) col.lerp(_c2.setRGB(k.leaf[0] * 1.6, k.leaf[1] * 1.35, k.leaf[2] * 0.9), 0.5);   // paler new growth on top
    addCard(G, p, f, R() * 6.283, k.size * (0.75 + R() * 0.5), k.q, n, col);
  }
  const fl = k.flowers;
  if (fl) for (let i = 0; i < Math.round(fl.n * (COARSE ? 0.7 : 1)); i++) {
    place(fl.low, 1.06); const t = Math.min(1, Math.max(0, p.y / k.h)), fc = fl.cols[(R() * fl.cols.length) | 0], v = (0.8 + R() * 0.25) * (0.75 + 0.25 * t);
    f.copy(o).multiplyScalar(0.5).addScaledVector(d, 0.5).addScaledVector(UP, 0.35).add(rand3(_e3, 0.25)).normalize(); n.copy(o).add(d).normalize();
    addCard(G, p, f, R() * 6.283, fl.size * (0.75 + R() * 0.5), fl.q, n, col.setRGB(fc[0] * v, fc[1] * v, fc[2] * v));
  }
  return { core, cards: cardGeo(G) };
}
const _c2 = new THREE.Color();

// near trees in spatial chunks (culled, shadows near the robot) and lighter trees on the hills
function buildTrees() {
  /* ---- trees: grown with a port of EZ-Tree by Daniel Greenheck (MIT, github.com/dgreenheck/ez-tree).
          Each branch is built ring by ring with taper, gnarliness, twist and a growth force; the last level carries crossed leaf quads.
          A few seeded variants per species are instanced across the campus; the hills get lighter versions of the same trees. ---- */
  const TT = treeTextures();
  // kinds: 0 broadleaf (oak / ash), 1 pine, 2 aspen. [preset, seed, height, leaf texture, bark]
  const KINDS = [
    [[EZ.oak, 35729, 6.6, TT.oak, "oak"], [EZ.oak, 4411, 6.2, TT.oak, "oak"], [EZ.ash, 36330, 7.4, TT.ash, "oak"], [EZ.ash, 912, 7.0, TT.ash, "oak"]],
    [[EZ.pine, 13977, 7.6, TT.pine, "pine"], [EZ.pine, 2207, 6.4, TT.pine, "pine"]],
    [[EZ.aspen, 18020, 8.0, TT.aspen, "birch"], [EZ.aspen, 5150, 7.2, TT.aspen, "birch"], [EZ.aspen, 7781, 7.6, TT.gold, "birch"]],
  ];
  const treePts = [], rows = [], FIND_AT = [[5.5, -31.6], [-30, 17.85], [8.1, -8.25], [-12.6, -6.1], [35.9, 26.6], [SPAWN.x, SPAWN.z]];
  for (let z = 15; z <= 32; z += 6) rows.push([4.8, z, 0], [-4.8, z, 0]);
  for (let x = 15; x <= 29; x += 6) rows.push([x, 4.8, 2], [x, -4.8, 2], [-x, 4.8, 2], [-x, -4.8, 2]);
  const blocked = (x, z, m) => CAMPUS.boxes.some(b => x > b[0] - m && x < b[2] + m && z > b[1] - m && z < b[3] + m)
    || CAMPUS.circles.some(c => Math.hypot(x - c[0], z - c[1]) < c[2] + m)
    || CAMPUS.paths.some(p => segDist(x, z, p) < p[4] / 2 + m) || Math.hypot(x, z) < 12.5 + m
    || CAMPUS.lots.some(l => x > l[0] - m && x < l[2] + m && z > l[1] - m && z < l[3] + m)
    || CAMPUS.mulch.some(({ box: b }) => x > b[0] - m && x < b[2] + m && z > b[1] - m && z < b[3] + m)
    || FIND_AT.some(f => Math.hypot(x - f[0], z - f[1]) < 1.6 + m);
  rows.forEach(t => { if (!blocked(t[0], t[1], 1.0)) treePts.push(t); });
  for (let n = 0; n < 1200 && treePts.length < 120; n++) { const x = (rnd() * 2 - 1) * (WB - 4), z = (rnd() * 2 - 1) * (WB - 4); if (!blocked(x, z, 2.6) && !treePts.some(t => Math.hypot(t[0] - x, t[1] - z) < 5.2)) treePts.push([x, z, rnd() < 0.45 ? 0 : rnd() < 0.55 ? 1 : 2]); }
  const nearN = treePts.length;
  for (let n = 0; n < 900 && treePts.length < nearN + (COARSE ? 160 : 280); n++) { const a = rnd() * 6.283, r = WB + 5 + Math.pow(rnd(), 0.8) * 140, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.max(Math.abs(x), Math.abs(z)) < WB + 4) continue; treePts.push([x, z, rnd() < 0.5 ? 1 : rnd() < 0.7 ? 0 : 2, hillH(x, z) + 0.01]); }
  treePts.forEach(t => { t[4] = Math.floor(rnd() * KINDS[t[2]].length); });
  const SWAY = [[0.035, 2.0], [0.02, 1.2], [0.05, 2.4]];
  const barkMats = {}, leafMats = {};
  const barkMat = (kind, name) => barkMats[kind + name] || (barkMats[kind + name] = windy(new THREE.MeshStandardMaterial({ map: TT.bark[name][0], normalMap: TT.bark[name][1], normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.95, metalness: 0, envMapIntensity: 0.4 }), SWAY[kind][0], SWAY[kind][1]));
  const leafMat = (kind, tex) => leafMats[kind + tex.uuid] || (leafMats[kind + tex.uuid] = windy(new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), SWAY[kind][0], SWAY[kind][1], true));
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sc4 = new THREE.Vector3(), col4 = new THREE.Color();
  FX.treeTris = 0;
  FX.chunks = [];
  const NEAR_CELL = WB / 2, cellOf = (t, lod) => lod ? "s" + Math.floor((Math.atan2(t[1], t[0]) + Math.PI) / (Math.PI / 4)) : Math.floor((t[0] + WB) / NEAR_CELL) + "_" + Math.floor((t[1] + WB) / NEAR_CELL);
  KINDS.forEach((variants, si) => variants.forEach(([preset, seed, h, tex, barkName], vi) => {
    // far trees on the hills use only each species' first variant, at low detail
    [[treePts.slice(0, nearN).filter(t => t[2] === si && t[4] === vi), false], [vi ? [] : treePts.slice(nearN).filter(t => t[2] === si), true]].forEach(([pts, lod]) => {
      if (!pts.length) return;
      const tr = ezTree({ ...preset, seed }, h, lod), groups = {};
      pts.forEach(t => (groups[cellOf(t, lod)] = groups[cellOf(t, lod)] || []).push(t));
      Object.values(groups).forEach(g => {
        const bm = new THREE.InstancedMesh(tr.bark, barkMat(si, barkName), g.length), lm = new THREE.InstancedMesh(tr.leaves, leafMat(si, tex), g.length);
        bm.castShadow = lm.castShadow = false; bm.receiveShadow = lm.receiveShadow = true; lm.customDepthMaterial = depthMat(tex);
        FX.treeTris += (tr.bark.index.count + tr.leaves.index.count) / 3 * g.length;
        const c = new THREE.Vector3(); let rad = 0;
        g.forEach((t, i) => {
          const s = 0.82 + rnd() * 0.4; q4.setFromEuler(new THREE.Euler(0, rnd() * 6.283, 0)); m4.compose(V(t[0], t[3] || 0, t[1]), q4, sc4.set(s, s * (0.92 + rnd() * 0.16), s));
          const v = 0.88 + rnd() * 0.24; col4.setRGB(v * (0.94 + rnd() * 0.12), v, v * (0.88 + rnd() * 0.2));
          bm.setMatrixAt(i, m4); lm.setMatrixAt(i, m4); lm.setColorAt(i, col4); c.x += t[0]; c.y += (t[3] || 0) + h * 0.5; c.z += t[1];
          if (!t[3]) { CAMPUS.circles.push([t[0], t[1], 0.3 * s, "tree"]); blobs.push([t[0], t[1], 4.2 * s, 4.2 * s, 0]); }
        });
        c.divideScalar(g.length); g.forEach(t => { rad = Math.max(rad, Math.hypot(t[0] - c.x, t[1] - c.z)); });
        FX.chunks.push({ meshes: [bm, lm], sphere: new THREE.Sphere(c, rad + h * 0.9), far: lod });
        world.add(bm, lm);
      });
    });
  }));
}

// A mulched bed each side of a building's entrance, planted in two rows: laurels and hydrangeas against the wall, box,
// azaleas and copper-leaved shrubs in front. (ex, ez) is the entrance and ry the way it faces (as in buildings.js); each
// bed runs along the facade from `from` metres beside the door to `left` / `right` metres (the building's corners, less a
// little). Called while the buildings are built, so the trees placed afterwards keep clear of the beds.
function entranceBeds(ex, ez, ry, from, left, right) {
  const R = seeded(Math.round(ex * 31 + ez * 17) + 909), cs = Math.cos(ry), sn = Math.sin(ry), D0 = 0.14, D1 = 1.95;
  const at = (x, z) => [ex + x * cs + z * sn, ez - x * sn + z * cs];
  const put = (x, z, s, kind) => {
    const [wx, wz] = at(x, z), k = SHRUB_KINDS[kind];
    shrubs.push([wx, 0.02, wz, s, kind, R() * 6.283]); CAMPUS.circles.push([wx, wz, k.w * s * 0.42, "shrub"]); blobs.push([wx, wz, k.w * s * 1.6, k.w * s * 1.6, 0]);
  };
  const FRONT = ["azalea", "box", "copper", "box", "azalea", "box"];
  [[-1, left], [1, right]].forEach(([sd, end]) => {
    const len = end - from; if (len < 1.2) return;
    const x0 = Math.min(sd * from, sd * end), x1 = Math.max(sd * from, sd * end), a = at(x0, D0), b = at(x1, D1);
    CAMPUS.mulch.push({ ex, ez, ry, x0, x1, z0: D0, z1: D1, box: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])] });
    const nb = Math.max(1, Math.round((len - 0.5) / 1.3)), nf = Math.max(1, Math.round((len - 0.3) / 1.0));
    for (let i = 0; i < nb; i++) put(sd * (end - 0.65 - i * (len - 1.3) / Math.max(1, nb - 1)), 0.66, 0.88 + R() * 0.15, i % 2 ? "hydrangea" : "laurel");
    for (let i = 0; i < nf; i++) put(sd * (from + 0.5 + i * (len - 1.0) / Math.max(1, nf - 1) + (R() - 0.5) * 0.12), 1.38, 0.82 + R() * 0.16, FRONT[i % FRONT.length]);
  });
}

// the shrubs (one instanced core and one instanced coat of cards per kind), the mulch beds, the planters' flowers and the hedge
function buildShrubsAndHedge() {
  const K = shrubArt(), R = seeded(31337), c = new THREE.Color(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const byKind = {};
  shrubs.forEach(s => (byKind[s[4]] = byKind[s[4]] || []).push(s));
  Object.keys(byKind).forEach(name => {
    const pts = byKind[name], geo = shrubGeos(SHRUB_KINDS[name], R);
    const cm = new THREE.InstancedMesh(geo.core, K.coreMat, pts.length), lm = new THREE.InstancedMesh(geo.cards, K.cardMat, pts.length);
    pts.forEach(([x, y, z, s, , rot], i) => {
      tmp.compose(V(x, y, z), q.setFromEuler(e.set(0, rot, 0)), V(s * (0.92 + R() * 0.16), s * (0.9 + R() * 0.2), s * (0.92 + R() * 0.16)));
      cm.setMatrixAt(i, tmp); lm.setMatrixAt(i, tmp);
      const v = 0.9 + R() * 0.2; c.setRGB(v * (0.95 + R() * 0.1), v, v * (0.92 + R() * 0.12)); cm.setColorAt(i, c); lm.setColorAt(i, c);
    });
    cm.castShadow = cm.receiveShadow = lm.castShadow = lm.receiveShadow = true; lm.customDepthMaterial = depthMat(K.atlas);
    world.add(cm, lm);
  });
  // the beds: mulch mounded a little in the middle, a low stone edging round the three open sides
  const mulchM = new THREE.MeshStandardMaterial({ map: K.mulch, normalMap: K.mulchN, roughness: 0.95 }), edgeM = mat(0xc9c2b5, { roughness: 0.85 });
  CAMPUS.mulch.forEach(b => {
    const g = new THREE.Group(); g.position.set(b.ex, 0, b.ez); g.rotation.y = b.ry; world.add(g);
    const w = b.x1 - b.x0, dd = b.z1 - b.z0, geo = new THREE.PlaneGeometry(w, dd, Math.ceil(w / 0.4), 5).rotateX(-Math.PI / 2), P = geo.attributes.position, U = geo.attributes.uv;
    for (let i = 0; i < P.count; i++) {
      const u = P.getX(i) / w + 0.5, v = P.getZ(i) / dd + 0.5, m = Math.sqrt(Math.max(0, Math.sin(Math.PI * u))) * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.min(1, v * 1.15))));
      P.setY(i, 0.024 + 0.045 * m); U.setXY(i, (P.getX(i) + b.x0) / 1.1, P.getZ(i) / 1.1);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mulchM); m.position.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); m.receiveShadow = true; g.add(m);
    box(w + 0.16, 0.085, 0.08, edgeM, (b.x0 + b.x1) / 2, 0.042, b.z1 + 0.04, g);
    [b.x0 - 0.04, b.x1 + 0.04].forEach(x => box(0.08, 0.085, dd, edgeM, x, 0.042, (b.z0 + b.z1) / 2, g));
  });
  // the planters' flowers: a few small blooms on short stems, coloured per planter
  if (blooms.length) {
    const G = newCards(), white = new THREE.Color(1, 1, 1), f = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; f.set(Math.cos(a) * 0.55, 0.85, Math.sin(a) * 0.55).normalize(); n.copy(f).add(UP).normalize(); addCard(G, V(Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035), f, a * 3, 0.13, 2, n, white); }
    const fm = new THREE.InstancedMesh(cardGeo(G), K.cardMat, blooms.length);
    blooms.forEach(([x, y, z, hex], i) => { const s = 0.85 + R() * 0.3; tmp.compose(V(x, y, z), q.setFromEuler(e.set(0, R() * 6.283, 0)), V(s, s, s)); fm.setMatrixAt(i, tmp); fm.setColorAt(i, c.setHex(hex)); });
    fm.castShadow = fm.receiveShadow = true; fm.customDepthMaterial = depthMat(K.atlas); world.add(fm);
  }
  buildHedge(K);
}

// The hedge round the campus: a clipped hedge 1.6 m tall and 1.6 m thick, swept along a square with rounded corners
// (half size WB), its sides gently lumpy and its top wandering a little, with leaf cards over its skin.
function buildHedge(K) {
  const R = seeded(5151), RC = 1.6, HS = WB - RC, step = COARSE ? 0.4 : 0.26, line = [];
  const run = (x0, z0, x1, z1, nx, nz) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / step); for (let i = 0; i < n; i++) line.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, nx, nz]); };
  const turn = (cx, cz, a0) => { const n = Math.round(RC * Math.PI / 2 / step); for (let i = 0; i < n; i++) { const a = a0 + Math.PI / 2 * i / n; line.push([cx + Math.cos(a) * RC, cz + Math.sin(a) * RC, Math.cos(a), Math.sin(a)]); } };
  run(WB, -HS, WB, HS, 1, 0); turn(HS, HS, 0); run(HS, WB, -HS, WB, 0, 1); turn(-HS, HS, Math.PI / 2);
  run(-WB, HS, -WB, -HS, -1, 0); turn(-HS, -HS, Math.PI); run(-HS, -WB, HS, -WB, 0, -1); turn(HS, -HS, Math.PI * 1.5);
  line.push(line[0]);   // the loop ends on a copy of its first ring
  // cross-section from the campus side, over the top, to the outside: [offset outward, height]
  const PROF = [[-0.8, -0.06], [-0.79, 0.25], [-0.76, 0.7], [-0.72, 1.1], [-0.67, 1.34], [-0.57, 1.48], [-0.38, 1.56], [-0.13, 1.59], [0.13, 1.59], [0.38, 1.56], [0.57, 1.48], [0.67, 1.34], [0.72, 1.1], [0.76, 0.7], [0.79, 0.25], [0.8, -0.06]];
  const M = PROF.length, N = line.length, PN = PROF.map((_, j) => { const a = PROF[Math.max(0, j - 1)], b = PROF[Math.min(M - 1, j + 1)], tn = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tn, ty); return [-ty / l, tn / l]; });
  const along = [0]; for (let i = 1; i < N; i++) along.push(along[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const uLen = along[N - 1] / Math.round(along[N - 1] / 0.7);   // a whole number of texture repeats round the loop, so the seam doesn't show
  const pos = new Float32Array(N * M * 3), uv = new Float32Array(N * M * 2), col = new Float32Array(N * M * 3), base = [0.2, 0.39, 0.1];
  line.forEach(([x, z, nx, nz], i) => {
    const lift = (fbm(x * 0.09 + 3, 0, z * 0.09, 2) - 0.37) * 0.16, hue = 0.85 + fbm(x * 0.05, 1, z * 0.05, 2) * 0.35;
    let pv = 0;
    PROF.forEach(([n, y], j) => {
      if (j) pv += Math.hypot(n - PROF[j - 1][0], y - PROF[j - 1][1]);
      const [qn, qy] = PN[j], yy = y > 0.8 ? y + lift * (y - 0.8) / 0.8 : y, wx = x + nx * n, wz = z + nz * n;
      const b = ((fbm(wx * 0.75, yy * 0.75, wz * 0.75, 3) - 0.44) * 0.3 + (fbm(wx * 2.7 + 9, yy * 2.7, wz * 2.7, 2) - 0.37) * 0.1) * (y < 0 ? 0.3 : 1);
      const k = i * M + j, ao = 0.5 + 0.5 * THREE.MathUtils.smoothstep(y, -0.05, 0.9), lit = ao * hue * (1 + b * 2.2), top = THREE.MathUtils.smoothstep(y, 1.35, 1.58) * 0.25;
      pos.set([wx + nx * qn * b, yy + qy * b, wz + nz * qn * b], k * 3); uv.set([along[i] / uLen, pv / 0.7], k * 2);
      col.set([base[0] * lit * (1 + top * 0.6), base[1] * lit * (1 + top * 0.3), base[2] * lit], k * 3);
    });
  });
  const ix = []; for (let i = 0; i < N - 1; i++) for (let j = 0; j < M - 1; j++) { const a = i * M + j, b = a + M; ix.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setIndex(ix); geo.computeVertexNormals();
  const NR = geo.attributes.normal, t3 = new THREE.Vector3();
  for (let j = 0; j < M; j++) { const a = j, b = (N - 1) * M + j; t3.set(NR.getX(a) + NR.getX(b), NR.getY(a) + NR.getY(b), NR.getZ(a) + NR.getZ(b)).normalize(); NR.setXYZ(a, t3.x, t3.y, t3.z); NR.setXYZ(b, t3.x, t3.y, t3.z); }
  const hm = new THREE.Mesh(geo, K.hedgeMat); hm.castShadow = hm.receiveShadow = true; hm.userData.keep = true; world.add(hm);
  // leaf cards over the skin, most on the top and the campus side (what you see), a few low down
  const W = [0.4, 1, 1, 1, 1.4, 1.7, 1.7, 1.7, 1.7, 1.4, 0.8, 0.6, 0.5, 0.4, 0.2], wsum = W.reduce((a, b) => a + b, 0);
  const G = newCards(), p = new THREE.Vector3(), n = new THREE.Vector3(), f = new THREE.Vector3(), cc = new THREE.Color(), CP = geo.attributes.position, CC = geo.attributes.color;
  const mix = (A, a, b, s, t, out) => out.set(   // bilinear point inside quad (a, a + 1, b, b + 1) of attribute A
    (A.getX(a) * (1 - t) + A.getX(a + 1) * t) * (1 - s) + (A.getX(b) * (1 - t) + A.getX(b + 1) * t) * s,
    (A.getY(a) * (1 - t) + A.getY(a + 1) * t) * (1 - s) + (A.getY(b) * (1 - t) + A.getY(b + 1) * t) * s,
    (A.getZ(a) * (1 - t) + A.getZ(a + 1) * t) * (1 - s) + (A.getZ(b) * (1 - t) + A.getZ(b + 1) * t) * s);
  const per = COARSE ? 3 : 6;
  for (let i = 0; i < N - 1; i++) for (let k = 0; k < per; k++) {
    let r = R() * wsum, j = 0; while (j < M - 2 && (r -= W[j]) > 0) j++;
    const a = i * M + j, b = a + M, s = R(), t = R();
    mix(CP, a, b, s, t, p); mix(NR, a, b, s, t, n).normalize(); mix(CC, a, b, s, t, _e3);
    p.addScaledVector(n, 0.015 + R() * 0.05); f.copy(n).add(_e2.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).multiplyScalar(0.8)).normalize();
    const v = 0.85 + R() * 0.35; cc.setRGB(_e3.x * v, _e3.y * v, _e3.z * v);
    addCard(G, p, f, R() * 6.283, 0.26 + R() * 0.16, 0, n, cc);
  }
  const hc = new THREE.Mesh(cardGeo(G), K.hedgeCardMat); hc.receiveShadow = true; hc.userData.keep = true; world.add(hc);
}
