/* js/campus/gameplay.js — What there is to do outside: messes to clean, lost items to find, and the robot's outdoor copy.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// messes and lost things
function buildGameplay() {
  /* ---- messes to clean and lost things to find (unchanged gameplay) ---- */
  world.add(wSpotLayer);
  const kinds = ["leaves", "leaves", "coffee", "prints", "dust", "beads", "leaves", "coffee"];
  const segs = CAMPUS.paths.map(p => [p, Math.hypot(p[2] - p[0], p[3] - p[1])]), totalL = segs.reduce((a, s) => a + s[1], 0);
  for (let n = 0; n < 600 && wSpots.length < 15; n++) {
    let x, z;
    if (rnd() < 0.3) { const a = rnd() * 6.283, r = 4.6 + rnd() * 5; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    else { let t = rnd() * totalL, k = 0; while (t > segs[k][1]) { t -= segs[k][1]; k++; } const [p, L] = segs[k], f = t / L, lat = (rnd() - 0.5) * (p[4] - 1.0); x = p[0] + (p[2] - p[0]) * f - (p[3] - p[1]) / L * lat; z = p[1] + (p[3] - p[1]) * f + (p[2] - p[0]) / L * lat; }
    if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 5 || wSpots.some(s => Math.hypot(s.x - x, s.z - z) < 5) || hitAt(x, z, 0.5)) continue;
    addSpot(x, z, kinds[wSpots.length % kinds.length], false, { layer: wSpotLayer, list: wSpots, scale: 1.45, y: 0.035 });
  }
  wMessTotal = wSpots.length;
  const glass2 = new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.45, clearcoat: 1 });
  const ITEMS = [
    { id: "goggles", name: "safety goggles", x: 5.5, z: -31.6, make(g) { const fr = mat(0x3fae6a, { roughness: 0.35 }); [-0.09, 0.09].forEach(dx => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 10, 24), fr); r.position.x = dx; g.add(r); const l = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), glass2); l.position.x = dx; g.add(l); }); const s = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 24, Math.PI), mat(0x2b3136)); s.rotation.x = Math.PI / 2; s.position.z = -0.05; g.add(s); } },
    { id: "notebook", name: "lab notebook", x: -30, z: 17.85, make(g) { box(0.32, 0.045, 0.42, 0x2f5fa8, 0, 0, 0, g, { roughness: 0.6 }); box(0.3, 0.03, 0.4, 0xf4f1ea, 0.012, 0.03, 0, g); box(0.02, 0.05, 0.42, 0x23467d, -0.155, 0.005, 0, g); } },
    { id: "flask", name: "Erlenmeyer flask", x: 8.1, z: -8.25, make(g) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.16, 0.24, 24), glass2); g.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16), glass2); n.position.y = 0.17; g.add(n); const liq = cyl(0.07, 0.15, 0.1, 0x3fa7d6, 0, -0.07, 0, g, 20, { transparent: true, opacity: 0.85 }); liq.castShadow = false; } },
    { id: "mug", name: "coffee mug", x: -12.6, z: -6.1, make(g) { cyl(0.1, 0.09, 0.2, 0xc8463c, 0, 0, 0, g, 24, { roughness: 0.3 }); const h = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 18), mat(0xc8463c, { roughness: 0.3 })); h.position.x = 0.11; g.add(h); cyl(0.085, 0.085, 0.01, 0x3b2416, 0, 0.09, 0, g, 20); } },
    { id: "duck", name: "rubber duck", x: 35.9, z: 26.6, make(g) { const y = mat(0xf7c531, { roughness: 0.3 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), y); b.scale.set(1.25, 0.85, 1); g.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), y); hd.position.set(0.12, 0.14, 0); g.add(hd); const bk = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 10), mat(0xf08a24)); bk.rotation.z = -Math.PI / 2; bk.position.set(0.24, 0.13, 0); g.add(bk); [-0.05, 0.05].forEach(dz => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), mat(0x1b1f22)); e.position.set(0.19, 0.18, dz); g.add(e); }); } },
  ];
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.6, depthWrite: false });
  ITEMS.forEach(it => {
    const g = new THREE.Group(); it.make(g); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.position.set(it.x, 0.34, it.z); world.add(g);
    const ring = flat(new THREE.RingGeometry(0.34, 0.42, 32), ringMat.clone(), it.x, 0.04, it.z);
    finds.push({ ...it, g, ring, found: false, hint: [it.x + (rnd() - 0.5) * 8, it.z + (rnd() - 0.5) * 8] });
  });
  burstRing = flat(new THREE.RingGeometry(0.3, 0.38, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), 0, 0.05, 0); burstRing.visible = false; burstRing.userData.t = 0;
}

// the robot, borrowed from the lab
function buildRobot() {
  /* ---- the robot, borrowed from the lab ---- */
  wbot = bot.clone(true); world.add(wbot);
  wBrush = wbot.children[bot.children.indexOf(brush)]; wTurret = wbot.children[bot.children.indexOf(turret)];
  wLightMat = new THREE.MeshBasicMaterial({ color: 0x3fe0d0 }); wbot.traverse(o => { if (o.material === botLight) o.material = wLightMat; });
  headlight = new THREE.SpotLight(0xfff1d6, 0, 18, 0.55, 0.6, 1.4); headlight.position.set(0.2, 0.14, 0); wbot.add(headlight);
  const hlT = new THREE.Object3D(); hlT.position.set(4, -0.2, 0); wbot.add(hlT); headlight.target = hlT;
}
