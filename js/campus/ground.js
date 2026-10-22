/* js/campus/ground.js — Ground and hills, paths with curbs, the plaza's radial paving, and soft contact shadows.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// ground: flat campus rolling into hills
function buildGround() {
  /* ---- ground: flat campus rolling into hills, with macro colour variation ---- */
  const grassDetail = ctex(512, 512, (g, w, h) => {
    g.fillStyle = "#6f9a4c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const k = Math.random(), x = Math.random() * w, y = Math.random() * h; g.fillStyle = k < 0.3 ? "rgba(46,84,32,0.45)" : k < 0.6 ? "rgba(150,190,96,0.35)" : k < 0.85 ? "rgba(88,128,58,0.45)" : "rgba(170,160,96,0.3)"; g.save(); g.translate(x, y); g.rotate(Math.random() * 6.28); g.fillRect(0, 0, 1.2, 3 + Math.random() * 4); g.restore(); }
  });
  grassDetail.repeat.set(140, 140);
  const groundGeo = new THREE.PlaneGeometry(760, 760, 190, 190); groundGeo.rotateX(-Math.PI / 2);
  { const p = groundGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, hillH(p.getX(i), p.getZ(i))); groundGeo.computeVertexNormals(); }
  paint(groundGeo, (x, y, z, c) => { const n = fbm(x * 0.05, 3.1, z * 0.05, 3), m = fbm(x * 0.012, 7.7, z * 0.012, 2); c.setRGB(0.66 + n * 0.28 - m * 0.1, 0.74 + n * 0.2, 0.52 + n * 0.16 - m * 0.12); if (y > 6) c.multiplyScalar(0.92); });
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ map: grassDetail, vertexColors: true, roughness: 0.96 })); ground.receiveShadow = true; world.add(ground);
}

// paths and plaza paving
function buildPaths() {
  /* ---- paths with curbs; plaza with radial pavers ---- */
  const pc = canvasOf(512, 512), ph = canvasOf(512, 512), pg = pc.getContext("2d"), phg = ph.getContext("2d");
  pg.fillStyle = "#cfcac0"; pg.fillRect(0, 0, 512, 512); phg.fillStyle = "#808080"; phg.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const x = Math.random() * 512, y = Math.random() * 512, k = Math.random(); pg.fillStyle = k < 0.45 ? "rgba(255,255,255,0.4)" : k < 0.9 ? "rgba(96,90,82,0.28)" : "rgba(150,120,90,0.35)"; pg.fillRect(x, y, 1.5, 1.5); phg.fillStyle = k < 0.5 ? "#909090" : "#707070"; phg.fillRect(x, y, 1.5, 1.5); }
  for (let i = 0; i < 6; i++) { const x = Math.random() * 512, y = Math.random() * 512, r = 30 + Math.random() * 60, gr = pg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(120,112,100,0.12)"); gr.addColorStop(1, "rgba(120,112,100,0)"); pg.fillStyle = gr; pg.fillRect(x - r, y - r, r * 2, r * 2); }
  pg.fillStyle = "rgba(92,86,78,0.7)"; pg.fillRect(0, 0, 512, 3); pg.fillRect(0, 255, 512, 2); phg.fillStyle = "#303030"; phg.fillRect(0, 0, 512, 3); phg.fillRect(0, 255, 512, 2);
  pathSet = { map: new THREE.CanvasTexture(pc), normalMap: normalFrom(ph, 4) }; pathSet.map.encoding = THREE.sRGBEncoding; pathSet.map.wrapS = pathSet.map.wrapT = THREE.RepeatWrapping; pathSet.map.anisotropy = 8;
  const curbMat = mat(0xd8d4cb, { roughness: 0.85 });
  let pathY = 0.012;
  function path(x1, z1, x2, z2, w) {
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), set = setRepeat(pathSet, w / 3, L / 3), ang = Math.atan2(-dx, -dz);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, L), new THREE.MeshStandardMaterial({ ...set, roughness: 0.9 }));
    m.rotation.set(-Math.PI / 2, 0, ang); m.position.set((x1 + x2) / 2, pathY += 0.0004, (z1 + z2) / 2); m.receiveShadow = true; world.add(m);
    [-1, 1].forEach(sd => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, L), curbMat); c.position.set((x1 + x2) / 2 + (-dz / L) * sd * (w / 2 + 0.08), 0.016, (z1 + z2) / 2 + (dx / L) * sd * (w / 2 + 0.07)); c.rotation.y = Math.atan2(dx, dz); c.receiveShadow = true; world.add(c); });
    CAMPUS.paths.push([x1, z1, x2, z2, w]);
  }
  path(0, -18, 0, -11.2, 3.2); path(11.2, 0, 32, 0, 3.4); path(-11.2, 0, -32, 0, 3.4); path(0, 11.2, 0, 36, 3.6);
  path(8, 8, 21.5, 23.5, 3); path(-8, 8, -21, 21, 3); path(-8, -8, -16.5, -8.4, 2.6);
  const PS = 2048, PC = PS / 2, plc = canvasOf(PS, PS), plh = canvasOf(PS, PS), plg = plc.getContext("2d"), plhg = plh.getContext("2d");
  plg.fillStyle = "#8d877d"; plg.fillRect(0, 0, PS, PS); plhg.fillStyle = "#303030"; plhg.fillRect(0, 0, PS, PS);
  for (let r = 40, ring = 0; r < PC; r += 44, ring++) {
    const n = Math.max(6, Math.round(2 * Math.PI * r / 68)), band = r > 840 && r < 900;
    for (let k = 0; k < n; k++) {
      const a0 = (k + (ring % 2) * 0.5) / n * 6.283, a1 = a0 + 6.283 / n - 3 / r, v = ((k * 7 + r) % 9) * 4;
      plg.fillStyle = band ? `rgb(${120 + v},${118 + v},${112 + v})` : `rgb(${200 + v / 2},${192 + v / 2},${178 + v / 2})`;
      plg.beginPath(); plg.arc(PC, PC, r + 20.5, a0, a1); plg.arc(PC, PC, r - 20.5, a1, a0, true); plg.closePath(); plg.fill();
      plhg.fillStyle = "#a0a0a0"; plhg.beginPath(); plhg.arc(PC, PC, r + 20.5, a0, a1); plhg.arc(PC, PC, r - 20.5, a1, a0, true); plhg.closePath(); plhg.fill();
    }
  }
  for (let i = 0; i < 60000; i++) { plg.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.18)" : "rgba(70,64,56,0.16)"; plg.fillRect(Math.random() * PS, Math.random() * PS, 2, 2); }
  const plMap = new THREE.CanvasTexture(plc); plMap.encoding = THREE.sRGBEncoding; plMap.anisotropy = 8;
  flat(new THREE.CircleGeometry(11.6, 96), new THREE.MeshStandardMaterial({ map: plMap, normalMap: normalFrom(plh, 2), roughness: 0.88 }), 0, 0.018, 0);
  const ringEdge = new THREE.Mesh(new THREE.TorusGeometry(11.62, 0.09, 6, 120), curbMat); ringEdge.rotation.x = Math.PI / 2; ringEdge.position.y = 0.03; ringEdge.scale.z = 0.5; world.add(ringEdge);
  CAMPUS.plazas.push([0, 0, 11]);
}

// contact shadows under trees, benches, cars and lamps (call after everything that adds to blobs)
function buildContactShadows() {
  /* ---- contact shadows under trees, benches, cars, lamps ---- */
  { const BN = blobs.length, bm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.9 }), BN);
    blobs.forEach(([x, z, sx, sz, ry], i) => { tmp.compose(V(x, 0.025, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(sx, 1, sz)); bm.setMatrixAt(i, tmp); }); bm.renderOrder = 1; world.add(bm); }
}
