/* js/campus/lamps.js — Street lamps along the paths, their night glow and light pools.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// lamps along the paths
function buildLamps() {
  const lampPts = [];
  CAMPUS.paths.forEach(p => { const L = Math.hypot(p[2] - p[0], p[3] - p[1]), nx = -(p[3] - p[1]) / L, nz = (p[2] - p[0]) / L; for (let d = 3, k = 0; d < L - 1; d += 9, k++) { const s = k % 2 ? 1 : -1, x = p[0] + (p[2] - p[0]) * d / L + nx * s * (p[4] / 2 + 0.8), z = p[1] + (p[3] - p[1]) * d / L + nz * s * (p[4] / 2 + 0.8); if (!hitAt(x, z, 0.5) && Math.hypot(x, z) > 12.2) lampPts.push([x, z]); } });
  const LN = lampPts.length, ironM = new THREE.MeshStandardMaterial({ color: 0x22282b, metalness: 0.7, roughness: 0.35 });
  const poleG = mergeGeos([new THREE.CylinderGeometry(0.05, 0.075, 3.9, 10).translate(0, 1.95, 0), new THREE.CylinderGeometry(0.13, 0.16, 0.5, 12).translate(0, 0.25, 0), new THREE.CylinderGeometry(0.2, 0.06, 0.12, 14).translate(0, 4.32, 0), new THREE.ConeGeometry(0.24, 0.2, 14).translate(0, 4.5, 0)]);
  const poles = new THREE.InstancedMesh(poleG, ironM, LN), lens = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.11, 0.36, 14).translate(0, 4.08, 0), new THREE.MeshStandardMaterial({ color: 0xf3efe2, emissive: 0x000000, roughness: 0.2 }), LN);
  FX.lampLens = lens.material;
  lampPts.forEach(([x, z], i) => { tmp.makeTranslation(x, 0, z); poles.setMatrixAt(i, tmp); lens.setMatrixAt(i, tmp); CAMPUS.circles.push([x, z, 0.14, "lamp"]); blobs.push([x, z, 0.9, 0.9, 0]); });
  poles.castShadow = true; world.add(poles, lens);
  const glowTex = ctex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,226,170,1)"); r.addColorStop(0.25, "rgba(255,210,140,0.45)"); r.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  { const p = new Float32Array(LN * 3); lampPts.forEach(([x, z], i) => p.set([x, 4.05, z], i * 3)); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    FX.lampGlow = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.6, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); FX.lampGlow.visible = false; world.add(FX.lampGlow);
    FX.lampPools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }), LN);
    lampPts.forEach(([x, z], i) => { tmp.compose(V(x, 0.05, z), new THREE.Quaternion(), V(7, 1, 7)); FX.lampPools.setMatrixAt(i, tmp); }); FX.lampPools.visible = false; FX.lampPools.renderOrder = 3; world.add(FX.lampPools); }
}
