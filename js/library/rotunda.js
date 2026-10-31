/* js/library/rotunda.js — The library's reading room: an octagonal rotunda under a coffered dome, after grand reading rooms
   like the Library of Congress's. Eight arched bays (seven book alcoves, one entrance), a gallery with a balustrade, paired
   marble columns, a round central desk, radial reading desks with lamps, and thousands of instanced books.
   Built the first time you drive in. Coordinates: centre at the origin, the entrance bay toward −z.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const library = new THREE.Group(); library.visible = false; scene.add(library);
let libraryBuilt = false;
const LIB = { R: 14, T: 1.0, H: 13, GAL: 7.0, ENT: 6, ARCH_W: 5.6, ARCH_SPRING: 3.6, UP_W: 4.8, UP_Y0: 7.25, UP_SPRING: 9.4 };
const LIBFX = { lamps: null, oculus: null, shaft: null, motes: null };
const libBayAngle = k => k * Math.PI / 4;                                     // outward normal (cos θ, 0, sin θ)
const libBayDir = k => new THREE.Vector3(Math.cos(libBayAngle(k)), 0, Math.sin(libBayAngle(k)));

function buildLibraryRoom() {
  const R = LIB.R, T = LIB.T, H = LIB.H, side = 2 * R * Math.tan(Math.PI / 8) + 0.9, Rv = R / Math.cos(Math.PI / 8);
  const rnd = seeded(77);
  // materials: warm marble walls, Siena marble columns, gilded trim, dark oak
  const marbleTex = tex((g, w, h) => {
    g.fillStyle = "#e9dcc2"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${150 + rnd() * 40},${120 + rnd() * 30},${90 + rnd() * 20},${0.06 + rnd() * 0.08})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.4) * 80; y += (rnd() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 2500; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(120,96,60,0.08)"; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  }, 512, 512);
  marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping; marbleTex.repeat.set(0.25, 0.25);
  const wallM = new THREE.MeshStandardMaterial({ map: marbleTex, color: 0xf1e6cf, roughness: 0.55 });
  const sienaM = mat(0x9a4a35, { roughness: 0.32, metalness: 0.05 }), goldM = mat(0xc9a14a, { roughness: 0.32, metalness: 0.75 });
  const oakM = mat(0x6e4627, { roughness: 0.5 }), darkOak = mat(0x4a2e1a, { roughness: 0.55 }), creamM = mat(0xf3ead8, { roughness: 0.6 });

  /* ---- floor: an inlaid marble medallion ---- */
  const floorTex = tex((g, w, h) => {
    const c = w / 2; g.fillStyle = "#d8ccb4"; g.fillRect(0, 0, w, h);
    const ring = (r, wdt, col) => { g.strokeStyle = col; g.lineWidth = wdt; g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); };
    for (let i = 0; i < 64; i++) { const a = i / 64 * 6.283; g.strokeStyle = i % 2 ? "rgba(120,90,60,0.18)" : "rgba(80,60,40,0.12)"; g.lineWidth = 2; g.beginPath(); g.moveTo(c + Math.cos(a) * w * 0.18, c + Math.sin(a) * w * 0.18); g.lineTo(c + Math.cos(a) * w * 0.48, c + Math.sin(a) * w * 0.48); g.stroke(); }
    ring(w * 0.18, 10, "#7a3a2c"); ring(w * 0.2, 4, "#c9a14a"); ring(w * 0.33, 6, "#7a3a2c"); ring(w * 0.47, 18, "#6b4a32"); ring(w * 0.445, 4, "#c9a14a");
    g.fillStyle = "#e6dcc8"; g.beginPath(); g.arc(c, c, w * 0.165, 0, 7); g.fill();
    g.fillStyle = "#7a3a2c"; g.beginPath(); for (let i = 0; i < 32; i++) { const a = i / 32 * 6.283, r = i % 2 ? w * 0.06 : w * 0.15; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } g.closePath(); g.fill();
    g.fillStyle = "#c9a14a"; g.beginPath(); g.arc(c, c, w * 0.035, 0, 7); g.fill();
    for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * 6.283, r = w * 0.4; g.fillStyle = "#7a3a2c"; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, w * 0.022, 0, 7); g.fill(); g.fillStyle = "#c9a14a"; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, w * 0.009, 0, 7); g.fill(); }
    for (let i = 0; i < 9000; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.1)" : "rgba(90,70,40,0.07)"; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  }, 2048, 2048);
  floorTex.anisotropy = 8;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(Rv + 0.4, 96), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.35, metalness: 0.02 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; library.add(floor);

  /* ---- the eight bays: a marble wall with a tall arch below and a gallery arch above ---- */
  const archHole = (w, y0, spring) => { const p = new THREE.Path(); p.moveTo(-w / 2, y0); p.lineTo(w / 2, y0); p.lineTo(w / 2, spring); p.absarc(0, spring, w / 2, 0, Math.PI, false); p.lineTo(-w / 2, y0); return p; };
  const wallShape = new THREE.Shape(); wallShape.moveTo(-side / 2, -0.3); wallShape.lineTo(side / 2, -0.3); wallShape.lineTo(side / 2, H); wallShape.lineTo(-side / 2, H); wallShape.lineTo(-side / 2, -0.3);   // runs below the floor so the arch hole stays inside the outline
  wallShape.holes.push(archHole(LIB.ARCH_W, -0.15, LIB.ARCH_SPRING), archHole(LIB.UP_W, LIB.UP_Y0, LIB.UP_SPRING));
  const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: T, bevelEnabled: false, curveSegments: 24 });
  wallGeo.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 1.0; });
  const bays = [];
  for (let k = 0; k < 8; k++) {
    const g = new THREE.Group(); g.rotation.y = -libBayAngle(k) - Math.PI / 2; library.add(g); bays.push(g);
    const wall = new THREE.Mesh(wallGeo, wallM); wall.position.z = -R - T; wall.castShadow = wall.receiveShadow = true; g.add(wall);
    // gilded mouldings round both arches, keystones, and a cornice band at the gallery floor
    const archTrim = (w, spring, y0) => {
      const tor = new THREE.Mesh(new THREE.TorusGeometry(w / 2 + 0.12, 0.09, 8, 40, Math.PI), goldM); tor.position.set(0, spring, -R + 0.05); g.add(tor);
      [-1, 1].forEach(sd => box(0.18, spring - y0, 0.14, goldM, sd * (w / 2 + 0.12), y0 + (spring - y0) / 2, -R + 0.05, g));
      box(0.5, 0.7, 0.24, creamM, 0, spring + w / 2 + 0.25, -R + 0.08, g);
    };
    archTrim(LIB.ARCH_W, LIB.ARCH_SPRING, 0); archTrim(LIB.UP_W, LIB.UP_SPRING, LIB.UP_Y0);
    box(side, 0.4, 0.5, creamM, 0, LIB.GAL - 0.2, -R + 0.2, g); box(side, 0.08, 0.56, goldM, 0, LIB.GAL - 0.42, -R + 0.22, g);
    box(side, 0.6, 0.7, creamM, 0, H - 0.3, -R + 0.3, g); box(side, 0.1, 0.78, goldM, 0, H - 0.65, -R + 0.33, g);
  }
  LIBFX.bays = bays;
  // paired Siena marble columns at every corner, two storeys
  const colGeo = (h, r) => new THREE.LatheGeometry([[r * 1.35, 0], [r * 1.35, 0.18], [r * 1.12, 0.3], [r, 0.42], [r * 0.9, h - 0.5], [r * 1.05, h - 0.42], [r * 1.25, h - 0.18], [r * 1.35, h - 0.12], [r * 1.35, h]].map(p => new THREE.Vector2(p[0], p[1])), 20);
  const cLow = colGeo(LIB.GAL - 0.4, 0.3), cUp = colGeo(H - 0.6 - LIB.GAL - 0.1, 0.24);
  for (let k = 0; k < 8; k++) {
    const a = libBayAngle(k) + Math.PI / 8, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), t = new THREE.Vector3(-d.z, 0, d.x), rr = Rv - 1.15;
    [-0.65, 0.65].forEach(o => {
      const p = d.clone().multiplyScalar(rr).addScaledVector(t, o);
      const lo = new THREE.Mesh(cLow, sienaM); lo.position.set(p.x, 0, p.z); lo.castShadow = lo.receiveShadow = true; library.add(lo);
      const up = new THREE.Mesh(cUp, sienaM); up.position.set(p.x, LIB.GAL + 0.1, p.z); up.castShadow = true; library.add(up);
      const cap = cyl(0.42, 0.34, 0.24, goldM, p.x, LIB.GAL - 0.52, p.z, library, 20); cap.castShadow = false;
      cyl(0.36, 0.28, 0.2, goldM, p.x, H - 0.72, p.z, library, 20).castShadow = false;
    });
    // a pedestal block behind the pair, rising through both storeys
    const pb = d.clone().multiplyScalar(Rv - 0.55); box(1.9, H - 0.6, 0.9, wallM, pb.x, (H - 0.6) / 2, pb.z, library).rotation.y = -a - Math.PI / 2;
  }

  /* ---- gallery: a walkway with a balustrade all the way round ---- */
  const balG = new THREE.CylinderGeometry(0.045, 0.06, 0.78, 8), balusters = new THREE.InstancedMesh(balG, creamM, 8 * 30), m4 = new THREE.Matrix4();
  let bi = 0;
  bays.forEach((g, k) => {
    box(side, 0.22, 1.5, creamM, 0, LIB.GAL - 0.11, -R + 0.75, g);
    box(side, 0.12, 0.2, goldM, 0, LIB.GAL + 0.86, -R + 1.42, g); box(side, 0.14, 0.24, creamM, 0, LIB.GAL + 0.06, -R + 1.42, g);
    g.updateMatrixWorld(true);
    for (let i = 0; i < 30; i++) { const x = -side / 2 + 0.25 + i * (side - 0.5) / 29; m4.multiplyMatrices(g.matrixWorld, new THREE.Matrix4().makeTranslation(x, LIB.GAL + 0.5, -R + 1.42)); balusters.setMatrixAt(bi++, m4); }
    for (let i = 0; i < 5; i++) { const x = -side / 2 + 0.8 + i * (side - 1.6) / 4; box(0.3, 0.5, 0.5, creamM, x, LIB.GAL - 0.47, -R + 1.2, g); }          // corbels
  });
  balusters.castShadow = true; library.add(balusters);
  // a cornice ring and the coffered dome with an oculus open to the sky
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(Rv, Rv, 0.5, 8, 1, true, Math.PI / 8), new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.6, side: THREE.BackSide })); ring.position.y = H + 0.25; library.add(ring);
  const domeTex = tex((g, w, h) => {
    g.fillStyle = "#efe4cc"; g.fillRect(0, 0, w, h);
    const rows = 7, cols = 32;
    for (let r = 0; r < rows; r++) {
      const y0 = h * (0.16 + r * 0.115), ch = h * 0.095;
      for (let c = 0; c < cols; c++) {
        const x0 = c * w / cols + w / cols * 0.1, cw = w / cols * 0.8, inset = cw * 0.16;
        g.fillStyle = "#c9b48c"; g.fillRect(x0, y0, cw, ch);
        g.fillStyle = "#b39a6d"; g.fillRect(x0 + inset * 0.5, y0 + inset * 0.5, cw - inset, ch - inset);
        g.fillStyle = "#e7d7b4"; g.fillRect(x0 + inset, y0 + inset, cw - inset * 2, ch - inset * 2);
        g.fillStyle = "#c9a14a"; g.beginPath(); g.arc(x0 + cw / 2, y0 + ch / 2, Math.min(cw, ch) * 0.13, 0, 7); g.fill();
      }
    }
    g.fillStyle = "#c9a14a"; g.fillRect(0, h * 0.13, w, h * 0.012); g.fillRect(0, h * 0.97, w, h * 0.012);
  }, 2048, 1024);
  domeTex.anisotropy = 8;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(Rv, 64, 24, 0, Math.PI * 2, 0.16, Math.PI / 2 - 0.16), new THREE.MeshStandardMaterial({ map: domeTex, roughness: 0.75, side: THREE.BackSide }));
  dome.scale.y = 0.62; dome.position.y = H + 0.5; library.add(dome);
  const ocY = H + 0.5 + Rv * 0.62 * Math.cos(0.16) - 0.02, ocR = Rv * Math.sin(0.16);
  LIBFX.oculus = new THREE.Mesh(new THREE.CircleGeometry(ocR, 48), new THREE.MeshBasicMaterial({ map: winTex }));
  LIBFX.oculus.rotation.x = Math.PI / 2; LIBFX.oculus.position.y = ocY; library.add(LIBFX.oculus);
  const ocRing = new THREE.Mesh(new THREE.TorusGeometry(ocR, 0.18, 8, 48), goldM); ocRing.rotation.x = Math.PI / 2; ocRing.position.y = ocY - 0.05; library.add(ocRing);
  // the light that falls through the oculus (the copper dome outside) onto the catalogue: a soft shaft, a pool on the
  // floor and dust drifting in it. Sunlight by day, moonlight at night (updateLibrary sets the colours).
  {
    const shaftM = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(1, 0.88, 0.68) }, uStr: { value: 0.1 } },
      vertexShader: "varying vec3 vN; varying vec3 vV; varying float vY; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = uv.y; gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform vec3 uCol; uniform float uStr; varying vec3 vN; varying vec3 vV; varying float vY; void main() { float face = pow(abs(dot(vN, vV)), 1.6); float a = face * smoothstep(0.0, 0.25, vY) * (0.55 + 0.45 * vY) * uStr; gl_FragColor = vec4(uCol * a, 1.0); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(ocR * 0.95, 3.3, ocY - 0.1, 48, 1, true), shaftM); shaft.position.y = (ocY + 0.1) / 2; shaft.renderOrder = 4; library.add(shaft);
    const poolTex = tex((g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, "rgba(255,240,210,0.85)"); r.addColorStop(0.6, "rgba(255,230,190,0.4)"); r.addColorStop(1, "rgba(255,230,190,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); }, 256, 256);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; pool.renderOrder = 3; library.add(pool);
    const N = 220, mp = new Float32Array(N * 3), seeds = [];
    for (let i = 0; i < N; i++) { const t = Math.random(), a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (ocR + (3.1 - ocR) * (1 - t)); seeds.push([a, r, t * (ocY - 1)]); }
    const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    const motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: 0.1, map: dotTex, color: 0xfff0d8, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    motes.frustumCulled = false; motes.userData.seeds = seeds; motes.userData.top = ocY - 1; library.add(motes);
    LIBFX.shaft = { shaftM, pool: pool.material, motes };
  }

  /* ---- alcoves: book-lined rooms behind the lower arches (and shallower ones behind the gallery arches) ---- */
  const books = { m: [], c: [] }, bookCols = [0x7a2430, 0x2f4a33, 0x5a3a24, 0x23344f, 0x6b4a1e, 0x8a5a2c, 0x3d2f5a, 0x2f5a5a, 0x9a7a3a, 0x4a1e1e];
  const shelfUnit = (g, cx, cz, ry, w, h, rows, y0) => {
    const u = new THREE.Group(); u.position.set(cx, y0 || 0, cz); u.rotation.y = ry; g.add(u);
    box(w, h, 0.06, darkOak, 0, h / 2, -0.3, u); [-1, 1].forEach(sd => box(0.06, h, 0.36, oakM, sd * w / 2, h / 2, -0.14, u));
    box(w + 0.1, 0.12, 0.42, oakM, 0, h + 0.06, -0.12, u);
    library.updateMatrixWorld(true);
    for (let r = 0; r < rows; r++) {
      const y = 0.12 + r * (h - 0.2) / rows; box(w - 0.06, 0.035, 0.34, oakM, 0, y, -0.14, u).castShadow = false;
      const rowH = (h - 0.2) / rows;
      for (let x = -w / 2 + 0.06; x < w / 2 - 0.08;) {
        const bw = 0.035 + rnd() * 0.04, bh = rowH * (0.6 + rnd() * 0.3), bd = 0.18 + rnd() * 0.08;
        if (rnd() < 0.04) { x += 0.12; continue; }
        const L = new THREE.Matrix4().compose(new THREE.Vector3(x + bw / 2, y + 0.018 + bh / 2, -0.28 + bd / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rnd() < 0.05 ? 0.12 : 0)), new THREE.Vector3(bw, bh, bd));
        books.m.push(new THREE.Matrix4().multiplyMatrices(u.matrixWorld, L)); books.c.push(bookCols[(rnd() * bookCols.length) | 0]);
        x += bw + 0.004;
      }
    }
    return u;
  };
  bays.forEach((gb, k) => {
    let g = gb; const D = 2.6, z0 = -R - T, z1 = z0 - D, w = LIB.ARCH_W + 0.8, hh = LIB.ARCH_SPRING + LIB.ARCH_W / 2 + 0.3;
    // the alcove shell
    box(w, 0.1, D, darkOak, 0, -0.04, z0 - D / 2, g);
    box(w, hh, 0.2, wallM, 0, hh / 2, z1 - 0.1, g); [-1, 1].forEach(sd => box(0.2, hh, D, wallM, sd * (w / 2 + 0.1), hh / 2, z0 - D / 2, g));
    box(w + 0.4, 0.2, D, creamM, 0, hh + 0.1, z0 - D / 2, g);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, 0.3), new THREE.MeshBasicMaterial({ color: 0xffe2b0 })); glow.rotation.x = Math.PI / 2; glow.position.set(0, hh - 0.01, z0 - D / 2); g.add(glow);
    if (k === LIB.ENT) {
      // the entrance: a vestibule with tall bronze doors
      const bronze = mat(0x5a4630, { metalness: 0.7, roughness: 0.35 });
      g.updateMatrixWorld(true); const ge = hotGroup("libExit", "Exit", g.localToWorld(new THREE.Vector3(0, 5.0, z1 + 0.4)), g, "library"); g = ge;
      [-1, 1].forEach(sd => { box(1.3, 4.0, 0.12, bronze, sd * 0.68, 2.0, z1 + 0.05, g); box(1.0, 3.2, 0.03, mat(0x7a6040, { metalness: 0.75, roughness: 0.3 }), sd * 0.68, 2.0, z1 + 0.12, g); box(0.05, 0.6, 0.06, goldM, sd * 0.12, 1.8, z1 + 0.15, g); });
      box(3.2, 0.5, 0.2, creamM, 0, 4.25, z1 + 0.05, g);
      const exitT = tex((c, cw, ch) => { c.fillStyle = "#2a2018"; c.fillRect(0, 0, cw, ch); c.fillStyle = "#e9d6a8"; c.font = "600 34px Georgia, serif"; c.textAlign = "center"; c.fillText("EXIT TO CAMPUS", cw / 2, ch * 0.66); }, 384, 64);
      plane(2.2, 0.36, new THREE.MeshBasicMaterial({ map: exitT }), 0, 4.25, z1 + 0.16, 0, g);
      return;
    }
    shelfUnit(g, 0, z1 + 0.38, 0, w - 0.4, 3.6, 9);
    shelfUnit(g, -w / 2 + 0.38, z0 - D / 2, Math.PI / 2, D - 0.2, 3.6, 9);
    shelfUnit(g, w / 2 - 0.38, z0 - D / 2, -Math.PI / 2, D - 0.2, 3.6, 9);
    // a rolling ladder on the back shelves
    const lad = new THREE.Group(); lad.position.set(1.2, 0, z1 + 0.62); lad.rotation.x = -0.16; g.add(lad);
    [-0.25, 0.25].forEach(dx => box(0.05, 3.9, 0.05, oakM, dx, 1.95, 0, lad)); for (let s = 0; s < 11; s++) box(0.5, 0.03, 0.05, oakM, 0, 0.3 + s * 0.34, 0, lad);
  });
  // upper alcoves behind the gallery arches
  bays.forEach(g => {
    const D = 1.4, z0 = -R - T, z1 = z0 - D, w = LIB.UP_W + 0.6, hh = LIB.UP_SPRING - LIB.UP_Y0 + LIB.UP_W / 2 + 0.2;
    box(w, 0.1, D, darkOak, 0, LIB.UP_Y0 - 0.05, z0 - D / 2, g);
    box(w, hh, 0.2, wallM, 0, LIB.UP_Y0 + hh / 2, z1 - 0.1, g); [-1, 1].forEach(sd => box(0.2, hh, D, wallM, sd * (w / 2 + 0.1), LIB.UP_Y0 + hh / 2, z0 - D / 2, g));
    box(w + 0.4, 0.2, D, creamM, 0, LIB.UP_Y0 + hh + 0.1, z0 - D / 2, g);
    shelfUnit(g, 0, z1 + 0.38, 0, w - 0.3, 3.0, 7, LIB.UP_Y0);
  });
  const bookMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { roughness: 0.75 }), books.m.length), bc = new THREE.Color();
  books.m.forEach((m, i) => { bookMesh.setMatrixAt(i, m); bookMesh.setColorAt(i, bc.setHex(books.c[i]).multiplyScalar(0.85 + rnd() * 0.3)); });
  bookMesh.receiveShadow = true; library.add(bookMesh); LIBFX.bookCount = books.m.length;

  /* ---- shelf plaques over the alcoves, lecterns with each shelf's app notes ---- */
  LIBFX.shelfBays = {};
  let si = 0;
  bays.forEach((g, k) => {
    if (k === LIB.ENT) return;
    const shelf = LIB_SHELVES[si++]; if (!shelf) return; LIBFX.shelfBays[shelf.id] = k;
    const notes = notesOn(shelf.id);
    const pt = tex((c, cw, ch) => { c.fillStyle = "#2a2018"; c.fillRect(0, 0, cw, ch); c.strokeStyle = "#c9a14a"; c.lineWidth = 4; c.strokeRect(6, 6, cw - 12, ch - 12); c.fillStyle = "#e9d6a8"; c.font = "600 40px Georgia, serif"; c.textAlign = "center"; c.fillText(shelf.plaque, cw / 2, ch * 0.66); }, 768, 90);
    plane(3.4, 0.4, new THREE.MeshBasicMaterial({ map: pt }), 0, LIB.GAL + 0.42, -R + 1.56, 0, g);
    // a reading lectern in the arch with the shelf's notes standing on it, covers out
    g.updateMatrixWorld(true);
    const hg = hotGroup("lib_" + shelf.id, shelf.name + (notes.length ? " · " + notes.length : ""), g.localToWorld(new THREE.Vector3(0, 4.6, -R + 1.2)), g, "library");
    const ctr = g.localToWorld(new THREE.Vector3(0, 2.4, -R - 0.6)), out = libBayDir(k);
    hotspots[hotspots.length - 1].focus = { center: ctr, size: new THREE.Vector3(6.6, 5.2, 3.2) }; hotspots[hotspots.length - 1].front = [-out.x, 0, -out.z];
    const proxy = new THREE.Mesh(new THREE.PlaneGeometry(LIB.ARCH_W, LIB.ARCH_SPRING + LIB.ARCH_W / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    proxy.position.set(0, (LIB.ARCH_SPRING + LIB.ARCH_W / 2) / 2, -R + 0.02); proxy.userData.keep = true; hg.add(proxy);
    const lect = new THREE.Group(); lect.position.set(0, 0, -R + 0.9); hg.add(lect);
    box(1.6, 0.9, 0.6, oakM, 0, 0.45, 0, lect); box(1.75, 0.06, 0.72, darkOak, 0, 0.93, 0, lect);
    const shown = notes.slice(0, 4);
    shown.forEach((n, i) => {
      const bx = (i - (shown.length - 1) / 2) * 0.36, cover = new THREE.Color(n.cover);
      const coverT = tex((c, cw, ch) => { c.fillStyle = n.cover; c.fillRect(0, 0, cw, ch); c.strokeStyle = "#d9b45a"; c.lineWidth = 6; c.strokeRect(10, 10, cw - 20, ch - 20); c.fillStyle = "#f3e2b4"; c.font = "bold 26px Georgia, serif"; c.textAlign = "center"; const words = n.title.split(" "); let line = "", y = ch * 0.34; words.forEach(wd => { if (c.measureText(line + wd).width > cw - 40) { c.fillText(line, cw / 2, y); y += 32; line = ""; } line += wd + " "; }); c.fillText(line, cw / 2, y); }, 192, 256);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.05), [mat(cover.getHex()), mat(cover.getHex()), mat(cover.getHex()), mat(cover.getHex()), new THREE.MeshStandardMaterial({ map: coverT, roughness: 0.5, emissive: 0x332211, emissiveMap: coverT, emissiveIntensity: 0.6 }), mat(cover.getHex())]);
      b.position.set(bx, 1.15, 0.05); b.rotation.x = -0.18; b.castShadow = true; lect.add(b);
    });
    if (!shown.length) { const ct = tex((c, cw, ch) => { c.fillStyle = "#efe4cc"; c.fillRect(0, 0, cw, ch); c.fillStyle = "#6b4a32"; c.font = "italic 30px Georgia, serif"; c.textAlign = "center"; c.fillText("Coming soon", cw / 2, ch * 0.62); }, 256, 64); plane(0.9, 0.22, new THREE.MeshBasicMaterial({ map: ct }), 0, 1.08, 0.2, 0, lect).rotation.x = -0.4; }
  });

  /* ---- central desk: two concentric rings on a dais ---- */
  const ringSolid = (r0, r1, hgt, gapA, gapW) => new THREE.LatheGeometry([[r0, 0], [r1, 0], [r1, hgt], [r1 + 0.06, hgt], [r1 + 0.06, hgt + 0.06], [r0 - 0.06, hgt + 0.06], [r0 - 0.06, hgt], [r0, hgt], [r0, 0]].map(p => new THREE.Vector2(p[0], p[1])), 64, gapA + gapW / 2, Math.PI * 2 - gapW);
  const gapA = Math.PI;                                                         // gaps face the entrance (−z)
  const gCat = hotGroup("libCatalog", "Catalogue", new THREE.Vector3(0, 2.6, 0), library, "library");
  Object.assign(hotspots[hotspots.length - 1], { front: [0, 0, 1], focus: { center: new THREE.Vector3(0, 1.0, 0), size: new THREE.Vector3(9.6, 2.4, 9.6) } }); LIBFX.catalog = gCat;
  cyl(4.9, 5.0, 0.25, mat(0x7a3a2c, { roughness: 0.4 }), 0, 0.125, 0, gCat, 64);
  const outer = new THREE.Mesh(ringSolid(4.2, 4.65, 1.0, gapA, 0.5), oakM); outer.position.y = 0.25; outer.castShadow = outer.receiveShadow = true; gCat.add(outer);
  const inner = new THREE.Mesh(ringSolid(2.3, 2.75, 1.1, gapA, 0.6), oakM); inner.position.y = 0.25; inner.castShadow = true; gCat.add(inner);
  cyl(1.6, 1.7, 0.5, darkOak, 0, 0.5, 0, gCat, 48); cyl(1.0, 1.0, 1.2, oakM, 0, 0.85, 0, gCat, 32);
  // card-catalogue drawers on the inner ring and an open register on the top
  const catT = tex((c, cw, ch) => { c.fillStyle = "#6e4627"; c.fillRect(0, 0, cw, ch); for (let r = 0; r < 4; r++) for (let k = 0; k < 16; k++) { c.fillStyle = "#83562f"; c.fillRect(k * cw / 16 + 3, r * ch / 4 + 3, cw / 16 - 6, ch / 4 - 6); c.fillStyle = "#e9d6a8"; c.fillRect(k * cw / 16 + cw / 32 - 6, r * ch / 4 + ch / 8 - 3, 12, 6); c.fillStyle = "#c9a14a"; c.fillRect(k * cw / 16 + cw / 32 - 3, r * ch / 4 + ch / 8 + 6, 6, 3); } }, 1024, 128);
  catT.wrapS = THREE.RepeatWrapping; catT.repeat.set(3, 1);
  const drawers = new THREE.Mesh(new THREE.CylinderGeometry(2.77, 2.77, 0.85, 64, 1, true), new THREE.MeshStandardMaterial({ map: catT, roughness: 0.55 })); drawers.position.y = 0.72; gCat.add(drawers);
  const regT = tex((c, cw, ch) => { c.fillStyle = "#f3ead8"; c.fillRect(0, 0, cw, ch); c.fillStyle = "#6b4a32"; c.fillRect(cw / 2 - 2, 0, 4, ch); c.font = "12px Georgia, serif"; for (let i = 0; i < 12; i++) { c.fillRect(14, 20 + i * 9, 90 - (i * 13) % 40, 2); c.fillRect(cw / 2 + 14, 20 + i * 9, 90 - (i * 7) % 40, 2); } }, 256, 128);
  const reg = plane(0.9, 0.45, new THREE.MeshStandardMaterial({ map: regT, roughness: 0.8 }), 0, 1.46, 0.2, 0, gCat); reg.rotation.x = -Math.PI / 2 + 0.2;

  /* ---- radial reading desks with lamps and chairs ---- */
  const deskPts = [];
  for (let j = 0; j < 16; j++) {
    const a = (j + 0.5) / 16 * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - (-Math.PI / 2)), Math.cos(a - (-Math.PI / 2)))) < 0.3) continue;   // keep an aisle to the entrance
    [6.9, 10.1].forEach(r => deskPts.push([a, r]));
  }
  const DN = deskPts.length, deskTop = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.07, 0.95), oakM, DN), deskBody = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.7, 0.6), darkOak, DN);
  const lampBase = new THREE.InstancedMesh(mergeGeos([new THREE.CylinderGeometry(0.07, 0.09, 0.04, 12).translate(0, 0.02, 0), new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6).translate(0, 0.2, 0)]), goldM, DN * 2);
  const lampShade = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.13, 0.12, 16, 1, true).translate(0, 0.42, 0), new THREE.MeshStandardMaterial({ color: 0x2e6b46, emissive: 0xffd28a, emissiveIntensity: 0.35, roughness: 0.4, side: THREE.DoubleSide }), DN * 2);
  const chairG = mergeGeos([new THREE.BoxGeometry(0.44, 0.06, 0.42).translate(0, 0.46, 0), new THREE.BoxGeometry(0.44, 0.5, 0.05).translate(0, 0.72, -0.19), ...[[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].map(([x, z]) => new THREE.BoxGeometry(0.04, 0.46, 0.04).translate(x, 0.23, z))]);
  const chairs = new THREE.InstancedMesh(chairG, oakM, DN * 4);
  const q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  LIBFX.seats = []; LIBFX.chairs = chairs;   // (life.js puts readers in some of them, and things on the desks)
  deskPts.forEach(([a, r], i) => {
    const d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), t = new THREE.Vector3(-d.z, 0, d.x), c = d.clone().multiplyScalar(r), rotY = -a;
    q.setFromEuler(new THREE.Euler(0, rotY, 0));
    m4.compose(c.clone().setY(0.8), q, one); deskTop.setMatrixAt(i, m4);
    m4.compose(c.clone().setY(0.42), q, one); deskBody.setMatrixAt(i, m4);
    [-0.7, 0.7].forEach((o, li) => { m4.compose(c.clone().addScaledVector(d, o).setY(0.835), q, one); lampBase.setMatrixAt(i * 2 + li, m4); lampShade.setMatrixAt(i * 2 + li, m4); });
    [[-0.7, 1], [0.7, 1], [-0.7, -1], [0.7, -1]].forEach(([o, sd], ci) => {
      const pull = rnd() < 0.3 ? 0.06 + rnd() * 0.16 : rnd() * 0.04, turn = (rnd() - 0.5) * (pull > 0.05 ? 0.6 : 0.08);   // some chairs left pushed back, or turned
      const p = c.clone().addScaledVector(d, o).addScaledVector(t, sd * (0.78 + pull)); const cq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(-t.x * sd, -t.z * sd) + turn, 0));
      m4.compose(p, cq, one); chairs.setMatrixAt(i * 4 + ci, m4);
      LIBFX.seats.push({ i: i * 4 + ci, r: r + o, sd, d: [d.x, d.z], t: [t.x, t.z] });
    });
  });
  [deskTop, deskBody, lampBase, chairs].forEach(m => { m.castShadow = m.receiveShadow = true; library.add(m); });
  library.add(lampShade); LIBFX.lamps = lampShade.material;
  library.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
  LIBFX.clock = wallClock(bays[LIB.ENT], 0, LIB.UP_SPRING + 0.4, -R + 0.25, 1.1).h.parent;
}
