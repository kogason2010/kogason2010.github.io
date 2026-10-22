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

/* ---- leaf-card helpers (shrubs) and shadow materials for cut-out leaves ---- */
// a smooth, noise-lumped sphere (used for the shrubs' inner volume)
function lump(x, y, z, r, det, sy, seed) {
  const g = new THREE.IcosahedronGeometry(r, det), p = g.attributes.position, nrm = g.attributes.normal, d = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    d.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const k = 0.82 + fbm(d.x * 1.8 + seed, d.y * 1.8 + y, d.z * 1.8 + seed * 0.7, 3) * 0.4;
    p.setXYZ(i, d.x * r * k + x, d.y * r * k * sy + y, d.z * r * k + z); nrm.setXYZ(i, d.x, d.y, d.z);
  }
  return g;
}
// leaf cards scattered over clusters (the shrubs); normals lean outward so the bush lights as one volume
function cards(lumps, per, size, shade) {
  const cx = lumps.reduce((a, b) => a + b[0], 0) / lumps.length, cy = lumps.reduce((a, b) => a + b[1], 0) / lumps.length, cz = lumps.reduce((a, b) => a + b[2], 0) / lumps.length;
  const pos = [], nor = [], uv = [], col = [], q = new THREE.Quaternion(), e = new THREE.Euler(), d = new THREE.Vector3(), o = new THREE.Vector3(), c = new THREE.Color();
  const corners = [[-0.5, -0.5, 0, 0], [0.5, -0.5, 1, 0], [0.5, 0.5, 1, 1], [-0.5, -0.5, 0, 0], [0.5, 0.5, 1, 1], [-0.5, 0.5, 0, 1]];
  lumps.forEach(([bx, by, bz, r]) => {
    for (let k = 0; k < per; k++) {
      d.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1); if (d.lengthSq() < 0.01) d.set(0, 1, 0); d.normalize();
      const px = bx + d.x * r * (0.78 + rnd() * 0.3), py = by + d.y * r * (0.78 + rnd() * 0.3), pz = bz + d.z * r * (0.78 + rnd() * 0.3), s = size * (0.7 + rnd() * 0.6);
      o.set(px - cx, (py - cy) * 1.4, pz - cz).normalize().multiplyScalar(0.6).addScaledVector(d, 0.4).normalize();
      q.setFromEuler(e.set(rnd() * 6.283, rnd() * 6.283, rnd() * 6.283)); shade(px, py, pz, o, c);
      corners.forEach(([u, v, tu, tv]) => { const w = new THREE.Vector3(u * s, v * s, 0).applyQuaternion(q); pos.push(px + w.x, py + w.y, pz + w.z); nor.push(o.x, o.y, o.z); uv.push(tu, tv); col.push(c.r, c.g, c.b); });
    }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const leafShade = (lo, hi) => (x, y, z, o, c) => { const k = THREE.MathUtils.clamp(o.y * 0.5 + 0.5, 0, 1) * 0.7 + rnd() * 0.3; c.setRGB(lo[0] + (hi[0] - lo[0]) * k, lo[1] + (hi[1] - lo[1]) * k, lo[2] + (hi[2] - lo[2]) * k); };
const depthMats = {};
const depthMat = tex => depthMats[tex.uuid] || (depthMats[tex.uuid] = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide }));

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

// shrubs by the entrances and the hedge round the campus
function buildShrubsAndHedge() {
  const leafTex = treeTextures().ash;
  /* ---- shrubs, hedge, lamps ---- */
  const BL = [[0, 0.1, 0, 0.6], [0.35, 0, 0.1, 0.42], [-0.3, 0.02, -0.15, 0.45]];
  const bushBlob = paint(mergeGeos(BL.map(([x, y, z, r], i) => lump(x, y, z, r * 0.85, 1, 0.8, i + 20))), (x, y, z, c) => c.setRGB(0.05 + y * 0.05, 0.11 + y * 0.08, 0.03));
  const bushCards = cards(BL, 26, 0.5, leafShade([0.42, 0.5, 0.36], [0.95, 1.0, 0.9]));
  const shrubMat = windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 0.03, -0.2), shrubCardMat = windy(new THREE.MeshLambertMaterial({ vertexColors: true, map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide }), 0.03, -0.2, true);
  const sh = new THREE.InstancedMesh(bushBlob, shrubMat, shrubs.length), shc = new THREE.InstancedMesh(bushCards, shrubCardMat, shrubs.length);
  shrubs.forEach(([x, z, s], i) => { tmp.compose(V(x, s * 0.45, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i, 0)), V(s * 1.3, s * 0.9, s * 1.2)); sh.setMatrixAt(i, tmp); shc.setMatrixAt(i, tmp); });
  sh.castShadow = sh.receiveShadow = shc.castShadow = shc.receiveShadow = true; shc.customDepthMaterial = depthMat(leafTex); world.add(sh, shc);
  const hc = canvasOf(256, 128), hh = canvasOf(256, 128), hcg = hc.getContext("2d"), hhg = hh.getContext("2d");
  hcg.fillStyle = "#3f6b33"; hcg.fillRect(0, 0, 256, 128); hhg.fillStyle = "#606060"; hhg.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 2200; i++) { const x = Math.random() * 256, y = Math.random() * 128, r = 2 + Math.random() * 4, k = Math.random(); hcg.fillStyle = k < 0.4 ? "#2f5627" : k < 0.8 ? "#4f823d" : "#6b9a4a"; hcg.beginPath(); hcg.ellipse(x, y, r, r * 0.6, Math.random() * 3, 0, 7); hcg.fill(); hhg.fillStyle = k < 0.4 ? "#404040" : "#a0a0a0"; hhg.beginPath(); hhg.ellipse(x, y, r, r * 0.6, 0, 0, 7); hhg.fill(); }
  const hedgeMap = new THREE.CanvasTexture(hc); hedgeMap.encoding = THREE.sRGBEncoding; hedgeMap.wrapS = hedgeMap.wrapT = THREE.RepeatWrapping; const hedgeN = normalFrom(hh, 6);
  [[0, -WB, WB * 2, 1.5], [0, WB, WB * 2, 1.5], [-WB, 0, 1.5, WB * 2], [WB, 0, 1.5, WB * 2]].forEach(([x, z, w, d]) => {
    const L = Math.max(w, d), set = { map: hedgeMap.clone(), normalMap: hedgeN.clone() }; set.map.needsUpdate = set.normalMap.needsUpdate = true; set.map.repeat.set(L / 2.5, 1); set.normalMap.repeat.set(L / 2.5, 1);
    const hm = new THREE.Mesh(new THREE.BoxGeometry(w, 1.45, d), new THREE.MeshStandardMaterial({ ...set, roughness: 0.92 })); hm.position.set(x, 0.72, z); hm.castShadow = hm.receiveShadow = true; world.add(hm);
  });
}
