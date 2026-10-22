/* js/lab/effects.js — Distillation vapor particles and Particle mode (the lab turning into a double helix).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Distillation vapor (CPU-driven particles) ---------- */
const dotTex = tex((g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,0.9)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, w, w);
}, 32, 32);
vapor = new THREE.Points(vapGeo, new THREE.PointsMaterial({ size: 0.035, map: dotTex, color: 0xeaf7ff, transparent: true, opacity: 0.8, depthWrite: false, sizeAttenuation: true }));
vapor.frustumCulled = false; lab.add(vapor);
updateDistill(0, 0);

/* ---------- Particle mode: lab point cloud morphs into a double helix (GPU shader) ---------- */
let P = null, pMode = false, pTarget = 0;
const pointerNDC = new THREE.Vector2(9, 9);
let pointerIn = false;
function sampleLab(N) {
  lab.updateMatrixWorld(true);
  const tris = [], weights = [], cols = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  lab.traverse(o => {
    if (!o.isMesh || o.material === glass || o.material === smoked || o.userData.noSample) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = g.attributes.position, mw = o.matrixWorld, local = [];
    let area = 0;
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i).applyMatrix4(mw); b.fromBufferAttribute(p, i + 1).applyMatrix4(mw); c.fromBufferAttribute(p, i + 2).applyMatrix4(mw);
      const ar = e1.subVectors(b, a).cross(e2.subVectors(c, a)).length() * 0.5;
      if (ar < 1e-7) continue;
      local.push([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, ar]); area += ar;
    }
    if (!area) return;
    const f = Math.pow(area, -0.45), col = o.material.color;
    local.forEach(t => { tris.push(t); weights.push(t[9] * f); cols.push(col); });
  });
  const cum = new Float32Array(weights.length); let tot = 0;
  weights.forEach((w, i) => { tot += w; cum[i] = tot; });
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let n = 0; n < N; n++) {
    const r = Math.random() * tot; let lo = 0, hi = cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; }
    const t = tris[lo]; let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    pos[n * 3] = t[0] * w + t[3] * u + t[6] * v;
    pos[n * 3 + 1] = t[1] * w + t[4] * u + t[7] * v;
    pos[n * 3 + 2] = t[2] * w + t[5] * u + t[8] * v;
    const cc = cols[lo]; col[n * 3] = cc.r; col[n * 3 + 1] = cc.g; col[n * 3 + 2] = cc.b;
  }
  return { pos, col };
}
// Caffeine (1,3,7-trimethylxanthine, C8H10N4O2) as a ball-and-stick point cloud
function moleculeTargets(N) {
  const A = {
    N1: [-1.212, 0.7, 0, "N"], C2: [-1.212, -0.7, 0, "C"], N3: [0, -1.4, 0, "N"], C4: [1.212, -0.7, 0, "C"],
    C5: [1.212, 0.7, 0, "C"], C6: [0, 1.4, 0, "C"], N7: [2.543, 1.133, 0, "N"], C8: [3.366, 0, 0, "C"], N9: [2.543, -1.133, 0, "N"],
    O2: [-2.268, -1.31, 0, "O"], O6: [0, 2.62, 0, "O"],
    M1: [-2.47, 1.43, 0, "C"], M3: [0, -2.87, 0, "C"], M7: [2.99, 2.52, 0, "C"], H8: [4.45, 0, 0, "H"]
  };
  const bonds = [["N1","C2",1],["C2","N3",1],["N3","C4",1],["C4","C5",2],["C5","C6",1],["C6","N1",1],["C5","N7",1],["N7","C8",1],["C8","N9",2],["N9","C4",1],
                 ["C2","O2",2],["C6","O6",2],["N1","M1",1],["N3","M3",1],["N7","M7",1],["C8","H8",1]];
  [["M1","N1"],["M3","N3"],["M7","N7"]].forEach(([m, n]) => {
    const dx = A[m][0] - A[n][0], dy = A[m][1] - A[n][1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux;
    for (let j = 0; j < 3; j++) {
      const th = j * 2 * Math.PI / 3 + Math.PI / 2, id = m + "H" + j;
      A[id] = [A[m][0] + ux * 0.36 + px * Math.cos(th) * 1.03, A[m][1] + uy * 0.36 + py * Math.cos(th) * 1.03, Math.sin(th) * 1.03, "H"];
      bonds.push([m, id, 1]);
    }
  });
  const RAD = { C: 0.46, N: 0.46, O: 0.46, H: 0.3 };
  const COL = { C: [0.42, 0.46, 0.52], N: [0.18, 0.42, 1.0], O: [1.0, 0.24, 0.24], H: [0.8, 0.85, 0.9] };
  const ids = Object.keys(A);
  let cx = 0, cy = 0; ids.forEach(k => { cx += A[k][0]; cy += A[k][1]; }); cx /= ids.length; cy /= ids.length;
  const S = 0.66;
  const atomW = ids.map(k => RAD[A[k][3]] ** 2), atomTot = atomW.reduce((a, b) => a + b, 0);
  const bondW = bonds.map(b => Math.hypot(A[b[0]][0] - A[b[1]][0], A[b[0]][1] - A[b[1]][1], A[b[0]][2] - A[b[1]][2]) * b[2]), bondTot = bondW.reduce((a, b) => a + b, 0);
  function pickW(w, tot) { let r = Math.random() * tot; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; }
  const tgt = new Float32Array(N * 3), col = new Float32Array(N * 3), rnd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let x, y, z, cc;
    if (Math.random() < 0.72) {
      const a = A[ids[pickW(atomW, atomTot)]], r = RAD[a[3]] * (0.82 + 0.18 * Math.random());
      const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      x = a[0] + r * s * Math.cos(ph); y = a[1] + r * s * Math.sin(ph); z = a[2] + r * u;
      cc = COL[a[3]];
    } else {
      const b = bonds[pickW(bondW, bondTot)], a0 = A[b[0]], a1 = A[b[1]];
      const t = Math.random();
      const dx = a1[0] - a0[0], dy = a1[1] - a0[1], dz = a1[2] - a0[2], L = Math.hypot(dx, dy, dz);
      let ox = 0, oy = 0;
      if (b[2] === 2) { const side = Math.random() < 0.5 ? -1 : 1; ox = -dy / L * 0.13 * side; oy = dx / L * 0.13 * side; }
      const jr = 0.08 * Math.sqrt(Math.random()), ja = Math.random() * Math.PI * 2;
      x = a0[0] + dx * t + ox + Math.cos(ja) * jr * 0.7; y = a0[1] + dy * t + oy + Math.sin(ja) * jr * 0.7; z = a0[2] + dz * t + (Math.random() - 0.5) * 0.12;
      cc = COL[(t < 0.5 ? a0 : a1)[3]];
    }
    tgt[i * 3] = (x - cx) * S; tgt[i * 3 + 1] = (y - cy) * S; tgt[i * 3 + 2] = z * S;
    col[i * 3] = cc[0]; col[i * 3 + 1] = cc[1]; col[i * 3 + 2] = cc[2];
    rnd[i] = Math.random();
  }
  return { tgt, col, rnd };
}
function ensureParticles() {
  if (P) return P;
  const N = window.innerWidth < 700 ? 15000 : 28000;
  const s = sampleLab(N), h = moleculeTargets(N);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(s.pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(s.col, 3));
  geo.setAttribute("aTarget", new THREE.BufferAttribute(h.tgt, 3));
  geo.setAttribute("aColor2", new THREE.BufferAttribute(h.col, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(h.rnd, 1));
  const uniforms = {
    uMix: { value: 0 }, uTime: { value: 0 }, uSize: { value: 0.14 },
    uPR: { value: renderer.getPixelRatio() }, uCenter: { value: new THREE.Vector3(-0.2, 2.6, -0.2) },
    uRayO: { value: new THREE.Vector3() }, uRayD: { value: new THREE.Vector3(0, -1, 0) }, uRepel: { value: 0 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec3 aColor; attribute vec3 aTarget; attribute vec3 aColor2; attribute float aRand;
      uniform float uMix, uTime, uSize, uPR, uRepel; uniform vec3 uCenter, uRayO, uRayD;
      varying vec3 vColor; varying float vGlow;
      void main() {
        float m = clamp(uMix * 1.5 - aRand * 0.5, 0.0, 1.0);
        m = m * m * (3.0 - 2.0 * m);
        float a = uTime * 0.35;
        vec3 t = aTarget;
        t.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * t.xz;
        t.y += sin(uTime * 0.8 + aTarget.y) * 0.05;
        t += uCenter;
        vec3 p = mix(position, t, m);
        float swirl = sin(3.14159 * m);
        p += vec3(sin(uTime * 1.3 + aRand * 40.0), cos(uTime * 1.1 + aRand * 25.0), sin(uTime * 0.9 + aRand * 60.0)) * 0.9 * swirl;
        vec3 w = p - uRayO;
        vec3 closest = uRayO + uRayD * dot(w, uRayD);
        vec3 away = p - closest;
        float d = length(away);
        float f = smoothstep(1.0, 0.0, d) * uRepel;
        p += (away / max(d, 0.0001)) * f * 0.9;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (1.0 + m * 0.7 + f * 1.5) * (300.0 / -mv.z);
        vColor = mix(pow(aColor, vec3(0.4545)), aColor2, m);
        vGlow = f;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vGlow;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(mix(vColor, vec3(1.0), vGlow * 0.5), alpha);
      }`
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false; points.visible = false; scene.add(points);
  document.getElementById("capCount").textContent = " · " + N.toLocaleString();
  P = { points, uniforms };
  return P;
}
const particleBtn = document.getElementById("particleBtn");
const caption = document.getElementById("caption");
function setParticleMode(on) {
  if (on === pMode) return;
  const p = ensureParticles();
  pMode = on;
  if (on) {
    closeSheet(true);
    setHover(null);
    lab.visible = false; p.points.visible = true;
  }
  pTarget = on ? 1 : 0;
  particleBtn.textContent = on ? "Back to lab" : "Particles";
  levelBtn.disabled = on;
  particleBtn.setAttribute("aria-pressed", String(on));
  caption.hidden = !on; hint.hidden = on;
  labelsEl.hidden = on;
}
particleBtn.addEventListener("click", () => setParticleMode(!pMode));
