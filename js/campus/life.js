/* js/campus/life.js — Birds, butterflies, pollen and fireflies.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// birds, butterflies, pollen, fireflies
function buildLife() {
  /* ---- life: birds, butterflies, pollen, fireflies ---- */
  const wingG = new THREE.BufferGeometry(); wingG.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0.55, 0.05, -0.18, 0.15, 0, 0.22]), 3)); wingG.computeVertexNormals();
  const birdM = new THREE.MeshBasicMaterial({ color: 0x2b3136, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) { const g = new THREE.Group(), l = new THREE.Mesh(wingG, birdM), r = new THREE.Mesh(wingG, birdM); r.scale.x = -1; g.add(l, r); g.userData = { r: 18 + rnd() * 26, y: 22 + rnd() * 16, sp: 0.12 + rnd() * 0.1, ph: rnd() * 6.283, cx: (rnd() - 0.5) * 40, cz: (rnd() - 0.5) * 40, l, rw: r }; world.add(g); FX.birds.push(g); }
  const bfCols = ["#f2b134", "#ffffff", "#4f8fd8", "#e8743b"];
  for (let i = 0; i < 12; i++) {
    const t = ctex(64, 64, (g, w) => { g.fillStyle = bfCols[i % bfCols.length]; g.beginPath(); g.ellipse(w * 0.55, w * 0.38, w * 0.4, w * 0.3, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.5, w * 0.72, w * 0.26, w * 0.2, 0.3, 0, 7); g.fill(); g.fillStyle = "rgba(0,0,0,0.5)"; g.beginPath(); g.arc(w * 0.62, w * 0.36, w * 0.06, 0, 7); g.fill(); });
    const wm = new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, alphaTest: 0.3 }), wg = new THREE.PlaneGeometry(0.12, 0.12).translate(0.06, 0, 0);
    const g = new THREE.Group(), a = new THREE.Mesh(wg, wm), b = new THREE.Mesh(wg, wm); b.scale.x = -1; g.add(a, b);
    const bed = (22.5 + (i % 8) * 45) * Math.PI / 180; g.userData = { cx: Math.cos(bed) * 6.7, cz: Math.sin(bed) * 6.7, ph: rnd() * 6.283, sp: 0.6 + rnd() * 0.5, a, b }; world.add(g); FX.butterflies.push(g);
  }
  { const N = 260, p = new Float32Array(N * 3); for (let i = 0; i < N; i++) p.set([Math.random() * 30, Math.random() * 6, Math.random() * 30], i * 3); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    FX.motes = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.035, map: dotTex, color: 0xfff6dc, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); FX.motes.frustumCulled = false; FX.motes.userData.base = p.slice(); world.add(FX.motes); }
  { const N = 90, p = new Float32Array(N * 3), c = new Float32Array(N * 3); FX.flySeeds = []; for (let i = 0; i < N; i++) { const a = rnd() * 6.283, r = 6 + rnd() * 9; FX.flySeeds.push([-30 + Math.cos(a) * r, 0.4 + rnd() * 1.4, 30 + Math.sin(a) * r, rnd() * 6.283]); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    FX.fireflies = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.12, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); FX.fireflies.frustumCulled = false; FX.fireflies.visible = false; world.add(FX.fireflies); }
}
