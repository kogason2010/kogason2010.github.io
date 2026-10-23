/* js/campus/water.js — Reflective pond with lily pads and reeds; fountain with basin, bowls and spray.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// pond and fountain
function buildWater() {
  /* ---- water: a reflective pond and a fountain with a jet, a falling curtain and splashes ---- */
  const wc = canvasOf(256, 256), wcg = wc.getContext("2d"), wimg = wcg.createImageData(256, 256), waves = Array.from({ length: 9 }, () => [((Math.random() * 7) | 0) + 1, ((Math.random() * 7) | 0) - 3, Math.random() * 6.28, 0.4 + Math.random() * 0.6]);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { let hgt = 0; waves.forEach(([kx, ky, ph, a]) => { hgt += a * Math.sin((kx * x + ky * y) / 256 * 6.283 + ph); }); const v = (hgt / 9 * 0.5 + 0.5) * 255, i = (y * 256 + x) * 4; wimg.data[i] = wimg.data[i + 1] = wimg.data[i + 2] = v; wimg.data[i + 3] = 255; }
  wcg.putImageData(wimg, 0, 0);
  const waterN = normalFrom(wc, 3);
  flat(new THREE.CircleGeometry(8.9, 64), mat(0xc9b88f, { roughness: 1 }), -30, 0.014, 30);
  flat(new THREE.RingGeometry(9.6, 11.2, 72), new THREE.MeshStandardMaterial({ ...setRepeat(pathSet, 6, 1), roughness: 0.9 }), -30, 0.016, 30);
  if (THREE.Water && !COARSE) {
    FX.pond = new THREE.Water(new THREE.CircleGeometry(8.1, 64), { textureWidth: 256, textureHeight: 256, waterNormals: waterN, sunDirection: SUN_DIR.clone(), sunColor: 0xffffff, waterColor: 0x1e4c58, distortionScale: 1.4, fog: true, alpha: 1.0 });
    FX.pond.material.uniforms.size.value = 5.5; FX.pond.rotation.x = -Math.PI / 2; FX.pond.position.set(-30, 0.05, 30); world.add(FX.pond);
    const reflect = FX.pond.onBeforeRender; FX.pond.onBeforeRender = function (...a) {
      const gv = FX.grass.visible, saved = FX.chunks.map(ch => ch.meshes[0].visible), cast = FX.chunks.map(ch => ch.meshes[0].castShadow);
      FX.grass.visible = false; FX.chunks.forEach(ch => { const v = !ch.far && Math.hypot(ch.sphere.center.x + 30, ch.sphere.center.z - 30) < 30 + ch.sphere.radius; ch.meshes.forEach(m => { m.visible = v; }); });
      reflect.apply(this, a);
      FX.grass.visible = gv; FX.chunks.forEach((ch, i) => ch.meshes.forEach(m => { m.visible = saved[i]; m.castShadow = cast[i]; }));
    };
  } else {
    const pw = waterN.clone(); pw.needsUpdate = true; pw.repeat.set(3, 3);
    flat(new THREE.CircleGeometry(8.1, 64), new THREE.MeshStandardMaterial({ color: 0x2a6476, roughness: 0.05, metalness: 0.2, normalMap: pw, normalScale: new THREE.Vector2(0.5, 0.5) }), -30, 0.05, 30);
  }
  CAMPUS.ponds.push([-30, 30, 8]); CAMPUS.circles.push([-30, 30, 8.25, "pond"]);
  const padMat = mat(0x4f8f3e, { roughness: 0.55 }), flowerPad = mat(0xf3d6e4, { roughness: 0.5 });
  for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, r = 1.8 + rnd() * 5.4, x = -30 + Math.cos(a) * r, z = 30 + Math.sin(a) * r; flat(new THREE.CircleGeometry(0.26 + rnd() * 0.2, 14, 0.35, 5.7), padMat, x, 0.07, z).rotation.z = rnd() * 6.28; if (i % 4 === 0) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.08, 7), flowerPad); f.position.set(x, 0.1, z); world.add(f); } }
  const reedGeo = new THREE.ConeGeometry(0.02, 1, 4); reedGeo.translate(0, 0.5, 0); paint(reedGeo, (x, y, z, c) => c.setRGB(0.06 + y * 0.14, 0.1 + y * 0.14, 0.03 + y * 0.03));
  const reeds = new THREE.InstancedMesh(reedGeo, windy(new THREE.MeshLambertMaterial({ vertexColors: true }), 0.06, 0.2), 420), rm = new THREE.Matrix4();
  // reeds grow in clumps round the edge, not an even fence: 16 clumps of varied size, gaps between them
  const clumps = Array.from({ length: 16 }, (_, k) => ({ a: (k + rnd() * 0.6) / 16 * 6.283, n: 0.4 + rnd() * 1.2, h: 0.6 + rnd() * 0.7 }));
  for (let i = 0; i < 420; i++) { const cl = clumps[i % 16], a = cl.a + (rnd() - 0.5) * 0.26 * cl.n, r = 7.55 + Math.pow(rnd(), 1.5) * 1.0, s = (0.3 + rnd() * 0.75) * cl.h * (1 - Math.abs(a - cl.a) * 1.6); rm.compose(V(-30 + Math.cos(a) * r, 0, 30 + Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.25, 0, (rnd() - 0.5) * 0.25)), V(1, s, 1)); reeds.setMatrixAt(i, rm); }
  reeds.castShadow = true; world.add(reeds);
  const stone = new THREE.MeshStandardMaterial({ color: 0xe1dbcf, roughness: 0.7 });
  const basin = new THREE.Mesh(new THREE.LatheGeometry([[3.86, 0], [3.86, 0.06], [3.74, 0.12], [3.72, 0.52], [3.28, 0.52], [3.28, 0.12]].map(p => new THREE.Vector2(p[0], p[1])), 96), new THREE.MeshStandardMaterial({ color: 0xe1dbcf, roughness: 0.7, side: THREE.DoubleSide }));
  basin.castShadow = basin.receiveShadow = true; world.add(basin);
  flat(new THREE.CircleGeometry(3.3, 72), mat(0x5d7f8a, { roughness: 0.8 }), 0, 0.12, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.24, 10, 96), stone); rim.rotation.x = Math.PI / 2; rim.position.y = 0.54; rim.scale.z = 0.45; rim.castShadow = rim.receiveShadow = true; world.add(rim);
  const bn = waterN.clone(); bn.needsUpdate = true; bn.repeat.set(2.5, 2.5); FX.basinN = bn;
  FX.basinMat = new THREE.MeshStandardMaterial({ color: 0x2b6f8c, roughness: 0.04, metalness: 0.15, normalMap: bn, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.93 });
  flat(new THREE.CircleGeometry(3.3, 72), FX.basinMat, 0, 0.44, 0);
  const ped = new THREE.LatheGeometry([[0.62, 0], [0.62, 0.12], [0.42, 0.22], [0.32, 0.9], [0.4, 1.35], [0.3, 1.55], [0.2, 1.62]].map(p => new THREE.Vector2(p[0], p[1])), 28);
  const pedM = new THREE.Mesh(ped, stone); pedM.position.y = 0.44; pedM.castShadow = pedM.receiveShadow = true; world.add(pedM);
  const bowl = new THREE.LatheGeometry([[0.2, 0], [0.9, 0.08], [1.28, 0.26], [1.32, 0.34], [1.22, 0.34], [0.9, 0.22], [0.2, 0.16]].map(p => new THREE.Vector2(p[0], p[1])), 48);
  const bowlM = new THREE.Mesh(bowl, stone); bowlM.position.y = 2.06; bowlM.castShadow = bowlM.receiveShadow = true; world.add(bowlM);
  flat(new THREE.CircleGeometry(1.2, 48), FX.basinMat, 0, 2.36, 0);
  wcyl(0.08, 0.12, 0.3, stone, 0, 2.5, 0, 14);
  CAMPUS.circles.push([0, 0, 3.95, "fountain"]);
  { const JN = COARSE ? 380 : 720, g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(JN * 3), 3));
    FX.jets = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.075, map: dotTex, color: 0xeef8ff, transparent: true, opacity: 0.8, depthWrite: false })); FX.jets.frustumCulled = false; world.add(FX.jets);
    FX.jetSeeds = Array.from({ length: JN }, (_, i) => [i % 4, Math.random() * 6.283, Math.random(), 0.8 + Math.random() * 0.4]); }
}
