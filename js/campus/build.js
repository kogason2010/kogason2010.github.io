/* js/campus/build.js — Builds the whole campus the first time you step outside, in this order (later parts rely on earlier ones:
   trees avoid paths and buildings, lamps avoid trees, the grass mask needs everything), then merges static meshes.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

function buildWorld() {
  worldBuilt = true;
  rnd = seeded(20261019);
  blobTex = ctex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(20,30,20,0.55)"); r.addColorStop(0.55, "rgba(20,30,20,0.25)"); r.addColorStop(1, "rgba(20,30,20,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  buildSky(); buildGround(); buildPaths(); buildWater(); buildPlaza();
  buildBuildings(); buildCafe(); buildParking(); buildSculpture();
  buildTrees(); buildShrubsAndHedge(); buildLamps(); buildContactShadows();
  buildGrass(); buildLife(); buildGameplay();
  world.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; if (o.material && o.material.isMeshStandardMaterial && !FX.windowMats.includes(o.material)) o.material.envMapIntensity = o.material.userData.env || 0.55; });
  buildRobot();
  mergeStatic(FX.dna, new Set()); mergeStatic(world, new Set([FX.dna, wbot, wSpotShadow, burstRing, FX.pond, FX.sky, FX.nightDome, FX.grass, wSpotLayer, ...finds.map(f => f.g), ...finds.map(f => f.ring), ...FX.birds, ...FX.butterflies]));
}
// hundreds of small static meshes (benches, car parts, steps, poles) become a handful of merged ones: far fewer draw calls
function mergeStatic(root, keep) {
  const live = new Set([...FX.windowMats, ...FX.carLights, ...(FX.carLamps || []), FX.lampLens, FX.basinMat]);
  const id = t => (t ? t.uuid : "");
  const key = (o, m) => live.has(m) ? m.uuid : [m.type, m.color && m.color.getHex(), m.roughness, m.metalness, id(m.map), id(m.normalMap), id(m.roughnessMap), id(m.metalnessMap), id(m.emissiveMap), m.emissive && m.emissive.getHex(),
    m.transparent, m.opacity, m.side, m.vertexColors, m.flatShading, m.envMapIntensity, m.alphaTest, m.depthWrite, m.clearcoat, m.toneMapped, o.castShadow, o.receiveShadow, o.renderOrder].join("|");
  const groups = new Map(), victims = [];
  const walk = o => {
    if (keep.has(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !o.userData.keep && !o.onBeforeRender.toString().includes("reflect") && !Array.isArray(o.material) && !o.material.onBeforeCompile.toString().includes("uWind")) {
      const names = Object.keys(o.geometry.attributes);
      if (names.every(n => n === "position" || n === "normal" || n === "uv") && names.includes("normal") && !o.material.isShaderMaterial) {
        const k = key(o, o.material); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); victims.push(o);
      }
    }
    o.children.slice().forEach(walk);
  };
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(); root.children.slice().forEach(walk);
  let merged = 0;
  groups.forEach(list => {
    if (list.length < 2) return;
    let n = 0; const parts = list.map(o => { const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); n += g.attributes.position.count; return g; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let off = 0;
    parts.forEach(g => { const c = g.attributes.position.count; pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, off * 2); off += c; g.dispose(); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.renderOrder = list[0].renderOrder; if (list[0].userData.baseEmissive) m.userData.baseEmissive = list[0].userData.baseEmissive; root.add(m);
    list.forEach(o => o.parent.remove(o)); merged += list.length;
  });
  FX.merged = (FX.merged || 0) + merged;
}
function segDist(x, z, p) { const dx = p[2] - p[0], dz = p[3] - p[1], L2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / L2)); return Math.hypot(x - p[0] - dx * t, z - p[1] - dz * t); }
function hitAt(x, z, r) { return CAMPUS.circles.some(c => Math.hypot(x - c[0], z - c[1]) < c[2] + r) || CAMPUS.boxes.some(b => x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r); }
