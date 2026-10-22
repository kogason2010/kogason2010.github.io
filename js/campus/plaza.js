/* js/campus/plaza.js — Plaza furnishings: flower beds, benches and the DNA sculpture.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// flower beds and benches round the fountain
function buildPlaza() {
  /* ---- flower beds round the plaza, benches between the paths ---- */
  const flowerGeo = new THREE.IcosahedronGeometry(0.055, 0), leafGeo = new THREE.IcosahedronGeometry(0.2, 2); { const p = leafGeo.attributes.position, n = leafGeo.attributes.normal, d = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { d.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); n.setXYZ(i, d.x, d.y, d.z); } }
  const FL = 8 * 150, flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), FL), leaves = new THREE.InstancedMesh(leafGeo, windy(new THREE.MeshStandardMaterial({ color: 0x2f5a20, roughness: 0.8 }), 0.04, 0), 8 * 40);
  const fcols = [0xe8505b, 0xf7c548, 0xffffff, 0xb06ad9, 0xff8f3d, 0xf27ba6], tc = new THREE.Color(); let fi = 0, li = 0;
  for (let k = 0; k < 8; k++) {
    const a = (22.5 + k * 45) * Math.PI / 180, bx = Math.cos(a) * 6.7, bz = Math.sin(a) * 6.7;
    wcyl(1.5, 1.55, 0.34, 0xa59d91, bx, 0.17, bz, 40, { roughness: 0.85 }); flat(new THREE.CircleGeometry(1.42, 40), mat(0x4a3526, { roughness: 1 }), bx, 0.345, bz);
    for (let i = 0; i < 40; i++) { const r = Math.sqrt(rnd()) * 1.2, t = rnd() * 6.283, s = 0.8 + rnd() * 0.9; tmp.compose(V(bx + Math.cos(t) * r, 0.38, bz + Math.sin(t) * r), new THREE.Quaternion(), V(s, s * 0.8, s)); leaves.setMatrixAt(li++, tmp); }
    for (let i = 0; i < 150; i++) { const r = Math.sqrt(rnd()) * 1.3, t = rnd() * 6.283; tmp.makeTranslation(bx + Math.cos(t) * r, 0.5 + rnd() * 0.16, bz + Math.sin(t) * r); flowers.setMatrixAt(fi, tmp); flowers.setColorAt(fi++, tc.setHex(fcols[(k + i) % fcols.length])); }
    CAMPUS.circles.push([bx, bz, 1.6, "bed"]);
    bench(Math.cos(a) * 9.7, Math.sin(a) * 9.7, Math.atan2(Math.cos(a), Math.sin(a)));
  }
  flowers.castShadow = leaves.castShadow = true; leaves.receiveShadow = true; world.add(flowers, leaves);
  function bench(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.add(g);
    const wood = mat(0xa0703f, { roughness: 0.62 }), iron = mat(0x2a3034, { roughness: 0.4, metalness: 0.6 });
    [-0.19, -0.065, 0.06].forEach(dz => box(1.72, 0.045, 0.11, wood, 0, 0.46, dz, g));
    [0.6, 0.75].forEach(y => box(1.72, 0.1, 0.04, wood, 0, y, 0.18, g));
    [-0.74, 0.74].forEach(dx => { box(0.05, 0.46, 0.44, iron, dx, 0.23, -0.04, g); box(0.05, 0.45, 0.05, iron, dx, 0.67, 0.19, g); box(0.05, 0.04, 0.4, iron, dx, 0.66, -0.02, g); });
    blobs.push([x, z, 2.2, 1.0, ry]); [-0.5, 0.5].forEach(s => CAMPUS.circles.push([x + Math.cos(ry) * s, z - Math.sin(ry) * s, 0.42, "bench"]));
  }
}

// DNA sculpture
function buildSculpture() {
  /* ---- DNA sculpture ---- */
  FX.dna = new THREE.Group(); FX.dna.position.set(6.8, 0.6, -6.8); world.add(FX.dna);
  wbox(1.6, 0.6, 1.6, 0xbab3a7, 6.8, 0.3, -6.8, { roughness: 0.7 }); wbox(1.75, 0.06, 1.75, 0xd8d2c6, 6.8, 0.62, -6.8);
  const sA = new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.15, metalness: 0.6 }), sB = new THREE.MeshStandardMaterial({ color: 0xc8463c, roughness: 0.15, metalness: 0.6 }), rung = new THREE.MeshStandardMaterial({ color: 0xe9eef0, roughness: 0.2, metalness: 0.8 });
  for (let i = 0; i < 24; i++) {
    const a = i * 0.46, y = 0.15 + i * 0.16, p1 = [Math.cos(a) * 0.55, y, Math.sin(a) * 0.55], p2 = [-p1[0], y, -p1[2]];
    [[p1, sA], [p2, sB]].forEach(([p, m]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12), m); s.position.set(...p); s.castShadow = true; FX.dna.add(s); });
    if (i % 2 === 0) { const r = cyl(0.025, 0.025, 1.1, rung, 0, y, 0, FX.dna, 8); r.rotation.z = Math.PI / 2; r.rotation.y = -a; }
  }
  CAMPUS.circles.push([6.8, -6.8, 1.05, "sculpture"]);
}
