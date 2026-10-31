/* js/library/life.js — The reading room in use. Robots read at the desks (turning a page now and then, glancing up, and
   watching the shelving drone go over), a librarian bot works the central desk (stamping books, filing cards, looking
   out over the room), a roller bot browses the alcoves with its tablet, and a drone flies books up to the gallery shelves.
   The desks have open books, stacks and notes on them; there are book trucks by the alcoves, tall lamp standards and
   banker's lamps round the central desk, a runner from the doors, and an armillary sphere and a celestial globe by the aisle.
   The robots are the campus ones (bots.js). Light graphics shows fewer of them.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const LIBLIFE = { built: false, live: [], spin: [], readers: [], drone: null, librarian: null, browser: null, glowM: null };
const LIB_BOOK_COLS = [0x7a2430, 0x2f4a33, 0x5a3a24, 0x23344f, 0x6b4a1e, 0x8a5a2c, 0x3d2f5a, 0x2f5a5a, 0x9a7a3a, 0x4a1e1e, 0xd8cfb8];

// merge geometries that carry uvs (mergeGeos drops them)
function libMergeUV(list) {
  const parts = list.map(g => (g.index ? g.toNonIndexed() : g)), n = parts.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  parts.forEach(g => { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += c; });
  const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(pos, 3)); m.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); m.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return m;
}
// a two-page spread: text, a heading, and a chromatogram figure; shaded into the gutter
function libPageTex() {
  const R = seeded(404);
  return tex((g, w, h) => {
    g.fillStyle = "#f3ead6"; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(w / 2 - 46, 0, w / 2 + 46, 0); gr.addColorStop(0, "rgba(120,90,50,0)"); gr.addColorStop(0.5, "rgba(110,80,45,0.42)"); gr.addColorStop(1, "rgba(120,90,50,0)");
    g.fillStyle = gr; g.fillRect(w / 2 - 46, 0, 92, h);
    const lines = (x0, x1, y0, y1) => { for (let y = y0; y < y1; y += 11) { let x = x0; const end = R() < 0.12 ? x0 + (x1 - x0) * (0.3 + R() * 0.5) : x1; while (x < end - 14) { const ww = Math.min(10 + R() * 34, end - x); g.fillStyle = "rgba(58,46,34,0.55)"; g.fillRect(x, y, ww, 4); x += ww + 5; } } };
    g.fillStyle = "rgba(60,40,30,0.85)"; g.fillRect(40, 34, 130, 10);
    lines(40, w / 2 - 34, 62, h - 30);
    const fx = w / 2 + 34, fw = w / 2 - 74;
    g.strokeStyle = "rgba(58,46,34,0.6)"; g.lineWidth = 1.5; g.strokeRect(fx, 30, fw, 112);
    g.strokeStyle = "rgba(40,60,110,0.85)"; g.lineWidth = 2; g.beginPath();
    for (let x = 0; x <= fw - 12; x++) {
      const t = x / (fw - 12); let y = 134;
      [[0.18, 55, 0.012], [0.33, 88, 0.014], [0.41, 36, 0.012], [0.62, 72, 0.018], [0.78, 28, 0.016], [0.86, 50, 0.013]].forEach(([c, a, s]) => { y -= a * Math.exp(-((t - c) ** 2) / (2 * s * s)); });
      if (x) g.lineTo(fx + 6 + x, y); else g.moveTo(fx + 6 + x, y);
    }
    g.stroke();
    lines(fx, w - 40, 160, h - 30);
  }, 512, 352);
}
// an open book lying on its back: the spread bowing up from the gutter, the page block's edges, the cover beneath
function libOpenBookGeo() {
  const W = 0.21, D = 0.29, y = x => { const u = Math.min(1, Math.abs(x) / W); return 0.01 + 0.012 * Math.min(1, u * 6) + 0.02 * Math.sin(Math.PI * Math.sqrt(u)) * (1 - 0.4 * u); };
  const pg = new THREE.PlaneGeometry(W * 2, D, 24, 1); pg.rotateX(-Math.PI / 2);
  const P = pg.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, y(P.getX(i))); pg.computeVertexNormals();
  const sh = new THREE.Shape(); sh.moveTo(-W, 0.008); for (let k = 0; k <= 24; k++) { const x = -W + k / 24 * W * 2; sh.lineTo(x, y(x)); } sh.lineTo(W, 0.008); sh.lineTo(-W, 0.008);
  const fr = new THREE.ShapeGeometry(sh).translate(0, 0, D / 2), bk = new THREE.ShapeGeometry(sh).rotateY(Math.PI).translate(0, 0, -D / 2);
  const ed = [-1, 1].map(s => new THREE.PlaneGeometry(D, 0.014).rotateY(s * Math.PI / 2).translate(s * W, 0.015, 0));
  [fr, bk, ...ed].forEach(g => { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, 0.03, 0.04); });   // the paper colour in the page's margin
  return libMergeUV([pg, fr, bk, ...ed]);
}

function buildLibraryLife() {
  const R = seeded(1123), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const at = (x, y, z, ry, sx, sy, sz) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(sx || 1, sy || 1, sz || 1));
  const oakM = mat(0x6e4627, { roughness: 0.5 }), darkOak = mat(0x4a2e1a, { roughness: 0.55 }), goldM = mat(0xc9a14a, { roughness: 0.32, metalness: 0.75 }), ironM = mat(0x2a2622, { roughness: 0.5, metalness: 0.4 });
  const pageTex = libPageTex(), paperM = new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.85 });
  const open = [], closed = [], papers = [], pencils = [], TOP = 0.835;
  const bookCol = () => LIB_BOOK_COLS[(R() * LIB_BOOK_COLS.length) | 0];
  // a stack of closed books, lying flat
  const stack = (x, z, y0, ry, n) => { let y = y0; for (let k = 0; k < n; k++) { const bh = 0.026 + R() * 0.024, bw = 0.15 + R() * 0.07, bd = 0.21 + R() * 0.07; closed.push({ m: at(x + (R() - 0.5) * 0.02, y + bh / 2, z + (R() - 0.5) * 0.02, ry + (R() - 0.5) * 0.4, bw, bh, bd), c: bookCol() }); y += bh; } };

  /* ---- who's reading where: a few seats, on different desks, spread round the room ---- */
  const seats = LIBFX.seats, nRead = LIGHT ? 2 : 4, chosen = [];
  for (let tries = 0; chosen.length < nRead && tries < 400; tries++) {
    const s = seats[(Math.random() * seats.length) | 0], sp = [s.d[0] * s.r, s.d[1] * s.r];
    if (chosen.some(c => Math.hypot(c.d[0] * c.r - sp[0], c.d[1] * c.r - sp[1]) < 5)) continue;
    chosen.push(s);
  }

  /* ---- things on the desks ---- */
  seats.forEach(s => {
    const cx = s.d[0] * s.r, cz = s.d[1] * s.r, ux = s.t[0] * s.sd, uz = s.t[1] * s.sd, face = Math.atan2(ux, uz), reader = chosen.includes(s), r = R();
    if (reader || r < 0.26) {   // an open book, the right way up for whoever sits here
      const bx = cx + ux * 0.27, bz = cz + uz * 0.27, ry = face + (reader ? 0 : (R() - 0.5) * 0.3);
      open.push({ m: at(bx, TOP, bz, ry), c: bookCol() });
      if (reader) s.book = { x: bx, z: bz, ry };
      if (!reader && R() < 0.4) stack(cx + ux * 0.2 + s.d[0] * 0.35, cz + uz * 0.2 + s.d[1] * 0.35, TOP, face, 1 + ((R() * 2) | 0));
    } else if (r < 0.48) stack(cx + ux * 0.24, cz + uz * 0.24, TOP, face, 1 + ((R() * 3) | 0));
    else if (r < 0.64) {   // notes, and a pencil
      const ry = face + (R() - 0.5) * 0.5, px = cx + ux * 0.25, pz = cz + uz * 0.25;
      papers.push(at(px, TOP + 0.002, pz, ry)); pencils.push(at(px + Math.cos(ry) * 0.11, TOP + 0.008, pz - Math.sin(ry) * 0.11, ry + 0.3 + R() * 0.4));
    }
  });
  // a pile in the middle of some desks, between the lamps
  for (let i = 0; i < seats.length; i += 4) if (R() < 0.35) { const s = seats[i], rr = s.r + 0.7; stack(s.d[0] * rr, s.d[1] * rr, TOP, Math.atan2(s.d[0], s.d[1]) + (R() - 0.5), 2 + ((R() * 3) | 0)); }
  // readers' chairs drawn up square to the desk
  chosen.forEach(s => { const cx = s.d[0] * s.r, cz = s.d[1] * s.r, h = Math.atan2(-s.t[0] * s.sd, -s.t[1] * s.sd); s.cx = cx + s.t[0] * s.sd * 0.8; s.cz = cz + s.t[1] * s.sd * 0.8; s.h = h; LIBFX.chairs.setMatrixAt(s.i, at(s.cx, 0, s.cz, h)); });
  LIBFX.chairs.instanceMatrix.needsUpdate = true;

  /* ---- the central desk: tall lamp standards round the dais, banker's lamps and returns on the counter, a bell ---- */
  const gCat = LIBFX.catalog;
  {
    const post = mergeGeos([
      new THREE.LatheGeometry([[0.12, 0], [0.12, 0.04], [0.08, 0.1], [0.045, 0.2], [0.032, 0.32], [0.028, 2.5], [0.05, 2.56], [0.028, 2.62], [0.028, 2.9]].map(p => new THREE.Vector2(p[0], p[1])), 14),
      new THREE.CylinderGeometry(0.016, 0.016, 0.5, 8).rotateZ(Math.PI / 2).translate(0, 2.74, 0),
      ...[-0.25, 0, 0.25].map(x => new THREE.CylinderGeometry(0.05, 0.025, 0.06, 12).translate(x, x ? 2.79 : 2.93, 0)),
      ...[-0.25, 0.25].map(x => new THREE.CylinderGeometry(0.014, 0.014, 0.06, 6).translate(x, 2.75, 0)),
    ]);
    const posts = new THREE.InstancedMesh(post, mat(0x5a4630, { metalness: 0.75, roughness: 0.32 }), 8);
    LIBLIFE.glowM = new THREE.MeshStandardMaterial({ color: 0xfff4de, emissive: 0xffd9a0, emissiveIntensity: 0.55, roughness: 0.3 });
    const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 16, 12), LIBLIFE.glowM, 24);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 + Math.PI / 8, x = Math.cos(a) * 4.8, z = Math.sin(a) * 4.8, ry = -a - Math.PI / 2;
      posts.setMatrixAt(k, at(x, 0.25, z, ry));
      [[-0.25, 2.88], [0, 3.02], [0.25, 2.88]].forEach(([lx, ly], j) => globes.setMatrixAt(k * 3 + j, at(x + Math.cos(ry) * lx, 0.25 + ly, z - Math.sin(ry) * lx, 0)));
    }
    posts.castShadow = true; posts.receiveShadow = true; gCat.add(posts, globes);
    // banker's lamps (the reading lamps' green glass) and piles of returns on the outer counter
    const base = new THREE.InstancedMesh(mergeGeos([new THREE.BoxGeometry(0.16, 0.025, 0.1).translate(0, 0.0125, 0), new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6).translate(0, 0.13, 0), new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6).rotateZ(Math.PI / 2).translate(0, 0.24, 0)]), goldM, 6);
    const shade = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).translate(0, 0.24, 0), LIBFX.lamps, 6);
    [0.75, 1.6, 2.5, -0.75, -1.6, -2.5].forEach((da, k) => {
      const ph = Math.PI + da, x = Math.sin(ph) * 4.43, z = Math.cos(ph) * 4.43, ry = ph;   // lying along the counter
      base.setMatrixAt(k, at(x, 1.31, z, ry)); shade.setMatrixAt(k, at(x, 1.31, z, ry));
      const sp = Math.PI + da + (da > 0 ? 0.28 : -0.28); stack(Math.sin(sp) * 4.43, Math.cos(sp) * 4.43, 1.31, sp, 2 + ((R() * 3) | 0));
    });
    base.castShadow = true; gCat.add(base, shade);
    { const bp = Math.PI + 0.42, bx = Math.sin(bp) * 4.43, bz = Math.cos(bp) * 4.43; cyl(0.045, 0.05, 0.012, darkOak, bx, 1.316, bz, gCat, 16); const bell = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), goldM); bell.position.set(bx, 1.322, bz); gCat.add(bell); cyl(0.006, 0.006, 0.02, goldM, bx, 1.37, bz, gCat, 6); }
  }

  /* ---- a runner from the doors to the central desk ---- */
  {
    const t = tex((g, w, h) => {
      g.fillStyle = "#6a1b21"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#8a2a2c"; for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(w / 2, y + 8); g.lineTo(w / 2 + 34, y + 32); g.lineTo(w / 2, y + 56); g.lineTo(w / 2 - 34, y + 32); g.closePath(); g.fill(); }
      g.fillStyle = "#c9a14a"; for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(w / 2, y + 22); g.lineTo(w / 2 + 10, y + 32); g.lineTo(w / 2, y + 42); g.lineTo(w / 2 - 10, y + 32); g.closePath(); g.fill(); }
      [[8, 6], [w - 14, 6], [20, 2], [w - 22, 2]].forEach(([x, ww]) => { g.fillStyle = "#c9a14a"; g.fillRect(x, 0, ww, h); });
      g.fillStyle = "#3e1014"; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
      for (let i = 0; i < 3000; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,220,200,0.05)"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    }, 128, 256);
    const L = 12.4; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, L / 1.7); t.anisotropy = 8;
    const run = new THREE.Mesh(new THREE.PlaneGeometry(1.7, L), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
    run.rotation.x = -Math.PI / 2; run.position.set(0, 0.016, -5.05 - L / 2); run.receiveShadow = true; library.add(run);
  }

  /* ---- book trucks by some of the alcoves, half full of books to put back ---- */
  [[1, 1], [3, -1], [5, 1], [7, -1]].forEach(([k, sd]) => {
    const u = new THREE.Group(); u.position.set(sd * 2.05, 0, -LIB.R + 0.72); u.rotation.y = (R() - 0.5) * 0.3; LIBFX.bays[k].add(u);
    [-0.43, 0.43].forEach(x => box(0.04, 0.96, 0.4, oakM, x, 0.56, 0, u));
    [0.2, 0.52, 0.84].forEach(y => box(0.84, 0.025, 0.38, oakM, 0, y, 0, u));
    [[-0.36, -0.14], [0.36, -0.14], [-0.36, 0.14], [0.36, 0.14]].forEach(([x, z]) => { cyl(0.035, 0.035, 0.025, ironM, x, 0.04, z, u, 10).rotation.z = Math.PI / 2; });
    library.updateMatrixWorld(true);
    [0.2, 0.52, 0.84].forEach((y, row) => {
      let x = -0.4; const end = 0.4 - R() * (row === 2 ? 0.45 : 0.25);
      while (x < end) {
        const bw = 0.03 + R() * 0.025, bh = 0.17 + R() * 0.09, bd = 0.14 + R() * 0.07, lean = x + bw > end - 0.06 ? 0.35 : 0;
        closed.push({ m: new THREE.Matrix4().multiplyMatrices(u.matrixWorld, new THREE.Matrix4().compose(V(x + bw / 2 + lean * 0.12, y + 0.0125 + bh / 2 - lean * 0.02, 0.18 - bd / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -lean)), V(bw, bh, bd))), c: bookCol() });
        x += bw + 0.003; if (lean) break;
      }
    });
  });

  /* ---- an armillary sphere and a celestial globe, either side of the aisle ---- */
  const stand = (g, top) => {
    const s = new THREE.Mesh(new THREE.LatheGeometry([[0.3, 0], [0.3, 0.05], [0.2, 0.09], [0.08, 0.15], [0.055, 0.5], [0.085, 0.56], [0.05, 0.62], [0.05, top - 0.04], [0.11, top - 0.02], [0.11, top]].map(p => new THREE.Vector2(p[0], p[1])), 24), darkOak);
    s.castShadow = s.receiveShadow = true; g.add(s); cyl(0.11, 0.11, 0.01, darkOak, 0, top - 0.005, 0, g, 24);
  };
  const strut = (g, a, b, r, m) => { const d = b.clone().sub(a), c = cyl(r, r, d.length(), m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, g, 6); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return c; };
  const ring = (r, tube) => new THREE.TorusGeometry(r, tube || 0.011, 6, 72);
  {   // armillary: a horizon ring on struts, the meridian, and the turning sphere of rings with a little earth at the centre
    const g = new THREE.Group(); g.position.set(-2.15, 0, -8.7); library.add(g); stand(g, 0.86); const C = 1.3;
    const hor = new THREE.Mesh(ring(0.47, 0.02), goldM); hor.rotation.x = Math.PI / 2; hor.position.y = C - 0.08; g.add(hor);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; strut(g, V(Math.cos(a) * 0.08, 0.86, Math.sin(a) * 0.08), V(Math.cos(a) * 0.47, C - 0.08, Math.sin(a) * 0.47), 0.012, goldM); }
    const mer = new THREE.Mesh(ring(0.44, 0.014), goldM); mer.position.y = C; g.add(mer);
    const tilt = new THREE.Group(); tilt.position.y = C; tilt.rotation.z = 0.65; g.add(tilt);
    cyl(0.008, 0.008, 0.9, goldM, 0, 0, 0, tilt, 6);
    const spin = new THREE.Group(); tilt.add(spin); spin.userData.rate = 0.15; LIBLIFE.spin.push(spin); LIBLIFE.live.push(spin);
    const eq = new THREE.Mesh(ring(0.4), goldM); eq.rotation.x = Math.PI / 2; spin.add(eq);
    [0, Math.PI / 2].forEach(ry => { const c = new THREE.Mesh(ring(0.4), goldM); c.rotation.y = ry; spin.add(c); });
    const ob = 0.409;
    [-1, 1].forEach(s => {
      const tr = new THREE.Mesh(ring(0.4 * Math.cos(ob), 0.008), goldM); tr.rotation.x = Math.PI / 2; tr.position.y = s * 0.4 * Math.sin(ob); spin.add(tr);
      const pc = new THREE.Mesh(ring(0.4 * Math.sin(ob), 0.008), goldM); pc.rotation.x = Math.PI / 2; pc.position.y = s * 0.4 * Math.cos(ob); spin.add(pc);
    });
    const ecl = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.05, 72, 1, true), mat(0xb8913c, { roughness: 0.35, metalness: 0.75, side: THREE.DoubleSide })); ecl.rotation.x = ob; spin.add(ecl);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), mat(0x2f5a73, { roughness: 0.5 })); spin.add(earth);
    spin.traverse(o => { if (o.isMesh) o.castShadow = true; });
  }
  {   // celestial globe: deep blue with gold stars, a made-up sky's constellations, and the ecliptic
    const g = new THREE.Group(); g.position.set(2.15, 0, -8.7); library.add(g); stand(g, 0.86); const C = 1.3;
    const hor = new THREE.Mesh(new THREE.RingGeometry(0.41, 0.5, 64), mat(0x6e4627, { roughness: 0.5, side: THREE.DoubleSide })); hor.rotation.x = -Math.PI / 2; hor.position.y = C; g.add(hor);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; strut(g, V(Math.cos(a) * 0.08, 0.86, Math.sin(a) * 0.08), V(Math.cos(a) * 0.46, C - 0.01, Math.sin(a) * 0.46), 0.014, darkOak); }
    const mer = new THREE.Mesh(ring(0.395, 0.012), goldM); mer.position.y = C; mer.rotation.y = 0.3; g.add(mer);
    strut(g, V(0, 0.86, 0), V(0, C - 0.395, 0), 0.014, goldM);
    const SR = seeded(1609), skyT = tex((c, w, h) => {
      c.fillStyle = "#13233c"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(201,161,74,0.22)"; c.lineWidth = 1; for (let x = 0; x < w; x += w / 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = h / 12; y < h; y += h / 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.strokeStyle = "rgba(220,180,90,0.7)"; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= w; x += 4) { const y = h / 2 - Math.sin(x / w * Math.PI * 2) * h * 0.13; if (x) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
      for (let k = 0; k < 26; k++) {   // a constellation: a few stars joined up
        let x = SR() * w, y = h * (0.12 + SR() * 0.76); const pts = [[x, y]];
        for (let s = 0; s < 3 + SR() * 4; s++) { x += (SR() - 0.5) * 70; y += (SR() - 0.5) * 50; pts.push([x, y]); }
        c.strokeStyle = "rgba(230,200,130,0.45)"; c.lineWidth = 1.2; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke();
        pts.forEach(([px, py]) => { c.fillStyle = "#f0d58a"; c.beginPath(); c.arc(px, py, 2 + SR() * 2.5, 0, 7); c.fill(); });
      }
      for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(240,215,150,${0.3 + SR() * 0.6})`; c.fillRect(SR() * w, SR() * h, 1.5, 1.5); }
    }, 1024, 512);
    skyT.anisotropy = 4;
    const tilt = new THREE.Group(); tilt.position.y = C; tilt.rotation.z = -0.5; g.add(tilt);
    const spin = new THREE.Group(); tilt.add(spin); spin.userData.rate = -0.08; LIBLIFE.spin.push(spin); LIBLIFE.live.push(spin);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(0.37, 40, 24), new THREE.MeshStandardMaterial({ map: skyT, roughness: 0.45, metalness: 0.1 })); sky.castShadow = true; spin.add(sky);
  }

  /* ---- the instanced desk things ---- */
  const inst = (geo, material, list, coloured, shadow) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, material, list.length), c = new THREE.Color();
    list.forEach((it, i) => { im.setMatrixAt(i, it.m || it); if (coloured) im.setColorAt(i, c.setHex(it.c).multiplyScalar(0.85 + R() * 0.3)); });
    im.castShadow = !!shadow; im.receiveShadow = true; im.frustumCulled = false; library.add(im); return im;
  };
  inst(new THREE.BoxGeometry(0.44, 0.008, 0.31).translate(0, 0.004, 0), mat(0xffffff, { roughness: 0.6 }), open, true, true);
  const bookGeo = libOpenBookGeo();
  inst(bookGeo, paperM, open, false, false);
  inst(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { roughness: 0.7 }), closed, true, true);
  const noteT = tex((g, w, h) => { g.fillStyle = "#f6f0dc"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,130,190,0.45)"; g.lineWidth = 1; for (let y = 26; y < h - 6; y += 9) { g.beginPath(); g.moveTo(4, y); g.lineTo(w - 4, y); g.stroke(); } g.strokeStyle = "rgba(200,80,80,0.5)"; g.beginPath(); g.moveTo(16, 0); g.lineTo(16, h); g.stroke(); g.strokeStyle = "rgba(40,50,80,0.75)"; g.lineWidth = 1.3; const NR = seeded(9); for (let y = 24; y < h * 0.7; y += 9) { g.beginPath(); let x = 20; g.moveTo(x, y); while (x < w - 12 - NR() * 30) { x += 3; g.lineTo(x, y - 2 + Math.sin(x * 0.9 + y) * 2); } g.stroke(); } }, 128, 180);
  inst(new THREE.PlaneGeometry(0.15, 0.21).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: noteT, roughness: 0.9 }), papers, false, false);
  inst(new THREE.CylinderGeometry(0.0055, 0.0055, 0.17, 6).rotateZ(Math.PI / 2), mat(0xe0b030, { roughness: 0.5 }), pencils, false, false);

  /* ---- the robots ---- */
  const put = (o) => { const p = cbotBuild(o); library.add(p.root); LIBLIFE.live.push(p.root); return p; };
  const RT = [
    { role: "Reader", kind: "biped", h: 0.95, w: 1.0, accent: 0x2f6fb5, eye: "#7fe3ff" },
    { role: "Reader", kind: "biped", h: 0.84, w: 0.95, accent: 0x3a9d5a, eye: "#9cf0b8" },
    { role: "Reader", kind: "biped", h: 1.06, w: 1.05, accent: 0x8a4fb0, eye: "#e0c2ff" },
    { role: "Reader", kind: "biped", h: 0.76, w: 0.92, accent: 0xd07a2c, eye: "#ffd36b" },
  ];
  chosen.forEach((s, i) => {
    const p = put(RT[i]), h = p.o.h;
    p.x = s.cx - Math.sin(s.h) * 0.02; p.z = s.cz - Math.cos(s.h) * 0.02; p.y = 0.48 - 0.48 * h; p.heading = s.h; p.sitBlend = 1; p.state = "read";
    p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.heading;
    p.turn = -1; p.nextTurn = 4 + Math.random() * 14; p.glance = null; p.nextGlance = 6 + Math.random() * 14;
    // the page that turns over, hinged at the book's gutter
    const hold = new THREE.Group(); hold.position.set(s.book.x, TOP + 0.03, s.book.z); hold.rotation.y = s.book.ry; library.add(hold);
    const hinge = new THREE.Group(); hold.add(hinge);
    const pg = new THREE.PlaneGeometry(0.205, 0.29).rotateX(-Math.PI / 2).translate(0.1025, 0, 0), uv = pg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, 0.5 + uv.getX(k) * 0.5);
    const leaf = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.85, side: THREE.DoubleSide })); hinge.add(leaf);
    hold.visible = false; p.flip = { hold, hinge }; LIBLIFE.live.push(hold);
    LIBLIFE.readers.push(p);
  });
  const lib = put({ role: "Librarian bot", kind: "biped", h: 1.0, w: 1.04, accent: 0x7a2430, eye: "#ffd9a0", carry: "book", book: 0x2f4a33 });
  Object.assign(lib, { ang: Math.PI * 0.5, rad: 3.45, want: 3.45, goal: Math.PI * 0.5, state: "look", dur: 4, y: 0.25 });
  LIBLIFE.librarian = lib;
  const dr = put({ role: "Shelving drone", kind: "hover", h: 0.9, w: 0.9, accent: 0xc9a14a, eye: "#ffe2a8", carry: "book", book: 0x23344f });
  Object.assign(dr, { bay: 2, ang: libBayAngle(0), rad: 11.6, state: "fly", goal: libBayAngle(2), y: 7.0 });
  LIBLIFE.drone = dr;
  if (!LIGHT) {
    const br = put({ role: "Roller bot", kind: "ball", h: 1.0, w: 1.0, accent: 0x2f6b5a, eye: "#a8f0ff", carry: "phone" });
    Object.assign(br, { ang: libBayAngle(3) + 0.4, rad: 12.2, state: "walk", goal: libBayAngle(4), y: 0 });
    LIBLIFE.browser = br;
  }
  LIBLIFE.built = true;
}

/* ---- what they do ---- */
const libEase = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function libTurnPage(p) { if (p.turn >= 0) return; p.turn = 0; p.glance = null; p.flip.hold.visible = true; p.flip.hinge.rotation.z = 0; }
// the sound of a page turning (sound.js) comes with one of the readers turning one
function libPageTurn() { const free = LIBLIFE.readers.filter(p => p.turn < 0); if (free.length) libTurnPage(free[(Math.random() * free.length) | 0]); }
function libFace(p, dt, expr) {
  p.blinkT -= dt;
  if (p.blinkT < 0.12 && expr !== "happy") expr = "blink"; if (p.blinkT < 0) p.blinkT = 2 + Math.random() * 3;
  if (expr !== p.face.expr) { p.face.expr = expr; p.face.draw(expr); }
  const pulse = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(p.t * 3 + p.phase)); p.glowM.color.setRGB(pulse, pulse, pulse);
}
// is the drone close overhead? (yaw and pitch for the head to follow it, or null)
function libWatchDrone(p, eyeY, range) {
  const D = LIBLIFE.drone; if (!D) return null;
  const dx = D.x - p.x, dz = D.z - p.z, d = Math.hypot(dx, dz); if (d > range) return null;
  const yaw = cbotWrap(Math.atan2(dx, dz) - p.heading); if (Math.abs(yaw) > 1.9) return null;
  return { yaw: Math.max(-1.1, Math.min(1.1, yaw)), pitch: -Math.min(0.75, Math.atan2(D.y + 1.6 - eyeY, Math.max(0.4, d))) };
}
// a reader at a desk: head down over the book, a page turned now and then, a glance up, the drone watched as it passes
function libReader(p, dt) {
  p.t += dt;
  const k = Math.min(1, dt * 6), kf = Math.min(1, dt * 12), L = (o, key, v, kk) => { o[key] += (v - o[key]) * (kk || k); };
  if (p.turn < 0 && p.t > p.nextTurn) libTurnPage(p);
  let s = -1;
  if (p.turn >= 0) {
    p.turn += dt / 1.5; s = p.turn;
    p.flip.hinge.rotation.z = Math.PI * libEase((s - 0.25) / 0.5) * 0.985;
    if (p.turn >= 1) { p.turn = -1; s = -1; p.flip.hold.visible = false; p.nextTurn = p.t + 16 + Math.random() * 24; }
  }
  if (!p.glance && s < 0 && p.t > p.nextGlance) p.glance = { until: p.t + 2 + Math.random() * 2.5, yaw: (Math.random() - 0.5) * 1.3 };
  if (p.glance && p.t > p.glance.until) { p.glance = null; p.nextGlance = p.t + 12 + Math.random() * 20; }
  const watch = s < 0 ? libWatchDrone(p, p.y + 1.2 * p.o.h, 4.5) : null;
  // sitting: thighs level, shins down, leaning in a little (breathing)
  p.legs.forEach(l => { L(l.thigh.rotation, "x", -1.5); L(l.knee.rotation, "x", 1.5); L(l.ankle.rotation, "x", 0); });
  p.hips.position.y = CBOT_HIP - 0.4; L(p.hips.rotation, "y", 0); L(p.hips.rotation, "z", 0);
  L(p.spine.rotation, "x", (watch || p.glance ? 0.04 : 0.16) + 0.015 * Math.sin(p.t * 1.3 + p.phase)); L(p.spine.rotation, "y", 0);
  // hands on the book; the right one reaches to the right-hand page and carries it over
  p.arms.forEach((a, i) => {
    let sh = -0.95, el = -0.6, roll = i ? -0.18 : 0.18, kk = k;
    if (i === 0 && s >= 0) { kk = kf; if (s < 0.25) { roll = -0.08; sh = -1.05; } else if (s < 0.78) { roll = -0.08 + 0.8 * libEase((s - 0.25) / 0.5); sh = -1.12; el = -0.5; } }
    L(a.sh.rotation, "x", sh, kk); L(a.el.rotation, "x", el, kk); L(a.sh.rotation, "z", roll, kk);
  });
  const hp = watch ? watch.pitch : p.glance ? -0.05 : 0.42, hy = watch ? watch.yaw : p.glance ? p.glance.yaw : s >= 0 ? -0.15 * Math.sin(s * Math.PI) : 0;
  L(p.head.rotation, "x", hp, Math.min(1, dt * 4)); L(p.head.rotation, "y", hy, Math.min(1, dt * 4));
  libFace(p, dt, watch ? "happy" : p.glance ? "normal" : "down");
}
// along the ring at radius rad toward angle goal; true while still going
function libArc(p, dt, speed) {
  const da = cbotWrap(p.goal - p.ang), sg = Math.sign(da) || 1, st = sg * Math.min(Math.abs(da), speed * dt / p.rad);
  p.ang += st;
  cbotTurn(p, Math.atan2(-Math.sin(p.ang) * sg, Math.cos(p.ang) * sg), dt, 5);
  return Math.abs(da) > 0.003;
}
function libPlace(p) { p.x = Math.cos(p.ang) * p.rad; p.z = Math.sin(p.ang) * p.rad; p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.heading; }
const libOut = a => Math.atan2(Math.cos(a), Math.sin(a));   // the heading that faces out from the middle
// the librarian, between the two rings of the central desk: walks round, stamps returns on the counter, files cards in the drawers
function libLibrarian(p, dt) {
  p.t += dt; let walking = false;
  if (p.state === "walk") {
    p.want = 3.45;
    walking = libArc(p, dt, 0.55);
    if (!walking) { const r = Math.random(); p.state = r < 0.4 ? "stamp" : r < 0.75 ? "file" : "look"; p.t = 0; p.dur = 4 + Math.random() * 4; p.want = p.state === "stamp" ? 3.88 : p.state === "file" ? 3.12 : 3.6; }
  } else {
    cbotTurn(p, p.state === "file" ? libOut(p.ang) + Math.PI : libOut(p.ang), dt, 4);
    if (p.t > p.dur) { p.state = "walk"; p.t = 0; p.goal = p.ang + (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 1.8); }
  }
  const dr = p.want - p.rad; if (Math.abs(dr) > 0.01) { p.rad += Math.sign(dr) * Math.min(Math.abs(dr), 0.4 * dt); walking = true; }
  libPlace(p);
  const w = libWatchDrone(p, p.y + 1.5, 6); p.lookYaw = w ? w.yaw : null;
  const st = p.state; if (st === "stamp" || st === "file") p.state = "idle";   // (cbotPose: a plain standing pose; the arm is set below)
  cbotPose(p, dt, walking); p.state = st;
  const k = Math.min(1, dt * 10), A = p.arms[0];
  if (st === "stamp" && Math.abs(dr) < 0.05 && p.t > 0.6) {   // the right hand comes down on the counter, twice a second
    const up = Math.pow(Math.max(0, Math.sin(p.t * 6.3)), 2);
    A.sh.rotation.x += (-0.9 - 0.5 * up - A.sh.rotation.x) * k; A.el.rotation.x += (-0.42 - 0.5 * up - A.el.rotation.x) * k; A.sh.rotation.z += (0.12 - A.sh.rotation.z) * k;
    if (!w) p.head.rotation.x += (0.32 - p.head.rotation.x) * k;
  } else if (st === "file" && Math.abs(dr) < 0.05) {   // reaching into the card drawers, flicking through
    A.sh.rotation.x += (-0.85 - A.sh.rotation.x) * k; A.el.rotation.x += (-0.35 - 0.12 * Math.sin(p.t * 7) - A.el.rotation.x) * k; A.sh.rotation.z += (0.1 * Math.sin(p.t * 1.3) - A.sh.rotation.z) * k;
    if (!w) p.head.rotation.x += (0.4 - p.head.rotation.x) * k;
  }
}
// the roller: round the room past the alcoves, stopping to look at a shelf or check its tablet
function libBrowser(p, dt) {
  p.t += dt; let walking = false;
  if (p.state === "walk") {
    walking = libArc(p, dt, p.speed * 0.8);
    if (!walking) { p.state = Math.random() < 0.55 ? "look" : "phone"; p.t = 0; p.dur = 5 + Math.random() * 6; }
  } else {
    cbotTurn(p, libOut(p.ang), dt, 3);
    if (p.t > p.dur) {
      let k; do k = (Math.round(p.ang / (Math.PI / 4)) + (Math.random() < 0.5 ? -1 : 1) * (1 + ((Math.random() * 2) | 0)) + 16) % 8; while (k === LIB.ENT);
      p.goal = p.ang + cbotWrap(libBayAngle(k) - p.ang); p.state = "walk"; p.t = 0;
    }
  }
  libPlace(p);
  const w = libWatchDrone(p, 1.2, 5); p.lookYaw = w ? w.yaw : null;
  cbotPose(p, dt, walking);
}
// the drone: across to an alcove up on the gallery, in under the arch, a book onto the shelf, back out, on to the next
function libDrone(p, dt) {
  p.t += dt;
  const k = Math.min(1, dt * 3);
  if (p.state === "fly") { if (!libArc(p, dt, 1.1)) { p.state = "in"; p.t = 0; } }
  else {
    cbotTurn(p, libOut(p.ang), dt, 3);
    if (p.state === "in") { p.rad += (15.0 - p.rad) * Math.min(1, dt * 1.4); if (p.rad > 14.9) { p.state = "shelve"; p.t = 0; } }
    else if (p.state === "shelve") { if (p.t > 3.2) { p.state = "out"; p.t = 0; } }
    else if (p.state === "out") {
      p.rad += (11.5 - p.rad) * Math.min(1, dt * 1.2);
      if (p.rad < 11.65) { let b; do b = (p.bay + 1 + ((Math.random() * 3) | 0)) % 8; while (b === LIB.ENT); p.bay = b; p.goal = p.ang + cbotWrap(libBayAngle(b) - p.ang); p.state = "fly"; }
    }
  }
  p.y += (7.0 + (p.state === "shelve" ? 0.15 * Math.sin(p.t * 2) : 0) - p.y) * k;
  libPlace(p); p.lookYaw = null;
  cbotPose(p, dt, p.state === "fly");
  if (p.state === "shelve") {   // reach in with the book and slide it home
    const A = p.arms[1], reach = libEase(p.t / 0.8) * (1 - libEase((p.t - 2.4) / 0.6)), kk = Math.min(1, dt * 8);
    A.sh.rotation.x += (-0.5 - 1.0 * reach - A.sh.rotation.x) * kk; A.el.rotation.x += (-1.3 + 1.1 * reach - A.el.rotation.x) * kk;
    p.head.rotation.x += (0.25 * reach - p.head.rotation.x) * kk;
  }
}
function updateLibraryLife(dt) {
  if (!LIBLIFE.built) return;
  dt = Math.min(dt, 0.1);
  LIBLIFE.spin.forEach(s => { s.rotation.y += dt * s.userData.rate; });
  if (LIBLIFE.glowM) LIBLIFE.glowM.emissiveIntensity = night ? 1.6 : 0.55;
  if (LIBLIFE.drone) libDrone(LIBLIFE.drone, dt);   // first, so the others can watch where it is
  LIBLIFE.readers.forEach(p => libReader(p, dt));
  if (LIBLIFE.librarian) libLibrarian(LIBLIFE.librarian, dt);
  if (LIBLIFE.browser) libBrowser(LIBLIFE.browser, dt);
}
