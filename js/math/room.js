/* js/math/room.js — The Mathematics building's hall, given over to one open problem: Yang–Mills existence and the mass gap.
   A dark gallery with a live lattice gauge field glowing in the middle, a blackboard of the equations, a confining flux
   tube between two colour charges, a Hopf fibration (SU(2) is a 3-sphere), the lattice glueball spectrum with its gap,
   and a wall of the seven Millennium Prize Problems beside the prize rules.
   Coordinates: centre of the floor at the origin; entrance on the right wall (+x); blackboard on the back wall (−z).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const mathRoom = new THREE.Group(); mathRoom.visible = false; scene.add(mathRoom);
let mathBuilt = false;
const MR = { X: 15, Z: 12, H: 9 };
const MFX = { lattice: null, links: null, plaqs: null, nodes: null, flux: null, fluxCore: null, charges: [], halos: [], hopf: null, glow: [], t: 0, frame: 0 };

/* ---------- canvas helpers ---------- */
function chalkTex(w, h, draw) {
  return ctex(w, h, (g, cw, ch) => {
    const gr = g.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, "#1d2b26"); gr.addColorStop(1, "#16211d"); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
    const rnd = seeded(3); for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.035})`; g.fillRect(rnd() * cw, rnd() * ch, 1 + rnd() * 40, 1 + rnd() * 3); }
    g.fillStyle = "#e9efe8"; g.strokeStyle = "#e9efe8"; g.textBaseline = "alphabetic"; draw(g, cw, ch);
  });
}
const chalk = (g, txt, x, y, size, opts) => { g.font = `${(opts && opts.style) || "italic"} ${size}px Georgia, 'Times New Roman', serif`; g.fillStyle = (opts && opts.color) || "rgba(236,242,235,0.94)"; g.textAlign = (opts && opts.align) || "left"; g.fillText(txt, x, y); };

/* ---------- the hall ---------- */
function buildMathRoom() {
  const X = MR.X, Z = MR.Z, H = MR.H;
  // floor: dark walnut with a faint inlaid grid, the lattice motif
  const floorT = ctex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#2a1f18"; g.fillRect(0, 0, w, h); const rnd = seeded(14);
    for (let i = 0; i < 64; i++) { const y = i * h / 64; g.fillStyle = `rgba(${80 + rnd() * 40},${55 + rnd() * 25},${35 + rnd() * 15},${0.25 + rnd() * 0.2})`; g.fillRect(0, y, w, h / 64 - 2); }
    g.strokeStyle = "rgba(201,161,74,0.35)"; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
  });
  floorT.repeat.set(X * 2 / 8, Z * 2 / 8);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X * 2, Z * 2), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.35, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; mathRoom.add(floor);
  // walls: deep navy panelling with brass rails; ceiling with a glowing grid of light panels
  const wallT = ctex(512, 512, (g, w, h) => { g.fillStyle = "#1a2134"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 6; g.strokeRect(20, 20, w - 40, h - 40); g.strokeStyle = "rgba(0,0,0,0.25)"; g.strokeRect(34, 34, w - 68, h - 68); });
  const wallM = new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.8 }), brass = mat(0xc9a14a, { metalness: 0.75, roughness: 0.32 });
  const wall = (w, x, z, ry) => { wallT.repeat.set(1, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wallM.clone()); m.material.map = wallT.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(w / 3, H / 3); m.position.set(x, H / 2, z); m.rotation.y = ry; m.receiveShadow = true; mathRoom.add(m); return m; };
  wall(X * 2, 0, -Z, 0); wall(X * 2, 0, Z, Math.PI); wall(Z * 2, -X, 0, Math.PI / 2); wall(Z * 2, X, 0, -Math.PI / 2);
  [[X * 2, 0, -Z + 0.04, 0], [X * 2, 0, Z - 0.04, Math.PI], [Z * 2, -X + 0.04, 0, Math.PI / 2], [Z * 2, X - 0.04, 0, -Math.PI / 2]].forEach(([w, x, z, ry]) => {
    [1.1, H - 0.5].forEach(y => { const r = box(w, 0.08, 0.06, brass, x, y, z, mathRoom); r.rotation.y = ry; r.castShadow = false; });
    const sk = box(w, 0.3, 0.08, mat(0x10141f, { roughness: 0.6 }), x, 0.15, z, mathRoom); sk.rotation.y = ry;
  });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(X * 2, Z * 2), new THREE.MeshStandardMaterial({ color: 0x121726, roughness: 0.9 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; mathRoom.add(ceil);
  const panelM = new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false });
  for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), panelM); p.rotation.x = Math.PI / 2; p.position.set(i * 5.6, H - 0.01, j * 6.6); mathRoom.add(p); }

  buildMathBoard(); buildMathLattice(); buildMathFlux(); buildMathHopf(); buildMathGlueballs(); buildMathPrizeWall(); buildMathDoor();
}

/* ---------- the blackboard: the problem in equations ---------- */
function buildMathBoard() {
  const W = 13, Hh = 4.7, y0 = 1.6, z = -MR.Z + 0.06;
  const g = hotGroup("mathProblem", "The problem", new THREE.Vector3(0, y0 + Hh + 0.35, z + 0.2), mathRoom, "math");
  const t = chalkTex(3072, 1104, (c, w, h) => {
    chalk(c, "Yang–Mills existence and mass gap", 90, 120, 92, { style: "700" });
    chalk(c, "Prove: for every compact simple gauge group G, a non-trivial quantum Yang–Mills theory", 90, 210, 54, { style: "" });
    chalk(c, "exists on ℝ⁴ (with axioms at least as strong as Wightman / Osterwalder–Schrader) and has a mass gap Δ > 0.", 90, 280, 54, { style: "" });
    c.strokeStyle = "rgba(236,242,235,0.5)"; c.lineWidth = 3; c.beginPath(); c.moveTo(90, 320); c.lineTo(w - 90, 320); c.stroke();
    const L = 110, R = w / 2 + 70;
    chalk(c, "curvature of a connection A", L, 420, 44, { color: "rgba(180,220,255,0.85)", style: "" });
    chalk(c, "F  =  dA + A ∧ A", L, 520, 88);
    chalk(c, "Yang–Mills equations", L, 640, 44, { color: "rgba(180,220,255,0.85)", style: "" });
    chalk(c, "d_A F = 0 ,   d_A ⋆F = 0", L, 740, 80);
    chalk(c, "action", L, 860, 44, { color: "rgba(180,220,255,0.85)", style: "" });
    chalk(c, "S  =  (1 / 4g²) ∫ Tr F ∧ ⋆F", L, 960, 80);
    chalk(c, "on a lattice (Wilson), for SU(N)", R, 420, 44, { color: "rgba(180,220,255,0.85)", style: "" });
    chalk(c, "S  =  β Σₚ ( 1 − (1/N) Re Tr Uₚ )", R, 520, 78);
    chalk(c, "the gap: H Ω = 0, and", R, 640, 44, { color: "rgba(255,214,140,0.9)", style: "" });
    chalk(c, "spec H  ⊂  {0} ∪ [ Δ , ∞ ) ,   Δ > 0", R, 740, 80, { color: "rgba(255,228,170,0.97)" });
    chalk(c, "so correlations die off exponentially", R, 860, 44, { color: "rgba(180,220,255,0.85)", style: "" });
    chalk(c, "⟨ O(x) O(0) ⟩ − ⟨O⟩²  ~  e^(−Δ |x|)", R, 960, 76);
    chalk(c, "Clay Millennium Prize Problem · open since 24 May 2000 · $1,000,000", w - 90, h - 50, 40, { align: "right", style: "", color: "rgba(236,242,235,0.6)" });
  });
  t.anisotropy = 8;
  const frame = box(W + 0.36, Hh + 0.36, 0.12, mat(0x5a3d26, { roughness: 0.6 }), 0, y0 + Hh / 2, z, g); frame.castShadow = false;
  const board = plane(W, Hh, new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18 }), 0, y0 + Hh / 2, z + 0.07, 0, g);
  box(W, 0.08, 0.22, mat(0x6b4a30), 0, y0 - 0.02, z + 0.14, g);
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(0, y0 + Hh / 2, z), size: new THREE.Vector3(W + 0.6, Hh + 0.8, 1) }; hotspots[hotspots.length - 1].front = [0, 0, 1];
  // a picture light over the board
  const bl = new THREE.SpotLight(0xfff0d8, 1.4, 16, 0.75, 0.6, 1.2); bl.position.set(0, MR.H - 0.4, -MR.Z + 5); bl.target.position.set(0, y0 + Hh / 2, z); mathRoom.add(bl, bl.target);
}

/* ---------- the lattice: a live SU(2) gauge field hovering over a glowing plinth ---------- */
function buildMathLattice() {
  const L = LAT.L, a = 0.5, off = -(L - 1) * a / 2;
  const g = hotGroup("mathLattice", "Live lattice gauge field", new THREE.Vector3(0, 5.3, 1), mathRoom, "math"); g.position.z = 1;
  const holo = new THREE.Group(); holo.position.y = 3.2; g.add(holo); MFX.lattice = holo;
  // plinth with a ring of light
  cyl(1.9, 2.15, 0.5, mat(0x1b2236, { roughness: 0.4, metalness: 0.3 }), 0, 0.25, 0, g, 64);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.035, 8, 96), new THREE.MeshBasicMaterial({ color: 0x5ff0dc, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.52; g.add(ring);
  const beamT = ctex(32, 256, (c, w, h) => { const l = c.createLinearGradient(0, 0, 0, h); l.addColorStop(0, "rgba(95,240,220,0)"); l.addColorStop(1, "rgba(95,240,220,0.32)"); c.fillStyle = l; c.fillRect(0, 0, w, h); });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.86, 2.2, 64, 1, true), new THREE.MeshBasicMaterial({ map: beamT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  beam.position.y = 1.6; g.add(beam);
  const pos = s => { const p = latSite(s); return new THREE.Vector3(off + p[0] * a, off + p[1] * a, off + p[2] * a); };
  // sites
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdffcff, toneMapped: false }), LAT.N), m4 = new THREE.Matrix4();
  for (let s = 0; s < LAT.N; s++) { m4.makeTranslation(...pos(s).toArray()); nodes.setMatrixAt(s, m4); } holo.add(nodes); MFX.nodes = nodes;
  // links: thin rods, coloured each frame by their SU(2) angle
  const rod = new THREE.CylinderGeometry(0.009, 0.009, a, 6).rotateZ(-Math.PI / 2).translate(a / 2, 0, 0);
  const links = new THREE.InstancedMesh(rod, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), LAT.N * 3), q = new THREE.Quaternion();
  const dirs = [new THREE.Euler(0, 0, 0), new THREE.Euler(0, 0, Math.PI / 2), new THREE.Euler(0, -Math.PI / 2, 0)];
  for (let s = 0; s < LAT.N; s++) for (let mu = 0; mu < 3; mu++) { q.setFromEuler(dirs[mu]); m4.compose(pos(s), q, new THREE.Vector3(1, 1, 1)); links.setMatrixAt(s * 3 + mu, m4); links.setColorAt(s * 3 + mu, new THREE.Color(0x5ff0dc)); }
  holo.add(links); MFX.links = links;
  // plaquettes: squares in the xy, yz and zx planes, glowing with their energy 1 - ½Tr U_p
  const sq = new THREE.PlaneGeometry(a * 0.86, a * 0.86);
  const plaqs = new THREE.InstancedMesh(sq, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), LAT.N * 3);
  const pl = [[new THREE.Euler(0, 0, 0), [0.5, 0.5, 0]], [new THREE.Euler(0, Math.PI / 2, 0), [0, 0.5, 0.5]], [new THREE.Euler(Math.PI / 2, 0, 0), [0.5, 0, 0.5]]];
  for (let s = 0; s < LAT.N; s++) pl.forEach(([e, o], p) => { q.setFromEuler(e); m4.compose(pos(s).add(new THREE.Vector3(o[0] * a, o[1] * a, o[2] * a)), q, new THREE.Vector3(1, 1, 1)); plaqs.setMatrixAt(s * 3 + p, m4); plaqs.setColorAt(s * 3 + p, new THREE.Color(0)); });
  holo.add(plaqs); MFX.plaqs = plaqs;
  // a soft halo behind it all
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: mathGlowTex(), color: 0x3fb8c8, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); halo.scale.set(6.5, 6.5, 1); holo.add(halo);
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(0, 3.0, 1), size: new THREE.Vector3(3.6, 4.2, 3.6) }; hotspots[hotspots.length - 1].front = [0.35, 0, 1];
}
function mathGlowTex() { return mathGlowTex.t || (mathGlowTex.t = ctex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,255,255,0.9)"); r.addColorStop(0.3, "rgba(255,255,255,0.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); })); }
// colours: links from teal (near the identity) to magenta (far); plaquettes from black (no action) through teal to gold
const _lc = new THREE.Color(), _la = new THREE.Color(0x3fe0d0), _lb = new THREE.Color(0xff5fd2), _pa = new THREE.Color(0x38c8ff), _pb = new THREE.Color(0xffc861);
function mathLatticeColors() {
  for (let l = 0; l < LAT.N * 3; l++) { const th = Math.acos(Math.max(-1, Math.min(1, LAT.U[l * 4]))) / Math.PI; MFX.links.setColorAt(l, _lc.copy(_la).lerp(_lb, Math.min(1, th * 1.8)).multiplyScalar(0.45 + th * 0.55)); }
  for (let p = 0; p < LAT.N * 3; p++) { const e = Math.max(0, Math.min(1, (LAT.E[p] - 0.25) / 1.1)); MFX.plaqs.setColorAt(p, _lc.copy(_pa).lerp(_pb, e).multiplyScalar(e * e * 0.22)); }
  MFX.links.instanceColor.needsUpdate = true; MFX.plaqs.instanceColor.needsUpdate = true;
}

/* ---------- confinement: the colour field between a quark and an antiquark squeezes into a tube ---------- */
function buildMathFlux() {
  const cx = 9.4, cz = 3.2;
  const g = hotGroup("mathFlux", "Confinement", new THREE.Vector3(cx, 4.2, cz), mathRoom, "math");
  box(6.4, 0.9, 1.6, mat(0x1b2236, { roughness: 0.4, metalness: 0.3 }), cx, 0.45, cz, g);
  const strip = box(6.0, 0.02, 0.06, new THREE.MeshBasicMaterial({ color: 0x5ff0dc, toneMapped: false }), cx, 0.91, cz + 0.79, g); strip.castShadow = false;
  const rig = new THREE.Group(); rig.position.set(cx, 2.35, cz); g.add(rig); MFX.fluxRig = rig;
  // the bundle of field lines, built once in unit length along x and stretched to the separation
  const lines = [], N = 22;
  for (let k = 0; k < N; k++) {
    const ph = k / N * Math.PI * 2, ring = k % 2 ? 0.16 : 0.27;
    const pts = []; for (let i = 0; i <= 60; i++) { const s = i / 60, bulge = Math.sin(Math.PI * s), flare = Math.exp(-s * 18) + Math.exp(-(1 - s) * 18); const r = ring * (0.25 + 0.75 * Math.min(1, bulge * 3)) + flare * 0.55 * (1 - ring); pts.push(new THREE.Vector3(s - 0.5, Math.cos(ph) * r, Math.sin(ph) * r)); }
    lines.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.012, 5, false));
  }
  // merge the tubes, keeping uv.x (distance along each line) for the flowing light
  const parts = lines.map(l => l.toNonIndexed()), n = parts.reduce((t, l) => t + l.attributes.position.count, 0), P = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
  parts.forEach(l => { P.set(l.attributes.position.array, o * 3); U.set(l.attributes.uv.array, o * 2); o += l.attributes.position.count; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(P, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(U, 2));
  MFX.flux = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: "varying float vS; void main(){ vS = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float uT; varying float vS; void main(){ vec3 c = mix(vec3(1.0,0.35,0.3), vec3(0.3,0.95,1.0), vS); float f = 0.35 + 0.65 * pow(0.5 + 0.5 * sin((vS * 16.0 - uT * 3.0) * 6.2831), 6.0); gl_FragColor = vec4(c * f * 1.4, f); }" }));
  rig.add(MFX.flux);
  // the tube itself, a soft glowing sheath of fixed width
  MFX.fluxCore = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 32, 1, true).rotateZ(Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vV = normalize(-(modelViewMatrix * vec4(position,1.0)).xyz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(vN, vV)); gl_FragColor = vec4(vec3(0.75,0.6,1.0) * f * 0.5, f * 0.5); }" }));
  rig.add(MFX.fluxCore);
  // the two charges: a red quark and its anti-red antiquark (cyan), each with a halo
  [[0xff5a4a, -1], [0x4ff0ff, 1]].forEach(([c, s]) => {
    const q = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), new THREE.MeshBasicMaterial({ color: c, toneMapped: false })); rig.add(q); MFX.charges.push(q);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: mathGlowTex(), color: c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); h.scale.set(1.3, 1.3, 1); rig.add(h); MFX.halos.push(h);
  });
  // a little engraved label on the plinth
  const lab = ctex(1024, 128, (c, w, h) => { c.fillStyle = "#1b2236"; c.fillRect(0, 0, w, h); c.fillStyle = "#d9c08a"; c.font = "600 46px Georgia, serif"; c.textAlign = "center"; c.fillText("V(r) ≈ σ r   ·   the energy grows with distance", w / 2, h * 0.64); });
  plane(4.8, 0.6, new THREE.MeshBasicMaterial({ map: lab }), cx, 0.45, cz + 0.81, 0, g);
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(cx, 1.8, cz), size: new THREE.Vector3(6.6, 3.2, 1.8) }; hotspots[hotspots.length - 1].front = [-0.25, 0, 1];
}
function mathFluxUpdate(t) {
  const r = 3.4 + 1.6 * Math.sin(t * 0.45);           // the charges drift apart and back
  MFX.flux.scale.x = r; MFX.fluxCore.scale.x = r - 0.3; MFX.flux.material.uniforms.uT.value = t;
  MFX.charges[0].position.x = MFX.halos[0].position.x = -r / 2; MFX.charges[1].position.x = MFX.halos[1].position.x = r / 2;
}

/* ---------- the Hopf fibration: SU(2) is the 3-sphere, and every point of a 2-sphere pulls back to a circle ---------- */
function buildMathHopf() {
  const cx = -9.4, cz = 3.2;
  const g = hotGroup("mathHopf", "SU(2) and bundles", new THREE.Vector3(cx, 5.5, cz), mathRoom, "math");
  cyl(1.4, 1.6, 0.9, mat(0x1b2236, { roughness: 0.4, metalness: 0.3 }), cx, 0.45, cz, g, 48);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.03, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffc861, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.set(cx, 0.92, cz); g.add(ring);
  const sculpt = new THREE.Group(); sculpt.position.set(cx, 3.0, cz); g.add(sculpt); MFX.hopf = sculpt;
  // fibre over the base point (θ, φ) of S²: { (cos(θ/2) e^{iψ}, sin(θ/2) e^{i(ψ+φ)}) }, stereographically projected to ℝ³
  const geos = [], col = new THREE.Color();
  [0.55, 1.05, 1.5, 1.95].forEach((th, ri) => {
    const n = 14 + ri * 2;
    for (let k = 0; k < n; k++) {
      const ph = k / n * Math.PI * 2 + ri * 0.3, pts = [];
      for (let i = 0; i < 96; i++) {
        const ps = i / 96 * Math.PI * 2, c = Math.cos(th / 2), s = Math.sin(th / 2);
        const x1 = c * Math.cos(ps), x2 = c * Math.sin(ps), x3 = s * Math.cos(ps + ph), x4 = s * Math.sin(ps + ph), d = 1 - x4;
        pts.push(new THREE.Vector3(x1 / d, x3 / d, x2 / d).multiplyScalar(0.62));
      }
      const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 140, 0.013, 5, true);
      col.setHSL(k / n, 0.75, 0.42 + ri * 0.08);
      const cArr = new Float32Array(tg.attributes.position.count * 3); for (let i = 0; i < cArr.length; i += 3) col.toArray(cArr, i);
      tg.setAttribute("color", new THREE.BufferAttribute(cArr, 3)); geos.push(tg);
    }
  });
  const merged = mergeGeos(geos);
  sculpt.add(new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: mathGlowTex(), color: 0xb48cff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); halo.scale.set(5, 5, 1); sculpt.add(halo);
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(cx, 2.6, cz), size: new THREE.Vector3(4.4, 4.6, 4) }; hotspots[hotspots.length - 1].front = [0.25, 0, 1];
}

/* ---------- the evidence: the lattice glueball spectrum, with the gap above the vacuum ---------- */
// SU(3) pure gauge theory, continuum limit: Morningstar & Peardon, hep-lat/9901004, Table VII (MeV; statistical, scale)
const GLUEBALLS = [["0++", 1730, 50, 80], ["2++", 2400, 25, 120], ["0−+", 2590, 40, 130], ["0*++", 2670, 180, 130], ["1+−", 2940, 30, 140], ["2−+", 3100, 30, 150], ["3+−", 3550, 40, 170], ["0*−+", 3640, 60, 180], ["3++", 3690, 40, 180], ["1−−", 3850, 50, 190], ["2*−+", 3890, 40, 190], ["2−−", 3930, 40, 190]];   // every state below 4 GeV; 0*++ and 2*−+ are marked tentative in the paper
function buildMathGlueballs() {
  const x = MR.X - 0.06, cz = -4.4, W = 8.4, Hh = 4.6, y0 = 1.6;
  const g = hotGroup("mathGlue", "The evidence", new THREE.Vector3(x - 0.2, y0 + Hh + 0.35, cz), mathRoom, "math");
  const t = ctex(1680, 920, (c, w, h) => {
    c.fillStyle = "#0b1020"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e8eefc"; c.font = "700 46px 'Bricolage Grotesque', 'Segoe UI', sans-serif"; c.textAlign = "left"; c.fillText("Glueball masses from lattice simulations", 60, 80);
    c.fillStyle = "#a9b6d6"; c.font = "400 28px 'IBM Plex Mono', monospace"; c.fillText("SU(3) Yang–Mills, no quarks · continuum limit · Morningstar & Peardon 1999", 60, 124);
    const L = 210, R = w - 300, T = 170, B = h - 90, my = v => B - v / 4500 * (B - T);
    // axis and grid
    c.strokeStyle = "rgba(169,182,214,0.18)"; c.lineWidth = 2; c.font = "400 26px 'IBM Plex Mono', monospace"; c.fillStyle = "#a9b6d6"; c.textAlign = "right";
    for (let v = 0; v <= 4000; v += 1000) { c.beginPath(); c.moveTo(L, my(v)); c.lineTo(R, my(v)); c.stroke(); c.fillText(v === 0 ? "0" : (v / 1000).toFixed(0) + " GeV", L - 18, my(v) + 9); }
    // the gap
    c.fillStyle = "rgba(255,200,97,0.12)"; c.fillRect(L, my(1730), R - L, my(0) - my(1730));
    c.strokeStyle = "#ffc861"; c.lineWidth = 3; c.beginPath(); c.moveTo(R + 40, my(0)); c.lineTo(R + 40, my(1730)); c.stroke();
    [[0, 1], [1730, -1]].forEach(([v, s]) => { c.beginPath(); c.moveTo(R + 26, my(v)); c.lineTo(R + 54, my(v)); c.stroke(); });
    c.fillStyle = "#ffc861"; c.font = "italic 700 48px Georgia, serif"; c.textAlign = "left"; c.fillText("Δ", R + 64, (my(0) + my(1730)) / 2 + 16);
    c.font = "400 24px 'IBM Plex Mono', monospace"; c.fillText("the gap", R + 64, (my(0) + my(1730)) / 2 + 50);
    // vacuum
    c.strokeStyle = "#e8eefc"; c.lineWidth = 4; c.beginPath(); c.moveTo(L, my(0)); c.lineTo(R, my(0)); c.stroke();
    c.fillStyle = "#e8eefc"; c.font = "400 26px 'IBM Plex Mono', monospace"; c.fillText("vacuum Ω, E = 0", L + 14, my(0) - 14);
    // states, spread across in mass order, with combined error bars
    GLUEBALLS.forEach(([jpc, m, e1, e2], i) => {
      const xx = L + 80 + i * (R - L - 160) / (GLUEBALLS.length - 1), err = Math.hypot(e1, e2);
      c.strokeStyle = "rgba(95,240,220,0.55)"; c.lineWidth = 2; c.beginPath(); c.moveTo(xx, my(m - err)); c.lineTo(xx, my(m + err)); c.stroke();
      c.strokeStyle = "#5ff0dc"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(xx - 22, my(m)); c.lineTo(xx + 22, my(m)); c.stroke();
      c.fillStyle = "#e8eefc"; c.font = "600 24px 'IBM Plex Mono', monospace"; c.textAlign = "center"; c.fillText(jpc, xx, my(m) - (i % 2 ? 22 : 50));
      c.fillStyle = "#a9b6d6"; c.font = "400 20px 'IBM Plex Mono', monospace"; c.fillText(m, xx, my(m) + (i % 2 ? 36 : 60));
    });
    c.fillStyle = "#6f7c9c"; c.font = "400 22px 'IBM Plex Mono', monospace"; c.textAlign = "left"; c.fillText("Evidence for a gap, not a proof of one.  arXiv: hep-lat/9901004, Table VII", 60, h - 30);
  });
  const fr = box(0.12, Hh + 0.3, W + 0.3, mat(0x0a0d18, { roughness: 0.4, metalness: 0.4 }), x, y0 + Hh / 2, cz, g); fr.castShadow = false;
  plane(W, Hh, new THREE.MeshBasicMaterial({ map: t, toneMapped: false }), x - 0.07, y0 + Hh / 2, cz, -Math.PI / 2, g);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(W + 2.4, Hh + 2.2), new THREE.MeshBasicMaterial({ map: mathGlowTex(), color: 0x2a6aa0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glow.position.set(x - 0.03, y0 + Hh / 2, cz); glow.rotation.y = -Math.PI / 2; g.add(glow);
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(x, y0 + Hh / 2, cz), size: new THREE.Vector3(W + 0.6, Hh + 0.8, 1) }; hotspots[hotspots.length - 1].front = [-1, 0, 0];
}

/* ---------- the Millennium wall: seven framed problems, and the prize rules on a brass plaque ---------- */
const MILLENNIUM = [
  ["Yang–Mills and the mass gap", "Open", "Quantum gauge theory on ℝ⁴ exists and has a mass gap"],
  ["Riemann hypothesis", "Open", "Every non-trivial zero of ζ(s) has real part ½"],
  ["P vs NP", "Open", "Is every quickly checkable problem quickly solvable?"],
  ["Navier–Stokes", "Open", "Smooth solutions in 3D exist for all time, or they blow up"],
  ["Hodge conjecture", "Open", "Certain cohomology classes are algebraic"],
  ["Birch and Swinnerton-Dyer", "Open", "An elliptic curve's rank equals its L-function's order of vanishing"],
  ["Poincaré conjecture", "Solved", "Grigori Perelman · prize announced 18 March 2010, declined"],
];
function buildMathPrizeWall() {
  const x = -MR.X + 0.06;
  const g = hotGroup("mathSeven", "The seven problems", new THREE.Vector3(x + 0.3, 6.65, -2.2), mathRoom, "math");
  const fw = 1.9, fh = 2.3, gap = 0.36, z0 = -2.2 - (MILLENNIUM.length - 1) * (fw + gap) / 2;
  MILLENNIUM.forEach(([name, status, line], i) => {
    const solved = status === "Solved", z = z0 + i * (fw + gap), y = 4.9;
    const t = ctex(512, 620, (c, w, h) => {
      c.fillStyle = solved ? "#2a2110" : "#141a2c"; c.fillRect(0, 0, w, h);
      c.strokeStyle = solved ? "#ffc861" : "rgba(201,161,74,0.6)"; c.lineWidth = 6; c.strokeRect(24, 24, w - 48, h - 48);
      c.fillStyle = solved ? "#ffc861" : "#5ff0dc"; c.font = "600 30px 'IBM Plex Mono', monospace"; c.textAlign = "center"; c.fillText(status.toUpperCase(), w / 2, 92);
      c.fillStyle = "#f3ead8"; c.font = "700 50px Georgia, serif";
      const words = name.split(" "), lines = []; let cur = "";
      words.forEach(wd => { const tryL = cur ? cur + " " + wd : wd; if (c.measureText(tryL).width > w - 90) { lines.push(cur); cur = wd; } else cur = tryL; }); lines.push(cur);
      lines.forEach((l, k) => c.fillText(l, w / 2, 200 + k * 62));
      c.fillStyle = "#b9b2a2"; c.font = "italic 30px Georgia, serif";
      const w2 = line.split(" "), l2 = []; cur = ""; w2.forEach(wd => { const tryL = cur ? cur + " " + wd : wd; if (c.measureText(tryL).width > w - 100) { l2.push(cur); cur = wd; } else cur = tryL; }); l2.push(cur);
      l2.forEach((l, k) => c.fillText(l, w / 2, 220 + lines.length * 62 + 30 + k * 40));
      c.fillStyle = "rgba(201,161,74,0.7)"; c.font = "500 26px 'IBM Plex Mono', monospace"; c.fillText("$1,000,000", w / 2, h - 60);
    });
    const fr = box(0.08, fh + 0.16, fw + 0.16, solved ? mat(0xd9b45a, { metalness: 0.8, roughness: 0.25 }) : mat(0x6b4a30, { roughness: 0.5 }), x, y, z, g); fr.castShadow = false;
    plane(fw, fh, new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.22 }), x + 0.05, y, z, Math.PI / 2, g);
  });
  const title = ctex(1024, 96, (c, w, h) => { c.fillStyle = "#e9d6a8"; c.font = "600 44px Georgia, serif"; c.textAlign = "center"; c.fillText("THE MILLENNIUM PRIZE PROBLEMS · 2000", w / 2, h * 0.7); });
  plane(7.6, 0.72, new THREE.MeshBasicMaterial({ map: title, transparent: true }), x + 0.05, 6.4, -2.2, Math.PI / 2, g);
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(x, 4.9, -2.2), size: new THREE.Vector3(16.4, 3.4, 1) }; hotspots[hotspots.length - 1].front = [1, 0, 0];
  // the rules: a brass plaque on a stand, near the front of the left wall
  const rx = -12.4, rz = 8.6;
  const gr = hotGroup("mathRules", "Prize rules", new THREE.Vector3(rx, 2.45, rz), mathRoom, "math");
  cyl(0.06, 0.06, 1.25, mat(0x2a2f38, { metalness: 0.7, roughness: 0.3 }), rx, 0.62, rz, gr, 12); cyl(0.32, 0.36, 0.06, mat(0x2a2f38, { metalness: 0.7, roughness: 0.3 }), rx, 0.03, rz, gr, 24);
  const rt = ctex(800, 560, (c, w, h) => {
    const gg = c.createLinearGradient(0, 0, w, h); gg.addColorStop(0, "#b8913f"); gg.addColorStop(0.5, "#d9b45a"); gg.addColorStop(1, "#9c7a33"); c.fillStyle = gg; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(60,40,10,0.6)"; c.lineWidth = 8; c.strokeRect(18, 18, w - 36, h - 36);
    c.fillStyle = "#3a2a10"; c.textAlign = "center"; c.font = "700 44px Georgia, serif"; c.fillText("Rules for the Millennium Prizes", w / 2, 92);
    c.font = "italic 26px Georgia, serif"; c.fillText("Clay Mathematics Institute · revised 26 September 2018", w / 2, 132);
    c.textAlign = "left"; c.font = "30px Georgia, serif";
    ["1. Published in a qualifying refereed outlet", "2. At least two years since publication", "3. Generally accepted by mathematicians", "4. Answers the problem's official description", "5. No direct submissions to the Institute", "$1,000,000 per problem, may be shared"].forEach((l, i) => c.fillText(l, 70, 196 + i * 56));
  });
  const plaque = plane(1.5, 1.05, new THREE.MeshStandardMaterial({ map: rt, metalness: 0.6, roughness: 0.35, emissive: 0xffffff, emissiveMap: rt, emissiveIntensity: 0.12 }), rx, 1.5, rz, Math.PI / 2, gr);
  plaque.rotation.set(0, Math.atan2(0.85, -0.5), 0); plaque.rotateX(-0.45);       // faces into the hall, the way the camera comes in (front)
  hotspots[hotspots.length - 1].focus = { center: new THREE.Vector3(rx, 1.4, rz), size: new THREE.Vector3(2.2, 2.4, 1.2) }; hotspots[hotspots.length - 1].front = [0.85, 0, -0.5];
}

/* ---------- the way out ---------- */
function buildMathDoor() {
  const x = MR.X - 0.06, z = 8.0;
  const g = hotGroup("mathExit", "Exit", new THREE.Vector3(x - 0.2, 3.6, z), mathRoom, "math");
  const fr = box(0.14, 3.3, 2.5, mat(0x0a0d18, { metalness: 0.5, roughness: 0.4 }), x, 1.65, z, g); fr.castShadow = false;
  [-0.58, 0.58].forEach(dz => { box(0.06, 3.0, 1.1, mat(0x1d2a33, { metalness: 0.6, roughness: 0.2 }), x - 0.08, 1.5, z + dz, g); box(0.05, 0.7, 0.04, mat(0xc9a14a, { metalness: 0.8, roughness: 0.3 }), x - 0.14, 1.35, z + dz * 0.25, g); });
  const sign = ctex(512, 96, (c, w, h) => { c.fillStyle = "#0a0d18"; c.fillRect(0, 0, w, h); c.fillStyle = "#5ff0dc"; c.font = "600 40px 'IBM Plex Mono', monospace"; c.textAlign = "center"; c.fillText("EXIT TO CAMPUS", w / 2, h * 0.66); });
  plane(1.8, 0.34, new THREE.MeshBasicMaterial({ map: sign, toneMapped: false }), x - 0.09, 3.1, z, -Math.PI / 2, g);
}

/* ---------- per frame ---------- */
function updateMath(dt, time) {
  MFX.t += dt; MFX.frame++;
  if (MFX.frame % 3 === 0) { latSweep(); latMeasure(); mathLatticeColors(); mathLatticeReadout(); }
  MFX.lattice.rotation.y += dt * 0.12; MFX.lattice.rotation.x = Math.sin(MFX.t * 0.2) * 0.12;
  mathFluxUpdate(MFX.t);
  MFX.hopf.rotation.y += dt * 0.18; MFX.hopf.rotation.z = Math.sin(MFX.t * 0.3) * 0.25;
  hemi.intensity = night ? 0.22 : 0.5; sun.intensity = night ? 0.15 : 0.55; fill.intensity = night ? 0.03 : 0.12;
  const f = libFov(); if (Math.abs(camera.fov - f) > 0.1) { camera.fov = f; camera.updateProjectionMatrix(); }
  mathClampCamera();
}
