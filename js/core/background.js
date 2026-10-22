/* js/core/background.js — Floating molecules behind the diorama.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Background: slow floating molecules around the diorama ---------- */
const bgGroup = new THREE.Group(); scene.add(bgGroup);
const hexTex = tex((g, w) => {
  const r = w * 0.3, pts = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push([w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r]); }
  g.strokeStyle = "#fff"; g.lineWidth = 6; g.lineJoin = "round"; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.arc(w / 2, w / 2, r * 0.55, 0, 7); g.stroke();
  g.fillStyle = "#fff"; pts.forEach(p => { g.beginPath(); g.arc(p[0], p[1], 8, 0, 7); g.fill(); });
}, 128, 128);
const glowTex = tex((g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.6)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); }, 64, 64);
const BG_COLS = [0x63d3ff, 0x4fd1b8, 0xb48cff, 0xffb24a, 0x7aa2ff].map(c => new THREE.Color(c));
const viewDir = HOME.clone().sub(TARGET).normalize();
function bgCloud(n, size, map, opacity) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), base = new Float32Array(n * 3), ph = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    do { v.set(-24 + Math.random() * 34, -9 + Math.random() * 22, -24 + Math.random() * 34); }
    while ((Math.abs(v.x) < 5.2 && Math.abs(v.z) < 5.2 && v.y > -1.5 && v.y < 6.5) || v.clone().sub(TARGET).dot(viewDir) > 1.5);
    base.set([v.x, v.y, v.z], i * 3); pos.set([v.x, v.y, v.z], i * 3); ph[i] = Math.random() * 6.28;
    const c = BG_COLS[i % BG_COLS.length]; col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map, vertexColors: true, transparent: true, opacity, depthWrite: false, sizeAttenuation: true }));
  pts.frustumCulled = false; bgGroup.add(pts);
  return { geo, pos, base, ph, n };
}
const bgHex = bgCloud(70, 1.1, hexTex, 0.5), bgDots = bgCloud(240, 0.35, glowTex, 0.55);
function updateBg(time) {
  [bgHex, bgDots].forEach((c, k) => {
    for (let i = 0; i < c.n; i++) {
      const j = i * 3, p = c.ph[i];
      c.pos[j] = c.base[j] + Math.sin(time * 0.11 + p) * 0.6;
      c.pos[j + 1] = c.base[j + 1] + Math.sin(time * (0.22 + k * 0.1) + p * 1.3) * (0.8 + k * 0.3);
      c.pos[j + 2] = c.base[j + 2] + Math.cos(time * 0.09 + p) * 0.6;
    }
    c.geo.attributes.position.needsUpdate = true;
  });
}

lab.updateMatrixWorld(true);
{ const ab = new THREE.Box3(), ac = new THREE.Vector3();
  hotspots.forEach(h => { ab.setFromObject(h.focusObj || h.group); ab.getCenter(ac); h.anchor.set(ac.x, ab.max.y + 0.28, ac.z); });
  // the workstation's tag sits at keyboard level so it doesn't collide with the Nexera IC tag above it
  hotspots.find(h => h.key === "icpc").anchor.set(BX + 0.3, BT + 0.12, pcZ - 0.05); }
