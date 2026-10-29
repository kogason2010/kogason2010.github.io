/* js/campus/park.js — Life on the lawns: a physic garden (medicinal plants, each labelled with the compound it gives us),
   benches along the paths, and people walking between the buildings.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// a park bench: slatted seat and back on iron ends (as round the plaza), facing +z in its own frame
function parkBench(x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.add(g);
  const wood = mat(0x8a5f3c, { roughness: 0.62 }), iron = mat(0x2a3034, { roughness: 0.4, metalness: 0.6 });
  [-0.19, -0.065, 0.06].forEach(dz => box(1.72, 0.045, 0.11, wood, 0, 0.46, dz, g));
  [0.6, 0.75].forEach(y => box(1.72, 0.1, 0.04, wood, 0, y, -0.2, g));
  [-0.74, 0.74].forEach(dx => { box(0.05, 0.46, 0.44, iron, dx, 0.23, -0.04, g); box(0.05, 0.45, 0.05, iron, dx, 0.67, -0.21, g); box(0.05, 0.04, 0.4, iron, dx, 0.66, -0.02, g); });
  blobs.push([x, z, 2.2, 1.0, ry]); [-0.5, 0.5].forEach(s => CAMPUS.circles.push([x + Math.cos(ry) * s, z - Math.sin(ry) * s, 0.42, "bench"]));
  return g;
}

/* ---- the physic garden, between the Kogason Lab and NCA, turned to face the plaza; a path leads in from it ---- */
const GARDEN = { x: 20, z: -20, half: 5, ry: -Math.PI / 4 };
function buildGarden() {
  const R = seeded(2718), G = GARDEN, g = new THREE.Group(); g.position.set(G.x, 0, G.z); g.rotation.y = G.ry; world.add(g);
  const cs = Math.cos(G.ry), sn = Math.sin(G.ry), at = (lx, lz) => [G.x + lx * cs + lz * sn, G.z - lx * sn + lz * cs];
  CAMPUS.gardens.push([G.x, G.z, G.half * 1.45]);
  // pale gravel underfoot
  const gravel = ctex(256, 256, (c, w) => { c.fillStyle = "#cfc6b4"; c.fillRect(0, 0, w, w); for (let i = 0; i < 5000; i++) { const v = 150 + R() * 90 | 0; c.fillStyle = `rgb(${v},${v - 6},${v - 18})`; c.fillRect(R() * w, R() * w, 2, 2); } });
  gravel.repeat.set(5, 5);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(G.half * 2, G.half * 2), new THREE.MeshStandardMaterial({ map: gravel, roughness: 0.95 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.013; fl.receiveShadow = true; g.add(fl);
  // boxwood balls along the edge, a gap facing the plaza (+z)
  const H = G.half - 0.3;
  for (let s = -H; s <= H + 0.01; s += 0.5) [[s, -H], [s, H], [-H, s], [H, s]].forEach(([lx, lz]) => {
    if (lz === H && Math.abs(lx) < 1.1) return;
    const [wx, wz] = at(lx, lz); shrubs.push([wx, 0.01, wz, 0.62 + R() * 0.08, "box", R() * 6.283]); CAMPUS.circles.push([wx, wz, 0.32, "shrub"]);
  });
  // four raised beds, each a medicinal plant with the compound it gives
  const BEDS = [["Willow", "salicin, the root of aspirin", 0xf2f0ea], ["Foxglove", "digoxin", 0xc66bd6], ["Peppermint", "menthol", 0xffffff], ["Lavender", "linalool", 0x9b7bff]];
  const timber = mat(0x6e4e32, { roughness: 0.85 }), soil = mat(0x3d2c20, { roughness: 1 });
  [[-2.1, -1.9], [2.1, -1.9], [-2.1, 1.9], [2.1, 1.9]].forEach(([bx, bz], i) => {
    [[0, -0.78, 3.0, 0.08], [0, 0.78, 3.0, 0.08], [-1.46, 0, 0.08, 1.64], [1.46, 0, 0.08, 1.64]].forEach(([dx, dz, w, d]) => box(w, 0.4, d, timber, bx + dx, 0.2, bz + dz, g));
    box(2.86, 0.02, 1.5, soil, bx, 0.37, bz, g);
    for (let k = 0; k < 7; k++) { const lx = bx - 1.15 + (k + R() * 0.4) * 0.34, lz = bz + (R() - 0.5) * 0.8, [wx, wz] = at(lx, lz); shrubs.push([wx, 0.37, wz, 0.85 + R() * 0.3, "bedding", R() * 6.283]); }
    for (let k = 0; k < 34; k++) { const [wx, wz] = at(bx + (R() - 0.5) * 2.7, bz + (R() - 0.5) * 1.3); blooms.push([wx, 0.58 + R() * 0.06, wz, BEDS[i][2]]); }
    // a stake label at the bed's corner nearest the middle
    const lab = ctex(256, 96, (c, w, h) => { c.fillStyle = "#f4efe2"; c.fillRect(0, 0, w, h); c.fillStyle = "#2f4a33"; c.font = "700 34px Georgia, serif"; c.fillText(BEDS[i][0], 14, 42); c.font = "italic 22px Georgia, serif"; c.fillStyle = "#5a4a32"; c.fillText("→ " + BEDS[i][1], 14, 76); });
    const sx = bx - Math.sign(bx) * 1.35, sz = bz - Math.sign(bz) * 0.95;
    cyl(0.02, 0.02, 0.5, timber, sx, 0.25, sz, g, 6);
    const sg = plane(0.42, 0.16, new THREE.MeshStandardMaterial({ map: lab, roughness: 0.7, side: THREE.DoubleSide }), sx, 0.52, sz, Math.atan2(-sx, -sz), g); sg.rotation.x = -0.35;
    const [cx, cz] = at(bx, bz); CAMPUS.circles.push([cx, cz, 1.0, "bed"]);
  });
  // a sundial in the middle
  const stone = mat(0xd8d0c0, { roughness: 0.7 }), brass = mat(0xc9a14a, { roughness: 0.3, metalness: 0.85 });
  cyl(0.42, 0.48, 0.12, stone, 0, 0.06, 0, g, 24); cyl(0.2, 0.26, 0.8, stone, 0, 0.52, 0, g, 18); cyl(0.32, 0.3, 0.06, stone, 0, 0.95, 0, g, 24); cyl(0.27, 0.27, 0.015, brass, 0, 0.985, 0, g, 32);
  const gn = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.18, 0), new THREE.Vector2(0.16, 0), new THREE.Vector2(-0.18, 0.2)]), { depth: 0.012, bevelEnabled: false }), brass);
  gn.position.set(0, 0.99, -0.006); gn.castShadow = true; g.add(gn);
  { const [wx, wz] = at(0, 0); CAMPUS.circles.push([wx, wz, 0.5, "sculpture"]); }
  // a pergola at the back with a bench under it, roses climbing its posts
  const oak = mat(0x7a5a3c, { roughness: 0.8 });
  [[-1.6, -4.55], [1.6, -4.55], [-1.6, -3.35], [1.6, -3.35]].forEach(([px, pz]) => { box(0.12, 2.4, 0.12, oak, px, 1.2, pz, g); const [wx, wz] = at(px, pz); shrubs.push([wx, 0.01, wz, 0.5, "azalea", R() * 6.283]); });
  [-4.55, -3.35].forEach(pz => box(3.7, 0.16, 0.08, oak, 0, 2.36, pz, g));
  for (let x = -1.8; x <= 1.81; x += 0.3) box(0.06, 0.1, 1.6, oak, x, 2.49, -3.95, g);
  const [bwx, bwz] = at(0, -4.1); parkBench(bwx, bwz, G.ry);
  blobs.push([G.x, G.z, 9, 9, G.ry]);
}

/* ---- benches beside the main paths, facing them, clear of lamps, beds and the plaza ---- */
function buildBenches() {
  const R = seeded(1618);
  CAMPUS.paths.forEach((p, i) => {
    const L = Math.hypot(p[2] - p[0], p[3] - p[1]), ux = (p[2] - p[0]) / L, uz = (p[3] - p[1]) / L;
    [0.38, 0.72].forEach((f, k) => {
      if (L < 9) return;
      const sd = (i + k) % 2 ? 1 : -1, off = p[4] / 2 + 1.05, x = p[0] + ux * L * f - uz * sd * off, z = p[1] + uz * L * f + ux * sd * off;
      if (hitAt(x, z, 1.2) || Math.hypot(x, z) < 13 || CAMPUS.lots.some(l => x > l[0] - 1 && x < l[2] + 1 && z > l[1] - 1 && z < l[3] + 1)) return;
      parkBench(x, z, Math.atan2(uz * sd, -ux * sd) + (R() - 0.5) * 0.04);   // its front (+z) toward the path
    });
  });
}

/* ---- people: walking the paths between the plaza and the buildings, pausing to turn round (and for the robot) ---- */
function buildPeople() {
  const R = seeded(31415), skins = [0xf1c9a5, 0xd9a47a, 0xa86b45, 0x6b4428, 0xe8b894], hairs = [0x2a1d14, 0x5a3a20, 0xc9a25a, 0x1a1a1a, 0x8a4b2a];
  const shirts = [0x2f6fb5, 0xc23a3a, 0x3a7d44, 0xf2c230, 0x6b4f9b, 0xe9eef0, 0x24493c], trousers = [0x2b3136, 0x3a4a6b, 0x5a4a3a, 0x1f2428];
  const routes = CAMPUS.paths.filter(p => Math.hypot(p[2] - p[0], p[3] - p[1]) > 8);
  FX.people = Array.from({ length: LIGHT ? 4 : 8 }, (_, i) => {
    const g = new THREE.Group(), pick = a => a[(R() * a.length) | 0], s = 0.92 + R() * 0.14, keep = o => { o.userData.keep = true; return o; };
    const skin = mat(pick(skins), { roughness: 0.7 }), shirt = mat(pick(shirts), { roughness: 0.8 }), legM = mat(pick(trousers), { roughness: 0.8 }), shoe = mat(0x1d2124, { roughness: 0.6 });
    const limb = (m, r, len, x, y) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); g.add(pv); const c = keep(cyl(r, r * 0.85, len, m, 0, -len / 2, 0, pv, 8)); c.castShadow = true; return pv; };
    const legs = [-0.09, 0.09].map(x => { const l = limb(legM, 0.07, 0.82, x, 0.86); keep(box(0.1, 0.06, 0.2, shoe, 0, -0.83, 0.04, l)); return l; });
    const torso = keep(cyl(0.17, 0.15, 0.62, shirt, 0, 1.17, 0, g, 12)); torso.scale.z = 0.7; torso.castShadow = true;
    const arms = [-0.22, 0.22].map(x => limb(shirt, 0.05, 0.6, x, 1.44));
    keep(cyl(0.05, 0.05, 0.08, skin, 0, 1.52, 0, g, 8));
    const head = keep(new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), skin)); head.position.y = 1.66; head.castShadow = true; g.add(head);
    const hair = keep(new THREE.Mesh(new THREE.SphereGeometry(0.118, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(pick(hairs), { roughness: 0.9 }))); hair.position.set(0, 1.67, -0.01); g.add(hair);
    if (R() < 0.45) keep(box(0.26, 0.32, 0.12, mat(pick([0x24493c, 0x7a2430, 0x2b3136]), { roughness: 0.8 }), 0, 1.2, -0.17, g));   // a backpack
    g.scale.setScalar(s); world.add(g);
    const p = routes[i % routes.length], L = Math.hypot(p[2] - p[0], p[3] - p[1]);
    g.userData = { p, L, d: R() * L, dir: R() < 0.5 ? 1 : -1, lane: (R() - 0.5) * p[4] * 0.5, sp: 1.05 + R() * 0.35, pause: 0, ph: R() * 6.283, legs, arms };
    return g;
  });
}
function updatePeople(dt, time) {
  (FX.people || []).forEach(g => {
    const u = g.userData, p = u.p, ux = (p[2] - p[0]) / u.L, uz = (p[3] - p[1]) / u.L;
    let x = p[0] + ux * u.d - uz * u.lane, z = p[1] + uz * u.d + ux * u.lane;
    const blocked = Math.hypot(x + ux * u.dir * 0.9 - DRV.x, z + uz * u.dir * 0.9 - DRV.z) < 1.0 && DRV.y < 1.2;   // the robot is in the way
    let walking = !blocked;
    if (u.pause > 0) { u.pause -= dt; walking = false; }
    else if (walking) { u.d += u.dir * u.sp * dt; if (u.d < 0.5 || u.d > u.L - 0.5) { u.d = Math.max(0.5, Math.min(u.L - 0.5, u.d)); u.dir *= -1; u.pause = 1 + Math.random() * 3; } }
    x = p[0] + ux * u.d - uz * u.lane; z = p[1] + uz * u.d + ux * u.lane;
    g.position.set(x, 0, z); g.rotation.y = Math.atan2(ux * u.dir, uz * u.dir);
    const sw = walking ? Math.sin(time * u.sp * 5.2 + u.ph) * 0.5 : 0;
    u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw; u.arms[0].rotation.x = -sw * 0.8; u.arms[1].rotation.x = sw * 0.8;
    g.position.y = walking ? Math.abs(Math.cos(time * u.sp * 5.2 + u.ph)) * 0.025 : 0;
  });
}
